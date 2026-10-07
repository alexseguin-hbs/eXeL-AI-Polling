"""The 38-step moderator + participant journey, in order, against a real database.

The committed form of the round-1 journey: create → question → open → QR → six joins → poll → six responses (and
a time-tracking start) → list → presence → rank → AI themes → a theme RE-RUN that must REPLACE the first set (not
add to it) → six ranked ballots → a re-run after votes that must be REFUSED with 409 → aggregate → rankings → CSV
→ close → destroy. Every step names its expected status; the test fails at the first step that answers otherwise.
"""
from __future__ import annotations

import asyncio

A = "/api/v1/sessions"
TEXTS = [
    "We need clearer AI governance so every team knows who approves models before release.",
    "Budget for training is too low; people cannot use the new tools without hands-on workshops.",
    "Risk reviews take weeks; a lightweight checklist would let small pilots move faster safely.",
    "Customers want transparency about how their data trains our systems and how to opt out.",
    "Leadership should publish a one-page AI strategy so priorities stop changing every quarter.",
    "Support teams are overloaded; automate the repetitive tickets first and measure the time saved.",
]
OK = (200, 201, 202)


def _level(theme: dict) -> str:
    return str(theme.get("theme_level") or (theme.get("cluster_metadata") or {}).get("level"))


async def test_38_step_journey(live):
    client, who = live
    steps: list[tuple[str, int]] = []

    def step(name, resp, want=OK):
        steps.append((name, resp.status_code))
        assert resp.status_code in want, f"step {len(steps)} '{name}': {resp.status_code} (want {want}) {resp.text[:300]}"
        return resp

    def participant(i):
        who.be(f"google-oauth2|user{i}", role="user")

    who.moderator()
    s = step("create session", await client.post(A, json={"title": "Journey", "description": "e2e"})).json()
    sid, code = s["id"], s["short_code"]
    q = step("add question", await client.post(f"{A}/{sid}/questions",
                                               json={"question_text": "What should we prioritise for AI?"})).json()
    step("open", await client.post(f"{A}/{sid}/open"))
    step("qr", await client.get(f"{A}/{sid}/qr-json"))

    pids = []
    for i in range(len(TEXTS)):
        participant(i)
        j = step(f"join #{i}", await client.post(f"{A}/join/{code}", json={"display_name": f"P{i}"})).json()
        pids.append(j.get("participant_id") or j.get("id"))

    who.moderator()
    step("start polling", await client.post(f"{A}/{sid}/poll"))
    for i, text in enumerate(TEXTS):
        participant(i)
        step(f"submit #{i}", await client.post(f"{A}/{sid}/responses",
                                               json={"question_id": q["id"], "participant_id": pids[i], "raw_text": text}))
        if i == 0:
            step("time start", await client.post(f"{A}/{sid}/time/start", json={"action_type": "responding"}))

    who.moderator()
    listed = step("list responses", await client.get(f"{A}/{sid}/responses")).json()
    step("presence", await client.get(f"{A}/{sid}/presence"))
    step("rank transition", await client.post(f"{A}/{sid}/rank"))
    await asyncio.sleep(6)  # per-response summaries run in the background before theming reads them

    step("ai run", await client.post(f"{A}/{sid}/ai/run"))
    first = step("themes", await client.get(f"{A}/{sid}/themes")).json()
    assert first, "the AI run produced no themes"
    step("ai re-run replaces", await client.post(f"{A}/{sid}/ai/run"))
    themes = step("themes after re-run", await client.get(f"{A}/{sid}/themes")).json()
    steps.append(("re-run keeps one set", len(themes)))
    assert len(themes) == len(first), f"a re-run must REPLACE the themes: {len(first)} became {len(themes)}"
    assert {t["id"] for t in themes}.isdisjoint({t["id"] for t in first}), "the re-run left the first set in place"

    session = (await client.get(f"{A}/{sid}")).json()
    level = str(session.get("theme2_voting_level") or "3").split("_")[-1]
    ballot = [t["id"] for t in themes if t.get("parent_theme_id") and t.get("label") and _level(t) == level]
    assert ballot, f"no level-{level} themes to rank"
    for i in range(len(TEXTS)):
        participant(i)
        rotated = ballot[i % len(ballot):] + ballot[:i % len(ballot)]
        step(f"rank #{i}", await client.post(f"{A}/{sid}/rankings",
                                             json={"ranked_theme_ids": rotated if i % 2 == 0 else rotated[::-1]}))

    who.moderator()
    step("ai re-run after votes refused", await client.post(f"{A}/{sid}/ai/run"), want=(409,))
    step("aggregate", await client.post(f"{A}/{sid}/rankings/aggregate"))
    ranked = step("rankings", await client.get(f"{A}/{sid}/rankings")).json()
    assert ranked, "aggregation returned no ranking"
    csv = step("export csv", await client.get(f"{A}/{sid}/export/csv")).text
    assert csv.count("\n") >= len(TEXTS), "the CSV does not carry every response"
    step("close", await client.post(f"{A}/{sid}/close"))
    step("destroy data", await client.post(f"{A}/{sid}/destroy-data"))

    items = listed if isinstance(listed, list) else listed.get("items") or listed.get("responses") or []
    assert len(items) >= len(TEXTS), f"listed {len(items)} responses, submitted {len(TEXTS)}"
    assert len(steps) == 38, f"the journey ran {len(steps)} steps, not 38: {[n for n, _ in steps]}"
