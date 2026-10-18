// Cube coordinates — ONE source of truth (operator 2026-09-15, docs/asks/2026-09-15_cube_coordinates.md;
// re-stated and corrected 2026-10-18, DD-94 / DD-95, same ask file).
//
// THE CANONICAL FIELD ORDER IS (LEVEL, X, Y) — operator 2026-10-18: "ah thats right:  Level, X, Y".
// X runs LEFT to RIGHT across the grid. Y runs UPWARD: y=3 is the TOP visual row, y=1 the bottom.
// The centre cube of each level (1 · 10 · 19) sits at (L,2,2); the ring spirals clockwise starting UP from
// the centre: up → right → down → down → left → left → up → up. His own walk, in his own words:
// "we spiral from 2,2,1 position for cube 1, go up to 2,3,1, then right to 3,3,1, the 3,2,1, the 3,1,1,
//  then 2,1,1 then 1,1,1, then 1,2,1 then 1,3,1" — that walk is "up" only because the second field is a Y
//  that counts upward, which is the whole of DD-94.
//
//   y=3 │ +8 │ +1 │ +2 │        Level 1:  9 2 3        Level 2: 18 11 12       Level 3: 27 20 21
//   y=2 │ +7 │  0 │ +3 │                  8 1 4                 17 10 13                26 19 22
//   y=1 │ +6 │ +5 │ +4 │                  7 6 5                 16 15 14                25 24 23
//        x=1   x=2   x=3
//
// WHY THIS FILE EXISTS AS IT NOW READS: between 2026-09-15 and 2026-10-18 the renderer read the triple as
// (row, col, level) with row 1 at the top, which draws 7 8 9 / 6 1 2 / 5 4 3 — a 90° rotation of his grid.
// The COORDINATES were never wrong; the reading was. Requirements.txt, docs/CUBES_7-9.md and
// docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md carried the correct geometry throughout and were the evidence.
//
// Consumers: components/cube-dev-sim.tsx (the SIM easter egg picker) and components/cube-status.tsx (the
// Settings → Cube Architecture map, locked to the same order by tests/cube-grid.test.mjs).

/** Offsets from the level's centre cube number, TOP visual row first (y=3, y=2, y=1). */
export const SPIRAL_OFFSETS: readonly (readonly number[])[] = [[8, 1, 2], [7, 0, 3], [6, 5, 4]];

/** First cube number of a level: 1 · 10 · 19. */
export function levelBase(level: 1 | 2 | 3): number { return 1 + (level - 1) * 9; }

/** The 3×3 grid of cube numbers for a level, TOP visual row first — ready to render in order. */
export function cubeGridRows(level: 1 | 2 | 3): number[][] {
  const base = levelBase(level);
  return SPIRAL_OFFSETS.map((row) => row.map((d) => base + d));
}

/** Flat order of cube numbers for a level, top row first — use to sort a list into grid position. */
export function cubeGridOrder(level: 1 | 2 | 3): number[] { return cubeGridRows(level).flat(); }

/** (level, x, y) of a cube number 1–27 — the operator's canonical order. x across, y upward. */
export function cubeCoord(n: number): { level: 1 | 2 | 3; x: number; y: number } {
  const level = (Math.floor((n - 1) / 9) + 1) as 1 | 2 | 3;
  const d = n - levelBase(level);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (SPIRAL_OFFSETS[r][c] === d) return { level, x: c + 1, y: 3 - r };
  throw new Error(`cube ${n} has no position`);
}

/** The canonical "(L,X,Y)" string for a cube, as the documents and the CRS matrix write it. */
export function cubeCoordText(n: number): string {
  const { level, x, y } = cubeCoord(n);
  return `(${level},${x},${y})`;
}
