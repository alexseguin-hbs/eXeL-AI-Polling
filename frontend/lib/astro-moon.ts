/**
 * Shared low-precision lunar model (main periodic terms) — the single source of truth for the Moon across
 * the Architect-2525 Sky-Dome (horizon az/el) and the Earth+Moon mini view (orbital angle + distance).
 * Deterministic from the calendar date → replayable. Accurate to a few degrees / ~a few thousand km, which
 * is what the window-optimization use case needs (moonrise/set direction, phase, perigee/apogee distance).
 */
const RAD = Math.PI / 180;

export interface MoonState {
  eclLonSun: number;   // Sun ecliptic longitude (deg)
  eclLonMoon: number;  // Moon ecliptic longitude (deg) — its orbital position around Earth
  eclLatMoon: number;  // Moon ecliptic latitude (deg)
  distanceKm: number;  // Earth–Moon distance (perigee ≈ 363,300 km · apogee ≈ 405,500 km)
  elong: number;       // Sun→Moon elongation (deg) → phase
  illum: number;       // illuminated fraction 0..1
  phase: string;       // named phase
}

/** Days since J2000.0 for a calendar date (year, day-of-year 1..366, fractional hour). */
export function j2000Days(year: number, doy: number, hour: number): number {
  return (year - 2000) * 365.25 + doy + hour / 24 - 1.5;
}

const phaseName = (elong: number) =>
  elong < 22.5 || elong >= 337.5 ? "New"
  : elong < 67.5 ? "Waxing crescent" : elong < 112.5 ? "First quarter" : elong < 157.5 ? "Waxing gibbous"
  : elong < 202.5 ? "Full" : elong < 247.5 ? "Waning gibbous" : elong < 292.5 ? "Last quarter" : "Waning crescent";

/** Full Moon state for a date. Orbital angle (eclLonMoon) advances ~13.18°/day → one lap ≈ 27.32 days. */
export function moonState(year: number, doy: number, hour: number): MoonState {
  const d = j2000Days(year, doy, hour);
  const Ms = 357.529 + 0.98560028 * d;                 // Sun mean anomaly
  const Ls = 280.459 + 0.98564736 * d;                 // Sun mean longitude
  const eclLonSun = Ls + 1.915 * Math.sin(Ms * RAD) + 0.020 * Math.sin(2 * Ms * RAD);
  const Lm = 218.316 + 13.176396 * d;                  // Moon mean longitude
  const Mm = 134.963 + 13.064993 * d;                  // Moon mean anomaly
  const Fm = 93.272 + 13.229350 * d;                   // Moon argument of latitude
  const eclLonMoon = Lm + 6.289 * Math.sin(Mm * RAD);  // ecliptic longitude (orbital position)
  const eclLatMoon = 5.128 * Math.sin(Fm * RAD);       // ecliptic latitude
  const distanceKm = 385000.56 - 20905.355 * Math.cos(Mm * RAD); // leading distance term (perigee/apogee)
  const elong = ((eclLonMoon - eclLonSun) % 360 + 360) % 360;
  const illum = (1 - Math.cos(elong * RAD)) / 2;
  return { eclLonSun, eclLonMoon: ((eclLonMoon % 360) + 360) % 360, eclLatMoon, distanceKm, elong, illum, phase: phaseName(elong) };
}
