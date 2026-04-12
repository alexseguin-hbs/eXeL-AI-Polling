---
name: Cube 1 — Live test confirmed operational
description: Cube 1 session sync confirmed working in live production with 13 participants
type: project
---

Cube 1 is fully operational as of 2026-03-27.

**Live test**: 12 AI agents (Ascended Masters) + 1 human on session J5GZVXQK
- Auto-advance: ~70ms from waiting room to polling input on Start Polling
- Participant count: syncing on host dashboard
- All 13 devices advanced instantly

**What fixed it**: Supabase project was paused (free tier). User restored it. The 4-layer sync stack then worked immediately.

**Sync stack (all 4 layers confirmed active)**:
- Layer 1: Supabase Broadcast (WebSocket, ~70ms measured)
- Layer 2: Supabase Presence (persists state for late joiners)
- Layer 3: CF KV poll (requires RESPONSES KV binding in CF Pages)
- Layer 4: Supabase DB poll (requires session_status table — SQL in supabase/session_status.sql)

**Supabase project**: ppgfjplawtlrfqpnszyb
**Note**: Free tier pauses after 7 days inactivity. Must restore at app.supabase.com if paused again.

**Why:** Keeps Cube 1 as the foundation for all downstream cubes (2-10).
**How to apply:** If cross-device sync breaks again, first check Supabase project status before debugging code.
