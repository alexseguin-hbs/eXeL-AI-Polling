"use client";

/**
 * ARCHITECT-2525 · ROOM DESIGNER (#167) — the "better than Minecraft" exploded single-room editor.
 * =================================================================================================
 * Operator (IMG_7489): entering a room drops into an EXPLODED view of just that 10×10 room — a 2D
 * floor grid (1-ft cells) you design on, beside a 3D 10×10×10 isometric of the same room. Kid-simple:
 * tap a palette tool, tap a cell to place; tap a placed item to select → rotate / delete; drag to move;
 * windows & doors snap to the nearest wall. One model (lib/room-objects) drives BOTH views, live.
 */
import { useRef, useState } from "react";
import {
  Bed, Sofa, CookingPot, Utensils, Monitor, Toilet, Bath, Droplet, WashingMachine, DoorOpen,
  RectangleHorizontal, RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2, Trash2, type LucideIcon,
} from "lucide-react";
import {
  OBJECT_SPEC, OBJECT_KINDS, ROOM_GRID, placeObject, moveObject, rotateObject, removeObject, mirrorObjects,
  footprintOf, cycleVariant, VARIANTS,
  type PlacedObject, type ObjectKind,
} from "@/lib/room-objects";
import { waterRuns, sewerRuns, wiringRuns, ductRuns, electricSpecs, type MepRun } from "@/lib/mep-runs";
import { useRCoreGestures } from "./use-rcore-gestures";
import type { RoomCell } from "@/lib/room-layout";

const C = { border: "#1e2b3a", panel: "#0c1420", dim: "#5f7186", text: "#c8d6e5", cyan: "#19c8cf", gold: "#ffd400", violet: "#c084fc" };
const N = ROOM_GRID; // 10

// Our own iconology (no emojis, operator's standing rule) — one lucide glyph per object kind.
const ICON: Record<ObjectKind, LucideIcon> = {
  bed: Bed, sofa: Sofa, counter: CookingPot, table: Utensils, desk: Monitor,
  toilet: Toilet, tub: Bath, sink: Droplet, washer: WashingMachine,
  door: DoorOpen, window: RectangleHorizontal,
};

/** Snap a wall object (window/door) to whichever of the 4 edges is nearest the drop cell. */
function wallSnap(gx: number, gy: number): { gx: number; gy: number } {
  const dLeft = gx, dRight = N - 1 - gx, dTop = gy, dBot = N - 1 - gy;
  const m = Math.min(dLeft, dRight, dTop, dBot);
  if (m === dTop) return { gx, gy: 0 };
  if (m === dBot) return { gx, gy: N - 1 };
  if (m === dLeft) return { gx: 0, gy };
  return { gx: N - 1, gy };
}

export function RoomDesigner({ room, onChange, onBack, showWater = false, showSewer = false, showWiring = false, showDucts = false }: {
  room: RoomCell; onChange: (o: PlacedObject[]) => void; onBack: () => void;
  showWater?: boolean; showSewer?: boolean; showWiring?: boolean; showDucts?: boolean;
}) {
  const objects = room.objects ?? [];
  const [tool, setTool] = useState<ObjectKind | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<string | null>(null);
  // 2D plan orientation — rotate the floor plan (North compass, Mission-Planning parity). Placement inverts this
  // so a tap always lands in the true cell regardless of rotation. Mirror is a DATA op (mirrorObjects), not here.
  const [bearing2d, setBearing2d] = useState(0); // degrees, 0 = North up
  const rot2d = (d: number) => setBearing2d((b) => ((b + d) % 360 + 360) % 360);

  // ── 3D CAMERA — the shared Vision-2525 R-Core interaction model (identical to Mission-Planning): LEFT-drag /
  // one-finger = PAN · RIGHT-drag = rotate+tilt · two fingers = pinch-zoom + twist-bearing + vertical-tilt · wheel
  // = zoom. One hook, no local re-implementation (operator: "R-Core for all areas of interaction").
  const cam = useRCoreGestures({ initialBearing: -Math.PI / 4, initialPitch: 34, initialZoom: 1,
    cfg: { minPitch: 6, maxPitch: 90, minZoom: 0.6, maxZoom: 3.2 } });
  const { bearing, pitch, zoom } = cam;
  const camReset = cam.reset;

  const cellFromEvent = (e: React.PointerEvent | React.MouseEvent): { gx: number; gy: number } | null => {
    const svg = svgRef.current; if (!svg) return null;
    const r = svg.getBoundingClientRect();
    // Screen → viewBox (0..100, square so linear), then UNDO the plan rotation about the centre (50,50).
    const vx = ((e.clientX - r.left) / r.width) * 100;
    const vy = ((e.clientY - r.top) / r.height) * 100;
    const th = (bearing2d * Math.PI) / 180, cs = Math.cos(th), sn = Math.sin(th);
    const dx = vx - 50, dy = vy - 50;
    const lx = 50 + (dx * cs + dy * sn);   // inverse rotation (−θ)
    const ly = 50 + (-dx * sn + dy * cs);
    const gx = Math.floor(lx / 10), gy = Math.floor(ly / 10);
    if (gx < 0 || gx >= N || gy < 0 || gy >= N) return null;
    return { gx, gy };
  };

  const placeAt = (gx: number, gy: number) => {
    if (!tool) return;
    const p = OBJECT_SPEC[tool].onWall ? wallSnap(gx, gy) : { gx, gy };
    onChange(placeObject(objects, tool, p.gx, p.gy));
  };
  const objDown = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation(); drag.current = id; setSelId(id);
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
  };
  const svgMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const c = cellFromEvent(e); if (!c) return;
    const o = objects.find((x) => x.id === drag.current); if (!o) return;
    const p = OBJECT_SPEC[o.kind].onWall ? wallSnap(c.gx, c.gy) : c;
    if (p.gx !== o.gx || p.gy !== o.gy) onChange(moveObject(objects, o.id, p.gx, p.gy));
  };
  const svgUp = () => { drag.current = null; };
  const bgClick = (e: React.MouseEvent) => { const c = cellFromEvent(e); if (c) placeAt(c.gx, c.gy); };

  const sel = objects.find((o) => o.id === selId) || null;

  // ── 3D voxel projection (10×10×10) — orbit(bearing)+tilt(pitch)+zoom around the room centre. ──
  // World (x,y,z), z up. Yaw about z, then tilt: screenY = worldY·sin(φ) − z·cos(φ) (φ=90° → top-down plan).
  const U = 8, OX = 130, OY = 110;           // unit px + viewBox centre (260×220)
  const cx = N / 2, cy = N / 2, cz = N / 2;  // orbit pivot = room centre
  const cosB = Math.cos(bearing), sinB = Math.sin(bearing);
  const phi = (pitch * Math.PI) / 180, sinP = Math.sin(phi), cosP = Math.cos(phi);
  const iso = (x: number, y: number, z: number): [number, number] => {
    const dx = x - cx, dy = y - cy, dz = z - cz;
    const xw = dx * cosB - dy * sinB;
    const yw = dx * sinB + dy * cosB;
    // pan (R-Core left-drag) translates the whole scene in screen space
    return [OX + cam.pan.x + xw * U * zoom, OY + cam.pan.y + (yw * sinP - dz * cosP) * U * zoom];
  };
  const floor = [iso(0, 0, 0), iso(N, 0, 0), iso(N, N, 0), iso(0, N, 0)];
  const ceil = [iso(0, 0, N), iso(N, 0, N), iso(N, N, N), iso(0, N, N)];
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");
  // Depth-sort objects so nearer boxes draw last (painter's algorithm as the camera orbits).
  const depthKey = (gx: number, gy: number) => (gx - cx) * sinB + (gy - cy) * cosB;
  const objs3d = [...objects].sort((a, b) => depthKey(a.gx, a.gy) - depthKey(b.gx, b.gy));

  // ── MEP RUNS (P2) — draw the systems enabled in Design Settings in BOTH views; totals from lib/mep-runs. ──
  const outlets = room.outlets ?? 0;
  const water = showWater ? waterRuns(objects) : null;
  const sewer = showSewer ? sewerRuns(objects) : null;
  const wiring = showWiring ? wiringRuns(outlets) : null;
  const duct = showDucts ? ductRuns() : null;
  const eSpec = showWiring ? electricSpecs(outlets) : null;
  const MEP_COL = { water: C.cyan, sewer: "#22c55e", wiring: C.gold, duct: "#38bdf8" };
  const anyMep = !!(water || sewer || wiring || duct);
  // 2D: polyline through grid-cell centres (viewBox 0..100). 3D: same path at a system height (floor→ceiling).
  const c2 = (n: number) => n * 10 + 5;
  const run2d = (runs: MepRun[] | undefined, col: string, key: string) => runs?.map((r, i) => (
    <polyline key={`${key}${i}`} data-arch-mep2d={key} points={r.path.map((p) => `${c2(p.gx)},${c2(p.gy)}`).join(" ")}
      fill="none" stroke={col} strokeWidth={0.9} strokeDasharray="2 1.5" strokeLinecap="round" opacity={0.85} />
  ));
  const run3d = (runs: MepRun[] | undefined, col: string, z: number, key: string) => runs?.map((r, i) => (
    <polyline key={`${key}3d${i}`} data-arch-mep3d={key} points={r.path.map((p) => iso(p.gx + 0.5, p.gy + 0.5, z).join(",")).join(" ")}
      fill="none" stroke={col} strokeWidth={1} strokeDasharray="2 1.5" strokeLinecap="round" opacity={0.9} />
  ));

  return (
    <div data-arch-room-designer className="flex min-h-0 flex-1 flex-col gap-2">
      {/* header */}
      <div className="flex items-center gap-2">
        <button data-arch-roomdesign-back onClick={onBack} className="rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>← Back to house</button>
        <span className="text-[11px] font-bold" style={{ color: C.gold }}>{room.k} · {room.label}</span>
        <span className="text-[9px]" style={{ color: C.dim }}>10′×10′ · tap a tool, tap the floor</span>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row">
        {/* 2D interactive floor — rotatable (North compass) + mirror; placement inverts the rotation */}
        <div className="relative w-full lg:w-1/2">
          <svg ref={svgRef} data-arch-roomdesign-2d viewBox="0 0 100 100" className="w-full rounded border" style={{ borderColor: C.cyan, background: "#070b12", aspectRatio: "1 / 1", touchAction: "none" }}
            onPointerMove={svgMove} onPointerUp={svgUp} onPointerCancel={svgUp}>
            <g data-arch-roomdesign-2d-rot transform={`rotate(${bearing2d} 50 50)`}>
            {/* 1-ft grid */}
            {Array.from({ length: N + 1 }).map((_, i) => (
              <g key={i}>
                <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke={`${C.cyan}22`} strokeWidth={0.4} />
                <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke={`${C.cyan}22`} strokeWidth={0.4} />
              </g>
            ))}
            {/* click target (place) */}
            <rect x={0} y={0} width={100} height={100} fill="transparent" onClick={bgClick} style={{ cursor: tool ? "copy" : "default" }} />
            {/* room walls */}
            <rect x={1} y={1} width={98} height={98} fill="none" stroke={C.violet} strokeWidth={1.2} />
            {/* MEP runs (enabled systems) — drawn under the furniture so objects stay tappable */}
            {run2d(water?.runs, MEP_COL.water, "water")}
            {run2d(sewer?.runs, MEP_COL.sewer, "sewer")}
            {run2d(wiring?.runs, MEP_COL.wiring, "wiring")}
            {run2d(duct?.runs, MEP_COL.duct, "duct")}
            {/* placed objects */}
            {objects.map((o) => {
              const s = OBJECT_SPEC[o.kind];
              const { w, d } = footprintOf(o); // footprint in ft (variant-aware; rotation applied via SVG transform below)
              const cx = o.gx * 10 + 5, cy = o.gy * 10 + 5;
              const on = o.id === selId;
              const Icon = ICON[o.kind];
              return (
                <g key={o.id} data-arch-roomobj={o.kind} transform={`rotate(${o.rot} ${cx} ${cy})`} style={{ cursor: "grab" }} onPointerDown={objDown(o.id)}>
                  <rect x={cx - w * 5} y={cy - d * 5} width={w * 10} height={d * 10} rx={1.5}
                    fill={`${s.color}${on ? "55" : "2e"}`} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.4 : 0.8} />
                  <foreignObject x={cx - 4} y={cy - 4} width={8} height={8} style={{ pointerEvents: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 8, height: 8 }}>
                      <Icon style={{ width: 6, height: 6, color: on ? C.gold : s.color }} />
                    </div>
                  </foreignObject>
                </g>
              );
            })}
            </g>
          </svg>
          {/* 2D compass (rotates with the plan) + rotate + mirror controls — Mission-Planning parity */}
          <div data-arch-roomdesign-2d-compass className="pointer-events-none absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: `${C.cyan}66`, background: "#0a0f16cc" }}>
            <span style={{ display: "inline-block", transform: `rotate(${-bearing2d}deg)`, color: C.cyan, fontSize: 9, fontWeight: 800 }}>N↑</span>
          </div>
          <div className="absolute right-1.5 top-1.5 flex gap-1">
            <button data-arch-2d-rotccw onClick={() => rot2d(-15)} title="Rotate plan left" className="rounded border p-0.5" style={{ borderColor: C.border, background: "#0a0f16cc", color: C.cyan }}><RotateCcw className="h-3 w-3" /></button>
            <button data-arch-2d-rotcw onClick={() => rot2d(15)} title="Rotate plan right" className="rounded border p-0.5" style={{ borderColor: C.border, background: "#0a0f16cc", color: C.cyan }}><RotateCw className="h-3 w-3" /></button>
            <button data-arch-2d-mirrorh onClick={() => onChange(mirrorObjects(objects, "h"))} title="Mirror left↔right" className="rounded border p-0.5" style={{ borderColor: C.border, background: "#0a0f16cc", color: C.violet }}><FlipHorizontal2 className="h-3 w-3" /></button>
            <button data-arch-2d-mirrorv onClick={() => onChange(mirrorObjects(objects, "v"))} title="Mirror top↔bottom" className="rounded border p-0.5" style={{ borderColor: C.border, background: "#0a0f16cc", color: C.violet }}><FlipVertical2 className="h-3 w-3" /></button>
          </div>
          {bearing2d !== 0 && <button data-arch-2d-north onClick={() => setBearing2d(0)} className="absolute bottom-1 left-1.5 rounded border px-1.5 py-0.5 text-[8px]" style={{ borderColor: C.border, background: "#0a0f16cc", color: C.dim }}>North</button>}
        </div>

        {/* 3D voxel mirror — orbit/tilt/pinch (Mission-Planning parity) */}
        <div className="relative w-full lg:w-1/2">
          <svg data-arch-roomdesign-3d viewBox="0 0 260 220" className="w-full rounded border"
            style={{ borderColor: C.cyan, background: "#070b12", aspectRatio: "1 / 1", touchAction: "none", cursor: "grab" }}
            {...cam.handlers} onPointerLeave={cam.handlers.onPointerUp}>
            <polygon points={poly(floor)} fill={`${C.cyan}12`} stroke={`${C.cyan}66`} strokeWidth={1} />
            {[0, 1, 2, 3].map((i) => <line key={i} x1={floor[i][0]} y1={floor[i][1]} x2={ceil[i][0]} y2={ceil[i][1]} stroke={`${C.cyan}44`} strokeWidth={0.8} />)}
            <polygon points={poly(ceil)} fill="none" stroke={`${C.cyan}33`} strokeWidth={0.7} />
            {/* objects as extruded footprints (top face lifted by object height), depth-sorted for the orbit */}
            {objs3d.map((o) => {
              const s = OBJECT_SPEC[o.kind];
              const fp = footprintOf(o);
              const swap = o.rot === 90 || o.rot === 270;
              const w = swap ? fp.d : fp.w, d = swap ? fp.w : fp.d, hgt = Math.max(2, Math.min(7, Math.round((fp.w + fp.d) / 2)));
              const x0 = o.gx + 0.5 - w / 2, y0 = o.gy + 0.5 - d / 2;
              const base = [iso(x0, y0, 0), iso(x0 + w, y0, 0), iso(x0 + w, y0 + d, 0), iso(x0, y0 + d, 0)];
              const top = [iso(x0, y0, hgt), iso(x0 + w, y0, hgt), iso(x0 + w, y0 + d, hgt), iso(x0, y0 + d, hgt)];
              const on = o.id === selId;
              return (
                <g key={o.id} data-arch-roomobj3d={o.kind}>
                  <polygon points={poly([base[0], base[1], top[1], top[0]])} fill={`${s.color}22`} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.2 : 0.7} />
                  <polygon points={poly([base[1], base[2], top[2], top[1]])} fill={`${s.color}18`} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.2 : 0.7} />
                  <polygon points={poly(top)} fill={`${s.color}33`} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.4 : 0.8} />
                </g>
              );
            })}
            {/* MEP runs at system heights — pipes on the floor, wiring mid-wall, ducts at the ceiling */}
            {run3d(water?.runs, MEP_COL.water, 0.3, "water")}
            {run3d(sewer?.runs, MEP_COL.sewer, 0.3, "sewer")}
            {run3d(wiring?.runs, MEP_COL.wiring, 3, "wiring")}
            {run3d(duct?.runs, MEP_COL.duct, N - 0.5, "duct")}
          </svg>
          {/* NORTH compass (rotates with bearing) + reset — Mission-Planning parity chrome */}
          <div data-arch-roomdesign-compass className="pointer-events-none absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: `${C.cyan}66`, background: "#0a0f16cc" }}>
            <span style={{ display: "inline-block", transform: `rotate(${-bearing}rad)`, color: C.cyan, fontSize: 9, fontWeight: 800 }}>N↑</span>
          </div>
          <button data-arch-roomdesign-reset onClick={camReset} title="Reset view" className="absolute right-1.5 top-1.5 rounded border px-1.5 py-0.5 text-[8px]" style={{ borderColor: C.border, background: "#0a0f16cc", color: C.dim }}>Reset</button>
          <div className="pointer-events-none absolute bottom-1 left-1.5 text-[7px]" style={{ color: C.dim }}>L-drag pan · R-drag rotate/tilt · pinch/scroll zoom · 2-finger twist/tilt</div>
        </div>
      </div>

      {/* MEP length totals (operator: "sub-menu to show length of total pipe / electrical specs") — one source (lib/mep-runs) */}
      {anyMep && (
        <div data-arch-mep-readout className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded border px-2 py-1 text-[9px]" style={{ borderColor: C.border, background: "#070b12" }}>
          {water && <span data-arch-mep-water style={{ color: MEP_COL.water }}>Water {water.totalFt} ft</span>}
          {sewer && <span data-arch-mep-sewer style={{ color: MEP_COL.sewer }}>Sewer {sewer.totalFt} ft</span>}
          {wiring && eSpec && <span data-arch-mep-wire style={{ color: MEP_COL.wiring }}>Wire {eSpec.wireFt} ft · {eSpec.circuits} circ · {eSpec.amps}A</span>}
          {duct && <span data-arch-mep-duct style={{ color: MEP_COL.duct }}>Duct {duct.totalFt} ft</span>}
        </div>
      )}

      {/* palette */}
      <div data-arch-roomdesign-palette className="flex flex-wrap gap-1">
        {OBJECT_KINDS.map((k) => {
          const s = OBJECT_SPEC[k], on = tool === k, Icon = ICON[k];
          return (
            <button key={k} data-arch-tool={k} onClick={() => setTool(on ? null : k)} title={s.label}
              className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]"
              style={{ borderColor: on ? C.gold : C.border, background: on ? `${C.gold}1e` : "transparent", color: on ? C.gold : C.text }}>
              <Icon className="h-3.5 w-3.5" style={{ color: on ? C.gold : s.color }} />{s.label}
            </button>
          );
        })}
      </div>

      {/* selected-object controls + details (dims · size variant) — the "asset details" for the active element */}
      {sel && (() => {
        const SelIcon = ICON[sel.kind];
        const fp = footprintOf(sel);
        const vs = VARIANTS[sel.kind];
        const vLabel = vs?.find((v) => v.id === sel.variant)?.label;
        const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1).replace(/\.0$/, ""));
        return (
          <div data-arch-roomobj-detail className="flex flex-wrap items-center gap-2 text-[10px]" style={{ color: C.text }}>
            <span className="flex items-center gap-1" style={{ color: C.gold }}><SelIcon className="h-3.5 w-3.5" /> {vLabel ? `${vLabel} ` : ""}{OBJECT_SPEC[sel.kind].label}</span>
            <span data-arch-roomobj-dims style={{ color: C.dim }}>{fmt(fp.w)}′ × {fmt(fp.d)}′</span>
            {vs && (
              <button data-arch-roomobj-size onClick={() => onChange(cycleVariant(objects, sel.id))} className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.violet }}>
                Size: {vLabel ?? "—"} ↻
              </button>
            )}
            <button data-arch-roomobj-rotate onClick={() => onChange(rotateObject(objects, sel.id))} className="flex items-center gap-1 rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.cyan }}><RotateCw className="h-3 w-3" /> Rotate</button>
            <button data-arch-roomobj-delete onClick={() => { onChange(removeObject(objects, sel.id)); setSelId(null); }} className="flex items-center gap-1 rounded border px-2 py-0.5" style={{ borderColor: C.border, color: "#f87171" }}><Trash2 className="h-3 w-3" /> Delete</button>
            <span style={{ color: C.dim }}>· drag to move</span>
          </div>
        );
      })()}
    </div>
  );
}
