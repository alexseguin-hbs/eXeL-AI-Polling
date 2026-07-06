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

export interface GridLine {
  /** 0..1 fraction across the AO box */
  frac: number;
  /** km value within the 100 km square (0-99), for edge labels */
  km: number;
}

/**
 * 1 km UTM grid lines for a lat/lon bounding box, as screen fractions.
 * Vertical lines from eastings at center latitude; horizontal from northings
 * at center longitude (linear across a ~12 km AO — visually exact at this scale).
 */
export function utmKmGrid(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number
): { vertical: GridLine[]; horizontal: GridLine[] } {
  const latC = (latMin + latMax) / 2;
  const lonC = (lonMin + lonMax) / 2;
  const w = latLonToUtm(latC, lonMin).easting;
  const e = latLonToUtm(latC, lonMax).easting;
  const s = latLonToUtm(latMin, lonC).northing;
  const n = latLonToUtm(latMax, lonC).northing;
  const vertical: GridLine[] = [];
  for (let E = Math.ceil(w / 1000) * 1000; E < e; E += 1000) {
    vertical.push({ frac: (E - w) / (e - w), km: Math.floor(E / 1000) % 100 });
  }
  const horizontal: GridLine[] = [];
  for (let N = Math.ceil(s / 1000) * 1000; N < n; N += 1000) {
    // frac measured from TOP of the box (screen y)
    horizontal.push({ frac: (n - N) / (n - s), km: Math.floor(N / 1000) % 100 });
  }
  return { vertical, horizontal };
}
