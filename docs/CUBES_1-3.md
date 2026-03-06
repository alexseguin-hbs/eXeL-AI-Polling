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
- **API endpoints:** 19 routes (session CRUD, state transitions, join, participants, presence, questions, QR, verification)
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

### Cube 1 — Newly Implemented (Session Flow Gating + Live Feed, 2026-03-05)
- **Session flow gating:** Users who scan QR / use join link now land in **lobby** (waiting state) until moderator clicks "Start Polling"
  - Join flow hydration defaults to `status: "open"` (not "polling") for cross-device users
  - Session-view shows lobby card with participant counter + "Waiting for moderator" message for `draft`/`open` states
  - Status polling every 3s (KV + local) auto-transitions users to input form when moderator starts polling
- **Live response feed (33-word summaries):** Moderator sees real-time 33-word summaries of all participant inputs during polling
  - Cube 6 Phase A stub: `summarizeCascade()` generates 333→111→33 word extractive summaries on submit
  - All response paths generate summaries: user submit, mock polling, spiral test, pre-populated responses
  - Feed displays `summary_33` field (falls back to sentence-extraction if missing)
  - **Expand/Collapse:** Inline feed toggles between 200px and 500px height
  - **Fullscreen mode:** Full-viewport overlay with close button — moderator can project live feed
- **Cross-device response flow:** Phone/PC user inputs propagate to moderator via Cloudflare KV
  - POST response → local mockResponses + KV `/api/responses` (fire-and-forget)
  - GET responses → merges local + KV with deduplication by `participant_id::text_prefix`
  - Summaries stored in KV (summary_333, summary_111, summary_33 fields)
- **Web_Results CSV export:** Now includes Summary_333, Summary_111, Summary_33 columns alongside Detailed_Results

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

### Cube 1 — Simulation Requirements (Cube 10 Isolation)

When Cube 1 is loaded into the Cube 10 Simulation Orchestrator for isolated testing, the following rules govern which data sources are live vs simulated and how each function behaves.

#### Input/Output Simulation Modes

**Inputs:**
| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| moderator_config | Input | Moderator UI | SIMULATED | Canned session configs from `frontend/lib/mock-data.ts` (4 default polls) |
| qr_scan | Input | User device | SIMULATED | Mock short codes generated in-memory, no camera needed |
| language_selection | Input | User UI | SIMULATED | Defaults to `en`; 33 languages available via Lexicon context |
| results_opt_in | Input | User UI | SIMULATED | Hardcoded `true` for all mock participants |
| payment_authorization | Input | Stripe/GPay/ApplePay | SIMULATED | Skipped entirely; `payment_status` set to `lead_exempt` |
| moderator_device_sync | Input | PC / Phone | SIMULATED | Single-device only in SIM; no WebSocket sync |

**Outputs:**
| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| session_id + short_code | Output | All cubes | SIMULATED | UUID generated in mock-data.ts, short_code via `generateShortCode()` |
| qr_code_image | Output | Moderator UI | LIVE | QR library generates real PNG from mock short_code (no external API) |
| participant_record | Output | Cubes 4, 5, 8, 9 | SIMULATED | Mock participant objects with language_code, payment_status, results_opt_in |
| session_state_events | Output | Cube 5 (Gateway) | SIMULATED | State transitions fired by SIM transport controls or auto-advance |
| scoping_context | Output | All cubes | SIMULATED | Not yet implemented; null in SIM |
| payment_event | Output | Cube 8 | SIMULATED | No payment processing; stub returns success |

#### Function Simulation Modes

| Function | Sim Mode | Sim Behavior |
|----------|----------|--------------|
| `create_session()` | SIMULATED | Uses canned session config from mock-data.ts; no DB write; returns in-memory session object |
| `generate_qr_code()` | LIVE | Actually generates QR PNG from short_code (pure local library, no external API) |
| `validate_join_request()` | SIMULATED | Skips expiry and state checks; always allows join in SIM |
| `check_capacity()` | SIMULATED | Mock sessions have `max_participants: null` (unlimited) or pre-set cap |
| `join_session()` | SIMULATED | Creates mock participant in-memory; no DB write; no Redis HSET; auto-awards login token (1 ♡, 5 ◬) |
| `transition_session_state()` | SIMULATED | State transitions driven by SIM transport controls (`|<`, `<<`, `>>`, `>|`); no DB update; `ends_at` computed in-memory for static polls |
| `get_session_by_code()` | SIMULATED | Looks up mock session from in-memory `mockSessions` map |
| `check_session_expiry()` | SIMULATED | Always returns not-expired in SIM; no `SessionExpiredError` thrown |
| `verify_session_owner()` | SIMULATED | Auth0 `isAuthenticated` used for role detection, but ownership check skipped in SIM |
| `select_language()` | SIMULATED | Not implemented; language defaults to Lexicon `activeLocale` |
| `process_results_optin()` | SIMULATED | Not implemented; hardcoded `results_opt_in: true` |
| `process_join_payment()` | SIMULATED | Not implemented; no Stripe integration in SIM |
| `calculate_per_user_fee()` | SIMULATED | Not implemented; fee always $0.00 |
| `determine_pricing_tier()` | SIMULATED | Not implemented; tier defaults to `free` |
| `sync_moderator_state()` | SIMULATED | Not implemented; single-device only |
| `get_moderator_layout()` | SIMULATED | Not implemented; default layout used |

#### Canned Test Data

| Data Set | Location | Contents |
|----------|----------|----------|
| 4 default mock sessions | `frontend/lib/mock-data.ts` | Product Feedback (live, single_poll), Q1 Strategy (live, multi_poll), AI Governance (live, single_poll), Team Innovation (static_poll, 3-day) |
| Per-session SIM data (4 polls) | `frontend/lib/sim-data/poll-{1-4}-*.ts` | Complete cube I/O per poll: state flows, 7 AI responses, themes, voice transcript, delays |
| Mock participants | `frontend/lib/mock-data.ts` | Auto-generated on join; `mockParticipantCount` tracks per-session count |
| Mock QR codes | `frontend/lib/mock-data.ts` | Real QR PNG generated from mock short_code string |
| 100-user spiral test data | `frontend/lib/sim-data/spiral-test-100-users.ts` | 100 canned responses, 12 MoT agent waves, 11 languages, 60-second staggered delays |
| Session state flows | `frontend/lib/sim-data/index.ts` | Live poll: 8 steps (draft->archived), Static poll: 7 steps (draft->archived) |

#### Simulation Pass Criteria

- 100% of existing Cube 1 tests must pass (59/59) with zero regressions
- No spiral metric degradation: backend test duration, TSC errors, bundle sizes must remain at or below baseline
- User-submitted replacement code must EXCEED existing metrics on the same canned inputs (latency p50/p95, join flow completion rate, state transition reliability)
- QR generation time must not exceed 200ms (current baseline: <50ms for mock short_codes)
- Capacity enforcement must correctly reject joins at `max_participants` limit (409 response)

#### Cube 10 Code Challenge Context

In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs (4 default sessions, mock participants, state transition sequences) and compares output metrics against the existing implementation baseline. Functions eligible for code challenge: `create_session()`, `validate_join_request()`, `check_capacity()`, `join_session()`, `transition_session_state()`, `check_session_expiry()`. User code must produce identical outputs for identical inputs (determinism requirement) and must not degrade any System, User, or Outcome metric.

#### Spiral Test Reference

See `docs/SPIRAL_METRICS.md` for full baselines:
- **N=5 baseline (2026-02-18):** 55/55 tests, 2,984ms avg backend duration, 0 TS errors
- **N=9 extended (2026-02-23):** 173/173 tests, 3,507ms avg backend duration, 0 TS errors
- **N=18 bidirectional (2026-02-25):** 198/198 tests, forward + backward pass, 0 failures, 0 regressions
- **N=18 bidirectional (2026-02-26):** 287/287 tests (includes Cubes 4-6), 0 failures, 0 regressions

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
| `cubes/cube1_session/router.py` | 429 | 19 API endpoints |
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

### Cube 1 — Requirements.txt Data Tables

**Table: `sessions`** (30+ columns — see CLAUDE.md for implementation status per column)
| Variable | Type | Implemented? | Description |
|----------|------|-------------|-------------|
| id | UUID (PK) | Yes | Session unique identifier |
| short_code | VARCHAR(8) | Yes | Human-readable join code |
| created_by | UUID (FK→users) | Yes | Moderator user ID |
| session_type | ENUM | Yes | `polling` / `peer_volunteer` / `team_collaboration` |
| polling_mode | ENUM | Yes | `single_round` / `multi_round_deep_dive` |
| status | ENUM | Yes | `draft` / `open` / `polling` / `ranking` / `closed` / `archived` |
| scoping_type | ENUM | No | `project` / `specification` / `product_differentiator` |
| scoping_id | UUID | No | FK to scoping table based on scoping_type |
| pricing_tier | ENUM | Yes | `free` / `moderator_paid` / `cost_split` |
| max_participants | INTEGER (nullable) | Yes | Capacity cap (null = unlimited) |
| fee_amount_cents | INTEGER | Yes | Session fee in cents |
| cost_splitting_enabled | BOOLEAN | Yes | Fee split among participants |
| reward_enabled | BOOLEAN | Yes | Gamified reward active |
| reward_amount_cents | INTEGER | Yes | Bonus reward in cents |
| cqs_weights | JSONB | Yes | Custom CQS metric weights |
| anonymity_mode | ENUM | Yes | `anonymous` / `identified` |
| ranking_mode | ENUM | Yes | `auto` / `manual` / `live` |
| theme2_voting_level | ENUM | Yes | `theme2_9` / `theme2_6` / `theme2_3` |
| live_feed_enabled | BOOLEAN | Yes | Live 33-word response feed (paid tiers) |
| response_char_limit | INTEGER | Yes | Max response chars (as max_response_length) |
| question_char_limit | INTEGER | No | Max question chars (default 500) |
| max_deep_dive_rounds | INTEGER | Yes | Max rounds for deep dive (as max_cycles) |
| language_default | VARCHAR(5) | Yes | Default session language (as language) |
| qr_url | TEXT | Yes | Generated QR code URL |
| join_url | TEXT | Yes | Shareable join link |
| polling_mode_type | VARCHAR(30) | Yes | `live_interactive` / `static_poll` |
| static_poll_duration_days | INTEGER (nullable) | Yes | 1, 3, or 7 days |
| ends_at | TIMESTAMP (nullable) | Yes | Computed deadline for static polls |
| timer_display_mode | VARCHAR(20) | Yes | `day` / `flex` / `both` |
| expires_at | TIMESTAMP | Yes | Session expiry (default 24h) |

**Table: `participants`** (11 columns)
| Variable | Type | Implemented? | Description |
|----------|------|-------------|-------------|
| id | UUID (PK) | Yes | Participant record ID |
| session_id | UUID (FK→sessions) | Yes | Session reference |
| user_id | UUID (FK→users, nullable) | Yes | Auth user or null for anonymous |
| anon_hash | VARCHAR(64) | Yes | Anonymous identifier hash |
| language_code | VARCHAR(5) | Yes | Selected language |
| results_opt_in | BOOLEAN | Yes | Clicked Yes for results |
| payment_status | ENUM | Yes | `unpaid` / `paid` / `lead_exempt` |
| payment_transaction_id | UUID (nullable) | No | Stripe/GPay/ApplePay reference |
| role_type | ENUM (nullable) | No | `technology` / `creative` / `business_value` (Method 3) |
| device_type | VARCHAR(20) | Yes | `desktop` / `tablet` / `phone` |
| joined_at | TIMESTAMP | Yes | Join timestamp |

**Table: `languages`** (Master UI/UX Language Table — backend NOT created, frontend Lexicon maps 1:1)
| Variable | Type | Description |
|----------|------|-------------|
| id | SERIAL (PK) | Auto-increment ID |
| code | VARCHAR(5) UNIQUE | ISO 639-1 code |
| name_english | VARCHAR(100) | Language name in English |
| name_native | VARCHAR(100) | Native script name |
| direction | ENUM | `ltr` / `rtl` |
| is_active | BOOLEAN | Available in dropdown |
| added_by | UUID (FK→users) | Who added |
| verified_by | UUID (nullable) | AI-verified + approval |

**Table: `ui_translations`** (backend NOT created, frontend Lexicon maps 1:1)
| Variable | Type | Description |
|----------|------|-------------|
| id | SERIAL (PK) | Auto-increment ID |
| string_key | VARCHAR(255) | Unique key (e.g., `cube1.join.language_prompt`) |
| cube_id | INTEGER | Which cube (0 = shared/global) |
| language_code | VARCHAR(5) | Language |
| translated_text | TEXT | The translated string |
| context_hint | TEXT (nullable) | Context for translators |
| ai_verified | BOOLEAN | AI verified quality |
| approved_by | UUID (nullable) | Approver |

### Cube 1 — Inputs / Outputs

**Inputs:**
| Input | Source | Description |
|-------|--------|-------------|
| Moderator config | Moderator UI | Session type, polling mode, pricing tier, max participants, fee, cost splitting, reward, CQS weights, anonymity, ranking mode, response/question limits, language default, scoping context |
| QR scan | User device | User scans QR code to initiate join flow |
| Language selection | User UI | User picks from active languages dropdown |
| Results opt-in click | User UI | Active Yes/No click for results copy |
| Payment authorization | Stripe/GPay/ApplePay | Payment confirmation if cost splitting enabled |
| Moderator device sync | PC / Phone | Both devices connect via WebSocket for real-time sync |

**Outputs:**
| Output | Destination | Description |
|--------|-------------|-------------|
| Session ID + short code | All cubes | Unique session identifier used across system |
| QR code image + join URL | Moderator UI / sharing | Scannable QR and link |
| Participant record | Cube 4, 5, 8, 9 | Language, payment status, results opt-in, scoping context |
| Session state events | Cube 5 (Gateway) | State transitions (draft→open→polling→ranking→closed→archived) |
| Scoping context | All cubes | project_id, differentiator_id, or specification_id linked to session |
| Payment event | Cube 8 | Payment transaction for cost-split or Moderator fee |

### Cube 1 — Metrics (Requirements.txt)

**System Metrics:** Session creation latency (p50/p95), QR generation time, Join flow completion rate, Session state transition success/failure rate, Concurrent active sessions, API endpoint response times per route, WebSocket sync latency (ms), Capacity check response time (ms)

**User Metrics:** Time from QR scan to session join, Join-to-first-question time, Language selection distribution, Language selection abandonment rate, Results opt-in rate (%), Payment conversion rate, Payment abandonment rate, Participants per session (avg/median/max by tier), Device type distribution, Moderator device usage (% PC vs Phone vs both), Return user rate

**Outcome Metrics:** Sessions completed vs abandoned (by polling mode), Deep dive utilization rate, Multi-round progression rate, Average rounds per deep dive, Participant retention across deep dive rounds, Time-to-first-response after join, Revenue per session, Cost splitting utilization rate, Gamified reward utilization rate, Average per-user fee

### Cube 1 — CRS Traceability (Full DesignMatrix)
| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|
| CRS-01 | CRS-01.IN.SRS.001 | CRS-01.OUT.SRS.001 | **Implemented** | 1 | Moderator creates session + secure link/QR for instant participant access | QR + URL in <2s, 99.5% availability | Branded, expiring QR codes with analytics, 99.9% availability |
| CRS-02 | CRS-02.IN.WRS.002 | CRS-02.OUT.WRS.002 | **Implemented** | 1 | User joins via QR/link without authentication friction | Join in ≤3 clicks, <5s load | One-tap join with device auto-detection, <2s load |
| CRS-03 | CRS-03.IN.SRS.003 | CRS-03.OUT.SRS.003 | **Implemented** | 1 | System generates collision-free session IDs bound to QR | Zero-collision UUID generation | Cryptographically signed rotating session identifiers |
| CRS-04 | CRS-04.IN.SRS.004 | CRS-04.OUT.SRS.004 | **Implemented** | 1 | System validates QR access, blocks expired/invalid sessions | 100% expiry/validity enforcement | Geo-fencing and abuse-detection heuristics |

### Cube 1 — DesignMatrix VOC (Voice of Customer)
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-01 | Fast, simple session creation with minimal setup | "I don't want to explain how to join — it should just work instantly." |
| CRS-02 | Zero-friction access from any device | "If I have to log in, half the room won't participate." |
| CRS-03 | Trust that sessions are secure and not hijacked | Enterprise buyers expect this as baseline security hygiene. |
| CRS-04 | Protection against misuse and accidental reuse | "We don't want old links floating around and confusing people." |

### Cube 1 — UI/UX Translation Strings (38 keys per Requirements.txt)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube1.join.select_language` | "Select your language" | Language dropdown header |
| `cube1.join.language_prompt` | "Choose your preferred language to continue" | Subtitle |
| `cube1.join.results_optin` | "Would you like to receive a copy of the polling results?" | Results opt-in prompt |
| `cube1.join.results_yes` | "Yes, I want results" | Opt-in button |
| `cube1.join.results_no` | "No, thanks" | Decline button |
| `cube1.join.fee_display` | "Your share: ${amount}" | Per-user fee |
| `cube1.join.payment_prompt` | "Pay to receive results" | Payment button label |
| `cube1.join.joining_session` | "Joining session..." | Loading state |
| `cube1.join.session_expired` | "This session has expired" | Expired session error |
| `cube1.join.session_closed` | "This session is closed" | Closed session error |
| `cube1.join.session_invalid` | "Invalid session link" | Invalid QR/link error |
| `cube1.join.welcome` | "Welcome to the session" | Post-join greeting |
| `cube1.join.session_full` | "This session is full" | Capacity limit |
| `cube1.join.free_session` | "Free session — no payment required" | Free tier indicator |
| `cube1.moderator.create_session` | "Create New Session" | Creation button |
| `cube1.moderator.polling_mode` | "Polling Mode" | Config label |
| `cube1.moderator.single_round` | "Single Round" | Mode option |
| `cube1.moderator.deep_dive` | "Multi-Round Deep Dive" | Mode option |
| `cube1.moderator.session_fee` | "Session Fee" | Fee input label |
| `cube1.moderator.enable_cost_split` | "Split cost with participants" | Toggle label |
| `cube1.moderator.enable_reward` | "Enable contribution reward" | Toggle label |
| `cube1.moderator.reward_amount` | "Reward amount" | Reward input |
| `cube1.moderator.generate_qr` | "Generate QR Code" | QR button |
| `cube1.moderator.share_link` | "Share Link" | Copy link button |
| `cube1.moderator.scoping_type` | "Poll Scoping" | Scoping label |
| `cube1.moderator.scoping_project` | "Project" | Scoping option |
| `cube1.moderator.scoping_spec` | "Specification" | Scoping option |
| `cube1.moderator.scoping_differentiator` | "Product Differentiator" | Scoping option |
| `cube1.moderator.pricing_tier` | "Session Pricing" | Tier selector |
| `cube1.moderator.tier_free` | "Free (up to 19 participants)" | Free option |
| `cube1.moderator.tier_paid` | "Moderator Paid" | Paid option |
| `cube1.moderator.tier_split` | "Cost Split with Participants" | Split option |
| `cube1.moderator.max_participants` | "Max Participants" | Capacity input |
| `cube1.moderator.phone_sync` | "Connected on another device" | Multi-device indicator |
| `cube1.moderator.open_poll` | "Open Poll" | Quick action |
| `cube1.moderator.close_poll` | "Close Poll" | Quick action |
| `cube1.moderator.participant_count` | "{count} participants" | Live counter |
| `cube1.session.status_draft` | "Draft" | Status label |

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

### Cube 2 — Simulation Requirements (Cube 10 Isolation)

When Cube 2 is loaded into the Cube 10 Simulation Orchestrator for isolated testing, the following rules govern which data sources are live vs simulated and how each function behaves.

#### Input/Output Simulation Modes

**Inputs:**
| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| raw_text | Input | User UI | SIMULATED | 7 AI user responses per poll from `frontend/lib/sim-data/poll-{1-4}-*.ts`; 100 responses from spiral test |
| session_id | Input | Cube 1 | SIMULATED | Mock session UUID from `mock-data.ts` |
| question_id | Input | Cube 1 | SIMULATED | Mock question UUID from `mock-data.ts` |
| participant_id | Input | Cube 1 | SIMULATED | Mock participant UUID or null (anonymous); auto-generated per AI user |
| language_code | Input | Cube 1 (participant) | SIMULATED | Per-response language tag from sim-data (11 languages in spiral test) |
| response_char_limit | Input | Cube 1 (session) | SIMULATED | Default 3333 chars from mock session config |
| anonymity_mode | Input | Cube 1 (session) | SIMULATED | Default `anonymous` from mock session config |

**Outputs:**
| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| validated_text_response | Output | Cube 4 (Collector) | SIMULATED | Stored in `mockResponses[sessionId]` array in-memory |
| pii_detection_result | Output | Cube 4, Cube 9 | SIMULATED | PII pipeline runs in test fixtures; mock responses are PII-clean |
| profanity_flag | Output | Cube 4, Moderator | SIMULATED | Profanity pipeline runs in test fixtures; mock responses are clean |
| token_display_trigger | Output | Cube 5 (Gateway) | SIMULATED | ♡/◬ calculated in-memory using mock TimerContext; no Cube 5 API call |
| submission_event | Output | Cube 5 (Gateway) | BOTH | Redis pub/sub event published in production; in SIM, `mockResponses` push + optional Cloudflare Cache API POST |
| response_hash | Output | Cube 9 (Reports) | SIMULATED | SHA-256 computed on clean_text in test fixtures; mock responses skip hashing |

#### Function Simulation Modes

| Function | Sim Mode | Sim Behavior |
|----------|----------|--------------|
| `validate_text_input()` | BOTH | Runs identically in SIM and production; validates length, non-empty, char limit against mock session config |
| `detect_language()` | SIMULATED | Unicode heuristic runs on mock text; language_code pre-tagged on each sim-data response |
| `detect_pii()` | SIMULATED | NER model NOT loaded in SIM (heavy dependency); regex fallback runs against test fixture strings |
| `scrub_pii()` | SIMULATED | Runs on test fixture text with injected PII patterns (email, phone, SSN); mock responses are PII-clean |
| `detect_profanity()` | SIMULATED | Checks against mock profanity_filters table; no DB query in SIM; test fixtures provide filter patterns |
| `anonymize_response()` | SIMULATED | Applies anonymity mode from mock session; test fixtures cover anonymous/identified/pseudonymous |
| `store_text_response()` | SIMULATED | Writes to `mockResponses[sessionId]` in-memory array; no MongoDB or Postgres in SIM |
| `emit_submission_event()` | BOTH | In SIM: pushes to local `mockResponses[]` + fire-and-forget POST to `/api/responses` (Cloudflare Cache API). In production: Redis pub/sub `response_submitted` |
| `push_to_live_feed()` | SIMULATED | Not implemented; 33-word summaries shown via mock data in live feed UI |

#### Canned Test Data

| Data Set | Location | Contents |
|----------|----------|----------|
| 7 AI user responses per poll (x4 polls) | `frontend/lib/sim-data/poll-{1-4}-*.ts` | Topic-specific text responses with theme tags, delays (2-17s), language codes |
| 100-user spiral test responses | `frontend/lib/sim-data/spiral-test-100-users.ts` | 100 unique responses across 12 MoT agent waves, 11 languages, staggered 0-60s |
| PII test fixtures | `backend/tests/cube2/test_text_service.py` | Email, phone, SSN, CC, IP patterns embedded in test strings |
| Profanity test fixtures | `backend/tests/cube2/test_text_service.py` | Mock profanity filter patterns with severity levels, language codes |
| Multilingual test inputs | `backend/tests/cube2/test_e2e_flows.py` | CJK, Arabic, Korean, emoji text samples for Unicode validation |
| Anonymization test cases | `backend/tests/cube2/test_e2e_flows.py` | anonymous/identified/pseudonymous mode scenarios with deterministic hash verification |
| CRS-08 integrity test vectors | `backend/tests/cube2/test_e2e_flows.py` | SHA-256 hash computation, determinism, and Unicode hash test cases |

#### Simulation Pass Criteria

- 100% of existing Cube 2 tests must pass (62/62) with zero regressions
- No spiral metric degradation: backend test duration, TSC errors, bundle sizes must remain at or below baseline
- PII detection accuracy: must catch 100% of regex patterns (email, phone, SSN, CC, IP) in test fixtures
- PII scrubbing: all detected PII must be replaced with `[TYPE_REDACTED]` placeholders with no data leakage
- Profanity detection must be non-blocking: submissions proceed regardless of profanity flag
- Response hash (CRS-08): SHA-256 must be deterministic (same text produces same hash across runs)
- User-submitted replacement code must EXCEED existing metrics on the same canned inputs (submission latency p50/p95, PII detection rate, false positive rate)

#### Cube 10 Code Challenge Context

In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs (28 AI responses across 4 polls, 100 spiral test responses, PII/profanity test fixtures) and compares output metrics against the existing implementation baseline. Functions eligible for code challenge: `validate_text_input()`, `detect_pii()`, `scrub_pii()`, `detect_profanity()`, `anonymize_response()`, `detect_language()`. User code must produce identical PII detection results for identical inputs (determinism requirement) and must not degrade any System, User, or Outcome metric.

#### Spiral Test Reference

See `docs/SPIRAL_METRICS.md` for full baselines:
- **N=5 baseline (2026-02-18):** 62/62 tests, 2,903ms avg backend duration, 0 TS errors
- **N=9 extended (2026-02-23):** 173/173 tests (all cubes), 3,507ms avg, 0 TS errors
- **N=18 bidirectional (2026-02-25):** 198/198 tests, forward + backward pass, 0 failures, 0 regressions
- **N=18 bidirectional (2026-02-26):** 287/287 tests (includes Cubes 4-6), 0 failures, 0 regressions

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
| `cubes/cube2_text/service.py` | 765 | Core business logic (7 sections + anonymization + language detect) |
| `cubes/cube2_text/router.py` | 104 | 4 API endpoints |
| `cubes/cube2_text/metrics.py` | 232 | System/User/Outcome metrics for Cube 10 |
| `models/text_response.py` | 50 | TextResponse ORM model (+ response_hash) |
| `models/response_meta.py` | 35 | ResponseMeta ORM model (nullable participant_id) |
| `schemas/response.py` | 95 | Pydantic schemas (ResponseCreate, ResponseRead, Detail, List) |
| `tests/cube2/test_text_service.py` | 499 | 32 unit tests |
| `tests/cube2/test_e2e_flows.py` | 716 | 30 E2E tests + CUBE2_TEST_METHOD |

### Cube 2 — Requirements.txt Data Tables

**Table: `text_responses`** (12 columns per Requirements.txt spec)
| Variable | Type | Implemented? | Description |
|----------|------|-------------|-------------|
| id | UUID (PK) | Yes | Response unique identifier (via Base model) |
| response_meta_id | UUID (FK→response_meta) | Yes | 1:1 link to ResponseMeta record |
| language_code | VARCHAR(10) | Yes | Language of submission (ISO 639-1) |
| is_anonymous | BOOLEAN | Yes | Whether response is anonymized |
| pii_detected | BOOLEAN | Yes | Whether PII was flagged |
| pii_types | JSONB (nullable) | Yes | Array of detected PII entries with type, position, text |
| pii_scrubbed_text | TEXT (nullable) | Yes | Cleaned text if PII was removed |
| profanity_detected | BOOLEAN | Yes | Whether profanity was detected |
| profanity_words | JSONB (nullable) | Yes | Array of matched profanity with word, severity, position |
| clean_text | TEXT (nullable) | Yes | Final cleaned text after PII + profanity scrubbing |
| response_hash | VARCHAR(64) | Yes | CRS-08: SHA-256 of raw_text for integrity verification |
| char_count | INTEGER | Yes | Character count (Unicode-aware, on ResponseMeta) |

**Table: `response_meta`** (Shared base for text + voice responses)
| Variable | Type | Implemented? | Description |
|----------|------|-------------|-------------|
| id | UUID (PK) | Yes | Meta record unique identifier |
| session_id | UUID (FK→sessions) | Yes | Session reference |
| question_id | UUID (FK→questions) | Yes | Question being answered |
| cycle_id | INTEGER | Yes | Deep dive round (1 = initial, 2+ = follow-up) |
| participant_id | UUID (FK→participants, nullable) | Yes | CRS-05: nullable for anonymous mode |
| source | VARCHAR(20) | Yes | `text` or `voice` |
| mongo_ref | VARCHAR(64) | Yes | MongoDB document reference for raw content |
| char_count | INTEGER | Yes | Character count (Unicode-aware) |
| submitted_at | TIMESTAMP | Yes | Submission timestamp |
| is_flagged | BOOLEAN | Yes | Whether response was flagged |
| flag_reason | VARCHAR(255, nullable) | Yes | Reason for flagging |

**Table: `questions`** (7 columns)
| Variable | Type | Implemented? | Description |
|----------|------|-------------|-------------|
| id | UUID (PK) | Yes | Question unique identifier |
| session_id | UUID (FK→sessions) | Yes | Session reference |
| cycle_number | INTEGER | Yes | Deep dive round (1 = initial, 2-3 = follow-up) |
| question_text | TEXT | Yes | The question in Moderator's language |
| status | ENUM | Yes | `draft` / `final` |
| parent_theme_id | UUID (FK→themes, nullable) | No | For deep dive follow-ups: which theme spawned this question |
| created_at | TIMESTAMP | Yes | Creation timestamp |

**Table: `profanity_filters`** (5 columns)
| Variable | Type | Implemented? | Description |
|----------|------|-------------|-------------|
| id | SERIAL (PK) | Yes | Auto-increment ID |
| language_code | VARCHAR(5) (FK→languages.code) | Yes | Language this filter applies to |
| pattern | TEXT | Yes | Regex or keyword pattern |
| severity | ENUM | Yes | `low` / `medium` / `high` |
| is_active | BOOLEAN | Yes | Whether filter is active |

### Cube 2 — Inputs / Outputs

**Inputs:**
| Input | Source | Description |
|-------|--------|-------------|
| Raw text input | User UI | Text typed by user in their selected language |
| session_id | Cube 1 | Current session context |
| question_id | Cube 1 | Which question is being answered |
| participant_id | Cube 1 | User identity / anon hash |
| language_code | Cube 1 (participant record) | User's selected language |
| response_char_limit | Cube 1 (sessions) | Max character limit for response |
| anonymity_mode | Cube 1 (session) | Whether to anonymize |

**Outputs:**
| Output | Destination | Description |
|--------|-------------|-------------|
| Validated text response | Cube 4 (Collector) | Cleaned, validated response with language tag |
| PII detection result | Cube 4, Cube 9 | Whether PII was found and scrubbed |
| Profanity flag | Cube 4, Moderator dashboard | Whether profanity was detected |
| Token display trigger | Cube 5 (Gateway) | Triggers ♡/◬ calculation for immediate display |
| Submission event | Cube 5 (Gateway) | Notifies gateway of new response for time tracking |

### Cube 2 — Functions (Requirements.txt)
| Function | Status | Description |
|----------|--------|-------------|
| `validate_text_input()` | **Implemented** | Validates length (Unicode-aware), non-empty, within char limit |
| `detect_language()` | **Implemented** (heuristic) | Confirms text matches selected language (Unicode script-based sanity check) |
| `detect_pii()` | **Implemented** | Scans for PII patterns (email, phone, SSN, CC, IP) via NER + regex fallback |
| `scrub_pii()` | **Implemented** | Redacts detected PII from response text with [TYPE_REDACTED] placeholders |
| `detect_profanity()` | **Implemented** | Checks against language-specific profanity filters from DB |
| `anonymize_response()` | **Implemented** | Strips identifying info based on session anonymity_mode (anonymous/identified/pseudonymous) |
| `store_text_response()` | **Implemented** | Writes validated response to MongoDB (raw) + Postgres (ResponseMeta + TextResponse) |
| `emit_submission_event()` | **Implemented** | Publishes `response_submitted` to Redis pub/sub for Cube 6 consumption |
| `push_to_live_feed()` | Not implemented | Sends 33-word summary (from Cube 6) to Moderator hosting PC via WebSocket (if live_feed_enabled + paid tier) |

### Cube 2 — UI/UX Translation Strings (13 keys per Requirements.txt)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube2.input.placeholder` | "Type your response here..." | Text input placeholder |
| `cube2.input.char_count` | "{count}/{max} characters" | Live character counter |
| `cube2.input.char_limit_warning` | "You've reached the character limit" | At-limit warning |
| `cube2.input.submit` | "Submit Response" | Submit button |
| `cube2.input.submitting` | "Submitting..." | Loading state |
| `cube2.input.submitted` | "Response submitted!" | Success confirmation |
| `cube2.input.anonymous_badge` | "Anonymous" | Anonymity indicator |
| `cube2.input.pii_warning` | "Personal information detected and removed" | PII scrub notice |
| `cube2.input.profanity_warning` | "Please revise — inappropriate language detected" | Profanity rejection |
| `cube2.input.empty_error` | "Please enter a response" | Empty submission error |
| `cube2.feed.title` | "Live Responses" | Live feed header on hosting PC |
| `cube2.feed.summary_loading` | "Processing response..." | While 33-word summary is being generated |
| `cube2.feed.responses_count` | "{count} responses received" | Counter on live feed |

*Token display strings use shared globals: `shared.tokens.earned`, `shared.tokens.si_label`, `shared.tokens.ai_label`*

### Cube 2 — CRS Traceability (Full DesignMatrix)
| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|
| CRS-05 | CRS-05.IN.SRS.005 | CRS-05.OUT.SRS.005 | **Implemented** | 1 | System supports anonymous vs identified modes configurable by Moderator | 100% anonymity enforcement per session mode | Post-session reveal opt-in for anonymized users |
| CRS-06 | CRS-06.IN.SRS.006 | CRS-06.OUT.SRS.006 | **Implemented** | 1 | Moderator opens/closes polling window deliberately | Instant state transitions, 100% enforcement | Scheduled auto-open/close with time-based rules |
| CRS-07 | CRS-07.IN.WRS.007 | CRS-07.OUT.WRS.007 | **Implemented** | 1 | User submits text responses reliably with constraints | Full pipeline (validate → PII → profanity → store → publish), up to 5000 chars, Unicode-aware | Rich text formatting + autosave drafts |
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Implemented** (hash) | 1 | System stores responses securely with timestamps + integrity verification | SHA-256 response_hash on every response, timestamp on submission | AES-256 encryption at rest for all stored response data |

### Cube 2 — DesignMatrix VOC (Voice of Customer)
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-05 | Participants need confidence that their identity is protected when promised | "People won't be honest if they think their name is attached — anonymity is critical for real feedback." |
| CRS-06 | Moderators need clear control over when polling starts and stops | "I need to be able to say 'go' and 'stop' — not have the system decide for me." |
| CRS-07 | Users need a reliable, fast text submission experience across all devices and languages | "It has to work on my phone in Spanish just as well as on a laptop in English." |
| CRS-08 | Enterprise customers require data integrity and security guarantees | "We need to prove that responses weren't tampered with after submission — audit trail is non-negotiable." |

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

### Cube 3 — Simulation Requirements (Cube 10 Isolation)

When Cube 3 is loaded into the Cube 10 Simulation Orchestrator for isolated testing, the following rules govern which data sources are live vs simulated and how each function behaves.

#### Input/Output Simulation Modes

**Inputs:**
| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| audio_stream | Input | User device mic | SIMULATED | Mock audio blobs (empty `Blob` with correct MIME type); no real mic capture in SIM |
| session_id | Input | Cube 1 | SIMULATED | Mock session UUID from `mock-data.ts` |
| question_id | Input | Cube 1 | SIMULATED | Mock question UUID from `mock-data.ts` |
| participant_id | Input | Cube 1 | SIMULATED | Mock participant UUID; auto-generated per AI user |
| language_code | Input | Cube 1 (participant) | SIMULATED | Per-response language tag; defaults to `en` in SIM |
| stt_provider_preference | Input | Moderator settings | SIMULATED | V2T provider selector in Settings panel; default `whisper` |

**Outputs:**
| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| transcript_text | Output | Cube 2 pipeline (then Cube 4) | SIMULATED | Pre-written transcript from sim-data; no actual STT API call |
| stt_confidence_score | Output | Cube 4, Cube 9 | SIMULATED | Hardcoded confidence values (0.85-0.95) in mock provider responses |
| token_display_trigger | Output | Cube 5 (Gateway) | SIMULATED | ♡/◬ calculated in-memory using mock TimerContext; no Cube 5 API call |
| submission_event | Output | Cube 5 (Gateway) | SIMULATED | Pushes to `mockResponses[]` in-memory; no Redis pub/sub in SIM |
| response_hash | Output | Cube 9 (Reports) | SIMULATED | SHA-256 computed on transcript clean_text in test fixtures |

#### Function Simulation Modes

| Function | Sim Mode | Sim Behavior |
|----------|----------|--------------|
| `capture_audio()` | SIMULATED | Frontend creates mock `Blob` with correct MIME type (webm); no MediaRecorder in SIM; pulsing red dot animation still renders |
| `select_stt_provider()` | SIMULATED | Returns moderator-selected provider from V2T Settings panel; no DB priority lookup; provider availability assumed |
| `transcribe_audio()` | SIMULATED | Returns pre-written transcript text with mock confidence score; NO external API call to any STT provider (OpenAI, Grok, Gemini, AWS) |
| `validate_transcript()` | BOTH | Runs identically in SIM and production; checks non-empty, confidence threshold (0.3), length truncation |
| `forward_to_text_pipeline()` | SIMULATED | Passes mock transcript into Cube 2 test fixture pipeline (detect_pii, scrub_pii, detect_profanity, scrub_profanity) |
| `store_voice_response()` | SIMULATED | Writes to `mockResponses[sessionId]` in-memory; no MongoDB or Postgres write; no audio binary stored |
| `handle_stt_failure()` | SIMULATED | Circuit breaker logic tested via mock providers that raise `STTProviderError`; failover chain exercised without real API calls |
| `push_to_live_feed()` | SIMULATED | Not implemented; voice transcripts appear in mock live feed via Cube 2 text pipeline path |

#### Canned Test Data

| Data Set | Location | Contents |
|----------|----------|----------|
| Mock audio blobs | `frontend/components/voice-input.tsx` | Empty `Blob` objects with MIME types (audio/webm, audio/wav, etc.); no real audio data |
| Mock STT transcripts (4 providers) | `backend/tests/cube3/test_voice_service.py` | Pre-written `TranscriptionResult` objects per provider: `text`, `confidence`, `language`, `model_id` |
| Circuit breaker test fixtures | `backend/tests/cube3/test_e2e_flows.py` | Scenarios: primary fails + fallback succeeds, all providers fail (422), failover chain order verified |
| Provider language support maps | `backend/app/cubes/cube3_voice/providers/*.py` | Per-provider language lists: Whisper (33), Grok (33), Gemini (33), AWS (23) |
| CRS-08 voice integrity test vectors | `backend/tests/cube3/test_e2e_flows.py` | SHA-256 hash on transcript clean_text: computation, determinism, Unicode, E2E presence |
| PII-in-transcript test fixtures | `backend/tests/cube3/test_e2e_flows.py` | Email in voice transcript, clean transcript, multiple PII types (email + SSN) |
| AWS provider test fixtures | `backend/tests/cube3/test_e2e_flows.py` | Enum existence, model_id pinning, 23-language support, factory mapping |
| V2T provider pricing data | `frontend/components/moderator-settings.tsx` | Estimated cost per 1,000 users: OpenAI $12, Grok $12, Gemini $4, AWS $48 |

#### Simulation Pass Criteria

- 100% of existing Cube 3 tests must pass (39/39, including 10 skipped STT provider tests requiring API keys) with zero regressions
- No spiral metric degradation: backend test duration, TSC errors, bundle sizes must remain at or below baseline
- Circuit breaker failover must correctly traverse the full chain: whisper -> grok -> gemini -> aws
- All 4 provider failures must return 422 `ResponseValidationError` (not 500)
- Transcript validation must reject empty transcripts and transcripts below 0.3 confidence threshold
- Response hash (CRS-08): SHA-256 on transcript clean_text must be deterministic across runs
- Audio format validation must accept all 6 formats (webm, wav, mp3, ogg, m4a, flac) and reject unknown formats
- User-submitted replacement code must EXCEED existing metrics on the same canned inputs (transcription latency, failover recovery time, confidence accuracy)

#### Cube 10 Code Challenge Context

In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs (mock audio blobs, pre-written transcripts, circuit breaker failure scenarios) and compares output metrics against the existing implementation baseline. Functions eligible for code challenge: `select_stt_provider()`, `transcribe_audio()`, `validate_transcript()`, `handle_stt_failure()`, `store_voice_response()`. Because Cube 3 depends on external STT APIs, simulation mode uses mock providers exclusively -- user code is tested for logic correctness and failover behavior, not API connectivity. User code must produce identical transcript validation results for identical inputs (determinism requirement) and must not degrade any System, User, or Outcome metric.

#### Spiral Test Reference

See `docs/SPIRAL_METRICS.md` for full baselines:
- **N=9 baseline (2026-02-23):** 39/39 Cube 3 tests (4,656ms avg), 194/194 total, 0 TS errors
- **N=18 bidirectional (2026-02-25):** 198/198 tests, forward + backward pass, 0 failures, 0 regressions
- **N=18 bidirectional (2026-02-26):** 287/287 tests (includes Cubes 4-6), 0 failures, 0 regressions

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
| `cubes/cube3_voice/service.py` | 570 | Core orchestrator (transcribe → pipeline → store → tokens) |
| `cubes/cube3_voice/router.py` | 172 | 5 API endpoints (submit, list, detail, metrics, realtime WS) |
| `cubes/cube3_voice/metrics.py` | 281 | System/User/Outcome metrics for Cube 10 |
| `cubes/cube3_voice/realtime.py` | 334 | WebSocket real-time STT handler |
| `cubes/cube3_voice/providers/base.py` | 91 | STTProvider ABC + TranscriptionResult + STTProviderError |
| `cubes/cube3_voice/providers/factory.py` | 137 | Provider factory + selection logic |
| `cubes/cube3_voice/providers/whisper_provider.py` | 137 | OpenAI Whisper implementation |
| `cubes/cube3_voice/providers/grok_provider.py` | 118 | xAI Grok (OpenAI-compatible) |
| `cubes/cube3_voice/providers/gemini_provider.py` | 134 | Google Gemini multimodal |
| `cubes/cube3_voice/providers/aws_provider.py` | 231 | AWS Transcribe batch |
| `cubes/cube3_voice/providers/aws_realtime.py` | 226 | AWS Transcribe streaming (WebSocket) |
| `cubes/cube3_voice/providers/azure_realtime.py` | 271 | Azure Speech Services streaming (WebSocket) |
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

### Cube 3 — Requirements.txt Data Tables

**Table: `voice_responses`** (11 columns per Requirements.txt spec)
| Variable | Type | Implemented? | Description |
|----------|------|-------------|-------------|
| id | UUID (PK) | Yes | Voice response unique identifier (via Base model) |
| response_meta_id | UUID (FK→response_meta) | Yes | 1:1 link to ResponseMeta record |
| language_code | VARCHAR(10) | Yes | Language for STT processing (ISO 639-1) |
| is_anonymous | BOOLEAN | Yes | Whether response is anonymized |
| audio_duration_sec | FLOAT | Yes | Duration of audio recording in seconds |
| audio_format | VARCHAR(20) | Yes | Audio format (webm, wav, mp3, ogg, m4a, flac) |
| audio_size_bytes | INTEGER | Yes | Size of uploaded audio file in bytes |
| stt_provider | VARCHAR(50) | Yes | Which STT provider was used (whisper, grok, gemini, aws) |
| transcript_text | TEXT | Yes | STT-generated transcript |
| transcript_confidence | FLOAT | Yes | STT confidence score (0.0-1.0) |
| submitted_at | TIMESTAMP | Yes | Submission timestamp (on ResponseMeta) |

**Table: `stt_providers`** (5 columns — backend NOT created as ORM table, provider config lives in factory.py)
| Variable | Type | Implemented? | Description |
|----------|------|-------------|-------------|
| id | SERIAL (PK) | No (in-code) | Auto-increment ID |
| name | VARCHAR(50) | Yes (enum) | Provider name: `whisper` / `grok` / `gemini` / `aws` |
| supported_languages | JSONB | Yes (in-code) | Array of language codes this provider supports |
| is_active | BOOLEAN | Yes (in-code) | Whether provider is available (API key check) |
| priority | INTEGER | Yes (in-code) | Failover priority (whisper=1, grok=2, gemini=3, aws=4) |

### Cube 3 — Inputs / Outputs

**Inputs:**
| Input | Source | Description |
|-------|--------|-------------|
| Audio stream | User device mic | Browser-captured audio via MediaRecorder API (webm default) |
| session_id | Cube 1 | Current session context |
| question_id | Cube 1 | Which question is being answered |
| participant_id | Cube 1 | User identity / anon hash |
| language_code | Cube 1 (participant record) | User's selected language for STT optimization |

**Outputs:**
| Output | Destination | Description |
|--------|-------------|-------------|
| Transcript text | Cube 2 pipeline (then Cube 4) | Converted text forwarded into text ingestion pipeline (PII → profanity → store) |
| STT confidence score | Cube 4, Cube 9 | Confidence of transcription accuracy for quality auditing |
| Token display trigger | Cube 5 (Gateway) | Triggers ♡/◬ calculation for immediate display |
| Submission event | Cube 5 (Gateway) | Notifies gateway of new voice response via Redis pub/sub |

### Cube 3 — Functions (Requirements.txt)
| Function | Status | Description |
|----------|--------|-------------|
| `capture_audio()` | **Implemented** | Initializes browser mic via MediaRecorder API, records audio stream (webm default, 6 formats accepted) |
| `select_stt_provider()` | **Implemented** | Picks best STT provider for the user's language (DB priority + language check + API key availability) |
| `transcribe_audio()` | **Implemented** | Sends audio to STT provider with language hint, returns transcript + confidence; circuit breaker failover across 4 providers |
| `validate_transcript()` | **Implemented** | Checks transcript is non-empty, confidence meets threshold (0.3 min), length truncation |
| `forward_to_text_pipeline()` | **Implemented** | Passes transcript into Cube 2's text validation pipeline (detect_pii → scrub_pii → detect_profanity → scrub_profanity) |
| `store_voice_response()` | **Implemented** | Writes voice response record to MongoDB (raw audio binary + raw transcript) + Postgres (ResponseMeta + VoiceResponse + TextResponse with CRS-08 hash) |
| `handle_stt_failure()` | **Implemented** | Circuit breaker: failover chain whisper → grok → gemini → aws; skips failed provider, retries remaining |
| `push_to_live_feed()` | Not implemented | Sends 33-word summary (from Cube 6) to Moderator hosting PC via WebSocket (if live_feed_enabled + paid tier) |

### Cube 3 — UI/UX Translation Strings (11 keys per Requirements.txt + 8 V2T Settings keys)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube3.voice.start_recording` | "Tap to speak" | Recording start button |
| `cube3.voice.recording` | "Recording... tap to stop" | Active recording indicator |
| `cube3.voice.stop_recording` | "Stop" | Stop recording button |
| `cube3.voice.processing` | "Converting speech to text..." | STT processing state |
| `cube3.voice.transcript_preview` | "Here's what we heard:" | Transcript preview header |
| `cube3.voice.confirm_submit` | "Submit this response" | Confirm transcript button |
| `cube3.voice.retry` | "Try again" | Re-record button |
| `cube3.voice.mic_permission` | "Please allow microphone access" | Mic permission prompt |
| `cube3.voice.mic_denied` | "Microphone access denied" | Permission denied error |
| `cube3.voice.no_speech` | "No speech detected — please try again" | Empty recording error |
| `cube3.voice.low_confidence` | "We're not confident in the transcription — please review" | Low confidence warning |

*Token display strings use shared globals: `shared.tokens.earned`, `shared.tokens.si_label`, `shared.tokens.ai_label`*

**V2T Provider Settings keys (8 additional — implementation-specific, in frontend lexicon):**
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube3.settings.v2t_provider` | "Voice-to-Text Provider" | V2T settings section heading |
| `cube3.settings.v2t_desc` | "Select the speech-to-text engine for voice responses in this session." | V2T settings description |
| `cube3.settings.v2t_active` | "Active Provider" | Currently active provider label |
| `cube3.settings.v2t_fallback` | "Circuit breaker failover: if primary fails, system auto-switches to next available provider." | Fallback explanation note |
| `cube3.settings.v2t_languages` | "languages supported" | Provider language count suffix |
| `cube3.settings.v2t_pricing` | "Cost Estimates" | Toggle label for pricing section |
| `cube3.settings.v2t_estimate_title` | "Estimated cost per 1,000 users (2 min avg)" | Pricing table heading |
| `cube3.settings.v2t_estimate_note` | "Based on ~2 min average voice response per user. Actual costs vary by audio length and provider pricing." | Pricing disclaimer |

### Cube 3 — CRS Traceability (Full DesignMatrix)

> **Note on CRS-09 mapping:** In the DesignMatrix, CRS-09 ("System clusters responses into meaningful AI themes") maps primarily to Cube 6 (AI Theme Pipeline). However, Cube 3 contributes to CRS-09 by ensuring voice transcripts are properly converted and forwarded into the same pipeline as text responses, so theme clustering covers both input modalities. The traceability below reflects Cube 3's direct CRS ownership.

| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Implemented** (hash) | 1 | System stores responses securely with timestamps + integrity verification | SHA-256 response_hash on voice transcript clean_text, matching Cube 2 pattern | AES-256 encryption at rest for stored audio + transcript data |
| CRS-15 | CRS-15.IN.WRS.015 | CRS-15.OUT.WRS.015 | **Implemented** | 2 | User submits voice responses (STT) instead of typing | 4 batch STT providers with circuit breaker failover, 6 audio formats, 25 MB max, confidence threshold 0.3 | Live word-by-word display via real-time STT (Azure + AWS streaming) |

### Cube 3 — DesignMatrix VOC (Voice of Customer)
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-08 | Voice responses need the same integrity guarantees as text | "If we accept voice input, we need to prove the transcript wasn't altered — same audit standard as typed responses." |
| CRS-15 | Users who cannot or prefer not to type need an equally reliable voice input option | "In a room of 200 people, some will want to speak instead of type — especially on phones. It has to just work." |
