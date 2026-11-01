# ARCHITECT-2525 — 48-AGENT AsM/MoT FLEET REVIEW of the 웃 / labor / project-cost engine (2026-11-01)

Fleet `wgys6agp2` (run `wf_a9beff03-d3a`): 48 agents (12 pods × specialists + 12 MoT rollups), 0 errors, 5.95 M tokens,
550 tool calls. Dispatched at SHA `2581327b2`; every MoT re-grounded on live HEAD (through `233dd2395`) and confirmed
`lib/architect-labor.ts` is byte-identical across all shas (blob `d1591f1d3`), gate 33/33 green. Full output:
`/tmp/.../tasks/wgys6agp2.output` (280 KB). MoT (this session) has final say; AsM bubbled the concerns below.

## Verdict
**The shipped R-WU1 웃 engine is contract-COMPLIANT as a unit** (Enlil READY, Odin READY): T1–T10 green, material
≥3-vendor avg, labor = local min wage × M × hours, and the recognition/settlement/project-cost **firewall holds BY
CONSTRUCTION** inside the module — `projectLaborCost`/`projectHeadline` take no jurisdiction/FX/웃 parameter, and
`settlementComparison` is never read by the headline. No present breach of §1–§12.

Overall **GAPS** = foresight / hardening / wiring gaps that **become** breaches as rates age and jurisdictions/trades are
added, and the product-level ONE-COST-TRUTH not yet achieved.

## Top findings (by the lens that raised them)
- **R6 · ONE COST TRUTH not achieved (HIGH — Aset, Thoth, Athena, Krishna, Asar).** At review time the contract engine was
  consumed only by its own test; the live house-price headline runs on separate engines (`architect-sim-options.costBreakdown`
  $240k · `architect-estimate.rollupProject` · `architect-economy.computeEconomy`). (R-WU2, shipped after the dispatch, is now
  the engine's FIRST product consumer — the island is no longer total, but the three headlines are still independent.)
- **§2 · 웃 rendered AS money on the operator surface (HIGH — Christo, Sofia).** `architect-economy.human(웃)=activeMin×perMin`
  is ratePerHr-driven and shown via `fmtUsd(econ.trinity.human)` (command-ux1.tsx:448, architect-soi.tsx:29/:85) — a rate
  change moves a "웃" figure, which §2 forbids; kept off the project headline only by the source-regex "Project Cost NOT
  CALCULATED" guard, not the behavioral §7 invariant.
- **Thor (security, MOST URGENT):** reference tables MUTABLE (provenance lie); a ≤0 / absurd value can take QUOTED authority →
  negative signer-facing headline; ASSUMED/Nigeria-worked-value could launder into QUOTED; material ≥3-vendor average is
  per-quote not per-vendor → a single vendor's extra quotes over-weight it (double-count).
- **Enki (edge cases):** malformed hours/M surface as a priced cost with a real evidence_state; a zero/negative quote takes
  TOP authority; an overridden `deriveM` rate keeps stale BLS-May-2024 provenance.
- **Odin (foresight):** no FX/wage staleness mechanism (fx_date frozen, vintage static); §9/T8 provenance enforced only on
  `monthlyToHourly`, not on the live `localMinWageHourlyNative` path; NG two USD figures ($0.34 worked vs $0.25 FX-derived)
  unreconciled.

## MoT decision (final say) — what ships now vs what is sequenced
**SHIP NOW — R-WU3 engine hardening (pure `lib/architect-labor.ts` + gate; consumed only by R-WU2's panel + the test, so
ZERO risk to the live $240k headline):** `Object.freeze` the reference tables; `projectLaborCost` ignores non-finite/≤0
evidence (a $0/negative quote never takes authority); `projectHeadline` guards negative markup / non-finite → NOT_CALCULATED;
`laborCostLocal` malformed hours/M → NOT_CALCULATED (never a null-as-cost); `deriveM(explicitRate)` stamps
`source:'custom-UNVERIFIED' · statistic:'override'` (no stale provenance); `materialCost` averages the per-VENDOR mean (closes
the double-count); freshness helpers `asOfAgeDays`/`isStale` + a `FRESHNESS` policy (pure, today passed in); document the
COST_AUTHORITY_ORDER ASSUMED omission. Red-first gate.

**SEQUENCED (touch LIVE operator surfaces — not done autonomously while H.I. is away; recommended next, MoT final say):**
- **R6 ONE COST TRUTH** — route `architect-sim-options`/`architect-estimate` headlines through `projectHeadline`, keep
  sim-options as the per-element SPLIT presenter, add a BEHAVIORAL `architect-one-cost-truth` gate (all three headlines equal
  for the canonical project AND invariant under a ratePerHr/jurisdiction/FX change — replacing the source-regex guard). This
  changes the live headline's derivation → do carefully, red-first proving current agreement ($240k all three).
- **§2 웃-split** — stop rendering 웃 through `fmtUsd` (command-ux1.tsx:448, architect-soi.tsx), show 웃 as hours×M
  (`recognitionU`); retire the duplicate `DEFAULT_RATE_PER_HR` in architect-economy. Live-tile change → flag to H.I.
- **R-LOC1-3 Atlantis capitals** — two separate controls ("Compare settlement in …" = informational, drives only
  settlementComparison; "Build this project in …" = the ONLY path that may move the headline, under explicit H.I. scenario);
  add the capitals to LOCAL_WAGES with full §9 provenance (ASSUMED where no statute). Role-tag / typed-brand the
  PROJECT_REGION vs SETTLEMENT_COMPARISON seam so a comparison value can never leak into the headline.
- **V7 take-off = cost** (one material source, design→hours→TRADE_MAP→deriveM→labor), P4 all-numerics, human-first
  EVIDENCE_LABELS, extend the voice gate to the cost path.

The firewall the operator cares about is intact and now hardened; the structural ONE-COST-TRUTH is the keystone remaining
and is sequenced with a behavioral gate, not a hasty live refactor.
