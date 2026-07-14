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
  fmtDist, fmtTime, fmtRotation, DIST_UNITS, DIST_LABEL, TIME_UNITS, TIME_LABEL, SATURN_RING_TEX,
  SIZE_MODES, SIZE_LABEL, type DistUnit, type TimeUnit, type PlanetSizeMode,
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
  year = 2025, doy = 172, hour = 12, onYear, onDoy,
}: {
  lat?: number; lon?: number;
  year?: number; doy?: number; hour?: number;                 // date/time lifted from SUN·SKY so the Sky Dome stays synced
  onYear?: (n: number | ((p: number) => number)) => void;
  onDoy?: (n: number | ((p: number) => number)) => void;
} = {}) {
  // Default location: Pfield · Pflugerville, TX (shared with the Sky Dome / view-from-location).
  const setYear = useMemo(() => onYear ?? (() => {}), [onYear]);
  const setDoy = useMemo(() => onDoy ?? (() => {}), [onDoy]);
  const [hu, setHu] = useState(0);
  const [selId, setSelId] = useState("earth");
  const [tiltDeg, setTiltDeg] = useState(26);       // SA — orbital-plane elevation
  const [sizeMode, setSizeMode] = useState<PlanetSizeMode>("proportional"); // planet dot sizing — cycled via the header text
  const cycleSize = () => setSizeMode((m) => SIZE_MODES[(SIZE_MODES.indexOf(m) + 1) % SIZE_MODES.length]);
  const [distUnit, setDistUnit] = useState<DistUnit>("km"); // Units of Measure — distance (⚙ panel)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("days"); // Units of Measure — time (⚙ panel)
  const [showDetail, setShowDetail] = useState(false);       // ⚙ units & detail — collapsed by default (declutter)
  const [max, setMax] = useState(false);            // maximize → full-screen big map (zoom to an orbit, rotate)
  const [periTop, setPeriTop] = useState(false);    // clock icon → rotate the big map so perihelion + planet are at TOP
  const [playing, setPlaying] = useState(false);
  const isoDate = new Date(Date.UTC(year, 0, doy)).toISOString().slice(0, 10);
  const setFromDate = (iso: string) => { const d = new Date(iso + "T00:00:00Z"); if (isNaN(d.getTime())) return; setYear(d.getUTCFullYear()); setDoy(Math.round((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000)); };
  const monthDay = new Date(year, 0, doy).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  // PLAY: run exactly ONE full axial rotation of the selected body, then auto-stop. playT ramps 0→1 over
  // a fixed preview; the selected planet's globe spins 360° in its ACCURATE direction (retrograde = −1),
  // and (Earth) the Moon advances the 13.18° it really covers in 24 h. Deterministic preview → resets to 0.
  const [playT, setPlayT] = useState(0);
  const raf = useRef<number | null>(null);
  const playStart = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) { setPlayT(0); playStart.current = null; return; }
    const DURATION = 6000;
    const tick = (ts: number) => {
      if (playStart.current == null) playStart.current = ts;
      const t = Math.min(1, (ts - playStart.current) / DURATION);
      setPlayT(t);
      if (t >= 1) { setPlaying(false); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current != null) cancelAnimationFrame(raf.current); playStart.current = null; };
  }, [playing]);
  const spinDir = Math.sign(PLANETS.find((p) => p.id === selId)?.rotDays ?? 1) || 1;
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
  // view transform (pan · zoom · gesture-rotate about the Sun). In clock/top-down mode perihelion is already
  // rendered at the top natively (upright labels + uniform planet sizes), so no extra spin is added here.
  const vt = `translate(${view.tx} ${view.ty}) translate(${SUN_X} ${SUN_Y}) scale(${view.zoom}) rotate(${view.rot}) translate(${-SUN_X} ${-SUN_Y})`;
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
  // ACCURATE ORBITAL RATES: HU 0→3600 = ONE orbit of the SELECTED planet. That maps to elapsed days via the
  // selected planet's period (tDays, perihelion→perihelion); every other planet advances by elapsed/tDays → the
  // real relative speeds (Mercury laps ~248× per Pluto orbit). A fixed per-planet phase gives the initial spread.
  const laid = useMemo(() => {
    const tElapsed = (hu / 3600) * PLANETS[selIdx].tDays;  // days since the selected planet was at perihelion
    return PLANETS.map((p, i) => {
      const ax = axTrue(p.aAU);                       // TRUE-SCALE (log-radius real proportions) — single view
      const ry = ax * bOverA(p.e) * sinE;             // foreshortened minor axis (the tilt)
      const cx = SUN_X - ax * p.e;                    // Sun sits at the right focus
      const effHu = (((i - selIdx) * 400 + (tElapsed / p.tDays) * 3600) % 3600 + 3600) % 3600; // accurate rate
      const nu = huToNu(effHu) * DEG;
      const x = cx + ax * Math.cos(nu), y = SUN_Y + ry * Math.sin(nu);
      const depth = Math.sin(nu);                     // +front / −back
      return { p, i, ax, ry, cx, effHu, x, y, depth };
    });
  }, [hu, sinE, selIdx]);

  const sel = laid.find((l) => l.p.id === selId) || laid[2];
  const rd = ucrsAt(sel.p, sel.effHu);
  const drawOrder = [...laid].sort((a, b) => a.depth - b.depth); // back planets first

  return (
    <div className={max ? "fixed inset-0 z-[80] flex flex-col gap-2 overflow-hidden p-2" : "grid gap-3 lg:grid-cols-[1fr_272px]"} style={max ? { background: "#05070d" } : undefined}>
      <div className={max ? "flex min-h-0 flex-1 flex-col rounded-lg border p-2" : "rounded-lg border p-2"} style={{ borderColor: C.border, background: C.panel }}>
        {/* HEADER BAR (Security-2525 mission-control): title · size-mode cycler · minimize/maximize */}
        <div className="mb-1 flex items-center justify-between gap-1 text-[9px]">
          <span className="font-bold tracking-wider" style={{ color: C.violet }}>UCRS-2525 · BASE-3600 CELESTIAL MAP</span>
          <div className="flex items-center gap-1">
            <button data-size-cycle data-size-mode={sizeMode} onClick={cycleSize} title="Cycle planet size: True Scale (vs Sun) → Proportional (vs planets) → Exaggerated"
              className="rounded border px-1.5 py-0.5 text-[8px] uppercase tracking-wider" style={{ borderColor: C.border, color: C.gold }}>{SIZE_LABEL[sizeMode]}</button>
            <button data-cel-max onClick={() => setMax((v) => !v)} title={max ? "Minimize" : "Expand map"} aria-label={max ? "Minimize" : "Maximize"}
              className="flex items-center justify-center rounded border p-1" style={{ borderColor: max ? C.cyan : C.border, color: max ? C.cyan : C.dim }}>
              {max ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
          </div>
        </div>
        <div className={max ? "relative min-h-0 flex-1" : "relative"}>
        {/* PHASE CLOCK — the only top-right map overlay (top-down toggle). */}
        <div className="absolute right-1 top-1 z-10">
          <PhaseClock items={laid.map((l) => ({ id: l.p.id, name: l.p.name, color: l.p.color, effHu: l.effHu, idx: l.i }))} selId={selId} overhead={periTop} onToggle={() => setPeriTop((v) => !v)} />
        </div>
        {/* bottom-right — the SELECTED body as a DRAGGABLE 3D globe (Security-2525 globe interaction).
            Earth = real land/ocean globe (spins with time-of-day) + the Moon beside it; any other planet =
            a procedural 3D sphere (bands / craters / Saturn's rings). Drag L/R to rotate · no zoom. */}
        <div className="absolute bottom-1 right-1 z-10">
          <MiniPanel title={selId === "earth" ? "EARTH · MOON" : sel.p.name.toUpperCase()} subtitle={fmtDist(rd.sr, distUnit)} rotation={fmtRotation(sel.p.rotDays)} coord={`SA.EA..HU ${fmt3600(sel.effHu)}`}
            render={(cs) => selId === "earth"
              ? <EarthMoonBox lat={lat} lon={lon} year={year} doy={doy} hour={hour} size={cs} color={C.gold} bare playT={playT} />
              : <TexturedGlobe src={sel.p.tex} size={cs} ring={sel.p.rings ? SATURN_RING_TEX : null} spinDeg={playT * 360 * spinDir} />}
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
          {periTop ? (
          <g data-overhead-view>
            {/* TOP-DOWN CLOCK VIEW — looking straight down the orbital plane: near-circular orbits, UNIFORM
                planet sizes all the way around (perihelion→aphelion), upright labels. Perihelion ▲ at top. */}
            {laid.map(({ p, effHu }) => {
              const A = axTrue(p.aAU) * 0.5, e2 = p.e, rx = A * bOverA(e2), cyo = SUN_Y + A * e2;
              const phi = huToNu(effHu) * DEG, rr = A * (1 - e2 * e2) / (1 + e2 * Math.cos(phi));
              const x = SUN_X + rr * Math.sin(phi), y = SUN_Y - rr * Math.cos(phi); // phi 0 → perihelion at top
              const on = p.id === selId, dot = planetDotRadius(p, sizeMode);
              return (
                <g key={`ov${p.id}`}>
                  <ellipse data-orbit cx={SUN_X} cy={cyo} rx={rx} ry={A} fill="none" stroke={p.color} strokeWidth="0.32" strokeDasharray="0.9 1.1" opacity="0.55" />
                  <circle cx={SUN_X} cy={SUN_Y - A * (1 - e2)} r="0.7" fill={p.color} />{/* perihelion — top */}
                  <circle cx={SUN_X} cy={SUN_Y + A * (1 + e2)} r="0.7" fill="none" stroke={p.color} strokeWidth="0.3" />{/* aphelion — bottom */}
                  <g data-planet data-planet-id={p.id} onPointerDown={(ev) => ev.stopPropagation()} onClick={() => select(p.id)} style={{ cursor: "pointer" }}>
                    <circle cx={x} cy={y} r={Math.max(4, dot + 2.5)} fill="transparent" />
                    {on && <circle cx={x} cy={y} r={dot + 2} fill="none" stroke="#fff" strokeWidth="0.4" />}
                    {p.rings && <ellipse cx={x} cy={y} rx={dot + 1.6} ry={dot + 1.6} fill="none" stroke={p.color} strokeWidth="0.3" opacity="0.8" />}
                    <circle cx={x} cy={y} r={dot} fill={p.color} stroke={on ? "#fff" : "none"} strokeWidth="0.3" />
                    <text x={x} y={y - dot - 1.2} fontSize="2.3" fill={on ? "#fff" : p.color} textAnchor="middle" style={{ fontFamily: "monospace" }}>{p.name}</text>
                  </g>
                </g>
              );
            })}
            <circle cx={SUN_X} cy={SUN_Y} r="7.5" fill="none" stroke={C.gold} strokeWidth="0.5" opacity="0.4" />
            <circle cx={SUN_X} cy={SUN_Y} r="4.8" fill="#fff3b0" />
            <text x={SUN_X} y={SUN_Y + 11} fontSize="2.5" fill={C.gold} textAnchor="middle" style={{ fontFamily: "monospace" }}>SUN</text>
            <text x={SUN_X} y={8} fontSize="3" fill={C.green} textAnchor="middle" fontWeight="bold" style={{ fontFamily: "monospace" }}>PERIHELION ▲</text>
            <text x={SUN_X} y={110} fontSize="3" fill={C.violet} textAnchor="middle" fontWeight="bold" style={{ fontFamily: "monospace" }}>▼ APHELION</text>
          </g>
          ) : (<>
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
            const r = planetDotRadius(p, sizeMode) * dscale, op = 0.6 + 0.4 * ((depth + 1) / 2);
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
          </>)}
          </g>
        </svg>
        </div>
        {/* controls: HU orbit scrubber (SA tilt + Planet Size + Units now live behind ⚙ in the readout) */}
        <label className="mt-1 flex items-center gap-2 text-[9px]" style={{ color: C.dim }}>HU
          <input data-hu-input type="range" min={0} max={3600} step={1} value={hu} onChange={(e) => setHu(+e.target.value)} className="flex-1" />
          <span className="tabular-nums" style={{ color: C.cyan }}>{fmt3600(hu)}</span>
        </label>
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

      {/* SELECTED BODY — MINIMAL readout on-screen; the Base-3600 detail + Units of Measure live behind ⚙.
          Hidden in full-screen big-map mode. */}
      <div data-ucrs-readout className={`space-y-1 rounded-lg border p-3 text-[10px] ${max ? "hidden" : ""}`} style={{ borderColor: sel.p.color, background: C.panel }}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ color: sel.p.color }}>◉ {sel.p.name}</span>
          <button data-cel-detail onClick={() => setShowDetail((v) => !v)} className="rounded border px-1.5 py-0.5 text-[8px]" style={{ borderColor: C.border, color: showDetail ? C.violet : C.dim }} title="Units of Measure & Base-3600 detail">⚙ {showDetail ? "less" : "units · detail"}</button>
        </div>
        {/* minimal: UCRS coord · distance (in chosen UoM) · orbit position · rotation */}
        <div data-ucrs-coord className="rounded border px-1.5 py-0.5 text-[10px]" style={{ borderColor: C.border, fontFamily: "monospace", color: C.gold }}>
          SA.EA..HU = 0.0..0 · {sel.p.ea === "—" ? "—" : `${sel.p.ea}..0`} · {fmt3600(sel.effHu)}
        </div>
        <div style={{ fontFamily: "monospace" }}>
          <div><span style={{ color: C.dim }}>Distance</span> <span data-ucrs-dist className="tabular-nums" style={{ color: C.cyan }}>{fmtDist(rd.sr, distUnit)}</span></div>
          <div><span style={{ color: C.dim }}>Orbit pos</span> <span className="tabular-nums" style={{ color: C.text }}>{Math.round(sel.effHu)}/3600</span> <span style={{ color: C.dim }}>· ⟳ {fmtRotation(sel.p.rotDays)}</span></div>
        </div>
        {/* ⚙ UNITS & DETAIL — collapsed by default */}
        {showDetail && (
          <div data-cel-detail-panel className="space-y-1 border-t pt-1 text-[9px]" style={{ borderColor: C.border }}>
            <div className="flex flex-wrap items-center gap-1">
              <span className="w-12 shrink-0" style={{ color: C.dim }}>Distance</span>
              {DIST_UNITS.map((u) => <button key={u} data-dist-unit={u} onClick={() => setDistUnit(u)} className="rounded border px-1 py-0.5 text-[8px]" style={{ borderColor: C.border, color: distUnit === u ? C.cyan : C.dim, background: distUnit === u ? "#0c2230" : "transparent" }}>{DIST_LABEL[u]}</button>)}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="w-12 shrink-0" style={{ color: C.dim }}>Time</span>
              {TIME_UNITS.map((u) => <button key={u} data-time-unit={u} onClick={() => setTimeUnit(u)} className="rounded border px-1 py-0.5 text-[8px]" style={{ borderColor: C.border, color: timeUnit === u ? C.violet : C.dim, background: timeUnit === u ? "#221833" : "transparent" }}>{TIME_LABEL[u]}</button>)}
            </div>
            <label className="flex items-center gap-2" style={{ color: C.dim }}>SA tilt
              <input data-tilt-input type="range" min={8} max={42} step={1} value={tiltDeg} onChange={(e) => setTiltDeg(+e.target.value)} className="flex-1" />
              <span className="tabular-nums" style={{ color: C.violet }}>{tiltDeg}°</span>
            </label>
            <div className="border-t pt-1" style={{ borderColor: C.border, fontFamily: "monospace" }}>
              <div><span style={{ color: C.dim }}>SP-OTU</span> {rd.spotu.toFixed(4)} · <span style={{ color: C.dim }}>RTU</span> {rd.rtu} · <span style={{ color: C.dim }}>elapsed</span> {fmtTime(rd.ltu, timeUnit)}</div>
              <div><span style={{ color: C.green }}>Perihelion ▶</span> {fmtDist(rd.peri, distUnit)}</div>
              <div><span style={{ color: C.violet }}>◀ Aphelion</span> {fmtDist(rd.aphe, distUnit)}</div>
              <div style={{ color: C.dim }}>Period {sel.p.tDays.toLocaleString()} d · a {sel.p.aAU} AU · e {sel.p.e}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
