"""Cube 8 — Stripe Payment Service.

3 pricing tiers with donation-after-results model:
  Free (max 19):      No upfront payment. Donation prompt after results CSV.
  Moderator Paid:     Moderator pays min $11.11 via Stripe Checkout. Donation after.
  Cost Split (50/50): 50% Moderator + 50%/N Users via Payment Intents. Donation after.

Donation timing: ALWAYS after results delivered, never gates access.
"""

import logging

import structlog
import uuid

import stripe
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.cubes.cube8_tokens.stripe_config import resolve_secret_key
from app.cubes.cube8_tokens.payment_idempotency import stripe_idempotency_key, new_attempt_nonce
from app.cubes.cube8_tokens import poll_pricing, stripe_catalog
from app.cubes.cube8_tokens.payment_product import product_line_for
import json
from app.models.payment import PaymentTransaction
from app.models.session import Session
from app.models.participant import Participant

logger = structlog.get_logger(__name__)  # keyword fields need structlog; stdlib raised TypeError

# Configure Stripe from the ENVIRONMENT-resolved key (prefers restricted/RAK + live in
# production; never a repo-committed key). Single source of truth = stripe_config.resolve_secret_key.
stripe.api_key = resolve_secret_key()

DONATION_TX_TYPES = frozenset({"donation", "divinity_guide_donation", "derisking_strategies_donation"})

# Minimum Moderator fee in cents ($11.11)
MODERATOR_MIN_FEE_CENTS = 1111
STRIPE_MIN_CENTS = 50


# ---------------------------------------------------------------------------
# Cost Estimation
# ---------------------------------------------------------------------------


async def estimate_session_cost(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Estimate session cost based on # users and # responses.

    Returns cost breakdown for UX display and donation anchoring.
    """
    session = await _get_session(db, session_id)

    # Count participants
    result = await db.execute(
        select(func.count(Participant.id)).where(
            Participant.session_id == session_id,
            Participant.is_active.is_(True),
        )
    )
    user_count = result.scalar_one()

    # Base cost: $0.05 per user + $0.01 per response (AI processing)
    # This is a simplified estimate — production would factor in actual AI API costs
    from app.models.response_meta import ResponseMeta
    resp_result = await db.execute(
        select(func.count(ResponseMeta.id)).where(
            ResponseMeta.session_id == session_id,
        )
    )
    response_count = resp_result.scalar_one()

    base_cost_cents = (user_count * 5) + (response_count * 1)
    # Floor at $1.00, cap at $100.00 for estimates
    estimated_cents = max(100, min(base_cost_cents, 10000))

    return {
        "session_id": str(session_id),
        "user_count": user_count,
        "response_count": response_count,
        "estimated_cost_cents": estimated_cents,
        "currency": "USD",
        "breakdown": {
            "per_user_cents": 5,
            "per_response_cents": 1,
            "base_cost_cents": base_cost_cents,
        },
    }


async def estimate_metered_cost(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Cost of a session's ACTUAL metered usage (◬ + USD), from the usage-metering stream.

    Distinct from `estimate_session_cost` (an upfront per-user/per-response quote): this
    prices what the session really consumed — webhook deliveries, exports, AI inference,
    API calls — via the authoritative ◬ price table. The "pay for what you used" number.
    """
    from app.core import usage_service

    session = await _get_session(db, session_id)
    # Org isolation is v1 per-user: the session owner IS the org.
    summary = await usage_service.summarize_usage(
        db, org_id=session.created_by, session_id=session_id
    )
    cost = summary["cost"]
    return {
        "session_id": str(session_id),
        "billable_tokens": cost["billable_tokens"],
        "estimated_usd": cost["estimated_usd"],
        "estimated_cost_cents": max(0, round(cost["estimated_usd"] * 100)),
        "currency": "USD",
        "by_metric": cost["by_metric"],
    }


async def create_usage_billing_checkout(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: str,
    success_url: str = "",
    cancel_url: str = "",
) -> dict:
    """Stripe Checkout for a session's ACTUAL metered ◬ usage (pay-for-what-you-used).

    Bridges the usage-metering stream → billing: the amount is the metered ◬ estimate
    converted to USD, not a flat upfront quote. Verifies session ownership. Floors at
    $0.50 (Stripe minimum). Records a `usage_billing` transaction the webhook completes.
    """
    session = await _get_session(db, session_id)

    if session.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the session creator can be billed for its usage",
        )

    metered = await estimate_metered_cost(db, session_id)
    amount_cents = max(metered["estimated_cost_cents"], 50)  # Stripe minimum $0.50

    idem_key = stripe_idempotency_key(
        action="checkout_usage_billing",
        session_id=str(session_id),
        amount_cents=amount_cents,
        transaction_type="usage_billing",
        nonce=new_attempt_nonce(),
    )
    checkout = stripe.checkout.Session.create(
        line_items=[{
            "price_data": {
                "currency": "usd",
                "unit_amount": amount_cents,
                "product_data": {
                    "name": f"SoI Metered Usage: {session.title}",
                    "description": (
                        f"Session {session.short_code} — {metered['billable_tokens']} ◬ metered usage"
                    ),
                },
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url or f"{settings.frontend_url}/dashboard?session={session.short_code}&payment=success",
        cancel_url=cancel_url or f"{settings.frontend_url}/dashboard?session={session.short_code}&payment=cancelled",
        metadata={
            "session_id": str(session_id),
            "short_code": session.short_code,
            "transaction_type": "usage_billing",
            "billable_tokens": str(metered["billable_tokens"]),
        },
        idempotency_key=idem_key,
    )

    tx = PaymentTransaction(
        session_id=session_id,
        transaction_type="usage_billing",
        amount_cents=amount_cents,
        currency="USD",
        stripe_checkout_session_id=checkout.id,
        status="pending",
    )
    db.add(tx)
    await db.commit()

    logger.info(
        "cube8.payment.usage_billing_checkout_created",
        extra={
            "session_id": str(session_id),
            "amount_cents": amount_cents,
            "billable_tokens": metered["billable_tokens"],
            "checkout_id": checkout.id,
        },
    )

    return {
        "checkout_url": checkout.url,
        "checkout_id": checkout.id,
        "amount_cents": amount_cents,
        "billable_tokens": metered["billable_tokens"],
    }


# ---------------------------------------------------------------------------
# Moderator Paid — Stripe Checkout Session
# ---------------------------------------------------------------------------


async def create_moderator_checkout(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: str,
    amount_cents: int | None = None,
    success_url: str = "",
    cancel_url: str = "",
    participants: int | None = None,
    options: list[str] | None = None,
    voice_share: float | None = None,
    client_key: str | None = None,
) -> dict:
    """Stripe Checkout for the poll creator, priced from the poll's chosen options.

    Moderator Paid → creator pays the full quote (≥ $11.11; may pay more).
    Cost Split     → creator pays 50% of the quote now; participants split the rest (cost-split intents).
    The amount is computed SERVER-SIDE from the stored session (poll_pricing.quote_for_session) — a client can
    raise it (Moderator Paid) but never lower it. Only the session creator can pay.
    """
    session = await _get_session(db, session_id)

    if session.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the session creator can initiate payment",
        )
    tier = session.pricing_tier or "free"
    if tier not in ("moderator_paid", "cost_split"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session pricing tier is not 'moderator_paid' or 'cost_split'",
        )
    if session.is_paid is True:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This poll is already paid")

    quote = poll_pricing.quote_for_session(session, participants=participants, options=options, voice_share=voice_share)
    due = int(quote["creator_due_cents"])
    if tier == "moderator_paid":
        final_amount = max(int(amount_cents or 0), due, MODERATOR_MIN_FEE_CENTS)
        tx_type, line = "moderator_fee", "poll_moderator_paid"
    else:
        final_amount = max(due, STRIPE_MIN_CENTS)
        tx_type, line = "cost_split", "poll_cost_split_moderator"

    idem_key = stripe_idempotency_key(
        action="checkout_poll_creator",
        session_id=str(session_id),
        amount_cents=final_amount,
        transaction_type=tx_type,
        nonce=client_key or new_attempt_nonce(),
    )
    base = f"{settings.frontend_url}/dashboard?session={session.short_code}"
    ok_url = success_url or f"{base}&payment=success"
    ok_url = ok_url if "{CHECKOUT_SESSION_ID}" in ok_url else ok_url + ("&" if "?" in ok_url else "?") + "cs={CHECKOUT_SESSION_ID}"
    metadata = {
        "session_id": str(session_id),
        "short_code": session.short_code,
        "transaction_type": tx_type,
        "product_line": product_line_for(tx_type),
        "pricing_tier": tier,
        "poll_options": ",".join(quote["options"])[:400],
        "participants": str(quote["participants"]),
        "tracked_cost_usd": quote["tracked_cost_usd"],
        "margin_multiplier": quote["margin_multiplier"],
        "quote_total_cents": str(quote["total_cents"]),
        "catalog_version": quote["catalog_version"],
    }
    checkout = stripe.checkout.Session.create(
        line_items=[{
            "price_data": stripe_catalog.price_data(
                line, final_amount,
                name=f"eXeL AI Polling: {session.title}"[:120],
                description=f"Poll {session.short_code} — {tier.replace('_', ' ')}",
            ),
            "quantity": 1,
        }],
        mode="payment",
        client_reference_id=str(session_id),
        success_url=ok_url,
        cancel_url=cancel_url or f"{base}&payment=cancelled",
        metadata=metadata,
        payment_intent_data={"metadata": metadata, "description": f"eXeL AI Polling — poll {session.short_code} ({tier})"},
        idempotency_key=idem_key,
    )

    # Idempotent replay (same client_key) returns the same Checkout id — reuse its pending row.
    existing = (await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.stripe_checkout_session_id == checkout.id)
    )).scalar_one_or_none()
    if not isinstance(existing, PaymentTransaction):
        db.add(PaymentTransaction(
            session_id=session_id,
            transaction_type=tx_type,
            amount_cents=final_amount,
            currency="USD",
            stripe_checkout_session_id=checkout.id,
            status="pending",
            product_line=product_line_for(tx_type),
            idempotency_key=idem_key,
            reconcile_status="awaiting_webhook",
            metadata_json=json.dumps({"quote": quote}),
        ))
    session.stripe_session_id = checkout.id
    session.fee_amount_cents = final_amount
    session.estimated_cost_cents = poll_pricing._cents_ceil(poll_pricing.D(quote["tracked_cost_usd"]))
    await db.commit()

    logger.info("cube8.payment.poll_creator_checkout_created", session_id=str(session_id), tier=tier,
                amount_cents=final_amount, checkout_id=checkout.id)

    return {
        "checkout_url": checkout.url,
        "checkout_id": checkout.id,
        "amount_cents": final_amount,
        "quote": quote,
    }


# ---------------------------------------------------------------------------
# Cost Split — Payment Intents for Moderator + Users
# ---------------------------------------------------------------------------


async def cost_split_quote(db: AsyncSession, session: Session) -> dict:
    """The Cost Split quote both shares are priced from (one pricing path: poll_pricing).

    Prefers the quote frozen on the creator's cost_split Checkout row (what the creator was actually charged
    against), newest first; falls back to poll_pricing.quote_for_session for the stored session settings.
    """
    rows = (await db.execute(
        select(PaymentTransaction.metadata_json).where(
            PaymentTransaction.session_id == session.id,
            PaymentTransaction.participant_id.is_(None),
            PaymentTransaction.transaction_type == "cost_split",
            PaymentTransaction.status.in_(("completed", "pending")),
        ).order_by(PaymentTransaction.status.asc(), PaymentTransaction.created_at.desc())
    )).scalars().all()
    for raw in rows if isinstance(rows, (list, tuple)) else []:
        try:
            q = (json.loads(raw) or {}).get("quote") if isinstance(raw, str) else None
        except ValueError:
            q = None
        if isinstance(q, dict) and q.get("pricing_tier") == "cost_split" and "participant_share_cents" in q:
            return q
    return poll_pricing.quote_for_session(session)


async def create_cost_split_intent(
    db: AsyncSession,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    user_id: str,
    is_moderator: bool = False,
) -> dict:
    """Create Stripe Payment Intent for Cost Split tier.

    Moderator pays 50% of estimate. Each User pays (50% / N).
    Verifies participant belongs to session and user owns the participant.
    """
    session = await _get_session(db, session_id)

    if session.pricing_tier != "cost_split":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session pricing tier is not 'cost_split'",
        )

    # Security: verify participant belongs to session
    p_result = await db.execute(
        select(Participant).where(
            Participant.id == participant_id,
            Participant.session_id == session_id,
        )
    )
    participant = p_result.scalar_one_or_none()
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found in this session",
        )

    # Security: verify user owns this participant or is moderator
    if is_moderator:
        if session.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not session owner")
    elif participant.user_id and participant.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your participant")

    # Same pricing path as the creator's Checkout (poll_pricing: tracked cost × margin + Stripe fee, $11.11 floor):
    # the quote stored on the creator's cost_split Checkout row, else a fresh server-side quote of the session.
    quote = await cost_split_quote(db, session)
    total_cents = int(quote["total_cents"])
    n_share = int(quote["participants"])

    if is_moderator:
        if session.is_paid is True:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The creator share is already paid")
        share_cents = max(int(quote["creator_due_cents"]), STRIPE_MIN_CENTS)
        description = f"Moderator share (50%) — Session {session.short_code}"
    else:
        if participant.payment_status in ("paid", "lead_exempt"):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Your share is already paid")
        share_cents = int(quote["participant_share_cents"])
        if share_cents <= 0:
            # Share below Stripe's $0.50 minimum → the creator covers the full price; nothing is due.
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="No participant share is due for this poll — the creator covers the full price")
        description = f"User share (50%/{n_share}) — Session {session.short_code}"

    idem_key = stripe_idempotency_key(
        action="intent_cost_split",
        session_id=str(session_id),
        participant_id=str(participant_id),
        amount_cents=share_cents,
        transaction_type="cost_split",
        nonce=new_attempt_nonce(),
    )
    intent = stripe.PaymentIntent.create(
        amount=share_cents,
        currency="usd",
        metadata={
            "session_id": str(session_id),
            "participant_id": str(participant_id),
            "transaction_type": "cost_split",
            "is_moderator": str(is_moderator),
            "estimated_total_cents": str(total_cents),
            "quote_total_cents": str(total_cents),
            "margin_multiplier": str(quote["margin_multiplier"]),
            "catalog_version": str(quote["catalog_version"]),
            "product_line": "poll_cost_split_moderator" if is_moderator else "poll_cost_split_participant",
        },
        description=description,
        idempotency_key=idem_key,
    )

    # Record pending transaction
    tx = PaymentTransaction(
        session_id=session_id,
        participant_id=participant_id,
        transaction_type="cost_split",
        amount_cents=share_cents,
        currency="USD",
        stripe_payment_intent_id=intent.id,
        status="pending",
    )
    db.add(tx)
    await db.commit()

    logger.info(
        "cube8.payment.cost_split_intent_created",
        extra={
            "session_id": str(session_id),
            "participant_id": str(participant_id),
            "share_cents": share_cents,
            "is_moderator": is_moderator,
        },
    )

    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id,
        "amount_cents": share_cents,
        "estimated_total_cents": total_cents,
        "quote": quote,
    }


async def create_cost_split_share_checkout(
    db: AsyncSession,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    user_id: str,
    success_url: str = "",
    cancel_url: str = "",
    client_key: str | None = None,
) -> dict:
    """Hosted Stripe Checkout for a Cost Split PARTICIPANT's share (CRS-01.01, CRS-14.05, CRS-39.02).

    Same pricing path as the creator (cost_split_quote → poll_pricing, single margin config) and the same
    hosted-Checkout + signed-webhook confirmation as the creator's moderator-checkout, so a participant needs no
    publishable key / card form in our UI. Unlock happens ONLY when the signed webhook confirms the payment
    (participant.payment_status = paid; the row counts toward that participant's ladder) — never on return.

    Rules: Cost Split polls only; the session must have been opened by the creator (joinable states); the caller
    must be the signed-in owner of that participant; no share due (< $0.50) → 409, never a minimum charge.
    """
    session = await _get_session(db, session_id)
    if session.pricing_tier != "cost_split":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session pricing tier is not 'cost_split'")
    if session.status not in ("open", "polling", "ranking", "closed"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="The poll is not open yet — the creator opens it before participants join or pay")
    participant = (await db.execute(
        select(Participant).where(Participant.id == participant_id, Participant.session_id == session_id)
    )).scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found in this session")
    if not participant.user_id or participant.user_id != user_id:
        # Strict: a share is paid by the signed-in owner of the seat (results go to a logged-in account).
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your participant")
    if participant.payment_status in ("paid", "lead_exempt"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Your share is already paid")

    quote = await cost_split_quote(db, session)
    share_cents = int(quote["participant_share_cents"])
    if share_cents <= 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="No participant share is due for this poll — the creator covers the full price")

    tx_type, line = "cost_split", "poll_cost_split_participant"
    idem_key = stripe_idempotency_key(
        action="checkout_cost_split_share",
        session_id=str(session_id),
        participant_id=str(participant_id),
        amount_cents=share_cents,
        transaction_type=tx_type,
        nonce=client_key or new_attempt_nonce(),
    )
    base = f"{settings.frontend_url}/session/?id={session_id}&pid={participant_id}"
    ok_url = success_url or f"{base}&share=success"
    ok_url = ok_url if "{CHECKOUT_SESSION_ID}" in ok_url else ok_url + ("&" if "?" in ok_url else "?") + "cs={CHECKOUT_SESSION_ID}"
    metadata = {
        "session_id": str(session_id),
        "poll_id": str(session_id),
        "participant_id": str(participant_id),
        "short_code": session.short_code,
        "transaction_type": tx_type,
        "product_line": line,
        "pricing_tier": "cost_split",
        "participants": str(quote["participants"]),
        "margin_multiplier": str(quote["margin_multiplier"]),
        "quote_total_cents": str(quote["total_cents"]),
        "catalog_version": str(quote.get("catalog_version", "")),
    }
    checkout = stripe.checkout.Session.create(
        line_items=[{
            "price_data": stripe_catalog.price_data(
                line, share_cents,
                name=f"eXeL AI Polling: {session.title}"[:120],
                description=f"Poll {session.short_code} — your Cost Split share",
            ),
            "quantity": 1,
        }],
        mode="payment",
        client_reference_id=str(session_id),
        success_url=ok_url,
        cancel_url=cancel_url or f"{base}&share=cancelled",
        metadata=metadata,
        payment_intent_data={"metadata": metadata, "description": f"eXeL AI Polling — poll {session.short_code} (participant share)"},
        idempotency_key=idem_key,
    )
    existing = (await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.stripe_checkout_session_id == checkout.id)
    )).scalar_one_or_none()
    if not isinstance(existing, PaymentTransaction):
        db.add(PaymentTransaction(
            session_id=session_id,
            participant_id=participant_id,
            transaction_type=tx_type,
            amount_cents=share_cents,
            currency="USD",
            stripe_checkout_session_id=checkout.id,
            status="pending",
            product_line=product_line_for(tx_type),
            idempotency_key=idem_key,
            reconcile_status="awaiting_webhook",
            metadata_json=json.dumps({"share_of_quote": {k: quote.get(k) for k in (
                "total_cents", "participant_share_cents", "participants", "margin_multiplier", "catalog_version")}}),
        ))
    await db.commit()
    logger.info("cube8.payment.cost_split_share_checkout_created", session_id=str(session_id),
                participant_id=str(participant_id), amount_cents=share_cents, checkout_id=checkout.id)
    return {
        "checkout_url": checkout.url,
        "checkout_id": checkout.id,
        "amount_cents": share_cents,
        "quote_total_cents": int(quote["total_cents"]),
        "margin_multiplier": str(quote["margin_multiplier"]),
    }


# ---------------------------------------------------------------------------
# Donation (all tiers — after results delivered)
# ---------------------------------------------------------------------------


async def create_donation_intent(
    db: AsyncSession,
    session_id: uuid.UUID,
    participant_id: uuid.UUID | None,
    amount_cents: int,
) -> dict:
    """Create Stripe Payment Intent for voluntary donation.

    Shown after results CSV is delivered. Optional for all tiers.
    """
    if amount_cents < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum donation is $0.50",
        )

    session = await _get_session(db, session_id)

    idem_key = stripe_idempotency_key(
        action="intent_donation",
        session_id=str(session_id),
        participant_id=str(participant_id) if participant_id else None,
        amount_cents=amount_cents,
        transaction_type="donation",
        nonce=new_attempt_nonce(),
    )
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency="usd",
        metadata={
            "session_id": str(session_id),
            "participant_id": str(participant_id) if participant_id else "moderator",
            "transaction_type": "donation",
        },
        description=f"Donation — Session {session.short_code}",
        idempotency_key=idem_key,
    )

    tx = PaymentTransaction(
        session_id=session_id,
        participant_id=participant_id,
        transaction_type="donation",
        amount_cents=amount_cents,
        currency="USD",
        stripe_payment_intent_id=intent.id,
        status="pending",
    )
    db.add(tx)
    await db.commit()

    logger.info(
        "cube8.payment.donation_intent_created",
        extra={
            "session_id": str(session_id),
            "amount_cents": amount_cents,
        },
    )

    return {
        "client_secret": intent.client_secret,
        "payment_intent_id": intent.id,
        "amount_cents": amount_cents,
    }


# ---------------------------------------------------------------------------
# Divinity Guide Donation — Stripe Checkout (anonymous, adjustable amount)
# ---------------------------------------------------------------------------


async def create_divinity_donation_checkout(
    db: AsyncSession | None = None,
    amount_cents: int = 333,
    success_url: str = "",
    cancel_url: str = "",
    label: str = "The Divinity Guide — Sacred Contribution",
    description: str = "The Return to Wholeness and Living Divinity",
    purpose: str = "divinity_guide",
    client_key: str | None = None,
    session_id: uuid.UUID | None = None,
    participant_id: uuid.UUID | None = None,
) -> dict:
    """Anonymous Stripe Checkout for a voluntary donation (no auth; optionally scoped to a poll).

    With `session_id` (+ optional `participant_id`) the donation is attributed to that poll / payer, so once the
    signed webhook confirms it, it counts toward the 333 / Original donation ladder (view_entitlement.py).

    `purpose` picks the live Product: divinity_guide | derisking_strategies | community. Minimum $0.50,
    default $3.33. Records a pending PaymentTransaction; the signed webhook completes it.
    """
    if amount_cents < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum donation is $0.50",
        )
    if purpose not in stripe_catalog.DONATION_PURPOSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown donation purpose")
    line, tx_type = stripe_catalog.DONATION_PURPOSES[purpose]
    if participant_id and not session_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="participant_id requires session_id")
    if session_id and db is not None:
        await _get_session(db, session_id)  # 404 for an unknown poll
        if participant_id:
            ok = (await db.execute(select(Participant.id).where(
                Participant.id == participant_id, Participant.session_id == session_id))).scalar_one_or_none()
            if ok != participant_id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found in this session")

    idem_key = stripe_idempotency_key(
        action="checkout_donation",
        session_id=str(session_id) if session_id else None,
        participant_id=str(participant_id) if participant_id else None,
        amount_cents=amount_cents,
        transaction_type=tx_type,
        nonce=client_key or new_attempt_nonce(),
    )
    default_ok = f"{settings.frontend_url}/divinity-guide?donated=true" if purpose == "divinity_guide" else f"{settings.frontend_url}/?donated=true"
    ok_url = success_url or default_ok
    ok_url = ok_url if "{CHECKOUT_SESSION_ID}" in ok_url else ok_url + ("&" if "?" in ok_url else "?") + "cs={CHECKOUT_SESSION_ID}"
    metadata = {
        "transaction_type": tx_type,
        "product_line": product_line_for(tx_type),
        "purpose": purpose,
        "amount_cents": str(amount_cents),
        "source": "api_donate",
    }
    if session_id:
        metadata["session_id"] = str(session_id)
        metadata["poll_id"] = str(session_id)
    if participant_id:
        metadata["participant_id"] = str(participant_id)
    checkout = stripe.checkout.Session.create(
        line_items=[{
            "price_data": stripe_catalog.price_data(line, amount_cents, name=label, description=description),
            "quantity": 1,
        }],
        mode="payment",
        submit_type="donate",
        success_url=ok_url,
        cancel_url=cancel_url or (f"{settings.frontend_url}/divinity-guide" if purpose == "divinity_guide" else settings.frontend_url),
        metadata=metadata,
        payment_intent_data={"metadata": metadata, "description": label[:200]},
        idempotency_key=idem_key,
    )

    if db:
        existing = (await db.execute(
            select(PaymentTransaction).where(PaymentTransaction.stripe_checkout_session_id == checkout.id)
        )).scalar_one_or_none()
        if not isinstance(existing, PaymentTransaction):
            db.add(PaymentTransaction(
                session_id=session_id,
                participant_id=participant_id,
                transaction_type=tx_type,
                amount_cents=amount_cents,
                currency="USD",
                stripe_checkout_session_id=checkout.id,
                status="pending",
                product_line=product_line_for(tx_type),
                idempotency_key=idem_key,
                reconcile_status="awaiting_webhook",
                metadata_json=json.dumps({"purpose": purpose, "source": "api_donate"}),
            ))
            await db.commit()

    logger.info("cube8.payment.donation_checkout", purpose=purpose, amount_cents=amount_cents, checkout_id=checkout.id)

    return {
        "checkout_url": checkout.url,
        "checkout_id": checkout.id,
        "amount_cents": amount_cents,
        "purpose": purpose,
    }


# ---------------------------------------------------------------------------
# Webhook — Payment Completion
# ---------------------------------------------------------------------------


async def handle_payment_completed(
    db: AsyncSession,
    stripe_event: dict,
) -> None:
    """Handle Stripe webhook for completed payments.

    Updates PaymentTransaction status and Session/Participant payment flags.
    Idempotent: skips already-completed transactions (replay protection).
    """
    event_type = stripe_event["type"]
    obj = stripe_event["data"]["object"]

    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        checkout_id = obj["id"]
        md = obj.get("metadata") or {}
        result = await db.execute(
            select(PaymentTransaction).where(
                PaymentTransaction.stripe_checkout_session_id == checkout_id
            )
        )
        tx = result.scalar_one_or_none()
        paid_cents = obj.get("amount_total")
        if tx is None and md.get("transaction_type") in DONATION_TX_TYPES:
            # Edge donations (frontend /api/donate) never touch the API until Stripe confirms them — record the
            # row now. The partial unique index on stripe_checkout_session_id makes a racing duplicate fail safely.
            tx_type = md.get("transaction_type")
            if tx_type == "donation" and md.get("purpose") in stripe_catalog.DONATION_PURPOSES:
                tx_type = stripe_catalog.DONATION_PURPOSES[md["purpose"]][1]
            sid, pid = await _donation_scope_from_metadata(db, md)
            tx = PaymentTransaction(
                session_id=sid,
                participant_id=pid,
                transaction_type=tx_type,
                amount_cents=int(paid_cents or md.get("amount_cents") or 0),
                currency=(obj.get("currency") or "usd").upper()[:3],
                stripe_checkout_session_id=checkout_id,
                stripe_payment_intent_id=obj.get("payment_intent") if isinstance(obj.get("payment_intent"), str) else None,
                status="pending",
                product_line=product_line_for(tx_type),
                reconcile_status="recorded_from_webhook",
                metadata_json=json.dumps({"source": md.get("source") or "edge_donate", "purpose": md.get("purpose"),
                                          "session_id": str(sid) if sid else None,
                                          "participant_id": str(pid) if pid else None}),
            )
            db.add(tx)
            await db.flush()
        if tx and tx.status != "completed":  # Idempotency: skip if already processed
            tx.status = "completed"
            tx.stripe_event_id = stripe_event.get("id")
            if isinstance(obj.get("payment_intent"), str) and not tx.stripe_payment_intent_id:
                tx.stripe_payment_intent_id = obj["payment_intent"]
            if paid_cents is not None and int(paid_cents) != int(tx.amount_cents):
                tx.reconcile_status = f"amount_mismatch:stripe={int(paid_cents)}"
            elif tx.reconcile_status in (None, "awaiting_webhook"):
                tx.reconcile_status = "stripe_confirmed"

            if tx.transaction_type in DONATION_TX_TYPES and not tx.session_id:
                # Record an inert contribution receipt (mints no 웃)
                # The receipt runs in a SAVEPOINT: if it fails, the payment row still commits (the old call passed
                # participant_id/no user_id → TypeError, so receipts were never written; a DB error here would also
                # have poisoned the outer transaction and 500'd the webhook).
                from app.cubes.cube8_tokens.service import record_contribution_receipt
                try:
                    async with db.begin_nested():
                        await record_contribution_receipt(
                            db, session_id=tx.session_id, user_id="donor:anonymous",
                            amount_usd=tx.amount_cents / 100.0, payment_type="donation",
                            reference_id=checkout_id,
                        )
                except Exception as e:  # noqa: BLE001
                    logger.warning("cube8.payment.donation_receipt_failed", error=str(e)[:300])
            elif tx.session_id and tx.transaction_type == "cost_split" and tx.participant_id:
                # A PARTICIPANT's Cost Split share (hosted Checkout) pays that seat only — it must never flip the
                # creator's session.is_paid (CRS-01.01 / CRS-14.05).
                p_row = (await db.execute(
                    select(Participant).where(Participant.id == tx.participant_id,
                                              Participant.session_id == tx.session_id)
                )).scalar_one_or_none()
                if p_row is not None and not (paid_cents is not None and int(paid_cents) != int(tx.amount_cents)):
                    p_row.payment_status = "paid"
            elif tx.session_id and tx.transaction_type in ("moderator_fee", "cost_split", "usage_billing"):
                session = await _get_session(db, tx.session_id)
                session.is_paid = True

            await db.commit()
            logger.info("cube8.payment.checkout_completed", checkout_id=checkout_id, type=tx.transaction_type)
            await _fire_payment_received(db, tx)
        elif tx and tx.status == "completed":
            logger.info("cube8.payment.checkout_already_completed", checkout_id=checkout_id)
        return tx

    elif event_type == "payment_intent.succeeded":
        pi_id = obj["id"]
        result = await db.execute(
            select(PaymentTransaction).where(
                PaymentTransaction.stripe_payment_intent_id == pi_id
            )
        )
        tx = result.scalar_one_or_none()
        if tx and tx.status != "completed":  # Idempotency: skip if already processed
            tx.status = "completed"
            tx.stripe_event_id = stripe_event.get("id")
            if tx.transaction_type == "cost_split" and tx.participant_id:
                p_result = await db.execute(
                    select(Participant).where(Participant.id == tx.participant_id)
                )
                participant = p_result.scalar_one_or_none()
                if participant:
                    participant.payment_status = "paid"
            await db.commit()
            logger.info(
                "cube8.payment.intent_succeeded",
                extra={"pi_id": pi_id, "type": tx.transaction_type},
            )
            await _fire_payment_received(db, tx)
        elif tx and tx.status == "completed":
            logger.info("cube8.payment.intent_already_completed", extra={"pi_id": pi_id})
        return tx
    return None


async def _fire_payment_received(db: AsyncSession, tx) -> None:
    """Fire the payment_received webhook after a payment completes (API productization).

    Fire-and-forget via safe_deliver_webhook — a webhook can never break payment
    processing. Only fires for session-scoped payments (session_id present).
    """
    if not getattr(tx, "session_id", None):
        return
    from app.cubes.cube5_gateway.webhook_service import safe_deliver_webhook

    await safe_deliver_webhook(
        db, tx.session_id, "payment_received",
        {
            "session_id": str(tx.session_id),
            "amount_cents": tx.amount_cents,
            "transaction_type": tx.transaction_type,
        },
    )



async def handle_payment_failed(
    db: AsyncSession,
    stripe_event: dict,
) -> None:
    """Mark matching PaymentTransaction failed (idempotent if already failed/completed)."""
    obj = stripe_event.get("data", {}).get("object") or {}
    pi_id = obj.get("id")
    checkout_id = obj.get("id") if stripe_event.get("type", "").startswith("checkout") else None
    tx = None
    if pi_id and "payment_intent" in stripe_event.get("type", ""):
        result = await db.execute(
            select(PaymentTransaction).where(PaymentTransaction.stripe_payment_intent_id == pi_id)
        )
        tx = result.scalar_one_or_none()
    elif checkout_id:
        result = await db.execute(
            select(PaymentTransaction).where(PaymentTransaction.stripe_checkout_session_id == checkout_id)
        )
        tx = result.scalar_one_or_none()
    if tx and tx.status not in ("completed", "failed", "expired"):
        tx.status = "expired" if stripe_event.get("type") == "checkout.session.expired" else "failed"
        tx.stripe_event_id = stripe_event.get("id")
        await db.commit()
        logger.info("cube8.payment.marked_failed", extra={"id": str(tx.id), "type": tx.transaction_type})


# ---------------------------------------------------------------------------
# Session Payment Status
# ---------------------------------------------------------------------------


async def get_payment_status(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Get payment summary for a session."""
    session = await _get_session(db, session_id)

    result = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.session_id == session_id
        ).order_by(PaymentTransaction.created_at)
    )
    transactions = list(result.scalars().all())

    total_collected = sum(tx.amount_cents for tx in transactions if tx.status == "completed")
    total_pending = sum(tx.amount_cents for tx in transactions if tx.status == "pending")

    return {
        "session_id": str(session_id),
        "pricing_tier": session.pricing_tier,
        "is_paid": session.is_paid,
        "fee_amount_cents": session.fee_amount_cents,
        "estimated_cost_cents": session.estimated_cost_cents,
        "total_collected_cents": total_collected,
        "total_pending_cents": total_pending,
        "transaction_count": len(transactions),
        "transactions": [
            {
                "id": str(tx.id),
                "type": tx.transaction_type,
                "amount_cents": tx.amount_cents,
                "status": tx.status,
                "created_at": tx.created_at.isoformat() if tx.created_at else None,
            }
            for tx in transactions
        ],
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _uuid_or_none(v) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(v)) if v else None
    except (ValueError, TypeError):
        return None


async def _donation_scope_from_metadata(db: AsyncSession, md: dict) -> tuple[uuid.UUID | None, uuid.UUID | None]:
    """(session_id, participant_id) a donation Checkout was made for, validated against the DB.

    The edge /api/donate route and the API donate route put poll_id/session_id + participant_id in Checkout
    metadata so the webhook can credit the donation ladder (333 at $9.99, Original at $11.11). Unknown sessions,
    or a participant that is not in that session, are dropped — the payment is still recorded, just unscoped.
    """
    sid = _uuid_or_none(md.get("session_id") or md.get("poll_id"))
    pid = _uuid_or_none(md.get("participant_id"))
    if not sid:
        return None, None
    found = (await db.execute(select(Session.id).where(Session.id == sid))).scalar_one_or_none()
    if found != sid:
        return None, None
    if pid:
        ok = (await db.execute(
            select(Participant.id).where(Participant.id == pid, Participant.session_id == sid)
        )).scalar_one_or_none()
        if ok != pid:
            pid = None
    return sid, pid


async def _get_session(db: AsyncSession, session_id: uuid.UUID) -> Session:
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found",
        )
    return session
