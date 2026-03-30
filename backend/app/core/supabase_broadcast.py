"""Task C6-7 — Supabase Realtime Broadcast helper.

Sends broadcast events to Supabase Realtime channels using the REST API.
Used by Cube 6 Phase A (summary_ready) and Phase B (themes_ready) to push
results to the Moderator dashboard without requiring the frontend to poll.

Uses httpx (already in requirements) — no supabase-py dependency needed.
Service role key from backend/.env (SUPABASE_KEY) authorizes publish.

Availability guard (Task A5.01): logs warning + continues on Supabase failure.
"""

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Supabase Realtime broadcast endpoint
# https://supabase.com/docs/guides/realtime/broadcast#send-messages-using-rest-api
_REALTIME_URL = f"{settings.supabase_url}/realtime/v1/api/broadcast" if settings.supabase_url else ""


async def broadcast_event(
    channel: str,
    event: str,
    payload: dict,
) -> bool:
    """Broadcast an event to a Supabase Realtime channel.

    Args:
        channel: Channel name (e.g., "session:ABC12345")
        event: Event type (e.g., "summary_ready", "themes_ready")
        payload: Event data dict

    Returns:
        True if broadcast succeeded, False if failed (non-fatal).
    """
    if not _REALTIME_URL or not settings.supabase_key:
        logger.warning(
            "supabase.broadcast.skipped",
            reason="SUPABASE_URL or SUPABASE_KEY not configured",
            channel=channel,
            event=event,
        )
        return False

    body = {
        "messages": [
            {
                "topic": channel,
                "event": event,
                "payload": payload,
            }
        ]
    }

    headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(_REALTIME_URL, json=body, headers=headers)

        if resp.status_code in (200, 202):
            logger.info(
                "supabase.broadcast.sent",
                channel=channel,
                event=event,
                status=resp.status_code,
            )
            return True
        else:
            logger.warning(
                "supabase.broadcast.failed",
                channel=channel,
                event=event,
                status=resp.status_code,
                body=resp.text[:200],
            )
            return False

    except Exception as e:
        # A5.01 availability guard — broadcast failure is non-fatal
        logger.warning(
            "supabase.broadcast.error",
            channel=channel,
            event=event,
            error=str(e),
        )
        return False
