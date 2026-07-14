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

export function EarthMoonBox({ lat = 30.44, lon = -97.62, year = 2025, doy = 172, hour = 12, size = 116, color = "#ffd400", bare = false, playT = 0,
  moonPlayT = 0, moonPeriodDays = 27.3217, moonPlaying = false, onMoonPlay, moonMode = "sidereal", onMoonMode }: {
  lat?: number; lon?: number; year?: number; doy?: number; hour?: number; size?: number; color?: string; bare?: boolean; playT?: number;
  moonPlayT?: number; moonPeriodDays?: number; moonPlaying?: boolean; onMoonPlay?: () => void; moonMode?: "sidereal" | "synodic"; onMoonMode?: () => void;
}) {
  const m = moonState(year, doy, hour);
  const cx = size / 2, cy = size / 2;
  // orbit radius tracks real distance (363k perigee → 405k apogee) mapped into the box
  const dist01 = Math.max(0, Math.min(1, (m.distanceKm - 356500) / (406700 - 356500)));
  const orbR = size * (0.34 + 0.08 * dist01);
  // Planet-play advances the Moon 13.18° (its 24 h arc); MOON-play sweeps a full 360° orbit. Tidal locking →
  // the Moon's own spin equals its orbital angle (same face toward Earth).
  const moonAngleDeg = m.eclLonMoon + playT * 13.176 + moonPlayT * 360;
  const ang = moonAngleDeg * Math.PI / 180;                 // accurate orbital angle
  const mx = cx + orbR * Math.cos(ang), my = cy - orbR * Math.sin(ang);
  const moonSize = Math.max(16, size * 0.2);
  const globe = size * 0.6;
  const earthSpin = (hour / 24) * 360 + playT * 360 + moonPlayT * 360 * moonPeriodDays; // spins N times per Moon orbit

  return (
    <div data-earth-moon className={`relative rounded-md ${bare ? "" : "border"}`} style={{ width: size, height: size, borderColor: "#1e2b3a", background: bare ? "transparent" : "rgba(6,10,16,0.9)" }}>
      <span className="absolute left-1 top-0.5 z-10 text-[7px]" style={{ color: "#9aa7b8", fontFamily: "monospace" }}>☾ {(m.illum * 100).toFixed(0)}% · {Math.round(m.distanceKm).toLocaleString()} km</span>
      {/* Moon orbit ring */}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="pointer-events-none absolute inset-0">
        <circle cx={cx} cy={cy} r={orbR} fill="none" stroke="#233043" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
      </svg>
      {/* Earth vector globe (draggable) — precise graticule + site marker; spins accurately during Moon-play */}
      <div className="absolute" style={{ left: cx - globe / 2, top: cy - globe / 2, width: globe }}>
        <MiniGlobe lat={lat} lon={lon} size={globe} color={color} spinDeg={earthSpin} />
      </div>
      {/* Moon — real texture, at the accurate orbital position (spin = orbital angle → tidally locked) */}
      <div className="absolute" style={{ left: mx - moonSize / 2, top: my - moonSize / 2 }} data-moon-body>
        <TexturedGlobe src={MOON.tex} size={moonSize} spinDeg={moonAngleDeg} />
      </div>
      {/* MOON PLAY (bottom-right) — one full Moon orbit; sidereal 27.3 d (true orbit) / synodic 29.5 d (phases) */}
      {onMoonPlay && (
        <div className="absolute bottom-0.5 right-0.5 z-10 flex items-center gap-0.5" data-moon-play>
          <button onClick={onMoonPlay} title={moonPlaying ? "Stop Moon orbit" : "Play one Moon orbit around Earth"}
            className="rounded border px-1 py-0.5 text-[7px] font-bold" style={{ borderColor: moonPlaying ? "#19c8cf" : "#2a3340", color: moonPlaying ? "#19c8cf" : "#9aa7b8", background: "rgba(6,10,16,0.85)" }}>{moonPlaying ? "⏸" : "▶"} ☾</button>
          <button onClick={onMoonMode} title="Toggle sidereal (true orbit, 27.3 d) / synodic (phase cycle, 29.5 d)"
            className="rounded border px-1 py-0.5 text-[7px] tabular-nums" style={{ borderColor: "#2a3340", color: "#5f7186", background: "rgba(6,10,16,0.85)" }}>{moonMode === "sidereal" ? "27.3d" : "29.5d"}</button>
        </div>
      )}
      {/* orbit-position counter while playing */}
      {moonPlaying && (
        <span data-moon-counter className="absolute bottom-0.5 left-0.5 z-10 rounded px-1 text-[7px] tabular-nums" style={{ background: "rgba(6,10,16,0.85)", color: "#19c8cf", fontFamily: "monospace" }}>
          {Math.round(moonPlayT * 3600)}/3600 · {(moonPlayT * moonPeriodDays).toFixed(1)}d
        </span>
      )}
    </div>
  );
}
