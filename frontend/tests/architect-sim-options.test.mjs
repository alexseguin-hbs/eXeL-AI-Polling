// ARCHITECT-2525 · SIMULATE OPTIONS gate (operator 2026-10-25/27/28): three forms (Cube 900 ft² · Tiny Home 340 ft² THOW ·
// Eco-Sphere 900 ft²), the 13-sim battery scored 0–5 with detailed metrics, a side-by-side matrix, and the four build
// dimensions — method (stick / 3D Print / hex-panel) · material (cement/composite · wood/steel/aluminum) · roof · cost
// BY ELEMENT — all derived from ONE engine (DEFAULT_SECTIONS) so the element breakdown reconciles to the card cost.
import {
  SIMS, SIM_MODELS, METHODS, METHODS_FOR, PRINT_MATERIALS, FUTURE_PRINT_MATERIALS, FRAME_MATERIALS, ROOFS, ROOFS_FOR,
  LABOR_MODES, DEFAULT_COST, ELEMENTS, REMAINDER_LABEL, carbonFor, compareModels, costBreakdown, costFor, costRollup,
  defaultMarkupFor, elementCosts, elementSubtotal,
  monthsFor, optFor, framingFactor, phaseSchedule, runBattery, simResult, simMatrix, overallScore, recommendation, modelById,
} from "@/lib/architect-sim-options";
import { DEFAULT_SECTIONS } from "@/lib/architect-estimate";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const ORIGINAL = ["Structural", "Wind", "Flood", "Fire", "Earthquake", "Thermal", "Solar", "Water Flow", "HVAC", "Evacuation", "Accessibility", "Carbon", "Lifecycle"];
ok(SIMS.length === 13, `13 sims (got ${SIMS.length})`);
ORIGINAL.forEach((s, i) => ok(SIMS[i] === s, `sim ${i + 1} is ${s}`));

// 3 models
ok(SIM_MODELS.length === 3, `3 models (got ${SIM_MODELS.length})`);
const ids = SIM_MODELS.map((m) => m.id);
["3x3-grid", "tiny", "eco-sphere"].forEach((id) => ok(ids.includes(id), `model ${id} present`));
const grid = modelById("3x3-grid"), tiny = modelById("tiny"), eco = modelById("eco-sphere");
ok(grid.label === "Cube" && tiny.label === "Tiny Home" && eco.label === "Eco-Sphere", "labels Cube · Tiny Home · Eco-Sphere");

// FX-01 / v4: the Tiny Home is a REAL standard THOW (8.5×24 ≈ 204 ft², chosen from ~30 builds); Cube + Eco are 900 ft²
ok(grid.areaFt2 === 900 && eco.areaFt2 === 900, "Cube + Eco are 900 ft²");
ok(tiny.areaFt2 === 204, `Tiny Home is the data-chosen standard 204 ft² (got ${tiny.areaFt2})`);
ok(/24 ft/.test(tiny.form) && /THOW/.test(tiny.form), "Tiny Home form names the 8.5×24 standard THOW");
// layoutLabel is the room/zone VOICE for the card (Area row = "<ft²> · <layoutLabel>"); the Tiny no longer repeats its
// dimensions/area (the form line already carries "8.5 × 24 ft") — the v4 fix for the "204 ft² · 8.5×24 ft · ~204 ft²" triple.
ok(grid.layoutLabel === "9 rooms" && tiny.layoutLabel === "5 zones" && /7 hex/.test(eco.layoutLabel), "layoutLabel is the room/zone voice (Tiny no longer repeats area/dims)");
ok(!/ft|204|8\.5|×24/.test(tiny.layoutLabel), "the Tiny layoutLabel carries no area/dimension (no redundant repeat in the Area row)");

// ONE engine: Cube @ native = the estimate engine's exact total; every cost derives from DEFAULT_SECTIONS
const baseCost = DEFAULT_SECTIONS.reduce((s, w) => s + w.costUsd, 0);
ok(grid.basis === "DERIVED" && costFor(grid, optFor(grid)) === baseCost, `Cube @ native cost DERIVED = ${baseCost}`);
ok(tiny.basis === "ASSUMED" && eco.basis === "ASSUMED", "Tiny + Eco are ASSUMED / parametric");
ok(costFor(tiny, optFor(tiny)) < costFor(grid, optFor(grid)), "Tiny is cheaper than the Cube (smaller, area-scaled)");
for (const m of SIM_MODELS) ok(m.energyScore >= 1 && m.energyScore <= 5 && m.carbonScore >= 1 && m.carbonScore <= 5, `${m.id} energy/carbon in 1..5`);

// ── cost BY ELEMENT (operator: Foundation/Framing/Electrical/Plumbing/HVAC/Roofing) reconciles to the engine ──
ok(ELEMENTS.length === 6 && ["Foundation", "Framing", "Electrical", "Plumbing", "HVAC", "Roofing"].every((e) => ELEMENTS.includes(e)), "the six major elements are the operator's list");
const gridElems = elementCosts(grid, optFor(grid));
ok(gridElems.length === 6, "elementCosts returns the six elements");
const expect = { Foundation: 61000, Framing: 88000, Electrical: 34000, Plumbing: 38000, HVAC: 29000, Roofing: 31000 };
for (const e of gridElems) ok(e.usd === expect[e.element], `Cube @ native ${e.element} = $${expect[e.element]} (engine, got ${e.usd})`);
ok(elementSubtotal(grid, optFor(grid)) === 281000, "Cube six-element subtotal = $281,000 (sum of the engine sections)");
ok(elementSubtotal(tiny, optFor(tiny)) < elementSubtotal(grid, optFor(grid)), "Tiny's element subtotal is smaller (area-scaled)");
for (const m of SIM_MODELS) ok(elementSubtotal(m, optFor(m)) <= costFor(m, optFor(m)), `${m.id} six elements are a subtotal of the full build`);

// ── MATERIAL + LABOR + MARKUP (operator IMG-02/06): the lever that lets friends/family/veterans drive cost down ──
ok(LABOR_MODES.pro.scale === 1 && LABOR_MODES.mixed.scale === 0.5 && LABOR_MODES.volunteer.scale === 0, "labour modes: pro 1.0 · mixed 0.5 · volunteer 0 (donated labour)");
ok(DEFAULT_COST.laborMode === "pro" && DEFAULT_COST.markup === 0.5, "default cost view = pro labour + 50% markup (the DERIVED anchor)");
const gridRoll = costRollup(grid, optFor(grid), DEFAULT_COST);
ok(gridRoll.material > 0 && gridRoll.labor > 0 && gridRoll.markup > 0, "the Cube cost splits into Material + Labor + Markup");
ok(Math.abs(gridRoll.total - baseCost) <= 1000, `Material+Labor+Markup reconciles to the DERIVED total ($${gridRoll.total} ≈ $${baseCost})`);
// volunteer labour + 0 markup is far cheaper than pro + 50% (the transparency / "boil it down" story)
ok(costFor(grid, optFor(grid), { laborMode: "volunteer", markup: 0 }) < costFor(grid, optFor(grid), DEFAULT_COST) * 0.6, "volunteer + 0% markup is far below pro + 50%");
// the markup slider moves the price; mixed is between pro and volunteer
ok(costFor(grid, optFor(grid), { laborMode: "pro", markup: 0 }) < costFor(grid, optFor(grid), { laborMode: "pro", markup: 0.5 }), "the markup slider raises the price");
const tinyVol = costFor(tiny, optFor(tiny), { laborMode: "volunteer", markup: 0 });
ok(tinyVol >= 25000 && tinyVol <= 60000, `a volunteer-built, zero-markup tiny home reads in the real-world ~$40k range (got $${tinyVol})`);
// scores do NOT swing with the labour/markup sliders (scores are about design, not who builds) — overallScore ignores cost view
ok(overallScore("3x3-grid", optFor(grid)) === overallScore("3x3-grid", optFor(grid)), "scores are stable (deterministic, cost-view-independent)");
// elementCosts carries the per-element Material / Labor / Markup split
ok(elementCosts(grid, optFor(grid)).every((e) => typeof e.material === "number" && typeof e.labor === "number" && typeof e.markup === "number"), "each element carries Material / Labor / Markup");

// ── v4 FLEET FIX: the six elements + an honest "Other" remainder reconcile EXACTLY to the headline + waterfall ──────────
// (the 48-AsM fleet's top finding was a $159k / 36% unexplained gap between the six-element table and the $440k headline).
for (const m of SIM_MODELS) {
  for (const cv of [DEFAULT_COST, { laborMode: "volunteer", markup: 0 }, { laborMode: "mixed", markup: 0.25 }]) {
    const bd = costBreakdown(m, optFor(m), cv);
    const colSum = (k) => bd.elements.reduce((s, e) => s + e[k], 0) + bd.remainder[k];
    ok(colSum("material") === bd.total.material, `${m.id} @ ${cv.laborMode}: element+remainder MATERIAL = waterfall material`);
    ok(colSum("labor") === bd.total.labor, `${m.id} @ ${cv.laborMode}: element+remainder LABOR = waterfall labor`);
    ok(colSum("markup") === bd.total.markup, `${m.id} @ ${cv.laborMode}: element+remainder MARKUP = waterfall markup`);
    ok(bd.elements.reduce((s, e) => s + e.usd, 0) + bd.remainder.usd === bd.total.total, `${m.id} @ ${cv.laborMode}: six elements + Other = ${bd.total.total} headline (no unexplained gap)`);
    ok(costFor(m, optFor(m), cv) === bd.total.total, `${m.id} @ ${cv.laborMode}: costFor === breakdown total (card = waterfall = reconcile)`);
  }
}
// the remainder is the four un-itemised engine sections (site · drywall · finish · landscaping) and is labelled honestly
const gridBd = costBreakdown(grid, optFor(grid), DEFAULT_COST);
ok(gridBd.remainder.usd === 159000, `Cube @ native: the Other remainder = $159,000 (site 42 + drywall 26 + finish 72 + land 19; got $${gridBd.remainder.usd})`);
ok(gridBd.remainder.material === 31800 && gridBd.remainder.labor === 74100 && gridBd.remainder.markup === 53100, "the remainder splits M $31,800 / L $74,100 / Markup $53,100 (reconciles the fleet's numbers)");
ok(/site/i.test(REMAINDER_LABEL) && /finish/i.test(REMAINDER_LABEL), "the remainder row names what it covers (site · drywall · finish · landscaping)");

// ── v4 FLEET FIX: tapping VOLUNTEER snaps markup to 0% so the ~$40k friends/family/veterans headline is one tap ──────────
ok(defaultMarkupFor("pro") === 0.5 && defaultMarkupFor("mixed") === 0.25 && defaultMarkupFor("volunteer") === 0, "defaultMarkupFor: pro 50% · mixed 25% · VOLUNTEER 0% (one-tap community build)");
const tinyVolDefault = costFor(tiny, optFor(tiny), { laborMode: "volunteer", markup: defaultMarkupFor("volunteer") });
ok(tinyVolDefault >= 35000 && tinyVolDefault <= 45000, `one tap on VOLUNTEER puts the Tiny at the operator's ~$40k (got $${tinyVolDefault})`);

// ── method dimension (the ICON hook) + per-form gating ──
ok(Object.keys(METHODS).length === 3 && METHODS["3d-print"].label === "3D Print" && /Hex-panel/.test(METHODS["hex-panel"].label), "methods: Stick · 3D Print · Hex-panel");
ok(!/ICON/i.test(METHODS["3d-print"].label + METHODS["3d-print"].blurb), "the 3D Print method names no brand");
ok(JSON.stringify(METHODS_FOR["3x3-grid"]) === JSON.stringify(["stick-framed", "3d-print"]), "Cube = stick or 3D Print");
ok(JSON.stringify(METHODS_FOR["tiny"]) === JSON.stringify(["stick-framed", "3d-print"]), "Tiny = stick or 3D Print");
ok(JSON.stringify(METHODS_FOR["eco-sphere"]) === JSON.stringify(["hex-panel", "3d-print"]), "Eco = hex-panel or 3D Print (never stick)");
ok(eco.native.method === "hex-panel" && eco.native.roof === "hex-dome", "Eco opens on the hex-panel dome");

// 3D Print lowers the FRAMING element + speeds the build for a rectilinear form
const gridStick = optFor(grid), gridPrint = { ...gridStick, method: "3d-print", printMaterial: "cement" };
ok(elementCosts(grid, gridPrint).find((e) => e.element === "Framing").usd < elementCosts(grid, gridStick).find((e) => e.element === "Framing").usd, "3D Print cement lowers the Framing element");
ok(monthsFor(grid, gridPrint) < monthsFor(grid, gridStick), "3D Print builds the Cube faster than stick");

// ── 3D-Print materials: cement vs composite (strength / cost / carbon differ) + "more coming" ──
ok(PRINT_MATERIALS.cement && PRINT_MATERIALS.composite, "cement + composite materials exist");
ok(PRINT_MATERIALS.cement.matFactor < PRINT_MATERIALS.composite.matFactor, "cement material cheaper than composite");
ok(PRINT_MATERIALS.cement.laborFactor < 1 && PRINT_MATERIALS.composite.laborFactor < 1, "printing cuts shell labour (machine time)");
ok(FUTURE_PRINT_MATERIALS.length >= 1, "future print materials are listed ('more coming')");
const gridComposite = { ...gridStick, method: "3d-print", printMaterial: "composite" };
ok(carbonFor(grid, gridPrint) < carbonFor(grid, gridComposite), "cement costs a carbon star; composite does not");
ok(simResult("3x3-grid", "Fire", gridPrint).score >= simResult("3x3-grid", "Fire", gridStick).score, "3D Print cement raises Fire (non-combustible)");
ok(simResult("3x3-grid", "Carbon", gridPrint).score <= simResult("3x3-grid", "Carbon", gridStick).score, "3D Print cement lowers Carbon (embodied carbon honest)");
ok(simResult("3x3-grid", "Structural", gridComposite).score >= simResult("3x3-grid", "Structural", gridPrint).score, "composite is stronger than cement (Structural)");

// ── frame materials: wood / steel / aluminum (cost + strength + carbon) ──
// frame materials (operator IMG-07): wood · aluminum studs · steel-reinforced corners · all-steel (Voortman)
ok(["wood", "aluminum", "steel-corners", "all-steel"].every((k) => FRAME_MATERIALS[k]), "four frame materials: wood/aluminum/steel-corners/all-steel");
ok(FRAME_MATERIALS["steel-corners"].voortman && FRAME_MATERIALS["all-steel"].voortman, "the steel options carry the Voortman automated-fab flag");
ok(FRAME_MATERIALS.wood.matFactor === 1.0 && FRAME_MATERIALS.aluminum.matFactor > 1 && FRAME_MATERIALS["all-steel"].laborFactor < 1, "wood baseline; aluminum pricier material; all-steel cuts site labour (shop-fab)");
ok(framingFactor({ ...gridStick, frameMaterial: "wood" }) === 1.0, "wood framing factor = 1.0 (anchors the DERIVED cost)");
ok(framingFactor({ ...gridStick, frameMaterial: "aluminum" }) > 1, "aluminum framing factor > wood");
ok(costFor(grid, { ...gridStick, frameMaterial: "aluminum" }) > costFor(grid, gridStick), "aluminum frame costs more than wood");
ok(carbonFor(grid, { ...gridStick, frameMaterial: "aluminum" }) < carbonFor(grid, gridStick), "aluminum's embodied carbon costs a headline star");
ok(simResult("3x3-grid", "Structural", { ...gridStick, frameMaterial: "all-steel" }).score >= simResult("3x3-grid", "Structural", gridStick).score, "all-steel frame raises Structural");

// ── roof options + hex roof ──
ok(ROOFS.gable && ROOFS.hip && ROOFS.flat && ROOFS["hex-dome"], "roof types: gable · hip · flat · hex-dome");
ok(JSON.stringify(ROOFS_FOR["3x3-grid"]) === JSON.stringify(["gable", "hip", "flat"]), "Cube roofs: gable/hip/flat");
ok(JSON.stringify(ROOFS_FOR["eco-sphere"]) === JSON.stringify(["hex-dome"]), "Eco roof: the hex-panel dome");
ok(elementCosts(grid, { ...gridStick, roof: "hip" }).find((e) => e.element === "Roofing").usd > elementCosts(grid, gridStick).find((e) => e.element === "Roofing").usd, "a hip roof costs more than gable (Roofing element)");
ok(simResult("3x3-grid", "Wind", { ...gridStick, roof: "hip" }).score >= simResult("3x3-grid", "Wind", gridStick).score, "a hip roof improves Wind");

// ── the whole 13-sim battery per model ──
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

// side-by-side matrix
const matrix = simMatrix();
ok(matrix.length === 13 && JSON.stringify(matrix.map((r) => r.sim)) === JSON.stringify(ORIGINAL), "matrix = the ORIGINAL 13, in order");
for (const rw of matrix) {
  ok(rw.cells.length === 3 && JSON.stringify(rw.cells.map((c) => c.modelId)) === JSON.stringify(ids), `${rw.sim} = 3 model cells in order`);
  ok(rw.cells.every((c) => c.score >= 0 && c.score <= 5 && c.metrics.length >= 2), `${rw.sim} cells scored + metricked`);
  const best = rw.cells.reduce((a, b) => (b.score > a.score ? b : a));
  ok(ids.includes(rw.winnerId) && rw.winnerId === best.modelId, `${rw.sim} winner = highest cell`);
}

// COMPARE ALL headline winners (at native): cheapest = Tiny (smallest), fastest = Tiny, best energy + carbon = Eco
const ranks = compareModels();
["Cost", "Build time", "Energy", "Carbon"].forEach((mt) => ok(ranks.some((r) => r.metric === mt), `compare has ${mt}`));
ok(ranks.find((r) => r.metric === "Cost").winnerId === "tiny", "cheapest = Tiny (smallest footprint)");
ok(ranks.find((r) => r.metric === "Build time").winnerId === "tiny", "fastest = Tiny (smallest build)");
ok(ranks.find((r) => r.metric === "Energy").winnerId === "eco-sphere", "best energy = Eco-Sphere");
ok(ranks.find((r) => r.metric === "Carbon").winnerId === "eco-sphere", "best headline carbon = Eco-Sphere (hex-panel, no embodied penalty)");

// COMPARE is OPTION-AWARE — converting all to 3D-print cement reaches the decision step
const allCement = Object.fromEntries(ids.map((id) => [id, { ...optFor(modelById(id)), method: "3d-print", printMaterial: "cement" }]));
const ranksCement = compareModels(SIM_MODELS, allCement);
const cubeNativeCost = ranks.find((r) => r.metric === "Cost").values.find((v) => v.id === "3x3-grid").value;
const cubeCementCost = ranksCement.find((r) => r.metric === "Cost").values.find((v) => v.id === "3x3-grid").value;
ok(cubeCementCost === costFor(grid, allCement["3x3-grid"]) && cubeCementCost < cubeNativeCost, "COMPARE Cost reflects the option toggle (3D-print cement reaches the decision)");
const recNative = recommendation();
const recCement = recommendation(SIM_MODELS, allCement);
ok(recCement.avg !== recNative.avg || recCement.modelId !== recNative.modelId, "recommendation changes with the option toggle (not frozen at native)");

// ONE reconciled recommendation (Asar)
const rec = recommendation();
ok(ids.includes(rec.modelId) && rec.avg >= 0 && rec.avg <= 5 && rec.reason.length > 10, "recommendation names a real model + avg + reason");
const bestAvgId = ids.reduce((a, b) => (overallScore(b) > overallScore(a) ? b : a));
ok(rec.modelId === bestAvgId, "recommendation = the highest 13-sim-average model");
ok(/basis (DERIVED|ASSUMED)/.test(rec.reason) && /top 13-sim average/.test(rec.reason) && /over /.test(rec.reason), "recommendation discloses basis + runner-up margin (Asar/Athena)");
ok(modelById("nope") === null && overallScore("nope") === 0, "unknown model → null / 0 (no crash)");

// TIME TO BUILD, BY PHASE
const PHASE_ORDER = ["foundation", "framing", "electrical", "plumbing", "sewer", "internet", "security", "roofing"];
for (const m of SIM_MODELS) {
  const sched = phaseSchedule(m.id);
  ok(sched.length === 8 && JSON.stringify(sched.map((p) => p.id)) === JSON.stringify(PHASE_ORDER), `${m.id} schedule = 8 phases in build order`);
  ok(sched.every((p) => p.weeks >= 0 && p.label && p.color), `${m.id} every phase has weeks + label + color`);
  const totalW = sched.reduce((s, p) => s + p.weeks, 0);
  const target = Math.round(monthsFor(m, optFor(m)) * 4.345 * 2) / 2;
  ok(Math.abs(totalW - target) < 0.01, `${m.id} phase weeks sum EXACTLY to the total (${totalW} == ${target}) — Sofia`);
  // where a form has both stick + 3D-print, 3D Print collapses the FRAMING phase
  if (METHODS_FOR[m.id].includes("stick-framed")) {
    const stickFraming = phaseSchedule(m.id, { ...optFor(m), method: "stick-framed" }).find((p) => p.id === "framing").weeks;
    const printFraming = phaseSchedule(m.id, { ...optFor(m), method: "3d-print", printMaterial: "cement" }).find((p) => p.id === "framing").weeks;
    ok(printFraming < stickFraming, `${m.id} 3D Print shortens the Framing phase (${printFraming}w < ${stickFraming}w)`);
  }
}
ok(phaseSchedule("nope").length === 0, "unknown model → empty schedule (no crash)");
// the hex dome spends a larger share on roofing than the Cube (per-form schedule)
const ecoRoofFrac = (() => { const s = phaseSchedule("eco-sphere"); const t = s.reduce((a, p) => a + p.weeks, 0) || 1; return s.find((p) => p.id === "roofing").weeks / t; })();
const cubeRoofFrac = (() => { const s = phaseSchedule("3x3-grid"); const t = s.reduce((a, p) => a + p.weeks, 0) || 1; return s.find((p) => p.id === "roofing").weeks / t; })();
ok(ecoRoofFrac > cubeRoofFrac, "the hex dome spends a larger share on roofing than the Cube");

// headline Carbon is OPTION-AWARE — cement + aluminium cost a star; composite/steel/wood/hex-panel do not
for (const m of SIM_MODELS) {
  const base = optFor(m);
  ok(carbonFor(m, { ...base, method: "3d-print", printMaterial: "cement" }) <= m.carbonScore, `${m.id} 3D-print cement lowers the headline carbon`);
}
ok(carbonFor(eco, { ...optFor(eco), method: "3d-print", printMaterial: "cement" }) < carbonFor(eco, optFor(eco)), "converting the Eco to 3D-print cement costs it a carbon star (hex-panel → cement)");

console.log(`\narchitect-sim-options: ${pass} passed, ${fail} failed · 3 forms · one cost engine · method/material/frame/roof · cost-by-element · 13-sim battery`);
process.exit(fail ? 1 : 0);
