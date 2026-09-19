# CLAUDE_CODE_NOTES r.134 — the fold of team-test wave 3 and the 48-lens fleet review (2026-09-19, autonomous)

HEAD `drone-2525_r.134.html` · sha256 in `HASHES_r134.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.133 by `patches/r133_to_r134.py` (75 asserted exact-anchor edits, paths relative to the patch; a miss refuses).
Records: `docs/assessments/2026-09-19_r132_asm_team_test.md` (38 seats, D1–D22) · `docs/assessments/2026-09-19_r133_fleet48_review.md`
(12 lenses, A/B reviewers, synthesis, coordinators).

## What a player meets differently in r.134
1. **A red box is a live decision, not a stored bit.** Change the scene, press RESET, lose the other seat, or let the target
   go down — the box is released and the record says why. The CH5 popup is gone: at CH5 a spent approval asks for a fresh one.
2. **RESET is on the record.** In a live QUAL·40 table the first press asks ("PRESS RESET AGAIN TO DISCARD n ROUNDS"); the second
   writes one row that the other seat receives too.
3. **The other seat's departure is said.** Twelve silent seconds → `DROPPED · 1p`, one sentence, and their approval goes back to
   amber. Their return is said as well.
4. **VOICE tells the truth.** If the device cannot listen the button reads VOICE and says why; a second press always turns it
   off; "don't approve" is a HOLD.
5. **MAP keeps the strip.** The phase strip and the score follow amber → red → HIT while the map is up.
6. **The AI member is an actor.** Its mark reads `MARKED BY ASM@…`, a human's approval of it reads `HI OVER AI`, its shot is on the
   record in its own name, once per box, never on a plate that is already down.
7. **A stranger sees every refusal** (they were drawn under the intro), reads "NOW PRESS APPROVE" on the first mark, and is told
   when a target lapses in training. The host's card shows the other team's six digits with one sentence.
8. Typing a room code no longer marks a target; a lone spoken "f" no longer fires; HAL/MoT changes say so; REPLAY is under MORE
   on a phone and PLAY plays; the desktop stick leaves the panel; the pip floor is on the HUD line.

## Gates
In-file QA 110 rows (109/110 headless; `SYNC_DIRECT` by design). Repo: `drone-playable` 46 · `range-2525` 71 · `drone-revisions` 46 ·
`deck-consistency` 9 (NEW: one HEAD across register, README, domain JSON, ledger, HASHES, patch) · `drone-deck-qa` 12 ·
`drone-team-e2e` 9 (NEW assertion: the approver's picture; NOW a Deploy step) · `drone-crs` 594 (revision 0.019). Verify Live
compares the served body's sha256 to the register row.

## Corrections on the record (never edited in place)
- r.132's "a Deploy step": the two-phone gate ran in no workflow until r.134.
- D18 (MAP "stops the AI tick and the slew"): `spawn()` runs before the map return; MAP froze the STRIP only.
- CLAUDE_CODE_NOTES_r133 named HEAD `drone-2525_v.00.00_r.133.html`; the carried file is `drone-2525_r.133.html`.

## Owed (honest) — r.135 first items
1. A canonical range clock: the host emits an EXPOSE row when a plate rises; peers raise plates from rows, not from their own dt.
   Until then a peer's mark is judged on the marker's device.
2. Re-reduce from the sorted log (arrival order vs sorted hash); never mint a sessionSeq on a JOIN.
3. The word gate and the operator door (`?diag=1`): the DATA panel is still the machine's panel; `HI-2`, `PEER`, `TI PRONE SUP`,
   plate ids and SIDs still reach the player.
4. SSSES pillars other than efficiency are labels; retire the displayed score until each pillar is measured.
5. QUAL clocks on wall time with a HIDDEN row; the dock FIRE under the R-HEAD stick; SAVE as one download.
