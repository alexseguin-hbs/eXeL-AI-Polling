# CLAUDE_CODE_NOTES r.150 — the fire gate reads the picture (2026-09-24)

Built by `patches/r149_to_r150.py` (27 asserted edits; a miss refuses) from r.149. Ask: the operator's 2026-09-23 line "fix all AsM
identified issues" (`docs/asks/2026-09-23_drs_bu_sbu_alpha_needs.md`), executed in MoT 1's order from the 48-agent fleet on r.147
(`docs/assessments/2026-09-23_r147_fleet48_review.md`). r.150 is items 1–4 of that order: FIRE with the ring off the red box; the
door the gates run on; commit() tags with no red box; approve of a corpse.

## Invariant, in the player's words
**A round or a tag is spent only on a red box the bullseye is on.** Every path that spends — FIRE, key, double-tap, Enter, YES, the AI —
passes the same gate; the gate's refusal costs nothing, keeps the box red, writes one row, and says where the box is. The amber → red
two-step is untouched: this is a third question, asked after red.

## What a player meets differently in r.150
- **FIRE says where.** Red box on the 50 L, bullseye on the 150 R, FIRE → `YOUR RED BOX IS ON THE 50 M LEFT · YOUR BULLSEYE IS NOT · PUT IT
  ON IT`. No round spent, the box still red, one REJECT `TARGET_OFF_PICTURE` row. (r.149 spent the round, said MISS, and never named the
  box.) Plates use the one hold rule (outline + 8 px); every other kind the 32 px the hit test uses. The MAP view has no picture and
  cannot fire (`via MAP`).
- **A miss still costs a round** — when the bullseye is on the box's edge, inside the hold rule, and the shot lands outside the silhouette.
  Two pulls on a held red write two MISS rows and no new APPROVE (N pulls per approval, one row per pull: the F1 default).
- **A tag needs a red box under the bullseye.** Enter or YES on a peer's request with nothing marked scored +250 and wrote SIM-ACTION + TAG;
  now `REJECT TAG_NEEDS_RED_BOX`, score unchanged, the request cleared. A pending request dies with RESET, RELEASE and a closed round.
- **No approval on a dead plate, whoever marked it** — the button and the wire path both HOLD `TARGET_DOWN` (r.149 skipped the check
  for a peer's mark).
- **The approver looks at a peer's mark from any seat** — quad and VTOL too, not only the turret; never when the AI marked (the AI moves
  no seated head, r.148).
- **The AI re-arms on a reload** (it stayed silent after EMPTY_MAGAZINE with the box still red) and **reads the HIT for 1.4 s** before it
  marks again (`ASM_READ_S`; r.148's 1.2 s was under the toast minimum the fleet's gates ask). The dead `!state.hiLock` guard is gone —
  nothing ever set it.
- **A hand-set red of some other kind at CH0 no longer shoots the bull** (`REJECT NOT_A_RANGE_TARGET`).
- **The deck's own SSSES row is gone** — it could not fail. The scorer in `scripts/drone-spiral9.mjs` measures or says UNMEASURED.

## Gates — each row states what it watched
In-file QA rows (boot, no simDirect), each with a note regex in `scripts/drone-deck-qa.mjs` so a predicate replaced by `true` cannot pass:
`FIRE_SAYS_WHERE` · `FIRE_ON_THE_BOX_STILL_HITS` · `FIRE_FROM_MAP_REFUSED` · `ONE_ROW_PER_PULL` · `TAG_NEEDS_RED_BOX` ·
`PENDING_DIES_WITH_THE_SCENE` · `PEER_APPROVE_OF_A_DEAD_PLATE_REFUSED` · `APPROVE_LOOKS_AT_THE_MARK` · `AI_MARK_NEVER_TURNS_THE_SEAT` ·
`AI_RESUMES_AFTER_RELOAD` · `FORGED_RED_NEVER_HITS_THE_RING` · `KEY1_REFUSES_THE_GRASS` · `TARGET_BUTTON_FOLLOWS_THE_EYE` (deferred: it
clicks the real TARGET button once its handler is wired). `ASM_MARKED_BY_THE_LOOP` says NOT EXERCISED in red, never green, when the
round started first; `DRAW_COMPLETES` decides on three frames and the render-error COUNT. 175 rows, 174/175 in portrait and landscape
(SYNC_DIRECT red by construction).

## Corrections, on the record
- `RANGE_MISS_300_OFF20` (r.130): 20 px beside a 300 m plate is now a refusal that spends nothing, not a MISS that spends a round.
- `QUAL_ONE_ROUND_PER_TARGET` (r.131), `EMPTY_MAG_REFUSES` (r.138), `CH5_MISS_GOES_BACK_TO_AMBER` (r.135): these rows made their MISS
  by firing 80 px or 25° off the plate; under the gate a MISS is aimed 4 px outside the silhouette, inside the hold rule.
- `HIT_CLEARS_SLOT` (r.131): its synthetic kind-obj ring stand-in rode the very hole A21 closes (any non-range kind → BULL-1); the row
  now marks the real ring.

## Owed (honest)
- MoT 1 item 5 (one "under the pip" for LOCK, T1, the bullseye colour, the tap, the sheet, every kind at every zoom) → r.151.
- Items 6–8 (one voice, one layer: plateWord everywhere, the seat sentence, the overprint the operator's screenshot shows) → r.152.
- Items 9–11 (every refusal a signed row, host-only sequence, judged-before-recorded peer rows, sync at one seq, worlds hashed,
  wall-clock fps, the ship door's ledger field) → r.153; 3v3 members → r.154 if the patch passes ~50 edits.
- The picture gate reads the seat's own camera; in a room the marker fires from its own picture, as before. A peer's HIT row still
  reaches my board through the r.148 APPROVE-on-record guard (B5's stale-approve retirement is r.153).
