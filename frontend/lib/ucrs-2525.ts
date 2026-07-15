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
  tex: string;         // real equirectangular surface map (local /public/planets asset) for the textured 3D globe
  rotDays: number;     // sidereal axial rotation period (Earth days); negative = retrograde spin (Venus, Uranus, Pluto)
  incl: number;        // orbital inclination to the ecliptic (Earth's plane), degrees — how far the orbit tilts off Earth's
}

// Mercury → Neptune → Pluto, coloured across the Trinity spectrum (red → violet → ultraviolet).
// radiusKm = real equatorial radius (Jupiter 69,911 → Pluto 1,188); globe = realistic albedo for the 3D view.
export const PLANETS: Planet[] = [
  { id: "mercury", name: "Mercury", aAU: 0.387098, e: 0.205630, tDays: 87.969, color: "#ff2d2d", dot: 1.1, ea: "—", radiusKm: 2439.7, surface: "rocky", globe: "#8c8378", tex: "/planets/mercurymap.jpg", rotDays: 58.646, incl: 7.00 },
  { id: "venus", name: "Venus", aAU: 0.723332, e: 0.006772, tDays: 224.701, color: "#ff8c1a", dot: 1.5, ea: "—", radiusKm: 6051.8, surface: "banded", globe: "#d9b87a", tex: "/planets/venusmap.jpg", rotDays: -243.025, incl: 3.39 },
  { id: "earth", name: "Earth", aAU: 1.000000, e: 0.016710, tDays: 365.2422, color: "#ffd400", dot: 2.6, ea: "230.1584", radiusKm: 6371.0, surface: "rocky", globe: "#2f6fb0", tex: "/planets/earthmap1k.jpg", rotDays: 0.99726968, incl: 0.00 },
  { id: "mars", name: "Mars", aAU: 1.523679, e: 0.093400, tDays: 686.980, color: "#22c55e", dot: 1.3, ea: "—", radiusKm: 3389.5, surface: "rocky", globe: "#b5502f", tex: "/planets/marsmap1k.jpg", rotDays: 1.02595676, incl: 1.85 },
  { id: "jupiter", name: "Jupiter", aAU: 5.204267, e: 0.048775, tDays: 4332.589, color: "#19c8cf", dot: 2.2, ea: "—", radiusKm: 69911, surface: "banded", globe: "#c9a06a", tex: "/planets/jupitermap.jpg", rotDays: 0.41354, incl: 1.30 },
  { id: "saturn", name: "Saturn", aAU: 9.536676, e: 0.053862, tDays: 10759.22, color: "#3b82f6", dot: 2.0, ea: "—", radiusKm: 58232, surface: "banded", globe: "#d9c48a", rings: true, tex: "/planets/saturnmap.jpg", rotDays: 0.44401, incl: 2.49 },
  { id: "uranus", name: "Uranus", aAU: 19.18916, e: 0.047220, tDays: 30688.5, color: "#6366f1", dot: 1.7, ea: "—", radiusKm: 25362, surface: "banded", globe: "#a5d6d9", tex: "/planets/uranusmap.jpg", rotDays: -0.71833, incl: 0.77 },
  { id: "neptune", name: "Neptune", aAU: 30.06992, e: 0.008678, tDays: 60182.0, color: "#a855f7", dot: 1.7, ea: "—", radiusKm: 24622, surface: "banded", globe: "#3a5bd0", tex: "/planets/neptunemap.jpg", rotDays: 0.67125, incl: 1.77 }, // violet — "last planet"
  { id: "pluto", name: "Pluto", aAU: 39.48211, e: 0.248808, tDays: 90560.0, color: "#d400ff", dot: 0.9, ea: "—", radiusKm: 1188.3, surface: "rocky", globe: "#b8a68f", tex: "/planets/plutomap1k.jpg", rotDays: -6.38723, incl: 17.16 },   // ultraviolet (UV)
];

/** Earth's Moon — companion body for the 3D globe view (real NASA-derived albedo map). NASA Moon Fact Sheet values. */
export const MOON = { id: "moon", name: "Moon", radiusKm: 1737.4, color: "#c7c7d0", surface: "rocky" as SurfaceKind, globe: "#9a9aa2", tex: "/planets/moonmap1k.jpg", distanceKm: 384400, e: 0.0549, inclDeg: 5.145 };
/** Moon periods (days) — SINGLE SOURCE shared by the component + the truth harness. Tidally locked (spin = sidereal). */
export const MOON_SIDEREAL_DAYS = 27.3217;   // orbit vs the stars
export const MOON_SYNODIC_DAYS = 29.5306;    // phase cycle (new→new)
/** Saturn's ring colour strip (equirectangular radial). */
export const SATURN_RING_TEX = "/planets/saturnringcolor.jpg";

/** Largest planet radius (Jupiter) + the Sun — normalisers for the planet-size modes. */
export const RADIUS_MAX_KM = 69911;   // Jupiter — the largest
export const RADIUS_MIN_KM = 1188.3;  // Pluto — the smallest (Thematic spread anchor)
export const SUN_RADIUS_KM = 695700;
export const SUN_DOT_R = 4.8; // the Sun's dot radius on the map (viewBox units)
export type PlanetSizeMode = "truescale" | "proportional" | "thematic";
export const SIZE_MODES: PlanetSizeMode[] = ["truescale", "proportional", "thematic"];
export const SIZE_LABEL: Record<PlanetSizeMode, string> = { truescale: "True Scale", proportional: "Proportional", thematic: "Thematic" };
// Thematic base dot + spread: smallest planet = THEMATIC_BASE, largest = THEMATIC_BASE × (1 + THEMATIC_SPREAD).
const THEMATIC_BASE = 1.6, THEMATIC_SPREAD = 0.5;
/**
 * Map dot radius per size mode:
 *  • truescale    — real size relative to the SUN (planets are tiny specks; hit-target keeps them clickable),
 *  • proportional — real size relative to the other PLANETS (Jupiter ≫ Earth ≫ Pluto),
 *  • thematic     — real ORDER but compressed to a 1.0×–1.5× spread (largest only ~50% bigger than smallest), so
 *                   every planet is a modest dot sitting ON its orbit and the scene reads as one connected family.
 */
export const planetDotRadius = (p: Planet, mode: PlanetSizeMode): number => {
  if (mode === "truescale") return Math.max(0.15, (p.radiusKm / SUN_RADIUS_KM) * SUN_DOT_R);
  if (mode === "proportional") return Math.max(0.5, (p.radiusKm / RADIUS_MAX_KM) * 6);
  // thematic: log-normalise real radius into [0,1] → 1.0×–1.5× of the base (Pluto→base, Jupiter→1.5×base)
  const norm = (Math.log(p.radiusKm) - Math.log(RADIUS_MIN_KM)) / (Math.log(RADIUS_MAX_KM) - Math.log(RADIUS_MIN_KM));
  return THEMATIC_BASE * (1 + THEMATIC_SPREAD * Math.max(0, Math.min(1, norm)));
};

/**
 * The SUN's dot radius per size mode — kept PROPORTIONATE to the planets so the scene reads as one family:
 *  • truescale    — Sun dominant vs the tiny real specks (SUN_DOT_R),
 *  • proportional — a touch bigger than Jupiter's 6 (Sun ≈ 7.2),
 *  • thematic     — modestly the biggest, ~1.4× the largest thematic planet (2.4) → ~3.3, not overwhelming.
 */
export const sunDotRadius = (mode: PlanetSizeMode): number =>
  mode === "truescale" ? SUN_DOT_R : mode === "proportional" ? 7.2 : 3.3;

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

// ── Units of Measure (set once in the celestial ⚙ panel → update throughout the readout) ──
// Distance: km · m · ×10⁶ m · ×10⁹ m · AU. Time: days · hours · seconds (LTU).
export type DistUnit = "km" | "m" | "1e6" | "1e9" | "AU";
export const DIST_UNITS: DistUnit[] = ["km", "m", "1e6", "1e9", "AU"];
export const DIST_LABEL: Record<DistUnit, string> = { km: "km", m: "m", "1e6": "×10⁶ m", "1e9": "×10⁹ m", AU: "AU" };
export function fmtDist(meters: number, unit: DistUnit): string {
  if (unit === "km") return `${Math.round(meters / 1000).toLocaleString()} km`;
  if (unit === "AU") return `${(meters / AU).toLocaleString(undefined, { maximumFractionDigits: 4 })} AU`;
  if (unit === "1e6") return `${(meters / 1e6).toLocaleString(undefined, { maximumFractionDigits: 3 })} ×10⁶ m`;
  if (unit === "1e9") return `${(meters / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} ×10⁹ m`;
  return `${Math.round(meters).toLocaleString()} m`;
}
// ── Clock: military (24h) / standard (12h am·pm), in the LOCATION's time zone (derived from longitude) ──
export type ClockFormat = "24h" | "12h";
/** Location time zone from longitude — continental-US political bands (approx), nautical fallback elsewhere. */
export function tzFromLon(lon: number): { offset: number; label: string } {
  if (lon <= -67.5 && lon > -127) {
    if (lon > -87.5) return { offset: -5, label: "EST" };
    if (lon > -101.5) return { offset: -6, label: "CST" };   // Pfield (−97.62) ⇒ CST
    if (lon > -114.5) return { offset: -7, label: "MST" };
    return { offset: -8, label: "PST" };
  }
  const o = Math.round(lon / 15);
  return { offset: o, label: `UTC${o >= 0 ? "+" : ""}${o}` };
}
/** Decimal local hour → clock string. 13.5 → "13:30" (24h) / "1:30 pm" (12h). 1.0 → "01:00" / "1:00 am". */
export function fmtClock(decimalHour: number, format: ClockFormat): string {
  const h = ((Math.floor(decimalHour) % 24) + 24) % 24;
  const mm = String(Math.round((decimalHour - Math.floor(decimalHour)) * 60) % 60).padStart(2, "0");
  if (format === "24h") return `${String(h).padStart(2, "0")}:${mm}`;
  const ampm = h < 12 ? "am" : "pm";
  return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${ampm}`;
}

export type TimeUnit = "days" | "hours" | "seconds";
export const TIME_UNITS: TimeUnit[] = ["days", "hours", "seconds"];
export const TIME_LABEL: Record<TimeUnit, string> = { days: "days", hours: "hours", seconds: "sec (LTU)" };
export function fmtTime(seconds: number, unit: TimeUnit): string {
  if (unit === "days") return `${Math.round(seconds / 86400).toLocaleString()} d`;
  if (unit === "hours") return `${Math.round(seconds / 3600).toLocaleString()} h`;
  return `${Math.round(seconds).toLocaleString()} s`;
}

// (legacy SR helper kept for any external import)
export type SrUnit = "m" | "1e6" | "1e9" | "AU";
export const SR_UNIT_CYCLE: SrUnit[] = ["m", "1e6", "1e9", "AU"];
export const fmtSr = (meters: number, unit: SrUnit): string => fmtDist(meters, unit as DistUnit);
export const fmtKm = (meters: number) => `${Math.round(meters / 1000).toLocaleString()} km`;
/** LTU (local seconds elapsed) → whole days, for the human-readable time readout. */
export const ltuToDays = (ltuSeconds: number) => Math.round(ltuSeconds / 86400);
/**
 * Axial rotation period (a planet's "day") in human terms: days, plus hours for sub-2-day rotators,
 * with ↺ for retrograde (Venus · Uranus · Pluto). E.g. Jupiter → "0.41 d · 9.9 h", Venus → "243 d ↺".
 */
export function fmtRotation(rotDays: number): string {
  const d = Math.abs(rotDays), retro = rotDays < 0 ? " ↺" : "";
  const days = `${d.toFixed(d < 10 ? 2 : 1)} d`;
  return (d < 2 ? `${days} · ${(d * 24).toFixed(1)} h` : days) + retro;
}
