# Cube 7 — Ranking metrics (append-only)

Covers **CRS-36** Round 1 auto-select and **CRS-38** Expert Opinion live checks.
Never edit or delete past rows; append only.

| CST time | CRS | check | merge SHA | Cloudflare version | N | latency_ms | pass/fail | notes |
|---|---|---|---|---|---|---|---|---|
| 2026-11-09 15:48:15 CST | CRS-36 | merge_landed_pr39 | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | (FE Workers Builds dadf42b2 green; API not yet this SHA) | 1 | n/a | pass | PR #39 merged; migration 059 in tree |
| 2026-11-09 15:49:06 CST | CRS-36 | migration_059_columns_live | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | n/a (Supabase ppgfjplawtlrfqpnszyb) | 3 | n/a | pass | columns auto_select_percent/n/theme_ids present via information_schema |
| 2026-11-09 15:56:34 CST | CRS-36 | api_deploy_api-v1u | c18942dac918a91cecb9e988419f6b0ab28ddf37 | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | 14729 | pass | wrangler deploy; bundle live af0d6490…; auto_select.py in bundle; tip contains PR #39 |
| 2026-11-09 15:58:36 CST | CRS-36 | live_api_health+/rankings/auto-select | c18942dac918a91cecb9e988419f6b0ab28ddf37 | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | 86157 | fail | container APP_EXITED: asyncpg TimeoutError connecting DATABASE_URL at uvicorn startup; /api/v1/health → 404 diag server |
