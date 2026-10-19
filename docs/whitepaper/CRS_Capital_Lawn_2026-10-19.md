# CRS + Sub-CRS Delta — 2026-10-19 Capital Lawn

> **Scope.** Captures every new / clarified CRS traceability row for the Capital Lawn scene and modes. Existing rows in `docs/CRS_TRACEABILITY_2026-07-03.md` and the Cube docs are unchanged; this file is the delta.
>
> **Anchoring commit:** live deck r0.216 / SCEN · CAPITAL 42. Aligns to `docs/whitepaper/Capital_Lawn_Architecture.md`.

---

## Capital Lawn · Scene Contract (new)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.00** | CRS-CL.00.IN | CRS-CL.00.OUT | **Live** | 1 | Capital Lawn scene is true-scale (172.67 m E–W × 88.09 m N–S). Building presence is outside segment budget; detail follows fidelity dial. | Building outline remains visible at default fidelity; stage is not black. | Architecture §1. |

## Capital Lawn · Range Modes (new sub-CRS)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.01** | CRS-CL.01.IN | CRS-CL.01.OUT | **Live** | 1 | TRAIN UP: targets come up; light WAIT until START; last target down stops clock; three-press loop (TARGET amber → APPROVE red → FIRE) enforced. | START and wall time recorded; hit/miss counters match glass. | Matches live deck r0.216. |
| **CRS-CL.02** | CRS-CL.02.IN | CRS-CL.02.OUT | **Live** | 1 | TRAIN DOWN: all targets start down; START stands lane and runs clock under lamps; last down stops. | START and wall time recorded. | Matches live deck. |
| **CRS-CL.03** | CRS-CL.03.IN | CRS-CL.03.OUT | **Live** | 1 | QUAL 40: 40 targets, 18 engagements, ranges 6/7/8/8/6/5, four phases, five positions, exposure 5/8/12/16 s; ends CEASE FIRE / UNLOAD / SHOW CLEAR / score / RANGE IS COLD. | Wall-clock; score matches engagement count. | Matches live QUAL. |

## Capital Lawn · Real-World Mode (new sub-CRS)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.04** | CRS-CL.04.IN | CRS-CL.04.OUT | **Designed** | 2 | Real-World: nine beats (Enki’s Spark → Asar’s Synthesis). Seat map and eight fire modes unchanged. Three presses survive every beat. Gate is Asar’s five lines before X-BAT package loads. | Each beat has stands-up / decision / fails-on; gate is scorable. | From Shield paper + architecture §3.3. |
| **CRS-CL.04.01** | CRS-CL.04.01.IN | CRS-CL.04.01.OUT | **Designed** | 2 | Beat 1 Enki’s Spark: nothing yet — Sentinel sweeps. No shot before the cue. | Fail recorded if fire before Sentinel names it. | Beat table. |
| **CRS-CL.04.02** | CRS-CL.04.02.IN | CRS-CL.04.02.OUT | **Designed** | 2 | Beat 2 Thor’s Shield: one low, slow UAS, bearing fixed. Hostile until disproven — and it is bait. | Fail recorded if missile seat spent on it. | Beat table. |
| **CRS-CL.04.03** | CRS-CL.04.03.IN | CRS-CL.04.03.OUT | **Designed** | 2 | Beat 3 Krishna’s Thread: saturation across classes; one fast track. High track is not a lawn seat’s. | Fail recorded if lawn gun takes the high track. | Beat table. |
| **CRS-CL.04.04** | CRS-CL.04.04.IN | CRS-CL.04.04.OUT | **Designed** | 2 | Beat 4 Odin’s Eye: primary engagement. Do not chase every ghost. | Fail recorded if decoy chased while real vector runs. | Beat table. |
| **CRS-CL.04.05** | CRS-CL.04.05.IN | CRS-CL.04.05.OUT | **Designed** | 2 | Beat 5 Enlil’s Order: leaker over the wire at ammunition point. Inner ring takes it. | Fail recorded if a defended point is hit. | Beat table. |
| **CRS-CL.04.06** | CRS-CL.04.06.IN | CRS-CL.04.06.OUT | **Designed** | 2 | Beat 6 Athena’s Direction: a gun is lost; southern seam opens. Next gun covering its dead ground takes the track. | Fail recorded if threat left with no gun that can lock it. | Beat table. |
| **CRS-CL.04.07** | CRS-CL.04.07.IN | CRS-CL.04.07.OUT | **Designed** | 2 | Beat 7 Sofia’s Lens: SE low, two fast from N, one standoff observer. Observer is held, not shot. | Fail recorded if a held track is fired on. | Beat table. |
| **CRS-CL.04.08** | CRS-CL.04.08.IN | CRS-CL.04.08.OUT | **Designed** | 2 | Beat 8 Aset’s Echo: restore the line, then one last low-fast contact. Discipline in the quiet. | Fail recorded if formation broken during restore. | Beat table. |
| **CRS-CL.04.09** | CRS-CL.04.09.IN | CRS-CL.04.09.OUT | **Designed** | 2 | Beat 9 Asar’s Synthesis: the five lines. Only then does the X-BAT package load. | Gate passes only after five lines score. | Beat table. |

## Capital Lawn · Blockers (new sub-CRS)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.05** | CRS-CL.05.IN | CRS-CL.05.OUT | **Blocked** | 1 | Capitol façades D-CAP-S/N/E/W are not pop-up targets. Defended asset is not shootable. | Zero façade IDs appear as pop-up targets; pass condition “asset still there when it ends” is testable. | Architecture §4. |
| **CRS-CL.06** | CRS-CL.06.IN | CRS-CL.06.OUT | **Planned** | 2 | Defended assets exist on lawn: command post (`DA-CP`), fuel farm (`DA-FF`), ammunition transfer point (`DA-ATP`), maintenance cluster (`DA-MC`). All non-shootable. | Four assets present; “defended assets preserved” scorable. | Paper set. |
| **CRS-CL.07** | CRS-CL.07.IN | CRS-CL.07.OUT | **Open** | 2 | Swarm count settled: 9 (paper, three groups of three) or 42 (deck, 336/336 segs). | Single declared count used by all modes. | Operator decision. |
| **CRS-CL.08** | CRS-CL.08.IN | CRS-CL.08.OUT | **Planned** | 3 | “Joint network stable” defined or stand-in provided. | Metric exists and is scorable in Real-World. | Currently undefined. |
| **CRS-CL.09** | CRS-CL.09.IN | CRS-CL.09.OUT | **Planned** | 3 | Spoof package (EW) is an effect at Real-World, not an operator-controlled control. | Effect appears in beat data; no new press. | Paper has it; ladder does not. |

## Capital Lawn · Modular Interfaces (HIL / SIL / Edge / Robotics)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.M01** | CRS-CL.M01.IN | CRS-CL.M01.OUT | **Scaffold** | 3 | HIL: physical controller, gimbal, trigger, or magazine sensor can emit TARGET / APPROVE / FIRE. | Press events match glass colours; latency recorded. | Modular = hardware-in-the-loop. |
| **CRS-CL.M02** | CRS-CL.M02.IN | CRS-CL.M02.OUT | **Scaffold** | 3 | SIL: sensor feed (EO/IR, radar, ESM) can inject tracks into a beat. | Track appears as stand-up; three-press still required. | Modular = sensor-in-the-loop. |
| **CRS-CL.M03** | CRS-CL.M03.IN | CRS-CL.M03.OUT | **Planned** | 3 | Edge: sensor-fusion add-in can be attached without changing mode config. Fusion output is a track source only. | No change to press loop or seat map. | Modular = edge sensor fusion. |
| **CRS-CL.M04** | CRS-CL.M04.IN | CRS-CL.M04.OUT | **Future** | 4 | Robotics: simulated or real platforms can occupy seats on the lawn. Laser-tag play possible through the simulator. | Same presses; no autonomy of settlement. | Upside: laser tag on Capital Lawn. |

## Capital Lawn · R-Core Integration (future)

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.R01** | CRS-CL.R01.IN | CRS-CL.R01.OUT | **Planned** | 3 | Manual cadence: human authors; human commits. Nothing ships without a named Human-Authority event. | No autonomous commit. | Aligns to `docs/MODE_R-CORE_SPEC.md`. |
| **CRS-CL.R02** | CRS-CL.R02.IN | CRS-CL.R02.OUT | **Planned** | 3 | Semi-Auto cadence: AI may propose mode/beat deltas + tests + metric; Human Authority accepts / modifies / blocks. | Proposal automatic; commitment is not. | Aligns to Mode 2. |
| **CRS-CL.R03** | CRS-CL.R03.IN | CRS-CL.R03.OUT | **Planned** | 4 | Autonomous cadence: R-Core may recurse only after tests pass and ΔM ≥ 11.1% and SSSES floors hold and no blocking risk. | Fail-closed otherwise. | Aligns to 11.1% rule. |

---

## Change summary — 2026-10-19

**Docs:**
- `docs/whitepaper/Capital_Lawn_Architecture.md` — scene + modes
- `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` — this file
- `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md` — text-only gateable source
- `docs/whitepaper/Shield_in_the_Sky_Images.md` — image extracts 1–13

**Modular definition (this delta):** Hardware-in-the-Loop (HIL), Sensor-in-the-Loop (SIL), Edge (sensor-fusion add-in). Robotics systems become simulatable so laser-tag play on the Capital Lawn is possible through the simulator. Adding any of these does not change the three-press loop, the seat map, or the nine-beat table.

**Invariants:**
- The Cube never changes; only the execution engine changes.
- Capital Lawn is a scene + mode pack.
- Autonomy increases as qualification increases.
- Fail-closed is the default.

---

*Delta only. Existing polling CRS rows unchanged. Format matches `docs/CRS_TRACEABILITY_2026-07-03.md`.*
