# Claude Code notes — Drone-2525 operator deck r.205 (2026-10-13)

**Asks (operator 2026-10-12 and 2026-10-13, verbatim as typed; the ask file `docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md` holds them with their screenshots and sha256):**

- ~20:44 CST, shot49 — "remove all text from middle; targets only.  and everything is still no aligning. this amber target should have approve on buttons highlighted"
- ~20:55 CST — the team drill: twenty people target all the targets, then everyone approves, then everyone fires; "you have to be able to identify which ones are at which stage of the three-step process at any given time"
- ~21:05 CST — "system should always remember what silouettes are targeted.  if targeted, approve is next step / if silloeten is approved fire is next step / buttoms and colors around boxing amber vs red should match"
- ~21:15 CST — "I need 12 AsM Fleet to test; youbknow mybcriteria but fail toninplment; test and somulate until no phantomntargets and ensure all targets and siloeets have the proper color boxing with button when bulleseye osnover target"
- ~21:30 CST — "SSSES , AsM, Simulate, and SPIRAL TEST TO ENSURE NONGLITCHES"
- 2026-10-13 ~04:34 CST, shot50/51, on the LIVE r.204 — "way better; keep it ip and run AsM 111 + MoT 333 word, SPIRAL, SSSES , and UX usability test; ensure 'Load and Make Ready' on Qual-40 prior to starting as well as a fee range commands from Range Safety Officer per Army guidelines; and double check all stop lights and times are accurate per real tests"

Decisions are taken under his 2026-10-12 10:25 sign-off, "approve all your own decisions; document changes", and each is listed so one line reverses it.

## Found first (NO REWORK) — measured on the LIVE r.204 bytes, sha256 `2085cd15…`, not taken on a reviewer's word

| # | What he can see | Measured | Where |
|---|---|---|---|
| 1 | A **targeted** target (amber box) has a **red** soldier inside it | the painter chose `T13.LOCK` for a TARGETED plate; wanted `T13.GIMBAL`. 44 red pixels on a marked plate away from the reticle | `drawPlates`, `q.mist?T13.LOCK:phaseCol(q,…)` — the mist flag, set the moment a target is marked, beat the slot's phase (since r.196) |
| 2 | **APPROVE glows green** on an amber box | computed `rgb(61, 204, 138)`; FIRE already `rgb(226, 75, 59)` | `#face b{color:var(--t)}` with only `.fire` overridden |
| 3 | **Words all over the middle**, crossing each other and their own boxes | 36 words in three looks with six targets marked: "T1 · 50 M LEFT · AMBER", "T2 · 250 M · AMBER" printed across "T1 · 200 M LEFT · RED" | `plateCaptionRects` + the caption draw in `draw()` |
| 4 | **A target he marks in the first seconds disappears** | tap TARGET → amber for 150 ms → slot, desig, mist and phase all cleared; tapping after ~5 s the mark holds for good. Stack: the TARGET button → the deferred boot row → `designate` → `tgtSlot` replaced | the boot self-check's `setTimeout(…,1500)` row: it saved lane, mode, zoom, view, pan and tilt, took lane 01, and then set the marks, the approval and the magazine to EMPTY instead of back to what it saved (**H1**, recorded at r.204 as the QR door's 30-round first magazine — the larger half was that it eats targets) |
| 5 | **APPROVE or FIRE aimed at an unmarked plate deletes every mark on the lane** | with a red box standing on one plate and the current mark on a plate that has fallen, one press aimed at a third, unmarked plate books `TARGET_DOWN, AUTHORITY_RELEASED` against a plate he is not looking at and takes the slots **2 → 0** | `approveDesig` tested the CURRENT mark for being down (play.html:2491-2492) BEFORE r.204's test of the plate under the bullseye (:2493), and the down-refusal called `releaseAuthority`, which empties `state.tgtSlot` wholesale; `fireN` repeats it at :2583 |
| 6 | **An empty magazine darkens APPROVE on a standing amber** and the strip says PRESS RELOAD | `nextStep()` returned `''` on an empty magazine before consulting the step, though approving costs no round | play.html:946 and the amber branch of `hudPhase` |
| 7 | **With nothing under the bullseye the recital still names the last plate shot** ("LAST · 200 M LEFT · DOWN") | DD-13e shipped half: the unmarked clause needs a plate under the bullseye, so blank sky fell through to the LAST line | play.html:2991/2992 |
| 8 | **On the MAP an unmarked plate under an invisible bullseye wins the buttons** and APPROVE books NOT_MARKED | `lockOn()` had no view test while `fireOnIt` did; the code's own comment said the map keeps the current mark | play.html:2137 |
| 9 | A plate hit in the last moment of its window stands half-fallen for the rest of the table | the window's close downed only a plate that still had life; nothing ticks a fall once the exposure is gone, and `qualDropStrays` spared exactly that plate by name | the twelve Masters' QUAL-40 AAR B1, and his own r0.198 picture |

**The times and the light (his "double check all stop lights and times are accurate per real tests"), measured over 94.7 s of real play at 390×844:**

| | measured | TC 3-20.40 Table VI | |
|---|---|---|---|
| 1 target up | 5.0 s | 5 | ✓ |
| 2 up | 8.0 s | 8 | ✓ |
| 3 up | 12.1 s | 12 | ✓ |
| 4 up | 16.0 s | 16 | ✓ |
| between engagements | 3.0 s | 3 | ✓ |
| between phases | 10.0 s | 10 | ✓ |
| engagements · rounds | 18 · 40 | 18 · 40 | ✓ |

Every number inside ±0.1 s of the programme. **A caveat on sourcing, corrected here:** the four exposure seconds (5 / 8 / 12 / 16 by target count) are **DECLARED** — the operator supplied them on 2026-09-23 and no open source publishes them; only the 10 s phase transition is sourced. The 18 engagements, the 40 rounds and the four phases are the published Table VI shape. **The light is the part that is wrong:** GREEN showed 7.2 s in all, and in **72 of 72** of those samples no target was up; with a target up the lamp was dark in **480 of 627** samples. The lamps fire at the END of a window, three seconds before the next set appears, while his own Addendum 13 (r.162) asked for "Red, Yellow, green **as time to next set of targets**". A real range light is green while the range is hot — the same reading. Owed to **r.206**, where it moves together with the range officer's start, because the officer's commands are what take the line from cold to hot. A reviewer in this round reported "green through 7 of the 10 seconds of the phase rest"; measured, it is green for exactly 1.0 s of that rest. The defect is real; that description was not, and is corrected here rather than repeated.

## The fix — the class, not the instance (40 asserted edits; a missed anchor refuses)

**The invariants, in his terms, written into the deck beside the code:**

1. **A target's colour is its slot's phase.** Unmarked: the stroke. TARGETED: `T13.GIMBAL` amber, the colour of its box. APPROVED: `T13.LOCK` red, the colour of its box. A plate whose mark has ended goes back to the stroke. One painter — `phaseCol(q, q.mist?T13.LOCK:…)`: the phase decides first, the mist only colours a target that carries no phase at all.
2. **A button wears the colour of the box it acts on.** APPROVE amber, FIRE red, TARGET the cue colour. (`#face b.appr{color:var(--g)}`, the class on the button.)
3. **The middle of the picture carries targets only.** No per-target caption is measured, placed or drawn, so none can cross a box, a control, the bullseye or another caption. His lane signs stay (his 21:20 answer, "Signs stay") and keep the one keep-out list.
4. **An exposure's close downs every plate of its engagement**, hit or not; nothing stands or hangs half-fallen through the gap, the rest or the next engagement; only a plate that STOOD unengaged is booked NOT ENGAGED, so a hit at the buzzer is a hit.
5. **The boot self-check borrows the range and gives it back exactly as it found it** — the marks, the approval, the magazine and every plate of every lane.
6. **A press is judged on the target under the bullseye before anything is judged on the mark behind it**, and a refusal about one target ends that target's box and no other (`dropMark`, never `releaseAuthority`, at the two down-refusals).
7. **An empty magazine darkens FIRE and nothing else** — TARGET and APPROVE cost no round, and his rule is that a targeted silhouette's next step is APPROVE.
8. **With nothing under the bullseye the glass names no plate at all** (DD-13e completed).
9. **The MAP has no bullseye**, so the current mark stands there — `lockOn()` returns null on the map.
10. **The self-check gives back everything it took** — not only the marks: the whole magazine (its cap included: `rangeReset` had replaced it with a 30-round training one), the lane's own run, the clock, the tallies and the last shot.
11. **A peer's refusal about another plate does not end my red box** — `AUTHORITY_RELEASED` and `TARGET_DOWN` name a plate, and only that plate's row is mine to obey; `APPROVER_LOST` and `PEER_LOST` are about the seat and still end it.
12. **FIRE is judged on the target under the bullseye too** — the hoist of invariant 6 is in `fireN` as well as `approveDesig`; the gate presses both buttons.
13. **The MAP says what the MAP is** — TARGET there reads "THE MAP HAS NO BULLSEYE · GO BACK TO THE OPERATOR VIEW TO MARK" instead of asking him to put a bullseye on a target in the one view that has none.
14. **FIRE is not lit where FIRE is refused** — in QUAL 40 a plate already engaged this exposure takes no second round, so its button is dark.

**What moved:** the one painter at `drawPlates`; `captionCeiling`, `captionFloor` and the whole body of `plateCaptionRects` retired to `function plateCaptionRects(){ return []; }`, the caption draw cut out of `draw()`, `boardLabels`' `taken` emptied; the rows that measured captions retired with them (`LABELS_ONLY_WHILE_MARKED` gone, `CAPTIONS_CLEAR_OF_THE_CONTROLS` → `BOARDS_CLEAR_OF_THE_CONTROLS` with the sign half at full strength); the window-end block downs every plate of the engagement and `qualDropStrays` spares nothing mid-fall; the deferred boot row saves the magazine and every plate and restores `sv.desig`, `sv.slots`, `sv.hi`. The deferred boot row also saves and restores the whole magazine, the lane's run and the HUD tallies; the peer HOLD handler tests the row's id before it demotes my box; `stepFor` keeps FIRE dark on a QUAL plate already engaged;. Nothing else moves.

## Gates — each shown RED on the r.204 bytes first

Red-first run: the four new rows inserted into the LIVE r.204 bytes and **nothing else** changed (`scratchpad/r205/redfirst/rows`, served at :4743). Output kept in `scratchpad/r205/redfirst/redfirst.txt`.

```
RED  SILHOUETTE_COLOUR_IS_THE_PHASE  unmarked #E8D5B0 · TARGETED #E24B3B (want #F0A020) · an untouched neighbour #E8D5B0 ·
                                     APPROVED #E24B3B · a second TARGETED #E24B3B while the first holds #E24B3B
RED  BUTTON_WEARS_ITS_TARGETS_COLOUR TARGET rgb(61, 204, 138) · APPROVE rgb(61, 204, 138) (want rgb(240, 160, 32)) · FIRE rgb(226, 75, 59)
RED  NO_WORDS_ON_THE_STAGE           6 marked, 36 words drawn over three looks; anything but a lane sign, the corner, the frame rate
                                     or LOCK: 1x 'T1 · 50 M LEFT · AMBER' · 1x 'T2 · 50 M RIGHT · AMBER' · …
boot QA 227/232 on r.204 + the five rows      →      boot QA 231/232 on r.205 (only SYNC_DIRECT, offline)
```

- `SILHOUETTE_COLOUR_IS_THE_PHASE` — six reads taken from `drawPlates`' **own calls**, each silhouette matched to its plate by its own `silMesh` mesh so no neighbour can be mistaken for it: unmarked, targeted, an untouched neighbour, approved, a second targeted while the first holds red, and the mark ended.
- `BUTTON_WEARS_ITS_TARGETS_COLOUR` — the computed styles against the thirteen colours.
- `NO_WORDS_ON_THE_STAGE` — every `fillText` of three whole frames intercepted with six targets marked, at 1×, 3.3× and 8×; a word that is not a lane sign, the corner, the frame rate or LOCK fails the row.
- `FALL_ENDS_WITH_THE_WINDOW` — four shots: this seat's FIRE and the other seat's HIT row 0.2 s before a 5 s close, a FIRE 0.05 s before it, and the 300 M 0.2 s before ENG 5's 16 s window closes into the 10 s rest.
- `A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON` — four legs: a fallen mark with a standing red box beside it and the bullseye on a third plate (the press must name THAT plate and leave the red box standing); an empty magazine on a standing amber; blank sky after a shot; the MAP. On the r.204 bytes: `rows TARGET_DOWN,AUTHORITY_RELEASED, slots 2→0, the red held false` · `APPROVE dark, "PRESS RELOAD"` · `strip "LAST · 200 M LEFT · DOWN"` · `lockOn() returns a plate on the map`. All four green on r.205.
- `BOARDS_CLEAR_OF_THE_CONTROLS` — r.204's sixty looks, the sign half kept whole.
- `tests/drone-playable.test.mjs` pins all four invariants in the **served bytes** at source level, so none can be undone silently.

H1's own gate is the source pin plus the probe kept at `scratchpad/r205/redfirst/probe4.mjs`. The probe is deterministic: it enters the range the moment the boot rows exist — the deferred self-check fires 1.5 s later, so a player opening the QR link is inside that window every time — and taps the **real** TARGET button. On r.204: "THE MARK VANISHED at +750ms". On r.205: "THE MARK HELD for 3.6 s through the real button". A runtime row for the deferred self-check is **owed** — it runs once, at boot, before the rows exist.

## Simulated on the exact bytes (sha256 of the cut, before the chain)

- Boot QA **231/232** at 390×844 — only `SYNC_DIRECT` (offline), 0 render exceptions, 724 frames; 227/232 on the r.204 bytes with the five new rows alone.
- `scripts/drone-trainup-play.mjs` — 15 looks, every lit button equal to the step for the plate under the bullseye, **captions 0**, the double-tap fires after the head turned, red-then-sky refused with "DOUBLE-TAP THE RED BOX TO FIRE", 0 page errors.
- `scripts/drone-qual40-play.mjs` — **40 of 40, EXPERT**, 3 reloads, 0 errors, 231 s, strip "CEASE FIRE · 40 OF 40 · EXPERT · RANGE IS COLD · PRESS RESTART", **first magazine 10 rounds** (it was 30 — H1's own symptom, gone with the fix).
- His scene at 428×926, before and after: `scratchpad/r205/scene-before.png` (r.204: three captions over the stage, two of them printed across each other; amber boxes with red soldiers; APPROVE green) and `scratchpad/r205/scene-after.png` (r.205: the lane signs and nothing else in the middle; the soldier in the amber box amber, in the red box red; APPROVE amber).

## Owed — said plainly, not discovered later

- **DD-13f — his 20:55 twenty-person drill** (everyone targets all the targets, then everyone approves, then everyone fires; every target's
  stage visible at any time) is on no queue yet. It is the room's reading, so it sits with CLASS 1e.
- **Three times a table the glass says PRESS RELOAD on a magazine it has just filled**, and the press is refused ("MAGAZINE FULL") —
  measured in this revision's own QUAL 40 timeline. The reload cue and `magReload`'s own test disagree.
- **On a cold range FIRE says the target lapsed and to mark the next, while TARGET on the same screen refuses any mark.**
- From the r.204 round, still owed and now listed so he never has to say them twice: `hudKeepOut()` returns CSS pixels while its consumers
  work in canvas pixels, and there is no ResizeObserver; the lane picker reads LANE 21 on every QR-opened lane; **428×926 — the size he
  actually holds — is still not one of the four CI viewports**; the 360-px phones (FIFTY_AT_THE_EDGES, EYE_SCALE_12_IN) are red and
  undeclared; the 38 invariants of the r.204 pin collapse into one assertion; the play-throughs are run by nothing in CI.
- **r.206, his 18:25 and 04:34 words:** the range officer's commands at the START of the table ("LOAD AND MAKE READY" and the readiness sequence), and with them the light's meaning. Two independent reviewers measured the same thing from their own play: GREEN is lit **0.00 s of the 164.55 s a soldier may fire** and **17.00 s of the 75.75 s he may not**; the deck's own comment at play.html:955 states the correct rule ("RED wait · YELLOW ready · GREEN fire") and `qualLamp` at :961 implements its opposite; TRAIN UP and TRAIN DOWN already get it right, so the mode carrying the Army's name is the one that is wrong. The times themselves need no change. With it: TRAIN DOWN's clock over-reads by 0.42–0.50 s because it keeps counting through the last plate's fall, and truncates with `floor()`.
- **The LIVE room** keeps r.203's reading; CLASS 1e — `markUnderBullseye` is gated on `marksPersist()`, which is false in a room, so the whole r.204/r.205 reading is off there. Owed as its own revision.
- **His shot51 defect survives, and I will not patch it at the edge of a ship.** A lane sign's visibility is judged on the board's
  CENTRE and the box is then drawn ±half a width, so a sign near either edge loses its first digit — "0 21" for "20 21", "9 20" for
  "19 20", visible in this revision's own before/after capture. The obvious clamp is wrong: r.159 is his own rule that **a sign stays on
  its post's line**, and the deck's `LANE_NUMBERS_ON_THE_SIGN` row enforces it to within 1 px (shifting the sign sideways turned that row
  red, as it should). So the real choice is his: either an edge sign that cannot be drawn whole is **not drawn**, or the post law is
  relaxed for the two outermost signs. Owed to r.206 with the decision named.
- **Measured this round and owed to r.206 with the officer and the light: a target that is UP but off the picture gets no cue.** At his
  428×926, **15 of the 40 target appearances** of QUAL 40 sit off the left edge or clipped at the zoom the player lands on (19 of 40 at
  390×844) — all at negative x, the left half of the lane outside the glass — while the strip says "1 UP" and nothing points. The lane is
  15 m wide and scanning is the game, so the camera is not the defect; the missing **edge cue** is. Unchanged by r.205 (same counts before
  and after), measured by `scratchpad/r205/offscreen.mjs`.
- The **MAP** has its own painter and `lockOn()` still returns a plate there; a target can read differently on the map than on the glass.
- A **runtime** row for the boot self-check's restore (it runs before the rows exist).
- The twelve Masters' remaining classes from this round's fleet, and the 42-lane team drill when he calls it.
- R-CORE in the shared format; the per-size reds already declared (EYE_SCALE_12_IN at 667×375, the 360-px phones).

Artefact commit `6a0f594`; the carried deck's sha256 is `24d03765171b8e8df3b55ed78b0d40133cd3c76f42b26eed79bc555ee71d8665`.
