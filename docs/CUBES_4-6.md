# Cubes 4-6: Collector, Gateway, AI Pipeline — Implementation Details

> **Parent doc:** See `CLAUDE.md` for system architecture, inter-cube dependencies, and infrastructure.

---

## Cube 4 — Response Collector: IMPLEMENTED (CRS-09→CRS-10 done; ~80% of full spec)

**Code location:** `backend/app/cubes/cube4_collector/` (modular, self-contained)

### Cube 4 — Implemented
- **Response aggregation:** Web_Results.csv-compatible format (q_number, question, user, detailed_results, response_language, native_language)
- **Dual data source:** Postgres (ResponseMeta + Question + Participant JOINs) + MongoDB (raw text/transcripts)
- **Summary inclusion:** Optional 333/111/33 word summaries from MongoDB (generated live by Cube 6 Phase A)
- **Theme inclusion:** Optional Theme01 + Theme2_9/6/3 assignments with confidence (from Cube 6 Phase B)
- **Response count:** Breakdown by source type (text/voice) and total
- **Language breakdown:** Response languages grouped by language_code
- **Redis presence:** Live participant tracking (HSET + EXPIRE pattern from Cube 1)
- **Summary status:** MongoDB count of responses with summaries and theme assignments
- **Voice support:** Voice transcripts aggregated via TextResponse clean_text fallback
- **Anonymous support:** Null participant_id handled gracefully → "Anonymous" user label
- **Pagination:** Standard page/page_size params with total count
- **API endpoints:** 6 routes (collected list, single response, count, languages, presence, summary status)

### Cube 4 — CRS Traceability
| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-09 | CRS-09.IN.SRS.009 | CRS-09.OUT.SRS.009 | **Complete** | Real-time streaming aggregation |
| CRS-09.1 | — | — | **Complete** | Web_Results format with native language column |
| CRS-09.2 | — | — | **Complete** | Live summary status tracking (MongoDB) |
| CRS-10 | CRS-10.IN.SRS.010 | CRS-10.OUT.SRS.010 | **Partial** | Full desired outcome collection |

### Cube 4 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube4/ -v --tb=short
```

**Test Suite:** 2 files, 8 test classes, 27 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_collector_service.py` | 6 | 17 | Unit tests (count, languages, presence, summaries, collected, single) |
| `test_e2e_flows.py` | 5 | 10 | E2E flows (collection, multi-language, anonymous, pagination, voice) |

### Cube 4 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube4_collector/service.py` | 387 | Core business logic (7 functions) |
| `cubes/cube4_collector/router.py` | 97 | 6 API endpoints |
| `tests/cube4/test_collector_service.py` | 427 | 17 unit tests |
| `tests/cube4/test_e2e_flows.py` | 296 | 10 E2E tests + CUBE4_TEST_METHOD |

### Cube 4 — Requirements.txt Specification

#### Data Tables

**Table: `collected_responses`** (Unified view — aggregates text + voice)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Collected response ID |
| session_id | UUID (FK→sessions) | Session reference |
| question_id | UUID (FK→questions) | Question reference |
| participant_id | UUID (FK→participants) | Who submitted |
| source_type | ENUM | `text` / `voice` |
| source_id | UUID | FK to `text_responses.id` or `voice_responses.id` |
| final_text | TEXT | Validated, cleaned response text (after PII scrub if applicable) |
| language_code | VARCHAR(5) (FK→languages.code) | Submission language |
| collected_at | TIMESTAMP | When aggregated into collector |

**Table: `desired_outcomes`** (Methods 2 & 3)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Desired outcome ID |
| session_id | UUID (FK→sessions) | Session reference |
| description | TEXT | What the group aims to achieve |
| time_estimate_minutes | INTEGER | Agreed time estimate |
| created_by | UUID (FK→participants) | Who drafted the outcome |
| confirmed_by | JSONB | Array of participant_ids who confirmed |
| all_confirmed | BOOLEAN | True when all required participants confirmed |
| outcome_status | ENUM | `pending` / `achieved` / `partially_achieved` / `not_achieved` |
| results_log | TEXT (nullable) | Post-task results input by participants |
| assessed_by | JSONB (nullable) | Array of participant_ids who assessed outcome |
| completed_at | TIMESTAMP (nullable) | When task was completed |
| created_at | TIMESTAMP | When created |

**Table: `presence_tracking`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Presence record ID |
| session_id | UUID (FK→sessions) | Session reference |
| participant_id | UUID (FK→participants) | Who is present |
| status | ENUM | `online` / `idle` / `disconnected` |
| last_heartbeat | TIMESTAMP | Last activity ping |

#### Inputs
| Input | Source | Description |
|-------|--------|-------------|
| Validated text response | Cube 2 | Cleaned text with language tag, PII/profanity flags |
| Voice transcript | Cube 3 → Cube 2 | STT transcript processed through text pipeline |
| Payment status | Cube 1 / Cube 8 | Participant's payment confirmation |
| Desired Outcome doc | User UI (Methods 2 & 3) | Outcome description, time estimate |
| Participant confirmations | User UI (Methods 2 & 3) | Each participant's confirm action |
| Post-task results log | User UI (Methods 2 & 3) | Team's results input after task |
| Heartbeat pings | Frontend | Presence tracking signals |

#### Outputs
| Output | Destination | Description |
|--------|-------------|-------------|
| Collected response set | Cube 6 (AI Theming) | Full set of responses for embedding + clustering |
| Presence state | Cube 1, Cube 5, Frontend | Live participant count and status |
| Desired Outcome record | Cube 5, Cube 8, Cube 9 | Outcome doc with confirmation status |
| All-confirmed signal | Cube 5 (Gateway) | Signal that timer can start (Methods 2 & 3) |
| Post-task results | Cube 8, Cube 9 | Logged results for token calc and export |

#### Functions (10 total per Requirements.txt)
| Function | Status | Description |
|----------|--------|-------------|
| `aggregate_response()` | **Implemented** | Creates unified `collected_responses` entry |
| `store_to_mongodb()` | **Implemented** | Writes raw response payload to MongoDB |
| `cache_response_state()` | **Implemented** | Updates Redis with live response count |
| `track_presence()` | **Implemented** | Processes heartbeat pings, updates presence |
| `create_desired_outcome()` | Not implemented | Creates desired outcome record (Methods 2 & 3) |
| `record_confirmation()` | Not implemented | Records participant's confirmation |
| `check_all_confirmed()` | Not implemented | Returns true when all confirmed |
| `log_post_task_results()` | Not implemented | Stores post-task results and assessment |
| `get_response_set()` | **Implemented** | Returns full collected response set for Cube 6 |
| `get_presence_count()` | **Implemented** | Returns current online participant count |

#### UI/UX Translation Strings (15 keys)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube4.presence.online` | "{count} participants online" | Live presence counter |
| `cube4.presence.you_joined` | "You're in the session" | Joined confirmation |
| `cube4.desired_outcome.title` | "Define the Desired Outcome" | M2/M3 outcome form header |
| `cube4.desired_outcome.description` | "What do you want to achieve?" | Outcome description label |
| `cube4.desired_outcome.time_estimate` | "Estimated time (minutes)" | Time estimate input label |
| `cube4.desired_outcome.confirm` | "I confirm and agree" | Confirmation button |
| `cube4.desired_outcome.waiting` | "Waiting for all participants to confirm..." | Waiting state |
| `cube4.desired_outcome.all_confirmed` | "All participants confirmed — ready to start!" | All confirmed state |
| `cube4.results_log.title` | "Log your results" | Post-task results header |
| `cube4.results_log.prompt` | "What was the outcome?" | Results log input label |
| `cube4.results_log.achieved` | "Outcome achieved" | Status option |
| `cube4.results_log.partial` | "Partially achieved" | Status option |
| `cube4.results_log.not_achieved` | "Not achieved" | Status option |
| `cube4.results_log.submit` | "Submit results" | Submit button |
| `cube4.results_log.sign_off` | "I confirm these results" | Sign-off button |

### Cube 4 — DesignMatrix VOC
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-09 | Turn chaos into clarity at scale | "We get hundreds of comments — no human can read them all." |
| CRS-10 | Shared understanding of group sentiment | "Builds alignment and reduces repetitive discussion." |

---

## Cube 5 — Gateway/Orchestrator: IMPLEMENTED (CRS-09→CRS-11 pipeline coordination; ~90% of full spec)

**Code location:** `backend/app/cubes/cube5_gateway/` (modular, self-contained)

### Cube 5 — Time Tracking (Brief)
- `TimeTrackingService`: start/stop tracking, login auto-entry, ♡ 웃 ◬ calculation
- Token calculation: `calculate_tokens()` with jurisdiction rate lookup
- Login auto-tracking on session join (Cube 1 integration)
- Append-only token ledger entries created on stop + login

### Cube 5 — Orchestrator (Full)
- **Pipeline orchestrator:** Coordinates downstream pipeline triggers on session state changes
- **PipelineTrigger model:** Tracks pipeline executions (pending → in_progress → completed | failed)
- **AI theming trigger:** On polling→ranking, fires Cube 6 `run_pipeline()` as background asyncio task
- **Background task pattern:** Fresh DB session via `async_session_factory()` (request session may close)
- **Ranking trigger (placeholder):** Creates trigger record for Cube 7 (not yet implemented)
- **CQS scoring trigger (placeholder):** Creates trigger record with top_theme2_id metadata
- **Pipeline status query:** Returns all triggers for session with aggregated flags (has_pending, has_failed, all_completed)
- **Pipeline retry:** Failed triggers can be reset to pending and re-fired
- **Cube 1 orchestration hook:** `_transition_and_return()` fires `orchestrate_post_polling()` on ranking transition
- **API endpoints:** 6 time routes + 3 pipeline routes + 3 payment stubs = 12 total

### Cube 5 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube5/ -v --tb=short
```

**Test Suite:** 3 files, 16 test classes, 60 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_time_tracking_service.py` | 5 | 18 | Token calc, start/stop, login, summary |
| `test_orchestrator_service.py` | 7 | 22 | Create trigger, update status, AI/ranking/CQS triggers, orchestrate, status query |
| `test_e2e_flows.py` | 5 | 20 | Pipeline CRUD, post-polling flow, status aggregation, retry, error handling, Moderator+7 users |

**Pipeline Trigger CRUD Flow (TestPipelineTriggerFlow):**
1. `create_ai_theming_trigger` — ai_theming trigger created with pending status
2. `create_ranking_aggregation_trigger` — ranking_aggregation placeholder
3. `create_cqs_scoring_trigger` — cqs_scoring with top_theme2_id metadata
4. `create_reward_payout_trigger` — reward_payout placeholder

**Orchestrate Post-Polling Flow (TestOrchestratePostPollingFlow):**
1. `full_polling_to_ranking_flow` — polling→ranking creates ai_theming trigger + fires background task
2. `orchestrate_without_seed` — Works with None seed
3. `orchestrate_fires_exactly_one_task` — Exactly 1 asyncio.create_task per orchestration

**Moderator + 7 Users Flow (TestModeratorUserOrchestrationFlow):**
1. `moderator_triggers_pipeline_after_polling` — Moderator polling→ranking fires orchestrator
2. `pipeline_status_tracking_through_lifecycle` — pending → in_progress → completed
3. `seven_user_responses_tracked_in_metadata` — Pipeline metadata stores total_responses: 7

### Cube 5 — Service Functions Status
| Function | Status | Notes |
|----------|--------|-------|
| `calculate_tokens()` | **Implemented** | ♡ = ceil(min), 웃 = jurisdiction rate, ◬ = 5x ♡ |
| `start_time_tracking()` | **Implemented** | Creates open TimeEntry |
| `stop_time_tracking()` | **Implemented** | Calculates duration + tokens + ledger entry |
| `create_login_time_entry()` | **Implemented** | Awards ♡1 웃0 ◬5 on join |
| `get_participant_time_summary()` | **Implemented** | Aggregated time + tokens per participant |
| `_create_trigger()` | **Implemented** | Internal: creates PipelineTrigger record |
| `update_pipeline_status()` | **Implemented** | Updates trigger status + error + metadata |
| `trigger_ai_pipeline()` | **Implemented** | Creates trigger + fires Cube 6 background task |
| `trigger_ranking_pipeline()` | **Implemented** | Placeholder — creates ranking_aggregation trigger |
| `trigger_cqs_scoring()` | **Implemented** | Placeholder — creates cqs_scoring trigger |
| `orchestrate_post_polling()` | **Implemented** | Master coordinator — fires AI pipeline on transition |
| `get_pipeline_status()` | **Implemented** | Returns triggers + status flags for session |
| `process_join_payment()` | Not implemented | No Stripe in join |
| `create_payment_checkout()` | Not implemented | Stripe stub |

### Cube 5 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube5_gateway/service.py` | 496 | Time tracking (262 lines) + orchestrator (234 lines) |
| `cubes/cube5_gateway/router.py` | 233 | 6 time + 3 pipeline + 3 payment stubs = 12 endpoints |
| `models/pipeline_trigger.py` | 57 | PipelineTrigger ORM (session_id, trigger_type, status, trigger_metadata) |
| `schemas/pipeline.py` | 42 | 4 Pydantic schemas |
| `schemas/time_tracking.py` | 43 | 3 Pydantic schemas |
| `models/time_tracking.py` | 57 | TimeEntry ORM |
| `tests/cube5/test_time_tracking_service.py` | 350 | 18 unit tests |
| `tests/cube5/test_orchestrator_service.py` | 310 | 22 unit tests |
| `tests/cube5/test_e2e_flows.py` | 420 | 20 E2E tests + CUBE5_TEST_METHOD |

### Cube 5 — Requirements.txt Specification

#### Data Tables

**Table: `time_entries`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Time entry ID |
| session_id | UUID (FK→sessions) | Session reference |
| participant_id | UUID (FK→participants) | Who is being tracked |
| action_type | ENUM | `login` / `responding` / `ranking` / `reviewing` / `peer_volunteer` / `team_collaboration` |
| method | ENUM | `method_1` (polling) / `method_2` (peer volunteer) / `method_3` (team collab) |
| started_at | TIMESTAMP | When tracking began |
| stopped_at | TIMESTAMP (nullable) | When tracking ended (null = still active) |
| duration_seconds | FLOAT (nullable) | Computed on stop: `stopped_at - started_at` |
| si_tokens | INTEGER | ♡ tokens earned = `floor(duration_minutes)` |
| hi_tokens | DECIMAL(12,4) | 웃 tokens earned = `duration_min * (jurisdiction_rate / 60)` |
| ai_tokens | INTEGER | ◬ tokens earned = `si_tokens * 5` (default multiplier) |
| jurisdiction_code | VARCHAR(10) (nullable) | Jurisdiction used for 웃 rate lookup |

**Table: `pipeline_triggers`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Trigger ID |
| session_id | UUID (FK→sessions) | Session reference |
| trigger_type | ENUM | `ai_theming` / `ranking_aggregation` / `cqs_scoring` / `reward_payout` |
| status | ENUM | `pending` / `in_progress` / `completed` / `failed` |
| trigger_metadata | JSONB (nullable) | Type-specific metadata (e.g., `total_responses`, `top_theme2_id`, `seed`) |
| error_message | TEXT (nullable) | Error details on failure |
| created_at | TIMESTAMP | When trigger was created |
| started_at | TIMESTAMP (nullable) | When processing began |
| completed_at | TIMESTAMP (nullable) | When processing finished |
| retry_count | INTEGER | Number of retry attempts (default 0) |

**Table: `confirmation_gates`** (Methods 2 & 3)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Gate ID |
| session_id | UUID (FK→sessions) | Session reference |
| desired_outcome_id | UUID (FK→desired_outcomes) | Linked outcome from Cube 4 |
| method | ENUM | `method_2` / `method_3` |
| required_participants | JSONB | Array of participant_ids who must confirm |
| confirmed_participants | JSONB | Array of participant_ids who have confirmed |
| all_confirmed | BOOLEAN | True when `required == confirmed` |
| gate_opened_at | TIMESTAMP (nullable) | When all confirmed — timer starts |
| created_at | TIMESTAMP | When gate was created |

#### Inputs
| Input | Source | Description |
|-------|--------|-------------|
| Session state transition event | Cube 1 | State machine fires transition → orchestrator reacts |
| Response submission event | Cube 2, Cube 3 | Redis pub/sub `response_submitted` triggers time tracking |
| Collected response set | Cube 4 | Full response count for pipeline metadata |
| All-confirmed signal | Cube 4 | Desired Outcome confirmation triggers timer start (M2/M3) |
| Jurisdiction code | Cube 1 / User profile | Used for 웃 rate lookup |
| AI pipeline result | Cube 6 | Theme pipeline completion status + theme IDs |
| Ranking result | Cube 7 | Ranking aggregation completion status |
| Payment confirmation | Stripe / GPay / ApplePay | External payment webhook triggers join completion |

#### Outputs
| Output | Destination | Description |
|--------|-------------|-------------|
| Time entry record | Cube 8 (Token Ledger) | Duration + token values for ledger append |
| ♡ 웃 ◬ token values | Frontend (Token HUD) | Immediate display after each action |
| AI pipeline trigger | Cube 6 | Background task to start theming pipeline |
| Ranking pipeline trigger | Cube 7 | Signal to start ranking aggregation |
| CQS scoring trigger | Cube 6 / Cube 8 | Signal to score top-theme responses |
| Pipeline status | Cube 9, Frontend | Status flags for dashboard/export readiness |
| Gate-opened signal | Cube 5 (self) | Starts time tracking timer for M2/M3 |

#### UI/UX Translation Strings (12 keys)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube5.time.tracking_active` | "Tracking your participation time" | Active timer indicator |
| `cube5.time.session_time` | "Session time: {minutes} min" | Time display |
| `cube5.time.tokens_earned` | "Tokens earned this session" | Token summary header |
| `cube5.pipeline.processing` | "Processing responses..." | AI pipeline in progress |
| `cube5.pipeline.themes_ready` | "Themes are ready!" | AI pipeline complete |
| `cube5.pipeline.ranking_ready` | "Rankings are being calculated..." | Ranking pipeline active |
| `cube5.pipeline.failed` | "Processing failed — retrying..." | Pipeline error state |
| `cube5.pipeline.retry` | "Retry processing" | Manual retry button |
| `cube5.gate.waiting_confirmations` | "Waiting for all participants to confirm..." | M2/M3 gate waiting |
| `cube5.gate.confirmed` | "All confirmed — timer started!" | M2/M3 gate opened |
| `cube5.payment.processing` | "Processing payment..." | Payment in progress |
| `cube5.payment.complete` | "Payment confirmed — you're in!" | Payment success |

#### Metrics

**System Metrics (9):**
| Metric | Unit | Description |
|--------|------|-------------|
| `cube5.time_tracking.start_stop_latency_p50` | ms | p50 latency for start/stop time tracking calls |
| `cube5.time_tracking.start_stop_latency_p95` | ms | p95 latency for start/stop time tracking calls |
| `cube5.token_calculation_latency` | ms | Latency of `calculate_tokens()` per submission |
| `cube5.confirmation_gate_processing_time` | ms | Time to process M2/M3 confirmation gate |
| `cube5.ai_pipeline_trigger_latency` | ms | Time from transition event to Cube 6 background task creation |
| `cube5.ranking_pipeline_trigger_latency` | ms | Time from trigger creation to Cube 7 task dispatch |
| `cube5.gateway_throughput` | events/sec | Total events processed per second across all pipelines |
| `cube5.pending_trigger_queue_depth` | count | Number of pipeline triggers in `pending` status |
| `cube5.api_response_time_by_route` | ms | Per-endpoint response time (12 routes) |
| `cube5.error_rate_by_event_type` | ratio | Error rate partitioned by trigger_type |

**User Metrics (7):**
| Metric | Unit | Description |
|--------|------|-------------|
| `cube5.active_time_per_user.avg` | minutes | Average active participation time per user |
| `cube5.active_time_per_user.median` | minutes | Median active participation time per user |
| `cube5.active_time_per_user.p95` | minutes | p95 active participation time per user |
| `cube5.si_tokens_per_user` | count | ♡ tokens per user (avg / median / max) |
| `cube5.ai_tokens_per_user` | count | ◬ tokens per user (avg / median / max) |
| `cube5.time_by_method` | minutes | Time tracked partitioned by M1 / M2 / M3 |
| `cube5.confirmation_gate_completion_time` | seconds | Time from gate creation to all-confirmed (M2/M3) |
| `cube5.submission_rate_per_user` | count/min | Rate of submissions per user during active polling |
| `cube5.timer_abandonment_rate` | ratio | Fraction of started time entries never stopped |

**Outcome Metrics (11):**
| Metric | Unit | Description |
|--------|------|-------------|
| `cube5.total_si_tokens_per_session` | count | Total ♡ tokens awarded across all participants |
| `cube5.total_ai_tokens_per_session` | count | Total ◬ tokens awarded across all participants |
| `cube5.desired_outcome_achievement_rate` | ratio | Fraction of M2/M3 outcomes marked `achieved` |
| `cube5.post_task_signoff_completion_rate` | ratio | Fraction of participants who signed off on results |
| `cube5.ai_pipeline_success_rate` | ratio | Fraction of ai_theming triggers that completed successfully |
| `cube5.ranking_pipeline_success_rate` | ratio | Fraction of ranking_aggregation triggers that completed |
| `cube5.avg_poll_close_to_themes_ready` | seconds | Average time from polling close to themes complete |
| `cube5.avg_ranking_close_to_results_ready` | seconds | Average time from ranking close to results available |
| `cube5.cqs_pipeline_latency` | seconds | Time from CQS trigger to scores computed |
| `cube5.cqs_score_distribution` | JSON | Average, spread, and outlier count for CQS scores |
| `cube5.reward_disbursement_success_rate` | ratio | Fraction of reward payouts completed without error |

### Cube 5 — DesignMatrix VOC
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-12 | Fair credit for time spent | "People invest real time — they deserve transparent tracking." |
| CRS-13 | Know that the system is working | "I want to see progress, not wonder if my input disappeared." |
| CRS-18 | Seamless pipeline orchestration | "When polling ends, theming should just happen — no manual steps." |
| CRS-19 | Accountability in group tasks | "Everyone should confirm before the clock starts — no free riders." |

---

## Cube 6 — AI Theme Pipeline: IMPLEMENTED (CRS-11→CRS-14; ~85% of full spec)

**Code location:** `backend/app/cubes/cube6_ai/` (modular, self-contained, Cube 10 isolatable)

### Cube 6 — Two-Phase Architecture

**Phase A — Live Per-Response Summarization (during polling):**
- Fired async from Cube 2 submit flow (`summarize_single_response()`)
- Generates 333 → 111 → 33 word English summaries immediately
- Non-English text auto-translated to English
- Stored in MongoDB `summaries` collection for instant moderator screen display
- Fire-and-forget: does NOT block response to the user

**Phase B — Parallel Theme Pipeline (after moderator closes polling):**
1. Fetch pre-computed 33-word summaries from MongoDB
2. Classify Theme01 (Risk/Supporting/Neutral) — batch parallel via LLM
3. Apply <65% confidence → Neutral reclassification rule
4. Group by Theme01 into 3 partitions
5. Marble sampling: deterministic shuffle + slice into groups of 10 (monolith match)
6. Generate 3 themes per group — **10+ concurrent agents** (asyncio.create_task)
7. After ALL groups complete: merge all candidate themes per partition
8. Reduce all → 9 (statistically relevant) → 6 → 3 (concurrent per category)
9. Assign each response to 9/6/3 themes with confidence (LLM or embedding)
10. Store Theme + ThemeSample in Postgres, update MongoDB, compute replay hash
- **Target:** Theme01 + Theme2 complete in <30 seconds for 1000 responses

### Cube 6 — Providers at Launch
| Provider | Embedding Model | Summarization Model | Status |
|----------|----------------|---------------------|--------|
| OpenAI | text-embedding-3-small | gpt-4o-mini | **Implemented** |
| Grok (xAI) | grok-embedding-beta | grok-2 | **Implemented** |
| Gemini (Google) | text-embedding-004 | gemini-2.0-flash | **Implemented** |

- **Factory failover:** openai → grok → gemini (skips providers without API keys)
- **Circuit breaker:** Per-provider key check, automatic failover to next available

### Cube 6 — CRS Traceability
| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-11 | CRS-11.IN.SRS.011 | CRS-11.OUT.SRS.011 | **Complete** | Real-time theme streaming |
| CRS-11.1 | — | — | **Complete** | Live 333/111/33 summarization per response |
| CRS-11.2 | — | — | **Complete** | Parallel marble sampling (10+ concurrent agents) |
| CRS-12 | CRS-12.IN.SRS.012 | CRS-12.OUT.SRS.012 | **Complete** | Multi-provider embedding comparison |
| CRS-12.1 | — | — | **Complete** | Grok + Gemini provider implementations |
| CRS-12.2 | — | — | **Complete** | Factory with circuit breaker failover |
| CRS-13 | CRS-13.IN.SRS.013 | CRS-13.OUT.SRS.013 | **Complete** | Progressive theme reveal UX |
| CRS-14 | CRS-14.IN.SRS.014 | CRS-14.OUT.SRS.014 | **Partial** | CQS scoring (deferred to post-Cube 7) |

### Cube 6 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube6/ -v --tb=short
```

**Test Suite:** 1 file, 9 test classes, 20 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_ai_service.py` | 9 | 20 | Unit tests (summarization, classification, grouping, sampling, parsing, factory) |

### Cube 6 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube6_ai/service.py` | 550+ | Two-phase pipeline (Phase A live + Phase B parallel theming) |
| `cubes/cube6_ai/providers/base.py` | 85 | EmbeddingProvider + SummarizationProvider ABCs |
| `cubes/cube6_ai/providers/factory.py` | 112 | Factory with circuit breaker failover |
| `cubes/cube6_ai/providers/openai_provider.py` | 85 | OpenAI embedding + summarization |
| `cubes/cube6_ai/providers/grok_provider.py` | 96 | Grok (xAI) embedding + summarization |
| `cubes/cube6_ai/providers/gemini_provider.py` | 94 | Gemini (Google) embedding + summarization |
| `models/theme.py` | 38 | Theme ORM (hierarchical with parent_theme_id) |
| `models/theme_sample.py` | 39 | ThemeSample ORM (marble groups) |
| `tests/cube6/test_ai_service.py` | 464 | 20 unit tests |

### Cube 6 — Requirements.txt Specification

#### Data Tables

**Table: `embeddings`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Embedding record ID |
| session_id | UUID (FK→sessions) | Session reference |
| response_id | UUID (FK→collected_responses) | Source response |
| provider | ENUM | `openai` / `grok` / `gemini` |
| model_id | VARCHAR(50) | Pinned model version (e.g., `text-embedding-3-small`) |
| vector | VECTOR(1536) | Embedding vector (dimension varies by provider) |
| input_text | TEXT | The 33-word summary used as embedding input |
| created_at | TIMESTAMP | When embedding was generated |
| batch_id | UUID (nullable) | Batch grouping for bulk operations |

**Table: `clusters`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Cluster ID |
| session_id | UUID (FK→sessions) | Session reference |
| level | ENUM | `theme01` / `theme2_9` / `theme2_6` / `theme2_3` |
| cluster_index | INTEGER | Deterministic position index (0-based) |
| centroid | VECTOR(1536) | Cluster centroid vector |
| random_state | INTEGER | Seed used for MiniBatchKMeans |
| member_count | INTEGER | Number of responses assigned |
| silhouette_score | FLOAT (nullable) | Intra-cluster cohesion metric |
| created_at | TIMESTAMP | When cluster was computed |

**Table: `themes`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Theme ID |
| session_id | UUID (FK→sessions) | Session reference |
| parent_theme_id | UUID (FK→themes, nullable) | Hierarchical parent (Theme01 → Theme2_9 → Theme2_6 → Theme2_3) |
| level | ENUM | `theme01` / `theme2_9` / `theme2_6` / `theme2_3` |
| label | VARCHAR(200) | Theme label (e.g., "Risk & Concerns", "Data Privacy Imperative") |
| description | TEXT (nullable) | Extended theme description |
| category | ENUM (nullable) | Theme01 only: `risk` / `supporting` / `neutral` |
| response_count | INTEGER | Number of responses assigned to this theme |
| confidence_avg | FLOAT | Average confidence across assigned responses |
| sort_order | INTEGER | Deterministic display order |
| created_at | TIMESTAMP | When theme was created |

**Table: `response_theme_assignments`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Assignment ID |
| session_id | UUID (FK→sessions) | Session reference |
| response_id | UUID (FK→collected_responses) | Which response |
| theme_id | UUID (FK→themes) | Which theme |
| level | ENUM | `theme01` / `theme2_9` / `theme2_6` / `theme2_3` |
| confidence | FLOAT | Assignment confidence (0.0–1.0) |
| method | ENUM | `llm_classification` / `embedding_cosine` | Assignment method |
| reclassified | BOOLEAN | True if <65% confidence → moved to Neutral (Theme01 only) |
| created_at | TIMESTAMP | When assignment was made |

**Table: `summaries`** (MongoDB collection)
| Variable | Type | Description |
|----------|------|-------------|
| _id | ObjectId (PK) | MongoDB document ID |
| session_id | STRING | Session reference |
| response_id | STRING | Source response reference |
| original_text | STRING | Original response text (any language) |
| original_language | STRING | Detected language code |
| summary_333 | STRING | ~333-word English summary |
| summary_111 | STRING | ~111-word English summary |
| summary_33 | STRING | ~33-word English summary |
| provider | STRING | AI provider used for summarization |
| model_id | STRING | Pinned model version |
| theme01 | STRING (nullable) | Theme01 assignment (after Phase B) |
| theme01_confidence | FLOAT (nullable) | Theme01 confidence |
| theme2_9 | STRING (nullable) | Theme2_9 assignment |
| theme2_9_confidence | FLOAT (nullable) | Theme2_9 confidence |
| theme2_6 | STRING (nullable) | Theme2_6 assignment |
| theme2_6_confidence | FLOAT (nullable) | Theme2_6 confidence |
| theme2_3 | STRING (nullable) | Theme2_3 assignment |
| theme2_3_confidence | FLOAT (nullable) | Theme2_3 confidence |
| created_at | DATETIME | When summary was generated |
| updated_at | DATETIME | Last update (theme assignments added in Phase B) |

**Table: `cqs_scores`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | CQS score ID |
| session_id | UUID (FK→sessions) | Session reference |
| response_id | UUID (FK→collected_responses) | Scored response |
| participant_id | UUID (FK→participants) | Response author |
| theme2_cluster_id | UUID (FK→themes) | Must be #1 most-voted Theme2 cluster |
| theme_confidence | FLOAT | Must be >0.95 to qualify |
| insight_score | FLOAT | Insight metric (weight: 20%) |
| depth_score | FLOAT | Depth metric (weight: 15%) |
| future_impact_score | FLOAT | Future Impact metric (weight: 25%) |
| originality_score | FLOAT | Originality metric (weight: 15%) |
| actionability_score | FLOAT | Actionability metric (weight: 15%) |
| relevance_score | FLOAT | Relevance metric (weight: 10%) |
| composite_cqs | FLOAT | Weighted composite = sum(metric * weight) |
| is_winner | BOOLEAN | True for highest CQS (ties broken randomly) |
| provider | ENUM | AI provider used for scoring |
| created_at | TIMESTAMP | When scored |

#### Inputs
| Input | Source | Description |
|-------|--------|-------------|
| Collected response set | Cube 4 | Full response list with final_text + language_code |
| Pre-computed 33-word summaries | MongoDB (Phase A) | Summaries generated live during polling |
| Session config | Cube 1 | ai_provider selection, theme2_voting_level (9/6/3), CQS weights |
| Pipeline trigger | Cube 5 (Orchestrator) | Background task signal to start Phase B |
| #1 most-voted Theme2 cluster | Cube 7 (Ranking) | Required for CQS scoring eligibility |
| Embedding model config | Provider factory | Pinned model version + API key availability |
| Random seed | Cube 1 (session seed) | For deterministic clustering + marble sampling |

#### Outputs
| Output | Destination | Description |
|--------|-------------|-------------|
| 333/111/33 summaries | MongoDB → Cube 4, Cube 9, Frontend | Per-response summaries for display + export |
| Theme01 assignments | Postgres → Cube 7, Cube 9 | Risk / Supporting / Neutral with confidence |
| Theme2_9/6/3 assignments | Postgres → Cube 7, Cube 9 | Sub-theme hierarchy with confidence per response |
| Theme records | Postgres → Cube 7 (Ranking) | Theme labels + descriptions for voting UI |
| CQS scores | Postgres → Cube 8 (Tokens) | Composite scores for gamified reward selection |
| Replay hash | Postgres → Cube 10 (Simulation) | SHA-256 of inputs + parameters for reproducibility |

#### Functions (17 total per Requirements.txt)
| Function | Status | Description |
|----------|--------|-------------|
| `summarize_single_response()` | **Implemented** | Phase A: Generates 333→111→33 summaries live |
| `translate_to_english()` | **Implemented** | Translates non-English text before summarization |
| `classify_theme01()` | **Implemented** | Classifies Risk / Supporting / Neutral with confidence |
| `reclassify_low_confidence()` | **Implemented** | Moves <65% confidence to Neutral |
| `group_by_theme01()` | **Implemented** | Partitions responses into 3 Theme01 categories |
| `marble_sample()` | **Implemented** | Deterministic shuffle + slice into groups of 10 |
| `generate_candidate_themes()` | **Implemented** | 3 themes per marble group (10+ concurrent agents) |
| `merge_candidate_themes()` | **Implemented** | Combines all candidate themes per partition |
| `reduce_themes()` | **Implemented** | Reduces all → 9 → 6 → 3 (concurrent per category) |
| `assign_responses_to_themes()` | **Implemented** | LLM or embedding cosine assignment with confidence |
| `compute_replay_hash()` | **Implemented** | SHA-256 of inputs + parameters for determinism |
| `run_pipeline()` | **Implemented** | Phase B master orchestrator (full pipeline) |
| `batch_embed()` | **Implemented** | Batch embedding generation via provider |
| `get_provider()` | **Implemented** | Factory with circuit breaker failover |
| `score_cqs()` | Not implemented | Scores responses in #1 Theme2 cluster (6 metrics) |
| `select_cqs_winner()` | Not implemented | Highest CQS → winner (random tie-break) |
| `push_to_live_feed()` | Not implemented | WebSocket 33-word summary feed to moderator screen |

#### UI/UX Translation Strings (16 keys)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube6.summary.generating` | "Generating summary..." | Live summary spinner |
| `cube6.summary.ready` | "Summary ready" | Summary generation complete |
| `cube6.summary.word_count` | "{count} words" | Summary word count label |
| `cube6.theme.processing` | "Analyzing themes..." | Phase B in progress |
| `cube6.theme.complete` | "Themes identified!" | Phase B complete |
| `cube6.theme.risk` | "Risk & Concerns" | Theme01 category label |
| `cube6.theme.supporting` | "Supporting Comments" | Theme01 category label |
| `cube6.theme.neutral` | "Neutral Comments" | Theme01 category label |
| `cube6.theme.confidence` | "{pct}% confidence" | Theme confidence display |
| `cube6.theme.responses` | "{count} responses" | Response count per theme |
| `cube6.theme.reveal` | "Revealing themes..." | Progressive theme reveal animation |
| `cube6.cqs.scoring` | "Scoring contributions..." | CQS scoring in progress |
| `cube6.cqs.winner` | "Top contributor identified!" | CQS winner announcement |
| `cube6.provider.active` | "Using {provider}" | Active AI provider indicator |
| `cube6.provider.failover` | "Switched to {provider}" | Failover notification |
| `cube6.feed.live` | "Live summary feed" | Live feed header (paid tiers) |

#### CQS Engine Detail

**Contribution Quality Score (CQS)** — scored ONLY on responses in the #1 most-voted Theme2 cluster with >95% theme confidence. Saves API calls by limiting scoring to the winning cluster.

| Metric | Weight | Description |
|--------|--------|-------------|
| Insight | 20% | Depth of understanding demonstrated in the response |
| Depth | 15% | Thoroughness and comprehensiveness of analysis |
| Future Impact | 25% | Forward-looking value and long-term implications |
| Originality | 15% | Novelty and uniqueness of perspective |
| Actionability | 15% | Practical applicability and implementation clarity |
| Relevance | 10% | Alignment with the session question and context |

**CQS Formula:** `composite_cqs = (insight * 0.20) + (depth * 0.15) + (future_impact * 0.25) + (originality * 0.15) + (actionability * 0.15) + (relevance * 0.10)`

**Winner Selection:**
1. Filter: Only responses in #1 most-voted Theme2 cluster
2. Filter: Only responses with theme_confidence > 0.95
3. Score: Run 6-metric CQS via AI provider
4. Rank: Sort by composite_cqs descending
5. Tie-break: Random selection among tied top scores (fair, unpredictable)
6. CQS is hidden from users, visible to Moderators and system

**Moderator CQS Weight Override:** Moderator can customize the 6 metric weights at session creation via `cqs_weights` JSONB field on the session. Default weights used if not overridden.

### Cube 6 — DesignMatrix VOC
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-09 | Understand what the group thinks | "I need themes, not a wall of text." |
| CRS-10 | Trust the AI's interpretation | "If I can see how confident the system is, I trust it more." |
| CRS-12 | Provider choice matters | "We use OpenAI internally — but our client prefers Gemini." |
| CRS-14 | Reward quality contributions | "Gamification motivates better answers — but it must be fair." |
