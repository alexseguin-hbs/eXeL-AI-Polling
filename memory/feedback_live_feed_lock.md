---
name: LIVE feed is locked — never revert
description: Live response streaming to moderator screen confirmed working 2026-03-31. This code path must NEVER be reverted or broken.
type: feedback
---

Live user input → moderator screen is THE most critical feature. Confirmed working 2026-03-31 on session XS5RRFTY with real human input + 45 Ascended Master responses across 11 languages.

**Why:** This is the $10M feature. Real users typing on phones/PCs seeing results appear live on the moderator dashboard is the core value proposition.

**How to apply:** 
- NEVER modify the 3 send paths (Broadcast, DB INSERT, CF KV) or 4 receive channels (Broadcast, postgres_changes, KV poll, HTTP poll) without running a full live test first.
- Any refactor of dashboard/page.tsx feedResponses, addResponse, addSpiralResponse, or Channel A-D listeners requires manual verification on deployed site before merge.
- The Channel D HTTP poll (2s interval) is the bulletproof fallback — it must ALWAYS remain active during polling status even if other channels work.
- Treat any change to session-view.tsx response submission or dashboard/page.tsx response reception as a P0 risk.
