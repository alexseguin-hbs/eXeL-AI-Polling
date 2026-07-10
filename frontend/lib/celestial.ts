/**
 * SECURITY-2525 · UCRS-2525 celestial module
 * ===========================================
 * Dependency-free sun + moon position (azimuth from NORTH clockwise, altitude above
 * horizon) and moon phase, for plotting on the sky dome. Derived from SunCalc
 * (Vladimir Agafonkin, BSD-2) — low-precision but ample for a planetarium overlay,
 * fully offline / Raspberry-Pi-class (EDGE-2525). No network, no Date in module scope.
 */

const rad = Math.PI / 180;
const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588, J2000 = 2451545;
const e = rad * 23.4397; // obliquity of the ecliptic

const toJulian = (d: Date) => d.valueOf() / dayMs - 0.5 + J1970;
const toDays = (d: Date) => toJulian(d) - J2000;

const rightAscension = (l: number, b: number) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
const declination = (l: number, b: number) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
const siderealTime = (d: number, lw: number) => rad * (280.16 + 360.9856235 * d) - lw;

// azimuth measured from SOUTH clockwise (SunCalc convention) → we convert to from-NORTH below
const azimuthS = (H: number, phi: number, dec: number) => Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
const altitudeF = (H: number, phi: number, dec: number) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));

function sunCoords(d: number) {
  const M = rad * (357.5291 + 0.98560028 * d);
  const L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
  return { dec: declination(L, 0), ra: rightAscension(L, 0), L };
}

function moonCoords(d: number) {
  const L = rad * (218.316 + 13.176396 * d);
  const M = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.229350 * d);
  const l = L + rad * 6.289 * Math.sin(M);
  const b = rad * 5.128 * Math.sin(F);
  return { ra: rightAscension(l, b), dec: declination(l, b), M, L };
}

export interface SkyPos { azimuth: number; altitude: number } // azimuth: radians from NORTH clockwise; altitude: radians above horizon

/** Sun azimuth (from North, CW) + altitude for a lat/lon at a given time. */
export function getSunPosition(date: Date, lat: number, lon: number): SkyPos {
  const lw = rad * -lon, phi = rad * lat, d = toDays(date);
  const c = sunCoords(d), H = siderealTime(d, lw) - c.ra;
  return { azimuth: azimuthS(H, phi, c.dec) + Math.PI, altitude: altitudeF(H, phi, c.dec) };
}

/** Moon azimuth (from North, CW) + altitude. */
export function getMoonPosition(date: Date, lat: number, lon: number): SkyPos {
  const lw = rad * -lon, phi = rad * lat, d = toDays(date);
  const c = moonCoords(d), H = siderealTime(d, lw) - c.ra;
  const h = altitudeF(H, phi, c.dec);
  return { azimuth: azimuthS(H, phi, c.dec) + Math.PI, altitude: h };
}

/** Moon illuminated fraction (0=new … 1=full) + phase (0..1, 0=new, .5=full) + waxing flag. */
export function getMoonIllumination(date: Date): { fraction: number; phase: number; waxing: boolean } {
  const d = toDays(date);
  const s = sunCoords(d), m = moonCoords(d);
  const sdist = 149598000; // km, ~1 AU
  const mdist = 385001 - 20905 * Math.cos(m.M);
  const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
  const inc = Math.atan2(sdist * Math.sin(phi), mdist - sdist * Math.cos(phi));
  const angle = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
  const phase = 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI;
  return { fraction: (1 + Math.cos(inc)) / 2, phase, waxing: angle < 0 };
}

/** Sample a body's arc across the sky over ±hours from `date` (its diurnal path). Returns
 *  {azimuth, altitude, t} points; caller clips to altitude >= horizon and projects to the dome. */
export function skyArc(fn: (d: Date, lat: number, lon: number) => SkyPos, date: Date, lat: number, lon: number, hours = 14, stepMin = 20): Array<SkyPos & { t: number }> {
  const out: Array<SkyPos & { t: number }> = [];
  const half = hours * 60;
  for (let m = -half; m <= half; m += stepMin) {
    const d = new Date(date.valueOf() + m * 60 * 1000);
    const p = fn(d, lat, lon);
    out.push({ ...p, t: m });
  }
  return out;
}
