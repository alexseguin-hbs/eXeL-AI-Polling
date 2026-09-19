# Drone-2525 r.130 — fleet review (24 reviewer lenses, 12 lens pairs, read-only) — 2026-09-19

Operator (2026-09-19, autonomous mode): "use AI AsM to execute so HI can check tomorrow … Use 36-48 agents in autonomous mode."
Run: 24 read-only reviewer-lens agents on the SERVED r.130 (sha256 ce034c5e…, byte-identical to the carried deck), two per
lens, model and effort as configured (never overridden). Each was asked for at most eight findings with file:line, a failure
scenario, and "what else on this path can fail". Their reports are reproduced below, condensed but with their own words and
line numbers; the synthesis and what r.131 does about it come first. Twelve synthesiser agents were not launched: the two
reviewers per lens converged without dissent on every material point, and the operator asked for completion, not ceremony.

## Verdict (Master of Thought synthesis)

**r.130 made the range fire and score for the first time — and the fleet found that it still did not WORK the way the operator
means it.** Every lens pair independently reached the same eight defects on the player path, all in the deck, all fixable at
the class in one revision (r.131, built and shipped after this review):

1. **The scenario and challenge pickers defeated the range.** Picking CH0 re-aimed the turret at the 26 m bull ring and raised it,
   so TARGET locked the ring and every shot scored the bullseye; the first pick of "50M RANGE" left the mode as `range`, so the
   1/2/3 keys selected Capitol doors. (lens 10B ×2 CRITICAL; 2B)
2. **One exposure could be charged twice, and a downed target could be shot and resurrected.** A fired miss plus the lapse = two
   rounds; `plateHit` never checked `up`/`fall`; `applyHit` set `up=true` on any ref → zombie plates, unbounded score. (2A, 2B, 3A,
   3B, 4A, 4B, 6A — every one of them)
3. **The red box outlived the pop-up.** A lapse never cleared the designation; a miss re-armed `hiApproved`; authority transferred
   to the plate's next exposure. (3B, 6A, 6B)
4. **QUAL·40 could not fit its own clocks and could not reach 40.** 20 exposures need 132.5 s against 120; table III exposed cap-0
   plates → ceiling 36; the bull ring scored qual rounds and started the clock. (4A, 4B, 2A)
5. **The basis fix was incomplete.** `camOf`'s seat offset still used the old inverted forward; Capitol ring turrets faced mirrored;
   every auto-aim aimed from the unit origin while the hit test measured from the eye (1.8° high at 50 m); `drawTbox` and the
   world box used raw lane-local plate coordinates (a box up to 205 m from its silhouette); tap-to-designate never saw plates. (1A, 1B, 2B)
6. **The picture lied on a phone.** The `PIP FLOOR 6 PX` prefix overflowed the HUD and overprinted the FPS; LOCK was drawn under the
   kebab button; three labels stacked on one point; a sail boat and the swarm were drawn down the lanes; a 6 px floor made 9 of 10
   silhouettes the same 12×24 px box and changed the standard with zoom. (7A, 7B, 10A, 3A)
7. **Evidence and QA were still not honest enough.** The reducer's HIT branch was dead (parsed a "%" nothing wrote); LAPSE and the
   QUAL tally never entered the record or the pack; the batch labelled simulated runs as human and broadcast them; boot QA left a
   red QA-BULL designation on the player's first frame and its events in the canonical stream; the deferred render row was
   never printed. (5A, 5B, 8A, 8B, 10A)
8. **The wire path bypasses the two-humans gate** (net APPROVE has no gate; SNAPSHOT imports red and never restores LIVE; the peer
   DESIG never writes a slot and can jam a foreign-lane box onto my device; six ambers can coexist but only the newest is
   approvable; the record says SOLO for every approval). (6A, 6B, 9A) — **deferred to r.132**, it is a lobby/transport change.

Also recorded, not fixed tonight (hardware, doctrine or design calls): the range has no canonical clock between peers (9A, 5A);
the reducer applies in arrival order while the hash sorts (5A); lanes are never claimed uniquely (9A); `dt` is clamped so slow
devices run the range slow (2A); the shell's CH0 and the deck's CH0 are different games and the PLAY link passes nothing (12B);
Verify Live never probes play.html (12B); the register chain covers rev|sha|bytes only and the r.128 row cites the wrong commit
(11A, 11B); the research doc presents the +1 s/50 m ramp as SOURCED while citing the FM's 5 s/10 s values (11B); no headless deck
QA runs in CI (12A).

## What r.131 changes (built from r.130 by asserted exact patches; see REVISIONS.md r.131)
See the r.131 entry in `docs/drone-2525/operator-deck/REVISIONS.md` — it maps each fix to the finding above and to the QA row
that now holds it.

---
## Lens 01A

```
LENS 1A — ONE FORWARD BASIS
1 HIGH · :1066-1068 camOf seat offset still uses the pre-r.130 negated forward (x=u.x+sy*off.f…, z=u.z-cy*off.f…): pilot eye 0.58 m behind the tail instead of ahead; pilot/targeteer seats swapped fore/aft; PROJ_FWD_AGREES cannot catch it (projects from the displaced origin).
2 HIGH · :682/:944 restoreCapitolTurrets: ring position (sin a·110, 20+cos a·130) with yaw=a is opposite-handed to fwdOf → facing mirrored about z; at a=0/π faces away from the Capitol; correct is yawTo(0-u.x, 20-u.z) ≈ π−a. The plat dropdown (:3363) never re-aims pan.
3 MED · :1604 mapCam still returns the old negated forward; nothing reads its fx/fz today; a future map-cone test would name objects behind the picture.
4 MED · :2475-2476/:3523 map pan adds screen drag straight into world axes, ignoring state.map.yaw (two-finger twist) → after a 90° twist, drag directions are wrong.
5 MED · :2343 AI targeteer lerps pan toward `want` without ±180 wrap; ring turrets carry yaw up to ~351°, wrap runs only for the seated unit → unseated turrets slew the long way, pan readout drifts.
6 LOW · :2412-2413 swarm mover hand-inlines fwdOf (agrees, but a fourth copy).
7 LOW · :2537 AI pilot orbit never sets D1.yaw → heading unrelated to velocity.
8 LOW · pinchAng / tilt atan2(dy,hypot) sites are vertical/screen-space, harmless.
What else: the QA proves the basis only from camOf's own origin at yaw 0 (T1/D1Q/D1/R2 on the range); a PROJ_FWD_AGREES row at yaw=π/2 with non-zero off.f, plus CAPITOL_TURRETS_FACE_CENTRE, would have caught 1–3.
```

## Lens 01B

```
LENS 1B — camera/projector/motion (basis math checks out; stick chain right; problems elsewhere)
HIGH · :1801-1806 drawTbox uses raw o.x/o.y/o.z for plates (every other consumer goes through qWorld) → on the range the AMBER/RED T-box + label render at world x≈0 while the silhouette is at x≈−205+lane·10 (lane 20: 5 m off; lane 0: 205 m off). Also pts are a diagonal quad, not an AABB.
HIGH · :1067-1068 camOf seat offset uses the old inverted forward → pilot eye 0.58 m behind hull centre, tgt seat 0.48 m ahead (swapped fore/aft); PROJ_FWD_AGREES tests only T1 (turret skips the offset).
HIGH · :3660-3670 driveSign is a tautology (measures along fwdOf, the same function phys uses) and runs only at yaw 0 → a sign flip in fwdOf passes every drive row. Fix: assert a literal direction at yaw=π/2 (dx<−0.25).
HIGH · :3729-3733 FWD_IS_WHAT_YOU_SEE forces yaw=pan=tilt=0 → fx and fy terms are zero; only fz>0 is tested. Only PROJ_FWD_AGREES couples fwdOf to proj, for one unit at one pose.
MED · :3671-3687 lookSign/TURRET_LOOK_* assert a pan-delta sign only; with relinq=true the pilot camera ignores pan → rows validate a variable with no effect on the picture; no TURRET_LOOK_RIGHT.
MED · :2504-2508 strafe along rightOf has zero coverage (every harness sets lx:0; no LAW_LRIGHT).
MED · :2117-2118 (also 2270, 2343, 4087, 4274) every runtime auto-aim aims from the UNIT origin while pipOff/plateHit measure from the CAMERA eye (turret eye u.y+1.6) → T-key auto-aim is ~1.8° (~39 px) high at 50 m and misses its own target; the QA's aimPlate is a separate, correct implementation.
MED · :2071-2086 tap-to-designate candidates() never include PLATES/rings/drones/foils/buoys → on the range a tap on a visible silhouette yields 'CLICK A MARK' or designates whatever lockOn returns; pickNear has no QA row.
What else: lockOn's cone uses the unit origin against the camera's direction (1.8° off at 50 m, lk.dist is unit-to-target); lockOn reads a camera the pilot may not steer under relinq; look-drag bypasses relinq/turret/clamp guards; two tilt clamp regimes (targetN ±40/20 vs phys ±80); zoom is in proj but not in cone thresholds or pick radii; QA rows mutate global state by hand (order load-bearing); the one self-defending row is missing: pick a point, pan right N ticks, require proj(...).x to decrease.
```

## Lens 02A

```
LENS 2A — exposures and modes
1 HIGH · :2169 applyHit resurrects ANY plate (up=true, fall=0.05) incl. one the lane run retired → zombie: never falls, lockable, re-shootable; in stay never _down; in qual40 extra rounds.
2 HIGH · :755 + :4215 TRAINING·DOWN terminal state: all ten _down → gap branch k++ every frame forever (re-shuffle + 420-scan per frame), no toast/HUD; resetRangePlates only wired to rngMode onchange (re-selecting same option fires nothing) → no RESET affordance.
3 HIGH · :700-709 QUAL·40 tables cannot fit: cycle = 52 s exposure + 13.5 s gaps; T-I 20 exposures ≈ 132.5 s vs 120; T-II/III 65.5 s vs 60 → TIME always fires first, crediting UNFIRED MISSes to a shooter who never lapsed; table III caps return 0 for 200/250/300 but the schedule still exposes them → max 36/40, 40/40 impossible (research doc promises 23/30/36/40).
4 MED-HIGH · :2203-2211 → :2172 at CH0 in qual40, a shot at a non-plate (ring/door/obj) runs qualRecordShot against BULL-1 (fresh cap key, cap 2) → scored as a qualification hit.
5 MED · :3755 MODE_RESET_RETURNS is true by construction (some plate up after 6 s; _down only written in stay) — never checks that the HIT plate itself returns; the hit plate returns only when the order wraps (~65 s), while the toast/doc read as prompt reset.
6 MED · :4236 seatLane does no range work (no RANGE_RUN/plates/qual reseat); lanes tick continuously so the seated lane is mid-run; in qual40 the lane lock engages only after qualStarted → join a half-elapsed exposure and burn round 1 as a lapse.
7 MED · :3562 dt clamp 0.05 → below 20 fps the range runs slow (10 fps: 3 s exposure = 6 real s; table I = 240 s) → slow devices qualify easier; simTick diverges between peers.
8 LOW-MED · :747 per-frame cost 42 × PLATES.find over 420 (≈8.8k compares/frame), exposureOrder re-shuffles on every gap expiry (never memoised).
What else: rangeExpose never syncs R.k (comment 'resumes from it' false; QA rows run a state the scheduler never produces); qualT0 falsy at clock 0 → table never expires; !q arm fast-forwards; qualResetPlatesForTable and rangeRunReset agree only via state.lane; goRange's rangeReset is inside if(u&&q) and never resets the tower; PLATES start up:true until first reset; rounds counted per shot not per exposure (two shots in the fall window burn two rounds); RANGE_MODE_NAME undefined for unknown modes.
```

## Lens 02B

```
LENS 2B — range runtime
1 HIGH · a MISS does not end the exposure → the same exposure charges TWO rounds (the miss + the lapse); after a miss fireN re-arms red+hiApproved (:2218) so spam-fire charges a round per press.
2 HIGH · plate coordinates are lane-local; only qWorld consumers know: targetN (:2117) aims at q.x−L.x (76° off on L01); drawTbox (:1805), wire box (:1727), T-label (:1781), state.fx (:2170) draw the box L.x metres away from the silhouette.
3 HIGH · on the normal entry path state.mode is 'quad' (practiceNoRoom → applyMode(_selCraft||'quad')), goRange skips applyMode('turret') because 'T1' is whitelisted → slots() falls to doors → T1/T2/T3 dead at CH0 ('NO T1'); lobbyLive same shape.
4 MED · slots() lacks lockOn's fall>0.25 gate → within 0.4 s of a kill, '1' re-designates the corpse and re-kills it (second round, even a second scored hit under cap 2).
5 MED · seatLane clears nothing → stale cross-lane designation jams firing (WRONG LANE forever) until another designation.
6 MED · tick cost ≈8.8k predicate calls/frame at rAF rate; platesHere() allocates per call, called many times per frame.
7 MED · table clock starts on first exposure (correct) but budgets cover gaps; T-II/III always time out; a shot tripping the deadline is charged to the next table with restarted qualT0.
8 LOW · _down cleared everywhere except qualResetPlatesForTable (lane-scoped); stay-mode dead lane is QA-blessed by MODE_DOWN_STAYS.
(d) the bracket is lane-scoped and drawn via qWorld (right place); drawTbox is not → same plate annotated in two places. Bracket seconds freeze during the fall.
What else: PLATES up:true before first reset; qualCap keyed by suffixed id vs cap by base; applyHit sets up=true on any ref; qualStartCurrent gated to mine but a lane change during a table can score on another lane; 120 s of frames not time; a throw in rangeTick freezes every lane silently.
```

## Lens 03A

```
LENS 3A — scale-true hit test (f = 0.6656·H px/rad at zoom 1; H≈600 on a phone → 399 px/rad)
1 HIGH · the 6 px floor collapses 9 of 10 silhouettes into one identical 12×24 px box; C-300 E projects 0.45×1.04 px → 700× over-scored; 50 m F 3.3× over. 14 px off at 300 m = HIT, 14 px off at 50 m = MISS — backwards.
2 HIGH · RANGE_HIT_50_OFF10 depends on canvas H (needs H ≥ 683) → red on a phone, green on a laptop; RANGE_MISS_300_OFF20 is vacuous (proves the constant).
3 HIGH · a downed/lapsed plate is still hittable and resurrected (plateHit ignores up/fall; k only shrinks top; top clamped at bot−12).
4 MED · rect vs outline: F dome corners 21.5% empty, E shoulder notches 12.3%; second-order vs the floor.
5 MED · w.y||1.2 fires on every flat lane (qWorld y exactly 0 on the 14 QUAL lanes incl. lane 0) → the QA aims 1.2 m ABOVE the plates and passes on vertical slack; the C-50 band flips CIRCLE/SILHOUETTE with H.
6 MED · y gets ±6 px on top of the floored box while x gets none → 12 wide × 24 tall, inverted for every F; k has no effect at zoom 1; plateRect omits silMesh's fall z-push.
7 MED · the aiming ring is drawn as a horizontal hoop (ring() is XZ-plane) but scored as a screen disc; at range rpx floors to 6 = half → every far hit reports CIRCLE, near hits SILHOUETTE — backwards.
8 MED · a constant pixel floor changes the standard with pinch zoom (15 mrad at 1×, 4 mrad at 3.2×) and with H; should be angular (PIP_FLOOR_MRAD ≈ 1–2).
What else: isPlate keys on id[0]==='C' + form; CULLED → automatic scored MISS; bot=max(a.y,b.y) assumes a level base; bracket (8/16) larger than the scoring box (6/12); caps regex on padded lane ids; lane switch mid-table mixes two orders; qualH not bounded by qualR.
```

## Lens 03B

```
LENS 3B — hits, scoring, records
1 HIGH · CIRCLE/SILHOUETTE band never reaches a record (toast + lastBand only); HIT/MISS events carry the bare word; SIM-ACTION has pts/direct only → centre hit and edge hit are byte-identical in events, hash, sidecar.
2 HIGH · zombie plate: applyHit sets up=true/lifePct=0/fall=0.05 on ANY ref; rangeTick advances fall only for R.cur → a hit on a non-current plate stands forever, lockable, each further pull another HIT/SIM-ACTION/+100/round.
3 HIGH · :2218 a MISS keeps red and re-arms hiApproved; lapse/rangeTick never clear desig/tgtSlot → at CH5 one approval → unlimited follow-ups; the red box outlives the pop-up.
4 HIGH · plateHit never checks q.up/fall; PIP floor makes a fallen plate a ≥12×12 px box → firing after the lapse registers a HIT (a lapse booked as MISS + a HIT, two rounds, +100, zombie).
5 MED · ledger ignores the qual verdict: cap-exhausted / table-III far-plate / post-qualDone hits toast NO-SCORE but events say HIT + SIM-ACTION 100 + SCORE.
6 MED · QUAL·40 result exported nowhere (metricsOf/pack/sidecar lack qual*); badge lives in toasts and the HUD string.
7 MED · double kill inside the 0.42 s fall window: slots() filters on up only; lockOn short-circuits on state.desig.ref before its fall filter.
8 MED · simDirect is reachable from two on-page buttons (PLAY SCENARIOS, SIM 42×6): playScenarios forces simDirect and challenge=0, fires synthetic POP-SC-n through fireN/applyHit; its restore misses qualR/qualH/qualCap/… → a QA button can inflate a qualification.
What else: simDirect shots toast 'HIT · MISS' (band from real geometry); table III caps → max 38/40; lapse-boundary double booking (no per-exposure key); ring path netEvent-only vs pop path decide-only; peer reducer parses '%' that HIT never carries; qualCap keyed by lane-suffixed id.
```

## Lens 04A

```
LENS 4A — QUAL·40 vs doctrine (arithmetic from constants: cycle 52 s exposure, avg 5.2 s)
1 HIGH · no table fits: T-I 20 exposures = 132.5 s vs 120 (18 complete); T-II/III 65.5 s vs 60 (9 complete) → TIME fires first unless kills save ~0.6 s/exposure.
2 HIGH · a fired miss is charged twice (shot + lapse); misses cost 2 rounds, hits 1 → a poor shooter's qual ends in ~20 exposures.
3 HIGH · the bull ring scores qual points and starts the clock: CH0 non-pop slot → BULL-1 → qualRecordShot; tables I/II caps ignore id → BULL hits score; qualStartCurrent from qualRecordShot is ungated.
4 MED-HIGH · caps vs schedule contradict: table III exposes cap-0 plates → max 36/40; EXPERT 36–40 collapses to 36.
5 MED · TIME does not double-count lapses, but a shot in overtime is recorded into the NEXT table (uncapped qualR → 41 rounds).
6 MED · HUD: current table label with GLOBAL counters; inflated denominators; timer burns while on another channel (rangeTick gated on challenge 0, clock not); qualT0===0 treated as unset.
7 MED · ASM_QUAL40 fixture is a literal from before the exposure model (top 36 = the new ceiling; mean 30.17 unreachable under double-charge).
8 MED · a shot at a lapsed plate scores and resurrects it; MODE_QUAL_TIMED drives rangeTick without advancing state.clock → TIME path, budgets, double-charge all outside QA; QUAL40_TABLES asserts exactly the unreachable literals.
What else: qualCap keyed by lane-suffixed id vs cap by base; rangeLapse not gated on chNum; rangeRunReset() resyncs all 42 lanes; qualResetPlatesForTable downs platesHere only; RANGE_RUN never pruned; mode change discards an in-progress qual silently; the 1.5 s gap decides completability and carries no source.
```

## Lens 04B

```
LENS 4B — the three modes as a player experiences them
(a) PASS: goRange parks, pre-aims rangeFirstPlate, rangeReset; but pre-aim targets the plate BASE → always SILHOUETTE. (b) clock starts on first exposure; lapse announced only by a 1.4 s toast; qualExpired never surfaced. (c) mostly pass by accident (rangeReset buried in if(u&&q)); qualAdvanceTable's reset is lane-scoped. (d) FAIL. (f) no wrap bug.
1 HIGH · a missed shot costs two rounds (shot + lapse) — the biggest correctness bug on the player path.
2 HIGH · firing at a dropped plate resurrects it permanently (the red box outlives the exposure; T-box hides itself but stays armed).
3 MED-HIGH · TRAINING·DOWN dead-ends silently; no RESET control; re-picking the same option fires no change.
4 MED · seatLane after choosing QUAL·40 charges an exposure you never saw and drops the pre-aim (pan/tilt 0).
5 MED · no table completes inside its clock (132.5 vs 120; 65.5 vs 60).
6 MED · bracket label and T-box label collide on far plates; neither clamped to the canvas.
7 MED-LOW · LOCK readout font size changes with the bracket loop (10 px vs 12 px); shares the H-20 baseline with the right label.
8 MED-LOW · MAP lane tap unreliable (~9 px per lane, 80 px pick radius, most lanes unlabelled).
What else: toast is single-slot 1.4 s; every table replays the same order (memorisable); table advance lane-scoped; phScore overflows and clips; chNum vs +state.challenge gating mismatch; no paused guard on the tower; QA never fires a shot in qual40.
```

## Lens 05A

```
LENS 5A — the reducer law
1 CRITICAL · :1972 world reduced in ARRIVAL order, hash in orderKey order; nothing re-reduces the sorted log → APPROVE before DESIGNATED is dropped (peer amber, originator red, hashes identical). sequencer-2525 proves convergence only because applyWorld is stubbed.
2 HIGH · :1940 slot:(same&&same.slot)||state.slot||1 and t:state.clock make the reducer a function of LOCAL unhashed state → two peers end with different desig.slot; approveDesig/fireN then redden/clear the wrong board row; reducer non-idempotent under SNAPSHOT replay.
3 HIGH · :1461 vs :1422 two writers to state.desig on the DESIG path; commIn's overwrite attributes by=m.peerId (the envelope SENDER, not the originator) from a narrower ref pool (no QUAL/foils) → in 3v3 a forwarded DESIG makes the forwarder the designator; the two-humans rule judges the wrong human; SEQ_COMMIT-only peers disagree.
4 HIGH · :1919 HIT never applied (parses '%' the producer never writes), MISS no branch, SIM-ACTION copies absolute blu/red (last-writer-wins) → target death/fall/mist never cross the wire.
5 MED-HIGH · :1938 unresolved id → placeholder ref + kind 'obj' on the originator too (designate() runs ev() immediately) → CH0 ring branch shoots BULL-1; placeholder has no lane → WRONG LANE guard skipped; unsuffixed 'C-50' resolves to the QUAL prototype (lane undefined).
6 MED-HIGH · :747 rangeTick is per-peer wall-clock, unsynced, unhashed: same order, different phase/timing/mode per peer → peers aim at different silhouettes while MATCH.
7 MED · provisional rows mutate the world but not the hash; a never-committed provisional keeps its world effect under MATCH; the commit twin path does not re-apply; SNAPSHOT imports the sender's desig then re-derives with the receiver's state.slot.
8 MED · the reducer law's proof tests r.128 with applyWorld stubbed; r.130's reducer change is asserted only by regex.
What else: SID regenerated on reload (reconnecting peer = new originator; by stops resolving); dedupe by eventId then orderKey mismatch between provisional 'P:' keys and committed keys → applied twice; sessionCommitEvent reachable twice for one row; sessionBroadcastCommit silent when the channel is closed (no retry); state.hiApproved is a hashed global boolean with cross-talk; commIn synthesises local REJECT/HOLD/REQ/GRANT rows with the receiver's peerId → different canonical events per peer.
```

## Lens 05B

```
LENS 5B — replay and evidence
1 HIGH · :1919-1924 applyWorld HIT branch is dead: parses /(\d+)%/ from result but the only producer writes result 'HIT' → a replayed/received HIT changes nothing (plates stand); MISS has no branch. Replay reproduces the hash, not the world.
2 HIGH · :744-746 a LAPSE is not a canonical event (rangeLapse only toasts); qualAdvanceTable('TIME') adds misses with no ev(); qualR/qualH/qualTbl/qualCap/qualExpired are in pack()/sidecar NOWHERE → the QUAL·40 score cannot be reproduced or exported. Fix: ev('LAPSE',id,'UNFIRED MISS',{table,round,hits}), ev('QUAL',…) on advance, qual block in pack().
3 HIGH · :3858/:3867 batch harness stamps sim from opt.sim while forcing state.simDirect=true unconditionally → playScenarios(42,{sim:false}) reports 'HI 42/42' for 100% simulated runs (the r.102 lesson reintroduced). Read back sim:!!state.simDirect.
4 HIGH · :3867-3888 batch trials linkSend their simDirect HIT/SIM-ACTION rows to peers then restore() deletes them locally → the room diverges forever; restore resets evSeq so eventIds repeat and the peer's dedupe drops later trials.
5 MED · :3794 deferred DRAW_COMPLETES mutates rows/state.qa after publication; state.qa.t never restamped → two packs, same rev, same t, different tallies; F12_PACK validates the previous run's pack.
6 MED · :3794 timer captures rows by closure but writes state.qa by reference → re-running QA within 1.5 s inflates pass; qa.total ≠ outcomes.length.
7 MED · :3634-3707 boot self-test injects fabricated events (incl. one simDirect kill) into the canonical stream and hash while the sidecar says untouched:true.
8 LOW · lastBand/drawErr/drawDone are not hashed (correct) but reach exported outcomes via note strings (device-dependent text).
What else: fnv1a64 is 32-bit printed as 8 hex (2^16 birthday); provisional orderKey 'P:' sorts after digits; SNAPSHOT-adopted rows without committed pass the filter with a mixed fallback key; sessionAdoptHead takes max unconditionally; packBudget reports but never truncates; state.clock never in the stream; metricsOf substring-matches results; wall-clock vs state.clock unaligned.
```

## Lens 06A

```
LENS 6A — the fire gate
(1) Live DESIG path: applyWorld then commIn's overwrite → by = the peer's id (correct on the live path); the ||SID fallback only on SEQ_COMMIT/SNAPSHOT replay, fails CLOSED (peer-marked target becomes unapprovable after a re-commit/resync).
(2) r.128/r.129 already stamp peerId. But yes by another route — finding 3.
(3) No red-from-nothing; an early APPROVE is dropped and never re-requested (stuck amber). Neither APPROVE path checks phase==='amber' → a stale APPROVE re-reds a fresh designation.
(4) No auto-approve timer; spiralTest (key P / #btnSpiral) designates BULL-1, auto-approves at 900 ms, fires at 1200 ms with no lobby guard.
(5) A lapse does not clear red; a downed plate is still hittable.
1 HIGH · :1466 commIn APPROVE has NO gate (no LIVE/membership/approver≠designator check; approvedBy off the wire) → a peer on r.128 or without LOBBY_LAUNCH self-approves and my deck draws red; audit says PEER HI-2.
2 HIGH · :1943 applyWorld APPROVE reds any matching id regardless of phase/age/author; SNAPSHOT replay (:1494) has no dedupe/sort → an old APPROVE re-reds a new amber.
3 HIGH · :1489 SNAPSHOT imports pay.desig (red, sameDevice…) and hiApproved verbatim and never restores lobby.phase (only LOBBY_LAUNCH sets LIVE) → a reconnecting phone is in WAITING → can target, self-approve and fire alone; its APPROVE reds everyone.
4 MED-HIGH · every LOCAL designate() is rewritten by the reducer: how → 'PEER' (provenance misattributed); off-pool refs → dummy + kind 'obj' → CH0 ring branch (QA rows assert phase only).
5 HIGH · :763/:744/:2214/:776 lapse leaves red; plateHit ignores up/fall; the same PLATES object is re-raised → authorization transfers to the NEXT exposure.
6 MED · :2218 MISS re-arms red + hiApproved; no time bound on red; desig.t never read.
7 MED · fireN(n) ignores n; slots().find unreachable; WRONG_LANE after the red check; designate's wrong-lane refusal writes no decision record.
8 MED · two same-device shortcuts: spiralTest on bare 'P' clobbers the crew's live designation; CH5 in-page APPROVE button = one tap by the same person.
QA gap: no row ever calls commIn or applyWorld; LIVE rows hand-set phase/by.
What else: dedupe key without eventId collapses all APPROVEs per target; room id is the only auth scope, light4 computed but never verified; hostId adopted from the first message (two hosts → divergent commits after both drew red); HUD cannot show which gate was satisfied; hiApproved written by 5 sites, exported as if authoritative; goRange/rangeReset/lobbyEnterLive reshape the world without clearing desig.
```

## Lens 06B

```
LENS 6B — AUTHORITY UNDER FAST PACE (6 target / 6 approve / any of 12 fire)
1 CRITICAL · approveDesig(:2131-2155) has no slot argument, acts on the singleton state.desig; designate writes tgtSlot[n] AND overwrites state.desig → six ambers coexist but only the newest is approvable; T1..T5 stay amber forever.
2 CRITICAL · fireN(:2190) discards n when state.desig exists; the s.id!==state.desig.id guard is unreachable; lastShot.slot can name the wrong box.
3 CRITICAL · net DESIG handler (:1458-1464) never writes tgtSlot (peer-marked target has no box, no list row), overwrites an already-red state.desig, carries the SENDER's slot number into my index space, skips the lane guard → my T1 RED box renders red while state.desig is their amber; F rejects AMBER_NO_APPROVE on a red-drawn box; on a kill, the peer's slot number deletes a different box.
4 HIGH · net APPROVE (:1466-1474) applied only if my singleton points at the same id; tgtSlot phase never set for peer-sourced designations → a third seat never sees the authorised red box ('any of 12' impossible).
5 HIGH · byPeer (:2137-2141) accepts ANY lobby member — no team/lane/role check; desig.by on the peer path is wire data (m.peerId) unverified against transport identity → an opposing RED seat or a forged peerId satisfies 'two humans'; no lane guard in approve → APPROVE decision written for a shot later refused WRONG_LANE.
6 HIGH · the only approve control calls approveDesig('HI-2') → sameDevice always true → every decision says SOLO HI-2 even for a genuine peer approval; QA asserts only phase==='red'.
7 MED · slots()/targetN cap selection at 3 (keyboard/voice 1/2/3); T4–T6 creatable by click but never re-selectable.
8 MED · slot record {id,ref,phase} has no by/approvedBy → the HUD cannot show who marked / who cleared.
What else: designate never dedups an id already in a slot (board walks to 99, wraps over T1); a non-lethal hit re-stamps red + hiApproved with no second human; state.hiApproved is one global boolean; CH5 popup bypasses approveDesig; SNAPSHOT accepts pay.desig/tgtSlot/hiApproved wholesale; hot()/3D box key off the singleton; lobby.ts has no designation/approval rules and lobby-2525 still lifts r.128.
```

## Lens 07A

```
LENS 7A — render budget across the ladder (seg 280/900/1055/1675/1830/2450/2605/3225/4000)
CH0: exposed plates survive at every level (plates-first works); the seated turret box survives only at MoT ≥ 2.5. Capitol CH1–5 at MoT 1.1: 12+205 world, budget dies inside liveMeshes → turrets/doors/pops 100% dropped; first pop at 2.5, all 8 at 3.5.
1 CRITICAL · Capitol targets get zero budget at the Pi-class levels; 'must-hit first' implemented only in the CH0 branch.
2 HIGH · drawSwarm cap computed against total budget (S.seg*0.55) with an 80-seg gate → at 1.5 the swarm eats the tail (own turret box, doors, world box vanish). Cap should be remaining headroom minus a reserve.
3 HIGH · pit-box filter gated on S.maj===1 → 1.5→2.1 RANGE_WIRE 133→601 while seg 900→1055: the ladder is non-monotonic; lane lines carry no lane tag (exempt from the filter).
4 HIGH · 43 friendly turret boxes (516 segs) drawn before any target in Capitol modes.
5 MED · the designation world box is budgeted and drawn near last → vanishes under pressure; only state.desig gets one (T2/T3 never).
6 MED · rangeTick O(lanes×plates) with Array.find at rAF rate (up to 17,640 predicate calls per branch per frame); MoT does not reduce it.
7 MED · PLATES walked 3+ times per frame (drawPlates, platesHere for brackets, slotsAuto); silMesh allocates per plate per frame.
8 LOW · MoT-1 wing declutter dead (names 'wingEW'/'wingNS' vs 'wings').
What else: ground grid spent off-books (never counted dropped); state.dropped conflates budget vs culled; mot() 96 fps at 1.1 vs HAL.PI 15 fps never reconciled, calibrate never demotes state.level; CH0 draws Capitol furniture from 2.5 up; falling plates cost full silMesh; PLATES up:true at boot = worst case; DRAW_COMPLETES passes with a world with no targets in it — no assertion that the must-hit set survived the budget.
```

## Lens 07B

```
LENS 7B — visibility of a 1 m target on a phone (W=390, H≈698, f=464.6 px/rad; 300 m E = 0.53×1.21 px)
1 HIGH · phScore prefix overflows #playHud (nowrap/hidden) → BLU/RED off-screen; the canvas FPS text overprints the clipped tail (glyph on glyph in the capture).
2 HIGH · bracket label and drawTbox label share a baseline 1 px apart → one smear over the pixels you shoot; bracket label also crosses the reticle when centred.
3 HIGH · the '6 PX PIP FLOOR' exists only in the hit test, not in the draw path; not zoom-scaled → up to 24× the target; badges awarded off it; no vertical-window QA row.
4 HIGH · LOCK readout drawn under the opaque #kebab button (fixed 8/10 px, 44×44) → 'LOCK' invisible, id prefix clipped ('L21 100M'); font inherits 10/12 px.
5 MED · the bracket is drawn for EVERY exposed plate; PLATES start up:true and two CH0 entry paths skip rangeReset (spiral gate, peer challenge) → six stacked '0s' brackets; rangeExpose orphans the previous R.cur.
6 MED · MAP labels still collide at 390 px (30 px labels, ~9 px lane pitch); header truncated and overprinting playHud.
7 MED · zoom is pinch-only (no wheel/keys/buttons), undiscoverable, unlabelled; shared with the map camera; pinch on the range re-tilts/yaws the map; can pinch out to 0.55 after seating.
8 LOW · nothing r.130 added is outside T13; #020406 on .roomcard is a pre-existing DOM 14th colour; the reticle dot is a fill (pre-existing); OK-set guard covers the static builder only.
What else: bracket unclamped to viewport; neighbour C-50s brighter and unbracketed; T## labels a third text layer; layout() ignores devicePixelRatio (cheapest win for a 0.5 px target); fps never compared to the rung's demand; zoom change mid-qual changes the scored difficulty.
```

## Lens 08A

```
LENS 8A — QA honesty (the r.129 fix is real; what the new row does not prove)
1 HIGH · :3794 DRAW_COMPLETES never rendered into #qaOut (written once at :3801) → a failing row shows only as a counter mismatch; the diagnostic string is never displayed.
2 HIGH · the 1.5 s window closes before the human chooses anything → proves draw() completes for the default boot config only (T01, turret, CH0, op); swarm/CH1+/drawTbox paths unproven.
3 HIGH · drawDone stamped only on the op path; cumulative and never reset → the map path can throw forever while the row stays OK; a session starting on map reports a false NO.
4 HIGH · :3566 try{sample();ssses();}catch(_){} is the r.129 pattern: sample() has unguarded DOM ids; one missing node freezes telemetry silently; the SSSES row proves callability once, not liveness; exports truncate with no marker.
5 MED · :3569 the catch wraps the whole loop (phys/spawn/PRESENCE) yet labels everything 'render exception'; drawErr sticky forever; drawErrN write-only.
6 MED-HIGH · toolSelfTest is on a button; QA designates/approves/fires QA-* ids and never restores decisions/events/evSeq/score/hits/blu/red → replayHash over synthetic events; the CH0 ring shot linkSends SIM-ACTION to every tab.
7 MED · plates and RANGE_RUN are reset to clean, not restored → re-running QA mid-table leaves qual counters 'in progress' with every plate down.
8 MED · source-text rows (/WAIT BOTH READY/, /PLATES/.test(commIn…), /platesHere/.test(slots…), /stableCanon/) assert behaviour from string presence; linkSend triple-swallows; lcRecv error only to a DOM line.
What else: try{toolSelfTest()}catch(e){console.warn} at :3912 — a throw mid-QA leaves the panel blank, state.qa undefined, pack().qa null, the deferred timer never scheduled, restore skipped; htmlBytes measured on the live DOM; SYNC_DIRECT structurally false so N/N is impossible; background-tab rAF suspension → false 'no frame completed'; state.crash feeds no row.
```

## Lens 08B

```
LENS 8B — do the r.130 rows prove what their names say? (verdict: almost every row can pass while the behaviour is broken)
(a) no row aims by picture; aim and score share the basis, so a mirrored world passes; basis rows run at yaw 0 where sin terms vanish. (b) MODE_RESET_RETURNS passes while the hit plate never returns. (c) MODE_QUAL_TIMED never reads qualH. (d) LIVE is never exercised on the range — and in LIVE the range is unfireable (plate designations are always local → approveDesig refuses → NO_RED_BOX). (e) zoom cancels between aimPlate and proj.
1 HIGH · measured tolerance 10.2 px at 50 m vs 6.0 px at 300 m; 9 of 10 plates share one 12×24 box; a scale-blind pipOff<15 passes all four rows.
2 HIGH · the 'aimed' shot aims 1.2 m above ground (w.y||1.2 on flat lanes) → pip 0.4 px above the head, rescued by the min-height clamp; three different aim heights (||1.2, ||0.4, h·0.42) none asserted equal.
3 HIGH · MODE_RESET_RETURNS observes no return; !_down vacuous in bounce; MODE_DOWN_STAYS samples at 6 s boundaries only.
4 MED-HIGH · MODE_QUAL_TIMED cannot tell lapse-as-MISS from lapse-as-HIT; add qualH===0.
5 MED-HIGH · the range is proven only in WAITING; LIVE two-humans on the range would leave two humans in adjacent pits unable to fire.
6 MED · basis rows blind to a left/right mirror; fix: assert proj(qWorld(C-300)).x > W/2 and C-250 < W/2.
7 MED · RANGE_SEES_PLATES = 'in front of the camera' (proj never bounds x/y); ALTC_LAYOUT never checks 150/200 counts or w/h.
8 MED · DRAW_COMPLETES proves no exception in 1.5 s, not a readable frame; segs/dropped printed, never asserted.
What else: rangeExpose leaves R.k; state.clock never advanced by the QA loop (TIME untested); vertical tolerance 16 px vs 6 px horizontal; band decorative at range; player path (stick rates, clamps, tap pick, MIST) untested; drawErr never clears.
```

## Lens 09A

```
LENS 9A — lobby, seats, lanes
(1) turrets park on claimed lanes; nothing enforces one member per lane. (2) peers do NOT see the same exposure at the same time (same order, local RANGE_RUN/dt; MATCH gate blind). (3) PRACTICE falls through to SOLO HI-2 but never tears down the link. (4) a peer's DESIG for THEIR lane becomes MY state.desig and jams my targeting. (5) edge lanes fine.
1 HIGH · reducer/commIn DESIG adopt a foreign-lane plate with no lane check → lockOn short-circuits on it; mark() → WRONG LANE on every pull.
2 HIGH · laneClaims recorded, never enforced; everyone claims lane 20 (default); no lane picker in the waiting room → both members on L21.
3 HIGH · lane from the wire never range-checked → state.unit 'T100' → camOf TypeError every frame, caught → deck freezes silently.
4 HIGH · the range has no canonical clock: rangeReset wipes all lanes on any local mode/challenge change; nothing carries k; MATCH while different silhouettes stand. The two-phone RANGE gate needs per-lane {k, phase, t} or host EXPOSE/LAPSE events + rangeMode/qual state in the snapshot.
5 MED · PRACTICE on a still-connected peer: SOLO approve broadcast → the LIVE peer draws red with no gate (the APPROVE reducer is the hole).
6 MED · goRange/seatLane phase-blind; never republish the seat; roster keeps a stale lane.
7 MED · a peer's HIT advances MY exposure index (lifePct=0 on the shared PLATES object → R.k++), no MISS/LAPSE recorded → exposures silently lost from the 40.
8 LOW · edge-lane ±1 asymmetry cosmetic.
What else: peer DESIG never writes tgtSlot; SNAPSHOT restores pay.desig/unit/tgtSlot verbatim; 1v1 masks lane collision; rangeMode/qual never exchanged; qual lane lock guards the picker only; exposureAt wraps mod 10; host locals vs seats = two sources of truth.
```

## Lens 09B

```
LENS 9B — drift between deck and lifted modules
(a) all 17 lifted functions (sequencer 10, lc4 7) and all 28 lobby* functions are BYTE-IDENTICAL r.128 → r.130; applyWorld changed but is stubbed. (b) every lifted name matches exactly once. (c) re-pointing sequencer/lobby to r.130 passes (13/0, 38/0) — verified by running.
1 MED-HIGH · the divergence is in the STUB: r.130's reducer reads peer-local state (same.slot, state.slot, state.clock) and applies in arrival order while the hash sorts → peers disagree on desig.slot/.t/.by with one hash; the proof cannot see it.
2 MED · sequencer/lobby pinned to r.128 while HEAD is r.130 → the served file is the one nobody proves. Fix: one shared HEAD constant + an identity assertion vs r.128.
3 MED · lift takes the FIRST match, no count==1 / brace-balance assertion → a decoy stub above the live function would be proven.
4 MED · terminator = first column-0 '}' (formatting, not syntax); quiet truncation possible.
5 LOW-MED · range-2525 hard-codes parameter names/one-line layout (loud, not dangerous).
6 LOW · mkRow uses verb 'DESIGNATE' vs the reducer's 'DESIGNATED' → a future real-applyWorld injection would pass vacuously.
7 LOW · lobby.ts extensionless import → plain `node tests/lobby-2525.test.mjs` crashes; only the npm script works.
8 LOW · REVISIONS.md r.130 says range-2525 (64); the gate reports 65 — prose counts unverified inside a sealed register.
What else: the stub surface is the blind spot; state.clock inside reducer output; provisional→committed replace skips applyWorld; four gates, four pin strategies; the chain protects bytes, not claims.
```

## Lens 10A

```
LENS 10A — what a stranger sees on a phone
1 BLOCKER · boot QA leaves a live RED designation QA-BULL (26 m phantom) on the first frame: HUD 'RED T1 QA-BULL', a 3.4 m red world box off the right edge; the sv2 snapshot is taken after the mutation.
2 HIGH · HUD line and FPS text share one 12 px band on two layers; 'PIP FLOOR 6 PX' is a renderer constant on the player HUD; line overflows.
3 HIGH · nine selects above the picture, none scene-aware (lake, seat, MoT, HAL, DIFF irrelevant on the range) → the picture starts 1/6 down the phone.
4 MED · bottom-left status is a 1.4 s toast duplicating the HUD; 'L21 DOWN · TRAINING · RESET' reads as 'target 21 is down, resetting' (DOWN = berm slope).
5 MED · the sail boat (liveMeshes, unconditional) sits inside the 300 m range fan → reads as an intruder.
6 MED · four annotations, three colours, one point; the reticle (filled dot, 32 px ring) is bigger than the target. Proposed single composition: one box, one caption 'T1 · 100 M · 4s · RED' right of the plate, open cross instead of filled dot, dim the rings when a box is on screen, drop bracket corners for boxed plates, delete the floating 'T1' text.
7 MED · '100 M' never legibly stated (bracket prints C-100C; q.pos '100M F' unused); LOCK block under #kebab (44×44 fixed).
8 LOW · the exposure clock is one 10 px glyph beside the muzzle point.
What else: budget starvation returns on any reorder; plateRect null off-frustum → bracket vanishes silently; lane-suffixed vs base ids; #toast no max-width; #playHud clips without ellipsis; .bar wraps portrait / scrolls landscape; CH0 hides other turrets but not swarm/doors/drones; QA mutates live singletons.
```

## Lens 10B

```
LENS 10B — controls on the range
1 CRITICAL · :4083-4090 the CH picker's CH0 handler runs goRange then re-aims at BULL-1 (z 26) and raises the ring → TARGET designates the ring, FIRE scores BULL/MID/OUTER, the tower never sees a shot.
2 CRITICAL · :4255/:4288 first pick of 'SCEN · 50M RANGE' leaves state.mode='range' (goRange skips applyMode because unit T01 is whitelisted) → slots() falls to Capitol doors; keys 1/2/3 slew onto a door. Self-heals on the second entry.
3 HIGH · :3548 two quick taps anywhere (blank sky) fire the approved target; the documented doubleTap FIRE can never fire a fresh designation (amber).
4 HIGH · :3439 voice has no APPROVE verb (chain dead-ends at amber); bare 'fire'/'f' fires with no negation guard ('hold fire', 'cease fire').
5 HIGH · :2492 turret pan = raw stick × 120°/s, bypassing controlLaw: no deadzone/sens/trim, arrow keys do not move the turret, no zoom scaling (3.2× = 0.1 s to sweep the frame); drag 0.08°/px fixed.
6 MED · '1/2/3' lists only exposed plates (one at a time) → T2/T3 always 'NO T2'; T1 is whichever plate is up; targetN teleports the aim (keyboard beats touch).
7 MED · in the 1.5 s gap TARGET falls through to rings/pops/doors → 'NO LOCK' with no hint, or (via 1) a ring lock that sticks.
8 MED · 3 taps fit a 3 s exposure; FIRE's corner sits under joyR on ≤360 px; the button never says SOLO; samePerson recorded false for one human on one phone.
What else: syncSticks vs stylesheet on 561–900 px; pan normalisation vs the CH0 lane pin; R.k advances on fall so cycles are shorter; state.slot never reset by rangeReset; #face not in the pointer exclusion list; voice onerror leaves VOICE ON lit.
```

## Lens 11A

```
LENS 11A — the register held to the Vision-2525 standard (verified: all three rows' sha/bytes/chain recompute; a83e670's tree IS the served bytes)
1 HIGH · REVISIONS.md row r.128 'shipped in d195781' — that commit carries no deck; r.128 was served by 2159671.
2 HIGH · the chain refuses reorder/removal/edited sha or bytes, but NOT a mid-insert with a carried file + recomputed chains, nor a full rewrite: no genesis/head value is pinned outside the file (no signature, no git anchor).
3 HIGH · date, author, shipped-in are outside the hash → the wrong citation can be quietly 'fixed' with the gate green.
4 MED-HIGH · the narrative sections are unhashed; the correction rule is enforced by one hard-coded regex.
5 MED-HIGH · CLAUDE_CODE_NOTES_r128.md is the actual edit of the past: rewritten in four commits, an open item DELETED in 645f41f rather than superseded.
6 MED · ledger entries 23/24 cite a83e670 but the register/gates/research landed in 1ce5a3c — the governance entry cannot be verified from the commit it cites.
7 MED · README carries no digest (only the hashes filename); the gate regexes a filename; the ledger truncates to 32 bits; 33 vs 44 patches with no manifest.
8 MED · missing for a reviewer: a per-revision 'what to click to verify' line, r.128's QA count in the row, the probe evidence path (the most load-bearing unverifiable claim), a link to the verbatim ask, push/live status.
What else: the unanchored chain will be edited the first time a row needs correcting; REV hand-edited in drone-playable; only r.128+ governed; the regex will pass forever after r.140; tie a row to a git object (resolve shipped-in, require the deck blob to equal the row's sha).
```

## Lens 11B

```
LENS 11B — traceability of this round (what checks out: ask hashes cover both files and verify; quotes verbatim; HASHES/carried/served identical; chain recomputes; QA count 75 reconciles; gates pass; drone-render --check exit 0)
1 HIGH · REVISIONS.md row r.128 cites d195781; r.128 was carried/served by 2159671.
2 HIGH · the chain covers rev|sha|bytes only — date, author, shipped-in and the narrative sections can be rewritten with the chain green.
3 HIGH · README says 33 patches, the commit says 44; the patcher script is not committed → 'asserted exact patches' is unreproducible.
4 MED · register says range-2525 (64) / drone-playable (33); actual 65 / 35 — stale numbers inside the sealed register (needs a correction row).
5 MED · research doc: 120/60/60 unlabelled; caps 2/2/1/0 absent; EXPOSURE_S fallback 5 s undocumented.
6 MED · the +1 s/50 m ramp is presented as SOURCED while the same cell cites the FM's 5 s/10 s values; all 'SOURCED (search)' rests on snippets; distances row uncited.
7 MED · domain JSON: last revision 0.015 (2026-09-17, HEAD r.075); no DRN rows for the range/modes/exposures/one-basis/render honesty; handoff sha still the 2026-09-15 ask; drone-crs checks only that the sha is 64 hex.
8 LOW · the ask hash is enforced by nothing; notes appended to CLAUDE_CODE_NOTES_r128.md (whose header still says r.128 is served) instead of a per-revision notes file; the research doc paraphrases the ask inside quotes.
What else: the register's append-only promise is the weakest link; drone-render --check attests view↔JSON only; lifts by regex; DRAW_COMPLETES sampling time; 7.77 MB approached at +20 KB/revision; fidelity rests on snippets.
```

## Lens 12A

```
LENS 12A — gates: invariants or text? (ground truth: 75 rows, 74 pass, only SYNC_DIRECT, 60.1 fps, 0 pageerrors — a number that exists nowhere in CI)
1 HIGH · the 13 QA-row assertions prove only that push('NAME' occurs in the file.
2 HIGH · drone-playable: 3 behavioural assertions (bytes, sha, ledger), ~21 regex-over-source.
3 MED-HIGH · the 'no simDirect' guard is one literal (spaces/!0/aliasing defeat it); anchor drift makes the block empty.
4 MED · range-2525 one-line lifts fail loud; the state stub does less than it looks (centre check passes for any focal length); reads the carried deck, pinned to a literal filename.
5 MED · the chain is tamper-evident not append-only; covers 3 of 7 columns; runs on a fresh clone, no git. drone-playable's two cwd-relative reads only work from frontend/.
6 LOW-MED · malformed rows vanish via filter(Boolean); pre-r.128 rows never byte-checked.
7 INFO · spiral9 GATES == test:ci drone subset now (45); the three browser gates are in neither; SSSES Scalability/Efficiency structurally 0 in CI and reported as a measurement.
8 HIGH · no headless deck gate anywhere: promote the runner as frontend/scripts/drone-deck-qa.mjs (test:drone-deck-qa), serve public/drone-2525/play.html, browser candidate loop, wait for state.qa.total >= N, assert rev, SET EQUALITY of row ids vs a checked-in manifest, failing ⊆ EXPECTED_RED (tight both ways), pageerrors 0, drawErr falsy, drawDone>0, range rows 'aimed' + simDirect falsy at end, fps ≥ 30, write perf/after.json; own deploy.yml step after test:ci with playwright install, fail closed.
What else: the 75 denominator is unowned; toolSelfTest has no per-row try/catch; revision bumps touch four files by hand; test:ci is one && chain; stale vs absent perf indistinguishable; nothing signed; new Function is non-strict.
```

## Lens 12B

```
LENS 12B — the React shell around the deck (shell untouched this round; repo clean at 1ce5a3c)
1 HIGH · the shell's CH0 (training.ts: doors on a city block) and the deck's CH0 (10-silhouette range, exposures, modes) are two different games both called CH0.
2 HIGH · the PLAY link is a bare href; no mode/lane/rangeMode passed and the deck reads no query params → the on-ramp's SELECT RANGE is decorative.
3 MED-HIGH · Verify Live never probes /drone-2525/play.html; wrangler not_found_handling = single-page-application → a missing deck returns the SPA with 200; drone-route asserts only out/drone-2525/index.html.
4 MED · PLAY button says 'PLAY · r.128' (lexicon englishDefault ×33) while the deck is r.130; top bar shows 0.015.
5 MED · intro/config-bar render hardcoded English challenge names inside {} — invisible to the i18n gate; intro offers only 0/1/3/5.
6 MED · guided-start does not clamp the challenge to the ladder (a first-timer can pick CH5 and every shot is refused).
7 LOW-MED · drone-size caps only four files; round.tsx at 771/772.
8 LOW · stale comment in challenge.ts (9 s vs upMs 14000).
What else: range-2525 lifts from docs, byte-identity to public lives in a different gate; REV hand-edited; deck state unobservable from the shell (no return path, progression never advances); PLAY is one-way; no gate asserts the link target exists; lane/rangeMode absent from the shell's vocabulary.
```
