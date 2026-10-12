# Claude Code notes · r.202 (2026-10-12) — the magazine row is his three pictures

**Asks (operator 2026-10-12, verbatim):** "These are exact image ton-use; create final raster and use exact proportions" (shots 29–31) · "height of
all magazines, standing position and stop light need to be same" · "grok made a mess ofninporportioned magazine images and Inneed toyoubyonuse
thisbinly. MAGAZINES on left is reload button; center is counter where green rounds indicate >= 20, amber is 6 -19, and red is 5 and less" ·
"we had right dimentions on r.178 and you are still getting magazine wrong" · "WHEN INFIVE YOU AND IMAGE FOLLOW EXACTLY!".

**Invariant (the patch header):** the RELOAD drawing and the count magazine's frame and fill are RASTERS cut from his pictures, never redrawn; the
cards keep his proportions (RELOAD 0.80, the count 0.56, the light 0.747 — his 0.731 plus the px TIME 12:34.5 needs) at the one row height (75 px) with the stance box; the ink sits in each
card where his picture puts it; the count's fill is clipped from the top by the rounds left and recoloured by his rule; the frame never changes.

## Cause
r.200 and r.201 drew the magazine as an SVG outline measured from his r0.178 picture; he sent zoomed crops of the two magazines and the light and
said to use the images themselves, at exact proportions. A drawing is a reading of his picture; a raster IS his picture. Nothing is drawn by hand
any more.

## Measured from his pictures (1284×2778, the card borders and the ink by colour)
| | card | ink | ink in the card |
|---|---|---|---|
| the count (shot30) | 639×1134 → 0.563 | 270×729 → 0.370 | 42.3 % of W · 64.3 % of H · top at 7.1 % |
| RELOAD (shot31) | 599×746 → 0.803 | 177×480 → 0.369 | 29.5 % of W · 64.3 % of H · top at 7.1 % |
| the light (shot29) | 1097×1500 → 0.731 | lamp 212 → 19.3 % of W, 13.7 % of H | lamps at 12 / 32 / 51 % of H · the clock 9.3 % of H |
The green fill: 36 % of the card's width, from 14.3 % to 66.4 % of its height = 11.3 % → 92.0 % of the frame's canvas. The number and the word: 9 % of
the card's height. At the row height 75: RELOAD 60×75, the count 42×75, the ink 18×48 from 5 px down, the light 56×75 with 10.6-px lamps.

## The rasters
`docs/drone-2525/magazine/cut-magazine.py` → `reload-ink.png`, `count-frame.png`, `count-fill-green.png` (+ `-amber`, `-red`), 72×192 RGBA each,
`MAGAZINE.sha256`; embedded as `MAG_PNG`. `hudMag` sets `--cut` on the fill (`MAG_FILL_TOP + (MAG_FILL_BOTTOM − MAG_FILL_TOP) × (1 − f)`, f = min(1, rounds/29),
so his picture at 29 is the full fill and the lines ARE the rounds at any cap: 3 rounds show three lines in QUAL's 10-round magazines exactly as in a
30 — the Spiral round's BLOCKING finding on the staged bytes, where f was rounds/cap and a 10-round magazine at 3 showed nine lines) and the fill's src
by his rule; the frame's src never changes.

## The light
56×75 (0.747; his box measures 0.731 = 55 px at this height, the extra px is for TIME 12:34.5 — said here, never a silent 0.73). The light is
the one card that is NOT a raster: it keeps live lamps and words, so its box, lamps and type are measured from his shot29, not cut from it.
Within it: the lamps 10.6 px with 4-px gaps from the top, the word 6.5 px and the clock 9 px under them, nothing wraps (`LIGHT_WORDS_FIT_ONE_WIDTH`
at 56×75 for NEXT 10 S · TIME 12:34.5 · CEASE FIRE COLD · ALL DOWN · WAIT · READY 12 S). The stance box at `right:60px` (4 px to the light); the
narrow-phone rule leaves (the box clears the count by 16 px even at 360).

## Gates
- `tests/magazine-rasters.test.mjs` (node-only, prebuild + test:ci): his pictures carried and in the sidecar; the cut script pinned; the five PNGs
  72×192 RGBA under 20 KB, pinned, embedded byte-equal in both decks; the CSS of the cards, the light and the box; no SVG magazine left.
- Deck QA: `MAGAZINE_IS_HIS_DRAWING` (his rasters by src and natural size; the ink 18×48 in 60×75 and 42×75; his proportions ±2 %),
  `MAGAZINE_KEEPS_ITS_FRAME` (3/12/19/20/30: the frame src unchanged, the fill red/amber/amber/green/green, the clip monotonic and at the measured top
  at 30, one line per round at cap 10, the number's colour), `MAG_ROW_ONE_LINE` (the rasters' boxes 0.375), `LIGHT_WORDS_FIT_ONE_WIDTH` (56×75). `drone-playable` re-stated.

## Owed
- The twelve Masters' QUAL 40 AAR fixes (r.203) · R-CORE in the shared format (r.204 — it moved from r.202 to r.204 because his pictures came first).
- From the Spiral/SSSES round on r.202: a deck-consistency tie of the artefact commit across its five carriers (register section, notes, ledger,
  domain JSON, the ship message); `measure.json` carried beside `cut-magazine.py` with the ImageMagick version the pins certify.

Artefact commit `ab65de4` · deck sha256 `e8043bcbe138b6d0ba278b459fb26d315ee729af0518c755b897ea6d1a77e380`.
