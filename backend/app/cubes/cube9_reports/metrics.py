"""Cube 9 — Metrics (System / User / Outcome).

R-Core parity: gives Reports & Dashboards the same SSSES metrics triad Cubes 1-8 expose,
so the Dev-Sim / qualification gateway can baseline a candidate reporting engine:

  System  — exportable volume (responses), themes available, final ranking present
  User    — unique result-recipients + results-opt-in rate
  Outcome — winner determined, CQS scored, export governance-hash available

Computed from ResponseMeta / Theme / AggregatedRanking / CQSScore / Participant. Every
function is DB-error-guarded (mirrors cube7/8 metrics): a DB error returns a zeroed
default with `metrics_unavailable=True` rather than 500-ing.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cqs_score import CQSScore
from app.models.participant import Participant
from app.models.ranking import AggregatedRanking
from app.models.response_meta import ResponseMeta
from app.models.theme import Theme

logger = structlog.get_logger(__name__)

_DEFAULT_SYSTEM = {
    "exportable_responses": 0,
    "themes_available": 0,
    "has_final_ranking": False,
    "metrics_unavailable": True,
}
_DEFAULT_USER = {
    "result_recipients": 0,
    "participants": 0,
    "opt_in_rate": 0.0,
    "metrics_unavailable": True,
}
_DEFAULT_OUTCOME = {
    "winner_determined": False,
    "cqs_scored": 0,
    "export_hash_available": False,
    "metrics_unavailable": True,
}


def _pct(n: float, d: float) -> float:
    return round(n / d * 100, 2) if d > 0 else 0.0


async def get_system_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """System: exportable rows, themes available, final-ranking presence."""
    try:
        responses = (await db.execute(
            select(func.count()).select_from(ResponseMeta).where(
                ResponseMeta.session_id == session_id)
        )).scalar() or 0
        themes = (await db.execute(
            select(func.count()).select_from(Theme).where(Theme.session_id == session_id)
        )).scalar() or 0
        final = (await db.execute(
            select(func.count()).select_from(AggregatedRanking).where(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.is_final.is_(True),
            )
        )).scalar() or 0
        return {
            "exportable_responses": int(responses),
            "themes_available": int(themes),
            "has_final_ranking": int(final) > 0,
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube9.metrics.system_unavailable", error=str(exc))
        return dict(_DEFAULT_SYSTEM)


async def get_user_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """User: participants + how many opted into results (the report recipients)."""
    try:
        rows = (await db.execute(
            select(Participant).where(Participant.session_id == session_id)
        )).scalars().all()
        total = len(rows)
        recipients = sum(1 for p in rows if getattr(p, "results_opt_in", False))
        return {
            "result_recipients": recipients,
            "participants": total,
            "opt_in_rate": _pct(recipients, total),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube9.metrics.user_unavailable", error=str(exc))
        return dict(_DEFAULT_USER)


async def get_outcome_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Outcome: winner determined, CQS scored, export governance-hash available."""
    try:
        winner = (await db.execute(
            select(func.count()).select_from(AggregatedRanking).where(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.is_top_theme2.is_(True),
            )
        )).scalar() or 0
        cqs = (await db.execute(
            select(func.count()).select_from(CQSScore).where(
                CQSScore.session_id == session_id)
        )).scalar() or 0
        responses = (await db.execute(
            select(func.count()).select_from(ResponseMeta).where(
                ResponseMeta.session_id == session_id)
        )).scalar() or 0
        return {
            "winner_determined": int(winner) > 0,
            "cqs_scored": int(cqs),
            # An export (and thus its governance SHA-256) is derivable once rows exist.
            "export_hash_available": int(responses) > 0,
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube9.metrics.outcome_unavailable", error=str(exc))
        return dict(_DEFAULT_OUTCOME)


async def get_all_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Combined System / User / Outcome roll-up for Cube 10 comparison."""
    return {
        "cube": "cube9_reports",
        "system": await get_system_metrics(db, session_id),
        "user": await get_user_metrics(db, session_id),
        "outcome": await get_outcome_metrics(db, session_id),
    }
