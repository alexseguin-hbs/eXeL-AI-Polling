# 12-AsM alignment — round 10 (2026-10-07, code at 695ecc1, LIVE: Verify Live #2614)

**Approved: 7 / 12** (Thor, Odin, Thoth, Athena, Christo, Asar, Pangu). Means: Security 91.3 · Stability 90.6 · Scalability 90 · Efficiency 91.1 · Succinctness 89.9

Trend (approvals): 0 → 10 → 8 → 12 → 9 → 6 → 2 → 9 → 11 → 7. Succinctness dipped to 89.9, below 90 for the first time since round 7.

**The drop is on me.** Round 9's Cube 9 fix compared `Theme.cycle_id` with the report cycle, and the report cycle is NULL until someone votes. Every themed-but-unvoted session, a state every session passes through, then reported `themes_available = 0`, where the old session-wide count had been right. My live-database test only checked after aggregation, and the unit test mocks the query, so neither caught it. Four lenses (Enlil, Krishna, Enki, Aset) and Sofia found it independently.

**Correction of the round-9 record.** Round 9 said the report metrics stop "reporting cycle 1's winner while a re-opened cycle 2 was still being voted". That was not true. Until cycle 2 is aggregated, the report cycle is still cycle 1, so the report shows cycle 1's finished result, exactly as the CSV does. This round's docstring states it plainly (Sofia, Enki).

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Odin (predictive / future-proof) | APPROVED | 90 | 92 | 88 | 90 | 90 |
| Enlil (implementation & build verification) | NOT_APPROVED | 92 | 89 | 91 | 92 | 91 |
| Krishna (integration & cross-module) | NOT_APPROVED | 91 | 89 | 90 | 91 | 89 |
| Enki (diversity & edge cases) | NOT_APPROVED | 92 | 87 | 90 | 91 | 90 |
| Thoth (data & analytics deep dive) | APPROVED | 91 | 92 | 90 | 92 | 90 |
| Athena (strategic test planning) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Christo (consensus & user-flow) | APPROVED | 92 | 92 | 90 | 91 | 90 |
| Aset (consistency validation) | NOT_APPROVED | 92 | 90 | 91 | 91 | 89 |
| Asar (synthesis & outcome) | APPROVED | 91 | 92 | 90 | 91 | 91 |
| Pangu (cutting-edge) | APPROVED | 91 | 92 | 90 | 91 | 89 |
| Sofia (multi-perspective) | NOT_APPROVED | 91 | 88 | 90 | 91 | 90 |

## Folded after this round

- **Report metrics, themed but unvoted (Enlil, Krishna, Enki, Aset, Sofia).** `cube9_reports/metrics.py` counts themes in the report cycle, falling back to the newest themed cycle when nobody has voted. The final ranking and the winner keep the report cycle. `tests/live_db/test_reopen_cycle.py` now calls GET /reports/metrics after theming and before the first ballot, in both cycles, and asserts the theme count equals the themes served. In cycle 1 it also asserts there is no result yet; after the re-open it asserts the previous cycle's result is still shown.
- **Theming read every cycle's answers (Krishna, carried since round 8).** `cube6_ai/phase_b._fetch_summaries` reads only the current cycle's ResponseMeta, so a re-opened round is themed from its own answers. The live-db test asserts cycle 2's Theme01 counts sum to cycle 2's answers, not both cycles'. The SIM does the same (`simCycleResponses`, with a new check in mock-rankings).
- **Time-tracking client methods called paths the backend never served (Krishna, carried since round 8).** `lib/api.ts` startTimeTracking / stopTimeTracking now call `/sessions/{id}/time/start|stop` with the join-issued participant token. **The class:** `backend/tests/core/test_frontend_client_paths.py` reads every `api.*` and `request()` call in the frontend and requires the backend to serve it, so a drifted client path fails CI. It found one more path: the dashboard's session delete (`DELETE /sessions/{id}`, no backend route). That one is an operator decision, recorded as **HP-35** (APPROVAL + CODE), and it is the only allow-listed gap.
- **Cheap ones folded:**
  - Cube 9 user metrics count participants in SQL instead of loading every row (Sofia).
  - Per-run test databases left by a killed run are swept, and a failed admin connection no longer skips the rest (Thor, Odin, Enlil, Enki, Sofia).

## What each lens said (verbatim)

### Thor (risk & security stress) — APPROVED

Thor lens, round 10, checked on 695ecc1. I approve: scope 1–3 works, and every issue left under my lens is either minor or recorded in the backlog.

Tests run myself:
- Backend, full suite (ENVIRONMENT=test, no LIVE_DB_DSN or SIM_TEST_DSN set): 3431 passed, 66 skipped, 0 failed.
- Real-Postgres proofs (tests/live_db and tests/cube7/test_sql_tally_parity.py) on their own per-run databases: 14 passed.
- Frontend gates: cube-sim-live 837/0, mock-rankings 47/0, ballot-themes 42/0, worker-api-routes 40/0, sim-console-driver 20/0, embed-webc 23/23. ai-core, tmp-core, notify-core and donate-core all exited 0.

The round 9 changes, read for risk:
1. GET /reports/metrics (backend/app/cubes/cube9_reports/router.py:186-199) still requires require_session_owner("moderator","admin",leads_read=True), so the access rule did not loosen. metrics.py now filters Theme and AggregatedRanking by cycle_id through service._report_cycle. That filter is built with SQLAlchemy, not string-built SQL. Each function still catches DB errors and returns zeros with metrics_unavailable rather than a 500.
2. backend/tests/own_db.py: the per-run database name comes from the process id and the default DSN only, not from user input. drop_owned drops only the databases this process created. An explicit DSN (CI) is used as given and never dropped.
   - The fix works: another reviewer's pytest (pid 26293) was running at the same moment with its own live_db_test_26293 and sim_parity_26293 databases, and my run neither touched them nor was touched by them.
3. The mock-data.ts change (each themed re-opened SIM cycle gets its own theme ids) and the session-view.tsx timer cleanup both lower risk: a cycle-1 ballot is now refused in themed cycle 2 in SIM as in LIVE.

Worker surface spot check: functions/api/responses.js still enforces a per-IP 429 (line 111), 3333-character text and summary caps with 413 (lines 120-123), and a 500-entry KV cap (line 153). sessions.js keeps its 429 at line 165.

Remaining scale risks are honest in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md: section A (the live site cannot serve 1M today, marked INFRA) and the quadratic Borda note (needs a stake-weighted SQL tally).

Minor notes are listed separately; none blocks approval.


Minor notes:
- backend/tests/own_db.py drop_owned only runs from pytest_sessionfinish, so a run killed with SIGKILL or the CI timeout leaves its <name>_<pid> database behind. This is test-only hygiene; a periodic cleanup of stale *_<pid> databases whose pid is no longer alive would close it.
- own_db.drop_owned uses 'return' on a failed admin connect, which skips any remaining owned databases rather than continuing to the next one. This is harmless today (one admin DSN) but brittle if a second default host is added.
- The CORS header 'Access-Control-Allow-Origin: *' on functions/api/responses.js, sessions.js and drone-link.js is intentional for cross-device SIM and the embed. It is acceptable because those endpoints have per-IP rate limits and size caps and carry no credentials, but the reason is not stated beside the header.

### Odin (predictive / future-proof) — APPROVED

Round 10, Odin (predictive / future-proof) lens, at 695ecc1. I checked all four Round 9 fixes and approve.

(1) Report metrics: backend/app/cubes/cube9_reports/metrics.py now counts themes, final ranking and winner in one cycle, chosen by service._report_cycle (the newest aggregated cycle, else the newest with ballots). CSV and analytics read the same cycle. Responses, participants and CQS stay session-wide, so a re-opened session will not report cycle 1's winner while cycle 2 is still being voted. A future multi-cycle session keeps one cycle across report, export and metrics.

(2) SIM theme ids: frontend/lib/mock-data.ts simThemesForCycle gives re-opened cycles the prefix `c{cycle}-` on theme and parent ids. Cycle 1 ids stay byte-identical, so replay and driver hashes for a single round do not change. A cycle-1 ballot is now refused in themed cycle 2, as in LIVE.

(3) Re-read timer: session-view.tsx clears the pending re-read timer on unmount or session change. The ballot-themes gate covers it.

(4) Test databases: backend/tests/own_db.py gives each run its own database named <name>_<pid> when no DSN is set, and conftest pytest_sessionfinish drops it. I saw this work: during my run another reviewer's live process (pid 24100) had its own live_db_test_24100 database and the two runs did not collide. My own per-run database was gone afterwards.

Checks I ran (all green):
- Backend, ENVIRONMENT=test, no DSN set: tests/cube9, tests/cube7/test_sql_tally_parity.py and tests/live_db, 119 passed against real Postgres.
- Frontend: cube-sim-live 837/0, mock-rankings 47/0, ballot-themes 42/0, sim-console-driver 20/0, sim-parity 3/3, worker-api-routes 40/0.

Remaining known risks are recorded honestly in the backlog: the A-section 1M INFRA blockers, quadratic Borda loading every ballot at 1M, and the user_rankings index planned for HP-29 (10M). Scope 1–3 is operational under this lens. What is left is minor.


Minor notes:
- backend/tests/own_db.py drop_owned: when the connection fails, the code returns (`except Exception: return  # no Postgres`). That skips any remaining _OWNED entries. Today it is harmless because both entries use the same host, but `continue` would hold if the two DSNs ever point at different hosts.
- own_db per-pid databases are dropped only at pytest_sessionfinish. A run killed with SIGKILL or a timeout leaves `<name>_<pid>` behind, and pid reuse later picks it up because the proofs drop or truncate their database first, so it is safe. Still, orphans pile up on a long-lived dev Postgres; a startup sweep of `_<pid>` databases whose pid is dead would keep it clean.
- cube9 metrics get_system_metrics and get_outcome_metrics each work out _report_cycle in separate statements, with no shared snapshot. A re-open landing between the two calls in get_all_metrics could report themes from one cycle and the winner from another. This is a rare, short window; working out the cycle once, or reading in a single REPEATABLE READ transaction, would close it.
- The SIM cycle prefix (`c{cycle}-`) changes theme ids for cycle 2 and later only. Any future persisted SIM fixture that captured cycle-2 ids before 695ecc1 would no longer match. None was found in the repo; worth remembering if SIM replays across cycles are ever saved.

### Enlil (implementation & build verification) — NOT_APPROVED

I checked commit 695ecc1 in /tmp/claude-0/wtm. Everything I ran passed:
- Full backend suite (ENVIRONMENT=test, no DSN variables set): 3431 passed, 66 skipped, 0 failed in 164 s.
- Real-Postgres proofs (tests/live_db plus tests/cube7/test_sql_tally_parity.py), run with no DSN set: 14 passed on per-run databases.
- After that run, none of my per-pid databases were left in pg_database. The databases still listed (sim_parity, live_db_test, sim_parity_pangu, sim_parity_thor9) belong to the old fixed names or other reviewers. So tests/own_db.py plus pytest_sessionfinish work as described.
- Frontend gates: cube-sim-live 837/0, mock-rankings 47/0, ballot-themes 42/0, worker-api-routes 40/0.
- Filtered tsc --noEmit: 0 errors.

The round-9 folds hold up when I read them:
- mock-data simThemesForCycle prefixes ids only for cycle 2 and later, so cycle-1 replay hashes are unchanged.
- The session-view timer cleanup is gated.
- The cycle-scoped final-ranking and winner counts in metrics.py match what the CSV and analytics read after a re-open.

One defect blocks my approval. It is new in this round and not in the backlog. The theme count in GET /reports/metrics now filters on `Theme.cycle_id == _report_cycle(...)`, and `_report_cycle` is `coalesce(max aggregated cycle, max ballot cycle)`. That value is NULL until the first ballot, so a session that has been themed but not yet voted on reports themes_available 0. I confirmed the NULL-comparison behaviour on Postgres. No test covers that state: the live test runs after aggregation and the unit test mocks the database.

Fixing it with a fallback and adding one live_db assertion would earn my approval. Apart from that, under my lens scope 1–3 is operational and the build is green.

- **Required:** Give the report-cycle rule a fallback for a themed session that has no ballots and no aggregation yet, so themes_available counts the themes that exist (for example coalesce(newest_agg, newest_ballot, max(themes.cycle_id) or sessions.current_cycle) in a metrics-only helper, or fall back inside metrics._cycle). Add a live_db assertion that GET /reports/metrics after /ai/run and before the first ballot reports themes_available equal to the theme count.
  - File: `backend/app/cubes/cube9_reports/metrics.py`:77
  - Evidence: Round 9 changed the theme count to `Theme.session_id == session_id, Theme.cycle_id == cyc` (metrics.py:77), where cyc = service._report_cycle(session_id) = `func.coalesce(newest_agg, newest_ballot)` (service.py:86-88). Both subqueries are MAX over aggregated_rankings/rankings, so they are NULL until the first ballot, and `cycle_id = NULL` matches no rows. I checked this on the local Postgres: `select count(*) from (values (1)) t(c) where c = coalesce((select max(x) from (select 1 x where false) s), null::int)` returns 0. Before 695ecc1 the same query counted every theme in the session. The only live test (test_reopen_cycle.py:121) runs after cycle 2 is aggregated, and tests/cube9/test_metrics.py:47-51 mocks db.execute, so neither covers this state. The backlog has no entry for it (grep for reports/metrics, themes_available and 'report cycle' in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md finds nothing).
  - Why it blocks: This defect is new in this round and is not in the backlog, and it sits in an API under scope 1 (every API works). In the normal state between AI theming and the first vote, the Cube 9 System metric that Cube 10 Dev-Sim baselines on reports 0 themes when 9 or more exist, so a baseline taken at that point is wrong. The fix is small, but it changes what the endpoint returns.

Minor notes:
- own_db.drop_owned returns on the first connection failure instead of continuing the loop. The two owned databases share one admin DSN, so this is harmless today.
- own_dsn adds an _OWNED entry each time it is called. It is called once per module import today. If it were called repeatedly, drop would just run a no-op 'if exists' again.
- Under `drop database ... with (force)` there is a PG13+ requirement, and nothing documents it. CI sets explicit DSNs, so CI never reaches this path.
- The cycle_id parameter on get_system_metrics and get_outcome_metrics is not exposed by GET /reports/metrics (router.py:199 calls get_all_metrics(db, session_id)). Default behaviour is fine, but there is no way to ask for an earlier cycle through the API.
- tests/cube9/test_metrics.py::test_system_counts mocks db.execute in order, so it does not exercise the cycle filter at all. Only the live_db reopen test proves the cycle scoping.

### Krishna (integration & cross-module) — NOT_APPROVED

Round 10 Krishna review of 695ecc1: not approved, with two required changes. The round-9 folds hold at their module boundaries. SIM theme ids are now per cycle, the push re-read timer is cleared, and each test run gets its own database. Every gate I ran passes (backend 119, frontend 47/42/837/40). Two unrecorded integration defects remain. (1) The new Cube 9 metrics change introduced a regression: the theme count now follows _report_cycle, which only rankings define. A themed session with no ballots yet therefore compares Theme.cycle_id to NULL and reports themes_available = 0, and a re-opened cycle 2 that is themed but unvoted reports cycle 1's count. The new tests assert only the state after aggregation. (2) lib/api.ts startTimeTracking and stopTimeTracking call /time/start and /time/{id}/stop. Those routes don't exist (the backend has /sessions/{id}/time/start and /time/stop), and the client attaches no participant token for them. I raised this twice as minor, and it is still neither fixed nor in the backlog. Fix both, or put item 2 in the backlog as an HP row with Needs, and I would approve. Scope 1–3 is otherwise operational under my lens.

- **Required:** Choose the cycle for the Cube 9 theme count so that a themed but not yet ranked session reports its themes. For example, fall back to the newest Theme.cycle_id (or session.current_cycle) when there is no ballot or aggregation, instead of comparing Theme.cycle_id to NULL. Add a live_db or unit assertion that GET /reports/metrics shows themes_available > 0 after /ai/run and before the first ballot.
  - File: `backend/app/cubes/cube9_reports/metrics.py`:76
  - Evidence: get_system_metrics now filters `Theme.session_id == session_id, Theme.cycle_id == cyc`, where cyc = `_cycle(session_id, None)` = service._report_cycle, which is `func.coalesce(newest_agg, newest_ballot)` (service.py:86-88). Both subqueries are MAX over AggregatedRanking/Ranking. Once theming has finished but nobody has voted, both are NULL, so the filter becomes `cycle_id = NULL`. That matches no rows and themes_available drops to 0. Before 695ecc1 the same call returned the session's theme count. After a re-open, while cycle 2 is themed but has no ballots, it reports cycle 1's theme count, even though GET /themes serves cycle 2. The new test (test_reopen_cycle.py:121) checks only the state after aggregation. tests/cube9/test_metrics.py mocks db.execute, so neither test would catch this.
  - Why it blocks: This round introduced the regression and it is not in the backlog. A Cube 9 API (scope 1) now gives a wrong count in the state every session passes through (themed, voting open). It also breaks this fold's own claim of one report-cycle rule: the CSV takes its themes from responses and filters only rankings by _report_cycle, whereas metrics now filters themes by a cycle that is defined only by rankings.
- **Required:** Fix or delete the two time-tracking client methods. Point them at `/sessions/${sessionId}/time/start` and `/sessions/${sessionId}/time/stop` (stop takes {time_entry_id} in the body), and have participantTokenFor attach X-Participant-Token for those paths. If you don't fix them, remove them from the API client. Alternatively, record it as an HP row with Needs.
  - File: `frontend/lib/api.ts`:283
  - Evidence: `startTimeTracking: ... request<{ id: string }>("POST", `/time/start`, ...)` and `stopTimeTracking: (timeEntryId) => request("POST", `/time/${timeEntryId}/stop`)`. The backend OpenAPI (151 paths, from app.openapi()) has only /api/v1/sessions/{session_id}/time/start and /api/v1/sessions/{session_id}/time/stop, and stop takes TimeEntryStop.time_entry_id in the body (cube5_gateway/router.py:85-110). The participantTokenFor regex at api.ts:71 is `/^\/sessions\/([^/]+)\/(responses|voice|rankings)$/`, so even with corrected paths the request would carry no participant token, and _time_participant would return 404 'Join the session before tracking time'. I raised this in rounds 8 and 9 as minor. It has been neither fixed nor recorded: there is no grep hit for TimeTracking or time/start in the HP backlog.
  - Why it blocks: Scope 1 is 'every API works'. lib/api.ts is the typed client that the SDK roadmap wraps, and these two methods are guaranteed to 404 against the LIVE backend. It is an unlisted defect, carried through two rounds without a fix or a backlog row.

Minor notes:
- Carried from rounds 8 and 9 and still not recorded: phase_b._fetch_summaries (backend/app/cubes/cube6_ai/phase_b.py:59-82) filters ResponseMeta by session_id only, although ResponseMeta has cycle_id (models/response_meta.py:27). So a re-opened cycle's themes are built from every cycle's answers, while _replace_cycle_themes writes them per cycle. The SIM behaves the same way, so SIM and LIVE agree. Whether that is intended is a DECISION for the operator and belongs in the HP backlog.
- GET /rankings/metrics still accepts no explicit cycle_id, while /readiness and /scale-info do. Cube 9's new get_all_metrics(cycle_id=...) parameter is also not exposed on GET /reports/metrics. Harmless, but the API surface is uneven.
- Round-9 folds verified across module boundaries: SIM simThemesForCycle prefixes ids only for cycle >= 2, so single-round hashes hold (mock-data.ts:892-897, used by /ai/run at :1491). The session-view re-read timer is cleared. own_db.py gives each run its own database.
- Tests run at 695ecc1 with no DSN set (each run used its own database): backend tests/cube9 + tests/live_db + test_sql_tally_parity gave 119 passed. Frontend: mock-rankings 47/0, ballot-themes 42/0, cube-sim-live 837/0, worker-api-routes 40/0.

### Enki (diversity & edge cases) — NOT_APPROVED

Round 9's folds mostly hold up under edge-case testing. SIM re-opened cycles now carry their own theme ids, with cycle 1 unchanged, so a cycle-1 ballot is refused in cycle 2 in SIM as it is in LIVE. The push re-read timer is cleared on unmount. Each test run now gets its own Postgres database, so parallel runs no longer wipe each other. All targeted suites pass. But the new Cube 9 metrics cycle filter creates an edge-state regression the backlog does not list. The report cycle is coalesce(newest aggregated cycle, newest ballot cycle). Before the first ballot both are NULL, so themes_available reads 0 for every themed session in the window between theming and voting; until round 9 that count was session-wide and correct. The only real-DB test checks the count after cycle 2 is aggregated, so this window is never exercised. A theme-count fallback to the current or newest theme cycle, plus a live_db assertion before the first ballot, would earn approval. The remaining notes are minor: docstring accuracy, the session-wide theme labels in the CSV, and a return/continue slip in drop_owned.

- **Required:** Make the Cube 9 report metrics count themes in the state every session passes through: themed, ranking open, no ballot and no aggregation yet. Today the cycle used for the theme count is coalesce(newest aggregated cycle, newest ballot cycle). Both are NULL in that state, so `Theme.cycle_id == NULL` matches nothing and themes_available reads 0 while the session holds 9 or more themes. Before round 9 this count was session-wide and correct in this state, so round 9 introduced the regression. Fix: give the theme count a fallback to the session's current cycle, or to max(Theme.cycle_id) for the session, when the report cycle is NULL. Then add a live_db assertion that themes_available equals len(themes) after /ai/run and before the first ballot, in cycle 1 and again after the re-open.
  - File: `backend/app/cubes/cube9_reports/metrics.py`:77
  - Evidence: metrics.py:74-78 `select(func.count()).select_from(Theme).where(Theme.session_id == session_id, Theme.cycle_id == cyc)` with cyc = service._report_cycle (service.py:86-88: `newest_agg = select(func.max(a2.cycle_id))...; newest_ballot = select(func.max(r2.cycle_id))...; return func.coalesce(newest_agg, newest_ballot)`). On this Postgres, `select 1 where 1 = coalesce(null::int,null::int)` returns 0 rows. The only real-DB check, tests/live_db/test_reopen_cycle.py:121, asserts themes_available only after cycle 2 is aggregated. tests/cube9/test_metrics.py:48 mocks the scalar results, so the NULL-cycle case is never exercised. Not listed in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md.
  - Why it blocks: Round 9 introduced this defect and the backlog does not list it. GET /reports/metrics (the Dev-Sim/qualification baseline surface for Cube 9 in LIVE) reports 'no themes available' for every themed session until the first ballot lands. That breaks the Cubes 1–10 operational bar for Cube 9 in exactly the edge state between Cube 6 and Cube 7.

Minor notes:
- metrics.py docstring (lines 10-13) says reading every cycle 'reported cycle 1's winner while a re-opened cycle 2 was still being voted'. Under the new rule, while cycle 2 has ballots but no aggregation, _report_cycle still resolves to cycle 1 (coalesce prefers newest_agg). So winner_determined=True and themes_available equal cycle 1's values, while GET /themes shows cycle 2's themes. That matches the CSV and analytics ('last finished result'), which is defensible, but the docstring should describe it truthfully, or the behaviour should be stated as intended in the backlog.
- The metrics docstring says the cycle is 'the same cycle the CSV and analytics read'. That holds for rankings only: the CSV loads theme descriptions session-wide (service.py:342-343 `select(Theme).where(Theme.session_id == session_id)`, and again at 459). A re-opened session's CSV can therefore map labels from both cycles.
- tests/own_db.py drop_owned: a failed admin connect `return`s and skips every later owned database instead of `continue`. This is harmless today (one admin DSN per run) but would leak databases if two defaults pointed at different hosts. `drop database ... with (force)` needs Postgres 13 or newer; that holds locally and in CI.
- The SIM (lib/mock-data.ts) has no /reports/metrics route; this Cube 9 metrics surface is LIVE-only. It is not covered by cube-sim-live, which passes 837/837.
- Verified green at 695ecc1: backend tests/cube9 + tests/live_db/test_reopen_cycle.py 106 passed (own per-run DB); frontend test:mock-rankings 47/0, test:ballot-themes 42/0, test:cube-sim-live 837/0. simThemesForCycle keeps cycle-1 ids byte-identical and prefixes c{N}- for later cycles, including parent_theme_id, so cycle-1 replay hashes are unchanged.

### Thoth (data & analytics deep dive) — APPROVED

Round 10, Thoth lens, at 695ecc1 in /tmp/claude-0/wtm. I approve: I found no unlisted defect in the analytics data path that blocks scope 1–3.

What I checked:
- **Round 9 fold is correct.** In backend/app/cubes/cube9_reports/metrics.py, themes_available, has_final_ranking and winner_determined now read one cycle. That cycle comes from `_cycle()`, which uses service._report_cycle: the newest cycle with an aggregation, otherwise the newest with ballots. It is the same cycle that build_analytics_dashboard (service.py:604-622) and build_ranking_summary (service.py:756) read. Responses, participants and CQS correctly stay session-wide. GET /reports/metrics (router.py:186-199) uses this by default.
- **SQL tally matches the Python path.** In ranking_aggregation.py, `_sql_tally` and the Python path agree on all of these:
  - Borda width is the longest ballot.
  - Points count every time a theme appears on a ballot; a vote counts once per ballot.
  - A ballot that is not an array is dropped on both paths.
  - Excluded participants are counted and refused with the same words.
  - The replay hash uses the same prefix (algorithm, seed, cat, lvl).
  - Byte order of the joined ballots under COLLATE "C" equals Python's list order, because UUID characters all sort above ','.
- **Tests I ran myself** (without LIVE_DB_DSN or SIM_TEST_DSN, so on my own database):
  - Full backend: 3431 passed, 66 skipped, 0 failed.
  - The real-Postgres set (tests/live_db, test_sql_tally_parity, test_ballot_cycle, tests/cube9): 120 passed, none skipped.
  - Afterwards no per-run `_<pid>` database was left behind, so the own_db.py cleanup works.
  - Frontend: cube-sim-live 837/0, mock-rankings 47/0, ballot-themes 42/0.
- **SIM cycles.** In frontend/lib/mock-data.ts, simThemesForCycle gives a re-opened cycle new theme ids with a `c{n}-` prefix and leaves cycle 1 unchanged, which matches LIVE.
- **1M harness.** scripts/sim_1m.py seeded 100k "poll"-shaped ballots on 3×9 fixed theme ids in my own local database. Aggregation took 0.27 s with 72 MB peak memory and gave a deterministic result hash. I dropped that database afterwards.
- **Pipeline order.** cube6 pipeline.py runs: Phase A summaries 333/111/33 → Theme01 classification → marble sampling → generation → reduce to 9→6→3 → assign → store. Summaries come before Theme02, as the bar requires.

Minor notes (not blocking):
- ThemeSample rows pile up with each theming run.
- Response-level theme labels are overwritten by the newest theming run.
- A report can briefly mix cycles while a new cycle is open but not yet aggregated.


Minor notes:
- backend/app/cubes/cube6_ai/phase_b.py:701 `delete(ThemeSample).where(ThemeSample.theme_id.in_(old_ids))` never matches anything, because _store_results (phase_b.py:784-790) writes ThemeSample with no theme_id and the theme_samples table has no cycle_id. So every theming run (an allowed pre-vote re-run, or a re-opened cycle) adds another full set of marble-group rows. Nothing reads them today (no select(ThemeSample) anywhere in app/), so no figure is wrong, but the table grows unbounded and is not tied to a cycle. Fix: delete by (session_id), or add a cycle_id column and delete by it.
- ResponseSummary carries one set of theme01/theme2_9/6/3 per response (phase_b.py:798-821 upsert on response_meta_id). _fetch_summaries (phase_b.py:71-81) reads every response in the session, not only the current cycle. So theming a re-opened cycle 2 overwrites the cycle-1 per-response labels. This is coherent with the 'report reads the newest cycle' rule, but cycle 1's per-response theme record is gone afterwards. Worth a backlog line if each cycle's response-level history must be kept.
- Transition window: after cycle 2 has been themed but before it is aggregated, _report_cycle still picks cycle 1 (the newest aggregated cycle). Metrics and the ranking summary then show cycle-1 themes and winner, while the CSV's per-response labels (from ResponseSummary) already show cycle-2 labels. It is short-lived and self-heals at aggregation. A one-line note in the cycle documentation would make it explicit.

### Athena (strategic test planning) — APPROVED

I checked commit 695ecc1 in /tmp/claude-0/wtm and approve it under the Athena lens. Scope items 1–3 are operational, and every open item I found is either minor or recorded in the backlog with a "Needs" tag.

Each fix from Round 9 has a test that would fail if the fix were reverted.
(1) Report metrics: in backend/app/cubes/cube9_reports/metrics.py, the theme count, final ranking and winner queries now read one cycle. That cycle comes from service._report_cycle, which picks the newest cycle with an aggregation, or else the newest with ballots. This is the same cycle the CSV and analytics read. Lines 119–122 of backend/tests/live_db/test_reopen_cycle.py check that themes_available equals len(themes2) and that has_final_ranking and winner_determined are true after the session is re-opened.
(2) SIM theme ids: simThemesForCycle (frontend/lib/mock-data.ts:892) gives cycle 2 and later their own theme ids with a `c{cycle}-` prefix and leaves cycle 1 unchanged, so replay hashes stay the same. Covered by mock-rankings: 47 passed.
(3) Re-read timer: the session-view cleanup is covered by ballot-themes: 42 passed.
(4) Per-run test databases: backend/tests/own_db.py works as described. I ran tests/live_db plus tests/cube7/test_sql_tally_parity.py with no DSN set: 14 passed. Afterwards pg_database listed no new per-pid databases, so pytest_sessionfinish dropped its own database and left other reviewers' databases alone. In CI, deploy.yml still sets both DSNs and fails the job if any live_db, tally-parity or ballot-cycle test is SKIPPED, so these proofs cannot quietly drop out of the pipeline.

Tests I ran:
- Full backend suite (ENVIRONMENT=test, no DSN set): 3431 passed, 66 skipped, 0 failed.
- Frontend gates, all passing: cube-sim-live 837, sim-live-source 55, sim-console 35, sim-console-driver 20, worker-api-routes 40, sim-parity 3/3, theme-tiers 8, theme-ranked 12, ranking-shape 8, cube10-unlock 10.

Minor notes, none blocking:
- The cycle_id parameter in the metrics functions is not exposed on GET /reports/metrics, so the endpoint always reads the report cycle. This is consistent with the CSV but cannot be pointed at an earlier cycle.
- Quadratic Borda at 1M still loads every ballot in Python, and the live 1M infrastructure blockers remain. Both are honestly recorded in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md.


Minor notes:
- GET /reports/metrics (backend/app/cubes/cube9_reports/router.py:186-199) has no cycle_id query parameter, although metrics.get_all_metrics accepts one. Exposing it would let Cube 10 compare cycles directly.
- drop_owned (backend/tests/own_db.py) returns on the first failed admin connection instead of continuing to the next owned entry. This is harmless today because both defaults use the same host.
- The 66 skips in the full backend run are gated in CI only for the live_db, tally-parity and ballot-cycle patterns. Listing the other skip reasons in the round record would make the test plan more transparent.
- Known: the stake-weighted (quadratic) SQL tally and the live 1M infrastructure are recorded in the backlog with Needs tags, so they do not block.

### Christo (consensus & user-flow) — APPROVED

I reviewed 695ecc1 read-only at /tmp/claude-0/wtm, following the participant and moderator journey through consensus. I approve.

**The round-9 changes, checked in the code:**

1. **Cube 9 report metrics read one cycle.**
   - In backend/app/cubes/cube9_reports/metrics.py, `_cycle()` falls back to `service._report_cycle` (service.py:77), which is `coalesce(newest aggregated cycle, newest balloted cycle)`.
   - themes_available, has_final_ranking and winner_determined are filtered by `cycle_id == cyc`. The CSV (service.py:604, 756) and analytics read the same cycle, so the moderator's report agrees with itself.
   - responses, participants and CQS stay session-wide, as documented.
   - tests/live_db/test_reopen_cycle.py:120-122 asserts that after the re-open, themes_available equals cycle 2's theme count and the winner flags are set.

2. **SIM theme ids per cycle.** `simThemesForCycle` (mock-data.ts) prefixes the ids with `c{cycle}-` only when cycle > 1, so single-round replay hashes are unchanged and a cycle-1 ballot is refused in cycle 2, as LIVE does.
   - The participant gets a fresh ballot on a re-open. `useSessionBallotThemes` is passed `sessionId = null` while the status is polling, so it fetches again when ranking resumes. session-view.tsx:406 also resets ballotDone and myRankedOrder on polling.

3. **A pending push re-read is dropped with its session.** session-view.tsx:712-716 clears the timer and the pending push on unmount or session change.

**Tests I ran (no DSN set, so each run used its own database):**
- **Frontend:** cube-sim-live 837/0, mock-rankings 47/0, ballot-themes 42/0, status-advance 10/0, sim-console 35/0, sim-console-driver 20/0, worker-api-routes 40/0.
- **Backend:**
  - tests/live_db, tests/cube9 and test_sql_tally_parity: 119 passed. That includes the re-open proof, and nothing collided.
  - tests/cube1, cube7, cube6 and cube10: 1076 passed, 26 skipped.

**What remains under my lens is recorded in the backlog with an honest Needs:**
- HP-03: the deployed site runs in mock mode, so votes stay in one browser tab (DECISION + INFRA).
- HP-01, HP-02, HP-06: fan-out and poll load at 1M (APPROVAL/INFRA).
- HP-28: a crowd behind one address is throttled at join (DECISION).
- HP-22: the admin code differs between the static site and the backend (DECISION).
- HP-33 and HP-34: forged status pushes and the status read burst (INFRA/CODE).

I found no defect missing from the backlog. Scope 1–3 is operational for the consensus journey in both SIM and LIVE: join, submit, theme, rank, re-open with a fresh ballot, and a report that reads one cycle.


Minor notes:
- session-view.tsx:741-753: the cleanup at 712-716 clears the timer and the pending push but cannot cancel a re-read already in flight. If the session changes while one is running, its `.then` still calls `setSession((p) => statusAdvances(p, fresh) ? fresh : p)`, where p is the new session and fresh the old one, and its `.finally` calls the old closure's applyPushedStatus. This can only happen when the same mounted SessionView switches sessionId. A `gate.sid` check, or an epoch counter compared inside `.then`, would close it.
- Between a re-open and the next aggregation, GET /reports/metrics, the CSV and analytics all still report cycle 1, the last aggregated cycle, while cycle 2 is being themed and voted. This is consistent and defensible, but neither the moderator UI nor the response says which cycle a report covers. Adding `report_cycle` to the metrics response would make that explicit.
- tests/own_db.py drop_owned returns from its whole loop on the first connection failure, so in a run that named several owned databases a transient connect error leaves the remaining ones behind. `continue` instead of `return` would be safer. My runs left no orphaned databases.

### Aset (consistency validation) — NOT_APPROVED

I would not sign off this round: one change is needed. Last round's ask is done. /reports/metrics now counts themes, the final ranking and the winner in the report cycle, and the live-db re-open proof checks it. The SIM cycle-2 theme ids and the push re-read timer cleanup are also in place, and every proof I ran passed. The new defect is a regression from the round-9 fix. The report cycle is the newest aggregated cycle, otherwise the newest cycle with ballots. A themed session with no ballots has neither, so the filter becomes `Theme.cycle_id = NULL` and /reports/metrics reports themes_available=0 while /themes returns 9. The backlog does not list this. A fallback to the newest theme cycle, plus a test for the case with no ballots, would earn my approval.

- **Required:** Make GET /reports/metrics count a themed session's themes before anyone has voted. When the session has no aggregation and no ballots, fall back to the newest theme cycle, e.g. func.coalesce(newest_agg, newest_ballot, newest_theme_cycle) in _report_cycle, or a Theme-only fallback in metrics._cycle. Add a check that themes_available == 9 for a session with 9 themes and no ballots, in the live-db proofs or a SQL-level unit test.
  - File: `backend/app/cubes/cube9_reports/service.py`:88
  - Evidence: _report_cycle returns `func.coalesce(newest_agg, newest_ballot)`. metrics.py get_system_metrics then filters `Theme.session_id == session_id, Theme.cycle_id == cyc`. With no AggregatedRanking or Ranking rows both subqueries are NULL, and `cycle_id = NULL` matches nothing. I checked this on the local Postgres: a `where c = coalesce(<empty max>, <empty max>)` query returns 0. Before round 9 the count was session-wide and correct. The unit test (tests/cube9/test_metrics.py test_system_counts) mocks db.execute, so it never runs the cycle filter. The live-db reopen assertion (test_reopen_cycle.py:120-122) only checks after the cycle-2 ballots and aggregation exist.
  - Why it blocks: Round 9 introduced this, and the backlog does not list it. A session that has been themed and is waiting for votes is the normal state for Cube 9 and for the Dev-Sim baseline, yet /reports/metrics reports themes_available=0 while /themes returns 9. The same session gives two different answers depending on which endpoint you ask, which is exactly what my lens exists to catch.

Minor notes:
- My previous ask is done. metrics.py now filters Theme.cycle_id, AggregatedRanking.is_final and is_top_theme2 by the cycle _report_cycle resolves (metrics.py lines 76-85 and 132-138). The router calls get_all_metrics(db, session_id) with that default. test_reopen_cycle.py:119-122 asserts /reports/metrics themes_available == len(themes2) and has_final_ranking/winner_determined after the re-open.
- The metrics.py docstring says the cycle is 'the same cycle the CSV and analytics read'. The CSV builders at service.py:343 and :459 read Theme labels from the whole session with no cycle filter. That is harmless for a label map, but the wording overstates it.
- Verified locally, with no LIVE_DB_DSN or SIM_TEST_DSN set so each run used its own per-run database: tests/live_db plus tests/cube7/test_sql_tally_parity.py, 14 passed in 65 s; tests/cube9/test_metrics.py, 7 passed. Frontend: test:mock-rankings 47/0, test:ballot-themes 42/0, test:cube-sim-live 837/0.
- simThemesForCycle (mock-data.ts:892-897) prefixes ids with c<cycle>- from cycle 2 on and leaves cycle 1 unchanged, so replay and driver hashes for a single round stay identical. A cycle-1 ballot is now refused in SIM cycle 2, as it is in LIVE.

### Asar (synthesis & outcome) — APPROVED

I approve. I reviewed 695ecc1 at /tmp/claude-0/wtm read-only, and all four round-9 folds are in the code and do what the commit says.

(1) Cube 9 report metrics read one cycle. backend/app/cubes/cube9_reports/metrics.py adds `_cycle()`, which uses an explicit cycle if one is given and otherwise falls back to service._report_cycle. The theme count, the final-ranking check (is_final) and the winner check (is_top_theme2) now all filter on `cycle_id == cyc`. That is the same cycle rule that analytics (service.py:604) and build_ranking_summary (service.py:756) already use, so the CSV, analytics, the ranking summary and the metrics now follow one cycle rule. Responses, participants and CQS are still counted across the whole session, as the docstring says. The live-db re-open proof (test_reopen_cycle.py:119-122) now checks that themes_available equals cycle 2's theme count, and that has_final_ranking and winner_determined are both set.

(2) In SIM, simThemesForCycle gives a re-opened cycle's themes the prefix `c{cycle}-` on both id and parent_theme_id. Cycle 1 is unchanged, so replay hashes still hold.

(3) session-view.tsx clears the pending push timer when the component unmounts or sessionId changes.

(4) tests/own_db.py names each run's database `<name>_<pid>` when no DSN is set, and conftest pytest_sessionfinish drops it at the end.

Checks I ran myself, without setting LIVE_DB_DSN or SIM_TEST_DSN:
- live_db + sql_tally_parity + cube9 against real Postgres: 119 passed, 0 skipped. My per-run databases were dropped afterwards. The leftover live_db_test_7675 and sim_parity_7675 databases belong to another reviewer whose run was still going.
- Full backend suite: 3431 passed, 66 skipped, 0 failed.
- Frontend gates: cube-sim-live 837/837, mock-rankings 47/47, ballot-themes 42/42.

Overall: SIM and LIVE give the same answers about which cycle is read and which theme ids a ballot may use. The 1M tally parity proof is green. The remaining open items are in the backlog with an honest Needs. Scope 1–3 works under my lens. The one new edge case I found is minor and listed in the notes.


Minor notes:
- New in this round, small: before the session's first ballot, GET /reports/metrics reports themes_available=0 even after /ai/run has made the themes. `_report_cycle` is `coalesce(max(aggregated.cycle_id), max(rankings.cycle_id))`, so with no ballots and no aggregation it is NULL, and `Theme.cycle_id == NULL` matches nothing (metrics.py get_system_metrics). Before 695ecc1 this count was session-wide. No frontend screen reads /reports/metrics; only the router serves it (router.py:186-199). Fix: add a third fallback, `max(themes.cycle_id)` or the session's current_cycle, either in metrics._cycle or in _report_cycle. Add a cube9 test that /ai/run with no ballots reports the themes.
- tests/own_db.py drop_owned: if the admin connection fails for the first database, the loop returns, so later entries are never tried. Today every entry points at the same localhost admin DSN, so nothing is lost. Using `continue` instead of `return` would be safer if two proofs ever used different hosts.
- Another reviewer's live_db_test_7675 and sim_parity_7675 were still on the shared Postgres while its run (pid 7675) was active. If a run is killed (SIGKILL or a timeout), its per-run databases stay behind, because pytest_sessionfinish never runs. A small sweep that drops `*_<pid>` databases whose pid no longer exists would keep the host tidy. It is cosmetic and does not affect correctness.

### Pangu (cutting-edge) — APPROVED

I checked the Round 9 fold at 695ecc1 against the code and found nothing that blocks approval.

1. **Cube 9 report metrics.** `backend/app/cubes/cube9_reports/metrics.py` now counts themes, the final ranking and the winner for one cycle only. It takes that cycle from `service._report_cycle`, a single SQL expression (coalesce of the newest aggregated cycle, else the newest cycle with ballots), so there is no extra round trip. This is the same cycle the CSV and analytics read. Responses, participants and CQS stay session-wide, as the docstring says.
2. **SIM theme ids per cycle.** `simThemesForCycle` in `frontend/lib/mock-data.ts` adds a `c{n}-` prefix to theme ids and parent ids from cycle 2 on, and leaves cycle 1 unchanged. Cycle-1 replay hashes therefore stay byte-identical, and a cycle-1 ballot is refused in cycle 2, as LIVE does.
3. **Per-run test databases.** `tests/own_db.py` appends the process id to the database name when no DSN is set in the environment, and `conftest.py` `pytest_sessionfinish` drops those databases with `drop database ... with (force)`. CI's explicit DSNs are used as given and never dropped.

Checks I ran, with LIVE_DB_DSN and SIM_TEST_DSN unset:
- **Backend:** `pytest tests/cube9 tests/cube7/test_sql_tally_parity.py tests/live_db` gave 119 passed. `test_reopen_cycle` passed against real Postgres.
- **Database cleanup:** afterwards none of my per-run databases were left. The only `_<pid>` databases were `live_db_test_9295` and `sim_parity_9295`, which belong to another reviewer's pytest that was still running, so runs no longer collide.
- **Frontend:**
  - `npm run test:mock-rankings`: 47/47
  - `test:ballot-themes`: 42/42
  - `test:cube-sim-live`: 837/837
  - `test:sim-console-driver`: 20/20

The open items for scope 1–3 are recorded in the backlog with their Needs.


Minor notes:
- backend/tests/own_db.py drop_owned: a failed connect to the admin database `return`s out of the whole loop instead of `continue`, so if one admin DSN is unreachable the remaining owned databases are not dropped. This is harmless today because both defaults point at the same host.
- A test run that is killed with SIGKILL or times out never reaches pytest_sessionfinish, so its `<name>_<pid>` databases stay behind. An optional sweep at session start could drop owned-pattern databases whose pid is no longer alive.
- metrics._cycle imports `_report_cycle` inside the function, presumably to avoid a circular import with service.py. It works, but moving `_report_cycle` into a small shared module would make the cycle rule one importable primitive for CSV, analytics and metrics.
- Running node --test directly on tests/mock-rankings.test.mjs fails to resolve the extensionless imports in mock-data.ts. Only the npm scripts, which add the ts-alias loader, work. That is fine for CI, but it is worth a one-line note in the test header for anyone running a test by hand.

### Sofia (multi-perspective) — NOT_APPROVED

I read 695ecc1 (/tmp/claude-0/wtm) from several angles: moderator, participant, SIM user, Cube 10 gateway and test operator. The round-9 folds are mostly sound.

Tests I ran:
- Frontend: mock-rankings 47/0 (including the 4 new cycle-id checks), ballot-themes 42/0 (including the new timer-cleanup gate), cube-sim-live 837/0, worker-api-routes 40/0.
- Backend: tests/live_db 5/5 passed, each run in its own per-pid database. The own_db.py isolation works without a DSN set.

Code checks:
- simThemesForCycle prefixes `c{cycle}-` only on cycles of 2 or more, so single-round replay hashes are unchanged, as LIVE.
- The session-view unmount/session-change cleanup clears gate.timer and gate.wanted.

One defect, not in the backlog: the Cube 9 metrics fold made a regression. _report_cycle is coalesce(newest aggregated cycle, newest ballot cycle). It is right for ballot tables, but it is NULL before the first ballot. themes_available now filters `Theme.cycle_id == NULL` and reports 0. I reproduced this on real Postgres: 57 themes from GET /themes, and /reports/metrics says 0. Before this commit it said 57.

The commit also says it fixed 'cycle 1's winner while cycle 2 was still being voted'. In that state (cycle 2 not yet aggregated) the report cycle is still 1, so has_final_ranking and winner still describe cycle 1. That matches the CSV, but the stated fix does not hold.

No frontend consumer or SIM route reads /reports/metrics, so SIM/LIVE parity is unaffected. Scope 2 and 3 hold under my lens. With the theme-cycle fallback and one live_db assertion for the themed-but-unvoted state, I would approve.

- **Required:** GET /reports/metrics must count a session's themes before any ballot is cast. Today, in the themed-but-unvoted phase, themes_available is 0 and the counts that read the report cycle compare against NULL. Fix: in cube9_reports/metrics.py, count themes in a cycle that falls back to the newest themed cycle, e.g. coalesce(_report_cycle(session_id), select max(Theme.cycle_id) where session_id = …). The ranking tables keep reading _report_cycle. Then add an assertion to backend/tests/live_db (first cycle: themed, no ballots) that rep['system']['themes_available'] == len(GET /themes). Also correct the docstring/commit claim. While re-opened cycle 2 is being voted and not yet aggregated, newest_agg is still 1, so the endpoint still reports cycle 1's has_final_ranking and winner. That scenario is unchanged by this fold. Either say so, which is consistent with the CSV, or handle it.
  - File: `backend/app/cubes/cube9_reports/metrics.py`:75
  - Evidence: `Theme.session_id == session_id, Theme.cycle_id == cyc` with cyc = `_report_cycle(session_id)` = `func.coalesce(newest_agg, newest_ballot)` (service.py:86-88), both max() over AggregatedRanking/Ranking. With no ballots both are NULL, so `cycle_id = NULL` matches nothing. Reproduced on real Postgres with a scratch probe that reuses the live_db harness, run from the scratchpad (nothing written in the repo): create → 3 responses → rank → ai/run gives 57 themes from GET /themes, yet GET /reports/metrics returns `{'exportable_responses': 3, 'themes_available': 0, 'has_final_ranking': False}`. Before 695ecc1 the same call counted every theme for the session (57). The new live_db assertion (test_reopen_cycle.py:121) only checks the state after aggregation, so it cannot catch this.
  - Why it blocks: This round introduced the regression and the backlog does not list it. It affects scope item 1: the API returns a wrong figure in the most common flow (a single cycle between theming and voting), and the Dev-Sim / Cube 10 qualification gateway that this endpoint exists for reads 'no themes available' in exactly the phase where themes are the point. The fix is small and needs a one-line test.

Minor notes:
- tests/own_db.py drop_owned: on a connect failure it `return`s out of the whole loop rather than `continue`, so if a run owns more than one per-pid database and one admin connection fails, the rest are left behind. Harmless today because every owned DSN shares one admin host.
- Per-pid databases are not dropped if a run is killed, for example by a CI timeout or Ctrl-C before pytest_sessionfinish. On a shared dev Postgres they pile up as live_db_test_<pid> / sim_parity_<pid>. A cleanup-on-start sweep of stale `_<pid>` names whose pid is no longer alive would fix it.
- To reproduce live_db fixtures from outside the tests tree you need `-c pyproject.toml -p tests.conftest -p tests.live_db.conftest`. A one-line note in live_db/conftest.py would help reviewers write their own probes without touching the repo.
- get_user_metrics loads every Participant row to count opt-ins (select(Participant) … len(rows)). At 1M participants this endpoint pulls 1M ORM objects. A count(*) plus a filtered count would match the SQL-tally approach used in Cube 7.
