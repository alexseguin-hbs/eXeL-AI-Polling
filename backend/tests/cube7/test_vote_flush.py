"""Cube 7 — SupabaseVoteAccumulator.flush_to_db really persists (was a stub).

Invariant: a participant's latest ballot in the open cycle is the one that counts. The
flush issues ONE batched UPSERT (on the session+cycle+participant unique constraint) per
batch, drains the queue, and is a no-op when empty.
"""
from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from app.cubes.cube7_ranking.scale_engine import SupabaseVoteAccumulator


@pytest.mark.asyncio
async def test_flush_executes_one_upsert_and_drains():
    acc = SupabaseVoteAccumulator(session_id="s1", n_themes=3, seed="seed", cycle_id=2)
    acc.add_vote(["a", "b", "c"], "p1")
    acc.add_vote(["c", "b", "a"], "p2")
    acc.add_vote(["b", "a", "c"], "p1")  # p1 re-votes → upsert wins, not a duplicate row
    db = AsyncMock()
    n = await acc.flush_to_db(db)
    assert n == 3
    db.execute.assert_awaited_once()
    stmt = db.execute.await_args.args[0]
    sql = str(stmt.compile(compile_kwargs={"literal_binds": False}))
    assert "ON CONFLICT" in sql.upper() and "user_rankings" in sql
    assert acc._pending_writes == []
    # (the in-memory BordaAccumulator counts votes; the DB upsert is what makes p1's latest ballot win)


@pytest.mark.asyncio
async def test_flush_empty_is_noop():
    acc = SupabaseVoteAccumulator(session_id="s1", n_themes=3, seed="seed")
    db = AsyncMock()
    assert await acc.flush_to_db(db) == 0
    db.execute.assert_not_awaited()


def test_pending_rows_carry_cycle_and_string_ids():
    acc = SupabaseVoteAccumulator(session_id="s1", n_themes=2, seed="x", cycle_id=3)
    acc.add_vote(["t1", "t2"], "p9")
    row = acc._pending_writes[0]
    assert row["cycle_id"] == 3 and row["participant_id"] == "p9" and row["ranked_theme_ids"] == ["t1", "t2"]
