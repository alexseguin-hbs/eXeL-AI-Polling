# CLAUDE_CODE_NOTES_r154 — the QUAL · 40 clock counts real seconds; 10 s between positions (2026-10-04)

## Operator ask
> make sure times for multiple targets on qual40 are accurate
>
> (confirmation) depending on number of targets, you get kore time.  3-4 seconds per target. fine qual

`docs/asks/2026.10.04_03.56..35_drone2525_qual40_exposure_times.md` (persisted with the measured finding before any code).

## What a player meets differently
On a slow phone (below 20 frames a second) the QUAL · 40 targets now stay up for exactly their program time — 5 s for one,
8 s for two, 12 s for three, 16 s for four — and the tower rests exactly 3 s between engagements. Before, a slow phone
stretched every window: at ~160 ms frames a 5 s exposure lasted 16.58 s. Between positions (the magazine change and the
move) the tower now rests 10 s, the sourced value, instead of 9 s. At a normal frame rate nothing visible changes except
the 10 s rest.

## The defect, measured on the served r.153
- The frame loop caps every step at 50 ms: `const dt=Math.min(.05,(now-last)/1000)`. `rangeTick` runs inside
  `phys(dt) → spawn(dt)` (`if(+state.challenge===0) rangeTick(dt);`) on that capped step.
- So below 20 fps the range clock ran slower than real time: the exposure windows, the 3 s engagement gap, the phase gap
  and the TRAINING · RESET 3 s return all stretched.
- 60 fps, lane 21: engagement 1 = 5.02 s, engagement 4 (3 up) = 12.02 s, engagement 5 (4 up) = 16.02 s, gaps 3.02 s, phase
  gap 9.02 s — accurate. ~120 ms frames (8 fps): first gap 7.57 s, engagement 1 12.53 s.

## What changed (`patches/r153_to_r154.py`, 8 asserted edits; a miss REFUSES)
1. `function rangeDt(ms){ return Math.max(0,Math.min(0.25,(ms||0)/1000)); }` beside the range constants: the range clock
   counts wall time, capped at 0.25 s per frame so a backgrounded tab cannot skip an engagement.
2. `loop(now)` takes the raw elapsed BEFORE `last=now` (`state.rangeDtNow=rangeDt(now-last)`) and clears it after its own
   `phys(dt)` call, so the QA's and the STEP button's synthetic `phys(dt)` calls keep their own step.
3. `spawn`: `rangeTick(state.rangeDtNow!=null?state.rangeDtNow:dt)`. Every other `rangeTick` caller (the QA rows'
   `rangeTick(0.05)`) is unchanged. Physics keeps its 50 ms step.
4. `PHASE_GAP_S` 9 → **10** — the "ten second transition delay to allow the shooter time to reload and assume the next
   position" (iwtsexplained.com/table-vi; the 2019 Infantry magazine, via search results; the operator's "~8–10 s").
   `QUAL_EXPOSURE_BY_COUNT` now holds `PHASE_GAP_S===10` (it allowed 8–10 around the declared 9).
5. Boot-QA row **`QUAL_CLOCK_IS_WALL_TIME`**: `rangeDt(160)===0.16 && rangeDt(5000)===0.25 && rangeDt(-5)===0`, the loop
   source carries `rangeDtNow`, and the function that calls `rangeTick` (`spawn`, which `phys` calls) carries it too.
6. Revision stamps `0.153` → `0.154`.

The exposure values are unchanged: the operator confirmed "3-4 seconds per target. fine qual", and 5/8/12/16 s is 5, then 4
per target.

## Gates
- `frontend/tests/deck-qa-manifest.mjs` gains `QUAL_CLOCK_IS_WALL_TIME` (178 rows); `scripts/drone-deck-qa.mjs` holds its note
  (`rangeDt 160ms→0.16 · 5000ms→0.25 · -5ms→0 · loop+phys use wall dt (true/true)`). 177/178 in portrait and landscape
  (SYNC_DIRECT, red by construction on one device).
- `scripts/drone-range-all-lanes.mjs` gains a timing check on lane 21 driven by the real frame loop, once at normal frames and
  once with every `requestAnimationFrame` callback slowed by a 120 ms busy-wait: the first 3 s gap and engagement 1 (5 s),
  measured with `performance.now()`, must each land within ±0.35 s. It waits out the deck's deferred boot rows first (they
  reset the range at 1.5–1.9 s). r.153 bytes FAIL (slow: 7.57 s / 12.53 s); r.154 PASSES (slow: 3.10 s / 5.09 s; normal:
  3.00 s / 5.00 s).
- `drone-playable` and `range-2525` re-pointed from `rangeTick(dt)` to the wall-step call; `range-2525` lifts `rangeDt` and
  proves it (160 ms → 0.16 s, 5 s → 0.25 s, −5 ms → 0) and the 10 s phase gap.

## Record
- `HASHES_r154.sha256` (deck sha `ccb4fe73…`, 370,119 B, + patch sha); `public/drone-2525/play.html` byte copy.
- `REVISIONS.md` r.154 row (chain `bd180f51…`) + section; README HEAD `drone-2525_r.154.html`; `deck-rev.ts` +
  `tests/deck-head.mjs` DECK_REV `154`.
- Domain JSON `project.revision` 0.039; release 0.039 (r.154) `commit fc0fddf` (artefact) / `shipped PENDING`. Ledger rev 49
  (r.154) `shipped PENDING`. `domain.gen.ts`, CRS / README / ASSUMPTIONS and the foil exports regenerated (stamp 0.039).
