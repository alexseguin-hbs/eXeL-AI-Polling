# Cubes 1-3: Session, Text, Voice — Implementation Details

> **Parent doc:** See `CLAUDE.md` for system architecture, inter-cube dependencies, and infrastructure.

---

## Cube 1 — Session Join & QR: IMPLEMENTED (CRS-01→CRS-06 done; ~75% of full spec)

**Code location:** `backend/app/cubes/cube1_session/` (modular, self-contained)

### Cube 1 — Implemented
- **Session CRUD:** create, get by ID/short_code, update (draft-only), list with pagination + filters
- **State machine:** draft → open → polling → ranking → closed → archived (with timestamp tracking)
- **QR code generation:** PNG + base64 JSON endpoints
- **Short code:** 8-char generation with 5-attempt collision retry + DB uniqueness check
- **Participant join:** anonymous + identified support, duplicate join detection, Redis presence tracking
- **Question management:** CRUD with cycle_id for multi-round support
- **Session expiry:** 24h default, `SessionExpiredError` (410 Gone), QR blocked for expired/closed
- **Time tracking integration:** Auto-login entry calls Cube 5 `create_login_time_entry()` → awards ♡1 token on join
- **Determinism:** UUID5 seed, replay hash verification endpoint
- **Security (CRS-01→CRS-04):**
  - CRS-01: Literal type validation on all enum fields (422 on invalid input), session ownership enforcement (403)
  - CRS-02: Anonymous join via `get_optional_current_user()` — no Bearer token required
  - CRS-03: Short code collision retry (5 attempts with DB uniqueness check)
  - CRS-04: `expires_at` field (default 24h), `SessionExpiredError` (410 Gone), QR blocked for expired/closed
- **API endpoints:** 22 routes (session CRUD, state transitions, join, participants, presence, questions, QR, verification)
- **Rate limiting:** 100/min on join endpoint

### Cube 1 — Newly Implemented (Phase 1-7 completion, 2026-02-18)
- **Session model extended:** 15 new columns — `session_type`, `polling_mode`, `pricing_tier`, `max_participants`, `fee_amount_cents`, `cost_splitting_enabled`, `reward_enabled`, `reward_amount_cents`, `cqs_weights` (JSONB), `theme2_voting_level`, `live_feed_enabled`, `polling_mode_type`, `static_poll_duration_days`, `ends_at`, `timer_display_mode`
- **Participant model extended:** 3 new columns — `language_code`, `results_opt_in`, `payment_status`
- **Capacity enforcement:** `check_capacity()` — rejects join with 409 when session is full
- **CQS weight config:** Moderator sets 6-metric CQS weights at session creation (stored as JSONB)
- **Frontend — Moderator Dashboard:** Session creation with full config, QR code display (inline + presentation mode), state transition controls, participant counter
- **Frontend — Token HUD:** Pill badges in navbar (◬ Cyan, ♡ Sunset, 웃 Violet) with gaming animations (tick-up, float-up +1, pulse)
- **Frontend — Timer Context:** React context for session timer + token accrual (1 ♡/min, 5x ◬ multiplier)
- **Frontend — Voice Input Stub:** Browser MediaRecorder API, pulsing red dot indicator, audio blob capture (STT pending Cube 3)
- **Frontend — Cube Architecture Status Panel:** 3x3 grid in Settings with RAG+ color coding per cube
- **Frontend — One-Question-at-a-Time UX:** Full-width textarea, Submit & Next, progress bar, token earn overlay

### Cube 1 — Newly Implemented (Static Poll Countdown Timer, 2026-02-25)
- **Session model extended:** 4 new columns — `polling_mode_type` (live_interactive/static_poll), `static_poll_duration_days` (1/3/7), `ends_at` (computed deadline), `timer_display_mode` (day/flex/both)
- **Schema fields:** Added to SessionCreate (Literal validation), SessionRead (defaults), SessionJoinResponse (string ends_at)
- **Service logic:** `create_session()` accepts 3 new params; `transition_session()` computes `ends_at = now + N days` when transitioning to polling for static polls
- **Frontend — PollCountdownTimer:** SVG concentric-ring countdown with multi-stage phases (days→hours→minutes→seconds), futuristic accent glow, gradation lines (3rds for 3-day, 7ths for 7-day, 60ths for hours/minutes/seconds)
- **Frontend — Simulation Duration Selector:** 4 user-selectable durations (2 Day, 0.5 Day, 0.5 Hour, 0.5 Min) for testing countdown at different phases
- **Frontend — Live/Static Session Card Badges:** Theme-reactive Radio/Timer icons on dashboard session cards showing polling mode
- **Frontend — Static Poll Moderator Controls:** Start Ranking/Close buttons hidden for static polls (auto-close at deadline); yellow deadline banner shows end date/time
- **Frontend — Polling Status Bar:** Active step (Feedback) now green with pulse animation during polling mode
- **Frontend — Input Complete Button:** Last-question submit button shows "Input Complete" with CheckCircle icon
- **Frontend — 4th Mock Session:** "Team Innovation Challenge" — static_poll in polling state with 3-day countdown
- **Backend Tests:** 4 new tests — static poll field persistence, ends_at computation, live poll no-ends_at, default timer mode
- **Lexicon:** 16 new keys × 32 languages = 512 new translations (timer phases, display modes, sim duration, Live/Static badges)

### Cube 1 — Partially Implemented (fields exist but incomplete logic)
- **Payment flow:** `is_paid` + `stripe_session_id` exist but no Stripe integration in join
- **Cost splitting:** `cost_splitting_enabled` + `fee_amount_cents` stored but no dynamic calculation
- **Language enforcement:** `language_code` stored on participant but no UI gate in join sequence

### Cube 1 — Not Yet Implemented (specified in Requirements.txt)
- **Scoping context:** Project/Specification/Differentiator tables + FK linkage
- **Join flow gates:** Payment processing (Stripe/GPay/ApplePay), language enforcement gate
- **Master language table:** `languages` + `ui_translations` backend tables (frontend Language Lexicon implemented)
- **Desired Outcome setup:** Methods 2 & 3 — outcome input, role assignment, confirmation gates
- **Moderator multi-device sync:** WebSocket push to all connected moderator devices, device-aware layouts
- **Live response feed:** 33-word summary feed on hosting PC (Cube 2 integration, paid tiers only)
- **Metrics collection:** System/User/Outcome metrics (none wired)

### Cube 1 — Service Functions Status
| Function | Status | Notes |
|----------|--------|-------|
| `create_session()` | **Implemented** | All 15 Cube 1 fields + CQS weights + static poll params |
| `generate_qr_code()` | **Implemented** | PNG + base64 |
| `validate_join_request()` | **Implemented** | Expiry + state + capacity check |
| `check_capacity()` | **Implemented** | Enforces max_participants, 409 on full |
| `join_session()` | **Implemented** | language_code, results_opt_in, Redis presence, login token |
| `transition_session_state()` | **Implemented** | Full state machine (6 states) + ends_at computation for static polls |
| `get_session_by_code()` | **Implemented** | |
| `check_session_expiry()` | **Implemented** | `is_expired` property + 410 |
| `verify_session_owner()` | **Implemented** | 403 for non-owner, admin bypass |
| `select_language()` | Not implemented | No separate gate function |
| `process_results_optin()` | Not implemented | No opt-in gate |
| `process_join_payment()` | Not implemented | No Stripe in join |
| `calculate_per_user_fee()` | Not implemented | No cost-split logic |
| `determine_pricing_tier()` | Not implemented | No tier logic |
| `sync_moderator_state()` | Not implemented | No WebSocket sync |
| `get_moderator_layout()` | Not implemented | No device-aware layout |

### Cube 1 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube1/ -v --tb=short
```

**Test Suite:** 2 files, 15 test classes, 59 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_session_service.py` | 11 | 36 | Service unit tests (+ static poll countdown) |
| `test_e2e_flows.py` | 4 | 23 | Moderator + User E2E flows |

**Moderator Test Flow (TestModeratorFlow):**
1. `create_session(full_config)` — All 11 Cube 1 fields + CQS weights
2. `add_questions(3)` — Three questions in draft state
3. `transition(draft→open)` — Sets `opened_at`
4. `transition(open→polling)` — Starts response collection
5. `transition(polling→ranking)` — AI theming phase
6. `transition(ranking→closed)` — Sets `closed_at`
7. `transition(closed→archived)` — Clears Redis presence
8. `verify_ownership` — 403 for non-owner, admin bypass
9. `generate_qr_code` — PNG with valid magic bytes

**User Test Flow (TestUserFlow):**
1. `join_session(open, language=en, opt_in=True)` — Full join with preferences
2. `rejoin_session(reactivate)` — Returning user reactivated, not duplicated
3. `join_anonymous(no_auth)` — user_id=None accepted
4. `verify_redis_presence` — HSET + EXPIRE on join
5. `reject_expired_join` — SessionExpiredError
6. `reject_draft_join` — SessionStateError
7. `reject_full_session` — 409 Conflict at max_participants

**Capacity Tests (TestCapacityEnforcement):**
1. Unlimited when `max_participants=None`
2. Allows under limit
3. Rejects at limit (409)

**Determinism Tests (TestDeterminism):**
1. Seeded UUID5 produces deterministic ID
2. Duplicate seed returns existing session (idempotent)

**Static Poll Countdown Tests (TestStaticPollCountdown):**
1. `test_create_session_with_static_poll_fields` — polling_mode_type, duration, timer_display persisted
2. `test_transition_to_polling_computes_ends_at` — static poll → ends_at = now + N days
3. `test_transition_to_polling_no_ends_at_for_live` — live poll → ends_at stays None
4. `test_create_session_default_timer_display_mode` — defaults to "flex"

### Cube 1 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube1_session/service.py` | 523 | Core business logic (15 params incl. static poll + timer) |
| `cubes/cube1_session/router.py` | 397 | 23 API endpoints (+ /start) |
| `models/session.py` | 138 | Session ORM model (15 columns incl. polling_mode_type, ends_at, timer_display_mode) |
| `models/participant.py` | 40 | Participant ORM model (3 new columns) |
| `models/question.py` | 33 | Question ORM model |
| `schemas/session.py` | 165 | Pydantic schemas (extended with static poll + timer fields) |
| `schemas/participant.py` | 28 | Participant schema (extended) |
| `schemas/question.py` | 22 | Question schema |
| `tests/cube1/test_session_service.py` | 645 | 36 unit tests (incl. static poll countdown) |
| `tests/cube1/test_e2e_flows.py` | 691 | E2E Moderator + User + Static Poll flows |
| `core/auth.py` | — | Auth middleware |
| `core/exceptions.py` | — | Custom exceptions |

---

## Cube 2 — Text Submission Handler: IMPLEMENTED (CRS-05→CRS-08 done; ~85% of full spec)

**Code location:** `backend/app/cubes/cube2_text/` (modular, self-contained)

### Cube 2 — Implemented
- **Text validation:** Unicode-aware length check, whitespace stripping, max_response_length from session
- **PII detection:** Transformer NER (Davlan/xlm-roberta-large-ner-hrl) + regex fallback (email, phone, SSN, CC, IP)
- **PII scrubbing:** [TYPE_REDACTED] placeholder replacement, position-preserving reverse processing
- **Profanity detection:** DB-driven profanity_filters table by language_code, regex matching
- **Profanity scrubbing:** Configured replacements, non-blocking (submission proceeds regardless)
- **Dual storage:** MongoDB (raw text) + Postgres (ResponseMeta + TextResponse)
- **Redis pub/sub:** Publishes `response_submitted` event for Cube 6 downstream consumption
- **Time tracking:** Cube 5 integration — start on submit, stop on store, ♡/◬ tokens returned
- **Anonymization (CRS-05):** `anonymize_response()` — anonymous (None pid + anon_hash), identified (pid preserved), pseudonymous (both)
- **Language detection:** Unicode script-based sanity check for 13 non-Latin scripts, non-blocking
- **Response integrity (CRS-08):** SHA-256 hash of raw text stored on TextResponse, returned in API
- **Metrics:** System/User/Outcome metrics endpoints (submission latency, PII rate, token distribution)
- **Security (CRS-05→CRS-08):**
  - CRS-05: Anonymize participant identity based on session anonymity_mode
  - CRS-06: `validate_session_for_submission()` enforces `status == "polling"`
  - CRS-07: Full pipeline: validate → PII → profanity → store → publish, up to 5000 chars
  - CRS-08: SHA-256 response_hash for integrity verification
- **API endpoints:** 4 routes (submit, list, metrics, detail)
- **Rate limiting:** 100/min on submit endpoint

### Cube 2 — CRS Traceability
| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-05 | CRS-05.IN.SRS.005 | CRS-05.OUT.SRS.005 | **Complete** | Post-session reveal opt-in |
| CRS-06 | CRS-06.IN.SRS.006 | CRS-06.OUT.SRS.006 | **Complete** | Scheduled auto-open/close |
| CRS-07 | CRS-07.IN.WRS.007 | CRS-07.OUT.WRS.007 | **Complete** | Rich text + autosave drafts |
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Complete** (hash) | AES-256 encryption at rest |

### Cube 2 — Not Yet Implemented
- **`push_to_live_feed()`** — WebSocket 33-word summary feed (requires Cube 6)
- **Profanity seed data** for 33 languages (table ready, needs curated regex)
- **AES-256 encryption at rest** — CRS-08 stretch target (response_hash covers integrity)
- **`detect_language()` ML upgrade** — current Unicode heuristic is lightweight

### Cube 2 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube2/ -v --tb=short
```

**Test Suite:** 2 files, 16 test classes, 62 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_text_service.py` | 10 | 32 | Unit tests (validation, PII, profanity, pub/sub, queries) |
| `test_e2e_flows.py` | 6 | 30 | E2E flows (submission, PII, profanity, anonymization, CRS-08, language) |

**Submission Test Flow (TestSubmissionFlow):**
1. `create_session(polling)` → `submit_text_response()` — Full pipeline E2E
2. `verify_mongo_write` — Raw text stored in MongoDB
3. `verify_postgres_write` — ResponseMeta + TextResponse created
4. `verify_token_display` — ♡ + ◬ returned with correct values
5. `reject_non_polling` — SessionNotPollingError for non-polling session
6. `reject_char_limit` — ResponseValidationError for exceeding max
7. `accept_unicode` — CJK, Arabic, emoji all accepted
8. `verify_redis_event` — Published to `session:{id}:responses` channel

**PII Test Flow (TestPIIFlow):**
1. `detect_email` — Email → [EMAIL_REDACTED]
2. `detect_phone_ssn` — Phone + SSN in same text both caught
3. `clean_text_no_flag` — No PII → empty detections
4. `ner_failure_regex_fallback` — NER down → regex still catches PII
5. `multiple_pii_types` — Email + IP + SSN all detected in one response

**Profanity Test Flow (TestProfanityFlow):**
1. `profanity_matched` — DB pattern match → flagged + scrubbed
2. `no_filters_for_language` — No patterns → clean pass-through
3. `invalid_regex_skipped` — Bad regex → skipped gracefully
4. `profanity_non_blocking` — Submission proceeds despite profanity

**Anonymization Tests (TestAnonymizationFlow — CRS-05):**
1. `anonymous_none_pid` — anonymous → participant_id=None + anon_hash
2. `identified_preserves_pid` — identified → participant_id preserved
3. `pseudonymous_both` — pseudonymous → both pid + anon_hash stored
4. `hash_deterministic` — Same pid → same hash every time
5. `different_pids_different_hashes` — Different pids → different hashes

**Integrity Tests (TestCRS08Integrity — CRS-08):**
1. `hash_computed` — SHA-256 hex is 64 chars
2. `hash_changes` — Different text → different hash
3. `hash_deterministic` — Same text → same hash
4. `unicode_hash` — Unicode text hashes correctly

**Language Detection Tests (TestLanguageDetection):**
1. `latin_always_passes` — en, fr, es → True
2. `cjk_matches_zh` — Chinese characters match zh
3. `arabic_matches_ar` — Arabic script matches ar
4. `mismatch_detected` — Latin text declared as Arabic → False
5. `empty_text_passes` — Whitespace → True
6. `korean_matches_ko` — Korean hangul matches ko

### Cube 2 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube2_text/service.py` | 700+ | Core business logic (7 sections + anonymization + language detect) |
| `cubes/cube2_text/router.py` | 105 | 4 API endpoints |
| `cubes/cube2_text/metrics.py` | 262 | System/User/Outcome metrics for Cube 10 |
| `models/text_response.py` | 50 | TextResponse ORM model (+ response_hash) |
| `models/response_meta.py` | 35 | ResponseMeta ORM model (nullable participant_id) |
| `schemas/response.py` | 95 | Pydantic schemas (ResponseCreate, ResponseRead, Detail, List) |
| `tests/cube2/test_text_service.py` | 499 | 32 unit tests |
| `tests/cube2/test_e2e_flows.py` | 716 | 30 E2E tests + CUBE2_TEST_METHOD |

---

## Cube 3 — Voice-to-Text Engine: IMPLEMENTED (CRS-08, CRS-15 done; ~85% of full spec)

**Code location:** `backend/app/cubes/cube3_voice/` (modular, self-contained)

### Cube 3 — Implemented
- **Browser mic capture:** MediaRecorder API (webm default), audio blob → FormData upload
- **STT providers (4 batch at launch):** OpenAI Whisper, Grok (xAI), Gemini (Google), AWS Transcribe
- **Provider abstraction:** `STTProvider` ABC with `transcribe()`, `supports_language()`, `model_id()`
- **Circuit breaker failover:** whisper → grok → gemini → aws (skips failed provider, retries remaining)
- **Provider selection:** Moderator default (session.ai_provider) → User override (if allow_user_stt_choice)
- **Transcript validation:** Non-empty check, confidence threshold (0.3 min), length truncation
- **Cube 2 pipeline integration:** Voice transcripts → detect_pii → scrub_pii → detect_profanity → scrub_profanity
- **Dual storage:** MongoDB (raw audio binary + raw transcript) + Postgres (ResponseMeta + VoiceResponse + TextResponse)
- **Response integrity (CRS-08):** SHA-256 hash of clean_text stored on TextResponse.response_hash, returned in API
- **Time tracking (Cube 5):** start_time_tracking on submit, stop_time_tracking after store, ♡/◬ tokens returned
- **Redis pub/sub:** Publishes `response_submitted` event for Cube 6 downstream consumption
- **Immediate token display:** ♡ and ◬ returned in submission response for instant UI feedback
- **Real-time STT (paid feature):** WebSocket endpoint with Azure (primary) + AWS (fallback) streaming
- **Metrics:** System/User/Outcome metrics endpoints for Cube 10 simulation
- **Security:**
  - CRS-08: SHA-256 response_hash for integrity verification
  - CRS-15: Voice submission with audio validation (format, size, empty check)
- **API endpoints:** 5 routes (submit voice, list voice responses, get detail, metrics, realtime WebSocket)
- **Rate limiting:** 60/min on submit endpoint
- **Audio limits:** Max 25 MB upload, accepted formats: webm, wav, mp3, ogg, m4a, flac

### Cube 3 — STT Providers at Launch
| Provider | Model ID | Type | Languages | Notes |
|----------|----------|------|-----------|-------|
| OpenAI Whisper | whisper-1 | Batch | 33 | Primary default |
| Grok (xAI) | whisper-large-v3 | Batch | 33 | OpenAI-compatible API |
| Gemini (Google) | gemini-2.0-flash | Batch | 33 | Multimodal audio input |
| AWS Transcribe | aws-transcribe | Batch | 23 | S3 upload → batch job |
| Azure Speech | azure-stt | Real-time | 30+ | Paid feature, WebSocket |
| AWS Transcribe Streaming | aws-streaming | Real-time | 23 | Fallback for Azure |

### Cube 3 — CRS Traceability
| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Complete** (hash) | AES-256 encryption at rest |
| CRS-15 | CRS-15.IN.WRS.015 | CRS-15.OUT.WRS.015 | **Complete** | Live word-by-word display |

### Cube 3 — Not Yet Implemented
- **`push_to_live_feed()`** — WebSocket 33-word summary feed (requires Cube 6)
- **Language-specific STT model tuning** — per-language model selection optimization
- **Audio playback** — MongoDB audio_files retrieval for replay
- **Voice-specific profanity seed data** — speech patterns differ from text

### Cube 3 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube3/ -v --tb=short
```

**Test Suite:** 2 files, 12 test classes, 39 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_voice_service.py` | 7 | 18 | Unit tests (validation, circuit breaker, provider selection, queries) |
| `test_e2e_flows.py` | 5 | 21 | E2E flows (submission, PII, CRS-08, circuit breaker, AWS provider) |

**Submission Test Flow (TestSubmissionFlow):**
1. `voice_submit_full_pipeline` — Full E2E: transcribe → PII → store → tokens → Redis event
2. `voice_submit_returns_token_display` — ♡ + ◬ returned with correct values
3. `voice_submit_rejects_non_polling_session` — SessionNotPollingError
4. `voice_submit_rejects_empty_transcript` — ResponseValidationError
5. `voice_submit_accepts_all_formats` — webm, wav, mp3, ogg, m4a, flac
6. `redis_event_published_after_voice_store` — Published to session channel

**PII Test Flow (TestPIIFlow):**
1. `voice_transcript_email_detected` — Email → [EMAIL_REDACTED]
2. `clean_voice_transcript_no_pii` — No PII → empty detections
3. `multiple_pii_in_voice_transcript` — Email + SSN all detected

**CRS-08 Integrity Tests (TestCRS08Integrity):**
1. `voice_hash_computed` — SHA-256 hex is 64 chars
2. `voice_hash_changes_with_transcript` — Different text → different hash
3. `voice_hash_is_deterministic` — Same text → same hash
4. `unicode_voice_transcript_hash` — Unicode hashes correctly
5. `response_hash_in_submission_result` — E2E: hash present in submit result

**Circuit Breaker E2E (TestCircuitBreakerE2E):**
1. `primary_fails_fallback_succeeds` — whisper fail → grok succeeds
2. `all_providers_fail_returns_422` — All 4 fail → ResponseValidationError
3. `failover_includes_aws_in_chain` — Fallback order = [whisper, grok, gemini, aws]

**AWS Provider Tests (TestAWSProvider):**
1. `aws_enum_exists` — STTProviderName.AWS = "aws"
2. `aws_provider_model_id_pinned` — model_id = "aws-transcribe"
3. `aws_language_support` — 23 languages supported
4. `aws_factory_mapping` — _AI_TO_STT_MAP["aws"] = "aws"

### Cube 3 — Service Functions Status
| Function | Status | Notes |
|----------|--------|-------|
| `select_provider_for_language()` | **Implemented** | DB priority + language check |
| `transcribe_audio()` | **Implemented** | Circuit breaker failover |
| `_handle_stt_failure()` | **Implemented** | 4-provider fallback chain |
| `validate_transcript()` | **Implemented** | Empty, confidence, truncation |
| `store_voice_response()` | **Implemented** | MongoDB + Postgres + CRS-08 hash |
| `submit_voice_response()` | **Implemented** | Full orchestrator with token display |
| `get_voice_responses()` | **Implemented** | Paginated list |
| `get_voice_response_by_id()` | **Implemented** | Full detail with PII/profanity |
| `push_to_live_feed()` | Not implemented | Requires Cube 6 WebSocket |

### Cube 3 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube3_voice/service.py` | 575 | Core orchestrator (transcribe → pipeline → store → tokens) |
| `cubes/cube3_voice/router.py` | 173 | 5 API endpoints (submit, list, detail, metrics, realtime WS) |
| `cubes/cube3_voice/metrics.py` | 260+ | System/User/Outcome metrics for Cube 10 |
| `cubes/cube3_voice/realtime.py` | 200+ | WebSocket real-time STT handler |
| `cubes/cube3_voice/providers/base.py` | 91 | STTProvider ABC + TranscriptionResult + STTProviderError |
| `cubes/cube3_voice/providers/factory.py` | 134 | Provider factory + selection logic |
| `cubes/cube3_voice/providers/whisper_provider.py` | 138 | OpenAI Whisper implementation |
| `cubes/cube3_voice/providers/grok_provider.py` | 119 | xAI Grok (OpenAI-compatible) |
| `cubes/cube3_voice/providers/gemini_provider.py` | 135 | Google Gemini multimodal |
| `cubes/cube3_voice/providers/aws_provider.py` | 190 | AWS Transcribe batch |
| `cubes/cube3_voice/providers/aws_realtime.py` | 227 | AWS Transcribe streaming |
| `cubes/cube3_voice/providers/azure_realtime.py` | 250+ | Azure Speech Services streaming |
| `models/voice_response.py` | 50 | VoiceResponse ORM model |
| `schemas/voice.py` | 80+ | Pydantic schemas |
| `tests/cube3/test_voice_service.py` | 372 | 18 unit tests |
| `tests/cube3/test_e2e_flows.py` | 500+ | 19 E2E tests + CUBE3_TEST_METHOD |

### Cube 3 — Frontend Files
| File | Action | Purpose |
|------|--------|---------|
| `components/voice-input.tsx` | **Rewritten** | Records audio → sends to backend → shows transcript + tokens |
| `lib/types.ts` | **Updated** | Added VoiceSubmissionRead interface |
| `lib/api.ts` | **Updated** | Added submitVoiceResponse (FormData upload, mock + live) |
| `components/session-view.tsx` | **Updated** | Passes sessionId, questionId, participantId, languageCode to VoiceInput |
