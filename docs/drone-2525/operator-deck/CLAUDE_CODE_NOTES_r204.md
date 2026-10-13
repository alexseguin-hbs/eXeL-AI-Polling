# Claude Code notes — Drone-2525 operator deck r.204 (2026-10-12)

**Asks (operator 2026-10-12, 04:00–04:08 CST, on the LIVE r.202; his words with the spelling straightened — the ask file holds them as typed):** "looks good" (QUAL 40 at 10 RDS, shot41) · "make sure if I
target once and come back I still have to approve. I should be able to target all, then come back and approve all, then fire all" · "buttons
must change to step we are on" (shot42: TRAIN UP, four red boxes, TARGET lit with the reticle on a red; two amber captions over the buttons).

Then ~10:25: "off to work; approve all your own decisions; document changes" — every decision below is taken on that and written down.

## Found first (NO REWORK)
TARGET (`markLock`, "KEPT · PRESS APPROVE"), APPROVE (`approveDesig`) and FIRE (`fireN`) already acted on a MARKED plate under the bullseye
and kept an earlier amber (r.162, `marksPersist`): target all, come back and approve all, then fire all already worked when the head was on the
plate. What lagged: the LIT button, the strip and the step toast read `state.desig` (the CURRENT mark, the last one touched), so with the
reticle on a red plate TARGET stayed lit until he pressed it; APPROVE with the bullseye on an UNMARKED plate approved the current mark behind
him; a tap marked without turning the head; FIRE lit beside a red the bullseye was not on, where FIRE refuses (one "under the bullseye" for
the glass and another for the action). Captions (`plateCaptionRects`) floored at H-44 of the HUD canvas; the button row (`#face`, DOM over the canvas) was not in
the floor, so at 3.3× an off-screen 50 m plate's caption printed over TARGET and FIRE.

## The fix — the class, not the instance
**Scope:** the solo modes — TRAIN UP, TRAIN DOWN, QUAL 40 (`marksPersist()`). A LIVE room keeps r.203's reading of the current mark (a peer's
mark under my bullseye: the current mark's step lights, and FIRE on a plate off the picture is refused) — listed under Owed.
**Invariant (a):** the glass and the actions read ONE mark, the one under the bullseye — the lit button, the strip and the step toast name
its next step (unmarked → TARGET and the recital names THAT plate — "150 M RIGHT · PRESS TARGET" (his 18:40) — amber → APPROVE, red → FIRE only with the bullseye on it, else AIM ON IT — and the FIRE button and AIM ON IT follow
`fireOnIt` in EVERY mode, the challenges and a LIVE room included, because `stepFor` reads it wherever a red mark is; the stop light is the
range's light and stays green while the range is hot); in every solo mode — TRAIN UP, TRAIN DOWN and QUAL 40 — a tap turns the head onto the
tapped plate and the double-tap still fires what the first tap touched when the second tap lands on it, never on blank sky (DD-13a, below);
APPROVE on an unmarked plate holds NOT_MARKED and touches no other; with nothing under the bullseye, the current mark's step (an
amber's APPROVE; nothing for a red); a step toast ends when the plate under the bullseye changes after it rose and never before its own
confirmation shows. One mark for the glass and the actions: `markUnderBullseye()`; `fireOnIt(s)` — fireN's ONE on-target rule lifted out so the lit button, the
strip and the action read the same (a plate: the bullseye on its outline, `pipOn`; a ring: the bullseye ring; anything else — a pop, a door,
a UAV — within LOCK_REACH_PX; never on the map); `stepFor(mark)` (FIRE only when `fireOnIt` holds); `approveWorksHere(d)` and `fireWorksHere(d)` become tests of A MARK (the current one by default, so every existing caller is unchanged);
`hudPhase` names the same mark (AIM ON IT for a red the bullseye is not on; the AI's sentence TURN ONTO IT · THEN APPROVE); `approveDesig`
holds NOT_MARKED (NOT MARKED · <plate> · PRESS TARGET FIRST) on an unmarked plate under the bullseye — after the down-holds, only for a plate
mark, so the RED, solo and peer-approval rows are untouched; in every solo mode the single tap aims the head (as `goToT`) and
`state._tapObj`/`_tapT`/`_tapX`/`_tapY` keep what the first tap touched for 320 ms so the double-tap fires it even after the head has turned —
only within 40 px of the first tap; a second tap on blank sky is still refused (r.131) (the fourth round: the fifth cut fired the first-tapped
plate from a sky tap, a scored round in QUAL 40; the fifth round: the sixth cut kept QUAL 40 out of the tap-aim, and on his first screen a tap
on plate A with the bullseye on plate B said NOW PRESS APPROVE while TARGET was lit, and APPROVE then refused — the tap-aim is now every solo
mode, so the toast, the lit button and the action agree);
`toast(m, plate)` carries its plate and what was under the bullseye when it rose, and `paintCues` ends it only when that changes — the
come-back tap's toast (a tap on a marked plate) and the focus toast now carry their plate too and name it in words (the seventh round: a raw
id that outlived the head on the touch path of "come back and approve all"); the peer messages (NET AMBER, PEER MARK) name the plate in
words. NOT_MARKED is a HOLD row on the record, booked against NONE with the plate under the bullseye in the row (r.148: a row never names a
plate nobody marked): `metricsOf().hiHolds` counts it, `sssesCore().holds` counts it (Succinctness −10 past eight holds), and outside a
LIVE room it travels to a linked peer as THE OTHER SEAT · HOLD — DD-13b, a hold is a hold; the tap-aim in every solo mode removes its main
source (a press of APPROVE with the head on another plate). The second
round caught the first cut parsing the toast's text — the FIRE-on-amber refusal and the AI's NOT UNDER YOUR BULLSEYE sentence vanished on
the next frame — and the silent APPROVE behind his back. The third round caught the tap-aim breaking the double-tap, the plate-only FIRE
test leaking onto the Capitol pops (now `fireOnIt`), and the APPROVE refusal placed before the down-holds breaking the RED and peer rows.
**Invariant (b, every mode, gated solo):** a caption and a board's words never cover a control or a line of the HUD; a caption that would is
moved — the other side of its plate, then below it, then up to the line — and dropped only when no place is free; a mark off the picture keeps
its edge caption (r.203's reminder). `hudKeepOut()` is the ONE keep-out list — the DOM controls, cards and lines over the stage in its own
pixels: the button row, the sticks, RELOAD, the counter, the stance box, the light, the full-screen and menu buttons, the strip and the score
line, the magazine line, the board, the toast, the counter card; the sticks with their label band (y0−16); and the words the painter itself
draws on the stage — the corner's two lines (the lane label at the 13 px it is drawn with and the FPS at 12 px, on `hudStatusY`'s rows,
right-aligned at W−12) and the LOCK line (60, H−36 and H−20), measured where they are drawn — cached per picture size and a 200 ms window
(never across a rotation; bypassed while the QA is armed); the toast's band is kept once seen so captions do not jump each time a toast rises
and clears. `boardLabels` takes the same list, and a board's words that would touch a control climb the post or
drop below it — past a target, as far as the picture allows, never sideways (r.159: the sign stays on its post's line) — before they are
dropped: r.157's rule (my nearest boards are always written) and r.204's (never over a control) both hold. At 667×375 (a small landscape)
r.203 printed my lane's 100 m numbers over RELOAD and the counter; the fifth cut dropped them; now they sit below the cards, on their posts'
lines, and the painter draws the post on up (or down) to the moved sign in the pieces that clear every control (6 px off), every word, every
standing target and the bullseye box, so a moved sign keeps its post and the post never crosses a card, a word, a target or the reticle (the
fifth round found the signs 118–178 px below their posts in landscape; the sixth found the unclipped post through RELOAD and the reticle;
the seventh found it through his targets — r.159); the board row counts the crossings against all of them; the plates still show through
the 0.55-alpha cards (pre-existing, owed); a dropped sign still
leaves the lane marker's own post (the twelve Masters' H2, owed) — DD-13d (`shot-667-pair` in this session's record). `hudKeepOut`'s cache is keyed on
the picture's size and a 200 ms window, never on the tick (the fifth round: keyed on the tick it was rebuilt every frame — 6.3 ms vs 0.9 ms
per frame at 6× throttle — and PAUSE followed by a rotation kept a stale list, captions over TARGET until RUN). `plateCaptionRects` bounds a caption by `captionCeiling(H,x0,x1)` — the band ABOVE the caption, not one line across the picture (the
seventh round: in landscape one ceiling pulled captions off their plates and onto the reticle) — and `captionFloor(H)` from that list, keeps
a caption within 40 px of a plate that shows in the open stage (a plate hidden under the band or the controls keeps its edge caption), and
moves before it drops; `boardLabels` takes the same list. The first cut floored at the button row alone (the first round swept
every aim and found captions on the stick, RELOAD, the counter and the light); the second cut dropped a colliding caption and lost most
landscape captions at 1× and every off-picture reminder (the second round); the third clamped at 14 px and lost the off-top captions, left
the stick label band uncovered and let the long strip clause wrap at 360 (the third round); the fourth cut's own 3.3× picture, read before
the fourth round, showed a 50 m caption printed over the FPS — the corner and LOCK lines are painted on the canvas, not DOM elements, so
neither the painter's list nor the row's saw them: the fifth cut lists them in both, lets a caption climb past every line it meets (the
two-line corner defeated the one-step move and dropped the caption), and has the row measure them on the live canvas (the QA block's W,H
are read before the range layout, which put the row's LOCK rect 100 px above the painter's; the r.157 board row read the same stale W,H and
now reads the live canvas too) — the class, not the instance, each time. The rows' cost: the caption row collects the stage's elements once
per layout and re-reads their rects at every look (the fourth round measured boot +30 % when it re-collected 446 elements sixty times).
Nothing else moves: no geometry, no raster, no colour, no new control.

## Simulated (the exact bytes)
The r.204 draft went through four Spiral/SSSES rounds: the first refused the button-row floor and the lagging toast; the second refused the
text-parsed toast, the silent APPROVE on an unmarked plate, FIRE lit beside a red the bullseye was not on, the dropped captions and the score
line missing from the keep-out; the third refused the broken double-tap, the 14-px clamp, the stick label band, the FIRE test on the pops and
the wrapped strip; the fourth cut was refused by my own reading of its 3.3× picture (a caption over the FPS); the fourth round refused the
fifth cut — a second tap on blank sky fired the first-tapped plate (TRAIN UP and QUAL 40; r.131), my lane's 100 m boards dropped at 667×375
behind RELOAD and the counter with CI blind at 390×844 and 844×390 alone (r.157), neither new row running QUAL 40 — and noted the corner label
measured at 12 px but drawn at 13, the row's boot cost, the record's scope line (the FIRE light applies in every mode), NOT_MARKED in hiHolds,
thirteen looks not twelve, D5 among his D numbers, the harness cited but not in the repo; the fifth round refused the sixth cut — on his first
screen (QUAL 40) a tap with the head on another plate said APPROVE while TARGET was lit and APPROVE then refused (the QUAL 40 exception to the
tap-aim, reversed), and both sky-tap legs tapped OUTSIDE the canvas, so the gate for the sky double-tap could not go red (now a point inside
the picture where `pickNear` finds nothing, both pointerups counted on the canvas, the toast judged) — and noted the keep-out cache keyed on
the tick, the touch leg's fixed sleep (now a wait on every boot row), Verify Live's 12-minute job against a deck QA three times longer (18),
the foil exports drifting since r.196 (test:foil-model red on every ship since the first domain bump after r.165's export; regenerated in
bookkeeping now, in the chain — Deploy's gate has other reds since 63eb251d and stays red), stale sentences in this file; the sixth round
refused the seventh cut — the drawn-on post ran through his RELOAD and stance pictures and beside the reticle with no row to see it, and the
record still carried the first cut's scope and the per-tick cache in five places; the ninth cut. Then the **eighth round** read his own shot45 scene and found invariant (a) broken where he had just seen it: after any hit,
with the bullseye on an unmarked plate, `hudPhase` fell through to the LAST line ("LAST · 50 M LEFT · DOWN") while TARGET was correctly lit —
the buttons followed the bullseye, the recital did not. The tenth cut answers it: the unmarked-plate clause before the LAST line
(`<PLATE> · PRESS TARGET`, `PRESS RELOAD` on an empty magazine), **DD-13e** (nothing under the bullseye lights nothing and recites no other
plate's step; the MAP keeps the current mark, it has no bullseye), two new legs in BUTTONS_FOLLOW_THE_BULLSEYE at his own state, r.157's
NO_RAW_IDS_ON_GLASS widened to accept the new recital (the invariant there is the raw id, and it still holds), and the keep-out list computed
once per QA look (the boot had grown; it is ~1.9 s against ~1.5 s on r.203 on this machine, from ~2.2 s before the cache).
Earlier, the eighth cut: the post clipped and counted, a
peer's hold in words, PRESS RELOAD on an empty magazine, the toast's band kept, the touch leg at both orientations, the sentences rewritten;
the seventh round refused it — the post ran through his standing targets (clipped against controls and the bullseye, never against
targets), landscape captions were pulled onto the reticle by one full-width ceiling, and the come-back tap's toast showed a raw id and
outlived the head; this is the ninth cut: the post clipped by targets too and counted against them, a per-caption ceiling with the 40-px
plate rule, the tap toast in words ending with its plate, the NOT_MARKED hold booked against NONE, the strip's amber clause on an empty
magazine, the touch leg judging the come-back tap, DRN-11.12 superseding DRN-11.11, the deck-qa summary per size.
`scripts/drone-trainup-play.mjs` (in the repo) through the deck's own buttons at 390×844: thirteen looks — unmarked→TARGET ×3,
marked→APPROVE, back on each amber→APPROVE ×3, approved→FIRE, an unmarked plate while reds stand→TARGET, back on each red→FIRE ×3, an unmarked
plate again→TARGET — the lit button equal to `nextStep()` at every look;
three fired, three hits; then a fourth plate marked and approved by the buttons and fired by a TOUCH double-tap on its outline after the head had
been turned off it — the first tap turns the head back, the second fires; then a fifth, red, tapped once and then blank sky inside the picture
(a point where `pickNear` finds nothing): refused, no round, DOUBLE-TAP THE RED BOX TO FIRE. Fifteen look rows in the timeline (thirteen in
the button leg, two in the sky-tap leg).
At 3.3× with six marks: every caption inside the ceiling and the
floor of the keep-out list, 0 words on any control or line — the 50 M RIGHT caption climbs above the corner's two lines; a mark off the
picture keeps its edge caption. Pictures: `1-three-amber`,
`2-back-on-first-amber`, `3-three-red-on-unmarked`, `4-back-on-first-red`, `5-three-fired`, `6-captions-at-3.3x`, `7-double-tap-fired`,
`8-sky-tap-refused` (this session's record). The QUAL 40 play-through (`scripts/drone-qual40-play.mjs`, in the repo) on these exact bytes —
its log names the revision and the sha: 40/40 through the buttons, three reloads, the range cold, 0 page errors.

## Gates
`BUTTONS_FOLLOW_THE_BULLSEYE` (TRAIN UP and TRAIN DOWN; the strip; a non-silent pass: the step toast shows on its own plate, ends when the
bullseye leaves it, the FIRE-on-amber refusal stays; a red the bullseye is not on lights nothing and says AIM ON IT; APPROVE on an unmarked
plate holds NOT_MARKED and touches no other; a confirmation for a plate the bullseye is not on stays and ends on the next plate; QUAL 40 in a
real exposure window — two up, marked, come back and approve both, then fire both, two hits) and
`CAPTIONS_CLEAR_OF_THE_CONTROLS` (the row's OWN list of every visible element over the stage, not the painter's, the `::after` bands included:
sixty looks — 1×, 2×, 3.3×, 5×, 8× × the far and the near plate × pan −6/0/+6° × tilt −4/0° — 0 words on any element; every mark captioned at
every look; then QUAL 40 with the stance box on the row, twelve looks, the same) in the deck's boot QA (four sizes in `drone-deck-qa`; the state
and the qual class restored in `finally`), `tests/deck-qa-manifest.mjs`, `scripts/drone-deck-qa.mjs` — which now runs FOUR viewports (390×844, 844×390, 375×667, 667×375; the manifest's
`EXPECTED_RED_AT` declares EYE_SCALE_12_IN red at 667×375 only, red there on r.203 as well) and a TOUCH leg (two taps fire after the head
turned; a red then blank sky inside the picture fires nothing and says DOUBLE-TAP THE RED BOX TO FIRE; in QUAL 40, in a real two-plate window
with the bullseye on plate B, one tap on plate A turns the head onto A, the toast and the lit button both say APPROVE, APPROVE approves A with
no NOT_MARKED hold, and red-then-sky spends no round; coming back by tap, the toast names the plate in words and ends when the head moves to
another plate; the leg waits for every boot row, not a sleep; its tally is printed per size with the touch count); `tests/drone-playable.test.mjs` holds the
helpers (the 40-px clause, the layout-keyed cache, the post drawn on) and refuses the old floor, the boards' old four-rect list and a QUAL 40
exception to the tap-aim; `BOARD_LABELS_NEVER_OVERPRINT` counts the drawn post pieces against every control, word, target and the bullseye (0 crossings);
`CAPTIONS_CLEAR_OF_THE_CONTROLS` also holds every caption within 40 px of its plate at every look.
The touch leg runs at 390×844 and 844×390. Verify Live's job allows 18 minutes (the deck QA runs three times longer). The foil exports
(`docs/drone-2525/exports`) carry the domain revision and are regenerated by the bookkeeping, so `test:foil-model` is green again (red since
r.196, the first domain bump after r.165's export; Deploy's gate has other reds since 63eb251d and stays red) and in the chain. Not yet a
gate: the LIVE room's lit button; the challenges' FIRE light (right when probed — FIRE on the red pop, AIM ON IT off it); PAUSE then a
rotation with qaArmed off (the cache key covers it); an empty-magazine look (the strip now says PRESS RELOAD).

## Owed
- **Next, in his order, numbers not fixed here**: his 20:44 words ("remove all text from middle; targets only" — the per-plate captions off
  the picture, his lane signs kept, DD-14; shot49, persisted at de054f3f), then his 18:25 range officer's start at the table (shot43), then
  the twelve Masters' QUAL 40 fixes (the fall ends with the window first), then R-CORE in the shared format · the LIVE room's lit button (the current mark's step,
  r.203's reading; FIRE lights only on the red under the bullseye there too) · captions still overprint each other and their own boxes at every
  zoom and can sit on the bullseye ring (the ring is not in the keep-out; 86 on the ring and 8 on the dot in the fourth round's sweep, the same on
  r.203) and a near plate shows through the button row at 3.3× (pre-existing, on the record) · the strip's second line wraps onto the magazine
  line at 390 and 375 (pre-existing) · EYE_SCALE_12_IN at 667×375 (pre-existing, declared) · 360-px phones are not among the four sizes
  (FIFTY_AT_THE_EDGES red at 360×780 and 360×640, EYE_SCALE_12_IN at 780×360 and 640×360 — red on r.203 too, undeclared) · a runtime leg for
  PAUSE then a rotation with qaArmed off · the QUAL play-through drives one plate at a time; target all, approve all, fire all at wall time
  in a two-plate exposure is proven by the row's leg, not yet by the harness · the other boot rows that read the QA block's W,H · he said
  "target all": the row proves three and the deck does all eleven (Athena's probe: 33 of 33 lit right) · R-CORE in the shared format.
- Decided on his ~10:25 authority ("approve all your own decisions; document changes"), each one line to reverse: **DD-13a** a tap turns the
  head onto the tapped plate in every solo mode, QUAL 40 included (the first cut kept QUAL 40 out; the fifth round showed the toast and the
  lit button disagreeing on his first screen) · **DD-13b** a NOT_MARKED hold is a hold: counted in hiHolds and sssesCore, sent to a linked peer
  outside LIVE · **DD-13c** the red box is a marker around the plate; FIRE works on the plate (r.141's true size, `pipOn`) and inside the box but
  off the plate no button lights and the strip says AIM ON IT (Athena: 51 % of the box at 3.3×, 21 % at 1× is off the plate) · **DD-13d** a
  board's words with no place clear of a control move along the post's line, as far as the picture allows, and the post is drawn on to them
  (667×375 shows it) · **"dont say lane 21"** = the intro button (done in r.196); the LANE 21 strip on the range screens stays · the double-tap
  keeps what the first tap touched for 320 ms (the deck's own double-tap window), within 40 px.

Artefact commit `450e156` · deck sha256 `2085cd150d08f886b4f8236ed8d8f3f60c2494b6608afed08c7260298039db9b`.
