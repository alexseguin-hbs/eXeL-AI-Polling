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
| `Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv` | 5,000-row simulation dataset (all Q-0001) — 16-column schema with themes/summaries. Used to test AI pipeline (Cube 6) and export (Cube 9) without live API calls. Replaces archived v03. |
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
- **PostgreSQL (via Supabase):** Primary relational store — sessions, questions, rankings, audit, tokens, governance. Raw response text stored in `ResponseMeta.raw_text`; AI-generated summaries stored in `ResponseSummary` table (333/111/33-word tiers).
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
| Collection Service | **Cube 4** | Response aggregation, PostgreSQL writes, Redis caching |
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
- **Circuit breaker** pattern for all external AI provider calls (OpenAI, Grok, Gemini, Claude)
- **Graceful degradation** — system must serve partial results if AI pipeline is delayed

### Trinity Redundancy — Live Response Delivery (LOCKED, DO NOT REVERT)

The most critical feature: user responses appearing live on the moderator screen.
Confirmed working 2026-03-31 with real human input + 45 Ascended Master responses across 11 languages.

**USER SENDS (3 parallel paths — any 1 succeeding = response delivered):**

| Path | Transport | Latency | Dependency |
|------|-----------|:-------:|------------|
| **A** | Supabase Broadcast | ~50ms | WebSocket connection |
| **B** | Supabase DB INSERT | ~200ms | HTTP REST (always available) |
| **C** | CF KV POST | ~100ms | Cloudflare KV binding |

**MODERATOR RECEIVES (4 channels — any 1 succeeding = response displayed):**

| Channel | Source | Latency | Dependency |
|---------|--------|:-------:|------------|
| **A** | Supabase Broadcast listener | ~50ms | WebSocket subscription |
| **B** | postgres_changes listener | ~100ms | Supabase Realtime publication |
| **C** | CF KV poll | ~1s | Cloudflare KV binding |
| **D** | HTTP REST poll (2s) | ~2s | Only Supabase REST (bulletproof) |

**DEMO MODE (Spiral Test):** Direct callback (same tab, 0ms, no network)

**Supabase `responses` table schema:** `id` (UUID), `session_code` (string), `participant_id` (UUID), `content` (text), `created_at` (timestamp)

**Deduplication:** `seenIds` Set prevents doubles when multiple channels fire for the same response.

**⚠ SACRED CODE — NEVER MODIFY WITHOUT LIVE VERIFICATION:**
- `frontend/app/dashboard/page.tsx` — Channels A-D listeners + addResponse + addSpiralResponse
- `frontend/components/session-view.tsx` — Paths A-C send (text + voice)
- `frontend/lib/mock-data.ts` — startSpiralTest onResponse callback

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

  Level 2 — Cube 10 at center:

                        ●─────●─────●─────●
                        │ --  │ --  │ --  │
                        ●─────●─────●─────●
                        │ --  │ 10  │ --  │
                        ●─────●─────●─────●
                        │ --  │ --  │ --  │
                        ●─────●─────●─────●

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
  - **Language Lexicon gate:** Every Cube SSSES review MUST audit `t()` coverage — zero hardcoded English in UI. New keys added to `lexicon-data.ts` with all 33 languages via fallback chain.
  - Guiding principle: **"Where Shared Intention moves at the Speed of Thought"**
- **MVP phases:** MVP1 (working prototype) → MVP2 (usability/intelligence) → MVP3 (governance/monetization)

## Cube Architecture Overview
| Cube | Position | Name | MVP | Description |
|------|----------|------|-----|-------------|
| 1 | (1,2,2) CENTER | Session Join & QR | 1 | Session create, state machine, QR/link, join flow, capacity tiers, Moderator config. **SSSES 100%** — Security (Auth0 RBAC, rate limiting, PII anonymization, anti-sybil), Stability (state machine with validated transitions, retry logic, circuit breakers), Scalability (Redis presence, Supabase Realtime, horizontal-ready), Efficiency (indexed queries, batch operations, streaming QR), Succinctness (all functions <300 LOC, no legacy v04.2 comments). CRS-01 fully implemented and audited to 100% SSSES. |
| 2 | (1,2,3) | Text Submission Handler | 1 | Text validation (33 languages), PII detection, anonymization, token display |
| 3 | (1,3,3) | Voice-to-Text Engine | 2 | Browser mic, STT (4 providers), circuit breaker failover, Cube 2 pipeline |
| 4 | (1,3,2) | Response Collector | 1 | Aggregate inputs (33 languages), PostgreSQL storage, presence tracking |
| 5 | (1,3,1) | Gateway / Orchestrator | 1 | Pipeline triggers, time tracking (3 ♡ methods), token calculation |
| 6 | (1,2,1) | AI Theming Clusterer | 1 | Two-phase: live summarization + parallel theming, CQS scoring engine |
| 7 | (1,1,1) | Prioritization & Voting | 1 | Ranking UI, deterministic aggregation, governance compression |
| 8 | (1,1,2) | Token Reward Calculator | 3 | SoI Trinity Tokens, ledger, payments, talent profiles, execution separation |
| 9 | (1,1,3) | Reports & Dashboards | 1 | CSV/PDF, Pixelated Tokens, CQS dashboard, data destruction |
| 10 | (2,2,2) CENTER | Simulation Orchestrator | 3 | Per-cube isolation, code challenge, replay, metric comparison. **Feedback Loop (FB) at center** — collects from every screen, auto-tags Cube + CRS, feeds backlog → votes → AI → ◬ ♡ 웃 approval → deploy |

## CRS Naming Convention

**Standard format:** `CRS-##.##` — two-digit parent + two-digit sequential sub-number.
- Parent: `CRS-01` through `CRS-35` (canonical requirement numbers from Requirements.txt)
- Sub-CRS: `CRS-##.01`, `CRS-##.02`, `CRS-##.03`, etc. (sequential within each parent)
- **NEVER use letters** (no `.01a`, `.01b`, `.02c`) — always numerical: `.01`, `.02`, `.03`
- **NEVER use single-digit** decimals (no `CRS-09.1`) — always two-digit: `CRS-09.01`
- Input ID: `CRS-##.##.IN` | Output ID: `CRS-##.##.OUT`

**Feedback auto-categorization:** Every feedback submission auto-tags:
- `cube_id` = 1–10 (which cube the user is interacting with)
- `crs_id` = `CRS-##` (parent requirement)
- `sub_crs_id` = `CRS-##.##` (specific sub-requirement, if identifiable)
- `feedback_type` = `CRS` (maps to existing requirement) or `DI` (Design Idea — new feature not in spec)

## Cross-Cube Specifications

> **Detailed per-cube specs (data tables, I/O, functions, CRS, simulation requirements) are in:**
> - `docs/CUBES_1-3.md` — Session, Text, Voice (Cubes 1-3)
> - `docs/CUBES_4-6.md` — Collector, Gateway, AI Pipeline (Cubes 4-6)
> - `docs/CUBES_7-9.md` — Ranking, Tokens, Reports (Cubes 7-9)
> - `docs/CUBE_10.md` — Simulation Orchestrator, Code Challenge, Per-Cube Isolation
> - `docs/SPIRAL_METRICS.md` — All N=5/N=9/N=18 metric baselines

The following cross-cube specifications apply across multiple cubes:

### Target Output Schema
16-column CSV format — see `docs/CUBES_7-9.md` (Cube 9 Target Output Schema) and reference file `Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv` (5,000 simulated responses, all Q-0001, used for offline AI pipeline and export testing).

### Token System & Governance
SoI Trinity Tokens (♡ 웃 ◬), 3 distribution methods, 59-jurisdiction rate table, append-only ledger, governance weight damping — see `docs/CUBES_7-9.md` (Cube 8) and `Token_Governance_Math.md`.

### Time Tracking
Per-user active participation time, 3 ♡ methods, confirmation gates, token calculation — see `docs/CUBES_4-6.md` (Cube 5).

### Pixelated Tokens
Self-contained value-carrying image with DNA-style integrity — see `docs/CUBES_7-9.md` (Cube 9).

### Monetization Model — 3 Tiers + Donation

| Tier | Who Pays | Minimum | Max Users | Donation Prompt |
|------|----------|:-------:|:---------:|-----------------|
| **Free** | Nobody | $0 | 19 | After results CSV delivered — Moderator + Users asked to donate (optional) |
| **Moderator Paid** | Moderator upfront | **$11.11 USD** | Unlimited | After results — both Moderator + Users see cost estimate + donation ask |
| **Cost Split** | 50% Moderator + 50%/N Users | System estimate | Unlimited | Above estimate — Moderator + Users asked to donate |

- **Cost estimation:** System calculates estimated cost from `# of users × # of responses × AI processing`. Shown in UX to anchor donation amounts.
- **Cost Split formula:** `Moderator pays = estimate / 2`. Each User pays = `(estimate / 2) / N` where N = number of users.
- **Donation timing:** Always **after results are delivered** (CSV polling + theming data), never before. Results are not gated by donation.
- **Gamified reward:** Moderator-set CQS bonus awarded to top contributor — see `docs/CUBES_4-6.md` (Cube 6 CQS Engine)
- **Lead/Developer exception:** Free access to results (transparency + accountability)
- **Payment provider:** Stripe (Checkout for Moderator Paid, Payment Intent for Cost Split)

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
- Databases: Docker Compose (PostgreSQL, Redis)

## API, SDK & Embed Architecture — Current State

### REST API (Implemented)
- **54 endpoints** across 9 cube routers at `/api/v1` (+ 1 health endpoint)
- **OpenAPI auto-docs:** FastAPI generates interactive docs at `/api/v1/docs` (Swagger UI) and `/api/v1/redoc`
- **Endpoint breakdown:** Cube 1 (19), Cube 2 (4), Cube 3 (5), Cube 4 (6), Cube 5 (9), Cube 6 (2), Cube 7 (3 stub), Cube 8 (4), Cube 9 (2 stub)

### Authentication & Security (Implemented)
- **Auth0 JWT:** Bearer token validation via `core/auth.py` (135 lines)
- **RBAC:** Moderator, User (Participant), Lead/Developer, Business Owner/Admin
- **Rate limiting:** Global rate limiter via `core/rate_limit.py`; 100/min on Cube 1 join endpoint
- **Security headers:** `X-Frame-Options: DENY`, `Permissions-Policy: microphone=(self)` via `core/security.py`
- **CORS:** Dynamic origin allowlist + `*.pages.dev` regex pattern via `core/middleware.py` (109 lines)

### Cloudflare Pages Function (Implemented)
- **File:** `frontend/functions/api/responses.js` (113 lines)
- **Purpose:** Cross-device response sharing for Spiral Test + SIM via Cache API / KV
- **Endpoints:** `GET /api/responses?sessionId=X` (read), `POST /api/responses` (write)
- **Storage:** Cloudflare Cache API (primary) with KV fallback

### Embed Readiness (Current Gaps)
- **X-Frame-Options: DENY** blocks iframe embedding — must be changed to `ALLOW-FROM` or removed per embed domain
- **No Web Component** (`<exel-polling>`) exists yet — planned for SDK phase
- **No postMessage API** — planned for iframe communication
- **No API key management** — currently Auth0 JWT only; per-org API keys planned
- **No scoping tables** — Project/Differentiator/Specification DB tables not yet created
- **No webhooks** — async event callbacks planned but not implemented
- **No usage metering** — billing/usage tracking not yet built

### Embed Roadmap (3 Modes — Planned)
| Mode | Description | Status |
|------|-------------|--------|
| **Full Embed** | iframe with postMessage API or Web Component (`<exel-polling>`) | Not started |
| **Headless API** | REST endpoints + SDK — company renders own UI | API exists, SDK not packaged |
| **Hybrid** | Mix of embedded components + custom API calls | Not started |

### Planned SDK Packages
- `@exel-ai/sdk` (npm) — TypeScript client wrapping all 54+ endpoints
- `exel-ai-sdk` (PyPI) — Python client for backend integrations
- OpenAPI spec will be published as versioned artifact for codegen

## Implementation Status

### Implementation Summary

> **SSSES audit (2026-03-30):** Per-pillar scores for Cubes 2–6 in `SSSES.md`. Spiral code audit found 8 new gaps (C4-3→C6-8) documented in `docs/CUBES_4-6.md`. Full task definitions: A0–A7/B1–B5 in `docs/CUBES_1-3.md`; C4-1→C6-8 in `docs/CUBES_4-6.md`.

| Cube | Status | SSSES | Tests | CRS | Open Tasks |
|------|--------|:---:|-------|-----|------------|
| 1 Session | **100% SSSES** | **100** | 59 | CRS-01→06 | None |
| 2 Text | **~98% SSSES** | **91** | 62 | CRS-05→08 | A0–A7 DONE, B1–B5 DONE. Phase 3: DB error handling, bounded cache, Cube 5 fault tolerance. |
| 3 Voice | ~85% | 56 | 39 | CRS-08, 15 | A5.03, A7 |
| 4 Collector | ~80% | 72 | 21 | CRS-09→10 | C4-1→C4-4 |
| 5 Gateway | ~90% | 82 | 60 | CRS-09→11 | C5-1→C5-4 |
| 6 AI Pipeline | ~85% | 58 | 26 | CRS-11→14 | C6-1→C6-8 |
| 7 Ranking | Stub | 22 | — | CRS-11→13, 16-17, 22 | C7-1→C7-3 |
| 8 Tokens | Partial | 45 | 19 | CRS-18-19, 24-25, 32-35 | C8-1→C8-3 |
| 9 Reports | Partial | 29 | — | CRS-14-15, 19-21 | C9-1→C9-3 |
| 10 Simulation | Easter Egg SIM | — | — | — | — |
| **Total** | | | **286** | | **A0–A7, B1–B5, C4–C6** |

### Frontend Cross-Cube Infrastructure
These frontend systems span multiple cubes:

- **Language Lexicon:** 362 keys × 32 languages = 11,584 translations. Per-cube key groups, admin approval gate (`explore@eXeL-AI.com`), `t()` fallback chain (translation → English → raw key). Files: `frontend/lib/lexicon-data.ts`, `frontend/lib/lexicon-context.tsx`, `frontend/lib/lexicon-translations.ts`, `frontend/components/language-lexicon.tsx`
- **Settings Panel:** Slide-over with session-cascading theme customizer (8 presets + custom = 9 options), language selector, Lexicon admin. Auth-gated: polling users see view-only at 40% opacity, moderators get full control. Files: `frontend/components/moderator-settings.tsx`, `frontend/lib/theme-context.tsx`
- **Theme Auth Guard:** Default AI Cyan pre-auth. Only Auth0 moderators change themes. Session-level cascade to all participants. Logout resets to default. Files: `frontend/lib/theme-context.tsx`, `frontend/components/providers.tsx`
- **Global Language Selector:** Navbar globe dropdown, 33 languages (EN+ES pinned top), instant locale switching, localStorage persistence. Files: `frontend/components/navbar.tsx`, `frontend/lib/lexicon-context.tsx`
- **Powered Badge:** eXeL + Seed of Life SVG, theme-reactive color. Easter egg gateway: Cyan→Sunset→Violet click sequence in Settings → badge blinks → click to enter Cube 10 SIM. Files: `frontend/components/powered-badge.tsx`, `frontend/components/seed-of-life-logo.tsx`
- **Homepage SoI Trinity Alignment:** Three feature cards subconsciously introduce AI/SI/HI before users know the framework:

  | Position | Feature | Subtitle | SoI Link |
  |:--------:|---------|----------|:--------:|
  | Left | **AI Theming** | Automatic clustering and summarization in seconds | **A.I.** (Artificial Intelligence) |
  | Center | **Scale to Millions** | Handle 100K+ concurrent participants with real-time results | **S.I.** (Shared Intent) |
  | Right | **Human Governance** | Auditable Consensus at the Speed of Thought | **H.I.** (Human Intelligence) |

- **Cost Estimate Table:** Collapsible in Settings panel. Shows 7 provider combos (Summary + V2T + Total) for 1000 users × 1 response × 111 words. OpenAI + Whisper default. Files: `frontend/components/moderator-settings.tsx`

### Demo Sessions (3 default)
| # | Title | Code | Status | Users | Date | Mode | Purpose |
|---|-------|------|--------|:-----:|------|------|---------|
| 1 | eXeL AI Polling - Strategy Alignment | `DEMO2026` | Polling | 3 | 3/31/2026 | Live | 100-User Spiral Test + Ranking DnD |
| 2 | Collaborative Thoughts on AI Governance | `PAST0001` | Closed | 5,000 | 3/29/2026 | Live | 5000-user results from v04.1_5000.csv + theme visualizations + ranking |
| 3 | Team Innovation Challenge | `STATIC01` | Polling | 15 | 3/31/2026 | Static | 3-day countdown timer demo |

## SSSES Testing & Audit Framework

**SSSES** is the official quality framework. Every Cube and every code change is audited against five pillars before being marked complete. Full spec in `SSSES.md`.

| Pillar | Definition | Test Signal |
|--------|------------|-------------|
| **S**ecurity | Data, session, user protection | RLS policies, rate limiting, PII anonymization, no leaks |
| **S**tability | Consistent behavior across devices/networks | Phone + desktop, QR + code entry, pre/post-polling join, no regressions |
| **S**calability | 100+ concurrent users | Supabase Broadcast for push, Supabase DB REST for global consistency |
| **E**fficiency | Fast, minimal resource use | <100ms auto-advance, no unnecessary polls, correct React deps |
| **S**uccinctness | Clean, maintainable code | Single-responsibility, no abstractions for one-time use, <300 LOC per function |

**Scoring:** Each pillar 0–100. A Cube is **production-ready only when all five reach 100**.

**Every commit must state SSSES impact.** Example:
```
Fix participant count broadcast — use subscribed channel (Stability +20, Efficiency +10)
```

**Realtime stability checklist (Cube 1 forward):**
- [ ] Supabase channel used for sending is the same subscribed channel (never ad-hoc `.channel(...).send()`)
- [ ] Status only moves forward — `STATUS_ORDER` rank enforced, no regressions to stale local data
- [ ] Supabase DB (`session_status`) written on CREATE and every transition — enables direct code entry
- [ ] Participant count synced to Supabase DB on every join — all lobby devices see accurate count via 1s poll
- [ ] `new_response` broadcast routed to rendered feed array — live feed updates without KV

**Language Lexicon checklist (MANDATORY per Cube SSSES review):**
- [ ] ALL user-facing strings use `t("key")` — zero hardcoded English in JSX
- [ ] New Lexicon keys added to `frontend/lib/lexicon-data.ts` with `englishDefault` + `context` + `cubeId`
- [ ] Key count verified: `grep -c "key:" frontend/lib/lexicon-data.ts` (must increase or stay same, never decrease)
- [ ] `tsc --noEmit` passes (0 errors)
- [ ] Fallback chain works: translation → English default → raw key (no blank UI in any language)

## SSSES Audit & Simulation Agents — 12 Ascended Masters

All 12 agents are led by **Master of Thought (MoT / Thought Master)** for both SSSES audits (testing) and Cube 10 parallel simulation reruns, metrics, and outcome videos.

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

## Test Report Template

Each cube implementation MUST produce the following deliverables:

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
| Tests Passed | X/X | ... | **X/X** | **0** |
| Backend Test Duration | Xms | ... | **Xms** | **Xms** |
| TypeScript Errors | 0 | ... | **0** | **0** |
```

### 3. Spiral Propagation Verification
```
**Spiral Propagation Verification:**
- Forward (N→10): [list downstream impacts] — PASS/FAIL
- Backward (10→N): [list upstream impacts] — PASS/FAIL
```

### 4. CUBE_N_TEST_METHOD dict (in test_e2e_flows.py)
```python
CUBEN_TEST_METHOD = {
    "cube": "cubeN_name",
    "version": "1.0.0",
    "test_command": "python -m pytest tests/cubeN/ -v --tb=short",
    "test_files": [...],
    "baseline_metrics": { ... },
    "flows": { ... },
    "spiral_propagation": { "forward": { ... }, "backward": { ... } },
}
```

### 5. CRS Traceability Table
```
| CRS | Input ID | Output ID | Status | DTM Stretch Target |
```

### 6. Unity Verification
- All tests pass (0 failures)
- `tsc --noEmit` returns 0 errors
- All changes committed and pushed to GitHub
- Local === Remote confirmed

## Shared Core Library
All cubes import from `core/`: auth, db, translations, hi_rates, payment, logging, exceptions, config, metrics, circuit_breaker, scoping.

## Key Architectural Decisions
- **Translation:** Admin UI panel shared with Team/Leads. AI-verified + 1 Team/Lead/Admin approval for new languages.
- **Traceability:** Moderator sets ONE of 3 scoping contexts at session creation (Project / Specification / Product Differentiator). All downstream data inherits via session_id.
- **Talent recommendation:** Cube 8 builds talent profiles from CQS + participation. Cube 9 recommends talent.
- **Ideation/execution separation:** Ideation team blocked from execution roles per scoping_id.
- **Simulation pass criteria:** Must EXCEED existing System, User, and Business/Outcome metrics.
- **Self-improvement:** System-prompted feedback + feedback icon → prioritized backlog by cube/scoping context.

## .gitignore
See `.gitignore` file in project root. Key exclusions: node_modules, __pycache__, .env, venv, .next, .claude
