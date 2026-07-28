# SoI-2525 Growth Model / Portfolio P&L — 12-AsM + MoT Close-Out Review

**Scope:** H34–H42 (Growth Model stacked-bar + tier-seeded P&L + clean hierarchy) plus the operator feedback micro-fixes.
**Gate at close:** filtered `npx tsc --noEmit` = 0 · `npm run test:innovation-time` = **568/568** · `npm run build` ✓ · pushed to `main` + `claude/debug-wsl-issues-yYdPP`.
**Where:** `/innovation` (or `/main/SoI-2525`), Admin code `369963`.

## Shipped (chronological)
| # | Slice | What the operator sees |
|---|-------|------------------------|
| H34 | Unify scope selector | One `Scope` popover drives the chart (no forked cascade) + scope breadcrumb |
| H35 | Drill-down stacked bar | Company → 3 BUs → SBUs → Alpha Codes; dropdown "Step 1 − 2 + 3 · Incremental" |
| H36 | Pillar split | "Pillar" mode re-stacks in the admin Strategic-Pillar colors + multi-select |
| H37 | Hierarchy cleanup | Colorful nested editor removed; clean tier tables kept |
| H38 | Tier P&L seeds | Rev / Margin $ / Growth % editable to Alpha Code + Trinity BU color bars (children inherit) |
| H39 | Chart reads seeds | Baseline = tier base-year Rev; per-BU CAGR banner (target vs actual); Margin $ |
| H40 | Existing/EOL revenue | Only SAR ($33M→$11M→0) + Legacy ($11M→0) carry an existing line; all others new-only |
| H40w | Risk split | Green risk-weighted vs orange at-risk upside |
| H40x/y/z | Positive Incremental · axes · Full-Rev green+orange | Incremental grows at tier CAGR; $M Y-axis; growth line from base-year bar top; Rev/Mgn only on top |
| H41 | Quarter RevPlan | QTY·ASP·COGS × 40 quarters (linear/growth/ramp/manual) + $/min surfaces |
| H41b | Funded / unfunded | "Funded" split — funded rollup above, unfunded (left-on-table) below, faded |
| H42 | Per-project editor | High-Level ↔ Detailed revenue plan + profile + manual grid; $/min readout |

## Portfolio balance (Thoth · Asar)
- **24 projects.** New-revenue-only: **22**. Existing/EOL hardware: **2** (SAR Imaging Payload Gen-5, Legacy ISR Sensor EOL Bridge). ✅ matches the operator spec.
- **BU base-year anchors** (tier seeds): DS **$99M** · MS **$33M** · AP **$11M**. **Target CAGRs**: DS **77%** · MS **33%** · AP **44%** — editable in Admin tier tables, drive the chart's target line + CAGR banner.
- **Reconciliation (Asar):** Σ tier `revM` for a scope === the chart's base-year baseline for that scope (both read `scopeSeed`/`revM`, single path).

## 12 Ascended Masters — grades on the shipped work
| AsM | Lens | Grade | Note |
|-----|------|:-----:|------|
| Aset | Consistency | A | One `BU_COLOR` Trinity source across tier line, bar, CAGR banner; removed the divergent local map |
| Asar | Synthesis | A | Numbers tell one story: tier seeds → baseline → CAGR banner reconcile |
| Athena | Flow | A | Foundation-before-consumers order held; zero-risk wins shipped first |
| Christo | User flow | A | ONE selector on the chart + breadcrumb; no double controls |
| Enki | Edge cases | A− | Empty scope / zero segments render gracefully; manual-grid guards to 40 |
| Enlil | Build | A | New `BizNode`/`Project` fields optional → old localStorage still loads |
| Krishna | Integration | A | `scopeSeed`/`perMinFinancials` shared helpers; chart no longer reads stale bizSetup |
| Odin | Future-proof | A | Pillar split derives N pillars from `loadPillars()`; RevPlan additive |
| Pangu | Innovation | B+ | Risk + Funded split modes; subtle transitions deferred (not required) |
| Sofia | Multi-perspective | A | Renders for every persona view-only; seed editing admin-gated (369963) |
| Thoth | Data/analytics | A− | Target vs actual CAGR visible; actual reconciles fully once per-project RevPlans are entered |
| Thor | Risk/removal | A | Nested editor removed only after confirming the tier table covers create/edit/describe/delete + `baseM` |

**MoT synthesis:** The Growth Model is now one coherent, drill-down P&L on a single selector, seeded from clean tier tables, with Risk and Funded governance lenses and a bottom-up QTY·ASP·COGS build-up. Test suite green throughout (556→568). Remaining: operator feedback pass (this artifact) + the deferred global-feedback/footer work.

## Deferred → SHIPPED (task #324, 2026-07-28)
- **Global feedback** — anyone, anytime: the trigger is in the global footer on every route. Built-in **Snip** (getDisplayMedia one-frame → PNG, graceful fallback to Upload) beside **Upload**; `handleSubmit` auto-captures page context (path, title, viewport, ISO timestamp). Capture is always user-gestured. Files: `frontend/components/feedback-widget.tsx`.
- **SECURITY-2525 in the footer line** with Feedback + eXeL AI, tool-wide (`frontend/components/providers.tsx` SiteFooter); homepage's duplicate in-flow pill removed. 
- **HTML feedback artifact:** `docs/feedback/SoI2525_Feedback_2026.07.28_images.html` (deployed-image cards + Approve/Change/N-A verdicts + 12-AsM review). Builder: `docs/feedback/build_soi2525_footer_feedback_2026.07.28.mjs`.
