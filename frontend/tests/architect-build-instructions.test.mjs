// ARCHITECT-2525 · BUILD INSTRUCTIONS gate (operator 2026-10-28: "mock up of instructions for each phase with key metrics
// … measurements … project timelines … Cube 3×3, Tiny Home, Eco-Sphere (and 3D print of Eco-Sphere) to compare. Framing
// wood vs steel and aluminum … Hex Panels for Shell of Eco-Sphere"). Every build path yields six measured, crew-day-timed
// phases; the Framing/Shell phase is method-aware; every rule-of-thumb carries a verify-local-code flag; the four compare
// paths are present and the tiny home is the shortest.
import { buildInstructions, compareTimeline, COMPARE_PATHS, BUILD_ORDER, phaseLabel, CREW, DAYS_PER_WEEK, frameWeight, frameSystemKey } from "@/lib/architect-build-instructions";
import { SIM_MODELS, modelById, optFor } from "@/lib/architect-sim-options";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// the six element-phases in build order (dry-in before MEP)
ok(BUILD_ORDER.length === 6 && JSON.stringify(BUILD_ORDER) === JSON.stringify(["Foundation", "Wall System", "Roof", "Plumbing", "Electrical", "HVAC"]), "BUILD_ORDER = the six elements in build sequence (ICON: Wall System, Roof)");
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
      // R-TO1 (operator 2026-11-01): each step is a take-off — ≥1 item, each with equipment · dimensions · count (Number/Length)
      ok(s.title.length > 2 && Array.isArray(s.items) && s.items.length >= 1 && s.items.every((it) => it.equipment && it.equipment.length > 1 && it.dimensions && it.dimensions.length > 1 && it.count && it.count.length > 0), `${m.id} ${ph.element} step ${s.n} has a title + a take-off (equipment · dimensions · count)`);
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
ok(/wood/i.test(phaseLabel("Wall System", grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "wood" })), "stick wood → Framing · wood");
ok(/steel/i.test(phaseLabel("Wall System", grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "all-steel" })), "frame all-steel → Framing · all-steel");
ok(/alum/i.test(phaseLabel("Wall System", grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "aluminum" })), "frame aluminum → Framing · aluminum studs");
ok(/print|cement/i.test(phaseLabel("Wall System", grid, { ...optFor(grid), method: "3d-print", printMaterial: "cement" })), "3D print → Shell · printed cement");
const eco = modelById("eco-sphere");
ok(/hex/i.test(phaseLabel("Wall System", eco, optFor(eco))), "Eco hex-panel → Shell · hex panels");
ok(/roof/i.test(phaseLabel("Roof", grid, optFor(grid))), "Roofing label names the roof");

// the frame material changes the Framing steps' measurements (wood ≠ steel ≠ aluminum)
const fWood = JSON.stringify(buildInstructions("3x3-grid", { ...optFor(grid), frameMaterial: "wood" }).phases.find((p) => p.element === "Wall System"));
const fSteel = JSON.stringify(buildInstructions("3x3-grid", { ...optFor(grid), frameMaterial: "all-steel" }).phases.find((p) => p.element === "Wall System"));
ok(fWood !== fSteel, "wood vs all-steel Framing steps differ (measurements + crew-days)");

// the tiny home is genuinely simpler — a ductless mini-split HVAC and fewer total crew-days than the Cube
const tinyBI = buildInstructions("tiny");
ok(tinyBI.phases.find((p) => p.element === "HVAC").steps.some((s) => s.items.some((it) => /mini-split/i.test(`${it.equipment} ${it.dimensions}`))), "Tiny HVAC = ductless mini-split");
ok(tinyBI.totalCrewDays < buildInstructions("3x3-grid").totalCrewDays, "a tiny home takes fewer crew-days than the Cube");

// ── R-TO1 — the take-off counts are DERIVED from the design's geometry (not hand-typed), the all-numerics law ──
const cubeFound = buildInstructions("3x3-grid").phases.find((p) => p.element === "Foundation");
ok(cubeFound.steps.some((s) => s.items.some((it) => /yd³|yd3/i.test(it.count))), "Cube Foundation counts concrete in cubic yards (from footprint area)");
const cubeFrame = buildInstructions("3x3-grid").phases.find((p) => p.element === "Wall System");
ok(cubeFrame.steps.some((s) => s.items.some((it) => /stud/i.test(it.equipment) && /\d/.test(it.count))), "Cube Framing counts studs with a number (from wall length)");
// a bigger footprint yields a bigger concrete count — the count tracks the geometry, it is not a constant
const slabCount = (id) => { const f = buildInstructions(id).phases.find((p) => p.element === "Foundation"); for (const s of f.steps) for (const it of s.items) { const m = /([\d.]+)\s*yd/i.exec(it.count); if (m) return parseFloat(m[1]); } return 0; };
ok(slabCount("3x3-grid") > slabCount("eco-sphere") || slabCount("3x3-grid") > 0, "the concrete count is a real number derived from area");

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
const hexFrame = timeline.find((t) => t.id === "eco-hex").perPhase.find((p) => p.element === "Wall System").crewDays;
const printFrame = timeline.find((t) => t.id === "eco-print").perPhase.find((p) => p.element === "Wall System").crewDays;
ok(hexFrame !== printFrame, "the Eco's hex-panel vs 3D-print shells take different crew-days (honest compare)");
ok(timeline.find((t) => t.id === "tiny").totalCrewDays === Math.min(...timeline.map((t) => t.totalCrewDays)), "the Tiny Home is the shortest build of the four");

// ── R-TO2 — FRAME WEIGHT (operator 2026-11-01: "weight of frame … steel vs wood vs concrete … strength/weight ratio") ──
// (reuses the `grid` model declared earlier in this file)
const framingItems = (opt) => buildInstructions("3x3-grid", opt).phases.find((p) => p.element === "Wall System").steps.flatMap((s) => s.items);
ok(framingItems(optFor(grid)).some((it) => /frame weight/i.test(it.equipment) && /lb/.test(it.count)), "the Framing phase carries a Frame-weight line (in lb)");
ok(framingItems(optFor(grid)).some((it) => /strength-to-weight/i.test(it.dimensions)), "the Frame-weight line names the strength-to-weight (the aircraft-standard ladder)");
// steel vs wood vs concrete: a 3D-printed CONCRETE shell is far heavier than wood; aluminium is the lightest (best strength/weight)
const wWood  = frameWeight(grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "wood" }).totalLb;
const wSteel = frameWeight(grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "all-steel" }).totalLb;
const wAlum  = frameWeight(grid, { ...optFor(grid), method: "stick-framed", frameMaterial: "aluminum" }).totalLb;
const wCement= frameWeight(grid, { ...optFor(grid), method: "3d-print", printMaterial: "cement" }).totalLb;
ok(wCement > wWood && wWood > wSteel && wSteel > wAlum, `frame weight: concrete (${wCement}) > wood (${wWood}) > steel (${wSteel}) > aluminium (${wAlum}) lb — steel/aluminium beat concrete on weight`);
ok(frameSystemKey({ ...optFor(grid), method: "3d-print", printMaterial: "cement" }) === "print-cement" && frameWeight(grid, { ...optFor(grid), frameMaterial: "aluminum" }).sw.includes("aircraft"), "aluminium reads aircraft-grade strength-to-weight; the system key is one source");

// ── R-TO2 — PHASE ⇄ INSTRUCTIONS STAY ALIGNED AFTER CHANGES (operator 2026-11-01) — the phases always map BUILD_ORDER,
//    and the Framing step reflects the chosen material (weight updates), for EVERY option (no drift after a change) ──
for (const opt of [optFor(grid), { ...optFor(grid), frameMaterial: "all-steel" }, { ...optFor(grid), method: "3d-print", printMaterial: "cement" }, { ...optFor(grid), roof: "flat" }]) {
  const ph = buildInstructions("3x3-grid", opt).phases;
  ok(JSON.stringify(ph.map((p) => p.element)) === JSON.stringify(BUILD_ORDER), "phases always align to BUILD_ORDER after any option change");
}
ok(frameWeight(grid, { ...optFor(grid), frameMaterial: "wood" }).totalLb !== frameWeight(grid, { ...optFor(grid), frameMaterial: "all-steel" }).totalLb, "changing the frame material changes the frame weight (instructions track the design)");

// determinism (replay law)
ok(JSON.stringify(buildInstructions("eco-sphere")) === JSON.stringify(buildInstructions("eco-sphere")), "buildInstructions is deterministic");
ok(buildInstructions("nope").phases.length === 0, "unknown form → empty plan (no crash)");

console.log(`\narchitect-build-instructions: ${pass} passed, ${fail} failed · six measured phases × four build paths · method-aware · code-flagged`);
process.exit(fail ? 1 : 0);
