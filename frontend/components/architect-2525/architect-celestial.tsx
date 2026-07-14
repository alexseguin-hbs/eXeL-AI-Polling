"use client";

/**
 * ARCHITECT-2525 · UCRS-2525 Celestial Map v2 (Design → Solar System).
 * ===================================================================
 * A 3D tilted-plane solar-system view for SUN·SKY. Orbits are ELLIPSOID rings on a plane tilted by an
 * elevation angle (SA · star/system tilt), aphelion LEFT / perihelion RIGHT, Sun at the shared right focus.
 * Coloured across the 13-Trinity spectrum (Mercury red → Neptune violet → Pluto ultraviolet); Earth drawn
 * largest with an EA axial-tilt marker (the reference/home planet, EA 230.1584). Orbits are TRUE-SCALE
 * (log-radius real proportions). Planet Size toggles Actual ↔ Exaggerated dots. Click any planet → its
 * Base-3600 UCRS-2525 coordinates (voxel-style); the selected body shows as a draggable 3D globe (Earth +
 * Moon, or a procedural planet). HU scrubber advances all planets. Driven by lib/ucrs-2525.ts. Self-contained SVG.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Play, Pause } from "lucide-react";
import {
  PLANETS, ucrsAt, huToNu, axTrue, bOverA, fmt3600, FULL_ORBIT, planetDotRadius,
  fmtSr, fmtKm, ltuToDays, SR_UNIT_CYCLE, SATURN_RING_TEX, type SrUnit,
} from "@/lib/ucrs-2525";
import { EarthMoonBox } from "./earth-moon-box";
import { MiniPanel } from "./mini-panel";
import { TexturedGlobe } from "./textured-globe";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };
const SUN_X = 122, SUN_Y = 56, DEG = Math.PI / 180;

// PHASE CLOCK — the canonical Base-3600 view: PERIHELION at 12 o'clock, HU running clockwise (0→3600).
// Each planet sits at its HU angle; the selected planet gets a hand. Complements the landscape map.
function PhaseClock({ items, selId, overhead, onToggle }: { items: { id: string; name: string; color: string; effHu: number; idx: number }[]; selId: string; overhead: boolean; onToggle: () => void }) {
  const R = 36, cx = 50, cy = 50;
  const ang = (hu: number) => (hu / 3600) * 2 * Math.PI;                 // 0 at 12 o'clock, clockwise
  const radiusFor = (idx: number) => 12 + (idx / 8) * (R - 12);          // spacing ∝ distance from Sun (Mercury→Pluto)
  const at = (hu: number, r = R) => [cx + r * Math.sin(ang(hu)), cy - r * Math.cos(ang(hu))] as const;
  const sel = items.find((i) => i.id === selId);
  const hand = sel ? at(sel.effHu, radiusFor(sel.idx)) : null;          // line reaches the selected planet's dot
  return (
    <button data-clock-toggle onClick={onToggle} type="button"
      aria-label={overhead ? "Reset map orientation" : "Perihelion to top"} title={overhead ? "Reset map orientation" : "Rotate map — perihelion + selected planet to the top (12 o'clock)"}
      className="cursor-pointer rounded-full p-0" style={{ background: "rgba(8,12,20,0.82)", border: overhead ? "1px solid #19c8cf" : "1px solid transparent", lineHeight: 0 }}>
      <svg data-phase-clock viewBox="0 0 100 100" width={58} height={58} className="rounded-full" style={{ display: "block" }}>
        <circle cx={cx} cy={cy} r={R + 6} fill="none" stroke="#233043" strokeWidth="0.6" />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#16202e" strokeWidth="0.5" />
        {[0, 900, 1800, 2700].map((h) => { const [x1, y1] = at(h, R + 4), [x2, y2] = at(h, R); return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3f4d5f" strokeWidth="0.5" />; })}
        <text x={cx} y={cy - R - 8} fontSize="4.4" fill={C.green} textAnchor="middle" fontWeight="bold" style={{ fontFamily: "monospace" }}>PERI</text>
        <text x={cx} y={cy + R + 11} fontSize="4.4" fill={C.violet} textAnchor="middle" fontWeight="bold" style={{ fontFamily: "monospace" }}>APHE</text>
        <text x={cx + R + 3} y={cy + 1.5} fontSize="3" fill={C.dim} textAnchor="start" style={{ fontFamily: "monospace" }}>900</text>
        <text x={cx - R - 3} y={cy + 1.5} fontSize="3" fill={C.dim} textAnchor="end" style={{ fontFamily: "monospace" }}>2700</text>
        {hand ? <line x1={cx} y1={cy} x2={hand[0]} y2={hand[1]} stroke={sel!.color} strokeWidth="0.8" /> : null}
        {items.map((it) => { const [x, y] = at(it.effHu, radiusFor(it.idx)); const on = it.id === selId; return <circle key={it.id} cx={x} cy={y} r={on ? 2.2 : it.id === "earth" ? 1.8 : 1.2} fill={it.color} stroke={on ? "#fff" : "none"} strokeWidth="0.3" />; })}
        <circle cx={cx} cy={cy} r="2.2" fill="#fff3b0" />
      </svg>
    </button>
  );
}

export function ArchitectCelestial({
  lat = 30.44, lon = -97.62,
  year = 2025, doy = 172, hour = 12, onYear, onDoy, onHour,
}: {
  lat?: number; lon?: number;
  year?: number; doy?: number; hour?: number;                 // date/time lifted from SUN·SKY so the Sky Dome stays synced
  onYear?: (n: number | ((p: number) => number)) => void;
  onDoy?: (n: number | ((p: number) => number)) => void;
  onHour?: (n: number | ((p: number) => number)) => void;
} = {}) {
  // Default location: Pfield · Pflugerville, TX (shared with the Sky Dome / view-from-location).
  const setYear = useMemo(() => onYear ?? (() => {}), [onYear]);
  const setDoy = useMemo(() => onDoy ?? (() => {}), [onDoy]);
  const setHour = useMemo(() => onHour ?? (() => {}), [onHour]);
  const [hu, setHu] = useState(0);
  const [selId, setSelId] = useState("earth");
  const [tiltDeg, setTiltDeg] = useState(26);       // SA — orbital-plane elevation
  const [planetSize, setPlanetSize] = useState<"actual" | "exaggerated">("exaggerated"); // dot sizing on the map
  const [srUnit, setSrUnit] = useState<SrUnit>("m"); // SR distance unit (tap value to cycle)
  const [max, setMax] = useState(false);            // maximize → full-screen big map (zoom to an orbit, rotate)
  const [periTop, setPeriTop] = useState(false);    // clock icon → rotate the big map so perihelion + planet are at TOP
  const [playing, setPlaying] = useState(false);
  const isoDate = new Date(Date.UTC(year, 0, doy)).toISOString().slice(0, 10);
  const setFromDate = (iso: string) => { const d = new Date(iso + "T00:00:00Z"); if (isNaN(d.getTime())) return; setYear(d.getUTCFullYear()); setDoy(Math.round((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000)); };
  const monthDay = new Date(year, 0, doy).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  // PLAY: time flows → Earth spins on its axis (hour) + every planet advances along its orbit (HU).
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    const tick = () => { setHour((h) => (h + 0.14) % 24); setHu((u) => (u + 3) % 3600); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current != null) cancelAnimationFrame(raf.current); };
  }, [playing, setHour]);
  const sinE = Math.sin(tiltDeg * DEG);

  // ── GESTURE NAVIGATION — pinch-zoom + one/two-finger rotate/pan on the solar system (mirrors the
  // Security-2525 globe: 1 finger = pan, 2 fingers = pinch-zoom + twist-rotate; mouse wheel = zoom;
  // right-drag = rotate). The whole map (both tilted + overhead) rides a view transform about the Sun. ──
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ zoom: 1, tx: 0, ty: 0, rot: 0 });
  const touch = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; cx: number; cy: number; ang: number } | null>(null);
  const pan = useRef<{ x: number; y: number; btn: number } | null>(null);
  const ZMIN = 0.6, ZMAX = 6;
  const pxK = () => { const r = svgRef.current?.getBoundingClientRect(); return r && r.width ? 244 / r.width : 1; }; // client px → viewBox units
  const clampZ = (z: number) => Math.min(ZMAX, Math.max(ZMIN, z));
  const resetView = () => setView({ zoom: 1, tx: 0, ty: 0, rot: 0 });
  // periTop adds a −90° spin about the Sun so perihelion (normally at the right) — and the selected planet
  // sitting on it — swing to the TOP (12 o'clock); gesture rotation (view.rot) composes on top.
  const vt = `translate(${view.tx} ${view.ty}) translate(${SUN_X} ${SUN_Y}) scale(${view.zoom}) rotate(${view.rot + (periTop ? -90 : 0)}) translate(${-SUN_X} ${-SUN_Y})`;
  // native, non-passive wheel listener (React onWheel is passive → cannot preventDefault) — zoom about the Sun
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setView((v) => ({ ...v, zoom: clampZ(v.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)) })); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []); // single map svg (no view swap) → bind once
  const gestureHandlers = {
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "touch") {
        touch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { (e.currentTarget as SVGElement).setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
        if (touch.current.size === 2) { const [a, b] = Array.from(touch.current.values()); pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, ang: Math.atan2(b.y - a.y, b.x - a.x) }; }
        return;
      }
      pan.current = { x: e.clientX, y: e.clientY, btn: e.button };
      try { (e.currentTarget as SVGElement).setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const k = pxK();
      if (e.pointerType === "touch") {
        const prev = touch.current.get(e.pointerId); if (!prev) return;
        touch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touch.current.size >= 2 && pinch.current) {
          // two-finger: pinch = zoom, twist = rotate, midpoint drag = pan (Google-Earth style)
          const [a, b] = Array.from(touch.current.values());
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const factor = 1 + (dist / Math.max(1, pinch.current.dist) - 1) * 0.6;
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          let dAng = ang - pinch.current.ang; if (dAng > Math.PI) dAng -= 2 * Math.PI; else if (dAng < -Math.PI) dAng += 2 * Math.PI;
          const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, dcx = cx - pinch.current.cx, dcy = cy - pinch.current.cy;
          pinch.current = { dist, cx, cy, ang };
          setView((v) => ({ zoom: clampZ(v.zoom * factor), rot: v.rot + dAng * (180 / Math.PI), tx: v.tx + dcx * k, ty: v.ty + dcy * k }));
        } else if (touch.current.size === 1) {
          setView((v) => ({ ...v, tx: v.tx + (e.clientX - prev.x) * k, ty: v.ty + (e.clientY - prev.y) * k }));
        }
        return;
      }
      const d = pan.current; if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      if (d.btn === 2) setView((v) => ({ ...v, rot: v.rot + dx * 0.4 }));         // right-drag = rotate
      else setView((v) => ({ ...v, tx: v.tx + dx * k, ty: v.ty + dy * k }));      // left-drag = pan
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (e.pointerType === "touch") { touch.current.delete(e.pointerId); if (touch.current.size < 2) pinch.current = null; return; }
      pan.current = null;
    },
  };

  // Layout: each orbit is an ellipse in its plane (semi-major ax, focus offset ax·e), foreshortened vertically
  // by sin(elevation). Planet at true anomaly ν(HU); depth = sin(ν) (front > 0, back < 0).
  // Reference index = the SELECTED planet: selecting a planet places IT at perihelion (HU 0 / 12 o'clock)
  // and rotates every other planet to its relative position. (Default selection Earth → Earth at perihelion.)
  const selIdx = Math.max(0, PLANETS.findIndex((p) => p.id === selId));
  const select = (id: string) => { setSelId(id); setHu(0); }; // land the newly-selected planet at its perihelion
  const laid = useMemo(() => PLANETS.map((p, i) => {
    const ax = axTrue(p.aAU);                         // TRUE-SCALE (log-radius real proportions) — single view
    const ry = ax * bOverA(p.e) * sinE;             // foreshortened minor axis (the tilt)
    const cx = SUN_X - ax * p.e;                     // Sun sits at the right focus
    const effHu = ((hu + (i - selIdx) * 400) % 3600 + 3600) % 3600; // selected planet at HU 0 (perihelion), others relative
    const nu = huToNu(effHu) * DEG;
    const x = cx + ax * Math.cos(nu), y = SUN_Y + ry * Math.sin(nu);
    const depth = Math.sin(nu);                       // +front / −back
    return { p, i, ax, ry, cx, effHu, x, y, depth };
  }), [hu, sinE, selIdx]);

  const sel = laid.find((l) => l.p.id === selId) || laid[2];
  const rd = ucrsAt(sel.p, sel.effHu);
  const drawOrder = [...laid].sort((a, b) => a.depth - b.depth); // back planets first

  return (
    <div className={max ? "fixed inset-0 z-[80] flex flex-col gap-2 overflow-hidden p-2" : "grid gap-3 lg:grid-cols-[1fr_272px]"} style={max ? { background: "#05070d" } : undefined}>
      <div className={max ? "flex min-h-0 flex-1 flex-col rounded-lg border p-2" : "rounded-lg border p-2"} style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-[9px]">
          <span className="font-bold tracking-wider" style={{ color: C.violet }}>UCRS-2525 · BASE-3600 CELESTIAL MAP</span>
          <div className="flex items-center gap-1">
            <span className="text-[7px] uppercase tracking-wider" style={{ color: C.gold }}>True-Scale</span>
            <span className="text-[7px]" style={{ color: C.dim }}>· Planet Size</span>
            {(["actual", "exaggerated"] as const).map((m) => (
              <button key={m} data-psize-toggle data-psize={m} onClick={() => setPlanetSize(m)} className="rounded border px-1.5 py-0.5 text-[8px] capitalize"
                style={{ borderColor: C.border, color: planetSize === m ? C.violet : C.dim, background: planetSize === m ? "#221833" : "transparent" }}>{m}</button>
            ))}
            <button data-cel-max onClick={() => setMax((v) => !v)} title={max ? "Minimize" : "Maximize"} aria-label={max ? "Minimize" : "Maximize"}
              className="ml-0.5 flex items-center justify-center rounded border p-1" style={{ borderColor: max ? C.cyan : C.border, color: max ? C.cyan : C.dim }}>
              {max ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
          </div>
        </div>
        <div className={max ? "relative min-h-0 flex-1" : "relative"}>
        {/* PHASE CLOCK — upper-right: click to rotate the big map so perihelion + planet are at TOP (12 o'clock) */}
        <div className="absolute right-1 top-1 z-10">
          <PhaseClock items={laid.map((l) => ({ id: l.p.id, name: l.p.name, color: l.p.color, effHu: l.effHu, idx: l.i }))} selId={selId} overhead={periTop} onToggle={() => setPeriTop((v) => !v)} />
        </div>
        {/* bottom-right — the SELECTED body as a DRAGGABLE 3D globe (Security-2525 globe interaction).
            Earth = real land/ocean globe (spins with time-of-day) + the Moon beside it; any other planet =
            a procedural 3D sphere (bands / craters / Saturn's rings). Drag L/R to rotate · no zoom. */}
        <div className="absolute bottom-1 right-1 z-10">
          <MiniPanel title={selId === "earth" ? "EARTH · MOON" : sel.p.name.toUpperCase()} subtitle={fmtKm(rd.sr)} coord={`SA.EA..HU ${fmt3600(sel.effHu)}`}
            render={(cs) => selId === "earth"
              ? <EarthMoonBox lat={lat} lon={lon} year={year} doy={doy} hour={hour} size={cs} color={C.gold} bare />
              : <TexturedGlobe src={sel.p.tex} size={cs} ring={sel.p.rings ? SATURN_RING_TEX : null} />}
          />
        </div>
        {/* zoom / reset — pinch or wheel to zoom, drag to pan, two-finger twist (or right-drag) to rotate */}
        <div className="absolute bottom-1 left-1 z-10 flex items-center gap-1">
          <span data-cel-zoom className="rounded px-1 py-0.5 text-[8px] tabular-nums" style={{ background: "rgba(8,12,20,0.82)", color: C.cyan, fontFamily: "monospace" }}>{view.zoom.toFixed(1)}×</span>
          {(view.zoom !== 1 || view.tx !== 0 || view.ty !== 0 || view.rot !== 0) && (
            <button data-cel-reset onClick={resetView} className="rounded border px-1 py-0.5 text-[8px]" style={{ borderColor: C.border, color: C.dim, background: "rgba(8,12,20,0.82)" }}>reset</button>
          )}
        </div>
        <div className="pointer-events-none absolute left-1 top-1 z-10 text-[7px]" style={{ color: C.dim, fontFamily: "monospace" }}>pinch/scroll zoom · drag pan · twist rotate{periTop ? " · perihelion▲top" : ""}</div>
        <svg ref={svgRef} {...gestureHandlers} data-arch-celestial data-peritop={periTop ? "1" : undefined} viewBox="0 0 244 112" preserveAspectRatio="xMidYMid meet"
          className={max ? "h-full w-full touch-none select-none rounded" : "w-full touch-none select-none rounded"}
          style={{ background: "radial-gradient(circle at 50% 42%, #0b1122, #05070d)", aspectRatio: max ? undefined : "2.2 / 1", height: max ? "100%" : undefined, cursor: pan.current ? "grabbing" : "grab" }}>
          <g data-cel-view transform={vt}>
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
            const r = planetDotRadius(p, planetSize) * dscale, op = 0.6 + 0.4 * ((depth + 1) / 2);
            return (
              <g key={p.id} data-planet data-planet-id={p.id} onPointerDown={(e) => e.stopPropagation()} onClick={() => select(p.id)} style={{ cursor: "pointer" }} opacity={op}>
                <circle cx={x} cy={y} r={Math.max(4, r + 2.5)} fill="transparent" />
                {on && <circle cx={x} cy={y} r={r + 2} fill="none" stroke="#fff" strokeWidth="0.4" />}
                {p.rings && <ellipse cx={x} cy={y} rx={r + 1.6} ry={(r + 1.6) * sinE} fill="none" stroke={p.color} strokeWidth="0.3" opacity="0.8" />}
                <circle cx={x} cy={y} r={r} fill={p.color} stroke={on ? "#fff" : "none"} strokeWidth="0.3" />
                {p.id === "earth" && (() => { const a = 23.4 * DEG, L = r + 2.2; return <line x1={x - Math.sin(a) * L} y1={y - Math.cos(a) * L} x2={x + Math.sin(a) * L} y2={y + Math.cos(a) * L} stroke="#fff" strokeWidth="0.35" opacity="0.75" />; })()}
                <text x={x} y={y - r - 1.2} fontSize="2.3" fill={on ? "#fff" : p.color} textAnchor="middle" style={{ fontFamily: "monospace" }}>{p.name}</text>
              </g>
            );
          })}
          </g>
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
        {/* DATE + PLAY — select a month/day, click play: Earth rotates (time-of-day) + planets orbit */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px]" style={{ color: C.dim }}>
          <button data-cel-play onClick={() => setPlaying((p) => !p)} className="flex items-center gap-1 rounded border px-2 py-0.5 font-semibold"
            style={{ borderColor: playing ? C.gold : C.border, color: playing ? C.gold : C.dim }}>
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}{playing ? "pause" : "play"}
          </button>
          <label className="flex items-center gap-1">Date<input data-cel-date type="date" value={isoDate} onChange={(e) => setFromDate(e.target.value)} className="rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }} /></label>
          <span>{monthDay} · <span style={{ color: C.cyan }}>{hour.toFixed(1)}h</span></span>
          <span>◉ Pfield · Pflugerville TX</span>
        </div>
        <div className="text-[8px]" style={{ color: C.dim }}>Full orbit reference · <span style={{ color: C.gold }}>{FULL_ORBIT}</span> (SA.EA..HU)</div>
      </div>

      {/* CLICKED PLANET → Base-3600 coordinates (voxel-style) — hidden in full-screen big-map mode */}
      <div data-ucrs-readout className={`space-y-1 rounded-lg border p-3 text-[10px] ${max ? "hidden" : ""}`} style={{ borderColor: sel.p.color, background: C.panel }}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ color: sel.p.color }}>◉ {sel.p.name}</span>
          <span className="text-[9px]" style={{ color: C.dim }}>UCRS-2525</span>
        </div>
        <div data-ucrs-coord className="rounded border px-1.5 py-1 text-[10px]" style={{ borderColor: C.border, fontFamily: "monospace", color: C.gold }}>
          SA.EA..HU = 0.0..0 · {sel.p.ea === "—" ? "—" : `${sel.p.ea}..0`} · {fmt3600(sel.effHu)}
        </div>
        <div style={{ fontFamily: "monospace" }}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span style={{ color: C.dim }}>SR:</span>
            <button data-sr-unit onClick={() => setSrUnit((u) => SR_UNIT_CYCLE[(SR_UNIT_CYCLE.indexOf(u) + 1) % SR_UNIT_CYCLE.length])}
              className="rounded border px-1 py-0.5 tabular-nums" style={{ borderColor: C.border, color: C.cyan }} title="tap to change unit (m / ×10⁶ m / ×10⁹ m / AU)">{fmtSr(rd.sr, srUnit)}</button>
            <span className="tabular-nums" style={{ color: C.dim }}>{fmtKm(rd.sr)}</span>
          </div>
          <div><span style={{ color: C.dim }}>SP-OTU:</span> <span style={{ color: C.text }}>{rd.spotu.toFixed(4)}</span> · <span style={{ color: C.dim }}>Days:</span> <span style={{ color: C.text }}>{ltuToDays(rd.ltu).toLocaleString()} d</span></div>
          <div><span style={{ color: C.dim }}>LTU:</span> <span style={{ color: C.text }}>{rd.ltu.toLocaleString()} s</span></div>
        </div>
        <div className="border-t pt-1 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>
          <div><span style={{ color: C.green }}>Perihelion ▶</span> {fmtSr(rd.peri, srUnit)} · {fmtKm(rd.peri)}</div>
          <div><span style={{ color: C.violet }}>◀ Aphelion</span> {fmtSr(rd.aphe, srUnit)} · {fmtKm(rd.aphe)}</div>
          <div>Period {sel.p.tDays.toLocaleString()} d · a {sel.p.aAU} AU · e {sel.p.e}</div>
        </div>
        <div className="text-[8px]" style={{ color: C.dim }}>Tilted ellipsoid (SA) · aphelion left / perihelion right · HU 0=perihelion, 1800=aphelion, 3600=full orbit. Deterministic → replayable.</div>
      </div>
    </div>
  );
}
