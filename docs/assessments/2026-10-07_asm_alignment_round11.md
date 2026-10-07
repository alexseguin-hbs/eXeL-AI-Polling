# 12-AsM alignment — round 11 (2026-10-07, code at 97f349c, LIVE: Verify Live #2616)

**Approved: 8 / 12** (Enlil, Krishna, Enki, Athena, Christo, Aset, Asar, Sofia). Means: Security 89.4 · Stability 89.3 · Scalability 86.5 · Efficiency 89 · Succinctness 88.3

Trend (approvals): 0 → 10 → 8 → 12 → 9 → 6 → 2 → 9 → 11 → 7 → 8. Every pillar mean fell below 90 this round, Scalability the most (86.5; Odin and Pangu each scored it 72).

This round's objections are new defects on the 1M path, found by reviewers going deeper; none is a regression of the previous fold:

- **Theming and CQS bind one parameter per answer.** asyncpg refuses more than 32,767, so a cycle above about 3% of the 1M target failed before Theme01 (Odin and Pangu each reproduced it at 40,000).
- **Public time tracking was unbounded.** One join token could open unlimited entries and mint N× the ♡/◬ (Thor).
- **CQS was not idempotent and read every cycle.** A second run raised and left two rows per answer (Thoth).
- **Theme samples piled up on every re-run.** The old delete never matched (Odin).

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | NOT_APPROVED | 87 | 91 | 89 | 91 | 90 |
| Odin (predictive / future-proof) | NOT_APPROVED | 88 | 83 | 72 | 82 | 86 |
| Enlil (implementation & build verification) | APPROVED | 90 | 92 | 90 | 91 | 88 |
| Krishna (integration & cross-module) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Enki (diversity & edge cases) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Thoth (data & analytics deep dive) | NOT_APPROVED | 88 | 80 | 86 | 87 | 84 |
| Athena (strategic test planning) | APPROVED | 88 | 92 | 86 | 90 | 90 |
| Christo (consensus & user-flow) | APPROVED | 92 | 92 | 91 | 91 | 90 |
| Aset (consistency validation) | APPROVED | 91 | 92 | 91 | 91 | 90 |
| Asar (synthesis & outcome) | APPROVED | 90 | 92 | 90 | 91 | 88 |
| Pangu (cutting-edge) | NOT_APPROVED | 86 | 82 | 72 | 80 | 84 |
| Sofia (multi-perspective) | APPROVED | 91 | 92 | 91 | 92 | 90 |

## Folded after this round

- **No bound id lists on the response path (Odin, Pangu).** `cube6_ai/phase_b._fetch_summaries` builds the eligible answers once, as a subquery (session, current cycle, PII gate), and both reads filter by it. `cube6_ai/cqs_engine` filters participants by a subquery of the eligible summaries. A sweep of every `.in_(` in `app/` found no other answer-sized list: cube4 is page-bounded, and cube9's data destruction and cube3's voice metrics already use subqueries. Proof: `tests/live_db/test_bounds_and_scale.py` puts 40,000 answers in one cycle on real Postgres, and phase B reads all of them.
- **CQS is idempotent and reads one cycle (Thoth).** A re-score deletes the session's scores in the same transaction as the new rows, and reads only the current cycle's answers. A session with no seed no longer raises. Proof: two POST /ai/cqs calls leave one score per eligible answer and exactly one winner.
- **Theme samples are bounded (Odin).** Every theming run replaces the session's marble groups. Nothing reads past runs' samples.
- **Public time tracking is bounded (Thor).**
  - The route is rate-limited (30/min) and starts time only while the session is live.
  - A participant can hold one open public entry at a time (`service.guard_public_start`).
  - Every entry's duration is capped at one live window (`MAX_TIME_ENTRY_SECONDS`, 3 h, DECLARED).
  - Cube 2/3's own start-and-stop inside a submission is untouched.
  - Proof: a start before polling → 409, a second open start → 409, then stop → start again → exactly two entries. A 10-hour entry earns 3 hours (`tests/cube5/test_time_entry_cap.py`).
- **Ballots are rate-limited (Thor).** POST /rankings is limited to 60/min.
- **SIM source viewer.** Decorated endpoints (`@limiter.limit`) now show their own source (`inspect.unwrap`), so all 66 functions keep real source.
- **Recorded, not built:**
  - **HP-36:** the SDK demo base URL and the navbar QR call reach routes no host serves (Odin). Both degrade visibly.
  - **HP-37:** the in-memory rate limiter holds per process, not per deployment (Thor). Needs INFRA.

## What each lens said (verbatim)

### Thor (risk & security stress) — NOT_APPROVED

Thor lens, round 11, checked on 97f349c. Tests I ran myself without LIVE_DB_DSN or SIM_TEST_DSN: the full backend suite passed (3433 passed, 66 skipped, 0 failed). The real-Postgres proofs (tests/live_db, test_sql_tally_parity, the new test_frontend_client_paths gate) ran on their own per-run databases: 16 passed, 0 skipped.

Round 10 changes, read for risk:
(1) metrics.py _theme_cycle builds `coalesce(report cycle, max(Theme.cycle_id))` with SQLAlchemy, not string-built SQL. GET /reports/metrics keeps require_session_owner. The user-metrics SQL count removes the 1M-row in-memory load.
(2) phase_b._fetch_summaries filters by a current-cycle scalar subquery. The PII gate is unchanged.
(3) The time-tracking client fix sends the participant token, and the backend stop route checks that the time entry belongs to the token's participant in this session. Good.
(4) own_db.py builds database names from the pid only.

One defect is not listed in the backlog. Cube 5 time tracking has no limit on open entries per participant, no session-state check, no duration cap and no rate limit. One anonymous join token can therefore open N parallel entries and mint N times the ♡/◬ tokens, with unbounded row growth. Round 10 made this the documented client path. Fixing it, or recording it honestly in the backlog, would earn my approval. Everything else under my lens is minor or already recorded in the backlog: HP-33 status channels, HP-09/HP-06 infrastructure, HP-35 delete.

- **Required:** Bound Cube 5 time tracking per participant. POST /sessions/{id}/time/start should allow at most one open TimeEntry per (session, participant), either by refusing with 409 or by closing the previous entry, and should refuse unless the session is open (polling or ranking). Stop should cap the duration at the session window or a configured maximum. Both routes need a @limiter.limit. Add a gate test: a second start while one is open does not produce a second entry, and N starts followed by N stops cannot mint N times the ♡/◬.
  - File: `backend/app/cubes/cube5_gateway/service.py`:131
  - Evidence: start_time_tracking (service.py:131-152) runs `entry = TimeEntry(session_id=..., participant_id=..., started_at=datetime.now(timezone.utc)); db.add(entry); await db.commit()` with no check for an already-open entry and no check of session status. stop_time_tracking (l.182-200) sets `entry.duration_seconds = (now - entry.started_at).total_seconds()` with no upper bound, then mints `heart = math.ceil(duration_minutes)` and `unity = heart * unity_heart_multiplier` into a TokenLedger row. Neither route in cube5_gateway/router.py (l.53-117) has a limiter.limit; `grep limiter.limit app/cubes/cube5_gateway` finds nothing. Round 10 wired lib/api.ts startTimeTracking/stopTimeTracking to these routes with the participant token (PARTICIPANT_WRITE regex), so the documented client path now leads here. The stop route's ownership check (router.py:107-111) is correct, but it only checks who the caller is, not how much they mint.
  - Why it blocks: Joining is anonymous and rate-limited to 100/min per IP, but after that a single participant token can open unlimited parallel time entries and later stop them all. That multiplies the ♡/◬ it earns, and the inflated totals flow into the Cube 9 report token sums (cube9_reports/service.py:635-645). Each call also adds a row, so one client can grow time_entries and token_ledger without limit, a write-amplification risk at the 1M target. CLAUDE.md requires rate limiting on all public endpoints, anti-sybil safeguards and governance weight damping. The defect is not listed in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md, so under the acceptance bar it blocks approval. Fixing it in code or recording it honestly as an HP item with its Needs would earn my approval.

Minor notes:
- Cube 7 POST /rankings has no limiter.limit. A re-vote replaces the ballot, so rows do not grow, but each call still re-runs validation and the DB write. A per-IP limit like Cube 2's would match the 'rate limiting on all public endpoints' rule.
- The limiter uses in-memory storage (`storage_uri="memory://"`), so the limits apply per process and do not hold across horizontally scaled workers. That fits the INFRA items in the backlog, but it is not called out there.
- Settlement of 웃 into currency (settle_hi_to_currency) is referenced in the cube8 docstring but not implemented, so time-minted tokens have no cash path today. That lowers the severity of the time-tracking defect, but it should be fixed before settlement lands.
- The HP-35 allow-list entry in test_frontend_client_paths.py is the right approach. The dashboard's DELETE /sessions/{id} should show an honest 'not available' state rather than a silent 404 until the operator decides between hard delete and archive.

### Odin (predictive / future-proof) — NOT_APPROVED

Round 10's own changes check out under this lens. Verified at 97f349c:
- Backend: 560 passed and 10 skipped across cube6, cube7, cube9, core/test_frontend_client_paths and live_db; 14/14 real-Postgres proofs passed on a per-run database (no DSN set).
- Frontend gates all pass: cube-sim-live 837, mock-rankings 48, sim-console 35, sim-console-driver 20, sim-live-source 55, theme-ranked 12, ranking-shape 8, cube10-unlock 10.
- metrics.py `_theme_cycle` coalesces correctly in SQL.
- `_fetch_summaries` is now scoped to the current cycle. Every ResponseMeta writer (cube2, cube3, the cube3 realtime path, sim_seed) stamps session.current_cycle, so cycle-1 per-response labels are no longer overwritten.
- The client-path gate is a real future-proofing class gate: KNOWN is tied to HP-35, and a stale-excuse test removes an entry once the route exists.

The blocker is a scale limit that no current test reaches. Phase B (phase_b.py:100-104) and the CQS engine (cqs_engine.py:97-100) send Python id lists as `.in_()` bind parameters. I reproduced the asyncpg limit on the local Postgres: 30,000 UUIDs ran and 40,000 failed with 'the number of query arguments cannot exceed 32767'. So LIVE theming fails for any cycle with more than about 32.7k responses, far below the 1M target. The codebase already knows this limit (sim_seed.py chunks by 1,000), but these two call sites were missed. The backlog does not record it, and sim_1m.py never runs Phase B. The ThemeSample cleanup in `_replace_cycle_themes` never matches, so rows grow unbounded on every re-theme; round 10 raised this and the backlog still does not record it. All three are small CODE fixes with no INFRA, DECISION or APPROVAL needed, and they would earn my approval. Everything else open under this lens (HP-31 and HP-34 read bursts, HP-29 10M) is honestly recorded.

- **Required:** Stop sending the cycle's response ids to Postgres as one bound list in Phase B. Replace the list with a subquery that uses the same filter as the metas query (session_id, current cycle, PII gate), or a join, or split the ids into chunks of 1,000 as sim_seed.py:126 already does. Then add a live_db (or parity-style) test that themes more than 32,767 responses in one cycle.
  - File: `backend/app/cubes/cube6_ai/phase_b.py`:100
  - Evidence: `meta_ids = [m.id for m in metas]` … `select(ResponseSummary).where(ResponseSummary.response_meta_id.in_(meta_ids))` sends one bind parameter per response. I ran the same SQLAlchemy construct (a UUID column `.in_(list)`) through asyncpg on the local Postgres. 30,000 ids worked. 40,000 failed with `InterfaceError: the number of query arguments cannot exceed 32767`. config.py:9 sets the production driver to `postgresql+asyncpg`. The authors already chunk this exact pattern elsewhere (`sim_seed.py:126 for i in range(0, len(response_ids), 1000)`), so the limit is known. Nothing in the backlog covers it: a grep for 32767, 'query arguments' and _fetch_summaries finds nothing, and HP-26 says sim_1m.py inserts themes directly, so it never runs Phase B at 1M.
  - Why it blocks: Scope item 3 is 1M responses themed Theme01 → 9 → 6 → 3 and then voted. In LIVE, any cycle with more than 32,767 eligible responses (about 3% of the 1M target) makes the theming run raise before Theme01 classification, so no themes are produced and there is nothing to vote on. This is an unlisted defect on the main 1M path, and no test reaches that scale on real Postgres.
- **Required:** Apply the same fix to the CQS engine: look up participant ids for eligible summaries with a subquery or join on ResponseSummary, or in chunks, instead of an `.in_()` over a Python list.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:97
  - Evidence: `meta_ids = [s.response_meta_id for s in eligible]` … `select(ResponseMeta).where(ResponseMeta.id.in_(meta_ids))`. eligible is every summary whose top Theme02 matches with confidence ≥ 95. At 1M, one winning theme can easily cover more than 32,767 responses, and then the asyncpg limit shown above makes CQS scoring raise.
  - Why it blocks: This is the same class of defect as item 1, also unrecorded, on the post-vote outcome path (CQS bonus, Cube 9 outcome metric cqs_scored). Fixing only Phase B would fix one instance and leave the class.
- **Required:** Bound the ThemeSample table to one cycle. Either give ThemeSample a cycle_id and delete by (session_id, cycle_id) in _replace_cycle_themes, or delete by session before rewriting. Or, if accumulation is intended, record it as an HP row with its Needs.
  - File: `backend/app/cubes/cube6_ai/phase_b.py`:712
  - Evidence: `await db.execute(delete(ThemeSample).where(ThemeSample.theme_id.in_(old_ids)))` never matches, because the writer at l.795-800 builds `ThemeSample(session_id=session.id, theme01_label=category, sample_index=idx, response_ids=response_ids)` with no theme_id. So every allowed pre-vote re-run and every re-opened cycle appends another full set of marble groups, about 1M/10 rows each holding a response_ids list at 1M. The round 10 assessment raised this (docs/assessments/2026-10-07_asm_alignment_round10.md:183), but the backlog has no entry: a grep for ThemeSample / theme_samples finds nothing.
  - Why it blocks: This is unbounded storage growth that scales with response count times theming runs. It was reported last round and is neither fixed nor recorded, and the bar says an unlisted defect blocks approval.

Minor notes:
- phase_b._fetch_summaries loads full ResponseMeta ORM rows, raw_text included, for the whole cycle only to fall back to the first 33 words. At 1M, selecting just the needed columns (id, participant_id, question_id, raw_text only where no summary exists) would cut memory by roughly an order of magnitude.
- ResponseMeta has no (session_id, cycle_id) index; the new cycle filter is served by the session_id prefix of ix_response_meta_session_question. That is fine for one session at 1M; add the index alongside the HP-29 10M work.
- get_outcome_metrics re-counts ResponseMeta, which get_system_metrics already counts. It is one extra indexed count per call, harmless, but get_all_metrics could share it.
- lib/sdk-demos.ts:18 documents API_BASE as https://exel-ai-polling.explore-096.workers.dev/api/v1 and calls it 'Real REST API call against the deployed platform'. That host serves no /api/v1 (worker.js routes only /api/ai|tmp|notify|donate), so every published example 404s or returns HTML until HP-03's hosted backend exists. Point the docs at a configurable base, or say plainly that the examples run once the backend is hosted.
- components/navbar.tsx:402 calls /api/v1/sessions/qr-generate, which neither the backend nor the worker serves. It degrades gracefully (checks for an image content-type) but always falls back to the third-party api.qrserver.com. The client-path gate skips it because it is a bare fetch, not api.*.

### Enlil (implementation & build verification) — APPROVED

The fix I asked for in round 10 is in the code at 97f349c. In backend/app/cubes/cube9_reports/metrics.py:69-74, `_theme_cycle` returns `func.coalesce(_cycle(session_id, None), newest_theme)`. `get_system_metrics` (line 91) counts themes with it, while the final-ranking and winner counts still read the report cycle. The live-db test backend/tests/live_db/test_reopen_cycle.py:65-71 calls GET /reports/metrics after /ai/run and before the first ballot, in both cycles. It checks themes_available == len(themes), and checks has_final_ranking and winner_determined against `current_cycle > 1`. Line 134 checks user.participants == 3. The other round-10 changes are also in place: phase_b.py:59-86 filters ResponseMeta to the session's current cycle, and get_user_metrics counts participants in SQL with `count().filter`. I ran the checks myself, each in its own database. The full backend suite gave 3433 passed, 66 skipped, 0 failed. test_reopen_cycle ran and passed (not skipped). The cube9 tests, the SQL tally parity test and test_frontend_client_paths all passed. Frontend gates: cube-sim-live 837/0, mock-rankings 48/0, sim-console-driver 20/0, sim-live-source 55/0, worker-api-routes 40/0, sim-parity 3/3, theme-tiers 8/0, ballot-themes 42/0. tsc --noEmit with the project filter shows 0 errors. Scope 1–3 works from what I checked under my lens. DELETE /sessions/{id} is honestly listed as HP-35.


Minor notes:
- test_reopen_cycle.py:68 cannot tell cycle 1 from cycle 2 before cycle 2's first ballot. Line 90 asserts len(themes2) == len(themes1), and at that point the report cycle is still 1 (it is aggregated). So the assertion would pass whichever cycle's themes were counted. This matches the documented 'last finished result until aggregated' behaviour, but a check against theme ids or a different per-cycle theme count would prove which cycle is read.
- metrics.py:84-87: exportable_responses counts ResponseMeta across every cycle, while the ranking counts are per cycle. If the CSV is meant to cover the whole session this is consistent; the docstring could say so explicitly.
- Running `node --test tests/cube-sim-live.test.mjs` directly fails on import because the ts-alias loader is missing. Only the npm script (`npm run test:cube-sim-live`) is valid, which is how test:ci runs it.

### Krishna (integration & cross-module) — APPROVED

Both items from my last verdict are fixed at 97f349c. (1) Cube 9 theme count: backend/app/cubes/cube9_reports/metrics.py:69-74 `_theme_cycle` returns `func.coalesce(_cycle(session_id, None), newest_theme)`, and get_system_metrics:91 filters `Theme.cycle_id == _theme_cycle(...)`. Ranking and winner still read the report cycle (`_cycle`), and the docstring is honest about re-opened sessions. backend/tests/live_db/test_reopen_cycle.py runs on its own Postgres and passes. (2) Time tracking: frontend/lib/api.ts:286-290 now POSTs to /sessions/{id}/time/start and /time/stop. The request bodies (`action_type` Literal, `time_entry_id`) match backend/app/schemas/time_tracking.py. PARTICIPANT_WRITE (api.ts:70) attaches the participant token for time/*, and the backend's `_time_participant` resolves that token. The class gate backend/tests/core/test_frontend_client_paths.py scans every api.*/request() call against the OpenAPI. Its only allow-listed gap is DELETE /sessions/{id}, which backlog HP-35 records honestly as APPROVAL + CODE. Tests also stop stale entries in that allow-list. Cross-module: phase_b._fetch_summaries now filters `ResponseMeta.cycle_id == _current_cycle(session_id)`, so theming, the themes it writes and the metrics all read the same cycle. Checks run: backend 117 passed (client-path gate, reopen-cycle live_db, cube9, SQL tally parity). Frontend: cube-sim-live 837/0, mock-rankings 48/0, sim-live-source 55/0, sim-console-driver 20/0, worker-api-routes 40/0. I also spot-checked a backend call that bypasses api.* (easter-egg verify-access): the backend serves /api/v1/verify-access. I found no unlisted integration defect under my lens.


Minor notes:
- The client-path gate only matches api.*/request() calls. A future raw fetch(`${API_BASE_URL}/...`) would skip it. Today there is exactly one such call (easter-egg-context.tsx verify-access), and the backend serves its path. Consider adding API_BASE_URL template fetches to the scan.
- startTimeTracking/stopTimeTracking have no callers and no MOCK_MODE handler in mock-data.ts. That is harmless while nothing calls them, but SIM would 404 if a component wires them later.
- Running cube-sim-live.test.mjs with bare node fails at module resolution (it needs ts-alias-loader). Always go through `npm run test:cube-sim-live`, which passes.

### Enki (diversity & edge cases) — APPROVED

Round 11, Enki lens. Last round I asked for one thing: themes_available should count themes when a session is themed but nobody has voted, in cycle 1 and after a re-open, with a live_db check. That is done. backend/app/cubes/cube9_reports/metrics.py:69-74 adds _theme_cycle = coalesce(_report_cycle, max(Theme.cycle_id)), and line 91 uses it. So a themed session with no ballots no longer compares cycle_id with NULL and gets 0. In backend/tests/live_db/test_reopen_cycle.py:65-72, run_cycle calls GET /reports/metrics after theming and before the first ballot in both cycles. It asserts themes_available == len(themes), and checks has_final_ranking/winner_determined against current_cycle>1. Lines 131-134 add the after-vote check and participants == 3. I ran that test on its own temporary database (LIVE_DB_DSN and SIM_TEST_DSN unset) together with tests/core/test_frontend_client_paths.py and tests/cube9: 108 passed, none skipped. On the frontend, npm run test:cube-sim-live passed 837/0 and test:mock-rankings passed 48/0. Cycle scoping in phase_b._fetch_summaries (line 86, _current_cycle) is correct. ResponseMeta.cycle_id and Theme.cycle_id are non-null with default 1, so no legacy NULL rows get dropped from the cycle filter. I found no unlisted defect under the edge-case lens in scope 1-3.


Minor notes:
- After a re-open, while cycle 2 is themed but not yet aggregated, _theme_cycle resolves to cycle 1 (the report cycle), so themes_available is cycle 1's count, not cycle 2's. That matches the docstring (the report shows the last finished result, as the CSV does), so it is coherent. But the cycle-2 pre-ballot assertion at test_reopen_cycle.py:68 cannot tell the two cycles apart, because line 87 asserts len(themes2) == len(themes1). Suggestion: compare against the report cycle's theme count, or add a case where the two cycles' theme counts differ (for example, a different number of Theme01 categories present), so the documented behaviour is actually tested.
- The asymmetry is worth one line in the backlog or docstring: in cycle 1 before any ballots, themes_available counts the newest themed cycle; after a re-open it counts the last aggregated cycle until the new cycle is aggregated. Both are reasonable, but a Cube 10 baseline comparison taken mid-cycle 2 will show cycle 1's theme count.
- Running tests/cube-sim-live.test.mjs directly with plain `node --test` fails with ERR_MODULE_NOT_FOUND because it needs the ts-alias loader. Only the npm script works. That is fine for CI, but a short comment in the test header saying how to run it would save reviewers a false red.

### Thoth (data & analytics deep dive) — NOT_APPROVED

Not approved, for one reason: CQS scoring is neither idempotent nor limited to one cycle. I reproduced it on my own Postgres. A second POST /ai/cqs fails with MultipleResultsFound (a 500 to the caller) and leaves duplicate scores, so Cube 9 reports cqs_scored as 6 for 3 responses. In a re-opened session it also re-scores the cycle-1 answers. This is the same class fixed for theming in round 10, it sits one stage later in the same pipeline, and it is not in the backlog. Everything else under my lens holds. The round-10 metrics fold is correct, and theming now reads only the current cycle. The SQL tally matches the Python tally, the replay hash is the same on both, and every ballot is checked against its exact theme set. The 1M aggregation is measured and matches the backlog. All the backend and SIM/LIVE parity tests I ran pass. Fixing CQS as described (replace instead of append, a single winner, one cycle, plus a live_db proof that calls it twice and again after a re-open) would earn my approval.

- **Required:** Make CQS scoring idempotent and limited to one cycle, the same way theming was fixed in round 10. (a) Before inserting new scores, delete the session's existing CQSScore rows for the cycle being scored, inside one transaction; or upsert on (session_id, response_id) with a unique constraint. (b) Clear any earlier is_winner rows before marking the new winner. (c) Read only the ResponseSummary rows whose ResponseMeta belongs to the session's current cycle, using the _current_cycle subquery that phase_b.py already has. (d) Add a live_db proof: call POST /sessions/{id}/ai/cqs twice, then in a re-opened cycle 2. It must answer 2xx each time, leave one CQSScore per eligible response and exactly one is_winner, keep cqs_scored == the number of eligible responses, and keep announce_reward_winner returning has_winner True.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:148
  - Evidence: score_cqs selects `ResponseSummary.session_id == session_id` (l.77, every cycle) and always runs `db.add(cqs)` (l.148) without removing earlier rows. There is no unique constraint in app/models/cqs_score.py. run_cqs_pipeline then looks up the winner with `cqs_result.scalar_one_or_none()` (l.227). I reproduced it against my own Postgres (scratch script, 3 eligible responses, offline provider, ENVIRONMENT=test). Run 1 printed `ok completed`. Run 2 raised `MultipleResultsFound`. The table then held `cqs rows 6 winners 1 responses 3`, and Cube 9 reported `{'winner_determined': False, 'cqs_scored': 6, ...}`, which is double the real count. POST /ai/cqs (cube6_ai/router.py:66) has no exception guard, so the second call returns 500. In a re-opened session the cycle-1 answers carrying the same label are scored again. If the label differs, two is_winner rows build up, and announce_reward_winner's `scalar_one_or_none()` (cube9_reports/service.py ~l.1015) falls into its except branch and returns has_winner False with an error.
  - Why it blocks: Scope item 1 says every API works. A second call to a public Cube 6 endpoint returns 500, and the Cube 9 outcome metric cqs_scored doubles. This is the class Krishna closed for theming in round 10 (one cycle, never every cycle's answers), and it is still open in the next stage of the same pipeline. It is not in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md, so it is an unlisted data-integrity defect.

Minor notes:
- Verified green at 97f349c, run without LIVE_DB_DSN/SIM_TEST_DSN (own per-run databases): backend tests/cube7 + cube9 + cube6 + live_db + test_frontend_client_paths gave 558-560 passed, 10 skipped (provider-key or LIVE_AI only). test_reopen_cycle, test_journey, test_openapi_sweep, test_sim_console_live and all 10 SQL-tally parity cases passed. Frontend cube-sim-live 837/0, mock-rankings 48/0, sim-console 35/0, sim-console-driver 20/0, theme-tiers, theme-ranked, ballot-themes, sim-parity and worker-api-routes all green.
- The round-10 metrics fold is correct. _theme_cycle = coalesce(report cycle, newest themed cycle) is evaluated in SQL. User metrics are two SQL counts. phase_b _fetch_summaries reads only the current cycle. Ranking submission checks the ballot against the exact Theme02 set for the ballot cycle, level and category (ranking_submission.py), so the SQL tally's trust in theme ids is justified.
- run_cqs_pipeline raises AttributeError when Session.seed is NULL (`effective_seed.encode()`, cqs_engine.py:216). Sessions created by the Cube 1 service always get a seed, so this only bites rows created another way. A `str(session_id)` fallback would remove it.
- CSV Theme2_*_Description looks descriptions up by label across the whole session (`{t.label: t.theme_summary_33}`), so the same label in two cycles or two Theme01 categories takes the last row's description. This is documented as 'label map stays session-wide'. Minor.
- Analytics theme01_distribution and summary_coverage are session-wide (all cycles), while its ranking block reads the report cycle. That is internally consistent with total_responses, but worth one line in the docstring, as metrics.py now has.
- HP-26 (per-stage meter including the 333/111/33 summary row before Theme02) is honestly recorded as CODE. sim_1m.py still times only the aggregation over seeded ballots, and the backlog says so.

### Athena (strategic test planning) — APPROVED

I checked commit 97f349c in /tmp/claude-0/wtm. I sign off scopes 1–3 under the test-planning lens. The test plan covers each scope with a gate, and CI enforces those gates.

What I ran and what passed:
- Backend, own databases: `ENVIRONMENT=test pytest` gave 3433 passed, 66 skipped. Every skip needs an outside credential: SUPABASE_URL/KEY, a live STT key, or LIVE_STT=1. With no LIVE_DB_DSN set, tests/live_db, test_sql_tally_parity and test_frontend_client_paths gave 16 passed, 0 skipped.
- Frontend gates, all green: cube-sim-live 837/0, mock-rankings 48, sim-console 35, sim-console-driver 20, cube10-unlock 10, worker-api-routes 40, theme-tiers 8, ballot-themes 42, sim-parity 3/3. All of these are in test:ci.

How the plan holds together:
- deploy.yml runs the backend against a Postgres 16 service.
- It fails the run if any live_db, sql-tally-parity or ballot-cycle proof is SKIPPED, so a quiet skip cannot pass.
- `ship` needs [gate, backend].
- The new client-path gate closes a class rather than one case: it reads every frontend api.*/request() path and checks it against the backend OpenAPI. It needs at least 40 calls to match, so the scan cannot pass while matching nothing. A second test removes allow-list entries once the backend serves them; the only one is HP-35, which is in the backlog.
- Scope 3 is proven in two ways: test_sql_tally_parity runs in CI on real Postgres, and sim_1m.py is the local 1M measurement.

The backlog states the remaining scale, infra and decision gaps honestly:
- HP-01/02/06/09/13: fan-out, poll storm, Realtime tier, KV and the hosted load test.
- HP-22: the admin code is 94561230 in SIM (easter-egg-context.tsx:203) but 96541230 in the backend (config.py:106). This is the one place SIM and LIVE still differ. It is a DECISION item.
- HP-35: DELETE /sessions/{id} has no backend route. It is an APPROVAL item.

Scalability scores lowest. That reflects these honestly recorded INFRA items, not hidden defects.


Minor notes:
- The cycle-2 report check in backend/tests/live_db/test_reopen_cycle.py:68 cannot tell the two cycles apart. In cycle 2, before any ballot, _report_cycle is coalesce(newest aggregation = 1, ...) = 1. So _theme_cycle (cube9_reports/metrics.py:69-74) gives coalesce(1, 2) = 1, and themes_available counts cycle 1's themes, not the cycle-2 themes being served. The assertion `themes_available == len(themes)` passes only because both cycles have the same number of themes, which line 89 also asserts. The round-10 record (docs/assessments/2026-10-07_asm_alignment_round10.md:28) says the test 'asserts the theme count equals the themes served' in both cycles. In cycle 2 that holds only by coincidence. Pick one meaning and test it with a case that would fail otherwise. Either assert themes_available against the cycle-1 count (the 'last finished snapshot' meaning, matching has_final_ranking), or switch _theme_cycle to the newest themed cycle and give cycle 2 a different theme count (for example, a different theme2_voting_level).
- exportable_responses and cqs_scored in metrics.py count across all cycles, while themes and ranking count one cycle. This matches the CSV, but the get_system_metrics docstring should say so, so the next reviewer does not treat it as drift.
- The client-path gate's regex skips paths that start with /api/, which leaves the Worker routes to test:worker-api-routes. That split is fine, but nothing checks that worker routes the frontend fetches with plain fetch() (not api.*) are served. A single list of frontend fetch targets across both backends would close that gap.
- HP-22 (the admin code differs between SIM and LIVE) is still the visible SIM/LIVE divergence for Cubes 1-10. It is a one-line decision and worth putting to the operator before the 12/12 sign-off.

### Christo (consensus & user-flow) — APPROVED

I reviewed 97f349c read-only, following the participant and moderator path through consensus (join, answer, theme, vote, report, re-open). I approve: scope 1–3 works, and what is left under my lens is minor or already in the backlog.

What I checked in the round-10 fold:

1. **Cube 9 report metrics** (backend/app/cubes/cube9_reports/metrics.py). `_theme_cycle` = `coalesce(_report_cycle, max(Theme.cycle_id))`. A session with themes and no votes now reports its themes, not 0. The final ranking and the winner still read `_report_cycle` (service.py:77-88). The docstring says plainly that after a re-open the last finished result is shown, which matches the CSV, so the moderator sees one consistent account. User metrics are now two counts in SQL.

2. **Theming reads one cycle.** In cube6_ai/phase_b.py:86, `_fetch_summaries` filters on `ResponseMeta.cycle_id == _current_cycle(session_id)`. A re-opened round is themed only from its own answers, which keeps each consensus round separate. `simCycleResponses` (mock-data.ts:896, used at 1499 and 1521) does the same in SIM.

3. **Client paths.** startTimeTracking and stopTimeTracking (lib/api.ts:286-290) now call `/sessions/{id}/time/start|stop`, which cube5_gateway/router.py:54 and :86 serve, with the participant token (PARTICIPANT_WRITE, api.ts:70). Nothing in the UI calls them yet, so no participant path changes. The dashboard's `DELETE /sessions/{id}` gap is recorded honestly as HP-35 (APPROVAL + CODE). In LIVE it shows a visible "Delete failed" message, so nothing fails silently.

Tests I ran (no LIVE_DB_DSN or SIM_TEST_DSN set, so each run used its own database):
- **Backend:** tests/core/test_frontend_client_paths.py, tests/cube7/test_sql_tally_parity.py, tests/live_db/test_reopen_cycle.py and tests/cube9 all passed (117 passed).
- **Frontend:** test:cube-sim-live, mock-rankings, sim-console, sim-console-driver, ballot-themes, theme-tiers, status-advance, cube10-unlock and worker-api-routes all passed. Run bare with `node --test`, cube-sim-live fails because it needs the alias loader that its npm script passes.


Minor notes:
- The cycle-2 'before first ballot' check in test_reopen_cycle.py:67-68 asserts themes_available == len(themes) of cycle 2. But _report_cycle there is still cycle 1, the newest one aggregated, so the count comes from cycle 1's themes. The two counts match because both cycles have the same theme structure, so the assert cannot tell the cycles apart. This matches the docstring's 'last finished result' rule, but the commit's wording 'themes served in both cycles' claims more than the test proves. To pin it, compare theme ids or a cycle whose theme count differs.
- In a re-opened session, exportable_responses and export_hash_available stay session-wide (both cycles) while themes and the winner come from one cycle. This is documented in the docstring, but the moderator's report mixes the two kinds of numbers. A label such as 'all rounds' next to the response count would make that clear.
- startTimeTracking and stopTimeTracking are now correct but nothing in the UI calls them (grep finds no caller outside lib/api.ts). The time-on-task ♡ path is wired at the API but not yet driven by the participant flow.
- HP-35 (dashboard delete in LIVE) remains an operator decision and is honestly recorded.

### Aset (consistency validation) — APPROVED

The one thing I asked for last round is done. In backend/app/cubes/cube9_reports/metrics.py, _theme_cycle (lines 68-74) now counts themes from the report cycle and, when there is none, from the newest themed cycle: `func.coalesce(_cycle(session_id, None), newest_theme)`. get_system_metrics uses it for themes_available. The final ranking and the winner still read the report cycle through _cycle, the same cycle the CSV, analytics and ranking-summary use. The docstring says plainly that after a re-open the report keeps showing the last finished result until the new cycle is aggregated. The user metrics now come from SQL counts (func.count().filter(...)), so no Participant rows are loaded into memory.

I ran these checks myself, on my own per-run Postgres with LIVE_DB_DSN and SIM_TEST_DSN unset:
- tests/live_db/test_reopen_cycle.py PASSED. In both cycles it calls GET /reports/metrics after theming and before the first ballot, and checks themes_available == len(themes), has_final_ranking/winner_determined == (current_cycle > 1) and participants == 3.
- tests/cube9 together with tests/core/test_frontend_client_paths.py: 108 passed.
- Frontend: test:cube-sim-live 837/0 and test:mock-rankings 48/0.

Across cycles the reads now agree. Ballot counts, scale-info, readiness, the analytics winner, ranking-summary and the report metrics all read one cycle, and cycle 2's Theme01 response_count adds up to cycle 2's answers only. Scope items 1-3 are working as far as my lens reaches. I have no blocking issues. The minor notes below are documented behaviour or gaps in what the tests can tell apart, not defects.


Minor notes:
- metrics.py:73: after a re-open, once cycle 2 is themed but before it is aggregated, themes_available still counts cycle 1's themes (coalesce picks the report cycle first) while GET /themes serves cycle 2's. This matches the documented rule (the last finished result is shown, as in the CSV), but a reader may expect it to show the themes now on the ballot. If the operator wants the current themes there, that is a one-word change: put newest_theme first in the coalesce.
- test_reopen_cycle.py:67-68: in cycle 2 the pre-ballot check `themes_available == len(themes)` cannot tell cycle 1's count from cycle 2's, because the test asserts len(themes2) == len(themes1). Making one cycle produce a different number of themes, or asserting the ids directly, would pin the intended cycle.
- The SIM side (frontend/lib/mock-data.ts) does not serve a Cube 9 /reports/metrics equivalent. cube-sim-live checks parity through the /sim/cube/{id} section-metrics and harness shapes, so this is not a gap in the gated SIM/LIVE contract. It does mean the report-metrics cycle rule is checked only against LIVE.
- The CSV's theme-label map stays session-wide while its ranking reads the report cycle. This is documented in the metrics.py docstring and harmless, because theme ids are unique per cycle.

### Asar (synthesis & outcome) — APPROVED

I am approving round 11 at 97f349c. I checked every round-10 fix in the code and re-ran the tests end to end. Nothing turned up that is outside the backlog.

Tests run:
- Backend suite (ENVIRONMENT=test): 3433 passed, 66 skipped, 0 failed.
- Real-Postgres tests on their own per-run database, with no LIVE_DB_DSN or SIM_TEST_DSN set: tests/live_db (journey, openapi_sweep, reopen_cycle, sim_console_live) plus tests/cube7/test_sql_tally_parity.py, 14 passed.
- Frontend gates via npm run: cube-sim-live, mock-rankings, sim-parity, sim-live-source, theme-tiers, theme-ranked, ballot-themes, sim-console, sim-console-driver, worker-api-routes, ranking-shape, cube10-unlock, status-advance and ai-core all PASS.

Round-10 fixes checked in the code:
1. backend/app/cubes/cube9_reports/metrics.py: `_theme_cycle` returns `func.coalesce(_cycle(session_id, None), newest_theme)`. A session that is themed but not yet voted now reports its themes. The final ranking and the winner still read the report cycle. The docstring states plainly that after a re-open the last finished result is shown, the same as the CSV. The user metrics are now two SQL counts (`func.count().filter(...)`) instead of loading every Participant row.
2. backend/app/cubes/cube6_ai/phase_b.py:86: `_fetch_summaries` filters on `ResponseMeta.cycle_id == _current_cycle(session_id)`, so theming reads one cycle only. test_reopen_cycle passes against real Postgres.
3. frontend/lib/api.ts:286-290 now calls /sessions/{id}/time/start and /time/stop. These are served by cube5_gateway/router.py:54/86 and covered by the PARTICIPANT_WRITE regex. The class gate tests/core/test_frontend_client_paths.py allows exactly one known gap, `KNOWN = {("DELETE", "/sessions/{}"): "HP-35"}`. HP-35 is listed honestly as APPROVAL + CODE.

Scope 1–3 outcome:
- APIs: served and gated in both directions (OpenAPI sweep plus the client-path gate).
- Cubes 1–10: SIM and LIVE parity gates are green, and the live sim-console test passes.
- 1M polling: the harness (sim_1m.py) refuses non-local databases and is seeded so the same seed gives the same result. The SQL tally matches the Python tally in the parity test.

What remains is minor or recorded in the backlog (see minor_notes).


Minor notes:
- Backlog section C (HP-14..HP-19) has no 'Needs' column. These are plain CODE items that are still open; for example backend/app/cubes/cube6_ai/router.py:29-48 still checks `provider` against the whitelist but never passes it to `service.run_pipeline`. That is honest as a minor, but add a Needs column (CODE) so the table matches the acceptance bar's format.
- frontend/lib/api.ts startTimeTracking and stopTimeTracking have no UI caller (grep finds them only in lib/api.ts). That is harmless: the server already tracks time inside join and submit (create_login_time_entry, start_time_tracking in Cube 3). Say this in the HP list or in a comment, so a later round does not read it as a missing wire.
- Cube 9 metrics: `exportable_responses` and `cqs_scored` count the whole session, while the ranking counts read one cycle. The docstring says so; just make sure the console labels it the same way, so the operator does not compare a two-cycle response count with a one-cycle winner.
- HP-35 (DELETE /sessions/{id}) is correctly waiting on the operator's choice between hard delete and archive. Until then the LIVE dashboard shows a visible 'Delete failed' toast, so nothing fails silently.

### Pangu (cutting-edge) — NOT_APPROVED

I checked the Round 10 fold at 97f349c and it holds:
- `metrics._theme_cycle` falls back with coalesce(report cycle, newest Theme.cycle_id), so a session that is themed but not yet voted reports its themes.
- `phase_b._fetch_summaries` reads only the current cycle through the `_current_cycle` scalar subquery.
- The client-path class gate allow-lists only DELETE /sessions/{id}, which is recorded as HP-35.

12 tests pass on my own per-run database (test_reopen_cycle, test_frontend_client_paths, test_sql_tally_parity). Ranking aggregation at 1M (SQL tally, HP-05) is sound.

Under the cutting-edge/scale lens I found one unlisted defect on the scope-3 path. Phase B builds a Python list of every response id in the cycle and passes it as `.in_(meta_ids)` (phase_b.py:100-103). asyncpg refuses more than 32,767 bind parameters, and I reproduced that error with the repo's SQLAlchemy/asyncpg versions on local Postgres. So LIVE theming fails for any session with more than about 32.8k answers per cycle: no Theme01/Theme02 themes, nothing to vote on. cqs_engine.py:99 has the same pattern. The 1M harness never sees this because it seeds the themes directly and never runs the pipeline. The fix is small: a join or subquery instead of the client-side list, which also saves a round trip. It should come with a real-Postgres test that themes more than 32,767 responses. Once that is in, I would expect to approve; the other scale items (HP-01/02/06/13/26) are honestly recorded in the backlog.

- **Required:** Remove the client-side IN-list from _fetch_summaries. Load the summaries in the same statement: outer-join ResponseSummary on response_meta_id in the ResponseMeta query, or filter ResponseSummary by a subquery the way cube9 destroy_data does at service.py:850. Do the same in cqs_engine.py:99 (ResponseMeta.id.in_(meta_ids) over every eligible response in the top theme). Add a real-Postgres test that themes more than 32,767 responses in one cycle (offline provider), so a LIVE theming run over a large session is proven to reach Theme01 → 9 Theme02.
  - File: `backend/app/cubes/cube6_ai/phase_b.py`:103
  - Evidence: Line 100: `meta_ids = [m.id for m in metas]`. Then: `select(ResponseSummary).where(ResponseSummary.response_meta_id.in_(meta_ids))`. The app's engine is postgresql+asyncpg (config.py:9; SQLAlchemy 2.0.52, asyncpg 0.31.0). I ran the same pattern against the local Postgres: `select(...).where(col.in_(list(range(40000))))` fails with `InterfaceError: the number of query arguments cannot exceed 32767`. The pipeline (pipeline.py:112) calls _fetch_summaries before any sampling. cqs_engine.py:97-99 builds the same unbounded list.
  - Why it blocks: Scope 3 is 1M live polling where Theme01 → 9 Theme02 → 6 → 3, with summaries first. In LIVE, any session with more than 32,767 answers in a cycle cannot be themed at all: POST /ai/run fails in step 1, so there are no Theme02 themes to vote on. sim_1m.py hides this because it inserts themes directly and never runs the pipeline. The backlog does not list it. HP-13 and HP-26 cover load testing and per-stage metrics, not this hard failure. It is an unlisted defect on the 1M path.

Minor notes:
- phase_b.py:78 loads every ResponseMeta ORM row for the cycle into memory before sampling. At 1M that is heavy but works. Selecting only the needed columns, or streaming, would also cut peak memory toward HP-26's per-stage peak-MB row.
- The cube4 collector's `.in_(meta_ids)` (service.py:122,133) is bounded by page_size, so it is fine. Cube 9 destroy_data already uses a subquery, which is the right pattern to copy.

### Sofia (multi-perspective) — APPROVED

All three items I asked for in round 10 are now in the code at 97f349c.

(1) In backend/app/cubes/cube9_reports/metrics.py, the theme count now reads _theme_cycle (lines 69-74): `func.coalesce(_cycle(session_id, None), newest_theme)`, where newest_theme is max(Theme.cycle_id) for the session. A session that has themes but no votes yet now reports its themes instead of 0. The final ranking and the winner still read the report cycle.

(2) backend/tests/live_db/test_reopen_cycle.py:65-72 calls GET /reports/metrics after /ai/run and before the first ballot, in both cycles. It asserts themes_available == len(themes), and that has_final_ranking and winner_determined are true only when current_cycle > 1. Line 134 asserts participants == 3.

(3) The module docstring (lines 13-15) now says plainly that while a re-opened cycle is being voted and not yet aggregated, the report shows the last finished result, as the CSV does. docs/assessments/2026-10-07_asm_alignment_round10.md:9 corrects the round-9 overclaim.

Checks I ran, all passing: the live_db reopen test against its own Postgres database (1 passed); tests/core/test_frontend_client_paths.py together with tests/cube9 (108 passed); and the frontend gates cube-sim-live (837/0), mock-rankings (48/0), sim-parity (3/3) and sim-console-driver (20/0).

The other round-10 changes also hold. phase_b._fetch_summaries filters on ResponseMeta.cycle_id == _current_cycle (phase_b.py:86), and the live_db test proves cycle 2's Theme01 counts add up to cycle 2's answers. User metrics now count in SQL. The one client path the backend does not serve, DELETE /sessions/{id}, is recorded as HP-35 with Needs APPROVAL + CODE, which is honest.

Under my lens, what is left is minor.


Minor notes:
- The cycle-2 pre-ballot assertion in test_reopen_cycle.py:68 cannot tell the two cycles apart. After a re-open, cycle 1 is still the report cycle, so _theme_cycle resolves to 1 and the endpoint counts cycle 1's themes. The assertion passes only because len(themes2) == len(themes1) (asserted at line 89). This matches the documented 'report cycle, else newest themed' rule, but the test comment 'the report counts the themes that exist' overstates what it checks in cycle 2. Either compare against cycle 1's count there, or say in the comment that it is cycle 1's count.
- The themes_available line in the docstring could add that during an unaggregated re-open the count is the previous cycle's, the same as the final-ranking line says. Today a reader has to infer it from 'the report cycle'.
- Running tests/cube-sim-live.test.mjs directly with node fails to resolve the '@/lib/sim-data' alias. The npm script, which uses the ts-alias-loader, is the supported entry point and passes. It is cosmetic, but the test file header could name the npm script.
