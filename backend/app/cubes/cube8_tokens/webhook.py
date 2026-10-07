"""Cube 8 — Stripe Webhook Handler.

Receives Stripe events and routes to payment_service for processing.
Verifies webhook signature using STRIPE_WEBHOOK_SECRET.
"""

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

    Handles: checkout.session.completed, payment_intent.succeeded,
    payment_intent.payment_failed
    """
    payload = await request.body()

    # Verify signature if webhook secret is configured
    if settings.stripe_webhook_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, settings.stripe_webhook_secret
            )
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
        import json
        try:
            event = json.loads(payload)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")
        if not isinstance(event, dict):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event")
        logger.warning("cube8.webhook.no_signature_verification (dev mode)")

    event_type = event.get("type", "")

    if event_type in ("checkout.session.completed", "payment_intent.succeeded"):
        await payment_service.handle_payment_completed(db, event)
        logger.info("cube8.webhook.processed", extra={"type": event_type})

    elif event_type == "payment_intent.payment_failed":
        obj = event["data"]["object"]
        logger.warning(
            "cube8.webhook.payment_failed",
            extra={"pi_id": obj.get("id"), "error": obj.get("last_payment_error", {}).get("message")},
        )

    return {"status": "ok"}
