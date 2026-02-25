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

### Cube 1 — Session Join & QR: IMPLEMENTED (CRS-01→CRS-06 done; ~70% of full spec)

**Code location:** `backend/app/cubes/cube1_session/` (modular, self-contained)

#### Cube 1 — Implemented
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

#### Cube 1 — Newly Implemented (Phase 1-7 completion, 2026-02-18)
- **Session model extended:** 11 new columns — `session_type`, `polling_mode`, `pricing_tier`, `max_participants`, `fee_amount_cents`, `cost_splitting_enabled`, `reward_enabled`, `reward_amount_cents`, `cqs_weights` (JSONB), `theme2_voting_level`, `live_feed_enabled`
- **Participant model extended:** 3 new columns — `language_code`, `results_opt_in`, `payment_status`
- **Capacity enforcement:** `check_capacity()` — rejects join with 409 when session is full
- **CQS weight config:** Moderator sets 6-metric CQS weights at session creation (stored as JSONB)
- **Frontend — Moderator Dashboard:** Session creation with full config, QR code display (inline + presentation mode), state transition controls, participant counter
- **Frontend — Token HUD:** Pill badges in navbar (◬ Cyan, ♡ Sunset, 웃 Violet) with gaming animations (tick-up, float-up +1, pulse)
- **Frontend — Timer Context:** React context for session timer + token accrual (1 ♡/min, 5x ◬ multiplier)
- **Frontend — Voice Input Stub:** Browser MediaRecorder API, pulsing red dot indicator, audio blob capture (STT pending Cube 3)
- **Frontend — Cube Architecture Status Panel:** 3x3 grid in Settings with RAG+ color coding per cube
- **Frontend — One-Question-at-a-Time UX:** Full-width textarea, Submit & Next, progress bar, token earn overlay

#### Cube 1 — Partially Implemented (fields exist but incomplete logic)
- **Payment flow:** `is_paid` + `stripe_session_id` exist but no Stripe integration in join
- **Cost splitting:** `cost_splitting_enabled` + `fee_amount_cents` stored but no dynamic calculation
- **Language enforcement:** `language_code` stored on participant but no UI gate in join sequence

#### Cube 1 — Not Yet Implemented (specified in Requirements.txt)
- **Scoping context:** Project/Specification/Differentiator tables + FK linkage
- **Join flow gates:** Payment processing (Stripe/GPay/ApplePay), language enforcement gate
- **Master language table:** `languages` + `ui_translations` backend tables (frontend Language Lexicon implemented)
- **Desired Outcome setup:** Methods 2 & 3 — outcome input, role assignment, confirmation gates
- **Moderator multi-device sync:** WebSocket push to all connected moderator devices, device-aware layouts
- **Live response feed:** 33-word summary feed on hosting PC (Cube 2 integration, paid tiers only)
- **Metrics collection:** System/User/Outcome metrics (none wired)

#### Cube 1 — Service Functions Status
| Function | Status | Notes |
|----------|--------|-------|
| `create_session()` | **Implemented** | All 11 Cube 1 fields + CQS weights |
| `generate_qr_code()` | **Implemented** | PNG + base64 |
| `validate_join_request()` | **Implemented** | Expiry + state + capacity check |
| `check_capacity()` | **Implemented** | Enforces max_participants, 409 on full |
| `join_session()` | **Implemented** | language_code, results_opt_in, Redis presence, login token |
| `transition_session_state()` | **Implemented** | Full state machine (6 states) |
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

#### Cube 1 — Test Procedure (Cube 10 Simulator Reference)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube1/ -v --tb=short
```

**Test Suite:** 2 files, 14 test classes, 52+ tests

| File | Classes | Tests | Coverage |
|------|---------|-------|----------|
| `test_session_service.py` | 10 | 32 | Service unit tests |
| `test_e2e_flows.py` | 4 | 20+ | Moderator + User E2E flows |

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

**Metrics Baseline (N=5, 2026-02-18):**
| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Average | Std Dev |
|--------|-------|-------|-------|-------|-------|---------|---------|
| Tests Passed | 55/55 | 55/55 | 55/55 | 55/55 | 55/55 | **55/55** | **0** |
| Backend Test Duration | 3,021ms | 3,140ms | 2,435ms | 3,206ms | 3,117ms | **2,984ms** | **293ms** |
| Frontend Build Duration | 25,187ms | 24,353ms | 24,469ms | 25,572ms | 25,153ms | **24,947ms** | **469ms** |
| TypeScript Errors | 0 | 0 | 0 | 0 | 0 | **0** | **0** |
| TSC Check Duration | 2,318ms | 2,562ms | 2,520ms | 2,743ms | 2,666ms | **2,562ms** | **151ms** |
| Dashboard Bundle | 15.3 kB | 15.3 kB | 15.3 kB | 15.3 kB | 15.3 kB | **15.3 kB** | **0** |
| Session Bundle | 4.24 kB | 4.24 kB | 4.24 kB | 4.24 kB | 4.24 kB | **4.24 kB** | **0** |
| Join Bundle | 3.01 kB | 3.01 kB | 3.01 kB | 3.01 kB | 3.01 kB | **3.01 kB** | **0** |

**Spiral Propagation Verification:**
- Forward (1→10): All downstream cubes compatible — PASS
- Backward (10→1): 3 issues found and fixed — PASS
  - cqs_weights missing from schema/service/router
  - Test fixtures missing new Cube 1 fields
  - Frontend Participant type mismatch (language→language_code)

#### Cube 1 — Files
| File | Lines | Purpose |
|------|-------|---------|
| `cubes/cube1_session/service.py` | 520 | Core business logic (11 new params) |
| `cubes/cube1_session/router.py` | 401 | 23 API endpoints (+ /start) |
| `models/session.py` | 125 | Session ORM model (11 new columns) |
| `models/participant.py` | 40 | Participant ORM model (3 new columns) |
| `models/question.py` | 33 | Question ORM model |
| `schemas/session.py` | 120 | Pydantic schemas (extended) |
| `schemas/participant.py` | 28 | Participant schema (extended) |
| `schemas/question.py` | 22 | Question schema |
| `tests/cube1/test_session_service.py` | 540 | 32 unit tests |
| `tests/cube1/test_e2e_flows.py` | 400+ | E2E Moderator + User flows |
| `core/auth.py` | — | Auth middleware |
| `core/exceptions.py` | — | Custom exceptions |

### Cube 5 — Time Tracking: IMPLEMENTED
- `TimeTrackingService`: start/stop tracking, login auto-entry, ♡ 웃 ◬ calculation
- Token calculation: `calculate_tokens()` with jurisdiction rate lookup
- Login auto-tracking on session join (Cube 1 integration)
- Append-only token ledger entries created on stop + login
- Files: `cubes/cube5_gateway/service.py`, `cubes/cube5_gateway/router.py`, `models/time_tracking.py`, `schemas/time_tracking.py`

### Cube 8 — Token Ledger: IMPLEMENTED
- `TokenService`: session tokens query, user balance, disputes
- 웃 rate table: 59 jurisdictions (9 international + 50 US states)
- Rate lookup API: `GET /tokens/rates`, `GET /tokens/rates/lookup`
- Files: `cubes/cube8_tokens/service.py`, `cubes/cube8_tokens/router.py`, `core/hi_rates.py`, `schemas/token.py`, `models/token_ledger.py`

### Frontend — Language Lexicon: IMPLEMENTED (333/333 keys × 32 languages = 10,656 translations)
- **Per-cube translation management** — 328 UI string keys organized by cube (0–10), modular for parallel dev
- **Full translation coverage:** 328/328 keys translated across all 32 non-English languages (4,480 new strings added 2026-02-23)
- **Key groups:** 44 shared + 160 cube1 + 14 cube2 + 20 cube3 + 16 cube4 + 12 cube5 + 15 cube6 + 17 cube7 + 18 cube8 + 20 cube9 + 21 cube10
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

### Frontend — Powered Badge (eXeL + Seed of Life): IMPLEMENTED
- **Bottom-right badge:** Shows "eXeL" text + Seed of Life SVG logo
- **Theme-reactive:** Badge color follows the active theme's swatch color (not hardcoded)
  - Pre-auth: AI Cyan (default theme)
  - In session: Follows moderator's chosen theme
- **Easter egg gateway:** When unlocked (Cyan → Sunset → Violet click sequence in Settings), badge blinks and becomes clickable to enter Simulation Mode
- **Simulation overlay:** 3 Seed of Life logos with fixed trinity colors (A.I.=Cyan, S.I.=Sunset, H.I.=Violet), each paired with an audio track
- Files: `frontend/components/powered-badge.tsx`, `frontend/components/seed-of-life-logo.tsx`

### Frontend — Global Language Selector: IMPLEMENTED
- **Navbar dropdown:** Globe icon with language dropdown available to ALL users (not just moderators)
- **33 approved languages** from Language Lexicon with English + Spanish pinned at top
- **Instant locale switching:** `activeLocale` state in LexiconContext with `t(key)` convenience function
- **Persisted to localStorage:** Key `exel-active-locale`, hydrated on mount
- **All UI strings use `t()`:** Landing page, join flow, navbar, settings — all wired to translations
- **Full language switching:** Selecting any of 32 languages changes ALL 328 UI strings (verified 2026-02-23)
- Files: `frontend/components/navbar.tsx`, `frontend/lib/lexicon-context.tsx`, `frontend/lib/lexicon-data.ts`, `frontend/lib/lexicon-translations.ts`

### Cube 2 — Text Submission Handler: IMPLEMENTED (CRS-05→CRS-08 done; ~85% of full spec)

**Code location:** `backend/app/cubes/cube2_text/` (modular, self-contained)

#### Cube 2 — Implemented
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

#### Cube 2 — CRS Traceability
| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-05 | CRS-05.IN.SRS.005 | CRS-05.OUT.SRS.005 | **Complete** | Post-session reveal opt-in |
| CRS-06 | CRS-06.IN.SRS.006 | CRS-06.OUT.SRS.006 | **Complete** | Scheduled auto-open/close |
| CRS-07 | CRS-07.IN.WRS.007 | CRS-07.OUT.WRS.007 | **Complete** | Rich text + autosave drafts |
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Complete** (hash) | AES-256 encryption at rest |

#### Cube 2 — Not Yet Implemented
- **`push_to_live_feed()`** — WebSocket 33-word summary feed (requires Cube 6)
- **Profanity seed data** for 33 languages (table ready, needs curated regex)
- **AES-256 encryption at rest** — CRS-08 stretch target (response_hash covers integrity)
- **`detect_language()` ML upgrade** — current Unicode heuristic is lightweight

#### Cube 2 — Test Procedure (Cube 10 Simulator Reference)

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

**Metrics Baseline (N=5, 2026-02-18):**
| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Average | Std Dev |
|--------|-------|-------|-------|-------|-------|---------|---------|
| Tests Passed | 62/62 | 62/62 | 62/62 | 62/62 | 62/62 | **62/62** | **0** |
| Backend Test Duration | 2,783ms | 2,995ms | 2,874ms | 2,919ms | 2,946ms | **2,903ms** | **72ms** |
| Frontend Build Duration | 25,187ms | 24,353ms | 24,469ms | 25,572ms | 25,153ms | **24,947ms** | **469ms** |
| TypeScript Errors | 0 | 0 | 0 | 0 | 0 | **0** | **0** |
| TSC Check Duration | 2,318ms | 2,562ms | 2,520ms | 2,743ms | 2,666ms | **2,562ms** | **151ms** |
| Dashboard Bundle | 15.3 kB | 15.3 kB | 15.3 kB | 15.3 kB | 15.3 kB | **15.3 kB** | **0** |
| Session Bundle | 4.24 kB | 4.24 kB | 4.24 kB | 4.24 kB | 4.24 kB | **4.24 kB** | **0** |
| Join Bundle | 3.01 kB | 3.01 kB | 3.01 kB | 3.01 kB | 3.01 kB | **3.01 kB** | **0** |

**Spiral Propagation Verification:**
- Forward (2→10): All downstream cubes compatible — PASS
  - Cube 3 (Voice): Uses same PII/profanity pipeline via Cube 2 imports
  - Cube 4 (Collector): Aggregates responses stored by Cube 2
  - Cube 6 (AI): Consumes Redis `response_submitted` events
  - Cube 8 (Tokens): Ledger entries created via Cube 5 time tracking
  - Cube 9 (Reports): Exports clean_text + response_hash
- Backward (10→1): 2 issues found and fixed — PASS
  - Frontend `api.ts` field name mismatch (`response_text` → `raw_text`)
  - Frontend `session-view.tsx` missing `participant_id` in API call

#### Cube 2 — Files
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

### Landing Page — Metrics Baseline (N=5, 2026-02-18)

**Landing Page Content Verification:**
- Feature order: AI Theming → Scale to Millions → Governance Built In — CONFIRMED
- CTA label: "Are you a Session Facilitator?" → "Session Facilitator Access" button — CONFIRMED
- Max response length: 3333 chars (supports Cube 6 pipeline: 333→111→33 words at ~4-5 chars/word)

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/cube1/ tests/cube2/ tests/cube3/ -v --tb=short
cd frontend && npx tsc --noEmit
cd frontend && npx next build
```

**Metrics Baseline (N=5, 2026-02-18):**
| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Average | Std Dev |
|--------|-------|-------|-------|-------|-------|---------|---------|
| Tests Passed | 135/135 | 135/135 | 135/135 | 135/135 | 135/135 | **135/135** | **0** |
| Backend Test Duration | 1,090ms | 1,070ms | 1,120ms | 1,090ms | 1,170ms | **1,108ms** | **39ms** |
| Frontend Build Duration | 33,058ms | 31,780ms | 32,219ms | 33,972ms | 32,767ms | **32,759ms** | **838ms** |
| TypeScript Errors | 0 | 0 | 0 | 0 | 0 | **0** | **0** |
| TSC Check Duration | 3,555ms | 3,559ms | 2,970ms | 3,419ms | 3,480ms | **3,397ms** | **245ms** |
| Landing Page Bundle | 2.03 kB | 2.03 kB | 2.03 kB | 2.03 kB | 2.03 kB | **2.03 kB** | **0** |
| Dashboard Bundle | 15.3 kB | 15.3 kB | 15.3 kB | 15.3 kB | 15.3 kB | **15.3 kB** | **0** |
| Session Bundle | 4.24 kB | 4.24 kB | 4.24 kB | 4.24 kB | 4.24 kB | **4.24 kB** | **0** |
| Join Bundle | 3.01 kB | 3.01 kB | 3.01 kB | 3.01 kB | 3.01 kB | **3.01 kB** | **0** |

**Spiral Propagation Verification:**
- Forward (1→9): Landing page labels consistent with dashboard — PASS
- Backward (9→1): 3333 char limit propagated through schemas, models, services, tests (Cubes 1-3) — PASS
- All 135 tests pass (Cube 1: 55, Cube 2: 62, Cube 3: 18)

### Language Lexicon Completion — 9x Spiral Metrics (N=9, 2026-02-23)

**Change:** Added 140 missing translation keys × 32 languages = 4,480 new strings. All 32 languages now have 328/328 keys (was 188/328).

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/ -v --tb=short
cd frontend && npx tsc --noEmit
cd frontend && npx next build
```

**Metrics Baseline (N=9, 2026-02-23):**
| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Run 6 | Run 7 | Run 8 | Run 9 | Average | Std Dev |
|--------|-------|-------|-------|-------|-------|-------|-------|-------|-------|---------|---------|
| Tests Passed | 173/173 | 173/173 | 173/173 | 173/173 | 173/173 | 173/173 | 173/173 | 173/173 | 173/173 | **173/173** | **0** |
| Backend Test Duration | 3,294ms | 3,370ms | 3,361ms | 3,404ms | 3,531ms | 3,487ms | 3,737ms | 3,702ms | 3,675ms | **3,507ms** | **164ms** |
| TypeScript Errors | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** | **0** |
| TSC Check Duration | 2,294ms | 2,480ms | 2,387ms | 2,409ms | 2,422ms | 2,443ms | 2,531ms | 2,586ms | 2,687ms | **2,471ms** | **117ms** |
| Frontend Build Duration | 22,248ms | 23,385ms | 23,377ms | 23,557ms | 23,708ms | 24,092ms | 24,163ms | 24,090ms | 25,241ms | **23,762ms** | **806ms** |
| Landing Page Bundle | 1.91 kB | 1.91 kB | 1.91 kB | 1.91 kB | 1.91 kB | 1.91 kB | 1.91 kB | 1.91 kB | 1.91 kB | **1.91 kB** | **0** |
| Dashboard Bundle | 25.9 kB | 25.9 kB | 25.9 kB | 25.9 kB | 25.9 kB | 25.9 kB | 25.9 kB | 25.9 kB | 25.9 kB | **25.9 kB** | **0** |
| Session Bundle | 5.16 kB | 5.16 kB | 5.16 kB | 5.16 kB | 5.16 kB | 5.16 kB | 5.16 kB | 5.16 kB | 5.16 kB | **5.16 kB** | **0** |
| Join Bundle | 3.09 kB | 3.09 kB | 3.09 kB | 3.09 kB | 3.09 kB | 3.09 kB | 3.09 kB | 3.09 kB | 3.09 kB | **3.09 kB** | **0** |

**Spiral Propagation Verification:**
- Forward (Translation Change → Cubes 1→10):
  - Cube 1 (Session): t() translations in join-flow, session-view, dashboard — PASS
  - Cube 2 (Text): t() translations in text-input, feed — PASS
  - Cube 3 (Voice): t() translations in voice-input (7 new keys) — PASS
  - Cubes 4–10: No translation changes needed, existing keys already covered — PASS
  - **FORWARD: ALL CUBES PASS**
- Backward (Cubes 10→1 → Translation integrity):
  - lexicon-data.ts: 328 keys defined across 11 cube groups
  - lexicon-translations.ts: 32 languages × 328 keys = 10,496 translations
  - t() fallback chain: translation → English default → raw key — VERIFIED
  - 0 issues found — **BACKWARD: PASS**
- **RESULT: 9/9 SPIRAL TESTS PASS — 0 FAILURES, 0 REGRESSIONS**

### Cube 3 — Voice-to-Text Engine: IMPLEMENTED (CRS-08, CRS-15 done; ~85% of full spec)

**Code location:** `backend/app/cubes/cube3_voice/` (modular, self-contained)

#### Cube 3 — Implemented
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

#### Cube 3 — STT Providers at Launch
| Provider | Model ID | Type | Languages | Notes |
|----------|----------|------|-----------|-------|
| OpenAI Whisper | whisper-1 | Batch | 33 | Primary default |
| Grok (xAI) | whisper-large-v3 | Batch | 33 | OpenAI-compatible API |
| Gemini (Google) | gemini-2.0-flash | Batch | 33 | Multimodal audio input |
| AWS Transcribe | aws-transcribe | Batch | 23 | S3 upload → batch job |
| Azure Speech | azure-stt | Real-time | 30+ | Paid feature, WebSocket |
| AWS Transcribe Streaming | aws-streaming | Real-time | 23 | Fallback for Azure |

#### Cube 3 — CRS Traceability
| CRS | Input ID | Output ID | Status | DTM Stretch Target |
|-----|----------|-----------|--------|-------------------|
| CRS-08 | CRS-08.IN.SRS.008 | CRS-08.OUT.SRS.008 | **Complete** (hash) | AES-256 encryption at rest |
| CRS-15 | CRS-15.IN.WRS.015 | CRS-15.OUT.WRS.015 | **Complete** | Live word-by-word display |

#### Cube 3 — Not Yet Implemented
- **`push_to_live_feed()`** — WebSocket 33-word summary feed (requires Cube 6)
- **Language-specific STT model tuning** — per-language model selection optimization
- **Audio playback** — MongoDB audio_files retrieval for replay
- **Voice-specific profanity seed data** — speech patterns differ from text

#### Cube 3 — Test Procedure (Cube 10 Simulator Reference)

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

#### Cube 3 — Service Functions Status
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

#### Cube 3 — Files
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

#### Cube 3 — Frontend Files
| File | Action | Purpose |
|------|--------|---------|
| `components/voice-input.tsx` | **Rewritten** | Records audio → sends to backend → shows transcript + tokens |
| `lib/types.ts` | **Updated** | Added VoiceSubmissionRead interface |
| `lib/api.ts` | **Updated** | Added submitVoiceResponse (FormData upload, mock + live) |
| `components/session-view.tsx` | **Updated** | Passes sessionId, questionId, participantId, languageCode to VoiceInput |

### Cube 3 Implementation + V2T Settings — 9x Spiral Metrics (N=9, 2026-02-23)

**Change:** Implemented Cube 3 Voice-to-Text Engine: AWS Transcribe batch provider, CRS-08 response_hash fix, frontend voice-input.tsx wired to backend, 21 new E2E tests. Added V2T Provider Selector to Moderator Settings panel (4 providers: Whisper, Grok, Gemini, AWS with circuit breaker failover note). Added 5 new lexicon keys × 32 languages = 160 translations.

**Test Command:**
```bash
cd backend && source .venv/bin/activate && python -m pytest tests/ -v --tb=short
cd frontend && npx tsc --noEmit
cd frontend && npx next build
```

**Metrics Baseline (N=9, 2026-02-23):**
| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Run 6 | Run 7 | Run 8 | Run 9 | Average | Std Dev |
|--------|-------|-------|-------|-------|-------|-------|-------|-------|-------|---------|---------|
| Tests Passed | 194/194 | 194/194 | 194/194 | 194/194 | 194/194 | 194/194 | 194/194 | 194/194 | 194/194 | **194/194** | **0** |
| Cube 3 Tests | 39/39 | 39/39 | 39/39 | 39/39 | 39/39 | 39/39 | 39/39 | 39/39 | 39/39 | **39/39** | **0** |
| Cube 3 Duration | 4,616ms | 4,608ms | 4,583ms | 4,690ms | 4,803ms | 4,614ms | 4,639ms | 4,792ms | 4,564ms | **4,656ms** | **82ms** |
| Full Backend Duration | 5,559ms | 5,560ms | 5,651ms | 5,627ms | 5,705ms | 5,470ms | 5,635ms | 6,026ms | 5,711ms | **5,660ms** | **147ms** |
| TypeScript Errors | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** | **0** |
| TSC Check Duration | 4,186ms | 4,089ms | 4,086ms | 4,084ms | 4,233ms | 3,878ms | 4,152ms | 4,081ms | 4,040ms | **4,092ms** | **94ms** |
| Landing Page Bundle | 1.8 kB | 1.8 kB | 1.8 kB | 1.8 kB | 1.8 kB | 1.8 kB | 1.8 kB | 1.8 kB | 1.8 kB | **1.8 kB** | **0** |
| Dashboard Bundle | 26.6 kB | 26.6 kB | 26.6 kB | 26.6 kB | 26.6 kB | 26.6 kB | 26.6 kB | 26.6 kB | 26.6 kB | **26.6 kB** | **0** |
| Session Bundle | 6.02 kB | 6.02 kB | 6.02 kB | 6.02 kB | 6.02 kB | 6.02 kB | 6.02 kB | 6.02 kB | 6.02 kB | **6.02 kB** | **0** |
| Join Bundle | 3.78 kB | 3.78 kB | 3.78 kB | 3.78 kB | 3.78 kB | 3.78 kB | 3.78 kB | 3.78 kB | 3.78 kB | **3.78 kB** | **0** |

**Spiral Propagation Verification (Cube 3 → Cube 1-3 → 3-1):**
- Forward (1→2→3→10): All downstream cubes compatible — PASS
  - Cube 1 (Session): Session config stores ai_provider → maps to STT provider via factory
  - Cube 2 (Text): PII/profanity pipeline reused by Cube 3 voice transcripts
  - Cube 3 (Voice): V2T provider selector in Moderator Settings wired to 4 providers
  - Cube 4 (Collector): Aggregates voice responses stored by Cube 3
  - Cube 5 (Gateway): Time tracking integration (start/stop voice_responding)
  - Cube 6 (AI): Consumes Redis events for theme pipeline (voice + text)
  - Cube 8 (Tokens): Ledger entries via Cube 5 time tracking
  - Cube 9 (Reports): Exports voice transcript data with clean_text + response_hash
- Backward (10→3→2→1): All verified — PASS
  - CRS-08: response_hash computed on voice transcripts (matching Cube 2 pattern)
  - Frontend voice-input.tsx wired to backend API via FormData
  - V2T provider selector added to Moderator Settings (between Theme Customizer and Cube Architecture)
  - 5 new lexicon keys (cube3.settings.*) translated across 32 languages
- **RESULT: 9/9 SPIRAL TESTS PASS — 0 FAILURES, 0 REGRESSIONS**

### Cubes 4, 6–7, 9–10: SCAFFOLDED (stubs only)
- Models, schemas, and route stubs exist
- Service implementations pending

## Test Report Template (for Cube 3+ to follow)

Each cube implementation MUST produce the following deliverables matching Cube 1 and Cube 2 methodology:

### 1. Test Procedure Section (in CLAUDE.md)
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
