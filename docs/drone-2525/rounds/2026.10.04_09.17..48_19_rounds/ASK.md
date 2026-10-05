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
