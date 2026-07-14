"use client";

/**
 * EARTH + MOON BOX — Earth's draggable land/ocean globe with the Moon orbiting inside one bordered box.
 * Moon position + phase are derived deterministically from the selected date (sidereal month for the
 * orbital angle, synodic month for the lit fraction), so the box is accurate to the day on the map.
 */
import { MOON } from "@/lib/ucrs-2525";
import { MiniGlobe } from "./mini-globe";

const SIDEREAL = 27.321661, SYNODIC = 29.530589; // days
const shade = (hex: string, f: number) => { const n = parseInt(hex.slice(1), 16); const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`; };

export function EarthMoonBox({ lat = 30.44, lon = -97.62, year = 2025, doy = 172, hour = 12, size = 108, color = "#ffd400", bare = false }: {
  lat?: number; lon?: number; year?: number; doy?: number; hour?: number; size?: number; color?: string; bare?: boolean;
}) {
  const days = (year - 2000) * 365.25 + doy + hour / 24;
  const orbit = ((days / SIDEREAL) * 360) % 360;            // Moon's angular position around Earth
  const phase = ((days / SYNODIC) % 1);                     // 0=new, 0.5=full
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;    // lit fraction
  const cx = size / 2, cy = size / 2;
  const orbR = size * 0.4;                                  // Moon's orbital radius in the box
  const mx = cx + orbR * Math.sin(orbit * Math.PI / 180), my = cy - orbR * Math.cos(orbit * Math.PI / 180); // 0° at top, clockwise
  const moonR = size * 0.06;
  const globe = size * 0.62;

  return (
    <div data-earth-moon className={`relative rounded-md ${bare ? "" : "border"}`} style={{ width: size, height: size, borderColor: "#1e2b3a", background: bare ? "transparent" : "rgba(6,10,16,0.9)" }}>
      <span className="absolute left-1 top-0.5 z-10 text-[7px]" style={{ color: "#9aa7b8", fontFamily: "monospace" }}>☾ {(illum * 100).toFixed(0)}%</span>
      {/* Moon orbit ring + Moon (rendered under/over the Earth so it reads as orbiting) */}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="pointer-events-none absolute inset-0">
        <circle cx={cx} cy={cy} r={orbR} fill="none" stroke="#233043" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
        <defs>
          <radialGradient id="emb-moon" cx="36%" cy="32%" r="80%">
            <stop offset="0%" stopColor={shade(MOON.globe, 1.4)} />
            <stop offset="100%" stopColor={shade(MOON.globe, 0.5)} />
          </radialGradient>
        </defs>
        <circle cx={mx} cy={my} r={moonR} fill="url(#emb-moon)" stroke="#2a3340" strokeWidth="0.4" />
        {/* phase shadow — a dark cap scaled by the unlit fraction */}
        <circle cx={mx} cy={my} r={moonR} fill="#05070d" opacity={Math.max(0, 1 - illum) * 0.72} transform={`translate(${(illum - 0.5) * moonR * 1.6} 0)`} />
      </svg>
      {/* Earth globe (draggable) centred */}
      <div className="absolute" style={{ left: cx - globe / 2, top: cy - globe / 2, width: globe }}>
        <MiniGlobe lat={lat} lon={lon} size={globe} color={color} spinDeg={(hour / 24) * 360} />
      </div>
    </div>
  );
}
