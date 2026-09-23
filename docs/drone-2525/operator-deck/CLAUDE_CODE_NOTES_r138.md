# CLAUDE_CODE_NOTES r.138 — true-scale silhouettes, justified labels, the zoom law, magazine + reload, full screen (2026-09-23)

HEAD `drone-2525_r.138.html` · sha256 in `HASHES_r138.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.137 by `patches/r137_to_r138.py` (36 asserted exact-anchor edits; a miss refuses).
Ask: `docs/asks/2026-09-23_labels_scale_zoom_reload_fullscreen.md` (verbatim, hashed, two DVIDS photographs beside it).

## What a player meets differently in r.138
1. **Targets are small, like the photographs.** Every silhouette is drawn at its real size (F 0.495 × 0.508 m, E 0.495 × 1.016 m).
   A 300 m E is under 2 px tall at 1×; the 3 mrad pip floor is what keeps it hittable — zoom in to see it.
2. **Labels never overlap.** Left targets' labels sit to the left of the plate (right-justified), right targets' to the right, centre
   targets above; labels on the same side stack.
3. **Zoom.** Pinch (or the mouse wheel) to 3× on the turret in QUAL · 40, 30× in training, 30× on every drone, aircraft, robot or boat.
   Entering QUAL caps the optic at 3×. The top line reads `ZOOM 2.4×/3×`.
4. **Magazine.** QUAL · 40 is four magazines of ten; the tower's phase rest loads the next one on the record. Training and every craft
   carry 30. `RELOAD` sits at the top of the picture beside `MAG 2/4 · 7 RDS`; an empty magazine refuses FIRE ("EMPTY · PRESS RELOAD")
   and writes no shot; a refusal never costs a round; RESET refills.
5. **FULL.** One button (top bar or the top line) hides the two bars, the strip and the dock; the sticks, TARGET · APPROVE · FIRE, RELOAD
   and the counter stay; the score moves into the top line; EXIT brings the words back. Remembered between visits.
6. **Rotation no longer drops the turret layout** — `layout()` toggled classes instead of rewriting them (a class fix that r.138 needed
   for FULL and that had been silently wrong for the turret stick since r.048).

## Invariants (in the deck)
A silhouette is drawn at its real size and judged on it; a label never sits on another label; zoom is an optic, never authority; a shot
needs a round and a refusal never costs one; full screen hides words, never controls.

## Gates
In-file QA **132 rows**, headless **131/132** (`SYNC_DIRECT` by design). New: `SILHOUETTES_TRUE_SCALE`, `LABELS_DO_NOT_OVERLAP`, `ZOOM_LAW`,
`TRAINING_MAG_30`, `PHASE_CHANGES_MAG`, `EMPTY_MAG_REFUSES`, `RELOAD_ON_RECORD`, `FULL_SCREEN_KEEPS_CONTROLS`; `RANGE_HIT_50_OFF10` →
`RANGE_HIT_50_OFF2`. Repo: `range-2525` (dimensions · zoom law · magazine), `drone-playable`, manifest 132, `deck-consistency`,
`drone-revisions`, `drone-deck-qa`, `drone-team-e2e` 9/9, seat replays qual 11/11 (a phase reload inside), AI FIRE 3/3.

## Corrections on the record
r.130's silhouette sizes (2.20 × 1.15 m at 50 m, 0.34 × 0.78 m at 300 m) were sized for visibility, not truth; superseded.

## Owed (honest)
The F-type sheet dimension read from a source; iOS Safari's fullscreen and a thumb on RELOAD at 320 px (hardware); everything r.137 owed.
