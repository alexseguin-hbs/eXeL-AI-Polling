// ARCHITECT-2525 · CROSS-TAB VARIABLE CONSISTENCY GATE (operator 2026-10-31: "ensure all tabs have variables double
// checked by 12 AsM so consistency on square footage etc through out all tabs" · "double check order of phases throughout
// for consistency" · "ensure code consistency for all of Architect-2525"). One source per variable; a variable with one
// meaning reads the same everywhere, or its difference is DECLARED (a catalog preset ≠ the canonical project).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-consistency.test.mjs
import fs from "node:fs";
import path from "node:path";
import { STOREY_FT, ROOM_FT, TINY_SIDE_FT, VOXEL_PX_PER_FT } from "@/lib/room-layout";
import { TINY_HOME, DEFAULT_PROGRAM } from "@/lib/room-program";
import { PHASE_ORDER, BUILD_PHASES, phaseById } from "@/lib/architect-phases";
import { modelById } from "@/lib/architect-sim-options";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");

// ── 1. ONE CEILING / STOREY CONSTANT (the ceiling-height drift the audit flagged: 10 vs 9 vs 8) ──
ok(STOREY_FT === 10 && ROOM_FT === 10 && TINY_HOME.ceilingFt === 10, `the storey is 10 ft in one place: STOREY_FT (${STOREY_FT}) = ROOM_FT (${ROOM_FT}) = TINY_HOME.ceilingFt (${TINY_HOME.ceilingFt})`);
const rd = read("../components/architect-2525/room-designer.tsx");
ok(/const N = ROOM_GRID; \/\/ 10/.test(rd), "the room designer's 10-ft room cube reads ROOM_GRID (one source)");
const vox = read("../components/architect-2525/voxel-house.tsx");
ok(/STOREY_FT \* VOXEL_PX_PER_FT/.test(vox) && VOXEL_PX_PER_FT === 66 / 30, "the voxel derives its storey height from STOREY_FT × VOXEL_PX_PER_FT (one source)");
// DEFAULT_PROGRAM.ceilingFt (9) is a DIFFERENT scope — the generic multi-style home program default, not the Tiny/canonical storey. Declared, not a drift.
ok(DEFAULT_PROGRAM.ceilingFt === 9, "DEFAULT_PROGRAM ceiling 9 ft is the generic-home default (a DECLARED different scope, not the Tiny storey)");
// NEGATIVE pin (AsM 2026-10-31, Aset V4): no THIRD ceiling/storey value may reappear in the geometry/voxel sources — only the
// two DECLARED scopes (10 ft canonical/Tiny · 9 ft generic-home). Catches a stray 8-ft ceiling re-entering while the suite is green.
const CEIL_RE = /(?:ceilingFt|storeyFt|STOREY_FT|wallHeightFt|WALL_H)\s*[=:]\s*(\d{1,2})\b/g;
for (const f of ["../lib/room-layout.ts", "../lib/room-program.ts", "../components/architect-2525/voxel-house.tsx"]) {
  const src = read(f); let mt; const bad = [];
  while ((mt = CEIL_RE.exec(src))) { const n = Number(mt[1]); if (n >= 6 && n <= 16 && n !== 10 && n !== 9) bad.push(`${n} @ "${mt[0].trim()}"`); }
  ok(bad.length === 0, `${f.replace("../", "")} carries no third ceiling/storey value (only 10 canonical/Tiny · 9 generic-home) — got ${bad.join(", ") || "none"}`);
}

// ── 2. ONE PHASE ORDER (operator: "double check order of phases throughout") ──
ok(PHASE_ORDER[0] === "foundation" && PHASE_ORDER[1] === "framing" && PHASE_ORDER[2] === "roofing", "the phase order starts Foundation → Framing → Roofing (roofing right after framing, not last)");
ok(phaseById("roofing").order === 3, "Roofing is phase 3, NOT 8 (operator 2026-10-31)");
ok(BUILD_PHASES.length === 10 && !BUILD_PHASES.some((p) => p.id === "interior"), "BUILD_PHASES = the 10 construction phases (Interior Design excluded — staging)");
// the Simulate schedule weights key only build phases, in the same order
const so = read("../lib/architect-sim-options.ts");
const pw = so.match(/const PHASE_WEIGHTS[\s\S]*?"stick-framed": \{([^}]*)\}/)[1];
const weightIds = pw.match(/(\w+):/g).map((x) => x.replace(":", ""));
const buildIds = BUILD_PHASES.map((p) => p.id);
ok(weightIds.every((id) => buildIds.includes(id)), `PHASE_WEIGHTS keys are all build phases (got ${weightIds.join(",")})`);
ok(JSON.stringify(weightIds.filter((id) => ["foundation", "framing", "roofing"].includes(id)).slice(0, 3)) === JSON.stringify(["foundation", "framing", "roofing"]), "PHASE_WEIGHTS lists foundation → framing → roofing in build order");
// build instructions roof after framing, before the MEP rough-ins
const bi = read("../lib/architect-build-instructions.ts");
const bo = bi.match(/export const BUILD_ORDER: ElementName\[\] = (\[[^\]]*\])/)[1];
const boArr = JSON.parse(bo.replace(/'/g, '"'));
ok(boArr.indexOf("Roofing") === boArr.indexOf("Framing") + 1 && boArr.indexOf("Roofing") < boArr.indexOf("Plumbing"), `build-instructions BUILD_ORDER roofs right after framing, before plumbing (${boArr.join(",")})`);

// ── 3. SQUARE FOOTAGE — scoped, never conflated (canonical 900 ≠ the Tiny catalog preset 280) ──
ok(TINY_HOME.grossSqft === 900 && TINY_SIDE_FT * TINY_SIDE_FT / 100 * 100 === 900 && TINY_SIDE_FT === 30, "the canonical nine-space plan is 900 ft² (30×30) — one source");
const tiny = modelById("tiny");
ok(!!tiny.catalogPreset && tiny.catalogPreset.mainFloorFt2 === 280 && tiny.areaFt2 === 280, "the Tiny catalog preset is 280 ft² main floor (a SEPARATE scope from the 900 ft² canonical)");
ok(tiny.catalogPreset.mainFloorFt2 !== TINY_HOME.grossSqft, "the preset's 280 ft² and the canonical 900 ft² are DECLARED different (preset ≠ canonical) — never conflated");

// ── 4. PRESET ISOLATION — the catalog presets never leak into the canonical readout (operator: "Do not write this preset into canonical geometry, project_hash, or R-CORE") ──
const cmd = read("../components/architect-2525/command-ux1.tsx");
const mr = read("../components/architect-2525/master-readout.tsx");
ok(!/architect-sim-options|SIM_MODELS/.test(cmd.split("PhaseBar")[0] ?? cmd) || !/SIM_MODELS/.test(mr), "the canonical readout does not read SIM_MODELS (the Simulate presets cannot leak into Budget Target / Project Cost)");
ok(/NOT CALCULATED/.test(cmd) && /Budget Target/.test(cmd), "the Overview keeps Budget Target + Project Cost NOT CALCULATED (canonical, untouched by the preset)");
ok(/REVIEWABLE/.test(mr) && /NOT CALCULATED/.test(mr), "the master readout keeps PLAN · REVIEWABLE · Project Cost NOT CALCULATED");

console.log(`\narchitect-consistency: ${pass} passed, ${fail} failed · one ceiling constant · one phase order · square footage scoped · presets isolated from canonical`);
process.exit(fail ? 1 : 0);
