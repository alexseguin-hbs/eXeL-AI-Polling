"""Cube 6 — Metrics (System / User / Outcome).

R-Core parity: gives the AI Theming Clusterer the same SSSES metrics triad Cubes
1/2/3/4/5/7 expose, so the Dev-Sim can baseline a candidate theming engine on the
same three axes:

  System  — pipeline output volume: themes generated, summaries generated, providers, cycles
  User    — reach: responses summarized, summary coverage, theme-assignment coverage
  Outcome — theming quality: Theme01 buckets, avg theme confidence, Theme02 completeness

Computed from Theme / ResponseSummary (what the two-phase pipeline authoritatively
writes). Every function is DB-error-guarded (mirrors cube1/2/4/5/7 metrics): a DB
error returns a zeroed default with `metrics_unavailable=True` rather than 500-ing.
"""

import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.response_summary import ResponseSummary
from app.models.theme import Theme

logger = structlog.get_logger(__name__)

_DEFAULT_SYSTEM = {
    "themes_generated": 0,
    "summaries_generated": 0,
    "ai_providers": 0,
    "cycles": 0,
    "metrics_unavailable": True,
}
_DEFAULT_USER = {
    "responses_summarized": 0,
    "summary_coverage_pct": 0.0,
    "theme_assigned_pct": 0.0,
    "metrics_unavailable": True,
}
_DEFAULT_OUTCOME = {
    "theme01_buckets": 0,
    "avg_theme_confidence": 0.0,
    "theme2_completeness_pct": 0.0,
    "metrics_unavailable": True,
}


def _pct(n: float, d: float) -> float:
    return round(n / d * 100, 2) if d > 0 else 0.0


async def get_system_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """System: pipeline output volume — themes, summaries, providers, cycles."""
    try:
        themes = (await db.execute(
            select(Theme).where(Theme.session_id == session_id)
        )).scalars().all()
        summaries = (await db.execute(
            select(ResponseSummary).where(ResponseSummary.session_id == session_id)
        )).scalars().all()
        providers = {t.ai_provider for t in themes if t.ai_provider} | {
            s.provider for s in summaries if s.provider
        }
        return {
            "themes_generated": len(themes),
            "summaries_generated": len(summaries),
            "ai_providers": len(providers),
            "cycles": len({t.cycle_id for t in themes}),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube6.metrics.system_unavailable", error=str(exc))
        return dict(_DEFAULT_SYSTEM)


async def get_user_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """User: reach — responses summarized + summary/theme-assignment coverage."""
    try:
        rows = (await db.execute(
            select(ResponseSummary).where(ResponseSummary.session_id == session_id)
        )).scalars().all()
        total = len(rows)
        summarized = sum(1 for r in rows if r.summary_33)
        theme_assigned = sum(1 for r in rows if r.theme01)
        return {
            "responses_summarized": total,
            "summary_coverage_pct": _pct(summarized, total),
            "theme_assigned_pct": _pct(theme_assigned, total),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube6.metrics.user_unavailable", error=str(exc))
        return dict(_DEFAULT_USER)


async def get_outcome_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Outcome: theming quality — Theme01 buckets, avg confidence, Theme02 completeness."""
    try:
        themes = (await db.execute(
            select(Theme).where(Theme.session_id == session_id)
        )).scalars().all()
        summaries = (await db.execute(
            select(ResponseSummary).where(ResponseSummary.session_id == session_id)
        )).scalars().all()
        confidences = [float(t.confidence) for t in themes if t.confidence is not None]
        avg_conf = round(sum(confidences) / len(confidences), 4) if confidences else 0.0
        buckets = {s.theme01 for s in summaries if s.theme01}
        theme2_done = sum(1 for s in summaries if s.theme2_3)
        return {
            "theme01_buckets": len(buckets),
            "avg_theme_confidence": avg_conf,
            "theme2_completeness_pct": _pct(theme2_done, len(summaries)),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube6.metrics.outcome_unavailable", error=str(exc))
        return dict(_DEFAULT_OUTCOME)


async def get_all_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Combined System / User / Outcome roll-up for Cube 10 comparison."""
    return {
        "cube": "cube6_ai",
        "system": await get_system_metrics(db, session_id),
        "user": await get_user_metrics(db, session_id),
        "outcome": await get_outcome_metrics(db, session_id),
    }
