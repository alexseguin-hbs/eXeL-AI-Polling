"""Cube 5 — Metrics (System / User / Outcome).

R-Core parity: gives the Gateway/Orchestrator (grid CENTER) the same SSSES metrics
surface Cubes 1/2/3/4/7 expose, so the Dev-Sim / qualification gateway can compare a
candidate orchestrator against production baselines on the same three axes:

  System  — pipeline triggers fired, completion state, failures, distinct pipeline types
  User    — unique participants tracked + total active minutes (time-tracking core)
  Outcome — SoI Trinity token totals (♡ 웃 ◬) + pipeline completion rate

Computed from PipelineTrigger / TimeEntry (the two things Cube 5 authoritatively writes).
Every function is DB-error-guarded (mirrors cube1/cube2/cube7 metrics): a DB error
returns a zeroed default with `metrics_unavailable=True` rather than 500-ing.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pipeline_trigger import PipelineTrigger
from app.models.time_tracking import TimeEntry

logger = structlog.get_logger(__name__)

_DEFAULT_SYSTEM = {
    "pipeline_triggers": 0,
    "completed_triggers": 0,
    "failed_triggers": 0,
    "pipeline_types": 0,
    "metrics_unavailable": True,
}
_DEFAULT_USER = {
    "unique_participants": 0,
    "total_active_min": 0.0,
    "metrics_unavailable": True,
}
_DEFAULT_OUTCOME = {
    "heart_tokens": 0.0,
    "human_tokens": 0.0,
    "unity_tokens": 0.0,
    "pipeline_completion_rate": 0.0,
    "metrics_unavailable": True,
}


def _safe_pct(n: float, d: float) -> float:
    return round(n / d * 100, 2) if d > 0 else 0.0


async def get_system_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """System: pipeline trigger volume, completion state, failures, distinct types."""
    try:
        rows = (await db.execute(
            select(PipelineTrigger).where(PipelineTrigger.session_id == session_id)
        )).scalars().all()
        return {
            "pipeline_triggers": len(rows),
            "completed_triggers": sum(1 for r in rows if r.status == "completed"),
            "failed_triggers": sum(1 for r in rows if r.status == "failed"),
            "pipeline_types": len({r.trigger_type for r in rows}),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube5.metrics.system_unavailable", error=str(exc))
        return dict(_DEFAULT_SYSTEM)


async def get_user_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """User: unique participants tracked + total active minutes (single SQL aggregate)."""
    try:
        agg = (await db.execute(
            select(
                func.coalesce(func.sum(TimeEntry.duration_seconds), 0.0).label("total_seconds"),
                func.count(func.distinct(TimeEntry.participant_id)).label("user_count"),
            ).where(TimeEntry.session_id == session_id)
        )).one()
        return {
            "unique_participants": int(agg.user_count),
            "total_active_min": round(float(agg.total_seconds) / 60.0, 4),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube5.metrics.user_unavailable", error=str(exc))
        return dict(_DEFAULT_USER)


async def get_outcome_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Outcome: SoI Trinity token totals (♡ 웃 ◬) + pipeline completion rate."""
    try:
        agg = (await db.execute(
            select(
                func.coalesce(func.sum(TimeEntry.heart_tokens_earned), 0.0).label("heart"),
                func.coalesce(func.sum(TimeEntry.human_tokens_earned), 0.0).label("human"),
                func.coalesce(func.sum(TimeEntry.unity_tokens_earned), 0.0).label("unity"),
            ).where(TimeEntry.session_id == session_id)
        )).one()
        triggers = (await db.execute(
            select(PipelineTrigger).where(PipelineTrigger.session_id == session_id)
        )).scalars().all()
        completed = sum(1 for r in triggers if r.status == "completed")
        return {
            "heart_tokens": round(float(agg.heart), 4),
            "human_tokens": round(float(agg.human), 4),
            "unity_tokens": round(float(agg.unity), 4),
            "pipeline_completion_rate": _safe_pct(completed, len(triggers)),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube5.metrics.outcome_unavailable", error=str(exc))
        return dict(_DEFAULT_OUTCOME)


async def get_all_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Combined System / User / Outcome roll-up for Cube 10 comparison."""
    return {
        "cube": "cube5_gateway",
        "system": await get_system_metrics(db, session_id),
        "user": await get_user_metrics(db, session_id),
        "outcome": await get_outcome_metrics(db, session_id),
    }
