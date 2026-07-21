"""Cube 1 — Metrics (System / User / Outcome).

CC-5 (R-Core compliance): gives Cube 1 the same SSSES metrics surface Cube 2 and
Cube 3 already expose, so the Dev-Sim / qualification gateway can compare a
candidate Cube 1 against production baselines on the same three axes:

  System  — participants, active presence, determinism readiness, transitions
  User    — anonymous vs identified, results opt-in, device/language mix
  Outcome — capacity utilization, session state, replay-determinism, paid ratio

All metrics are computed from existing Postgres tables (Session, Participant,
AuditLog). Every function is DB-error-guarded (mirrors cube2_text.metrics): a DB
error returns a zeroed default with `metrics_unavailable=True` rather than 500-ing.
"""

import uuid

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.participant import Participant
from app.models.session import Session

logger = structlog.get_logger(__name__)

_DEFAULT_SYSTEM = {
    "total_participants": 0,
    "active_participants": 0,
    "transition_count": 0,
    "has_seed": False,
    "has_replay_hash": False,
    "metrics_unavailable": True,
}
_DEFAULT_USER = {
    "anonymous_participants": 0,
    "identified_participants": 0,
    "anonymous_ratio_pct": 0.0,
    "results_opt_in_rate_pct": 0.0,
    "device_distribution": {},
    "language_distribution": {},
    "metrics_unavailable": True,
}
_DEFAULT_OUTCOME = {
    "status": "unknown",
    "capacity_utilization_pct": 0.0,
    "replay_determinism_ready": False,
    "paid_participants": 0,
    "paid_ratio_pct": 0.0,
    "metrics_unavailable": True,
}


def _safe_pct(numerator: float, denominator: float) -> float:
    return (numerator / denominator * 100) if denominator > 0 else 0.0


async def _get_session(db: AsyncSession, session_id: uuid.UUID) -> Session | None:
    res = await db.execute(select(Session).where(Session.id == session_id))
    return res.scalar_one_or_none()


async def get_system_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """System: participant volume, live presence, determinism readiness, transitions."""
    try:
        s = await _get_session(db, session_id)
        total = (await db.execute(
            select(func.count()).select_from(Participant).where(Participant.session_id == session_id)
        )).scalar() or 0
        active = (await db.execute(
            select(func.count()).select_from(Participant).where(
                Participant.session_id == session_id, Participant.is_active.is_(True)
            )
        )).scalar() or 0
        transitions = (await db.execute(
            select(func.count()).select_from(AuditLog).where(AuditLog.session_id == session_id)
        )).scalar() or 0
        return {
            "total_participants": int(total),
            "active_participants": int(active),
            "transition_count": int(transitions),
            "has_seed": bool(s and s.seed),
            "has_replay_hash": bool(s and s.replay_hash),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001 — never 500 the metrics endpoint
        logger.warning("cube1.metrics.system_unavailable", error=str(exc))
        return dict(_DEFAULT_SYSTEM)


async def get_user_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """User: anonymity mix, results opt-in, device + language distribution."""
    try:
        rows = (await db.execute(
            select(Participant).where(Participant.session_id == session_id)
        )).scalars().all()
        total = len(rows)
        anon = sum(1 for p in rows if p.user_id is None)
        opt_in = sum(1 for p in rows if p.results_opt_in)
        devices: dict[str, int] = {}
        langs: dict[str, int] = {}
        for p in rows:
            devices[p.device_type or "unknown"] = devices.get(p.device_type or "unknown", 0) + 1
            langs[p.language_code or "en"] = langs.get(p.language_code or "en", 0) + 1
        return {
            "anonymous_participants": anon,
            "identified_participants": total - anon,
            "anonymous_ratio_pct": round(_safe_pct(anon, total), 2),
            "results_opt_in_rate_pct": round(_safe_pct(opt_in, total), 2),
            "device_distribution": devices,
            "language_distribution": langs,
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube1.metrics.user_unavailable", error=str(exc))
        return dict(_DEFAULT_USER)


async def get_outcome_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Outcome: capacity utilization, state, replay determinism, paid ratio."""
    try:
        s = await _get_session(db, session_id)
        total = (await db.execute(
            select(func.count()).select_from(Participant).where(Participant.session_id == session_id)
        )).scalar() or 0
        paid = (await db.execute(
            select(func.count()).select_from(Participant).where(
                Participant.session_id == session_id, Participant.payment_status == "paid"
            )
        )).scalar() or 0
        cap = s.max_participants if s and s.max_participants else 0
        return {
            "status": s.status if s else "unknown",
            "capacity_utilization_pct": round(_safe_pct(total, cap), 2) if cap else 0.0,
            "replay_determinism_ready": bool(s and s.replay_hash),
            "paid_participants": int(paid),
            "paid_ratio_pct": round(_safe_pct(paid, total), 2),
            "metrics_unavailable": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("cube1.metrics.outcome_unavailable", error=str(exc))
        return dict(_DEFAULT_OUTCOME)


async def get_all_metrics(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Combined System / User / Outcome roll-up for Cube 10 comparison."""
    return {
        "cube": "cube1_session",
        "system": await get_system_metrics(db, session_id),
        "user": await get_user_metrics(db, session_id),
        "outcome": await get_outcome_metrics(db, session_id),
    }
