# 12-AsM alignment — round 8 (2026-10-07, code at ba77add, LIVE: Verify Live #2611)

**Approved: 9 / 12** (Thor, Enlil, Krishna, Enki, Athena, Aset, Asar, Pangu, Sofia). Means: Security 90.9 · Stability 90.7 · Scalability 90.2 · Efficiency 91.2 · Succinctness 90.3

**N = 8 is the first round in which every SSSES pillar's mean is at or above 90.**

Trend (approvals): 0 → 10 → 8 → 12 → 9 → 6 → 2 → 9. The three remaining objections are each one member of a class already folded: a failed re-read that rescheduled itself (Odin), one read that still counted both cycles (Thoth), and one participant read that still required a login (Christo).

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | APPROVED | 91 | 91 | 90 | 91 | 90 |
| Odin (predictive / future-proof) | NOT_APPROVED | 91 | 89 | 88 | 91 | 91 |
| Enlil (implementation & build verification) | APPROVED | 91 | 91 | 90 | 91 | 90 |
| Krishna (integration & cross-module) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Enki (diversity & edge cases) | APPROVED | 90 | 91 | 90 | 91 | 90 |
| Thoth (data & analytics deep dive) | NOT_APPROVED | 92 | 90 | 91 | 92 | 91 |
| Athena (strategic test planning) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Christo (consensus & user-flow) | NOT_APPROVED | 90 | 86 | 91 | 91 | 90 |
| Aset (consistency validation) | APPROVED | 91 | 91 | 91 | 91 | 90 |
| Asar (synthesis & outcome) | APPROVED | 91 | 91 | 90 | 91 | 91 |
| Pangu (cutting-edge) | APPROVED | 91 | 92 | 91 | 92 | 91 |
| Sofia (multi-perspective) | APPROVED | 91 | 92 | 90 | 91 | 90 |

## Folded after this round

- **Odin — a failed re-read rescheduled itself.** The push re-read's `.catch` now also clears `gate.wanted`, so a rejected read hands back to the 1.5 s poll and never re-asks the backend on its own. Gate: `tests/ballot-themes.test.mjs`.
- **Thoth — readiness counted every cycle.** `readiness_profile` passes the resolved cycle into the metrics engine (`get_all_metrics(db, session_id, cycle_id)`). `tests/live_db/test_reopen_cycle.py` now asserts that GET /rankings/metrics, GET /rankings/readiness (signals and metrics) and GET /rankings/scale-info count cycle 2's three ballots after the re-open, not six.
- **Christo — the questions read required a login.** GET /sessions/{id}/questions is public, like GET /sessions/{id}. `tests/cube1/test_public_session_read.py` now checks every participant read (session by id, by code, questions, presence, themes): each may depend only on the database or the optional user, and the app must serve each one under /api/v1. It reads the routers directly, because how an included router appears in `app.routes` differs across FastAPI versions.

## What each lens said (verbatim)

### Thor (risk & security stress) — APPROVED

The one thing I asked for last round is done and I checked it in the code. In frontend/components/session-view.tsx:762, onBroadcastPresence is now `(count) => { setParticipantCount(count); }`, so a presence message only sets the participant count and can no longer pause the corrective poll. Against the real backend, markBroadcastHealthy() is called in one place, line 740: `if (fresh.status === wanted) markBroadcastHealthy()`, right after the backend re-read in applyPushedStatus. The other call is in the IS_MOCK_MODE branch, where there is no backend to ask; that gap is recorded in HP-33. The gate in tests/ballot-themes.test.mjs:77-82 fails the build if any markBroadcastHealthy() call appears outside applyPushedStatus, and I ran it: 41 passed. mock-rankings (43) and status-advance (10) also pass. The other round-7 fixes hold. A failed re-read clears broadcastHealthy so the poll takes over again (line 744). A push that arrives while a re-read is running sets gate.wanted and gets one trailing re-read, so no push is lost (line 747). The first read is spread over 0–1.5 s. Under attack the worst case is now one extra backend read per participant per second. A forged push that repeats the current status can keep the poll paused, but every such push also triggers a fresh backend read that would catch a real transition, so a participant's view cannot be pinned to a stale status. GET /sessions/{session_id} is now public and returns the same SessionRead as GET /sessions/code/{short_code}, so it exposes nothing that was not already public. You need the session UUID to call it, and test_public_session_read.py passes. POST /override is still owner-gated (require_session_owner lead/admin) and now writes the session's current_cycle. In supabase_broadcast.py the log calls use broadcast_event= instead of event=, so the logging crash is gone, and test_log_event_keyword.py passes. The remaining problems under my lens are all in the backlog with the right Needs: Path C forgery (HP-30), the claimable /api/sessions key (HP-32), Supabase channels writable with the anon key (HP-33), and the GET /sessions/{id} read burst (HP-34). I found no new defect, so scope 1–3 is operational under my lens.


Minor notes:
- GET /sessions/{session_id} and /sessions/code/{short_code} have no per-endpoint slowapi limit, and the Limiter in app/core/rate_limit.py sets no default_limits, so nothing caps how often one address can call these anonymous reads. Each call also counts participants. Worth adding a per-IP limit or folding this into HP-34's edge cache.
- SessionRead is returned to anonymous callers and includes created_by (the moderator's Auth0 subject) and seed. Both were already public through /code/{short_code}, so this is not new, but a slimmer public schema would expose less.
- Against the real backend, an attacker who repeatedly pushes the current status keeps broadcastHealthy refreshed and the 1.5 s poll paused. The push-triggered re-read takes the poll's place, so a real change is still picked up, but it is worth a line in HP-33 that what the attacker gains here is control over the read cadence, not over the status shown.

### Odin (predictive / future-proof) — NOT_APPROVED

Read-only review of ba77add in /tmp/claude-0/wtm, through the Odin (predictive) lens.

All three asks from my previous verdict are now in the code:
1. **Public session read:** backend/app/cubes/cube1_session/router.py:240 GET /{session_id} no longer has an auth dependency and returns the same SessionRead as /code/{short_code}. The gate is backend/tests/cube1/test_public_session_read.py; it inspects the route itself, so it works with auth off.
2. **Healthy only on a confirmed status:**
   - session-view.tsx:740 calls markBroadcastHealthy() only when `fresh.status === wanted` (the mock path is separate).
   - onBroadcastPresence (L762) only sets the count.
   - A push inside the window sets gate.wanted, and that triggers a trailing re-read (L747).
3. **Spread and record the burst:** the first re-read of a push waits 0–1.5 s (L734), and the GET /sessions/{id} burst is recorded as backlog HP-34 (CODE + INFRA) with an honest "Needs". HP-33 is corrected.

I also checked the cycle work: the Cube 7 router `_resolve_cycle` is used on every read, and metrics.py `_cyc` filters every get_*_metrics. The structlog event= fix is in supabase_broadcast.py (broadcast_event=); the AST gate scans app/, and the remaining `event=` keywords in app/ are broadcast_event() arguments, not log calls. The tests/live_db reopen proof is wired into deploy.yml, and CI fails if it skips.

Tests I ran:
- Backend: tests/cube1, tests/cube7 and test_log_event_keyword, 365 passed.
- Frontend: mock-rankings 43, cube-sim-live 837, ballot-themes 41, status-advance 10, all passing.

One new defect, not in the backlog, blocks approval. It came in with this round's trailing re-read: a re-read that fails (network error, 5xx or 429) leaves gate.wanted set, and .finally schedules another re-read with no backoff. So during the overload or outage that 1M load would cause, every client loops at about 1 request per 1.75 s on top of the restarted 1.5 s poll. The fix is one line plus a gate. Everything else I checked under this lens is minor or recorded in the backlog.

- **Required:** A failed push re-read must not reschedule itself. In the .catch, also clear gate.wanted (the 1.5 s poll already resumes because broadcastHealthy is cleared), or give the trailing re-read a capped exponential backoff on error. Add a status-advance or source gate that fails if a rejected re-read schedules another read.
  - File: `frontend/components/session-view.tsx`:744
  - Evidence: L732 `gate.wanted = push.status;` ... L742 `if (gate.wanted === wanted) gate.wanted = null;` runs only in .then. L744 `.catch(() => { broadcastHealthy.current = false; })` leaves gate.wanted set. L747 `.finally(() => { gate.busy = false; if (gate.wanted) applyPushedStatus({ status: gate.wanted }); })`. lib/api.ts L148/L177 throws on network errors and on every non-2xx (5xx, 429), so one push during an outage starts an endless re-read every ~1-2.5 s (L734 `Math.max(0, 1000 - (Date.now() - gate.at)) + Math.random() * 1500`). This runs alongside the 1.5 s poll, which restarts once broadcastHealthy is false.
  - Why it blocks: ba77add introduced this and HP-34 does not record it. When the backend is overloaded or down, the case that matters at 1M, each participant goes from about 0.67 to about 1.2 GET /sessions/{id} per second, with no backoff, until the backend answers. So a single push turns an overload into a retry storm, and the burst arrives together on recovery. The fix is one line.

Minor notes:
- GET /rankings/metrics (cube7 router L255) always uses the current cycle and, unlike its sibling endpoints, takes no explicit cycle_id. Past cycles' metrics cannot be read from it. Not blocking.
- The 1.5 s checkStatus poll also has no error backoff. That is already covered by HP-34 CODE+INFRA, but adding a capped backoff on consecutive failures would remove most of HP-34's risk on the client side.
- test_public_session_read checks the dependency names by substring (current_user/require/_check). A future dependency under a different name, such as get_current_principal, would get past it. Matching against an explicit allow-list of public dependencies (only get_db) would be stricter.
- The event= AST gate only matches loggers named logger/log/_log. A call through self.logger or a module-specific name would get past it. It passes today.

### Enlil (implementation & build verification) — APPROVED

Both items I asked for last round are now in the code. (1) POST /override writes into the open cycle. backend/app/cubes/cube7_ranking/router.py:425 passes `cycle_id=int(getattr(session, "current_cycle", 1) or 1)`. In ranking_governance.py, apply_governance_override filters AggregatedRanking by cycle_id at both of its queries. backend/tests/live_db/test_reopen_cycle.py:92-99 runs two rounds on a real Postgres, overrides in cycle 2 and checks that GET /overrides returns that override. deploy.yml:187 fails CI if any live_db test is skipped. (2) Presence no longer marks the channel healthy. session-view.tsx:762 `onBroadcastPresence = useCallback((count) => { setParticipantCount(count); })`. markBroadcastHealthy() is called only inside applyPushedStatus: once on the no-backend (mock) path, and on the backend path only when `fresh.status === wanted` (line 740). A failed re-read clears broadcastHealthy, and a push that arrives during a re-read leaves one trailing re-read. ballot-themes.test.mjs:80-82 counts every call so this stays enforced. I also checked the other round-7 fixes. GET /sessions/{session_id} is public with the same SessionRead (cube1 router:240). The structlog keyword is now broadcast_event=, and the AST gate test passes. Runs on ba77add: backend cube1 public-read + log-keyword + cube7 tests 249 passed; ballot-themes 41/0, mock-rankings 43/0, cube-sim-live 837/0, status-advance 10/0; tsc shows 0 new errors after the project filter. Within scope 1–3 under my lens, nothing I checked is broken or missing from the backlog. The leftovers below are minor.


Minor notes:
- session-view.tsx:740: the confirm check `fresh.status === wanted` compares status only, not current_cycle. A forged push that repeats the current status (for example 'polling' while already polling) gets confirmed and pauses the 1.5 s poll for 8 s. The only cost is a delay, because the next real push still triggers a re-read. Could also compare the cycle.
- session-view.tsx applyPushedStatus: the pending gate.timer setTimeout is not cleared on unmount. After the participant leaves the page, one stray GET /sessions/{id} and a setSession on the unmounted component can still fire. Harmless, but it should be cleaned up.
- Running `node tests/ballot-themes.test.mjs` directly fails with module resolution errors. Run it through `npm run test:ballot-themes`, which adds the ts-alias loader. Gate docs that cite node invocations should use the npm script.
- The GET /sessions/{id} burst when a status changes at 1M scale is recorded honestly as backlog HP-34 (CODE + INFRA).

### Krishna (integration & cross-module) — APPROVED

My one round-7 item is done in the code and has a gate. In frontend/lib/mock-data.ts, simThemeKey (lines 885-887) keys _simThemes by `${sid}:${current_cycle}`. All four readers go through it: /ai/run (1482), /ai/status (1489), /themes (1496-1507) and _validateMockBallot (941). /themes builds themes on demand only in the first cycle (`const firstCycle = ... === 1`). A re-opened cycle with no themes refuses a ballot (lines 953-955: "A re-opened cycle that has not been themed takes no ballot"). Ballots are kept per session and cycle (1515-1517). This matches the backend: pipeline.ballot_cycle_clause reads Theme.cycle_id == current_cycle only, and phase_b._replace_cycle_themes writes per cycle. Gates I ran myself at ba77add: mock-rankings 43/0 (lines 66-71 assert cycle-2 /themes is empty, ai/status is pending, the ballot is refused with 400 and nothing is recorded), cube-sim-live 837/0, ballot-themes 41/0, status-advance 10/0. Backend: tests/cube1/test_public_session_read.py, tests/core/test_log_event_keyword.py and all of tests/cube7 passed, together with tests/live_db (254 passed). tests/live_db/test_reopen_cycle.py ran against a real Postgres and was not skipped (5 passed). It proves the ballot, the cycle-1 refusal, GET /rankings, the override and its audit read, the Cube 9 winner and count, and the ranking summary all read cycle 2. The other round-7 fixes I checked across modules are in the code as stated. In session-view.tsx, onBroadcastPresence only sets the count (line 762). markBroadcastHealthy runs only after a backend re-read confirms the status (line 740). gate.wanted triggers one trailing re-read (747). A failed re-read clears broadcastHealthy (744). GET /sessions/{session_id} is now public, like GET /sessions/code/{short_code}. The burst of GET /sessions/{id} reads at 1M is logged honestly as HP-34 (CODE + INFRA), and the Path C write-key gap as HP-32. Scope 1-3 is operational from the integration side, and SIM and LIVE agree on the cycle rule.


Minor notes:
- Re-themed cycles include earlier answers, in both modes. phase_b._fetch_summaries (lines 59-82) filters ResponseMeta by session_id only, not by cycle_id, even though cube2_text/service.py:661 stores cycle_id=session.current_cycle. So a re-opened cycle's themes are built from cycle-1 and cycle-2 answers together. The SIM's /ai/run does the same: it uses all of mockResponses[sid]. SIM and LIVE agree, so this is not a parity defect. But whether a later cycle should be themed only from its own answers is a design choice for the operator (DECISION), and it is not recorded in the backlog or the cycle docstrings.
- The SIM's on-demand theming in cycle 1 is stored only when there are responses (`if (resp.length)`). An empty session therefore rebuilds empty rows on every /themes GET. Harmless, but it is a small asymmetry with LIVE, where /themes reads stored rows only.

### Enki (diversity & edge cases) — APPROVED

Both of my round-7 items are done in ba77add and have gates. (1) Presence no longer marks the channel healthy. frontend/components/session-view.tsx:762 is now `const onBroadcastPresence = useCallback((count: number) => { setParticipantCount(count); }, []);`. Against the real backend, markBroadcastHealthy() is called only at :740 (`if (fresh.status === wanted) markBroadcastHealthy();`), after the backend has confirmed the status. The mock-only call at :717 is also inside applyPushedStatus. ballot-themes.test.mjs:80-83 counts every call and checks presence. (2) A push that arrives during an in-flight read or inside the 1 s window is no longer dropped. :732 sets `gate.wanted = push.status` before the busy/timer guard, and :747 runs one trailing re-read (`if (gate.wanted) applyPushedStatus({ status: gate.wanted })`). A failed re-read clears broadcastHealthy (:744), so the poll resumes. Checked under my lens: a pushed stale status cannot regress the view, because the backend's answer goes through statusAdvances and is applied even when it differs from the push. A spoofed push of the current status only pauses the poll for 8 s, and every push brings a backend read anyway. GET /sessions/{id} is now public with the same SessionRead as the by-code read (router.py:240, gated in test_public_session_read.py). In SIM, simThemeKey falls back to cycle 1 when current_cycle is missing (mock-data.ts:886). I ran ballot-themes 41/0, mock-rankings 43/0 and status-advance 10/0 through the npm scripts, and the backend cube1 public-read, log-event-keyword and cube7 tests: 249 passed. The read burst at 1M is recorded as HP-34, and anon-writable channels as HP-33. The issues left are small edge cases, listed in minor_notes. None blocks scope 1–3.


Minor notes:
- session-view.tsx:744-747: a failed re-read does not clear gate.wanted, so the trailing re-read in finally fires again 1–2.5 s later, with no backoff, for as long as the backend keeps failing. That includes a 429 from the global rate limiter, which makes the overload worse. Clear wanted after N failures, or back off exponentially.
- session-view.tsx:710-749: no effect cleanup clears pushReadRef.current.timer on unmount or when sessionId changes. If the backend is failing, the retry chain above keeps running after the participant leaves the page.
- session-view.tsx:742: suppose a push arrives during a read and carries the same status string as the read in flight. If that read began before the backend committed (the classic case: a spoofed 'ranking', then the real 'ranking' mid-read), `gate.wanted === wanted` clears it and the real push is dropped. The poll recovers within the 8 s healthy window, so the cost is a delay of at most about 8 s. A sequence counter instead of string equality would close it.
- The healthy check at :740 compares status only, not cycle. This is harmless today because a re-open always changes status as well, but it is worth matching `current_cycle` when the push carries one.

### Thoth (data & analytics deep dive) — NOT_APPROVED

I checked my three round-7 asks in ba77add and all three are done. POST /override writes into the session's current_cycle, with a real-database cycle-2 proof in test_reopen_cycle.py. GET /rankings/metrics now calls the metrics engine with the resolved cycle, and the engine filters every table through _cyc. /rankings/scale-info counts Ranking.cycle_id == the resolved cycle. The same class of defect survives in one caller I verified: readiness.py:89 still calls get_all_metrics(db, session_id) with no cycle. In a re-opened session, GET /rankings/readiness mixes cycle 1 and cycle 2 for the winner's confidence, the submission count (sparse-data risk) and human_authority (overrides), while its anomaly and replay signals read cycle 2 only. No test covers metrics, readiness or scale-info in cycle 2. It is not in the backlog and it is a one-line fix plus a test, and that is all that stands between this and my approval. Everything else under my lens is minor.

- **Required:** Pass the resolved cycle into the metrics engine in readiness_profile: `ranking_metrics.get_all_metrics(db, session_id, cycle_id)`. Then add a cycle-2 assertion (a test, or a step in backend/tests/live_db/test_reopen_cycle.py) that GET /rankings/metrics, GET /rankings/readiness (signals.ranking_submissions, metrics.outcome) and GET /rankings/scale-info (voter_count) count cycle 2's three ballots, not six.
  - File: `backend/app/cubes/cube7_ranking/readiness.py`:89
  - Evidence: readiness.py:88-90 `m = await _safe(ranking_metrics.get_all_metrics(db, session_id), ...)` passes no cycle, while the same function passes cycle_id to detect_voting_anomalies (l.98) and verify_replay (l.102). The router does resolve the cycle (router.py:275 `cycle_id = await _resolve_cycle(...)`) and passes it to readiness_profile, but the call ignores it. Under metrics.py:50 `_cyc` with cycle_id=None, no cycle filter is applied. get_outcome_metrics (metrics.py:119) then picks `next(r for r in agg_rows if r.is_top_theme2)` from an unordered set that holds BOTH cycles' AggregatedRanking rows. No cycle-2 test covers /rankings/metrics, /readiness or /scale-info: grep finds none in backend/tests/cube7, and test_reopen_cycle.py checks only the ballot, /rankings, the override, Cube 9 and the ranking summary.
  - Why it blocks: My previous required change (2) was to scope the Cube 7 metrics engine to one cycle. The /rankings/metrics endpoint is fixed, but the engine's other caller still mixes cycles. In a re-opened session, the readiness answer object takes its confidence and risk from a winner that may belong to cycle 1. ranking_submissions counts every cycle's ballots, so the sparse-data risk is wrong. human_authority turns true from a cycle-1 override. All of this sits beside anomaly and replay signals that read cycle 2. One readiness verdict is built from two different datasets. This is the same class of defect as round 7, it is not in the backlog, and the fix is one line plus a test.

Minor notes:
- Previous ask (1) is done. router.py:427 POST /override passes `cycle_id=int(getattr(session, "current_cycle", 1) or 1)`, and live_db/test_reopen_cycle.py:92-99 checks the cycle-2 override write and its audit read on a real database.
- Previous ask (2) is done for GET /rankings/metrics. router.py:256 calls `get_all_metrics(db, session_id, await _resolve_cycle(db, session_id, None))`, and metrics.py:57/85/110 filter Ranking, AggregatedRanking and GovernanceOverride through `_cyc`. The one remaining gap is the readiness caller (see required change).
- Previous ask (3) is done. router.py:296-304 scale-info resolves the cycle and counts `Ranking.cycle_id == cycle_id`. It has no runtime test.
- GET /rankings/metrics always resolves the current cycle and takes no `cycle_id` query param, while its sibling endpoints accept an explicit cycle. It is correct by default but inconsistent, so a past cycle's metrics cannot be read.
- readiness_profile and project_session_readiness still default `cycle_id: int = 1` in the library signature. The router resolves the cycle correctly, but a direct library caller gets cycle 1, not the current one.
- Verified locally: tests/cube7 + tests/cube1/test_public_session_read.py + tests/core/test_log_event_keyword.py gave 249 passed.

### Athena (strategic test planning) — APPROVED

I checked both of my round-7 asks in the code at ba77add, and both are done.

(1) The SIM mock now follows the one-cycle ballot rule. In frontend/lib/mock-data.ts, simThemeKey (line 885) stores themes per `${sid}:${current_cycle}`. A re-opened cycle that has not been themed gets empty /themes. Its ai/status reads pending. _validateMockBallot (around line 953) refuses its ballots with "No themes found". On-demand theming happens only when firstCycle is true (line 1500). tests/mock-rankings.test.mjs lines 66-71 assert empty themes, a pending status, a 400 on the ballot and nothing recorded. I ran four gates and all passed: mock-rankings 43/43, cube-sim-live 837/837, ballot-themes 41/41, status-advance 10/10.

(2) The round-6 cycle fixes now have a runtime test on real Postgres: backend/tests/live_db/test_reopen_cycle.py. It runs two full rounds (respond, rank, ai/run, three ballots, aggregate, reopen). It then checks that cycle 2:
- shows empty themes before theming;
- uses theme ids disjoint from cycle 1's, with the same count;
- refuses a cycle-1 ballot with 400/409/422;
- returns GET /rankings rows that are a subset of the cycle-2 ballot;
- records the override write and shows it in GET /overrides;
- gives Cube 9 analytics a ranking_submissions count of 3 (not 6) and a cycle-2 winner;
- returns a /ranking-summary limited to cycle 2.

The live_db conftest skips these tests when no Postgres is reachable. deploy.yml (lines 129-188) starts a postgres:16 service, probes it, and fails the job if any tests/live_db test is SKIPPED. So the proof cannot pass silently.

Other round-7 items I checked:
- GET /sessions/{id} is now public with the same SessionRead model as the by-code read, and tests/cube1/test_public_session_read.py checks the route itself.
- The Cube 7 metrics engine filters every query by cycle (`_cyc`) and the endpoint resolves the current cycle.
- /rankings/scale-info counts only Ranking.cycle_id == the resolved cycle.
- HP-33 and HP-34 are recorded honestly in the backlog with a correct Needs (INFRA + APPROVAL, CODE + INFRA).

Backend spot run (tests/cube7, the public-read gate and the log-keyword gate): 249 passed.

Nothing blocking remains under my lens. The minor gaps are under minor_notes.


Minor notes:
- The new cycle scoping of GET /rankings/metrics and /rankings/scale-info has no runtime test on real Postgres. Both routes are in backend/app/cubes/cube7_ranking/router.py (lines 241-256 and 288-311). test_reopen_cycle.py does not call either one. Two more assertions in the existing test would cover them cheaply: voter_count == 3 for cycle 2, and the metrics ballot count == 3.
- test_reopen_cycle.py waits on a fixed asyncio.sleep(6) for the Phase A summaries. Polling ai/status or the summaries endpoint with a deadline would make it less flaky on a slow CI runner.
- The gate in test_public_session_read.py checks dependency names by substring ('current_user', 'require', '_check'). It works, but a renamed auth dependency could slip past it. An anonymous-caller request under a forced Auth0-configured setting would test the actual behaviour instead.

### Christo (consensus & user-flow) — NOT_APPROVED

The round-7 folds are in place and I checked them in the code. In session-view.tsx:762, onBroadcastPresence only sets the participant count. markBroadcastHealthy is called only after the backend confirms (line 740) or in mock mode after statusAdvances accepts the push. My round-7 dropped-push note is resolved: a push that arrives while a read is in flight or inside the 1 s window sets gate.wanted and gets exactly one trailing re-read (lines 732-747). A failed re-read clears the healthy flag (line 744). The first read of a push is spread over 0–1.5 s, and HP-34 records the read burst. GET /sessions/{id} is now public (router.py:240-251) and gated. The gates pass: ballot-themes 41/41, mock-rankings 43/43, status-advance 10/10, and backend test_public_session_read plus test_log_event_keyword 3/3. One problem blocks approval, and it sits in the same class Odin raised last round. GET /sessions/{id}/questions still requires login (get_current_user). In production with Auth0, every anonymous participant's question fetch returns 401. The client swallows the error, so the participant cannot submit a response and the live journey stops before theming and voting. The contract gate even lists this route as participant-open, but it checks only owner-checks, so the mismatch slips through. With that route opened and the gate extended to cover the whole participant allowlist, I would approve. The rest of the flow under my lens is consistent and honestly recorded.

- **Required:** Make GET /sessions/{session_id}/questions public, the same way round 7 opened GET /sessions/{session_id}: drop `user: CurrentUser = Depends(get_current_user)`, or use get_optional_current_user. Then extend backend/tests/cube1/test_public_session_read.py, or the contract gate, so it fails when any route in PARTICIPANT_SESSION_ROUTES carries a get_current_user / require_* dependency. That covers the whole class, not just this route.
  - File: `backend/app/cubes/cube1_session/router.py`:499
  - Evidence: Lines 495-499: `@router.get("/{session_id}/questions", ...) async def list_questions(session_id, db, user: CurrentUser = Depends(get_current_user))`. In core/auth.py:123-129, get_current_user returns a mock user only in dev mode. With Auth0 configured, it raises 401 'Missing authorization token' for an anonymous caller. The participant calls this endpoint at frontend/components/session-view.tsx:578-582 (`api.getSessionQuestions(sessionId).then(setQuestions).catch(() => {})`), so the 401 is swallowed. handleSubmitResponse then returns early on `questions.length === 0`. SessionJoinResponse (schemas/session.py:170-184) carries no questions, so nothing else fills them. backend/tests/test_api_contract_gates.py:286 declares this route participant-open ('participants read the questions they answer'), but that gate only checks owner-checks, not login requirements, so the contradiction passes. It is not in the high-priority backlog.
  - Why it blocks: This is the production-only participant-flow defect Odin found last round for GET /sessions/{id}, and round 7 fixed only that one instance. In LIVE mode with Auth0 configured, every anonymous participant reaches the polling screen and sees no question. Their response cannot be submitted, so no responses come in, nothing gets themed, and the voting never happens. Scope 2 (LIVE operational) and scope 3 (live polling at scale) fail at their first participant step. Dev and test mode hide it, which is why 3430 backend tests and the live_db journey pass. It is unlisted, so it blocks.

Minor notes:
- backend/app/cubes/cube7_ranking/ranking_submission.py:67-68 still says 'The ballot is the newest themed cycle at or before this one'. That contradicts the strict current-cycle rule in ballot_cycle_clause. I flagged this in round 7 and it is still there.
- backend/app/cubes/cube7_ranking/router.py:149: GET /rankings uses get_current_user, but test_api_contract_gates.py lists cube7_ranking.get_rankings as 'live results shown to participants'. The participant UI does not call it today, so it is minor. It is the same login-versus-allowlist mismatch and the required gate extension would catch it.
- session-view.tsx:744-747: when the backend is down, a failed re-read leaves gate.wanted set, so finally re-arms applyPushedStatus every ~1–2.5 s forever, on top of the 1.5 s poll. It is rate-bounded, but consider clearing wanted on catch, since the poll takes over anyway.
- session-view.tsx: pushReadRef.timer is not cleared on unmount, so a pending re-read can fire a setSession after the page is left. This is harmless but untidy.
- There is still no user-facing message when a re-opened round's theming fails. Participants wait on an empty ballot even though the theming-status endpoint already returns the 'error' stage.

### Aset (consistency validation) — APPROVED

Approved again at ba77add. Every round-7 consistency objection is folded, and the fixes agree with each other.

Status input (frontend/components/session-view.tsx): markBroadcastHealthy() is now called in only one place, applyPushedStatus:740, and only when `fresh.status === wanted`. Presence only sets the participant count. ballot-themes counts every call site, so the gate enforces this. A push that arrives during an in-flight read or inside the 1 s window sets gate.wanted and gets one trailing re-read. A failed re-read clears broadcastHealthy, so the 1.5 s poll (line 646) resumes. HP-33 and HP-34 now describe the code accurately.

Cycle class on the backend: I grepped every Ranking, AggregatedRanking and GovernanceOverride query under app/. Each one in Cube 7 and in Cube 9's service is scoped to a single cycle. POST /override now writes `current_cycle` (cube7 router.py:427). The Cube 7 metrics engine takes a cycle_id and /rankings/metrics resolves it. scale-info counts `Ranking.cycle_id == cycle_id`.

GET /sessions/{id} is now public and returns the same SessionRead as /sessions/code/{short_code}, which matches how anonymous participants read their session.

SIM and LIVE parity: the mock theme store is keyed by session and cycle through simThemeKey. A re-opened cycle that has not been themed returns empty /themes, reports ai/status as pending, and refuses a ballot with 400. LIVE behaves the same way via ballot_cycle_clause. Both sides theme every response in the session, so their inputs are consistent.

Gates I re-ran on ba77add, all passing:
- ballot-themes 41/0
- mock-rankings 43/0
- status-advance 10/0
- cube-sim-live 837/0
- backend tests/cube1, tests/cube7, tests/cube9 and test_log_event_keyword: 470 passed

The four leftovers in minor_notes are minor consistency debt. None of them stops scope 1–3 from being operational.


Minor notes:
- backend/app/cubes/cube9_reports/metrics.py:56-67 and :101-107 still read across every cycle: themes_available counts every cycle's Theme rows, and has_final_ranking and winner_determined count AggregatedRanking rows from all cycles. This is now the only metrics triad not scoped to one cycle, since Cube 7's metrics.py gained `_cyc` in this commit. Reviewers raised it in rounds 6 and 7 and it is not in the backlog. It is cosmetic (counts and booleans), but scoping it with `_report_cycle` would finish the 'one cycle everywhere' claim.
- frontend/lib/mock-data.ts:883-884 says 'an earlier cycle's ids are refused', but buildSimThemeRows (lib/sim-console.ts:210,224) builds ids such as `th-${stance}-l${level}-${b}` with no cycle in them. Once cycle 2 is themed in SIM, a cycle-1 ballot is therefore accepted, while LIVE refuses it because cycle-2 themes get new UUIDs. The divergence is small, since the client reloads themes, but the comment overstates the parity. Either add the cycle to the SIM ids or reword the comment.
- session-view.tsx:744-748: when a re-read fails, gate.wanted is not cleared, so finally() schedules another read every 1–2.5 s. The cleared healthy flag also restarts the 1.5 s poll. During a backend outage each client therefore runs two read loops instead of one. Clearing gate.wanted in the catch handler would leave the poll as the only retry path.
- session-view.tsx:735: the pending gate.timer is never cleared on unmount or when sessionId changes. This is harmless in practice, because statusAdvances gates the setSession call, but it is a loose end next to the interval cleanup at line 693.

### Asar (synthesis & outcome) — APPROVED

Both changes I asked for in round 7 are now in the code. (1) frontend/components/session-view.tsx:762 has `const onBroadcastPresence = useCallback((count: number) => { setParticipantCount(count); }, []);`, so presence only sets the count. markBroadcastHealthy() is called only inside applyPushedStatus: in mock mode at l.717, and against the real backend only when `fresh.status === wanted` (l.740). ballot-themes.test.mjs l.80-82 counts every call and requires all of them to sit in that block. HP-33 is corrected to say that since round 7 nothing else marks the channel healthy, and that a push inside the window leaves one trailing re-read. (2) A push that arrives while a re-read is in flight, or inside the 1 s window, sets gate.wanted (l.732). The finally block then sends one more read (`if (gate.wanted) applyPushedStatus(...)`, l.747). A failed re-read clears broadcastHealthy so the poll resumes (l.744). The first read is spread over 0–1.5 s, and the burst is recorded as HP-34 (CODE + INFRA).

The other round-7 folds also check out. GET /sessions/{session_id} is public and returns the same SessionRead as /code/{short_code} (cube1 router l.240-251). POST /override passes the session's current_cycle (cube7 router l.426). /rankings/metrics and /rankings/scale-info resolve the cycle. SIM keys themes by simThemeKey (session + cycle).

Tests I ran:
- Frontend gates: ballot-themes 41/41, mock-rankings 43/43, status-advance 10/10, cube-sim-live 837/837.
- Backend: public-session-read, log-event-keyword and cube7 pass 249.
- tests/live_db (including test_reopen_cycle) passes 5/5.
- Two failures turned out to be caused by the shared test databases, not the code. A sql_tally_parity case failed once and a live_db console test failed once; both passed on rerun. The fixtures truncate (sql_tally_parity) or force-drop and recreate (live_db) a shared local database, so reviewers running at the same time interfere with each other.

Synthesis: scope 1–3 works in both SIM and LIVE. The push path is now a hint that only the backend can confirm. Cycle 2 reads only cycle 2 from ballot through override to the Cube 9 summary, and that is proven against a real database. What remains is either recorded honestly (HP-33 INFRA+APPROVAL, HP-34 CODE+INFRA) or minor.


Minor notes:
- session-view.tsx l.744-747: if the re-read fails, gate.wanted is not cleared, so finally keeps scheduling another read every ~1–2.5 s with no backoff for as long as the backend is down. This runs on top of the 1.5 s poll that resumes, roughly doubling each participant's GET /sessions/{id} rate during an outage. It is small and bounded per client, but worth folding into HP-34: clear wanted in catch, or back off exponentially.
- backend/tests/live_db/conftest.py:76 (`drop database if exists ... with (force)`) and tests/cube7/test_sql_tally_parity.py (truncate on the shared sim_parity database) make concurrent runs knock each other over. A per-run database name (for example suffixed with the pid) would stop false failures when several reviewers or CI jobs run at once.
- HP-33 still allows a forged forward status to apply in mock mode, and forged pushes cost one backend read per second per listener. Both are recorded and depend on INFRA, so they do not block approval.

### Pangu (cutting-edge) — APPROVED

Both items I asked for in round 7 are now in the code. (1) Presence no longer marks the channel healthy. In frontend/components/session-view.tsx:762 the presence callback only sets the count: `const onBroadcastPresence = useCallback((count: number) => { setParticipantCount(count); }, []);`. markBroadcastHealthy() is called in only two places, both inside applyPushedStatus: the mock-mode branch at :717, and :740 `if (fresh.status === wanted) markBroadcastHealthy()`, which runs after the backend confirms the status. tests/ballot-themes.test.mjs:80-83 counts every call, and the gate passes (41/0). (2) Pushes are coalesced. `gate.wanted = push.status` (:732) records a push that arrives during a re-read or inside the 1 s window. finally() then makes one trailing read: `if (gate.wanted) applyPushedStatus({ status: gate.wanted })` (:747). A failed re-read clears the healthy flag so the poll takes over again: `.catch(() => { broadcastHealthy.current = false; })` (:744). The first read is spread over 0–1.5 s (:734). A forged push with a different status does not loop: wanted is cleared when it matches, and reads stay at one per second per client. I also checked the rest of the round-7 fold. GET /sessions/{session_id} is public with the same SessionRead (cube1 router.py:245-251), and its gate passes. Cube 7 routes resolve the current cycle through _resolve_cycle, including metrics (:256) and scale-info (:296). The structlog event= collision is fixed and has an AST gate. Test results: cube-sim-live 837/0, mock-rankings 43/0, ballot-themes 41/0, backend cube1+cube7+core 474 passed, live_db 5/5 (including test_reopen_cycle across two real rounds), SQL-tally parity 9/9. Under my lens the remaining frontier work is recorded honestly in the backlog: Supabase private channels with Realtime authorization (HP-33, INFRA+APPROVAL), and the GET /sessions/{id} read burst at 1M with an edge cache and a Durable-Object hub (HP-34, CODE+INFRA). Scope 1–3 is operational.


Minor notes:
- The live_db and SQL-tally parity proofs use fixed database names (live_db_test, sim_parity). Each test drops or truncates its database, so concurrent runs break each other. I saw intermittent failures from this (test_reopen_cycle returned a 500 at 'ai run'; parity said 'No rankings found'). With my own database names (LIVE_DB_DSN / SIM_TEST_DSN) every run passed: 4/4 parity, 2/2 reopen, 5/5 live_db. A per-run suffix (pid or uuid) on the default name would make the proofs safe to run in parallel. This is test hygiene, not a code defect.
- session-view.tsx: pushReadRef.current.timer is not cleared on unmount. A pending jittered re-read can still fire one GET after the participant leaves the page. It is harmless (setSession on an unmounted component does nothing in React 18), but one clearTimeout in a cleanup would remove it.
- When a push is confirmed, the 1.5 s poll stays paused for up to 8 s. If the next real transition's broadcast is lost, a participant can sit on the old status for up to 8 s. This is acceptable as a trade-off, and HP-34's edge cache would make it cheap to shorten.

### Sofia (multi-perspective) — APPROVED

The one change I asked for last round is done. In frontend/components/session-view.tsx:762, onBroadcastPresence is now just `useCallback((count: number) => { setParticipantCount(count); }, [])`, so presence traffic no longer marks the channel healthy. Against the real backend, markBroadcastHealthy() runs only after a backend re-read returns the pushed status: `if (fresh.status === wanted) markBroadcastHealthy();` at :740. The other call, at :717, is the mock-only branch and comes after a statusAdvances check. A gate enforces this: tests/ballot-themes.test.mjs:80-83 counts every markBroadcastHealthy() call in the file and requires all of them to sit inside applyPushedStatus. The round-7 fixes for dropped pushes are also in the code: gate.wanted plus one trailing re-read at :732/:747, a failed re-read clears broadcastHealthy at :744, and the first read is spread with Math.random()*1500.

I looked at each Odin, Thoth and SIM item from more than one angle. GET /sessions/{session_id} is public and returns the same SessionRead as /code/{short_code} (cube1_session/router.py:240-251). Cube 7 metrics now resolve the current cycle (router.py:255-256), and scale-info and the other reads go through _resolve_cycle. HP-33 and HP-34 in the backlog are accurate about what is left (anon-writable channels, the read burst at 1M) and both carry the right Needs (INFRA/APPROVAL, CODE+INFRA).

Checks I ran:
- frontend gates: ballot-themes 41/0, mock-rankings 43/0, status-advance 10/0, cube-sim-live 837/0
- backend: cube7 plus test_public_session_read plus test_log_event_keyword, 249 passed

I did not run the full backend suite or test_reopen_cycle.py; the second needs a real database. Under my lens, scope 1–3 is operational, and what remains is either minor or recorded in the backlog.


Minor notes:
- SessionRead exposes created_by (the moderator's Auth0 subject). The public /code/{short_code} read already did this; making GET /sessions/{id} public adds a second path to the same field. Consider dropping it from the public shape or adding a backlog note.
- A third party can keep re-pushing the true current status. The backend confirms it each time, which keeps the 1.5 s poll paused, but each push still triggers its own ≤1/s backend read, so participants stay correct. The cost is the per-client read rate HP-33 already records.
- pushReadRef's pending timer is not cleared on unmount, so a re-read can fire after the view closes. It is harmless in React 18, but a cleanup would be tidier.
- Running the gate files with bare `node tests/*.test.mjs` fails because they need the ts-alias loader. Only the npm run test:* entry points work, which is fine but not obvious.
