---
name: Theme summary cascade (333→111→33 words)
description: Level 2 theme summaries generated in cascade — 333 paid ($3.33), 111 paid ($1.11), 33 free. Samples response summaries, not raw data.
type: project
originSessionId: 3f1f26a1-b8ce-43e7-bf34-2741756f294e
---
**Theme-Level Summary Cascade (distinct from per-response summaries):**

These explain what a 2-3 word theme label MEANS at scale.

| Tier | Words | Cost | Input Source | Purpose |
|------|:-----:|:----:|-------------|---------|
| 333 | 3 paragraphs | $3.33 | Sampled 33-word response summaries from cluster | Deep understanding |
| 111 | 1 paragraph | $1.11 | Derived FROM the 333-word theme summary | Actionable summary |
| 33 | 1 sentence | FREE | Derived FROM the 111-word theme summary | Quick context |

**Scale approach (1M responses):**
- Do NOT re-read all responses. Sample K representative 33-word response summaries per cluster.
- Feed sampled summaries to AI → generate 333-word theme summary.
- Then compress: 333 → 111 → 33 (same AI cascade as responses, but at theme level).

**Level 2 themes:**
- Theme2_3: 3 clusters → 3 theme summaries
- Theme2_6: 6 clusters → 6 theme summaries
- Theme2_9: 9 clusters → 9 theme summaries

**Free downloads include:**
- 33-word response summaries (per response)
- 111-word response summaries (per response)
- 33-word THEME descriptions (per theme cluster) — NEW

**Why:** Users need to understand what a theme label like "Infrastructure Modernization" actually means in context. The 33-word free version hooks them; the 333-word paid version gives full insight.

**How to apply:** Add theme_summary_333, theme_summary_111, theme_summary_33 columns to Theme model. Generate during Phase B (post-clustering) by sampling response summaries. Gate 333/111 behind payment tiers.
