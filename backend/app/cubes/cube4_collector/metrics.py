"""Cube 4 — Metrics (System / User / Outcome).

R-Core parity: Cube 4 was the only collector cube without a metrics.py (Cubes
1/2/3/7 have one), so the Dev-Sim / qualification gateway couldn't compare a
candidate collector on the same three axes:

  System  — collected volume, text/voice split, flagged rate
  User    — unique contributors, average contribution, summary coverage
  Outcome — desired outcomes, confirmation rate, outcome-status distribution

Computed from ResponseMeta / DesiredOutcome / ResponseSummary. Every function is
DB-error-guarded (mirrors cube1/cube2/cube7 metrics): a DB error returns a zeroed
default with `metrics_unavailable=True` rather than 500-ing.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.desired_outcome import DesiredOutcome
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary

logger = structlog.get_logger(__name__)

_DEFAULT_SYSTEM = {
    "total_responses": 0,
    "text_responses": 0,
    "voice_responses": 0,
    "flagged_responses": 0,
    "metrics_unavailable": True,
}
_DEFAULT_USER = {
    "unique_contributors": 0,
    "avg_responses_per_contributor": 0.0,
    "summary_coverage_pct": 0.0,
    "metrics_unavailable": True,
}
_DEFAULT_OUTCOME = {
    "desired_outcomes": 0,
    "confirmed_outcomes": 0,
    "confirmation_rate_pct": 0.0,
    "outcome_status_distribution": {},
    "metrics_unavailable": True,
}


def _safe_pct(n: float, d: float) -> float:
    return (n / d * 100) if d > 0 else 0.0


async def get_system_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """System: collected volume, text/voice split, flagged rate."""
    try:
        rows = (await db.execute(
            select(ResponseMeta.source, ResponseMeta.is_flagged).where(
                ResponseMeta.session_id == session_id
            )
        )).all()
        total = len(rows)
        text = sum(1 for r in rows if r.source == "text")
        voice = sum(1 for r in rows if r.source == "voice")
        flagged = sum(1 for r in rows if r.is_flagged)
        return {
            "total_responses": total,
            "text_responses": text,
            "voice_responses": voice,
            "flagged_responses": flagged,
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube4.metrics.system_unavailable", error=str(exc))
        return dict(_DEFAULT_SYSTEM)


async def get_user_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """User: unique contributors, average contribution, summary coverage."""
    try:
        total = (await db.execute(
            select(func.count()).select_from(ResponseMeta).where(
                ResponseMeta.session_id == session_id
            )
        )).scalar() or 0
        unique = (await db.execute(
            select(func.count(func.distinct(ResponseMeta.participant_id))).where(
                ResponseMeta.session_id == session_id
            )
        )).scalar() or 0
        summarized = (await db.execute(
            select(func.count()).select_from(ResponseSummary).where(
                ResponseSummary.session_id == session_id
            )
        )).scalar() or 0
        return {
            "unique_contributors": int(unique),
            "avg_responses_per_contributor": round(total / unique, 2) if unique else 0.0,
            "summary_coverage_pct": round(_safe_pct(summarized, total), 2),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube4.metrics.user_unavailable", error=str(exc))
        return dict(_DEFAULT_USER)


async def get_outcome_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Outcome: desired outcomes, confirmation rate, status distribution."""
    try:
        rows = (await db.execute(
            select(DesiredOutcome).where(DesiredOutcome.session_id == session_id)
        )).scalars().all()
        total = len(rows)
        confirmed = sum(1 for o in rows if o.all_confirmed)
        dist: dict[str, int] = {}
        for o in rows:
            dist[o.outcome_status] = dist.get(o.outcome_status, 0) + 1
        return {
            "desired_outcomes": total,
            "confirmed_outcomes": confirmed,
            "confirmation_rate_pct": round(_safe_pct(confirmed, total), 2),
            "outcome_status_distribution": dist,
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube4.metrics.outcome_unavailable", error=str(exc))
        return dict(_DEFAULT_OUTCOME)


async def get_all_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Combined System / User / Outcome roll-up for Cube 10 comparison."""
    return {
        "cube": "cube4_collector",
        "system": await get_system_metrics(db, session_id),
        "user": await get_user_metrics(db, session_id),
        "outcome": await get_outcome_metrics(db, session_id),
    }
