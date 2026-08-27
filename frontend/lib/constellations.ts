/**
 * Star catalog for the UCRS-2525 celestial sphere — the SHARED source for BOTH the Solar-System map and the Sky Dome
 * (CELESTIAL_SKY_SPEC §6/§7). Each constellation carries REAL equatorial coordinates: Right Ascension (RA, hours 0–24)
 * and Declination (Dec, degrees −90..+90) for its centroid, so the sky reads true — polar constellations sit near
 * Polaris, equatorial ones ride the edge, and their relative bearings match the real sky. The little `stars`/`lines`
 * offsets are the recognisable asterism SHAPE (stylised), placed at the real centroid. Positions are J2000, low
 * precision (no precession/proper-motion) — stated + bounded per the spec.
 *
 * In Honor of the Sumerian/Babylonian sky masters (MUL.APIN), the Zodiac band is a first-class layer, placed on the
 * ecliptic (= the planets' orbital plane) so stars → zodiac → orbits form one connected scene.
 */

export interface Constellation {
  name: string;
  ra: number;      // Right Ascension of the centroid, hours 0–24
  dec: number;     // Declination of the centroid, degrees −90..+90
  radius: number;  // legacy stylised fallback (0..1) — retained; real placement is derived from ra/dec at render time
  angle: number;   // legacy stylised fallback (deg, 0=N) — retained
  stars: [number, number][]; // local offsets (viewBox units) from the centre — the asterism SHAPE
  lines: [number, number][]; // index pairs into stars
}

// name · RA(h) · Dec(°) · stars(local shape offsets) · lines.  Real centroids (J2000, approximate).
export const PRIORITY_CONSTELLATIONS: Constellation[] = [
  { name: "Ursa Minor", ra: 15.0, dec: 78, angle: 0, radius: 0.30, stars: [[0, -6], [1, -2], [3, 1], [4, 4], [2, 5], [0, 4], [1, 1]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] }, // handle ends at Polaris (star 0)
  { name: "Ursa Major", ra: 11.3, dec: 56, angle: 40, radius: 0.72, stars: [[-6, -2], [-3, -3], [0, -2], [3, -1], [5, 1], [3, 3], [0, 3]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] }, // Big Dipper
  { name: "Cassiopeia", ra: 1.0, dec: 62, angle: 330, radius: 0.70, stars: [[-6, 2], [-3, -2], [0, 1], [3, -2], [6, 2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] }, // W
  { name: "Cygnus", ra: 20.6, dec: 42, angle: 300, radius: 0.55, stars: [[0, -5], [0, 0], [0, 5], [-4, -1], [4, -1]], lines: [[0, 1], [1, 2], [3, 1], [1, 4]] }, // cross
  { name: "Lyra", ra: 18.8, dec: 39, angle: 285, radius: 0.85, stars: [[0, -4], [-2, 0], [2, 0], [-2, 4], [2, 4]], lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]] }, // Vega
  { name: "Bootes", ra: 14.7, dec: 30, angle: 90, radius: 0.80, stars: [[0, 6], [-3, 1], [-2, -4], [2, -4], [3, 1]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] }, // kite · Arcturus
  { name: "Leo", ra: 10.6, dec: 16, angle: 120, radius: 0.60, stars: [[-6, 0], [-4, -3], [-2, -3], [-3, 1], [2, 2], [6, 1], [4, 4]], lines: [[0, 3], [3, 2], [2, 1], [3, 4], [4, 5], [5, 6], [6, 4]] },
  { name: "Gemini", ra: 7.0, dec: 24, angle: 150, radius: 0.82, stars: [[-2, -5], [-3, 0], [-3, 5], [2, -5], [3, 0], [3, 5]], lines: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3]] },
  { name: "Canis Major", ra: 6.8, dec: -22, angle: 180, radius: 0.62, stars: [[0, -4], [-3, 0], [3, 1], [-2, 4], [2, 5]], lines: [[0, 1], [0, 2], [1, 3], [2, 4]] }, // Sirius = star 0
  { name: "Orion", ra: 5.5, dec: 3, angle: 200, radius: 0.85, stars: [[-4, -5], [4, -5], [-1, 0], [0, 0], [1, 0], [-4, 5], [4, 4]], lines: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]] }, // belt = 2,3,4
  { name: "Taurus", ra: 4.5, dec: 18, angle: 225, radius: 0.60, stars: [[-5, -3], [-2, 0], [0, 2], [3, 0], [5, -2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] }, // V · Aldebaran
  { name: "Scorpius", ra: 16.9, dec: -30, angle: 250, radius: 0.55, stars: [[-6, -3], [-3, -1], [0, 1], [2, 3], [4, 4], [5, 2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] }, // Antares · curved tail
  // — zodiac constellations completed with REAL RA/Dec centroids (so all 12 signs render true on dome + map) —
  { name: "Aries", ra: 2.6, dec: 21, angle: 210, radius: 0.45, stars: [[-4, 0], [0, -1], [3, 1], [5, 2]], lines: [[0, 1], [1, 2], [2, 3]] },
  { name: "Cancer", ra: 8.7, dec: 20, angle: 135, radius: 0.50, stars: [[0, -3], [-2, 1], [2, 1], [0, 4]], lines: [[0, 1], [0, 2], [1, 3], [2, 3]] },
  { name: "Virgo", ra: 13.4, dec: -4, angle: 100, radius: 0.72, stars: [[-5, -3], [-2, -1], [1, 0], [4, 2], [2, 4]], lines: [[0, 1], [1, 2], [2, 3], [2, 4]] }, // Spica
  { name: "Libra", ra: 15.2, dec: -16, angle: 195, radius: 0.50, stars: [[-3, -2], [3, -2], [-2, 3], [2, 3]], lines: [[0, 1], [0, 2], [1, 3]] },
  { name: "Sagittarius", ra: 19.0, dec: -28, angle: 240, radius: 0.55, stars: [[-4, 2], [-1, -2], [2, -2], [4, 1], [0, 3], [3, 3]], lines: [[0, 1], [1, 2], [2, 3], [0, 4], [3, 5]] }, // teapot
  { name: "Capricornus", ra: 21.0, dec: -18, angle: 265, radius: 0.50, stars: [[-5, -1], [-2, 2], [2, 3], [5, 0], [0, -2]], lines: [[0, 4], [4, 3], [3, 2], [2, 1], [1, 0]] },
  { name: "Aquarius", ra: 22.5, dec: -10, angle: 300, radius: 0.55, stars: [[-4, -2], [-1, 0], [2, -1], [4, 1], [0, 3]], lines: [[0, 1], [1, 2], [2, 3], [1, 4]] },
  { name: "Pisces", ra: 0.85, dec: 10, angle: 330, radius: 0.72, stars: [[-6, 3], [-2, 1], [1, -1], [4, -3], [6, -5]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  // — a few more bright, recognisable figures (extend this list over time) —
  { name: "Pegasus", ra: 22.7, dec: 18, angle: 310, radius: 0.60, stars: [[-3, -3], [3, -3], [3, 3], [-3, 3]], lines: [[0, 1], [1, 2], [2, 3], [3, 0]] }, // Great Square
  { name: "Andromeda", ra: 0.8, dec: 38, angle: 345, radius: 0.55, stars: [[-4, -2], [-1, 0], [2, 1], [5, 3]], lines: [[0, 1], [1, 2], [2, 3]] },
  { name: "Perseus", ra: 3.4, dec: 45, angle: 20, radius: 0.55, stars: [[-3, -4], [-1, -1], [1, 1], [0, 4], [3, 2]], lines: [[0, 1], [1, 2], [2, 3], [2, 4]] },
  { name: "Auriga", ra: 5.9, dec: 42, angle: 40, radius: 0.55, stars: [[0, -4], [3, 0], [1, 4], [-2, 3], [-3, -1]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] }, // Capella pentagon
];

/** Polaris — the true north star, at its real position (Dec +89.3° ≈ the celestial pole). */
export const POLARIS = { ra: 2.53, dec: 89.264 };

/**
 * Real placement of a star centroid onto the celestial-sphere disc: RA → bearing about the pole, Dec → distance
 * from the pole (co-declination). Returns { angle (deg, 0 = pole/north, clockwise), radius (0..1) }. Pure.
 */
export function raDecToDisc(ra: number, dec: number): { angle: number; radius: number } {
  return { angle: (ra / 24) * 360, radius: Math.max(0, Math.min(1, (90 - dec) / 90)) };
}

/** Ecliptic (λ,β) → equatorial (RA hours, Dec deg). Obliquity ε = 23.4397°. Shared bridge (mirrors architect-skysun). */
export function eclToRaDec(lonDeg: number, latDeg: number): { ra: number; dec: number } {
  const e = 23.4397 * Math.PI / 180, l = lonDeg * Math.PI / 180, b = latDeg * Math.PI / 180;
  const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)) / (Math.PI / 180);
  const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)) / (Math.PI / 180);
  return { ra: ((ra + 360) % 360) / 15, dec };
}

/** Provenance — the Zodiac is Babylonian/Sumerian in origin (MUL.APIN, ~1000 BCE), honoring the sky masters. */
export const ZODIAC_ORIGIN = "Zodiac · Babylonian MUL.APIN / Sumerian";

export interface ZodiacSign { name: string; sumerian: string; lonDeg: number; }
/** The 12 ecliptic signs by ecliptic longitude (Aries at the vernal point, +30° each). Placed ON the ecliptic. */
export const ZODIAC: ZodiacSign[] = [
  { name: "Aries", sumerian: "LÚ.ḪUN.GÁ", lonDeg: 0 },
  { name: "Taurus", sumerian: "GU₄.AN.NA", lonDeg: 30 },
  { name: "Gemini", sumerian: "MAŠ.TAB.BA", lonDeg: 60 },
  { name: "Cancer", sumerian: "AL.LUL", lonDeg: 90 },
  { name: "Leo", sumerian: "UR.GU.LA", lonDeg: 120 },
  { name: "Virgo", sumerian: "AB.SÍN", lonDeg: 150 },
  { name: "Libra", sumerian: "ZIB.BA.AN.NA", lonDeg: 180 },
  { name: "Scorpius", sumerian: "GÍR.TAB", lonDeg: 210 },
  { name: "Sagittarius", sumerian: "PA.BIL.SAG", lonDeg: 240 },
  { name: "Capricornus", sumerian: "SUḪUR.MÁŠ", lonDeg: 270 },
  { name: "Aquarius", sumerian: "GU.LA", lonDeg: 300 },
  { name: "Pisces", sumerian: "SIM.MAḪ", lonDeg: 330 },
];

/** Deterministic faint background starfield within the sphere disc — [x, y, r] in viewBox units. */
export function starfield(cx: number, cy: number, R: number, n = 120): [number, number, number][] {
  let s = 1234567;
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * 2 * Math.PI, rr = Math.sqrt(rnd()) * R;
    out.push([cx + rr * Math.sin(a), cy - rr * Math.cos(a), 0.12 + rnd() * 0.35]);
  }
  return out;
}
