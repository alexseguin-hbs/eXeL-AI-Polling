# Cube 7 — Ranking: live check metrics

Append-only. Add new rows at the bottom. Never edit or delete past rows.
Every row is a **SIMULATED** session (scripted voters, no real people). Machine-readable copy: [cube7-ranking.json](cube7-ranking.json).

Requirements covered: CRS-11 / CRS-37.01 (top-3 ballot, 3/2/1 points), CRS-22.04 (moderator final decision with reason), spectator group ranking.

Latency = time from a vote's HTTP response to the first live `ranking_complete` broadcast that includes that vote, measured on one clock.

| Run | Time (CST) | Label | Merge SHA (served main) | Cloudflare version (instance) | Participants / votes | Live tally latency p50 / p95 | Matches hand count | Checks |
|---|---|---|---|---|---|---|---|---|
| cube7-live-001 | 2026-11-09 15:41–15:42 CST | SIMULATED | ae9975dcb (PR #35); served main 46efc6b91 | 9a798de6 (api-v1t) | 5 + 1 spectator / 5 | not measured | yes (9/9 rows) | 21/21 |
| cube7-live-002 | 2026-11-09 16:05–16:07 CST | SIMULATED | ae9975dcb (PR #35); served main 340a9a8e3 | 3a35ad5f-0888-44f4-a491-89ae23ef792a (api-v1w) | 5 + 1 spectator / 5 | 3992 ms / 4999 ms | yes (9/9 rows) | 21/21 |

Notes: cube7-live-002 has only 5 samples, so p95 is the largest sample. One sample (403 ms) was fast because the next broadcast was already on its way.
