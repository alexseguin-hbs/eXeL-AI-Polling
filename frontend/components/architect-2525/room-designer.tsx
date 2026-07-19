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
  OBJECT_SPEC, OBJECT_KINDS, ROOM_GRID, placeObject, moveObject, rotateObject, removeObject,
  type PlacedObject, type ObjectKind,
} from "@/lib/room-objects";
import type { RoomCell } from "@/lib/room-layout";

const C = { border: "#1e2b3a", panel: "#0c1420", dim: "#5f7186", text: "#c8d6e5", cyan: "#19c8cf", gold: "#ffd400", violet: "#c084fc" };
const N = ROOM_GRID; // 10

/** Snap a wall object (window/door) to whichever of the 4 edges is nearest the drop cell. */
function wallSnap(gx: number, gy: number): { gx: number; gy: number } {
  const dLeft = gx, dRight = N - 1 - gx, dTop = gy, dBot = N - 1 - gy;
  const m = Math.min(dLeft, dRight, dTop, dBot);
  if (m === dTop) return { gx, gy: 0 };
  if (m === dBot) return { gx, gy: N - 1 };
  if (m === dLeft) return { gx: 0, gy };
  return { gx: N - 1, gy };
}

export function RoomDesigner({ room, onChange, onBack }: { room: RoomCell; onChange: (o: PlacedObject[]) => void; onBack: () => void }) {
  const objects = room.objects ?? [];
  const [tool, setTool] = useState<ObjectKind | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<string | null>(null);

  // ── 3D CAMERA (Mission-Planning parity) — orbit bearing + tilt pitch + zoom, driven by the SAME gesture
  // model as voxel-house.tsx: ONE finger/drag = orbit + tilt, TWO fingers = pinch-zoom, wheel = zoom
  // (operator IMG_7492/7494/7495: "use same two pinch and rotation to view inside of room as Mission planning 3D map").
  const [bearing, setBearing] = useState(-Math.PI / 4); // classic corner view by default (matches the old static iso)
  const [pitch, setPitch] = useState(34);               // camera tilt (deg from horizontal); 90 = top-down plan
  const [zoom, setZoom] = useState(1);
  const gp = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gpinch = useRef<number | null>(null);
  const clampZoom = (z: number) => Math.max(0.6, Math.min(3.2, z));
  const camDown = (e: React.PointerEvent) => {
    gp.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gp.current.size === 2) gpinch.current = null;
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
  };
  const camMove = (e: React.PointerEvent) => {
    if (!gp.current.has(e.pointerId)) {
      if (e.buttons === 1) { setBearing((b) => b + e.movementX * 0.012); setPitch((p) => Math.max(6, Math.min(90, p - e.movementY * 0.15))); }
      return;
    }
    const prev = gp.current.get(e.pointerId)!;
    gp.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = Array.from(gp.current.values());
    if (a.length >= 2) {
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (gpinch.current) setZoom((z) => clampZoom(z * (d / gpinch.current!)));
      gpinch.current = d;
    } else {
      setBearing((b) => b + (e.clientX - prev.x) * 0.012);
      setPitch((p) => Math.max(6, Math.min(90, p - (e.clientY - prev.y) * 0.15)));
    }
  };
  const camUp = (e: React.PointerEvent) => {
    gp.current.delete(e.pointerId);
    if (gp.current.size < 2) gpinch.current = null;
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
  };
  const camWheel = (e: React.WheelEvent) => { setZoom((z) => clampZoom(z - e.deltaY * 0.0012)); };
  const camReset = () => { setBearing(-Math.PI / 4); setPitch(34); setZoom(1); };

  const cellFromEvent = (e: React.PointerEvent | React.MouseEvent): { gx: number; gy: number } | null => {
    const svg = svgRef.current; if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const gx = Math.floor(((e.clientX - r.left) / r.width) * N);
    const gy = Math.floor(((e.clientY - r.top) / r.height) * N);
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
    return [OX + xw * U * zoom, OY + (yw * sinP - dz * cosP) * U * zoom];
  };
  const floor = [iso(0, 0, 0), iso(N, 0, 0), iso(N, N, 0), iso(0, N, 0)];
  const ceil = [iso(0, 0, N), iso(N, 0, N), iso(N, N, N), iso(0, N, N)];
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");
  // Depth-sort objects so nearer boxes draw last (painter's algorithm as the camera orbits).
  const depthKey = (gx: number, gy: number) => (gx - cx) * sinB + (gy - cy) * cosB;
  const objs3d = [...objects].sort((a, b) => depthKey(a.gx, a.gy) - depthKey(b.gx, b.gy));

  return (
    <div data-arch-room-designer className="flex min-h-0 flex-1 flex-col gap-2">
      {/* header */}
      <div className="flex items-center gap-2">
        <button data-arch-roomdesign-back onClick={onBack} className="rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>← Back to house</button>
        <span className="text-[11px] font-bold" style={{ color: C.gold }}>{room.k} · {room.label}</span>
        <span className="text-[9px]" style={{ color: C.dim }}>10′×10′ · tap a tool, tap the floor</span>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row">
        {/* 2D interactive floor */}
        <div className="w-full lg:w-1/2">
          <svg ref={svgRef} data-arch-roomdesign-2d viewBox="0 0 100 100" className="w-full rounded border" style={{ borderColor: C.cyan, background: "#070b12", aspectRatio: "1 / 1", touchAction: "none" }}
            onPointerMove={svgMove} onPointerUp={svgUp} onPointerCancel={svgUp}>
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
            {/* placed objects */}
            {objects.map((o) => {
              const s = OBJECT_SPEC[o.kind];
              const w = s.w, d = s.d; // footprint in ft (rotation applied via the SVG transform below)
              const cx = o.gx * 10 + 5, cy = o.gy * 10 + 5;
              const on = o.id === selId;
              return (
                <g key={o.id} data-arch-roomobj={o.kind} transform={`rotate(${o.rot} ${cx} ${cy})`} style={{ cursor: "grab" }} onPointerDown={objDown(o.id)}>
                  <rect x={cx - w * 5} y={cy - d * 5} width={w * 10} height={d * 10} rx={1.5}
                    fill={`${s.color}${on ? "55" : "2e"}`} stroke={on ? C.gold : s.color} strokeWidth={on ? 1.4 : 0.8} />
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize={7}>{s.emoji}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 3D voxel mirror — orbit/tilt/pinch (Mission-Planning parity) */}
        <div className="relative w-full lg:w-1/2">
          <svg data-arch-roomdesign-3d viewBox="0 0 260 220" className="w-full rounded border"
            style={{ borderColor: C.cyan, background: "#070b12", aspectRatio: "1 / 1", touchAction: "none", cursor: "grab" }}
            onPointerDown={camDown} onPointerMove={camMove} onPointerUp={camUp} onPointerLeave={camUp} onPointerCancel={camUp} onWheel={camWheel}>
            <polygon points={poly(floor)} fill={`${C.cyan}12`} stroke={`${C.cyan}66`} strokeWidth={1} />
            {[0, 1, 2, 3].map((i) => <line key={i} x1={floor[i][0]} y1={floor[i][1]} x2={ceil[i][0]} y2={ceil[i][1]} stroke={`${C.cyan}44`} strokeWidth={0.8} />)}
            <polygon points={poly(ceil)} fill="none" stroke={`${C.cyan}33`} strokeWidth={0.7} />
            {/* objects as extruded footprints (top face lifted by object height), depth-sorted for the orbit */}
            {objs3d.map((o) => {
              const s = OBJECT_SPEC[o.kind];
              const swap = o.rot === 90 || o.rot === 270;
              const w = swap ? s.d : s.w, d = swap ? s.w : s.d, hgt = Math.max(2, Math.min(7, Math.round((s.w + s.d) / 2)));
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
          </svg>
          {/* NORTH compass (rotates with bearing) + reset — Mission-Planning parity chrome */}
          <div data-arch-roomdesign-compass className="pointer-events-none absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: `${C.cyan}66`, background: "#0a0f16cc" }}>
            <span style={{ display: "inline-block", transform: `rotate(${-bearing}rad)`, color: C.cyan, fontSize: 9, fontWeight: 800 }}>N↑</span>
          </div>
          <button data-arch-roomdesign-reset onClick={camReset} title="Reset view" className="absolute right-1.5 top-1.5 rounded border px-1.5 py-0.5 text-[8px]" style={{ borderColor: C.border, background: "#0a0f16cc", color: C.dim }}>Reset</button>
          <div className="pointer-events-none absolute bottom-1 left-1.5 text-[7px]" style={{ color: C.dim }}>drag orbit · pinch/scroll zoom · 2-finger tilt</div>
        </div>
      </div>

      {/* palette */}
      <div data-arch-roomdesign-palette className="flex flex-wrap gap-1">
        {OBJECT_KINDS.map((k) => {
          const s = OBJECT_SPEC[k], on = tool === k;
          return (
            <button key={k} data-arch-tool={k} onClick={() => setTool(on ? null : k)} title={s.label}
              className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]"
              style={{ borderColor: on ? C.gold : C.border, background: on ? `${C.gold}1e` : "transparent", color: on ? C.gold : C.text }}>
              <span className="text-[12px] leading-none">{s.emoji}</span>{s.label}
            </button>
          );
        })}
      </div>

      {/* selected-object controls */}
      {sel && (
        <div className="flex items-center gap-2 text-[10px]" style={{ color: C.text }}>
          <span style={{ color: C.gold }}>{OBJECT_SPEC[sel.kind].emoji} {OBJECT_SPEC[sel.kind].label}</span>
          <button data-arch-roomobj-rotate onClick={() => onChange(rotateObject(objects, sel.id))} className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.cyan }}>↻ Rotate</button>
          <button data-arch-roomobj-delete onClick={() => { onChange(removeObject(objects, sel.id)); setSelId(null); }} className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: "#f87171" }}>🗑 Delete</button>
          <span style={{ color: C.dim }}>· drag to move</span>
        </div>
      )}
    </div>
  );
}
