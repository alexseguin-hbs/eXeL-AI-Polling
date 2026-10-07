# 12-AsM alignment — round 2 (2026-10-07, code at fc2a971)

Operator bar (addendum 7): Cubes 1–10 operational in SIM and LIVE, every API working, then each of the twelve lenses
APPROVED; a lens that is NOT APPROVED is re-asked after its feedback is folded.

**Approved: 10 / 12** (Odin, Enlil, Enki, Thoth, Athena, Christo, Aset, Asar, Pangu, Sofia). Means: Security 89.3 · Stability 90.5 · Scalability 88.1 · Efficiency 90.4 · Succinctness 86.6

Round 1 → round 2: approvals 0 → 10; means 75.7/80.5/72.5/80.6/77.8 → 89.3/90.5/88.1/90.4/86.6.

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | NOT_APPROVED | 84 | 87 | 80 | 89 | 84 |
| Odin (predictive / future-proof) | APPROVED | 88 | 91 | 85 | 91 | 86 |
| Enlil (implementation & build verification) | APPROVED | 91 | 92 | 90 | 91 | 88 |
| Krishna (integration & cross-module) | NOT_APPROVED | 90 | 82 | 88 | 88 | 84 |
| Enki (diversity & edge cases) | APPROVED | 88 | 91 | 88 | 90 | 85 |
| Thoth (data & analytics deep dive) | APPROVED | 90 | 92 | 91 | 92 | 89 |
| Athena (strategic test planning) | APPROVED | 91 | 92 | 88 | 90 | 87 |
| Christo (consensus & user-flow) | APPROVED | 88 | 91 | 88 | 89 | 86 |
| Aset (consistency validation) | APPROVED | 90 | 92 | 90 | 91 | 88 |
| Asar (synthesis & outcome) | APPROVED | 90 | 91 | 88 | 91 | 86 |
| Pangu (cutting-edge) | APPROVED | 90 | 93 | 91 | 92 | 90 |
| Sofia (multi-perspective): participant, moderator, operator/HI, integrator/SDK consumer and auditor views across SIM and LIVE | APPROVED | 91 | 92 | 90 | 91 | 86 |

## Folded after this round

- **Thor** — `/api/responses` (Trinity Path C) took anonymous writes for any code. Now a POST lands only for a keyed `/api/sessions` record in `polling` status, under a per-address budget; gate `tests/worker-api-routes.test.mjs` (unknown code 404, draft/ranking 409, flood 429). The residual (a forger inside a live polling session) is HP-30, Needs APPROVAL + Worker secret, because the fix needs the protected Path C client.
- **Krishna** — a real session's participant ballot sent the placeholder ids t1..t9 (422 on every human ballot). `lib/ballot-themes.ts` builds the ballot from GET /themes with the backend's rule (non-empty Theme02 at the voting level, scoped to theme01_category); `session-view.tsx` uses it outside simulation (ranking JSX only — Paths A–C untouched); the Admin Console driver uses the same function; gate `tests/ballot-themes.test.mjs` in test:ci.

Minor notes folded in the same commit (so the next round scores the current code, not the last):
- Odin — concurrent aggregations of one session+cycle serialize on a Postgres advisory lock; HP-08 marked FIXED; the (session, cycle, submitted_at) index and the SESSION_SECRET rotation rule recorded.
- Thor — worker routes answer a generic 502 and log the detail; `/api/sessions` POSTs are budgeted per address; Cube 5 time start/stop accept X-Participant-Token, so anonymous participants earn time.
- Thoth — the Python tally skips an unreadable ballot for both the ballot and its participant (index-aligned, same rule as the SQL jsonb filter); the SIM Borda width is the longest ballot, like the backend.
- Krishna — PHASE_A_WAIT_S 120 → 85 s, under the ~100 s Cloudflare origin timeout.
- Pangu — a keyless lobby-count rise is capped at +25 per request; quadratic Borda at 1M recorded as CODE.
- Christo — the console's last progress label says "Finished with N errors" when there were errors.
- Sofia — a moderator browser that lost its write key gets a console warning instead of a silent 403.
- Enlil / Christo / Asar — the cube-sim-live header says to run it through npm (the ts-alias loader).
- Enki / Asar — the participant token's limits (no expiry, sessionStorage, query parameter on the voice socket) recorded beside HP-07.

## What each lens said (verbatim)

### Thor (risk & security stress) — NOT_APPROVED

I checked all six items from my round-1 verdict in the code, and all six are done or honestly recorded. (1) Config: `environment` now defaults to "production". Every guard uses `is_dev_or_test` (a whitelist of only development and test), including the auth mock user, the Stripe webhook, the Cube 10 demo codes (503 outside dev/test), the participant-token secret and the AI provider factory. main.lifespan refuses to start when `startup_config_errors` reports a missing AUTH0_DOMAIN or SESSION_SECRET, or a Stripe key without its webhook secret. (2) HP-11: functions/api/sessions.js returns a random 32-byte write key once and stores only its SHA-256 hash, compared in constant time and never shown on GET. Changes to protected fields need the key; a keyless caller can only raise participant_count, and a count-only POST never creates a session. (3) Ownership: list_participants and the Cube 4 endpoints collected, collected/{id}, response-languages and summary-status all use require_session_owner. (4) HP-20: core/realtime_ws.py is deleted and not mounted (only a stale .pyc is left). (5) HP-07: core/participant_token.py signs HMAC-SHA256 over session_id:participant_id, verified in constant time. It is required on text submit (cube2), voice (cube3, including the websocket) and the time summary, and the ranking voter is resolved from the token alone. tests/core passes 109/109 under ENVIRONMENT=test. (6) HP-25: the backend pod synthesis has a reserve-before-call DailyBudget. The Worker-side global cap is in the backlog as INFRA + CODE with an exact fix, which is honest. Other risks I found are recorded: the 100/min per-address join limit and its anti-sybil trade-off (HP-28, DECISION), the in-process rate limits (HP-10) and the code mismatch (HP-22). One unlisted defect blocks approval: the sibling Worker route POST /api/responses still takes anonymous writes. Anyone can forge responses, with summaries, into any live session, and those rows feed the moderator's theming on the live MOCK_MODE site. Because the store is capped at 500 entries, about 500 forged posts also evict every real response. Fix it the way HP-11 fixed /api/sessions, or record it with its Needs, and I would approve.

- **Required:** Close the unauthenticated write to Trinity Path C / Channel C, or record it honestly in the backlog. Today any caller can append responses to any session's feed: arbitrary text, arbitrary participant_id, and pre-written summary_333/111/33. The live MOCK_MODE site merges those rows into the moderator's response set, and that set feeds AI theming. Because the blob is capped at 500 entries, about 500 forged POSTs also push every real response out of the store. The fix should match the HP-11 approach. Options: (a) refuse a POST unless /api/sessions holds a keyed record for that code in polling status; (b) at join (the count-bump POST) give each joiner a per-joiner HMAC credential signed with a Worker secret, and require it on POST /api/responses; (c) add a per-IP and per-session write limit. Or add an HP row with the right Needs (CODE, plus a Worker secret binding if needed). HP-09 currently covers only lost concurrent writes, not this.
  - File: `frontend/functions/api/responses.js`:84
  - Evidence: POST handler: no key or token check. `participant_id: body.participant_id || crypto.randomUUID()`, `summary_333: body.summary_333 || null` ... `const MAX_KV_ENTRIES = 500; const capped = items.length > MAX_KV_ENTRIES ? items.slice(-MAX_KV_ENTRIES) : items;`. It is dispatched live by worker.js PAGES_ROUTES `"/api/responses": responsesRoute`. The consumer, frontend/lib/mock-data.ts:1427, runs `fetch(`/api/responses?session=${session.short_code}`)` and pushes kvItems into localItems, the set returned by GET /sessions/{id}/responses and themed by the mock /ai/run. The backlog row for this route is HP-09 ('loses concurrent writes', Needs INFRA + CODE). Injection and eviction are not listed.
  - Why it blocks: This is an unlisted, defect-class security hole in a scope-1 API, the Cloudflare worker. It is the same class as HP-11, which was fixed for /api/sessions, but here it is still open on the sibling route. An anonymous attacker can poison or wipe the poll input of any live session by its short code, so the themes and votes built on that input cannot be trusted.

Minor notes:
- worker.js catch blocks return `String(e && e.message || e)` to the client (for /api/ai, /api/tmp, /api/notify and the PAGES_ROUTES). Internal error text leaks; return a generic message and log the detail with console.error.
- sessions.js 'adopt a pre-key record' path: anyone can claim the write key of a record stored before HP-11 by sending any protected field. This is documented, and it expires within the 24 h TTL. Acceptable, but name it in the HP-11 row as a transitional risk.
- /api/sessions and /api/responses have no per-IP limit. KV write and Cache abuse is unbounded (edge-rate.js exists and could be reused).
- cube5 GET /sessions/{id}/metrics (optional auth) lets any anonymous caller see per-session profit, moderator active time and $/min. Consider require_session_owner, or strip the moderator and profit fields for anonymous callers.
- cube4 POST /desired-outcome accepts anonymous callers (created_by None), so outcomes can be spammed on any session. Consider requiring the participant token.
- cube7 GET /rankings and /rankings/verify need only get_current_user, not ownership. Any logged-in user can read any session's aggregate. Fine if results are public by design; otherwise use require_session_owner or participant membership.
- cube5 time/start and time/stop resolve the participant only from an Auth0 user, so anonymous token-holding participants get a 404 and cannot earn time. This is a functional gap: accept X-Participant-Token here as cube2, cube3 and cube7 do.
- A per-process DailyBudget is N × the limit across workers. This is recorded in HP-25; move it to a shared Postgres row when the backend scales out.

### Odin (predictive / future-proof) — APPROVED

Round 2. All four of my round-1 requests are done in the code at fc2a971.

(1) Anomaly detection now scales like the tally. ranking_governance.py:438-444 sends Postgres to `_anomalies_sql` (line 538). That function counts each ballot's window in SQL: `count(*) OVER (PARTITION BY h ORDER BY submitted_at RANGE BETWEEN CURRENT ROW AND ... FOLLOWING)`, keyed on a `jsonb_hash_extended` hash. Only orderings that could form a burst come back to Python, and they stream back in partitions of 10,000. The rapid-fire check is pre-filtered with `GROUP BY participant_id HAVING count(*) > :maxn`. The burst scan itself (`_scan_bursts`) is the same code on both paths.

(2) verify_replay (line 886) now calls detect_voting_anomalies, then `_burst_exclusions`, then `tally_rankings(..., excluded, ..., hash_algorithm=stored_algorithm)`. That is the same exclusions, the same SQL tally and the same seed default (`seed or session.seed`) as the aggregation.

(3) deploy.yml:122-186 adds a `backend` job with a postgres:16 service, SIM_TEST_DSN and LIVE_DB_DSN. The job fails if any live_db or parity test shows SKIPPED, and the ship job declares `needs: [gate, backend]`.

(4) ranking_aggregation.py:234-256: `_feed_repeated` hands the digest at most `_HASH_FEED_BYTES = 1 << 20` bytes at a time.

What I ran:
- Backend suite with ENVIRONMENT=test: 3425 passed, 66 skipped (the skips are the DB-gated tests).
- I then started a local Postgres 16 and ran tests/live_db plus tests/cube7/test_sql_tally_parity.py against it: 13/13 passed. That covers the OpenAPI sweep, the 38-step journey and the LIVE sim console run.
- Frontend gates: cube-sim-live 837/0, sim-console-driver 20/0, sim-console 35/0, mock-rankings 40/0, worker-api-routes 33/0, cube10-unlock 10/0.

On that evidence scope items 1-3 are operational in both SIM and LIVE.

The real future risks are recorded honestly in the backlog with the right Needs: HP-01/02/06 for realtime fan-out, polling and Supabase caps (INFRA), HP-09 KV, HP-10 in-process rate limit and presence, HP-13 no hosted load test, the HP-25 global spend cap, HP-28 the shared-address limit (DECISION), and HP-29 10M/100M (deferred). Nothing unlisted rises above minor under my lens.


Minor notes:
- Backlog HP-08 row is stale: it still says 'BordaAccumulator is not wired into any path ... | CODE', but scale_engine.py:26 records it removed (HP-08, AsM r1). Strike it through as FIXED so a future reader does not rebuild it.
- Concurrent POST /rankings/aggregate for the same session+cycle: ranking_aggregation.py:414-421 deletes and re-inserts AggregatedRanking without an advisory lock, so two overlapping runs fail on the commit against the UniqueConstraint instead of one serializing behind the other. It is a moderator-only route, so this is rare. A pg_advisory_xact_lock(hash(session_id, cycle_id)) would make it deterministic.
- user_rankings has only ix_user_rankings_session_cycle (models/ranking.py:31). The anomaly window functions sort by submitted_at per session. An index on (session_id, cycle_id, submitted_at, id) would keep that sort cheap past 1M toward HP-29's 10M.
- spend_cap.DailyBudget is per process (N workers = N x the limit). The module docstring and HP-25 both say so, and the Postgres-row fix is already written in the backlog.
- Rotating SESSION_SECRET invalidates every outstanding participant token (core/participant_token.py). Worth one sentence in the ops runbook: rotate between sessions, never during one.

### Enlil (implementation & build verification) — APPROVED

I checked all three of my round-1 asks at fc2a971 and each is now in the code. (1) Backend CI gate: .github/workflows/deploy.yml has a `backend:` job (line 122) with a `postgres:16` service, SIM_TEST_DSN and LIVE_DB_DSN, and `python -m pytest -q -rs` piped through `set -o pipefail`. A follow-up step fails the job when a test under `tests/live_db/` or `test_sql_tally_parity` is reported SKIPPED (line 178). The ship job declares `needs: [gate, backend]` (line 186), so a red backend suite stops the deploy. (2) HP-11 write key: frontend/functions/api/sessions.js creates a random key on the first create, stores only `write_key_hash` (SHA-256) and returns the key once with a 201. It checks `X-Session-Key` (or `write_key`) with a constant-time compare. A caller without the key gets 403 on any change to a protected field, can only raise participant_count, and a count bump cannot create a session (404). publicView never returns the hash. The client half is in lib/mock-data.ts (lines 595-650): rememberSessionWriteKey and readSessionWriteKey keep the key, and the client sends the `X-Session-Key` header. (3) HP-07 participant token: core/participant_token.py signs a session-bound HMAC-SHA256 token of the form `<pid>.<mac>` and checks it with hmac.compare_digest. The secret is required outside dev/test, and startup_config_errors reports a missing SESSION_SECRET. cube1 join issues the token (router.py:432). cube7 POST /rankings resolves the voter from the token, refuses an invalid token with 403 and never falls back to another identity, and returns 401 when the caller has neither a token nor a login. cube2 text and cube3 voice (HTTP and WebSocket) call require_participant_identity or verify_participant_token. lib/api.ts and lib/sim-live-source.ts carry the token. Checks I ran myself: the backend suite with ENVIRONMENT=test gave 3425 passed, 0 failed and 66 skipped. The skips are the Postgres-backed tests, because there is no local database here; CI's no-skip step enforces them. In the frontend, test:cube-sim-live gave 837 passed, 0 failed (the SIM/LIVE gate) and test:worker-api-routes gave 33 passed, 0 failed. Within my lens I found no new defect outside the backlog. HP-26/27/28/29 are listed there with the right Needs.


Minor notes:
- I could not run the Postgres-backed live_db and SQL-tally parity proofs here because there is no database; they are trusted to CI's fail-if-skipped step and the reported Verify Live #2603. The next round should confirm a green backend job on the current SHA in the Actions history.
- Records stored before the write-key change have no hash, so the first settings write after the change claims them. This is documented as an intentional migration path (sessions.js lines 19 and 179), but it leaves a one-time window on legacy codes. Consider expiring it after a set date.
- Running `node --test tests/cube-sim-live.test.mjs` directly fails with ERR_MODULE_NOT_FOUND; it only runs through `npm run test:cube-sim-live` (which adds the ts-alias loader). A comment in the test file header would stop false alarms.
- The test suite emits a pytest deprecation warning (class-scoped fixture used as an instance method). This is cosmetic.

### Krishna (integration & cross-module) — NOT_APPROVED

I checked my three round-1 asks in the code, and all three are done.
(1) The 1M measurement now covers the whole POST /rankings/aggregate endpoint. sim_1m.py has `bench --endpoint`, which times run_ranking_pipeline including detect_voting_anomalies. On Postgres, the anomaly scan runs in SQL (`_anomalies_sql` / `_scan_bursts`, ranking_governance.py:419-582). HP-29 quotes "aggregate 1.6 s, whole endpoint 5.8 s".
(2) The LIVE console now waits for Phase A summaries. sim-console-driver.ts:116-147 reads `summarized` / `phase_a_complete` from /sim/responses, which waits up to PHASE_A_WAIT_S (sim_seed.py:38,106-176). Any shortfall goes into errors[].
(3) A simulation session can no longer call a paid provider by default. cube6 factory.provider_for_session (factory.py:194) forces offline for session_type "simulation" unless `ai_cost_approval` is set. Both Phase A (phase_a.py:84) and the pipeline (pipeline.py:99) call it, and the driver creates its session with session_type "simulation".
Cross-module checks: the join → participant_token → api.ts auto-header path is wired for responses, voice and rankings. The ENVIRONMENT=test default and startup_config_errors match the CI job. Tests pass: backend pytest 3425 passed / 66 skipped (live_db tests skip locally; CI fails if they skip), test:cube-sim-live 837/0, test:worker-api-routes 33/0.
One blocking defect, not in the backlog: in a real LIVE session the participant ranking UI sends the hardcoded SIM_THEMES ids "t1".."t9" (session-view.tsx:387/1215). RankingSubmit expects UUIDs, so every human ballot is refused with 422. The console paths go around this UI, so the gates stay green. The fix touches a protected file, so either an approved fix or an honest backlog entry with Needs: APPROVAL would earn my approval.

- **Required:** The participant ballot in a real LIVE session must rank the session's own Cube 6 themes at its theme2_voting_level, loaded with GET /sessions/{id}/themes and resolved like resolveThemesForLevel, so POST /rankings receives their UUIDs. The other option is to record this in the backlog as an HP item with Needs: APPROVAL, because session-view.tsx is a protected Trinity file.
  - File: `frontend/components/session-view.tsx`:1215
  - Evidence: Line 361: `const simPollData = simulationSessionId ? getSimPollBySessionId(simulationSessionId) : undefined;`. A real session therefore gets simThemes = SIM_THEMES (line 387), whose ids are "t1".."t9" (lines 191-200). Line 1214-1216 then renders `<ThemeRankingDnD themes={simThemes.length > 0 ? simThemes : SIM_THEMES} sessionId={simulationMode ? undefined : sessionId}`, and theme-ranking-dnd.tsx:229-230 posts `ranked_theme_ids: orderedThemes.map((th) => th.id)`. backend/app/schemas/ranking.py:11 declares `ranked_theme_ids: list[uuid.UUID]`, so every real participant ballot is refused with 422 before the new full-valid-set check in ranking_submission.py:119 even runs. session-view.tsx never fetches /themes, and the backlog has no entry for this. Line 1270 (ThemeResultsChart) uses the same SIM_THEMES fallback for results.
  - Why it blocks: Scope 3 is live polling with voting on 9 themes. The token plumbing (api.ts participantTokenFor, X-Participant-Token, the CORS header) and the Cube 7 validation are correctly integrated, but the only participant voting surface sends placeholder ids. A human in a real session therefore cannot cast a ballot. The console and sim/ballots paths go around the UI, which is why the gates (cube-sim-live 837/837, the live_db journey) stay green. This defect is not in the backlog.

Minor notes:
- /sim/responses can hold one request for up to 120 s (PHASE_A_WAIT_S) on top of the insert time. Behind the Cloudflare proxy (about 100 s origin timeout) a slow non-offline provider would show as a 524 at the edge rather than a phase_a_complete=false answer. Consider PHASE_A_WAIT_S < 90 or a poll endpoint.
- sim_seed._phase_a_tasks finds Phase A tasks by coroutine name plus cr_frame.f_locals['session_id']. It works and is covered by the live_db console run, but it is fragile: renaming run_phase_a_with_retry or wrapping it silently turns the wait into a no-op (returns True with no tasks). A task registry returned from cube2 submit would be sturdier.
- cube2 creates the Phase A task before sim_seed commits. Phase A reads in its own session (phase_a_retry.py:86), so the first attempt can race the uncommitted row and lean on the retry backoff.
- theme-ranking-dnd posts `replace_last`, which RankingSubmit silently ignores. Harmless, because re-vote replacement is server-side (allow_revote), but the field is dead.

### Enki (diversity & edge cases) — APPROVED

I checked all five of my round-1 asks against the code at fc2a971. All five are done.

1. **Repeated themes and wrong-length ballots are refused.** In `backend/app/cubes/cube7_ranking/ranking_submission.py:120-133`, a ballot like [A, A, B, C] fails the check `len(ranked_theme_ids) != len(submitted_set)` and is refused as "Duplicate theme IDs". A missing or extra theme, or a wrong length, fails `submitted_set != valid_ids or len(...) != len(valid_ids)`. An empty ballot also lands on this mismatch. The Cube 7 suite passes: 245 tests, 0 failures, run with ENVIRONMENT=test.
2. **The replay hash no longer grows with the number of identical ballots.** `ranking_aggregation.py:234-254` feeds repeated ballots to the digest in batches of at most 1 MiB (`_HASH_FEED_BYTES = 1 << 20`). `scripts/sim_1m.py` now has `--shape unanimous`, and the bench records `peak_rss_mb` at lines 202 and 237.
3. **SIM checks ballots the same way LIVE does.** `frontend/lib/mock-data.ts:926-951` (`_validateMockBallot`) refuses an empty ballot, non-string ids, duplicates, and missing or extra themes for the session's category and level. The POST handler returns `{__status: 400}` at lines 1503-1504. A re-vote is checked against the other ballots, not against itself.
4. **`ranking_method` reaches the tally, and `quadratic_borda` without stakes is refused.** `router.py:187-216` checks the method against an allowlist. It refuses `quadratic_borda` with 400 when no participant stakes are supplied, and passes the stakes through only for `quadratic_borda`.
5. **The per-address limit on join and submit is honestly recorded.** It is backlog item HP-28, marked DECISION, with the exact lines (`cube1_session/router.py:399`, `cube2_text/router.py:53`) and three options, each with its anti-sybil trade-off.

**Frontend gates.** Every gate I ran passes: cube-sim-live 837/0, mock-rankings 40/0, sim-console 35/0, sim-console-driver 20/0, ranking-shape 8/0, cube10-unlock 10/0. Run with bare `node --test`, cube-sim-live crashes on a module resolution error. That is because it bypassed the npm script's loader; it is not a defect.

**Participant token.** The new token (`core/participant_token.py`) is an HMAC tied to both the session and the participant, compared in constant time. It refuses to work outside dev/test when SESSION_SECRET is unset.

**Remaining issues.** I found nothing new under my lens that is unlisted and blocks approval. The open items are in the backlog with a correct Needs field: HP-10 (rate limits and presence in process memory), HP-25 (no global AI spend cap on the worker side), HP-28 (per-address limit, above) and HP-29 (10M/100M assessment, deferred). Scope items 1-3 are operational as far as my lens reaches.


Minor notes:
- When SIM has no theme rows and no earlier ballots, `_validateMockBallot` (mock-data.ts:940-942) accepts any ballot of unique strings. The second and later ballots are then checked against the first one, not against real themes. LIVE always has `valid_ids` from the database. SIM only reaches this case when a ballot is posted before any theming, which the console flow does not do, so it is minor.
- The participant token has no expiry and no rotation. It is bound to (session, participant), so a leaked token is good for that one session for as long as the session lasts. Consider recording this in the backlog next to HP-07.
- `mockBordaAggregate` takes the theme count from `ballots[0].length`, the same way the backend does. This is safe now that every ballot is validated to full length. Without that validation it would silently miscount, so the dependence is worth a comment.

### Thoth (data & analytics deep dive) — APPROVED

I checked all three of my round-1 asks in fc2a971 and each one is done.

(1) Duplicate and over-long ballots are now refused. In ranking_submission.py:121-133, `if len(ranked_theme_ids) != len(submitted_set)` raises "Duplicate theme IDs". It also refuses any ballot that is not exactly the valid set at full length (`submitted_set != valid_ids or len(ranked_theme_ids) != len(valid_ids)`). The regression tests are in tests/cube7/test_asm_r1_correctness.py: test_duplicate_theme_refused, test_duplicate_with_missing_refused, test_missing_theme_refused, test_extra_theme_refused and test_unknown_theme_refused.

(2) Both tally paths now use the same, order-independent number of themes (the Borda width). ranking_aggregation.py:259 `_ballot_width` = the longest ballot, and the SQL path at :213 uses `SELECT max(jsonb_array_length(ids))`. This replaces the old "first ballot" rule, which depended on row order. Because ballots are now validated to full length, the width equals the number of themes at the voting level. Parity is gated by test_mixed_length_ballots_same_width_both_paths and test_sql_and_python_tallies_agree. verify_replay goes through the same tally_rankings call (test_verify_replay_reproduces_the_aggregation).

(3) The SIM ranking matches LIVE. mock-data.ts:880 mockSeededTiebreakKey is SHA-256(`id:seed`). mockRankingReplayHash at :893 copies `_replay_prefix` and Python's sorted list order. I re-ran the backend `_compute_replay_hash` on the test's fixed ballots and got 599f07f2… and 199c94d4… (with cat=risk:lvl=9), the same as the values pinned in tests/mock-rankings.test.mjs. The mock picks its seed the same way LIVE does (?seed= → session.seed → session id), checks ballots with the same rules (_validateMockBallot), and adds the category and level to the hash the same way run_ranking_pipeline does.

Runs:
- Backend tests/cube7: 245 passed, 0 skipped. Postgres was reachable, so the SQL-tally parity and SQL-anomaly parity tests actually ran.
- Frontend: mock-rankings 40/40, cube-sim-live 837/837, sim-console-driver 20/20, sim-parity 3/3.

The cube6 pipeline order is right: the 33-word summaries are fetched first, then Theme01 is classified, then Theme02 is generated and reduced, then themes are assigned. Simulations resolve to the offline provider through provider_for_session.

Two analytics gaps are open but honestly recorded in the backlog: HP-26 (no per-stage measured rows or run hash yet) and HP-03 (deployed SIM ballots are kept per browser tab). What is left under my lens is minor (see minor_notes).


Minor notes:
- Backlog drift: HP-08 is still listed as open CODE ('BordaAccumulator is not wired ... double-counts living re-votes') in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md:30. But scale_engine.py:26 records the accumulator as removed (HP-08 AsM r1), and nothing in backend/app references BordaAccumulator any more. Strike the row and mark it done so the backlog stays honest.
- mock-data.ts mockBordaAggregate still sets `const n = ballots[0]?.length ?? 0; // backend: n_themes = len(all_rankings[0])`. The backend now uses the longest ballot (_ballot_width). Today the result is the same because _validateMockBallot enforces full-length permutations, but the comment is out of date. Use Math.max over ballot lengths to mirror the backend rule.
- ranking_aggregation.py Python path (around line 345): `all_participant_ids.append(pid)` runs even when a stored ballot is neither a list nor a {ranked_theme_ids} dict. In that case all_rankings and all_participant_ids fall out of step, and _weighted_borda_scores (quadratic_borda) would apply weights to the wrong voters. The SQL path filters these rows out with `jsonb_typeof(ids) = 'array'`. Append the participant id only when a ballot is appended. This cannot happen with ballots written by submit_user_ranking.
- HP-26 (per-stage StageMeter plus a run hash covering summaries → Theme01 → Theme02 9/6/3 → ranking) is still the main analytics gap. It is honestly listed as CODE. sim_1m.py still times only the aggregation.

### Athena (strategic test planning) — APPROVED

All three things I asked for in round 1 are now in the code at fc2a971, and I checked each one.

(1) CI runs the backend. .github/workflows/deploy.yml:122-181 adds a `backend` job with a postgres:16 service (health-checked) and sets SIM_TEST_DSN and LIVE_DB_DSN. A step checks that Postgres answers before the suite starts. The suite runs with `-rs`, and a step fails the job if any tests/live_db or test_sql_tally_parity test was SKIPPED. Line 186 makes the ship job wait on the backend: `ship: needs: [gate, backend]`.

(2) Ownership checks are in place. cube1 list_participants (router.py:440) and the ssses-metrics route (router.py:559) both use `require_session_owner(..., leads_read=True)`. The gate tests/test_api_contract_gates.py:323 `test_every_session_route_checks_ownership_or_is_a_listed_participant_route` now covers every mounted router module, and lines 342-343 explicitly require cube1, cube10 router, sim_seed and pod_router.

(3) The live-database proofs are committed as CI tests: tests/live_db/test_openapi_sweep.py (asserts at least 150 operations and none answering 500), test_journey.py::test_38_step_journey, and test_sim_console_live.py, which runs the HP-21 Admin Console sequence and checks that a real session refuses the /sim endpoints.

What I ran locally, against a reachable Postgres:
- Full backend suite (ENVIRONMENT=test): 3425 passed, 66 skipped. None of the skips are in live_db or the parity test; they are all live-provider or Supabase tests that need keys.
- live_db + SQL-tally parity + contract gates on their own: 54 passed.
- Frontend `npm run test:cube-sim-live`: 837 passed, 0 failed. It is wired into test:ci, along with the sim-console and sim-console-driver gates.

Strategically, the test plan now covers the three layers I care about, and CI runs them on every push before ship: unit/contract gates, real-database end-to-end proofs, and SIM↔LIVE parity. The remaining gaps are recorded honestly in the backlog: HP-13 (no hosted load test, INFRA), HP-26 (per-stage performance meter and run hash, CODE), HP-27 (AI method selector) and HP-28 (DECISION). None of them blocks scope 1–3.


Minor notes:
- backend/scripts/sim_1m.py and sim_compare.py (including the new --endpoint bench) are not exercised by any CI test. The tally path they measure is covered by tests/cube7/test_sql_tally_parity.py, but the scripts themselves can rot. A small-N smoke test (for example, 1,000 ballots with --endpoint) in the backend job would keep the 1M evidence reproducible.
- The fail-if-SKIPPED grep in deploy.yml:178 covers only tests/live_db and test_sql_tally_parity. tests/cube10/test_saved_csv_datasets.py skips 16 cases (8 each, from two skip sites) for want of a dataset file. If those datasets are meant to be part of the SIM proof, either name them in the guard or record why they skip.
- The pytest step pipes into tee under `set -o pipefail`, which is correct. The suite takes about 2.5 minutes locally, well inside the 30-minute job timeout.
- HP-26's StageMeter/run_hash would give the SIM and LIVE parity tests one per-stage hash to compare (summaries → Theme01 → Theme02 9/6/3 → ranking). When it lands, add it to test_sim_console_live as a SIM==LIVE assertion.

### Christo (consensus & user-flow) — APPROVED

I am approving. All three items I asked for in round 1 are now in the code at fc2a971.

(1) The ranked Theme02 result now appears under its own heading. In frontend/components/sim-admin-console.tsx, rankedHeading (lines 64-67) reads "${category} · Theme 02 priorities (${level}, from the ranking round)". The section `sim-console-ranked` (lines 164-175) shows the ranked order (label and points), then the RankedThemes panel in that same order. Theme01 keeps its own section labelled "by response count".

(2) The HP-23 navbar gear stays on screen at 390 px. frontend/components/navbar.tsx sets shrink-0 on the controls, gives the cluster min-w-0 (`data-nav-cluster`) and uses px-4 gutters. frontend/scripts/nav-gear-smoke.mjs checks /session and /sim at 375 and 390 px, including that the unlock sequence actually starts. It runs in CI through postbuild (scripts/smoke-if-chromium.mjs line 16).

(3) A failed LIVE stage can no longer show as a clean Complete. frontend/lib/sim-console-driver.ts records every failure in errors[]: failed steps, refused responses, missing Phase A summaries, theming that did not complete, no ranking round, refused ballots. The console shows an Errors stat and a role="alert" panel headed "N stages failed — results below are incomplete", listing each stage with its HTTP status. The progress label still says "Complete" at the end, but the progress bar only shows while a run is in progress, so the error panel is what the operator sees.

From the user-flow side I also checked that the HP-07 participant token goes out with participant submissions: frontend/lib/api.ts stores it at join and sends X-Participant-Token on POST, and the backend's CORS allow_headers includes it. So the LIVE join → submit → vote path is not broken by the new security layer.

Tests I ran:
- Frontend gates, all passing: cube-sim-live 837/0, sim-console 35/0, sim-console-driver 20/0, mock-rankings 40/0, ranking-shape 8/0, cube10-unlock 10/0.
- Backend tests/cube7 and tests/cube1 with ENVIRONMENT=test: 361 passed.

Under this lens, scope 1-3 works, and the remaining open items are recorded in the backlog with a correct Needs.


Minor notes:
- sim-console-driver.ts:216 always calls progress(1, "Complete") even when errors[] is not empty. It is hidden once running is false, but a label like "Finished with N errors" would be more honest during the last frame.
- sim-admin-console.tsx shows the ranked list twice: once as a plain <ol> (label · points) and once as the RankedThemes panel in the same order. That reads as repetition on a 390 px phone; consider showing the points inside RankedThemes instead.
- Running tests/cube-sim-live.test.mjs directly with plain node fails with ERR_MODULE_NOT_FOUND. It only works through `npm run test:cube-sim-live` (which uses the ts-alias loader). A comment at the top of the file would save a reviewer's time.
- nav-gear-smoke only runs when Chromium is present (smoke-if-chromium). Make sure the CI deploy job always installs Chromium before the build, so the HP-23 gate cannot be skipped without anyone noticing.

### Aset (consistency validation) — APPROVED

I approve. All three items from my last verdict are now in the code at fc2a971.

(1) SIM ranking matches LIVE. In frontend/lib/mock-data.ts, mockSeededTiebreakKey (SHA-256 of `${themeId}:${seed}`) and mockRankingReplayHash (sorted ballots plus the same algorithm:seed[:cat=..:lvl=..]: prefix) reproduce the backend functions _seeded_tiebreak_key and _compute_replay_hash/_replay_prefix in ranking_aggregation.py:134-156 and 264-270. Both sides sort by score descending, then by the tie-break key ascending (ranking_aggregation.py:410). Both pick the seed the same way: ?seed=, then session.seed, then the session id (router.py:214, and verify_replay at ranking_governance.py:912-921). The two hashes in tests/mock-rankings.test.mjs (599f07f2… and 199c94d4…) are labelled in the test as computed by python3 from the backend functions. I checked the 1M SQL path: _sql_tally streams the ballots in byte order (COLLATE "C") through _feed_repeated, which produces the same bytes as the Python hash for UUID theme ids.

(2) The real-provider gate is enforced on the backend, so the console cannot get around it. provider_for_session (cube6_ai/providers/factory.py:194-206) sends a simulation session to the offline provider unless the HI has approved a cost estimate. Both Phase A (phase_a.py:84) and run_pipeline (pipeline.py:99) use it, and so does the embedder. The console creates session_type "simulation", so its "openai" request is downgraded to offline.

(3) The backlog now records HP-26 (performance indicators, with summaries before Theme02), HP-27 (AI-method selector, with the guard already built), HP-28 (DECISION) and HP-29 (10M/100M, deferred by the operator), each with evidence and a Needs value.

Gates I ran:
- frontend: mock-rankings 40/40, cube-sim-live 837/837, sim-console-driver 20/20, sim-console 35/35, sim-parity 3/3, theme-ranked 12/12, ranking-shape 8/8
- backend (ENVIRONMENT=test): cube7, cube10 and cube6 offline-provider tests, 763 passed, 16 skipped
The 16 skips are presumably the live_db tests, which the round notes say run in the postgres:16 CI job with fail-if-SKIPPED; I did not check those skip reasons myself.

I found no SIM/LIVE inconsistency that is missing from the backlog.


Minor notes:
- frontend/lib/mock-data.ts:907 has a stale comment: `const n = ballots[0]?.length ?? 0; // backend: n_themes = len(all_rankings[0])`. The backend now uses the longest ballot (_ballot_width, and max(jsonb_array_length) in SQL). The result is the same today, because ballot validation makes every accepted ballot a full permutation. But the SIM should use max length so it does not drift if validation is ever relaxed.
- HP-22: SIM and LIVE still accept different admin codes (94561230 vs 96541230). It is recorded as DECISION, so it does not block, but it is the one remaining place where SIM and LIVE behave differently at the unlock.
- The SIM ballot comparator compares JavaScript UTF-16 code units, while Python compares code points. They agree for the ASCII/UUID theme ids used today. Note this in a comment if non-ASCII theme ids are ever allowed.
- There is still no measured per-stage row (summaries 333/111/33, then Theme01, then Theme02 9/6/3, then ranking) and no run hash. This is honestly recorded as HP-26 (CODE).

### Asar (synthesis & outcome) — APPROVED

I checked my four round-1 items against the code at fc2a971. All four are done.

(1) An anonymous participant can now vote in LIVE. Join returns a signed participant_token (cube1_session/router.py:432). submit_ranking (cube7_ranking/router.py:102-108) accepts that token in place of a JWT: a bad token gets 403, no token and no login gets 401, and a re-vote replaces the earlier ballot. The client keeps the token in memory and sessionStorage and attaches it to responses, voice and rankings (lib/api.ts:36-75). The gate is tests/core/test_participant_identity.py::test_anonymous_participant_votes_with_the_token.

(2) HP-11 is closed. functions/api/sessions.js stores only the SHA-256 hash of the write key, returns the key once with the 201, checks it with sameHex, and never shows the hash on GET (publicView). A caller without the key can only raise participant_count. The backlog row is updated, and worker-api-routes passes 33/33.

(3) HP-23 is done. navbar.tsx has the min-w-0 / shrink-0 layout, and scripts/nav-gear-smoke.mjs checks the gear at 375 and 390 px. The check is wired into postbuild through smoke-if-chromium.

(4) The backlog now records the unbuilt addendum-6 work: HP-26 performance indicators and HP-27 AI method selector, each with what exists now, the method to build, and a gate. HP-28 (shared-address throttling) is marked DECISION and HP-29 (10M/100M) is DEFERRED by the operator.

Test runs I did myself:
- Backend full suite: 3,425 passed, 66 skipped (the skips are the live_db group, which CI runs against postgres:16 and fails if they skip).
- tests/cube7 + tests/core: 354 passed.
- test:cube-sim-live: 837 passed. test:sim-console-driver: 20 passed.

The 1M work fits together. sim_1m.py seeds 3 Theme01 groups × 9 Theme02 and aggregates through the SQL tally, which has a parity test. The remaining blockers at 1M (HP-01/02 fan-out, HP-06 Realtime tier) are in the backlog marked APPROVAL/INFRA, which is the honest record.

Under my lens, scope 1-3 works, and what is left is either minor or already recorded in the backlog.


Minor notes:
- The real-database journey (backend/tests/live_db/test_journey.py:36-37,84-85) still votes as JWT users (`who.be(f"google-oauth2|user{i}")`), so anonymous token voting is tested only against a mocked DB. Adding one join → submit → rank step with X-Participant-Token and no Authorization header would turn the anonymous LIVE path from unit-proven into end-to-end-proven.
- Running tests/cube-sim-live.test.mjs with plain `node --test` fails with ERR_MODULE_NOT_FOUND because it needs the ts-alias loader. Always run it through `npm run test:cube-sim-live`, as test:ci already does.
- The participant token is kept in sessionStorage, so it does not survive a new tab or a closed browser. A participant who joins on one tab and votes from another has to re-join. This is acceptable, but it should be said in the UX copy or in HP-07.
- HP-26 (per-stage rows and a run hash) is still needed before anyone can see, outcome by outcome, that summaries (333/111/33 words) come before Theme02 at 1M. It is correctly recorded as CODE and is the next most valuable item for the synthesis view.

### Pangu (cutting-edge) — APPROVED

All five items from my round-1 verdict are done in fc2a971. (1) HP-07: backend/app/core/participant_token.py issues an HMAC-SHA256 token over "session_id:participant_id" and checks it with hmac.compare_digest. It is issued at join (cube1 router.py:432). cube7 router.py:102-108 resolves the voter from the token alone and returns 403 for a bad token, with no fallback. Cube 2, Cube 3 and Cube 5 call require_participant_identity, and startup_config_errors refuses to start without SESSION_SECRET outside dev/test. (2) Bounded replay hash: ranking_aggregation.py:234 sets _HASH_FEED_BYTES = 1 << 20, so _feed_repeated feeds the digest in batches of about 1 MiB, and the hash bytes are the same as the old join. (3) HP-11: functions/api/sessions.js stores only the SHA-256 write_key_hash, publicView strips it, and without X-Session-Key any settings change gets a 403. A keyless caller can only raise participant_count, and a count-only POST never creates a session. (4) HP-23: navbar.tsx uses min-w-0 on the cluster, shrink-0 on each control and a scrolling token strip. scripts/nav-gear-smoke.mjs checks 375 and 390 px and runs in postbuild. (5) HP-08: BordaAccumulator is removed from scale_engine.py. The one remaining mention, in tests/cube10/test_e2e_challenge_flow.py, is a code string inside a submission payload, not an import. Checks I ran: the whole backend suite with ENVIRONMENT=test gave 3425 passed, 66 skipped (the cube7 + core subset 354 passed). Frontend gates all passed: cube-sim-live 837, sim-console-driver 20, worker-api-routes 33, mock-rankings 40. The rest of scope 1–3 relies on the round-1 claims, which I did not re-measure: 1M aggregation at 5.8 s / 88 MB on one SQL tally path shared with verify_replay, and SIM ranking and replay hash identical to LIVE. The open items under my lens are either recorded in the backlog with the right Needs (HP-25 Worker spend cap INFRA, HP-26/27 CODE, HP-28 DECISION, HP-29 DEFERRED) or minor. Scope 1–3 is operational and I sign off.


Minor notes:
- Backlog is stale on HP-08: docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md line 30 still lists HP-08 as open with Needs CODE, but scale_engine.py:26 records the accumulator as removed. Strike it through as done, the way HP-07, HP-11 and HP-23 are.
- sessions.js lines 205-208: a keyless caller can set participant_count to any larger number (for example 10^9) in one POST. Capping each keyless rise (for example +N per request) or deriving the count from joins would keep the lobby count honest.
- sessions.js lines 179-189: the first settings write from anyone claims the key of a record stored before the key existed. This is recorded in the backlog and expires with the 24 h TTL, so it is acceptable; it will disappear once the old records age out.
- cube3_voice router.py:138: the voice WebSocket takes participant_token as a query parameter, as browsers require, so it can show up in access logs. Consider a short-lived ticket exchanged for the token, or stripping it from logs.
- Only the equal-weight ballot count runs in Postgres. The quadratic_borda path (tally_rankings Python branch) loads every ballot into memory, so quadratic voting at 1M will not reach the 88 MB figure. Worth a backlog line if quadratic sessions are expected at scale.
- Frontier idea for HP-26 / HP-29 (no change needed now): an incremental per-cycle tally table (theme, position, count) updated as each ballot is upserted would make aggregation scale with the number of themes rather than the number of voters at 10M / 100M. The SQL tally path already in place makes this an extension, not a rebuild.

### Sofia (multi-perspective): participant, moderator, operator/HI, integrator/SDK consumer and auditor views across SIM and LIVE — APPROVED

I approve this round. Both changes I asked for last round are now in the code and covered by gates.

(1) HP-23, the Settings gear at 390 px: done. In frontend/components/navbar.tsx (lines 63-73) the bar keeps 16 px gutters, and the long items scroll sideways inside their own strip, so the gear stays on screen and no control was removed. The gate is frontend/scripts/nav-gear-smoke.mjs, which checks 375 and 390 px on /session and /sim. It runs from the postbuild step smoke-if-chromium.mjs. That step skips on Cloudflare, which has no Chromium, but deploy.yml installs Chromium with `npx playwright install --with-deps chromium`, so the gear smoke runs on every push.

(2) HP-11, the session write key: done. In frontend/functions/api/sessions.js (lines 160-210) the first create stores only the SHA-256 hash of a random key and returns the key once with status 201. Every change to a protected field needs X-Session-Key (or write_key in the body), otherwise it gets 403. Without the key, a caller can only raise participant_count, and a bare count bump never creates a session. publicView keeps the hash out of every response. The client half in frontend/lib/mock-data.ts (lines 620-650) sends the key when this browser holds it, saves the write_key from a 201, and sends only the count when a joiner has no key. frontend/tests/worker-api-routes.test.mjs covers the cases: no key, wrong key, key in the header, key in the body, only the hash stored, and the client wiring. It passes 33/0 and is the first item in test:ci.

What I ran: worker-api-routes 33 passed, 0 failed. cube-sim-live 837 passed, 0 failed. Backend pytest (ENVIRONMENT=test) 3,425 passed, 66 skipped. The skipped tests are the live_db ones; they need SIM_TEST_DSN, which the CI backend job sets on its postgres:16 service, and they fail there if skipped.

Other points I spot-checked:
- HP-07, the signed participant token in backend/app/core/participant_token.py: it is HMAC-signed per session, checked in constant time, and has no fallback. A bad token gets 403 and never falls back to another identity. frontend/lib/api.ts sends X-Participant-Token, so anonymous LIVE voters work.
- Outside dev/test, startup_config_errors refuses to start the app without SESSION_SECRET or AUTH0_DOMAIN.
From the participant, moderator and integrator views, SIM and LIVE now share ranking validation, the tie-break and the replay hash.

Remaining minor points (none blocks approval):
- An old session record with no stored hash can be adopted by the first caller who writes settings. This is documented, and those records expire within the 24 h KV time-to-live.
- A browser without the key that sends a full 'update' fails silently with 403. That is harmless, but the moderator gets no feedback.
- Succinctness is the lowest pillar: long comment blocks, and a test:ci script that is one very long line.

The open items (HP-26/27/28/29, 10M/100M assessment) are honestly recorded in the backlog with their Needs.


Minor notes:
- frontend/functions/api/sessions.js:179 — a record stored before the change (no write_key_hash) is adopted by whichever caller writes settings first; acceptable only because the KV time-to-live is 24 h. Consider refusing adoption once the time-to-live window since deploy has passed.
- frontend/lib/mock-data.ts:620-650 — syncSessionToKV swallows a 403 (a browser without the key sends a full update); log it to the console or ?diag so an operator can see a moderator who lost their key.
- frontend/scripts/smoke-if-chromium.mjs:9 — the nav-gear smoke is skipped when the builder has no Chromium. deploy.yml covers it by installing Chromium, but `npm run build` on a dev machine without Chromium skips it (it prints SKIPPED, so the skip is not silent).
- backend: 66 tests skip locally without SIM_TEST_DSN. CI fails if they skip, but a local run reports green — keep the fail-if-SKIPPED rule visible in the docs.
- Succinctness: the test:ci script in frontend/package.json is one long line covering more than 150 gates, and the inline rationale comments are long. Grouping them would make the gate list easier to audit.
