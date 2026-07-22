"""Cube 8 — Metrics (System / User / Outcome).

R-Core parity: gives the Token Ledger / Reward Calculator the same SSSES metrics
triad Cubes 1/2/3/4/5/6/7 expose, so the Dev-Sim / qualification gateway can baseline
a candidate token engine on the same three axes:

  System  — append-only ledger volume, distinct action types, lifecycle distribution
  User    — unique earners + total/average ♡ 웃 ◬ per user
  Outcome — outcome-status distribution (achieved/…), finalized rate, open disputes

Computed from the append-only TokenLedger + TokenDispute. Every function is
DB-error-guarded (mirrors cube1/2/4/5/6/7 metrics): a DB error returns a zeroed
default with `metrics_unavailable=True` rather than 500-ing.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.token_ledger import TokenDispute, TokenLedger

logger = structlog.get_logger(__name__)

_DEFAULT_SYSTEM = {
    "ledger_entries": 0,
    "action_types": 0,
    "finalized_entries": 0,
    "by_lifecycle": {},
    "metrics_unavailable": True,
}
_DEFAULT_USER = {
    "unique_earners": 0,
    "total_heart": 0.0,
    "total_human": 0.0,
    "total_unity": 0.0,
    "avg_unity_per_user": 0.0,
    "metrics_unavailable": True,
}
_DEFAULT_OUTCOME = {
    "by_outcome_status": {},
    "finalized_rate": 0.0,
    "open_disputes": 0,
    "metrics_unavailable": True,
}


def _pct(n: float, d: float) -> float:
    return round(n / d * 100, 2) if d > 0 else 0.0


async def get_system_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """System: append-only ledger volume, action types, lifecycle distribution."""
    try:
        rows = (await db.execute(
            select(TokenLedger).where(TokenLedger.session_id == session_id)
        )).scalars().all()
        by_lifecycle: dict[str, int] = {}
        for r in rows:
            by_lifecycle[r.lifecycle_state] = by_lifecycle.get(r.lifecycle_state, 0) + 1
        return {
            "ledger_entries": len(rows),
            "action_types": len({r.action_type for r in rows if r.action_type}),
            "finalized_entries": by_lifecycle.get("finalized", 0),
            "by_lifecycle": by_lifecycle,
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube8.metrics.system_unavailable", error=str(exc))
        return dict(_DEFAULT_SYSTEM)


async def get_user_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """User: unique earners + total/average SoI Trinity tokens (single SQL aggregate)."""
    try:
        agg = (await db.execute(
            select(
                func.coalesce(func.sum(TokenLedger.delta_heart), 0.0).label("heart"),
                func.coalesce(func.sum(TokenLedger.delta_human), 0.0).label("human"),
                func.coalesce(func.sum(TokenLedger.delta_unity), 0.0).label("unity"),
                func.count(func.distinct(TokenLedger.user_id)).label("earners"),
            ).where(TokenLedger.session_id == session_id)
        )).one()
        earners = int(agg.earners)
        unity = float(agg.unity)
        return {
            "unique_earners": earners,
            "total_heart": round(float(agg.heart), 3),
            "total_human": round(float(agg.human), 3),
            "total_unity": round(unity, 3),
            "avg_unity_per_user": round(unity / earners, 3) if earners else 0.0,
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube8.metrics.user_unavailable", error=str(exc))
        return dict(_DEFAULT_USER)


async def get_outcome_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Outcome: outcome-status distribution, finalized rate, open disputes."""
    try:
        rows = (await db.execute(
            select(TokenLedger).where(TokenLedger.session_id == session_id)
        )).scalars().all()
        by_status: dict[str, int] = {}
        for r in rows:
            if r.outcome_status:
                by_status[r.outcome_status] = by_status.get(r.outcome_status, 0) + 1
        finalized = sum(1 for r in rows if r.lifecycle_state == "finalized")
        open_disputes = (await db.execute(
            select(func.count()).select_from(TokenDispute).join(
                TokenLedger, TokenDispute.ledger_entry_id == TokenLedger.id
            ).where(TokenLedger.session_id == session_id, TokenDispute.status == "open")
        )).scalar() or 0
        return {
            "by_outcome_status": by_status,
            "finalized_rate": _pct(finalized, len(rows)),
            "open_disputes": int(open_disputes),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube8.metrics.outcome_unavailable", error=str(exc))
        return dict(_DEFAULT_OUTCOME)


async def get_all_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Combined System / User / Outcome roll-up for Cube 10 comparison."""
    return {
        "cube": "cube8_tokens",
        "system": await get_system_metrics(db, session_id),
        "user": await get_user_metrics(db, session_id),
        "outcome": await get_outcome_metrics(db, session_id),
    }
