"""A re-opened round reads and writes ONE cycle, end to end, on a real database (AsM rounds 5–7).

Two full rounds of the real app: cycle 1 is themed, voted and aggregated; the moderator re-opens into cycle 2,
which is themed, voted and aggregated again. Then every read the reviewers named must speak about cycle 2 only:
the ballot (GET /themes), the ballot check (cycle-1 ids refused), the aggregate (GET /rankings), the governance
override write and its audit read, the Cube 9 analytics winner and ballot count, and the report ranking summary.
Skipped without Postgres, like every live-database proof — and CI fails if it skips.
"""
from __future__ import annotations

import asyncio

A = "/api/v1/sessions"
R1 = [
    "Clear AI approval steps would let teams ship models without waiting on ad-hoc sign-off.",
    "Training budgets are too small for people to learn the new tools properly.",
    "Customers ask how their data is used; a plain-language notice would build trust.",
]
R2 = [
    "Cycle two: the approval checklist works, now automate the evidence it asks for.",
    "Cycle two: workshops helped; pair new users with a mentor for the first month.",
    "Cycle two: the data notice landed well; add an opt-out page linked from every form.",
]
OK = (200, 201, 202)


def _level(theme: dict) -> str:
    return str(theme.get("theme_level") or (theme.get("cluster_metadata") or {}).get("level"))


async def test_reopened_round_reads_and_writes_one_cycle(live):
    client, who = live

    def ok(resp, want=OK, what=""):
        assert resp.status_code in want, f"{what}: {resp.status_code} {resp.text[:300]}"
        return resp

    who.moderator()
    s = ok(await client.post(A, json={"title": "Reopen", "cycle_mode": "multi", "max_cycles": 3}), what="create").json()
    sid, code = s["id"], s["short_code"]
    q = ok(await client.post(f"{A}/{sid}/questions", json={"question_text": "What should we do next?"}), what="question").json()
    ok(await client.post(f"{A}/{sid}/open"), what="open")
    pids = []
    for i in range(3):
        who.be(f"google-oauth2|r{i}", role="user")
        j = ok(await client.post(f"{A}/join/{code}", json={"display_name": f"P{i}"}), what=f"join {i}").json()
        pids.append(j.get("participant_id") or j.get("id"))

    async def run_cycle(texts):
        who.moderator()
        if (await client.get(f"{A}/{sid}")).json()["status"] == "open":
            ok(await client.post(f"{A}/{sid}/poll"), what="poll")
        for i, text in enumerate(texts):
            who.be(f"google-oauth2|r{i}", role="user")
            ok(await client.post(f"{A}/{sid}/responses", json={"question_id": q["id"], "participant_id": pids[i],
                                                               "raw_text": text}), what=f"respond {i}")
        who.moderator()
        ok(await client.post(f"{A}/{sid}/rank"), what="rank")
        await asyncio.sleep(6)  # Phase A summaries run in the background before theming reads them
        ok(await client.post(f"{A}/{sid}/ai/run"), what="ai run")
        themes = ok(await client.get(f"{A}/{sid}/themes"), what="themes").json()
        level = str((await client.get(f"{A}/{sid}")).json().get("theme2_voting_level") or "3").split("_")[-1]
        ballot = [t["id"] for t in themes if t.get("parent_theme_id") and t.get("label") and _level(t) == level]
        assert ballot, f"no level-{level} themes to rank"
        for i in range(3):
            who.be(f"google-oauth2|r{i}", role="user")
            ok(await client.post(f"{A}/{sid}/rankings", json={"ranked_theme_ids": ballot[i:] + ballot[:i]}),
               what=f"ballot {i}")
        who.moderator()
        ok(await client.post(f"{A}/{sid}/rankings/aggregate"), what="aggregate")
        return themes, ballot

    themes1, ballot1 = await run_cycle(R1)
    reopened = ok(await client.post(f"{A}/{sid}/reopen"), what="reopen").json()
    assert reopened["status"] == "polling" and reopened["current_cycle"] == 2, reopened

    # Re-opened but not themed yet: no ballot, and a ballot of cycle-1 ids is refused.
    assert ok(await client.get(f"{A}/{sid}/themes"), what="themes c2 before theming").json() == []
    themes2, ballot2 = await run_cycle(R2)
    ids1, ids2 = {t["id"] for t in themes1}, {t["id"] for t in themes2}
    assert ids1.isdisjoint(ids2), "cycle 2's ballot must not carry cycle 1's themes"
    assert len(themes2) == len(themes1), f"one cycle's themes, never both ({len(themes2)} vs {len(themes1)})"
    who.be("google-oauth2|r0", role="user")  # a cycle-2 voter re-voting with cycle-1 ids
    refused = await client.post(f"{A}/{sid}/rankings", json={"ranked_theme_ids": ballot1})
    assert refused.status_code in (400, 409, 422), f"a cycle-1 ballot in cycle 2 must be refused: {refused.status_code}"

    who.moderator()
    ranked = ok(await client.get(f"{A}/{sid}/rankings"), what="rankings").json()
    rows = ranked if isinstance(ranked, list) else ranked.get("rankings", [])
    assert rows and {r["theme_id"] for r in rows} <= set(ballot2), "GET /rankings reads the current cycle"

    # Governance override writes into the current cycle and its audit read sees it (Enlil, Thoth — round 7).
    target = rows[-1]["theme_id"]
    who.be("auth0|lead", role="admin")
    ok(await client.post(f"{A}/{sid}/override", json={"theme_id": target, "new_rank": 1,
                                                       "justification": "Cycle-two lead review moved this up."}),
       what="override")
    overrides = ok(await client.get(f"{A}/{sid}/overrides"), what="overrides").json()
    assert any(o["theme_id"] == target for o in overrides), "the cycle-2 override appears in the cycle-2 audit"

    # Cube 9 reads one cycle: the newest aggregated one (Thoth, round 6; Athena, round 7).
    who.moderator()
    analytics = ok(await client.get(f"{A}/{sid}/analytics"), what="analytics").json()
    stats = analytics.get("ranking") or {}
    assert stats.get("ranking_submissions") == 3, f"ballot count is cycle 2's three, not six: {stats}"
    assert stats.get("top_theme2_id") in set(ballot2), f"the winner is a cycle-2 theme: {stats}"
    summary = ok(await client.get(f"{A}/{sid}/ranking-summary"), what="ranking summary").json()
    got = {r.get("theme_id") for r in summary.get("rankings", [])}
    assert got and got <= set(ballot2), f"the report summary reads cycle 2 only: {got - set(ballot2)}"

    # Every ranking read that counts ballots counts cycle 2's three, never six (Thoth, round 8).
    metrics = ok(await client.get(f"{A}/{sid}/rankings/metrics"), what="metrics").json()
    assert metrics["system"].get("ranking_submissions") == 3, f"metrics count cycle 2 only: {metrics['system']}"
    ready = ok(await client.get(f"{A}/{sid}/rankings/readiness"), what="readiness").json()
    assert ready["signals"]["ranking_submissions"] == 3, f"readiness counts cycle 2 only: {ready['signals']}"
    assert ready["metrics"]["system"].get("ranking_submissions") == 3, f"readiness metrics: {ready['metrics']['system']}"
    scale = ok(await client.get(f"{A}/{sid}/rankings/scale-info"), what="scale-info").json()
    assert scale["voter_count"] == 3, f"scale-info counts cycle 2's voters only: {scale}"
