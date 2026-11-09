"""Cube 8 — Stripe Webhook Handler.

Receives Stripe events and routes to payment_service for processing.
Verifies webhook signature using STRIPE_WEBHOOK_SECRET.
"""

import json
import logging

import structlog

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_db
from app.cubes.cube8_tokens import payment_service

logger = structlog.get_logger(__name__)  # keyword fields need structlog; stdlib raised TypeError

router = APIRouter(tags=["Cube 8 — Stripe Webhooks"])


@router.post("/webhooks/stripe", status_code=200)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: str = Header(alias="Stripe-Signature", default=""),
):
    """Receive Stripe webhook events.

    Handles: checkout.session.completed / async_payment_succeeded / async_payment_failed / expired,
    payment_intent.succeeded / payment_failed, charge.refunded, charge.dispute.created (t193u)
    """
    payload = await request.body()

    # Verify signature if webhook secret is configured
    if settings.stripe_webhook_secret:
        try:
            stripe.Webhook.construct_event(
                payload, stripe_signature, settings.stripe_webhook_secret
            )
            # Signature verified. Work on the plain JSON dict: stripe-python >= 8 StripeObjects are NOT dicts
            # (no .get), which made every signed event raise before this fix.
            event = json.loads(payload)
        except (stripe.error.SignatureVerificationError, ValueError):
            logger.warning("cube8.webhook.invalid_signature")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature",
            )
    elif not settings.is_dev_or_test:
        # An unsigned event could mark any payment complete: accept one only in explicit dev/test.
        logger.error("cube8.webhook.secret_not_configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook not configured",
        )
    else:
        # Dev mode: parse without verification
        try:
            event = json.loads(payload)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")
        if not isinstance(event, dict):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event")
        logger.warning("cube8.webhook.no_signature_verification (dev mode)")

    event_type = event.get("type", "")
    event_id = event.get("id") or ""

    # Duplicate-event prevention: durable stripe_webhook_events table (046) + in-process set.
    from app.cubes.cube8_tokens.payment_idempotency import event_already_processed, record_processed_event
    if event_id and await event_already_processed(db, event_id):
        logger.info("cube8.webhook.duplicate_ignored", event_id=event_id, type=event_type)
        return {"status": "ok", "duplicate": True}

    obj = (event.get("data") or {}).get("object") or {}
    tx = None
    outcome = "ignored"
    if event_type in (
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "payment_intent.succeeded",
    ):
        # Fulfill only when Checkout payment_status is not unpaid (Stripe best practice).
        if event_type.startswith("checkout.session.") and obj.get("payment_status") == "unpaid":
            logger.info("cube8.webhook.checkout_unpaid_skip", type=event_type, id=obj.get("id"))
            outcome = "unpaid_skip"
        else:
            tx = await payment_service.handle_payment_completed(db, event)
            outcome = "completed" if tx is not None else "no_matching_transaction"
            logger.info("cube8.webhook.processed", type=event_type, event_id=event_id, outcome=outcome)

    elif event_type in ("charge.refunded", "charge.dispute.created"):
        tx = await payment_service.handle_charge_reversal(db, event)
        outcome = ("refunded" if event_type == "charge.refunded" else "disputed") if tx is not None else "no_matching_transaction"

    elif event_type in ("payment_intent.payment_failed", "checkout.session.async_payment_failed", "checkout.session.expired"):
        await payment_service.handle_payment_failed(db, event)
        outcome = "failed"
        logger.warning(
            "cube8.webhook.payment_failed",
            pi_id=obj.get("id"), error=(obj.get("last_payment_error") or {}).get("message"),
        )

    if event_id:
        await record_processed_event(
            db, event_id=event_id, event_type=event_type, livemode=event.get("livemode"), outcome=outcome,
            session_id=getattr(tx, "session_id", None), payment_transaction_id=getattr(tx, "id", None), payload=payload,
        )

    return {"status": "ok", "outcome": outcome}
