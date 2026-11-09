"""CRS-39 helpers for read APIs that must redact paid fields.

Reuses ``resolve_view_entitlement`` (W2) — do not fork payment / Stripe logic here.
"""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cubes.cube8_tokens.view_entitlement import resolve_view_entitlement
from app.models.session import Session


async def session_and_entitlement(db: AsyncSession, session_id: uuid.UUID, user) -> tuple[Session, dict]:
    """Load session + W2 view entitlement for the caller. 404 if session missing."""
    session = (
        await db.execute(select(Session).where(Session.id == session_id))
    ).scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    ent = await resolve_view_entitlement(db, session, user)
    return session, ent


def apply_theme_paid_view_gate(item: dict, *, unlocked_333: bool = False) -> dict:
    """CRS-39: ThemeRead summary_333 null unless entitled (33/111 stay)."""
    out = dict(item)
    if not unlocked_333:
        out["summary_333"] = None
    return out
