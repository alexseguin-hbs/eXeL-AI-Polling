---
name: Donation-gated content tiers
description: Divinity Guide and export summaries locked behind donation tiers — $9.99 for 333-word, $11.11 for originals
type: project
originSessionId: 3f1f26a1-b8ce-43e7-bf34-2741756f294e
---
Content gating rules for exports and Divinity Guide:

**Export Summary Tiers (Cube 9):**
- FREE: 33-word summary + 111-word summary (always available)
- $9.99 donation: Unlocks 333-word summary
- $11.11+ donation: Unlocks original input text + ALL summary tiers (33/111/333)

**Divinity Guide Gating:**
- Index pages: LOCKED until user donates (any amount ≥ $0.50)
- Gated content (prelude, locked symbols): Requires donation
- Locked symbols in UI require donations to view

**HI Token Rewards:**
- All donations award 웃 tokens: amount / 7.25 per hour
- Format: always #.### (3 decimal places, round to this)
- Example: $11.11 / 7.25 = 1.532 웃

**Why:** Monetization model — results never gated by payment, but premium detail levels require contribution. Incentivizes participation through token rewards.

**How to apply:** When building export endpoints (Cube 9) and Divinity Guide access control, enforce these tiers. Stripe payment completion unlocks content.
