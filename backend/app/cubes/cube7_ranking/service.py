"""Cube 7 — Prioritization & Voting: Ranking service.

Implements:
  - submit_user_ranking: Validate + store + broadcast submission count
  - aggregate_rankings: Borda count + quadratic normalization + seeded tiebreak
  - identify_top_theme2: Mark #1 voted theme with is_top_theme2=True
  - emit_ranking_complete: Broadcast ranking_complete + trigger CQS pipeline
  - get_live_rankings: Fetch current aggregated state for live display
  - detect_voting_anomalies: Anti-sybil pattern detection
  - apply_governance_override: Lead/Admin override with immutable audit trail
  - get_ranking_progress: Submission count vs total participants

CRS: 11, 12, 13, 16, 17, 22
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


# ---------------------------------------------------------------------------
# CRS-12.02: Quadratic Vote Normalization
# ---------------------------------------------------------------------------


def _quadratic_weights(
    participant_stakes: dict[str, float],
) -> dict[str, float]:
    """Compute quadratic vote weights: weight = sqrt(tokens_staked).

    Returns normalized weights (sum to 1.0) with influence cap at 15%.
    If no staking data, returns equal weights for all participants.
    """
    if not participant_stakes:
        return {}

    # Step 1: Raw quadratic weights
    raw: dict[str, float] = {}
    for pid, stake in participant_stakes.items():
        raw[pid] = math.sqrt(max(stake, 0.0))

    total_raw = sum(raw.values())
    if total_raw == 0:
        # Equal weights if no one staked
        n = len(raw)
        return {pid: 1.0 / n for pid in raw}

    # Step 2: Normalize
    normalized = {pid: w / total_raw for pid, w in raw.items()}

    # Step 3: Apply influence cap (iterative damping)
    capped = _apply_influence_cap(normalized)
    return capped


def _apply_influence_cap(
    weights: dict[str, float],
    cap: float = _INFLUENCE_CAP,
    max_iterations: int = 10,
) -> dict[str, float]:
    """Iteratively cap any user exceeding influence_cap and redistribute."""
    result = dict(weights)
    for _ in range(max_iterations):
        excess_total = 0.0
        uncapped_count = 0
        for pid, w in result.items():
            if w > cap:
                excess_total += w - cap
                result[pid] = cap
            else:
                uncapped_count += 1

        if excess_total == 0:
            break

        # Redistribute excess proportionally among uncapped
        if uncapped_count > 0:
            boost = excess_total / uncapped_count
            for pid in result:
                if result[pid] < cap:
                    result[pid] += boost

    # Final normalization
    total = sum(result.values())
    if total > 0:
        result = {pid: w / total for pid, w in result.items()}
    return result


# ---------------------------------------------------------------------------
# CRS-12: Deterministic Aggregation (Borda Count)
# ---------------------------------------------------------------------------


def _borda_scores(
    rankings: list[list[str]],
    n_themes: int,
) -> dict[str, float]:
    """Compute Borda count scores (unweighted).

    Position 0 (top) gets n_themes-1 points, position 1 gets n_themes-2, etc.
    """
    scores: dict[str, float] = {}
    for ranked_ids in rankings:
        for position, theme_id in enumerate(ranked_ids):
            points = n_themes - 1 - position
            scores[theme_id] = scores.get(theme_id, 0.0) + points
    return scores


def _weighted_borda_scores(
    rankings: list[list[str]],
    participant_ids: list[str],
    weights: dict[str, float],
    n_themes: int,
) -> dict[str, float]:
    """Compute Borda scores weighted by quadratic governance weights.

    Each participant's ranking contribution is multiplied by their normalized
    vote weight: score = sum(position_points * voter_weight) per theme.
    """
    scores: dict[str, float] = {}
    for ranked_ids, pid in zip(rankings, participant_ids):
        w = weights.get(pid, 1.0 / len(participant_ids))
        for position, theme_id in enumerate(ranked_ids):
            points = (n_themes - 1 - position) * w
            scores[theme_id] = scores.get(theme_id, 0.0) + points
    return scores


def _seeded_tiebreak_key(theme_id: str, seed: str) -> str:
    """Deterministic tie-breaking using SHA-256(theme_id + seed)."""
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
    participant_stakes: dict[str, float] | None = None,
    excluded_participant_ids: set[str] | None = None,
) -> list[AggregatedRanking]:
    """CRS-12.01 + CRS-12.02 + CRS-12.04: Borda count with quadratic weights + anomaly exclusion.

    Steps:
      1. Fetch all user_rankings for session + cycle
      1b. Exclude flagged participants (CRS-12.04 anti-sybil)
      2. Compute quadratic weights (if stakes provided) or equal weights
      3. Compute weighted Borda scores
      4. Sort by score DESC, then deterministic tiebreak
      5. Clear previous aggregated_rankings for this cycle
      6. Write new aggregated_rankings (1 row per theme)
    """
    excluded = excluded_participant_ids or set()

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

    # 1b. Extract ranked_theme_ids + participant_ids, excluding flagged
    all_rankings: list[list[str]] = []
    all_participant_ids: list[str] = []
    excluded_count = 0
    for ur in user_rankings:
        pid = str(ur.participant_id)
        if pid in excluded:
            excluded_count += 1
            continue
        ids = ur.ranked_theme_ids
        if isinstance(ids, list):
            all_rankings.append(ids)
        elif isinstance(ids, dict) and "ranked_theme_ids" in ids:
            all_rankings.append(ids["ranked_theme_ids"])
        all_participant_ids.append(pid)

    if excluded_count:
        logger.info(
            "cube7.ranking.excluded_anomalous",
            extra={"session_id": str(session_id), "excluded_count": excluded_count},
        )

    if not all_rankings:
        raise ValueError(
            f"No valid rankings remaining after excluding {excluded_count} flagged participants"
        )

    n_themes = len(all_rankings[0]) if all_rankings else 0
    participant_count = len(all_rankings)
    effective_seed = seed or str(session_id)

    # 2. Compute weights
    algorithm = "borda_count"
    if participant_stakes:
        weights = _quadratic_weights(participant_stakes)
        scores = _weighted_borda_scores(
            all_rankings, all_participant_ids, weights, n_themes
        )
        algorithm = "quadratic_borda"
    else:
        scores = _borda_scores(all_rankings, n_themes)

    # 3. Sort: score DESC, then deterministic tiebreak ASC
    sorted_themes = sorted(
        scores.items(),
        key=lambda item: (-item[1], _seeded_tiebreak_key(item[0], effective_seed)),
    )

    # 4. Compute replay hash
    replay_hash = _compute_replay_hash(all_rankings, effective_seed, algorithm)

    # 5. Clear previous aggregation for this cycle
    await db.execute(
        delete(AggregatedRanking).where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
            )
        )
    )

    # 6. Fetch theme confidence for CRS-13.01
    theme_ids_list = [uuid.UUID(t[0]) for t in sorted_themes]
    if theme_ids_list:
        conf_result = await db.execute(
            select(Theme.id, Theme.confidence).where(Theme.id.in_(theme_ids_list))
        )
        theme_confidence = {row[0]: row[1] for row in conf_result.all()}
    else:
        theme_confidence = {}

    # 7. Write new aggregated rankings
    now = datetime.now(timezone.utc)
    aggregated: list[AggregatedRanking] = []

    for rank_pos, (theme_id_str, score) in enumerate(sorted_themes, start=1):
        vote_count = sum(1 for r in all_rankings if theme_id_str in r)
        tid = uuid.UUID(theme_id_str)

        agg = AggregatedRanking(
            session_id=session_id,
            cycle_id=cycle_id,
            theme_id=tid,
            rank_position=rank_pos,
            score=score,
            vote_count=vote_count,
            is_top_theme2=False,
            confidence_avg=round(theme_confidence.get(tid, 0.0), 4),
            participant_count=participant_count,
            algorithm=algorithm,
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
            "algorithm": algorithm,
            "replay_hash": replay_hash,
        },
    )
    # Attach replay_hash and weight audit to first result for pipeline access
    if aggregated:
        aggregated[0]._replay_hash = replay_hash
        aggregated[0]._weight_audit = (
            {pid: weights.get(pid, 0) for pid in all_participant_ids}
            if participant_stakes
            else None
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
    """Set is_top_theme2=True on the #1 ranked theme."""
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
    """Broadcast ranking_complete + trigger CQS scoring via Cube 5."""
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

    top_theme2_label = None
    if winner:
        theme_result = await db.execute(
            select(Theme.label).where(Theme.id == winner.theme_id)
        )
        top_theme2_label = theme_result.scalar_one_or_none()

    # Broadcast ranking_complete (CRS-17: <500ms)
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
            extra={"session_id": str(session_id), "top_theme2_id": top_theme2_id},
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
# CRS-16/17: Get Live Rankings + Progress
# ---------------------------------------------------------------------------


async def get_live_rankings(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
) -> list[AggregatedRanking]:
    """Return current aggregated rankings ordered by rank_position."""
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


async def get_ranking_progress(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
) -> dict:
    """Return submission count for moderator progress indicator."""
    count_result = await db.execute(
        select(func.count()).select_from(Ranking).where(
            and_(
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,
            )
        )
    )
    return {
        "session_id": str(session_id),
        "cycle_id": cycle_id,
        "submissions": count_result.scalar() or 0,
    }


# ---------------------------------------------------------------------------
# CRS-22: Governance Override (Lead/Admin)
# ---------------------------------------------------------------------------


async def apply_governance_override(
    db: AsyncSession,
    session_id: uuid.UUID,
    theme_id: uuid.UUID,
    new_rank: int,
    overridden_by: str,
    justification: str,
    session_short_code: str,
    cycle_id: int = 1,
) -> GovernanceOverride:
    """CRS-22.01: Apply ranking override with mandatory justification.

    Creates immutable audit entry. Shifts other themes' rank_positions
    to accommodate the override. Broadcasts updated rankings.
    """
    if len(justification.strip()) < _MIN_JUSTIFICATION_LEN:
        raise ValueError(
            f"Justification must be at least {_MIN_JUSTIFICATION_LEN} characters"
        )

    # Fetch current rank
    result = await db.execute(
        select(AggregatedRanking).where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
                AggregatedRanking.theme_id == theme_id,
            )
        )
    )
    current = result.scalar_one_or_none()
    if not current:
        raise ValueError(f"Theme {theme_id} not found in rankings")

    original_rank = current.rank_position

    if new_rank == original_rank:
        raise ValueError("New rank is same as current rank")

    # Fetch all rankings for this cycle to reorder
    all_result = await db.execute(
        select(AggregatedRanking)
        .where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
            )
        )
        .order_by(AggregatedRanking.rank_position)
    )
    all_rankings = list(all_result.scalars().all())

    if new_rank < 1 or new_rank > len(all_rankings):
        raise ValueError(f"new_rank must be 1-{len(all_rankings)}")

    # Reorder: remove from old position, insert at new
    ordered = sorted(all_rankings, key=lambda r: r.rank_position)
    target = next(r for r in ordered if r.theme_id == theme_id)
    ordered.remove(target)
    ordered.insert(new_rank - 1, target)

    # Reassign positions
    for i, r in enumerate(ordered, start=1):
        r.rank_position = i

    # Update is_top_theme2
    for r in ordered:
        r.is_top_theme2 = r.rank_position == 1

    # Create immutable audit entry
    override = GovernanceOverride(
        session_id=session_id,
        cycle_id=cycle_id,
        theme_id=theme_id,
        original_rank=original_rank,
        new_rank=new_rank,
        overridden_by=overridden_by,
        justification=justification.strip(),
    )
    db.add(override)
    await db.flush()

    # Broadcast updated rankings
    try:
        from app.core.supabase_broadcast import broadcast_event

        await broadcast_event(
            channel=f"session:{session_short_code}",
            event="ranking_override",
            payload={
                "session_id": str(session_id),
                "theme_id": str(theme_id),
                "original_rank": original_rank,
                "new_rank": new_rank,
                "overridden_by": overridden_by,
            },
        )
    except Exception:
        pass

    logger.info(
        "cube7.governance_override.applied",
        extra={
            "session_id": str(session_id),
            "theme_id": str(theme_id),
            "original_rank": original_rank,
            "new_rank": new_rank,
            "overridden_by": overridden_by,
        },
    )
    return override


async def get_governance_overrides(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
) -> list[GovernanceOverride]:
    """Fetch all governance overrides for audit trail."""
    result = await db.execute(
        select(GovernanceOverride)
        .where(
            and_(
                GovernanceOverride.session_id == session_id,
                GovernanceOverride.cycle_id == cycle_id,
            )
        )
        .order_by(GovernanceOverride.created_at)
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

    # Check 1: Identical rankings within time window
    ranking_groups: dict[str, list[Ranking]] = {}
    for r in rankings:
        key = str(r.ranked_theme_ids)
        ranking_groups.setdefault(key, []).append(r)

    for key, group in ranking_groups.items():
        if len(group) < _ANOMALY_MIN_DUPLICATES:
            continue
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
                break

    # Check 2: Rapid submissions per participant
    from collections import defaultdict
    participant_times: dict[str, list[datetime]] = defaultdict(list)
    for r in rankings:
        participant_times[str(r.participant_id)].append(r.submitted_at)

    for pid, times in participant_times.items():
        if len(times) > _MAX_SUBMISSIONS_PER_MINUTE:
            sorted_times = sorted(times)
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
            extra={"session_id": str(session_id), "anomaly_count": len(anomalies)},
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
    participant_stakes: dict[str, float] | None = None,
) -> dict:
    """Full ranking pipeline: detect anomalies → exclude → aggregate → identify → emit.

    CRS-12.04: Anomalous votes are detected FIRST, then excluded from aggregation.
    When participant_stakes is provided, uses quadratic vote normalization
    (CRS-12.02). Otherwise falls back to equal-weight Borda count.
    """
    # 1. Detect anomalies FIRST (before aggregation)
    anomalies = await detect_voting_anomalies(db, session_id, cycle_id)

    # 2. Collect flagged participant IDs for exclusion
    excluded_participants: set[str] = set()
    for a in anomalies:
        if a["type"] == "identical_ranking_burst":
            excluded_participants.update(a.get("participant_ids", []))

    # 3. Aggregate (excluding flagged participants)
    aggregated = await aggregate_rankings(
        db, session_id, cycle_id, seed, participant_stakes,
        excluded_participant_ids=excluded_participants,
    )

    # 4. Identify top theme
    winner = await identify_top_theme2(db, session_id, cycle_id)

    # 4. Emit ranking complete + trigger CQS
    emit_result = await emit_ranking_complete(
        db, session_id, session_short_code, cycle_id
    )

    await db.commit()

    # CRS-13.03: Include replay_hash for governance audit
    replay_hash = getattr(aggregated[0], "_replay_hash", None) if aggregated else None
    weight_audit = getattr(aggregated[0], "_weight_audit", None) if aggregated else None

    return {
        "session_id": str(session_id),
        "cycle_id": cycle_id,
        "theme_count": len(aggregated),
        "participant_count": aggregated[0].participant_count if aggregated else 0,
        "algorithm": aggregated[0].algorithm if aggregated else "borda_count",
        "replay_hash": replay_hash,
        "top_theme2_id": emit_result.get("top_theme2_id"),
        "top_theme2_label": emit_result.get("top_theme2_label"),
        "anomaly_count": len(anomalies),
        "anomalies": anomalies,
        "excluded_participants": len(excluded_participants),
        "weight_audit": weight_audit,
        "status": "ranking_complete",
    }


# ---------------------------------------------------------------------------
# CRS-16.01: Emerging Patterns (MVP2)
# ---------------------------------------------------------------------------


async def get_emerging_patterns(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
) -> dict:
    """CRS-16.01: Show emerging ranking patterns before voting closes.

    Returns partial aggregation of submissions received so far —
    moderator sees live trends without waiting for all participants.
    """
    result = await db.execute(
        select(Ranking).where(
            and_(
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,
            )
        )
    )
    user_rankings = list(result.scalars().all())

    if not user_rankings:
        return {
            "session_id": str(session_id),
            "submissions_so_far": 0,
            "emerging_leader": None,
            "partial_scores": {},
            "convergence": 0.0,
        }

    all_rankings: list[list[str]] = []
    for ur in user_rankings:
        ids = ur.ranked_theme_ids
        if isinstance(ids, list):
            all_rankings.append(ids)

    n_themes = len(all_rankings[0]) if all_rankings else 0
    scores = _borda_scores(all_rankings, n_themes)

    sorted_t = sorted(scores.items(), key=lambda x: -x[1])
    leader_id = sorted_t[0][0] if sorted_t else None
    leader_score = sorted_t[0][1] if sorted_t else 0
    total_possible = len(all_rankings) * (n_themes - 1) if n_themes > 1 else 1

    # Convergence: how dominant is the leader (0→1 scale)
    convergence = leader_score / total_possible if total_possible > 0 else 0

    # Fetch theme label for leader
    leader_label = None
    if leader_id:
        try:
            theme_result = await db.execute(
                select(Theme.label).where(Theme.id == uuid.UUID(leader_id))
            )
            leader_label = theme_result.scalar_one_or_none()
        except Exception:
            pass

    return {
        "session_id": str(session_id),
        "submissions_so_far": len(all_rankings),
        "emerging_leader": {
            "theme_id": leader_id,
            "label": leader_label,
            "score": leader_score,
        } if leader_id else None,
        "partial_scores": {tid: round(s, 2) for tid, s in sorted_t},
        "convergence": round(convergence, 3),
    }


# ---------------------------------------------------------------------------
# CRS-17.01: Personal vs Group Rank (MVP2)
# ---------------------------------------------------------------------------


async def get_personal_vs_group_rank(
    db: AsyncSession,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    cycle_id: int = 1,
) -> dict:
    """CRS-17.01: Compare participant's ranking with group consensus.

    Shows where the participant agrees/disagrees with the crowd.
    """
    # Get participant's ranking
    result = await db.execute(
        select(Ranking).where(
            and_(
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,
                Ranking.participant_id == participant_id,
            )
        )
    )
    user_ranking = result.scalar_one_or_none()

    if not user_ranking:
        return {
            "session_id": str(session_id),
            "participant_id": str(participant_id),
            "personal_rank": [],
            "group_rank": [],
            "agreement_score": 0.0,
        }

    personal_ids = user_ranking.ranked_theme_ids
    if isinstance(personal_ids, dict):
        personal_ids = personal_ids.get("ranked_theme_ids", [])

    # Get group aggregated rankings
    agg_result = await db.execute(
        select(AggregatedRanking)
        .where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
            )
        )
        .order_by(AggregatedRanking.rank_position)
    )
    group_rankings = list(agg_result.scalars().all())
    group_ids = [str(r.theme_id) for r in group_rankings]

    # Compute agreement score (Kendall tau-like: fraction of pairs in same order)
    if len(personal_ids) < 2 or not group_ids:
        agreement = 0.0
    else:
        concordant = 0
        total_pairs = 0
        for i in range(len(personal_ids)):
            for j in range(i + 1, len(personal_ids)):
                pi = personal_ids.index(personal_ids[i]) if personal_ids[i] in personal_ids else i
                pj = personal_ids.index(personal_ids[j]) if personal_ids[j] in personal_ids else j
                gi = group_ids.index(personal_ids[i]) if personal_ids[i] in group_ids else i
                gj = group_ids.index(personal_ids[j]) if personal_ids[j] in group_ids else j
                if (pi < pj and gi < gj) or (pi > pj and gi > gj):
                    concordant += 1
                total_pairs += 1
        agreement = concordant / total_pairs if total_pairs > 0 else 0.0

    # Build comparison
    personal_with_pos = []
    for pos, tid in enumerate(personal_ids, 1):
        group_pos = next(
            (r.rank_position for r in group_rankings if str(r.theme_id) == tid),
            None,
        )
        personal_with_pos.append({
            "theme_id": tid,
            "personal_rank": pos,
            "group_rank": group_pos,
            "delta": (group_pos - pos) if group_pos else None,
        })

    return {
        "session_id": str(session_id),
        "participant_id": str(participant_id),
        "personal_rank": personal_with_pos,
        "group_rank": [
            {
                "theme_id": str(r.theme_id),
                "rank": r.rank_position,
                "score": r.score,
                "vote_count": r.vote_count,
            }
            for r in group_rankings
        ],
        "agreement_score": round(agreement, 3),
    }


# ---------------------------------------------------------------------------
# CRS-13.03: Replay Verification (re-run with same inputs)
# ---------------------------------------------------------------------------


async def verify_replay(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
    seed: str | None = None,
) -> dict:
    """CRS-13.03: Re-run aggregation and compare replay hash.

    Does NOT write to DB — read-only verification.
    Returns match status + both hashes.
    """
    # Get existing aggregation
    existing = await db.execute(
        select(AggregatedRanking)
        .where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
            )
        )
        .order_by(AggregatedRanking.rank_position)
    )
    existing_rankings = list(existing.scalars().all())
    existing_order = [str(r.theme_id) for r in existing_rankings]

    # Fetch user rankings
    result = await db.execute(
        select(Ranking).where(
            and_(
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,
            )
        )
    )
    user_rankings = list(result.scalars().all())

    all_rankings: list[list[str]] = []
    for ur in user_rankings:
        ids = ur.ranked_theme_ids
        if isinstance(ids, list):
            all_rankings.append(ids)

    effective_seed = seed or str(session_id)
    n_themes = len(all_rankings[0]) if all_rankings else 0

    # Recompute
    scores = _borda_scores(all_rankings, n_themes)
    sorted_t = sorted(
        scores.items(),
        key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], effective_seed)),
    )
    recomputed_order = [t[0] for t in sorted_t]
    replay_hash = _compute_replay_hash(all_rankings, effective_seed)

    return {
        "session_id": str(session_id),
        "cycle_id": cycle_id,
        "replay_hash": replay_hash,
        "existing_order": existing_order,
        "recomputed_order": recomputed_order,
        "match": existing_order == recomputed_order,
        "participant_count": len(all_rankings),
    }
