# Drone-2525 r.220 — SENTINEL NAMES IT BEFORE FIRE COUNTS (CRS-CL.H01.S, cue only — DD-141) (2026-10-20)

**Artefact commit d498e25 · carried `drone-2525_r.220.html` sha256 c7feede810a709395a7cedc19808c27215aaf1daf75673e4b42ee1370d7e60f5.**

## His words (verbatim)
- The lawn CRS of 2026-10-20, line 26: *"The lawn. The same three drills, one air track, single shot. Sentinel names it before Fire counts."* CRS-CL.04.01: *"No shot before the cue."*
- CRS-CL.H01.S (DD-138/DD-139): *"Introductory. Enki's Spark only. One air track. Sentinel names it before Fire counts. The other eight beats are not in this step. H02, H03, and H04 use this same scene."*
- DD-140: *"execute the Fable generated plan."* DD-141: *"the Sentinel cue on the lawn. One air track. Sentinel names it before Fire counts. A1, S1, and S2 only. H02, H03, and H04 use that same scene. Nothing else in that revision."*

## Invariant
On the lawn no round leaves before the cue names the track; a FIRE pressed before the name is refused in one line and recorded; TARGET and APPROVE are not gated; the cue is a row on the record.

## What changed — every edit in a free span (`range-frozen` 100 definitions, 0 moved), every new definition a hoisted function
| member | where | what |
|---|---|---|
| the cue | `capIntroReset` / `capIntroStart` / the TRAIN UP return in `capIntroTick`; new `capCueS()`, `capCue()` | a standing is stamped `upT`, `cued:false`; `CUE_S` = 2 s after it stands `capCue()` writes `decide('CUE', id, {actor:'S1', by:'S1', seat:'S1', bearing:1800, tracks:1})` and says *SENTINEL · 1800 · ONE TRACK*; once per standing — a returned track and a START are named again |
| the gate | `fireN`, one line before the magazine check; new `capCueHold(s)` | after every refusal the Range already has and before a round could be spent: on an unnamed lawn track `HOLD BEFORE_CUE`, *CUE · NOT NAMED · WAIT FOR SENTINEL*, no round, the red mark kept. TARGET and APPROVE are not gated |
| the r.219 rows | `A_MAN_CAN_PLAY_THE_LAWN_ALONE`, `THE_LAWN_RUN_IS_ON_THE_RECORD` | they tick 2.5 s for the name before they fire; ids and claims unchanged |
| the record | the deck's embedded R-CORE ledger | through rev 99 (r.219, shipped 49a7455); lag exactly one |

## The two rows (ids in the exact-set manifest), red first
Built by `build-redfirst-r220.py`: the r.219 bytes plus the two rows and nothing else (`redfirst/r220.md` keeps the probe output). Both are red on r.219 by the deck's own behaviour — a FIRE before any name left a round, and no CUE row existed. On the cut both are green at 390×844 and 844×390; no page error; every r.219 row stays green.

## Decisions (reversible in one word)
- `CUE_S` = 2 s (Stage 26, Decision 22). Only FIRE is gated; TARGET and APPROVE are not.
- The cue is a row and a voice (toast), not a drawn seat: S1/S2 are cue-only lines of CL.12 with `place` null; drawing them is a siting act.
- The cue does not travel the room's wire: `decide`'s wire list is unchanged; H01 is the solo step; H02 (r.222) decides what the partner reads.
- **The swarm predicate is a later revision** (DD-141: nothing else in r.220).

## Not here, stated
The swarm predicate. CL.05 (r.221). The ladder lock and the `?map=` reader. QUAL 40 on the lawn (his gap). Per-seat magazines. The nine beats' data.

## Owed (unchanged)
`test:drone-play` in CI · 428×926 as a CI viewport · the Range's own TRAIN UP START/TIME (H00's Delta) · the five-field store.
