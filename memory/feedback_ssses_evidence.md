---
name: Evidence-based SSSES scoring
description: SSSES scores must always be evidence-based from code review, never inflated or aspirational
type: feedback
---

Always use evidence-based SSSES scoring. Never inflate scores or use aspirational numbers.

**Why:** User explicitly confirmed this after comparing an external (Grok) suggestion that rated Cubes 1-3 at 92/100 vs our audit-derived 57/100. The inflated score masked 5 compounding architectural gaps. Evidence-based scoring caught the real issues.

**How to apply:** Every SSSES pillar score must trace back to a specific code-level finding (a confirmed gap, a verified test, a measured latency). If a score cannot be justified by reading the code or test results, it is too high. When presenting scores, cite the evidence (e.g., "Stability 40 — `summary_33` never reaches live feed; no retry; Phase B unverified E2E").
