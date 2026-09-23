# CLAUDE_CODE_NOTES r.146 — deferred QA rows decide on evidence, not the runner's clock (2026-09-23)

HEAD `drone-2525_r.146.html` · sha256 in `HASHES_r146.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.145 by `patches/r145_to_r146.py` (5 asserted exact-anchor edits). Cause: Deploy #950 red on `DRAW_COMPLETES` (146/148 in portrait on a cold runner).

## What a player meets differently in r.146
Nothing on the range. The boot QA's two deferred rows wait for what they measure instead of a stopwatch, so a slow phone reads the same
verdict as a fast one — later, not wrong.

## The class (fix the class, never the instance)
A fixed timer is a runner-speed claim. `DRAW_COMPLETES` (1.5 s) and `ASM_MARKED_BY_THE_LOOP` (700 ms) now poll for their evidence — a completed
frame or a render exception; the loop's own mark — and decide when it lands, up to `DRAW_ROW_CEIL_MS` 20 s / `ASM_ROW_CEIL_MS` 5 s, the one
declared failure clock each. The note says how long the evidence took.

## Proof
Served r.146 under a 30× CPU throttle (CDP): `DRAW_COMPLETES` OK after 3812 ms (the old timer would have said NO), `ASM_MARKED_BY_THE_LOOP` OK
after 183 ms, 148/149 · at 1×: 103 ms / 50 ms. Probe kept beside the deck-qa gate's comment.

## Gates
In-file QA **149 rows**, **148/149 in portrait and landscape**. Repo: `drone-playable` 88 (`DRAW_ROW_CEIL_MS`, no 1.5 s / 700 ms timer),
`drone-deck-qa` 34, `range-2525` 111, `drone-team-e2e` 9/9.

## Correction on the record
r.130's `DRAW_COMPLETES` measured a frame within 1.5 s of boot (the runner), not the loop running to its last line. r.141's gate fix (Deploy #939)
treated the class at the gate only.

## Owed (honest)
Everything r.145 owed.
