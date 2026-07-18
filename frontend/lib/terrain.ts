/**
 * ARCHITECT-2525 · TERRAIN — deterministic procedural elevation heightfield (Vision 2525).
 * =================================================================================================
 * Operator: the land AROUND the house must show realistic elevation (different heights, per-corner
 * altitude labels, surfaces that read when you rotate) — sampled per ~10 m. There is no offline DEM
 * in the repo (no runtime fetch allowed — the determinism law), so we synthesize a REALISTIC, fully
 * DETERMINISTIC heightfield seeded by the lot lat/lon: identical coordinates → identical terrain,
 * replayable, no network. (Real DEM tiles can replace elevAt() later behind the same signature.)
 *
 * Pure: uses only Math.sin/floor (Math.random is banned — it would break replay). Value-noise with
 * bilinear smoothing + a gentle regional slope, so the surface undulates instead of stepping randomly.
 */

// Deterministic unit hash in [0,1) from an integer lattice point + seed (sine-hash, no Math.random).
function hash(ix: number, iy: number, seed: number): number {
  const s = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
const smooth = (t: number) => t * t * (3 - 2 * t); // smoothstep for bilinear blend

// Value noise in [0,1) at continuous (x,y) for a given seed.
function noise2(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const v00 = hash(x0, y0, seed), v10 = hash(x0 + 1, y0, seed);
  const v01 = hash(x0, y0 + 1, seed), v11 = hash(x0 + 1, y0 + 1, seed);
  const sx = smooth(fx), sy = smooth(fy);
  const a = v00 + (v10 - v00) * sx, b = v01 + (v11 - v01) * sx;
  return a + (b - a) * sy;
}

// A stable per-lot seed from lat/lon (deterministic; grid-friendly integers).
export function lotSeed(lat: number, lon: number): number {
  return Math.abs(Math.round(lat * 1000) * 31 + Math.round(lon * 1000) * 17) % 100000;
}

/**
 * Elevation in METRES at grid offset (gx,gy) around the lot centre. gx/gy are in ~10 m steps
 * (the operator's "every 10 m"). Two octaves of value noise + a gentle regional slope so the
 * terrain has both broad grade and local relief. Centred so the house pad ≈ 0 datum.
 */
export function elevAt(lat: number, lon: number, gx: number, gy: number): number {
  const seed = lotSeed(lat, lon);
  const f = 0.35;                                   // base frequency (broad undulation)
  const broad = noise2(gx * f, gy * f, seed);       // 0..1
  const fine = noise2(gx * f * 3.1, gy * f * 3.1, seed + 7); // 0..1 local relief
  const slope = (gx + gy) * 0.18;                   // gentle regional grade across the parcel
  // ~ -4 m .. +8 m relief around the pad; deterministic.
  return Math.round(((broad - 0.5) * 8 + (fine - 0.5) * 3 + slope) * 10) / 10;
}

/** Sample an n×n grid of elevations (metres), row-major, centred on the lot. step = grid steps (10 m). */
export function sampleGrid(lat: number, lon: number, n: number): number[] {
  const out: number[] = [];
  const c = (n - 1) / 2;
  for (let r = 0; r < n; r++) for (let cx = 0; cx < n; cx++) out.push(elevAt(lat, lon, cx - c, r - c));
  return out;
}

/** The four outer corners of the 3×3 land base (NW, NE, SW, SE) in metres — for on-voxel altitude labels. */
export function cornerAltitudes(lat: number, lon: number): { nw: number; ne: number; sw: number; se: number } {
  return {
    nw: elevAt(lat, lon, -1.5, -1.5), ne: elevAt(lat, lon, 1.5, -1.5),
    sw: elevAt(lat, lon, -1.5, 1.5), se: elevAt(lat, lon, 1.5, 1.5),
  };
}

/** metres → feet (display). */
export const mToFt = (m: number): number => Math.round(m * 3.28084);
