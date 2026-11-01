// ARCHITECT-2525 · LOAD-BEARING gate (operator 2026-11-01: "load bearing calcs must also be done in structural/framing
// elements"). A SCREENING structural check in lib/architect-load-bearing: gravity load down a stud (roof DL + roof live +
// wall self-weight [+ upper floor]) vs the allowable axial capacity of a 2×4 / 2×6 stud → D/C; and the header over an
// opening span. Every number names its public source (ASCE 7-22 · IRC 2021 · NDS 2018).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-load-bearing.test.mjs
import { loadBearing, headerFor, framingLoadReport, LOADS, STUD_CAPACITY, STUD_SPACING_FT } from "@/lib/architect-load-bearing";
import { SIM_MODELS, modelById } from "@/lib/architect-sim-options";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, e) => Math.abs(a - b) <= e;

const cube = modelById("cube") ?? SIM_MODELS[0];

// ── loads + capacities carry a public source ──
ok(LOADS.roofDeadPsf === 15 && LOADS.roofLivePsf === 20 && LOADS.wallDeadPsf === 8 && LOADS.floorLivePsf === 40, "design loads are the public minimums (roof DL 15 · roof LL 20 · wall 8 · floor 40 psf)");
ok(STUD_CAPACITY["2x6"].lb > STUD_CAPACITY["2x4"].lb, "a 2×6 stud carries more than a 2×4 (2900 > 1500 lb)");
ok(near(STUD_SPACING_FT, 16 / 12, 0.001), "studs at 16\" on-centre");

// ── the gravity screen on the 3×3 ──
{
  const b6 = loadBearing(cube, "2x6");
  const b4 = loadBearing(cube, "2x4");
  ok(b6.tribWidthFt > 1.3 && b6.tribWidthFt < 1.34, "tributary width = 16\" o.c. (1.333 ft)");
  ok(b6.tribRoofFt > 0 && b6.roofLoadLb > 0 && b6.wallLoadLb > 0, "roof + wall loads are positive");
  ok(b6.demandLb === b6.roofLoadLb + b6.wallLoadLb + b6.floorLoadLb, "demand = roof + wall + floor (adds up)");
  ok(b6.floorLoadLb === 0, "single storey → no upper-floor load");
  ok(b6.dcr === Math.round((b6.demandLb / b6.capacityLb) * 1000) / 1000, "D/C = demand ÷ capacity");
  ok(b6.pass && b6.dcr <= 1.0, `the 3×3 PASSES on 2×6 (D/C ${b6.dcr} ≤ 1.0, ${b6.marginPct}% spare)`);
  ok(b4.dcr > b6.dcr, "a 2×4 works harder than a 2×6 (higher D/C)");
  ok(b6.source.includes("ASCE 7-22") && b6.source.includes("NDS 2018"), "the screen names its sources");
}

// ── an upper storey raises the demand (load-bearing responds to storeys) ──
{
  const one = loadBearing(cube, "2x6", 1);
  const two = loadBearing(cube, "2x6", 2);
  ok(two.demandLb > one.demandLb && two.floorLoadLb > 0, "a second storey adds floor live load → higher demand");
}

// ── header sizing by span (IRC R602.7 prescriptive bands) ──
ok(headerFor(3).header === "(2) 2×6" && headerFor(6).header === "(2) 2×8" && headerFor(8).header === "(2) 2×10", "header grows with the opening span (3ft→2×6 · 6ft→2×8 · 8ft→2×10)");
ok(headerFor(12).header.includes("engineered"), "a span over 10 ft needs an engineered beam");
ok(headerFor(6).source.includes("IRC 2021 R602.7"), "the header names its code source");

// ── the framing report + determinism + all forms ──
{
  const r = framingLoadReport(cube);
  ok(r.bearing2x4 && r.bearing2x6 && (r.recommended === "2x4" || r.recommended === "2x6"), "the framing report checks both gauges + recommends one");
  ok(r.header.spanFt === r.widestOpeningFt, "the report sizes the header for the widest opening");
  ok(JSON.stringify(framingLoadReport(cube)) === JSON.stringify(r), "framingLoadReport is deterministic");
}
for (const m of SIM_MODELS) {
  const b = loadBearing(m, "2x6");
  ok(b.demandLb > 0 && b.capacityLb > 0 && typeof b.pass === "boolean", `${m.id}: load-bearing screen computes a demand, capacity and pass/flag`);
}

console.log(`\narchitect-load-bearing: ${pass} passed, ${fail} failed · stud axial D/C + header span, sourced (ASCE·IRC·NDS)`);
process.exit(fail ? 1 : 0);
