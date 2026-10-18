// Cube coordinates are (LEVEL, X, Y) — operator 2026-10-18, "ah thats right:  Level, X, Y". X runs across,
// Y runs UPWARD, so y=3 is the top visual row. Cube 1 = (1,2,2) at the centre of level 1; the spiral runs
// up → right → down → down → left → left → up → up, so Cube 2 = (1,2,3) and Cube 9 = (1,1,3);
// Cube 10 = (2,2,2), the middle of the cube. Locks the Settings map + CLAUDE.md + the Level-3 framework doc.
//
// DD-94: between 2026-09-15 and 2026-10-18 the renderer read the triple as (row, col, level) with row 1 at
// the top, drawing a 90° rotation of his grid. The coordinates were never wrong; the reading was — and the
// drift survived 33 days because this gate pinned components/cube-status.tsx to CLAUDE.md and NEVER to
// docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md, the document that file's own comment claims to render. That missing
// assertion is the last one below, and it was red on the pre-change bytes.
import fs from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// Hand-written on purpose — never imported from lib/cube-grid.ts, or the gate would agree with whatever
// the helper happens to say. Top visual row (y=3) first.
const spiral = (b) => [[b + 8, b + 1, b + 2], [b + 7, b, b + 3], [b + 6, b + 5, b + 4]];
const HIS = { 1: [[9, 2, 3], [8, 1, 4], [7, 6, 5]], 10: [[18, 11, 12], [17, 10, 13], [16, 15, 14]], 19: [[27, 20, 21], [26, 19, 22], [25, 24, 23]] };

const src = fs.readFileSync(new URL("../components/cube-status.tsx", import.meta.url), "utf8");
const rows = (name) => { const m = src.match(new RegExp("const " + name + ": CubeInfo\\[\\]\\[\\] = \\[([\\s\\S]*?)\\n\\];")); const nums = [...m[1].matchAll(/number: (\d+)/g)].map((x) => Number(x[1])); return [nums.slice(0, 3), nums.slice(3, 6), nums.slice(6, 9)]; };
ok(JSON.stringify(rows("CUBE_GRID")) === JSON.stringify(spiral(1)), `Level 1 grid is 9 2 3 / 8 1 4 / 7 6 5 (got ${JSON.stringify(rows("CUBE_GRID"))})`);
ok(JSON.stringify(rows("LEVEL_2")) === JSON.stringify(spiral(10)), `Level 2 grid is 18 11 12 / 17 10 13 / 16 15 14 (got ${JSON.stringify(rows("LEVEL_2"))})`);
ok(JSON.stringify(rows("LEVEL_3")) === JSON.stringify(spiral(19)), `Level 3 grid is 27 20 21 / 26 19 22 / 25 24 23 (got ${JSON.stringify(rows("LEVEL_3"))})`);

// REORDER, NEVER RENUMBER — the 27 objects carry name, status, completion and description. Renumbering in
// place would make every cube inherit its neighbour's text while the three assertions above stayed green.
for (const [n, name] of [[1, "Session"], [7, "Ranking"], [9, "Reports"], [10, "Simulation"], [19, "Innovation Life Cycle"]]) {
  const m = src.match(new RegExp(`\\{ number: ${n}, name: "([^"]+)"`));
  ok(!!m && m[1] === name, `cube ${n} still carries its own name "${name}" (got ${m ? m[1] : "none"})`);
}

// DD-98 — "when lookin at Cube 1-9 on settings I never asked for dot nomenclature; remove." (operator
// 2026-10-18). The 3×3 seeded dot grid was mine, and lib/voxel-fingerprint.ts's own header credited it to
// him; nine tiles carried an unasked-for visual with every gate green because this gate never looked at it.
// The four completion segments below it STAY — he said nothing about them (release rule 6).
ok(!/data-cube-fingerprint/.test(src), "no per-cube dot grid is rendered on the Cube tiles");
ok(!/\bcubeFingerprint\b/.test(src), "cube-status.tsx does not import or call cubeFingerprint()");
ok(/progressSegments\(cube\.completion, 4\)/.test(src), "the four completion segments stay");

const md = fs.readFileSync(new URL("../../CLAUDE.md", import.meta.url), "utf8");
ok(/\| 1 \| \(1,2,2\) CENTER/.test(md) && /\| 2 \| \(1,2,3\)/.test(md) && /\| 9 \| \(1,1,3\)/.test(md) && /\| 10 \| \(2,2,2\) CENTER/.test(md), "CLAUDE.md positions: 1=(1,2,2) 2=(1,2,3) 9=(1,1,3) 10=(2,2,2)");
ok(/│  9  │  2  │  3  │[\s\S]*│  8  │  1  │  4  │[\s\S]*│  7  │  6  │  5  │/.test(md), "CLAUDE.md ASCII grid matches the spiral");
ok(/\(level, x, y\)/.test(md) && !/Coordinates are \*\*`\(row, col, level\)`\*\*/.test(md), "CLAUDE.md states the (level, x, y) convention, the old reading gone");

// EVERY CUBE'S COORDINATE IS DERIVED, NOT TRANSCRIBED — the whole 27-row table must reproduce his grids.
{
  const tab = {}; for (const m of md.matchAll(/^\| (\d+) \| \((\d),(\d),(\d)\)/gm)) tab[+m[1]] = [+m[2], +m[3], +m[4]];
  const g = {}; let levelsOk = Object.keys(tab).length === 27;
  for (const [n, [L, x, y]] of Object.entries(tab)) {
    if (L !== Math.floor((n - 1) / 9) + 1) levelsOk = false;
    (g[L] ||= [[0, 0, 0], [0, 0, 0], [0, 0, 0]])[3 - y][x - 1] = +n;
  }
  ok(levelsOk && [1, 2, 3].every((L) => JSON.stringify(g[L]) === JSON.stringify(spiral(1 + (L - 1) * 9))), "all 27 CLAUDE.md rows are (level,x,y) and reproduce his three grids");
}

// THE ASSERTION THIS GATE NEVER HAD. cube-status.tsx's own comment says it renders the framework document;
// nothing checked it, so a 2026-09-15 rotation of this file stood for 33 days while an assessment recorded
// the two as matching. Red on the pre-change bytes, green after.
{
  const fw = fs.readFileSync(new URL("../../docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md", import.meta.url), "utf8");
  const cells = [...fw.matchAll(/│ (\d\d) +│ (\d\d) +│ (\d\d) +│/g)].slice(0, 3).map((m) => [+m[1], +m[2], +m[3]]);
  ok(cells.length === 3 && JSON.stringify(cells) === JSON.stringify(rows("LEVEL_3")), `cube-status.tsx LEVEL_3 equals the framework doc's grid (doc ${JSON.stringify(cells)} vs map ${JSON.stringify(rows("LEVEL_3"))})`);
}

const helper = fs.readFileSync(new URL("../lib/cube-grid.ts", import.meta.url), "utf8");
ok(/SPIRAL_OFFSETS[^=]*= \[\[8, 1, 2\], \[7, 0, 3\], \[6, 5, 4\]\]/.test(helper), "lib/cube-grid.ts encodes the up → right → down → left spiral");

// SEMANTIC, in his own numbers — a future rotation cannot pass by matching a literal regex.
{
  const m = helper.match(/SPIRAL_OFFSETS[^=]*= (\[\[[^;]*?\]\])/);
  const off = JSON.parse(m[1]);
  ok([1, 10, 19].every((b) => JSON.stringify(off.map((r) => r.map((d) => b + d))) === JSON.stringify(HIS[b])), "SPIRAL_OFFSETS renders his three grids: 9 2 3 / 8 1 4 / 7 6 5, 18 11 12 / …, 27 20 21 / …");
  ok(/return \{ level, x: c \+ 1, y: 3 - r \}/.test(helper), "cubeCoord returns (level, x, y) — his canonical order, y upward");
}

const dev = fs.readFileSync(new URL("../components/cube-dev-sim.tsx", import.meta.url), "utf8");
ok(/cubeGridOrder\(/.test(dev), "Dev Sim picker orders cubes through cubeGridOrder()");
ok(!/lg:grid-cols-9|sm:grid-cols-5/.test(dev), "Dev Sim picker is a fixed 3×3 (no 5- or 9-column flattening)");
console.log(`cube-grid: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
