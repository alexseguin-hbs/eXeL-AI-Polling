# Claude Code - Project Instructions

## Workflow Rules
- **ALWAYS commit and push to GitHub after each change.** Do not wait — commit and push immediately after every modification.

## Project
- **Name:** eXeL-AI-Polling
- **Local path:** /home/explore/eXeL_AI_Polling
- **Platform:** Linux (WSL2)

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

## Technology Stack Decisions

### Frontend
- **Framework:** React + Next.js
- **UI Library:** shadcn/ui (clean, modern default — no existing brand/designs yet)
- **Hosting:** Cloudflare Pages
- **Responsive UI:** Mobile-first design — must work on Desktop, Laptop, Tablet, Phone (Android + iOS)
- **No native app** — responsive web only, all devices via browser
- **Browsers:** Chrome, Safari (iOS), Firefox, Edge

### Backend
- **Framework:** FastAPI (Python)
- **Hosting:** VPS/cloud server with Cloudflare as CDN/proxy in front
- **Why:** Python required for ML/AI ecosystem (embeddings, clustering, summarization)

### Databases
- **PostgreSQL:** Primary relational store (sessions, questions, rankings, audit, tokens)
- **MongoDB:** Raw response storage (flexible schema for text/voice payloads)
- **Redis:** Real-time state (presence tracking, live rankings, WebSocket state, caching)

### Authentication
- **Provider:** Auth0
- **Roles (RBAC):** Moderator, User (Participant), Lead/Developer, Business Owner/Admin

### AI / Theme Clustering (Cube 6)
- **Architecture:** Multi-provider abstraction layer
- **Providers to support:** Build abstraction interface; implement providers as needed (OpenAI, Anthropic, Cohere, open-source)
- **Pipeline:** Embeddings → Clustering → Summarization → Themes with confidence + counts

### Scale Targets
- **MVP1:** 2,000–10,000 concurrent users per session
- **AI processing goal:** 1M inputs via sampling/batching in < 60 seconds (simulation target)

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
- **Implementation order:** Cube 1 FIRST (center of Level 1) → 5 → 2 → 4 → 6 → 7 → 9
- **Deferred:** Cube 3 (MVP2), Cube 8 (MVP3), Cube 10 (MVP3, paused)
- **MVP phases:** MVP1 (working prototype) → MVP2 (usability/intelligence) → MVP3 (governance/monetization)

## Cube Architecture Overview
| Cube | Position | Name | MVP | Description |
|------|----------|------|-----|-------------|
| 1 | (1,2,2) CENTER | Session Join & QR | 1 | Session create, ID gen, QR/link, join flow, state management |
| 2 | (1,2,3) | Text Submission Handler | 1 | Validate text inputs, limits, anonymization, PII detection |
| 3 | (1,3,3) | Voice-to-Text Engine | 2 | Browser mic, STT, language selection |
| 4 | (1,3,2) | Response Collector | 1 | Aggregate inputs, write to storage, caching, presence |
| 5 | (1,3,1) | User Input Gateway / Orchestrator | 1 | Central gateway, triggers AI + ranking, **TIME TRACKING** |
| 6 | (1,2,1) | AI Theming Clusterer | 1 | Embeddings + clustering + summarization |
| 7 | (1,1,1) | Prioritization & Voting | 1 | Ranking UI + backend aggregation |
| 8 | (1,1,2) | Token Reward Calculator | 3 | SoI Trinity Tokens + governance/audit |
| 9 | (1,1,3) | Reports, Export & Dashboards | 1 | CSV export (MVP1), PDF/analytics (MVP2+) |
| 10 | (2,2,2) CENTER | Simulation Orchestrator | 3 | Sandbox checkout, replay tests, metrics, versioning |

## Time Tracking (Critical — built into Cube 5)
- **What is tracked:** Active participation time per user per session
- **When it starts:** User begins responding to a question or starts voting/ranking
- **When it stops:** User submits response or completes ranking action
- **Granularity:** Per-action timestamps (start/stop for each response, each ranking)
- **Token mapping:** 1 minute of active participation = 1 ♡ SI token
- **Only SI tokens during polling/voting.** HI tokens (웃) are for later project execution, not polling.

## Monetization Model (MVP1)
- **Free tier:** Small sessions available at no cost
- **Moderator pays:** Per-session fee for larger sessions (Stripe)
- **User pays for results:** Users pay to download full results/reports
- **Lead/Developer exception:** Leads ALWAYS get free access to session results (transparency + accountability requirement)
- **Stripe integration:** Set up from MVP1

## Local Environment
- Backend: Python venv in `backend/` directory
- Frontend: Node.js in `frontend/` directory
- Databases: Docker Compose (PostgreSQL, MongoDB, Redis)

## .gitignore
See `.gitignore` file in project root. Key exclusions: node_modules, __pycache__, .env, venv, .next, .claude
