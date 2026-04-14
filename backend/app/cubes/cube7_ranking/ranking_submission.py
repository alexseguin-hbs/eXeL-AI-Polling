"""Cube 7 — Ranking Submission: Validate + store + broadcast.

Split from service.py for Succinctness (G13 gap fix, 2026-04-14).
"""
from __future__ import annotations

import hashlib
import logging
import math
import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ranking import AggregatedRanking, GovernanceOverride, Ranking
from app.models.theme import Theme

logger = logging.getLogger("cube7")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_ANOMALY_WINDOW_SEC = 2.0
_ANOMALY_MIN_DUPLICATES = 3
_MAX_SUBMISSIONS_PER_MINUTE = 10
_INFLUENCE_CAP = 0.15  # No single user > 15% of total governance weight
_MIN_JUSTIFICATION_LEN = 10


# ---------------------------------------------------------------------------
# CRS-11: Submit User Ranking
# ---------------------------------------------------------------------------


async def submit_user_ranking(
    db: AsyncSession,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    ranked_theme_ids: list[uuid.UUID],
    cycle_id: int = 1,
    theme2_voting_level: str = "theme2_3",
    session_short_code: str | None = None,
) -> Ranking:
    """CRS-11.02: Validate theme IDs, store ranking, broadcast progress."""
    # 1. Fetch valid theme IDs at the voting level
    level_num = theme2_voting_level.replace("theme2_", "")
    result = await db.execute(
        select(Theme.id).where(
            and_(
                Theme.session_id == session_id,
                Theme.parent_theme_id.isnot(None),
                Theme.cluster_metadata["level"].as_string() == level_num,
            )
        )
    )
    valid_ids = {row[0] for row in result.all()}

    if not valid_ids:
        raise ValueError(
            f"No themes found at level {level_num} for session {session_id}"
        )

    submitted_set = set(ranked_theme_ids)
    if submitted_set != valid_ids:
        missing = valid_ids - submitted_set
        extra = submitted_set - valid_ids
        raise ValueError(
            f"Theme ID mismatch: missing={missing}, extra={extra}. "
            f"Expected {len(valid_ids)} themes at level {level_num}."
        )

    # 2. Check duplicate submission
    existing = await db.execute(
        select(Ranking.id).where(
            and_(
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,
                Ranking.participant_id == participant_id,
            )
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ValueError(
            f"Participant {participant_id} already submitted ranking for "
            f"session {session_id} cycle {cycle_id}"
        )

    # 3. Store ranking
    ranking = Ranking(
        session_id=session_id,
        cycle_id=cycle_id,
        participant_id=participant_id,
        ranked_theme_ids=[str(tid) for tid in ranked_theme_ids],
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(ranking)
    await db.flush()
    await db.refresh(ranking)

    # 4. Broadcast submission progress (CRS-16: live ranking updates)
    if session_short_code:
        await _broadcast_ranking_progress(db, session_id, session_short_code, cycle_id)

    logger.info(
        "cube7.ranking.submitted",
        extra={
            "session_id": str(session_id),
            "participant_id": str(participant_id),
            "theme_count": len(ranked_theme_ids),
        },
    )
    return ranking


async def _broadcast_ranking_progress(
    db: AsyncSession,
    session_id: uuid.UUID,
    short_code: str,
    cycle_id: int,
) -> None:
    """CRS-17: Broadcast ranking_progress after each submission."""
    try:
        count_result = await db.execute(
            select(func.count()).select_from(Ranking).where(
                and_(
                    Ranking.session_id == session_id,
                    Ranking.cycle_id == cycle_id,
                )
            )
        )
        submission_count = count_result.scalar() or 0

        from app.core.supabase_broadcast import broadcast_event

        await broadcast_event(
            channel=f"session:{short_code}",
            event="ranking_progress",
            payload={
                "session_id": str(session_id),
                "submissions": submission_count,
                "cycle_id": cycle_id,
            },
        )
    except Exception as exc:
        logger.debug(
            "cube7.ranking_progress.broadcast_failed",
            extra={"error": str(exc)},
        )

