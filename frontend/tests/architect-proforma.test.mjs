// ARCHITECT-2525 · HOME BUILDING PROCESS pro-forma — the two-truths honesty gate (operator 2026-11-02).
// Locks: the 7-stage developer pro-forma = the slide ($110k+$5k+$5k+$20k+$90k+$400k+$20k = $650k / 290 days);
// BUILD COST ($240k DERIVED) and PROJECT COST ($650k REFERENCE) are DISTINCT and never summed; Construction market
// ($400k) ≥ build ($240k); the $160k delta is its own line with a basis that is NOT "markup"; the Land stage is
// $110k acquisition (never the $10k Landscaping work-section); assertProFormaHonest refuses every conflation.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-proforma.test.mjs
import { proForma, assertProFormaHonest, PRO_FORMA_STAGES, CONSTRUCTION_MARKET_REF, PROJECT_DAYS_REF } from "@/lib/architect-proforma";
import { costFor, modelById, SIM_MODELS } from "@/lib/architect-sim-options";
import { buildSchedule } from "@/lib/architect-stage-plan";
import { canonicalModel } from "@/lib/architect-house-truth";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const throws = (fn, m) => { try { fn(); ok(false, m + " (expected throw, got none)"); } catch { ok(true, m); } };

const pf = proForma();
const byId = Object.fromEntries(pf.stages.map((s) => [s.id, s]));

// ── the 7 business stages, in order, with the slide's figures ──
ok(pf.stages.length === 7, `7 pro-forma stages (got ${pf.stages.length})`);
ok(pf.stages.map((s) => s.order).join(",") === "1,2,3,4,5,6,7", "stages are ordered 1..7");
ok(byId.land.cost === 110000, `Land $110k (got ${byId.land.cost})`);
ok(byId.design.cost === 5000 && byId.structural.cost === 5000, "Design & Structural $5k each");
ok(byId.permitting.cost === 20000, `Permitting $20k (got ${byId.permitting.cost})`);
ok(byId.pm.cost === 90000, `Project Management $90k (got ${byId.pm.cost})`);
ok(byId.construction.cost === 400000 && CONSTRUCTION_MARKET_REF === 400000, "Construction uses the $400k MARKET line in the project total");
ok(byId.sales.cost === 20000, `Sales $20k (got ${byId.sales.cost})`);

// ── the two cost truths: distinct, never summed ──
ok(pf.buildCostUsd === 240000, `BUILD COST = $240,000 DERIVED (got ${pf.buildCostUsd})`);
ok(pf.buildCostUsd === costFor(canonicalModel(), canonicalModel().native), "buildCostUsd === costFor(canonicalModel, native) — one source");
ok(pf.projectCostUsd === 650000, `PROJECT COST = $650,000 REFERENCE (got ${pf.projectCostUsd})`);
ok(pf.projectCostUsd !== pf.buildCostUsd && pf.projectCostUsd > pf.buildCostUsd, "the two truths are distinct and project wraps build");
ok(pf.stages.reduce((s, x) => s + x.cost, 0) === pf.projectCostUsd, "projectCostUsd === Σ stage costs (build cost is NOT an added line)");

// ── Construction kept honest as three numbers + the $160k delta ──
ok(pf.constructionBuildCost === 240000 && pf.constructionMarketRef === 400000, "Construction: build $240k (DERIVED) vs market $400k (REFERENCE), both carried");
ok(pf.constructionDeltaUsd === 160000, `the $160k delta = market − build (got ${pf.constructionDeltaUsd})`);
ok(pf.constructionMarketRef >= pf.buildCostUsd, "Construction market line ≥ the as-modelled build");
ok(!!pf.constructionDeltaBasis && !/^markup$/i.test(pf.constructionDeltaBasis.trim()), "the $160k delta carries a basis label, not plain 'markup'");

// ── timeline: Construction span DERIVED, project 290 REFERENCE, no invented per-stage durations ──
ok(pf.constructionDays === buildSchedule(canonicalModel(), canonicalModel().native).totalCalDays, "Construction span = the real build schedule (DERIVED)");
ok(pf.projectDaysRef === 290 && PROJECT_DAYS_REF === 290, "project timeline = 290 days (REFERENCE headline)");
ok(byId.construction.durationTruth === "DERIVED", "only Construction's duration is DERIVED");
ok(["land", "design", "structural", "permitting", "pm", "sales"].every((id) => byId[id].durationDays === null && byId[id].durationTruth === "REFERENCE"), "the six non-construction stages have NO invented per-stage duration (null, REFERENCE)");

// ── bases + the land-vs-landscaping trap ──
ok(byId.construction.costBasis === "engine_derived", "Construction is engine_derived");
ok(["land", "design", "structural", "permitting", "pm", "sales"].every((id) => byId[id].costBasis !== "engine_derived"), "no non-construction stage is engine_derived (no invented derivation)");
ok(byId.land.cost >= 100000, "the Land stage is $110k acquisition, NOT the $10k Landscaping work-section");
ok(pf.stages.every((s) => s.costTruth === "DERIVED" || s.costTruth === "REFERENCE"), "every stage stamps a cost-truth basis");

// ── the honesty invariant passes on a real pro-forma, and REFUSES each conflation ──
ok((() => { try { assertProFormaHonest(pf); return true; } catch { return false; } })(), "assertProFormaHonest passes on the real pro-forma");
throws(() => assertProFormaHonest({ ...pf, projectCostUsd: pf.buildCostUsd }), "refuses project === build (the two truths summed/collapsed)");
throws(() => assertProFormaHonest({ ...pf, constructionMarketRef: 200000 }), "refuses Construction market below the build cost");
throws(() => assertProFormaHonest({ ...pf, constructionDeltaBasis: "markup" }), "refuses the delta auto-labelled 'markup'");
throws(() => assertProFormaHonest({ ...pf, stages: pf.stages.map((s) => s.id === "land" ? { ...s, cost: 10000 } : s), projectCostUsd: pf.projectCostUsd - 100000 }), "refuses Land collapsed to the $10k Landscaping figure");

// ── the build cost SCALES with the design; the six reference stages do NOT (no invented scaling) ──
const tiny = modelById("tiny") ?? SIM_MODELS[0];
const pfTiny = proForma(tiny);
ok(pfTiny.buildCostUsd === costFor(tiny, tiny.native), "a different design scales ONLY the Construction build cost (via costFor)");
ok(pfTiny.stages.find((s) => s.id === "land").cost === 110000 && pfTiny.stages.find((s) => s.id === "pm").cost === 90000, "the six reference stages stay fixed at the slide figures across designs (no invented scaling)");

console.log(`\narchitect-proforma: ${pass} passed, ${fail} failed · 7-stage $650k pro-forma · build $240k DERIVED ⟂ project $650k REFERENCE · $160k delta (basis-pending, not markup) · Construction span derived, 290d reference`);
process.exit(fail ? 1 : 0);
