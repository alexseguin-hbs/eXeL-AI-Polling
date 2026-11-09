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
    theme01_category: str | None = None,
    allow_revote: bool = False,
) -> Ranking:
    """CRS-11.02: Validate theme IDs, store ranking, broadcast progress.

    When `theme01_category` is set (risk|support|neutral), the valid theme
    pool is restricted to Theme 02 children whose parent Theme 01 maps to
    that category. This is the Step 4 "solo ranking" gate — moderator
    picks one Theme 01 category + one level (3/6/9) before the ranking
    round opens, and participants only see themes from that slice.

    LIVING VOTE (operator 2026-09-14 "we need entire voting functionality
    working!" — live priorities that re-aggregate): when `allow_revote` is
    True and the participant already has a ballot for this open (session,
    cycle), the existing ballot is REPLACED in place (new order + timestamp)
    instead of being rejected — the count stays stable and the aggregate
    reflects the latest preference. With `allow_revote` False (the default),
    a second submission still raises, preserving one-ballot-per-cycle callers.
    """
    level_num = theme2_voting_level.replace("theme2_", "")

    # The ballot is the newest themed cycle at or before this one — the same rows GET /themes serves, never an
    # earlier cycle's leftovers beside them (Athena, AsM round 5). Evaluated inside the queries below.
    from app.cubes.cube6_ai.pipeline import ballot_cycle_clause

    in_ballot_cycle = ballot_cycle_clause(session_id, cycle_id)

    # 1a. If a category filter is set, resolve the parent-theme allowlist first.
    # Reuses the Cube 6 canonical mapping so ranking + theming stay in lock-step.
    parent_allowlist: set[uuid.UUID] | None = None
    if theme01_category:
        from app.cubes.cube6_ai.pipeline import _category_key

        parent_rows = await db.execute(
            select(Theme.id, Theme.label).where(
                and_(
                    Theme.session_id == session_id,
                    Theme.parent_theme_id.is_(None),
                    in_ballot_cycle,
                )
            )
        )
        parent_allowlist = {
            row[0]
            for row in parent_rows.all()
            if _category_key(row[1]) == theme01_category
        }
        if not parent_allowlist:
            raise ValueError(
                f"No Theme 01 parents match category '{theme01_category}' "
                f"for session {session_id}"
            )

    # 1b. Fetch valid Theme 02 IDs at the voting level (optionally category-scoped).
    #
    # Empty placeholder slots (from Cube 6's always-9 padding when a category
    # has too few real themes) are EXCLUDED from ranking — participants can
    # only rank themes that carry actual feedback. Cube 6 still emits the full
    # 9/6/3 geometry to the frontend Flower of Life (dimmed petals), but Cube 7
    # ranking sees only the non-empty slice.
    #
    # Enki + Council of Twelve · 2026-07-03.
    conditions = [
        Theme.session_id == session_id,
        Theme.parent_theme_id.isnot(None),
        in_ballot_cycle,
        Theme.cluster_metadata["level"].as_string() == level_num,
        Theme.label != "",  # empty slot label is ""
    ]
    if parent_allowlist is not None:
        conditions.append(Theme.parent_theme_id.in_(parent_allowlist))

    result = await db.execute(select(Theme.id).where(and_(*conditions)))
    valid_ids = {row[0] for row in result.all()}

    if not valid_ids:
        category_hint = f" (category={theme01_category})" if theme01_category else ""
        raise ValueError(
            f"No themes found at level {level_num}{category_hint} for session {session_id}"
        )

    # A ballot ranks every valid theme exactly once. Comparing sets alone let a repeated theme through
    # ([A, A, B, C] has the set {A, B, C}) — a double Borda share for A — and let the ballot length vary.
    submitted_set = set(ranked_theme_ids)
    if len(ranked_theme_ids) != len(submitted_set):
        raise ValueError(
            f"Duplicate theme IDs in ranking: {len(ranked_theme_ids)} entries, {len(submitted_set)} distinct. "
            f"Each theme may be ranked once."
        )
    if submitted_set != valid_ids or len(ranked_theme_ids) != len(valid_ids):
        missing = valid_ids - submitted_set
        extra = submitted_set - valid_ids
        raise ValueError(
            f"Theme ID mismatch: missing={missing}, extra={extra}. "
            f"Expected {len(valid_ids)} themes at level {level_num}."
        )

    # 2. Duplicate / living re-vote. One ballot per (session, cycle, participant).
    existing = await db.execute(
        select(Ranking).where(
            and_(
                Ranking.session_id == session_id,
                Ranking.cycle_id == cycle_id,
                Ranking.participant_id == participant_id,
            )
        )
    )
    prior = existing.scalar_one_or_none()
    if prior is not None:
        if not allow_revote:
            raise ValueError(
                f"Participant {participant_id} already submitted ranking for "
                f"session {session_id} cycle {cycle_id}"
            )
        # Living re-vote: replace the ballot in place (order + timestamp); count unchanged.
        prior.ranked_theme_ids = [str(tid) for tid in ranked_theme_ids]
        prior.submitted_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(prior)
        ranking = prior
    else:
        # 3. Store new ranking
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

    # 4. Broadcast submission progress (CRS-16: live ranking updates) — at most once per second
    # per session, off the request path. Counting every ballot and broadcasting on every vote was
    # O(N) per submit and N² deliveries (1M votes → 10¹² messages).
    if session_short_code:
        _schedule_progress(session_id, session_short_code, cycle_id)

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
# P1: top3_points ballot — original design Round 2 (top 3 per category, 3/2/1)
# ---------------------------------------------------------------------------

TOP3_POINTS = "top3_points"


async def valid_theme_ids_by_category(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int,
    theme2_voting_level: str,
    theme01_category: str | None = None,
) -> dict[str, set[uuid.UUID]]:
    """{category key: non-empty Theme02 ids at the voting level} for the ballot cycle — the same slice rules as
    submit_user_ranking (newest themed cycle, no empty placeholder slots), grouped by the parent's category."""
    from app.cubes.cube6_ai.pipeline import _category_key, ballot_cycle_clause

    level_num = theme2_voting_level.replace("theme2_", "")
    in_ballot_cycle = ballot_cycle_clause(session_id, cycle_id)
    parents = await db.execute(
        select(Theme.id, Theme.label).where(
            and_(Theme.session_id == session_id, Theme.parent_theme_id.is_(None), in_ballot_cycle)
        )
    )
    parent_cat = {pid: _category_key(label) for pid, label in parents.all()}
    kids = await db.execute(
        select(Theme.id, Theme.parent_theme_id).where(
            and_(
                Theme.session_id == session_id,
                Theme.parent_theme_id.isnot(None),
                in_ballot_cycle,
                Theme.cluster_metadata["level"].as_string() == level_num,
                Theme.label != "",
            )
        )
    )
    out: dict[str, set[uuid.UUID]] = {}
    for tid, parent in kids.all():
        cat = parent_cat.get(parent)
        if cat and (theme01_category is None or cat == theme01_category):
            out.setdefault(cat, set()).add(tid)
    return out


async def submit_top3_ballot(
    db: AsyncSession,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    category_ballots: dict[str, list[uuid.UUID]],
    cycle_id: int = 1,
    theme2_voting_level: str = "theme2_9",
    session_short_code: str | None = None,
    theme01_category: str | None = None,
    allow_revote: bool = False,
) -> Ranking:
    """P1: store a top3_points ballot — per category voted, 1–3 distinct themes of THAT category, best first.

    Stored in the existing user_rankings row (one per participant per cycle; no schema change) as
    {"method": "top3_points", "category_ballots": {cat: [ids]}, "ranked_theme_ids": [flat ids]} — the
    flat list keeps every existing reader of the {"ranked_theme_ids": [...]} shape working. A re-vote
    replaces the whole ballot (all categories), the same living-vote rule as the Borda path.
    """
    valid = await valid_theme_ids_by_category(db, session_id, cycle_id, theme2_voting_level, theme01_category)
    if not valid:
        raise ValueError(f"No themes found at level {theme2_voting_level} for session {session_id}")
    clean: dict[str, list[str]] = {}
    for cat in ("support", "risk", "neutral"):  # canonical order: Support, Concerns, Neutral (original sketch)
        ids = category_ballots.get(cat)
        if ids is None:
            continue
        if cat not in valid:
            raise ValueError(f"Category '{cat}' has no themes to vote on in this round")
        if not 1 <= len(ids) <= 3 or len(ids) != len(set(ids)):
            raise ValueError(f"category_ballots[{cat}] must pick 1–3 distinct themes")
        extra = set(ids) - valid[cat]
        if extra:
            raise ValueError(f"Theme ID mismatch in {cat}: {extra} are not {cat} themes at this level")
        clean[cat] = [str(t) for t in ids]
    if not clean:
        raise ValueError("category_ballots must vote at least one category")
    stored = {
        "method": TOP3_POINTS,
        "category_ballots": clean,
        "ranked_theme_ids": [t for cat in clean for t in clean[cat]],
    }

    prior = (await db.execute(
        select(Ranking).where(
            and_(Ranking.session_id == session_id, Ranking.cycle_id == cycle_id, Ranking.participant_id == participant_id)
        )
    )).scalar_one_or_none()
    if prior is not None:
        if not allow_revote:
            raise ValueError(
                f"Participant {participant_id} already submitted ranking for session {session_id} cycle {cycle_id}"
            )
        prior.ranked_theme_ids = stored
        prior.submitted_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(prior)
        ranking = prior
    else:
        ranking = Ranking(
            session_id=session_id, cycle_id=cycle_id, participant_id=participant_id,
            ranked_theme_ids=stored, submitted_at=datetime.now(timezone.utc),
        )
        db.add(ranking)
        await db.flush()
        await db.refresh(ranking)
    if session_short_code:
        _schedule_progress(session_id, session_short_code, cycle_id)
    logger.info("cube7.ranking.submitted", extra={"session_id": str(session_id), "method": TOP3_POINTS,
                                                   "categories": sorted(clean)})
    return ranking


PROGRESS_INTERVAL_S = 1.0
_progress_due: dict[tuple, float] = {}   # (session, cycle) → monotonic time the next send is allowed
_progress_tasks: set = set()


def _schedule_progress(session_id: uuid.UUID, short_code: str, cycle_id: int) -> None:
    """Coalesce: the first vote in a window schedules one send at the window's end."""
    import asyncio
    import time

    key = (session_id, cycle_id)
    now = time.monotonic()
    due = _progress_due.get(key)
    if due is not None and due > now:
        return  # a send is already scheduled for this window; it will count this ballot too
    _progress_due[key] = now + PROGRESS_INTERVAL_S

    async def _send():
        await asyncio.sleep(PROGRESS_INTERVAL_S)
        try:
            from app.db.postgres import async_session_factory

            async with async_session_factory() as bg_db:
                await _broadcast_ranking_progress(bg_db, session_id, short_code, cycle_id)
        except Exception as exc:  # noqa: BLE001 — progress is best-effort
            logger.debug("cube7.ranking_progress.failed", extra={"error": str(exc)})

    try:
        task = asyncio.get_running_loop().create_task(_send())
    except RuntimeError:
        _progress_due.pop(key, None)
        return
    _progress_tasks.add(task)
    task.add_done_callback(_progress_tasks.discard)


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
# G3 (live 9-theme prioritization): debounced live aggregation while ranking is open
# ---------------------------------------------------------------------------
# Before this, nothing in a real session ever ran the tally (only the Admin Console sim driver called
# POST /rankings/aggregate), so the moderator and phones never saw a group ranking. Now each accepted ballot in a
# session whose status is "ranking" schedules ONE live tally per window per (session, cycle) — the same coalescing
# as ranking_progress above, so N ballots in a window cost one aggregation, not N. The live run writes is_final=False
# rows and broadcasts ranking_complete {live: true}; it never fires the ranking_complete webhook or CQS (those run
# once, on the final aggregation at close or when the moderator aggregates). The window's task re-reads the session,
# so a round that closed or moved to a new cycle in the meantime is left alone.

LIVE_AGGREGATE_INTERVAL_S = 2.0
_live_due: dict[tuple, float] = {}
_live_tasks: set = set()


def schedule_live_aggregation(session_id: uuid.UUID, short_code: str, cycle_id: int) -> bool:
    """Coalesce live tallies: the first ballot in a window schedules one run at the window's end. True if scheduled."""
    import asyncio
    import time

    key = (session_id, cycle_id)
    now = time.monotonic()
    due = _live_due.get(key)
    if due is not None and due > now:
        return False  # a run is already scheduled for this window; it will include this ballot
    _live_due[key] = now + LIVE_AGGREGATE_INTERVAL_S

    async def _run():
        await asyncio.sleep(LIVE_AGGREGATE_INTERVAL_S)
        try:
            from app.db.postgres import async_session_factory

            async with async_session_factory() as bg_db:
                await run_live_aggregation(bg_db, session_id, short_code, cycle_id)
        except Exception as exc:  # noqa: BLE001 — a live tally is best-effort; the final one runs at close
            logger.warning("cube7.live_aggregate.failed", extra={"session_id": str(session_id), "error": str(exc)})

    try:
        task = asyncio.get_running_loop().create_task(_run())
    except RuntimeError:
        _live_due.pop(key, None)
        return False
    _live_tasks.add(task)
    task.add_done_callback(_live_tasks.discard)
    return True


async def run_live_aggregation(
    db: AsyncSession, session_id: uuid.UUID, short_code: str, cycle_id: int
) -> dict | None:
    """One live tally, only if the session is still ranking in this cycle. Returns the pipeline result or None."""
    from app.models.session import Session
    from app.cubes.cube7_ranking.ranking_governance import run_ranking_pipeline

    s = (await db.execute(select(Session).where(Session.id == session_id))).scalar_one_or_none()
    if s is None or s.status != "ranking" or int(getattr(s, "current_cycle", 1) or 1) != cycle_id:
        return None
    return await run_ranking_pipeline(
        db, session_id=session_id, session_short_code=short_code, seed=s.seed, cycle_id=cycle_id, live=True,
    )
