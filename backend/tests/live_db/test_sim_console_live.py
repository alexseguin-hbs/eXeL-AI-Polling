"""HP-21 as a committed test: the Cube 10 Admin Console's LIVE sequence, end to end, on a real database.

The in-process form of backend/scripts/sim_console_live_check.py: simulation session → question → open → poll →
/sim/responses → /ai/run → /rank → /sim/ballots → aggregate. And the guard the seed endpoints rest on: a REAL
session refuses /sim/* with 403 — seeded responses and ballots exist only in a simulation.
"""
from __future__ import annotations

import asyncio
import random

A = "/api/v1/sessions"
N_RESPONSES = 60
N_BALLOTS = 20

RISK = ["privacy breaches worry me", "bias in automated decisions is a serious risk",
        "job losses could hurt families", "surveillance concerns are growing"]
SUPPORT = ["transparent audits would build trust", "AI can speed up permits", "open data helps everyone",
           "training programs for workers are great"]
NEUTRAL = ["we need more information first", "it depends on the budget",
           "other cities have tried different approaches", "time will tell"]


def _ok(resp, what):
    assert resp.status_code < 400, f"{what}: {resp.status_code} {resp.text[:300]}"
    return resp.json()


def _level(theme: dict) -> str:
    return str(theme.get("theme_level") or (theme.get("cluster_metadata") or {}).get("level"))


async def test_hp21_admin_console_live_sequence(live):
    client, who = live
    who.moderator()
    rng = random.Random(7)

    s = _ok(await client.post(A, json={
        "title": "HP-21 live run", "polling_mode_type": "live_interactive", "ai_provider": "openai",
        "session_type": "simulation", "theme2_voting_level": "theme2_9", "theme01_category": "risk"}), "create")
    sid = s["id"]
    assert s.get("session_type") == "simulation"
    q = _ok(await client.post(f"{A}/{sid}/questions",
                              json={"question_text": "What should our city prioritize for AI governance?"}), "question")
    _ok(await client.post(f"{A}/{sid}/open"), "open")
    _ok(await client.post(f"{A}/{sid}/poll"), "poll")

    pools = [RISK, SUPPORT, NEUTRAL]
    responses = [{"text": f"{rng.choice(rng.choice(pools))}. {rng.choice(rng.choice(pools))} and we should discuss it openly."}
                 for _ in range(N_RESPONSES)]
    out = _ok(await client.post(f"{A}/{sid}/sim/responses", json={"question_id": q["id"], "responses": responses}),
              "sim/responses")
    assert out["accepted"] == N_RESPONSES, out
    assert out["refused_count"] == 0, out
    await asyncio.sleep(3)

    run = _ok(await client.post(f"{A}/{sid}/ai/run", json={}), "ai/run")
    assert run.get("total_responses", N_RESPONSES) == N_RESPONSES, run
    rows = _ok(await client.get(f"{A}/{sid}/themes"), "themes")
    parents = [r for r in rows if r.get("parent_theme_id") is None]
    assert parents, "the AI run produced no parent themes"
    risk = next((p for p in parents if p["label"].lower().startswith("risk")), None)
    nine = [r["id"] for r in rows if _level(r) == "9" and r.get("label")
            and (not risk or r.get("parent_theme_id") == risk["id"])]
    assert nine, "no level-9 themes to put on the ballot"

    _ok(await client.post(f"{A}/{sid}/rank"), "rank")
    ballots = []
    for _ in range(N_BALLOTS):
        b = list(nine)
        rng.shuffle(b)
        ballots.append(b)
    out = _ok(await client.post(f"{A}/{sid}/sim/ballots", json={"ballots": ballots}), "sim/ballots")
    assert out["accepted"] == N_BALLOTS, out
    assert out["refused_count"] == 0, out

    agg = _ok(await client.post(f"{A}/{sid}/rankings/aggregate", json={}), "aggregate")
    assert agg, "aggregation returned nothing"
    ranked = _ok(await client.get(f"{A}/{sid}/rankings"), "rankings")
    assert ranked, "no ranking stored after aggregation"


async def test_real_session_refuses_sim_endpoints(live):
    client, who = live
    who.moderator()
    real = _ok(await client.post(A, json={"title": "real", "polling_mode_type": "live_interactive",
                                          "ai_provider": "openai"}), "create real")
    assert real.get("session_type") != "simulation"
    sid = real["id"]
    q = _ok(await client.post(f"{A}/{sid}/questions", json={"question_text": "A real question?"}), "question")

    r = await client.post(f"{A}/{sid}/sim/ballots", json={"ballots": [[q["id"]]]})
    assert r.status_code == 403, f"sim/ballots on a real session: {r.status_code} {r.text[:200]}"
    r = await client.post(f"{A}/{sid}/sim/responses",
                          json={"question_id": q["id"], "responses": [{"text": "a seeded answer that must be refused"}]})
    assert r.status_code == 403, f"sim/responses on a real session: {r.status_code} {r.text[:200]}"
