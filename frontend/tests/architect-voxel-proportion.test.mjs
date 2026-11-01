// ARCHITECT-2525 · THE VOXEL PROPORTION LAW (operator 2026-10-31: "remember voxel pixel height and width for 3x3x3 is to be
// realistically proportional"; and 2026-10-25: "3x3x3 shape is same pixels tall, wide, and long"). Both hold under one reading:
// the 3×3×3 cube is the HOUSE cube — 3 rooms × 3 rooms × 3 storeys of 10-ft voxels = 30 × 30 × 30 ft = 66 × 66 × 66 px — the
// house its level 1, the parcel's eight land cells around it. Every vertical in the voxel derives from ONE constant set in
// lib/room-layout.ts (VOXEL_PX_PER_FT · STOREY_FT · STEP_RISE_FT); no pixel height is a free number.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-voxel-proportion.test.mjs
import fs from "node:fs";
import path from "node:path";
import { VOXEL_PX_PER_FT, STOREY_FT, STEP_RISE_FT, TINY_SIDE_FT, ROOM_FT } from "@/lib/room-layout";
import { TINY_HOME } from "@/lib/room-program";
import { OUTLET_AFF_FT } from "@/lib/mep-runs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const vox = read("../components/architect-2525/voxel-house.tsx");
const rd = read("../components/architect-2525/room-designer.tsx");
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ── 1. the constants exist and agree with the rest of the model ──
ok(near(VOXEL_PX_PER_FT, 66 / TINY_SIDE_FT), `VOXEL_PX_PER_FT = 66 px / ${TINY_SIDE_FT} ft = 2.2 (got ${VOXEL_PX_PER_FT})`);
ok(STOREY_FT === 10 && STOREY_FT === TINY_HOME.ceilingFt && STOREY_FT === ROOM_FT, `STOREY_FT = 10 = TINY_HOME.ceilingFt = ROOM_FT — one storey, one ceiling (got ${STOREY_FT} / ${TINY_HOME.ceilingFt})`);
ok(near(STEP_RISE_FT, 7 / 12), `STEP_RISE_FT = 7 in (got ${STEP_RISE_FT})`);
ok(/const N = ROOM_GRID; \/\/ 10/.test(rd) && /iso\(0, 0, N\)/.test(rd), "the room designer's 3D is a true 10-ft cube (ceiling at z = N = 10 ft)");

// ── 2. voxel-house derives every vertical from the constants ──
ok(/import \{[^}]*VOXEL_PX_PER_FT[^}]*\} from "@\/lib\/room-layout"/.test(vox) && /STOREY_FT/.test(vox) && /STEP_RISE_FT/.test(vox), "voxel-house imports VOXEL_PX_PER_FT · STOREY_FT · STEP_RISE_FT from room-layout");
ok(/const cell = Math\.round\(TINY_SIDE_FT \* VOXEL_PX_PER_FT\)/.test(vox) || /const cell = TINY_SIDE_FT \* VOXEL_PX_PER_FT/.test(vox), "the land cell is the 30-ft house at VOXEL_PX_PER_FT (66 px), not a free 66");
ok(/const storeyPx = STOREY_FT \* VOXEL_PX_PER_FT/.test(vox), "storeyPx = STOREY_FT × VOXEL_PX_PER_FT (22 px — one 10-ft storey)");
ok(/const roomSize = storeyPx/.test(vox) || /const roomSize = cell \/ 3;\s*\n[^\n]*\n?[^\n]*storeyPx === roomSize/.test(vox), "a room's edge IS the storey (roomSize = storeyPx: a 10 × 10 × 10 ft voxel)");
// the 3×3×3 cube: three ruled grids at the STOREY pitch over the HOUSE (cell wide), never at the land-cell pitch over the parcel
ok(/translateZ\(\$\{k \* storeyPx\}px\)/.test(vox), "the cube's three levels stack at k × storeyPx (22 · 44 · 66 px), not k × cell (30 ft a level)");
ok(!/translateZ\(\$\{k \* cell\}px\)/.test(vox), "no level is stacked at the land-cell pitch (the old 90-ft cube)");
ok(/data-arch-voxel-cube[\s\S]*?width: cell, height: cell/.test(vox), "the cube's levels are the house's footprint (cell wide), not the parcel (box wide)");
ok(/data-arch-voxel-cube[\s\S]*?transparent 1px \$\{roomSize\}px\)/.test(vox), "each level is ruled 3×3 at the room pitch (roomSize)");
ok(/translate3d\(\$\{sx \* cell \/ 2\}px,\$\{sy \* cell \/ 2\}px,\$\{cell \/ 2\}px\) rotateX\(90deg\)`\), width: 1\.6, height: cell/.test(vox), "the four corner posts stand at the house's corners, one cell (30 ft) tall");
ok(/const ELEV_SCALE = VOXEL_PX_PER_FT \* FT_PER_M/.test(vox) && /const FT_PER_M = 3\.28084/.test(vox), "terrain relief shares the plan's scale (ELEV_SCALE = VOXEL_PX_PER_FT × 3.28084 px/m), not a free 5 px/m");
ok(/Math\.min\(heightOf\(o\), STOREY_FT\)/.test(vox) && /elevOf\(o\)/.test(vox) && !/Math\.min\(sp\.h, 8\)/.test(vox), "furniture rises to its real (variant) height, capped at the ceiling, lifted by its elevation — no 8-ft cap");
ok(/\bz = OUTLET_AFF_FT \* VOXEL_PX_PER_FT/.test(vox), "sockets sit at the receptacle height (OUTLET_AFF_FT × VOXEL_PX_PER_FT)");
ok(/STEP_RISE_FT \* VOXEL_PX_PER_FT/.test(vox), "the porch risers are 7-in steps at scale");
ok(/\$\{STOREY_FT\}'`\}/.test(vox) || /×\$\{STOREY_FT\}'/.test(vox), "the selected-room readout's height is STOREY_FT, not a literal 10");
ok(/house = level 1 of the 3×3×3 cube/.test(vox), "the caption's sentence stays — and is now literally true");

// ── 3. the stale text is gone from the architect files (8.5×40 / 340 ft² / $440,000 were the pre-R4 numbers) ──
const STALE = /8\.5\s*[×x]\s*40|340 ft²|\$440,000/;
for (const f of ["../lib/architect-sim-options.ts", "../components/architect-2525/simulate-options.tsx", "../lib/architect-sim-environment.ts", "../components/architect-2525/sim-environment-view.tsx", "architect-sim-options.test.mjs", "architect-sim-environment.test.mjs"]) {
  ok(!STALE.test(read(f)), `${f.replace("../", "")} carries no stale 8.5×40 / 340 ft² / $440,000 text (the Tiny is 8.5×24 · 204 ft²; the Cube is $240,000)`);
}

console.log(`\narchitect-voxel-proportion: ${pass} passed, ${fail} failed · the 3×3×3 cube is the house at 2.2 px/ft, 10-ft storeys`);
process.exit(fail ? 1 : 0);
