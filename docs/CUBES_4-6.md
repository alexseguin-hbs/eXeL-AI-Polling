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

> **CRS Alignment Note:** Cube 4 uses CRS-09 for response collection/aggregation and CRS-10 for desired outcomes — this matches the Requirements.txt canonical spec. See SSSES Plan at end of this doc for full DesignMatrix CRS alignment detail.

| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-09 | CRS-09.IN.SRS.009 | CRS-09.OUT.SRS.009 | **Complete** | Real-time streaming aggregation |
| CRS-09.01 | — | — | **Complete** | Web_Results 5-column raw format (q_number, question, user, detailed_results, response_language) |
| CRS-09.02 | — | — | **Complete** | Dual storage: Postgres ResponseMeta + MongoDB raw payload write |
| CRS-09.03 | — | — | **GAP — Task A5.03** | Supabase broadcast on aggregation completion for live feed push (links to Cube 6 Phase A → Dashboard pipeline) |
| CRS-09.1 | — | — | **Complete** | Web_Results format with native language column |
| CRS-09.2 | — | — | **Complete** | Live summary status tracking (MongoDB) |
| CRS-10 | CRS-10.IN.SRS.010 | CRS-10.OUT.SRS.010 | **Partial** | Full desired outcome collection |
| CRS-10.01 | — | — | **Not implemented** | Desired outcome creation — `create_desired_outcome()`, `record_confirmation()` (Methods 2 & 3) |
| CRS-10.02 | — | — | **Not implemented** | All-confirmed gate signal → Cube 5 timer trigger (`check_all_confirmed()` → `gate_opened_at`) |
| CRS-10.03 | — | — | **Not implemented** | Post-task results log (`log_post_task_results()`, `assessed_by`, `outcome_status`) |

### Cube 4 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube4/ -v --tb=short
```

**Test Suite:** 2 files, 8 test classes, 21 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_collector_service.py` | 6 | 15 | Unit tests (count, languages, presence, summaries, collected, single) |
| `test_e2e_flows.py` | 5 | 6 | E2E flows (collection, multi-language, anonymous, pagination, voice) |

### Cube 4 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube4_collector/service.py` | 387 | Core business logic (7 functions) |
| `cubes/cube4_collector/router.py` | 94 | 6 API endpoints |
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

### Cube 4 — Simulation Requirements (Cube 10 Isolation)

> In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs and compares output metrics against the existing implementation baseline.

#### Input/Output Simulation Modes

| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| Validated text response | Input | Cube 2 (Text) | **SIMULATED** | Mock text responses from Cube 2 fixture store (7 per session, 28 total across 4 sessions) |
| Voice transcript | Input | Cube 3 → Cube 2 | **SIMULATED** | Mock voice transcripts processed through Cube 2 text pipeline fixtures |
| Payment status | Input | Cube 1 / Cube 8 | **SIMULATED** | Mock payment_status field on participant fixture (paid/unpaid/exempt) |
| Desired Outcome doc | Input | User UI (Methods 2 & 3) | **SIMULATED** | Mock desired outcome records with description, time estimate, and confirmation status |
| Participant confirmations | Input | User UI (Methods 2 & 3) | **SIMULATED** | Mock confirmation actions — all participants pre-confirmed in fixture |
| Post-task results log | Input | User UI (Methods 2 & 3) | **SIMULATED** | Mock results log with outcome_status (achieved/partial/not_achieved) |
| Heartbeat pings | Input | Frontend | **SIMULATED** | Mock heartbeat events at fixed intervals — no real WebSocket connection |
| Session metadata | Input | Cube 1 (Session) | **SIMULATED** | Mock session with questions, participants, language codes from fixture store |
| MongoDB raw text/transcripts | Input | MongoDB | **SIMULATED** | Mock MongoDB collection with raw response documents — no real MongoDB required |
| Postgres ResponseMeta + Questions + Participants | Input | Postgres | **SIMULATED** | Mock Postgres JOINs returning fixture response metadata |
| Summary data (333/111/33) | Input | MongoDB (via Cube 6 Phase A) | **SIMULATED** | Mock summaries pre-loaded in fixture MongoDB — optional include |
| Theme data (Theme01 + Theme2) | Input | Cube 6 Phase B | **SIMULATED** | Mock theme assignments with confidence scores — optional include |
| Collected response set | Output | Cube 6 (AI Theming) | **SIMULATED** | Web_Results format written to mock store for downstream consumption |
| Presence state | Output | Cube 1, Cube 5, Frontend | **SIMULATED** | Mock Redis HSET/HGETALL — participant count and status from fixture |
| Desired Outcome record | Output | Cube 5, Cube 8, Cube 9 | **SIMULATED** | Mock Postgres record with confirmation status |
| All-confirmed signal | Output | Cube 5 (Gateway) | **SIMULATED** | Mock signal emitted when all fixture participants confirmed |
| Post-task results | Output | Cube 8, Cube 9 | **SIMULATED** | Mock results log for token calculation and export |

#### Function Simulation Modes

| Function | Sim Mode | Simulation Behavior |
|----------|----------|---------------------|
| `aggregate_response()` | **SIMULATED** | Creates unified collected_responses entry from mock Postgres JOINs. Validates Web_Results format (q_number, question, user, detailed_results, response_language, native_language). |
| `store_to_mongodb()` | **SIMULATED** | Writes to mock MongoDB collection (in-memory dict). Verifies document structure matches raw response schema. |
| `cache_response_state()` | **SIMULATED** | Updates mock Redis with response count. No real Redis connection required. |
| `track_presence()` | **SIMULATED** | Processes mock heartbeat pings. Updates mock Redis HSET with participant status (online/idle/disconnected). EXPIRE simulated with mock clock. |
| `create_desired_outcome()` | **SIMULATED** | Creates mock desired outcome record with fixture description + time estimate. Not yet implemented in production — sim validates schema only. |
| `record_confirmation()` | **SIMULATED** | Records mock participant confirmation. Not yet implemented in production — sim validates confirmation logic. |
| `check_all_confirmed()` | **SIMULATED** | Pure logic — checks if all required participants in fixture have confirmed. Returns boolean. |
| `log_post_task_results()` | **SIMULATED** | Stores mock post-task results with outcome_status. Not yet implemented in production. |
| `get_response_set()` | **SIMULATED** | Returns full collected response set from mock store. Validates pagination, language breakdown, and optional summary/theme includes. |
| `get_presence_count()` | **SIMULATED** | Returns current online participant count from mock Redis. |

#### Canned Test Data

| Data Type | Count | Description |
|-----------|-------|-------------|
| Mock collected responses | 28 | 7 per session across 4 default sessions, Web_Results format with language tags |
| Mock text responses | 24 | From Cube 2 fixture store — validated, PII-scrubbed text |
| Mock voice transcripts | 4 | From Cube 3 fixture store — STT transcripts processed through text pipeline |
| Mock participants | 32 | 8 per session (1 moderator + 7 users) with language_code and payment_status |
| Mock questions | 4 | One per session with q_number and question text |
| Mock presence records | 32 | One per participant — online/idle/disconnected status with last_heartbeat |
| Mock summaries (MongoDB) | 28 | Pre-computed 333/111/33 word summaries for optional include testing |
| Mock theme assignments | 28 | Theme01 + Theme2_9/6/3 with confidence for optional include testing |
| Mock desired outcomes | 2 | One Method 2 (3 participants), one Method 3 (4 participants) |
| Mock language breakdown | 11 | EN(55%), ES(11%), DE(10%), FR(6%), PT(5%), JA(3%), ZH(3%), KO(2%), AR(2%), HI(2%), IT(1%) |

#### Simulation Pass Criteria

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Test pass rate | 100% (27/27) | All existing Cube 4 unit + E2E tests must pass |
| Web_Results format | Exact schema match | All 15 columns present and correctly typed (q_number through Theme2_3_Confidence) |
| Response count accuracy | Exact match | `get_response_count()` must return correct text/voice/total breakdown |
| Language breakdown | Exact match | Language grouping must match fixture distribution (11 languages) |
| Presence tracking | Correct state | Online/idle/disconnected status must reflect heartbeat timing |
| Summary inclusion | Optional pass-through | When include_summaries=True, 333/111/33 fields populated from mock MongoDB |
| Theme inclusion | Optional pass-through | When include_themes=True, Theme01 + Theme2 fields populated with confidence |
| Pagination | Correct totals | page/page_size params return correct subset with accurate total count |
| Anonymous support | Graceful handling | Null participant_id renders as "Anonymous" user label |
| Aggregation throughput | >= baseline | Response aggregation must not regress beyond current test duration |
| Spiral regression | 0 failures | All 287 backend tests must continue passing |
| Bundle size | No regression | Frontend bundle sizes must not increase beyond baseline |

#### Spiral Test Reference

See `SPIRAL_METRICS.md` — N=9 (Feb 26). Cube 4 tests: 27/27 pass, integrated into full backend suite (245/245 at time of implementation).

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
- **API endpoints:** 3 time routes + 3 pipeline routes + 3 payment stubs = 9 total

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

### Cube 5 — CRS Traceability

> **CRS Alignment Note:** Cube 5 spans coordination across CRS-09 (pipeline trigger on polling close), CRS-10 (confirmation gate / timer start for M2/M3), CRS-11 (AI pipeline trigger), and CRS-12 (time tracking / ♡ 웃 ◬ token calculation). Requirements.txt is the canonical spec. See SSSES Plan at end of this doc for full DesignMatrix alignment.

| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-09 | CRS-09.IN.SRS.009 | CRS-09.OUT.SRS.009 | **Complete** | Pipeline coordination on polling→ranking state transition |
| CRS-09.01 | — | — | **Complete** | `orchestrate_post_polling()` fires on Cube 1 state machine transition |
| CRS-09.02 | — | — | **Complete** | Background asyncio task pattern — does not block request lifecycle |
| CRS-09.03 | — | — | **Partial** | Error recovery on background task failure — no dead-letter queue (SSSES Task B5) |
| CRS-10 | CRS-10.IN.SRS.010 | CRS-10.OUT.SRS.010 | **Partial** | Confirmation gate timer start (Methods 2 & 3) |
| CRS-10.01 | — | — | **Not implemented** | `confirmation_gate` record creation on desired outcome all-confirmed signal from Cube 4 |
| CRS-10.02 | — | — | **Not implemented** | Gate-opened signal → timer auto-start; `gate_opened_at` timestamp written; time tracking begins |
| CRS-11 | CRS-11.IN.SRS.011 | CRS-11.OUT.SRS.011 | **Complete** | AI pipeline trigger coordination |
| CRS-11.01 | — | — | **Complete** | `trigger_ai_pipeline()` creates PipelineTrigger record + fires Cube 6 background task |
| CRS-11.02 | — | — | **Complete** | `trigger_ranking_pipeline()` placeholder trigger created on transition |
| CRS-11.03 | — | — | **Partial** | `trigger_cqs_scoring()` placeholder — depends on Cube 7 `top_theme2_id` (deferred) |
| CRS-11.04 | — | — | **Partial** | Pipeline status aggregation — `has_pending`, `has_failed`, `all_completed` flags correct; no retry-after on failure (SSSES Task B5) |
| CRS-12 | CRS-12.IN.SRS.012 | CRS-12.OUT.SRS.012 | **Complete** | Time tracking (♡ 웃 ◬ token calculation) |
| CRS-12.01 | — | — | **Complete** | `calculate_tokens()` — ♡ = ceil(min), 웃 = jurisdiction rate/60, ◬ = 5× ♡ |
| CRS-12.02 | — | — | **Complete** | 59-jurisdiction rate table via `hi_rates.py` (LIVE in production + sim) |
| CRS-12.03 | — | — | **Complete** | Login auto-entry on session join — Cube 1 hook fires `create_login_time_entry()` |
| CRS-12.04 | — | — | **Not implemented** | `process_join_payment()` — Stripe / GPay / Apple Pay integration (deferred to MVP2) |

### Cube 5 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube5_gateway/service.py` | 495 | Time tracking + orchestrator |
| `cubes/cube5_gateway/router.py` | 228 | 3 time + 3 pipeline + 3 payment stubs = 9 endpoints |
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
| `cube5.api_response_time_by_route` | ms | Per-endpoint response time (9 routes) |
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

### Cube 5 — Simulation Requirements (Cube 10 Isolation)

> In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs and compares output metrics against the existing implementation baseline.

#### Input/Output Simulation Modes

| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| Session state transition event | Input | Cube 1 (Session) | **SIMULATED** | Mock state machine transitions (draft→open→polling→ranking→closed→archived) with fixed timestamps |
| Response submission event | Input | Cube 2, Cube 3 | **SIMULATED** | Mock Redis pub/sub `response_submitted` events — no real Redis required |
| Collected response set | Input | Cube 4 (Collector) | **SIMULATED** | Mock response count from Cube 4 fixture store (28 responses across 4 sessions) |
| All-confirmed signal | Input | Cube 4 (Desired Outcomes) | **SIMULATED** | Mock confirmation gate with all participants pre-confirmed |
| Jurisdiction code | Input | Cube 1 / User profile | **LIVE** | Uses real `hi_rates.py` lookup table — 59 jurisdictions loaded from production data |
| AI pipeline result | Input | Cube 6 (AI Theming) | **SIMULATED** | Mock pipeline completion status with fixture theme IDs |
| Ranking result | Input | Cube 7 (Ranking) | **SIMULATED** | Mock ranking aggregation completion status |
| Payment confirmation | Input | Stripe / GPay / ApplePay | **SIMULATED** | Mock payment webhook — no real Stripe calls |
| Time entry record | Output | Cube 8 (Token Ledger) | **SIMULATED** | Written to mock Postgres (in-memory); duration + token values verified |
| ♡ 웃 ◬ token values | Output | Frontend (Token HUD) | **SIMULATED** | Token values returned in mock API response for UI verification |
| AI pipeline trigger | Output | Cube 6 | **SIMULATED** | Mock asyncio.create_task — fires mock pipeline instead of real Cube 6 |
| Ranking pipeline trigger | Output | Cube 7 | **SIMULATED** | Mock trigger record created — no real Cube 7 call |
| CQS scoring trigger | Output | Cube 6 / Cube 8 | **SIMULATED** | Mock trigger with fixture top_theme2_id metadata |
| Pipeline status | Output | Cube 9, Frontend | **SIMULATED** | Status flags (has_pending, has_failed, all_completed) computed from mock triggers |
| Gate-opened signal | Output | Cube 5 (self) | **SIMULATED** | Mock signal triggers time tracking start in sim mode |

#### Function Simulation Modes

| Function | Sim Mode | Simulation Behavior |
|----------|----------|---------------------|
| `calculate_tokens()` | **BOTH** | Math is identical in sim and production. ♡ = ceil(minutes), ◬ = 5x ♡. 웃 rate lookup is LIVE (uses real `hi_rates.py` with 59 jurisdictions). Duration inputs are SIMULATED (mock clock). |
| `start_time_tracking()` | **SIMULATED** | Creates TimeEntry in mock Postgres with fixture timestamp as `started_at`. No real clock dependency. |
| `stop_time_tracking()` | **SIMULATED** | Computes duration from fixture start/stop timestamps. Calls `calculate_tokens()` with mock duration. Creates mock ledger entry. |
| `create_login_time_entry()` | **SIMULATED** | Awards ♡1 웃0 ◬5 and creates mock ledger entry. Verifies token values match expected. |
| `get_participant_time_summary()` | **SIMULATED** | Aggregates from mock TimeEntry records. Returns total time + tokens per participant. |
| `_create_trigger()` | **SIMULATED** | Creates PipelineTrigger in mock Postgres with fixture metadata. |
| `update_pipeline_status()` | **SIMULATED** | Updates mock trigger status (pending→in_progress→completed/failed). |
| `trigger_ai_pipeline()` | **SIMULATED** | Creates trigger record + fires mock background task (no real Cube 6 call). Verifies exactly 1 task created. |
| `trigger_ranking_pipeline()` | **SIMULATED** | Creates mock ranking_aggregation trigger. Placeholder logic verified. |
| `trigger_cqs_scoring()` | **SIMULATED** | Creates mock cqs_scoring trigger with fixture top_theme2_id. |
| `orchestrate_post_polling()` | **SIMULATED** | Master coordinator fires mock AI pipeline on transition. Verifies correct trigger type + metadata. |
| `get_pipeline_status()` | **SIMULATED** | Returns mock triggers with aggregated status flags. |
| `process_join_payment()` | **SIMULATED** | Stub — returns mock payment success. No Stripe integration. |
| `create_payment_checkout()` | **SIMULATED** | Stub — returns mock checkout URL. No Stripe integration. |

#### Canned Test Data

| Data Type | Count | Description |
|-----------|-------|-------------|
| Mock time entries | 24 | Fixed start/stop timestamps across 4 sessions (login + 2 actions per user, 8 users) |
| Mock login entries | 8 | One per participant across 4 sessions — each awards ♡1 웃0 ◬5 |
| Mock pipeline triggers (ai_theming) | 4 | One per session — pending/in_progress/completed/failed states |
| Mock pipeline triggers (ranking_aggregation) | 4 | One per session — placeholder triggers |
| Mock pipeline triggers (cqs_scoring) | 2 | With fixture top_theme2_id metadata |
| Mock pipeline triggers (reward_payout) | 1 | Placeholder trigger for reward disbursement |
| Jurisdiction rate fixtures | 59 | Full hi_rates.py table — 9 international + 50 US states (LIVE data) |
| Mock confirmation gates | 2 | One for Method 2 (3 participants), one for Method 3 (4 participants) |
| Mock payment webhooks | 3 | Stripe success, Stripe failure, cost-split calculation |
| Mock session state transitions | 6 | draft→open→polling→ranking→closed→archived with fixed timestamps |

#### Simulation Pass Criteria

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Test pass rate | 100% (60/60) | All existing Cube 5 unit + orchestrator + E2E tests must pass |
| Token calculation accuracy | Exact match | ♡, 웃, ◬ values must match expected for fixture durations |
| Jurisdiction rate coverage | 59/59 | All jurisdiction lookups must return correct $/hr rate |
| Pipeline trigger creation | Exact match | Correct trigger_type, status, and metadata for each orchestration |
| Background task count | Exactly 1 | `orchestrate_post_polling()` must fire exactly 1 asyncio.create_task |
| Token calculation speed | < 1ms | `calculate_tokens()` per-call latency (pure math + lookup) |
| Pipeline status aggregation | Correct flags | has_pending, has_failed, all_completed must reflect trigger states accurately |
| Ledger append-only | Verified | No mutations — only new entries in mock ledger |
| Spiral regression | 0 failures | All 287 backend tests must continue passing |
| Warning count | 0 | No RuntimeWarning or coroutine warnings from mock asyncio tasks |

#### Spiral Test Reference

See `SPIRAL_METRICS.md` — N=18 bidirectional (Feb 26). Cube 5 tests: 60/60 pass, average Cube 5 duration 264ms (forward) / 259ms (backward), 0 warnings after optimization.

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
- **Frontend stub (2026-03-05):** `summarizeCascade()` in `mock-data.ts` generates extractive summaries client-side (sentence extraction to target word limits). Will be replaced by real AI summarization when backend pipeline is live.
- **Moderator live feed:** Displays `summary_33` in real-time as responses arrive (3s polling). Fullscreen mode available.
- **CSV export:** Web_Results CSV includes Summary_333, Summary_111, Summary_33 columns alongside Detailed_Results.

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

> **CRS Alignment Note:** Cube 6 owns CRS-11 (live summarization + Phase B theming), CRS-12 (multi-provider AI + concurrency), CRS-13 (progressive theme reveal), and CRS-14 (CQS scoring). The two numbered broadcast gaps (CRS-11.03, CRS-11.04) are the primary SSSES Stability failures — no `summary_ready` or `themes_ready` event is sent to the dashboard. See SSSES Plan at end of this doc.

| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-11 | CRS-11.IN.SRS.011 | CRS-11.OUT.SRS.011 | **Complete** | Real-time theme streaming |
| CRS-11.01 | — | — | **Complete** | `summarize_single_response()` Phase A — live per-response 333→111→33 word summaries |
| CRS-11.02 | — | — | **Complete** | Summaries stored in MongoDB `summaries` collection with `response_id` reference |
| CRS-11.03 | — | — | **GAP — Task A5** | `summary_ready` Supabase broadcast after Phase A completes — not implemented. Dashboard falls back to client-side truncation. |
| CRS-11.04 | — | — | **GAP — Task B4** | `themes_ready` Supabase broadcast after Phase B completes — not implemented. Dashboard has no signal to transition to results view. |
| CRS-11.1 | — | — | **Complete** | Live 333/111/33 summarization per response |
| CRS-11.2 | — | — | **Complete** | Parallel marble sampling (10+ concurrent agents) |
| CRS-12 | CRS-12.IN.SRS.012 | CRS-12.OUT.SRS.012 | **Complete** | Multi-provider embedding comparison |
| CRS-12.01 | — | — | **Complete** | Factory failover order: openai → grok → gemini (skips providers without API keys) |
| CRS-12.02 | — | — | **Complete** | Per-provider pinned model version — `text-embedding-3-small`, `grok-embedding-beta`, `text-embedding-004` |
| CRS-12.03 | — | — | **Partial** | Per-session `asyncio.Semaphore(10)` concurrency cap on Phase A — not yet implemented (SSSES Task A3) |
| CRS-12.1 | — | — | **Complete** | Grok + Gemini provider implementations |
| CRS-12.2 | — | — | **Complete** | Factory with circuit breaker failover |
| CRS-13 | CRS-13.IN.SRS.013 | CRS-13.OUT.SRS.013 | **Complete** | Progressive theme reveal UX |
| CRS-13.01 | — | — | **Complete** | Phase B pipeline produces Theme01 + Theme2_9/6/3 with per-response confidence scores |
| CRS-13.02 | — | — | **Partial** | E2E verification against 5000-response dataset not yet run (SSSES Task B1) |
| CRS-13.03 | — | — | **Partial** | Monolith parity check (marble sampling, 65% threshold, Theme01 categories) — documented, not verified (SSSES Task B2) |
| CRS-14 | CRS-14.IN.SRS.014 | CRS-14.OUT.SRS.014 | **Partial** | CQS scoring (deferred to post-Cube 7) |
| CRS-14.01 | — | — | **Not implemented** | `score_cqs()` — 6-metric AI scoring on responses in #1 Theme2 cluster with >95% confidence |
| CRS-14.02 | — | — | **Not implemented** | `select_cqs_winner()` — highest composite CQS; random tie-break (seeded for determinism) |

### Cube 6 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube6/ -v --tb=short
```

**Test Suite:** 1 file, 9 test classes, 26 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_ai_service.py` | 9 | 26 | Unit tests (summarization, classification, grouping, sampling, parsing, factory) |

### Cube 6 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube6_ai/service.py` | 882 | Two-phase pipeline (Phase A live + Phase B parallel theming) |
| `cubes/cube6_ai/router.py` | 43 | 2 API endpoints (run pipeline, get themes) |
| `cubes/cube6_ai/providers/base.py` | 84 | EmbeddingProvider + SummarizationProvider ABCs |
| `cubes/cube6_ai/providers/factory.py` | 115 | Factory with circuit breaker failover |
| `cubes/cube6_ai/providers/openai_provider.py` | 84 | OpenAI embedding + summarization |
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
| `push_to_live_feed()` | **Not implemented — GAP** | Supabase broadcast of `summary_ready` (Phase A) and `themes_ready` (Phase B) to Moderator dashboard. See SSSES Tasks A5 + B4 in CUBES_1-3.md SSSES Plan. |

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

### Cube 6 — Simulation Requirements (Cube 10 Isolation)

> In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs and compares output metrics against the existing implementation baseline.

#### Input/Output Simulation Modes

| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| Collected response set | Input | Cube 4 (Collector) | **SIMULATED** | Mock collected responses from Cube 4 fixture store (28 responses across 4 sessions) |
| Pre-computed 33-word summaries | Input | MongoDB (Phase A) | **SIMULATED** | Fixture summaries pre-loaded — no live Phase A call required |
| Session config (ai_provider, theme2_voting_level, CQS weights) | Input | Cube 1 (Session) | **SIMULATED** | Fixed session config fixtures with known provider + voting level |
| Pipeline trigger event | Input | Cube 5 (Orchestrator) | **SIMULATED** | Mock trigger record with `pending` status — no real orchestrator |
| #1 most-voted Theme2 cluster | Input | Cube 7 (Ranking) | **SIMULATED** | Fixture cluster ID for CQS scoring eligibility |
| Embedding model config | Input | Provider factory | **BOTH** | LIVE when API keys present (calls real OpenAI/Grok/Gemini); SIMULATED with fixture 384-dim vectors when no keys |
| Random seed | Input | Cube 1 (session seed) | **SIMULATED** | Fixed seed (e.g., `random_state=42`) for deterministic clustering + marble sampling |
| Embedding API call | Internal | OpenAI / Grok / Gemini | **BOTH** | LIVE requires actual API key; SIMULATED returns pre-computed fixture vectors |
| Summarization API call | Internal | OpenAI / Grok / Gemini | **BOTH** | LIVE calls real LLM; SIMULATED returns fixture 333/111/33 summaries |
| 333/111/33 summaries | Output | MongoDB → Cube 4, Cube 9, Frontend | **SIMULATED** | Written to mock MongoDB collection |
| Theme01 assignments | Output | Postgres → Cube 7, Cube 9 | **SIMULATED** | Written to mock Postgres (in-memory) |
| Theme2_9/6/3 assignments | Output | Postgres → Cube 7, Cube 9 | **SIMULATED** | Written to mock Postgres (in-memory) |
| Theme records | Output | Postgres → Cube 7 (Ranking) | **SIMULATED** | Theme labels + descriptions stored in mock DB |
| CQS scores | Output | Postgres → Cube 8 (Tokens) | **SIMULATED** | Composite scores written to mock store |
| Replay hash | Output | Postgres → Cube 10 (Simulation) | **SIMULATED** | SHA-256 computed and compared against expected fixture hash |

#### Function Simulation Modes

| Function | Sim Mode | Simulation Behavior |
|----------|----------|---------------------|
| `summarize_single_response()` | **BOTH** | LIVE: calls AI API for 333→111→33 generation. SIMULATED: returns fixture summary from canned data (skips API call, instant return). |
| `translate_to_english()` | **BOTH** | LIVE: calls AI translation API. SIMULATED: returns pre-translated fixture text. |
| `classify_theme01()` | **BOTH** | LIVE: LLM classifies Risk/Supporting/Neutral with confidence. SIMULATED: returns fixture classification with known confidence values. |
| `reclassify_low_confidence()` | **SIMULATED** | Pure logic — identical in sim and production. Applies <65% → Neutral rule on fixture data. |
| `group_by_theme01()` | **SIMULATED** | Pure logic — identical in sim and production. Groups fixture responses into 3 partitions. |
| `marble_sample()` | **SIMULATED** | Pure logic with fixed seed — deterministic shuffle + slice. Identical output every run. |
| `generate_candidate_themes()` | **BOTH** | LIVE: 10+ concurrent LLM agents generate 3 themes per group. SIMULATED: returns fixture theme candidates per marble group. |
| `merge_candidate_themes()` | **SIMULATED** | Pure logic — combines fixture candidate themes per partition. |
| `reduce_themes()` | **BOTH** | LIVE: LLM reduces all→9→6→3. SIMULATED: returns fixture reduced theme set. |
| `assign_responses_to_themes()` | **BOTH** | LIVE: LLM or embedding cosine assignment. SIMULATED: returns fixture assignments with known confidence values. |
| `compute_replay_hash()` | **SIMULATED** | Pure logic — SHA-256 of inputs + parameters. Must match expected fixture hash for determinism verification. |
| `run_pipeline()` | **BOTH** | LIVE: full Phase B orchestration with real API calls. SIMULATED: runs full pipeline against fixture data with mock providers. |
| `batch_embed()` | **BOTH** | LIVE: calls embedding API (requires API key). SIMULATED: returns fixture 384-dim vectors from canned data. |
| `get_provider()` | **BOTH** | LIVE: factory with circuit breaker checks API key availability. SIMULATED: returns mock provider that serves fixture data. |
| `score_cqs()` | **BOTH** | LIVE: AI scores 6 metrics on #1 Theme2 cluster responses. SIMULATED: returns fixture CQS scores. |
| `select_cqs_winner()` | **SIMULATED** | Pure logic — highest composite CQS with random tie-break (seeded for determinism in sim). |
| `push_to_live_feed()` | **SIMULATED** | Mock WebSocket — no real connection. Logs push events for verification. |

#### Canned Test Data

| Data Type | Count | Description |
|-----------|-------|-------------|
| Mock collected responses | 28 | Aggregated from Cube 2/3 mock data across 4 sessions (7 per session) |
| Fixture embeddings | 28 | Pre-computed 384-dimensional vectors (one per response) |
| Fixture summaries (333-word) | 28 | English summaries for all mock responses |
| Fixture summaries (111-word) | 28 | Condensed summaries |
| Fixture summaries (33-word) | 28 | Ultra-condensed summaries used as embedding input |
| Fixture Theme01 classifications | 28 | Risk (8), Supporting (12), Neutral (8) with confidence scores |
| Fixture marble groups | 3 | One per Theme01 partition, deterministically sampled |
| Fixture candidate themes | 9 | 3 candidate themes per marble group (3 groups) |
| Fixture reduced themes (9/6/3) | 18 | 9 + 6 + 3 theme records with labels + descriptions |
| Fixture theme assignments | 84 | 28 responses x 3 levels (theme2_9, theme2_6, theme2_3) with confidence |
| Fixture CQS scores | 5 | Scores for responses in #1 Theme2 cluster with >95% confidence |
| Expected replay hash | 1 | SHA-256 hash for determinism verification against fixture inputs |

#### Simulation Pass Criteria

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Test pass rate | 100% (20/20) | All existing Cube 6 unit tests must pass |
| Theme accuracy | >= baseline | Theme01 classification accuracy against fixture ground truth |
| Theme determinism | Exact match | Same inputs + same seed must produce identical theme assignments |
| Replay hash match | Exact match | `compute_replay_hash()` output must match expected fixture hash |
| Pipeline latency | <= 30 seconds | Full Phase B pipeline for 1000 responses (LIVE mode only) |
| Summarization quality | >= baseline | 333/111/33 word counts within +/-10% of target |
| Marble sampling correctness | Exact match | Deterministic groups must match fixture groups for same seed |
| Confidence distribution | No regression | Average confidence across assignments must not decrease |
| Spiral regression | 0 failures | All 287 backend tests must continue passing |
| Bundle size | No regression | Frontend bundle sizes must not increase beyond baseline |

#### Spiral Test Reference

See `SPIRAL_METRICS.md` — N=9 (Feb 26). Cube 6 tests: 20/20 pass, average backend duration 5,660ms (full suite including Cubes 1-6).

---

## SSSES Plan — Cubes 4–6: Collect → Orchestrate → Summarize → Theme

> **Scope:** Full pipeline from response collection (CRS-09 / Cube 4) through gateway orchestration (CRS-11 / Cube 5) to live summarization and parallel theming (CRS-11→14 / Cube 6). Connects directly to the CRS-07→09 plan in CUBES_1-3.md — this doc covers the Cube 4-6 slice of the same pipeline.
> **Primary driver:** The broken broadcast chain means `summary_33` and `themes_ready` never reach the Moderator dashboard. The trigger chain (Cube 1 → Cube 5 → Cube 6 Phase B) is wired; the result broadcast chain (Cube 6 → Supabase → Dashboard) is the missing link.

### DesignMatrix CRS Alignment Note (Cubes 4-6)

> **Discrepancy between DesignMatrix and Requirements.txt CRS numbering:**
> | CRS | Requirements.txt | DesignMatrix (eXeL-AI_Polling_DesignMatrix.xlsx) |
> |-----|---|---|
> | CRS-09 | System clusters responses into AI themes (Cube 6) | Voice submission (Cube 3) |
> | CRS-10 | User views summarized themes | System clusters via AI |
> | CRS-11 | Response collection + aggregation (Cube 4) | AI theming / theme streaming |
> | CRS-12 | Time tracking / token calculation (Cube 5) | Multi-provider embedding |
>
> **Resolution:** Requirements.txt is canonical. This file's CRS tables use Requirements.txt numbering. The DesignMatrix xlsx should be updated. All code, tests, and CI reference Requirements.txt mapping.

---

### SSSES Scores — Current State (2026-03-30)

| Cube | Security | Stability | Scalability | Efficiency | Succinctness | Overall |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **4 Collector** | 70 | 65 | 75 | 70 | 80 | **72** |
| **5 Gateway** | 80 | 75 | 80 | 85 | 90 | **82** |
| **6 AI Pipeline** | 70 | 40 | 55 | 55 | 70 | **58** |

---

### SSSES Audit (2026-03-30) — Per-Cube Findings

#### Cube 4 — Response Collector

| Pillar | Score | Gap | Finding |
|--------|:---:|---|---|
| Security | 70 | No RLS verification on `push_to_live_feed()` path | Broadcast path not implemented — no security boundary test. When CRS-09.03 is implemented, must verify only `clean_text` flows to broadcast, never raw. |
| Stability | 65 | No retry on MongoDB write failure; M2/M3 flow absent | `store_to_mongodb()` is fire-and-forget with no retry. Methods 2 & 3 (`desired_outcome`, `confirmation_gate`) not implemented — partial sessions leave no outcome record. |
| Scalability | 75 | No backpressure signal to ingestion | Redis presence tracking implemented; pagination correct. No cap on simultaneous MongoDB writes at burst load. No Supabase broadcast from Cube 4 itself. |
| Efficiency | 70 | Dual write is correct but no batching | Single-document MongoDB writes per response (not batched). At 1000+ responses, 1000 individual writes where batch would reduce overhead. |
| Succinctness | 80 | 3 unimplemented stubs inflate function table | `create_desired_outcome()`, `record_confirmation()`, `log_post_task_results()` are stubs with no body — clean but inflated LOC count. |

#### Cube 5 — Gateway / Orchestrator

| Pillar | Score | Gap | Finding |
|--------|:---:|---|---|
| Security | 80 | Pipeline trigger status not row-level gated | `GET /pipeline/status/{session_id}` endpoint returns trigger details — should verify requesting user is Moderator for that session (not just authenticated). |
| Stability | 75 | No dead-letter queue; no trigger retry backoff | `asyncio.create_task(run_pipeline())` — if Cube 6 raises, the exception is absorbed. `PipelineTrigger` status can be stuck at `in_progress` forever. No automatic re-trigger. Task B5 covers recovery. |
| Scalability | 80 | Single `asyncio.create_task()` per session; no queue depth limit | Works at current scale. At 100+ simultaneous sessions closing polling, 100 concurrent Phase B pipelines fire simultaneously. No back-pressure or queue depth guard. |
| Efficiency | 85 | Token calc is fast; trigger adds minimal overhead | `calculate_tokens()` is pure math + dict lookup — sub-millisecond. Orchestration overhead is a single Postgres insert + one `asyncio.create_task()`. No unnecessary polling. |
| Succinctness | 90 | Tight, clean separation; `process_join_payment()` stub | Time tracking and orchestrator are cleanly separated services. Only blemish: `process_join_payment()` + `create_payment_checkout()` are empty stubs that should be removed or flagged with TODO. |

#### Cube 6 — AI Theme Pipeline

| Pillar | Score | Gap | Finding |
|--------|:---:|---|---|
| Security | 70 | Voice path PII gate unverified | Text path verified (`clean_text` → `summarize_single_response()`). Voice path (Cube 3 → Cube 2 pipeline) uses same `clean_text` field but no structured log confirms PII scrub at entry to Phase A. Task A7 adds assertion. |
| Stability | 40 | No broadcast; no retry; Phase B unverified E2E | Three compounding gaps: (1) `summary_ready` never broadcast (CRS-11.03); (2) Phase A has no retry on AI failure; (3) Phase B has never been run against a live 5000-response dataset. Lowest Stability score in Cubes 1-6. |
| Scalability | 55 | No concurrency cap on Phase A; Phase B unverified at scale | 100 concurrent submits → 100 uncapped AI calls via `asyncio.create_task()`. Phase B `asyncio.gather()` exists but batch classification at 5000 responses unconfirmed. Task A3 (Semaphore) + Task B3 (parallel verify) fix this. |
| Efficiency | 55 | 3 sequential AI round-trips; fallback shown instead of AI output | `summarize_single_response()` makes 3 sequential API calls. Single structured JSON prompt would halve round-trips (Task A1). No broadcast = dashboard always shows client-side truncation fallback. |
| Succinctness | 70 | `push_to_live_feed()` is an empty stub; `score_cqs()` + `select_cqs_winner()` not implemented | 3 documented functions with no implementation. `push_to_live_feed()` should either be implemented (Task A5) or removed and replaced by the direct `supabase_broadcast.py` call inside `summarize_single_response()`. |

---

### Business Rules — Cubes 4–6 (shared with Cubes 1–3; canonical definitions in CUBES_1-3.md)

| # | Rule | Enforced In | Cube 4-6 Impact |
|---|------|-------------|-----------------|
| BR-1 | **Short-circuit ≤33 words:** If `clean_text` word count ≤ 33, set `summary_33 = clean_text`. No AI call. | Cube 6 `summarize_single_response()` — check at function entry before any provider call | Cube 4: no impact (passthrough). Cube 5: no impact (orchestrator). Cube 6: reduces Phase A AI calls for short responses to zero; Task A0 implements. |
| BR-2 | **Live feed <100ms:** New responses appear in Moderator feed within 100ms of Supabase Broadcast receipt. | Cube 1 dashboard render path | Cube 6: `summary_ready` broadcast is async — arrives later, does not affect BR-2. Cube 4/5: no impact. |
| BR-3 | **English default:** Non-English `clean_text` translated to English before summarization. All summaries stored in English. | Cube 6 `summarize_single_response()` — translation step before 333-word compression | Cube 6: already implemented in `_SUMMARIZE_INSTRUCTION` template. Cube 4: `response_language` preserved in collected response for audit trail. |
| BR-4 | **Feed content:** Live feed shows only `clean_text` OR `summary_33` — never both, never 333/111 tiers. | Cube 1 dashboard toggle | Cube 4: CSV export (Cube 9) includes all tiers. Cube 6: all three summary tiers still generated and stored for downstream use. |

---

### Gap Analysis — Cubes 4–6

#### GAP C4-1 — No Live Broadcast from Cube 4 *(Stability −10, Efficiency −10)*
**Root cause:** `aggregate_response()` in Cube 4 writes to Postgres + MongoDB but emits no Supabase broadcast. The Cube 2 side (`emit_submission_event()`) is the broadcast origin — Cube 4 is a passive store.
**Fix:** CRS-09.03 is informational — the broadcast fix is in Cube 6 Phase A (Task A5). Cube 4 does not need its own broadcast, but it must confirm aggregation succeeds before Cube 6 can safely reference `response_id` in its broadcast.

#### GAP C4-2 — Methods 2 & 3 Confirmation Flow Missing *(Stability −20)*
**Root cause:** `create_desired_outcome()`, `record_confirmation()`, `check_all_confirmed()`, and `log_post_task_results()` are all stubs. The `desired_outcomes` and `presence_tracking` tables exist but the confirmation gate signal to Cube 5 is never sent.
**Fix (CRS-10.01–10.03):** Implement all four functions. Wire `check_all_confirmed()` result to fire `gate_opened_at` update and send signal to Cube 5 `confirmation_gate` trigger.

#### GAP C5-1 — Pipeline Error Propagation Broken *(Stability −15)*
**Root cause:** `trigger_ai_pipeline()` calls `asyncio.create_task(run_pipeline(...))`. If `run_pipeline()` raises inside the background task, the exception is swallowed. `PipelineTrigger.status` stays `in_progress` until manually reset.
**Fix (Task B5 / CRS-09.03):** Wrap `run_pipeline()` in a try/except inside the background task coroutine. On failure: call `update_pipeline_status(session, trigger_id, "failed", error_message=str(e))`. Add `GET /api/v1/sessions/{id}/ai/status` endpoint for Moderator to see stage + error. Allow idempotent re-trigger.

#### GAP C5-2 — Pipeline Status Route Not Moderator-Scoped *(Security −10)*
**Root cause:** `GET /api/v1/pipeline/{session_id}/status` uses `get_current_user` but does not check that the requesting user is the Moderator for that specific session. Any authenticated user can view any session's pipeline trigger metadata.
**Fix:** Add `require_moderator_for_session(session_id, current_user)` guard to pipeline status and retry routes.

#### GAP C6-1 — Phase A Broadcast Missing — Primary Pipeline Break *(Stability −30, Efficiency −25)*
**Root cause:** `summarize_single_response()` completes and stores in MongoDB — then returns silently. No event is broadcast. The dashboard has no `summary_ready` listener. This is the same root cause as GAP 1 in CUBES_1-3.md.
**Fix (Tasks A5 + A6):** See CUBES_1-3.md SSSES Plan. Short summary: add `core/supabase_broadcast.py` helper, call after Phase A stores, add `summary_ready` listener in `dashboard/page.tsx`.

#### GAP C6-2 — Phase B Broadcast Missing *(Stability −10)*
**Root cause:** `run_pipeline()` completes and returns results — but no `themes_ready` event is broadcast. The dashboard does not know when to transition from "Processing..." to the results view.
**Fix (Task B4):** After Phase B stores all theme records + assignments, broadcast `{"event": "themes_ready", "session_id": "...", "theme_count": N}` via `supabase_broadcast.py`. Gate: only fires on full success.

#### GAP C6-3 — Phase B E2E Verification Absent *(Stability −10)*
**Root cause:** Phase B code is implemented but has never been run against a real 5000-response dataset with live AI providers. No confirmed output schema match against `Updated_Web_Results_With_Themes_And_Summaries_v03.csv`.
**Fix (Task B1 + B2):** Load `Web_Results_5000.csv` into a test session. Run `POST /ai/run`. Verify Postgres `themes` table, MongoDB per-response theme fields, and `replay_hash` all populate correctly. Cross-check marble sampling and confidence threshold against `eXeL-AI_Polling_v04.2.py` monolith.

---

### Spiral Code Audit — New Gaps Found (2026-03-30)

> Evidence-based findings from forward (Cube 4→5→6) and backward (Cube 6→1) code-level audit. Line numbers reference commit `530c6fb`.

#### GAP C4-3 — No MongoDB Error Handling in Aggregation *(Stability −10)*
**Root cause:** `get_collected_responses()` in `cube4_collector/service.py` calls `mongo.responses.find_one()` (lines 109, 185) and `mongo.summaries.find_one()` (line 228) with no try/except. If MongoDB is unavailable, exception propagates uncaught — no fallback, no partial results.
**Evidence:** Lines 152-164 fall back to empty strings for missing summaries but log nothing. Moderator has no indication summaries are incomplete.
**Fix (Task C4-3):** Wrap MongoDB queries in try/except; log `cube4.mongo.query_failed` with response_id; return partial result with `summary_status: "unavailable"` flag.

#### GAP C4-4 — User Anonymization Collision Risk *(Security −5)*
**Root cause:** `cube4_collector/service.py` line 133: anonymous user label uses `f"User_{str(participant.id)[:8]}"` — only first 8 chars of UUID. At 10,000+ participants, birthday-problem collision probability rises.
**Fix (Task C4-4):** Use `anon_hash` from Cube 2 (SHA-256 based) instead of UUID prefix truncation. Already available in TextResponse model.

#### GAP C5-3 — No Timeout on Background Pipeline Task *(Scalability −15)*
**Root cause:** `_run_pipeline_background()` in `cube5_gateway/service.py` (lines 368-410) calls `run_pipeline()` with no `asyncio.wait_for()` wrapper. If Cube 6 hangs on an AI API call (provider timeout, network partition), the PipelineTrigger stays `in_progress` forever. No watchdog.
**Evidence:** Lines 397-404 catch exceptions but a hung coroutine never raises — it just blocks.
**Fix (Task C5-3):** Wrap `run_pipeline()` in `asyncio.wait_for(run_pipeline(...), timeout=300)`. On `asyncio.TimeoutError`: update trigger status to `"failed"`, error_message `"Pipeline timed out after 300s"`.

#### GAP C5-4 — No Automatic Chain Cube 6 → Cube 7 *(Stability −10)*
**Root cause:** After `run_pipeline()` completes in Cube 6, there is no call to `trigger_ranking_pipeline()` from Cube 5. `trigger_ranking_pipeline()` (line 422) exists as a placeholder that creates a trigger record but is never invoked after Phase B.
**Evidence:** Cube 7 is never automatically triggered. The chain breaks after Cube 6.
**Fix (Task C5-4):** After successful Phase B completion in `_run_pipeline_background()`, call `trigger_ranking_pipeline(session)`. Ranking pipeline implementation deferred, but the trigger chain must be wired.

#### GAP C6-4 — No Timeout on AI API Calls *(Scalability −15)*
**Root cause:** `summarizer.summarize()` and `embedder.embed()` calls in `cube6_ai/service.py` (lines 95-112 Phase A, lines 571-639 Phase B) have no `asyncio.wait_for()`. A single hung API call blocks the entire pipeline.
**Fix (Task C6-4):** Wrap all provider API calls in `asyncio.wait_for(call, timeout=30)`. On timeout: log `cube6.provider.timeout` with provider name; if Phase A, fall back to `summary_33 = "[Summary timed out]"`; if Phase B, fail the pipeline via C5-1 error propagation.

#### GAP C6-5 — Non-Atomic Cross-DB Write in _store_results() *(Stability −10)*
**Root cause:** `_store_results()` (lines 646-749) writes Theme records to Postgres (lines 662-696) then updates MongoDB summaries (lines 712-728) separately. If MongoDB update fails after Postgres commit, theme records exist in Postgres but per-response theme fields are missing from MongoDB — data inconsistency.
**Fix (Task C6-5):** Add try/except around MongoDB batch update. On failure: log `cube6.store.mongo_partial_failure`, mark pipeline trigger with `"completed_partial"` status. Do not roll back Postgres themes — they are still valid for Cube 7 ranking.

#### GAP C6-6 — _assign_themes_llm() Index Mismatch Risk *(Stability −5)*
**Root cause:** `_assign_themes_llm()` (lines 506-568) manually tracks `result_idx` to match batch summarize outputs to responses. If `batch_summarize()` returns fewer results than expected (provider truncation, rate limit), index skips responses or crashes with IndexError.
**Fix (Task C6-6):** Replace manual index tracking with `zip(responses, results)`. Log count mismatch as `cube6.assign.count_mismatch` if `len(results) != len(responses)`.

#### GAP C6-7 — `core/supabase_broadcast.py` Does Not Exist *(Stability −20, Infrastructure)*
**Root cause:** The broadcast helper file referenced by Tasks A5, B4, and all live feed work does not exist at `backend/core/supabase_broadcast.py`. This is the foundational infrastructure gap blocking all realtime delivery from backend to frontend.
**Evidence:** `ls backend/core/supabase_broadcast.py` returns "No such file". Backend `.env` has `SUPABASE_URL` and `SUPABASE_KEY` — credentials exist but no code uses them for broadcast.
**Fix (Task C6-7 — prerequisite for A5):** Create `core/supabase_broadcast.py` using `supabase-py` client. Functions: `broadcast_event(channel, event, payload)` with async context, service-role key auth. Guard: log warning + continue on Supabase failure (A5.01 availability pattern).

#### GAP C6-8 — `ResponseRead` Schema Missing `summary_33` *(Efficiency −10, Succinctness −5)*
**Root cause:** `backend/app/schemas/response.py` `ResponseRead` (lines 50-60) has no `summary_33` field. Frontend `session-view.tsx` line 712 type-asserts `(result as { summary_33?: string })?.summary_33` — always `undefined`. Dashboard always falls back to client-side `summarizeTo33Words()`.
**Evidence:** Backend `submit_text_response()` return dict (lines 650-666) has no `summary_33` key. Confirmed by schema audit.
**Fix (Task A4):** Add `summary_33: str | None = None` to `ResponseRead`. Note: field will be `None` at submit time since Phase A is async. Real value arrives via `summary_ready` broadcast (Task A5).

---

### Backward Audit — Cube 6 → Cube 1 (2026-03-30)

Tracing each inter-cube link backwards from Cube 6 output to Cube 1 input to find integration gaps and broken wires.

#### Link 6 → 5: Phase B Trigger Chain
```
Cube 1 state machine → _transition_and_return() → orchestrate_post_polling() [Cube 5]
    → trigger_ai_pipeline() → asyncio.create_task(run_pipeline()) [Cube 6 Phase B]
```
**Status: WIRED — but fragile.**
- `_transition_and_return()` in Cube 1's session router directly imports and calls Cube 5 service — tight coupling. Acceptable for MVP; decouple to event bus for production.
- `asyncio.create_task()` fires and forgets. No error propagates to `PipelineTrigger.status` on failure. See GAP C5-1.
- `trigger_metadata["total_responses"]` is set by Cube 5 from a count query at transition time — not from Cube 4's authoritative `get_response_count()`. If responses arrive during the transition window (race condition), count may be off by 1–3.

#### Link 6 → 4: Response Fetch for Phase B
```
run_pipeline() [Cube 6] → get_response_set() [Cube 4] → Postgres JOIN (ResponseMeta + Questions + Participants)
```
**Status: WIRED — with unverified PII assumption.**
- Cube 6 receives `final_text` from Cube 4's collected response set and passes it directly to embedding + theme classification.
- No check that `pii_scrubbed = True` on each ResponseMeta record before passing to AI. If a response entered via a path that bypassed Cube 2's PII pipeline (e.g., direct DB insert in dev), raw PII could reach the AI provider.
- **Recommendation:** Add `assert response.pii_scrubbed is True` guard (or filter) at top of `run_pipeline()`. Log and skip any response where flag is False.

#### Link 6 → 3 / 6 → 2: Phase A Fire-and-Forget Path
```
Cube 2 submit_text_response() → asyncio.create_task(summarize_single_response())
Cube 3 voice transcript → Cube 2 pipeline → same path
```
**Status: TEXT PATH — WIRED. VOICE PATH — UNVERIFIED.**
- Text path: `clean_text` is passed to Phase A after PII scrub in `submit_text_response()`. Confirmed in code review.
- Voice path: Cube 3 transcripts flow through Cube 2's `submit_text_response()` after being processed through the text pipeline. The `summarize_single_response()` call would fire — but there is no test confirming this end-to-end.
- **Task A7** adds a log assertion at Phase A entry for both paths and a test fixture with injected PII confirming it never reaches the AI provider.

#### Link 5 → 4: Collected Response Count for Pipeline Metadata
```
orchestrate_post_polling() [Cube 5] → session.query(ResponseMeta).count()
```
**Status: PARTIALLY WIRED — stale count risk.**
- Cube 5 queries the DB for `total_responses` at transition time and stores in `trigger_metadata`.
- This count is used for observability and pipeline metadata — not for actually fetching responses (Cube 6 re-queries via Cube 4).
- Race window: responses submitted in the ~200ms between `polling → ranking` transition and the `asyncio.create_task()` call may not be included in `total_responses` metadata.
- **Low risk for MVP** (metadata only). Flag for production: use Cube 4's `get_response_count()` result instead of a separate query.

#### Link 5 → 1: Session State Machine Hook
```
Cube 1 _transition_and_return() imports cube5_gateway.service.orchestrate_post_polling
```
**Status: WIRED — direct import creates tight coupling.**
- Works correctly. Direct import means Cube 5 service must be importable from Cube 1 router at startup.
- **Recommendation for production:** Replace direct import with an event bus (Redis pub/sub) so Cube 1 fires a `session_state_changed` event and Cube 5 subscribes. Decouples the cubes; enables horizontal scaling where Cube 1 and Cube 5 may run in different workers.
- **For MVP:** Current direct-import pattern is acceptable. Document as tech debt.

#### Link 4 → 2 / 4 → 3: Mixed Text + Voice Collection
```
Cube 2 / Cube 3 → ResponseMeta (source_type: text/voice) → Cube 4 aggregate_response()
```
**Status: SCHEMA WIRED — combined path untested.**
- `aggregate_response()` uses `source_type` enum to handle both text and voice. The JOIN logic handles both paths.
- No test covers a session where both text and voice responses exist (mixed session). Aggregation correctness for mixed sessions is assumed but unverified.
- **Recommendation:** Add a mixed-session fixture (14 responses: 10 text + 4 voice) to Cube 4 E2E tests.

#### Link 4 → Frontend: Live Feed Push
```
Cube 4 aggregate_response() → [NO BROADCAST] → Dashboard
```
**Status: BROKEN — no Cube 4 → Dashboard path.**
- The `new_response` broadcast is fired by the participant client (session-view.tsx) peer-to-peer, not by the backend. This is by design for latency.
- The `summary_ready` broadcast must come from Cube 6 Phase A via backend (Task A5) — Cube 4 is not responsible for this.
- **No action required** for Cube 4 specifically. The live feed gap is owned by Cube 6 (Tasks A5, B4).

---

### Backward Audit Summary

| Link | Direction | Status | Action Required |
|------|-----------|--------|----------------|
| Cube 6 Phase B → Cube 5 trigger | Backward | WIRED but fragile | GAP C5-1: add error propagation + dead-letter |
| Cube 6 Phase B → Cube 4 response fetch | Backward | WIRED, PII unverified | Add `pii_scrubbed` guard in `run_pipeline()` |
| Cube 6 Phase A → Cube 2 text path | Backward | WIRED | Confirmed clean |
| Cube 6 Phase A → Cube 3 voice path | Backward | UNVERIFIED | Task A7: add log assertion + test |
| Cube 6 → Dashboard (broadcast) | Backward | **BROKEN** | Tasks A5 (Phase A) + B4 (Phase B) |
| Cube 5 orchestrator → Cube 1 state hook | Backward | WIRED, tight coupling | Document as tech debt; decouple to event bus post-MVP |
| Cube 5 pipeline status route | Backward | SECURITY GAP | GAP C5-2: add Moderator-scoped row guard |
| Cube 4 → Cube 5 all-confirmed signal | Backward | NOT IMPLEMENTED | CRS-10.01–10.03: M2/M3 confirmation gate |
| Cube 4 → Cube 2/3 mixed session collect | Backward | UNTESTED | Add mixed-session fixture to Cube 4 E2E tests |

---

### Integration Tasks — Cubes 4–6

> Tasks A0–A7 and B1–B5 are defined in CUBES_1-3.md SSSES Plan. The tasks below are Cubes 4–6 specific additions. Task A0 is included here because it executes in Cube 6 code.

| Task | File | Change | SSSES Impact |
|------|------|--------|---|
| **A0** Short-circuit ≤33 words (BR-1) | `cube6_ai/service.py` | At entry of `summarize_single_response()`: if `len(clean_text.split()) <= 33`, set `summary_333 = summary_111 = summary_33 = clean_text`, store in MongoDB, skip all AI calls. Zero latency, zero cost. | Efficiency +5 |
| **C4-1** Mixed-session test fixture | `tests/cube4/test_e2e_flows.py` | Add E2E test with 10 text + 4 voice responses in same session. Verify `aggregate_response()` returns correct `source_type` breakdown and total count. | Stability +10 |
| **C4-2** Confirm aggregation before Phase A broadcast | `cube4_collector/service.py` | Return aggregated `response_id` from `aggregate_response()` — used by Cube 6 Task A5 to reference the correct Postgres record in the `summary_ready` broadcast payload. | Stability +5 |
| **C5-1** Phase B error propagation | `cube5_gateway/service.py`, `cube6_ai/service.py` | Wrap `run_pipeline()` in try/except inside background task. On exception: call `update_pipeline_status(session, trigger_id, "failed", error_message=str(e))`. See Task B5 in CUBES_1-3.md. | Stability +15 |
| **C5-2** Moderator-scoped pipeline status route | `cube5_gateway/router.py` | Add `require_moderator_for_session(session_id, current_user)` guard to `GET /pipeline/{session_id}/status` and `POST /pipeline/{session_id}/retry`. | Security +10 |
| **C6-1** PII guard in `run_pipeline()` | `cube6_ai/service.py` | At top of `run_pipeline()`, filter `collected_responses` to only include records where `pii_scrubbed = True`. Log count of filtered-out records with `cube6.phase_b.pii_filtered` metric. | Security +15 |
| **C6-2** `trigger_metadata` count from Cube 4 | `cube5_gateway/service.py` | Replace inline `session.query(ResponseMeta).count()` with call to Cube 4's `get_response_count(session_id)` at transition time. Eliminates race-window stale count. | Stability +5, Succinctness +5 |
| **C4-3** MongoDB error handling | `cube4_collector/service.py` | Wrap `mongo.responses.find_one()` and `mongo.summaries.find_one()` in try/except. On failure: log `cube4.mongo.query_failed`, return partial result with `summary_status: "unavailable"`. | Stability +10 |
| **C4-4** Fix anonymization collision | `cube4_collector/service.py` | Replace `str(participant.id)[:8]` truncation with Cube 2's SHA-256 `anon_hash` for anonymous user labels. | Security +5 |
| **C5-3** Pipeline timeout | `cube5_gateway/service.py` | Wrap `run_pipeline()` in `asyncio.wait_for(timeout=300)`. On `TimeoutError`: update trigger to `"failed"` with timeout message. | Scalability +15 |
| **C5-4** Wire Cube 6 → Cube 7 chain | `cube5_gateway/service.py` | After successful Phase B in `_run_pipeline_background()`, call `trigger_ranking_pipeline(session)`. Ranking implementation deferred but trigger chain must be wired. | Stability +10 |
| **C6-4** AI API call timeout | `cube6_ai/service.py` | Wrap all `summarizer.summarize()` and `embedder.embed()` calls in `asyncio.wait_for(timeout=30)`. On timeout: log `cube6.provider.timeout`; Phase A falls back to `"[Summary timed out]"`. | Scalability +15 |
| **C6-5** Partial failure handling in _store_results() | `cube6_ai/service.py` | Add try/except around MongoDB batch update after Postgres commit. On failure: log `cube6.store.mongo_partial_failure`, mark trigger `"completed_partial"`. | Stability +10 |
| **C6-6** Fix index mismatch in _assign_themes_llm() | `cube6_ai/service.py` | Replace manual `result_idx` tracking with `zip(responses, results)`. Log count mismatch if `len(results) != len(responses)`. | Stability +5 |
| **C6-7** Create `core/supabase_broadcast.py` | `backend/core/supabase_broadcast.py` (NEW) | Create broadcast helper using `supabase-py` + service role key. Functions: `broadcast_event(channel, event, payload)`. Guard: log warning + continue on failure. **Prerequisite for Tasks A5, B4.** | Stability +20 (infrastructure) |
| **C6-8** = Task A4 (schema) | `schemas/response.py` | Add `summary_33: str \| None = None` to `ResponseRead`. Enables frontend to read field from API response (will be `None` at submit; real value via A5 broadcast). | Efficiency +10, Succinctness +5 |

---

### Projected SSSES Scores After All Tasks (Cubes 4–6)

> Scores revised 2026-03-30 based on spiral code audit. Includes new gaps C4-3/C4-4, C5-3/C5-4, C6-4→C6-8.

| Cube | Pillar | Before | After | Key Tasks |
|------|--------|:---:|:---:|---|
| **4 Collector** | Security | 70 | 90 | C4-1, C4-2, C4-4 |
| | Stability | 65 | 90 | C4-1, C4-2, C4-3, CRS-10.01–10.03 |
| | Scalability | 75 | 85 | C4-2 (aggregation completeness) |
| | Efficiency | 70 | 80 | C4-2 (reduces redundant queries) |
| | Succinctness | 80 | 85 | Remove unimplemented stubs once implemented |
| | **Overall** | **72** | **86** | |
| **5 Gateway** | Security | 80 | 90 | C5-2 |
| | Stability | 75 | 95 | C5-1, C5-4, B5 |
| | Scalability | 80 | 95 | C5-3 (timeout), C6-2 |
| | Efficiency | 85 | 90 | C6-2 (remove redundant query) |
| | Succinctness | 90 | 95 | Remove empty payment stubs |
| | **Overall** | **82** | **93** | |
| **6 AI Pipeline** | Security | 70 | 95 | A7, C6-1 |
| | Stability | 40 | 95 | A2, A5, B1, B2, B4, B5, C5-1, C6-5, C6-6, C6-7 |
| | Scalability | 55 | 95 | A3, B3, C6-4 (API timeout) |
| | Efficiency | 55 | 95 | A0, A1, A5, A6, C6-8 |
| | Succinctness | 70 | 90 | A4, implement broadcast via A5 |
| | **Overall** | **58** | **94** | |

---

### Execution Order (Cubes 4–6)

```
PHASE 1 — Infrastructure + Security (unblocks everything else):
  C6-7 (create supabase_broadcast.py) → C6-1 (PII guard) → A7 (PII log assertion) → C4-4 (anon hash fix)

PHASE 2 — Live Feed Pipeline (Moderator sees responses + summaries):
  C6-8/A4 (schema: summary_33) → A0 (short-circuit ≤33 words) → A1 (single-prompt) → A2 (retry)
  → A5 (backend broadcast) → A6 (dashboard summary_ready listener)

PHASE 3 — Resilience + Scale:
  A3 (semaphore) → C5-3 (pipeline timeout) → C6-4 (AI API timeout) → C5-1 (error propagation)
  → C5-2 (Moderator route guard) → C4-3 (MongoDB error handling)

PHASE 4 — Phase B Theming + Downstream Chain:
  B2 (parity check) → B1 (E2E verify) → B3 (parallel batch) → C6-5 (partial failure)
  → C6-6 (index mismatch) → B4 (themes_ready broadcast) → B5 (recovery) → C5-4 (Cube 6→7 chain)

PHASE 5 — Tests + Quality:
  C4-1 (mixed session test) → C4-2 (aggregate response_id) → C6-2 (count from Cube 4)

PARALLEL TRACK (independent of broadcast chain):
  CRS-10.01–10.03 (M2/M3 confirmation gate)
```
