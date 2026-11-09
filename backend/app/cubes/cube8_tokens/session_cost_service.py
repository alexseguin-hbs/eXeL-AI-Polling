"""Build / authorize session cost rollups from recorded VoiceResponse + AICostLog rows.

Does not invent usage. Durable materialization into session_cost_ledger_lines is
gated on migration 033 apply (review-only in this PR).
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cubes.cube8_tokens.cost_ledger import (
    lines_from_ai_cost_row,
    lines_from_voice_row,
    rollup_session_costs,
)
from app.models.session import Session


async def _get_session(db: AsyncSession, session_id: uuid.UUID) -> Session:
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def assert_session_cost_access(session: Session, user_id: str, role: str) -> None:
    """Project/member/session authorization for cost ledger reads."""
    if role in ("admin", "lead_developer"):
        return
    if role == "moderator" and session.created_by == user_id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Cost ledger requires session owner (moderator) or admin",
    )


async def build_session_cost_rollup(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    user_id: str,
    role: str,
) -> dict[str, Any]:
    session = await _get_session(db, session_id)
    assert_session_cost_access(session, user_id, role)
    scope_ref = getattr(session, "scope_ref", None)
    sid = str(session_id)
    lines = []

    # Voice / STT — recorded estimates only
    try:
        from app.models.voice_response import VoiceResponse
        from app.models.response_meta import ResponseMeta
        q = (
            select(VoiceResponse, ResponseMeta)
            .join(ResponseMeta, VoiceResponse.response_meta_id == ResponseMeta.id)
            .where(ResponseMeta.session_id == session_id)
        )
        for voice, _meta in (await db.execute(q)).all():
            lines.append(
                lines_from_voice_row(
                    {
                        "stt_provider": voice.stt_provider,
                        "audio_duration_sec": getattr(voice, "audio_duration_sec", None),
                        "cost_usd": voice.cost_usd,
                        "source": "voice_responses",
                    },
                    session_id=sid,
                    scope_ref=scope_ref,
                )
            )
    except Exception:
        # Table may be absent in some test envs — do not fabricate
        pass

    try:
        from app.models.ai_cost_log import AICostLog
        q = select(AICostLog).where(AICostLog.session_id == session_id)
        for row in (await db.execute(q)).scalars().all():
            lines.append(
                lines_from_ai_cost_row(
                    {
                        "provider": row.provider,
                        "total_input_chars": row.total_input_chars,
                        "total_output_chars": row.total_output_chars,
                        "estimated_cost_usd": row.estimated_cost_usd,
                        "phase": row.phase,
                        "source": "ai_cost_logs",
                    },
                    session_id=sid,
                    scope_ref=scope_ref,
                )
            )
    except Exception:
        pass

    rollup = rollup_session_costs(lines, session_id=sid, scope_ref=scope_ref)
    payload = rollup.as_dict()
    payload["org_id"] = session.created_by
    payload["persistence"] = {
        "durable_table": "session_cost_ledger_lines",
        "migration": "033_cost_ledger_payment_events.sql",
        "applied": False,
        "live_claim": False,
        "note": "Review-only migration — no production Supabase apply in this PR",
    }
    return payload
