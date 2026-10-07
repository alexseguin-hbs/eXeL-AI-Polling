"""HP-05 parity: the Postgres tally and the Python tally give the same aggregation, byte for byte.

aggregate_rankings takes the SQL path on Postgres with equal weights (1M ballots: 37 s / 3.4 GB → 1.8 s / 0.2 GB,
backend/scripts/sim_1m.py). This proves the two paths agree on order, scores, vote counts, participant count and
the replay hash, including the shapes the 1M run does not cover: dict-wrapped ballots, excluded participants, a
theme repeated inside one ballot, and the empty / all-excluded refusals. Runs against a local Postgres
(SIM_TEST_DSN, default polling@localhost/sim_parity); skipped when none is reachable.
"""
from __future__ import annotations

import asyncio
import json
import os
import random
import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import pytest

DSN = os.environ.get("SIM_TEST_DSN", "postgresql://polling:polling@localhost:5432/sim_parity")


def _reachable() -> bool:
    try:
        import asyncpg

        async def probe():
            c = await asyncpg.connect(DSN.replace("/sim_parity", "/postgres"), timeout=2)
            await c.close()

        asyncio.run(probe())
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _reachable(), reason="no local Postgres for the SQL-tally parity proof")


async def _engine():
    import asyncpg
    from sqlalchemy.ext.asyncio import create_async_engine

    import app.models  # noqa: F401
    from app.db.base import Base

    admin = await asyncpg.connect(DSN.replace("/sim_parity", "/postgres"))
    if not await admin.fetchval("select 1 from pg_database where datname='sim_parity'"):
        await admin.execute('create database "sim_parity"')
    await admin.close()
    eng = create_async_engine(DSN.replace("postgresql://", "postgresql+asyncpg://"))
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        from sqlalchemy import text

        # The parity database is this test's own: start every proof from empty (same seeds → same ids).
        await conn.execute(text("truncate user_rankings, aggregated_rankings, participants, themes, sessions cascade"))
    return eng


async def _seed(eng, rng: random.Random, n: int, themes: list[uuid.UUID]) -> tuple[uuid.UUID, list[str]]:
    from sqlalchemy import text

    sid = uuid.UUID(int=rng.getrandbits(128))
    now = datetime(2026, 10, 7, tzinfo=timezone.utc)
    async with eng.begin() as conn:
        await conn.execute(text(
            "insert into sessions (id, short_code, created_by, status, title, anonymity_mode, cycle_mode, max_cycles, "
            "current_cycle, ranking_mode, language, max_response_length, ai_provider, stt_provider, realtime_stt_enabled, "
            "realtime_stt_provider, allow_user_stt_choice, theme_id, session_type, polling_mode, polling_mode_type, "
            "timer_display_mode, pricing_tier, fee_amount_cents, estimated_cost_cents, cost_splitting_enabled, "
            "reward_enabled, reward_amount_cents, theme2_voting_level, live_feed_enabled, is_paid) values "
            "(:id, :code, 't', 'ranking', 't', 'anonymous', 'single', 1, 1, 'auto', 'en', 3333, 'openai', 'whisper', "
            "false, 'none', false, 'exel-cyan', 'polling', 'live', 'live_interactive', 'countdown', 'free', 0, 0, "
            "false, false, 0, 'theme2_9', true, false)"), {"id": sid, "code": f"P{rng.getrandbits(28):07X}"[:8]})
        for t in themes:
            await conn.execute(text(
                "insert into themes (id, session_id, cycle_id, label, summary, confidence, response_count, ai_provider, "
                "ai_model) values (:id, :s, 1, 'x', 'x', 0.7, 0, 'offline', 'sim') on conflict (id) do nothing"),
                {"id": t, "s": sid})
        pids = []
        for i in range(n):
            pid = uuid.UUID(int=rng.getrandbits(128))
            pids.append(str(pid))
            order = [str(t) for t in themes]
            rng.shuffle(order)
            if i % 17 == 0:
                order[1] = order[0]  # a theme repeated inside one ballot
            body = {"ranked_theme_ids": order} if i % 5 == 0 else order  # both stored shapes
            await conn.execute(text(
                "insert into participants (id, session_id, user_id, joined_at, is_active, language_code, "
                "results_opt_in, payment_status) values (:p, :s, :u, :t, true, 'en', false, 'free')"),
                {"p": pid, "s": sid, "u": f"u{i}", "t": now})
            await conn.execute(text(
                "insert into user_rankings (id, session_id, cycle_id, participant_id, ranked_theme_ids, submitted_at) "
                "values (:id, :s, 1, :p, CAST(:b AS json), :t)"),
                {"id": uuid.UUID(int=rng.getrandbits(128)), "s": sid, "p": pid, "b": json.dumps(body), "t": now})
    return sid, pids


async def _run(eng, sid, excluded, python_path: bool):
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from app.cubes.cube7_ranking import ranking_aggregation as agg

    async with async_sessionmaker(eng)() as db:
        if python_path:
            with patch.object(agg, "_is_postgres", return_value=False):
                rows = await agg.aggregate_rankings(db, sid, excluded_participant_ids=excluded, seed="parity")
        else:
            assert agg._is_postgres(db)
            rows = await agg.aggregate_rankings(db, sid, excluded_participant_ids=excluded, seed="parity")
        out = [(str(r.theme_id), r.rank_position, r.score, r.vote_count, r.participant_count) for r in rows]
        out.append(getattr(rows[0], "_replay_hash"))
        await db.rollback()
        return out


@pytest.mark.parametrize("n,seed", [(1, 1), (40, 7), (257, 2525)])
def test_sql_and_python_tallies_agree(n, seed):
    async def go():
        eng = await _engine()
        rng = random.Random(seed)
        themes = [uuid.UUID(int=rng.getrandbits(128)) for _ in range(9)]
        sid, pids = await _seed(eng, rng, n, themes)
        excluded = set(rng.sample(pids, k=n // 10)) if n > 10 else set()
        a = await _run(eng, sid, excluded, python_path=True)
        b = await _run(eng, sid, excluded, python_path=False)
        await eng.dispose()
        return a, b

    a, b = asyncio.run(go())
    assert a == b


def test_refusals_match():
    """No ballots, and every ballot excluded, refuse with the same words on both paths."""
    async def go():
        eng = await _engine()
        rng = random.Random(99)
        themes = [uuid.UUID(int=rng.getrandbits(128)) for _ in range(9)]
        sid, pids = await _seed(eng, rng, 3, themes)
        empty = uuid.UUID(int=rng.getrandbits(128))
        msgs = []
        for path in (True, False):
            for target, excl in ((empty, set()), (sid, set(pids))):
                try:
                    await _run(eng, target, excl, python_path=path)
                    msgs.append(None)
                except ValueError as e:
                    msgs.append(str(e).split(" for session")[0].split(" after")[0])
        await eng.dispose()
        return msgs

    m = asyncio.run(go())
    assert m[:2] == m[2:] and None not in m
