# eXeL AI Polling — Sales Brief (DRAFT / PAUSED 2026-11-09 America/New_York)

**Status: PAUSED** — user narrowed focus to revenue steps + 3-second theming. Resume from fleet/status/sales-demo.md.

Every claim below is verified or labeled **planned**. No invented metrics, customers, or rates.

## What it does (verified)
- Live group polling with AI Theme01 (Supporting Comments / Risk & Concerns / Neutral Comments) and Theme02 9→6→3, then live ranking. Code + CRS matrix: repo frontend/lib/crs-matrix-data.ts; live FE https://exel-ai-polling.explore-096.workers.dev/ (HTTP 200); live API https://exel-ai-polling-api.explore-096.workers.dev/api/v1/health → `{"status":"ok","version":"0.1.0"}`.
- Pricing tiers Free (≤19) / Moderator Paid / Cost Split; quote = tracked cost × **1.5** + Stripe fee, floor **$11.11**. Evidence: fleet/sales/live-poll-quote-*.json; poll_pricing.py.
- Simulation isolation: `session_type=simulation` + `/sessions/{id}/sim/*` refuse real sessions (403). sim_seed.py.

## Demo (WIP — not deployed)
- Branch `feat/sales-demo-poll`: public `/demo` page + `frontend/lib/sales-demo-fixture.json` (60 CSV, SIMULATED keyword themes, LiveRankingPanel static payload). **Not merged / not on workers.dev yet.**
- Intended URL after merge+FE deploy: `https://exel-ai-polling.explore-096.workers.dev/demo` (planned).
- Easter-egg `/sim` (DEMO2026) exists but is gated — not the buyer share link.

## Differentiators vs Mentimeter
| Differentiator | Status | Evidence |
|---|---|---|
| Live theming + prioritization toward 1M | Partial / planned scale | Architecture + sim paths; 1M not live-proven |
| Theme02 &lt;3s | **NOT YET** | Live API measured **24624 ms** (fleet/voting-live/theme02-latency-w3-20261109.md). Fast-pipeline bench N=60 best **8313 ms** to final themes (fleet/xai-speed/evidence/bench-fast-n60-153342.json). Target 3000 ms — xAI worker owns. |
| Expert review | **planned** | expert-paytoview worker CRS-38; not shipped |
| Moderator decision + transparency when group #1 not chosen | Shipped on main (PR #35) | voting-gaps status; CRS-22.04 |
| Voice-to-text | **planned** | voice worker lane |
| Public R-CORE revision history | Partial | rcore pages/ledgers exist; sales demo CTA points at fleet brief |

## Pricing options (live)
See fleet/sales/PRICING_MISMATCHES.md. Stripe products live; Checkout dynamic. Cost Split card says 50/50 but small quotes often charge creator 100% at floor (participant_share=0).

## Honest not-yet
- Theme02 &lt;3s
- Public `/demo` on production FE
- Expert Opinion / Pay-to-View details (CRS-38/39.01)
- Voice-to-text sales-ready
- Cost Split UI caveat for floor-dominated quotes
- Full SALES_BRIEF polish + screenshots

## PRs / SHAs (this worker)
- Worktree `/workspace/w-sales` branch `feat/sales-demo-poll` — WIP push pending at pause time; base was origin/main `46efc6b9` (may have moved).
