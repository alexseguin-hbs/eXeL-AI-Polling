// ARCHITECT-2525 · R6 ONE COST TRUTH — the behavioral gate (operator 2026-11-01; both 48/30-agent fleets' #1 finding).
// The house-price headline must be a SINGLE truth: the Simulate headline (architect-sim-options.costFor), the Estimate
// headline (architect-estimate.rollupProject) and the frozen 웃 engine's projectHeadline(material, labor, markup) must
// agree for the canonical Cube, and none may move with a settlement-jurisdiction / FX / recognition change (the firewall).
// This gate MEASURES + LOCKS that agreement (R6a); R6b re-derives the live headlines through projectHeadline with the
// agreement held here. Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-one-cost-truth.test.mjs
import { costFor, catalogSum, modelById, SIM_MODELS } from "@/lib/architect-sim-options";
import { rollupProject, DEFAULT_SECTIONS } from "@/lib/architect-estimate";
import { projectHeadline, materialCost, projectLaborCost, settlementComparison, deriveM } from "@/lib/architect-labor";
import { modeledQuotes } from "@/lib/architect-vendors";
import { canonicalHouseTruth, BUDGET_TARGET_USD, fmtUsdWhole } from "@/lib/architect-house-truth";
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const cube = modelById("3x3-grid") ?? SIM_MODELS[0];
const simHeadline = costFor(cube, cube.native);              // Simulate house price
const estHeadline = rollupProject(DEFAULT_SECTIONS, 3).costUsd; // Estimate house price

// ── the two live headlines agree (today both resolve to the $240k canonical anchor) ──
ok(simHeadline === 240000, `Simulate headline (costFor) = $240,000 (got $${simHeadline})`);
ok(estHeadline === 240000, `Estimate headline (rollupProject) = $240,000 (got $${estHeadline})`);
ok(simHeadline === estHeadline, `the Simulate and Estimate headlines AGREE ($${simHeadline} === $${estHeadline}) — one cost truth`);

// ── the frozen 웃 engine reproduces the same headline from its one function (material ≥3-vendor + labor + markup) ──
// Cube anchor decomposition (architect-sim-options): material channel $48k (30%), pro labor $112k (70%), markup 50%.
{
  const material = materialCost(modeledQuotes(48000));       // ≥3-vendor average of the 48k material channel
  const labor = projectLaborCost({ storedWageUsd: 112000 }); // the pro-labor channel as project evidence
  const head = projectHeadline(material, labor, 50);          // (48000 + 112000) × 1.5
  ok(material.usd === 48000 && material.state === "QUOTED", "material channel resolves to the ≥3-vendor average ($48,000)");
  ok(labor.laborUsd === 112000 && labor.authority === "STORED", "labor channel takes STORED authority ($112,000)");
  ok(head.headlineUsd === 240000, `projectHeadline reproduces the $240,000 headline (got $${head.headlineUsd})`);
  ok(head.headlineUsd === simHeadline && head.headlineUsd === estHeadline, "all THREE agree: Simulate === Estimate === projectHeadline (ONE COST TRUTH)");
}

// ── the firewall: the headlines take NO jurisdiction/FX/recognition input, so a settlement change cannot move them ──
{
  const M = deriveM("carpenter");
  // changing the settlement-comparison jurisdiction list produces different settlement refs …
  const austin = settlementComparison(100, M, ["US-AUSTIN"])[0];
  const nigeria = settlementComparison(100, M, ["NG"])[0];
  ok(austin.localSettlementNative !== nigeria.localSettlementNative || austin.native_currency !== nigeria.native_currency, "the settlement reference differs by jurisdiction (settlement is local)");
  // … but the house-price headlines are unchanged (they read no jurisdiction/FX at all)
  ok(costFor(cube, cube.native) === simHeadline && rollupProject(DEFAULT_SECTIONS, 3).costUsd === estHeadline, "the Simulate + Estimate headlines are invariant — settlement/FX/recognition never move the house price (the firewall)");
}

// ── the HOUSE BUILD SPEC master is the SAME truth (operator 2026-11-01: "master source … flows to all components") ──
// The 4th surface that used to disagree ($2,000 / 2,000 ft² / 1 component) now reads the one cost truth + the one geometry.
{
  const h = canonicalHouseTruth();
  ok(h.costUsd === simHeadline, `HOUSE BUILD SPEC master cost === the one cost truth ($${h.costUsd} === $${simHeadline})`);
  ok(h.areaSqft === 900, `HOUSE BUILD SPEC master area === the canonical 900 ft² (got ${h.areaSqft})`);
  const buildSum = h.build.reduce((a, p) => a + p.usd, 0);
  ok(Math.abs(buildSum - h.costUsd) <= h.build.length, `the master build-by-phase reconciles to the headline ($${buildSum} ≈ $${h.costUsd})`);
}

// ── the OTHER two homes' displayed headlines are PINNED too (cost firewall — the 48-fleet's unpinned hole, R4) ──
// Eco-Sphere reads its ASSUMED costFor; the Tiny card reads its catalog stock-plan sum (not costFor). Lock both so a
// future change cannot silently move them. These are REFERENCE/ASSUMED product-truths, declared and held.
{
  const eco = modelById("eco-sphere"); const tiny = modelById("tiny");
  ok(eco && costFor(eco, eco.native) === 231500, `Eco-Sphere headline is pinned at $231,500 (got $${eco ? costFor(eco, eco.native) : "?"})`);
  ok(tiny && tiny.catalogPreset && catalogSum(tiny.catalogPreset) === 67000, `Tiny Home card headline is pinned at $67,000 (catalog stock plan) (got $${tiny && tiny.catalogPreset ? catalogSum(tiny.catalogPreset) : "?"})`);
  // the three displayed headlines are distinct and each on its own basis — one truth per home, no cross-contamination
  ok(simHeadline === 240000 && costFor(eco, eco.native) === 231500 && catalogSum(tiny.catalogPreset) === 67000, "all three home headlines hold: Cube $240,000 (derived) · Eco-Sphere $231,500 (assumed) · Tiny $67,000 (catalog)");
}

// ── R6 EXTENDED (operator LIVE 2026-11-11 "show calculated vs target"): the two surfaces that used to read "NOT CALCULATED"
//    — the Overview (command-ux1) + the Master Readout — now READ this one derived truth (canonicalHouseTruth().costUsd),
//    shown AGAINST the ASSUMED budget target, so every adjacent surface reads one cost. The SoI economy stays firewalled.
//    ONE PRESENTATION + ONE TARGET (AsM-caught 2026-11-11, Thoth/Thor/Odin): the cost renders through the ONE shared
//    whole-dollar formatter (fmtUsdWhole — no false cents, same format HouseSpec uses) and the budget target is the ONE
//    shared constant (BUDGET_TARGET_USD from architect-house-truth), so the one number can never show two formats or two
//    targets across surfaces, and a future target edit can't drift one surface from another. ──
{
  const srcCmd = readFileSync(new URL("../components/architect-2525/command-ux1.tsx", import.meta.url), "utf8");
  const srcMr = readFileSync(new URL("../components/architect-2525/master-readout.tsx", import.meta.url), "utf8");
  const srcHs = readFileSync(new URL("../components/architect-2525/house-spec.tsx", import.meta.url), "utf8");
  ok(/canonicalHouseTruth\(\)/.test(srcCmd) && /fmtUsdWhole\(houseTruth\.costUsd\)/.test(srcCmd) && !/NOT CALCULATED/.test(srcCmd), "the Overview reads the DERIVED canonicalHouseTruth().costUsd via the shared whole-dollar format (not 'NOT CALCULATED')");
  ok(/canonicalHouseTruth\(\)/.test(srcMr) && /fmtUsdWhole\(master\.costUsd\)/.test(srcMr) && !/NOT CALCULATED/.test(srcMr), "the Master Readout reads the DERIVED canonicalHouseTruth().costUsd via the shared whole-dollar format (not 'NOT CALCULATED')");
  ok(!/(Est\. Build Cost|Project Cost|Budget Target)" value=\{fmtUsd(Whole)?\(econ\./.test(srcCmd), "no cost/budget tile presents the SoI economy (econ.*) as a construction cost (§XI firewall; econ stays in the incentive expander)");
  // ONE PRESENTATION: all three cost surfaces format the one number through the shared fmtUsdWhole (no cents, no divergence)
  ok(fmtUsdWhole(240000) === "$240,000" && fmtUsdWhole(173200) === "$173,200" && !/\.00/.test(fmtUsdWhole(240000)), "fmtUsdWhole is whole-dollar — no false cents on the build estimate");
  ok(/fmtUsdWhole/.test(srcCmd) && /fmtUsdWhole/.test(srcMr) && /fmtUsdWhole/.test(srcHs), "all three cost surfaces (Overview · Master Readout · HouseSpec) format the cost through the ONE shared fmtUsdWhole");
  // ONE TARGET: the budget target is the ONE shared constant, imported — never a per-file literal that could drift
  ok(BUDGET_TARGET_USD === 66800, "the shared BUDGET_TARGET_USD is the $66,800 ASSUMED target");
  ok(/import \{[^}]*BUDGET_TARGET_USD[^}]*\} from "@\/lib\/architect-house-truth"/.test(srcCmd) && !/const BUDGET_TARGET_USD\s*=/.test(srcCmd), "the Overview IMPORTS the shared BUDGET_TARGET_USD (no local literal to drift)");
  ok(/import \{[^}]*BUDGET_TARGET_USD[^}]*\} from "@\/lib\/architect-house-truth"/.test(srcMr) && !/const BUDGET_TARGET_USD\s*=/.test(srcMr), "the Master Readout IMPORTS the shared BUDGET_TARGET_USD (no local literal to drift)");
  ok(/Budget Target/.test(srcCmd) && /vs target/.test(srcMr), "the calculated-vs-target pair is shown on both surfaces (Budget Target tile · 'vs target' in the readout)");
}

// ── determinism ──
ok(costFor(cube, cube.native) === simHeadline, "costFor is deterministic");

console.log(`\narchitect-one-cost-truth: ${pass} passed, ${fail} failed · Simulate === Estimate === projectHeadline; settlement/FX/recognition never move the house price`);
process.exit(fail ? 1 : 0);
