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

**Language Lexicon Gate (MANDATORY per Cube review)**
- Are ALL user-facing strings using `t("key")` — zero hardcoded English in JSX?
- Were new Lexicon keys added to `frontend/lib/lexicon-data.ts`?
- Does `tsc --noEmit` pass with 0 errors?
- Current key count: `grep -c "key:" frontend/lib/lexicon-data.ts` (must not decrease)

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
| 2 Text | 75 | 45 | 50 | 55 | 75 | **60** |
| 3 Voice | 100 | 100 | 100 | 100 | 100 | **100** |
| 4 Collector | 85 | 80 | 80 | 75 | 80 | **80** |
| 5 Gateway | 85 | 80 | 85 | 85 | 90 | **85** |
| 6 AI Pipeline | 70 | 40 | 55 | 55 | 70 | **58** |
| 7 Ranking | 20 | 10 | 15 | 15 | 50 | **22** |
| 8 Tokens | 45 | 40 | 35 | 45 | 60 | **45** |
| 9 Reports | 30 | 15 | 20 | 25 | 55 | **29** |
| 10 Simulation | — | — | — | — | — | Easter Egg |

> Scores for Cubes 2–9 established in SSSES audit on 2026-03-30. Full per-pillar rationale in `docs/CUBES_1-3.md` (Cubes 2-3), `docs/CUBES_4-6.md` (Cubes 4-6), and `docs/CUBES_7-9.md` (Cubes 7-9).

## Known SSSES Gaps

None outstanding for Cube 1. All five pillars reached 100/100 on 2026-03-27.

### Active Gaps — Cubes 2–6 (spiral code audit 2026-03-30)

**RESOLVED — Infrastructure (Cube 6):**
- ~~`backend/core/supabase_broadcast.py` does not exist~~ **RESOLVED (2026-03-30):** `backend/app/core/supabase_broadcast.py` exists (97 lines, httpx-based REST broadcast). Availability guard (A5.01) logs warning + continues on failure. **Phase A wired:** Task A5 (`summary_ready`) IMPLEMENTED in `cube6_ai/service.py` lines 203-213. **Remaining:** Task B4 (`themes_ready`) still open.
- `ResponseRead` schema has no `summary_33` field — frontend `session-view.tsx` line 712 type-asserts it but always gets `undefined` (Task C6-8 / A4)

**Critical path (Stability — Cubes 2, 3, 6):**
- ~~`summary_ready` Supabase broadcast never sent after Cube 6 Phase A~~ **RESOLVED (2026-03-30):** `broadcast_event("summary_ready")` implemented in `cube6_ai/service.py` lines 203-213 (Task A5). **Remaining:** Dashboard `summary_ready` listener (Task A6) still needed.
- `themes_ready` Supabase broadcast never sent after Phase B — dashboard has no signal to transition to results view (Task B4)
- Phase A has no retry on AI failure — silent log warning only (Task A2)
- Phase B has never been run E2E against a live 5000-response dataset (Task B1)
- `_store_results()` has no error handling around `response_summaries` table write — partial failure leaves pipeline in inconsistent state (Task C6-5)
- `_assign_themes_llm()` uses manual index tracking — `batch_summarize()` count mismatch causes IndexError (Task C6-6)

**Scalability — Cubes 5, 6:**
- No `asyncio.Semaphore(10)` concurrency cap on Phase A — 100 concurrent submits spawn 100 uncapped AI calls (Task A3)
- No timeout on AI API calls in Cube 6 — hung provider blocks entire pipeline forever (Task C6-4)
- No timeout on background pipeline task in Cube 5 — hung `run_pipeline()` leaves trigger `in_progress` permanently (Task C5-3)
- Phase B parallel batch classification unverified at 5000-response scale (Task B3)

**Security — Cubes 2, 3, 4, 5, 6:**
- ~~Voice path (Cube 3 → Cube 2 → Cube 6 Phase A) PII gate not verified with structured log assertion (Task A7)~~ **RESOLVED (2026-04-07):** Dynamic PII gate assertion in `cube3_voice/service.py` lines 557-565; `core/phase_a_retry.py` forwards only `clean_text` to Cube 6
- `run_pipeline()` (Cube 6 Phase B) does not filter responses by `pii_scrubbed` flag (Task C6-1)
- Pipeline status route (Cube 5) not Moderator-row-scoped — any authenticated user can read any session's pipeline metadata (Task C5-2)
- ~~Cube 4 anonymous user label uses 8-char UUID prefix (collision risk at scale) instead of SHA-256 `anon_hash` (Task C4-4)~~ **RESOLVED (2026-04-07):** SHA-256 anon_hash (12-char hex) implemented in `cube4_collector/service.py` lines 127, 225

**Efficiency / Succinctness — Cubes 2, 3, 6:**
- `summarize_single_response()` makes 3 sequential AI round-trips; single structured JSON prompt would halve round-trips (Task A1)
- No short-circuit for ≤33-word responses — AI call wasted on text already at target length (Task A0)
- `ResponseRead` schema missing `summary_33` field — frontend type-asserts it but always gets `undefined`; must add to schema (Task A4 / C6-8)

**Stability — Cubes 4, 5:**
- Background task failure on `asyncio.create_task(run_pipeline())` silently absorbed — `PipelineTrigger.status` stuck at `in_progress` forever (Task C5-1 / B5)
- Cube 6 → Cube 7 trigger chain not wired — `trigger_ranking_pipeline()` exists but is never called after Phase B completes (Task C5-4)
- ~~Cube 4 DB queries have no error handling — query exceptions propagate uncaught (Task C4-3)~~ **RESOLVED (2026-04-07):** Error handling + structured logging on critical count query in `cube4_collector/service.py`

**Implementation gap — Cube 4:**
- Methods 2 & 3 confirmation gate not implemented (`create_desired_outcome()`, `record_confirmation()`, `check_all_confirmed()` — CRS-10.01–10.03)

**Resolved gaps (2026-03-27):**
- **Efficiency:** 1.5s `checkStatus` poll now suspends while Broadcast is healthy (`broadcastHealthy` ref, 8s window). Poll only fires as fallback when Broadcast goes silent.
- **Succinctness:** `STATUS_ORDER` + `statusRank` extracted to shared `@/lib/session-utils.ts`.

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

## Audit Cadence

- **Every Cube completion:** Full 0–100 score per pillar documented in `docs/CUBES_*.md`
- **Every live test session:** Scenarios A–E from `docs/CUBES_1-3.md` run and results logged
- **Every release:** SSSES scores updated in this file
- **Simulation runs:** MoT orchestrates 12 Ascended Masters for Cube 10 parallel reruns
