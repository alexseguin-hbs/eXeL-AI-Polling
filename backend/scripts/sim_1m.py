"""1M SIM harness: seed a past-poll-shaped session locally and measure the REAL Cube 7 code against it.

Operator asks (docs/asks/2026.10.06_21.04..37_ssses_loop_apis.md, addenda 1, 4, 5):
  * serve 1M live polling feeds with voting on the prioritization of 9 themes;
  * test 1M in SIM so a LIVE session's API is never called, and compare new code against a baseline;
  * any provider replay needs HI approval with a cost estimate first (this harness never calls a provider);
  * Theme01 = Risk & Concerns / Supporting Comments / Neutral Comments, each split into 9 Theme02 (reducible to 6 or 3).

Invariants (refusals, not conventions):
  * the database host must be local (localhost / 127.0.0.1 / ::1) and ENVIRONMENT must not be production;
  * no network and no AI provider: aggregation is pure Borda over seeded ballots;
  * same --seed -> same participants, same ballots, same result hash.

Usage (from backend/):
  python scripts/sim_1m.py seed  --n 1000000          # create + fill the local sim database
  python scripts/sim_1m.py bench --out /tmp/new.json  # time aggregate_rankings, peak RSS, result hash
  python scripts/sim_1m.py bench --endpoint            # time run_ranking_pipeline (POST /rankings/aggregate)
  python scripts/sim_1m.py seed --shape unanimous      # every ballot identical (the hash-feed worst case)
  python scripts/sim_compare.py <baseline-sha>         # baseline worktree vs this tree, same database
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import random
import resource
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

DEFAULT_DSN = "postgresql://polling:polling@localhost:5432/sim_1m"
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}

SID = uuid.UUID("00000000-0000-0000-0000-0000005a1001")
CATEGORIES = ["Risk & Concerns", "Supporting Comments", "Neutral Comments"]
# Theme01 parents and their nine Theme02 children (addendum 5). Ids are fixed so every run seeds the same session.
PARENTS = [uuid.UUID(f"00000000-0000-0000-0000-0000005b{c:02d}00") for c in range(3)]
CHILDREN = [[uuid.UUID(f"00000000-0000-0000-0000-0000005b{c:02d}{t + 1:02d}") for t in range(9)] for c in range(3)]
# Distribution of open-ended inputs across Theme01 (a past poll's shape: concerns lead).
CATEGORY_WEIGHTS = [0.40, 0.35, 0.25]


def refuse_unless_local(dsn: str) -> None:
    host = urlparse(dsn.replace("+asyncpg", "")).hostname or ""
    if host not in LOCAL_HOSTS:
        sys.exit(f"REFUSED: the 1M SIM runs only against a local database (got host {host!r}). A LIVE session is never touched.")
    if os.environ.get("ENVIRONMENT", "").lower() == "production":
        sys.exit("REFUSED: ENVIRONMENT=production. The 1M SIM never runs against production.")


def ballot(rng: random.Random, themes: list[uuid.UUID], shape: str = "poll") -> list[str]:
    """A ranking of the nine themes. "poll": a shared base order with a few adjacent swaps (popular orders repeat,
    as in a real poll). "uniform": every order equally likely — the worst case for collapsing identical ballots.
    "unanimous": every ballot identical — the worst case for the replay-hash feed (one order × N voters)."""
    order = list(themes)
    if shape == "unanimous":
        return [str(t) for t in order]
    if shape == "uniform":
        rng.shuffle(order)
        return [str(t) for t in order]
    for _ in range(rng.randint(0, 6)):
        i = rng.randint(0, 7)
        order[i], order[i + 1] = order[i + 1], order[i]
    return [str(t) for t in order]


async def ensure_database(dsn: str) -> None:
    import asyncpg

    u = urlparse(dsn)
    name = u.path.lstrip("/")
    admin = await asyncpg.connect(dsn.replace(f"/{name}", "/postgres"))
    try:
        if not await admin.fetchval("select 1 from pg_database where datname=$1", name):
            await admin.execute(f'create database "{name}"')
    finally:
        await admin.close()


async def create_schema(dsn: str) -> None:
    from sqlalchemy.ext.asyncio import create_async_engine

    import app.models  # noqa: F401  (registers every table on Base.metadata)
    from app.db.base import Base

    engine = create_async_engine(dsn.replace("postgresql://", "postgresql+asyncpg://"))
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


async def seed(dsn: str, n: int, seed_value: int, category: int, shape: str = "poll") -> dict:
    import asyncpg

    await ensure_database(dsn)
    await create_schema(dsn)
    c = await asyncpg.connect(dsn)
    t0 = time.perf_counter()
    await c.execute("truncate user_rankings, aggregated_rankings, participants, themes, sessions cascade")
    await c.execute(
        """insert into sessions (id, short_code, created_by, status, title, anonymity_mode, cycle_mode, max_cycles,
        current_cycle, ranking_mode, language, max_response_length, ai_provider, stt_provider, realtime_stt_enabled,
        realtime_stt_provider, allow_user_stt_choice, theme_id, session_type, polling_mode, polling_mode_type,
        timer_display_mode, pricing_tier, fee_amount_cents, estimated_cost_cents, cost_splitting_enabled,
        reward_enabled, reward_amount_cents, theme2_voting_level, live_feed_enabled, is_paid, theme01_category)
        values ($1,'SIM1M001','sim','ranking','1M SIM','anonymous','single',1,1,'auto','en',3333,'openai','whisper',
        false,'none',false,'exel-cyan','polling','live','live_interactive','countdown','free',0,0,false,false,0,
        'theme2_9',true,false,$2)""",
        SID, CATEGORIES[category],
    )
    for ci, (parent, label) in enumerate(zip(PARENTS, CATEGORIES)):
        await c.execute(
            """insert into themes (id, session_id, cycle_id, label, summary, confidence, response_count, ai_provider,
            ai_model, cluster_metadata) values ($1,$2,1,$3,'Theme01',0.9,0,'offline','sim',$4)""",
            parent, SID, label, json.dumps({"level": "theme01"}),
        )
        for ti, child in enumerate(CHILDREN[ci]):
            await c.execute(
                """insert into themes (id, session_id, cycle_id, label, summary, confidence, response_count, ai_provider,
                ai_model, parent_theme_id, cluster_metadata) values ($1,$2,1,$3,'Theme02',$4,0,'offline','sim',$5,$6)""",
                child, SID, f"{label} · {ti + 1}", round(0.6 + 0.04 * ti, 2), parent, json.dumps({"level": "9"}),
            )
    rng = random.Random(seed_value)
    start = datetime(2026, 10, 1, 12, 0, tzinfo=timezone.utc)
    pids = [uuid.UUID(int=rng.getrandbits(128)) for _ in range(n)]
    await c.copy_records_to_table(
        "participants",
        records=[(SID, f"sim_{i}", start, True, "en", False, "free", p) for i, p in enumerate(pids)],
        columns=["session_id", "user_id", "joined_at", "is_active", "language_code", "results_opt_in", "payment_status", "id"],
    )
    # The session votes on the nine Theme02 of its Theme01 category; ballots arrive over ten minutes (~1,667/s at 1M).
    themes = CHILDREN[category]
    recs = [
        (SID, 1, p, json.dumps(ballot(rng, themes, shape)), start + timedelta(seconds=600 * i / n), uuid.UUID(int=rng.getrandbits(128)))
        for i, p in enumerate(pids)
    ]
    await c.copy_records_to_table(
        "user_rankings", records=recs,
        columns=["session_id", "cycle_id", "participant_id", "ranked_theme_ids", "submitted_at", "id"],
    )
    await c.execute("analyze")
    await c.close()
    return {"seeded": n, "shape": shape, "category": CATEGORIES[category], "seconds": round(time.perf_counter() - t0, 2)}


async def bench_endpoint(dsn: str, runs: int) -> dict:
    """Time what POST /rankings/aggregate runs: run_ranking_pipeline (anomaly detection → exclusions → tally → top
    theme → emit). No network: the Supabase broadcast is stubbed, and commit becomes a flush so the run is rolled back
    (the sim never keeps its aggregation). Anomaly and aggregate time are measured inside the same call."""
    os.environ["DATABASE_URL"] = dsn.replace("postgresql://", "postgresql+asyncpg://")
    from unittest.mock import patch

    from app.core import supabase_broadcast
    from app.cubes.cube7_ranking import ranking_governance as gov
    from app.db.postgres import async_session_factory

    async def no_broadcast(*_a, **_k):
        return None

    def timed(fn, bucket: list):
        async def wrapper(*a, **k):
            t0 = time.perf_counter()
            try:
                return await fn(*a, **k)
            finally:
                bucket.append(time.perf_counter() - t0)
        return wrapper

    total, anomalies_t, aggregate_t = [], [], []
    result = None
    with patch.object(supabase_broadcast, "broadcast_event", no_broadcast), \
            patch.object(gov, "detect_voting_anomalies", timed(gov.detect_voting_anomalies, anomalies_t)), \
            patch.object(gov, "aggregate_rankings", timed(gov.aggregate_rankings, aggregate_t)):
        for _ in range(runs):
            async with async_session_factory() as db:
                db.commit = db.flush  # measure only: rolled back below
                t0 = time.perf_counter()
                try:
                    out = await gov.run_ranking_pipeline(db, SID, "SIM1M001", cycle_id=1, seed="sim-1m")
                    result = {k: out[k] for k in (
                        "participant_count", "replay_hash", "anomaly_count", "excluded_participants", "top_theme2_id")}
                    result["anomalies_sha256"] = hashlib.sha256(
                        json.dumps(out["anomalies"], sort_keys=True, default=str).encode()).hexdigest()
                except ValueError as e:  # e.g. every ballot excluded: the refusal is the endpoint's answer (a 400)
                    result = {"refused": str(e).split(" for session")[0]}
                total.append(time.perf_counter() - t0)
                await db.rollback()

    def med(xs):
        return round(sorted(xs)[len(xs) // 2], 3) if xs else None

    return {
        "endpoint_seconds_median": med(total),
        "anomalies_seconds_median": med(anomalies_t),
        "aggregate_seconds_median": med(aggregate_t),
        "endpoint_seconds_all": [round(t, 3) for t in total],
        "peak_rss_mb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024),
        "result_hash": hashlib.sha256(json.dumps(result, sort_keys=True).encode()).hexdigest(),
        "result": result,
    }


async def bench(dsn: str, runs: int) -> dict:
    os.environ["DATABASE_URL"] = dsn.replace("postgresql://", "postgresql+asyncpg://")
    from sqlalchemy import text

    from app.cubes.cube7_ranking import ranking_aggregation as agg
    from app.db.postgres import async_session_factory

    timings = []
    result = None
    for _ in range(runs):
        async with async_session_factory() as db:
            n = (await db.execute(text("select count(*) from user_rankings where session_id=:s"), {"s": SID})).scalar()
            t0 = time.perf_counter()
            rows = await agg.aggregate_rankings(db, SID, cycle_id=1, seed="sim-1m")
            timings.append(time.perf_counter() - t0)
            result = {
                "ballots": n,
                "order": [str(r.theme_id) for r in rows],
                "scores": [float(r.score) for r in rows],
                "vote_counts": [int(r.vote_count) for r in rows],
                "participant_count": rows[0].participant_count if rows else 0,
                "replay_hash": getattr(rows[0], "_replay_hash", None) if rows else None,
            }
            await db.rollback()  # measure only: the sim never keeps its aggregation
    result_hash = hashlib.sha256(json.dumps(result, sort_keys=True).encode()).hexdigest()
    timings.sort()
    return {
        "aggregate_seconds_median": round(timings[len(timings) // 2], 3),
        "aggregate_seconds_all": [round(t, 3) for t in timings],
        "peak_rss_mb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024),
        "result_hash": result_hash,
        "result": result,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("phase", choices=["seed", "bench"])
    ap.add_argument("--dsn", default=os.environ.get("SIM_DSN", DEFAULT_DSN))
    ap.add_argument("--n", type=int, default=1_000_000)
    ap.add_argument("--seed", type=int, default=2525)
    ap.add_argument("--category", type=int, default=0, choices=[0, 1, 2], help="Theme01 the session votes on")
    ap.add_argument("--shape", default="poll", choices=["poll", "uniform", "unanimous"])
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--endpoint", action="store_true",
                    help="bench: time run_ranking_pipeline (what POST /rankings/aggregate calls), not the tally alone")
    ap.add_argument("--out")
    a = ap.parse_args()
    refuse_unless_local(a.dsn)
    sys.path.insert(0, os.getcwd())  # run from backend/: the app package is the code under test
    if a.phase == "seed":
        job = seed(a.dsn, a.n, a.seed, a.category, a.shape)
    else:
        job = bench_endpoint(a.dsn, a.runs) if a.endpoint else bench(a.dsn, a.runs)
    out = asyncio.run(job)
    text = json.dumps(out, indent=2)
    print(text if a.phase == "seed" else json.dumps({k: v for k, v in out.items() if k != "result"}, indent=2))
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)


if __name__ == "__main__":
    main()
