---
name: Live feed confirmed working 2026-03-31
description: 100-user Spiral Test + live Supabase response streaming confirmed on deployed site
type: project
---

Confirmed 2026-03-31 ~12:18 PM CST:
- 100/100 Ascended Master responses streamed to moderator dashboard
- 12 waves, 11 languages, all visible in live feed
- 33-Word / Raw toggle working
- DEMO2026 session on deployed Cloudflare site

**Critical fix that made it work:**
1. Supabase schema mismatch: responses table uses `session_code` + `content` (not `session_id` + `raw_text`)
2. Spiral Test needed direct callback (same-tab, no network) instead of Supabase Broadcast
3. Dashboard postgres_changes filter aligned to `session_code=eq.{code}`

**3-path architecture:**
- Spiral Test: direct callback (0ms, same tab)
- Live user Path A: Supabase Broadcast (~50ms)
- Live user Path B: Supabase DB INSERT → postgres_changes (fallback)

**Why:** This is the $10M feature — live governance at scale.
