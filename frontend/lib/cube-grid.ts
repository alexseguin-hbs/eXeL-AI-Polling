// Cube coordinates — ONE source of truth (operator 2026-09-15, docs/asks/2026-09-15_cube_coordinates.md).
// Coordinates are (row, col, level). The centre cube of each level (1 · 10 · 19) sits at (2,2,L); the ring
// spirals clockwise starting to the RIGHT of centre: right → down → left → up → right.
//
//   row 1 │ +6 │ +7 │ +8 │        Level 1:  7 8 9        Level 2: 16 17 18       Level 3: 25 26 27
//   row 2 │ +5 │  0 │ +1 │                  6 1 2                 15 10 11                24 19 20
//   row 3 │ +4 │ +3 │ +2 │                  5 4 3                 14 13 12                23 22 21
//
// Consumers: components/cube-dev-sim.tsx (the "pick one" picker) and components/cube-status.tsx (the
// Settings → Cube Architecture map, locked to the same order by tests/cube-grid.test.mjs).

/** Row-major offsets from the level's centre cube number. */
export const SPIRAL_OFFSETS: readonly (readonly number[])[] = [[6, 7, 8], [5, 0, 1], [4, 3, 2]];

/** First cube number of a level: 1 · 10 · 19. */
export function levelBase(level: 1 | 2 | 3): number { return 1 + (level - 1) * 9; }

/** The 3×3 grid of cube numbers for a level, row-major (row 1 first). */
export function cubeGridRows(level: 1 | 2 | 3): number[][] {
  const base = levelBase(level);
  return SPIRAL_OFFSETS.map((row) => row.map((d) => base + d));
}

/** Flat row-major order of cube numbers for a level — use to sort a list into grid position. */
export function cubeGridOrder(level: 1 | 2 | 3): number[] { return cubeGridRows(level).flat(); }

/** (row, col, level) of a cube number 1–27. */
export function cubeCoord(n: number): { row: number; col: number; level: 1 | 2 | 3 } {
  const level = (Math.floor((n - 1) / 9) + 1) as 1 | 2 | 3;
  const d = n - levelBase(level);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (SPIRAL_OFFSETS[r][c] === d) return { row: r + 1, col: c + 1, level };
  throw new Error(`cube ${n} has no position`);
}
