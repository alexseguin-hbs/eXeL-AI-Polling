"use client";

/**
 * EARTH + MOON BOX — Earth's precise vector globe (graticule + lat/lon marker, for pinpointing the site)
 * with the real-textured Moon orbiting it at its ASTRONOMICALLY ACCURATE position for the selected date.
 * The Moon's orbital angle = its ecliptic longitude (advances ~13.18°/day → one lap ≈ 27.32 days), and its
 * orbit radius tracks the real Earth–Moon distance (perigee closer / apogee farther). Phase (illum) is the
 * true illuminated fraction. Deterministic from the date → replayable, and consistent with the Sky Dome.
 */
import { useMemo } from "react";
import { MOON, PLANETS } from "@/lib/ucrs-2525";
import { moonState } from "@/lib/astro-moon";
import { PRIORITY_CONSTELLATIONS, starfield } from "@/lib/constellations";
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
  const globe = size * 0.6;
  // Moon disc sized from REAL data: Moon:Earth diameter ratio = 1737.4 / 6371 = 0.273× (operator: use actual diameters).
  const earthKm = PLANETS.find((p) => p.id === "earth")?.radiusKm ?? 6371;
  const moonSize = Math.max(14, globe * (MOON.radiusKm / earthKm));
  const earthSpin = (hour / 24) * 360 + playT * 360 + moonPlayT * 360 * moonPeriodDays; // spins N times per Moon orbit
  // DISTANT BACKDROP — deep-space stars + a couple of constellations + far-off planet specks, behind Earth+Moon
  // (looking out from Earth/Moon). Memoized (size-keyed) so it never recomputes during drag/spin (smoothness).
  const bg = useMemo(() => {
    const stars = starfield(cx, cy, size * 0.5, 46).map(([x, y, r]) => [x, y, r * 0.9] as const);
    const cons = ["Orion", "Ursa Major", "Cassiopeia"].map((nm, k) => {
      const con = PRIORITY_CONSTELLATIONS.find((c) => c.name === nm)!;
      const bx = [size * 0.16, size * 0.84, size * 0.5][k], by = [size * 0.82, size * 0.2, size * 0.14][k];
      return { name: nm, pts: con.stars.map(([dx, dy]) => [bx + dx * 0.55, by + dy * 0.55] as const), lines: con.lines };
    });
    // a few far planets as coloured specks around the frame
    const specks = ["mars", "jupiter", "saturn", "venus", "neptune"].map((id, k) => {
      const p = PLANETS.find((q) => q.id === id)!; const a = (k / 5) * 2 * Math.PI + 0.6;
      return { color: p.color, x: cx + size * 0.42 * Math.cos(a), y: cy + size * 0.42 * Math.sin(a) };
    });
    return { stars, cons, specks };
  }, [size, cx, cy]);

  return (
    <div data-earth-moon className={`relative overflow-hidden rounded-md ${bare ? "" : "border"}`} style={{ width: size, height: size, borderColor: "#1e2b3a", background: bare ? "radial-gradient(circle at 50% 45%, #070c16, #04060c)" : "rgba(6,10,16,0.9)" }}>
      {/* deep-space backdrop */}
      <svg data-em-backdrop viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="pointer-events-none absolute inset-0">
        {bg.stars.map(([x, y, r], i) => <circle key={`s${i}`} cx={x} cy={y} r={r} fill="#9aa7c0" opacity="0.5" />)}
        {bg.cons.map((con) => <g key={con.name} opacity="0.6">
          {con.lines.map(([a, b], i) => <line key={i} x1={con.pts[a][0]} y1={con.pts[a][1]} x2={con.pts[b][0]} y2={con.pts[b][1]} stroke="#39496380" strokeWidth="0.3" />)}
          {con.pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.5" fill="#aebfd6" />)}
          <text x={con.pts[0][0]} y={con.pts[0][1] - 2} fontSize={size * 0.03} fill="#4a5568" style={{ fontFamily: "monospace" }}>{con.name}</text>
        </g>)}
        {bg.specks.map((s, i) => <circle key={`p${i}`} cx={s.x} cy={s.y} r="1" fill={s.color} opacity="0.85" />)}
      </svg>
      <span className="absolute left-1 top-0.5 z-10 text-[7px]" style={{ color: "#9aa7b8", fontFamily: "monospace" }}>☾ {(m.illum * 100).toFixed(0)}% · {Math.round(m.distanceKm).toLocaleString()} km</span>
      {/* Moon orbit ring */}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="pointer-events-none absolute inset-0">
        <circle cx={cx} cy={cy} r={orbR} fill="none" stroke="#233043" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
      </svg>
      {/* Earth vector globe (draggable) — precise graticule + site marker; spins accurately during Moon-play */}
      <div className="absolute" style={{ left: cx - globe / 2, top: cy - globe / 2, width: globe }}>
        <MiniGlobe lat={lat} lon={lon} size={globe} color={color} spinDeg={earthSpin} />
      </div>
      {/* Moon — real texture, at the accurate orbital position (spin = orbital angle → tidally locked).
          An always-visible RIM (+ subtle glow) sits behind it so the disc is never lost even at NEW MOON (0% lit,
          near-black texture) — the operator's "moon is missing" fix. Rim brightens slightly with illumination. */}
      <div className="pointer-events-none absolute rounded-full" data-moon-rim
        style={{ left: mx - moonSize / 2, top: my - moonSize / 2, width: moonSize, height: moonSize,
          border: "0.75px solid #6b7688", boxShadow: `0 0 ${3 + 5 * m.illum}px rgba(180,195,220,${0.25 + 0.5 * m.illum})`, background: "radial-gradient(circle at 50% 50%, #2a323f, #10151d)" }} />
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
        <span data-moon-counter className="absolute bottom-0.5 left-1/2 z-10 -translate-x-1/2 rounded px-1 text-[7px] tabular-nums" style={{ background: "rgba(6,10,16,0.85)", color: "#19c8cf", fontFamily: "monospace" }}>
          {Math.round(moonPlayT * 3600)}/3600 · {(moonPlayT * moonPeriodDays).toFixed(1)}d
        </span>
      )}
    </div>
  );
}
