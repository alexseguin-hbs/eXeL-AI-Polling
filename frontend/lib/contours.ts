/**
 * SECURITY-2525 · Elevation contour engine (pure + deterministic)
 * ================================================================
 * Marching squares over a capped grid → 3–9 "nice" levels as SVG line paths in the
 * 0–100 map viewBox. Land = at/above MSL(seaLevel); bathymetry = below. The sampler
 * is `terrainMSL` today (synthetic, DEM PENDING) — swap for real USGS 3DEP /
 * Copernicus GLO-30 / GEBCO tiles behind this same interface later (R-CORE modularity).
 * Extracted from the map component so the line geometry can be unit-tested.
 */

/** SYNTHETIC elevation (meters) — deterministic pseudo-terrain until real DEM. */
export function synthElevation(lat: number, lon: number): number {
  const e =
    120 * Math.sin(lon * 3.0 + 0.3) * Math.cos(lat * 2.7) +
    55 * Math.sin(lon * 42 + lat * 37) +
    28 * Math.cos(lon * 190 - lat * 160) +
    13 * Math.sin(lon * 640 + lat * 560);
  return Math.max(0, 190 + e);
}

/**
 * MSL-referenced terrain (m): land ≥ 0, ocean < 0 (depth from Mean Sea Level).
 * Inland AOs fall back to synthElevation (all land). The Florida peninsula gets a
 * real coastline so bathymetry contours appear offshore (littoral test until GEBCO).
 */
export function terrainMSL(lat: number, lon: number): number {
  const inFla = lat > 24.3 && lat < 31.2 && lon > -88 && lon < -79;
  if (inFla) {
    const gulfCoast = -82.8 + 0.05 * Math.sin(lat * 6);   // wavy Gulf shoreline
    const atlCoast = -80.05 + 0.05 * Math.cos(lat * 7);   // wavy Atlantic shoreline
    if (lon < gulfCoast) return -Math.min(180, (gulfCoast - lon) * 90) + 6 * Math.sin(lon * 30); // Gulf shelf
    if (lon > atlCoast) return -Math.min(320, (lon - atlCoast) * 260);                            // Atlantic (deeper)
    return Math.max(0, 12 + 9 * Math.sin(lon * 40 + lat * 30) + 5 * Math.cos(lat * 55)); // low flat land
  }
  return synthElevation(lat, lon);
}

export interface ContourOpts { count: number; interval: number; fidelity: "low" | "med" | "high"; seaLevel: number; }
export interface ContourLine { level: number; d: string; land: boolean; major: boolean; label: { x: number; y: number } | null; }
export interface ContourSet { lines: ContourLine[]; min: number; max: number; step: number; count: number; }

export function niceStep(raw: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1e-6, raw))));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

const MS_CASES: Record<number, [string, string][]> = {
  1: [["L", "B"]], 2: [["B", "R"]], 3: [["L", "R"]], 4: [["T", "R"]], 5: [["T", "L"], ["B", "R"]],
  6: [["T", "B"]], 7: [["T", "L"]], 8: [["T", "L"]], 9: [["T", "B"]], 10: [["T", "R"], ["B", "L"]],
  11: [["T", "R"]], 12: [["L", "R"]], 13: [["B", "R"]], 14: [["L", "B"]],
};

export function computeContours(box: { latMin: number; latMax: number; lonMin: number; lonMax: number }, o: ContourOpts): ContourSet {
  const G = o.fidelity === "high" ? 72 : o.fidelity === "low" ? 32 : 48;
  const V: number[][] = [];
  for (let r = 0; r < G; r++) {
    const lat = box.latMax - (r / (G - 1)) * (box.latMax - box.latMin);
    const row: number[] = [];
    for (let c = 0; c < G; c++) {
      const lon = box.lonMin + (c / (G - 1)) * (box.lonMax - box.lonMin);
      row.push(terrainMSL(lat, lon) - o.seaLevel); // MSL-referenced (land ≥0, ocean <0)
    }
    V.push(row);
  }
  let mn = Infinity, mx = -Infinity;
  for (const row of V) for (const v of row) { if (v < mn) mn = v; if (v > mx) mx = v; }
  const rng = Math.max(1, mx - mn);
  const count = Math.min(9, Math.max(3, o.count));
  const step = o.interval > 0 ? o.interval : niceStep(rng / (count + 1));
  const levels: number[] = [];
  for (let L = Math.ceil(mn / step) * step; L < mx; L += step) levels.push(L);
  while (levels.length > 9) levels.splice(Math.floor(levels.length / 2), 1); // cap at 9
  const px = (c: number) => (c / (G - 1)) * 100;
  const py = (r: number) => (r / (G - 1)) * 100;
  const cl = (t: number) => Math.min(1, Math.max(0, t));
  const lines: ContourLine[] = [];
  for (const L of levels) {
    let d = "";
    let labelPt: { x: number; y: number } | null = null;
    for (let r = 0; r < G - 1; r++) {
      for (let c = 0; c < G - 1; c++) {
        const tl = V[r][c], tr = V[r][c + 1], br = V[r + 1][c + 1], bl = V[r + 1][c];
        const idx = (tl > L ? 8 : 0) | (tr > L ? 4 : 0) | (br > L ? 2 : 0) | (bl > L ? 1 : 0);
        const segs = MS_CASES[idx];
        if (!segs) continue;
        const it = (a: number, b: number) => cl((L - a) / ((b - a) || 1e-9));
        const pt = (edge: string): [number, number] =>
          edge === "T" ? [px(c + it(tl, tr)), py(r)]
            : edge === "B" ? [px(c + it(bl, br)), py(r + 1)]
              : edge === "L" ? [px(c), py(r + it(tl, bl))]
                : [px(c + 1), py(r + it(tr, br))];
        for (const [a, b] of segs) {
          const p1 = pt(a), p2 = pt(b);
          d += `M${p1[0].toFixed(2)} ${p1[1].toFixed(2)}L${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
          if (!labelPt) labelPt = { x: (p1[0] + p2[0]) / 2, y: (p1[1] + p2[1]) / 2 };
        }
      }
    }
    if (d) lines.push({ level: L + o.seaLevel, d, land: L >= 0, major: false, label: labelPt });
  }
  // Mark key "major" contours (thicker + labelled) with thin minors between.
  // At least 3 majors (or all lines if fewer); roughly every 3rd line otherwise.
  const desiredMajors = Math.min(lines.length, Math.max(3, Math.round(lines.length / 3)));
  const majorStep = Math.max(1, Math.round(lines.length / Math.max(1, desiredMajors)));
  lines.forEach((ln, i) => { ln.major = i % majorStep === 0; });
  return { lines, min: mn + o.seaLevel, max: mx + o.seaLevel, step, count: levels.length };
}
