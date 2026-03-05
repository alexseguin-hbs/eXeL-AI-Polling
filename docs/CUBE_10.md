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
- **Per-session SIM data:** 4 poll-specific data files in `frontend/lib/sim-data/` with complete cube I/O (state flows, 7 AI responses, themes, voice transcript)
  - **POLL_1:** Product Feedback (Live Interactive) — Feature Requests / Performance & Security / Integration Needs
  - **POLL_2:** Q1 Strategy Alignment (Live Interactive) — Growth Initiatives / Customer Retention / Team Culture
  - **POLL_3:** AI Governance (Live Interactive) — Opportunity & Innovation / Risk & Concerns / Balanced Approach
  - **POLL_4:** Team Innovation Challenge (Static Poll, 3-day) — Collaboration Tools / Process Innovation / Culture & Mindset
- **Transport controls:** `|<` Jump to start / `<<` Step back / `▶/⏸` Play/Pause / `>>` Step forward / `>|` Jump to end + step counter (Step X/Y) + progress dots
- **State flows corrected:**
  - **Live Poll (8 steps):** draft → open → polling → closed → theming → visuals → ranking → archived
  - **Static Poll (7 steps):** draft → open → polling → theming → visuals → ranking → archived
- **Session picker:** Select from 4 polls with Live/Static badge, question preview, click to simulate
- **7 AI Users:** Per-poll canned responses arrive progressively (2-17s delays) with topic-specific themes
- **Cube 6 Theming Stub:** 3 simulated themes per poll with confidence scores + response counts + color coding
- **Cube 7 Ranking Stub:** Click-to-rank UI — tap themes in priority order (#1, #2, #3)
- **Auto-transition:** polling → closed (1.5s) → theming (1.5s) → visuals (3s) → ranking
- **Question translation:** Globe icon button — toggles between original + translated per active locale
- **Sim Moderator Experience:** Transport-controlled session lifecycle, session picker, per-poll data, participant counter, auto-play
- **AI Provider Settings:** Collapsible V2T provider selector with pricing estimates per 1000 users (OpenAI $12, Grok $12, Gemini $4, AWS $48)
- **12 new lexicon keys × 32 languages = 384 translations:** select_session, select_session_desc, transport_step, state_theming, state_visuals, state_closed, session_closed_msg, translate_question, translated, original, create_new, jump_to_start
- Files: `frontend/lib/sim-data/index.ts`, `frontend/lib/sim-data/poll-{1-4}-*.ts`, `frontend/components/session-view.tsx`, `frontend/components/sim-moderator-experience.tsx`, `frontend/lib/easter-egg-context.tsx`, `frontend/lib/mock-data.ts`

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
| `frontend/lib/mock-data.ts` | Mock API handlers for SIM data |

---

## 100-User Spiral Test with 12 MoT Agents: IMPLEMENTED (2026-02-26)

**Purpose:** Validates cross-device response sharing via Cloudflare Pages Functions + Cache API at scale. Stress-tests the mock data + live feed pipeline with 100 simulated users across 12 agent waves in 11 languages.

**Code location:** `frontend/lib/sim-data/spiral-test-100-users.ts` (data), `frontend/lib/mock-data.ts` (orchestrator), `frontend/app/dashboard/page.tsx` (UI)

### MoT (Master of Thought) Architecture

Central orchestrator dispatches 100 responses across 12 sequential agent waves with staggered timing (~60 seconds total). Each wave fires a group of responses at specified delays, each POSTing to both local `mockResponses[]` (immediate feed) and `/api/responses` (Cloudflare Cache API for cross-device).

### 12 Agent Waves

| Wave | Agent Name | Users | Delay Start | Theme Focus |
|------|-----------|-------|-------------|-------------|
| 1 | Catalyst | 12 | 0s | Mixed — kicks off diversity |
| 2 | Sentinel | 10 | 3s | Risk & security concerns |
| 3 | Nexus | 10 | 7s | Integration & collaboration |
| 4 | Oracle | 9 | 11s | Future predictions |
| 5 | Forge | 9 | 16s | Building & implementation |
| 6 | Compass | 8 | 21s | Direction & strategy |
| 7 | Prism | 8 | 26s | Multi-perspective analysis |
| 8 | Echo | 8 | 31s | Reinforcing key themes |
| 9 | Vanguard | 7 | 37s | Cutting-edge ideas |
| 10 | Harmony | 7 | 43s | Consensus building |
| 11 | Cipher | 6 | 49s | Data & analytics |
| 12 | Zenith | 6 | 55s | Summary & synthesis |
| **Total** | | **100** | **0–60s** | |

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

### Files

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/lib/sim-data/spiral-test-100-users.ts` | 305 | 100 canned responses, 12 wave configs, type exports |
| `frontend/lib/mock-data.ts` | +70 | `startSpiralTest()` MoT orchestrator, progress callback types |
| `frontend/lib/constants.ts` | +3 | `SPIRAL_TEST_ENABLED` toggle |
| `frontend/app/dashboard/page.tsx` | +55 | Spiral test button + progress UI in live feed card |
