# CLAUDE_CODE_NOTES r.141 — life-size at 12 inches, the two 50 m targets at the edges (2026-09-23)

HEAD `drone-2525_r.141.html` · sha256 in `HASHES_r141.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.140 by `patches/r140_to_r141.py` (11 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_eye_scale_12in_fifty_at_edges.md`.

## What a player meets differently in r.141
1. **The picture is life-size at 12 in.** Hold the phone a foot from your eye and a target is as big on the glass as it is in the world:
   a 50 m F is 24 px wide at 1×, a 300 m E 6 px. Before, the deck projected a 76° vertical field and everything was a third of the size.
2. **The 50 L and 50 R stand at the edges** of a portrait phone at 1× (15 px inside on a 390 px screen).
3. **The stick feels the same at every zoom** — its rate follows the picture's real half-angle.

## Invariants (in the deck)
One focal length: the eye distance in CSS px times the zoom. The half-angle is derived from the screen height, never typed. Every optic
site (projector, pip floor, stick rate, the QA's aim) reads it.

## Gates
In-file QA **142 rows**, **141/142 in portrait and landscape**. New: `EYE_SCALE_12_IN` (focal 1827.6 px; the 50 m F ≥ 12 px wide),
`FIFTY_AT_THE_EDGES` (portrait-conditional). Repo: `range-2525` 105 (lifts `EYE`, `focalPx`, `fovDeg`; proves the focal length, the two
half-angles, the edge geometry at 50 m), `drone-playable` 76, `drone-deck-qa` 34, `drone-team-e2e` 9/9.

## Corrections on the record
r.130–r.140 projected with a typed 38° half-angle; the targets were true-size in a field three times too wide. The operator's "targets are
small" was the field, and this edition fixes the class, not the plate sizes.

## Owed (honest)
152.3 px/in is the iPhone 12 Pro Max's; other phones are within a few percent and not yet read from the device. ±4.6 m is tuned to a
390–430 px portrait phone. Everything r.140 owed.
