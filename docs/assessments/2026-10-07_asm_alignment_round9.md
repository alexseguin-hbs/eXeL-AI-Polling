# 12-AsM alignment — round 9 (2026-10-07, code at 00352e6, LIVE: Verify Live #2613)

**Approved: 11 / 12** (Thor, Odin, Enlil, Krishna, Enki, Thoth, Athena, Christo, Asar, Pangu, Sofia). Means: Security 91 · Stability 91.8 · Scalability 90.1 · Efficiency 91.1 · Succinctness 90

Every pillar stays at or above 90 for the second round running (first reached at N = 8).

Trend (approvals): 0 → 10 → 8 → 12 → 9 → 6 → 2 → 9 → 11. Aset's one objection is the last member of the 'one cycle everywhere' class (Cube 9's report metrics), raised since round 6 and never recorded until now.

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Odin (predictive / future-proof) | APPROVED | 91 | 92 | 91 | 91 | 90 |
| Enlil (implementation & build verification) | APPROVED | 92 | 91 | 91 | 92 | 90 |
| Krishna (integration & cross-module) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Enki (diversity & edge cases) | APPROVED | 90 | 92 | 90 | 91 | 90 |
| Thoth (data & analytics deep dive) | APPROVED | 90 | 92 | 88 | 90 | 88 |
| Athena (strategic test planning) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Christo (consensus & user-flow) | APPROVED | 92 | 92 | 90 | 91 | 90 |
| Aset (consistency validation) | NOT_APPROVED | 91 | 90 | 90 | 91 | 90 |
| Asar (synthesis & outcome) | APPROVED | 91 | 92 | 90 | 91 | 91 |
| Pangu (cutting-edge) | APPROVED | 91 | 92 | 91 | 92 | 91 |
| Sofia (multi-perspective) | APPROVED | 91 | 92 | 90 | 91 | 90 |

## Folded after this round

- **Aset — Cube 9's report metrics counted every cycle.** `cube9_reports/metrics.py` counts themes, the final ranking and the winner in the report cycle (`_report_cycle`, the newest aggregated cycle — the same cycle the CSV and analytics read). `tests/live_db/test_reopen_cycle.py` asserts GET /reports/metrics reports cycle 2's theme count after the re-open (before the fix it summed both cycles).
- **Aset (minor) — SIM theme ids were the same in every cycle.** A themed re-opened cycle in the SIM now carries its own ids (cycle 1 unchanged, so every single-round replay hash holds), so a cycle-1 ballot is refused in a themed cycle 2, as LIVE. Gate: `tests/mock-rankings.test.mjs` (4 new checks).
- **Aset (minor) — a pending push re-read outlived its session.** It is cleared on unmount or session change. Gate: `tests/ballot-themes.test.mjs`.
- **Thor, Odin, Enlil — the real-database proofs wiped each other.** With a fixed default database name, two runs on one Postgres dropped or truncated each other's data mid-test (the likely cause of the unnamed backend CI flakes). `tests/own_db.py`: with no DSN in the environment, each run uses its own database name (`…_<pid>`) and drops it at session end; CI's explicit DSNs are unchanged.

## What each lens said (verbatim)

### Thor (risk & security stress) — APPROVED

I reviewed 00352e6 read-only, comparing it with a812b4f under the risk and security lens. Each of the three round-8 changes is in the code, and none of them widens the attack surface.

(1) Questions read. GET /sessions/{session_id}/questions (backend/app/cubes/cube1_session/router.py:495) no longer needs a login. It returns QuestionRead (backend/app/schemas/question.py:12), which carries only id, session_id, cycle_id, question_text, order_index, status and created_at. Participants are shown that text anyway. A caller still needs the session UUID, and the query reads a single session's rows by order_index. Writes stay owner-gated: POST /questions and the participant list (require_session_owner) still require the owner. GET /presence returns only a count and an empty list.

(2) Re-read loop. In session-view.tsx the push re-read's .catch now runs `broadcastHealthy.current = false; gate.wanted = null;`. So when the backend rejects the read (5xx, 429 or network error), .finally finds nothing pending and does not reschedule. Only the 1.5 s poll keeps going. A forged push on the anon-writable channel (HP-33) therefore costs at most one backend read per participant. It can no longer start a retry loop when the backend is overloaded.

(3) One cycle. readiness.py now passes the resolved cycle_id into get_all_metrics, so the metric counts no longer mix ballots from past cycles.

Tests I ran:
- Frontend: ballot-themes 41/41 (it includes the new "drops the pending push so it never reschedules itself" gate), cube-sim-live 837/837, status-advance 10/10, mock-rankings 43/43, worker-api-routes 40/40.
- Backend: tests/cube1 and tests/cube7 gave 363 passed and 2 failed in test_sql_tally_parity. The failures came from my test environment, not the code. Different cases failed on each run with "No rankings found ... participant_count=0", which fits other reviewers running at the same time and truncating the shared local sim_parity database. Run against its own database (SIM_TEST_DSN=.../sim_parity_thor9), the parity file passes 9/9.

Every remaining risk under my lens is recorded in the backlog with an honest Needs:
- HP-30: Path C forgery (APPROVAL + Worker secret)
- HP-32: the claimable /api/sessions key (APPROVAL + Worker secret)
- HP-33: Supabase channels writable with the anon key (INFRA + APPROVAL)
- HP-34 and HP-31: the anonymous read bursts (CODE + INFRA)
- HP-25: the AI spend cap (INFRA + CODE)

I found no defect that is missing from the backlog. Scope 1–3 is operational under my lens.


Minor notes:
- The slowapi Limiter in backend/app/core/rate_limit.py:23 still sets no default_limits. The anonymous reads (GET /sessions/{id}, /code/{short_code}, /{id}/questions, /{id}/presence) have no per-IP cap; join has 100/min and create has 30/min. HP-34's edge cache covers the burst. A per-IP limit such as 120/minute on these reads would be cheap defence in depth.
- test_sql_tally_parity.py uses one fixed default database (sim_parity) and truncates it at the start of each proof. When several runs share one Postgres (parallel reviewers or CI shards), they collide and fail on unrelated cases. Defaulting the database name to include a per-run suffix (pid or uuid) would remove this false red.
- SessionRead is still returned to anonymous callers with created_by (the moderator's Auth0 subject) and seed. Neither is new; both were already public through /code/{short_code}. A slimmer public read schema would expose less.
- test_public_session_read decides whether a dependency is public by matching its name against substrings. An explicit allow-list (get_db, get_optional_current_user) would also catch a future auth dependency under a new name, such as get_current_principal.

### Odin (predictive / future-proof) — APPROVED

The one change I asked for last round is in the code. In frontend/components/session-view.tsx (line 746), applyPushedStatus's push re-read now ends with `.catch(() => { broadcastHealthy.current = false; gate.wanted = null; })`. When that read fails, the `.finally` check `if (gate.wanted) applyPushedStatus(...)` finds nothing pending, so the read does not reschedule itself and the 1.5 s poll takes back over. If a backend goes down, participants no longer re-ask it every second. A push that arrives while a read is in flight and then fails is dropped, but the poll picks it up, so nothing is lost. The gate is frontend/tests/ballot-themes.test.mjs line 86, an exact-source assertion, and I ran it: ballot-themes 41/41 passed and cube-sim-live 837/837 passed, both through their npm-script loader (plain `node --test` cannot resolve the @/lib alias). I also spot-checked the other round-8 folds. readiness.py line 89 passes cycle_id into get_all_metrics (and also into anomalies and replay). GET /{session_id}/questions takes only get_db, with no user check. tests/cube1/test_public_session_read.py passes. In tests/cube7/test_sql_tally_parity.py, test_anomaly_detection_sql_matches_python[11] failed twice for me, then passed on four `-k anomaly` reruns and three full-file runs. The likely cause is other reviewers running against the same database at the same time and truncating its tables mid-run, but I have not confirmed that. It does not affect production code, so I list it as minor. Under the predictive lens, scope 1–3 is operational and what remains is minor or already in the backlog (INFRA for real 1M runs, HP-34 for spreading reads).


Minor notes:
- tests/cube7/test_sql_tally_parity.py uses one fixed-name parity database and runs `truncate user_rankings, aggregated_rankings, participants, themes, sessions cascade` at the start of every proof (line 60). I saw test_anomaly_detection_sql_matches_python[11] fail twice: the SQL and Python paths agreed, but found 0 bursts, against the expected 37 or more. It then passed on four `-k anomaly` reruns and three full-file runs. Likely cause: other reviewers running against the same database at the same time and truncating its tables, not confirmed. Suggested fix: a database name unique to each run (pid or uuid suffix) or a transaction per test, so runs on one host cannot collide. a812b4f's backend CI flake may belong to the same class, which the new tail annotation in deploy.yml would help confirm.
- The anomaly fixture pins t0 = datetime(2026, 10, 7, 12, tzinfo=utc), which is today. The detection code does not depend on the current time, so this is fine now. A future change that filtered on now() would quietly empty the fixture, so a far-past fixed date would be safer.
- session-view.tsx catch path: a push that arrives while a read is in flight and then fails is dropped instead of retried. That is intended (the poll covers it), and the comment explains why. A short line in the backlog under HP-34 would record the trade-off for a reader at 1M scale.

### Enlil (implementation & build verification) — APPROVED

I approve. I re-ran the build myself on 00352e6 (/tmp/claude-0/wtm), read-only, and scope items 1–3 hold up.

Backend:
- The full suite gave 3430 passed, 66 skipped and 1 failure.
- The failure was tests/live_db/test_reopen_cycle.py (`ai run: 500`). I traced it with a handler swap kept in my scratch directory, never in the repo. The pipeline raised "Session … not found", and an earlier attempt hit asyncpg "connection was closed in the middle of operation". Both come from the harness: live_db/conftest.py runs `drop database if exists "{DB_NAME}" with (force)` on the fixed default DB `live_db_test`, and other reviewers running at the same time on the shared local Postgres were wiping it mid-run.
- Re-run on its own database name (LIVE_DB_DSN=…/enlil_r9_*), all 5 live_db tests pass, including the round-8 re-open proof. That proof shows metrics, readiness and scale-info all counting cycle 2's ballots. This matches the green backend CI.
- tests/cube1/test_public_session_read.py and all of cube7 pass (249 passed). tests/cube7/test_sql_tally_parity.py passes 9/9 against real Postgres.

Frontend gates (run through npm, which supplies the ts-alias-loader):
- cube-sim-live: 837/0.
- ballot-themes: 41/0.
- worker-api-routes: 40/0.
- tsc --noEmit with the CLAUDE.md filter: 0 errors.

1M harness: backend/scripts/sim_1m.py seed and bench at n=20000 on a scratch DB ran cleanly. Aggregate median was 0.203 s, peak memory 74 MB, and it printed a stable result_hash. I dropped my scratch DBs afterwards.

Round-8 fold checked in the code:
- readiness.py:89 passes cycle_id to get_all_metrics.
- session-view.tsx:746 is `.catch(() => { broadcastHealthy.current = false; gate.wanted = null; })`.
- cube1 router.py list_questions (around line 496) depends only on get_db.

Nothing I found under my lens is above minor.


Minor notes:
- tests/live_db/conftest.py drops and recreates one fixed database (default `live_db_test`) with `with (force)`. Two runs at once on the same Postgres, such as parallel reviewers or a local run during a CI-like job, wipe each other's database mid-test and give a false 500 in test_reopen_cycle.py. Adding a per-run suffix to DB_NAME (pid or uuid) would make the proof safe to run in parallel.
- app/core/exceptions.py generic_exception_handler returns a bare 500 and logs nothing itself. Starlette's ServerErrorMiddleware re-raises, so uvicorn still logs it in production. Under httpx ASGITransport(raise_app_exceptions=False) in the live_db harness, though, the traceback is lost, which made the failure above slow to trace. A logger.exception call in the handler would cost one line.
- Running a frontend gate directly as `node ... --loader ./tests/ts-ext-loader.mjs tests/cube-sim-live.test.mjs` fails with ERR_MODULE_NOT_FOUND. Only the npm scripts (ts-alias-loader) work. This is fine for CI, but worth saying in the gate headers for anyone reproducing by hand.

### Krishna (integration & cross-module) — APPROVED

Read-only review of 00352e6, from the integration side. I checked each of the three round-8 folds in the code where it crosses a module boundary.

1. **Odin's fold (session-view.tsx).** The push re-read's `.catch` is now `{ broadcastHealthy.current = false; gate.wanted = null; }`. So `.finally` finds no pending push and does not reschedule. The 1.5 s poll takes over because the healthy flag is cleared. The gate is in ballot-themes.test.mjs (41/0).

2. **Thoth's fold (Cube 7 cycles).** readiness.py:89 now calls `ranking_metrics.get_all_metrics(db, session_id, cycle_id)`. The signature `get_all_metrics(db, session_id, cycle_id: int | None = None)` passes the cycle to all three metric sets (system, user, outcome). Router /rankings/readiness resolves the cycle with `_resolve_cycle` before calling `readiness_profile`. /rankings/metrics and /rankings/scale-info resolve to the current cycle the same way, and scale-info filters `Ranking.cycle_id == cycle_id`. So every Cube 7 read now uses one cycle rule. None of these three endpoints has a frontend consumer or a SIM route, so they cannot drift from the SIM.

3. **Christo's fold (public participant reads).** GET /sessions/{id}/questions no longer depends on `get_current_user`. test_public_session_read.py now uses an explicit allow-list, `{"get_db", "get_optional_current_user"}`. That also closes Odin's earlier substring concern. I cross-checked its PARTICIPANT_READS list against every GET the participant pages actually make:
   - session-view.tsx:459/682/738 → /sessions/{id}
   - session-view.tsx:596 → /presence
   - join-flow.tsx:89/287 → /sessions/code/{code}
   - lib/api.ts:248 → /questions
   - lib/ballot-themes.ts:111 → /themes

   The list is complete. The writes (responses, voice, rankings, join) authorise with the participant token.

**Tests I ran:**
- **Frontend, all passing:** cube-sim-live 837, mock-rankings 43, ballot-themes 41, status-advance 10, sim-console 35, sim-console-driver 20, worker-api-routes 40, sim-live-source 55.
- **Backend:** tests/cube1, tests/cube7, test_log_event_keyword and tests/live_db, 369–371 of 371 passing per run. A different single test failed in each of my runs:
  - `test_sql_tally_parity[11]`
  - `test_openapi_sweep`
  - `test_sim_console_live`
  - `test_reopen_cycle`

  The live_db failure logged asyncpg `ConnectionDoesNotExistError` ('connection was closed in the middle of operation'). Other pytest processes were running against the same local Postgres while I tested, and the parity test truncates sessions at start. `test_sql_tally_parity` passed 9/9 when run alone. I read the failures as interference between concurrent runs in this shared sandbox, not a code defect, and backend CI is green on 00352e6.

Scope 1–3 is operational under my lens, and SIM and LIVE agree on the cycle rule and on public reads. The known gaps (HP-30/32/33/34) are recorded with honest Needs. What is left is minor, listed below.


Minor notes:
- Carried from round 8, still not recorded. phase_b._fetch_summaries (backend/app/cubes/cube6_ai/phase_b.py ~L59-82) filters ResponseMeta by session_id only. So when a cycle is re-opened, its themes are built from every cycle's answers, even though phase_b._replace_cycle_themes writes the themes per cycle. The SIM's /ai/run does the same, so this is not a parity defect. Whether a later cycle should be themed only from its own answers is the operator's call; it should be a DECISION row in the HP backlog or a docstring line, so it is not rediscovered as a bug.
- Dead client methods point at routes that do not exist. frontend/lib/api.ts:283-289: startTimeTracking POSTs `/time/start` and stopTimeTracking POSTs `/time/{id}/stop`, but the backend routes are `/sessions/{session_id}/time/start` and `/sessions/{session_id}/time/stop` (cube5_gateway/router.py:54/86). Nothing in components/ or app/ calls them today. If an SDK consumer or a future page uses them, they will 404. Fix the paths or delete the methods.
- Concurrent backend runs interfere through the shared local Postgres. test_sql_tally_parity truncates sessions/themes/participants 'cascade' on the database other tests also use (_DB). Two pytest processes on one machine (parallel reviewers, or a developer running suites side by side) therefore make the live_db tests fail at random. CI runs one process, so it is green. Giving the parity test its own database name, or its own schema, would make local runs deterministic.
- GET /rankings/metrics still takes no explicit cycle_id (it always reads the current cycle), while /readiness and /scale-info accept one. That is harmless, but it is a small asymmetry in the API surface.

### Enki (diversity & edge cases) — APPROVED

I checked all three round-8 folds in the code at 00352e6, and all three are done. Scope 1–3 is operational under my lens.

1. **The failed re-read no longer retries itself.** This was a minor note of mine last round and Odin's blocking item. In frontend/components/session-view.tsx:746 the catch now reads `.catch(() => { broadcastHealthy.current = false; gate.wanted = null; })`. The finally at :749 then has nothing to re-read, so a 5xx, a 429 or a dead backend hands back to the 1.5 s poll and does not loop.
2. **Readiness now counts one cycle.** backend/app/cubes/cube7_ranking/readiness.py:89 calls `ranking_metrics.get_all_metrics(db, session_id, cycle_id)`. Confidence, submissions, the sparse-data risk and human_authority now read the same cycle as the anomaly and replay signals. The router resolves that cycle at router.py:275.
3. **The questions read is public.** GET /sessions/{session_id}/questions (cube1 router.py:495-502) depends only on get_db.

Tests I ran at 00352e6:
- Backend: tests/cube1, tests/cube7 and tests/core, 475 passed.
- Frontend (through the npm scripts): ballot-themes 41/0, mock-rankings 43/0, status-advance 10/0, cube-sim-live 837/0.

A pushed stale status still cannot move the view backwards, because the backend's answer goes through statusAdvances. A forged push that repeats the current status only pauses the poll for about 8 s. The 1M read burst and the anon-writable channels are recorded honestly as backlog HP-33 and HP-34. The issues I still see are small edge cases, listed in minor_notes.


Minor notes:
- session-view.tsx:710-752: nothing cancels pushReadRef.current.timer when the component unmounts or sessionId changes. One stray GET /sessions/{id} and a setSession can still fire after the participant leaves. Since the failure loop is fixed, this is at most one extra read.
- session-view.tsx:742: a real push that carries the same status string as a read already in flight (for example a spoofed 'ranking', then the real 'ranking' mid-read) is cleared by `gate.wanted === wanted`. The poll recovers within the 8 s healthy window. A sequence counter instead of string equality would close the gap.
- session-view.tsx:740: the healthy check compares status only, not current_cycle. Harmless today because a re-open also changes the status.
- cube1 router.py:495 GET /{session_id}/questions does not check that the session exists. An unknown UUID returns [] instead of 404, unlike GET /{session_id}. It also returns every question regardless of session status, so the questions can be read before the poll opens. The read is anonymous now, so this is worth a deliberate choice.
- readiness_profile still defaults `cycle_id: int = 1` in its library signature. The router passes the resolved cycle, but a direct library caller gets cycle 1 rather than the current cycle.

### Thoth (data & analytics deep dive) — APPROVED

My round-8 ask is done in the code. backend/app/cubes/cube7_ranking/readiness.py:89 now calls `ranking_metrics.get_all_metrics(db, session_id, cycle_id)`. The router resolves the current cycle before it calls readiness_profile (router.py:276), GET /rankings/metrics (router.py:256) and scale-info (Ranking.cycle_id == cycle_id). cube7_ranking/metrics.py `_cyc()` filters Ranking, AggregatedRanking and GovernanceOverride by cycle. All three models carry cycle_id and have (session_id, cycle_id) indexes. backend/tests/live_db/test_reopen_cycle.py:111-118 asserts that metrics system.ranking_submissions == 3, readiness signals.ranking_submissions == 3, readiness metrics.system.ranking_submissions == 3 and scale-info voter_count == 3 after the re-open. deploy.yml runs tests/live_db against a Postgres service and fails the run if those tests are skipped (line 193). I grepped the cube7 ranking/aggregation/governance queries and every one I checked filters by cycle. Runs I did: backend tests/cube7 plus test_public_session_read gave 249 passed. Frontend test:cube-sim-live gave 837/0, test:ballot-themes 41/0, test:sim-console-driver 20/0 and test:mock-rankings 43/0. I did not run the live_db test myself (it needs a Postgres DSN), so for that one I am relying on CI being green on 00352e6. The open scale items (HP-29 index, HP-34 status-read burst, HP-32 edge key) are in the backlog with honest Needs. From a data and analytics view, scope 1–3 works.


Minor notes:
- backend/app/cubes/cube9_reports/metrics.py:63-67 and :103-107 count AggregatedRanking rows (is_final / is_top_theme2) with no cycle_id filter, and :60 counts Theme rows across the whole session. After a re-open, has_final_ranking and winner_determined in GET /reports/metrics (router.py:199) read true from cycle 1 before cycle 2 has been aggregated, and themes_available adds both cycles together. These are boolean or presence signals on a Dev-Sim metrics read, not ballot tallies, so this is minor. Fix: resolve the current cycle the same way Cube 7 does and pass it into the Cube 9 metrics, or log it in the backlog.
- The Cube 9 export path (service.py:616) already filters by cycle (`AggregatedRanking.cycle_id == cyc`), so the CSV and report summary agree with Cube 7. Only the metrics roll-up above does not.
- Backlog index note toward HP-29, (session_id, cycle_id, submitted_at, id) on user_rankings, is still only planned. That is honest under the 10M work.

### Athena (strategic test planning) — APPROVED

All three round-8 folds are in the code at 00352e6, and each has a gate that runs in CI. (1) Odin: frontend/components/session-view.tsx now has `.catch(() => { broadcastHealthy.current = false; gate.wanted = null; })`, so the trailing `.finally` re-read only fires for a push that is still pending after a successful read, and a rejected read hands back to the 1.5 s poll. frontend/tests/ballot-themes.test.mjs:86 pins this exact line. (2) Thoth: readiness.py:89 passes `cycle_id` into `get_all_metrics`. backend/tests/live_db/test_reopen_cycle.py:112-118 asserts that /rankings/metrics system.ranking_submissions, /readiness signals and metrics, and /scale-info voter_count all equal 3 in cycle 2. deploy.yml:193 fails CI if a live_db test is skipped. (3) Christo: GET /sessions/{id}/questions (cube1 router:495) has no auth dependency, and test_public_session_read.py lists it among the five participant reads. The new CI step (deploy.yml:186-187) annotates the log tail when a run ends with no FAILED or ERROR line, which closes the gap that hid the a812b4f flake. I ran the tests myself on this commit: backend tests/cube1, tests/cube7 and tests/core gave 475 passed; frontend ballot-themes 41/0, mock-rankings 43/0, cube-sim-live 837/0 and status-advance 10/0. All four frontend suites are part of test:ci. As a test plan, every claim from this round has a matching runtime or source gate in CI, SIM and LIVE parity is still enforced by cube-sim-live, and the remaining scale and security risks (HP-30 to HP-34) are in the backlog with honest Needs. Scope 1–3 is operational under my lens. What remains is minor.


Minor notes:
- session-view.tsx applyPushedStatus .catch: `gate.wanted = null` also drops a different push that arrived while the failed read was in flight. Recovery still comes from the 1.5 s poll, because broadcastHealthy is cleared, so the cost is at most one poll interval. A sequence counter would make this exact.
- Krishna's round-8 note is still not recorded: phase_b._fetch_summaries filters ResponseMeta by session_id only, so a re-opened cycle is themed from cycle-1 and cycle-2 answers together, in both SIM and LIVE. SIM and LIVE agree, so this is not a parity defect. It is an operator DECISION and should be added to the backlog as one.
- ballot-themes.test.mjs:86 matches the exact source text of the .catch. That stops a regression, but harmless reformatting will also break it. A behavioural test (mock api.get rejecting, then assert no second call) in status-advance would test the invariant rather than the spelling.
- The pending gate.timer in applyPushedStatus is still not cleared on unmount or when sessionId changes, so after a participant leaves the page one stray read can still fire.
- GET /rankings/metrics still takes no cycle_id query param, unlike the other cycle endpoints, so a past cycle's metrics cannot be read. It is correct by default.

### Christo (consensus & user-flow) — APPROVED

My round-8 ask is done. GET /sessions/{session_id}/questions in backend/app/cubes/cube1_session/router.py (lines 495-502) now depends only on get_db, with no get_current_user. backend/tests/cube1/test_public_session_read.py lists all five participant reads: session by id, session by code, questions, presence and themes. For each route it reads the endpoint signature and fails if any dependency is something other than get_db or get_optional_current_user. It also checks that app.openapi() serves every one of them under PREFIX. 3 passed.

I checked that list against the GETs the participant client actually makes: session-view.tsx lines 459/682/738 (/sessions/{id}) and 595 (presence), join-flow.tsx lines 89/287 (/sessions/code/{code}), and lib/ballot-themes.ts line 111 (/sessions/{id}/themes). All of them are covered. The participant writes need no login: POST responses calls require_participant_identity, and POST /rankings uses get_optional_current_user plus a verified X-Participant-Token. So a joiner with no account can move from join to answer to vote while Auth0 is on.

Checks I ran:
- backend tests/cube1 + tests/cube7: 365 passed.
- npm run test:cube-sim-live: 837 passed, 0 failed.
- npm run test:ballot-themes: 41 passed, including Odin's fix where a failed re-read clears gate.wanted.

Under my lens, every participant read and write is open to an anonymous joiner and gated in CI.


Minor notes:
- PARTICIPANT_READS in test_public_session_read.py is a hand-kept list. If the client adds a new participant GET, the gate only covers it once someone adds the path to that list. A later step could build the list from the frontend's api.get calls.
- Running node --test on cube-sim-live.test.mjs or ballot-themes.test.mjs directly fails with ERR_MODULE_NOT_FOUND because the ts-alias loader is missing. Only the npm run test:* scripts run them correctly. This affects how the tests are run, not the product.

### Aset (consistency validation) — NOT_APPROVED

The round-8 folds hold under my consistency lens. The push re-read now stops itself on a failed read and hands back to the poll. Readiness, metrics and scale-info all count the resolved cycle. Every participant read (session by id, by code, questions, presence, themes) is public and uses the same SessionRead shape. SIM and LIVE agree on cycle-keyed theming, and the frontend and backend gates are green. One member of the 'one cycle everywhere' class is still open and is not in the backlog: Cube 9's GET /reports/metrics (cube9_reports/metrics.py) counts Theme and AggregatedRanking rows across every cycle. After a re-open it reports has_final_ranking and winner_determined from cycle 1 while cycle 2 is still being voted, which contradicts Cube 7's metrics for the same session. Scoping it with the existing `_report_cycle`, or recording it in the backlog with its Needs, would earn my approval. The other leftovers are minor.

- **Required:** Make GET /reports/metrics count one cycle, like every other ranking read. In backend/app/cubes/cube9_reports/metrics.py, filter the Theme count (get_system_metrics), the AggregatedRanking is_final count (get_system_metrics) and the AggregatedRanking is_top_theme2 count (get_outcome_metrics) by the cycle that cube9_reports/service.py `_report_cycle(session_id)` already resolves. Then add GET /reports/metrics to the assertions in backend/tests/live_db/test_reopen_cycle.py. The alternative is to record this as a backlog item with its Needs.
  - File: `backend/app/cubes/cube9_reports/metrics.py`:60
  - Evidence: Lines 59-67 count `select(func.count()).select_from(Theme).where(Theme.session_id == session_id)` and `AggregatedRanking.session_id == session_id, AggregatedRanking.is_final.is_(True)` with no cycle_id filter, and lines 101-106 do the same for `is_top_theme2`. router.py:199 serves it as `reports_metrics.get_all_metrics(db, session_id)` with no cycle. Theme.cycle_id (models/theme.py:20) and AggregatedRanking.cycle_id (models/ranking.py:51) both exist, and service.py:77 `_report_cycle` is already used by the CSV and analytics paths (service.py:604, 756). The backlog file has no entry for it: grep for cube9/metrics finds only HP-16 and HP-17.
  - Why it blocks: Round 8's Thoth fold treated 'readiness counts every cycle' as blocking and claimed one cycle everywhere. This endpoint is the last member of that same class. After a re-open, while cycle 2 is still being voted, it reports has_final_ranking=true and winner_determined=true from cycle 1 and sums both cycles' themes. So Cube 9's report metrics disagree with Cube 7's /rankings/metrics and /rankings/readiness for the same session. I raised it in rounds 6, 7 and 8. It is still unlisted, and under the acceptance bar an unlisted defect blocks approval (CLAUDE.md: fix the class, never the instance).

Minor notes:
- frontend/lib/mock-data.ts:883-884 still says 'an earlier cycle's ids are refused', but lib/sim-console.ts:210 builds theme ids as `th-${stance}...` with no cycle in them. Once cycle 2 is themed in SIM, a cycle-1 ballot is accepted, while LIVE refuses it because cycle 2 gets new UUIDs. Either add the cycle to the SIM ids or reword the comment.
- frontend/components/session-view.tsx:735: the pending gate.timer from applyPushedStatus is never cleared on unmount or when sessionId changes, unlike the interval cleanup elsewhere in the component. In practice statusAdvances gates the setSession call, so it is harmless.
- The round-8 folds are verified and agree with each other. session-view.tsx:746 `.catch(() => { broadcastHealthy.current = false; gate.wanted = null; })` leaves the 1.5 s poll as the only retry path. readiness.py:89 passes cycle_id to get_all_metrics. cube1 router list_questions has no get_current_user dependency, matching GET /sessions/{id} and /code/{short_code}.
- Gates I re-ran on 00352e6, all green: ballot-themes 41/0 and mock-rankings 43/0 (run through the npm scripts; a bare `node --test` fails on the @/ alias, which is expected), and backend tests/cube1, tests/cube7 and tests/cube9: 470 passed.

### Asar (synthesis & outcome) — APPROVED

I approve. Looking at the whole round, all three round-8 objections are fixed in the code at 00352e6, and I found no new defect that is missing from the backlog.

(1) Odin's ask is fixed. In frontend/components/session-view.tsx:746 the catch now reads `.catch(() => { broadcastHealthy.current = false; gate.wanted = null; })`, so the .finally at :749 cannot reschedule a read after it fails. The 1.5 s poll takes over again.

(2) Thoth's ask is fixed. backend/app/cubes/cube7_ranking/readiness.py:89 now passes the cycle: `ranking_metrics.get_all_metrics(db, session_id, cycle_id)`.

(3) Christo's ask is fixed. GET /sessions/{session_id}/questions (cube1_session/router.py:495) has no get_current_user dependency.

Tests I ran:
- Full backend suite: 3431 passed, 66 skipped, 0 failed (ENVIRONMENT=test).
- Frontend gates: cube-sim-live 837/0 (Cubes 1–9 give the same result in SIM and LIVE), ballot-themes 41/0, mock-rankings 43/0, status-advance 10/0.

Scope 1–3 is operational in the repo. The APIs and both modes work; HP-21 (a full LIVE Admin Console run) is fixed. The 1M SQL tally (HP-05) has a parity gate. The remaining gaps for 1M on the live site are each listed honestly in the backlog with a correct Needs:
- HP-01, HP-02, HP-04 and HP-12 need APPROVAL, because they touch the protected Trinity files.
- HP-03, HP-06, HP-09, HP-10 and HP-13 need INFRA or a DECISION.
- HP-30 to HP-34 cover status and Path C forgery and the read bursts.

HP-26 is still CODE and open. It covers per-stage performance rows, the summary-before-Theme02 row and a run hash; I checked with grep and StageMeter/run_hash appear nowhere. HP-27, the AI-method selector, is also open and recorded, with the offline-provider guard already built. Because both are recorded in the backlog, they do not block approval.


Minor notes:
- session-view.tsx:746 — clearing gate.wanted in the catch also drops a push that arrived while that failed read was running. The 1.5 s poll covers it, so the only cost is a delay of up to 1.5 s.
- HP-26 (StageMeter per-stage rows + run_hash) is the main open synthesis item. Until it ships, the 1M evidence is the aggregation timing alone (sim_1m.py), with no timing for Phase A summaries 333/111/33 or Theme01/Theme02 9→6→3. It should come next once the operator confirms the current SHA is LIVE.
- Round 8's record still lists Thor's minor notes (no per-IP limit on the anonymous GET /sessions reads; SessionRead exposes created_by and seed). Neither has been folded into HP-34's text. Adding one line there would keep the backlog complete.
- 'Financial cloud e2e' and 'Supabase Preview' are red on every recent SHA. They are outside Cubes 1–10, but no backlog item records them, so the operator could read them as a regression from this loop.

### Pangu (cutting-edge) — APPROVED

I reviewed 00352e6 read-only and approve it: scope 1–3 is operational under the Pangu lens. I checked all three round-8 fixes in the code and each has a gate.
(1) Odin: frontend/components/session-view.tsx:745 is now `.catch(() => { broadcastHealthy.current = false; gate.wanted = null; })`. A rejected re-read therefore goes back to the 1.5 s poll and does not reschedule itself. The .finally only fires a trailing read when a new push set gate.wanted after the failure. Gate: ballot-themes.test.mjs:86.
(2) Thoth: readiness.py:89 now calls `get_all_metrics(db, session_id, cycle_id)`. live_db/test_reopen_cycle.py:112-118 asserts that /rankings/metrics, /rankings/readiness (signals and metrics.system) and /rankings/scale-info each count cycle 2's three ballots after the re-open.
(3) Christo: GET /sessions/{id}/questions (cube1 router:495) is public. test_public_session_read.py now uses an explicit allow-list, ALLOWED = {get_db, get_optional_current_user], so a renamed auth dependency cannot slip past it. That closes Odin's round-8 minor note. The test also checks that app.openapi() serves all five participant reads under /api/v1.
Runs I did myself: ballot-themes 41/0, mock-rankings 43/0, cube-sim-live 837/0; backend tests/cube7 + test_public_session_read + test_log_event_keyword 250 passed. SIM and LIVE agree on per-cycle themes and ballots. The remaining 1M-scale risks (Path C forgery, the claimable write key, anon-writable channels, and the GET /sessions/{id} and /themes read bursts) are in the backlog as HP-30 to HP-34 with honest Needs. I found no new defect in scope that is missing from the backlog.


Minor notes:
- session-view.tsx:710-750: no effect cleanup clears pushReadRef.current.timer on unmount or when sessionId changes. One stray GET /sessions/{id} and a setSession on an unmounted component can still fire. It no longer loops because a failure now clears wanted, so it is harmless, but it should be tidied.
- backend/app/cubes/cube6_ai/phase_b.py:_fetch_summaries filters ResponseMeta by session_id only, so a re-opened cycle is themed from every cycle's answers. The SIM's /ai/run does the same, so SIM and LIVE agree. Whether a later cycle should be themed only from its own answers is an operator DECISION and is not yet a backlog line. Worth recording.
- session-view.tsx:741: the confirm check compares status only, not current_cycle. A forged push that repeats the current status can pause the poll for up to 8 s. Each push also triggers a backend read, so the only cost is read cadence (already in HP-33's scope).
- The 1.5 s checkStatus poll still has no backoff on consecutive failures. HP-34 covers it, but a capped client-side backoff would remove most of the outage-time load cheaply.
- GET /rankings/metrics takes no explicit cycle_id query parameter, unlike the sibling Cube 7 reads, so a past cycle's metrics cannot be read back. It is correct by default.

### Sofia (multi-perspective) — APPROVED

I reviewed 00352e6 from three seats: participant, moderator and operator. All three round-8 folds are in the code, and I checked each one there.

1. **Participant (Odin's ask).** In frontend/components/session-view.tsx, applyPushedStatus's `.catch(() => { broadcastHealthy.current = false; gate.wanted = null; })` clears the trailing-read request. So when a re-read fails, the 1.5 s poll takes over and the read does not reschedule itself.
2. **Operator and data (Thoth's ask).** backend/app/cubes/cube7_ranking/readiness.py:89 now calls `ranking_metrics.get_all_metrics(db, session_id, cycle_id)`. backend/tests/live_db/test_reopen_cycle.py:112-118 asserts that /rankings/metrics, /rankings/readiness (both signals and metrics) and /rankings/scale-info each count 3 ballots in cycle 2.
3. **Participant journey (Christo's ask).** GET /{session_id}/questions (cube1 router.py:495) has no auth dependency, the same as the other participant reads.

Gates I ran:
- Frontend: ballot-themes 41/0, cube-sim-live 837/0, mock-rankings 43/0.
- Backend: tests/cube1, tests/cube7 and test_log_event_keyword, 366 passed.

SIM and LIVE still follow the same cycle rule. The scale and security leftovers are recorded honestly in the backlog: HP-30 to HP-32 need APPROVAL plus a Worker secret, HP-33 needs INFRA plus APPROVAL, and HP-34 needs CODE plus INFRA.

Under my lens, scope 1–3 is operational and nothing I found outside the backlog blocks approval. The remaining items are minor and listed in minor_notes.


Minor notes:
- session-view.tsx applyPushedStatus .catch: clearing gate.wanted also drops a real push that arrived during the failed read. The 1.5 s poll recovers it, because broadcastHealthy is cleared, so the cost is a delay of about 1.5 s at most. That is acceptable, but the HP-33/HP-34 text could say so.
- Krishna's round-8 note is still not in the backlog. In both modes, a re-opened cycle is themed from every cycle's answers: phase_b._fetch_summaries filters by session_id only, and SIM /ai/run uses all of mockResponses[sid]. This is not a parity defect, but whether to theme each cycle on its own answers is an operator choice that should be listed as a DECISION.
- The gate.timer in applyPushedStatus is still not cleared on unmount or when sessionId changes, so one stray GET /sessions/{id} can fire after the participant leaves. Harmless.
- GET /rankings/metrics always uses the current cycle and takes no cycle_id query param, unlike its sibling endpoints. It is correct by default but inconsistent with them, and a past cycle's metrics cannot be read.
- The confirm check in applyPushedStatus (`fresh.status === wanted`) compares status only, not current_cycle. This is harmless today because a re-open always changes the status as well.
