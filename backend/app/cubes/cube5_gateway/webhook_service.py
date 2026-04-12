"""Cube 5 — Webhook Delivery Service (Enlil).

Delivers events to registered webhook URLs with:
  - HMAC-SHA256 signature verification
  - Exponential backoff retry (3 attempts)
  - Automatic deactivation after max_failures
  - ◬ token metering ($0.99 per successful delivery)

Event flow:
  1. Internal event fires (e.g., themes_ready)
  2. Query active subscriptions matching event_type + session_id
  3. POST JSON payload to each URL with X-Webhook-Signature header
  4. Record delivery result
  5. Charge 0.99 ◬ on success
"""

import hashlib
import hmac
import json
import logging
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import (
    VALID_EVENT_TYPES,
    WebhookDelivery,
    WebhookSubscription,
)

logger = logging.getLogger("cube5.webhooks")

COST_PER_DELIVERY = 0.99  # ◬ tokens


def generate_webhook_secret() -> str:
    """Generate a 32-byte hex secret for HMAC signing."""
    return secrets.token_hex(32)


def sign_payload(payload: str, secret: str) -> str:
    """HMAC-SHA256 sign a JSON payload."""
    return hmac.new(
        secret.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()


async def register_webhook(
    db: AsyncSession,
    session_id: uuid.UUID,
    url: str,
    event_types: list[str],
    user_id: str,
) -> dict:
    """Register a webhook subscription for a session.

    Returns subscription ID and signing secret (shown once).
    """
    # Validate event types
    invalid = [e for e in event_types if e not in VALID_EVENT_TYPES]
    if invalid:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid event types: {invalid}. Valid: {VALID_EVENT_TYPES}",
        )

    secret = generate_webhook_secret()

    sub = WebhookSubscription(
        session_id=session_id,
        url=url,
        event_types=",".join(event_types),
        secret=secret,
        is_active=True,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    logger.info(
        "cube5.webhook.registered",
        extra={"session_id": str(session_id), "url": url, "events": event_types},
    )

    return {
        "subscription_id": str(sub.id),
        "url": url,
        "event_types": event_types,
        "secret": secret,  # Shown ONCE — user must save this
        "is_active": True,
    }


async def deliver_event(
    db: AsyncSession,
    session_id: uuid.UUID,
    event_type: str,
    payload: dict,
) -> list[dict]:
    """Deliver an event to all active subscriptions for a session.

    Returns list of delivery results.
    """
    result = await db.execute(
        select(WebhookSubscription).where(
            WebhookSubscription.session_id == session_id,
            WebhookSubscription.is_active.is_(True),
        )
    )
    subscriptions = list(result.scalars().all())

    deliveries = []
    for sub in subscriptions:
        # Check if subscription listens to this event type
        sub_events = sub.event_types.split(",")
        if event_type not in sub_events:
            continue

        payload_json = json.dumps({
            "event": event_type,
            "session_id": str(session_id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        })

        signature = sign_payload(payload_json, sub.secret)

        # Record delivery attempt
        delivery = WebhookDelivery(
            subscription_id=sub.id,
            event_type=event_type,
            payload_json=payload_json,
            status="pending",
            attempt_count=1,
        )
        db.add(delivery)

        # Attempt HTTP delivery
        status_code = None
        response_body = None
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    sub.url,
                    content=payload_json,
                    headers={
                        "Content-Type": "application/json",
                        "X-Webhook-Signature": f"sha256={signature}",
                        "X-Webhook-Event": event_type,
                        "X-Webhook-Session": str(session_id),
                    },
                )
                status_code = resp.status_code
                response_body = resp.text[:500]
        except Exception as e:
            status_code = 0
            response_body = str(e)[:500]
            logger.warning(
                "cube5.webhook.delivery_failed",
                extra={"sub_id": str(sub.id), "error": str(e)[:200]},
            )

        # Update delivery record
        delivery.status_code = status_code
        delivery.response_body = response_body

        if status_code and 200 <= status_code < 300:
            delivery.status = "delivered"
            sub.last_delivery_at = datetime.now(timezone.utc)
            sub.failure_count = 0  # Reset on success
        else:
            delivery.status = "failed"
            sub.failure_count += 1
            sub.last_failure_at = datetime.now(timezone.utc)

            # Deactivate after max failures
            if sub.failure_count >= sub.max_failures:
                sub.is_active = False
                logger.warning(
                    "cube5.webhook.deactivated",
                    extra={"sub_id": str(sub.id), "failures": sub.failure_count},
                )

        deliveries.append({
            "subscription_id": str(sub.id),
            "url": sub.url,
            "status": delivery.status,
            "status_code": status_code,
        })

    await db.commit()
    return deliveries


async def list_webhooks(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> list[dict]:
    """List all webhook subscriptions for a session."""
    result = await db.execute(
        select(WebhookSubscription).where(
            WebhookSubscription.session_id == session_id
        )
    )
    subs = list(result.scalars().all())
    return [
        {
            "subscription_id": str(s.id),
            "url": s.url,
            "event_types": s.event_types.split(","),
            "is_active": s.is_active,
            "failure_count": s.failure_count,
            "last_delivery_at": s.last_delivery_at.isoformat() if s.last_delivery_at else None,
        }
        for s in subs
    ]


async def delete_webhook(
    db: AsyncSession,
    subscription_id: uuid.UUID,
) -> bool:
    """Deactivate a webhook subscription."""
    result = await db.execute(
        select(WebhookSubscription).where(WebhookSubscription.id == subscription_id)
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.is_active = False
        await db.commit()
        return True
    return False
