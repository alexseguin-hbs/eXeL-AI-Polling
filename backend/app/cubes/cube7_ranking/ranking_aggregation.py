"""Cube 7 — Ranking Aggregation: Borda count + quadratic weights + tiebreak.

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

# Constants (shared with ranking_submission.py)
_INFLUENCE_CAP = 0.15  # No single user > 15% of total governance weight

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
