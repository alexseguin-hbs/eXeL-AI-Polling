"""Cube 7 — Metrics (System / User / Outcome).

R-Core parity: gives Cube 7 the same SSSES metrics surface Cubes 1/2/3 expose, so
the Dev-Sim / qualification gateway can compare a candidate ranking engine against
production baselines on the same three axes:

  System  — ranking submissions, aggregated themes, algorithm, finality, overrides
  User    — unique rankers, average ballot completeness
  Outcome — winner determined, top-theme confidence, governance overrides, determinism

Computed from Ranking / AggregatedRanking / GovernanceOverride. Every function is
DB-error-guarded (mirrors cube1/cube2 metrics): a DB error returns a zeroed default
with `metrics_unavailable=True` rather than 500-ing.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ranking import AggregatedRanking, GovernanceOverride, Ranking

logger = structlog.get_logger(__name__)

_DEFAULT_SYSTEM = {
    "ranking_submissions": 0,
    "aggregated_themes": 0,
    "algorithm": None,
    "has_final_aggregation": False,
    "governance_overrides": 0,
    "metrics_unavailable": True,
}
_DEFAULT_USER = {
    "unique_rankers": 0,
    "avg_ballot_completeness": 0.0,
    "metrics_unavailable": True,
}
_DEFAULT_OUTCOME = {
    "winner_determined": False,
    "top_theme_confidence": 0.0,
    "governance_overridden": False,
    "determinism_ready": False,
    "metrics_unavailable": True,
}


def _safe_pct(n: float, d: float) -> float:
    return (n / d * 100) if d > 0 else 0.0


async def get_system_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """System: submission volume, aggregation state, algorithm, overrides."""
    try:
        submissions = (await db.execute(
            select(func.count()).select_from(Ranking).where(Ranking.session_id == session_id)
        )).scalar() or 0
        agg_rows = (await db.execute(
            select(AggregatedRanking).where(AggregatedRanking.session_id == session_id)
        )).scalars().all()
        overrides = (await db.execute(
            select(func.count()).select_from(GovernanceOverride).where(
                GovernanceOverride.session_id == session_id
            )
        )).scalar() or 0
        algorithm = agg_rows[0].algorithm if agg_rows else None
        return {
            "ranking_submissions": int(submissions),
            "aggregated_themes": len(agg_rows),
            "algorithm": algorithm,
            "has_final_aggregation": any(r.is_final for r in agg_rows),
            "governance_overrides": int(overrides),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube7.metrics.system_unavailable", error=str(exc))
        return dict(_DEFAULT_SYSTEM)


async def get_user_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """User: unique participants who ranked + average ballot completeness."""
    try:
        rows = (await db.execute(
            select(Ranking).where(Ranking.session_id == session_id)
        )).scalars().all()
        participants = {str(r.participant_id) for r in rows}
        lengths = []
        for r in rows:
            ids = r.ranked_theme_ids
            if isinstance(ids, list):
                lengths.append(len(ids))
            elif isinstance(ids, dict) and isinstance(ids.get("ranked_theme_ids"), list):
                lengths.append(len(ids["ranked_theme_ids"]))
        avg_completeness = round(sum(lengths) / len(lengths), 2) if lengths else 0.0
        return {
            "unique_rankers": len(participants),
            "avg_ballot_completeness": avg_completeness,
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube7.metrics.user_unavailable", error=str(exc))
        return dict(_DEFAULT_USER)


async def get_outcome_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Outcome: winner, top-theme confidence, governance overrides, determinism."""
    try:
        agg_rows = (await db.execute(
            select(AggregatedRanking).where(AggregatedRanking.session_id == session_id)
        )).scalars().all()
        overrides = (await db.execute(
            select(func.count()).select_from(GovernanceOverride).where(
                GovernanceOverride.session_id == session_id
            )
        )).scalar() or 0
        winner = next((r for r in agg_rows if r.is_top_theme2), None)
        return {
            "winner_determined": winner is not None,
            "top_theme_confidence": round(winner.confidence_avg, 4) if winner else 0.0,
            "governance_overridden": int(overrides) > 0,
            "determinism_ready": bool(agg_rows and agg_rows[0].algorithm),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube7.metrics.outcome_unavailable", error=str(exc))
        return dict(_DEFAULT_OUTCOME)


async def get_all_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Combined System / User / Outcome roll-up for Cube 10 comparison."""
    return {
        "cube": "cube7_ranking",
        "system": await get_system_metrics(db, session_id),
        "user": await get_user_metrics(db, session_id),
        "outcome": await get_outcome_metrics(db, session_id),
    }
