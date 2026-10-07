# SSSES loop — round 1 (API surface + 1M readiness), 2026-10-07

Ask: docs/asks/*_ssses_loop_apis.md (with addenda 1–2). Reviewers: twelve lenses, six read-only agents, scoring the API
as it was at c578cba. Fix commit: 46ab268. Backlog of what is not fixed: docs/backlog/*_high_priority_backlog_1M_polling.md.

## Scores (mean of 12 lenses, 0–100)

| Pillar | Round 1 | Target |
|---|---|---|
| Security | 65.3 | > 90 |
| Stability | 80.6 | > 90 |
| Scalability | 72.3 | > 90 |
| Efficiency | 74.0 | > 90 |
| Succinctness | 72.7 | > 90 |

## Each lens

| Lens | Sec | Stab | Scal | Eff | Succ | One line |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | 62 | 78 | 66 | 70 | 72 | The fixed classes hold (0 x 500, Stripe webhook refuses unsigned events in production), but authorization is still the weak pillar. Two write endpoints are anonymous and have no rate limit, and both spend money: pod synt… |
| Odin (predictive / future-proof) | 66 | 76 | 62 | 68 | 70 | Several of these are traps that will trip a future deployment rather than today's mock-mode site. The role vocabulary has split: 10 checks use 'lead', 13 use 'lead_developer', and VALID_ROLES only knows 'lead_developer'.… |
| Enlil (implementation & build verification) | 72 | 84 | 74 | 76 | 73 | Round 1 closed the crash classes: the 158-operation sweep found 0 500s and the contract gates bite. What is still wrong is implementation drift between modules that look alike. Stripe got a production refusal, but auth d… |
| Krishna (integration & cross-module) | 70 | 82 | 75 | 77 | 74 | Session ownership is enforced unevenly across cubes. Cube 1 (verify_session_owner) and the Cube 9 export check created_by. The Cube 5 webhooks, Cube 6 /ai/run and Cube 7 /rankings/aggregate accept any moderator for any s… |
| Athena (strategic test planning) | 66 | 82 | 72 | 77 | 72 | The round-1 sweep and contract gates close the crash classes well: 0 × 500, signature, logger and tz gates, and the Stripe production refusal. Stability is close to 90 apart from lost-update races. The gap in the test pl… |
| Christo (consensus & user-flow) | 64 | 80 | 73 | 75 | 73 | On the happy path the journey holds end to end: create, join, submit, theme, rank, aggregate, export, destroy. The consensus flow itself can be forged, though. A desired-outcome confirmation trusts a participant_id from … |
| Enki (diversity & edge cases) | 62 | 80 | 74 | 76 | 72 | The 500 sweep closed the crash classes, and the happy path is solid. Edge inputs and other kinds of caller are not. Authentication fails open in production when AUTH0_DOMAIN is unset. The webhook SSRF guard is a string b… |
| Thoth (data & analytics deep dive) | 66 | 78 | 76 | 72 | 74 | Pagination and batch-loading are in place (no N+1 on /collected or the session list). The data the API returns is less trustworthy than its shape. Response language is hard-coded to 'English' in the collector. CSV langua… |
| Aset (consistency validation) | 66 | 82 | 74 | 78 | 71 | Round-1 fixes hold: 0x500 classes are gated and errors map to 4xx. But the same rule is not applied the same way everywhere. Session ownership (`service.verify_session_owner`) is called only in cube1/router.py. Every oth… |
| Asar (synthesis & outcome) | 68 | 83 | 73 | 77 | 72 | Outcome: the API now completes the full journey without crashing (38/38), which earns Stability in the low 80s. Security is the pillar holding the surface below 90. (1) Auth fails open: with no AUTH0_DOMAIN, every caller… |
| Pangu (cutting-edge) | 60 | 82 | 74 | 70 | 74 | The fixes from the 500 sweep hold. Every write now has an auth dependency, and the state machine, Stripe refusal and theme-replace changes are sound. What still falls short of current API practice is that authentication … |
| Sofia (multi-perspective) | 62 | 80 | 75 | 72 | 75 | I looked from four seats: participant, moderator, integrator and attacker. For a participant, another caller can stop their time entry and so cut the tokens it earns. Anyone signed in can also record their 'confirmation'… |

## Findings (48 raw, ~20 distinct) and what happened to each

| Severity | Finding | Status |
|---|---|---|
| major | `backend/app/core/auth.py:13` Authentication fails open: if AUTH0_DOMAIN is empty, every request is treated as a moderator, and there is no check that refuses this in production. | FIXED 46ab268 — fails closed (503) in production |
| major | `backend/app/cubes/cube8_tokens/router.py:227` The anonymous donation endpoint has no rate limit and passes the caller's success_url, cancel_url, label and description straight to Stripe Checkout. Anyone can mint checkout pages | see backlog |
| major | `backend/app/cubes/cube6_ai/pod_router.py:83` POST /pod/synthesis needs no auth and has no rate limit, yet it calls the configured paid AI provider with input of any size, so it can be used to run up provider cost. | FIXED — rate limit + input bounds |
| major | `backend/app/cubes/cube5_gateway/router.py:263` Webhook routes check the role but never ownership. Any moderator can subscribe to another moderator's session events (themes and rankings sent to their own URL), list its webhooks, | FIXED — require_session_owner + owner-scoped delete |
| major | `frontend/functions/api/sessions.js:89` The worker's POST /api/sessions (now live through PAGES_ROUTES) has no authentication. Anyone who knows a short code can overwrite that session's stored title, status, question_tex | BACKLOG HP-11 (client half in mock-data.ts, after the Cube SIM test) |
| major | `backend/app/cubes/cube7_ranking/router.py:372` The role vocabulary has split. Ten require_role checks use "lead", a role the system never issues (VALID_ROLES only has "lead_developer"). So a real Lead/Developer gets 403 on the  | FIXED — 'lead' aliases lead_developer; exact role match |
| major | `backend/app/cubes/cube5_gateway/router.py:262` Cross-tenant IDOR. Session ownership is checked in Cube 1 and the Cube 9 export but not in Cube 5, 6 or 7. Any moderator can register a webhook on another moderator's session and r | FIXED — require_session_owner on 43 routes |
| major | `backend/app/cubes/cube5_gateway/router.py:291` The webhook SSRF guard compares hostname strings, so internal targets are still reachable, and delivery does not check again. | FIXED — address-based guard at register and every delivery |
| major | `backend/app/core/rate_limit.py:18` There is no global default rate limit, and the per-IP key trusts the client-supplied leftmost X-Forwarded-For whenever behind_cloudflare is False (the default). The few endpoints t | FIXED — CF-Connecting-IP only |
| major | `backend/app/config.py:96` The Cube 10 admin and challenger access codes are hardcoded defaults in source (8 and 6 digits), and /verify-access has no rate limit, so a deployment that forgets the env var is g | FIXED — rate limit; demo codes refused in production |
| major | `frontend/functions/api/responses.js:92` Trinity Path C has no size limit on text or summaries and does a non-atomic read-modify-write of one KV or cache value per session. Anyone can poison a session code: about 420 post | PARTIAL — size caps; race → BACKLOG HP-09 |
| major | `frontend/ai-core.js:74` /api/ai spends the operator's OpenAI, Gemini, xAI and Anthropic keys, and its only gate is an Origin header that any non-browser client can set. There is no rate limit, and the pod | FIXED — per-client edge limit + size caps |
| major | `backend/app/cubes/cube4_collector/router.py:151` Desired-outcome confirmation takes participant_id from the request body. Any authenticated user can record a confirmation for any participant, or for a UUID that is no participant  | FIXED — identity from the caller |
| major | `backend/app/cubes/cube4_collector/router.py:178` The post-task results log is documented as moderator-only but only requires a login. Any participant can overwrite results_log and outcome_status, and can set assessed_by to any va | FIXED — owner-only |
| major | `backend/app/cubes/cube4_collector/router.py:40` GET /collected (and /collected/{response_id}) returns every participant's response text for any session to any authenticated caller. The only check is that the session exists. The  | FIXED — owner or lead/admin |
| major | `backend/app/cubes/cube5_gateway/router.py:72` POST /time/stop accepts anonymous callers, ignores the session_id in the path, and never checks that the entry belongs to the caller. Anyone holding a time_entry_id can stop anothe | FIXED — caller's own entry only |
| major | `backend/app/cubes/cube8_tokens/router.py:227` The anonymous /payments/divinity-donate route accepts any success_url, cancel_url, label and description, with no rate limit and no upper bound on the amount. Anyone can mint Strip | FIXED — rate limit, bounds, own-site redirects |
| minor | `backend/app/cubes/cube6_ai/router.py:25` POST /ai/run checks the role but not ownership, so any moderator can re-run, and replace, another moderator's themes and spend AI cost on it. The validated `provider` query paramet | FIXED (ownership); provider param → BACKLOG HP-15 |
| minor | `backend/app/cubes/cube8_tokens/payment_service.py:473` Synchronous Stripe SDK network calls run inside async handlers and block the event loop. Webhook fan-out runs in series inside the producer's request, with a new HTTP client and a  | BACKLOG HP-14 |
| minor | `backend/app/cubes/cube4_collector/service.py:478` Confirmations are appended with a read-modify-write on a JSONB list and no row lock. Two participants confirming at once each read the old list, and the last commit drops the other | FIXED — row lock |
| minor | `backend/app/cubes/cube9_reports/router.py:126` CSV export awaits webhook delivery inline, before it starts streaming the file. deliver_event posts to each subscription one after another with a 10-second httpx timeout, so one sl | BACKLOG HP-16 |
| minor | `backend/app/cubes/cube1_session/router.py:156` GET /sessions accepts unvalidated ints. offset=-1 or limit=-1 reaches Postgres as OFFSET/LIMIT -1 ('must not be negative'), and the generic handler turns that into a 500. This is a | FIXED — Query bounds |
| minor | `backend/app/core/permissions.py:16` The admin bypass is a substring test on the role string. Any role containing 'admin' (for example 'sysadmin_readonly' or 'nonadmin') passes every require_role check. Roles are not  | FIXED — exact match |
| minor | `backend/app/cubes/cube5_gateway/webhook_service.py:146` Webhooks are delivered serially, inline in the producing request or pipeline. Each subscription opens a new httpx.AsyncClient with a 10 s timeout, so one session with N slow or dea | FIXED — concurrent on one client |

## 1M scale review (measured) — fixed in 46ab268

- ranking_progress: COUNT(*) + broadcast on every ballot → coalesced ≤1/s per session off the request path.
- ranking_complete above 1000 voters went to unsubscribed shard channels → one message on `session:CODE`; count scoped to the cycle.
- anti-sybil: 2,931 honest voters excluded at 1M, a 100k swarm lost 3 votes → share-of-window rule, whole burst flagged (gate: 3,000 votes/s spared, 5,000-ballot swarm caught).
- presence: 105 MB per poll at 1M → count only.
- Everything else from the scale review is in the High Priority backlog (HP-01…HP-13).

## Spiral after the fixes

- pytest 3340 passed / 66 key-gated skips · sweep 158 operations, 0 × 500, 0 tracebacks · journey 38/38 · worker gate 15/15.
- New contract gates: 8 (ownership real check + route table, fail-closed auth, exact roles, IP key, SSRF ranges, bounded spend routes, burst rule, hot paths).

Round 2 re-scores the same surface after 46ab268 is live.
