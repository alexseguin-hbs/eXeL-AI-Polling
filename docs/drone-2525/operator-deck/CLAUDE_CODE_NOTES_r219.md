# CLAUDE_CODE_NOTES — Drone-2525 r.219 (2026-10-19) · A MAN ALONE PLAYS TRAIN UP AND TRAIN DOWN ON THE LAWN

Artefact commit `584a8e7` · carried `drone-2525_r.219.html` sha256 `08aac7450a8d149fe41ef751f410e11bd50a5d66c0d0809b4e5382c218e05b4a` · patch `patches/r218_to_r219.py` · red-first
`redfirst/r219.md`.

## His words (verbatim, the record)
- Key Deliverable, 2026-10-19: *"Introductory mode is the foundation. Nothing in Intermediate, Advanced, or
  Real-World advances until Introductory works for the player counts below."* Step 1: *"Single player, three-press
  loop, TRAIN UP / TRAIN DOWN, hit/miss, magazine, glass truth"* — gate: *"Player can complete a full TRAIN UP run
  without broken presses or false colours."*
- The lawn delta, line 26: *"Introductory · The lawn. The same three drills, one air track, single shot. Sentinel names
  it before Fire counts."* Line 183: *"Introductory first, and only after Training is on the record."*
- CRS-CL.12, the seat table: *"A1 · 1800, down Congress. Weight two · 1500.2100 · Air · Introductory."*
- DD-131: *"jumping into a movie; make all your own design decisions on plan for 3 hrs or more."*

## What a player meets
From the Range: MORE → SCEN → CAPITAL 42. He is seated on the south lawn station facing **south, down Congress** —
the Capitol behind him — with one slow track hovering at 150 m. The magazine card and the light are on the glass.
TRAIN UP: TARGET (amber) → APPROVE (red) → FIRE; the track falls and comes back after 3 s. MODE → TRAIN DOWN: the
button reads START; press it, the track stands and the clock runs; hit it and the light reads ALL DOWN with the time.
RESTART re-arms. QUAL 40 on the lawn is refused in one sentence (it is Training, on the Range). LANE and TARGETS are
disabled on the lawn. The AI seats do not fire. Every press is on the record under the lawn's own verbs.

## Causes, measured on the shipped r.218 bytes
| what | where | number |
|---|---|---|
| the TARGET button's reach | `lockOn` fallback pool | pops 80 m, drones 120 m — lawn objects 150–262 m out; a tap had no cap |
| the glass off the Range | `marksPersist()` | `chNum()===0` |
| the magazine, the light | CSS `#app.range …` | hidden off the Range |
| "lawn pops" | `spawn` spots | six spots inside the Capitol footprint, life 4–6 s |
| the AI | `asmTick` | twelve seats marking and firing |
| the record | `decide` verbs | no START / TIME on the lawn (CL.01's own metric) |
| the seat | `turrets[t-south].homeAz` | 0 (toward the rotunda) where CL.12 says 1800 |

## What changed (every edit in a free span; `range-frozen` 100 definitions, 0 moved)
reach 80/120 → 340 (and `asmTick`'s twin) · `marksPersist()` true on Introductory (narrowly) · class `cap` + two CSS
rules + `capPaintLawn()` after the frozen painters · `pickScenario('capital')` → `capIntroEnter()`: T01 on the sourced
t-south, faced 1800, zoom 1 · `capIntroTrack()` = `drones[0]`, bearing-fixed hover at 1800 × 150 m, life 1e9 ·
`spawn`: pops/uav/foils not spawned on Introductory, `capIntroTick(dt)` · `waveCheck` returns on Introductory ·
`asmTick` returns on Introductory · `CSTART`/`CTIME`/`CRESET` rows; hits/misses from HIT/MISS rows · RESTART and MODE
wrapped from the append zone; LANE/TARGETS disabled; the qual40 option disabled on the lawn.

## Decisions taken under DD-131 (each reversible in one word)
3 one seat, A1, 30 rounds · 15 a `cap` class, `.range` not widened · 16 A1 faces 1800, the record corrected by an
appended entry (LC-01), the position not moved · 17 the track hovers, bearing-fixed, at 150 m · 18 the AI seats hold;
the other 41 units neither re-homed nor deleted · 21 `?map=` waits for the ladder lock · 25 two drills; QUAL 40 on
the lawn is his gap · 27 the lawn's START/TIME under new verbs · the lawn is entered from the Range (the direct solo
door is the ladder revision, DD-43).

## Gates
Six boot rows (ids in the exact-set manifest), red first — see `redfirst/r219.md`. `TRAINING_IS_ON_THE_RECORD` is a
permanent precondition row. The chain re-ran every deck gate after the bookkeeping on the exact bytes commit B
carries, both play-throughs on those bytes, and `npm run build` in a fresh shallow clone before the push.

## Owed / not here
The Sentinel cue and the swarm predicate (r.220) · CL.05 the Capitol as a non-target (r.221) · the `?map=` reader
(the ladder lock) · per-seat magazines (eight frozen definitions) · a MISS leg in the Training probe (a deliberate
miss; the row path is the same `netEvent` line as HIT) · the direct solo door onto the lawn.
