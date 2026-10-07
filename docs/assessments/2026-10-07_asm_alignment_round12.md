# 12-AsM alignment — round 12 (2026-10-07, code at 5db382a, LIVE: Verify Live #2617)

**Approved: 4 / 12** (Odin, Enlil, Krishna, Sofia). Means: Security 87.3 · Stability 87.5 · Scalability 87 · Efficiency 87.3 · Succinctness 87.8

Trend (approvals): 0 → 10 → 8 → 12 → 9 → 6 → 2 → 9 → 11 → 7 → 8 → 4.

**Two of round 11's folds did not hold, and I claimed more than I proved:**

- **The time-tracking bound could be beaten two ways.**
  - Each entry rounded up to a whole minute, so 1-second start/stop loops still minted about 30× the honest rate.
  - The one-open-entry rule was a read-then-insert check, so parallel starts all passed it, and parallel stops could each mint.
  - Thor, Enki, Athena and Aset found these; on the round-11 code, four parallel stops all returned 200.
- **The round-11 CQS proof scored nothing.**
  - The offline provider rates answers at confidence 85, below CQS's 95 gate, so the test passed on 0 == 0 and never ran the code it claimed to prove (Thoth, Asar). My round-11 record and commit called it a proof. That was wrong.
  - That vacuous test hid a real defect: CQS raised on every anonymous session, the default (Thoth).
  - And a re-score with nothing eligible kept the previous cycle's winner (Aset, Asar).

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | NOT_APPROVED | 80 | 88 | 84 | 87 | 85 |
| Odin (predictive / future-proof) | APPROVED | 88 | 91 | 85 | 82 | 87 |
| Enlil (implementation & build verification) | APPROVED | 90 | 92 | 90 | 90 | 90 |
| Krishna (integration & cross-module) | APPROVED | 91 | 92 | 91 | 91 | 90 |
| Enki (diversity & edge cases) | NOT_APPROVED | 80 | 86 | 88 | 88 | 86 |
| Thoth (data & analytics deep dive) | NOT_APPROVED | 86 | 70 | 86 | 84 | 82 |
| Athena (strategic test planning) | NOT_APPROVED | 85 | 88 | 88 | 90 | 89 |
| Christo (consensus & user-flow) | NOT_APPROVED | 92 | 91 | 84 | 90 | 89 |
| Aset (consistency validation) | NOT_APPROVED | 84 | 87 | 90 | 91 | 90 |
| Asar (synthesis & outcome) | NOT_APPROVED | 90 | 84 | 86 | 85 | 87 |
| Pangu (cutting-edge) | NOT_APPROVED | 90 | 89 | 82 | 80 | 88 |
| Sofia (multi-perspective) | APPROVED | 91 | 92 | 90 | 89 | 90 |

## Folded after this round

- **Time tracking, made true under concurrency (Thor, Enki, Athena, Aset).**
  - **Start:** a partial unique index allows one open public entry per participant per session. The database decides, and a second insert returns 409.
  - **Stop:** the entry is locked (`SELECT … FOR UPDATE`) before anything is minted.
  - **Minting:** public time earns ♡ = floor of the participant's *accumulated* public minutes, and only the increase is minted (Token_Governance_Math.md §1). Seconds-long entries mint nothing until a whole minute accrues.
  - **Migration:** `backend/migrations/032_…sql` for existing databases. It closes duplicate open entries first, and was checked against a database in the old shape.
  - **Proofs (live_db):** four parallel stops give one 200 and three 409s. Six parallel starts give one 201 and five 409s. A seconds-long entry writes no ledger row.
  - **Proofs (unit):** 30 one-second entries mint 0 ♡; the entry that crosses a whole minute mints exactly 1.
  - **Verified to bite:** run against the round-11 code, the parallel-stop check fails with `[200, 200, 200, 200]`.
- **CQS, made to work and actually tested (Thoth, Asar, Aset, Enki).**
  - `cqs_scores.participant_id` is nullable: an anonymous answer is attributed by response_id (migration 032).
  - The session's scores are cleared before the early "nothing eligible" return.
  - The route checks the label by an exact lookup in the session's own Theme02 labels (raw or html-escaped), not by a character whitelist, so `&`, Hindi and Thai labels work.
  - **Proof:** the test pins eligibility (confidence 99) and runs on anonymous and identified sessions with the label "Privacy & Trust". It asserts one score per answer and exactly one winner after two runs, refuses a label that is not the session's (400), and leaves no old scores or winner when a later run has nothing eligible.
- **Theme assignments written as sets (Pangu, Odin).** Phase B upserts assignments in chunks of 2,000 rows (under the parameter limit) instead of one statement per answer. Child theme counts come from one pass over the answers. Proof: 40,000 assignments in one run, all written, under a time bound.
- **Minor notes folded:**
  - Theming and CQS read one `eligible_answers()` subquery, so CQS now applies the PII gate too (Thoth, Aset).
  - CQS locks the session row for its transaction, so concurrent runs serialise (Athena).
  - The cap and stop comments now say what the code does (Enki, Aset).
- **Every participant rate limit is in HP-28 (Christo).** `backend/tests/core/test_participant_rate_limits.py` reads the limiter's registry and fails when a participant route carries a limit HP-28 does not name.

## What each lens said (verbatim)

### Thor (risk & security stress) — NOT_APPROVED

Round 12, Thor. My round-11 ask is largely done in code: rate limits on start and stop, starts refused unless the session is polling or ranking, one open entry per participant, a 3 h cap on each entry, and a live_db test for these. Two problems remain, both verified in the code and neither in the backlog. First, calculate_tokens rounds each entry up (math.ceil). So 1-second start/stop loops within the new 30/min limit mint 1 ♡ + 5 ◬ per entry, about 30× the honest rate. That contradicts Token_Governance_Math.md (floor of accumulated minutes) and the router comment's own claim. Second, the one-open-entry check and the insert are separate steps with no unique index, so parallel starts can open several entries that each reach the 3 h cap. Fix both, each with a gate test, and I would approve. The other open items under my lens (HP-25/28/30/32/33/37) are honestly recorded with the right Needs.

- **Required:** Stop per-entry ceil rounding from minting a token for each short entry. Compute ♡ from the participant's accumulated session time as floor(sum of minutes) (Token_Governance_Math.md §1: `SI_tokens = floor(active_minutes)`, 'fractional minutes accumulate'), minting only the increase on each stop. Or refuse/zero any entry under 60 s. Add a gate: 30 one-second start/stop cycles mint 0 ♡ (or at most 1), not 30.
  - File: `backend/app/cubes/cube5_gateway/service.py`:119
  - Evidence: calculate_tokens: `heart = math.ceil(duration_minutes) if duration_minutes > 0 else 0.0`; `unity = heart * settings.unity_heart_multiplier`. stop_time_tracking writes a TokenLedger row for every entry with heart > 0. With the new limit of 30/min on start and stop (router.py:62,96) and one open entry at a time, a loop of start → stop after 1 s gives 30 entries/min, each worth 1 ♡ + 5 ◬. That is 30× the honest rate of 1 ♡/min. router.py:56 says 'N starts and N stops can never mint N times the tokens', which is false for short entries. test_time_entry_cap.py only tests the 10 h cap.
  - Why it blocks: This was the core of my previous ask (bound Cube 5 time tracking so it cannot be farmed). The cap, the live-session check and the one-open-entry rule are in place, but rounding each entry up still lets the public endpoint mint about 30× the tokens per participant, and every anonymous join adds another participant. It is not in the backlog.
- **Required:** Make the one-open-entry rule atomic. Add a partial unique index on time_entries(session_id, participant_id) WHERE cube_id='cube5' AND stopped_at IS NULL, and turn the IntegrityError into 409, or lock the participant row (SELECT ... FOR UPDATE) before the check. Add a live_db test that sends N concurrent starts and expects exactly one 201.
  - File: `backend/app/cubes/cube5_gateway/service.py`:139
  - Evidence: guard_public_start does a plain `select(TimeEntry.id).where(... TimeEntry.stopped_at.is_(None)).limit(1)` with no lock, and start_time_tracking then inserts and commits in a separate step. app/models/time_tracking.py declares only non-unique indexes (ix_time_entries_session/participant/action), so concurrent starts can all pass the check. The live_db test sends its starts one after another.
  - Why it blocks: Because the check and the insert are separate steps, a burst of parallel starts opens several entries at once, and each can earn up to the 3 h cap (180 ♡ + 900 ◬). That multiplies the cap the round-11 fold set out to enforce. It is not recorded in the backlog.

Minor notes:
- Previous ask, checked: mostly done. @limiter.limit('30/minute') on start and stop (router.py:62,96); guard_public_start refuses unless the status is polling/ranking and refuses a second open cube5 entry (service.py:139-157); MAX_TIME_ENTRY_SECONDS = 3*3600 caps the duration (service.py:133,214); live_db test_public_time_tracking_is_bounded plus test_time_entry_cap.py. What is left is the two items above.
- The start_time_tracking docstring in router.py says '♡ = floor(active_minutes)' but the code uses ceil. The docs disagree too: Token_Governance_Math.md says floor, CUBES_4-6.md says ceil. Pick one source of truth.
- The stop route does not re-check session status; this is acceptable because the 3 h cap bounds an entry left open after close.
- POST /rankings is now limited to 60/min (cube7_ranking/router.py:68). Good.
- Rate limits are per process (HP-37, INFRA) and keyed per address (HP-28, DECISION); both are honestly in the backlog.
- Ran backend tests/cube5: 128 passed.

### Odin (predictive / future-proof) — APPROVED

I checked all three of my round-11 requests in the code at 5db382a, and all three are done. (1) Phase B no longer binds a list of ids. backend/app/cubes/cube6_ai/phase_b.py:79-104 builds `eligible = select(ResponseMeta.id)...` once, covering the session, the current cycle and the PII gate. Both reads filter through it: `ResponseMeta.id.in_(eligible)` and `ResponseSummary.response_meta_id.in_(eligible)`. (2) The CQS engine is fixed the same way. cube6_ai/cqs_engine.py:78 uses an `in_cycle` subquery, and lines 106-113 use an `eligible_ids` subquery with the same theme and ≥95-confidence filter as the Python loop. Line 131 deletes the session's CQSScore rows in the same transaction as the new ones, so scoring is now idempotent. (3) ThemeSample is limited to one run. phase_b.py:713 deletes by session_id inside _replace_cycle_themes, and nothing reads past runs' samples. I checked the rest of app/ for `.in_(` lists that grow with the number of answers. The remaining ones use subqueries (cube2/3 metrics, cube9 destroy), are page-bounded (cube4), are chunked (cube10 sim_seed) or are sized by theme or session count. I ran the real-Postgres proofs on my own database (LIVE_DB_DSN and SIM_TEST_DSN unset): tests/live_db/test_bounds_and_scale.py, tests/cube5/test_time_entry_cap.py and tests/cube7/test_sql_tally_parity.py gave 13 passed and 0 skipped. That includes the 40,000-answer phase B fetch (6.5 s) and the double-POST CQS test with exactly one winner. Scope 1-3 is operational under my lens. The remaining scale items (read bursts HP-31/34, per-process limiter HP-10/37, no hosted load test HP-13, sim_1m inserting themes directly HP-26) are recorded with honest INFRA / CODE needs. One issue is not in the backlog; it is minor and noted below.


Minor notes:
- phase_b._store_results (backend/app/cubes/cube6_ai/phase_b.py:805-832) still writes theme assignments one row at a time: `for r in responses: stmt = pg_insert(ResponseSummary).values(...).on_conflict_do_update(...); await db.execute(stmt)`. At 1M answers that is 1M sequential round trips in one transaction, which goes against the CLAUDE.md rule 'no row-by-row'. Results are still correct, but the 40,000-answer proof only exercises _fetch_summaries, not the write path. Suggested fix: write in executemany chunks, or as one UPDATE ... FROM a VALUES/COPY staging table. It should be listed next to HP-26 so the cost of a 1M theming run is recorded.
- _fetch_summaries and score_cqs still hold every answer for the cycle in memory (ORM objects plus a list of dicts). This is bounded by HP-26's planned peak-MB StageMeter and not urgent, but streaming or yield_per would keep 1M+ cycles within worker RAM.
- test_bounds_and_scale.py inserts 40,000 answers with no TextResponse rows, so the PII-gate outer join is exercised only on the NULL side. A few PII-flagged-but-unscrubbed rows in that fixture would show the gate excludes them at scale.

### Enlil (implementation & build verification) — APPROVED

I checked the build at /tmp/claude-0/wtm (5db382a) myself and approve it. Every Round 11 fold works as described, the builds and gates pass, and the one gap I found is a small, existing race.

What I ran:
- **Backend suite** (ENVIRONMENT=test, no LIVE_DB_DSN or SIM_TEST_DSN): 3437 passed, 66 skipped, 0 failed. Every skip waits on a provider key or LIVE_STT, or on the gitignored large CSV fixtures. None of them is a database skip.
- **Real-Postgres proofs**: tests/live_db, tests/cube7/test_sql_tally_parity.py and tests/cube5/test_time_entry_cap.py ran on my own databases, created fresh per test: 18 passed, 0 skipped. That includes the 40,000-answer phase-B proof and the CQS idempotency proof.
- **Frontend gates**: cube-sim-live 837/0, sim-console 35/0, sim-console-driver 20/0, worker-api-routes 40/0, sim-parity 3/3.
- **TypeScript**: `tsc --noEmit` with the project's CLAUDE.md filter gives zero errors.
- **1M harness at 50k** (scripts/sim_1m.py seed + bench, local database only): seeding took 2.34 s; aggregate_rankings ran in about 0.22 s at 75 MB peak RSS; the --endpoint path (run_ranking_pipeline) ran at 87 MB. Both produced result hashes. I dropped my own database afterwards.

What I confirmed in the code:
- **Phase B** (backend/app/cubes/cube6_ai/phase_b.py:79-104): `eligible` is now one subquery (session, `_current_cycle` scalar subquery, PII gate). Both the ResponseMeta read and the ResponseSummary read use `.in_(eligible)`, so no list of ids is bound into the query.
- **CQS engine** (cube6_ai/cqs_engine.py:78-115): it reads one cycle through the `in_cycle` subquery and finds participants through the `eligible_ids` subquery. `delete(CQSScore)` runs in the same transaction before the new rows and the single commit at line 173. The NULL seed is guarded at line 233.
- **Theme samples**: `_replace_cycle_themes` deletes ThemeSample by session_id, and ThemeSample has an indexed session_id column.
- **Public time tracking**: the cube5 start and stop routes carry `@limiter.limit("30/minute")` with a `request: Request` parameter. The limiter is registered on app.state with the RateLimitExceeded handler. `guard_public_start` refuses when the session is not polling or ranking, and when the participant already has an open cube5 entry. Every entry's duration is capped at `MAX_TIME_ENTRY_SECONDS` (3 h, declared).
- **Rankings**: POST /rankings carries `@limiter.limit("60/minute")`.
- **SIM source viewer**: cube10 calls `inspect.unwrap` in both resolvers, so the newly decorated endpoints still show their own source.
- **Backlog**: HP-36 and HP-37 are recorded with their file and what each still needs.

Minor issues (none blocks approval):
- **Double-stop race**: service.stop_time_tracking reads the entry without a row lock (`select(TimeEntry).where(TimeEntry.id == time_entry_id)`, then checks `stopped_at is not None`). Two concurrent stops of one entry can both pass and write two ledger rows. `guard_public_start` has the same check-then-insert race for two starts at once. Both are bounded by the 30/min limit and the 3 h cap. A `with_for_update()` on the stop read, plus a partial unique index on open cube5 entries, would close both.
- **Wrong fallback in CQS**: cqs_engine.py writes `participant_id=meta_map.get(s.response_meta_id, s.response_meta_id)`. When there is no match it stores an answer id in the participant column. This predates Round 11; it should skip the row or log instead.
- **Two different result hashes**: the plain bench and the --endpoint bench of sim_1m give different hashes on the same seed. That is plausibly because the two runs hash different result shapes, but the harness docstring could say which hash sim_compare.py compares, so nobody reads the difference as non-determinism.


Minor notes:
- Double-stop race: backend/app/cubes/cube5_gateway/service.py stop_time_tracking reads the entry without a row lock, so two concurrent stops can both pass the stopped_at check and write two ledger rows. guard_public_start has the same race for two starts at once. Both are bounded by the 30/min limit and the 3 h cap. Fix: a with_for_update() on the stop read plus a partial unique index on open cube5 entries.
- backend/app/cubes/cube6_ai/cqs_engine.py: participant_id=meta_map.get(s.response_meta_id, s.response_meta_id) stores an answer id in the participant column when no participant matches. Existed before Round 11.
- backend/scripts/sim_1m.py: the plain bench and the --endpoint bench give different result_hash values on the same seed. The docstring should say which hash sim_compare.py compares.
- My runs: backend 3437 passed / 66 skipped, all skips key- or fixture-gated. Real-Postgres proofs 18/18 on databases created per test. Frontend gates: cube-sim-live 837/0, sim-console 35/0, sim-console-driver 20/0, worker-api-routes 40/0, sim-parity 3/3. tsc with the project filter: 0 errors.

### Krishna (integration & cross-module) — APPROVED

Krishna lens, round 12, checked on 5db382a in /tmp/claude-0/wtm. Tests I ran myself with no LIVE_DB_DSN or SIM_TEST_DSN set:
- Full backend suite: 3437 passed, 66 skipped, 0 failed.
- Real-Postgres proofs (tests/live_db including test_bounds_and_scale, test_sql_tally_parity, test_frontend_client_paths) on their own per-run databases: 19 passed.
- Frontend gates: cube-sim-live 837, sim-console 35, sim-console-driver 20, sim-live-source 55, cube10-unlock 10, mock-rankings 48, theme-ranked 12, ranking-shape 8. All green.

What I checked across cube boundaries:

(1) Cube 6 phase B and CQS. `_fetch_summaries` and `score_cqs` now share one eligibility subquery, scoped to the session, the current cycle (`phase_b._current_cycle`, a scalar subquery) and the PII gate. No answer-sized bind list is left. CQS imports `_current_cycle` from phase_b instead of writing its own copy, so theming and CQS cannot drift apart on which cycle they read.

(2) Cube 7 → Cube 5 → Cube 6 CQS handoff. Re-scoring deletes the session's CQSScore rows in the same transaction as the inserts, then marks one winner. Readers downstream are Cube 9 `service.py` (around lines 691 and 1005, by session and `is_winner`) and Cube 8 `disburse_cqs_reward`, which stores the score id only as a string `reference_id`. No foreign key points at `cqs_scores`, so the delete cannot break a dependent table.

(3) ThemeSample. Phase B is the only writer (`_store_results`). Nothing outside cube6 reads it, and no foreign key points at it. Deleting by `session_id` in `_replace_cycle_themes` is safe, and it also bounds the table.

(4) Cube 5 time tracking against Cube 1, 2 and 3:
- `guard_public_start` runs only on the public route.
- Cube 2 and Cube 3 (service and realtime) still call `start_time_tracking` / `stop_time_tracking` directly with cube_id cube2/cube3, so they never hit the guard. They do get the 3-hour cap, which is harmless for a single submission.
- Cube 1's join-time `create_login_time_entry` is written already closed (`stopped_at=now`), so it cannot trip the one-open-entry check.
- `api.startTimeTracking` and `api.stopTimeTracking` have no UI caller, so the new 409s cannot strand a screen.

(5) Rate limits. The decorators on time/start, time/stop and POST /rankings each take `request: Request`, as slowapi requires, and the suite exercises them.

(6) Cube 10 SIM source. `inspect.unwrap` resolves decorated endpoints. The regenerated `SIM_LIVE_SOURCE` matches the backend (sim-live-source and cube-sim-live gates are green).

HP-36 and HP-37 are recorded honestly with their Needs. Nothing in scope 1–3 is broken under my lens; the remaining items are minor.


Minor notes:
- cqs_engine.score_cqs returns early with `return []` when no answer qualifies (before the `delete(CQSScore)` at about line 131). So if a later cycle has no eligible answers, the session keeps the previous cycle's CQSScore rows and winner. Cube 9 reads CQSScore by session_id and is_winner (cube9_reports/service.py ~691, ~1005), so it would show the old cycle's winner as current. Fix: delete before the early return, or add cycle_id to CQSScore.
- Cube 10 SIM: inspect.unwrap means Cube 1 section A 'create_session' and section B 'join_session' now resolve to the thin router endpoints (app/cubes/cube1_session/router.py), not the service functions that hold the logic (short code, seed idempotency, capacity, payment, anon hash). Before, the service source appeared only because the slowapi wrapper failed the whitelist. If the workbench is meant to teach the logic, name the service functions explicitly, or prefer service.py over router.py on a name collision in _resolve_cube_sources / _resolve_named_sources.
- score_cqs deletes the session's scores and then awaits summarizer.batch_summarize (LLM calls) inside the same open transaction. The row locks and the transaction therefore stay open for the length of the provider calls. Running the delete just before the inserts, after the LLM batch, keeps the transaction short and still atomic.
- Cube 8's disburse_cqs_reward stores the CQS score id as a plain string reference_id. A re-score after a reward has been paid leaves that ledger reference pointing at a deleted row. There is no FK, so nothing breaks, but the audit trail cannot be joined. Worth recording before Cube 8 payouts are wired to CQS.
- HP-36: the navbar QR half is CODE only (generate the QR locally, drop the dead /api/v1/sessions/qr-generate call). Only the SDK-demo half needs INFRA. The row's 'CODE + INFRA' is honest taken as a whole.

### Enki (diversity & edge cases) — NOT_APPROVED

Scope 1–3 mostly holds under edge-case pressure. I ran the cube5, cube6 and cube7 SQL tally parity suites: 339 passed, 10 skipped. Ballots are protected by a unique constraint per participant and cycle, and re-votes replace the old ballot. Theming and CQS now read past the asyncpg bind limit through subqueries. CQS re-scoring is idempotent. The 52 Theme02 labels in the 5,000-row reference set all pass the CQS whitelist.

Four edge cases remain open, none of them in the backlog:
1. Time tracking still mints about 30x the honest rate from repeated one-second start/stop cycles, because ♡ uses ceil per entry. That contradicts the round-11 claim.
2. The CQS route's label whitelist refuses the html-escaped labels Phase B stores, and labels in Hindi or Thai. A winning theme with '&' or an apostrophe can never be scored, and the raw label silently matches nothing.
3. Stopping a time entry has an unlocked check-then-act race that can write two ledger rows.
4. The one-open-entry rule has no database constraint, so parallel starts both pass.

Fixing these four with live_db proofs would earn my approval.

- **Required:** Close the start/stop token farm that the round-11 bound leaves open. A one-second entry mints the same tokens as a full minute, so short start→stop loops (30/min allowed) mint 30x the honest rate. Either keep ceil only for the first entry and floor every later one, or merge a participant's entries per session into one rounded total before minting (or add a minimum duration per entry). Add a live_db test: N one-second start/stop cycles must mint no more ♡ than ceil(total seconds / 60).
  - File: `backend/app/cubes/cube5_gateway/service.py`:120
  - Evidence: `heart = math.ceil(duration_minutes) if duration_minutes > 0 else 0.0`. Checked by running it: calculate_tokens(1.0,'login') == calculate_tokens(60.0,'login') == (1.0, 0.0, 5.0). The router comment (router.py:54-56) says 'so N starts and N stops can never mint N times the tokens', but guard_public_start only blocks a second OPEN entry, and the limiter allows 30 starts and 30 stops per minute per address (per process, HP-37). The router docstring also still says 'floor(active_minutes)'.
  - Why it blocks: This is the abuse case round 11 said it closed, and it is still open: it runs sequentially, needs no concurrency, and inflates the append-only token ledger. It is not in the backlog.
- **Required:** Make the CQS route accept the theme labels the pipeline actually stores. Phase B html-escapes every Theme02 label, and the route's character whitelist refuses ';', '#', '/', ':' and the combining marks of Indic and Thai scripts. Validate the label by looking it up in this session's Theme rows (an exact match, parameterised) instead of a regex, or take a theme id. Add a test that scores a theme whose label contains '&' and one in Hindi.
  - File: `backend/app/cubes/cube6_ai/router.py`:84
  - Evidence: `if not re.match(r'^[\w\s&\-.,()]+$', top_theme2_label): raise HTTPException(400, ...)`, while phase_b.py:294 and :379 store `html.escape(...)` labels. Checked by running it: 'Privacy &amp; Trust' False, 'Users&#x27; Trust' False, 'AI/ML Ethics' False, 'चिंता और जोखिम' False, 'ความเสี่ยง' False. Sending the raw 'Privacy & Trust' passes the regex but never equals the stored '&amp;' label in cqs_engine.py:93, so the call returns [] with no error.
  - Why it blocks: The CQS reward (Cube 6 to Cube 8) silently fails for any winning theme whose label has an ampersand or apostrophe, or is in many of the 33 supported languages. That is a diverse-input path inside scope 1–3, and it is not in the backlog.
- **Required:** Make stopping a time entry atomic so two concurrent stops cannot both mint. Use `UPDATE time_entries SET stopped_at=now() ... WHERE id=:id AND stopped_at IS NULL RETURNING`, or `select(...).with_for_update()`, before writing the TokenLedger row. Add a live_db test: two parallel POST /time/stop calls on one entry write exactly one ledger row.
  - File: `backend/app/cubes/cube5_gateway/service.py`:201
  - Evidence: `result = await db.execute(select(TimeEntry).where(TimeEntry.id == time_entry_id))` reads with no lock; the `if entry.stopped_at is not None: raise 409` check and the `TokenLedger(...)` insert follow in separate steps. Under READ COMMITTED both requests see stopped_at NULL, and each adds a ledger row.
  - Why it blocks: A double-tap or a client retry on a mobile network double-mints into the append-only ledger. It is a check-then-act race on a token write, and it is not in the backlog.
- **Required:** Back the 'one open public entry per participant' rule with a partial unique index (session_id, participant_id) WHERE cube_id='cube5' AND stopped_at IS NULL, and map an IntegrityError to 409. Today two parallel starts both pass guard_public_start.
  - File: `backend/app/models/time_tracking.py`:51
  - Evidence: `__table_args__` holds only non-unique Index entries (session, participant, action). guard_public_start (service.py:139-157) does a SELECT and then start_time_tracking does a separate INSERT and commit, with no constraint between them.
  - Why it blocks: The round-11 invariant ('at most one open entry') holds only for sequential callers. Combined with item 1, parallel opens multiply the mint. It is not in the backlog.

Minor notes:
- cqs_engine.score_cqs returns [] before its delete when no answer is eligible, so a re-score on a label with no eligible answers leaves the previous label's scores and winner in place.
- cqs_engine.py:150 `participant_id=meta_map.get(s.response_meta_id, s.response_meta_id)` falls back to a response id as a participant id. It cannot happen today (both reads share in_cycle), but the fallback hides a broken invariant instead of raising.
- The cube5 router docstring says '♡ = floor(active_minutes)' while service, model and docs say ceil, and the stale text is mirrored into frontend/lib/sim-live-source.ts.
- POST /rankings accepts a ballot while the session is 'polling'. Theme-id validation catches it before themes exist, but the error a participant reads would be clearer if it said ranking is not open yet.

### Thoth (data & analytics deep dive) — NOT_APPROVED

I checked my round-11 ask first. In the code it is done: score_cqs deletes the session's prior CQSScore rows in the same transaction as the new ones, reads only the current cycle through a subquery, and no longer fails on a NULL seed. On an identified session, three runs on real Postgres leave one row per eligible answer and one stable winner. But the live-DB proof shipped for it scores nothing: with the offline provider the label resolves to "None", eligible is 0, and the assertions pass on 0 rows. That vacuous proof hides a real defect. Sessions are anonymous by default, so ResponseMeta.participant_id is NULL, and CQSScore.participant_id is NOT NULL with a foreign key to participants. So POST /ai/cqs returns 500 (NotNullViolation) whenever any answer is eligible on a default session, and the Cube 5 orchestrator swallows the error, so no winner is ever recorded. This is not in the backlog. The rest holds up under my lens: the bounded phase-B fetch reads 40,000 answers past the bind limit, and the SQL tally parity, Cube 6 and time-cap suites pass. Fixing CQS for anonymous sessions and making the proof exercise real eligible answers would earn my approval.

- **Required:** Make CQS work on anonymous sessions, which are the default. Today score_cqs builds CQSScore(participant_id=meta_map.get(s.response_meta_id, s.response_meta_id)). In anonymous mode ResponseMeta.participant_id is NULL, so the dict returns None and the insert breaks the NOT NULL constraint on cqs_scores.participant_id (models/cqs_score.py:39-40, ForeignKey("participants.id"), nullable=False). Even the fallback value, a response_meta id, would break the participants foreign key. Choose one: make cqs_scores.participant_id nullable with a migration and attribute the answer by response_id/anon_hash, or resolve the participant another way. Then the POST /ai/cqs route and the Cube 5 run_cqs_scoring path should both finish with one score per eligible answer and one winner.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:153
  - Evidence: I ran a scratch live-DB test on my own Postgres, outside the repo, with LIVE_DB_DSN and SIM_TEST_DSN unset. It created a default session (schemas/session.py:20 sets anonymity_mode = "anonymous"), got 4 answers (ResponseMeta.participant_id came back [None, None, None, None]), and set theme2_3="X" with confidence 99. POST /ai/cqs returned 500 three times in a row: asyncpg NotNullViolationError: null value in column "participant_id" of relation "cqs_scores". The same test with anonymity_mode="identified" passed: 3 runs gave 4 rows and exactly 1 winner, the same winner each time. The defect is not in the backlog (no grep hit for 'cqs' in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md).
  - Why it blocks: CQS (CRS-11: score the top Theme2 cluster, pick the reward winner) fails on every session created with default settings. The Cube 5 orchestrator catches the exception and logs 'scoring_degraded', so no winner is ever recorded and nobody sees the failure. Scope item 3 (polling, then voting, then the reward analytics) is not operational in the default mode.
- **Required:** Make the round-11 idempotency proof non-vacuous. test_cqs_scoring_twice_is_idempotent should assert eligible > 0 before scoring, for example by pinning theme2_3 and confidence >= 95 on the session's summaries the way my probe did, or by seeding answers the offline theming puts at >= 95. Run it on the default (anonymous) session as well as an identified one.
  - File: `backend/tests/live_db/test_bounds_and_scale.py`:98
  - Evidence: The test computes `label = row[0] if row else "None"` and asserts `rows == eligible` and `winners == (1 if eligible else 0)`. I instrumented score_cqs with a pytest plugin, and on the offline provider both runs logged 'scored 0 label None'. So the test passes with 0 rows and 0 winners and never touches the delete/re-insert/winner path. That is how the anonymous-mode 500 above got past a green run.
  - Why it blocks: Round 11 recorded "two POST /ai/cqs → one score per eligible answer, exactly one winner" as proven. The test passes with zero eligible answers, so it does not prove the claim. Under FIX THE CLASS rule 3, a proof that mocks away the branch under test does not count.

Minor notes:
- Previous ask (CQS idempotent, one cycle): mostly done in the code. delete(CQSScore).where(session_id) runs in the same transaction as the new rows (cqs_engine.py:131, single commit at :173). Only the current cycle is read, through the in_cycle subquery with _current_cycle (:78-85). Prior winners go with the delete. The NULL seed falls back to str(session_id) (:233). On identified sessions I confirmed 3 runs leave 4 rows and 1 stable winner on real Postgres.
- When a re-score finds no eligible answers, score_cqs returns [] at :93-100, before the delete at :131. The previous run's scores and winner stay in place, which is stale relative to the new top theme. Moving the delete above the early return would fix it.
- The winner flag is committed in a second transaction (run_cqs_pipeline :247-248). A failure between the two commits leaves scores with no winner. Low risk, but it could be one transaction.
- The CQS eligibility read (cqs_engine.py:81-85) has no PII gate. phase_b._fetch_summaries has one (TextResponse pii_detected & pii_scrubbed_text IS NULL). In practice such answers have no theme labels, so the impact is small. For parity, the same eligible subquery could be reused.
- Also verified: tests/live_db/test_bounds_and_scale.py, 3 passed on my own DB (the 40,000-answer phase-B fetch past the bind limit works). tests/cube7/test_sql_tally_parity.py + tests/cube6 + tests/cube5/test_time_entry_cap.py gave 212 passed, 10 skipped.

### Athena (strategic test planning) — NOT_APPROVED

Athena, round 12, on 5db382a. I ran the tests myself without LIVE_DB_DSN or SIM_TEST_DSN, so each run used its own database. Backend tests: live_db, cube5, cube6, cube7 SQL-tally parity and the client-path gate, 349 passed, 10 skipped, 0 failed. Frontend: test:cube-sim-live 837/0 and test:sim-console-driver 20/0.

Most of the Round 11 fold checks out under my lens:
- Phase B and CQS now filter by subqueries, with no bound id lists; the 40,000-answer live_db proof passes on real Postgres.
- A CQS re-run deletes the old scores in the same transaction and reads only the current cycle.
- ThemeSample is cleared by session_id on each run.
- Time entries are capped at MAX_TIME_ENTRY_SECONDS.
- Rate limits are on time start/stop and on POST /rankings.
- HP-36 and HP-37 are recorded honestly.

One gap blocks approval: the new 'one open public time entry' bound is a read-then-insert check with no database constraint behind it. I reproduced the race on real Postgres. Twenty parallel POST /time/start calls with one participant token returned 201 every time, leaving 20 open entries that can each be stopped to mint up to 3 h of ♡/◬. That undoes Thor's round-11 claim. The committed proof only issues its second-start calls one after another, so it cannot see this. The fix is small and needs no INFRA, DECISION or APPROVAL: a partial unique index (or a row lock) plus a gather-based live_db case. That alone would earn my approval. Scope items 1–3 are otherwise operational under my lens.

- **Required:** Enforce the 'one open public time entry per participant' rule in the database, not with a read-then-insert check. Add a partial unique index on time_entries(session_id, participant_id) WHERE cube_id = 'cube5' AND stopped_at IS NULL (model __table_args__ plus a migration), and map the IntegrityError to the existing 409. Another way that works is to lock the participant row (SELECT ... FOR UPDATE) inside guard_public_start and do the insert in the same transaction. Add a concurrent case to tests/live_db/test_bounds_and_scale.py::test_public_time_tracking_is_bounded: asyncio.gather of N starts with one token must give exactly one 201 and N-1 409s.
  - File: `backend/app/cubes/cube5_gateway/service.py`:139
  - Evidence: guard_public_start (service.py:139-157) runs `select(TimeEntry.id).where(... TimeEntry.cube_id == "cube5", TimeEntry.stopped_at.is_(None)).limit(1)` and raises 409 if a row is found. start_time_tracking (l.160-181) then does a separate `db.add(entry); await db.commit()`. Nothing in the database backs the rule: app/models/time_tracking.py __table_args__ has only plain Index on session_id, participant_id and action_type, with no unique or partial index. I reproduced it on a real per-run Postgres with no DSN set, using a scratch copy of the live_db harness (deleted afterwards). After join and /poll, `asyncio.gather(*[client.post(f"{A}/{sid}/time/start", json={"action_type": "responding"}, headers=hdr) for _ in range(20)])` returned `CODES [201 x20] OPENED 20`. The committed proof only issues its 'second start' calls one after another (`for _ in range(3): ... assert r.status_code == 409`), so it never tests the race.
  - Why it blocks: This is the Round 11 Thor fold, and it is claimed as closed: 'N starts and N stops can never mint N times the tokens' (router.py comment above start_time_tracking). Under parallel requests the claim does not hold. One anonymous join token can open up to the per-process limit (30/min per address, and HP-37 makes that N times wider across workers) of concurrent entries. Each can be stopped for up to MAX_TIME_ENTRY_SECONDS (3 h) of ♡/◬, and the inflated totals flow into the Cube 9 token sums. The 3 h cap limits each entry but does not stop the multiplication. Under my lens the gap is in the test plan: the proof covers only the sequential case of a concurrency invariant. The defect is not recorded in the backlog (HP-37 covers limiter storage only), so the acceptance bar counts it as an unlisted defect.

Minor notes:
- score_cqs (cqs_engine.py:131) deletes then inserts without a lock or unique constraint, so two concurrent moderator POST /ai/cqs calls could each leave a full set of scores. It is moderator-only and rare, so a minor issue. A unique index on (session_id, response_meta_id), or an advisory lock per session, would make the idempotence proof hold under concurrency too.
- The time-tracking proof's count assertion filters on action_type == 'responding' and relies on the join's login entry being closed. A comment explains this. Asserting stopped_at IS NULL count <= 1 would state the invariant directly.
- Running node --test on the frontend tests without the package.json loader fails on '@/' imports. Reviewers should always use the npm run test:* scripts. This is not a code defect.

### Christo (consensus & user-flow) — NOT_APPROVED

Christo lens, round 12, commit 5db382a. The round-11 fold works for the user flow. CQS is idempotent with one winner. Theming reads every eligible answer through a subquery: the 40k live_db test passes. Public time tracking refuses outside polling/ranking and caps each entry. The Cube 10 LIVE console casts its ballots through the batched /sim/ballots, so the new limits do not touch it. SIM and LIVE gates are green: cube-sim-live 837/0, the backend suites 486 passed and live_db 8/8. The participant ballot UI shows a refused vote and offers a retry rather than losing it. One unlisted defect blocks sign-off. This round added a per-address limit of 60/min to POST /rankings, and it is tighter than the join and submit limit that HP-28 already records as a venue/NAT DECISION. Ranking arrives in one burst when the moderator opens it, so a crowd behind one address would be largely refused at the consensus step. The backlog does not record it: HP-28 names only join and submit, and nothing mentions the ranking or time-tracking limits. To earn approval: key the ballot limit on the participant token or size it for a venue, or at minimum fold rankings and time start/stop into HP-28 with a gate that lists every per-address limit on a participant route. Everything else under this lens is minor.

- **Required:** Fix the per-address limit on POST /rankings before a venue crowd hits it. Either key the ballot limit on the session-scoped X-Participant-Token, or give the address a ceiling sized for a hall, or at minimum add POST /rankings (60/min) and the time start/stop routes (30/min) to HP-28's evidence and options. HP-28 currently names only join and submit at 100/min. Add a gate (for example in tests/core) that lists every per-address @limiter.limit on a participant route, so the next limit added cannot leave the backlog behind.
  - File: `backend/app/cubes/cube7_ranking/router.py`:68
  - Evidence: Round 11 added `@limiter.limit("60/minute")  # a re-vote replaces the ballot, but every call still validates and writes (Thor, r11)` to POST /rankings. It is keyed on `get_real_client_ip` (core/rate_limit.py:24, CF-Connecting-IP). The backlog's HP-28 row (line 63) says 'Join and submit are limited to 100/min per address' and cites only cube1_session/router.py:399 and cube2_text/router.py:53. Neither the ranking limit nor the time-tracking limits (cube5_gateway/router.py:62, 96) appear there or in any other HP row. The round-11 record (docs/assessments/2026-10-07_asm_alignment_round11.md:40) states the limit and does not note the NAT effect. The participant UI theme-ranking-dnd.tsx:230 posts one ballot per participant. On a 429 it shows a destructive toast and lets the voter retry (C7-5), so nothing is lost silently, but the voter is refused.
  - Why it blocks: Voting is the consensus step of scope 3. Unlike join, it comes in one synchronised burst: the moderator opens ranking and everyone votes within about a minute. A 2,000-seat hall, campus or carrier-NAT crowd on one egress address gets 60 ballots a minute and about 1,940 refusals, which is tighter than the join limit HP-28 already flags as a DECISION. The acceptance bar says an unlisted defect blocks, and this one was introduced this round in the voting flow.

Minor notes:
- guard_public_start (cube5_gateway/service.py:139-157) checks for an open entry and then inserts, with no unique constraint and no lock. Two concurrent starts from one participant can both pass and leave two open entries. The tokens stay bounded (MAX_TIME_ENTRY_SECONDS caps each entry, plus the 30/min limit), so this is minor. A partial unique index on (session_id, participant_id) WHERE cube_id='cube5' AND stopped_at IS NULL would make the 'one open entry' claim exact.
- A participant who loses an entry id can recover through GET /time/summary/{participant_id}, which lists entries including the open one, so a lost id is not a dead end. The 409 'Stop the open time entry before starting another' could return the open entry's id to make recovery one step. No UI calls startTimeTracking today (only lib/api.ts:286 defines it), so the flow is SDK-only for now.
- The Cube 10 Admin Console's LIVE ballot path uses the batched POST /sim/ballots (sim-console-driver.ts:192), so the new 60/min ranking limit does not break the console's LIVE run. Only the mock path loops POST /rankings, and that never reaches the backend.
- Verified at 5db382a without LIVE_DB_DSN/SIM_TEST_DSN: backend tests/cube5 + cube7 + core gave 486 passed, and tests/live_db gave 8 passed (own Postgres, including the 40k bounds test and the CQS/time proofs). Frontend via npm run: cube-sim-live 837/0, sim-console-driver 20/0, sim-live-source 55/0, mock-rankings 48/0, ballot-themes 42/0, status-advance 10/0. Run bare with node --test, cube-sim-live fails because it needs the alias loader that its npm script passes, as recorded before.

### Aset (consistency validation) — NOT_APPROVED

I checked the round-11 fold at 5db382a for consistency. Most of it agrees across the pipeline. Phase B and CQS now share subquery filters (session, current cycle, PII gate), with no bound id lists. ThemeSample is replaced per session on each run. inspect.unwrap keeps the SIM source viewer intact for decorated endpoints. The rate limits on time start/stop and POST /rankings match the Cube 2 style. HP-36 and HP-37 are recorded honestly.

What I ran myself (no DSN set, own databases):
- Backend: 349 passed and 10 skipped across live_db, cube5, cube6, the SQL tally parity test and the client-path gate.
- Frontend: cube-sim-live passed 837 and failed 0.

Two consistency defects remain, and the backlog lists neither.
1. **Time-tracking bounds fail under concurrency.** The invariant written in the code ("N starts and N stops can never mint N times the tokens") holds only when requests arrive one after another. On real Postgres, 8 concurrent starts with one token opened 8 entries. Then 8 concurrent stops on one entry wrote 8 ledger rows. Both checks read first and write afterwards, with no unique index and no row lock.
2. **The CQS "replace" skips the no-eligible path.** That path returns before the delete. CQSScore carries no cycle, so a re-opened cycle with no eligible answers keeps showing the previous cycle's winner in the outcome metrics, the breakdown and the notification.

Scope 1–3 otherwise works under my lens. Fixing both items, each with a live_db proof, would earn my approval.

- **Required:** Make the time-tracking bounds hold under concurrency. guard_public_start reads first and inserts afterwards, and stop_time_tracking also reads first and writes afterwards, so neither bound holds when requests arrive together. Fix: (a) add a partial unique index on time_entries (session_id, participant_id) WHERE cube_id='cube5' AND stopped_at IS NULL, and map the IntegrityError to 409; (b) stop atomically, either with `UPDATE time_entries SET stopped_at=now() ... WHERE id=:id AND stopped_at IS NULL RETURNING *` or with SELECT ... FOR UPDATE, so that only one stop mints a TokenLedger row. Extend tests/live_db/test_bounds_and_scale.py with an asyncio.gather of N starts and N stops on the same entry, asserting one open entry and one ledger row.
  - File: `backend/app/cubes/cube5_gateway/service.py`:139
  - Evidence: Comment at router.py:54-56: "one open entry at a time ... so N starts and N stops can never mint N times the tokens". guard_public_start (service.py:139-157) runs `select(TimeEntry.id)... stopped_at.is_(None)`, and start_time_tracking then runs a separate insert and commit, with no unique index (models/time_tracking.py:53-55 has only plain indexes). stop_time_tracking (service.py:196-209) runs `select(TimeEntry).where(TimeEntry.id == time_entry_id)` and then `if entry.stopped_at is not None: 409`, with no lock. I reproduced this on real Postgres (a copy of the round-11 live_db harness in my scratchpad, no DSN set). With one participant token in a polling session, 8 concurrent POST /time/start returned [201]*8, so there were 8 open entries. Then 8 concurrent POST /time/stop on ONE entry id returned [200]*8, and the token_ledger had 8 'responding' rows for that single entry.
  - Why it blocks: Round 11 declared this invariant fixed (Thor's blocker), and the sequential test passes only because its requests run one after another. In practice one entry can mint up to 30 times its ♡/웃/◬ per minute per address, within the 30/min limit, and those totals reach the Cube 9 token sums. The declared invariant and the actual behaviour disagree, and the backlog does not record it.
- **Required:** Make CQS replacement consistent on every path. When the current cycle has no eligible answers, either delete the session's CQSScore rows before returning, or move the delete above the `if not eligible` early return, so that a 'no_eligible' result never leaves a previous cycle's scores and winner in place. A cleaner alternative is to give CQSScore a cycle_id and have the readers (cube9 service.py:694 and :1008, metrics.py:145) read the report cycle, as AggregatedRanking does.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:96
  - Evidence: `if not eligible: logger.info("cube6.cqs.no_eligible" ...); return []` (l.96-102) returns before `await db.execute(delete(CQSScore).where(CQSScore.session_id == session_id))` (l.131). The comment at l.129-130 claims "a re-score replaces the session's scores (and its one winner)". CQSScore has no cycle_id (grep shows none in models/cqs_score.py), yet metrics.get_outcome_metrics counts `CQSScore.session_id == session_id` (metrics.py:145-146) next to a cycle-scoped winner_determined. cube9 service.py:1008 still notifies `is_winner` from those rows.
  - Why it blocks: Take a session re-opened for cycle 2 whose top Theme2 has no answer at 95% confidence or above. run_cqs_pipeline returns status 'no_eligible', but the outcome metrics, the CQS breakdown and the winner notification keep serving cycle 1's winner as the current result. Round 11 made the rest of the pipeline read one cycle; this path is the one place that does not. The backlog does not record it.

Minor notes:
- CQS's in-cycle filter (cqs_engine.py:78-80) leaves out phase B's PII gate. In practice the two agree, because only phase B writes the theme2 labels, but sharing one eligible-answers helper would make that explicit.
- stop_time_tracking does not check whether the session is still live. That is acceptable, since a stop closes and caps an entry, but say so in the guard's docstring so the asymmetry reads as intended.
- MAX_TIME_ENTRY_SECONDS also caps the internal Cube 2/3 entries. That is harmless, since those entries last seconds, but the comment says the bound applies only to the public route.
- exportable_responses in cube9 metrics.py:84-87 counts every cycle, while the other counts are per cycle. Elsewhere the docstrings say the whole-session scope is intentional; say the same here.
- Running the cube6 real-CSV tests from a copy of backend/ outside the repo errors, because they resolve the CSV relative to the repo root. In the real tree they pass.

### Asar (synthesis & outcome) — NOT_APPROVED

I checked Round 11 on real Postgres. Phase B now reads 40,000 answers through a subquery. Public time tracking is bounded and rate-limited. Theme samples are replaced on each theming run. The SIM and LIVE gates and the backend suites pass. The weak point is the CQS fix that was meant to make scoring idempotent. Its live_db proof checks nothing: offline theming gives confidence 85, below the >= 95 eligibility gate, so both runs score 0 answers and the asserts pass as 0 == 0. I confirmed this with a read-only probe plugin. The new delete and the one-winner guarantee are therefore unproven, while the record says they are proven. Also, when a re-opened cycle has no eligible answers, the function returns before the delete runs, so the previous cycle's winner is still announced. That is the cycle-2 case Thoth asked for, and the backlog does not list it. Fix both and I would approve.

- **Required:** Make the CQS idempotency proof actually exercise scoring. In test_cqs_scoring_twice_is_idempotent, make at least one answer eligible before the two POST /ai/cqs calls: set theme2_3 and theme2_3_confidence >= 95 on the session's ResponseSummary rows, or seed summaries the way the 40k test does. Then assert eligible > 0, rows == eligible and winners == 1, so the test can no longer pass on 0 == 0.
  - File: `backend/tests/live_db/test_bounds_and_scale.py`:98
  - Evidence: I ran the test with a probe plugin and changed no repo files. score_cqs received label='None' and scored=0 on both runs. Every summary came back as ('Cost Improvements', 85.0, 'Neutral Comments'): offline theming gives confidence 85, below the >= 95 gate at cqs_engine.py:91. The asserts `rows == eligible` and `winners == (1 if eligible else 0)` therefore pass as 0 == 0. The new delete(CQSScore) at cqs_engine.py:131 and the one-winner guarantee never run. The round-11 record and commit say 'Proof: two POST /ai/cqs → one score per eligible answer, exactly one winner'. No other test covers it: grep finds no idempotency test for CQS in tests/cube6.
  - Why it blocks: A fix reported as proven, whose proof runs nothing, is the class the project's own AAR forbids ('a green run and a broken phone coexisted'). The Thoth item from round 11 is unverified on real Postgres while the record says it is verified.
- **Required:** Clear the session's earlier CQS scores even when the new scoring finds no eligible answers. Move delete(CQSScore).where(session_id == …) above the `if not eligible: return []` early return, or run it in run_cqs_pipeline's no_eligible branch too and commit. Then add the cycle-2 case Thoth asked for: re-open the session, score a cycle that has no eligible answers, and assert announce_reward_winner returns has_winner False.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:96
  - Evidence: Lines 96-102: `if not eligible: logger.info("cube6.cqs.no_eligible", ...) return []` comes before line 131: `await db.execute(delete(CQSScore).where(CQSScore.session_id == session_id))`. cube9_reports/service.py:1005-1013 announce_reward_winner selects `CQSScore.session_id == session_id, CQSScore.is_winner.is_(True)` without a cycle filter. So when a re-opened cycle has no eligible answers, the previous cycle's scores and winner stay and get announced.
  - Why it blocks: Round 11 was meant to make CQS read one cycle and be idempotent. This path still shows a past cycle's result as the current one, and the backlog does not list it.

Minor notes:
- I ran these checks myself on my own per-run Postgres, with LIVE_DB_DSN and SIM_TEST_DSN unset. tests/live_db: 8 passed. live_db + cube7 SQL tally parity + cube5 + cube6: 347 passed, 10 skipped. Frontend: cube-sim-live 837/0, sim-console-driver 20/0, worker-api-routes 40/0. Scope 1 and 2 look operational under my lens.
- The 40,000-answer phase B proof is real: _fetch_summaries returns all 40,000 rows through the subquery, past asyncpg's bind limit. The time-tracking bounds are real too: 409 before polling, 409 on a second open start, exactly two entries, and stop_time_tracking caps duration with min(..., MAX_TIME_ENTRY_SECONDS).
- cqs_engine.score_cqs lines 81-94 load every ResponseSummary of the cycle into Python, 333-word text included, only to filter by label and confidence. The same filter already exists as SQL in eligible_ids at lines 106-111. At 1M that is one full-cycle load for a reward step. Putting the filter in the first query would cut it to the eligible rows.
- Scope 3: 1M voting on 9 Theme02 is measured by sim_1m.py, and the SQL tally parity tests pass. End-to-end theming at 1M (summaries → Theme01 → 9/6/3), with a measured per-stage row, is still HP-26 (CODE). The backlog lists it honestly.
- HP-36 and HP-37 are recorded honestly, with the correct Needs.

### Pangu (cutting-edge) — NOT_APPROVED

I would not sign off yet. My round-11 ask is done and tested: theming and CQS scoring no longer pass the answer ids as a bound list but filter them inside one query. I ran the 40,000-answer real-Postgres test on my own database and it passed (3/3 tests in that file). Looking for what fails next at 1M, I found one scale defect that the backlog does not list. After theming, phase_b saves each answer's theme labels with one database call per answer. I timed that same loop on local Postgres: 20,000 rows took 14.9 s, so 1M answers would take about 12 minutes, all inside the one theming transaction. On top of that, it recounts every answer separately for each of the 54 sub-themes. Nothing measures this step at scale: the 40k test only covers the read, and sim_1m.py only covers ranking (Cube 7). Scope 3 needs the 9 themes per category written before anyone can vote, so either batch the save and prove it on the 40k cycle with a time limit, or record it honestly in the backlog. Either one would earn my approval. Everything else under my lens is minor.

- **Required:** Write the 1M theme assignments as a set, not one upsert per answer. Either batch them (executemany through insert(...).on_conflict_do_update with a list of rows, in chunks of about 5,000, or COPY into a temp table followed by one UPDATE ... FROM), or add a backlog line with Needs: CODE. Also work out each child Theme's response_count with one Counter over (theme01, theme2_<level>) pairs instead of a scan of all responses per theme. Then extend tests/live_db/test_bounds_and_scale.py so it runs the write path, not only _fetch_summaries, on the 40,000-answer cycle, with a time bound.
  - File: `backend/app/cubes/cube6_ai/phase_b.py`:803
  - Evidence: Lines 803-827: `for r in responses: stmt = pg_insert(ResponseSummary).values(...).on_conflict_do_update(index_elements=["response_meta_id"], ...); await db.execute(stmt)` sends one statement per answer. I timed the same SQLAlchemy+asyncpg pg_insert...on_conflict_do_update loop against local Postgres: 20,000 rows took 14.9 s, so 1M is about 12 minutes, all inside the one theming transaction. Lines 767-771 also rescan every response for each of the 54 child themes (`sum(1 for r in responses if r.get(f"theme2_{level}") == t["label"] and r.get("theme01") == category)`). Round 11 moved the READ past the 32,767-parameter limit, and the 40k proof (test_bounds_and_scale.py:115-140) calls only _fetch_summaries. sim_1m.py measures only Cube 7, so nothing measures the WRITE at scale. The backlog has no line for it: a grep for upsert / row-by-row / C6-4 / phase_b in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md finds nothing. CLAUDE.md lists 'No row-by-row API calls' as an architectural constraint and sets '1M inputs ... < 60 seconds' as the target.
  - Why it blocks: Scope 3 is 1M polling with Theme01 split into 9 Theme02 each. Even with offline or Batch-API AI calls (HP-27), theming 1M answers would hold one transaction on response_summaries for about 12 minutes before the 9 themes exist to vote on. The backlog does not list it, so under the review rules an unlisted defect blocks approval.

Minor notes:
- My round-11 ask is DONE. phase_b._fetch_summaries (phase_b.py:79-105) builds `eligible` as a subquery (session, current cycle through _current_cycle, PII gate) and both reads use `.in_(eligible)`. cqs_engine.py:80-114 uses the `in_cycle` / `eligible_ids` subqueries, and no bound id list remains. I ran tests/live_db/test_bounds_and_scale.py on my own database (no LIVE_DB_DSN/SIM_TEST_DSN): 3 passed in 21.6 s, including the 40,000-answer cycle read in full.
- I swept every .in_( in app/: the remaining id lists are theme-sized (pipeline.py:444, ranking_aggregation.py:431, phase_b old_ids) or subqueries (cube9 destroy :850-858, cube3 voice metrics, cube2 metrics). cube4 collector is page-bounded. sim_seed chunks its list.
- The CQS subquery path (cqs_engine.py:104-114) has no test past 32,767. The code is safe by construction, but a test would lock it in.
- CQS still builds every eligible summary as an ORM object and sends one LLM item per answer (cqs_engine.py:86-127). With a 1M top theme that is the HP-27 cost/method question, already recorded.
- The ThemeSample replacement (phase_b.py:713), the time-entry cap (cube5 service.py:133,214) and guard_public_start (service.py:139) are all present as described.

### Sofia (multi-perspective) — APPROVED

Sofia, round 12, checked on 5db382a, from four perspectives: participant, moderator, operator and the 1M scale path. Every round-11 fold is in the code.

**Fixes verified in the code**
- **Phase B reads.** `phase_b._fetch_summaries` (phase_b.py:79-101) builds one `eligible` subquery (session, current cycle, PII gate). Both the ResponseMeta read and the ResponseSummary read filter with `.in_(eligible)`, so no list of ids is bound into the query.
- **CQS reads.** `cqs_engine.score_cqs` scopes to the current cycle through the `in_cycle` subquery. It finds participants through the `eligible_ids` subquery, and it runs `delete(CQSScore).where(session_id==…)` in the same transaction before adding new rows, then commits once.
- **Theme samples.** `_replace_cycle_themes` now deletes ThemeSample by session_id (phase_b.py:713). The old theme_id delete never matched.
- **Time tracking.**
  - Both routes in cube5_gateway/router.py carry `@limiter.limit("30/minute")`.
  - `guard_public_start` (service.py:139-157) returns 409 unless the session status is polling or ranking, and returns 409 when the participant already has an open cube5 entry.
  - `stop_time_tracking` caps `duration_seconds` with `min(…, MAX_TIME_ENTRY_SECONDS)` and returns 409 on a second stop.
  - The stop route checks that the entry belongs to the caller.
- **Backlog.** HP-36 and HP-37 are in it, each with a correct Needs value.

**Tests I ran** (no LIVE_DB_DSN or SIM_TEST_DSN set, so each run used its own database)
- Full backend suite: 3437 passed, 66 skipped, 0 failed.
- Real-Postgres proofs (tests/live_db, test_sql_tally_parity, test_time_entry_cap): 18 passed. This includes the 40,000-answer phase B test.
- Frontend: cube-sim-live 837 passed, 0 failed.

**By perspective**
- **Participant:** one join token can no longer mint tokens N times over.
- **Moderator:** running CQS twice gives one score per answer and one winner.
- **Operator:** the open items are recorded honestly.
- **Scale:** the asyncpg bind-limit problem is fixed as a class, not just at one call site.

Scope items 1–3 are operational under my lens. What remains is minor or already in the backlog.


Minor notes:
- guard_public_start then start_time_tracking is check-then-insert with no unique partial index on (session_id, participant_id) WHERE cube_id='cube5' AND stopped_at IS NULL. Two starts at the same instant can both pass the guard. The 30/min limit and the 3 h cap bound the damage, but a partial unique index would make 'one open entry' a database invariant rather than an application check.
- cqs_engine.score_cqs (cqs_engine.py:80-94) loads every ResponseSummary row of the cycle, all three summary tiers included, and filters by theme and confidence in Python. The eligible_ids subquery a few lines later already expresses the same filter in SQL. Selecting with that filter would keep only the winning theme's rows in memory at 1M.
- score_cqs runs the CQSScore delete before the provider batch calls and commits only after all of them. At 1M a winning theme can mean hundreds of batches, all inside one open transaction. Correctness holds, because a failure rolls back and keeps the old scores. Scoring first and then running delete+insert in a short transaction would shorten how long the locks are held.
- HP-37 (in-memory limiter per process) overlaps the existing HP-10 ('Rate limits and presence are in-process memory'). Merging them or cross-referencing one from the other would keep the backlog to one row per defect.
- HP-36's Needs is 'CODE + INFRA', but the navbar qr-generate half is pure CODE: generate the QR locally and drop the dead call. It could be split out and done without waiting for HP-03.
