# Claude Code - Project Instructions

## Workflow Rules
- **ALWAYS commit and push to GitHub after each change.** Do not wait — commit and push immediately after every modification.

## Project
- **Name:** eXeL-AI-Polling (SoI Governance Engine)
- **Local path:** /home/explore/eXeL_AI_Polling
- **Platform:** Linux (WSL2)
- **Mission:** Transform monolithic polling script into production-scale, deterministic, horizontally scalable Governance Compression Infrastructure.
- **Delivery model:** API-first platform with SDK — the entire tool is embeddable into external products, websites, and codebases via API/SDK (not just a standalone web app)

## GitHub Connection
- **Repository:** https://github.com/alexseguin-hbs/eXeL-AI-Polling
- **Branch:** main
- **Username:** alexseguin-hbs
- **Auth method:** Personal access token (PAT)

### Connecting to GitHub
If the repo is not yet initialized locally, run these steps:

1. Initialize git (if needed):
   ```bash
   git init
   ```

2. Add the remote with token authentication:
   ```bash
   git remote add origin https://alexseguin-hbs:<TOKEN>@github.com/alexseguin-hbs/eXeL-AI-Polling.git
   ```
   > **Note:** Ask the user for their current GitHub PAT. Never store tokens in files.

3. Fetch and sync:
   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   ```

### Pushing Changes
After making changes, commit and push:
```bash
git add <files>
git commit -m "Descriptive message"
git push origin main
```

### If Remote Already Exists
Check with `git remote -v`. If the token has changed, update it:
```bash
git remote set-url origin https://alexseguin-hbs:<NEW_TOKEN>@github.com/alexseguin-hbs/eXeL-AI-Polling.git
```

## Reference Files
| File | Purpose |
|------|---------|
| `eXeL-AI_Polling_v04.2.py` | Original monolithic polling + summarization + clustering pipeline |
| `Updated_Web_Results_With_Themes_And_Summaries_v03 (1).csv` | Target output format (60-row sample with 15-column schema) |
| `eXeL-AI_DesignMatrix.xlsx` | Design traceability matrix, user journey, user stories, CRS mapping |
| `Requirements.txt` | Full CRS 1–35 requirements specification |
| `Token_Governance_Math.md` | Formal governance + tokenomics math specification |
| `Cube_Mapping_From_v04.2.md` | Mapping between monolith sections and cube services |

## Technology Stack Decisions

### Frontend
- **Framework:** React + Next.js
- **UI Library:** shadcn/ui (clean, modern default — no existing brand/designs yet)
- **Hosting:** Cloudflare Pages
- **Live URL:** https://exel-ai-polling.explore-096.workers.dev
- **Responsive UI:** Mobile-first design — must work on Desktop, Laptop, Tablet, Phone (Android + iOS)
- **No native app** — responsive web only, all devices via browser
- **Browsers:** Chrome, Safari (iOS), Firefox, Edge

### Backend
- **Framework:** FastAPI (Python) microservices
- **Hosting:** VPS/cloud server with Cloudflare as CDN/proxy in front
- **Why:** Python required for ML/AI ecosystem (embeddings, clustering, summarization)
- **Task Queue:** Celery or async worker pool for background processing
- **Worker Fleet:** Dedicated embedding batch workers for AI pipeline

### Databases
- **PostgreSQL:** Primary relational store (sessions, questions, rankings, audit, tokens, governance)
- **MongoDB:** Raw response storage (flexible schema for text/voice payloads)
- **Redis:** Real-time state (presence tracking, live rankings, WebSocket state, caching, rate limiting)

### Authentication
- **Provider:** Auth0
- **Roles (RBAC):** Moderator, User (Participant), Lead/Developer, Business Owner/Admin

### AI / Theme Clustering (Cube 6)
- **Architecture:** Multi-provider abstraction layer (provider-agnostic interface)
- **Launch providers:** OpenAI, Grok (xAI), Gemini (Google) — user selects per session
- **Extensibility:** Abstraction interface allows adding more providers later (Anthropic, Cohere, open-source, etc.)
- **Pipeline:** Batch Embeddings → MiniBatchKMeans Streaming Clustering → Summarization → Themes with confidence + counts
- **Determinism:** Seeded clustering, fixed embedding model version per provider, stable cluster ordering
- **Circuit Breaker:** Per-provider fallback strategy; failover to next available provider on outage

### Scale Targets
- **Stable:** 100,000 concurrent users
- **Burst:** 1,000,000 concurrent capacity
- **AI processing:** 1M inputs via sampling/batching in < 60 seconds
- **Theme determinism:** Identical inputs MUST yield identical themes

### Deployment
- **Kubernetes:** Horizontal autoscaling blueprint
- **Observability:** Prometheus/Grafana metrics, structured logging, alerting

### API-First Platform & SDK
- **Architecture:** Every feature accessible via public REST API — web UI is just one consumer
- **SDKs:** JavaScript/TypeScript (primary), Python (secondary) — typed client libraries wrapping all endpoints
- **Embeddable modes:** Full embed (iframe/Web Component), Headless API (custom UI), Hybrid
- **Scoping hierarchy:** Project ID → Differentiator ID → Specification ID
  - **Project:** Top-level container (company's product/initiative) — isolated config, sessions, tokens, data
  - **Differentiator:** Distinct dimensions/features/hypotheses within a project (e.g., "UX Approach A vs B")
  - **Specification:** Concrete parameters/constraints to fine-tune and simulate within a differentiator
- **API keys:** Per-organization, scoped to projects, rate-limited, usage-metered for billing
- **Webhooks:** Async event callbacks (themes ready, ranking complete, etc.)
- **Use case:** Companies embed governance engine into their own products to poll, prioritize, and simulate ideas or existing products at the Project/Differentiator/Specification level

## Production Architecture

### Core Services (maps to Cube Architecture)
| Service | Cube | Responsibility |
|---------|------|---------------|
| API Gateway | Shared / Cube 5 | FastAPI routes, rate limiting, auth, request validation |
| Session Service | **Cube 1** | Session CRUD, state machine, QR generation |
| Ingestion Service | **Cubes 2 & 3** | Text/voice input validation, anonymization, PII detection |
| Collection Service | **Cube 4** | Response aggregation, MongoDB writes, Redis caching |
| Orchestrator Service | **Cube 5** | Triggers AI + ranking pipelines, time tracking |
| Embedding Worker Fleet | **Cube 6** (workers) | Batch embedding generation (async, horizontally scaled) |
| Clustering Engine | **Cube 6** (clusterer) | MiniBatchKMeans streaming clusterer (deterministic seed) |
| Governance Engine | **Cube 7** | Voting weight, compression, quadratic normalization |
| Token Ledger Service | **Cube 8** | Append-only ledger, lifecycle states, treasury accounting |
| Ranking Service | **Cube 7** | Deterministic aggregation, live WebSocket updates |
| Reporting Service | **Cube 9** | CSV/PDF export, dynamic analytics, insights engine |
| Simulation Runner | **Cube 10** | Cube checkout, replay tests, metric comparison |

### Architectural Constraints
- **No row-by-row API calls** — batch all embedding requests
- **No disk-heavy CSV intermediates** — stream data through pipeline
- **No repeated full clustering** — use streaming/incremental updates
- **Horizontal scaling** — all services must be stateless or use shared state (Redis/Postgres)
- **Rate limiting** on all public endpoints
- **Anti-sybil safeguards** on voting and response submission
- **Governance weight damping** to prevent manipulation
- **Circuit breaker** pattern for all external AI provider calls (OpenAI, Grok, Gemini)
- **Graceful degradation** — system must serve partial results if AI pipeline is delayed

### Determinism Requirements
All clustering and ranking operations must be fully reproducible:
- **Seeded MiniBatchKMeans** — fixed random_state for identical outputs
- **Fixed embedding model version** — pin exact model ID, never auto-upgrade
- **Stable cluster ordering** — deterministic sort after clustering
- **Replay reproducibility hash** — SHA-256 of inputs + parameters = expected output hash
- **Version-locked cube dependency graph** — every cube pins its upstream/downstream versions

### Failure Mode Handling
| Failure | Strategy |
|---------|----------|
| AI provider outage | Circuit breaker → queue requests → retry with exponential backoff → failover to next provider → fallback to cached embeddings |
| Embedding backlog surge | Back-pressure signal to ingestion → sampling mode → priority queue |
| Partial cluster update | Atomic batch commits → rollback on failure → serve last stable cluster |
| Redis failure | Graceful degradation to Postgres for state → reconnect with backoff |
| Postgres failover | Read replicas → automatic promotion → connection pool retry |
| Burst queue overflow | Shed load via sampling → reject with 503 + retry-after header |
| Governance manipulation | Anti-sybil detection → weight damping → anomaly flagging → audit log |

## Build Approach
- **Scaffold all Cubes 1-9 first,** then implement cube by cube
- **SoI Trinity — Three Intelligences, One Governance Engine:**
  ```
                 A.I.          S.I.          H.I.
               ╔═══════╗     ╔═══════╗     ╔═══════╗
               ║   ◬   ║     ║   ♡   ║     ║   웃  ║
               ╚═══════╝     ╚═══════╝     ╚═══════╝
              Artificial      Shared           Human
             Intelligence     Intent     Intelligence
                    ╲            │            ╱
                      ╲          │          ╱
                        ╲        │        ╱
                        ●─────●─────●─────●
                        │  9  │  2  │  3  │
                        ●─────●─────●─────●
                        │  8  │  1  │  4  │
                        ●─────●─────●─────●
                        │  7  │  6  │  5  │
                        ●─────●─────●─────●

              9=Reports  2=Text      3=Voice
              8=Tokens   1=Session   4=Collector
              7=Ranking  6=AI        5=Gateway

         "Where Shared Intention moves at the Speed of Thought."

  Level 2 — Cube 10 Simulation at center:

                        ●─────●─────●─────●
                        │ --  │ --  │ --  │
                        ●─────●─────●─────●
                        │ --  │ 10  │ --  │
                        ●─────●─────●─────●
                        │ --  │ --  │ --  │
                        ●─────●─────●─────●
  ```
- **Implementation order (clockwise spiral from center):**
  1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
  (center → top → top-right → right → bottom-right → bottom → bottom-left → left → top-left)
- **Cube 10** is Level 2 center, implemented after Layer 1 is complete
- **Spiral Development Protocol:**
  The grid is a **bidirectional spiral** — not just a build order. When making any change:
  - **Forward propagation (1→10):** Trace impact outward from the changed cube through all downstream cubes to Cube 10
  - **Backward propagation (10→1):** Trace impact inward from Cube 10 back through all upstream cubes to Cube 1
  - **Every change must enhance metrics and outcomes** for a larger user base — never degrade
  - **Every change must increase modularity** to enhance user experience
  - Guiding principle: **"Where Shared Intention moves at the Speed of Thought"**
- **MVP phases:** MVP1 (working prototype) → MVP2 (usability/intelligence) → MVP3 (governance/monetization)

## Cube Architecture Overview
| Cube | Position | Name | MVP | Description |
|------|----------|------|-----|-------------|
| 1 | (1,2,2) CENTER | Session Join & QR | 1 | Session create (3 types, 2 polling modes, **Moderator config: scoping + pricing tier + fee + cost splitting + gamified reward + CQS weights + ranking mode + response limits**), ID gen, QR/link, **join flow: language gate → results opt-in + payment (Stripe/GPay/ApplePay) → session** (scoping set by Moderator, not user), **capacity tiers: Free ≤19 / Moderator Paid / Cost Split**, Desired Outcome setup (M2/M3), state management, **Moderator multi-device (PC + Phone) via WebSocket sync**, **session_config merged into sessions table**, **system/user/outcome metrics** |
| 2 | (1,2,3) | Text Submission Handler | 1 | Validate text inputs **in all 33 languages**, limits (Unicode-aware), language tag per response, **immediate ♡/◬ token display post-submit**, anonymization, PII detection, **Live 33-word response feed on hosting PC (toggleable, paid-tier only)** |
| 3 | (1,3,3) | Voice-to-Text Engine | 2 | Browser mic, STT **in all 33 languages**, language tag per transcript, **immediate ♡/◬ token display post-submit**, forwards to Cube 2 pipeline |
| 4 | (1,3,2) | Response Collector | 1 | Aggregate inputs **in all 33 languages** with language tags, write to storage, caching, presence, **payment status per participant**, **collect Desired Outcomes + result logs (M2/M3)** |
| 5 | (1,3,1) | User Input Gateway / Orchestrator | 1 | Central gateway, triggers AI + ranking + **CQS scoring pipeline**, **TIME TRACKING (all 3 ♡ methods)**, confirmation gates, post-task outcome flow, **payment orchestration**, **system/user/outcome metrics** |
| 6 | (1,2,1) | AI Theming Clusterer | 1 | Batch embeddings + streaming clustering + summarization + **CQS scoring engine**, **live 33-word summary generation (per-response, real-time)**, **Theme generation flow: Theme1 on lock → random sample of 10 → Theme2 progressive reveal (paid tiers)**, **Moderator-selected Theme2 voting level (9/6/3)** |
| 7 | (1,1,1) | Prioritization & Voting | 1 | Ranking UI + deterministic aggregation + governance compression + **#1 Theme2 cluster ID → CQS reward selection**, **Theme2 voting at Moderator-selected level (theme2_9/6/3)**, **progressive theme reveal on hosting PC (paid tiers)** |
| 8 | (1,1,2) | Token Reward Calculator | 3 | SoI Trinity Tokens (3 ♡ methods) + method-tagged ledger + outcome tracking + **gamified reward payout** + **payment processing** + **talent profiles + recommendation** + **ideation/execution separation** + governance/audit |
| 9 | (1,1,3) | Reports, Export & Dashboards | 1 | CSV/PDF, **Pixelated Tokens**, **results distribution (paying + Lead exempt)**, **CQS dashboard**, **talent recommendations (with execution separation)**, **reward announcement**, **data destruction**, **feedback system**, M2/M3 export |
| 10 | (2,2,2) CENTER | Simulation Orchestrator | 3 | **In-browser code editor**, replay past sessions, compare metrics, version/rollback, **self-improvement feedback pipeline (system-prompted + feedback icon)** |

## Target Output Schema
The AI pipeline must produce output matching this 15-column format (see `Updated_Web_Results_With_Themes_And_Summaries_v03 (1).csv`):

| Column | Description |
|--------|-------------|
| Q_Number | Question identifier |
| Question | The polling question text |
| User | User identifier (or anon hash) |
| Detailed_Results | Raw response text |
| 333_Summary | ~333-word summary (translated to English if needed) |
| 111_Summary | ~111-word summary |
| 33_Summary | ~33-word summary |
| Theme01 | Primary classification: Risk & Concerns / Supporting Comments / Neutral Comments |
| Theme01_Confidence | Confidence % (< 65% → reclassify as Neutral) |
| Theme2_9 | Sub-theme from 9-theme reduced set |
| Theme2_9_Confidence | Confidence % |
| Theme2_6 | Sub-theme from 6-theme reduced set |
| Theme2_6_Confidence | Confidence % |
| Theme2_3 | Sub-theme from 3-theme reduced set |
| Theme2_3_Confidence | Confidence % |

## Governance + Token Engine
See `Token_Governance_Math.md` for formal math. Key requirements:

### Token System (SoI Trinity — symbols are the primary identifiers)
- **♡:** 1 minute active participation = 1 ♡ (1 ♡ awarded on login) — **3 distribution methods at launch:**
  - **Method 1 — Polling Contribution:** Active participation in polling sessions (existing model)
  - **Method 2 — Peer-to-Peer Volunteer:** 2 people (helper + recipient) + 1 witness. All 3 must document Desired Outcome before timer starts. All 3 assess outcome at task end. No monetary payment — ♡ only. All earn ♡ for time present.
  - **Method 3 — Team Collaboration:** 3-person minimum with required roles: Technology Rep, Creative Rep, Business/Value Rep. All agree on meeting purpose, time estimate, and Desired Outcome upfront. All sign off on results after. All earn ♡ for time. Full export attached to Project ID.
- **Outcome tracking:** Methods 2 & 3 log outcome status (achieved/partial/not achieved). ♡ awarded for time regardless of outcome; outcome logged for accountability.
- **웃:** Jurisdiction min-wage rate per minute when enabled. Default $7.25/hr (Austin, TX). 59 jurisdictions loaded (9 international + 50 US states). `hi_enabled=False` pre-treasury.
- **◬:** 5x ♡ default multiplier

### 웃 Rate Table ($/hr — `backend/app/core/hi_rates.py`)
| Range | Jurisdictions |
|-------|---------------|
| $0.34–$1.04 | Nigeria, Nepal, Cambodia |
| $1.43–$3.02 | Mexico, Thailand, Brazil, Honduras, Colombia, Chile |
| $7.25 | TX, AL, GA, ID, IN, IA, KS, KY, LA, MS, NH, NC, ND, OK, PA, SC, TN, UT, WI, WY |
| $8.75–$12.30 | WV, MI, OH, MT, MN, AR, SD, AK, NE, NV, NM, VA, MO |
| $13.00–$16.28 | FL, VT, HI, RI, ME, CO, AZ, OR, DE, IL, MD, MA, NY, NJ, CT, CA, WA |

API: `GET /tokens/rates` (full table) | `GET /tokens/rates/lookup?country=US&state=California`

### Governance Requirements
- **Governance weight damping** — prevent any single actor from dominating outcomes
- **Quadratic vote normalization** — diminishing returns on repeated votes
- **Token velocity caps** — limit transfer/redemption speed to prevent gaming
- **Reputation multipliers** — earned trust increases governance weight
- **Drift detection** — `cosine(previous_centroid, new_centroid)` to detect theme drift
- **Cluster stability scoring** — measure consistency across re-runs

### Ledger Requirements
- **Append-only** — no mutations, only new entries
- **Lifecycle states:** simulated → pending → approved → finalized (+ reversed)
- **Treasury-backed 웃 redemption** — 웃 tokens only redeemable against treasury balance
- **Token dispute workflow** — flag → review → resolve with audit trail
- **Version-locked** — every ledger entry references cube version + dependency graph hash

## Time Tracking (Implemented — Cube 5)
- **What is tracked:** Active participation time per user per session across all 3 ♡ distribution methods
- **Action types:** `login`, `responding`, `ranking`, `reviewing`, `peer_volunteer`, `team_collaboration`
- **Method 1 (Polling):** Starts on join/respond/rank, stops on submit/complete
- **Method 2 (Peer Volunteer):** Starts after all 3 users confirm Desired Outcome, stops when task ends and outcome is assessed
- **Method 3 (Team Collab):** Starts after all team members confirm meeting/outcome/estimate, stops when meeting ends and results are logged
- **Confirmation gates:** Timer CANNOT start for Methods 2 & 3 until all participants confirm presence + Desired Outcome
- **Post-task flow:** All participants assess outcome → sign off → results logged → ♡ calculated → export generated
- **Granularity:** Per-action timestamps (start/stop for each response, each ranking, each volunteer/collab session)
- **Token mapping:**
  - **♡** = `floor(active_minutes)` — 1 ♡ awarded on login
  - **웃** = `duration_min * (jurisdiction_rate / 60)` — $0 when `hi_enabled=False`
  - **◬** = `♡ * 5` (default multiplier)
- **API serialization:** JSON fields are `♡`, `웃`, `◬` (not SI/HI/AI)
- **Immediate token display:** After every text/voice submission, ♡ and ◬ (= 5x ♡ minutes) shown to user instantly
- **Login auto-tracking:** On session join, Cube 1 calls `create_login_time_entry()` → awards ♡1 웃0 ◬5 + creates ledger entry

## Pixelated Tokens (Cube 9 — Image Export Format)
- **Self-contained value-carrying image** — token value lives in the image, not on the server
- **Structure (bordered frame around center QR):**
  - **Top pixel line:** Color-encoded data — Session Name, Session ID, Date, Time, ♡, ◬, 웃, User hash, Project ID, encoding version
  - **Bottom pixel line:** Mirror/reverse of top line (DNA-style integrity check — forward top must match reversed bottom)
  - **Left vertical pixels:** Encryption key (first half) — needed to decode top/bottom data
  - **Right vertical pixels:** Encryption key (second half) — combined with left for full decryption
  - **Center:** QR code for quick scan/verification
- **Pixel encoding:** Versioned color-to-character mapping; each pixel = one character; left+right verticals = decryption key
- **Delivery:** User chooses download, SMS, or email
- **Data destruction:** After image delivery, user token data is destroyed from the system. User owns their token proof via the image.
- **Token independence:** ♡ (SI), ◬ (AI), 웃 (HI) track value independently — no dependency on Quai, Qi, or any crypto integration. Blockchain/crypto integrations can be introduced later as optional layers; the token system is fully functional standalone.

## Monetization Model (MVP1)
- **Moderator must pay** per-session fee to use the tool (Stripe)
- **Cost splitting:** Moderator can split fee equally among participants (e.g., $100 fee / 200 users = $0.50 each). Fee per user calculated dynamically as users join. Paying members automatically receive Polling Results.
- **Results opt-in:** Step 2 of join flow — user must click to opt in. If cost splitting enabled, per-user fee shown and Stripe payment processed inline.
- **Gamified contribution reward:** Moderator sets a bonus amount (e.g., $25) awarded to one participant. Appears random to users but determined by hidden **Contribution Quality Score (CQS):**
  - CQS scored ONLY on responses in #1 most-voted Theme2 cluster with >95% theme confidence (saves API calls)
  - 6 metrics: Insight (20%), Depth (15%), Future Impact (25%), Originality (15%), Actionability (15%), Relevance (10%)
  - Winner: highest CQS among eligible responses. Ties randomized (fair, unpredictable)
  - CQS hidden from users, visible to Moderators and system
- **Lead/Developer exception:** Leads ALWAYS get free access to results (transparency + accountability)
- **Payment providers at launch:** Stripe, Google Pay, Apple Pay

## Observability Plan
- **Metrics:** Prometheus — request latency, queue depth, embedding throughput, cluster stability, token velocity
- **Logs:** Structured JSON logging — every request, every AI call, every state transition
- **Alerts:** Queue depth > threshold, API error rate spike, drift detection trigger, governance anomaly
- **Dashboards:** Grafana — ingestion rate, embedding batch latency, clustering time, cost-per-1M
- **Drift Monitoring:** Cosine similarity between previous and new cluster centroids, alert on significant drift

## Cost Modeling
Track and optimize for:
- **AI provider embedding cost** per 1K / 1M responses (OpenAI, Grok, Gemini — compare per provider)
- **Infrastructure cost** at 100K stable / 1M burst
- **Cost-per-session** breakdown (compute + AI + storage)
- **Throughput equations:** ingestion rate × embedding batch latency × clustering complexity

## Local Environment
- Backend: Python venv in `backend/` directory
- Frontend: Node.js in `frontend/` directory
- Databases: Docker Compose (PostgreSQL, MongoDB, Redis)

## Implementation Status

> **Cube-specific implementation details are in dedicated docs:**
> - `docs/CUBES_1-3.md` — Session, Text, Voice (Cubes 1-3)
> - `docs/CUBES_4-6.md` — Collector, Gateway, AI Pipeline (Cubes 4-6)
> - `docs/CUBES_7-9.md` — Ranking, Tokens, Reports (Cubes 7-9)
> - `docs/CUBE_10.md` — Simulation Orchestrator, Easter Egg SIM, 100-User Spiral Test
> - `docs/SPIRAL_METRICS.md` — All N=5/N=9/N=18 metric baselines

### Implementation Summary
| Cube | Status | Tests | CRS |
|------|--------|-------|-----|
| 1 Session | ~75% | 59 | CRS-01→06 |
| 2 Text | ~85% | 62 | CRS-05→08 |
| 3 Voice | ~85% | 39 | CRS-08, 15 |
| 4 Collector | ~80% | 27 | CRS-09→10 |
| 5 Gateway | ~90% | 60 | CRS-09→11 |
| 6 AI Pipeline | ~85% | 20 | CRS-11→14 |
| 7 Ranking | Stub | — | — |
| 8 Tokens | Implemented | 19 | — |
| 9 Reports | Stub | — | — |
| 10 Simulation | Easter Egg SIM | — | — |
| **Total** | | **287** | |

### Frontend — Language Lexicon: IMPLEMENTED (362/362 keys × 32 languages = 11,584 translations)
- **Per-cube translation management** — 350 UI string keys organized by cube (0–10), modular for parallel dev
- **Full translation coverage:** 362/362 keys translated across all 32 non-English languages (11,584 total translations)
- **Key groups:** 42 shared + 157 cube1 + 13 cube2 + 23 cube3 + 15 cube4 + 12 cube5 + 14 cube6 + 17 cube7 + 17 cube8 + 19 cube9 + 21 cube10
- **Language Lexicon UI** in Moderator Settings panel: language list with completeness %, translation editor with cube filter tabs, propose new language form, admin-only pending approvals
- **React Context + Provider** (`LexiconProvider`) with localStorage persistence, follows `theme-context.tsx` pattern
- **Admin approval gate:** Only `explore@eXeL-AI.com` can approve/reject proposed languages
- **33 initial languages** from `SUPPORTED_LANGUAGES` with RTL support (Arabic, Hebrew)
- **Data structure maps 1:1** to backend `languages` + `ui_translations` tables for future API swap
- **t() fallback chain:** translation → English default → raw key (verified across all 32 languages)
- Files: `frontend/lib/lexicon-data.ts`, `frontend/lib/lexicon-context.tsx`, `frontend/lib/lexicon-translations.ts`, `frontend/components/language-lexicon.tsx`

### Frontend — Settings Panel: IMPLEMENTED
- Slide-over panel with session-cascading theme customizer, interface language selector, Language Lexicon
- **Accessible to ALL users** — Settings gear icon in navbar for everyone:
  - **Polling users (non-authenticated):** See language selector + theme grid (view-only, dimmed at 40% opacity). Theme swatches are clickable for Easter egg sequence but cannot change the color scheme.
  - **Moderators (Auth0 authenticated):** Full theme control + Cube Architecture Status + Language Lexicon admin
- **Session Color Scheme (3x3 grid):** 8 presets + 1 custom accent picker = 9 options
  - Branded presets: **◬ Cyan** (A.I. symbol), **웃 Violet** (H.I. symbol), **♡ Sunset** (S.I. symbol)
  - Additional presets: Ocean Blue, Emerald, Red, Indigo, Coral
  - Custom: Color picker for any accent color (dark background stays fixed)
- **Session-level cascade:** Moderator's theme choice applies to ALL participants in the session
  - `setSessionTheme()` overrides local user preference when inside a session
  - Backend stores `theme_id` + `custom_accent_color` on Session model
  - Participants receive theme on join via `SessionJoinResponse.theme_id`
  - Full WebSocket push for live updates planned (post-Cube 1 WebSocket sync)
- **Custom theme generation:** `generateCustomTheme(hex)` converts any hex accent to full HSL theme with consistent dark base
- Files: `frontend/components/moderator-settings.tsx`, `frontend/lib/theme-context.tsx`, `frontend/components/providers.tsx`, `frontend/components/navbar.tsx`

### Frontend — Theme Auth Guard: IMPLEMENTED
- **Default theme:** AI Cyan (`exel-cyan`) for ALL pre-auth screens — landing, join flow, session view
- **Auth-gated theme changes:** Only Auth0-authenticated moderators can change the color scheme
  - `moderatorAuthenticated` flag in ThemeProvider gates `setTheme()` and `setCustomAccent()`
  - `ThemeAuthSync` bridge component syncs Auth0 `isAuthenticated` → ThemeProvider
- **Logout reset:** When moderator logs out, theme resets to AI Cyan, session theme cleared from localStorage
- **Polling users:** See the moderator's session theme (via `sessionThemeId`) but cannot change it
- Files: `frontend/lib/theme-context.tsx`, `frontend/components/providers.tsx`

### Frontend — Global Language Selector: IMPLEMENTED
- **Navbar dropdown:** Globe icon with language dropdown available to ALL users (not just moderators)
- **33 approved languages** from Language Lexicon with English + Spanish pinned at top
- **Instant locale switching:** `activeLocale` state in LexiconContext with `t(key)` convenience function
- **Persisted to localStorage:** Key `exel-active-locale`, hydrated on mount
- **All UI strings use `t()`:** Landing page, join flow, navbar, settings — all wired to translations
- **Full language switching:** Selecting any of 32 languages changes ALL 328 UI strings (verified 2026-02-23)
- Files: `frontend/components/navbar.tsx`, `frontend/lib/lexicon-context.tsx`, `frontend/lib/lexicon-data.ts`, `frontend/lib/lexicon-translations.ts`

## Test Report Template (for Cube 3+ to follow)

Each cube implementation MUST produce the following deliverables matching Cube 1 and Cube 2 methodology:

### 1. Test Procedure Section (in docs/CUBES_*.md)
```
#### Cube N — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
cd backend && source .venv/bin/activate && python -m pytest tests/cubeN/ -v --tb=short

**Test Suite:** M files, K test classes, T tests
| File | Classes | Tests | Coverage |
| test_<name>_service.py | N | M | Unit tests (...) |
| test_e2e_flows.py | N | M | E2E flows (...) |

**<Flow Name> Test Flow (TestClassName):**
1. step_name — description
2. step_name — description
...
```

### 2. Metrics Baseline (N=5 minimum)
```
**Metrics Baseline (N=5, YYYY-MM-DD):**
| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Average | Std Dev |
| Tests Passed | X/X | X/X | X/X | X/X | X/X | **X/X** | **0** |
| Backend Test Duration | Xms | Xms | Xms | Xms | Xms | **Xms** | **Xms** |
| Frontend Build Duration | Xms | Xms | Xms | Xms | Xms | **Xms** | **Xms** |
| TypeScript Errors | 0 | 0 | 0 | 0 | 0 | **0** | **0** |
| TSC Check Duration | Xms | Xms | Xms | Xms | Xms | **Xms** | **Xms** |
| Dashboard Bundle | X kB | ... | ... | ... | ... | **X kB** | **0** |
| Session Bundle | X kB | ... | ... | ... | ... | **X kB** | **0** |
| Join Bundle | X kB | ... | ... | ... | ... | **X kB** | **0** |
```

### 3. Spiral Propagation Verification
```
**Spiral Propagation Verification:**
- Forward (N→10): [list downstream impacts] — PASS/FAIL
- Backward (10→N): [list upstream impacts] — PASS/FAIL
  - [list any issues found and fixed]
```

### 4. CUBE_N_TEST_METHOD dict (in test_e2e_flows.py)
```python
CUBEN_TEST_METHOD = {
    "cube": "cubeN_name",
    "version": "1.0.0",
    "test_command": "python -m pytest tests/cubeN/ -v --tb=short",
    "test_files": [...],
    "baseline_metrics": { "unit_tests_passed": X, "e2e_tests_passed": X, ... },
    "flows": { ... },
    "spiral_propagation": { "forward": { ... }, "backward": { ... } },
}
```

### 5. CRS Traceability Table
```
| CRS | Input ID | Output ID | Status | DTM Stretch Target |
| CRS-XX | CRS-XX.IN.xxx | CRS-XX.OUT.xxx | **Complete** | stretch description |
```

### 6. Unity Verification
- All tests pass (0 failures)
- `tsc --noEmit` returns 0 errors
- All changes committed and pushed to GitHub
- Local === Remote confirmed

## Detailed Cube Specs (in Requirements.txt)
Full detailed specs for all 10 cubes are in `Requirements.txt` Section 3, including:
- **Data Tables** with all variables, types, and descriptions
- **Inputs/Outputs** with source/destination mapping between cubes
- **Functions** per cube (isolated + shared core)
- **UI/UX Translation Strings** — all user-facing text keyed for 33-language translation
- **Metrics** (System / User / Outcome) for Cubes 1, 5, and 10
- **Traceability** to Project ID / Specification ID / Differentiator ID per cube

### Key Data Table Counts
| Cube | Tables | Functions | UI Strings |
|------|--------|-----------|------------|
| 1 Session | 4 (sessions, participants, languages, ui_translations) | 11 | 30+ |
| 2 Text | 3 (text_responses, questions, profanity_filters) | 8 | 13 |
| 3 Voice | 2 (voice_responses, stt_providers) | 7 | 14 |
| 4 Collector | 3 (collected_responses, desired_outcomes, presence_tracking) | 10 | 15 |
| 5 Gateway | 3 (time_entries, pipeline_triggers, confirmation_gates) | 12 | 12 |
| 6 AI Theming | 6 (embeddings, clusters, themes, response_theme_assignments, summaries, cqs_scores) | 12 | 11 |
| 7 Ranking | 3 (user_rankings, aggregated_rankings, governance_overrides) | 8 | 14 |
| 8 Tokens | 6 (token_ledger, payment_transactions, reward_payouts, token_disputes, talent_profiles, execution_separation_log) | 14 | 17 |
| 9 Reports | 4 (exports, pixelated_tokens, results_distribution, talent_recommendations) | 14 | 26 |
| 10 Simulation | 5 (simulation_runs, simulation_results, replay_datasets, cube_versions, user_feedback) | 12 | 25 |

### Shared Core Library
All cubes import from `core/`: auth, db, translations, hi_rates, payment, logging, exceptions, config, metrics, circuit_breaker, scoping.

### Key Architectural Decisions
- **Translation:** Admin UI panel shared with Team/Leads. AI-verified + 1 Team/Lead/Admin approval for new languages.
- **Traceability:** **Moderator sets** ONE of 3 scoping contexts at session creation (Project / Specification / Product Differentiator). All downstream data inherits via session_id.
- **Talent recommendation:** Cube 8 builds talent profiles from CQS + participation. Cube 9 recommends talent for projects.
- **Ideation/execution separation:** Ideation team members blocked from execution roles per scoping_id (anti-corruption).
- **Simulation pass criteria:** Must EXCEED existing System, User, and Business/Outcome metrics from production sessions.
- **Self-improvement:** System-prompted feedback + persistent feedback icon → prioritized backlog tagged by cube/scoping context.

## .gitignore
See `.gitignore` file in project root. Key exclusions: node_modules, __pycache__, .env, venv, .next, .claude
