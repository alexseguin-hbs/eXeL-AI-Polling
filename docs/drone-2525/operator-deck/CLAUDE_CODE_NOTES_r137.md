# CLAUDE_CODE_NOTES r.137 — the range the operator described (2026-09-23, autonomous after plan review)

HEAD `drone-2525_r.137.html` · sha256 in `HASHES_r137.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.136 by `patches/r136_to_r137.py` (30 asserted exact-anchor edits, paths relative to the patch; a miss refuses).
Ask: `docs/asks/2026-09-23_range_modes_iwq_table_vi.md` (verbatim, hashed). Program of record: `docs/drone-2525/RANGE_QUALIFICATION_RESEARCH.md`.

## What a player meets differently in r.137
1. **TRAINING · RESET — every target is up.** Eleven silhouettes stand from the start; a hit target falls and comes back after 3 s.
   No exposure clock, so nothing ever "lapses" in training and the strip no longer counts LAPSED.
2. **TRAINING · DOWN — every target is up; a hit one stays down** until RESET. With all eleven down the strip says ALL DOWN · PRESS RESET.
3. **QUAL · 40 is the Army IWQ Table VI 40-round day fire.** The tower raises each engagement's targets TOGETHER — singles, doubles,
   triples and quads — for 5 / 8 / 12 / 16 s by count, rests 3 s between engagements and 9 s between the four phases ("MAG CHANGE ·
   MOVE"), one round per silhouette, a target not engaged in its window is an unfired miss, exactly 40 targets, the 50 R standing shot
   first. The strip reads `PHASE 1 · ENG 5/18 · 4 UP · 16 S · HIT 3/6`. Engagements 15–18 are DECLARED (the operator: they differ by
   range computer file). The three 20/10/10 tables, their 142/75/75 s clocks and the per-plate scoring caps are gone.
4. **The 50 m targets are left and right.** `C-50L` joins `C-50` (the 50 R). Eleven silhouettes.
5. **Words.** Mode toast: "EVERY TARGET IS UP · A HIT TARGET COMES BACK / STAYS DOWN"; "IWQ TABLE VI · 40 TARGETS · 18 ENGAGEMENTS";
   "NOT ENGAGED · 150 M LEFT · UNFIRED MISS · 3/7"; "ONE ROUND PER TARGET"; "PHASE 2 · PRONE SUPPORTED · MAG CHANGE · MOVE".

## Invariant (written into the deck)
In training every target stands until it is hit; a hit target returns (RESET) or stays down (DOWN). In qualification the tower raises the
engagement's targets together for their window, one round counts per silhouette, an unengaged target is a miss, and the whole test is
exactly forty targets in the order the program says. The fire gate, the record and the room's one lapse clock do not change.

## Gates
In-file QA **124 rows**, headless **123/124** (`SYNC_DIRECT` by design). New: `IWQ_PROGRAM_IS_40`, `QUAL_EXPOSURE_BY_COUNT`,
`QUAL_50R_FIRST`, `QUAL_LANES_DIFFER`, `TRAIN_ALL_UP`, `TRAIN_NO_LAPSE`, `MODE_DOWN_ALL_DOWN`, `QUAL_ENG_TOGETHER`,
`QUAL_UNENGAGED_IS_MISS`, `QUAL_PHASE_GAP`, `QUAL_PHASE_2_STARTS`, `QUAL_IS_40_ROUNDS`, `QUAL_ONE_ROUND_PER_TARGET`. Retired:
`QUAL40_TABLES`, `QUAL40_CAP_III`, `RANGE_POP_SCHEDULE`, `MODE_QUAL_TIMED`, `ONE_ROUND_PER_EXPOSURE`, `TABLE_III_EXPOSES_ONLY_SCORABLE`.
Repo: `range-2525` rewritten to lift `IWQ_VI` / `engagementAt` (96 checks: the counts, 1–14 verbatim, windows by count, the 50 R first,
per-lane determinism, lanes differ, the program ends), `drone-playable`, `deck-qa` manifest 124, `drone-team-e2e` 9/9, seat replays
solo 4/4 · qual 6/6 · AI FIRE 3/3.

## Corrections on the record
r.130's "exposure 3 s at 50 m, +1 s per 50 m" and "tables I/II/III = 20/10/10" were DECLARED from a search index (the research doc said
so); the operator's program of record replaces them. r.131's per-plate scoring caps had no doctrine source and are retired.

## Owed (honest)
The r.137 items from the fleet stand (canonical range clock, authorship law, word gate, `?diag=1`, dock FIRE under the stick, SAVE as
one download, patch replay in CI, two real phones). New from this edition: engagements 15–18 confirmed against a real lane program;
whether "near to far" should be scored; a quad on a phone within 16 s (mark → approve → fire ×4) is a thumb test only hardware can run.
