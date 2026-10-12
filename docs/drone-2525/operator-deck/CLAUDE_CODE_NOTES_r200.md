# Claude Code notes · r.200 (2026-10-12) — the magazine drawn as his picture

**Asks (operator 2026-10-12, verbatim):** "and your magazine proportions still are notnfixed. counter needs to be centered" · "I even have correct
zoomed version ton-use to copy exactly" (shots 17/18) · "fix fucking magazine proportions" · "here are correct versions ton-use as reference for
r. 178 layout of magazine" (shots 23–27) · "also here is original magazine, ya need to flip around y axis to match correct image. Also see right
proportion of range (as Grok messed up original layout)." (shot15 the PMAG photograph, shot16) · "why dont the magazines still not look like
image 3?" (image 3 = his r0.178 picture, shot1).

**Invariant (the patch header):** both cards draw ONE outline measured from his picture into the 48×96 viewBox, rendered in the 26×52 box (1:2,
never stretched) so the ink is ≈ 17×47 CSS as in his picture; the count magazine lights its 19 round lines inside that body; the RELOAD word's
spacing brings the card to his width.

## Cause
The r0.178 code (`af6f65e0`) draws a three-dimensional box in perspective — a trapezoid `M16 22l18-4 4 66-22 4z`, a side plane, a lip — at 36×82
in an 86×112 card. His r0.178 picture (shot1, a 428-px phone at 3×) draws a FLAT magazine: the cyan ink spans 51×137 device px = 17×46 CSS
(ratio 0.37) in a 57×71 card, the count magazine the same in gold, centred. The picture never came from that code (the deploy that produced it
differed from the commit — the plan noted the CSS mismatch on 2026-10-11). r.196 restored the code's drawing at 26×52, so the ink stayed a narrow
box of 12×38 CSS: "proportions still not fixed". The picture is the master (law 5); the code is measured to it, not remembered.

## What a player meets
- RELOAD and the count card show the magazine of his picture: the neck with the feed lips, the step to the body's top-left corner, the right
  shoulder, the body tapering to the right with the bend past two thirds, the sloped floor; a window near the top; a grid of four rows and two
  columns on the lower half. The count magazine lights its round lines inside that body, green > 20, amber 6–20, red ≤ 5, as before.
- The RELOAD card is ≈ 59 px wide (his 57); the count card unchanged; the row, the centred count and the 1:2 box unchanged (`MAG_ROW_ONE_LINE`).

## The drawing (measured, not drawn by eye)
- From `docs/asks/img/2026.10.11_18.56..53_drone2525_shot1.png`: the cyan ink of the RELOAD drawing (x 84–134, y 654–790 device px), row by row —
  the left and right edge of every row, the rows with ≥ 40 % interior fill (the grid lines at y 38.3 · 54.4 · 69.8 · 81.5 of 96), the window (a
  closed ring at x 22.4–28.2, y 16.2–21.3), the neck (x 11.5–26.2 at y 4.6–7.9), the sloped floor (from x 39.1 at y 86.4 to x 16.2 at y 91.2).
- `BODY = M11.5 4.6 H26.2 L29.5 7.9 30.7 11.7 32 24 32.7 37 34 46 35.2 58 36.5 66 38.5 73 39.7 81 39.1 86.4 16.2 91.2 15.3 89 7.6 11.7 V9.8 L11.5 7.9 Z`
  (ink x 7.6–39.7, y 4.6–91.2 → 32.1×86.6, ratio 0.37); the lips line `M12.2 5.3 L29 7.4`; the window rect; the grid
  `M9.7 38.3H31.9 M11.2 54.4H34.5 M12.7 69.8H37.5 M14 81.5H38.8 M17.1 38.3L21.8 89.9 M24.5 38.3L30.7 88.2` (the columns follow the taper).
- The 19 round lines: y 33 … 87 every 3, each from the left wall + 1.4 to the right wall − 1.4 at that y (`inner()` interpolated on the outline).
- The PMAG photograph (shot15) was traced and mirrored first (`cut` in the scratch work); his own drawing was the closer reference and is the
  one copied — his word: "copy exactly".

## Gates
- Deck QA `MAGAZINE_IS_HIS_DRAWING`: both cards one outline (`d` equal); the outline's bbox 32.1×86.6 of 48×96, ratio 0.37; the ink in CSS px
  within 1.5/2 px of 17.4×46.9 in a 26×52 box; the grid's `d` has four H and two L; a window rect in both; the 19 round lines' boxes inside the
  outline's box. `MAG_ROW_ONE_LINE` unchanged (both orientations).
- `drone-playable`: the outline twice, the perspective box gone, the window twice, 19 round lines, the word's spacing, the row present.
- The record gates; `range-2525`; `drone-team-e2e`; `tsc` clean.

## Corrections from the AsM review of r.199 (it returned after the push; its findings ship here)
- Sofia (BLOCKING): the 83-px light sat on the strip's line under the row from phase 3 (a two-digit score). The light is now the row's height,
  75 px, like the magazines and the box (`height:75px`, lamps 12 px with 4-px gaps, the word a 10-px line, the clock 13): one bottom edge.
- Thor (BLOCKING): "NEXT 10 S" wrapped in the 72-px light and the light grew for a second at every phase rest. `#startTime` is
  `letter-spacing:0; white-space:nowrap` (59 px of 64); QA row `LIGHT_WORDS_FIT_ONE_WIDTH` sets every word the light can show and measures 72×75
  with no wrap. Under 368 px the light is 64 wide and the box moves with it so the count stays clear (the bound Thor named, now covered).
- Enlil (BLOCKING): the pose-rasters gate pins the five figures' and the cut script's sha256 — a redrawn figure cannot pass as his.
- Notes: the two code comments that still spoke the old position words say his; the masthead edit in the patch refuses on a wrong count;
  `POSE_CARD_IS_A_ROUNDED_SQUARE_OF_THE_MAGAZINE_HEIGHT` also holds the light's height; the r.199 release note says that "stop light indicator on
  targets" built nothing new (the targets have carried amber/red since r.196) and that the one-width light shows in every range mode.

## Open (defaults taken, on the record)
- The PMAG photograph's mirror (his "flip around y axis") is honoured by copying his drawing, whose lips sit at the top-left as the mirrored
  photograph's do; the photograph itself is not traced into the deck.

## Owed
- The label clutter on marked targets (shots 21/22) · Drone-2525 on the Vision-2525 worlds page (shot20) · R-CORE in the shared format
  (shot19; the rehearsed port) → r.201+.

Artefact commit `bfab534` · deck sha256 `ff67ecfc0daf0cccb1978ab4256f33720be2cac5c713b8566fee6d05fe8ffa1d`.
