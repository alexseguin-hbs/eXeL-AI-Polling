# CLAUDE_CODE_NOTES r.145 — lane markers at 100, 200 and 300 m (2026-09-23)

HEAD `drone-2525_r.145.html` · sha256 in `HASHES_r145.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.144 by `patches/r144_to_r145.py` (6 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_lane_markers.md` (photograph beside it).

## What a player meets differently in r.145
Numbered boards on posts stand at the edge of your lane at 100, 200 and 300 m, like the range in the photograph — yours bright, the lanes
beside you dim, each board carrying its lane number. The last lane has boards on both edges.

## Invariants (in the deck)
One `laneMarkers(lane)` for the painter, the HUD number and the QA; every lane has its three boards at its left edge at 100 / 200 / 300 m.

## Gates
In-file QA **149 rows**, **148/149 in portrait and landscape**. New: `LANE_MARKERS_100_200_300`. Repo: `range-2525` 111 (129 boards by number,
edge and range), `drone-playable` 87, `drone-deck-qa` 34, `drone-team-e2e` 9/9.

## Owed (honest)
Boards at the left edge only (the last lane both); post and board sizes declared from the photograph. Everything r.144 owed.
