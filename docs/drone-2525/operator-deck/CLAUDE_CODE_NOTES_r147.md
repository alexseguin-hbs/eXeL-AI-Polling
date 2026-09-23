# CLAUDE_CODE_NOTES r.147 — LOCK is the target nearest the bullseye on the picture (2026-09-23)

HEAD `drone-2525_r.147.html` · sha256 in `HASHES_r147.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.146 by `patches/r146_to_r147.py` (13 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_target_resets_to_50L_fleet_test.md`.

## What a player meets differently in r.147
Put the bullseye near a target and TARGET marks THAT target — the 150 R, the 300, a Capital door — and the head nudges onto it instead of
swinging to the 50 m left plate. With the bullseye on grass or sky, TARGET says NO TARGET UNDER THE BULLSEYE · PUT IT ON ONE. T1 · T2 · T3
(keys, voice) are the three targets nearest the bullseye, nearest first.

## The class
Every lock fallback (plates, rings, buoys, pops, aircraft, foils, doors) chose the nearest in METRES inside a 35° cone, and the turret's
slots took the first three plates in array order. One rule now: `pipRank` (every target on the picture, nearest to the pip first) and
`pipNearest` (the first within `LOCK_REACH_PX` = 48 px, declared). Off the picture is never a candidate.

## Gates
In-file QA **152 rows**, **151/152 in portrait and landscape**. New: `LOCK_IS_NEAREST_TO_THE_PIP`, `TARGET_MARKS_THE_PIP`, `CAP_LOCK_IS_THE_PIP`.
Repo: `range-2525` 115 (pure proofs of the rule), `drone-playable` 89, `drone-deck-qa` 34, `drone-team-e2e` 9/9.

## Corrections on the record
r.131's `RANGE_LOCK_PLATE` and `TARGETN_HITS_THE_EXPOSED_PLATE` passed with the pip on the grass because the nearest-in-metres rule
took the plate anyway; both rows now put the bullseye on or beside the plate.

## Owed (honest)
The AI member's own spotting (nearest in metres from its mount) is unchanged by design. Everything r.146 owed.
