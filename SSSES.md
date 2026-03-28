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
| 2 Text | — | — | — | — | — | ~85 |
| 3 Voice | — | — | — | — | — | ~85 |
| 4 Collector | — | — | — | — | — | ~80 |
| 5 Gateway | — | — | — | — | — | ~90 |
| 6 AI Pipeline | — | — | — | — | — | ~85 |
| 7 Ranking | — | — | — | — | — | stub |
| 8 Tokens | — | — | — | — | — | partial |
| 9 Reports | — | — | — | — | — | partial |
| 10 Simulation | — | — | — | — | — | Easter Egg |

## Known SSSES Gaps

None outstanding for Cube 1. All five pillars reached 100/100 on 2026-03-27.

**Resolved gaps (2026-03-27):**
- **Efficiency:** 1.5s `checkStatus` poll now suspends while Broadcast is healthy (`broadcastHealthy` ref, 8s window). Poll only fires as fallback when Broadcast goes silent.
- **Succinctness:** `STATUS_ORDER` + `statusRank` extracted to shared `@/lib/session-utils.ts`.

## Audit Cadence

- **Every Cube completion:** Full 0–100 score per pillar documented in `docs/CUBES_*.md`
- **Every live test session:** Scenarios A–E from `docs/CUBES_1-3.md` run and results logged
- **Every release:** SSSES scores updated in this file
