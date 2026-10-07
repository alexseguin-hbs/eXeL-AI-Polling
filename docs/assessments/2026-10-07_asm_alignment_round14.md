# 12-AsM alignment — round 14 (2026-10-07, code at 3d989dd, LIVE: Verify Live #2619)

**Approved: 6 / 12** (Thor, Enlil, Enki, Thoth, Aset, Sofia). Means: Security 89.2 · Stability 88.4 · Scalability 85.2 · Efficiency 86.8 · Succinctness 86.2

Trend (approvals): 0 → 10 → 8 → 12 → 9 → 6 → 2 → 9 → 11 → 7 → 8 → 4 → 6 → 6.

**One class, from my round-13 wiring (Odin, Krishna, Athena, Christo, Asar, Pangu):**

- Round 13 made every ranking aggregation hand the winning Theme02 to CQS, and ran the scoring inside the aggregate request and its transaction.
- So the AI provider ran while the ranking response waited and the aggregation was uncommitted, with no bound on how many answers it scored.
- It also picked the provider as `session.ai_provider or "openai"`, around the simulation cost guard. A LIVE Admin Console run could send simulated answers to a paid provider with no approved estimate.
- And an answer the provider could not score was entered at 50 on every metric, where it could win the reward.

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | APPROVED | 90 | 91 | 89 | 88 | 84 |
| Odin (predictive / future-proof) | NOT_APPROVED | 87 | 87 | 80 | 84 | 83 |
| Enlil (implementation & build verification) | APPROVED | 91 | 92 | 90 | 90 | 88 |
| Krishna (integration & cross-module) | NOT_APPROVED | 89 | 87 | 79 | 82 | 86 |
| Enki (diversity & edge cases) | APPROVED | 91 | 90 | 88 | 88 | 86 |
| Thoth (data & analytics deep dive) | APPROVED | 92 | 92 | 91 | 91 | 90 |
| Athena (strategic test planning) | NOT_APPROVED | 90 | 90 | 84 | 86 | 88 |
| Christo (consensus & user-flow) | NOT_APPROVED | 85 | 87 | 83 | 85 | 89 |
| Aset (consistency validation) | APPROVED | 91 | 92 | 90 | 90 | 88 |
| Asar (synthesis & outcome) | NOT_APPROVED | 89 | 84 | 82 | 86 | 87 |
| Pangu (cutting-edge) | NOT_APPROVED | 84 | 78 | 77 | 82 | 81 |
| Sofia (multi-perspective) | APPROVED | 91 | 91 | 90 | 89 | 85 |

## Folded after this round

- **CQS runs after the ranking, not inside it (Krishna, Christo, Asar, Pangu, Athena).**
  - The aggregation commits before the broadcast, the webhook and CQS go out.
  - CQS then runs as a background task in its own session and transaction, under the pipeline semaphore and a 600 s timeout. The aggregate response never waits on a provider.
  - The dead `TypeError` fallback around the trigger is gone (Thor's note).
  - **Proof (live_db):** the aggregation test waits for the background scoring and finds one score per eligible answer and exactly one winner.
- **CQS uses the simulation cost guard (Odin, Christo, Pangu).**
  - The provider is resolved with `provider_for_session`, as phase A and the pipeline do.
  - The stored row names the provider that actually scored.
  - **Proof (live_db):** a simulation session asking for OpenAI with no approved estimate scores on offline.
- **No winner from unscored answers (Christo, Asar).**
  - An empty or invalid result, or a missing or out-of-range metric, leaves that answer out.
  - With eligible answers but nothing scored, the status is `provider_unavailable` and there is no winner.
  - A result count that does not match the answers raises an error, instead of `zip()` silently dropping answers.
  - The offline provider now returns deterministic six-metric JSON, so simulations still score and crown a winner with no provider and no cost.
  - **Proof (live_db):** a provider returning nothing gives no rows and no winner. With one real score, only that answer competes, and it wins.
- **The 1M CQS cost is an operator decision (HP-39), recorded honestly (Odin, Athena, Asar).**
  - Scoring every eligible answer of the winning theme is still unbounded in count and cost for a live session.
  - HP-39 gives three options: a cap, a seeded sample, or a cost ceiling.
  - `sim_1m.py bench --endpoint` now states that its seconds exclude CQS.

## What each lens said (verbatim)

### Thor (risk & security stress) — APPROVED

Round 14, Thor lens, commit 3d989dd. I approve.

**What I asked for last round.** I asked for the rest of the per-entry rounding problem to be closed: Cube 2 (text) and Cube 3 (voice) still round each submission up to a whole ♡. The code still does this, and that matches the record. `cube5_gateway/service.py:124` keeps `heart = math.ceil(duration_minutes)` for each submission entry and for the login credit. The module header (lines 7-9) and the `calculate_tokens` docstring (lines 118-119) point to HP-38. The record in `docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md` line 73 is honest and accurate:
- It gives the real rate: up to about 100 ♡ + 500 ◬ a minute within the per-address limit, against an honest 1 ♡ a minute.
- It says there is no cap on answers per participant per question.
- It notes that the two specs disagree (`Token_Governance_Math.md` says round down, `docs/CUBES_4-6.md` says round up).
- It limits the exposure correctly: tokens have no cash path yet (`settle_hi_to_currency` is not implemented), so the risk is inflated totals, not money.
- It lists three concrete options (a/b/c) and is tagged DECISION + CODE.

How much one participation should earn is a choice the operator has to make. A clear DECISION record, with no silent fix, satisfies my lens for this round. If tokens ever get a cash path, this becomes a blocker until the decision is made.

**Round 13 changes, checked in the code:**
- **CQS lock:** CQS now takes `pg_advisory_xact_lock(hashtext('cqs:<session>'))` at `cqs_engine.py:78` instead of a row lock on the session. No `with_for_update` on sessions remains anywhere in `app/`. The only row locks left are on a single time entry (cube5 `service.py:208`) and the confirmation append (cube4 `service.py:471`).
- **Eligibility in SQL:** the label, the ≥95 confidence threshold, the current cycle and the PII gate are all filtered in the database, and participants are looked up with a subquery rather than a long list of ids, so the 32,767-parameter limit is not hit at 1M.
- **Label escaping:** the label is no longer escaped a second time.
- **Ranking triggers CQS:** `ranking_governance.py:169-180` passes `top_theme2_label` and `theme_level`, and the level is limited to 3, 6 or 9.
- **Login start:** a public time start with action_type 'login' now returns 400 (`router.py:82-85`).
- **Public time:** every other public entry now earns the whole minutes accumulated so far, minus what was already minted (`service.py:232-246`).

**Tests:** the backend suite passes with `ENVIRONMENT=test`: 3443 passed, 66 skipped, 0 failed. I did not run the frontend `test:*` scripts.

Every remaining risk I can see under this lens is either minor or recorded in the backlog with the right Needs tag.


Minor notes:
- ranking_governance.py:185-189 catches TypeError and calls trigger_cqs_scoring again without the label. Now that Cube 5 accepts the extended arguments, this fallback is dead code, and it could hide a real TypeError raised inside the scoring. Consider removing it.
- CQS scoring runs the AI provider inside the ranking aggregation's transaction, which holds the advisory lock agg:<session>:<cycle>. Only an advisory lock and freshly inserted rows are held, so other sessions are not blocked. Same-session re-aggregation waits for the provider, which is acceptable but worth a timeout on the provider call.
- HP-38: when the operator decides, reconcile Token_Governance_Math.md and CUBES_4-6.md in the same commit, and update the tests/cube2 end-to-end expectations if option (a) is chosen.

### Odin (predictive / future-proof) — NOT_APPROVED

I checked my three round-13 asks at 3d989dd, and all three are done. (1) score_cqs takes `pg_advisory_xact_lock(hashtext('cqs:'+sid))` (cqs_engine.py:78), and no FOR UPDATE on sessions remains. (2) run_cqs_pipeline calls score_cqs(commit=False), then flushes and runs `update(CQSScore)...values(is_winner=True)` and commits once, so scores and winner land in one transaction under the lock. (3) The live_db proof test_cqs_parallel_runs_and_no_session_row_lock covers 3 parallel /ai/cqs runs giving (n, 1). It also holds a real uncommitted score_cqs while another connection inserts a ResponseMeta, which must finish in under 2 s. test_ranking_aggregation_scores_cqs proves the Cube 7 → 5 → 6 handoff. tests/cube5, cube6 and cube7 pass: 578 passed, 10 skipped. Round 13 also wired ranking to fire CQS automatically, and that opened two new gaps under my lens. First, CQS picks its provider from session.ai_provider instead of provider_for_session. Every aggregation, including the LIVE Admin Console's simulation runs, can therefore reach a paid provider without the HI-approved estimate that addendum 4 requires. Second, real-provider CQS scores every eligible answer, in sequential 100-item batches, inline in POST /rankings/aggregate, with no cap and no backlog row. At 1M that cost and latency are unbounded. Both are small to close: route through provider_for_session and add a gate, then cap, sample or defer the scoring, or list it as a DECISION.

- **Required:** Pick the CQS provider through the simulation cost guard. In score_cqs, replace `provider_name = session.ai_provider or "openai"; summarizer = get_summarization_provider_or_offline(provider_name)` with `provider_for_session(session)` (or `get_session_summarization_provider(session)`), the same as Phase A and run_pipeline. Add a unit or live_db gate: a simulation session with ai_provider='openai' and no ai_cost_approval scores CQS with the OFFLINE provider, and the stored CQSScore.provider is 'offline'.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:80
  - Evidence: cqs_engine.py:80-81 `provider_name = session.ai_provider or "openai"` / `summarizer = get_summarization_provider_or_offline(provider_name)`. grep for provider_for_session finds it only in factory.py, phase_a.py:84 and pipeline.py:99, never in cqs_engine. Round 13 made every aggregation reach this code: ranking_governance.py:167-181 calls trigger_cqs_scoring with top_theme2_label, which runs run_cqs_pipeline (service.py:930-931). The LIVE Admin Console runs that aggregation (sim-console-driver.ts:207 POST /rankings/aggregate). A simulation session defaults to ai_provider 'openai' (cube1 service.py:195).
  - Why it blocks: Addendum 4 and factory.py:171-181 say a simulation never reaches a paid provider without an HI-approved estimate. Round 13's ranking-to-CQS handoff opened a route around that guard. In production with an OpenAI key set, a LIVE Admin Console run sends every eligible simulated answer to the paid provider for CQS scoring, and nobody approved that cost. This is a new, unlisted defect in scope 2.
- **Required:** Bound real-provider CQS on the 1M path, or record it honestly. The bound can be a cap or a deterministic seeded sample of eligible answers, scored off the ranking request (background task / queue). The ranking endpoint then returns once aggregation commits. Otherwise, add a backlog row with Needs DECISION (cap or sample size, cost ceiling, sync or async). The row should state that every aggregation now runs ceil(eligible/100) sequential provider batches inside the POST /rankings/aggregate request, holding a DB connection idle in a transaction plus the cqs advisory lock.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:140
  - Evidence: cqs_engine.py:137-141 has no limit on `eligible`: `for chunk_start in range(0, len(items), _CQS_BATCH_SIZE): chunk_results = await summarizer.batch_summarize(chunk)`. It runs inline from run_ranking_pipeline → emit_ranking_complete → trigger_cqs_scoring (`async with db.begin_nested(): cqs = await run_cqs_pipeline(...)`, service.py:930) before ranking_governance.py:688 `await db.commit()`. grep -i cqs on docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md finds no row. HP-27 only guards simulation sessions. Round 13's minor note (assessment line 84) flagged uncapped CQS, but that was before ranking triggered it automatically.
  - Why it blocks: Scope 3 is 1M polling with voting. A winning Theme02 at 1M can hold tens of thousands of eligible answers. Each aggregation then costs an unbounded amount of money and turns the aggregate request into minutes of sequential LLM calls on a held connection. That breaks the scale target, and it is a defect that is neither fixed nor listed.

Minor notes:
- The comment at service.py:928 says 'the ranking pipeline owns the transaction and commits once'. In practice, _create_trigger (service.py:658) and deliver_event (webhook_service.py:250) both commit earlier. The aggregation rows are committed by deliver_event, after the ranking_complete Supabase broadcast (ranking_governance.py:136) and after webhook POSTs that can take up to 10 s. A client that reacts to the broadcast can read results before they are committed. Commit the aggregation before broadcasting, and fix the comment.
- The legacy `except TypeError:` fallback in ranking_governance.py:184-191 now catches TypeErrors raised inside trigger_cqs_scoring itself. A TypeError there would silently re-run the trigger without the label. The fallback could go, now that Cube 5 accepts the kwargs.
- CQS falls back to scores of 50 across the board when the provider returns unparseable JSON (cqs_engine.py:146). At scale a provider outage then yields a seeded-random winner among all-50 ties rather than 'no winner'. Consider marking the run degraded.

### Enlil (implementation & build verification) — APPROVED

I checked commit 3d989dd in /tmp/claude-0/wtm (clean tree apart from an untracked node_modules) by running the builds and tests myself, without editing anything. Backend: the full pytest run (ENVIRONMENT=test) gave 3443 passed, 66 skipped, 0 failed. tests/live_db ran against a real local Postgres: 11 passed in 128 s. That run includes the round-13 proofs: three parallel /ai/cqs calls produce one winner, another insert completes in under 2 s while CQS holds its transaction, ranking aggregation writes CQS scores and one winner, and a public 'login' start gets a 400. The 1M harness (scripts/sim_1m.py) seeded 20,000 ballots into a throwaway localhost database, which I dropped afterwards. I benchmarked it twice through the real endpoint path (--endpoint): 1.85 s on the cold first run and 0.18 s warm, 0.125 s median aggregate, 143 MB peak memory, one result hash. The log shows ranking now calls run_cqs_pipeline with the label ('Risk & Concerns · 1' → no_eligible on the summary-less sim). Frontend: npm run test:ci exits 0. test:cube-sim-live gives 837/0, test:sim-live-source 55/0 (the regenerated live source matches the new router and service text), and test:worker-api-routes 40/0. The CLAUDE.md tsc filter finds 0 new errors. I read the round-13 changes against what they claim. (1) cqs_engine.score_cqs reads the session without FOR UPDATE and takes pg_advisory_xact_lock(hashtext('cqs:<id>')) on Postgres only. run_cqs_pipeline calls score_cqs with commit=False, flushes, sets is_winner with one UPDATE, then commits once, so scores and winner land together under the lock. (2) trigger_cqs_scoring wraps the call in db.begin_nested() with commit=False. emit_ranking_complete now passes top_theme2_label and a whitelisted theme_level, and run_ranking_pipeline commits once afterwards (ranking_governance.py:687). A failed scoring rolls back only its savepoint. (3) Eligibility (label, confidence >= 95, cycle) is now one SQL WHERE, reused for the participant subquery, with no bound id list. (4) The second html.escape is gone; the /ai/cqs route resolves the stored label by exact lookup. (5) router.start_time_tracking refuses action_type 'login' with a 400 before guard_public_start. stop_time_tracking applies the accumulated floor to every cube5 entry. The one-open-entry rule rests on a partial unique index plus migration 032, not only the check-then-insert. (6) HP-38, the Cube 2/3 per-submission ceil, is recorded in the backlog as DECISION + CODE with both spec readings and three options, so it is honest. Remaining issues under my lens are minor: (a) cqs_engine.py:11 `import html` is now unused after this round's change, and ruff F401 also flags `logging` and `settings` there plus several stale imports in cube5 service.py and ranking_governance.py. (b) ranking_governance.py:665 assigns `winner = await identify_top_theme2(...)` and never uses it, a wasted query on each pipeline run. (c) CQS scoring now runs synchronously inside the ranking aggregate request and transaction, with AI batches of 100. With a real provider and a large winning theme, that lengthens POST /rankings/aggregate and repeats paid calls on each re-aggregate. It is offline in SIM and only a moderator can trigger it, so it is worth a backlog line but does not block approval. (d) The `except TypeError` fallback in emit_ranking_complete is now dead compatibility code: a TypeError raised inside trigger_cqs_scoring before its guarded block would record a second trigger row. Scope 1–3 is operational in my runs: APIs and worker routes are green, the Cubes 1–10 SIM/LIVE parity gate is green, and 1M-path voting aggregation with CQS chaining is proven on real Postgres.


Minor notes:
- backend/app/cubes/cube6_ai/cqs_engine.py:11 `import html` is unused since round 13 removed the second escape (ruff F401); also `logging` (l.13) and `settings` (l.23).
- backend/app/cubes/cube7_ranking/ranking_governance.py:665 `winner = await identify_top_theme2(db, session_id, cycle_id)` is never used (ruff F841), an extra query on every ranking pipeline run; ruff also flags unused hashlib/math/timezone/delete/update and three ranking_aggregation helpers imported at l.22-50.
- Ranking now runs CQS AI scoring inline in the aggregate request and transaction (service.py:928-931 inside run_ranking_pipeline before the commit at ranking_governance.py:687). With a real provider, a large winning theme means many sequential 100-item batches on the request path, re-paid on each re-aggregate. Suggest a backlog line (queue CQS after the ranking commit, or reuse HP-27 cost approval).
- ranking_governance.py `except TypeError:` fallback re-calls trigger_cqs_scoring with legacy kwargs; now that the signature accepts the extended kwargs, the fallback is dead code that could duplicate a trigger row if a TypeError came from inside the call.
- backend/app/cubes/cube5_gateway/service.py:26,41 unused `logging` and `SessionSemaphorePool` imports (ruff F401).

### Krishna (integration & cross-module) — NOT_APPROVED

My round-13 ask is fixed and proven. Cube 7 now passes the stored Theme02 label and level to Cube 5, and Cube 6 scores inside a savepoint without committing, so the ranking commits once. The live_db proof on a real Postgres shows aggregation writes n CQS scores and exactly one winner, and parallel /ai/cqs runs produce one winner without a session-row lock. The backend live_db, cube5-7 and cross-cube suites and the frontend SIM/LIVE parity gates are green. One integration gap remains, introduced by this fold and not in the backlog: CQS now runs inline in the POST /rankings/aggregate request and its transaction. That is one provider call per eligible answer, chunks of 100 in sequence, at most 32 concurrent. At 1M with a real provider, the moderator's ranking call and its transaction plus advisory lock depend on Cube 6 latency. The 1M endpoint benchmark never measured this because it seeds no summaries. Running CQS as a post-commit background task, or recording it honestly in the backlog with a measured cost, earns my approval.

- **Required:** Take CQS scoring out of the POST /rankings/aggregate request and its transaction. Commit the ranking first, then run trigger_cqs_scoring -> run_cqs_pipeline as a background task in its own session and transaction, keeping the advisory lock and the delete+insert+winner in one transaction there. If the operator wants it inline for now, record it as a backlog HP row (like HP-16) with a measured duration at 1M and the right Needs, and have sim_1m.py bench --endpoint seed response_summaries so the 5.8 s endpoint figure includes CQS.
  - File: `backend/app/cubes/cube5_gateway/service.py`:930
  - Evidence: Round 13 made the handoff fire: ranking_governance.py:169-181 passes top_theme2_label + theme_level. trigger_cqs_scoring then runs `async with db.begin_nested(): cqs = await run_cqs_pipeline(db, session_id, top_theme2_label, theme_level, commit=False)`, and run_ranking_pipeline only calls `await db.commit()` after emit_ranking_complete returns (ranking_governance.py:674-688). score_cqs (cqs_engine.py:146-150) makes one provider call per eligible answer: chunks of 100 run in sequence (`for chunk_start in range(0, len(items), _CQS_BATCH_SIZE): ... await summarizer.batch_summarize(chunk)`), and base.py:132-171 sends a separate summarize() per item, capped at 32 concurrent and 120 s each. The winning Theme02 at 1M can hold tens of thousands of answers at confidence >= 95. So, with a real provider, the moderator's aggregate request blocks for minutes on Cube 6 while the ranking writes and the pg_advisory_xact_lock stay open, which breaks the 'graceful degradation if AI is delayed' constraint. The measured endpoint time never covered this: sim_1m.py bench --endpoint inserts themes and ballots but no response_summaries, so CQS scores nothing. `grep -i cqs` on the HP backlog finds no row.
  - Why it blocks: This is the defect class the fold introduced, it sits in scope 3 (1M voting -> ranking), and it is in neither the measurements nor the backlog. Fixing my previous ask joined Cube 7's latency and transaction to Cube 6's AI provider, and nothing records that or bounds it.

Minor notes:
- Previous ask is DONE and proven: ranking_governance.py:169-181 passes top_theme2_label (the stored Theme.label) and theme_level (normalized to 3/6/9, derived from Session.theme2_voting_level at :645-648). cube5 service.py:930-931 scores inside db.begin_nested() with commit=False, and the outer run_ranking_pipeline commits once. live_db test_ranking_aggregation_scores_cqs asserts (n scores, 1 winner). I ran tests/live_db on a real Postgres: 11 passed. tests/cube5, cube6, cube7 and test_cross_cube_chain: 602 passed, 10 skipped.
- Frontend SIM/LIVE parity gates pass: cube-sim-live 837/0, sim-console-driver 20/0, sim-live-source 55/0, sim-parity 3/3, worker-api-routes 40/0.
- The ranking_complete broadcast and webhook (ranking_governance.py:133-162) go out before db.commit() and before CQS. A consumer that reads back right away can see uncommitted state, or a winner that has not been scored yet. It would be cleaner to emit after the commit.
- batch_summarize returns "" when a provider item fails. score_cqs then falls back to 50 for every metric (cqs_engine.py:153-156), so a provider outage quietly produces a seeded random 'winner' among ties. Consider recording status 'degraded' rather than 'completed' when most items fail.
- The `except TypeError` legacy fallback at ranking_governance.py:186-194 is dead code now that Cube 5 accepts the extended kwargs. It could also hide a real TypeError raised inside scoring and re-trigger it without the label. Remove it.

### Enki (diversity & edge cases) — APPROVED

I checked my round-13 request first, and it is done. The public time start route now refuses a 'login' entry: backend/app/cubes/cube5_gateway/router.py:82-85 returns `raise HTTPException(status_code=400, detail="Login time is recorded when you join")`. The 'login' value is still allowed by the request schema, so the route has to refuse it, and it does. The fix also goes beyond the route. service.stop_time_tracking now applies the accumulated-minutes floor to every cube5 entry: the old login exemption is gone from the `if entry.cube_id == "cube5"` branch. That leaves the route refusal as a second guard. Three tests cover it: a unit test (tests/cube5/test_time_entry_cap.py:47, where 30 one-second 'login' entries mint 0 ♡), a live_db test (tests/live_db/test_bounds_and_scale.py:62, which expects the 400), and the earlier one-second-loop test. The join's own login credit (create_login_time_entry) is created already closed and is never stopped, so it is unaffected.

I then went through the round-13 changes looking for edge cases:
- **CQS lock:** two concurrent scorings of a session queue on a transaction-scoped advisory lock, keyed `cqs:{session_id}`, with no row lock on sessions.
- **Ranking-triggered CQS:** the old scores are deleted even when nothing is eligible, so a reopened cycle never keeps the previous winner. Eligibility is filtered in SQL with `coalesce(conf, 0) >= 95` and a deterministic order. The participant lookup uses a subquery rather than a list of bound ids, which avoids asyncpg's 32k-parameter cap at 1M. Ties are broken by a seeded draw, with a fallback seed when the session's seed is NULL. The label is no longer escaped twice.
- **Commits:** a failure inside the ranking path's savepoint is caught and the run degrades to recording the trigger only. The final `db.commit()` in ranking_governance (around line 686) persists the scores and the winner.

Test runs:
- Backend: 3,443 passed, 66 skipped, 0 failed (python3 -m pytest tests, ENVIRONMENT=test).
- Frontend: npm run test:cube-sim-live 837/0 and npm run test:sim-console-driver 20/0.

One wall-clock test, tests/cube6/test_scale_pipeline.py::test_scale_projection_5k_to_1m (`projected_vote_ms < 5000`), failed once while three cube suites ran together under -x. It passed alone and in the full run. This is a timing flake, not a defect.

Cube 2/3's per-submission ceil (each answer earns 1 ♡ + 5 ◬) is recorded honestly as backlog item HP-38, marked DECISION + CODE, with the conflicting specs cited. Within my lens, everything left is minor or recorded in the backlog.


Minor notes:
- _create_trigger (cube5_gateway/service.py:658) commits partway through compute_ranking_pipeline. That commits the aggregation and releases its `agg:` advisory lock before the CQS AI calls start, so the 'ranking commits once' description is not literally true. The results are still correct, because CQS has its own lock and the final commit persists the scores. Consider flush() there when a caller owns the transaction.
- In cqs_engine.score_cqs, a provider reply that is valid JSON but not an object (for example a list), or that has non-numeric metric values, raises AttributeError or ValueError instead of falling back to 50. In the ranking path this is caught by the savepoint, which means the whole CQS run degrades to recording the trigger only. Catching per item would keep the other scores.
- `zip(eligible, results)` drops eligible answers without warning if a provider returns fewer results than it was given. Logging a count mismatch would make that visible.
- stop_time_tracking still excludes `action_type == 'login'` from the prior-sum query. That only matters for cube5 'login' rows written before round 13, and the route can no longer create new ones.
- test_scale_projection_5k_to_1m asserts on wall-clock time and failed once under load. Consider a wider margin or marking it as a perf test outside the default run.

### Thoth (data & analytics deep dive) — APPROVED

Both of my round-13 asks are done in 3d989dd. (1) The second html.escape is gone. backend/app/cubes/cube6_ai/cqs_engine.py:127-129 now sets `safe_theme_label = top_theme2_label` and carries a comment that the label arrives as stored. The router (cube6_ai/router.py:94-104) resolves the caller's label to the stored Theme.label, matching either the raw or the escaped form, and passes that stored value on. ranking_governance.py:179 passes the stored Theme.label. tests/live_db/test_bounds_and_scale.py:265 asserts `labels == {"Privacy &amp; Trust"}`. (2) CQS eligibility is filtered in SQL. cqs_engine.py:93-103 builds `eligible_where`, which checks the session, `in_(eligible_answers(...))` (the cycle and PII gate), the label match and `coalesce(conf,0) >= 95`, and orders by response_meta_id so the scoring order is deterministic. The participant lookup reuses the same predicate as a subquery, so there is no bound id list and no risk of hitting asyncpg's 32,767-parameter limit at 1M. Scores, the delete of earlier scores and the winner now land in one transaction under pg_advisory_xact_lock. The rescore path is idempotent, and the empty case also clears stale winners. The ranking trigger scores inside db.begin_nested() with commit=False and falls back to a trigger-only record if scoring fails, so a CQS failure cannot abort the ranking. Checks I ran: pytest on tests/cube5, cube6 and cube7 gave 578 passed and 10 skipped; test_sql_tally_parity gave 9 passed; npm test:cube-sim-live gave 837 passed and 0 failed; test:sim-console-driver gave 20 passed. I did not run the live_db proofs because there is no local Postgres; I relied on the round-13 record and the Verify Live #2619 result. I found no defect under the data/analytics lens that is missing from the backlog. The Cube 2/3 per-submission ceil is recorded as operator decision HP-38.


Minor notes:
- cqs_engine.py score_cqs: an AI reply that fails to parse quietly becomes a score of 50 on every metric, with no count logged. Logging the number of fallback-scored responses would make a degraded provider visible in the analytics.
- ranking_governance.py:186: the `except TypeError` legacy fallback is now dead code, because trigger_cqs_scoring accepts the extended kwargs and catches its own exceptions. It is safe to remove as cleanup.
- cqs_engine.py: `theme_confidence=(getattr(s, conf_field, 0) or 0) / 100.0` stores a 0-1 value while the SQL filter compares on the 0-100 scale. This is consistent but undocumented, and a docstring note would help downstream Cube 9 readers.
- The live_db proofs (advisory-lock concurrency, CQS written by ranking) were not re-run in this review because no local Postgres was available. They are taken from the round-13 record and Verify Live #2619.

### Athena (strategic test planning) — NOT_APPROVED

I checked the round-13 fold. The parts it claims are correct and tested.
- CQS now serialises on pg_advisory_xact_lock(hashtext('cqs:<sid>')) at cqs_engine.py:77-78, not on a session-row FOR UPDATE.
- Scores, the winner and is_winner are written in one commit by run_cqs_pipeline, and score_cqs is called with commit=False.
- Eligibility is filtered in SQL (the eligible_where tuple), and the label is written once.
- Ranking passes top_theme2_label and theme_level, and the scoring runs inside begin_nested.
- I traced the transaction. _create_trigger commits (service.py:658), so the aggregation and its agg advisory lock are committed and released before CQS starts. There is no window where clients see ranking_complete with uncommitted results.
- The public 'login' start returns 400 (router.py:82-85), and every cube5 entry mints by the accumulated floor.
- HP-38 is honestly recorded as a DECISION.

Tests I ran, all passing, against my own Postgres with LIVE_DB_DSN and SIM_TEST_DSN unset:
- live_db bounds/scale plus the cube7 SQL tally parity test: 15 passed. This includes the 3-parallel CQS run, the under-2-second foreign-key insert while CQS holds its transaction, and ranking writing CQS scores with one winner.
- tests/cube5, cube6, cube7 and live_db together: 589 passed, 10 skipped.
- Frontend test:cube-sim-live: 837 passed.

Why I do not approve this round: the same fold that wired ranking to CQS put an unbounded step on the scope-3 path, and it has no proof at scale and no backlog entry.
- POST /rankings/aggregate now waits for AI scoring of every eligible answer in the winning Theme02: no cap, sequential batches of 100, and a full delete and re-score on every re-aggregate.
- The 1M endpoint bench seeds no responses or summaries, so it measures zero CQS work.

Either bound or background the step and prove it at 1M, or record it honestly in the backlog (DECISION for the AI cost, CODE for moving it off the request). Also make sim_1m cover the step or say that it skips it. With those two changes I would sign off; nothing else under my lens is open.

- **Required:** Either bound the CQS work that POST /rankings/aggregate now runs (cap or sample the eligible set, or run it as a background step after the response) and prove it at 1M, or record it in the backlog as an honest item with the right Needs (DECISION for the AI cost at 1M, CODE for moving it off the request). Today the ranking request scores every eligible answer of the winning Theme02 with the AI provider, synchronously, and a re-aggregate deletes and re-scores them all.
  - File: `backend/app/cubes/cube5_gateway/service.py`:930
  - Evidence: Round 13 made ranking call the real scoring inside the aggregate request: service.py:930-931 `async with db.begin_nested(): cqs = await run_cqs_pipeline(db, session_id, top_theme2_label, theme_level, commit=False)`, reached from ranking_governance.py:169-181 (now passes top_theme2_label) and awaited by router.py:214 `result = await service.run_ranking_pipeline(...)` before the response is returned. In cqs_engine.py score_cqs there is no cap on `eligible = list(summaries_result.scalars().all())`. Scoring runs `for chunk_start in range(0, len(items), _CQS_BATCH_SIZE)` with _CQS_BATCH_SIZE = 100 and sequential `await summarizer.batch_summarize(chunk)` (base.py:149 Semaphore(max_sampling_workers=32)). It also does `await db.execute(delete(CQSScore).where(CQSScore.session_id == session_id))` on every run, so every re-aggregate re-scores everything. A grep of docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md for 'CQS' finds nothing.
  - Why it blocks: Scope 3 is 1M polling with voting on 9 themes. At 1M the winning Theme02 can hold on the order of 100k answers at ≥95 confidence. That means about 1,000 sequential provider batches, and as many paid AI calls, inside one HTTP request, behind the Cloudflare proxy timeout. Every re-run of aggregate pays for them again. Round 13 created this, and it is neither tested at scale nor listed in the backlog, so it is an unlisted defect on the 1M path.
- **Required:** Make the 1M endpoint bench exercise the step the endpoint now runs. sim_1m.py seed() should also write response_meta and response_summaries rows tagged with the winning Theme02 at confidence ≥95, or the bench output should state that CQS is excluded. Then `bench --endpoint` and sim_compare --endpoint measure what POST /rankings/aggregate actually costs.
  - File: `backend/scripts/sim_1m.py`:97
  - Evidence: seed() only does `truncate user_rankings, aggregated_rankings, participants, themes, sessions cascade` and inserts sessions, themes, participants and user_rankings. It writes no response_meta or response_summaries, so in bench_endpoint (`out = await gov.run_ranking_pipeline(db, SID, "SIM1M001", ...)`) CQS finds zero eligible answers and returns no_eligible. The docstring still describes the endpoint as 'anomaly detection → exclusions → tally → top theme → emit'.
  - Why it blocks: The 1M figure for the ranking endpoint is the scope-3 proof. Since round 13 the endpoint does AI scoring that the bench never triggers, so the published endpoint timing no longer represents the endpoint. A test plan whose headline proof skips the newest and most expensive step is not sign-off grade.

Minor notes:
- ranking_governance.py:184-191 still has the `except TypeError` legacy fallback that calls trigger_cqs_scoring without the label. trigger_cqs_scoring has accepted the extended kwargs for several rounds, so this fallback can only hide a real TypeError raised inside scoring setup and quietly turn it into a trigger-only run. Consider removing it.
- trigger_cqs_scoring's docstring says the trigger record and audit row are part of 'the ranking pipeline owns the transaction', but _create_trigger commits on its own (service.py:658). The behaviour is fine, since the aggregation becomes visible early, but the comment at service.py:928-929 should say the savepoint runs in a fresh transaction after the trigger's commit.
- test_ranking_aggregation_scores_cqs covers the identified-session path only. The anonymous path through aggregate, where participant_id is None on CQSScore, is proven only through /ai/cqs. A one-line parametrisation would close it.

### Christo (consensus & user-flow) — NOT_APPROVED

I verified the round-13 fold on 3d989dd. CQS now serialises on pg_advisory_xact_lock(hashtext('cqs:<sid>')), with no session-row FOR UPDATE. Scores, winner and is_winner are written in one transaction. The label is stored once, without a second escape. Eligibility (cycle, PII gate, label, confidence >= 95) is filtered in SQL. A public 'login' time start returns 400. Ranking hands top_theme2_label and theme_level to CQS inside begin_nested().

What I ran, against a real local Postgres:
- Backend tests/cube5, cube6, cube7, live_db and test_participant_rate_limits: 590 passed, 10 skipped.
- tests/live_db alone: 11 passed. This includes test_cqs_parallel_runs_and_no_session_row_lock and test_ranking_aggregation_scores_cqs.
- Frontend: cube-sim-live 837/0, sim-console-driver 20/0, worker-api-routes 40/0.

Under my consensus and user-flow lens, wiring ranking to CQS created three unlisted defects, so I withdraw last round's approval:
1. CQS picks its provider as `session.ai_provider or "openai"` (cqs_engine.py:80-81). That skips provider_for_session, the HI-approved cost guard Phase A and the pipeline use (HP-27, addendum 4). Ranking a simulation session now makes paid calls with no approved estimate.
2. CQS's per-answer AI fan-out (32 concurrent calls, 120 s timeout each) now runs inside the ranking request, before `db.commit()` (ranking_governance.py:687). The ranking_complete broadcast and webhook go out before that commit, so participants and subscribers hear 'complete' while the results are still uncommitted. At 1M the top cluster may be tens of thousands of answers, and sim_1m never exercises CQS.
3. When the provider fails, every metric defaults to 50 (cqs_engine.py:151), and a seeded lottery among the tied answers is recorded as the CQS winner.

Fix item 1 first; it is a few lines and a gate test. Then either decouple CQS from the ranking transaction or record it honestly in the backlog. Then stop announcing winners from unscored answers. With those done I would sign off.

- **Required:** Route CQS through the simulation cost guard. In score_cqs, resolve the provider with get_session_summarization_provider(session) (or provider_for_session) in place of `session.ai_provider or "openai"` + get_summarization_provider_or_offline. Add a gate test: aggregating the ranking of a simulation session with no recorded ai_cost_approval scores CQS with the OFFLINE provider.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:80
  - Evidence: cqs_engine.py:80-81 `provider_name = session.ai_provider or "openai"` / `summarizer = get_summarization_provider_or_offline(provider_name)`. Phase A and pipeline.py:99 use `provider_for_session(session)`, which forces OFFLINE for session_type 'simulation' unless simulation_cost_approved (factory.py:194-206). HP-27 records that guard as 'HI approval before any provider call (addendum 4)'. Round 13 made POST /rankings/aggregate call run_cqs_pipeline automatically (ranking_governance.py:168-181 → service.py:928-931). Ranking a seeded simulation session (sim_seed.py:61) on a host with a provider key therefore now makes one paid call per eligible answer with no HI-approved estimate.
  - Why it blocks: Round 13 created a new route around the HI approval the operator required before any provider call. The guard exists and Phase A obeys it; CQS is the one AI path that skips it, and now a moderator's ordinary 'aggregate' click reaches it. This is not in the backlog. HP-27 states the guard as already built.
- **Required:** Take CQS out of the ranking request's transaction. Commit the aggregation first, then broadcast and deliver ranking_complete, then run CQS as a separate unit of work: a background task or its own session and transaction. Its provider calls must not hold the ranking HTTP response or keep the aggregation uncommitted. Alternatively, list it in the backlog with Needs, the 1M latency, and the provider-outage timing.
  - File: `backend/app/cubes/cube7_ranking/ranking_governance.py`:674
  - Evidence: run_ranking_pipeline calls emit_ranking_complete (:674) and only then `await db.commit()` (:687). Inside emit, broadcast_event (:136) and the inline webhook deliver_event (:158) both run BEFORE that commit, and trigger_cqs_scoring now awaits run_cqs_pipeline inside `db.begin_nested()` (service.py:930-931). That makes one provider call per eligible answer: base.py:149-167 batch_summarize, 32 concurrent, 120 s timeout per item, in chunks of 100 (cqs_engine.py:142-145). Clients and webhook subscribers are told 'ranking complete' while the result rows stay uncommitted for the whole CQS run. At 1M, the top cluster can hold tens of thousands of eligible answers. sim_1m.py never exercises CQS (grep finds no cqs).
  - Why it blocks: Scope 3 is 1M polling with voting. Before round 13, CQS from ranking was a no-op, so the commit followed the aggregation at once. Now the moderator's aggregate request and the visibility of the vote result both wait on an unbounded AI fan-out, and a provider stall extends it by up to 120 s per round of 32. The participant flow is announced before its data exists. This regression was introduced in round 13 and is not in the backlog.
- **Required:** Do not crown a CQS winner on unscored answers. When the provider returns "" or invalid JSON for an item, mark it unscored and leave it out, not 50 on every metric. If no item was really scored, return status 'provider_unavailable' with no winner.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:151
  - Evidence: cqs_engine.py:148-151 `except (json.JSONDecodeError, TypeError): scores = {m: 50 for m in _CQS_METRICS}`. base.py:160-165 returns "" on every timeout or error. During a provider outage every eligible answer composites to the same value, and select_cqs_winner (:203-215) picks a seeded-random 'winner' among the ties, written as is_winner=True. Round 13 now triggers this on every ranking aggregation.
  - Why it blocks: The CQS reward is a consensus outcome given to one participant. Announcing a winner chosen by lottery while the scoring pretends to have evaluated the answers misleads participants. Now that every ranking triggers CQS, an outage produces this automatically. It is not in the backlog.

Minor notes:
- Round 12's recovery note still stands. A 409 from a public time start does not include the open entry's id (cube5_gateway/service.py), so an SDK client that lost the id has to discover GET /time/summary/{participant_id} by itself.
- HP-28's evidence column still cites only the cube1 and cube2 router lines; adding the cube3, cube5 and cube7 line references would complete it.
- Aset's round-13 note is still open: POST /ai/cqs does not check that the label belongs to the requested theme_level, so a mismatched level silently clears the session's scores and winner.
- The fallback in ranking_governance.py (`except TypeError:` → legacy trigger_cqs_scoring) is dead now that Cube 5 accepts the extended kwargs. It could also mask a real TypeError raised inside CQS scoring and re-trigger without a label. Consider removing it.
- Advisory locks taken inside a savepoint are released if that savepoint rolls back. That is acceptable here, but worth a comment next to begin_nested().

### Aset (consistency validation) — APPROVED

Round 13 changed the CQS lock, the ranking handoff and the time rules. Under the consistency lens, each change says the same thing on every path I traced at 3d989dd.

What I checked in the code:
- **CQS rules.** One eligibility rule: `phase_b.eligible_answers()` plus the label and confidence ≥ 95, filtered in SQL (`cqs_engine.py` :91-103). It is shared by theming, by `POST /ai/cqs` and by the new ranking handoff. Both callers pass the STORED label: the router through its exact lookup (`router.py` :93-103), and ranking through `Theme.label` of the winning row (`ranking_governance.py` :90-95 → :177-180). The label is written once, as stored (`safe_theme_label = top_theme2_label`).
- **CQS lock.** Concurrent runs now serialise on `pg_advisory_xact_lock(hashtext('cqs:<id>'))` (:77). Delete, scores and `is_winner` land in one transaction, on the router path (commit=True) and the ranking path (commit=False inside `db.begin_nested()`, `service.py` :930-931). Ranking commits once at `ranking_governance.py` :687.
- **Ranking level.** The level passed comes from `Session.theme2_voting_level` (default theme2_9), the same slice the aggregation is pinned to.
- **Time tracking.** All Cube 5 stops use one rule: floor of accumulated public minutes minus ♡ already minted (`service.py` :230-247). The join's login entry (created closed, 60 s, 1 ♡) is left out of both the seconds and the ♡ sums. The new 400 on a public 'login' start (`router.py` :82-85) therefore cannot double count it.
- **SIM snapshot and backlog.** The SIM source snapshot (`sim-live-source.ts`) was updated in the same commit and its gate passes. The Cube 2/3 ceil-per-entry rule and the spec disagreement are recorded as HP-38 (DECISION + CODE), which closes my round-13 note on that.

What I ran (own Postgres, LIVE_DB_DSN and SIM_TEST_DSN unset):
- **Backend:** tests/live_db/test_bounds_and_scale.py (all 6 tests, including the parallel-CQS / no-row-lock proof and the ranking → CQS proof), test_sql_tally_parity, and tests/cube5, cube6 and cube7. Result: 584 passed, 10 skipped; the skips are only the provider-key and LIVE_AI tests.
- **Frontend:** cube-sim-live 837/0, sim-live-source 55/0, sim-console 35/0, sim-console-driver 20/0, sim-parity 3/3, cube10-unlock 10/0, worker-api-routes 40/0.

Scope 1-3 is operational and consistent across SIM and LIVE under my lens. The items left are contract tidy-ups, so I list them as minor.


Minor notes:
- My round-13 note is still neither fixed nor in the backlog. In `cube6_ai/router.py` :95-101 the `POST /ai/cqs` label lookup filters only `session_id` and `parent_theme_id IS NOT NULL`. It does not check `Theme.cluster_metadata['level']` against `theme_level`, and it does not check `Theme.cycle_id` against the current cycle. So a real Theme02 label from level 3, sent with `theme_level=9`, finds nothing eligible, and `score_cqs` (:99) then deletes the session's scores and winner without a word. Phase B already writes `cluster_metadata={'level': level, ...}` (`phase_b.py` :795), so the lookup can be scoped. Either scope it, or add it to the backlog as a small CODE item.
- The contract still advertises 'login' after the route stopped taking it. `schemas/time_tracking.py` :9 keeps `Literal['login', 'responding', 'ranking', 'reviewing']`, and the frontend client type keeps it too (`lib/api.ts` :286). The router now returns 400 for it, so OpenAPI and the SDK type list a value the server always refuses. Nothing calls it today: `startTimeTracking` has no caller outside api.ts. Dropping 'login' from the public schema (a 422) and from the TS union would make the contract say what the server does.
- The ranking → CQS handoff passes neither the ranking's `cycle_id` nor a cycle to `run_cqs_pipeline`. `eligible_answers()` always reads the session's CURRENT cycle. If the session has moved to a new cycle and ranking for an earlier cycle is then aggregated, CQS scores the wrong cycle's answers or finds nothing. Today the two match, because ranking runs on the current cycle. Pass the cycle through when multi-cycle ranking replays arrive.
- `theme_level if theme_level in ('3','6','9') else '3'` in `ranking_governance.py` :180 falls back to level 3. The session model defaults to theme2_9 (`models/session.py` :117), so a session whose voting level is unset or malformed would be scored at a different level from the one it voted on. The fallback should follow the model default, or skip CQS with a log line.
- The CQS AI-provider calls now run inside the ranking request's open transaction, before its single commit (`ranking_governance.py` :674-687). The ranking result and the `ranking_complete` broadcast therefore go out before the ranking rows are committed. That ordering existed before this round, and the savepoint makes it safe for correctness. Worth a note against 1M latency.
- Running `node --test tests/cube-sim-live.test.mjs` directly still fails to resolve modules; only the npm script with the ts-alias loader works. This is a tooling quirk, unchanged from last round.

### Asar (synthesis & outcome) — NOT_APPROVED

Round 14 (Asar) at 3d989dd: not approved. Every round-13 fold does what its record says, and I reproduced the proofs. CQS now serialises on a transaction advisory lock and writes scores, winner and is_winner in one transaction. Ranking passes the label and level, so CQS actually runs. The label is stored once, eligibility is filtered in SQL, and a public 'login' start returns 400. Tests are green: live_db 23/23 on my own Postgres 16, backend cube5-7/core 691 passed, frontend cube-sim-live 837/0. But making ranking trigger real CQS exposed two outcome defects the backlog does not list. (1) If the provider fails, every unscored answer defaults to 50 on all metrics, a seeded tie-break picks a "winner", and Cube 9 announces and rewards it (cqs_engine.py:147-151, base.py:160-165). (2) Real-provider CQS now runs synchronously inside the ranking transaction with no cap. At 1M, the tally stays uncommitted and the aggregation lock stays held while one provider call is made per eligible answer, after clients have already received ranking_complete (ranking_governance.py:136/169/687). Fix the first, and either decouple CQS from the ranking commit or record the 1M CQS path with an honest Needs, and I would sign off on scope 1–3.

- **Required:** When the AI provider fails, CQS must not crown a winner. Today an answer the provider could not score (an empty result or unparseable JSON) is written with every metric set to 50 and competes for the reward. Fix: skip or mark answers the provider did not score, and pick the winner only from real scores. If nothing was scored, return a status such as 'provider_failed' with no is_winner row, so Cube 9 says 'No CQS winner'. Also assert len(results) == len(eligible) instead of letting zip() drop answers silently. Gate: a test with a provider that returns '' for every item must produce no winner.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:150
  - Evidence: cqs_engine.py:147-151 `for s, result_text in zip(eligible, results): try: scores = json.loads(result_text) except (json.JSONDecodeError, TypeError): scores = {m: 50 for m in _CQS_METRICS}`. providers/base.py:160-165 batch_summarize turns every timeout or exception into `return ""`. So in an outage every answer gets composite 50, select_cqs_winner (lines 206-215) breaks the all-way tie with the seed, and run_cqs_pipeline sets is_winner=True. cube9_reports/service.py:1007-1040 then broadcasts `reward_announced` with has_winner True for that row.
  - Why it blocks: Round 13 made this automatic: every ranking aggregation now runs CQS (ranking_governance.py:169-181). A provider timeout or outage during a real session therefore publishes and rewards a participant picked at random from default scores, presented as a quality judgment. That is a wrong outcome reaching participants, and it is not in the backlog.
- **Required:** Take real CQS scoring off the ranking transaction and request path. Commit the ranking (AggregatedRanking rows plus the aggregation advisory lock) first. Then run CQS in its own transaction or as a background task. Or keep it inline only when the eligible count is under a cap, and record the 1M real-provider CQS path (latency, cost ceiling, no cap) in the backlog with an honest Needs (DECISION/INFRA, next to HP-25/HP-27). Odin raised the missing cap last round as a minor note; it is still not recorded.
  - File: `backend/app/cubes/cube7_ranking/ranking_governance.py`:687
  - Evidence: run_ranking_pipeline: aggregate_rankings (holds `pg_advisory_xact_lock(agg:{session}:{cycle})`, ranking_aggregation.py:417, no commit), then emit_ranking_complete broadcasts `ranking_complete` (ranking_governance.py:136), then calls trigger_cqs_scoring with the label (line 169), and only then `await db.commit()` (line 687). trigger_cqs_scoring runs `async with db.begin_nested(): await run_cqs_pipeline(..., commit=False)` (cube5_gateway/service.py:930-931), which makes one provider call per eligible answer (base.py batch_summarize, max_sampling_workers=32) with no cap. grep 'CQS' in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md finds nothing.
  - Why it blocks: Scope 3 is 1M polling with voting. With a real provider and tens of thousands of eligible answers, the moderator's aggregate request waits minutes on CQS. Clients have already received `ranking_complete`, but GET /rankings cannot show the tally until CQS finishes, a re-aggregate blocks on the advisory lock, and an edge or HTTP timeout leaves the outcome unclear. The 1M ranking result now depends on unbounded AI work that is neither fixed nor listed in the backlog.

Minor notes:
- I verified the round-13 folds and they hold. On my own Postgres 16, tests/live_db + tests/cube7/test_sql_tally_parity.py + tests/cube5/test_time_entry_cap.py: 23 passed in 129 s, including the new parallel-CQS / no-row-lock proof and the ranking→CQS proof. Backend cube5/6/7/core: 691 passed, 10 skipped. Frontend test:cube-sim-live 837/0, test:sim-live-source 55/0.
- CQS skips the addendum-4 simulation cost guard. cqs_engine.py:80-81 uses `get_summarization_provider_or_offline(session.ai_provider)`, not `provider_for_session` / `get_session_summarization_provider` (factory.py:194-211), and the Admin Console creates simulation sessions with ai_provider 'openai' (sim-console-driver.ts:80). This is latent today, because offline theming always emits 85% confidence (offline_provider.py:104,112), so nothing in a simulation reaches the >=95 gate. Use the guarded resolver anyway.
- Because offline confidence is a fixed 85%, ranking→CQS in SIM and in offline LIVE always ends 'no_eligible'. The Cube 9 CQS dashboard and reward never show a winner in those modes. Only the live_db test, which pins confidence to 99, exercises a winner. Worth stating in the backlog or the Cube 10 console so the operator does not read it as broken.
- tests/cube6/test_scale_pipeline.py::TestRealData5000CSV::test_scale_projection_5k_to_1m failed once in a full cube5-7 -x run and passed on rerun and in the full run. It is a timing-sensitive projection, so it is a flake risk for CI.
- The ranking_complete broadcast and the webhook fire before the ranking commit (ranking_governance.py:136,158 vs 687). This predates round 13, but the window now spans the whole CQS run (see required change 2).
- Unused imports flagged last round are still there (cqs_engine.py:13 logging, :22 settings), and the score_cqs docstring still says '>95%' while the code uses >= 95.

### Pangu (cutting-edge) — NOT_APPROVED

Round 13's CQS work is sound in its mechanics, and I checked it in the code. Scoring now serialises on pg_advisory_xact_lock instead of a session row lock. Eligibility is filtered in SQL, and participant IDs come from a subquery rather than a bound list. The label is no longer escaped twice. Scores and the winner land in one transaction, and the scoring sits in a SAVEPOINT that rolls back on failure without aborting the ranking. The cube5/6/7 backend suites ran 577 passed, 1 failed, 10 skipped; the failure was a wall-clock timing test that passes when run alone.

Under a cutting-edge and scale lens, the change that wires ranking into CQS opens two gaps that the backlog does not record. First, score_cqs bypasses provider_for_session, the simulation cost guard. A LIVE Admin Console simulation now makes paid AI calls without HI approval, while SIM stays offline, so the two modes no longer behave alike. Second, CQS runs inline inside the ranking transaction. That happens after the ranking_complete broadcast and webhook have gone out but before the aggregation commits, so the 1M ranking endpoint holds its lock and uncommitted result for as long as an unbounded AI loop runs. The sim_1m bench does not measure this because its 1M session has no summaries to score.

Either fix the two items, or record the second one honestly in the backlog with a correct Needs. Everything else I checked is either minor or already in the backlog (HP-01..HP-38).

- **Required:** Resolve the CQS scoring provider through the simulation cost guard: use get_session_summarization_provider(session) (or provider_for_session(session)) in score_cqs instead of get_summarization_provider_or_offline(session.ai_provider). Extend tests/cube6/test_simulation_offline_provider.py so a simulation session with no ai_cost_approval proves CQS runs on OFFLINE.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:80
  - Evidence: cqs_engine.py:80-81 `provider_name = session.ai_provider or "openai"` / `summarizer = get_summarization_provider_or_offline(provider_name)`. Phase A (phase_a.py:84) and the pipeline (pipeline.py:99) go through `provider_for_session`, which returns OFFLINE for `session_type == simulation` with no HI-approved estimate (factory.py:194-206). CQS skips that check. Round 13 made POST /rankings/aggregate call trigger_cqs_scoring with the label (ranking_governance.py:169-181), so this path now runs in every LIVE Admin Console ranking. The gate file has no CQS case (grep 'cqs' in test_simulation_offline_provider.py finds nothing).
  - Why it blocks: This defect is not in the backlog, and round 13 opened it. Before round 13 the path was never reached; now a LIVE simulation run makes a paid AI call for every eligible answer (100 per batch) without the HI approval that addendum 4 and HP-27 require. SIM and LIVE also stop behaving alike: SIM scores CQS offline, while LIVE calls the paid provider.
- **Required:** Commit the ranking aggregation before the ranking_complete broadcast, the webhook and the CQS scoring go out. Then run CQS after the commit, in its own transaction or a background task, and record a per-stage time for it. If you defer this instead, record it in the backlog with a correct Needs, alongside a bound on how many eligible answers one inline scoring may process.
  - File: `backend/app/cubes/cube7_ranking/ranking_governance.py`:683
  - Evidence: In run_ranking_pipeline, emit_ranking_complete broadcasts `ranking_complete` (line ~136), calls `deliver_event(... "ranking_complete" ...)` (line 158) and then awaits `trigger_cqs_scoring(...)` (line 169). That call now runs run_cqs_pipeline inline inside `db.begin_nested()` (cube5 service.py ~926-929), looping `summarizer.batch_summarize` over every eligible answer, 100 at a time (cqs_engine.py ~151-155). Only after all that does line 683 run `await db.commit()`. The aggregation's pg_advisory_xact_lock('agg:…') (ranking_aggregation.py:417) and the uncommitted AggregatedRanking rows are held for the whole AI run. sim_1m.py bench_endpoint never measures this stage: its 1M session has no response summaries, so CQS finds nothing eligible. The backlog never mentions CQS.
  - Why it blocks: Scope 3 is 1M polling with voting. Clients and webhook subscribers are told the ranking is complete, yet GET /rankings returns no committed result until an unbounded AI loop finishes. At 1M, the winning Theme2 can cover tens of thousands of eligible answers, so the request and the aggregation lock last minutes, and a timeout rolls back the ranking itself. No backlog item records this, and the published 1M endpoint time leaves the stage out.

Minor notes:
- tests/cube6/test_scale_pipeline.py::TestRealData5000CSV::test_scale_projection_5k_to_1m fails when run inside the full cube5-7 run and passes alone. It uses wall-clock perf_counter thresholds, so it is flaky under load.
- ranking_governance.py:186-189: the `except TypeError` fallback to the legacy trigger_cqs_scoring signature is dead code. Cube 5 accepts the extended kwargs, and any TypeError raised inside scoring is already caught within trigger_cqs_scoring. Removing it would improve succinctness.
- cqs_engine.py:112-114 (no-eligible path with commit=False): the DELETE of the previous scores runs inside the caller's savepoint. That is correct, but it only reaches the database when the outer ranking commit does, so a stale winner stays visible until then (this is the same timing issue as required change 2).
- pod_router.py:102 resolves get_summarization_provider_or_offline(payload.provider) without any session guard. That is acceptable for the Pod (no simulation session is involved), but it is worth a note in the HP-27 selector work.

### Sofia (multi-perspective) — APPROVED

Both of my round-13 asks are done in 3d989dd. (1) Public 'login' starts are refused: backend/app/cubes/cube5_gateway/router.py:82-85 checks `if payload.action_type == "login": raise HTTPException(status_code=400, detail="Login time is recorded when you join")` before the start guard. Every cube5 stop then mints by the accumulated floor (service.py:234-250, 'heart = max(0, floor((prior_s + duration)/60) - prior_heart)'). The only login credit left is the join's closed entry from create_login_time_entry. (2) The second escape is gone. cqs_engine.py:127-129 sets `safe_theme_label = top_theme2_label` with a comment saying why. The router (cube6_ai/router.py:94-104) resolves the stored label through an exact parameterised IN on {raw, escaped once}. tests/live_db/test_bounds_and_scale.py:265 asserts `labels == {"Privacy &amp; Trust"}`. I also checked that ranking_governance.py:167-189 passes the label and level to trigger_cqs_scoring. The Cube 2/3 per-submission ceil is recorded as operator DECISION HP-38 in the backlog, with an accurate exposure statement and options, so under the acceptance bar it is honestly recorded and does not block. Checks I ran: backend pytest (ENVIRONMENT=test, live_db excluded) 3432 passed / 66 skipped / 0 failed; test:cube-sim-live 837/0; test:worker-api-routes 40/0; test:sim-console-driver 20/0; test:sim-parity passes. I did not run the live_db suite myself. From a multi-perspective view (participant, moderator, operator, economics), scope 1–3 is operational and what remains is minor or recorded in the backlog.


Minor notes:
- cube6_ai/router.py:85-104 imports html, select and Theme inside the function (repeated local-import style); a module-level import would be cleaner.
- Calling the cube-sim-live test with plain `node --test` fails on module resolution; it needs the npm script's ts-alias-loader. A short note in the test header would stop reviewers from misreading the result.
- With accumulated-floor minting, two cube5 entries stopped at the same moment can each read prior totals that leave out the other, so they under-mint (never over-mint). Harmless, but worth one comment line.
- HP-38: until the operator decides, the two specs (Token_Governance_Math.md floor vs CUBES_4-6.md ceil) still disagree on the record.
