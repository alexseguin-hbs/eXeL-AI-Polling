/**
 * SECURITY-2525 · MGRS coordinate engine (WGS84 → UTM → MGRS)
 * ===========================================================
 * Self-contained, no deps. Verified against known survey points:
 *   White House  38.8977, -77.0365  → 18S UJ 2339 0739
 *   Camp Mabry   30.3160, -97.7639  → 14R PU 1884 5444
 *   JBLM         47.0855, -122.5821 → 10T ET 3172 1475
 *
 * Precision (per FAAD convention, digits per axis):
 *   4 → 8-digit grid  (10 m)  — DEFAULT
 *   5 → 10-digit grid (1 m)
 *   6 → 12-digit grid (0.1 m — sub-meter, computed from float easting/northing)
 */

const A = 6378137.0;
const F = 1 / 298.257223563;
const K0 = 0.9996;
const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);

export interface Utm {
  zone: number;
  easting: number;
  northing: number;
}

export function latLonToUtm(lat: number, lon: number): Utm {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const lon0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const phi = lat * (Math.PI / 180);
  const lam = lon * (Math.PI / 180);
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const N = A / Math.sqrt(1 - E2 * sin * sin);
  const T = Math.tan(phi) ** 2;
  const C = EP2 * cos * cos;
  const Ax = cos * (lam - lon0);
  const M =
    A *
    ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256) * phi -
      ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * E2 * E2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * E2 ** 3) / 3072) * Math.sin(6 * phi));
  const easting =
    K0 * N * (Ax + ((1 - T + C) * Ax ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * Ax ** 5) / 120) +
    500000;
  let northing =
    K0 *
    (M +
      N *
        Math.tan(phi) *
        ((Ax * Ax) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Ax ** 4) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * Ax ** 6) / 720));
  if (lat < 0) northing += 10000000;
  return { zone, easting, northing };
}

const BANDS = "CDEFGHJKLMNPQRSTUVWX";
const COLS = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"];
const ROWS = "ABCDEFGHJKLMNPQRSTUV";

export function latBand(lat: number): string {
  return BANDS[Math.min(Math.max(Math.floor((lat + 80) / 8), 0), 19)];
}

/** digits = per-axis digits (4 = 8-digit grid, FAAD default). */
export function latLonToMgrs(lat: number, lon: number, digits: 4 | 5 | 6 = 4): string {
  const { zone, easting, northing } = latLonToUtm(lat, lon);
  const col = COLS[(zone - 1) % 3][Math.floor(easting / 100000) - 1];
  const row = ROWS[(Math.floor(northing / 100000) + (zone % 2 === 0 ? 5 : 0)) % 20];
  // sub-meter precision (digits=6) needs the fractional meters
  const scale = 10 ** (digits - 5);
  const e = Math.floor((easting % 100000) * scale);
  const n = Math.floor((northing % 100000) * scale);
  const pad = (v: number) => String(v).padStart(digits, "0");
  return `${zone}${latBand(lat)} ${col}${row} ${pad(e)} ${pad(n)}`;
}

/** Inverse UTM → WGS84 (Snyder/USGS series). `south` adds the false northing. */
export function utmToLatLon(zone: number, easting: number, northing: number, south: boolean): { lat: number; lon: number } {
  const x = easting - 500000;
  const y = south ? northing - 10000000 : northing;
  const lon0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const M = y / K0;
  const mu = M / (A * (1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256));
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const sin1 = Math.sin(phi1), cos1 = Math.cos(phi1), tan1 = Math.tan(phi1);
  const N1 = A / Math.sqrt(1 - E2 * sin1 * sin1);
  const T1 = tan1 * tan1;
  const C1 = EP2 * cos1 * cos1;
  const R1 = (A * (1 - E2)) / Math.pow(1 - E2 * sin1 * sin1, 1.5);
  const D = x / (N1 * K0);
  const lat =
    phi1 -
    ((N1 * tan1) / R1) *
      ((D * D) / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * D ** 6) / 720);
  const lon =
    lon0 +
    (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * D ** 5) / 120) /
      cos1;
  return { lat: (lat * 180) / Math.PI, lon: (lon * 180) / Math.PI };
}

/**
 * Parse an MGRS string ("14R PU 2111 4983" or "14RPU21114983") → WGS84.
 * `refLat` resolves the 100 km northing-band ambiguity (row letters repeat every
 * 2,000,000 m) — pass the current AO/selection latitude. Returns null on bad input.
 */
export function mgrsToLatLon(s: string, refLat = 0): { lat: number; lon: number } | null {
  const clean = s.trim().toUpperCase().replace(/\s+/g, "");
  const m = clean.match(/^(\d{1,2})([C-HJ-NP-X])([A-HJ-NP-Z])([A-HJ-NP-V])(\d+)$/);
  if (!m) return null;
  const zone = parseInt(m[1], 10);
  if (zone < 1 || zone > 60) return null;
  const band = m[2], colL = m[3], rowL = m[4], digits = m[5];
  if (digits.length % 2 !== 0 || digits.length === 0) return null;
  const half = digits.length / 2;
  const scale = 10 ** (5 - half);
  const eWithin = parseInt(digits.slice(0, half), 10) * scale;
  const nWithin = parseInt(digits.slice(half), 10) * scale;
  const colIdx = COLS[(zone - 1) % 3].indexOf(colL);
  const rowIdx = ROWS.indexOf(rowL);
  if (colIdx < 0 || rowIdx < 0) return null;
  const easting = (colIdx + 1) * 100000 + eWithin;
  const south = band < "N";
  // northing 100 km index ≡ (rowIdx − offset) mod 20; disambiguate to nearest refLat.
  const offset = zone % 2 === 0 ? 5 : 0;
  const base = ((rowIdx - offset) % 20 + 20) % 20;
  const refN = latLonToUtm(refLat, ((zone - 1) * 6 - 180 + 3)).northing;
  let bestN = base * 100000 + nWithin, bestErr = Infinity;
  for (let k = -1; k <= 100; k++) {
    const cand = (base + 20 * k) * 100000 + nWithin;
    if (cand < 0) continue;
    const err = Math.abs(cand - refN);
    if (err < bestErr) { bestErr = err; bestN = cand; }
  }
  return utmToLatLon(zone, easting, bestN, south);
}

/** Parse "30°16'27.5\"N 97°44'27\"W" (or 30 16 27 N, 97 44 27 W) → WGS84. */
export function dmsToLatLon(s: string): { lat: number; lon: number } | null {
  const parts = s.trim().toUpperCase().match(/(\d+(?:\.\d+)?)[°º:\s]+(\d+(?:\.\d+)?)['′:\s]+(\d+(?:\.\d+)?)["″]?\s*([NSEW])/g);
  if (!parts || parts.length < 2) return null;
  const one = (p: string) => {
    const m = p.match(/(\d+(?:\.\d+)?)[°º:\s]+(\d+(?:\.\d+)?)['′:\s]+(\d+(?:\.\d+)?)["″]?\s*([NSEW])/);
    if (!m) return null;
    const v = parseFloat(m[1]) + parseFloat(m[2]) / 60 + parseFloat(m[3]) / 3600;
    return { v: m[4] === "S" || m[4] === "W" ? -v : v, hemi: m[4] };
  };
  const a = one(parts[0]), b = one(parts[1]);
  if (!a || !b) return null;
  const lat = a.hemi === "N" || a.hemi === "S" ? a.v : b.v;
  const lon = a.hemi === "E" || a.hemi === "W" ? a.v : b.v;
  return { lat, lon };
}

export interface GridLine {
  /** 0..1 fraction across the AO box */
  frac: number;
  /** km value within the 100 km square (0-99), for edge labels */
  km: number;
}

/**
 * Pick a UTM grid step (m) so ~6–14 lines span the box — 10 m (8-digit MGRS) when
 * zoomed in, EXPANDING through km up to 1000 km at continental/globe scale (the
 * scale bar tracks this — it must not stay stuck at 10 km when zoomed out).
 */
export function chooseGridStep(spanMeters: number): number {
  const steps = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000,
    100000, 250000, 500000, 1000000];
  const target = spanMeters / 9;
  for (const s of steps) if (s >= target) return s;
  return steps[steps.length - 1];
}

/**
 * UTM grid lines for a lat/lon bounding box, as screen fractions, at a chosen
 * step in meters. `km` carries the grid ordinate: value/1000 when step≥1 km,
 * else metres-within-km — the map header states the active step.
 */
export function utmKmGrid(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number,
  stepM = 1000
): { vertical: GridLine[]; horizontal: GridLine[]; stepM: number } {
  const latC = (latMin + latMax) / 2;
  const lonC = (lonMin + lonMax) / 2;
  const w = latLonToUtm(latC, lonMin).easting;
  const e = latLonToUtm(latC, lonMax).easting;
  const s = latLonToUtm(latMin, lonC).northing;
  const n = latLonToUtm(latMax, lonC).northing;
  // Label: km number (00–99) when step ≥ 1 km, else metres-within-km (0–900).
  const ord = (v: number) => (stepM >= 1000 ? Math.floor(v / 1000) % 100 : Math.round(v % 1000));
  const vertical: GridLine[] = [];
  for (let E = Math.ceil(w / stepM) * stepM; E < e; E += stepM) {
    vertical.push({ frac: (E - w) / (e - w), km: ord(E) });
  }
  const horizontal: GridLine[] = [];
  for (let N = Math.ceil(s / stepM) * stepM; N < n; N += stepM) {
    horizontal.push({ frac: (n - N) / (n - s), km: ord(N) });
  }
  return { vertical, horizontal, stepM };
}
