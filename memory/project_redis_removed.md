---
name: Supabase-only architecture
description: All Redis code, imports, tests, docs, and requirements fully removed 2026-04-10. Zero references remain.
type: project
originSessionId: d359f04d-a822-4eff-986a-f830612ae051
---
Complete Redis eradication completed 2026-04-10 (SPIRAL N=7-9).
- **db/redis.py:** Deleted (was no-op stub)
- **core/redis_presence.py:** Deleted (replaced by core/presence.py)
- **requirements.txt:** redis>=5.2.0 removed
- **18 source files + 7 test files + 6 docs + CLAUDE.md:** All Redis references replaced
- **Architecture:** Supabase (PostgreSQL + Realtime) + Python in-memory only
- **Presence:** app.core.presence (in-memory dict, O(1))
- **Broadcasting:** Supabase Realtime (Trinity Redundancy channels)
- **Rate limiting:** slowapi with memory:// backend
- **Vote accumulation:** BordaAccumulator in Python memory (1M in 1.06s)
- **1044 tests pass, 0 failures**

**How to apply:** Never introduce Redis. Use Supabase or Python in-memory for all state.
