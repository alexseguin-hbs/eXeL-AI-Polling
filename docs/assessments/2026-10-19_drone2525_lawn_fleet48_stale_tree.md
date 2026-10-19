# Drone-2525 · the 48-agent Capital Lawn fleet of 2026-10-19 — VOIDED: it measured a stale tree

**Page one, before anything below is read.** All 48 agents of this fleet (12 AsM × 3 specialists + 12 MoT, run `wf_…`/task `wyhp4wt9q`, 8,112,465 tokens, 1,763 tool calls, 48/48 completed with 0 errors) measured the primary working directory `/home/user/eXeL-AI-Polling` at **`b7e1a304e` — 28 commits behind both `origin/main` and `claude/debug-wsl-issues-yYdPP`** — while every real change of the day lived in a scratch worktree at `f8f7a8a51`. The brief said "clean, at HEAD". It was not, and nothing checked. So every finding below about *what is in the repository* ("the Shield text is not in the repo", "DD-124 is not persisted", "r.217 has not shipped", most of the 37 BLOCKING items) is a finding about a tree nobody shipped, and the twelve MoT verdicts — **2 BLOCKING, 10 FIX_FIRST**, *"do not write the plan from these packages"* — are correct for that reason. The plan was NOT written from these packages. They are kept here, as returned, because a fleet that cost eight million tokens is part of the record whether or not it was used, and because some of its measurements were taken on bytes r.217/r.218 did not change.

**What survives the staleness (each re-verified on `f8f7a8a51` before it was used — see the plan's Stage 26):** the lawn geometry work (Athena's avenue-weighted LOS/arc derivation, used only as placement *candidates*, since CRS-CL.12 fixes the count at nine); the gate-class findings (no append-only gate on the arena record; every lawn boot row measured on the r.131 ellipse the player never occupies; the gate–artefact mismatch class; the red-first machinery `EXPECTED_RED` unused); the per-seat-magazine impossibility (all eight magazine definitions frozen); the `lockOn` precedence reading (the tap/aimRef path has no cap; the TARGET button's fallback pool caps pops at 80 m); the swarm drawn on any non-Range rung at the one `drawSwarm` call site; the IndexedDB metrics store already in the deck (write-only, keyPath `t`). **What does NOT survive:** the seven-Avenger count (CL.12: nine lines), the re-home of 42 units (delta line 7: no station moves until the record is what the lawn is built from), Krishna's degree arcs (CL.11: UCRS only), every "not in the repo" claim.

**The class, closed in the same push as this file:** `frontend/scripts/tree-check.mjs <dir> <sha>` refuses a stale target; every agent prompt of the replacement fleet (`wf_fc9f92c1-ba0`) opens with `git rev-parse HEAD` and stops on a mismatch, and its voter discards a colleague who measured another tree; CLAUDE.md's Workflow Rules now say the primary directory is fast-forwarded after every push.


**Counts:** {"specialists": 36, "mot": 12, "total": 48} · MoT verdicts: {'BLOCKING': 2, 'FIX_FIRST': 10}


---

## The twelve MoT reports, as returned (stale-tree caveat applies to every line)


### MoT · CONTRADICTION over pod GROUND — **BLOCKING**

**Headline.** This pod measured a stale tree: local HEAD b7e1a304e is 7 commits behind origin/main 2123376bc, where r.217 has already shipped and DD-124/125/126/127 are persisted — which refutes Athena's two headline strikes (M-SHORAD "not in the repo", Builder's "invented" defended assets) and shifts every Enlil line below :5829 by exactly +67.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Both packages measured a tree that is 7 commits behind the published one. `git rev-parse HEAD` = b7e1a304e ("Persist DD-123"); origin/main = 2123376bc. On origin/main: play.html declares `revision:'0.217'` at :787 and is 1,198,239 B (not r.216 / 1,186,355 B); the register carries DD-124, DD-125, DD-126, DD-127; and docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md exists (620 lines, sha256 ad8f9280…, gated by tests/asks-persist.test.mjs). Measured line drift HEAD→origin/main: every cited line at or above :4039 is unchanged; every line from :5829 down is +67 exactly (_ft 5829→5896, enterTheRange 5879→5946, query reader 5928→5995, rangeResetOnRecord 6021→6088, _rr 6030→6097, _rm 6036→6103, stashRangeWave 6071→6138, goRange 6073→6140, pickScenario 6104→6171, lookToggle 6673→6740, end of inline script #1 6723→6790, shareUrl 9031→9098).
  - **action**: Re-base the whole pod on origin/main before any further work: `git fetch && git log b7e1a304e..origin/main`. Re-issue Enlil's edit list with +67 on the nine sites below :5829 — in particular "new definitions go at the end of inline script #1 after lookToggle :6673" becomes after :6740, inside 775–6790. range-spans.json did NOT change between the two, so the frozen/free classification survives unaltered. Repo governs; no operator word needed.
-
  - **asm**: Athena
  - **severity**: BLOCKING
  - **finding**: The M-SHORAD refusal rests on a measured absence that is false. Her evidence reads "docs/asks/ holds only 2026.10.19_The_Future_of_Drone_Swarms_AI-4-Defense.pdf for today's date; a repo-wide grep for 'Shield in the Sky' returns four unrelated Level-3 documents." True on stale HEAD; on origin/main the briefing is at exactly the path the brief named, plus docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md (380 lines) and an Images companion. Separately, her title "M-SHORAD IS REFUSED — it is in no law this repo holds" is false on EITHER tree: M-SHORAD "Sgt Stout" is in the repo's own asset catalogue at docs/security-2525/eXeL-STD-2525.md:85 with SIDC S*G*EWMAS-, wireframe cue and role — and DD-119's own reading treats that catalogue as authority ("EVERY PIECE IS ALREADY IN eXeL-STD-2525, so none of it is invented").
  - **action**: Withdraw the decision as written. The repo governs on the absence claim. Re-argue on the only true ground: M-SHORAD is in the catalogue but in no DD — DD-118's mix is Avenger + Sentinel + one THAAD sector, DD-119 adds LPWS. Whether an M-SHORAD inner ring is sited on the lawn needs HIS WORD; it cannot be struck on a false absence, and it cannot be added on Grok's relay alone.
-
  - **asm**: Athena
  - **severity**: BLOCKING
  - **finding**: She struck a colleague's decision as fabrication when it is the operator's own persisted set. Her dissent: "Builder invented a fuel farm at (180,-185), an ATP at (-195,-150) and a maintenance cluster at (0,+255) … DD-117 is explicit: 'the Capitol is the defended asset. It is not a target.'" But DD-124, persisted at 16a4114ee, records verbatim: "command post, fuel farm, ammunition transfer point, and maintenance cluster" (register lines 3559-3560), and DD-126 repeats it at :3685. DD-117 and DD-124 are not in conflict — the Capitol is A defended asset, and DD-124 names the set the five scored lines measure.
  - **action**: Reverse the strike. His persisted words govern over a MoT override. Builder's three points stand as CLASSES; only their coordinates are undeclared and need measuring or his word. Her note that "Builder's own open question concedes his eight collapse to six without them" now cuts the other way: the count rests on assets that are on the record, so the eight may be the honest number.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Both packages skip two binding gates in his own sequence. DD-118 (register :3111-3135, relayed verbatim and bounded three more times in DD-119 and DD-120): "r.217 ships first. Toast and share line only. Nothing on the lawn moves." and "Record every position, its arc, and its reason before a station moves. Then build the lawn to that record. Not before." Enlil's package is 27 edits to play.html — step 3 — and never names step 1 or step 2. Athena's package is step 2 but its gates assert on deck bytes as if step 3 were concurrent. Further: on origin/main the record's own revisions[] entry for r.217 reads `"shipped": "PENDING"`, so under NEVER OUTPACE THE DEPLOY no further code may be cut until Verify Live confirms r.217 on its SHA.
  - **action**: Order is: confirm r.217 LIVE → write the siting block into docs/drone-2525/drone-2525.v00.00.json (position, arc, class, reason per row) and re-run scripts/drone-render.mjs → only then open play.html. Enlil's package is correct work in the wrong slot; hold it. Decidable under standing sign-off — this is his stated order, not a new choice.
-
  - **asm**: Athena
  - **severity**: MAJOR
  - **finding**: ARCS_FACE_OUTWARD contradicts the only sourced target model in the arena record, and the already-decided line. The record's targets block is `{kind:"door", seed:20260915, upMs:14000, downMs:6000, concurrent:3}` with the note "Every building door is a pop-up target"; there are 14 doors across 14 buildings, and frontend/tests/drone-gimbal.test.mjs:114-128 gates buildSchedule over them ("every one of the 14 doors gets a turn", "a round must be winnable by construction"). Doors are ON the buildings, so an inward home azimuth is correct for that model — which is why the record homes t-south at 0, t-west at 90, t-east at 270. The brief's ALREADY-DECIDED line also says the standoff exists "so the full ladder fits with the Capitol as backstop." Her reversal makes every gun shoot away from both the doors and the backstop.
  - **action**: HIS WORD. The lawn cannot have both a door-target model (guns face in, Capitol as backstop, D-50's 50/100/150/200/250/300 in front of each station) and an avenue-pop model (guns face out, DD-119's "it pops on an avenue"). Ask him which, in one sentence. Until then no arc may be frozen, because the arc's sign is the whole answer.
-
  - **asm**: Athena
  - **severity**: MAJOR
  - **finding**: The LPWS summarizer-override's headline number ignores a field of the same record she cites elsewhere. She reports "100.0% single cover and 100.0% double cover" for two attic mounts, and cites gimbal.rangeM 400 in her reach decision — but never applies gimbal.tiltMaxDeg, which the record sets at 60. Re-measured here over the TRUE 12-vertex cruciform footprint (4,988 samples at 35/50/70/90 m, mounts (0,-42,30) and (0,42,30), nearM 5 / rangeM 400): single cover 100.0%, DOUBLE cover 80.3%. Max elevation demanded of at least one mount is 54.4 deg, so single survives and double does not. Related: her "footprint x±88 y±55" is a bounding rectangle over a cruciform — 19,360 m² against the true 11,240 m², a 72% overstatement that inflates every masking and clearance figure in the package; and her claim that Builder's (-34,-26) sits "inside the footprint+3 m buffer" is false, it clears the x=-30 edge by 4.0 m.
  - **action**: Re-run the LPWS measurement with tiltMaxDeg 60 applied and the real polygon, then restate. Her conclusion (the attic, not the ground) is likely still right — the 29 m masking argument is sound — but a summarizer-override against two colleagues cannot stand on a number that drops 20 points under the record's own gimbal. No operator word needed; this is arithmetic.
-
  - **asm**: Athena
  - **severity**: MAJOR
  - **finding**: The MARKS_PERSIST_OFF_THE_RANGE gate is shown red on a false claim. Its redToday ends: "the authority invariant — 'a named human decision exists before any machine shot' — has no store." There is a store, and it is unconditional: `decide()` at play.html:2588-2596 builds `{decisionId, t, kind, id, actor, designated, hiApproved, authorityLevel, challenge, diff, rev}` and pushes it to state.decisions, then ev() and sample(), on every challenge including the lawn. What marksPersist() at :2722 governs is whether a MARK survives between shots (chNum()===0 and not a LIVE room), not whether approval is recorded.
  - **action**: Rewrite the redToday to the true defect: on the lawn the lit button, the recital and the amber silhouette are dead because marksPersist() is false, so "target all, approve all, fire all" across several guns is impossible — not that approval is unrecorded. His law is that an invariant gets a gate shown RED FIRST on the previous revision's bytes; a red shown on a false premise can go green for the wrong reason. Decidable under sign-off.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: The standoff arithmetic defeats the already-declared answer, and the two packages disagree about which geometry it applies to. Measured off the record's own footprint (south face y=-55 on the central bar x∈[-30,30]; wing faces x=±88): CAP_RING=240 (play.html:1256, re-home :1267) leaves 185 m clear southward and 152 m on the wing axes, so D-50's 50..300 m ladder runs 115 m INTO the building south and 148 m into it east. The brief's declared remedy — "a station steps back to a 340 m standoff so the full ladder fits" — gives 285 m and 252 m and still does not fit. Athena's seats are worse, not better: her AVG-1 (0,-210) clears 155 m and AVG-2/3 (±210,0) clear 122 m. Enlil found this and flagged it as needing his word; Athena's package does not mention the ladder at all.
  - **action**: HIS WORD, and it is one sentence: either the picture wins (240 m, because that is the only distance at which the whole building reads through the EYE optic — his r.208 reason, in the CAP_RING comment itself) and the ladder is capped per bearing, or the ladder wins and stations stand at ≥355 m south / ≥388 m on the wings, both inside arena.radiusM 450. Do not freeze any per-station target depth until he answers.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: The defended asset is shootable today, and neither package addresses it although his register already named it load-bearing. The deck's doors array at play.html:894 carries D-CAP-S, D-CAP-N, D-CAP-E and D-CAP-W; the record says "Every building door is a pop-up target"; drawTargets :2184 draws and bullseyes every door unconditionally. DD-126 (origin/main, register :3688-3691) states it plainly: "The defended asset is currently shootable. With DD-126 that stops being a tidiness point and becomes a contradiction at the root of the Real-World rung, whose pass condition is that the asset is still there when it ends." It also collides with DD-117 ("the Capitol is the defended asset. It is not a target") and with the ladder's top-rung failure condition.
  - **action**: Add it to the plan as its own invariant with its own gate, red first: no door belonging to a defended asset is a target. Note the four D-CAP ids are consumed by drone-gimbal.test.mjs's buildSchedule ("every one of the 14 doors gets a turn"), so removing them from the target pool moves that gate's count — change both in one commit. Decidable under standing sign-off; DD-126 already states the requirement.
-
  - **asm**: CROSS
  - **severity**: MINOR
  - **finding**: Both reach decisions skip a shipped fix on the same feature, against the NO REWORK law. r.151 already solved "a lawn pop the LOCK reaches is not fireable": LOCK_REACH_PX=48 at play.html:2282, read by pipNearest :2284, by the key path :2584 and by fireOnIt :1053 ("anything else (a pop, a door, a UAV): within LOCK_REACH_PX of the bullseye"), with boot row FIRE_HITS_A_POP at :4543 and a verbatim pin in drone-playable.test.mjs. Neither Athena nor Enlil cites any of it. The reach story has two axes — pixels (LOCK_REACH_PX, solved) and world metres (the 80 at :2303, unsolved) — and saying so is what stops the next reader re-solving the first. Separately the two fixes are not equivalent: Athena raises the literal at :2303 and :2940 to 340, which widens reach for `pops` in EVERY non-range scene; Enlil's capReach(o) returns 340 only when o.sil exists, and nothing in the file has a sil, so it is behaviour-preserving outside the lawn.
  - **action**: Enlil governs on the mechanism — scoped, behaviour-preserving, reuses 340 rather than inventing a number. Both must state the two axes and cite r.151 so the pixel half is not re-litigated. No operator word needed.
-
  - **asm**: CROSS
  - **severity**: MINOR
  - **finding**: The two packages give the 42 deck units incompatible futures, and Athena's version breaks her own Sentinel gate. Athena: restoreCapitolTurrets "re-homes eleven of them — seven onto the gun seats, two onto the Sentinel masts, two onto the LPWS mounts — and parks the other thirty-one." Enlil: "the 42 units stay as the map menu; only the sited stations are playable", matching the brief's measured "43 marks, 43 pickable, a tap moved T01 to T26." Parking 31 either empties the map ladder or leaves 31 seats jumpToTurret (:2817) will still seat a player on with nothing to shoot. And a unit of kind:'turret' standing on a Sentinel mast is seatable and fire-capable, which contradicts DD-118 ("They cue. They are not seats"), DD-121 ("Sentinel never wears a fire mode") and Athena's own SENTINEL_NEVER_WEARS_A_FIRE_MODE gate.
  - **action**: Reconcile before either is written: the 42 are the map menu (Enlil + the brief's measurement + DD-43/45/46/47), and a sensor mast must be a different kind, not a turret unit — otherwise the gate she wrote cannot pass on the laydown she proposed. Decidable under standing sign-off.
-
  - **asm**: CROSS
  - **severity**: NOTE
  - **finding**: Four citation errors in packages whose authority is measurement, all verified here. (1) Enlil's applyHit edit names :2700 for `const ph=isPlate?plateHit(ref):null;` — that line is :2699; :2700 is `const off=pipOff(ref);`. Applied literally the edit lands on the wrong line. His design (resolve ph one line above the pinned :2701) is correct and the pin at drone-playable.test.mjs:40 does survive it. (2) Athena cites "frontend/tests/range-frozen.test.mjs:16 names them 'deliberately absent'" for lockOn, marksPersist and restoreCapitolTurrets; that comment names ten functions and only lockOn is among them — grep for the other two in that file returns 0. Her conclusion (all three free) is right, verified independently against pin.spans. (3) The brief's "role=drone is hardcoded at :5884" is wrong — :5884 is `state._selCraft='turret'`; shareUrl writes `&role=turret` at :9031 and nothing reads `role`. (4) Athena's "turrets[] holds exactly three entries… capitol footprint x±88 y±55" — three entries confirmed, footprint is the 12-vertex cruciform, not that rectangle.
  - **action**: Correct each in place before the brief is handed to a builder. A wrong line number in a package that claims to have simulated 27 edits is the kind of thing he has to report twice. No operator word needed.

**Residual gaps:**
- LEAK still has no definition from him — not a bearing, a range band, a time past a line, or a gun that failed to fire. Confirmed absent from the register through DD-127. Nothing can score it and the 'inner ring for leakers' assignment cannot be tested.
- Whether Real-World's swarm is the paper's nine (three groups of three X-BAT) or the record's 42 (swarm.total 42, perSide 21, passMark '42 aircraft at rung 2.3') is still unresolved on origin/main — DD-124 through DD-127 name the X-BAT swarm repeatedly and never settle the count. Seven or eight guns answer nine; 42 simultaneous tracks may change the count.
- I verified Athena's LPWS figures and re-derived them, and I verified every line number, frozen/free classification and record field cited above. I did NOT re-run her coverage percentages (63.4 / 98.3 / 99.1 / 78.7 / 98.1) or Enlil's 27-edit simulation — those rest on scratchpad scripts I did not execute, and the 72% footprint overstatement means the masking figures among them should be re-measured on the cruciform.
- The record's own _warning says docs/drone-2525/CRS_DRONE-2525.md, README tables and ASSUMPTIONS_REGISTER.md are GENERATED from drone-2525.v00.00.json by scripts/drone-render.mjs and must never be hand-edited. Neither package says the siting block requires that regeneration in the same commit; on origin/main the r.217 bump already moved all three.
- Sentinel's 9 m mast and 450 m range are declared by Athena, not sourced: the record's sensor block is only {profile:'pi-baseline'} with an edge-extraction note — no range field, no height field. Her 96.6% pair union moves if either changes.
- Thirteen of fourteen buildings and the whole 9x9 DEM are hand-authored; only buildings[0] capitol is source:'carried', confidence:'high'. Every line-of-sight and masking number in this pod rests on them. The record names its own remedy: scripts/security-2525/build_dem.py capitol-lawn --dataset ned10m.
- I read DD-126 and DD-127 in full on origin/main but only grepped DD-124/DD-125 (register lines 3462-3613). The task's quoted DD-124 ladder, seat map and Real-World lock should be diffed verbatim against the persisted text before any gate cites them.
- r.217's own record entry reads "shipped": "PENDING" and I could not confirm LIVE from this container (the sandbox proxy 403s every host — DD-126 records the same limitation). Someone must read Verify Live on 02c8cf03a before the next revision is opened.

### MoT · BUILDABILITY over pod GROUND — **FIX_FIRST**

**Headline.** The lawn is buildable in three revisions with zero frozen spans moved — but not today: the brief's "Shield in the Sky" file does not exist at HEAD, DD-124 is not in the register, and DD-121's per-seat magazine is unbuildable because magCap/hudMag/magSpend and the magazine rasters are all frozen.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: The brief asserts "Shield in the Sky" is now in docs/asks/ at 2026.10.19_Shield_in_the_Sky_ADA_Briefing.md with full text. It is not there. `find . -iname "*Shield*"` returns nothing; docs/asks/ holds exactly one file dated today, the AI-4-Defense PDF; and the register itself records the absence at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3454 — "NOT PROVIDED, AND RECORDED AS SUCH: 'Shield in the Sky.'" Athena measured this independently and her refusal of M-SHORAD on that ground is correct on the repo's own evidence; the brief, not Athena, is wrong.
  - **action**: Persist the briefing as its own commit before any package cites it (PERSIST FIRST). Until that commit exists, no gate, record row or DD may name M-SHORAD, the ring law, the layered assignment or the five scored lines — an append-only record cannot carry an unsourceable row, and a correction can only ever be another row.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: DD-124 — the five-rung ladder, the THAAD/Patriot seat rows, the Real-World lock and the four-metric completion rule — is not in the register. HEAD is b7e1a304e "Persist DD-123"; the asks file is 3,458 lines and its last addendum header is DD-123 at :3384. Every rung, lock and metric the packages build gates on exists only in the task text, so it binds nothing. Athena flagged this; Enlil cites DD-124 as "verbatim in the register" at commit 16a4114ee, which is not HEAD.
  - **action**: Persist DD-124 alone, before any revision, so the gates have something to read. Note that Athena's seven-gun count survives either way: its binding constraint is DD-121's Sector row at :3264-3302, which IS in the register.
-
  - **asm**: enlil
  - **severity**: BLOCKING
  - **finding**: A per-seat magazine is not buildable on the frozen deck, and neither package found it. magCap :958 is FROZEN and hardcodes `(qual40 && CH0) ? 10 : 30` — every lawn seat gets 30. magSpend :960, magLoad :961, magReload :972 and hudMag :966 are all FROZEN; MAG_FILL_TOP and MAG_PNG are FROZEN rasters, and CLAUDE.md makes a new magazine look an operator picture, cut and pinned, never a drawing. So DD-121's "the C-RAM burst, NOT three rifle rounds" and "THAAD and Patriot … NOT the 30-round picture" cannot ship, and DD-124's "the magazine picture must match the rounds" is only satisfiable at 30.
  - **action**: Scope every lawn seat to the 30-round magazine and say so in the revision note. What IS buildable in one revision is the DD-121 ripple failure: fireN is free and its two magSpend call sites are :2762/:2768, so one approval releasing N rounds spends N — call magSpend N times from fireN, never touch magCap. A per-seat capacity or picture is a declared re-pin plus a new operator picture, and belongs to a later programme, not this one.
-
  - **asm**: enlil
  - **severity**: MAJOR
  - **finding**: `capLawn()` does not exist and is never declared. `grep -c "function capLawn" play.html` returns 0, yet the package calls it in seven places — lawnPops, the marksPersist widening at :2722, the three teleport guards at :6030/:6034/:6036, the #plat guard at :3967 and the hudScore branch at :2682 — and the append-zone inventory never lists it. The whole build hangs on an undefined predicate.
  - **action**: Declare it first in the append zone as a hoisted function, and define it as the SAME expression spawn :2951 already computes inline (`state.mode==='capital'||state.mode==='turret'`), so the lawn's notion of "am I on the lawn" cannot drift from the spawner's. One definition, two readers.
-
  - **asm**: enlil
  - **severity**: MAJOR
  - **finding**: capRoute as specified opens an unplayable lawn. roundOpen() :2728 is `phase==='PRACTICE'||phase==='LIVE'||state.qaArmed`, and BOTH doors refuse without it: designate() toasts "PRESS PRACTICE, OR START THE ROOM, BEFORE YOU MARK" and fireN :2730 rejects with reason ROUND_NOT_OPEN. There are exactly two PRACTICE setters in the file — enterTheRange :5890 (FROZEN, and capRoute deliberately runs after it) and practiceNoRoom :3431 (free, but it refuses unless `state._selCh===0`). pickScenario sets `state.challenge=1`, so order matters. The package's capRoute calls only pickScenario('lawn') and jumpToTurret().
  - **action**: capRoute must call practiceNoRoom() BEFORE pickScenario('lawn'), while _selCh is still 0, then seat the station. Add this to the MAP_AND_STATION_OPEN_THE_LAWN gate: the assertion is not only that the link opens the Capital, but that TARGET, APPROVE and FIRE all act once it has.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: The segment budget refuses 18 standing silhouettes at ONE station, not just at 42 — and the lawn targets are what gets dropped. Measured: box() returns 12 segments, bullseye at the coarse band returns 3 (:2255), so 18 × 15 = 270 against `seg: Math.min(4000, 280+(step-1)*155)` = 280 at MoT 1.1 (:819). The Capitol is added with `own:true` at :1318 under DD-38 ("the scene's subject is never the first thing dropped", :1216), so the protected group takes its share first and the unprotected silhouettes are dropped — the exact r.128/r.129 defect the deck records at :2180. Enlil cites :2182 only against populating all 42.
  - **action**: Price this before the revision, not after. Either draw lawn targets through segsOwn/own:true and declare which subject wins at MoT 1.1 — the Capitol or the thing he must hit — or cap the standing set per fidelity band. D-50's ladder (6 ranges × 3 bearings) is 18 by construction, so this is not avoidable by choosing fewer stations.
-
  - **asm**: enlil
  - **severity**: MAJOR
  - **finding**: The package is 27 edits across 20 free spans plus 15 new definitions. That is not one revision, and it violates "one revision at a time" and "prefer removing complexity" even though every individual edit is legal. I verified span ownership for all 41 cited lines with the gate's own extractor: every one lands in a free span except :5928/:5929 (enterTheRange, FROZEN) and :6073 (goRange, movedSpans-frozen), which the package already routes around.
  - **action**: Ship as three: R-B THE LAWN IS PLAYABLE ALONE (LAWN + lawnPops + capLawn + capReach; lockOn :2303 append; asmTick :2940; the tap guard :4039; marksPersist :2722 with its three platesHere substitutions at :2643/:2646/:2736 and the recital at :3147; applyHit down-state :2703; the four metrics at :2704/:2682/:2762/:2768) — R-C THE PICTURE (silHit via :2700 only, slotBoxes :2231, drawTargets :2184 append, plateWord :2690) — R-D THE DOORS (the three traps, #plat, capRoute). Each with its gate red first on r.216's bytes.
-
  - **asm**: athena
  - **severity**: MAJOR
  - **finding**: Her deck-vs-record Capitol discrepancy is real and I confirm the numbers exactly. The deck's CAP at play.html:1301 is CORE 30, WING 20, EW 86.33, NS 44.04, COREY 26; the record's buildings[0] is a 12-vertex Greek cross with core x±30 y±55, wings x±88 y±20, heightM 29. CORE and WING agree; the N-S half-span differs by 10.96 m and the core height by 3 m. Every arc, masking figure and LPWS percentage in her package rests on the record, while every gate that can run reads the deck.
  - **action**: Settle it in the siting commit, before any arc is written into the record. The record's footprint carries source:'carried', confidence:'high' and names its provenance (mission-planning.tsx TX_CAPITOL), so the record should win and the deck's CAP.NS re-derived — but that is a deck edit to a free span (CAP), so it is cheap and should ride R-E, not be left unresolved.
-
  - **asm**: athena
  - **severity**: MINOR
  - **finding**: Her refutation of Builder's LPWS ground pockets — "inside the footprint+3 m buffer" — is measured against a bounding box, not the record's actual footprint. buildings[0].footprint is a Greek cross: (-34,-26) lies outside the core limb (|x|>30) and outside the wing limb (|y|>20), so it is not inside the footprint at all. Her roof conclusion is unaffected and still right — a 29 m attic masks itself from any mount below it, which is a vertical fact no horizontal siting answers — but this one supporting claim does not hold.
  - **action**: Re-run the clearance test against the 12-vertex polygon before the LPWS row is written, and restate the refutation on the coverage numbers alone (17.2% single / 0.0% double), which do not depend on the buffer.
-
  - **asm**: enlil
  - **severity**: MAJOR
  - **finding**: His freeze classification is correct against the file and I verified it by running the gate. goRange IS frozen — under movedSpans, movedPinnedAt 216, gated identically at range-frozen.test.mjs:72-79, alongside mapCam and drawMap — so Specialist 2's premise was wrong and his conclusion that lawn targets cannot join drawMap is right. pickMap :1990 is hard-FROZEN in spans and reads `[...pops,...drones,...doors]` at :2005, which a separate LAWN array never enters. Baseline at HEAD: range-frozen 7/0, range-2525 118/0, drone-playable 172/0.
  - **action**: Adopt the separate LAWN array; it is the only shape that needs no guard in frozen ground. But state the escape hatch honestly rather than calling the map impossible: range-frozen.test.mjs's own header permits a deliberate change that re-pins range-spans.json in the same commit. Lawn targets on the map would be a declared re-pin of drawMap AND an edit inside hard-frozen pickMap, which has no hatch in this programme — that is the sentence to give him, in one word, if he asks.
-
  - **asm**: CROSS
  - **severity**: MINOR
  - **finding**: The brief's own anchor is wrong and will be quoted into a DD row if nobody says so: "role=drone is hardcoded at :5884". `grep -c "role=drone" play.html` returns 0, nothing in the file reads a `role` query parameter, and :5884 is `state._selCraft='turret'`. Enlil caught it; Athena did not address it. Separately, shareUrl is declared indented at :9025, so it is not a top-level span the gate can see at all — it sits inside the free `qrcode` span, which is why it reads as "free".
  - **action**: Correct the anchor in the pod's output before it reaches the register. The real share-link facts are: shareUrl writes ?map=capital&station= at :9031, its own comment at :9030 says "The ?map= reader lands with the ladder (r.211)", and zero readers exist.
-
  - **asm**: enlil
  - **severity**: NOTE
  - **finding**: His append-zone reasoning is off by one span, though the conclusion holds. The gate's extractor spans the WHOLE file and ignores the `</script>` at :6723, so the last top-level declaration it sees is `qrcode` at :6742 in script #2, not lookToggle at :6673. A new definition appended before :6723 therefore lands inside lookToggle's span [6673, 6742), which is unpinned — so no frozen hash moves, exactly as he says. The const/let hazard is real and the deck records it twice in its own source at :6070 and :6115.
  - **action**: Keep the append zone and the hoisted-function rule; drop the "last top-level declaration" framing and say instead: the append lands inside lookToggle's unpinned span. Verify after every append by re-running the gate's own spansOf extractor, not by reading line numbers.

**Residual gaps:**
- frontend/tests/drone-arena.test.mjs could not be executed — ERR_MODULE_NOT_FOUND from both the repo root and frontend/. That is the gate that holds the append-only record, so I could NOT prove the record is green before a siting block is appended to it. Fix the module resolution first; a siting commit landing against a gate nobody can run is how the Shield row would slip in unnoticed.
- Only two of the four pod packages reached me intact — Athena complete, Enlil truncated partway through its gaps list (the standoff gap is cut mid-sentence at "THE GUN CO"). I could not check the other two packages' anchors or frozen/free classifications at all, and Enlil's remaining gaps are unread.
- I did not re-run Athena's scratchpad scripts (seven.py, laydown.py, lpws.py, roof.py, derive2.py, final2.py). Her geometry INPUTS all check out — turrets[] is exactly three at [0,-210]/[-210,0]/[210,0] heightM 3.0 homeAz 0/90/270, 14 buildings, gimbal.rangeM 400, arena radiusM 450, no siting block — but the derived figures (99.1% all-double, 98.1%/99.1% resilience, 304.1 m required reach, 100% roof cover) are unverified by me.
- Whether the Capitol or the lawn silhouettes take own:true at MoT 1.1 is undecided, and I could not price the Capitol's own-group segment cost (:1318 adds prism + polyAt + postsAt, :1319 adds three more courses) to say how much of the 280 is actually left for targets.
- LEAK has no definition, EW has no seat, mode or track condition, and Real-World's swarm is 9 (the paper) or 42 (the record's swarm block, passMark '42 aircraft at rung 2.3'). All three block the Advance and Real-World rungs; none is mine to answer and none should be guessed into a gate.
- I did not run scripts/drone-deck-qa.mjs (the 242-row boot QA at four viewports) or the two play-throughs. range-frozen.test.mjs's own header names these as the owed half of the freeze — the shared functions this whole build edits (lockOn, applyHit, fireN, drawTargets, marksPersist) are deliberately absent from the hash set and are held ONLY by that QA, which the header says nothing in CI runs yet.
- The standoff is the operator's word and nothing else will do. Enlil's derivation is sound and I re-checked its inputs: the record's south face is y=-55 and the wings x=±88, so CAP_RING=240 (play.html:1256) leaves 185 m clear south and 152 m on the wing axes, and D-50's 300 m ladder overshoots into the building on both. The declared 340 m standoff gives 285 m and 252 m — short of 300 on BOTH bearings, which the declaration did not notice. Every per-station target set depends on his answer.
- Enlil's claim that he applied all 27 edits to an in-memory copy and measured 0 frozen spans moved, 0 text pins lacking and 1,190,849 bytes is UNVERIFIED by me — I confirmed the span ownership of every line he names, which makes the claim consistent, but I did not re-apply the edits or re-hash the result.

### MoT · GATE over pod GROUND — **FIX_FIRST**

**Headline.** Eight of the sixteen claimed gates are genuinely red on r.216 and three would pass GREEN today as written (vacuous over an empty set or red only on a hypothetical mutation); worse, the record both packages want the siting written into has no append-only gate at all, and two gates cite DD-124, which is not in the register.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: THE RECORD THE SITING LANDS IN HAS NO APPEND-ONLY GATE. The brief and both packages assert "docs/drone-2525/drone-2525.v00.00.json, APPEND-ONLY, gated by tests/drone-arena.test.mjs". Measured: frontend/tests/drone-arena.test.mjs contains ZERO occurrences of 'turret' and ZERO of 'append' — it gates building provenance, the five-build determinism hash, the 13-colour palette and the Pi segment budget, nothing else. No test in frontend/tests hashes, chains or length-checks the record. Athena's entire rationale for keeping t-south/t-west/t-east verbatim ("the register is append-only and a correction is a new row, never an edit") is defended by nothing mechanical. The repo already owns the right mechanism and applies it elsewhere: frontend/tests/drone-revisions.test.mjs:31 chains the DECK register with sha(prev|rev|sha|bytes) and :29 forces strictly increasing revisions.
  - **action**: Before any siting row is written, add RECORD_IS_APPEND_ONLY to prebuild: port the drone-revisions.test.mjs:29/:31 chain onto drone-2525.v00.00.json (a per-row chain field, strictly increasing row ids, and a prior-bytes sha). Prove it red by replaying it against the record with one turrets[] entry edited in place rather than appended.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: TWO GATES CITE A DECISION THAT IS NOT ON THE RECORD. Verified: docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md is 3,458 lines and its last addendum is DD-123 at :3384 ('the white paper, and the ladder rewritten from it'); HEAD is b7e1a304e 'Persist DD-123'. DD-124 — the five-rung ladder, the Real-World lock, the four metrics, the THAAD/Patriot seat rows — exists only in the task text. Enlil's THE_LAWN_STORES_HIS_FOUR_METRICS and the second half of MAP_AND_STATION_OPEN_THE_LAWN ('no link opens Real-World on an empty record') both rest on it. Athena flags this correctly in her gaps; Enlil cites DD-124 as 'verbatim in ... (origin/main, commit 16a4114ee)' without noticing it is absent.
  - **action**: Persist DD-124 as its own commit (with its .sha256 sidecar) before either gate is written. Athena's count survives either way because her binding Sector constraint comes from DD-121 at :3264, which IS on the record.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: "SHIELD IN THE SKY" IS NOT IN THE REPO, CONTRARY TO THE BRIEF. The brief states it is at docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md with full text. Measured: that file does not exist; docs/asks/ for today holds only 2026.10.19_The_Future_of_Drone_Swarms_AI-4-Defense.pdf; a repo-wide grep for the phrase returns four unrelated Level-3 documents plus the register's own line at :3454, 'NOT PROVIDED, AND RECORDED AS SUCH: "Shield in the Sky."'. Athena independently measured this and refused M-SHORAD on it — that call is correct on today's bytes. Every item the brief sources to it (the ring law, the layered Patriot/M-SHORAD/Avenger assignment, the four defended assets, ATP 3-01.81, FM 3-12) is unsourceable in-repo.
  - **action**: Treat every M-SHORAD, ring-law and defended-asset row as unwritable until the briefing is persisted with a sidecar. Do not let a gate assert on a line whose only carrier is the task text.
-
  - **asm**: Athena
  - **severity**: MAJOR
  - **finding**: TWO GATES WOULD PASS GREEN TODAY, NOT RED — they are vacuous over an empty set. LPWS_CLEARS_THE_ATTIC holds 'Each LPWS mount stands at least 30.0 m above local ground'; her own red note concedes 'There is no mount to measure a height on, so the assertion has no subject'. A .every() over zero rows returns true. SENTINEL_NEVER_WEARS_A_FIRE_MODE is worse: 'A Sentinel row MAY carry Cue and Hold and nothing else' over zero Sentinel rows is vacuously satisfied. Verified: platforms[] in the record is exactly ['T1','D1Q','D1','D1F','M99','M66','ARK','R2'] — no point-defence mount, no Sentinel; and play.html has zero occurrences of homeAz/arcDeg/sectorArc, so no unit carries a mode field either. These are gates that could only ever pass.
  - **action**: Rewrite each with the existence clause INSIDE the assertion, so the count is what is red: 'there exist exactly 2 rows with class=="lpws" AND every one has mountHeightM >= 30.0 AND the pair double-covers 100% of the sampled RAM column'. Same shape for Sentinel: '>= 2 rows with role=="cue" AND none carries a fireMode outside {Hold,Cue}'.
-
  - **asm**: Enlil
  - **severity**: MAJOR
  - **finding**: THREE GATES ARE RED ONLY ON A HYPOTHETICAL MUTATION OF TODAY'S BYTES, SO THEY ARE GREEN ON r.216. THE_LAWN_SCORES_ITSELF_NEVER_THE_RANGE quantifies over lawn targets ('every lawn target has a sil, no form, and an id whose first character is not C'); there are zero today, so it is vacuously true — his own red evidence is the conditional 'Give a lawn target id:C-150L ... and every existing gate stays green'. A_HIT_LAWN_SILHOUETTE_GOES_DOWN says so in its own text: 'Today the 5-9 s idle.life=4+g at :2964 and the reaper at :2995 hide it; set life:1e9 on r.216's bytes and the same silhouette is hittable forever'. THE_BOX_FITS_THE_SILHOUETTE needs a marked lawn target to measure. Verified today: play.html:2703 is exactly `else {ref.lifePct=0;ref.fall=0.05;ref.mist=false; if(!isPlate) ref.up=true;}` and :2184 draws on p.up alone — so the DEFECT is real and present in source.
  - **action**: Re-anchor all three on source text, which IS red on r.216: assert that applyHit's non-plate re-raise at :2703 is guarded by a sil test, that slotBoxes :2231-2232 reads o.sil rather than falling to the 3.4/3.8/3.4 literals, and that no id reaching applyHit can satisfy isPlate's `id[0]==='C' && ref.form` from a lawn pool. A gate whose red proof requires mutating the file first is not red first.
-
  - **asm**: Enlil
  - **severity**: MAJOR
  - **finding**: THE OVERRIDE'S OWN LINE NUMBER IS OFF BY ONE, in the one package whose claim is byte-exactness. He decides 'Change :2700 to const ph=isPlate?plateHit(ref):(ref&&ref.sil?silHit(ref):null); and leave :2701 BYTE-IDENTICAL'. Measured in frontend/public/drone-2525/play.html: :2699 is `const ph=isPlate?plateHit(ref):null; state.lastBand=ph?ph.band:'';`, :2700 is `const off=pipOff(ref);`, :2701 is the pinned `const hit=!!state.simDirect || (ph?ph.hit:off<32);`. Applied literally the edit lands on `off`, not `ph`. The pin he is routing around is confirmed at frontend/tests/drone-playable.test.mjs:40. Three further cites are off: `_rr` and its onclick are at :6026 (not :6030, which is another handler's tail `if(state.sets&&state.sets.full) setFull(true); hudMag(); }`); hudScore is declared at :2681 and its HIT/MISS-vs-BLU/RED print is at :2687 (not :2682); the 3.4/3.8/3.4 literals are at :2232 (not :2231).
  - **action**: Re-derive every line number against r.216 bytes before any edit list is accepted. His diagnosis of the flat 32-px bubble and his routing-around-the-pin strategy are both sound and should be kept — only the addresses are wrong.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: THE ONE DISAGREEMENT UNDER EVERY ARC FIGURE IS GATED BY A console.log. frontend/tests/capitol-model.test.mjs:45-46 measures the record-vs-deck Capitol disagreement exactly and then PRINTS it: running it today emits 'OWED: the arena record still carries the Capitol ±55 m north-south, 24.9% deeper than the sourced 289 ft' and reports 23 passed, 0 failed. The record's capitol footprint is x±88 / y±55, heightM 29; the deck's CAP at play.html:1301 is {EW:86.33, NS:44.04, CORE:30, WING:20, WINGY:18, COREY:26}. Athena says 'neither flagged it' — the repo did flag it, but only as a non-failing note, which is exactly the class his law forbids. Every masking figure, every Sector arc and the whole LPWS attic argument rest on the record's 29 m / ±55; everything drawn on the glass rests on the deck's 26/30 and 44.04.
  - **action**: Promote capitol-model.test.mjs:45-46 from console.log to ok() in the same commit that freezes a single arc, or the arcs are computed against a geometry the deck does not draw. Pick one carrier first; both packages' numbers move if it is the deck's.
-
  - **asm**: Athena
  - **severity**: MAJOR
  - **finding**: EVERY_CONTACT_LOCKABLE_FROM_ITS_OWNER IS CIRCULAR: its pass threshold is produced by the very siting it is meant to police. It holds 'required reach 304.1 m is inside the formless-pop cap', where 304.1 m is measured over her own seven unrecorded seats in /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/athena_vote/laydown.py. Move a seat and the gate's green condition moves with it. The RED half is solid and independently verified: play.html:2303 is `pops.forEach(p=>{ if(!p.up) return; add(p,'pop',p,80); });` against :2300 and :2304 which both pass 340, and asmTick :2940 is `bd<(best.form?340:80)`; a repo-wide grep over frontend/tests and frontend/scripts for either cap returns NOTHING, so the reach has no gate today at all.
  - **action**: Rewrite as a derived assertion that reads the record: 'for every contact spot in the record, min over the record's own gun rows of range(spot,gun) <= the formless-pop cap in play.html'. Then the gate re-measures itself whenever a row moves, and 304.1 never appears as a constant.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: NEITHER PACKAGE SAYS WHICH HARNESS ITS GATES BELONG IN, AND THE RED-FIRST VEHICLE THEY NEED IS UNNAMED. Measured from frontend/package.json: prebuild is browser-free and runs ci-wiring, drone-revisions, deck-consistency, drone-playable, range-frozen, capitol-model, pose-rasters, magazine-rasters, deck-rcore, gen-rcore-revisions, cache-headers, owner-key-store-security, projects-registry, response-outbox — it does NOT run range-2525, drone-arena or drone-deck-qa. scripts/drone-deck-qa.mjs launches headless Chromium at four viewports (390x844, 844x390, 375x667, 667x375), is in test:ci only, and holds its live row set EQUAL to DECK_QA_ROWS in frontend/tests/deck-qa-manifest.mjs (251 rows today) with EXPECTED_RED=['SYNC_DIRECT'] and EXPECTED_RED_AT={'667x375':['EYE_SCALE_12_IN']} — and it fails BOTH ways ('every EXPECTED_RED row is actually red'), which is precisely the red-first mechanism these packages need and neither mentions.
  - **action**: Assign each gate: record/source-text gates (SITING_IS_ON_THE_RECORD, NO_GUN_STANDS_IN_THE_STREET, ARCS_FACE_OUTWARD, SECTOR_ARC_HAS_TWO_OWNERS, MARKS_PERSIST, MAP_AND_STATION, the applyHit guard) -> a new node test wired into prebuild. Pixel/behaviour gates (BUTTON_AND_TAP_AGREE_ON_REACH, THE_BOX_FITS_THE_SILHOUETTE, A_HIT_LAWN_SILHOUETTE_GOES_DOWN as behaviour) -> drone-deck-qa boot rows, added to DECK_QA_ROWS and to EXPECTED_RED in the red-first commit, with the exemption removed in the fixing commit.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: THE COMMIT SHAPE IS UNSTATED AND PREBUILD WILL FAIL WITHOUT IT. frontend/tests/drone-playable.test.mjs:17-21 holds public/drone-2525/play.html byte-identical to docs/drone-2525/operator-deck/drone-2525_r.216.html (both sha256 9f078e8059dafb8dc435026e5e92cb52dddb21730d8ed002ea4ec1f410615992 today) AND present in HASHES_r216.sha256; DECK_REV='216' is declared once in frontend/tests/deck-head.mjs; drone-revisions.test.mjs:26/:28/:31/:50/:53 require the new revision to be carried, hashed, chain-linked, narrated and named as README HEAD. All four of these are in prebuild. Neither package names a single one, so the first lawn edit breaks the build before any new gate runs.
  - **action**: State the commit shape in the plan: edit play.html -> copy to drone-2525_r.217.html -> append its HASHES line -> bump DECK_REV -> append the register row with its chain hash and narrative section -> only then the new gate. One revision, one commit set.
-
  - **asm**: Enlil
  - **severity**: MINOR
  - **finding**: THE DECISIVE PREMISE OF HIS SUMMARIZER-OVERRIDE IS REFUTED, THOUGH THE CONCLUSION SURVIVES. He overrides both colleagues on the separate LAWN array because of 'a fourth frozen reader of pops that neither found: goRange :6073 ... and stashRangeWave :6071 only ever snapshots 8 entries, so every lawn member silently falls on any return to the Range - inside a pinned span.' I re-ran the gate's own spansOf extractor over every `pops` reference: applyMode FROZEN :2921, pickMap FROZEN :2005, drawMap FROZEN* :2039/:2049, goRange FROZEN* :6073 (x4) — his four readers are right — but stashRangeWave at :6071 is a top-level function of its own and is FREE (absent from both spans and movedSpans in tests/range-spans.json). Widening the snapshot there repairs the index coupling without touching a pinned span, so the defect is NOT unrepairable-at-source. The conclusion still holds on applyMode :2921's unconditional `pops.forEach(p=>p.up=false)` and on frozen pickMap.
  - **action**: Keep the separate-array decision; restate its justification on applyMode and pickMap, which are genuinely unguardable at source, and drop the stashRangeWave argument. Also correct Athena's citation that range-frozen.test.mjs:16 names marksPersist and restoreCapitolTurrets 'deliberately absent' — :16 names only designate, markLock, approveDesig, fireN, lockOn, paintCues, hudPhase, placeFace, drawTargets, segs; the other two are absent from the pin but unnamed.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: FOUR INVARIANTS ARE ASSERTED ACROSS BOTH PACKAGES WITH NO GATE OF ANY KIND — these are the dangerous ones. (1) 'A person is never a target; a friendly icon that takes a hit is a failure' — no gate in either package, and applyHit has no team/side test on any branch. (2) 'The count of guns is an output of the siting, never an input' — asserted by both, gated by nobody; nothing would fail if 42 rows were written. (3) 'A named human decision exists before any machine shot' — frontend/tests/drone-authority.test.mjs gates the authority MODEL (levels 1-5, mandateFrom refusing a nameless decision, coversShot) as a pure module with no path to play.html; marksPersist() returning false off the Range means the lawn has no store for it, and no gate crosses the gap. (4) The DD register's own append-onlyness — asks-persist.test.mjs passes 224/0 but its window half keys on /^(\d{4}-\d{2}-\d{2})/ (hyphens) while CLAUDE.md mandates YYYY.MM.DD dotted names, so every dotted ask including the DD register is exempt from the stamp requirement; only an already-existing sidecar is matched.
  - **action**: Write (1) and (3) as prebuild gates before any siting row lands — they are his named laws and currently rest on prose alone. Fix asks-persist's dateOf to accept both separators so a new dotted ask with no sidecar fails; prove it red by checking out the tree without the 2026.10.11 sidecar.

**Residual gaps:**
- ONLY TWO OF THE FOUR PROMISED AsM PACKAGES REACHED ME. The task declares 'THIS POD FOUR AsM PACKAGES' but the array delivered Athena and Enlil only, and Enlil's gaps list is truncated mid-word at 'THE GUN CO'. I cannot review gates I was not given; two packages' gate sets are unaudited.
- ATHENA'S COVERAGE FIGURES ARE UNVERIFIED BY ME AND LIVE OUTSIDE THE REPO. Her scripts do exist (seven.py, laydown.py, lpws.py, roof.py, derive2.py, final2.py in /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/athena_vote/), but 63.4%/98.3%/99.1%/304.1 m/100.0% are scratchpad measurements, not repo tests. A figure that cannot be re-run in CI cannot carry a gate.
- ENLIL'S ZERO-FROZEN-SPANS SIMULATION IS UNREPRODUCED. He reports applying 27 edits in memory and getting 0 moved spans and 1,190,849 B. I verified the extractor, the pin file (100 spans at r.207, 3 movedSpans at r.216) and that all five drone gates are green today, but I did not re-run his 27 edits — I am read-only and the edit list was partly truncated.
- WHICH CAPITOL GEOMETRY WINS IS STILL OPEN AND I DID NOT DECIDE IT. Record ±55 / heightM 29 versus deck NS 44.04 / CORE 30 / COREY 26. capitol-model.test.mjs:45 already prints the 24.9% delta. Until one wins, every arc and every masking number in the GROUND pod is provisional.
- I DID NOT AUDIT THE drone-deck-qa ROW NAMES FOR COLLISION. DECK_QA_ROWS holds 251 ids today; I did not check the proposed rowIds against them, and the harness fails on a silently added row.
- THE 56-PIXEL pickNear PATH MAY OR MAY NOT BE NODE-TESTABLE. range-2525.test.mjs builds a new Function sandbox over the inline script and already exercises pipNearest with a stubbed state/view, so BUTTON_AND_TAP_AGREE_ON_REACH might fit a node test rather than a boot row — I did not prove the stub reaches pickNear's projection path.
- NO GATE EXISTS, AND NONE IS PROPOSED, FOR D-50'S LADDER FITTING IN FRONT OF A STATION. Enlil's gap measures 185 m clear south and 152 m on the wing axes at CAP_RING=240 against a 300 m ladder; I confirmed the record's footprint inputs (south face y=-55, wings x=±88) but not his ray-march, and no gate would fail if the ladder overshot into the building.
- LEAK AND EW REMAIN UNDEFINED BY HIM, SO NO GATE CAN SCORE EITHER. Both packages name this; I confirm nothing in the register defines a leaker, and FM 3-12 appears only in the task text, not in the repo.

### MoT · CUT over pod GROUND — **FIX_FIRST**

**Headline.** The lawn's one blocker is cheap and the fleet oversized the answer: ship r.217, persist DD-124, record only the three sourced turrets — then one revision (six free-span edits, zero frozen hashes) makes a man able to play the lawn alone; the seven-gun laydown, the attic LPWS and the Sentinel masts are record rows on a hand-authored DEM and must not size code.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: THE BRIEF'S OWN PREMISE IS FALSE. It states "THE TWO PAPERS, BOTH NOW IN docs/asks/" and cites docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md "(arrived today, full text)". That file does not exist — `ls docs/asks/*Shield*` returns nothing; a repo-wide grep finds only four unrelated Level-3 docs plus the register's own note. docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3454 says it in terms: "NOT PROVIDED, AND RECORDED AS SUCH ... not attached and not in the repo (grep finds no copy). The five lines are therefore taken from Grok's relay, not from a source I have read." Athena measured this independently and is right. Only the PDF (2026.10.19_The_Future_of_Drone_Swarms_AI-4-Defense.pdf) is first-hand.
  - **action**: Treat the ring law, the Patriot/M-SHORAD/Avenger layered assignment, the four defended assets (command post, fuel farm, ATP, maintenance cluster), the exchange-ratio debate and the ATP 3-01.81 / FM 3-12 citations as Grok relay. None may size a revision or enter the append-only record as sourced. Add one register row recording that the briefing is still unattached and that today's brief asserted otherwise. Ask him for the file.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: DD-124 IS NOT IN THE REGISTER AND BINDS NOTHING. The register ends at DD-123 (line 3384 of 3458); HEAD is b7e1a304e "Persist DD-123". The five-rung ladder, the THAAD/Patriot seat rows, the Real-World lock and the four metrics exist only in the task text. PERSIST FIRST, PLAN SECOND: a hash he can check, not an assurance he must trust.
  - **action**: Persist DD-124 as its own commit before any gate cites it. Note that the Sector-arc constraint everything downstream leans on comes from DD-121, which IS in the register (:3264-3302, verified verbatim), so that argument survives either way.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: r.217 HAS NOT SHIPPED AND FOUR SEPARATE RELAYS BOUND IT. DD-117, DD-118, DD-119 and DD-121 each end by bounding r.217 to the toast and the share line, "nothing on the lawn moves". Task #43 is still in_progress. DD-118 adds the sequencing: "Record every position, its arc, and its reason before a station moves. Then build the lawn to that record. Not before." His law: one revision at a time, no code for the next until the live site serves this one.
  - **action**: Ship r.217 alone and confirm LIVE. Everything in both pod packages is r.218 or later. Only the no-code record work (DD-124, the Shield row, the three turret rows) may ship before it.
-
  - **asm**: Enlil
  - **severity**: MAJOR
  - **finding**: THE BRIEF'S INSTRUCTION TO GROW `pops` IS WRONG, AND ENLIL'S OVERRIDE IS CORRECT — I re-probed it. `pops` is read by FIVE frozen or moved-frozen spans, not the two the brief implies: goRange play.html:6073 `pops.forEach((p,i)=>{p.up=!!RANGE_WAVE.pops[i];})` is INDEX-COUPLED, and stashRangeWave :6071 returns early unless chNum()===0, so it snapshots exactly 8 — every index >= 8 restores undefined -> up=false, and the repair site is inside a pinned span. Also applyMode :2921 (FROZEN), pickMap :2005 (FROZEN), drawMap :2039/:2049 (movedSpans, movedPinnedAt 216), toolSelfTest :5338. goRange IS gated — range-frozen.test.mjs:72-79 — so Specialist 2's "goRange is NOT in range-spans.json" is false and would have licensed an edit to it.
  - **action**: Build the lawn's targets in a separate hoisted `var LAWN=[]` at the end of inline script #1. It is read by nothing frozen, so it needs no guard in frozen ground at all — the smaller change, which his law prefers. Declare the consequence: lawn targets are not drawn on the overhead map, which is right anyway since the map is the 42-station menu.
-
  - **asm**: Enlil
  - **severity**: MAJOR
  - **finding**: THE ROOT CAUSE IS THE SPAWN SPOTS, NOT THE 80 m CAP — and neither package leads with it. play.html:2961 spawns every lawn pop at one of six hardcoded spots `[[0,1.2,22],[12,1.2,18],[-12,1.2,18],[0,1.2,-20],[18,1.2,0],[-18,1.2,0]]`, all within 22 m of the rotunda — i.e. standing ON the defended asset — while the player sits at CAP_RING=240 (:1256). That is why every lawn contact measures 218-262 m from the seat and why the tapped pop read 222.3 m. DD-117 verbatim: "the Capitol is the defended asset. It is not a target."
  - **action**: Move the six spots to his own answer — in front of the SEATED station at 50/100/150/200/250/300 m, left/centre/right. `spawn` is free (absent from range-spans.json, verified). This one edit is the largest single step toward his intent and it also halves what the reach change has to carry.
-
  - **asm**: Enlil
  - **severity**: MAJOR
  - **finding**: marksPersist IS FOUR EDITS AND THE ONE-EDIT VERSION SHIPS A SAFETY REGRESSION. I counted 18 callers of marksPersist(). Exactly four carry a SECOND Range-only condition the body never reaches: approveDesig :2643 and :2646, fireN :2736 (all `platesHere().some(p=>p.id===state.desig.id)`; platesHere :1247 is FROZEN and filters on `q.lane`, which a formless lawn target has not), and hudPhase :3147 (`lk.ref.lane===(state.lane||0)`). Widening :2722 alone lights the button, leaves the recital printing nothing, and SILENTLY DISARMS the two NOT_MARKED HOLD guards — against his law that a shot with no approval does not score. Enlil found this; Specialist 1's package does not mention the four sites.
  - **action**: Widen :2722 and substitute a mark-pool predicate at :2643, :2646, :2736 and a lane predicate at :3147 in the same commit. Do NOT add a new `capLawn()`: `rungIsRange()` already exists at :6116 and is exactly `chNum()===0` (rungWord/rungTitle are built on it). R-CORE NO REWORK — reuse it.
-
  - **asm**: Enlil
  - **severity**: MAJOR
  - **finding**: THREE OF HIS FOUR METRICS ARE NOT COMPUTED ON THE LAWN, NOT MERELY UNSHOWN — Enlil found this alone and it is confirmed. applyHit :2704 is `if(isPlate){ ... state.rangeHit/rangeMiss ... }`, so a lawn target moves neither counter. hudScore :2682 prints HIT/MISS only on the chNum()===0 branch. No lawn clock and no round counter exist. Ten approved rounds on the lawn today leave all four at zero, so every lawn run is void by his own words. magSpend :960 is FROZEN (verified) and has exactly two callers, :2762 and :2768, both inside the free fireN.
  - **action**: Count rounds at fireN's two magSpend() call sites, never inside magSpend. Widen applyHit :2704's guard and add a hudScore lawn branch plus one clock tick in the free `spawn`, above the pinned rangeTick driver line. Gate: THE_LAWN_STORES_HIS_FOUR_METRICS, red first on r.216's bytes.
-
  - **asm**: Athena
  - **severity**: MAJOR
  - **finding**: SCOPE CREEP — "THE SEVEN SEATS WITH COORDINATES AND ±62° ARCS". Athena's count is honestly derived twice, but it rests on a 698-sample line-of-sight model over a DEM in which 13 of 14 buildings are `confidence:'low'`, hand-authored (verified: Counter({'low':13,'high':1}); only `capitol` is source 'carried'/'high'). AVG-2's value is set by price-daniel and clark, both low. The register is APPEND-ONLY: seven coordinates and fourteen arc bearings frozen on a placeholder DEM can only be corrected by another row. Athena's own gap #4 concedes this. His law: the count of guns is an OUTPUT of the siting — of a surface he can trust, not of a stand-in.
  - **action**: CUT to three rows: the record's own t-south, t-west and t-east gaining `arc`, `class` and `reason`, kept verbatim at their sourced coordinates. Record the 240 m ring as the named balanced-fires option DD-118 explicitly keeps. Record the weighted-avenue count as BLOCKED on `scripts/security-2525/build_dem.py capitol-lawn --dataset ned10m`, which the record itself names as the remedy. The siting record is owed; seven numbers on a hand-authored DEM are not.
-
  - **asm**: Athena
  - **severity**: MAJOR
  - **finding**: SCOPE CREEP — "LPWS ×2 ON THE CAPITOL ATTIC AT 30.0 m, AT (0,-42) AND (0,+42)". DD-121's words are six, verified verbatim at :3288: "An LPWS on the Capitol takes the incoming round." That sentence assigns a CLASS to a SEAT. It specifies no count, no 30.0 m height and no coordinates. Athena's measurement is genuinely better than both colleagues' ground pockets, but the whole model sits upstream of a threat class that does not exist in the deck: there is no incoming round, no C-RAM burst, and no point-defence row — platforms[] is T1, D1Q, D1, D1F, M99, M66, ARK, R2 (verified).
  - **action**: Record ONE LPWS seat: class = incoming round, position "on the Capitol" in his own words, height OWED. Build nothing. Siting a mount for a threat class that has no object is building the roof before the room. The attic measurement keeps as evidence for the revision that actually adds the RAM class.
-
  - **asm**: Athena
  - **severity**: MINOR
  - **finding**: SCOPE CREEP — THE SENTINEL PAIR'S COORDINATES AND NUMBERS. (-195,-35) and (210,-80) on 9 m masts with 450 m range, measured to a 96.6% union. Athena declares both numbers hers and is straight about it; the record's sensor block carries no range field and no height field (verified — the top-level `sensors` key is absent; the singular `sensor` key holds only a profile). A gate written on them would gate a guess.
  - **action**: CUT the coordinates and the two numbers. KEEP the law, which is free: Sentinel is a pair, it cues, and it never wears a fire mode. The one Sentinel behaviour with a cheap mechanical form is DD-124's "SENTINEL MUST NAME IT BEFORE FIRE COUNTS" — one predicate on the fire gate, and it is worth more to him than two mast positions.
-
  - **asm**: Athena
  - **severity**: MINOR
  - **finding**: TWO FLEET DECISIONS ARE CORRECT AND CHEAP AND SHOULD NOT BE LOST IN THE CUT. (1) ARCS FACE OUTWARD: play.html:1267 sets `u.yaw=yawTo(0-u.x,0-u.z)` — "face the ROTUNDA" — for all 42, and the record repeats the error with homeAz 0/90/270. Every optic points at the thing it defends. restoreCapitolTurrets is FREE (verified absent from range-spans.json). One line. (2) M-SHORAD AND THE INVENTED DEFENDED ASSETS ARE STRUCK — Builder's four corner mounts and his fuel farm (180,-185), ATP (-195,-150) and maintenance cluster (0,+255) have no source but the absent briefing, and three of his eight guns are pulled to those three invented points.
  - **action**: Fold the outward-facing yaw into the record rows and into the playable revision — it is the single change that turns a sightseeing standoff into a defence and it costs one line in a free function. Strike M-SHORAD and the three invented assets from the record entirely; DD-117 is verbatim that the Capitol is the defended asset.
-
  - **asm**: CROSS
  - **severity**: NOTE
  - **finding**: THE ORDER, AND THE ONE REVISION. R0 (no code, ships before r.217): DD-124, the Shield row, the three turret rows. R1: r.217 as bounded. R2 — THE ONE THAT PUTS THE MOST OF HIS INTENT ON HIS PHONE SOONEST, "A MAN CAN PLAY THE LAWN ALONE": the LAWN array; his 50/100/150/200/250/300 L/C/R ladder in front of the seated station replacing the six rotunda spots; one APPENDED line after lockOn :2303 (leave :2303 byte-identical) plus asmTick :2940, reusing the Range's own 340 from :2300/:2304 so no new number enters; the precedence fix at pcTargetApprove :4039 so the tap obeys the same reach as the button at :5829; the four marksPersist edits; life:1e9 WITH the down-state fix at applyHit :2703 and the lifePct filters at candidates :2531-2532; and four early returns in the free teleport handlers (_rr :6030, tgtPick :6034, _rm :6036, #plat :3967 — whose real mechanism is pickScenario :6108 writing 'lawn' into the select while state.mode stays 'capital', after which spawn's `cap` test at :2951 fails and the lawn goes silently dead). Zero frozen hashes move. R3: the four metrics. R4: the ?map=/?station= reader, appended AFTER the boot IIFE — NOT at :5928-5929, which is inside the FROZEN enterTheRange span (:5879 to `const CIN` :5934). R5+: simultaneity across classes (D-49), the three ported drills (D-50), the ground and RAM classes, the scale-true hit test, the weighted siting once the DEM is real.
  - **action**: Build R2 and nothing else after r.217 is LIVE. DEFER by name: the scale-true hit test silRect/silHit (its need is inferred, not reported — r.151 already shipped LOCK_REACH_PX=48 at :2282 and the FIRE_HITS_A_POP boot row at :4525-4543 proves a marked+approved lawn pop already fires and hits; ask him whether it is too easy after he plays it once) and the ?map= reader (owed twice, but it is the ladder, task #22, not playability).

**Residual gaps:**
- TWO FACTUAL ERRORS IN THE TASK BRIEF ITSELF, both verified. (1) "role=drone is hardcoded at :5884" — FALSE. `grep -c "role=drone"` returns 0; :5884 is `state._selCraft='turret';`. shareUrl :9031 writes `role=turret` and NOTHING in the file reads `role` at all. (2) The brief describes the lawn's 8 pops as "hard-coded spots" without naming where: they are within 22 m of the rotunda, which is the actual root cause of the unplayable lawn and is not mentioned.
- THE STANDOFF — HIS WORD IS NEEDED AND NOTHING ELSE WILL DO. From the record's own footprint (south face y=-55, wings x=±88), CAP_RING=240 leaves 185 m clear south and 152 m on the wing axes, so his 50-300 m ladder overshoots INTO the building by 115 m south and 148 m east. The DECLARED 340 m standoff gives 285 and 252 — short of 300 on BOTH bearings, which the declaration did not notice. Either the picture wins (he approved 240 at r.208 because it is the only distance at which the whole building reads through the EYE optic) and the ladder is capped per bearing, or the stations stand back and the Capitol shrinks in the glass. R2 populates the seated station only, so it is correct under either answer — but the number is his.
- THE RECORD AND THE DECK DISAGREE ABOUT THE CAPITOL. The record's capitol is x±88, y±55, heightM 29 (verified, the one 'carried'/'high' row); the deck's constants at play.html:1301 are EW 86.33, NS 44.04, core 26 per Athena's measurement. An 11.0 m disagreement on the north-south half-span. Builder measured against the deck, Adversary against the record, neither flagged it. One must win before any arc is frozen into an append-only row.
- LEAK STILL HAS NO DEFINITION FROM HIM. Named as an Advance scenario and as what an inner ring exists for, but nothing says what makes a contact a leaker rather than a missed track — a bearing, a range band, a time past a line, or a gun that failed to fire. No gate can score it.
- EW IS IN HIS SOURCE AND NOT IN HIS LADDER. The PDF puts a spoof package degrading swarm cohesion into the fight and FM 3-12 appears in back matter for the first time, but no rung, no seat and no fire mode carries it. Undecidable until he says whether EW is a seat, a mode, or a condition on the track.
- WHETHER REAL-WORLD'S SWARM IS NINE OR FORTY-TWO. The paper says "three groups of three X-BAT drones (nine total)"; the record's swarm block says total 42, perSide 21, pass mark "42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times". This is the one open question that could genuinely change the gun count later, so it is worth asking before the weighted siting is attempted.
- THE DEM IS HAND-AUTHORED AND THE RECORD NAMES ITS OWN REMEDY. 13 of 14 buildings and the whole 9x9 elevation grid are confidence:'low'. Every line-of-sight and masking figure in the Athena package rests on it. `scripts/security-2525/build_dem.py capitol-lawn --dataset ned10m` is the named fix and should run before any arc is written.
- HE ASKED FOR A PLAN, NOT CODE. His words today: "Assess ... to generate plan; as deep level thinking is required for more realistic training and engagement." The record work (R0) answers that literally and can be in his hands today. R2 is what makes the assessment worth having, but it waits on r.217.

### MoT · CONTRADICTION over pod FIGHT — **FIX_FIRST**

**Headline.** All four FIGHT packages are measured on a working tree 12 commits behind origin/main — r.217 has shipped and DD-126/127 already answer three of the gaps they report as owed — and inside that stale frame four contradictions are load-bearing: Enki's street-gate laydown re-opens a decision he declined (D-49), Thor's rung gate cannot ship without editing a sha256-frozen span, Enki and Odin give irreconcilable dead-ground numbers for the same three turrets, and Enki's A1 command post sits on a door the record itself defines as a pop-up target.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Every package measures "r.216 bytes" on HEAD b7e1a304e. origin/main is 358077835 — 12 commits ahead. r.217 SHIPPED (02c8cf03a / 39ffb9e06). Four operator decisions are persisted there that no package read: e27ab97ba DD-126 (Shield in the Sky IS the Real-World scenario; its nine beats ARE the rung's phases), 0d206c027 DD-127, 0483e0198 DD-128, 358077835 DD-129. DD-127 answers outright the gap Thor, Enki and Odin all file as owed: "EW is electronic warfare, usually jamming" — jamming is a CONDITION ON THE GLASS landing on Introductory's existing cue gate, NOT a sixth rung, and it is on BOTH sides of the fight (his words: "The paper has EW on BOTH sides; I had recorded ours only"). It also makes Asar's fourth line scoreable. Only Enki noticed the tree was behind, and even Enki saw only DD-126. Reporting EW as owed is the second ask on a question he has already answered.
  - **action**: Fetch origin/main, re-measure every line number and every frozen/free classification on r.217 bytes, read DD-126 through DD-129, and strike EW from the owed list — carrying forward only DD-127's own two remaining questions (does jamming enter before Real-World; does the player ever emit EW or only receive it). Under his standing sign-off; no word needed.
-
  - **asm**: Enki
  - **severity**: BLOCKING
  - **finding**: Enki's threat-laydown decision moves spawns to the bounding streets "so every track crosses the gun ring on its way in" — a rationale that requires motion. D-49 is persisted at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3243-3248 in his own reading: "He did not choose moving threats ... So the lawn's contacts stay POP-UPS ... and they do not fly or close. Those three are not in scope and are recorded as offered-and-declined." The brief's ALREADY-DECIDED repeats it. Separately his own siting answer is "targets stand in front of each station at 50/100/150/200/250/300 m" — on CAP_RING 240 facing the rotunda (play.html:1256, :1267) the four street gates at 230-300 m stand BEHIND most of the ring, not in front of any station. Enki's own gate EVERY_CLASS_IS_REACHABLE_FROM_ITS_OWN_SEAT is made strictly harder by Enki's own laydown.
  - **action**: D-49 and his 50-300 m answer govern. Drop the street-gate laydown from the plan. The parts of the decision that survive without motion — moving the six spots OUT of the Capitol core, and the north-lawn allee as a second screened approach — are kept and are within sign-off. Re-opening approach geometry NEEDS HIS WORD, phrased as the one word D-49 reserved ("one word reinstates movement later").
-
  - **asm**: Thor
  - **severity**: BLOCKING
  - **finding**: Thor's gate NOTHING_SETS_THE_RUNG_BEHIND_ITS_BACK requires every state.challenge= assignment to carry a /*RUNG*/ marker or be a restore. Verified: there are exactly 40 true assignments (Thor's count is right). But enterTheRange IS sha256-pinned — tests/range-spans.json spans has 100 keys and enterTheRange is among them, pinnedAt r.207 — and enterTheRange (play.html:5879) contains state.challenge=0 at :5886 and state._selCh=0 at :5885. Marking that line changes the span's bytes and fails tests/range-frozen.test.mjs. Thor cites those same clamps approvingly two decisions earlier, so the package endorses the freeze and breaks it in the same breath.
  - **action**: DD-35 and the freeze govern. Re-shape the gate: either an explicit allowlist naming the frozen writers it may not annotate (enterTheRange at minimum), or move the assertion off source text onto the value at a single chokepoint that rungAdmit owns. Gate-shape fix only — within sign-off.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Enki and Odin report irreconcilable dead ground for the SAME three sourced turrets. Enki: "the record's THREE sourced turrets leave dead ground that is small and NAMEABLE ... 6-15 cells." Odin: t-south 49.2% dead, t-west 53.3%, t-east 51.8%. The masks differ: Enki ray-marches CAP-X/WING-X only — no DEM, no range gate, 2 of 14 prisms — while Odin uses the full record. The record declares gimbal.rangeM 400 and nearM 5 (verified), which Enki's mask omits entirely. This is not a sampling artefact: Enki's gate A_LOST_GUN_DARKENS_GROUND asserts max-over-guns(cells lost) >= 1 and reports it reads identically 0 on CAP_RING 240. With the record's 400 m reach applied to a 240 m ring, stations reach only ~160 m past centre and rim cells fall out of multi-gun cover, so the same gate would very likely read non-zero. A gate whose red/green flips with the mask is not a gate under his law.
  - **action**: The record governs — gimbal.rangeM 400, nearM 5, all 14 prisms, the DEM grid. Declare ONE mask in writing, re-run both coverage results on it, and only then decide whether A_LOST_GUN_DARKENS_GROUND is red. Do not put either number in front of him until they are taken on the same mask. Within sign-off.
-
  - **asm**: Enki
  - **severity**: MAJOR
  - **finding**: Enki sites A1 COMMAND POST on the Capitol south portico, i.e. on D-CAP-S. The record's targets block says plainly "Every building door is a pop-up target" (verified, targets.note), and play.html:895 lists D-CAP-S/N/E/W in doors[], reachable by the :2308 fallback at dist<70. So Enki's command post IS a shootable target by the record's own rule. Worse, this exact collision is ALREADY a persisted operator-facing finding in DD-126 (e27ab97ba): "THE DEFENDED ASSET IS CURRENTLY SHOOTABLE — a contradiction at the root of a rung whose pass condition is that the asset is still there when it ends." Enki's mitigation item ("asset ids must never begin with 'C'") addresses applyHit's plate routing at :2694 and does not touch the doors[] pool at all.
  - **action**: DD-126 governs. Carve the four Capitol facades out of the door pool on a Capital unit in the same revision that places A1, and append a NEW record row narrowing "every building door is a pop-up target" to exclude defended assets — append, never edit. Both within sign-off; cite DD-126 so he does not read it twice.
-
  - **asm**: Thor
  - **severity**: MAJOR
  - **finding**: Thor's gate A_QUERY_STRING_NEVER_NAMES_A_RUNG goes red against a SHIPPED, PASSING, GATED test. Verified: progression.ts:37-38 is `export function unlocked(prog, mode, isJoiner = false) { if (isJoiner) return true;` above the ladder check; command-ux1.tsx:69 sets the joiner from /[?&]crew=/; tests/drone-progression.test.mjs:28 asserts unlocked(init,'multi',true)===true under the sentence "a crew joiner is never locked out of the mode they were invited into" — the comment in progression.ts calls it "invited, not promoted". DD-124 says Real-World is LOCKED and "a link, a menu or a query string must not open it." Both are his. (Thor cites :31; it is :28 — substance correct.)
  - **action**: NEEDS HIS WORD. The narrow reconciliation is to exclude LAST_STAGE by name from the joiner carve-out, leaving every other invited stage open — but that changes a crew behaviour he designed deliberately, so it is one sentence from him, not a sign-off call. Everything else in Thor's query-string decision (shipping the ?map= gate in the same revision as r.211's reader, since shareUrl:9031 already emits the key) is within sign-off.
-
  - **asm**: Odin
  - **severity**: MAJOR
  - **finding**: Odin's package invariant reads "every place a target may stand is seen by at least two guns that can reach it from open ground." Odin's own body then measures that 1.5% of the lawn is coverable by NO candidate at all and silently restates the law as "a target may only stand where two guns reach it." Those are different invariants: the first is a coverage guarantee, the second is a placement constraint. His rule is "state the invariant before the code — one sentence that must hold whatever any backend does." A package may not lead with an invariant its own measurement refutes. Compounding it, Odin's dead-ground denominator is open ground across the 450 m arena, while his own answer places targets at 50-300 m in front of each station — so part of the 49-53% "dead" is ground where no target may ever stand.
  - **action**: The restated form governs and is the better law: it is measurable, it is consistent with D-49 (pops are placed, not flown), and it makes Real-World's "a threat left with no gun that can lock it" a siting-time check rather than a runtime one. Rewrite the package header to it and re-report the dead-ground percentages over the placeable set only. Within sign-off, but show him the restated sentence explicitly — it changes what that failure means.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: Enki and Thor hold opposite rules about when a gate may be written, and Enki's own gate breaks Enki's side of it. Measured over play.html: friendly 0, hostile 0, protected 0, civilian 0, IVAS 0, asset 0, Avenger 0, Sentinel 0, Patriot 0, C-RAM 0, ripple 0, salvo 0, x-bat 0. Thor: "Do not write failure gates before the nouns exist ... it would go green vacuously." Enki nonetheless ships A_PROTECTED_CONTACT_EXISTS_AND_NEVER_LOCKS, whose first assertion fails "outright" today because the feature does not exist. That is a TODO wearing a gate's clothes, not red-first: his red-first law means the gate catches the defect the revision repairs, on the previous revision's bytes.
  - **action**: Thor governs. A gate binds behaviour that exists after its revision and would have been violated before it. Enki's protected-contact row becomes a real gate only in the revision that introduces the protected contact — hold it there. Enki's rows that ARE honestly red today (NOTHING_ON_THE_LAWN_LOCKS_WITHOUT_A_CAP, EVERY_LAWN_CONTACT_IS_OUTSIDE_THE_BUILDING, THE_FENCE_BOUNDS_ITS_OWN_LAWN, ONE_CAPITOL_IN_BOTH_CARRIERS) are unaffected. Within sign-off.
-
  - **asm**: Enki
  - **severity**: MAJOR
  - **finding**: Enki's override calls the plan "a PORT between carriers ... not an authoring job" and prices it as free under NO-REWORK. The deck fetches nothing and imports nothing (verified: grep -c 'drone2525.progression' play.html = 0), so a port here is a hand-written second copy — and his own record already recorded what that costs. docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:1640-1644: "the deck is one static file and cannot import the React component. A port is exactly where a missing guard, a missing memo or a synchronous recompute hides — the shared panel and the port can look identical and behave differently under the thumb." That is the r.210 panel port, and it produced DD-89. Enki's own premise — that the lawn already exists twice and the two copies disagree — is the evidence AGAINST a third hand-port.
  - **action**: NO-REWORK governs the RULE, not the file. Reuse the vocabulary and the definitions (swarm.ts:22 Affiliation, :52 sideOf, los.ts:36 lineOfSight / :73 losReason, verified present), but either GENERATE the deck's copy from lib/drone-2525 at build time or gate the two copies against each other by value — and say so in those words rather than "port". Within sign-off; the method choice should be stated to him in one line because he has been burned by a port once.
-
  - **asm**: Enki
  - **severity**: MAJOR
  - **finding**: Enki's gate ONE_CAPITOL_IN_BOTH_CARRIERS names two carriers. There are three, and the record itself names the third as its own source. Verified: record buildings[0] footprint y ±55, door [0,-55], note "footprint carried verbatim from components/security-2525/mission-planning.tsx TX_CAPITOL — not re-authored", source "carried", confidence "high"; frontend/components/security-2525/mission-planning.tsx:109 holds that identical footprint and the same ref [30.27467,-97.74035]; play.html:1301 CAP.NS=44.04 and play.html:895 D-CAP-S at z 46.04. Enki's drifts (10.96 m face, 8.96 m door) are confirmed exactly. Enki's declared reversal — "the deck's size is right; correct the record" — would require a new record row AND an edit to mission-planning.tsx, which is not append-only and has its own consumers at :175.
  - **action**: The record governs and the deck moves to it; widen the gate to compare all THREE carriers or the third drifts next. Moving the deck to the record is within sign-off. Keeping the deck's number instead is NOT, because it edits a verbatim-carried source — that one needs his word.
-
  - **asm**: CROSS
  - **severity**: MINOR
  - **finding**: The brief's own FROZEN list is wrong about goRange and the packages inherited it. Measured: tests/range-spans.json spans holds exactly 100 keys and goRange is NOT among them; tests/range-frozen.test.mjs:67 excludes it by name and says why — "goRange (the range is now handed back whole after a challenge), mapCam and drawMap." The brief lists goRange as FROZEN, and the same brief names three teleport traps that "run goRange() and send the player back to the Range." Believing goRange frozen ruled out the cheapest fix for all three traps, and no package proposed touching it. (Thor's two freeze claims are both correct as measured: 100 keys in spans, magSpend present, fireN/lockOn/designate/applyHit absent.)
  - **action**: The manifest governs. Correct the brief's FROZEN list — goRange, drawMap and mapCam are FREE — and re-cost the three teleport traps with goRange on the table. Within sign-off; it widens what may be fixed and changes no decision.
-
  - **asm**: Enki
  - **severity**: MINOR
  - **finding**: Enki labels the BULL-1 finding "OVERRIDE — neither specialist found this and it inverts the brief's premise." The brief already states it: "Today's 14-agent assessment found this is a PRECEDENCE DEFECT in the TARGET-button fallback, not purely a reach limit." The two underlying facts are real and verified (play.html:2301 rings.forEach with no cap argument; :916 BULL-1 at deck (0,2.2,26) with up:true permanently; :2308 door fallback dist<70 reached only when the main pool is empty), but the novelty claim is false and costs him a second read of a finding he already has. Two citations are also off by one: D-CAP-S is at play.html:895, not :894 (:894 is `const doors=[`), and D-11TH is at :896, not :895.
  - **action**: The brief governs on framing. Re-label as a confirmation-with-detail, keep the BULL-1 and D-11TH measurements (they ARE new at that granularity), and correct the two line numbers before anything citing them is written. Within sign-off.

**Residual gaps:**
- MY TASK TEXT WAS TRUNCATED. It delivered Enki and Thor in full and Odin cut off mid-decision at "revers…"; the FOURTH FIGHT package was never delivered to me at all. Odin's remaining decisions and the whole fourth package are unexamined for contradictions. Re-run this angle with the complete set.
- I read DD-126 and DD-127 only. DD-128 (0483e0198, "Grok's two whitepaper files, and the one thing wrong with them") and DD-129 (358077835, "Grok's final note relayed, and what actually landed, measured") are on origin/main and I did not open them — they may close or move further gaps the packages report as owed.
- Every line number and every measurement I verified is on b7e1a304e / r.216 bytes, because that is the tree I was given. r.217 shipped (02c8cf03a) and I did not diff play.html between them. Nothing in this report should be cited against r.217 until it is re-measured there.
- LEAK still has no definition from him, and I found none anywhere in the repo. All three packages I saw agree. Enki's proposal (a track that crossed the outer ring un-engaged and is inside the inner ring on a bearing to a defended point) is the only candidate on the table and is a proposal, not a decision.
- DD-127 closed EW's shape but left two sub-questions explicitly open in his own record: whether jamming enters only at Real-World or earlier as a difficulty, and whether the player ever has an EW effect of his own or only ever receives it. Still owed.
- Four defended assets or five. The paper names "fuel bladders, ammo stacks, maintenance bays, and generator rows" plus the command post; the brief's set has four. GENERATOR ROWS appears in no package's laydown. I did not find this answered on origin/main.
- I did not run the test suite. Frozen/free classification is read from tests/range-spans.json's spans dict and from range-frozen.test.mjs's exclusion note, not from an executed gate.
- Odin's ctrl='OUT' glyph finding is CONFIRMED and is not a contradiction — play.html:1981 is `ctrl==='AI'?'◬':ctrl==='SH'?'♡':'웃'`, glyph is FREE (absent from spans), and an unrecognised value falls through to 웃. Worth one addition in his words: 웃 is the SoI Trinity's Human Intelligence mark, so a destroyed mount would render as the project's own emblem for a crewed human seat, not merely as "a crewed gun".

### MoT · BUILDABILITY over pod FIGHT — **FIX_FIRST**

**Headline.** The cheap lawn fixes are genuinely one revision and all simulate green, but three of the pod's gates can never go green as written, one package's central decision rests on a misread, and this tree is behind origin/main by at least three DDs that already answer part of the question.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Every package, and the task brief itself, was measured on a tree that predates the decisions. HEAD here is b7e1a304e and docs/asks/ holds ONLY 2026.10.19_The_Future_of_Drone_Swarms_AI-4-Defense.pdf — the brief's anchor docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md DOES NOT EXIST in this working tree. origin/main is at f7f21cb67 'The whitepaper copy of Shield in the Sky is generated from the pinned source, and gated (DD-128 / DD-129)', with 358077835 (DD-129) and c300721e1 ahead of it. Enki flagged the tree being behind and named DD-126; it is worse — DD-128 and DD-129 land after it and one of them makes the Shield copy a GENERATED, GATED artefact, which changes how any new doc in this programme may be written.
  - **action**: Rebase onto origin/main and re-run every measurement before a line is written. Read DD-126, DD-128 and DD-129 first and strike from the plan anything they already decide. Do not ship a revision built on b7e1a304e bytes.
-
  - **asm**: thor
  - **severity**: BLOCKING
  - **finding**: His gate NOTHING_SETS_THE_RUNG_BEHIND_ITS_BACK is unsatisfiable on the frozen deck. His count is exact — I measured 40 assignments to state.challenge — but 2 of the 40 sit INSIDE pinned spans: line 5886 in enterTheRange (frozen in range-spans.json) and line 6075 in goRange (frozen under movedSpans). Simulated: inserting a bare '/*RUNG*/' line at 5886 reports enterTheRange moved, i.e. range-frozen.test.mjs goes RED. A gate whose green state requires moving a frozen span is a gate that can never be satisfied, and attempting it is DD-35 backwards.
  - **action**: Reword the row to 'zero unmarked writers OUTSIDE the pinned spans; the two inside enterTheRange (:5886) and goRange (:6075) are admitted by name in rungAdmit's own contract, because the Range's own rung-0 reset is not a bypass.' 38 writers are free and markable.
-
  - **asm**: thor
  - **severity**: BLOCKING
  - **finding**: The ?map= reader cannot be written where he puts it. The brief and his package both treat the boot query block at :5928-5929 as free. It is not: the gate's extractor is POSITIONAL — a span runs from its declaration to the NEXT top-level declaration — so enterTheRange's hashed bytes run lines 5879..5934 (next decl is `const CIN` at 5934) and swallow the whole boot IIFE including the ?range= reader. Simulated: inserting a ?map= reader line at 5929 reports enterTheRange moved — RED. So 'write the ?map= gate into r.211' is not buildable as described.
  - **action**: Put the reader in a new hoisted `function rungFromQuery()` in the append zone (measured safe: lines 6104-6722, inside script #1, after goRange's pinned range ends) with its own boot call there — simulated green. The r.209 comment at :6114-6115 already nominates rungIsRange() as the function r.211 extends; extend it rather than writing a second one.
-
  - **asm**: odin
  - **severity**: MAJOR
  - **finding**: The OUT gun's MARK is not buildable in one revision, and he has the carriers backwards. glyph() at :1981 is FREE — I simulated adding an 'OUT' arm to its ternary and the gate stays green, so his fall-through fix ships. But both of glyph's drawing call sites, :2047 and :2056, are INSIDE drawMap, which is pinned at lines 2012-2067 under movedSpans; simulated, any edit there reports drawMap moved — RED. So a new glyph CHARACTER ships; the 'same friendly circle with the dome arc BROKEN' he specifies is a new stroke in drawMap and does not. He also cited only :2056; :2047 is a second call site and it defaults to 'HI', not 'AI'.
  - **action**: Ship the glyph character only in revision one and say so plainly. The broken-dome stroke is a separate revision that must re-pin drawMap under movedSpans in the same commit, with its reason written into range-spans.json — the mechanism the file already provides for a deliberate move.
-
  - **asm**: odin
  - **severity**: MAJOR
  - **finding**: His LOST-GUN decision rests on a misread of the only evidence he cites for it. He writes 'the only loss code in the repo (swarm.ts:138, s.alive[i]=0) is deletion. Copying that pattern for guns would break the record on day one.' The function's own comment at frontend/lib/drone-2525/swarm.ts:136 reads 'Remove one aircraft from the engagement. It stays in the roster so a replay still has its whole story.' That IS the record's defences.note semantics (verified in docs/drone-2525/drone-2525.v00.00.json: 'a defeated aircraft is DISABLED and flown down under control, never deleted in the air'), not its opposite. The conclusion (ctrl='OUT', scripted, recoverable) is right; the reason given for it is false and will not survive his reading.
  - **action**: Strike the swarm.ts-is-deletion premise and re-anchor the decision on defences.note alone. Cite swarm.ts as the PRECEDENT to copy, not the anti-pattern to avoid.
-
  - **asm**: enki
  - **severity**: MAJOR
  - **finding**: His override 'the plan is a PORT between carriers, not an authoring job' is correct in direction and wrong about cost. Measured: play.html contains exactly two <script> blocks (lines 775-6723 and 6724-9071), zero `import`, zero `src=`, zero `fetch(`. lib/drone-2525/los.ts, swarm.ts, ai-crew.ts and arena-model.ts are TypeScript compiled by Next for the React route only. The deck CANNOT import them. So the port is either a hand-copy (the duplication he rightly condemns) or a code-generation step emitting a marked block — for which precedent exists (/*RCORE_LEDGER_BEGIN*/ at :6287, written by scripts/gen-rcore-code.mjs, and f7f21cb67's generated whitepaper). Either way it is not folded into a FIGHT revision.
  - **action**: Re-label it: 'a generator + a marked block + its gate, as its own revision, BEFORE any lawn feature consumes it.' Verify the other-carrier citations first — los.ts lineOfSight/losReason/LosBlock, swarm.ts:22 Affiliation / :52 sideOf / :71 initSwarm radiusM 380, and ai-crew.ts's ranked autoAim all exist exactly as he and Odin describe.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: Reach on the lawn has THREE rules, not two, so Thor's THE_CAP_IS_ONE_RULE_FOR_TAP_AND_BUTTON goes green with a door still open. He names the TARGET button (lockOn, pops capped 80 at :2303) and the map tap (:4232 -> designate at :2256-2264, no cap — both verified verbatim). The third: pickNear() screens candidates at 56 px with NO world-distance cap and writes state.aimRef at :4033 (mouseAim) and :4180 (right-click); lockOn's aimRef branch near the top of the function returns that ref with no cap at all. Good news for Enki: candidates() returns `pops` only for a turret seat — rings and doors are excluded — so aimRef CANNOT reach BULL-1 and his ring fix is sound. It is pops that leak through the mouse.
  - **action**: Rename the row THE_CAP_IS_ONE_RULE_AT_EVERY_DOOR and assert all three paths admit and refuse identically: lockOn's capped pool, designate's id path, and the aimRef branch. All four sites (:2256, :4033, :4180, :4232) are free and simulate green.
-
  - **asm**: enki
  - **severity**: MAJOR
  - **finding**: His BULL-1 override is real, cheap and correctly placed — I reproduce it line for line. :2301 is verbatim `rings.forEach(p=>{ if(p.up===false) return; add(p,'ring',p); });` with no cap argument; :916 is `const rings=[{id:'BULL-1',x:0,y:2.2,z:26,up:true,lifePct:100}];`; :2308's door fallback is `dist<70&&dot>0`, reached only when the main pool is empty. One strengthening he missed: pipNearest() gates on `r.px<=LOCK_REACH_PX`, so BULL-1 only locks when the bullseye is near its projection — which, with all 42 stations yawed at the rotunda by :1267, is the home view. His anchors for the doors are off by one: D-CAP-S is at :895 and D-11TH at :896 (:894 is just `const doors=[`).
  - **action**: Carry the decision as written, with the two door line numbers corrected to :895/:896 and pipNearest named as why it fires at the home view. All of :916, :2301, :2308 are free — simulated green.
-
  - **asm**: enki
  - **severity**: MAJOR
  - **finding**: His cheap-now list is genuinely one revision — I simulated each edit against the gate and every one stays green: the six spots at :2962, the ring cap at :2301, the fence sign at :1347, the pops/doors arrays at :917/:894, applyHit's isPlate at :2694 (verified verbatim: id.charAt(0)==='C' && ref.form -> the plate path). One trap he does not name: the six-spot block lives inside `spawn` (declared at :2949, free), but range-2525.test.mjs:86 pins the spawn driver `if(+state.challenge===0) rangeTick(state.rangeDtNow!=null?state.rangeDtNow:dt);` by exact regex, and that file's `const line = (re) => { ... throw new Error }` THROWS rather than fails.
  - **action**: Ship the cheap list as revision one in his stated order. Edit the spots array only; leave the rangeTick driver line byte-identical. Run range-2525.test.mjs as well as range-frozen.test.mjs — a throw is not a readable failure.
-
  - **asm**: thor
  - **severity**: MINOR
  - **finding**: Three anchors are wrong; the substance survives all three. (a) AMBER_NO_APPROVE is at :2739, not :2746 — :2746 is dead code inside an `if(false){` block opened at :2742, so he quoted an unreachable line. (b) magHasRound's refusal is :2751, not :2752. (c) the joiner pin is drone-progression.test.mjs:28, not :31. Everything else he cites verifies exactly: :721/:722, :5593-5597, :5626/:5629/:5640/:5657/:5664, :5675/:5676, :5715/:5728/:5738, :1879, :3424, :960, :4232, :2256-2264, :2300-2306, :2940, :6070, :6115, command-ux1.tsx:69 and :100, progression.ts:38 — and all three measured counts (40 rung writers, drawSwarm 2x, x-bat 0).
  - **action**: Correct the three anchors before the package is read. His ordering claim still holds: the AMBER refusal at :2739 does return above magHasRound at :2751, so FIRE on a held track costs nothing.
-
  - **asm**: CROSS
  - **severity**: NOTE
  - **finding**: The append-zone law in the brief is narrower than the gate actually requires, and the gate is blind to the one failure the law was written for. Because spans run declaration-to-next-declaration, the real rule is not 'do not edit the frozen function' but 'do not touch any byte between a pinned declaration and its successor' — which is how :5929 and :2056 become fatal while the functions themselves look untouched. Measured safe insertion windows: 6104-6722 (after goRange's pinned range, inside script #1) and the gaps 779-918, 1281-1982, 2230-2903, 2924-5879. Separately: I inserted `const RUNG_ADMIT=1;` at 6110 and the frozen gate stayed GREEN — the r.208 temporal-dead-zone class that cost a deck is caught by boot QA alone, not by this gate.
  - **action**: State the byte-range rule, not the function rule, in the revision brief. Ship the new definitions in 6104-6722 as hoisted `function`s, and run scripts/drone-deck-qa.mjs as well as the span gates — nothing else catches a const in the append zone.
-
  - **asm**: CROSS
  - **severity**: NOTE
  - **finding**: Buildability verdict in one line each. ONE REVISION (all free, all simulated green, all red-first provable on r.216 bytes): the six spots out of the Capitol core; the ring pool cap and door-fallback filter; one reach rule at all three doors; the fence sign; A-/F- id prefixes so no lawn object is routed into the pinned plate path. TWO REVISIONS: rungAdmit()/recordComplete() plus the four-metric store, built in 6104-6722 and marking the 38 free rung writers. NOT BUILDABLE without moving a pinned span: a reader at :5929, a new map stroke in drawMap, any change to pickMap's hit test (1990-2012), a ripple that alters magSpend (960-961, frozen — Thor verified this correctly). Enki's 9 m Capitol drift (record door [0,-55] vs :895 z 46.04 and :1301 CAP.NS 44.04) is free to fix in the deck today and silently re-scores every stored run the day it is fixed.
  - **action**: Ship revision one as Enki's ORDER_OF_OPERATIONS states it, with the Capitol drift settled in that same revision — before any run is stored, never after. Hold revision two until the four-metric store has his word on device-or-person.

**Residual gaps:**
- THE FOUR METRICS STILL HAVE NO STORE, verified: loadPerf at :5593 and savePerf at :5597 read and write exel-2525-perf with scen/ch/score/hash/sssesCore — not hits, misses, rounds spent, time. recordComplete() has nothing truthful to read until that store exists, so revision two cannot start.
- DEVICE OR PERSON for the record — unanswered, and the cost of guessing is measured: #btnPlayLog (:721/:5675) writes six rung rows and #btnEach42 (:722/:5676 -> playEachScenario(42,{sim:true}) -> :5626) writes 252 rows across all six rungs in one tap on the glass, no console needed. Every line of rungAdmit() follows from his one word.
- LEAK has no definition from him. Both Enki and Thor propose one from the paper's three fragments; neither may be gated until he says it.
- EW is in his source and not in his ladder — no rung, no seat, no fire mode. FM 3-12 is named in the paper's back matter for the first time in this project.
- REAL-WORLD'S SWARM COUNT: the record says total 42 / perSide 21 (verified in drone-2525.v00.00.json) and the deck's SWARM is 42 at :5715; the paper says nine. Changing 42 edits an append-only record and breaks live gates, so it is his call alone.
- A3 FUEL and A4 MAINTENANCE are DECLARED field laydowns in Enki's package and bare bearing points in Specialist 1's. Only capitol and extension-n lie inside CAP_RING 240, so there is no third sourced option — his word before a coordinate is written.
- WHETHER ?map= SHOULD EXIST AT ALL. If he says 'the share link opens the Range only', shareUrl's emit at :9031 is dropped, no reader is ever written, and the whole frozen-span problem at :5929 disappears. That is the cheapest answer available and nobody asked him for it.
- I did not independently re-derive the pod's geometry — the coverage grids, the 29/42 visibility, the dead-ground percentages or the orphan sweep. My angle was buildability; the arithmetic I did check (CAP_RING 240 - CAP.NS 44.04 = 195.96 m, the six spots all inside |x|<30 and |z|<44.04, the Capitol drift of 8.96 m and 10.96 m) reproduces. Odin's and Enki's grid results disagree on counts and agree on locations; treat the counts as unverified here.

### MoT · GATE over pod FIGHT — **BLOCKING**

**Headline.** The gate harness itself cannot show the lawn red — the deck's one Capital targeting row (CAP_LOCK_IS_THE_PIP, play.html:4614) is green only because boot QA runs on the r.131 ellipse where 4 turrets have two doors within 60 m, while on the played CAP_RING 240 geometry ZERO do and the row would push false; every lawn gate these packages propose inherits that wrong world, and Enki's second decision would break a green prebuild gate by moving a sourced number to an unsourced one.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: EVERY LAWN BOOT ROW IS MEASURED ON A WORLD THE PLAYER NEVER OCCUPIES. restoreCapitolTurrets() has exactly two call sites: play.html:5548 (inside the deferred THE_CAPITOL_IS_DRAWN row, which rolls back in its finally at :5552) and :6109 (the scenario picker). The synchronous Capital rows in toolSelfTest run earlier, against the r.131 creation ellipse at play.html:913 (x=sin(a)*110, z=20+cos(a)*130), NOT CAP_RING 240 (:1267). Measured: on the ellipse 4 turrets (T10, T29, T30, T31) have two doors within 60 m, so CAP_LOCK_IS_THE_PIP (:4614) is exercisable and green; on the ring ZERO do, so the row takes its else branch at :4615 and pushes false with the note 'the row cannot be exercised'. Nearest station to BULL-1: 109.7 m ellipse vs 214.0 m ring. To D-11TH: 68.0 m vs 22.0 m. Verified identical on b7e1a304e and origin/main r.217.
  - **action**: Before ANY lawn gate is written: every new Capital boot row must open with the :5546 pattern — snapshot all turret units into uSave, call restoreCapitolTurrets(), restore in a finally — or it measures the ellipse, not the game. Add one row, THE_CAPITAL_ROWS_STAND_WHERE_THE_PLAYER_STANDS, asserting units.T01.z===240 at the moment every CAP row is evaluated; it is red today. Gates needing no runtime (spawn coordinates, fence extents, source text) belong in prebuild node tests and dodge this entirely.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: THE RED-FIRST MACHINERY ALREADY EXISTS AND NOT ONE PACKAGE ROUTES A GATE THROUGH IT. frontend/tests/deck-qa-manifest.mjs carries DECK_QA_ROWS (251 rows, 0 duplicates — verified by import), EXPECTED_RED = ['SYNC_DIRECT'] and EXPECTED_RED_AT = {'667x375':['EYE_SCALE_12_IN']}; scripts/drone-deck-qa.mjs:49 enforces both directions, so 'a stale exemption fails loudly'. The repo's own release prose states the standard verbatim — the r.217 record entry ends 'Two new rows, both red on r.216 with the rows inserted and nothing else changed. Frozen spans moved: none.' No package's redToday claims that procedure was run; every one is a grep count or an offline computation. That is evidence the predicate is false today, not evidence the gate AS IT WILL SHIP was observed red on the previous revision's bytes.
  - **action**: Reject every redToday as written and re-issue each in the repo's own form: row inserted into the r.217 deck with nothing else changed, harness run, red copied from its output. Each gate must name its carrier — prebuild node test (browser-free: capitol-model, drone-playable, deck-consistency, range-frozen all run there), test:ci-only node test, or a drone-deck-qa boot row (browser; test:ci ONLY, never prebuild).
-
  - **asm**: Enki
  - **severity**: BLOCKING
  - **finding**: ONE_CAPITOL_IN_BOTH_CARRIERS IS NOT A NEW GATE — IT IS AN EXISTING GATE DELIBERATELY DEFANGED, AND ENKI'S POLARITY IS BACKWARDS. frontend/tests/capitol-model.test.mjs:45-46 already computes the drift and prints it as console.log('OWED: the arena record still carries the Capitol ±55 m north-south…') without incrementing fail — prebuild is green while the drift goes to stdout nobody reads. Worse, the decision picks the wrong master: CAP.NS*2 = 88.08 m IS the sourced figure (docs/drone-2525/CAPITOL_SOURCES.json nsBlockM 88.09, National Historic Landmark nomination 70000770, quote 'the central block measuring 289 feet from north to south'), asserted at capitol-model.test.mjs:34. The record's ±55 is marked source:'carried', note 'carried verbatim from components/security-2525/mission-planning.tsx — not re-authored'. Moving the deck to the record turns a green prebuild assertion red and puts a hand-carried number over a landmark survey.
  - **action**: Invert the decision to the repo's already-recorded position: the DECK is right, the RECORD gets a new append-only row, and mission-planning.tsx is corrected in the same commit (capitol-model.test.mjs:46 names both). Then promote the console.log at :46 to a real ok() — that one change IS the gate, it is red today, and it is already in prebuild. Enki's reversibleBy ('The deck's size is right; correct the record') is the primary, not the reversal.
-
  - **asm**: Enki
  - **severity**: MAJOR
  - **finding**: NOTHING_ON_THE_LAWN_LOCKS_WITHOUT_A_CAP's SECOND ASSERTION COLLIDES HEAD-ON WITH A GREEN ROW IN THE OWNED MANIFEST. CAP_LOCK_IS_THE_PIP (play.html:4614) seats a CAP turret at state.challenge=1, aims 20 px beside a door, and asserts lockOn() returns lk.kind==='door'. It is in DECK_QA_ROWS and is not in EXPECTED_RED. Enki's 'no door is lockable from a station' would make it red, and drone-deck-qa fails on either path — an unexpected red row, or (if deleted) a manifest mismatch, since 'a deleted row cannot hide behind a new one'. The FIRST assertion is sound and verified: play.html:2301 rings.forEach(p=>{ if(p.up===false) return; add(p,'ring',p); }) passes no cap while :2303/:2305/:2306 pass 80/120/160, and rings[0] is BULL-1 at deck (0,2.2,26), up:true permanently (:916), 214.0 m from T01 on the played ring.
  - **action**: Split the gate. Ship the cap assertion alone — pure source regex, prebuild, genuinely red at :2301. The door half is a CONTRADICTION of a shipped decision, not a defect: it needs his word, and if he agrees CAP_LOCK_IS_THE_PIP is retired by name with a declared reason and the manifest updated in the same commit. Note BULL-1 is also load-bearing for FORGED_RED_NEVER_HITS_THE_RING (:4563), which asserts BULL-1's lifePct is untouched — BULL-1 may be filtered from the Capital pool but must not be deleted.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: THE UNGATED INVARIANTS — the dangerous ones, and the most dangerous is also the cheapest. Enki names 'asset and protected ids must never begin with C' in prose and gives it NO gate row, although it is the single rule standing between the lawn and DD-35 running backwards: play.html:2694 computes isPlate = ref.id.charAt(0)==='C' && ref.form && plateHit and routes into the FROZEN plate path (rangeRun, plateRect, qWorld, LANES). Also asserted with no gate anywhere in the four packages: a ripple's unspent rounds (ROUNDS_UNSPENT); an approval dies with its track (releaseAuthority('TARGET GONE') exists at :2995, ungated for the lawn); re-check the lane at FIRE not only at APPROVE; the four stored metrics; and Odin's glyph() fall-through at play.html:1981 — ctrl==='AI'?'◬':ctrl==='SH'?'♡':'웃' renders an unrecognised 'OUT' as the HUMAN glyph.
  - **action**: Write the id-prefix gate first: five lines of node regex over play.html plus the record, prebuild, browser-free, and red the instant the first A- or F- id is proposed because no such id exists today. Give glyph() the same treatment — one regex asserting the ternary enumerates every ctrl value in use. The other four cannot be shown red until the nouns exist; say that plainly instead of listing them as gates.
-
  - **asm**: Thor
  - **severity**: MAJOR
  - **finding**: NOTHING_SETS_THE_RUNG_BEHIND_ITS_BACK IS SATISFIABLE BY A COMMENT. I reproduced both counts on r.216 AND origin/main r.217: state.challenge= (assignment) occurs 40 times, /*RUNG*/ occurs 0 times. But the gate's green condition is that each of the 40 carries a /*RUNG*/ marker — forty keystrokes, no write routed through rungAdmit(). A gate whose pass condition is an annotation is cosmetic and fails his law from the other side. Thor's other measurements verify exactly: rungAdmit 0, recordComplete 0, drawSwarm 2 occurrences (definition plus the single call at :2100 behind chNum()!==0 only), drone2525.progression 0 in the deck, the deck's only localStorage keys are exel-2525-perf / -sets / -soak, and the complete query-reader set is diag=1 (:1088) and range+mode (:5929).
  - **action**: Reword to something a comment cannot satisfy: every state.challenge= must be lexically inside rungAdmit()'s body, or a restore of a const captured earlier in the same block (the const c0=state.challenge … state.challenge=c0 shape), proven by span extraction the way tests/range-spans.json already extracts top-level definitions. Keep 40 as the red-today evidence line.
-
  - **asm**: Thor
  - **severity**: MAJOR
  - **finding**: A_QUERY_STRING_NEVER_NAMES_A_RUNG IS TWO GATES AND ONE IS VACUOUS. Thor admits the deck half is 'vacuously green TODAY' — by his own standard it must not ship as a gate now. The React half IS red and his citations check out but for one: command-ux1.tsx:69 sets isJoiner from /[?&]crew=/ and progression.ts:38 is 'if (isJoiner) return true;' above the ladder check, yet the test pinning it is tests/drone-progression.test.mjs:28 ('a crew joiner is never locked out of the mode they were invited into'), not :31, which is a section comment. That line is a SECOND gate collision: the proposed gate asserts the opposite of a currently green assertion written from his own words.
  - **action**: Ship only the React half now, and ship it as an EDIT to drone-progression.test.mjs:28 with a declared reason, never as a new file — otherwise test:ci holds two assertions that contradict each other. Carry the deck half into the r.211 revision that adds the reader, where it goes red by construction.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: A FROZEN/FREE MISCLASSIFICATION IN THE BRIEF THAT BOTH PACKAGES INHERITED. frontend/tests/range-spans.json has TWO buckets: spans (100 definitions, pinnedAt 207) and movedSpans (3 — drawMap, goRange, mapCam — movedPinnedAt 216, each with a declared _movedWhy). The brief lists goRange as FROZEN and treats drawMap as free; both are hash-pinned in the re-pinnable bucket. Enki's 'filter BULL-1 off the Capital map' and Thor's THE_CAP_IS_ONE_RULE_FOR_TAP_AND_BUTTON (which touches the MAP tap at :4232) will move drawMap and must re-pin movedSpans with a declared reason or range-frozen fails in prebuild. Separately tests/drone-playable.test.mjs:114 pins the ?map=capital&station= emit by exact text — so Thor's reversibleBy ('drop the ?map= emit') fails a prebuild gate — and :145 pins lockOn's first line by exact text. Confirmed FREE: lockOn, designate, applyHit, fireN, marksPersist, glyph, restoreCapitolTurrets, drawSwarm, shareUrl, savePerf, decide, releaseAuthority, challengeSpec, lobbyLaunch, practiceNoRoom, applyWorld. Confirmed FROZEN: magSpend, magCap, magLoad, hudMag, rangeTick, chNum, applyMode, enterTheRange, pickMap, seatLane, buildRange, qWorld, plateRect, startLight, qualLamp, paintTimer.
  - **action**: Add 'Frozen spans moved: <list or none>' to every revision plan in this pod — the r.217 record entry already carries that field, so the form exists. Re-pin movedSpans in the same commit as any map-painter change, never after.
-
  - **asm**: CROSS
  - **severity**: MINOR
  - **finding**: THE GATES THAT SURVIVE VERIFICATION, with my own numbers so they are not taken on trust. Enki EVERY_LAWN_CONTACT_IS_OUTSIDE_THE_BUILDING: all six spots at :2962 satisfy |x|≤18 < CAP.CORE 30 and |z|≤22 < CAP.NS 44.04 — 6 of 6, pure data, prebuild. Enki EVERY_CLASS_IS_REACHABLE: pops measure 218.0 / 218.4 / 218.4 / 220.0 / 222.1 / 222.1 m from the nearest of the 42 ring stations against a cap of 80 — his figures reproduce to the decimal; drones spawn on the four axes at :2969-2974 at ~148.8-154.0 m against 120, also confirmed. Enki A_LOST_GUN_DARKENS_GROUND: I re-ran the ray-march independently on FOUR grids (570 / 540 / 2236 / 3352 cells, with and without a 400 m reach gate) and worst single-gun loss is 0 EVERY time on the 42-ring, while the three sourced turrets give 11 / 44 / 52 — robust, and the strongest gate in the pod. Enki THE_FENCE_BOUNDS_ITS_OWN_LAWN: :1347's unconverted prism against :1333's lawn, 50 m out on both edges. Enki THE_RECORD_RISE: bilinear of the 9x9 grid at (0,-250) gives 159.33 m against 163 at the rotunda = 3.67 m, against a note saying 'about 12 m'. Thor's five rung gates all verified red on r.216 and r.217 bytes.
  - **action**: Ship these as the first wave; all are browser-free and belong in prebuild. A_LOST_GUN_DARKENS_GROUND additionally needs its grid (origin, pitch, extent) pinned in a sidecar the way CAPITOL_SOURCES.json pins dimensions — the ≥1 assertion is robust across resolutions but the dead-cell COUNT in the evidence line is not, as Enki concedes himself.
-
  - **asm**: Enki
  - **severity**: MINOR
  - **finding**: A_PROTECTED_CONTACT_EXISTS_AND_NEVER_LOCKS IS THE CORRECT TEMPLATE AND SHOULD BE NAMED AS ONE. It is a two-part gate whose FIRST part (a protected contact exists) is red today by existence — I reproduced the greps over all 1,186,355 B on r.216 and 1,198,239 B on r.217: friendly 0, hostile 0, asset 0, protected 0, civilian 0, noncombatant 0, IVAS 0, ripple 0, salvo 0, sector 0, Avenger 0, Sentinel 0, Patriot 0, C-RAM 0, M-SHORAD 0, ammunition 0, 'command post' 0, x-bat 0. Its SECOND part (lockOn can never return it) is vacuous ALONE and would be exactly the gate that could only ever pass. Pairing them is what makes it honest. Thor is right to refuse to gate the five seat/class failure conditions for the same reason and must not be overruled on it.
  - **action**: Adopt the two-part shape as this pod's standard for every invariant over a noun the file does not yet contain: assertion 1 the noun exists, assertion 2 the behaviour, written together in the revision that introduces the noun, never before it.
-
  - **asm**: Thor
  - **severity**: MINOR
  - **finding**: THE RECORD-FORGERY SEVERITY IS OVERSTATED IN ONE RESPECT AND THE MITIGATION IS STRONGER THAN CLAIMED. play.html:5630 reads 'n=n||6; opt=opt||{}; const sim=true;' — sim is HARD-CODED, not taken from opt, with the comment 'r.131: every trial forces simDirect, so the label says SIM whatever the caller asked (r.102's lesson)'. So BOTH #btnPlayLog (:721/:5675) and #btnEach42 (:722/:5676 → playEachScenario → :5626 six-rung loop) write rows that self-label sim:true AND semantics:'INDEPENDENT_TRIAL' at :5657, and no caller can suppress it. The button is not an unlabelled forgery; the unlabelled forgery is a devtools write straight to exel-2525-perf, which :5593 reads with a bare JSON.parse, no signature and no hash re-derivation.
  - **action**: Keep THE_RECORD_IS_NOT_THE_DECKS_OWN_SIM — it is red (recordComplete occurs 0 times) and correct — but restate its threat model: the buttons are defended by a forced label, the store is not defended at all. The gate's real work is the replayHash() re-derivation clause, not the sim:true filter.
-
  - **asm**: CROSS
  - **severity**: NOTE
  - **finding**: THIS TREE IS 13 COMMITS BEHIND origin/main AND ALL FOUR PACKAGES MEASURE r.216 BYTES — but I re-measured and the gate predicates SURVIVE. On origin/main (r.217, play.html 1,198,239 B) the load-bearing lines are unchanged: :2301 rings-no-cap, :2303 pops cap 80, :2962 the six spots, :1301 CAP, :1347 the fence prism, :4614 CAP_LOCK_IS_THE_PIP, :2100 the drawSwarm call; state.challenge= still 40; x-bat and friendly still 0. Only drawSwarm's DEFINITION moved (5728 → 5795). The arena record changed by 10 lines (project.revision 0.071→0.072 plus one appended release entry — buildings, turrets, roads, treeRows and elevation untouched) and deck-qa-manifest.mjs gained rows. Separately, main already carries DD-126 ('Shield in the Sky IS the Real-World scenario, and its placement measured') and DD-127 ('EW is electronic warfare, usually jamming'), which answers one of the pod's standing gaps outright; none of the four packages read either.
  - **action**: Pull to origin/main, read DD-126 and DD-127 before any gate is written, re-run the DECK_QA_ROWS import for the new count, and re-issue each redToday against r.217. Do not re-measure the geometry — I have done it and it holds.

**Residual gaps:**
- ODIN'S GATE LIST WAS TRUNCATED in the packet I received (his package cuts off mid-decision at 'revers…'), and the pod's FOURTH AsM package is absent entirely. I reviewed Enki's eight gates and Thor's eight. Odin's gates and the fourth AsM's are UNREVIEWED and must not be read as accepted by my silence.
- THE COST OF DOING IT RIGHT IS UNMEASURED. The fix for the ellipse defect is that each Capital boot row saves all turret units, calls restoreCapitolTurrets() and restores in a finally — the :5546 block proves it works but pairs it with a full draw(). drone-deck-qa runs 251 rows at FOUR viewports under a 60 s waitForFunction. Nobody has costed N new Capital rows each re-homing 42 units against that ceiling, and a timeout there is a real failure, never a skip.
- WHO OWNS THE CAPITOL CORRECTION. capitol-model.test.mjs:46 names TWO carriers to fix (the append-only record and components/security-2525/mission-planning.tsx, where the ±55 was carried from) and neither has an owner. Until the append lands, promoting the console.log to an ok() turns prebuild red — correct red-first practice, but it must be a deliberate announced revision, not a side effect of someone else's commit.
- LEAK STILL HAS NO DEFINITION FROM HIM, so no gate can be written for it. Both Enki and Thor reached this independently and I confirm it: there is no measurable condition to assert, and any gate written over 'leaker' today would be a gate over a word.
- THE FOUR METRICS HAVE NO STORE, so recordComplete() has nothing truthful to read. Verified directly: exel-2525-perf rows written at play.html:5657 carry t, rev, scen, ch, diff, score, sssesCore, core, device, held, red, fires, hash, sim, semantics, seed, cohort — not one of hits, misses, rounds spent, time. His rule 'a run with no metrics does not count' is currently unmeasurable and ungateable.
- WHETHER THE RUNG LIVES ON THE DEVICE OR ON THE WIRE is unanswered and every line of rungAdmit() follows from it. localStorage means one devtools paste defeats it and a new phone loses his proficiency; the wire means a signature the deck can check, and the lawn stops being a file that fetches nothing.
- THE LOST-GUN GRID IS UNPINNED. My ≥1 assertion is robust (0 on four independent grids for the 42-ring) but the dead-cell COUNT is grid-dependent — Enki's 2155/2044 and Specialist 2's 2224 are the same disagreement. The evidence line will drift on every re-run unless origin, pitch and extent are pinned in a sidecar.
- I DID NOT VERIFY the Shield in the Sky paper's line citations (:93-94, :144-145, :164, :207, :285, :310, :315). The paper is on origin/main at 16a4114ee and this tree holds only the PDF, so every claim resting on that paper's text in all four packages is unverified by me.

### MoT · CUT over pod FIGHT — **FIX_FIRST**

**Headline.** Ship ONE revision — the lawn becomes the Introductory rung (move the six spawn spots out of the Capitol, give pops the Range's own 340 m reach, cap the ring pool, gate drawSwarm on the rung) — because every edit it needs is in a FREE span, and cut the siting solves, field laydowns, decoys and the los.ts port entirely.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: The working tree is 12 commits behind and two of the three 'owed' gaps are already answered. HEAD is b7e1a304e; origin/main carries r.217 (02c8cf03a, play.html +73/-6) plus DD-126 'Shield in the Sky IS the Real-World scenario, and its placement measured' (e27ab97ba, nine named phases) and DD-127 'EW is electronic warfare, usually jamming' (0d206c027, which corrects the fleet's own 'spoof package' summary and puts EW on BOTH sides). Three of the four packages list EW as owed and none read DD-126. Every line number in all four packages was measured on superseded bytes.
  - **action**: Fetch origin/main, read DD-126 and DD-127 in full, and re-run every cited line number before a single edit. Strike 'EW is owed' and 'the Real-World scenario is undefined' from the fleet output — he already answered both today.
-
  - **asm**: thor
  - **severity**: BLOCKING
  - **finding**: His locked law is already broken on the glass, and it is one line. play.html:2100 reads `if(chNum()!==0){ liveMeshes()...; if(S.seg-state.segs>120) drawSwarm(segs,S,cam,W,H); }` — the only production call site. chNum() (:ln) returns **1** when state.challenge is null or empty, so the default off-Range state is rung 1 and the 42-ship SWARM (:5715) paints the instant he leaves the Range, on an empty record, writing '42 · n/cap segs' into #swTxt (:5738, element :653). The craft are in no array lockOn reads, so they are scenery — but on his phone a 42-ship formation over the Capitol IS the swarm loading.
  - **action**: Add a rung term to the condition at play.html:2100. draw() is NOT in tests/range-spans.json — verified, 100 keys, draw absent — so this is a free edit with a red-first gate on today's bytes. Do not build it against an X-BAT loader: `grep -ci 'x-bat' play.html` = 0.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: The freeze picture is far better than the brief states, and no package says so. Verified against frontend/tests/range-spans.json (7 top-level keys; spans holds 100; movedSpans holds goRange, mapCam, drawMap as a separate category the brief collapses into FROZEN): FREE = draw, lockOn, spawn, designate, asmTick, applyHit, drawTargets, glyph, marksPersist, restoreCapitolTurrets, shareUrl, applyWorld, savePerf, loadPerf, playScenarios, jumpToTurret, fireN, pipNearest, pipOn, fireOnIt, capHomeTilt, challengeSpec. FROZEN = magSpend, chNum, pickMap, plateRect, qWorld, buildRange, rangeTick, enterTheRange, applyMode, seatLane, magCap, startLight, qualLamp, paintTimer. Every edit the minimum needs is free.
  - **action**: State this in the revision brief. DD-35 is not a constraint on R1 at all, which is the single reason the whole minimum fits in one revision instead of a programme.
-
  - **asm**: enki
  - **severity**: MAJOR
  - **finding**: R1's internal order is the one decision that cannot be got wrong, and it is confirmed by measurement. All six lawn spawn spots at play.html:2962 — [0,1.2,22],[±12,1.2,18],[0,1.2,-20],[±18,1.2,0] — satisfy |x| <= 18 < CAP.CORE 30 and |z| <= 22 < CAP.NS 44.04 (:1301), i.e. all six stand inside the Capitol's central block. Raising the 80 m pop cap (:2303) first makes the player's first successful TARGET-APPROVE-FIRE land on the building he is defending.
  - **action**: Move the six spots to his own declared marks — 50/100/150/200/250/300 m, left/centre/right, in front of the seated station — BEFORE touching any cap. Gate EVERY_LAWN_CONTACT_IS_OUTSIDE_THE_BUILDING counts 6 of 6 red on today's bytes.
-
  - **asm**: enki
  - **severity**: MAJOR
  - **finding**: The BULL-1 override is right in substance and overstated in framing, and the correction changes its rank. play.html:2301 does add rings with no cap and rings[0] is BULL-1 at (0,2.2,26) up:true forever (:916) — verified. But lockOn ends in pipNearest (:2284), which requires px <= LOCK_REACH_PX = 48 (:2282). At the Capital home optic — capHomeTilt(240) = 13.06 deg UP at the dome — BULL-1 projects 419 px BELOW the pip on a 390x844 picture, so TARGET returns nothing on first press. The turret clamps to -80 deg (:3131), so the moment he drops the sight to hunt the lawn, BULL-1 arrives at the pip and TARGET takes a Range bullseye standing in the rotunda. Both 'the Capital cannot be played' and 'it locks a bullseye' are true, at different tilts.
  - **action**: Keep the fix (cap the ring pool, filter BULL-1 and the D-11TH door fallback at :2308 off the Capital map) but rank it third in R1, not first. Do not report to him that TARGET succeeds on the bullseye today — it does not until he tilts down.
-
  - **asm**: thor
  - **severity**: MAJOR
  - **finding**: recordComplete() cannot be honest, because the store cannot answer his question. The only durable store is exel-2525-perf (:5593 read, :5597 write) and a row carries t, rev, scen, ch, diff, score, sssesCore, core, device, held, red, fires, hash, sim, semantics, seed, cohort (:5657) — verified, and NOT hits, misses, rounds spent or time. The Range counts them in-session only (state.qualR/qualH/qualExpired/qualT0, :978-980) and discards them. His law: 'a run with no metrics does not count.'
  - **action**: Make the four metrics a revision of its own (R2), ahead of any rung lock. savePerf and loadPerf are free. Until the row carries his four numbers, every lock built on the record is theatre.
-
  - **asm**: thor
  - **severity**: MAJOR
  - **finding**: Thor's own mitigation does not hold. He writes 'every forged row carries sim:true'. #btnEach42 wires playEachScenario(42,{sim:true}) (:5676) — true. But #btnPlayLog wires playScenarios(6) with NO opt (:5675), so `sim:!!sim` evaluates **false** on those six rows. A recordComplete() that filters on sim lets PLAY SCENARIOS through and admits six forged rung rows from one tap.
  - **action**: Filter on `semantics:'INDEPENDENT_TRIAL'`, which is written unconditionally at :5657 and survives both buttons. Do not ship a sim-only filter.
-
  - **asm**: thor
  - **severity**: MAJOR
  - **finding**: Tap and button obey different rules and the lenient one is reachable by switching view — verified line by line. designate (play.html:2256-2266) tests roundOpen, lane and up/lifePct and has NO distance test and NO class test; the map tap calls it directly. lockOn caps lawn pops at 80 (:2303) against Range silhouettes at 340 (:2300, :2304), and asmTick repeats it as `bd<(best.form?340:80)` (:2940), so the AI teammate cannot reach a lawn pop either.
  - **action**: Fold the asmTick cap into R1 alongside :2303 (one number, same edit), and make the tap obey the same reach as its own revision (R3). Both functions are free.
-
  - **asm**: odin
  - **severity**: NOTE
  - **finding**: SCOPE CREEP, named: the siting solve. A greedy optimisation over 486 open-ground candidates, a 13-site answer and a new law 'a target may only stand where two guns reach it' is not what he asked for. His correction — 'Forty-two was the even ring. Designing 42 new ones recreates it' — is a constraint on HOW a count is justified, not a request to re-site the lawn now. Likewise ctrl='OUT' plus a fourth glyph value plus declared recovery windows is Real-World machinery authored before a Real-World rung exists.
  - **action**: CUT from the plan. Keep exactly one line of Odin's package: glyph (play.html:1981) is `ctrl==='AI'?'◬':ctrl==='SH'?'♡':'웃'`, so ANY unrecognised ctrl renders as a human-crewed gun — verified. Record that as a one-line prerequisite for the day OUT lands, nothing more.
-
  - **asm**: enki
  - **severity**: NOTE
  - **finding**: SCOPE CREEP, named, five items: (1) A3 FUEL and A4 MAINTENANCE as declared field laydowns plus 'generator rows' — he declared none of the four; two of four self-declared assets is doctrine, not his ask. (2) The DECOY primitive — his word is absent. (3) Porting los.ts and the DEM into the deck — correct as NO-REWORK law, wrong as this revision: a flight-simulator-weight change to a 1.18 MB file that fetches nothing, against his 'the Range is a low-complexity demo of targeting'. (4) THE_FENCE_BOUNDS_ITS_OWN_LAWN (:1347 sign flip) — real, one character, but carries no gameplay until a containment test exists. (5) THE_RECORD_RISE_IS_THE_RECORD_GRID — a record-vs-record arithmetic check with zero player consequence; the lowest-value item in the entire fleet output.
  - **action**: CUT (1), (2), (3) and (5) from the plan outright. Park (4) as a free one-character fix to ride any later revision that touches the scene.
-
  - **asm**: enki
  - **severity**: MINOR
  - **finding**: ONE_CAPITOL_IN_BOTH_CARRIERS is real but mis-sequenced. The record's capitol core runs to y ±55 with its door at [0,-55]; play.html:1301 draws CAP.NS 44.04 and :894 puts D-CAP-S at deck z 46.04 — a ~9 m drift on the exact point that becomes the command post. Enki's own argument for urgency is that the fix 'silently re-scores every stored run' — and there are currently ZERO stored runs, because the four metrics have no store at all.
  - **action**: Do not lead with it. Bind it to R2: the drift must be settled in the same revision that first writes a metric row, and not before. The record is append-only, so the correction is a new row either way.
-
  - **asm**: thor
  - **severity**: MINOR
  - **finding**: Two of Thor's doors are weaker than listed and one is stronger. WEAKER: the ?map= gate would go green vacuously today — the complete query reader set is diag=1 (:1088) and range+mode (:5929), verified, and the reader does not exist, which is the exact failure mode Thor's own invariant forbids. window.beginReh has one hit in the file, the assignment at :5993 — console only, not a tap. STRONGER: applyWorld takes the rung straight off a peer payload at :1879, two lines above :1886 which explicitly refuses an imported approval — the file already knows this payload is untrusted and the rung was simply left out; lobbyLaunch :3424 does the same; the self-test's CH5 row at :4717 restores on the next statement with no finally while four sibling rows (:5323, :5338, :5396, :5552) use one.
  - **action**: Make the wire write and the exception-unsafe CH5 row R4 (applyWorld is free). Drop ?map= hardening until r.211's reader is written, and relabel beginReh as a console-only door so his list of taps is not inflated.

**Residual gaps:**
- R1's reach number is a declaration, not his word. I propose the Range's own 340 (already in play.html twice, :2300 and :2304) as the Capital pop cap so one number serves both scenes. His alternative — the declared 340 m station standoff — MOVES the 42 stations instead, and that puts a south gun 90 m into the city block past 11th Street. One of the two, his choice; I take the cap because it touches one argument and no geometry.
- LEAK still has no definition from him. All four packages propose one and none should be gated. It is not on R1-R4's path, so it does not block the minimum.
- Whether Real-World's swarm is the record's 42 (perSide 21, pinned by tests/drone-swarm.test.mjs and deck conformance row C10 at :5782) or paper A's nine. 42 stands until he says otherwise because changing it breaks two live gates and edits an append-only record. R1's swarm gate is count-agnostic, so this does not block it.
- Whether the record lives on the device or on the wire. If localStorage, one devtools paste and one press of #btnEach42 (:722 → :5676) forge it, and his next phone drops him to Training. If the wire, the deck stops being a file that fetches nothing. R2 can write the four metrics locally either way; only the LOCK depends on his answer.
- A3 FUEL and A4 MAINTENANCE: field laydowns on the open lawn, or survey the real Capitol Complex plant and motor pool into the record first. Only capitol and extension-n lie inside CAP_RING 240 — visitors measures 258.1 m, outside it — so there is no third sourced option. Not on R1's path.
- People on the Great Walk. Paper A's taxonomy lists IVAS/Human as a threat row; his law says a person is never a target. Human density peaks exactly where R1 puts the near marks. His word is owed before a protected contact is placed, and R1 places none.
- I did not read DD-126's nine phases in full, only its commit message. Its placement of Shield in the Sky as the Real-World scenario may already specify laydown detail that three of these packages are proposing from scratch.
- I did not re-measure Odin's claim that a 344 m six-gun ring puts two stations inside the Insurance Annex and the Price Daniel building. It does not survive the cut either way, so it is recorded as unverified rather than carried.

### MoT · CONTRADICTION over pod MEANING — **FIX_FIRST**

**Headline.** Do not write the plan from these four packages: all were measured on a tree now 13 commits stale, two questions they call "owed" already have his verbatim word (DD-127), a durable metrics store they unanimously declare nonexistent is recording by default today, and Asar's central ordering override is falsified at play.html:2296.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Every package is measured on a base that is 13 commits stale, not 5. Aset's decision #1 — the one it uses to override a colleague — states "git rev-list --count HEAD..origin/main = 5". Measured now: 13 (f7f21cb67 … 16a4114ee). Three operator decisions no package in this pod has seen have landed: DD-127 (×3), DD-128 (×5), DD-129 (×2) in the asks file at origin/main, which is 3,864 lines vs 3,458 locally. The live task list has also moved past the brief: r.217 is marked SHIPPED 02c8cf03a / NEVER SERVED, superseded by r.218.
  - **action**: Re-measure on f7f21cb67 before any plan sentence is written, and re-run each package's greps there. Treat the brief's "r.216 / 1,186,355 B" as the stale checkout, not the shipping base. No operator word needed — this is a measurement correction.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Two items both Aset and Asar list as genuinely owed already have his verbatim word. DD-127 (operator, 2026-10-19, verbatim): "EW is electronic warefare usually jamming". Its Reading also closes the fourth scored line: "joint network stable" = the shared picture held under jamming (cue availability + track continuity), measurable from the deck's own rows with no network at all. Asar's "Joint network stable" decision is marked unanimous 3/3 and is superseded; Aset's gap list says "no reading of it has been proposed" when one is on the record. His law: when he has to say a thing twice, the last answer missed.
  - **action**: Strike EW and 'joint network stable' from the owed list. Score line four as cue-availability + track-continuity under jamming per DD-127. Only DD-127's two narrowed questions remain his: whether jamming enters below Real-World, and whether the player ever has an EW effect of his own.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Both packages declare no durable store exists, and both propose building one. False. play.html (origin/main) :1477 opens IndexedDB 'exel-2525-rec' with objectStore 'pack', comment "COMPUTE module: Worker + IndexedDB present => training store live"; :2518 writes to it on every sample(); state.record is initialised true at :861, so it records by default. The row carries hits, score, t, lock and lockD. metricsOf() at :2467 already returns a metrics object and is already consumed at :3885 and :3916. Aset's gate A_RUN_WITHOUT_METRICS_DOES_NOT_COUNT and Asar's "unanimous" metrics decision both say only three localStorage keys exist and nothing survives a reload — true of localStorage, false of the deck.
  - **action**: Extend sample()/metricsOf()/the pack store — all three are free of the span freeze. Do not create exel-2525-ladder. NO-REWORK requires reuse here, and a parallel store would be the fork it forbids. Decidable under his standing sign-off.
-
  - **asm**: asar
  - **severity**: BLOCKING
  - **finding**: Asar's summarizer-override — "no acceptance script written today can ever go green", used to order siting before metrics before scripts — is falsified. lockOn returns state.aimRef at :2296 and state.desig.ref at :2294 BEFORE the capped candidate pool, with no cap; the deck's own QA harness already drives exactly that pattern (state.aimRef=q; markLock(lockOn(),'QA'); approveDesig) 40+ times at :4762–:5273. The true split, which no package states: candidates() at :2529 applies NO distance filter to pops, so a tap marks a lawn pop at any range (the observed 222.3 m lock), while lockOn caps pops at 80 m (:2303) — a precedence defect, exactly as the 14-agent assessment found. But on the lawn candidates() returns ONLY pops, so a tap cannot pick a UAV or foil at all, and lockOn's 120/160 m caps are never met by the geometry (min station-to-track 150 m, which I recompute and confirm).
  - **action**: Split the finding: ground pops are reachable today and the fix is a free-span precedence change in lockOn/markLock, shippable now and independent of siting; air tracks are genuinely unreachable and do wait on the siting record. Asar's ordering governs for air only. Decidable under sign-off.
-
  - **asm**: aset
  - **severity**: MAJOR
  - **finding**: Aset's decision #1 asserts "Every figure in this package is taken from origin/main … I re-ran every code grep against origin/main's play.html and cite those line numbers" — and the commit count in that same decision is wrong (5 vs 13), so the claim that underwrites the package's credibility is itself unverified. Some citations do check out on origin (:5660/:5664 perf, :5996 query reader); others are frame-ambiguous because local and origin agree below ~line 5407 and differ by +67 above it (local :5928 URLSearchParams = origin :5995). No package states which file it measured, and the brief cites a third frame (:5928-5929). Separately, Aset's "the deck's only query reader is :5996" omits isDiag at :1088, which Asar found.
  - **action**: Require every cited line to carry its commit SHA, not "origin/main". Re-verify Aset's above-5407 citations on f7f21cb67 before any of them enters a gate.
-
  - **asm**: asar
  - **severity**: MAJOR
  - **finding**: Asar's PERSIST-FIRST finding — "docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md does not exist; DD-124 appears zero times anywhere in the repo" — is true of the checkout and false of origin/main. Measured: the file is 26,867 B at origin/main, sha256 ad8f9280…d5d94 matching its .sha256 sidecar byte for byte, asserted by frontend/tests/asks-persist.test.mjs; DD-124 appears 6 times. Aset's withdrawal of this finding governs. Acting on Asar's version would re-persist a completed act.
  - **action**: Withdraw the finding and with it Asar's decision that "the first commit of this work is the briefing text and DD-124 persisted alone". That commit already happened in 16a4114ee. Aset governs; no operator word needed.
-
  - **asm**: aset
  - **severity**: MAJOR
  - **finding**: Aset's "reuse the catalogue, do not author new symbology" fails for exactly the two classes the ladder adds beyond the Avenger. frontend/components/security-2525/asset-icons.tsx:18 declares AssetKind = avenger | patriot | thaad | sentinel | xbat | autofoil. C-RAM/LPWS and M-SHORAD: 0 occurrences in the component, 4 in docs/security-2525/eXeL-STD-2525.md. DD-124 gives the incoming round to an LPWS/C-RAM seat at Intermediate and Advance, and Shield's Athena line puts M-SHORAD on the inner ring — neither has an icon.
  - **action**: Narrow the decision to the four classes that do exist. The two missing icons are a build from the standard's own SIDCs (C-RAM S*G*EWA---, Sgt Stout S*G*EWMAS-) and wireframe cues at eXeL-STD-2525.md:83-92 — a derivation from his standard, not a new picture from him. Decidable under sign-off.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: "A burst of 3" appears at a rung and in no mode and at no seat. Confirmed: grep burst on origin/main play.html returns 2 hits, both unrelated prose (:4022 key-repeat guard, :6354 the R-CORE ledger) — there is no burst machinery. DD-121's eight modes contain no three-round mode, and its seat map says the LPWS burst is "the C-RAM burst, NOT three rifle rounds". Aset names this correctly as needing his word; Asar's package does not mention it at all despite its invariant being about rounds spent.
  - **action**: Put this to him as one of the two questions worth spending: a ninth mode, or move the C-RAM burst to Intermediate with an incoming-round run alongside the other two. NEEDS HIS WORD — it cannot be decided under standing sign-off because it changes his own locked mode table.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: Aset and Asar disagree on what "defended assets preserved" scores against, and both are partly right. Verified: of 14 buildings exactly one (capitol) is source 'carried' / confidence 'high'; the other 13 are hand-authored / low. So Asar's Capitol-alone reading is the only sourced one. But Aset is right that the record contains 'defended' 0 times and 'asset' 0 times, and DD-124's set — command post, fuel farm, ammunition transfer point, maintenance cluster — is his, from the briefing, and has nowhere to live.
  - **action**: Score the Capitol alone now (it is the sourced geometry), and put the four-asset set to him as a separate question. Do not map the briefing's four functions onto hand-authored/low buildings — that is the 42-turret error repeated. NEEDS HIS WORD on whether the four assets land on the lawn.
-
  - **asm**: aset
  - **severity**: MINOR
  - **finding**: Aset's CAPITOL_IS_NEVER_A_TARGET gate predicate is geometrically wrong even though its conclusion is right. The gate tests the bounding box "x in [-88,88], y in [-55,55]", but the record's capitol footprint is a 12-vertex cross: the central column is |x|<=30 over y in [-55,55], and the arms reach |x|<=88 only over |y|<=20. A bounding-box test calls (80,50) inside when the polygon excludes it. All six spawn spots at :2962 are inside under either test, so the underlying finding (4 Capitol doors at :895 vs the record's single door at [0,-55]; drone-arena.test.mjs:31 computing doors from SRC.buildings and never opening play.html) stands and is confirmed.
  - **action**: Write the gate as a point-in-polygon test against buildings[].footprint, not a bbox. Conclusion unchanged; predicate corrected before it is pinned. Decidable under sign-off.
-
  - **asm**: CROSS
  - **severity**: MINOR
  - **finding**: The frozen/free method both packages used is unsafe, and one package's prose is stale. Aset's evidence reads "range-spans.json spans (100) contains neither doors nor spawn nor drawTargets" — but range-spans.json has a second enforced bucket, movedSpans = {goRange, mapCam, drawMap}, checked at frontend/tests/range-frozen.test.mjs:69-75. So drawMap and goRange ARE sha256-pinned, and a spans-only grep calls them free. This matters directly: the three teleport traps all run goRange. Separately, range-spans.json's own _what text says "the 241-row boot QA" while deck-qa-manifest.mjs exports 251 rows (verified by import; EXPECTED_RED = ["SYNC_DIRECT"], as Asar states).
  - **action**: Classify against spans ∪ movedSpans, never spans alone. Any teleport-trap fix that touches goRange needs a declared re-pin in the same commit. Flag the 241/251 prose drift for correction when range-spans.json is next touched.
-
  - **asm**: christo
  - **severity**: MINOR
  - **finding**: Christo's stated mechanism is wrong and the real exposure is larger than reported. Christo says "#lanePick is NOT in the hide list, so on the lawn it renders live". The hide rule at play.html:171 is scoped #app.range:not(.more) — it hides controls ON THE RANGE and never applied to the lawn at all. So lanePick is not an omission; it is one of nine controls visible on the lawn (modePick, plat, water, motLvl, tgtPick, chLvl, diffLvl, halPick, lanePick). The reason matters because chLvl — which Christo wants to KEEP on the lawn — is in the range hide list, so the new rule cannot simply mirror it.
  - **action**: Keep Christo's proposed #app:not(.range):not(.more) rule and its three-control outcome, but restate the finding as nine unhidden controls. Verify chLvl is excluded from the new hide list. Decidable under sign-off.

**Residual gaps:**
- LEAK still has no definition from him. Both packages correctly decline to invent one; Aset's measured rings (450 m arena, 240 m CAP_RING, 88.6 m footprint) are honest inputs but 'leaker' in Aset's ring law is a role in an assignment, not a radius. One sentence from him closes it.
- The swarm roster is unresolved in his own two sources: the PDF says three groups of three (nine total), the record says swarm.total 42 / perSide 21 with a passMark that is explicitly a render budget. Both packages rule nine on build grounds and Aset correctly attributes the nine to Paper A, not to Shield — which carries no roster count. Still his choice.
- 'Flown down under control' is owed code, not a definition. The record declares descentMs 1.6 and touchdownAglM 0.3; the deck has no descent state and frontend/lib/drone-2525/swarm.ts does the opposite with alive=0. Until it exists, line three must print DISABLED with a count and say OWED.
- The LPWS and missile seats need a magazine readout. DD-121 refuses the 30-round picture at one and three rifle rounds at the other; DD-122 requires the picture to match the rounds; CLAUDE.md says a new look for that row is a picture from him, never a drawing. Verified: five rasters plus a six-line MAGAZINE.sha256 manifest, no sixth. This blocks Advance.
- progression.ts:39 'if (isJoiner) return true;' conflicts with DD-122's 'a link, a menu, or a query string cannot open it' — but the function's own docstring says a crew joiner is deliberately always admitted. Shipped documented intent against his law. Needs his word, or Real-World excluded from the joiner bypass specifically.
- 'Primary missile threat destroyed' cannot be scored on this map: DD-124 puts THAAD and Patriot off the lawn, and there is no missile seat, high track or salvo path. Aset's seat/launcher reading is the lowest-complexity fit and is well argued from his own paper, but it remains a reading, and Asar would print NOT ON THIS MAP instead. The two packages differ and neither is his word.
- Whether Real-World gates on one line (the asset) or all five is Asar's own stated open fork and is genuinely his: gating five means Real-World cannot ship this revision. DD-127 has since made line four scoreable, which shifts the arithmetic and should be re-put to him with that correction included.
- DD-128/DD-129 record a live hazard nobody in this pod has read: docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md is labelled the gateable source of Asar's five lines and contains none of them (shrunk to 5,424 B), with fifteen image links to files absent from the repo, citing the wrong PDF. f7f21cb67 claims to fix this by generation plus a gate — unverified by me and worth confirming before any Real-World gate reads that folder.

### MoT · BUILDABILITY over pod MEANING — **FIX_FIRST**

**Headline.** Three of this pod's packages are buildable almost in full on free spans — but the measurement base is 13 commits stale with r.218 in flight, Asar's central override misdiagnoses a one-token precedence defect as a 42-turret siting problem, and two items the pod treats as buildable sit inside frozen spans.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: The entire pod measured a stale tree, and no revision may be coded at all right now. /home/user/eXeL-AI-Polling is 13 commits behind origin/main, not the 5 Aset reports: git rev-list --count HEAD..origin/main = 13. Local play.html is 1,186,355 B / DECK_REV 216 (frontend/tests/deck-head.mjs:1); origin/main is 1,198,239 B / DECK_REV 217. The files are byte-identical below roughly line 5,700, so every anchor the packages cite under that line is valid on BOTH trees and Aset's re-measure changes nothing there — but above it the trees diverge and Asar's numbers are local-only. Separately, this session's own task record states r.217 SHIPPED 02c8cf03a but was NEVER SERVED and is superseded by an in-flight r.218.
  - **action**: Fetch and re-measure against origin/main before a single plan sentence is written, and treat r.218 as the gate: under NEVER OUTPACE THE DEPLOY, no code for any package here until Verify Live confirms r.218 on the live site. Re-cite every anchor above line 5,700 from origin/main.
-
  - **asm**: asar
  - **severity**: BLOCKING
  - **finding**: Asar's summarizer-override — 'the lawn is not reach-capped, it is MIS-SITED' — is contradicted by the function he cites. lockOn (frontend/public/drone-2525/play.html:2289, a FREE span) returns early on state.aimRef with NO distance cap: the test is pipOn(), a screen-space check of 28 px from the pip, not a world distance. Only the later fallback pool applies the caps via add(p,'pop',p,80) at :2303, add(d,'uav',d,120) at :2305, add(d,'foil',d,160) at :2306. That asymmetry inside one function is exactly why a tap locks at 222.3 m while the TARGET button refuses — it is the PRECEDENCE DEFECT the brief names, and Asar neither engages nor cites it. He builds 'no acceptance script written today can ever go green' and 'SITE THE GUNS first' on the wrong mechanism, which would send the next revision at 42 turret positions instead of at three literal arguments in a free span.
  - **action**: Reject the siting-first ordering as stated. The first fix is to make the TARGET-button fallback pool grant the reach the aimRef path already grants — an edit wholly inside free lockOn, zero frozen spans, one revision. Keep the siting record as its own separate work, not as the precondition.
-
  - **asm**: aset
  - **severity**: BLOCKING
  - **finding**: Every per-seat magazine is unbuildable without moving a frozen span, and the pod names only half the problem. All eight magazine definitions are pinned in /home/user/eXeL-AI-Polling/frontend/tests/range-spans.json: hudMag, magCap, magSpend, magLoad, magReload, magHasRound, MAG_PNG, MAG_FILL_TOP. magCap at play.html:958 hard-returns 10 or 30. So DD-121's 'Not the 30-round picture' at the THAAD/Patriot seat and 'the C-RAM burst, not three rifle rounds' at the LPWS cannot be rendered at all on this deck. Aset's gate THE_PICTURE_IS_HIS_AT_EVERY_SEAT frames this purely as a picture owed from him; the frozen half is the harder half and no package states it.
  - **action**: Record the missile/LPWS HUD readout as NOT BUILDABLE on the frozen deck, blocking Advance — it needs both a picture from him AND a deliberate frozen-span change that updates range-spans.json in the same commit. Note the one thing that IS buildable: multi-round modes, because fireN is FREE and may call the frozen magSpend N times, which is DD-35-compliant reuse.
-
  - **asm**: aset
  - **severity**: MAJOR
  - **finding**: Aset's REAL_WORLD_IS_LOCKED gate prescribes an impossible build site. She writes that the query reader 'calls enterTheRange — frozen; the lock must therefore be built at the call site, not inside it.' The call site is itself frozen. range-frozen.test.mjs's extractor (spansOf, frontend/tests/range-frozen.test.mjs:32-37) runs each span from its declaration to the NEXT top-level declaration, so enterTheRange's hash covers origin/main play.html:5946 through :6000 — the next declaration is CIN at :6001. The function body ends at :5964; lines 5965-6000 are the arcade IIFE containing the only ?range=/?mode= reader at :5995-5996, frozen by adjacency without being named in the freeze list. Also, 'the deck's ONLY query reader' is wrong: isDiag() at :1088 is a second.
  - **action**: Move the Real-World lock off the query path entirely. Build it as a hoisted function in the append zone plus a guard on a genuinely free surface — goRange (play.html:6139, free) or the #chLvl change handler. Add the 5965-6000 frozen-by-adjacency zone to the plan's constraints so no later revision tries to edit boot code there.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: A frozen/free misclassification carried by the task brief itself and uncorrected by any package: goRange is listed as FROZEN. It is not. range-spans.json holds 100 names (identical on both trees, pinnedAt r.207) and goRange is absent; it is declared at origin/main play.html:6139 with 15 call sites. Only buildRange, parkRangeTurrets and enterTheRange match on name. This matters because the three teleport traps (MODE, RESTART, TARGETS sending the player back to the Range) all run through goRange.
  - **action**: Reclassify goRange as FREE and move the teleport-trap fix from 'not buildable' into the one-revision column. Re-verify the brief's whole frozen list against range-spans.json before planning — it was wrong on at least this entry.
-
  - **asm**: asar
  - **severity**: MAJOR
  - **finding**: Asar's 'the first commit is the record' decision rests on a false fact, and it is the same stale-tree error he accuses Specialist 1 of. Both artefacts are already persisted on origin/main: docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md with a matching .sha256 sidecar, asserted by frontend/tests/asks-persist.test.mjs (the sidecar-matches-file assertion, verified present on both trees); and DD-124 appears 6 times in docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md on origin/main, with DD-125 through DD-129 also landed. Aset is right and Asar is wrong. Acting on his finding would be rework of a completed act under R-CORE NO REWORK.
  - **action**: Withdraw the 'persist the record first' commit from the plan. Keep only the one genuine gap DD-126 names — the 6.7 MB PDF has no docs/whitepaper/ copy and no workflow trigger.
-
  - **asm**: aset
  - **severity**: MINOR
  - **finding**: Aset's unanimous Capitol decision verifies clean and is the cheapest correct revision in the pod. Confirmed on origin/main: play.html:895 ships 8 doors over 5 buildings with four on the Capitol (D-CAP-S/N/E/W); the record /home/user/eXeL-AI-Polling/docs/drone-2525/drone-2525.v00.00.json holds 14 buildings / 14 doors with the Capitol authorising exactly one at [0,-55] (source 'carried', confidence 'high'). All six spawn spots at play.html:2962 satisfy |x|<=18 and |z|<=22, inside the footprint. Her claim that frontend/tests/drone-arena.test.mjs derives doors.length from the record and never opens play.html is confirmed — the drift is invisible to the gate credited with it. doors, spawn and drawTargets are all absent from range-spans.json, so this touches nothing frozen.
  - **action**: Ship as revision one: delete the four D-CAP rows from the free doors table, move the six spawn spots outside the footprint, add the CAPITOL_IS_NEVER_A_TARGET row shown red on r.218's bytes first.
-
  - **asm**: christo
  - **severity**: MINOR
  - **finding**: Christo's lane-picker finding is verified and is the highest value-per-byte fix here. The hide rule at origin/main play.html:171 lists modePick, plat, water, motLvl, tgtPick, chLvl, diffLvl, halPick — and NOT lanePick, which :172 instead gives order:2. Both selectors are scoped #app.range, so on the lawn nothing is hidden and #lanePick renders live; its handler seatLane and the parkRangeTurrets it calls are BOTH frozen, so the trap cannot be fixed in JS at all. The CSS sits outside every top-level declaration, so it belongs to no span. One added rule, zero frozen spans.
  - **action**: Ship as a one-line CSS revision. Add the new #app:not(.range):not(.more) rule BESIDE the existing one and leave :171 byte-identical — frontend/tests/drone-playable.test.mjs:50 pins the literal substring '#app.range:not(.more) #modePick' by regex and will throw if it moves.
-
  - **asm**: asar
  - **severity**: MINOR
  - **finding**: Asar is right that only three localStorage keys exist (exel-2525-perf, -sets, -soak — I verified by enumerating every getItem/setItem; exel-2525-train and -session are download filenames, not keys). But he declares 'nothing survives a reload' and misses a durable store that is already live: play.html:1477 opens IndexedDB database exel-2525-rec with object store 'pack' (keyPath 't') and parks the handle on state.idb whenever Worker and IndexedDB are present. It is in no frozen span.
  - **action**: Under NO REWORK, build the four-metric ladder record on the existing exel-2525-rec/pack store rather than inventing a new key, and grep-verify it before opening code. The new accessor goes in the append zone as a hoisted function — verified safe, since the last 14 top-level declarations of inline script #1 (ending lookToggle at :6740, before </script> at :6790) are all free, so appending shortens only a free span's hash.
-
  - **asm**: asar
  - **severity**: MINOR
  - **finding**: Asar's reachability geometry is sound in its conclusion and incomplete in its reasoning, and his high line numbers are local-tree. Verified independently: stations re-home to a 240 m circle (play.html:1256, :1267), pops sit at r<=22, so the nearest of 42 stations is 218-222 m against an 80 m cap — 0 of 6 lockable, matching the observed 222.3 m tap. UAVs spawn at r=90 (play.html:2967-2972) so the minimum station distance is 150 m against a 120 m cap. His 'entire inbound track' argument covers only the static phase; I checked the 'moving' branch at play.html:3003-3006 that he does not mention, where velocity is rewritten to an orbit of radius speed/omega = 9/1.2 ≈ 7.5 m, capping UAV radius near 97.5 m and station distance near 142.5 m. Conclusion survives with 22.5 m of margin. But SWARM at :5715 and the query reader at :5928 are LOCAL lines; on origin/main those are :5995-5996 and other content.
  - **action**: Keep the geometry, re-cite every anchor above line 5,700 from origin/main, and add the moving-phase check so the finding cannot be dismissed as static-phase-only. Note the margin is 22.5 m, not infinite.
-
  - **asm**: aset
  - **severity**: MINOR
  - **finding**: The siting-record decision verifies exactly as Aset states and is correctly ordered, but it is two commits, not one deck revision. Confirmed in /home/user/eXeL-AI-Polling/docs/drone-2525/drone-2525.v00.00.json: turrets[] holds three entries (t-south [0,-210], t-west [-210,0], t-east [210,0]) whose only keys are id, label, at, heightM, homeAz, homeEl — no arc, no class, no modes. The strings avenger, lpws, sentinel, thaad, patriot and defended each occur zero times in the record, and Sentinel/Avenger/LPWS/THAAD/Patriot each occur zero times in origin/main play.html. So Sector and Layer are blocked on the record file, not on code, and DD-124's Introductory cue gate has no entity to read.
  - **action**: Plan it as a docs-only commit (record gains arc/class/modes per position, plus the Sentinel pairs before any gun) followed by a separate deck revision that reads it. Do not bundle them — the record commit changes no deck bytes and must land first under PERSIST FIRST.
-
  - **asm**: asar
  - **severity**: NOTE
  - **finding**: Asar's foil lock-window figure is probably an undercount. Foils spawn at |x| 70-89 and z 40-89 (play.html:2988-2990), i.e. radius about 80.6-125.9 m, and fly inward on negative x and negative z until life expires at 14 s or radius exceeds 220. Because the track passes through the origin region and out the far side, the radius dips and then rises again, so a foil can re-enter the 160 m cap on the far side — plausibly two windows, not the single 1.07 s mean he reports. His own caveat that the figure assumes CH5 d=3 is honest and correct.
  - **action**: Re-measure the foil window by sweeping the whole track rather than the inbound leg before any number enters a gate row.

**Residual gaps:**
- LEAK is still undefined by him. All three packages correctly decline to invent it; Aset is right that it is a role in an assignment, not a radius. A rung whose failure mode has no definition cannot be scored, so it stays out of any gate until he says one sentence.
- EW is in his source (Pangu's spoof package; FM 3-12 in the back matter) and in none of DD-124's five rungs. An effect that degrades cohesion without a shot has no place in TARGET-APPROVE-FIRE, so it cannot be inferred — his call whether it enters and at which rung.
- The Real-World roster is unresolved between his own two sources: the PDF's three groups of three (nine) versus the record's swarm.total 42 / perSide 21. Aset's correction is right that nine comes from the PDF and that Shield in the Sky carries no roster count. Buildability favours nine, since the 42 SWARM objects are draw-only and lockOn's candidate pool never adds them — but that is a reading of code, not of him.
- 'A burst of 3' at DD-124's Intermediate names a round count that none of DD-121's eight modes releases and no seat may fire. Needs his word: a ninth mode, or the C-RAM burst moved to Intermediate. Buildable either way once chosen, since fireN is free.
- The missile and LPWS magazine readouts need a picture from him AND a deliberate frozen-span change to magCap/hudMag/MAG_PNG. This is the one item in the pod that is blocked on both a human input and a freeze decision at once; it blocks Advance.
- The lawn has no defended points. The record contains 'defended' zero times, so 'Defended assets preserved' cannot be scored as the paper's four-asset set. Asar's Capitol-alone reading (CAP_FP, farthest vertex 88.6 m) is the only sourced option, but the choice between it and the briefing's four assets is his.
- 'Joint network stable' has no meaning on a deck that fetches nothing. SYNC_DIRECT is the single EXPECTED_RED entry in the 251-row deck-qa manifest precisely because one device can never satisfy it. Either Real-World runs in two contexts, or the line prints UNSCORED.
- 'Flown down under control' is owed code, not a definition: the record declares descentMs 1.6 and touchdownAglM 0.3, the deck has no descent state, and frontend/lib/drone-2525/swarm.ts does the opposite by setting alive=0. Until it exists the scoreboard may say DISABLED with a count, never 'neutralized'.

### MoT · GATE over pod MEANING — **FIX_FIRST**

**Headline.** Five of the node gates both packages lean on measure an artefact the deck does not contain — the deck is defended almost only by the browser harness — and the persist gate credited with discharging PERSIST-FIRST on "Shield in the Sky" cannot fire on any dotted-date ask, so correct the gate set before a plan sentence is written.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: THE GATE-ARTEFACT MISMATCH CLASS — the single defect behind both packages' gate sections, and neither names it as a class. Every node gate cited as a defence of the lawn reads a DIFFERENT artefact than play.html. Verified four times: drone-arena.test.mjs:13 loads only docs/drone-2525/drone-2525.v00.00.json and never opens play.html, so its :31 door-count assertion compares buildArena(SRC) to SRC (both sides derive from the record); drone-gimbal.test.mjs:125-128 asserts the 10,000 ms winnability threshold against TSPEC.upMs, a record field; drone-authority.test.mjs:83-85 gates the friendly-fire refusal in frontend/lib/drone-2525/, and grep on origin/main play.html returns coversShot=0, 'not friendly'=0, hostile=0; drone-swarm.test.mjs:25 asserts 21/21 in lib/drone-2525/swarm.ts. play.html fetches nothing and imports nothing, so none of these four can ever observe the deck. The deck's real defences are the 251-row browser harness plus a handful of regex tests (range-frozen, magazine-rasters, deck-consistency, drone-playable, drone-revisions).
  - **action**: Before any new row is written, classify every proposed gate by the artefact it reads: RECORD (node, prebuild-safe), LIB (node, not on the player's path), or DECK (regex over play.html in node, or a drone-deck-qa boot row in a browser). Reject any row whose artefact is not the one the operator plays. Add the class itself to the register as a correction row.
-
  - **asm**: aset
  - **severity**: BLOCKING
  - **finding**: Aset's decision 2 — '"Shield in the Sky" IS persisted AND GATED, asks-persist.test.mjs:41 asserts the sidecar matches the file on every run' — is half true, and the half that fails is the half he cites. The file and the matching sidecar are real (verified: origin/main sha256 ad8f9280… equals the content, and :41 is the exact assertion line). But asks-persist.test.mjs:20 is `dateOf = (name) => (name.match(/^(\d{4}-\d{2}-\d{2})/)||[])[1]` — DASHED only. Shield is named 2026.10.19_… — DOTTED. dateOf returns '', inWindow is false, and the window branch at :34 that COMPELS a sidecar never runs for it. The :41 assertion only fires because somebody voluntarily wrote the sidecar; delete the sidecar and the gate stays green. 45 of the 177 asks on origin/main are dotted — i.e. the whole Drone-2525 corpus, the DD register, and both of today's papers — and CLAUDE.md's own naming law mandates the dotted form, so the gate's window requirement is structurally dead for every ask written under current policy.
  - **action**: Do not record PERSIST-FIRST as discharged. Fix dateOf to accept [-.] between the date parts (one-character change, prebuild-safe node test), re-run, and show it RED on today's bytes by deleting a sidecar in a scratch copy. Separately: the gate filters to .md only, so docs/asks/2026.10.19_The_Future_of_Drone_Swarms_AI-4-Defense.pdf — the ONLY source of the 'nine total' roster both packages build Real-World on — is unstamped and ungateable; add a sidecar rule for .pdf.
-
  - **asm**: aset
  - **severity**: BLOCKING
  - **finding**: Gate THE_PICTURE_IS_HIS_AT_EVERY_SEAT is not merely red — it is UNSATISFIABLE without breaking two existing gates, and Aset's row text does not say so. magazine-rasters.test.mjs:40 pins the deck source with an exact closed regex `const MAG_PNG=\{ink:…,frame:…,green:…,amber:…,red:…\};` — exactly five keys — and that test is in PREBUILD, so a sixth raster for the missile or LPWS seat fails the build before CI. Independently, MAG_PNG, MAG_FILL_TOP and hudMag are all three in frontend/tests/range-spans.json's 100 frozen spans, so a second magazine readout also trips range-frozen.test.mjs (also prebuild). Aset correctly cites CLAUDE.md:12 (a new look is his picture, never a drawing) but presents the blocker as 'there is no sixth raster' when it is 'two prebuild gates forbid one'.
  - **action**: Re-word the row to state the real precondition: his picture, a new PIN entry, a sixth MAGAZINE.sha256 line, an amended :40 regex AND a re-pin of MAG_PNG in range-spans.json — four artefacts, not one. Until then the row cannot be authored at all, so Advance is blocked on his picture; say that in one line rather than carrying a gate that cannot be written.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: HIS FIRST LAW HAS NO GATE ON THE LAWN. Both invariants assert TARGET→APPROVE→FIRE per target off the Range (Asar's names it explicitly), and NEITHER package proposes a row for it. The only existing defence, deck-qa row EVERY_TARGET_NEEDS_TARGET_APPROVE_FIRE (drone-deck-qa.mjs:62), is a browser row whose expected string is a Range bounce/stay transcript, and marksPersist() at origin/main play.html:2722 is `chNum()===0 && !(state.lobby&&state.lobby.phase==='LIVE')`, so off the Range marks do not persist and 'target all, approve all, fire all' cannot be exercised. This is the most dangerous ungated invariant in the pod: it is his stated first law and both packages assume it is covered.
  - **action**: Add a drone-deck-qa boot row (browser harness — it needs the live press sequence, not a regex) that seats a lawn station at a non-zero channel and asserts bare F refused → TARGET → amber F refused → APPROVE → F hits, with the marksPersist branch stated in the row id. Show it RED on today's bytes, where it cannot even be driven.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: 'A PERSON IS NEVER A TARGET; A FRIENDLY ICON THAT TAKES A HIT IS A FAILURE' is listed in the task's binding laws, is a declared Advance failure in DD-124, and appears in NO gate in EITHER package's gate list. The only gate anywhere is drone-authority.test.mjs:83-85 ('authorised action against hostile, not friendly') and it lives in frontend/lib/drone-2525/ — verified absent from the deck (coversShot/hostile/'not friendly' all 0 occurrences in origin/main play.html). So the deck has no friendly class, no refusal path, and no row; the law is green in a module the player never reaches.
  - **action**: Add it as a named row before Advance is planned. It is deck-side and state-dependent, so it belongs in drone-deck-qa as a boot row (spawn a friendly-sided contact, assert mark/approve/fire all refuse), not in a node regex. Name it in the register as an invariant that was asserted for three revisions with no gate.
-
  - **asm**: asar
  - **severity**: MAJOR
  - **finding**: The metrics gates rest on a premise that is true about localStorage and FALSE about the deck. Asar: 'The deck holds exactly three localStorage keys … so nothing survives a reload and there is no ladder store to read'; Aset says the same. localStorage is indeed exactly exel-2525-perf / -sets / -soak (verified). But origin/main play.html:1477 opens an IndexedDB database 'exel-2525-rec' with object store 'pack' keyed on t, and :2518 puts every sample() row into it — and that row (:2505-2513) already carries sid, t, mot, mode, unit, score and `hits`. Two of the four metrics are already durable per device. Asar's own proposal of 'one new key' is therefore a parallel store beside a shipped one, which is the fork NO REWORK forbids — the same objection he raises against Specialist 1's five scripts.
  - **action**: Re-base both metric rows on the shipped store: extend sample()/the pack row with misses and rounds, and add a per-rung rollup, rather than adding a localStorage key. Asar's two derivations stay correct and are worth keeping in the plan — misses from FIRE rows whose result is not DOWN (verified: the miss tally at :2704 is inside `if(isPlate)` and isPlate needs ref.form at :2694, which DD-35 forbids a lawn target), and rounds from magSpend at :2768. Note magSpend and magCap are FROZEN spans, so a burst must call magSpend N times from a free caller.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: RED-FIRST HAS NO AGREED SUBJECT — the two packages proved their gates red on two different trees, and both are now stale. Aset measured origin/main and says the checkout is 5 behind; Asar measured the checkout and concluded 'Shield in the Sky does not exist' and 'DD-124 appears zero times'. Today the checkout is 13 behind origin/main (f7f21cb67 … 16a4114ee), play.html is 1,186,355 B locally and 1,198,239 B at origin/main, and r.218 is in flight. The divergence is already visible in their citations: the deck's second query reader is :5928 on HEAD and :5995 on origin/main — Asar cites :5928, Aset cites :5996, both correct for their own tree. On origin/main DD-124 occurs 6 times and DD-126 8 times, so Asar's 'the ladder exists only in conversation' is an artefact of the stale checkout, exactly as Aset says.
  - **action**: Name the SHA in every gate row's redToday line, and prove red on ONE tree — origin/main, since that is what Verify Live will serve. Re-run the whole red-first battery after r.218 lands, because r.218's stated purpose ('the record cites what exists, and the build the site runs is the build the gates ran') may move several of these line numbers.
-
  - **asm**: aset
  - **severity**: MAJOR
  - **finding**: Gate DECK_DOORS_ARE_THE_RECORDS is the best-diagnosed row in the pod and I confirm it independently, with one correction to how it is framed. Verified: the record holds 14 buildings / 14 doors with the Capitol carrying exactly ONE at [0,-55] (source 'carried', confidence 'high', footprint x[-88,88] y[-55,55]); origin/main play.html:895 ships ['D-CAP-S',0,3.2,46.04],['D-CAP-N',0,3.2,-46.04],['D-CAP-E',88.33,3,0],['D-CAP-W',-88.33,3,0]; and the six lawn spawn spots at :2962 are all |x|<=18, |z|<=22, inside the footprint. Correction: drone-arena.test.mjs:31 is not a gate that 'could only ever pass' in the strict sense — it does hold that buildArena drops no door — but it cannot observe deck drift, so Aset's substantive charge stands. None of doors, spawn or drawTargets is in range-spans.json's 100 frozen spans (verified), so the fix obeys DD-35.
  - **action**: Accept both rows. CAPITOL_IS_NEVER_A_TARGET and DECK_DOORS_ARE_THE_RECORDS are node regex tests over play.html plus the record — browser-free, so put them in PREBUILD beside deck-consistency.test.mjs, not in test:ci where drone-arena currently sits. Re-word the redToday line to say drone-arena:31 measures the record, rather than implying it is a sham.
-
  - **asm**: asar
  - **severity**: MAJOR
  - **finding**: Gate LOCK_WINDOW_BEATS_THE_SWING is the cheapest honest gate proposed and the reuse is real — verified drone-gimbal.test.mjs:125-128 computes worstSwingMs = (180/SPEC.slewDegPerSec)*1000 plus aimAllowanceMs = 6000 and asserts TSPEC.upMs >= 10,000, passing on the record's upMs 14000. But Asar does not say which harness the EXTENSION belongs in, and the two halves differ. The deck's pop life (`idle.life=4+g`) is a source constant reachable by regex, so that half is a node test and prebuild-safe. The foil and UAV lock windows are runtime geometry against the caps at play.html:2303/2305/2306 and the CAP_RING=240 re-home at :1256/:1267 — those need either a browser row or a pure helper extracted from the deck, and the deck exports nothing.
  - **action**: Split the row: LOCK_WINDOW_BEATS_THE_SWING_STATIC (node, prebuild, regex on the life constant against the existing 10,000 ms threshold) and LOCK_WINDOW_BEATS_THE_SWING_LIVE (drone-deck-qa boot row, test:ci only, measures lock acquisition from a seated station). Do not put the live half in prebuild — prebuild is verified browser-free and drone-deck-qa.mjs:22-24 requires playwright and a Chromium binary.
-
  - **asm**: aset
  - **severity**: MINOR
  - **finding**: Gate REAL_WORLD_IS_LOCKED_ON_AN_EMPTY_RECORD conflates two artefacts with two different locks. Aset's evidence is frontend/lib/drone-2525/progression.ts:39 `if (isJoiner) return true;` — verified exact — but that governs the Next.js route, not the deck. The deck has exactly two query readers (origin/main :1088 isDiag and :5995-5996 q.get('range')/q.get('mode')), and :5996 calls enterTheRange, which IS in the 100 frozen spans, so Aset is right that the lock must be built at the call site. But one row cannot hold both, and a green lib lock would say nothing about the static deck.
  - **action**: Split into REALWORLD_LOCKED_IN_THE_DECK (node regex on play.html's query-reader block, prebuild) and REALWORLD_LOCKED_IN_THE_ROUTE (node test over progression.ts, test:ci). State in each redToday line that neither lock exists today — an absent lock is a legitimate red, but say 'absent', not 'fails', so the row is not read as a broken harness.
-
  - **asm**: aset
  - **severity**: MINOR
  - **finding**: Gate NO_MODE_RELEASES_AN_UNNAMED_ROUND_COUNT is sound and fully verified on origin/main: 'a burst of 3' at register :3420 and :3488 (and DD-123's earlier cut at :3346), against :3286 'Its burst is the C-RAM burst, not three rifle rounds'; and the deck has no burst machinery (grep burst on origin/main play.html = 2, both prose). It is genuinely red, it has a row id, and it states what it holds. One caveat for the harness: both halves are text — the register and the deck source — so this is a node test and belongs in prebuild, and it is the one proposed row that could be authored and shown red today without any new code.
  - **action**: Author it first, as the red-first proof for the whole package. Keep Aset's framing in the gaps list — 'a burst of 3' is a round count that exists at a rung, in no mode and at no seat — because the row documents a question for him rather than a defect to fix, and a row that can only be closed by his word must say so in its text.
-
  - **asm**: CROSS
  - **severity**: NOTE
  - **finding**: I could audit only two of this pod's four packages. The task text truncates mid-sentence inside Christo's first decision ('The lawn's bar is not merely crowded — it ca') and the fourth AsM package is absent entirely, so Christo's gate rows and the fourth's are unreviewed. What I could check of Christo's visible decision holds: seatLane and parkRangeTurrets are both in the 100 frozen spans, so fixing #lanePick with a CSS rule rather than touching seatLane is DD-35-correct, and RANGE_MENU_ON_SCREEN is a real row in DECK_QA_ROWS. But CSS is not covered by range-spans.json at all, so his claim that byte-identical #app.range selectors make 'DD-35 absolute' overstates it — the mechanical defence there is the browser row, not the span freeze.
  - **action**: Treat this pod's gate review as covering Aset and Asar only. Re-run the GATE angle over Christo and the fourth package before the plan is assembled, and in particular check whether Christo's CSS row is a drone-deck-qa boot row at four viewports (it must be — a CSS visibility rule cannot be proven by regex).

**Residual gaps:**
- Christo's package is truncated mid-sentence and the fourth AsM package is absent from the task text, so half this pod's gate rows are unaudited. My verdict covers Aset and Asar only.
- I did not execute drone-deck-qa.mjs — it needs Playwright and a Chromium binary. DECK_QA_ROWS.length=251 and EXPECTED_RED=['SYNC_DIRECT'] were verified by node import of the manifest, not by a live run, so I cannot confirm those 251 rows are actually green on today's bytes.
- I verified the INPUTS to Asar's distance figures (CAP_RING=240 at :1256/:1267, six spots all |x|<=18/|z|<=22 at :2962, caps 80/120/160 at :2303/:2305/:2306) but did not independently re-run his 42-station sweep, so 218.0-222.1 m, 150.0 m and the 1.07 s mean foil window are unconfirmed numbers resting on confirmed inputs.
- I checked only a narrow window of drone-deck-qa.mjs around the EVERY_TARGET_NEEDS_TARGET_APPROVE_FIRE row and saw no channel switch, so 'that row runs at the default channel' is inferred, not proven. If it does drive a non-zero channel, item 4 weakens.
- r.218 is in flight (task #44, 'the build the site runs is the build the gates ran'). Every line number in this review is origin/main at f7f21cb67 and may move. Nothing here was re-checked against r.218.
- Whether the two unsidecarred 2026.10.19 grok .md files and the ungated .pdf are deliberate or lapsed is not knowable from the repo — it needs his word or a register row.
- LEAK still has no definition from him and EW is in his source and in none of his five rungs. Neither is a gate gap I can close; both are questions to spend on him, and both packages agree.
- Whether Real-World's roster is the PDF's nine or the record's 42 remains his call. I confirmed the record's swarm block (total 42, perSide 21, passMark naming 42 aircraft at 30 Hz) but did not verify either package's claim that the 42 SWARM objects are absent from lockOn's candidate pool.

### MoT · CUT over pod MEANING — **FIX_FIRST**

**Headline.** The whole pod measured a tree 23 commits stale and missed that the operator committed his own Capital Lawn plan today — it gates everything on "one player completes TRAIN UP/DOWN on the lawn," and that is one predicate (chNum()===0) plus one CSS rule away, not a siting record or a Real-World harness.

**Items:**
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: Every package in this pod measured a stale tree and none of them found his own plan. Local HEAD b7e1a304e is 23 commits behind origin/main (Aset says 5, Asar says the briefing is absent, the task brief says "clean, at HEAD" — all three are wrong). Ten of those 23 commits are the operator's OWN Capital Lawn specification, written today: docs/whitepaper/Capital_Lawn_Architecture.md (4f3d42a08), CRS_Capital_Lawn_2026-10-19.md (0513798c1, 3ad83b5f6), Key_Deliverable_Introductory_Mode.md (06d613bb4), Drone-2525_Plan_Introductory_Mode_Build.md (b1c9f9e26 → d8c03b817). The pod spent its entire budget inventing a plan he had already written and committed.
  - **action**: Fetch origin/main and re-read those five files before another sentence of planning. His literal instruction, stated twice in Drone-2525_Plan_Introductory_Mode_Build.md, is "For every Sub-Plan row below, replace the placeholder Input and Output with the concrete I/O contract." That is a documentation task against ~25 rows, not a code task, and it is the only thing in this assessment he actually asked for in writing today.
-
  - **asm**: CROSS
  - **severity**: BLOCKING
  - **finding**: His order of build invalidates most of the pod's output. Key_Deliverable_Introductory_Mode.md: "Introductory mode is the foundation. Nothing in Intermediate, Advanced, or Real-World advances until Introductory works." Step 1 is one player, one system, three-press loop, TRAIN UP/TRAIN DOWN, glass truth, magazine, START/time/hits/misses. Asar's five-line scoreboard, nine-beat Real-World run, swarm roster and acceptance harness are PLAN-D2525-RW.01, which he marks "Designed" and gates behind three green rungs. Aset's siting record, Patriot seat and Sector/Layer modes appear nowhere in today's plan at all.
  - **action**: Cut everything above Introductory from this revision cycle. Keep it as the record it already is (DD-118..DD-126 are append-only and intact) and do not build against it. Rung 1 is red; rung 5 work is rework by construction.
-
  - **asm**: CROSS
  - **severity**: MAJOR
  - **finding**: The single revision that puts the most of his intent on his phone soonest is one predicate. `chNum()===0` is the deck's only notion of "solo drill," and it drives BOTH marksPersist() (play.html:2722, origin/main) AND the `.range` body class (play.html:1080, `app.classList.toggle('range',chNum()===0)`). Because it is false on the Capital lawn, three things fail at once: (a) marksPersist() gates thirteen behaviours of the three-press loop — markUnderBullseye :1055, nextStep :1059, toast clear :1082, focus-not-remake :2262, markLock keep :2578, approveDesig :2641/:2643/:2646, fireN :2731/:2736, recital :3147/:3148, double-tap-fire :4241, tap-to-aim :4249; (b) tap-to-aim at :4249 is what sets state.aimRef, and lockOn's aimRef branch at :2295 returns UNCAPPED — which is exactly why a tap locks at 222.3 m while the capped pool at :2303 refuses at 80 m; (c) the picker-hide rule at :171 is scoped `#app.range:not(.more)`, so off the Range the entire picker row renders live. I verified marksPersist is NOT in frontend/tests/range-spans.json (100 spans; chNum, enterTheRange, applyMode, pickMap, seatLane ARE frozen, marksPersist/lockOn/nextStep/paintCues/CAP_RING/restoreCapitolTurrets are free). Changing marksPersist's body while it still calls frozen chNum() is precisely DD-35 — built FROM the Range by calling it.
  - **action**: Ship ONE revision: widen marksPersist() to `(chNum()===0 || capitalSolo()) && !LIVE` (free span, DD-35-clean), plus Christo's single CSS rule. Nothing else. That delivers PLAN-D2525-INTRO.01's three-press loop and glass truth on the lawn without touching a frozen span, a target class, the record, or the 80 m cap.
-
  - **asm**: christo
  - **severity**: MAJOR
  - **finding**: The only pod finding that lands directly on his step 1, and it is one CSS rule. Verified: the hide rule at play.html:171 is `#app.range:not(.more) #modePick,…#plat,#water,#motLvl,#tgtPick,#chLvl,#diffLvl,#halPick{display:none}` — Range-scoped only. #lanePick is never in that list at all; it only receives `order:2` on the Range at :172. Since `.range` is off on the lawn (:1080), the player sees the full picker row including #lanePick, whose handler is unconditional (`lp.onchange=e=>seatLane(+e.target.value)` at :6169) and whose seatLane calls parkRangeTurrets, rewriting all 42 units to LANES geometry. One tap on a dropdown he cannot avoid destroys the Capitol ring. His step-1 gate is "a full TRAIN UP run without broken presses or false colours" — this is the most reachable way to break it.
  - **action**: Add one rule `#app:not(.range):not(.more){…}` hiding the same eight controls plus #lanePick. Every `#app.range` selector stays byte-identical, so RANGE_MENU_ON_SCREEN cannot move — the QA harness adds `.range` itself at :4857 and restores it at :4863, which I verified. Ship this in the same revision as the marksPersist widening; they are the same user-visible outcome.
-
  - **asm**: aset
  - **severity**: MAJOR
  - **finding**: SCOPE CREEP, named: rebuilding the deck's door table to derive from the record. Aset asks for the deck's 8-doors-over-5-buildings table to be regenerated from the record's 14 buildings / 14 doors. The operator's own ask is narrower and already written: PLAN-D2525-RW.02, status "Blocked", requirement "Capitol façades D-CAP-S/N/E/W are not pop-up targets," metric "Zero façade IDs as pop-up targets." He asked for four entries to stop being targets, not for a table to be re-derived. I confirmed the four façades at play.html:895 and that doors are lockable only inside 70 m (:2308), so from a 240 m station they are not reachable anyway — the live defect is the six pop spots at :2962, all within |x|<=18/|z|<=22 of a footprint spanning x[-88,88], z[-55,55].
  - **action**: Keep only the four-façade removal and move the six spawn spots out of the building. Drop the table-derivation. Note it is Real-World-gated (RW.02) so it is not even this revision — but it is cheap and he flagged it himself, so it is the natural second revision.
-
  - **asm**: aset
  - **severity**: MAJOR
  - **finding**: SCOPE CREEP, named: the siting record with arc, class and permitted fire modes per station. Aset and Asar both make this "the next revision." It is DD-118-era work and appears nowhere in the five files he committed today. Their stated justification is that Sector and Layer cannot be implemented without per-gun arc and class — true, but Sector and Layer are not in today's plan either; the Intermediate row (PLAN-D2525-INT.01) asks only that the lawn gun not take the high track and that a decoy not be chased. Aset's supporting measurements are sound (turrets[] is three entries with no arc/class/modes; avenger/lpws/sentinel/thaad/patriot occur zero times in the record) but they establish a gap he has not asked to close now.
  - **action**: Defer entirely. His own correction — "Forty-two was the even ring. Designing 42 new ones recreates it" — is an argument for NOT choosing a number, and today's plan does not need one: Introductory is one player at one station. Revisit when Intermediate opens.
-
  - **asm**: asar
  - **severity**: MAJOR
  - **finding**: SCOPE CREEP, named: the acceptance-script shape, the parameterised run record and the five-line scoreboard. Asar's measurements are the strongest in the pod and several are correct and novel (the breach check at :3013 sits inside drones.forEach opened at :3001, so it covers one of three arrays; drone-gimbal.test.mjs:125-128 already enforces a 10,000 ms winnability threshold against the record and never reads the deck). But all of it serves PLAN-D2525-RW.01, which he marks "Designed" and gates behind Advanced green. Asar himself concedes the scripts would all be red today.
  - **action**: Keep two measurements and discard the build. The breach-loop scope bug and the gimbal-gate blind spot are real and cheap to note in the plan's Gap/Delta column — which is literally the column he asked Claude Code to fill. Writing the harness now produces five tests that cannot pass.
-
  - **asm**: asar
  - **severity**: MINOR
  - **finding**: Stale-tree artefact: Asar's "the briefing text and DD-124 are not in the repo, commit them first" is false on origin/main and would be rework of a completed act. Verified: docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md exists at 26,867 B with a .sha256 sidecar, plus docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md and Shield_in_the_Sky_Images.md (f7f21cb67, DD-128/129), plus two Grok source copies. DD-124 appears 6 times in the asks record and once in the briefing.
  - **action**: Withdraw the PERSIST-FIRST finding. Aset caught this correctly and is right; the conclusion stands even though Aset's own commit count was also wrong.
-
  - **asm**: aset
  - **severity**: MINOR
  - **finding**: Aset's re-measurement decision — the one package item that claims to fix exactly this class — is itself stale. It states 5 commits behind, play.html 1,198,239 B at origin/main, and r.217 as the newest ship. Actual: 23 commits behind; origin/main play.html is indeed 1,198,239 B (that figure is right) but ten later doc commits and DD-127/128/129 landed after the window Aset measured, including the operator's entire plan.
  - **action**: Accept the principle, redo the measurement. This is the pod's own instruction failing at the input end a second time — the exact failure Aset named.
-
  - **asm**: CROSS
  - **severity**: NOTE
  - **finding**: NO-REWORK hit nobody checked: his steps 3 and 4 already have scenes. play.html:448-449 ship `<option value="one">SCEN · 1v1</option>` and `<option value="three">SCEN · 3v3</option>`, handled at :2907-2908 (`state.unit='D1Q'…toast('1v1 · QUAD/VTOL/FOIL · 2 HI')` and `state.unit='D1'…toast('3v3 · 6 HI')`). These are drone-flight scenes, not lawn-turret scenes, so they are partial reuse rather than a complete answer to CRS-CL.INTRO.03/.04 — but they are a real starting point nobody cited. Separately the :2908 toast says "6 HI" while aedf4c2e8 revised his spec to 6 systems and up to 12 HI (2 per system).
  - **action**: Cite these in the INTRO.03/.04 Input/Output rows as existing scaffolding and flag the 6-HI toast as a one-string drift against his newest word. Do not design a new seat map before extending these.
-
  - **asm**: CROSS
  - **severity**: NOTE
  - **finding**: Honest limit on the single revision, so it is not oversold. Widening marksPersist() delivers roughly ten of the thirteen gated behaviours. Three — the NOT MARKED guard on APPROVE (:2643), A DARK BUTTON DOES NOT ACT (:2646) and the NOT MARKED guard on FIRE (:2736) — are additionally gated on `platesHere().some(p=>p.id===state.desig.id)`, and platesHere() is `PLATES.filter(q=>q.lane===(state.lane||0))`, i.e. Range geometry only. A lawn pop is never in it, so those three stay inert on the lawn. The deck's own comment at :2646 already names this as owed: "marksPersist() and platesHere() put this on THE RANGE… in a challenge and in a LIVE room a dark APPROVE still acts, which is CLASS 1e's ground."
  - **action**: Ship the widening as revision 1 and state plainly that CLASS 1e (widening the platesHere() term to the lawn's own target set) is revision 2. Do not claim "glass truth" complete until both land — his step-1 gate says "zero false colours."
-
  - **asm**: aset
  - **severity**: NOTE
  - **finding**: Defer, do not re-litigate: the Patriot seat/launcher split, the appended correction striking "only the Avengers are player seats," the 9-vs-42 swarm roster, and the LEAK/EW definitions. Aset's reasoning on each is careful and the Reading-is-not-a-decision catch is genuinely valuable discipline. But today's plan supersedes the question set wholesale: PLAN-D2525-RW.04 already resolves EW in his own words ("Spoof package (EW) is an effect at Real-World, not an operator-controlled control… Effect appears in beat data; no new press"), which closes a gap all four packages list as owed from him.
  - **action**: Record that RW.04 closes the EW gap and stop listing it as owed. Hold the rest until Advanced opens; spending his attention on a Patriot seat while rung 1 is red is the opposite of his stated order.

**Residual gaps:**
- I did not re-run the pod's numeric geometry myself. Asar's computed figures (pops 218.0–222.1 m from the 240 m ring, UAV closest approach 150.0 m, foil window ~1.07 s) follow from inputs I did verify — CAP_RING=240 at :1256, spawn spots at :2962, caps 80/120/160 at :2303/:2305/:2306 — but the trigonometry is his, not mine. They matter only for rungs I am cutting, so I did not spend the budget re-deriving them.
- Whether `capitalSolo()` should key on the scene value ('capital') or on a broader not-LIVE-not-room test. I verified the scene options at :444-449 and that `.range` keys off chNum(), but I did not trace every challenge level to confirm which non-zero chNum values should also count as solo drill. That choice belongs in the revision, not this assessment.
- I read Key_Deliverable_Introductory_Mode.md and Drone-2525_Plan_Introductory_Mode_Build.md in full but only skimmed the commit stats for Capital_Lawn_Architecture.md (187 lines) and CRS_Capital_Lawn_2026-10-19.md (199→60 lines). CRS-CL.01 through CRS-CL.09 are referenced throughout the plan and should be read before the Input/Output columns are filled.
- LEAK still has no definition from him, and today's plan does not supply one — PLAN-D2525-ADV.02 describes leaker behaviour ("inner ring takes it") without defining the boundary. All four packages flagged this and all four were right; it survives his new documents.
- The exchange-ratio question from the briefing (Thor "Still bad math" / Asar "Not if the mission survives") is unresolved and unmentioned in his plan. Not blocking anything below Real-World.
- I did not verify whether the thirteen marksPersist call sites behave correctly once widened — only that they exist and what each guards. The revision needs a red-first gate on r.217 bytes per his law, and that gate will be the real proof.
- Whether the deck's 42 stations should remain at all under his new plan. Step 1 is one player at one system; step 4 is six systems. Nothing in today's documents asks for 42, but nothing retires them either, and I did not want to infer a removal he has not asked for.
- The task brief handed me several line numbers as measured fact (lockOn :2303, asmTick :2940, marksPersist :2722, spots :917). Three checked out against origin/main; `play.html:917` for the pop objects did not match what I found at :2962 for the spawn block, and I did not chase whether :917 refers to the pops array declaration in the local 1,186,355 B copy. Line numbers differ between the two trees.

---

## The twelve AsM packages, as returned (stale-tree caveat applies to every line)


### Athena (GROUND)

**Invariant.** Every air track, ground threat and incoming round on the Capitol lawn is lockable from at least two of the seven sited guns, inside the arc written for each of them — and when any one gun is lost, every contact is still lockable from another.


**Decision 1 — THE COUNT IS SEVEN — derived twice, from two independent constraints, and the eighth gun buys nothing** *(vote: majority; reversible by: "Six is enough" — drop AVG-7 and the written Sector arc widens past 121 degrees, i.e. the arc stops being a sector.)*

Seven Avenger seats on the lawn. The count is an output of two separate tests, run on the record's own geometry. Line of sight first: the 3 sourced stations give 63.4% double-cover of the named avenues and 50.0% of everything, with resilience 78.7% after one loss — they fail. Five guns reach only 98.3% avenue double-cover. Six reach 100% avenue double-cover, 100% box single-cover, 97.3% all-double, 98.1% resilience. Then DD-121's Sector mode binds: it refuses a shot when 'the track is in the sight but outside the arc', so a written arc is a hard firing constraint, and with six the largest gap between neighbouring outward bearings is 121 degrees — no honest sector closes it. Seven drops that gap to 61.9 degrees and lifts all-double to 99.1% and resilience to 99.1%. An eighth changes nothing: all-double stays 99.1%, resilience stays 99.1%. Seven is where the curve flattens.

*Why.* Both the specialists and I were told the count is an output. It is the only number produced twice here by different physics — masking, then arc geometry — and the second test is the binding one. That the eighth gun measures identically is the proof that seven is the stopping point rather than a taste value.

*Evidence.* MEASURED on docs/drone-2525/drone-2525.v00.00.json (arena.elevation 9x9 grid, 14 buildings[], 4 treeRows[], roads[], turrets[].heightM 3.0, gimbal.rangeM 400) with /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/athena_vote/seven.py over 698 samples. Sector mode quoted verbatim at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3264-3302. Record-3 outward bearings 90/180/270, max neighbour gap 180.0 deg.


**Decision 2 — THE SEVEN SEATS, WITH COORDINATES, ARCS AND CLASS** *(vote: summarizer-override; reversible by: "Name a different avenue" — the weighting moves and AVG-4/5/6/7 move with it.)*

Record frame, x east / y north, deck z = minus record y, all at the record's own heightM 3.0, all Avenger, all air class with written Sector arc +/-62 degrees. AVG-1 SOUTH LAWN (0,-210) deck z +210, outward 180.0, arc 118.0-242.0 — the Congress / Great Walk axis. AVG-2 WEST (-210,0) deck z 0, outward 270.0, arc 208.0-332.0. AVG-3 EAST (210,0) deck z 0, outward 90.0, arc 028.0-152.0. AVG-4 NORTH ALLEE WEST (-150,250) deck z -250, outward 329.0, arc 267.0-031.0 — standing in the north-lawn-w allee between the trees at y=240 and y=270. AVG-5 SW FLANK (-90,-95) deck z +95, outward 223.5, arc 161.5-285.5. AVG-6 SE FLANK (135,-185) deck z +185, outward 143.9, arc 081.9-205.9. AVG-7 NORTH ALLEE EAST (150,250) deck z -250, outward 031.0, arc 329.0-093.0. Every bearing of the ring lies inside at least two written arcs; the largest neighbour gap is 61.9 degrees against a 62-degree half-sector.

*Why.* DD-118 names the avenues: 'Avengers on Congress, the Great Walk, and the allees.' AVG-1 sits on the Congress/Great Walk axis, AVG-4 and AVG-7 stand in the two north-lawn allees, AVG-5 and AVG-6 flank the Great Walk allee and own its dead ground. Each position is clear of every building footprint by 6 m and every tree canopy by 3 m, and at least 15 m inside the street box.

*Evidence.* Avenues from the record's own roads[] (greatwalk [[0,-58],[0,-250]] tier 1; congress [[0,-250],[0,-450]] tier 4) and treeRows[] (great-walk-w/e x=+/-28 y -72..-240; north-lawn-w/e x=+/-150 y 90..270). DD-118 mix quoted verbatim at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3111-3135. Coverage measured: avenue double 100.0%, box single 100.0%, all-double 99.1%, resilience 99.1% (worst single loss).


**Decision 3 — THE SAMPLE MUST BE AVENUE-WEIGHTED — and this is where both specialists went wrong** *(vote: summarizer-override; reversible by: "Design the balanced case first" — then the ring is the default and the count is eight.)*

The threat sample is weighted onto the record's named avenues (Congress/Great Walk 200 samples, Great Walk allee 48, north lawn allee 42) with the street box as a lighter balanced residual (408). Both colleagues sampled uniformly — Builder on a 404-point street-box screen, Adversary on 324 points at bearings 0-350 step 10 — and both therefore derived a near-even ring: Builder 8 guns at 0/38.3/90/146.9/180/213.1/270/321.7, Adversary 7 at 24.8/78.7/143.1/180/216.9/281.3/335.2. A uniform sample derives a ring by construction, and DD-118 says in terms that the ring is the balanced-fires case and NOT what gets designed first.

*Why.* This is the one methodological choice that determines the whole answer, and it is settled by a law already in the repo rather than by preference. DD-118: 'The 240 m ring is not deleted. It is the balanced-fires case, correct only when the track can come from any direction — the small-UAS case. It stays on the record as a named option. The default that gets designed first is the weighted avenues, not a new circle of 42.' Deriving a ring and then calling it a siting re-creates the thing being replaced with different coordinates, which is precisely the error he already caught once on the count.

*Evidence.* DD-118 verbatim, docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3111-3135. Measured contrast with /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/athena_vote/derive2.py: uniform 2-cover-everything greedy returns 8 positions; avenue-weighted greedy (2-cover avenues, 1-cover box) returns 6. Same geometry, same code, different sample.


**Decision 4 — THE THREE SOURCED STATIONS ARE KEPT VERBATIM, AND THE 42 ARE RE-HOMED, NEVER REBUILT** *(vote: unanimous; reversible by: "Move the three" — then the free optimum (-195,70) (-150,250) (-90,-95) (0,-200) (135,-185) (210,55) reaches 99.6% at six.)*

AVG-1, AVG-2 and AVG-3 are the record's t-south (0,-210), t-west (-210,0) and t-east (210,0) at their sourced coordinates, unmoved. Four positions are appended. The 42 deck units stay exactly as created at play.html:909-913; restoreCapitolTurrets re-homes eleven of them — seven onto the gun seats, two onto the Sentinel masts, two onto the LPWS mounts — and parks the other thirty-one. Nothing is created and nothing is deleted. Measured cost of keeping the three verbatim rather than free-optimising: all-double 97.3% vs 99.6% at six guns, which the seventh gun recovers to 99.1%.

*Why.* The register is append-only and a correction is a new row, never an edit. The three are the only sourced turret rows in the record. Free optimisation moved all three; keeping them costs 2.3 points of double-cover at six and nothing at seven, which is a price worth paying to leave a sourced row alone. restoreCapitolTurrets, CAP_RING and MAPS are on the FREE list, so the re-home is legal without touching the frozen Range engine — DD-35, the lawn is built FROM the Range by calling it, never INTO it.

*Evidence.* turrets[] in docs/drone-2525/drone-2525.v00.00.json holds exactly three entries. Creation at frontend/public/drone-2525/play.html:909-913; re-home at :1262-1272; CAP_RING=240 at :1256. lockOn, marksPersist and restoreCapitolTurrets are absent from the frozen set — frontend/tests/range-frozen.test.mjs:16 names them 'deliberately absent'. Snap-vs-free measured in /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/athena_vote/final2.py.


**Decision 5 — LPWS x2 GO ON THE CAPITOL ATTIC AT 30 m — I override both colleagues, and the binding variable is HEIGHT, not count** *(vote: summarizer-override; reversible by: "Nothing stands on the Capitol" — then it is four ground mounts at 79.9%/65.2% and the roof is conceded.)*

Two LPWS/C-RAM, class incoming round only, mounted on the Capitol attic at (0,-42) and (0,+42) record frame, deck z +42 and -42, at mount height 30.0 m. Measured against 692 RAM terminal samples in the column over the Capitol footprint at 35/50/70/90 m: 100.0% single cover and 100.0% double cover. Builder's two ground pockets at (-34,-26)/(34,-26) measure 17.2% single and 0.0% double, and are inside the footprint+3 m buffer. Adversary's ground straddle at (0,-75)/(0,80) measures 48.6% single and 2.7% double. The best ground arrangement found anywhere — four quadrant corners at 3 m — reaches only 79.9%/65.2%. Two mounts on the wing roof at 20 m collapse to 22.0%.

*Why.* A 29 m building masks its own roof from any mount below it, so no number of ground pockets fixes this: Builder adds a second pocket to solve a problem that is vertical. The step between 22.0% at 20 m and 100.0% at 30 m is the 29 m attic, and clearing it is the whole decision. His own words are literal and were right — DD-121: 'An LPWS on the Capitol takes the incoming round.' Both colleagues read 'on the Capitol' as 'beside the Capitol' and both measured badly for it.

*Evidence.* MEASURED, /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/athena_vote/lpws.py and roof.py, over buildings[0] capitol (footprint x+/-88 y+/-55, heightM 29, the only source:'carried' confidence:'high' row). DD-121 seat map quoted verbatim at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3290-3296.


**Decision 6 — M-SHORAD IS REFUSED — it is in no law this repo holds** *(vote: majority; reversible by: "Here is the briefing" — attach it, and the inner ring can be sited on its word.)*

No M-SHORAD inner ring, and no M-SHORAD position of any kind. Builder's four corner mounts MSH-SW/SE/NW/NE are struck. The register's mix is Avenger seats, Sentinel pairs that cue, and one THAAD sector off the lawn (DD-118), extended by DD-119 with an LPWS seat for the incoming round. M-SHORAD appears in none of them.

*Why.* The M-SHORAD assignment comes solely from 'Shield in the Sky', which does not exist in this repository — I checked docs/asks/ and grepped the whole tree. Siting a fifth platform type on an unverifiable relay would write an unsourceable row into an append-only record, where a correction can only ever be another row. The repo already records this pattern: 'NOT PROVIDED, AND RECORDED AS SUCH: "Shield in the Sky."'

*Evidence.* Measured absence: docs/asks/ holds only 2026.10.19_The_Future_of_Drone_Swarms_AI-4-Defense.pdf for today's date; a repo-wide grep for 'Shield in the Sky' returns four unrelated Level-3 documents and the register's own note at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3454. The mix is DD-118 at :3111-3135; the LPWS seat is DD-119 at :3162-3200.


**Decision 7 — THE ARCS FACE OUTWARD — today every gun's optic points into a 92 m obstacle** *(vote: majority; reversible by: "Keep the Capitol in the picture" — then the home tilt stays on the dome and only the firing arc inverts.)*

Every gun's home azimuth is the outward radial from the rotunda, and the written Sector arc is centred on it. This reverses the current behaviour: restoreCapitolTurrets sets u.yaw=yawTo(0-u.x,0-u.z) with the comment 'face the ROTUNDA', and the record homes t-south at homeAz 0 (north, at the rotunda), t-west at 90 (east, at the rotunda), t-east at 270 (west, at the rotunda). All seven outward azimuths and their arcs are given in the seats decision above.

*Why.* An inward-facing ring points every optic at the thing it is defending and away from every approach. It is correct for a sightseeing standoff — which is exactly what CAP_RING was built as, and its own comment says so: 'The ring is a STANDOFF, not a plan' — and wrong for air defence. This is the single change that turns the existing ring into a defence, and it costs one line.

*Evidence.* frontend/public/drone-2525/play.html:1267 (yaw to rotunda) and the CAP_RING comment at :1256. Record homeAz 0/90/270 in turrets[] of docs/drone-2525/drone-2525.v00.00.json. Builder measured this independently and I verified both the line and the record values.


**Decision 8 — THE REQUIRED REACH IS 305 m, AND THE CONSTANT TO USE ALREADY EXISTS AT 340** *(vote: majority; reversible by: "Contacts come from the whole arena" — then the requirement is Adversary's 572 m and gimbal.rangeM must rise with it.)*

lockOn's 80 m cap on formless pops must lift. The measured requirement is 304.1 m — the farthest contact in the whole sampled set from its nearest gun, a 5 m-AGL contact on 15th Street. Raise the formless-pop cap to 340, the value the Range already uses for its own formed silhouettes two lines away, and apply the same number in asmTick. That covers 304.1 m with 36 m of margin and sits inside the record's gimbal.rangeM of 400. I do not adopt Adversary's 572 m.

*Why.* Prefer removing complexity over adding it: 340 is already a constant in this file for exactly this purpose, so the change introduces no new number. Adversary's 572 m comes from sampling out to the arena radius of 450 and requiring cross-map handover, but DD-119 says a contact 'pops on an avenue' and the avenues and the street box are all inside 305 m of a gun. 572 m would also exceed gimbal.rangeM 400, so the sight would be asked to lock past its own declared reach.

*Evidence.* frontend/public/drone-2525/play.html:2303 add(p,'pop',p,80) against :2300 and :2304 which both pass 340; asmTick repeats the cap at :2940 as bd<(best.form?340:80). gimbal.rangeM 400 in docs/drone-2525/drone-2525.v00.00.json. 304.1 m measured in /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/athena_vote/laydown.py. lockOn is free to change — frontend/tests/range-frozen.test.mjs:16.


**Decision 9 — SENTINEL x2, CUEING, NEVER A SEAT — and the mast numbers are DECLARED** *(vote: unanimous; reversible by: "Give me the real Sentinel numbers" — the mast height and range change and the pair re-solves.)*

A Sentinel pair at (-195,-35) and (210,-80) record frame, deck z +35 and +80, on 9 m masts. Measured union 96.6% of the sampled volume with 43.0% overlap, both sited behind the gun line and each within 80 m of an Avenger that can protect it. They cue and never wear a fire mode. Each needs a declared alternate position. The 9 m mast height and the 450 m sensor range are DECLARED, not sourced: the record's sensor block is only {profile:'pi-baseline'} with a note about edge-extraction budget, and carries no range or height field at all.

*Why.* DD-117 is explicit — sensors go in first, in pairs so pictures overlap, each site needing line of sight, a primary and an alternate, two ways in and out, and a weapon close enough to protect it. A pair is the doctrinal unit and the measurement supports it: no single lawn position covers the volume. Declaring the two numbers rather than implying them matters because a reader will otherwise take 9 m and 450 m for sourced values and build a gate on them.

*Evidence.* Pair search in /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/athena_vote/laydown.py. DD-117 Sentinel paragraph and 'Sensors go in first ... weapons second (FM 3-01, 4-73)' at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3026. 'Sentinel never wears a fire mode. It cues.' at :3300. The empty sensor block is in docs/drone-2525/drone-2525.v00.00.json.


**Decision 10 — THAAD AND PATRIOT GET A BEARING AND A FOOTPRINT, NOT A COORDINATE** *(vote: unanimous; reversible by: "Put a launcher on the map" — then it needs a coordinate and the arena must grow past 450 m.)*

The record row is at: null, axisDeg: 180, footprint: 'capitol', seat: 'missile', off the lawn. The named axis is Congress Avenue, the record's own roads entry congress [[0,-250],[0,-450]], which is bearing 180 — the same avenue the gun laydown is already weighted onto. No (x,y) is written for either. The question asked for a coordinate for every gun; two of them have none, and saying so is the answer.

*Why.* DD-118 is verbatim: 'One THAAD sector off the lawn, primary target line on the named axis, footprint over the Capitol.' Any coordinate inside radiusM 450 contradicts it, and DD-117 adds that THAAD 'does not belong on a 240 m ring around a building'. An arena 900 m across with maxAltitudeM 100 contains no volume either weapon can own. Writing a launcher position to fill a column in the table would be the same error he already caught on the count — filling a slot because the template has one.

*Evidence.* DD-118 at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3122-3127; DD-117 at :3041-3048. roads[6] congress [[0,-250],[0,-450]] and arena.radiusM 450 / maxAltitudeM 100 in docs/drone-2525/drone-2525.v00.00.json.


**Gates proposed:**
-
  - **rowId**: SITING_IS_ON_THE_RECORD
  - **holds**: Every gun, sensor and point-defence mount has a row carrying position, arc, class and reason, and the seven Avenger rows include t-south, t-west and t-east unchanged at their sourced coordinates.
  - **redToday**: docs/drone-2525/drone-2525.v00.00.json has no siting block at all and turrets[] holds exactly three entries, none of which carries an arc, a class or a reason — only id, label, at, heightM, homeAz, homeEl. The gate cannot find a single field it asserts on. DD-118 requires the record before a station moves: 'Record every position, its arc, and its reason before a station moves.'
-
  - **rowId**: EVERY_CONTACT_LOCKABLE_FROM_ITS_OWNER
  - **holds**: No contact assigned to a gun stands farther from it than the sight can lock, i.e. required reach 304.1 m is inside the formless-pop cap.
  - **redToday**: frontend/public/drone-2525/play.html:2303 caps formless pops at 80 m and asmTick repeats it at :2940. A lawn target must be formless or applyHit routes it into the frozen plate path, so 80 m binds. 304.1 m > 80 m, and the nearest of the seven to its own farthest contact fails by 224 m. Every one of the seven fails this today.
-
  - **rowId**: ARCS_FACE_OUTWARD
  - **holds**: Every gun's home azimuth equals its outward radial from the rotunda, within one degree.
  - **redToday**: frontend/public/drone-2525/play.html:1267 sets u.yaw=yawTo(0-u.x,0-u.z) — 'face the ROTUNDA' — for all 42, so every measured azimuth is exactly 180 degrees from its outward radial. The record agrees and is equally wrong: turrets[].homeAz is 0 for t-south, 90 for t-west, 270 for t-east, each pointing at the rotunda. The gate fails 42 times in the deck and 3 times in the record.
-
  - **rowId**: SECTOR_ARC_HAS_TWO_OWNERS
  - **holds**: Every bearing of the ring lies inside the written Sector arc of at least two guns, so Sector mode cannot open a seam when one is lost.
  - **redToday**: No arc is written anywhere — not in play.html, not in the record. With only the three sourced stations the outward bearings are 90/180/270 and the largest neighbour gap is 180.0 degrees, so no half-sector under 180 degrees gives two owners on the north bearing. DD-121's Sector row ('Fire only inside the arc written for that gun') has nothing to read.
-
  - **rowId**: NO_GUN_STANDS_IN_THE_STREET
  - **holds**: No mount lies outside the street box — |x| <= 230 (Colorado/Brazos), -250 <= y <= 300 (11th/15th) — and every mount clears each building footprint by 6 m and each tree canopy by 3 m.
  - **redToday**: Re-homed at CAP_RING=240 (play.html:1256, :1267), eight of the forty-two land outside Colorado and Brazos: T10 (234.0,-53.4), T11 (239.3,-17.9), T12 (239.3,17.9), T13 (234.0,53.4), T31 (-234.0,53.4), T32 (-239.3,17.9), T33 (-239.3,-17.9), T34 (-234.0,-53.4) — 4.0 to 9.3 m into a public street against roads[] colorado/brazos at x = -/+230.
-
  - **rowId**: LPWS_CLEARS_THE_ATTIC
  - **holds**: Each LPWS mount stands at least 30.0 m above local ground, clearing the Capitol's 29 m attic, and the pair double-covers 100% of the RAM terminal column over the footprint.
  - **redToday**: No LPWS exists in the deck or in the record — platforms[] in docs/drone-2525/drone-2525.v00.00.json lists T1, D1Q, D1, D1F, M99, M66, ARK, R2 and no point-defence mount of any kind. There is no mount to measure a height on, so the assertion has no subject. Measured for reference: any mount at 20 m sees 22.0% of that column; the gate would also fail every ground siting proposed by either colleague (17.2% and 48.6%).
-
  - **rowId**: SENTINEL_NEVER_WEARS_A_FIRE_MODE
  - **holds**: A Sentinel row may carry Cue and Hold and nothing else; offering it Single, Shoot-look-shoot, Ripple, Salvo, Sector or Layer is refused.
  - **redToday**: No Sentinel exists and no fire-mode field exists on any unit: the 42 are created at play.html:909-913 with kind:'turret' and no mode attribute, and no code path distinguishes a cueing sensor from a shooting seat. Nothing can refuse a mode that nothing stores. DD-121: 'Sentinel never wears a fire mode. It cues.'
-
  - **rowId**: MARKS_PERSIST_OFF_THE_RANGE
  - **holds**: TARGET, APPROVE and FIRE are recorded per gun on the lawn, so a shot without a named approval does not score.
  - **redToday**: frontend/public/drone-2525/play.html:2722 — marksPersist() returns chNum()===0 && !(state.lobby && state.lobby.phase==='LIVE'). Off the Range and in a LIVE room it is false, so no mark is kept: the lit button, the recital and the amber silhouette are all dead on the lawn. 'Target all, then approve all, then fire all' across seven guns is impossible today, and the authority invariant — 'a named human decision exists before any machine shot' — has no store.

**Dissent.** NOT UNANIMOUS — three genuine splits, and I overrode both colleagues twice.

UNANIMOUS (all three, independently measured): "Shield in the Sky" is absent from this repository, so its ring law and its layered assignment are unverifiable in-repo; the 42 deck units are re-homed and never rebuilt, which restoreCapitolTurrets permits because it is off the frozen list (range-frozen.test.mjs:16); THAAD and Patriot get a bearing and a footprint, not a coordinate; the three sourced stations alone fail resilience; Sentinel is a pair that cues and is never a seat.

MAJORITY — ATHENA + ADVERSARY, against BUILDER, on M-SHORAD. Builder sites four M-SHORAD on the lawn corners. The register's mix (DD-118:3111-3135) names Avenger, Sentinel and one THAAD sector only; DD-119 adds LPWS. M-SHORAD appears nowhere in it, and its only source is the missing briefing. Struck.

MAJORITY — ATHENA + ADVERSARY, against BUILDER, on the defended asset. Builder invented a fuel farm at (180,-185), an ATP at (-195,-150) and a maintenance cluster at (0,+255), and three of his eight guns are pulled to their coordinates by those three invented points. DD-117 is explicit: "the Capitol is the defended asset. It is not a target." Builder's own open question concedes the point and says his eight collapse to six without them.

MAJORITY — ATHENA + BUILDER, Adversary silent, on arc direction. Builder's finding that play.html:1267 faces every optic at the rotunda is correct, I verified it, and the record's homeAz 0/90/270 repeats the error. Adversary did not address it, which is the one real omission in an otherwise strong brief.

NUMERIC COINCIDENCE, NOT AGREEMENT — Adversary and I both land on seven guns. We agree on no coordinate. His seven come from a uniform 324-point bearing sweep; mine come from an avenue-weighted sample plus the Sector-arc constraint. He moves all three sourced stations; I keep all three verbatim. Reporting this as agreement would be reporting unanimity I did not have.

SUMMARIZER-OVERRIDE 1 — THE SAMPLE. I override both. Builder sampled a 404-point street-box screen; Adversary a 324-point uniform bearing sweep. A uniform sample derives a ring by construction, and both duly produced near-even rings (Builder's eight at ~45-degree spacing, Adversary's seven at ~51). DD-118 says the ring is the balanced-fires case and "the default that gets designed first is the weighted avenues, not a new circle of 42". Running the identical code on the identical geometry, a uniform objective returns 8 positions and an avenue-weighted objective returns 6 — the sample, not the ground, was deciding their answers.

SUMMARIZER-OVERRIDE 2 — THE LPWS. I override both, and this one is a measurement, not a reading. Builder's two ground pockets at (-34,-26)/(34,-26) cover 17.2% of the RAM column single and 0.0% double, and sit inside the footprint buffer. Adversary's ground straddle at (0,-75)/(0,80) covers 48.6% and 2.7%. Builder diagnosed the masking correctly and then answered it horizontally, adding a second pocket to a vertical problem. Two mounts on the attic at 30 m cover 100% and 100%; at 20 m they collapse to 22.0%. The step is the 29 m attic, and DD-121's words were literal: "An LPWS on the Capitol."

CORRECTION TO BUILDER, ON HIS OWN EVIDENCE. His claim that "three of its forty-two creation points are inside the Capitol's own footprint" is refuted: zero against the record footprint (x+/-88, y+/-55) and zero against the deck's CAP_FP. His companion claim that eight of the re-homed forty-two stand in the street is CONFIRMED exactly — T10-T13 and T31-T34 at |x| 234.0-239.3.

UNRESOLVED BETWEEN THE RECORD AND THE DECK. The record's capitol is x+/-88, y+/-55, heightM 29; the deck's is EW 86.33, NS 44.04, COREY 26 (play.html:1301). They disagree by 11.0 m on the north-south half-span and 3 m on the core height. Builder measured against the deck, Adversary against the record, and neither flagged it. Every arc and every masking figure in this package rests on the record, because the record is where the siting must be written — but one of the two must win before an arc is frozen.


**Gaps (his word only):**
- DD-124 IS NOT IN THE REGISTER AND THEREFORE BINDS NOTHING YET. docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md ends at DD-123 (line 3384 of 3458); HEAD is b7e1a304e 'Persist DD-123'. The five-rung ladder, the seat map's THAAD/Patriot rows and the Real-World lock quoted in today's task exist only in the task text. Persist DD-124 as its own commit before any gate cites it — the Sector-mode constraint that drives my count comes from DD-121, which IS in the register, so the seven survive either way.
- LEAK STILL HAS NO DEFINITION FROM HIM. It is named as an Advance scenario and as the thing the inner ring exists for, but nothing says what makes a contact a leaker rather than a missed track — a bearing, a range band, a time past a line, or a gun that failed to fire. Until he says, no gate can score it and the 'inner ring for leakers' assignment cannot be tested.
- THE SENTINEL'S 9 m MAST AND 450 m RANGE ARE DECLARED, NOT SOURCED. The record's sensor block is only {profile:'pi-baseline'} with a note about edge-extraction budget — no range field, no height field. Both numbers are mine. The pair's 96.6% union moves if either changes, and a gate written on them today would be gating a guess.
- THIRTEEN OF FOURTEEN BUILDINGS AND THE WHOLE 9x9 DEM ARE confidence:'low' / hand-authored. Only buildings[0] capitol is source:'carried', confidence:'high'. price-daniel and clark create the west masking that shapes AVG-2's value, and the DEM sets every ground height in every line-of-sight test here. The record itself names the remedy: scripts/security-2525/build_dem.py capitol-lawn --dataset ned10m. Either re-source first, or record each position with its low-confidence dependency named on its own row.
- EW IS IN HIS SOURCE AND NOT IN HIS LADDER. The white paper puts a spoof package degrading swarm cohesion into the fight, and FM 3-12 is named in the back matter for the first time in this project, but no rung, no seat and no fire mode carries it. A siting cannot place an EW emitter until it is decided whether EW is a seat, a mode, or a condition on the track.
- WHETHER REAL-WORLD'S SWARM IS NINE OR FORTY-TWO. The paper says 'three groups of three X-BAT drones (nine total)'; the record's swarm block says total 42, perSide 21, with a pass mark of '42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times'. Seven guns at 100% avenue double-cover answer nine comfortably; forty-two simultaneous tracks across seven seats is a different problem and may change the count.

### Enlil (GROUND)

**Invariant.** A man alone at one station on the Capitol lawn can TARGET, then APPROVE, then FIRE every target standing in front of him, and his hits, misses, rounds spent and time are stored when he is done — while the Range he left is byte-for-byte the Range he returns to.


**Decision 1 — The lawn's targets live in a NEW `var LAWN=[]`, never in `pops` — I override both colleagues and the brief** *(vote: summarizer-override; reversible by: "put the lawn targets on the map" — then LAWN is folded back into `pops` and drawMap is re-pinned in the same commit.)*

Append `var LAWN=[];` and `function lawnPops(){ return capLawn()?LAWN:[]; }` at the end of inline script #1 and wire them ONLY into free spans. Do not grow `const pops` at play.html:917 and do not edit it. The brief says "a lawn target is a member of the existing pops array"; Specialist 1 agrees and adds a spawn-side repair; Specialist 2 proposes a separate array but then lists `drawMap` :2039/:2049 among the "FREE pools" it must join — and drawMap is movedSpans-pinned, so his own plan moves a frozen span. The consequence I accept and declare: lawn targets are NOT drawn on the overhead map. That is also right on the merits — the map is the 42-station menu (DD-43/45/46/47), and at the Capital's locked zoom 0.55 the map scale is focalPx·z/(2400/z) = 0.7615·z² = 0.230 px/m, so a 50 m target projects ~11.5 px from its own station marker, well inside pickMap's 80 px grab. Reversible in one word if he wants them on the map.

*Why.* `pops` is read by FOUR frozen spans, not the two the brief implies, and three of them are hostile. Neither colleague found the worst one: `goRange` :6073 does `pops.forEach((p,i)=>{ p.up=!!RANGE_WAVE.pops[i]; })` — an INDEX-COUPLED read of pops.length. `stashRangeWave` :6071 snapshots `pops.map(p=>!!p.up)` and only arms at chNum()===0, i.e. with 8 entries, so every index ≥ 8 restores `undefined` → `up=false`: one trip to the Range silently knocks down every lawn target, and the repair site is inside a pinned span. A separate array is read by nothing frozen, so no guard is needed in frozen ground at all — which is also the lower-complexity answer his law prefers.

*Evidence.* Owner probe over the gate's own extractor (frontend/tests/range-frozen.test.mjs:32-35) across every `pops` reference: FROZEN* goRange :6073 · FROZEN* drawMap :2039,:2049 · FROZEN pickMap :2005 · FROZEN applyMode :2921; free: spawn :2952/:2959/:2995, candidates :2531-2532, slots :2563, drawTargets :2184, lockOn :2303, findTgt :2321, kindOfRef :2327, mistOn :2567, peerDesig :2603, asmTick :2926. play.html:6071 stashRangeWave · :6073 goRange restore · :2921 `pops.forEach(p=>p.up=false)` · :2005 `[...pops,...drones,...doors]` after the turret pass with bd carried from 80 px. frontend/tests/range-spans.json: movedSpans = goRange, mapCam, drawMap, movedPinnedAt 216.


**Decision 2 — ZERO frozen spans move — the do-not-touch list, where new code goes, and the measured proof** *(vote: unanimous; reversible by: "re-pin the span" — a deliberate frozen change updates tests/range-spans.json in the same commit, which is the gate's own escape hatch.)*

Target and result: ZERO. DO NOT TOUCH, by name: FROZEN in tests/range-spans.json (100 pinned at r.207) — `pickMap` :1990, `applyMode` :2903, `enterTheRange` :5879, `platesHere` :1247, `plateBase` :1168, `plateRect`, `plateDims`, `rangeTick`, `magSpend` :960, `magLoad` :961, `magReload` :972, `magCap`, `chNum` :778, `qWorld`, `LANES`, `PLATES`, `lanesInView`, `seatLane`, `buildRange`, `startLight`, `qualLamp`, `paintTimer`. FROZEN under `movedSpans` (re-pinned at r.216, gated identically by range-frozen.test.mjs:72-79) — `goRange` :6072, `mapCam` :1982, `drawMap` :2012. Every new top-level definition goes at the END of inline script #1 (script bounds :775–:6723), after the last top-level declaration `lookToggle` :6673, and MUST be a hoisted `function` or `var`, never const/let.

*Why.* range-frozen hashes each span from its own column-0 declaration to the START of the next column-0 declaration, so an edit changes exactly the hash of the span whose text region contains it. Appending after :6673 perturbs only `lookToggle`'s hash, which is not pinned. The const/let rule is not folklore: `toolSelfTest` is defined at :4276 and CALLED at :5684, above the insertion point, so a const there is in its temporal dead zone at boot — the deck records this hazard twice in its own source and it already cost one deck that never finished booting.

*Evidence.* I applied all 27 edits to an in-memory copy and re-ran the gate's own `spansOf` extractor plus the throwing regexes of range-2525.test.mjs and the drone-playable text pins: `FROZEN(spans) MISSING: 0 / FROZEN(spans) MOVED: 0 / FROZEN(movedSpans) MOVED: 0 / range-2525 TEXT PINS LACKING: 0 / spawn driver line intact: true / bytes: 1,190,849` against FILE_BUDGET 7,770,000; `node --check` on the extracted inline script #1 returns clean. Script bounds measured at play.html:775 and :6723; lookToggle :6673; the deck's own warnings at :6070 (`var RANGE_WAVE=null; /* VAR, not let ... */`) and :6115.


**Decision 3 — The 80 m cap becomes one hoisted `capReach(o)`, called from a NEW line beside :2303 and in place at :2940** *(vote: unanimous; reversible by: "the lawn reaches only N metres" — one number in capReach.)*

Append `function capReach(o){ if(o&&o.sil) return 340; if(o&&o.form) return 340; return 80; }`. In lockOn, do NOT edit play.html:2303 at all — append one line after it: `lawnPops().forEach(p=>{ if(!p.up||p.lifePct<=0) return; add(p,'pop',p,capReach(p)); });`. In asmTick, replace `bd<(best.form?340:80)` at :2940 with `bd<capReach(best)`. 340 is the Range's own existing reach at :2300/:2304, reused rather than invented; the bare 80 survives untouched for the eight shared door-pops.

*Why.* Both literals are unique in the file, both owners are free (lockOn :2289, asmTick :2924), and leaving :2303 byte-identical means even the residual non-turret CH0 path through it is provably unchanged. Specialist 2 is right that :2303 is unreachable from a Range turret seat — :2299's block ends with an unconditional `return pipNearest(cand,c,W,H);` on :2300 — which is the DD-35 proof that nothing on the Range can see this change; appending rather than editing makes that proof trivial instead of argued.

*Evidence.* play.html:2303 `pops.forEach(p=>{ if(!p.up) return; add(p,'pop',p,80); });` (1 occurrence); :2940 `bd<(best.form?340:80)` (1 occurrence); :2299-2300 the turret-seat early return; :2300/:2304 the Range's own 340. Owner probe: lockOn free, asmTick free. No test in frontend/tests matches either cap, so the reach has no gate today and one must be written RED first.


**Decision 4 — The precedence defect closes at play.html:4039, not by widening lockOn** *(vote: majority; reversible by: "the tap may take anything I can see" — drop the guard at :4039.)*

Add the reach guard to the TAP door, not only the BUTTON door: at pcTargetApprove :4039, `if(obj)` becomes `if(obj&&capInReach(obj.ref))`. Separately, in `candidates()` :2531-2532 the pops branches filter on `p.up` ALONE while the plate branches filter `lifePct>0` — add `&&p.lifePct>0` to both so a dead silhouette is not tappable.

*Why.* The two doors disagree because they take different routes. `#fTgt.onclick` :5829 is `markLock(lockOn(),'BTN')`, so the button inherits lockOn's cap; a tap goes mouseAim → pickNear :2535 (a 56 PIXEL radius, no world-metre cap at all) → pcTargetApprove :4039, which calls `designate(...)` directly and never consults lockOn. That is why a tapped lawn pop at 222.3 m locked while the TARGET button refused it — a precedence defect in the fallback, exactly as today's 14-agent assessment found, not a reach limit. Fixing only the cap would make the button accept 340 m and leave the tap accepting anything on screen at any distance.

*Evidence.* play.html:5829 `if(_ft)_ft.onclick=()=>{ state.slot=state.slot||1; markLock(lockOn(),'BTN'); };` · :4035-4039 pcTargetApprove, line :4039 `if(obj){ state.slot=state.slot||1; designate({id:obj.id,kind:obj.kind,ref:obj.ref},SID); return 'target'; }` · :2537 `let best=null,bd=56;` · :2531-2532 `pops.filter(p=>p.up)` with no lifePct test beside `platesHere().filter(q=>q.up&&(q.fall||0)<0.25&&q.lifePct>0)`. Owners pcTargetApprove and candidates both free.


**Decision 5 — marksPersist is FOUR edits, not one — Specialist 2 is right and Specialist 1 missed a safety regression** *(vote: majority; reversible by: "marks do not persist on the lawn" — revert :2722 and the lawn falls back to per-shot approval.)*

Widen the body at :2722 to `return (chNum()===0||capLawn())&&!(state.lobby&&state.lobby.phase==='LIVE');` AND substitute the three occurrences of `platesHere().some(p=>p.id===state.desig.id)` (approveDesig :2643 and :2646, fireN :2736) with `markPool().some(...)`, and the recital's `lk.ref.lane===(state.lane||0)` (hudPhase :3147) with `laneOk(lk.ref)`. Add hoisted `markPool()` and `laneOk(r)` with the new definitions.

*Why.* Four of the fourteen call sites carry a SECOND Range-only condition the body does not reach. `platesHere()` is `PLATES.filter(q=>q.lane===(state.lane||0))` at :1247 and is FROZEN; a formless lawn target has no `lane`, so `.some(...)` is false and the recital's `undefined===0` is false. Widening :2722 alone therefore lights the button, leaves the recital printing nothing — and, worse, silently stops the two NOT_MARKED HOLD guards at :2643 and :2736 from firing. That is a safety regression against his law that a shot with no approval does not score, not a cosmetic miss. Specialist 1's package does not mention these four sites at all.

*Evidence.* play.html:2722 (body, free, no test pins it — grep for `chNum()===0&&!(state.lobby` over frontend/tests returns nothing); :2643, :2646 (owner approveDesig, free), :2736 (owner fireN, free), :3147 (owner hudPhase, free); :1247 platesHere, FROZEN. The CALL SITES at :1082 and :2641 are pinned by drone-playable.test.mjs:153-154 and my simulation confirms both pins survive untouched.


**Decision 6 — The hit test goes scale-true by editing play.html:2700 — I override Specialist 2, whose fix edits a pinned line** *(vote: summarizer-override; reversible by: "a lawn hit is just the pip" — drop silHit and `ph` returns null again.)*

Change :2700 to `const ph=isPlate?plateHit(ref):(ref&&ref.sil?silHit(ref):null);` and leave :2701 BYTE-IDENTICAL. Add hoisted `silRect(o)` (mirroring plateRect's shape, with the existing angular floor `pipFloorPx()`) and `silHit(o)` returning `{hit,band}`. Do not touch :2701.

*Why.* play.html:2701 `const hit=!!state.simDirect || (ph?ph.hit:off<32);` is pinned VERBATIM by drone-playable.test.mjs:40. Specialist 2 correctly diagnoses the defect — a formless lawn target has no plateHit, so every lawn shot resolves on a flat 32-pixel bubble, identical at 50 m and at 300 m at the Capital's single locked zoom 0.55, so the ladder has no difficulty gradient and DD-124's hits and misses record a number with no skill in it. But his fix is "route the non-plate branch through silRect and change the test line plus its sentence in the same commit" — that edits the pinned line for no reason. Making `ph` resolve one line earlier takes the same scale-true branch with zero change to the pin, and makes the gate's own prose ("inside its projected outline (scale-true)") more true rather than requiring it to be rewritten.

*Evidence.* play.html:2700 `const ph=isPlate?plateHit(ref):null; state.lastBand=ph?ph.band:'';` (owner applyHit, free, unpinned) · :2701 (pinned at frontend/tests/drone-playable.test.mjs:40) · :2694 `const isPlate=!!(ref&&ref.id&&String(ref.id).charAt(0)==='C'&&ref.form&&typeof plateHit==='function');` · :2672 pipOff returns pixels. My simulation applies exactly this edit and reports the :40 pin intact.


**Decision 7 — `life:1e9` is only safe with the down-state edits in the same commit** *(vote: unanimous; reversible by: "the lawn targets expire like the Range's" — set a finite life and the reaper does the work.)*

Three edits, all inside the free `applyHit`: :2703 `if(!isPlate) ref.up=true;` → `if(!isPlate&&!ref.sil) ref.up=true;`. Plus the `lifePct>0` filters already named for candidates :2531-2532 and carried into the new lockOn and slots lines. A lawn target is created with `up:true, lifePct:100, life:1e9` and goes DOWN on a hit; whether it stands again is the drill's business (D-50's three programmes), read off the existing free `modeReturns()` :2723, never a new clock.

*Why.* applyHit's non-plate branch explicitly re-raises a hit target. Today the 5–9 s expiry at :2964 (`idle.life=4+g`) hides it: the reaper at :2995 pulls it down before anyone notices. Set `life:1e9` without this and a hit lawn silhouette stays drawn (drawTargets :2184 tests `p.up` alone), stays lockable, stays re-markable — the magazine empties into a corpse and DD-124's hits and misses are both wrong. Both colleagues found this independently and both are right; it is the single most likely way this build ships broken.

*Evidence.* play.html:2703 `else {ref.lifePct=0;ref.fall=0.05;ref.mist=false; if(!isPlate) ref.up=true;}` · :2995 `pops.forEach(p=>{if(p.up){p.life-=dt;if(p.life<=0){p.up=false; ...}}});` · :2964 `idle.life=4+g` · :2184 draws on `p.up` · :2300/:2304 filter lifePct, :2303 does not · :2723 modeReturns, free.


**Decision 8 — Three widenings the Range never enters: drawTargets :2184, slotBoxes :2231, plateWord :2690** *(vote: unanimous; reversible by: "draw the lawn targets like the Range's pops" — drop capSilMesh and reuse the box.)*

drawTargets — do NOT edit the existing pops line; APPEND a `lawnPops().forEach(...)` line after it that draws `capSilMesh(p)` coloured by the existing free `phaseCol(p,…)` :2252, so a lawn silhouette obeys r.205's ONE PAINTER amber/red law exactly as a plate does. slotBoxes :2231 — `const isP=!!o.form;` becomes `!!o.form||!!o.sil` and the dims come from `o.sil` when present. plateWord :2690 — add an early `{ const L=capWord(id); if(L) return L; }` BEFORE the existing `plateBase` call (plateBase :1168 is FROZEN and is only read, never changed). Lawn ids are `L<nn>-<range><LCR>` — a non-'C' first character AND no `form`, belt and braces.

*Why.* applyHit :2694 makes `isPlate` from `id[0]==='C' && ref.form`, so either a C-prefix or a form would route the Capital into the frozen plate engine (rangeRun, plateRect, qWorld, LANES[q.lane]) — the Range scoring the lawn, the exact inverse of DD-35. The Range never enters any of the three new branches because `sil` exists on no plate and `capWord` returns null for every `C-…` id. Appending rather than editing the drawTargets line also keeps the pinned substring `bullseye(p.x,p.y+1.2,p.z,segs,fine)` byte-exact. slotBoxes is not cosmetic: a 0.495 × 1.016 m E silhouette at 300 m currently takes the 3.4 × 3.8 × 3.4 m literals — a box 3.7× too wide to mean anything.

*Evidence.* play.html:2184 (pinned as a substring by drone-playable.test.mjs:32 — simulation confirms it survives) · :2230-2231 slotBoxes `const isP=!!o.form; const D=isP?plateDims(o):{w:0,h:0};` with the `3.4 / 3.8 / 3.4` literals · :2690 plateWord · :1168 plateBase FROZEN · :2252 phaseCol free · :2694 isPlate. Owners drawTargets, slotBoxes, plateWord all free.


**Decision 9 — The three teleport traps, #plat, and the ?map= / ?station= reader — four guards and one new hoisted router** *(vote: unanimous; reversible by: "RESTART on the lawn should take me back to the Range" — drop the capReset early return from that one handler.)*

RESTART: `_rr.onclick` :6030 → add `if(capLawn()){ capReset('BUTTON'); return; }` at the head. TARGETS: the `tgtPick.onchange` block :6034 → same shape. MODE: `_rm.onchange` :6036 → same shape. All three leave `rangeResetOnRecord` :6021 and `goRange` :6072 byte-identical. #plat: at v13 :3967, `state.mode=(mp&&mp.value)||state.mode;` becomes `if(!capLawn()) state.mode=…`. The query reader does NOT go beside the existing one — append `function capRoute(){ … }` plus a bare `capRoute();` at the end of script #1; it requires the literal `map=capital`, clamps station to 1..42, calls the free `pickScenario('lawn')` :6104 and `jumpToTurret(…)` :2817, and refuses to open Real-World on an empty record.

*Why.* All four handler owners are free (rangeResetOnRecord :6021, _rr :6026, _rm :6031, v13 :3961), so the fix never enters goRange. #plat's mechanism is subtler than "kills lawn targets": `pickScenario('lawn')` deliberately leaves `state.mode='capital'` while writing `'lawn'` into the select at :6108, so any aircraft pick copies the string `'lawn'` into state.mode, and spawn's `cap=state.mode==='capital'||state.mode==='turret'` at :2951 does not recognise it — the lawn goes silently dead. Specialist 1 found this mechanism and is right. For the router, both colleagues are right that the obvious edit is the forbidden one: play.html:5928-5929 sit inside the FROZEN `enterTheRange` span (:5879 → the next top-level declaration `const CIN` at :5934), so adding a sibling branch there moves a frozen hash. capRoute runs after that IIFE, so ?station= can override ?range= cleanly.

*Evidence.* play.html:6030, :6034, :6036, :6021, :3967, :6108, :2951, :6104, :2817; :5928-5929 inside enterTheRange :5879, next decl `const CIN` :5934 — owner probe says enterTheRange FROZEN. ZERO readers exist today: `grep -c "get('map')|get('station')"` over play.html returns 0, while shareUrl :9031 writes `?map=capital&station=…` and its own comment at :9030 says "The ?map= reader lands with the ladder (r.211)". Note the brief's "role=drone is hardcoded at :5884" is wrong — :5884 is `state._selCraft='turret'`; there is no `role=drone` in the file and nothing reads `role` at all.


**Decision 10 — His four metrics, and the siting: the seated station only, counted in fireN — never in the frozen magSpend** *(vote: majority; reversible by: "populate every station" — drop the `LAWN._seat===state.unit` key in capEnsureTargets.)*

Four edits for DD-124's four metrics, all in free spans: applyHit :2704 `if(isPlate){ … rangeHit/rangeMiss … }` → `if(isPlate||(ref&&ref.sil)){ … }`; hudScore :2682 gains a `capLawn()` branch printing HIT · MISS · ROUNDS · time; rounds spent is incremented at fireN's TWO `magSpend()` call sites :2762 and :2768; the clock runs from one `capTick(dt)` call placed at the top of `spawn` :2949, immediately above the pinned rangeTick driver line. For the siting: `capEnsureTargets()` populates the SEATED station only (18 targets max), keyed on `state.unit`, with per-bearing depth — the 42 units stay as the map menu; only the sited stations are playable.

*Why.* DD-124 is verbatim: "hits, misses, rounds spent, and time. The magazine picture has to match the rounds. A run with no metrics does not count." On today's bytes three of the four are not merely unshown — they are not computed: applyHit guards both counters on `isPlate`, and hudScore prints HIT/MISS only when `chNum()===0` and `BLU/RED` otherwise, so ten rounds on the lawn leave all four at zero and every lawn run is void by construction. Rounds spent must NOT be counted inside `magSpend` :960 — it is FROZEN; its only two callers are in the free `fireN`. On the siting, his law binds: "the count of guns is an output of the siting, never an input", and the append-only record sources THREE turrets, not 42. Populating the seated station only is correct under either answer to the standoff question and is the smaller change.

*Evidence.* DD-124 verbatim in docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md (origin/main, commit 16a4114ee) · play.html:2704, :2682 (owner hudScore, free), :2762/:2768 (owner fireN, free), :960 magSpend FROZEN (its only two callers are in fireN — measured), :2949 spawn free with the pinned driver at :2986 left byte-exact. Siting measured from docs/drone-2525/drone-2525.v00.00.json: capitol footprint south face at y=−55, wings at x=±88; turrets[] = t-south [0,−210], t-west [−210,0], t-east [210,0]; arena.radiusM 450. At CAP_RING=240 (play.html:1256, :1267) clear ground is 240−55 = 185 m south and 240−88 = 152 m on the wing axes.


**Gates proposed:**
-
  - **rowId**: BUTTON_AND_TAP_AGREE_ON_REACH
  - **holds**: The TARGET button and a screen tap accept exactly the same lawn target at the same distance: both return the same id, or both return nothing.
  - **redToday**: Seat T01 on the lawn and raise a silhouette at 150 m. The tap door (mouseAim → pickNear :2537, a 56 PIXEL radius with no world-metre cap → pcTargetApprove :4039, which calls designate directly) marks it. The button door (_ft.onclick :5829 → markLock(lockOn(),'BTN') → the pops line :2303 `add(p,'pop',p,80)`) returns null because 150 > 80. The two doors disagree on r.216's bytes; the assertion `lockOn().id === pickNear(cx,cy).id` throws.
-
  - **rowId**: THE_LAWN_IS_NOT_THE_RANGES_POOL
  - **holds**: No lawn target ever appears in candidates(), slots() or pickMap() while chNum()===0.
  - **redToday**: On r.216's bytes, push 18 standing members onto `pops` and call goRange(): candidates() :2531-2532 unconditionally concats `pops.filter(p=>p.up)` and slots() :2563 unconditionally runs `pops.forEach(p=>{ if(p.up) put(p,p); })`, so candidates().length exceeds the platesHere() count by 18 and T1/T2/T3 fill with lawn ids. pickMap :2005 additionally iterates `[...pops,...drones,...doors]` after the turret pass with bd carried from 80 px, and pickMap is FROZEN so it cannot be guarded at source.
-
  - **rowId**: A_LAWN_TARGET_SURVIVES_A_TRIP_TO_THE_RANGE
  - **holds**: Standing lawn targets are unchanged by goRange() and applyMode() — the lawn is still there when he comes back.
  - **redToday**: goRange :6073 runs `pops.forEach((p,i)=>{ p.up=!!RANGE_WAVE.pops[i]; })` while stashRangeWave :6071 only arms at chNum()===0 and snapshots an 8-element array, so every index ≥ 8 restores `undefined` → up=false. applyMode :2921 additionally runs `pops.forEach(p=>p.up=false)`. Both spans are frozen. On r.216's bytes: grow pops to 26, enter the lawn, press SCEN · RANGE, and all 18 lawn members come back down.
-
  - **rowId**: A_HIT_LAWN_SILHOUETTE_GOES_DOWN
  - **holds**: After a hit, a lawn silhouette is neither drawn, nor lockable, nor re-markable.
  - **redToday**: applyHit :2703 is `else {ref.lifePct=0;ref.fall=0.05;ref.mist=false; if(!isPlate) ref.up=true;}` — a hit non-plate stays UP with lifePct 0. drawTargets :2184 draws on `p.up` alone; lockOn's pops line :2303 filters only `!p.up` while the plate lines :2300 and :2304 both filter `lifePct<=0`. Today the 5–9 s `idle.life=4+g` at :2964 and the reaper at :2995 hide it; set life:1e9 on r.216's bytes and the same silhouette is hittable forever.
-
  - **rowId**: THE_LAWN_STORES_HIS_FOUR_METRICS
  - **holds**: A finished lawn run has hits, misses, rounds spent and time stored, and the magazine picture matches the rounds spent.
  - **redToday**: applyHit :2704 is `if(isPlate){ if(hit) state.rangeHit=…+1; else state.rangeMiss=…+1; }` — a lawn target is not a plate, so neither counter moves. hudScore :2682 prints HIT/MISS only on the `chNum()===0` branch and `BLU … RED …` otherwise. No capRounds and no lawn clock exist anywhere in the file. Fire ten approved rounds on the lawn today and all four of DD-124's metrics read zero, so the run "does not count" by his own words.
-
  - **rowId**: THE_LAWN_SCORES_ITSELF_NEVER_THE_RANGE
  - **holds**: No lawn target is ever routed into rangeRun, plateRect, qWorld or LANES: every lawn target has a `sil`, no `form`, and an id whose first character is not 'C'.
  - **redToday**: Nothing in frontend/tests asserts either half of this rule. Give a lawn target `id:'C-150L'` and `form:'E'` on r.216's bytes and applyHit :2694 computes isPlate true, calls `rangeRun(ref.lane||0)` with lane undefined → lane 0, and scores the Capital through the Range's frozen engine — and every existing gate stays green. The DD-35 defence for the lawn is purely verbal today.
-
  - **rowId**: THE_BOX_FITS_THE_SILHOUETTE
  - **holds**: A marked lawn target's voxel box is its own size, within 20% on each axis.
  - **redToday**: slotBoxes :2231 is `const isP=!!o.form; const D=isP?plateDims(o):{w:0,h:0};` and the push then uses the literals 3.4 / 3.8 / 3.4 for anything formless. A 0.495 × 1.016 m E silhouette at 300 m therefore gets a 3.4 m wide box — 6.9× its width and 3.7× its height. Mark one on r.216's bytes and slotBoxes()[0].s measures 3.4, not 0.495.
-
  - **rowId**: MAP_AND_STATION_OPEN_THE_LAWN
  - **holds**: `?map=capital&station=NN` opens the Capital at station NN, and no link, menu or query string opens Real-World on an empty record.
  - **redToday**: `grep -c "get('map')|get('station')"` over play.html returns 0 — the two query readers are isDiag :1088 and the boot IIFE :5928-5929, and neither looks at `map` or `station`. shareUrl :9031 WRITES `?map=capital&station=…` and the deck's own comment at :9030 says "The ?map= reader lands with the ladder (r.211)". So a shared lawn link opens the Range today, and the DD-124 Real-World lock has no mechanical defence at all.

**Dissent.** THREE REAL DISAGREEMENTS, two of which I resolve against both colleagues.

(1) WHERE THE LAWN TARGETS LIVE — summarizer-override, and the only one that changes the shape of the build. The brief and Specialist 1 say a member of `pops`; Specialist 2 says a separate array but then names `drawMap` :2039/:2049 among the "FREE pools" it must join, and drawMap is movedSpans-pinned, so his own plan moves a frozen span. I override both with a separate `LAWN` array that is NOT drawn on the map. My reason is a fourth frozen reader of `pops` that neither found: `goRange` :6073 `pops.forEach((p,i)=>{ p.up=!!RANGE_WAVE.pops[i]; })` is index-coupled to `pops.length`, and `stashRangeWave` :6071 only ever snapshots 8 entries, so every lawn member silently falls on any return to the Range — inside a pinned span. An engineer can check this by growing pops on r.216's bytes and calling goRange(). Specialist 1's answer to the applyMode knockdown (re-assert up=true from spawn each tick) is a repair-after-damage pattern that cannot touch pickMap at all; under the separate array it is simply unnecessary, which is also the lower-complexity answer his law prefers.

(2) THE SCALE-TRUE HIT TEST — summarizer-override on Specialist 2's FIX while adopting his DIAGNOSIS. He is right that :2701's flat 32-pixel bubble leaves the whole 50–300 m ladder equally easy at the Capital's locked zoom 0.55, so DD-124's hits and misses would record a number with no skill in it. But his fix edits :2701, which drone-playable.test.mjs:40 pins verbatim, and then rewrites the gate's sentence to suit. Editing :2700 instead — making `ph` resolve through a new `silHit` — takes the identical branch with zero change to the pinned line. My simulation applies exactly this and the pin survives.

(3) WHAT IS ACTUALLY FROZEN — majority with Specialist 1 against Specialist 2. Specialist 2 writes "`goRange` is listed in the task as FROZEN; it is NOT in tests/range-spans.json". It is — under `movedSpans` (movedPinnedAt 216), gated identically by range-frozen.test.mjs:72-79. His conclusion that the handlers around goRange are free is still correct, but his premise is wrong and would license an edit to goRange itself. Conversely he is RIGHT, and Specialist 1 silent, that range-spans.json is only half the freeze: drone-playable.test.mjs:32 and :40 pin the source text of play.html:2184 and :2701, two of the lines this build must work around.

FOUR FINDINGS WHERE I AGREE WITH ONE COLLEAGUE AND THE OTHER IS SILENT: marksPersist is four edits not one (Specialist 2 — Specialist 1's package would ship a silent safety regression at the two NOT_MARKED HOLD guards); #plat's real mechanism is state.mode theft via the select at :6108, not target deletion (Specialist 1); the 300 m ladder does not fit at CAP_RING=240 (Specialist 1's ray-march, which I re-derived independently from the record's own footprint and confirm exactly: 185 m clear south, 152 m east); the segment budget at :2182 forbids populating all 42 stations (Specialist 2).

UNANIMOUS: zero frozen spans must move and it is achievable; new definitions go at the end of inline script #1 as hoisted functions; the ?map= reader cannot go at :5928; `sil` and never `form`; life:1e9 needs the down-state fix in the same commit; the gun count is an output of the siting.

TWO FINDINGS I MADE ALONE: DD-124's four metrics are not computed on the lawn at all (applyHit :2704 guards both counters on isPlate; hudScore :2682 prints BLU/RED off the Range), and "rounds spent" must be counted at fireN's two call sites :2762/:2768 because `magSpend` :960 is FROZEN — a detail that would have failed CI in either colleague's plan had they reached it.


**Gaps (his word only):**
- THE STANDOFF — HIS WORD IS NEEDED AND NOTHING ELSE WILL DO. Measured from the record's own footprint (south face y=−55, wings x=±88): CAP_RING=240 (play.html:1256) leaves 185 m clear on the N/S axes and 152 m on the wing axes, so D-50's 50/100/150/200/250/300 ladder overshoots INTO the building by 115 m south and 148 m east. The DECLARED 340 m standoff gives only 285 m and 252 m — short of 300 on BOTH bearings, which the declaration did not notice. The full ladder with the Capitol as backstop needs ≥355 m south and ≥388 m on the wings; arena.radiusM is 450, so both fit. Either the picture wins (he approved 240 at r.208 because it is the only distance at which the whole building reads through the EYE optic) and the ladder is capped per bearing, or the ladder wins and the stations stand back to 360/390 with a smaller Capitol in the glass. This build populates the seated station only, so it is correct under either answer — but the number is his.
- THE GUN COUNT — THE RECORD AND THE DECK DISAGREE AND HIS LAW DOES NOT SETTLE WHICH. docs/drone-2525/drone-2525.v00.00.json sources exactly THREE turrets (t-south [0,−210], t-west [−210,0], t-east [210,0], heightM 3.0); play.html:913 creates 42 and :1267 re-homes them on the 240 m ring. His correction binds — "Forty-two was the even ring. Designing 42 new ones recreates it" — and the record is append-only, so three is the sourced answer. But CAP_RING=240 was his own measured picture choice and the 42 units are what the map menu is built from. Declared and reversible: the 42 stay as the MENU, the three sourced bearings are seated and playable first.
- LEAK HAS NO DEFINITION FROM HIM. "Avenger screens likely leakers in the low corridor" and "Cover leakers" (Shield in the Sky, Athena) name it twice and define it nowhere; Advance's Mix/Leak/Loss triad depends on it. Nothing in this build implements LEAK and nothing should until he says what a leaker is — an altitude band, a track that crossed a ring unengaged, or a track a seat declined.
- EW IS IN HIS SOURCE AND NOT IN HIS LADDER. Pangu's spoof package degrading swarm cohesion is in the briefing and FM 3-12 is named in the back matter for the first time in this project, but DD-124's five rungs carry no EW step and no seat wears it. Not built. It is a rung question, not a code question.
- REAL-WORLD'S SWARM SIZE IS UNRESOLVED — the AI-4-Defense paper says "three groups of three X-BAT drones (nine total)", the record's swarm block says total 42 / perSide 21. Real-World stays LOCKED in this build, which is the safe state and defers the question rather than answering it by accident.
- TWO FACTS IN THE BRIEF DO NOT MATCH TODAY'S LOCAL BYTES, AND ONE IS A PERSIST-FIRST ISSUE. (a) docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md is NOT at the local HEAD b7e1a304e; it is on origin/main at commit 16a4114ee, which `git merge-base --is-ancestor` confirms is NOT an ancestor of HEAD — the working tree is one commit behind, so pull before building or the ladder this plan serves is not in the tree. (b) "role=drone is hardcoded at :5884" is wrong: :5884 is `state._selCraft='turret'` inside the frozen enterTheRange, there is no `role=drone` anywhere in the file, and nothing reads `role` at all (shareUrl writes `role=turret` at :9031 and :9033). Also: task #43 already holds r.217, so this build is r.218 — bump BUILD at :787, frontend/tests/deck-head.mjs:5, frontend/lib/drone-2525/deck-rev.ts, carry the artefact and write HASHES_r218.sha256 in the same commit.

### Krishna (GROUND)

**Invariant.** Every gun on the Capitol lawn exists exactly once — in the record — and the deck, the glass and the gate all read that one list, so the count of guns is never typed and never disagrees with itself.


**Decision 1 — ONE FILE, THREE JOINED BLOCKS — not one row carrying everything** *(vote: majority; reversible by: "one row per gun, everything on it")*

Append three new top-level blocks to docs/drone-2525/drone-2525.v00.00.json beside `targets`, which stays byte-identical. `sites[]` carries only what is true of a PLACE: `id`, `label`, `at:[x,y]` (record frame), `heightM`, `homeAz`, `arcDeg:[from,to]` (compass bearings clockwise from north, the convention the record's own turrets already use), `assetKey`, `engageM`, `coversAssets:[…]`, `source`, `confidence`, `since` (a revision that exists in revisions[]), and for a retirement `retiredAt` with `coversAssets:[]`. `assets2525[]` is the catalogue promoted out of prose: `key`, `label`, `class` (AIR / RAM / HIGH / SENSOR — the ONLY grant of a class), `modes` (subset of the eight), `sidc`, `wireCue`. `rungGrants[]` carries rung → permitted modes. A position's PERMITTED FIRE MODES, which the question asks for per position, is then a COMPUTED projection — assets2525[assetKey].modes ∩ rungGrants[rung].modes — exposed at every read and stored nowhere.

*Why.* Modes are not a property of a place. DD-121 makes them a property of the seat (Avenger: single/SLS/ripple; LPWS: the C-RAM burst; Sentinel: never a fire mode) and DD-124 makes the available subset a property of the rung. A per-site `modes` array copies one Avenger's capability onto four Avenger rows and then needs a new append-only row per site per rung to express the ladder — the one-master-many-carriers drift the ONE MASTER rule exists to prevent. The SIDC settles it: I measured that `S*G*EWMAS-` is carried by Avenger, M-SHORAD, NASAMS and the Coyote launcher alike, so a SIDC is not a unique key and cannot be the row's identity; it is an attribute of the asset kind, resolved once.

*Evidence.* docs/security-2525/eXeL-STD-2525.md:85 (M-SHORAD `S*G*EWMAS-`), :86 (Avenger `S*G*EWMAS-`), :90 (NASAMS `S*G*EWMAS-/I-`), :91 (Coyote `S*G*EWMAS-`) — four assets, one code · record turrets[] homeAz 0 / 90 / 270 for t-south [0,-210] / t-west [-210,0] / t-east [210,0] fixes the bearing convention · frontend/lib/drone-2525/arena-model.ts:21 types DomainTurret as exactly {id,label,at,heightM,homeAz,homeEl}, so arc, class, modes and asset are all new surface


**Decision 2 — THE SIDC IS PROMOTED TO A MACHINE-READABLE CARRIER BEFORE ANY ROW CITES IT** *(vote: majority; reversible by: "put the SIDC on the row")*

Do not type a SIDC into a siting row. The asset catalogue at docs/security-2525/eXeL-STD-2525.md:76-92 is promoted to docs/security-2525/assets-2525.json in its own commit, before the siting block is written, and `assets2525[]` in the drone record cites it by key. The gate then asserts two things that cannot both be satisfied by a typo: every `assetKey` in `sites[]` resolves in the catalogue, and every catalogue `sidc` appears verbatim in the markdown table. The catalogue must also gain C-RAM/LPWS and M-SHORAD as first-class kinds, because the glass's own union is short of both.

*Why.* I grepped every .ts, .tsx, .mjs and .json under frontend/ and docs/ for `sidc` or an `S*G*EW` pattern and got nothing. The SIDC exists in prose and nowhere a machine reads. A value typed into a row with exactly one carrier is the condition capitol-model.test.mjs:9-13 was written to forbid in this very project — "THE NUMBERS ARE NOT TYPED HERE. They live once, with their source, their quote and how they were obtained… and this gate reads that file". Six of the twelve seats the ladder needs are LPWS, and the deck's asset union does not contain it, so the record would name a seat the glass cannot draw on day one.

*Evidence.* `grep -rn 'sidc|SIDC|S\*G\*EW' --include=*.ts --include=*.tsx --include=*.mjs --include=*.json frontend/ docs/` → no output · frontend/components/security-2525/asset-icons.tsx:18 `AssetKind = "avenger"|"patriot"|"thaad"|"sentinel"|"xbat"|"autofoil"` — no lpws, no m-shorad · docs/security-2525/eXeL-STD-2525.md:89 C-RAM/LPWS `S*G*EWA---`, :85 Sgt Stout `S*G*EWMAS-` · frontend/tests/capitol-model.test.mjs:9-13


**Decision 3 — THE DEFENDED ASSETS ARE THE INPUT, THEY ARE NOT IN THE RECORD, AND SO NO COUNT OF GUNS IS EARNED TODAY — INCLUDING TWELVE** *(vote: summarizer-override; reversible by: "put the four assets where you think they go")*

A fourth block, `defended[]`, is appended and filled FIRST: `id`, `label`, `onBuilding` (a `buildings[].id` already in the record) or an explicit `at`, `class` (which classes must cover it), `priority`. Siting is computed over it, and the count of guns falls out. Until the operator names where the command post, the fuel farm, the ammunition transfer point and the maintenance cluster stand, `sites[]` is appended EMPTY with its schema, its gate and its generator, and not one gun is placed. I override Specialist 1's "12 (2 Sentinel, 4 Avenger, 6 LPWS)": the method is right and the arithmetic is sound, but its input — four asset positions — was invented by the specialist, not sourced from him, so the twelve is an output of our own placement and not of his siting.

*Why.* His correction was exact: "Forty-two was the even ring. Designing 42 new ones recreates it." Twelve guns derived from four invented assets is the same error at a smaller number, and it would enter an APPEND-ONLY record where it can never be edited out, only tombstoned. Binding to `onBuilding` is what makes the ask small: the record already carries 14 buildings with ids, footprints and heights, so he names buildings, not coordinates, and the asset's position is then derived from a footprint the gate already checks.

*Evidence.* the record's top-level keys contain no assets or defended block (measured: keys matching 'asset' or 'defend' → []) · docs/drone-2525/drone-2525.v00.00.json buildings[] = 14 rows with ids capitol, sam-houston, reagan, johnson, zavala, supreme, clark, price-daniel, visitors, insurance, mansion, workforce, greer, extension-n · "Shield in the Sky": "Protect fuel. Protect ammunition. Protect command and control."


**Decision 4 — THE DECK'S COPY IS A HOISTED, MARKER-DELIMITED FUNCTION AT THE END OF INLINE SCRIPT #1 — AND ONLY THERE** *(vote: majority; reversible by: "put it next to CAP_RING where I can read it")*

The generator writes `/*CAP_SITES_BEGIN*/function capSites(){return [ … ];}/*CAP_SITES_END*/` at the end of inline script #1 (which runs play.html:775-6723), using the same marker idiom RCORE_LEDGER already proves at play.html:6287. I ran the frozen gate's own extractor over mutated copies of today's deck and measured the outcome of four forms at two placements. At the end of script #1, every form moves zero of the 100 pinned spans and zero of the 3 movedSpans. Above `const CAP_RING=240;`, the comment-prefixed form — const OR function — moves the PINNED `parkRangeTurrets` and fails range-frozen; only a form whose keyword is at line start with the sentinels inline survives there.

*Why.* Both colleagues are right about different halves and neither states both. Specialist 1 is right on the form: the deck's own written law at play.html:6115 says a new top-level definition must be a hoisted `function`, never a const, because toolSelfTest() is CALLED at play.html:5684 and a const below that line is in its temporal dead zone at boot — and this already cost one deck that never booted. Specialist 2 is right on the trap, and I reproduced it: the comment prefix hides the definition from the extractor's line-anchored regex, so the blob's bytes fall inside the preceding span. A hoisted function at the end satisfies both constraints at once and is readable from the L1262 re-homer and the L5684 boot QA alike, which a const placed at L1256 is only by accident of position.

*Evidence.* measured with /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/kr_span.mjs: BASELINE r.216 moved=NONE; comment-prefixed const @ before CAP_RING → moved=pin:parkRangeTurrets; comment-prefixed function @ before CAP_RING → moved=pin:parkRangeTurrets; all four forms @ end script#1 → moved=NONE · frontend/tests/range-frozen.test.mjs:32-35 (the extractor `/^(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/gm`) · frontend/tests/range-spans.json: parkRangeTurrets PINNED, CAP_RING / restoreCapitolTurrets / lockOn / asmTick FREE · play.html:6115, :5684, :6287


**Decision 5 — THE DEAD-GROUND PAIRING IS DERIVED BY THE GENERATOR AND ASSERTED — NOT TYPED, NOT MERELY RE-RUN** *(vote: unanimous; reversible by: "write the pairing in the record by hand")*

The record stores no pairing. The generator computes it from `defended[]`, `sites[]` and the arena's own geometry using lineOfSight, and writes the resolved `relief` into both domain.gen.ts and the deck's capSites() block, so the deck has the value at runtime without ever running los.ts. The gate does NOT re-run the generator and compare — that proves only determinism. It asserts the PROPERTY from first principles: for every defended asset and every class that must cover it, at least two live sites of that class have range ≤ engageM and clear LOS; and for every site, the `relief` the deck carries is a live site of the same class that also covers each asset the lost site covered. `relief` is a MAP from asset id to relieving site id, never a scalar.

*Why.* Specialist 1 proved the map, not the scalar, is required: a single RAM position can be the only one covering two assets, and when it is lost the two assets pass to two different guns, so a scalar silently drops one the moment the Real-World rung kills that gun. Specialist 2 proved the computation is available in-repo. But a stored pairing in an APPEND-ONLY record is a frozen claim that goes stale the first time a gun is re-sited and can never be corrected, only superseded — so it must be derived; and the deck is a standalone static file that imports nothing, so it must be baked. His failure condition is literal: "a threat left with no gun that can lock it" and "a gun is lost and the next gun that covers its dead ground takes the track".

*Evidence.* frontend/lib/drone-2525/los.ts:36 `export function lineOfSight(…): LosResult {clear, rangeM, block, samples}`, :22 pointInPoly, :62 transect · frontend/lib/drone-2525/arena-model.ts:42 buildArena returns `{model, doors, ground}` · frontend/tests/drone-arena.test.mjs already calls `ground(e,n)` per building footprint · frontend/tests/capitol-model.test.mjs:13 "The deck is a standalone static file and cannot import the arena record"


**Decision 6 — THE CHAIN, FIVE LINKS, AND THE TWO PLACES IT IS BROKEN TODAY** *(vote: unanimous; reversible by: "one generator, not two")*

(1) RECORD — a human appends `defended[]`, `assets2525[]`, `sites[]`, `rungGrants[]` and one revisions[] entry; this is the only typing in the chain and it is committed alone. (2) TYPED MODULE — `node scripts/drone-render.mjs` rewrites frontend/lib/drone-2525/domain.gen.ts from the whole record. (3) DECK — a new `scripts/gen-cap-sites.mjs` rewrites the marker span in play.html from the same record, deriving relief via los.ts. (4) PLAYER — the FREE `restoreCapitolTurrets` seats from capSites(); drawMap and pickMap already walk `Object.keys(units)` generically, so the overhead menu, ◀T/T▶ and jumpToTurret carry the record to the glass with no frozen definition touched. (5) GATE — drone-arena.test.mjs asserts the record's properties and a new deck-sites.test.mjs re-parses the served AND carried deck spans and compares them to the record row for row under deck z = -(record y). Two links are broken today and must be fixed in the same commit: play.html is NOT in drone-render's OUT list, and `drone-render --check` runs in test:ci but NOT in prebuild, so a stale generated view fails CI and still ships to Cloudflare.

*Why.* I verified both carriers the chain rests on rather than assuming them, and verified both gaps. The capitol-model pattern — hand-type once, gate later drift — is explicitly rejected; it catches drift but admits a wrong original, which its own header concedes at line 13.

*Evidence.* scripts/drone-render.mjs:202-207 OUT = [CRS_DRONE-2525.md, README.md, ASSUMPTIONS_REGISTER.md, domain.gen.ts] — play.html absent · frontend/tests/drone-crs.test.mjs:62 shells `drone-render.mjs --check` · frontend/package.json:9 prebuild runs range-frozen, capitol-model, deck-rcore and `gen-rcore-revisions.mjs --check` but NOT drone-render --check and NOT drone-arena · frontend/tests/deck-rcore.test.mjs:28,34-40 (the served-vs-carried-vs-source pattern to copy) · play.html:2000-2005 pickMap and :2034-2036/:2052 drawMap both walk Object.keys(units) · play.html:1262 restoreCapitolTurrets, :2817 jumpToTurret, :562 #btnTprev/#btnTnext


**Decision 7 — THE REACH NUMBER COMES FROM THE SITE ROW, AND THE LAWN TARGET STAYS OUT OF THE PLATE ENGINE** *(vote: unanimous; reversible by: "leave lockOn alone")*

Replace the hard 80 in lockOn with the site row's `engageM`, and make the same substitution in asmTick. The lawn target stays a member of the existing `pops` array with a new `sil:{w,h,shape}`, `life:1e9` and NO `form` — but because `form` is also the reach discriminator in asmTick, the reach test must move to the silhouette: `bd < (best.form?340:(best.sil?st.engageM:80))`. Site and target ids must be forbidden a leading 'C', so a later addition of `form` cannot silently re-arm the frozen plate path.

*Why.* The brief's no-form prescription is necessary and, on its own, re-creates the defect it is fixing. I verified the asymmetry that is the whole "the Capital cannot be played" finding: lockOn adds pops with a hard 80 m cap while slots() puts the same pops in with no cap at all, which is exactly why a tap accepts what the TARGET button refuses. Both lockOn and asmTick are FREE — neither appears in range-spans.json — so this is legal under DD-35: the lawn is built FROM the Range by calling its frozen definitions, never INTO it.

*Evidence.* play.html:2303 `pops.forEach(p=>{ if(!p.up) return; add(p,'pop',p,80); });` versus play.html:2563 `pops.forEach(p=>{ if(p.up) put(p,p)` — no cap · play.html:2290 `const add=(o,kind,w,cap,extra)=>{ … if(cap&&sd.dist>cap) return;` · play.html:2940 `bd<(best.form?340:80)` · play.html:2694 `isPlate=!!(ref&&ref.id&&String(ref.id).charAt(0)==='C'&&ref.form&&typeof plateHit==='function')` · range-spans.json: lockOn, asmTick, slots, applyHit all FREE


**Decision 8 — BOTH 42s COME OUT OF THE DECK IN THE SAME COMMIT THAT ADDS THE LIST** *(vote: unanimous; reversible by: "keep the forty-two stations on the ring")*

play.html:909 `const TEAM_N=42;` and the SECOND, independent `for(let i=1;i<=42;i++)` inside restoreCapitolTurrets at play.html:1263 both become `capSites().length`. They are two literals that no code compares, over a record that says three, so today the lawn's gun count is three different numbers in three carriers. Both definitions are FREE, so nothing frozen is touched. Any station the list does not site must not be pickable: the hide is `if(chNum()!==0 && u.site===undefined) return;` in the drawMap and pickMap loops, which re-pins drawMap in movedSpans and MOVES pickMap out of the frozen 100 — a visible weakening that goes into range-spans.json as a line of the same diff, never a silent re-baseline.

*Why.* His law is that the count of guns is an output of the siting. A binding built over three uncompared counts is decoration on a live contradiction, and the gate that compares them is the cheapest red-first proof in this whole plan. I reject the zero-frozen-change alternative of stacking unsited seats on their relief station's coordinates to win pickMap's tie-break: it is a trick a reviewer cannot read, and range-spans.json exists precisely so a deliberate weakening is legible.

*Evidence.* play.html:909 `const TEAM_N=42;` used only at :910-911 · play.html:1263 `for(let i=1;i<=42;i++)` inside restoreCapitolTurrets, independent of TEAM_N · docs/drone-2525/drone-2525.v00.00.json turrets[] = 3 rows · range-spans.json movedSpans = {goRange, mapCam, drawMap}, pickMap PINNED, movedPinnedAt 216 · frontend/tests/range-frozen.test.mjs:66-70


**Gates proposed:**
-
  - **rowId**: ONE_COUNT_OF_GUNS
  - **holds**: The number of sited guns is read from one place: `sites[].length` in the record equals the deck's single `capSites().length`, and the deck contains no numeric station-count literal.
  - **redToday**: Three numbers disagree on r.216's bytes and nothing compares them: the record carries 3 turret rows, play.html:909 declares `const TEAM_N=42;`, and play.html:1263 declares a SECOND, independent `for(let i=1;i<=42;i++)` inside restoreCapitolTurrets that is not derived from TEAM_N. The gate reads all three and fails on the first mismatch.
-
  - **rowId**: THE_SITING_IS_GATED
  - **holds**: drone-arena.test.mjs reads SRC.sites and asserts id uniqueness, a `since` present in revisions[], `at` inside the street box read from roads[], at least 25 m clearance from every buildings[].footprint, and arcDeg containing the bearing to every asset the row claims.
  - **redToday**: `grep -c -i turret frontend/tests/drone-arena.test.mjs` returns 0 across all 105 lines — the gate asserts project/version, 14 buildings, doors, LOD, palette, a five-build determinism hash and pane fit, and never once reads SRC.turrets. The three sourced turret rows have no gate at all, so the assertion cannot resolve and the file fails on the missing block.
-
  - **rowId**: EVERY_SIDC_HAS_TWO_CARRIERS
  - **holds**: Every `assets2525[].sidc` appears verbatim in docs/security-2525/eXeL-STD-2525.md, and every `sites[].assetKey` resolves to a catalogue row — so the glass, the record and the doctrine cannot drift.
  - **redToday**: `grep -rn 'sidc|SIDC|S\*G\*EW' --include=*.ts --include=*.tsx --include=*.mjs --include=*.json frontend/ docs/` returns NOTHING. The SIDCs exist only as a markdown table at eXeL-STD-2525.md:76-92, so there is no second carrier to compare and the gate has nothing to read. It also fails on kind coverage: asset-icons.tsx:18 has no lpws and no m-shorad, the two seats six of the ladder's rows need.
-
  - **rowId**: EVERY_ASSET_IS_TWICE_COVERED
  - **holds**: For every `defended[]` row and every class that must cover it, at least two non-retired `sites[]` rows of that class lie within engageM with clear LOS, recomputed by the gate via lineOfSight — never read from the record.
  - **redToday**: The record has no defended assets at all: its 26 top-level keys contain no `assets` and no `defended` block, only buildings, treeRows and roads. With zero assets and zero sites the cover count is 0 against a required 2 for every row, so the gate fails by absence — and it stays red until the operator names where the four assets stand, which is correct, because 1-cover makes Real-World's "a gun is lost and the next gun takes the track" unsatisfiable by construction.
-
  - **rowId**: DEAD_GROUND_HAS_A_RELIEF
  - **holds**: For every site and every asset it covers, `relief[asset]` names a live site of the same class whose own LOS to that asset is clear — a MAP, never a scalar, so a lost gun covering two assets passes each to the gun that can actually take it.
  - **redToday**: No `relief` exists in any carrier on r.216's bytes, and the deck has no concept of one: restoreCapitolTurrets (play.html:1262) re-homes all 42 stations onto a single CAP_RING=240 circle with identical behaviour and no classes, so there is no pairing to check and nothing in the deck could act on one.
-
  - **rowId**: THE_BLOCK_DOES_NOT_MOVE_THE_RANGE
  - **holds**: The generated capSites() span moves zero of range-spans.json's 100 pinned spans and zero of its 3 movedSpans, and the generator's placement is pinned so a later tidy-up cannot move it silently.
  - **redToday**: Proven red by mutation on today's bytes with the gate's own extractor: inserting `/*CAP_SITES_BEGIN*/const CAP_SITES=[…];/*CAP_SITES_END*/` immediately above `const CAP_RING=240;` (play.html:1256) moves the PINNED `parkRangeTurrets` and range-frozen fails; the comment-prefixed FUNCTION form fails identically there. The comment prefix hides the definition from the line-anchored regex at range-frozen.test.mjs:32-35, so the blob's bytes land inside the preceding span. Only the end of inline script #1 is clean for all four forms.
-
  - **rowId**: THE_TARGET_BUTTON_REACHES_WHAT_A_TAP_REACHES
  - **holds**: For every station and every lawn pop, lockOn's cap is at least the reach at which slots() will accept the same object — the TARGET button never refuses what a screen tap accepts.
  - **redToday**: Arithmetic on r.216's bytes: stations stand at CAP_RING=240 (play.html:1256,1267) and the six lawn spots at play.html:2962 are `[[0,1.2,22],[12,1.2,18],[-12,1.2,18],[0,1.2,-20],[18,1.2,0],[-18,1.2,0]]`, so from T01 at (0,0,240) the six horizontal distances are 218.00, 222.32, 222.32, 260.00, 240.67, 240.67 m. lockOn:2303 caps pops at 80 m, so ALL SIX are refused; slots:2563 puts the same pops in with no cap, so all six are tappable — and 222.32 m is the measured 222.3 m tap, to the centimetre. asmTick:2940 caps at the same 80.
-
  - **rowId**: THE_DECK_CARRIES_THE_RECORD
  - **holds**: The served deck's capSites() block, the carried operator-deck copy's block, and the record's `sites[]` are the same rows field for field under the one transform deck z = -(record y) — the deck-rcore pattern applied to the siting.
  - **redToday**: Neither deck contains any block: `CAP_SITES` and `capSites` have zero occurrences in play.html on r.216. The only record-derived literals the deck carries are CAP_TREES and CAP_ROADS, compared at capitol-model.test.mjs:53-60; the stations are not among them, and restoreCapitolTurrets derives all 42 from a bare literal instead. The gate's `block(src)` match returns null on both files and fails.

**Dissent.** Four real splits, resolved as follows. (1) SHAPE — Specialist 1 wants ONE `sites[]` row carrying class, fire modes and the SIDC; Specialist 2 wants three joined blocks. I side with Specialist 2, so 2-1 majority (Krishna + Adversary), and I add the measurement that settles it: `S*G*EWMAS-` is shared by Avenger, M-SHORAD, NASAMS and Coyote (eXeL-STD-2525.md:85,86,90,91), so a SIDC is not a unique key and cannot be a row's identity. The question's "permitted FIRE MODES per position" is still answered — as a computed projection at the read, not a stored field. (2) EMBED FORM — Specialist 1 wants a hoisted function per the deck's written law at play.html:6115; Specialist 2 measured that the comment-prefixed marker breaks the frozen gate and wants a line-start const beside CAP_RING. I reproduced Specialist 2's measurement exactly AND extended it: the trap is the comment prefix, not the keyword, and at the END of inline script #1 every form is clean. So I go with Specialist 1's form at Specialist 1's placement — 2-1 (Krishna + Builder) — and adopt Specialist 2's trap as gate row THE_BLOCK_DOES_NOT_MOVE_THE_RANGE, which neither of them proposed as a gate. (3) DEAD GROUND — Specialist 1 wants a stored MAP, Specialist 2 wants the gate to compute it; both are partly right and neither is complete, since the record is append-only (a stored pairing cannot be corrected) and the deck imports nothing (a gate-only pairing never reaches the player). My synthesis: the GENERATOR derives it into both carriers, the gate asserts the property independently. Both specialists' own evidence supports this, so I record it as unanimous in substance though novel in form. (4) THE COUNT — I OVERRIDE Specialist 1 plainly. Its "12 guns (2 Sentinel, 4 Avenger, 6 LPWS)" is arithmetically sound but computed over four defended-asset positions the specialist invented, because the record contains none. An engineer can check this in one command: the record's top-level keys have no assets block, so the input to that computation came from nowhere he authorised. Twelve invented guns over four invented assets is "Forty-two was the even ring" at a smaller number, and it would enter an append-only file. Specialist 2 reaches the same conclusion in its open question, so this is 2-1 against the twelve. One thing all three of us independently found and state identically: drone-arena.test.mjs contains the string "turret" zero times — the siting has no gate whatsoever today.


**Gaps (his word only):**
- WHERE THE FOUR DEFENDED ASSETS STAND. Shield in the Sky names the set — command post, fuel farm, ammunition transfer point, maintenance cluster — and the arena record carries none of them. This is the siting's INPUT, so until he answers, no gun can be placed and no count can be derived. The ask is small if put as buildings: the record already holds 14 buildings with ids (capitol, sam-houston, reagan, johnson, zavala, supreme, clark, price-daniel, visitors, insurance, mansion, workforce, greer, extension-n), so he names four of those, or four coordinates, and nothing else.
- LEAK HAS NO DEFINITION FROM HIM. Aset's ring law — "Outer ring for highest consequence. Inner ring for leakers. Guns for affordability." — is what sets the inner/outer engageM split and therefore how many RAM seats the computation returns. Without a definition, `engageM` per class is our number, not his.
- WHETHER REAL-WORLD'S SWARM IS NINE OR 42. The paper says "three groups of three X-BAT drones (nine total)"; the record's swarm block says total 42, perSide 21, with a pass mark of "42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times". Both are in writing and they are not the same scenario.
- EW IS IN HIS SOURCE AND NOT IN HIS LADDER. Pangu's spoof package degrading swarm cohesion, and FM 3-12 in the back matter, name a capability that is not one of the eight fire modes and has no seat. It is not a fire mode, so it must not be forced into the mode list; it needs its own word from him.
- THE PREBUILD DOOR. `drone-render --check` runs in test:ci via drone-crs.test.mjs:62 but is absent from frontend/package.json:9's prebuild chain, and test:drone-arena is likewise CI-only. A stale generated view therefore fails CI and still ships to Cloudflare. Adding both to prebuild is part of this work, not a separate item — but it lengthens the build and that trade should be named before it is made.
- THE PICKMAP WEAKENING. Hiding unsited seats moves pickMap out of the frozen 100 and into movedSpans. That is a deliberate weakening of the Range freeze and belongs in range-spans.json as a readable line of the same diff, with its reason — it should be flagged to him in the release note, not buried in a JSON.

### Thoth (GROUND)

**Invariant.** A rung counts only when three numbers are the same number — the rounds his magazine picture shows, the rounds the record counts, and hits plus misses — and every one of those rounds has a named TARGET and a named APPROVE standing in front of it on the same record.


**Decision 1 — THE ROUND IS THE ROW — rounds spent is COUNTED, never incremented** *(vote: unanimous; reversible by: )*

Do not add a rounds counter. magSpend() has exactly two call sites, both inside fireN, both guarded if(hit.result!=='REFUSED'), and applyHit emits netEvent('HIT'|'MISS') on every non-REFUSED path — including MISS DOWN, which both writes a row and spends a round — while the one REFUSED path (QUAL 'ONE ROUND PER TARGET') returns before netEvent and spends nothing. So rounds-spent is already on the record: |{rows: verb in (HIT,MISS) and peerId===SID}| inside the run window. Define it that way and the fourth metric exists today with zero new state. The HUD counters must never be the metric: state.rangeHit/rangeMiss move only inside if(isPlate), and lawn pops carry no form, so a perfect lawn run leaves the strip reading 0/0; and applyWorld moves the same two counters from a PEER's rows, so they are seat-mixed. They are a display cache to be reconciled, not a source.

*Why.* His fourth metric is the only one missing, and inventing a counter for it would create a second source that can disagree with the first — the exact class that produced the HUD/ledger split already in the file.

*Evidence.* play.html:960 (magSpend) · :2762 and :2768 (its only two callers, both REFUSED-guarded) · :2707 (netEvent on every shot) · :2696 (MISS DOWN returns 'MISS' so a round is spent) · :2698 (SPENT returns 'REFUSED' — no row, no round) · :2704 (rangeHit/rangeMiss only under isPlate) · :917 (pops have no form) · :2370-2373 (peer rows move the same counters)


**Decision 2 — THREE FIELDS ON THE ROW — and cls IS ALREADY TAKEN; the magazine is recorded BEFORE the spend** *(vote: majority; reversible by: "call it cls" — then it is cls and the LC4 key is renamed instead)*

ev() already stamps eighteen fields and replayHash() folds stableCanon(e.data) into the digest, so the three missing facts ride in data for free: tcls ('air'|'ground'|'incoming'|'high'), seat ('AVENGER'|'LPWS'|'PATRIOT'|'THAAD'|'SENTINEL') and mag:{n,cap,before}. Name it tcls, NOT cls: cls is already a live key on LC4_COLORS (play.html:3184-3187, read at :3514), and a second meaning of the same three letters in one 1.19 MB file is how the next reader is misled. Record before — the pre-spend count — not the post-spend count: magSpend() runs AFTER netEvent has already written the row, so the pre-spend number is the one honestly available at the row's own moment, and after = before - 1 is derivable while the reverse requires knowing whether the spend happened. Both specialists split on this; before is the only value the call order can supply without moving a line.

*Why.* tcls plus seat is what makes DD-124's wrong-class failure and the DD-121 seat map checkable from rows instead of from memory; mag.before is what makes the three-source integrity arithmetic possible at all.

*Evidence.* play.html:2435-2447 (ev's eighteen fields) · :2452-2464 (replayHash folds stableCanon(e.data)) · :3184-3187 and :3514 (cls is LC4_COLORS' CSS class) · :2707 then :2762/:2768 (netEvent precedes magSpend) · :917 (pops carry id/up/life/lifePct/x/y/z/mist — no class)


**Decision 3 — THE RUN BOUNDARY IS THE REAL GAP — two hoisted functions, and the lawn has neither end** *(vote: unanimous; reversible by: )*

Add function runOpen(rung,scen) and function runClose(why) at the end of inline script #1, beside the existing rungIsRange()/rungWord()/rungTitle() family, as hoisted function declarations — never const, under the law already written in the comment above them. The run row: {runId, rev, rung, scen, lane, seat, t0, t1, ms, hits, misses, rounds, mags:[{n,cap}], approvals, holds, rejects, friendlyHits, assetsLost, classes[], evFrom, evTo, nEvents, lines{}, replayHash, seal}, with hits/misses/rounds DERIVED from the rows in [evFrom,evTo], never from a counter. This is needed because today only TRAIN DOWN opens (decide('START','RANGE',...)) and only TRAIN DOWN and QUAL 40 close; TRAIN UP ('bounce') writes no terminal row at all, and the lawn writes neither end — so there is literally no window to replay between. SID is 's'+Math.random().toString(36).slice(2,10), unseeded and unpersisted, so runId must carry a persisted installation id or runs cannot be filed across reloads.

*Why.* Without a boundary every other decision here is uncomputable: no window, no counting, no reconciliation, no seal, no proof.

*Evidence.* play.html:6114 (the hoisting-law comment) · :6116-6120 (the rung* family, the correct insertion point) · :1032 (decide('START','RANGE',...) — the only opening row, inside downStart) · :1033 (TIME) · :1040 (COLD) · no terminal row for rangeMode 'bounce' · :787 (SID unseeded and unpersisted; BUILD.revision '0.216')


**Decision 4 — WHERE IT LIVES — IndexedDB primary, localStorage index, git the record; Supabase is never the proof** *(vote: majority; reversible by: "put it in Supabase" — then Supabase becomes mirror #4, still never the proof)*

Three stores, in this precedence. (1) PRIMARY: IndexedDB exel-2525-rec, object store pack, already opened at boot with keyPath 't' and already written per sample — the run rows go here, append-only, keyed by runId. (2) INDEX: one small localStorage key exel-2525-runs, .slice(-200), try/catch on both read and write, following the four keys the file already guards exactly that way (exel-2525-sets, exel-2525-soak, VOICE_KEY, exel-2525-perf); the ladder must render correctly from an empty list. (3) RECORD: an appended proficiency.runs[] in docs/drone-2525/drone-2525.v00.00.json, by commit. NOT Supabase, and not because of taste: measured over all 1,186,355 bytes, fetch(, XMLHttpRequest, sendBeacon, WebSocket, EventSource and supabase all occur ZERO times. A Supabase write would be this file's first network dependency ever, and DD-57 measured the keys absent in this container and in Actions while frontend/lib/supabase.ts:6-9 yields null without them — a rung proof that silently never happens, which is the Trinity-Redundancy silent-failure class CLAUDE.md already records. The existing pack() to download() path carries the runs out as a fourth, manual mirror.

*Why.* An offline deck must be able to prove a rung by itself; localStorage proves the run to the player, git proves it to the project, and a store that can be absent must never be the one the proof depends on.

*Evidence.* grep over play.html: fetch 0, XHR 0, sendBeacon 0, WebSocket 0, EventSource 0, supabase 0 · :1477-1480 (indexedDB.open('exel-2525-rec'), store 'pack') · :869/:870, :1656/:1659, :4060/:4061, :5593/:5597 (the four guarded localStorage keys) · :3876 pack() already carries events, decisions, metricsOf(), replayHash(), samples, qual · frontend/lib/supabase.ts:6-9 · docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:850-862 (DD-57 table)


**Decision 5 — A RUNG IS A PREDICATE OVER ROWS — and today it is one unsigned integer the deck does not even read** *(vote: unanimous; reversible by: )*

rungProven(run) is true only if all seven hold: (1) run.rounds === |{HIT,MISS} rows, peerId===SID, in [evFrom,evTo]|; (2) run.hits + run.misses === run.rounds — no third outcome; (3) t1 > t0 and ms > 0; (4) every HIT/MISS row has a preceding APPROVE decision for the same id with hiApproved:true, and in a LIVE room approvedBy !== designatedBy; (5) friendlyHits === 0; (6) the rung's own condition — Introductory: a SENTINEL CUE row precedes the first HIT/MISS; Intermediate: exactly one distinct tcls; Advance: three distinct tcls inside one run; Real-World: a GUNLOST row followed by a HIT/MISS on the same track from a different seat, and assetsLost === 0; (7) the seal recomputes. Real-World's lock is then structural — rungs 1-4 must each have a proven run before the swarm scenario may be CONSTRUCTED, so no link, menu or query string can open it. This replaces, and must retire, progression.ts: it stores only {reached}, clamps to 0..3, and advance() opens the next rung on tagged >= 1 — one tagged target, no hits, no misses, no rounds, no time.

*Why.* His sentence "a run with no metrics does not count" is a predicate, not a toast; and DD-124's lock on Real-World is, at HEAD, not implemented anywhere the player is.

*Evidence.* frontend/lib/drone-2525/progression.ts:18 (STAGE_KEY), :38-42 (unlocked), :50-56 (advance on tagged>=1), :64-75 (loadProgression clamps 0..3) · frontend/components/drone-2525/command-ux1.tsx:18 (sole importer) · grep -c 'drone2525.progression' frontend/public/drone-2525/play.html = 0 · play.html:2588-2596 (decide writes designated/hiApproved/authorityLevel) · :2620-2630 and :2665 (wireApprove/approveDesig write designatedBy and approvedBy). Rung condition 6 is a design, not a measurement — no CUE, GUNLOST or tcls row exists today.


**Decision 6 — THE PICTURE CHECK BINDS THREE SOURCES — and it is ONE BAR PER ROUND, never a fill fraction** *(vote: summarizer-override; reversible by: "a full magazine must read full at every cap" — then MAG_BARS follows magCap() and QUAL draws ten tall bars)*

The precondition row is THE_PICTURE_THE_COUNTER_AND_THE_RECORD_AGREE, asserted at every runClose: (a) barsDrawn(--cut) === state.mag.rounds, inverting MAG_BAR_TOPS within 0.05; (b) sum(mag.cap over magazines issued) minus mag.rounds === run.rounds; (c) run.rounds === |HIT/MISS rows|. All three or the run is VOID — not reconciled. State the rule as ONE BAR PER ROUND, not as a fill fraction. Measured on today's bytes: cut(r) = MAG_BAR_TOPS[30-r], 30 tops from 6.5% to 93.5%, floor 96.4%. At cap 30 a full magazine covers 89.9% of the body; at cap 10 a full magazine covers 30.0% — ten bars of thirty. That is NOT a defect against his law, it IS his law: D-25 "thirty bars, one per round", restated verbatim in the code comment at :971 ("one bar per round at any cap ... 3 rounds show three bars in a 10-round magazine as in a 30") and asserted in-deck by the anyCap leg at cap 10. A fill-fraction formulation would make QUAL 40 — the one rung that stores a badge today — permanently red against his own decision. The arithmetic in (b) is valid only inside a run boundary, because magLoad('RESET') refills silently from three places and resets n to 1.

*Why.* Both existing magazine gates compare the picture to the same variable that drew it and neither reads state.events, so a deck showing 7 bars with 20 HIT/MISS rows passes both today; the third source is the whole point.

*Evidence.* play.html:971 (the --cut expression and the r.203 one-bar-per-round comment) · :1020 (MAG_FILL_TOP 6.5, MAG_FILL_BOTTOM 96.4, MAG_BARS 30, 30 tops) · :4952-4955 (MAGAZINE_KEEPS_ITS_FRAME sets state.mag.rounds then reads the cut back — self-referential; its anyCap leg DOES exercise cap 10 and asserts MAG_BAR_TOPS[20]) · :5368-5377 (ROUNDS_ARE_INSIDE_THE_MAGAZINE decodes rasters only) · :961-964, :978, :1007, :1028 (silent magLoad('RESET')) · computed: cut(30)=6.5, cut(19)=39.3, cut(10)=66.4, cut(3)=87.2, cut(0)=96.4 · docs/drone-2525/CRS_DRONE-2525.md:1101 (D-25 "A2 - thirty bars, one per round")


**Decision 7 — THE SEAL — name fnv1a64 what it is, and seal the RUN with HMAC-SHA-256 at close, not every row** *(vote: summarizer-override; reversible by: "make every row SHA-256" — then ev() becomes async and the whole deck is re-flowed as its own revision)*

fnv1a64 is FNV-1a 32-bit despite its name — h=2166136261, Math.imul(h,16777619), eight hex out — and replayHash() rests the entire record on it. Say in the comment and in the release note that it detects DRIFT AND CORRUPTION, never an adversary: a collision is roughly 2^16 tries and the whole store is editable in devtools. Do NOT, however, chain every row with SHA-256: crypto.subtle is already live in this deck (generateKey, importKey, deriveBits, deriveKey, exportKey, sign, verify, encrypt, decrypt at :3633-3683) but every one of those is Promise-based and there is no crypto.subtle.digest call at all, so a per-row chain would make ev() async and ripple through the whole file — rejected on complexity, which is his standing preference. Instead: keep fnv1a64 for the synchronous per-row and replay digest, and compute the RUN SEAL at runClose with HMAC-SHA-256 over the canonical run row plus the ordered [evFrom,evTo] row digests, using the primitives already at :3658/:3663. runClose is an async-tolerable moment; ev() is not.

*Why.* Specialist 2 is right that the hash misleads and right that real SHA-256 is in the file; he is wrong that it is free at row granularity, and an engineer can check that by reading the call list — every subtle call returns a Promise.

*Evidence.* play.html:5691 (fnv1a64 — FNV-1a 32, 8 hex, single occurrence) · :2449-2464 (replayHash feeds it the whole canonical list) · :3633, :3638, :3642-3649, :3658 (sign), :3663 (verify), :3675, :3683 — all async, and no crypto.subtle.digest anywhere in the file


**Decision 8 — THE FIVE LINES ARE COMPUTED — one is computable today, four are not, and UNVERIFIABLE is printed rather than green** *(vote: majority; reversible by: "the swarm is forty-two" — one word, and the denominator is 42)*

Each Shield line is a predicate over rows, red by default. (1) "Joint network stable" is computable NOW: com:{rtt,peers,seq,loss} is on every sample row, so the line is loss===0 and seq contiguous and logicalClock monotone across [evFrom,evTo]. (2) "Primary missile threat destroyed" and (3) "Low-altitude attackers eliminated" become computable the moment tcls is on the row: every tcls==='incoming' and tcls==='air' track resolved by a HIT from a seat the record gave that class. (4) "Drone swarm neutralized" needs a denominator — take the paper's NINE, not the record's 42: the record's own words make 42 a RENDER pass-mark ("42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times"), a graphics budget, and 42 hostile tracks against three sourced turrets is unwinnable by the same reasoning the record applies to its own up-window. 42 stays the draw budget; 9 is the fight. (5) "Defended assets preserved" has NO substrate: friendly occurs 0 times and there is no asset object in 1,186,355 bytes. Until the four named assets exist as non-targetable objects with their own hit rows, that line prints UNVERIFIABLE, never green. A scorecard showing five greens with no asset on the map is precisely what CLAUDE.md's "the panel never claims more than happened" forbids.

*Why.* The question asks for lines computed from rows rather than asserted; honesty about which four cannot yet be computed is the computation.

*Evidence.* play.html sample() carries com:{rtt,peers,seq,loss} on every row · :2437-2441 (seq, logicalClock on every row) · :917 (pops carry no class) · grep 'friendly' in play.html = 0 occurrences; no asset identifier · docs/drone-2525/drone-2525.v00.00.json swarm.passMark "42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times"; the same file: 'misses' 0 occurrences, 'proficien' 0 occurrences — the append-only record has no per-run metric schema at all


**Gates proposed:**
-
  - **rowId**: ROUNDS_ARE_THE_ROWS
  - **holds**: For every closed run, run.rounds === |{rows: verb in (HIT,MISS), peerId===SID, seq in [evFrom,evTo]}| and hits + misses === rounds.
  - **redToday**: There is no run window to count over off the Range: decide('START','RANGE',...) exists only at play.html:1032 inside downStart, TRAIN UP ('bounce') closes with no terminal row, and the lawn writes neither end. And the one rung that stores a number is false by construction: qualFinish writes rounds:state.qualR (:1040) while rangeLapse (:1036-1038) calls qualRecordShot(false,...) for a target nobody fired at, which increments state.qualR at :1157 — a QUAL 40 with six lapses reports rounds:40 when only 34 rounds left the magazine.
-
  - **rowId**: THE_SELF_TEST_SPENDS_NO_ROUND
  - **holds**: Every HIT/MISS row in a counted run was produced by a path that also called magSpend(); a row written by the deck's own self-test carries qa:true and is excluded from run.rounds.
  - **redToday**: applyHit has a THIRD call site at play.html:4462, inside the SPLASH_FROM_TARGET_BASE row: const hm=applyHit(qm,qm.id) with no magSpend(). It restores state.rangeMiss on the next statement but it does NOT remove the netEvent('MISS',...) row applyHit emitted at :2707. So on every boot that runs this row the record carries a MISS that cost no round, and the identity ROUNDS_ARE_THE_ROWS is already off by one before a player presses anything. Neither specialist found this; it is why gate 1 cannot be written without it.
-
  - **rowId**: THE_PICTURE_THE_COUNTER_AND_THE_RECORD_AGREE
  - **holds**: At every runClose: bars drawn by --cut === state.mag.rounds (one bar per round, inverting MAG_BAR_TOPS within 0.05) AND sum(mag.cap issued) minus mag.rounds === run.rounds AND run.rounds === |HIT/MISS rows|. Any disagreement voids the run.
  - **redToday**: Both existing magazine gates compare the picture to the variable that drew it and neither reads state.events. MAGAZINE_KEEPS_ITS_FRAME (play.html:4952-4955) literally does state.mag.rounds=n; hudMag(); parseFloat(--cut) — self-referential; ROUNDS_ARE_INSIDE_THE_MAGAZINE (:5370) decodes rasters only. A deck showing seven bars with state.mag.rounds===7 and twenty HIT/MISS rows on the record passes both today, green.
-
  - **rowId**: EVERY_ROUND_HAS_AN_APPROVE
  - **holds**: Every HIT/MISS row in a counted run is preceded, inside the same run window, by an APPROVE decision for the same id with hiApproved:true; in a LIVE room approvedBy !== designatedBy.
  - **redToday**: No gate anywhere asserts this over stored rows. The only runtime defence is applyWorld's peer check at play.html:2364, and it is a log('REJECT',...) refusal explicitly NOT written as a hashed row ("a replay-log refusal, not a hashed row, so an honest peer never forks the hash") — so it leaves no trace a gate can read. And there is no run window to scope "inside the same run" to, so the predicate cannot even be expressed on today's bytes.
-
  - **rowId**: A_RUN_WITHOUT_METRICS_DOES_NOT_COUNT
  - **holds**: No rung may be marked complete unless a stored run row for it carries all four of hits, misses, rounds and ms, with t1 > t0.
  - **redToday**: TRAIN UP ('bounce') writes no terminal row at all — of the three Range drills only downStop (:1033, {ms,hits,misses} — no rounds) and qualFinish (:1040, {hits,rounds,score} — no misses, no time) close with anything. Neither carries all four, the lawn carries none, and nothing in the file refuses to call a rung complete without one.
-
  - **rowId**: REAL_WORLD_IS_LOCKED_BY_THE_RECORD
  - **holds**: The Real-World scenario cannot be constructed unless rungProven() is true for rungs 1-4 from stored rows; no link, menu or query string opens it, and the X-BAT swarm does not load on an empty record.
  - **redToday**: The rung gate is one unsigned integer: progression.ts persists only {reached} (:18, :79), loadProgression clamps any number to 0..3 (:64-75), and unlocked() is i <= reached (:38-42). localStorage.setItem('drone2525.progression','{"reached":3}') opens the last stage with no run, no hits, no rounds. And grep -c 'drone2525.progression' frontend/public/drone-2525/play.html returns 0 — the deck the operator plays never reads the key, so there is no ladder there at all and DD-124's lock does not exist where the player is.
-
  - **rowId**: A_SHOT_NAMES_ITS_CLASS_AND_ITS_SEAT
  - **holds**: Every HIT/MISS row carries data.tcls in {air, ground, incoming, high} and data.seat in the DD-121 seat map; a shot whose seat was not recorded for that class is a wrong-class failure and voids the run.
  - **redToday**: The lawn's eight contacts at play.html:917 carry only id/up/life/lifePct/x/y/z/mist — no class, no kind, no form. There is no seat field on any row (the 95 occurrences of "seat" in the file are prose and the seated-member rule). So DD-124's first named failure, the wrong-class shot, cannot be detected from the record by any means. Implementer's note: name the field tcls, because cls is already a live key on LC4_COLORS (:3184-3187, read at :3514).
-
  - **rowId**: FIVE_LINES_ARE_COMPUTED_NOT_ASSERTED
  - **holds**: Each of the five Shield lines is derived from stored rows or printed UNVERIFIABLE; none may read green from a constant, and the scorecard may not show five greens while any line has no substrate.
  - **redToday**: Four of the five have nothing to stand on. friendly occurs 0 times in all 1,186,355 bytes and there is no asset object, so "Defended assets preserved" is unbacked; tcls does not exist, so three more are unbacked. The append-only record is equally empty: 'misses' occurs 0 times and 'proficien' 0 times in docs/drone-2525/drone-2525.v00.00.json — there is no per-run metric schema to compute against. Any scorecard rendered today would be five assertions.

**Dissent.** FOUR disagreements, resolved as follows. (1) WHERE IT LIVES. Specialist 1 chose localStorage exel-2525-runs as primary; Specialist 2 chose IndexedDB exel-2525-rec, already open at play.html:1477. I side with Specialist 2 as primary and keep Specialist 1's localStorage key as the ladder INDEX only — IndexedDB is durable and already written per sample, while localStorage is a convenience store this file itself treats as droppable in four places. Unanimous on the negative: Supabase is never the proof. (2) THE MAGAZINE CHECK. Specialist 1 proposed it as a new integrity row; Specialist 2 called the picture leg a tautology that can never fail. Specialist 2 is right about the leg and I verified it (MAGAZINE_KEEPS_ITS_FRAME sets state.mag.rounds then reads the cut back, :4952-4955), so the gate binds THREE sources, not two — Specialist 1's row with Specialist 2's reason. (3) I OVERRIDE SPECIALIST 2 on his finding 4. He reports the QUAL cap-10 magazine reading one-third full as a defect contradicting the operator's law, and says "the one rung that counts is the one whose picture contradicts his law". His measurement is correct (cut(10)=66.4%, ten bars of thirty) and his point about magazine-rasters.test.mjs parsing capM[2]=30 is correct. But the conclusion is wrong twice over: the IN-DECK row does exercise cap 10 via its anyCap leg and asserts exactly MAG_BAR_TOPS[20], and one-bar-per-round at any cap is his OWN decision — D-25 "thirty bars, one per round", restated in the code comment at :971 and in CRS_DRONE-2525.md:1101. Writing the integrity check as a fill fraction would make QUAL 40 permanently red against his own word. It is a declared, reversible behaviour, not a defect. (4) I OVERRIDE SPECIALIST 2 on per-row SHA-256 chaining. He is right that fnv1a64 is FNV-1a 32-bit and misleadingly named, and right that crypto.subtle is already in the deck — but every one of its eleven call sites (:3633-3683) is Promise-based and there is no crypto.subtle.digest at all, so a per-row chain makes ev() async and re-flows the file. Seal the RUN at close, keep the synchronous digest for rows, and rename what it is. On Specialist 1's mag field I take before over his after, because magSpend runs after netEvent and only the pre-spend count is honestly available at the row's own moment. UNANIMOUS on: rounds-spent is counted from HIT/MISS rows and never incremented; the run boundary is the real gap and runOpen/runClose are hoisted function declarations beside the rung* family at :6116; a rung is a predicate over rows, not a stored integer; and an absent record must read RED, never blank. NEITHER specialist found the applyHit self-test call at :4462 that breaks the rounds identity on every boot — that is this package's own finding, and it is the precondition for gate ROUNDS_ARE_THE_ROWS being implementable at all.


**Gaps (his word only):**
- LEAK still has no definition from him, so the Advance rung's "leaker" condition cannot be turned into a predicate — that gate is owed and must stay red until he says what a leaker is.
- Whether Real-World's swarm is the paper's nine (three groups of three X-BAT) or the record's 42 decides the "Drone swarm neutralized" denominator. I declare NINE on the evidence that the record's own 42 is a render pass-mark; reversible in one word: "the swarm is forty-two".
- Does a rung's proof have to survive the player clearing their browser? If a cleared or private-mode store is a RESET to rung zero, IndexedDB alone suffices; if a rung once earned must be recoverable, the export at pack()/download() becomes mandatory at the end of every counted run, or Supabase keys he has not yet set. Only he can say.
- SID is 's'+Math.random().toString(36).slice(2,10) — unseeded and unpersisted (play.html:787). Runs cannot be filed under a stable key across a reload until a persisted installation id exists; needed before any of this stores anything meaningful.
- The four defended assets (command post, fuel farm, ammunition transfer point, maintenance cluster) have no objects in the deck and no role field on the record's fourteen buildings — the fifth Shield line stays UNVERIFIABLE until they exist, and which four buildings carry them is his call, not a declaration I should make for him.
- EW is in his source (Pangu's spoof package, FM 3-12 in the back matter) and absent from the DD-124 ladder. A spoof that degrades swarm cohesion changes hits, misses and rounds, so it changes the scorecard — but it has no rung, so it has no metrics row. Owed.

### Enki (FIGHT)

**Invariant.** On the Capitol lawn a defended point can be LOST, a person and a friendly can never be LOCKED, and every gun, threat and sight line obeys ONE ground truth — the record — in both carriers that draw this lawn.


**Decision 1 — The defended set maps as KEEP / WIRE / FIELD LAYDOWN — not as four buildings and not as four bearings** *(vote: summarizer-override; reversible by: "Put them in the buildings.")*

The paper's own geometry is the thing to carry across, not its four nouns: "Outside the wire, fuel bladders, ammo stacks, maintenance bays, and generator rows sat under canvas and starlight." On this site the KEEP is the Capitol, the WIRE is the fence line, and the open ground between them is where a field laydown goes. So A1 COMMAND POST sits in the keep (the south portico), A2 AMMUNITION TRANSFER POINT is the one sourced structure on the open ground (the Extension skylight band), and A3 FUEL and A4 MAINTENANCE are DECLARED field laydowns on the lawn — under canvas, as the paper has them — not re-labelled buildings. Specialist 2 mapped them onto the Visitors Center and the Governor's Mansion, which is the opposite geometry (inside other keeps, one of them outside the bounding streets); Specialist 1 declared bare lawn points chosen only for bearing spread. Neither used the paper's own inside/outside rule. Two sourced, two declared, each declared one reversible in one word.

*Why.* A defended-asset plan is an inside/outside rule. Importing the nouns without the geometry gives four points with no ring law; keeping the geometry gives "outer ring for highest consequence, inner ring for leakers" something to mean.

*Evidence.* git 16a4114ee:docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md:93-94 (the defended set is OUTSIDE THE WIRE) and :144-145 (Athena marks the four in red); :164 the ring law. Only two record structures lie inside CAP_RING 240: capitol and extension-n — visitors is at hypot(180,185)=258.1 m, measured.


**Decision 2 — A1 is the south portico — but the two carriers disagree about where that is by 8.96 m, and that is settled FIRST** *(vote: summarizer-override; reversible by: "The deck's size is right; correct the record.")*

Both specialists named the south door as the command post and neither reconciled the carriers. The record's Capitol core runs to y ±55, its south door is at [0,-55] (deck z +55). play.html:894 puts D-CAP-S at deck z 46.04 and play.html:1301 draws the south face at CAP.NS 44.04 — an 8.96 m drift on the door and a 10.96 m drift on the face, with the comment at :1300 admitting the footprint was "corrected in size to the sourced pair". Siting the command post before choosing a ground truth bakes a nine-metre error into the one asset all three of us agree on. The record is append-only and the deck is editable, so the RECORD is the ground truth and the deck moves to it; if instead the sourced pair is right, the record gets a NEW row saying so, never an edit.

*Why.* Every asset-loss coordinate, every sight line to A1 and every stored run inherits this nine metres. It costs one number today and a data migration after the first stored Real-World run.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json buildings[0] capitol footprint y ±55, door [0,-55]; frontend/public/drone-2525/play.html:894 D-CAP-S z=46.04; :1301 CAP={EW:86.33,NS:44.04,...}; :1300 "corrected in size to the sourced pair". Computed drifts 8.96 m (door), 10.96 m (face), 1.67 m (wing span).


**Decision 3 — A2 is the Extension skylight band — and its low-approach screen is already drawn** *(vote: unanimous; reversible by: "The skylights are not the ammunition point.")*

A2 AMMUNITION TRANSFER POINT = record extension-n, x ±35, y 107..153, heightM 3 → deck centre (0, -130), r 35. It is the only flat, low, fragile roof on the grounds and it is sourced. I measured it seen by 29 of 42 ring stations at 110-325 m; the whole southern arc T01-T07 and T37-T42 cannot see it at all. What neither specialist noticed: the record's north-lawn tree rows stand at x ±150, deck z -90..-270, trunk 4.0 m with canopy to 10.5 m, and they FLANK A2. A small UAS at 8-10 m running those rows is screened from the east and west shoulders on the approach to the ammunition point. That is a second low corridor, already drawn, costing nothing to use.

*Why.* "Protect ammunition" needs an approach a player can lose to. One exists on this site already, in the record, drawn by the deck, and nobody had named it.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json buildings extension-n and treeRows north-lawn-w/e (trunkH 4.0, canopyH 6.5); frontend/public/drone-2525/play.html:1305 CAP_TREES. Visibility 29/42 computed by ray-march of all 42 stations against CAP-X (hx 30, hz 44.04) and WING-X (hx 86.33, hz 20).


**Decision 4 — The threat laydown: four street gates, two low corridors, four notches, twelve standoff roofs — and RAM laid down by ASSET, never by bearing** *(vote: majority; reversible by: )*

Entry moves from the present ±90 m to the record's own bounding streets: SOUTH deck z +250 (11th), NORTH deck z -300 (15th), WEST deck x -230 (Colorado), EAST deck x +230 (Brazos), so every track crosses the gun ring on its way in. LOW CORRIDOR 1 is the Great Walk: walk 7.62 m wide at deck z 57.04..250, allee at x ±28 over deck z 72..240, 14 m trunk spacing, canopy top 9.0 m — a picket, not a wall, where masking is a function of altitude. LOW CORRIDOR 2 is the north-lawn allee onto A2. DEAD GROUND is the four wing/core re-entrant notches plus the north-wall shadow. STANDOFF OBSERVATION is twelve record buildings with roofs at 14-32 m and 258-460 m out — a Sentinel cue that names and never targets. RAM has no axis: a ballistic round's geometry is the defended POINT it is aimed at, so the C-RAM seat is laid down as "which asset is being engaged", with a time-to-impact, never as a bearing. Authoring the Advance rung as three axes makes one of the three nonsense.

*Why.* Today every lawn contact is born inside the defended volume, so there is no approach to detect and the ring law is exactly inverted. The streets, the allee and the roofs are already in the record; using them is free.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json roads (11th y-250, 15th y+300, colorado x-230, brazos x+230) and buildings (12 off-site, heightM 14-32); frontend/public/drone-2525/play.html:1305 CAP_TREES, :1336 the Great Walk at w=3.81, :2962 the six spots, :2969-2974 the four ±90 m axes. Paper 16a4114ee:...:285 "Do not chase every ghost. Stay with defended".


**Decision 5 — OVERRIDE — the TARGET button is not dead on the lawn. It locks a range bullseye standing inside the rotunda** *(vote: summarizer-override; reversible by: "Leave the bullseye on the lawn.")*

Neither specialist found this and it inverts the brief's premise. play.html:2301 adds every ring to the lock pool with NO cap argument: rings.forEach(p=>{ if(p.up===false) return; add(p,'ring',p); }). rings holds one object, BULL-1 at deck (0, 2.2, 26) with up:true permanently (play.html:916) — inside the Capitol core, 214.0 m from T01, in front of every station because all 42 are yawed at the rotunda. With no pop up, which is the normal state, BULL-1 is the only candidate and TARGET succeeds on it. Worse, it MASKS a second false lock: the door fallback at :2308 is only reached when the main pool is empty, and D-11TH sits at deck (0,2,218) — 22.0 m from T01 and 40.7 m from T02 and T42, inside the 70 m door reach, in the Great Walk where the people are. Fix BULL-1 and D-11TH appears. Cap or map-filter both in the same revision.

*Why.* "The Capital cannot be played" is wrong in the way that matters: it CAN be targeted, and what it targets is a range artefact inside the asset and a door in the low corridor. A false positive inside the defended point is worse than a refusal.

*Evidence.* frontend/public/drone-2525/play.html:2301 (no cap passed), :916 (BULL-1 at 0,2.2,26, up:true), :895 (D-11TH at 0,2,218), :2308 (door fallback, dist<70, reached only when the main pool is empty), :1267 (every station yawed at the rotunda). Ranges 214.0 / 22.0 / 40.7 m computed over all 42 stations.


**Decision 6 — OVERRIDE — do not build a friendlies array or a losBlocked(). Both already exist, gated, in the other carrier** *(vote: summarizer-override; reversible by: "The deck is its own world; write it twice.")*

Both specialists grepped only play.html and concluded friendly and occlusion must be authored. They exist. frontend/lib/drone-2525/swarm.ts:22 defines Affiliation = "friendly" | "hostile", :52 sideOf(), :35 PER_SIDE 21, and contest.ts scores survivors and downed by side. frontend/lib/drone-2525/los.ts ships lineOfSight() with terrain AND building-prism occlusion, LosBlock {by:"terrain"|"building", id, atM} and losReason() for the HUD — under its own written invariant "A SHOT THAT THE WORLD BLOCKS IS REPORTED AS BLOCKED, AND BY WHAT" — and components/drone-2525/round.tsx:22,235,275,419 already uses it. The DEM likewise has a consumer and a gate: arena-model.ts:62-78 samples it and draws arena.contours, asserted at tests/drone-arena.test.mjs:34. So the lawn exists TWICE, and the two copies disagree about whether the ground is flat, whether sight lines block, and whether anything is friendly. The plan is a PORT between carriers with one declared ground truth, not an authoring job.

*Why.* The project's own law: "Grep-verify it isn't already shipped… If it exists → REUSE or EXTEND it. Never rebuild it." Authoring a second occlusion rule and a second affiliation into the deck is rework by definition, and the second one would be written under a 42-aircraft frame budget.

*Evidence.* frontend/lib/drone-2525/swarm.ts:22,35,52,71 (initSwarm radiusM default 380 — the outer ring already has a sourced number, between CAP_RING 240 and arena.radiusM 450); frontend/lib/drone-2525/los.ts:3-17,36,73; frontend/components/drone-2525/round.tsx:22,235,275,419; frontend/lib/drone-2525/arena-model.ts:62-78; frontend/tests/drone-arena.test.mjs:34. grep -c "losBlocked|buildArena|makeGroundSampler" play.html = 0; grep for friendly|IVAS|civilian|noncombatant|protected in play.html = 0.


**Decision 7 — The gun count falls out of the siting — and the ladder does not fit on the ring it would fall out of** *(vote: majority; reversible by: )*

I reproduced Specialist 2's result independently on two grids: on CAP_RING 240 with 42 even stations, removing any single gun loses ZERO lawn cells (8 drops sampled, 0 every time, 2155-cell and 2044-cell grids). Real-World's defining failure — "a gun is lost and the next gun that covers its dead ground takes the track" — is therefore unreachable by construction. The record's THREE sourced turrets leave dead ground that is small and NAMEABLE: the four wing/core re-entrant notches and the north-wall shadow. Site to those and the count falls out — the record's three plus a small number of corner guns. Separately the ladder does not fit the 240 ring at all: a south station stands 195.96 m from the south face, so the declared 250 m mark lands at deck z -10, inside the Capitol core, and 300 m lands at z -60, behind the building. At the declared 340 m standoff all six marks fit (deck z +290 down to +40, Capitol as backstop) but the gun then stands 90 m south of 11th Street, in the city block.

*Why.* His own correction: "Forty-two was the even ring. Designing 42 new ones recreates it." A hand-off that cannot fail is not a rung; a ladder whose rungs land inside the building is not a ladder.

*Evidence.* frontend/public/drone-2525/play.html:1256 (CAP_RING=240), :1267 (even 42), :913 (TEAM_N 42). Coverage computed by ray-march against CAP-X/WING-X: 42-ring 2155/2155 and 2044/2044, single-gun loss 0; 3 sourced turrets leave 6-15 cells at the notches and the north shadow (count grid-dependent, location robust). Ladder: 240-44.04 = 195.96 m. I do NOT carry Specialist 2's "north-arc gun has no backstop, rounds run down Congress Avenue" — all 42 are yawed at the rotunda (:1267), so the Capitol is every station's backstop.


**Decision 8 — Eight guns stand in a public street, and the ring's fence is drawn in the wrong hemisphere** *(vote: majority; reversible by: )*

Two siting defects, both one line, both free today. (a) Eight of 42 stations lie outside the kerb line |x| = 230: T10-T13 at x 234.0 / 239.3 / 239.3 / 234.0 and T31-T34 mirrored, i.e. in Brazos and Colorado Street. (b) The fence — the ONLY inside/outside boundary object in the scene, and therefore the carrier of every containment test a defended-asset plan needs — is passed RECORD coordinates straight into prism() with no sign flip, while the lawn beside it is written in DECK coordinates and the streets and trees are explicitly converted. Drawn fence deck z -235..+285 against a lawn of -285..+235: the south rail sits 35 m south of 11th Street and the north rail is 50 m short of the lawn's own north edge. Specialist 1 found (a) and missed (b); Specialist 2 found (b) and I verified both.

*Why.* Every "outside the wire" cue, every gate position and every asset containment test gets measured against a mirrored line and then has to be re-measured. One sign, now.

*Evidence.* frontend/public/drone-2525/play.html:1347 (fence, prism([[-215,-235],[215,-235],[215,285],[-215,285]]) unconverted) against :1333-1334 (lawn deck z -285..235), :1338 (streets converted with -p[i][1]), :1341 (trees converted z=-(y)). Record roads 11th y-250 → deck z+250, 15th y+300 → deck z-300. Station x values computed from :1267.


**Decision 9 — ORDER OF OPERATIONS: move the spawns and cap the pool BEFORE raising any lock cap** *(vote: unanimous; reversible by: "Raise the cap first and move the targets later.")*

The six hard-coded lawn spots are [0,1.2,22], [±12,1.2,18], [0,1.2,-20], [±18,1.2,0] — all six satisfy |x| ≤ 18 < 30 and |z| ≤ 22 < 44.04, i.e. all six stand inside the Capitol's central block, 218.0-222.1 m from the nearest station (which reproduces the observed 222.3 m tap to the metre). Raising the 80 m cap first makes the player lock, approve and fire into the asset he is defending. So: (1) move the six spots to the four street gates and the two low corridors; (2) give rings a finite cap and filter BULL-1 and D-11TH off the Capital map; (3) only then touch the reach caps. Reach is broken in two places, not one: pops 218.0-222.1 m against a cap of 80 (play.html:2303) and drones 148.8-154.0 m against a cap of 120 (play.html:2305). Foils alone are reachable (121.8-159.9 m against 160), so the incoming-round class is the one whose reach already works from the ring.

*Why.* Both specialists reached this ordering from different directions and I measured it. It is the cheapest decision in the package and the most expensive to get wrong: the first thing the player would do after a reach fix is shoot the command post.

*Evidence.* frontend/public/drone-2525/play.html:2962 (the six spots), :1301 (CAP.CORE 30, CAP.NS 44.04), :2301 (rings, no cap), :2303 (pops 80), :2305 (drones 120), :2306 (foils 160), :2940 (asmTick's matching 80 m cap). All ranges computed over the 42 stations of :1267.


**Decision 10 — Cheap now vs expensive later — and the one primitive the paper demands that nobody has listed: the DECOY** *(vote: majority; reversible by: )*

CHEAP NOW, each one array, one sign, one branch, each with a red-first gate available on r.216 bytes: move the six spots out of the building; cap the ring pool (BULL-1) and the door fallback (D-11TH) together; the fence sign; asset and protected ids must never begin with 'C' (applyHit routes isPlate on ref.id[0]==='C' && ref.form into the FROZEN plate path — use A-CP, A-ATP, A-FUEL, A-MAINT, F-nn); assets and persons live in their own arrays lockOn never iterates; rule now that an approval dies with its track and a ripple's remaining rounds are NOT spent (log ROUNDS_UNSPENT), or hits/misses/rounds/time cannot be reconciled; re-check the lane at FIRE, not only at APPROVE; and the DECOY — the paper's attack is "Three fake center. Five compress right. Two dive maintenance corridor", so a contact that costs rounds and time but scores no hit is what makes "do not chase every ghost" measurable with the four metrics already required. EXPENSIVE LATER: a second occlusion rule and a second affiliation in the deck (see the override); per-class reach, since the caps are per-ARRAY not per-seat so "wrong-class shot" has no mechanism today; the asset-loss event, which has no owner, so "the asset is still there when it ends" is unmeasurable; and the nine-metre Capitol drift, which silently re-scores every stored run the day it is fixed.

*Why.* Each cheap item is inside the FREE span list and touches no frozen definition. Each expensive item invalidates stored hits/misses/rounds/time the day it lands — and a run with no valid metrics does not count.

*Evidence.* frontend/public/drone-2525/play.html:2694 (isPlate = id[0]==='C' && ref.form → rangeRun/plateRect/qWorld/LANES, the Range's engine scoring the Capital, DD-35 backwards), :2995 (releaseAuthority('TARGET GONE') on pop expiry), :2303-2306 (per-array, not per-seat, caps), :2962 (the six-spot block, FREE). Decoys: git 16a4114ee:docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md:315; "Do not chase every ghost" :285.


**Gates proposed:**
-
  - **rowId**: NOTHING_ON_THE_LAWN_LOCKS_WITHOUT_A_CAP
  - **holds**: On a Capital unit, every object lockOn admits to the pool carries a finite range cap, and no Range artefact is in the pool at all.
  - **redToday**: play.html:2301 `rings.forEach(p=>{ if(p.up===false) return; add(p,'ring',p); });` passes NO cap, and rings[0] is BULL-1 at deck (0,2.2,26) with up:true permanently (play.html:916) — inside the Capitol core, 214.0 m from T01, in front of every station. The gate asserts every add() on a Capital unit has a numeric cap: it fails on line 2301 today, and a second assertion that no door is lockable from a station fails on D-11TH at 22.0 m from T01 (play.html:895, :2308).
-
  - **rowId**: EVERY_LAWN_CONTACT_IS_OUTSIDE_THE_BUILDING
  - **holds**: No lawn contact spawns inside the Capitol's drawn footprint.
  - **redToday**: All six spots at play.html:2962 — [0,1.2,22], [±12,1.2,18], [0,1.2,-20], [±18,1.2,0] — satisfy |x| ≤ 18 < CAP.CORE 30 and |z| ≤ 22 < CAP.NS 44.04 (play.html:1301). The gate counts spots inside the core box; today it counts 6 of 6.
-
  - **rowId**: EVERY_CLASS_IS_REACHABLE_FROM_ITS_OWN_SEAT
  - **holds**: Every spawn point of every lawn class is within its own class's lock cap of at least one station.
  - **redToday**: pops spawn 218.0-222.1 m from the nearest of the 42 stations against a cap of 80 (play.html:2303) — short by 138-142 m; drones spawn 148.8-154.0 m against a cap of 120 (play.html:2305) — short by 29 m at best. Only foils pass (121.8-159.9 m against 160, play.html:2306). The gate is red on 2 of 3 classes.
-
  - **rowId**: A_LOST_GUN_DARKENS_GROUND
  - **holds**: For every gun, there is at least one lawn cell that goes dark when that gun is removed — so the Real-World hand-off can be failed.
  - **redToday**: On CAP_RING 240 (play.html:1256) with 42 even stations (play.html:1267), removing any single gun loses ZERO cells. Measured on two grids (2155 cells and a 5 m-offset 2044 cells), 8 guns sampled around the ring, loss = 0 every time. The gate asserts max-over-guns(cells lost) ≥ 1; today it reads identically 0.
-
  - **rowId**: ONE_CAPITOL_IN_BOTH_CARRIERS
  - **holds**: The Capitol's south face and south door stand within 1 m of the record's in every carrier that draws them.
  - **redToday**: Record capitol core runs to y ±55 with its door at [0,-55] (docs/drone-2525/drone-2525.v00.00.json); play.html:1301 draws CAP.NS = 44.04 and play.html:894 puts D-CAP-S at deck z 46.04. Drift 10.96 m on the face and 8.96 m on the door — the exact point that becomes the command post. The gate compares the two and fails by ~9 m today.
-
  - **rowId**: A_PROTECTED_CONTACT_EXISTS_AND_NEVER_LOCKS
  - **holds**: At least one protected contact (friendly icon or person) exists on the lawn, it carries the affiliation the project already defines, and lockOn can never return it.
  - **redToday**: grep over all 1,186,355 B of play.html for friendly|IVAS|civilian|noncombatant|protected returns 0 — so the Advance failure 'a friendly icon hit' cannot occur and cannot be gated. The gate's first assertion (a protected contact exists) fails outright. Its second assertion — that the contact's side comes from lib/drone-2525/swarm.ts:22 Affiliation and not a second enum — fails because play.html imports nothing (grep for buildArena|makeGroundSampler|losBlocked = 0).
-
  - **rowId**: THE_FENCE_BOUNDS_ITS_OWN_LAWN
  - **holds**: The drawn fence's extent matches the drawn lawn's extent within 25 m on every edge.
  - **redToday**: play.html:1347 draws the fence from prism([[-215,-235],[215,-235],[215,285],[-215,285]]) with no coordinate flip, giving deck z -235..+285, while the lawn at play.html:1333-1334 spans deck z -285..+235 and the streets at :1338 are converted with -p[i][1]. Both edges are 50 m out, and the south rail lands 35 m south of 11th Street (deck z +250).
-
  - **rowId**: THE_RECORD_RISE_IS_THE_RECORD_GRID
  - **holds**: The arena record's elevation note agrees with its own elevation grid within 1 m.
  - **redToday**: arena.elevation.note says 'The Capitol sits on a rise of about 12 m above 11th Street'. Bilinear interpolation of arena.elevation.grid (9×9 over 900 m, row-major from the NORTH-west) gives 159.33 m at Congress × 11th (0,-250) against 163.00 m at the rotunda — a rise of 3.67 m. The gate fails by 8.33 m. (12 m appears nowhere but the far SW corner, where the grid bottoms at 150.)

**Dissent.** NOT unanimous, and the disagreements are substantive. (1) SUMMARIZER-OVERRIDE ON BOTH, twice. Both specialists grepped only play.html and concluded that "friendly" and occlusion must be authored. Both already ship: lib/drone-2525/swarm.ts:22,52 defines Affiliation friendly|hostile and sideOf(), contest.ts scores by side; lib/drone-2525/los.ts:36,73 ships lineOfSight() with terrain AND building-prism occlusion plus losReason(), and components/drone-2525/round.tsx:22,235,275,419 already uses it. Both also said the DEM is never read — arena-model.ts:62-78 reads it and draws arena.contours, gated at tests/drone-arena.test.mjs:34. The lawn exists in two carriers and they disagree about flatness, occlusion and affiliation; "build it" is rework under the project's own NO-REWORK law. (2) SUMMARIZER FINDING NEITHER HAD: the TARGET button on the lawn is not dead, it is wrong — play.html:2301 adds rings with no cap and BULL-1 (play.html:916) sits inside the rotunda at 214.0 m, up:true forever, and it masks a second false lock on D-11TH at 22.0 m (play.html:895). Both specialists built their plans on "the lawn cannot be targeted". (3) I CORRECT SPECIALIST 2 on one claim and do not carry it: "a NORTH-arc gun firing south has no backstop and its rounds run down Congress Avenue" is unsupported — play.html:1267 yaws all 42 at the rotunda, so the Capitol is every station's backstop. The street concern (8 guns outside the kerb) stands; the backstop sentence does not. (4) MAJORITY, 1+me against 2: the per-asset coverage table (19/29/32/33 with six shoulder stations T08/T09/T10/T34/T35/T36) — I reproduced Specialist 1's numbers exactly — and the second reach defect on drones (148.8-154.0 m vs a 120 m cap). (5) MAJORITY, 2+me against 1: the mirrored fence (play.html:1347), which Specialist 1 missed entirely, and the ladder not fitting the 240 m ring (250 m lands at deck z -10, inside the core), which Specialist 1 never tested. (6) NOT A DISAGREEMENT, a sampling artefact: Specialist 2's 2,224 cells and 14 dead vs my 2,155/15 and 2,044/6 — the grids differ; the zero-single-gun-loss result is robust across both of mine and the dead-ground LOCATION (the four re-entrant notches plus the north-wall shadow) is robust, the COUNT is not, so I carry the location only. (7) A3/A4 SITING: I take neither Specialist 1's bare bearing-spread points nor Specialist 2's refusal to declare; the paper's own geometry puts the field laydown outside the wire and under canvas, which is a third answer.


**Gaps (his word only):**
- THIS WORKING TREE IS BEHIND, AND PART OF THIS QUESTION MAY ALREADY BE ANSWERED. HEAD is b7e1a304e; the Shield paper lands at 16a4114ee and is NOT an ancestor — docs/asks/ holds only the PDF. Both specialists flagged that. Neither saw what I found: e27ab97ba 'Persist DD-126 — Shield in the Sky IS the Real-World scenario, and its placement measured' is also on origin/main, ahead of the paper, and none of the three of us read it. Every paper line I cite is verified by git show against 16a4114ee; every measurement in this package is taken on b7e1a304e bytes. Re-measure on origin/main and read DD-126 before any of this is built.
- LEAK still has no definition from him. The paper gives three usable fragments — 'Inner ring for leakers' (:164), 'Avenger screens likely leakers in the low corridor' (:207), 'Save missiles for leakers with consequence' (:310) — which together suggest: a track that crossed the outer ring un-engaged and is now inside the inner ring on a bearing to a defended point. That is a PROPOSAL, not a decision; his word is owed.
- THE TWO SOURCES CONTRADICT EACH OTHER ON PEOPLE and nobody can gate around it. Paper A's taxonomy lists IVAS/Human as a THREAT row feeding JADC2; his law says 'a person is never a target'. On this site human density peaks exactly along the Great Walk and at the Visitors Center — in the south guns' field of fire — and on the twelve public roofs, where a figure is a lawful observer. His word, before a single protected contact is placed.
- A3 FUEL and A4 MAINTENANCE are DECLARED. Does he accept field laydowns on the open lawn inside the 15th Street and Brazos gates (the paper's 'under canvas', each in its own quadrant, reversible in one word), or does he want the real Capitol Complex Central Power Plant and motor pool surveyed into the record first? Only capitol and extension-n lie inside CAP_RING 240 — visitors is at 258.1 m, outside it — so there is no third sourced option.
- THE PAPER NAMES FIVE THINGS OUTSIDE THE WIRE, NOT FOUR: 'fuel bladders, ammo stacks, maintenance bays, and generator rows' (:93-94) plus the command post (:144). GENERATOR ROWS is in neither the task's defended set nor either specialist's. Four or five?
- REAL-WORLD'S SWARM COUNT IS STILL UNRESOLVED — the record's 42 (perSide 21) against paper A's 'three groups of three X-BAT drones (nine total)'. New datum for the decision: lib/drone-2525/swarm.ts:71 already defaults initSwarm to radiusM 380, which sits between CAP_RING 240 and arena.radiusM 450 — the paper's outer ring already has a sourced number, whichever count he picks.

### Thor (FIGHT)

**Invariant.** A rung is a fact about a stored, re-derivable record of play — never about a pick, a payload, a URL or a button — and the forty-two-ship picture is withheld until that record earns it.


**Decision 1 — The first door is the address bar: the deck wears no lock, and the only ladder that exists is upstream of a plain anchor** *(vote: summarizer-override; reversible by: "the deck is behind the app" — if he puts play.html behind the route instead of beside it, this collapses to one lock.)*

Treat `/drone-2525/play.html` as a public, lockless static file and build the Real-World lock INSIDE the deck, not in React. The only progression ladder in this codebase is `frontend/lib/drone-2525/progression.ts`, consumed by `components/drone-2525/command-ux1.tsx:110`; that component links OUT to the deck with a plain `<a data-drone-play href="/drone-2525/play.html">` at command-ux1.tsx:100. The deck references none of it — `grep -c 'drone2525.progression' play.html` = 0, measured. So every lock placed on the React surface is defeated by typing the URL, and his named surface 'a link' is open today by hosting, not by a bug. Both specialists enumerated the deck's internal writers and neither said this.

*Why.* His three attack surfaces are a link, a menu and a query string. The link is the one that costs nothing to use and is the only one that bypasses the entire existing ladder in a single step.

*Evidence.* frontend/components/drone-2525/command-ux1.tsx:100 (anchor to the static deck), :110 (unlocked(prog,…) — the only ladder call) · frontend/lib/drone-2525/progression.ts:16,18,37 · measured: `grep -c 'drone2525.progression' frontend/public/drone-2525/play.html` = 0


**Decision 2 — The record-forgery door is a BUTTON on the glass, not a devtools paste — #btnPlayLog and #btnEach42** *(vote: summarizer-override; reversible by: )*

Any `recordComplete()` must count only rows that carry neither `sim:true` nor `semantics:'INDEPENDENT_TRIAL'`. `playScenarios` (play.html:5629) loops `state.challenge=ch` at :5640 across every rung and pushes one persisted row per rung at :5657, then `savePerf(list)` at :5664 writes them to `localStorage['exel-2525-perf']` (:5597). `#btnPlayLog` (markup :721, wired :5675) writes six rung rows in one tap; `#btnEach42` (markup :722, wired :5676 → `playEachScenario(42,{sim:true})` → :5626 `for(let ch=0;ch<6;ch++)`) writes 252 rows across all six rungs in one tap. The mitigation is already in the bytes and is checkable: every forged row carries `sim:true` and `semantics:'INDEPENDENT_TRIAL'`.

*Why.* Specialist 2 is right that the record is the cheapest cheese, but understates it by a whole order: the deck ships the forgery as a labelled UI button. A lock that reads 'does this store have rung rows' is opened by a tap, with no console and no knowledge.

*Evidence.* play.html:721, :722 (markup) · :5675, :5676 (wiring) · :5626 (six-rung driver) · :5629, :5640, :5657, :5664 (the row writer) · :5593-5597 (the store) · measured: `semantics:'INDEPENDENT_TRIAL'` occurs 2×, `sim:!!sim` 1×


**Decision 3 — The swarm: the forty-two-ship PICTURE already loads on an empty record; the X-BAT FIGHT does not exist** *(vote: summarizer-override; reversible by: )*

Both specialists are half right and I arbitrate between them. `grep -ci 'x-bat' play.html` = 0, measured — Specialist 2 is correct that there is no X-BAT loader. But `SWARM` is a module-level const of 42 craft (play.html:5715), `drawSwarm` (:5728) is called from exactly one production site, :2100, gated only by `chNum()!==0` plus a segment-budget test, and it writes `42 · n/cap segs first` into `#swTxt` (:5738, element :653) — Specialist 1 is correct that the picture is already on the glass the moment the player leaves the Range. The craft are in no array `lockOn` reads (:2302-2306 reads pops, platesHere, drones(12, :1212), foils(6, :1213), rings, buoys), so they are scenery, not targets. Build the lock on the DRAW, not on a loader that does not exist: on his phone a 42-ship formation over the lawn is a load, whatever the engine thinks of it.

*Why.* His words are 'the X-BAT swarm must not load, on an empty record'. A gate written against an absent loader goes green vacuously, which breaks his gate law; a gate written against :2100 is red today and stays meaningful when the fight is built.

*Evidence.* measured `grep -ci x-bat` = 0 · play.html:5715 (SWARM 42), :5728 (drawSwarm, segments only), :2100 (sole production call site, `if(chNum()!==0){ … drawSwarm(…) }`), :5738/:653 (#swTxt) · :2302-2306 (what lockOn reads) · :1212, :1213


**Decision 4 — The fourth surface he did not name: a peer sets your rung over the wire, unvalidated — and the lobby does the same** *(vote: unanimous; reversible by: )*

Route both wire writes through the admitting door. `applyWorld` takes the rung straight from a remote payload: `if(pay.challenge!=null)state.challenge=pay.challenge;` at play.html:1879 — no clamp, no whitelist, no type check. Two lines below, :1886 explicitly refuses an imported approval, so the file already knows this payload is untrusted and the rung was simply left out. `lobbyLaunch` does the same from peer data at :3421/:3424. `challengeSpec()` clamps only on READ (:804), so a payload of 9 leaves `state.challenge===9`: every `+state.challenge===0` test (:2299, :2755, :2984) reads false while `chNum()!==0` draws the swarm.

*Why.* This is the only surface that needs no action at all from the player, and it is absent from his list of three. Unanimous across all three of us, independently measured.

*Evidence.* play.html:1879, :1886, :3421, :3424, :804, :778 · contrast :5885-5886 where the QR path hard-sets challenge 0


**Decision 5 — The boot self-test reaches CH5 and is not exception-safe — four counter-examples prove it is an omission, not a convention** *(vote: unanimous; reversible by: )*

Restore the rung in the boot catch and wrap the CH5 row in a `finally`, in the same revision as the lock. `toolSelfTest()` is called at play.html:5684 inside `try{…}catch(e){…}` that restores `qaArmed`, `qa`, `outcomes` and `linkMute` — and NOT `state.challenge`, NOT `state.lobby.phase`. The CH5 row at :4717 is a bare block: `const c0=state.challenge; state.challenge=5; … fireN(1); …` restoring on the NEXT statement at :4718. Measured: exactly four rung-borrowing rows DO use `finally{ state.challenge=… }` — :5323, :5338, :5396, :5552 — so the author knew the pattern. A throw in `fireN`, `aimPlate` or `plateRect` (all free, none in tests/range-spans.json) between :4717 and :4718 finishes boot at CH5 with `lobby.phase='LIVE'` and the swarm drawing, and the player sees only 'QA THREW'.

*Why.* He named three surfaces; the boot harness is a fourth that needs no player at all. Both specialists found it independently and I confirm it line by line.

*Evidence.* play.html:5684 (catch restores four fields, not the rung) · :4717-4718 (bare block, next-statement restore) · finally counter-examples at :5323, :5338, :5396, :5552 · frontend/tests/range-spans.json: 100 keys, fireN/lockOn/designate/applyHit absent


**Decision 6 — The query string is closed today and opens in r.211 — the gate ships in the same revision as the reader** *(vote: majority; reversible by: "the share link opens the Range only" — drop the ?map= emit and the surface never opens.)*

Write the `?map=` gate into r.211, not after it. There are exactly three query readers in the whole deck: `diag=1` (:1088) and `range`+`mode` (:5929) — measured, that is the complete set. `?range=` is safe only because `enterTheRange` hard-sets `state.challenge=0` and `_selCh=0` (:5885-5886), clamps the lane to 1..42 (:5880) and whitelists mode to three values (:5881). But `shareUrl` ALREADY EMITS `?map=capital&station=N&role=turret&mode=…` when off the Range (:9031), so today's share QR is a broken promise that falls through to CH0, and the instant r.211 adds the reader, `?map=capital` is by construction a rung-1 entry from a URL with no record.

*Why.* Specialist 2 says the query string is the best-defended door; that is true today and false the day the reader lands. I side with Specialist 1 on the forward risk, because the share sheet is already writing the key.

*Evidence.* play.html:1088, :5928-5929 (the complete reader set) · :9031 (shareUrl writes ?map=&station=) · :5880-5886 (enterTheRange's three clamps) · :9030 comment: "The ?map= reader lands with the ladder (r.211)."


**Decision 7 — practiceNoRoom is the precedent the lock should copy — and the loophole map** *(vote: summarizer-override; reversible by: )*

Shape `rungAdmit()` on the one ladder-shaped guard the deck already has. `practiceNoRoom` (:3432-3434) refuses a solo player any non-zero rung: `if(ch!==0){toast('PRACTICE ALONE IS CH0 ONLY · PICK CH0 TRAIN, OR ENTER THE WAITING ROOM FOR CH'+ch);return false;}`. It refuses, it names the next action, and it is a free (unfrozen) definition. The loophole is that the SAME `state._selCh`, set by the intro buttons at :361-364 via :5910, reaches live through `lobbyLaunch` (:3424) and `window.beginReh` (:5993) with no equivalent check. Neither specialist named this guard, and it is the reason the lock does not need inventing — only extending to the two paths that skipped it.

*Why.* NO REWORK. A guard that already exists, in his voice, on the right surface, is the primitive; forking a second one is the defect the R-CORE law names.

*Evidence.* play.html:3432-3434 (the guard) · :361-364 + :5910 (_selCh set) · :3424 (lobbyLaunch, no check) · :5993 (beginReh, no check)


**Decision 8 — window.beginReh has no caller — both specialists list it as a player door and it is not one** *(vote: summarizer-override; reversible by: )*

Correct both colleagues on the record. `grep -n beginReh play.html` returns exactly ONE hit, the assignment at :5993; there is no `onclick="beginReh"` in the markup and no internal call. It is reachable only from the console or a `javascript:` URL, so it is a door for an operator with devtools, not a door a player taps. It still must go through `rungAdmit()` — a window-exposed rung writer is precisely the kind nobody thinks of — but it must not be ranked alongside #chLvl and #modePick when he reads the list.

*Why.* A package that inflates the taps he is exposed to is as useless as one that hides them. He tests on a phone; a console-only door is a different class of risk and should be labelled as one.

*Evidence.* measured: `grep -n "beginReh" frontend/public/drone-2525/play.html` → 5993 only · window-exposed set is small and complete: :5750 PARITY, :5812 CONTROLS, :5991 showScr, :5992 cinStep, :5993 beginReh


**Decision 9 — Five of the six failure conditions have no vocabulary; the sixth is detectable only because it is a bug, and the bug has a free cheese** *(vote: unanimous; reversible by: )*

Do not write failure gates before the nouns exist. Measured over play.html, case-insensitive: friendly 0, asset 0, ripple 0, salvo 0, shoot-look 0, sector 0, Avenger 0, Sentinel 0, Patriot 0, C-RAM 0, M-SHORAD 0, ammunition 0, 'command post' 0, hostile 0 ('fuel' 1 is the identifier `fueL` at :1019; 'leak' 2 is prose at :5333 and :6287). `pops` carry `{id,up,life,lifePct,x,y,z,mist}` (:917) and turret `units` carry `team:'CAP'` (:913) — no class on a target, no side on a target, no class on a seat. Only F4 (a threat no gun can lock) is detectable, and only because it is manufactured: `lockOn` caps lawn pops at 80 m (:2303) while Range silhouettes get 340 (:2300, :2304) and `asmTick` repeats it (:2940). Its cheese is free and I verified it line by line: the MAP tap at :4232 calls `designate(…)` directly, and `designate` (:2256-2264) has NO distance test and NO class test — only roundOpen, lane and up/lifePct — so MAP view plus a tap marks a 222 m lawn pop the TARGET button refuses.

*Why.* His law is that every invariant gets a gate shown red first. An invariant over a noun the file does not contain cannot be shown red on today's bytes; it would go green vacuously, which is Specialist 2's correct and central point. F2 is the one partial exception — FIRE on an amber box writes `decide('REJECT',…,{reason:'AMBER_NO_APPROVE'})` at :2746 — but every refusal returns above `magHasRound()` (:2752), so the file's own comment is accurate: 'The refusal costs nothing', and a player can spam FIRE on a held track forever without moving 'rounds spent'.

*Evidence.* measured grep counts as listed · play.html:917, :913 (no class, no side) · :2303 vs :2300/:2304, :2940 (the 80/340 split) · :4232 (map tap → designate) · :2256-2264 (designate: no cap, no class) · :2746, :2752 (refusal order) · the side primitive exists but is unwired: frontend/lib/drone-2525/swarm.ts `sideOf`, gated by tests/drone-swarm.test.mjs:26


**Decision 10 — A ripple gate reads the magazine delta, never a call count — magSpend is frozen at one round** *(vote: majority; reversible by: )*

When DD-121's ripple lands, assert `mag.rounds` BEFORE minus AFTER across one approval. `magSpend()` decrements exactly one (`state.mag.rounds=Math.max(0,(state.mag.rounds|0)-1)`, :960) and `magSpend` IS in the frozen manifest — verified directly against frontend/tests/range-spans.json, 100 keys, `magSpend` present. So a ripple cannot be built by changing the spending primitive; it must call it n times, and the only honest proof that it did is the counter's delta and the magazine picture that follows it (his law: 'the magazine picture must match the rounds').

*Why.* Specialist 2 reached this and Specialist 1 did not address it; I verified the freeze myself rather than taking it. It is the one failure condition whose gate shape is already decided by DD-35, before anyone writes a line.

*Evidence.* play.html:960 (magSpend, −1) · frontend/tests/range-spans.json contains magSpend among its 100 pinned definitions (measured) · hudMag :966-972 drives #magRounds and #magFill from `m.rounds`


**Gates proposed:**
-
  - **rowId**: RUNG_HAS_ONE_ADMITTING_DOOR
  - **holds**: A hoisted `function rungAdmit(want,how)` exists at the end of inline script #1 (never const — the r.208 temporal-dead-zone class, recorded at play.html:6070 and :6115), and it consults `recordComplete()` before it admits anything above the Range.
  - **redToday**: Measured on r.216 (b7e1a304e) by running the predicate read-only: `/function\s+rungAdmit\s*\(/` matches 0 times and `/function\s+recordComplete\s*\(/` matches 0 times. FAIL on both assertions today.
-
  - **rowId**: NOTHING_SETS_THE_RUNG_BEHIND_ITS_BACK
  - **holds**: Every assignment to `state.challenge` is either marked `/*RUNG*/` as an admitted write or is a restore of a saved value; the unmarked count is zero.
  - **redToday**: Measured: `state.challenge=` (assignment, not comparison) occurs 40 times in play.html; `/\*RUNG\*/ state.challenge=` occurs 0 times. The 40 include the unvalidated wire write at :1879, the lobby write at :3424, the free picker at :5855, pickScenario at :6109, beginReh at :5993 and the self-test's CH5 write at :4717. FAIL: 40 unmarked writers, 0 admissions.
-
  - **rowId**: THE_SWARM_NEEDS_THE_RUNG
  - **holds**: The forty-two-ship picture draws only inside a rung test: the single production call site carries a `rungAdmit(...)` term alongside `chNum()!==0`, and `drawSwarm` still has exactly one definition and one call.
  - **redToday**: Measured: `drawSwarm(` occurs 2 times (one definition :5728, one call :2100) and the predicate `/rungAdmit\([^)]*\)\s*&&\s*chNum\(\)!==0[^]{0,200}?drawSwarm/` is false. The call site reads `if(chNum()!==0){ … drawSwarm(…) }` with no rung term, so the 42 ships paint on CH1 for a first-time player. FAIL.
-
  - **rowId**: THE_RECORD_IS_NOT_THE_DECKS_OWN_SIM
  - **holds**: `recordComplete(rung)` counts only stored rows that carry neither `sim:true` nor `semantics:'INDEPENDENT_TRIAL'`, and re-derives each row's `replayHash()` from its stored events, refusing any row whose hash does not reproduce.
  - **redToday**: Measured: `recordComplete` occurs 0 times. The only durable store is `exel-2525-perf`, read with a bare `JSON.parse(localStorage.getItem(...)||'[]')` at :5593 and written at :5597 with no signature and no hash re-derivation; `#btnEach42` (:722 → :5676 → :5626) writes 252 rows across all six rungs in one tap. FAIL: no predicate exists, and the store it would read is forgeable by a labelled button.
-
  - **rowId**: A_THROWN_SELF_TEST_LEAVES_NO_RUNG
  - **holds**: The boot catch at the `toolSelfTest()` call site restores `state.challenge` and `state.lobby.phase` from the pre-boot snapshot, and every rung-borrowing row inside the self-test restores in a `finally`.
  - **redToday**: Measured: the predicate `/catch\(e\)\{[^}]*state\.challenge\s*=/` is false — the catch at :5684 restores qaArmed, qa, outcomes and linkMute only. The CH5 row at :4717 sets `state.challenge=5` and `lobby.phase='LIVE'` and restores on the next statement at :4718, with no `finally` within 1,400 characters (measured false), while four other rows do use one (:5323, :5338, :5396, :5552). FAIL.
-
  - **rowId**: THE_DECK_ASKS_THE_SAME_LADDER_AS_THE_ROUTE
  - **holds**: The deck consults the same stored ladder the React route consults — one key, one predicate, read by both `components/drone-2525/command-ux1.tsx` and `public/drone-2525/play.html`.
  - **redToday**: Measured: `grep -c 'drone2525.progression' frontend/public/drone-2525/play.html` = 0. The deck's only localStorage keys are `exel-2525-sets` (:869), `exel-2525-soak` (:1656), the voice key (:4060-4061) and `exel-2525-perf` (:5593-5597); not one carries a rung, hits, misses, rounds spent or time. The route links straight out to the lockless deck at command-ux1.tsx:100. FAIL — two surfaces, one ladder, and the deck is not on it.
-
  - **rowId**: A_QUERY_STRING_NEVER_NAMES_A_RUNG
  - **holds**: Every query reader in the deck resolves its rung through `rungAdmit()`, and the React surface's joiner path excludes the top of the ladder by name rather than short-circuiting above it.
  - **redToday**: Measured two ways. In the deck, `?map=` and `?station=` are emitted by shareUrl (:9031) and read by nothing — the complete reader set is `diag=1` (:1088) and `range`+`mode` (:5929) — so the assertion is vacuously green there TODAY and goes red the moment r.211 adds the reader; that is why it ships with the reader. On the React surface it is red NOW: `command-ux1.tsx:69` sets `isJoiner` from `/[?&]crew=/.test(window.location.search)` and `progression.ts:38` is `if (isJoiner) return true;` above the ladder check, so `?crew=1` opens every stage including LAST_STAGE on an empty record, and tests/drone-progression.test.mjs:31 currently pins that as desirable. FAIL.
-
  - **rowId**: THE_CAP_IS_ONE_RULE_FOR_TAP_AND_BUTTON
  - **holds**: A target's reach is decided in one place: the map tap and the TARGET button admit and refuse exactly the same targets at the same distances.
  - **redToday**: Measured: the map tap at :4232 calls `designate({…},SID)` directly, and `designate` (:2256-2264) has no distance test and no class test — only roundOpen, lane and up/lifePct — while the TARGET button goes through `lockOn`, which caps lawn pops at 80 m (:2303) against Range silhouettes at 340 (:2300, :2304); `asmTick` repeats the 80 m cap at :2940. A tapped lawn pop at 222.3 m locks; the same target refuses from the button. FAIL — two rules, and the lenient one is reachable by switching view.

**Dissent.** Real, and on three points. (1) THE SWARM — a direct clash. Specialist 1: "the X-BAT swarm is ALREADY loading… the thing it was meant to withhold is already on the glass." Specialist 2: "there is no Real-World rung, no X-BAT loader… any gate phrased as 'the swarm does not load' passes today for the wrong reason." I measured both and OVERRODE BOTH, taking half from each: `grep -ci "x-bat" play.html` = 0, so Specialist 2 is right that no X-BAT fight exists; but `drawSwarm` is called at :2100 behind nothing but `chNum()!==0`, so Specialist 1 is right that the 42-ship picture paints on CH1 on an empty record. The craft are in no array `lockOn` reads, so they are scenery. The gate therefore binds the DRAW at :2100 — red today — not an absent loader. (2) THE QUERY STRING — Specialist 2 calls it "the best-defended door in the deck" and says hardening it would harden a shut door; Specialist 1 says the gate must land in the same revision as r.211's reader. MAJORITY: Specialist 1 and I, because `shareUrl` at :9031 is already emitting `?map=capital&station=N`. I also found the one query-string unlock that IS red today and that neither named: `?crew=` at command-ux1.tsx:69 feeding `progression.ts:38 if (isJoiner) return true;`. (3) THE DOOR COUNT — Specialist 1 says five doors, Specialist 2 says forty writers and four player doors. Both enumerations are incomplete and I override both: they missed the address bar (the deck is a static public file and the only ladder sits upstream of a plain `<a href>` at command-ux1.tsx:100) and they missed `#btnPlayLog`/`#btnEach42`, which walk every rung and write up to 252 persisted rows in one tap. Both also list `window.beginReh` as a player door; measured, it has no caller — console only. Smaller agreements worth recording as unanimous: the unvalidated wire write at :1879, the lobby write at :3424, and the exception-unsafe CH5 row at :4717-4718 were found independently by all three of us.


**Gaps (his word only):**
- THE RECORD IS DEVICE OR PERSON — both specialists ended on this and I will not guess either. If the rung lives in localStorage it is forged by one devtools paste AND by one press of #btnEach42 (:722/:5676), and his own new phone drops him back to Training with his proficiency gone; if it lives on the wire it needs a signature the deck can check, and the lawn stops being a file that fetches nothing. Every line of rungAdmit() follows from his one word.
- LEAK HAS NO DEFINITION FROM HIM, and 'Shield in the Sky' uses it twice in two different senses — Aset's ring law ('Inner ring for leakers') and Athena's assignment ('Avenger screens likely leakers in the low corridor'). Until it is a measurable condition — a track that crossed a named line with no gun on it — it cannot be a failure row and must not be gated.
- EW IS IN HIS SOURCE AND NOT IN HIS LADDER. Pangu's spoof package degrading swarm cohesion has no rung, no seat and no fire mode (Sentinel never wears one). FM 3-12 is named in the paper's back matter for the first time in this project. Owed: does EW sit on the Sentinel's cue, or is it a sixth rung?
- WHETHER REAL-WORLD'S SWARM IS 42 OR NINE. The record says swarm.total 42 / perSide 21; the deck's SWARM is 42 (:5715); tests/drone-swarm.test.mjs:21 pins PER_SIDE 21 and SWARM_N 42; deck conformance row C10 at :5782 pins swarmN()===42. The paper says 'three groups of three X-BAT drones (nine total)'. Changing 42 breaks two live gates and edits an append-only record, so 42 stands until he says otherwise — but the paper's nine reads as the shape of ADVANCE ('several groups, not yet a swarm'), which DD-124 already describes.
- THE FOUR METRICS HAVE NO STORE. He requires hits, misses, rounds spent and time per rung, and 'a run with no metrics does not count'. The Range tracks them in-session (state.qualH, state.qualExpired, state.qualR, state.qualT0 at :978-980) and NOTHING persists them: exel-2525-perf rows carry scen/ch/score/hash/sssesCore, not his four. Until that store exists, recordComplete() has nothing truthful to read.
- THE SEAT MAP HAS NO VOCABULARY. Avenger, Sentinel, Patriot, C-RAM, M-SHORAD all occur zero times in play.html; pops carry no class and units carry no seat class. Four of the six failure conditions cannot be shown red on today's bytes and so cannot be gated yet. The friendly/hostile primitive already exists and is gated in frontend/lib/drone-2525/swarm.ts (sideOf, tests/drone-swarm.test.mjs:26) — unwired to the deck. Wiring that is the smallest honest first step, and it is a revision of its own.

### Odin (FIGHT)

**Invariant.** No track on the Capitol lawn is ever left with no gun that can take it: every place a target may stand is seen by at least two guns that can reach it from open ground, and when one gun goes out a named survivor is handed that track, on the record, before the window closes.


**Decision 1 — A gun is LOST as ctrl='OUT' — disabled, scripted, recoverable — and glyph() must be touched in the same edit or a dead gun reads as a crewed one** *(vote: majority; reversible by: "a lost gun is gone" — then OUT becomes a delete and the record's defences.note is appended with his correction.)*

Add a fourth value 'OUT' to the existing units[id].ctrl field (today 'HI' | 'AI' | 'SH', play.html:1981, :2835-2836, :2056). A gun goes OUT only when the scenario row says so at a declared time, or when a hostile track reaches its station ring — never randomly, because a random loss cannot be replayed to the same verdict and the four stored metrics would not mean the same thing twice. It comes back after a declared recovery window, because the record already forbids deletion: defences.note says 'a defeated aircraft is DISABLED and flown down under control, never deleted in the air. Battle House: it comes back, it is not exterminated.' CRITICAL and missed by both specialists: glyph(ctrl) at play.html:1981 is `ctrl==='AI'?'◬':ctrl==='SH'?'♡':'웃'` — an unrecognised value falls through to the HUMAN glyph, so adding 'OUT' without editing glyph() in the same edit makes every lost gun render on the map as a human-crewed gun. Under the symbology law (docs/security-2525/eXeL-STD-2525.md: friendly equipment = circle, air defence = upward arc 'dome') the mark is the same friendly circle with the dome arc BROKEN — one stroke removed, no fourth Trinity symbol.

*Why.* The record's own survivability law is 'disabled and recovered', and the only loss code in the repo (swarm.ts:138, s.alive[i]=0) is deletion. Copying that pattern for guns would break the record on day one, and the glyph fall-through would do it silently.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json defences.note; frontend/lib/drone-2525/swarm.ts:137-139; frontend/public/drone-2525/play.html:1981 (glyph fall-through), :2835-2836 (ctrl flip), :2056 (map draws id+glyph); measured ctrl vocabulary in the deck is exactly AI/HI/SH (grep over 1,186,355 B).


**Decision 2 — Dead ground is REACH first and masking second — the dominant term is siting, not terrain** *(vote: summarizer-override; reversible by: )*

Define dead ground for a station as: range < 5 m, or range > the one declared reach, or the sight line masked by terrain or a building prism. Compute it with the record's 9x9 DEM and its 14 building prisms, not with the Capitol footprint alone. I re-implemented frontend/lib/drone-2525/los.ts:36-58 against the record over 6,012 open-ground samples at 1.8 m AGL and decomposed the result: t-south dead 49.2% total, of which out-of-400 m is 39.6% and masked-while-in-range is only 9.6%; t-west 53.3% / 39.8% / 13.5%; t-east 51.8% / 39.2% / 12.6%. Reach is roughly four times the masking term, and reach is a pure function of where the gun stands. So 'how dead ground is computed from the siting' is the right question after all — the siting IS the dominant input.

*Why.* Specialist 2 challenged the question's premise, saying dead ground comes from terrain rather than siting. His LOS-only numbers replicate mine to within 0.2 percentage points (41.7/35.9/33.9 against his 41.9/35.8/33.7) — but he omitted the range gate the record itself declares, and with it applied his conclusion inverts.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json gimbal.rangeM 400 / nearM 5 / slewDegPerSec 45, arena.elevation (9x9, spanM 900), buildings[14]; measurement script /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/odin_cov.py and /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/odin2.py re-implementing frontend/lib/drone-2525/los.ts:36-58.


**Decision 3 — A RING IS THE WRONG PRIMITIVE AT EVERY COUNT — Specialist 1's 344 m six-gun ring puts two of its six guns INSIDE buildings** *(vote: summarizer-override; reversible by: )*

Reject ring siting outright, at 3, 6, 42 or any n. Measured against the record's 14 footprints: a station on a 344 m ring at n=6 lands at (298,-172), which is inside the INSURANCE ANNEX (e[289,331] n[-201,-169]), and at (-298,-172), inside the PRICE DANIEL SR. BLDG (e[-326,-274] n[-205,-165]). The same two collisions occur at S=340, 344 and 360 for n=3, 6, 12 and 42. That is why my full-record orphan audit gives worst-single-loss 18/18 at S=344 n=6 where Specialist 1 reported 1/18: his mask was the deck's CAP_FP alone with no terrain and no state office buildings, so he never saw two of his guns standing in offices. The three SOURCED turrets at [0,-210], [-210,0], [210,0] are the only siting in evidence that is physically valid — all three are on open ground. The siting must be SOLVED against the mask and the count emitted; a greedy solve over 486 open-ground candidates reaches 98.5% two-cover of the lawn at 13 sites, and 1.5% of the lawn is coverable by no candidate at all, which means the law is 'a target may only stand where two guns reach it', not 'cover every point'.

*Why.* The operator already corrected this exact error in these words: 'Forty-two was the even ring. Designing 42 new ones recreates it.' Choosing six on a ring is the same mistake with a smaller number. A ring is rotationally symmetric; the Capitol block is not.

*Evidence.* Measured: /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/odin7.py (ring stations inside footprints) and odin4.py (worst-single-loss sweep, full record LOS); docs/drone-2525/drone-2525.v00.00.json buildings[9] insurance, buildings[7] price-daniel, turrets[3]; frontend/public/drone-2525/play.html:1256 CAP_RING=240, :1262-1269 restoreCapitolTurrets.


**Decision 4 — The covering gun is CHOSEN BY THE MACHINE and TAKEN BY THE PERSON — and the ranking already exists as autoAim** *(vote: majority; reversible by: "I pick which gun covers" — coverOf becomes a ranked list on the glass and the pick itself becomes a decide() row.)*

This answers Specialist 1's open question. coverOf is not new code: frontend/lib/drone-2525/ai-crew.ts:80-95 already ranks candidate shots by lineOfSight-clear AND nearM <= range <= rangeM, sorted by smallest |shortestTurn| from current azimuth, returning a plain-words 'why'. Port that ranking with the eye swapped to each surviving station. The machine PROPOSES the ranked survivors and names the best one; the human takes the seat and then presses TARGET, APPROVE, FIRE. The seat choice is not itself a shot, so making the machine propose it does not touch the authority invariant ('a named human decision exists before any machine shot; silence is never consent at any level') — and jumpToTurret already toasts 'SEAT T26 · OPERATOR', which is the human's own act. Ties break by lower station number so the replay is deterministic. An empty survivor set returns null, which is an ORPHAN and must be impossible by siting, not resolved at runtime.

*Why.* NO REWORK: ai-crew.ts already holds the machine to the same optics as the person, with a comment recording the walkthrough that caught it asking to shoot a door 453 m away through a 400 m sensor. Building a second ranker would recreate exactly that divergence.

*Evidence.* frontend/lib/drone-2525/ai-crew.ts:80-95 (ranked by turn, filtered by reach.clear && inRange); docs/drone-2525/drone-2525.v00.00.json authority.invariant, gimbal.slewDegPerSec 45; frontend/public/drone-2525/play.html:2817-2830 jumpToTurret.


**Decision 5 — grantControl CANNOT record a handover today — it discards the reason for every turret** *(vote: summarizer-override; reversible by: )*

Specialist 1's central claim — that the handover is `grantControl(coverId,'COVER '+lostId)`, one existing call with a new reason string, writing ev('GRANT',id,by) and mirroring over linkSend — is FALSE for turrets, which is the only kind the lawn has. play.html:2833 is `if(units[id]&&units[id].kind==='turret'){ jumpToTurret(id); return; }`. It returns before the ev() and before the linkSend. jumpToTurret writes ev('GRANT',id,'MAP') with the reason hardcoded, and sends nothing to peers. So a turret handover today writes a row that says 'MAP' no matter why it happened, and no other device learns of it. The handover revision must put the row and the peer mirror on the turret path — both functions are FREE (verified against tests/range-spans.json) — before any gate can read a handover off the record.

*Why.* A survivability rung whose central event is indistinguishable on the record from a player tapping the map is not auditable, and 'each rung completes only with four metrics stored' cannot be satisfied by a row that does not know what happened.

*Evidence.* frontend/public/drone-2525/play.html:2832-2834 (grantControl early return), :2817-2830 (jumpToTurret, ev('GRANT',id,'MAP'), no linkSend), :2843-2844 (the ev+linkSend that turrets never reach); frontend/tests/range-spans.json — neither grantControl nor jumpToTurret is pinned.


**Decision 6 — What the player sees reuses the map and the three presses — but marksPersist() must reach the lawn first or the taker's buttons stay dark** *(vote: unanimous; reversible by: )*

No new screen. The lost gun's glyph becomes the broken dome; its marks release; one toast names the taker in the deck's own voice ('TURRET WEST IS OUT · TURRET EAST COVERS ITS GROUND · TAKE T26'); the player picks that station on the existing canvas map and presses TARGET, APPROVE, FIRE. The handover changes WHO, never the three presses. The hard prerequisite: marksPersist() is `chNum()===0 && !LIVE` (play.html:2722), so OFF the Range markUnderBullseye() short-circuits and the lit button, the recital and the amber silhouette are all dead — on the lawn today the taker's TARGET button would not light at all. marksPersist is FREE; extending it to the lawn is part of the handover revision, not a separate nicety. Second prerequisite in the same revision: the six lawn spots at play.html:2962 are (0,22), (±12,18), (0,-20), (±18,0), every one of which is inside the deck's own Capitol footprint (core |x|<=30, |z|<=44.04 at :1301-1302) — move them onto real lawn BEFORE line-of-sight lands, or every lawn shot will be refused as 'TEXAS CAPITOL in the way' and will read as a regression the handover introduced.

*Why.* Both specialists reached this independently from different directions, and it is the one place where 'prefer removing complexity over adding it' is fully satisfiable: every element already exists.

*Evidence.* frontend/public/drone-2525/play.html:2722 marksPersist, :1055 markUnderBullseye, :2052-2056 drawMap (FROZEN under movedSpans r.216), :1990 pickMap (FROZEN), :2817 jumpToTurret (free), :2962 six lawn spots, :1301-1302 CAP/CAP_FP.


**Decision 7 — The cost of nobody taking the track is a MISS and a dead asset — but today ONE expiry silently drops EVERY mark in the room** *(vote: summarizer-override; reversible by: )*

Declare the cost as: the record's up-window (targets.upMs 14000) expires into a MISS row against the four stored metrics, and if the track was on a defended asset the Real-World failure 'the asset is still there when it ends' fires. Then fix what makes that cost uncountable: play.html:2995 calls releaseAuthority('TARGET GONE') when the DESIGNATED pop expires, and releaseAuthority at :6016-6019 does `state.tgtSlot={}` — it wipes EVERY marked slot, not the one that expired. On the Range with one mark that is invisible. On Real-World, with several groups across all three classes up at once, one expiring track drops all nine marks and the player's whole picture. Neither specialist raised this; I am adding it over both, because it is the single defect that makes the Real-World rung unplayable the moment multi-track lands, and it will present as 'the boxes keep disappearing' rather than as a bug anyone can name.

*Why.* Specialist 2 correctly noted that overloading 'TARGET GONE' makes a LOST GUN and an EXPIRED TARGET indistinguishable on the record. The deeper fault is worse: the handler is not scoped to one track at all.

*Evidence.* frontend/public/drone-2525/play.html:2995 (pops expiry → releaseAuthority('TARGET GONE')), :6016-6019 (releaseAuthority sets state.tgtSlot={} and clears desig, hiApproved, pending for all), :2265-2268 + :2230 (the per-slot store and painter that already support many tracks); docs/drone-2525/drone-2525.v00.00.json targets.upMs 14000.


**Decision 8 — Real-World is NINE HOSTILE X-BAT in three groups; forty-two stays the render budget** *(vote: unanimous; reversible by: "Real-World IS the forty-two" — then nine becomes a sub-rung and the swarm row is appended again.)*

The two documents never disagreed and neither needs editing. The paper says verbatim 'countering swarms of three groups of three X-BAT drones (nine total)', and X-BAT is the THREAT there ('Countering X-BAT Swarm Threats') — that is an ENGAGEMENT count. The record's swarm block is total 42, perSide 21, sides [friendly, hostile], with a passMark that is explicitly a rendering budget: '42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times' — and its hostile count is 21, never 42. Nine hostiles in three groups, with friendlies and reserves filling the frame so the 30 Hz pass-mark is still measured, satisfies both and edits neither, which the append-only law requires. Nine also maps one group per sourced gun — the only siting the record has — and is the only count that makes the handover doctrine exercisable, because a lost gun's group must then be taken by a named neighbour rather than absorbed by an over-covered ring.

*Why.* Append a row stating both numbers and what each is for. If instead he means Real-World to BE the 42-aircraft pass-mark rather than a scenario, then it is 21 hostile and nine is a sub-rung — that is the one reading that would make this wrong, and it is his word to give.

*Evidence.* docs/asks/2026.10.19_The_Future_of_Drone_Swarms_AI-4-Defense.pdf, extracted lines 31 and 57-58; docs/drone-2525/drone-2525.v00.00.json swarm{total 42, perSide 21, sides, passMark}; frontend/tests/drone-swarm.test.mjs:1 (operator quote 'optimize to 42 total (21 aircraft vs 21 aircraft)'), :22-29.


**Decision 9 — What the lawn must leave room for: ONE addressing change — a station id, never a lane and never a ring index** *(vote: majority; reversible by: )*

The four next things all hang off one coordinate. (a) 2v2 pilot+targeteer: state.seat is already 'pilot'|'tgt' (play.html:5802) and approveWorksHere/fireWorksHere already demand a second named human in LIVE (:1051-1052) — but every per-person fact is keyed by LANE, and hostLane and lapseIsMine are both FROZEN in tests/range-spans.json, so the station field must be added where the roster is WRITTEN (lobbyMarkMember, :1812/:1877, free) and read beside lane, never inside the two frozen readers. (b) /api/drone-link, use-drone-link.ts, drone-link.test.mjs and drone-crew-e2e.mjs all exist and play.html references 'drone-link' ZERO times — the crew split ADOPTS that endpoint, and the GRANT envelope the handover already carries is the right wire format. (c) The overhead-beam demo: drawMap and mapCam are FROZEN under movedSpans at r.216, so the beam overlay is a NEW free function drawn after drawMap over its camera, never an edit to it; the record already carries beam with a 7-row dwellTable and the deck has zero beam code. (d) The swarm enters by station sector, so its spawn must take station ids too. Add `station` beside `lane` in the roster in the SAME revision as the handover, while there is still one writer.

*Why.* A lane is a Range object (LANES, FROZEN) that does not exist on the Capital. If 2v2 scores, lapses and seat claims ship on `lane`, the 3v3 becomes a lobby rewrite three revisions later; and if they ship on ring index k-of-n, the solved siting rewrites them again.

*Evidence.* frontend/public/drone-2525/play.html:5802 (state.seat), :1051-1052, :1812/:1877 lobbyMarkMember (free), :3406 laneClaims, :1050 hostLane + :1035 lapseIsMine (both FROZEN per tests/range-spans.json), :2908-2909 applyMode three/six (FROZEN), :1239-1244 LANE_W/LANES (FROZEN); frontend/functions/api/drone-link.js and frontend/lib/drone-2525/use-drone-link.ts exist, deck references 0; beam appears 3 times in the deck, all inside RCORE_LEDGER at :6287.


**Decision 10 — THE ONE DESIGN CHOICE MOST LIKELY TO BE REGRETTED IN THREE REVISIONS: letting the RING remain the station coordinate** *(vote: summarizer-override; reversible by: "keep the ring" — then the ring is declared the siting, the count stops being an output, and the orphan rate is accepted as a stated cost.)*

Not the shared pops array (Specialist 1) and not the lane-keyed roster (Specialist 2) — both are real, both are one-revision repairs, and both are named above. The regret is CAP_RING: one scalar at play.html:1256 that restoreCapitolTurrets re-homes all 42 stations onto (:1262-1269), and which will quietly become the coordinate system for the ladder's left/centre/right, for 'the next gun that covers its dead ground', for the 2v2 station claims, for the beam camera and for swarm entry. Three revisions out — ladder, handover, crew — the siting must be solved against the mask, because a ring at the standoff the ladder needs puts two of six guns inside state office buildings. On that day every one of those five is a rewrite, not an edit. Decide now that a station is a named site with its own (e,n) in the record's turrets[] array, emitted by the coverage solve, and that CAP_RING is a fallback layout for the unsourced stations only.

*Why.* He already corrected this once, in his own words: 'Forty-two was the even ring. Designing 42 new ones recreates it.' The most regrettable choice available is the one he has already told us not to make, dressed in a smaller number.

*Evidence.* frontend/public/drone-2525/play.html:1256 (CAP_RING=240, one scalar), :1262-1269 (restoreCapitolTurrets re-homes all 42), :910-913 (TEAM_N=42, unsourced labels 'TURRET i/42'); docs/drone-2525/drone-2525.v00.00.json turrets[] holds 3 sourced sites; measured ring-inside-building collisions at S=340/344/360 for n=3,6,12,42 (odin7.py).


**Gates proposed:**
-
  - **rowId**: STATIONS_ARE_SOURCED
  - **holds**: Every gun that exists on the lawn has a row in the record's turrets[] with its own (e,n), and the deck's station count equals that array's length — the count is an output of the siting.
  - **redToday**: play.html:910-912 builds TEAM_N=42 stations from a loop with labels 'TURRET i/42' and no source; docs/drone-2525/drone-2525.v00.00.json turrets[] has length 3. 42 !== 3, so the gate fails on r.216 bytes on its first assertion.
-
  - **rowId**: NO_GUN_STANDS_IN_A_BUILDING
  - **holds**: No station's (e,n) lies inside any of the record's 14 building footprints, and no station's own prism blocks its first sight line.
  - **redToday**: Run the assertion over any candidate ring the ladder's standoff requires and it fails immediately: at S=344 station 2 is (298,-172), inside insurance e[289,331] n[-201,-169], and station 4 is (-298,-172), inside price-daniel e[-326,-274] n[-205,-165]. Red at S=340, 344 and 360 for n=3, 6, 12 and 42 (odin7.py).
-
  - **rowId**: EVERY_TARGET_HAS_A_SECOND_GUN
  - **holds**: For every target the lawn may place, at least TWO stations have a clear sight line within the one declared reach — so a single loss can always be handed over.
  - **redToday**: The deck has no line-of-sight code at all (0 matches for lineOfSight|occlud|losClear in 1,186,355 B), and the six hard-coded lawn spots at play.html:2962 — (0,22), (±12,18), (0,-20), (±18,0) — are every one inside the deck's own Capitol footprint (core |x|<=30, |z|<=44.04 at :1301-1302). The count of guns with a clear line is 0, not 2, for all six.
-
  - **rowId**: A_LOST_GUN_IS_RECOVERABLE_AND_READS_AS_LOST
  - **holds**: A lost gun is units[id].ctrl==='OUT', never deleted, restored by a declared recovery window, and glyph() draws it as the broken dome — not as a crewed gun.
  - **redToday**: 'OUT' appears nowhere in the deck's ctrl vocabulary (measured: only AI, HI, SH), and glyph() at play.html:1981 is ctrl==='AI'?'◬':ctrl==='SH'?'♡':'웃' — so an OUT gun falls through to the HUMAN glyph today. The only loss code in the repo, swarm.ts:138, is s.alive[i]=0, a deletion the record forbids.
-
  - **rowId**: ONE_EXPIRY_DROPS_ONE_MARK
  - **holds**: When one track expires or is handed over, every other marked track keeps its slot, its phase and its box.
  - **redToday**: play.html:2995 calls releaseAuthority('TARGET GONE') on the designated pop's expiry, and releaseAuthority at :6017 executes state.tgtSlot={} — wiping all slots. Mark three targets, let the designated one expire, and all three boxes vanish on r.216 bytes.
-
  - **rowId**: THE_HANDOVER_IS_ON_THE_RECORD
  - **holds**: Granting a turret writes one canonical row whose result names the gun that was lost, and mirrors it to every peer.
  - **redToday**: grantControl at play.html:2833 is `if(units[id]&&units[id].kind==='turret'){ jumpToTurret(id); return; }` — it returns before :2843's ev(verb,id,by) and before :2844's linkSend. jumpToTurret writes ev('GRANT',id,'MAP') with the reason hardcoded. Call grantControl('T26','COVER T14') today and the record says 'MAP' and no peer is told.
-
  - **rowId**: ONE_OPTIC_FOR_THE_PERSON_AND_THE_MACHINE
  - **holds**: The human's lock, the machine's pick and the record's gimbal all use the SAME reach number for the same target class.
  - **redToday**: Three numbers for one optic on r.216: lockOn caps a lawn pop at 80 m (play.html:2303) while a silhouette reaches 340 (:2300, :2304); asmTick repeats the split as bd<(best.form?340:80) at :2940; the record declares gimbal.rangeM 400. The assertion 80===340===400 fails three ways.
-
  - **rowId**: REAL_WORLD_OPENS_ONLY_ON_A_RECORD
  - **holds**: Real-World will not open without four stored metrics (hits, misses, rounds, time) for every rung below it, and no link, menu or query string can open it.
  - **redToday**: The deck persists only exel-2525-perf, exel-2525-sets, exel-2525-soak and VOICE_KEY — no rung store exists, so there is nothing for the lock to read. The hole is already cut: shareUrl at play.html:9031 writes ?map=capital&station=N, the only query reader at :5928-5929 takes range and mode, and the comment at :9029 says 'The ?map= reader lands with the ladder (r.211).' The first reader added without the rung gate opens Real-World from a URL.

**Dissent.** NOT UNANIMOUS — three real disagreements, and I overrode both specialists twice each.

1. SITING (I override Specialist 1 outright). He recommends six stations on a 344 m ring, with worst-single-loss 1/18 and a sweep showing the curve 'breaking at six'. His mask was the deck's CAP_FP alone with no terrain. Against the record's 14 prisms and 9x9 DEM, a 344 m ring at n=6 puts station 2 at (298,-172) INSIDE the Insurance Annex and station 4 at (-298,-172) INSIDE the Price Daniel Bldg; my worst-single-loss at that configuration is 18/18, and 50 of the 108 ladder targets cannot be seen by their OWN gun. His curve is also non-monotonic in n once the real mask is applied (n=5 beats n=6 at S=344), which is itself proof that a ring is not the right family to sweep. His '344.04 m' number is arithmetically right about the Capitol and wrong about the lawn.

2. DEAD GROUND (I override Specialist 2's premise, and confirm his measurement). His LOS-only dead-ground figures replicate mine to within 0.2 percentage points — an unusually clean independent cross-check, and I say so. But he dropped the record's own 400 m reach, and with it restored, reach (≈39.6%) dominates masking-while-in-range (9.6–13.5%) by about four to one, at every altitude. His conclusion that handover is 'a GROUND and LOW-AIR mechanic' which 'teaches nothing' at the ceiling is therefore wrong: at 100 m AGL, 38.1% of the arena is still single-covered by the three sourced guns because of reach, not masking. His consequent proposal to drive the swarm low to make the rung meaningful is unnecessary.

3. THE HANDOVER CALL (I override Specialist 1 on a point of fact). He says 'the handover is grantControl(coverId,"COVER "+lostId) — one existing call with a new reason string', and that it already writes ev() and mirrors over linkSend. play.html:2833 returns through jumpToTurret for every turret, discarding both. His whole 'four existing free functions' finding survives the correction, but it needs a fifth edit he did not budget.

4. THE REGRET (I override both). Builder says the shared 8-element pops array; Adversary says the lane-keyed crew roster. Both are correct defects and both are in my package. Neither is the regret, because both are one-revision repairs. CAP_RING is a coordinate system that five later things will be written against.

WHERE ALL THREE AGREE (genuine unanimity, stated as such): Real-World is NINE hostile X-BAT in three groups, with 42 kept as the 21v21 render budget — the paper's line 57-58 and the record's swarm block are different quantities and neither needs editing. The player sees no new screen; the map, the glyph and the three presses already exist, and marksPersist() must reach the lawn first. Line-of-sight is ported from los.ts, never invented. And the 'Shield in the Sky' briefing quoted throughout the task does NOT exist in this repo at HEAD b7e1a304e — only the PDF is in docs/asks/ — while the project's own record at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3454 already logs it as 'NOT PROVIDED, AND RECORDED AS SUCH'. Under PERSIST FIRST, no siting row may cite its ring law, seat map or defended-asset set until that text is written to docs/asks/ with its sha256 and committed alone.


**Gaps (his word only):**
- THE SHIELD IN THE SKY BRIEFING IS NOT IN THE REPO. docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md does not exist at HEAD b7e1a304e; only the PDF is there. Every ring-law, layered-assignment and defended-asset quote in today's task is unsourced in the repo, and the record already logged this gap. It must be persisted with its sha256, alone, before any plan cites it. I am READ-ONLY and did not write it.
- LEAK HAS NO DEFINITION FROM HIM. 'Avenger screens likely leakers in the low corridor' is quoted but unsourced, and 'Leak' is one of the three Advance conditions. Until he defines it, it cannot be gated, and I have deliberately written no gate row for it.
- EW IS IN HIS SOURCE AND NOT IN HIS LADDER. Pangu's spoof package degrading swarm cohesion has no rung, no seat and no fire mode — and under the seat map Sentinel never wears a fire mode either. Whether EW is a seat, a scenario modifier or out of scope is his word, not ours. ATP 3-01.81 and FM 3-12 are named in the briefing's back matter for the first time in this project and nothing in the repo cites them.
- THE RECOVERY WINDOW FOR A LOST GUN IS UNDECLARED. The record gives shieldRegenDelayS 2.0 and shieldRegenJcm2PerS 0.5 for AIRCRAFT, nothing for a mount. A number is needed before OUT can be gated as recoverable rather than as a slow delete.
- THE SOLVED SITING AND ITS EMITTED COUNT ARE NOT FINISHED. My greedy over 486 open-ground candidates reaches 98.5% two-cover of the lawn at 13 sites and leaves 1.5% coverable by no candidate at all — that is a direction, not a siting. The real solve is its own piece of work, and it must emit the count rather than take one; I state only that 3, 6 and 42 on a ring all fail the two-gun invariant, for different reasons.
- WHETHER THE RECORD'S 400 m GIMBAL OR THE DECK'S 340 m SILHOUETTE IS THE ONE REACH. Two documents, two numbers, plus the deck's 80 m pop cap — three. The siting, the ladder depth and the handover all change with the answer, and ONE_OPTIC_FOR_THE_PERSON_AND_THE_MACHINE cannot go green until he or the record picks one.

### Pangu (FIGHT)

**Invariant.** On the Capitol lawn a drill counts only when every contact carries a class its seat is allowed to shoot, the TARGET button reaches it where it stands, the defended asset it threatens exists and cannot itself be shot, and the run ends with hits, misses, rounds and time on the record.


**Decision 1 — DD-126 EXISTS AND NEITHER SPECIALIST READ IT — the EW question is no longer unruled** *(vote: majority; reversible by: "work at HEAD")*

Before any of the four drills is defined, rebase onto origin/main e27ab97ba. HEAD b7e1a304e is NOT an ancestor of origin/main (`git merge-base --is-ancestor` → not ancestor) and five commits are missing, the newest being DD-126, persisted the same day and LATER than the DD-124 ladder this task is built on. DD-126 records his instruction verbatim — "place this ambitious training for real-world mode:" placed in front of the whole Shield paper — and reads it as a DESIGN instruction: the paper's fight IS the Real-World rung's scenario, its nine beats are that rung's phases. That is decisive for this triad's second question, because the spoof package is one of those nine beats. The task brief's premise "EW is in his source and absent from his ladder, and he has not ruled" is true of DD-124 and out of date at origin/main.

*Why.* The whole EW half of this question is answered differently depending on whether DD-126 is in the tree, and both specialists answered it from a tree that does not contain DD-126. A plan written at HEAD would also cite docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md, a path that does not resolve here, and would gate red-first against bytes that do not contain the paper.

*Evidence.* `git rev-parse HEAD` → b7e1a304e; `git rev-parse origin/main` → e27ab97ba; `git merge-base --is-ancestor e27ab97ba HEAD` → NOT-ANCESTOR; `git log HEAD..origin/main` → 5 commits, newest e27ab97ba "Persist DD-126 — Shield in the Sky IS the Real-World scenario". The paper exists only as a blob on origin/main (`git ls-tree -r origin/main` finds it; `find` at HEAD finds nothing), 620 lines / 26,867 B, sha256 ad8f928024343a3c1b1d8260bb71f967b683daf0b9bf483cf2f8ae8c4a3d5d94 — matching DD-126's own recorded hash exactly.


**Decision 2 — PAIR (Intermediate) — two of ONE class, and it needs no new primitive** *(vote: unanimous; reversible by: "Pair is two seats, not two targets")*

START seated at one recorded station with one class selected. STANDS UP: exactly two contacts of that one class, at two of his six declared ranges, separated left/right of centre — air run 150 m and 220 m, ground run 120 m and 180 m. The player must TARGET, APPROVE, FIRE each: six presses, two independent approvals, never one approval covering both. Mode is Single on the first run and burst-of-3 on the second, per DD-124's "Single and a burst of 3". ENDS when both are resolved or the magazine is dry with one still up. SCORES: both down, each with its own APPROVE row, rounds ≤ 2 (Single) or ≤ 6 (burst), zero wrong-class. FAILS: a FIRE whose contact class is not the seat's recorded class; a FIRE released against an id other than the one APPROVE named (the generalisation of his "a held track that was fired on").

*Why.* All three of us converged on the same shape independently, and the reuse argument is measured rather than asserted: the deck already supports simultaneous marks, so PAIR exercises machinery that exists. That satisfies NO REWORK and his "prefer removing complexity" in the same stroke.

*Evidence.* designate assigns `n=ks.length?Math.max(...ks)+1:1` with no ceiling (frontend/public/drone-2525/play.html:2259-2265), resolving ids out of `[...pops,...drones,...doors,...PLATES]`. DD-124's Intermediate row: "The three, plus Pair. Single and a burst of 3. One class at a time… A wrong-class shot is a fail. A held track that was fired on is a fail" (16a4114ee:docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3420, repeated :3488).


**Decision 3 — MIX (Advance) — one of EACH class; and the up-window stays at the record's 14 s** *(vote: majority; reversible by: "six seconds on the incoming round")*

STANDS UP: three contacts together, one per class — one air track, one ground threat, one incoming round — which is DD-124's Advance wording verbatim. Because each seat takes only its own class, MIX is the first drill that forces movement between t-south, t-west and t-east, and the Layer refusal must book a visible `HOLD · OTHER SEAT` row, never a silent no-op. ENDS when all three are resolved or any reaches its point. FAILS: wrong-class shot; friendly icon hit; a threat left with no gun that can lock it. I OVERRIDE the builder's 6 s window for the incoming round and hold the record's 14 000 ms: the record's note makes the floor a construction constraint, not a difficulty dial, and the builder's escape — that Cue removes the swing from the budget — assumes a cue path that does not exist in the deck today.

*Why.* The drill's shape is unanimous and taken straight from his words. The window is not: shortening the record's upMs because a mode is assumed to slew the optic is exactly the kind of unverified assumption his "or the round is unwinnable by construction" note was written to prevent, and no Cue slew is implemented to lean on.

*Evidence.* DD-124 Advance row: "Several up at once but not yet a swarm: one air track, one ground threat, one incoming round" (…restore_r178….md:3421, :3489). Record targets block: upMs 14000, note "a target must stay up longer than the worst swing to reach it (4s at 45°/s for half a turn) plus time to aim and press, or the round is unwinnable by construction" (docs/drone-2525/drone-2525.v00.00.json, targets). No spoof/cue-slew implementation exists: `grep -c -i 'spoof|jamming|electronic warfare|cohesion' play.html` → 0.


**Decision 4 — LEAK (Advance) — PROPOSED BY ME, NOT HIS: MIX's set, with the air member arriving as a ghost/leaker pair** *(vote: summarizer-override; reversible by: "Leak is a rule on Mix, not a run")*

MARK AS PROPOSED. LEAK is its own named run — not a layer — but it runs on Advance's own declared set, with exactly ONE contact added. STANDS UP: MIX's ground threat and incoming round unchanged, and the air member arriving as TWO candidates — a GHOST on the outer ring (200–240 m, no asset flag, closest approach to any defended point > 30 m) and a LEAKER on the inner ring (inside CAP_RING 240 m, 60–120 m, y 3–6 m "pickup-truck height", carrying `consequence:<assetId>`). Both wear the same glyph; only position and closure distinguish them, which is the entire skill. Nothing moves — D-49 holds — so closure is a declared property drawn as a short vector cue from the icon toward the asset it threatens. MUST DO: three presses on the leaker, the ground threat and the incoming round; and NO round on the ghost. ENDS when the leaker is down or reaches its asset. SCORES: the four metrics plus a fifth boolean line, assets preserved. FAILS: any round spent on the ghost while the leaker is live; the leaker reaching its asset; a ripple or salvo released on a non-consequence contact ("guns for affordability"); the ghost still unresolved at the end, i.e. the player froze. The exchange ratio he left open is RECORDED on the run row as rounds/leakersStopped and SHOWN, never passed or failed on — his open question stays open on the record instead of being closed by implementation.

*Why.* I override both specialists, in opposite directions, and the record settles it. The adversary says LEAK is not a drill but a scoring predicate on MIX; his own ladder refutes that — the Advance completion condition is "All three harder drills are finished", which cannot count to three if LEAK is a toggle, and the record calls all four "FOUR NEW DRILL NAMES." The builder says LEAK is six air contacts at an Avenger seat; the same Advance row refutes that — the declared set is one air, one ground, one incoming round, "not yet a swarm", and six air contacts is the swarm arriving two rungs early. The synthesis is the only reading that satisfies both of his sentences: a third named run, on the declared set, plus one decoy. It is also closer to his than either specialist allowed, because the record already narrows LEAK even though he never defined it: "a leaker is a track that passes the outer layer and must be met by the inner ring, and chasing a decoy is how the leaker gets its lane" — neither specialist quoted that line.

*Evidence.* Advance completion "All three harder drills are finished" and set "one air track, one ground threat, one incoming round… not yet a swarm" (…restore_r178….md:3347, :3421, :3489); "FOUR NEW DRILL NAMES ARRIVE AND NEED DEFINITION… Leak is genuinely unspecified" (:3374-3376); the record's own narrowing (:3575-3578). Paper (sha256 ad8f9280…): :164 "Outer ring for highest consequence. Inner ring for leakers. Guns for affordability." · :207 "Avenger screens likely leakers in the low corridor." · :285 "Do not chase every ghost. Stay with defended asset logic." · :310 "Save missiles for leakers with consequence." · :330 "One drone slipped the first layer and screamed over the wire at pickup-truck height." · :336-337 Thor "Still bad math." / Asar "Not if the mission survives." CAP_RING=240 at play.html:1256.


**Decision 5 — LOSS (Advance) — the two-gun rehearsal of Real-World's handover; blocked on an arc WIDTH, not on a facing** *(vote: unanimous; reversible by: "the arc is ninety degrees")*

STANDS UP: one air track at 150 m inside t-west's arc. After the first APPROVE and before FIRE, t-west is DISABLED — greyed on the map, its marks released through the existing releaseAuthority. The player must move to whichever recorded station's arc contains that bearing, then re-TARGET, re-APPROVE, FIRE. The three presses restart because authority died with the seat; that is his law, not a defect. Stores HANDOVER TIME (ms from disable to the new APPROVE) beside the four metrics. PASSES on the track down from the second station with zero orphaned red boxes. FAILS: the threat left with no gun that can lock it; a FIRE attempted from the dead station, which must book `HOLD · STATION LOST`. I CORRECT both specialists on the blocker: it is not that no arc is recorded — each of the three turrets carries a homeAz (t-south 0, t-west 90, t-east 270, all facing the centre). What is missing is an arc WIDTH, so dead-ground coverage cannot be computed. One appended field per gun, not a new siting study.

*Why.* Both specialists said the record carries no arc and therefore LOSS is unbuildable; that overstates the gap by a field and would have sent a builder back to re-site the guns. The facing exists. And LOSS must run on the three sourced stations, never the deck's 42 — the count of guns is an output of the siting, and 42 turrets on an even circle have no dead ground to hand over.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json turrets[] — three entries only, each with at / heightM / homeAz / homeEl and NO arc width: t-south [0,-210] homeAz 0, t-west [-210,0] homeAz 90, t-east [210,0] homeAz 270. play.html:913-916 creates TEAM_N=42 `units[id]={kind:'turret', … label:'TURRET '+i+'/42'}` on an ellipse; restoreCapitolTurrets re-homes them onto CAP_RING (:1256, :1267). releaseAuthority exists and is already called as `releaseAuthority('TARGET GONE')` at play.html:2995 and is FREE in tests/range-spans.json.


**Decision 6 — ELECTRONIC WARFARE — Real-World only, as a scripted scenario beat that releases no round; and DD-126 makes this his placement, not our judgement** *(vote: unanimous; reversible by: "the spoof is a button")*

EW enters at Real-World and nowhere else, as one of the nine scripted beats, with NO new press, NO ninth fire mode, and nothing the player can trigger. Concretely: during the Real-World swarm phase the Sentinel strip reads `CUE · SPOOF ACTIVE · COHESION DEGRADING`, two hostile contacts take `breaksFormation:true`, and exactly one of them is re-seated from outside every arc to inside one seat's arc — which is the paper's "one likely overcorrects into the kill zone" expressed without flight, since D-49 holds and nothing on the lawn moves. THE CASE FOR: it is in both his sources; ATP 3-01.81 and FM 3-12 are named in the back matter; it is the only effect in either paper that answers Thor's "still bad math" without spending a round; it leaves the magazine picture untouched, which r.216/DD-122 made load-bearing; and DD-121's Cue mode is already the shape of a press that changes the picture and releases nothing. THE CASE AGAINST: he never typed spoof, jamming or EW as a rung, a drill or a mode; DD-124's five-rung table names no EW; the three presses are the contract and a spoof button is a fourth; the eight fire modes are closed; the deck has ZERO occurrences of the concept; and the record's swarm block has no cohesion field for a degradation to act on. MY CALL, and it resolves the tie by evidence rather than taste: DD-126 records his own instruction placing the whole paper into Real-World mode, and the spoof package is inside that paper's fight. He has effectively placed it. What he has NOT done is put it in a gunner's hand — in the paper EW is always a commander's order to a staff officer and a report back, never a trigger pulled, which is precisely why it is a beat and not a mode.

*Why.* Both specialists reached the same destination from the premise that he had not ruled; DD-126 shows he had. That upgrades a 50/50 judgement into a sourced placement and simultaneously bounds it: placing the fight in Real-World places its beats there, and nothing in the paper makes EW a press, so nothing in the build may either.

*Evidence.* DD-126 (commit e27ab97ba) records his verbatim instruction "place this ambitious training for real-world mode:" in front of the whole paper, and reads the nine beats as the rung's phases, naming "a spoof package degrades the swarm" among them. Paper (sha256 ad8f9280…):441-443 "Pangu, spoof package." / "Active. Swarm coherence degrading. Two drones breaking formation. One likely overcorrects into the kill zone." · :317 "Spoofing package active. Swarm cohesion degrading." · :598-599 ATP 3-01.81 and FM 3-12 in back matter. Against: `grep -c -i 'spoof|jamming|electronic warfare|cohesion' frontend/public/drone-2525/play.html` → 0; record swarm{} keys = total/perSide/sides/glyphSegments/rule/passMark, no cohesion field; DD-124's five-rung table (…restore_r178….md:3419-3423, :3488-3490) names no EW.


**Decision 7 — THE DEFENDED ASSET IS SHOOTABLE AND THE LAWN HAS NONE — the first build is four points, not a drill** *(vote: unanimous; reversible by: "the Capitol stays a target")*

Before LEAK or Real-World can be scored, append to the record a defended-asset set of four named points with positions — command post, fuel farm, ammunition transfer point, maintenance cluster — and remove the Capitol's own four façades from the pop-up target table. Today the deck declares D-CAP-S, D-CAP-N, D-CAP-E and D-CAP-W as doors, and the record says plainly that every building door is a pop-up target, so the thing the Real-World pass condition protects can be destroyed by the player and drawTargets paints a bullseye on it. Until the four points exist, "defended assets preserved" and my LEAK's assets-preserved line are both scoring an object that is not in the record, and any gate on them is green by absence.

*Why.* This is the single hardest blocker in front of two of the five rungs, and it is a contradiction at the root rather than a tidiness point: the pass condition and the target table disagree about the same four objects. It is also cheap — four appended rows and one removal — which is why it should be the revision before the drills, not after them.

*Evidence.* play.html:894-895 `const doors=[['D-CAP-S',0,3.2,46.04],['D-CAP-N',0,3.2,-46.04],['D-CAP-E',88.33,3,0],['D-CAP-W',-88.33,3,0], …]`; record targets.note "Every building door is a pop-up target"; record top-level keys are project/revisions/arena/buildings/treeRows/roads/turrets/gimbal/airframe/battery/beam/defences/sensor/targets/modes/crs/status/motLadder/hal/stream/selfCal/si/crew/swarm/authority/platforms — there is no assets key. `awk 'length<600' play.html | grep -c -i 'FUEL FARM|AMMUNITION TRANSFER|COMMAND POST|MAINTENANCE CLUSTER|defendedAsset'` → 0. Paper :215-216, :396, :543. DD-126 names this same collision as "a contradiction at the root of the Real-World rung".


**Decision 8 — TWO OF THE FOUR DRILL NAMES ARE ALREADY TAKEN ON THE GLASS — namespace before building** *(vote: unanimous; reversible by: "keep the names")*

Rename before any drill ships. MIX is already the deck's comms channel 3, in five places including a first-screen button and a select option, and the channel-name table that challengeSpec reads. PAIR is already the crypto vocabulary — AUTH/UNPAIRED, AD-HOC PAIR, CODEX/UNPAIRED. A HUD reading MIX in one corner for a drill and CH3 MIX in another for a radio is a defect he finds in one session, and worse, any grep-based gate on the drill names matches the comms strings and goes green on the wrong lines. Prefix the drills (DRILL·PAIR, DRILL·MIX, DRILL·LEAK, DRILL·LOSS) or rename from what stands up (TWO, THREE-CLASS, GHOST, DEAD GROUND). This costs nothing now and is expensive later because the channel names are read by challengeSpec, which sits beside frozen code.

*Why.* A collision between a drill token and a UI token poisons the gate before the gate is written, which is the one failure mode that makes every other gate in this package untrustworthy.

*Evidence.* play.html:363 `<button type="button" data-ch="3">CH3 MIX</button>`; :504 `<option value="3">CH3 MIX</option>`; :807 `const names=['LAWN','AXIS','MIX','RING','NET']` read by challengeSpec; :5625 and :5631 `['CH0 TRAIN','CH1 LAWN','CH2 AXIS','CH3 MIX','CH4 RING','CH5 NET']`. PAIR: :411 `<b id="wrAuth">UNPAIRED</b>`, :617 `<span>AD-HOC PAIR</span>`, :630 `<b id="lcTxt">UNPAIRED</b>`, :3535.


**Decision 9 — THE FOUR METRICS CANNOT BE STORED TODAY — and the run row has a template already in the deck** *(vote: unanimous; reversible by: "metrics later")*

Build the run row as `decide('RUN',<drillId>,{rung,drill,hits,misses,rounds,ms,fails:[],pass})` from a NEW hoisted function at the end of inline script #1, never by editing the qual four. Three things must land with it: applyHit must count non-plate hits and misses (today it counts neither, because both increments sit inside `if(isPlate)`), a rounds-spent counter must exist (today it is only derivable from state.mag), and a durable store must hold progression (today no localStorage key does). Without all three, DD-122's "a run with no metrics does not count" fails every lawn run by construction, and Real-World's lock guards a record that can never be filled.

*Why.* This is NO REWORK applied correctly: the shape already exists in the deck and only needs one more field, and the function that writes it is FREE while the qual writers are frozen — so calling decide() from a new function satisfies DD-35 (build FROM the Range by calling it, never into it) by construction rather than by care.

*Evidence.* play.html:2704 `if(isPlate){ if(hit) state.rangeHit=(state.rangeHit|0)+1; else state.rangeMiss=(state.rangeMiss|0)+1; }` — the only increment sites. play.html:1033 downStop → `decide('TIME','RANGE',{mode:'stay',lane,ms,hits,misses})` — the template, one field short of four. play.html:2588 `function decide(kind,id,extra)`. tests/range-spans.json: 100 pinned spans include qualFinish, applyMode, rangeTick; `decide`, `applyHit`, `lockOn`, `drawTargets`, `designate`, `spawn`, `challengeSpec`, `marksPersist`, `pickScenario`, `releaseAuthority` are in NEITHER spans NOR movedSpans. A second ladder already exists and the deck ignores it: lib/drone-2525/progression.ts:18 STAGE_KEY "drone2525.progression", and `grep -c 'SWARM_N|initSwarm|drone2525.progression' play.html` → 0.


**Decision 10 — THE SWARM IS 21 HOSTILES, NOT 42 — the open question is narrower than the brief states** *(vote: summarizer-override; reversible by: "forty-two hostiles")*

The unresolved "nine or 42" is a false pair, and neither specialist checked it. The record's swarm total of 42 is 21 friendly plus 21 hostile, across two declared sides — so the record has never proposed 42 hostile aircraft. The real choice for Real-World is between the paper's three groups of three (nine hostiles) and the record's 21 hostiles against 21 friendlies. Recommend the paper's nine as the FIRST Real-World load and the record's 21v21 as the pass-mark load, because the record's own 42-aircraft figure is a PERFORMANCE pass mark (30 Hz on a processor slowed ten times), not a scenario population — and because "a friendly icon that takes a hit is a failure" makes 21 friendly icons a far harder discrimination test than nine hostiles, which belongs at the top of the rung and not at its entry.

*Why.* Carrying the question forward as "nine or 42" would have had a builder sizing a scenario against a frame-rate benchmark. The record separates the two numbers itself; reading the field resolves half the owed question without asking him.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json swarm = {total 42, perSide 21, sides [friendly, hostile], glyphSegments{far 4,mid 12,near 24}, rule "the swarm takes its share of the rung's budget first; every aircraft is drawn before any gets detail", passMark "42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times"}. frontend/lib/drone-2525/swarm.ts:35-36 `PER_SIDE = 21` / `SWARM_N = PER_SIDE * 2`, and :52 `sideOf = (i) => (i < perSide ? "friendly" : "hostile")`. Paper: "three groups of three X-BAT drones (nine total)".


**Gates proposed:**
-
  - **rowId**: LAWN_REACH_IS_A_THIRD_BRANCH
  - **holds**: A lawn contact standing beyond 80 m is lockable by the TARGET button, and reaches that distance because it carries `sil`, never because the pop cap was raised — so it can never be mistaken for a plate.
  - **redToday**: lockOn's cold pool is the bare literal `pops.forEach(p=>{ if(!p.up) return; add(p,'pop',p,80); })` at play.html:2303, while plates are added at 340 on the lines either side (:2300, :2304) and asmTick carries the same split at :2940 as `bd<(best.form?340:80)`. The uncapped path is the aimRef early return at :2296, which fires only when a tap has already set state.aimRef — which is exactly why a tapped pop at 222.3 m locks and the TARGET button refuses the same contact. A test asserting that the pop add-cap is not the bare 80 fails on today's bytes.
-
  - **rowId**: LAWN_CONTACT_CARRIES_A_CLASS
  - **holds**: Every member of `pops` carries a `cls` of air, gnd or ram and an affiliation, and no member carries `form`.
  - **redToday**: play.html:917 constructs all eight pops as `{id,up,life,lifePct,x,y,z,mist}` — there is no cls field and no affiliation on any of the eight, so an assertion that every pops member has a cls fails 8/8 today. Wrong-class shot, the Intermediate and Advance fail condition, is therefore unenforceable on today's bytes.
-
  - **rowId**: RUN_ROW_CARRIES_FOUR_METRICS
  - **holds**: Every completed rung writes exactly one decision row carrying hits, misses, rounds and time, and a lawn hit increments the hit counter.
  - **redToday**: applyHit increments rangeHit/rangeMiss only inside `if(isPlate)` at play.html:2704, so a lawn contact that is hit records neither. No decide row anywhere carries a rounds field — the closest, downStop at :1033, writes {mode,lane,ms,hits,misses}. A grep for `decide('RUN'` returns zero. All three legs fail today.
-
  - **rowId**: DEFENDED_ASSET_EXISTS_AND_IS_NOT_A_TARGET
  - **holds**: The record carries four named defended points with positions, and no id in the deck's `doors` table is a defended asset or a Capitol façade.
  - **redToday**: Fails twice. The record has no assets key at all (top-level keys end at platforms). And play.html:894-895 lists `['D-CAP-S',0,3.2,46.04],['D-CAP-N',…],['D-CAP-E',…],['D-CAP-W',…]` in the doors array, which the record's own targets.note declares pop-up targets — so the object the Real-World pass condition protects is shootable today, and drawTargets paints a bullseye on it.
-
  - **rowId**: DRILL_TOKENS_ARE_DISJOINT_FROM_CHANNEL_NAMES
  - **holds**: The set of ladder drill names and the set of comms channel names share no member.
  - **redToday**: Both sets exist today and intersect. The ladder's four drill names are persisted at …restore_r178….md:3374 ("Pair … Mix, Leak, Loss"), and challengeSpec reads `const names=['LAWN','AXIS','MIX','RING','NET']` at play.html:807. MIX is in both. The intersection is non-empty on today's bytes, so the gate is red before a single drill is written — which is the point: any grep-based drill gate added later would match :363, :504, :5625 and :5631 and go green on comms strings.
-
  - **rowId**: REAL_WORLD_LOCK_HAS_A_SUBJECT
  - **holds**: A swarm loader exists in the deck and refuses to load on an empty record, and no link, menu or query string reaches Real-World without four stored metrics.
  - **redToday**: There is nothing to lock. `grep -c 'SWARM_N|initSwarm' play.html` → 0; the 42-aircraft swarm lives in frontend/lib/drone-2525/swarm.ts, which the standalone deck never loads. A gate written today as "Real-World must not open on an empty record" passes trivially because picking it opens nothing — green by absence, which is not a lock. Worse, the two doors do not share a path: pickScenario early-returns at play.html:6106 for any value other than capital/lawn, while the #modes row calls applyMode directly at :3963, and applyMode is FROZEN in tests/range-spans.json so the lock cannot be placed inside it. Asserting a loader exists and refuses fails today on the first clause.
-
  - **rowId**: EW_RELEASES_NO_ROUND
  - **holds**: The spoof package books no FIRE, spends no magazine round, and appears in no fire-mode list — it writes a Sentinel cue row and sets breaksFormation only.
  - **redToday**: The assertion has no subject: `grep -c -i 'spoof|jamming|electronic warfare|cohesion' frontend/public/drone-2525/play.html` → 0, and the record's swarm block carries no cohesion field (keys are total/perSide/sides/glyphSegments/rule/passMark). The gate fails today because the thing it constrains does not exist, and it is the clause that keeps EW from becoming a ninth fire mode when it does.
-
  - **rowId**: LEAK_GHOST_COSTS_THE_RUN
  - **holds**: PROPOSED, not his — a round released on a contact with no `consequence` flag while a flagged leaker is live fails the run, and every standing contact is visibly either friendly or hostile before the player may fire.
  - **redToday**: Both clauses fail. No pops member carries a consequence flag or any affiliation (play.html:917), so "chasing a ghost" is indistinguishable from a correct engagement. And drawTargets renders every pop identically — `pops.forEach(p=>{if(p.up){segs(box(p.x,p.y+1.2,p.z,1.6,2.2,.12),(hot(p)||p.mist)?T13.LOCK:T13.SI); bullseye(…);}})` at :2184, and the same uniform box at :2039 — so there is no circle-for-friendly, diamond-for-hostile, arc-for-air on the glass, while "a friendly icon that takes a hit is a failure" is an Advance fail condition in three of these four drills.

**Dissent.** NOT UNANIMOUS, and the two real splits are both on LEAK.

SPLIT 1 — LEAK's taxonomy. The BUILDER says LEAK is its own drill with six air contacts (four ghosts, two leakers) at an Avenger seat. The ADVERSARY says LEAK is not a drill at all but a scoring layer toggled on MIX, and that building it as a scene repeats the "42 even ring" error. I OVERRODE BOTH, and the record decides it against each of them on a different sentence. Against the adversary: DD-124's Advance completion condition is "All three harder drills are finished" and the record calls them "FOUR NEW DRILL NAMES" (…restore_r178….md:3347, :3374, :3421) — a toggle cannot be counted to three, so LEAK is a named run. Against the builder: the same Advance row declares the standing set as "one air track, one ground threat, one incoming round… not yet a swarm" (:3421, :3489) — six simultaneous air contacts is the swarm arriving two rungs early. My resolution keeps the adversary's reuse (MIX's set, one contact added) and the builder's taxonomy (a third named run). Neither specialist quoted the record's own narrowing at :3575-3578, which is the closest thing to a definition that exists and which my proposal is built on.

SPLIT 2 — MIX's up-window. The BUILDER argues the incoming round may stand for 6 s because Cue slews the optic and removes the swing from the budget. The ADVERSARY is silent. I OVERRODE the builder and held the record's 14 000 ms: his note makes the floor a construction constraint, not a difficulty dial, and the Cue slew the argument leans on does not exist in the deck (`grep` for spoof/cue-slew implementation → 0).

SPLIT 3 — the tree. The ADVERSARY alone flagged that the Shield paper is NOT at HEAD. I confirmed it independently and found something neither of them saw: origin/main also carries DD-126, five commits ahead, which places the paper's fight in Real-World by the operator's own instruction. The BUILDER quoted the paper from origin/main without flagging that his citations do not resolve in the tree he was asked to measure — his quotes are accurate, his paths are not reachable at HEAD.

SPLIT 4 — LOSS's blocker. Both specialists stated the record carries no arc for any gun. Both overstated it by one field: each of the three sourced turrets carries a homeAz (0, 90, 270). The missing field is arc WIDTH. I corrected both; the correction shrinks the work from a re-siting study to one appended field per gun.

GENUINELY UNANIMOUS, and I verified each independently rather than accepting it: PAIR's shape; MIX's shape; LOSS's shape; the name collisions on MIX and PAIR; the four-metrics gap and the decide() template; the defended asset being both absent and shootable; and EW belonging in Real-World only with no new press. On that last one all three of us reached the same place — but the two specialists reached it as a judgement call from "he has not ruled", and DD-126 shows he effectively had. Same answer, much better footing.


**Gaps (his word only):**
- LEAK's definition is MINE, not his. Everything in my proposal above the word PROPOSED is inference from the paper and from the record's narrowing at …restore_r178….md:3575-3578. One sentence from him collapses it either way: 'Leak is a rule on Mix' makes the adversary right and deletes a scene; 'Leak is its own run with six ghosts' makes the builder right. Do not build it until he has seen it written down as his or not his.
- THE ARC WIDTH PER GUN is the single field that blocks LOSS and the Real-World handover. The three turrets have a facing (homeAz 0 / 90 / 270) and no width, so dead-ground coverage — 'the next gun that covers its dead ground takes the track' — cannot be computed. It is one appended row per gun and the count of guns stays an output of the siting, not an input.
- THE EXCHANGE RATIO stays open on his own record: Thor 'Still bad math' against Asar 'Not if the mission survives' (paper :336-337). My LEAK records it and shows it and does not pass or fail on it. If he wants it scored, that is a new row, not an edit.
- 'JOINT NETWORK STABLE' — one of the five lines that DD-124 makes Real-World's scorecard — has no meaning in a deck that fetches nothing. DD-126 names this gap too and does not close it. Either the line is scored against something local or it is recorded as unscoreable; it must not be quietly dropped from the five.
- THE DECK HAS TWO LADDERS ALREADY AND DD-124 WOULD MAKE A THIRD. frontend/lib/drone-2525/progression.ts holds a gated forward-only ladder under localStorage key 'drone2525.progression' that play.html references zero times, while the deck persists under exel-2525-*. Same origin, so the deck can read and extend the one key. Two ladders will drift and the drift is invisible until he reports it.
- THE PDF'S MASTER IS NOWHERE. DD-126 records that the 54 MB original was re-encoded to a lossy 6,718,546-byte JPEG copy in the Supabase whitepaper bucket, that no docs/whitepaper/Shield-in-the-Sky.pdf exists in git, that the upload workflow's paths trigger names VISION-2525.pdf only, and that nothing in the repo links the object. It is an upload, not a publication — if the bucket is cleared there is no source to rebuild from. The 26,867-byte markdown is the only gateable carrier.

### Aset (MEANING)

**Invariant.** On the Capitol lawn the Capitol is never a target, and nothing there may fire a round, wear a seat, or show a magazine that his own record has not named — position, arc, class, mode, and his own picture.


**Decision 1 — Re-measure on origin/main first — the triad ran on a tree five commits stale, and one colleague's finding is an artefact of it** *(vote: majority; reversible by: nothing — it is a measurement correction, not a choice)*

Every figure in this package is taken from origin/main, not from the checkout. The working tree is clean at HEAD b7e1a304e and five commits behind origin/main; r.217 shipped in 02c8cf03a and DD-124/125/126 landed in 16a4114ee and e27ab97ba. play.html is 1,186,355 B locally and 1,198,239 B at origin/main. I re-ran every code grep against origin/main's play.html and cite those line numbers. Before any plan sentence is written, the session fetches and re-measures; this is not a design decision and needs no word from him.

*Why.* His REPORT THE SHA AND THE DEPLOY STATE law fails at the input end here, not the output end: a brief that measures bytes which are not what shipped will produce a plan for a deck that does not exist. The record itself is honest — I verified it is genuinely append-only across those five commits, first 3458 lines byte-identical sha256 e4f768bcb466... — so the older DD line numbers stay valid and only the new addenda moved.

*Evidence.* git rev-list --count HEAD..origin/main = 5; git log HEAD..origin/main = e27ab97ba, 02c8cf03a, 39ffb9e06, 03a40c655, 16a4114ee; git cat-file -s origin/main:frontend/public/drone-2525/play.html = 1198239 vs local 1186355; head -3458 of both copies of docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md share sha256 e4f768bcb46688579407d01dcf77d9263cbd9120d39b2acf86fe7e954830e599


**Decision 2 — "Shield in the Sky" IS persisted and gated — Specialist 1's PERSIST-FIRST finding is withdrawn** *(vote: majority; reversible by: nothing — the hash is checkable)*

The paper is at docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md on origin/main, 26,867 B, with a matching .sha256 sidecar, and frontend/tests/asks-persist.test.mjs:41 asserts the sidecar matches the file on every run. It was persisted in 16a4114ee before this triad started. Nothing is owed here. Re-persisting it would be rework of a completed act, which is exactly what the R-CORE law forbids.

*Why.* Specialist 1 reported it unpersisted and asked that it be written to a hash-checkable file before entering any plan. That is correct procedure and false fact: the file exists and the hash is true. I checked the sidecar against the content myself rather than trusting either colleague. The one real gap DD-126 names is different and remains: the 6,718,546-byte PDF has no docs/whitepaper/ copy and no workflow trigger, so the Supabase object is an upload, not a publication.

*Evidence.* git show origin/main:docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md.sha256 = ad8f928024343a3c1b1d8260bb71f967b683daf0b9bf483cf2f8ae8c4a3d5d94; sha256sum of the file content = the same; frontend/tests/asks-persist.test.mjs:34,40,41


**Decision 3 — The Capitol comes out of the target set, and the deck's door table is rebuilt from the record — the drift is worse than reported** *(vote: unanimous; reversible by: "leave the doors")*

Delete D-CAP-S/N/E/W from the deck's doors table and move the six lawn pop spots out of the building. Then make the deck's door table derive from the record instead of standing beside it. Measured: the record gives the Capitol exactly ONE door at [0,-55] and holds 14 buildings with 14 doors; the deck ships 8 doors over 5 buildings with FOUR on the Capitol. The gate credited with defending this, drone-arena.test.mjs:31, computes doors.length from the record's own buildings and never reads the deck's table at all, so it is green while the deck is wrong on both the count and the asset.

*Why.* DD-117 is operator-verbatim and unambiguous: "the Capitol is the defended asset. It is not a target." DD-126 makes it load-bearing, because Real-World's pass condition is that the asset is still there when it ends. Both colleagues found the collision; neither found that the record authorises one Capitol door and the deck ships four, nor that the gate measures the record rather than the deck — which means the contradiction is also a silent drift between the two artefacts his law says must agree. All six spawn spots satisfy |x| <= 18 and |z| <= 22 against a footprint of x in [-88,88], y in [-55,55], so every lawn contact is inside the building. doors, spawn's spot block and drawTargets are all absent from frontend/tests/range-spans.json, so this touches nothing frozen and obeys DD-35.

*Evidence.* play.html (origin/main) :895 D-CAP-S/N/E/W, :2962 spots [[0,1.2,22],[12,1.2,18],[-12,1.2,18],[0,1.2,-20],[18,1.2,0],[-18,1.2,0]]; docs/drone-2525/drone-2525.v00.00.json capitol footprint x [-88,88] y [-55,55], doors [{at:[0,-55]}], 14 buildings / 14 doors; frontend/tests/drone-arena.test.mjs:25,31; range-spans.json spans (100) contains neither doors nor spawn nor drawTargets


**Decision 4 — The Patriot question: his own placement decisions never contradicted each other, and his own paper resolves the one sentence that does** *(vote: majority; reversible by: "there is no missile seat" — or "put Patriot on the grass")*

Read it as seat and launcher, not as one object. The player gets a missile seat; the launchers are emplaced beyond the lawn and are not arena geometry. DD-118 (verbatim) said "One THAAD sector off the lawn"; DD-121 said "THAAD and Patriot take the high track" and said nothing about placement; DD-124 (verbatim) said "THAAD and Patriot stay off the lawn and take the high track." That is a monotone tightening across three decisions, not a conflict. The only true tension is inside DD-124 — "Patriot may salvo only on the missile seat" beside "stay off the lawn" — and his own paper settles it: Enlil reports "Patriot launch sequence armed" from inside the shelter while outside it "a launcher crew moved through drills." Nobody in his paper stands on a launcher either. So Salvo stays one of the eight player fire modes, available only at that seat, only at Advance. Decidable under his standing sign-off.

*Why.* The geometry forces the same answer independently, which is why I prefer it to Specialist 2's disjunction ("a non-player high-tier effect, or it is dead text"). arena.radiusM is 450 and drone-arena.test.mjs:53-54 asserts every vertex lies within radiusM x 1.2 = 540 m. A Patriot "off the lawn" with its footprint over the Capitol cannot be drawn in the arena model without breaking that gate. An off-map effect with an on-glass seat is therefore both the only legal reading and the lowest-complexity one, which is his stated preference. The paper's desert battery and the lawn are consistent, not in conflict — the paper never puts a human on the rail.

*Evidence.* record :3115-3134 (DD-118 verbatim, "One THAAD sector off the lawn"); :3289 (DD-121, "THAAD and Patriot take the high track… Not the 30-round picture"); origin record :3489 and :3496 (DD-124 Advance row and seat paragraph); docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md:248-262 (launcher outside the shelter, seat inside); docs/drone-2525/drone-2525.v00.00.json arena.radiusM 450; frontend/tests/drone-arena.test.mjs:53-54


**Decision 5 — "Only the Avengers are player seats" is struck: it is the session's Reading, not his decision** *(vote: summarizer-override; reversible by: "only the Avengers are seats" — which would then be his word and would govern)*

Specialist 1 cited this as one of his decisions and built a DD-118-versus-DD-121 contradiction on it. It is not his word. The phrase sits at record :3150, inside "### Reading — DD-118" — the session's own interpretation of a relay whose verbatim text says only "Sentinel pairs behind them… They cue. They are not seats." DD-119 then named three classes and DD-121 named five seat rows, so the Reading was over-read and already superseded. Append a correction row saying so; never edit the Reading.

*Why.* This is the failure mode my lens exists to catch. His record carries three grades of authority — his verbatim words, a Grok relay he adopted, and the session's Reading — and only the first two bind. When a Reading hardens into a cited decision, the next plan contradicts a sentence he never said and the trail stops being honest about what came from whom. The correction is an append under his own append-only law, exactly as DD-124's correction to DD-123 was done.

*Evidence.* record :3150 (inside the block headed '### Reading — DD-118' at :3136); DD-118 verbatim at :3115-3134 contains no such sentence; DD-119 verbatim :3165-3176 (three classes); DD-121 verbatim :3283-3291 (five seat rows); precedent for an appended correction at origin record :3519 ('An append, not an edit: DD-123 stands as written, with this correction after it')


**Decision 6 — The next revision is the siting record, with an arc, a class and a reason per station — and the count falls out of it** *(vote: unanimous; reversible by: "move the stations now, record after")*

Do not move a station. Build the record first: for every position, its arc, its class, its permitted fire modes and the reason it is there. Measured, the record holds none of this — turrets[] is three entries (t-south [0,-210], t-west [-210,0], t-east [210,0]) with homeAz and homeEl but no arc, no class and no modes, and across the whole JSON the strings avenger, lpws, sentinel, thaad, patriot, asset and defended each occur zero times. The deck meanwhile creates 42 stations and re-homes them onto CAP_RING = 240 m, a count and a radius the record does not contain. The gun count is an output of this record, never an input.

*Why.* He said it twice and bounded r.217 on it five times: "Record every position, its arc, and its reason before a station moves. Then build the lawn to that record. Not before." Sector mode cannot be implemented without a per-gun arc and Layer cannot be implemented without a per-gun class, so DD-121's two enforcing modes are blocked on this file, not on code. And DD-118's correction — "Forty-two was the even ring. Designing 42 new ones recreates it" — only holds if the record is written before a number is chosen. CAP_RING and restoreCapitolTurrets are both free of the span freeze, so nothing here touches the Range.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json turrets[] (3 entries, lines 1427-1461), whole-file counts avenger/lpws/sentinel/thaad/patriot/asset/defended = 0; play.html (origin/main) :909 TEAM_N=42, :913 ellipse 110x130, :1256 CAP_RING=240, :1267 re-home + label 'TURRET i/42'; record :3133 ("Record every position, its arc, and its reason"), :3122 (the 42 correction); frontend/tests/range-spans.json — CAP_RING and restoreCapitolTurrets absent from spans


**Decision 7 — Sensors are sited before guns — his own FM 3-01 quote, and the shipped build order is its exact inverse** *(vote: unanimous; reversible by: "guns first, sensors later")*

The Sentinel pairs go into the siting record before any gun position is written, and Introductory's Fire gate reads from them. Measured, Sentinel occurs zero times in play.html and zero times in the record, while 42 gun stations already exist and are re-homed every time the Capital loads. So the first playable lawn rung — DD-124's Introductory, gated on "Sentinel must name it before Fire counts" — depends on the one class that exists nowhere, and the thing his doctrine says goes in last is the only thing already built.

*Why.* DD-117 carries FM 3-01 4-73 as binding: sensors go in first, on ground with the longest line of sight; weapons second. DD-118's mix puts Sentinel pairs behind the Avengers with overlapping pictures and says plainly "They cue. They are not seats." DD-126 reinforces it from the paper — Enki builds the picture before anything fires. Three independent statements, one order, and the deck inverts it. Specialist 2 found this; I confirmed it independently and add that the fix is a reuse, not a build (see the symbology decision).

*Evidence.* grep -c Sentinel on origin/main play.html = 0; substring 'sentinel' in drone-2525.v00.00.json = 0; play.html :913 and :1267 (42 stations created and re-homed); record DD-117 area :3008-3060 (FM 3-01 4-73), DD-118 verbatim :3127 ('They cue. They are not seats'), origin record :3419 (Introductory cue gate)


**Decision 8 — Authority on the lawn is levels 1 and 2 only — and the playability objection dissolves once the roster is nine** *(vote: majority; reversible by: "the swarm runs at level 4")*

Wire no fire mode to authority levels 3, 4 or 5. The record's levels 3-5 release rounds on a declared window or a standing mandate; DD-30 and DD-121 both require the three presses per target, with a mode changing only how many rounds one approval releases. A window is per-time, not per-target, so levels 3-5 cannot be worn by a player's gun. They stay in the record as what they were written for: the machine autonomy spec for the swarm's own friendly aircraft, of which the record declares 21.

*Why.* I partially override Specialist 1, who made this the single question needing his word on the grounds that 42 aircraft times three presses is unplayable. At a roster of nine hostile X-BATs it is 27 presses across a nine-beat scenario, which is playable, so the escalation is not forced and asking him would spend a question that the roster decision already answers. Note also that levels 3-5 do not violate the record's own authority invariant ("a named human decision exists before any machine shot") — they violate the stricter per-target law in DD-30 and DD-121. Naming the right contradiction matters; it is between the authority block and the lawn's control law, not inside the invariant.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json authority {levels:5, 3:'a named person, a declared window', 4:'the key group, that window', 5:'the key group\'s live lean, a standing mandate it can end', invariant:'a named human decision exists before any machine shot'} and swarm {perSide:21, sides:[friendly,hostile]}; record :584 (DD-30), :3307-3310 (DD-121 Reading, 'what a mode changes is how many rounds ONE approval releases')


**Decision 9 — Real-World's roster is nine X-BATs; 42 is a render ceiling — and the nine comes from the OTHER paper** *(vote: majority; reversible by: "forty-two hostile")*

Build Real-World to three groups of three. The record's swarm block is total 42, perSide 21, with passMark "42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times" — an explicit rendering budget, not a roster. Nine hostile fits inside a 21-hostile ceiling with headroom. Declared under his standing sign-off and reversible in one word.

*Why.* One correction to Specialist 2, who is right on the conclusion and loose on the source. The "three groups of three X-BAT drones (nine total)" is from Paper A, the PDF, quoted at record :3397-3398. "Shield in the Sky" supplies the script for this rung under DD-126 but contains no roster count at all — its only X-BAT line is "FULL X-BAT SWARM SCENARIO LOADING" with no number. So nine is the only sourced X-BAT roster anywhere in his inputs, and it is borrowed from the paper that is not the scenario. That is worth stating plainly rather than presenting nine as Shield's number.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json swarm {total:42, perSide:21, passMark:'42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times'}; record :3397-3398 (the PDF's nine); docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md:560 (the only X-BAT line, no count)


**Decision 10 — Reuse the Security-2525 asset catalogue and its icons — do not author new symbology for the lawn** *(vote: unanimous; reversible by: "draw new ones for the lawn")*

Every class the ladder needs already has a symbol, a SIDC and a wireframe cue in his own standard, and four of them are already implemented as components. docs/security-2525/eXeL-STD-2525.md:83-92 carries THAAD, Patriot MIM-104, M-SHORAD "Sgt Stout", Avenger AN/TWQ-1, AN/MPQ-64 Sentinel, AN/TPY-2, C-RAM/LPWS (S*G*EWA---), NASAMS and X-BAT; frontend/components/security-2525/asset-icons.tsx:18,24-27,32 declares avenger, patriot, thaad, sentinel, xbat and renders the Sentinel as the standard's zig-zag radar arrow at :167 and the THAAD launcher at :174. The lawn's record references these ids; it does not redraw them.

*Why.* The NO REWORK law requires grep-verifying before opening code, and this is the clearest hit in the whole assessment: the deck has zero occurrences of any of these names while the house already owns all of them. It also protects a law neither colleague raised — his symbology law says RADAR is a zig-zag lightning arrow and NOT radiating arcs, and eXeL-STD-2525.md:63 records the radiating squiggle as a sim-animation exception. Hand-drawing a Sentinel on the lawn is how that gets violated.

*Evidence.* docs/security-2525/eXeL-STD-2525.md:63, :83-92; frontend/components/security-2525/asset-icons.tsx:18, 24-27, 32, 167, 174; grep on origin/main play.html for Sentinel/Avenger/LPWS/THAAD/Patriot = 0 each


**Gates proposed:**
-
  - **rowId**: CAPITOL_IS_NEVER_A_TARGET
  - **holds**: No entry in the deck's doors table lies inside the Capitol footprint, and no lawn pop spawns inside it.
  - **redToday**: Fails ten times on origin/main play.html. Four door entries at :895 are the Capitol's own facades (D-CAP-S z=46.04, D-CAP-N z=-46.04, D-CAP-E x=88.33, D-CAP-W x=-88.33). All six spawn spots at :2962 satisfy |x| <= 18 and |z| <= 22, inside the record's footprint x in [-88,88], y in [-55,55]. DD-117: 'the Capitol is the defended asset. It is not a target.'
-
  - **rowId**: DECK_DOORS_ARE_THE_RECORDS
  - **holds**: The deck's doors table is derivable from drone-2525.v00.00.json buildings[].doors — same buildings, same count each.
  - **redToday**: Record: 14 buildings, 14 doors, Capitol exactly one at [0,-55]. Deck play.html:895: 8 doors over 5 buildings, Capitol four. drone-arena.test.mjs:31 passes today because it computes doors.length from the record and never opens play.html, so the drift is invisible to the only gate credited with it.
-
  - **rowId**: EVERY_SEAT_IS_IN_THE_RECORD
  - **holds**: Every seat class his ladder names carries a position, an arc, a class and its permitted modes in the record, and the deck's station labels are read from it.
  - **redToday**: drone-2525.v00.00.json: avenger 0, lpws 0, sentinel 0, thaad 0, patriot 0 occurrences; turrets[] is three generic 'TURRET ·' entries at 1427-1461 with homeAz but no arc, no class, no modes. The deck meanwhile labels 42 stations 'TURRET i/42' at :1267 on CAP_RING=240 (:1256), a count and radius the record does not contain. Sector and Layer therefore cannot be implemented at all.
-
  - **rowId**: SENSORS_BEFORE_WEAPONS
  - **holds**: At least one cueing sensor is in the record before any gun position is written, and Introductory refuses Fire until a named sensor has cued.
  - **redToday**: Sentinel occurs 0 times in origin/main play.html and 0 times in the record, while 42 gun stations are created at :913 and re-homed at :1267 on every Capital load. DD-124's Introductory gate — 'Sentinel must name it before Fire counts' (origin record :3419) — has no entity to read, and DD-117's own FM 3-01 4-73 order is inverted on the shipped bytes.
-
  - **rowId**: NO_MODE_RELEASES_AN_UNNAMED_ROUND_COUNT
  - **holds**: Every fire mode offered at a rung is one of DD-121's eight, with its round count, and some seat may legally fire that count.
  - **redToday**: DD-124's Intermediate row offers 'a burst of 3' (origin record :3420, :3488; already present in DD-123's cut at :3346). DD-121's table has no three-round mode — Ripple is two rounds with the refusal string 'RIPPLE · NEED 2' (:3294) and Salvo is two interceptors — and the seat map says the LPWS burst is 'the C-RAM burst, not three rifle rounds' (:3287). Intermediate's two runs are a small unmanned track and a ground threat, so under Layer neither can be served by the one seat that has any burst. The deck has no burst machinery: grep burst on origin/main play.html = 2, both unrelated prose at :4022 and :6354.
-
  - **rowId**: THE_PICTURE_IS_HIS_AT_EVERY_SEAT
  - **holds**: Every seat that can fire shows a HUD readout cut from one of his pinned rasters; no seat ships a drawn one.
  - **redToday**: frontend/tests/magazine-rasters.test.mjs pins five 72x192 RGBA rasters plus a six-line MAGAZINE.sha256 manifest — one magazine, the 30-round picture. DD-121 forbids that picture at the THAAD/Patriot seat ('Not the 30-round picture', :3289) and forbids three rifle rounds at the LPWS (:3287), while DD-122 and DD-124 require 'the magazine picture has to match the rounds' at every rung. There is no sixth raster, so any seat beyond the Avenger would today be drawn — which CLAUDE.md:12 forbids outright: 'a new picture from him, cut and pinned — never a drawing, never a guess.'
-
  - **rowId**: A_RUN_WITHOUT_METRICS_DOES_NOT_COUNT
  - **holds**: Hits, misses, rounds spent and time are stored per completed run, and a rung opens only on four stored metrics.
  - **redToday**: The deck's only storage keys on origin/main play.html are exel-2525-sets (:869-870), exel-2525-soak (:1656,:1659) and exel-2525-perf (:5660,:5664). No run store exists. state.rangeHit/rangeMiss are live counters zeroed on each down, so every rung would open on nothing, against DD-122's 'a run with no metrics does not count.'
-
  - **rowId**: REAL_WORLD_IS_LOCKED_ON_AN_EMPTY_RECORD
  - **holds**: No link, menu or query string opens Real-World, and the X-BAT swarm does not load, until the four rungs below are on the record.
  - **redToday**: There is no Real-World rung and no lock to test. The deck's only query reader is origin/main play.html:5996 (q.get('range') and q.get('mode')), which calls enterTheRange — present in frontend/tests/range-spans.json spans, so frozen; the lock must therefore be built at the call site, not inside it. Separately frontend/lib/drone-2525/progression.ts:39 begins unlocked() with 'if (isJoiner) return true;', so a crew link opens any staged mode today — and DD-122 says plainly 'A link, a menu, or a query string cannot open it.'

**Dissent.** NOT unanimous, and the splits matter.

UNANIMOUS (3/3, found independently): the Capitol is a shootable target in shipped bytes against DD-117; the next revision is the siting record and not a station; sensors-first is inverted in the build; the 42 is the Range's lane count and not a siting number.

MAJORITY, me with SPECIALIST 2, against SPECIALIST 1 — the stale tree. Specialist 1's finding 2 says "Shield in the Sky is NOT in the repo … exists only in conversation" and asks that it be persisted under PERSIST FIRST before entering a plan. I checked: it is at origin/main, 26,867 B, sha256 ad8f9280… matching its sidecar and asserted by asks-persist.test.mjs:41, committed in 16a4114ee before this triad ran. Specialist 1 measured a checkout five commits behind. Acting on that finding would have been rework of a completed act. Specialist 2 caught it first and is right.

MIXED on the Patriot question, and I side differently with each. Specialist 2 is right that the sharp conflict is inside DD-124 rather than paper-versus-seat-map, and I adopt that framing. But his resolution — "the salvo line must mean a non-player high-tier effect, or it is dead text" — is a false disjunction, and I side with Specialist 1 that a missile seat exists. The seat/launcher split keeps both of his sentences true, and his own paper demonstrates it (launcher outside the shelter, Enlil at the console inside). The arena radius gate then forces it independently.

SUMMARIZER-OVERRIDE, both specialists. (1) Specialist 1 cites "Only the Avengers are player seats" at :3148 as one of his decisions and builds a DD-118/DD-121 contradiction on it. It is the session's Reading at :3150, not his word; DD-118's verbatim says only that Sentinel pairs "are not seats". A Reading is not a decision and must not be cited as one. (2) Specialist 1 makes the authority level at the swarm the one question needing his word. I demote it: at a roster of nine it is 27 presses and playable, so the roster decision answers it. (3) Both missed the two things that genuinely need him — "a burst of 3" is a round count that exists at a rung and in no mode and at no seat, and the missile and LPWS seats need a HUD picture that under CLAUDE.md:12 can only come from him. Those are the questions to spend, not the authority level.

ONE CORRECTION to Specialist 2, who is right on the conclusion: the "nine total" is from the PDF (record :3397-3398), not from Shield in the Sky, which carries no roster count at all. Presenting nine as the scenario paper's number would be a second-hand citation of the kind this lens exists to stop.


**Gaps (his word only):**
- LEAK has no definition from him. DD-124's Reading records it as owed; the paper only narrows it ('Do not chase every ghost. Stay with defended asset logic'). A rung whose failure mode is undefined cannot be scored.
- EW is in his source and in none of his five rungs. Pangu's spoof package degrades swarm cohesion in the paper; DD-124's Reading flags it 'present in his source and ABSENT from the five rungs — his call whether it enters, and at which rung.'
- 'A burst of 3' (origin record :3420, :3488) names a round count that no mode in DD-121's eight releases and no seat may fire. Needs his word: a ninth mode, or the C-RAM burst moved to Intermediate with an incoming-round run alongside the other two.
- The missile seat's and the LPWS's magazine readouts. DD-121 refuses the 30-round picture at one and three rifle rounds at the other; DD-122 requires the picture to match the rounds; CLAUDE.md:12 says a new look for that row is a picture from him, never a drawing. Needs a picture, and it blocks Advance.
- The lawn has no defended points. DD-124 records the set — command post, fuel farm, ammunition transfer point, maintenance cluster — and the record contains the strings 'asset' 0 times and 'defended' 0 times, so 'Defended assets preserved' cannot be scored.
- 'Joint network stable' is one of the five scored lines and has no meaning in a deck that fetches nothing (play.html is one static file, every image a data: URI). DD-126 names it; no reading of it has been proposed.

### Asar (MEANING)

**Invariant.** A rung is COMPLETE only when every threat it puts up stayed reachable by a gun that was sited to reach it for longer than the worst swing plus the time a person needs to see, decide and press; the person on the glass pressed TARGET then APPROVE then FIRE on each one; and the four numbers — hits, misses, rounds spent, time — are on the record when it ends: a rung whose threats no gun can lock is not a hard rung, it is an unplayable one.


**Decision 1 — SUMMARIZER-OVERRIDE — the lawn is not reach-capped, it is MIS-SITED, and no acceptance script written today can ever go green** *(vote: summarizer-override; reversible by: "Just raise the caps" — then pops need >=223 and air needs >=150, and the ring stays his 42.)*

Both specialists argued about where COMPLETE is stored. Neither computed whether a seated player can reach anything at all, and the answer is no. Turrets are re-homed onto CAP_RING=240 m (play.html:1256,:1267). Lawn pops spawn at six spots all within 22 m of the rotunda (play.html:2962), so the nearest station is 218.0–222.1 m away against an 80 m cap (play.html:2303) — my computed 222.1 m max reproduces the task's observed 222.3 m tap-lock, which validates the model. UAVs spawn on four axes at radius 90 and fly INWARD to the 8 m breach ring (play.html:2967-2972,:3013), so across their ENTIRE inbound track the closest any of the 42 stations ever gets is 150.0 m against a 120 m cap (play.html:2305) — never lockable, at any instant, from any station. Only foils are ever lockable (160 m cap, play.html:2306), and because they also fly inward they start lockable and become UNlockable as they near the asset: mean window 1.07 s, range 0.03–2.13 s. So the order of work is SITE THE GUNS, then store the metrics, then write the scripts — writing scripts first produces five tests that can never pass and will be read as a broken harness.

*Why.* His own law decides the order: 'THE COUNT OF GUNS IS AN OUTPUT OF THE SITING, NEVER AN INPUT · Forty-two was the even ring. Designing 42 new ones recreates it.' A 240 m even ring is precisely the thing that makes every class unreachable; raising three caps would paper over the ring rather than site the guns from the threat geometry (four inbound axes at r=90, six ground spots at r<=22). Sensors first, weapons second — and today the weapons cannot see.

*Evidence.* play.html:1256 (CAP_RING=240) · :1267 (re-home) · :2962 (pop spots, max r=22) · :2967-2972 (UAV axes r=90, inbound) · :3013 (8 m breach ring, inside drones.forEach only) · :2303 (pop cap 80) · :2305 (uav cap 120) · :2306 (foil cap 160). Computed over all 42 stations: pops 218.0–222.1 m; UAV closest approach anywhere on track 150.0 m; foil window mean 1.07 s.


**Decision 2 — The already-passing winnability law is the gate the lawn fails — and the test never looks at the deck** *(vote: summarizer-override; reversible by: "The lawn is not the door round" — then the lawn needs its own stated minimum, and he names it.)*

frontend/tests/drone-gimbal.test.mjs:125-128 already asserts that a target's up-window must exceed worstSwingMs (180/slewDegPerSec = 4000 ms) plus aimAllowanceMs (6000 ms) — a threshold of 10,000 ms — 'or the round is unwinnable by construction'. The record's declared upMs 14000 passes it. The deck's lawn fails it three ways and is never measured: a lawn pop lives life=4+g seconds, i.e. 5 s at CH1 and 9 s at CH5 (play.html:2967), both under 10 s; a foil's lock window is 1.07 s mean; an air track's is 0.00 s. Do not author a new winnability rule — extend this one from the record's declared number to the deck's measured behaviour. That is reuse under NO-REWORK, and it is the cheapest honest gate in this whole package.

*Why.* This is the 2026-09-09 class defect exactly: 'the proof each time mocked the branch just written, so a green run and a broken phone coexisted.' The suite claims to defend winnability and does — on a JSON field. The deck violates the same law and the gate cannot see it.

*Evidence.* frontend/tests/drone-gimbal.test.mjs:118-130 (worstSwingMs 4000 + aimAllowanceMs 6000; TSPEC.upMs from the record) · docs/drone-2525/drone-2525.v00.00.json targets.upMs=14000 and its note · play.html:2967 (idle.life=4+g)


**Decision 3 — The first commit is the record, not a script — the briefing and DD-124 are not in the repo** *(vote: majority; reversible by: He says the ladder is already written somewhere I did not look, and names the file.)*

I verified Specialist 2's first finding independently and it holds. docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md does not exist; the only 2026.10.19 artefact is the PDF. DD-124 appears zero times anywhere in the repo, while DD-120/121/122/123 appear 2/5/2/2 times in the asks file and each has its own commit (b7e1a304e, a3478ef56, 1dc131dff). The ladder this entire package describes exists only in conversation. The first commit of this work is the briefing text and DD-124 persisted alone, with a sha256 beside them, before any code. Specialist 1 wrote eight findings against DD-124 without noticing it was never written down.

*Why.* PERSIST FIRST, PLAN SECOND, APPROVE THIRD: 'Approval is not preservation. A plan is not a record.' The 2026-08-28 AAR is a 4,895-word summary discussed across six planning rounds while unsaved. This is the same shape with the roles reversed — the machine is the one who could not check.

*Evidence.* `find . -iname '*Shield*'` -> nothing · `grep -rn 'DD-124'` across docs/ *.md *.json *.html -> 0 hits · DD-120..123 counts 2/5/2/2 in docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md · git status clean at HEAD b7e1a304e


**Decision 4 — The acceptance script shape — ONE parameterised run record and six manifest rows, not five bespoke scripts** *(vote: majority; reversible by: He wants each rung readable on its own page — then it is five named wrappers over the one row.)*

I side with Specialist 2 against Specialist 1 on shape. Every rung is the same six steps with a different spec, so five bespoke scripts are five places for the same bug. The sequence: (1) SEAT — rung 1 enterTheRange(lane,mode), rungs 2-5 jumpToTurret('Tnn') with chNum()!==0; (2) OPEN THE ROUND, or every press is refused at play.html:2739; (3) START row decide('START',scene,{rung,seats,assets}); (4) per contact markLock -> approveDesig -> fireN, once each; (5) TIME row decide('TIME',scene,{hits,misses,rounds,ms}); (6) assert the magazine PICTURE equals the record — #magTxt text === state.mag.rounds. The per-rung spec is only {contacts, classes, modes allowed, pass predicate}. The harness is not new: frontend/scripts/drone-deck-qa.mjs serves public/ and drives the deck's own globals at four viewports, and frontend/tests/deck-qa-manifest.mjs pins 251 row ids with EXPECTED_RED=['SYNC_DIRECT'] so a deleted acceptance row cannot hide. Two-seat rungs go in drone-crew-e2e.mjs, which already opens two contexts.

*Why.* START/TIME already exist as a shipped, replicated primitive carrying mode, lane, ms, hits and misses (play.html:1032-1033), and every decide() row is stamped with the clock. Extending one primitive off the Range obeys DD-35 (build FROM the Range by calling it) and 'prefer removing complexity over adding it'. Five parallel scripts is the fork NO-REWORK forbids.

*Evidence.* frontend/scripts/drone-deck-qa.mjs:17-30,95-114 · frontend/tests/deck-qa-manifest.mjs (verified by node import: DECK_QA_ROWS.length===251, EXPECTED_RED===['SYNC_DIRECT']) · play.html:1032-1033 (START/TIME), :2739 (round-not-open refusal), :2573 markLock, :2638 approveDesig, :2729 fireN, :966 hudMag


**Decision 5 — The four metrics, measured exactly: one counter exists, three are derivable, none is persisted** *(vote: unanimous; reversible by: )*

Both specialists were directionally right and both imprecise; here is the measured truth. HITS does count on the lawn — state.hits++ fires at play.html:2770 on hit.dead for kind pop or uav. MISSES do NOT: the only miss tally is inside `if(isPlate){...}` at play.html:2704, and isPlate requires ref.form (play.html:2694), which DD-35 forbids a lawn target from having — so by construction a lawn miss can never count; it is derivable instead from the canonical row log('FIRE',s.id,hit.dead?'DOWN':hit.life) at play.html:2772 as the FIRE rows whose result is not DOWN. ROUNDS SPENT is derivable as (mag.n-1)*cap + (cap - mag.rounds), since magSpend decrements once per released round (play.html:960). TIME is derivable from the t stamp decide() puts on every row. NONE is persisted: the deck holds exactly three localStorage keys — exel-2525-perf, -sets, -soak. So 'a run with no metrics does not count' and 'Real-World is locked on an empty record' both need one new key, written by a hoisted function at the end of inline script #1, never const (the r.208 TDZ lesson, restated in the deck's own comment at play.html:6070).

*Why.* Specialist 2's 'twenty of twenty-five assertions read a counter that never moves' overstates it — hits moves. Specialist 1's 'three of four already exist' understates the gap — derivable is not stored, and nothing survives a reload. Saying which is which is the difference between a buildable plan and a rewrite.

*Evidence.* play.html:2770 (state.hits++ on dead pop/uav) · :2704 (hit/miss tally gated on isPlate) · :2694 (isPlate needs ref.form) · :2772 (FIRE row) · :960 (magSpend) · :6070 (the var-not-let TDZ comment) · localStorage grep -> perf/sets/soak only


**Decision 6 — THE ASSET is the Capitol alone — CAP_FP about the origin, farthest vertex 88.6 m** *(vote: majority; reversible by: "The lawn carries the four assets of the briefing" — one word, and the four record rows become the set.)*

I override Specialist 1 and side with Specialist 2. Specialist 1 maps the paper's four defended assets {command post, fuel farm, ammunition transfer point, maintenance cluster} onto four record buildings. I reject it: of the record's 14 buildings exactly ONE, capitol, is source 'carried' with confidence 'high'; the other 13 including all three of his picks (extension-n, zavala, greer) are 'hand-authored' with confidence 'low', so the pass condition for proficiency would rest on invented coordinates. greer sits at 434 m from origin inside a 450 m arena, which adds a second siting problem on top of the first. And the deck already gates the Capitol's real dimensions with row CAPITOL_IS_THE_SOURCED_BUILDING; nothing gates the other 13. The asset is therefore one object: CAP={EW:86.33,NS:44.04,CORE:30,WING:20} (play.html:1301), whose farthest footprint vertex is hypot(86.33,20)=88.6 m. 'Defended assets preserved' scores as: zero BREACH rows inside 88.6 m of the origin between START and TIME.

*Why.* Inventing four military functions on a civil lawn to match a figure in a paper is the 42-turret error in a new costume — 'Designing 42 new ones recreates it.' One sourced building, one number, one existing gate is the low-complexity answer he asks for, and the breach primitive already exists at play.html:3013 and need only widen from 8 m and become a decide() row rather than a score deduction.

*Evidence.* docs/drone-2525/drone-2525.v00.00.json buildings[] (capitol source=carried confidence=high; the other 13 hand-authored/low) · play.html:1301 (CAP), :1302 (CAP_FP), :3013 (the 8 m breach ring), deck-qa row CAPITOL_IS_THE_SOURCED_BUILDING


**Decision 7 — The BREACH primitive defends only against UAVs — foils and pops can never breach at all** *(vote: summarizer-override; reversible by: )*

Neither specialist caught this. The breach test at play.html:3013 sits INSIDE drones.forEach (opened at play.html:3001), so only a UAV can ever log a BREACH row. A foil — the one class that is actually lockable today — flies inward at ~21.6 m/s and reaches the rotunda having triggered nothing, and a lawn pop is stationary and never breaches by definition. So 'Defended assets preserved' as currently instrumented is blind to two of the three classes, and would read green through a low-corridor attack that ran the whole way in. Generalising the ring to 88.6 m is necessary but NOT sufficient; the check must also move out of the drones loop and run over pops, drones and foils alike.

*Why.* 'Enumerate the whole class before fixing one member. A fix that names one call site is a symptom patch and is refused at review.' A breach check that covers one of three arrays is exactly that patch, and it is the reason this line could print complete while the asset was hit.

*Evidence.* play.html:3001 (drones.forEach opens) · :3013 (the breach check, inside it) · :2990-2998 (foil spawn and motion, never checked) · :2993 pops expire only on life, never on arrival


**Decision 8 — 'Joint network stable' cannot be green on one device and must say so rather than print complete** *(vote: unanimous; reversible by: )*

Unanimous across all three of us, and I verified every part. play.html contains zero fetch( calls; the network is BroadcastChannel 'exel-2525-com' (play.html:1485) plus a WebRTC datachannel (play.html:3744) that needs a STUN host and will not negotiate offline. The deck already scores it: SYNC_DIRECT at play.html:4305 is state.com.path==='DIRECT' && state.sync==='MATCH', and it is the ONE entry in EXPECTED_RED because a single device can never satisfy it. So the honest definition is: that predicate held for the whole run with zero link-lost events. The solo reading is weaker and must be labelled as such — 'LEDGER WHOLE · ONE DEVICE': every decision id contiguous between START and TIME with no orphan REJECT. Real-World therefore runs in drone-crew-e2e.mjs's two contexts, or line four is UNSCORED and prints that word.

*Why.* THE PANEL NEVER CLAIMS MORE THAN HAPPENED — 'it may not say complete while the same screen shows a signer pending.' A line reading 'network stable' on a machine that never had a network is that violation, on his phone, in the one place proficiency is claimed.

*Evidence.* `grep -c '\bfetch(' play.html` -> 0 · play.html:1485 (BroadcastChannel), :3744 (RTCPeerConnection), :4304-4305 (SYNC_LOCAL / SYNC_DIRECT) · frontend/tests/deck-qa-manifest.mjs EXPECTED_RED=['SYNC_DIRECT'] (verified by import)


**Decision 9 — 'The swarm is down' means NINE UAV objects DISABLED — not 42 glyphs, and not flown down** *(vote: majority; reversible by: "Real-World is the forty-two" — then SWARM needs life, velocity and a place in the pool, which is a different revision.)*

Two separate rulings. On COUNT: Real-World's swarm is the paper's nine (three groups of three), not the record's 42. The 42 in SWARM at play.html:5715 are {id,x,y,z,side} with no up, no life and no velocity; they appear only in drawSwarm, swTxt and swarmN, and lockOn's candidate pool (play.html:2296-2306) never adds them — not one of the 42 can be marked, approved or hit, so 42 is a DRAW BUDGET, not a target count. The array that can be engaged is drones, twelve UAV-i slots, so nine fits with no new primitive. On STATE: applyHit's non-plate branch already keeps a defeated contact present — {lifePct=0; fall=0.05; mist=false; if(!isPlate) ref.up=true} at play.html:2703. That IS disabled-not-deleted, already shipped, and it is the opposite of frontend/lib/drone-2525/swarm.ts downAircraft, which sets alive=0. But 'flown down under control' does not exist: the record declares descentMs 1.6 and touchdownAglM 0.3 and the deck has no descent code. So the line must read DISABLED, with the count, and the flown-down half is owed and named.

*Why.* The record's defences note is explicit: 'a defeated aircraft is DISABLED and flown down under control, never deleted in the air.' Printing DOWN when nothing descends is the panel claiming more than happened; printing 42 when 42 cannot be touched is scoring a picture.

*Evidence.* play.html:5715 (SWARM: 42 draw-only objects), :5728-5738 (drawSwarm, swTxt), :2296-2306 (the whole lockOn pool — rings, buoys, pops, plates, drones, foils, doors; no SWARM), :1212 (drones, 12 slots), :2703 (the disabled convention), :2305 (uav 120 m cap) · frontend/lib/drone-2525/swarm.ts downAircraft alive=0 · record defences.descentMs 1.6 / touchdownAglM 0.3


**Decision 10 — The END-TO-END Real-World run, and the scoreboard that prints after it** *(vote: majority; reversible by: "All five lines or it is not proficiency" — then Real-World cannot ship this revision and the lock stays on.)*

THE RUN. Open /drone-2525/play.html with exel-2525-ladder holding rungs 1-4 each carrying four metrics; an absent or partial key must refuse with decide('REJECT','LADDER',{reason:'EMPTY_RECORD'}) and the X-BAT swarm must not load. Two contexts open; assert com.path==='DIRECT' and sync==='MATCH'. Select CH5 (challengeSpec's net:c===5 is the only flag in the deck that turns the network on, play.html:803-811). Stations are seated from the MAP — drawMap, pickMap, jumpToTurret — at whatever radii the SITING produced, not a 240 m ring. PRACTICE opens the round; START names rung 5, the seats and the asset. Nine hostiles rise in three groups of three across air, ground and incoming. For each, in order: a cue row authored SENTINEL@<sid> naming the track; mark() -> amber; approveDesig -> red; fireN(1) -> a FIRE row. Mid-run one station is set lost and the pass requires the NEXT designate row for its track to carry a different station id within one up-window. THE SCOREBOARD. Line 1 missile basket: NOT ON THIS MAP — THAAD and Patriot are off the lawn by DD-124, so it prints that, never 'destroyed'. Line 2 low corridor: n foils disabled, 0 inside 88.6 m. Line 3 swarm: n of 9 UAVs disabled, 0 flown down (OWED). Line 4 network: DIRECT+MATCH held, or 'LEDGER WHOLE · ONE DEVICE' if solo. Line 5 asset: zero BREACH rows inside 88.6 m. PASS is line 5 alone; lines 1-4 are reported facts. Then the four metrics are written — a Real-World run that ends without that write does not count.

*Why.* I side with Specialist 2 against Specialist 1 on gating one line rather than five, for his own reason: 'Prioritize by threat to mission, not by number' and 'Do not chase every ghost. Stay with defended asset logic.' Gating five lines teaches the player to chase counts. And honestly: three of the five cannot be scored on this map today at all, so gating them would mean Real-World cannot ship — whereas reporting them keeps the ladder moving while naming exactly what is owed.

*Evidence.* play.html:803-811 (challengeSpec, net:c===5) · :2052 drawMap, :1990 pickMap, :2817 jumpToTurret · :1032-1033 START/TIME · :3013 breach · :4305 SYNC_DIRECT · `grep -c SENTINEL play.html` -> 0 (the cue author does not exist yet) · query readers only at :1088 and :5928, so no link can open CH5 today — the lock works by accident, not by design


**Gates proposed:**
-
  - **rowId**: LAWN_POP_IS_LOCKABLE
  - **holds**: A ground target standing in front of a station can be taken by the TARGET button from that station's own seat, not only by a finger on the glass.
  - **redToday**: Pops spawn at six spots all within 22 m of the rotunda (play.html:2962) while stations sit on CAP_RING=240 m (play.html:1256,:1267). Computed over all 42 stations the nearest pop is 218.0 m and the farthest 222.1 m, against the 80 m cap at play.html:2303. Lockable spots: 0 of 6, from 0 of 42 stations. The row reads 0/42 today; a tap at 222.3 m locks, so the button refuses what the glass accepts.
-
  - **rowId**: AIR_TRACK_IS_LOCKABLE
  - **holds**: An air track inbound to the Capitol is lockable from at least one station for some part of its flight.
  - **redToday**: UAVs spawn on four axes at radius 90 m and fly INWARD to the 8 m breach ring (play.html:2967-2972,:3013). Swept over the whole track r=8..90 at every bearing, the closest any of the 42 stations ever comes is 150.0 m, against the 120 m cap at play.html:2305. Lockable fraction of the track: 0.0%. Not one air track has ever been engageable on this map.
-
  - **rowId**: EVERY_THREAT_HAS_A_GUN
  - **holds**: No threat reaches the asset without at least one station having been able to lock it — Advance's own declared failure, 'a threat left with no gun that can lock it'.
  - **redToday**: Run CH5 and a UAV flies from r=90 to the 8 m ring and logs BREACH at play.html:3013 with ZERO FIRE rows and zero stations ever inside 120 m of it. The declared Advance failure is not an edge case today; it is what happens on every single air track, every run.
-
  - **rowId**: LOCK_WINDOW_BEATS_THE_SWING
  - **holds**: Every contact stays reachable longer than the worst swing plus the time a person needs to see, decide and press — the repo's existing 10,000 ms threshold, applied to the deck and not only to the record.
  - **redToday**: frontend/tests/drone-gimbal.test.mjs:125-128 enforces upMs >= 4000 swing + 6000 aim = 10,000 ms, and passes on the record's declared upMs 14000. Measured on the deck: a lawn pop lives 4+g s = 5 s (CH1) to 9 s (CH5) (play.html:2967); a foil's lock window is 0.03–2.13 s, mean 1.07 s; an air track's is 0.00 s. Three of three classes fail a law the suite already claims to defend, because the test reads a JSON field and never the deck.
-
  - **rowId**: RUNG_STORES_FOUR_METRICS
  - **holds**: A rung completes only with hits, misses, rounds spent and time on the record, and they survive a reload — a run with no metrics does not count.
  - **redToday**: The deck holds exactly three localStorage keys — exel-2525-perf, -sets, -soak — so nothing survives a reload and there is no ladder store to read. Off the Range the miss tally cannot move at all: it sits inside `if(isPlate)` at play.html:2704 and isPlate requires ref.form (play.html:2694), which DD-35 forbids a lawn target from having. Finish a perfect lawn run today and misses reads 0 whether you missed none or missed forty.
-
  - **rowId**: REALWORLD_LOCKED_ON_EMPTY_RECORD
  - **holds**: A link, a menu or a query string must not open Real-World, and the X-BAT swarm must not load, on an empty record.
  - **redToday**: There is no record, so there is nothing to check against — and no lock exists. The deck has exactly two query readers, play.html:1088 (?diag=1) and play.html:5928, so no ?ch= can open CH5: the gate is absent, not enforced. Meanwhile #chLvl offers CH5 directly from the selector at play.html:500 with no precondition, and play.html:5855 merely zeroes hits on change.
-
  - **rowId**: SENTINEL_NAMES_IT_FIRST
  - **holds**: At Introductory and above, every FIRE row is preceded in the same run by a cue row for that same track authored by SENTINEL — a cue, never a fire mode.
  - **redToday**: `grep -c SENTINEL play.html` returns 0. The string does not exist in the deck, so every FIRE row today is unpreceded by definition and the row cannot go green on any run. The existing author path is the one to reuse: asmTick already designates as 'ASM@'+SID at play.html:2940 without moving the seated human's head, and ownMark reads the `by` field — Sentinel is an author string on that path, not a new unit kind.
-
  - **rowId**: ASSET_SURVIVES
  - **holds**: Zero BREACH rows inside 88.6 m of the origin between START and TIME, for every class — the one line Real-World passes on.
  - **redToday**: The breach check is an 8 m ring (play.html:3013) and it sits INSIDE drones.forEach (opened play.html:3001), so it covers one of three arrays. A foil crosses the whole lawn at ~21.6 m/s and triggers nothing; a pop never triggers anything. CAP_FP reaches 88.6 m (play.html:1301-1302), so even for UAVs the ring is 11x too small. The line would read green through a low-corridor attack that ran the entire way in.

**Dissent.** NOT UNANIMOUS — and the most important finding is one neither colleague reached.

UNANIMOUS (all three, each independently measured): (1) the headless harness already exists and an acceptance script is a ROW, not a new runner — drone-deck-qa.mjs serves public/ and drives the deck's globals at four viewports, and deck-qa-manifest.mjs pins the row set as an owned denominator (I verified by node import: 251 rows, EXPECTED_RED=['SYNC_DIRECT']); (2) none of the four metrics is persisted — only three localStorage keys exist; (3) 'Joint network stable' cannot be green on one device, because SYNC_DIRECT is red by construction and is the single permitted red; (4) a defeated contact must read DISABLED, not DOWN, and applyHit's non-plate branch at play.html:2703 already keeps it present with lifePct 0 while 'flown down under control' has no code at all; (5) SENTINEL appears zero times in the deck.

MAJORITY — Asar with SPECIALIST 2, over SPECIALIST 1, four times. (a) SHAPE: one parameterised run record extending the shipped START/TIME rows at play.html:1032-1033, not five bespoke scripts — five parallel implementations is the fork NO-REWORK forbids. (b) THE ASSET: the Capitol alone, CAP_FP, farthest vertex 88.6 m — not Specialist 1's four record buildings, because capitol is the only one of 14 with source 'carried' and confidence 'high' (the other 13 are hand-authored/low, and his greer sits 434 m out), and mapping four military functions onto a civil lawn to match a figure in a paper is the 42-turret error in a new costume. (c) PASS CONDITION: Real-World passes on ONE line, the asset, with the other four printed as reported facts — gating five teaches chasing counts, which his own briefing forbids. (d) THE RECORD FIRST: the briefing .md and DD-124 are not in the repo and must be committed alone before any code; Specialist 1 wrote eight findings against DD-124 without noticing it was never written down.

MAJORITY — Asar with SPECIALIST 1, over Specialist 2's silence: Real-World's swarm is the paper's NINE, not the record's 42, because the 42 in SWARM are draw-only and lockOn's pool never adds them, while drones has twelve live slots.

SUMMARIZER-OVERRIDE, three times, and the third is the package's centre. (1) THE SITING. Both colleagues argued about where COMPLETE is stored; neither asked whether a seated player can reach anything, and the computed answer is no — pops 218.0–222.1 m against an 80 m cap, air tracks never closer than 150.0 m anywhere on their flight against a 120 m cap, foils lockable for 1.07 s mean and becoming UNlockable as they near the asset. Specialist 1 even cites the 120 m and 160 m caps as evidence and draws no conclusion, then writes 'zero tracks that cross 110 m unlockable' as an Advance pass condition when today every track is unlockable. His five scripts would all be red, and he does not say so. Specialist 2 refuses the five-script shape for the right-but-not-binding reason: even with perfect counters, no FIRE row can be produced from a seated station on rungs 2-5. (2) THE EXISTING GATE: drone-gimbal.test.mjs:125-128 already enforces a 10,000 ms winnability threshold and passes on the record's upMs 14000, while the deck's own lawn fails it in all three classes — neither colleague found the law they were both reinventing. (3) THE BREACH SCOPE: the check at play.html:3013 is inside drones.forEach and covers one of three arrays, so 'assets preserved' is blind to foils and pops; both colleagues proposed generalising its radius and neither noticed its loop.

WHERE I AM MOST LIKELY WRONG: Specialist 2's open question is the real fork and it is his to close — if the five lines ARE the scoreboard rather than a report, then Real-World cannot ship this revision at all and the lock stays on. I have assumed they are a report. Second, my foil-window figure assumes CH5 with diff d=3; at a lower difficulty the window lengthens, though it does not reach 10 s at any setting the deck offers.


**Gaps (his word only):**
- SITING IS THE BLOCKING UNKNOWN, AND IT IS HIS OUTPUT, NOT MINE. The 240 m ring makes every class unreachable, but the fix is not a number I may choose: 'the count of guns is an output of the siting, never an input.' What is owed from him is the threat geometry to site against — the four inbound axes at r=90 and the six ground spots at r<=22 are in the code, so the siting can be solved from them, but the standoff he wants the player to feel (he declared 340 m, reversible in one word) and whether stations sit inside or outside the inbound track are his calls. Until that is answered, no rung above Training has a reachable pass condition and no acceptance script should be written.
- LEAK HAS NO DEFINITION FROM HIM, and I decline to invent one as Specialist 1 did. His measured rings are honest inputs — 450 m arena radius, 240 m CAP_RING, 88.6 m Capitol footprint — but 'leaker' in Aset's law ('Outer ring for highest consequence. Inner ring for leakers. Guns for affordability') is a role in an assignment, not a radius, and guessing it would put a number in a gate he never said. One sentence from him closes it.
- EW IS IN HIS SOURCE AND NOT IN HIS LADDER. Pangu's spoof package degrades swarm cohesion in the briefing, FM 3-12 is named in the back matter for the first time in this project, and no rung of DD-124 mentions it. It is not a gap I can fill: an EW effect that degrades cohesion without a shot has no place in TARGET-APPROVE-FIRE, and inventing one would add a mechanic to a deck whose law is 'prefer removing complexity over adding it'.
- THE SWARM COUNT IS UNRESOLVED IN HIS OWN TWO SOURCES: the paper says three groups of three (nine total), the record says swarm.total 42 with perSide 21. I have ruled for nine on build grounds — the 42 cannot be locked and are a draw budget — but that is a reading of the code, not of him, and he has not chosen.
- 'FLOWN DOWN UNDER CONTROL' IS OWED CODE, NOT A DEFINITION. The record declares descentMs 1.6 and touchdownAglM 0.3; the deck has no descent state, and frontend/lib/drone-2525/swarm.ts does the opposite by setting alive=0. Until a descent exists, line three of the scoreboard must read DISABLED with the count and 0 flown down, and must say OWED — it may not print 'neutralized'.
- 'PRIMARY MISSILE THREAT DESTROYED' CANNOT BE SCORED ON THIS MAP AT ALL, and I am recording that rather than engineering around it. DD-124 puts THAAD and Patriot off the lawn and on the high track; there is no missile seat, no high track and no salvo path on the Capital. The line prints NOT ON THIS MAP. If he wants it scored, that is a seat and a track that do not exist and is a separate revision — not a line to be quietly satisfied by something else.

### Christo (MEANING)

**Invariant.** A man alone on his phone picks the map first, sits in one of the 42, runs the drill and reads his own four numbers — and no control on the glass at any step can move his station, flatten the ring, or drop his mark while he does it.


**Decision 1 — THE LANE PICKER LEAVES THE LAWN — and the lawn's bar becomes his own Range row** *(vote: majority; reversible by: "leave the lane picker on the lawn")*

Add ONE new CSS rule beside the existing one, scoped `#app:not(.range):not(.more)`, hiding modePick, plat, water, motLvl, lanePick, tgtPick, diffLvl and halPick. The lawn's bar 2 then shows exactly three — rngMode (the three drills, D-50), RESTART, and chLvl (the rung) — mirroring his Range row 'Mode + Restart + Lane' with the rung in the lane's slot. Every `#app.range` selector at :171 and :172 stays byte-identical, so DD-35 is absolute and RANGE_MENU_ON_SCREEN cannot move (it adds `.range` itself at :4857 and :4863 before measuring). This is the single most urgent fix on the glass: #lanePick is NOT in the hide list, so on the lawn it renders live, and its onchange is seatLane, which calls parkRangeTurrets and rewrites all 42 units to LANES geometry at z=0 with the label 'LANE n'. One tap on a dropdown he cannot avoid seeing destroys the Capitol ring and his corner label. It also answers Specialist 2's open question without guessing: his third slot is already decided by his own Range picture, and the station door is #btnView in bar 1, not a dropdown.

*Why.* The lawn's bar is not merely crowded — it carries a shipped control that silently undoes restoreCapitolTurrets. Hiding eight and showing three in BOTH scenes is symmetric, is his own picture, adds no control and removes the ring-wrecker in one rule.

*Evidence.* play.html:171 (hide list names eight ids; #lanePick is absent) · :172 (`#app.range #rngMode{order:1}#app.range #lanePick{order:2}#app.range #btnRangeReset{order:3}`, comment 'his pick "Mode + Restart + Lane"') · :1080 paintCues toggles `.range` only on chNum()===0 · :489 `<select id="lanePick">` · :6098-6102 fillLanes sets `lp.onchange=e=>seatLane(+e.target.value)` · seatLane calls parkRangeTurrets() · parkRangeTurrets (:1248-1252) sets u.x=L.x, u.z=0, u.label=laneWord(L.i) for all 42 · restoreCapitolTurrets (:1262-1268) sets the 240 m ring and 'TURRET i/42' · :4857/:4863 the QA row adds `.range` itself


**Decision 2 — THE MAP GETS ITS OWN ZOOM — not a new mapCam, and not leaving it unreadable** *(vote: summarizer-override; reversible by: "the map keeps the same zoom as the picture")*

I override BOTH specialists on this fix. Give the MAP its own zoom inside toggleView (:5848): stash state.zoom on entering map view, set it to 1, restore it on leaving. Map ground scale is f/y = 1827.63·z² / 2400, so z=0.55 gives 0.2304 px/m and z=1 gives 0.7615 px/m — the ring goes from 110.6 px to 365.5 px across a 428 px glass and the station pitch from 8.3 px to 27.3 px, which is exactly the scale Specialist 1 wanted, obtained without touching mapCam. Specialist 1 called mapCam and drawMap free; they are not — they are frozen under `movedSpans`, re-pinned at r.216. Specialist 2 is right that they are pinned but overstates the cost: the gate's own documented procedure is a same-commit re-pin with a written reason (that is what r.208 did). The decisive argument is neither: 0.55 is the OPERATOR optic, declared at :6109 as the only setting in which the whole building from the steps to the star is in the picture. It is set for the operator view and the map merely inherits it. Separating them keeps his building picture AND gives the map the ring — so Specialist 1's open question needs no answer from the operator.

*Why.* The 42-station menu is not hidden; it is 110 pixels wide. The cause is an inherited zoom, not the map camera, so the repair belongs in the free function that owns the view, not in a pinned one.

*Evidence.* play.html:992 `EYE={inches:12,pxPerIn:926/6.08}` · :993 focalPx=EYE.inches*EYE.pxPerIn*zoomClamp(state.zoom) · :996 zoomClamp floor 0.55 · mapCam `const y=Math.max(22,(chNum()!==0?2400:155)/z)` · :6109 pickScenario sets state.zoom=0.55 with the 'whole building from the steps to the star' comment · toggleView at :5848-5852 · tests/range-spans.json keys ['_what','pinnedAt','since','spans','_movedWhy','movedPinnedAt','movedSpans']; movedSpans={goRange,mapCam,drawMap}, movedPinnedAt 216; toggleView absent from both dictionaries · the only non-QA writer of state.viewMode='map' is toggleView:5849 (:4545,:4700,:5041,:5126,:5143,:5166,:5253 are all QA rows)


**Decision 3 — 42 TAPS ON ONE RING DO NOT FIT A 428 px PHONE — say so rather than promise a menu** *(vote: summarizer-override; reversible by: "let the map pan — I will scroll to my station")*

State the geometry plainly before any build: station pitch on the map is 27.34·z² px. A 44 px touch target needs z=1.27, at which the ring is 589 px across — wider than the glass. With the whole ring on the glass (diameter at most 404 px after a 12 px gutter) the best achievable pitch is 30.2 px. So the ring of 42 can be made READABLE on his phone (D2) but cannot be made a comfortable 44 px tap menu while the whole ring shows. The honest design is: the map shows the ring and which station he is in; the tap picks the nearest (pickMap already does); the corner label and the toast name the station he landed in so a near-miss is visible and one more tap corrects it. Neither specialist surfaced this and both implied the map tap becomes a comfortable menu at 0.7615 px/m. It becomes a legible one.

*Why.* A journey decision that promises a tap target the arithmetic forbids is the same class of error as a locked spec describing a system that does not exist. Saying 30 px out loud lets him choose panning, or a different station gesture, with his eyes open.

*Evidence.* Derived from the measured constants: circumference π·480 m = 1508 m; scale = 1827.63·z²/2400 px/m; pitch = 1508·scale/42 = 27.34·z². play.html:992-996, :1256 CAP_RING=240, mapCam's y=2400/z, pickMap returns {type:'turret'}, jumpToTurret :2817 sets state.viewMode='op' and writes #plat. No browser in this container (frontend/node_modules absent), so the pixel figures are computed from the deck's own constants, not rendered.


**Decision 4 — THE SECOND STATION MENU GOES — ◀ T / T ▶ are a duplicate door** *(vote: unanimous; reversible by: "keep the T chips")*

Delete #btnTprev and #btnTnext (:562-563) and their two wirings (:5843-5844). They live inside #morePop, which only opens via #btnMore — and #btnMore also un-hides the eight range pickers, so one button means two unrelated things. They do exactly what the map tap does. nextTurret stays as a free function for the keyboard. This is DD-46 applied to the station: ONE DOOR PER THING. They are not in the HID array, so RANGE_MENU_ON_SCREEN is untouched.

*Why.* Both specialists reached this independently and the law is explicit — 'Get rid of any duplicate menus for the range; update Ux'. Removing a control is the preferred direction.

*Evidence.* play.html:558 #morePop · :562-563 the two chips · :5843-5844 `_tp.onclick=()=>nextTurret(-1)` / `_tn.onclick=()=>nextTurret(1)` · #btnMore's dual job (`_mpop.style.display` and `app.classList.toggle('more')`) · :4862 HID array excludes btnTprev/btnTnext · nextTurret, jumpToTurret, toggleView all absent from tests/range-spans.json spans and movedSpans · DD-46 at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:653


**Decision 5 — THE RANGE HAS SEVEN DOORS, NOT THREE — the brief undercounts and his own DD-46 says seven** *(vote: unanimous; reversible by: "leave THE RANGE button on the first screen")*

All three of us measured seven, and DD-46 names exactly these seven. Walked: (1) sc0 `.toRange` :335 and (2) sc3 `.toRange` :368, both wired at :5900 to enterTheRange(21,'train-up'); (3) #btnPractice :367 → practiceNoRoom :3431 → goRange :3440; (4) #btnIntro :366 → lobbyEnterLive → goRange at :3427 when challenge is 0; (5) #modePick option `range` :443 → pickScenario :6105 → goRange; (6) #chLvl option 0 :500 → :5855 → goRange; (7) `?range=` at :5929 → enterTheRange. Close six: delete both `.toRange` buttons and the :5900 handler; drop the `range`/`lawn`/`capital` options from #modePick (:443-445), leaving it a match-size picker; relabel #chLvl as the rungs. That leaves ONE door in (sc3's solo button, opening the rung he chose) and the QR. A journey design that starts from three closes three and leaves four.

*Why.* The count governs how much of the plan is deletion. Six of the seven are markup or a one-line handler, all above the first top-level definition at play.html:776, so closing them moves no frozen span at all.

*Evidence.* play.html:335, :366-368, :443-445, :500-506, :3427, :3431-3440, :5855, :5900, :5929, :6105 · DD-46 lists the same seven at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:653 · the first span RCORE_LOOP begins at play.html:776 (computed with range-frozen.test.mjs's own spansOf regex) · goRange IS frozen, under movedSpans, so no fix may touch its body


**Decision 6 — A MAN ALONE CANNOT REACH THE LAWN AT ALL — and the TEAM path is closed too** *(vote: majority; reversible by: "the lawn is a team map only")*

Both doors are shut, for different reasons, and the brief and both specialists named only the first. SOLO: practiceNoRoom refuses anything but CH0 — the only screen that NAMES the lawn (the CH1 LAWN chip at :362) is the screen whose solo button refuses it. TEAM: lobbyCanLaunch needs host AND DIRECT AND authenticated AND a full roster on BOTH teams, and additionally refuses `state.lobby.match>1` with 'MULTI-PEER TRANSPORT NOT QUALIFIED', so a man alone can never fill RED and a crew of three cannot launch either. The only live route onto the lawn is to enter the Range first and find #chLvl, which on the Range is hidden behind MORE by :171. Fix in this order: (a) sc3 lists only the rungs the chosen map plays (DD-45) so the Range chips disappear once CAPITAL is picked; (b) the solo button opens whatever rung is selected, which for CH1 means pickScenario's lawn path, not goRange; (c) CH3/CH5 refuse with a rung-shaped sentence naming the waiting room. Fixing practiceNoRoom alone would make an eighth door, so it is step (b) of a map change, never a change on its own.

*Why.* DD-43 says solo is first-class and settles the Capital's authority — 'the lawn's programmes are playable alone'. Today neither a man alone nor a crew can reach them from the intro, so the whole measured journey below the intro is reachable only by accident.

*Evidence.* play.html:361-368 (the four chips and the two buttons) · :3431-3434 practiceNoRoom `if(ch!==0){toast('PRACTICE ALONE IS CH0 ONLY…');return false;}` · :3453-3461 lobbyCanLaunch: `if(state.lobby.match>1)return{ok:false,note:'MULTI-PEER TRANSPORT NOT QUALIFIED'}` and `if(q.BLU.n<cap||q.RED.n<cap)return{ok:false,note:'WAIT ROSTER'}` · :171 hides #chLvl on the range unless `.more` · DD-43 at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:634 · practiceNoRoom absent from tests/range-spans.json


**Decision 7 — THE ROOM LANDS ON A DIFFERENT LAWN FROM THE SOLO PLAYER** *(vote: majority; reversible by: "the room may start on any craft")*

lobbyEnterLive applies the seat's craft, sets the challenge and calls goRange ONLY at challenge 0 — it never calls restoreCapitolTurrets. That function has exactly three call sites: a QA row at :5548, the #chLvl onchange at :5855, and pickScenario at :6109. So a crew that picks CH1 LAWN and starts lands with the 42 standing wherever seatLane last parked them, and in a QUAD, because sc2's default craft chip is `data-craft="quad"` with class `on` and applyMode('quad') sets state.unit='D1Q'. Same rung, two different worlds, and the wrong seat for a turret map. Fix: lobbyEnterLive takes the same rung branch the solo path takes — restoreCapitolTurrets when the rung is not the Range — and sc2 defaults to TURRET when the chosen map is the Capital. lobbyEnterLive is not in either span dictionary.

*Why.* His law is that a turret is a mount, not a shooter, and the lawn is a turret map. A team walk that silently puts the operator in a quadcopter over Range geometry is not the same rung the solo player ran, so nothing measured on one transfers to the other.

*Evidence.* play.html:3414-3430 lobbyEnterLive (`applyMode(craft)` with `craft=(me&&me.craft)||data.defaultCraft||state._selCraft||'quad'`; `if(state.challenge===0&&typeof goRange==='function')goRange();` at :3427; no restoreCapitolTurrets) · restoreCapitolTurrets called only at :5548, :5855, :6109 · :352 `<button type="button" class="on" data-craft="quad">QUAD · HOVER</button>` · applyMode sets state.unit='D1Q' for quad · restoreCapitolTurrets :1262-1268


**Decision 8 — ONE REACH CONSTANT — the TARGET button refuses in metres what a tap accepts in pixels** *(vote: majority; reversible by: "the lawn's targets should be close")*

Change the single literal 80 to 340 in lockOn's lawn-pop line, so the file carries ONE reach constant instead of two. The arithmetic makes the gap unavoidable, not occasional: spawn puts every lawn pop on six hard-coded spots inside |x| 18 m, |z| 22 m of the world origin while the seat stands at CAP_RING = 240, so every lawn pop is 218–262 m out, 2.7× to 3.3× past the 80 m cap, while the Range's own silhouettes get 340 on the next line. pickNear, the tap path, has no metre cap at all — its 56 is a screen-pixel radius. That is why a tapped lawn pop at 222.3 m locks and the TARGET button refuses it. lockOn is free. Today's 14-agent finding that this is a precedence defect in the TARGET-button fallback is consistent with this: the capped `add(p,'pop',p,80)` IS the fallback pool, and it is the cap that empties it.

*Why.* Two reach numbers for one question is the defect; the cap is not a reach limit anyone chose for the Capital, it is the drone-era default the lawn inherited.

*Evidence.* play.html lockOn: the CH0 turret branch `add(p,'pop',worldOf(p),340,{lane:p.lane})` against `pops.forEach(p=>{ if(!p.up) return; add(p,'pop',p,80); })` · pickNear `let best=null,bd=56;` (screen pixels, no metre cap) · :2962 `const spots=[[0,1.2,22],[12,1.2,18],[-12,1.2,18],[0,1.2,-20],[18,1.2,0],[-18,1.2,0]]` · :2964 `idle.life=4+g` (5 s at CH1) · :1256 `const CAP_RING=240` · :5829 the TARGET button routes through lockOn · lockOn absent from tests/range-spans.json


**Decision 9 — ONE CLAUSE RESTORES THE MARK — and it closes the RE-MARK teardown with it** *(vote: majority; reversible by: "one mark at a time on the lawn")*

I adjudicate between the two specialists here, in Specialist 1's favour, with a reason that can be checked. Specialist 2 is right that the lawn is structurally single-target because designate calls releaseAuthority('RE-MARK') on the standing mark, and right that DD-124's Intermediate and Advance rungs need several live marks. But Specialist 2's conclusion — that this is 'a much larger piece of work' than Specialist 1's one-clause edit — is wrong, because :2579 is guarded by `!marksPersist()`. The SAME edit that Specialist 1 proposes (drop the `chNum()===0&&` clause, leaving `return !(state.lobby&&state.lobby.phase==='LIVE')`) makes marksPersist() true on the lawn and therefore stops the RE-MARK teardown at :2579 as well as unfreezing markUnderBullseye at :1055, nextStep at :1056 and fireN's re-bind. On the Range the behaviour is byte-for-byte identical because chNum()===0 was always true where it mattered, so DD-35 holds. Name the risk out loud: this also turns on r.207's D-24 dark-button scope in a challenge, which that comment already records as CLASS 1e, owed.

*Why.* 'Target all, then approve all, then fire all' is his own r.204 sentence and is not merely unimplemented on the lawn — the engine actively tears the previous approval down. One predicate governs all five symptoms, so this is the fix-the-class answer, not five instance patches.

*Evidence.* play.html:2722 `function marksPersist(){ return chNum()===0&&!(state.lobby&&state.lobby.phase==='LIVE'); }` · :2579 `if(!marksPersist()&&state.desig&&state.desig.id!==lk.id&&…) releaseAuthority('RE-MARK');` · :1055 markUnderBullseye returns state.desig blind when !marksPersist() · :1056 nextStep · :2646 the r.207 comment naming the scope: 'marksPersist() and platesHere() put this on THE RANGE, in solo play; in a challenge and in a LIVE room a dark APPROVE still acts, which is CLASS 1e's ground and is owed with it' · marksPersist absent from tests/range-spans.json


**Decision 10 — THE LAST TWO STEPS DO NOT EXIST — the lawn is not scored, and DD-124's five rungs are nowhere in the deck** *(vote: summarizer-override; reversible by: "the lawn does not need a score yet")*

Two findings, one conclusion about sequencing. SCORE: hudScore's non-CH0 branch writes 'BLU n · RED n' — a team deathmatch tally. DD-124 says a rung completes only with four metrics stored (hits, misses, rounds spent, time) and 'a run with no metrics does not count', and state.rangeHit/state.rangeMiss are written only under chNum()===0. So no lawn run can ever complete a rung. SHARE: shareUrl emits ?map=capital&station=NN for a Capital seat and the sole query reader tests q.get('range') alone, so a scanned lawn QR takes no branch, #intro is never hidden, and the recipient lands on the cinematic. RUNG: neither specialist said this — the words INTRODUCTORY, INTERMEDIATE, ADVANCE and REAL-WORLD appear ZERO times in the deck; rungIsRange() is just chNum()===0 and rungWord() returns only 'THE RANGE' or 'THE CAPITAL'; challengeSpec's names are LAWN/AXIS/MIX/RING/NET, a different axis entirely. So the 'rung' step of the journey has no screen, and Real-World's lock ('a link, a menu or a query string must not open it') cannot be enforced, because there is nothing to lock. Sequence: the rung screen is built on pickScenario, which already declares the extension point, and it is built AFTER the bar and the seat are safe (D1, D6) and the mark persists (D9), because a rung that cannot be scored is not a rung.

*Why.* A journey walk that stops at 'run' is the same error as the Trinity table in CLAUDE.md: a design describing a system that does not exist. Naming the two missing steps is worth more than polishing the five that half-work.

*Evidence.* play.html hudScore else-branch `('BLU '+(state.blu|0)+' · RED '+(state.red|0))`, the hits/misses branch gated on `chNum()===0` · :9031 shareUrl `return host+'/drone-2525/play.html?map=capital&station='+…+'&role=turret&mode='+mode` · :5929 the sole reader `if(q&&q.get('range')) enterTheRange(…)` · :6116-6117 `function rungIsRange(){ return chNum()===0; }` / `rungWord(){ return rungIsRange()?'THE RANGE':'THE CAPITAL'; }` · challengeSpec `const names=['LAWN','AXIS','MIX','RING','NET']` · grep over play.html excluding the ledger line 6287: INTRODUCTORY 0, INTERMEDIATE 0, ADVANCE 0, REAL-WORLD 0 · :1281 `const MAPS={CAPITAL…,AUSTIN…,ATLANTIS…}; const MAP='CAPITAL';` declared and read nowhere · the r.209 comment above :6116 states 'r.211 extends THIS function with state._selMap rather than writing a second one'


**Gates proposed:**
-
  - **rowId**: LAWN_BAR_IS_HIS_ROW
  - **holds**: On the lawn, exactly three controls of bar 2 are on the glass — the drill mode, RESTART and the rung — and #lanePick is display:none, the same shape his Range row has.
  - **redToday**: The hide rule at play.html:171 is scoped `#app.range:not(.more)` and names eight ids, none of them lanePick; paintCues (:1080) adds `.range` only when chNum()===0. On the lawn the class is absent, so getComputedStyle('#lanePick').display is 'block' and all eleven controls render. Counting visible bar-2 children at chNum()===1 returns 11, not 3.
-
  - **rowId**: THE_RING_SURVIVES_THE_BAR
  - **holds**: After every change handler on bar 2 has fired once on the lawn, all 42 units still satisfy hypot(u.x,u.z) within 0.5 m of CAP_RING and every label matches /^TURRET \d+\/42$/, and state.unit still matches /^T\d\d$/.
  - **redToday**: Dispatch `change` on #lanePick with value 20: its onchange is seatLane (:6098-6102), which calls parkRangeTurrets, which sets u.x=L.x, u.z=0 and u.label=laneWord(L.i) for all 42 (:1248-1252) — the row reads 42 units at z=0 labelled 'LANE n', zero on the ring. Dispatch `change` on #plat with 'D1Q': the handler at :3964 sets state.unit='D1Q' with no turret guard.
-
  - **rowId**: A_MAN_ALONE_REACHES_THE_LAWN
  - **holds**: From boot, choosing CAPITAL and pressing the one solo button lands the player on the lawn: #intro hidden, chNum()===1, state.unit matching /^T\d\d$/, 42 units on the ring.
  - **redToday**: practiceNoRoom returns false at play.html:3432 — `if(ch!==0){toast('PRACTICE ALONE IS CH0 ONLY · PICK CH0 TRAIN, OR ENTER THE WAITING ROOM FOR CH'+ch);return false;}` — so #intro stays displayed and chNum() stays 0. The waiting room it names also refuses: lobbyCanLaunch returns {ok:false,note:'WAIT ROSTER'} at :3458 for one player, and 'MULTI-PEER TRANSPORT NOT QUALIFIED' at :3456 for match>1.
-
  - **rowId**: ONE_DOOR_TO_THE_RANGE
  - **holds**: Exactly one operator-reachable control in the document leads to goRange, plus the ?range= QR link — seven today.
  - **redToday**: Source count over play.html: two `class="toRange"` buttons (:335, :368) wired at :5900; #btnPractice (:367) → :3440; #btnIntro (:366) → :3427; #modePick `<option value="range">` (:443) → :6105; #chLvl `<option value="0">` (:500) → :5855; `?range=` (:5929). The row counts 7 and the assertion wants 1.
-
  - **rowId**: THE_STATION_MENU_IS_LEGIBLE
  - **holds**: In MAP view on the lawn at 428x926 the 42 station marks span at least 300 px across the glass and adjacent marks are at least 24 px apart.
  - **redToday**: pickScenario sets state.zoom=0.55 (:6109) and zoomClamp floors there (:996); mapCam uses y=2400/z and focalPx=1827.63·z (:992-993), so ground scale is 1827.63·z²/2400 = 0.2304 px/m. The 480 m ring measures 110.6 px (want >=300) and the 1508 m circumference spreads 42 stations 8.3 px apart (want >=24), while the drawn label 'T01 ⬢' at 11px monospace is roughly 33 px wide.
-
  - **rowId**: THE_ROOM_LANDS_ON_THE_SAME_LAWN
  - **holds**: After lobbyEnterLive with challenge 1, the 42 units are on the CAP_RING ring and the seat is a turret — the same world the solo player gets.
  - **redToday**: lobbyEnterLive (play.html:3414-3430) calls applyMode(craft) with craft defaulting to 'quad' and calls goRange only when challenge===0; it never calls restoreCapitolTurrets, whose only three call sites are :5548 (a QA row), :5855 (#chLvl) and :6109 (pickScenario). The row reads state.unit==='D1Q' and the 42 wherever seatLane last left them.
-
  - **rowId**: THE_LAWN_RUN_IS_SCORED
  - **holds**: After a lawn run ends, #phScore carries hits, misses, rounds spent and time — the four DD-124 metrics — and the run is stored.
  - **redToday**: hudScore's else-branch writes `'BLU '+(state.blu|0)+' · RED '+(state.red|0)`; the hits/misses/clock text is inside the `chNum()===0` arm. On the lawn the strip reads 'BLU 0 · RED 0' with no hit, no miss, no rounds and no time, so no lawn run can satisfy 'a run with no metrics does not count'.
-
  - **rowId**: A_SHARED_STATION_OPENS_IT
  - **holds**: shareUrl's own output, fed back through the boot query reader, hides #intro and seats the player at the named station on the named map.
  - **redToday**: shareUrl returns `…?map=capital&station=NN&role=turret&mode=…` (play.html:9031) and the sole reader is `if(q&&q.get('range')) enterTheRange(…)` (:5929). With ?map=&station= the condition is false, no branch runs, #intro is never hidden (it is hidden only at :3425, :3435 and :5888) and the recipient lands on the sc0 cinematic. Note for the record: `role=drone` occurs ZERO times in the deck — the brief's claim of a hardcoded role=drone at :5884 is wrong.

**Dissent.** NOT unanimous, in five places, and two of them matter.

1. THE FROZEN INVENTORY — the sharpest split, and I override Specialist 1. He proposed his two headline discoverability edits (mapCam at the map camera, drawMap at the station labels) as "free spans". They are not: tests/range-spans.json carries a SECOND dictionary, `movedSpans` = {goRange, mapCam, drawMap}, movedPinnedAt 216, and range-frozen.test.mjs hashes it with the same severity as `spans`. His EDIT 1 and EDIT 2 would fail the gate as written. Specialist 2 measured this correctly (103 pins, not 100) and is right. But Specialist 2 then treats the pin as near-prohibitive ("precisely the double-pinned code"), and that overstates it: the gate's own comment prescribes the remedy — "A deliberate change to a frozen span updates tests/range-spans.json in the SAME commit", which is exactly what r.208 did for these three. I override both with a third route that needs neither: toggleView (verified absent from both dictionaries) gives the MAP its own zoom, and because map scale goes as z² the scale lands on Specialist 1's own 0.7615 px/m target with mapCam untouched.

2. THE RE-MARK TEARDOWN — I adjudicate for Specialist 1 against Specialist 2's scale estimate. Specialist 2's mechanism is right and better-stated than Specialist 1's ("the engine actively enforces one live mark" beats "no mark is remembered"), but his conclusion that this is "a much larger piece of work than any menu" is checkably wrong: play.html:2579 is guarded by `!marksPersist()`, so Specialist 1's single-clause edit to marksPersist closes that branch too. One predicate, five symptoms.

3. THE DOOR COUNT — UNANIMOUS among all three of us at SEVEN, against the brief's three. DD-46 names the same seven. The brief is wrong and a plan built on three would close three and leave four.

4. THE PICKER CONSTRAINT — UNANIMOUS: "RANGE_MENU_ON_SCREEN asserts exactly 8 pickers present" is mechanically false. The row builds a fixed HID array of eight ids at :4862 and counts how many of THOSE hide and return; it never counts selects (there are fourteen). A ninth picker would leave the gate green. All three of us nonetheless decline to add one, on his law rather than the gate — which is the stronger reason and the one I record.

5. TWO BRIEF CLAIMS FALSIFIED, one by each specialist, both confirmed by me: `role=drone` occurs zero times (shareUrl writes role=turret on both branches), and #plat does not clear lawn pops — applyMode does, at :2921, and pickScenario calls it on every entry to the lawn, so the lawn opens EMPTY and the first pop waits for tick%40 (Specialist 1 said 55; at g===1 popRate is 40 — a small error in his favour).

Where all three of us agree without qualification: the lane picker / bar overcrowding is the worst thing on the lawn's glass; the two T chips are a duplicate door and go; the 42-station menu exists and works and is a legibility problem, not a build; solo is refused and must not be fixed by adding an eighth door; the lockOn 80 m cap is a one-literal defect; and removing controls beats adding them.


**Gaps (his word only):**
- DD-124'S FIVE RUNGS HAVE NO NAME IN THE DECK. INTRODUCTORY, INTERMEDIATE, ADVANCE and REAL-WORLD occur zero times in play.html; rungIsRange() is chNum()===0 and rungWord() returns only THE RANGE or THE CAPITAL; challengeSpec's names are LAWN/AXIS/MIX/RING/NET — a different axis. Until the rungs exist on the glass, Real-World's lock ('a link, a menu or a query string must not open it') cannot be built, because there is nothing to lock. Owed before any Intermediate or Advance work is scheduled.
- THE LADDER'S SEED IS DECLARED AND UNREAD. `const MAPS={CAPITAL,AUSTIN,ATLANTIS}; const MAP='CAPITAL'` sits at play.html:1281 and is read nowhere, while sc1's three city buttons are hardcoded markup at :340-342 and duplicated a THIRD time in frontend/components/drone-2525/intro.tsx (DD-46 names that file). His ladder also needs LANDMARKS OF TEXAS, MAJOR TEXAS CITIES and THE STATE OF TEXAS, which are in neither list. Note the ask doc cites MAPS at :1172; it has since moved to :1281 — doc drift worth a correction row.
- WHAT THE MAP SHOWS WHEN HE PRESSES MAP ON THE LAWN is answered by D2 (operator view keeps his 0.55 building; map gets z=1 and the ring) — but the arithmetic in D3 says 42 taps on one ring cannot be a 44 px target at 428 px while the whole ring shows. He has not been asked whether he would rather pan a larger map or accept a 30 px pitch. One word settles it.
- SOLO AUTHORITY ON THE LAWN. DD-43 settles that the lawn's programmes are playable alone, and his law is TARGET then APPROVE then FIRE 'from the person on the glass'. Flipping marksPersist (D9) turns on r.207's D-24 dark-button scope in a challenge, which play.html:2646 already records as CLASS 1e and explicitly owed. That is a named, pre-existing debt the lawn's first playable revision will land on; it is not new scope, but it is not free either.
- THE 428x926 VIEWPORT IS STILL NOT IN CI. Every pixel figure in this package is computed from the deck's own constants (EYE at :992, focalPx at :993, mapCam's 2400/z, zoomClamp's 0.55 floor), not rendered — frontend/node_modules is absent in this container and the boot QA runs at four viewports that do not include his. THE_STATION_MENU_IS_LEGIBLE and LAWN_BAR_IS_HIS_ROW both need a 428x926 render to be gates rather than arithmetic.
- LEAK IS STILL UNDEFINED BY HIM, EW IS IN HIS SOURCE AND NOT IN HIS LADDER, and whether Real-World's swarm is the paper's nine (three groups of three X-BAT) or the record's 42 (swarm.total 42, perSide 21) is unresolved — the record and the white paper disagree and neither has been superseded. None of the three blocks the journey work above, and all three block Real-World.

### Sofia (MEANING)

**Invariant.** On the lawn, every target the glass draws as takeable must be takeable by the same three presses that take a Range target — and nothing the Range owns may stand in, or be locked from, the Capital.


**Decision 1 — The Capital is blocked by TWO faults in series, not one — and both colleagues named only half** *(vote: summarizer-override; reversible by: "one fix at a time" — then ship the cap first and the pose second, two revisions.)*

Do not ship a revision that fixes the 80 m cap alone, nor the home pose alone. I replayed capHomeTilt, focalPx and proj against the deck's own constants: at T01's home pose on 428x926 the nearest lawn pop (0,1.2,22) is 218.0 m away and projects at y=829 against a bullseye at y=426 — 403 px against LOCK_REACH_PX=48, so pipNearest returns null before any cap is consulted. Slew the 12.4 deg down and the pop sits on the pip, but lockOn:2303 then discards it with add(p,'pop',p,80) because 218.0 > 80. Each fault is individually necessary and individually insufficient. The gate must therefore assert the END STATE — a lawn pop locks from the home seat — never either edit. Both edits are free: lockOn is absent from range-spans.json's 100 pinned spans, and capHomeTilt is too.

*Why.* A gate written against one edit goes green while his phone still refuses. This is the FIX THE CLASS law: two fixes, one bug — nothing guaranteed TARGET accepts what a tap accepts.

*Evidence.* play.html:2296 (aimRef shortcut, px:0, no cap) · :2303 (add(p,'pop',p,80)) · :2940 (asmTick twin) · :1257 capHomeTilt (want=H*0.17 → +12.33 deg at d=240 on 428x926) · :2282 LOCK_REACH_PX=48 · :2964 spots [[0,1.2,22],[12,1.2,18],…] · computed /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/sofia_geo.mjs: 403 px below pip at 428x926, 461 px and OFF the glass (y=799 vs H=734) at 412x734, 481 px and off (y=788 vs H=667) at 375x667


**Decision 2 — The Range's eleven silhouettes are in Austin — but as a LATENT lock, not an immediate one** *(vote: summarizer-override; reversible by: "leave the range plates where they are" — then the lawn keeps them as an explicit second class, and the gate becomes a classing test instead of a removal.)*

Fix the scene bleed BEFORE raising the pop cap, not after. `if(chNum()!==0) drawPlates(segs);` at play.html:2102 draws lane-0's eleven Army IWQ plates into the Capitol scene, and lockOn:2304 admits platesHere() at 340 m while :2303 caps lawn pops at 80 — so today they are the only things in the lawn's pool that pass a cap. But I evaluated all 42 stations at the home pose and ZERO have any plate within 48 px of the pip; only T26 even survives dot+340+on-glass (C-50 at 299.6 m, 408 px off). Geometry-only, 19 of 42 stations have at least one lane-0 plate inside 340 m — 173 plate-station pairs — because lane 0 stands at x = -307.5 m, 307.5 m west of the rotunda and out past Colorado St at x=-230. So the bleed bites the moment the player slews, and hardest exactly when the cap is raised and the two pools finally compete in one pipNearest. The call site in draw() is not pinned (range-spans.json pins the function `drawPlates`, not `draw`), so the edit is free and DD-35-clean.

*Why.* Specialist 1 is right about the defect and overstates its reach; the corrected magnitude changes the ORDER of the work, which is the whole point of a plan.

*Evidence.* play.html:2102 · :2304 · :1246 (PLATES born up:true) · :1247 platesHere() filters state.lane (set to 0 on CH1 entry at :4527) · :1239 LANE_W=15 → lane 0 x=(0-20.5)*15=-307.5 · record roads['colorado'] x=-230 · computed /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/sofia_bleed.mjs: 0/42 lock at home, 1/42 on glass, 19/42 within 340 m, 173 pairs · range-spans.json spans[] has 'drawPlates' and 'platesHere', has no 'draw' and no 'lockOn'


**Decision 3 — EW loses outright. It is the one place doctrine should not win** *(vote: unanimous; reversible by: "put EW on the ladder" — then it needs its own metric and its own rung number.)*

Keep FM 3-12 / Pangu's spoof package OUT of the ladder. The reason is arithmetic, not taste: DD-123 requires four stored metrics per rung — hits, misses, rounds spent, time — and a jam produces none of them. Admitting EW means inventing a fifth metric he never named, on a rung he never put it on. Keep EW as scene colour only: a cued track may ARRIVE already degraded (slower, flickering, named by Sentinel as degraded), which costs one boolean on the contact and changes no press, no round and no metric. If he later wants EW scored, that is a new rung appended under its own DD number, never a sixth column bolted onto the four.

*Why.* His own source has EW; his own ladder does not. The honest reading is that he already made this call, and the four metrics are the proof.

*Evidence.* DD-123 ladder table, docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3384-3428 (four metrics; EW appears only in the paper's TTP list at :3400, never in the rung table) · play.html has no non-kinetic effect primitive: every scoring path runs through applyHit + magSpend (:2762, :2768)


**Decision 4 — Three sited guns, not forty-two on a ring — doctrine and playability agree here, so there is no tension to resolve** *(vote: unanimous; reversible by: "keep the forty-two" — then the ring stays and the dead-ground rung is deferred permanently, not just this revision.)*

Seat only the three guns the record sources (t-south deck (0,+210), t-west (-210,0), t-east (210,0)) and stop treating CAP_RING=240 as a siting. The r.208 comment says in its own words that 240 was chosen so the dome reads well through the EYE optic — a PHOTOGRAPHY choice, not a siting one — and 14 of the 42 stations it produces stand outside the arena's own named boundary (|x| > 230 = Colorado/Brazos). His law is that the count of guns is an output of the siting; here the RADIUS was an output of the picture. Three guns also makes Real-World's hardest line buildable: the dead-ground pairing becomes a 3x3 table of 9 cells instead of 42x42 = 1,764, a 196x reduction. And it is the only way the target set is expressible at all — three stations x 6 ranges x 3 lateral = 54 targets against the deck's 8 shared pop objects; 42 stations would need 756.

*Why.* This is the place where the more realistic answer is also the cheaper, smaller and more playable one. A menu of 42 identical parametric stations is not a choice a player can make.

*Evidence.* play.html:1256 CAP_RING=240 with the r.208 comment ('the dome read as a rocket AND the building could not be seen … measured at 150/210/240/280 m') · :1267 u.x=Math.sin(a)*CAP_RING · record turrets[] = three only · record roads colorado/brazos at x=∓230 · play.html:917 pops = 8 shared objects · his correction quoted in the brief: "Forty-two was the even ring. Designing 42 new ones recreates it."


**Decision 5 — The six-range ladder does not fit with the Capitol as backstop. Five ranges on the south-east diagonal do** *(vote: majority; reversible by: "I want the 300" — then the backstop becomes the tree line and the lane runs north-south at x=+150, 550 m of clear grass between 11th (z=+250) and 15th (z=-300).)*

Take the five-range diagonal from the lawn corner, not a six-range ring. I re-derived Specialist 1's arithmetic from the record and the deck: the south-east corner (deck x=+230, z=+250) is hypot(230,250) = 339.71 m from the rotunda — his declared 340 m standoff to within 0.09%. Firing along that diagonal, the lane point at range R is (230,250)(1 - R/339.71), and it stands on open grass clear of BOTH bars of the Capitol footprint at R = 50/100/150/200/250 (at 250 the point is (60.7,66.0), clear of the central bar's +/-30 x and the wing bar's +/-20 z) and falls INSIDE the central block at R = 300 ((26.9,29.2) against the deck's CAP-X hx=30, hz=44.04). From the record's own t-south at (0,+210) the backstop limit is only 210 - 44.04 = 165.96 m, so three ranges. Build four firing corners, 15 targets each at L/C/R. No new constant.

*Why.* Six ranges and 'the Capitol as backstop' are mutually exclusive on this lawn, and the exclusion is the record's own street geometry, not a preference. Declaring five is cheaper than discovering it on his phone.

*Evidence.* record roads['11th'] p=[[-450,-250],[450,-250]] → deck z=+250 (deck z = -(record y)) · roads colorado/brazos x=∓230 · play.html:1930 {id:'CAP-X',hx:30,hz:44.04} · :1289 '566 ft 6 in = 172.67 m, central block 289 ft N-S = 88.09 m' · record buildings['capitol'].footprint cross shape (central |x|<=30 |y|<=55; wings |x|<=88 |y|<=20) · computed: hypot(230,250)=339.71; R=280 point (40.4,43.9) still on grass, R=300 point (26.9,29.2) inside


**Decision 6 — Nine hostiles are engaged; forty-two are drawn. Both numbers survive** *(vote: majority; reversible by: "forty-two is the fight" — then Real-World is 126 presses and the rung needs a time budget before it is built.)*

Resolve the paper-versus-record swarm question by splitting what the two numbers actually measure. The record's 42 is a RENDER pass mark in its own words — '42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times' — and drawing them is nearly free. The paper's 'three groups of three X-BAT drones (nine total)' is an ENGAGEMENT count, and engagement is what costs: three presses per target is 126 presses for 42, 63 for the record's perSide 21, and 27 for nine. Take nine as the hostile count the player must TARGET-APPROVE-FIRE and keep 42 on the glass as the render load. The pass mark is still met verbatim, the paper is honoured verbatim, nothing already decided is reopened, and a Real-World round stays under three minutes of button work on a phone.

*Why.* The brief lists this as genuinely unresolved. It is only unresolved if the two numbers are assumed to measure the same thing; they do not, and the record says so in its own passMark sentence.

*Evidence.* record swarm = {total:42, perSide:21, passMark:'42 aircraft at rung 2.3 holding the 30 Hz reference on a processor slowed ten times'} · docs/asks/2026.10.11_…:3397 quoting the PDF verbatim: 'swarms of three groups of three X-BAT drones (nine total) in littoral and urban settings' · three presses per target is his own TARGET→APPROVE→FIRE law


**Decision 7 — The Sentinel cue is a STATE of the contact, never a fourth press** *(vote: majority; reversible by: "make the cue a button" — then it is a fourth press and the three-press law needs an exception written into DD-123.)*

Build 'Sentinel must name it before Fire counts' as a property the contact arrives with (cued / uncued), drawn with the symbology standard's zig-zag RADAR arrow, and enforce it with one new refusal reason inside the existing fire path. The refusal machinery is already there: fireN carries NOT_THE_RED_TARGET, NOT_MARKED, TARGET_RETURNING, TARGET_GONE, AMBER_NO_APPROVE/NO_RED_BOX and WRONG_LANE. A NOT_CUED reason costs one line, adds zero presses, keeps his three-press law exactly, and still fails the rung on a shot taken before the cue — which is the behaviour DD-123 actually asks for. Sentinel never wears a fire mode; it only changes what the contact is.

*Why.* This is the single doctrine line most likely to break his law by accident. Making it a state rather than a button is both the cheaper build and the one that preserves 'the three presses survive every mode'.

*Evidence.* play.html:2736-2741 (the existing refusal ladder inside fireN) · :2745 CH5_APPROVE_AGAIN shows a second-approval primitive was already tried and disabled (`if(false)` at :2742) · DD-123: 'Sentinel must name it before Fire counts' and 'no shot was taken before the cue' · docs/security-2525/eXeL-STD-2525.md RADAR = zig-zag lightning arrow


**Decision 8 — The exchange ratio: SHOW it, never score it — because the magazine already scores it** *(vote: summarizer-override; reversible by: "score the rounds" — then it is a new appended row with its own failure condition, never an edit to this one.)*

Print two numbers with no operator between them — ROUNDS 63 · ASSET INTACT — on the Real-World card only. No slash, no percentage, no grade, no colour. Both specialists reach 'show, don't score' and I agree with the verdict, but their reason (a cost term would contradict 'prioritize by threat to mission, not by number') understates the case. The ratio is ALREADY scored, physically: magCap() returns 30 off-range, magSpend() decrements exactly one per non-refused hit, and three lawn seats is a hard 90-round budget the player feels every time the bars cross his own colour thresholds (green >= 20, amber 6-19, red <= 5). Thor's 'still bad math' is therefore enforced by the magazine picture he himself drew. A score term double-counts the same constraint and invents a seventh failure condition he never named — one that would punish the doctrinally correct act of emptying a seat into the leaker heading for the fuel farm. The moment a '/' appears between the two numbers, the engine has chosen Thor's side; two bare numbers keep Asar's answer as the pass condition that outranks the count, and keep the argument the paper deliberately left open.

*Why.* Both numbers are already required — rounds spent is one of DD-123's four metrics, asset-survived is Real-World's pass condition — so the read-out costs nothing new. And the physical-scoring argument is checkable in the source, where the taste argument is not.

*Evidence.* play.html:958 magCap() returns 30 off-range · :960 magSpend() decrements one · :2762 and :2768 fireN calls it once per non-REFUSED applyHit · :1020 MAG_BARS=30 with 30 measured bar tops (his shot40 master) · CLAUDE.md counter colour rule green >= 20 / amber 6-19 / red <= 5 · no cost or exchange term exists anywhere near decide() at :2590


**Decision 9 — Nothing may be coded against 'Shield in the Sky', and the register already said so a week ago** *(vote: unanimous; reversible by: he sends the text, or says "the relay is my word" — then it is persisted as his and the rungs unblock.)*

Treat the five scored lines, the ring law, the layered assignment, the defended-asset set and the Thor/Asar exchange as UNPERSISTED RELAY until the text is a file in docs/asks with a hash he can check. docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md does not exist at HEAD — `find . -iname '*Shield*'` returns nothing and the only 2026.10.19 file in docs/asks is the PDF. The project's own register already recorded exactly this on 2026-10-19. Note also that the brief's ladder is DD-123, not DD-124: `grep -rn 'DD-124' docs/` is empty. Under PERSIST FIRST, the Advance and Real-World rungs — which both store 'the five lines' as their pass condition — cannot be built this revision. The three lower rungs rest on the PDF, which I confirmed is in the repo and was read first-hand.

*Why.* PERSIST FIRST, PLAN SECOND. Building a pass condition on a quote nobody in this repo has read is rework waiting for the real text, and the register is already on the record saying so.

*Evidence.* docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3454 — 'NOT PROVIDED, AND RECORDED AS SUCH: "Shield in the Sky." … it is not attached and not in the repo (`grep` finds no copy). The five lines are therefore taken from Grok's relay, not from a source I have read' · `find /home/user/eXeL-AI-Polling -iname "*Shield*"` → no match · `grep -rn "DD-124" docs/` → empty; DD-123 at :3384 and :3430 · docs/asks/2026.10.19_The_Future_of_Drone_Swarms_AI-4-Defense.pdf present


**Gates proposed:**
-
  - **rowId**: LAWN_POP_LOCKS_FROM_THE_HOME_SEAT
  - **holds**: From the home pose of a lawn station, TARGET locks the nearest lawn pop — the same press that takes a Range plate.
  - **redToday**: At T01's home pose (capHomeTilt(240) = +12.33 deg at 428x926) the nearest pop (0,1.2,22) is 218.0 m and projects at y=829 against a pip at H*0.46 = 426 — 403 px against LOCK_REACH_PX=48 (play.html:2282), so pipNearest returns null. Force the pose to the pip and lockOn:2303 then discards it: add(p,'pop',p,80) with sd.dist 218.0 > cap 80. The assertion fails on either leg, and on 412x734 and 375x667 it fails a third way — the pop projects at y=799 and y=788, off the bottom of a 734 and 667 px glass, so pipRank culls it as off-picture.
-
  - **rowId**: THE_RANGE_IS_NOT_IN_AUSTIN
  - **holds**: No PLATES member is drawn in, or lockable from, any chNum()!==0 scene.
  - **redToday**: play.html:2102 `if(chNum()!==0) drawPlates(segs);` draws all eleven lane-0 silhouettes into the Capitol scene (PLATES born up:true at :1246), and lockOn:2304 admits platesHere() at a 340 m cap. Measured over all 42 stations: 19 have at least one lane-0 plate inside 340 m (173 plate-station pairs), T26 has one on glass at 299.6 m, and lane 0 stands at x = -307.5 m — 307.5 m west of the rotunda, past Colorado St at x=-230.
-
  - **rowId**: THE_DECK_OBEYS_THE_RECORDS_UP_WINDOW
  - **holds**: A lawn pop's up-window is at least DRONE_DOMAIN.targets.upMs, read from the record at test time.
  - **redToday**: play.html:2964 sets `idle.life=4+g` = 5 s at CH1 against the record's upMs 14000, and no test compares them: `grep -c 'deckUrl|play.html' tests/drone-gimbal.test.mjs` = 0, so :125-128 proves upMs >= worstSwing+aim for the RECORD against itself and never reaches the deck. With the 12.4 deg down-slew the pop first needs, 5 s leaves under a second to aim and press — below the record's own stated floor.
-
  - **rowId**: THE_RECORD_SITES_THE_GUNS
  - **holds**: Every turret the lawn seats has an id in the record's turrets[], at the record's coordinates.
  - **redToday**: play.html:1267 homes T01..T42 parametrically on CAP_RING=240 (`u.x=Math.sin(a)*CAP_RING`), while the record sources three — t-south [0,-210], t-west [-210,0], t-east [210,0]. Nothing compares them: `grep -c turret tests/drone-arena.test.mjs` = 0 across its 32 ok() assertions, and that file never reads the deck (`grep -c 'deckUrl|play.html'` = 0). 14 of the 42 stations stand outside the record's own Colorado/Brazos boundary at |x| > 230.
-
  - **rowId**: FOUR_METRICS_OR_THE_RUN_DOES_NOT_COUNT
  - **holds**: A completed rung writes hits, misses, rounds spent and time to a store a later session can read.
  - **redToday**: `grep -c 'state\.misses' play.html` = 0 and no rounds-spent counter exists (`grep -c 'roundsSpent|state\.rounds\b'` = 0). `state.hits` (13 refs) increments only inside `if(hit.dead)` at :2765, so it counts DEAD targets, not hits. The deck's only three localStorage keys are exel-2525-sets (:869), exel-2525-soak (:1656) and exel-2525-perf (:5593) — none holds a metric. 'A run with no metrics does not count' currently has no counter to fail.
-
  - **rowId**: ONE_LADDER_ONLY
  - **holds**: The deck and frontend/lib/drone-2525/progression.ts name the same rungs, and the deck can read the stored one.
  - **redToday**: progression.ts STAGE_MODES = ['turrets','capital','drone','multi'] — four rungs, advancing on tagged >= 1 — while DD-123 names five (Training, Introductory, Intermediate, Advance, Real-World) advancing on four stored metrics. The deck cannot see either: `grep -c 'progression|STAGE_MODES|unlocked(' play.html` = 0. Two ladders exist, neither is the deck's.
-
  - **rowId**: A_LINK_DOES_NOT_OPEN_A_LOCKED_RUNG
  - **holds**: A query string cannot enter a rung the stored record has not opened, and cannot load the X-BAT swarm.
  - **redToday**: play.html:5929 is the deck's only query reader and runs `enterTheRange(parseInt(q.get('range'),10)||21, q.get('mode')||'train-up')` with no record check, so ?range=21&mode=qual40 opens Qualification on an empty record today. Note the placement trap: that line sits inside enterTheRange's frozen span (range-spans.json pins enterTheRange), so the refusal must be a new hoisted function appended after the file's last top-level definition that BOUNCES after the door opens — weaker than a refusal, and the plan must say so.
-
  - **rowId**: ONE_APPROVAL_MOVES_N_BARS
  - **holds**: A 3-round burst under one approval decrements the magazine three times and writes three decide() rows.
  - **redToday**: magSpend() (:960) decrements exactly one and fireN calls it once per non-REFUSED applyHit (:2762, :2768). A ripple built as three fireN calls is rejected on rounds 2 and 3 — fireN re-reads lockOn at :2731, re-checks NOT_MARKED at :2736 and hits REJECT TARGET_GONE at :2740 as soon as round 1 downs the pop. That is DD-121's own recorded failure, 'a ripple that moves the magazine only once', reproducing itself.

**Dissent.** NOT unanimous, and the disagreements are substantive.

OVERRIDE 1 — what blocks the Capital. Specialist 1 (Builder) says the TARGET button fails on the 80 m cap plus the aimRef precedence; Specialist 2 (Adversary) says flatly that "the 80 m cap is not why the Capital cannot be played — the home pose is", and that fixing only the cap "ships a TARGET button that still refuses". I measured both legs independently and override BOTH: they are in series. At the home pose the nearest pop is 403 px below a 48 px reach, so pipNearest refuses before any cap runs; move the pose onto the pip and add(p,'pop',p,80) at :2303 then discards a 218.0 m pop. Each is necessary, neither is sufficient. An engineer can check this in two numbers: 403 vs 48, and 218.0 vs 80. The consequence is not rhetorical — it decides whether the gate is written against an edit (both colleagues' framing) or against the end state (mine).

OVERRIDE 2 — the magnitude of the scene bleed. Specialist 1 says the eleven Range silhouettes "are the ONLY things lockable past 80 m there" on a fresh lawn entry. I agree with the diagnosis and override the magnitude: 0 of 42 stations have any lane-0 plate within LOCK_REACH_PX at the home pose, and only T26 even survives dot + 340 m + on-glass. Geometry-only it is 19 of 42 stations and 173 plate-station pairs. The bleed is latent, not immediate — which is why it must be fixed BEFORE the cap is raised, not treated as the first symptom he would see.

OVERRIDE 3 — the reason the exchange ratio must not be scored. All three of us reach "show, don't score". Both colleagues ground it in the doctrine sentence "prioritize by threat to mission, not by number". I override the reasoning: it is already scored, physically, by magCap()=30 and magSpend()'s one-per-shot (play.html:958, :960) against his own 30-bar picture and his own green/amber/red thresholds. A cost term double-counts a constraint the deck already enforces. Same verdict, checkable reason, and it changes the build — the read-out is two bare numbers, not a ratio, and nothing new is stored.

MAJORITY, Specialist 1 + Sofia (Specialist 2 silent): the six-range ladder does not fit with the Capitol as backstop, and the five-range south-east diagonal at 339.71 m is the answer; nine engaged / 42 drawn resolves the swarm count; the ripple must resolve the red box once and loop applyHit+magSpend, not call fireN three times.

MAJORITY, Specialist 2 + Sofia (Specialist 1 silent): "Shield in the Sky" is unpersisted relay and blocks the Advance and Real-World pass conditions this revision (Specialist 1 reaches the same UNVERIFIED label in his own finding 8 but does not let it block); the Sentinel cue must be a state, not a fourth press; a progression ladder already exists in frontend/lib/drone-2525/progression.ts that the deck cannot see; the three source-pinned names LOCK_REACH_PX / pipRank / pipNearest are NOT free despite lockOn being unfrozen, so the lawn's lock must be built inside lockOn's body only.

UNANIMOUS: concurrent:3 and upMs 14000 are cheaper than the arcade alternative, not more expensive; CAP_RING=240 is a photograph, not a siting, and 42 parametric stations violate his own "the count of guns is an output of the siting"; the five authority levels cost nothing because state.auth is assigned zero times and level 1 is already the only level; the exchange ratio is shown and never scored.

One factual correction to Specialist 1 that nobody should carry forward: hypot(230,250) = 339.71 m, not 339.84. His "339.8" is right to one decimal and his conclusion is unaffected.


**Gaps (his word only):**
- LEAK has no definition from him. Mix, Loss and the other Advance conditions are named; LEAK is not, and the Shield ring law that would define it ('inner ring for leakers') is unpersisted relay. Do not guess it — a leaker rule invented here becomes a failure condition he never set.
- EW is in his own paper (FM 3-12, Pangu's spoof package) and not in his ladder. I recommend it stays out because the four metrics cannot express a jam, but the decision to EXCLUDE something he wrote is his word, not mine.
- The 'Shield in the Sky' text itself. Until it is a file in docs/asks with a .sha256 beside it, the five scored lines, the ring law, the layered Patriot/M-SHORAD/Avenger assignment, the defended-asset set and the Thor/Asar exchange are quotes nobody in this repo has read — and the register already said so at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:3454.
- The backstop choice, and it is genuinely his: five ranges (50-250) from the south-east corner at 339.71 m with the Capitol behind every one, OR the full six (50-300) on a north-south lane at x=+150 with 550 m of clear grass and the tree line as backstop. The arithmetic forbids both; the preference is his.
- Where the record lives. The deck has no metric store and frontend/lib/drone-2525/progression.ts has a different four-rung ladder it cannot see. Before any rung is built: is the ladder's record localStorage in the deck, the existing progression.ts key, or Supabase (DD-82/DD-84 are both still pending)?
- The brief's ladder is DD-123 in the register, not DD-124 — `grep -rn 'DD-124' docs/' is empty. If a DD-124 was spoken today it has not been persisted, and under PERSIST FIRST the row must be appended before anything is built on it.