"use client";

/**
 * MINI 3D GLOBE — a small draggable wireframe Earth (inspiration: the Security-2525 3D globe view).
 * ================================================================================================
 * Orthographic wireframe sphere (graticule) + a location marker, rotatable by drag: LEFT-drag spins
 * longitude/latitude, RIGHT-drag rolls — just like the Security globe's left/right navigation. NO ZOOM
 * (no wheel/pinch), matching the operator's spec. Self-contained SVG; front hemisphere only for the 3D read.
 */
import { useRef, useState } from "react";

const DEG = Math.PI / 180;
const R = 44, CX = 50, CY = 50;

// Orthographic projection of (lat,lon) after rotate(lon0), tilt(lat0), roll. Returns screen x/y + front flag.
function project(lat: number, lon: number, lon0: number, lat0: number, roll: number) {
  const phi = lat * DEG, lam = (lon - lon0) * DEG;
  let x = Math.cos(phi) * Math.sin(lam);
  let y = Math.sin(phi);
  let z = Math.cos(phi) * Math.cos(lam);
  const cl = Math.cos(lat0 * DEG), sl = Math.sin(lat0 * DEG);        // tilt about screen-x
  const y2 = y * cl - z * sl, z2 = y * sl + z * cl; y = y2; z = z2;
  const cr = Math.cos(roll), sr = Math.sin(roll);                    // roll about screen-z
  const x3 = x * cr - y * sr, y3 = x * sr + y * cr;
  return { x: CX + x3 * R, y: CY - y3 * R, front: z > 0 };
}
const arc = (pts: { x: number; y: number; front: boolean }[]) => {
  // draw only continuous front-facing runs
  let d = "", pen = false;
  for (const p of pts) { if (p.front) { d += `${pen ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)} `; pen = true; } else pen = false; }
  return d;
};

export function MiniGlobe({ lat = 30.27, lon = -97.74, size = 92, color = "#19c8cf" }: { lat?: number; lon?: number; size?: number; color?: string }) {
  const [rot, setRot] = useState({ lon: -lon, lat: 18, roll: 0 }); // start looking at the property
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null);

  const meridians = Array.from({ length: 12 }, (_, i) => -180 + i * 30);
  const parallels = [-60, -30, 0, 30, 60];
  const mk = (lo: number) => arc(Array.from({ length: 37 }, (_, i) => project(-90 + i * 5, lo, rot.lon, rot.lat, rot.roll)));
  const pk = (la: number) => arc(Array.from({ length: 73 }, (_, i) => project(la, -180 + i * 5, rot.lon, rot.lat, rot.roll)));
  const loc = project(lat, lon, rot.lon, rot.lat, rot.roll);

  const down = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, btn: e.button }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX; drag.current.y = e.clientY;
    if (drag.current.btn === 2) setRot((r) => ({ ...r, roll: r.roll + dx * 0.01 }));       // right → roll
    else setRot((r) => ({ ...r, lon: r.lon - dx * 0.5, lat: Math.max(-85, Math.min(85, r.lat + dy * 0.5)) })); // left → spin
  };
  const up = () => { drag.current = null; };

  return (
    <div className="flex flex-col items-center">
      <svg data-mini-globe viewBox="0 0 100 100" width={size} height={size} className="touch-none cursor-grab"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onContextMenu={(e) => e.preventDefault()}>
        <circle cx={CX} cy={CY} r={R} fill="#071019" stroke="#233043" strokeWidth="0.8" />
        {meridians.map((lo) => <path key={`m${lo}`} d={mk(lo)} fill="none" stroke={color} strokeWidth="0.35" opacity="0.45" />)}
        {parallels.map((la) => <path key={`p${la}`} d={pk(la)} fill="none" stroke={color} strokeWidth={la === 0 ? 0.6 : 0.35} opacity={la === 0 ? 0.7 : 0.4} />)}
        {loc.front && <><circle cx={loc.x} cy={loc.y} r="1.8" fill="none" stroke="#ffd400" strokeWidth="0.5" /><circle cx={loc.x} cy={loc.y} r="0.9" fill="#ffd400" /></>}
      </svg>
      <span className="text-[8px]" style={{ color: "#5f7186", fontFamily: "monospace" }}>EARTH · drag L/R · no zoom</span>
    </div>
  );
}
