// Vision • 2525 cube partitioner guarantee (CUBE-ANALYSIS §2/§6): for every N in 1..27 the
// boustrophedon chop tiles the 27-cell cube exactly with face-connected blocks; presets valid.
// Pure JS, no deps. Run: node tests/cube-partitions.test.mjs
import { partition, sizeDistribution, assignCells, validate, PRESETS, boustrophedonPath }
  from "../../docs/vision-2525/reference/cube-partitions.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// Walk: 27 unique cells, every transition face-adjacent (single step).
const path = boustrophedonPath();
ok(path.length === 27, "walk visits 27 cells");
ok(new Set(path.map((c) => c.join(","))).size === 27, "walk cells unique");
let adj = true;
for (let i = 1; i < path.length; i++) {
  const d = Math.abs(path[i][0] - path[i - 1][0]) + Math.abs(path[i][1] - path[i - 1][1]) + Math.abs(path[i][2] - path[i - 1][2]);
  if (d !== 1) adj = false;
}
ok(adj, "every walk transition is a single face-adjacent step");

// Every N 1..27: connected blocks, sum 27, sizes match distribution.
for (let n = 1; n <= 27; n++) {
  const groups = partition(n);
  const blocks = groups.map((cells, i) => ({ id: `b${i}`, cells }));
  const sizes = sizeDistribution(n);
  ok(groups.length === n, `N=${n}: ${n} blocks`);
  ok(groups.reduce((s, g) => s + g.length, 0) === 27, `N=${n}: sums to 27`);
  ok(JSON.stringify(groups.map((g) => g.length)) === JSON.stringify(sizes), `N=${n}: even size distribution`);
  let threw = false;
  try { validate(blocks); } catch { threw = true; }
  ok(!threw, `N=${n}: validates (connected + unique + in-bounds)`);
}

// N=7 is the operative gate case → 4,4,4,4,4,4,3.
ok(JSON.stringify(sizeDistribution(7)) === JSON.stringify([4, 4, 4, 4, 4, 4, 3]), "N=7 gate split = 4×6 + 3");

// Presets 3/9/27 are valid partitions.
for (const n of [3, 9, 27]) {
  const blocks = PRESETS[n]().map((cells, i) => ({ id: `p${i}`, cells }));
  let threw = false;
  try { validate(blocks); } catch (e) { threw = true; console.log("  preset", n, e.message); }
  ok(!threw, `preset ${n} valid`);
}

// assignCells throws on a disconnected hand-authored block (guard is enforcing).
let guardThrew = false;
try {
  validate([{ id: "x", cells: [[0, 0, 0], [2, 2, 2]] }, { id: "y", cells: [] }]);
} catch { guardThrew = true; }
ok(guardThrew, "validate throws on disconnected/empty (never renders a wrong cube)");

// assignCells end-to-end for the 6-block Cube-1 case.
const six = assignCells([1, 2, 3, 4, 5, 6].map((i) => ({ id: `1.${i}`, color: 0 })));
ok(six.length === 6 && six.every((b) => b.cells.length >= 1), "assignCells fills 6 blocks");

console.log(`\nCUBE-PARTITIONS ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
