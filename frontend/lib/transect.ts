/**
 * SECURITY-2525 · Altitude transect (pure + deterministic)
 * ========================================================
 * Given the ONE DEM sampler (the 1-fetch tile) and a start→end line, produce the terrain
 * profile plus airborne objects projected onto the line at their MSL altitude. This is the
 * math behind the ELEVATION PROFILE / TRANSECT panel — terrain, water, object altitude, all
 * from the same tile. No rendering here, so it is unit-tested without a browser.
 *
 * Coordinates are [lat, lon]. Altitude follows the visual law: an object's plotted MSL height
 * is its own altitude if altRef==="MSL", else terrain-at-object + altitude (AGL). Labels must
 * always carry the reference — callers render `${alt} ${altRef}`.
 */
export type LL = [number, number];
export interface TransectSample { t: number; lat: number; lon: number; elevM: number } // t = 0..1 along the line
export interface AltObject { lat: number; lon: number; altM: number; altRef: "AGL" | "MSL"; label: string; color?: string }
export interface PlottedObject extends AltObject { t: number; mslM: number; terrainM: number; offAxisKm: number }
export interface TransectPlot {
  samples: TransectSample[];
  objects: PlottedObject[];
  minEl: number;   // lowest terrain (or object) on the plot
  maxEl: number;   // highest terrain OR object MSL — the shared vertical scale
  lengthKm: number;
}

const R_LAT_KM = 110.574;
const lonKm = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

/** Great-circle-ish planar distance in km (fine at transect scales). */
export function distKm(a: LL, b: LL): number {
  const dy = (b[0] - a[0]) * R_LAT_KM;
  const dx = (b[1] - a[1]) * lonKm((a[0] + b[0]) / 2);
  return Math.hypot(dx, dy);
}

/** Sample terrain elevation at n points along a→b (inclusive of both ends). */
export function sampleTransect(a: LL, b: LL, n: number, sampler: (lat: number, lon: number) => number): TransectSample[] {
  const N = Math.max(2, Math.floor(n));
  const out: TransectSample[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const lat = a[0] + (b[0] - a[0]) * t;
    const lon = a[1] + (b[1] - a[1]) * t;
    out.push({ t, lat, lon, elevM: sampler(lat, lon) });
  }
  return out;
}

/** Project an object onto the a→b line: along-track fraction t (clamped) + perpendicular km. */
export function projectOntoLine(obj: LL, a: LL, b: LL): { t: number; offAxisKm: number } {
  const midLat = (a[0] + b[0]) / 2;
  const ax = 0, ay = 0;
  const bx = (b[1] - a[1]) * lonKm(midLat), by = (b[0] - a[0]) * R_LAT_KM;
  const px = (obj[1] - a[1]) * lonKm(midLat), py = (obj[0] - a[0]) * R_LAT_KM;
  const len2 = bx * bx + by * by || 1e-9;
  const tRaw = (px * bx + py * by) / len2;
  const t = Math.min(1, Math.max(0, tRaw));
  const cx = ax + bx * t, cy = ay + by * t;
  const offAxisKm = Math.hypot(px - cx, py - cy);
  return { t, offAxisKm };
}

/**
 * Full transect plot. `corridorKm` keeps only objects within that perpendicular distance of
 * the line (default 5 km). The vertical scale (min/max) spans terrain AND object MSL heights
 * so airborne tracks and terrain share one axis.
 */
export function computeTransect(
  a: LL, b: LL,
  sampler: (lat: number, lon: number) => number,
  objects: AltObject[] = [],
  n = 120,
  corridorKm = 5,
): TransectPlot {
  const samples = sampleTransect(a, b, n, sampler);
  let minEl = Infinity, maxEl = -Infinity;
  for (const s of samples) { if (s.elevM < minEl) minEl = s.elevM; if (s.elevM > maxEl) maxEl = s.elevM; }
  const plotted: PlottedObject[] = [];
  for (const o of objects) {
    const { t, offAxisKm } = projectOntoLine([o.lat, o.lon], a, b);
    if (offAxisKm > corridorKm) continue;
    const terrainM = sampler(o.lat, o.lon);
    const mslM = o.altRef === "MSL" ? o.altM : terrainM + o.altM; // AGL → add terrain
    if (mslM > maxEl) maxEl = mslM;
    if (mslM < minEl) minEl = mslM;
    plotted.push({ ...o, t, mslM, terrainM, offAxisKm });
  }
  if (!Number.isFinite(minEl)) { minEl = 0; maxEl = 1; }
  return { samples, objects: plotted, minEl, maxEl, lengthKm: distKm(a, b) };
}
