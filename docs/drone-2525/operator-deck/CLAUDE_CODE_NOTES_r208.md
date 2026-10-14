# r.208 — THE CAPITAL I: the Capitol is drawn

**Artefact commit:** `ca3261f` · **deck sha256:** `fd620516e4c3e85f8783d52a6a60639a11e345e9039daf671541425bc5675510` · **base:** r.207 (`HASHES_r207.sha256`, asserted by the patcher)
**Patch:** `patches/r207_to_r208.py` — 20 asserted edits, the cut parsed by `node --check` before it is written.

## 1 · His words

> can you create edge wireframes of Austin texas Captial of texas scenario with stationary pop up targets for turret
> then find way to do same for drone
> each flying mode (Turret, Robot, Drone) has 1-2 joysticks. Always have target, approve, fire in centrr in same place as The Range turret mode.
> Any moving platform gets two joysticks with bottoms in middle
> Esch mode gets train -up, train down, Qualification choose a set of targets for each mode. Each turret location has different pop ups.
> also enhance capital of texas using online images to make more realistic outline using array of 13 Trinity colors with varying levels of thickness etc to mimic 3D structure of capital and capital lawn (including trees
> while making these updates; don't change the range; just use working range to start building elements for The Capital
> — operator, 2026-10-13 (persisted whole at `docs/asks/2026.10.11_18.56..53_…poses.md`, commit `2cc52ed9`; DD-27 … DD-35)

His order is the build order. **r.208 is the picture**; r.209 the pop-ups per turret location; r.210 the three programmes in every
mode; r.211 the control law; r.212 the same, flown.

## 2 · What was wrong, measured before a line was written

All on the shipped r.207 bytes at 390×844, the Capital entered through its own picker (`#chLvl` → CH1 LAWN):

| MoT | budget | drawn | dropped | the stage |
|---|---:|---:|---:|---|
| **1.1 — the default** | 280 | **280** | **1,278** | **black** |
| 2.1 | 1,055 | 1,055 | 922 | partial |
| 5.1 | 3,380 | 1,748 | 244 | boxes and three flat rings |

Instrumented at the call site: `drawTargets` is entered at **5** segments spent and leaves at **280**. Eight door targets ×
(a 12-edge box + a 29-segment bullseye) = **328** — more than the whole MoT 1.1 budget. `WIRE.g` is never reached, so all 217
edges of the Capitol are dropped. **This is why the first Capital revision is "the Capitol is drawn" and not "the Capitol is
beautiful":** a truer model would have changed nothing.

The building itself, against the sourced dimensions: the spire stopped at **62 m** where the star stands at **92.24 m**
(−32.8 %); the dome's base ring was **r 16 m** against a **9.14 m** rotunda (+75 %); the Great Walk was 14 m wide against
7.62 m; the trees were 28 bare verticals; the dome was three FLAT horizontal rings.

## 3 · The four members

1. **DD-38 · the scene's subject is never the first thing dropped.** `add(n,c,s,{w,own,lod})`; a group marked `own` is painted by
   `segsOwn` — counted, never dropped. This is the range's own r.157 rule (*my lane's targets are the shooter's own picture,
   drawn outside the world budget*) applied to the Capital's own subject. Everything else stays inside the budget and drops
   first, which is what a fidelity dial is for. Measured: **208 own segments at MoT 1.1, 348 at MoT 5.1.**
2. **DD-37 · the painter learned weight.** `segs(arr,col,w)` and `segsOwn(arr,col,w)` multiply the one `fw`; the ladder is
   `lib/wire-core/vector-law.ts`'s own — **hairline 0.6 · normal 1 · bold 1.6**. That file also fixes the limit: *a darker edge
   would be a fourteenth colour*, so depth is read from weight, overlap and perspective and never from a shade. Weight is a
   **role**, not a distance: the silhouette bold, the structure normal, the ground hairline. Every existing call — the range's
   `RANGE_WIRE`, the plates, the slot boxes, the swarm, the meshes, the map — passes no weight and draws **exactly** as before.
3. **DD-34 · the building, from sourced numbers.** 566 ft 6 in E-W = **172.67 m** and the central block 289 ft = **88.09 m**
   (National Historic Landmark nomination 70000770); **302.64 ft** from the south-front grade to the tip of the star and a
   **60 ft** rotunda (Texas State Preservation Board); the Goddess **16 ft = 4.88 m** and her star 8 ft point to point (1888
   state pamphlet). **DECLARED, because no source was reachable from the build container** (outbound HTTP is blocked, and the
   figures above came through search synthesis rather than the PDFs themselves): the wing cornice at 18 m, the central block at
   26 m, the drum/shell/lantern profile, the number of columns, the south steps, the fence line. The grounds — the Great Walk
   allée, the north lawn, the bounding streets — are the arena record's own `treeRows` and `roads`, converted by the one
   transform **deck z = −(record y)**, and `tests/capitol-model.test.mjs` compares them to that record on every run.
4. **DD-39 · detail follows the dial, presence does not.** Each group declares the lowest MoT major that draws it: at the VECTOR
   band the building, the dome, the Goddess, the steps, the lawn, the streets and the tree trunks; from MoT 2 the window
   courses, the colonnade, the canopies, the fence, the rotunda circle and the blocks.

5. **A door's mark costs four segments at the VECTOR band instead of twenty-nine.** `bullseye` draws its two rings
   from MoT 2; at MoT 1 the same centre is a cross. That is a visible change to what every Capitol target wears at
   the default fidelity, and it is the edit that gave the lawn its budget back: `drawTargets` spends **120**
   segments at MoT 1 where it spent **328**. Nothing changes at MoT 2 and above, and nothing on the range, which
   never calls it.

Two doors that were shut, both found while measuring, neither of them his:
- **`SCEN · CAPITAL 42` did not open the Capital.** The handler set `state.mode` and toasted; it never called `applyMode` and
  never set a challenge, so picking his own scenario left the range on the glass. `pickScenario(v)` is now one door for the
  picker and for the QA row that presses it.
- **The overhead view was framed for a lane.** `mapCam` sits at `155/zoom` metres, which with the deck's single focal length
  shows about 33 m — right for a 15 m lane, useless for a 500 m site. Over **every non-range channel** — CH1 LAWN through CH5 NET, all of which stand on the Capitol grounds — it rises to **2,400 m** and looks
  straight down (at 66° a 2,400 m camera lands 1,069 m past the grounds — measured, the picture was empty), where the same
  optic frames 512 m. The range's map keeps its 155 **exactly**.

## 3b · ONE thing about the range DOES change, deliberately, and it is said first

Leaving CH0 for a challenge has always set `state.phase='static'` and zeroed the hits, and `goRange()` has never put
them back — so after a round trip the range's own wave clock was wrong and `waveCheck()` fired **PASS · MOVING
TARGETS** at the next quota hit. Measured on the shipped r.207 bytes through its own challenge picker: CH1 then CH0
leaves `phase:'static'`, and four hits then toast `PASS · MOVING TARGETS` with `passed` 1 → 2. **That is r.207's
defect, not a new one** — but r.208 adds a second door onto it, two taps from the range, so it is closed here for
every door: whoever leaves CH0 stashes the range's wave, and `goRange()` hands it back whole. Measured on these
bytes: both round trips leave `phase:'moving'`, the quota toasts the range's own TRAIN UP line, `passed` stays 1.

`goRange` is a frozen span, so it moves with this edit — **declared and re-pinned under its own key** in
`tests/range-spans.json`, with the reason beside it. That is the freeze doing its job rather than a hole in it. The
no-fly volume, by contrast, is NOT changed: r.131's `CAP` and `WING` boxes are kept exactly and flagged as the
range's own, and the sourced volumes are flagged as the Capital's, because a round found that re-sizing them moved
5 of 120 measured points over his lanes.

## 4 · DD-35 — "don't change the range", made mechanical

`frontend/tests/range-frozen.test.mjs` + `frontend/tests/range-spans.json`: the sha256 of **100 top-level definitions** — those that belong
to the range alone — the program of record (`QUAL`, `IWQ_VI`, `rangeTick`, `rangeExpose`, `qualFinish` …), the magazines, the
TRAIN DOWN clock, the stop light, his five stances, the lane, its plates, its signs (`boardLabels`, `SIGN_MIN_PX` …) and the
doors onto it (`enterTheRange`, `seatLane`), **the predicate that defines the range (`chNum`)** and the seat switcher (`applyMode`). **r.207 → r.208 moves none of those hundred.** Three more are frozen under their own key and re-pinned here with their reason: `goRange` (section 3b), `mapCam` and `drawMap` (the overhead framing).

The gate is sharp and it is not vacuous — replayed over the real ships it reports exactly:

| ship | moved |
|---|---|
| r.204 → r.205 | `qualDropStrays, rangeTick, boardLabels, drawPlates` (the colour and caption work) |
| r.206 → r.207 | `boardLabels` (his D-21 sign decision) |
| **r.207 → r.208** | **none of the hundred**; `goRange`, `mapCam`, `drawMap` declared and re-pinned |

and each match is a line in that patch's own header. The gate also proves, in its own last assertion, that it is *able* to fail,
by re-running the extractor over the carried r.206 deck.

**The behavioural half caught what the source freeze could not — on the first cut, before the ship.** The QUAL 40
play-through was run against the r.207 bytes and the first r.208 cut and the timelines diverged at entry 18: same
buttons, same marks, same magazine, but r.208 toasted `PASS · MOVING TARGETS` at the player's fourth hit **on the
range** and r.207 did not. The cause was mine and was state, not source: the new `THE_SCENARIO_PICKER_OPENS_THE_SCENARIO`
row calls `pickScenario('capital')`, which sets `state.phase='static'` and zeroes `state.hits` on its way into the
Capital, and nothing put them back — so `waveCheck()` fired on the range at the quota. Measured after boot: r.207
leaves `phase:'moving'`, the first cut left `phase:'static'`. **The 98-span freeze cannot see this, because no source
moved.** The row now saves and restores `phase`, `hits` and `passed` and runs silent; the second cut leaves
`phase:'moving'`, exactly as r.207 does. The rule it earns: *a QA row that enters another scene restores every field
that scene touched.*

**And the behavioural half, run by hand here because CI still does not run it:** the TRAIN UP play-through
(`scripts/drone-trainup-play.mjs`, the deck's own buttons on a served deck at 390×844 with a touch screen — target
three, come back and approve three, fire three, a double-tap, a sky tap) was played against the **r.207** bytes and
the **r.208** bytes. **34 entries each, and with the wall-clock field dropped the two timelines are byte-identical**:
the same looks, the same lit buttons, the same marks, the same three hits, the same refusal and the same toast. The
whole QUAL 40 table was played on both as well — 40 shots, 3 reloads, **40 of 40 EXPERT**, 231 s, **168 timeline
entries each and byte-identical** once the clock is dropped. Both kept in
`scratchpad/r208/redfirst/trainup-identical.txt`. **This is the gate CI still owes**: a `test:drone-play` runner would
have caught the leak above without a person noticing it.

**What it does not cover, said in the file rather than left to be discovered:** the functions the Capital is *required* to reuse
— `designate`, `markLock`, `approveDesig`, `fireN`, `lockOn`, `paintCues`, `hudPhase`, `placeFace`, `drawTargets`, `segs` — are
deliberately absent, because reusing them is his own instruction and R-CORE's NO REWORK law. Their range-facing behaviour is
held by the 242-row boot QA at four viewports (in `test:ci`) and by the two play-throughs, **which nothing in CI runs yet**.
That is the owed half, and the round named the stronger form of it: **pin the range's RENDERED OUTPUT** — the op-view
and map canvases at lane 21 at a fixed fidelity, hashed — which would catch a change in a shared painter that no
source freeze can see. Measured by the round on these two decks: those canvases are byte-identical at MoT 1.1 and
MoT 5.1, and the range map's sha matches exactly. Owed as its own gate.

## 5 · The gates

| gate | holds | red on r.207 first |
|---|---|---|
| `THE_CAPITOL_IS_DRAWN` (deck row, deferred) | the subject draws at MoT 1.1 **and** 5.1, outside the budget | the whole building was dropped |
| `CAPITOL_IS_THE_SOURCED_BUILDING` (deck row) | 172.66 / 88.08 / 92.24 / 18.28 m measured from the drawn edges | the group did not exist |
| `EVERY_EDGE_HAS_A_LAWFUL_WEIGHT` (deck row) | every colour one of the thirteen, every weight one of three, all three in use | `add()` had no weight |
| `THE_SCENARIO_PICKER_OPENS_THE_SCENARIO` (deck row) | the picker enters the Capital and returns to the range | the handler only toasted |
| `THE_RANGE_DRAWS_WHAT_IT_DREW` (deck row) | the range's own frame at lane 21 — segments drawn, own and dropped at three fidelities — pinned from here on | (new: the source freeze cannot see a painter) |
| `tests/capitol-model.test.mjs` | the deck's numbers against **`docs/drone-2525/CAPITOL_SOURCES.json`**, which carries each dimension once with its source and the sentence it came from; the record's own tree rows and streets; the weight ladder against `vector-law.ts` | 11 failures |
| `tests/range-frozen.test.mjs` | the 100 frozen spans, plus the three re-pinned under their own key | (a non-regression gate: green on both, and it proves it can fail) |

Both new gates are in `test:ci` **and** in `prebuild`, so a red one fails the Cloudflare build as well as the GitHub job.
Boot QA **241/242** at 390×844, 844×390 and 375×667 with `SYNC_DIRECT` the only red, and **240/242** at 667×375 where `EYE_SCALE_12_IN` is red as it already is on r.207 (235/237 there). The deferred row exists because a drawn frame is the evidence — and
because `SWARM` is a `const` declared *after* `toolSelfTest()` runs, so a `draw()` inside the body throws
`Cannot access 'SWARM' before initialization` and reduces the whole self-test to one red row (measured, then moved).

## 6 · What he will see, and one thing he will not

From the south-lawn turret, at **MoT 1.1 — the default**: the gold dome (attic, straight drum, shell, lantern), **the
Goddess of Liberty and her star**, the cyan south front of the cruciform with its wings, the south steps, the lawn,
the Great Walk and the trunks of its allée, and the bounding streets. **From MoT 2** the drum's colonnade, the window
courses, the canopies on the forty trees, the fence, the rotunda's circle and the three blocks that carry doors.
Where r.207 showed black.

Three things the round changed about this picture, each measured rather than judged by eye alone:
- **The stations stand 240 m out while the Capital is entered.** r.131 put them on an ellipse 110 × 130 m; from
  150 m the drum alone fills a phone and the building cannot be read. Measured at 150 / 210 / 240 / 280 m: at 240 the
  south front spans the glass with the dome above it and the walk leading in. The ring is a **standoff, not a plan** —
  where each of the 42 stations stands, and what pops up in front of it, is r.209 (DD-33). The units' creation ring is
  r.131's and is untouched, which keeps `CAP_LOCK_IS_THE_PIP`'s close-range case honest.
- **The optic is homed by solving, not by typing.** `capHomeTilt(d)` bisects the tilt until the star lands a sixth of
  the way down the picture, using the deck's own projection and the live focal length, so she is in frame at 390×844,
  428×926 and in landscape. The first cut aimed at a fixed 30 m and the star went 25 px off the top when the drum grew
  to its sourced height.
- **The dome is a dome.** Two profiles were wrong before this one: the first gave the lantern twelve metres of constant
  radius, the second tapered continuously from the drum to the plinth — *"a rocket, not a dome"*, which is what the
  review called it and what the picture showed. It is now an attic (26–30), a tall straight drum (30–55), a shell that
  falls 9.8 m of radius over 15.5 m of height, a slim constant-radius lantern (70.5–82) and the plinth.

**What he will not see, and why, measured rather than excused:** the whole building at once from the ground. The
deck's EYE law is his own (r.141: *the 1× picture is life-size for a phone held 12 in from the eye*, focal 1827.6 px),
which makes the picture a 12° window; the full 172.67 m of width needs **428 m** of standoff at the widest the optic
goes. At 240 m he sees the south front and the dome and scans for the wings — and **the overhead view shows the whole
site**, which is where the outline is judged.

## 7 · Owed, and named

- The arena record (`docs/drone-2525/drone-2525.v00.00.json`), its builder `frontend/lib/drone-2525/arena-model.ts` (with
  `los.ts`, which traces line of sight against it) and `components/security-2525/mission-planning.tsx` still carry the
  Capitol **±55 m** north-south — **24.9 % deeper** than the sourced 289 ft. One polygon, two carriers, corrected together as
  their own change; `tests/capitol-model.test.mjs` prints it as OWED on every run so it cannot be forgotten.
- The record's other eleven buildings and their doors arrive with the per-location pop-ups (r.209). The three blocks that carry
  door targets today (`cvc`, `mansion`, `lib`) are left **exactly** where they were, so those three doors stand where they always
  did. The Capitol's own four moved relative to the wall, because the wall did: `D-CAP-E`/`D-CAP-W` at x = ±84 were flush with the
  old 168 m wing and are now **2.33 m inside** the sourced ±86.33 m one (north and south stay 1.96 m clear, as before). r.209
  derives all four from `CAP` instead of carrying literals.
- **The two doors into the Capital do not agree about the optic.** `pickScenario` sets the Capital's own widest zoom (0.55) so the
  whole height is in the picture; the `#chLvl` picker, the other door, does not, so from MORE → CH1 the drum fills the glass at 1×.
  One line in the same handler, carried to r.209 rather than cut after the round had already read these bytes.
- Marking on the Capital still needs PRACTICE or a room (`roundOpen`), and `practiceNoRoom` refuses CH>0 alone — r.209's ground.
- The Range's magazine row stays on the glass inside the Capital.
- Carried from before: the QUAL-40 miss that reaches no record row; a lane post drawn without its board; three times a table the
  glass says PRESS RELOAD on a magazine just filled; `hudKeepOut` in CSS pixels with no `ResizeObserver`; the lane picker reading
  LANE 21 on every QR-opened lane; 428×926 absent from the CI viewports; the 360-px phones red and undeclared; **no
  `test:drone-play` runner in CI**; the DD rows that never reached the ledger or the domain JSON; and Verify Live's 10-minute
  poll against an 18-minute job.
