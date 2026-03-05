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
