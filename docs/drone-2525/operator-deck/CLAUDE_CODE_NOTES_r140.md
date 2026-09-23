# CLAUDE_CODE_NOTES r.140 — the dark green plates and the 25 m Alt-C sheet (2026-09-23)

HEAD `drone-2525_r.140.html` · sha256 in `HASHES_r140.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.139 by `patches/r139_to_r140.py` (26 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_targets_bigger_altc_sheet.md`.

## What a player meets differently in r.140
1. **The wide plates are the real ones.** Every F-type silhouette (50 m and the three at 100 m) is the dark green shouldered plate,
   26 × 21 in. r.138 had drawn it at 19.5 × 20 — the operator's "a little bigger".
2. **TARGETS: POP-UPS · 50–300 M or ALT-C SHEET · 25 M.** The sheet is the 17 × 22 in paper target at 25 m with ten silhouettes scaled so
   each is exactly as big on screen as the real target at its range. Zoom in and it reads like the printed sheet.
3. **Paper never falls.** A hit leaves a hole where the pip sat; the silhouette stays; the box clears. TRAINING · DOWN scores a hit
   silhouette out (dim). QUAL · 40 runs the same 18-engagement program on the sheet: the engaged silhouettes light, the rest are dim.
4. **The 50 L is not on the sheet** (as printed) and never stands as a phantom at 50 m.

## Invariants (in the deck)
A silhouette is drawn at its real size; on the sheet every plate's place and size come from one geometry (`qWorld()`, `plateDims()`),
scaled by 25/range so the angle is the real target's; paper never falls — a hit is a hole; the fire gate is unchanged.

## Gates
In-file QA **140 rows**, **139/140 in portrait and landscape**. New: `SHEET_SCALES_TO_ANGLE` (measured against the pop-ups, worst 0.0 %),
`SHEET_HIT_IS_A_HOLE`, `SHEET_DOWN_SCORES_OUT`, `SHEET_QUAL_ENGAGES`. Repo: `range-2525` 103 (the sheet's ten silhouettes fit inside 17 × 22 in;
F 26 × 21), `drone-playable` 73, `drone-deck-qa` 34 (both orientations), `drone-team-e2e` 9/9, qual seat 6/6.

## Corrections on the record
r.138's F-type dimension (19.5 × 20 in) was declared from the E-type's family and was wrong; sourced now.

## Owed (honest)
The sheet's height above the lane (1.1 m) is declared; a peer's hole lands at the centre of mass, not the shooter's pip; the Alt-C
record-fire timings (the real course fires the sheet from three positions with its own times) are not a separate mode — the sheet runs
the IWQ program; everything r.139 owed.
