# Drone-2525 · The Range — the battery he ordered, run on the LIVE r.204 (2026-10-13)

> **Operator, 2026-10-12 ~21:15 CST:** "I need 12 AsM Fleet to test; youbknow mybcriteria but fail toninplment; test and somulate until no phantomntargets and ensure all targets and siloeets have the proper color boxing with button when bulleseye osnover target"
> **Operator, 2026-10-12 ~21:30 CST:** "SSSES , AsM, Simulate, and SPIRAL TEST TO ENSURE NONGLITCHES"
> **Operator, 2026-10-13 ~04:34 CST (on the LIVE r.204, shot50/51):** "way better; keep it ip and run AsM 111 + MoT 333 word, SPIRAL, SSSES , and UX usability test; ensure 'Load and Make Ready' on Qual-40 prior to starting as well as a fee range commands from Range Safety Officer per Army guidelines; and double check all stop lights and times are accurate per real tests"

Everything below was run against the bytes the site serves: `frontend/public/drone-2525/play.html`, **sha256 `2085cd150d08f886b4f8236ed8d8f3f60c2494b6608afed08c7260298039db9b`**, shipped as r.204 in `e5aec75b`, Verify Live #2769. Nothing was changed before the battery ran. His two criteria are the measure throughout: **no phantom targets**, and **every target and silhouette carrying the proper colour boxing, with the right button, when the bullseye is over it**.

---

## 1 · What I measured myself, before any reviewer spoke

A reviewer's claim is not evidence. Each of these was read off the running deck in headless Chromium and the probe is kept in `scratchpad/r205/`.

### 1.1 · The stop lights and the times (his "double check … per real tests")

Sampled every 100 ms of wall time through phase 1 and into phase 2 of QUAL 40 on Lane 21, 390×844 — 947 samples over 94.7 s (`scratchpad/r205/lights/lights-times.mjs`, raw in `samples.json`, table in `report.md`).

| what | measured | TC 3-20.40 Table VI | |
|---|---|---|---|
| 1 target up | 5.0 s | 5 s | ✓ |
| 2 up | 8.0 s | 8 s | ✓ |
| 3 up | 12.1 s | 12 s | ✓ |
| 4 up | 16.0 s | 16 s | ✓ |
| between engagements | 3.0 s | 3 s | ✓ |
| between phases (magazine change + move) | 10.0 s | 10 s | ✓ |
| engagements · rounds · phases | 18 · 40 · 4 | 18 · 40 · 4 | ✓ |

**The programme is right to a tenth of a second.** The light is not:

- GREEN showed **7.2 s** in all, and in **72 of 72** of those samples **no target was up**.
- With a target up, the lamp was **dark in 480 of 627 samples (76 %)**.
- The lamps fire RED at window−2, YELLOW at window−1 and GREEN at the window's **close** — three seconds before the next set appears.

His own **Addendum 13** (r.162, 2026-10-05) asked for "Red, Yellow, green **as time to next set of targets** (1 second per each light)". The lamps today count down to the end of the *current* set instead. A real range light is green while the range is **hot**, which is the same reading. **Owed to r.206**, where it moves with the range officer's start — the officer's commands are what take a line from cold to hot.

**A correction on the record:** a reviewer in this round reported "the light shows GREEN/FIRE through 7 of the 10 seconds of the phase rest". Measured, it is green for exactly **1.0 s** of that rest. The defect is real; that description was not. It is corrected here rather than repeated.

### 1.2 · His colour criterion fails, in pixels and in the painter's own calls

`scratchpad/r205/redfirst/probe2.mjs`, 390×844, TRAIN UP:

| moment | slot phase | silhouette | his rule |
|---|---|---|---|
| aimed, unmarked | — | stroke | ✓ |
| after TARGET | amber | **44 red px** on a marked plate away from the reticle; the painter chose `T13.LOCK` | ✗ |
| after APPROVE | red | red | ✓ |

Cause, read in the source and confirmed by the painter's own calls: `drawPlates` (play.html:2074) evaluates `q.mist?T13.LOCK:phaseCol(q,…)`. `q.mist` is set the instant a target is marked, so **the mist flag beats the slot's phase** and every TARGETED target wears the APPROVED red inside its amber box. Since r.196.

**APPROVE's own colour:** computed `rgb(61, 204, 138)` — the cue green — on an amber box. Only FIRE already wore its box's red (`rgb(226, 75, 59)`).

### 1.3 · Words all over the middle (his 20:44 "remove all text from middle; targets only")

With six targets marked, three looks (1×, 3.3×, 8×) drew **36 words** over the stage, among them `T1 · 50 M LEFT · AMBER` and `T2 · 250 M · AMBER` printed across `T1 · 200 M LEFT · RED`. His screenshot's "everything is still no aligning", reproduced.

### 1.4 · NEW — the deck's own self-check eats a target he has just marked

`scratchpad/r205/redfirst/probe4.mjs`, the **real** TARGET button, not a helper:

```
tap TARGET  → +0ms    amber · slot 1 · "AMBER · T1 · 150 M RIGHT · PRESS APPROVE" · APPROVE lit
            → +150ms  phase null · slot null · desig null · "150 M RIGHT · PRESS TARGET" · TARGET lit
            → +3450ms still gone
THE MARK VANISHED at +150ms after the real TARGET tap
```

Tapping after ~5 s instead, the mark holds for good. Traced with a property watcher on `state.tgtSlot` and `state.desig`:

```
+64ms  tgtSlot REPLACED (1 keys)
       at designate (play.html:2115)  ←  on a LANE 01 plate
       at markLock  (play.html:2428)
       at _ft.onclick(play.html:5222)
       at           (play.html:4951)   ←  the deferred boot self-check
```

The boot self-check's `setTimeout(…, 1500)` row takes the range to run `TARGET_BUTTON_FOLLOWS_THE_EYE`. It **saves** lane, mode, zoom, view, pan and tilt — and then hands the marks, the approval and the magazine back **empty** instead of back as it found them. This is **H1**, recorded at r.204 only as "the QR door's 30-round first magazine"; the larger half is that it eats the player's targets. It is, by itself, a direct breach of his 21:05 "system should always remember what silouettes are targeted".

### 1.5 · The SPIRAL soak (12 runs, 1,100 sampled moments)

TRAIN UP · TRAIN DOWN · QUAL 40 × 390×844, 844×390, 375×667, 428×926 (`scratchpad/soak204/live/soak.json`): 60 fps, **0 page errors, 0 render exceptions, 0 box-without-plate, 0 slot-without-plate**, one button sample disagreeing at 844×390. The soak could not see §1.2 or the window-end phantom because it never sampled silhouette pixels and never hit a target at the buzzer; both checks are added.

---

## 2 · SSSES + SPIRAL, seven lenses on the live r.204 (`wf_05b80117-c94`)
**Verdict: FIX FIRST.** Scores {"efficiency": 64, "scalability": 72, "security": 70, "stability": 70, "succinctness": 66}.

### BLOCKING

**1. CLASS 1a — APPROVE/FIRE on an unmarked plate acts on a stale FALLEN mark and destroys every standing RED box on the lane (r.204's NOT_MARKED guard is one line too late)**

*Evidence.* play.html:2492 puts the inherited TARGET_DOWN guard (decide HOLD + releaseAuthority) ABOVE r.204's new NOT_MARKED guard at :2493, so the refusal is unreachable whenever the stale state.desig has fallen; fireN repeats it at :2580 (REJECT TARGET_GONE + releaseAuthority). releaseAuthority at :5406 then wipes wholesale — state.desig=null; state.hiApproved=false; state.tgtSlot={} — so a standing, APPROVED, RED plate is deleted by a press aimed at a different plate, and two rows are booked against a plate the operator is not looking at. Verified in source; the commonest QUAL-40 sequence reaches it.

*Fix.* Hoist the :2493 NOT_MARKED test above the TARGET_RETURNING/TARGET_DOWN pair at :2491-2492, mirror it above fireN's :2580, and narrow both releaseAuthority call sites to delete state.tgtSlot[slot] instead of state.tgtSlot={}.

**2. CLASS 1a gate cannot go red — BUTTONS_FOLLOW_THE_BULLSEYE's unmarkedRefused leg only ever uses a STANDING stale mark**

*Evidence.* play.html:4815 builds the leg as look('C-100L'); markLock(lockOn(),'QA'); look('C-150R'); approveDesig('HI-2') — C-100L is never dropped, so the leg only ever reaches :2493 and can never exercise the :2492 path that actually fires in play. The row is green on the shipped bytes while the defect above is live.

*Fix.* Add a fourth leg that sets up=false/lifePct=0 on the marked plate before the APPROVE press and asserts Object.keys(state.tgtSlot).length is unchanged and the last row is HOLD/NOT_MARKED, plus the same leg for FIRE.

**3. CLASS 1b — on the MAP, APPROVE stops working and books a NOT_MARKED hold against a plate the map cannot show**

*Evidence.* lockOn() (play.html:2137-2158) is map-blind — it reads units[state.unit]/camOf(u)/pipOn with no viewMode test, while fireOnIt at :943 does test it. markUnderBullseye at :945 only consults the map inside the if(!lk) branch, so an unmarked plate under the invisible bullseye wins; approveDesig's NOT_MARKED guard at :2493 has no map check and books HOLD/NOT_MARKED; hudPhase's unmarked clause at :2991 requires viewMode!=='map' so the strip falls through to LAST/TARGET FIRST. The code comment at :945 and CLAUDE_CODE_NOTES_r204.md:103 both say 'the MAP keeps the current mark, it has no bullseye' — the comment now lies. MAP_KEEPS_THE_STRIP never looks at the map with the head off the mark.

*Fix.* One line at play.html:2137 — function lockOn(){ if(state.viewMode==='map') return null; … } — then add the map leg to MAP_KEEPS_THE_STRIP.

**4. CLASS 1c — an empty magazine blanks the APPROVE cue on a standing amber while the strip and the toast still say different things**

*Evidence.* play.html:946 nextStep() returns '' unconditionally on (state.mag.rounds|0)<=0, BEFORE stepFor() is consulted, so APPROVE goes dark on an amber that approving would still turn red (approving costs no round and approveDesig still works). play.html:2990 then overwrites the amber recital with PRESS RELOAD while the magazine well reads UNLOAD or NO MAG and reloadCalls() (:952) is false; on a cold table magReload refuses with MAGAZINE FULL. Reachable in every QUAL-40 phase (the counter reaches 0 four times a table) and in the middle of his own target-all-then-approve-all drill. Contradicts his 21:05 'if targeted, approve is next step'.

*Fix.* In nextStep (:946) suppress FIRE only, keeping APPROVE on an amber and TARGET on an unmarked plate, and drop the magazine clause from hudPhase's amber branch (:2990) so the sentence, the toast and the lit button give one answer.

**5. CLASS 1d — DD-13e shipped half: with nothing under the bullseye the recital still names the LAST shot's plate**

*Evidence.* play.html:2991's unmarked clause requires lockOn() to be non-null, so blank sky falls through to the LAST clause at :2992 and the strip reads 'LAST · 50 M LEFT · DOWN' even while an amber stands. The decision recorded at :945 and in CLAUDE_CODE_NOTES_r204.md:102 claims the recital 'names no other plate'. The gate leg at :4818 asserts only skyStep===''&&!/PRESS APPROVE$/, which 'LAST · … · DOWN' satisfies — green while the record claims more than shipped. This is his 18:40/18:50/20:09/20:44 complaint verbatim.

*Fix.* Add a neutral clause before :2992 (nothing under the bullseye → TARGET FIRST, never the last shot's plate) and tighten the :4818 leg to assert the recital names no plate word at all.

**6. CLASS 1e — in a LIVE room the whole r.204 fix is gated off, so the first time he hosts he sees shot45/47/48 again**

*Evidence.* play.html:945 opens with if(!marksPersist()||typeof lockOn!=='function') return state.desig||null;, and marksPersist() at :2568 is chNum()===0&&!(state.lobby&&state.lobby.phase==='LIVE') — so in a room markUnderBullseye ignores the bullseye entirely and always returns the current mark. His 20:20 sentence ('the color of button and silloette of target are accurate for others when we have multi-player') names exactly this case. BUTTONS_FOLLOW_THE_BULLSEYE (:4804-4822) runs bounce, stay and qual40 and never sets lobby.phase='LIVE'.

*Fix.* Drop the marksPersist() gate from the READ in markUnderBullseye (keep it for mark persistence) — return the slot under the bullseye when one exists, else state.desig only when the bullseye is on that same plate — and add a LIVE-room leg to the row.

**7. The boot QA's deferred row resets a range the player is already standing in — START undone, a standing red box deleted, the QUAL magazine re-capped to 30 (this is H1's real cause, and H1's recorded cause is wrong)**

*Evidence.* play.html:4949 is a setTimeout-deferred row. Its snapshot at :4950 saves lane, mode, zoom, view, desig, slots, hi, armed, silent, pan, tilt — but NOT the magazine, NOT downGo/downT, NOT RANGE_RUN — then sets state.rangeMode='bounce' and calls rangeReset(). Its restore at :4953 calls rangeReset() AGAIN before state.rangeMode=sv.mode on the same line, so the final reset runs under 'bounce' and reloads the magazine at that cap (30) on a QUAL-40 player. docs/assessments/2026-10-12_drone2525_qual40_ux_pass_12asm.md:331 attributes H1 to magLoad('INIT') and prescribes 're-derive magCap on every door' — the door already derives 10 correctly; the boot overwrites it afterwards, so the owed fix would ship and he would see 30 RDS again.

*Fix.* Restore state.rangeMode from sv BEFORE the teardown rangeReset() at :4953 and add mag/downGo/downT/RANGE_RUN to the sv snapshot — or set a state._boot flag enterTheRange clears that every deferred row's teardown checks.

**8. hudKeepOut() returns CSS pixels while every consumer works in canvas backing-store pixels, and nothing observes #stage — his shot42 defect returns when the two disagree**

*Evidence.* play.html:2023 measures every control as r.left-sr.left / r.top-sr.top against #stage's getBoundingClientRect (CSS px), while captionCeiling (:2024), captionFloor (:2025), plateCaptionRects (:2026) and boardLabels (:2057, which pushes those same rects into taken) all work in view.width × view.height. layout() (:1303) is the only thing that sizes the canvas and runs only on window resize/orientationchange (:1312) — grep ResizeObserver over the deck returns 0. Opening MORE toggles #app.more, and the CSS at line 75 (#app.range:not(.more) #modePick,#plat,#water,#motLvl,#tgtPick,#chLvl,#diffLvl,#halPick{display:none}) reveals those pickers, changing the bar height and so #stage's box with no resize event. A resize taken while MORE is open then flips the error to the unsafe direction and captions print on TARGET/APPROVE/FIRE. Invisible to every gate: both new rows run only in the default layout, and drone-deck-qa's viewport changes call layout(), which repairs the mismatch.

*Fix.* Anchor hudKeepOut to view.getBoundingClientRect() and scale each rect by view.width/vr.width and view.height/vr.height, and drive layout() from a ResizeObserver on #stage.

**9. HIS ASK THIS ROUND IS ABSENT — QUAL 40 has no Range Safety Officer opening at all, while the end-of-table commands are complete**

*Evidence.* grep over frontend/public/drone-2525/play.html for MAKE READY, LOAD AND MAKE READY, THE LINE IS READY, IS THE LINE READY, COMMENCE FIRING and WATCH YOUR LANE returns 0 hits. The close is fully built — 'CEASE FIRE · UNLOAD · SHOW CLEAR · RANGE IS COLD', 'CEASE FIRE · QUALIFICATION COMPLETE · PRESS RESTART', the light forced to R with the word CEASE FIRE and the timer to COLD (play.html:976), RELOAD locked to UNLOAD (:864). QUAL 40 instead opens with the light dark, data-s='O', the word empty (lightWord at :968 maps 'O' to '') and 'NEXT 3 S'. His 18:25 words asked for the beginning to mirror the end.

*Fix.* r.205 adds the RSO opening before engagement 1 — IS THE LINE READY · THE LINE IS READY · LOAD AND MAKE READY · WATCH YOUR LANE · COMMENCE FIRING — on the same light/word/timer primitives the close already uses, with a START_LIGHT_WORDS leg and the NO_RAW_IDS_ON_GLASS and LIGHT_WORDS_FIT_ONE_WIDTH regexes updated in play.html and scripts/drone-deck-qa.mjs in the same commit.

**10. HIS LIGHT CHECK THIS ROUND — the tower shows GREEN/FIRE through the first 7 of the 10 seconds of the phase rest, with no targets up and a RELOAD the deck refuses**

*Evidence.* The gate itself pins it: play.html:4589 asserts marks[0]==='rest G' and marks[1]==='rest end O', with marks[1] taken at R.t>PHASE_GAP_S-3 (:4584) — so with PHASE_GAP_S=10 (:841) the light reads G, and lightWord (:968) prints FIRE, for the first ~7 s of every inter-phase rest, going dark only in the last 3 s. On a real IWQ range the phase transition (magazine change and position change) is not a firing period. Compounding it, play.html:1010 toasts 'PHASE n · <POSITION> · PRESS RELOAD · MOVE' unconditionally while reloadCalls() (:952) is false on a full magazine and magReload (:864) answers the press with 'MAGAZINE FULL · 10 RDS' — the Table VI program empties a 10-round magazine inside a phase, never on its boundary, so all three rests of a clean table say PRESS RELOAD and refuse it.

*Fix.* Hold the light dark (O) for the whole phase rest and open it only on the 3-second R→Y→G countdown into the next engagement, and make the rest sentence read the magazine — 'PHASE n · <POSITION> · MOVE' when full — then update the rest marks in START_LIGHT_SEQUENCE to 'rest O'.

**11. The stated invariant in the notes and the carried patcher header is the OPPOSITE of what shipped — and it is the contract r.205's author reads**

*Evidence.* docs/drone-2525/operator-deck/CLAUDE_CODE_NOTES_r204.md:26 and docs/drone-2525/operator-deck/patches/r203_to_r204.py:12 both read '…with nothing under the bullseye, the current mark's step'. The same patcher's code comment at :110 says the opposite ('with nothing under the bullseye, nothing lit'), and the shipped bytes agree — play.html:949 returns '' when lockOn() is null. Restoring that clause reinstates exactly what he reported at 18:40, 18:50, 20:09 and 20:44, and r.205 edits stepFor/hudPhase for the caption removal and the button colour.

*Fix.* Replace the clause in both files with 'with nothing under the bullseye nothing lights and no other plate's step is recited (DD-13e); the MAP keeps the current mark' — the wording REVISIONS.md:1204 already uses.

**12. DD-13f — his 20:55 twenty-person three-sweep team drill — is on no queue the next revision reads, while the ask file asserts it reached two**

*Evidence.* docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:421 states the shared per-target phase table is 'listed in the register's Owed and in the release note, so he can call it forward if he wants it before r.206.' grep for DD-13f, 'twenty people', 'three sweeps' and 'shared phase' over docs/drone-2525/operator-deck/REVISIONS.md, docs/traceability/drone-2525.ledger.json, docs/drone-2525/drone-2525.v00.00.json and CLAUDE_CODE_NOTES_r204.md returns zero hits. DD-15 (his 21:05) is likewise only in the ask file. This is the AAR_2026-08-28 class verbatim — approval is not preservation, and a file asserts a persistence that did not happen; he will have to say the drill a second time.

*Fix.* Append one Owed line under the r.204 register section naming DD-13f (shared per-target phase table, sweep counts, the three sweeps) and DD-15, and append — never edit — a correction entry to drone-2525.ledger.json carrying both.

**13. The lane control reads LANE 21 on every lane the QR door opens**

*Evidence.* enterTheRange (play.html:5272-5290) sets state.lane and syncs rngMode and chLvl but never touches #lanePick; goRange (:5456-5462 and the picker syncs that follow) sets chLvl, modePick and plat but not lanePick. grep shows #lanePick written at only two places — seatLane (:5440) and fillLanes (:5482, once at parse time). The QR link feeds enterTheRange directly, so the picker names lane 21 while the seat, the corner label and the strip name the real lane; once a QUAL table is running seatLane refuses the change and rewrites the picker, so the only way he discovers the lie is to be refused by a control that was showing 21.

*Fix.* Add const lp=document.getElementById('lanePick'); if(lp) lp.value=String(state.lane); inside goRange beside the modePick/plat/chLvl syncs it already does.

**14. Lane signs are drawn off the left and right edge of the picture at his own 428×926 — his shot51 shows "9 20" and "22 2"**

*Evidence.* play.html:2058 tests visibility on the board CENTRE only (if(!pr||pr.x<0||pr.x>W||pr.y<0||pr.y>H) return;) and then draws the label ±hw wide, so a sign whose centre is a few px inside the edge is painted half outside it. The escape loop at :2061 moves a sign only vertically (cand.y0+dir*dy), and the comment states the rule explicitly — 'never sideways — r.159: the sign stays on its post's line'. boardLabels clips against controls, captions, targets and the bullseye but never against the picture's own x bounds. His lane signs stay (his 21:20 answer), so DD-14's caption removal will not remove this.

*Fix.* After the move/climb pass in boardLabels, clamp the label box into 2..W-2 (shifting x by the overflow, keeping the post line) and count an off-picture sign as a crossing so the board row can go red.

**15. The keep-out gate runs a different cache policy than the shipped glass — the QA rebuilds per look, production polls on a 200 ms clock**

*Evidence.* play.html:2023's cache key is view.width+'x'+view.height+'|'+(state.qaArmed?('qa'+(state.tickN|0)):((performance.now()/200)|0)). Under the boot QA every look bumps state.tickN, so the list is rebuilt fresh at each look; in play state.tickN is never in the key, so after a control is shown or hidden hudKeepOut keeps serving a stale list for up to 200 ms. CAPTIONS_CLEAR_OF_THE_CONTROLS — the row that answers his shot42 — therefore proves a property the live path only holds on a timer, which is the 'a proof that mocks the branch just written' failure his own AAR_2026-09-09 names.

*Fix.* Invalidate on change, not on a clock — set hudKeepOut._k=null from layout(), placeFace(), hudMag(), hudPhase() and the fullscreen/menu/stance-box toggles, then memoise on state.tickN so the gate and the glass run one policy.

### NOTES
- VERIFIED METHOD: every BLOCKING above was re-checked by me read-only against the shipped bytes, not accepted from the lens. sha256 2085cd150d08f886b4f8236ed8d8f3f60c2494b6608afed08c7260298039db9b is identical in /home/user/eXeL-AI-Polling, /tmp/claude-0/wtm and /tmp/claude-0/wtp, and matches docs/drone-2525/operator-deck/HASHES_r204.sha256. Nothing was dropped as ungrounded — all fourteen reported blockers reproduce in source. Where a lens quoted a millisecond figure (5,771 ms boot, 8.4% squash, fps deltas) I verified the MECHANISM in source and did not re-run the profile; those numbers are carried as the lens measured them.
- DEDUPLICATED: HIS WORDS B2 (empty magazine blanks the APPROVE cue, play.html:946) and SUCCINCTNESS B2 (amber recites PRESS RELOAD, play.html:2990) are two halves of ONE defect and are merged into CLASS 1c. Five of the blockers — 1a, 1b, 1c, 1d, 1e — are one CLASS: the mark under the bullseye is derived in seven places (play.html:945, :2426, :2489, :2493, :2577, :2991 which calls lockOn twice, :3878) and only the glass goes through r.204's new helper. Fix them as one class, not five instances, per the standing law.
- HIS TIMES CHECK OUT. I recomputed Table VI from source: IWQ_VI (play.html:832-837) is 18 engagements / 40 targets, 4 phases, by-range 6/7/8/8/6/5; EXPOSURE_BY_COUNT {1:5,2:8,3:12,4:16} (:840); ENG_GAP_S=3 (:841); PHASE_GAP_S=10 (:841, sourced to iwtsexplained.com/table-vi and the 2019 Infantry magazine). Exposure total 43+41+40+40 = 164 s, plus 14 inter-engagement gaps x 3 s = 42 s, plus 3 phase rests x 10 s = 30 s = 236 s nominal. The recorded play-through is 231 s / 40 shots / 3 reloads, consistent with windows ending early on a hit. Times PASS — the defect is the LIGHT during the rest (blocker 10), not the clock.
- HIS STOP LIGHTS, the rest of the check: the mapping at play.html:968 is G=FIRE, Y=READY, O=blank, R=WAIT, with the qualDone override at :976 forcing the word to CEASE FIRE and the timer to COLD. Red therefore carries two meanings (the 3-second WAIT before an exposure, and CEASE FIRE when the table is cold) but the word disambiguates them on the glass, so this is acceptable and not raised. The R to Y to G countdown exactly fills the 3 s ENG_GAP_S between engagements inside a phase, which is correct. Only the phase rest is wrong.
- The CAPTIONS_CLEAR_OF_THE_CONTROLS row is wired to a feature he has already ordered removed. DD-14 ('remove all text from middle; targets only') deletes every per-plate caption, so the row's rects.length===marks assertion goes to 0 !== marks and turns red at all four viewports, in prebuild's sibling gate and again in Verify Live. The same shape waits for r.205: START_LIGHT_SEQUENCE, START_LIGHT_WORDS, LIGHT_WORDS_FIT_ONE_WIDTH and NO_RAW_IDS_ON_GLASS are each pinned in TWO places — the row's own regex in play.html and the list in frontend/scripts/drone-deck-qa.mjs. Name the row, the manifest (frontend/tests/deck-qa-manifest.mjs) and the harness regex inside the r.205 and DD-14 members before any code.
- DRN-11.11 is superseded in word and alive in the record. docs/drone-2525/drone-2525.v00.00.json carries DRN-11.11 at status 'implemented' with metric 'only SYNC_DIRECT red on one device', while DRN-11.12's statement says it supersedes that and '84 rows', and frontend/tests/deck-qa-manifest.mjs now ships EXPECTED_RED_AT = {'667x375': ['EYE_SCALE_12_IN']} — a second declared red. I checked the whole domain JSON: every one of its requirement rows is status 'implemented', the only status value present, and superseded_by appears zero times. frontend/tests/drone-crs.test.mjs:14 already accepts 'superseded'; nothing sets it. Set DRN-11.11 to superseded with superseded_by DRN-11.12, re-render, and add one drone-crs assertion that any id named in another requirement's 'Supersedes …' must itself be superseded.
- DD-13e never reached the two generated carriers: grep -c DD-13e is 0 in docs/traceability/drone-2525.ledger.json and 0 in docs/drone-2525/drone-2525.v00.00.json, whose r.204 entry ends 'DD-13a-d decided under his sign-off' — and that string is what the operator-facing CRS prints. The decision that answers his four repeated complaints is the one the record omits. Append DD-13e (and the corrected range DD-13a-e) in the next release's ledger text.
- Thirty-eight r.204 invariant clauses collapse into ONE assertion: frontend/tests/drone-playable.test.mjs:96 is a single ok() whose condition ANDs 38 source regexes behind one message. r.205 edits exactly these functions, so the next failure will point at all 38 at once, and a clause whose regex quietly stops matching its intent is invisible. Split it into one ok() per clause — the shape the rest of the file already uses.
- The two play-throughs the ledger cites as r.204's evidence cannot fail: frontend/scripts/drone-qual40-play.mjs:8 computes sha and rev from the fetched bytes and prints them, but the only non-zero exit in the script is the Table VI magazine-cap check at line 16 — the sha is never compared to HASHES_r204.sha256 and the rev never to DECK_REV, so a 37/40 run or one with page errors still exits 0. Add one line: exit non-zero unless rev === '0.'+DECK_REV, sha matches the HASHES line, errors === 0 and rounds === 40.
- The size he actually holds is the one size CI never opens. frontend/scripts/drone-deck-qa.mjs:27 declares 390x844, 844x390, 375x667, 667x375; his phone is 428x926 (shot50/shot51) — the size both the off-picture lane signs and the keep-out unit mismatch were found at. Add { name:'portrait-428', width:428, height:926 } to VIEWPORTS.
- Efficiency items confirmed in source and worth taking while CLASS 1 is open: plateCaptionRects is computed twice every frame (the painter's result at play.html:1999 is discarded and rebuilt inside boardLabels at :2055 — pass it in); hudKeepOut resolves each element's computed style twice per rebuild (:2023, two getComputedStyle(e) calls — hoist to one const); platesHere() (:1136) re-filters all 462 plates with a fresh array ~18 times per frame and ~38,000 times per boot (memoise on state.lane); toolSelfTest() runs synchronously at :5077 before requestAnimationFrame(loop) at :5079, so nothing paints until 224 rows have run (start the loop first and yield inside the QA); packBudget (:3711) serialises the whole 898 KB document just to fill one budget row (read performance.getEntriesByType('navigation')[0].decodedBodySize instead). Byte budget is healthy — 897,902 B against FILE_BUDGET 7,770,000 in drone-playable.test.mjs:13, 11.6% used.
- Also confirmed and worth one line each in the next cut: layout() (:1304) self-schedules via requestAnimationFrame without a return when view.clientHeight<80, so each resize taken while the stage is short adds a permanent relayout chain (guard with a single pending retry and return); approveWorksHere and fireWorksHere (:941, :942) both open with d=d||state.desig for 'every existing caller', but grep shows all four call sites pass an explicit mark — the dead default silently re-admits the r.203 behaviour for the next caller that forgets its argument; fireN still carries a nine-line if(false){…} block at :2587 (the superseded CH5 popup, with an onclick that recurses into fireN); releaseAuthority books ONE row for a wholesale discard so every other mark it drops is missing from the record; and hudKeepOut's header comment lists a different set of ids than the code actually adds (it omits kebab, phScore, phDes and toast) beside a duplicated cache sentence.
- The two commits of r.204 are signed by different names: ship e5aec75b7 and records aaa452a9f end with DIFFERENT co-author trailers (the attribution changed between the two halves of the revision; the names are redacted here under his no-model-names-in-repo-files law). No model name appears in any file under docs/drone-2525, so his no-model-names-in-repo-files law holds for the files, but one revision's two halves carry different authorship on the permanent record. Use the one mandated trailer on every commit of a revision.
- What r.204 genuinely got right, verified not assumed: the lit button is advisory only — nextStep (:971) toggles a .lit class, so APPROVE always enters approveDesig and FIRE always enters fireN, and fireN still refuses anything whose phase is not 'red' (:2584); no red box can be forged because markUnderBullseye hands out a copy of the slot; the 82 added lines contain zero new fetch/XHR/WebSocket/localStorage/postMessage/cookie sinks; fireN's on-target rule was genuinely lifted into fireOnIt (:943) and is read by the glass; ONE hudKeepOut list feeds captionCeiling, captionFloor, plateCaptionRects and boardLabels; the HUD row is his rasters under byte-pinned gates (tests/magazine-rasters.test.mjs, tests/pose-rasters.test.mjs, both in test:ci); and the counter colour rule is his at every boundary with the frame always gold.

### The seven lenses, in their own words

#### SPIRAL FORWARD (1 → 10) — the range deck outward: decide()/record/replay hash, the two-phone room, the QA rows and their regexes, prebuild (Cloudflare's door), Verify Live, the R-CORE ledger and CRS carriers, and the React route /main/Drone-2525

{"score": 68, "findings": [{"severity": "BLOCKING", "title": "QUAL 40 after a miss: FIRE stays lit and the recital says PRESS FIRE, but the press is refused \"ONE ROUND PER TARGET\" \u2014 no round, and nothing at all reaches the record", "evidence": "r.204 lifted ONE of the action's refusals into the lit-button rule (fireN's off-picture test \u2192 fireOnIt) and left applyHit's behind. play.html:944 stepFor() red branch tests fireWorksHere && mag>0 && fireOnIt \u2014 never ref._eng; play.html:2543 applyHit refuses with `state.rangeMode==='qual40'&&ref._eng` \u2192 toast 'ONE ROUND PER TARGET', result REFUSED, and it returns BEFORE any decide(). Played on the LIVE bytes (scratchpad/spiralfwd/probeE-qualmiss.mjs, probeF.mjs) at 428\u00d7926 (his phone), 390\u00d7844, 375\u00d7667 and 844\u00d7390 \u2014 identical at all four. QUAL 40, C-300 marked, approved, fired at 7 px offset \u2192 band MISS, plate up, lifePct 100, _eng true, mark still red. Bullseye back on it: nextStep()==='FIRE', #fFire opacity 1, #phDes = \"RED \u00b7 T1 \u00b7 300 M \u00b7 PRESS FIRE\". Click #fFire \u2192 toast \"ONE ROUND PER TARGET\", rounds 9\u21929, qualR 1\u21921, decision rows +0, events +0, replayHash() UNMOVED, and the button is still lit afterwards \u2014 he can press it for the rest of the exposure. A miss is the most common QUAL 40 event after the first shot, so this is on the one surface he qualifies on, and it is his 20:09 complaint verbatim (\"lit button is still wrong\"). Downstream: because applyHit returns before decide(), the pull is absent from state.decisions, state.events, replayHash(), metricsOf() and the peer \u2014 breaking the deck's own ONE_ROW_PER_PULL contract (\"2 pulls \u2192 2 rows\") and the r.132/r.133 rule that every refusal is one canonical row on every peer, so Cube 11 replay and the two-phone room cannot reproduce what he did. Neither new QA row ever fires at an engaged plate, so nothing can go red.", "fix": "In play.html:944 stepFor()'s red branch also return '' when `state.rangeMode==='qual40' && d.ref && d.ref._eng` (recital: \"<PLATE> \u00b7 SPENT \u00b7 WAIT FOR THE NEXT EXPOSURE\"), and at play.html:2543 write `decide('REJECT',ref.id,{reason:'ONE_ROUND_PER_TARGET'})` before the REFUSED return; add a BUTTONS_FOLLOW_THE_BULLSEYE leg that misses a QUAL plate and asserts FIRE dark + exactly one row."}, {"severity": "BLOCKING", "title": "A neighbour lane's plate under the bullseye: TARGET is lit but refuses \"WRONG LANE\", and the recital falls back to the stale \"LAST \u00b7 \u2026 \u00b7 DOWN\" \u2014 the eighth round's finding, surviving off his own lane", "evidence": "The two halves of invariant (a) disagree on the same pixel because only one of them has a lane test. play.html:2991 (the new r.204 recital clause) requires `lk.ref.lane===(state.lane||0)`; play.html:946 nextStep() and markUnderBullseye() have no lane test at all; play.html:2108 designate() refuses an off-lane plate SILENTLY (toast only, no row). Played on the LIVE bytes (scratchpad/spiralfwd/probeC.mjs at 428\u00d7926, probeF.mjs at 390\u00d7844 / 375\u00d7667 / 844\u00d7390 \u2014 identical): lane 21 (index 20), bullseye on C-100L-L22 (lane 22's 100 m left, standing, unmarked, in the picture) \u2192 nextStep()==='TARGET', #fTgt opacity 1 (APPROVE/FIRE at 0.5), #phDes = \"LAST \u00b7 100 M LEFT \u00b7 DOWN\" \u2014 a different plate, already down, on his own lane. Click #fTgt \u2192 toast \"WRONG LANE \u00b7 SIT IN LANE 22 TO ENGAGE\", state.desig stays null, decision rows +0, events +0, replayHash unmoved, TARGET still lit, recital unchanged. Screenshot: scratchpad/spiralfwd/428-neighbour-lane-TARGET-lit.png. This is exactly what the eighth round caught on his shot45 (\"the buttons followed the bullseye, the recital did not\"), now surviving for every plate that is not on his lane \u2014 one stick-push away, with 42 lanes in view, and it is the state his 20:55 twenty-person drill lives in. BUTTONS_FOLLOW_THE_BULLSEYE only ever looks at plateOf(s

#### SPIRAL BACKWARD (10 → 1) — from the ledger, register, HASHES, patcher and notes back to the glass

{"score": 7.4, "findings": [{"severity": "BLOCKING", "title": "The stated invariant is the OPPOSITE of what shipped: the notes and the patcher header still say \"with nothing under the bullseye, the current mark's step\" \u2014 the bug he reported four times", "evidence": "/tmp/claude-0/wtm/docs/drone-2525/operator-deck/CLAUDE_CODE_NOTES_r204.md:26 \u2014 \"...APPROVE on an unmarked plate holds NOT_MARKED and touches no other; with nothing under the bullseye, the current mark's step (an amber's APPROVE; nothing for a red)...\" \u2014 and the same clause in the carried patcher header /tmp/claude-0/wtm/docs/drone-2525/operator-deck/patches/r203_to_r204.py:12. The SAME patcher's code comment at :110 says the opposite (\"with nothing under the bullseye, nothing lit\"), and the shipped bytes agree: on the LIVE deck (http://127.0.0.1:4727/drone-2525/play.html, sha256 2085cd15\u2026, read at 428\u00d7926) the BUTTONS_FOLLOW_THE_BULLSEYE note ends \"...nothing under the bullseye lights nothing true\", and markUnderBullseye returns null off a plate. I proved code and gate are right by mutation: replacing `if(!lk) return (state.viewMode==='map')?(state.desig||null):null;` with `if(!lk) return (state.desig||null);` turns the row RED (\"nothing under the bullseye lights nothing false\"). So only the prose is wrong \u2014 and the patcher header is the contract the r.205 author reads while touching stepFor/hudPhase for the caption removal and the button colour. Restoring that clause reinstates exactly what he reported at 18:40, 18:50, 20:09 and 20:44.", "fix": "Replace that clause in CLAUDE_CODE_NOTES_r204.md:26 and in the r.204\u2192r.205 patcher header with \"with nothing under the bullseye nothing lights and no other plate's step is recited (DD-13e); the MAP keeps the current mark\" \u2014 the wording the register already uses at REVISIONS.md:1204."}, {"severity": "BLOCKING", "title": "DD-13f \u2014 his 20:55 twenty-person three-sweep team drill \u2014 is on no queue the next revision reads, and the ask file claims it is", "evidence": "/tmp/claude-0/wtp/docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:421 asserts the shared per-target phase table is \"listed in the register's Owed and in the release note, so he can call it forward if he wants it before r.206.\" It is in neither. `grep -rn \"DD-13f\\|sweep\\|shared table\\|shared phase\\|twenty people\"` over /tmp/claude-0/wtm/docs/drone-2525/operator-deck/REVISIONS.md, /tmp/claude-0/wtm/docs/traceability/drone-2525.ledger.json, /tmp/claude-0/wtm/docs/drone-2525/drone-2525.v00.00.json and CLAUDE_CODE_NOTES_r204.md returns nothing (the only \"sweep\" hits are unrelated). The r.204 \"Owed next\" bullet in REVISIONS.md lists \"the LIVE room's lit button\" \u2014 the single-seat half \u2014 but never the shared per-target phase table, the sweep counts, or the three sweeps as the drill. DD-15 (his 21:05 \"buttoms and colors around boxing amber vs red should match\") is likewise only in the ask file. This is the AAR_2026-08-28 class verbatim: approval is not preservation, and the file asserts a persistence that did not happen. He will have to say the twenty-person drill a second time.", "fix": "Append one Owed line under the r.204 register section naming DD-13f (shared per-target phase table, sweep counts, the three sweeps) and DD-15, and append \u2014 never edit \u2014 a correction entry to drone-2525.ledger.json carrying both."}, {"severity": "NOTE", "title": "DD-13e never reached the ledger or the domain JSON; the generated CRS tells him \"DD-13a\u2013d\"", "evidence": "DD-13e appears in /tmp/claude-0/wtm/docs/drone-2525/operator-deck/REVISIONS.md:1204, CLAUDE_CODE_NOTES_r204.md, the deck bytes and frontend/tests/drone-playable.test.mjs:96 \u2014 but `grep -c DD-13e` is 0 in /tmp/claude-0/wtm/docs/traceability/drone-2525.ledger.json and 0 in /tmp/claude-0/wtm/docs/drone-2525/drone-2525.v00.00.json. The domain JSON's r.204 entry (drone-2525.v00.00.json:455) ends \"DD

#### SSSES · SECURITY — bypass of TARGET → APPROVE → FIRE, forged authority, pre-round fire, two-phone leak, untrusted input, new network/storage (r.204 live bytes, sha256 2085cd15…)

{"score": 72, "verdict": "No shot can bypass the chain and nothing new was opened. Played on the LIVE bytes at 428\u00d7926: the lit button is advisory only \u2014 nextStep() just toggles a `.lit` class on three separate buttons (play.html:971), so APPROVE always enters approveDesig and FIRE always enters fireN, and fireN still refuses anything whose phase is not 'red' (play.html:2584). No red box can be forged: markUnderBullseye hands out a COPY of the slot (play.html:945), and every consumer (stepFor, hudPhase, nextStep) is read-only. No pre-round fire window: sampled 14\u00d7 through boot, qaArmed stayed false and roundOpen() stayed false behind the intro the whole time. No two-phone exposure from r.204: marksPersist() is false in a LIVE room, so markUnderBullseye degrades to state.desig and the room rules in approveWorksHere/fireWorksHere mirror exactly what approveDesig and fireN enforce (TWO_HUMANS, NOT_THE_MARKERS_SEAT). Diffing r.203 against r.204 the 82 added lines contain ZERO new fetch / XHR / WebSocket / localStorage / sessionStorage / indexedDB / postMessage / location / cookie sinks, and every DOM read the new QA and painter code performs is of the deck's own elements \u2014 no untrusted input anywhere.\n\nWhat costs the score is one integrity break on the authority chain itself, in the exact code r.204 touched. r.204 added the NOT_MARKED refusal to make APPROVE \"act on the plate under the bullseye and never on another\" \u2014 but placed it one line BELOW the inherited TARGET_DOWN guard, so on the commonest QUAL-40 sequence in the game it never runs: a granted red box on a standing plate is silently destroyed by a press aimed somewhere else, two decision rows are booked against a plate the operator is not looking at, and the record is left asserting an approval the deck has already dropped. FIRE carries the identical defect. The gate that names this invariant is green over it. Fix the ordering and the release bookkeeping and this lens is clean.", "findings": [{"severity": "BLOCKING", "title": "APPROVE and FIRE aimed at an UNMARKED plate act on a stale fallen mark \u2014 they destroy every standing RED box on the lane and book two rows against a plate the operator is not on (r.204's NOT_MARKED guard is one line too late)", "evidence": "/tmp/claude-0/wtm/frontend/public/drone-2525/play.html:2492 places the inherited TARGET_DOWN guard (`decide('HOLD',state.desig.id,{reason:'TARGET_DOWN'}); releaseAuthority('TARGET DOWN')`) ABOVE r.204's new NOT_MARKED guard at :2493, so the r.204 refusal is unreachable whenever the stale state.desig has fallen. fireN carries the same defect at :2580 (`REJECT TARGET_GONE` + `releaseAuthority('TARGET GONE')`). releaseAuthority at :5405 wipes wholesale: `state.desig=null; state.hiApproved=false; state.tgtSlot={}`. Played on the LIVE bytes (sha256 2085cd15\u2026, http://127.0.0.1:4727, 428\u00d7926, 0 page errors) \u2014 probe /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/sec204/p3.mjs. LEG 1, organic QUAL 40, nothing forced: tower raises C-100L, operator marks it amber, tower raises C-200L, C-100L's window runs out under his aim (leg1_Adown {up:false}), he swings to C-200L \u2014 `leg1_under:'C-200L-L21', leg1_underMarked:false`, the deck itself cues `phDes:'200 M LEFT \u00b7 PRESS TARGET'`. He presses APPROVE (he was mid-sequence): decisions `[HOLD C-100L-L21 TARGET_DOWN, HOLD C-100L-L21 AUTHORITY_RELEASED]`, `leg1_slotsBefore:[{1,C-100L,amber}] \u2192 leg1_slotsAfter:[]`, toast 'THAT TARGET IS ALREADY DOWN \u00b7 MARK THE NEXT' \u2014 naming a plate he is not looking at, which is verbatim the class of his 18:40 words 'target that has not been target says approve from another target'. LEG 2, TRAIN UP, via FIRE: `leg2_slotsBefore:[{1,C-100L,amber},{2,C-150R,red}] \u2192 leg2_slotsAfter:[]` \u2014 a standing, APPROVED, RED C-150R is destroyed by a FIRE press aimed at C-200L. Probe p5.mjs proves the record then lies: the full decision log is `

#### SPIRAL FORWARD (1 → 10) — every downstream consumer the r.204 edits touch: decide()/the record/the replay hash/the two-phone room, the QA rows and their pinned regexes, prebuild (Cloudflare's door), Verify Live, the R-CORE ledger + CRS, and the React route /main/Drone-2525. Played on the LIVE bytes (sha256 2085cd15…, http://127.0.0.1:4727) against r.203 on :4726.

{"score": 74, "findings": [{"severity": "BLOCKING", "title": "hudKeepOut() hands back CSS pixels; the captions and boards it protects are drawn in canvas pixels \u2014 when the stage box and the canvas disagree, shot42 comes back (captions printed on TARGET/APPROVE/FIRE)", "evidence": "play.html:1303 layout() is the only thing that sizes the canvas (c.width=r.width from #stage's rect) and it runs only on window 'resize'/'orientationchange' (play.html:1312) \u2014 there is no ResizeObserver anywhere in the deck (grep ResizeObserver = 0). hudKeepOut() measures every control as r.left-sr.left / r.top-sr.top against #stage's CSS rect, while plateCaptionRects()/boardLabels()/captionCeiling()/captionFloor() all work in view.width \u00d7 view.height (backing-store) pixels. Opening MORE (#morePop, play.html:5403) shrinks #stage without firing a resize. Measured live at 428\u00d7926, TRAIN UP, six marks (scratchpad/fwd204/p7-units.mjs): MORE open \u2192 backing 428\u00d7852 vs canvas CSS 428\u00d7780 (scale y 1.092) \u2014 the whole picture is squashed 8.4 %, so every silhouette is drawn short of life size while the menu is open, and the keep-out is 61 px too high (safe direction, no overlap). Then MORE open \u2192 any resize (a phone's URL bar, a rotation) \u2192 layout() adopts 780 \u2192 MORE closed \u2192 backing 428\u00d7780 vs CSS 428\u00d7852, scale 0.915, and the error flips to the unsafe direction: hudKeepOut() reports #face at y 740\u2013780 when it truly occupies canvas y 677\u2013714, captionFloor() returns 702, and with the head tilted up six captions print on the controls \u2014 'T1 \u00b7 50 M LEFT \u00b7 AMBER' at y 671\u2013684 ON face, 'T2 \u00b7 50 M RIGHT \u00b7 AMBER' at 657\u2013670 ON joyR, repeating at tilt 8/12/16/20 (scratchpad/fwd204/EVIDENCE-stale-keepout.json, produced by p8-stale.mjs). Invisible to every gate: both new rows run only in the default layout and never open MORE, and drone-deck-qa's four viewports change the window (which calls layout()), so the two spaces always agree there \u2014 358 passed / 0 failed on these bytes.", "fix": "In hudKeepOut() (and the two QA rows' own dom() lists) anchor to view.getBoundingClientRect() and scale every rect by sx=view.width/vr.width, sy=view.height/vr.height; and call layout() from a ResizeObserver on #stage so the backing store can never disagree with its box (that also ends the 8.4 % squash while MORE is open)."}, {"severity": "NOTE", "title": "The new CAPTIONS row is wired to a feature he has already ordered removed \u2014 DD-14 will turn it red at four viewports and block the ship unless the row and its pinned regex move in the same commit", "evidence": "The in-deck row asserts clearQ && every && marks>0 where x.all = (rects.length===marks) across 60 looks + 12 in QUAL 40, and scripts/drone-deck-qa.mjs pins the note verbatim: /every one of the [1-9]\\d* marks captioned at every look true/. His 20:44 'remove all text from middle; targets only' (DD-14, already owed) deletes every per-plate caption, so rects.length becomes 0 \u2260 marks and the row goes red at 390\u00d7844, 844\u00d7390, 375\u00d7667 and 667\u00d7375 \u2014 in prebuild's sibling gate and again in Verify Live against the live site. The same shape waits for r.205: the range officer's opening adds light states and words before the first engagement, and START_LIGHT_SEQUENCE, START_LIGHT_WORDS, LIGHT_WORDS_FIT_ONE_WIDTH and NO_RAW_IDS_ON_GLASS are each pinned in TWO places \u2014 the row's own regex in play.html and the measured-not-asserted list in scripts/drone-deck-qa.mjs.", "fix": "Name the row + manifest + harness-regex edits inside the r.205 and DD-14 members before any code \u2014 keep CAPTIONS_CLEAR_OF_THE_CONTROLS as a boards-and-lane-signs-only assertion once the captions go."}, {"severity": "NOTE", "title": "The record now books a mis-tap as a governance hold: APPROVE on an unmarked plate writes HOLD/NOT_MARKED, so hiHolds counts UI refusals beside TWO_HUMANS and APPROVER_LOST", "evide

#### SSSES · STABILITY — r.204 LIVE bytes (sha256 2085cd15…, http://127.0.0.1:4727), played not read: a full real-time QUAL 40 table (40/40 EXPERT, 3 reloads, 3 rotations injected mid-exposure / at a rest / at eng 12), a full TRAIN DOWN table to ALL DOWN, TRAIN UP target-all → approve-all → fire-all across a rotation, nine viewport sizes, zoom 1×–30× × both orientations, fullscreen, tiny/split-screen viewports, cold range, RESTART from every state, lane and mode changes mid-table, and an r.203 (port 4726) baseline for every regression claim. Probes and screenshots in scratchpad/stablens204/.

{"score": 78, "verdict": "The deck is stable where it is played. A full 40-round Table VI at 390\u00d7844 ran clean: 40/40 EXPERT in 230 s, 0 page errors, 0 render exceptions, 0 half-fallen plates at any of ~600 looks, every shot's lit button equal to nextStep(), three rotations (mid-exposure, at a phase rest, at engagement 12) absorbed with no stall and no drift (s4-r204-timeline.json, anomalies: 0). Layout holds with zero off-glass controls at 428\u00d7926, 390\u00d7844, 375\u00d7667, 360\u00d7640, 360\u00d7780, 320\u00d7568, 844\u00d7390, 667\u00d7375 (926\u00d7428 is 1 px rounding only). r.204's new keep-out work is sound: across 7 zoom steps \u00d7 3 orientations with three marks up, not one caption or lane board landed on a control and nothing produced NaN or an exception (s12). RESTART from cold, mid-window, mid-rest and spammed twice always returned a true zero state (qualR 0, qualH 0, mag 10/10 n1, no desig, no slot, no standing or half-fallen plate). TRAIN DOWN ran to ALL DOWN at 0:15.2 and RESTART re-armed it correctly. QUAL 40 correctly refuses a lane change and a mode change mid-table. No behavioural regression against r.203 was found in anything I measured; the only r.204 cost is ~11% boot and ~8% frames under 6\u00d7 throttle. What it does NOT survive is the first 1.5 seconds of its own life: the boot QA's deferred rows call rangeReset() on a range the player is already standing in, which silently undoes a TRAIN DOWN START, deletes a standing red box in TRAIN UP, and re-caps the QUAL 40 magazine to 30 \u2014 the true cause of H1, which H1 itself diagnoses wrongly, so the fix now owed would ship and he would see 30 RDS again. Two more lies sit on the glass he is holding: the lane control reads LANE 21 on every lane the QR door opens, and lane signs are drawn off the edge of the picture at his own 428\u00d7926 \u2014 both visible in his own shot51.", "findings": [{"severity": "BLOCKING", "title": "The boot QA resets a range the player has already entered \u2014 START undone, the red box deleted, the QUAL magazine re-capped to 30 (this is H1's real cause, and H1's stated cause is wrong)", "evidence": "frontend/public/drone-2525/play.html:4595 (and :4612, :4641, :4677) \u2014 deferred boot rows end with `state.rangeMode='bounce'; qualResetTower(); rangeReset();`, and rangeReset (:897) wipes every plate, RANGE_RUN, rangeHit/Miss/Lapsed, downGo/downT and reloads the magazine from magCap() (:848). Instrumented magLoad trace on the LIVE bytes (scratchpad/stablens204/s13-magtrace.mjs): enter at t=811 ms \u2192 `>rangeReset mode=qual40 \u2192 RESET cap:10 rounds:10` (correct); then t=1447 ms and t=1449 ms \u2192 `>rangeReset mode=bounce \u2192 RESET cap:30 rounds:30`; final state `mode:qual40, cap:30, rounds:30`. s14-boottrample.mjs, entering at +700 ms: TRAIN DOWN with START pressed \u2192 `downGo:'run'` just after, `downGo:false` and the strip back to 'TRAIN DOWN \u00b7 PRESS START' 3 s later; TRAIN UP with a plate targeted and approved \u2192 `desig:'C-50L-L06:red'` just after, `desig:null` 3 s later (a standing red box vanishes on its own); QUAL 40 \u2192 mag `10/10` just after, `30/30` 3 s later. s0-bootrace.mjs sweep: entry at 300/800/1200 ms \u2192 cap 30; at 1600/2000/2600/3500 ms \u2192 cap 10. The QR door (:5322, `if(q&&q.get('range')) enterTheRange(...)`) runs at parse time, so it hits this on EVERY load \u2014 which is why H1 was seen there; the intro's THE RANGE button hits it on any load the player taps through in under ~1.5 s (slower on his phone). docs/assessments/2026-10-12_drone2525_qual40_ux_pass_12asm.md:331 attributes H1 to `magLoad('INIT')` at page load not being re-run and prescribes 're-derive magCap on every door' \u2014 the trace shows the door already derives 10 correctly and the boot overwrites it afterwards, so that fix ships and he sees 30 RDS again.", "fix": "Gate the boot QA's state mutation on the player not being on the range yet \u2014 snapshot and restore state.rangeMode/mag/plates/RANG

#### SSSES · SCALABILITY + EFFICIENCY (r.204 LIVE, played not read)

{"score": 66, "verdict": "Scalability 72 / Efficiency 64 (lens 66). The byte budget is the healthy half: 897,902 B served, 410 KB gzipped, 11.6% of the 7.77 MB ceiling, +3.6% this cut; the deck prebuild gates total 1.6 s and the deck is 0.23% of the 390 MB Cloudflare uploads \u2014 r.204 costs the deploy nothing. The unhealthy half is time, not bytes. Everything r.204 added lands in the two places that grow every revision: the one synchronous pre-paint task and the per-frame caption pass. At 6\u00d7 CPU (phone class) the boot freeze is now 5,771 ms in ONE uninterruptible task and the first frame is at 6,244 ms \u2014 measured monotonic across r.198 3,966 / r.199 4,920 / r.201 4,681 / r.202 4,828 / r.203 5,043 / r.204 5,771, with r.204 the largest single jump of the seven (+728 ms, 40% of all the growth since r.198). In steady play draw() went 1.09 \u2192 1.61 ms (+48%) and main-thread script time 0.725 \u2192 1.060 s per 10 s (+46%), pushing p99 from 15.0 to 19.3 ms \u2014 past the 16.7 ms frame. The cache did its job on reflows (LayoutCount 249.7 \u2192 250.6/s, flat) and nothing leaks (heap 7\u20139 MB, 910 DOM nodes, 60 fps, 0 draw errors over 90 s in QUAL 40), so the cost is pure JS and all of it is recoverable: plateCaptionRects runs twice in every single frame (1,800/1,800), platesHere() scans 462 plates 18.3\u00d7 per frame and 38,248\u00d7 per boot, and hudKeepOut resolves each element's style twice. The one correctness-shaped efficiency finding: the keep-out cache is a 200 ms POLL in play but a per-look rebuild under the QA (3,188 calls, 0 time-keys), so CAPTIONS_CLEAR_OF_THE_CONTROLS gates a policy the shipped glass does not run. Nothing here is a glitch he can see today on 428\u00d7926 \u2014 it is the slope, and r.205 and r.206 are queued on the same slope.", "findings": [{"severity": "BLOCKING", "title": "Boot blocks his phone for 5.8 s in one uninterruptible task before the first frame \u2014 r.204 is the biggest jump in seven revisions", "evidence": "CDP longtask profile at 6\u00d7 CPU throttle, 428\u00d7926 (scratchpad/scaleff204/boot3.mjs): the whole boot is a SINGLE long task \u2014 r.198 3,966 ms \u00b7 r.199 4,920 \u00b7 r.201 4,681 \u00b7 r.202 4,828 \u00b7 r.203 5,043 \u00b7 r.204 **5,771 ms**; first requestAnimationFrame 4,441 ms (r.198) \u2192 6,244 ms (r.204). Unthrottled: 905 \u2192 1,129 ms. The warm QA itself is 1,018 ms on r.204 vs 622 ms on r.203 (+64%) for TWO new rows out of 224 (scaleff204/qacost.mjs). Cause: frontend/public/drone-2525/play.html:5077 `try{toolSelfTest();}` runs synchronously, before `requestAnimationFrame(loop)` at :5079 \u2014 nothing is painted until all 224 rows, three modes, 72 caption looks and 84 boardLabels calls have run. +410 KB gzipped over the wire on top of that.", "fix": "Paint first, prove second: start `loop` before `toolSelfTest()`, and yield inside the QA (`await new Promise(r=>requestAnimationFrame(r))` every ~20 rows) so the deck is on screen in <1 s and the rows finish behind it."}, {"severity": "BLOCKING", "title": "The keep-out gate runs a different cache policy than the shipped glass \u2014 the QA rebuilds per look, production polls every 200 ms", "evidence": "play.html:2023, cache key = `view.width+'x'+view.height+'|'+(state.qaArmed?('qa'+(state.tickN|0)):((performance.now()/200)|0))`. Under the boot QA: 3,188 calls, 76 rebuilds, **3,188 qa-keys and 0 time-keys** \u2014 a fresh list at every look (scaleff204/qakey.mjs), because each look bumps `state.tickN` (play.html:4327, :4831). In play `state.tickN` is never in the key: after `#face` is re-shown, `hudKeepOut()` still omits it for 3 frames / 50 ms, worst case 12 frames / 200 ms (scaleff204/stale.mjs `framesUntilListKnows:3`), and hiding `#face` leaves the key and the 17-rect list unchanged inside the bucket (scaleff204/rebuild.mjs `afterHideSameBucket.same:true`). So CAPTIONS_CLEAR_OF_THE_CONTROLS \u2014 the row that answers his shot42 \u2014 proves a property the live path only holds on a timer. His 

#### SSSES · SUCCINCTNESS — is each fix the smallest change that fixes the CLASS? (duplicated logic, dead code, comments that now lie, stale words on the glass or in the notes, a QA row that cannot go red). Played the LIVE bytes (sha256 2085cd15…, 228/228 boot rows, only SYNC_DIRECT red = OFFLINE, environmental, red on r.203 too) at 428×926 / 390×844 / 844×390 / 375×667 / 667×375, side by side with r.203 on :4726, plus four source mutations served through page.route to test row red-ability. Probes in /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/succ204/.

{"score": 68, "findings": [{"severity": "BLOCKING", "title": "On the MAP, APPROVE stops working and books a NOT_MARKED hold against a plate he cannot see \u2014 the one line that says the map has no bullseye is only honoured in one branch", "evidence": "Probe succ204/p12-mapapprove.mjs, both revisions, TRAIN UP lane 21, two ambers (100 M LEFT, 150 M RIGHT), head left on an UNMARKED plate, MAP pressed through its own button (#btnView, a visible 32\u00d732 control at x=255,y=2 on his 428\u00d7926 screen):\\n  r.203 \u2014 strip \"AMBER \u00b7 T2 \u00b7 150 M RIGHT \u00b7 PRESS APPROVE\"; APPROVE \u2192 APPROVE/C-150R-L21, slot 2 red, toast \"RED BOX \u00b7 150 M RIGHT \u00b7 APPROVED BY YOU \u00b7 NOW PRESS FIRE\", 0 holds.\\n  r.204 \u2014 strip \"TARGET FIRST\" (both ambers gone from the glass); APPROVE \u2192 HOLD/NOT_MARKED booked against NONE, toast \"NOT MARKED \u00b7 100 M CENTRE \u00b7 PRESS TARGET FIRST\" naming a plate the map does not show, hiHolds 1 (and sssesCore().holds, which docks Succinctness past eight).\\nStrip on the map, succ204/p3-mapcmp.mjs: r.203 reads \"RED \u00b7 T1 \u00b7 100 M LEFT \u00b7 PRESS FIRE\" in all three head positions; r.204 reads \"AIM ON IT\" (an instruction with no reticle to obey it \u2014 fireN's own refusal there is \"LEAVE THE MAP\") or \"TARGET FIRST\".\\nCause: play.html:945 markUnderBullseye() tests the map only inside the `if(!lk)` branch \u2014 `if(!lk) return (state.viewMode==='map')?(state.desig||null):null;` \u2014 and lockOn() still answers from the unit camera on the map, so the invisible bullseye wins. Its own comment, and CLAUDE_CODE_NOTES_r204.md:103, both state \"the MAP keeps the current mark, it has no bullseye\": the comment now lies. approveDesig (play.html:2489) re-derives the same thing and so refuses.\\nThe gate cannot see it: MAP_KEEPS_THE_STRIP is green on these bytes AND green with the defect fixed (succ204/p6-mut.mjs, mutation M4) \u2014 it never looks at the map with the head off the mark.", "fix": "One line, the class: `function lockOn(){ if(state.viewMode==='map') return null; \u2026` (play.html:2137) \u2014 the map has no bullseye, so every reader and every action falls back to the current mark; verified with succ204/p13-mapfix.mjs: APPROVE works again on the map, 228/228 rows still green, FIRE from the map still refused with \"LEAVE THE MAP\", no round spent. Then add the map leg to MAP_KEEPS_THE_STRIP (head on an unmarked plate, APPROVE presses: no NOT_MARKED row) so it can go red, and let hudPhase's red branch say LEAVE THE MAP instead of AIM ON IT on the map."}, {"severity": "BLOCKING", "title": "The recital tells him to press a locked button: an amber standing on the cold range reads PRESS RELOAD while RELOAD reads UNLOAD", "evidence": "Probe succ204/p9-cold.mjs, QUAL 40, fourth magazine spent, qualDone (light R, startWord CEASE FIRE, startTime COLD), one amber standing under the bullseye:\\n  r.203 \u2014 strip \"AMBER \u00b7 T1 \u00b7 100 M LEFT \u00b7 PRESS APPROVE\".\\n  r.204 \u2014 strip \"AMBER \u00b7 T1 \u00b7 100 M LEFT \u00b7 PRESS RELOAD\", while the magazine well reads UNLOAD and carries .locked, reloadCalls() false.\\nSame clause mid-table (succ204/p8-nomag.mjs, magazine 4 empty, qualDone false): strip \"PRESS RELOAD\", RELOAD reads NO MAG and is locked. Even on a normal dry magazine the amber's step is APPROVE \u2014 approving costs no round, and APPROVE still works there \u2014 so the recital names a step the target is not on, against his 18:40 words.\\nSource: play.html:2990, the amber branch of hudPhase gained `(state.mag&&(state.mag.rounds|0)<=0)?'PRESS RELOAD':'PRESS APPROVE'`. The magazine clause belongs to the RED branch (where a round is spent) and to the lit button (nextStep already dims at play.html:946).\\nUngated by the deck's own admission \u2014 CLAUDE_CODE_NOTES_r204.md:148: \"Not yet a gate: \u2026 an empty-magazine look (the strip now says PRESS RELOAD)\".", "fix": "Drop the magazine clause from hudPhase's amber branch 

#### HIS WORDS (Athena) — every operator sentence in the AAR checked against the LIVE r.204 bytes by playing them

{"score": 82, "findings": [{"severity": "BLOCKING", "title": "In a LIVE room the glass stops following the bullseye \u2014 his 20:20 sentence is the one case r.204 does not cover, and no gate leg runs there", "evidence": "markUnderBullseye gates the whole r.204 fix on marksPersist(): /tmp/claude-0/wtm/frontend/public/drone-2525/play.html:945 `if(!marksPersist()||typeof lockOn!=='function') return state.desig||null;` and :2568 `function marksPersist(){ return chNum()===0&&!(state.lobby&&state.lobby.phase==='LIVE'); }`. Played (p4.mjs, screenshot a5-live-room.png): in PRACTICE, bullseye on the unmarked 100 M CENTRE \u2192 strip `100 M CENTRE \u00b7 PRESS TARGET`, TARGET lit. The same seat with state.lobby.phase='LIVE' (the deck's own idiom, used at :3261 and in eight self-test rows): mark the 50 M LEFT, then put the bullseye on 100 M CENTRE \u2192 strip stays `AMBER \u00b7 T1 \u00b7 50 M LEFT \u00b7 THE OTHER SEAT APPROVES`; on 150 M RIGHT \u2192 same; on blank sky \u2192 same. That is shot45/shot47/shot48 reproduced on r.204. His 20:20 words are explicitly about this case (\"the color of button and silloette of target are accurate for others when we have multi-player\"), and the 20:20 Reading promised \"r.204 ships the single-seat reading as cut\" \u2014 the single-seat reading is exactly what is absent the moment he opens a room. The gate does not catch it: BUTTONS_FOLLOW_THE_BULLSEYE (:4804-4822) runs bounce, stay and qual40 but never sets lobby.phase='LIVE', so the invariant has no multiplayer leg.", "fix": "Make the recital and the lit button read the plate under the bullseye in a room too \u2014 in markUnderBullseye (:945) drop the marksPersist() gate for the READ (keep it for mark persistence): return the slot under the bullseye when one exists, else state.desig only when the bullseye is on that same plate \u2014 and add a LIVE-room leg to BUTTONS_FOLLOW_THE_BULLSEYE (:4804) that asserts it."}, {"severity": "BLOCKING", "title": "An amber under the bullseye loses its APPROVE cue the moment the magazine is empty, while the toast still says PRESS APPROVE \u2014 reachable in every QUAL 40 phase", "evidence": "nextStep returns before stepFor on an empty magazine: /tmp/claude-0/wtm/frontend/public/drone-2525/play.html:946 `if(state.mag&&(state.mag.rounds|0)<=0) return '';`, and the strip's amber clause overwrites the step at :2990 `(state.mag&&(state.mag.rounds|0)<=0)?'PRESS RELOAD':'PRESS APPROVE'`. Played (p7.mjs): amber 50 M LEFT under the bullseye, 30 rds \u2192 `lit:[APPROVE]`, strip `AMBER \u00b7 T1 \u00b7 50 M LEFT \u00b7 PRESS APPROVE`. Set rounds to 0 \u2192 `lit:[]`, strip `AMBER \u00b7 T1 \u00b7 50 M LEFT \u00b7 PRESS RELOAD`, while the toast on the same screen still reads `AMBER \u00b7 50 M LEFT \u00b7 NOW PRESS APPROVE`. Pressing APPROVE still works (phase amber\u2192red), so the deck hid a step that was available and correct. After it, strip `RED \u00b7 \u2026 \u00b7 PRESS RELOAD`, FIRE dark, toast `RED BOX \u00b7 50 M LEFT \u00b7 APPROVED BY YOU \u00b7 NOW PRESS FIRE` (:2513) \u2014 two lines, two different next steps. The state is routine: the real QUAL 40 play-through on these bytes reaches counter 0 four times (scratchpad/r204/sim-qual/timeline.json, t=47.4, 113.2, 172.4, 231.4), and his 20:55 drill targets and approves everything before anyone fires, so ambers stand while a magazine runs dry. Contradicts his 21:05 \"if targeted, approve is next step\".", "fix": "In nextStep (:946) replace the blanket empty-magazine return with one that only suppresses FIRE \u2014 keep APPROVE lit on an amber and TARGET on an unmarked plate \u2014 and make the strip's RELOAD substitution (:2989-2990) apply to the FIRE step only, so the recital, the toast and the lit button give one answer."}, {"severity": "BLOCKING", "title": "DD-13e is only half shipped: with nothing under the bullseye the recital still names another plate, and the gate leg is written weaker than the decision the notes record", "evidence": "The decision as re

---

## 3 · AsM 111 — the twelve Masters, 111 words each, on the live r.204 (`wf_3ad0a68a-cd2`)

**Aset.** I played the whole table, forty of forty, and two training runs. The times are true: five, eight, twelve, sixteen seconds up, three between, ten at the magazine change, and three for a hit target to come back. The cold end is exact — cease fire, unload, show clear, range is cold. The start is not. The table simply begins three seconds after I arrive: no red lamp, no load and make ready, no watch your lane. Worse, the stop light is backwards here. In training green means targets up, shoot. In qualification green lights only once every target is down, and red burns while two seconds remain. One light, one meaning.

**Asar.** I shot three whole tables on his phone. Forty of forty ended CEASE FIRE, UNLOAD, SHOW CLEAR, 40 OF 40, EXPERT, RANGE IS COLD. Six of forty came back UNQUAL, thirty-four unfired misses. Both add up; a soldier would sign either. RESTART hands the next man a clean lane. The beginning is empty: three seconds after the lane opens the first target stands, the magazine already in, nobody said load and make ready. RESTART promises it starts on green; it starts dark. Green comes only after a target falls, and stays lit through the magazine change. Every window and gap timed exact. The record keeps who approved, never what I hit.

**Athena.** The link opens on three green buttons of equal weight; THE RANGE lands me in TRAIN UP, and QUAL 40 hides in a dropdown. There the line breaks. TRAIN UP is perfect: the recital names the target, the lit button walks TARGET, APPROVE, FIRE, and a hit returns in three seconds. QUAL 40 starts itself. Magazine already seated, first target up in three seconds, no Load and Make Ready, no officer's word. The end says CEASE FIRE, UNLOAD, SHOW CLEAR; the start says nothing. I timed the table, every window true to the second, but green never once lit while a target stood, and fifteen targets rose off my glass unseen.

**ENKI.** I opened Lane 21 and sat still thirty seconds. Three rounds gone, three lapses written, and the recital still said TARGET FIRST. No officer spoke, nothing said load and make ready; the table starts itself. The stop light also turns over between modes: in TRAIN UP green means targets up, fire. In QUAL green comes only when every target is down, and through the first ten seconds of a twelve-second window the light shows nothing, then red, then yellow — the colours of getting ready arriving as the window closes. In TRAIN DOWN one press threw my clock away, emptied the lane, then said every target up. Times measured true, every window.

**Christo.** I played a full forty on Lane 21, then two training runs, at his phone size and at three others. Reading the target under the bullseye is right: recital, lit button and toast agree every time. The stop light does not. The deck told me the table starts on green; green never came. A target stands with the lamp dark, goes red with two seconds left, yellow with one, then green once it is already down — eighteen times a table. And Qual 40 simply starts. Train Down makes me press start first; Qual asks nothing. No load and make ready, no commence firing, only the cold end. Every clock measured true.

**Krishna.** I played a whole table and two training runs. Every window held its five, eight, twelve or sixteen seconds inside a hundredth; every gap three; every magazine change ten; the train-down clock matched my own watch across eleven targets. The stop light does not keep that company. Green never burns while a target stands — it lights after the window shuts, over an empty lane, beside the words unfired miss. Your own sentence promises Qual 40 starts on green; my first target rose with the lamp dark. Nobody said load and make ready; the table simply began. Turn the phone sideways and the magazine floats out into the middle of the lane.

**ENLIL.** I played a whole table on your phone: forty rounds, forty hits, EXPERT, the cold end right. Every time is exact: five, eight, twelve, sixteen seconds up, three between engagements, ten at the magazine change. In train up a hit target stands again three seconds after it is down; the train down clock said 0:06.0 against my own six. Across thirteen thousand frames the recital, the lit button and the clock never disagreed with the lane. Nothing at the start says load and make ready. The stop light is dark while you shoot, red with the target still standing, green only after it falls. Enter early and the magazine holds thirty.

**Odin.** I shot the whole table, forty of forty. Every window held: five, eight, twelve, sixteen seconds, three between, ten at the magazine change. But in Qual the stop light is backwards — green never lit while a target stood, only after it fell. Dark the whole window. Put the range officer in front: the tower runs behind him. I watched four targets rise and fall on a closed line, booked nowhere. Three seconds from restart to the first target. Load and make ready is refused; the magazine comes full. Two seats on one lane both book the same miss. Move lane mid-table: the score follows, the engagement restarts. Forty-two lanes, three drawn.

**Pangu.** I shot two tables. The times are exact — five, eight, twelve, sixteen seconds, three between engagements, ten at the magazine change, the TRAIN DOWN clock true to five thousandths. The stop light is not. Shooting forty for forty it never lit once while a target stood: dark most of the table, green only after they fall. Green should mean a target is up. The window then stays open over an empty berm, a hundred and forty-two seconds of two hundred twenty-nine. The recital reads LAST, DOWN while two still stand. CEASE FIRE is the finest screen here; nothing greets you. Load and Make Ready. On the narrow phone a target hides.

**Sofia.** Two full tables, both trainers. The soldier finds the ending and no beginning: the glass says CEASE FIRE, UNLOAD, SHOW CLEAR, yet nothing says LOAD AND MAKE READY. The magazine fills itself, RELOAD answers MAGAZINE FULL, and three seconds later a target stands. The civilian reads the recital and knows exactly what to press; that wins. The child watches the stop light and learns the wrong lesson: green burns only when every target is down, red when one stands with two seconds left; in TRAIN UP green means shoot. The judge times it: five, eight, twelve, sixteen, three, ten; every second true. The stance alone hurries: three seconds, standing to prone.

**Thoth.** I shot two full tables of forty on Lane 21 and the clock is honest. Every window ran its five, eight, twelve or sixteen seconds inside a tenth; each count held one second; a target I hit in Train Up stood back up in three. My first table: forty rounds, forty hits, four magazines spent to zero. The stop light is not honest. Green burned seventeen seconds and never once with a target standing; while targets stood it sat dark nearly two minutes. In Qual the counter never reaches green, because ten rounds in the magazine already reads amber. And nobody says load and make ready; the first target simply rises.

**Thor.** I shot a full forty-round table and two training runs, at his size and three others. The times are honest: five, eight, twelve and sixteen seconds up, three seconds between, ten at the magazine change, three for a hit target to come back, the down clock true. The stop light is not honest. All forty of my shots went on a dark lamp. Red lit while the target still stood and two seconds remained. Green lit only after it fell, over empty ground. In training, green means fire. Same three lamps, opposite meaning. A full magazine reads amber, the warning colour. Nothing says load and make ready; the table simply starts.

---

## 4 · The specialists he named

### Stop lights and times — every lamp and every clock in TRAIN UP / TRAIN DOWN / QUAL 40, measured on the live r.204 bytes and judged against the real qualification test

**Verdict.** THE TIMES ARE RIGHT. THE LIGHT IS BACKWARDS. The wall clock is accurate to the frame — a 5 s window measures 5.00 s live, the 3 s and 10 s gaps hold, the table runs 4:00.3 against the ~3:58 the open sources cite. But the lamp that sits over that clock is inverted: across the whole table the GREEN lamp is lit for 0.00 seconds of the 164.55 seconds a soldier may fire, and for 17.00 seconds of the 75.75 seconds he may not. RED is lit only while targets stand and he must shoot. For 78.1% of every exposure the light is DARK and says nothing at all. The deck's own comment on line 955 states the correct rule — "RED wait · YELLOW ready · GREEN fire" — and qualLamp() on line 961 implements its opposite. The two training modes get it right (TRAIN DOWN: red armed, green running, red all-down), so the same app teaches two opposite conventions and the mode that carries the Army's name is the wrong one. Add to that: there is no start-of-table sequence at all — the table opens with a 3-second dark gap and then targets, no LOAD AND MAKE READY, no readiness check, no lamp. The cold end has his commands; the hot start has nothing, which is exactly what he ordered fixed. Three clocks are also soft: TRAIN DOWN over-reads +0.42–0.50 s because it keeps counting through the last plate's fall animation, truncates to tenths with floor() (an internal 2.99999 s displays 0:02.9), and accepts a 0.25 s step from one janky frame. The per-engagement exposure seconds (5/8/12/16 by count) cannot be verified against TC 3-20.40 — no open source publishes them, and the one public number conflicts. Say DECLARED, do not say sourced.

- **BLOCKING — The QUAL stop light is inverted — green is lit 0.00 s of the 164.55 s a soldier may fire, and 17.00 s of the time he may not**
  - *Evidence.* qualLamp() line 961: while targets are UP it returns 'O' (dark) until the window's last 2 s, then 'R', then 'Y'; once every target is DOWN it returns 'G' for one second. Measured over the whole table (trace.json, 4,806 ticks, confirmed live in live.json): while a target stands — DARK 128.55 s, RED 18.00 s, YELLOW 18.00 s, GREEN 0.00 s. While every target is down — GREEN 17.00 s. Zero overlap: `GREEN while a target is up: 0`. Screenshot lamp-RED-targets-up-428x926.png shows ENG 5/18, four targets standing, 2 s left, the lamp RED. The deck contradicts its own spec line 955: "Addendum 1: RED wait · YELLOW ready · GREEN fire".
  - *Fix.* Rewrite qualLamp(): 'G' for the whole exposure window, 'Y' for its last 2 s, 'R' in every gap, phase gap, pre-arm and cold state. Gate it with a row — GREEN_MEANS_FIRE — asserting across a full simulated table that no tick has lamp 'G' with zero targets up, and no tick has a target up with lamp 'R' or 'O'.
  - *Source.* Deck's own comment, play.html:955 ("RED wait · YELLOW ready · GREEN fire"); universal convention IEC 60073 (red danger / amber warning / green safe); US Army combat-vehicle range safety light patent US 5,057,815 stacks red-amber-green "in the same pattern as a regular traffic light". No official Army tower-light chart is public — the inversion is proven against the deck's own stated rule, which needs no outside authority.

- **BLOCKING — The light is DARK for 78.1% of every exposure — the lamp says nothing during most of the time the line is hot**
  - *Evidence.* qualLamp() returns 'O' for t < sec−2. Measured: of 164.55 s with a target standing, 128.55 s (78.1%) are dark; 77.9% of the whole 240.3 s table is dark. On a 5 s window the first 3 s are dark, on a 12 s window the first 10 s, on a 16 s window the first 14 s. The DOM confirms it: class 'O', aria-label "start light " with no word, startWord empty (live.json samples 3000–6000 ms of engagement 1).
  - *Fix.* A range light is never unlit while the line is hot. Remove the 'O' state from QUAL entirely — every moment of the table is red, amber or green. 'O' may survive only as a pre-boot state before the lane is chosen.
  - *Source.* Measurement (trace.json, live.json); no range-light convention anywhere has an unlit state during a hot line.

- **BLOCKING — QUAL 40 has no start-of-table sequence at all — the table opens with a 3-second dark gap, no LOAD AND MAKE READY, no readiness check, no lamp**
  - *Evidence.* rangeTick() starts the run in phase 'gap' with R.t=0 and fires engagement 1 at ENG_GAP_S=3 s; measured lead-in 3.00 s with the lamp dark and the timer reading "NEXT 3 S" (trace.json rows 1–60; live.json 51–2951 ms). A sweep of every uppercase string in the served bytes (modes.json .strings) returns the cold-end commands only — CEASE FIRE, UNLOAD, SHOW CLEAR, RANGE IS COLD, and magReload()'s "CEASE FIRE · UNLOAD AND SHOW CLEAR · RANGE IS COLD" at line 863. Zero hits for MAKE READY, LOAD AND, RANGE IS HOT, COMMENCE FIRE, WATCH YOUR LANE, IS THE LINE READY. Pre-arm in QUAL the lamp is DARK (modes.json .prearm.qual40 = {L:'O', aria:'start light ', word:''}) while both TRAIN modes correctly show RED.
  - *Fix.* Build the opening the way the cold end is already built: a tower sequence before engagement 1 — RED on "SHOOTERS, LOAD AND MAKE READY" (the RELOAD button calls, the magazine seats), then the readiness check, then AMBER "STAND BY · WATCH YOUR LANE", then GREEN as the first target rises. Reuse the #qualOver overlay that already carries CEASE FIRE / UNLOAD / SHOW CLEAR, and the same toast path. Pre-arm must be RED in all three modes, not dark in one.
  - *Source.* Operator 2026-10-12 04:34 ("ensure 'Load and Make Ready' on Qual-40 prior to starting as well as a fee [few] range commands from Range Safety Officer per Army guidelines") and his 18:25 shot43; range-command sheets (Iowa DNR, Georgia 4-H, Tarrant County SO academy) confirm LOAD AND MAKE READY → readiness check → firing as the standard sequence; exact Army wording is set by the range SOP and is not published in the sources I could reach.

- **BLOCKING — The screen reader is told the opposite of the truth at every moment of QUAL**
  - *Evidence.* paintLight() sets aria-label from lightWord(), and paintTimer() blanks the visible word in QUAL but never touches the aria-label. Measured live: with four targets standing and 2 s left the lamp announces "start light WAIT" (shots.txt, 428×926 and 375×667); with every target down it announces "start light FIRE"; after qualFinish on a cold range it announces "start light WAIT" while the overlay reads CEASE FIRE · UNLOAD · SHOW CLEAR · RANGE IS COLD (modes.json .cold.aria). A player on VoiceOver is told to wait while he must shoot, and to fire when every plate is flat.
  - *Fix.* Drive the aria-label from the state, not from lightWord(): "range green, fire, N seconds" / "range amber, N seconds left" / "range red, no target, next in N" / "range red, cease fire, range is cold". Gate it with the lamp row so the spoken word and the colour can never disagree.
  - *Source.* Measurement (shots.txt, modes.json); CLAUDE.md signer-voice principle — a screen a person can reach speaks about their next action.

- **BLOCKING — RED means two opposite things inside QUAL 40 — "two seconds left, shoot now" and "the range is cold, do not fire"**
  - *Evidence.* qualLamp() returns 'R' at window−2 while targets stand and the shooter must engage; startLight() line 959 returns 'R' once state.qualDone is set, on a cold line with every plate down and the magazine empty (modes.json .cold.L = 'R', .cold.timer = 'COLD'). Same lamp, same colour, same mode, 240 seconds apart, opposite instructions.
  - *Fix.* Once GREEN_MEANS_FIRE lands this resolves itself: red becomes the single no-fire colour everywhere — pre-arm, every gap, the phase gap and the cold end — and the window's warning moves to amber.
  - *Source.* Measurement (trace.json, modes.json); the collision is internal to the deck and needs no outside authority.

- **BLOCKING — The TRAIN DOWN clock over-reads every run by ~0.42–0.50 s because it keeps counting through the last plate's fall animation**
  - *Evidence.* rangeTick()'s training branch sets anyUp=true for a plate that is falling (q.fall += dt*2.4, first branch, returns early), and only calls downStop() when !anyUp. The fall takes 1/2.4 = 0.4167 s. Measured: the last plate was killed at state.downT = 2.500 and the clock stopped at 3.000 — a +0.500 s bias at a 0.05 s step (modes.json .traindown.kill_downT / .stop_downT / .bias_s). Every TRAIN DOWN time the operator reads is that much slow. A real shot timer stops on the shot.
  - *Fix.* Stop the clock when the last plate's lifePct reaches 0 — the hit — not when its fall animation finishes. Let the fall play on after downStop(). Gate it: kill the last plate at a known downT and assert the recorded time is within one frame of it.
  - *Source.* Code (play.html rangeTick training branch) + measurement (modes.json).

- **NOTE — The TRAIN DOWN clock truncates to tenths with floor() and no epsilon — an internal 2.99999 s displays as 0:02.9**
  - *Evidence.* downClockWord() line 915: t = Math.floor((r-w)*10). Measured: 60 ticks of 0.05 accumulate to 2.9999999999999996 and the clock displays "0:02.9" (modes.json .traindown.internal = 3, .shown = "0:02.9", .trunc_err = 0.1). Combined with the +0.42 s fall bias the net error is +0.32 to +0.42 s. Separately, rangeDt() caps a step at 0.25 s, so one janky frame can add a quarter second to the recorded time with nothing on screen to say so.
  - *Fix.* Round to the nearest tenth with a 1e-6 epsilon, or show hundredths as a real timer does. Consider recording the time in integer milliseconds from a single performance.now() baseline rather than accumulating dt.
  - *Source.* Code (play.html:915, rangeDt) + measurement (modes.json).

- **NOTE — EXPOSURE_BY_COUNT {1:5, 2:8, 3:12, 4:16} cannot be verified against the real table, and the one public number conflicts with it**
  - *Evidence.* The deck's constant is commented "the operator's rule". Searching for TC 3-22.9 / TC 3-20.40 Table VI exposure times returns coverage that explicitly declines to publish them — the 2018 reporting states the final product differs from the draft "only in the exposure times" and never lists the final values. The single secondary page that gives a number says the course opens standing with the first target at 50 m exposed for 3 seconds; the deck exposes it for 5 s (ENG 1, measured 5.00 s live). What IS corroborated: four tables, one 10-round magazine each, 40 rounds, up to four targets at once, and a transition clock between tables that starts only after the exposure ends — which is exactly how rangeTick() behaves.
  - *Fix.* Keep the numbers but label them honestly in the code and anywhere the player can read them: DECLARED by the operator, not sourced from TC 3-20.40. If the real table matters, it has to come from the range's own program card or the current publication on armypubs.army.mil — it is not in open reporting. Flag the 50 m / 3 s conflict to him as the one place a public number disagrees.
  - *Source.* soldiersystems.net (2018 Army rifle qualification coverage); primaryandsecondary.com "Changes to the Army's Rifle Qualification"; legalclarity.org (single weak source for the 3 s and the 3:58). TC 3-20.40 itself is the authority and is not public in these results.

- **NOTE — The exposure window runs one tick long because the expiry test has no epsilon while the timer that displays it does**
  - *Evidence.* rangeTick() ends the window on `R.t >= (R.eng.sec)` after `R.t += dt`, with no epsilon; qualTimer() uses `Math.ceil(sec - t - 1e-9)`. At a fixed 0.05 s step, 100 accumulations reach 4.999999999999993, so a 5 s window actually ran 5.05 s and an 8 s window 8.05 s (trace.json segment table), while the displayed timer had already read "0 S" for one tick with the plate still standing and still hittable. Live wall-clock play does NOT show this (measured 5.00 s, live.json), so it is a fixed-step artefact plus a display/engine disagreement, not a live timing error.
  - *Fix.* Use the same −1e-9 epsilon in the expiry test that qualTimer already uses, so the window, the number on the glass and the plate's life all end on the same tick.
  - *Source.* Code (play.html rangeTick vs qualTimer) + measurement (trace.json vs live.json).

- **NOTE — TRAIN UP's "returns after 3 s" is really 3.5 s from the shot**
  - *Evidence.* RETURN_S=3 is counted from the moment the plate is fully down, not from the hit: rangeTick() advances q.fall first and only starts q._ret once !q.up. Measured: the plate fell at 0.45 s after the kill and stood again at 3.50 s — 3.05 s down-to-up, 3.50 s shot-to-up (modes.json .trainup).
  - *Fix.* Either count RETURN_S from the hit so the constant means what it says, or rename it and say 3.5 s wherever the deck describes TRAIN UP. This is a wording choice, not a defect — but his order was that the times be accurate, and 3 s is not what the player experiences.
  - *Source.* Measurement (modes.json .trainup); RETURN_S is DECLARED, not sourced.

- **NOTE — The whole table runs 4:00.3 against the ~3:58 the open sources cite — inside the band, worth stating**
  - *Evidence.* Computed and measured: 18 exposures summing 164 s + 14 engagement gaps × 3 s (42 s) + 3 phase gaps × 10 s (30 s) = 236 s of programme, plus the 3 s lead-in = 239 s, and the simulated run ended at 240.3 s with state.qualDone (trace.json). Secondary sources give "3 minutes and 58 seconds" (one page) and "approximately four minutes" (another).
  - *Fix.* Nothing to change on the strength of this. If the r.205 RSO opening adds real seconds before engagement 1, keep the firing portion at 236 s so the table itself still matches the published ballpark, and let the ready sequence sit outside it.
  - *Source.* Measurement (trace.json); legalclarity.org (3:58, single source); soldiersystems.net ("approximately four minutes").

- **NOTE — EXPERT is awarded on hit count alone — the real rule also requires at least one of the five 300 m exposures, and the deck has exactly those five**
  - *Evidence.* qualBadge() line 845: h>=36 EXPERT / h>=30 SHARPSHOOTER / h>=23 MARKSMAN, nothing else. The cut scores match the published tiers. The deck's own range distribution is 50:6 · 100:7 · 150:8 · 200:8 · 250:6 · 300:5 (program.json .byRange) — exactly the five 300 m exposures the real Expert rule names, so the rule is directly implementable with the data already on hand.
  - *Fix.* Add the condition to qualBadge(): EXPERT requires 36+ hits AND at least one hit recorded against a 300 m plate. The hit rows already carry the engagement and its ranges, so no new state is needed. Gate it with a row that drops a 40-hit run with zero 300 m hits to SHARPSHOOTER.
  - *Source.* legalclarity.org (36–40 Expert, 30–35 Sharpshooter, 23–29 Marksman, and the 300 m requirement) — a single secondary source, so confirm with him before shipping; the 5 × 300 m count corroborates it independently.

<details><summary>The specification it wrote</summary>

```
EVERY LAMP — deck vs real
(measured on http://127.0.0.1:4727 r.204, lane 21, QUAL 40; sim trace 4,806 ticks @50 ms + live DOM sampler 1,240 samples @50 ms; both agree)

| # | Moment | Deck lamp | Deck aria | Real | Verdict | Fix |
|---|--------|-----------|-----------|------|---------|-----|
| L1 | QUAL, before the line is hot | DARK ('O'), aria "start light " | none | RED — a line that is not hot is red | WRONG | RED |
| L2 | QUAL, targets up, first 3 s of 5 / 10 s of 12 / 14 s of 16 | DARK — 128.55 s of the table | none | GREEN — the line is hot, fire | WRONG | GREEN for the whole window |
| L3 | QUAL, window − 2 s (targets still up) | RED | "start light WAIT" | AMBER at most; RED means cease fire | WRONG (inverted) | AMBER |
| L4 | QUAL, window − 1 s (targets still up) | YELLOW | "start light READY" | AMBER — time running out | PARTLY RIGHT | AMBER (merge with L3) |
| L5 | QUAL, all targets down, first 1 s of the gap | GREEN | "start light FIRE" | RED — no target, do not fire | WRONG (inverted) | RED |
| L6 | QUAL, rest of the 3 s gap | DARK | none | RED | WRONG | RED |
| L7 | QUAL, the 10 s phase gap | DARK (1 s GREEN at its head) | "start light FIRE" | RED — mag change, movement | WRONG | RED + "RELOAD · MOVE" |
| L8 | QUAL, after qualFinish (cold) | RED | "start light WAIT" | RED | RIGHT colour, WRONG word | RED + "CEASE FIRE · COLD" |
| L9 | GREEN seconds while firing is possible, whole table | 0.00 s of 164.55 s | — | green throughout | WRONG | see L2 |
| L10 | GREEN seconds while firing is impossible | 17.00 s of 75.75 s | — | zero | WRONG | see L5 |
| L11 | RED's two meanings in one mode | "2 s left, shoot" (L3) AND "range cold" (L8) | — | one meaning: do not fire | WRONG | one meaning |
| L12 | TRAIN UP, a target standing | GREEN | "start light FIRE" | GREEN | RIGHT | — |
| L13 | TRAIN UP, all momentarily down | YELLOW | "start light READY" | AMBER | ACCEPTABLE | — |
| L14 | TRAIN DOWN, armed, before START | RED, word START | "start light WAIT" | RED | RIGHT | — |
| L15 | TRAIN DOWN, clock running | GREEN, word TIME | "start light FIRE" | GREEN | RIGHT | — |
| L16 | TRAIN DOWN, all down | RED, word ALL DOWN | "start light WAIT" | RED | RIGHT | — |

Lamp census, whole table (240.3 s): DARK 77.9% · RED 7.5% · YELLOW 7.5% · GREEN 7.1%.
While a target stands (164.55 s): DARK 128.55 · RED 18.00 · YELLOW 18.00 · GREEN 0.00.
While every target is down (75.75 s): DARK 58.70 · GREEN 17.00 · RED 0.05.

EVERY TIME — deck vs real

| # | Time | Deck | Measured live | Real | Source | Verdict |
|---|------|------|---------------|------|--------|---------|
| T1 | Exposure, 1 target | 5 s | 5.00 s (sim 5.05) | not published; one secondary page says the first 50 m target is 3 s | TC 3-20.40 not public; legalclarity.org (single, weak) | UNVERIFIED · CONFLICT |
| T2 | Exposure, 2 targets | 8 s | 8.00 s (sim 8.05) | not published | — | UNVERIFIED (DECLARED) |
| T3 | Exposure, 3 targets | 12 s | 12.00 s | not published | — | UNVERIFIED (DECLARED) |
| T4 | Exposure, 4 targets | 16 s | 16.00 s | not published; "up to four targets at once" is confirmed | soldiersystems.net 2018 | UNVERIFIED (DECLARED) |
| T5 | ENG_GAP_S between engagements | 3 s | 3.00 s | not published | — | DECLARED |
| T6 | PHASE_GAP_S, mag change + move | 10 s | 10.00 s | transition time between tables is real, and its clock starts only after the exposure ends — deck does exactly this | primaryandsecondary.com / soldiersystems.net | STRUCTURE RIGHT · 10 s PLAUSIBLE |
| T7 | Lead-in before engagement 1 | 3 s, lamp dark, silence | 3.00 s | LOAD AND MAKE READY → readiness check → WATCH YOUR LANE, tens of seconds | Iowa DNR / 4-H / academy range-command sheets; Army wording per range SOP | WRONG — nothing exists |
| T8 | Whole table | 240.3 s (4:00.3); firing part 239 s (3:59) | — | ~3:58, or "approximately four minutes" | legalclarity.org (single) / soldiersystems.net | MATCH within band |
| T9 | Engagements | 18 (5/5/4/4) | — | 4 tables × 10 rounds confirmed; engagement count not published | soldiersystems.net | DECLARED (his 1–14, deck 15–18) |
| T10 | Rounds | 40 | 40 recorded, no 41st | 40 | soldiersystems.net | MATCH |
| T11 | Magazines | 4 × 10 | magCap 10, 5th refused | 4 × 10 | soldiersystems.net | MATCH |
| T12 | Targets by range | 50:6 100:7 150:8 200:8 250:6 300:5 | — | five 300 m exposures confirmed by the Expert rule | legalclarity.org | 300 m MATCH; rest DECLARED |
| T13 | Badges | 36 EXPERT / 30 SHARPSHOOTER / 23 MARKSMAN | — | 36–40 / 30–35 / 23–29, and Expert must hit ≥1 of the five 300 m | legalclarity.org | CUTS MATCH; 300 m rule MISSING |
| T14 | Exposure expiry epsilon | `R.t>=sec` after `R.t+=dt`, no epsilon (qualTimer uses −1e-9) | 5 s window ran 5.05 s in fixed step; 5.00 s live | window ends when it ends | code | NOTE — timer reads "0 S" one tick early |
| T15 | RETURN_S, TRAIN UP | 3 s | 3.05 s down→up; 3.50 s shot→up (0.45 s fall first) | a real pop-up returns on the tower's clock | DECLARED | LABEL WRONG — it is 3.5 s from the shot |
| T16 | TRAIN DOWN clock start | downStart, downT = 0 | 0.000 | the start signal | — | RIGHT |
| T17 | TRAIN DOWN clock stop | when the last plate is flat | kill at 2.500 → stop at 3.000, **+0.500 s** (fall = 1/2.4 = 0.417 s) | a shot timer stops at the shot | code + measurement | WRONG — systematic over-read |
| T18 | TRAIN DOWN precision | tenths, floor(), no epsilon | internal 2.99999 s displayed **0:02.9** | 0.01 s on a real timer | code + measurement | WRONG — up to 0.1 s lost, net +0.32…+0.42 s with T17 |
| T19 | TRAIN DOWN tick cap | rangeDt caps at 0.25 s | — | wall time | code | NOTE — one janky frame can add 0.25 s silently |

PROPOSED LAMP (one rule, no inversions anywhere)
- pre-arm / cold / any gap / phase gap → RED, "DO NOT FIRE" (timer keeps "NEXT n S")
- RSO ready sequence (new, r.205): RED on LOAD AND MAKE READY → AMBER on the readiness check / STAND BY → GREEN as the first target rises
- target(s) up → GREEN for the whole window
- last 2 s of the window → AMBER
- after qualFinish → RED, "CEASE FIRE · RANGE IS COLD"
Then red never means shoot, green never means hold, amber keeps its real job (warning), and the cold end's red is the same red as every other no-fire moment. aria-label follows the colour: "range green, fire, 12 seconds" · "range amber, 2 seconds left" · "range red, no target" · "range red, cease fire, range cold".

EVIDENCE (all under /tmp/claude-0/-home-user-eXeL-AI-Polling/d1ee5405-1233-5ea7-aa59-4ce83334aed8/scratchpad/asm111/thoth/)
sim.mjs → trace.json (4,806 ticks, whole table) · live.mjs → live.json (1,240 live DOM samples, 62 s) · modes.mjs → modes.json (pre-arm, cold, TRAIN UP return, TRAIN DOWN clock) · shots.mjs → lamp-RED-targets-up-428x926.png (ENG 5/18, four targets up, 2 s left, lamp RED, aria "start light WAIT"), lamp-GREEN-all-down-428x926.png (every target down, lamp GREEN, aria "start light FIRE"), lamp-COLD-end-428x926.png, same three at 375×667 · program.json (the 18 engagements, ranges, exposures).
```

</details>

### Range Safety Officer — the opening sequence for QUAL 40 (Load and Make Ready), and the stop lights and times checked against real play

**Verdict.** The table has no beginning. r.204's QUAL 40 opens with a loaded weapon on a line nobody declared hot: `enterTheRange(21,'qual40')` and 3.05 s later the first target of a 40-round record table is standing, the magazine already at MAG 1/4 · 10 RDS, the stop light dark, no command spoken. The end of the table is a ceremony (CEASE FIRE / UNLOAD / SHOW CLEAR / score / THE LINE IS CLEAR / RANGE IS COLD); the start is a cold open. His order fixes exactly that, and the mirror is clean — the deck's cold end already uses three of the six TC 3-22.9 weapons commands (CEASE FIRE, UNLOAD, SHOW CLEAR), so the opening is the other three (LOAD, MAKE READY, FIRE) wrapped in the range SOP that frames them. On his second order: the TIMES are accurate — measured 5.05 / 8.05 / 12.0 / 16.0 s by target count, 3.05 s between engagements, 10.0 s at the magazine change, 240.3 s for the whole table against 239 s computed from the constants. The STOP LIGHT is not. In QUAL 40 the lamp runs backwards: it is dark while you must shoot, says WAIT with 2 s left, READY with 1 s left, and turns GREEN · FIRE at the exact instant every target goes down — on all 18 engagements — while the glass promises "40 TARGETS · 4 MAGAZINES · STARTS ON GREEN". The light never goes green before a target in the whole table. Two BLOCKING, three NOTE. The opening spec below is measured on four viewports and built almost entirely from primitives the deck already has.

- **BLOCKING — QUAL 40 begins with no command, no light and a weapon already loaded — the cold end has no mirror at the start**
  - *Evidence.* Measured on r.204 (sha 2085cd15…, 127.0.0.1:4727) at 428×926. `enterTheRange(21,'qual40')` then read the glass: light `O` (dark), startWord "", timer "NEXT 3 S", strip "QUAL 40 · READY · HIT 0/0", magazine "MAG 1/4 · 10 RDS" — loaded silently by `magLoad('RESET')` inside `qualResetTower()` — RELOAD unlit, no card. Deterministic tick trace: t=0 gap → t=3.05 s engagement 1 up, 5 s window, the record table running. Nothing was declared, nothing was asked, nothing was answered. Compare the other end: `qualFinish()` paints six lines (CEASE FIRE / UNLOAD / SHOW CLEAR / <score> / THE LINE IS CLEAR / RANGE IS COLD · PRESS RESTART), sets the light to R, the timer to COLD, relabels RELOAD to UNLOAD and writes `decide('COLD','RANGE',…)`. The table is ceremonious about ending and silent about starting. Artefacts: scratchpad/asm111/rso/open-state.json, trace-changes.json, 01-open.png, 02-cold-end.png.
  - *Fix.* Build the six-command opening in `spec` below: a rolling card `#rsoCard`, `state.rso`/`state.rsoT`, `rsoStart()` from `goRange()` only, `rsoTick()` first in `rangeTick`'s qual40 branch as the gate, two firer presses (RELOAD at LOAD, #btnRangeReset reading READY at the ready check), three decision rows (HOT, the existing RELOAD, READY), and the weapon EMPTY at the open so "LOAD" means something. Eight new QA rows.
  - *Source.* Measured — probe-open.mjs / probe-table.mjs on the served r.204 bytes; play.html qualFinish() L930, paintQualOver() L938, qualResetTower() L867, enterTheRange() L5272

- **BLOCKING — The QUAL 40 stop light runs backwards — GREEN · FIRE lights the instant every target goes down, and never before one rises**
  - *Evidence.* `qualLamp()` (L961) reads the EXPOSURE's own clock instead of the gap before it: during `up` it returns `O` until `t>=sec-2`, then `R`, then `Y` at `t>=sec-1`; `G` only once the window has CLOSED, held 1 s into the rest. Measured, engagement 1: window 3.05→8.10 s; lamp dark 3.05–6.10, RED/WAIT 6.10–7.10, YELLOW/READY 7.10–8.10, GREEN/FIRE at 8.10 — the same tick the plate fell. Identical on engagements 2, 3, 4, 5 (and by construction all 18). So for 3 of a 5 s window and 14 of a 16 s window the lamp says nothing; for the last two seconds, when the firer must hurry, it says WAIT then READY; and it says FIRE at an empty lane. Worse at the seams: before engagement 1 `R.eng` is null so the lamp stays dark through the whole opening gap, and after a 10 s magazine change the lamp is dark for 9 of the 10 s and gives no warning at all before the next phase's targets rise. The glass meanwhile promises, verbatim in `modeSentence()`, "LANE 21 · QUAL 40 · 40 TARGETS · 4 MAGAZINES · STARTS ON GREEN". It never starts on green. The deck's own QA row START_LIGHT_SEQUENCE (L4580) asserts the inverted order 'O → R → Y → G', so the gate is currently defending the defect.
  - *Fix.* Move the three lamps to the gap that PRECEDES the window — the real range sequence and the deck's own word map (R=WAIT, Y=READY, G=FIRE). `function qualLamp(R){ const t=R.t||0; if(R.phase==='up') return t<1?'G':'O'; const gap=R.phase==='phasegap'?PHASE_GAP_S:ENG_GAP_S; return t>=gap-1?'Y':t>=gap-2?'R':'O'; }` — red 2 s out, yellow 1 s out, green as the targets rise and held 1 s into the window, dark the rest. The opening ends by setting `rangeRun(lane).t = ENG_GAP_S` while the lamp is green, so engagement 1 rises on the green and "STARTS ON GREEN" becomes literally true. Rewrite START_LIGHT_SEQUENCE's expected string to 'O → R → Y → G' leading each window (it is an edit to a QA expectation, not to a shipped ledger block — state it in the release note), and add QUAL_LAMP_LEADS_THE_WINDOW (gate 8 in `spec`) asserting the lamp is never G with zero targets up.
  - *Source.* Measured — probe-open.mjs trace-changes.json (t=3.05/6.10/7.10/8.10 …); play.html qualLamp() L961, lightWord() L968, modeSentence() L934, QA row L4580

- **NOTE — In QUAL 40 the stop light carries no word — the colour-blind path its own QA row asserts is blanked every frame**
  - *Evidence.* `paintTimer()` ends with `const q=chNum()===0&&state.rangeMode==='qual40'; if(w&&q&&w.textContent!=='') w.textContent='';` — in QUAL the timer is given the lamp's place and `#startWord` is emptied on every paint. Measured: forced `paintLight('R')`, `('Y')`, `('G')`, `('O')` in qual40 and read `#startWord` each time — "" in all four cases. QA row START_LIGHT_WORDS (L4680) asserts 'R:WAIT Y:READY G:FIRE' but reads it outside qual40, so the gate stays green while the mode that most needs the word has none. A red lamp and an amber lamp are the same lamp to a red-green colour-blind firer, and the lamp is the only thing telling him when to shoot.
  - *Fix.* During the opening, do not blank it: the six commands ARE WAIT / READY / FIRE and the card says them anyway. For the running table, put the word back beside the seconds — `#startTime` reads e.g. "READY 1 S" / "FIRE 5 S" / "WAIT 2 S" — or restore `#startWord` and move the seconds under it. Then extend START_LIGHT_WORDS to read in qual40 as well, which is where it was always meant to apply.
  - *Source.* Measured — probe-empty.mjs lamp-R/Y/G/O.png, all word=""; play.html paintTimer() L978, QA row L4680

- **NOTE — A six-line opening card does not fit the small phone or landscape — the rolling three-command window does**
  - *Evidence.* Painted the proposed card into `#qualOver`'s real CSS at four viewports and measured against RELOAD, the stop light, the stance box, the magazine line, the strip, the buttons and the sticks. Six lines (the exact mirror of the cold card): 428×926 214 px clear · 390×844 236 px clear · 375×667 236 px and it covers `magReload`, `startLight` and `posWell` · 844×390 214 px and it covers `magBar`. It would print over the two things the commands are about — the magazine and the light. Three lines (two commands dimmed, the command in force, one action line): 168 / 190 / 190 / 137 px, inside the viewport, zero clash at every size. `pointer-events:none` is inherited from `#qualOver` so no press is ever blocked.
  - *Fix.* Build the card as the rolling three-command window specified below, not as a growing six-line block. Also add `'rsoCard'` to `hudKeepOut()`'s id list at L2023 — and `'qualOver'` with it: the cold end card is missing from the keep-out list today, so a plate caption can print across CEASE FIRE.
  - *Source.* Measured — probe-card.mjs, card-fit.json, card-428x926.png / card-390x844.png / card-375x667.png / card-844x390.png; play.html #qualOver CSS L46-49, hudKeepOut() L2023

- **NOTE — Every piece the opening needs already exists and behaves — the member is mostly wiring, not new machinery**
  - *Evidence.* Verified each primitive on the live bytes rather than assuming it. Weapon empty at n=0: `magTxt` "MAG 0/4 · 0 RDS", counter "0" painted red rgb(226,75,59) by his own colour rule, `reloadCalls()` true and `#magReload` carries `.call` — RELOAD is already the one lit control on an empty weapon. A FIRE press before loading: refused, `decide REJECT EMPTY_MAGAZINE`, toast "EMPTY · PRESS RELOAD", no round spent, nothing downed. The LOAD press at n=0: `magReload()` → MAG 1/4 · 10 RDS and writes `decide('RELOAD','MAG',{why:'MANUAL',cap:10,n:1})` with no new code. Four magazines then exactly four: presses give 2/4, 3/4, 4/4, then "NO MAGAZINE LEFT · 4 OF 4 USED" — so an opening LOAD plus the three phase changes is precisely the IWQ issue. The stance box already reads TACTICAL STANDING before the table starts. `nextStep()` already returns '' at 0 rounds so no fire button lights. And one hook reaches all three entries: `enterTheRange()`, the mode picker and RESTART all end in `goRange()` (RESTART verified to clear qualDone and re-open).
  - *Fix.* Hook `rsoStart()` into `goRange()` alone, make it a no-op while `state.qaArmed` unless called `{qa:true}`, and the ~100 existing qual40 QA rows that call `qualResetTower()` directly keep their loaded magazine and stay green. Do not touch `qualResetTower()` or `magLoad('RESET')` — `downStart()` and training share them.
  - *Source.* Measured — probe-empty.mjs / empty-open.json / restart-state.json; play.html magReload() L862, magCap() L848, reloadCalls() L954, nextStep() L946, qualPose() L913, rangeResetOnRecord() L5407, goRange() L5456

<details><summary>The specification it wrote</summary>

```
RSO OPENING — QUAL 40 · the mirror of the cold end. Ready to build.

════════ 0 · THE INVARIANT (write it into the file, above the code) ════════
In QUAL 40 no target rises, no round sits in the weapon and no clock runs until the Range
Safety Officer has given his commands and the firer has answered both of them.

════════ 1 · THE CARD · #rsoCard ════════
CSS: clone #qualOver (L46–49) — position:absolute; left:50%; top:42%; transform:translate(-50%,-50%);
z-index:6; width:min(92%,440px); text-align:center; pointer-events:none; color:#C9A227;
letter-spacing:.14em; line-height:1.55; background:rgba(0,0,0,.86); border-radius:12px;
padding:18px 14px 16px. ONE difference: border-color follows the lamp — #E24B3B red while the line
is cold, #F0A020 amber from MAKE READY, #3DCC8A green at COMMENCE FIRING. The card and the light
read ONE state (the r.157 house rule).

CONTENT — a rolling three-command window, never a growing block (measured: six lines cover RELOAD,
the light and the stance box at 375×667 and the magazine line at 844×390):
  <span>  the command before last      14px, opacity .35
  <span>  the last command             14px, opacity .55
  <b>     THE COMMAND IN FORCE         20px, letter-spacing .16em, full #C9A227
  <i>     what the firer does          12px, opacity .8, font-style:normal, display:block
Measured heights 168 / 190 / 190 / 137 px at 428×926 · 390×844 · 375×667 · 844×390 — inside the
viewport, touching nothing. Add 'rsoCard' (and 'qualOver', missing today) to hudKeepOut()'s id list.

════════ 2 · THE SIX COMMANDS ════════
# | the officer says  <b>              | the firer does  <i>                    | lamp     | #startTime | ends on
1 | THE RANGE IS CLEAR                 | NO ONE FORWARD OF THE FIRING LINE      | R WAIT   | 2 S → 1 S  | 2.0 s
2 | THE FIRING LINE IS HOT             | LANE 21 · 40 TARGETS · 4 MAGAZINES     | R WAIT   | 2 S → 1 S  | 2.0 s
3 | WITH A TEN-ROUND MAGAZINE, LOAD    | PRESS RELOAD                           | R WAIT   | LOAD       | the RELOAD press
4 | MAKE READY                         | SAFETY ON · TACTICAL STANDING · EYES ON YOUR LANE | Y READY | 2 S → 1 S | 2.0 s
5 | IS THE FIRING LINE READY?          | PRESS READY                            | Y READY  | READY      | the READY press
6 | WATCH YOUR LANE · COMMENCE FIRING  | TARGET · APPROVE · FIRE                | G FIRE   | 1 S        | 1.5 s, then engagement 1 rises ON the green
Steps 3 and 5 have no timer — they wait on him for as long as he takes. That is a real range.

SOURCES, command by command (this sandbox's proxy blocks page fetches; labelled the way
docs/drone-2525/RANGE_QUALIFICATION_RESEARCH.md labels its own):
 • LOAD · MAKE READY · FIRE — the TC 3-22.9 weapons commands. KNOWLEDGE (TC 3-22.9 itself could not be
   fetched here; armypubs.army.mil is the place to confirm the exact wording). CORROBORATED by the USMC
   rifle weapons-handling set returned by the search index — LOAD, MAKE READY, FIRE, CEASE FIRE, UNLOAD,
   UNLOAD AND SHOW CLEAR — and by the deck itself, whose cold end already speaks CEASE FIRE / UNLOAD /
   SHOW CLEAR. All six appear exactly once across the two cards, none twice. That is the mirror.
   https://www.trngcmd.marines.mil/Portals/207/Docs/wtbn/MPMS/ART-01%20Rifle%20Weapons%20Handling_Media.pdf
 • "WITH A TEN-ROUND MAGAZINE" preface — INFERRED, standard range phrasing; the ten is the deck's own
   magCap() in qual40, and four tens is the IWQ Table VI issue already sourced in the research doc.
 • THE RANGE IS CLEAR — range SOP / DA PAM 385-63 range safety (no one forward of the firing line before
   a line goes hot). INFERRED wording.
 • THE FIRING LINE IS HOT — range SOP. SOURCED (search index): an Army.mil range account describes the
   RSO's paddle red side showing the line "hot"; an IWQ run script quotes "the firing line is now hot"
   (anecdotal, a forum post, labelled as such).
   https://www.army.mil/article/178566 · https://rallypoint.com/answers/what-is-the-best-way-to-run-a-m16-qualification-range-for-battalion
 • IS THE FIRING LINE READY? — range SOP. INFERRED; installation variants exist ("ALL READY ON THE FIRING
   LINE" in a Fort Leonard Wood-area range rules PDF). https://moore.armymwr.com/application/files/8215/9430/4011/Range_Rules.pdf
 • WATCH YOUR LANE — range SOP, SOURCED only to the same anecdotal IWQ script ("firers watch your lane").
 • COMMENCE FIRING — range SOP; on an automated RETS lane the tower starts the program and the first
   exposure is the command (FM 17-12-7 ch.10, already in the research doc). TC 3-22.9's own word is FIRE.
 • MAKE READY on this deck — DECLARED. There is no chamber, no bolt and no selector in the model, so
   MAKE READY is a two-second hold while the stance box names the first position. Say so in the comment;
   do not pretend to a chamber the deck does not have.

════════ 3 · THE STATE MACHINE ════════
One array, one tick, one call site.

const RSO=[
 {id:'CLEAR', say:'THE RANGE IS CLEAR',                do:'NO ONE FORWARD OF THE FIRING LINE', lamp:'R', secs:2.0},
 {id:'HOT',   say:'THE FIRING LINE IS HOT',            do:'',                                  lamp:'R', secs:2.0, row:'HOT'},
 {id:'LOAD',  say:'WITH A TEN-ROUND MAGAZINE, LOAD',   do:'PRESS RELOAD',                      lamp:'R', wait:'LOAD'},
 {id:'READY', say:'MAKE READY',                        do:'SAFETY ON · TACTICAL STANDING · EYES ON YOUR LANE', lamp:'Y', secs:2.0},
 {id:'ASK',   say:'IS THE FIRING LINE READY?',         do:'PRESS READY',                       lamp:'Y', wait:'READY', row:'READY'},
 {id:'FIRE',  say:'WATCH YOUR LANE · COMMENCE FIRING', do:'TARGET · APPROVE · FIRE',           lamp:'G', secs:1.5}
];
(step 2's `do` is filled at paint time: laneWord()+' · '+IWQ_TOTAL+' TARGETS · 4 MAGAZINES')

STATE   state.rso  = -1 not running | 0..5 the step in force | 6 done, the table runs
        state.rsoT = seconds inside the step

rsoOpen()        → state.rso>=0 && state.rso<RSO.length.  THE ONE TEST everything else reads.
rsoStart()       → if(state.qaArmed && !opts.qa) return;           // the ~100 existing qual40 rows stay green
                   state.mag={cap:magCap(),rounds:0,n:0,changes:0}; // the weapon is EMPTY — this is what LOAD means
                   qualResetPlatesForTable(); rangeRunReset(state.lane|0);
                   state.rso=0; state.rsoT=0; paintCues(); paintRso();
rsoAdvance(why)  → write RSO[state.rso].row if it has one; state.rso++; state.rsoT=0;
                   if(state.rso===RSO.length){ rangeRun(state.lane|0).t=ENG_GAP_S;   // engagement 1 rises on the NEXT tick
                     if(typeof ev==='function') ev('QUAL','P1','START'); }           // brackets ev('QUAL','P4','DONE …')
                   paintCues(); paintRso();
rsoTick(dt)      → if(!rsoOpen()) return false;
                   state.rsoT+=dt; const s=RSO[state.rso];
                   if(s.secs && state.rsoT>=s.secs) rsoAdvance('CLOCK');
                   return true;                                     // ← THE GATE
paintRso()       → the three-line window into #rsoCard; hide it when !rsoOpen().

WIRING — five edits, no new control:
 a) rangeTick(), first line of the qual40 branch (after `qualDropStrays(); if(state.qualDone) return;`):
      if(rsoTick(dt)) return;
    No exposure, no window clock, no lapse, no engagement while the officer is speaking.
 b) goRange(), at the end — THE ONLY CALL SITE:
      if(chNum()===0 && state.rangeMode==='qual40' && +state.challenge===0) rsoStart();
    Verified to cover all three entries: enterTheRange()→goRange(); the mode picker
    _rm.onchange→rangeResetOnRecord('MODE')→goRange(); RESTART →rangeResetOnRecord('BUTTON')→goRange()
    (RESTART measured to clear qualDone and re-open).
 c) magReload(), at the top, after the cold-line guard:
      if(chNum()===0 && rsoOpen() && RSO[state.rso].id!=='LOAD'){
        decide('REJECT','MAG',{reason:'BEFORE_THE_COMMAND',step:RSO[state.rso].id});
        toast('WAIT FOR THE COMMAND TO LOAD'); return false; }
    and after a successful magLoad('MANUAL'):
      if(rsoOpen() && RSO[state.rso].id==='LOAD') rsoAdvance('LOAD');
    Nothing else: at n=0 the press already gives MAG 1/4 · 10 RDS and already writes
    decide('RELOAD','MAG',{why:'MANUAL',cap:10,n:1}) (measured).
 d) #btnRangeReset — the READY press, the same morph r.197 already gave TRAIN DOWN's START.
    paintCues(): const ask = chNum()===0 && rsoOpen() && RSO[state.rso].id==='ASK';
                 word = ask ? 'READY' : (TRAIN DOWN waiting ? 'START' : 'RESTART');  rr.classList.toggle('call', ask || …)
    onclick(), before the TRAIN DOWN branch:
      if(ask){ decide('READY','RANGE',{mode:'qual40',lane:state.lane|0,pos:POSES[0]});
               rsoAdvance('READY'); toast('THE FIRING LINE IS READY'); paintCues(); return; }
    Before the ASK step the button still reads RESTART and simply restarts the opening — safe.
 e) startLight(), first line of the qual40 branch:  if(rsoOpen()) return RSO[state.rso].lamp;
    paintTimer(), while rsoOpen(): #startTime = the step's countdown ('2 S','1 S') or its waiting word
    ('LOAD','READY'), and DO NOT blank #startWord — it carries WAIT / READY / FIRE, the officer's own
    meaning and the only colour-blind path (today qual40 empties it every frame; measured).

RECORDS — the mirror of decide('COLD','RANGE',…). Three rows, three real acts:
  decide('HOT','RANGE',{mode:'qual40',lane,targets:IWQ_TOTAL,magazines:4})   at step 2
  decide('RELOAD','MAG',{why:'MANUAL',cap:10,n:1})                          at step 3 — already written, unchanged
  decide('READY','RANGE',{mode:'qual40',lane,pos:'TACTICAL STANDING'})      at step 5
  ev('QUAL','P1','START') at COMMENCE FIRING, bracketing ev('QUAL','P4','DONE h/r').

════════ 4 · THE REST OF THE GLASS DURING THE OPENING ════════
 strip #phScore  'QUAL 40 · '+RSO[state.rso].say+' · HIT 0/0'   (today it says READY before anyone is ready)
 strip #phDes    the step's `do` line — PRESS RELOAD, PRESS READY — then TARGET FIRST once the table runs
 stance box      TACTICAL STANDING throughout — already true, no code (qualPose() returns 0 with R.eng null)
 magazine        MAG 0/4 · 0 RDS, the counter 0 in his red — already true at n=0, no code
 RELOAD          lit by the existing reloadCalls() — already true at 0 rounds, no code
 TARGET/APPROVE/FIRE  unlit (nextStep() returns '' at 0 rounds) and a press is already refused
                 EMPTY_MAGAZINE · 'EMPTY · PRESS RELOAD' — the LOAD command is already enforced, no new gate

════════ 5 · THE GATES (new QA rows — an invariant defended only by a comment is already lost) ════════
 1 RSO_OPENS_COLD_AND_EMPTY        entering QUAL 40: card reads THE RANGE IS CLEAR, lamp R, MAG 0/4 · 0 RDS,
                                   RELOAD lit, no plate up, state.qualR===0
 2 RSO_NOTHING_RUNS_BEFORE_COMMENCE 60 s of rangeTick inside the opening raises no target, spends no round,
                                   books no lapse, leaves qualR at 0 and R.k at 0
 3 RSO_LOAD_IS_THE_FIRERS_PRESS    a RELOAD press at CLEAR/HOT is refused BEFORE_THE_COMMAND on the record;
                                   at LOAD it gives MAG 1/4 · 10 RDS and advances the card
 4 RSO_READY_IS_THE_FIRERS_PRESS   #btnRangeReset reads READY only at ASK; the press writes the READY row and
                                   advances; without it the table never starts
 5 RSO_SIX_COMMANDS_IN_ORDER       the six ids in order, the card never more than three lines, the last lamp G
 6 RSO_MIRRORS_THE_COLD_END        LOAD · MAKE READY · FIRE at the open, CEASE FIRE · UNLOAD · SHOW CLEAR at the
                                   close: the six TC 3-22.9 weapons commands, each exactly once across both cards
 7 RSO_FIRST_EXPOSURE_ON_THE_GREEN engagement 1 rises within 0.1 s of the lamp going G — his "STARTS ON GREEN"
 8 QUAL_LAMP_LEADS_THE_WINDOW      red 2 s before each exposure, yellow 1 s before, green as the targets rise and
                                   held 1 s in; the lamp is NEVER G with zero targets up. (Replaces the inverted
                                   expectation in START_LIGHT_SEQUENCE L4580 — name that edit in the release note.)
 Mobile: rows 1–7 asserted at 428×926, 390×844, 375×667 and 844×390, each checking #rsoCard against
 hudKeepOut() for zero overlap — the measurement is already done (card-fit.json), the gate keeps it true.

════════ 6 · TIMES — CHECKED, ACCURATE, NO CHANGE OWED ════════
 exposure by count 1→5.05 s · 2→8.05 · 3→12.00 · 4→16.00 (EXPOSURE_BY_COUNT 5/8/12/16) ✓
 between engagements 3.05 s (ENG_GAP_S 3) ✓   magazine change 10.00 s (PHASE_GAP_S 10) ✓
 whole table 240.3 s measured against 239 s computed (164 s exposure + 14×3 + 3×10 + the 3 s open gap);
 the 1.3 s is 36 transitions of 0.05 s tick slop ✓   40 rounds, 18 engagements, four phases of ten ✓
 The opening adds 9.5 s of commands plus the firer's own two presses before the first exposure.
 Artefacts: scratchpad/asm111/rso/{trace.json, trace-changes.json, table-timing.json, card-fit.json,
 open-state.json, empty-open.json, restart-state.json, 01-open.png, 02-cold-end.png, card-*.png}
```

</details>

---

## 5 · What r.205 does with all of it, and what it does not

**r.205 — the glass tells the truth about every target.** Nine invariants, each with a gate shown red on the r.204 bytes first (`scratchpad/r205/redfirst/redfirst.txt`):

1. A target's colour is its slot's phase — unmarked the stroke, TARGETED amber, APPROVED red, and back to the stroke when the mark ends. One painter: the phase before the mist.
2. A button wears the colour of the box it acts on — APPROVE amber, FIRE red, TARGET the cue colour.
3. The middle of the picture carries targets only; his lane signs stay.
4. An exposure's close downs every plate of its engagement, hit or not; a hit at the buzzer is a hit.
5. The boot self-check borrows the range and gives it back exactly as it found it.
6. A press is judged on the target under the bullseye before anything is judged on the mark behind it, and a refusal about one target ends that target's box and no other.
7. An empty magazine darkens FIRE and nothing else.
8. With nothing under the bullseye the glass names no plate at all.
9. The MAP has no bullseye, so the current mark stands there.

Rows: `SILHOUETTE_COLOUR_IS_THE_PHASE`, `BUTTON_WEARS_ITS_TARGETS_COLOUR`, `NO_WORDS_ON_THE_STAGE`, `A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON`, `FALL_ENDS_WITH_THE_WINDOW`; `LABELS_ONLY_WHILE_MARKED` retired with the captions and `CAPTIONS_CLEAR_OF_THE_CONTROLS` narrowed to `BOARDS_CLEAR_OF_THE_CONTROLS`.

**Not in r.205, said plainly:**

| owed | why it waits | where |
|---|---|---|
| The range officer's commands at the START of the table, and the light green while the range is hot | his newest explicit ask, and one class of its own — the officer's commands are what take a line from cold to hot | **r.206** |
| TRAIN DOWN's clock over-reads 0.42–0.50 s and truncates with `floor()` | the same revision as the light | r.206 |
| CLASS 1e — in a LIVE room the whole r.204/r.205 reading is gated off by `marksPersist()` | a room-wide change, its own revision | r.207 |
| The ring around a red where no button lights; a nearer plate stealing the mark from the plate the bullseye is on | one rule for "the bullseye is on it" | r.207 |
| A runtime row for the boot self-check's restore | it runs once, before the rows exist | owed |
| The Capitol pop and drone expiries still call `releaseAuthority` | another scene, not the range | owed |
| R-CORE in the shared format; the 42-lane team drill | as listed | later |

**Credits.** Sensor Fusion works and was built with the Grok bot.
