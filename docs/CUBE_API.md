# CUBE API — The Governance Engine Interface

> **103 endpoints. 9 SDK functions. 3 free internal APIs. 10 cubes.**
> **"Where Shared Intention moves at the Speed of Thought."**

---

## SSSES Assessment: API/SDK Layer

| Pillar | Score | Evidence | Gap |
|--------|:-----:|----------|-----|
| **Security** | 82 | Auth0 JWT on all mutation endpoints. API keys (exel_pk_*) for SDK. Cube 10 codes server-verified (SHA-256 constant-time). Rate limiting (100/min on join). | API key rotation not implemented. No per-key rate limiting (global only). |
| **Stability** | 85 | 103 endpoints registered. OpenAPI auto-docs at /docs. All endpoints return consistent error shapes. SDK registry at /api/v1/sdk. | No API versioning strategy (all v1). No deprecation headers. |
| **Scalability** | 80 | Streaming CSV for 1M exports. Sharded broadcast for 1M recipients. BordaAccumulator for 1M votes in 1.06s. Connection pool tuned for Supabase pgbouncer. | No CDN caching for GET endpoints. No geographic edge routing. |
| **Efficiency** | 78 | Centroid summarizer reduces 1M LLM calls to 27 ($55→$1). Batch Supabase INSERTs. Auto-select scale mode at >1000 responses. | No response compression (gzip). No ETag caching. |
| **Succinctness** | 85 | Universal function registry maps internal=external. SDK_DEVELOPER_GUIDE.md with 27 demos. SDK_API_REFERENCE.md with code samples per function. | Some endpoints have overlapping paths (2 presence endpoints). |
| **Overall** | **82** | | |

---

## The 9 SDK Functions (Paid — ◬ tokens)

| # | Function | Endpoint | Method | Cost | Cube |
|---|----------|----------|--------|------|------|
| 1 | `sdk.compress(texts)` | `/v1/compress` | POST | 5◬/1K texts | C6 |
| 2 | `sdk.vote(session, rankings)` | `/v1/vote` | POST | 0.01◬/vote | C7 |
| 3 | `sdk.convert(amount_usd)` | `/v1/convert` | POST | Free | C8 |
| 4 | `sdk.detect(session)` | `/v1/detect` | GET | 1◬/scan | C7 |
| 5 | `sdk.consensus(session)` | `/v1/consensus` | GET | 0.5◬/check | C7 |
| 6 | `sdk.verify(session)` | `/v1/verify` | GET | Free | C7 |
| 7 | `sdk.challenge(cube, code)` | `/v1/challenge` | POST | 10◬/submission | C10 |
| 8 | `sdk.override(session, theme, rank, reason)` | `/v1/override` | POST | 2◬/override | C7 |
| 9 | `sdk.broadcast(session, payload)` | `/v1/broadcast` | POST | 1◬/10K recipients | C7 Scale |

## The 3 Internal APIs (Free — core platform)

| # | Function | Endpoint | Method | Why Free |
|---|----------|----------|--------|----------|
| A | `createSession()` | `/v1/sessions` | POST | Starting conversations should never cost |
| B | `submitResponse()` | `/v1/sessions/{id}/responses` | POST | Every voice deserves to be heard |
| C | `exportCSV()` | `/v1/sessions/{id}/export/csv` | GET | Truth belongs to everyone |

---

## Full Endpoint Map by Cube

### Cube 1 — Session (19 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /sessions | Mod | List moderator's sessions |
| POST | /sessions | Mod | Create session |
| GET | /sessions/{id} | — | Get session by ID |
| GET | /sessions/code/{code} | — | Get session by code |
| PATCH | /sessions/{id} | Mod | Update session config |
| POST | /sessions/{id}/start | Mod | Quick-start (draft→open) |
| POST | /sessions/{id}/open | Mod | Transition to open |
| POST | /sessions/{id}/poll | Mod | Start polling |
| POST | /sessions/{id}/rank | Mod | Start ranking |
| POST | /sessions/{id}/close | Mod | Close session |
| POST | /sessions/{id}/archive | Mod | Archive session |
| POST | /sessions/join/{code} | — | Join session (rate limited) |
| GET | /sessions/{id}/participants | Auth | List participants |
| GET | /sessions/{id}/presence | — | Live participant count |
| POST | /sessions/{id}/questions | Mod | Add question |
| GET | /sessions/{id}/questions | — | List questions |
| GET | /sessions/{id}/qr | — | QR code PNG |
| GET | /sessions/{id}/qr-json | — | QR code base64 |
| GET | /sessions/{id}/verify-determinism | — | Replay hash check |

### Cube 2 — Text Input (4 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /sessions/{id}/responses | Auth | Submit text response |
| GET | /sessions/{id}/responses | Auth | List responses |
| GET | /sessions/{id}/responses/metrics | Auth | Response metrics |
| GET | /sessions/{id}/responses/{rid} | Auth | Get single response |

### Cube 3 — Voice (5 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /sessions/{id}/voice | Auth | Submit voice (audio→text) |
| WS | /sessions/{id}/voice/realtime | Auth | Real-time STT WebSocket |
| GET | /sessions/{id}/voice | Auth | List voice responses |
| GET | /sessions/{id}/voice/metrics | Auth | Voice metrics |
| GET | /sessions/{id}/voice/{rid} | Auth | Get voice response |

### Cube 4 — Collector (10 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /sessions/{id}/collected | Auth | Get collected responses |
| GET | /sessions/{id}/collected/{rid} | Auth | Get single collected |
| GET | /sessions/{id}/response-count | Auth | Response count |
| GET | /sessions/{id}/response-languages | Auth | Language breakdown |
| GET | /sessions/{id}/presence | — | Presence tracking |
| GET | /sessions/{id}/summary-status | Auth | Summary completion status |
| POST | /sessions/{id}/desired-outcome | Auth | Create desired outcome |
| POST | /sessions/{id}/desired-outcome/{oid}/confirm | Auth | Confirm outcome |
| GET | /sessions/{id}/desired-outcome/{oid}/check | Auth | Check confirmation |
| POST | /sessions/{id}/desired-outcome/{oid}/results | Auth | Log results |

### Cube 5 — Gateway (9 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /sessions/{id}/time/start | Auth | Start time tracking |
| POST | /sessions/{id}/time/stop | Auth | Stop time tracking |
| GET | /sessions/{id}/time/summary/{pid} | Auth | Time summary |
| POST | /sessions/{id}/pipeline/trigger-theming | Mod | Trigger AI pipeline |
| GET | /sessions/{id}/pipeline/status | Mod | Pipeline status |
| POST | /sessions/{id}/pipeline/retry/{tid} | Mod | Retry failed pipeline |

### Cube 6 — AI Theming (4 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /sessions/{id}/ai/run | Mod | Run full theme pipeline |
| GET | /sessions/{id}/ai/status | Mod | Pipeline status |
| POST | /sessions/{id}/ai/cqs | Mod | Run CQS scoring |
| GET | /sessions/{id}/themes | — | Get generated themes |

### Cube 7 — Ranking (11 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /sessions/{id}/rankings | Auth | Submit ranking |
| GET | /sessions/{id}/rankings | — | Get aggregated rankings |
| POST | /sessions/{id}/rankings/aggregate | Mod | Trigger aggregation |
| GET | /sessions/{id}/rankings/anomalies | Mod | Check anomalies |
| GET | /sessions/{id}/rankings/emerging | Mod | Emerging patterns |
| GET | /sessions/{id}/rankings/personal | Auth | Personal vs group rank |
| GET | /sessions/{id}/rankings/verify | Auth | Replay verification |
| GET | /sessions/{id}/rankings/progress | Mod | Submission progress |
| GET | /sessions/{id}/rankings/scale-info | Mod | Scale engine info |
| POST | /sessions/{id}/override | Lead | Governance override |
| GET | /sessions/{id}/overrides | Mod | Override audit trail |

### Cube 8 — Tokens (18 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /payments/moderator-checkout | Mod | Stripe checkout |
| POST | /payments/cost-split | Auth | Cost split payment |
| POST | /payments/donate | Auth | Donation |
| GET | /sessions/{id}/payments | Mod | Payment status |
| GET | /sessions/{id}/cost-estimate | — | Cost estimate |
| GET | /sessions/{id}/tokens | Mod | Token ledger |
| GET | /sessions/{id}/tokens/balance | Auth | User balance |
| GET | /sessions/{id}/tokens/summary | Mod | Token summary |
| GET | /sessions/{id}/tokens/velocity | Auth | Velocity cap check |
| GET | /sessions/{id}/tokens/config | Auth | Token config |
| POST | /tokens/dispute | Auth | File dispute |
| POST | /tokens/disputes/{did}/resolve | Lead | Resolve dispute |
| POST | /tokens/{eid}/transition | Admin | Lifecycle transition |
| POST | /tokens/{eid}/reverse | Lead | Reverse entry |
| GET | /tokens/rates | — | 59 jurisdiction rates |
| GET | /tokens/rates/lookup | — | Rate lookup |
| GET | /tokens/talent/{uid} | Mod | Talent profile |
| POST | /webhooks/stripe | — | Stripe webhook |

### Cube 9 — Reports (8 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /sessions/{id}/export/csv | Auth | CSV download (auto-streams at 10K+) |
| GET | /sessions/{id}/export/pdf | Auth | PDF export (stub) |
| GET | /sessions/{id}/analytics | Mod | Analytics dashboard |
| GET | /sessions/{id}/cqs-dashboard | Mod | CQS scoring dashboard |
| GET | /sessions/{id}/ranking-summary | Auth | Ranking results |
| GET | /sessions/{id}/results/distribution | Mod | Eligibility check |
| GET | /sessions/{id}/results/reward | Mod | CQS winner details |
| POST | /sessions/{id}/destroy-data | Admin | Irreversible data destruction |

### Cube 10 — Simulation (8 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | /feedback | Auth | Submit feedback |
| GET | /feedback/stats | Admin | Feedback stats |
| POST | /submissions | Auth | Code submission |
| GET | /submissions/{sid}/test | Lead | Sandbox test |
| GET | /submissions/{sid}/tally | Auth | Vote tally |
| POST | /challenges | Admin | Create challenge |
| POST | /challenges/{cid}/claim | Auth | Claim challenge |
| POST | /challenges/{cid}/submit | Auth | Submit code |

### Discovery & Health (7 endpoints)
| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | /health | — | Health check |
| GET | /cubes | — | 10-cube registry |
| GET | /functions | — | Universal function registry |
| GET | /sdk | — | 9+3 SDK function registry |
| GET | /sdk/estimate | — | Session cost estimator |
| POST | /compress/estimate | — | Theme compression cost |
| POST | /compress/validate | — | Validate compression inputs |
| POST | /verify-access | Auth | Cube 10 access code verification |

---

## Sharing

The API & SDK panel in the Settings dropdown provides 3 sharing methods:

| Method | How |
|--------|-----|
| **📧 Email** | Opens mailto with SDK docs link + description |
| **📱 Phone** | Web Share API (mobile) or clipboard copy |
| **📷 QR Code** | Our own Cube 1 QR generator (fallback to external) |

All share links point to `/api` section of the website.

---

## Cost Examples

| Session Size | Responses | Voters | ◬ Cost | USD Equivalent* |
|:------------:|:---------:|:------:|:------:|:---------------:|
| Small team | 50 | 10 | ~1 ◬ | ~$0.01 |
| Department | 500 | 100 | ~4 ◬ | ~$0.04 |
| Organization | 5,000 | 1,000 | ~36 ◬ | ~$0.36 |
| City | 50,000 | 10,000 | ~355 ◬ | ~$3.55 |
| State | 500,000 | 100,000 | ~3,500 ◬ | ~$35 |
| Nation | 1,000,000 | 500,000 | ~10,050 ◬ | ~$100 |

*At ~$0.01 per ◬ token (indicative — actual rate set by platform economics)

---

## Authentication

| Type | Header | Use Case |
|------|--------|----------|
| **Auth0 JWT** | `Authorization: Bearer {jwt}` | Web app users (Moderator, User, Lead, Admin) |
| **API Key** | `Authorization: Bearer exel_pk_{key}` | SDK/iframe/headless integrations |
| **None** | — | Public endpoints (health, rates, QR, session lookup) |

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [SDK_DEVELOPER_GUIDE.md](SDK_DEVELOPER_GUIDE.md) | Heart-mind-spirit guide to the 9 functions |
| [SDK_API_REFERENCE.md](SDK_API_REFERENCE.md) | Full API reference with 27 Ascended Master demos |
| [CUBE_10_PLAN.md](CUBE_10_PLAN.md) | Self-evolving platform architecture |
| [MASTER_OF_THOUGHT_2525.md](MASTER_OF_THOUGHT_2525.md) | Civilizational vision |
| [Token_Governance_Math.md](../Token_Governance_Math.md) | Formal token formulas |

---

*103 endpoints. 1044 tests. 572 lexicon keys. 10 cubes.*
*Where Shared Intention moves at the Speed of Thought.*
