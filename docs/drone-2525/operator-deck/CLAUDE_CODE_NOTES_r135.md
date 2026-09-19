# CLAUDE_CODE_NOTES r.135 — the fold of the fleet's second (adversarial) reviewers (2026-09-19, autonomous)

HEAD `drone-2525_r.135.html` · sha256 in `HASHES_r135.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.134 by `patches/r134_to_r135.py` (63 asserted exact-anchor edits, paths relative to the patch; a miss refuses).
Records: `docs/assessments/2026-09-19_r133_fleet48_review.md` (12 lenses × A on r.133, B on the r.134 candidate, synthesis, MoT).

## What a player meets differently in r.135
1. **The panel is alive again.** r.134's HUD split had left the frame tail uncalled: the CIL/HIL/SIL/COM stats, the HAL stream
   ladder, the MoT stamp and bloom were dead every frame. Called again.
2. **Two phones keep one record through a lapse.** One lapse clock per room: the host's LAPSE row travels and the joiner books it;
   in r.134 both phones wrote a row for one exposure and the records diverged from the first unengaged plate.
3. **A lost link stays lost until the other seat is really back.** Only DIRECT traffic feeds the heartbeat and only its own HELLO
   revives a DROPPED link ("THE OTHER SEAT IS BACK"). r.134 rewrote DIRECT on the next message.
4. **Nothing fires outside a round.** Press PRACTICE or START first; the seat that marked it fires (the approver's seat cannot fire
   the marker's box); a door tag needs a red box; a target that went away scores nothing; a row from the wire is never an AI
   passport; at CH5 a miss goes back to amber so the other seat can approve again; a withdrawn approval demotes the shooter's red.
5. **The record says who and why.** RESET rows carry why/mode/rounds; the AI's shot is the AI's decision (`role AI`); a human's
   approval of the AI's mark reads `HI OVER AI` on state, row, wire and toast; in a room the AI's mark still needs the other seat;
   the AI never fires a qualification round.
6. **Words.** "MARKED BY THE AI / THE OTHER SEAT", "150 M RIGHT" — no session id or plate id reaches the player; one amber sentence
   ("NOW PRESS APPROVE" / "WAIT FOR THE OTHER SEAT TO APPROVE"); "APPROVED BY YOU · NOW PRESS FIRE"; a lapse names the gap; FIRE
   after a lapse says the lapse; a mode change asks like RESET and carries the mode to the peer; the join refusal travels; a spoken
   command is the whole utterance; the desk keyboard works after a dropdown; the view button follows a reset; skew, not rtt.

## Gates
In-file QA 116 rows (115/116 headless; `SYNC_DIRECT` by design). `VOICE_NEGATION_HOLDS`, `MAP_KEEPS_THE_STRIP`, `ASM_NEVER_MARKS_DEAD`
are behaviour rows; `ASM_MARKED_BY_THE_LOOP` is written by the frame loop itself (silent, neutral); five fire-gate rows
(`NO_FIRE_BEFORE_THE_ROUND`, `APPROVER_SEAT_NEVER_FIRES`, `EXPIRED_TARGET_SCORES_NOTHING`, `AI_PASSPORT_NEVER_FROM_A_ROW`,
`CH5_MISS_GOES_BACK_TO_AMBER`). Repo: drone-playable 46 · drone-deck-qa 12 · drone-team-e2e 9 · deck-consistency 9 ·
drone-revisions 52 · range-2525 71. Replays: team 3/3 with the joiner's tally; AI FIRE 3/3; QUAL·40 at 320 px 5/5.

## Corrections on the record
r.134's "RESET and a mode change ask before discarding" — only the button asked; r.134's "one revision string" overclaimed; the
r.134 artefact-alone commit was a state test:ci rejects until the ship commit followed.

## Owed (honest) — r.136 first items
1. The canonical range clock (an EXPOSE row from the host; a peer's plate can still be down where it is up on the shooter's).
2. Re-reduce from the sorted log; never mint a sessionSeq on a JOIN whose channel is down.
3. Per-peer liveness and one pc/dc per peer before 3v3.
4. SSSES retired until each pillar is measured; rtt echoed on one clock.
5. The word gate and `?diag=1`; the dock FIRE under the R-HEAD stick at 320/390; wall-clock QUAL tables; SAVE as one download;
   patch replay in CI.
