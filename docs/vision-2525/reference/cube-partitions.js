// cube-partitions.js — 3×3×3 (27-cell) partitioner + presets + validator.
// Built from CUBE-ANALYSIS.md (Vision • 2525). Pure JS, no deps. Pairs with explode-view.js
// (which imports assignCells). Guarantees any N in 1..27 tiles the cube exactly with
// face-connected blocks; throws (never returns) on any configuration that would not.

export const GRID = 3;
const N_CELLS = GRID * GRID * GRID; // 27

// ── Hamiltonian boustrophedon walk (correct only because edge length 3 is odd) ──────────
// Snake reversing direction each row and each layer, so every transition is a single
// face-adjacent step and all 27 cells are visited exactly once.
export function boustrophedonPath() {
  const path = [];
  for (let a = 0; a < GRID; a++) {
    const bs = a % 2 === 0 ? [0, 1, 2] : [2, 1, 0];
    for (const b of bs) {
      const cs = (a + b) % 2 === 0 ? [0, 1, 2] : [2, 1, 0];
      for (const c of cs) path.push([a, b, c]); // [y, x, z] — axis labels don't matter to the guarantee
    }
  }
  return path;
}

// ── Even size distribution: first (27 mod N) blocks get base+1, rest get base ────────────
export function sizeDistribution(n) {
  if (n < 1 || n > N_CELLS) throw new Error(`block count must be 1..${N_CELLS}, got ${n}`);
  const base = Math.floor(N_CELLS / n), rem = N_CELLS % n;
  return Array.from({ length: n }, (_, i) => (i < rem ? base + 1 : base));
}

// ── Chop the walk into N consecutive runs → connected polycubes summing to 27 ────────────
export function partition(n, path = boustrophedonPath()) {
  const sizes = sizeDistribution(n);
  const groups = [];
  let idx = 0;
  for (const s of sizes) { groups.push(path.slice(idx, idx + s)); idx += s; }
  return groups;
}

// ── Exact presets that beat the generic walk on the cube's own symmetry ──────────────────
export const PRESETS = {
  3: () => [0, 1, 2].map((y) => cells((c) => c[0] === y)),            // slabs: three 3×3×1 layers
  9: () => {                                                          // columns: nine 1×3×1
    const g = [];
    for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) g.push(cells((c) => c[1] === x && c[2] === z));
    return g;
  },
  27: () => cellsAll().map((c) => [c]),                               // atoms: one cell each
};
const cellsAll = () => { const o = []; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) o.push([y, x, z]); return o; };
const cells = (pred) => cellsAll().filter(pred);

// ── Public: assign cells to blocks (used by explode-view). Presets unless a path is named ─
export function assignCells(blocks, config) {
  const n = blocks.length;
  const groups = !config && PRESETS[n] ? PRESETS[n]() : partition(n);
  const out = blocks.map((b, i) => ({ ...b, cells: groups[i] }));
  validate(out); // throws rather than render a wrong-but-plausible cube
  return out;
}

// ── Validation — enforced, not assumed (CUBE-ANALYSIS §6) ────────────────────────────────
export function validate(blocksWithCells) {
  const seen = new Set();
  let total = 0;
  for (const b of blocksWithCells) {
    if (!b.cells || b.cells.length === 0) throw new Error(`empty block: ${b.id ?? "?"}`);
    for (const [y, x, z] of b.cells) {
      if (![y, x, z].every((v) => v >= 0 && v < GRID)) throw new Error(`off-grid cell ${[y, x, z]} in ${b.id ?? "?"}`);
      const key = `${y},${x},${z}`;
      if (seen.has(key)) throw new Error(`cell ${key} claimed twice`);
      seen.add(key);
    }
    total += b.cells.length;
    if (!connected(b.cells)) throw new Error(`block ${b.id ?? "?"} is not face-connected`);
  }
  if (total !== N_CELLS) throw new Error(`cells sum to ${total}, must be ${N_CELLS}`);
  return true;
}

// 6-neighbour face-adjacency flood fill (diagonal touching does NOT count).
function connected(cellList) {
  if (cellList.length <= 1) return true;
  const set = new Set(cellList.map(([y, x, z]) => `${y},${x},${z}`));
  const seen = new Set();
  const stack = [cellList[0]];
  const nbr = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  while (stack.length) {
    const [y, x, z] = stack.pop();
    const key = `${y},${x},${z}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const [dy, dx, dz] of nbr) {
      const nk = `${y + dy},${x + dx},${z + dz}`;
      if (set.has(nk) && !seen.has(nk)) stack.push([y + dy, x + dx, z + dz]);
    }
  }
  return seen.size === cellList.length;
}
