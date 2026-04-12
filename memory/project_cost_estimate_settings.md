---
name: Cost estimate in Settings
description: Settings panel should display estimated AI cost for a 1000-user poll (3x 333-word responses each)
type: project
---

Settings panel must show estimated cost for a 1000-user poll assuming 3 responses per person at 333 words each.

**Why:** Moderators need cost visibility before starting a session to make informed pricing tier decisions. Anchors donation amounts post-session.

**How to apply:** When building/updating the Settings or Moderator config UI, include a cost estimate calculator that shows per-provider pricing for the baseline scenario (1000 users × 3 responses × 333 words = ~1M words total). Should reflect actual API pricing per provider (OpenAI, Grok, Gemini, Claude).
