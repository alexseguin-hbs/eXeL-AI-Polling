// ARCHITECT-2525 · ICON WALL-SYSTEM STANDARD — the behavioral gate (operator 2026-11-02, ICON deck + MIT CSHub whitepaper).
// Locks ICON's nomenclature + numbers: the Wall System $/sq-ft composition (framing is ONE $21 line of the $35 wall),
// ICON $34/sq ft vs the $35 national average, the ratings (R-22 · 2+ hr fire · 250 MPH wind · termite/mold/flood),
// Carbon X (the low-carbon printed concrete — best carbon star), and the Phoenix printer (multi-story, 27′, 24,000 ft²).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-wall-system.test.mjs
import { WALL_SYSTEM_LAYERS, NATIONAL_AVG_WALL_USD_PER_SQFT, ICON_WALL_USD_PER_SQFT, ICON_WALL_SPECS, ICON_WALL_WIND_MPH, ICON_WALL_FIRE_HOURS, ICON_WALL_R_VALUE, ICON_PHOENIX, PHOENIX_WALL_USD_PER_SQFT, wallSystemTypicalPerSqFt, framingSharePerSqFt, iconWallSavingPerSqFt, phoenixMaxFloors } from "@/lib/architect-wall-system";
import { PRINT_MATERIALS, ELEMENTS, costFor, modelById, SIM_MODELS, elementCosts } from "@/lib/architect-sim-options";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── the Wall System $/sq-ft composition (ICON Typical Wall System) ──
const layerNames = WALL_SYSTEM_LAYERS.map((l) => l.layer);
ok(JSON.stringify(layerNames) === JSON.stringify(["Framing", "Dry Wall", "Sheathing", "Moisture Barrier", "Siding", "Trim"]), `the six wall layers in ICON order (got ${layerNames.join(", ")})`);
ok(wallSystemTypicalPerSqFt() === 35, `the typical wall system sums to $35/sq ft (got $${wallSystemTypicalPerSqFt()})`);
ok(framingSharePerSqFt() === 21, `framing is $21/sq ft — ONE line of the $35 wall system (got $${framingSharePerSqFt()})`);
ok(WALL_SYSTEM_LAYERS.filter((l) => l.isFraming).length === 1, "exactly one layer is marked the framing component");

// ── ICON $34 vs $35 national average ──
ok(NATIONAL_AVG_WALL_USD_PER_SQFT === 35, "national average = $35/sq ft");
ok(ICON_WALL_USD_PER_SQFT === 34, "ICON finished wall system = $34/sq ft (below the national average)");
ok(iconWallSavingPerSqFt() === 1, `ICON saves $1/sq ft vs the national average (got $${iconWallSavingPerSqFt()})`);
ok(ICON_WALL_USD_PER_SQFT < NATIONAL_AVG_WALL_USD_PER_SQFT, "ICON ($34) beats the national average ($35)");

// ── ratings (operator's latest slide: 250 MPH · 2+ hr · R-22) ──
ok(ICON_WALL_WIND_MPH === 250 && ICON_WALL_FIRE_HOURS === 2 && ICON_WALL_R_VALUE === 22, `ratings: 250 MPH · 2+ hr fire · R-22 (got ${ICON_WALL_WIND_MPH}/${ICON_WALL_FIRE_HOURS}/${ICON_WALL_R_VALUE})`);
ok(ICON_WALL_SPECS.includes("250 MPH Wind Rating") && ICON_WALL_SPECS.includes("2+ Hour Fire Rating") && ICON_WALL_SPECS.includes("R-22"), "the spec list carries the 250 MPH / 2+ hr / R-22 ratings");
ok(["Termite Proof", "Mold Resistant", "Flood Resilient"].every((s) => ICON_WALL_SPECS.includes(s)), "the spec list carries termite/mold/flood");

// ── Carbon X — the low-carbon printed concrete (the best carbon of the printed options) ──
ok(!!PRINT_MATERIALS["carbon-x"], "Carbon X is a selectable printed-concrete material");
ok(PRINT_MATERIALS["carbon-x"].carbonStar === 1, `Carbon X carbonStar = +1 — the best printed option (got ${PRINT_MATERIALS["carbon-x"].carbonStar})`);
ok(PRINT_MATERIALS["carbon-x"].carbonStar > PRINT_MATERIALS.cement.carbonStar, "Carbon X beats cement on carbon");
ok(PRINT_MATERIALS["carbon-x"].laborFactor === PRINT_MATERIALS.cement.laborFactor, "Carbon X keeps the big print labour saving (same laborFactor as cement)");
ok(/MIT CSHub|low-carbon/i.test(PRINT_MATERIALS["carbon-x"].blurb), "Carbon X cites its low-carbon basis (MIT CSHub × ICON)");

// ── the Phoenix printer — multi-story ──
ok(ICON_PHOENIX.name === "Phoenix" && ICON_PHOENIX.model === "D24", "the printer is the ICON Phoenix (D24)");
ok(ICON_PHOENIX.buildHeightFt === 27 && ICON_PHOENIX.footprintFt2 === 24000 && ICON_PHOENIX.setupHours === 3, `Phoenix: 27′ · 24,000 ft² · 3 hr setup (got ${ICON_PHOENIX.buildHeightFt}/${ICON_PHOENIX.footprintFt2}/${ICON_PHOENIX.setupHours})`);
ok(ICON_PHOENIX.maxFloors === 2 && phoenixMaxFloors() === 2, "Phoenix enables MULTI-STORY (two stories)");
ok(["Lower Cost", "Two Story", "Full Shell"].every((b) => ICON_PHOENIX.benefits.includes(b)), "Phoenix benefits: Lower Cost · Two Story · Full Shell");
// ── Phoenix printed-wall cost (operator 2026-11-02: "phoenix multi story is 25/sq ft") — the cheapest wall tier ──
ok(PHOENIX_WALL_USD_PER_SQFT === 25, `Phoenix printed walls = $25/sq ft (got $${PHOENIX_WALL_USD_PER_SQFT})`);
ok(ICON_PHOENIX.wallUsdPerSqFt === 25, `ICON_PHOENIX carries the $25/sq-ft printed wall (got $${ICON_PHOENIX.wallUsdPerSqFt})`);
ok(PHOENIX_WALL_USD_PER_SQFT < ICON_WALL_USD_PER_SQFT && ICON_WALL_USD_PER_SQFT < NATIONAL_AVG_WALL_USD_PER_SQFT, `$25 printed < $34 ICON < $35 national average (got ${PHOENIX_WALL_USD_PER_SQFT}/${ICON_WALL_USD_PER_SQFT}/${NATIONAL_AVG_WALL_USD_PER_SQFT})`);

// ── nomenclature flowed through: the cost ELEMENTS speak ICON, and the $240k one-cost-truth is intact ──
ok(ELEMENTS.includes("Wall System") && ELEMENTS.includes("Roof") && !ELEMENTS.includes("Framing") && !ELEMENTS.includes("Roofing"), `ELEMENTS use ICON names, no old Framing/Roofing (got ${ELEMENTS.join(", ")})`);
const cube = modelById("3x3-grid") ?? SIM_MODELS[0];
ok(costFor(cube, cube.native) === 240000, `the Cube still reconciles to $240,000 after the rename (got $${costFor(cube, cube.native)})`);
ok(!!elementCosts(cube, cube.native).find((e) => e.element === "Wall System"), "elementCosts exposes the Wall System line");

console.log(`\narchitect-wall-system: ${pass} passed, ${fail} failed · ICON standard: $35 wall (framing $21) · ICON $34 · 250/2+hr/R-22 · Carbon X · Phoenix multi-story · $240k intact`);
process.exit(fail ? 1 : 0);
