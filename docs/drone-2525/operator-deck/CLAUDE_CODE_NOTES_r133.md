# CLAUDE_CODE_NOTES r.133 — the 38-AsM team-test fold (2026-09-19, autonomous while the operator slept)

HEAD `drone-2525_v.00.00_r.133.html` · sha256 in `HASHES_r133.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.132 by `patches/r132_to_r133.py` (43 asserted exact-anchor edits; a miss refuses). Findings that drove it:
`docs/assessments/2026-09-19_r132_asm_team_test.md` (26 seats played the served r.132 by clicks and keys through
`frontend/scripts/asm-play.mjs`; every seat reported SAW / MISREAD / WHAT ELSE CAN FAIL).

## What a player meets differently in r.133
1. **The AI member works.** `AsM OFF` is the default; press once → `AsM SPOT` (the AI marks the exposed silhouette, you approve and
   fire — your head turns to its mark); press again → `AsM FIRE` (the AI fires only after YOUR approve, once per box, through the
   same fire path as your finger). In r.132 the AI member was dead code: its tick was never called from the live loop, and its
   FIRE branch would have downed an amber target with no approval and no record.
2. **You can read the score on a phone.** The top strip wraps; HIT/MISS/LAPSED, the QUAL table + clock + TOTAL, and `ALL DOWN ·
   PRESS RESET` are on screen at 320–390 px. The score is written the moment a hit, miss or lapse lands.
3. **The approver sees the outcome.** After the shooter's HIT the other seat's strip counts it, its red box goes down with the
   target, and it reads `THE OTHER SEAT HIT · <id>`; a refusal reads `THE OTHER SEAT · REJECT · NO RED BOX`.
4. **TARGET aims as well as marks** (key 1 already did); a peer's mark turns your head to it.
5. Nothing lapses before you may fire (the intro and the waiting room no longer charge lapses). One sentence when nothing is up.
   A refusal names the next action. `DOWN` (not `DOWN DIRECT`), `HIT · IN THE AIMING CIRCLE`, `SCEN · RANGE 50-300 M`, `TEAM SECRETS`.
6. Desktop: the panel sits in its own strip to the right of the picture.

## Gates
In-file QA 100 rows (99/100 headless; `SYNC_DIRECT` by design on one device). Repo: `drone-playable` 46, `range-2525` 71,
`drone-revisions` 40, `drone-deck-qa` 12 (set-equality manifest), `drone-team-e2e` 8 (two contexts over WebRTC, one hash).
Replays on the served r.133 by the seat harness: AI seat 3/3 · team seat 2/2 with the joiner's tally 2 and the box cleared ·
solo 360 px 10/10 with the full score visible.

## Owed (honest)
- Per-device range clock between peers (r.132 note stands).
- The joiner's qualification tables do not move from remote hits (the peer tally covers HIT/MISS/LAPSED).
- The unaided join: the RED code is shown nowhere (`ROOM_PRIVATE_CODES`) — the operator's decision to keep or open.
- The in-round CH picker lets a solo player reach CH1 after entering at CH0.
- 320 px: the reticle sits on the APPROVE pill. Desktop: the panel's lower 2300 px need a scroll cue.
- Wave 3 of the team test (12 seats) and the 48-AsM fleet review of the whole.
