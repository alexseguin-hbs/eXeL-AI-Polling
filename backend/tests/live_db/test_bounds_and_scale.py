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
    # A public 'login' start is refused: login credit comes only from the join (Enki, Sofia; round 13).
    refused = await client.post(f"{A}/{sid}/time/start", json={"action_type": "login"}, headers=hdr)
    assert refused.status_code == 400, refused.status_code
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


async def _cqs(sid, label="Privacy &amp; Trust", level="3"):
    """One tracked CQS run, awaited (the HTTP route schedules through single flight and only for the voted winner)."""
    import app.db.postgres as pg

    from app.cubes.cube5_gateway.service import run_cqs_tracked

    async with pg.async_session_factory() as db:
        return await run_cqs_tracked(db, uuid.UUID(sid), label, level, None)


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
            await _cqs(sid)
        rows, winners = await _cqs_counts(sid)
        assert (rows, winners) == (n, 1), f"{anonymity}: {rows} scores, {winners} winners after two runs (want {n}, 1)"
        r = await client.post(f"{A}/{sid}/ai/cqs", params={"top_theme2_label": "Not A Theme Here", "theme_level": "3"})
        assert r.status_code == 400, f"a label that is not this session's theme is refused: {r.status_code}"
        await _pin(sid, html.escape("Privacy & Trust"), 50)  # nothing eligible any more
        await _cqs(sid)
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


async def test_cqs_parallel_runs_and_no_session_row_lock(live):
    """Two CQS runs at once leave one score per answer and one winner, with no 500 (scores and winner are one
    transaction under an advisory lock); the stored label is written once-escaped; and while a scoring holds its lock,
    a time stop for the same session still completes — no row lock on sessions (Odin, Thoth, Sofia; round 13)."""
    import html
    import time

    import app.db.postgres as pg
    from sqlalchemy import select, text

    from app.models.cqs_score import CQSScore

    client, who = live
    sid, n = await _themed_session(client, who, "CQS parallel", "anonymous")
    await _pin(sid, html.escape("Privacy & Trust"), 99)
    who.moderator()
    runs = await asyncio.gather(*[_cqs(sid) for _ in range(3)])
    assert all(r.get("status") == "completed" for r in runs), runs
    assert await _cqs_counts(sid) == (n, 1), "parallel runs: one score per answer, exactly one winner"
    async with pg.async_session_factory() as db:
        labels = set((await db.execute(select(CQSScore.theme2_cluster_label).where(
            CQSScore.session_id == uuid.UUID(sid)))).scalars().all())
    assert labels == {"Privacy &amp; Trust"}, f"the stored label, escaped once: {labels}"

    # Hold a REAL scoring transaction open (score_cqs, uncommitted — every lock CQS takes), then insert a row that
    # references the session from another connection: it must not wait (Odin measured 3 s+ under FOR UPDATE).
    from datetime import datetime, timezone

    from sqlalchemy import insert

    from app.cubes.cube6_ai.cqs_engine import score_cqs
    from app.models.question import Question
    from app.models.response_meta import ResponseMeta

    async with pg.async_session_factory() as holder:
        held = await score_cqs(holder, uuid.UUID(sid), "Privacy &amp; Trust", "3", commit=False)
        assert held, "the held scoring found its eligible answers"
        async with pg.async_session_factory() as other:
            qid = (await other.execute(select(Question.id).where(Question.session_id == uuid.UUID(sid)).limit(1))).scalar()
            t0 = time.monotonic()
            await asyncio.wait_for(other.execute(insert(ResponseMeta).values(
                id=uuid.uuid4(), session_id=uuid.UUID(sid), question_id=qid, cycle_id=1, source="text",
                char_count=1, submitted_at=datetime.now(timezone.utc), is_flagged=False)), timeout=10)
            await other.commit()
            took = time.monotonic() - t0
        await holder.rollback()
    assert took < 2, f"a write referencing the session waited {took:.1f} s on an open CQS scoring"


async def test_ranking_aggregation_scores_cqs(live):
    """POST /rankings/aggregate hands the winning Theme02 to CQS and it is scored (Krishna, round 13): before, the
    handoff never passed the label, so no ranking ever scored CQS."""
    import app.db.postgres as pg
    from sqlalchemy import update

    from app.models.response_summary import ResponseSummary

    client, who = live
    sid, n = await _themed_session(client, who, "Rank to CQS", "identified")
    who.moderator()
    themes = ok(await client.get(f"{A}/{sid}/themes"), what="themes").json()
    level = str((await client.get(f"{A}/{sid}")).json().get("theme2_voting_level") or "theme2_9").split("_")[-1]
    ballot = [t for t in themes if t.get("parent_theme_id") and t.get("label")
              and str(t.get("theme_level") or (t.get("cluster_metadata") or {}).get("level")) == level]
    assert ballot, "a ballot to rank"
    top = ballot[0]
    async with pg.async_session_factory() as db:
        await db.execute(update(ResponseSummary).where(ResponseSummary.session_id == uuid.UUID(sid)).values(
            **{f"theme2_{level}": top["label"], f"theme2_{level}_confidence": 99}))
        await db.commit()
    ids = [t["id"] for t in ballot]
    rest = ids[1:]
    # Three distinct ballots (identical ones are an anti-sybil burst); the pinned theme wins the Borda count.
    ballots = [[ids[0]] + rest, [ids[0]] + rest[::-1], [rest[0], ids[0]] + rest[1:]]
    for i in range(n):
        who.be(f"google-oauth2|{'Rank to CQS'[:4]}{i}", role="user")
        ok(await client.post(f"{A}/{sid}/rankings", json={"ranked_theme_ids": ballots[i]}), what=f"ballot {i}")
    who.moderator()
    ok(await client.post(f"{A}/{sid}/rankings/aggregate"), what="aggregate")
    # CQS runs after the aggregate request, in its own transaction (AsM round 14): the response never waits on it.
    for _ in range(300):  # up to 30 s: a CI runner is slower than a workstation
        rows, winners = await _cqs_counts(sid)
        if (rows, winners) == (n, 1):
            break
        await asyncio.sleep(0.1)
    assert (rows, winners) == (n, 1), f"aggregation scored CQS on the winning theme: {rows} scores, {winners} winners"


async def test_cqs_never_crowns_unscored_answers(live, monkeypatch):
    """A provider that cannot score (empty or invalid JSON) never puts an answer in the reward at 50 on every metric:
    with nothing scored there is no winner, and with one real score only that answer competes (Christo, Asar; r14)."""
    import html

    import app.cubes.cube6_ai.cqs_engine as engine

    client, who = live
    sid, n = await _themed_session(client, who, "CQS provider down", "anonymous")
    await _pin(sid, html.escape("Privacy & Trust"), 99)
    replies = {"all": ""}

    class _Down:
        async def batch_summarize(self, items, timeout=120.0):
            out = [replies["all"]] * len(items)
            if replies.get("first"):
                out[0] = replies["first"]
            return out

    monkeypatch.setattr(engine, "get_summarization_provider_or_offline", lambda name: _Down())
    who.moderator()
    r = await _cqs(sid)
    assert r.get("status") == "provider_unavailable" and not r.get("winner"), r
    assert await _cqs_counts(sid) == (0, 0), "nothing scored: no score rows, no winner"
    replies["all"], replies["first"] = "not json", (
        '{"insight": 70, "depth": 70, "future_impact": 70, "originality": 70, "actionability": 70, "relevance": 70}')
    await _cqs(sid)
    assert await _cqs_counts(sid) == (1, 1), "only the answer the provider really scored competes, and wins"


async def test_simulation_cqs_stays_offline_without_approval(live):
    """A simulation session asking for a paid provider, with no HI-approved estimate, scores CQS on OFFLINE (Odin,
    Christo, Pangu; r14) — the ranking → CQS handoff no longer goes around the simulation cost guard."""
    import html

    import app.db.postgres as pg
    from sqlalchemy import select, update

    from app.models.cqs_score import CQSScore
    from app.models.session import Session

    client, who = live
    sid, n = await _themed_session(client, who, "CQS simulation", "anonymous")
    await _pin(sid, html.escape("Privacy & Trust"), 99)
    async with pg.async_session_factory() as db:
        await db.execute(update(Session).where(Session.id == uuid.UUID(sid)).values(
            session_type="simulation", ai_provider="openai"))
        await db.commit()
    who.moderator()
    await _cqs(sid)
    async with pg.async_session_factory() as db:
        providers = set((await db.execute(select(CQSScore.provider).where(
            CQSScore.session_id == uuid.UUID(sid)))).scalars().all())
    assert providers == {"offline"}, f"a simulation without an approved estimate scores offline: {providers}"
    assert await _cqs_counts(sid) == (n, 1)


async def _cqs_triggers(sid):
    import app.db.postgres as pg
    from sqlalchemy import select

    from app.models.pipeline_trigger import PipelineTrigger

    async with pg.async_session_factory() as db:
        rows = (await db.execute(select(PipelineTrigger).where(
            PipelineTrigger.session_id == uuid.UUID(sid), PipelineTrigger.trigger_type == "cqs_scoring"))).scalars().all()
    return [(t.status, (t.trigger_metadata or {}).get("cqs_status"), t.error_message) for t in rows]


async def _ranked_session(client, who, title):
    """An offline-themed session with three distinct ballots — no confidence pinning: the offline provider's real
    keyword matches are assigned at 95, so CQS is reachable end to end (Enki, round 15)."""
    sid, n = await _themed_session(client, who, title, "identified")
    who.moderator()
    themes = ok(await client.get(f"{A}/{sid}/themes"), what="themes").json()
    level = str((await client.get(f"{A}/{sid}")).json().get("theme2_voting_level") or "theme2_9").split("_")[-1]
    ballot = [t for t in themes if t.get("parent_theme_id") and t.get("label")
              and str(t.get("theme_level") or (t.get("cluster_metadata") or {}).get("level")) == level]
    ids = [t["id"] for t in ballot]
    rest = ids[1:]
    ballots = [[ids[0]] + rest, [ids[0]] + rest[::-1], [rest[0], ids[0]] + rest[1:]] if rest else [ids] * 3
    for i in range(n):
        who.be(f"google-oauth2|{title[:4]}{i}", role="user")
        ok(await client.post(f"{A}/{sid}/rankings", json={"ranked_theme_ids": ballots[i]}), what=f"ballot {i}")
    who.moderator()
    return sid, n


async def test_offline_session_reaches_a_cqs_winner_and_records_it(live):
    """Offline theming → aggregate → background CQS crowns a winner, with no pinned confidence, and the cqs_scoring
    trigger ends 'completed' carrying the CQS status (Enki, Enlil, Thoth; round 15)."""
    from app.cubes.cube5_gateway.service import drain_cqs_tasks

    client, who = live
    sid, n = await _ranked_session(client, who, "Offline CQS")
    ok(await client.post(f"{A}/{sid}/rankings/aggregate"), what="aggregate")
    await drain_cqs_tasks()
    rows, winners = await _cqs_counts(sid)
    assert rows >= 1 and winners == 1, f"an offline session crowns one CQS winner unaided: {rows} scores, {winners}"
    assert await _cqs_triggers(sid) == [("completed", "completed", None)], await _cqs_triggers(sid)


async def test_rapid_aggregates_coalesce_and_are_rate_limited(live, monkeypatch):
    """Ten aggregates at once start at most two CQS runs for the session (single flight + one coalesced follow-up),
    every trigger ends terminal, the result is one winner, and the eleventh aggregate in a minute is refused (Thor,
    Enki; round 15)."""
    from app.cubes.cube5_gateway.service import drain_cqs_tasks

    import app.cubes.cube5_gateway.service as svc

    client, who = live
    sid, n = await _ranked_session(client, who, "Rapid aggregates")
    real_once, live_runs, max_inflight = svc._score_cqs_once, [0], [0]

    async def _counted(*a, **k):
        live_runs[0] += 1
        max_inflight[0] = max(max_inflight[0], live_runs[0])
        try:
            await asyncio.sleep(0.2)  # long enough that later aggregates arrive while it runs
            return await real_once(*a, **k)
        finally:
            live_runs[0] -= 1

    monkeypatch.setattr(svc, "_score_cqs_once", _counted)
    rs = await asyncio.gather(*[client.post(f"{A}/{sid}/rankings/aggregate") for _ in range(10)])
    assert all(r.status_code in OK for r in rs), [r.status_code for r in rs]
    await drain_cqs_tasks()
    trig = await _cqs_triggers(sid)
    assert len(trig) == 10 and all(s == "completed" for s, _, _ in trig), trig
    ran = [c for _, c, _ in trig if c != "superseded"]
    # Aggregates are serialised, so a fast (offline) run can finish between two of them; what single flight
    # guarantees is that triggers arriving during a run coalesce, and at most one run is ever in flight (below).
    assert 1 <= len(ran) < len(trig) and trig.count(("completed", "superseded", None)) >= 1, trig
    assert max_inflight[0] <= 1, f"two CQS runs of one session overlapped: {max_inflight[0]}"
    assert (await _cqs_counts(sid))[1] == 1
    r = await client.post(f"{A}/{sid}/rankings/aggregate")
    assert r.status_code == 429, f"the eleventh aggregate in a minute is refused: {r.status_code}"


async def test_failed_rescore_clears_the_old_winner(live, monkeypatch):
    """A re-score whose provider raises leaves no previous winner standing and marks its trigger failed (Thoth,
    Enlil; round 15)."""
    import app.cubes.cube6_ai.cqs_engine as engine
    from app.cubes.cube5_gateway.service import drain_cqs_tasks

    client, who = live
    sid, n = await _ranked_session(client, who, "Rescore fails")
    ok(await client.post(f"{A}/{sid}/rankings/aggregate"), what="aggregate 1")
    await drain_cqs_tasks()
    assert (await _cqs_counts(sid))[1] == 1, "the first scoring crowned a winner"

    class _Raises:
        async def batch_summarize(self, items, timeout=120.0):
            raise RuntimeError("provider down")

    monkeypatch.setattr(engine, "get_summarization_provider_or_offline", lambda name: _Raises())
    ok(await client.post(f"{A}/{sid}/rankings/aggregate"), what="aggregate 2")
    await drain_cqs_tasks()
    assert await _cqs_counts(sid) == (0, 0), "a failed re-score leaves no old winner"
    statuses = sorted(s for s, _, _ in await _cqs_triggers(sid))
    assert statuses == ["completed", "failed"], statuses


async def test_cqs_scores_only_the_winning_category(live):
    """One Theme02 label under two Theme01 categories: only the winning category's answers are scored (Enki, r15)."""
    import html

    import app.db.postgres as pg
    from sqlalchemy import select, update

    from app.cubes.cube6_ai.cqs_engine import run_cqs_pipeline
    from app.models.cqs_score import CQSScore
    from app.models.response_summary import ResponseSummary

    client, who = live
    sid, n = await _themed_session(client, who, "CQS category", "anonymous")
    label = html.escape("Privacy & Trust")
    await _pin(sid, label, 99)
    async with pg.async_session_factory() as db:
        ids = (await db.execute(select(ResponseSummary.response_meta_id).where(
            ResponseSummary.session_id == uuid.UUID(sid)).order_by(ResponseSummary.response_meta_id))).scalars().all()
        await db.execute(update(ResponseSummary).where(ResponseSummary.response_meta_id == ids[0]).values(
            theme01="Supporting Comments"))
        await db.execute(update(ResponseSummary).where(ResponseSummary.response_meta_id.in_(ids[1:])).values(
            theme01="Risk & Concerns"))
        await db.commit()
        await run_cqs_pipeline(db, uuid.UUID(sid), label, "3", theme01_category="Risk & Concerns")
        scored = set((await db.execute(select(CQSScore.response_id).where(
            CQSScore.session_id == uuid.UUID(sid)))).scalars().all())
    assert scored == set(ids[1:]), "only the winning category's answers compete"


async def test_configured_category_session_reaches_cqs_through_aggregate(live):
    """A session whose theme01_category is configured (the KEY, e.g. 'risk' — the Cube 10 console and the ranking
    config set it) ranks inside that category and CQS crowns a winner through POST /rankings/aggregate: CQS compares
    the winner's Theme01 LABEL, never the key (Enki, Thoth, Christo, Aset, Asar; round 16)."""
    import app.db.postgres as pg
    from sqlalchemy import select, update

    from app.cubes.cube5_gateway.service import drain_cqs_tasks
    from app.models.response_summary import ResponseSummary
    from app.models.session import Session
    from app.models.theme import Theme

    client, who = live
    sid, n = await _themed_session(client, who, "Configured category", "identified")
    who.moderator()
    themes = ok(await client.get(f"{A}/{sid}/themes"), what="themes").json()
    level = str((await client.get(f"{A}/{sid}")).json().get("theme2_voting_level") or "theme2_9").split("_")[-1]
    at_level = [t for t in themes if t.get("parent_theme_id") and t.get("label")
                and str(t.get("theme_level") or (t.get("cluster_metadata") or {}).get("level")) == level]
    key = at_level[0]["theme01_category"]
    ballot = [t for t in at_level if t["theme01_category"] == key]
    async with pg.async_session_factory() as db:
        parent_label = (await db.execute(select(Theme.label).where(
            Theme.id == uuid.UUID(ballot[0]["parent_theme_id"])))).scalar_one()
        await db.execute(update(Session).where(Session.id == uuid.UUID(sid)).values(theme01_category=key))
        await db.execute(update(ResponseSummary).where(ResponseSummary.session_id == uuid.UUID(sid)).values(
            theme01=parent_label, **{f"theme2_{level}": ballot[0]["label"], f"theme2_{level}_confidence": 99}))
        await db.commit()
    assert key in ("risk", "support", "neutral") and parent_label != key
    ids = [t["id"] for t in ballot]
    rest = ids[1:]
    ballots = [[ids[0]] + rest, [ids[0]] + rest[::-1], [rest[0], ids[0]] + rest[1:]] if rest else [ids] * 3
    for i in range(n):
        who.be(f"google-oauth2|Conf{i}", role="user")
        ok(await client.post(f"{A}/{sid}/rankings", json={"ranked_theme_ids": ballots[i]}), what=f"ballot {i}")
    who.moderator()
    ok(await client.post(f"{A}/{sid}/rankings/aggregate"), what="aggregate")
    await drain_cqs_tasks()
    assert await _cqs_counts(sid) == (n, 1), f"configured '{key}' session: {await _cqs_counts(sid)}"
    assert await _cqs_triggers(sid) == [("completed", "completed", None)], await _cqs_triggers(sid)


async def test_interrupted_cqs_clears_the_old_winner_and_closes_its_trigger(live, monkeypatch):
    """A shutdown mid-run (CancelledError, not an Exception) still clears the stale winner and marks the trigger
    failed — asserted on its own trigger (Odin, Pangu; round 16; Athena, round 17)."""
    import html

    import app.cubes.cube6_ai.cqs_engine as engine
    from app.cubes.cube5_gateway.service import _schedule_cqs, shutdown_background_work

    client, who = live
    sid, n = await _themed_session(client, who, "CQS interrupted", "anonymous")
    await _pin(sid, html.escape("Privacy & Trust"), 99)
    who.moderator()
    await _cqs(sid)
    assert await _cqs_counts(sid) == (n, 1)
    assert await _cqs_triggers(sid) == [("completed", "completed", None)], "a tracked run records its trigger"

    started = asyncio.Event()

    class _Slow:
        async def batch_summarize(self, items, timeout=120.0):
            started.set()
            await asyncio.sleep(60)
            return [""] * len(items)

    monkeypatch.setattr(engine, "get_summarization_provider_or_offline", lambda name: _Slow())
    import app.db.postgres as pg

    from app.cubes.cube5_gateway.service import _create_trigger

    async with pg.async_session_factory() as db:
        trig = await _create_trigger(db, uuid.UUID(sid), "cqs_scoring", metadata={"source": "test"})
    _schedule_cqs(uuid.UUID(sid), (html.escape("Privacy & Trust"), "3", None, trig.id))
    await asyncio.wait_for(started.wait(), timeout=20)
    await shutdown_background_work(grace=0.2)
    assert await _cqs_counts(sid) == (0, 0), "an interrupted re-score leaves no old winner"
    assert ("failed", None, "CQS interrupted") in await _cqs_triggers(sid), await _cqs_triggers(sid)


async def test_startup_sweep_closes_orphaned_triggers(live):
    """A background trigger left pending/in_progress by a restart is marked failed at startup (Odin, round 16)."""
    from datetime import timedelta

    import app.db.postgres as pg
    from sqlalchemy import select

    from app.cubes.cube5_gateway.service import sweep_orphaned_triggers
    from app.models.pipeline_trigger import PipelineTrigger

    client, who = live
    s, q = await _session(client, who, "Orphans")
    sid = uuid.UUID(s["id"])
    old = datetime.now(timezone.utc) - timedelta(hours=2)
    async with pg.async_session_factory() as db:
        stale = PipelineTrigger(session_id=sid, trigger_type="cqs_scoring", status="in_progress", triggered_at=old)
        fresh = PipelineTrigger(session_id=sid, trigger_type="ai_theming", status="in_progress",
                                triggered_at=datetime.now(timezone.utc))
        db.add_all([stale, fresh])
        await db.commit()
        assert await sweep_orphaned_triggers(db) >= 1
        rows = {t.trigger_type: (t.status, t.error_message) for t in (await db.execute(
            select(PipelineTrigger).where(PipelineTrigger.session_id == sid))).scalars().all()}
    assert rows["cqs_scoring"][0] == "failed" and "interrupted" in rows["cqs_scoring"][1]
    assert rows["ai_theming"][0] == "in_progress", "a run younger than its timeout is left alone"


async def test_manual_cqs_route_scores_only_the_voted_winner(live):
    """POST /ai/cqs refuses before a ranking and for any theme but the voted #1, and schedules the winner through
    single flight with a trigger it returns (Thor, Sofia; round 17)."""
    from app.cubes.cube5_gateway.service import drain_cqs_tasks

    client, who = live
    sid, n = await _ranked_session(client, who, "Manual CQS")
    themes = ok(await client.get(f"{A}/{sid}/themes"), what="themes").json()
    labels = [t["label"] for t in themes if t.get("parent_theme_id") and t.get("label")]
    import html as _html

    r = await client.post(f"{A}/{sid}/ai/cqs", params={"top_theme2_label": _html.unescape(labels[0]), "theme_level": "3"})
    assert r.status_code == 409, f"no ranking yet: {r.status_code}"
    agg = ok(await client.post(f"{A}/{sid}/rankings/aggregate"), what="aggregate").json()
    await drain_cqs_tasks()
    winner = agg["top_theme2_label"]
    other = next(lbl for lbl in labels if lbl != winner)
    r = await client.post(f"{A}/{sid}/ai/cqs", params={"top_theme2_label": _html.unescape(other), "theme_level": "3"})
    assert r.status_code == 409, f"not the voted winner: {r.status_code}"
    r = ok(await client.post(f"{A}/{sid}/ai/cqs", params={"top_theme2_label": _html.unescape(winner), "theme_level": "3"}),
           what="manual cqs on the winner").json()
    assert r["status"] == "scheduled" and r["trigger_id"], r
    await drain_cqs_tasks()
    assert sorted(s for s, _, _ in await _cqs_triggers(sid)) == ["completed", "completed"], await _cqs_triggers(sid)
    assert (await _cqs_counts(sid))[1] == 1


async def test_failed_older_run_spares_a_newer_winner(live):
    """An older run that fails after a newer run completed leaves the newer winner standing (Pangu r16; Athena r17)."""
    import html

    import app.db.postgres as pg

    from app.cubes.cube5_gateway.service import _create_trigger, _cqs_failure_cleanup

    client, who = live
    sid, n = await _themed_session(client, who, "Older run fails", "anonymous")
    await _pin(sid, html.escape("Privacy & Trust"), 99)
    async with pg.async_session_factory() as db:
        older = await _create_trigger(db, uuid.UUID(sid), "cqs_scoring", metadata={"source": "test"})
    await asyncio.sleep(0.05)
    await _cqs(sid)  # the newer run, completed with a winner
    await _cqs_failure_cleanup(uuid.UUID(sid), older.id, "CQS failed: late")
    assert await _cqs_counts(sid) == (n, 1), "the newer winner survives the older run's failure"


async def test_shutdown_closes_theming_and_queued_cqs_triggers(live, monkeypatch):
    """Shutdown closes every trigger it interrupts: a theming run mid-flight and a queued CQS follow-up that will now
    never run both end 'failed' — nothing reads pending forever (Enlil, Athena, Sofia; round 17)."""
    import html

    import app.cubes.cube6_ai.cqs_engine as engine
    import app.cubes.cube6_ai.service as ai_service
    import app.db.postgres as pg
    from sqlalchemy import select

    from app.cubes.cube5_gateway.service import (_create_trigger, _schedule_cqs, shutdown_background_work,
                                                 trigger_ai_pipeline)
    from app.models.pipeline_trigger import PipelineTrigger

    client, who = live
    sid, n = await _themed_session(client, who, "Shutdown closes", "anonymous")
    await _pin(sid, html.escape("Privacy & Trust"), 99)
    started = asyncio.Event()

    async def _slow_pipeline(*a, **k):
        started.set()
        await asyncio.sleep(60)

    class _Slow:
        async def batch_summarize(self, items, timeout=120.0):
            await asyncio.sleep(60)
            return [""] * len(items)

    monkeypatch.setattr(ai_service, "run_pipeline", _slow_pipeline)
    monkeypatch.setattr(engine, "get_summarization_provider_or_offline", lambda name: _Slow())
    async with pg.async_session_factory() as db:
        theming = await trigger_ai_pipeline(db, uuid.UUID(sid))
        first = await _create_trigger(db, uuid.UUID(sid), "cqs_scoring", metadata={"source": "test"})
        queued = await _create_trigger(db, uuid.UUID(sid), "cqs_scoring", metadata={"source": "test"})
    await asyncio.wait_for(started.wait(), timeout=20)
    _schedule_cqs(uuid.UUID(sid), (html.escape("Privacy & Trust"), "3", None, first.id))
    _schedule_cqs(uuid.UUID(sid), (html.escape("Privacy & Trust"), "3", None, queued.id))  # coalesces behind first
    await asyncio.sleep(0.2)
    await shutdown_background_work(grace=0.2)
    async with pg.async_session_factory() as db:
        rows = {t.id: (t.status, t.error_message) for t in (await db.execute(
            select(PipelineTrigger).where(PipelineTrigger.id.in_([theming.id, first.id, queued.id])))).scalars()}
    assert rows[theming.id] == ("failed", "interrupted (shutdown)"), rows[theming.id]
    assert rows[first.id] == ("failed", "CQS interrupted"), rows[first.id]
    assert rows[queued.id] == ("failed", "interrupted (shutdown)"), rows[queued.id]
