# Claude Code notes — Drone-2525 operator deck r.207 (2026-10-13)

**His words, 2026-10-13, verbatim.** On the LIVE r.206: *"Awesome; seems like we have fixed The Range."* Asked which revision he wanted first: **"The leftovers first"** (DD-22). Asked what should give way on the clipped lane signs: **"Shrink them at the edge"** (DD-21). Both are in `docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md`, persisted alone before this code.

The targeting *is* fixed — r.204 → r.205 → r.206 did that, and he can see it. **Two of the three things in this revision are mine, not his:** a button r.206 made dark that still acted, and a regression r.206 introduced. They are named here rather than left for him to find.

## Found first — measured on the shipped r.206 bytes before a line was written

`scratchpad/r207/behave.mjs`, 390×844, 43 pan steps (0.01° each) off the mark so the bullseye is 8.22 px clear of the outline:

| | r.206 (shipped) | r.207 |
|---|---|---|
| **a dark APPROVE, pressed through `#fAppr`'s own handler** | lit `none`, strip `AMBER · T1 · 200 M RIGHT · AIM ON IT` — and the mark turns **red**, books `APPROVE SOLO HI-2` into `state.decisions` *and* `state.events`, toast `RED BOX · 200 M RIGHT · APPROVED BY YOU · NOW PRESS FIRE` | mark stays **amber**, books `HOLD NOT_ON_IT`, toast `200 M RIGHT · AIM ON IT` |
| **FIRE at the identical geometry** (the contrast) | refused `TARGET_OFF_PICTURE`, magazine 30 → 30 | unchanged — it has refused this since r.141 |
| **a step toast, then one real MAP frame, then back** | `block` → **`none`** → **`none`**, and `toast._plate` cleared so it can never return | `block` → `block` → `block`, the plate kept |
| **`dropMark`, after marking and approving** | `mist:true`, **1 orphan** wearing a colour with no mark | `mist:false`, 0 orphans |

The map one is a **regression r.206 introduced**: its fix for the frozen lit FIRE sent `phys()`'s map return through `paintCues()` for the first time, and that function's toast block calls `lockOn()`, which r.205 made null on the map — so `under` matched neither `toast._under` nor `toast._plate`, and the block hid the sentence and cleared its plate.

## The fix — the class, not the instance (23 asserted edits)

1. **A dark button does not act — on the range, in solo play.** `approveDesig` takes FIRE's own on-target test, placed **below** the down-guards. **Scope stated rather than implied:** `marksPersist()` and `platesHere()` confine it to the range in solo play; in a challenge and in a LIVE room a dark APPROVE still acts, which is CLASS 1e's ground and is owed with it, not claimed here. **The MAP is exempt** — it has no bullseye to be on, which is `lockOn()`'s own rule and r.206's CLASS 1b; without that exemption the guard contradicts `A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON`'s map leg, and the deck's boot QA proves it (guard alone 231/236; guard + exemption + the aim edits, back to baseline).
2. **A view with no bullseye takes nothing away from him.** One term on the toast block.
3. **Through EVERY door.** `dropMark` ends one target's mark, so it ends that target's colour. r.206 claimed this and closed only `releaseAuthority`.
4. **A lane sign shows its whole number** (DD-21). `boardLabels` judged visibility on the board's **centre** and then drew the box ±half a width, so an edge sign lost its first digit — his shot51. It now shrinks `fs` on its own post until the box is inside the picture, floored at `SIGN_MIN_PX` (9, his own rule); below that it is **not drawn**, because a clipped number and an illegible one are both worse than none. It never moves sideways, so r.159 — a sign stays on its post's line, held to 1 px by this very row — is untouched.

   **What his decision costs him, measured and not glossed.** At his 428×926 the edge signs are **already** at the 9 px floor, so the shrink branch never fires and the fallback is the whole behaviour. Across 161 pan looks: drawn 241 → 222, **clipped 18 → 0, shrunk 0**. He stops seeing half a number, and stops seeing those signs at all — mostly a neighbour lane's, at the very edge. Three of the four review lenses called this out, and they are right that "not drawn" is not "shrunk"; it is, however, the only outcome that keeps both of his rules (legible at ≥ 9 px, and on its own post) when the post is 8.5 px from the edge. The row's note now reports "N shrunk to fit" beside the clipped count, so the record can never claim a shrink while it is deleting. **If he would rather see them:** letting only the outermost sign slide off its post by the overflow, with its post drawn across to it, is one line and r.204's machinery already draws that post — it bends r.159, so it is his to say, and he declined the sliding option when it was put to him as a whole-class change.
5. **Five QA legs, not three — and the two extra were found by the round on this very cut.** The new guard *intercepted* `NO_APPROVE_ON_A_DEAD_TARGET` and `PEER_HIT_TALLIES_AND_CLEARS`, so neither reached the branch it is named for, and **both stayed green at all four viewports** — the exact class this revision exists to close. The dead-target one is answered by the guard's **placement below the two down-guards** ("is the target still there?" before "are you aiming at it?"); the other takes the same one-line aim. Proof that nothing else was disarmed: spying `decide()` through a whole boot self-test, `TARGET_DOWN` stays at **2** and `NOT_MARKED` at **5** on both cuts, and `NOT_ON_IT` appears exactly **once** — the new row's own deliberate press.
6. **The three original QA legs that approved without aiming first now aim**, as a player does: `shootPlate` marks and approves ON the plate and steps the bullseye off only afterwards (which is what its `offPx` callers were always testing); `PHASE_NEEDS_RELOAD` aims before emptying the magazine (its refusal is still `EMPTY_MAGAZINE` — `fireN` checks the magazine above the aim); `AUTHORITY_HAS_ONE_CONSUMER` aims before approving (its subject is that *releasing* a red box writes exactly one HOLD). **No row's subject moves**, and the three edits alone, without the guard, leave the boot QA unchanged.
7. **The restore hole in r.206's own new row.** `ONE_MEANING_OF_UNDER_THE_BULLSEYE` flipped `viewMode` to the map inside its `try` while its `finally` carried nine fields and not that one; a throw there left the boot screen on the one view where nothing can light. `viewMode` joins the saved consts and the `finally`, exactly as its sibling already does.

## Gates — each shown RED on the r.206 bytes first

The four rows inserted into the shipped r.206 bytes with **nothing else changed** (`scratchpad/r207/redfirst/rows`, served at :4813) give **232/237**; the cut gives **236/237** (only `SYNC_DIRECT`, offline):

```
RED  NO_COLOUR_WITHOUT_A_MARK          after dropMark, targets wearing a colour with no mark 1 (100 M CENTRE);
                                       after releaseAuthority, 0 () · boxes drawn 0
RED  ONE_MEANING_OF_UNDER_THE_BULLSEYE …a DARK APPROVE pressed 3.44° off the target leaves the mark red and books APPROVE
RED  THE_MAP_KEEPS_HIS_SENTENCE        a step toast showing on the picture (block), through one real MAP frame
                                       (none, its plate cleared), and back on the picture (none)
RED  LANE_NUMBERS_ON_THE_SIGN          21 looks with a sign against an edge, 8 of them drawn outside the picture (22 23 …)
```

`ONE_MEANING_OF_UNDER_THE_BULLSEYE` now **presses** the dark button — its own comment said "lights AND ACTS" while the row measured only the light. `NO_COLOUR_WITHOUT_A_MARK` opens **both** doors. `LANE_NUMBERS_ON_THE_SIGN` **walks a sign to the edge on purpose**: its four fixed looks produce a clipped sign at 844×390 and 428×926 and none at 390×844, and a row that is red only at some sizes is exactly the green-by-omission the twelve Masters named — it now pans until a sign's post is within a half-width of an edge and says **NOT EXERCISED** if it never finds one.

**The cut is parsed before it is written.** Twice — in r.205 and in r.206 — a patcher wrote a deck that did not parse, and the failure surfaced only when a browser booted it. `r206_to_r207.py` extracts the deck's inline script and hands it to `node --check`, refusing before anything is written.

## Owed — said plainly, in order

- **r.208, his 18:25 and 04:34 words:** the range officer's opening on QUAL 40 ("Load and Make Ready"), and with it the lamp counting him IN to the targets — **DD-23, his own words: "3 red, 2 yellow, 1 green"** — the word under the lamp, which is blank for the whole of a QUAL table today, TRAIN DOWN's clock (it over-reads 0.42–0.50 s and truncates with `floor()`), and a cue for a target that is up but off the picture (15 of 40 appearances at his 428×926).
- **r.209:** the LIVE room's reading (CLASS 1e — `marksPersist()` is false in a room, so the whole r.204→r.207 reading is off there) and his 20:55 twenty-person drill (DD-13f).
- **r.210:** R-CORE in the shared format, owed since his very first ask.
- Carried: the QUAL-40 miss that reaches no record row · a lane post drawn without its board · three times a table the glass says PRESS RELOAD on a magazine just filled · `hudKeepOut` in CSS pixels with no `ResizeObserver` · the lane picker reading LANE 21 on every QR-opened lane · **428×926, the size he holds, is still not a CI viewport** · the 360-px phones red and undeclared · **the two play-throughs are run by nothing in CI** — a `test:drone-play` would have caught the map regression · the DD rows that never reached the ledger or the domain JSON.

Artefact commit `b3d5c18`; the carried deck's sha256 is `dc266e890693ce9daad5aa8b42a310cf8935b695ed23026f1891613b0c35ee8f`.
