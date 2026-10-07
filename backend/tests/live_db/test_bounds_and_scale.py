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
    second = ok(await client.post(f"{A}/{sid}/time/start", json={"action_type": "responding"}, headers=hdr),
                what="restart").json()
    # Two parallel stops of one entry mint once: the row is locked before anything is minted (round 12).
    stops = await asyncio.gather(*[client.post(f"{A}/{sid}/time/stop", json={"time_entry_id": second["id"]},
                                               headers=hdr) for _ in range(4)])
    assert sorted(r.status_code for r in stops) == [200, 409, 409, 409], [r.status_code for r in stops]
    # A burst of parallel starts opens exactly one entry: the database's partial unique index decides (round 12).
    starts = await asyncio.gather(*[client.post(f"{A}/{sid}/time/start", json={"action_type": "responding"},
                                                headers=hdr) for _ in range(6)])
    codes = sorted(r.status_code for r in starts)
    assert codes.count(201) == 1 and codes.count(409) == 5, codes

    import app.db.postgres as pg
    from sqlalchemy import func, select

    from app.models.time_tracking import TimeEntry

    async with pg.async_session_factory() as db:
        n = (await db.execute(select(func.count()).select_from(TimeEntry).where(
            TimeEntry.session_id == uuid.UUID(sid), TimeEntry.action_type == "responding"))).scalar()
    # (Join adds its own closed, one-minute login entry; it is not a public start.)
    assert n == 3, f"exactly the three responding entries the rules allow, got {n}"
    async with pg.async_session_factory() as db:
        from app.models.token_ledger import TokenLedger

        minted = (await db.execute(select(func.count()).select_from(TokenLedger).where(
            TokenLedger.reference_id == second["id"]))).scalar()
    # Seconds-long entries mint nothing (♡ = floor of accumulated minutes); never one row per parallel stop.
    assert minted == 0, f"a seconds-long entry stopped four times in parallel minted {minted} ledger rows"


async def _themed_session(client, who, title, anonymity):
    who.moderator()
    s = ok(await client.post(A, json={"title": title, "anonymity_mode": anonymity}), what="create").json()
    sid = s["id"]
    q = ok(await client.post(f"{A}/{sid}/questions", json={"question_text": "What matters most?"}), what="question").json()
    ok(await client.post(f"{A}/{sid}/open"), what="open")
    ok(await client.post(f"{A}/{sid}/poll"), what="poll")
    texts = ["We must cut the energy cost of the plant before winter.",
             "Cutting energy cost is the plant's biggest lever this year.",
             "Energy cost at the plant should fall before anything else."]
    for i, t in enumerate(texts):
        who.be(f"google-oauth2|{title[:4]}{i}", role="user")
        j = ok(await client.post(f"{A}/join/{s['short_code']}", json={"display_name": f"C{i}"}), what="join").json()
        ok(await client.post(f"{A}/{sid}/responses", json={"question_id": q["id"], "raw_text": t,
                                                         "participant_id": j.get("participant_id") or j.get("id")}),
           what=f"respond {i}")
    who.moderator()
    ok(await client.post(f"{A}/{sid}/rank"), what="rank")
    await asyncio.sleep(6)
    ok(await client.post(f"{A}/{sid}/ai/run"), what="ai run")
    return sid, len(texts)


async def _pin(sid, stored_label, confidence):
    """Make every answer of the session eligible (or not) for one Theme02 label: the offline provider scores
    confidence 85, below CQS's 95 gate, so without this a CQS test scores nothing (Thoth, Asar; round 12)."""
    import app.db.postgres as pg
    from sqlalchemy import select, update

    from app.models.response_summary import ResponseSummary
    from app.models.theme import Theme

    async with pg.async_session_factory() as db:
        child = (await db.execute(select(Theme).where(
            Theme.session_id == uuid.UUID(sid), Theme.parent_theme_id.isnot(None), Theme.label != "").limit(1))).scalar_one()
        child.label = stored_label
        await db.execute(update(ResponseSummary).where(ResponseSummary.session_id == uuid.UUID(sid)).values(
            theme2_3=stored_label, theme2_3_confidence=confidence))
        await db.commit()


async def _cqs_counts(sid):
    import app.db.postgres as pg
    from sqlalchemy import func, select

    from app.models.cqs_score import CQSScore

    async with pg.async_session_factory() as db:
        rows = (await db.execute(select(func.count()).select_from(CQSScore).where(
            CQSScore.session_id == uuid.UUID(sid)))).scalar()
        winners = (await db.execute(select(func.count()).select_from(CQSScore).where(
            CQSScore.session_id == uuid.UUID(sid), CQSScore.is_winner.is_(True)))).scalar()
    return rows, winners


async def test_cqs_scoring_twice_is_idempotent(live):
    """Two runs, anonymous (the default) and identified, each on a label with '&': one score per eligible answer,
    exactly one winner — and a later run with nothing eligible clears the old scores and winner."""
    import html

    client, who = live
    for anonymity in ("anonymous", "identified"):
        sid, n = await _themed_session(client, who, f"CQS {anonymity}", anonymity)
        await _pin(sid, html.escape("Privacy & Trust"), 99)  # phase B stores labels html-escaped
        who.moderator()
        for run in (1, 2):
            ok(await client.post(f"{A}/{sid}/ai/cqs", params={"top_theme2_label": "Privacy & Trust", "theme_level": "3"}),
               what=f"cqs {anonymity} run {run}")
        rows, winners = await _cqs_counts(sid)
        assert (rows, winners) == (n, 1), f"{anonymity}: {rows} scores, {winners} winners after two runs (want {n}, 1)"
        r = await client.post(f"{A}/{sid}/ai/cqs", params={"top_theme2_label": "Not A Theme Here", "theme_level": "3"})
        assert r.status_code == 400, f"a label that is not this session's theme is refused: {r.status_code}"
        await _pin(sid, html.escape("Privacy & Trust"), 50)  # nothing eligible any more
        ok(await client.post(f"{A}/{sid}/ai/cqs", params={"top_theme2_label": "Privacy & Trust", "theme_level": "3"}),
           what=f"cqs {anonymity} none eligible")
        assert await _cqs_counts(sid) == (0, 0), f"{anonymity}: a run with nothing eligible leaves no old winner"


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


async def test_theme_assignments_are_written_as_sets(live):
    """40,000 answers' theme assignments are written in multi-row upserts (Pangu, round 12): one statement per answer
    was ~12 minutes at 1M inside the theming transaction. Proven: every answer gets its assignment, inside a bound."""
    import time

    client, who = live
    s, q = await _session(client, who, "Write as sets")
    sid = uuid.UUID(s["id"])

    import app.db.postgres as pg
    from sqlalchemy import func, insert, select

    from app.cubes.cube6_ai.phase_b import _store_results
    from app.models.response_meta import ResponseMeta
    from app.models.response_summary import ResponseSummary
    from app.models.session import Session
    from app.models.theme import Theme

    n = 40_000
    now = datetime.now(timezone.utc)
    ids = [uuid.uuid4() for _ in range(n)]
    cats = ["Risk & Concerns", "Supporting Comments", "Neutral Comments"]
    responses = [{"id": str(i), "theme01": cats[k % 3], "theme01_confidence": 80,
                  "theme2_9": f"T{k % 9}", "theme2_9_confidence": 80, "theme2_6": f"T{k % 6}", "theme2_6_confidence": 80,
                  "theme2_3": f"T{k % 3}", "theme2_3_confidence": 80} for k, i in enumerate(ids)]
    reduced = {c: {lvl: [{"label": f"T{j}", "confidence": 0.8, "description": ""} for j in range(int(lvl))]
                   for lvl in ("9", "6", "3")} for c in cats}
    async with pg.async_session_factory() as db:
        for i in range(0, n, 5000):
            await db.execute(insert(ResponseMeta), [
                {"id": m, "session_id": sid, "question_id": uuid.UUID(q["id"]), "cycle_id": 1, "source": "text",
                 "char_count": 10, "submitted_at": now, "is_flagged": False} for m in ids[i:i + 5000]])
        await db.commit()
        session = (await db.execute(select(Session).where(Session.id == sid))).scalar_one()
        t0 = time.monotonic()
        await _store_results(db, session, responses, {}, reduced)
        took = time.monotonic() - t0
        written = (await db.execute(select(func.count()).select_from(ResponseSummary).where(
            ResponseSummary.session_id == sid, ResponseSummary.theme2_3.isnot(None)))).scalar()
        t0_count = (await db.execute(select(Theme.response_count).where(
            Theme.session_id == sid, Theme.label == "T0", Theme.parent_theme_id.isnot(None)).limit(1))).scalar()
    assert written == n, f"every answer gets its theme assignment: {written} of {n}"
    assert t0_count and t0_count > 0, "child theme counts come from the one-pass Counter"
    assert took < 60, f"40,000 assignments took {took:.1f} s (one statement per answer was ~30 s here)"
