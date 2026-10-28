// ARCHITECT-2525 · BUILD INSTRUCTIONS gate (operator 2026-10-28: "mock up of instructions for each phase with key metrics
// … measurements … project timelines … Cube 3×3, Tiny Home, Eco-Sphere (and 3D print of Eco-Sphere) to compare. Framing
// wood vs steel and aluminum … Hex Panels for Shell of Eco-Sphere"). Every build path yields six measured, crew-day-timed
// phases; the Framing/Shell phase is method-aware; every rule-of-thumb carries a verify-local-code flag; the four compare
// paths are present and the tiny home is the shortest.
import { buildInstructions, compareTimeline, COMPARE_PATHS, BUILD_ORDER, phaseLabel, CREW, DAYS_PER_WEEK } from "@/lib/architect-build-instructions";
import { SIM_MODELS, modelById, optFor } from "@/lib/architect-sim-options";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// the six element-phases in build order (dry-in before MEP)
ok(BUILD_ORDER.length === 6 && JSON.stringify(BUILD_ORDER) === JSON.stringify(["Foundation", "Framing", "Roofing", "Plumbing", "Electrical", "HVAC"]), "BUILD_ORDER = the six elements in build sequence");
ok(CREW === 4 && DAYS_PER_WEEK === 5, "crew-days assume a 4-person crew, 5 days/week (friends/family + paid help)");

// every SIM_MODEL at its native option yields a complete, well-formed, reconciling build plan
for (const m of SIM_MODELS) {
  const bi = buildInstructions(m.id);
  ok(bi.phases.length === 6 && JSON.stringify(bi.phases.map((p) => p.element)) === JSON.stringify(BUILD_ORDER), `${m.id} has the six phases in order`);
  let sum = 0, anyFlag = false;
  for (const ph of bi.phases) {
    ok(ph.steps.length >= 1, `${m.id} ${ph.element} has ≥1 step`);
    ok(ph.label && ph.label.length > 2, `${m.id} ${ph.element} has a label`);
    ph.steps.forEach((s, i) => {
      ok(s.n === i + 1, `${m.id} ${ph.element} step ${i + 1} numbered`);
      ok(s.title.length > 2 && s.measure.length > 5, `${m.id} ${ph.element} step ${s.n} has a title + a real measurement`);
      ok(Number.isFinite(s.crewDays) && s.crewDays > 0, `${m.id} ${ph.element} step ${s.n} has positive crew-days`);
      if (s.codeFlag) anyFlag = true;
    });
    ok(ph.crewDays === ph.steps.reduce((a, s) => a + s.crewDays, 0), `${m.id} ${ph.element} crewDays = Σ its steps`);
    sum += ph.crewDays;
  }
  ok(bi.totalCrewDays === sum, `${m.id} totalCrewDays = Σ phases (${bi.totalCrewDays})`);
  ok(bi.weeks > 0 && Math.abs(bi.weeks - Math.round((sum / (CREW * DAYS_PER_WEEK)) * 2) / 2) < 0.001, `${m.id} weeks derived from crew-days`);
  ok(anyFlag, `${m.id} carries at least one verify-local-code flag`);
  ok(/estimate/i.test(bi.note) && /code/i.test(bi.note), `${m.id} note says ESTIMATE + points to the adopted code`);
}

// the MEP + foundation phases must each flag where the buildable value really comes from (code / engineered calc)
for (const m of SIM_MODELS) {
  const bi = buildInstructions(m.id);
  for (const el of ["Foundation", "Plumbing", "Electrical", "HVAC"]) {
    const ph = bi.phases.find((p) => p.element === el);
    ok(ph.steps.some((s) => s.codeFlag), `${m.id} ${el} flags a code/engineered source`);
  }
}

// ── method-aware Framing/Shell label (wood vs steel vs aluminum · printed cement/composite · hex panels) ──
const grid = modelById("3x3-grid");
ok(/wood/i.test(phaseLabel("Framing", grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "wood" })), "stick wood → Framing · wood");
ok(/steel/i.test(phaseLabel("Framing", grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "steel" })), "stick steel → Framing · steel");
ok(/alum/i.test(phaseLabel("Framing", grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "aluminum" })), "stick aluminum → Framing · aluminum");
ok(/print|cement/i.test(phaseLabel("Framing", grid, { ...optFor(grid), method: "3d-print", printMaterial: "cement" })), "3D print → Shell · printed cement");
const eco = modelById("eco-sphere");
ok(/hex/i.test(phaseLabel("Framing", eco, optFor(eco))), "Eco hex-panel → Shell · hex panels");
ok(/roof/i.test(phaseLabel("Roofing", grid, optFor(grid))), "Roofing label names the roof");

// the frame material changes the Framing steps' measurements (wood ≠ steel ≠ aluminum)
const fWood = JSON.stringify(buildInstructions("3x3-grid", { ...optFor(grid), frameMaterial: "wood" }).phases.find((p) => p.element === "Framing"));
const fSteel = JSON.stringify(buildInstructions("3x3-grid", { ...optFor(grid), frameMaterial: "steel" }).phases.find((p) => p.element === "Framing"));
ok(fWood !== fSteel, "wood vs steel Framing steps differ (measurements + crew-days)");

// the tiny home is genuinely simpler — a ductless mini-split HVAC and fewer total crew-days than the Cube
const tinyBI = buildInstructions("tiny");
ok(tinyBI.phases.find((p) => p.element === "HVAC").steps.some((s) => /mini-split/i.test(s.measure)), "Tiny HVAC = ductless mini-split");
ok(tinyBI.totalCrewDays < buildInstructions("3x3-grid").totalCrewDays, "a tiny home takes fewer crew-days than the Cube");

// ── the FOUR compare paths (Cube 3×3 · Tiny · Eco hex-panel · Eco 3D-print cement) ──
ok(COMPARE_PATHS.length === 4, "four build paths to compare");
ok(JSON.stringify(COMPARE_PATHS.map((p) => p.id)) === JSON.stringify(["cube", "tiny", "eco-hex", "eco-print"]), "the four paths are Cube · Tiny · Eco hex-panel · Eco 3D-print");
const ecoHex = COMPARE_PATHS.find((p) => p.id === "eco-hex"), ecoPrint = COMPARE_PATHS.find((p) => p.id === "eco-print");
ok(ecoHex.option.method === "hex-panel" && ecoPrint.option.method === "3d-print" && ecoPrint.option.printMaterial === "cement", "the two Eco paths are hex-panel vs 3D-print cement");
const timeline = compareTimeline();
ok(timeline.length === 4, "compareTimeline returns four paths");
for (const t of timeline) {
  ok(t.perPhase.length === 6 && t.totalCrewDays > 0 && t.weeks > 0, `${t.id} timeline has six phases + totals`);
  ok(t.formId && t.option, `${t.id} carries formId + option for drill-down`);
  ok(t.totalCrewDays === buildInstructions(t.formId, t.option).totalCrewDays, `${t.id} timeline total matches its build plan`);
}
// the Eco hex-panel and 3D-print shells differ in the Framing phase (honest — two shell methods)
const hexFrame = timeline.find((t) => t.id === "eco-hex").perPhase.find((p) => p.element === "Framing").crewDays;
const printFrame = timeline.find((t) => t.id === "eco-print").perPhase.find((p) => p.element === "Framing").crewDays;
ok(hexFrame !== printFrame, "the Eco's hex-panel vs 3D-print shells take different crew-days (honest compare)");
ok(timeline.find((t) => t.id === "tiny").totalCrewDays === Math.min(...timeline.map((t) => t.totalCrewDays)), "the Tiny Home is the shortest build of the four");

// determinism (replay law)
ok(JSON.stringify(buildInstructions("eco-sphere")) === JSON.stringify(buildInstructions("eco-sphere")), "buildInstructions is deterministic");
ok(buildInstructions("nope").phases.length === 0, "unknown form → empty plan (no crash)");

console.log(`\narchitect-build-instructions: ${pass} passed, ${fail} failed · six measured phases × four build paths · method-aware · code-flagged`);
process.exit(fail ? 1 : 0);
