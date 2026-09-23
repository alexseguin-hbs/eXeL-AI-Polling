# CLAUDE_CODE_NOTES r.148 — the eye outranks the mark (2026-09-23)

HEAD `drone-2525_r.148.html` · sha256 in `HASHES_r148.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.147 by `patches/r147_to_r148.py` (23 asserted exact-anchor edits). Source: the 48-agent fleet on r.147
(`docs/assessments/2026-09-23_r147_fleet48_review.md`), answering the operator's "target approve and fire keeps resetting to 50 m left target".

## What a player meets differently in r.148
Once you have marked something, TARGET still marks what the bullseye is on — the old mark lets go (on the record) and the head nudges
onto the new target instead of swinging back. Pressing TARGET on your own red box keeps it red. With the AI on, it marks the plate under
YOUR bullseye when one is there, says "NOT UNDER YOUR BULLSEYE" when it had to pick by distance, never turns your head, and gives you
1.2 s to read HIT before it marks again. Keys 2 and 3 refuse beyond reach like key 1. The board no longer prints over the strip.

## The class
One hold rule (`pipOn`), one door (`markLock`), one pool with the pip distance on every craft, the AI through the same pipRank,
NONE on a boxless FIRE, the wire's APPROVE author from the envelope and a peer HIT needing red on this record.

## Gates
In-file QA **161 rows**, **160/161 in portrait and landscape** (nine new). Repo: `drone-playable` 90, `drone-deck-qa` 34, `drone-team-e2e` 9/9,
seat replays solo / qual / ai / team.

## Correction on the record
r.147's rule ran only on an empty board and its gate cleared the board before it looked. Recorded in `REVISIONS.md` §r.148.

## Owed (honest) — r.149 candidates named by the fleet
FIRE_SAYS_WHERE · the word gate · refusals as rows · commit() and blind approval · the sheet's under-pip pass · false DIVERGED ·
state.fps clamp · SSSES provenance · predicate gates for the button and the ASM row · the AI signing every row · the deploy door.
