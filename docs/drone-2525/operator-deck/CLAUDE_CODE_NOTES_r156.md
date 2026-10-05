# CLAUDE_CODE_NOTES_r156 — the hit splash starts at the centre of the hit target (2026-10-05)

## Operator ask
> make sure splash on drone originates from center of hit target

then

> fix splash

`docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md`, Addendum 2 (persisted with his phone screenshot
`addendum2_splash_screenshot.png` of r.154 QUAL on lane 21 after "HIT · IN THE AIMING CIRCLE", before any code).

## What a player meets differently
When a shot hits, a red ring opens from the middle of the target that was hit and follows it down as the plate folds. A miss shows
no ring. On a phone at MoT 1 the ring now shows at all — before, it was either somewhere beside the plate or not drawn.

## The defect, measured on the served r.155 (headless Chromium, 390×844, lane 21, 300 m E at 3×)
- `applyHit` wrote `state.fx={t,id,direct:hit,life,x:ref.x,y:ref.y,z:ref.z}` and the draw ringed `(f.x, f.y||1.2, f.z)`.
- A range plate keeps lane-local `x` and `y=0`; its world place is `qWorld(q)` (+ the lane's x offset, + the lane's ground height,
  + the slope). So the ring sat at world (6.4, 1.20, 300) while the plate's centre was (1.4, −6.16, 300): 91 px right of and 135 px
  above the plate on screen (lane 1: 205 m to the side).
- The ring was written on a miss as well (`direct:false`, GIMBAL colour).
- The ring was drawn through the budgeted `segs()` after the grid, the plates and the range wire. At MoT 1 (280 segments) the wire
  had spent the budget (segs 280, dropped 499), so the ring was dropped whole: no splash anywhere on his screen.

## What changed (`patches/r155_to_r156.py`, 6 asserted edits; a miss REFUSES)
1. `applyHit`: `if(hit) state.fx={t:state.clock,id,direct:true,ref}` — the target itself, never a copied position; a miss sets nothing.
2. `splashCentre(f)` beside `worldOf`: `worldOf(f.ref)` (the one centre of mass the aim and the hit test use — `qWorld` + `plateDims`
   for a plate, the craft's own place for a drone); while the plate falls, `y = base + (centre − base)·(1 − min(1, fall))`, the same
   fold the silhouette mesh draws.
3. The draw calls `splashCentre(state.fx)` every frame (so it rides a moving drone and a falling plate), same 0.45 s ring growth,
   LOCK red, and strokes its 16 segments outside the world budget (counted into `state.segs`, recorded as `state.fxSegs`).
4. `state.fx` has no other reader (grep: one writer in `applyHit`, one reader in the draw; the QA row clears it).
5. Revision stamps `0.155` → `0.156`.

## Measured on r.156 (same seat)
- At 0.1 s after the hit the ring projects at (195, 307) on the plate's centre (195, 305) — 2 px lower because the plate is already
  29 % folded, which is the ring following it down.
- 16/16 ring segments drawn while the world wire drops 483.

## Gates
- Boot-QA row **`SPLASH_FROM_TARGET_CENTRE`**: hits a 50 m and a 300 m plate on the seated lane through the one fire path
  (`shootPlate`), projects `splashCentre` with the draw's projector and holds it within 2 px of the plate's projected `worldOf` centre;
  then aims 40 px beside a 300 m plate and scores it through `applyHit` itself (so the miss branch runs; the fire path would refuse it
  before scoring) — no new splash; then one synchronous `draw()` must put 16/16 splash segments on the canvas.
  Note: `50m off 0.4px · 300m off 0.1px · miss: no splash · drawn 16/16 segs (world wire dropped 181)` (the offsets are the fall the
  hit has already started).
- `frontend/tests/deck-qa-manifest.mjs` gains the row (180 rows); `scripts/drone-deck-qa.mjs` holds its note. 179/180 in portrait
  and landscape (SYNC_DIRECT, red by construction on one device).

## Captures (`img/`)
- `r156-before-splash.png` — r.155, 390×844, lane 21 TRAINING · DOWN, 300 m E hit at 3×, frame held at 0.1 s after the hit: no ring
  on the plate (it was placed 91 px right / 135 px up and dropped by the MoT 1 budget).
- `r156-after-splash.png` — r.156, same seat and frame: the red ring through the centre of the hit plate inside the bullseye.

## Not changed (operator's call)
- The ring is horizontal (as before), so at range it reads as a flat red line through the target's centre. A camera-facing burst
  would read more like a splash; that is a look change, not made without his word.

## Record
- `HASHES_r156.sha256` (deck sha `92eb716a…`, 378,675 B, + patch sha); `public/drone-2525/play.html` byte copy.
- `REVISIONS.md` r.156 row (chain `a9d63598…`) + section; README HEAD `drone-2525_r.156.html`; `deck-rev.ts` +
  `tests/deck-head.mjs` DECK_REV `156`.
- Domain JSON `project.revision` 0.041; release 0.041 (r.156) `commit aa66c46` (artefact) / `shipped PENDING`. Ledger rev 51
  (r.156) `shipped PENDING`. `domain.gen.ts`, CRS / README / ASSUMPTIONS and the foil exports regenerated (stamp 0.041).
