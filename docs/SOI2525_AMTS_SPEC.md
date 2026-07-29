# SoI-2525 — AMTS Portfolio Slide Spec (Durable Reference)

> **Purpose.** This is the committed, authoritative extraction of the **AMTS
> "Product Portfolio Review — Business Case → Requirements Specs" template deck**
> (37-page PDF, screenshots IMG_8168–8193). It exists so the operator **never
> re-uploads the PDF again** — every future slide-fidelity round cites this doc.
>
> It reconciles two things:
> 1. **AMTS template (source of truth for look/layout)** — what each slide must
>    *look like* (header band, panels, fields, footer, gate flag).
> 2. **App schema (`frontend/lib/innovation-data.ts` `SLIDE_SCHEMA`)** — what the
>    SoI-2525 deck *currently implements* (field ids/kinds, linked vs authored).
>
> When the two differ, the AMTS column is the target and the app column is the
> current state; gaps are called out as **Δ**.

---

## 1. Universal slide anatomy (every AMTS slide)

Fixed **16:9** page. The SoI-2525 `SlideCanvas` reproduces this with
`width: min(100vw, calc(100dvh*16/9)); aspect-ratio: 16/9; container-type: size`
so content scales in `cqw`/`cqh` units.

| Zone | AMTS content |
|------|--------------|
| **Header band (left)** | **{Slide Title}: _Project Name_** (title black, "Project Name" blue italic). Sub-line: `Business: X · Project #: XYZ · Slide: N`. Later slides add `3-Year NPV · Dev Stage · Date 1st Revenue`. |
| **Header band (right)** | **REQUIRED: {GATE} and above** (grey, gate word blue-italic). |
| **Body** | 1–2 **blue-title panel cards** (left/right is the dominant layout), each a titled table or bullet block. |
| **Footer** | page number (bottom-left, red) + **Reference Links: Doc 1, Doc 2, …** |

**Gate-requirement ladder** (the top-right "REQUIRED:" flag), in order:
`CONCEPT → PLAN → DEVELOP → QUALIFY → LAUNCH → MAXIMIZE → RETIRE/ITERATE`.

**Stage strip / colors** (app `GATE_STAGE`): Concept · Plan · Develop · Qualify ·
Launch · Maximize · Retire-EOL.

---

## 2. Title-Case rule (symmetry)

Key-phrase **labels, card titles, tab/toggle labels, and chart titles use Title
Case** — e.g. *Revenue + Margin by Year*, *Tech Risk*, *Comm Risk*, *Combined
Resource Needs*, *Development Priorities*. Prose sentences (hints, comments,
bullets) stay sentence case. (F1 shipped: Tech Risk · Comm Risk · Revenue +
Margin by Year.)

---

## 3. Gate-driven financial granularity ladder

The Revenue Plan / financial forecast gets **more granular as funding rises**:

| Gate | Granularity required |
|------|----------------------|
| **G1 Concept** | **High-level** only (annual roll-up, order-of-magnitude). |
| **G2 Plan** | **By year**, with **COGS + ASP** estimate per year. (AMTS S10a "Annual Forecast Required · PLAN".) |
| **G3 Develop** | **By month**, with **COGS + ASP** per month. (AMTS S10b "Monthly Forecast Required · DEVELOP", min 18 months past launch.) |
| **G4 Qualify** | **By month** + **finance-approval flag** + **PLC #3 (Mature) & PLC #4 (Decline)** dates documented. |

**Budget-Range vocabulary** (the through-line across the GTM/EOL phase slides):
`Preliminary → Approved → (lower/raise) → Actuals vs Plan`.

**Launch anchoring:** the forecast grid is keyed to the project's **launch date
(`firstRevenue`)**; changing the launch date shifts the whole series (and the
financial slide) accordingly.

---

## 4. Per-slide spec (S1–S18 + closeout)

Format per slide: **AMTS layout** (target) → **App schema** (`SLIDE_SCHEMA`
code/gate/fields) → **Δ gaps**.

### S1 — Executive Summary  ·  REQUIRED: CONCEPT+
- **AMTS:** exec one-pager — what / why / who / the ask.
- **App (S1, G1 Concept, src Market Needs + Business Case):** `oneline` (Product in one sentence), `valueprop`, `segment`, `ask` (recommendation for the gate).
- **Δ:** app is text-only; AMTS one-pager can carry a hero image + return-profile strip (see S2/S3 linked profile).

### S2 — Project Overview  ·  REQUIRED: CONCEPT+
- **AMTS:** project-template one-pager — linked return profile + roadmap/status/risks; **Upside spending-accelerator** intake (extra $ pulls schedule/revenue forward). 6-panel dense layout.
- **App (S2, G1):** `profile` (linked: 3-Yr NPV, IRR, Payback, 1st revenue, Stage), `accel` (linked: Accelerator $, Pulled fwd, Rev moved left), `status`, `roadmap` (list), `toprisks` (list).
- **Δ:** Track B B3 target = render as the AMTS **6-panel** grid.

### S3 — Financials  ·  REQUIRED: CONCEPT+
- **AMTS:** return profile + Revenue/Margin by Year table + cash-flow chart (R&D/NRE out vs revenue & margin), financial comments.
- **App (S3, G1, src "Business Case · linked to project financials"):** `profile` (linked, adds Technical/Commercial risk), `revtable` **"Revenue + Margin by Year"** (linked table Year/Revenue/Margin), `rdchart` (linked cash-flow chart), `fincomment` (list).
- **Δ:** F2 elevates the "◈ Edit source" opener here; F3 makes `rdchart` click-to-pin; F4/F5 add annual/monthly + COGS/ASP by gate.

### S4 — CONOPS  ·  REQUIRED: CONCEPT+
- **AMTS:** operational concept in order (image-tiled step cards) + future capabilities + customer CONOPS diagram.
- **App (S4, G1, src Market Needs):** `conops` (ordered list, 6–10 steps, image-tiled), `future` (list), `visual` (attach).

### S5 — Customer Problem Statement  ·  REQUIRED: CONCEPT+
- **AMTS:** problem statement + customer outcomes + why-now + status-quo cost, 2–3 bullets each.
- **App (S5, G1):** `problem` (longtext), `outcomes`, `whys`, `statusquo` (each a 2–3 bullet list).

### S6 — Product Summary  ·  REQUIRED: CONCEPT+
- **AMTS:** reduction one-pager — single-sentence overview + two reduced 3-bullet sections (problem, CONOPS/apps) + two flanking product images.
- **App (S6, G1):** `desc` (one sentence ~19 words), `problem` (3 bullets), `conops` (3 bullets), `image`, `image2`.

### S7 — Personas & Workflow  ·  REQUIRED: PLAN+
- **App (S7, G2 Plan):** `personas` (table Persona / Wants…), `flow` (attach), `desired` (longtext).

### S8 — Competition + Value  ·  REQUIRED: PLAN+
- **AMTS:** Competition (Next Best Alternative) + Value (Value Prop v NBA), value waterfall + willingness-to-pay positioning.
- **App (S8, G2):** `nba` (text — the As-Is to out-perform), `diffs` **Value equation** table (Differentiator / Importance / Ours / NBA / Value $ — `importance × (our − NBA) = value`), `vprop` (longtext), `capture` (Value creation / Value capture % / Competitive index), `valuechart` (linked value waterfall + WTP), `benefits` (list), `features` (list).
- **Δ:** Track B B3 target = waterfall chart panel + Value-Prop-vs-NBA two-column.

### S9 — User Stories  ·  REQUIRED: PLAN+
- **App (S9, G2, src Design Traceability Matrix):** `stories` (table Persona / "As a… I want… so that…" / Req ID `CRS-##.IN.SRS.###`).

### S10 — R&D Spend + Revenue (10a By-Year / 10b By-Month)  ·  REQUIRED: PLAN+
- **AMTS:** **S10a** annual forecast @ PLAN; **S10b** monthly forecast @ DEVELOP. R&D spend by year/month (WBS: Labor/Contractor/Materials/Other) + revenue scenarios + confidence.
- **App (S10, G2):** `spend` (table Year / Labor / Contractor / Materials / Other; "10a annual at Plan; 10b monthly at Develop, month = quarter/3"), `scenarios` (table Scenario / L-1 / Launch / Yr 2 / Yr 3), `conf` (Technical / Commercial).
- **Δ:** F4 adds Annual **and** Monthly input toggles (min 18 mo past launch); F5 requires COGS/ASP per cell by gate.

### S11 — Preliminary Feedback  ·  REQUIRED: PLAN+
- **AMTS:** L=`Early Validation – UXD` [# Customers Contacted / Value Prop Differentiator / Voice of the Customer Learnings / Decision (Pivot/Pursue/Pass)] + Comments. R=`Planned Experiments` [Exp # / # Responses / Assumptions to Test (If X, then Y) / Success Criteria (successful if X) / Results] + Comments.
- **App (S11, G2):** `voc` (table # customers / Differentiator / VOC learnings / Pivot·Pursue·Pass), `exp` (table Exp # / Assumption to test / Success criteria / Result), `comments` (list).

### S12 — Go-to-Market Strategy  ·  REQUIRED: DEVELOP+
- **AMTS:** `Launch Phases: Days`, 4 columns — **L-90** Draft Launch Plan · **L-60** Align & Execute · **L-30** Execute Final Deliverables · **L=Launch** Launch & Optimize. Each = 4 steps: Marketing Assets @ Pass Level (L1–L4), Budget Range (Preliminary→Approved→lower/raise→Actuals vs Plan), alignment meeting, follow-up. Ref: Market Strategy Documentation.
- **App (S12, G3 Develop):** `l90`, `l60`, `l30`, `l0` (each a list).

### S13 — Risk Summary  ·  REQUIRED: DEVELOP+
- **AMTS:** L=`Technical Risk Highlights` [Risk High/Med/Low / Topic / Counter Measure]; R=`Commercial Risk Highlights` [same]. Below-left: `Dependencies – Internal IRAD / CRAD Projects` list.
- **App (S13, G3):** `tech`, `comm`, **`biz`** (operator split-3: Technical/Commercial/Business), each table Level / Topic / Counter measure / **Status**; `deps` (list).
- **Δ:** app adds a **Business** risk column and a **Status** column beyond the AMTS two-panel.

### S14 — Functional Resource Alignment: By Project  ·  REQUIRED: QUALIFY+
- **AMTS:** L=`Combined Resource Needs` combo chart (FTE $ bars + FTE # line, Current/2022–2025) + FTE Total table. R=`Functional Alignment` [FTE # / 2021–2027] rows R&D-Engineering / UX-ID / Mkt-Sales-BD / Mfg Ops-Supply / CS-Support-Service; bullets Technical+Manufacturing / Commercial / Supporting Infrastructure; FTE $ Estimate table [Current / 2022–2027]. Note: Includes R&D + Functional FTE.
- **App (S14, G4 Qualify):** `fte` (table Function / Yr1–Yr4), `ftedollar` (table Function / Yr1–Yr3), `reschart` (linked combined-resource chart), `notes` (list).

### S15 — BETA Feedback  ·  REQUIRED: QUALIFY+
- **AMTS:** L=`Pre-Launch: BETA Test VOC` [# Customers / Value Prop Diff / VOC Learnings / Decision]. R=`Development Priorities` [Priority / Feature Enhancement Summary / Method+Timing (Before Launch MM/DD · Field Update · Other Update)]. Comments incl **Impact to business case · Impact to value pricing assessment**.
- **App (S15, G4):** `voc` (table), `prio` (table Priority / Feature enhancement / Method + timing), `impact` (longtext).

### S16 — Market Performance  ·  REQUIRED: LAUNCH+
- **AMTS:** L=`Summary – Metric` grouped **Growth/Profit/Quality** [Product Launch Metrics / Reference Stage / 2022 Target / 2022 Actuals] — Say/Do Ratio Rev (Rev $ Act/Fcst), Say/Do Ratio Mgn (Margin $ Act/Fcst), Say/Do Ratio R&D (R&D Spend Act/Fcst), Value Capture ((List−Actual Price)×Qty), Customer-OTTR, Mfg Ops-PPM. R=`Market Optimization`: Product Life Cycle table — **PLC-3: Mature MM/YYYY · PLC-4: Decline MM/YYYY**; Performance Risks + Counter Measures/Next Steps (Growth/Profit/Quality).
- **App (S16, G5 Launch):** `saydo` (table Metric / Reference stage / Target / Actual), `bom` (linked WBS→Material# / Std cost), `plc` (table PLC stage / Estimated date — `plcStageOf`: PLC-3 Mature 0–3% CAGR, PLC-4 Decline <0%), `risks`, `counter` (lists).

### S17 — Post-Launch R&D Priorities  ·  REQUIRED: LAUNCH+ (app MAXIMIZE)
- **AMTS:** L=`Post Launch: VOC` [same VOC table]. R=`Development Priorities` [Priority / Feature Enhancement Summary / Timing MM/DD]. `Market Performance – Observations`.
- **App (S17, G6 Maximize):** `voc` (table), `prio` (table Priority / Feature enhancement / Timing), `obs` (list).

### S18 — End-of-Life Strategy  ·  REQUIRED: RETIRE/ITERATE+
- **AMTS:** `Execution Phases`, 4 columns — **EOL-120** Draft EOL Plan · **EOL-90** Align & Execute · **EOL-60** Final EOL Deliverables · **End of Life** Communication+Execution. 4 steps each (Budget Range progression + AAR at end). Ref: End-of-Life Plan.
- **App (S18, G7 Retire/EOL):** `e120`, `e90`, `e60`, `e0` (each a list).

### CS — Change Summary (closeout, EVERY gate review)  ·  REQUIRED: PLAN+ (PRB-Changes)
- **AMTS "PRB-Changes":** header adds **3-Year NPV · Dev Stage · Date 1st Revenue**. `Gate Review History` matrix — section rows grouped **Market** (TAM $, SAM $, Market CAGR %) · **Financials/3-Yr** (Date 1st Rev, Incremental Rev $, Incremental Margin $, 3-Yr NPV $ — two blocks) · **Value Proposition** (Competitive NBA $, NBA Price $, Top 3 Differentiators, Value Creation $, Value Capture %) · **R&D+Risk** (Risk Technical, Risk Commercial, R&D Spend) — across gate columns **Conceive · Plan · Develop · Qualify · Launch · Maximize · Retire**. Note: **Highlight Changes Only in Red**.
- **App (CS, live governance):** `changes` (linked table When / Change / By) — resolved from the change/approval ledger, never authored.

### RA — Reviews + Approvals (closeout, EVERY gate review)  ·  REQUIRED: CONCEPT+ (PRB-Approvals)
- **AMTS "PRB-Approvals":** L=`Prior Gate Review + Approvals`, R=`Current Gate Review + Approvals` [Required (●/○) / Function / Reviewers Name (F. Last) / Date] — Functions: Product/Business, Finance/FP&A, R&D-Development, Mfg Ops/Supply, Marketing/Sales, Support/Service, Legal/Trade Review, HR Planning, Other. `PRB + Executive Concerns`. Legend ● Required ○ Optional.
- **App (RA, live governance):** `approvals` (linked table Title / Name / Decision), `board` (review body). Rows from PdM + assigned roles + board decisions.

### Final page — Product Requirements: Design Traceability Matrix (AIML Technology Solutions).

---

## 5. Vision-2525 intent

The deck's job is **value communication**: every slide answers "why fund this,
why now, at what return, against what alternative." The financial slides (S2/S3/
S10) and the value slide (S8) are the load-bearing ones — they must be the
easiest to **edit from source** (the "◈ Edit source" / ✎ Financials affordance,
reachable in the fewest steps from the dog-tag, the Financials-Overview header,
and the S3/S10 slide fields) and the most **interactive** (click a bar/target →
figure).

---

## 6. Where this maps in code

| Concern | File · symbol |
|---------|---------------|
| Slide field contract | `frontend/lib/innovation-data.ts` · `SLIDE_SCHEMA` (S1–S18 + CS + RA) |
| Which slides a project ships | `slidesForProject` (S1–S3 + current gate + next gate + CS + RA) |
| Linked (live) field values | `linkedSlideField` |
| AI-drafted field values | `aiSlideField` |
| HI/AI authored seed | `frontend/lib/innovation-slide-seed.ts` · `SLIDE_SEED` |
| PLC stage from CAGR | `plcStageOf` (PLC-3 Mature 0–3%, PLC-4 Decline <0%) |
| Present-mode canvas + chrome | `frontend/app/innovation/page.tsx` · `SlideShowModal` (16:9 `SlideCanvas` + `SlideChrome`) |
| Financials | `financialMetrics` · `financialsOverview` · `execOf` (COGS/MSRP/margin) · `RevPlan` |

_Extracted 2026-07-29 from AMTS_PortfolioTemplates_Business_Case_to_RequirementsSpecs.pdf (37pp). Operator does not need to re-upload._
