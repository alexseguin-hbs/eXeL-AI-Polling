# Drone-2525 · 1st Pass — POD round record (simulated)

> **Simulated SoI POD session.** Operator 2026-09-15: *"we will also document AI inputs and HI inputs with time
> stamps start and stop this round to simulate SOI POD session."* Durations come from `lib/pod-clock.ts` —
> the same `measure()`/`hhmmss()` the pod runs. **No 웃 is minted by this document.** Witnessed time is
> reported; inferred time is marked and never added to it.

**Round** 2026-09-15 15:59:16Z → 2026-09-15 17:13:10Z · wall **1:13:54**
(anchored to commits `8e04a0f` → `7b0b790`, both verifiable with `git show -s`).

## ◬ A.I. inputs — witnessed
| id | input | start | stop | duration | evidence |
|---|---|---|---|---|---|
| `ai.explore.mission` | Explore · Security-2525 Mission Planning, radar-dome object, palettes | 11:00 CST | 11:04 CST | 0:04:41 | witnessed |
| `ai.explore.core` | Explore · WIREFRAME-CORE, Manta precedent, engine-export search | 11:04 CST | 11:09 CST | 0:05:02 | witnessed |
| `ai.explore.engines` | Explore · renderers, geodata, physics, two-device relay | 11:09 CST | 11:14 CST | 0:04:19 | witnessed |
| `ai.design` | Design · Drone-2525 1st-pass implementation plan | 11:14 CST | 11:20 CST | 0:06:05 | witnessed |
| `ai.crs` | Explore · CRS templates, /crs versions + compare, Vision revision model | 11:20 CST | 11:27 CST | 0:06:50 | witnessed |

Sum of measured agent time **0:26:58**. Three of the five ran **concurrently** (wave-1), so wall clock is
shorter than this sum — both figures are given rather than one flattering one.

## ♡ S.I. input — witnessed
| id | input | start | stop | duration | evidence |
|---|---|---|---|---|---|
| `si.doctrine` | Read · VISION_2525.md (13 sections) · MODE_R-CORE_SPEC.md · R_CORE_SIMULATION_ARCHITECTURE.md | 12:08 CST | 12:12 CST | 0:03:25 | witnessed |

## 웃 H.I. inputs — inferred
The operator's message timestamps are visible only in his own client; nothing this process can read records them.
They are listed in order, inside the round bracket, and are **excluded from witnessed time**.

| id | input | evidence |
|---|---|---|
| `hi.1` | Asks to take the 1v1 drone wireframe himself (pilot + gimbal/laser targeteer) | **inferred** |
| `hi.2` | Drone-2525 1st Pass — four modes, Capitol lawn block, VTOL, shared gimbal, Unreal/Unity export | **inferred** |
| `hi.3` | Decisions: spectrum palette · hand-authored + builder · stationary first | **inferred** |
| `hi.4` | Step-by-step CRS with Vision-2525 revision, version and comparison tracking | **inferred** |
| `hi.5` | Read the 13-section R-Core doc and Vision-2525 first; log HI/AI inputs as a POD round | **inferred** |
| `hi.6` | Numbering starts at Version 00.00, revision 0.001 | **inferred** |
| `hi.7` | Vector-arcade wireframe reference; compute-adaptive resolution and frame rate | **inferred** |
| `hi.8` | Approves the plan | **inferred** |

## Totals
| | |
|---|---|
| Witnessed (◬ + ♡) | **0:30:23** (0.507 h) |
| Inferred (웃 inputs) | 8 inputs, no readable duration |
| Round wall clock | 1:13:54 |

**What this record is not.** It is not a settlement, not an 웃 mint, and not a claim that the AI seats "worked"
0:30:23 of human time — it is measured machine time plus one doctrine read. A real POD session
settles on witnessed human minutes with ≥3 member attestation (`lib/pod-clock.ts` `supported()`, `POD_MIN = 3`);
this round had one human, so nothing settles.
