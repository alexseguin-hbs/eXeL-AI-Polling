# CLAUDE_CODE_NOTES r.139 — landscape and portrait, like Mission Planning (2026-09-23)

HEAD `drone-2525_r.139.html` · sha256 in `HASHES_r139.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.138 by `patches/r138_to_r139.py` (10 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_landscape_portrait.md`.

## What a player meets differently in r.139
1. **Turn the phone sideways and it is still a phone.** No side panel steals a third of the picture; the HEAD stick and the three pills
   stay at the bottom edge; DATA opens as an overlay as it does in portrait.
2. **FULL is the whole screen, in both orientations.** In r.138 the picture stopped at about a third of the height with black below —
   the grid had slid the stage into the wrong row. Corrected on the record.
3. **Portrait stacks, landscape sits side by side.** The magazine line and the strip are under each other in portrait and share one row in
   landscape, never on top of each other.
4. **Rotate mid-round** and the picture, the sticks and the top line follow within a third of a second (iOS reports the old size first).

## Invariants (in the deck)
A phone is a phone in both orientations. FULL fills the whole screen in every orientation and on every device class. Portrait stacks the top
lines; landscape sets them side by side. Rotation never loses a control or a class.

## Gates
In-file QA **136 rows**, **135/136 in portrait and in landscape** (`SYNC_DIRECT` by design). New: `DEVICE_CLASS_BY_SHORT_SIDE`,
`FULL_FILLS_THE_STAGE` (the stage's rect equals the app's — the measurement r.138 lacked), `FULL_BEATS_DESK`, `TOP_LINES_NEVER_OVERLAP`.
Repo: `scripts/drone-deck-qa.mjs` runs the boot QA at 390 × 844 AND 844 × 390 on every deploy (34 checks, the four rows measured in each);
`drone-playable` 68, `range-2525` 100, `drone-team-e2e` 9/9. Measured on the candidate: FULL = 390 × 844 · 844 × 390 · 1180 × 820; rotated in
place each way, the stage follows.

## Corrections on the record
r.138's FULL claim ("the picture fills the screen") was false in both orientations; its QA row measured only the controls.

## Owed (honest)
A real iPhone rotation and Safari's fullscreen (hardware); a tablet in portrait (820 wide) still counts as a desk by the rule; everything
r.138 owed.
