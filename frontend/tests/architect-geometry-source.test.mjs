// ARCHITECT-2525 · ONE GEOMETRY SOURCE — the 36×36 reference-house contradiction gate (H.I. 2026-11-08, binding).
// =====================================================================================================================
// The ruling: "One geometry source feeds plan drawing, dimensions, Overview, Design, Project Health, take-off, simulation,
// files and replay. A 30×30 shell is wrong and is removed." The canonical physical model is ONE house: a 12-ft outer
// module · 10-ft clear room · 1-ft reserved wall/service zone per side · 3×3 grid · 36×36 ft shell · 900 ft² clear ·
// 1,296 ft² gross · 396 ft² difference. This gate fails if any surface it covers re-introduces the old 30-as-shell, or if
// the one source drifts. It is SCOPED to R1a's displayed surfaces; the 3D voxel footprint (R1b) and the build-instructions
// take-off BASIS (R3) are explicitly allow-listed below, each with the revision that reconciles it.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-geometry-source.test.mjs
import fs from "node:fs";
import path from "node:path";
import { ROOM_FT, TINY_GRID, SHELL_FT, HOUSE_FT, HOUSE_H, TINY_SIDE_FT, CLEAR_SQFT, GROSS_SQFT, WALL_ZONE_SQFT, WALL_ZONE_PER_SIDE_FT } from "@/lib/room-layout";
import { TINY_HOME } from "@/lib/room-program";
import { canonicalHouseTruth } from "@/lib/architect-house-truth";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");   // judge RENDERED code, never comments

// ── 1. THE ONE SOURCE (lib/room-layout) ──
ok(ROOM_FT === 10 && TINY_GRID === 3 && SHELL_FT === 12, `room = 10 ft, grid 3×3, outer module 12 ft (got ${ROOM_FT}/${TINY_GRID}/${SHELL_FT})`);
ok(HOUSE_FT === 36 && HOUSE_FT === TINY_GRID * SHELL_FT, `house shell outline = 36 ft = 3 × 12 (got ${HOUSE_FT})`);
ok(HOUSE_H === 12, `one storey, 12-ft shell height (got ${HOUSE_H})`);
ok(WALL_ZONE_PER_SIDE_FT === 1, `1-ft reserved wall/service zone each side (got ${WALL_ZONE_PER_SIDE_FT})`);
ok(CLEAR_SQFT === 900 && GROSS_SQFT === 1296 && WALL_ZONE_SQFT === 396, `clear 900 · gross 1,296 · reserved zone 396 (got ${CLEAR_SQFT}/${GROSS_SQFT}/${WALL_ZONE_SQFT})`);
ok(GROSS_SQFT - CLEAR_SQFT === WALL_ZONE_SQFT && GROSS_SQFT === HOUSE_FT * HOUSE_FT, "gross − clear = reserved zone, and gross = shell²");
ok(TINY_SIDE_FT === 30, "TINY_SIDE_FT kept as the CLEAR interior span (3 × 10 ft) — not the shell");

// ── 2. THE MASTER HOUSE-TRUTH agrees (seed-derived) ──
const h = canonicalHouseTruth();
ok(h.netSqft === 900 && h.grossSqft === 1296, `house-truth net 900 / gross 1,296 (got ${h.netSqft}/${h.grossSqft})`);
ok(h.dims.shellWidthFt === 36 && h.dims.shellDepthFt === 36 && h.dims.cubeFt === 12 && h.dims.roomFt === 10, `house-truth shell 36×36 · cube 12 · room 10 (got ${h.dims.shellWidthFt}×${h.dims.shellDepthFt}/${h.dims.cubeFt}/${h.dims.roomFt})`);
ok(h.grossSqft === GROSS_SQFT && h.netSqft === CLEAR_SQFT, "house-truth and room-layout agree on gross + clear — one source");

// ── 3. THE PROGRAM (room-program TINY_HOME) agrees: gross = shell, usable = clear ──
ok(TINY_HOME.usableSqft === 900 && TINY_HOME.grossSqft === 1296 && TINY_HOME.footprintFt === 36, `TINY_HOME usable 900 / gross 1,296 / footprint 36 (got ${TINY_HOME.usableSqft}/${TINY_HOME.grossSqft}/${TINY_HOME.footprintFt})`);

// ── 4. THE DISPLAYED SURFACES read 36, never the old 30-as-shell (rendered code, comments stripped) ──
// 4a. 2D plan (tiny-floorplan): the dimension line reads HOUSE_FT; the old √-of-rooms dim (ROOM_FT*TINY_GRID) is gone.
const fp = strip(read("../components/architect-2525/tiny-floorplan.tsx"));
ok(/\$\{HOUSE_FT\}'-0"/.test(fp), "the 2D plan's overall dimension line reads ${HOUSE_FT}'-0\" (36'-0\")");
ok(!/ROOM_FT\s*\*\s*TINY_GRID/.test(fp), "the 2D plan no longer derives its shell dimension as ROOM_FT × TINY_GRID (= 30)");
ok(!/30'-0/.test(fp), "the 2D plan shows no literal 30'-0\" shell dimension");
ok(/SHELL_FT|HOUSE_FT/.test(fp) && /WALL_ZONE_PER_SIDE_FT/.test(fp), "the 2D plan draws from the one source (SHELL_FT/HOUSE_FT + the reserved zone)");

// 4b. Build 4D (architect-build): header + slab read HOUSE_FT/GROSS_SQFT; the old TINY_SIDE_FT-as-shell is gone.
const bld = strip(read("../components/architect-2525/architect-build.tsx"));
ok(/\{HOUSE_FT\}×\{HOUSE_FT\}/.test(bld), "the Build header reads {HOUSE_FT}×{HOUSE_FT} (36×36)");
ok(/GROSS_SQFT/.test(bld) && /slab \{HOUSE_FT\}×\{HOUSE_FT\}/.test(bld), "the Build shows the 1,296 ft² gross + a 36×36 slab");
ok(!/TINY_SIDE_FT/.test(bld), "the Build no longer uses TINY_SIDE_FT (the 30-as-shell) for any displayed dimension");

// 4c. Overview (command-ux1): the Gross Building Area tile is computed (GROSS_SQFT), not the old "NOT CALCULATED".
const cmd = strip(read("../components/architect-2525/command-ux1.tsx"));
ok(/Gross Building Area"\s+value=\{`\$\{GROSS_SQFT/.test(cmd), "the Overview 'Gross Building Area' tile reads GROSS_SQFT (1,296 ft²)");
ok(!/Gross Building Area"\s+value="NOT CALCULATED"/.test(cmd), "the Overview 'Gross Building Area' tile is no longer a hardcoded NOT CALCULATED");

// 4d. Metric strip: "Sq Ft" is the living (clear) area (usableSqft), not the mislabeled gross.
const ms = strip(read("../components/architect-2525/metric-strip.tsx"));
ok(/label: "Sq Ft", value: m\.usableSqft/.test(ms), "the metric strip's 'Sq Ft' reads the living (usable/clear) area");

// ── 5. THE 3D VOXEL now reads the 36-ft shell too (R1b — done) ──
const vx = strip(read("../components/architect-2525/voxel-house.tsx"));
ok(/const cell = Math\.round\(HOUSE_FT \* VOXEL_PX_PER_FT\)/.test(vx), "the 3D voxel's house footprint is the 36-ft shell (HOUSE_FT), not the old 30-ft envelope");
ok(!/TINY_SIDE_FT/.test(vx), "the 3D voxel no longer references TINY_SIDE_FT (the 30-ft envelope) at all");
ok(/36×36×12 one-storey shell/.test(vx), "the 3D voxel names the 36×36×12 one-storey shell");

// ── 6. STAGED ALLOW-LIST (honest scope) — the one number still clear-area-derived, by design, until R3 ──
// R3: the build-instructions take-off BASIS (formGeometry side = √clear-area) still yields 30 for quantities, not a
//     displayed dimension; the BOM/take-off unification re-seats it on the 36 shell in R3. This comment IS the allow-list
//     of record; the gate deliberately does not scan formGeometry's `side`.
ok(true, "staged allow-list recorded: take-off basis → R3 (not a displayed shell dimension)");

console.log(`\narchitect-geometry-source: ${pass} passed, ${fail} failed · one 36×36 geometry source on every displayed surface`);
process.exit(fail ? 1 : 0);
