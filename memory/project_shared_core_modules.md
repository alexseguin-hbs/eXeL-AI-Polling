---
name: Shared core modules inventory
description: 6 shared core modules extracted from Cubes 2-4 for cross-cube reuse
type: project
originSessionId: d359f04d-a822-4eff-986a-f830612ae051
---
**6 shared core modules** created during Cube 3-4 SSSES audit (2026-04-07/08):

| Module | LOC | Used By | Pattern |
|--------|-----|---------|---------|
| `core/circuit_breaker.py` | 85 | Cube 3, ready for Cube 6 | Per-provider failure tracking + cooldown |
| `core/text_pipeline.py` | 79 | Cube 2, 3 | Shared PII + profanity pipeline |
| `core/phase_a_retry.py` | 187 | Cube 2, 3 | Phase A retry + <33-word fallback + broadcast |
| `core/presence.py` | 69 | Cube 1, 4 | In-memory dict presence tracking |
| `core/crypto_utils.py` | 77 | Cube 1, 2, 3, 4, 6 | SHA-256 hash functions (response, anon, replay, theme) |
| `core/concurrency.py` | 47 | Cube 3, 6 | SessionSemaphorePool for per-session rate limiting |

**How to apply:** When starting any new cube audit, check if it can use these modules before writing inline code. The goal is zero duplicated patterns across cubes.

**Total LOC saved:** ~200+ lines eliminated from Cubes 2, 3, 4 by consolidation.
