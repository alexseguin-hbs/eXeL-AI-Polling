# Drone-2525 r.224 — THE RANGE'S ONE DRONE, OFF BY DEFAULT: one control, three levels (2026-10-22)

**Artefact commit 174c0c7 · carried `drone-2525_r.224.html` sha256 010d9327029abfff5354fc34673d307265f5c32e290d532749be984407a7aa11.**

## His words (the night brief, 2026-10-21, verbatim)
> r.224 · Range. One control, DRONE, off by default. Off means Lane 21 is the lane. No drone is drawn. The red T1 box
> does not sit on the lane. The three drills, the magazine, RELOAD, and the three presses stay. range-frozen may change
> only for this control. Do not repaint the magazine. On has three levels only: SLOW, MEDIUM, FAST. One drone, not a
> swarm. SLOW stays up longest and crosses slowest. FAST stays up shortest and crosses fastest. A hit takes it down and
> spends one round. A miss leaves it up until the level's time ends. The button is not on the score strip. Pass: DRONE
> off shows no drone. DRONE on, FAST, one hit takes that drone down.

Measured before building: the Range (CH0) stands no UAV (`spawn`'s `uavOn = g >= 2`), `lockOn`'s range branch returns
from the plate pool before the drone pool, `fireN` routes every CH0 non-plate kind to the bull ring's branch, and
`applyHit` tallies only plates on the strip. All four are FREE; so are `spawn`'s drone mover and `draw`'s drone
painter (box and cross). And a lawn boot row leaves the lawn's track (`UAV-1`) standing 374 m down the Range lane
after boot — on the r.223 bytes too — swirled by the mover because the Range's phase is `moving`: the box he saw
sitting on the lane.

## What changed
- **The control.** `<select id="drnLvl">` — DRONE OFF · DRONE SLOW · DRONE MEDIUM · DRONE FAST — in the bar behind
  MORE, hidden when MORE is closed (appended to the r.157 hide rule, `#modePick` still leading) and hidden off the
  Range (`#app:not(.range) #drnLvl`). Never on the score strip. Its change handler writes `state.rangeDrone`, books a
  `DRONE` row (level, lane), lowers the drone on OFF and says what it did. `state.rangeDrone` is undefined by default:
  the Range is byte-identical until the player turns it on.
- **The drone.** The pool's last member (`drones[11]`, `UAV-12`) — never the lawn's `drones[0]`. `rangeDroneStand()`
  puts it at the level's start — `lane.x − v·up/2`, 120 m down the lane, 10 m up — so it crosses the lane's centre at
  half its time; `rangeDroneTick(dt)` (called by the FREE `spawn` on CH0, on a new line after the frozen range tick)
  carries it at the level's speed, takes it down at the level's end if missed (`TIME`), plays the fall of a hit
  (`lifePct ≤ 0` → `fall` → `DOWN`), and stands it again after two seconds. Levels: SLOW 14 s up at 2.5 m/s, MEDIUM
  9 s at 5, FAST 5 s at 9 — SLOW longest and slowest, FAST shortest and fastest.
- **The three presses.** The FREE `lockOn`'s range branch adds the drone to the pool under the pip while the control
  is on (so the TARGET button's own path takes it, kind `uav`); the FREE `fireN`'s CH0 non-plate route excludes a uav
  only while the control is on, so the drone fires down the pop/uav branch (TARGET → APPROVE → FIRE, one round via
  `magSpend`); the FREE `applyHit` tallies it on the strip like a plate (`rangeDroneIs(ref)`).
- **Off means the Range is the Range.** With the control off the tick lowers every drone on the Range each frame —
  the leaked `UAV-1` included; on, every drone but the control's own (one drone, not a swarm). The deck's own drone
  mover skips the Range's drone (`if(rangeDroneIs(d)) return;` in `spawn`).
- **No frozen definition moves** (range-frozen 100 definitions, 0 moved — "range-frozen may change only for this
  control", and it needed no change). The magazine is not repainted. The lawn is untouched (the tick runs on CH0 only).

## Found by the play, fixed before the cut (both inside this row)
1. **The capital swirl.** The Range's phase is `moving`, so the deck's drone mover applied the capital swirl
   (`d.vx = −sin(…)·9`, a bob to 8–16 m) to the Range's drone: it did not cross the lane. The mover now skips the
   Range's drone and its own tick carries it (FAST measured 8.6–8.9 m/s).
2. **The synchronous lowering.** `applyHit → netEvent → applyWorld` lowers a struck drone in the same press (r.131),
   so the first cut's tick saw `!d.up` with no gap and stood a fresh drone in the same frame — the real-UI play read
   `down false` after the hit. The tick now takes a lowered standing drone as the hit's own fall and starts the
   two-second gap.

## The gate, red first (`redfirst/r224.md`)
`RANGE_DRONE_CONTROL` inserted alone into the r.223 bytes: `threw ReferenceError: rangeDroneObj is not defined`. On the
cut: off — the control reads off with its four options, no drone stands, the lock is not a uav; the three levels
ordered; FAST — one drone stands, the lock takes it, TARGET → APPROVE → FIRE spends one round and strikes it, it goes
down, the strip counts it (+1); off again — none. Same snapshot and restore idiom as the lawn rows (the unit's pan and
tilt, the drone, the magazine, the tallies, the clock, the mode; `rangeReset()`).

## Played on the real UI (manual evidence, 428×926, the cut served from a scratch public dir)
`play/MoT/timeline.json`: 15/15 checks, 0 page errors — THE RANGE, the control off and behind MORE, no drone, the lock
a plate; MORE → DRONE FAST through the real select → one drone (`UAV-12`, 120 m, 10 m up) crossing at 8.6 m/s; the lock
is the drone; TARGET amber → APPROVE red → FIRE → `HIT · UAV-12 · DOWN`, down, magazine 30→29, strip `TRAIN UP · HIT 1 ·
MISS 0`; it stands again after two seconds and, unshot, goes down at 5.0 s with the magazine unchanged; DRONE → OFF, no
drone; eleven plates and TRAIN UP untouched; RELOAD reads 30. The one thing the glass has no button for is the aim
(arrows / mouse), so the harness aims with the deck's own `aimUnitAt` and says so. The lawn play-through on the same
bytes: 20/20 (the foil, the cue, the four numbers, the Range after — unchanged).

## The twelve seats, written from that play (80 words each; one fault in this revision, or SHIP)
- **Aset — consistency.** Off is the Range as it was: eleven plates, `TRAIN UP · HIT 0 · MISS 0`, the lock a plate.
  FAST stands one drone, UAV-12, and only one, at 120 m and 10 m up, every frame it is up; off again lowers it and
  nothing else moves — plates 11→11, TRAIN UP, RELOAD 30. The control sits in the MORE row with the eight pickers and
  reads DRONE OFF / SLOW / MEDIUM / FAST, the same words in the same place at every step. **SHIP.**
- **Asar — synthesis.** The run reads whole: DRONE FAST → one drone crosses → the lock takes it → TARGET amber →
  APPROVE red → FIRE → `HIT · UAV-12 · DOWN` → the magazine 30→29 → the strip `HIT 1 · MISS 0` → two seconds → it
  stands again → five seconds unshot → down, magazine still 29 → OFF → nothing. Every number agrees with every other
  and with the record's HIT and DRONE rows. **SHIP.**
- **Athena — his words.** Pass line met on the real glass: DRONE off shows no drone; DRONE on, FAST, one hit takes
  that drone down. Behind MORE, not on the score strip; three levels only; one drone, not a swarm; SLOW/MEDIUM/FAST
  14/9/5 s and 2.5/5/9 m/s, longest-slowest to shortest-fastest; a hit spends one round; a miss leaves it up until the
  level's time ends (5.0 s measured). The drills, the magazine, RELOAD and the presses stay. **SHIP.**
- **Christo — the player.** At 1× a 1.8 m box at 120 m is 27 px and it enters 22 m left of the lane, outside a
  428-px glass until the player pans — the EYE law, not a fault; the toast tells him what to do (`DRONE FAST · ONE
  DRONE CROSSES THE LANE · TARGET · APPROVE · FIRE`) and the lock names it. Finding the control behind MORE costs one
  tap. The hit's feedback is the toast and the strip. **SHIP**; aside: a player learns to pan.
- **Enki — edge cases.** OFF while a drone stands lowers it at once. A hit while it crosses is a hit (8.6 m/s, the
  bullseye re-aimed before FIRE). The time-out at 5.0 s costs no round. The re-stand after two seconds. A drone struck
  by the HIT row vanishes rather than falls — the same class as the lawn's track, r.226's row, not this one. **SHIP.**
- **Enlil — build.** 0 page errors; the row red on r.223 (`ReferenceError`), green on the cut; range-frozen 100/0 —
  the four edits (lockOn, fireN, applyHit, spawn ×2) are all FREE; both scripts parse; the hide rule still leads with
  `#modePick`; the manifest gains one id. The chain's gates run after the bookkeeping on the ship bytes. **SHIP.**
- **Krishna — integration.** The lawn is untouched: the tick runs on CH0 only, the lawn's `drones[0]` is never the
  Range's drone, and the lawn play-through is 20/20 on these bytes. `lockOn` adds the drone only while on; `fireN`'s
  CH0 route excludes a uav only while on; `applyHit`'s tally is keyed on `rangeDroneIs`. With the control off the
  Range's own HIT/MISS tally is unchanged. **SHIP.**
- **Odin — future-proofing.** The level table is one function, the drone one pool member, the stand one function
  reading the lane — a second drone later is another member, a later tier's track the same tick. The drone draws as
  the box; the foil for it is a downstream want, the next row's business, not this one. Nothing here boxes r.225 (the
  lawn's strip) or r.226 (the fall). **SHIP.**
- **Pangu — cutting edge.** The simplest reading of his row is the one built: a select, one drone, three numbers.
  Not the foil, not a swarm, not a new strip. A plainer thing would be a button cycling the four states; a select
  names all four at once, which is what "three levels only" wants. **SHIP.**
- **Sofia — many lenses.** At 428×926 the MORE row grows by one select and still wraps as it did; nothing overlaps
  the strip, the light, the magazine or the three buttons; the toast is legible; the drone's box is 27 px at 1×, the
  same box every other drone has. In landscape and on a PC the row has more room, not less. **SHIP.**
- **Thoth — data.** FAST measured 8.6 and 8.9 m/s against 9; up 5.0 s against 5; magazine 30→29→29 (the time-out
  costs nothing); rangeHit 0→1 and the strip agrees; the record carries one DRONE row {level fast, lane 21}, one HIT
  row for UAV-12, one DRONE row {off}. The levels' table is ordered on both axes. **SHIP.**
- **Thor — risk.** Off by default, so the two play-throughs must be byte-identical (the chain proves it before the
  push). The one behaviour the Range gains with the control off is a lowering: the leaked UAV-1 — a drone that should
  never have stood on the lane — is lowered every frame. range-frozen 100/0. No path fires the drone without the three
  presses (`fireN`'s mist/red check). **SHIP**, the leak named.

## SSSES, three attempts (recorded; a low pillar does not open a new feature)
1. **As built — Security 96 · Stability 90 · Scalability 92 · Efficiency 90 · Succinctness 80.** Security: one select,
   its value coerced to the four; no new network or input path. Stability: the two faults the play found are fixed and
   gated; the gap logic is three lines. Scalability: one drone by design; O(12) per frame. Efficiency: the lowering
   loop runs every Range frame even when off — twelve cheap checks. Succinctness (lowest): the boot row's snapshot
   boilerplate (the seventh copy) and the long toast strings.
2. **Attempt 2 — skip the lowering loop when no drone is up:** the same twelve checks moved into `some()`; no pillar
   rises. Not kept.
3. **Attempt 3 — fold `rangeDroneLower` into `rangeDroneDown`:** different semantics (the control's drone books a
   `dropMark`; the others must not). Not kept.
   **Kept: attempt 1.**

## One spiral
Forward — the control → the tick stands the drone → the mover skips it → the pool under the pip → TARGET → APPROVE →
FIRE → `applyHit` (lifePct 0) → the HIT row → `applyWorld` lowers `up` → the tick books the down and the gap → the strip
(+1) → the magazine (−1) → two seconds → it stands again. The first place truth is lost: the drone has no fall — it
vanishes on the hit (the HIT row lowers it in the same press), the same class as the lawn's track; "a hit takes it
down" is met, the fall is r.226's row. Backward — from the four numbers: the strip counts it, the magazine spends one,
the record names it; the first untrue assumption is "the drone is in the picture when it stands" — at FAST on a 428-px
glass it enters 22 m left of the aim, outside the 1× picture for about a second until the player pans; the EYE law,
not this row. **Closer: no change.**

## Not here, stated
- The fall of a struck drone (it vanishes — the HIT row's synchronous lowering; r.226 reuses the plates' fall for the
  lawn's foil; the Range drone's fall is the row after).
- The drone drawn as the foil on the Range (a downstream want).
- The lawn boot row that leaves `UAV-1` standing on the Range (lowered here; the row itself is not touched).
