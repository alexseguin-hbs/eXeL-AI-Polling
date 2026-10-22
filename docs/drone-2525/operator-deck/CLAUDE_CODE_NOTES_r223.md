# Drone-2525 r.223 — THE LAWN'S ONE AIR TRACK IS THE FOIL: his wire, stroke only, and it rotates (2026-10-21)

**Artefact commit 1137af3 · carried `drone-2525_r.223.html` sha256 6b2038a79f6fe22704240bab6a63dd9d07cea69643e15bd67bc174536ae8f058.**

## His words (verbatim, 2026-10-21, relayed)
> r.223. Draw the one lawn air track from docs/drone-2525/exports/foil-1.111.wire.json. It is real: 901 vertices,
> 1755 edges, span 1.111 m, nose to rear 0.7777 m. Do not hand-edit it. It is generated. Do not use foil-11.111. Do
> not use the .obj, .cpp, .cs, or .py. Do not fetch anything. The pictures in docs/drone-2525/foil-package/ are the
> check, not a second model. Stroke only. No fill. Same track, same bearing, same cue, same TARGET, APPROVE, FIRE, same
> fall. Still one track. This does not load the X-BAT package and it does not open Real-World. Pass: the thing you
> shoot is that foil, and the score still reads HIT and MISS. If the lines cannot match the picture, stop and say so.
> Not a CRS row. Do not add one.

And, mid-build (2026-10-21, verbatim): *"foil must have ability to rorate…. top point is front"* · *"keep going with
plan"* · *"now tgat you gave snall foil; you have a decent place to start for capital texas lawn training"*.

Measured before building: the lawn's one air track (`capIntroTrack()` = `drones[0]`) was drawn by the drone painter in
`draw()` as a 1.8 m box and a cross (`play.html` ~2129, FREE); the deck embedded no foil geometry at all. The export
`docs/drone-2525/exports/foil-1.111.wire.json` is the generator's (`scripts/build-foil-model.mjs`, from
`docs/security-2525/xbat-wireframe/xbat.wire.json` scaled by the domain record's `airframe.geometry`): 901 vertices,
1,755 edges, span 1.111 m, nose-to-tail 0.7777 m, depth 0.2522 m, body frame nose +x / starboard +y / up +z. At the
track's 150 m the 1.111 m span subtends ~14 px at 1× (the deck's 12-in EYE law: ~1,827 px focal at 1×) and ~405 px at
30× (the lawn's `zoomMax`). The wire is a quad lattice (vertex degree 4–5): 1,755 strokes in 14 px paint as a filled
blob, not a stroke drawing — which is why one source gets two readings below.

## What changed — one source, two readings, one drawer, and an attitude
- **The wire and the silhouette are embedded verbatim from the exports** (`/*FOIL_V*/…`, `/*FOIL_E*/…`, `/*FOIL_S*/…`,
  flattened, the export's own numbers; the patcher refuses an export that is not foil-1.111 with 901 / 1,755 and the
  1.111 × 0.7777 dimensions). Never hand-edited, never fetched; `foil-11.111` is held OUT of the file.
- **`foilDraw(d,c,v,cam,W,H,fw)`** (hoisted, append zone) draws the track at its own `(x,y,z)` through `proj` and
  `segs`' own stroke idiom — `beginPath … moveTo/lineTo … stroke()`; **it never fills**. At ≥ 120 px of projected span
  (`foilFullPx()`) it draws the full wire; below that the silhouette.
- **The silhouette is the generator's, not a hand drawing.** `scripts/build-foil-model.mjs` gains `silhouetteOf(m)`: 16
  bins along each body axis, per bin the extreme vertices kept at their real 3-D positions — the outline in the three
  principal planes plus the centreline — 111 segments for the 1.111 (a `foil-11.111.silhouette.json` is written beside
  it for symmetry and is not embedded). Both are held by `build-foil-model --check` (`test:foil-model`) like every other
  export: a hand-edited output refuses.
- **One edit in the FREE drone painter:** `if(capIntro()&&d===capIntroTrack()){ foilDraw(…); return; }` — the lawn's
  one air track and only it; every other up drone keeps its box and cross byte for byte.
- **Counted on its own counter** (`state.foilSegs` / `state.foilCulled`, reset each frame with the others): never the
  world budget `segs` (which drops over budget) and never the Capitol's own-segment band (`THE_CAPITOL_IS_DRAWN` holds
  `own1 ≤ 280`); `state.foilMode` / `state.foilPx` / `state.foilAtt` record which reading drew, how wide, and at what
  attitude.
- **The foil rotates — his words, "top point is front".** `foilAtt(d)` gives the attitude: an explicit
  `d.att {yaw,pitch,roll}` wins; else a moving track flies nose-first along its velocity, level (`yaw = atan2(−vx, vz)`,
  pitch from `vy`); else a numeric `d.yaw` flies level at that heading; else a hover stands on its tail, nose UP — a VTOL
  foil. `foilToDeck(d,px,py,pz,A)` maps body (nose +x, starboard +y, up +z) to the deck (x right, y up, z forward): level
  and nose-first along +Z is `X=y, Y=z, Z=x`; then roll about the nose (+ = starboard wing down), pitch about the wing
  line (+ = nose up), yaw about the vertical in the deck's own sense (forward = (−sin yaw, 0, cos yaw), exactly
  `units[].yaw` / `yawTo`, so a drone's heading drives it directly); then the track's own place. The top point of his
  picture is the nose: the front.
- **The hover's attitude (a decision, reversible in one word).** The lawn's track is a hover (`vx = vz = 0`), so it
  stands nose-up — which is the package's own front view (`FOIL_full_11_111x7_777_front.png` is the drawing nose-up on
  its tail: span across, the planform face-on to the gun). The first cut pointed the nose at the seat: the lines were
  the export's, but the gun saw a thin head-on lens (4.4× wider than tall), not the picture. His rule — the pictures are
  the check — decided it; and with the attitude a parameter, a moving track (the later tiers) flies top-point-first.

Measured on the cut: at 1× the silhouette, 111 segments, span 14 px; at 30× the wire, 1,755 drawn and 0 culled, span
405 px; in the hover 1.4× wider than tall (1.111 / 0.7777) with the nose above the tail; turned level to the camera's
right the nose projects right of the tail and the side-on foil is 3.1× wider than tall (0.7777 / 0.2522).

## Unchanged, asserted
- The gameplay: the same `drones[0]`, the same bearing (1800, ~150 m, a hover), the same Sentinel cue, the same three
  presses, the same fall (`applyHit` → `d.up=false`, the fall animation on the same object); the r.222 score still reads
  `HIT n · MISS n`.
- No X-BAT package loaded; Real-World stays locked; **not a CRS row** (his addendum). No new control, no new row on the
  glass, no station moved. TRAIN UP, TRAIN DOWN, QUAL 40 (refused on the lawn) unchanged.
- The Range is untouched (r0.221): range-frozen 100 definitions, 0 moved; both Range play-throughs byte-identical. The
  frozen range tick call, the lawn QUAL 40 refusal and `hudScore`'s else line are asserted present by the patcher.

## The gates, red first (`redfirst/r223.md`)
- **`THE_LAWN_TRACK_IS_THE_FOIL`** (boot QA, deferred 1775 ms, after the r.222 row): inserted alone into the r.222 bytes
  it is red (`threw ReferenceError: foilWire is not defined` — the track is a box there). On the cut: embedded V/E/S
  901/1755/111 · at 1× silhouette 111 segments, span 14 px · at 30× wire 1,755 drawn + 0 culled, span 405 px,
  width/height 1.4 · stroke only · rotates: hover nose above tail, yaw −90° nose right of tail (side-on 3.1). Same door,
  snapshot and restore as the lawn block (every unit, every drone, the pops, the clock, the magazine, the view, the
  zoom; `d.att` deleted again); the world budget and the Capitol's own band untouched.
- **`tests/deck-foil.test.mjs`** (new; `test:deck-foil`, in `test:ci` and `prebuild`): 7/11 on the r.222 bytes,
  31/0 on the cut — the embedded numbers equal the two exports number for number; the drawer strokes only and turns
  every point by `foilAtt` → `foilToDeck` (the four attitude sources, roll/pitch/yaw applied); the lawn branch and the
  box for every other drone; `foil-11.111` out; the row in the deck and in the exact-set manifest; the carried HEAD
  embeds the same foil.

## Played on the real UI (manual evidence, 428×926, the cut served from a scratch public dir)
Driven only by clicks and selects — the intro's THE RANGE, MORE, the scenario select → the Capital, the mode select →
TRAIN DOWN, START, TARGET, APPROVE, FIRE, PAUSE, back to the Range — 20 checks, all ok, 0 page errors: the sixteen of
r.222 unchanged, plus at 1× the silhouette (111 segments, 14 px), at 30× the wire (1,755 drawn, 0 culled, 405 px), stroke
only with the embedded V/E/S 901/1755/111, and the foil rotates (hover nose−tail dy −283 on screen, above; yaw −90°
nose−tail dx +284, right). The one thing the glass needs no button for is the zoom (a pinch optic), so the harness sets
`state.zoom` for the 30× picture and puts it back. Captures: `01-lawn-entry`, `01b-foil-30x`, `02-cued`, `03-down`,
`04-range`. Recorded, not asserted: at 30× `lockOn` reads null until the player aims — r.138's ZOOM LAW (zoom is an
optic, never authority), outside r.223.

## The gate as it ran (2026-10-21, before the push — his per-revision rule)
- **Twelve seats at play, one pass — 12 played, 12 passed, 12 SHIP, 0 faults.** Four seats each on phone portrait
  428×926, phone landscape 926×428 and PC 1440×900 (his "ensure this game works landscape or portrait on phone or PC"):
  every seat played the real UI through the harness (20/20, 0 page errors each) and read the 30× wire as the package's
  front view and the score as HIT/MISS. Every aside raised was verified outside r.223 and pre-existing: the strip/RELOAD
  overlap and the cue line are pixel-identical to r.222; the Range drill dropdown reads TRAIN DOWN on return (in every
  r.221/r.222 baseline); the tail runs below a 428-px landscape glass at 30× (the pinch optic at `zoomMax`, r.138);
  Odin's note that the 120-px threshold keys on wingtip span, which collapses side-on, is correct in code and concerns a
  moving track no tier sets yet.
- **SSSES, three attempts — kept attempt 3: 97 · 94 · 90 · 86 · 84** (security · stability · scalability · efficiency ·
  succinctness). Attempt 1 as built: 97/94/90/86/80, lowest succinctness (the cull/moveTo/lineTo/count body written twice,
  once per reading). Attempt 2 (83): one emitter `seg` for both readings. Attempt 3 (84, cumulative): the reading chosen
  once (`full`), one point reader `B` for the flat x,y,z lists both embedded blocks share, the wire's two parts taken by
  name. Each kept under the four rules and proven pixel-identical to the previous form by `getImageData` in seven
  configurations (1×, 8×, 9× across the threshold, 30×, 30× at yaw −90°, …), the harness 20/20 on each, deck-foil and
  range-frozen unchanged. Debits named and left (outside "the drawer, same place"): the boot row's 32-line
  snapshot/restore copy (the sixth of its kind), the 19-line banner, `foilFullPx()` as a gate-pinned wrapper.
- **One spiral.** Forward — the first place the truth is lost is INSIDE r.223 and on the pass line's own letter: at 1×,
  where the lawn is played (14 px of span), the track is stroked from `foil-1.111.silhouette.json`, whose 111 segments all
  end on export vertices but only 34 coincide with wire edges; 77 are chords the 16-bin outline draws between vertices
  the wire never joins. The wire's own lines appear from ~9× (120 px of span). The closer: no single edit closes it under
  the four rules — drawing the wire at every zoom (`foilFullPx` → 0) paints 1,755 edges into ~14×10 px (the fill he
  forbade, in effect) and reds the row and the gate; an edges-only silhouette (34 segments) is a second substitution
  nobody has rendered; naming the reading on the glass is a new word. **It closes with one sentence to him, the choice
  his** (in the release note): keep the two readings · the wire at every zoom (a 14-px blob) · or hold the track nearer or
  larger. Backward — the first untrue assumption is "same fall": on the cut (as on r.222) the lawn's track never falls —
  the HIT row drops `up` synchronously inside the FIRE press (`applyHit` → `netEvent` → `ev` → `applyWorld`), so
  `capIntroTick`'s fall ramp is dead for a local hit and the painter's `if(!d.up) return` removes the foil on the next
  frame exactly as it removed the box; r.131 + r.219 code, outside r.223, the fall not to be changed — one line, not
  fixed. Secondary, same class: the drone bob (±0.36 m ≈ 131 px at 30×) is why `lockOn` reads null at 30× until aimed.
  **Closer: no change.**

## Not here, stated
- The four numbers staying on screen after the run (r.224).
- The 1× reading is the generator's outline, not the wire's own lines (the spiral's forward finding above) — his call,
  one word: keep · the wire at every zoom · the track nearer or larger.
- The lawn's track vanishes on a hit rather than falls (the box did too) — the spiral's backward finding, outside r.223.
- Outside r.223, one line each, not fixed: the 1× silhouette is 14 px — the foil at 150 m is a small thing on a phone
  at 1×, which is the EYE law's truth, not a defect; the full-scale foil-11.111 is not drawn anywhere (his rule); the
  CH5 `foils[]` on other rungs still draw as boxes (not the lawn's track; not asked); nothing yet SETS a velocity or an
  explicit attitude on the lawn's track — the rotation is an ability the later tiers (a moving track, nine tracks) will
  use, proven here by the row's own leg.
