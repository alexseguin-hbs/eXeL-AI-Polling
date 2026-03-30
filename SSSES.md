# SSSES Framework — Testing & Audit Protocol

**SSSES** is the official quality and verification framework for the eXeL-AI-Polling / SoI Governance Engine platform.

## What SSSES Stands For

| Pillar | Definition | What We Test For |
|--------|------------|-----------------|
| **S**ecurity | Protection of data, sessions, and users | RLS policies, anon access controls, rate limiting, no data leaks, PII anonymization, anti-sybil |
| **S**tability | Consistent, predictable behavior across devices and networks | Auto-advance works on phone + desktop, no crashes, no status regressions, retry logic |
| **S**calability | Handles real concurrent users (target: 100+ simultaneous) | 3+ real devices + 12 simulated agents working together, horizontal-ready architecture |
| **E**fficiency | Fast response times and minimal resource use | <100ms auto-advance via Broadcast, no unnecessary polling, batch operations, indexed queries |
| **S**uccinctness | Clean, minimal, maintainable code | No bloat, single-responsibility changes, clear comments, functions <300 LOC, no legacy dead code |

## Scoring

Each pillar is scored **0–100**.

A feature or Cube is only considered **production-ready** when **all five pillars reach 100/100**.

The overall SSSES score is the average of all five pillars. Partial scores are tracked in `docs/CUBES_*.md` per cube.

## How to Apply SSSES

### Every commit or PR must answer:

**Security**
- Does any new endpoint expose data without auth/RLS?
- Are new DB tables protected with row-level security policies?
- Is any user input validated and sanitized?

**Stability**
- Does the change work on phone (Safari/iOS, Chrome/Android) AND desktop?
- Does it work via QR code join AND direct 8-digit code entry?
- Does it work for users joining before AND after polling starts?
- Are state transitions idempotent? Can they fail and retry safely?

**Scalability**
- Does the change use WebSocket push (Supabase Broadcast) rather than polling where latency matters?
- Are all sync operations globally consistent (Supabase DB REST) not per-datacenter (CF Cache API)?
- Would this break at 100 concurrent users? At 1,000?

**Efficiency**
- Does the change add any new polling intervals? Are they necessary?
- Are any DB writes fire-and-forget that could be batched?
- Does the UI re-render unnecessarily? Are React deps correct?

**Succinctness**
- Is every new function doing exactly one thing?
- Is any new abstraction used more than once?
- Are there any copy-paste patterns that should be a shared utility?

## SSSES in Commit Messages

Every non-trivial commit should include a one-line SSSES impact note:

```
Fix participant count broadcast — use subscribed channel (Stability +20, Efficiency +10)
```

Or for a full audit:

```
Cube 1 SSSES audit 2026-03-27
Security: 100 — RLS on session_status, anon read/insert/update only
Stability: 100 — all 5 cross-device scenarios pass (A–E)
Scalability: 100 — 13 participants confirmed, Supabase Broadcast ~70ms
Efficiency: 95 — 1.5s DB poll is the slowest fallback; Broadcast is primary
Succinctness: 95 — status ratchet logic could be extracted to shared util
```

## Current Cube SSSES Status

| Cube | Security | Stability | Scalability | Efficiency | Succinctness | Overall |
|------|----------|-----------|-------------|------------|--------------|---------|
| 1 Session | 100 | 100 | 100 | 100 | 100 | **100** |
| 2 Text | 75 | 40 | 50 | 55 | 65 | **57** |
| 3 Voice | 70 | 40 | 50 | 55 | 65 | **56** |
| 4 Collector | 70 | 65 | 75 | 70 | 80 | **72** |
| 5 Gateway | 80 | 75 | 80 | 85 | 90 | **82** |
| 6 AI Pipeline | 70 | 40 | 55 | 55 | 70 | **58** |
| 7 Ranking | — | — | — | — | — | stub |
| 8 Tokens | — | — | — | — | — | partial |
| 9 Reports | — | — | — | — | — | partial |
| 10 Simulation | — | — | — | — | — | Easter Egg |

> Scores for Cubes 2–6 established in SSSES audit on 2026-03-30. Full per-pillar rationale in `docs/CUBES_1-3.md` (Cubes 2-3) and `docs/CUBES_4-6.md` (Cubes 4-6).

## Known SSSES Gaps

None outstanding for Cube 1. All five pillars reached 100/100 on 2026-03-27.

### Active Gaps — Cubes 2–6 (audited 2026-03-30)

**Critical path (Stability — Cubes 2, 3, 6):**
- `summary_ready` Supabase broadcast never sent after Cube 6 Phase A — dashboard shows client-side truncation fallback instead of AI summary (Tasks A5 + A6)
- `themes_ready` Supabase broadcast never sent after Phase B — dashboard has no signal to transition to results view (Task B4)
- Phase A has no retry on AI failure — silent log warning only (Task A2)
- Phase B has never been run E2E against a live 5000-response dataset (Task B1)

**Security — Cubes 2, 3, 6:**
- Voice path (Cube 3 → Cube 2 → Cube 6 Phase A) PII gate not verified with structured log assertion (Task A7)
- `run_pipeline()` (Cube 6 Phase B) does not filter responses by `pii_scrubbed` flag (Task C6-1)
- Pipeline status route (Cube 5) not Moderator-row-scoped — any authenticated user can read any session's pipeline metadata (Task C5-2)

**Scalability — Cubes 2, 3, 6:**
- No `asyncio.Semaphore(10)` concurrency cap on Phase A — 100 concurrent submits spawn 100 uncapped AI calls (Task A3)
- Phase B parallel batch classification unverified at 5000-response scale (Task B3)

**Efficiency — Cubes 2, 3, 6:**
- `summarize_single_response()` makes 3 sequential AI round-trips; single structured JSON prompt would halve round-trips (Task A1)

**Stability — Cube 5:**
- Background task failure on `asyncio.create_task(run_pipeline())` is silently absorbed — `PipelineTrigger.status` can be stuck at `in_progress` forever (Task C5-1 / Task B5)

**Implementation gap — Cube 4:**
- Methods 2 & 3 confirmation gate not implemented (`create_desired_outcome()`, `record_confirmation()`, `check_all_confirmed()` — CRS-10.01–10.03)

**Resolved gaps (2026-03-27):**
- **Efficiency:** 1.5s `checkStatus` poll now suspends while Broadcast is healthy (`broadcastHealthy` ref, 8s window). Poll only fires as fallback when Broadcast goes silent.
- **Succinctness:** `STATUS_ORDER` + `statusRank` extracted to shared `@/lib/session-utils.ts`.

## Audit Cadence

- **Every Cube completion:** Full 0–100 score per pillar documented in `docs/CUBES_*.md`
- **Every live test session:** Scenarios A–E from `docs/CUBES_1-3.md` run and results logged
- **Every release:** SSSES scores updated in this file
