"use client";

/**
 * EARTH + MOON BOX — Earth's precise vector globe (graticule + lat/lon marker, for pinpointing the site)
 * with the real-textured Moon orbiting it at its ASTRONOMICALLY ACCURATE position for the selected date.
 * The Moon's orbital angle = its ecliptic longitude (advances ~13.18°/day → one lap ≈ 27.32 days), and its
 * orbit radius tracks the real Earth–Moon distance (perigee closer / apogee farther). Phase (illum) is the
 * true illuminated fraction. Deterministic from the date → replayable, and consistent with the Sky Dome.
 */
import { MOON } from "@/lib/ucrs-2525";
import { moonState } from "@/lib/astro-moon";
import { MiniGlobe } from "./mini-globe";
import { TexturedGlobe } from "./textured-globe";

export function EarthMoonBox({ lat = 30.44, lon = -97.62, year = 2025, doy = 172, hour = 12, size = 116, color = "#ffd400", bare = false }: {
  lat?: number; lon?: number; year?: number; doy?: number; hour?: number; size?: number; color?: string; bare?: boolean;
}) {
  const m = moonState(year, doy, hour);
  const cx = size / 2, cy = size / 2;
  // orbit radius tracks real distance (363k perigee → 405k apogee) mapped into the box
  const dist01 = Math.max(0, Math.min(1, (m.distanceKm - 356500) / (406700 - 356500)));
  const orbR = size * (0.34 + 0.08 * dist01);
  const ang = m.eclLonMoon * Math.PI / 180;                 // accurate orbital angle
  const mx = cx + orbR * Math.cos(ang), my = cy - orbR * Math.sin(ang);
  const moonSize = Math.max(16, size * 0.2);
  const globe = size * 0.6;

  return (
    <div data-earth-moon className={`relative rounded-md ${bare ? "" : "border"}`} style={{ width: size, height: size, borderColor: "#1e2b3a", background: bare ? "transparent" : "rgba(6,10,16,0.9)" }}>
      <span className="absolute left-1 top-0.5 z-10 text-[7px]" style={{ color: "#9aa7b8", fontFamily: "monospace" }}>☾ {(m.illum * 100).toFixed(0)}% · {Math.round(m.distanceKm).toLocaleString()} km</span>
      {/* Moon orbit ring */}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="pointer-events-none absolute inset-0">
        <circle cx={cx} cy={cy} r={orbR} fill="none" stroke="#233043" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
      </svg>
      {/* Earth vector globe (draggable) — precise graticule + site marker */}
      <div className="absolute" style={{ left: cx - globe / 2, top: cy - globe / 2, width: globe }}>
        <MiniGlobe lat={lat} lon={lon} size={globe} color={color} spinDeg={(hour / 24) * 360} />
      </div>
      {/* Moon — real texture, at the accurate orbital position */}
      <div className="absolute" style={{ left: mx - moonSize / 2, top: my - moonSize / 2 }} data-moon-body>
        <TexturedGlobe src={MOON.tex} size={moonSize} spinDeg={m.eclLonMoon} />
      </div>
    </div>
  );
}
