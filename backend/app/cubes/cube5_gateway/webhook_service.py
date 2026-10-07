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


class WebhookTargetError(ValueError):
    """The webhook URL is not a public HTTPS endpoint."""


async def validate_webhook_url(url: str) -> None:
    """A webhook may only reach a public HTTPS host — checked at register AND at every delivery.

    The old guard compared the hostname to a short string list, so 172.16/12, 100.64/10, IPv6
    ULA/link-local, IPv4-mapped IPv6, decimal IPs and any DNS name pointing inside all passed,
    and nothing re-checked at send time (DNS can change after registration). Here every address
    the name resolves to must be globally routable.
    """
    import asyncio
    import ipaddress
    from urllib.parse import urlparse

    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise WebhookTargetError("Webhook URL must use HTTPS")
    host = parsed.hostname
    if not host:
        raise WebhookTargetError("Webhook URL must have a valid hostname")
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(host, parsed.port or 443)
    except OSError:
        raise WebhookTargetError("Webhook host does not resolve")
    addrs = {info[4][0] for info in infos}
    if not addrs:
        raise WebhookTargetError("Webhook host does not resolve")
    for raw in addrs:
        ip = ipaddress.ip_address(raw.split("%", 1)[0])
        mapped = getattr(ip, "ipv4_mapped", None)
        if mapped is not None:
            ip = mapped
        if not ip.is_global or ip.is_multicast:
            raise WebhookTargetError("Webhook URL must not target internal/loopback addresses")


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

    import asyncio

    import httpx

    pending = []
    for sub in subscriptions:
        if event_type not in sub.event_types.split(","):
            continue
        payload_json = json.dumps({
            "event": event_type,
            "session_id": str(session_id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        })
        delivery = WebhookDelivery(
            subscription_id=sub.id,
            event_type=event_type,
            payload_json=payload_json,
            status="pending",
            attempt_count=1,
        )
        db.add(delivery)
        pending.append((sub, payload_json, sign_payload(payload_json, sub.secret), delivery))

    async def _send(client, sub, payload_json, signature):
        try:
            await validate_webhook_url(sub.url)  # DNS may have moved since registration
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
            return resp.status_code, resp.text[:500]
        except Exception as e:  # noqa: BLE001 — a subscriber's failure is recorded, never raised
            logger.warning(
                "cube5.webhook.delivery_failed",
                extra={"sub_id": str(sub.id), "error": str(e)[:200]},
            )
            return 0, str(e)[:500]

    results = []
    if pending:
        # One client, every subscriber at once: a slow endpoint no longer stalls the others.
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            results = await asyncio.gather(*(_send(client, s_, pj, sig) for s_, pj, sig, _ in pending))

    deliveries = []
    for (sub, _pj, _sig, delivery), (status_code, response_body) in zip(pending, results):
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

    # Meter successful deliveries (0.99 ◬ each) into the per-org usage stream. Best-effort
    # — a metering failure must never break webhook delivery. Org is the session's owner
    # (v1 org = created_by), matching the scoping/api-key isolation model.
    delivered = [d for d in deliveries if d["status"] == "delivered"]
    if delivered:
        try:
            from app.core.usage_service import record_usage
            from app.models.session import Session as _Session

            _s = (await db.execute(select(_Session.created_by, _Session.scope_ref)
                                   .where(_Session.id == session_id))).first()
            if _s and _s[0]:
                for _ in delivered:
                    await record_usage(
                        db, org_id=_s[0], metric="webhook_delivery", cost_tokens=0.99,
                        session_id=session_id, scope_ref=_s[1],
                    )
        except Exception as exc:  # noqa: BLE001
            logger.warning("cube5.webhook.usage_meter_failed error=%s", str(exc)[:200])

    await db.commit()
    return deliveries


async def safe_deliver_webhook(
    db: AsyncSession,
    session_id: uuid.UUID,
    event_type: str,
    payload: dict,
) -> None:
    """Fire-and-forget webhook delivery for event producers (Krishna: build once).

    Wraps deliver_event in try/except + logging so a webhook failure can NEVER break
    the producing cube's pipeline. deliver_event early-returns when no subscriptions
    match, so this is cheap on the common (no-webhook) path. Producers call this ONE
    line instead of repeating the guard.
    """
    try:
        await deliver_event(db, session_id, event_type, payload)
    except Exception as exc:  # noqa: BLE001 — a webhook must never break the producer
        logger.warning(
            "cube5.webhook.delivery_failed event=%s session_id=%s error=%s",
            event_type, str(session_id), str(exc),
        )


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
    user=None,
) -> bool:
    """Deactivate a webhook subscription — only its session's owner (or an admin) may."""
    result = await db.execute(
        select(WebhookSubscription).where(WebhookSubscription.id == subscription_id)
    )
    sub = result.scalar_one_or_none()
    if sub and user is not None and getattr(user, "role", "") != "admin":
        from app.core.session_access import session_owner_of

        if await session_owner_of(db, sub.session_id) != user.user_id:
            return False  # indistinguishable from "not found": never confirms another tenant's id
    if sub:
        sub.is_active = False
        await db.commit()
        return True
    return False
