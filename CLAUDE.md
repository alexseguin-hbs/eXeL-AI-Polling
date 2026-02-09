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
- **Incremental:** Build and deploy cube by cube for MVP1
- **MVP1 cube order:** Cube 1 → 2 → 4 → 5 → 6 → 7 → 9 (Cube 3 is MVP2, Cube 8/10 are MVP3)
- **MVP phases:** MVP1 (working prototype) → MVP2 (usability/intelligence) → MVP3 (governance/monetization)

## Cube Architecture Overview
| Cube | Name | MVP | Description |
|------|------|-----|-------------|
| 1 | Session Join & QR | 1 | Session create, ID gen, QR/link, join flow, state management |
| 2 | Text Submission Handler | 1 | Validate text inputs, limits, anonymization, PII detection |
| 3 | Voice-to-Text Engine | 2 | Browser mic, STT, language selection |
| 4 | Response Collector | 1 | Aggregate inputs, write to storage, caching, presence |
| 5 | User Input Gateway / Orchestrator | 1 | Central gateway, triggers AI + ranking |
| 6 | AI Theming Clusterer | 1 | Embeddings + clustering + summarization |
| 7 | Prioritization & Voting | 1 | Ranking UI + backend aggregation |
| 8 | Token Reward Calculator | 3 | SoI Trinity Tokens + governance/audit |
| 9 | Reports, Export & Dashboards | 1 | CSV export (MVP1), PDF/analytics (MVP2+) |
| 10 | Simulation Orchestrator | 3 | Sandbox checkout, replay tests, metrics, versioning |

## Local Environment
- Python virtual environment is present (`pyvenv.cfg`, `bin/`, `lib/`)
- Node.js packages installed (`node_modules/`, `package.json`)
- These local environment files should NOT be committed to GitHub

## .gitignore Recommendations
The following should be excluded from version control:
- `node_modules/`
- `bin/`, `lib/`, `lib64`, `include/`
- `pyvenv.cfg`
- `package-lock.json`
- `.claude/`
- `.env` (never commit secrets/API keys)
