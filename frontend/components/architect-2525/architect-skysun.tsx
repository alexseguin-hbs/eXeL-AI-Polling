"use client";

/**
 * ARCHITECT-2525 · SUN·SKY — celestial engine + window optimization (MASTER_SPEC §12b / ARC-31, 32).
 * =================================================================================================
 * From the house CORNER coordinates (lat/lon — reuse the Security mgrs.ts coordinate world), plot the
 * deterministic sun path across the year on a sky dome, plus Polaris (true north, el≈lat) and a marker
 * for Orion. Score each cardinal facing for seasonal daylight → window-placement recommendation. Pure
 * client math (deterministic → replayable, U-WF-08). Self-contained SVG.
 */
import { useEffect, useMemo, useState } from "react";
import { ArchitectCelestial } from "./architect-celestial";
import { moonState } from "@/lib/astro-moon";
import { overWindow, bestDateForWindow } from "@/lib/celestial";
import { geocentricEcl, dateToJD } from "@/lib/ephemeris";
import { PRIORITY_CONSTELLATIONS, ZODIAC } from "@/lib/constellations";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };
const RAD = Math.PI / 180;

// Deterministic solar position (solar time; equation-of-time/longitude omitted for v1).
function sunPos(lat: number, dayOfYear: number, hour: number) {
  const decl = 23.44 * Math.sin(RAD * 360 * (284 + dayOfYear) / 365);
  const H = 15 * (hour - 12);
  const sinEl = Math.sin(RAD * lat) * Math.sin(RAD * decl) + Math.cos(RAD * lat) * Math.cos(RAD * decl) * Math.cos(RAD * H);
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl))) / RAD;
  const cosAz = (Math.sin(RAD * decl) - Math.sin(RAD * el) * Math.sin(RAD * lat)) / (Math.cos(RAD * el) * Math.cos(RAD * lat) || 1e-6);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) / RAD;
  if (H > 0) az = 360 - az;
  return { az, el };
}

// Deterministic sunrise / sunset (local solar hours) — scan the day for the elevation crossing the horizon
// (−0.833° incl. refraction). Returns null hours + polar flags for high latitudes (sun never rises / never sets).
function sunRiseSet(lat: number, doy: number): { rise: number | null; set: number | null; polarDay: boolean; polarNight: boolean } {
  const h0 = -0.833;
  let rise: number | null = null, set: number | null = null, above = 0, below = 0;
  let prev = sunPos(lat, doy, 0).el;
  for (let h = 0.1; h <= 24; h += 0.1) {
    const el = sunPos(lat, doy, h).el;
    if (el > h0) above++; else below++;
    if (prev <= h0 && el > h0 && rise === null) rise = h;
    if (prev > h0 && el <= h0 && rise !== null && set === null) set = h;
    prev = el;
  }
  return { rise, set, polarDay: below === 0, polarNight: above === 0 };
}
// Solstice / equinox day-of-year (canonical, ±1 day) — the homeowner "special date" anchors.
const SEASON_DOY = { winterSolstice: 355, springEquinox: 80, summerSolstice: 172, fallEquinox: 266 };
const fmtHM = (h: number | null): string => { if (h == null) return "—"; const tm = Math.round(h * 60); return `${String(Math.floor(tm / 60) % 24).padStart(2, "0")}:${String(tm % 60).padStart(2, "0")}`; };

// Equation of time (minutes) — mean→apparent solar-time correction, so the current-sky read lands within ~a minute.
const eqOfTime = (doy: number) => { const B = RAD * 360 * (doy - 81) / 365; return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); };
// Current LOCAL APPARENT SOLAR sky at a longitude → {year, doy, hour}. Longitude sets the sky (no timezone db needed):
// LMST = UTC + lon/15; +EoT gives apparent solar time — the hour the dome/moon/stars math already expects.
function nowSkyAt(lon: number): { year: number; doy: number; hour: number } {
  const now = new Date();
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const uy = now.getUTCFullYear();
  const utcMid = Date.UTC(uy, now.getUTCMonth(), now.getUTCDate());
  const doyUtc = Math.round((utcMid - Date.UTC(uy, 0, 0)) / 86400000);
  let h = utcH + lon / 15 + eqOfTime(doyUtc) / 60;   // local apparent solar time (hours)
  let shift = 0; while (h < 0) { h += 24; shift -= 1; } while (h >= 24) { h -= 24; shift += 1; }
  const baseMs = utcMid + shift * 86400000, d = new Date(baseMs), y = d.getUTCFullYear();
  return { year: y, doy: Math.round((baseMs - Date.UTC(y, 0, 0)) / 86400000), hour: Math.round(h * 100) / 100 };
}
// Flexible GPS parse (like Security-2525's LLV-DMS): decimal "31.44, -97.74" · DMS "31 26 24 N, 97 44 06 W" ·
// hemisphere "N31.44 W97.74" · symbols "31°26′N 97°44′W" → {lat, lon} | null.
function parseGps(raw: string): { lat: number; lon: number } | null {
  const s = (raw || "").trim(); if (!s) return null;
  const chunk = (t: string): { v: number; axis: "lat" | "lon" | null } | null => {
    const hemi = (t.match(/[NSEWnsew]/) || [])[0];
    const nums = (t.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    if (!nums.length) return null;
    let v = Math.abs(nums[0]) + Math.abs(nums[1] || 0) / 60 + Math.abs(nums[2] || 0) / 3600;
    if (nums[0] < 0) v = -v;
    let axis: "lat" | "lon" | null = null;
    if (hemi) { const H = hemi.toUpperCase(); v = Math.abs(v) * (H === "S" || H === "W" ? -1 : 1); axis = H === "N" || H === "S" ? "lat" : "lon"; }
    return { v, axis };
  };
  let a: string, b: string;
  if (s.includes(",")) { const p = s.split(","); a = p[0]; b = p.slice(1).join(","); }
  else { const parts = s.split(/\s+/); if (parts.length < 2 || (s.match(/-?\d+(?:\.\d+)?/g) || []).length < 2) return null; const half = Math.ceil(parts.length / 2); a = parts.slice(0, half).join(" "); b = parts.slice(half).join(" "); }
  const ca = chunk(a), cb = chunk(b); if (!ca || !cb) return null;
  let lat: number | undefined, lon: number | undefined;
  if (ca.axis === "lat") lat = ca.v; if (ca.axis === "lon") lon = ca.v;
  if (cb.axis === "lat") lat = cb.v; if (cb.axis === "lon") lon = cb.v;
  if (lat === undefined && lon === undefined) { lat = ca.v; lon = cb.v; }
  else if (lat === undefined) lat = ca.axis ? cb.v : ca.v;
  else if (lon === undefined) lon = ca.axis ? cb.v : ca.v;
  if (lat === undefined || lon === undefined || Math.abs(lat) > 90 || Math.abs(lon) > 180 || isNaN(lat) || isNaN(lon)) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 };
}

// Ecliptic (λ,β) → equatorial (RA, dec), obliquity ε.
function eclToRaDec(lonDeg: number, latDeg: number) {
  const e = 23.4397 * RAD, l = lonDeg * RAD, b = latDeg * RAD;
  const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)) / RAD;
  const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)) / RAD;
  return { ra, dec };
}
// Deterministic MOON alt-az, reusing the shared lunar model (lib/astro-moon) so the dome + the Earth+Moon
// mini view + the celestial map all agree. Converts the shared ecliptic position to horizon coords here.
function moonSky(lat: number, dayOfYear: number, hour: number, year = 2025) {
  const ms = moonState(year, dayOfYear, hour);
  const sun = eclToRaDec(ms.eclLonSun, 0), moon = eclToRaDec(ms.eclLonMoon, ms.eclLatMoon);
  const Hs = 15 * (hour - 12);                          // sun hour angle (solar time)
  let Hm = Hs - (moon.ra - sun.ra);                     // moon hour angle (shared LST)
  Hm = ((Hm + 180) % 360 + 360) % 360 - 180;
  const decR = moon.dec * RAD, latR = lat * RAD, HmR = Hm * RAD;
  const el = Math.asin(Math.max(-1, Math.min(1, Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(HmR)))) / RAD;
  const az = (Math.atan2(-Math.cos(decR) * Math.sin(HmR), Math.sin(decR) * Math.cos(latR) - Math.cos(decR) * Math.sin(latR) * Math.cos(HmR)) / RAD + 360) % 360;
  return { az, el, illum: ms.illum, phase: ms.phase };
}

// HOMEOWNER MISSION — the window-framing solvers (overWindow / bestDateForWindow) now live in lib/celestial.ts as pure,
// Node-importable (truth-harness-lockable) functions; imported at the top. See CELESTIAL_SKY_SPEC §9.

// Deterministic star alt-az from real equatorial coords (RA hours, Dec deg), sharing the same LST reference as the
// Moon (so the Dome + the Solar-System map agree on the sky — CELESTIAL_SKY_SPEC §2/§6).
function starSky(raHours: number, decDeg: number, lat: number, dayOfYear: number, hour: number, year = 2025) {
  const ms = moonState(year, dayOfYear, hour);
  const sun = eclToRaDec(ms.eclLonSun, 0);              // sun RA/dec (degrees)
  const Hs = 15 * (hour - 12);                          // sun hour angle (solar time)
  let H = Hs - (raHours * 15 - sun.ra);                 // star hour angle (shared LST)
  H = ((H + 180) % 360 + 360) % 360 - 180;
  const decR = decDeg * RAD, latR = lat * RAD, HR = H * RAD;
  const el = Math.asin(Math.max(-1, Math.min(1, Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(HR)))) / RAD;
  const az = (Math.atan2(-Math.cos(decR) * Math.sin(HR), Math.sin(decR) * Math.cos(latR) - Math.cos(decR) * Math.sin(latR) * Math.cos(HR)) / RAD + 360) % 360;
  return { az, el };
}
// A short bright-star subset (real RA h / Dec °, J2000) mirrored onto the Dome — the same sky the map's constellations show.
const BRIGHT_STARS: { n: string; ra: number; dec: number }[] = [
  { n: "Sirius", ra: 6.75, dec: -16.7 }, { n: "Betelgeuse", ra: 5.92, dec: 7.4 }, { n: "Rigel", ra: 5.24, dec: -8.2 },
  { n: "Vega", ra: 18.62, dec: 38.8 }, { n: "Arcturus", ra: 14.26, dec: 19.2 }, { n: "Capella", ra: 5.28, dec: 46.0 },
  { n: "Aldebaran", ra: 4.60, dec: 16.5 }, { n: "Antares", ra: 16.49, dec: -26.4 }, { n: "Deneb", ra: 20.69, dec: 45.3 },
];

// Deterministic PLANET alt-az from the real geocentric ephemeris (lib/ephemeris) — same shared-LST sky as Moon + stars,
// so Saturn/Neptune/etc. sit exactly where a sky atlas (e.g. Sky Guide) shows them for this place + time.
function planetSky(id: string, lat: number, dayOfYear: number, hour: number, year: number) {
  const g = geocentricEcl(id, dateToJD(year, dayOfYear, hour));   // geocentric ecliptic lon/lat (deg)
  const ms = moonState(year, dayOfYear, hour);
  const sun = eclToRaDec(ms.eclLonSun, 0), pl = eclToRaDec(g.lon, g.lat);  // dome eclToRaDec → RA/dec in DEGREES
  const Hs = 15 * (hour - 12);
  let H = Hs - (pl.ra - sun.ra); H = ((H + 180) % 360 + 360) % 360 - 180;
  const dR = pl.dec * RAD, lR = lat * RAD, HR = H * RAD;
  const el = Math.asin(Math.max(-1, Math.min(1, Math.sin(dR) * Math.sin(lR) + Math.cos(dR) * Math.cos(lR) * Math.cos(HR)))) / RAD;
  const az = (Math.atan2(-Math.cos(dR) * Math.sin(HR), Math.sin(dR) * Math.cos(lR) - Math.cos(dR) * Math.sin(lR) * Math.cos(HR)) / RAD + 360) % 360;
  return { az, el };
}
const PLANETS: { id: string; n: string; c: string }[] = [
  { id: "mercury", n: "Mercury", c: "#d98a5a" }, { id: "venus", n: "Venus", c: "#f5e6c8" }, { id: "mars", n: "Mars", c: "#e0674a" },
  { id: "jupiter", n: "Jupiter", c: "#e3c48a" }, { id: "saturn", n: "Saturn", c: "#e8d59a" }, { id: "neptune", n: "Neptune", c: "#6aa6ff" }, { id: "uranus", n: "Uranus", c: "#8fe0e0" },
];

// Sky-dome projection: zenith at centre, horizon at radius R. az 0=N (top), clockwise.
const R = 44, CX = 50, CY = 50;
const dome = (az: number, el: number) => {
  const r = R * Math.max(0, (90 - el)) / 90;
  return [CX + r * Math.sin(RAD * az), CY - r * Math.cos(RAD * az)] as const;
};

const FACINGS = [{ k: "S", az: 180 }, { k: "E", az: 90 }, { k: "W", az: 270 }, { k: "N", az: 0 }];

// World-map coordinate picker (equirectangular) — click to place the property; the marker's lat/lon
// becomes the SINGLE coordinate source for the whole site (structure · sun · moon · terrain). Plus a
// 4-corner property lot derived from the centre (reuse of the Security corner-coordinate framing idea).
function WorldPlacement({ lat, lon, onPick }: { lat: number; lon: number; onPick: (la: number, lo: number) => void }) {
  const W = 200, H = 100;
  const mx = ((lon + 180) / 360) * W, my = ((90 - lat) / 180) * H;
  const pick = (e: React.MouseEvent) => {
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    onPick(Math.round((90 - py * 180) * 100) / 100, Math.round((px * 360 - 180) * 100) / 100);
  };
  return (
    <svg data-arch-world viewBox="0 0 200 100" preserveAspectRatio="none" onClick={pick}
      className="w-full cursor-crosshair rounded" style={{ background: "#071019", aspectRatio: "2 / 1", border: `1px solid ${C.border}` }}>
      {[-60, -30, 0, 30, 60].map((la) => { const y = ((90 - la) / 180) * H; return <line key={`la${la}`} x1={0} y1={y} x2={W} y2={y} stroke={la === 0 ? "#2a3a4a" : "#141d29"} strokeWidth={la === 0 ? 0.5 : 0.3} />; })}
      {[-120, -60, 0, 60, 120].map((lo) => { const x = ((lo + 180) / 360) * W; return <line key={`lo${lo}`} x1={x} y1={0} x2={x} y2={H} stroke={lo === 0 ? "#2a3a4a" : "#141d29"} strokeWidth={lo === 0 ? 0.5 : 0.3} />; })}
      <circle cx={mx} cy={my} r={2.6} fill="none" stroke={C.gold} strokeWidth={0.8} />
      <circle cx={mx} cy={my} r={0.9} fill={C.gold} />
    </svg>
  );
}

// forceView: when the Design engine's SKY tab drives this component, pin the sub-view (celestial map) and hide the
// internal Sky-Dome/Solar-System toggle. When absent (SITE tab), the internal toggle stays — SPIRAL asserts drive it.
export function ArchitectSkySun({ forceView }: { forceView?: "dome" | "solar" } = {}) {
  const [lat, setLat] = useState(30.44);   // default: Pfield · Pflugerville, TX (soccer complex)
  const [lon, setLon] = useState(-97.62);
  const [doy, setDoy] = useState(172);     // SSR seed (~summer solstice); replaced by TODAY on mount
  const [hour, setHour] = useState(12);    // noon — sun high for a meaningful default
  const [year, setYear] = useState(2025);
  const [skyView, setSkyView] = useState<"dome" | "solar">(forceView ?? "dome"); // SUN·SKY sub-view: sky dome ↔ UCRS-2525 solar system
  const view = forceView ?? skyView;       // engine-pinned view wins over the internal toggle
  const [facingAz, setFacingAz] = useState(180); // a house face / window azimuth (0=N,90=E,180=S,270=W) to align to the sun
  const [gps, setGps] = useState("");            // free-form GPS entry (decimal · DMS · N/S/E/W) — any format
  const [gpsErr, setGpsErr] = useState(false);

  // Snap the whole sky (date + hour) to the CURRENT local apparent-solar time at a longitude — so the dome shows
  // exactly what is overhead now (moon + stars included), not a noon default. Longitude alone fixes the sky.
  const syncNow = (atLon: number) => { const s = nowSkyAt(atLon); setYear(s.year); setDoy(s.doy); setHour(s.hour); };
  // Apply a free-form GPS string → set the lot coordinate AND re-sync the sky to now at that place.
  const applyGps = (raw: string) => { const p = parseGps(raw); if (!p) { setGpsErr(true); return; } setGpsErr(false); setLat(p.lat); setLon(p.lon); syncNow(p.lon); };
  // Device geolocation → same effect (one tap on a phone at the actual site).
  const locate = () => { if (typeof navigator === "undefined" || !navigator.geolocation) { setGpsErr(true); return; }
    navigator.geolocation.getCurrentPosition((pos) => { const la = Math.round(pos.coords.latitude * 1e6) / 1e6, lo = Math.round(pos.coords.longitude * 1e6) / 1e6; setLat(la); setLon(lo); setGps(`${la}, ${lo}`); setGpsErr(false); syncNow(lo); }, () => setGpsErr(true), { enableHighAccuracy: true, timeout: 8000 }); };

  // Default: open on the CURRENT sky at the placed location (client-only → no SSR hydration mismatch). Everything
  // (sun · moon · stars · dome · solar map) shows what is overhead right now; the operator can scrub any date/hour after.
  useEffect(() => { syncNow(lon); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sun = sunPos(lat, doy, hour);
  const dayPath = Array.from({ length: 29 }, (_, i) => 5 + i * 0.5).map((h) => sunPos(lat, doy, h)).filter((p) => p.el > -2);
  const arcs = [{ d: 172, c: C.gold, n: "Jun" }, { d: 80, c: C.cyan, n: "Mar/Sep" }, { d: 355, c: "#7dd3fc", n: "Dec" }]
    .map((a) => ({ ...a, pts: Array.from({ length: 29 }, (_, i) => 5 + i * 0.5).map((h) => sunPos(lat, a.d, h)).filter((p) => p.el > 0) }));
  const polaris = { az: 0, el: Math.max(1, Math.abs(lat)) }; // Polaris altitude ≈ observer latitude (N hemi)

  // window optimization: cardinal solar-gain score across daylight.
  const exposure = FACINGS.map((f) => {
    let s = 0;
    for (let h = 5; h <= 19; h += 0.5) { const p = sunPos(lat, doy, h); if (p.el <= 0) continue; const inc = Math.cos(RAD * (p.az - f.az)); if (inc > 0) s += inc * Math.sin(RAD * p.el); }
    return { ...f, score: Math.round(s * 10) / 10 };
  }).sort((a, b) => b.score - a.score);
  const best = exposure[0], worst = exposure[exposure.length - 1];
  const riseSet = sunRiseSet(lat, doy);   // homeowner sunrise/sunset for the selected date + location
  // ALIGNMENT — which special-date sunrise/sunset does this house-face / window azimuth line up with?
  const SEASON_LABEL: Record<string, string> = { winterSolstice: "winter-solstice", springEquinox: "spring-equinox", summerSolstice: "summer-solstice", fallEquinox: "fall-equinox" };
  const cardOf = (az: number) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round((((az % 360) + 360) % 360) / 45) % 8];
  const alignEvents = Object.entries(SEASON_DOY).flatMap(([name, d]) => {
    const rs = sunRiseSet(lat, d); const ev: { label: string; az: number }[] = [];
    if (rs.rise != null) ev.push({ label: `${SEASON_LABEL[name]} sunrise`, az: sunPos(lat, d, rs.rise).az });
    if (rs.set != null) ev.push({ label: `${SEASON_LABEL[name]} sunset`, az: sunPos(lat, d, rs.set).az });
    return ev;
  });
  const nearestAlign = alignEvents.map((e) => ({ ...e, diff: Math.min(Math.abs(e.az - facingAz), 360 - Math.abs(e.az - facingAz)) })).sort((a, b) => a.diff - b.diff)[0];
  const aligned = nearestAlign && nearestAlign.diff <= 6;   // within 6° = this face frames that event

  // MOON-OVER-WINDOW / special-date transit — for THIS date + THIS window azimuth, when do the Sun and Moon
  // cross the opening (time · elevation · moon phase)? The homeowner's anniversary + window → the exact moment.
  const sunOver = overWindow((h) => sunPos(lat, doy, h), facingAz);
  const moonOver = overWindow((h) => moonSky(lat, doy, h, year), facingAz);
  const moonOverPhase = moonOver ? moonSky(lat, doy, moonOver.hour, year) : null;
  const framesWord = (d: number) => d <= 5 ? "frames" : d <= 15 ? "grazes" : "closest pass";
  // REVERSE — the natural anniversary: which date of the year does the sky best frame this window? (memoised — a
  // year-scan is heavier than a single-date read, so it recomputes only when lat / window / year change).
  const bestSun = useMemo(() => bestDateForWindow((d, h) => sunPos(lat, d, h), facingAz), [lat, facingAz]);
  const bestMoon = useMemo(() => bestDateForWindow((d, h) => moonSky(lat, d, h, year), facingAz), [lat, facingAz, year]);
  const bestMoonPhase = bestMoon ? moonSky(lat, bestMoon.doy, bestMoon.hour, year) : null;
  const mdLabel = (d: number) => new Date(year, 0, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const moon = moonSky(lat, doy, hour, year);
  const moonPath = Array.from({ length: 29 }, (_, i) => 5 + i * 0.5).map((h) => moonSky(lat, doy, h, year)).filter((p) => p.el > -2);

  const path = (pts: { az: number; el: number }[]) => pts.map((p, i) => { const [x, y] = dome(p.az, p.el); return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(" ");
  const [sx, sy] = dome(sun.az, sun.el);
  const [mx, my] = dome(moon.az, moon.el);
  const [px, py] = dome(polaris.az, polaris.el);
  const dateObj = new Date(year, 0, doy);
  const monthDay = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const isoDate = new Date(Date.UTC(year, 0, doy)).toISOString().slice(0, 10);
  const setFromDate = (iso: string) => { const d = new Date(iso + "T00:00:00Z"); if (isNaN(d.getTime())) return; setYear(d.getUTCFullYear()); const start = Date.UTC(d.getUTCFullYear(), 0, 0); setDoy(Math.round((d.getTime() - start) / 86400000)); };
  const season = ((): string => { const m = dateObj.getMonth(); return m < 2 || m === 11 ? "Winter" : m < 5 ? "Spring" : m < 8 ? "Summer" : "Autumn"; })();
  // 4-corner property lot from the placed centre (±15 m ≈ 30 m lot) — the reference frame the whole site shares.
  const dLat = 15 / 111320, dLon = dLat / Math.max(0.2, Math.cos(lat * RAD));
  const corners = [{ k: "NW", la: lat + dLat, lo: lon - dLon }, { k: "NE", la: lat + dLat, lo: lon + dLon }, { k: "SE", la: lat - dLat, lo: lon + dLon }, { k: "SW", la: lat - dLat, lo: lon - dLon }];

  return (
    <div className="space-y-2">
      {/* SUN·SKY sub-view toggle — the sky dome over the lot, or the UCRS-2525 Base-3600 solar system.
          Hidden when the Design engine's SKY tab pins the view (forceView) — the engine tab is the toggle then. */}
      {!forceView && (
      <div className="flex flex-wrap items-center gap-1 text-[10px]">
        <span className="mr-1 font-bold tracking-wider" style={{ color: C.violet }}>SUN·SKY</span>
        {([["dome", "Sky Dome"], ["solar", "Solar System"]] as const).map(([v, label]) => (
          <button key={v} data-sky-view={v} onClick={() => setSkyView(v)} className="rounded border px-2 py-0.5 text-[9px] font-semibold"
            style={{ borderColor: C.border, color: view === v ? C.violet : C.dim, background: view === v ? "#221833" : "transparent" }}>{label}</button>
        ))}
      </div>
      )}
      {view === "solar" ? <ArchitectCelestial lat={lat} lon={lon} year={year} doy={doy} hour={hour} onYear={setYear} onDoy={setDoy} /> : (
      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      <div className="relative rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        {/* CALENDAR — upper-right of the sky dome: pick any date to scrub sun + moon across the year */}
        <div data-arch-calendar className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1 rounded-md border p-1.5" style={{ borderColor: C.border, background: "rgba(12,20,32,0.8)", backdropFilter: "blur(2px)" }}>
          <input type="date" data-cal-input value={isoDate} onChange={(e) => setFromDate(e.target.value)} className="rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }} />
          <span className="text-[9px]" style={{ color: C.dim }}>{season} · <span style={{ color: "#e5e7eb" }}>☾ {(moon.illum * 100).toFixed(0)}%</span> {moon.phase}</span>
        </div>
        <svg data-arch-sky viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="w-full rounded" style={{ background: "#05070d", aspectRatio: "1 / 1" }}>
          <circle cx={CX} cy={CY} r={R} fill="#070c16" stroke="#233043" strokeWidth="0.4" />
          <circle cx={CX} cy={CY} r={R * 2 / 3} fill="none" stroke="#16202e" strokeWidth="0.2" />
          <circle cx={CX} cy={CY} r={R / 3} fill="none" stroke="#16202e" strokeWidth="0.2" />
          {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([k, a]) => { const [x, y] = dome(a as number, 0); return <text key={k as string} x={x} y={y} fontSize="3" fill={C.dim} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "monospace" }}>{k}</text>; })}
          {/* seasonal solar arcs */}
          {arcs.map((a) => a.pts.length > 1 && <path key={a.n} data-el="arc" d={path(a.pts)} fill="none" stroke={a.c} strokeWidth="0.4" opacity="0.5" />)}
          {/* selected-day sun path + sun */}
          {dayPath.length > 1 && <path data-el="sunpath" d={path(dayPath)} fill="none" stroke={C.gold} strokeWidth="0.7" />}
          {sun.el > 0 && <circle data-el="sun" cx={sx} cy={sy} r="2" fill={C.gold} />}
          {/* selected-day MOON path + moon disc (approx lunar model; brightness ≈ illuminated fraction) */}
          {moonPath.length > 1 && <path data-el="moonpath" d={path(moonPath)} fill="none" stroke="#cbd5e1" strokeWidth="0.4" opacity="0.5" strokeDasharray="1 0.7" />}
          {moon.el > 0 && <circle data-el="moon" cx={mx} cy={my} r="1.6" fill="#e5e7eb" fillOpacity={0.3 + 0.7 * moon.illum} stroke="#cbd5e1" strokeWidth="0.2" />}
          {/* Polaris (true north) + Orion marker */}
          <circle data-el="polaris" cx={px} cy={py} r="0.9" fill="#fff" /><text x={px + 2} y={py} fontSize="2.4" fill="#fff" style={{ fontFamily: "monospace" }}>Polaris</text>
          {/* Real bright stars (RA/Dec → alt-az), only those above the horizon — the same sky as the Solar-System map */}
          {BRIGHT_STARS.map((s) => { const p = starSky(s.ra, s.dec, lat, doy, hour, year); if (p.el <= 0) return null; const [x, y] = dome(p.az, p.el); return (
            <g key={s.n} data-el="star"><circle cx={x} cy={y} r="0.55" fill="#9fd" /><text x={x + 1.4} y={y + 0.6} fontSize="1.9" fill="#7fb8c8" style={{ fontFamily: "monospace" }}>{s.n}</text></g>
          ); })}
          {/* Constellation labels at their real alt-az — recognisable figures (Cygnus, Orion…) + the zodiac band
              (Aquarius, Capricornus, Pisces…), placed exactly where a sky atlas shows them for this place + time. */}
          {PRIORITY_CONSTELLATIONS.map((cn) => { const p = starSky(cn.ra, cn.dec, lat, doy, hour, year); if (p.el <= 4) return null; const [x, y] = dome(p.az, p.el); return (
            <text key={cn.name} data-el="constellation" x={x} y={y} fontSize="1.7" fill="#556685" textAnchor="middle" style={{ fontFamily: "monospace" }}>{cn.name}</text>
          ); })}
          {ZODIAC.filter((z) => !PRIORITY_CONSTELLATIONS.some((c) => c.name === z.name)).map((z) => { const rd = eclToRaDec(z.lonDeg, 0); const p = starSky(rd.ra / 15, rd.dec, lat, doy, hour, year); if (p.el <= 4) return null; const [x, y] = dome(p.az, p.el); return (
            <text key={z.name} data-el="zodiac" x={x} y={y} fontSize="1.7" fill="#7a6ba8" textAnchor="middle" style={{ fontFamily: "monospace", letterSpacing: "0.6px" }}>{z.name}</text>
          ); })}
          {/* Planets at real geocentric positions (Saturn, Neptune, Jupiter…) — the same sky the atlas shows */}
          {PLANETS.map((pl) => { const p = planetSky(pl.id, lat, doy, hour, year); if (p.el <= 0) return null; const [x, y] = dome(p.az, p.el); return (
            <g key={pl.id} data-el="planet"><circle cx={x} cy={y} r="0.85" fill={pl.c} stroke="#000" strokeWidth="0.12" /><text x={x + 1.4} y={y + 0.6} fontSize="1.9" fill={pl.c} style={{ fontFamily: "monospace" }}>{pl.n}</text></g>
          ); })}
        </svg>
        {/* GPS ENTRY — paste coordinates in ANY format (decimal · DMS · N/S/E/W), or tap 📍 for device location.
            Setting it moves the lot AND snaps the sky to the current time at that place (moon + stars overhead now). */}
        <div data-arch-gps className="mt-1 flex items-center gap-1 text-[10px]">
          <span style={{ color: C.violet }} className="font-bold tracking-wider">GPS</span>
          <input data-arch-gps-input value={gps} onChange={(e) => { setGps(e.target.value); setGpsErr(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") applyGps(gps); }}
            placeholder="31.44, -97.74  ·  31°26′N 97°44′W  ·  N31.44 W97.74"
            className="min-w-0 flex-1 rounded border bg-transparent px-1.5 py-0.5 text-[9px]" style={{ borderColor: gpsErr ? "#ef4444" : C.border, color: C.text }} />
          <button data-arch-gps-set onClick={() => applyGps(gps)} className="rounded border px-2 py-0.5 text-[9px] font-semibold" style={{ borderColor: C.border, color: C.cyan }}>Set</button>
          <button data-arch-gps-locate onClick={locate} title="Use my device location" className="rounded border px-2 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.violet }}>📍</button>
        </div>
        {gpsErr && <div className="text-[8px]" style={{ color: "#ef4444" }}>Couldn&rsquo;t read that — try &ldquo;lat, lon&rdquo; (e.g. 31.44, -97.74) or DMS with N/S/E/W.</div>}
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <label className="flex items-center justify-between gap-1" style={{ color: C.text }}>Lat<input type="number" value={lat} step={0.5} onChange={(e) => setLat(parseFloat(e.target.value) || 0)} className="w-20 rounded border bg-transparent px-1 text-right" style={{ borderColor: C.border }} /></label>
          <label className="flex items-center justify-between gap-1" style={{ color: C.text }}>Lon<input type="number" value={lon} step={0.5} onChange={(e) => setLon(parseFloat(e.target.value) || 0)} className="w-20 rounded border bg-transparent px-1 text-right" style={{ borderColor: C.border }} /></label>
          <label className="col-span-2 flex items-center gap-2" style={{ color: C.dim }}>Day <input type="range" min={1} max={365} value={doy} onChange={(e) => setDoy(+e.target.value)} className="flex-1" style={{ accentColor: C.cyan, height: 4 }} /><span style={{ color: C.gold }}>{monthDay}</span></label>
          <label className="col-span-2 flex items-center gap-2" style={{ color: C.dim }}>Hour <input type="range" min={0} max={24} step={0.1} value={hour} onChange={(e) => setHour(+e.target.value)} className="flex-1" style={{ accentColor: C.cyan, height: 4 }} /><span style={{ color: C.cyan }}>{fmtHM(hour)} · {sun.el > 0 ? `sun el ${sun.el.toFixed(0)}°` : moon.el > 0 ? `☾ el ${moon.el.toFixed(0)}°` : "night"}</span></label>
        </div>
        {/* SPECIAL-DATE PRESETS — jump the sky to the key times of year a homeowner designs around */}
        <div data-arch-presets className="mt-1 flex flex-wrap gap-1 text-[8px]">
          {([["Winter Solstice", SEASON_DOY.winterSolstice], ["Spring Equinox", SEASON_DOY.springEquinox], ["Summer Solstice", SEASON_DOY.summerSolstice], ["Fall Equinox", SEASON_DOY.fallEquinox]] as const).map(([lab, d]) => (
            <button key={lab} data-preset onClick={() => setDoy(d)} className="rounded border px-1.5 py-0.5" style={{ borderColor: C.border, color: doy === d ? C.gold : C.dim, background: doy === d ? "#241a06" : "transparent" }}>{lab}</button>
          ))}
          <button data-preset onClick={() => syncNow(lon)} title="Snap date + hour to the current local sky" className="rounded border px-1.5 py-0.5" style={{ borderColor: C.border, color: C.cyan }}>Now</button>
        </div>
        {/* WORLD PLACEMENT — click the map to place the property; its lat/lon is the single coordinate
            source feeding the sun + moon above (and, later, structure + terrain). */}
        <div className="mt-2 border-t pt-2" style={{ borderColor: C.border }}>
          <div className="mb-1 flex items-center justify-between text-[9px]">
            <span className="font-bold tracking-wider" style={{ color: C.violet }}>PROPERTY PLACEMENT</span>
            <span style={{ color: C.dim }}>click map → set lot · {lat.toFixed(2)}, {lon.toFixed(2)}</span>
          </div>
          <WorldPlacement lat={lat} lon={lon} onPick={(la, lo) => { setLat(la); setLon(lo); }} />
          <div data-arch-lot className="mt-1 grid grid-cols-2 gap-1 text-[8px]" style={{ fontFamily: "monospace" }}>
            {corners.map((c) => (
              <span key={c.k} data-lot-corner style={{ color: C.dim }}><span style={{ color: C.gold }}>◱ {c.k}</span> {c.la.toFixed(5)}, {c.lo.toFixed(5)}</span>
            ))}
          </div>
          <div className="mt-0.5 text-[8px]" style={{ color: C.dim }}>4-corner lot (~30 m) — shared reference frame for structure · sun · moon · terrain.</div>
        </div>
      </div>
      <div className="space-y-2 rounded-lg border p-3 text-[11px]" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>WINDOW OPTIMIZATION</div>
        {/* sunrise / sunset for the placed lot on the selected date — the homeowner's daylight window */}
        <div data-arch-riseset className="text-[10px]" style={{ color: C.text }}>
          {riseSet.polarDay ? <span style={{ color: C.gold }}>☀ Polar day — sun never sets</span>
            : riseSet.polarNight ? <span style={{ color: C.dim }}>☾ Polar night — sun never rises</span>
            : <><span style={{ color: C.gold }}>↑ {fmtHM(riseSet.rise)}</span> · <span style={{ color: "#7dd3fc" }}>↓ {fmtHM(riseSet.set)}</span> <span style={{ color: C.dim }}>sunrise · sunset</span></>}
        </div>
        <div className="text-[9px]" style={{ color: C.dim }}>Seasonal solar-gain by facing ({monthDay}):</div>
        {exposure.map((e) => (
          <div key={e.k} className="flex items-center gap-2">
            <span className="w-4" style={{ color: C.text }}>{e.k}</span>
            <div className="h-2 flex-1 rounded" style={{ background: "#0c1420" }}><div className="h-2 rounded" style={{ width: `${Math.min(100, (e.score / (best.score || 1)) * 100)}%`, background: C.gold }} /></div>
            <span className="w-8 text-right tabular-nums" style={{ color: C.dim }}>{e.score}</span>
          </div>
        ))}
        <div className="border-t pt-1 text-[10px]" style={{ borderColor: C.border }}>
          <div><span style={{ color: C.green }}>Best light:</span> <span style={{ color: C.text }}>{best.k}-facing</span> — primary living windows.</div>
          <div><span style={{ color: C.gold }}>Manage:</span> <span style={{ color: C.text }}>{worst.k === "N" ? "N (low gain)" : worst.k}</span> — shade/minimize glare.</div>
          {/* ALIGN A HOUSE FACE / WINDOW — set its azimuth, see which special-date sunrise/sunset it frames */}
          <div className="mt-1 flex items-center gap-2 text-[9px]" style={{ color: C.dim }}>Window face
            <input data-arch-facing type="range" min={0} max={359} value={facingAz} onChange={(e) => setFacingAz(+e.target.value)} className="flex-1" style={{ accentColor: C.cyan, height: 4 }} />
            <span className="tabular-nums" style={{ color: C.violet }}>{facingAz}° {cardOf(facingAz)}</span>
          </div>
          <div data-arch-align className="text-[10px]" style={{ color: aligned ? C.green : C.dim }}>
            {aligned ? <>✦ This {cardOf(facingAz)} face frames the <span style={{ color: C.gold }}>{nearestAlign.label}</span> (az {nearestAlign.az.toFixed(0)}°).</>
              : nearestAlign ? <>Nearest event: {nearestAlign.label} at az {nearestAlign.az.toFixed(0)}° — rotate the face {nearestAlign.diff.toFixed(0)}° to frame it.</> : "—"}
          </div>
          {/* WINDOW STORY — one plain-language sentence for the heart (synthesis of the numbers below) */}
          <div data-arch-window-story className="mt-1 text-[10px]" style={{ color: C.text }}>
            ✧ Your <span style={{ color: C.violet }}>{cardOf(facingAz)}</span> window
            {aligned ? <> frames the <span style={{ color: C.gold }}>{nearestAlign.label}</span></> : nearestAlign ? <> is <span style={{ color: C.gold }}>{nearestAlign.diff.toFixed(0)}°</span> from framing the {nearestAlign.label}</> : <> faces {cardOf(facingAz)}</>}
            {moonOver ? <>; on {monthDay} the Moon passes it at <span style={{ color: "#e5e7eb" }}>{fmtHM(moonOver.hour)}</span></> : null}
            {bestMoon ? <>; its natural moon-anniversary is <span style={{ color: "#e5e7eb" }}>{mdLabel(bestMoon.doy)}</span></> : null}.
          </div>
          {/* THE MISSION — on THIS date, when do the Sun + Moon cross this window (time · elevation · phase)? */}
          <div data-arch-window-transit className="mt-1 rounded px-1 py-0.5 text-[9px]" style={{ background: "#0c1420", color: C.dim }}>
            <div><span style={{ color: C.gold }}>☀ Sun</span> over your {cardOf(facingAz)} window:{" "}
              {sunOver ? <span style={{ color: C.text }}>{fmtHM(sunOver.hour)} · el {sunOver.el.toFixed(0)}° · <span style={{ color: sunOver.diff <= 5 ? C.green : C.dim }}>{framesWord(sunOver.diff)} (Δ{sunOver.diff.toFixed(0)}°)</span></span> : <span>never above horizon this date</span>}</div>
            <div><span style={{ color: "#e5e7eb" }}>☾ Moon</span> over your {cardOf(facingAz)} window:{" "}
              {moonOver && moonOverPhase ? <span style={{ color: C.text }}>{fmtHM(moonOver.hour)} · el {moonOver.el.toFixed(0)}° · {moonOverPhase.phase} {(moonOverPhase.illum * 100).toFixed(0)}% · <span style={{ color: moonOver.diff <= 5 ? C.green : C.dim }}>{framesWord(moonOver.diff)} (Δ{moonOver.diff.toFixed(0)}°)</span></span> : <span>never above horizon this date</span>}</div>
            <div className="text-[8px]" style={{ color: C.dim }}>Pick your anniversary / a season on the calendar → this is the moment the sky frames your opening.</div>
          </div>
          {/* REVERSE — the natural anniversary: which date of the year best frames THIS window (+ jump the calendar there) */}
          <div data-arch-best-date className="mt-1 rounded px-1 py-0.5 text-[9px]" style={{ background: "#0c1420", color: C.dim }}>
            <div style={{ color: C.violet }}>◷ Natural anniversary — best sky framing for your {cardOf(facingAz)} window:</div>
            <div className="flex items-center gap-1">
              <span style={{ color: C.gold }}>☀</span>
              {bestSun ? <><span style={{ color: C.text }}>{mdLabel(bestSun.doy)} · {fmtHM(bestSun.hour)} · el {bestSun.el.toFixed(0)}° · {framesWord(bestSun.diff)} (Δ{bestSun.diff.toFixed(0)}°)</span>
                <button data-arch-best-jump onClick={() => setDoy(bestSun.doy)} className="rounded px-1" style={{ border: `1px solid ${C.border}`, color: C.cyan }}>go</button></> : <span>the Sun never frames this facing</span>}
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: "#e5e7eb" }}>☾</span>
              {bestMoon && bestMoonPhase ? <><span style={{ color: C.text }}>{mdLabel(bestMoon.doy)} · {fmtHM(bestMoon.hour)} · el {bestMoon.el.toFixed(0)}° · {bestMoonPhase.phase} · {framesWord(bestMoon.diff)} (Δ{bestMoon.diff.toFixed(0)}°)</span>
                <button data-arch-best-jump onClick={() => setDoy(bestMoon.doy)} className="rounded px-1" style={{ border: `1px solid ${C.border}`, color: C.cyan }}>go</button></> : <span>the Moon never frames this facing this year</span>}
            </div>
          </div>
          <div className="mt-1"><span style={{ color: "#e5e7eb" }}>☾ Moon:</span> <span style={{ color: C.text }}>{moon.phase}</span> · {(moon.illum * 100).toFixed(0)}% lit · {moon.el > 0 ? `el ${moon.el.toFixed(0)}°` : "below horizon"}</div>
          <div className="mt-1 text-[9px]" style={{ color: C.dim }}>Polaris ≈ {polaris.el.toFixed(0)}° (latitude). Sun exact; moon is an approximate model. Deterministic → replayable.</div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
