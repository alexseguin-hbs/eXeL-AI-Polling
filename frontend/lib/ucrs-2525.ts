/**
 * UCRS-2525 · Base-3600 Universal Planetary Coordinate System (Master of Thought spec).
 * ====================================================================================
 * A consistent hierarchical base-3600 notation describing planetary position + motion for ANY solar system.
 *   A = Star Angular Units (SA)      · tilt/orientation of the star
 *   B = Planet Angular Units (EA)    · tilt of the reference planet (Earth = 230.1584)
 *   C = Horizontal Angular Units (HU)· position around the elliptical orbit, 0 = PERIHELION
 *   1 A = 3600 B · 1 B = 3600 C · 1 A = 12,960,000 C
 * HU 0 → perihelion (closest), HU 1800 → aphelion (farthest), HU 3600 → full orbit (= 3600.3600..3600).
 * Per-position outputs: SR (star radius, m) · SP-OTU (orbit fraction 0..1) · RTU (time in 3600 units) ·
 * LTU (local smallest time unit, e.g. Earth seconds). Pure + deterministic. 2525-core candidate.
 */

export const AU = 1.495978707e11; // metres
const DEG = Math.PI / 180;

export interface Planet {
  id: string; name: string;
  aAU: number;    // semi-major axis (AU)
  e: number;      // eccentricity
  tDays: number;  // orbital period (Earth days)
  color: string;  // 13-Trinity spectrum: Mercury=red … Neptune=violet … Pluto=UV
  dot: number;    // relative visual dot radius (Earth is largest — the reference/home planet)
  ea: string;     // reference Planet Angular Units (Earth = "230.1584")
}

// Mercury → Neptune → Pluto, coloured across the Trinity spectrum (red → violet → ultraviolet).
export const PLANETS: Planet[] = [
  { id: "mercury", name: "Mercury", aAU: 0.387098, e: 0.205630, tDays: 87.969, color: "#ff2d2d", dot: 1.1, ea: "—" },
  { id: "venus", name: "Venus", aAU: 0.723332, e: 0.006772, tDays: 224.701, color: "#ff8c1a", dot: 1.5, ea: "—" },
  { id: "earth", name: "Earth", aAU: 1.000000, e: 0.016710, tDays: 365.2422, color: "#ffd400", dot: 2.6, ea: "230.1584" },
  { id: "mars", name: "Mars", aAU: 1.523679, e: 0.093400, tDays: 686.980, color: "#22c55e", dot: 1.3, ea: "—" },
  { id: "jupiter", name: "Jupiter", aAU: 5.204267, e: 0.048775, tDays: 4332.589, color: "#19c8cf", dot: 2.2, ea: "—" },
  { id: "saturn", name: "Saturn", aAU: 9.582017, e: 0.055723, tDays: 10759.22, color: "#3b82f6", dot: 2.0, ea: "—" },
  { id: "uranus", name: "Uranus", aAU: 19.18916, e: 0.047220, tDays: 30688.5, color: "#6366f1", dot: 1.7, ea: "—" },
  { id: "neptune", name: "Neptune", aAU: 30.06992, e: 0.008678, tDays: 60182.0, color: "#a855f7", dot: 1.7, ea: "—" }, // violet — "last planet"
  { id: "pluto", name: "Pluto", aAU: 39.48211, e: 0.248808, tDays: 90560.0, color: "#d400ff", dot: 0.9, ea: "—" },   // ultraviolet (UV)
];

/** Orbit radius (m) at true anomaly ν (deg from perihelion): r = a(1-e²)/(1+e·cosν). */
export function orbitR(aMeters: number, e: number, nuDeg: number): number {
  return (aMeters * (1 - e * e)) / (1 + e * Math.cos(nuDeg * DEG));
}
/** HU (0..3600) → true anomaly (deg, 0 at perihelion). */
export const huToNu = (hu: number) => (hu / 3600) * 360;

export const perihelionM = (p: Planet) => p.aAU * AU * (1 - p.e);
export const aphelionM = (p: Planet) => p.aAU * AU * (1 + p.e);

export interface UcrsReading {
  hu: number; nu: number;
  sr: number;        // star radius (m) at this HU
  spotu: number;     // orbit fraction 0..1
  rtu: number;       // time in 3600 units
  ltu: number;       // local time units (planet seconds elapsed)
  peri: number; aphe: number;
}
/** Full Base-3600 reading for a planet at a given HU. */
export function ucrsAt(p: Planet, hu: number): UcrsReading {
  const nu = huToNu(hu);
  const sr = orbitR(p.aAU * AU, p.e, nu);
  const spotu = hu / 3600;
  const tSec = p.tDays * 86400;
  return { hu, nu, sr, spotu, rtu: Math.round(hu), ltu: Math.round(spotu * tSec), peri: perihelionM(p), aphe: aphelionM(p) };
}

// ── Display helpers (v2 tilted-ellipsoid map) ──
/** Schematic semi-major (index-spaced) so all 9 planets are visible at once. */
export const axSchematic = (i: number) => 12 + i * 7.2;
/** True-scale semi-major (log of AU) so real proportions show while inner planets stay legible. */
export function axTrue(aAU: number): number {
  const lo = Math.log(0.387098), hi = Math.log(39.48211);
  return 9 + 70 * (Math.log(aAU) - lo) / (hi - lo);
}
/** Semi-minor / semi-major ratio of the true orbit (√(1-e²)); used before the tilt foreshortening. */
export const bOverA = (e: number) => Math.sqrt(1 - e * e);

/** Format a base-3600 unit as "N.0..0" (A.B..C notation, sub-units zeroed for the demo). */
export const fmt3600 = (n: number) => `${Math.round(n)}.0..0`;
/** The canonical full-orbit reference: 3600.3600..3600 (SA.EA..HU at one complete revolution). */
export const FULL_ORBIT = "3600.3600..3600";
export const fmtMeters = (m: number) => `${Math.round(m).toLocaleString()} m`;
