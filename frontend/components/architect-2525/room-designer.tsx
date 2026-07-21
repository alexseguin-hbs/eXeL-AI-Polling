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
  Shirt, Rows3, Footprints, Frame, RectangleVertical, LampFloor, Fan,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Link2, Link2Off, Undo2,
  type LucideIcon,
} from "lucide-react";
import { Compass2525 } from "./compass-2525";
import { MiniPanel } from "./mini-panel";
import { RCORE_LANES } from "@/components/security-2525/rcore";
import {
  OBJECT_SPEC, ROOM_GRID, placeObject, moveObject, rotateObject, removeObject, mirrorObjects,
  footprintOf, heightOf, cycleVariant, VARIANTS, wallOf, slideAlongWall, shapePartsOf, paletteForRoom, groupPalette,
  nudgeObject, NUDGE_STEPS_FT, parseFeet, setAlongWall, setVariantByWidth, setVariantByHeight, setGap, elevOf, setElev,
  type PlacedObject, type ObjectKind, type Wall, type ShapePart,
} from "@/lib/room-objects";
import { waterRuns, sewerRuns, wiringRuns, ductRuns, electricSpecs, outletMarkers, type MepRun } from "@/lib/mep-runs";
import { annotateObject, chainDims, ftIn } from "@/lib/dim-annot";
import { useLexicon } from "@/lib/lexicon-context";
import { OBJECT_ICON } from "./object-icons";
import { roomBom } from "@/lib/architect-bom";
import { runPlaytest, PLAYTEST_SYSTEMS } from "@/lib/architect-playtest";
import { useRCoreGestures } from "./use-rcore-gestures";
import type { RoomCell } from "@/lib/room-layout";

const C = { border: "#1e2b3a", panel: "#0c1420", dim: "#5f7186", text: "#c8d6e5", cyan: "#19c8cf", gold: "#ffd400", violet: "#c084fc" };

// FIX-D — solid polygon-face shading (reuse Mission-Planning radar-dome FACE_SHADE technique, IMG_7534): multiply an
// object's hex colour toward black per face (top brightest → sides darker) so 3D furniture reads SOLID, not translucent.
const FACE_SHADE = { top: 1.0, front: 0.82, side: 0.6 } as const;
function shade(hex: string, f: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
const N = ROOM_GRID; // 10

// Our own iconology (no emojis, operator's standing rule) — one lucide glyph per object kind.
const ICON = OBJECT_ICON; // shared per-kind icons (one source — also used by the Vision Tree furniture section)

/** Snap a wall object (window/door) to whichever of the 4 edges is nearest the drop cell. */
function wallSnap(gx: number, gy: number): { gx: number; gy: number } {
  const dLeft = gx, dRight = N - 1 - gx, dTop = gy, dBot = N - 1 - gy;
  const m = Math.min(dLeft, dRight, dTop, dBot);
  if (m === dTop) return { gx, gy: 0 };
  if (m === dBot) return { gx, gy: N - 1 };
  if (m === dLeft) return { gx: 0, gy };
  return { gx: N - 1, gy };
}

export function RoomDesigner({ room, onChange, onBack, showWater = false, showSewer = false, showWiring = false, showDucts = false, topView, onTopView }: {
  room: RoomCell; onChange: (o: PlacedObject[]) => void; onBack: () => void;
  showWater?: boolean; showSewer?: boolean; showWiring?: boolean; showDucts?: boolean;
  topView?: "2D" | "3D"; onTopView?: (v: "2D" | "3D") => void; // engine 2D/3D toggle drives the TOP pane (one source)
}) {
  const { t } = useLexicon(); // ONE master lexicon (vision.* shared UX — used by Security-2525 + Architect-2525)
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
  // S9 — guided demo runner (read-only narration of the pure runPlaytest() engine). Additive; drives nothing else.
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [nudgeIx, setNudgeIx] = useState(1); // FIX-B nudge step index (default 6")
  const [helpOpen, setHelpOpen] = useState(false); // FIX-C explanations
  const [bomOpen, setBomOpen] = useState(false);   // Bill of Materials collapses to one line by default (operator IMG_7596)
  // Mirror / North-lock (IMG_7549/7550): when on, the bottom/mini pane shares the top pane's camera + 2D bearing, so
  // rotating one rotates BOTH to the same North (Mission-Planning mirror). Persisted like the layout choice.
  const [linkView, setLinkView] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("arch2525.roomLinkView") === "1"; } catch { return false; }
  });
  const setLink = (v: boolean) => { setLinkView(v); try { localStorage.setItem("arch2525.roomLinkView", v ? "1" : "0"); } catch {} };
  const [dimEntry, setDimEntry] = useState<{ edit: "oc" | "size" | "gapNear" | "gapFar" | "height" | "elev"; axis: "x" | "y" } | null>(null); // FIX-5b/5c numeric entry (axis: horizontal|vertical chain; height = 3D)
  const [dimVal, setDimVal] = useState("");

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

  // UNDO — snapshot the object list BEFORE each discrete edit so any placement/move/delete can be reversed (operator:
  // "undo button for ensuring multiple items are unplaced"). Drag-moves push ONE snapshot (pre-drag), not per-tick.
  const [history, setHistory] = useState<PlacedObject[][]>([]);
  const dragPushed = useRef(false);
  const commit = (next: PlacedObject[]) => { setHistory((h) => [...h.slice(-49), objects]); onChange(next); };
  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      onChange(h[h.length - 1]);
      setSelId(null);
      return h.slice(0, -1);
    });
  };
  // Open the feet-inches keypad prefilled with the current value — shared by the 2D dimension labels AND the 3D
  // height dimension, so both panes edit through one entry (operator: adjust height like a window in 3D).
  const startDimEdit = (edit: "oc" | "size" | "gapNear" | "gapFar" | "height" | "elev", cur: number, axis: "x" | "y" = "x") => {
    setDimVal(ftIn(cur));
    setDimEntry({ edit, axis });
  };
  const placeAt = (gx: number, gy: number) => {
    if (!tool) return;
    const p = OBJECT_SPEC[tool].onWall ? wallSnap(gx, gy) : { gx, gy };
    commit(placeObject(objects, tool, p.gx, p.gy));
    setTool(null); // auto-disengage so a second tap doesn't stamp a duplicate (operator: re-select to place again)
  };
  const objDown = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation(); drag.current = id; setSelId(id); dragPushed.current = false;
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
    if (p.gx !== o.gx || p.gy !== o.gy) {
      // push ONE pre-drag snapshot the first time this drag actually moves, so the whole drag is a single undo step.
      if (!dragPushed.current) { setHistory((h) => [...h.slice(-49), objects]); dragPushed.current = true; }
      onChange(moveObject(objects, o.id, p.gx, p.gy));
    }
  };
  // Tap-to-place is on POINTERUP at the SVG level, not the floor rect's onClick — on mobile a click after the
  // touch-action/pointer gesture (or an MEP mark / outlet sitting over the tap) silently swallowed the placement,
  // so toilet/tub/sink armed but "nothing appeared" (operator IMG_7579). Object taps set drag.current via objDown
  // (pointer-captured), so they never reach this as a place.
  const tapStart = useRef<{ x: number; y: number } | null>(null);
  const svgDown = (e: React.PointerEvent) => { if (tool && !drag.current) tapStart.current = { x: e.clientX, y: e.clientY }; };
  const svgUp = (e?: React.PointerEvent) => {
    const wasDrag = drag.current; drag.current = null; dragWall.current = null;
    const s = tapStart.current; tapStart.current = null;
    if (!e || wasDrag || !tool || !s) return;               // only an un-dragged tap with a tool armed places
    if (Math.abs(e.clientX - s.x) + Math.abs(e.clientY - s.y) > 12) return; // moved too far → treat as a drag, not a tap
    const c = cellFromEvent(e); if (c) placeAt(c.gx, c.gy);
  };
  // Drag an asset FROM the palette and DROP it on the floor (operator IMG_7513: "drag from left on map").
  const dropOnFloor = (e: React.DragEvent) => {
    e.preventDefault();
    const k = e.dataTransfer.getData("text/plain") as ObjectKind;
    if (!(k in OBJECT_SPEC)) return;
    const c = cellFromEvent(e); if (!c) return;
    const p = OBJECT_SPEC[k].onWall ? wallSnap(c.gx, c.gy) : c;
    commit(placeObject(objects, k, p.gx, p.gy));
    setTool(null); // auto-disengage after a drop too, so the next drop needs a fresh pick
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
  const outMarks = showWiring ? outletMarkers(outlets) : null;   // FIX-4 wall-mounted outlets
  const MEP_COL = { water: C.cyan, sewer: "#22c55e", wiring: C.gold, duct: "#38bdf8" };
  const anyMep = !!(water || sewer || wiring || duct);
  // 2D: polyline through grid-cell centres (viewBox 0..100). 3D: same path at a system height (floor→ceiling).
  const c2 = (n: number) => n * 10 + 5;
  const run2d = (runs: MepRun[] | undefined, col: string, key: string) => runs?.map((r, i) => (
    <polyline key={`${key}${i}`} data-arch-mep2d={key} points={r.path.map((p) => `${c2(p.gx)},${c2(p.gy)}`).join(" ")}
      fill="none" stroke={col} strokeWidth={0.9} strokeDasharray="2 1.5" strokeLinecap="round" opacity={0.85} />
  ));
  // TOP/main pane view (bottom pane uses bottomView, declared above with its own camera camB). CONTROLLED by the
  // engine 2D/3D toggle when topView/onTopView are passed (operator IMG_7575: engine "3D" must switch the top map),
  // else internal state. Either way the pane's own 2D/3D button and the engine toggle stay in sync (one source).
  const [topViewLocal, setTopViewLocal] = useState<"2D" | "3D">("2D");
  const mainView = topView ?? topViewLocal;
  const setMainView = onTopView ?? setTopViewLocal;
  const boxStyle = (size?: number) => ({ touchAction: "none" as const, ...(size ? { width: size, height: size } : { width: "100%" }) });
  const svgStyle = (size?: number) => (size ? { width: size, height: size } : { width: "100%", aspectRatio: "1 / 1" as const });

  // 2D floor plan. `interactive` (top/main) wires the svgRef + placement handlers; the echo (bottom pane) renders
  // read-only at its own rotation `bear`. This lets two 2D panes hold independent angles.
  const plan2D = (bear: number, setBear: (n: number) => void, interactive: boolean, size?: number) => (
    <div className="relative" style={boxStyle(size)}>
      <svg {...(interactive ? { ref: svgRef, onPointerDown: svgDown, onPointerMove: svgMove, onPointerUp: svgUp, onPointerCancel: () => svgUp(), onPointerLeave: () => svgUp(), onDragOver: (e: React.DragEvent) => e.preventDefault(), onDrop: dropOnFloor } : {})}
        data-arch-roomdesign-2d viewBox="0 0 100 100" className="rounded border"
        style={{ borderColor: C.cyan, background: "#070b12", touchAction: "none", ...svgStyle(size) }}>
        <g data-arch-roomdesign-2d-rot transform={`rotate(${bear} 50 50)`}>
          {Array.from({ length: N + 1 }).map((_, i) => (
            <g key={i}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke={`${C.cyan}22`} strokeWidth={0.4} />
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke={`${C.cyan}22`} strokeWidth={0.4} />
            </g>
          ))}
          {interactive && <rect x={0} y={0} width={100} height={100} fill="transparent" style={{ cursor: tool ? "copy" : "default", pointerEvents: "none" }} />}
          <rect x={1} y={1} width={98} height={98} fill="none" stroke={C.violet} strokeWidth={1.2} />
          {run2d(water?.runs, MEP_COL.water, "water")}
          {run2d(sewer?.runs, MEP_COL.sewer, "sewer")}
          {run2d(wiring?.runs, MEP_COL.wiring, "wiring")}
          {run2d(duct?.runs, MEP_COL.duct, "duct")}
          {/* FIX-4 — outlets as marks ON the wall cell (visible in the walls) */}
          {outMarks?.map((m, i) => (
            <rect key={`out${i}`} data-arch-outlet2d x={c2(m.gx) - 1.4} y={c2(m.gy) - 1.4} width={2.8} height={2.8} rx={0.4}
              fill={MEP_COL.wiring} stroke="#070b12" strokeWidth={0.4} />
          ))}
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
                {/* upper-left DRAG GRIP — the standard 6-dot handle (2 cols × 3 rows, ⠿) so it reads as "grab to move",
                    matching the mini-map grip (operator IMG_7593). Visual only; the whole group drags. */}
                {interactive && (() => {
                  const gx0 = cx - w * 5, gy0 = cy - d * 5, col = on ? C.gold : s.color;
                  return (
                    <g style={{ pointerEvents: "none" }}>
                      <rect x={gx0 - 1.15} y={gy0 - 1.65} width={2.3} height={3.3} rx={0.6} fill="#070b12dd" stroke={col} strokeWidth={0.3} />
                      {[0, 1, 2].map((r) => [0, 1].map((c) => (
                        <circle key={`${r}${c}`} cx={gx0 - 0.55 + c * 1.1} cy={gy0 - 1.05 + r * 1.05} r={0.26} fill={col} />
                      )))}
                    </g>
                  );
                })()}
                <foreignObject x={cx - 4} y={cy - 4} width={8} height={8} style={{ pointerEvents: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 8, height: 8 }}>
                    <Icon style={{ width: 6, height: 6, color: on ? C.gold : s.color }} />
                  </div>
                </foreignObject>
              </g>
            );
          })}
          {/* S5 — CAD dimension callouts for the selected/dragged object (O.C. · R.O. · AFF, feet-inches). Interactive
              pane only; witness lines + labels rotate with the plan. Vendors build each room to a published standard. */}
          {interactive && sel && (() => {
            const fp = footprintOf(sel);
            const ann = annotateObject(sel, { ...OBJECT_SPEC[sel.kind], h: heightOf(sel) }, fp);
            const onWall = OBJECT_SPEC[sel.kind].onWall;
            // FIX-5c — the object's primary chain; free furniture ALSO gets the perpendicular chain so BOTH horizontal
            // AND vertical coordinates are editable in the same manner (operator: "include vertical coordinates too").
            const primary = chainDims(sel, OBJECT_SPEC[sel.kind], fp);
            const perp = onWall ? null : chainDims(sel, OBJECT_SPEC[sel.kind], fp, undefined, primary.axis === "x" ? "y" : "x");
            const U = 10; // ft → viewBox units
            // Tap any dimension to TYPE an exact value; commit re-derives so the OTHER gaps update (operator).
            const applyEdit = (e: React.MouseEvent, edit: "oc" | "size" | "gapNear" | "gapFar", cur: number, axis: "x" | "y") => {
              e.stopPropagation();
              startDimEdit(edit, cur, axis);
            };
            const renderChain = (chain: ReturnType<typeof chainDims>, tag: string) => chain.segs.map((s, i) => {
              const horiz = chain.axis === "x";
              const a = s.a * U, b = s.b * U, along = chain.along * U;
              const X1 = horiz ? a : along, Y1 = horiz ? along : a, X2 = horiz ? b : along, Y2 = horiz ? along : b;
              const mx = (X1 + X2) / 2, my = (Y1 + Y2) / 2;
              const col = s.kind === "size" ? C.gold : C.cyan;
              const ah = 1.4, ew = 1.6; // arrowhead length · extension-line half-length
              // standard CAD dimension: witness (extension) lines at each end + inward-pointing arrowheads.
              const head = (hx: number, hy: number, dir: 1 | -1) => horiz
                ? poly([[hx, hy], [hx + dir * ah, hy - ah * 0.6], [hx + dir * ah, hy + ah * 0.6]])
                : poly([[hx, hy], [hx - ah * 0.6, hy + dir * ah], [hx + ah * 0.6, hy + dir * ah]]);
              return (
                <g key={`${tag}${i}`}>
                  {/* witness/extension lines at both ends (perpendicular to the dimension line) */}
                  {horiz ? (<>
                    <line x1={X1} y1={Y1 - ew} x2={X1} y2={Y1 + ew} stroke={col} strokeWidth={0.35} style={{ pointerEvents: "none" }} />
                    <line x1={X2} y1={Y2 - ew} x2={X2} y2={Y2 + ew} stroke={col} strokeWidth={0.35} style={{ pointerEvents: "none" }} />
                  </>) : (<>
                    <line x1={X1 - ew} y1={Y1} x2={X1 + ew} y2={Y1} stroke={col} strokeWidth={0.35} style={{ pointerEvents: "none" }} />
                    <line x1={X2 - ew} y1={Y2} x2={X2 + ew} y2={Y2} stroke={col} strokeWidth={0.35} style={{ pointerEvents: "none" }} />
                  </>)}
                  {/* dimension line + inward arrowheads at each end (engineering-drawing standard) */}
                  <line x1={X1} y1={Y1} x2={X2} y2={Y2} stroke={col} strokeWidth={0.5} style={{ pointerEvents: "none" }} />
                  <polygon points={head(X1, Y1, 1)} fill={col} style={{ pointerEvents: "none" }} />
                  <polygon points={head(X2, Y2, -1)} fill={col} style={{ pointerEvents: "none" }} />
                  <text data-arch-dim-edit={s.edit} data-arch-dim-axis={chain.axis} x={mx} y={my - 1.2} fontSize={2.8} fill={col} textAnchor="middle" stroke="#070b12" strokeWidth={0.7}
                    style={{ paintOrder: "stroke", vectorEffect: "non-scaling-stroke", cursor: "pointer" }} onClick={(e) => applyEdit(e, s.edit, s.ft, chain.axis)}>{s.label} ✎</text>
                </g>
              );
            });
            return (
              <g data-arch-roomdim>
                {/* FIX-5c — 3-segment chain(s): wall→near edge · object · far edge→wall. Horizontal always; vertical too
                    for free furniture. Each label is tappable to type an exact value; editing one re-derives the others. */}
                {renderChain(primary, "c")}
                {perp && renderChain(perp, "cy")}
                {/* R.O. / SILL notes stay for openings (not part of the position chain) */}
                {ann.notes.map((n, i) => {
                  const ne = n.edit; // capture so TS narrows inside the onClick closure
                  return (
                    <text key={`n${i}`} data-arch-dim-edit={ne} x={(sel.gx + 0.5) * U} y={(sel.gy + 0.5) * U + 4.2 + i * 3.6} fontSize={3} fill={ne ? C.cyan : C.gold}
                      textAnchor="middle" stroke="#070b12" strokeWidth={0.7} style={{ paintOrder: "stroke", vectorEffect: "non-scaling-stroke", cursor: ne ? "pointer" : "default", pointerEvents: ne ? "auto" : "none" }}
                      onClick={ne ? (e) => applyEdit(e, ne, fp.w, primary.axis) : undefined}>{n.text}{ne === "size" ? " ✎" : ""}</text>
                  );
                })}
              </g>
            );
          })()}
        </g>
      </svg>
      <Compass2525 bearing={(bear * Math.PI) / 180} onNorth={() => setBear(0)} size={26} className="absolute left-1.5 top-1.5 border" style={{ borderColor: `${C.cyan}66` }} />
      <button data-arch-room-link onClick={() => setLink(!linkView)} title={linkView ? "North LOCKED — top & mini rotate together (tap to unlock)" : "Lock North — rotate top & mini together (mirror)"}
        className="absolute right-1.5 top-1.5 z-10 rounded border p-0.5" style={{ borderColor: linkView ? C.cyan : C.border, color: linkView ? C.cyan : C.dim, background: "#0a0f16cc" }}>
        {linkView ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
      </button>
      {/* FIX-5b/5c — numeric dimension entry (click a ✎ dimension → type an exact value in feet-inches). Editing a
          gap moves the object so the OTHER gap re-derives; size snaps to nearest standard; O.C. sets exact centre. */}
      {interactive && sel && dimEntry && (() => {
        const applyDim = () => {
          const v = parseFeet(dimVal);
          if (v != null) {
            const e = dimEntry.edit, ax = dimEntry.axis; // ax routes to the horizontal (x) or vertical (y) chain
            commit(
              e === "oc" ? setAlongWall(objects, sel.id, v, ax)
              : e === "gapNear" ? setGap(objects, sel.id, "near", v, ax)
              : e === "gapFar" ? setGap(objects, sel.id, "far", v, ax)
              : e === "height" ? setVariantByHeight(objects, sel.id, v)   // 3D height edit (e.g. window head height)
              : e === "elev" ? setElev(objects, sel.id, v)                // 3D distance-off-ground edit (window sill etc.)
              : setVariantByWidth(objects, sel.id, v, ax)
            );
          }
          setDimEntry(null);
        };
        const isH = dimEntry.edit === "height" || dimEntry.edit === "elev";
        const axSuffix = isH ? "" : dimEntry.axis === "y" ? " ↕" : " ↔"; // show which coordinate is being edited (height/elev have none)
        const label = (dimEntry.edit === "oc" ? t("vision.dim.oc") : dimEntry.edit === "gapNear" ? t("vision.dim.fromWall") : dimEntry.edit === "gapFar" ? t("vision.dim.toWall") : dimEntry.edit === "height" ? t("vision.dim.height") : dimEntry.edit === "elev" ? t("vision.dim.offGround") : t("vision.dim.size")) + axSuffix;
        // ON-SCREEN feet-inches KEYPAD — no native <input>, so iOS Safari never auto-zooms the page when you enter a
        // measurement (operator flagged the zoom twice, IMG_7565), and the big buttons are kid/grandma-friendly.
        const press = (ch: string) => setDimVal((s) => (s.length < 8 ? s + ch : s));
        const key = (ch: string, cls = "") => (
          <button key={ch} data-arch-dim-key={ch} onClick={() => press(ch)}
            className={`rounded border py-2 text-[15px] font-semibold tabular-nums active:opacity-70 ${cls}`}
            style={{ borderColor: C.border, color: C.text, background: "#0e1622" }}>{ch}</button>
        );
        return (
          <div data-arch-dim-entry className="absolute left-1/2 top-1.5 z-20 w-[190px] -translate-x-1/2 rounded-lg border p-2 shadow-lg"
            style={{ borderColor: C.cyan, background: "#0a0f16f7", touchAction: "manipulation" }}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-semibold" style={{ color: C.dim }}>{label}</span>
              <span data-arch-dim-display className="flex-1 rounded border px-2 py-1 text-right text-[16px] font-bold tabular-nums"
                style={{ borderColor: C.border, color: C.cyan, background: "#070b12" }}>{dimVal || `0'-0"`}</span>
              <button data-arch-dim-cancel onClick={() => setDimEntry(null)} className="shrink-0 rounded border px-1.5 py-1 text-[12px]" style={{ borderColor: C.border, color: C.dim }}>✕</button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => key(n))}
              {key("'")}{key("0")}{key(`"`)}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1">
              <button data-arch-dim-back onClick={() => setDimVal((s) => s.slice(0, -1))}
                className="rounded border py-2 text-[13px] font-semibold active:opacity-70" style={{ borderColor: C.border, color: C.dim, background: "#0e1622" }}>⌫ {t("vision.dim.del")}</button>
              <button data-arch-dim-ok onClick={applyDim}
                className="rounded border py-2 text-[13px] font-bold active:opacity-70" style={{ borderColor: C.cyan, color: "#04222a", background: C.cyan }}>{t("vision.dim.set")}</button>
            </div>
          </div>
        );
      })()}
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
            const W = swap ? fp.d : fp.w, D = swap ? fp.w : fp.d, hgt = heightOf(o);   // world footprint + variant height
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
              // FIX-E — click an object in 3D to select it (stopPropagation so it selects instead of orbiting the camera).
              <g key={o.id} data-arch-roomobj3d={o.kind} style={{ cursor: "pointer" }}
                onPointerDown={(e) => { e.stopPropagation(); setSelId(o.id); }}>
                {shapePartsOf(o.kind).map((p, pi) => {
                  const r = rotRect(p);
                  const x0 = ox + r.x * W, y0 = oy + r.y * D, w = r.w * W, d = r.d * D;
                  const e0 = elevOf(o);                       // lift the whole object by its distance off the floor
                  const z0 = p.z * hgt + e0, z1 = (p.z + p.h) * hgt + e0;
                  const base = [iso(x0, y0, z0), iso(x0 + w, y0, z0), iso(x0 + w, y0 + d, z0), iso(x0, y0 + d, z0)];
                  const top = [iso(x0, y0, z1), iso(x0 + w, y0, z1), iso(x0 + w, y0 + d, z1), iso(x0, y0 + d, z1)];
                  return (
                    <g key={pi} data-arch-roomobj3d-part={o.kind}>
                      {/* FIX-D solid shaded faces (top brightest → sides darker); selected = gold tint */}
                      <polygon points={poly([base[0], base[1], top[1], top[0]])} fill={on ? shade(C.gold, FACE_SHADE.front) : shade(s.color, FACE_SHADE.front)} stroke={on ? C.gold : s.color} strokeWidth={on ? 1 : 0.5} />
                      <polygon points={poly([base[1], base[2], top[2], top[1]])} fill={on ? shade(C.gold, FACE_SHADE.side) : shade(s.color, FACE_SHADE.side)} stroke={on ? C.gold : s.color} strokeWidth={on ? 1 : 0.5} />
                      <polygon points={poly(top)} fill={on ? shade(C.gold, FACE_SHADE.top) : shade(s.color, FACE_SHADE.top)} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.2 : 0.6} />
                    </g>
                  );
                })}
              </g>
            );
          })}
          {/* 3D HEIGHT dimension — a vertical callout on the SELECTED object showing its height, tappable to adjust
              (operator: "make 3D have height of object dimensions similar to 2D for adjusting items like height of
              window"). Reuses the same feet-inches keypad via startDimEdit. */}
          {sel && (() => {
            const o = objects.find((x) => x.id === selId); if (!o) return null;
            const fp = footprintOf(o); const swap = o.rot === 90 || o.rot === 270;
            const W = swap ? fp.d : fp.w, D = swap ? fp.w : fp.d;
            const ox = o.gx + 0.5 - W / 2, oy = o.gy + 0.5 - D / 2;   // object origin corner in world
            const hgt = heightOf(o); const e0 = elevOf(o);
            const lx = Math.max(0.15, ox - 0.35);                    // witness rail just outside the front-left corner
            const pB = iso(lx, oy, e0), pT = iso(lx, oy, e0 + hgt);  // object BASE (off-ground) → top
            const mx = (pB[0] + pT[0]) / 2, my = (pB[1] + pT[1]) / 2;
            // off-ground rail (floor → base), always tappable so you can lift ANY item off the floor (operator IMG_7594)
            const ox2 = Math.max(0.1, lx - 0.5);
            const gB = iso(ox2, oy, 0), gT = iso(ox2, oy, e0);
            const gmx = (gB[0] + gT[0]) / 2, gmy = (gB[1] + gT[1]) / 2;
            const tick = (px: number, py: number, col: string) => <line x1={px - 2} y1={py} x2={px + 2} y2={py} stroke={col} strokeWidth={0.6} style={{ pointerEvents: "none" }} />;
            return (
              <g data-arch-roomobj3d-height>
                {/* HEIGHT (base → top) */}
                <line x1={pB[0]} y1={pB[1]} x2={pT[0]} y2={pT[1]} stroke={C.gold} strokeWidth={0.7} style={{ pointerEvents: "none" }} />
                {tick(pB[0], pB[1], C.gold)}{tick(pT[0], pT[1], C.gold)}
                <text data-arch-dim-edit="height" x={mx - 3} y={my} fontSize={7} fill={C.gold} textAnchor="end" stroke="#070b12" strokeWidth={1.6}
                  style={{ paintOrder: "stroke", vectorEffect: "non-scaling-stroke", cursor: "pointer" }}
                  onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); startDimEdit("height", hgt); }}>H {ftIn(hgt)} ✎</text>
                {/* OFF-GROUND (floor → base) — tappable to set distance off the ground / window sill */}
                <line x1={gB[0]} y1={gB[1]} x2={gT[0]} y2={gT[1]} stroke={C.cyan} strokeWidth={0.6} strokeDasharray="1.5 1" style={{ pointerEvents: "none" }} />
                {tick(gB[0], gB[1], C.cyan)}{tick(gT[0], gT[1], C.cyan)}
                <text data-arch-dim-edit="elev" x={gmx - 3} y={gmy} fontSize={6} fill={C.cyan} textAnchor="end" stroke="#070b12" strokeWidth={1.4}
                  style={{ paintOrder: "stroke", vectorEffect: "non-scaling-stroke", cursor: "pointer" }}
                  onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); startDimEdit("elev", e0); }}>OG {ftIn(e0)} ✎</text>
              </g>
            );
          })()}
          {r3(water?.runs, MEP_COL.water, 0.3, "water")}
          {r3(sewer?.runs, MEP_COL.sewer, 0.3, "sewer")}
          {r3(wiring?.runs, MEP_COL.wiring, 3, "wiring")}
          {r3(duct?.runs, MEP_COL.duct, N - 0.5, "duct")}
          {/* FIX-4 — outlets on the WALL FACE at ~1.5ft AFF (a small box, not a floor dot) */}
          {outMarks?.map((m, i) => {
            const cxo = m.gx + 0.5, cyo = m.gy + 0.5, s2 = 0.28;
            const b = [iso(cxo - s2, cyo - s2, m.affFt - s2), iso(cxo + s2, cyo - s2, m.affFt - s2), iso(cxo + s2, cyo + s2, m.affFt - s2), iso(cxo - s2, cyo + s2, m.affFt - s2)];
            const t = [iso(cxo - s2, cyo - s2, m.affFt + s2), iso(cxo + s2, cyo - s2, m.affFt + s2), iso(cxo + s2, cyo + s2, m.affFt + s2), iso(cxo - s2, cyo + s2, m.affFt + s2)];
            return <g key={`out3d${i}`} data-arch-outlet3d>
              <polygon points={poly([b[0], b[1], t[1], t[0]])} fill={MEP_COL.wiring} stroke="#070b12" strokeWidth={0.4} />
              <polygon points={poly(t)} fill={MEP_COL.wiring} stroke="#070b12" strokeWidth={0.4} />
            </g>;
          })}
        </svg>
        <Compass2525 bearing={vcam.bearing} onNorth={() => vcam.setBearing(0)} size={26} className="absolute left-1.5 top-1.5 border" style={{ borderColor: `${C.cyan}66` }} />
        <button data-arch-room-link onClick={() => setLink(!linkView)} title={linkView ? "North LOCKED — top & mini rotate together (tap to unlock)" : "Lock North — rotate top & mini together (mirror)"}
          className="absolute right-1.5 top-1.5 z-10 rounded border p-0.5" style={{ borderColor: linkView ? C.cyan : C.border, color: linkView ? C.cyan : C.dim, background: "#0a0f16cc" }}>
          {linkView ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
        </button>
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
      {/* S8 — view-specific control (2D = rotate plan · 3D = reset camera) */}
      {view === "2D" ? (
        <>
          <button onClick={() => rot(-15)} title="Rotate plan left" className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.cyan }}><RotateCcw className="h-3 w-3" /></button>
          <button onClick={() => rot(15)} title="Rotate plan right" className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.cyan }}><RotateCw className="h-3 w-3" /></button>
        </>
      ) : (
        <button onClick={onReset} title="Reset view" className="shrink-0 rounded border px-1.5 py-0.5" style={{ borderColor: C.border, color: C.dim }}>{t("vision.ctrl.reset")}</button>
      )}
      {/* S8 — MIRROR is a DATA op (affects 2D + 3D from one source), so it's shown in BOTH view modes on every pane */}
      <button onClick={() => commit(mirrorObjects(objects, "h"))} title="Mirror left↔right" className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.violet }}><Columns2 className="h-3 w-3" /></button>
      <button onClick={() => commit(mirrorObjects(objects, "v"))} title="Mirror top↔bottom" className="shrink-0 rounded border p-0.5" style={{ borderColor: C.border, color: C.violet }}><Rows2 className="h-3 w-3" /></button>
      <span className="shrink-0 font-semibold" style={{ color: C.dim }}>{t("vision.rcore")}</span>
      {RCORE_LANES.map((l) => <span key={l.key} title={l.def} className="shrink-0 rounded px-1 font-semibold" style={{ color: l.color }}>{l.label}</span>)}
    </div>
  );
  // Interior palette (shared between both layout modes) — sits between the panes (stacked) / below (floating).
  // S3: context-aware (paletteForRoom, single source) · S7: grouped by building system (groupPalette).
  const toolBtn = (k: ObjectKind) => {
    const s = OBJECT_SPEC[k], on = tool === k, Icon = ICON[k];
    return (
      <button key={k} data-arch-tool={k} onClick={() => setTool(on ? null : k)} title={`${s.label} — tap then tap the floor, or drag onto the plan`}
        draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", k); e.dataTransfer.effectAllowed = "copy"; setTool(k); }}
        className="flex cursor-grab items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] active:cursor-grabbing"
        style={{ borderColor: on ? C.gold : C.border, background: on ? `${C.gold}1e` : "transparent", color: on ? C.gold : C.text }}>
        <Icon className="h-3.5 w-3.5" style={{ color: on ? C.gold : s.color }} />{s.label}
      </button>
    );
  };
  const paletteEl = (
    <div data-arch-roomdesign-palette className="flex flex-wrap items-stretch gap-x-2 gap-y-1" style={{ touchAction: "none" }}>{/* S4b: pinch here must not zoom the page */}
      {groupPalette(paletteForRoom(room.k)).map(({ group, kinds }) => (
        <div key={group} data-arch-palette-group={group} className="flex items-center gap-1">
          <span className="shrink-0 text-[7px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>{group}</span>
          {kinds.map(toolBtn)}
        </div>
      ))}
    </div>
  );

  return (
    <div data-arch-room-designer className="flex min-h-0 flex-1 flex-col gap-2" style={{ touchAction: "pan-y" }}>{/* S4b: page still scrolls vertically, but a pinch inside the designer can't zoom the whole page */}
      {/* header */}
      <div className="flex items-center gap-2">
        <button data-arch-roomdesign-back onClick={onBack} className="rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>← {t("vision.nav.backToHouse")}</button>
        <span className="text-[11px] font-bold" style={{ color: C.gold }}>{room.k} · {room.label}</span>
        <span className="text-[9px]" style={{ color: C.dim }}>10′×10′ · tap a tool, tap the floor</span>
        {/* UNDO — reverse the last placement/move/edit (operator: "undo button for ensuring multiple items are unplaced") */}
        <button data-arch-roomdesign-undo onClick={undo} disabled={history.length === 0}
          className="ml-auto flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold disabled:opacity-40"
          style={{ borderColor: history.length ? C.gold : C.border, color: history.length ? C.gold : C.dim }}
          title={`${t("vision.ctrl.undo")}${history.length ? ` (${history.length})` : ""}`}>
          <Undo2 className="h-3 w-3" /> {t("vision.ctrl.undo")}{history.length ? ` ${history.length}` : ""}
        </button>
        {/* FIX-C — explanations for the non-simple areas (operator: intuitive + get explanations) */}
        <button data-arch-help onClick={() => setHelpOpen((h) => !h)} className="rounded-full border px-1.5 text-[10px] font-bold" style={{ borderColor: C.cyan, color: C.cyan }} title="How this designer works">?</button>
      </div>
      {helpOpen && (
        <div data-arch-help-panel className="rounded border p-2 text-[10px] leading-relaxed" style={{ borderColor: C.cyan, background: "#070b12", color: C.text }}>
          <div className="mb-1 font-bold" style={{ color: C.cyan }}>How to design this room</div>
          <ul className="ml-3 list-disc space-y-0.5" style={{ color: C.dim }}>
            <li><span style={{ color: C.text }}>Place:</span> tap a palette item (grouped by system) then tap the floor, or drag it onto the 2D plan.</li>
            <li><span style={{ color: C.text }}>Move:</span> drag on the plan, or select an item and use the ↑↓←→ <span style={{ color: C.text }}>nudge pad</span> — tap the step to switch 1&quot; / 6&quot; / 1&apos;. Items can never leave the room.</li>
            <li><span style={{ color: C.text }}>Resize:</span> tap <span style={{ color: C.violet }}>Size</span> to cycle standard sizes (beds, doors, windows), or tap a cyan <span style={{ color: C.cyan }}>dimension ✎</span> on the plan (R.O. cycles size, O.C. nudges along the wall).</li>
            <li><span style={{ color: C.text }}>Doors &amp; windows</span> slide along their wall; pick standard sizes/heights from Size.</li>
            <li><span style={{ color: C.text }}>Systems:</span> outlets show on the walls at 1.5&apos; AFF; water/sewer/wire/duct runs draw in 2D + 3D with total lengths.</li>
            <li><span style={{ color: C.text }}>Bill of Materials</span> lists purchasable, quotable quantities (pipe/wire/duct ft, outlets, fixtures).</li>
            <li><span style={{ color: C.text }}>Views:</span> two panes, each 2D or 3D at its own angle — left-drag pan · right-drag rotate/tilt · pinch/scroll zoom (same feel as Mission-Planning).</li>
          </ul>
        </div>
      )}

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
          {/* BOTTOM pane — independent view + camera/angle · North-lock shares the TOP pane's bearing/camera so both rotate together */}
          <div className="relative">
            {paneHeader(bottomView, setBottomView, rotB, camB.reset)}
            {bottomView === "2D"
              ? plan2D(linkView ? bearing2d : bearingB, linkView ? setBearing2d : setBearingB, false)
              : voxel3D(linkView ? cam : camB)}
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
                render={(s) => (mainView === "2D" ? voxel3D(linkView ? cam : camB, s) : plan2D(linkView ? bearing2d : bearingB, linkView ? setBearing2d : setBearingB, false, s))} />
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

      {/* ELEMENTS — merged Active list + Selected detail (operator IMG_7544): the room's items list on top (~1/3,
          scrolls when one is selected), the SELECTED item's full controls expand below (~2/3). Scoped to THIS room's
          objects (bedroom mode → only bedroom items). Click a row to select → details expand; click again to deselect. */}
      {objects.length > 0 && (
        <div data-arch-room-active className="rounded border p-1" style={{ borderColor: C.border, background: "#070b12" }}>
          <div className="mb-1 flex items-center justify-between px-0.5 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>
            <span>Elements · {objects.length}</span>{sel && <span style={{ color: C.gold }}>1 selected</span>}
          </div>
          {/* list — shrinks to a scroll pane when an item is selected so the detail gets the bottom ~2/3 */}
          <div className="flex flex-col gap-0.5 overflow-y-auto" style={sel ? { maxHeight: 88 } : undefined}>
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
                  <span className="shrink-0 tabular-nums" style={{ color: C.dim, fontSize: 8 }}>{fmt(fp.w)}×{fmt(fp.d)}×{fmt(heightOf(o))}′ · {fmt(o.gx)},{fmt(o.gy)}</span>
                </button>
              );
            })}
          </div>
          {/* SELECTED detail — expands in the bottom ~2/3 (dims · wall · size · rotate · delete · nudge pad) */}
          {sel && (() => {
            const SelIcon = ICON[sel.kind];
            const fp = footprintOf(sel);
            const vs = VARIANTS[sel.kind];
            const vLabel = vs?.find((v) => v.id === sel.variant)?.label;
            const selSpec = OBJECT_SPEC[sel.kind];
            return (
              <div data-arch-roomobj-detail className="mt-1 flex flex-wrap items-center gap-2 border-t pt-1.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>
                <span className="flex items-center gap-1 font-semibold" style={{ color: C.gold }}><SelIcon className="h-3.5 w-3.5" /> {vLabel ? `${vLabel} ` : ""}{selSpec.label}</span>
                <span data-arch-roomobj-dims style={{ color: C.dim }}>{ftIn(fp.w)} W × {ftIn(fp.d)} D × {ftIn(heightOf(sel))} H</span>
                {selSpec.onWall && <span data-arch-roomobj-wall className="rounded border px-1 py-0.5" style={{ borderColor: C.border, color: C.cyan }}>{wallOf(sel.gx, sel.gy)} wall</span>}
                {vs && (
                  <button data-arch-roomobj-size onClick={() => commit(cycleVariant(objects, sel.id))} className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.violet }}>
                    Size: {vLabel ?? "—"} ↻
                  </button>
                )}
                <button data-arch-roomobj-rotate onClick={() => commit(rotateObject(objects, sel.id))} className="flex items-center gap-1 rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.cyan }}><RotateCw className="h-3 w-3" /> Rotate</button>
                <button data-arch-roomobj-delete onClick={() => { commit(removeObject(objects, sel.id)); setSelId(null); }} className="flex items-center gap-1 rounded border px-2 py-0.5" style={{ borderColor: C.border, color: "#f87171" }}><Trash2 className="h-3 w-3" /> Delete</button>
                {/* FIX-B — spatial nudge pad (arrows + ft/in step), Mission-Planning asset-planning style */}
                <span data-arch-nudge className="flex items-center gap-0.5 rounded border px-1 py-0.5" style={{ borderColor: C.border }} title={`Nudge the selected item by the chosen step; tap the step to change 1" / 6" / 1'`}>
                  <button data-arch-nudge-step onClick={() => setNudgeIx((i) => (i + 1) % NUDGE_STEPS_FT.length)} className="rounded px-1 text-[9px] font-bold tabular-nums" style={{ color: C.gold }}>{NUDGE_STEPS_FT[nudgeIx].label}</button>
                  {(() => { const step = NUDGE_STEPS_FT[nudgeIx].ft; return (<>
                    <button data-arch-nudge-up onClick={() => commit(nudgeObject(objects, sel.id, 0, -step))} title="Move up (N)" className="rounded p-0.5" style={{ color: C.cyan }}><ArrowUp className="h-3 w-3" /></button>
                    <button data-arch-nudge-down onClick={() => commit(nudgeObject(objects, sel.id, 0, step))} title="Move down (S)" className="rounded p-0.5" style={{ color: C.cyan }}><ArrowDown className="h-3 w-3" /></button>
                    <button data-arch-nudge-left onClick={() => commit(nudgeObject(objects, sel.id, -step, 0))} title="Move left (W)" className="rounded p-0.5" style={{ color: C.cyan }}><ArrowLeft className="h-3 w-3" /></button>
                    <button data-arch-nudge-right onClick={() => commit(nudgeObject(objects, sel.id, step, 0))} title="Move right (E)" className="rounded p-0.5" style={{ color: C.cyan }}><ArrowRight className="h-3 w-3" /></button>
                  </>); })()}
                </span>
                <button data-arch-roomobj-deselect onClick={() => setSelId(null)} className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.dim }}>Done</button>
                <span style={{ color: C.dim }}>· drag or nudge to move</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* FIX-10 — BILL OF MATERIALS: purchasable quote line items. Sits BELOW Active Elements and defaults to a SINGLE
          line (header + count), expandable so it doesn't take the whole screen (operator IMG_7596). */}
      {objects.length > 0 && (() => {
        const bom = roomBom(objects, outlets);
        return (
          <div data-arch-bom className="rounded border" style={{ borderColor: C.border, background: "#070b12" }}>
            <button data-arch-bom-toggle onClick={() => setBomOpen((o) => !o)}
              className="flex w-full items-center justify-between px-2 py-1 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>
              <span>Bill of Materials · quote</span>
              <span className="flex items-center gap-1"><span style={{ color: C.cyan }}>{bom.totalLineItems} items</span><span>{bomOpen ? "▾" : "▸"}</span></span>
            </button>
            {bomOpen && (
              <div className="flex flex-col gap-0.5 border-t px-1 pb-1 pt-1" style={{ borderColor: C.border }}>
                {bom.lines.map((l) => (
                  <div key={l.id} data-arch-bom-line className="flex items-center justify-between px-1 text-[9px]" style={{ color: C.text }}>
                    <span className="min-w-0 flex-1 truncate"><span style={{ color: C.dim }}>{l.category}</span> · {l.item}</span>
                    <span className="shrink-0 tabular-nums" style={{ color: C.cyan }}>{l.unit === "ft" ? `${l.qty} ft` : `${l.qty} ea`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* S9 — GUIDED DEMO: a narrated walkthrough of the full capability set (layout→structural→electric→water→
          sewer→HVAC). Read-only narration of the pure runPlaytest() engine; drives no other state. */}
      <div data-arch-playtest className="rounded border" style={{ borderColor: C.border, background: "#070b12" }}>
        <button data-arch-playtest-toggle onClick={() => { setDemoOpen((o) => !o); setDemoStep(0); }}
          className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold" style={{ color: C.cyan }}>
          <span>▶ Guided demo — what’s possible</span>
          <span style={{ color: C.dim }}>{demoOpen ? "▾" : "▸"}</span>
        </button>
        {demoOpen && (() => {
          const frames = runPlaytest(undefined, outlets);
          const i = Math.max(0, Math.min(frames.length - 1, demoStep));
          const f = frames[i];
          const T = f.totals;
          return (
            <div className="border-t px-2 py-1.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>
              {/* progress dots — one per system */}
              <div className="mb-1 flex items-center gap-1">
                {PLAYTEST_SYSTEMS.map((s, k) => (
                  <span key={s} title={s} className="h-1.5 flex-1 rounded" style={{ background: k <= i ? C.cyan : C.border }} />
                ))}
              </div>
              <div className="font-semibold" style={{ color: C.gold }}>{i + 1}/{frames.length} · {f.step.title}</div>
              <div className="mt-0.5" style={{ color: C.dim }}>{f.step.detail}</div>
              {/* live totals for the systems active at this step (numbers equal the real designer's) */}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px]">
                {f.toggles.water && <span style={{ color: MEP_COL.water }}>Water {T.waterFt} ft</span>}
                {f.toggles.sewer && <span style={{ color: MEP_COL.sewer }}>Sewer {T.sewerFt} ft</span>}
                {f.toggles.electric && <span style={{ color: MEP_COL.wiring }}>Wire {T.wireFt} ft · {T.circuits} circ · {T.amps}A</span>}
                {f.toggles.hvac && <span style={{ color: MEP_COL.duct }}>Duct {T.ductFt} ft</span>}
                {f.toggles.structural && <span style={{ color: "#8899aa" }}>Structural shell shown</span>}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <button data-arch-playtest-prev onClick={() => setDemoStep(Math.max(0, i - 1))} disabled={i === 0}
                  className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: i === 0 ? C.border : C.dim }}>‹ Prev</button>
                <button data-arch-playtest-next onClick={() => setDemoStep(Math.min(frames.length - 1, i + 1))} disabled={i === frames.length - 1}
                  className="rounded border px-2 py-0.5" style={{ borderColor: C.cyan, color: i === frames.length - 1 ? C.border : C.cyan }}>Next ›</button>
                <span style={{ color: C.dim }}>· {f.objects.length} elements placed</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
