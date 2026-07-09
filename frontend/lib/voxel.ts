/**
 * SECURITY-2525 · Altitude voxel bands (stackable cubes)
 * ======================================================
 * The [[project_stackable_cubes_voxel]] model: each ground cell (MGRS / LLV-DMS / UCRS-2525)
 * stacks cubes upward, one per altitude band. This maps an MSL altitude to its band so an
 * airborne track is "in a cube" — countable and snappable, not just a floating number.
 * Pure + deterministic; band edges match the eXeL-AI 3D ELEVATION rail. Feet MSL.
 */
export interface Band { index: number; label: string; floorFt: number; ceilFt: number }

// Band 0 = SURFACE (ground cube, exactly 0 ft). Bands 1..7 = the airspace ranges whose ceilings
// are RANGE_EDGES[j+1] (ft MSL), matching the mockup altitude rail.
export const RANGE_EDGES = [0, 500, 1000, 2500, 5000, 7500, 10000, Infinity];
export const BAND_LABELS = ["SURFACE", "0–500", "500–1k", "1k–2.5k", "2.5k–5k", "5k–7.5k", "7.5k–10k", "10k+"];

const M_PER_FT = 0.3048;
export const ftFromM = (m: number) => m / M_PER_FT;
export const mFromFt = (ft: number) => ft * M_PER_FT;

/** Band for an altitude in feet MSL. <0 → subsurface (-1); 0 → SURFACE (0); >0 → range band 1..7. */
export function altitudeBandFt(ft: number): Band {
  if (!Number.isFinite(ft)) return { index: -1, label: "UNKNOWN", floorFt: NaN, ceilFt: NaN }; // no silent "10k+"
  if (ft < 0) return { index: -1, label: "SUBSURFACE", floorFt: -Infinity, ceilFt: 0 };
  if (ft === 0) return { index: 0, label: "SURFACE", floorFt: 0, ceilFt: 0 };
  for (let j = 0; j < RANGE_EDGES.length - 1; j++) {
    if (ft <= RANGE_EDGES[j + 1]) {
      return { index: j + 1, label: BAND_LABELS[j + 1], floorFt: RANGE_EDGES[j], ceilFt: RANGE_EDGES[j + 1] };
    }
  }
  return { index: 7, label: BAND_LABELS[7], floorFt: 10000, ceilFt: Infinity };
}

/** Band for an altitude in metres MSL. */
export function altitudeBandM(m: number): Band {
  return altitudeBandFt(ftFromM(m));
}

/**
 * Occupancy count per band for a set of MSL-metre altitudes — the cube stack a cell (or the
 * whole view) holds. Index 0..7 = the airspace bands; use for the altitude rail histogram.
 */
export function bandOccupancy(altsMslM: number[]): number[] {
  const counts = new Array(BAND_LABELS.length).fill(0) as number[];
  for (const m of altsMslM) {
    const b = altitudeBandFt(ftFromM(m));
    if (b.index >= 0) counts[b.index]++;
  }
  return counts;
}
