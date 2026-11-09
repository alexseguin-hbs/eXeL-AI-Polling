"""CRS-38 Round 3 — Expert Opinion on a chosen theme.

Moderator designates experts; each submits Concerns / Neutral / Support summaries for a theme;
an AI 1-pager is marked ready only after exactly 3 expert packets with audit (CRS-38.01–.03).
SIMULATED AI pager uses a deterministic join when no live provider is configured.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expert_opinion import ExpertAssignment, ExpertOpinion, ExpertOpinionPager

REQUIRED_EXPERTS = 3
THEME01_COLUMNS = ("support", "risk", "neutral")  # Support / Concerns / Neutral


def _require_nonempty_columns(support: str, risk: str, neutral: str) -> None:
    if not (support or "").strip() or not (risk or "").strip() or not (neutral or "").strip():
        raise ValueError("Each expert must submit Supporting Comments, Risk & Concerns, and Neutral Comments summaries")


async def invite_expert(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    invited_by: str,
    display_name: str,
    expert_user_id: str | None = None,
    expert_participant_id: uuid.UUID | None = None,
    theme_id: uuid.UUID | None = None,
) -> ExpertAssignment:
    if not display_name.strip():
        raise ValueError("display_name is required")
    if not expert_user_id and not expert_participant_id:
        raise ValueError("expert_user_id or expert_participant_id is required")
    row = ExpertAssignment(
        session_id=session_id,
        theme_id=theme_id,
        expert_user_id=expert_user_id,
        expert_participant_id=expert_participant_id,
        display_name=display_name.strip(),
        invited_by=invited_by,
        status="invited",
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


async def list_assignments(db: AsyncSession, session_id: uuid.UUID) -> list[ExpertAssignment]:
    res = await db.execute(
        select(ExpertAssignment).where(ExpertAssignment.session_id == session_id).order_by(ExpertAssignment.invited_at)
    )
    return list(res.scalars().all())


async def submit_expert_opinion(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    theme_id: uuid.UUID,
    assignment_id: uuid.UUID,
    submitted_by: str,
    support_summary: str,
    risk_summary: str,
    neutral_summary: str,
) -> ExpertOpinion:
    _require_nonempty_columns(support_summary, risk_summary, neutral_summary)
    asg = (await db.execute(
        select(ExpertAssignment).where(
            and_(ExpertAssignment.id == assignment_id, ExpertAssignment.session_id == session_id)
        )
    )).scalar_one_or_none()
    if asg is None:
        raise ValueError("Expert assignment not found for this session")
    if asg.status == "revoked":
        raise ValueError("Expert assignment was revoked")
    existing = (await db.execute(
        select(ExpertOpinion).where(
            and_(ExpertOpinion.assignment_id == assignment_id, ExpertOpinion.theme_id == theme_id)
        )
    )).scalar_one_or_none()
    if existing:
        existing.support_summary = support_summary.strip()
        existing.risk_summary = risk_summary.strip()
        existing.neutral_summary = neutral_summary.strip()
        existing.submitted_at = datetime.now(timezone.utc)
        existing.submitted_by = submitted_by
        opinion = existing
    else:
        opinion = ExpertOpinion(
            session_id=session_id,
            theme_id=theme_id,
            assignment_id=assignment_id,
            support_summary=support_summary.strip(),
            risk_summary=risk_summary.strip(),
            neutral_summary=neutral_summary.strip(),
            submitted_by=submitted_by,
        )
        db.add(opinion)
    asg.status = "submitted"
    if asg.theme_id is None:
        asg.theme_id = theme_id
    await db.flush()
    await db.refresh(opinion)
    return opinion


def _deterministic_pager(opinions: list[ExpertOpinion]) -> str:
    """SIMULATED / offline 1-pager — concatenates the three experts' columns. Not a live LLM claim."""
    lines = ["Expert Opinion 1-pager (SIMULATED)", ""]
    for i, op in enumerate(opinions, 1):
        lines.append(f"Expert {i}:")
        lines.append(f"  Supporting Comments: {op.support_summary}")
        lines.append(f"  Risk & Concerns: {op.risk_summary}")
        lines.append(f"  Neutral Comments: {op.neutral_summary}")
        lines.append("")
    return "\n".join(lines).strip()


async def build_pager_if_ready(
    db: AsyncSession,
    session_id: uuid.UUID,
    theme_id: uuid.UUID,
    *,
    use_simulated: bool = True,
) -> ExpertOpinionPager | None:
    """CRS-38.02/03: mark 1-pager ready only when exactly REQUIRED_EXPERTS opinions exist for the theme."""
    res = await db.execute(
        select(ExpertOpinion).where(
            and_(ExpertOpinion.session_id == session_id, ExpertOpinion.theme_id == theme_id)
        ).order_by(ExpertOpinion.submitted_at)
    )
    opinions = list(res.scalars().all())
    pager = (await db.execute(
        select(ExpertOpinionPager).where(
            and_(ExpertOpinionPager.session_id == session_id, ExpertOpinionPager.theme_id == theme_id)
        )
    )).scalar_one_or_none()
    if len(opinions) < REQUIRED_EXPERTS:
        if pager is None:
            pager = ExpertOpinionPager(session_id=session_id, theme_id=theme_id, ready=False, opinion_ids=[])
            db.add(pager)
        else:
            pager.ready = False
            pager.ready_at = None
            pager.opinion_ids = [o.id for o in opinions]
        await db.flush()
        return pager
    # Take the first REQUIRED_EXPERTS by submit time (audit order).
    chosen = opinions[:REQUIRED_EXPERTS]
    text = _deterministic_pager(chosen) if use_simulated else _deterministic_pager(chosen)
    if pager is None:
        pager = ExpertOpinionPager(session_id=session_id, theme_id=theme_id)
        db.add(pager)
    pager.pager_text = text
    pager.opinion_ids = [o.id for o in chosen]
    pager.ready = True
    pager.ready_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(pager)
    return pager


async def theme_expert_bundle(db: AsyncSession, session_id: uuid.UUID, theme_id: uuid.UUID) -> dict[str, Any]:
    """Participant-facing bundle: assignments, opinions, pager readiness (text only when ready)."""
    assignments = await list_assignments(db, session_id)
    opinions = list((await db.execute(
        select(ExpertOpinion).where(
            and_(ExpertOpinion.session_id == session_id, ExpertOpinion.theme_id == theme_id)
        ).order_by(ExpertOpinion.submitted_at)
    )).scalars().all())
    pager = (await db.execute(
        select(ExpertOpinionPager).where(
            and_(ExpertOpinionPager.session_id == session_id, ExpertOpinionPager.theme_id == theme_id)
        )
    )).scalar_one_or_none()
    return {
        "session_id": str(session_id),
        "theme_id": str(theme_id),
        "required_experts": REQUIRED_EXPERTS,
        "assignments": [
            {
                "id": str(a.id),
                "display_name": a.display_name,
                "status": a.status,
                "theme_id": str(a.theme_id) if a.theme_id else None,
                "invited_at": a.invited_at.isoformat() if a.invited_at else None,
            }
            for a in assignments
        ],
        "opinions": [
            {
                "id": str(o.id),
                "assignment_id": str(o.assignment_id),
                "support_summary": o.support_summary,
                "risk_summary": o.risk_summary,
                "neutral_summary": o.neutral_summary,
                "submitted_at": o.submitted_at.isoformat() if o.submitted_at else None,
                "submitted_by": o.submitted_by,
            }
            for o in opinions
        ],
        "pager": (
            {
                "ready": bool(pager.ready),
                "pager_text": pager.pager_text if pager and pager.ready else None,
                "ready_at": pager.ready_at.isoformat() if pager and pager.ready_at else None,
                "opinion_ids": [str(x) for x in (pager.opinion_ids or [])] if pager else [],
            }
            if pager
            else {"ready": False, "pager_text": None, "ready_at": None, "opinion_ids": []}
        ),
    }
