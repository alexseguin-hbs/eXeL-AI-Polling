# CLAUDE_CODE_NOTES r.149 — a box only around the marked target (2026-09-23)

HEAD `drone-2525_r.149.html` · sha256 in `HASHES_r149.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.148 by `patches/r148_to_r149.py` (6 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_edge_markers_only_when_targeted.md`.

## What a player meets differently in r.149
The silhouettes stand clean — no corner brackets. Press TARGET and the one you marked gets an amber box (and, in the 3D picture, an amber
wire box around it in the world); press APPROVE and both turn red. Nothing else on the range is boxed. The bullseye still goes red when
it sits on a target.

## The three modes, in the operator's words
TRAINING · RESET: targets go down and pop back up. TRAINING · DOWN: a hit target stays down. QUAL · 40: the engagement's group of targets
rises together and a hit one stays down for its window (a lifter rises again only for a later engagement that names it).

## Gates
In-file QA **163 rows**, **162/163 in portrait and landscape**. New: `VOXEL_BOX_FOLLOWS_THE_MARK`, `NO_BRACKET_UNLESS_TARGETED`.
Repo: `drone-playable` 91, `drone-deck-qa` 34, `drone-team-e2e` 9/9.

## Owed (honest)
The fleet's r.149 order (FIRE_SAYS_WHERE, the gate door, commit(), the word gate, refusals as rows, …) is not in this revision — this one
answers the operator's morning ask alone; it carries to r.150.
