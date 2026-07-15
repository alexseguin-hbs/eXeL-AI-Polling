/**
 * REAL heliocentric ephemeris — planets at their TRUE relative positions (Kepler from JPL J2000 elements).
 * Pure + deterministic (no wall-clock; `dateToJD` uses Date.UTC on explicit args only). Used ADDITIVELY by the
 * celestial map's "accurate" mode; verified by `tests/celestial-truth.mjs` against the J2000 λ snapshot.
 * Source: E.M. Standish / JPL SSD "Keplerian Elements for Approximate Positions of the Major Planets" (p_elem_t1),
 * valid 1800–2050. See docs/architecture-2525/CELESTIAL_SKY_SPEC.md §4/§6.
 */

const J2000 = 2451545;              // JD of 2000-01-01 12:00 TT
const DEG = Math.PI / 180;

// element @ J2000 + rate per Julian century — [value0, ratePerCy]. L = mean longitude, vp = longitude of perihelion,
// i = inclination, om = longitude of ascending node (i/om drive the ecliptic-longitude projection for inclined orbits).
const EL: Record<string, { L: [number, number]; vp: [number, number]; e: [number, number]; i: [number, number]; om: [number, number] }> = {
  mercury: { L: [252.25032350, 149472.67411175], vp: [77.45779628, 0.16047689], e: [0.20563593, 0.00001906], i: [7.00497902, -0.00594749], om: [48.33076593, -0.12534081] },
  venus:   { L: [181.97909950, 58517.81538729], vp: [131.60246718, 0.00268329], e: [0.00677672, -0.00004107], i: [3.39467605, -0.00078890], om: [76.67984255, -0.27769418] },
  earth:   { L: [100.46457166, 35999.37244981], vp: [102.93768193, 0.32327364], e: [0.01671123, -0.00004392], i: [-0.00001531, -0.01294668], om: [0.0, 0.0] },
  mars:    { L: [-4.55343205, 19140.30268499], vp: [-23.94362959, 0.44441088], e: [0.09339410, 0.00007882], i: [1.84969142, -0.00813131], om: [49.55953891, -0.29257343] },
  jupiter: { L: [34.39644051, 3034.74612775], vp: [14.72847983, 0.21252668], e: [0.04838624, -0.00013253], i: [1.30439695, -0.00183714], om: [100.47390909, 0.20469106] },
  saturn:  { L: [49.95424423, 1222.49362201], vp: [92.59887831, -0.41897216], e: [0.05386179, -0.00050991], i: [2.48599187, 0.00193609], om: [113.66242448, -0.28867794] },
  uranus:  { L: [313.23810451, 428.48202785], vp: [170.95427630, 0.40805281], e: [0.04725744, -0.00004397], i: [0.77263783, -0.00242939], om: [74.01692503, 0.04240589] },
  neptune: { L: [-55.12002969, 218.45945325], vp: [44.96476227, -0.32241464], e: [0.00859048, 0.00005105], i: [1.77004347, 0.00035372], om: [131.78422574, -0.00508664] },
  pluto:   { L: [238.92903833, 145.20780515], vp: [224.06891629, -0.04062942], e: [0.24882730, 0.00005170], i: [17.14001206, 0.00004818], om: [110.30393684, -0.01183482] },
};

/** Deterministic Julian Date from the shared UCRS inputs (Date.UTC is pure math on explicit args). */
export function dateToJD(year: number, doy: number, hour: number): number {
  return Date.UTC(year, 0, doy, Math.floor(hour), Math.round((hour % 1) * 60)) / 86400000 + 2440587.5;
}

/** Solve Kepler's equation M = E − e·sinE (radians) by Newton iteration — fixed 8 iters (deterministic). */
export function solveKepler(M: number, e: number): number {
  let E = M;
  for (let k = 0; k < 8; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

/** Real heliocentric ecliptic LONGITUDE (deg, 0..360), full 3D projection (handles inclination — Pluto-accurate). */
export function heliocentricLon(planetId: string, jd: number): number {
  const el = EL[planetId];
  if (!el) return 0;
  const T = (jd - J2000) / 36525;
  const vp = el.vp[0] + el.vp[1] * T;
  const om = el.om[0] + el.om[1] * T;
  const i = (el.i[0] + el.i[1] * T) * DEG;
  const nu = trueAnomaly(planetId, jd) * DEG;        // true anomaly from perihelion
  const u = (vp - om) * DEG + nu;                     // argument of latitude = (ω) + ν
  // ecliptic longitude λ = Ω + atan2(cos i · sin u, cos u)
  return ((om + Math.atan2(Math.cos(i) * Math.sin(u), Math.cos(u)) / DEG) % 360 + 360) % 360;
}

/** True anomaly ν (deg, 0..360) — angle from perihelion in the orbital plane = the UCRS Base-3600 "HU" angle. */
export function trueAnomaly(planetId: string, jd: number): number {
  const el = EL[planetId];
  if (!el) return 0;
  const T = (jd - J2000) / 36525;
  const L = el.L[0] + el.L[1] * T;
  const vp = el.vp[0] + el.vp[1] * T;
  const e = el.e[0] + el.e[1] * T;
  const M = (((L - vp) % 360) + 540) % 360 - 180;   // mean anomaly in [-180, 180]
  const E = solveKepler(M * DEG, e);
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  return ((nu / DEG) % 360 + 360) % 360;
}

export const HAS_EPHEMERIS = (id: string) => id in EL;
