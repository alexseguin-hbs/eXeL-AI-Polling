"use client";

/**
 * PLANET GLOBE — a small draggable 3D sphere for ANY solar-system body (Security-2525 globe inspiration).
 * ======================================================================================================
 * Orthographic shaded sphere rendered procedurally + deterministically (no external textures — strict CSP,
 * self-contained SVG). Two surface styles keyed off `surface`:
 *   • rocky  — mottled albedo + seeded craters (Mercury · Mars · Pluto · Moon)
 *   • banded — latitude cloud bands + a signature storm oval (Jupiter · Saturn · the ice giants · Venus)
 * Saturn adds a tilted ring system. A day/night terminator (light from upper-left) gives the 3D read.
 * Rotatable by drag — LEFT-drag SPINS (longitude) + tilts (latitude); RIGHT-drag rolls — exactly like the
 * Security globe / the Earth MiniGlobe. NO ZOOM (no wheel/pinch). Features are seeded from the body name so
 * the same world always looks identical (determinism requirement). Front hemisphere only.
 */
import { useId, useRef, useState } from "react";

interface Body { name: string; surface: "rocky" | "banded"; globe: string; rings?: boolean }

const DEG = Math.PI / 180;
const R = 44, CX = 50, CY = 50;

// ── colour helpers ──
function hexToRgb(h: string) { const n = parseInt(h.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
function shade(hex: string, f: number) { const { r, g, b } = hexToRgb(hex); const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c(r)},${c(g)},${c(b)})`; }

// ── orthographic projection (matches mini-globe): (lat,lon) → screen, front = facing the viewer ──
function project(lat: number, lon: number, lon0: number, lat0: number, roll: number) {
  const phi = lat * DEG, lam = (lon - lon0) * DEG;
  let x = Math.cos(phi) * Math.sin(lam);
  let y = Math.sin(phi);
  let z = Math.cos(phi) * Math.cos(lam);
  const cl = Math.cos(lat0 * DEG), sl = Math.sin(lat0 * DEG);
  const y2 = y * cl - z * sl, z2 = y * sl + z * cl; y = y2; z = z2;
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const x3 = x * cr - y * sr, y3 = x * sr + y * cr;
  return { x: CX + x3 * R, y: CY - y3 * R, front: z > 0, z };
}

// Deterministic PRNG seeded from the body name → stable craters/storms every render (replayable).
function seeded(seed: string) { let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return () => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h / 4294967296; }; }

// A front-facing filled band between two parallels (latHi over latLo), clipped to the disc.
function bandPath(latLo: number, latHi: number, lon0: number, lat0: number, roll: number): string | null {
  const hi: { x: number; y: number }[] = [], lo: { x: number; y: number }[] = [];
  for (let lon = -180; lon <= 180; lon += 6) { const p = project(latHi, lon, lon0, lat0, roll); if (p.front) hi.push(p); }
  for (let lon = -180; lon <= 180; lon += 6) { const p = project(latLo, lon, lon0, lat0, roll); if (p.front) lo.push(p); }
  if (hi.length < 2 || lo.length < 2) return null;
  const d = hi.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
    + " " + lo.reverse().map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  return d;
}

// Latitude band boundaries + tint multipliers (alternating light/dark cloud belts) for a banded world.
const BAND_EDGES = [-90, -62, -40, -22, -8, 8, 22, 40, 62, 90];
const BAND_TINT = [0.82, 1.12, 0.74, 1.18, 0.9, 1.18, 0.74, 1.12, 0.82];

export function PlanetGlobe({ body, size = 82, label = true }: { body: Body; size?: number; label?: boolean }) {
  const [rot, setRot] = useState({ lon: 0, lat: 14, roll: 0 });
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null);
  const uid = useId().replace(/:/g, "");
  const lon0 = rot.lon, lat0 = rot.lat, roll = rot.roll;

  const down = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, btn: e.button }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX; drag.current.y = e.clientY;
    if (drag.current.btn === 2) setRot((r) => ({ ...r, roll: r.roll + dx * 0.01 }));
    else setRot((r) => ({ ...r, lon: r.lon - dx * 0.6, lat: Math.max(-85, Math.min(85, r.lat + dy * 0.5)) }));
  };
  const up = () => { drag.current = null; };

  // Seeded surface features: rocky → craters; banded → a couple of storm ovals (Jupiter's Great Red Spot etc.).
  const rnd = seeded(body.name);
  const featCount = body.surface === "rocky" ? 22 : 3;
  const features = Array.from({ length: featCount }, () => ({
    lat: (rnd() - 0.5) * 150,
    lon: (rnd() - 0.5) * 360,
    r: body.surface === "rocky" ? 1.4 + rnd() * 3.4 : 3 + rnd() * 4,
    tint: body.surface === "rocky" ? (rnd() > 0.5 ? 0.7 : 1.2) : (0.72 + rnd() * 0.1),
  }));

  const ringTilt = Math.max(0.12, Math.abs(Math.sin(lat0 * DEG))) * (lat0 >= 0 ? 1 : 1); // ring opening ∝ view latitude
  const ringRx = R * 1.95, ringRy = ringRx * ringTilt;
  const ringFront = lat0 >= 0; // when tilted so north is up, the front arc passes below the planet

  return (
    <div className="flex flex-col items-center">
      <svg data-planet-globe data-body={body.name} viewBox="0 0 100 100" width={size} height={size} className="touch-none cursor-grab"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onContextMenu={(e) => e.preventDefault()}>
        <defs>
          <clipPath id={`c${uid}`}><circle cx={CX} cy={CY} r={R} /></clipPath>
          <radialGradient id={`lit${uid}`} cx="34%" cy="30%" r="80%">
            <stop offset="0%" stopColor={shade(body.globe, 1.45)} />
            <stop offset="55%" stopColor={body.globe} />
            <stop offset="100%" stopColor={shade(body.globe, 0.42)} />
          </radialGradient>
          <radialGradient id={`term${uid}`} cx="34%" cy="30%" r="92%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="62%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </radialGradient>
        </defs>

        {/* Saturn's rings — back arc behind the planet */}
        {body.rings && <ellipse cx={CX} cy={CY} rx={ringRx} ry={ringRy} fill="none" stroke={shade(body.globe, 1.1)} strokeWidth="3.2" opacity="0.28"
          transform={`rotate(${-roll * 57.3} ${CX} ${CY})`} strokeDasharray={ringFront ? "0" : "0"} />}

        {/* base lit sphere */}
        <circle cx={CX} cy={CY} r={R} fill={`url(#lit${uid})`} />
        <g clipPath={`url(#c${uid})`}>
          {/* banded worlds — latitude cloud belts */}
          {body.surface === "banded" && BAND_EDGES.slice(0, -1).map((lo, i) => {
            const d = bandPath(lo, BAND_EDGES[i + 1], lon0, lat0, roll);
            return d ? <path key={`b${i}`} d={d} fill={shade(body.globe, BAND_TINT[i])} opacity="0.55" /> : null;
          })}
          {/* seeded features (craters / storms), foreshortened + faded toward the limb */}
          {features.map((f, i) => { const p = project(f.lat, f.lon, lon0, lat0, roll); if (!p.front) return null; const s = 0.35 + 0.65 * p.z; return (
            <ellipse key={`f${i}`} cx={p.x} cy={p.y} rx={f.r * s} ry={f.r * s * (0.6 + 0.4 * p.z)} fill={shade(body.globe, f.tint)} opacity={body.surface === "rocky" ? 0.5 : 0.6} />
          ); })}
        </g>
        {/* day/night terminator → the 3D read */}
        <circle cx={CX} cy={CY} r={R} fill={`url(#term${uid})`} />
        {/* Saturn's rings — front arc over the planet (drawn as a half via clip to below/above centre) */}
        {body.rings && <g transform={`rotate(${-roll * 57.3} ${CX} ${CY})`}>
          <path d={`M ${CX - ringRx} ${CY} A ${ringRx} ${ringRy} 0 0 ${ringFront ? 0 : 1} ${CX + ringRx} ${CY}`} fill="none" stroke={shade(body.globe, 1.15)} strokeWidth="3.4" opacity="0.6" />
        </g>}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#233043" strokeWidth="0.6" />
      </svg>
      {label && <span className="text-[8px]" style={{ color: "#5f7186", fontFamily: "monospace" }}>{body.name.toUpperCase()} · drag L/R · no zoom</span>}
    </div>
  );
}
