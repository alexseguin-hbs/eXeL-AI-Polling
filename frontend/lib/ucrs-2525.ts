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

export type SurfaceKind = "rocky" | "banded";
export interface Planet {
  id: string; name: string;
  aAU: number;    // semi-major axis (AU)
  e: number;      // eccentricity
  tDays: number;  // orbital period (Earth days)
  color: string;  // 13-Trinity spectrum: Mercury=red … Neptune=violet … Pluto=UV
  dot: number;    // relative visual dot radius (Earth is largest — the reference/home planet)
  ea: string;     // reference Planet Angular Units (Earth = "230.1584")
  radiusKm: number;    // real equatorial radius (m/1000) — drives Actual planet-size mode + the 3D globe
  surface: SurfaceKind; // 3D globe render style: rocky (craters) or banded (gas/ice giant)
  globe: string;       // realistic base albedo colour for the draggable 3D globe (distinct from Trinity dot colour)
  rings?: boolean;     // Saturn — draw ring system on the 3D globe + map dot
}

// Mercury → Neptune → Pluto, coloured across the Trinity spectrum (red → violet → ultraviolet).
// radiusKm = real equatorial radius (Jupiter 69,911 → Pluto 1,188); globe = realistic albedo for the 3D view.
export const PLANETS: Planet[] = [
  { id: "mercury", name: "Mercury", aAU: 0.387098, e: 0.205630, tDays: 87.969, color: "#ff2d2d", dot: 1.1, ea: "—", radiusKm: 2439.7, surface: "rocky", globe: "#8c8378" },
  { id: "venus", name: "Venus", aAU: 0.723332, e: 0.006772, tDays: 224.701, color: "#ff8c1a", dot: 1.5, ea: "—", radiusKm: 6051.8, surface: "banded", globe: "#d9b87a" },
  { id: "earth", name: "Earth", aAU: 1.000000, e: 0.016710, tDays: 365.2422, color: "#ffd400", dot: 2.6, ea: "230.1584", radiusKm: 6371.0, surface: "rocky", globe: "#2f6fb0" },
  { id: "mars", name: "Mars", aAU: 1.523679, e: 0.093400, tDays: 686.980, color: "#22c55e", dot: 1.3, ea: "—", radiusKm: 3389.5, surface: "rocky", globe: "#b5502f" },
  { id: "jupiter", name: "Jupiter", aAU: 5.204267, e: 0.048775, tDays: 4332.589, color: "#19c8cf", dot: 2.2, ea: "—", radiusKm: 69911, surface: "banded", globe: "#c9a06a" },
  { id: "saturn", name: "Saturn", aAU: 9.582017, e: 0.055723, tDays: 10759.22, color: "#3b82f6", dot: 2.0, ea: "—", radiusKm: 58232, surface: "banded", globe: "#d9c48a", rings: true },
  { id: "uranus", name: "Uranus", aAU: 19.18916, e: 0.047220, tDays: 30688.5, color: "#6366f1", dot: 1.7, ea: "—", radiusKm: 25362, surface: "banded", globe: "#a5d6d9" },
  { id: "neptune", name: "Neptune", aAU: 30.06992, e: 0.008678, tDays: 60182.0, color: "#a855f7", dot: 1.7, ea: "—", radiusKm: 24622, surface: "banded", globe: "#3a5bd0" }, // violet — "last planet"
  { id: "pluto", name: "Pluto", aAU: 39.48211, e: 0.248808, tDays: 90560.0, color: "#d400ff", dot: 0.9, ea: "—", radiusKm: 1188.3, surface: "rocky", globe: "#b8a68f" },   // ultraviolet (UV)
];

/** Earth's Moon — companion body for the 3D globe view (rocky, cratered, grey). */
export const MOON = { id: "moon", name: "Moon", radiusKm: 1737.4, color: "#c7c7d0", surface: "rocky" as SurfaceKind, globe: "#9a9aa2" };

/** Largest body radius (Jupiter) — normaliser for the Actual planet-size mode. */
export const RADIUS_MAX_KM = 69911;
/**
 * Map dot radius for a planet. "exaggerated" = legibility sizes (Earth emphasised, the default);
 * "actual" = true relative sizes (Jupiter ≫ Earth ≫ Pluto), floored so tiny worlds stay pickable.
 */
export const planetDotRadius = (p: Planet, mode: "actual" | "exaggerated") =>
  mode === "actual" ? Math.max(0.5, (p.radiusKm / RADIUS_MAX_KM) * 6) : p.dot;

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

// ── SR distance units — left value tap-cycles m → ×10⁶ m → ×10⁹ m → AU; km is always shown on the right ──
export type SrUnit = "m" | "1e6" | "1e9" | "AU";
export const SR_UNIT_CYCLE: SrUnit[] = ["m", "1e6", "1e9", "AU"];
export function fmtSr(meters: number, unit: SrUnit): string {
  if (unit === "AU") return `${(meters / AU).toLocaleString(undefined, { maximumFractionDigits: 4 })} AU`;
  if (unit === "1e6") return `${(meters / 1e6).toLocaleString(undefined, { maximumFractionDigits: 3 })} ×10⁶ m`;
  if (unit === "1e9") return `${(meters / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} ×10⁹ m`;
  return `${Math.round(meters).toLocaleString()} m`;
}
export const fmtKm = (meters: number) => `${Math.round(meters / 1000).toLocaleString()} km`;
/** LTU (local seconds elapsed) → whole days, for the human-readable time readout. */
export const ltuToDays = (ltuSeconds: number) => Math.round(ltuSeconds / 86400);
