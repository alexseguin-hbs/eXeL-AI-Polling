# Drone-2525 r.213 — THE MOUSE MOVES THE AIM (2026-10-16)

Artefact `583c605` · deck sha256 `6e86e54f5f6ab737070e148a4f839e36809ac53a58bb8f836c224127bcf69e5c` · `HASHES_r213.sha256` · patch `patches/r212_to_r213.py`

## His words

> **2026-10-16, with the deck at r0.212 on his screen (shot67):**
> *"Any more updates on the `</>` Code button ?*
> *If not, please go to Drone-2525 and allow for mouse controller to operate similar to arrows (to move turret
> arround).  Right click of mouse can operate for Target and Approve, left click to fire.*
> *This will use similar Call of Duty and Battle Field computer operations (think Rainbow 6 and Rogue Spear)."*

> **and then, naming the point of it:**
> *"Remember the key for this update was using mouse cursor to move the target, for optimized mouse play for
> turret, that we can later apply to drone and robotics, as well as fixed wing and foil"*

His three answers: **pointer lock, true CoD/R6** · left click fires **only inside mouse look**, outside it a plain
click keeps its present meaning and his phone is completely untouched · the right button **targets first, approves
second**, so the three-step gate is preserved.

## The honest headline, said first

**Three of the four behaviours he lists already shipped**, and have since r.159/r.161:

| he asked for | state on r.212 | where |
|---|---|---|
| right click = TARGET then APPROVE | **already there** | `pcTargetApprove` (:4032), wired at the right-button fast path (:4177) |
| left click = FIRE | **already there**, on a red mark under the bullseye | `mouseAim` (:4027), wired at pointerup (:4233) |
| **the mouse moves the turret like the arrows** | **missing entirely** | drag-look only (:4208, a button held). `pointerLock` occurs **0 times** in the file |
| the browser menu out of the way | partial | `contextmenu` on the canvas only (:4174) |

So r.213 is **pointer-lock mouse look and nothing else**; the two buttons are wiring doors the deck already had,
which is why the fire gate cannot drift — `pcTargetApprove` is the thing that refuses to fire, and it is untouched.

## What a player meets

On a **desktop**: a toast the first time a mouse crosses the glass — `MOUSE LOOK · PRESS M · ESC RELEASES` — and
two lines in CONTROLS beside the ones already there. Press **M** and the browser takes the cursor; moving the mouse
turns the head; the **left** button fires; the **right** button targets, then approves; **Esc** gives the cursor
back. Nothing is added to the picture.

On a **phone**: nothing at all. Every new listener asks `lookActive()` first, and pointer lock never exists there.

## The members

| # | what | where |
|---|---|---|
| M0 | the corner and BUILD read one number | `revision:'0.213'`, `r0.213` |
| M1 | two lines in CONTROLS — **no new box**, so r.210's `RCORE_NEVER_COVERS_THE_PICTURE` keep-out is untouched | the `<aside id="side">` STICKS block |
| M2 | `M` is the door, and joins `GAME_KEYS` so it reaches the game from a focused button | the keydown block |
| M3 | `lookSens` · `lookActive` · `mouseLook` · `lookFire` · `lookMark` · `lookToggle` + the wiring IIFE | the append zone, all **hoisted `function`s** so the boot self-check (which runs synchronously far above) can read them |
| M4 | the three rows | beside the r.161 mouse rows they extend |
| M5 | the embedded R-CORE record regenerated **through rev 90** | the step r.211 omitted, which is exactly what kept r.211 off the site |

**No frozen span moved.** Every region touched — `GAME_KEYS` and the keydown block, `mouseAim`, `pcTargetApprove`,
`controlLaw`, `phys`, the markup, the append zone — is FREE in `tests/range-spans.json`. Checked, not assumed.

## The sign is derived, never chosen

`camOf` sets `cam.yaw = u.yaw + u.pan`; `proj` puts a point straight ahead at `W/2 + sin(yaw)·f/tz`. So **pan
increasing slides the world right — the head turned LEFT**, which is what the shipped rows `TURRET_LOOK_LEFT`
(:4357) and `PAN_RIGHT_MOVES_WORLD_LEFT` (:4601) already measure. Likewise **tilt increasing looks UP**, matching
ArrowUp through `controlLaw` → `phys`.

"Look right" is therefore pan **down** and "look down" is tilt **down** — which is the pair of lines the drag-look
already ships:

```js
{ const zf=fovDeg()/38; u.pan-=dx*.08*zf; u.tilt-=dy*.08*zf; }
```

`mouseLook` reuses them rather than inventing a second convention that could drift from the arrows, and the
patcher refuses if that shipped line ever moves. Sensitivity is the **existing** `R SENS` dial (`state.sets.r`) —
no new control, no new stored field.

## DD-75 · every craft, not the turret alone

`mouseLook` mirrors the split `phys` already makes: the turret scaled by the picture's real half-angle (r.141),
every other craft at its own rate. Measured in the row:

| | 1× | 3× |
|---|---|---|
| turret, per 100 px | **2.48°** | **0.84°** (scaled by the picture) |
| QUAD, per 100 px | **8.00°** | **8.00°** (its own rate) |

A drone, a robot, a fixed wing or a foil seat inherits mouse play by **being seated**. There is no second control
path to write when they arrive.

## Two defects the sabotage pass found in my own cut, before the ship

1. **The swallow was on the wrong node.** The first cut registered the captured-click swallow on the **canvas** in
   the capture phase. Capture runs first *between nodes*, but at the **target** node the DOM runs capturing and
   bubbling listeners in **registration order** — so a listener added in the append zone still ran second and could
   not pre-empt the shipped handlers. Measured: with the handler sabotaged to swallow everything, a synthetic
   `pointerdown` **still set `state.drag`**. Under a real pointer lock that means the shipped right-button path
   would have run too, calling `pickNear` on frozen `clientX/clientY` and marking a plate the player is not on.
   The swallow now sits on **`window`**, and the row asserts that placement by name (`upOneNode`).
2. **A hole in my own gate.** `MOUSELOOK_TURNS_THE_HEAD_LIKE_THE_ARROWS` first asserted only the direction and the
   dial, and a sabotage that removed the turret's `fovDeg()/38` scaling — **half of DD-75** — left all three rows
   green. The row now measures the law at 1× and 3× on both a turret and a QUAD.

## Measured, named, and NOT fixed — his call

`mouseAim`'s blank-ground branch (:4031) does `u.pan += atan((sx−W/2)/f)`. By the derivation above that turns the
head **away** from a click right of centre, while the **tilt** term in the very same expression is correct. No gate
sees it: `MOUSE_CLICK_CENTRES_THE_BULLSEYE` asserts only that it turned, never the direction. It is r.161's own
behaviour, so it is his to call — one word makes it its own revision.

## Gates

Three new rows, each proved able to fail by **five sabotages of the cut** rather than by the absence of a feature
(`redfirst/r213.md`). The full chain ran **after** the bookkeeping, on the bytes this commit carries.

## The Range is untouched, proven by play and not by the freeze alone

- `range-frozen` **100 definitions, 0 moved** · `range-2525` 118 passed.
- `drone-trainup-play.mjs` on the exact bytes, r.212 vs r.213: **identical field for field**, except `skyTap.t`, a
  wall-clock stamp that also moves between two runs of the **same** bytes (13.1 / 13.2 / 13.2).
- `drone-deck-qa` at four viewports + the touch leg: 249 rows each, `red = SYNC_DIRECT` only
  (`EYE_SCALE_12_IN` declared at 667×375).

## Owed, carried, named so he never says it twice

- **No `test:drone-play` runner in CI** — both play-throughs are manual evidence.
- **428×926, the size he actually holds, is still not a CI viewport.**
- Verify Live polls 10 minutes against an 18-minute job.
- The deck's R-CORE strings are English only (the deck has no lexicon) — held by **DD-60** until he says the UX is
  complete.
- `mouseAim`'s inverted blank-ground pan, above.

## Next, in his order

The deck's own `</>` Code chip · the map ladder (DD-43/45/46/47) · a range laid out on the lawn · the three
programmes there · the comms read as crypto · the range officer's opening and the 3-2-1 light.
