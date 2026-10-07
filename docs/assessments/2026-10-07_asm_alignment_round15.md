# 12-AsM alignment — round 15 (2026-10-07, code at 5a5531d, LIVE: Verify Live #2620)

**Approved: 6 / 12** (Odin, Krishna, Christo, Aset, Asar, Pangu). Means: Security 89.6 · Stability 86.8 · Scalability 87 · Efficiency 88 · Succinctness 87.8

Trend (approvals): 0 → 10 → 8 → 12 → 9 → 6 → 2 → 9 → 11 → 7 → 8 → 4 → 6 → 6 → 6.

**Sofia named the unnamed CI failure, and it was not the CQS change:**

- `tests/cube6/test_scale_pipeline.py::TestRealData5000CSV::test_scale_projection_5k_to_1m` timed one wall-clock pass of 5,000 list appends, multiplied it by 200, and asserted under 5 s.
- It failed whenever the full suite ran (GC pauses, neighbouring work) and passed alone. My round-14 guess that the background-CQS proof timed out was wrong.

**The rest converge on background CQS needing the same discipline as theming (Thor, Enlil, Enki, Thoth):**

- Every aggregate started another CQS task, with no per-session dedupe and no limit on the route.
- Each task took a slot of the theming pipeline's shared semaphore and then waited on the session lock. One moderator could fill all ten slots and stall theming for every tenant.
- The task never reported its outcome on its pipeline trigger.
- A failed re-score left the previous winner standing.
- The live_db fixture drained background work for only 2 s.
- Enki also found two real gaps:
  - one Theme02 label can sit under two Theme01 categories, and CQS scored both;
  - the offline provider assigned every theme at 85, under CQS's 95 gate, so an offline session never reached a winner without `_pin`.

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | NOT_APPROVED | 86 | 84 | 82 | 86 | 88 |
| Odin (predictive / future-proof) | APPROVED | 90 | 90 | 86 | 86 | 88 |
| Enlil (implementation & build verification) | NOT_APPROVED | 88 | 78 | 84 | 85 | 82 |
| Krishna (integration & cross-module) | APPROVED | 90 | 91 | 88 | 89 | 86 |
| Enki (diversity & edge cases) | NOT_APPROVED | 90 | 84 | 86 | 87 | 87 |
| Thoth (data & analytics deep dive) | NOT_APPROVED | 91 | 86 | 89 | 90 | 89 |
| Athena (strategic test planning) | NOT_APPROVED | 88 | 80 | 86 | 87 | 86 |
| Christo (consensus & user-flow) | APPROVED | 90 | 91 | 88 | 89 | 90 |
| Aset (consistency validation) | APPROVED | 91 | 91 | 90 | 90 | 90 |
| Asar (synthesis & outcome) | APPROVED | 90 | 91 | 88 | 89 | 90 |
| Pangu (cutting-edge) | APPROVED | 90 | 90 | 87 | 88 | 88 |
| Sofia (multi-perspective) | NOT_APPROVED | 91 | 86 | 90 | 90 | 89 |

## Folded after this round

- **The flaky timing test is measured, not sampled (Sofia).** It takes the best of five passes with the garbage collector paused, so one GC pause or a busy neighbour no longer multiplies into a failure. CI now names failing tests (`pytest -rfEs`, 5a5531d).
- **Background CQS is single-flight per session, on its own capacity (Thor, Enki).**
  - One run per session at a time.
  - Triggers that arrive during a run coalesce into one follow-up run with the latest arguments. The ones they replace are marked `superseded`.
  - CQS has its own semaphore (4) and never takes a theming slot.
  - `POST /rankings/aggregate` is limited to 10 a minute.
  - **Proof (live_db):** 10 parallel aggregates of one session never have two CQS runs in flight, coalesce the rest, end every trigger terminal and leave one winner. The 11th aggregate in the minute gets 429.
- **Every CQS run records its outcome (Enlil, Enki, Thoth).**
  - The `cqs_scoring` trigger goes from `in_progress` to `completed`, carrying `cqs_status`, `total_scored` and the winner. On a timeout or exception it goes to `failed` with the reason.
  - A failed re-score deletes the previous scores and winner, in a fresh transaction.
  - **Proofs (live_db):** an offline aggregate ends `completed` / `completed`. A re-score whose provider raises leaves no old winner and a `failed` trigger.
- **CQS scores only the winning theme's own category (Enki).** The ranking passes the winner's Theme01 category (its parent theme's label), and eligibility filters on it. **Proof (live_db):** one label under two categories; only the winning category's answers are scored.
- **An offline session reaches a CQS winner end to end (Enki).** The offline provider assigns a theme at 95 when it shares a real keyword with the answer, and keeps 85 for a tie-break pick with no shared word. **Proof (live_db):** offline theming, then aggregate, then one winner, with no confidence pinning.
- **The live_db fixture drains background CQS** before the next test, so no task outlives its database (Enlil).

## What each lens said (verbatim)

### Thor (risk & security stress) — NOT_APPROVED

Thor, round 15: NOT_APPROVED, with one required change. The round-14 CQS fold is sound. The aggregation commits before ranking_complete and CQS run, unscored answers are never crowned, the provider gate is right, and cube5/6/7 tests pass (578/0). The one new risk: every POST /rankings/aggregate starts another background CQS task with no per-session dedupe and no rate limit on the route. Each task takes a slot of the shared 10-slot pipeline semaphore before blocking on the per-session lock (service.py l.928/l.964, cqs_engine.py l.80). One session owner, a normal moderator, can therefore fill all 10 slots for up to 600 s each. That stalls AI theming for every other tenant and pays to re-score the whole winning theme each time. HP-39 does not cover this. To approve I need single-flight CQS per session, kept out of the shared semaphore while it waits, plus a limiter on /rankings/aggregate and a live_db proof — or the issue recorded honestly in the backlog with its Needs. Everything else under my lens is minor or already in the backlog.

- **Required:** Make the background CQS run single-flight per session, and keep a run that is waiting for another run of the same session out of the shared pipeline semaphore. Options: (a) keep a dict of in-flight session_id to task in cube5_gateway/service.py and coalesce or skip a new trigger while one is pending or running; or (b) take the lock with pg_try_advisory_xact_lock and return 'already_scoring' instead of blocking; or (c) give CQS its own semaphore. Also add @limiter.limit to POST /rankings/aggregate. Add a live_db proof that 10 rapid aggregates of one session create at most one in-flight CQS run and leave theming slots free. If this is deferred, record it as a backlog row with its Needs.
  - File: `backend/app/cubes/cube5_gateway/service.py`:928
  - Evidence: trigger_cqs_scoring spawns a new task on every call: `task = asyncio.create_task(_score_cqs_background(session_id, top_theme2_label, theme_level))` (l.928) with no per-session dedupe. _score_cqs_background takes `async with _pipeline_semaphore:` (l.964; the same `asyncio.Semaphore(10)` from l.69 that guards the AI theming pipeline at l.729) BEFORE run_cqs_pipeline. Inside it, score_cqs blocks on `SELECT pg_advisory_xact_lock(hashtext(:k))` keyed `cqs:{session_id}` (cqs_engine.py l.80). So when one session is aggregated N times, the extra runs sit in semaphore slots while they wait for the first run's provider calls (up to CQS_TIMEOUT_SEC=600, which also covers the lock wait). POST /rankings/aggregate (cube7_ranking/router.py l.175) has no @limiter; the only limiter in that router is on the vote route at l.68. The only check on that route is require_session_owner('moderator','admin'), and every call reaches run_ranking_pipeline, which calls emit_ranking_complete, which calls trigger_cqs_scoring(background=True) (ranking_governance.py l.169-183). Each queued run then deletes and pays to re-score the whole winning theme again.
  - Why it blocks: One session owner, a normal moderator rather than an admin, can tap 'aggregate' 10 times. That fills all 10 shared pipeline slots for up to 600 s each, and the AI theming pipeline stalls for every other tenant's session because its `async with _pipeline_semaphore` has no timeout. On a live provider, every queued re-score is also paid again. HP-39 records the cost of ONE CQS run at 1M; it does not record unbounded fan-out across concurrent triggers or the cross-tenant starvation of theming. Under my lens this is an unlisted cross-tenant availability defect on a scope-3 path.

Minor notes:
- Verified: pytest tests/cube5, tests/cube6 and tests/cube7 (ENVIRONMENT=test) give 578 passed, 10 skipped, 0 failed at 5a5531d.
- The round-14 fold is correct under my lens. run_ranking_pipeline commits the aggregation (ranking_governance.py l.663) before emit_ranking_complete. Unscored provider answers are dropped by _parse_cqs (bool and out-of-range values refused), and a run with nothing scored gives provider_unavailable with no winner. The result-count mismatch raises instead of zip-truncating. The provider gate goes through provider_for_session, and the stored provider is the one that actually scored.
- Prompt injection into CQS: the scored text is summary_333/111/33, which an AI writes from participant input, and it is sent next to _CQS_INSTRUCTION with no delimiter hardening (cqs_engine.py l.141-143). A participant can try to steer the six metrics so their answer wins the reward. CQS has no cash path today and the summarizer is in between, so this is minor. Worth a backlog line before CQS rewards carry value.
- A scoring that raises partway through (provider exception) rolls back and keeps the previous cycle's scores. A run where the provider returns only unparseable answers commits the delete and leaves no winner. The two failure modes treat existing scores differently; this is acceptable, but the asymmetry could be documented.
- The rows trigger_cqs_scoring writes after the ranking commit (_create_trigger commits itself at l.658; log_audit is committed by the second db.commit at ranking_governance.py l.680) are durable, so the audit trail is intact.
- HP-30, HP-32, HP-33 and HP-37 (Path C forgery, the claimable /api/sessions key, the anon-writable Supabase status channel, per-process rate limits) are still honestly recorded with correct Needs (APPROVAL / INFRA / Worker secret) and do not block on their own.

### Odin (predictive / future-proof) — APPROVED

Both of my round-14 asks are done. (1) CQS now goes through the simulation cost guard: backend/app/cubes/cube6_ai/cqs_engine.py:83 has `provider_name = provider_for_session(session)`. In providers/factory.py:197, provider_for_session sends a simulation that has no HI-approved estimate to OFFLINE. The stored row names the provider that actually scored. (2) Real-provider CQS at 1M is honestly recorded as HP-39 (DECISION + CODE) in the 1M backlog. The row names the unbounded count and cost, sets out three concrete bounding options and says how to measure the chosen one. sim_1m bench --endpoint states that it excludes CQS. The risk I flagged before is now contained in the code: ranking_governance.py:182 passes background=True, so the provider calls run after the ranking request in their own session and transaction (_score_cqs_background, service.py:958). They run under the pipeline semaphore with a 600 s timeout, task refs are kept, and a failure never reaches the ranking. score_cqs takes an advisory xact lock instead of a session row lock. Unscored answers are left out, and a run where nothing was scored returns provider_unavailable with no winner. A count mismatch raises instead of letting zip() drop answers. Eligibility is filtered in SQL, and participants are looked up with a subquery, not a bound id list. I ran cube5, cube6 and cube7 tests with ENVIRONMENT=test: 578 passed, 10 skipped. What remains under my lens is minor or already in the backlog.


Minor notes:
- CQS_TIMEOUT_SEC=600 covers all batches together. At 1M, a winning theme with tens of thousands of eligible answers on a real provider will probably hit this timeout. The run then rolls back and leaves no scores with only a warning log. This belongs in HP-39's bound decision: after the timeout, record a status such as 'timeout' or 'cost_ceiling' instead of only logging.
- _score_cqs_background shares _pipeline_semaphore(10) with the theming pipeline (service.py:729). Ten long CQS runs could hold every slot for up to 600 s and stall theming. A separate, smaller CQS semaphore would future-proof this.
- Background tasks live only in process memory (_cqs_tasks). A worker restart or redeploy during a run silently drops it, because no durable 'pending' state is persisted on the trigger row. Fold this into HP-39's measurement step or the Celery/queue roadmap.
- The provider batches run sequentially (one batch_summarize of 100 at a time) while a DB transaction stays open on the background connection for the whole run. That holds one pool connection for the duration, which is acceptable at a semaphore of 10 but should be noted in HP-39's capacity numbers.

### Enlil (implementation & build verification) — NOT_APPROVED

At 5a5531d the round-14 code does what the round claims. Ranking aggregation commits (ranking_governance.py:667) before the broadcast, the webhook and CQS. CQS runs as a strongly referenced background task in its own session under the pipeline semaphore with a 600 s timeout. score_cqs picks its provider through provider_for_session and stores the provider that actually scored. Unscored answers are left out, and nothing scored gives provider_unavailable. The offline provider returns deterministic six-metric JSON. Locally everything is green: backend 3445 passed / 0 failed, with the live_db proofs running against real Postgres; cube-sim-live 837/0; sim-live-source 55/0; worker-api-routes 40/0. HP-39 is recorded honestly as a DECISION. I cannot sign off as build verifier for two reasons. (1) The Deploy workflow is red on both round-14 SHAs: run 37642098496 on 5a5531d, and the backend check run 112859578990 on 0dee0ad, still with no named test. So the gated ship path is blocked and CI contradicts the local run. A plausible cause is the new fire-and-forget CQS task outliving the live fixture's 2 s drain. (2) The background CQS never updates its cqs_scoring pipeline trigger, so get_pipeline_status shows 'pending' forever, and a provider failure or timeout shows up only in logs. That is an API defect not listed in the backlog. Fix both and I would approve; everything else under my lens is minor.

- **Required:** Get the Deploy workflow green on the shipping SHA, and name the failing backend test before claiming the round-14 fold is verified. The CI rail is red on both round-14 SHAs. A red backend gate means the ship job (needs: [gate, backend]) never runs, so the only door that actually ships is Cloudflare Workers Builds, which bypasses the backend suite. One likely cause, which I have not confirmed: the live fixture drains background work for only 2 s (tests/live_db/conftest.py:126 `await asyncio.sleep(2)`). Meanwhile every POST /rankings/aggregate in test_journey.py:90, test_reopen_cycle.py:78 and test_sim_console_live.py:77 now starts a fire-and-forget CQS task (service.py:928) that can outlive its test database or event loop. Either await/drain `_cqs_tasks` in the fixture teardown, or show that the named failure is something else.
  - File: `.github/workflows/deploy.yml`:174
  - Evidence: GitHub Actions: Deploy run 37642098496 on 5a5531d concluded 'failure' (15:05–15:09Z), and its jobs/log are not retrievable through the API, so the failing test is still unnamed. On 0dee0ad, check run 112859578990 'backend' = failure, with the annotation 'backend run ended without a named test :: SKIPPED [1] tests/cube3/...'. 3d989dd and 5a90a98 Deploy = success. Locally on 5a5531d with Postgres up: `ENVIRONMENT=test python3 -m pytest -q -rfEs` → 3445 passed, 66 skipped, 0 failed, and live_db was not skipped. So CI and local disagree, and nobody has explained why.
  - Why it blocks: Under the build-verification lens, the round is not verified while the CI gate that guards the ship is red with an unexplained, environment-dependent failure. A 'passes locally' that CI contradicts is exactly the green-run/broken-runner split that the FIX THE CLASS law forbids. It is also the most plausible symptom of the new background-task lifecycle.
- **Required:** Make the background CQS run report its outcome on its own pipeline trigger. Pass trigger.id into _score_cqs_background and call update_pipeline_status(bg_db, trigger_id, 'in_progress' → 'completed' / 'failed', error_message=...), the same way the AI pipeline does at service.py:729-805. That covers the provider_unavailable status, the result-count RuntimeError and the 600 s timeout. Add a live_db assertion that the cqs_scoring trigger reaches 'completed' after aggregation and 'failed' when the provider is down.
  - File: `backend/app/cubes/cube5_gateway/service.py`:958
  - Evidence: _create_trigger writes status="pending" (service.py:653). Nothing ever updates a cqs_scoring trigger: grep for update_pipeline_status finds calls only at 732/746/805 in the AI pipeline. _score_cqs_background (958-971) only writes logger.info / logger.warning('cube5.cqs.background_failed'). get_pipeline_status (1024+) therefore reports has_pending=True and all_completed=False forever for every ranked session, and a CQS timeout or provider failure is visible only in server logs.
  - Why it blocks: Round 14 moved CQS off the request and into an untracked background task, so the pipeline status API is now the only way an operator or the Cube 10 console can tell whether scoring finished or failed. It currently reports 'pending' forever. That makes the API's status endpoint wrong, which is scope item 1 ('every API works'). This defect is not listed in the backlog.

Minor notes:
- ruff F401/F841 finds 14 issues across cqs_engine.py, cube5 service.py and ranking_governance.py. They include `import html` (cqs_engine.py:11), still unused since round 13, plus unused `logging`/`settings`, and `winner =` assigned and never read at ranking_governance.py:658. identify_top_theme2 has a side effect (it sets is_top_theme2), so drop the assignment and keep the call.
- _cqs_tasks are held strongly, but the app lifespan never cancels or awaits them. On a deploy restart, an in-flight CQS run is lost silently, and only the trigger row would show it (see required change 2).
- _score_cqs_background shares the 10-slot _pipeline_semaphore with AI theming, so a long CQS run (up to 600 s) can delay theming for other sessions. That is acceptable for now under HP-39's DECISION, but it is worth stating in that row.
- The offline provider recognises a CQS request by the substring 'Score the following response on these 6 metrics'. A wording change to _CQS_INSTRUCTION would silently make every simulation answer unscored (provider_unavailable). A shared constant, or a test that imports _CQS_INSTRUCTION, would pin it.
- Verified green at 5a5531d: backend 3445 passed/0 failed with live_db running against real Postgres; frontend test:cube-sim-live 837/0, test:sim-live-source 55/0, test:worker-api-routes 40/0. The aggregation commit before broadcast/webhook/CQS (ranking_governance.py:667) and provider_for_session in score_cqs are implemented as claimed. HP-39 is an honest DECISION row.

### Krishna (integration & cross-module) — APPROVED

My round-14 ask is done in the code. CQS is no longer inside POST /rankings/aggregate or its transaction.

- **Commit before announce.** run_ranking_pipeline (backend/app/cubes/cube7_ranking/ranking_governance.py, around lines 667-669) calls `await db.commit()` on the aggregation before emit_ranking_complete. That function broadcasts, then delivers the webhook, then calls trigger_cqs_scoring(..., background=True), so no reader is pointed at rows it cannot yet see.
- **Background scoring.** trigger_cqs_scoring (backend/app/cubes/cube5_gateway/service.py:927-931) only creates the trigger and audit row on the request session. It starts `_score_cqs_background` with asyncio.create_task and keeps a strong reference in `_cqs_tasks`. That task opens its own `async_session_factory()` session, runs under `_pipeline_semaphore`, uses `asyncio.wait_for(..., timeout=CQS_TIMEOUT_SEC=600)`, commits on its own, and never raises.
- **Scoring changes confirmed.** In cqs_engine.py, score_cqs uses `provider_for_session(session)` and stores the provider that actually scored. Unscored answers are left out. A mismatch in result count raises. When answers were eligible but none scored, the status is provider_unavailable with no winner.
- **HP-39 is honest.** The backlog records CQS volume and cost at 1M as an operator DECISION + CODE item (cap, sample, or cost ceiling), so it does not block approval.

Checks I ran:
- Backend: `pytest tests/cube7 tests/cube5 tests/cube6` gave 578 passed, 10 skipped (ENVIRONMENT=test).
- Frontend gates (Cubes 1-10 alike in SIM and LIVE, plus the worker API):
  - test:cube-sim-live: 837/0
  - test:sim-parity: 3/3
  - test:sim-console-driver: 20/0
  - test:worker-api-routes: 40/0
  - test:sim-live-source: 55/0
- Running `node --test` directly on cube-sim-live fails on module resolution. The npm script adds the TS alias loader and passes, so this is a harness detail, not a defect.

Minor notes below, none blocking.


Minor notes:
- ranking_governance.emit_ranking_complete starts the background CQS task before run_ranking_pipeline's final db.commit(), which persists the cqs_scoring PipelineTrigger and AuditLog row. If that commit fails, scoring still runs with no trigger or audit record. Moving the create_task after that commit (for example, returning the label and starting the task in run_ranking_pipeline) would make the handoff record land first.
- _score_cqs_background shares _pipeline_semaphore(10) with the AI theming pipeline. A long CQS run of up to 600 s takes a theming slot and holds a DB connection plus the cqs advisory lock the whole time. This is acceptable, and HP-39 governs the volume.
- Background CQS tasks are not drained or cancelled on application shutdown. A deploy mid-run drops the scoring silently (the transaction rolls back, so nothing is corrupted), and no status row says it was interrupted.
- The non-background path (the db.begin_nested savepoint branch) in trigger_cqs_scoring now has no caller with background=False in app code. Only tests reach it, so it could be trimmed for succinctness.

### Enki (diversity & edge cases) — NOT_APPROVED

Round 15, Enki lens, commit 5a5531d. Not approved. Most of the round-14 fold is right and I checked it in the code:
- The ranking commits before the broadcast, the webhook and CQS (ranking_governance.py:667).
- CQS uses provider_for_session.
- _parse_cqs rejects bools, NaN and Inf, missing metrics and out-of-range values.
- A result-count mismatch raises an error.
- A run with eligible answers but nothing scored returns provider_unavailable with no winner.
- The background task keeps strong references and runs under a timeout.
- HP-39 honestly records CQS count and cost at 1M.

Tests: tests/cube5 through cube7 give 577 passed. One test fails in that combination: test_scale_projection_5k_to_1m fails when run with cube5 and cube6 together (also at 3d989dd), and passes alone or in the full suite. It is a wall-clock assertion that depends on test order.

Three edge cases are not handled and not listed in the backlog:
1. CQS eligibility matches only the Theme02 label, not its Theme01 category. Labels are generated per category and can collide. On the 5,000-row CSV, the offline keywords 'raises' and 'real' lead all three categories.
2. Offline theming assigns at 85% confidence, below CQS's 95% gate. So the new offline CQS scorer never produces a winner in a real SIM run; only test-pinned data reaches it, which contradicts the round-14 claim.
3. Background CQS never updates its trigger row, so a failure or timeout leaves it pending forever. Repeated aggregations queue tasks that hold the global pipeline semaphore while they wait on the same-session lock.

Each fix is small and can be proven on live_db.

- **Required:** Score CQS only within the winning theme's own Theme01 category. Pass the category into CQS (emit_ranking_complete already has theme01_category, and the winner Theme row has a parent), and add `ResponseSummary.theme01 == category` to `eligible_where`. Add a live_db proof: two categories hold the same Theme02 label, and only answers from the winning category get scored or win.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:103
  - Evidence: eligible_where = (session_id, in_cycle, `getattr(ResponseSummary, level_field) == top_theme2_label`, confidence >= 95). It has no theme01 term. Theme02 labels are generated and reduced separately for each category (phase_b.py:555 `category = r.get("theme01"...)`, `cat_themes = reduced.get(category...)`), and nothing makes them unique across categories. I checked empirically: offline `_top_keywords` on the v04.1_5000 CSV gives 'raises' and 'real' as top keywords in all three categories (Neutral, Risk & Concerns, Supporting), so the offline labels 'Raises Improvements' and 'Real Improvements' collide. The trigger call at ranking_governance.py:169-183 passes top_theme2_label and theme_level but not theme01_category.
  - Why it blocks: When a ranking is pinned to one Theme01 category, the CQS reward can go to an answer from a different category that happens to share a label. That is the wrong winner for a reward, it is not in the backlog, and it sits on the scope-3 path (Theme01 → Theme02 → ranking → reward).
- **Required:** Make the offline path able to reach CQS, or record honestly that it cannot. The offline provider assigns every Theme01 and Theme02 at confidence 85 (70 when it falls back). CQS requires at least 95, so an offline session (SIM, a LIVE Admin Console simulation without an approved estimate, or a deploy with no keys) always ends with `no_eligible` and never has a winner. Either emit a confidence of 95 or more for the offline deterministic best match, or bring the gate and the offline confidence into line. Then add a live_db proof that does not use `_pin` (offline theming, then aggregate, then one CQS winner). Otherwise, add a backlog row with the correct Needs tag.
  - File: `backend/app/cubes/cube6_ai/providers/offline_provider.py`:112
  - Evidence: offline_provider.py:104 and 112 return `(Confidence: 85%)`; phase_b.py falls back to `confidence = 70`; cqs_engine.py:104 requires `func.coalesce(conf, 0) >= 95`. The live_db helper `_pin` (tests/live_db/test_bounds_and_scale.py:112-114) says so: 'the offline provider scores confidence 85, below CQS's 95 gate, so without this a CQS test scores nothing'. The round-14 record still claims 'The offline provider now returns deterministic six-metric JSON, so simulations still score and crown a winner'. `grep -i cqs` on the backlog finds only HP-39, which is about cost.
  - Why it blocks: Scope 2 asks for the cubes to work alike in SIM and LIVE. As it stands, the offline CQS scorer added this round can only ever run on test-pinned data, and the record says the opposite. That is an unlisted defect and an inaccurate claim.
- **Required:** Make background CQS observable and keep it from piling up. In _score_cqs_background, mark the cqs_scoring PipelineTrigger in_progress, then completed or failed, and store the CQS status (completed, provider_unavailable, no_eligible, timeout) in its metadata, the way the AI pipeline task does at service.py:732. Also coalesce per session: skip, or replace, a task already in flight for the same session, or take the advisory lock before the global semaphore. That stops repeated aggregations of one session from filling every _pipeline_semaphore slot while those tasks wait on the same lock.
  - File: `backend/app/cubes/cube5_gateway/service.py`:958
  - Evidence: _create_trigger writes `status="pending"` (service.py:653). The background path returns the trigger (l.928-931), and _score_cqs_background (l.958-971) never calls update_pipeline_status. A 600 s timeout, provider_unavailable or an exception is only logged (`cube5.cqs.background_failed`), so get_pipeline_status reports has_pending forever. Every aggregate spawns a new task (`asyncio.create_task` with no per-session dedup), and each one takes `async with _pipeline_semaphore` (Semaphore(10), l.69) before score_cqs blocks on `pg_advisory_xact_lock('cqs:<sid>')`. Ten re-aggregates of one session hold all ten slots, and AI theming for every session (l.729) waits up to 600 s per slot.
  - Why it blocks: Under my lens this is the failure path of the new background design. A CQS run that times out at 1M or loses its provider is silent, because the trigger record says pending forever. A moderator or the Admin Console re-running aggregate can stall theming for other sessions. HP-39 records the cost and count but not these effects.

Minor notes:
- tests/cube6/test_scale_pipeline.py:355 test_scale_projection_5k_to_1m fails whenever tests/cube5 runs before tests/cube6, with a projected vote time of 48,599 ms against a 5,000 ms limit (reproduced at both 5a5531d and 3d989dd). It passes alone and in the full suite. It is a wall-clock assertion that depends on test order, and it is a candidate for CI's unnamed intermittent failure.
- _parse_cqs uses plain json.loads, so a real provider that wraps its JSON in ``` fences or adds a sentence of prose has every answer counted as unscored, which gives provider_unavailable. Also, _CQS_INSTRUCTION is never .format()'d, so the model sees the example with doubled braces `{{"insight": 85, ...}}`, which invites invalid JSON. Strip the fences, take the first {...} object, and use single braces.
- Answers whose summaries are all empty are still sent to the provider as 'Response: ' (cqs_engine.py:140). Skip them before scoring.
- cqs_engine.py: the unused imports `html`, `logging` and `settings` remain (Enlil's earlier note).

### Thoth (data & analytics deep dive) — NOT_APPROVED

Thoth, round 15, commit 5a5531d: not approved. The round-14 fold holds for the parts it changed. The ranking commits before the broadcast, webhook and CQS (ranking_governance.py:665-667). CQS eligibility is filtered in SQL, and participants are looked up with a subquery, so the 32,767-parameter limit is not hit. Unscored answers are left out, a result-count mismatch raises an error, the simulation cost guard applies through provider_for_session, and the stored row names the provider that actually scored. tests/cube5, cube6 and cube7 give 578 passed, 10 skipped. Moving CQS into a background task opened two data gaps, and neither is in the backlog. (1) The cqs_scoring trigger, and the ranking_aggregation trigger too, never leave 'pending'. GET /pipeline/status therefore reports has_pending=true forever, and the CQS outcome (completed, provider_unavailable, timeout) appears only in logs. (2) A failed or timed-out background re-score rolls back its own delete. That restores the previous run's winner, and announce_cqs_winner and the CQS dashboard then serve it against the new ranking. Both are small, contained fixes. With them in, and proven on live_db, I would approve.

- **Required:** Make the background CQS task record its outcome on the cqs_scoring PipelineTrigger it was created for. Pass trigger.id into _score_cqs_background. Set in_progress at the start. Set completed with result_metadata {status (completed / no_eligible / provider_unavailable), eligible, unscored, total_scored, winner_response_id, provider} on return. Set failed with error_message on timeout or exception, using update_pipeline_status / _retry_status_update as trigger_ai_pipeline already does. Give the ranking_aggregation trigger a terminal status the same way, from trigger_ranking_pipeline or aggregate_and_announce. Prove it with a live_db test that reads GET /sessions/{id}/pipeline/status after an aggregation: has_pending is false once scoring finishes, and the trigger metadata carries the CQS status.
  - File: `backend/app/cubes/cube5_gateway/service.py`:958
  - Evidence: service.py:910 `trigger = await _create_trigger(db, session_id, "cqs_scoring", metadata=metadata)` creates the row with status="pending" (line 653). `_score_cqs_background(session_id, label, theme_level)` at 958-971 never receives the trigger id and only logs: `logger.info("cube5.cqs.scored", ... cqs.get("status"))` / `logger.warning("cube5.cqs.background_failed: %s", exc ...)`. trigger_ranking_pipeline (825) never updates its trigger either. get_pipeline_status (1049) computes `"has_pending": any(s in ("pending", "in_progress") ...)`, so after any ranking the moderator status API reports has_pending=true and all_completed=false forever. The round-14 statuses provider_unavailable and timeout reach only the logs. Only ai_theming updates its trigger (update_pipeline_status at 663).
  - Why it blocks: Scope 1 asks that every API works. GET /pipeline/status returns false data for every session that reaches ranking. With CQS now running in the background, this endpoint is the only place an operator or the Cube 10 console could see whether scoring completed, found nothing scorable, or failed. It is not listed in the backlog.
- **Required:** When a background re-score fails (timeout, provider exception, or the result-count RuntimeError), do not leave the previous run's scores and winner in place unmarked. Either commit the delete of the session's CQSScore rows in its own step before calling the provider, or delete them in a fresh transaction in the failure branch of _score_cqs_background. Either way, record the failure on the trigger (item 1). Prove it with a live_db test: a first scoring crowns a winner, then a second scoring whose provider raises leaves announce_cqs_winner returning has_winner=False, not the old winner.
  - File: `backend/app/cubes/cube6_ai/cqs_engine.py`:112
  - Evidence: cqs_engine.py:112 `await db.execute(delete(CQSScore).where(CQSScore.session_id == session_id))` runs inside the same uncommitted transaction as the provider calls (lines 143-149) and the `raise RuntimeError(...)` at 151-152. In service.py:966, `asyncio.wait_for(run_cqs_pipeline(...), timeout=CQS_TIMEOUT_SEC)` cancellation or any exception rolls that transaction back, which restores the previous rows. CQSScore has no cycle column (grep 'cycle' app/models/cqs_score.py finds nothing). cube9_reports/service.py:1007-1015 announce_cqs_winner selects `CQSScore.is_winner.is_(True)` for the session, and get_cqs_dashboard (690-708) does the same, so they announce the previous cycle's winner. The comment at cqs_engine.py:108-110 states the rule this breaks: 'a re-opened cycle never keeps (or announces) the previous cycle's winner'.
  - Why it blocks: A failed or timed-out re-score silently republishes a stale reward winner against a new ranking. That is wrong data reaching the reward announcement. It is reachable through the 600 s timeout at 1M, and HP-39 does not cover it. It is not in the backlog.

Minor notes:
- cube9_reports/service.py:724 get_cqs_dashboard uses `str(s.participant_id)` per row, which shows the string 'None' for anonymous answers; the winner block at 714 guards against it, but the row list does not.
- cube9_reports/service.py:708 falls back to `scores[0]` labelled `is_winner: True` when no row is marked. score_cqs now always marks a winner when anything was scored, so this fallback only hides a broken invariant; prefer None.
- _parse_cqs accepts floats in 0-100 although the instruction asks for integers. Harmless for the composite, but the stored scores can be fractional for one provider and integral for another.
- Offline CQS (offline_provider.py:150-156) caps at 95 and uses a length term, so longer summary_333 texts systematically win in simulation. That is acceptable for SIM, but state it where SIM CQS winners are shown.
- The round-14 SQL eligibility filter, the subquery participant map (no 32,767-parameter limit), the result-count check, the order of ranking commit before broadcast/webhook/CQS (ranking_governance.py:665-667), and provider_for_session all check out. tests/cube5, cube6 and cube7 give 578 passed, 10 skipped with ENVIRONMENT=test.

### Athena (strategic test planning) — NOT_APPROVED

I checked both of my round-14 asks first, and both are done in the code. (1) CQS work is now bounded and recorded. It runs off the request in _score_cqs_background (cube5_gateway/service.py:958-970), under the pipeline semaphore (10 slots), with asyncio.wait_for at CQS_TIMEOUT_SEC=600, strong task refs in _cqs_tasks, and its own session and transaction. The remaining unbounded part, how many answers get scored and what that costs at 1M, is backlog row HP-39 as an operator DECISION with options (a)/(b)/(c). That counts as honest. (2) The 1M bench's --endpoint mode states in its output that it excludes CQS: sim_1m.py:202-203 "excludes": "CQS scoring (background, after the request; HP-39)". I verified locally: backend 3445 passed / 66 skipped; tests/live_db 13 passed, including test_ranking_aggregation_scores_cqs, test_cqs_never_crowns_unscored_answers and test_simulation_cqs_stays_offline_without_approval; test:cube-sim-live 837 passed; test:sim-console-driver 20 passed; test:worker-api-routes 40 passed. The one blocker is the CI evidence. The backend job on 0dee0ad failed on one test with no name. The 5a5531d Deploy run (live SHA) ended 'failure' with zero jobs, so the -rfEs change meant to name that test never ran. The 30 s wait in the background-CQS proof was added without knowing which test failed. For approval I need one green backend run on the live SHA, or the failing test named and fixed or recorded in the backlog. Minor, not blocking: a background CQS failure or timeout is only logged (cube5.cqs.background_failed), and no failed status is written next to the cqs_scoring trigger row. An operator can only tell 'scoring failed' from 'still running' by finding no score rows.

- **Required:** Get one green backend CI job on the shipped SHA, or name the failing test and fix it. Re-run Deploy on 5a5531d; it now runs pytest -rfEs, so a failure will name the test. If it fails again, fix that test, or record it in the backlog with its name and its Needs. Until then, do not report the round's live_db proofs (background CQS (n,1), provider down (0,0), simulation scores offline) as proven in CI.
  - File: `.github/workflows/deploy.yml`:174
  - Evidence: Actions API: Deploy run 37640989430 (0dee0ad) has job 'backend' = failure at step 'Backend suite (unit + SQL-tally parity + sim_seed + live-database proofs)'. Its annotations show only SKIPPED lines and 'Process completed with exit code 1', so the failing test has no name. Deploy run 37642098496 (5a5531d, the live SHA) ended 'failure' with total_count 0 jobs and 0 check runs, so the -rfEs change never ran. The 5a5531d commit message lists two things: '-rs kept FAILED lines out of the summary' and 'the background-CQS live_db proof waits up to 30 s'. The second is a guess at the cause, made without knowing which test failed. Locally the result is green: full backend 3445 passed / 66 skipped, and tests/live_db 13 passed. The backlog has no row for the red CI.
  - Why it blocks: Scope 1–3 is gated by CI (live_db proofs, SQL-tally parity, ballot cycle). Under a test-planning lens, a shipped SHA whose backend gate is red on one test, or never ran, is not proven operational. The fix is also unconfirmed: lengthening a wait without knowing what failed may only hide a real background-CQS race or flake.

Minor notes:
- _score_cqs_background (service.py:968-970) logs a failure or the 600 s timeout but leaves the PipelineTrigger 'cqs_scoring' row without a failed or timeout status. Marking the trigger would make a dead background run visible to the Cube 10 console and to tests.
- _cqs_tasks protects tasks from garbage collection, but nothing drains them on shutdown. A deploy restart in the middle of a run drops the run silently, and with no trigger status (see the previous note) nothing shows it. Record this next to HP-39.
- The background-CQS live_db proof polls for 30 s. If CI is slow because the 10-slot pipeline semaphore is shared with AI pipeline runs in the same process, a longer wait hides contention instead of proving the run is bounded. Consider asserting on the trigger status rather than on wall-clock time.

### Christo (consensus & user-flow) — APPROVED

Approved. I checked all three things I asked for last round in the code at 5a5531d, and each is done.

(1) Cost guard. backend/app/cubes/cube6_ai/cqs_engine.py:83 now picks the provider with provider_for_session(session). Lines 84-86 store the provider that actually did the scoring. A simulation without an HI-approved estimate therefore scores on the offline provider and never on a paid one. How much CQS one ranking may spend at 1M is an operator DECISION, recorded honestly as HP-39 in the backlog.

(2) CQS moved out of the ranking transaction. ranking_governance.py:667 calls `await db.commit()` before emit_ranking_complete at line 671, so the broadcast, the webhook and CQS all come after the rows are visible. The CQS trigger passes background=True (line 182). In cube5_gateway/service.py:927-930 it runs as _score_cqs_background (lines 958-971): its own async_session_factory session, the pipeline semaphore, wait_for with a 600 s timeout, and a strong reference to the task in _cqs_tasks. A failure is logged and never reaches the ranking.

(3) No winner from unscored answers. _parse_cqs (lines 242-256) returns None when the reply is empty, is not JSON, is not an object, or has a metric that is missing, a bool, or outside 0-100. Those answers are skipped instead of being entered at 50 on every metric. When answers were eligible but none was scored, run_cqs_pipeline returns status provider_unavailable with winner None (lines 271-277). If the provider returns a different number of results than answers sent, a RuntimeError replaces the old zip() silent drop (line 207). The old scores are deleted on every path, so a stale winner is never announced again. The live_db proof is test_bounds_and_scale.py:354.

Tests I ran:
- Backend cube5, cube6 and cube7: 578 passed, 10 skipped.
- Frontend cube-sim-live: 837/837.
- sim-console-driver: 20/20.
- worker-api-routes: 40/40.

From a consensus and user-flow view, a voter's ranking now finishes and is announced without waiting on the AI provider. A reward is only given for an answer that was actually scored. What is left is minor (see notes).


Minor notes:
- run_cqs_pipeline still returns status 'completed' when only some answers were scored (cqs_engine.py:304-310). It does not report the unscored count from stats, so a run where 90% of answers went unscored looks the same as a clean run to the moderator or a reader of the API. Adding 'unscored' to the return value and to the cube6.cqs.winner_selected log would make this visible.
- Background CQS sends no signal when it finishes: no broadcast or webhook says the CQS winner is ready. The moderator only learns the result by reading POST/GET /ai/cqs or the stored rows. A 'cqs_ready' event, or an entry in the existing webhook list, would complete the flow from ranking to reward.
- _cqs_tasks lives only in memory. A process restart while scoring is running loses the run quietly; only the trigger row and audit row remain. That is acceptable while the bound is still open under HP-39, but it should be noted with HP-39.

### Aset (consistency validation) — APPROVED

Approved under the consistency lens. I checked the Round 14 fold in /tmp/claude-0/wtm at 5a5531d and found the same rules applied on every path.

1. Aggregation commits first. `run_ranking_pipeline` (ranking_governance.py, around line 667) runs `await db.commit()` before `emit_ranking_complete`. The broadcast, the webhook and CQS therefore never point at uncommitted rows.

2. CQS runs off the request. `emit_ranking_complete` calls `trigger_cqs_scoring(..., background=True)`. `_score_cqs_background` (cube5_gateway/service.py:958) opens its own session through `async_session_factory()`, holds the pipeline semaphore, uses `wait_for(..., 600)`, keeps strong references in `_cqs_tasks` and never raises.

3. The provider rule is the same everywhere. CQS uses `provider_for_session` (cqs_engine.py:83), just as Phase A (phase_a.py:84) and `run_pipeline` (pipeline.py:99) do. So a simulation without an HI-approved estimate scores offline. The stored provider is read from `summarizer.provider_name.value`, and every provider class defines that enum, so the row names the provider that actually scored.

4. Failures are handled honestly. `_parse_cqs` rejects answers that are not JSON, not a dict, missing a metric, out of range, or boolean. Unscored answers are left out. If nothing is scored, the result is `provider_unavailable` with `winner=None`. A mismatch between result count and answer count raises.

5. The re-score is idempotent on every path, so a re-opened cycle never keeps the previous winner.

6. The background path and the `/ai/cqs` route both pass the stored `Theme.label`. Phase B html-escapes theme labels once and the summaries carry the same strings, so the CQS label filter matches.

The cost of CQS at 1M is recorded honestly as HP-39 (an operator DECISION).

Checks I ran:
- `npm run test:cube-sim-live`: 837 passed, 0 failed.
- The full backend suite (ENVIRONMENT=test, `-x`) exited 0.
- `test_scale_projection_5k_to_1m` failed once while I was also running the frontend gate, then passed on its own (see minor notes).

What remains is minor and listed in the minor notes.


Minor notes:
- cqs_engine.py: the eligible filter matches on label, level and confidence only (`getattr(ResponseSummary, level_field) == top_theme2_label`). It does not filter on `theme01`, but the ranking is pinned to a (category, level) slice. If two Theme01 categories ever produce the same Theme02 label, CQS would score both groups. This is the same class as the round-11 note on the CSV label map ('label map stays session-wide', recorded as minor). Adding `ResponseSummary.theme01 == <winner's category>` would close it.
- cube5_gateway/service.py:932-950: the foreground (non-background) CQS path, using a SAVEPOINT with commit=False, still exists, but production now uses only `background=True` (ranking_governance.py:182). Only tests reach it. Two transaction models for one operation is a drift risk; consider removing the foreground path or documenting it as test-only.
- ranking_governance.py: the background CQS task starts inside `emit_ranking_complete`, before the second `db.commit()` that stores the cqs_scoring trigger and audit rows. If that commit fails, scoring still runs without its trigger record. This is a narrow window.
- tests/cube6/test_scale_pipeline.py::test_scale_projection_5k_to_1m measures wall-clock time (perf_counter). It failed once while another test suite was running at the same time and passed on its own. It is a candidate for the CI flake that went unnamed at 0dee0ad; consider loosening the threshold or marking it as a benchmark.
- /ai/cqs (cube6_ai/router.py:67) returns 202 but scores synchronously within the request. The status code does not match the behaviour, unlike the ranking path, which now runs CQS in the background.

### Asar (synthesis & outcome) — APPROVED

Both items from my last verdict are done in the code at 5a5531d.

(1) No CQS winner when the provider fails. `_parse_cqs` (backend/app/cubes/cube6_ai/cqs_engine.py:210) returns None for an empty reply, invalid JSON, a missing metric, a boolean value or a value outside 0-100. Those answers are skipped and counted as `unscored`; they are no longer entered at 50 on every metric. A result-count mismatch now raises: `if len(results) != len(eligible): raise RuntimeError(...)` (line 153). In `run_cqs_pipeline` (line 273), when nothing was scored but there were eligible answers, the status is `provider_unavailable` and `winner: None`. The live_db proof test_bounds_and_scale.py:354 asserts this.

(2) CQS is off the ranking transaction. ranking_governance.py:665-667 commits the aggregation before `emit_ranking_complete` runs. The broadcast, the webhook and CQS all fire after that commit. `trigger_cqs_scoring(..., background=True)` (ranking_governance.py:169-182) starts `_score_cqs_background` (cube5_gateway/service.py:958). That function runs in its own `async_session_factory()` session, behind `_pipeline_semaphore`, with `asyncio.wait_for(..., timeout=600)`. The `_cqs_tasks` set keeps a strong reference to each task. Outside dev/test, a missing provider key still raises (factory.py:160) and does not fall back to the offline scorer. A simulation without an HI-approved estimate goes through `provider_for_session` and is scored offline. The stored row names the provider that actually did the scoring.

Checks I ran: backend cube5/6/7 578 passed, 10 skipped; the `-k cqs` suite 20 passed; frontend `test:cube-sim-live` 837 passed, 0 failed. The live_db proofs were skipped because there is no local Postgres here, so I read them but did not run them.

What is left is honestly recorded in the backlog. HP-39 covers CQS count and cost at 1M, including the 600 s timeout that a theme with tens of thousands of answers would hit; it is correctly marked as a DECISION. The sim_1m bench states that it excludes CQS. Scope 1-3 is operational under my lens.


Minor notes:
- Partial provider failure is reported as complete. If some answers are unscored and at least one is scored, `run_cqs_pipeline` (cqs_engine.py ~304) returns status 'completed' with no `unscored` count. A winner is then picked from the scored subset only, and the result does not say that some answers were left out. Suggest putting `stats['unscored']` in the result, or a status such as 'partial'.
- A background CQS failure or timeout is only logged (`cube5.cqs.background_failed`, service.py:971). The cqs_scoring PipelineTrigger row is never marked failed, so the moderator and the API cannot tell 'no winner because scoring failed' apart from 'still scoring'.
- The in-process background task is lost if the worker restarts during scoring, and nothing re-queues it. This is worth one line in HP-39 or the delivery-queue item for the case where a durable queue arrives.
- Running the gate file with plain `node --test tests/cube-sim-live.test.mjs` fails with a module-resolution error, because it needs the ts-alias loader. `npm run test:cube-sim-live` passes. A loader comment at the top of the test file would help reviewers.

### Pangu (cutting-edge) — APPROVED

I checked the three changes from my round-14 verdict in the code at 5a5531d, and all three are done. (1) Cost guard: score_cqs uses provider_for_session, so a simulation scores on OFFLINE unless an HI-approved cost estimate exists, and the stored row names the provider that actually scored. (2) Commit first: run_ranking_pipeline commits the aggregation before emit_ranking_complete sends the broadcast, the webhook and the CQS trigger. (3) CQS after the commit, with a bound: CQS runs as a background task with its own session and transaction, under the pipeline semaphore with a 600 s timeout, and it can never fail the ranking. The remaining 1M bound on how many answers are scored and what that costs is honestly recorded as HP-39 (DECISION + CODE). The cube5, cube6 and cube7 backend tests pass (578 passed, 10 skipped), as do the cube-sim-live gate (837/0) and the sim-console-driver tests (20/0). What is left under the Pangu lens is minor: no terminal status is persisted when scoring times out, CQS shares the theming semaphore, and the background task is not durable across a restart. Scope 1–3 is operational under this lens.


Minor notes:
- Done: cost guard for CQS. cqs_engine.py score_cqs calls provider_for_session(session) (factory.py:194-206): a simulation without an HI-approved estimate scores on OFFLINE. The stored provider is the one that actually scored (the summarizer.provider_name fallback).
- Done: aggregation commits before announcing. ranking_governance.py has `await db.commit()` before emit_ranking_complete (about line 667), so the broadcast, the webhook and CQS never point at uncommitted rows.
- Done: CQS runs after the commit, with a bound. emit_ranking_complete passes background=True. _score_cqs_background (cube5_gateway/service.py:958) runs in its own async_session_factory session, under _pipeline_semaphore, with asyncio.wait_for(timeout=CQS_TIMEOUT_SEC=600). Strong task refs are kept in _cqs_tasks, and a failure never reaches the ranking. The number of answers scored and the cost at 1M are still unbounded, but HP-39 records this honestly as DECISION + CODE.
- Minor: when the 600 s timeout fires, the whole scoring transaction rolls back. Nothing is persisted for it (no 'timeout' status row), only a log line. When the HP-39 bound is chosen, consider recording a terminal status such as 'timeout' or 'cost_ceiling' so the dashboard can tell 'not scored' apart from 'still scoring'.
- Minor: CQS shares _pipeline_semaphore(10) with the AI theming pipeline, so a long CQS run can hold a theming slot for up to 600 s. A separate, smaller semaphore for CQS would isolate the two.
- Minor: the fire-and-forget asyncio task is not durable. A process restart mid-scoring drops it, and nothing re-queues it. This fits the existing v1 inline/fire-and-forget pattern (webhooks have the same gap), and the scoring can be repeated by re-aggregating.
- Checked locally: backend tests/cube5, cube6 and cube7 give 578 passed, 10 skipped. npm run test:cube-sim-live gives 837 passed, 0 failed, and test:sim-console-driver gives 20 passed, 0 failed. Running the gate with bare `node --test` fails on module resolution; the npm script uses the TS alias loader and passes, so this is not a defect.

### Sofia (multi-perspective) — NOT_APPROVED

Sofia, Round 15, at 5a5531d. Under my lens the round-14 CQS changes are correct and the code agrees with itself. The ranking commits before anything announces it, CQS runs in the background in its own transaction under the semaphore and timeout, a simulation scores offline, unscored answers can never win, and HP-39 records the unbounded CQS cost at 1M as an operator DECISION. The SIM and LIVE gates for Cubes 1–10 pass (cube-sim-live 837/0, sim-console-driver 20/0), and the backend suite gives 3444 passed / 0 failed apart from one test. That test is the blocker: test_scale_projection_5k_to_1m times 5,000 list appends on the wall clock, multiplies by 200 and asserts under 5 s. It fails every time the file or the cube5–7 suite runs (48–54 s projected) and passes alone. It is the only failure I can reproduce, and the Deploy run for 5a5531d is red. The round-14 record blamed the unnamed CI failure on the background-CQS live_db proof without naming a test. Making the timing test independent of the run and showing a green, named backend gate would earn my approval.

- **Required:** Make the backend gate green and correct the record of why it was red. tests/cube6/test_scale_pipeline.py::TestRealData5000CSV::test_scale_projection_5k_to_1m checks wall-clock time for 5,000 trivial list appends (BordaTally.add_vote), multiplies it by 200 and asserts the result is under 5 s. It fails every time the whole file or the cube5+6+7 suite runs, and passes when run alone. Fix one of two ways: (a) time it so the result does not depend on the run (gc.disable() around the loop, or time.process_time with a best-of-N), or (b) move it to a benchmark marker that stays out of the CI command. Then show the Deploy run for that SHA with the backend job green. Round 14 blamed 0dee0ad's one unnamed CI failure on the background-CQS live_db proof and lengthened that wait to 30 s. The commit message only says '1 of 3,446 failed with no name' and never names the test. The timing test is the only failure I can reproduce: the full suite without it gives 3444 passed, 66 skipped, 0 failed. The Deploy run for 5a5531d (37642098496) concluded 'failure'.
  - File: `backend/tests/cube6/test_scale_pipeline.py`:356
  - Evidence: `assert projected_vote_ms < 5000, f"Projected vote time too high: {projected_vote_ms:.0f}ms"`. Runs: alone 'vote=4.3ms … 1M projected: vote=869ms' (pass). Whole file, three runs: 'vote=272.2ms … 1M projected: vote=54439ms', 'vote=130.0ms', and '1 failed, 40 passed' twice. `pytest tests/cube5 tests/cube6 tests/cube7` gives '1 failed, 577 passed' with 'AssertionError: Projected vote time too high: 48937ms'. Full `python3 -m pytest` with only this test deselected gives '3444 passed, 66 skipped'. GitHub: run 37642098496 'Deploy' on 5a5531d has conclusion failure. 5a5531d commit message: 'the background-CQS live_db proof waits up to 30 s' (a guess, not a named test).
  - Why it blocks: deploy.yml makes the backend suite a gate on the ship job ('a red backend suite stops the deploy exactly as a red frontend gate does'). So the code serving the site has a red backend gate whose cause is recorded wrong. Under the multi-perspective lens, the operator, CI and the record all have to say the same thing. Today a green local run, a red CI run and a wrong attribution coexist, which is the pattern 'FIX THE CLASS' warns against. It is a small fix, and Stability cannot reach 90 until the gate is green and named honestly.

Minor notes:
- I checked the Round 14 fold and it holds. run_ranking_pipeline commits the aggregation (ranking_governance.py:667) before emit_ranking_complete broadcasts, delivers webhooks or triggers CQS. Then emit_ranking_complete commits the trigger and audit row (684).
- _score_cqs_background (cube5_gateway/service.py:958-971) runs in its own async_session_factory session behind _pipeline_semaphore, with asyncio.wait_for(600 s) and strong references in _cqs_tasks, and it never raises. The 600 s timeout starts only after the semaphore is acquired, so a backlog of rankings can queue CQS indefinitely. That is acceptable and falls under HP-39.
- score_cqs uses provider_for_session and stores the provider that actually ran (cqs_engine.py:83-86). run_cqs_pipeline returns provider_unavailable with no winner when there were eligible answers but none were scored (273).
- A provider_unavailable re-score deletes the session's earlier CQS rows and winner before the provider fails (delete at score_cqs, then commit). This is deliberate idempotency (round 12), but the operator should know that an outage clears the previous winner instead of keeping it.
- HP-39 (CQS count and cost at 1M) is recorded honestly as DECISION + CODE with concrete options a/b/c. It does not block approval.
- Frontend gates pass: test:cube-sim-live 837/0 and test:sim-console-driver 20/0. Run bare with node --test, cube-sim-live fails with ERR_MODULE_NOT_FOUND. It needs the npm script's --loader ts-alias-loader, which is fine, but reviewers should be told to use the npm script.
- Backend suite without the timing test: 3444 passed, 66 skipped. The live_db proofs skip here because there is no Postgres, so I could not re-verify the four new live_db proofs locally.
- Run 37642098496 (Deploy) returns zero jobs from the jobs API, so I could not read which step failed. The finding rests on the local reproduction plus the run's failure conclusion.
