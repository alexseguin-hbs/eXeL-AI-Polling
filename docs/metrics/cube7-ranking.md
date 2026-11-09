# Cube 7 — Ranking metrics (append-only)

Covers **CRS-36** Round 1 auto-select and **CRS-38** Expert Opinion live checks.
Never edit or delete past rows; append only.

| CST time | CRS | check | merge SHA | Cloudflare version | N | latency_ms | pass/fail | notes |
|---|---|---|---|---|---|---|---|---|
| 2026-11-09 15:48:15 CST | CRS-36 | merge_landed_pr39 | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | (FE Workers Builds dadf42b2 green; API not yet this SHA) | 1 | n/a | pass | PR #39 merged; migration 059 in tree |
| 2026-11-09 15:49:06 CST | CRS-36 | migration_059_columns_live | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | n/a (Supabase ppgfjplawtlrfqpnszyb) | 3 | n/a | pass | columns auto_select_percent/n/theme_ids present via information_schema |
| 2026-11-09 15:56:34 CST | CRS-36 | api_deploy_api-v1u | c18942dac918a91cecb9e988419f6b0ab28ddf37 | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | 14729 | pass | wrangler deploy; bundle live af0d6490…; auto_select.py in bundle; tip contains PR #39 |
| 2026-11-09 15:58:36 CST | CRS-36 | live_api_health+/rankings/auto-select | c18942dac918a91cecb9e988419f6b0ab28ddf37 | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | 86157 | fail | container APP_EXITED: asyncpg TimeoutError connecting DATABASE_URL at uvicorn startup; /api/v1/health → 404 diag server |
| 2026-11-09 16:01:50 CST | CRS-36 | live_api_health | c18942dac918a91cecb9e988419f6b0ab28ddf37 | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | 30923 | pass | /api/v1/health ok after container recovery |
| 2026-11-09 16:02:23 CST | CRS-36 | create_session_auto_select_config | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | 1421 | pass | session cnceUhx3 auto_select_percent=40 auto_select_n=4 persisted |
| 2026-11-09 16:02:23 CST | CRS-36 | post_rankings_auto_select | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | 1551 | pass | 200 source=theme_order (no Theme02 yet); replay_token set; evidence fleet/status/crs36-live-spotcheck.json |
| 2026-11-09 16:02:25 CST | CRS-36 | get_rankings_auto_select_participant | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | n/a | pass | follow-up join+GET (see spotcheck json) |
