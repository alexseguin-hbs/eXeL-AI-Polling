// ARCHITECT-2525 · SIMULATE OPTIONS gate (operator 2026-10-25/27): the SAME 900 ft² home three ways (Cube · Tiny Home ·
// Eco-Sphere), the 13-sim battery scored 0–5 with detailed metrics, a side-by-side matrix, and the 3D-printed-cement
// framing dimension (the ICON hook) shifting scores + cost/time honestly.
import { SIMS, SIM_MODELS, FRAMING, compareModels, costFor, monthsFor, runBattery, simResult, simMatrix, overallScore, recommendation, modelById } from "@/lib/architect-sim-options";
import { DEFAULT_SECTIONS } from "@/lib/architect-estimate";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const ORIGINAL = ["Structural", "Wind", "Flood", "Fire", "Earthquake", "Thermal", "Solar", "Water Flow", "HVAC", "Evacuation", "Accessibility", "Carbon", "Lifecycle"];
ok(SIMS.length === 13, `13 sims (got ${SIMS.length})`);
ORIGINAL.forEach((s, i) => ok(SIMS[i] === s, `sim ${i + 1} is ${s}`));

// 3 models — the operator's vocabulary, all the SAME 900 ft² home
ok(SIM_MODELS.length === 3, `3 models (got ${SIM_MODELS.length})`);
const ids = SIM_MODELS.map((m) => m.id);
["3x3-grid", "tiny", "eco-sphere"].forEach((id) => ok(ids.includes(id), `model ${id} present`));
const grid = modelById("3x3-grid"), tiny = modelById("tiny"), eco = modelById("eco-sphere");
ok(grid.label === "Cube" && tiny.label === "Tiny Home" && eco.label === "Eco-Sphere", "labels Cube · Tiny Home · Eco-Sphere");
ok(SIM_MODELS.every((m) => m.areaFt2 === 900), "all three are the SAME 900 ft² home");

// Cube DERIVED, 9 rooms, stick; Tiny 9 rooms open stick; Eco 7 hex rooms, native cement
const baseCost = DEFAULT_SECTIONS.reduce((s, w) => s + w.costUsd, 0);
ok(grid.basis === "DERIVED" && grid.costUsd === baseCost, `Cube cost DERIVED (= ${baseCost})`);
ok(grid.rooms === 9 && grid.framing === "stick-framed", "Cube = 9 rooms, stick-framed");
ok(tiny.basis === "ASSUMED" && tiny.rooms === 9 && tiny.framing === "stick-framed", "Tiny = 9 rooms (open), ASSUMED, stick");
ok(eco.basis === "ASSUMED" && eco.rooms === 7 && eco.framing === "3d-printed-cement" && eco.cementNative === true, "Eco = 7 hex rooms, native 3D-printed cement");
ok(tiny.costUsd < grid.costUsd && tiny.buildMonths <= grid.buildMonths, "Tiny is cheaper + not slower than Cube");
for (const m of SIM_MODELS) ok(m.energyScore >= 1 && m.energyScore <= 5 && m.carbonScore >= 1 && m.carbonScore <= 5, `${m.id} energy/carbon in 1..5`);

// framing dimension (the ICON hook) — both methods exist; cement is cheaper + faster + convertible for EVERY form
ok(FRAMING["stick-framed"] && FRAMING["3d-printed-cement"], "both framing methods declared");
for (const m of SIM_MODELS) {
  ok(costFor(m, "3d-printed-cement") < costFor(m, "stick-framed"), `${m.id} converts to cement at lower cost`);
  ok(monthsFor(m, "3d-printed-cement") <= monthsFor(m, "stick-framed"), `${m.id} cement builds no slower`);
}
// cement shifts the sims HONESTLY both ways: Fire ↑, Carbon ↓ (embodied)
ok(simResult("3x3-grid", "Fire", "3d-printed-cement").score >= simResult("3x3-grid", "Fire", "stick-framed").score, "cement raises Fire (non-combustible)");
ok(simResult("3x3-grid", "Carbon", "3d-printed-cement").score <= simResult("3x3-grid", "Carbon", "stick-framed").score, "cement lowers Carbon (embodied carbon honest)");

// EVERY model runs the SAME 13-sim battery scored 0–5 with detailed metrics
for (const m of SIM_MODELS) {
  const b = runBattery(m.id);
  ok(b.length === 13 && JSON.stringify(b.map((r) => r.sim)) === JSON.stringify(ORIGINAL), `${m.id} runs the ORIGINAL 13, in order`);
  ok(b.every((r) => r.status === "PASS" || r.status === "WATCH"), `${m.id} valid statuses`);
  ok(b.every((r) => typeof r.score === "number" && r.score >= 0 && r.score <= 5), `${m.id} scores 0..5`);
  ok(b.every((r) => Number.isInteger(r.stars) && r.stars >= 0 && r.stars <= 5), `${m.id} stars 0..5`);
  ok(b.every((r) => Array.isArray(r.metrics) && r.metrics.length >= 2 && r.metrics.every((mt) => mt.label.length > 1 && mt.value.length > 0)), `${m.id} >= 2 labelled metrics per sim`);
  ok(b.every((r) => r.status === (r.score >= 3 ? "PASS" : "WATCH")), `${m.id} status follows the 0–5 threshold`);
  ok(overallScore(m.id) >= 0 && overallScore(m.id) <= 5, `${m.id} overall average 0..5`);
}
ok(JSON.stringify(runBattery("eco-sphere")) === JSON.stringify(runBattery("eco-sphere")), "runBattery is deterministic");
ok(overallScore("3x3-grid") === overallScore("3x3-grid"), "overallScore is deterministic");

// side-by-side matrix — 13 rows × 3 cells, scored 0–5, a real per-row winner (highest)
const matrix = simMatrix();
ok(matrix.length === 13 && JSON.stringify(matrix.map((r) => r.sim)) === JSON.stringify(ORIGINAL), "matrix = the ORIGINAL 13, in order");
for (const rw of matrix) {
  ok(rw.cells.length === 3 && JSON.stringify(rw.cells.map((c) => c.modelId)) === JSON.stringify(ids), `${rw.sim} = 3 model cells in order`);
  ok(rw.cells.every((c) => c.score >= 0 && c.score <= 5 && c.metrics.length >= 2), `${rw.sim} cells scored + metricked`);
  const best = rw.cells.reduce((a, b) => (b.score > a.score ? b : a));
  ok(ids.includes(rw.winnerId) && rw.winnerId === best.modelId, `${rw.sim} winner = highest cell`);
}

// COMPARE ALL headline winners (at native framing): cheapest = Tiny, fastest = Eco (cement), best energy/carbon = Eco
const ranks = compareModels();
["Cost", "Build time", "Energy", "Carbon"].forEach((mt) => ok(ranks.some((r) => r.metric === mt), `compare has ${mt}`));
ok(ranks.find((r) => r.metric === "Cost").winnerId === "tiny", "cheapest = Tiny");
ok(ranks.find((r) => r.metric === "Build time").winnerId === "eco-sphere", "fastest = Eco-Sphere (cement)");
ok(ranks.find((r) => r.metric === "Energy").winnerId === "eco-sphere", "best energy = Eco-Sphere");
ok(ranks.find((r) => r.metric === "Carbon").winnerId === "eco-sphere", "best operating carbon = Eco-Sphere");

// ONE reconciled recommendation (Asar)
const rec = recommendation();
ok(ids.includes(rec.modelId) && rec.avg >= 0 && rec.avg <= 5 && rec.reason.length > 10, "recommendation names a real model + avg + reason");
const bestAvgId = ids.reduce((a, b) => (overallScore(b) > overallScore(a) ? b : a));
ok(rec.modelId === bestAvgId, "recommendation = the highest 13-sim-average model");
ok(modelById("nope") === null && overallScore("nope") === 0, "unknown model → null / 0 (no crash)");

console.log(`\narchitect-sim-options: ${pass} passed, ${fail} failed · same-900ft² home ×3 · 0–5 battery + metrics + matrix + cement framing`);
process.exit(fail ? 1 : 0);
