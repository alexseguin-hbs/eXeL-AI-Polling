"""CRS-36 Round 1 — variable auto-select of Theme02 themes into the Round 2 ballot set.

Moderator configures percent and/or N-of-M (e.g. 40% · 4 of 10). Selected themes advance
automatically from the live AggregatedRanking when rows exist; otherwise Themes are ordered by
(response_count, confidence, id) so the shortlist is still deterministic. Non-selected themes
stay reviewable but are rejected on Round 2 ballots (CRS-36.02). Config + selected set fold into
the replay hash (CRS-36.03).
"""
from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ranking import AggregatedRanking
from app.models.theme import Theme

# Canonical Theme01 keys — same order as top3_points / Theme01 labels
CATEGORY_ORDER = ("support", "risk", "neutral")


def validate_auto_select_config(percent: float | None, n: int | None) -> None:
    """Raise ValueError when percent/N are out of range. Both None = Round 1 off (allowed)."""
    if percent is None and n is None:
        return
    if percent is not None and not (0 < float(percent) <= 100):
        raise ValueError("auto_select_percent must be in (0, 100]")
    if n is not None and (not isinstance(n, int) or n < 1):
        raise ValueError("auto_select_n must be an integer ≥ 1")


def selected_count(m: int, percent: float | None, n: int | None) -> int:
    """How many of M themes advance. Explicit N wins when both are set; else percent; else all."""
    if m <= 0:
        return 0
    if n is not None:
        return min(int(n), m)
    if percent is not None:
        return max(1, min(m, int(math.ceil(m * float(percent) / 100.0))))
    return m


def pick_top(ordered_ids: list[uuid.UUID], percent: float | None, n: int | None) -> list[uuid.UUID]:
    """Take the leading slice of an already-ordered id list."""
    k = selected_count(len(ordered_ids), percent, n)
    return ordered_ids[:k]


def auto_select_replay_token(percent: float | None, n: int | None, selected: dict[str, list[str]] | None) -> str | None:
    """Stable token folded into Cube 7 replay hashes (CRS-36.03). None when Round 1 is off — preserves legacy hashes."""
    if percent is None and n is None and not selected:
        return None
    parts = [f"pct={percent if percent is not None else ''}", f"n={n if n is not None else ''}"]
    if selected:
        for cat in CATEGORY_ORDER:
            ids = selected.get(cat) or []
            parts.append(f"{cat}=[{','.join(ids)}]")
    return "r1=" + ";".join(parts)


async def _order_theme_ids(
    db: AsyncSession,
    session_id: uuid.UUID,
    cycle_id: int,
    candidate_ids: set[uuid.UUID],
) -> list[uuid.UUID]:
    """Prefer live AggregatedRanking score (desc); fall back to Theme.response_count/confidence/id."""
    if not candidate_ids:
        return []
    scores: dict[uuid.UUID, float] = {}
    rows = await db.execute(
        select(AggregatedRanking.theme_id, AggregatedRanking.score, AggregatedRanking.is_final).where(
            and_(
                AggregatedRanking.session_id == session_id,
                AggregatedRanking.cycle_id == cycle_id,
                AggregatedRanking.theme_id.in_(candidate_ids),
            )
        )
    )
    # Prefer final rows when both live+final exist for the same theme; else keep highest score seen.
    for theme_id, score, is_final in rows.all():
        prev = scores.get(theme_id)
        sc = float(score or 0.0)
        if prev is None or sc > prev or (is_final and sc >= (prev or 0.0)):
            scores[theme_id] = sc

    meta: dict[uuid.UUID, tuple[int, float]] = {}
    trows = await db.execute(
        select(Theme.id, Theme.response_count, Theme.confidence).where(Theme.id.in_(candidate_ids))
    )
    for tid, rc, conf in trows.all():
        meta[tid] = (int(rc or 0), float(conf or 0.0))

    def sort_key(tid: uuid.UUID) -> tuple:
        # Live score first when present; then response_count, confidence, id for stability.
        sc = scores.get(tid)
        rc, conf = meta.get(tid, (0, 0.0))
        return (
            0 if sc is None else 1,  # scored themes before unscored when mixed? prefer scored high
            sc if sc is not None else -1.0,
            rc,
            conf,
            str(tid),
        )

    # Highest score / count first. Unscored themes sort after scored ones via the 0/1 flag inverted:
    ordered = sorted(candidate_ids, key=lambda tid: (
        -(0 if scores.get(tid) is None else 1),
        -(scores[tid] if tid in scores else -1.0),
        -meta.get(tid, (0, 0.0))[0],
        -meta.get(tid, (0, 0.0))[1],
        str(tid),
    ))
    return ordered


async def compute_auto_select_set(
    db: AsyncSession,
    session,
    cycle_id: int | None = None,
    *,
    persist: bool = True,
) -> dict[str, Any]:
    """Build per-category shortlist from Theme02 at the session voting level (CRS-36 / 36.01).

    Returns {percent, n, source, selected: {cat: [uuid str]}, theme_level, cycle_id}.
    When percent and n are both unset, selected is empty and Round 1 stays off.
    """
    from app.cubes.cube7_ranking.ranking_submission import valid_theme_ids_by_category

    percent = getattr(session, "auto_select_percent", None)
    n = getattr(session, "auto_select_n", None)
    validate_auto_select_config(percent, n)
    cycle = int(cycle_id or getattr(session, "current_cycle", 1) or 1)
    level = getattr(session, "theme2_voting_level", None) or "theme2_9"
    valid = await valid_theme_ids_by_category(db, session.id, cycle, level, None)

    selected: dict[str, list[str]] = {}
    source = "off"
    if percent is not None or n is not None:
        source = "live_ranking"
        any_scored = False
        for cat in CATEGORY_ORDER:
            candidates = valid.get(cat) or set()
            ordered = await _order_theme_ids(db, session.id, cycle, candidates)
            # Detect whether any candidate had a live score (for evidence label).
            if ordered:
                check = await db.execute(
                    select(AggregatedRanking.id).where(
                        and_(
                            AggregatedRanking.session_id == session.id,
                            AggregatedRanking.cycle_id == cycle,
                            AggregatedRanking.theme_id.in_(ordered),
                        )
                    ).limit(1)
                )
                if check.scalar_one_or_none() is not None:
                    any_scored = True
            picked = pick_top(ordered, percent, n)
            selected[cat] = [str(t) for t in picked]
        if not any_scored:
            source = "theme_order"

    payload = {
        "percent": percent,
        "n": n,
        "source": source,
        "selected": selected,
        "theme_level": level.replace("theme2_", ""),
        "cycle_id": cycle,
        "computed_at": datetime.now(timezone.utc).isoformat(),
        "replay_token": auto_select_replay_token(percent, n, selected or None),
    }
    if persist:
        session.auto_select_theme_ids = selected if selected else None
        await db.flush()
    return payload


def selected_ids_for_category(session, category: str) -> set[uuid.UUID] | None:
    """Return the Round 1 allow-list for one category, or None when Round 1 is off."""
    raw = getattr(session, "auto_select_theme_ids", None)
    if not raw or not isinstance(raw, dict):
        # Config set but not yet computed → still no gate (caller should compute first).
        if getattr(session, "auto_select_percent", None) is None and getattr(session, "auto_select_n", None) is None:
            return None
        return None
    ids = raw.get(category)
    if ids is None:
        return set()
    return {uuid.UUID(str(x)) for x in ids}


def enforce_auto_select_subset(
    session,
    category: str,
    picked: list[uuid.UUID],
) -> None:
    """CRS-36.02: reject Round 2 picks outside the auto-select set when Round 1 has been computed."""
    allow = selected_ids_for_category(session, category)
    if allow is None:
        return
    extra = set(picked) - allow
    if extra:
        raise ValueError(
            f"Theme ID mismatch in {category}: {extra} were not auto-selected for Round 2 "
            f"(CRS-36 Round 1 shortlist)"
        )
