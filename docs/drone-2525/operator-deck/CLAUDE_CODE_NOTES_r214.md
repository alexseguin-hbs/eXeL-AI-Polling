# Drone-2525 r.214 — MOUSE LOOK IS MOUSE-ONLY (2026-10-17)

Artefact `d78b10d` · deck sha256 `8642705edb2d79290f5d2cebbb05859cd44c1fd161cc25fa573e5ccf826d7b81` · `HASHES_r214.sha256` · patch `patches/r213_to_r214.py`
Red-first `redfirst/r214.md` + the committed `redfirst/sabotage-r214.sh`

## His order

> *"AsM 111 and MoT 333 test new updates; spiral test, and SSSES TEST; make changes without loosing functionality,
> ensure you did not break anything up tothis point by reviewing R-CORE HISTORY"*

## What ran

| | result |
|---|---|
| **AsM 111** | twelve Masters, 111 words each, each playing the LIVE r.213 |
| **SSSES + SPIRAL** | seven lenses — spiral forward, spiral backward, security, stability, scalability/efficiency, succinctness, R-CORE history |
| **Adversarial verify** | 22 distinct BLOCKING claims × 3 independent refuters = 66 verdicts; **10 survived, 12 refuted** |
| **MoT 333** | 333 words, three paragraphs; verdict FIX-FIRST |
| **SPIRAL soak** | 12 runs (3 modes × 4 viewports), 1,100 sampled moments, 9,875 frames, 59–60 fps — **zero** glitches of every kind, `red = SYNC_DIRECT` only |
| **SSSES scores** | security 72 · stability 76 · scalability 80 · efficiency 74 · succinctness 82 |

## "Ensure you did not break anything up to this point" — the answer

**The arc holds, and two things did not.** Both are now closed.

- Every boot row **ever** in `deck-qa-manifest.mjs` was walked across its whole git history: **265 ever, 249 today,
  16 removed**. Fifteen have a named successor still green (`SPLASH_FROM_TARGET_CENTRE` → `…_BASE`,
  `MARK_SURVIVES_THE_RETURN` → `EVERY_TARGET_NEEDS_TARGET_APPROVE_FIRE`, and so on); the sixteenth, `SSSES`, moved
  to its own scorer, `scripts/drone-spiral9.mjs`, which Deploy runs. **No promise was silently dropped.**
- The R-CORE history lens re-measured **every release promise from r.196 (rev 74) to r.213 (rev 91)** against the
  live bytes: **16 of 18 still hold**, measured not assumed.
- **Broken (1):** the register's SUPERSEDED mark sat on r.151 instead of r.211 — a first-match replace in r.212's
  bookkeeping, invisible because the row chain hashes `prev|rev|sha|bytes` and not the shipped column. Fixed and
  gated in `84ac81937`; the ledger correction is rev 92 of this revision.
- **Broken (2):** `test:ci` had been aborting at **step 12 of 133** on every local run, so 121 gates never ran here
  and I had called that "clean". The sha was derived two ways; now one. Fixed in `b796965bb`.

## The members

| # | what | why |
|---|---|---|
| M1 | `KeyM` takes `!e.repeat` | a held key was a burst of lock toggles and toasts |
| M2 | `lookActive()` gains one explicit QA seam | headless grants pointer lock only sometimes and no script can set `document.pointerLockElement`; without the seam the row below cannot exist |
| M3 | `mouseOnly()` on every listener that acts; the swallowed `pointerup` finishes the canvas cleanup | **the defect**: a finger fired a round while the cursor was captured, and the touch path went dead |
| M4 | `lookToggle` refuses while a screen owns the glass | CONTROLS holds the only line teaching `M`, so the instruction led into the trap |
| M5 | one serialisation of the 1.17 MB document, not four | three of the four were added by r.213 |
| M6 | the touch row names each registration instead of counting a string | a fourth listener used to leave it green |
| M7 | the embedded record regenerated through rev 92 | the step r.211 omitted, which kept r.211 off the site |
| M8 | three source pins re-expressed | the lines they quote moved; each still shown able to fail |
| M9 | `MOUSE_LOOK_LEAVES_NO_TRACE`, **deferred** | four fixes that need a live listener |

**No frozen span moved.** Target: `range-frozen` 100 definitions, 0 moved.

## The false pass this revision found in a leg I had just written

The lock-held leg first sat inside `toolSelfTest` and read **green while measuring nothing** — `toolSelfTest` runs
synchronously at boot, long before the mouse-look IIFE registers its window listeners, so *"with the lock held a
finger fires nothing"* passed **because nothing was listening**. The legs that need a live listener are now in a
deferred row, on the same `setTimeout` pattern r.209 and r.210 use. S1 of the sabotage set proves it now bites.

A second trap took two attempts: leg (d) asserts the self-check serialises the document once, and its first two
forms **counted their own text** — the comment above the hoist, then the assertion's own string literal. The needle
is assembled from pieces so the line cannot match itself.

## His to call — three trades, named rather than acted on

1. **Mouse pan:tilt is 1:1 where the arrows are 4:3** (`phys` scales pan 120 and tilt 90). 100 px gives 2.48° on
   both axes. Changing it blind would alter a feel he has not complained about. One number if he wants it.
2. **A non-turret seat aims at a flat rate at any zoom** — the turret is scaled by `fovDeg()/38`, a QUAD is not, so
   at 30× a drone's 8.00°/100 px is coarse. DD-75 as written is honoured; this is the next question it raises.
3. **The Capital QR has written `?map=` since r.209 and nothing reads it** — r.209's own row promised the reader
   would land with the ladder in r.211, and the ladder is still owed. It belongs with the ladder, not here.

## Owed, carried

No `test:drone-play` runner in CI · 428×926 is still not a CI viewport · r.151–r.164 still read `PENDING` in the
register's ship column · the deck is English only (DD-60 holds translation until he says the UX is final) · the
Cloudflare KV namespace id is his to create.
