# CLAUDE_CODE_NOTES r.144 — the targets on each of the 42 lanes (2026-09-23)

HEAD `drone-2525_r.144.html` · sha256 in `HASHES_r144.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.143 by `patches/r143_to_r144.py` (5 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_targets_on_all_42_lanes.md`.

## What a player meets differently in r.144
1. **The lanes beside you show all their targets**, dim, the way a real range does — not just their 50 m plates. Yours are bright.
2. **Every one of the 42 lanes has the same eleven** (50 L/R, 100 L/C/R, 150 L/R, 200 L/R, 250, 300) — pick any lane and the range is
   the same. This was already true as data; now it is gated, in the data and in the picture.
3. Marking and firing still belong to your lane; a mark on a neighbour's plate is refused, as before.

## Gates
In-file QA **148 rows**, **147/148 in portrait and landscape**. New: `EVERY_LANE_HAS_THE_TARGETS`, `NEIGHBOUR_LANES_DRAWN`. Repo:
`range-2525` 110 (lifts `LANES` and `PLATES`), `drone-playable` 85, `drone-deck-qa` 34, `drone-team-e2e` 9/9.

## Owed (honest)
Lanes beyond ±1 are not drawn (the MoT 1.1 segment budget); on a real range the far lanes are visible. Everything r.143 owed.
