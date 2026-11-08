// ARCHITECT-2525 · THE VOXEL PROPORTION LAW (operator 2026-10-31 "voxel pixel height and width … realistically proportional";
// 2026-10-25 "same pixels tall, wide, and long"), RE-SEATED ON THE SHELL by the H.I. ruling 2026-11-08 (R1b). The house is a
// 36×36×12 outer shell — ONE storey of nine 10-ft CLEAR rooms nested in 12-ft modules (1-ft reserved zone each side) = 900 ft².
// The house land cell is the 36-ft shell at 66 px (VOXEL_PX_PER_FT = 66/36); every vertical derives from ONE constant set in
// lib/room-layout.ts (VOXEL_PX_PER_FT · STOREY_FT · SHELL_FT · HOUSE_FT · HOUSE_H · STEP_RISE_FT); no pixel height is free.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-voxel-proportion.test.mjs
import fs from "node:fs";
import path from "node:path";
import { VOXEL_PX_PER_FT, STOREY_FT, STEP_RISE_FT, ROOM_FT, HOUSE_FT, SHELL_FT, HOUSE_H } from "@/lib/room-layout";
import { TINY_HOME } from "@/lib/room-program";
import { OUTLET_AFF_FT } from "@/lib/mep-runs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const vox = read("../components/architect-2525/voxel-house.tsx");
const rd = read("../components/architect-2525/room-designer.tsx");
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ── 1. the constants exist and agree with the rest of the model (the house land cell is the 36-ft SHELL at 66 px) ──
ok(near(VOXEL_PX_PER_FT, 66 / HOUSE_FT) && HOUSE_FT === 36, `VOXEL_PX_PER_FT = 66 px / ${HOUSE_FT} ft (got ${VOXEL_PX_PER_FT})`);
ok(STOREY_FT === 10 && STOREY_FT === TINY_HOME.ceilingFt && STOREY_FT === ROOM_FT, `STOREY_FT = 10 = TINY_HOME.ceilingFt = ROOM_FT — one storey, one ceiling (got ${STOREY_FT} / ${TINY_HOME.ceilingFt})`);
ok(SHELL_FT === 12 && HOUSE_H === 12 && HOUSE_FT === 3 * SHELL_FT, `the 12-ft module · 12-ft one-storey shell height · 36-ft house (3 × 12) (got ${SHELL_FT}/${HOUSE_H}/${HOUSE_FT})`);
ok(near(STEP_RISE_FT, 7 / 12), `STEP_RISE_FT = 7 in (got ${STEP_RISE_FT})`);
ok(/const N = ROOM_GRID; \/\/ 10/.test(rd) && /iso\(0, 0, N\)/.test(rd), "the room designer's 3D is a true 10-ft cube (ceiling at z = N = 10 ft)");

// ── 2. voxel-house derives every vertical from the constants ──
ok(/import \{[^}]*VOXEL_PX_PER_FT[^}]*\} from "@\/lib\/room-layout"/.test(vox) && /STOREY_FT/.test(vox) && /STEP_RISE_FT/.test(vox), "voxel-house imports VOXEL_PX_PER_FT · STOREY_FT · STEP_RISE_FT from room-layout");
ok(/const cell = Math\.round\(HOUSE_FT \* VOXEL_PX_PER_FT\)/.test(vox), "the house land cell is the 36-ft SHELL at VOXEL_PX_PER_FT (66 px), not a free 66 and never TINY_SIDE_FT");
ok(!/TINY_SIDE_FT/.test(vox), "the voxel no longer scales anything on TINY_SIDE_FT (the old 30-ft envelope)");
ok(/const modulePx = SHELL_FT \* VOXEL_PX_PER_FT/.test(vox), "the 12-ft outer-module pitch = SHELL_FT × VOXEL_PX_PER_FT (3 modules = one house cell)");
ok(/const storeyPx = STOREY_FT \* VOXEL_PX_PER_FT/.test(vox), "storeyPx = STOREY_FT × VOXEL_PX_PER_FT (one 10-ft storey)");
ok(/const houseHpx = HOUSE_H \* VOXEL_PX_PER_FT/.test(vox), "houseHpx = HOUSE_H × VOXEL_PX_PER_FT (the 12-ft one-storey shell height)");
ok(/const roomSize = storeyPx/.test(vox), "a clear room's edge IS the storey (roomSize = storeyPx: a 10 × 10 × 10 ft voxel)");
// the SHELL is ONE storey: a floor plane + a ceiling plane one storey up, both gridded at the 12-ft module pitch — never a 3-level stack
ok(/\[0, houseHpx\]\.map\(\(z, k\) =>/.test(vox), "the house shell is ONE storey: planes at z = 0 and z = houseHpx (floor + ceiling), not a three-level stack");
ok(!/\[1, 2, 3\]\.map\(\(k\)/.test(vox) && !/translateZ\(\$\{k \* storeyPx\}px\)/.test(vox), "no three-storey 30×30×30 metaphor remains (no k = 1·2·3 level stack)");
ok(/data-arch-voxel-cube[\s\S]*?width: cell, height: cell/.test(vox), "the shell planes are the house's footprint (cell wide, the 36-ft shell)");
ok(/data-arch-voxel-cube[\s\S]*?transparent 1px \$\{modulePx\}px\)/.test(vox), "the floor/ceiling are ruled 3×3 at the 12-ft outer-module pitch (modulePx)");
ok(/translate3d\(\$\{sx \* cell \/ 2\}px,\$\{sy \* cell \/ 2\}px,\$\{houseHpx \/ 2\}px\) rotateX\(90deg\)`\), width: 1\.6, height: houseHpx/.test(vox), "the four corner posts stand at the shell's corners, ONE storey (houseHpx) tall — not a cell-tall cube");
ok(/pitch: modulePx/.test(vox), "the nine rooms are positioned at the 12-ft module pitch (so the 1-ft reserved zone shows as the gap)");
ok(/const ELEV_SCALE = VOXEL_PX_PER_FT \* FT_PER_M/.test(vox) && /const FT_PER_M = 3\.28084/.test(vox), "terrain relief shares the plan's scale (ELEV_SCALE = VOXEL_PX_PER_FT × 3.28084 px/m), not a free 5 px/m");
ok(/Math\.min\(heightOf\(o\), STOREY_FT\)/.test(vox) && /elevOf\(o\)/.test(vox) && !/Math\.min\(sp\.h, 8\)/.test(vox), "furniture rises to its real (variant) height, capped at the ceiling, lifted by its elevation — no 8-ft cap");
ok(/\bz = OUTLET_AFF_FT \* VOXEL_PX_PER_FT/.test(vox), "sockets sit at the receptacle height (OUTLET_AFF_FT × VOXEL_PX_PER_FT)");
ok(/STEP_RISE_FT \* VOXEL_PX_PER_FT/.test(vox), "the porch risers are 7-in steps at scale");
ok(/\$\{STOREY_FT\}'`\}/.test(vox) || /×\$\{STOREY_FT\}'/.test(vox), "the selected-room readout's height is STOREY_FT, not a literal 10");
ok(/36×36×12 one-storey shell/.test(vox), "the caption names the 36×36×12 one-storey shell (the superseding truth)");

// ── 3. the stale text is gone from the architect files (8.5×40 / 340 ft² / $440,000 were the pre-R4 numbers) ──
const STALE = /8\.5\s*[×x]\s*40|340 ft²|\$440,000/;
for (const f of ["../lib/architect-sim-options.ts", "../components/architect-2525/simulate-options.tsx", "../lib/architect-sim-environment.ts", "../components/architect-2525/sim-environment-view.tsx", "architect-sim-options.test.mjs", "architect-sim-environment.test.mjs"]) {
  ok(!STALE.test(read(f)), `${f.replace("../", "")} carries no stale 8.5×40 / 340 ft² / $440,000 text (the Tiny is 8.5×24 · 204 ft²; the Cube is $240,000)`);
}

console.log(`\narchitect-voxel-proportion: ${pass} passed, ${fail} failed · the house is the 36×36×12 one-storey shell at 66/36 px/ft, 10-ft storeys`);
process.exit(fail ? 1 : 0);
