"use client";
/**
 * ARCHITECT-2525 · WALKTHROUGH — a real first-person interior view (operator 2026-11-04: "walk through doesn't work …
 * this is your chance to build out walk through functionality"; earlier: "walk floors … immersion view and look around
 * to see walls, corners"). The previous "walk" was the voxel dollhouse tilted into a corner — not a walkthrough.
 *
 * This is a purpose-built pinhole camera (not the map-tilt sceneProject, which clips when the eye is inside the box).
 * You STAND IN THE ROOM'S DOORWAY looking in: the eye sits just outside the near (south) wall, so every point of the
 * room is in front of the eye — no near-plane clipping, ever. Drag to look around (yaw + pitch); the room's four walls,
 * floor grid, ceiling edge and corners render in true perspective; a doorway (with the neighbour's name) is drawn on
 * each wall that has an adjoining room; the step pad walks you room to room through the 3×3. Pure SVG, no 3D engine.
 *
 * Reuse: the FACE_SHADE idea from room-designer (solid shaded faces) + the RoomCell grid from room-layout. Geometry is
 * local to one 10×10×10 room (STOREY ceiling), identical per room except which walls carry a door and the labels.
 */
import { useRef, useState, useCallback, type PointerEvent as RPE } from "react";
import type { RoomCell } from "@/lib/room-layout";
import { footprintOf, heightOf, elevOf, OBJECT_SPEC, defaultObjectsForRoom } from "@/lib/room-objects";
import { shade, FACE_SHADE, solidFaces, boxFaces, type Vec3, type Quad } from "@/lib/solid-shade";
import { WalkRaster, LookGlyph, MoveChevron, DoorGlyph } from "./architect-walk-icons";

const C = { bg: "#0a0f16", ink: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400", wall: "#2a3a4f", floor: "#121b26", ceil: "#0c131c", edge: "#1e2b3a" };
const ROOM_FT = 10, CEIL_FT = 10, EYE_FT = 5.5;      // one storey; eye at ~5.5 ft
const DOOR_W = 3.2, DOOR_H = 7;                       // a 3.2×7 ft opening

type V3 = Vec3;

export function ArchitectWalkthrough({ room, layout, onStep, height = 380, title }: {
  room?: RoomCell | null; layout: RoomCell[]; onStep?: (dRow: number, dCol: number) => void; height?: number; title?: string;
}) {
  const W = 760, H = Math.max(240, height);
  const [yaw, setYaw] = useState(0);      // radians; 0 = facing into the room (+y / north)
  const [pitch, setPitch] = useState(0);  // radians; + looks up
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  const onDown = (e: RPE) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, yaw, pitch }; };
  const onMove = useCallback((e: RPE) => {
    const d = drag.current; if (!d) return;
    const ny = d.yaw + (e.clientX - d.x) * 0.006;        // turn
    const np = d.pitch - (e.clientY - d.y) * 0.006;      // look up/down (screen up = look up)
    setYaw(Math.max(-1.4, Math.min(1.4, ny)));           // ±80°
    setPitch(Math.max(-0.7, Math.min(0.7, np)));         // ±40°
  }, []);
  const onUp = (e: RPE) => { (e.target as Element).releasePointerCapture?.(e.pointerId); drag.current = null; };

  // Pinhole camera. Eye just OUTSIDE the near (south) wall, centred, at eye height, looking +y into the room.
  const ex = ROOM_FT / 2, ey = -2, ez = EYE_FT;
  const fov = (72 * Math.PI) / 180, f = (W / 2) / Math.tan(fov / 2), near = 0.4;
  const cy0 = Math.cos(yaw), sy0 = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const project = (p: V3): { x: number; y: number; depth: number } | null => {
    const dx = p[0] - ex, dy = p[1] - ey, dz = p[2] - ez;
    const cx = dx * cy0 + dy * sy0;          // right
    const cyf = -dx * sy0 + dy * cy0;        // forward (pre-pitch)
    const depth = cyf * cp + dz * sp;
    const up = -cyf * sp + dz * cp;
    if (!(depth > near)) return null;
    return { x: W / 2 + (cx / depth) * f, y: H * 0.5 - (up / depth) * f, depth };
  };
  const poly = (pts: V3[]) => { const ps = pts.map(project); if (ps.some((p) => !p)) return null; return { d: ps.map((p) => `${p!.x.toFixed(1)},${p!.y.toFixed(1)}`).join(" "), depth: ps.reduce((s, p) => s + p!.depth, 0) / ps.length }; };

  // adjacency → which walls carry a door, + the neighbour label
  const at = (r: number, c: number) => layout.find((x) => x.row === r && x.col === c);
  const nb = room ? { N: at(room.row - 1, room.col), E: at(room.row, room.col + 1), W: at(room.row, room.col - 1) } : { N: undefined, E: undefined, W: undefined };

  // ── the room shell + its furniture, shaded through the ONE shared solid-faces shader (lib/solid-shade.ts, the same
  //    function behind the Mission-Planning radar dome and the room voxel). Walls AND objects feed ONE solidFaces()
  //    call → one painter-sorted array, so a sofa correctly occludes / is occluded by a wall and both shade alike. ──
  const wallQuads: Quad[] = [
    { kind: "floor", color: C.floor, pts: [[0, 0, 0], [ROOM_FT, 0, 0], [ROOM_FT, ROOM_FT, 0], [0, ROOM_FT, 0]] },
    { kind: "front", color: C.wall, pts: [[0, ROOM_FT, 0], [ROOM_FT, ROOM_FT, 0], [ROOM_FT, ROOM_FT, CEIL_FT], [0, ROOM_FT, CEIL_FT]] }, // far / north
    { kind: "side", color: C.wall, pts: [[0, 0, 0], [0, ROOM_FT, 0], [0, ROOM_FT, CEIL_FT], [0, 0, CEIL_FT]] },                          // west / left
    { kind: "side", color: C.wall, pts: [[ROOM_FT, 0, 0], [ROOM_FT, ROOM_FT, 0], [ROOM_FT, ROOM_FT, CEIL_FT], [ROOM_FT, 0, CEIL_FT]] },  // east / right
    { kind: "ceil", color: C.wall, pts: [[0, 0, CEIL_FT], [ROOM_FT, 0, CEIL_FT], [ROOM_FT, ROOM_FT, CEIL_FT], [0, ROOM_FT, CEIL_FT]] },
  ];
  // FURNITURE — each placed object as a shaded box from the SAME source the 2D plan + the voxel use
  // (room.objects ?? defaultObjectsForRoom), reusing room-objects' footprint/height/elev; coords are feet in the
  // room's 10×10 space (the 1-ft object grid == feet here).
  const objects = room ? (room.objects ?? defaultObjectsForRoom(room.k)) : [];
  const furnQuads: Quad[] = objects.flatMap((o) => {
    const fp = footprintOf(o); const swap = o.rot === 90 || o.rot === 270;
    const w = swap ? fp.d : fp.w, dp = swap ? fp.w : fp.d;
    return boxFaces(o.gx + 0.5 - w / 2, o.gy + 0.5 - dp / 2, elevOf(o), w, dp, heightOf(o), OBJECT_SPEC[o.kind]?.color);
  });
  const faces = solidFaces([...wallQuads, ...furnQuads], project);

  // floor grid lines (1-ft)
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i <= ROOM_FT; i++) {
    const a = project([i, 0, 0]), b = project([i, ROOM_FT, 0]); if (a && b) gridLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    const c = project([0, i, 0]), d = project([ROOM_FT, i, 0]); if (c && d) gridLines.push({ x1: c.x, y1: c.y, x2: d.x, y2: d.y });
  }
  // vertical corner edges (emphasised — "see corners")
  const corners: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const [cxp, cyp] of [[0, 0], [ROOM_FT, 0], [0, ROOM_FT], [ROOM_FT, ROOM_FT]] as [number, number][]) {
    const a = project([cxp, cyp, 0]), b = project([cxp, cyp, CEIL_FT]); if (a && b) corners.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }

  // doorway on a wall with a neighbour: a dark opening + the neighbour's name above it
  type Door = { d: string; depth: number; label: string; lx: number; ly: number };
  const doors: Door[] = [];
  const addDoor = (corners4: V3[], label: string) => { const q = poly(corners4); const top = project([(corners4[0][0] + corners4[1][0]) / 2, (corners4[0][1] + corners4[1][1]) / 2, DOOR_H + 0.4]); if (q && top) doors.push({ d: q.d, depth: q.depth - 0.01, label, lx: top.x, ly: top.y }); };
  const cxm = ROOM_FT / 2;
  if (nb.N) addDoor([[cxm - DOOR_W / 2, ROOM_FT, 0], [cxm + DOOR_W / 2, ROOM_FT, 0], [cxm + DOOR_W / 2, ROOM_FT, DOOR_H], [cxm - DOOR_W / 2, ROOM_FT, DOOR_H]], nb.N.label);
  if (nb.W) addDoor([[0, cxm - DOOR_W / 2, 0], [0, cxm + DOOR_W / 2, 0], [0, cxm + DOOR_W / 2, DOOR_H], [0, cxm - DOOR_W / 2, DOOR_H]], nb.W.label);
  if (nb.E) addDoor([[ROOM_FT, cxm - DOOR_W / 2, 0], [ROOM_FT, cxm + DOOR_W / 2, 0], [ROOM_FT, cxm + DOOR_W / 2, DOOR_H], [ROOM_FT, cxm - DOOR_W / 2, DOOR_H]], nb.E.label);

  const btn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 30, borderRadius: 7, border: `1px solid ${C.edge}`, background: "#0a0f16cc", color: C.ink, cursor: "pointer" };
  const stepDisabled = (n?: RoomCell) => !n;

  return (
    <div data-arch-walkthrough className="relative select-none overflow-hidden rounded-lg" style={{ height: H, background: `radial-gradient(120% 90% at 50% 25%, #0d1420, ${C.bg})`, border: `1px solid ${C.edge}`, touchAction: "none" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ display: "block", cursor: "grab" }}>
        {faces.map((fc, i) => <polygon key={`f${i}`} points={fc.d} fill={shade(fc.color ?? C.wall, FACE_SHADE[fc.kind])} stroke={fc.kind === "front" || fc.kind === "side" ? C.edge : "none"} strokeWidth={fc.kind === "front" || fc.kind === "side" ? 0.6 : 0} />)}
        {gridLines.map((g, i) => <line key={`g${i}`} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={`${C.cyan}22`} strokeWidth={1} />)}
        {doors.map((d, i) => (
          <g key={`d${i}`}>
            <polygon points={d.d} fill="#05070c" stroke={C.cyan} strokeWidth={1.2} />
            <text x={d.lx} y={d.ly} fill={C.cyan} fontSize={11} textAnchor="middle" style={{ fontFamily: "ui-monospace, Consolas, monospace" }}>{d.label}</text>
          </g>
        ))}
        {corners.map((c, i) => <line key={`c${i}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke={`${C.cyan}55`} strokeWidth={1.4} />)}
      </svg>

      {/* current-room HUD (operator's WALK MODE raster, no emoji) */}
      <div data-arch-walk-room className="absolute left-2 top-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold" style={{ borderColor: C.cyan, color: C.cyan, background: "#0a0f16ee" }}>
        <WalkRaster size={16} /> {room ? `${room.k} · ${room.label}` : "—"}
      </div>
      {/* look-around hint (custom LookGlyph) */}
      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px]" style={{ borderColor: C.edge, color: C.dim, background: "#0a0f16cc" }}>
        <LookGlyph size={13} /> drag to look
      </div>
      {/* step pad — walk room to room (custom MoveChevron, no emoji) */}
      <div data-arch-walkpad className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 rounded-lg border p-1.5" style={{ borderColor: C.cyan, background: "#0a0f16ee" }}>
        <button data-arch-walk-n disabled={stepDisabled(nb.N)} onClick={() => onStep?.(-1, 0)} style={{ ...btn, opacity: nb.N ? 1 : 0.3 }} aria-label={`Walk north${nb.N ? ` to ${nb.N.label}` : ""}`}><MoveChevron dir="up" size={16} /></button>
        <div className="flex gap-1">
          <button data-arch-walk-w disabled={stepDisabled(nb.W)} onClick={() => onStep?.(0, -1)} style={{ ...btn, opacity: nb.W ? 1 : 0.3 }} aria-label={`Walk west${nb.W ? ` to ${nb.W.label}` : ""}`}><MoveChevron dir="left" size={16} /></button>
          <span style={{ ...btn, border: "none", background: "transparent", color: C.dim }}><DoorGlyph size={15} /></span>
          <button data-arch-walk-e disabled={stepDisabled(nb.E)} onClick={() => onStep?.(0, 1)} style={{ ...btn, opacity: nb.E ? 1 : 0.3 }} aria-label={`Walk east${nb.E ? ` to ${nb.E.label}` : ""}`}><MoveChevron dir="right" size={16} /></button>
        </div>
        <button data-arch-walk-s disabled={stepDisabled(at(room ? room.row + 1 : -9, room ? room.col : -9))} onClick={() => onStep?.(1, 0)} style={{ ...btn, opacity: (room && at(room.row + 1, room.col)) ? 1 : 0.3 }} aria-label="Walk south"><MoveChevron dir="down" size={16} /></button>
      </div>
      {title ? <div className="absolute bottom-1 right-2 text-[9px]" style={{ color: C.dim }}>{title}</div> : null}
    </div>
  );
}
