# Vision • 2525 — Handoff Package
### For Master of Thought
*Assembled 25 Jul 2026. Everything of value from this working session.*

---

## Start here

| Order | File | Why |
|---|---|---|
| 1 | `CRS-EXTRACTION-VISION-2525.md` | **The main deliverable.** 58 requirements, CRS-36 → CRS-93. |
| 2 | `CUBE-ANALYSIS.md` | The 27-cell geometry, partition math, gate mapping, validation. |
| 3 | `Innovation_Project_CRS_v2.xlsx` | Series 9 as a working traceability matrix + live incentive model. |
| 4 | `R-CORE-PORTFOLIO-DESIGN.md` | The economics: $/min, the 9→7 month case, risk market design. |

Everything else is supporting.

---

## 1. Requirements

**`CRS-EXTRACTION-VISION-2525.md`** — 58 requirements in AMTS grammar
(`CRS-##.IN.SRS.###` → `CRS-##.OUT.SRS.###`).

- **Series 1–8 · CRS-36 → 74** — reproduces Rack and Stack capability: registry,
  stack prioritization, the four-step financial model (NRE / new product /
  do-nothing / EOL), gates, dependencies, dashboards, budget, exports.
- **Series 9 · CRS-75 → 93** — what Rack and Stack does not do. The
  differentiator.

**`Innovation_Project_CRS_v2.xlsx`** — Series 9 as a live workbook. Six sheets:
Legend + Assumptions, Incentive Model, Design Matrix, Verification, Transfer +
Change, Gate Map. All formulas recalculated and error-free.

> ⚠️ **A v1 of this workbook exists using CRS-01 → 18. Those IDs collide with
> your existing set. Use v2 only. Delete v1.**

### Numbering

Starts at CRS-36 because your existing set runs to CRS-35. Series 1–8 likely
overlaps those — **supersede, don't duplicate**.

---

## 2. Design

| File | Contents |
|---|---|
| `R-CORE-PORTFOLIO-DESIGN.md` | G1–G7 on the cube · risk market with the prevention-paradox fix · MoT as master variable · the 9→7 month economics · dependency propagation · 9→400 scaling |
| `PROJECT-UNLOCK-DESIGN.md` | Stage-gate ↔ cube merge · unlock state machine · derive-don't-store · login flow · PRB roles as permissions |
| `CUBE-ANALYSIS.md` | Hamiltonian path construction · size distribution · six configs + three presets · gate mapping · validation rules · render states |
| `CRS-GOVERNANCE-PLAN.md` | ID grammar · when a sub-CRS vs an ADR vs a ticket · change control · four-question triage rubric |

---

## 3. Working code

| File | Purpose |
|---|---|
| `cube-partitions.js` | Partitioner, presets, validator. Guarantees 27 cells, connected, any N. |
| `explode-view.js` | Three.js exploded view: true voxel shapes, billboard labels, dashed leader lines, camera. |
| `explode-slider.html` | Slider markup, CSS, wiring. Portrait-tuned. |
| `pdm-project-template.html` | **The demo screen.** Gate rail, live $/min, rack-and-stack growth model, launch readiness for COM COST + ERP master data, tech/commercial risk split, dependency tree. Drag the lever. |

All plain files — commit directly.

---

## 4. Market position

**`COMPETITIVE-RESEARCH.md`** — researched, sourced, 25 Jul 2026.

Four findings that change the pitch:

1. **Sopheon no longer exists.** Wellspring acquired it, completing Feb 2024,
   ~$140M, delisted from AIM. It's **Wellspring Accolade**, and they shipped
   **Accolade Core** with a Core Six Framework in May 2025.
2. **"Stage-Gate" is a registered trademark** of the Product Development
   Institute. Don't use it in marketing. G1–G7 is safe.
3. **Drop NetSuite from the comparison.** SuiteProjects is professional services
   automation, and NetSuite has no native PLM. Same for SAP PS — feed it, don't
   fight it.
4. **The risk market has prior art** (Ford, IARPA ACE, Cultivate Labs). What has
   none: paying `mitigated` the same as `materialized`. Claim that, not
   crowd forecasting generally.

---

## 5. Unrelated but pending

| File | Status |
|---|---|
| `STRIPE-FIX-RUNBOOK.md` + `donate-worker.js` | Donate flow is broken in production. Step 1 is one command: `wrangler secret list`. |

---

## 6. Decisions blocking execution

Ordered by leverage.

1. **What is SI?** CRS-93 tracks AI, SI, and HI as the burnout guard. The
   measurement rule for SI cannot be written without the definition. This is the
   only genuine hole in the requirement set.
2. **Three Cube 6 design decisions** — embeddings + KMeans vs per-row LLM
   classification; provider prioritization; sampling strategy at scale. Days of
   thinking that unblock a 15–20 day build. Still the highest-leverage item.
3. **Which nine deliverables get promoted** to fill 18 → 27 cells, and to which
   gates. Candidates identified in `CUBE-ANALYSIS.md` §5.
4. **Incentive rate.** At the 11.1% target, two months early produces a pool of
   $1,999,800 against $2,000,000 of burn avoided — the sponsor nets $200 on a
   cash basis. The scheme still works because the return is revenue pulled
   forward, but if the program should also bank cash the rate must sit below
   11.1%. Decide deliberately.
5. **Reconcile Series 1–8 against CRS-01 → 35.**
6. **Legal clearance** on Series 1–8 provenance — derived from a deck carrying
   FLIR confidential and export-control markings. The concepts are industry
   practice; the specific field sets may not be.

---

## 7. What I did not verify

- Forrester TEI figures for Accolade Core (vendor-commissioned).
- Wellspring's current pricing — public data contradicts itself badly.
- Siemens Teamcenter and PTC Windchill, cited as Accolade competitors and
  probably more relevant than NetSuite.
- Your actual gate-review latency. The 9→7 month case rests on it.
