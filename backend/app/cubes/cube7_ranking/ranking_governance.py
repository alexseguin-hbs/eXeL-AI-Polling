"""Cube 7 — Ranking Governance: Live rankings, overrides, anomaly detection.

Challenger I/O Specification (checkout boundary):
  IN:  db (AsyncSession), session_id (UUID), cycle_id (int)
  OUT: rankings (list[AggregatedRanking]), governance_log (list[GovernanceOverride])

Functions (each standalone with defined I/O):
  emit_ranking_complete(db, session_id, ...) → broadcast event    (CRS-16)
  get_live_rankings(db, session_id) → list[AggregatedRanking]     (CRS-11.04)
  get_ranking_progress(db, session_id) → dict                     (CRS-17)
  apply_governance_override(db, ...) → GovernanceOverride          (CRS-22)
  detect_voting_anomalies(db, session_id) → list[dict]            (CRS-22.01)
  get_emerging_patterns(db, session_id) → dict                    (CRS-12)
  run_ranking_pipeline(db, session_id) → dict                     (CRS-11)
  verify_replay(db, session_id) → dict                            (CRS-13)

Split from service.py for Succinctness (G13 gap fix, 2026-04-14).
G23: I/O boundaries documented for Challenger checkout (2026-04-14).
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
    *,
    algorithm: str | None = None,
    theme01_category: str | None = None,
    theme_level: str | None = None,
    replay_hash: str | None = None,
    anomaly_count: int = 0,
    excluded_participants: int = 0,
) -> dict:
    """Broadcast ranking_complete + trigger CQS scoring via Cube 5.

    Contract fields (Krishna audit, 2026-07-03): algorithm, theme01_category,
    theme_level, replay_hash, anomaly_count, excluded_participants,
    contract_version are all included in the broadcast payload so downstream
    consumers (Cube 8, SIM playback) receive the complete slice-pinned record.
    """
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

    # Fall back to values on the winner row if callers didn't supply them.
    if algorithm is None and winner is not None:
        algorithm = getattr(winner, "algorithm", None)

    # Count participants to decide broadcast strategy AND for payload metadata
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

    # Broadcast ranking_complete (CRS-17: <500ms). Full contract payload.
    payload = {
        "session_id": str(session_id),
        "short_code": session_short_code,
        "cycle_id": cycle_id,
        "algorithm": algorithm,
        "participant_count": participant_count,
        "theme01_category": theme01_category,
        "theme_level": theme_level,
        "top_theme2_id": top_theme2_id,
        "top_theme2_label": top_theme2_label,
        "replay_hash": replay_hash,
        "anomaly_count": anomaly_count,
        "excluded_participants": excluded_participants,
        "contract_version": "2026-07-03.1",
    }
    try:
        if participant_count > 1000:
            from app.cubes.cube7_ranking.scale_engine import broadcast_to_all_shards
            await broadcast_to_all_shards(session_short_code, "ranking_complete", payload)
        else:
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

    # Fire the `ranking_complete` WEBHOOK to any registered subscriptions (CRS-19 /
    # API productization). The webhook infra (HMAC-signed, SSRF-guarded, metered) was
    # built but never called; this is the missing trigger. Fire-and-forget — a webhook
    # failure must never break ranking completion.
    try:
        from app.cubes.cube5_gateway.webhook_service import deliver_event

        await deliver_event(db, session_id, "ranking_complete", payload)
    except Exception as exc:
        logger.warning(
            "cube7.ranking_complete.webhook_failed",
            extra={"session_id": str(session_id), "error": str(exc)},
        )

    # Trigger CQS scoring via Cube 5 — pass the full handoff payload
    try:
        from app.cubes.cube5_gateway.service import trigger_cqs_scoring

        await trigger_cqs_scoring(
            db,
            session_id,
            top_theme2_id=top_theme2_id,
            cycle_id=cycle_id,
            algorithm=algorithm,
            participant_count=participant_count,
            replay_hash=replay_hash,
        )
        logger.info(
            "cube7.cqs.triggered",
            extra={"session_id": str(session_id), "top_theme2_id": top_theme2_id},
        )
    except TypeError:
        # Cube 5 may not yet accept the extended kwargs — fall back to legacy
        try:
            await trigger_cqs_scoring(db, session_id, top_theme2_id=top_theme2_id)
        except Exception as exc:
            logger.warning(
                "cube7.cqs.trigger_failed_fallback",
                extra={"session_id": str(session_id), "error": str(exc)},
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
        "algorithm": algorithm,
        "participant_count": participant_count,
        "theme01_category": theme01_category,
        "theme_level": theme_level,
        "replay_hash": replay_hash,
        "anomaly_count": anomaly_count,
        "excluded_participants": excluded_participants,
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

    # R3.4: also write the SHARED core.audit.log_audit row (in addition to the domain
    # GovernanceOverride table) so Cube 7 carries the same transition-level attribution
    # primitive as cubes 2/3/4/5/6/8/9/10 — uniform R-Core audit across the lattice.
    from app.core.audit import log_audit

    log_audit(
        db,
        session_id=session_id,
        actor_id=overridden_by,
        actor_role="moderator",
        action_type="ranking.governance_override",
        object_type="ranking_override",
        object_id=str(theme_id),
        before={"rank": original_rank},
        after={"rank": new_rank, "justification": justification.strip()},
    )

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
    theme01_category: str | None = None,
    theme_level: str | None = None,
) -> dict:
    """Full ranking pipeline: detect anomalies → exclude → aggregate → identify → emit.

    CRS-12.04: Anomalous votes are detected FIRST, then excluded from aggregation.
    When participant_stakes is provided, uses quadratic vote normalization
    (CRS-12.02). Otherwise falls back to equal-weight Borda count.

    Step 5 (2026-07-03): `theme01_category` + `theme_level` come from the
    Session config (moderator's Step-3 ranking-config pick). They are
    folded into the replay hash so replays are pinned to the exact
    (category, level) slice the aggregation ran against.
    """
    # 0. Auto-fill category/level from Session if the caller omitted them.
    # This is the normal path — router callers just pass session_id.
    if theme01_category is None or theme_level is None:
        from app.models.session import Session

        s_res = await db.execute(select(Session).where(Session.id == session_id))
        s = s_res.scalar_one_or_none()
        if s is not None:
            if theme01_category is None:
                theme01_category = getattr(s, "theme01_category", None)
            if theme_level is None:
                raw = getattr(s, "theme2_voting_level", None)
                if raw and raw.startswith("theme2_"):
                    theme_level = raw.replace("theme2_", "")

    # 1. Detect anomalies FIRST (before aggregation)
    anomalies = await detect_voting_anomalies(db, session_id, cycle_id)

    # 2. Collect flagged participant IDs for exclusion
    excluded_participants: set[str] = set()
    for a in anomalies:
        if a["type"] == "identical_ranking_burst":
            excluded_participants.update(a.get("participant_ids", []))

    # 3. Aggregate (excluding flagged participants, pinned to category/level)
    aggregated = await aggregate_rankings(
        db, session_id, cycle_id, seed, participant_stakes,
        excluded_participant_ids=excluded_participants,
        theme01_category=theme01_category,
        theme_level=theme_level,
    )

    # 4. Identify top theme
    winner = await identify_top_theme2(db, session_id, cycle_id)

    # CRS-13.03: Pull replay_hash + weight_audit from aggregation output
    replay_hash = getattr(aggregated[0], "_replay_hash", None) if aggregated else None
    weight_audit = getattr(aggregated[0], "_weight_audit", None) if aggregated else None
    algorithm = aggregated[0].algorithm if aggregated else "borda_count"

    # 5. Emit ranking complete + trigger CQS with the full contract payload
    #    (Krishna audit — 2026-07-03: no more broadcast field drift)
    emit_result = await emit_ranking_complete(
        db,
        session_id,
        session_short_code,
        cycle_id,
        algorithm=algorithm,
        theme01_category=theme01_category,
        theme_level=theme_level,
        replay_hash=replay_hash,
        anomaly_count=len(anomalies),
        excluded_participants=len(excluded_participants),
    )

    await db.commit()

    return {
        "session_id": str(session_id),
        "cycle_id": cycle_id,
        "theme_count": len(aggregated),
        "participant_count": aggregated[0].participant_count if aggregated else 0,
        "algorithm": aggregated[0].algorithm if aggregated else "borda_count",
        "replay_hash": replay_hash,
        "theme01_category": theme01_category,
        "theme_level": theme_level,
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
    theme01_category: str | None = None,
    theme_level: str | None = None,
    participant_stakes: dict[str, float] | None = None,
) -> dict:
    """CRS-13.03: Re-run aggregation and compare replay hash.

    Does NOT write to DB — read-only verification.
    Returns match status + both hashes.

    C7-1 (2026-07-21): recompute with the SAME algorithm the aggregator used.
    The algorithm is persisted per-row on `AggregatedRanking.algorithm`
    ("borda_count" or "quadratic_borda") and folded into the replay hash — so
    a quadratic session must be verified with quadratic_borda, or both the
    hash and the recomputed order falsely mismatch (the old code always used
    unweighted Borda). For quadratic, pass `participant_stakes` to reproduce
    the exact weighted order; without stakes the hash still pins determinism
    but the order is not independently recomputed (order_recomputed=False).

    Step 5 (2026-07-03): auto-fills category/level from the Session so the
    verifier hashes the same slice-pinned payload the aggregator did.
    """
    # 0. Auto-fill category/level from Session if omitted (matches pipeline).
    if theme01_category is None or theme_level is None:
        from app.models.session import Session

        s_res = await db.execute(select(Session).where(Session.id == session_id))
        s = s_res.scalar_one_or_none()
        if s is not None:
            if theme01_category is None:
                theme01_category = getattr(s, "theme01_category", None)
            if theme_level is None:
                raw = getattr(s, "theme2_voting_level", None)
                if raw and raw.startswith("theme2_"):
                    theme_level = raw.replace("theme2_", "")

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
    all_participant_ids: list[str] = []
    for ur in user_rankings:
        ids = ur.ranked_theme_ids
        if isinstance(ids, list):
            all_rankings.append(ids)
            all_participant_ids.append(str(ur.participant_id))

    effective_seed = seed or str(session_id)
    n_themes = len(all_rankings[0]) if all_rankings else 0

    # C7-1: recompute with the SAME algorithm the aggregator persisted.
    stored_algorithm = (
        existing_rankings[0].algorithm if existing_rankings else "borda_count"
    )

    order_recomputed = True
    if stored_algorithm == "quadratic_borda" and participant_stakes:
        weights = _quadratic_weights(participant_stakes)
        scores = _weighted_borda_scores(
            all_rankings, all_participant_ids, weights, n_themes
        )
    elif stored_algorithm == "quadratic_borda":
        # Quadratic session but no stakes supplied — the exact weighted order
        # can't be reproduced here. The hash (below, pinned to quadratic_borda)
        # still verifies determinism; do not claim an order match/mismatch.
        scores = None
        order_recomputed = False
    else:
        scores = _borda_scores(all_rankings, n_themes)

    if scores is not None:
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], effective_seed)),
        )
        recomputed_order = [t[0] for t in sorted_t]
    else:
        recomputed_order = existing_order  # not independently recomputed

    replay_hash = _compute_replay_hash(
        all_rankings,
        effective_seed,
        stored_algorithm,
        theme01_category=theme01_category,
        theme_level=theme_level,
    )

    return {
        "session_id": str(session_id),
        "cycle_id": cycle_id,
        "algorithm": stored_algorithm,
        "replay_hash": replay_hash,
        "theme01_category": theme01_category,
        "theme_level": theme_level,
        "existing_order": existing_order,
        "recomputed_order": recomputed_order,
        "order_recomputed": order_recomputed,
        "match": (existing_order == recomputed_order) if order_recomputed else None,
        "participant_count": len(all_rankings),
    }
