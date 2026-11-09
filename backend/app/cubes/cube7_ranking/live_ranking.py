"""Cube 7 — live group ranking snapshot (S4) and the moderator's final decision with transparency (CRS-22.04).

The live tally itself runs in ranking_submission.schedule_live_aggregation (coalesced, one pass per window) and is
broadcast as `ranking_complete {live: true, category_rankings}`. This module adds:

  * `live_snapshot` — the same group ranking as one readable object (GET /rankings/live), so a phone that joins late
    or reloads sees the current order without waiting for the next broadcast, with no Auth0 login (participant token);
  * `record_final_decision` — the moderator adopts a theme; when it is not the group's #1 a stated reason is required,
    and both the group's #1 and the reason are stored and broadcast (`final_decision`) so participants see them.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ranking import AggregatedRanking, Ranking
from app.models.theme import Theme

MIN_DECISION_REASON = 10


async def _labels(db: AsyncSession, ids: list[uuid.UUID]) -> dict[str, str]:
    ids = [i for i in ids if i]
    if not ids:
        return {}
    return {str(k): v for k, v in (await db.execute(select(Theme.id, Theme.label).where(Theme.id.in_(ids)))).all()}


async def live_snapshot(db: AsyncSession, session) -> dict:
    """The group ranking as stored now: per-category lists, the overall #1, counts, live/final, the decision."""
    from app.cubes.cube7_ranking.ranking_governance import category_rankings_for

    cycle_id = int(getattr(session, "current_cycle", 1) or 1)
    head = (await db.execute(
        select(AggregatedRanking).where(and_(
            AggregatedRanking.session_id == session.id, AggregatedRanking.cycle_id == cycle_id,
            AggregatedRanking.rank_position == 1,
        ))
    )).scalar_one_or_none()
    submissions = int((await db.execute(select(func.count()).select_from(Ranking).where(and_(
        Ranking.session_id == session.id, Ranking.cycle_id == cycle_id,
    )))).scalar() or 0)
    categories = await category_rankings_for(db, session.id, cycle_id) if head else {}
    labels = await _labels(db, [head.theme_id if head else None, session.final_theme_id, session.final_group_top_theme_id])
    decision = None
    if session.final_theme_id:
        fid, gid = str(session.final_theme_id), (str(session.final_group_top_theme_id) if session.final_group_top_theme_id else None)
        decision = {
            "final_theme_id": fid, "final_theme_label": labels.get(fid),
            "group_top_theme_id": gid, "group_top_theme_label": labels.get(gid) if gid else None,
            "differs_from_group": bool(gid and gid != fid),
            "reason": session.final_decision_reason,
            "decided_at": session.final_decided_at.isoformat() if session.final_decided_at else None,
        }
    return {
        "session_id": str(session.id), "short_code": session.short_code, "cycle_id": cycle_id, "status": session.status,
        "ranking_method": getattr(session, "ranking_method", None) or "borda_count",
        "algorithm": head.algorithm if head else None,
        "is_final": bool(head and head.is_final), "live": bool(head and not head.is_final),
        "aggregated_at": head.aggregated_at.isoformat() if head else None,
        "submissions": submissions, "participant_count": head.participant_count if head else 0,
        "group_top": ({"theme_id": str(head.theme_id), "label": labels.get(str(head.theme_id)), "score": float(head.score or 0),
                       "vote_count": int(head.vote_count or 0)} if head else None),
        "category_rankings": categories,
        "decision": decision,
        # CRS-36 Round 1 shortlist (empty/inactive when percent+N unset)
        "auto_select": {
            "percent": getattr(session, "auto_select_percent", None),
            "n": getattr(session, "auto_select_n", None),
            "selected": getattr(session, "auto_select_theme_ids", None) or {},
            "active": bool(getattr(session, "auto_select_theme_ids", None)) or (
                getattr(session, "auto_select_percent", None) is not None
                or getattr(session, "auto_select_n", None) is not None
            ),
        },
    }


async def record_final_decision(db: AsyncSession, session, theme_id: uuid.UUID, reason: str | None) -> dict:
    """Store the moderator's adopted theme (must be one the group ranked this cycle). Choosing anything but the
    group's #1 requires a reason of at least MIN_DECISION_REASON characters. Returns the new snapshot."""
    cycle_id = int(getattr(session, "current_cycle", 1) or 1)
    ranked = dict((await db.execute(
        select(AggregatedRanking.theme_id, AggregatedRanking.rank_position).where(and_(
            AggregatedRanking.session_id == session.id, AggregatedRanking.cycle_id == cycle_id,
        ))
    )).all())
    if not ranked:
        raise ValueError("No group ranking yet — wait for votes (or aggregate) before deciding.")
    if theme_id not in ranked:
        raise ValueError("That theme is not in this round's group ranking.")
    top = next(t for t, pos in ranked.items() if pos == 1)
    reason = (reason or "").strip() or None
    if theme_id != top and (reason is None or len(reason) < MIN_DECISION_REASON):
        raise ValueError(
            f"Choosing a theme other than the group's #1 needs a reason (at least {MIN_DECISION_REASON} characters)."
        )
    session.final_theme_id = theme_id
    session.final_group_top_theme_id = top
    session.final_decision_reason = reason
    session.final_decided_at = datetime.now(timezone.utc)
    await db.flush()
    return await live_snapshot(db, session)
