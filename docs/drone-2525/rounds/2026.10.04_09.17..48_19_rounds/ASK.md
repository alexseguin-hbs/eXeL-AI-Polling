# Drone-2525 — 19 rounds of SSSES · SPIRAL · AsM reviews, each shipping an enhancement (2026.10.04_09.17..48 CST)

> Operator, verbatim (2026.10.04): "RUN SSSES, SPIRAL, and ASM reviews in 19 rounds of updates executing enhancements over the next 6 hours for Drone-2525"

**How each round runs:**
1. Twelve reviewer lenses in three pods review the live build: SSSES 0–100 per pillar, SPIRAL forward and backward, findings with evidence.
2. One builder folds the top fixes into the next deck revision, the same way r.154 shipped.
3. Full test:ci and build, then push both refs.
4. **Wait until Verify Live confirms the live site serves that revision.** Then write the shipped record. The next round starts only after that.

**Limits:**
- Two red rounds in a row stop the run. Six hours is the ceiling.
- The fire gate doctrine is untouched: TARGET → APPROVE → FIRE, a named human approves, and it is a simulation only.

**Round 1 (r.156) carries the five queued asks:**
- labels only while marked;
- a range menu of Train Up · Train Down · Qual 40 + Restart + lane;
- lane markers on both sides ("◂ 40 · 41 ▸");
- targets inside 15 m lanes;
- the lit next button, RELOAD that calls for itself, and one plain status line.

Each later round takes its fixes from the reviewers and from the 12-shooter range round, which is
`docs/assessments/`, once persisted.
Records: `rNN.md` per round and `SCORES.md` in this folder.

## Addendum 1 (2026.10.04_09.21..12 CST) — round 1 also carries this

> Operator, verbatim (2026.10.04): "ensure selection of qual and lane selection is all understood; add red green yellow light upper right on when to start"

- **Picking QUAL and the lane must be obvious.** The range menu (Train Up · Train Down · Qual 40, Restart, lane) shows what each pick does in
  plain words. Examples: "QUAL 40 · 40 targets · 4 magazines · starts on green" and "LANE 21". Picking a lane or mode says once what
  happens next.
- **A start light at the upper right,** like a range tower:
  - **RED** — wait (not started, between positions, or finished);
  - **YELLOW** — get ready (the round is armed, targets coming up in a few seconds; in QUAL, the 3 s before each engagement and the phase
    rest's last seconds);
  - **GREEN** — targets are up, fire.

  In Train Up and Train Down it is green whenever targets stand. It is not a button. It is redundant with words for colour-blind players:
  the light carries "WAIT" / "READY" / "FIRE" under it.
- Gates: a deck QA row walks a QUAL start and checks red → yellow → green → (between engagements) yellow → green, and red at the end; one
  checks the light's words; the light never covers the magazine line, the stick or the buttons in portrait or landscape.

## Addendum 2 (2026.10.04_17.19..39 CST) — round 1 also carries this

> Operator, verbatim (2026.10.04, phone screenshot of r.154 QUAL on lane 21 after "HIT · IN THE AIMING CIRCLE", beside this file as
> `addendum2_splash_screenshot.png`): "make sure splash on drone originates from center of hit target"

- The hit effect (the splash/burst drawn when a target is hit, on the range and on drone/Capitol targets) starts at the centre of the
  target that was hit (its projected centre of mass). It does not start at the pip, the shot ray's end or the plate's base.
- The splash moves with the target as it falls, and does not appear on a miss.
- Gate: a deck QA row hits a 50 m and a 300 m plate and checks that the splash origin projects within 2 px of the plate's projected centre.

## Addendum 3 — three phone screenshots, no words (operator 2026-10-04 7:48 PM CDT, phone serving r0.152)

`addendum3_qual_eng3.png` · `addendum3_qual_eng4.png` · `addendum3_qual_not_engaged.png` — QUAL · 40 on lane 21 DOWN at MoT 1.1.
He sent no words, so this is Claude's reading (given to him in chat; he did not correct it). Round 1 treats each as an ask:
- Raw ids on the glass: `LAST T1 C-100C-L21 DOWN` → plain words ("Last: 100 m centre, down").
- Captions on unmarked targets ("150M E · 1s", "200M E · 7s") → label only while marked (his earlier pick, 4b9a6ca).
- Lane numbers print on top of each other ("21 21", "20 20", "22 22") → one marker per lane edge, "◂ 21 · 22 ▸" (db50303).
- Coloured lines (green / orange / blue) cut across the range picture → the range shows lanes and targets only.
- QUAL · 40 and CH0 TRAIN both lit, plus the Lady Bird Lake scene chip on the range → menu = Mode (Train Up · Train Down · Qual 40) +
  Restart + Lane; the rest behind MORE (bfbedad).
- No start light yet → red / yellow / green upper right (Addendum 1).
- What works and must not regress: engagements pop together (1 up, then 2 up with 7 s), hits count, an unshot target is an unfired miss,
  rounds leave the magazine.

## Addendum 4 — "and fix this splash issue captured on image" (operator 2026-10-04 7:55 PM CDT, verbatim)

> and fix this splash issue captured on image

`addendum4_splash_r154.png` — his phone on r0.154 (taken before r.156 reached the site), QUAL lane 21, 150 m E hit "IN THE AIMING
CIRCLE": the splash is a wide, flat red oval lying on the ground to the right of the target.

r.156 fixed WHERE it starts (the hit target's centre, following its fall). What his picture still shows, and r.156 still draws, is
the SHAPE: `ring(c.x,c.y,c.z,1.2+3*(1-k),16)` is a horizontal circle on the ground 1.2 → 4.2 m wide around a 0.5 m plate, so at range it
projects as a long flat oval many times the target's width. **First item of Drone round 1 (r.157):**
- The splash is a burst that FACES THE CAMERA, drawn in screen space at the projected centre of the hit target (splashCentre): one
  expanding circle plus 8 short radial strokes, in LOCK red, fading over the same 0.45 s; strokes only (vector law).
- Its size follows the hit target on the screen: radius grows from about 0.3× to 1.2× the target's projected height, never below 6 px
  (so a 300 m plate's hit is still seen at MoT 1.1) and never above 1.5× the target's projected size. It never lies on the ground.
- Same for every target kind (plates, pop-ups, doors, aircraft); a miss still draws nothing; it stays outside the world budget (r.156).
- Gate: QA row SPLASH_FACES_THE_CAMERA — at 50 m and 300 m the drawn burst is round on the screen (bounding box w/h 0.9–1.1), its
  centre within 2 px of the target's projected centre, its radius ≥ 6 px and ≤ 1.5× the target's projected size; a miss draws none.

## Addendum 5 — "splash-ring as oval from bottom of target works" (operator 2026-10-04 evening CDT, verbatim) — SUPERSEDES Addendum 4

> splash-ring as oval from bottom of target works

He keeps the oval. The flat ground ring is right; what was wrong in his r.154 picture was where it sat (beside the target, r.154's
lane-local coordinates). So the camera-facing burst of Addendum 4 is NOT built. Round 1 instead:
- The splash stays the flat ring that reads as an oval on the screen (same ring, same 0.45 s growth, LOCK red, outside the world
  budget as r.156 made it).
- It starts at the BOTTOM of the hit target: centred under the target, at its base on the ground (the plate's foot / riser base;
  for a pop-up its base; for a door or an aircraft the ground point under it) — not at the centre of mass (r.156) and not beside it.
- It never appears on a miss.
- Gate: QA row SPLASH_FROM_TARGET_BASE replaces SPLASH_FROM_TARGET_CENTRE — at 50 m and 300 m the ring's centre is the target's base
  point (world distance ≤ 0.05 m, projected ≤ 2 px horizontally under the target), it is an oval on the screen (projected width >
  height), and a miss draws none.

## Addendum 6 — phantom targets and real lane signs (operator 2026-10-05 morning, verbatim; addressed "Grok", sent to Claude Code)

> Grok, for Range on Qual and Train Up and Train Down, there are grey phantom targets.  Also the lane markers need to be on the actual "sign"   <-- 20 21 --> like attached

Attached (not saved by the chat — described here): an Army National Guard "POP-UP COURSE" photo — a green E-type pop-up silhouette on
a berm, and above/behind it a small WHITE rectangular board on a post carrying the lane numbers in big black digits, "5 6".
Reading: (1) no grey ghost silhouettes on the range in Qual · 40, Train Up or Train Down — a target is either up (drawn) or not drawn;
(2) the lane marker is a drawn sign board (a rectangle on a post, like the photo) with the numbers ON the board, "◂ 20 · 21 ▸", not
floating text beside a post.

## Addendum 7 — the lane lines (operator 2026-10-05 morning, verbatim)

> also show line of lanes from sign to sign at 100 200 and 300 markers... very faded dotted grey line.

Reading: along each lane edge, a very faded dotted grey line runs from sign to sign — 100 m → 200 m → 300 m — so the lane boundaries
read as lines on the ground. Folded into r.158 (not yet shipped when this arrived).

## Addendum 8 — test with twelve lenses, then improve (operator 2026-10-05, verbatim)

> Are we live?  Test with 12 AsM provide 111 words per AsM feedback. then improve per all 12 AsM and MoT.

## Addendum 9 — PC keyboard and mouse (operator 2026-10-05, verbatim)

> PC operations must be able to use arrows for turret and arrows and asdw for drone operations.  Once should also be able to operate mouse.  Right click should target approve, left click fire.  or T or space for target, space for approve, and F for fire.

Reading: on a PC — turret: the arrow keys aim the head; drone: WASD moves the body and the arrows aim the head; the mouse also aims
(drag/move on the picture). RIGHT CLICK = TARGET, and a right click on the amber mark = APPROVE; LEFT CLICK = FIRE. Keys: T or SPACE
= TARGET, SPACE on an amber mark = APPROVE, F = FIRE. The two-step doctrine is unchanged: nothing fires without TARGET then APPROVE.

## Addendum 10 — the signs, as in the photo (operator 2026-10-05, verbatim, three messages with two screenshots of r.158)

> Signs need to be smaller like uploaded images (realistic as photo uploaded)
> DO not cover targets with signs
> And have White/Black like uploaded image

Screenshots (not saved by the chat): r.158's sign "◂ 20 · 21 ▸" (a large outlined box on a post), and the range at 3× where the
signs are big boxes overlapping the targets. Reading: (1) the sign is drawn at its real size, like the photo's small lane board — no
screen-space enlargement to fit the words; (2) a sign never covers a target: if its words would overlap a target's silhouette, the
words are not written (the board stays, small); (3) white board, black digits, like the photo.

## Addendum 11 — "I can't read signs" (operator 2026-10-05, verbatim, screenshot of r.159 saved as addendum11_signs_unreadable_r159.png)

> I can't read signs

r.159 drew the boards at real size and wrote no numbers when they would be under 5 px, so every board in his view was blank white.
Reading: keep the signs small and white like the photo, but always readable — short numbers like the photo's "5 6" ("20 21"), black on
white at a legible minimum size; still never over a target.

## Addendum 12 — keys and mouse aim (operator 2026-10-05, verbatim, with a PC screenshot)

> T for Target, Space for Approve, and F for fire do not work.  Also if I click with mouse on target, the center of bulleye to move to that location for max use of mouse.

Found: on the built r.160 in headless Chromium, with the bullseye on a target, T → amber, Space → red, F → HIT. The likely failures on his PC:
a picker or button holding keyboard focus (the browser gives Space to a focused button), or a build before r.159. Reading: (1) the game
keys always reach the game, whatever has focus, with e.key as a fallback; (2) a LEFT CLICK on the picture moves the bullseye centre to
the clicked point (the head turns there); a left click on the red-marked target already under the bullseye fires; a RIGHT CLICK aims
there and marks / approves.

## Addendum 13 — QUAL timer and a vertical red · yellow · green light on the right (operator 2026-10-05 16.24 CST, verbatim)

> On qual, add timer and have red yellow green light on right vertical, with Red, Yellow, green as time to next set of targets (1 second per each light). if 3 targets are up, 3 seconds per target (thats 9 second for group), so Red light should indicate at 7, yellow at 8, and green at 9 (if that's the qual actual time sequence).

Reading: in QUAL · 40 only, (1) a timer that counts the seconds left on the group that is up, and the seconds to the next group while the
targets are down; (2) the start light becomes three lamps stacked vertically on the right — red on top, yellow, green at the bottom — and
counts the last three seconds of the group's window, one second each: red at window − 2, yellow at window − 1, green at the window's end
(the group is done; the next set is coming). (3) The window itself: the operator's "3 s per target, 9 s for three" is offered conditionally
("if that's the qual actual time sequence"); the program of record he supplied on 2026-09-23 (IWQ Table VI) is 1 = 5 s · 2 = 8 s ·
3 = 12 s · 4 = 16 s, so the windows stay as supplied and the lights follow whatever the window is (three targets: red 10, yellow 11,
green 12). Switching to 3 s per target is his call, flagged in the release note. Training modes keep the r.157 light.

## Addendum 14 — the mark and the approval are forgotten after each shot (operator 2026-10-05, verbatim, with a PC screenshot of T1 · 50 M RIGHT · AMBER)

> buttons for target, T
> approve, Space
> Fire, F
>
> seem to work now:
> but system forgets target was targeted or approved, having to recreate 3 step process to fire each time.  review and update

Found (r.161 source): on a HIT the fire path clears the mark and the slot (`state.desig=null`, the T-slot deleted), and the training tick releases
the box again when the target finishes falling (`rangeRelease`). In TRAINING · RESET the same target stands up again 3 s later, unmarked, so
every shot needed TARGET → APPROVE → FIRE. A MISS already keeps the red box. Reading: in TRAINING · RESET a marked and approved target keeps its
mark and its approval through the hit and the return — F fires again as soon as it stands; while it is down F holds ("COMING BACK UP") and costs
no round. The mark ends on RESTART, a lane or mode change, or a new mark. TRAINING · DOWN (the target stays down) and QUAL (each target once per
engagement) are unchanged.
