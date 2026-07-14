"use client";

/**
 * MINI 3D GLOBE — a small draggable Earth with real land / ocean / countries (Security-2525 globe inspiration).
 * ============================================================================================================
 * Orthographic sphere: ocean-blue disc + filled landmasses + country outlines (Natural-Earth 50m data, reused
 * from Security-2525: /security-2525/borders-ne50m.json). Rotatable by drag — LEFT-drag SPINS on the equator
 * (longitude) + tilts (latitude); RIGHT-drag rolls — like the Security globe's left/right nav. NO ZOOM (no
 * wheel/pinch). Front hemisphere only. Self-contained SVG.
 */
import { useEffect, useId, useRef, useState } from "react";

interface BorderData { countries: [number, number][][]; usStates: [number, number][][] }
let MG_BORDERS: BorderData | null = null;

const DEG = Math.PI / 180;
const R = 46, CX = 50, CY = 50;
const OCEAN = "#0a2f52", LAND = "#123d1f", COAST = "#2f8f5f";

function project(lat: number, lon: number, lon0: number, lat0: number, roll: number) {
  const phi = lat * DEG, lam = (lon - lon0) * DEG;
  let x = Math.cos(phi) * Math.sin(lam);
  let y = Math.sin(phi);
  let z = Math.cos(phi) * Math.cos(lam);
  const cl = Math.cos(lat0 * DEG), sl = Math.sin(lat0 * DEG);
  const y2 = y * cl - z * sl, z2 = y * sl + z * cl; y = y2; z = z2;
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const x3 = x * cr - y * sr, y3 = x * sr + y * cr;
  return { x: CX + x3 * R, y: CY - y3 * R, front: z > 0 };
}
// Filled polygon for a ring whose bulk faces the viewer (clipped to the disc hides the limb fold).
function ringFill(ring: [number, number][], lon0: number, lat0: number, roll: number): string | null {
  let front = 0; const pr = ring.map(([lo, la]) => { const p = project(la, lo, lon0, lat0, roll); if (p.front) front++; return p; });
  if (front / pr.length < 0.5) return null;
  return pr.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
}
// Front-facing outline (break on backface) for coastlines / country borders.
function ringLine(ring: [number, number][], lon0: number, lat0: number, roll: number): string {
  let d = "", pen = false;
  for (const [lo, la] of ring) { const p = project(la, lo, lon0, lat0, roll); if (!p.front) { pen = false; continue; } d += `${pen ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)} `; pen = true; }
  return d;
}

export function MiniGlobe({ lat = 30.44, lon = -97.62, size = 92, color = "#ffd400", spinDeg = 0 }: { lat?: number; lon?: number; size?: number; color?: string; spinDeg?: number }) {
  const [borders, setBorders] = useState<BorderData | null>(MG_BORDERS);
  const [rot, setRot] = useState({ lon: -lon, lat: 16, roll: 0 });
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null);
  const clip = useId().replace(/:/g, "");

  useEffect(() => {
    if (MG_BORDERS) { setBorders(MG_BORDERS); return; }
    fetch("/security-2525/borders-ne50m.json").then((r) => r.json()).then((d: BorderData) => { MG_BORDERS = d; setBorders(d); }).catch(() => {});
  }, []);

  const lon0 = rot.lon + spinDeg; // manual drag + time-of-day spin (Earth rotates on its axis when playing)
  const parallels = [-60, -30, 0, 30, 60];
  const pk = (la: number) => ringLine(Array.from({ length: 73 }, (_, i) => [-180 + i * 5, la] as [number, number]), lon0, rot.lat, rot.roll);
  const loc = project(lat, lon, lon0, rot.lat, rot.roll);

  const down = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, btn: e.button }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX; drag.current.y = e.clientY;
    if (drag.current.btn === 2) setRot((r) => ({ ...r, roll: r.roll + dx * 0.01 }));
    else setRot((r) => ({ ...r, lon: r.lon - dx * 0.6, lat: Math.max(-85, Math.min(85, r.lat + dy * 0.5)) })); // spin on equator + tilt
  };
  const up = () => { drag.current = null; };

  return (
    <div className="flex flex-col items-center">
      <svg data-mini-globe viewBox="0 0 100 100" width={size} height={size} className="touch-none cursor-grab"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onContextMenu={(e) => e.preventDefault()}>
        <defs><clipPath id={`g${clip}`}><circle cx={CX} cy={CY} r={R} /></clipPath></defs>
        <circle cx={CX} cy={CY} r={R} fill={OCEAN} stroke="#0f3f6e" strokeWidth="0.6" />
        <g clipPath={`url(#g${clip})`}>
          {borders && borders.countries.map((ring, i) => { const d = ringFill(ring, lon0, rot.lat, rot.roll); return d ? <path key={`f${i}`} d={d} fill={LAND} stroke="none" /> : null; })}
          {borders && borders.countries.map((ring, i) => <path key={`c${i}`} d={ringLine(ring, lon0, rot.lat, rot.roll)} fill="none" stroke={COAST} strokeWidth="0.25" opacity="0.75" />)}
          {parallels.map((la) => <path key={`p${la}`} d={pk(la)} fill="none" stroke="#79a7c9" strokeWidth={la === 0 ? 0.4 : 0.22} opacity={la === 0 ? 0.5 : 0.28} />)}
        </g>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#233043" strokeWidth="0.5" />
        {loc.front && <><circle cx={loc.x} cy={loc.y} r="1.8" fill="none" stroke={color} strokeWidth="0.6" /><circle cx={loc.x} cy={loc.y} r="0.9" fill={color} /></>}
      </svg>
      <span className="text-[8px]" style={{ color: "#5f7186", fontFamily: "monospace" }}>EARTH · drag L/R · no zoom</span>
    </div>
  );
}
