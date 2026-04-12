---
name: 8-tier monetization ladder (finalized 2026-04-11)
description: Complete donation-gated content tiers with 🔒 locked cells strategy — FREE through $12.12 Talent Profiles
type: project
originSessionId: 3f1f26a1-b8ce-43e7-bf34-2741756f294e
---
**Finalized 8-Tier Donation Ladder (cumulative):**

| Tier | Price | 웃 Tokens | Content Unlocked | Locked Symbol |
|------|:-----:|:---------:|-----------------|:---:|
| FREE | $0 | 0 | 33+111 response summaries, 33-word theme descriptions, theme names | — |
| Theme Context | $1.11 | 0.153 | + 111-word theme summaries | 🔒 |
| Theme Deep Dive | $3.33 | 0.459 | + 333-word theme summaries (3 paragraphs) | 🔒 |
| Precision | $4.44 | 0.612 | + Theme Confidence Scores (%) | 🔒 |
| Competitive Intel | $7.77 | 1.072 | + CQS Individual Scores | 🔒 |
| Detailed Summary | $9.99 | 1.378 | + 333-word response summaries | 🔒 |
| Full Intelligence | $11.11 | 1.532 | + Original verbatim responses | 🔒 |
| Talent Profile | $12.12 | 1.672 | + Cross-session talent data (honors 12 Masters) | 🔒 |

**Key Design Decisions:**
- 🔒 icon in locked cells (not hidden columns) — users see perceived value they're missing
- All 19 columns always present in CSV downloads
- Results delivered FIRST, donation asked AFTER (trust-first model)
- Moderator/Admin/Lead always get TIER_TALENT (full access)

**Why:** User confirmed: "users pay for perceived value. If they know they did not get info, they may be inclined to download next time and donate more."

**How to apply:** _apply_tier_filter() in Cube 9 service replaces locked cell values with "🔒". Frontend mot-export-orchestrator also applies same gating.
