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

### Core Services
| Service | Responsibility |
|---------|---------------|
| API Gateway | FastAPI routes, rate limiting, auth, request validation |
| Session Service | Session CRUD, state machine, QR generation |
| Ingestion Service | Text/voice input validation, anonymization, PII detection |
| Collection Service | Response aggregation, MongoDB writes, Redis caching |
| Orchestrator Service | Triggers AI + ranking pipelines, time tracking |
| Embedding Worker Fleet | Batch embedding generation (async, horizontally scaled) |
| Clustering Engine | MiniBatchKMeans streaming clusterer (deterministic seed) |
| Governance Engine | Voting weight, compression, quadratic normalization |
| Token Ledger Service | Append-only ledger, lifecycle states, treasury accounting |
| Ranking Service | Deterministic aggregation, live WebSocket updates |
| Reporting Service | CSV/PDF export, dynamic analytics, insights engine |
| Simulation Runner | Cube checkout, replay tests, metric comparison |

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
- **Cube grid (3x3x3):**
  ```
  Level 1 (Base Layer) — positions are (Level, Row, Col):

         Col 1                Col 2                Col 3
  Row 1: Cube 7 Ranking       Cube 8 Tokens        Cube 9 Reports
         (1,1,1)              (1,1,2)              (1,1,3)

  Row 2: Cube 6 AI            Cube 1 Session       Cube 2 Text
         (1,2,1)              (1,2,2) ← CENTER     (1,2,3)

  Row 3: Cube 5 Gateway       Cube 4 Collector     Cube 3 Voice
         (1,3,1)              (1,3,2)              (1,3,3)

  Level 2 — Cube 10 Simulation at (2,2,2) — center of full 3x3x3
  ```
- **Implementation order (clockwise spiral from center):**
  1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
  (center → right → bottom-right → bottom → bottom-left → left → top-left → top → top-right)
- **Cube 10** (2,2,2) is Level 2, implemented after Layer 1 is complete
- **MVP phases:** MVP1 (working prototype) → MVP2 (usability/intelligence) → MVP3 (governance/monetization)

## Cube Architecture Overview
| Cube | Position | Name | MVP | Description |
|------|----------|------|-----|-------------|
| 1 | (1,2,2) CENTER | Session Join & QR | 1 | Session create (3 types, 2 polling modes: Single Round / Multi-Round Deep Dive), ID gen, QR/link, **join flow: language gate → results opt-in → session**, Desired Outcome setup (M2/M3), state management, **system/user/outcome metrics** |
| 2 | (1,2,3) | Text Submission Handler | 1 | Validate text inputs **in all 33 languages**, limits (Unicode-aware), language tag per response, **immediate ♡/◬ token display post-submit**, anonymization, PII detection |
| 3 | (1,3,3) | Voice-to-Text Engine | 2 | Browser mic, STT **in all 33 languages**, language tag per transcript, **immediate ♡/◬ token display post-submit**, forwards to Cube 2 pipeline |
| 4 | (1,3,2) | Response Collector | 1 | Aggregate inputs **in all 33 languages** with language tags, write to storage, caching, presence, **collect Desired Outcomes + result logs (M2/M3)** |
| 5 | (1,3,1) | User Input Gateway / Orchestrator | 1 | Central gateway, triggers AI + ranking, **TIME TRACKING (all 3 ♡ methods)**, confirmation gates, post-task outcome flow, **system/user/outcome metrics** |
| 6 | (1,2,1) | AI Theming Clusterer | 1 | Batch embeddings + streaming clustering + summarization |
| 7 | (1,1,1) | Prioritization & Voting | 1 | Ranking UI + deterministic aggregation + governance compression |
| 8 | (1,1,2) | Token Reward Calculator | 3 | SoI Trinity Tokens (3 ♡ methods) + method-tagged ledger + outcome tracking + governance/audit + treasury accounting |
| 9 | (1,1,3) | Reports, Export & Dashboards | 1 | CSV export (MVP1), PDF/analytics (MVP2+), **Pixelated Tokens (image+QR export with pixel-encoded token data)**, results distribution, **data destruction post-delivery**, M2/M3 export per Project ID |
| 10 | (2,2,2) CENTER | Simulation Orchestrator | 3 | Sandbox checkout, replay tests, metrics, versioning, reproducibility hash |

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
- **Treasury-backed HI redemption** — HI tokens only redeemable against treasury balance
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
  - 6 metrics: Insight (20%), Depth (15%), Future Impact (25%), Originality (15%), Actionability (15%), Relevance (10%)
  - Winner: highest CQS within the #1 most-voted Theme2 cluster
  - CQS hidden from users, visible to Moderators and system
- **Lead/Developer exception:** Leads ALWAYS get free access to results (transparency + accountability)
- **Stripe integration:** Set up from MVP1

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

### Cube 1 — Session Join & QR: COMPLETE (CRS-01→CRS-04)
- **All code is modular** — every cube is self-contained with clean interfaces
- Session CRUD, state machine (draft→open→polling→ranking→closed→archived)
- **Polling modes** (Moderator sets at creation): **Single Round** (one cycle) | **Multi-Round Deep Dive** (iterative, up to 3 rounds, context preserved)
- QR code generation, join flow, participant management
- **User join flow (sequential):** (1) Language dropdown (33 langs) → (2) Results opt-in + payment (click required; shows per-user fee if cost splitting enabled) → (3) See question
- **Results opt-in:** Must actively click Yes/No. Paying users flagged for Cube 9 results distribution after session closes
- **Master UI/UX language table:** Centralized, extensible language registry — admins/devs can add languages without code changes; all cubes reference this table
- **Metrics:** System (latency, QR gen time, join rate, concurrent sessions) | User (join funnel time, opt-in rate, device distribution) | Outcome (completion rate by mode, deep dive utilization, retention across rounds)
- **CRS-01:** Literal type validation on all enum fields (422 on invalid input), session ownership enforcement (403)
- **CRS-02:** Anonymous join via `get_optional_current_user()` — no Bearer token required
- **CRS-03:** Short code collision retry (5 attempts with DB uniqueness check)
- **CRS-04:** `expires_at` field (default 24h), `SessionExpiredError` (410 Gone), QR blocked for expired/closed sessions
- Files: `config.py`, `models/session.py`, `schemas/session.py`, `core/auth.py`, `core/exceptions.py`, `cubes/cube1_session/service.py`, `cubes/cube1_session/router.py`

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

### Cubes 2–4, 6–7, 9–10: SCAFFOLDED (stubs only)
- Models, schemas, and route stubs exist
- Service implementations pending

## .gitignore
See `.gitignore` file in project root. Key exclusions: node_modules, __pycache__, .env, venv, .next, .claude
