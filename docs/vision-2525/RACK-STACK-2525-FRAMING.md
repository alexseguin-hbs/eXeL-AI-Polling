# Rack & Stack 2525 — Framing (12 Ascended Masters → MoT approval)

> **Operator brief (2026-07-25, sleep-time / morning feedback session):** Digitize the FLIR
> "Rack & Stack" + Stage-Gate templates into the Innovation tab so that **risks can be documented
> by anyone**, enhancing risk identification so the team can **de-risk together** — powered by the
> **eXeL AI Polling** framework. Support the **highest-complexity large business** via a deep,
> re-nameable hierarchy. "All ascended masters help frame this so we can have MoT approve. Execute
> for morning feedback session."

This tool **replaces the functionality of Rack & Stack and Stage-Gate** with a live, poll-driven,
audit-first governance surface. It lives in the password-gated Innovation tab (`/innovation`, code
`369963`) until full test sign-off.

---

## 1 · Element capture — everything in the 5 reference screens (nothing dropped)

| Reference surface | Elements | Status in 2525 |
|---|---|---|
| **What is Rack & Stack** | Collect + prioritize R&D proposals through stage gates → funding decisions. RACK = entry/visibility · STACK = prioritization. Objective: balance/optimize R&D spend to meet/exceed **1–3 yr growth targets** (BU Revenue / Gross Profit Margin / Op Income / EBIT). | RACK + STACK shipped; funding line + budget live. |
| **The Rack** | Project listing: 10yr Rev, Op Contribution, gross margin, **NPV, Model Confidence, 1/5-yr spend**; new-input sheet. Rights: All. | Shipped (stack table); confidence + NPV + NRE present. |
| **The Stack** | Drag above/below **funding line**, remaining R&D spend, filter by division, **snapshots vs working** (quarterly history). Rights: All. | Funding line + reorder shipped; snapshots = backlog. |
| **By Manager / By Project** | Sort by 1/3/10-yr incremental rev, net op contribution, gross margin, above/below line, category, confidence, **commercial/technical risk**, manager, 10yr spend, FY spend, remaining budget. Rights: Full+Admin. | Tech×Comm risk model shipped; sort/group = backlog. |
| **Top / Division / Cost Dashboards** | # projects, R&D efficiency, 10yr op contribution, spend by division/category, value-ladder position, competitive position; cost split Labor/Subcontractor/Material/Other. | Dashboards = backlog (KPI strip shipped). |
| **ROI Summary** | Incremental rev by **New Product / Do-Nothing / EOL**; **probability-weighted revenue** reduced by technical + commercial risk. | pSuccess = P(tech)×P(comm) shipped; ROI panel = backlog. |
| **Dependencies Summary + Constellation** | Project → dependency arrows, ABL(green)/BLW(red), bubble = NPV/rev, cross-project critical path. | criticalPath flag shipped; constellation = backlog. |
| **Pipeline by Gate** | Spend + # projects by gate; dev-type color (Purple Sustaining · Orange Pre-study · Blue Enhance/NextGen · Green New-Mkt). | 3×3×3 gate cube shipped; pipeline swimlane = backlog. |
| **Growth Model** | Grey **Do-Nothing Baseline** (YoY decline) + Green **Weighted NPI** + Orange **Remaining NPI to 100%/risk** + Black **Growth Target line**. Controls: **# Years 1/3/10**, **Targeted Growth Rate**, **YoY Do-Nothing Rate**, **Revenue Options** (Step 1+2+3 / 1 only / 3 only / 1+3 w/o 2), **Show/Hide baseline**. | Chart shipped; **this build adds the full control set + 4-series legend**. |
| **Decline / Do-Nothing waterfall** | 2019 Actuals → program losses → baseline → risk-weighted R&S → confidence bands → growth target; "year ahead" KPIs. | Waterfall = backlog. |

---

## 2 · The framework — highest-complexity large-business hierarchy (re-nameable)

The operator's model, replacing the flat "Division" axis. Nomenclature is **configurable** (`HIER_LEVELS`),
so any enterprise can re-label the six tiers without code changes.

```
BU            Business Unit
 └ SBU        Strategic Business Unit         (many per BU)
    └ Product Group   grouping of products in an SBU
       └ Alpha Group  grouping of products in a Product Group
          └ Product # product details
             └ Material #  specific material within a product
```

Every **project** and every **risk** anchors to a node path. Filters, rollups, and the Growth Model
all cascade down this tree — so the same tool serves a 3-project startup and a 12-SBU conglomerate.

---

## 3 · The differentiator — risk documented by anyone, de-risked by polling

Classic Rack & Stack risk = one analyst's `commercial/technical` rating. **2525 opens risk authorship
to everyone** and ranks it with the eXeL AI Polling engine:

1. **Anyone documents a risk** against any node (project → material) — title, category
   (technical/commercial/schedule/supply/regulatory), **severity × likelihood** (1–5 each → 1–25 score).
2. **The community polls it** — votes = concurrence signal (Cube 7 ranking · anti-sybil). A risk many
   people independently flag rises; a lone opinion doesn't dominate.
3. **De-risk as a team** — status ladder Open → Mitigating → Mitigated → Accepted collapses exposure
   (`exposure = score × statusMultiplier`); **mitigated pays = materialized** (Series-9 prediction market).
4. **Rolls into the financials** — aggregate exposure feeds the probability-weighting already driving
   `pSuccess` and the Growth Model's "Remaining NPI to 100% (risk)" orange band. Risk becomes a live,
   crowd-sourced input to funding — not a static cell.

This is the SoI loop applied to portfolio governance: **A.I.** scores/weights, **S.I.** (shared intent)
votes, **H.I.** approves and mitigates.

---

## 4 · 12 Ascended Masters framing (MoT-led)

| Master | Lens | Framing verdict for Rack & Stack 2525 |
|---|---|---|
| **Aset** | Consistency | Six-tier hierarchy must stay internally consistent as nomenclature changes — one config source (`HIER_LEVELS`). |
| **Asar** | Synthesis | Risk exposure must feed the same probability-weight the NPV/Growth Model already uses — one number, not two. |
| **Athena** | Strategy | Growth Model is the boardroom artifact; the # Years / Rev-Options / decline controls must reproduce the FLIR deck exactly. |
| **Christo** | Consensus | Polling on risk builds team consensus; supermajority + quorum before a risk changes funding. |
| **Enki** | Diversity | "Anyone documents risk" — anonymous authorship allowed; diversity of reporters is the point. |
| **Enlil** | Build | Ship gated slices: hierarchy → risk register → Growth Model controls, each tsc/build/test green. |
| **Krishna** | Integration | Risk register integrates with Cube 7 ranking + Cube 8 prediction market (mitigated = materialized). |
| **Odin** | Foresight | Risk register is early-warning: crowd flags decline before the waterfall shows it. |
| **Pangu** | Innovation | This is net-new vs FLIR: crowd-sourced, poll-ranked, live risk — not a static rating cell. |
| **Sofia** | Multi-perspective | Same risk, many eyes; severity×likelihood + votes triangulate truth. |
| **Thoth** | Data | Deterministic scores (severity×likelihood, exposure, priority) — reproducible, testable. |
| **Thor** | Risk/Security | Anti-sybil on the risk vote; author identity optional but vote integrity enforced. |

**MoT approval:** ✅ *Approved for morning feedback.* Build order — **(A)** re-nameable 6-tier hierarchy
+ cascading Growth-Model filter; **(B)** crowd-sourced Risk Register with polling + de-risk ladder +
exposure rollup; **(C)** Growth-Model control parity (# Years, Targeted Growth, YoY Decline, Revenue
Options, Show/Hide baseline, 4-series legend). Dashboards / waterfall / dependency-constellation /
snapshots deferred to named follow-on slices. Each slice: filtered tsc 0 · build · test:all green ·
one commit → FF main → SHA.

---

## 5 · Morning demo script

1. Unlock `/innovation` (369963).
2. **Hierarchy filter** — pick a BU → SBU; the Growth Model + stack rescope live.
3. **Risk Register** — add a risk to a project (anyone), set severity×likelihood, watch exposure +
   priority compute; upvote a risk (polling) and see it climb; move it to *Mitigated* and watch exposure
   collapse and the project's weighted revenue lift.
4. **Growth Model** — flip # Years 3↔10, change Targeted Growth + YoY Decline, switch Revenue Options,
   Show/Hide baseline — the grey/green/orange/black series respond, matching the FLIR deck.
