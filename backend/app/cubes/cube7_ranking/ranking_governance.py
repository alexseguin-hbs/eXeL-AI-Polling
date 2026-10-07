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
    aggregate_rankings,
    identify_top_theme2,
    tally_rankings,
    _ballot_width,
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
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,   # this round's voters, not every round's
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
        # One low-rate message on the topic clients actually join. Above 1000 voters it used to go
        # only to shard channels no client subscribes to, so nobody learned the result.
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
            # The label and level the scoring needs: without them trigger_cqs_scoring only ever recorded a trigger,
            # so no ranking ever scored CQS (Krishna, round 13). The label is the stored Theme.label.
            top_theme2_label=top_theme2_label,
            theme_level=theme_level if theme_level in ("3", "6", "9") else "3",
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

BURST_SHARE = 0.5  # identical ballots must be at least half of everything cast in their window


async def detect_voting_anomalies(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
) -> list[dict]:
    """Flag coordinated / suspicious voting patterns.

    Checks:
      1. An identical-ordering burst: >= _ANOMALY_MIN_DUPLICATES identical ballots within _ANOMALY_WINDOW_SEC that
         are at least BURST_SHARE of everything cast in that window
      2. Rapid-fire submissions (>10 per participant per minute)

    At live scale (≈1,667 votes/s) three honest voters sharing a popular order inside 2 s is normal — the old
    "≥3 identical within 2 s" rule excluded 2,931 honest voters at 1M ballots, while a 100k-ballot swarm lost only
    3 votes (it stopped after the first window). A burst is flagged only when identical ballots are at least
    BURST_SHARE of ALL ballots cast in that window, and the whole burst is flagged, not its first three.

    HP-05 (1M SIM, 2026-10-07): this runs before every aggregation, and loading each ballot as an ORM object cost
    ~100 s at 1M. On Postgres the window counts run in the database and only the ballots of a key that can burst
    come back (`_anomalies_sql`); elsewhere `_anomalies_python` reads every row. Both feed the same scans, so the same
    list comes back — tests/cube7/test_sql_tally_parity.py proves it.
    """
    from app.cubes.cube7_ranking.ranking_aggregation import _is_postgres

    if _is_postgres(db):
        anomalies = await _anomalies_sql(db, session_id, cycle_id)
    else:
        anomalies = await _anomalies_python(db, session_id, cycle_id)
    if anomalies:
        logger.warning(
            "cube7.anomaly.detected",
            extra={"session_id": str(session_id), "anomaly_count": len(anomalies)},
        )
    return anomalies


def _scan_bursts(key: str, group: list[tuple[datetime, str]], total_at) -> list[dict]:
    """Check 1 over one ordering's ballots, (submitted_at, participant_id) in (submitted_at, id) order.

    `total_at(i)` = every ballot cast in [group[i].submitted_at, + WINDOW] (both counts over the SAME full window:
    measuring the run's own span, often a millisecond, made any three near-simultaneous voters "dominate").
    """
    out: list[dict] = []
    if len(group) < _ANOMALY_MIN_DUPLICATES:
        return out
    i = 0
    while i <= len(group) - _ANOMALY_MIN_DUPLICATES:
        j = i
        while j + 1 < len(group) and (group[j + 1][0] - group[i][0]).total_seconds() <= _ANOMALY_WINDOW_SEC:
            j += 1
        run = j - i + 1
        if run >= _ANOMALY_MIN_DUPLICATES:
            total = total_at(i)
            if run / max(total, 1) >= BURST_SHARE:
                out.append({
                    "type": "identical_ranking_burst",
                    "ranking_key": key,
                    "count": run,
                    "window_seconds": (group[j][0] - group[i][0]).total_seconds(),
                    "share_of_window": round(run / max(total, 1), 4),
                    "participant_ids": [group[k][1] for k in range(i, j + 1)],
                })
                i = j + 1
                continue
        i += 1
    return out


def _scan_rapid(participant_times: dict[str, list[datetime]]) -> list[dict]:
    """Check 2: more than _MAX_SUBMISSIONS_PER_MINUTE submissions by one participant inside 60 s."""
    out: list[dict] = []
    for pid, times in participant_times.items():
        if len(times) > _MAX_SUBMISSIONS_PER_MINUTE:
            sorted_times = sorted(times)
            for i in range(len(sorted_times) - _MAX_SUBMISSIONS_PER_MINUTE):
                window = (
                    sorted_times[i + _MAX_SUBMISSIONS_PER_MINUTE] - sorted_times[i]
                ).total_seconds()
                if window <= 60.0:
                    out.append({
                        "type": "rapid_submissions",
                        "participant_id": pid,
                        "count": _MAX_SUBMISSIONS_PER_MINUTE + 1,
                        "window_seconds": window,
                    })
                    break
    return out


async def _anomalies_python(db: AsyncSession, session_id: uuid.UUID, cycle_id: int) -> list[dict]:
    """Non-Postgres path: every ballot in (submitted_at, id) order (the id makes equal timestamps deterministic)."""
    import bisect
    from collections import defaultdict
    from datetime import timedelta

    result = await db.execute(
        select(Ranking)
        .where(and_(Ranking.session_id == session_id, Ranking.cycle_id == cycle_id))
        .order_by(Ranking.submitted_at, Ranking.id)
    )
    rankings = list(result.scalars().all())
    all_times = [r.submitted_at for r in rankings]
    window = timedelta(seconds=_ANOMALY_WINDOW_SEC)
    groups: dict[str, list[tuple[datetime, str]]] = {}
    participant_times: dict[str, list[datetime]] = defaultdict(list)
    for r in rankings:
        groups.setdefault(str(r.ranked_theme_ids), []).append((r.submitted_at, str(r.participant_id)))
        participant_times[str(r.participant_id)].append(r.submitted_at)

    anomalies: list[dict] = []
    for key, group in groups.items():
        anomalies.extend(_scan_bursts(
            key, group,
            lambda i, g=group: bisect.bisect_right(all_times, g[i][0] + window) - bisect.bisect_left(all_times, g[i][0]),
        ))
    anomalies.extend(_scan_rapid(participant_times))
    return anomalies


async def _anomalies_sql(db: AsyncSession, session_id: uuid.UUID, cycle_id: int) -> list[dict]:
    """Postgres path: window counts in the database; only orderings that can burst are scanned in Python.

    For every ballot Postgres counts its window's identical ballots (`run`, partitioned by ordering) and all ballots
    (`total`) over [submitted_at, + WINDOW]. `run` here also counts identical ballots sharing the start timestamp
    but sorted before it, so it is >= the scan's own run: an ordering with no row passing the burst test on these
    counts cannot burst, and one that has such a row is scanned exactly as the Python path scans it, with the same
    per-row totals. Orderings group as jsonb (one value, however it was spaced when written) and come back in order
    of first appearance, as the Python path's dict does.
    """
    import json
    from collections import defaultdict

    from sqlalchemy import text

    params = {"s": session_id, "c": cycle_id, "mind": _ANOMALY_MIN_DUPLICATES, "share": BURST_SHARE,
              "maxn": _MAX_SUBMISSIONS_PER_MINUTE}
    win = f"INTERVAL '{float(_ANOMALY_WINDOW_SEC)} seconds'"  # a code constant, never input
    # The window sorts carry only a 64-bit hash of the ordering: sorting the jsonb itself cost ~3x as much at 1M.
    # A hash collision only merges orderings, which can only raise `run`, so the filter stays a superset; the exact
    # grouping is redone in Python on the jsonb text of the few rows that come back.
    stream = await db.stream(text(
        f"WITH b AS (SELECT id, submitted_at, jsonb_hash_extended(ranked_theme_ids::jsonb, 0) AS h FROM user_rankings "
        f"  WHERE session_id = :s AND cycle_id = :c), "
        f"w AS (SELECT b.*, "
        f"  count(*) OVER (PARTITION BY h ORDER BY submitted_at RANGE BETWEEN CURRENT ROW AND {win} FOLLOWING) AS run, "
        f"  count(*) OVER (ORDER BY submitted_at RANGE BETWEEN CURRENT ROW AND {win} FOLLOWING) AS total FROM b), "
        f"ck AS (SELECT DISTINCT h FROM w WHERE run >= :mind AND run::float8 / greatest(total, 1) >= :share) "
        f"SELECT u.ranked_theme_ids::jsonb::text, w.submitted_at, u.participant_id::text, w.total "
        f"FROM w JOIN ck ON w.h = ck.h JOIN user_rankings u ON u.id = w.id "
        f"ORDER BY w.submitted_at, w.id"), params)
    # Rows arrive in (submitted_at, id) order, so each group is in scan order and the dict keeps first appearance.
    groups: dict[str, list[tuple[datetime, str]]] = {}
    totals: dict[str, list[int]] = {}
    async for part in stream.partitions(10_000):
        for k, t, pid, total in part:
            if k not in groups:
                groups[k], totals[k] = [], []
            groups[k].append((t, pid))
            totals[k].append(int(total))
    await stream.close()

    anomalies: list[dict] = []
    for k, group in groups.items():
        anomalies.extend(_scan_bursts(str(json.loads(k)), group, lambda i, tt=totals[k]: tt[i]))

    rows = (await db.execute(text(
        "SELECT participant_id::text, submitted_at FROM user_rankings WHERE session_id = :s AND cycle_id = :c "
        "AND participant_id IN (SELECT participant_id FROM user_rankings WHERE session_id = :s AND cycle_id = :c "
        "GROUP BY participant_id HAVING count(*) > :maxn) ORDER BY submitted_at, id"), params)).all()
    participant_times: dict[str, list[datetime]] = defaultdict(list)
    for pid, t in rows:
        participant_times[pid].append(t)
    anomalies.extend(_scan_rapid(participant_times))
    return anomalies


# ---------------------------------------------------------------------------
# Full Ranking Pipeline (orchestrator)
# ---------------------------------------------------------------------------


def _burst_exclusions(anomalies: list[dict]) -> set[str]:
    """Participants excluded from the tally: every member of a flagged identical-ballot burst (CRS-12.04)."""
    excluded: set[str] = set()
    for a in anomalies:
        if a["type"] == "identical_ranking_burst":
            excluded.update(a.get("participant_ids", []))
    return excluded



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
    excluded_participants = _burst_exclusions(anomalies)

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

    n_themes = _ballot_width(all_rankings)
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
    # 0. Auto-fill category/level from Session if omitted (matches pipeline), and the seed: the aggregate endpoint
    #    runs with `seed or session.seed`, so the replay defaults to the same seed.
    session_seed = None
    if theme01_category is None or theme_level is None or seed is None:
        from app.models.session import Session

        s_res = await db.execute(select(Session).where(Session.id == session_id))
        s = s_res.scalar_one_or_none()
        if s is not None:
            session_seed = getattr(s, "seed", None)
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

    # The SAME inputs and path as run_ranking_pipeline: the same anomaly exclusions, both stored ballot shapes, the
    # SQL tally on Postgres. Re-reading the ballots differently (no exclusions, bare lists only, always in Python)
    # let the determinism proof disagree with the very result it checks.
    anomalies = await detect_voting_anomalies(db, session_id, cycle_id)
    excluded = _burst_exclusions(anomalies)
    effective_seed = seed or session_seed or str(session_id)

    # C7-1: recompute with the SAME algorithm the aggregator persisted.
    stored_algorithm = (
        existing_rankings[0].algorithm if existing_rankings else "borda_count"
    )
    quadratic = stored_algorithm == "quadratic_borda"
    # Quadratic session without its stakes: the exact weighted order can't be reproduced here. The hash (pinned to
    # quadratic_borda) still verifies determinism; do not claim an order match/mismatch.
    order_recomputed = not quadratic or bool(participant_stakes)
    try:
        t = await tally_rankings(
            db, session_id, cycle_id, effective_seed, participant_stakes if quadratic else None, excluded,
            theme01_category, theme_level, hash_algorithm=stored_algorithm,
        )
    except ValueError:  # no ballot left: nothing to replay
        t = {"scores": {}, "participant_count": 0, "excluded_count": len(excluded), "replay_hash": None}

    if order_recomputed:
        sorted_t = sorted(
            t["scores"].items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], effective_seed)),
        )
        recomputed_order = [x[0] for x in sorted_t]
    else:
        recomputed_order = existing_order  # not independently recomputed
    replay_hash = t["replay_hash"]

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
        "participant_count": t["participant_count"],
        "excluded_participants": t["excluded_count"],
        "anomaly_count": len(anomalies),
    }
