# CLAUDE_CODE_NOTES_r155 — TARGET · APPROVE · FIRE left of the stick on the turret, centred between the sticks on a drone (2026-10-04)

## Operator ask
> target approve fire needs to be left of joystick for turret (and centered between two joysticks when operating drone).

`docs/asks/2026.10.04_08.50..02_drone2525_face_left_of_stick_turret.md` (persisted with his phone screenshot of r.154 on lane 21
before any code).

## What a player meets differently
On the turret the three pills sit in one row straight to the left of the HEAD stick, at the stick's height, so the right thumb
moves sideways from the stick to FIRE instead of up and across the screen. On a drone (two sticks) the pills sit centred in the
gap between L BODY and R HEAD, at the sticks' height. It holds in portrait, landscape and FULL, and re-places itself on rotation.

## The defect, measured on the served r.154 (headless Chromium)
- `#face{left:50%;transform:translateX(-50%)}` — the cluster was centred on the SCREEN, whatever the sticks did.
- 390×844 turret: face 81–309 × 656–696 px; HEAD stick 310–382 × 716–788 px (above the stick, across from the thumb).
- 1440×900 desk: face 614–825 (the window's centre) while the gap between the sticks ran 72–1068 (centre 570).

## What changed (`patches/r154_to_r155.py`, 11 asserted edits; a miss REFUSES)
1. `placeFace()` beside `syncSticks()`: clears its inline styles, reads `#stage`, `#joyR` and (when visible) `#joyL` with
   `getBoundingClientRect`, measures the containing block's origin (the face is `position:fixed` on a phone, absolute in `#stage`
   elsewhere), and writes inline `left`/`top` with `transform:none`.
   - TURRET (`#app.turret` or `#joyL` hidden): one row; right edge 10 px left of the stick, vertical centre = the stick's. When the
     row would leave the stage, the gap shrinks 10 → 4 px, then the pill padding/min-width (`0 6px`, then `0 4px`), then two rows —
     never over the stick, never off the stage. 320×568: 4–232 against a stick at 240.
   - DRONE (both sticks): centred on the midpoint of L's right edge and R's left edge, at the mean of the sticks' centres; one row
     if it clears 6 px each side (normal, then compact pills), else two rows, else above the sticks.
2. Called from `layout()` (every resize, orientation change, and FULL — `setFull` dispatches resize), `syncSticks()`,
   `applyMode()`, boot, `document.fonts.ready`, and a `MutationObserver` on `#app`'s class and the sticks' style/class — so every
   path that toggles `.turret`/`.full`/`.desk` or a stick (jumpToTurret, the platform picker) re-places it.
3. What the move must not cover (found on the captures before push):
   - `hudStatusY()`: the right-hand HUD lines (`unit · SPIRAL v1`, `NN FPS`) keep H−52 / H−36 unless the face box covers them;
     then both step above the face and the stick's label. Only landscape turret moves them.
   - The toast (z 41, left 10 px, bottom 92 px) would have lain over TARGET/APPROVE for up to 4.2 s and taken their taps;
     `placeFace()` sets its bottom to max(92, above the face and the stick labels + 6 px).
4. Boot-QA row **`FACE_BESIDE_STICK`**: turret — face right ≤ stick left − 4, vertical overlap ≥ 60 % of the face height, face
   inside the stage; then `state.unit='D1Q'; syncSticks(); placeFace()` — |face centre − gap midpoint| ≤ 4 px, touching neither
   stick, inside the stage; the unit is restored.
5. Revision stamps `0.154` → `0.155`.

## Measured on r.155
| Viewport | Turret face × stick | Drone face between L/R |
|---|---|---|
| 390×844 portrait | 72–300 × 732–772 · stick 310–382 × 716–788 | 114–277 between 80 and 310 (off 0 px) |
| 844×390 landscape | 551–762 × 326–370 · stick 772–836 × 316–380 | 316–527 between 72 and 772 (off 0 px) |
| 390×683 (his phone's visible area) | 72–300 × 571–611 · stick 310–382 × 555–627 | 114–277 between 80 and 310 |
| 320×568 | 4–232 × 456–496 · stick 240–312 | 89–231 between 80 and 240 |
| 1440×900 desk | 847–1058 · stick 1068–1132 | 464–675 between 72 and 1068 |

FULL gives the same placements; a 390×844 → 844×390 rotation on one page re-places to the landscape numbers.

## Gates
- `frontend/tests/deck-qa-manifest.mjs` gains `FACE_BESIDE_STICK` (179 rows); `scripts/drone-deck-qa.mjs` holds its note
  (`turret: face right N < stick left N · overlap N/N px · drone: centre off 0–4px (…)`). 178/179 in portrait and landscape
  (SYNC_DIRECT, red by construction on one device).

## Captures (`img/`)
- `r155-before-turret.png` — r.154, 390×844, lane 21 TRAINING · DOWN: the cluster above the stick, centred on the screen.
- `r155-after-turret.png` — r.155, same seat: the cluster left of the stick at its height.
- `r155-after-drone.png` — r.155, QUAD: the cluster centred between L BODY and R HEAD.
- `r155-after-turret-landscape.png` — r.155, 844×390 turret.

## Record
- `HASHES_r155.sha256` (deck sha `300ceb93…`, 376,178 B, + patch sha); `public/drone-2525/play.html` byte copy.
- `REVISIONS.md` r.155 row (chain `d7ac891a…`) + section; README HEAD `drone-2525_r.155.html`; `deck-rev.ts` +
  `tests/deck-head.mjs` DECK_REV `155`.
- Domain JSON `project.revision` 0.040; release 0.040 (r.155) `commit 51547f4` (artefact) / `shipped PENDING`. Ledger rev 50
  (r.155) `shipped PENDING`. `domain.gen.ts`, CRS / README / ASSUMPTIONS and the foil exports regenerated (stamp 0.040).
