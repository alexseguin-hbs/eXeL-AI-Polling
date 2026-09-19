# Drone-2525 operator deck — revision register (append-only, reviewed like the Vision-2525 whitepaper)

One entry per carried `drone-2525_r.NNN.html` from r.128 on. An entry is never edited; a correction of an earlier
claim is a NEW line under a later revision that names the claim it corrects. `frontend/tests/drone-revisions.test.mjs`
holds every carried file since r.128 to an entry whose sha256 matches the bytes, holds README HEAD to the last entry,
and refuses a register whose earlier entries changed: `chain` = sha256(previous chain | rev | sha256 | bytes), recomputed row by row.
Nomenclature `v.00.00_r.NNN`; skipped numbers are never invented. Sizes in bytes (`new Blob([html]).size`, never chars).

| rev | date | author | bytes | sha256 | shipped in | chain |
|---|---|---|---|---|---|---|
| r.128 | 2026-09-19 | Grok + eXeL AI | 211344 | 6c26f43c052d68027952b139626aecf1d4b3171e1204cac54fc89da8f102ec8c | 2159671 (served; the r.130 row cited d195781 — corrected in the r.131 section below) | fc7480650848100badc8d62dfa8e509b212536c2616f9b1b08d332db3f66647b |
| r.129 | 2026-09-19 | Claude Code | 215379 | 7b1e0e51a31aa79c92211ac385e781452cc1c3d24899c118d6976b83ed2e8c7e | 8a54271 | 0b9539d90e05709195f2ab913bea0c0b25ae1ef0fe54b4f21242e824ec31188e |
| r.130 | 2026-09-19 | Claude Code (AsM fleet, autonomous) | 231517 | ce034c5e5c52aff539321f8a8895965317b7d406b8d1fcdb5aaef978a5bee99e | a83e670 (artefact) · 1ce5a3c (gates, register, research) | 7ab4f6dee17afcdb97610353f954e0e5e0dcd77343d87c9626252a85068a0ef4 |
| r.131 | 2026-09-19 | Claude Code (AsM fleet fold, autonomous) | 245877 | 700a51469e3e5ab174a851081aa555aa5201ff5a84a1b6a5f8f9aac1b347db54 | 9870031 (artefact) | ca5919226aea1b4785a4585432c38ecc217abc25e8988fbac2ab69888dc798f8 |
| r.132 | 2026-09-19 | Claude Code (usability walk + two-phone gate, autonomous) | 256197 | d48ec579e31a7dfd684b7b1148944de0dcfcbe42cc1ef10d662f584e22adadaa | 607f0a8 (artefact) | 758cb5d629629a8e559c7aa8f332ec1602f56926142b0da2433f564641ad1690 |
| r.133 | 2026-09-19 | Claude Code (38-AsM team-test fold, autonomous) | 262814 | d10ae69bc53d1a73845b69db2da7280e518aa31c41eb415b10160e1f608e0526 | fbdd78e → 4321f40 (artefact, final bytes) | 2d0ac8d264429638379149bcf8bf8da8e38555b4c33551c002f1cf2e78b43605 |

## r.128 — Grok + eXeL AI (blue/red revisions; the LOBBY)
- The Blizzard-style multiplayer lobby with a 6-digit team code + opaque seed id per team, rotate lock, roster,
  readiness, `canLaunch` refusal order; LIGHT-4 keyed codex; host SEQUENCER (sessionSeq, provisional events,
  Lamport clock, `sessionOrderKey`); the 50 m RANGE from r.122 (42 lanes, Alt-C silhouettes at true metres,
  PRACTICE UP / STAY / QUAL 40, ASM_QUAL40 fixture); WALLS/WATERS; in-file QA 55 rows.
- Served as the playable at `/drone-2525/play.html` byte-identical (R-CORE: the best solution ships regardless of
  which AI wrote it). Repo lifts (no rework): `lib/2525-core/lc4.ts`, `lobby.ts`, `random.ts`; proofs
  `tests/lobby-2525.test.mjs` (38), `tests/sequencer-2525.test.mjs` (13).
- Honest open items at r.128: two real phones for HOST/JOIN → same hash; endurance soak; 9v9 locked until
  1v1/3v3 qualify on live transport; the range had "no aim/ballistics test" (its own comment).

## r.129 — Claude Code (operator items of 2026-09-19)
- `phys` moves the body along the airframe heading instead of the pilot camera's forward (the camera folds the
  gimbal pan in), so a head panned behind no longer reverses the body; bullseye (rings + centre tick, T13.SI) on
  standing pops and doors; once HIT the T## slot clears with the box (keyed on the designation's own slot); in a
  LIVE room the red box needs two separate humans (decided by seated identity, because `applyWorld` rewrites a
  local designation to `how:'PEER'`). QA rows `BODY_FWD_PAN180`, `HIT_CLEARS_SLOT`, `LIVE_TWO_HUMANS`,
  `LIVE_PEER_APPROVES`; 59 rows, headless 58/59 (`SYNC_DIRECT` FAIL by design on one device).
- Repo: `tests/drone-playable.test.mjs` re-pointed (byte-identity, < 7.77 MB in bytes, the r.129 regexes).
- **Claim made at r.129 that r.130 corrects:** "forward-goes-reverse fixed at its class". It was not. r.129 fixed
  the pan-folding sub-case only; at pan 0 the body still moved AWAY from what the screen showed, because the
  camera vector and the projector disagreed by 180° (see r.130). The r.129 QA measured displacement along the
  vector, which was the wrong side of that disagreement.

## r.130 — Claude Code, AsM fleet in autonomous mode (operator 2026-09-19: "make sure range with turrets actually works")
- **Found on the served r.129 by a read-only probe before any change:** from the pit, looking downrange, the projector
  culled all ten silhouettes; every aimed shot 50–300 m was a MISS; LOCK named a buoy; turned 180° the plates appeared.
  Cause, the class: `camOf` said forward = (sin yaw, −cos yaw) while `proj` draws forward = (−sin yaw, cos yaw). The
  same disagreement made QUAD/VTOL move AWAY from the point on screen under left-stick forward (59.4 → 68.3 m).
- **One forward basis** (`fwdOf`/`rightOf`/`yawTo`, derived from the projector): `camOf`, `lockOn`, `phys`, all five aim
  sites and the QA read it. The range pit parks at yaw 0 and faces its plates. QA `PROJ_FWD_AGREES`,
  `FWD_IS_WHAT_YOU_SEE_{D1Q,D1,R2}` (distance to the point at screen centre DECREASES under L-up — the invariant in
  picture terms), `RANGE_SEES_PLATES` 10/10, `RANGE_LOCK_PLATE`.
- **Pop-ups per lane at various distances:** plates DOWN by default; `rangeTick` raises one at a time per lane in a
  seeded per-lane order (`mulberry32(2525+lane)`), for 3 s at 50 m … 8 s at 300 m (FM 3-22.9 record fire, see
  `docs/drone-2525/RANGE_QUALIFICATION_RESEARCH.md`), 1.5 s gap. Hit → falls; lapsed → drops.
- **Three modes, the operator's names, on the existing `rangeMode`:** TRAINING · RESET (`bounce`, a downed target
  comes back on its next exposure) · TRAINING · DOWN (`stay`, stays down until RESET) · QUAL · 40 (`qual40`, timed
  tables I/II/III = 20/10/10 exposures; a lapsed exposure is an UNFIRED MISS round; 23/30/36). QA
  `MODE_RESET_RETURNS`, `MODE_DOWN_STAYS`, `MODE_QUAL_TIMED`.
- **Scale-true hit test:** a silhouette is hit when the pip sits inside its projected outline (CIRCLE inside the aiming
  circle, else SILHOUETTE), 6 px floor shown on the HUD; the old constant 32 px rule is gone for plates. QA
  `RANGE_HIT_50`, `RANGE_HIT_300`, `RANGE_MISS_300_OFF20` (the old rule scored it a hit), `RANGE_HIT_50_OFF10`.
  None of these rows use `simDirect`.
- **Sheet 9127 layout:** 50 F · 100 F ×3 (C-100C new) · 150 E ×2 · 200 E ×2 · 250 left · 300 right; table III cap
  covers C-100C. QA `ALTC_LAYOUT`.
- **Latent deck defect fixed at the class:** the reducer rebuilt every designation as `kind:'obj'` and dropped WHO
  marked it — so at CH0 `fireN` routed a designated plate down the bull-ring path (shooting BULL-1), and the r.129
  identity-based two-humans rule could never see a peer's identity. Now `kind:kindOfRef(target)` and
  `by:row.peerId`. Exposed silhouettes get a hairline screen bracket + seconds left; a turret never locks a buoy;
  the map prints every 7th lane label plus the seated lane ±2 (the label soup is gone).
- **Two render defects of r.128/r.129 the probe exposed, fixed at the class:** `bullseye()` (r.129) referenced `draw()`'s
  local `segs` from top level and threw on every frame; the loop's `try/catch` hid it, so nothing after the doors —
  pops, silhouettes, T-boxes, the HUD — was ever drawn while '0 page errors' stayed green. Now `segs` is passed in,
  the loop RECORDS a render exception (`state.drawErr`), and a deferred QA row `DRAW_COMPLETES` reads whether frames
  ran to their last line. And at MoT 1.1 the 42-lane range wire (601 segments) spent the whole 280-segment budget
  before any silhouette was drawn (r.128 too): the lane's exposed silhouettes now take the budget first and pit boxes
  draw only for the seated lane ±1 at MoT 1.
- In-file QA 75 rows, headless **74/75** (`SYNC_DIRECT` FAIL by design on one device), 0 page errors, 60 fps.
  Repo gates: `range-2525` (64), `drone-playable` (33, re-pointed), `drone-revisions` (this register).
- **Corrects r.129:** "forward-goes-reverse fixed at its class" — r.129 fixed only the pan-folding sub-case; the class
  was the basis disagreement above. Still open, honest: two real phones for HOST/JOIN → one hash; endurance soak;
  a perf run (SSSES Scalability/Efficiency stay unmeasured until it exists).

## r.131 — Claude Code, the fleet fold (24 reviewer lenses on r.130 → `docs/assessments/2026-09-19_r130_fleet_review.md`)
**Corrections of the record (new lines, the old rows stand as written):**
- The r.130 row cited `d195781` as r.128's shipping commit; that commit carries no deck. r.128 was carried and served by
  `2159671`. (lens 11A/11B)
- The r.130 section said `range-2525 (64)` and `drone-playable (33)`; the gates reported 65 and 35 at that commit. (11B, 9B)
- The r.130 README said "33 asserted exact patches"; the artefact commit said 44. Both were true of different builds of the
  same evening; the patcher scripts were not committed. From r.131 the patcher is carried: `docs/drone-2525/operator-deck/patches/`.
**What changed (each item names the lens that found it and the QA row that now holds it):**
- The scenario/challenge pickers no longer defeat the range: picking CH0 keeps the bull ring DOWN (it re-aimed and raised it,
  so every shot scored BULL-1 — 10B); the first pick of "50M RANGE" seats a turret (mode stayed `range`, slot keys chose
  Capitol doors — 10B/2B). Rows `TARGETN_HITS_THE_EXPOSED_PLATE`, `RANGE_LOCK_PLATE`.
- **One exposure, one round; a target that goes down takes its box with it.** `applyHit` refuses a plate that is not UP, not
  falling, and the lane's current exposure (`TARGET DOWN · WAIT FOR THE NEXT EXPOSURE`); in QUAL·40 a second pull in the same
  exposure is `ONE ROUND PER EXPOSURE`; a lapse after an engaged exposure charges nothing; `rangeRelease` clears the
  designation/slot on hit or lapse; a miss keeps red for this exposure but never re-arms the CH5 second authority; plates are
  never resurrected. (2A/2B/3A/3B/4A/4B/6A) Rows `ONE_ROUND_PER_EXPOSURE`, `LAPSE_RELEASES_THE_BOX`, `MODE_RESET_RETURNS`
  (now observes the SAME plate returning, 64.8 s later), `MODE_QUAL_TIMED` (+ `qualH===0` + a LAPSE event).
- **QUAL·40 fits its own clocks and can reach 40:** table clocks 142/75/75 s (DECLARED: exposures avg 5.2 s + 1.5 s gaps + slack;
  r.130's 120/60/60 could not fit their own exposures — 4A/4B); a table exposes only plates it can score (table III: 50/100/150);
  only a silhouette is a qualification round (never the bull ring); never a 41st round; the HUD shows per-table hits/rounds of
  lim, time, total and lapses; LAPSE and QUAL table advances are canonical events; the qual block is in `pack()`. Rows
  `TABLE_III_EXPOSES_ONLY_SCORABLE`, `QUAL40_TABLES` (re-based).
- **The basis, finished:** `camOf`'s seat offset rides `fwdOf/rightOf` (it still used the old inverted forward — 1A/1B);
  Capitol ring turrets face the Capitol; `mapCam` uses `fwdOf`; ONE `aimUnitAt` (camera eye, centre of mass, ±180 wrap) for
  every aim site (auto-aim was 1.8° high at 50 m); ONE `worldOf` for the T-box, world box, pick and lock cone (a plate's box
  was drawn up to 205 m from its silhouette — 1B/2B); tap-to-designate sees the range; double-tap fires only on the red box
  itself; voice has APPROVE and never fires on "hold/cease/stop"; the turret look goes through the control law (deadzone,
  sensitivity, trim, arrows) and is scaled by zoom; the seat/lane change starts clean and pre-aimed. Rows
  `PIT_SEES_300_RIGHT_250_LEFT`, `PAN_RIGHT_MOVES_WORLD_LEFT`, `FWD_AT_YAW90` (the rows 1B/8B said were missing — picture terms, non-zero yaw).
- **The picture on a phone (7A/7B/10A/10B):** what you must hit takes the segment budget before the world on EVERY channel
  (`drawTargets` before `WIRE.g`; the swarm capped by remaining headroom; pit boxes near my lane at MoT ≤ 2; the wing
  declutter names fixed); no lake craft or swarm on the range; ONE caption per exposed plate (`T1 · 100M F · 4s · RED`,
  clamped to the canvas), no third label, the T-box never smaller than 16 px; LOCK moved clear of the kebab button; the FPS
  text off the HUD line; the HUD line reads mode · HIT n · MISS n (and ALL DOWN · RESET); a RESET button (TRAINING·DOWN
  "stays down until RESET" had no RESET); the pip floor is ANGULAR (3 mrad, min 3 px — the same standard at every zoom and
  screen size; DECLARED).
- **Evidence honesty (5A/5B/8A/8B/10A):** the reducer applies HIT (downs the plate on every peer), MISS and LAPSE rows; the
  band is on the record (`HIT CIRCLE`); the batch labels every trial SIM and never broadcasts; boot QA snapshots and restores
  events/decisions/scores, mutes the link, and leaves no designation on the first screen (the phantom red `QA-BULL` box a
  stranger saw first — 10A); a QA that throws is a red row, never a blank panel; the deferred `DRAW_COMPLETES` row is printed
  and guarded. Rows `REDUCER_HIT_AND_LAPSE_DOWN_THE_PLATE`, `QA_LEAVES_NO_TRACE`.
- **The approve record tells the truth:** `how`/`sameDevice`/`samePerson` derive from whether ANOTHER seated human marked the
  target, not from the literal `'HI-2'` (every approval said SOLO — 6B); the spiral self-test refuses in a LIVE room or over a
  live box.
- In-file QA **84 rows** (+9), headless **83/84** (`SYNC_DIRECT` by design), 0 page errors, 60 fps. sha256 `700a51469e3e5ab1…`.
- **Repo (same evening, next commit):** ONE `tests/deck-head.mjs` names HEAD for every deck-reading gate (sequencer/lobby now
  lift from HEAD, not r.128 — 9B); `scripts/drone-deck-qa.mjs` runs the deck's own rows in headless Chromium in CI against a
  checked-in row manifest with set equality and a tight red-list (12A); Verify Live probes `play.html` for the revision
  (12B); the PLAY button says the served revision (12B).
- **Deferred to r.132 (a lobby/transport change, not a range change):** the wire path bypasses the two-humans gate — net
  APPROVE has no gate, SNAPSHOT imports red and never restores LIVE, a peer DESIG never writes a slot and can jam a
  foreign-lane box onto my device, six ambers coexist but only the newest is approvable (6A/6B/9A); the range has no
  canonical clock between peers (9A/5A); the reducer applies in arrival order while the hash sorts (5A).
- **Still open, honest:** two real phones for HOST/JOIN → one hash; endurance soak; `dt` is clamped so a slow device runs the
  range slow (2A); the shell's CH0 and the deck's CH0 are different games and the PLAY link passes nothing (12B); the register
  chain covers rev|sha|bytes only (11A/11B) — widening it re-bases every chain value and is a decision for the operator.
- **To verify tomorrow:** open `/drone-2525/play.html`, pick SCEN · 50M RANGE, watch a silhouette rise with its caption,
  TARGET → APPROVE → FIRE; then `cd frontend && npm run test:drone-deck-qa && npm run test:drone-playable && npm run
  test:drone-revisions && npm run test:range-2525`; `sha256sum -c docs/drone-2525/operator-deck/HASHES_r131.sha256` from the repo root.

## r.132 — Claude Code: the wire path obeys the same rules as the buttons; two phones, one hash
Operator ask (verbatim, hashed): `docs/asks/2026-09-19_usability_asm_team_test.md`. Findings that drove it: the usability walk
by real clicks `docs/assessments/2026-09-19_r131_usability_walk.md`.
- **Two phones, one hash — reached.** A real-click walk in two ISOLATED browser contexts over a WebRTC data channel (no shared
  tab channel): host offer → joiner answer → DIRECT → team auth → READY 1/1 → START → LIVE on both; the host marks, the mark
  reaches the joiner as the same slot by the host; the host's self-approve is refused `TWO HUMANS`; the joiner approves; red
  on both as `PEER HI-2`; the host fires, HIT, the box clears on both; **replay hash `ee5ef022` on both, MATCH on both.**
  Promoted to the repo as `frontend/scripts/drone-team-e2e.mjs` (`npm run test:drone-team-e2e`), a Deploy step.
- **What had to change for that to be true:** a peer's mark lands in a slot with its author, honours the lane guard and never
  overwrites a red box (`peerDesig`); a peer's approval needs an amber mark and, in a LIVE room, a seated human other than
  the marker (`wireApprove`, used by the reducer and by the receive path alike); a snapshot hands over amber, never red,
  never an approval, and keeps LIVE (`importSnapshotDesig`); `approveDesig(who, slot)` and `fireN(n)` honour the slot (six
  ambers, six approvals; `T4 IS NOT THE RED TARGET`); a HOLD/REJECT decision travels as its own canonical row — the walk
  found the host's refused self-approve missing from the joiner's hash; a tab message never downgrades a live DIRECT link.
  QA rows `PEER_DESIG_TO_SLOT`, `WIRE_APPROVE_TWO_HUMANS`, `WIRE_APPROVE_NEEDS_AMBER`, `FOREIGN_LANE_MARK_NOT_MY_BOX`,
  `PEER_MARK_NEVER_OVERWRITES_RED`, `FIRE_SLOT_MISMATCH_REFUSED`, `SNAPSHOT_NEVER_RED`, `HOLD_ROWS_TRAVEL`.
- **From the usability walk:** boot QA leaves no last shot on the first screen; a tap on the marked target keeps its phase
  (double-tap-to-fire works as documented); `MISS` is a miss and a lapsed exposure reads `LAPSED`; the MORE menu works (it
  had NO handler — the AsM seat, RELINQUISH and T prev/next were unreachable on every device); the AI member sees the
  exposed silhouette at CH0 (`ASM_SEES_THE_RANGE`).
- In-file QA **93 rows**, headless **92/93** (`SYNC_DIRECT` by design on one device). sha256 `d48ec579e31a7dfd…`, 256197 B.
- **Still open, honest:** the range has no canonical clock between peers (each phone runs its own exposures from `dt`; the
  hash matched because both peers scored the same event rows, not because their silhouettes rose in step) — the next
  R-CORE step for 3v3; the reducer applies in arrival order while the hash sorts (5A); two real phones on a real network
  (the walk used two contexts in one headless browser: real WebRTC, real ICE, no shared state, but one machine).
- The offer is ready 1.5 s after the first host candidate (8 s cap): a phone with no internet no longer waits out the STUN
  timeout (40–90 s in the walk) to pair over WiFi.
- **To verify tomorrow:** `cd frontend && npm run test:drone-team-e2e` (about 15 s), then `npm run test:drone-deck-qa`; on two
  phones: WAITING ROOM → host CREATE HOST OFFER, share the text + the other team's 6 digits → joiner JOIN OFFER → return the
  answer → host APPLY → both READY → START.

## r.133 — Claude Code: the 38-AsM team-test fold (26 seats played the served r.132 by clicks; `docs/assessments/2026-09-19_r132_asm_team_test.md`)
- **The AI member was dead code in live play.** `asmTick` was defined, exercised by a boot QA row, and never called from the
  frame loop — so `AsM SPOT` marked nothing on any device while its gate read green (the gate called the function itself). Now
  ticked from `spawn`; on the range it sees ONLY the seated lane's exposed silhouettes (a nearer lawn pop-up used to win `best`
  and then fail its own 80 m gate), measures from the seated pit (its own mount can stand 300 m from the lane), and **fires only
  on a red box** — a named human approved — once per box, through `fireN` (the r.132 branch downed the target on AMBER with no
  APPROVE and no record). `AsM OFF` is the default; the cycle is OFF → SPOT → FIRE. The reducer keeps the author `designate()`
  wrote (the AI's mark was re-stamped with the human's id). QA `ASM_TICKED_LIVE`, `ASM_SPOTS_FROM_PIT`, `ASM_FIRE_NEEDS_RED`.
- **The score was clipped exactly where it mattered.** `#playHud` was nowrap + overflow hidden: at 320–390 px the HIT/MISS/
  LAPSED count, the QUAL·40 clock and TOTAL, and the terminal `ALL DOWN` were off the phone. The strip wraps; the score has its
  own line; `hudScore()` is the one writer and runs the moment a hit, miss or lapse lands (the strip lagged the toast by a frame).
  QA `HUD_SCORE_WRAPS`. Desktop: the side panel now sits in the strip the stage reserves for it instead of on the picture.
- **The approver never learned the outcome.** The joiner's HIT stayed 0 and its red box stayed on a dead target — the peer's
  HIT row downed the plate but neither tallied nor released. A HIT/MISS row from the other seat now tallies here and takes the
  box down with the target (`THE OTHER SEAT HIT · <id>`). QA `PEER_HIT_TALLIES_AND_CLEARS`.
- **One sentence for an empty range** (key 1 said `NO T1`; the button and voice said `ALL DOWN · RESET`) — QA
  `EMPTY_RANGE_ONE_SENTENCE`. **No lapse counts before the round starts** (54 lapsed behind the intro; 1 in every waiting
  room) — QA `RANGE_IDLE_BEFORE_START`. TARGET aims the head at the mark (a red box 130 px off the pip read as a refusal); a
  peer's mark turns the approver's head to it (the box was off the joiner's screen). A hit target leaves the lock and its
  caption at once. LOCK is aim, drawn in the aim colour. A refusal names the next action; a long toast stays up to be read;
  the joiner's toast for the host's refusal says whose it was. `DOWN DIRECT` → `DOWN`; `HIT · CIRCLE` → `IN THE AIMING CIRCLE`;
  `SCEN · RANGE 50-300 M`; `TEAM SECRETS` (the joiner's panel said HOST).
- In-file QA **100 rows**, headless **99/100** (`SYNC_DIRECT` by design on one device).
- **Still open, honest:** the range clock between peers is per-device (r.132 note stands); the joiner cannot complete an unaided
  join because the RED code is shown nowhere (`ROOM_PRIVATE_CODES` — an operator decision); a joiner's qual counters do not
  move from remote hits (the tally covers HIT/MISS/LAPSED, not the qualification tables); the CH5 "second authority" overlay is
  superseded by the two-step (a PEER approve already is the second human) — documented, not a defect; two real phones.

