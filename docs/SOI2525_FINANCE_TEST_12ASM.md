# SoI-2525 · Finance Test Pass — Thoth (first pass) + 11 Ascended Masters + MoT

**Scope:** H45 — Thoth **enters per-project RevPlans as baseline** (MoT-overseen), then the 12 AsM
test **all finance toggles + visuals**. Route `/innovation` (or `/main/SoI-2525`), admin `369963`.
**Gate at close:** filtered `npx tsc --noEmit` = 0 · `npm run test:innovation-time` = **574/574** (568→574, +6 reconciliation asserts) · `npm run build` ✓.

## Thoth's entry (data-entry pass) — MoT-overseen invariants
Every one of the **24 DEMO_PROJECTS** now ships a **Detailed** QTY·ASP·COGS RevPlan (`revPlanBaseline` +
`REVPLAN_QTY` in `frontend/lib/innovation-data.ts`), so the per-project Detailed editor is never blank.
Annual unit volumes are Thoth's entered assumptions by archetype; ASP·COGS are **derived** to hold the two
invariants MoT reconciles:

| Invariant | Formula | Effect |
|-----------|---------|--------|
| **Revenue** | `qty × aspK = fullRev10yM × 100` | Detailed 10-yr total **==** `fullRev10yM` |
| **Margin** | `unitCogsK = aspK × (1 − margin)` | Detailed margin **==** `execOf(p).marginPct` |

Because `projectRevSeries`, `growthModel`, `perMinFinancials`, and the rack all read `fullRev10yM` /
`execOf().marginPct` **directly** (not the RevPlan), **no headline number moves** — verified live: Portfolio
NPV **$226.2M**, SAR NPV **$25.0M**, Cur-Yr Rev **$39.2M** are identical pre/post seeding. This closes the
Thoth/Asar **A−** gap from the H43 close-out ("actual reconciles fully once per-project RevPlans are entered").

## 11 AsM — finance toggle / visual test (MoT-led)
| AsM | Lens | Tested | Grade |
|-----|------|--------|:-----:|
| **Thoth** | Data / analytics | 24 Detailed RevPlans entered; `revPlanFullM == fullRev10yM` & margin `== execOf` for all 24 (locked) | A |
| **Asar** | Synthesis / reconciliation | Σ Detailed quarters == annual `fullRev10yM`; growth-model + rack NPV + CAGR banner unchanged | A |
| **Krishna** | Integration | Single source held — RevPlan is additive; rack / growth / $/min still read `fullRev10yM`+`execOf` | A |
| **Enlil** | Build verify | filtered tsc 0 · innovation-time 574/574 · next build ✓ | A |
| **Athena** | Flow | One Scope selector drives Rev/Mgn · Hierarchy/Pillar/Risk/Funded · 1/3/10yr | A |
| **Thor** | Risk / stress | Risk split = risk-weighted (green) vs at-risk upside (orange); $/min risk-weighted ≤ full | A |
| **Odin** | Future-proof | Profiles (ramp / growth / linear) reshape the 40 quarters **without** moving the total; any plan operator-editable | A |
| **Christo** | User flow | Rack & Stack drag-reprioritize + funding line; Detailed editor reachable via Edit | A |
| **Aset** | Consistency | Detailed margin == `execOf` margin across all 24; ASP/COGS formatting uniform | A |
| **Sofia** | Multi-perspective | Renders for every persona view-only; seed/plan **editing** stays admin-gated (369963) | A |
| **Enki** | Edge cases | Space low-qty (8/12) → high ASP; software high-qty → low ASP; `aspK>0` guard → no NaN/÷0 | A− |
| **Pangu** | Innovation | QTY·ASP·COGS build-up is now real per project; per-quarter manual grid available | B+ |

## Finance surfaces exercised (deployed screenshots)
Growth Model — **Rev** and **Mgn**; **Pillar**, **Risk**, **Funded** splits (+ Hierarchy); per-BU CAGR banner
(target vs actual). Rack & Stack — **Product #** draggable working stack, NPV-ranked, funding line, dog-tag /
table modes, parent roll-up headers. Per-project **Edit source** → **Detailed** QTY·ASP·COGS editor (now
populated). $/min surfaces (risk-weighted ≤ full, finite).

## MoT synthesis
Thoth entered the baseline; MoT's two invariants held by construction, so the finances gained a real
bottom-up QTY·ASP·COGS layer on every project **without disturbing a single headline number** — the whole
model still reconciles to one source. All finance toggles and visuals render and behave. The finance
workstream moves from **A−** to **A**. Deferred (not blocking): per-project **manual** per-quarter overrides
where a franchise's real shipment schedule is known (operator-entered as it becomes available).
