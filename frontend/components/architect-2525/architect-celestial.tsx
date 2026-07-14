"use client";

/**
 * ARCHITECT-2525 · UCRS-2525 Celestial Map (Design → Solar System).
 * ================================================================
 * A landscape solar-system view for SUN·SKY: every planet on a dotted elliptical orbit, aphelion LEFT and
 * perihelion RIGHT (Sun at the right focus), coloured across the 13-Trinity spectrum (Mercury red → Neptune
 * violet → Pluto ultraviolet). Earth is drawn largest (the reference/home planet). Click any planet and its
 * Base-3600 UCRS-2525 coordinates appear — the same "read the coordinate on click" pattern as the voxel.
 * The HU scrubber (0 → 3600.3600..3600) advances every planet along its orbit. Driven by lib/ucrs-2525.ts.
 */
import { useMemo, useState } from "react";
import { PLANETS, ucrsAt, huToNu, fmt3600, FULL_ORBIT, fmtMeters, type Planet } from "@/lib/ucrs-2525";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };

// Landscape schematic: Sun at the right focus; orbits index-spaced so all planets are visible; eccentricity
// shown horizontally (perihelion right / aphelion left), vertical is a cosmetic squash to fit the strip.
const SUN_X = 120, SUN_Y = 55, VSQUASH = 0.34;
const axFor = (i: number) => 12 + i * 7.2;

export function ArchitectCelestial() {
  const [hu, setHu] = useState(0);              // global Horizontal Angular Unit (0..3600)
  const [selId, setSelId] = useState("earth");

  const laid = useMemo(() => PLANETS.map((p, i) => {
    const ax = axFor(i), ay = ax * VSQUASH, cx = SUN_X - ax * p.e;
    const effHu = (hu + i * 400) % 3600;         // spread planets around their orbits
    const phi = huToNu(effHu) * Math.PI / 180;   // angle from perihelion (right)
    const x = cx + ax * Math.cos(phi), y = SUN_Y + ay * Math.sin(phi);
    return { p, i, ax, ay, cx, effHu, x, y };
  }), [hu]);

  const sel = laid.find((l) => l.p.id === selId) || laid[2];
  const rd = ucrsAt(sel.p, sel.effHu);

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_270px]">
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 flex items-center justify-between text-[9px]">
          <span className="font-bold tracking-wider" style={{ color: C.violet }}>UCRS-2525 · BASE-3600 CELESTIAL MAP</span>
          <span style={{ color: C.dim }}>◀ aphelion · perihelion ▶ · click a planet</span>
        </div>
        <svg data-arch-celestial viewBox="0 0 240 110" preserveAspectRatio="xMidYMid meet" className="w-full rounded" style={{ background: "radial-gradient(circle at 50% 46%, #0a1020, #05070d)", aspectRatio: "2.2 / 1" }}>
          {/* orbits — dotted ellipses, aphelion left / perihelion right */}
          {laid.map(({ p, i, ax, ay, cx }) => (
            <g key={`o${p.id}`}>
              <ellipse data-orbit cx={cx} cy={SUN_Y} rx={ax} ry={ay} fill="none" stroke={p.color} strokeWidth="0.3" strokeDasharray="0.9 1.1" opacity="0.55" />
              {/* perihelion (right) + aphelion (left) ticks */}
              <circle cx={cx + ax} cy={SUN_Y} r="0.5" fill={p.color} opacity="0.9" />
              <circle cx={cx - ax} cy={SUN_Y} r="0.5" fill={p.color} opacity="0.5" />
            </g>
          ))}
          {/* Earth peri/aphe labels */}
          {(() => { const e = laid[2]; return <>
            <text x={e.cx - e.ax - 1} y={SUN_Y - 1.5} fontSize="2.4" fill={C.dim} textAnchor="end" style={{ fontFamily: "monospace" }}>aphelion</text>
            <text x={e.cx + e.ax + 1} y={SUN_Y - 1.5} fontSize="2.4" fill={C.dim} style={{ fontFamily: "monospace" }}>perihelion</text>
          </>; })()}
          {/* Sun at the shared right focus */}
          <circle cx={SUN_X} cy={SUN_Y} r="4.6" fill="#fff3b0" />
          <circle cx={SUN_X} cy={SUN_Y} r="7" fill="none" stroke={C.gold} strokeWidth="0.5" opacity="0.5" />
          <text x={SUN_X} y={SUN_Y + 12} fontSize="2.6" fill={C.gold} textAnchor="middle" style={{ fontFamily: "monospace" }}>SUN</text>
          {/* planets — Earth largest; click to read coordinates */}
          {laid.map(({ p, x, y }) => {
            const on = p.id === selId;
            return (
              <g key={p.id} data-planet data-planet-id={p.id} onClick={() => setSelId(p.id)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={Math.max(4, p.dot + 2.5)} fill="transparent" />{/* hit area */}
                {on && <circle cx={x} cy={y} r={p.dot + 2} fill="none" stroke="#fff" strokeWidth="0.4" />}
                <circle cx={x} cy={y} r={p.dot} fill={p.color} stroke={on ? "#fff" : "none"} strokeWidth="0.3" />
                <text x={x} y={y - p.dot - 1.2} fontSize="2.4" fill={on ? "#fff" : p.color} textAnchor="middle" style={{ fontFamily: "monospace" }}>{p.name}</text>
              </g>
            );
          })}
        </svg>
        {/* HU scrubber → 3600.3600..3600 */}
        <label className="mt-1 flex items-center gap-2 text-[10px]" style={{ color: C.dim }}>
          HU
          <input data-hu-input type="range" min={0} max={3600} step={1} value={hu} onChange={(e) => setHu(+e.target.value)} className="flex-1" />
          <span className="tabular-nums" style={{ color: C.cyan }}>{fmt3600(hu)}</span>
          <span style={{ color: C.dim }}>/ {FULL_ORBIT}</span>
        </label>
      </div>

      {/* CLICKED PLANET → Base-3600 coordinates (voxel-style read-out) */}
      <div data-ucrs-readout className="space-y-1 rounded-lg border p-3 text-[10px]" style={{ borderColor: sel.p.color, background: C.panel }}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ color: sel.p.color }}>◉ {sel.p.name}</span>
          <span className="text-[9px]" style={{ color: C.dim }}>UCRS-2525</span>
        </div>
        <div style={{ fontFamily: "monospace" }}>
          <div><span style={{ color: C.dim }}>SA:</span> <span style={{ color: C.text }}>0.0..0</span></div>
          <div><span style={{ color: C.dim }}>EA:</span> <span style={{ color: C.text }}>{sel.p.ea === "—" ? "—" : `${sel.p.ea}..0`}</span></div>
          <div><span style={{ color: C.dim }}>HU:</span> <span style={{ color: C.gold }}>{fmt3600(sel.effHu)}</span></div>
        </div>
        <div className="border-t pt-1" style={{ borderColor: C.border, fontFamily: "monospace" }}>
          <div><span style={{ color: C.dim }}>SR:</span> <span style={{ color: C.cyan }}>{fmtMeters(rd.sr)}</span></div>
          <div><span style={{ color: C.dim }}>SP-OTU:</span> <span style={{ color: C.text }}>{rd.spotu.toFixed(4)}</span> · <span style={{ color: C.dim }}>RTU:</span> <span style={{ color: C.text }}>{rd.rtu}</span></div>
          <div><span style={{ color: C.dim }}>LTU:</span> <span style={{ color: C.text }}>{rd.ltu.toLocaleString()} s</span></div>
        </div>
        <div className="border-t pt-1 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>
          <div><span style={{ color: C.green }}>Perihelion ▶</span> {fmtMeters(rd.peri)}</div>
          <div><span style={{ color: C.violet }}>◀ Aphelion</span> {fmtMeters(rd.aphe)}</div>
          <div>Period {sel.p.tDays.toLocaleString()} d · a {sel.p.aAU} AU · e {sel.p.e}</div>
        </div>
        <div className="text-[8px]" style={{ color: C.dim }}>Base-3600: 1 A = 3600 B · 1 B = 3600 C. HU 0 = perihelion, 1800 = aphelion, 3600 = full orbit. Deterministic → replayable.</div>
      </div>
    </div>
  );
}
