# CLAUDE_CODE_NOTES r.136 — the fold of the 48-agent fleet's synthesis (2026-09-19, autonomous)

HEAD `drone-2525_r.136.html` · sha256 in `HASHES_r136.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.135 by `patches/r135_to_r136.py` (8 asserted exact-anchor edits, paths relative to the patch; a miss refuses).
Records: `docs/assessments/2026-09-19_r133_fleet48_review.md` (12 lenses × A on r.133, B on the r.134 candidate, the twelve
syntheses over r.135, the twelve MoT answers).

## What a player meets differently in r.136
1. **The AI's mark in a room can be fired.** r.135 refused FIRE when the mark's author was not this seat — and the AI signs as
   `ASM@<seat>`, so an AI mark approved by the other phone could be fired by nobody. Three syntheses (Thor, Asar, Christo) found
   it independently. The marker's seat is now the human or its own AI (`by` stripped of `ASM@`).
2. **The approver's phone tells the truth.** It read "NOW PRESS FIRE" on a button that refuses it; it now reads "THE OTHER SEAT
   FIRES".
3. **A partner's release reaches the shooter.** AUTHORITY_RELEASED and TARGET_DOWN rows from the other seat demote my red box the
   way APPROVER_LOST already did; no red box crosses from the waiting room into LIVE; an expired drone takes its box with it.

## Gates
In-file QA **117 rows**, headless **116/117** (`SYNC_DIRECT` by design). New: `AI_MARK_FIRES_IN_A_ROOM` (own seat held for two
humans, the other seat approves, the owning seat fires, the box clears). Two rows now assert what they name: `MAP_KEEPS_THE_STRIP`
clears the strip before the map step and demands the plate it marked; `LOST_APPROVER_IS_SAID` demands the sentence. Repo:
drone-revisions 58 · deck-consistency 9 · drone-playable 46 · range-2525 71 · drone-deck-qa 12 (116/117) · drone-team-e2e 9.

## Corrections on the record
None of r.135's claims are withdrawn; r.135's "the seat that marked it fires" was true for a human and false for the AI, which is
the regression closed above.

## Owed (honest) — r.137 first items, from the syntheses and the MoT coordinators
1. Canonical range clock (an EXPOSE row from the host); never mint a sessionSeq on a JOIN whose channel is down; SNAPSHOT merges
   pending rows; re-reduce from the sorted log.
2. Every host row (QUAL, SIM-ACTION) on the wire; SPENT / TARGET DOWN as REJECT rows; fireN refuses a PEER red whose approver has
   been silent longer than one exposure.
3. The join code selects the team; the refusal reaches the joiner before the wire.
4. Authorship law on every row: `actor` (`<sid>` | `ASM@<sid>` | `CLOCK` | `LINK` | `HOST`) and `seat`, with `role` derived from
   `actor` only — today `role` is the mode flag `state.pilot`.
5. SSSES retired until measured; rtt on one clock and one sign; the 13 fn.toString rows paired with behaviour rows under a budget
   that only ratchets down; `roundOpen()`'s `qaArmed` backdoor removed.
6. The word gate and `?diag=1`; the SELECT screens honour the solo path ("PLAY NOW · ALONE"); the intro in the range's words;
   "YOUR TARGET LAPSED" only for the player's own mark.
7. The dock FIRE under the R-HEAD stick at 320/390 and a bottom-stack disjointness gate; wall-clock QUAL tables; SAVE as one
   download; patch replay in CI; two real phones (the operator's script is in the assessment).
