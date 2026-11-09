"""Cube 7 — Ranking Aggregation: Borda count + quadratic weights + tiebreak.

Split from service.py for Succinctness (G13 gap fix, 2026-04-14).
"""
from __future__ import annotations

import hashlib
import logging
import math
import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, delete, func, select, text, update
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
    theme01_category: str | None = None,
    theme_level: str | None = None,
) -> str:
    """SHA-256 replay hash over inputs + parameters for determinism verification.

    Step 5 (2026-07-03): `theme01_category` + `theme_level` are folded into
    the hash so replays are pinned to the (category, level) slice they were
    run against. Backwards-compatible — omitting both keeps the pre-Step-5
    hash format.
    """
    payload = _replay_prefix(seed, algorithm, theme01_category, theme_level) + "|".join(
        ",".join(r) for r in sorted(rankings)
    )
    return hashlib.sha256(payload.encode()).hexdigest()


# ---------------------------------------------------------------------------
# HP-05 (1M SIM, 2026-10-07): the unweighted tally in Postgres
# ---------------------------------------------------------------------------
# Measured at 1M ballots (backend/scripts/sim_1m.py): loading every ballot as an ORM object, then scanning all
# of them once per theme for vote counts, took 37 s and 3.4 GB per aggregation. Postgres sums the Borda points
# and counts the votes per theme; the replay hash is streamed from a server-side cursor in byte order, so the
# process never holds the ballots. The hash is the same bytes `_compute_replay_hash` would produce: theme ids
# are UUID strings ([0-9a-f-], all above ','), so byte order of the comma-joined ballots equals Python's
# element-wise list order. The SIM compares the two paths' result hashes on 1M ballots.

# The ballot's id list from either stored shape: a bare array, or {"ranked_theme_ids": [...]}. `{col}` is the
# column or expression holding the JSON (a placeholder, so the key literal is never rewritten with it).
_BALLOT_IDS = (
    "CASE WHEN jsonb_typeof(({col})::jsonb) = 'array' THEN ({col})::jsonb "
    "ELSE ({col})::jsonb -> 'ranked_theme_ids' END"
)


def _is_postgres(db: AsyncSession) -> bool:
    dialect = getattr(getattr(db, "bind", None), "dialect", None)
    return getattr(dialect, "name", None) == "postgresql"


async def _sql_tally(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int,
    excluded: set[str],
    hash_prefix: str,
) -> tuple[dict[str, float], dict[str, int], int, int, int, str]:
    """Return (scores, vote_counts, participant_count, excluded_count, n_themes, replay_hash) without loading ballots.

    Identical ballots are collapsed first (a poll's popular orders repeat), so the per-theme work and the hash
    stream run over distinct orders with a count, not over every row. Points count every occurrence (as
    `_borda_scores` does); a vote counts a ballot once per theme (as the Python path does).
    """
    params = {"s": session_id, "c": cycle_id, "ex": [uuid.UUID(p) for p in excluded]}
    where = "session_id = :s AND cycle_id = :c"
    excluded_count = int((await db.execute(text(
        f"SELECT count(*) FROM user_rankings WHERE {where} AND participant_id = ANY(:ex)"), params)).scalar() or 0)
    # A fresh name per call: a second tally in the same transaction (verify_replay after the aggregation) cannot
    # DROP the first one's table while its server-side cursor still holds it. ON COMMIT DROP clears them all.
    tb = f"_tally_ballots_{uuid.uuid4().hex[:12]}"
    await db.execute(text(
        f"CREATE TEMP TABLE {tb} ON COMMIT DROP AS "
        f"SELECT ids, array_to_string(ARRAY(SELECT jsonb_array_elements_text(ids)), ',') COLLATE \"C\" AS joined, c "
        f"FROM (SELECT {_BALLOT_IDS.format(col='t')} AS ids, c FROM ("
        f"  SELECT ranked_theme_ids::text AS t, count(*) AS c FROM user_rankings "
        f"  WHERE {where} AND NOT (participant_id = ANY(:ex)) GROUP BY 1) raw) b "
        f"WHERE jsonb_typeof(ids) = 'array'"), params)
    participant_count = int((await db.execute(text(f"SELECT coalesce(sum(c), 0) FROM {tb}"))).scalar())
    if not participant_count:
        return {}, {}, 0, excluded_count, 0, ""
    # n_themes = the longest ballot (was "the first ballot", which depends on row order); same rule as _ballot_width.
    n_themes = (await db.execute(text(f"SELECT max(jsonb_array_length(ids)) FROM {tb}"))).scalar() or 0
    pts = (await db.execute(text(
        f"SELECT e.tid, sum(b.c * (:n - e.pos)) FROM {tb} b, "
        "jsonb_array_elements_text(b.ids) WITH ORDINALITY AS e(tid, pos) GROUP BY e.tid"), {"n": n_themes})).all()
    votes = (await db.execute(text(
        f"SELECT d.tid, sum(b.c) FROM {tb} b, "
        "LATERAL (SELECT DISTINCT tid FROM jsonb_array_elements_text(b.ids) AS e(tid)) d GROUP BY d.tid"))).all()
    scores = {r[0]: float(r[1]) for r in pts}
    vote_counts = {r[0]: int(r[1]) for r in votes}
    digest = hashlib.sha256(hash_prefix.encode())
    first = True
    stream = await db.stream(text(
        f"SELECT joined, sum(c) FROM {tb} GROUP BY joined ORDER BY joined"))
    async for part in stream.partitions(5_000):
        for joined, c in part:
            _feed_repeated(digest, joined, int(c), first)
            first = False
    await stream.close()  # the temp table drops itself at commit/rollback (ON COMMIT DROP)
    return scores, vote_counts, participant_count, excluded_count, n_themes, digest.hexdigest()


_HASH_FEED_BYTES = 1 << 20  # at most ~1 MiB handed to the digest at once, however many voters agree


def _feed_repeated(digest, joined: str, count: int, first: bool) -> None:
    """Feed `joined` repeated `count` times, "|"-separated (with a leading "|" unless it is the first ballot).

    The bytes are exactly `"|".join([joined] * count)` (prefixed by "|" when not first), but handed to the digest in
    batches of at most _HASH_FEED_BYTES: building that string whole cost count × len(joined) bytes, so memory grew
    with agreement (1M identical ballots → a 332 MB string).
    """
    piece = ("|" + joined).encode()
    remaining = count
    if first and remaining:
        digest.update(joined.encode())
        remaining -= 1
    per_batch = max(1, _HASH_FEED_BYTES // len(piece))
    if remaining >= per_batch:
        batch = piece * per_batch
        while remaining >= per_batch:
            digest.update(batch)
            remaining -= per_batch
    if remaining:
        digest.update(piece * remaining)


def _ballot_width(rankings: list[list[str]]) -> int:
    """Borda width: the longest ballot. Order-independent, and the same rule `_sql_tally` uses in Postgres."""
    return max((len(r) for r in rankings), default=0)


def _replay_prefix(
    seed: str,
    algorithm: str,
    theme01_category: str | None,
    theme_level: str | None,
    auto_select_token: str | None = None,
) -> str:
    """The text `_compute_replay_hash` puts before the ballots (kept in one place so the two paths cannot drift)."""
    parts = [algorithm, seed]
    if theme01_category or theme_level:
        parts.append(f"cat={theme01_category or ''}")
        parts.append(f"lvl={theme_level or ''}")
    if auto_select_token:
        parts.append(auto_select_token)  # CRS-36.03
    return ":".join(parts) + ":"


# ---------------------------------------------------------------------------
# P1: top3_points — original design Round 2 (per category: top 3, scored 3/2/1)
# ---------------------------------------------------------------------------

TOP3_POINTS = "top3_points"
TOP3_PICK_POINTS = (3, 2, 1)


def _top3_category_ballots(stored) -> dict[str, list[str]] | None:
    """The {category: [ids]} of a stored top3_points ballot, or None for any other shape."""
    if isinstance(stored, dict) and isinstance(stored.get("category_ballots"), dict):
        return {str(c): [str(t) for t in ids] for c, ids in stored["category_ballots"].items() if isinstance(ids, list)}
    return None


def _top3_points_scores(ballots: list[dict[str, list[str]]]) -> tuple[dict[str, float], dict[str, int]]:
    """Sum 3/2/1 points by position within each category ballot; a vote = a ballot that picked the theme."""
    scores: dict[str, float] = {}
    votes: dict[str, int] = {}
    for b in ballots:
        for ids in b.values():
            for pos, tid in enumerate(ids[: len(TOP3_PICK_POINTS)]):
                scores[tid] = scores.get(tid, 0.0) + TOP3_PICK_POINTS[pos]
                votes[tid] = votes.get(tid, 0) + 1
    return scores, votes


def _top3_replay_hash(ballots: list[dict[str, list[str]]], prefix: str) -> str:
    """SHA-256 over the prefix + every ballot as "cat:id,id;cat:id" (categories sorted), ballots sorted."""
    flat = sorted(";".join(f"{c}:{','.join(b[c])}" for c in sorted(b)) for b in ballots)
    return hashlib.sha256((prefix + "|".join(flat)).encode()).hexdigest()


async def _tally_top3_points(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int,
    effective_seed: str,
    excluded: set[str],
    theme01_category: str | None,
    theme_level: str | None,
    auto_select_token: str | None = None,
) -> dict:
    """Python tally of top3_points ballots (a session's ballots are small: ≤ 9 ids each). Non-top3 rows are skipped."""
    result = await db.execute(
        select(Ranking).where(and_(Ranking.session_id == session_id, Ranking.cycle_id == cycle_id))
    )
    ballots: list[dict[str, list[str]]] = []
    pids: list[str] = []
    excluded_count = 0
    for ur in result.scalars().all():
        pid = str(ur.participant_id)
        if pid in excluded:
            excluded_count += 1
            continue
        b = _top3_category_ballots(ur.ranked_theme_ids)
        if b:
            ballots.append(b)
            pids.append(pid)
    _check_tally(session_id, cycle_id, len(ballots), excluded_count)
    scores, votes = _top3_points_scores(ballots)
    prefix = _replay_prefix(effective_seed, TOP3_POINTS, theme01_category, theme_level, auto_select_token)
    return {"scores": scores, "vote_counts": votes, "participant_count": len(ballots),
            "excluded_count": excluded_count, "algorithm": TOP3_POINTS,
            "replay_hash": _top3_replay_hash(ballots, prefix), "weights": {}, "participant_ids": pids}


async def aggregate_rankings(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int = 1,
    seed: str | None = None,
    participant_stakes: dict[str, float] | None = None,
    excluded_participant_ids: set[str] | None = None,
    theme01_category: str | None = None,
    theme_level: str | None = None,
    is_final: bool = True,
    ranking_method: str | None = None,
    auto_select_token: str | None = None,
) -> list[AggregatedRanking]:
    """CRS-12.01 + CRS-12.02 + CRS-12.04: Borda count with quadratic weights + anomaly exclusion.

    Steps:
      1. Tally the session + cycle's ballots, excluding flagged participants (CRS-12.04 anti-sybil) — `tally_rankings`
      2. Quadratic weights (if stakes provided) or equal weights; weighted Borda scores; the replay hash
      3. Sort by score DESC, then deterministic tiebreak
      4. Clear previous aggregated_rankings for this cycle
      5. Write new aggregated_rankings (1 row per theme)
    """
    effective_seed = seed or str(session_id)
    t = await tally_rankings(
        db, session_id, cycle_id, effective_seed, participant_stakes,
        excluded_participant_ids or set(), theme01_category, theme_level, ranking_method=ranking_method,
        auto_select_token=auto_select_token,
    )
    return await _write_aggregation(
        db, session_id, cycle_id, t["scores"], t["vote_counts"], t["participant_count"], t["algorithm"],
        effective_seed, t["replay_hash"], theme01_category, theme_level, participant_stakes,
        t["weights"], t["participant_ids"], is_final=is_final,
    )


async def tally_rankings(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int,
    effective_seed: str,
    participant_stakes: dict[str, float] | None,
    excluded: set[str],
    theme01_category: str | None = None,
    theme_level: str | None = None,
    hash_algorithm: str | None = None,
    ranking_method: str | None = None,
    auto_select_token: str | None = None,
) -> dict:
    """The read-only half of aggregation, shared by `aggregate_rankings` and `verify_replay` so they cannot drift.

    Returns scores, vote_counts, participant_count, excluded_count, algorithm, replay_hash, weights and (on the
    Python path) participant_ids. Raises ValueError when no ballot is left. `hash_algorithm` overrides the algorithm
    folded into the replay hash (verify_replay of a quadratic session without its stakes).
    """
    if ranking_method == TOP3_POINTS:
        if participant_stakes:
            raise ValueError("top3_points does not take participant_stakes")
        return await _tally_top3_points(db, session_id, cycle_id, effective_seed, excluded, theme01_category, theme_level, auto_select_token)
    algorithm = "quadratic_borda" if participant_stakes else "borda_count"
    prefix = _replay_prefix(effective_seed, hash_algorithm or algorithm, theme01_category, theme_level, auto_select_token)

    if not participant_stakes and _is_postgres(db):
        # HP-05: equal weights on Postgres — tally in the database, stream the replay hash.
        scores, vote_counts, participant_count, excluded_count, _n, replay_hash = await _sql_tally(
            db, session_id, cycle_id, excluded, prefix,
        )
        _check_tally(session_id, cycle_id, participant_count, excluded_count)
        return {"scores": scores, "vote_counts": vote_counts, "participant_count": participant_count,
                "excluded_count": excluded_count, "algorithm": algorithm, "replay_hash": replay_hash,
                "weights": {}, "participant_ids": []}

    # Python path: every ballot, in either stored shape (bare list or {"ranked_theme_ids": [...]}).
    result = await db.execute(
        select(Ranking).where(and_(Ranking.session_id == session_id, Ranking.cycle_id == cycle_id))
    )
    all_rankings: list[list[str]] = []
    all_participant_ids: list[str] = []
    excluded_count = 0
    for ur in result.scalars().all():
        pid = str(ur.participant_id)
        if pid in excluded:
            excluded_count += 1
            continue
        ids = ur.ranked_theme_ids
        if isinstance(ids, dict):
            ids = ids.get("ranked_theme_ids")
        if not isinstance(ids, list):
            continue  # an unreadable ballot counts for nothing — the same rule as the SQL tally's jsonb_typeof filter
        all_rankings.append(ids)
        all_participant_ids.append(pid)  # stays index-aligned with all_rankings for the quadratic weights
    _check_tally(session_id, cycle_id, len(all_rankings), excluded_count)

    n_themes = _ballot_width(all_rankings)
    weights: dict[str, float] = {}
    if participant_stakes:
        weights = _quadratic_weights(participant_stakes)
        scores = _weighted_borda_scores(all_rankings, all_participant_ids, weights, n_themes)
    else:
        scores = _borda_scores(all_rankings, n_themes)
    # Replay hash (Step 5: category+level pinned into hash) — the same bytes `_sql_tally` streams.
    replay_hash = _compute_replay_hash(
        all_rankings, effective_seed, hash_algorithm or algorithm,
        theme01_category=theme01_category, theme_level=theme_level,
    )
    # Vote counts in one pass (was one full scan of every ballot per theme).
    vote_counts: dict[str, int] = {}
    for r in all_rankings:
        for tid in set(r):
            vote_counts[tid] = vote_counts.get(tid, 0) + 1
    return {"scores": scores, "vote_counts": vote_counts, "participant_count": len(all_rankings),
            "excluded_count": excluded_count, "algorithm": algorithm, "replay_hash": replay_hash,
            "weights": weights, "participant_ids": all_participant_ids}


def _check_tally(session_id: uuid.UUID, cycle_id: int, participant_count: int, excluded_count: int) -> None:
    """The two refusals (same words on both paths), and the exclusion log line."""
    if not participant_count:
        if excluded_count:
            raise ValueError(
                f"No valid rankings remaining after excluding {excluded_count} flagged participants"
            )
        raise ValueError(f"No rankings found for session {session_id} cycle {cycle_id}")
    if excluded_count:
        logger.info(
            "cube7.ranking.excluded_anomalous",
            extra={"session_id": str(session_id), "excluded_count": excluded_count},
        )


async def _write_aggregation(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int,
    scores: dict[str, float],
    vote_counts: dict[str, int],
    participant_count: int,
    algorithm: str,
    effective_seed: str,
    replay_hash: str,
    theme01_category: str | None,
    theme_level: str | None,
    participant_stakes: dict[str, float] | None,
    weights: dict[str, float],
    all_participant_ids: list[str],
    is_final: bool = True,
) -> list[AggregatedRanking]:
    """Steps 4-7 shared by both tallies: deterministic order, replace the cycle's rows, attach the audit."""
    sorted_themes = sorted(
        scores.items(),
        key=lambda item: (-item[1], _seeded_tiebreak_key(item[0], effective_seed)),
    )

    # 5. Clear previous aggregation for this cycle. Two overlapping aggregations of one session+cycle serialize on
    # a transaction-scoped advisory lock instead of colliding on the unique constraint at commit (Odin, round 2).
    if _is_postgres(db):
        await db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"), {"k": f"agg:{session_id}:{cycle_id}"})
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
        vote_count = vote_counts.get(theme_id_str, 0)
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
            is_final=is_final,  # False for a live (in-round) tally; the close/moderator aggregation is final
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
    # Attach replay_hash, weight audit, and category/level slice metadata
    # to first result so the pipeline can surface them without a re-query.
    if aggregated:
        aggregated[0]._replay_hash = replay_hash
        aggregated[0]._theme01_category = theme01_category
        aggregated[0]._theme_level = theme_level
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
