# Architect-2525 — Master Specification

> **Vision 2525 · "Innovation at the Speed of Thought"**
> Construction Coordination Framework · Level-3 Domain Play on the shared WIREFRAME-CORE.
> Authoritative superset spec. References (does not duplicate) `CRS_ARCHITECTURE-2525.md`, `../2525-core/WIREFRAME-CORE.md`,
> and the `architect_2525` Domain Play in `../CUBE_19_27_LEVEL_3_FRAMEWORK.md`.
> Status: **spec-approved, code-phase pending.** Canonical name `Architect-2525` · CRS `ARC-##.##` · core `U-WF-##`.

---

## 1 · Positioning

Architect-2525 is **not CAD software** — it is a collective-intelligence *construction coordination operating system*:
humanity designing better homes through simulation, replay, expert review, transparent governance, and iterative
qualification **before** construction begins. Every house is an evolving digital twin; every decision is replayable; every
improvement is reusable; every contributor earns measurable credit in time, tokens, and value.

It is the **second domain** on the shared substrate (Security-2525 is the first), proving the Vision 2525 thesis: one
Coordination Engine, many domains. Architect plugs into the Level-3 substrate (Cubes 19–27) and the U-WF wireframe core as
a **Domain Play** — it specializes domain vocabulary and object catalogs; it never forks the 9 cubes, the R-CORE contract,
or the U-WF primitives. A `2×4` wall stud and a THAAD canister are the *same* instanced-wireframe primitive with different
metadata (`U-WF-10`) — which is why Security and Architecture develop in parallel and eventually share a common
Coordination / Replay / Qualification / Observability / Identity / Digital-Twin engine family.

---

## 2 · Mission & Primary Goal

Transform residential construction from **Design → Build** into a full intelligence cycle:

`Imagine → Simulate → Measure → Review → Improve → Qualify → Approve → Construct → Replay → Learn → Improve Future Homes`

**AI + collective intelligence + architect review = safer, faster, lower-risk homes.** KPI targets (from the Domain Play):
lower risk **30–50%**, faster approvals **20–40%**, build-ready confidence **100%**, and reusable learning that compounds
value every project.

---

## 3 · Vision 2525 Principles (inherited)

1. **Humanity First** — technology augments people; never replace human judgment; always preserve human approval.
   Trinity governance: **HI** = human direction · **AI** = acceleration · **SI** = spiritual/shared alignment.
2. **Collective Intelligence** — every project benefits from AI, human, expert, community, historical, and operational
   intelligence.
3. **Replay Continuity** — every action, approval, design, review, simulation, and estimate is replayable. Nothing is lost.
4. **Qualification Before Construction** — construction never begins before qualification; qualification is continuous, not
   one final inspection.

---

## 4 · Inherited Substrate (reuse table)

Architect-2525 **reuses** these existing engines; it specializes only where noted.

| Capability | Source (reuse) | Verdict |
|---|---|---|
| SSSES qualification protocol | `SSSES.md` | reuse as-is (add ARC rows + SPIRAL vN column) |
| Language Lexicon Gate + t() | `SSSES.md` §Lexicon · `frontend/lib/lexicon-*.ts` | reuse as-is (add ARC keys, all 34 langs) |
| Time → $ (jurisdiction rate) | `backend/app/core/hi_rates.py` (`resolve_human_rate`) | reuse as-is |
| Time tracking (MoT) | `backend/app/models/time_tracking.py` · `cube5_gateway/service.py` | reuse; specialize action types |
| Token math contract | `Token_Governance_Math.md` | reuse as-is |
| Trinity ledger (◬ ♡ 웃) | `backend/app/models/token_ledger.py` · `cube8_tokens/*` | reuse; specialize minting actions |
| Replay + determinism | `cube10_simulation/replay_service.py` · U-WF-06 / U-WF-08 | reuse contract; specialize payload |
| On-chain approval / ledger | Cube 17 Blockchain (Quai/QI) | reuse as-is |
| R-CORE lanes/states | `frontend/components/security-2525/rcore.ts` | reuse as-is (COMM/EDGE/SYNC/LINK/UCRS) |
| R-CORE resilience / 6-face | `docs/security-2525/RCORE_6CUBE_ARCHITECTURE.md` | reuse as-is |
| Coordinate engine (lat/lon↔MGRS/UTM) | `frontend/components/security-2525/mgrs.ts` | reuse as-is |
| Universal wireframe substrate | `../2525-core/WIREFRAME-CORE.md` (U-WF-01…12) | reuse as-is; ARC refines U-WF-10 |
| FPS governor / SPEED TEST | `frontend/components/security-2525/fps-governor.ts` | reuse as-is |
| Play-test / scrubber pattern | `frontend/components/security-2525/play-test.ts` | reuse pattern; specialize script |
| Theme | `frontend/lib/theme-context.tsx` | reuse as-is |
| Cube-status L1/2/3 panel | `frontend/components/cube-status.tsx` | reuse as-is (Architect = L3 Domain Play) |
| SPIRAL e2e harness | `frontend/tests/mission-planning.spiral.mjs` | reuse pattern → `architect-planning.spiral.mjs` |
| Command-shell scaffolding | `frontend/components/security-2525/command-ux1.tsx` | clone pattern → `architect-2525/command-ux1.tsx` |

---

## 5 · Tab / UX Framework

`ArchitectCommandUX1` mirrors `SecurityCommandUX1`: a self-contained `"use client"` shell taking `{ initialTab }`,
`NAV: [label, Icon][]`, `activeTab` state, a sticky top bar (ExelWordmark title · LINK: SECURE · gauge/settings popover ·
FPS pill · exit), an inline gear settings popover (FPS cap / SPEED TEST / PLAY TEST), R-CORE badges (COMM/EDGE/SYNC/LINK/
UCRS), the "keep primary tab mounted (`display:none`)" trick, and "wiring pending" placeholders for unbuilt tabs. Visual
language: dark glass panels + cyan/purple/gold Trinity glow + Vision-2525 logo (per the operator infographics).

**The 12 tabs** (label · purpose · CRS · engine):

| Tab | Purpose | CRS | Engine |
|---|---|---|---|
| **OVERVIEW** | Observability dashboard: health, iteration #, SSSES, $/min budget, time donated, risk, build-readiness; Knowledge-Graph surface | ARC-23, ARC-20 | cube-status pattern |
| **DESIGN** | 2D⇄3D wireframe builder (site grid, framing, openings, assembly) + 3D grid **WALKTHROUGH**; primary/kept-mounted | ARC-01→05, ARC-16, ARC-28 | U-WF-01→05 + orbit/voxel + fps-governor |
| **BUILD** | 4D day-by-day sequence (2×4/beam/plumbing/electrical) + trade coordination (who/what/when) + utilities routing | ARC-29, ARC-30, ARC-29.01 | U-WF-06 + play-test scrubber + Cube 5 |
| **SUN·SKY** | Sun/moon/star paths (Polaris, Orion, constellations) from corner coords across the year + window/view optimization | ARC-31, ARC-32 | mgrs.ts + ephemeris + ARC-03 |
| **SIMULATE** | Structural, wind, flood, fire, quake, thermal, solar, water, HVAC, evacuation, accessibility, carbon, lifecycle | ARC-22 | sim engine |
| **COST·TIME** | $/min economy + MoT/Time-Capital + Trinity tokens + volunteer/learning points; transparent minimal fee | ARC-12→14, ARC-33 | hi_rates + Cube 5/8 + Token_Governance_Math |
| **ITERATE** | 11–33 iteration engine + replay packages + deltas + 20–33 wireframe gallery | ARC-15, ARC-21 | Cube 10 + U-WF-06 |
| **SHARE** | Open/tokenized share link; anyone view/walk/comment; comments→change; homeowner consolidation via eXeL polling | ARC-25→27 | session/link + Cubes 1–9 |
| **REVIEW** | Global Architect Network marketplace + multi-agent AI votes + explainability | ARC-18, ARC-19 | expert network + agents |
| **QUALIFY** | SSSES + automated checks + stage gates G0–G13 + on-chain timestamped approval record | ARC-24 | SSSES + Cube 17 |
| **TWIN** | 5 synchronized digital twins (Construction/Maintenance/Emergency/Insurance/Renovation) | ARC-17 | digital-twin framework |
| **REPLAY** | Replay cards (timestamp/who/why/before/after/approval/risk/cubes/hash); Knowledge Graph | ARC-21, ARC-20 | Cube 10 + U-WF-06/08 |

---

## 6 · CRS Catalog

**Existing (`CRS_ARCHITECTURE-2525.md`) — ARC-01→11** (site grid, framing primitives, openings, assembly, 2D⇄3D one-source,
cost+time, 33-iteration polling loop, export quadruple, code-guidance, HAL compliance, building-export-to-Security). Each
maps to a `U-WF-##` core primitive; retained verbatim as the primitive catalog.

**New (this spec) — ARC-12→33** (each row also carries a "Shared with U-WF/SEC/Cube" column in the catalog table):

| CRS | System | Shared with |
|---|---|---|
| ARC-12 | $/min Economy (first-class) | Cube 5, Cube 8, hi_rates |
| ARC-13 | Measurement of Time / Time Capital | Cube 5, time_tracking |
| ARC-14 | Trinity Token Economy (◬ ♡ 웃) | Cube 8, Token_Governance_Math |
| ARC-15 | 11–33 Iteration Engine | Cube 10, U-WF-06 |
| ARC-16 | Level-3 Cube object model | U-WF-02/03/06 |
| ARC-17 | Digital Twins (×5) | U-WF-06 |
| ARC-18 | Multi-Agent AI (roster + vote + explainability) | Cube 6 |
| ARC-19 | Global Architect Network | Cube 8 (rewards) |
| ARC-20 | Knowledge Graph | Cube 6/9 |
| ARC-21 | Replay Engine (Replay Card) | Cube 10, U-WF-06/08 |
| ARC-22 | Simulation Engine (catalog) | U-WF-08 determinism |
| ARC-23 | Observability Dashboard | cube-status |
| ARC-24 | Stage Gates G0–G13 + on-chain approval | Cube 17 |
| ARC-25 | Open Sharing (public/tokenized link) | Cube 1 session/governance |
| ARC-26 | Universal Comments → candidate change | Cube 7 |
| ARC-27 | Homeowner Consolidation via eXeL polling | Cubes 1–9 (extends ARC-07) |
| ARC-28 | 3D Grid Walkthrough | U-WF-05, Security orbit |
| ARC-29 | 4D Construction Sequence | U-WF-06 |
| ARC-29.01 | Utilities/MEP routing ("wire from power to home") | U-WF-02/04 |
| ARC-30 | Trade Coordination (who/what/when) | Cube 5 |
| ARC-31 | Celestial Engine (sun/moon/stars) | mgrs.ts |
| ARC-32 | Window/View Optimization | ARC-03, ARC-31 |
| ARC-33 | Volunteer/Learning Points | Cube 5/8, ARC-20 |
| ARC-11.01 | Map-plot handoff (building → Security-2525 map) | SEC-07.01, SEC-11, U-WF-10, mgrs.ts |

Format: two-digit `ARC-##.##`, never letters. ARC-33 deliberately lands on 33 to echo the 33-iteration loop.

---

## 7 · $/min Economy (first-class, live client-side)

Architect-2525 runs a true **$/min economy** across all activity — the operator's #1 requirement: core, visible, functional.

**Tracked in $/min:** labor hours (framing/plumbing/electrical/…), expert-review time (Global Architect Network), donated
iteration time, billable simulation/AI time, project-management/coordination time.

**Core formulas** (canonical module `architect-economy`, mirroring `Token_Governance_Math.md`; identical on client + Cube 5/8):
- `minutes` tracked per action (start/finish/duration).
- `$value = minutes × resolve_human_rate(country, state)` (default 7.25/hr → /60 per-min); materials + labor + time all in $/min resolution.
- **Allocation:** single-day OR spread over project duration; every cost change re-rolls up total project cost at $/min granularity.
- **Trinity mint per action:** `♡ = ceil(active_minutes)` · `웃 = min-wage/min (when enabled)` · `◬ = ♡ × multiplier`.
- **Donated time** → converted to $/min value + Trinity rewards.
- **Transparent minimal fee** surfaced (e.g. the low approval fee shown in the infographics) — no hidden cost.

**MoT integration → Time Capital:** MoT = duration · complexity · impact · quality · review/approval/replay counts ·
knowledge contribution. **Time Capital = MoT × $/min** — a measurable economic asset feeding both the economy and the
Trinity tokens.

**Client↔backend contract (gate #1, closed):** ONE schema + formula module for both the client-side live preview and the
Cube 5/8 backend. The **audited ledger is the source of truth**; the client is an OPTIMISTIC preview that reconciles to the
ledger on sync — estimate and ledger cannot durably diverge.

**UI:** live $/min tiles on OVERVIEW + the dedicated COST·TIME tab (rollup, allocation toggle, donated-time, Trinity
balances, learning points).

---

## 8 · 11–33 Iteration Engine

Each iteration is an intelligence cycle (Design → Simulation → Structural → Cost → Energy → Constructability → Community →
Architect → AI → Qualification → Approval → Replay Snapshot). Each iteration emits: **Replay Package · Qualification Report
· Delta Changes · Time Ledger (MoT + $/min) · Token Ledger (◬ ♡ 웃) · Digital-Twin Snapshot**, and is SSSES-scored. The
20–33 wireframe gallery (ITERATE tab) shows each pass as a replay card; iteration 33 = APPROVED.

---

## 9 · Level-3 Cube Object Model

The Architect analog of `mission-support.ts` — every construction element is a modular intelligence object:

```json
{
  "cube_id": "L3-001",
  "category": "Exterior Wall",
  "geometry": {},
  "materials": [],
  "labor_hours": 12,
  "cost_usd": 0, "cost_per_min": 0,
  "energy_rating": "A", "fire_rating": "2hr", "carbon": 0,
  "time_mot": {}, "risk_score": 0.08,
  "maintenance_cycle": "20 years",
  "inspection_history": [], "simulation_results": [],
  "dependencies": [], "replay_history": [],
  "qualification_score": 94,
  "digital_twin": "..."
}
```

Fields: geometry · materials · dependencies · cost + $/min · carbon · time (MoT) · risk · lifecycle · inspection &
maintenance history · simulation results · replay history · qualification score.

---

## 10 · Digital Twins · Multi-Agent AI · Global Architect Network · Knowledge Graph

- **Digital Twins (ARC-17):** every home auto-creates 5 synchronized twins — Construction · Maintenance · Emergency ·
  Insurance · Future-Renovation.
- **Multi-Agent AI (ARC-18):** specialized agents (Site Planner, Structural, Architect, Electrical, Mechanical, HVAC,
  Energy, Interior, Landscape, Permit, Cost Analyst, Safety, Accessibility, Environmental, Replay Analyst, Qualification
  Auditor). Each votes; each recommendation is stored. **Explainability required:** why · assumptions · confidence ·
  alternatives · risks · tradeoffs · historical examples.
- **Global Architect Network (ARC-19):** distributed expert marketplace (architects, engineers, electricians, plumbers,
  inspectors, building officials, accessibility/fire/insurance/sustainability experts, community reps). Every review earns
  Time + Rating + Impact + Replay + Tokens + Recognition; time donation → $/min value.
- **Knowledge Graph (ARC-20):** every project improves future recommendations through structured learning
  (Foundation → Concrete Type → Climate → Failure Rate → Drainage → Best Practices → Future Recommendations).

---

## 11 · Stage Gates G0–G13

`G0 Vision · G1 Requirements · G2 Site Qualification · G3 Concept · G4 Structural Qualification · G5 Cost Qualification ·
G6 Permit Readiness · G7 Construction Ready · G8 Construction · G9 Inspection · G10 Occupancy · G11 Maintenance ·
G12 Renovation · G13 Lifecycle Replay.` Reconciled with the Domain-Play phase gates (`pilot → refine → qualify → adopt`)
and the infographic pipelines: the **7-step** (Input→Simulate→Review→Approve→Plan Set→Build→Deliver) and **9-step** (Owner
input → AI concept → Spatial optimization → Structural/systems sim → Cost/constructability → Collective architect feedback
→ Compliance prep → Timestamped approval package → Local permit handoff) both map onto G0–G13.

---

## 12 · Replay Engine · Simulation Engine · Observability

- **Replay Engine (ARC-21):** every event → a **Replay Card** (timestamp · who · why · before · after · simulation ·
  approval · comments · risk · associated Level-3 cubes · replay hash). Every home is literally replayable (U-WF-06 bundle
  + U-WF-08 SHA-256 determinism).
- **Simulation Engine (ARC-22):** structural, wind, flood, fire, earthquake, thermal, sunlight/solar, water flow, HVAC,
  emergency evacuation, accessibility, construction sequence, cost-over-time, lifecycle maintenance, carbon footprint.
- **Observability Dashboard (ARC-23):** project health · iteration # · qualification/SSSES · replay activity · expert
  participation · risk trend · budget/$/min trend · construction readiness · time donated · community contribution.

### 12a · 4D Build Sequence & Trade Coordination (ARC-29, ARC-30)
Scrub a day-indexed timeline (play-test scrubber pattern) and watch each **2×4, beam, plumbing run, and electrical run**
appear in build order from the U-WF-06 replay bundle. **ARC-29.01 utilities routing** renders the "wire from power to home"
(grid/renewable → electrical wire → panel) plus plumbing runs. **Trade coordination** shows per-day role/trade lanes —
*who does what when* — tied to Cube-5 time + $/min, with critical-path/dependency ordering. Helps everyone understand the
build.

### 12b · Celestial Engine & Window Optimization (ARC-31, ARC-32)
From the house's **corner coordinates** (reuse `mgrs.ts` lat/lon), a **deterministic ephemeris** computes sun/moon/star
azimuth-elevation across the year and renders a sky dome with sun path, moon path, and key stars/constellations (at least
**Polaris + Orion**). Each opening (ARC-03) is scored for **view + seasonal daylight** → a **window-placement optimizer**
(SSSES-scored, determinism-hashed). Handles hemisphere flips + extreme-latitude edge cases (Enki's list).

> **Detailed sub-spec (change-controlled):** [`CELESTIAL_SKY_SPEC.md`](./CELESTIAL_SKY_SPEC.md) — the authoritative
> contract for the Sky Dome + Solar-System (UCRS) views, coordinate systems, star/zodiac realism model, control
> inventory + Homeowner/Advanced tiering, and the CHANGE CONTROL clause. Any celestial/sky change edits that spec first.

### 12c · Open Sharing, Universal Comments & Homeowner Consolidation (ARC-25→27)
A **public/tokenized share link** lets anyone view, walk, and comment. Comments become **candidate deltas**; once shared,
the **homeowner consolidates** them through the eXeL polling engine (Cubes 1–9, 33-iteration theme clustering) — collective
input, human decider. **Volunteer/learning points (ARC-33)** are minted for contribution and for *learning to build a
house* (curriculum from the Knowledge Graph). Explicit state model: comment → (shared) → votable delta → consolidation →
iteration.

---

## 13 · Security-2525 Integration + Cross-Domain Future View

ARC-11 exports any Architect model down to the **U-WF-10 minimal building** (box + doors + windows) for Security
simulation (PRISON / CAPITOL / NEIGHBORHOOD). Shared with `SEC-07.01`, `SEC-11`. The long game is a shared
**Coordination / Replay / Qualification / Observability / Identity / Digital-Twin** engine family — a set of interoperable
Vision-2525 apps (healthcare, education, logistics, … reuse the core, specialize only domain intelligence).

**Future view (ARC-11.01 — map-plot handoff):** an Architect-2525 house/building carries corner coordinates (ARC-01 /
ARC-31), so it can be **plotted directly onto the Security-2525 tactical map** at its real lat/lon as an asset/AO — a real
home becomes a security scenario. Both domains already share `mgrs.ts` + the U-WF-10 building primitive, so this is a
**bridge, not a fork**. Return path: a Security scenario feeds back into the Architect twin. **Consent gate (gate #2):** the
handoff REQUIRES explicit owner consent + the `sensitive` generalization pass; OFF by default, no address-level detail
crosses without opt-in.

---

## 14 · SSSES + Verification

Every ARC feature and iteration is scored on **Security · Stability · Scalability · Efficiency · Succinctness** (0–100;
production-ready = all five at 100), with **Current / Projected / Confidence / Risk / Recommendation** per pillar. The
**Automated Checks** surface (QUALIFY tab) runs Structural · Electrical · Energy · Safety · Code Compliance · Budget
Alignment · Environmental Impact. The **Language Lexicon Gate** is mandatory (all UI strings via `t()`, keys added to
`lexicon-data.ts`, `tsc --noEmit` clean, key-count never decreases). A dedicated `frontend/tests/architect-planning.spiral.mjs`
corpus guards each shipped feature (forward + backward SPIRAL; a U-WF change must pass BOTH Security and Architect sheets).

**Non-certification lock (ARC-09, gate #3):** the code-guidance layer is **general guidance ONLY — explicitly NOT certified
plan approval** — with a persistent UI disclaimer.

---

## 15 · Build Roadmap / Phasing

- **Phase 1 (first code pass):** `/main/Architect-2525` route (+ aliases) → `ArchitectCommandUX1` shell + all 12 tabs
  scaffolded; **OVERVIEW** (observability) + **COST·TIME** ($/min live client-side) built functional; others "wiring
  pending"; unlock the launcher tile; `architect-planning.spiral.mjs`. tsc 0 + SPIRAL green + screenshots.
- **Phase 2:** DESIGN wireframe builder (U-WF site grid → framing → openings → assembly) + 3D WALKTHROUGH + BUILD 4D
  sequence.
- **Phase 3:** SUN·SKY (celestial + window optimizer) · SIMULATE · ITERATE · SHARE · REVIEW · QUALIFY · TWIN + backend
  wiring (Cube 5/8/10/17) + the map-plot bridge.
Reconciled with the existing `CRS_ARCHITECTURE-2525.md` development order (U-WF-10 minimal building first, then site grid +
openings, then framing + 2D⇄3D, then cost/time → polling → export).

---

## 16 · Naming / CRS Conventions

Canonical domain name **`Architect-2525`**. CRS **`ARC-##.##`** (two-digit parent + two-digit sub, never letters; IO
`.IN`/`.OUT`). Core primitives **`U-WF-##`**; Security **`SEC-##.##`**. Spec slug **`V{version}-{scope_code}-{project_num}`**
(e.g. `V2525-000842`). Trinity glyphs ◬ (AI) · ♡ (SI/heart) · 웃 (HI/human) per the ORM/API/spec tri-map.

---

## 17 · Coverage Matrix (completeness gate — zero orphans)

Every operator requirement (Grok v2.0 + eXeL v2.0 + the 2026-07-14 additions + the 5 infographics + the map-plot bridge)
maps to exactly one primary tab, an ARC CRS, a reused engine / new-build note, and a verification hook. **This spec ships
only when this matrix is complete with zero orphans (gate #4).**

| # | Requirement | Tab | CRS | Engine / new-build | Verify |
|---|---|---|---|---|---|
| 1 | $/min economy (first-class) | COST·TIME | ARC-12 | hi_rates + Cube 5/8 (reuse) | SPIRAL: $/min rollup |
| 2 | MoT / Time Capital | COST·TIME | ARC-13 | time_tracking (reuse) | SPIRAL: MoT×$/min |
| 3 | Trinity tokens ◬♡웃 | COST·TIME | ARC-14 | Cube 8 (reuse) | SPIRAL: mint per action |
| 4 | 11–33 iteration engine | ITERATE | ARC-15 | Cube 10 + U-WF-06 | SPIRAL: iteration emits 6 artifacts |
| 5 | Level-3 cube object model | DESIGN | ARC-16 | new catalog (mission-support analog) | schema validate |
| 6 | Digital twins ×5 | TWIN | ARC-17 | new | SPIRAL: 5 twins sync |
| 7 | Multi-agent AI + explainability | REVIEW | ARC-18 | Cube 6 (reuse) | SPIRAL: vote + explain fields |
| 8 | Global Architect Network | REVIEW | ARC-19 | new marketplace + Cube 8 rewards | SPIRAL: review→tokens |
| 9 | Knowledge Graph | OVERVIEW/REPLAY | ARC-20 | new | data validate |
| 10 | Replay engine (Replay Card) | REPLAY | ARC-21 | Cube 10 + U-WF-06/08 | SPIRAL: replay hash stable |
| 11 | Simulation engine (catalog) | SIMULATE | ARC-22 | new (determinism U-WF-08) | SPIRAL: sim determinism |
| 12 | Observability dashboard | OVERVIEW | ARC-23 | cube-status pattern | SPIRAL: tiles render |
| 13 | Stage gates G0–G13 | QUALIFY | ARC-24 | new + Cube 17 | SPIRAL: gate order |
| 14 | Open sharing (link) | SHARE | ARC-25 | Cube 1 session/link (reuse) | SPIRAL: share link |
| 15 | Universal comments → change | SHARE/ITERATE | ARC-26 | Cube 7 (reuse) | SPIRAL: comment→delta |
| 16 | Homeowner consolidation (polling) | SHARE/ITERATE | ARC-27 | Cubes 1–9 (reuse) | SPIRAL: consolidate |
| 17 | 3D grid walkthrough | DESIGN (WALK) | ARC-28 | U-WF-05 + orbit + fps-governor | SPIRAL: walk mode |
| 18 | 4D day-by-day build | BUILD | ARC-29 | U-WF-06 + scrubber | SPIRAL: day scrub |
| 19 | Utilities "wire from power to home" | BUILD/DESIGN | ARC-29.01 | U-WF-02/04 | SPIRAL: utility run |
| 20 | Trade coordination (who/what/when) | BUILD | ARC-30 | Cube 5 (reuse) | SPIRAL: role lanes |
| 21 | Celestial (sun/moon/Polaris/Orion) | SUN·SKY | ARC-31 | mgrs.ts + new ephemeris | SPIRAL: az-el determinism |
| 22 | Window/view optimization | SUN·SKY | ARC-32 | ARC-03 + ARC-31 | SPIRAL: opening scores |
| 23 | Volunteer/learning points | COST·TIME/SHARE | ARC-33 | Cube 5/8 + ARC-20 | SPIRAL: learning mint |
| 24 | API rail (CAD/Zoning/Materials/Cost/Energy/Timeline) | DESIGN/COST·TIME | ARC-06/08 | new adapters | contract test |
| 25 | Fidelity ladder + Unreal export | DESIGN | ARC-08 | U-WF-05/09 (reuse) | export quadruple |
| 26 | Automated checks panel | QUALIFY | ARC-24 | SSSES surface | SPIRAL: 7 checks |
| 27 | On-chain approval + minimal fee | QUALIFY/SHARE | ARC-24 + ARC-12 | Cube 17 (reuse) | SPIRAL: record hash |
| 28 | Map-plot to Security-2525 | (cross-domain) | ARC-11.01 | mgrs.ts + U-WF-10 (reuse) | SPIRAL: plot at lat/lon + consent gate |

**Result: 28 requirement lines, zero orphans** — every one has tab + CRS + engine + verification. MoT confidence **99%**.

---

*End — Architect-2525 Master Specification. Innovation at the Speed of Thought.*
