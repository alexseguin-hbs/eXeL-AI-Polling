// The arena's ENU frame and its ground. Constants match the rest of the app exactly
// (components/security-2525/mission-planning.tsx:1704 mFrac, :4913 dead-reckoning) so a position means the
// same thing in Security and in Drone — one world, not two that nearly agree.
export const M_PER_DEG_LAT = 110574;
export const M_PER_DEG_LON = (lat: number) => 111320 * Math.cos((lat * Math.PI) / 180);

export interface LatLon { lat: number; lon: number }
export interface ArenaOrigin extends LatLon { mslM: number }

/** metre offsets east/north of the origin → lat/lon. */
export function enuToLatLon(o: ArenaOrigin, east: number, north: number): LatLon {
  return { lat: o.lat + north / M_PER_DEG_LAT, lon: o.lon + east / M_PER_DEG_LON(o.lat) };
}
/** lat/lon → metre offsets east/north of the origin. */
export function latLonToEnu(o: ArenaOrigin, p: LatLon): { east: number; north: number } {
  return { east: (p.lon - o.lon) * M_PER_DEG_LON(o.lat), north: (p.lat - o.lat) * M_PER_DEG_LAT };
}

export interface ElevationField { nx: number; ny: number; spanM: number; grid: number[][] }
/**
 * Bilinear ground height in metres MSL. The grid is row-major from the NORTH-west corner, so row 0 is the
 * highest latitude. Outside the field the edge value is held — a sampler must return SOMETHING finite for
 * every point the renderer asks about, and holding the edge is honest where extrapolating is invention.
 */
export function makeGroundSampler(f: ElevationField): (east: number, north: number) => number {
  const half = f.spanM / 2, stepX = f.spanM / (f.nx - 1), stepY = f.spanM / (f.ny - 1);
  const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
  return (east, north) => {
    const fx = clamp((east + half) / stepX, 0, f.nx - 1);
    const fy = clamp((half - north) / stepY, 0, f.ny - 1);       // north-down row index
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, f.nx - 1), y1 = Math.min(y0 + 1, f.ny - 1);
    const tx = fx - x0, ty = fy - y0;
    const a = f.grid[y0][x0], b = f.grid[y0][x1], c = f.grid[y1][x0], d = f.grid[y1][x1];
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
  };
}

/** Iso-elevation lines by marching squares — deterministic, and each segment is a real crossing. */
export function isoContours(f: ElevationField, levels: number[]): { level: number; segs: [number, number][][] }[] {
  const half = f.spanM / 2, stepX = f.spanM / (f.nx - 1), stepY = f.spanM / (f.ny - 1);
  const pos = (cx: number, cy: number): [number, number] => [-half + cx * stepX, half - cy * stepY];
  const out: { level: number; segs: [number, number][][] }[] = [];
  for (const L of levels) {
    const segs: [number, number][][] = [];
    for (let y = 0; y < f.ny - 1; y++) {
      for (let x = 0; x < f.nx - 1; x++) {
        const v = [f.grid[y][x], f.grid[y][x + 1], f.grid[y + 1][x + 1], f.grid[y + 1][x]];
        const c: [number, number][] = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
        const hits: [number, number][] = [];
        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4, a = v[i], b = v[j];
          if ((a - L) * (b - L) < 0) {
            const t = (L - a) / (b - a);
            const p0 = pos(c[i][0], c[i][1]), p1 = pos(c[j][0], c[j][1]);
            hits.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]);
          }
        }
        for (let i = 0; i + 1 < hits.length; i += 2) segs.push([hits[i], hits[i + 1]]);
      }
    }
    if (segs.length) out.push({ level: L, segs });
  }
  return out;
}
