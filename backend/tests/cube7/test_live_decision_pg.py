"""S4 live snapshot (spectators/participants) and CRS-22.04 moderator final decision with transparency.

Real Postgres (SIM_TEST_DSN / local polling@localhost; skipped when none — CI's backend job has one). Participants
are labelled "SIMULATED bot n"; no real user is created.
"""
from __future__ import annotations

import asyncio
import json
import random
import time
import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import pytest

from tests.own_db import own_dsn

DSN = own_dsn("SIM_TEST_DSN", "postgresql://polling:polling@localhost:5432/live_decision")
_DB = DSN.rsplit("/", 1)[1]
_ADMIN = DSN.rsplit("/", 1)[0] + "/postgres"


def _reachable() -> bool:
    try:
        import asyncpg

        async def probe():
            c = await asyncpg.connect(_ADMIN, timeout=2)
            await c.close()

        asyncio.run(probe())
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _reachable(), reason="no local Postgres for the live-decision proof")

CATS = {"support": "Supporting Comments", "risk": "Risk & Concerns", "neutral": "Neutral Comments"}


async def _engine():
    import asyncpg
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine

    import app.models  # noqa: F401
    from app.db.base import Base

    admin = await asyncpg.connect(_ADMIN)
    if not await admin.fetchval("select 1 from pg_database where datname=$1", _DB):
        await admin.execute(f'create database "{_DB}"')
    await admin.close()
    eng = create_async_engine(DSN.replace("postgresql://", "postgresql+asyncpg://"))
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("truncate user_rankings, aggregated_rankings, participants, themes, sessions cascade"))
    return eng


async def _seed(db, method: str | None):
    from app.models.session import Session
    from app.models.theme import Theme

    s = Session(short_code=f"T{random.getrandbits(28):07X}"[:8], created_by="test|simulated", status="ranking",
                title="TEST SIMULATED live decision", theme2_voting_level="theme2_9", ranking_method=method, seed="seed")
    db.add(s)
    await db.flush()
    by_cat: dict[str, list[uuid.UUID]] = {}
    for key, label in CATS.items():
        parent = Theme(session_id=s.id, cycle_id=1, label=label, summary=label, confidence=0.9)
        db.add(parent)
        await db.flush()
        ids = []
        for i in range(9):
            t = Theme(session_id=s.id, cycle_id=1, label=f"{key} theme {i + 1}", summary="x", confidence=0.8,
                      parent_theme_id=parent.id, cluster_metadata={"level": "9"})
            db.add(t)
            await db.flush()
            ids.append(t.id)
        by_cat[key] = ids
    await db.flush()
    return s, by_cat


async def _bots(db, s, n):
    from app.models.participant import Participant

    ps = [Participant(session_id=s.id, joined_at=datetime.now(timezone.utc), display_name=f"SIMULATED bot {i}")
          for i in range(n)]
    db.add_all(ps)
    await db.flush()
    return [p.id for p in ps]


def _ballot(rng, by_cat):
    out = {c: rng.sample(ids, rng.randint(1, 3)) for c, ids in by_cat.items() if rng.random() < 0.85}
    return out or {"support": [by_cat["support"][0]]}


async def test_live_snapshot_and_final_decision_transparency():
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from app.cubes.cube7_ranking.live_ranking import live_snapshot, record_final_decision
    from app.cubes.cube7_ranking.ranking_submission import run_live_aggregation, submit_top3_ballot
    from app.models.session import Session

    eng = await _engine()
    try:
        async with async_sessionmaker(eng, expire_on_commit=False)() as db:
            s, by_cat = await _seed(db, "top3_points")
            sid, code = s.id, s.short_code
            pids = await _bots(db, s, 12)
            await db.commit()
            empty = await live_snapshot(db, s)
            assert empty["submissions"] == 0 and empty["group_top"] is None and empty["category_rankings"] == {}
            with pytest.raises(ValueError, match="No group ranking"):
                await record_final_decision(db, s, by_cat["support"][0], None)
            await db.rollback()
            rng = random.Random(9)
            for pid in pids:
                await submit_top3_ballot(db, sid, pid, _ballot(rng, by_cat), 1, "theme2_9", None, None, True)
            await db.commit()
            with patch("app.core.supabase_broadcast.broadcast_event", return_value=True):
                res = await run_live_aggregation(db, sid, code, 1)
            assert res and res["status"] == "ranking_live"
            s = (await db.execute(select(Session).where(Session.id == sid))).scalar_one()
            snap = await live_snapshot(db, s)
            assert snap["submissions"] == 12 and snap["live"] is True and snap["is_final"] is False
            assert set(snap["category_rankings"]) <= {"support", "risk", "neutral"}
            top = snap["group_top"]
            assert top and top["label"]
            other = next(r["theme_id"] for c in snap["category_rankings"].values() for r in c if r["theme_id"] != top["theme_id"])
            with pytest.raises(ValueError, match="reason"):
                await record_final_decision(db, s, uuid.UUID(other), "short")
            with pytest.raises(ValueError, match="not in this round"):
                await record_final_decision(db, s, uuid.uuid4(), "A long enough reason here.")
            d = await record_final_decision(db, s, uuid.UUID(other), "Budget covers only this one this quarter.")
            await db.commit()
            dec = d["decision"]
            assert dec["differs_from_group"] is True and dec["group_top_theme_id"] == top["theme_id"]
            assert dec["group_top_theme_label"] == top["label"] and dec["reason"].startswith("Budget")
            same = await record_final_decision(db, s, uuid.UUID(top["theme_id"]), None)
            assert same["decision"]["differs_from_group"] is False and same["decision"]["reason"] is None
    finally:
        await eng.dispose()
