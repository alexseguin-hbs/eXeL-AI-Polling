# 12-AsM alignment — round 16 (2026-10-07, code at f948db9, LIVE: Verify Live #2622)

**Approved: 4 / 12** (Thor, Enlil, Athena, Sofia). Means: Security 89.7 · Stability 85.6 · Scalability 87.1 · Efficiency 88.3 · Succinctness 86.8

Trend (approvals): 0 → 10 → 8 → 12 → 9 → 6 → 2 → 9 → 11 → 7 → 8 → 4 → 6 → 6 → 6 → 4.

**Five lenses found the same real defect in my round-15 category filter (Enki, Thoth, Christo, Aset, Asar):**

- A session's `theme01_category` is a KEY (`risk`, `support`, `neutral`), set by the Cube 10 console and the ranking config.
- `ResponseSummary.theme01` holds the LABEL (`Risk & Concerns`).
- Round 15 forwarded the key whenever the session had one, so every configured-category session scored nothing and had no CQS winner.
- My round-15 proof called the engine directly with a label, so it never went through that path.

**And the round-15 failure guarantee did not cover cancellation (Odin, Pangu):**

- A deploy mid-run raises `CancelledError`, which `except Exception` misses. The previous winner stayed crowned, and the trigger stayed `in_progress` forever.
- Nothing swept triggers orphaned by a restart.
- Krishna: the manual `POST /ai/cqs` still bypassed the tracked path.

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | APPROVED | 91 | 91 | 90 | 90 | 90 |
| Odin (predictive / future-proof) | NOT_APPROVED | 88 | 83 | 82 | 86 | 85 |
| Enlil (implementation & build verification) | APPROVED | 90 | 91 | 88 | 90 | 89 |
| Krishna (integration & cross-module) | NOT_APPROVED | 89 | 87 | 87 | 88 | 86 |
| Enki (diversity & edge cases) | NOT_APPROVED | 88 | 80 | 85 | 86 | 83 |
| Thoth (data & analytics deep dive) | NOT_APPROVED | 90 | 84 | 90 | 90 | 86 |
| Athena (strategic test planning) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Christo (consensus & user-flow) | NOT_APPROVED | 88 | 78 | 85 | 86 | 83 |
| Aset (consistency validation) | NOT_APPROVED | 90 | 82 | 86 | 88 | 85 |
| Asar (synthesis & outcome) | NOT_APPROVED | 90 | 84 | 88 | 89 | 87 |
| Pangu (cutting-edge) | NOT_APPROVED | 90 | 84 | 84 | 86 | 88 |
| Sofia (multi-perspective) | APPROVED | 91 | 91 | 90 | 90 | 90 |

## Folded after this round

- **CQS always compares a label with a label (Enki, Thoth, Christo, Aset, Asar).**
  - The ranking derives the winner's Theme01 label from its parent theme every time.
  - With no parent, the session key maps to its label through the pipeline's own key table.
  - **Proof (live_db):** a session configured with a category key ranks inside that category through `POST /rankings/aggregate`, CQS crowns one winner, and the trigger ends `completed`.
  - **Verified to bite:** on the round-15 ranking code the same test gets (0, 0).
- **Cancellation is a failure too (Odin, Pangu).**
  - `_score_cqs_once` catches `CancelledError`, then runs the cleanup under `asyncio.shield` (clear the stale winner, mark the trigger `failed: CQS interrupted`) and re-raises.
  - The lifespan shutdown lets CQS finish for 10 s and then cancels it.
  - **Proof (live_db):** a slow re-score interrupted by shutdown leaves no old winner.
- **Triggers orphaned by a restart are closed at startup (Odin).** A theming or CQS trigger still pending or in progress past its timeout is marked `failed`, with the reason "interrupted (process restarted)". **Proof (live_db):** a stale trigger is swept; a young one is left alone.
- **Failure cleanup takes the session's advisory lock and spares a newer completed run (Pangu).**
- **The manual `POST /ai/cqs` uses the tracked path (Krishna).**
  - It runs with its own trigger, CQS capacity, timeout, failure cleanup and the theme's own category, and is limited to 10 a minute.
  - **Proof (live_db):** a manual run records a `completed` trigger.
- **The theming background task holds a strong reference (Odin's note).**
- **Backlog:**
  - HP-39 is refreshed (CQS has its own semaphore; the 600 s timeout at 1M is named).
  - **HP-40, new (INFRA + CODE):** background pipelines are in-process, so single-flight holds per worker. N replicas serialise correctly on the advisory lock but at N× the provider cost, and a durable queue is the fix.

## What each lens said (verbatim)

### Thor (risk & security stress) — APPROVED

I approve. All three things I asked for last round are in the code at f948db9.

(1) Background CQS runs one at a time per session. `_schedule_cqs` (backend/app/cubes/cube5_gateway/service.py:963-971) holds a `_cqs_inflight` task for each session. A trigger that arrives while a run is in flight goes into a single `_cqs_rerun` slot, and the trigger it replaces is marked `cqs_status=superseded`. CQS now acquires its own `_cqs_semaphore = asyncio.Semaphore(4)` (l.956) inside `_score_cqs_once` (l.1018), not a theming slot. A waiting follow-up therefore holds no shared capacity: N rapid aggregates cost at most one run plus one coalesced follow-up.

(2) `POST /rankings/aggregate` carries `@limiter.limit("10/minute")` (cube7_ranking/router.py:176), behind `require_session_owner("moderator","admin")`.

(3) The live_db proofs exist and pass (tests/live_db/test_bounds_and_scale.py:422-495):
- An offline session gets a CQS winner and its trigger ends completed.
- Ten parallel aggregates give `max_inflight <= 1`, at least one superseded trigger, exactly one winner, and the 11th call returns 429.
- A failed re-score leaves (0,0) scores and a failed trigger.
- A label shared by two categories is scored only in the winning category.

I ran tests/live_db/test_bounds_and_scale.py plus tests/cube5 and tests/cube7 here: 388 passed, 0 failed.

I also checked for a race I suspected and it does not occur. The background task updates the trigger row on a separate connection. That could fail if the row were not yet committed, but `_create_trigger` commits it (l.658), and `aggregate_and_complete` commits the aggregation before `emit_ranking_complete` runs (ranking_governance.py ~l.676). The failure path deletes the previous scores in a fresh transaction and records the reason through `_retry_status_update`.

The remaining rate-limit and scale risks under my lens are honestly recorded in the backlog: per-process limiter and in-process single-flight (HP-10/HP-37, INFRA), the CQS spend bound at 1M (HP-39, DECISION), crowd NAT throttling (HP-28, DECISION), and Path C, the session record and the Supabase status channels (HP-30/32/33, APPROVAL/INFRA). None of these blocks scope items 1–3.


Minor notes:
- `drain_cqs_tasks` says it serves 'tests and shutdown', but app/main.py's lifespan never calls it. On shutdown, an in-flight CQS run can be cancelled with its trigger left `in_progress`: CancelledError is a BaseException, so the `except Exception` at service.py ~l.1032 skips the failed-status write. Calling `await drain_cqs_tasks()` in the lifespan shutdown branch would close this.
- Single-flight lives in each process's `_cqs_inflight` dict. With N backend workers, one session can run up to N CQS jobs at once. This belongs with HP-10/HP-37 (shared store); one sentence there would make it explicit.
- If a task is cancelled before its coroutine first runs, its `finally` never pops its `_cqs_inflight` entry. This is harmless because `_schedule_cqs` checks `.done()` and replaces the entry; noted only for tidiness.

### Odin (predictive / future-proof) — NOT_APPROVED

Not approved. Round 15's single-flight CQS is sound within one process and safe across processes, because a Postgres advisory lock serialises runs (cqs_engine.py:80). The ranking commits before any announcement, offline sessions now reach a winner, and the CQS tests pass locally (8/8). Under the future-proof lens, the gap is restart and redeploy. An interrupted run is not covered by the new invariant: CancelledError is not caught, and lifespan shutdown never drains the tasks. The rollback then keeps the previous ranking's is_winner row, which Cube 9 serves and notifies, and the cqs_scoring trigger stays in_progress forever. Background pipeline triggers (ai_theming and CQS) have no recovery for orphans, so has_pending stays true for good, and the backlog does not list this. Two narrow changes would earn approval: handle cancellation and drain on shutdown, then either add a sweep for orphaned triggers or record it honestly as a backlog row. The rest is minor: per-replica coalescing, the stale HP-39 text and 600 s timeout at 1M, and the unreferenced ai_theming task.

- **Required:** Make the round-15 invariant ('a failed run leaves no previous winner standing; the trigger ends completed or failed') hold when the run is cancelled, not only when it raises. Catch asyncio.CancelledError (a BaseException, so `except Exception` misses it) in _score_cqs_once. Run the delete-scores and mark-failed cleanup under asyncio.shield, then re-raise. Also call drain_cqs_tasks, or cancel and then drain, in the lifespan shutdown before close_postgres().
  - File: `backend/app/cubes/cube5_gateway/service.py`:1035
  - Evidence: service.py:1035 `except Exception as exc:  # noqa: BLE001`: the module has no CancelledError handler anywhere (grep). main.py lifespan shutdown is only `yield` then `await close_postgres()` (engine.dispose()). drain_cqs_tasks' docstring says 'tests and shutdown', but only the test fixture calls it. If the process stops mid-run (any backend redeploy or restart), the transaction rolls back. The previous ranking's CQSScore rows, including is_winner=True, survive. Cube 9 serves them (cube9_reports/service.py:708 `winner = next((s for s in scores if s.is_winner), ...)`) and so does the winner notification (cube9_reports/service.py:1004-1015). The cqs_scoring trigger stays 'in_progress' forever.
  - Why it blocks: Round 15 claims 'a failed re-score deletes the previous scores+winner'. On the most predictable failure in production, a deploy during a run that may take up to 600 s, this does not hold. It is not in the backlog. The result is a stale winner from an earlier ranking, crowned and notified. That is the exact class round 15 set out to close.
- **Required:** Recover orphaned pipeline triggers. At startup, or on read in get_pipeline_status, mark ai_theming and cqs_scoring triggers failed when they are older than their timeout and still 'pending'/'in_progress' (reason 'interrupted'). Alternatively, record in-process background tasks (theming and CQS) as a backlog row with Needs = INFRA + CODE: a durable queue or a restart sweep.
  - File: `backend/app/cubes/cube5_gateway/service.py`:1122
  - Evidence: service.py:1122 `"has_pending": any(s in ("pending", "in_progress") for s in statuses)`. Background work is a bare asyncio.create_task (service.py:787 for ai_theming, service.py:971 for CQS) and is lost on restart. Nothing in backend/app ever moves an orphaned in_progress trigger forward (grep for in_progress shows only the two writers). The backlog has no row for restart or durability of background pipelines (grep restart/shutdown/queue: only HP-06/HP-09, which concern other paths).
  - Why it blocks: GET pipeline status reports has_pending=true and never all_completed for any session whose background run spanned a restart. This is an unlisted, deterministic failure that will appear at the first production redeploy under load. It must be either fixed or honestly recorded in the backlog.

Minor notes:
- Horizontal scaling is safe for correctness. _cqs_inflight/_cqs_rerun are per-process, but run_cqs_pipeline serialises across processes on pg_advisory_xact_lock(hashtext('cqs:<session>')) (cqs_engine.py:80). With N replicas the only cost is up to N concurrent queued runs instead of 2. Worth one line under HP-37/HP-10.
- HP-39 is stale. It still says CQS runs under the 'pipeline semaphore', but round 15 gave CQS its own _cqs_semaphore(4) (service.py:956). Refresh the row. At 1M, a sequential batch of 100 calls x ceil(eligible/100) will very likely hit CQS_TIMEOUT_SEC=600. The result is 'CQS timeout' and no winner, which the DECISION row should name explicitly.
- ai_theming's asyncio.create_task at service.py:787 keeps no strong reference to the task; the Python docs warn such a task can be garbage-collected mid-flight. Hold it in a set the way _cqs_side_tasks does.
- Superseded triggers are marked status 'completed' with cqs_status 'superseded'. A consumer reading only status cannot tell them from real completions. Consider documenting this in the PipelineTriggerRead schema.
- Each CQS run holds a DB connection and an advisory transaction lock for up to 600 s, with 4 per process. Size the pool against this when replicas scale.

### Enlil (implementation & build verification) — APPROVED

Round 16, Enlil lens: both things I asked for last round are done in the code, so I approve.

(1) Green build on the shipping SHA. GitHub Actions for f948db9: the Deploy backend job passed, Verify Live #2622 passed, and the Deploy gate job was still running when I checked. The failing test is named and fixed. tests/cube6/test_scale_pipeline.py now takes the best of 5 timed passes with garbage collection paused (lines 339-351). In .github/workflows/deploy.yml, line 174 runs pytest with -rfEs, and lines 182-190 turn each FAILED/ERROR line into a check annotation, falling back to the log tail when there is none.

(2) Background CQS records its outcome on its own pipeline trigger. In cube5_gateway/service.py:
- _create_trigger commits the trigger (line 658) before _schedule_cqs runs, so the background task never reads a trigger that is not there yet.
- _score_cqs_once moves the trigger in_progress -> completed, with cqs_status, total_scored and winner_response_id.
- On a timeout or exception, it deletes the old CQSScore rows in a fresh transaction and marks the trigger failed via _retry_status_update.
- Runs are single-flight per session: _cqs_inflight and _cqs_rerun coalesce triggers, and a replaced trigger is marked cqs_status=superseded.
- CQS has its own _cqs_semaphore(4), separate from the theming slots.
- POST aggregate is limited to 10/minute (cube7_ranking/router.py line 176).

The ranking commits before emit_ranking_complete (ranking_governance.py around line 675). The winning theme's Theme01 category comes from its parent theme's label (lines 96-104).

Local run of tests/cube5, tests/cube7, tests/cube6/test_scale_pipeline.py and tests/live_db: 434 passed, 0 failed.

Remaining items under my lens are minor (see minor_notes). The unbounded CQS cost at 1M is honestly recorded as HP-39 (DECISION + CODE).


Minor notes:
- drain_cqs_tasks's docstring says 'tests and shutdown', but main.py's lifespan (lines 64-87) never calls it; shutdown only runs close_postgres(). On a deploy or restart in the middle of a CQS run, the task is cancelled. CancelledError is a BaseException, which the 'except Exception' in _score_cqs_once does not catch, so the cqs_scoring trigger stays 'in_progress' and get_pipeline_status reports has_pending forever. The AI theming triggers have the same problem. Either call drain_cqs_tasks before close_postgres, or sweep stale in_progress triggers at startup. This is not in the backlog.
- The Financial cloud e2e workflow fails on f948db9 and on every earlier SHA I sampled (5a5531d, 3d989dd, 5a90a98, 5db382a), at the step 'Sign in, record, read the database, read back on a new device'. It is outside the polling/API scope, but a check that is red on every commit hides new breakage. Fix it or list it in the backlog with its INFRA need.
- The superseded marker is stored under status 'completed' with cqs_status=superseded. Consumers that read status alone will count a superseded run as a completed score. Worth stating in the API contract or the pipeline-status response.

### Krishna (integration & cross-module) — NOT_APPROVED

Krishna, round 16 (code at f948db9). The round-15 fold of the ranking-to-CQS handoff is sound and wired end to end, but one public route into the same CQS engine still bypasses it, so the verdict is NOT_APPROVED with one required change.

**What holds:**
- emit_ranking_complete resolves the winning theme's own Theme01 category: its parent Theme.label, which is the same r['theme01'] value phase_b stores on ResponseSummary.
- It hands label, level and category to trigger_cqs_scoring(background=True).
- _schedule_cqs coalesces triggers per session. Superseded triggers are marked through a tracked side task.
- _score_cqs_once runs under its own Semaphore(4) with a 600 s timeout. It moves the trigger from in_progress to completed, and update_pipeline_status merges result_metadata, so the Cube 8 handoff fields (cycle_id, algorithm, replay_hash) survive.
- On failure it clears scores in a fresh session and marks the trigger failed.
- POST /rankings/aggregate is limited to 10/minute; the SIM console driver and sim_console_live_check call it once per run, so the limit does not break the Cube 10 flow.
- SIM mock /aggregate keeps the live response shape.

**What I ran:**
- Backend cube5, cube6 and cube7 (ENVIRONMENT=test): 578 passed, 10 skipped.
- Frontend test:cube-sim-live: 837 passed, 0 failed.
- test:sim-console-driver: 20 passed.

**What blocks:** POST /sessions/{id}/ai/cqs (cube6_ai/router.py:67-106) calls run_cqs_pipeline inline. It passes no theme01_category, has no limiter, timeout, single-flight or trigger record, and no failed-run cleanup. That reopens the two-category scoring defect and lets an unrecorded manual run replace the ranking's winner. It is not in the backlog. Once that door goes through trigger_cqs_scoring, is retired, or is recorded honestly, I would approve.

- **Required:** Route the manual CQS endpoint POST /sessions/{id}/ai/cqs through the same path as the ranking handoff. Either call cube5 trigger_cqs_scoring(..., background=True, theme01_category=<the winning theme's parent label>), which gives it single-flight per session, _cqs_semaphore, CQS_TIMEOUT_SEC, a recorded cqs_scoring PipelineTrigger and failure cleanup, and add @limiter.limit to the route. Or retire the route. Or, if it stays as it is, record it as a backlog row with its Needs. Add a live_db proof that a manual /ai/cqs call scores only the winning category's answers and records a terminal trigger.
  - File: `backend/app/cubes/cube6_ai/router.py`:67
  - Evidence: `@router.post("/ai/cqs", status_code=202)` (l.67) has no @limiter; the router never imports one. It ends with `return await service.run_cqs_pipeline(db, session_id, stored, theme_level)` (l.104), passing no theme01_category. Its label lookup accepts any child theme of the session, with no category or cycle filter: `Theme.parent_theme_id.isnot(None), Theme.label.in_(...)`. service.run_cqs_pipeline is cqs_engine.run_cqs_pipeline re-exported (cube6_ai/service.py:62). So this route runs the provider calls inline on the request: no asyncio.wait_for timeout, no _cqs_semaphore, no _schedule_cqs single-flight, no PipelineTrigger row, no failed-run cleanup. With theme01_category None, cqs_engine.py l.105-108 skips the category filter, so the Enki round-15 defect (one Theme02 label under two Theme01 categories, both scored) is still reachable through this door. It also replaces the winner written by the background path, since score_cqs deletes all CQSScore rows of the session at l.117. Neither the 1M backlog (only HP-37 and HP-39 mention rate limits and CQS) nor the round-15 record mentions this route.
  - Why it blocks: Under the integration lens, round 15 made the Cube 7 → Cube 5 → Cube 6 CQS handoff single-flight, bounded, category-correct and recorded, but only on one of the two public doors into the same engine. Scope item 1 is 'every API works'. A session owner calling the documented /ai/cqs route gets the pre-round-15 behaviour: a wrong-category winner can replace the ranking's CQS winner, provider calls hold the request and the advisory lock with no timeout, and nothing appears in /pipeline/status. The defect is unlisted, so it blocks until it is fixed or recorded honestly.

Minor notes:
- drain_cqs_tasks' docstring says 'tests and shutdown', but only tests/live_db calls it; nothing in the app's lifespan does. A restart during a CQS run leaves that cqs_scoring trigger in_progress forever, and nothing sweeps stale in_progress CQS triggers.
- _cqs_inflight and _cqs_rerun are per process, so with N workers single-flight is per worker; the pg advisory lock still serialises the actual scoring. This is the same class as HP-37, which is recorded as INFRA. One sentence in HP-37 or HP-39 would make the per-process scope explicit.
- The aggregate limiter is keyed by IP (get_real_client_ip). Several moderators behind one NAT share the 10/minute budget. This is minor at the current scale.
- The SIM mock does not answer /ai/cqs or show the CQS outcome after aggregate, so SIM and LIVE match on ranking but SIM has no CQS view. No frontend caller exists today, so this is not a gap a user can see.
- Both CQS doors use the same CQSScore table, and score_cqs deletes the whole session's rows first. Any future second consumer, for example a Cube 8 reward payout, should read the winner by cqs_scoring trigger id, not only by session, to know which ranking it belongs to.

### Enki (diversity & edge cases) — NOT_APPROVED

Enki, round 16. Each of my round-15 asks is done in the code. (1) CQS is limited to one Theme01 category: cqs_engine.py:105-108 adds `ResponseSummary.theme01 == theme01_category`, and live_db test_cqs_scores_only_the_winning_category proves it when given the label. (2) The offline path reaches CQS, as described in the round-15 note. (3) Background CQS is single-flight per session and can be observed: in cube5_gateway/service.py:956-1047, _cqs_inflight/_cqs_rerun coalesce runs and the replaced trigger is marked superseded; the semaphore is its own (_cqs_semaphore(4)); each run moves its trigger in_progress -> completed with cqs_status/total_scored/winner, or to failed with the reason; a failure clears the old scores. The interleaving is safe on one event loop, because nothing awaits between `_cqs_rerun.pop` returning None and the finally block. One edge case breaks the category fix, though. emit_ranking_complete (ranking_governance.py:93-102) uses the parent Theme label only when no category was passed. run_ranking_pipeline always passes Session.theme01_category when the moderator set one, and that value is the key 'risk'/'support'/'neutral', not the stored label 'Risk & Concerns'. Every category-pinned session therefore filters CQS to zero answers and silently ends 'no_eligible' with no winner. The round-15 proof calls run_cqs_pipeline directly with the label, so it misses this. Fixing that one point and adding a proof through the endpoint would earn my approval. Everything else I checked under this lens is minor or already recorded (HP-39 CQS cost bound, DECISION).

- **Required:** Pass the winning theme's own Theme01 label to CQS every time: always look up the parent label when the winner has a parent (drop the `not winner_category` guard), or map the session key to its label (risk -> 'Risk & Concerns', support -> 'Supporting Comments', neutral -> 'Neutral Comments') before it reaches the filter. Add a live_db proof that goes through POST /rankings/aggregate on a session with theme01_category='risk' and ends with a CQS winner and a completed trigger. The existing proof calls run_cqs_pipeline directly with the label, so it never covers this path.
  - File: `backend/app/cubes/cube7_ranking/ranking_governance.py`:99
  - Evidence: Line 93 is `winner_category = theme01_category`, then line 99 is `if row and row[1] and not winner_category:`, so the parent-label lookup is skipped whenever the session has a category. run_ranking_pipeline fills theme01_category from Session.theme01_category (lines 643-644), and the schema limits that to Literal['risk','support','neutral'] (schemas/session.py:42). cqs_engine.py:108 then filters on `ResponseSummary.theme01 == theme01_category`. But phase_b.py:173-184 stores the full label ('Risk & Concerns' / 'Supporting Comments' / 'Neutral Comments'), and the parent Theme is created with label=category (phase_b.py:765). The filter compares 'risk' with 'Risk & Concerns'.
  - Why it blocks: Any session where the moderator picked a Theme01 category at Step 3, which is the normal ranking-config path, gets zero CQS-eligible answers. run_cqs_pipeline returns status 'no_eligible', the trigger records completed/no_eligible, and no CQS winner or reward is ever produced. It fails silently, and it undoes on that path the round-15 promise that offline and live sessions reach a CQS winner end to end. It is not in the backlog.

Minor notes:
- phase_b.py:196-199: _group_by_theme01 puts an off-list provider label (e.g. 'Risk and Concerns') in the Neutral bin by changing only a local variable. r['theme01'] keeps the raw string, which then goes to ResponseSummary.theme01 (phase_b.py:824) and to the assigned counter (phase_b.py:758). Those answers fall into the Neutral themes but are left out of their response_count and of any category-filtered CQS. Write the normalised label back to r['theme01'].
- cube5_gateway/service.py:1000-1006: if a _score_cqs_background task is cancelled (shutdown), the finally block clears _cqs_inflight but leaves _cqs_rerun[session_id], so a stale follow-up runs after the next trigger's run. Pop _cqs_rerun in the same finally, or mark it superseded.
- cube5_gateway/service.py:1043: the failure path deletes CQSScore rows, but the trigger status update depends on _retry_status_update succeeding. If the delete succeeds and the update fails, the trigger stays in_progress (the outer except only logs it). This is visible in the logs, but the trigger then shows no outcome.

### Thoth (data & analytics deep dive) — NOT_APPROVED

Thoth, round 16. Both of my round-15 asks are done in the code. (1) The background CQS outcome is now recorded on its trigger. In cube5_gateway/service.py, _score_cqs_once (lines ~1009-1045) moves the cqs_scoring PipelineTrigger to in_progress, then to completed with cqs_status, total_scored and winner_response_id. On a timeout or exception it marks the trigger failed with the reason via _retry_status_update, and a superseded trigger is closed with cqs_status=superseded. (2) A failed re-score leaves no previous winner standing: the except path deletes CQSScore for the session in a fresh transaction and commits, and is_winner lives only on CQSScore. Single flight, its own semaphore and the drain helper are coherent. The offline 95/85 keyword assignment gives an unpinned end-to-end winner when the session has no category. One new defect, from the round-15 category fix, blocks approval. When Session.theme01_category is set (the key 'risk'/'support'/'neutral'), emit_ranking_complete passes that key to CQS unchanged and skips the parent-label lookup. cqs_engine then filters ResponseSummary.theme01 (which stores 'Risk & Concerns' etc.) against 'risk', so no answer is eligible, no winner is crowned, and the trigger still reads 'completed'. The live_db proofs only exercise the no-category path, or call run_cqs_pipeline directly with the label, so the gap goes undetected. Fix by resolving the parent label (or mapping key to label) and prove it with a category-set live_db test. That would earn my approval.

- **Required:** Pass the Theme01 LABEL to CQS, never the session's category KEY. In emit_ranking_complete, resolve winner_category from the winning theme's parent Theme.label every time (or map the key through the inverse of pipeline._CATEGORY_KEYS before filtering), so `ResponseSummary.theme01 == theme01_category` compares a label with a label. Then add a live_db proof: a session created with theme01_category="risk" (the Cube 10 console path) gets aggregate -> drain_cqs_tasks -> exactly one CQS winner and a cqs_scoring trigger reading ('completed','completed',None).
  - File: `backend/app/cubes/cube7_ranking/ranking_governance.py`:93
  - Evidence: ranking_governance.py:93 `winner_category = theme01_category` and :100 `if row and row[1] and not winner_category:`. Because of that guard, the parent label is looked up only when the session has no category. run_ranking_pipeline (:637-644) fills theme01_category from Session.theme01_category, which schemas/session.py:42 restricts to Literal["risk","support","neutral"]. That key goes to trigger_cqs_scoring(theme01_category=winner_category) at :189, and on to cqs_engine.py:108 `ResponseSummary.theme01 == theme01_category`. But phase_b.py:824 stores theme01 as the label ("Risk & Concerns" / "Supporting Comments" / "Neutral Comments"; pipeline.py:408-412 maps label->key). So the filter compares 'Risk & Concerns' with 'risk' and nothing is eligible. The round-15 proofs miss this. test_bounds_and_scale.py:520 calls run_cqs_pipeline directly with theme01_category="Risk & Concerns". _ranked_session/_themed_session never set a session category, while test_sim_console_live.py:40 does set "risk" and asserts nothing about CQS.
  - Why it blocks: This is a data-path defect that no test catches. On any session where the moderator picked a Theme01 category (the Step-3 ranking config, and the Cube 10 console's default), every CQS run finds zero eligible answers. It deletes the scores, crowns no winner, and still marks the trigger 'completed', so the outcome looks healthy. It is a regression introduced by the round-15 fold and is not in the backlog. It breaks scope 3's ranking -> CQS -> reward chain in exactly the category-ranked configuration that 1M polling uses.

Minor notes:
- When a session category is set and the winning theme's parent label disagrees with it, nothing reconciles the two. Once the parent label is always used, consider asserting _category_key(parent_label) == session.theme01_category and recording a mismatch on the trigger.
- A 'no_eligible' CQS result ends with trigger status 'completed'. It would help analytics if the dashboard showed cqs_status separately, so that zero eligible answers can be told apart from a crowned winner without reading the metadata.
- _score_cqs_once deletes the session's CQSScore rows on failure even when a coalesced follow-up run is queued. That is harmless, because the follow-up rewrites them, but it opens a short window with no scores.
- _mark_cqs_trigger_later swallows failures with only a warning. A superseded trigger could stay 'pending' forever if that write fails, and there is no sweeper.

### Athena (strategic test planning) — APPROVED

I approve this round. Last round I asked for one green backend CI job on the shipped SHA, with the failing test named and fixed. Both are done.

1. **Backend CI on f948db9.** The GitHub check runs show backend success, gate success and verify success. Workers Builds also passed.
2. **The failing test is fixed.** It was test_scale_projection_5k_to_1m. In backend/tests/cube6/test_scale_pipeline.py:336-352 the voting timing is now the best of 5 runs with garbage collection paused (`for _ in range(5)`, `gc.disable()` and restored in a `finally` block).
3. **Failures are now named.** In .github/workflows/deploy.yml:174 the suite runs with `pytest -q -rfEs`. Lines 179-190 turn each FAILED/ERROR line into an annotation, and fall back to the log tail when no test is named.
4. **The database proofs cannot pass by skipping.** Lines 167-168 check that Postgres answers first, and lines 192-196 fail the job if any live_db, SQL-tally-parity or ballot-cycle proof is SKIPPED. So a green run really includes the new CQS proofs (drain_cqs_tasks in tests/live_db/conftest.py; the superseded case in test_bounds_and_scale.py).

What I re-ran locally on f948db9:
- **Backend:** tests/cube5, tests/cube7 and the cube6 scale test gave 417 passed.
- **Frontend:** test:cube-sim-live 837/0, test:sim-console-driver 20/0, test:sim-parity 3/3, test:worker-api-routes 40/0.

The single-flight CQS structure is in cube5_gateway/service.py:956-1004 (`_cqs_semaphore(4)`, `_cqs_inflight`, `_cqs_rerun`, `_schedule_cqs`).

Two other checks on f948db9 are red. Both are outside the acceptance scope (items 1–3) and listed in the notes. Under my lens, scope 1–3 is operational, and the remaining open items are honestly recorded in the backlog.


Minor notes:
- Supabase Preview is red on f948db9 (and 5a5531d): `duplicate key value violates unique constraint "schema_migrations_pkey" Key (version)=(043)`. supabase/migrations has both 043_sensor_fusion_review.sql and 043_whitepaper_pdf_bucket.sql. These are the sensor-fusion and whitepaper surfaces, not polling Cubes 1-10, but a duplicate migration version is a real defect in the database path and is not in the 1M backlog. It should be renumbered, or recorded as out of scope.
- The Financial cloud e2e workflow (fin-cloud-e2e.yml) has been red on every recent SHA (f948db9, 5a5531d, 3d989dd, 5a90a98, 5db382a). It covers the Financial-2525 app, which is out of scope here. A run that is always red trains people to ignore red checks: either fix it or mark it as allowed to fail, so the check list for a ship SHA reads cleanly.
- Taking the best of 5 samples with GC paused makes the 1M projection optimistic by design: it measures the tally's best case, not its typical case. That is acceptable as a regression guard. The actual 1M evidence should stay with sim_1m.py / sim_compare.py on a real database, as the backlog already says.
- CI still uses actions/checkout@v4 and setup-node@v4, which run on deprecated Node 20, and ubuntu-latest moves to Ubuntu 26 on 2026-10-19. Pin the runner, or schedule one CI run after that date, so a later red result is not mistaken for a code regression.

### Christo (consensus & user-flow) — NOT_APPROVED

Round 15's CQS hardening holds where it was tested. Single-flight per session, its own semaphore, a terminal state on every trigger, failure cleanup and the 10/minute limit on aggregate all behave as described. Local checks: cube5/6/7 gave 578 passed with 10 skipped, cube-sim-live gave 837/837 passed, and the round-15 live_db proof (offline aggregate gives one winner and a completed trigger) passes on the local Postgres. The new 'winning category only' filter, however, breaks the moderator flow. Sessions store the category as the key risk|support|neutral. emit_ranking_complete forwards that key and skips the parent-label lookup whenever it is set. cqs_engine then compares the key with ResponseSummary.theme01, which holds the label ('Neutral Comments' and so on), and it never matches. I reproduced it live: the same ranked session that crowns a winner with no category set ends with (0 scores, 0 winners) and a trigger marked completed with no_eligible once /ranking-config sets the matching category. The Cube 10 Admin Console LIVE driver always sets 'risk', so its LIVE runs never reach a CQS winner, and the backlog does not record this. Fixing it means taking the category from the winner's parent theme, plus a live_db proof through /ranking-config. With that change I would approve under this lens.

- **Required:** Make CQS filter on the winning theme's own Theme01 label (the parent Theme's label), and never on the session's category key. In emit_ranking_complete, derive winner_category from the parent theme whenever the winner has one. Fall back to a mapping of the key to its label (CATEGORY_TO_LABEL, or _category_key applied to ResponseSummary.theme01) only if there is no parent. Add a live_db proof that matches the moderator's real flow: set the session's category with PATCH /ranking-config (theme01_category=risk|support|neutral) or at create time, then aggregate, drain_cqs_tasks, and assert exactly one winner and a completed trigger whose cqs_status is not no_eligible. The round-15 proof does not cover this: it calls run_cqs_pipeline directly with theme01_category="Risk & Concerns", so it skips the key-versus-label path.
  - File: `backend/app/cubes/cube7_ranking/ranking_governance.py`:93
  - Evidence: ranking_governance.py:93 `winner_category = theme01_category` and :100 `if row and row[1] and not winner_category:`. The parent-label lookup is therefore skipped whenever the session has a category. That category is the key 'risk'|'support'|'neutral' (session.py:116; cube1 router.py:296 whitelist; ranking_governance.py:644 auto-fills it from Session). cqs_engine.py:108 then filters `ResponseSummary.theme01 == theme01_category`, but phase_b writes the label ('Risk & Concerns' / 'Supporting Comments' / 'Neutral Comments', phase_b.py:181-184, 824), so the filter never matches. I reproduced this on the local Postgres with a copy of tests/live_db; the repo was not edited. The same _ranked_session flow as test_offline_session_reaches_a_cqs_winner_and_records_it (which passes, giving 1 winner) was followed by PATCH /ranking-config theme01_category=neutral, which matches the answers' 'Neutral Comments', then aggregate and drain. Result: `COUNTS (0, 0) TRIG [('completed', 'no_eligible', None)]`, with no CQS winner. The Cube 10 Admin Console LIVE driver creates every session with `theme01_category: "risk"` (frontend/lib/sim-console-driver.ts:85), so every LIVE console run is on this path.
  - Why it blocks: Scope 2 and 3 are not complete. The ranking reaches consensus, but every session whose moderator picked a Theme01 category, including every Cube 10 Admin Console LIVE run, ends with no CQS winner. The only record is a trigger marked 'completed' with no_eligible, so neither the moderator nor the participants see why the reward step produced nothing. This regression came in with round 15's category filter, and the backlog does not list it.

Minor notes:
- A superseded trigger is set to status 'completed' with cqs_status 'superseded'. That is honest in its metadata, but any consumer that reads only status will count it as a scored run. A distinct terminal status would be clearer.
- _cqs_inflight/_cqs_rerun are per process, so with several API workers two runs for one session can still overlap. This is acceptable for now, but say so in HP-39 or in the commit's scalability claim.
- The failure cleanup deletes every CQSScore for the session, including scores from the previous cycle. That is fine while there is one cycle per session, but with multiple cycles it should be scoped to the cycle.
- Round-15 proof test_cqs_scores_only_the_winning_category passes the label directly to run_cqs_pipeline, so it never runs the emit_ranking_complete category path that real sessions take.

### Aset (consistency validation) — NOT_APPROVED

Aset (consistency) checked f948db9, focusing on the round-15 CQS fold. The single-flight scheduling (_schedule_cqs / _cqs_inflight / _cqs_rerun) behaves as described. CQS has its own semaphore. The trigger lifecycle is consistent: in_progress, then completed with cqs_status/total_scored/winner, or failed with cleanup. The aggregation commits before the emit. cube5 and cube7 pass locally (376 passed). One cross-cube consistency defect remains, and it touches scope 3 directly. The category reaches CQS in two vocabularies. Session.theme01_category (and therefore run_ranking_pipeline, the router path) holds the key 'risk'/'support'/'neutral'. ResponseSummary.theme01, which cqs_engine filters on, holds the label 'Risk & Concerns'/'Supporting Comments'/'Neutral Comments'. emit_ranking_complete derives the parent label only when the caller passed no category. So whenever a moderator has configured a category (the normal scope-3 setup), CQS finds zero eligible answers, clears the scores and records a completed run with no winner. The round-15 proof skips this by passing the label straight to the engine. The issue is not in the backlog. Mapping the key to the label (or always using the winner's parent label), plus a router-path gate, would earn approval.

- **Required:** Give CQS eligibility one category vocabulary. emit_ranking_complete must always pass the winning theme's Theme01 LABEL (its parent's label, e.g. "Risk & Concerns"). Do this either by always deriving it from row[1], or by mapping the session's key to its label with the inverse of pipeline._CATEGORY_KEYS. At the moment the session's short key reaches cqs_engine, which compares it with ResponseSummary.theme01, and that column holds labels.
  - File: `backend/app/cubes/cube7_ranking/ranking_governance.py`:99
  - Evidence: ranking_governance.py:93 `winner_category = theme01_category` and :99 `if row and row[1] and not winner_category:`, so the parent-label lookup only runs when the caller passed nothing. run_ranking_pipeline (:636-641) fills theme01_category from Session.theme01_category, which schemas/session.py:42 restricts to `Literal["risk", "support", "neutral"]`, and the POST /rankings/aggregate router (cube7 router.py:216) takes that path. cqs_engine.py:108 then filters `ResponseSummary.theme01 == theme01_category`. phase_b.py:173-184 stores labels there ("Risk & Concerns" / "Supporting Comments" / "Neutral Comments"), and the pipeline.py:408 _CATEGORY_KEYS map shows the two vocabularies differ. Result: 'risk' never equals 'Risk & Concerns'.
  - Why it blocks: Scope 3 asks for voting on the 9 Theme02 under one Theme01 category, which a moderator sets as session.theme01_category. Every such session's CQS run matches zero eligible answers, deletes the previous scores and records a completed trigger with no winner. The round-15 fix ('only the winner's category competes') therefore works only when no category is configured. The round-15 live_db proof (test_bounds_and_scale.py:520) passes the label "Risk & Concerns" straight to run_cqs_pipeline, so it skips the key path the router actually uses. The defect is not in the backlog (HP-39 covers CQS cost only).
- **Required:** Add a gate that runs the real router path with a configured category. Create a session with theme01_category="risk" (as test_sim_console_live.py:40 already does), seed summaries whose theme01 is "Risk & Concerns" at confidence 95 or above on the winning label, POST /rankings/aggregate, drain_cqs_tasks, and assert that a CQS winner exists and the cqs_scoring trigger's cqs_status is not a no-eligible status. A unit test should also check the key-to-label mapping inside emit_ranking_complete.
  - File: `backend/tests/live_db/test_bounds_and_scale.py`:520
  - Evidence: `await run_cqs_pipeline(db, uuid.UUID(sid), label, "3", theme01_category="Risk & Concerns")`: the proof calls the engine with the label directly. No test drives emit_ranking_complete with the session's key and checks the CQS outcome, and cube5 + cube7 pass locally (376 passed) with the defect present.
  - Why it blocks: Under the 'fix the class, every invariant gets a gate' rule, the category handoff between Cube 7 and Cube 6 needs a gate on the path that production uses. Without one, the mismatch between the two vocabularies can come back silently.

Minor notes:
- A superseded CQS trigger is marked status 'completed' with cqs_status='superseded' even though it never ran (service.py:969). A distinct status, or reading cqs_status in get_pipeline_status's all_completed, would keep the trigger table honest.
- The broadcast/webhook payload carries theme01_category as the key while CQS scores by label. Once the mapping is fixed, the label could also go into the CQS trigger metadata so that a reader of the trigger sees which category competed.
- _mark_cqs_trigger_later swallows failures with a warning only. A superseded trigger whose mark fails stays 'pending' indefinitely.

### Asar (synthesis & outcome) — NOT_APPROVED

Round 15's CQS changes work as described in their own terms. Each session has at most one CQS run in flight. Triggers that arrive during a run coalesce into one rerun, and the trigger they replace is marked superseded. CQS has its own semaphore of 4. POST /rankings/aggregate is limited to 10 a minute. Each trigger moves from in_progress to completed or failed. A failed re-score clears the previous scores and winner in a new transaction. The live_db fixture drains background work. I ran tests/live_db, cube5 and cube7 locally: 393 passed. test:cube-sim-live gave 837 passed, 0 failed.

The synthesis does not hold end to end. The new filter, which scores only the winning category, compares ResponseSummary.theme01 (for example 'Risk & Concerns') with the category the ranking forwards. That value is the session's short key ('risk'/'support'/'neutral'), because emit_ranking_complete resolves the parent label only when no category was passed. I reproduced this on real Postgres with the Cube 10 console's LIVE sequence (theme01_category 'risk'): 0 scored, no winner, and the trigger says 'completed / no_eligible'. Every category-scoped session, including every console LIVE run, therefore silently loses its CQS outcome. This is a regression from round 15, it is not in the backlog, and the round-15 proof skipped it by passing the full label directly. Once this is fixed and proven through the console's own live test, I would approve.

- **Required:** Make the CQS category filter use the same form of the category that the ranking and session use. emit_ranking_complete must derive the winner's category from the parent Theme01 label, and must never forward the session's short key unchanged. One way: always resolve winner_category from the parent theme, by dropping the `and not winner_category` guard. Another way: in score_cqs, map the short key back to its label, comparing `_category_key(ResponseSummary.theme01)` against it, or use a label→key map in SQL. Then extend tests/live_db/test_sim_console_live.py, which is the console's own LIVE sequence with theme01_category='risk'. After the aggregate it should call drain_cqs_tasks() and assert that the cqs_scoring trigger ends with cqs_status 'completed', total_scored > 0 and exactly one is_winner row. The round-15 proof calls run_cqs_pipeline directly with theme01_category='Risk & Concerns', so it skips the path that actually runs.
  - File: `backend/app/cubes/cube7_ranking/ranking_governance.py`:100
  - Evidence: `if row and row[1] and not winner_category:` (l.100). The parent label is resolved only when the caller passed no category. But run_ranking_pipeline (l.637-644) fills theme01_category from Session.theme01_category, which holds the short key: cube1_session/router.py:296 accepts only ('risk','support','neutral'), and ranking_submission.py:91 compares `_category_key(row[1]) == theme01_category`. That short key reaches cqs_engine.py:108 as `ResponseSummary.theme01 == theme01_category`, while ResponseSummary.theme01 holds 'Risk & Concerns' / 'Supporting Comments' / 'Neutral Comments' (phase_b.py:51). I reproduced it on the local live_db by running the exact test_hp21_admin_console_live_sequence flow (session created with theme01_category 'risk', which sim-console-driver.ts:85 also sends) and then draining CQS. The result was `REPRO scores 0 winners 0` and the trigger `('completed', {'cqs_status': 'no_eligible', 'total_scored': 0, 'winner_response_id': None, ...})`, with the summaries' theme01 values `['Neutral Comments', 'Risk & Concerns', 'Supporting Comments']`.
  - Why it blocks: Under my lens the outcome is what counts. Every session where the moderator picked a Theme01 category through POST /sessions or PATCH /ranking-config never crowns a CQS winner, and it reports 'completed / no_eligible' as if nothing were wrong. This includes every Cube 10 Admin Console LIVE run, because the driver hard-codes 'risk', and it is the operator's own model of voting on the nine Theme02 of one category. Round 15 introduced this regression: before the category filter, those sessions scored. It is the same journey round 15 claimed ends in a winner. The backlog does not list it (HP-39 covers CQS cost only), and the live_db suite stays green because no test drives CQS through a session that has a category set.

Minor notes:
- drain_cqs_tasks says it is for 'tests and shutdown', but the app lifespan never calls it, so a redeploy during a run leaves the trigger stuck at in_progress. That is minor, but it is close to the Odin/Enlil notes about the durable pending state.
- A superseded trigger is recorded as status 'completed' with cqs_status 'superseded'. That is honest in the metadata, but a dashboard that reads only the status counts it as a scoring that ran.
- trigger_ai_pipeline still calls asyncio.create_task(_run_pipeline_background(...)) with no strong reference (service.py:792), while CQS now keeps its references. The two background paths are inconsistent; this was already the case before this round.
- Verified locally at f948db9: ENVIRONMENT=test pytest tests/live_db tests/cube5 tests/cube7 gave 393 passed; frontend test:cube-sim-live gave 837/0. HP-39 (CQS cost at 1M) stays an honest DECISION row.

### Pangu (cutting-edge) — NOT_APPROVED

The round-15 fold holds within one process. CQS scheduling is single-flight per session (no await between the rerun pop and the inflight pop, so no lost wake-up), it has its own Semaphore(4), the trigger lifecycle is recorded, eligibility is filtered by the winning Theme01 category, and offline sessions reach a winner. Local check: tests/cube5 + tests/cube6 gave 332 passed, 10 skipped; live_db was not run here. Scope 1-3 looks operational. Under the cutting-edge lens, two gaps are unlisted and are not minor. (1) The single-flight and the failure-path delete are process-local and run outside the advisory lock, so with horizontal workers a failed run on one worker can delete another worker's fresh winner. (2) Shutdown neither drains nor cancels the CQS tasks cleanly, and CancelledError bypasses the `except Exception`, so a deploy in the middle of a run (up to 600 s) leaves the cqs_scoring trigger stuck at in_progress with nothing to reconcile it. Either fix it in code or list both honestly in the backlog with a correct Needs, and I would approve.

- **Required:** Make the failure-path cleanup take the same per-session advisory lock as the scoring run and skip the delete when a newer cqs_scoring trigger for the session has already completed. Otherwise, record in the backlog (next to HP-37) that single-flight and the failure cleanup only hold within one process.
  - File: `backend/app/cubes/cube5_gateway/service.py`:1040
  - Evidence: Single-flight is a process-local dict: `_cqs_inflight: dict[uuid.UUID, asyncio.Task] = {}` (l.959). The failure path runs `await db.execute(delete(CQSScore).where(CQSScore.session_id == session_id)); await db.commit()` (l.1040-1041) in a new session without `pg_advisory_xact_lock(hashtext('cqs:'||id))`, which score_cqs takes at cqs_engine.py:80. HP-37 covers only rate limits.
  - Why it blocks: With N backend workers, worker B can commit a fresh CQS winner and then worker A's timed-out or failed run deletes it. The session ends with no winner while B's trigger says completed with a winner_response_id. This defect is not in the backlog, and the round-15 claim (overlapping runs coalesce) only holds within one process.
- **Required:** Drain or cancel background CQS on shutdown and record the outcome. Call `await drain_cqs_tasks()` in the lifespan before `close_postgres()`, and handle `asyncio.CancelledError` in `_score_cqs_once` so the trigger is marked failed ('CQS interrupted'). Also, at startup, mark any `cqs_scoring` trigger still in `in_progress`/`pending` as failed.
  - File: `backend/app/main.py`:85
  - Evidence: The lifespan runs `yield` then `# Shutdown` then `await close_postgres()`, and never calls drain_cqs_tasks, although its docstring says it is for "tests and shutdown" (service.py:993). `_score_cqs_once` catches only `except Exception` (service.py:1036). CancelledError is a BaseException, so a deploy or restart in the middle of a run (CQS_TIMEOUT_SEC = 600) leaves the trigger stuck at 'in_progress', and nothing reconciles it.
  - Why it blocks: Round 15's own claim is that each run records in_progress -> completed or failed. A restart breaks this: get_pipeline_status then reports has_pending=True for that session indefinitely. The defect is not in the backlog.

Minor notes:
- HP-39's text still says CQS runs under the 'pipeline semaphore'. Since round 15 it has its own _cqs_semaphore(4) (service.py:956). Update the backlog line.
- score_cqs holds a transaction-scoped advisory lock and an uncommitted DELETE open across every provider batch, up to 600 s (cqs_engine.py:80, 117, 150-153). With 4 concurrent sessions that pins 4 of the 50 pool connections idle in transaction. Scoring outside the transaction and then taking the lock + delete + insert in a short final transaction would release them. This ties to the HP-39 decision.
- The failure path deletes the previous scores even when the cause is a transient provider timeout. Keeping the prior winner, marked stale, is an operator choice and could be raised under HP-39.
- _cqs_semaphore is created at import time. That is fine on Python 3.10+ (loop bound lazily), but a test that runs several event loops would share its counters.

### Sofia (multi-perspective) — APPROVED

Sofia, round 16, at f948db9. All three of my round-15 asks are done.

(1) The timing test is fixed in the code. tests/cube6/test_scale_pipeline.py:334-351 now takes the best of 5 passes with gc.disable()/enable() in a try/finally. I re-ran it in the order that failed every time before (tests/cube5 and then the cube6 file). It projected vote=435 ms against the 5,000 ms limit. In round 15 the same order projected 48–54 s. Result: 131 passed.

(2) The record is corrected. docs/assessments/2026-10-07_asm_alignment_round15.md:7-8 names test_scale_projection_5k_to_1m as the 0dee0ad failure and says the round-14 guess about the background-CQS proof was wrong. CI also names failures now (deploy.yml:174 uses -rfEs, and lines 182-187 turn each FAILED line into an annotation).

(3) The backend job is green. The check runs on f948db9 show backend=success, gate=success, verify=success and Workers Builds=success.

I also checked the round-15 CQS fold under my lens, and the code matches the claims:
- Single-flight per session works. Triggers that arrive during a run coalesce into one follow-up, and the replaced trigger is marked cqs_status=superseded (cube5_gateway/service.py:963-971).
- CQS has its own _cqs_semaphore(4) and never takes a theming slot.
- Each run moves its trigger from in_progress to completed (with status, total_scored and winner_response_id) or to failed (with a timeout or exception reason).
- A failed run deletes the stale CQSScore rows in a fresh transaction.
- drain_cqs_tasks also covers the side tasks.

Locally, tests/live_db gave 17 passed against real Postgres. The remaining open items are minor and outside polling scope.


Minor notes:
- The Supabase Preview check on f948db9 failed with 'duplicate key value violates unique constraint schema_migrations_pkey: Key (version)=(043) already exists'. The cause is two migrations with the same number: supabase/migrations/043_sensor_fusion_review.sql and 043_whitepaper_pdf_bucket.sql. They belong to SensorFusion and the whitepaper, not polling, but the preview check will stay red until one is renumbered. It is not in the backlog.
- The 'e2e' check on f948db9 failed. It is the Financial cloud e2e workflow (fin-cloud-e2e.yml) and is outside the polling/API scope.
- Running tests/cube5 logs the warning cube5.session.ranking_transition_failed "'coroutine' object has no attribute 'status'". This looks like a mocked AsyncSession returning a coroutine where a result is expected. It is test noise, and the tests pass, but it could hide a real transition failure in the logs.
- _schedule_cqs keeps a superseded trigger as pending until the in-flight run finishes. The trigger is marked superseded only when a third trigger replaces it, so the trigger status stays accurate.
- The scale-projection test still asserts a wall-clock time. Best-of-5 with GC paused gives a wide margin (about 0.4 s against 5 s), but a pytest benchmark marker would make it fully independent of the CI runner.
