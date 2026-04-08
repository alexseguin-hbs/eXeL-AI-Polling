"""Cube 7 — Prioritization & Voting: Ranking service.

Implements:
  - submit_user_ranking: Validate + store participant ranking
  - aggregate_rankings: Borda count with seeded deterministic tie-breaking
  - identify_top_theme2: Mark #1 voted theme with is_top_theme2=True
  - emit_ranking_complete: Broadcast ranking_complete + trigger CQS pipeline
  - get_live_rankings: Fetch current aggregated state for live display
  - detect_voting_anomalies: Anti-sybil pattern detection on submissions

CRS: 11, 12, 13, 16, 17, 22
"""

from __future__ import annotations

import hashlib
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ranking import AggregatedRanking, Ranking
from app.models.theme import Theme

logger = logging.getLogger("cube7")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_ANOMALY_WINDOW_SEC = 2.0  # Flag identical rankings within this window
_ANOMALY_MIN_DUPLICATES = 3  # Minimum identical submissions to flag
_MAX_SUBMISSIONS_PER_MINUTE = 10  # Per-participant rate limit


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
) -> Ranking:
    """CRS-11.02: Validate theme IDs against session voting level, store ranking.

    Rules:
      - All theme_ids must exist in themes table for this session + level
      - Duplicate submissions for (session, cycle, participant) are rejected
      - ranked_theme_ids must contain exactly the themes at the selected level
    """
    # 1. Fetch valid theme IDs at the voting level
    level_num = theme2_voting_level.replace("theme2_", "")
    result = await db.execute(
        select(Theme.id).where(
            and_(
                Theme.session_id == session_id,
                Theme.parent_theme_id.isnot(None),  # Child themes only
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

    logger.info(
        "cube7.ranking.submitted",
        extra={
            "session_id": str(session_id),
            "participant_id": str(participant_id),
            "theme_count": len(ranked_theme_ids),
        },
    )
    return ranking


# ---------------------------------------------------------------------------
# CRS-12: Deterministic Aggregation (Borda Count)
# ---------------------------------------------------------------------------


def _borda_scores(
    rankings: list[list[str]],
    n_themes: int,
) -> dict[str, float]:
    """Compute Borda count scores.

    Position 0 (top) gets n_themes-1 points, position 1 gets n_themes-2, etc.
    """
    scores: dict[str, float] = {}
    for ranked_ids in rankings:
        for position, theme_id in enumerate(ranked_ids):
            points = n_themes - 1 - position
            scores[theme_id] = scores.get(theme_id, 0.0) + points
    return scores


def _seeded_tiebreak_key(theme_id: str, seed: str) -> str:
    """Deterministic tie-breaking using SHA-256(theme_id + seed).

    Ensures identical inputs always produce identical ordering.
    """
    return hashlib.sha256(f"{theme_id}:{seed}".encode()).hexdigest()


def _compute_replay_hash(
    rankings: list[list[str]],
    seed: str,
    algorithm: str = "borda_count",
) -> str:
    """SHA-256 replay hash over inputs + parameters for determinism verification."""
    payload = f"{algorithm}:{seed}:" + "|".join(
        ",".join(r) for r in sorted(rankings)
    )
    return hashlib.sha256(payload.encode()).hexdigest()


async def aggregate_rankings(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
    seed: str | None = None,
) -> list[AggregatedRanking]:
    """CRS-12.01: Borda count with seeded tie-breaking.

    Steps:
      1. Fetch all user_rankings for session + cycle
      2. Compute Borda scores
      3. Sort by score DESC, then deterministic tiebreak
      4. Clear previous aggregated_rankings for this cycle
      5. Write new aggregated_rankings (1 row per theme)
      6. Return ordered list
    """
    # 1. Fetch user rankings
    result = await db.execute(
        select(Ranking).where(
            and_(
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,
            )
        )
    )
    user_rankings = result.scalars().all()

    if not user_rankings:
        raise ValueError(
            f"No rankings found for session {session_id} cycle {cycle_id}"
        )

    # Extract ranked_theme_ids lists
    all_rankings: list[list[str]] = []
    for ur in user_rankings:
        ids = ur.ranked_theme_ids
        if isinstance(ids, list):
            all_rankings.append(ids)
        elif isinstance(ids, dict) and "ranked_theme_ids" in ids:
            all_rankings.append(ids["ranked_theme_ids"])

    n_themes = len(all_rankings[0]) if all_rankings else 0
    participant_count = len(all_rankings)

    # Use session_id as default seed for determinism
    effective_seed = seed or str(session_id)

    # 2. Compute Borda scores
    scores = _borda_scores(all_rankings, n_themes)

    # 3. Sort: score DESC, then deterministic tiebreak ASC
    sorted_themes = sorted(
        scores.items(),
        key=lambda item: (-item[1], _seeded_tiebreak_key(item[0], effective_seed)),
    )

    # 4. Compute replay hash
    replay_hash = _compute_replay_hash(all_rankings, effective_seed)

    # 5. Clear previous aggregation for this cycle
    await db.execute(
        delete(AggregatedRanking).where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
            )
        )
    )

    # 6. Write new aggregated rankings
    now = datetime.now(timezone.utc)
    aggregated: list[AggregatedRanking] = []

    for rank_pos, (theme_id_str, score) in enumerate(sorted_themes, start=1):
        # Count how many participants ranked this theme
        vote_count = sum(
            1 for r in all_rankings if theme_id_str in r
        )

        agg = AggregatedRanking(
            session_id=session_id,
            cycle_id=cycle_id,
            theme_id=uuid.UUID(theme_id_str),
            rank_position=rank_pos,
            score=score,
            vote_count=vote_count,
            is_top_theme2=False,  # Set by identify_top_theme2
            participant_count=participant_count,
            algorithm="borda_count",
            is_final=True,
            aggregated_at=now,
        )
        db.add(agg)
        aggregated.append(agg)

    await db.flush()

    logger.info(
        "cube7.ranking.aggregated",
        extra={
            "session_id": str(session_id),
            "cycle_id": cycle_id,
            "participant_count": participant_count,
            "theme_count": len(sorted_themes),
            "replay_hash": replay_hash,
        },
    )
    return aggregated


# ---------------------------------------------------------------------------
# CRS-11.03: Identify Top Theme2
# ---------------------------------------------------------------------------


async def identify_top_theme2(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
) -> AggregatedRanking | None:
    """Set is_top_theme2=True on the #1 ranked theme.

    Clears any previous is_top_theme2 flags for this session/cycle first.
    Returns the winning AggregatedRanking row.
    """
    # Clear previous winner flags
    await db.execute(
        update(AggregatedRanking)
        .where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
                AggregatedRanking.is_top_theme2.is_(True),
            )
        )
        .values(is_top_theme2=False)
    )

    # Find rank_position=1
    result = await db.execute(
        select(AggregatedRanking).where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
                AggregatedRanking.rank_position == 1,
            )
        )
    )
    winner = result.scalar_one_or_none()

    if winner:
        winner.is_top_theme2 = True
        await db.flush()
        logger.info(
            "cube7.ranking.top_theme2_identified",
            extra={
                "session_id": str(session_id),
                "theme_id": str(winner.theme_id),
                "score": winner.score,
            },
        )

    return winner


# ---------------------------------------------------------------------------
# CRS-11.04: Emit Ranking Complete
# ---------------------------------------------------------------------------


async def emit_ranking_complete(
    db: AsyncSession,
    session_id: uuid.UUID,
    session_short_code: str,
    cycle_id: int = 1,
) -> dict:
    """Broadcast ranking_complete event + trigger CQS scoring via Cube 5.

    Fires within 500ms of aggregation. Payload includes top_theme2_id.
    """
    # Get the top theme
    result = await db.execute(
        select(AggregatedRanking).where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
                AggregatedRanking.is_top_theme2.is_(True),
            )
        )
    )
    winner = result.scalar_one_or_none()
    top_theme2_id = str(winner.theme_id) if winner else None

    # Get the theme label for CQS
    top_theme2_label = None
    if winner:
        theme_result = await db.execute(
            select(Theme.label).where(Theme.id == winner.theme_id)
        )
        top_theme2_label = theme_result.scalar_one_or_none()

    # Broadcast ranking_complete
    try:
        from app.core.supabase_broadcast import broadcast_event

        await broadcast_event(
            channel=f"session:{session_short_code}",
            event="ranking_complete",
            payload={
                "session_id": str(session_id),
                "top_theme2_id": top_theme2_id,
                "top_theme2_label": top_theme2_label,
                "cycle_id": cycle_id,
            },
        )
        logger.info(
            "cube7.ranking_complete.broadcast",
            extra={
                "session_id": str(session_id),
                "top_theme2_id": top_theme2_id,
            },
        )
    except Exception as exc:
        logger.warning(
            "cube7.ranking_complete.broadcast_failed",
            extra={"session_id": str(session_id), "error": str(exc)},
        )

    # Trigger CQS scoring via Cube 5
    try:
        from app.cubes.cube5_gateway.service import trigger_cqs_scoring

        await trigger_cqs_scoring(db, session_id, top_theme2_id=top_theme2_id)
        logger.info(
            "cube7.cqs.triggered",
            extra={"session_id": str(session_id), "top_theme2_id": top_theme2_id},
        )
    except Exception as exc:
        logger.warning(
            "cube7.cqs.trigger_failed",
            extra={"session_id": str(session_id), "error": str(exc)},
        )

    return {
        "session_id": str(session_id),
        "top_theme2_id": top_theme2_id,
        "top_theme2_label": top_theme2_label,
        "cycle_id": cycle_id,
        "status": "ranking_complete",
    }


# ---------------------------------------------------------------------------
# CRS-16/17: Get Live Rankings
# ---------------------------------------------------------------------------


async def get_live_rankings(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
) -> list[AggregatedRanking]:
    """Return current aggregated rankings ordered by rank_position.

    Used for live display (MVP1: HTTP poll, MVP2: WebSocket push).
    """
    result = await db.execute(
        select(AggregatedRanking)
        .where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
            )
        )
        .order_by(AggregatedRanking.rank_position)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# CRS-12.04: Anomaly Detection (Anti-Sybil)
# ---------------------------------------------------------------------------


async def detect_voting_anomalies(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
) -> list[dict]:
    """Flag coordinated / suspicious voting patterns.

    Checks:
      1. Identical ranked_theme_ids from >=3 participants within 2s window
      2. Rapid-fire submissions (>10 per participant per minute)

    Returns list of anomaly records for audit trail.
    """
    result = await db.execute(
        select(Ranking)
        .where(
            and_(
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,
            )
        )
        .order_by(Ranking.submitted_at)
    )
    rankings = list(result.scalars().all())

    anomalies: list[dict] = []

    # --- Check 1: Identical rankings within time window ---
    # Group by serialized ranked_theme_ids
    ranking_groups: dict[str, list[Ranking]] = {}
    for r in rankings:
        key = str(r.ranked_theme_ids)
        ranking_groups.setdefault(key, []).append(r)

    for key, group in ranking_groups.items():
        if len(group) < _ANOMALY_MIN_DUPLICATES:
            continue
        # Check time window between first and last in group
        timestamps = sorted(r.submitted_at for r in group)
        for i in range(len(timestamps) - _ANOMALY_MIN_DUPLICATES + 1):
            window_start = timestamps[i]
            window_end = timestamps[i + _ANOMALY_MIN_DUPLICATES - 1]
            delta = (window_end - window_start).total_seconds()
            if delta <= _ANOMALY_WINDOW_SEC:
                anomalies.append({
                    "type": "identical_ranking_burst",
                    "ranking_key": key,
                    "count": _ANOMALY_MIN_DUPLICATES,
                    "window_seconds": delta,
                    "participant_ids": [
                        str(group[j].participant_id)
                        for j in range(i, i + _ANOMALY_MIN_DUPLICATES)
                    ],
                })
                break  # One anomaly per group is sufficient

    # --- Check 2: Rapid submissions per participant ---
    from collections import defaultdict
    participant_times: dict[str, list[datetime]] = defaultdict(list)
    for r in rankings:
        participant_times[str(r.participant_id)].append(r.submitted_at)

    for pid, times in participant_times.items():
        if len(times) > _MAX_SUBMISSIONS_PER_MINUTE:
            sorted_times = sorted(times)
            # Check any 1-minute window
            for i in range(len(sorted_times) - _MAX_SUBMISSIONS_PER_MINUTE):
                window = (
                    sorted_times[i + _MAX_SUBMISSIONS_PER_MINUTE] - sorted_times[i]
                ).total_seconds()
                if window <= 60.0:
                    anomalies.append({
                        "type": "rapid_submissions",
                        "participant_id": pid,
                        "count": _MAX_SUBMISSIONS_PER_MINUTE + 1,
                        "window_seconds": window,
                    })
                    break

    if anomalies:
        logger.warning(
            "cube7.anomaly.detected",
            extra={
                "session_id": str(session_id),
                "anomaly_count": len(anomalies),
            },
        )

    return anomalies


# ---------------------------------------------------------------------------
# Full Ranking Pipeline (orchestrator)
# ---------------------------------------------------------------------------


async def run_ranking_pipeline(
    db: AsyncSession,
    session_id: uuid.UUID,
    session_short_code: str,
    cycle_id: int = 1,
    seed: str | None = None,
) -> dict:
    """Full ranking pipeline: aggregate → identify top → detect anomalies → emit.

    Called by Cube 5 after all participants have submitted rankings
    (or after moderator triggers manual aggregation).
    """
    # 1. Aggregate
    aggregated = await aggregate_rankings(db, session_id, cycle_id, seed)

    # 2. Identify top theme
    winner = await identify_top_theme2(db, session_id, cycle_id)

    # 3. Detect anomalies (non-blocking — log only)
    anomalies = await detect_voting_anomalies(db, session_id, cycle_id)

    # 4. Emit ranking complete + trigger CQS
    emit_result = await emit_ranking_complete(
        db, session_id, session_short_code, cycle_id
    )

    await db.commit()

    return {
        "session_id": str(session_id),
        "cycle_id": cycle_id,
        "theme_count": len(aggregated),
        "participant_count": aggregated[0].participant_count if aggregated else 0,
        "top_theme2_id": emit_result.get("top_theme2_id"),
        "top_theme2_label": emit_result.get("top_theme2_label"),
        "anomaly_count": len(anomalies),
        "anomalies": anomalies,
        "status": "ranking_complete",
    }
