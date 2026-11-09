# Cube 9 / Cube 8 — Pay to View metrics (append-only)

Covers **CRS-39** Pay to View (Detail 1/2/3 via `view_entitlement`). Each live check must include a **leak probe**: unpaid caller must not receive locked details (`summary_333` / Original / expert pager).
Never edit or delete past rows; append only.

| CST time | CRS | check | merge SHA | Cloudflare version | N | latency_ms | pass/fail | leak_probe | notes |
|---|---|---|---|---|---|---|---|---|---|
| 2026-11-09 15:58:36 CST | CRS-39.02 | leak_probe_unpaid_themes_333 | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | n/a | fail | blocked | Live API container down (DB TimeoutError); leak probe not executable until /api/v1/health returns 200 |
| 2026-11-09 16:02:24 CST | CRS-39.02 | leak_probe_unpaid_themes_333 | 0534b2f9772aa160cb3f4367dca0908648c2ccbd | 0dc86b67-f3cb-4b39-938d-fa25b550810c | 1 | 740 | pass | pass | anon GET /themes on cnceUhx3: HTTP 200, no non-null summary_333 (leak_333=false) |
