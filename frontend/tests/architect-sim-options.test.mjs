// ARCHITECT-2525 · SIMULATE OPTIONS gate (operator 2026-10-25: "show me a mock up; simulate options" + "3 options have
// tests to run like original" + "tests should give 0-5 score initial score and other more detailed metrics" + "Cube vs
// Tiny Home vs Eco Sphere can be scored and viewed Side by aside with mini version of those designs in the tests").
// Holds the 3 design models + the shared ORIGINAL 13-sim battery scored 0–5 with detailed metrics + the side-by-side matrix.
import { SIMS, SIM_MODELS, compareModels, runBattery, simResult, simMatrix, overallScore, recommendation, modelById } from "@/lib/architect-sim-options";
import { DEFAULT_SECTIONS } from "@/lib/architect-estimate";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// the ORIGINAL 13-sim battery, exact list + order
const ORIGINAL = ["Structural", "Wind", "Flood", "Fire", "Earthquake", "Thermal", "Solar", "Water Flow", "HVAC", "Evacuation", "Accessibility", "Carbon", "Lifecycle"];
ok(SIMS.length === 13, `13 sims (got ${SIMS.length})`);
ORIGINAL.forEach((s, i) => ok(SIMS[i] === s, `sim ${i + 1} is ${s}`));

// 3 design models — the operator's vocabulary: Cube · Tiny Home · Eco-Sphere
ok(SIM_MODELS.length === 3, `3 models (got ${SIM_MODELS.length})`);
const ids = SIM_MODELS.map((m) => m.id);
["3x3-grid", "tiny", "eco-sphere"].forEach((id) => ok(ids.includes(id), `model ${id} present`));
const grid = modelById("3x3-grid"), tiny = modelById("tiny"), eco = modelById("eco-sphere");
ok(grid.label === "Cube", `the 3×3 Grid is labelled "Cube" (operator's word) — got "${grid.label}"`);
ok(tiny.label === "Tiny Home" && eco.label === "Eco-Sphere", "Tiny Home + Eco-Sphere keep their names");

// canonical is DERIVED from the real estimate engine; the other two are ASSUMED parametric variants
const baseCost = DEFAULT_SECTIONS.reduce((s, w) => s + w.costUsd, 0);
ok(grid.basis === "DERIVED" && grid.costUsd === baseCost, `Cube cost DERIVED from the engine (= ${baseCost})`);
ok(grid.areaFt2 === 900 && grid.rooms === 9, "Cube = 900 ft² · 9 rooms (the canonical home)");
ok(tiny.basis === "ASSUMED" && eco.basis === "ASSUMED", "Tiny + Eco-Sphere are ASSUMED (parametric, not quoted)");
ok(tiny.costUsd < grid.costUsd && tiny.buildMonths <= grid.buildMonths, "Tiny is cheaper + not slower than Cube");
for (const m of SIM_MODELS) ok(m.energyScore >= 1 && m.energyScore <= 5 && m.carbonScore >= 1 && m.carbonScore <= 5, `${m.id} energy/carbon in 1..5`);

// EVERY model runs the SAME original 13-sim battery ("like original") — scored 0–5 with detailed metrics
for (const m of SIM_MODELS) {
  const b = runBattery(m.id);
  ok(b.length === 13, `${m.id} runs all 13 sims`);
  ok(JSON.stringify(b.map((r) => r.sim)) === JSON.stringify(ORIGINAL), `${m.id} runs the ORIGINAL 13, in order`);
  ok(b.every((r) => r.status === "PASS" || r.status === "WATCH"), `${m.id} every sim has a valid status`);
  ok(b.every((r) => typeof r.score === "number" && r.score >= 0 && r.score <= 5), `${m.id} sim scores are 0..5 (initial score)`);
  ok(b.every((r) => Number.isInteger(r.stars) && r.stars >= 0 && r.stars <= 5), `${m.id} star rounding is 0..5`);
  ok(b.every((r) => Array.isArray(r.metrics) && r.metrics.length >= 2 && r.metrics.every((mt) => typeof mt.label === "string" && mt.label.length > 1 && typeof mt.value === "string" && mt.value.length > 0)), `${m.id} every sim carries >= 2 labelled detailed metrics`);
  ok(b.every((r) => r.status === (r.score >= 3 ? "PASS" : "WATCH")), `${m.id} status follows the 0–5 threshold (>=3 PASS)`);
  const avg = overallScore(m.id);
  ok(avg >= 0 && avg <= 5, `${m.id} overall average is 0..5 (got ${avg})`);
}
// deterministic (replay law — no Date.now / Math.random)
ok(JSON.stringify(runBattery("tiny")) === JSON.stringify(runBattery("tiny")), "runBattery is deterministic");
ok(simResult("eco-sphere", "Carbon").score === simResult("eco-sphere", "Carbon").score, "simResult is deterministic");
ok(overallScore("3x3-grid") === overallScore("3x3-grid"), "overallScore is deterministic");

// SIDE-BY-SIDE matrix — 13 rows × 3 cells, each cell scored 0–5, a real per-row winner (the highest score in the row)
const matrix = simMatrix();
ok(matrix.length === 13, `matrix has 13 rows (got ${matrix.length})`);
ok(JSON.stringify(matrix.map((r) => r.sim)) === JSON.stringify(ORIGINAL), "matrix rows are the ORIGINAL 13, in order");
for (const rw of matrix) {
  ok(rw.cells.length === 3, `${rw.sim} row has 3 model cells`);
  ok(JSON.stringify(rw.cells.map((c) => c.modelId)) === JSON.stringify(ids), `${rw.sim} cells are the 3 models, in order`);
  ok(rw.cells.every((c) => c.score >= 0 && c.score <= 5 && Array.isArray(c.metrics) && c.metrics.length >= 2), `${rw.sim} cells carry a 0–5 score + detailed metrics`);
  ok(ids.includes(rw.winnerId), `${rw.sim} winner is a real model`);
  const best = rw.cells.reduce((a, b) => (b.score > a.score ? b : a));
  ok(rw.winnerId === best.modelId, `${rw.sim} winner is the highest-scoring cell (${best.modelId})`);
}

// COMPARE ALL — one rank per metric, a real winner each, lower cost/time + higher energy/carbon
const ranks = compareModels();
["Cost", "Build time", "Energy", "Carbon"].forEach((mt) => ok(ranks.some((r) => r.metric === mt), `compare has ${mt}`));
ok(ranks.every((r) => ids.includes(r.winnerId)), "every metric winner is a real model");
ok(ranks.find((r) => r.metric === "Cost").winnerId === "tiny", "cheapest = Tiny");
ok(ranks.find((r) => r.metric === "Energy").winnerId === "eco-sphere", "best energy = Eco-Sphere");
ok(ranks.find((r) => r.metric === "Carbon").winnerId === "eco-sphere", "best carbon = Eco-Sphere");
ok(modelById("nope") === null, "unknown model id resolves to null");
ok(overallScore("nope") === 0, "overallScore of an unknown model is 0 (no crash)");

// ONE reconciled recommendation (Asar) — a real model, its 0–5 average, a reason; = the highest sim-average model
const rec = recommendation();
ok(ids.includes(rec.modelId) && typeof rec.label === "string" && rec.label.length > 0, "recommendation names a real model");
ok(typeof rec.avg === "number" && rec.avg >= 0 && rec.avg <= 5, "recommendation carries the model's 0–5 average");
ok(typeof rec.reason === "string" && rec.reason.length > 10, "recommendation carries a reason");
const bestAvgId = SIM_MODELS.map((m) => m.id).reduce((a, b) => (overallScore(b) > overallScore(a) ? b : a));
ok(rec.modelId === bestAvgId, "recommendation = the highest 13-sim-average model (one pick, not a per-axis scoreboard)");

console.log(`\narchitect-sim-options: ${pass} passed, ${fail} failed · 3 models × the original 13-sim battery (0–5 + metrics) + side-by-side matrix + compare`);
process.exit(fail ? 1 : 0);
