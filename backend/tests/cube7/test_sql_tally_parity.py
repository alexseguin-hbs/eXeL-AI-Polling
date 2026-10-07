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
_DB = DSN.rsplit("/", 1)[1]  # the parity database is the test's own; another name keeps parallel runs apart
_ADMIN_DSN = DSN.rsplit("/", 1)[0] + "/postgres"


def _reachable() -> bool:
    try:
        import asyncpg

        async def probe():
            c = await asyncpg.connect(_ADMIN_DSN, timeout=2)
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

    admin = await asyncpg.connect(_ADMIN_DSN)
    if not await admin.fetchval("select 1 from pg_database where datname=$1", _DB):
        await admin.execute(f'create database "{_DB}"')
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


# ---------------------------------------------------------------------------
# AsM approval round 1 (2026-10-07): n_themes, anomaly detection and verify_replay on both paths
# ---------------------------------------------------------------------------


async def _seed_rows(eng, rng: random.Random, rows: list[tuple[object, datetime]], themes) -> tuple[uuid.UUID, list[str]]:
    """A session whose ballots are exactly `rows` (body, submitted_at), inserted in the given order."""
    from sqlalchemy import text

    sid, _ = await _seed(eng, rng, 0, [uuid.UUID(str(t)) for t in themes])
    pids = []
    async with eng.begin() as conn:
        for body, ts in rows:
            pid = uuid.UUID(int=rng.getrandbits(128))
            pids.append(str(pid))
            await conn.execute(text(
                "insert into participants (id, session_id, user_id, joined_at, is_active, language_code, "
                "results_opt_in, payment_status) values (:p, :s, :u, :t, true, 'en', false, 'free')"),
                {"p": pid, "s": sid, "u": f"u{len(pids)}", "t": ts})
            await conn.execute(text(
                "insert into user_rankings (id, session_id, cycle_id, participant_id, ranked_theme_ids, submitted_at) "
                "values (:id, :s, 1, :p, CAST(:b AS json), :t)"),
                {"id": uuid.UUID(int=rng.getrandbits(128)), "s": sid, "p": pid, "b": json.dumps(body), "t": ts})
    return sid, pids


def _burst_rows(rng: random.Random, themes: list[uuid.UUID]) -> list[tuple[object, datetime]]:
    """Background voting with: a dominant identical burst (flagged), a dict-shaped burst (flagged), a trio of a
    popular order inside a busy window (not flagged), equal timestamps, and ballots spaced exactly 2 s apart."""
    from datetime import timedelta

    t0 = datetime(2026, 10, 7, 12, tzinfo=timezone.utc)
    ids = [str(t) for t in themes]
    rows = []
    for i in range(240):  # ~4 ballots/s for 60 s
        order = list(ids)
        rng.shuffle(order)
        rows.append((order, t0 + timedelta(milliseconds=250 * i)))
    swarm = list(reversed(ids))
    for k in range(25):  # 25 identical inside 1.2 s → dominates its window
        rows.append((swarm, t0 + timedelta(seconds=20, milliseconds=48 * k)))
    for k in range(12):  # dict-shaped swarm, several at the very same instant
        rows.append(({"ranked_theme_ids": ids}, t0 + timedelta(seconds=40, milliseconds=100 * (k // 3))))
    popular = ids[1:] + ids[:1]
    for k in range(3):  # three honest voters on a popular order in a busy window: below BURST_SHARE
        rows.append((popular, t0 + timedelta(seconds=50, milliseconds=500 * k)))
    for k in range(4):  # exactly 2 s apart: the window edge is inclusive on both paths
        rows.append((ids[::2] + ids[1::2], t0 + timedelta(seconds=70 + 2 * k)))
    rng.shuffle(rows)  # insertion order must not matter
    return rows


async def _anomalies(eng, sid, python_path: bool):
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from app.cubes.cube7_ranking import ranking_aggregation as agg
    from app.cubes.cube7_ranking.ranking_governance import detect_voting_anomalies

    async with async_sessionmaker(eng)() as db:
        if python_path:
            with patch.object(agg, "_is_postgres", return_value=False):
                return await detect_voting_anomalies(db, sid)
        return await detect_voting_anomalies(db, sid)


@pytest.mark.parametrize("seed", [11, 2525])
def test_anomaly_detection_sql_matches_python(seed):
    """detect_voting_anomalies: the Postgres window counts give the very list the ORM scan gives."""
    async def go():
        eng = await _engine()
        rng = random.Random(seed)
        themes = [uuid.UUID(int=rng.getrandbits(128)) for _ in range(6)]
        sid, _ = await _seed_rows(eng, rng, _burst_rows(rng, themes), themes)
        a = await _anomalies(eng, sid, python_path=True)
        b = await _anomalies(eng, sid, python_path=False)
        await eng.dispose()
        return a, b

    a, b = asyncio.run(go())
    assert a == b
    bursts = [x for x in a if x["type"] == "identical_ranking_burst"]
    assert sum(x["count"] for x in bursts) >= 25 + 12  # both swarms caught, whole
    assert any(x["ranking_key"].startswith("{") for x in bursts)  # the dict-shaped swarm


def test_mixed_length_ballots_same_width_both_paths():
    """n_themes is the longest ballot on both paths, whatever order the rows come back in."""
    async def go():
        eng = await _engine()
        rng = random.Random(5)
        themes = [str(uuid.UUID(int=rng.getrandbits(128))) for _ in range(5)]
        t = datetime(2026, 10, 7, tzinfo=timezone.utc)
        out = []
        for rows in ([(themes[:3], t), (themes, t), (themes[:4], t)], [(themes, t), (themes[:4], t), (themes[:3], t)]):
            sid, _ = await _seed_rows(eng, rng, rows, themes)
            a = await _run(eng, sid, set(), python_path=True)
            b = await _run(eng, sid, set(), python_path=False)
            out.append((a, b))
        await eng.dispose()
        return out

    (a1, b1), (a2, b2) = asyncio.run(go())
    assert a1 == b1 and a2 == b2
    # Width 5 → the top of each ballot scores 4: theme0 is first on all three ballots.
    assert a1[0][2] == 12.0 and a2[0][2] == 12.0


@pytest.mark.parametrize("python_path", [True, False])
def test_verify_replay_reproduces_the_aggregation(python_path):
    """verify_replay re-runs the pipeline's own inputs (exclusions, dict ballots, the SQL tally) and agrees."""
    async def go():
        from sqlalchemy.ext.asyncio import async_sessionmaker

        from app.cubes.cube7_ranking import ranking_aggregation as agg
        from app.cubes.cube7_ranking.ranking_governance import (
            _burst_exclusions, detect_voting_anomalies, verify_replay,
        )

        eng = await _engine()
        rng = random.Random(77)
        themes = [uuid.UUID(int=rng.getrandbits(128)) for _ in range(6)]
        sid, _ = await _seed_rows(eng, rng, _burst_rows(rng, themes), themes)
        async with async_sessionmaker(eng)() as db:
            ctx = patch.object(agg, "_is_postgres", return_value=False) if python_path else patch.object(
                agg, "_is_postgres", wraps=agg._is_postgres)
            with ctx:
                excluded = _burst_exclusions(await detect_voting_anomalies(db, sid))
                # theme_level "9": what run_ranking_pipeline reads from the session (theme2_9), as verify_replay does.
                rows = await agg.aggregate_rankings(
                    db, sid, seed="parity", excluded_participant_ids=excluded, theme_level="9")
                v = await verify_replay(db, sid, seed="parity")
            await db.rollback()
        await eng.dispose()
        return excluded, rows, v

    excluded, rows, v = asyncio.run(go())
    assert excluded  # the fixture's swarms are excluded, so the old no-exclusion replay would have disagreed
    assert v["replay_hash"] == getattr(rows[0], "_replay_hash")
    assert v["match"] is True and v["recomputed_order"] == [str(r.theme_id) for r in rows]
    assert v["participant_count"] == rows[0].participant_count
    assert v["excluded_participants"] == len(excluded)
