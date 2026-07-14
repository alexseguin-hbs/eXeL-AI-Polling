"use client";

/**
 * ARCHITECT-2525 · UCRS-2525 Celestial Map v2 (Design → Solar System).
 * ===================================================================
 * A 3D tilted-plane solar-system view for SUN·SKY. Orbits are ELLIPSOID rings on a plane tilted by an
 * elevation angle (SA · star/system tilt), aphelion LEFT / perihelion RIGHT, Sun at the shared right focus.
 * Coloured across the 13-Trinity spectrum (Mercury red → Neptune violet → Pluto ultraviolet); Earth drawn
 * largest with an EA axial-tilt marker (the reference/home planet, EA 230.1584). Toggle Schematic ↔ True-scale.
 * Click any planet → its Base-3600 UCRS-2525 coordinates (voxel-style). HU scrubber advances all planets.
 * Driven by lib/ucrs-2525.ts (pure). Self-contained SVG.
 */
import { useMemo, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  PLANETS, ucrsAt, huToNu, axSchematic, axTrue, bOverA, fmt3600, FULL_ORBIT, fmtMeters,
} from "@/lib/ucrs-2525";
import { MiniGlobe } from "./mini-globe";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };
const SUN_X = 122, SUN_Y = 56, DEG = Math.PI / 180;

// PHASE CLOCK — the canonical Base-3600 view: PERIHELION at 12 o'clock, HU running clockwise (0→3600).
// Each planet sits at its HU angle; the selected planet gets a hand. Complements the landscape map.
function PhaseClock({ items, selId }: { items: { id: string; name: string; color: string; effHu: number }[]; selId: string }) {
  const R = 36, cx = 50, cy = 50;
  const ang = (hu: number) => (hu / 3600) * 2 * Math.PI;                 // 0 at 12 o'clock, clockwise
  const at = (hu: number, r = R) => [cx + r * Math.sin(ang(hu)), cy - r * Math.cos(ang(hu))] as const;
  const sel = items.find((i) => i.id === selId);
  return (
    <svg data-phase-clock viewBox="0 0 100 100" width={86} height={86} className="rounded-full" style={{ background: "rgba(8,12,20,0.82)" }}>
      <circle cx={cx} cy={cy} r={R + 6} fill="none" stroke="#233043" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#16202e" strokeWidth="0.5" />
      {[0, 900, 1800, 2700].map((h) => { const [x1, y1] = at(h, R + 4), [x2, y2] = at(h, R); return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3f4d5f" strokeWidth="0.5" />; })}
      <text x={cx} y={cy - R - 8} fontSize="4.4" fill={C.green} textAnchor="middle" fontWeight="bold" style={{ fontFamily: "monospace" }}>PERI</text>
      <text x={cx} y={cy + R + 11} fontSize="4.4" fill={C.violet} textAnchor="middle" fontWeight="bold" style={{ fontFamily: "monospace" }}>APHE</text>
      <text x={cx + R + 3} y={cy + 1.5} fontSize="3" fill={C.dim} textAnchor="start" style={{ fontFamily: "monospace" }}>900</text>
      <text x={cx - R - 3} y={cy + 1.5} fontSize="3" fill={C.dim} textAnchor="end" style={{ fontFamily: "monospace" }}>2700</text>
      {sel && (() => { const [hx, hy] = at(sel.effHu, R - 2); return <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={sel.color} strokeWidth="0.8" />; })()}
      {items.map((it) => { const [x, y] = at(it.effHu); const on = it.id === selId; return <circle key={it.id} cx={x} cy={y} r={on ? 2.2 : it.id === "earth" ? 1.8 : 1.2} fill={it.color} stroke={on ? "#fff" : "none"} strokeWidth="0.3" />; })}
      <circle cx={cx} cy={cy} r="2.2" fill="#fff3b0" />
    </svg>
  );
}

export function ArchitectCelestial() {
  const [hu, setHu] = useState(0);
  const [selId, setSelId] = useState("earth");
  const [tiltDeg, setTiltDeg] = useState(26);       // SA — orbital-plane elevation
  const [scaleMode, setScaleMode] = useState<"schematic" | "true">("schematic");
  const [max, setMax] = useState(false);            // maximize the whole solar system
  const sinE = Math.sin(tiltDeg * DEG);

  // Layout: each orbit is an ellipse in its plane (semi-major ax, focus offset ax·e), foreshortened vertically
  // by sin(elevation). Planet at true anomaly ν(HU); depth = sin(ν) (front > 0, back < 0).
  const laid = useMemo(() => PLANETS.map((p, i) => {
    const ax = scaleMode === "true" ? axTrue(p.aAU) : axSchematic(i);
    const ry = ax * bOverA(p.e) * sinE;             // foreshortened minor axis (the tilt)
    const cx = SUN_X - ax * p.e;                     // Sun sits at the right focus
    const effHu = ((hu + (i - 2) * 400) % 3600 + 3600) % 3600; // Earth (index 2) STARTS at perihelion (HU 0)
    const nu = huToNu(effHu) * DEG;
    const x = cx + ax * Math.cos(nu), y = SUN_Y + ry * Math.sin(nu);
    const depth = Math.sin(nu);                       // +front / −back
    return { p, i, ax, ry, cx, effHu, x, y, depth };
  }), [hu, sinE, scaleMode]);

  const sel = laid.find((l) => l.p.id === selId) || laid[2];
  const rd = ucrsAt(sel.p, sel.effHu);
  const drawOrder = [...laid].sort((a, b) => a.depth - b.depth); // back planets first

  return (
    <div className={max ? "fixed inset-0 z-[80] grid gap-3 overflow-auto p-3 lg:grid-cols-[1fr_272px]" : "grid gap-3 lg:grid-cols-[1fr_272px]"} style={max ? { background: "#05070d" } : undefined}>
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-[9px]">
          <span className="font-bold tracking-wider" style={{ color: C.violet }}>UCRS-2525 · BASE-3600 CELESTIAL MAP</span>
          <div className="flex items-center gap-1">
            {(["schematic", "true"] as const).map((m) => (
              <button key={m} data-scale-toggle onClick={() => setScaleMode(m)} className="rounded border px-1.5 py-0.5 text-[8px]"
                style={{ borderColor: C.border, color: scaleMode === m ? C.violet : C.dim, background: scaleMode === m ? "#221833" : "transparent" }}>{m === "true" ? "true-scale" : "schematic"}</button>
            ))}
            <button data-cel-max onClick={() => setMax((v) => !v)} title={max ? "Minimize" : "Maximize"} aria-label={max ? "Minimize" : "Maximize"}
              className="ml-0.5 flex items-center justify-center rounded border p-1" style={{ borderColor: max ? C.cyan : C.border, color: max ? C.cyan : C.dim }}>
              {max ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
          </div>
        </div>
        <div className="relative">
        {/* PHASE CLOCK — upper-right: perihelion at 12 o'clock (canonical Base-3600 convention) */}
        <div className="absolute right-1 top-1 z-10">
          <PhaseClock items={laid.map((l) => ({ id: l.p.id, name: l.p.name, color: l.p.color, effHu: l.effHu }))} selId={selId} />
        </div>
        {/* mini 3D Earth globe — bottom-right, drag L/R to rotate (spin on equator), no zoom */}
        <div className="absolute bottom-1 right-1 z-10">
          <MiniGlobe lat={30.27} lon={-97.74} size={max ? 132 : 88} color={C.gold} />
        </div>
        <svg data-arch-celestial viewBox="0 0 244 112" preserveAspectRatio="xMidYMid meet" className="w-full rounded" style={{ background: "radial-gradient(circle at 50% 42%, #0b1122, #05070d)", aspectRatio: "2.2 / 1" }}>
          {/* orbital-plane baseline (the tilt reference / SA) */}
          <ellipse cx={SUN_X} cy={SUN_Y} rx="118" ry={118 * sinE} fill="none" stroke="#141d29" strokeWidth="0.3" />
          {/* orbits — ellipsoid rings + apsidal line + peri/aphe markers */}
          {laid.map(({ p, ax, ry, cx }) => (
            <g key={`o${p.id}`}>
              <line x1={cx - ax} y1={SUN_Y} x2={cx + ax} y2={SUN_Y} stroke={p.color} strokeWidth="0.22" strokeDasharray="1.4 1.4" opacity="0.3" />
              <ellipse data-orbit cx={cx} cy={SUN_Y} rx={ax} ry={ry} fill="none" stroke={p.color} strokeWidth="0.32" strokeDasharray="0.9 1.1" opacity="0.6" />
              <circle cx={cx + ax} cy={SUN_Y} r="0.7" fill={p.color} />{/* perihelion (Sun side) — filled */}
              <circle cx={cx - ax} cy={SUN_Y} r="0.7" fill="none" stroke={p.color} strokeWidth="0.3" />{/* aphelion — hollow */}
            </g>
          ))}
          {/* Earth peri/aphe labels */}
          {(() => { const e = laid[2]; return <>
            <text x={e.cx - e.ax - 1} y={SUN_Y - 1.4} fontSize="2.3" fill={C.dim} textAnchor="end" style={{ fontFamily: "monospace" }}>aphelion ◀</text>
            <text x={e.cx + e.ax + 1} y={SUN_Y - 1.4} fontSize="2.3" fill={C.dim} style={{ fontFamily: "monospace" }}>▶ perihelion</text>
          </>; })()}
          {/* Sun at the shared right focus */}
          <circle cx={SUN_X} cy={SUN_Y} r="7.5" fill="none" stroke={C.gold} strokeWidth="0.5" opacity="0.4" />
          <circle cx={SUN_X} cy={SUN_Y} r="4.8" fill="#fff3b0" />
          <text x={SUN_X} y={SUN_Y + 12} fontSize="2.5" fill={C.gold} textAnchor="middle" style={{ fontFamily: "monospace" }}>SUN</text>
          {/* planets — back first; Earth largest + EA axial marker; depth-scaled */}
          {drawOrder.map(({ p, x, y, depth }) => {
            const on = p.id === selId;
            const dscale = 0.82 + 0.34 * ((depth + 1) / 2);   // front bigger, back smaller
            const r = p.dot * dscale, op = 0.6 + 0.4 * ((depth + 1) / 2);
            return (
              <g key={p.id} data-planet data-planet-id={p.id} onClick={() => setSelId(p.id)} style={{ cursor: "pointer" }} opacity={op}>
                <circle cx={x} cy={y} r={Math.max(4, r + 2.5)} fill="transparent" />
                {on && <circle cx={x} cy={y} r={r + 2} fill="none" stroke="#fff" strokeWidth="0.4" />}
                <circle cx={x} cy={y} r={r} fill={p.color} stroke={on ? "#fff" : "none"} strokeWidth="0.3" />
                {p.id === "earth" && (() => { const a = 23.4 * DEG, L = r + 2.2; return <line x1={x - Math.sin(a) * L} y1={y - Math.cos(a) * L} x2={x + Math.sin(a) * L} y2={y + Math.cos(a) * L} stroke="#fff" strokeWidth="0.35" opacity="0.75" />; })()}
                <text x={x} y={y - r - 1.2} fontSize="2.3" fill={on ? "#fff" : p.color} textAnchor="middle" style={{ fontFamily: "monospace" }}>{p.name}</text>
              </g>
            );
          })}
        </svg>
        </div>
        {/* controls: HU scrubber + SA tilt */}
        <div className="mt-1 grid grid-cols-1 gap-x-3 gap-y-0.5 text-[9px] sm:grid-cols-2">
          <label className="flex items-center gap-2" style={{ color: C.dim }}>HU
            <input data-hu-input type="range" min={0} max={3600} step={1} value={hu} onChange={(e) => setHu(+e.target.value)} className="flex-1" />
            <span className="tabular-nums" style={{ color: C.cyan }}>{fmt3600(hu)}</span>
          </label>
          <label className="flex items-center gap-2" style={{ color: C.dim }}>SA tilt
            <input data-tilt-input type="range" min={8} max={42} step={1} value={tiltDeg} onChange={(e) => setTiltDeg(+e.target.value)} className="flex-1" />
            <span className="tabular-nums" style={{ color: C.violet }}>{tiltDeg}°</span>
          </label>
        </div>
        <div className="text-[8px]" style={{ color: C.dim }}>Full orbit reference · <span style={{ color: C.gold }}>{FULL_ORBIT}</span> (SA.EA..HU)</div>
      </div>

      {/* CLICKED PLANET → Base-3600 coordinates (voxel-style) */}
      <div data-ucrs-readout className="space-y-1 rounded-lg border p-3 text-[10px]" style={{ borderColor: sel.p.color, background: C.panel }}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ color: sel.p.color }}>◉ {sel.p.name}</span>
          <span className="text-[9px]" style={{ color: C.dim }}>UCRS-2525</span>
        </div>
        <div data-ucrs-coord className="rounded border px-1.5 py-1 text-[10px]" style={{ borderColor: C.border, fontFamily: "monospace", color: C.gold }}>
          SA.EA..HU = 0.0..0 · {sel.p.ea === "—" ? "—" : `${sel.p.ea}..0`} · {fmt3600(sel.effHu)}
        </div>
        <div style={{ fontFamily: "monospace" }}>
          <div><span style={{ color: C.dim }}>SR:</span> <span style={{ color: C.cyan }}>{fmtMeters(rd.sr)}</span></div>
          <div><span style={{ color: C.dim }}>SP-OTU:</span> <span style={{ color: C.text }}>{rd.spotu.toFixed(4)}</span> · <span style={{ color: C.dim }}>RTU:</span> <span style={{ color: C.text }}>{rd.rtu}</span></div>
          <div><span style={{ color: C.dim }}>LTU:</span> <span style={{ color: C.text }}>{rd.ltu.toLocaleString()} s</span></div>
        </div>
        <div className="border-t pt-1 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>
          <div><span style={{ color: C.green }}>Perihelion ▶</span> {fmtMeters(rd.peri)}</div>
          <div><span style={{ color: C.violet }}>◀ Aphelion</span> {fmtMeters(rd.aphe)}</div>
          <div>Period {sel.p.tDays.toLocaleString()} d · a {sel.p.aAU} AU · e {sel.p.e}</div>
        </div>
        <div className="text-[8px]" style={{ color: C.dim }}>Tilted ellipsoid (SA) · aphelion left / perihelion right · HU 0=perihelion, 1800=aphelion, 3600=full orbit. Deterministic → replayable.</div>
      </div>
    </div>
  );
}
