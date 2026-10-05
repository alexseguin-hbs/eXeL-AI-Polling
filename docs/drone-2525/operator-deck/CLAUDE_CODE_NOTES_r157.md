# CLAUDE_CODE_NOTES_r157 — Drone round 1 of 19 (2026-10-05)

## Operator asks
> splash-ring as oval from bottom of target works

(`docs/drone-2525/rounds/2026.10.04_09.17..48_19_rounds/ASK.md`, Addendum 5 — the FIRST item of round 1; it supersedes Addendum 4,
so the camera-facing burst is not built.) Round 1 also carries the five queued asks (labels only while marked; the range menu Train
Up · Train Down · Qual 40 + Restart + lane; lane markers on both sides "◂ 40 · 41 ▸"; targets inside 15 m lanes; the lit next button,
RELOAD that calls for itself and one plain status line), Addendum 1 (picks understood; a red/yellow/green light at the upper right on
when to start) and Addendum 3 (his three 7:48 screenshots read as asks). The asks themselves: `docs/asks/2026.10.04_09.02..46_*`,
`09.03..49_*`, `09.06..46_*`, `09.12..20_*`, `09.16..32_*`.

## What a player meets differently
- A hit opens the same red ring, now from the bottom of the target he hit — under it, on the ground — not from its middle.
- Standing targets carry no label. The one he marks carries one, in words: "T1 · 150 M RIGHT · AMBER".
- On the range he sees three things under the top bar: TRAIN UP · TRAIN DOWN · QUAL 40, RESTART, LANE 21. The rest is behind MORE.
  Picking says once what happens next: "LANE 21 · QUAL 40 · 40 TARGETS · 4 MAGAZINES · STARTS ON GREEN".
- Every lane line has a board at 100, 200 and 300 m naming the lane on each side: "◂ 21 · 22 ▸". Lanes are 15 m; every target is
  inside its own lines. A board's words never print over another's.
- The button that will work next glows: TARGET, then APPROVE, then FIRE. RELOAD glows when the magazine is empty and at the QUAL rest.
- The strip says "AMBER · T1 · 150 M RIGHT · PRESS APPROVE", then "RED · … · PRESS FIRE", then "LAST · 150 M RIGHT · DOWN". The
  corner says "LANE 21". No `C-150R-L21`, no "CH0 D3", no "L21 DOWN".
- A light at the upper right: red WAIT, yellow READY (3 s before each QUAL engagement, the last 3 s of the rest), green FIRE.
- The range picture shows lanes and targets only; his own lane's targets are always drawn.
- QUAL ends "QUAL DONE · 36 OF 40 · EXPERT · PRESS RESTART", RESTART lit, the light red.

## Measured on the served r.156 (the reviewers' pods + this build's own captures, 390×844 and 844×390)
- The ring was centred 0.18 m (50 m F) to 0.44 m (300 m E) above the target's foot (`splashCentre` = `worldOf`, the centre of mass).
- 11 captions on unmarked targets; "150M E" printed over "100M F"; "21 21" board stacks; boards on the left edge only.
- 22 visible controls at 390×844, 11 of them range controls in four rows; at 844×390 RESET at x 849 on an 844 px screen.
- 10 m lanes: the 150/250/300 m targets 0.85–1.65 m outside their lane; the 50 m pair 0.07 m inside.
- No light; FIRE always red-bordered; RELOAD gold at 30 rounds and at 0; `C-150R-L21` three times on one screen.
- At MoT 1.1 on lane 21 the world budget (280) was spent by the neighbour lane's silhouettes: the player's own targets were dropped
  (segs 280, dropped 738) — captions floated with no silhouettes under them.
- In a room: another lane's RESET wiped my QUAL table and changed my mode; another lane's HIT/MISS counted on my strip; a joiner's
  lapses were booked by no one.

## What changed (`patches/r156_to_r157.py`, 76 asserted edits; a miss REFUSES)
1. `baseOf(ref)` + `splashBase(f)` replace `splashCentre`: a plate's foot (`qWorld`, z + fall·h·0.4 as `silMesh`); anything else the
   ground under it (y 0). The draw rings `splashBase(state.fx)` — same 0.45 s growth, LOCK red, 16 segments outside the budget.
2. `plateCaptionRects` returns only the marked target (current mark or a slot), captioned with `plateWord`.
3. CSS `#app.range:not(.more)` hides modePick, plat, water, motLvl, tgtPick, chLvl, diffLvl, halPick; MORE toggles `#app.more`;
   the options read TRAIN UP / TRAIN DOWN / QUAL 40, the button RESTART, the lanes LANE n; `RANGE_MODE_NAME` follows;
   `modeSentence()` is said once by goRange (the rngMode handler's 148-character line is gone); the platform picker says TURRET.
4. `LANE_W=15, LANE_HALF_W=LANE_W/2` (one constant); `LANES x=(i−20.5)·LANE_W`; `laneMarkers` returns both edges with `txt`
   (`laneBoardText`); `markersInView` draws a shared post once; `boardLabels` places the words above each board, nearest first, never
   over a caption, the strip, the magazine line, the light or the bullseye.
5. `nextStep()` / `paintCues()` light exactly one face button (mirroring approveDesig's TWO_HUMANS and fireN's NOT_THE_MARKERS_SEAT
   tests; none on an empty magazine); `reloadCalls()`; RESTART lit when QUAL is done or TRAIN DOWN is all down. FIRE's red border is
   its lit state. Styling only.
6. hudPhase / LOCK line / board / approval toast / corner use `plateWord` and `cornerLabel()`; `plateWord('C-50')` reads 50 M RIGHT.
7. `startLight()` / `paintLight()` + `#startLight` (DOM, upper right; portrait under the magazine line with the strip narrowed to
   leave it room; landscape under the magazine line).
8. `buildRange`: the coloured lane rays, firing line, distance lines and berm are gone; the dim grid is MAP-only; the MoT 1 blue grid
   is skipped on the range.
9. `segsOwn` draws my lane's targets, my two edges of boards and the marked box outside the world budget (counted at the end).
10. `lapseIsMine()` reads `hostLane()`; `laneRestartFromRow()`; peer HIT/MISS tallies only for my lane; a peer HIT splashes here.
11. `qualCard()` on the toast and the strip at the end of QUAL. The toast wraps before the right column; the corner steps above the
    HEAD stick.
12. Revision stamps `0.156` → `0.157`; old mode names in notes and comments read as his names.

## Gates (boot QA, both orientations: 194 rows, 193/194 — SYNC_DIRECT red by construction on one device)
`SPLASH_FROM_TARGET_BASE` (replaces `SPLASH_FROM_TARGET_CENTRE`), `LABELS_ONLY_WHILE_MARKED` (replaces `LABELS_DO_NOT_OVERLAP`),
`LANE_MARKERS_100_200_300` (rewritten: 252 boards / 129 posts / both edges / own ground), `BOARD_LABELS_NEVER_OVERPRINT`,
`TARGETS_INSIDE_LANE`, `MY_LANE_NEVER_DROPPED`, `NEXT_BUTTON_LIT`, `RELOAD_CALLS`, `START_LIGHT_SEQUENCE`, `START_LIGHT_WORDS`,
`START_LIGHT_CLEAR`, `NO_RAW_IDS_ON_GLASS`, `RANGE_MENU_ON_SCREEN`, `QUAL_DONE_SAYS_RESTART`, `ROOM_RESET_IS_MY_LANE`,
`FOREIGN_LANE_HIT_NOT_MY_STRIP`, `ROOM_LAPSE_ON_EVERY_LANE`; `MAP_KEEPS_THE_STRIP` and `BOARD_NEVER_OVER_THE_STRIP` re-pointed to
plain words. Each new row has a note regex in `scripts/drone-deck-qa.mjs`. `tests/range-2525.test.mjs` lifts `LANE_W` and
`laneBoardText` and holds both edges, 15 m spacing and every target inside its lane; `tests/drone-playable.test.mjs` holds his mode
names, RESTART and the r.157 pieces in the served bytes.
Also run: drone-range-lanes 42/42 (QUAL clock within ±0.35 s at normal and slow frames); drone-team-e2e 10/0, one hash on both phones;
two QUAL shooters (lane 21 portrait 32/32 in 200 s; lane 9 landscape, 6 s reaction, 14/33 with 19 unfired misses, counted right).

## Captures (`img/`, 390×844, lane 21, the same steps on r.156 and r.157)
`r157-before-*.png` (r.156) / `r157-after-*.png` (r.157): `splash` (150 m R hit at 3×, 0.12 s), `labels` (TRAIN UP, nothing marked),
`menu-light` (QUAL 40 just picked: the sentence and the yellow light), `lane-boards` (QUAL engagement 1 at 1×), `next-button` (amber:
APPROVE lit), `reload` (empty magazine), `plain-words` (red: the strip).

## Questions for the operator (not built)
1. On the 25 m Alt-C sheet the ring starts at the silhouette's base on the paper (1.4 m above the ground) and grows to several times the
   sheet's width. Keep it, start it at the frame's foot, or scale it down on the sheet?
2. A 4.2 m ring at a 300 m plate (6.4 m from its lane centre) still reaches past the line into the next lane. Acceptable?
3. At 300 m and 1× the oval is ~15 px wide and under 1 px tall. Fine as is?
4. TARGET swings the turret onto the marked target's centre (r.148), so in Qual 40 every approved shot lands in the aiming circle.
   Keep that help in Qual 40, or should TARGET mark without moving the aim there?
5. CONTROLS, VOICE, MAP and DATA stay on the top bar (he named the second-bar pickers for MORE). Move them behind MORE too?

## Record
- `HASHES_r157.sha256` (deck sha `5d65ee2b…`, 415,943 B, + patch sha); `public/drone-2525/play.html` byte copy. Artefact commit `f6cf582`.
- `REVISIONS.md` r.157 row (chain `4eeff853…`) + section (with the correction of `ece1828` and the r.155/r.156 live record);
  README HEAD `drone-2525_r.157.html`; `deck-rev.ts` + `tests/deck-head.mjs` DECK_REV `157`.
- Domain JSON `project.revision` 0.042; release 0.042 (r.157) `commit f6cf582` / `shipped PENDING`. Ledger rev 52 (r.157)
  `shipped PENDING`. `domain.gen.ts`, CRS / README / ASSUMPTIONS and the foil exports regenerated (stamp 0.042).
