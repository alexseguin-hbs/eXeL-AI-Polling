// Cube coordinates are (row, col, level); Cube 1 = (2,2,1) at the centre of level 1; the spiral runs
// right → down → left → up → right so Cube 9 = (1,3,1); Cube 10 = (2,2,2), the middle of the cube
// (operator 2026-09-15, docs/asks/2026-09-15_cube_coordinates.md). Locks the Settings map + CLAUDE.md.
import fs from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const spiral = (b) => [[b + 6, b + 7, b + 8], [b + 5, b, b + 1], [b + 4, b + 3, b + 2]];
const src = fs.readFileSync(new URL("../components/cube-status.tsx", import.meta.url), "utf8");
const rows = (name) => { const m = src.match(new RegExp("const " + name + ": CubeInfo\\[\\]\\[\\] = \\[([\\s\\S]*?)\\n\\];")); const nums = [...m[1].matchAll(/number: (\d+)/g)].map((x) => Number(x[1])); return [nums.slice(0, 3), nums.slice(3, 6), nums.slice(6, 9)]; };
ok(JSON.stringify(rows("CUBE_GRID")) === JSON.stringify(spiral(1)), `Level 1 grid is 7 8 9 / 6 1 2 / 5 4 3 (got ${JSON.stringify(rows("CUBE_GRID"))})`);
ok(JSON.stringify(rows("LEVEL_2")) === JSON.stringify(spiral(10)), `Level 2 grid is 16 17 18 / 15 10 11 / 14 13 12 (got ${JSON.stringify(rows("LEVEL_2"))})`);
ok(JSON.stringify(rows("LEVEL_3")) === JSON.stringify(spiral(19)), `Level 3 grid is 25 26 27 / 24 19 20 / 23 22 21 (got ${JSON.stringify(rows("LEVEL_3"))})`);
const md = fs.readFileSync(new URL("../../CLAUDE.md", import.meta.url), "utf8");
ok(/\| 1 \| \(2,2,1\) CENTER/.test(md) && /\| 2 \| \(2,3,1\)/.test(md) && /\| 9 \| \(1,3,1\)/.test(md) && /\| 10 \| \(2,2,2\) CENTER/.test(md), "CLAUDE.md positions: 1=(2,2,1) 2=(2,3,1) 9=(1,3,1) 10=(2,2,2)");
ok(/│  7  │  8  │  9  │[\s\S]*│  6  │  1  │  2  │[\s\S]*│  5  │  4  │  3  │/.test(md), "CLAUDE.md ASCII grid matches the spiral");
ok(/\(row, col, level\)/.test(md) && !/Coordinates are `\(level, row, col\)`/.test(md), "CLAUDE.md states the (row, col, level) convention, old order gone");
// The shared helper is the source of truth, and the Dev Sim picker lays cubes out through it as a 3×3.
const helper = fs.readFileSync(new URL("../lib/cube-grid.ts", import.meta.url), "utf8");
ok(/SPIRAL_OFFSETS[^=]*= \[\[6, 7, 8\], \[5, 0, 1\], \[4, 3, 2\]\]/.test(helper), "lib/cube-grid.ts encodes the right → down → left → up spiral");
const dev = fs.readFileSync(new URL("../components/cube-dev-sim.tsx", import.meta.url), "utf8");
ok(/cubeGridOrder\(1\)\.map/.test(dev), "Dev Sim picker orders cubes through cubeGridOrder(1)");
ok(!/lg:grid-cols-9|sm:grid-cols-5/.test(dev), "Dev Sim picker is a fixed 3×3 (no 5- or 9-column flattening)");
console.log(`cube-grid: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
