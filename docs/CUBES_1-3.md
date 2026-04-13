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
- **Participant join:** anonymous + identified support, duplicate join detection, in-memory presence tracking
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
- **Live response feed:** Moderator sees real-time responses during polling with a **display mode toggle**:
  - **Toggle options:** "Live Feedback" (raw text, immediate) | "33-Word Summary" (AI-generated via Cube 6 Phase A)
  - **Default: Live Feedback** — raw response text appears immediately on submit, no AI API dependency. Default until Gemini / ChatGPT / Grok APIs are configured and resourced.
  - **33-Word Summary mode:** Shows AI-generated `summary_33` when available from Cube 6 Phase A. Falls back to client-side `summarizeTo33Words()` truncation if backend summary not yet ready.
  - All response paths generate display entries: user submit, mock polling, spiral test, pre-populated responses
  - **Expand/Collapse:** Inline feed toggles between 200px and 500px height
  - **Fullscreen mode:** Full-viewport overlay with close button — moderator can project live feed
  - **Backend broadcast (SSSES Task A5 — RESOLVED 2026-04-12):** `summary_33` is broadcast from backend after Cube 6 Phase A completes via `broadcast_event("summary_ready")` in `cube6_ai/service.py` lines 203-213. Dashboard listener (Task A6) RESOLVED 2026-04-12.
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
| `join_session()` | **Implemented** | language_code, results_opt_in, in-memory presence, login token |
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
| moderator_config | Input | Moderator UI | SIMULATED | Canned session configs from `frontend/lib/mock-data.ts` (3 default demos) |
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
| `join_session()` | SIMULATED | Creates mock participant in-memory; no DB write; no in-memory dict; auto-awards login token (1 ♡, 5 ◬) |
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
| 3 default demo sessions | `frontend/lib/mock-data.ts` | (1) eXeL AI Polling - Strategy Alignment / DEMO2026 (live, polling, Spiral Test + Ranking DnD), (2) AI Governance / PAST0001 (closed, 5000-user results + themes), (3) Team Innovation / STATIC01 (static_poll, 3-day countdown) |
| Per-session SIM data | `frontend/lib/sim-data/poll-{2-4}-*.ts` | Complete cube I/O per poll: state flows, 7 AI responses, themes, voice transcript, delays |
| Mock participants | `frontend/lib/mock-data.ts` | Auto-generated on join; `mockParticipantCount` tracks per-session count |
| Mock QR codes | `frontend/lib/mock-data.ts` | Real QR PNG generated from mock short_code string |
| 100-user spiral test data | `frontend/lib/sim-data/spiral-test-100-users.ts` | 100 canned responses, 12 MoT agent waves, 11 languages, 60-second staggered delays |
| Session state flows | `frontend/lib/sim-data/index.ts` | Live poll: 8 steps (draft->archived), Static poll: 7 steps (draft->archived) |

#### Simulation Pass Criteria

- 100% of existing Cube 1 tests must pass (70/70) with zero regressions
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

**Test Suite:** 2 files, 16 test classes, 59 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_session_service.py` | 12 | 36 | Service unit tests (+ static poll countdown) |
| `test_e2e_flows.py` | 4 | 23 | Moderator + User E2E flows |

**Moderator Test Flow (TestModeratorFlow):**
1. `create_session(full_config)` — All 11 Cube 1 fields + CQS weights
2. `add_questions(3)` — Three questions in draft state
3. `transition(draft→open)` — Sets `opened_at`
4. `transition(open→polling)` — Starts response collection
5. `transition(polling→ranking)` — AI theming phase
6. `transition(ranking→closed)` — Sets `closed_at`
7. `transition(closed→archived)` — Clears in-memory presence
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

---

### Cube 1 — Cross-Device Sync Test Procedures (Live Site)

These are **manual end-to-end tests** run against the live Cloudflare Pages deployment. They cover the 4-layer sync stack (Supabase Broadcast → Presence → CF KV → Supabase DB) across real devices and networks. Run all 4 scenarios in order for each release.

**Prerequisites:**
- Supabase project active (check app.supabase.com — free tier pauses after 7 days inactivity)
- `session_status` table exists with `title` and `polling_mode_type` columns (run `supabase/session_status.sql` + ALTER TABLE if not done)
- Live site deployed at https://exel-ai-polling.explore-096.workers.dev
- At least 2 real devices: Moderator on PC/laptop, participants on phone (different network preferred)

---

#### Scenario A — QR Code Join → Lobby → Start Polling

**Devices:** Moderator (PC), Participant 1 (Phone), Participant 2 (Computer/second browser tab)

**Steps:**
1. Moderator creates a new session on the dashboard. Note the 8-digit code.
2. Moderator does NOT click Start Polling yet.
3. Phone opens camera, scans the QR code displayed on the dashboard. Browser opens the join URL automatically.
4. Phone completes join flow: Language → Identity → Results → clicks Join. Lands in **waiting lobby** (shows session title + participant count + "Waiting for polling to start").
5. Computer user opens the join URL directly (copy from QR or dashboard). Completes same join flow. Lands in **waiting lobby**.
6. Moderator confirms participant count shows **2** on the dashboard.
7. Moderator clicks **Start Polling**.

**Expected results:**
- Phone: transitions from waiting lobby to **polling input screen** within ≤2 seconds. No manual refresh required.
- Computer user: same transition within ≤2 seconds.
- Dashboard live feed: ready to receive responses.
- QR code: still visible on dashboard (does not disappear after Start Polling).

**Pass criteria:** Both devices show polling input. No page stuck on lobby.

---

#### Scenario B — 8-Digit Code Join → Lobby → Start Polling

**Devices:** Moderator (PC), Participant 3 (Phone), Participant 4 (Computer/second browser tab)

**Steps:**
1. Moderator creates a new session. Note the 8-digit code (e.g. `J5GZVXQK`).
2. Moderator does NOT click Start Polling yet.
3. Phone opens the live site home page. Types the 8-digit code directly into the code entry field. Taps Join.
4. Phone completes join flow. Lands in **waiting lobby**.
5. Computer user opens site home page, types the same code, completes join flow. Lands in **waiting lobby**.
6. Moderator confirms participant count shows **2** on the dashboard.
7. Moderator clicks **Start Polling**.

**Expected results:**
- Phone: transitions from waiting lobby to **polling input screen** within ≤2 seconds.
- Computer user: same transition within ≤2 seconds.
- No "session not found" error on either device (Supabase DB row must exist from session creation).

**Pass criteria:** Both devices reach polling input. Direct code entry works without QR URL params.

---

#### Scenario C — Join After Start Polling (QR — Late Join Bypass)

**Devices:** Moderator (PC), Participant 5 (Phone), Participant 6 (Computer/second browser tab)

**Steps:**
1. Moderator creates a new session and immediately clicks **Start Polling** (session goes polling in one step).
2. Confirm dashboard shows polling state.
3. Phone scans the QR code **after** polling has already started.
4. Phone completes join flow (Language → Identity → Results → Join).
5. Computer user opens join URL **after** polling started. Completes join flow.

**Expected results:**
- Phone: upon clicking Join, **bypasses waiting lobby entirely** and lands directly on **polling input screen**.
- Computer user: same bypass behavior.
- No time spent in lobby. Transition happens at the moment of Join click, not after a polling-started broadcast.

**Pass criteria:** Neither device sees the waiting lobby at any point. Both land on polling input immediately on join.

---

#### Scenario D — Join After Start Polling (8-Digit Code — Late Join Bypass)

**Devices:** Moderator (PC), Participant 7 (Phone), Participant 8 (Computer/second browser tab)

**Steps:**
1. Moderator creates a new session and immediately clicks **Start Polling**.
2. Phone opens site home page and types the 8-digit code **after** polling has already started.
3. Phone completes join flow.
4. Computer user types the same 8-digit code **after** polling started. Completes join flow.

**Expected results:**
- Phone: bypasses waiting lobby, lands directly on **polling input screen**.
- Computer user: same.
- Participant count on dashboard increments for each join.

**Pass criteria:** Both devices bypass lobby. Direct code entry works post-polling-start.

---

#### Scenario E — Live Feed Verification (Response Submission)

**Devices:** Moderator (PC), any 2+ participant devices from Scenarios A–D

**Steps:**
1. With polling active and participants on polling input screen, each participant types a response and clicks Submit.
2. Moderator watches the **live feed** panel on the dashboard.

**Expected results:**
- Each submitted response appears in the moderator live feed within ≤2 seconds of submission.
- Response text is visible (33-Word summary or Raw toggle).
- Response count increments correctly.

**Pass criteria:** All submitted responses visible on dashboard live feed. **Confirmed working 2026-03-31** with real human input + 45 Ascended Master responses across 11 languages on session XS5RRFTY.

**Trinity Redundancy Architecture (LOCKED — DO NOT REVERT):**

**USER SENDS (3 parallel paths — any 1 succeeding = response delivered):**

| Path | Transport | Latency | Code Location | Dependency |
|------|-----------|:-------:|---------------|------------|
| **A** | Supabase Broadcast | ~50ms | `session-view.tsx:753` `broadcastToSession("new_response", {...})` | WebSocket |
| **B** | Supabase DB INSERT | ~200ms | `session-view.tsx:765` `supabase.from("responses").insert({...})` | HTTP REST |
| **C** | CF KV POST | ~100ms | `session-view.tsx:775` `fetch("/api/responses", {...})` | Cloudflare KV |

**MODERATOR RECEIVES (4 channels — any 1 succeeding = response displayed):**

| Channel | Source | Latency | Code Location | Dependency |
|---------|--------|:-------:|---------------|------------|
| **A** | Supabase Broadcast | ~50ms | `use-session-broadcast.ts:131` via `onNewResponse` callback | WebSocket |
| **B** | postgres_changes INSERT | ~100ms | `dashboard/page.tsx:327-333` on `responses` table | Supabase Realtime |
| **D** | HTTP REST poll (2s) | ~2s | `dashboard/page.tsx:340-363` polls Supabase REST | HTTP only (bulletproof) |

**DEMO MODE:** Direct callback (same tab, 0ms, no network) via `addSpiralResponse`

**Implementation (updated 2026-04-13):**
- **Single broadcast channel:** All broadcast events route through ONE `useSessionBroadcast` hook with ref-based callbacks. Prevents duplicate channel collision (Supabase JS v2 returns same object for same name).
- **Channel names:** `session:${shortCode}` (broadcast), `responses-db:${shortCode}` (postgres_changes), `status-db:${shortCode}` (session_status)
- **Dedup:** `seenIds` useRef Set prevents doubles when multiple channels fire
- **Broadcast config:** `{ config: { broadcast: { self: false } } }`
- **Voice:** Same 3-path Trinity as text, with `count` field (fixed 2026-04-13)

**AI Summary (Task A6: IMPLEMENTED):** `onSummaryReady` callback updates feed entry in-place by `response_id`.

**Theme Pipeline (Task B4: IMPLEMENTED):** `onThemesReady` callback enables ranking transition.

---

#### Participant Count (#Users) — Sync Architecture

| Sync Method | Direction | Latency | Code Location |
|-------------|-----------|:-------:|---------------|
| Broadcast `presence` | User → Moderator | ~50ms | `use-session-broadcast.ts` `onPresenceChange` |
| postgres_changes | DB → Moderator | ~100ms | `dashboard/page.tsx` Channel C on `session_status` |
| KV + Supabase poll | HTTP → Moderator | ~5s | `dashboard/page.tsx` KV fallback poll (5s) |

**Anti-regression:** `Math.max()` guard ensures count never decreases. Refs prevent stale closures.

---

#### Cross-Device Sync Test — Pass/Fail Summary Table

| Scenario | Entry Method | Join Timing | Phone Result | Computer Result | Pass? |
|----------|-------------|-------------|--------------|-----------------|-------|
| A | QR code | Before polling | Lobby → polling input on Start | Lobby → polling input on Start | |
| B | 8-digit code | Before polling | Lobby → polling input on Start | Lobby → polling input on Start | |
| C | QR code | After polling | Direct to polling input (no lobby) | Direct to polling input (no lobby) | |
| D | 8-digit code | After polling | Direct to polling input (no lobby) | Direct to polling input (no lobby) | |
| E | Any | Any | — | Live feed shows AI 33-word summaries (not truncated raw text) | |

**Full pass = all 5 scenarios green. Any failure = identify which sync layer failed (Broadcast / Presence / Supabase DB) and fix before releasing.**

---

#### Sync Layer Diagnostics (if a scenario fails)

| Symptom | Likely Failed Layer | Check |
|---------|-------------------|-------|
| Phone never leaves lobby after Start Polling | Layer 1 Broadcast or Layer 4 DB | Check Supabase project not paused; check `session_status` table has a row for the code |
| Phone toggles lobby ↔ polling input every second | Status regressions in `checkStatus` poll | Check `STATUS_ORDER` rank logic in `session-view.tsx` |
| 8-digit code shows "session not found" | Layer 4 DB missing row | Confirm `syncStatusToSupabase` fires on session CREATE in dashboard |
| Live feed shows raw text, not AI summary | Phase A not running or Cube 6 AI provider unavailable | Verify Cube 6 Phase A fires on submit; check AI provider API key; dashboard listener is IMPLEMENTED (Task A6) |
| Live feed empty on dashboard | Supabase Broadcast `new_response` not firing | Check Supabase project active; check `new_response` handler in `dashboard/page.tsx` |
| Works in same city, fails across regions | CF KV cross-datacenter miss (expected) | Confirm Layer 4 Supabase DB is covering it |

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
| `tests/cube1/test_session_service.py` | 645 | 36 unit tests (12 classes, incl. static poll countdown) |
| `tests/cube1/test_e2e_flows.py` | 691 | 23 E2E tests (4 classes: Moderator + User + Capacity + Determinism) |
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
| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target | Design Output: Definable / Measurable |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|--------------------------------------|
| CRS-01 | CRS-01.IN.SRS.001 | CRS-01.OUT.SRS.001 | **Implemented** | 1 | Moderator creates session + secure link/QR for instant participant access | QR + URL in <2s, 99.5% availability | Branded, expiring QR codes with analytics, 99.9% availability | Session created in < 500ms; short_code unique across 5 retry attempts; all 15+ fields persisted to `sessions` table; QR PNG + join URL returned in single response |
| CRS-01.01 | CRS-01.01.IN.SRS | CRS-01.01.OUT.SRS | **Implemented** | 1 | Moderator configures full session: type, polling mode, pricing tier, capacity, fee, cost-splitting, reward, CQS weights, anonymity, ranking mode, response/question limits, language | All 15+ session fields persisted correctly on `sessions` table | AI-suggested session presets based on past session analytics | All 15+ session config fields round-trip: POST creates with values, GET returns identical values; JSONB `cqs_weights` stores 6 numeric keys; Literal type validation rejects invalid enums with 422 |
| CRS-01.02 | CRS-01.02.IN.SRS | CRS-01.02.OUT.SRS | **Implemented** | 1 | System generates unique 8-char short code + QR PNG + shareable join URL | Collision-free 8-char code (5-attempt retry), QR PNG in <50ms | Animated/branded QR with embedded session metadata | 8-char alphanumeric code generated; DB uniqueness enforced via 5-attempt retry loop; QR PNG < 50ms generation; PNG magic bytes valid; join URL contains short_code |
| CRS-01.03 | CRS-01.03.IN.SRS | CRS-01.03.OUT.SRS | **Not implemented** | 2 | Moderator assigns scoping context (Project / Specification / Product Differentiator) at session creation | Scoping FK linkage stored on session; all downstream data inherits via `session_id` | Scoping hierarchy analytics: compare outcomes across differentiators | `scoping_type` ENUM persisted on session; `scoping_id` UUID FK resolves to valid project/specification/differentiator row; all downstream queries filter by `session_id` inheriting scope |
| CRS-02 | CRS-02.IN.WRS.002 | CRS-02.OUT.WRS.002 | **Implemented** | 1 | User joins via QR/link without authentication friction | Join in ≤3 clicks, <5s load | One-tap join with device auto-detection, <2s load | Join completes in <= 3 clicks, < 5s total; lobby auto-advance <= 2s via Supabase Broadcast; no page refresh required; participant record created with language_code + results_opt_in |
| CRS-02.01 | CRS-02.01.IN.WRS | CRS-02.01.OUT.WRS | **Implemented** | 1 | Anonymous join — no Bearer token required; `user_id=None` accepted | `get_optional_current_user()` allows null auth on join | Device fingerprinting for soft identity without login | `user_id=None` accepted on join endpoint; no 401 returned; participant record created with `anon_hash` populated; `get_optional_current_user()` returns None without error |
| CRS-02.02 | CRS-02.02.IN.WRS | CRS-02.02.OUT.WRS | **Implemented** | 1 | Join flow: Language → Identity → Results opt-in → Join (≤3 clicks) | All steps complete without page reload; join confirmed in <5s | Streamlined 1-click join for returning participants | 3-step join flow (Language, Identity, Results) completes without page reload; total time < 5s; `language_code`, `results_opt_in`, `payment_status` persisted on participant record |
| CRS-02.03 | CRS-02.03.IN.WRS | CRS-02.03.OUT.WRS | **Implemented** | 1 | Lobby wait state — participants see "Waiting for moderator" until Start Polling; auto-advance without refresh | Auto-advance ≤2s via Supabase Broadcast; late joiners bypass lobby entirely if session already polling | Pre-lobby content (session description, expected duration) shown while waiting | Lobby → polling transition <= 2s after moderator Start Polling; no manual refresh; late joiners (session already polling) bypass lobby entirely and land on input screen |
| CRS-03 | CRS-03.IN.SRS.003 | CRS-03.OUT.SRS.003 | **Implemented** | 1 | System generates collision-free session IDs bound to QR | Zero-collision UUID generation | Cryptographically signed rotating session identifiers | UUID generated per session; zero collisions under normal load; UUID bound to QR code content; QR scan resolves to correct session_id |
| CRS-03.01 | CRS-03.01.IN.SRS | CRS-03.01.OUT.SRS | **Implemented** | 1 | UUID5 seeded deterministic session ID — same seed always yields same ID (idempotent create) | Deterministic UUID5, duplicate seed returns existing session | SHA-256 signed session identity tokens | Same seed input produces identical UUID5 output across runs; duplicate seed returns existing session (not new); idempotency verified in test suite |
| CRS-03.02 | CRS-03.02.IN.SRS | CRS-03.02.OUT.SRS | **Implemented** | 1 | 8-char short code with DB uniqueness check and 5-attempt collision retry | Zero collision rate under normal load | Cryptographically random codes with entropy guarantee | 8-char code unique per DB constraint; 5-attempt retry on collision; retry exhaustion returns error (not silent failure); code character set is alphanumeric uppercase |
| CRS-04 | CRS-04.IN.SRS.004 | CRS-04.OUT.SRS.004 | **Implemented** | 1 | System validates QR access, blocks expired/invalid sessions | 100% expiry/validity enforcement | Geo-fencing and abuse-detection heuristics | 100% enforcement: expired sessions return 410 Gone; invalid-state joins return 409; closed/archived sessions blocked; no bypass path exists |
| CRS-04.01 | CRS-04.01.IN.SRS | CRS-04.01.OUT.SRS | **Implemented** | 1 | Session expiry (default 24h) — returns 410 Gone after `expires_at` | `SessionExpiredError` (410) on all join attempts post-expiry | Configurable expiry per session type; moderator extend-expiry action | `expires_at` defaults to now + 24h; all join attempts after `expires_at` return 410 `SessionExpiredError`; QR generation blocked for expired sessions |
| CRS-04.02 | CRS-04.02.IN.SRS | CRS-04.02.OUT.SRS | **Implemented** | 1 | Block joins on invalid states (draft joins rejected; closed/archived blocked) | `SessionStateError` on invalid state joins | Waitlist queue for at-capacity sessions | Draft-state join returns `SessionStateError`; closed/archived joins blocked; only `open` and `polling` states accept joins |
| CRS-04.03 | CRS-04.03.IN.SRS | CRS-04.03.OUT.SRS | **Implemented** | 1 | State machine with validated transitions only (draft→open→polling→ranking→closed→archived) | All 6 transitions enforced; invalid transitions return 409 | Automated state transitions on timer expiry for static polls | 6 valid transitions enforced; invalid transition attempts return 409; timestamps (`opened_at`, `closed_at`) set on relevant transitions; `ends_at` computed for static polls on polling transition |
| CRS-05 | CRS-05.IN.WRS.005 | CRS-05.OUT.WRS.005 | **Implemented** | 1 | Participant auto-advances to polling input when moderator clicks Start Polling — works on phone, computer, QR join, and direct code entry, whether in lobby or joining late | Status transition delivered to all participants ≤2s via Supabase Broadcast (Layer 1) with Presence (Layer 2) + Supabase DB (Layer 4) fallbacks; never requires page refresh | Sub-50ms delivery via WebSocket Broadcast confirmed in live test (2026-03-27, 13 participants); late joiners bypass lobby entirely | All participants receive status transition <= 2s; 4-layer sync stack (Broadcast + Presence + CF KV + Supabase DB); no page refresh required; confirmed ~50-70ms in live test with 13 participants |
| CRS-05.01 | CRS-05.01.IN.WRS | CRS-05.01.OUT.WRS | **Implemented** | 1 | Supabase Broadcast (Layer 1) — primary push for all status transitions | ~50–70ms delivery; `session_status` row written on every transition | Dedicated Realtime channel per session with heartbeat monitoring | Broadcast delivery ~50-70ms measured; `session_status` DB row written on CREATE and every transition; channel subscribed before send (no ad-hoc `.channel().send()`) |
| CRS-05.02 | CRS-05.02.IN.WRS | CRS-05.02.OUT.WRS | **Implemented** | 1 | Presence (Layer 2) — frontend uses Supabase `channel.track()` for late joiners; backend uses in-memory dict pattern for presence tracking | Presence state persists for joining participants; no polling required | Presence-based participant count shown to moderator in real time | Frontend `channel.track()` fires on join; backend in-memory dict + EXPIRE on join; presence persists for session duration; participant count accurate within 1s of join |
| CRS-05.03 | CRS-05.03.IN.WRS | CRS-05.03.OUT.WRS | **Implemented** | 1 | Supabase DB REST poll (Layer 4) — globally consistent fallback; covers all CF KV cross-region misses | 1.5s poll interval; `session_status` table read; `STATUS_ORDER` rank prevents regressions | Webhook-triggered DB update to eliminate polling entirely | 1.5s poll interval on `session_status` table; `STATUS_ORDER` rank enforced (status never regresses); covers cross-region CF KV misses; returns `title` + `polling_mode_type` for hydration |
| CRS-05.04 | CRS-05.04.IN.WRS | CRS-05.04.OUT.WRS | **Implemented** | 1 | Late joiner bypass — participants joining after polling starts skip lobby and land directly on polling input | Bypass logic in `join_session()` + `session-view.tsx`; status checked at join time | Server-sent event to remove polling client-side entirely | Late joiners (session status = polling) bypass lobby with zero lobby time; bypass logic verified in both `join_session()` backend and `session-view.tsx` frontend; tested in Scenarios C + D |

**CRS-05 Cross-Device Sync Architecture (4-Layer Stack):**
| Layer | Mechanism | Latency | Dependency | Failure Mode |
|-------|-----------|---------|------------|-------------|
| 1 | Supabase Broadcast (WebSocket) | ~50–70ms | Supabase project active | Silent if Supabase paused |
| 2 | Presence (frontend: Supabase `channel.track()`; backend: in-memory dict) | ~50–70ms | Supabase project active + Supabase available | Persists for late joiners via `channel.track()`; backend presence via in-memory dict pattern |
| 3 | CF KV poll (1s HTTP) | ~1s | `RESPONSES` KV binding in CF Pages | Per-datacenter; cross-region miss without binding |
| 4 | Supabase DB poll (1.5s HTTP REST) | ~1.5s | `session_status` table exists | Globally consistent; covers all CF KV misses |

**CRS-05 Key Behaviours Tested by Scenarios A–E:**
- `session_status` row written at session CREATE (not just on transition) → enables direct 8-digit code join
- `fetchStatusFromSupabase` returns `title` + `polling_mode_type` → session hydration without QR URL params
- Status never regresses: `STATUS_ORDER` rank enforced in `checkStatus` — once "polling", local stale "open" ignored
- `new_response` broadcast routed to `feedResponses` on dashboard → live feed updates without KV

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

## Cube 2 — Text Submission Handler: IMPLEMENTED (CRS-05→CRS-08 done; ~92% SSSES; CRS-07.03 live feed toggle — SSSES Tasks A4/A5/A6 RESOLVED 2026-04-12)

**Code location:** `backend/app/cubes/cube2_text/` (modular, self-contained)

### Cube 2 — Implemented
- **Text validation:** Unicode-aware length check, whitespace stripping, max_response_length from session
- **PII detection:** Transformer NER (Davlan/xlm-roberta-large-ner-hrl) + regex fallback (email, phone, SSN, CC, IP)
- **PII scrubbing:** [TYPE_REDACTED] placeholder replacement, position-preserving reverse processing
- **Profanity detection:** DB-driven profanity_filters table by language_code, regex matching
- **Profanity scrubbing:** Configured replacements, non-blocking (submission proceeds regardless)
- **PostgreSQL storage:** ResponseMeta + TextResponse (single store)
- **Supabase broadcast:** Publishes `response_submitted` event for Cube 6 downstream consumption
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
| CRS | Input ID | Output ID | Status | DTM Stretch Target | Design Output: Definable / Measurable |
|-----|----------|-----------|--------|-------------------|--------------------------------------|
| CRS-05 | CRS-05.IN.SRS.005 | CRS-05.OUT.SRS.005 | **Complete** | Post-session reveal opt-in | Anonymity mode enforced per session config; anonymous submissions have `participant_id=None` + `anon_hash` populated |
| CRS-05.01 | CRS-05.01.IN.SRS | CRS-05.01.OUT.SRS | **Complete** | Device fingerprinting for soft identity | `anon_hash` deterministic: same participant always produces same hash; hash is 64-char hex SHA-256 |
| CRS-05.02 | CRS-05.02.IN.SRS | CRS-05.02.OUT.SRS | **Complete** | Post-session identity reveal opt-in for anonymized users | Identified mode preserves `participant_id` on all submissions; linkage verified across multiple responses |
| CRS-05.03 | CRS-05.03.IN.SRS | CRS-05.03.OUT.SRS | **Complete** | Pseudonymous audit trail for compliance | Pseudonymous mode stores both `participant_id` + `anon_hash`; dual identity verified in test fixtures |
| CRS-06 | CRS-06.IN.SRS.006 | CRS-06.OUT.SRS.006 | **Complete** | Scheduled auto-open/close | State transition instant; submissions rejected with `SessionNotPollingError` outside polling window |
| CRS-06.01 | CRS-06.01.IN.SRS | CRS-06.01.OUT.SRS | **Complete** | Time-based auto-open with countdown | `validate_session_for_submission()` returns error for non-polling sessions; 100% rejection rate verified |
| CRS-06.02 | CRS-06.02.IN.SRS | CRS-06.02.OUT.SRS | **Complete** | Stop Polling triggers Cube 6 Phase B (theming pipeline) | Stop Polling triggers Phase B within 1s of `polling→ranking` transition; pipeline entry logged |
| CRS-07 | CRS-07.IN.WRS.007 | CRS-07.OUT.WRS.007 | **Complete** | Rich text + autosave drafts | Response stored in PostgreSQL within 200ms; SHA-256 hash computed on `clean_text`; PII scrubbed before storage; up to 5000 chars Unicode-aware |
| CRS-07.01 | CRS-07.01.IN.WRS | CRS-07.01.OUT.WRS | **Complete** | 33-language text pipeline (validate → PII → profanity → store → publish) | 6-step pipeline executes in order (validate→PII detect→PII scrub→profanity→store→publish); any step failure returns structured error; Supabase broadcast event published on success |
| CRS-07.02 | CRS-07.02.IN.WRS | CRS-07.02.OUT.WRS | **Complete** | Voice transcript routed through Cube 2 pipeline (Cube 3 → Cube 2) | Voice transcripts pass through identical PII + profanity pipeline as text; `source=voice` on `response_meta`; same `clean_text` output |
| CRS-07.03 | CRS-07.03.IN.WRS | CRS-07.03.OUT.WRS | **Implemented** — SSSES Tasks A4/A5/A6 RESOLVED 2026-04-12 | Moderator live feed toggle: raw text (default) vs AI 33-word summary | Toggle persists per session in localStorage; `summary_33` broadcast <= 5s after submission; fallback to client truncation if Phase A pending |
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Complete** (hash) | AES-256 encryption at rest | SHA-256 integrity hash matches `clean_text`; PII types logged in JSONB; 64-char hex hash on every response |
| CRS-08.01 | CRS-08.01.IN.SRS | CRS-08.01.OUT.SRS | **Complete** | SHA-256 response_hash — tamper-evident integrity on every submission | `response_hash` = 64-char hex SHA-256 of `raw_text`; deterministic (same text = same hash); verified across Unicode inputs |
| CRS-08.02 | CRS-08.02.IN.SRS | CRS-08.02.OUT.SRS | **Complete** | PII strip gate — only `clean_text` forwarded to Cube 6 AI, never raw input | `summarize_single_response()` receives `clean_text` only; structured log `cube6.phase_a.pii_safe: true` at entry; raw text never leaves storage boundary |
| CRS-08.03 | CRS-08.03.IN.SRS | CRS-08.03.OUT.SRS | **Not implemented** (stretch) | AES-256 at-rest encryption for PostgreSQL response_meta + text_responses | Field-level AES-256 on `raw_text`, `clean_text`, `pii_scrubbed_text`; encryption key rotation supported; decryption only at read time |

### Cube 2 — Not Yet Implemented
- **`push_to_live_feed()`** — Backend Supabase broadcast of `summary_33` to Moderator live feed after Cube 6 Phase A completes. **Root cause of live feed gap** — see SSSES Tasks A4, A5.
- **`summary_33` in `TextResponseRead` schema** — field missing from response schema; frontend cast always returns `undefined`. SSSES Task A4.
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
| submission_event | Output | Cube 5 (Gateway) | BOTH | Supabase broadcast event published in production; in SIM, `mockResponses` push + optional Cloudflare Cache API POST |
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
| `store_text_response()` | SIMULATED | Writes to `mockResponses[sessionId]` in-memory array; no PostgreSQL write in SIM |
| `emit_submission_event()` | BOTH | In SIM: pushes to local `mockResponses[]` + fire-and-forget POST to `/api/responses` (Cloudflare Cache API). In production: Supabase broadcast `response_submitted` |
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
- **N=5 baseline (2026-02-18):** 64/64 tests, 2,903ms avg backend duration, 0 TS errors
- **N=9 extended (2026-02-23):** 173/173 tests (all cubes), 3,507ms avg, 0 TS errors
- **N=18 bidirectional (2026-02-25):** 198/198 tests, forward + backward pass, 0 failures, 0 regressions
- **N=18 bidirectional (2026-02-26):** 287/287 tests (includes Cubes 4-6), 0 failures, 0 regressions

### Cube 2 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube2/ -v --tb=short
```

**Test Suite:** 2 files, 20 test classes, 66 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_text_service.py` | 14 | 36 | Unit tests (validation, PII, profanity, pub/sub, queries, fault tolerance, semaphore bounds) |
| `test_e2e_flows.py` | 6 | 30 | E2E flows (submission, PII, profanity, anonymization, CRS-08, language) |

**Submission Test Flow (TestSubmissionFlow):**
1. `create_session(polling)` → `submit_text_response()` — Full pipeline E2E
2. `verify_db_write` — Raw text stored in PostgreSQL (response_meta.raw_text)
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
| `tests/cube2/test_text_service.py` | 499 | 36 unit tests (14 classes) |
| `tests/cube2/test_e2e_flows.py` | 716 | 30 E2E tests (6 classes) + CUBE2_TEST_METHOD |

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
| response_meta_id | UUID (PK) | Yes | Response meta record identifier for raw content |
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

> **Supabase Migration Gap (identified 2026-04-12, 20-agent audit):**
> The tables `response_meta`, `text_responses`, `voice_responses`, and `profanity_filters` are defined in SQLAlchemy ORM models but are **missing from Supabase migrations**. They auto-create via SQLAlchemy but lack explicit migration files, which means:
> - No Supabase Realtime subscriptions can be configured (requires table in Supabase schema)
> - No Row Level Security (RLS) policies are applied
> - **Recommendation:** Create `supabase/migrations/012_response_tables.sql` with CREATE TABLE + RLS policies for all four tables.

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
| Submission event (Supabase broadcast) | Cube 5 (Gateway), Cube 6 (AI) | Publishes `response_submitted` via Supabase broadcast; consumed by Cube 6 for Phase A |
| `summary_33` broadcast | Moderator live feed (dashboard) | **RESOLVED 2026-04-12** — AI 33-word summary broadcast via Supabase after Cube 6 Phase A completes (`cube6_ai/service.py` lines 203-213, SSSES Task A5). Dashboard listener (Task A6) RESOLVED 2026-04-12. |

### Cube 2 — Functions (Requirements.txt)
| Function | Status | Description |
|----------|--------|-------------|
| `validate_text_input()` | **Implemented** | Validates length (Unicode-aware), non-empty, within char limit |
| `detect_language()` | **Implemented** (heuristic) | Confirms text matches selected language (Unicode script-based sanity check) |
| `detect_pii()` | **Implemented** | Scans for PII patterns (email, phone, SSN, CC, IP) via NER + regex fallback |
| `scrub_pii()` | **Implemented** | Redacts detected PII from response text with [TYPE_REDACTED] placeholders |
| `detect_profanity()` | **Implemented** | Checks against language-specific profanity filters from DB |
| `anonymize_response()` | **Implemented** | Strips identifying info based on session anonymity_mode (anonymous/identified/pseudonymous) |
| `store_text_response()` | **Implemented** | Writes validated response to PostgreSQL (ResponseMeta + TextResponse) |
| `emit_submission_event()` | **Implemented** | Publishes `response_submitted` to Supabase broadcast for Cube 6 consumption. **Does not include `summary_33`** — summary is generated async by Cube 6 Phase A after this event fires. |
| `push_to_live_feed()` | **RESOLVED — SSSES Task A5 + A6** | After Cube 6 Phase A generates `summary_33`, backend broadcasts `summary_ready` event via Supabase to Moderator dashboard (`cube6_ai/service.py` lines 203-213). Dashboard listener (Task A6) RESOLVED 2026-04-12. |

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
| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target | Design Output: Definable / Measurable |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|--------------------------------------|
| CRS-05 | CRS-05.IN.SRS.005 | CRS-05.OUT.SRS.005 | **Implemented** | 1 | System supports anonymous vs identified modes configurable by Moderator | 100% anonymity enforcement per session mode | Post-session reveal opt-in for anonymized users | Anonymity mode read from `session.anonymity_mode`; anonymous: `participant_id=None` + `anon_hash` on every submission; identified: `participant_id` preserved; 100% enforcement verified across 3 modes |
| CRS-05.01 | CRS-05.01.IN.SRS | CRS-05.01.OUT.SRS | **Implemented** | 1 | Anonymous mode: `user_id=None` + deterministic `anon_hash` generated per participant | 100% hash determinism; same participant always same hash | Device fingerprinting for soft re-identification | `anon_hash` = SHA-256 of participant_id; same pid always yields same 64-char hex hash; different pids yield different hashes; verified deterministic in test suite |
| CRS-05.02 | CRS-05.02.IN.SRS | CRS-05.02.OUT.SRS | **Implemented** | 1 | Identified mode: `participant_id` preserved on submission | Participant linkage maintained across all responses in session | Post-session opt-in reveal for anonymized users | `participant_id` UUID persisted on `response_meta` for all submissions in identified mode; linkage queryable across multiple responses per session |
| CRS-05.03 | CRS-05.03.IN.SRS | CRS-05.03.OUT.SRS | **Implemented** | 1 | Pseudonymous mode: both `participant_id` + `anon_hash` stored | Dual identity preserved for compliance audit trail | Configurable pseudonymity window (auto-expire after N days) | Both `participant_id` and `anon_hash` non-null on submission; dual identity round-trips through API; compliance audit query returns both fields |
| CRS-06 | CRS-06.IN.SRS.006 | CRS-06.OUT.SRS.006 | **Implemented** | 1 | Moderator opens/closes polling window deliberately | Instant state transitions, 100% enforcement | Scheduled auto-open/close with time-based rules | State transition executes in < 100ms; 100% rejection of submissions outside polling window; `SessionNotPollingError` returned for non-polling sessions |
| CRS-06.01 | CRS-06.01.IN.SRS | CRS-06.01.OUT.SRS | **Implemented** | 1 | Start Polling: `validate_session_for_submission()` enforces `status == "polling"` before accepting any response | 100% rejection of submissions outside polling window | Time-based auto-open with moderator-set schedule | `validate_session_for_submission()` checks `status == "polling"`; returns structured error for draft/open/ranking/closed/archived; 0% bypass rate |
| CRS-06.02 | CRS-06.02.IN.SRS | CRS-06.02.OUT.SRS | **Implemented** | 1 | Stop Polling: session transitions `polling → ranking`; triggers Cube 6 Phase B pipeline | Phase B fires within 1s of status transition | Graceful drain — accept in-flight submissions up to 5s after close | `polling→ranking` transition sets `closed_at` timestamp; Phase B pipeline triggered within 1s; subsequent submissions rejected immediately |
| CRS-07 | CRS-07.IN.WRS.007 | CRS-07.OUT.WRS.007 | **Implemented** | 1 | User submits text responses reliably with constraints | Full pipeline (validate → PII → profanity → store → publish), up to 5000 chars, Unicode-aware | Rich text formatting + autosave drafts | Response stored in PostgreSQL within 200ms; SHA-256 hash computed on `clean_text`; PII scrubbed before storage; Unicode char count (not byte); up to 5000 chars; Supabase broadcast event published |
| CRS-07.01 | CRS-07.01.IN.WRS | CRS-07.01.OUT.WRS | **Implemented** | 1 | Full text submission pipeline: validate → PII detect/scrub → profanity detect/scrub → store (PostgreSQL) → Supabase broadcast | All 6 steps execute in order; any step failure returns structured error; submission non-blocking for profanity | Autosave drafts — in-progress text preserved across device events | 6-step pipeline: validate (length + non-empty) → PII detect (NER + regex) → PII scrub ([TYPE_REDACTED]) → profanity detect (DB patterns) → store (ResponseMeta + TextResponse) → broadcast (Supabase `response_submitted`); profanity non-blocking |
| CRS-07.02 | CRS-07.02.IN.WRS | CRS-07.02.OUT.WRS | **Implemented** | 1 | Multilingual support: 33 languages, Unicode-aware length check, script-based language sanity check | Unicode char count (not byte count); CJK, Arabic, Emoji all accepted | ML-based language detection replacing Unicode heuristic | Unicode `len()` used (not `encode()` byte count); CJK, Arabic, Korean, Emoji inputs accepted and stored; language_code validated against 13 non-Latin scripts; mismatch logged but non-blocking |
| CRS-07.03 | CRS-07.03.IN.WRS | CRS-07.03.OUT.WRS | **In progress** — SSSES Tasks A4/A6 (A5 IMPLEMENTED) | 1 | Moderator live feed toggle: "Live Feedback" (raw `clean_text`, default) vs "33-Word Summary" (AI `summary_33` via Cube 6 Phase A) | Toggle persisted per session; `summary_33` broadcast from backend ≤5s after submission; fallback to client truncation if Phase A pending | Real-time sentiment indicator alongside live feed entries | Toggle stored in localStorage keyed by session_code; `summary_ready` broadcast arrives <= 5s; feed entry updated in-place by `response_id`; fallback `summarizeTo33Words()` fires if broadcast not received within timeout |
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Implemented** (hash) | 1 | System stores responses securely with timestamps + integrity verification | SHA-256 response_hash on every response, timestamp on submission | AES-256 encryption at rest for all stored response data | SHA-256 `response_hash` = 64-char hex on every response; `submitted_at` timestamp on `response_meta`; hash deterministic for identical inputs; integrity verifiable by client via API |
| CRS-08.01 | CRS-08.01.IN.SRS | CRS-08.01.OUT.SRS | **Implemented** | 1 | SHA-256 integrity hash: `response_hash = SHA256(raw_text)` stored on `text_responses.response_hash`; returned in API for client verification | 64-char hex hash; deterministic for identical inputs; verified in tests | Tamper-evident hash chain linking all responses in a session | `response_hash` = `hashlib.sha256(raw_text.encode()).hexdigest()`; 64-char hex; same text always same hash; different text always different hash; Unicode text hashes correctly; returned in `TextResponseRead` |
| CRS-08.02 | CRS-08.02.IN.SRS | CRS-08.02.OUT.SRS | **Implemented** | 1 | PII security gate: only `clean_text` (post-scrub) forwarded to Cube 6 AI — raw text never leaves storage boundary | Verified at callsite: `summarize_single_response(raw_text=clean_text)`; structured log `cube6.phase_a.pii_safe: true` | Automated PII scan report per session for compliance export | `clean_text` (not `raw_text`) passed to `summarize_single_response()`; structured log `cube6.phase_a.pii_safe: true` at entry; test fixture with injected PII confirms raw text never reaches AI provider |
| CRS-08.03 | CRS-08.03.IN.SRS | CRS-08.03.OUT.SRS | **Not implemented** (stretch) | 3 | AES-256 encryption at rest for all stored response data (PostgreSQL) | Field-level encryption on `raw_text`, `clean_text`, `pii_scrubbed_text` | HSM-backed key management with per-org rotation policy | AES-256 field-level encryption on `raw_text`, `clean_text`, `pii_scrubbed_text` columns; encryption key per-org; key rotation without re-encryption downtime; decryption only at read time |

### Cube 2 — DesignMatrix VOC (Voice of Customer)
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-05 | Participants need confidence that their identity is protected when promised | "People won't be honest if they think their name is attached — anonymity is critical for real feedback." |
| CRS-06 | Moderators need clear control over when polling starts and stops | "I need to be able to say 'go' and 'stop' — not have the system decide for me." |
| CRS-07 | Users need a reliable, fast text submission experience across all devices and languages | "It has to work on my phone in Spanish just as well as on a laptop in English." |
| CRS-08 | Enterprise customers require data integrity and security guarantees | "We need to prove that responses weren't tampered with after submission — audit trail is non-negotiable." |

---

## Cube 3 — Voice-to-Text Engine: **~87% SSSES** (CRS-08, CRS-15 complete; SSSES Phase 1-3 audit done 2026-04-07; Tasks A0-A7 COMPLETE)

**Code location:** `backend/app/cubes/cube3_voice/` (modular, self-contained)

### Cube 3 — Implemented
- **Browser mic capture:** MediaRecorder API (webm default), audio blob → FormData upload
- **STT providers (3 batch at launch):** OpenAI Whisper, Gemini (Google), AWS Transcribe. *(Grok removed — 403 permission error; still available for AI theming in Cube 6.)*
- **Provider abstraction:** `STTProvider` ABC with `transcribe()`, `supports_language()`, `model_id()`
- **Circuit breaker failover:** whisper → gemini → aws (skips failed provider, retries remaining). *(Grok removed from chain.)*
- **Provider selection:** Moderator default (session.ai_provider) → User override (if allow_user_stt_choice)
- **Transcript validation:** Non-empty check, confidence threshold (0.3 min), length truncation
- **Cube 2 pipeline integration:** Voice transcripts → detect_pii → scrub_pii → detect_profanity → scrub_profanity
- **PostgreSQL storage:** ResponseMeta + VoiceResponse + TextResponse (single store)
- **Response integrity (CRS-08):** SHA-256 hash of clean_text stored on TextResponse.response_hash, returned in API
- **Time tracking (Cube 5):** start_time_tracking on submit, stop_time_tracking after store, ♡/◬ tokens returned
- **Supabase broadcast:** Publishes `response_submitted` event for Cube 6 downstream consumption
- **Immediate token display:** ♡ and ◬ returned in submission response for instant UI feedback
- **Real-time STT (paid feature):** WebSocket endpoint with Azure (primary) + AWS (fallback) streaming
- **Metrics:** System/User/Outcome metrics endpoints for Cube 10 simulation
- **Security:**
  - CRS-08: SHA-256 response_hash for integrity verification
  - CRS-15: Voice submission with audio validation (format, size, empty check)
- **API endpoints:** 5 routes (submit voice, list voice responses, get detail, metrics, realtime WebSocket)
- **Rate limiting:** 60/min on submit endpoint
- **Audio limits:** Max 25 MB upload, accepted formats: webm, wav, mp3, ogg, m4a, flac

### Cube 3 — SSSES Phase 1-3 Completion (2026-04-07)

**Phase 1 (Security + Stability):** Auth enforcement on metrics (moderator-only), 30s STT API timeout, dynamic PII gate assertion (Task A7), response_hash in schema (CRS-08), background task session isolation.

**Phase 2 (Cost + Scalability):** `summary_33` in voice schemas + JOIN response_summaries, `cost_usd` per STT call (3 providers; Grok removed — 403), provider config with cost rates (Gemini primary), circuit breaker state (3 failures + 60s cooldown), concurrency semaphore (20/session), WebSocket 5-min timeout + mid-stream recovery, thread-safe provider singleton.

**Phase 3 (Extraction + Translation + Frontend):**
- `core/text_pipeline.py` — shared PII+profanity pipeline (eliminates Cube 2/3 duplication)
- `core/phase_a_retry.py` — shared Phase A retry with MoT-2 <33-word auto-fallback + Task A5 live broadcast
- English-default translation — auto-translate non-EN transcripts to English for downstream
- Metrics optimization — provider success rates + total STT cost tracking
- Frontend voice-input — recording duration timer, confidence display, retry button, cost_usd per call
- 4 lexicon keys added: `no_speech`, `low_confidence`, `confidence_label`, `reduce_to_33`
- MoT-1: "Reduce to 33 words" button in moderator live feed (fullscreen + compact)

**Phase 4 (Final Optimization — 2026-04-07):**
- Removed broken `_translate_to_english()` (imported non-existent `call_ai_provider`) — translation handled by Cube 6 Phase A/B prompts
- English translation for summaries (333/111/33) AND themes (Theme1 + Theme2) handled by Cube 6 via `language_code` parameter
- Wired `_provider_lock` — thread-safe async provider factory (`get_stt_provider_safe`)
- Tests for non-EN language propagation to Phase A (confirms `language_code="es"` reaches Cube 6)
- Export to local languages: future paid feature (cost + 50% margin charged to customer)

**Lexicon Key Mapping (spec ↔ code):**
| Requirements.txt Key | lexicon-data.ts Key | Reason |
|---------------------|-------------------|--------|
| `cube3.voice.start_recording` | `cube3.voice.record` | Shorter key; translated in 33 languages |
| `cube3.voice.stop_recording` | `cube3.voice.stop` | Shorter key; translated in 33 languages |
| `cube3.voice.transcript_preview` | `cube3.voice.preview` | Shorter key; translated in 33 languages |
| `cube3.voice.confirm_submit` | `cube3.voice.confirm` | Shorter key; translated in 33 languages |

*Canonical spec keys differ from code keys for brevity. All 30 cube3 keys (22 voice + 8 settings) present and translated.*

**Tests:** 92 passed + 8 skipped (live STT), 0 TSC errors
**SSSES:** Security 90, Stability 90, Scalability 85, Efficiency 85, Succinctness 85 = **87/100** (evidence-based; see gaps below)

### Cube 3 — STT Providers at Launch
| Provider | Model ID | Type | Languages | Notes |
|----------|----------|------|-----------|-------|
| OpenAI Whisper | whisper-1 | Batch | 33 | Primary default |
| ~~Grok (xAI)~~ | whisper-large-v3 | Batch | 33 | **REMOVED 2026-04-12** — 403 permission error. Still available for AI theming (Cube 6). |
| Gemini (Google) | gemini-2.0-flash | Batch | 33 | Multimodal audio input |
| AWS Transcribe | aws-transcribe | Batch | 23 | S3 upload → batch job |
| Azure Speech | azure-stt | Real-time | 30+ | Paid feature, WebSocket |
| AWS Transcribe Streaming | aws-streaming | Real-time | 23 | Fallback for Azure |

### Cube 3 — Known Gaps (Deferred to Real-time STT Launch)

The following gaps exist ONLY in the **real-time WebSocket STT path** (paid feature, not yet live). Batch voice path is 100% production-ready.

| # | Gap | File | Impact | Deferred Until |
|---|------|------|--------|---------------|
| RT-1 | Gemini provider async/sync client mismatch | `gemini_provider.py:52,85` | Gemini not used in realtime | Gemini STT production enablement |
| RT-2 | Realtime `cost_usd` always 0.0 (duration hardcoded) | `realtime.py:272` | Cost transparency missing | Realtime STT launch |
| RT-3 | `push_audio()` sync/async mismatch (Azure vs AWS) | `realtime.py:214-217` | AWS fallback may crash | Realtime STT launch |
| RT-4 | No Phase A task in realtime flow (no summaries) | `realtime.py:331` | No 33-word summaries | Realtime STT launch |

### Cube 3 — CRS Naming Convention
> **Standard:** `CRS-##.##` (two-digit parent + two-digit sub). Example: `CRS-15.04`.
> Sub-CRS numbers increment sequentially within each parent CRS.
> Feedback auto-tags: `cube_id=3` + `crs_id=CRS-##` + `sub_crs_id=CRS-##.##`.
> Items not mapping to any CRS are tagged `feedback_type=DI` (Design Idea).

### Cube 3 — CRS Traceability (Standardized 2026-04-07 — Phases 1-5 Complete)
| CRS | Status | Phase | Evidence (file:line) | Design Output |
|-----|--------|:-----:|---------------------|---------------|
| **CRS-08** | **Complete** | P1.4 | `service.py:477` `hashlib.sha256()` | SHA-256 on `clean_text`; 64-char hex; deterministic; stored + returned in API |
| **CRS-08.01** | **Complete** | P1.4 | `schemas/voice.py:40` `response_hash` field; `service.py:600` in return dict | Hash in schema, E2E test confirms presence |
| **CRS-08.02** | **Complete** | P1.3+P5.5 | `service.py:516` dynamic `pii_gate_passed`; `core/phase_a_retry.py:82` forwards only `clean_text` | PII gate: `(not pii_detected) or (clean_text != transcript)`; warning log; Phase A receives clean_text only |
| **CRS-08.03** | **Complete** | P5.1 | `core/phase_a_retry.py:52-59` empty text guard | Empty/whitespace text skipped before reaching Cube 6 |
| **CRS-08.04** | **Complete** | P3.1a | `core/text_pipeline.py:35-75` shared pipeline | PII+profanity pipeline extracted to shared module; batch + realtime use same path |
| **CRS-08.05** | Stretch | — | Not implemented | AES-256 at-rest encryption (per-org key); deferred |
| **CRS-15** | **Complete** | Baseline+P2 | 3 batch + 2 realtime providers in `providers/` | 3 batch (Whisper, Gemini, AWS) + 2 realtime (Azure, AWS Streaming). Grok removed (403). |
| **CRS-15.01** | **Complete** | Baseline+P5.4 | `router.py:69-83` format/size; `service.py:253` confidence ≥0.3; `ResponseNotFoundError` | 6 formats; 25 MB max; confidence threshold; correct 404 |
| **CRS-15.02** | **Complete** | P2.2 | `providers/base.py:44-55` `compute_stt_cost()` | Cost per call: Whisper $0.006, Gemini $0.00016, AWS $0.024 /min. *(Grok $0.006 removed — 403.)* |
| **CRS-15.03** | **Complete** | P2.3 | `models/stt_provider.py:26-28` `cost_per_minute_usd` + `is_primary` | Provider registry; Gemini-first fallback (cheapest) |
| **CRS-15.04** | **Complete** | P1.2+P2.4 | `service.py:56` 30s timeout; `core/circuit_breaker.py` CB class | `asyncio.wait_for(30s)`; whisper→gemini→aws; 3-failure/60s cooldown; auto-skip + reset. *(Grok removed from chain.)* |
| **CRS-15.05** | **Complete** | P2.5 | `service.py:66-75` `asyncio.Semaphore(20)` per session | Concurrency cap: max 20 parallel STT calls per session |
| **CRS-15.06** | **Complete** | P2.7+P4.2 | `factory.py:31,72-77` `get_stt_provider_safe()` | Thread-safe async singleton; prevents race on concurrent init |
| **CRS-15.07** | **Complete** | P2.6 | `realtime.py:176` 5-min timeout; `realtime.py:212-221` recovery | WebSocket: 300s max; push_audio + stt.stop() error caught; payment gate |
| **CRS-15.08** | Deferred | RT-1→4 | Documented in Known Gaps section | 4 realtime gaps deferred to paid feature launch |

### Cube 3 — SSSES Task Traceability (Phases 1-5)
| Task | CRS Link | Status | Phase | Evidence |
|------|----------|:------:|:-----:|----------|
| **A0** | CRS-08.03 | **DONE** | P3.1b+P5.1 | `core/phase_a_retry.py:52-70` <33-word fallback + empty text guard |
| **A2** | CRS-15.04 | **DONE** | P1.5→P3.1b | `core/phase_a_retry.py:74-108` exponential backoff (1s, 2s, 4s) |
| **A4** | CRS-08 | **DONE** | P2.1+P5.6 | `schemas/voice.py:42-45` `summary_33` with async docstring |
| **A5** | CRS-15 | **DONE** | P3.1b | `core/phase_a_retry.py:159-177` `broadcast_event("summary_ready")` |
| **A6** | CRS-15 | **DONE** | Baseline | `dashboard/page.tsx:274` `.on("broadcast", {event: "summary_ready"})` |
| **A7** | CRS-08.02 | **DONE** | P1.3+P5.5 | `service.py:515-533` dynamic PII gate + warning log |
| **MoT-1** | CRS-15 | **DONE** | P3.3c | `dashboard/page.tsx:732,885` "Reduce to 33 words" button |
| **MoT-2** | CRS-08.03 | **DONE** | P3.1b | `core/phase_a_retry.py:52` `if word_count <= 33` → skip AI |
| **MoT-3** | CRS-15.02 | **DONE** | P3.3a | `voice-input.tsx:235-240` cost_usd display per submission |

### Cube 3 — Not Yet Implemented (Remaining)
- **CRS-08.03:** AES-256 at-rest encryption — stretch target, deferred
- **Language-specific STT model tuning** — per-language model selection optimization
- **Audio playback** — Supabase Storage for audio binary retrieval + replay
- **Voice-specific profanity seed data** — speech patterns differ from text
- **Local language export** — paid feature (cost + 50% margin to customer/user)

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
| submission_event | Output | Cube 5 (Gateway) | SIMULATED | Pushes to `mockResponses[]` in-memory; no Supabase broadcast in SIM |
| response_hash | Output | Cube 9 (Reports) | SIMULATED | SHA-256 computed on transcript clean_text in test fixtures |

#### Function Simulation Modes

| Function | Sim Mode | Sim Behavior |
|----------|----------|--------------|
| `capture_audio()` | SIMULATED | Frontend creates mock `Blob` with correct MIME type (webm); no MediaRecorder in SIM; pulsing red dot animation still renders |
| `select_stt_provider()` | SIMULATED | Returns moderator-selected provider from V2T Settings panel; no DB priority lookup; provider availability assumed |
| `transcribe_audio()` | SIMULATED | Returns pre-written transcript text with mock confidence score; NO external API call to any STT provider (OpenAI, Gemini, AWS) |
| `validate_transcript()` | BOTH | Runs identically in SIM and production; checks non-empty, confidence threshold (0.3), length truncation |
| `forward_to_text_pipeline()` | SIMULATED | Passes mock transcript into Cube 2 test fixture pipeline (detect_pii, scrub_pii, detect_profanity, scrub_profanity) |
| `store_voice_response()` | SIMULATED | Writes to `mockResponses[sessionId]` in-memory; no PostgreSQL write; no audio binary stored |
| `handle_stt_failure()` | SIMULATED | Circuit breaker logic tested via mock providers that raise `STTProviderError`; failover chain exercised without real API calls |
| `push_to_live_feed()` | SIMULATED | Not implemented; voice transcripts appear in mock live feed via Cube 2 text pipeline path |

#### Canned Test Data

| Data Set | Location | Contents |
|----------|----------|----------|
| Mock audio blobs | `frontend/components/voice-input.tsx` | Empty `Blob` objects with MIME types (audio/webm, audio/wav, etc.); no real audio data |
| Mock STT transcripts (3 providers) | `backend/tests/cube3/test_voice_service.py` | Pre-written `TranscriptionResult` objects per provider: `text`, `confidence`, `language`, `model_id`. *(Grok removed.)* |
| Circuit breaker test fixtures | `backend/tests/cube3/test_e2e_flows.py` | Scenarios: primary fails + fallback succeeds, all providers fail (422), failover chain order verified |
| Provider language support maps | `backend/app/cubes/cube3_voice/providers/*.py` | Per-provider language lists: Whisper (33), Gemini (33), AWS (23). *(Grok removed — 403.)* |
| CRS-08 voice integrity test vectors | `backend/tests/cube3/test_e2e_flows.py` | SHA-256 hash on transcript clean_text: computation, determinism, Unicode, E2E presence |
| PII-in-transcript test fixtures | `backend/tests/cube3/test_e2e_flows.py` | Email in voice transcript, clean transcript, multiple PII types (email + SSN) |
| AWS provider test fixtures | `backend/tests/cube3/test_e2e_flows.py` | Enum existence, model_id pinning, 23-language support, factory mapping |
| V2T provider pricing data | `frontend/components/moderator-settings.tsx` | Estimated cost per 1,000 users: OpenAI $12, Grok $12, Gemini $4, AWS $48 |

#### Simulation Pass Criteria

- 100% of existing Cube 3 tests must pass (75/75, including 10 skipped STT provider tests requiring API keys) with zero regressions
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

**Test Suite:** 5 files, 41 test classes, 110 tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_voice_service.py` | 22 | 52 | Unit tests (validation, circuit breaker, provider selection, queries, timeout, auth, PII gate, schemas, cost, CB state, semaphore, language propagation, phase A guard) |
| `test_e2e_flows.py` | 5 | 21 | E2E flows (submission, PII, CRS-08, circuit breaker, AWS provider) |
| `test_cross_cube_integration.py` | 4 | 16 | Cross-cube dependencies (Cube 1/2/3/4 contracts, provider factory, service contract) |
| `test_live_e2e_voice.py` | 3 | 11 | Live E2E voice (Whisper, Gemini, fixture files) |
| `test_live_stt.py` | 5 | 10 | Live STT providers (Grok, Gemini, Whisper, circuit breaker, provider comparison) |

**Submission Test Flow (TestSubmissionFlow):**
1. `voice_submit_full_pipeline` — Full E2E: transcribe → PII → store → tokens → Supabase broadcast event
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
| `store_voice_response()` | **Implemented** | PostgreSQL + CRS-08 hash |
| `submit_voice_response()` | **Implemented** | Full orchestrator with token display |
| `get_voice_responses()` | **Implemented** | Paginated list |
| `get_voice_response_by_id()` | **Implemented** | Full detail with PII/profanity |
| `push_to_live_feed()` | Not implemented | Requires Cube 6 WebSocket |

### Cube 3 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube3_voice/service.py` | 753 | Core orchestrator (transcribe → pipeline → store → tokens → broadcast) |
| `core/text_pipeline.py` | 75 | Shared PII+profanity pipeline (Cube 2+3) |
| `core/phase_a_retry.py` | 177 | Shared Phase A retry with <33-word fallback + broadcast |
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
| `tests/cube3/test_voice_service.py` | 372 | 52 unit tests (22 classes) |
| `tests/cube3/test_e2e_flows.py` | 500+ | 21 E2E tests (5 classes) + CUBE3_TEST_METHOD |
| `tests/cube3/test_cross_cube_integration.py` | — | 16 cross-cube tests (4 classes) |
| `tests/cube3/test_live_e2e_voice.py` | — | 11 live E2E voice tests (3 classes) |
| `tests/cube3/test_live_stt.py` | — | 10 live STT tests (5 classes) |

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
| stt_provider | VARCHAR(50) | Yes | Which STT provider was used (whisper, gemini, aws). *(Grok removed — 403.)* |
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
| Submission event | Cube 5 (Gateway) | Notifies gateway of new voice response via Supabase broadcast |

### Cube 3 — Functions (Requirements.txt)
| Function | Status | Description |
|----------|--------|-------------|
| `capture_audio()` | **Implemented** | Initializes browser mic via MediaRecorder API, records audio stream (webm default, 6 formats accepted) |
| `select_stt_provider()` | **Implemented** | Picks best STT provider for the user's language (DB priority + language check + API key availability) |
| `transcribe_audio()` | **Implemented** | Sends audio to STT provider with language hint, returns transcript + confidence; circuit breaker failover across 4 providers |
| `validate_transcript()` | **Implemented** | Checks transcript is non-empty, confidence meets threshold (0.3 min), length truncation |
| `forward_to_text_pipeline()` | **Implemented** | Passes transcript into Cube 2's text validation pipeline (detect_pii → scrub_pii → detect_profanity → scrub_profanity) |
| `store_voice_response()` | **Implemented** | Writes voice response record to PostgreSQL (ResponseMeta + VoiceResponse + TextResponse with CRS-08 hash) |
| `handle_stt_failure()` | **Implemented** | Circuit breaker: failover chain whisper → gemini → aws; skips failed provider, retries remaining. *(Grok removed from chain — 403.)* |
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

| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target | Design Output: Definable / Measurable |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|--------------------------------------|
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Implemented** (hash) | 1 | System stores voice responses securely with timestamps + integrity verification | SHA-256 response_hash on voice transcript `clean_text`, matching Cube 2 pattern | AES-256 encryption at rest for stored audio binary + transcript data | SHA-256 hash on transcript `clean_text` stored as 64-char hex on `text_responses.response_hash`; `submitted_at` timestamp on `response_meta`; integrity verifiable via API; matches Cube 2 pattern exactly |
| CRS-08.01 | CRS-08.01.IN.SRS | CRS-08.01.OUT.SRS | **Implemented** | 1 | SHA-256 hash on `clean_text` of voice transcript stored on `text_responses.response_hash` | Same 64-char hex determinism as text path; both modalities share integrity pattern | Hash chain across all voice + text responses in session | `response_hash` = `hashlib.sha256(clean_text.encode()).hexdigest()`; 64-char hex; deterministic across runs; Unicode transcripts hash correctly; hash present in E2E submission response |
| CRS-08.02 | CRS-08.02.IN.SRS | CRS-08.02.OUT.SRS | **Implemented** | 1 | Voice transcript PII gate: Cube 2 `detect_pii()` + `scrub_pii()` applied to transcript before storage and before forwarding `clean_text` to Cube 6 Phase A | 100% PII scrub coverage on transcript text; same NER + regex pipeline as text path | Per-word PII redaction with timestamp alignment for audio replay | Transcript passes through Cube 2 PII pipeline (NER + regex); `clean_text` output has all PII replaced with `[TYPE_REDACTED]`; only `clean_text` forwarded to Cube 6; test fixtures verify email + SSN detection in transcripts |
| CRS-08.03 | CRS-08.03.IN.SRS | CRS-08.03.OUT.SRS | **Not implemented** (stretch) | 3 | AES-256 encryption at rest for audio binary + transcript text (PostgreSQL) | Field-level encryption on `raw_transcript`, `clean_text`, audio blob | HSM-backed key management with per-org audio retention policy | AES-256 field-level encryption on `raw_transcript`, `clean_text`, and audio binary blob; per-org key; key rotation supported; decryption at read time only; audio retention policy configurable per org |
| CRS-15 | CRS-15.IN.WRS.015 | CRS-15.OUT.WRS.015 | **Implemented** | 2 | User submits voice responses (STT) instead of typing | 4 batch STT providers with circuit breaker failover, 6 audio formats, 25 MB max, confidence threshold 0.3 | Live word-by-word display via real-time STT (Azure + AWS streaming) | 4 STT providers operational (Whisper, Grok, Gemini, AWS); circuit breaker traverses full chain on failure; 6 audio formats validated; > 25 MB rejected; confidence < 0.3 returns error; transcript forwarded to Cube 2 pipeline |
| CRS-15.01 | CRS-15.01.IN.WRS | CRS-15.01.OUT.WRS | **Implemented** | 2 | Batch STT transcription: 4 providers (OpenAI Whisper, Grok, Gemini, AWS Transcribe), 6 audio formats (webm/wav/mp3/ogg/m4a/flac), 25 MB max, confidence threshold 0.3 | All 4 providers tested; confidence < 0.3 returns `TranscriptLowConfidenceError` | Per-language STT model tuning for accuracy improvement | Each provider returns `TranscriptionResult` with `text`, `confidence`, `language`, `model_id`; confidence < 0.3 raises `TranscriptLowConfidenceError`; all 6 formats accepted; unknown formats rejected; file size > 25 MB rejected with 413 |
| CRS-15.02 | CRS-15.02.IN.WRS | CRS-15.02.OUT.WRS | **Implemented** | 2 | Circuit breaker failover: whisper → grok → gemini → aws; skips failed provider, retries remaining; logs per-provider failure | Zero silent failures; every provider outage is logged with `cube3.stt.failover` event | Auto-recovery: failed provider re-tested after 60s cooldown | Failover order: whisper→grok→gemini→aws; failed provider raises `STTProviderError`, skipped to next; all 4 fail returns 422 `ResponseValidationError`; each failure logged with `cube3.stt.failover` structured event; zero silent failures |
| CRS-15.03 | CRS-15.03.IN.WRS | CRS-15.03.OUT.WRS | **Implemented** (paid) | 2 | Real-time STT: Azure Speech Services (primary) + AWS Transcribe Streaming (fallback) via WebSocket; word-by-word display | WebSocket endpoint at `/ws/sessions/{id}/voice`; latency < 500ms per word | Live confidence meter displayed per word during real-time transcription | WebSocket endpoint at `/ws/sessions/{id}/voice`; Azure Speech primary, AWS Streaming fallback; word-by-word JSON messages delivered to client; latency < 500ms per word measured; connection auto-recovers on provider failure |

### Cube 3 — DesignMatrix VOC (Voice of Customer)
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-08 | Voice responses need the same integrity guarantees as text | "If we accept voice input, we need to prove the transcript wasn't altered — same audit standard as typed responses." |
| CRS-15 | Users who cannot or prefer not to type need an equally reliable voice input option | "In a room of 200 people, some will want to speak instead of type — especially on phones. It has to just work." |

---

## SSSES Plan — CRS-07 → CRS-09: Submit → Summarize → Live Feed → Theme

> **Scope:** Full pipeline from user response submission (CRS-07) through real-time summarization, live Moderator feed display, and post-close AI theming (CRS-09). Ranking (Cube 7+) is out of scope for this plan.
> **Primary driver:** `summary_33` never reaches the Moderator live feed — backend does not broadcast after Cube 6 Phase A completes. Dashboard falls back to client-side word-count truncation instead of real AI output.

### DesignMatrix CRS Alignment Note

> **Discrepancy between DesignMatrix and Requirements.txt CRS numbering:**
> | CRS | Requirements.txt | DesignMatrix (eXeL-AI_Polling_DesignMatrix.xlsx) |
> |-----|---|---|
> | CRS-09 | System clusters responses into meaningful AI themes (Cube 6) | Voice submission (Cube 3) |
> | CRS-15 | Voice submission (Cube 3) | Export session results / Lead review |
> | CRS-10 | User views summarized themes | System clusters via AI |
>
> **Resolution:** Requirements.txt is the canonical spec used by the codebase. The DesignMatrix xlsx should be updated to align. All code, tests, and this doc reference the Requirements.txt mapping.

---

### Pipeline Overview

```
CRS-07  User submits text response (any of 33 languages)
   │
   ▼
CRS-08  Cube 2: validate → PII strip (clean_text) → store (PostgreSQL)
   │         └── Participant broadcasts new_response (raw text) → Moderator dashboard
   │         └── Supabase: broadcasts response_submitted event (no summary_33)
   │
   ▼ [asyncio.create_task() — fire-and-forget background]
CRS-09a Cube 6 Phase A — LIVE (per-response, during polling):
        1. Translate to English (if language_code ≠ en)
        2. Compress to 333_Summary
        3. Compress 333 → 111_Summary
        4. Compress 111 → 33_Summary
        5. Store in response_summaries table (PostgreSQL)
        6. *** BROADCAST summary_ready → Moderator dashboard ***  ← IMPLEMENTED (cube6_ai/service.py lines 203-213)
   │
   ▼ [Moderator clicks Stop Polling → session transitions polling → ranking]
CRS-09b Cube 6 Phase B — BATCH (post-close):
        1. Fetch all 33_Summary from response_summaries table (PostgreSQL)
        2. Classify Theme01 (Risk/Supporting/Neutral) — parallel batch
        3. Marble sampling → groups of 10
        4. Generate sub-themes per marble group — concurrent agents
        5. Reduce → Theme2_9 → Theme2_6 → Theme2_3 + confidence scores
        6. Assign each response to themes
        7. Store: PostgreSQL themes + response_summaries per-response
        8. Broadcast themes_ready → Dashboard
```

---

### SSSES Audit (2026-03-30) — Current Scores + Findings

| Pillar | Current | Target | Primary Gap | Audit Finding |
|--------|:---:|:---:|---|---|
| Security | 75 | 100 | `clean_text` gate must be verified in both text + voice paths | **Audit gap:** Voice path (Cube 3 → Cube 2 pipeline) not explicitly verified in PII gate. Task A7 now covers both paths + adds log assertion. |
| Stability | 40 | 100 | `summary_33` never reaches live feed; no retry; Phase B unverified | **Audit gap:** Supabase free-tier pause risk — broadcast silently fails. Added A5.01 availability guard. Phase B has no re-trigger mechanism — added B5. |
| Scalability | 50 | 100 | 3 sequential AI calls; no concurrency cap | **Audit gap:** Semaphore per worker (not global) at horizontal scale. Noted: Supabase-backed global cap deferred; per-worker semaphore sufficient for MVP. |
| Efficiency | 55 | 100 | 3 AI round-trips; fallback truncation shown instead of real AI output | **Audit gap:** Translation + 333-word summary could be one prompt. Updated A1 to two round-trips max (translate+333, then 111+33) instead of three. |
| Succinctness | 65 | 100 | `summary_33` missing from schema; no typed broadcast | **Audit gap:** `live_feed_enabled` flag not gated in original plan. Added A5.02 — broadcast only fires when flag is `True`. |

---

### Gap Analysis

#### GAP 1 — `summary_33` Never Reaches the Live Feed *(Stability −30, Efficiency −20)*
**Root cause (two-stage disconnect):**
1. Cube 2 `emit_submission_event()` fires immediately — `summary_33` is not yet available (Phase A runs async after)
2. The participant peer-broadcasts `new_response` with `summary_33: undefined` because `TextResponseRead` schema has no `summary_33` field
3. After Phase A completes, there is **no Supabase broadcast** to push `summary_33` to dashboard
4. Dashboard falls back to `summarizeTo33Words(r.clean_text)` — client-side word-count truncation, not AI

**Fix (Tasks A4 + A5 + A6):**
- A4: Add `summary_33: str | None = None` to `TextResponseRead` schema
- A5: After `summarize_single_response()` completes, broadcast `summary_ready` event via Supabase to session channel
- A6: Dashboard listener for `summary_ready` updates existing feed entry in place (by `response_id`)

#### GAP 2 — No Retry on AI Failure *(Stability −20)*
**Root cause:** `asyncio.create_task()` wraps Phase A in try/except that only logs a warning. No retry, no dead-letter, no fallback storage flag.
**Fix (Task A2):** Exponential backoff retry (3 attempts: 1s, 2s, 4s). On final failure: store `summary_33: "[Summary unavailable]"` + `flag: true` in PostgreSQL response_summaries table.

#### GAP 3 — No Concurrency Cap on Phase A *(Scalability −30)*
**Root cause:** Uncapped `asyncio.create_task()` — 100 concurrent submits spawn 300 instant AI calls, hitting provider rate limits.
**Fix (Task A3):** Per-session `asyncio.Semaphore(10)` on Phase A. Stored on FastAPI app state. Excess tasks queue in order.

#### GAP 4 — 3 Sequential AI Round-Trips *(Efficiency −20)*
**Root cause:** `summarize_single_response()` makes 3 sequential API calls (333→111→33). Each waits for prior.
**Fix (Task A1):** Single structured prompt returning `{ summary_333, summary_111, summary_33 }` as JSON. One round-trip.

#### GAP 5 — Phase B End-to-End Unverified *(Stability −15)*
**Root cause:** Phase B code exists but has not been run against a live Supabase session with real AI provider calls.
**Fix (Task B1):** Run Phase B against controlled test session using `Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv` (5,000 simulated responses, all Q-0001). Confirm 16-column output matches target schema.

---

### Implementation Tasks

#### Phase A — Live Summarization → Broadcast

| Task | File | Change | SSSES Impact |
|------|------|--------|---|
| **A0** Short-circuit ≤33 words (BR-1) | `cube6_ai/service.py` | **IMPLEMENTED** — At entry of `_summarize_single_response_inner()`: if `len(raw_text.split()) <= 33`, set all 3 summaries to raw text, store in PostgreSQL, skip all AI calls. Zero latency, zero cost. | Efficiency +5 |
| **A1** Single-prompt summarization | `cube6_ai/service.py` | **IMPLEMENTED** — Medium text (34-333 words): single structured JSON prompt for all 3 tiers (1 call). Long text (>333): compress to 333 first, then single JSON prompt for 111+33 (2 calls max). Fallback: cascade to individual calls if JSON parse fails. | Efficiency +20, Stability +5 |
| **A2** Retry with backoff | `cube6_ai/service.py` | 3 attempts, 1s/2s/4s backoff on AI API call. On final failure: store `summary_33: "[Summary unavailable]"` + `flag: true` in PostgreSQL response_summaries. Log structured error with `response_id`. | Stability +25 |
| **A3** Per-session concurrency cap | `cube6_ai/service.py` + `cube1_session/router.py` | **IMPLEMENTED** — `asyncio.Semaphore(10)` per session in `_phase_a_semaphores` dict. `summarize_single_response()` acquires before AI calls; excess tasks queue in FIFO order. `release_phase_a_semaphore()` called on polling→ranking transition (Cube 1 router) to clean up. Each worker enforces independently — Supabase-backed global cap deferred to production scaling phase. | Scalability +30 |
| **A4** Add `summary_33` to schema | `schemas/response.py` + `cube2_text/service.py` | **IMPLEMENTED** — `summary_33` field in `ResponseRead`, `ResponseListItem`, `TextResponseDetail` schemas. Both `get_responses()` and `get_response_by_id()` JOIN `response_summaries` table via outerjoin. Returns `None` gracefully when Phase A hasn't run. | Succinctness +20 |
| **A5** Backend Supabase broadcast | `cube6_ai/service.py` + `core/supabase_broadcast.py` | **IMPLEMENTED** — After Phase A completes: broadcasts `{"event": "summary_ready", "response_id": "...", "summary_33": "..."}` to Supabase channel `session:{short_code}` (`cube6_ai/service.py` lines 203-213). Uses httpx REST with service role key. **Sub-tasks:** A5.01 availability guard (IMPLEMENTED — logs warning + continues on failure); A5.02 gate on `session.live_feed_enabled` (not yet gated); A5.03 covers both text (Cube 2) + voice (Cube 3) paths; A5.04 key scoped to Realtime publish only. | Stability +20, Efficiency +20 |
| **A6** Dashboard `summary_ready` listener | `frontend/app/dashboard/page.tsx` | **IMPLEMENTED** — `.on("broadcast", { event: "summary_ready" }, ...)` listener at lines 261-272. Updates existing feed entry in-place by `response_id`. Falls back to `summarizeTo33Words()` client truncation when AI summary not yet available. Renders `r.summary_33 \|\| summarizeTo33Words(r.clean_text)` in both compact and fullscreen feed views. | Stability +10, Efficiency +5 |
| **A7** Security audit: PII path | `cube2_text/service.py`, `cube3_voice/service.py` | **IMPLEMENTED** — Both text and voice paths log `cube6.phase_a.pii_safe` structured assertion before calling `summarize_single_response()`. Voice path now also has Phase A fire-and-forget with retry (mirrors Cube 2 pattern). Only `clean_text` reaches Cube 6; raw text never leaves storage boundary. | Security +25 |

#### Phase B — Stop Polling → Theme01 + Theme2

| Task | File | Change | SSSES Impact |
|------|------|--------|---|
| **B1** End-to-end verification | `tests/cube6/test_phase_b_e2e.py` | **IMPLEMENTED** — 16 tests across 6 classes validating full pipeline at 5000-response scale: Theme01 classification, grouping, marble sampling determinism, theme reduction parsing, replay hash determinism, full pipeline data flow. PHASE_B_E2E_TEST_METHOD for Cube 10. | Stability +20 |
| **B2** Monolith parity check | `eXeL-AI_Polling_v04.2.py` vs `cube6_ai/service.py` | **VERIFIED** — 6 areas checked: (1) Marble sampling: improved (numpy seeded vs pandas unseeded). (2) Confidence threshold: exact match (65%). (3) Theme01 categories: exact match. (4) Reduction 9→6→3: exact match (parallelized). (5) Assignment: improved (batched + embedding option). (6) Replay hash: new feature. 2 minor intentional divergences (deterministic fallback vs random). | Stability +10 |
| **B3** Parallel batch classification | `tests/cube6/test_phase_b_e2e.py` | **IMPLEMENTED** — 4 tests confirming batch (not sequential) processing: batch_summarize for 5000 classifications (1 call not 5000), ~500 marble groups = 500 concurrent tasks, 3 category reductions concurrent, assignment uses batch per level. | Scalability +20 |
| **B4** Broadcast `themes_ready` | `cube6_ai/service.py` | **IMPLEMENTED** — After Step 8, broadcasts `themes_ready` with session_id, theme_count, total_responses, replay_hash, duration_sec. Gate: only fires on full success (try/except wraps, non-fatal on broadcast failure). | Stability +10 |
| **B5** Phase B failure recovery + status endpoint | `cube6_ai/service.py` + `cube6_ai/router.py` | **IMPLEMENTED** — Pipeline stages tracked on `session.pipeline_stage` (starting→classifying→...→completed). On failure: marks `error:{stage}`, commits partial state, returns error response. `GET /sessions/{id}/ai/status` returns stage/status/theme_count/replay_hash. Re-trigger is idempotent (upserts). | Stability +15 |

---

### Live Feed Display Toggle — Specification

Applies to Cube 1 (dashboard) and Cube 2 (response submit path):

| Property | Value |
|---|---|
| **Toggle location** | Moderator dashboard live feed header |
| **Option A** | "Live Feedback" — raw `clean_text` displayed immediately on `new_response` broadcast |
| **Option B** | "33-Word Summary" — AI `summary_33` displayed when available; falls back to `summarizeTo33Words()` until `summary_ready` arrives |
| **Default** | **Live Feedback** — no AI API dependency. Active until Gemini / ChatGPT / Grok APIs are configured. |
| **AI providers** | Gemini (Google), ChatGPT (OpenAI), Grok (xAI) — selected by Moderator at session creation (`session.ai_provider`) |
| **Persistence** | Toggle state persists for session duration (localStorage key: `feed_display_mode_{session_code}`) |
| **Lexicon keys** | `cube1.feed.toggle_live` = "Live Feedback", `cube1.feed.toggle_summary` = "33-Word Summary", `cube1.feed.summary_loading` = "Generating summary..." |

### Live Feed — Business Rules

| # | Rule | Rationale | Applies To |
|---|------|-----------|------------|
| BR-1 | **Short-circuit rule:** If `clean_text` word count ≤ 33, set `summary_33 = clean_text` (exact copy). No AI call is made. | Avoids wasting an AI round-trip on text that is already at or below the target summary length. Reduces API cost and latency to zero for short responses. | Cube 6 Phase A `summarize_single_response()` — check at entry before any provider call. |
| BR-2 | **Live feed latency target:** Every new user response must appear in the Moderator live feed within **<100ms** of the `new_response` Supabase Broadcast event being received by the dashboard. | Evidence: Cube 1 live test (2026-03-27) confirmed ~50–70ms auto-advance via Supabase Broadcast across 13 participants. The same channel delivers `new_response` — the feed render path must not add >30ms on top of network delivery. | Cube 1 dashboard `new_response` listener — render path only (does not apply to `summary_ready`, which arrives asynchronously after Phase A). |
| BR-3 | **English default:** If `response_language ≠ "en"`, translate `clean_text` to English before summarization. All `summary_333`, `summary_111`, and `summary_33` values are stored in English regardless of input language. | Ensures consistent theme clustering in Phase B (all embeddings operate on English text). Already implemented in `_SUMMARIZE_INSTRUCTION` template. | Cube 6 Phase A `summarize_single_response()` — translation step fires before 333-word compression. |
| BR-4 | **Feed content rule:** Live feed displays **only** `clean_text` (Option A) or `summary_33` (Option B) per response — never both simultaneously. No other summary tier (333/111) is shown in the feed. | Keeps the Moderator view uncluttered. 333/111 summaries are available in CSV export (Cube 9) and PostgreSQL response_summaries for audit, but the real-time feed is a concise signal, not a data dump. | Cube 1 dashboard feed renderer — toggle controls which field is displayed per entry. |

---

### Execution Order — Cubes 2–3 Phase A + Phase B

> **Scope:** Tasks A0–A7 (Phase A) and B1–B5 (Phase B) for Cubes 2 and 3 only. The full 5-phase execution order including Cubes 4–6 spiral audit tasks (C4-1 through C6-8) is in `docs/CUBES_4-6.md`. **Prerequisite:** Task C6-7 (`core/supabase_broadcast.py`) RESOLVED — file exists. Task A5 (`summary_ready`) RESOLVED 2026-04-12. Task B4 (`themes_ready`) RESOLVED 2026-04-12.

```
A7 (security baseline) → A0 (short-circuit ≤33 words) → A1 (efficiency) → A2 (retry) → A3 (semaphore) → A4 (schema) → A5 (broadcast) → A6 (dashboard listener)
B2 (parity check) → B1 (e2e verify) → B3 (parallel) → B4 (broadcast) → B5 (recovery)
```

---

### Dependencies on Cubes 4–6 Spiral Audit

> The spiral code audit (2026-03-30) found 8 additional gaps in Cubes 4–6 that directly affect the Cubes 2–3 pipeline. These are documented in full in `docs/CUBES_4-6.md` under "Spiral Code Audit — New Gaps Found."

| Dependency | Impact on Cubes 2–3 | Task |
|---|---|---|
| **C6-7** `core/supabase_broadcast.py` | **RESOLVED** — File exists (97 lines, httpx REST). Task A5 (`summary_ready`) RESOLVED 2026-04-12. Task B4 (`themes_ready`) RESOLVED 2026-04-12. | C6-7 (Phase 1) |
| **C6-8** `ResponseRead` missing `summary_33` field | **BLOCKER** — Frontend always gets `undefined` for `summary_33`; fallback truncation always used. | C6-8 / A4 (Phase 2) |
| **C5-3** No pipeline timeout | Phase B can hang forever on AI call, blocking themes_ready broadcast (B4). | C5-3 (Phase 3) |
| **C6-4** No AI API call timeout | Phase A `summarize_single_response()` can hang forever per response. | C6-4 (Phase 3) |
| **C5-1** Background task error propagation | Phase B failure not surfaced to `PipelineTrigger.status` — Moderator can't retry. | C5-1 (Phase 3) |
| **C5-4** Cube 6→7 chain not wired | After Phase B, no automatic trigger to start ranking. | C5-4 (Phase 4) |

---

### Projected SSSES Scores After All Tasks

> **Conditional:** Projected 100/100 assumes all Phase A+B tasks (A0–A7, B1–B5) AND prerequisite Cube 6 infrastructure (C6-7, C6-8) are complete. See `docs/CUBES_4-6.md` for Cubes 4–6 projected scores (86/93/94).

| Pillar | Before | After | Delta |
|--------|:---:|:---:|:---:|
| Security | 75 | 100 | +25 |
| Stability | 40 | 100 | +60 |
| Scalability | 50 | 100 | +50 |
| Efficiency | 55 | 100 | +45 |
| Succinctness | 65 | 100 | +35 |
| **Overall** | **57** | **100** | **+43** |

---

### Data Flow — Target State (CRS-07 → CRS-09)

```
Input (5 cols):        Q_Number | Question | User | Detailed_Results | Response_Language
                           ▼ CRS-07/08 — Cube 2: validate, PII strip, store
                           ▼ Live feed: shows raw clean_text immediately (default)
                           ▼ CRS-09a — Cube 6 Phase A: translate + 333→111→33 summaries
Live output (+3 cols): + 333_Summary | 111_Summary | 33_Summary → broadcast to live feed (toggle: Summary mode)
                           ▼ Moderator clicks Stop Polling
                           ▼ CRS-09b — Cube 6 Phase B: Theme01 + Theme2_9/6/3 pipeline
Final output (+8 cols):+ Theme01 | Theme01_Confidence
                       + Theme2_9 | Theme2_9_Confidence
                       + Theme2_6 | Theme2_6_Confidence
                       + Theme2_3 | Theme2_3_Confidence
                           ▼ [Ranking — Cube 7, out of scope for this plan]
```

**Not in scope:** Ranking (Cube 7), Token ledger (Cube 8), CSV export (Cube 9).
