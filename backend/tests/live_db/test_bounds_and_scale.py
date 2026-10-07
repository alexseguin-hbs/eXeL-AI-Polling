"""Round 11 proofs on a real Postgres: bounded time tracking, idempotent CQS, and theming past asyncpg's limit.

Thor: one participant token could open unlimited time entries and mint N× the tokens. Thoth: scoring CQS twice
left two rows per answer and two winners (and the winner lookup raised). Odin + Pangu: phase B and CQS sent every
answer id as a bound parameter, and asyncpg refuses a statement with more than 32,767 — so theming a cycle of
more than ~3% of the 1M target raised before Theme01. Each is proven here against the real app and database.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

A = "/api/v1/sessions"
OK = (200, 201, 202)


def ok(resp, want=OK, what=""):
    assert resp.status_code in want, f"{what}: {resp.status_code} {resp.text[:300]}"
    return resp


async def _session(client, who, title):
    who.moderator()
    s = ok(await client.post(A, json={"title": title}), what="create").json()
    q = ok(await client.post(f"{A}/{s['id']}/questions", json={"question_text": "What matters most?"}),
           what="question").json()
    ok(await client.post(f"{A}/{s['id']}/open"), what="open")
    return s, q


async def test_public_time_tracking_is_bounded(live):
    client, who = live
    s, _ = await _session(client, who, "Time bounds")
    sid = s["id"]
    who.be("google-oauth2|t0", role="user")
    j = ok(await client.post(f"{A}/join/{s['short_code']}", json={"display_name": "T0"}), what="join").json()
    hdr = {"X-Participant-Token": j["participant_token"]}

    # Not live yet (open, not polling): no time is tracked.
    r = await client.post(f"{A}/{sid}/time/start", json={"action_type": "responding"}, headers=hdr)
    assert r.status_code == 409, f"time before polling must be refused: {r.status_code}"

    who.moderator()
    ok(await client.post(f"{A}/{sid}/poll"), what="poll")
    who.be("google-oauth2|t0", role="user")
    first = ok(await client.post(f"{A}/{sid}/time/start", json={"action_type": "responding"}, headers=hdr),
               what="start").json()
    # A second open entry is refused: N parallel entries can never mint N× the tokens.
    for _ in range(3):
        r = await client.post(f"{A}/{sid}/time/start", json={"action_type": "responding"}, headers=hdr)
        assert r.status_code == 409, f"a second open entry must be refused: {r.status_code}"
    ok(await client.post(f"{A}/{sid}/time/stop", json={"time_entry_id": first["id"]}, headers=hdr), what="stop")
    # Stopped, so the next start is allowed again.
    ok(await client.post(f"{A}/{sid}/time/start", json={"action_type": "responding"}, headers=hdr), what="restart")

    import app.db.postgres as pg
    from sqlalchemy import func, select

    from app.models.time_tracking import TimeEntry

    async with pg.async_session_factory() as db:
        n = (await db.execute(select(func.count()).select_from(TimeEntry).where(
            TimeEntry.session_id == uuid.UUID(sid), TimeEntry.action_type == "responding"))).scalar()
    # (Join adds its own closed, one-minute login entry; it is not a public start.)
    assert n == 2, f"exactly the two responding entries the rules allow, got {n}"


async def test_cqs_scoring_twice_is_idempotent(live):
    client, who = live
    s, q = await _session(client, who, "CQS twice")
    sid = s["id"]
    who.moderator()
    ok(await client.post(f"{A}/{sid}/poll"), what="poll")
    texts = ["We must cut the energy cost of the plant before winter.",
             "Cutting energy cost is the plant's biggest lever this year.",
             "Energy cost at the plant should fall before anything else."]
    for i, t in enumerate(texts):
        who.be(f"google-oauth2|c{i}", role="user")
        j = ok(await client.post(f"{A}/join/{s['short_code']}", json={"display_name": f"C{i}"}), what="join").json()
        ok(await client.post(f"{A}/{sid}/responses", json={"question_id": q["id"], "raw_text": t,
                                                         "participant_id": j.get("participant_id") or j.get("id")}),
           what=f"respond {i}")
    who.moderator()
    ok(await client.post(f"{A}/{sid}/rank"), what="rank")
    await asyncio.sleep(6)
    ok(await client.post(f"{A}/{sid}/ai/run"), what="ai run")

    import app.db.postgres as pg
    from sqlalchemy import func, select

    from app.models.cqs_score import CQSScore
    from app.models.response_summary import ResponseSummary

    async with pg.async_session_factory() as db:
        row = (await db.execute(
            select(ResponseSummary.theme2_3, func.count()).where(
                ResponseSummary.session_id == uuid.UUID(sid), ResponseSummary.theme2_3_confidence >= 95)
            .group_by(ResponseSummary.theme2_3).order_by(func.count().desc()).limit(1)
        )).first()
    label = row[0] if row else "None"
    for run in (1, 2):
        ok(await client.post(f"{A}/{sid}/ai/cqs", params={"top_theme2_label": label, "theme_level": "3"}),
           what=f"cqs run {run}")
    async with pg.async_session_factory() as db:
        rows = (await db.execute(select(func.count()).select_from(CQSScore).where(
            CQSScore.session_id == uuid.UUID(sid)))).scalar()
        winners = (await db.execute(select(func.count()).select_from(CQSScore).where(
            CQSScore.session_id == uuid.UUID(sid), CQSScore.is_winner.is_(True)))).scalar()
    eligible = row[1] if row else 0
    assert rows == eligible, f"one score per eligible answer after two runs: {rows} rows, {eligible} eligible"
    assert winners == (1 if eligible else 0), f"exactly one winner after two runs, got {winners}"


async def test_theming_reads_more_answers_than_asyncpg_can_bind(live):
    """40,000 answers in one cycle: phase B's summary fetch must not bind one parameter per answer."""
    client, who = live
    s, q = await _session(client, who, "Past the bind limit")
    sid = uuid.UUID(s["id"])

    import app.db.postgres as pg
    from sqlalchemy import insert

    from app.cubes.cube6_ai.phase_b import _fetch_summaries
    from app.models.response_meta import ResponseMeta
    from app.models.response_summary import ResponseSummary

    n = 40_000
    now = datetime.now(timezone.utc)
    metas = [{"id": uuid.uuid4(), "session_id": sid, "question_id": uuid.UUID(q["id"]), "cycle_id": 1,
              "source": "text", "char_count": 10, "submitted_at": now, "is_flagged": False} for _ in range(n)]
    async with pg.async_session_factory() as db:
        for i in range(0, n, 5000):
            await db.execute(insert(ResponseMeta), metas[i:i + 5000])
            await db.execute(insert(ResponseSummary), [
                {"id": uuid.uuid4(), "response_meta_id": m["id"], "session_id": sid, "summary_33": "Short answer."}
                for m in metas[i:i + 5000]])
        await db.commit()
        rows = await _fetch_summaries(db, sid)
    assert len(rows) == n, f"every answer reaches theming past the 32,767-parameter limit: {len(rows)} of {n}"
