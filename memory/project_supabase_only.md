---
name: Supabase-only architecture
description: PostgreSQL (Supabase) + Python in-memory + Supabase Realtime — zero external caches or brokers
type: project
originSessionId: d359f04d-a822-4eff-986a-f830612ae051
---
**Architecture:** Supabase/PostgreSQL + Python in-memory only.
- PostgreSQL (Supabase) — all relational data (sessions, responses, rankings, tokens, themes)
- Supabase Realtime — broadcasting, live feed delivery, presence sync
- Python in-memory — presence tracking, rate limiting, BordaAccumulator, session semaphores
- No MongoDB, no external cache, no message broker

**How to apply:** Never introduce external dependencies. Use Supabase or Python in-memory for all state.
