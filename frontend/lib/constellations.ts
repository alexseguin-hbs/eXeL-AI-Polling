/**
 * Priority constellations for the UCRS-2525 celestial sphere — a fixed backdrop the solar system sits inside.
 * Each constellation is a small labelled asterism (star offsets + connect lines) placed on a large background
 * sphere at an angle (0° = up/north) and radius (0..1 of the sphere). Polaris is pinned near the north point.
 * Rendered inside the map's view transform so it pans/zooms/rotates WITH the system (looking out from inside).
 * Positions are stylised (recognisable shapes, not survey-accurate). Zodiac band = a later pass.
 */

export interface Constellation {
  name: string;
  angle: number;   // placement around the sphere, degrees, 0 = up (north)
  radius: number;  // 0..1 fraction of the sphere radius
  stars: [number, number][]; // local offsets (viewBox units) from the constellation centre
  lines: [number, number][]; // index pairs into stars
}

// name · angle(0=N,CW) · radius · stars(local offsets) · lines
export const PRIORITY_CONSTELLATIONS: Constellation[] = [
  { name: "Ursa Minor", angle: 0, radius: 0.30, stars: [[0, -6], [1, -2], [3, 1], [4, 4], [2, 5], [0, 4], [1, 1]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] }, // handle ends at Polaris (star 0)
  { name: "Ursa Major", angle: 40, radius: 0.72, stars: [[-6, -2], [-3, -3], [0, -2], [3, -1], [5, 1], [3, 3], [0, 3]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] }, // Big Dipper
  { name: "Cassiopeia", angle: 330, radius: 0.70, stars: [[-6, 2], [-3, -2], [0, 1], [3, -2], [6, 2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] }, // W
  { name: "Cygnus", angle: 300, radius: 0.55, stars: [[0, -5], [0, 0], [0, 5], [-4, -1], [4, -1]], lines: [[0, 1], [1, 2], [3, 1], [1, 4]] }, // cross
  { name: "Lyra", angle: 285, radius: 0.85, stars: [[0, -4], [-2, 0], [2, 0], [-2, 4], [2, 4]], lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]] },
  { name: "Bootes", angle: 90, radius: 0.80, stars: [[0, 6], [-3, 1], [-2, -4], [2, -4], [3, 1]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] }, // kite
  { name: "Leo", angle: 120, radius: 0.60, stars: [[-6, 0], [-4, -3], [-2, -3], [-3, 1], [2, 2], [6, 1], [4, 4]], lines: [[0, 3], [3, 2], [2, 1], [3, 4], [4, 5], [5, 6], [6, 4]] },
  { name: "Gemini", angle: 150, radius: 0.82, stars: [[-2, -5], [-3, 0], [-3, 5], [2, -5], [3, 0], [3, 5]], lines: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3]] },
  { name: "Canis Major", angle: 180, radius: 0.62, stars: [[0, -4], [-3, 0], [3, 1], [-2, 4], [2, 5]], lines: [[0, 1], [0, 2], [1, 3], [2, 4]] }, // Sirius = star 0
  { name: "Orion", angle: 200, radius: 0.85, stars: [[-4, -5], [4, -5], [-1, 0], [0, 0], [1, 0], [-4, 5], [4, 4]], lines: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]] }, // belt = 2,3,4
  { name: "Taurus", angle: 225, radius: 0.60, stars: [[-5, -3], [-2, 0], [0, 2], [3, 0], [5, -2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] }, // V
  { name: "Scorpius", angle: 250, radius: 0.55, stars: [[-6, -3], [-3, -1], [0, 1], [2, 3], [4, 4], [5, 2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] }, // curved tail
];

/** Polaris — the pinned north star (top of the sphere). */
export const POLARIS = { angle: 0, radius: 0.30 };

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
