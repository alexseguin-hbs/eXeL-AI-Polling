"""Cube 8 — Stripe Payment Service.

3 pricing tiers with donation-after-results model:
  Free (max 19):      No upfront payment. Donation prompt after results CSV.
  Moderator Paid:     Moderator pays min $11.11 via Stripe Checkout. Donation after.
  Cost Split (50/50): 50% Moderator + 50%/N Users via Payment Intents. Donation after.

Donation timing: ALWAYS after results delivered, never gates access.
"""

import logging
import math
import uuid

import stripe
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.payment import PaymentTransaction
from app.models.session import Session
from app.models.participant import Participant

logger = logging.getLogger(__name__)

# Configure Stripe with secret key
stripe.api_key = settings.stripe_secret_key

# Minimum Moderator fee in cents ($11.11)
MODERATOR_MIN_FEE_CENTS = 1111


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
) -> dict:
    """Create Stripe Checkout Session for Moderator Paid tier.

    Minimum $11.11 (1111 cents). Moderator pays upfront before session opens.
    Verifies session ownership — only the session creator can pay.
    """
    session = await _get_session(db, session_id)

    # Security: verify session ownership
    if session.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the session creator can initiate payment",
        )

    if session.pricing_tier != "moderator_paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session pricing tier is not 'moderator_paid'",
        )

    final_amount = max(amount_cents or MODERATOR_MIN_FEE_CENTS, MODERATOR_MIN_FEE_CENTS)

    checkout = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "unit_amount": final_amount,
                "product_data": {
                    "name": f"SoI Polling Session: {session.title}",
                    "description": f"Session {session.short_code} — Moderator fee",
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
            "transaction_type": "moderator_fee",
        },
    )

    # Record pending transaction
    tx = PaymentTransaction(
        session_id=session_id,
        transaction_type="moderator_fee",
        amount_cents=final_amount,
        currency="USD",
        stripe_checkout_session_id=checkout.id,
        status="pending",
    )
    db.add(tx)

    # Store checkout ID on session
    session.stripe_session_id = checkout.id
    session.fee_amount_cents = final_amount
    await db.commit()

    logger.info(
        "cube8.payment.moderator_checkout_created",
        extra={
            "session_id": str(session_id),
            "amount_cents": final_amount,
            "checkout_id": checkout.id,
        },
    )

    return {
        "checkout_url": checkout.url,
        "checkout_id": checkout.id,
        "amount_cents": final_amount,
    }


# ---------------------------------------------------------------------------
# Cost Split — Payment Intents for Moderator + Users
# ---------------------------------------------------------------------------


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

    estimate = await estimate_session_cost(db, session_id)
    total_cents = estimate["estimated_cost_cents"]
    user_count = max(estimate["user_count"] - 1, 1)  # Exclude moderator from N

    if is_moderator:
        share_cents = math.ceil(total_cents / 2)
        description = f"Moderator share (50%) — Session {session.short_code}"
    else:
        user_share = math.ceil(total_cents / 2)
        share_cents = max(math.ceil(user_share / user_count), 50)  # Min $0.50 per user
        description = f"User share (50%/{user_count}) — Session {session.short_code}"

    intent = stripe.PaymentIntent.create(
        amount=share_cents,
        currency="usd",
        metadata={
            "session_id": str(session_id),
            "participant_id": str(participant_id),
            "transaction_type": "cost_split",
            "is_moderator": str(is_moderator),
            "estimated_total_cents": str(total_cents),
        },
        description=description,
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

    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency="usd",
        metadata={
            "session_id": str(session_id),
            "participant_id": str(participant_id) if participant_id else "moderator",
            "transaction_type": "donation",
        },
        description=f"Donation — Session {session.short_code}",
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
    amount_cents: int = 333,
    success_url: str = "",
    cancel_url: str = "",
) -> dict:
    """Create Stripe Checkout for Divinity Guide donation.

    Anonymous — no auth required. User can adjust amount.
    Minimum $0.50. Default $3.33.
    """
    if amount_cents < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum donation is $0.50",
        )

    checkout = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "unit_amount": amount_cents,
                "product_data": {
                    "name": "The Divinity Guide — Sacred Contribution",
                    "description": "The Return to Wholeness and Living Divinity",
                },
            },
            "quantity": 1,
            "adjustable_quantity": {"enabled": False},
        }],
        mode="payment",
        success_url=success_url or f"{settings.frontend_url}/divinity-guide?donated=true",
        cancel_url=cancel_url or f"{settings.frontend_url}/divinity-guide",
        metadata={
            "transaction_type": "divinity_guide_donation",
        },
    )

    logger.info(
        "cube8.payment.divinity_donation_checkout",
        extra={"amount_cents": amount_cents, "checkout_id": checkout.id},
    )

    return {
        "checkout_url": checkout.url,
        "checkout_id": checkout.id,
        "amount_cents": amount_cents,
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

    if event_type == "checkout.session.completed":
        checkout_id = obj["id"]
        result = await db.execute(
            select(PaymentTransaction).where(
                PaymentTransaction.stripe_checkout_session_id == checkout_id
            )
        )
        tx = result.scalar_one_or_none()
        if tx and tx.status != "completed":  # Idempotency: skip if already processed
            tx.status = "completed"
            session = await _get_session(db, tx.session_id)
            session.is_paid = True
            await db.commit()
            logger.info(
                "cube8.payment.checkout_completed",
                extra={"checkout_id": checkout_id, "session_id": str(tx.session_id)},
            )
        elif tx and tx.status == "completed":
            logger.info("cube8.payment.checkout_already_completed", extra={"checkout_id": checkout_id})

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
        elif tx and tx.status == "completed":
            logger.info("cube8.payment.intent_already_completed", extra={"pi_id": pi_id})


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
