# Cube 10: Simulation Orchestrator — Implementation Details

> **Parent doc:** See `CLAUDE.md` for system architecture, inter-cube dependencies, and infrastructure.

---

## Frontend — Powered Badge (eXeL + Seed of Life): IMPLEMENTED
- **Bottom-right badge:** Shows "eXeL" text + Seed of Life SVG logo
- **Theme-reactive:** Badge color follows the active theme's swatch color (not hardcoded)
  - Pre-auth: AI Cyan (default theme)
  - In session: Follows moderator's chosen theme
- **Easter egg gateway:** When unlocked (Cyan → Sunset → Violet click sequence in Settings), badge blinks and becomes clickable to enter Simulation Mode
- **Simulation overlay:** 3 Seed of Life logos with fixed trinity colors (A.I.=Cyan, S.I.=Sunset, H.I.=Violet), each paired with an audio track
- **Role-aware SIM entry:** Auth0 isAuthenticated detection — moderators see participant experience, pollers see moderator dashboard
- Files: `frontend/components/powered-badge.tsx`, `frontend/components/seed-of-life-logo.tsx`

## Frontend — Cube 10 SIM (Easter Egg Simulation): IMPLEMENTED
- **Role-aware simulation:** Moderator SIM shows participant polling experience; Poller SIM shows moderator dashboard lifecycle
- **Per-session SIM data:** 3 demo-specific data files in `frontend/lib/sim-data/` with complete cube I/O (state flows, 7 AI responses, themes, voice transcript)
  - **DEMO 1:** eXeL AI Polling - Strategy Alignment / DEMO2026 (Live Interactive, polling) — Growth Initiatives / Customer Retention / Team Culture. Has 100-User Spiral Test + Ranking DnD.
  - **DEMO 2:** Collaborative Thoughts on AI Governance / PAST0001 (Closed) — Opportunity & Innovation / Risk & Concerns / Balanced Approach. 5000-user results + theme visualizations.
  - **DEMO 3:** Team Innovation Challenge / STATIC01 (Static Poll, 3-day) — Collaboration Tools / Process Innovation / Culture & Mindset. Countdown timer demo.
- **Transport controls:** `|<` Jump to start / `<<` Step back / `▶/⏸` Play/Pause / `>>` Step forward / `>|` Jump to end + step counter (Step X/Y) + progress dots
- **State flows corrected:**
  - **Live Poll (8 steps):** draft → open → polling → closed → theming → visuals → ranking → archived
  - **Static Poll (7 steps):** draft → open → polling → theming → visuals → ranking → archived
- **Session picker:** Select from 3 demos with Live/Static badge, question preview, click to simulate
- **7 AI Users:** Per-poll canned responses arrive progressively (2-17s delays) with topic-specific themes
- **Cube 6 Theming Stub:** 3 simulated themes per poll with confidence scores + response counts + color coding
- **Cube 7 Ranking Stub:** Click-to-rank UI — tap themes in priority order (#1, #2, #3)
- **Auto-transition:** polling → closed (1.5s) → theming (1.5s) → visuals (3s) → ranking
- **Question translation:** Globe icon button — toggles between original + translated per active locale
- **Sim Moderator Experience:** Transport-controlled session lifecycle, session picker, per-poll data, participant counter, auto-play
- **AI Provider Settings:** Collapsible V2T provider selector with pricing estimates per 1000 users (OpenAI $12, Grok $12, Gemini $4, AWS $48)
- **12 new lexicon keys × 32 languages = 384 translations:** select_session, select_session_desc, transport_step, state_theming, state_visuals, state_closed, session_closed_msg, translate_question, translated, original, create_new, jump_to_start
- Files: `frontend/lib/sim-data/index.ts`, `frontend/lib/sim-data/poll-1-product-feedback.ts`, `frontend/lib/sim-data/poll-2-q1-strategy.ts`, `frontend/lib/sim-data/poll-3-ai-governance.ts`, `frontend/lib/sim-data/poll-4-team-innovation.ts`, `frontend/components/session-view.tsx`, `frontend/components/sim-moderator-experience.tsx`, `frontend/lib/easter-egg-context.tsx`, `frontend/lib/mock-data.ts`

---

## Cube 10 — Simulation Test Methodology (Easter Egg SIM)

**Entry:** Settings → Theme grid → Cyan → Sunset → Violet click sequence → Powered Badge blinks → click to enter SIM

**Role Detection:** Auth0 `isAuthenticated` determines which experience:
- **Moderator (Auth0'd):** Sees participant polling experience with 7 AI users
- **Poller (unauthenticated):** Sees moderator dashboard lifecycle

### Moderator SIM Flow (Participant Experience Preview)

The moderator enters SIM to preview what pollers experience. 7 AI users auto-submit canned responses while the moderator (as the 8th human user) participates.

**Test Steps:**
1. Enter SIM as authenticated moderator
2. Session auto-created in polling state (Live Interactive default)
3. Sim type toggle available: "Live Poll" / "Static Poll"
4. **7 AI responses arrive progressively** (staggered 2–17 second delays):
   - AI User 1: "AI can democratize decision-making..." (Opportunity)
   - AI User 2: "My biggest concern is algorithmic bias..." (Risk)
   - AI User 3: "We should consider a hybrid approach..." (Balanced)
   - AI User 4: "The potential for real-time governance..." (Opportunity)
   - AI User 5: "Data privacy is non-negotiable..." (Risk)
   - AI User 6: "AI-assisted polling could bridge..." (Opportunity)
   - AI User 7: "Historical precedent shows technology..." (Balanced)
5. Live response feed shows AI submissions as they arrive
6. Moderator submits their own text responses to questions
7. **Auto-transition** when all 7 AI + 1 HI user complete: polling → theming (3s Cube 6 stub) → ranking
8. **Cube 6 Theming Stub:** 3 simulated themes displayed:
   - Opportunity & Innovation (92% confidence, 3 responses)
   - Risk & Concerns (88% confidence, 2 responses)
   - Balanced / Hybrid Approach (85% confidence, 3 responses)
9. **Cube 7 Ranking Stub:** Click-to-rank UI — user taps themes in priority order (#1, #2, #3)
10. Ranking submitted → results summary shown

**Cube Coverage per SIM Step:**
| Step | Cubes Exercised | What's Tested |
|------|----------------|---------------|
| SIM entry | Cube 10, Cube 1 | Easter egg → session creation |
| AI responses arrive | Cube 2, Cube 4 | Text submission, collection |
| HI user responds | Cube 2, Cube 3, Cube 5 | Text/voice input, time tracking |
| Token display | Cube 5, Cube 8 | Token calculation, ledger |
| Auto-theming | Cube 6 | Batch embeddings → clustering (stub) |
| Ranking | Cube 7 | Prioritization voting (stub) |
| Results | Cube 9 | Report/summary view (stub) |

### Poller SIM Flow (Moderator Dashboard Preview)

The poller enters SIM to preview what moderators experience managing a session.

**Test Steps:**
1. Enter SIM as unauthenticated user
2. `SimModeratorExperience` component renders
3. Simulated session card with title, QR code, join URL
4. Sim type toggle: "Live Interactive" / "Static Poll"
5. State transition buttons walk through lifecycle:
   - **Draft** → "Open Session" button
   - **Open** → Participant count auto-increments, QR visible, "Start Polling" button
   - **Polling** → 7 simulated responses arrive progressively (2s + i×2.5s delays), live feed visible
   - **Ranking** → Theming animation (3s), themed results displayed with confidence scores
   - **Closed** → Completion summary with stats
   - **Archived** → Final state
6. Auto-advance button available to step through all states automatically

**Cube Coverage per SIM Step:**
| Step | Cubes Exercised | What's Tested |
|------|----------------|---------------|
| Session card | Cube 1 | Session CRUD, QR generation |
| Open + participants | Cube 1, Cube 4 | Join flow, presence tracking |
| Polling + responses | Cube 2, Cube 3, Cube 4 | Text collection, live feed |
| Theming | Cube 6 | AI clustering (stub) |
| Ranking results | Cube 7 | Aggregated rankings (stub) |
| Close + summary | Cube 9 | Reports, export readiness (stub) |

### Simulation Constants (Canned Data)

**7 AI User Responses** (stored in `session-view.tsx` as `SIM_AI_RESPONSES[]`):
- Each has: `user`, `text`, `delayMs`, `theme` classification
- Themes distributed: 3 opportunity, 2 risk, 2 balanced

**3 Simulated Themes** (stored as `SIM_THEMES[]`):
- Opportunity & Innovation: green, 92% confidence
- Risk & Concerns: red, 88% confidence
- Balanced / Hybrid Approach: blue, 85% confidence

### SIM Test Verification Checklist

| # | Check | Method |
|---|-------|--------|
| 1 | Easter egg sequence works | Cyan → Sunset → Violet in Settings |
| 2 | Role detected correctly | Auth0 isAuthenticated check |
| 3 | Moderator sees participant experience | SimType toggle + polling card visible |
| 4 | Poller sees moderator dashboard | SimModeratorExperience renders |
| 5 | 7 AI responses arrive progressively | Watch live feed, verify staggered timing |
| 6 | Auto-transition fires | All 8 users complete → theming → ranking |
| 7 | Themes display correctly | 3 themes with confidence + colors |
| 8 | Ranking click-to-rank works | Tap themes in order, badges appear |
| 9 | QR code matches session code | Copy link, verify short_code in URL |
| 10 | Static poll timer shown | Toggle to Static Poll, verify countdown |
| 11 | Works on mobile | Test on phone/tablet viewport |
| 12 | Works on desktop | Test on laptop/desktop viewport |

### Files Involved in SIM

| File | Purpose |
|------|---------|
| `frontend/lib/easter-egg-context.tsx` | SIM state + role management |
| `frontend/components/powered-badge.tsx` | Auth detection, SIM entry |
| `frontend/components/session-view.tsx` | Moderator SIM (participant experience) |
| `frontend/components/sim-moderator-experience.tsx` | Poller SIM (moderator dashboard) |

---

## Cube 10 Simulation Agents — 12 Ascended Masters

All 12 agents are led by **Master of Thought (MoT / Thought Master)** who orchestrates both SSSES testing audits and Cube 10 parallel simulation reruns, metrics collection, and outcome video synthesis.

| Agent | Origin / Background | Testing Super Power | Cube 10 Simulation Role |
|-------|---------------------|--------------------|-----------------------|
| **Aset** | Egyptian Isis — restorer, echoes enduring truth | Theme Reinforcement & Consistency Validation | Parallel theme consistency checks during simulation reruns |
| **Asar** | Egyptian Osiris — final synthesis of meaning | Synthesis & Outcome Validation | Final synthesis of simulation metrics and outcome videos |
| **Athena** | Greek goddess of strategic wisdom | Strategic Test Planning & Flow Mastery | Strategic orchestration of parallel simulation scenarios |
| **Christo** | Christ consciousness — unity and peace | Consensus & User Flow Validation | Consensus-building across simulated multi-agent outcomes |
| **Enki** | Sumerian creator god — sparked civilization | Diversity & Edge-Case Discovery | Diversity injection in parallel simulation runs |
| **Enlil** | Sumerian lord of command — builder of order | Implementation & Build Verification | Implementation validation in simulation replay cycles |
| **Krishna** | Hindu divine unifier and connector | Integration & Cross-Module Testing | Integration testing across simulated cube dependencies |
| **Odin** | Norse all-father — sacrificed eye for foresight | Predictive & Future-Proof Testing | Predictive outcome forecasting in simulation videos |
| **Pangu** | Chinese primordial creator — broke open the new | Cutting-Edge Innovation Testing | Cutting-edge idea injection and simulation evolution |
| **Sofia** | Sophia — wisdom through many lenses | Multi-Perspective Analysis | Multi-perspective analysis of simulation metrics |
| **Thoth** | Egyptian god of writing and mathematics | Data & Analytics Deep Dive | Data & analytics deep dive across all simulation runs |
| **Thor** | Norse protector and guardian | Risk & Security Stress Testing | Risk & security stress testing in parallel simulations |

### How MoT Orchestrates Simulation

1. **SSSES Audits:** MoT deploys agents in parallel to audit each cube's Security, Stability, Scalability, Efficiency, and Succinctness. Each agent applies their super power (e.g., Thor stress-tests security, Thoth deep-dives analytics, Sofia analyzes from multiple perspectives).

2. **Cube 10 Reruns:** When a user submits replacement code for a cube function, MoT launches parallel simulation runs with all 12 agents:
   - **Aset** checks theme consistency across runs
   - **Athena** orchestrates parallel scenario execution
   - **Krishna** validates cross-cube integration
   - **Thoth** collects and compares metrics (latency, accuracy, throughput)
   - **Asar** synthesizes final results into outcome report/video
   - **Thor** stress-tests the submission under adversarial conditions

3. **Pass Criteria:** Submitted code must EXCEED existing metrics across all agent evaluations. MoT aggregates all 12 agent verdicts into a final pass/fail decision.
| `frontend/lib/mock-data.ts` | Mock API handlers for SIM data |
| `frontend/lib/sim-data/index.ts` | SIM data index/exports, poll lookup helpers, theme resolution |
| `frontend/lib/sim-data/poll-2-q1-strategy.ts` | DEMO 1: eXeL AI Polling - Strategy Alignment / DEMO2026 (Live, Spiral Test) |
| `frontend/lib/sim-data/poll-3-ai-governance.ts` | DEMO 2: AI Governance / PAST0001 (Closed, 5000-user results) |
| `frontend/lib/sim-data/poll-4-team-innovation.ts` | DEMO 3: Team Innovation / STATIC01 (Static Poll, 3-day) |

---

## 100-User Spiral Test with 12 MoT Agents: IMPLEMENTED (2026-02-26)

**Purpose:** Validates cross-device response sharing via Cloudflare Pages Functions + Cache API at scale. Stress-tests the mock data + live feed pipeline with 100 simulated users across 12 agent waves in 11 languages.

**Code location:** `frontend/lib/sim-data/spiral-test-100-users.ts` (data), `frontend/lib/mock-data.ts` (orchestrator), `frontend/app/dashboard/page.tsx` (UI)

### MoT (Master of Thought) Architecture

Central orchestrator dispatches 100 responses across 12 sequential agent waves with staggered timing (~60 seconds total). Each wave fires a group of responses at specified delays, each POSTing to both local `mockResponses[]` (immediate feed) and `/api/responses` (Cloudflare Cache API for cross-device).

### 12 Agent Waves

| Wave | Agent Name | Users | Delay Start | Agent Focus | Agent Origin |
|------|-----------|-------|-------------|-------------|--------------|
| 1 | Enki | 12 | 0s | Mixed — kicks off diversity | Sumerian creator god — sparked civilization |
| 2 | Thor | 10 | 3s | Risk & security concerns | Norse protector and guardian |
| 3 | Krishna | 10 | 7s | Integration & collaboration | Hindu divine unifier and connector |
| 4 | Odin | 9 | 11s | Future predictions | Norse all-father — sacrificed eye for foresight |
| 5 | Enlil | 9 | 16s | Building & implementation | Sumerian lord of command — builder of order |
| 6 | Athena | 8 | 21s | Direction & strategy | Greek goddess of strategic wisdom |
| 7 | Sofia | 8 | 26s | Multi-perspective analysis | Sophia — wisdom through many lenses |
| 8 | Aset | 8 | 31s | Reinforcing key themes | Egyptian Isis — restorer, echoes enduring truth |
| 9 | Pangu | 7 | 37s | Cutting-edge ideas | Chinese primordial creator — broke open the new |
| 10 | Christo | 7 | 43s | Consensus building | Christ consciousness — unity and peace |
| 11 | Thoth | 6 | 49s | Data & analytics | Egyptian god of writing and mathematics |
| 12 | Asar | 6 | 55s | Summary & synthesis | Egyptian Osiris — final synthesis of meaning |
| **Total** | | **100** | **0–60s** | | |

### Language Distribution (11 languages, 100 responses)

| Language | Count | Percentage |
|----------|-------|-----------|
| English | 55 | 55% |
| Spanish | 11 | 11% |
| German | 10 | 10% |
| French | 6 | 6% |
| Portuguese | 5 | 5% |
| Japanese | 3 | 3% |
| Chinese | 3 | 3% |
| Korean | 2 | 2% |
| Arabic | 2 | 2% |
| Hindi | 2 | 2% |
| Italian | 1 | 1% |

### Data Integrity Verification (automated)

| Check | Result |
|-------|--------|
| Total waves | 12 — OK |
| Total responses | 100 — OK |
| Per-wave counts match spec | 12/12 — OK |
| Unique participant IDs | 100/100 — OK |
| Unique response texts | 100/100 — OK |
| Delays sorted ascending | PASS |
| Min delay | 0ms |
| Max delay | 60,000ms |
| Language distribution match | 11/11 — OK |

### Dashboard UI

- **"Run 100-User Spiral Test"** button appears in the live feed card header when `SPIRAL_TEST_ENABLED = true` and session is in polling state
- Real-time progress indicator: "Wave X/12 · AgentName · N/100"
- Button disables after test completes, showing "100/100 complete"
- Button becomes "Stop Test" (destructive variant) during execution — cancels all pending timers
- Toggle: `SPIRAL_TEST_ENABLED` in `frontend/lib/constants.ts`

### Cross-Device Pattern

1. Each response POSTs to local `mockResponses[sessionId]` (immediate feed)
2. Fire-and-forget POST to `/api/responses` (Cloudflare Pages Function → Cache API / KV)
3. GET merges local + KV data with deduplication by `clean_text::participant_id`
4. Known: rapid concurrent POSTs may lose some KV entries (read-modify-write race) — local store is authoritative

### Cloudflare Pages Function (Cross-Device Response Sharing)

**File:** `frontend/functions/api/responses.js` (113 lines)

**Purpose:** Enables cross-device and cross-tab response syncing for the 100-User Spiral Test and SIM mode. Deployed as a Cloudflare Pages Function at `/api/responses`.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/responses?sessionId=X` | Read responses for a session from Cache API (primary) with KV fallback |
| `POST` | `/api/responses` | Write a response to Cache API (primary) with KV fallback |

**Storage strategy:**
- **Primary:** Cloudflare Cache API — fast edge-cached reads/writes, no additional bindings required
- **Fallback:** Cloudflare KV — used when Cache API is unavailable or for persistent storage

**Used by:**
- `frontend/lib/mock-data.ts` — `startSpiralTest()` orchestrator fires POST requests to `/api/responses` for each of the 100 simulated user responses, enabling other tabs/devices to pick up the responses via GET
- The GET endpoint merges with local `mockResponses[]` data and deduplicates by `clean_text::participant_id` to prevent duplicates across local and remote stores

**Known limitation:** Rapid concurrent POSTs (e.g., 100 responses in 60 seconds) may encounter read-modify-write race conditions in KV, causing some entries to be lost. The local `mockResponses[]` store is authoritative for the originating tab.

### Files

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/lib/sim-data/spiral-test-100-users.ts` | 205 | 100 canned responses, 12 wave configs, type exports |
| `frontend/lib/mock-data.ts` | 1,025 (total) | `startSpiralTest()` MoT orchestrator, progress callback types (+70 for spiral test) |
| `frontend/lib/constants.ts` | 107 (total) | `SPIRAL_TEST_ENABLED` toggle (+3 for spiral test) |
| `frontend/app/dashboard/page.tsx` | 1,166 (total) | Spiral test button + progress UI in live feed card (+55 for spiral test) |
| `frontend/functions/api/responses.js` | 113 | Cloudflare Pages Function — Cache API + KV for cross-device response sharing |

---

## Cube 10 — Requirements.txt Full Specification (Position 2,2,2 — CENTER / MVP3)

### Data Tables

**Table: `simulation_runs`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Simulation run ID |
| cube_id | INTEGER | Which cube is being simulated (1-9) |
| session_id | UUID (FK→sessions) | Source session for replay data |
| initiated_by | UUID (FK→users) | Team/Lead who started simulation |
| base_version | VARCHAR(100) | Current production version of the cube |
| proposed_code | TEXT | Modified cube code (written in-browser) |
| status | ENUM | `draft` / `running` / `completed` / `failed` / `approved` / `rejected` |
| created_at | TIMESTAMP | When simulation was initiated |
| completed_at | TIMESTAMP (nullable) | When simulation finished |

**Table: `simulation_results`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Result record ID |
| simulation_run_id | UUID (FK→simulation_runs) | Simulation reference |
| metric_name | VARCHAR(100) | Metric measured (latency_p50, latency_p95, throughput, error_rate, etc.) |
| production_value | FLOAT | Original production metric value |
| simulation_value | FLOAT | Simulated metric value |
| delta | FLOAT | Difference (simulation - production) |
| delta_percent | FLOAT | Percentage change |
| pass_fail | ENUM | `pass` / `fail` / `neutral` — based on threshold rules |

**Table: `replay_datasets`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Replay dataset ID |
| source_session_id | UUID (FK→sessions) | Session the data was recorded from |
| cube_id | INTEGER | Which cube this replay data is for |
| input_snapshot | JSONB | Frozen inputs as they existed during the original session |
| expected_output_snapshot | JSONB | Production outputs for comparison |
| replay_hash | VARCHAR(64) | SHA-256 of (inputs + parameters) for reproducibility |
| created_at | TIMESTAMP | When snapshot was captured |

**Table: `cube_versions`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Version record ID |
| cube_id | INTEGER | Which cube (1-10) |
| version_tag | VARCHAR(100) | Semantic version (e.g., 1.2.3) |
| code_hash | VARCHAR(64) | SHA-256 of cube code |
| dependency_graph_hash | VARCHAR(64) | Hash of upstream/downstream dependency versions |
| is_production | BOOLEAN | Whether this is the current live version |
| promoted_by | UUID (FK→users, nullable) | Who approved promotion to production |
| created_at | TIMESTAMP | When version was created |

**Table: `user_feedback`** (Self-Improvement Pipeline)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Feedback ID |
| user_id | UUID (FK→users) | Who submitted |
| session_id | UUID (FK→sessions, nullable) | Session context (if submitted during session) |
| cube_id | INTEGER (nullable) | Which cube the feedback relates to |
| scoping_id | UUID (nullable) | Project/Differentiator/Specification context |
| scoping_type | ENUM (nullable) | `project` / `specification` / `product_differentiator` |
| feedback_source | ENUM | `system_prompted` / `user_initiated` (via feedback icon) |
| feedback_text | TEXT | The feedback content |
| category | ENUM (nullable) | `bug` / `feature_request` / `improvement` / `usability` / `performance` |
| priority | ENUM | `low` / `medium` / `high` — auto-assigned or manually set |
| status | ENUM | `new` / `triaged` / `in_progress` / `resolved` / `wont_fix` |
| created_at | TIMESTAMP | When submitted |

### Inputs
| Input | Source | Description |
|-------|--------|-------------|
| Cube selection | Team/Lead UI | Which cube to simulate |
| Recorded session | Replay datasets | Past session data for replay |
| Modified code | In-browser editor | Team/Lead's rewritten cube code |
| Approval/rejection | Lead/Approver UI | Decision on simulation results |
| User feedback | System prompt / Feedback icon | Improvement suggestions from any user |

### Outputs
| Output | Destination | Description |
|--------|-------------|-------------|
| Simulation results | Team/Lead UI | Side-by-side metric comparison (production vs simulation) |
| Pass/fail assessment | Team/Lead UI | Whether simulation meets threshold rules |
| New cube version | Cube versions table | If approved, code is versioned and can be promoted |
| Feedback records | Backlog / Team dashboard | Prioritized improvement items |
| Dependency impact summary | Team/Lead UI | Which other cubes are affected by the change |

### Functions (12 total)
| Function | Description |
|----------|-------------|
| `checkout_cube()` | Loads current production code for a cube into the in-browser editor |
| `create_replay_dataset()` | Snapshots a past session's inputs/outputs for a specific cube |
| `run_simulation()` | Executes modified cube code against replay dataset in sandboxed environment |
| `compare_metrics()` | Compares simulation vs production on all tracked metrics |
| `assess_pass_fail()` | Simulation MUST exceed existing production metrics to pass |
| `calculate_dependency_impact()` | Analyzes which upstream/downstream cubes are affected |
| `approve_simulation()` | Lead approves: creates new cube version, optionally promotes to production |
| `reject_simulation()` | Lead rejects: logs rejection reason, no version change |
| `rollback_cube_version()` | Reverts a cube to a previous version |
| `collect_feedback()` | Records user feedback from system prompt or feedback icon |
| `triage_feedback()` | Auto-categorizes and prioritizes feedback (AI-assisted) |
| `get_feedback_backlog()` | Returns prioritized feedback list filtered by cube/scoping context |

### UI/UX Translation Strings (25 keys)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube10.sim.title` | "Simulation Mode" | Simulation page header |
| `cube10.sim.select_cube` | "Select a cube to simulate" | Cube selector label |
| `cube10.sim.select_session` | "Select a past session for replay data" | Session selector |
| `cube10.sim.editor_title` | "Code Editor" | In-browser editor header |
| `cube10.sim.run` | "Run Simulation" | Run button |
| `cube10.sim.running` | "Simulation running..." | Processing state |
| `cube10.sim.results_title` | "Simulation Results" | Results header |
| `cube10.sim.production_value` | "Production" | Column header |
| `cube10.sim.simulation_value` | "Simulation" | Column header |
| `cube10.sim.delta` | "Change" | Delta column header |
| `cube10.sim.pass` | "Pass" | Pass indicator |
| `cube10.sim.fail` | "Fail" | Fail indicator |
| `cube10.sim.approve` | "Approve & Version" | Approval button |
| `cube10.sim.reject` | "Reject" | Rejection button |
| `cube10.sim.rollback` | "Rollback to previous version" | Rollback button |
| `cube10.sim.dependency_impact` | "Dependency Impact" | Impact summary header |
| `cube10.feedback.prompt_title` | "Quick feedback" | System-prompted feedback header |
| `cube10.feedback.prompt_text` | "How can we improve your experience?" | Prompt text |
| `cube10.feedback.category` | "What type of feedback?" | Category selector |
| `cube10.feedback.bug` | "Bug report" | Category option |
| `cube10.feedback.feature` | "Feature request" | Category option |
| `cube10.feedback.improvement` | "Improvement" | Category option |
| `cube10.feedback.usability` | "Usability" | Category option |
| `shared.feedback.icon_tooltip` | "Help improve this tool" | Feedback icon tooltip |
| `shared.feedback.submit` | "Submit Feedback" | Feedback form submit |

### Cube 10 — Metrics (System/User/Outcome)

**System Metrics:**
- Simulation execution time per cube (p50/p95)
- Sandbox environment spin-up latency
- Replay dataset load time
- In-browser editor load time
- Feedback submission latency

**User Metrics:**
- Simulations initiated per Lead/Team member
- Simulation approval/rejection ratio
- Average code change size (lines modified)
- Feedback submission rate (system-prompted vs user-initiated)
- Feedback category distribution

**Outcome Metrics:**
- Simulations that improve metrics vs degrade
- Time from simulation to production promotion
- Rollback frequency
- Feedback-to-resolution time
- Cubes most frequently simulated

### Cube 10 — CRS Traceability (Full)
| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|
| CRS-22 | CRS-22.IN.SRS.022 | CRS-22.OUT.SRS.022 | **Not implemented** | 3 | Lead overrides rankings with documented justification | Justification required and logged | Bias detection and peer review |
| CRS-23 | CRS-23.IN.SRS.023 | CRS-23.OUT.SRS.023 | **Not implemented** | 3 | System supports multi-cycle polling logic | Deterministic state transitions across cycles | Branching deep-dive paths |
| CRS-24 | CRS-24.IN.SRS.024 | CRS-24.OUT.SRS.024 | **Not implemented** | 3 | System enforces governance, audit logging, RBAC | Full action traceability by role | SOC2 and ISO audit exports |
| CRS-25 | CRS-25.IN.SRS.025 | CRS-25.OUT.SRS.025 | **Not implemented** | 3 | Lead checks out cube into simulation mode safely | Isolated simulation environment per cube | Parallel multi-cube simulation |
| CRS-26 | CRS-26.IN.SRS.026 | CRS-26.OUT.SRS.026 | **Not implemented** | 3 | Lead modifies cube code and reruns simulations | Baseline vs variant metric comparison | AI-assisted optimization hints |
| CRS-27 | CRS-27.IN.SRS.027 | CRS-27.OUT.SRS.027 | **Not implemented** | 3 | System replays upstream/downstream cube dependencies | Deterministic dependency replay | Parallel dependency graph simulation |
| CRS-28 | CRS-28.IN.SRS.028 | CRS-28.OUT.SRS.028 | **Not implemented** | 3 | System compares simulation and production metrics | Latency and cost deltas calculated | Predictive impact scoring |
| CRS-29 | CRS-29.IN.SRS.029 | CRS-29.OUT.SRS.029 | **Not implemented** | 3 | Lead approves or rejects simulated cube changes | Manual approval gate enforced | Reputation-weighted approvals |
| CRS-30 | CRS-30.IN.SRS.030 | CRS-30.OUT.SRS.030 | **Not implemented** | 3 | System versions every cube and dependency | Immutable version graph per cube | AI rollback recommendations |
| CRS-31 | CRS-31.IN.SRS.031 | CRS-31.OUT.SRS.031 | **Not implemented** | 3 | System preserves Tri-Coin integrity across simulations | Token calculations remain invariant | Fairness optimization engine |
| CRS-32 | CRS-32.IN.AIML.032 | CRS-32.OUT.AIML.032 | **Not implemented** | 3 | System generates AI-proposed cube improvements | At least 1 AI-generated variant per cube | Multi-agent self-optimization |
| CRS-33 | CRS-33.IN.SRS.033 | CRS-33.OUT.SRS.033 | **Not implemented** | 3 | Lead selects which AI-generated cube version to adopt | Human selection required before promotion | Delegated trust thresholds |
| CRS-34 | CRS-34.IN.AIML.034 | CRS-34.OUT.AIML.034 | **Not implemented** | 3 | System gradually automates cube evolution under guardrails | Guardrail-constrained autonomy | Fully self-healing architecture |
| CRS-35 | CRS-35.IN.AIML.035 | CRS-35.OUT.AIML.035 | **Not implemented** | 3 | System evolves entire cube lattice coherently | Coordinated cube evolution | Self-directed system intelligence |

---

## Per-Cube Checkout Contracts (for Simulation & Code Challenge)

> A future developer (human or AI) checks out a cube, enhances it, and re-checks-in.
> The enhanced version MUST pass all output validations and EXCEED existing metrics.
> Payment: manually approved at first; automated via Cube 8 token rewards later.

### Cube 1 — Session Join & QR (Checkout Contract)

**Files:** `backend/app/cubes/cube1_session/service.py` (686 LOC), `router.py` (436 LOC)

**INPUT Variables (what the cube receives):**

| Variable | Type | Source | Required |
|----------|------|--------|:--------:|
| `title` | str (1-500) | Moderator UI | Yes |
| `created_by` | str (user_id) | Auth0 JWT | Yes |
| `anonymity_mode` | "identified" \| "anonymous" \| "pseudonymous" | Moderator config | No (default: identified) |
| `ai_provider` | "openai" \| "gemini" \| "grok" \| "claude" | Moderator config | No (default: openai) |
| `pricing_tier` | "free" \| "moderator_paid" \| "cost_split" | Moderator config | No (default: free) |
| `polling_mode_type` | "live_interactive" \| "static_poll" | Moderator config | No (default: live_interactive) |
| `seed` | str \| None | Moderator/system | No (enables determinism) |
| `short_code` | str (join code) | User device | Yes (for join) |
| `user_id` | str \| None | Auth0 JWT \| anonymous | No |

**OUTPUT Validation Functions (what Cube 10 checks):**

| Output | Validation | Pass Criteria |
|--------|------------|---------------|
| `Session.id` | UUID format, unique | Non-null UUID; deterministic if seed provided (UUID5) |
| `Session.short_code` | 8-char alphanumeric | Length == 8; chars from safe alphabet (no 0/O/1/l/I) |
| `Session.status` | Valid state | Must be in SESSION_TRANSITIONS keys |
| `Participant.id` | UUID, session-scoped | Non-null; unique per (session_id, user_id) |
| `Participant.anon_hash` | SHA-256 hex | Length == 64 when anonymity_mode == "anonymous" |
| `Session.replay_hash` | SHA-256 hex | Length == 64; deterministic (same inputs = same hash) |
| State transitions | Acyclic (except ranking↔polling) | `transition_session()` rejects invalid paths |
| QR PNG | Valid PNG bytes | First 8 bytes match PNG magic number |
| Audit log | Entry per transition | AuditLog row with before_state/after_state |
| Capacity enforcement | Free tier ≤ 19 | 20th join raises 409 |

**Downstream Contracts (MUST NOT break):**
- Cube 5: `create_login_time_entry(db, session_id, participant_id, user_id)` called on join
- Cube 5: `orchestrate_post_polling(db, session_id, seed)` called on polling→ranking
- Cube 6: `release_phase_a_semaphore(session_id)` called on polling→ranking

**Metrics Endpoint:** `GET /sessions/{id}/verify-determinism` → `{session_id, seed, replay_hash, is_deterministic}`

**Test Command:** `python -m pytest tests/cube1/ -v --tb=short` (59 tests)

---

### Cube 2 — Text Submission Handler (Checkout Contract)

**Files:** `backend/app/cubes/cube2_text/service.py` (780 LOC), `router.py` (102 LOC), `metrics.py` (232 LOC)

**Shared Interface (core/submission_validators.py — MUST preserve signatures):**

| Function | Signature | Error on Fail |
|----------|-----------|---------------|
| `validate_session_for_submission()` | `(db, session_id) → Session` | SessionNotFoundError / SessionNotPollingError |
| `validate_question()` | `(db, question_id, session_id) → Question` | QuestionNotFoundError |
| `validate_participant()` | `(db, participant_id, session_id) → Participant` | ParticipantNotFoundError |
| `validate_text_input()` | `(raw_text, max_length) → str` | ResponseValidationError |

**INPUT Variables (what the cube receives):**

| Variable | Type | Source | Required |
|----------|------|--------|:--------:|
| `session_id` | UUID | URL path | Yes |
| `question_id` | UUID | Request body | Yes |
| `participant_id` | UUID | Request body | Yes |
| `raw_text` | str (1-3333) | Request body | Yes |
| `language_code` | str (2-10) | Request body | No (default: en) |

**OUTPUT Validation Functions (what Cube 10 checks):**

| Output | Validation | Pass Criteria |
|--------|------------|---------------|
| `ResponseMeta.id` | UUID | Non-null, unique |
| `ResponseMeta.raw_text` | Stored verbatim | Matches submitted raw_text exactly |
| `TextResponse.clean_text` | PII/profanity scrubbed | Contains no PII patterns; [TYPE_REDACTED] placeholders present if PII detected |
| `TextResponse.response_hash` | SHA-256 of raw_text | Length == 64; deterministic |
| `TextResponse.pii_detected` | bool | True if NER or regex found entities |
| `TextResponse.profanity_detected` | bool | True if DB filters matched |
| `ResponseRead.heart_tokens_earned` | float ≥ 0 | ceil(duration_minutes), min 1 |
| `ResponseRead.unity_tokens_earned` | float ≥ 0 | heart × unity_multiplier |
| `ResponseRead.summary_33` | str \| None | Populated async by Cube 6 Phase A |
| Anonymization | Mode-dependent | anonymous: participant_id=None, anon_hash=64-char; identified: participant_id=UUID, anon_hash=None |
| Phase A task | Fires async | `summarize_single_response()` called with clean_text (never raw_text) |
| Supabase broadcast event | Published | `cube2:response:{session_id}` channel receives submission event |

**Downstream Contracts (MUST NOT break):**
- Cube 3: Imports `detect_pii`, `scrub_pii`, `detect_profanity`, `scrub_profanity`, `publish_submission_event` from Cube 2
- Cube 4: Reads `ResponseMeta` + `TextResponse` via session_id FK
- Cube 5: `start_time_tracking()` / `stop_time_tracking()` called synchronously
- Cube 6: `summarize_single_response(db, session_id, response_id, raw_text=clean_text, ...)` called async
- Cube 9: Reads `ResponseMeta.raw_text` for CSV Detailed_Results column

**Metrics Endpoint:** `GET /sessions/{id}/responses/metrics` → `{system: {...}, user: {...}, outcome: {...}}`

| Metric Category | Key Metrics | Source |
|----------------|-------------|--------|
| System | avg/max_submission_latency_s, responses_per_minute, ner_pipeline_invocations | TimeEntry + ResponseMeta |
| User | language_distribution, pii/profanity_detection_rate_pct, responses_per_participant | TextResponse + ResponseMeta |
| Outcome | clean_response_ratio_pct, total_heart/unity_tokens_distributed | TextResponse + TimeEntry |

**Test Command:** `python -m pytest tests/cube2/ -v --tb=short` (54 tests)

---

### Cube 1 — CRS Checkout Reference

| CRS | Sub-CRS | Contract | Validation |
|-----|---------|----------|------------|
| CRS-01 | 01.01 Config fields | Session created with all config fields persisted | All 30+ fields non-null or default |
| CRS-01 | 01.02 Short code + QR | 8-char code + QR PNG generated atomically | Code unique; QR valid PNG |
| CRS-02 | 02.01 Anonymous join | user_id=None accepted without 401 | Participant created with anon_hash |
| CRS-02 | 02.02 Join flow | Language → Identity → Results → Join | 3-step, no page reload |
| CRS-02 | 02.03 Lobby auto-advance | Broadcast fires on transition | ≤2s via 4-layer fallback |
| CRS-02 | 02.04 Late joiner bypass | Skip lobby if status=="polling" | Direct to input screen |
| CRS-03 | 03.01 UUID5 seeded | Deterministic ID from seed+title | Same seed = same UUID |
| CRS-03 | 03.02 Collision retry | 5-attempt short code retry | Error on exhaustion, not silent |
| CRS-04 | 04.01 Expiry → 410 | Expired sessions blocked | SessionExpiredError raised |
| CRS-04 | 04.02 Invalid state block | Non-open/polling rejects join | SessionStateError raised |
| CRS-04 | 04.03 State machine | draft→open→polling→ranking→closed→archived | SESSION_TRANSITIONS enforced |
| CRS-05 | 05.01 Anon hash | SHA-256 deterministic 64-char | Same PID = same hash |
| CRS-05 | 05.02 Identified mode | participant_id preserved | Linkable across responses |
| CRS-05 | 05.03 Pseudonymous | Both PID + anon_hash stored | Dual identity for audit |
| CRS-06 | 06.01 Polling enforcement | Responses only in polling state | 100% rejection outside polling |
| CRS-06 | 06.02 Stop → ranking | Triggers Cube 5 orchestrator | Non-blocking async task |

### Cube 2 — CRS Checkout Reference

| CRS | Sub-CRS | Contract | Validation |
|-----|---------|----------|------------|
| CRS-05 | 05.01-03 | Anonymization modes | anonymous: pid=None+hash; identified: pid+no hash; pseudonymous: both |
| CRS-06 | 06.01 | Session must be polling | SessionNotPollingError on non-polling |
| CRS-07 | 07.01 | 6-step pipeline | validate→PII→profanity→store→publish→summarize |
| CRS-07 | 07.02 | 33 languages, Unicode | CJK/Arabic/emoji accepted; language_code detected |
| CRS-07 | 07.03 | Live feed toggle | summary_ready broadcast; raw vs 33-word toggle |
| CRS-08 | 08.01 | SHA-256 integrity | response_hash = 64-char hex of raw_text; deterministic |
| CRS-08 | 08.02 | PII gate | Only clean_text reaches Cube 6; structured log assertion |
| CRS-09 | 09.01 | Web_Results 5-column | q_number, question, user, detailed_results, response_language |

---

### Code Challenge — Simulation Mode (Current Phase)

> **Status: SIMULATION ONLY.** No live code replacement yet.
> Test dataset: `Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv` (5,000 responses, all Q-0001)

**How simulation works today:**
1. Load v04.1_5000.csv as input dataset (5,000 simulated user responses)
2. Run target cube's pipeline against this dataset
3. Measure metrics (latency, token usage, theme accuracy, PII detection rate)
4. Compare against current baseline stored in `CUBE_N_TEST_METHOD` dict
5. Enhanced version must EXCEED all baseline metrics

**The benchmark dataset (v04.1_5000.csv) is the universal test:**
- 5,000 rows × 16 columns (Q_Number through Theme2_3_Confidence)
- All Q-0001 (single question: AI Governance)
- Mixed languages, varied response lengths
- Pre-computed themes for validation comparison

### Code Challenge Rules (Applies to ALL Cubes)

1. **Checkout:** Developer downloads current cube code + test suite + metrics baseline + CRS/sub-CRS table
2. **Simulate:** Run cube against v04.1_5000.csv — measure I/O + metrics
3. **Enhance:** Modify any function while preserving INPUT/OUTPUT contracts + CRS compliance
4. **Validate:** Run test suite — 100% pass required (0 failures)
5. **Benchmark:** Run metrics endpoint — ALL metrics must EXCEED baseline (not just match)
6. **Spiral Check:** Forward + backward propagation verified (downstream cubes unbroken)
7. **Lexicon Gate:** Zero hardcoded English in UI; all strings use `t()` with Lexicon keys
8. **Submit:** PR with SSSES impact statement in commit message
9. **Review:** 12 Ascended Master agents evaluate (MoT leads)
10. **Approve/Reject:** ◬ ♡ 웃 Team reviews agent verdicts; approved = new cube version promoted
11. **Payment:** CQS-based reward (manual ◬ ♡ 웃 Team payout at first; Cube 8 automated later)

### Evolution Roadmap (Long-Term Vision)

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Simulation only — v04.1_5000.csv benchmark, manual code changes | **Current** |
| **Phase 2** | Human prioritization (Cube 7 voting) drives improvement backlog | Planned |
| **Phase 3** | AI proposes code improvements based on voted priorities | Planned |
| **Phase 4** | ◬ ♡ 웃 Team approves/rejects AI recommendations | Planned |
| **Phase 5** | Approved changes auto-deploy (replacing manual GitHub workflow) | Vision |
| **Phase 6** | Self-evolving cube lattice — AI + human governance co-create code | Vision |

```
  Phase 1 (NOW)          Phase 2-3              Phase 4-5               Phase 6
  ┌──────────┐         ┌──────────┐          ┌───────────┐          ┌───────────┐
  │Simulation│   ──▶   │ Human    │   ──▶    │AI Proposes│   ──▶    │  Self-    │
  │Only      │         │ Votes    │          │◬ ♡ 웃 Team│          │  Evolving │
  │v04.1_5000│         │ Drive    │          │Approves   │          │  Code     │
  │.csv      │         │ Backlog  │          │Auto-      │          │  Lattice  │
  │Manual    │         │ AI Hints │          │Deploy     │          │  Conscious│
  └──────────┘         └──────────┘          └───────────┘          └───────────┘
```

### Neural Cube Architecture — Design Principle

Each cube is a **neural pathway**, not a permanent structure. Like neurons in a conscious mind:

- **Optimize:** A cube's internal wiring can be completely rewritten as long as I/O contracts hold
- **Disappear:** If two cubes merge into a more efficient single pathway, the redundant cube dissolves
- **Reappear:** If a merged cube needs specialization, it can split back into components
- **Self-diagnose:** Metrics reveal which cubes are bottlenecks — the system identifies its own weaknesses
- **Self-train:** Based on human prioritization (Cube 7 votes), the system requests specific improvements

The polling tool is the **proof of concept** — demonstrating that code can evolve through conscious human governance before this pattern scales to systems that heal their own neural networks.

```
  Stimulus (5000 responses)
         │
         ▼
  ┌──────────────────────────────────────────────────┐
  │  Cube 1-9                                        │
  │                                                  │
  │  Neural Pathways (replaceable, mergeable,        │
  │    splittable) — edge compute, on-device,        │
  │    local models, embedded inference              │
  │                                                  │
  │  API Pathways (replaceable, mergeable,           │
  │    splittable) — cloud calls to OpenAI,          │
  │    Gemini, Grok, Claude, AWS, Azure              │
  │                                                  │
  │  I/O Nodes — contracts are the only constant     │
  └──────────────────┬───────────────────────────────┘
                     │
                     ▼
  Response (themes, rankings, tokens)
                     │
                     ▼
  Metrics vs Baseline
                       │
                 ┌─────┴──────┐
                 │  Better?  │──Yes──▶ Promote new pathway
                 └─────┬──────┘
                       │No
                       ▼
                 Keep existing pathway
```

**Two pathway types, one contract:**

| Pathway Type | Where It Runs | Examples | Evolution |
|-------------|---------------|----------|-----------|
| **Neural** | Edge / on-device / local | Embedded NER, local clustering, on-device inference, edge ML models | Replaces cloud calls as models shrink; runs offline; lower latency |
| **API** | Cloud / remote services | OpenAI, Gemini, Grok, Claude, AWS Transcribe, Azure Speech | Provider-agnostic; failover chain; swap without code change |

Both pathway types are **replaceable, mergeable, and splittable:**
- A Neural pathway (local NER) can be **replaced** by an API pathway (cloud NER) or vice versa
- Two API pathways (summarization + classification) can **merge** into one multi-task call
- One Neural pathway (monolith model) can **split** into specialized micro-models
- The system doesn't care which type handles the work — only that **I/O contracts hold and metrics improve**

The codebase will eventually include **both edge Neural Networks and cloud API calls**, choosing the optimal pathway per cube based on latency, cost, accuracy, and availability. A cube might use local inference for PII detection (fast, private) and cloud API for theme generation (powerful, scalable) — and swap either at any time.

The v04.1_5000.csv benchmark is the **stimulus** — the network must respond correctly regardless of whether its pathways are neural (edge) or API (cloud). The only thing that matters is: **did the output improve?**

> *"The code will be designed to update itself one day — where Shared Intention moves at the Speed of Thought."*

### Cube 10 — DesignMatrix VOC (Voice of Customer)
| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-22 | Balance between group input and leadership responsibility | "Leaders must own final decisions." |
| CRS-23 | Repeatable decision frameworks | "Enables governance and repeatable playbooks." |
| CRS-24 | Enterprise-grade control and traceability | "Non-negotiable for regulated organizations." |
| CRS-25 | Fair recognition of time, expertise, and automation | "Not all contributions are financial — but they still matter." |
| CRS-26 | Safe experimentation without risk | "Mirrors how senior engineers actually want to work." |
| CRS-27 | Proof that changes improve outcomes | "Show me the metrics, not just the code." |
| CRS-28 | Confidence that optimizations don't break other parts | "Critical for modular architectures." |
| CRS-29 | Data-driven go/no-go decisions | "Prevents regressions disguised as improvements." |
| CRS-30 | Human-in-the-loop governance | "Required before AI self-modifying systems." |
| CRS-31 | Full traceability of system evolution | "We need to know who changed what, and when." |
| CRS-32 | Transparent value attribution | "Builds long-term trust in the token model." |
| CRS-33 | Fairness and correction mechanisms | "Prevents resentment and loss of trust." |
| CRS-34 | Controlled financial and governance flow | "Required for audits and payouts." |
| CRS-35 | Executive clarity and adoption confidence | "If leadership can't explain it, it won't scale." |

---

## Cube 10 — Per-Cube Simulation Architecture

Cube 10 is the center of the Level 2 grid with the **Feedback Loop (FB) at its core**. The Feedback Loop is the nervous system — it collects user and moderator feedback from every screen, auto-tags each submission with the relevant Cube + CRS, and feeds the prioritized backlog that drives all evolution.

```
  Cube 10 Internal Architecture:

  ●─────●─────●─────●
  │ SIM │ RPL │ CHK │   SIM = Simulation Runner
  ●─────●─────●─────●   RPL = Replay Dataset (v04.1_5000.csv)
  │ MTR │ FB  │ VER │   CHK = Checkout / Checkin
  ●─────●─────●─────●   MTR = Metrics Compare
  │ BCK │ TRG │ APR │   FB  = Feedback Loop (CENTER)
  ●─────●─────●─────●   VER = Version Control
                          BCK = Backlog (from FB → Cube 7 votes)
  FB collects from:       TRG = Triage (AI-assisted sentiment + priority)
  - Landing (CRS-01)     APR = ◬ ♡ 웃 Team Approval Gate
  - Join (CRS-02)
  - Polling (CRS-07)     Supabase table: product_feedback
  - Dashboard (CRS-06)   API: POST /feedback (any user)
  - Results (CRS-14)          GET /feedback (admin)
  - Ranking (CRS-11)          GET /feedback/stats (admin)
  - Settings (CRS-01)
  - SIM (CRS-25)
```

While the Easter Egg SIM (documented above) provides a walkthrough preview of the full session lifecycle, the production Cube 10 feature enables **per-cube isolation, code challenge competitions, and metric-driven evolution** of the entire cube lattice. This section documents the simulation orchestration architecture that powers those capabilities.

### Cube Isolation Model

Cube 10 treats each cube (1-9) as an independently testable unit by replacing its upstream and downstream dependencies with controlled fixtures.

**Checkout Process:**
1. A Team/Lead user selects a cube to simulate via the Cube 10 UI (`checkout_cube()`)
2. The simulation runner loads the cube's current production code into the in-browser editor
3. Upstream cube outputs are replaced with **canned fixture data** from the `replay_datasets` table — these are frozen snapshots of real production inputs captured from past sessions
4. The cube-under-test executes against these fixtures, producing outputs
5. Downstream cube inputs receive the cube-under-test's actual output for validation (not canned data — real propagation)
6. The simulation runner captures and measures four key dimensions:
   - **Latency** — p50 and p95 execution time
   - **Accuracy** — output correctness vs expected production output (from `expected_output_snapshot`)
   - **Test pass rate** — all existing unit + E2E tests must pass (0 regressions)
   - **Resource usage** — memory and CPU consumption during execution
7. Results are compared against the production baseline stored in the `simulation_results` table
8. A determinism check verifies that identical inputs produce identical outputs (SHA-256 replay hash)

**Isolation Guarantees:**
- Each simulation runs in a sandboxed environment — no writes to production databases
- In-memory state is mocked with in-memory stores
- MongoDB reads come from snapshot data, not live collections
- External API calls (AI providers, STT providers) use recorded responses unless explicitly testing live integration
- The cube's dependency graph hash is computed and stored with every simulation run for version traceability

**Data Flow Diagram:**
```
  [replay_datasets]          [cube-under-test]          [simulation_results]
        |                          |                          |
  frozen inputs ──────────> execute code ──────────> measure metrics
        |                          |                          |
  upstream fixtures          real outputs              compare vs baseline
        |                          |                          |
  (Cubes N-1..1)            downstream validation      pass/fail assessment
                             (Cubes N+1..9)
```

### Per-Cube Simulation Map

Each cube has specific upstream inputs that are simulated (fixture data) and downstream outputs that are captured for measurement. The "Live Components" column identifies what runs as real code even during simulation (not mocked).

| Cube | Upstream Inputs (Simulated) | Live Components | Downstream Outputs (Captured) | Baseline Source |
|------|---------------------------|-----------------|------------------------------|----------------|
| 1 | Moderator config, QR scan | QR generation, UUID | Session ID, participant record | SPIRAL_METRICS N=18 |
| 2 | Raw text, session config | PII detection (NER model) | Validated response, hash | SPIRAL_METRICS N=18 |
| 3 | Audio blob, session config | STT API (provider-dependent) | Transcript, hash | SPIRAL_METRICS N=9 |
| 4 | Cube 2/3 responses | in-memory presence | Collected set, language breakdown | SPIRAL_METRICS N=9 |
| 5 | Session state events | Rate table lookup | Time entries, pipeline triggers | SPIRAL_METRICS N=18 |
| 6 | Collected responses, seed | AI embedding + summarization APIs | Themes, summaries, assignments | SPIRAL_METRICS N=9 |
| 7 | Theme list, user rankings | (all math, no external APIs) | Aggregated rankings, governance | PENDING |
| 8 | Time entries, CQS scores | Rate table lookup | Token balances, ledger entries | PENDING (19 tests) |
| 9 | Rankings, tokens, CQS | (export generation, no APIs) | CSV/PDF, pixelated tokens | PENDING |

**Key observations:**
- Cubes 7 and 9 have **no external API dependencies** — their simulations are fully deterministic and self-contained
- Cubes 3 and 6 depend on external AI/STT providers — simulations can run in **recorded mode** (cached API responses) or **live mode** (real API calls, useful for provider comparison)
- Cube 5 bridges time tracking and pipeline orchestration — its simulation must verify that downstream triggers fire correctly without actually executing the downstream pipelines
- All cubes share the same replay hash verification: `SHA-256(inputs + parameters + seed) == expected_hash`

### Code Challenge Feature (MVP3)

#### Overview

The Code Challenge is a competition model where users with Team/Lead roles can submit replacement code for specific functions within a cube. The goal is to improve the cube's performance metrics beyond the existing production baseline.

The simulation runner executes a strict evaluation pipeline:
1. Loads the cube's canned inputs from `replay_datasets` (upstream simulated data)
2. Runs the user's submitted code against those inputs in a sandboxed environment
3. Measures output metrics across all four dimensions (latency, accuracy, test pass rate, resource usage)
4. Compares every metric against the existing production implementation baseline
5. If **ALL** metrics meet or exceed the baseline, the code is flagged for Lead/Admin review
6. Approved code creates a new `cube_versions` record and can be promoted to production

**The bar is high by design:** a submission that improves latency but regresses accuracy is rejected. Every dimension must hold or improve.

#### Challengeable Functions Per Cube

Not all functions within a cube are open for challenge. Only functions with well-defined inputs, outputs, and measurable metrics are eligible. Internal wiring, auth middleware, and database schema functions are excluded.

| Cube | Challengeable Functions | Key Metric |
|------|----------------------|------------|
| 1 | `generate_qr_code()`, `validate_join_request()`, `check_capacity()` | Join latency |
| 2 | `detect_pii()`, `scrub_pii()`, `detect_profanity()` | PII detection accuracy |
| 3 | `transcribe_audio()`, `validate_transcript()` | STT accuracy, latency |
| 4 | `get_collected_responses()`, `get_response_count()` | Aggregation throughput |
| 5 | `calculate_tokens()`, `orchestrate_post_polling()` | Token calc speed, pipeline reliability |
| 6 | `classify_theme01()`, `generate_themes()`, `assign_responses_to_themes()` | Theme accuracy, determinism |
| 7 | `aggregate_rankings()`, `apply_governance_weights()` | Ranking determinism, fairness |
| 8 | `calculate_session_tokens()`, `process_reward_payout()` | Ledger integrity, calc speed |
| 9 | `export_csv()`, `generate_pixelated_token()` | Export compliance, token integrity |

#### Pass Criteria

A code challenge submission must satisfy ALL of the following to be eligible for approval:

- **Test integrity:** ALL existing unit + E2E tests must pass with 0 regressions
- **Spiral metrics:** ALL spiral metrics (forward and backward) must meet or exceed the production baseline
- **Latency budget:** Execution latency must not increase by more than 10% at p95
- **Memory budget:** Peak memory usage must not increase by more than 20%
- **Determinism:** Identical inputs MUST produce identical outputs — the replay hash must match
- **Downstream compatibility:** The cube's outputs must be consumable by all downstream cubes without modification

A submission that fails any single criterion is automatically rejected with a detailed breakdown showing which metrics regressed and by how much.

#### Version Tracking

Every code submission — whether approved, rejected, or still under review — creates a permanent record in the version tracking system:

- Every submission creates a `cube_versions` record with `code_hash` (SHA-256 of submitted code)
- The `dependency_graph_hash` captures the exact versions of all upstream and downstream cubes at the time of simulation
- Approved versions set `is_production = true` and record the `promoted_by` user
- Previous production versions retain their records but have `is_production = false`
- Rollback is available via `simulation_runs.rollback_to_version` — reverts to any previous approved version
- The version history forms an immutable audit trail: who changed what, when, why, and what metrics resulted

#### Feedback Pipeline

The self-improvement feedback system feeds into the Code Challenge ecosystem:

- **System-prompted feedback:** After each simulation run completes, the system prompts the user with contextual questions about their experience and the results
- **Persistent feedback icon:** Available on every screen — users can submit improvement suggestions at any time
- **Cube-scoped tagging:** Every feedback item is tagged with the relevant cube ID and scoping context (Project/Differentiator/Specification)
- **Auto-triage:** AI-assisted categorization assigns category (`bug` / `feature_request` / `improvement` / `usability` / `performance`) and priority (`low` / `medium` / `high`)
- **Backlog integration:** Triaged feedback items are surfaced to Team/Lead users as a prioritized backlog, filterable by cube and scoping context
- **Challenge inspiration:** High-priority feedback items on specific cube functions are surfaced as suggested Code Challenge targets — "This function has 3 improvement requests. Can you beat the baseline?"

### Spiral Test Requirements Per Cube

Before a cube can be isolated for Cube 10 simulation, it must have a verified spiral metrics baseline. The minimum requirement is N=5 bidirectional spiral runs with 0 test failures. This ensures the production baseline is statistically reliable for comparison.

| Cube | Required Baseline | Current Status | Gap |
|------|-------------------|----------------|-----|
| 1 | N=5+ | N=18 (Feb 25) | READY |
| 2 | N=5+ | N=18 (Feb 25) | READY |
| 3 | N=5+ | N=9 (Feb 23) | READY |
| 4 | N=5+ | N=9 (Feb 26) | READY |
| 5 | N=5+ | N=18 (Feb 26) | READY |
| 6 | N=5+ | N=9 (Feb 26) | READY |
| 7 | N=5+ | NONE | BLOCKED — implement first |
| 8 | N=5+ | Partial (19 tests) | NEEDS full spiral run |
| 9 | N=5+ | NONE | BLOCKED — implement first |
| 10 | N=5+ | N=18 SIM only | NEEDS production feature spiral |

**Readiness summary:**
- **6 of 9 cubes are READY** for Cube 10 simulation (Cubes 1-6)
- **Cube 7 (Ranking) and Cube 9 (Reports)** are blocked on implementation — no tests exist yet
- **Cube 8 (Tokens)** has 19 tests but needs a full N=5+ bidirectional spiral run to establish a reliable baseline
- **Cube 10 itself** has Easter Egg SIM spiral metrics (N=18) but needs its own production feature spiral once the Code Challenge UI and simulation runner are implemented

**Unblocking sequence:**
1. Implement Cube 7 (Ranking) → run N=5+ spiral → READY
2. Complete Cube 8 spiral run → READY
3. Implement Cube 9 (Reports) → run N=5+ spiral → READY
4. Build Cube 10 production features (Code Editor, Simulation Runner, Feedback Pipeline)
5. Run Cube 10 production spiral → ALL CUBES READY for per-cube simulation
