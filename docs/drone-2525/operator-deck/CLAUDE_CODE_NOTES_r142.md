# CLAUDE_CODE_NOTES r.142 — reload by hand on QUAL, the same order as the actual test (2026-09-23)

HEAD `drone-2525_r.142.html` · sha256 in `HASHES_r142.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.141 by `patches/r141_to_r142.py` (12 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_qual_reload_fixed_order.md`.

## What a player meets differently in r.142
1. **You reload.** Each phase is ten targets on one ten-round magazine. When the phase ends the tower rests nine seconds and says
   "PHASE 2 · PRONE SUPPORTED · PRESS RELOAD · MOVE". Press RELOAD at the top of the picture; if you fire without, the shot is refused
   "EMPTY · PRESS RELOAD". Four magazines only — a fifth RELOAD is refused, as on the range.
2. **The same order, every time, on every lane.** Engagement 1 is the 50 R, 2 the 100 centre, 3 the 150 left, 4 the 50 L + 150 R + 200 L,
   5 the 150 L + 200 R + 250 + 300 … the full table is in the research doc. Memorise it the way the real one is memorised.

## Invariants (in the deck)
The program names its silhouettes and is the same on every lane; each phase is exactly ten targets; a shot needs a round and only the
shooter loads one; four magazines in QUAL · 40.

## Gates
In-file QA **143 rows**, **142/143 in portrait and landscape**. New: `QUAL_SAME_ORDER_EVERY_LANE`, `PHASE_NEEDS_RELOAD`, `QUAL_FOUR_MAGS`.
Retired: `QUAL_LANES_DIFFER`, `PHASE_CHANGES_MAG`. Repo: `range-2525` 108 (one order across 42 lanes; ten a phase; the counts), `drone-playable`
78, `drone-deck-qa` 34, `drone-team-e2e` 9/9. Replayed: ten hits on ten rounds → rest → refused on empty → RELOAD → fires.

## Decision on the record
r.137's per-lane seed ("each lane has pop ups at various distances") is retired at the operator's word: one order, memorisable.

## Owed (honest)
Engagements 15–18 and the left/centre/right assignment are declared, not read from a range computer file. Everything r.141 owed.
