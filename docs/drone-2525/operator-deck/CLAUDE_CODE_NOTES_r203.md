# Claude Code notes — Drone-2525 operator deck r.203 (2026-10-12)

**Asks (operator 2026-10-12, on the LIVE r.202, verbatim):** "rounds mist be in magazine" (~03:50), then his reference picture without words
(~04:15, shot40: the two magazines at 10×, the counter at 30 with nineteen distinct bars inside the walls, over the grid — the gold shows
in the gaps — below the window; the cards at true size; his r0.178 crop at 3 — three red bars at the foot). shot40 is the r.200 preview —
this session's render of the magazine drawn from his r0.178 picture — which he sent back as his reference: his choice, the session's render. Then his sign-off (~10:25): "off to work; approve
all your own decisions; document changes" — the authority under which shot40 is chosen as the master over his r0.178 photo (shot30/33).

## What he saw, what it was
r.202 cut the counter's fill from his r0.178 phone photo at 29 (shot30): twenty-eight thin lines from just under the body's top line, running
through the window. At the card's size (18×48 CSS) that is a hatch; on the phone it reads as a solid green block over the window — not rounds
in a magazine. A first draft of r.203 painted the frame over the fill (`z-index`); the Spiral round refused it with a pixel diff: the two rasters
never overlap where both are opaque, so the change moved at most 33/255 on 0.27 % of the box at 30 and nothing at 10 or 3 — he would have said
it again. The picture he sent is the master. A second cut took the counter's frame from shot40's counter, where his bars cover the grid: the
frame raster carried holes and the empty body showed a dotted grid at every QUAL count (the round caught it); the frame is now the uncovered
magazine of the same drawing.

## The fix — the class
**Invariant:** the counter's rounds are his reference's bars — distinct, inside the walls, over the grid, below the window — one bar per round
(the lowest r of his nineteen; nineteen to thirty is the full picture); the frame is the uncovered magazine (walls, window, the full grid)
under the bars; the RELOAD ink and the counter's frame and fill are rasters cut from shot40, pinned, never redrawn; the cards, the light and
the box of r.202 unchanged.
- `docs/drone-2525/magazine/cut-magazine.py` cuts shot40 (2000×1818): RELOAD at x 81–359 · y 93–818 and the counter at x 506–785 · y 93–818
  (279–280×726 at 10×) → the same five 72×192 rasters (2.8–6.6 KB): the RELOAD ink in cyan; the counter's frame = the same uncovered drawing
  recoloured to his gold; the fill from the counter's box; `BARS.json` written by the cut (the nineteen bars' tops and the foot → `MAG_BAR_TOPS`
  32.0 … 93.5 %, `MAG_FILL_TOP` 32.0 %, `MAG_FILL_BOTTOM` 96.4 %); all six pinned in `MAGAZINE.sha256`. The 280×726 box is fitted to 72×192
  (0.386 → 0.375, a 3 % squeeze, invisible at 18 px; the r.202 cut carried 1.4 %). r.202's cut is superseded in place: its bytes live at the
  r.202 artefact commit `ab65de4` (`HASHES_r202` no longer checks out for the seven magazine lines, as r.198's did not after r.199).
- `hudMag` clips the fill to the top of the (19 − r)-th bar: 3 rounds → three bars at the foot (86.7 %), 12 → twelve (56.0 %), 19 and more →
  the full picture (32.0 %); the same in a 10-round QUAL magazine as in a 30. The fill stays painted over the frame (the r.202 markup order):
  the bars cover the grid and the gold shows in the gaps, as in his drawing.
- Nothing else moves: the cards, the light, the stance box, the colour rule (green ≥ 20 · amber 6–19 · red ≤ 5) are r.202's.

## Gates
- `ROUNDS_ARE_INSIDE_THE_MAGAZINE` (new, deferred, the PIXELS): the frame, fill and RELOAD rasters decoded to a canvas — every opaque fill row
  lies between the frame's walls, nineteen distinct bars with a gap between each, the band from 32 % to 96 % of the body, below the window,
  the frame's grid whole (its interior rows at least 95 % of the RELOAD ink's); red on the r.202 bytes (22 bars from 10.9 %) and red on the
  second cut (the frame with holes: the row reads about a third of the grid rows — 40 of 105 on a frame rebuilt from the covered counter).
- `BARS_OVER_THE_GRID` (new): the fill painted over the frame — the fill after the frame in the markup, nothing raising the frame — absolute
  siblings, one 18×48 box.
- `MAGAZINE_KEEPS_ITS_FRAME` re-stated at his bars; `MAGAZINE_IS_HIS_DRAWING`, `MAG_ROW_ONE_LINE`, `LIGHT_WORDS_FIT_ONE_WIDTH` unchanged, green.
- The patcher carries the six sha256 of the cut as literals, so a replay over other bytes refuses; its boot-QA row ignores a run it no
  longer owns. Boot QA 225/226 at 390 and 428 portrait and 844 landscape (SYNC_DIRECT the one red); at 360 wide 224/226 — FIFTY_AT_THE_EDGES
  is red there, as on r.201/r.202 (outside CI's viewports; on the backlog).
- `tests/magazine-rasters.test.mjs`: shot40 in the ask's sidecar, the cut script pinned, the five rasters pinned and embedded byte-equal, the
  six-line `MAGAZINE.sha256` true file by file, the deck's `MAG_BAR_TOPS` / `MAG_FILL_TOP` / `MAG_FILL_BOTTOM` / `MAG_BARS` equal to `BARS.json`,
  the clip law and the paint order in the served bytes. `tests/drone-playable.test.mjs`: the r.203 line. `CLAUDE.md`'s HUD-row rule records
  shot40 as the magazines' master under his sign-off.
- Measured on the built bytes before the push: boot QA 225/226 in both orientations (SYNC_DIRECT the one red); the counter at 30/10/3 at 428
  beside the LIVE r.202 (`r203-before-after.png`, this session's record) — distinct bars below the window, ten amber, three red at the foot.

## Said plainly
- From nineteen rounds up the picture is full: 30, 29 … 19 look the same; the first eleven shots of a 30-round magazine move the number only
  (his picture has nineteen bars under a 30; a decision taken on his sign-off, one line to change if he wants thirty).
- RELOAD changed too: both cards are shot40's upright drawing with the feed tab and the foot, in place of the r0.178 photo's tilted outline.
- The grid lines of his 10× drawing are hairlines at the card's size; the walls and the bars are what read. The counter's frame and the RELOAD
  ink are one drawing in two colours — shot40's.
- The light's word is 6.5 px in a 56-px box; legible enough on the phone is his call (the cold light beside shot29 is on this session's record).

## Owed, by his ask
- r.204 — his 04:00–04:08 words: "I should be able to target all, then come back and approve all, then fire all" · "buttons must change to step
  we are on" (the lit button and the strip follow the mark under the bullseye; a caption never covers a control; shot41/42).
- Then the twelve Masters' QUAL 40 AAR (B1 the frozen fall at the window's end; H1 the 30-round first magazine from the deferred self-check;
  H2 the bare lane post; H3 the rest toast; N1 a toast's lifetime), then R-CORE in the shared format.
- His call: the reading of "dont say lane 21" (the intro button, done in r.196 — or the LANE 21 strip on the QUAL screens).

Artefact commit `4adfe70` · deck sha256 `00661e043b0d6a5e1147960389ec8e4736f07f3a6634a1b5d84cc138e3372a5c`.
