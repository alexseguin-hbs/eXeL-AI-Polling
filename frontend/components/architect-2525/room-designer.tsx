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
  RectangleHorizontal, RotateCw, RotateCcw, Columns2, Rows2, SquareStack, Trash2,
  Archive, Lamp, Tv, Refrigerator, Flame, ShowerHead, DoorClosed, Library, Armchair, Hexagon, Triangle,
  type LucideIcon,
} from "lucide-react";
import { Compass2525 } from "./compass-2525";
import { MiniPanel } from "./mini-panel";
import { RCORE_LANES } from "@/components/security-2525/rcore";
import {
  OBJECT_SPEC, ROOM_GRID, placeObject, moveObject, rotateObject, removeObject, mirrorObjects,
  footprintOf, cycleVariant, VARIANTS, wallOf, slideAlongWall, shapePartsOf, paletteForRoom,
  type PlacedObject, type ObjectKind, type Wall, type ShapePart,
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
  // S3 context assets + structural shell
  dresser: Archive, nightstand: Lamp, tv: Tv, fridge: Refrigerator, stove: Flame,
  shower: ShowerHead, wardrobe: DoorClosed, bookshelf: Library, chair: Armchair,
  shell: Hexagon, roof: Triangle,
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
  // S1 — the wall a dragged door/window is LOCKED to, captured at grab so it SLIDES along that wall (never jumps
  // to a nearer edge mid-drag). Cleared on release. null = not dragging a wall object.
  const dragWall = useRef<Wall | null>(null);
  // S0 — layout mode: STACKED (top+bottom panes) ⇄ FLOATING (main + draggable mini). Persisted (operator IMG_7521).
  const [layoutMode, setLayoutMode] = useState<"stacked" | "floating">(() => {
    if (typeof window === "undefined") return "stacked";
    try { return localStorage.getItem("arch2525.roomLayoutMode") === "floating" ? "floating" : "stacked"; } catch { return "stacked"; }
  });
  const setLayout = (m: "stacked" | "floating") => { setLayoutMode(m); try { localStorage.setItem("arch2525.roomLayoutMode", m); } catch {} };
  // 2D plan orientation — rotate the floor plan (North compass, Mission-Planning parity). Placement inverts this
  // so a tap always lands in the true cell regardless of rotation. Mirror is a DATA op (mirrorObjects), not here.
  const [bearing2d, setBearing2d] = useState(0); // degrees, 0 = North up
  const rot2d = (d: number) => setBearing2d((b) => ((b + d) % 360 + 360) % 360);

  // ── 3D CAMERA — the shared Vision-2525 R-Core interaction model (identical to Mission-Planning): LEFT-drag /
  // one-finger = PAN · RIGHT-drag = rotate+tilt · two fingers = pinch-zoom + twist-bearing + vertical-tilt · wheel
  // = zoom. One hook, no local re-implementation (operator: "R-Core for all areas of interaction").
  const CAM_OPTS = { initialBearing: -Math.PI / 4, initialPitch: 34, initialZoom: 1, touchOrbit: true,
    cfg: { minPitch: 6, maxPitch: 90, minZoom: 0.6, maxZoom: 3.2 } } as const;
  const cam = useRCoreGestures(CAM_OPTS);   // TOP pane 3D camera (also the FLOATING main)
  const camB = useRCoreGestures(CAM_OPTS);  // BOTTOM pane 3D camera — independent angle (stacked mode)
  const camReset = cam.reset;
  // Independent 2D plan rotations: bearing2d = TOP/main (interactive); bearingB = BOTTOM pane (view echo).
  const [bearingB, setBearingB] = useState(0);
  const rotB = (d: number) => setBearingB((b) => ((b + d) % 360 + 360) % 360);
  // Each stacked pane picks its own view mode; default TOP 2D · BOTTOM 3D (operator: 2D top / 3D bottom default).
  const [bottomView, setBottomView] = useState<"2D" | "3D">("3D");

  const cellFromEvent = (e: React.PointerEvent | React.MouseEvent | React.DragEvent): { gx: number; gy: number } | null => {
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
    // S1 — lock this drag to the wall the object currently sits on, so it slides along it.
    const o = objects.find((x) => x.id === id);
    dragWall.current = o && OBJECT_SPEC[o.kind].onWall ? wallOf(o.gx, o.gy) : null;
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
  };
  const svgMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const c = cellFromEvent(e); if (!c) return;
    const o = objects.find((x) => x.id === drag.current); if (!o) return;
    // S1 — a wall object SLIDES along its captured wall (perpendicular axis pinned); everything else moves freely.
    const p = OBJECT_SPEC[o.kind].onWall ? slideAlongWall(dragWall.current ?? wallOf(c.gx, c.gy), c.gx, c.gy) : c;
    if (p.gx !== o.gx || p.gy !== o.gy) onChange(moveObject(objects, o.id, p.gx, p.gy));
  };
  const svgUp = () => { drag.current = null; dragWall.current = null; };
  const bgClick = (e: React.MouseEvent) => { const c = cellFromEvent(e); if (c) placeAt(c.gx, c.gy); };
  // Drag an asset FROM the palette and DROP it on the floor (operator IMG_7513: "drag from left on map").
  const dropOnFloor = (e: React.DragEvent) => {
    e.preventDefault();
    const k = e.dataTransfer.getData("text/plain") as ObjectKind;
    if (!(k in OBJECT_SPEC)) return;
    const c = cellFromEvent(e); if (!c) return;
    const p = OBJECT_SPEC[k].onWall ? wallSnap(c.gx, c.gy) : c;
    onChange(placeObject(objects, k, p.gx, p.gy));
  };

  const sel = objects.find((o) => o.id === selId) || null;

  const poly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");

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
  // TOP/main pane view (bottom pane uses bottomView, declared above with its own camera camB).
  const [mainView, setMainView] = useState<"2D" | "3D">("2D");
  const boxStyle = (size?: number) => ({ touchAction: "none" as const, ...(size ? { width: size, height: size } : { width: "100%" }) });
  const svgStyle = (size?: number) => (size ? { width: size, height: size } : { width: "100%", aspectRatio: "1 / 1" as const });

  // 2D floor plan. `interactive` (top/main) wires the svgRef + placement handlers; the echo (bottom pane) renders
  // read-only at its own rotation `bear`. This lets two 2D panes hold independent angles.
  const plan2D = (bear: number, setBear: (n: number) => void, interactive: boolean, size?: number) => (
    <div className="relative" style={boxStyle(size)}>
      <svg {...(interactive ? { ref: svgRef, onPointerMove: svgMove, onPointerUp: svgUp, onPointerCancel: svgUp, onPointerLeave: svgUp, onDragOver: (e: React.DragEvent) => e.preventDefault(), onDrop: dropOnFloor } : {})}
        data-arch-roomdesign-2d viewBox="0 0 100 100" className="rounded border"
        style={{ borderColor: C.cyan, background: "#070b12", touchAction: "none", ...svgStyle(size) }}>
        <g data-arch-roomdesign-2d-rot transform={`rotate(${bear} 50 50)`}>
          {Array.from({ length: N + 1 }).map((_, i) => (
            <g key={i}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke={`${C.cyan}22`} strokeWidth={0.4} />
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke={`${C.cyan}22`} strokeWidth={0.4} />
            </g>
          ))}
          {interactive && <rect x={0} y={0} width={100} height={100} fill="transparent" onClick={bgClick} style={{ cursor: tool ? "copy" : "default" }} />}
          <rect x={1} y={1} width={98} height={98} fill="none" stroke={C.violet} strokeWidth={1.2} />
          {run2d(water?.runs, MEP_COL.water, "water")}
          {run2d(sewer?.runs, MEP_COL.sewer, "sewer")}
          {run2d(wiring?.runs, MEP_COL.wiring, "wiring")}
          {run2d(duct?.runs, MEP_COL.duct, "duct")}
          {objects.map((o) => {
            const s = OBJECT_SPEC[o.kind];
            const { w, d } = footprintOf(o);
            const cx = o.gx * 10 + 5, cy = o.gy * 10 + 5;
            const on = o.id === selId;
            const Icon = ICON[o.kind];
            return (
              <g key={o.id} data-arch-roomobj={o.kind} transform={`rotate(${o.rot} ${cx} ${cy})`} style={{ cursor: interactive ? "grab" : "default" }} onPointerDown={interactive ? objDown(o.id) : undefined}>
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
      <Compass2525 bearing={(bear * Math.PI) / 180} onNorth={() => setBear(0)} size={26} className="absolute left-1.5 top-1.5 border" style={{ borderColor: `${C.cyan}66` }} />
    </div>
  );

  // 3D voxel — self-contained projection from the PASSED camera, so top + bottom panes hold independent angles.
  const voxel3D = (vcam: ReturnType<typeof useRCoreGestures>, size?: number) => {
    const U = 8, OX = 130, OY = 110, cx = N / 2, cy = N / 2, cz = N / 2;
    const cosB = Math.cos(vcam.bearing), sinB = Math.sin(vcam.bearing);
    const phi = (vcam.pitch * Math.PI) / 180, sinP = Math.sin(phi), cosP = Math.cos(phi);
    const iso = (x: number, y: number, z: number): [number, number] => {
      const dx = x - cx, dy = y - cy, dz = z - cz;
      const xw = dx * cosB - dy * sinB, yw = dx * sinB + dy * cosB;
      return [OX + vcam.pan.x + xw * U * vcam.zoom, OY + vcam.pan.y + (yw * sinP - dz * cosP) * U * vcam.zoom];
    };
    const floor = [iso(0, 0, 0), iso(N, 0, 0), iso(N, N, 0), iso(0, N, 0)];
    const ceil = [iso(0, 0, N), iso(N, 0, N), iso(N, N, N), iso(0, N, N)];
    const depthKey = (gx: number, gy: number) => (gx - cx) * sinB + (gy - cy) * cosB;
    const objs = [...objects].sort((a, b) => depthKey(a.gx, a.gy) - depthKey(b.gx, b.gy));
    const r3 = (runs: MepRun[] | undefined, col: string, z: number, key: string) => runs?.map((r, i) => (
      <polyline key={`${key}3d${i}`} data-arch-mep3d={key} points={r.path.map((p) => iso(p.gx + 0.5, p.gy + 0.5, z).join(",")).join(" ")}
        fill="none" stroke={col} strokeWidth={1} strokeDasharray="2 1.5" strokeLinecap="round" opacity={0.9} />
    ));
    return (
      <div className="relative" style={boxStyle(size)}>
        <svg data-arch-roomdesign-3d viewBox="0 0 260 220" className="rounded border"
          style={{ borderColor: C.cyan, background: "#070b12", touchAction: "none", cursor: "grab", ...svgStyle(size) }}
          {...vcam.handlers} onPointerLeave={vcam.handlers.onPointerUp}>
          <polygon points={poly(floor)} fill={`${C.cyan}12`} stroke={`${C.cyan}66`} strokeWidth={1} />
          {[0, 1, 2, 3].map((i) => <line key={i} x1={floor[i][0]} y1={floor[i][1]} x2={ceil[i][0]} y2={ceil[i][1]} stroke={`${C.cyan}44`} strokeWidth={0.8} />)}
          <polygon points={poly(ceil)} fill="none" stroke={`${C.cyan}33`} strokeWidth={0.7} />
          {objs.map((o) => {
            const s = OBJECT_SPEC[o.kind];
            const fp = footprintOf(o);
            const swap = o.rot === 90 || o.rot === 270;
            const W = swap ? fp.d : fp.w, D = swap ? fp.w : fp.d, hgt = s.h;   // world footprint after rotation
            const ox = o.gx + 0.5 - W / 2, oy = o.gy + 0.5 - D / 2;           // object origin corner in world
            const on = o.id === selId;
            // S2 — rotate a part's unit-square footprint rect by o.rot (single M90 map, others composed) so the
            // pillow/back/legs stay attached to the right side as the object turns.
            const rotRect = (p: ShapePart) => {
              if (o.rot === 90)  return { x: p.y, y: 1 - (p.x + p.w), w: p.d, d: p.w };
              if (o.rot === 180) return { x: 1 - (p.x + p.w), y: 1 - (p.y + p.d), w: p.w, d: p.d };
              if (o.rot === 270) return { x: 1 - (p.y + p.d), y: p.x, w: p.d, d: p.w };
              return { x: p.x, y: p.y, w: p.w, d: p.d };
            };
            return (
              <g key={o.id} data-arch-roomobj3d={o.kind}>
                {shapePartsOf(o.kind).map((p, pi) => {
                  const r = rotRect(p);
                  const x0 = ox + r.x * W, y0 = oy + r.y * D, w = r.w * W, d = r.d * D;
                  const z0 = p.z * hgt, z1 = (p.z + p.h) * hgt;
                  const base = [iso(x0, y0, z0), iso(x0 + w, y0, z0), iso(x0 + w, y0 + d, z0), iso(x0, y0 + d, z0)];
                  const top = [iso(x0, y0, z1), iso(x0 + w, y0, z1), iso(x0 + w, y0 + d, z1), iso(x0, y0 + d, z1)];
                  return (
                    <g key={pi} data-arch-roomobj3d-part={o.kind}>
                      <polygon points={poly([base[0], base[1], top[1], top[0]])} fill={`${s.color}22`} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.2 : 0.7} />
                      <polygon points={poly([base[1], base[2], top[2], top[1]])} fill={`${s.color}18`} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.2 : 0.7} />
                      <polygon points={poly(top)} fill={`${s.color}33`} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.4 : 0.8} />
                    </g>
                  );
                })}
              </g>
            );
          })}
          {r3(water?.runs, MEP_COL.water, 0.3, "water")}
          {r3(sewer?.runs, MEP_COL.sewer, 0.3, "sewer")}
          {r3(wiring?.runs, MEP_COL.wiring, 3, "wiring")}
          {r3(duct?.runs, MEP_COL.duct, N - 0.5, "duct")}
        </svg>
        <Compass2525 bearing={vcam.bearing} onNorth={() => vcam.setBearing(0)} size={26} className="absolute left-1.5 top-1.5 border" style={{ borderColor: `${C.cyan}66` }} />
        <div className="pointer-events-none absolute bottom-1 left-1.5 text-[7px]" style={{ color: C.dim }}>L-drag pan · R-drag rotate/tilt · pinch/scroll zoom · 2-finger twist/tilt</div>
      </div>
    );
  };

  // Layout toggle (stacked ⇄ floating) — lives in the top/main header only.
  const layoutToggleEl = (
    <button data-arch-room-layout onClick={() => setLayout(layoutMode === "stacked" ? "floating" : "stacked")}
      title={layoutMode === "stacked" ? "Switch to floating mini" : "Switch to stacked panes"}
      className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.cyan }}>
      <SquareStack className="h-3 w-3" />
    </button>
  );
  // One MP-style pane header: 2D/3D toggle · view controls (rotate/mirror or reset) · R-CORE lanes.
  const paneHeader = (view: "2D" | "3D", setView: (v: "2D" | "3D") => void, rot: (d: number) => void, onReset: () => void, lead?: React.ReactNode) => (
    <div data-arch-room-header className="mb-1 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: C.border, background: C.panel }}>
      {lead}
      <div className="flex shrink-0 overflow-hidden rounded border" style={{ borderColor: C.border }}>
        {(["2D", "3D"] as const).map((v) => (
          <button key={v} data-arch-room-view={v} onClick={() => setView(v)} className="px-2 py-0.5 font-semibold"
            style={{ color: view === v ? C.cyan : C.dim, background: view === v ? "#0e2233" : "transparent" }}>{v}</button>
        ))}
      </div>
      {view === "2D" ? (
        <>
          <button onClick={() => rot(-15)} title="Rotate plan left" className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.cyan }}><RotateCcw className="h-3 w-3" /></button>
          <button onClick={() => rot(15)} title="Rotate plan right" className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.cyan }}><RotateCw className="h-3 w-3" /></button>
          <button onClick={() => onChange(mirrorObjects(objects, "h"))} title="Mirror left↔right" className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.violet }}><Columns2 className="h-3 w-3" /></button>
          <button onClick={() => onChange(mirrorObjects(objects, "v"))} title="Mirror top↔bottom" className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.violet }}><Rows2 className="h-3 w-3" /></button>
        </>
      ) : (
        <button onClick={onReset} title="Reset view" className="shrink-0 rounded border px-1.5 py-0.5" style={{ borderColor: C.border, color: C.dim }}>Reset</button>
      )}
      <span className="shrink-0 font-semibold" style={{ color: C.dim }}>R-CORE</span>
      {RCORE_LANES.map((l) => <span key={l.key} title={l.def} className="shrink-0 rounded px-1 font-semibold" style={{ color: l.color }}>{l.label}</span>)}
    </div>
  );
  // Interior palette (shared between both layout modes) — sits between the panes (stacked) / below (floating).
  const paletteEl = (
    <div data-arch-roomdesign-palette className="flex flex-wrap gap-1" style={{ touchAction: "none" }}>{/* S4b: pinch here must not zoom the page */}
      {/* S3: palette is context-aware — the room's typical assets + common openings/shell (paletteForRoom, single source) */}
      {paletteForRoom(room.k).map((k) => {
        const s = OBJECT_SPEC[k], on = tool === k, Icon = ICON[k];
        return (
          <button key={k} data-arch-tool={k} onClick={() => setTool(on ? null : k)} title={`${s.label} — tap then tap the floor, or drag onto the plan`}
            draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", k); e.dataTransfer.effectAllowed = "copy"; setTool(k); }}
            className="flex cursor-grab items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] active:cursor-grabbing"
            style={{ borderColor: on ? C.gold : C.border, background: on ? `${C.gold}1e` : "transparent", color: on ? C.gold : C.text }}>
            <Icon className="h-3.5 w-3.5" style={{ color: on ? C.gold : s.color }} />{s.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div data-arch-room-designer className="flex min-h-0 flex-1 flex-col gap-2" style={{ touchAction: "pan-y" }}>{/* S4b: page still scrolls vertically, but a pinch inside the designer can't zoom the whole page */}
      {/* header */}
      <div className="flex items-center gap-2">
        <button data-arch-roomdesign-back onClick={onBack} className="rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>← Back to house</button>
        <span className="text-[11px] font-bold" style={{ color: C.gold }}>{room.k} · {room.label}</span>
        <span className="text-[9px]" style={{ color: C.dim }}>10′×10′ · tap a tool, tap the floor</span>
      </div>

      {/* STACKED (two independent panes, top+bottom) ⇄ FLOATING (main + draggable mini) — operator IMG_7521 */}
      {layoutMode === "stacked" ? (
        <div className="flex flex-col gap-2">
          {/* TOP pane — interactive editor */}
          <div className="relative">
            {paneHeader(mainView, setMainView, rot2d, cam.reset, layoutToggleEl)}
            {mainView === "2D" ? plan2D(bearing2d, setBearing2d, true) : voxel3D(cam)}
          </div>
          {/* interior palette BETWEEN the two panes */}
          {paletteEl}
          {/* BOTTOM pane — independent view + camera/angle */}
          <div className="relative">
            {paneHeader(bottomView, setBottomView, rotB, camB.reset)}
            {bottomView === "2D" ? plan2D(bearingB, setBearingB, false) : voxel3D(camB)}
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            {paneHeader(mainView, setMainView, rot2d, cam.reset, layoutToggleEl)}
            {mainView === "2D" ? plan2D(bearing2d, setBearing2d, true) : voxel3D(cam)}
            <div className="absolute bottom-2 right-2 z-10">
              <MiniPanel title={mainView === "2D" ? "3D · Voxel" : "2D · Plan"} subtitle={`${room.k} · ${room.label}`}
                defaultW={188} defaultH={210} minW={140} minH={150}
                render={(s) => (mainView === "2D" ? voxel3D(camB, s) : plan2D(bearingB, setBearingB, false, s))} />
            </div>
          </div>
          {paletteEl}
        </>
      )}

      {/* MEP length totals (operator: "sub-menu to show length of total pipe / electrical specs") — one source (lib/mep-runs) */}
      {anyMep && (
        <div data-arch-mep-readout className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded border px-2 py-1 text-[9px]" style={{ borderColor: C.border, background: "#070b12" }}>
          {water && <span data-arch-mep-water style={{ color: MEP_COL.water }}>Water {water.totalFt} ft</span>}
          {sewer && <span data-arch-mep-sewer style={{ color: MEP_COL.sewer }}>Sewer {sewer.totalFt} ft</span>}
          {wiring && eSpec && <span data-arch-mep-wire style={{ color: MEP_COL.wiring }}>Wire {eSpec.wireFt} ft · {eSpec.circuits} circ · {eSpec.amps}A</span>}
          {duct && <span data-arch-mep-duct style={{ color: MEP_COL.duct }}>Duct {duct.totalFt} ft</span>}
        </div>
      )}

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
            <span data-arch-roomobj-dims style={{ color: C.dim }}>{fmt(fp.w)}′ W × {fmt(fp.d)}′ D × {fmt(OBJECT_SPEC[sel.kind].h)}′ H</span>
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

      {/* ACTIVE ELEMENTS — the room's placed assets, click to select (highlights 2D+3D + shows details above). */}
      {objects.length > 0 && (
        <div data-arch-room-active className="rounded border p-1" style={{ borderColor: C.border, background: "#070b12" }}>
          <div className="mb-1 px-0.5 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Active Elements · {objects.length}</div>
          <div className="flex flex-col gap-0.5">
            {objects.map((o) => {
              const s = OBJECT_SPEC[o.kind], RowIcon = ICON[o.kind], on = o.id === selId;
              const vLabel = VARIANTS[o.kind]?.find((v) => v.id === o.variant)?.label;
              const fp = footprintOf(o);
              const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1).replace(/\.0$/, ""));
              return (
                <button key={o.id} data-arch-active-el={o.kind} onClick={() => setSelId(on ? null : o.id)}
                  className="flex items-center gap-1.5 rounded px-1 py-0.5 text-left text-[10px]"
                  style={{ background: on ? `${C.gold}1e` : "transparent", color: on ? C.gold : C.text }}>
                  <RowIcon className="h-3 w-3 shrink-0" style={{ color: on ? C.gold : s.color }} />
                  <span className="min-w-0 flex-1 truncate">{vLabel ? `${vLabel} ` : ""}{s.label}</span>
                  <span className="shrink-0 tabular-nums" style={{ color: C.dim, fontSize: 8 }}>{fmt(fp.w)}×{fmt(fp.d)}×{fmt(s.h)}′ · {o.gx},{o.gy}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
