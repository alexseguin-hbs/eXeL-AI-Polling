"""Signed, session-scoped participant tokens (HP-07, Thor round 1 item 5).

Join is anonymous, so a participant has no Auth0 identity. Before this module, any caller
who knew a participant UUID (readable from the participants list and the Supabase rows)
could submit text, voice or a ballot as that person. Now join issues a token:

    token = "<participant_id>.<hex HMAC-SHA256(secret, "<session_id>:<participant_id>")>"

It names the participant it was issued to, so the vote route can resolve the participant
from the token alone, and it is bound to one session, so it cannot be replayed elsewhere.
Verification is constant-time (hmac.compare_digest).

INVARIANT: a write made in a participant's name carries either that participant's token or
the authenticated identity that owns the participant row.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

HEADER = "X-Participant-Token"

# Dev/test only: a per-process secret when SESSION_SECRET is unset (tokens then die with the
# process). Outside dev/test the app refuses to start without SESSION_SECRET (main.lifespan).
_EPHEMERAL = secrets.token_bytes(32)


def _secret() -> bytes:
    if settings.session_secret:
        return settings.session_secret.encode()
    if settings.is_dev_or_test:
        return _EPHEMERAL
    raise RuntimeError("SESSION_SECRET is required outside development/test")


def _mac(session_id: uuid.UUID, participant_id: uuid.UUID) -> str:
    msg = f"{session_id}:{participant_id}".encode()
    return hmac.new(_secret(), msg, hashlib.sha256).hexdigest()


def issue_participant_token(session_id: uuid.UUID, participant_id: uuid.UUID) -> str:
    """Token for one participant in one session (returned once, at join)."""
    return f"{participant_id}.{_mac(session_id, participant_id)}"


def verify_participant_token(session_id: uuid.UUID, token: str | None) -> uuid.UUID | None:
    """The participant the token was issued to in this session, or None if it is not valid."""
    if not token or "." not in token:
        return None
    pid_text, _, mac = token.partition(".")
    try:
        pid = uuid.UUID(pid_text)
    except ValueError:
        return None
    if hmac.compare_digest(mac.encode(), _mac(session_id, pid).encode()):
        return pid
    return None


async def require_participant_identity(
    db: AsyncSession,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    token: str | None,
    user,
) -> None:
    """403 unless the caller proves it is `participant_id`: a valid token for it, or an
    authenticated user who owns that participant row in this session."""
    if verify_participant_token(session_id, token) == participant_id:
        return
    if user is not None and getattr(user, "user_id", None):
        from app.models.participant import Participant

        row = await db.execute(
            select(Participant.id).where(
                Participant.id == participant_id,
                Participant.session_id == session_id,
                Participant.user_id == user.user_id,
            )
        )
        if row.scalar_one_or_none() is not None:
            return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="This participant's token is required to submit in their name",
    )
