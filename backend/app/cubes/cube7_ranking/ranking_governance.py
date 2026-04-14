"""Cube 7 — Ranking Governance: Live rankings, overrides, anomaly detection.

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

# Cross-module imports from sibling sub-modules
from app.cubes.cube7_ranking.ranking_submission import (
    _ANOMALY_WINDOW_SEC,
    _ANOMALY_MIN_DUPLICATES,
    _MAX_SUBMISSIONS_PER_MINUTE,
    _MIN_JUSTIFICATION_LEN,
)
from app.cubes.cube7_ranking.ranking_aggregation import (
    _borda_scores,
    _seeded_tiebreak_key,
    _compute_replay_hash,
    _quadratic_weights,
    _weighted_borda_scores,
)

logger = logging.getLogger("cube7")

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
    # Auto-select: sharded broadcast for 1M+ scale, standard for <1K
    payload = {
        "session_id": str(session_id),
        "top_theme2_id": top_theme2_id,
        "top_theme2_label": top_theme2_label,
        "cycle_id": cycle_id,
    }
    try:
        # Count participants to decide broadcast strategy
        participant_count = 0
        try:
            count_result = await db.execute(
                select(func.count()).select_from(Ranking).where(
                    Ranking.session_id == session_id
                )
            )
            participant_count = count_result.scalar() or 0
        except Exception:
            pass

        if participant_count > 1000:
            # Scale mode: sharded broadcast to 100 channels
            from app.cubes.cube7_ranking.scale_engine import broadcast_to_all_shards
            await broadcast_to_all_shards(session_short_code, "ranking_complete", payload)
        else:
            # Standard mode: single channel broadcast
            from app.core.supabase_broadcast import broadcast_event
            await broadcast_event(
                channel=f"session:{session_short_code}",
                event="ranking_complete",
                payload=payload,
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
