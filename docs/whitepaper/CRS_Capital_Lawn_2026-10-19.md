# CRS + Sub-CRS — Capital Lawn (Drone-2525 / Security-2525)
## Aligns to Capital Lawn Architecture · Modular HIL / SIL / Edge · Future R-Core

**Date:** 2026-10-19
**Anchors:** `docs/whitepaper/Capital_Lawn_Architecture.md` · live deck r0.216 / SCEN · CAPITAL 42 · Shield in the Sky paper (Asar’s five lines gate)
**Status:** Delta for Capital Lawn scene + modes. Existing polling CRS rows unchanged.
**Modular definition (this CRS):** Hardware-in-the-Loop (HIL), Sensor-in-the-Loop (SIL), Edge (sensor-fusion add-in). Robotics systems become simulatable so laser-tag play on the Capital Lawn is possible through the simulator.

---

## 0. Upside Element (matches polling CRS structure)

| Layer | What it is | Owns | Does not own |
|-------|------------|------|--------------|
| **CRS** (this document) | Scene + mode contract for Capital Lawn | Mode IDs, beat table, press loop, blockers, modular interfaces, data tables | Cube logic, money, ontology |
| **Sub-CRS** | Traceable rows (CRS-CL.*) | Input → Requirement → Output → Metric | Implementation code |
| **R-Core (future)** | Execution cadence | Manual → Semi → Auto on qualified slices | Classification, rails, meaning |
| **Upside** | Laser-tag / robotics sim on the same lawn | HIL/SIL/Edge plug-ins that do not change the cube or the three-press loop | Autonomy of settlement |

**Invariant:** The Cube never changes; only the execution engine changes. Capital Lawn is a scene + mode pack that plugs into the existing range engine and future R-Core engines.

---

## 1. Scene Contract (aligned to architecture)

| Element | Spec | Source |
|---------|------|--------|
| Building | 172.67 m E–W × 88.09 m N–S, drum, ribbed shell, lantern, Goddess + star @ 92.24 m, south steps, Great Walk 25 ft, allee, north lawn trees, bounding streets, rotunda circle | Architecture §1 |
| Fidelity | Detail follows dial; presence does not. Building drawn outside segment budget | Architecture §1 |
| Door targets | D-CAP-S/N/E/W currently pop-up (BLOCKER) | Architecture §4 |
| Defended assets | Command post, fuel farm, ammunition transfer point, maintenance cluster (required, missing) | Architecture §4 |
| Swarm | Paper 9 (3×3) vs deck 42 · 336/336 segs (open) | Architecture §4 |
| Press loop | TARGET (amber) → APPROVE (red) → FIRE | Architecture §2 |
| Seat | PILOT primary; seat map + 8 fire modes unchanged across beats | Architecture §3.3 |

---

## 2. Mode CRS (live + designed)

| Mode ID | Label | Status | Clock | Gate | Maps to ladder |
|---------|-------|--------|-------|------|----------------|
| `train_up` | TRAIN UP | Live | Wall + START/time | Three-press | Introductory |
| `train_down` | TRAIN DOWN | Live | Wall + START/time | Three-press | Introductory / Intermediate |
| `qual_40` | QUAL 40 | Live | Wall | IWQ 40-target | Advanced |
| `real_world` | Real-World | Designed | Segment / beat | Asar’s five lines | Real-World |

Range is frozen (`tests/range-frozen.test.mjs`). SCEN · CAPITAL 42 opens the Capital without mutating the range.

---

## 3. Sub-CRS — Capital Lawn Modes & Beats

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---------|----------|-----------|--------|-----|-------------|---------------|-------|
| **CRS-CL.01** | CRS-CL.01.IN | CRS-CL.01.OUT | Live | 1 | TRAIN UP: targets come up; light WAIT until START; last target down stops clock; three-press loop enforced. | START and wall time recorded; hit/miss counters match glass. | Matches live deck r0.216. |
| **CRS-CL.02** | CRS-CL.02.IN | CRS-CL.02.OUT | Live | 1 | TRAIN DOWN: all targets start down; START stands lane and runs clock under lamps. | START and wall time recorded; last down stops. | Matches live deck. |
| **CRS-CL.03** | CRS-CL.03.IN | CRS-CL.03.OUT | Live | 1 | QUAL 40: 40 targets, 18 engagements, ranges 6/7/8/8/6/5, four phases, five positions, exposure 5/8/12/16 s, ends CEASE FIRE / UNLOAD / SHOW CLEAR / score / RANGE IS COLD. | Wall-clock; score matches engagement count. | Matches live QUAL. |
| **CRS-CL.04** | CRS-CL.04.IN | CRS-CL.04.OUT | Designed | 2 | Real-World: nine beats (Enki’s Spark → Asar’s Synthesis). Seat map + 8 fire modes unchanged. Three presses survive every beat. | Each beat has stands-up / decision / fails-on; gate is Asar’s five lines before X-BAT load. | From Shield paper + architecture §3.3. |
| **CRS-CL.05** | CRS-CL.05.IN | CRS-CL.05.OUT | Blocked | 1 | Capitol façades D-CAP-S/N/E/W are not pop-up targets. Defended asset is not shootable. | Zero façade IDs appear as pop-up targets; pass condition “asset still there when it ends” is testable. | Blocker from architecture §4. |
| **CRS-CL.06** | CRS-CL.06.IN | CRS-CL.06.OUT | Planned | 2 | Defended assets exist on lawn: command post, fuel farm, ammunition transfer point, maintenance cluster. | Four assets present and non-shootable; “defended assets preserved” scorable. | Paper set. |
| **CRS-CL.07** | CRS-CL.07.IN | CRS-CL.07.OUT | Open | 2 | Swarm count settled: 9 (paper) or 42 (deck). | Single declared count used by all modes. | Operator decision. |
| **CRS-CL.08** | CRS-CL.08.IN | CRS-CL.08.OUT | Planned | 3 | “Joint network stable” defined or stand-in provided. | Metric exists and is scorable in Real-World. | Currently undefined. |
| **CRS-CL.09** | CRS-CL.09.IN | CRS-CL.09.OUT | Planned | 3 | Spoof package (EW) is an effect at Real-World, not an operator-controlled control. | Effect appears in beat data; no new press. | Paper has it; ladder does not. |

---

## 4. Data Tables

### 4.1 Real-World Beats (canonical)

| # | Beat | Stands up | Decision tested | Fails on |
|---|------|-----------|-----------------|----------|
| 1 | Enki’s Spark | Nothing yet — Sentinel sweeps | No shot before the cue | Firing before Sentinel names it |
| 2 | Thor’s Shield | One low, slow UAS, bearing fixed | Hostile until disproven — and it is bait | Spending the missile seat on it |
| 3 | Krishna’s Thread | Saturation across classes; one fast track | High track is not a lawn seat’s | Lawn gun takes the high track |
| 4 | Odin’s Eye | Primary engagement | Do not chase every ghost | Chasing the decoy while real vector runs |
| 5 | Enlil’s Order | Leaker over the wire at ammunition point | Inner ring takes it | A defended point is hit |
| 6 | Athena’s Direction | A gun is lost; southern seam opens | Next gun covering its dead ground takes the track | Threat left with no gun that can lock it |
| 7 | Sofia’s Lens | SE low, two fast from N, one standoff observer | Observer is held, not shot | A held track fired on |
| 8 | Aset’s Echo | Restore the line, then one last low-fast contact | Discipline in the quiet | Breaking formation during restore |
| 9 | Asar’s Synthesis | The five lines | — | Only then does X-BAT package load |

### 4.2 Mode Config (implementation shape)

```typescript
type ModeId = "train_up" | "train_down" | "qual_40" | "real_world";

interface ModeConfig {
  id: ModeId;
  label: string;
  scene: "capital_lawn" | "range";
  clock: "wall" | "segment";
  presses: ["target", "approve", "fire"];
  gate?: "asar_five_lines";
}
```

### 4.3 Defended Assets (required)

| Asset | ID | Shootable | Required for |
|-------|----|-----------|--------------|
| Command post | `DA-CP` | No | Enlil’s Order, Asar lines |
| Fuel farm | `DA-FF` | No | Survivability |
| Ammunition transfer point | `DA-ATP` | No | Enlil’s Order |
| Maintenance cluster | `DA-MC` | No | Seam coverage |

---

## 5. Modular Interfaces — HIL / SIL / Edge

**Modular in this CRS means the same lawn and three-press loop can accept:**

| Interface | Abbrev | What plugs in | Status | Future use |
|-----------|--------|---------------|--------|------------|
| Hardware-in-the-Loop | HIL | Physical controller, gimbal, trigger, magazine sensor | Scaffold | Real gun/controller drives sim presses |
| Sensor-in-the-Loop | SIL | EO/IR, radar, ESM feeds | Scaffold | Live sensor returns become tracks |
| Edge | Edge | Sensor-fusion add-in at point of need | Planned | Fusion node on lawn or robot |
| Robotics | Robo | Simulated or real platforms | Future | Laser-tag play on Capital Lawn through simulator |

**Invariant:** Adding HIL/SIL/Edge/Robo does not change the press loop, the seat map, or the nine-beat table. It only changes the source of the track or the press.

### Sub-CRS — Modular

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric |
|---------|----------|-----------|--------|-----|-------------|---------------|
| **CRS-CL.M01** | CRS-CL.M01.IN | CRS-CL.M01.OUT | Scaffold | 3 | HIL: physical device can emit TARGET/APPROVE/FIRE. | Press events match glass colours; latency recorded. |
| **CRS-CL.M02** | CRS-CL.M02.IN | CRS-CL.M02.OUT | Scaffold | 3 | SIL: sensor feed can inject tracks into a beat. | Track appears as stand-up; three-press still required. |
| **CRS-CL.M03** | CRS-CL.M03.IN | CRS-CL.M03.OUT | Planned | 3 | Edge: sensor-fusion add-in can be attached without changing mode config. | Fusion output is a track source only. |
| **CRS-CL.M04** | CRS-CL.M04.IN | CRS-CL.M04.OUT | Future | 4 | Robotics: simulated or real platforms can occupy seats on the lawn. | Laser-tag play possible; same presses; no autonomy of settlement. |

---

## 6. Future R-Core Integration

Aligns to `docs/MODE_R-CORE_SPEC.md` and `docs/R_CORE_SIMULATION_ARCHITECTURE.md`.

| Cadence | Who authors | Who commits | Capital Lawn application |
|---------|-------------|-------------|---------------------------|
| 1 · Manual | Human + AI drafts | Human only | Current. Modes and beats are specified; nothing ships without human. |
| 2 · Semi-Auto | AI proposes mode/beat deltas + tests + metric | Human Authority | AI may draft a new beat or HIL binding; human accepts. |
| 3 · Autonomous | R-Core executes voted queue | 11.1% gate + tests | Only after a Capital Lawn slice has earned Mode 3. |

**11.1% rule (per slice):**
`ΔM ≥ 0.111` AND tests pass AND SSSES floors hold AND no blocking risk → recurse.
Otherwise fail-closed.

**Suggested metric family for Capital Lawn slices:**
- Determinism (identical replay hash)
- Glass truth (button colour matches mark)
- Beat completion rate
- Defended-asset preservation (once assets exist)

**Invariants (from R-Core):**
- Autonomy increases as qualification increases.
- No mode autonomously classifies, transmits, or rewrites canonical meaning.
- Fail-closed is default.
- Capital Lawn is a scene pack; the cube does not change.

---

## 7. Upside — Laser Tag on the Capital Lawn

**Goal:** Play laser tag on the Capital Lawn through the simulator once robotics and Edge are simulatable.

| Step | What is required | CRS row |
|------|------------------|---------|
| 1 | Lawn + three-press loop stable | CRS-CL.01–.04 |
| 2 | Façades non-shootable; defended assets present | CRS-CL.05–.06 |
| 3 | HIL accepts external trigger | CRS-CL.M01 |
| 4 | SIL/Edge can inject player or robot tracks | CRS-CL.M02–.M03 |
| 5 | Robotics platforms occupy seats | CRS-CL.M04 |
| 6 | Same scene, same presses, laser-tag rules as a mode overlay | New mode `laser_tag` (future, not in current ladder) |

**Laser-tag overlay (future, not MVP):**
- Same Capital Lawn geometry.
- Presses become “tag” instead of “fire” for friendly seats.
- Defended assets remain non-shootable.
- HIL/SIL/Edge supply the physical or fused input.
- No change to the cube or to settlement.

---

## 8. Cross-references

| Item | Location |
|------|----------|
| This CRS | `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` |
| Architecture | `docs/whitepaper/Capital_Lawn_Architecture.md` |
| Shield text-only | `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md` |
| Images companion | `docs/whitepaper/Shield_in_the_Sky_Images.md` |
| Polling CRS delta (structure match) | `docs/CRS_TRACEABILITY_2026-07-03.md` |
| R-Core cadence | `docs/MODE_R-CORE_SPEC.md` |
| R-Core sim architecture | `docs/R_CORE_SIMULATION_ARCHITECTURE.md` |
| VISION-2525.pdf (Supabase) | https://ppgfjplawtlrfqpnszyb.supabase.co/storage/v1/object/public/whitepaper/VISION-2525.pdf |
| Live deck | https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html |

---

*CRS + Sub-CRS for Capital Lawn. Modular = HIL / SIL / Edge. Robotics and laser-tag are the upside. R-Core cadence is earned, not toggled. Aligns to architecture and to the polling CRS table shape.*
