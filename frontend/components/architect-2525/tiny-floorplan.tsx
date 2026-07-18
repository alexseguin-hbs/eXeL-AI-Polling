"use client";

/**
 * ARCHITECT-2525 · TINY HOME 2D FLOOR PLAN — top-down 3×3 of the nine labeled 10'×10' rooms.
 * =================================================================================================
 * The operator's reference (IMG-ref): a top-down plan with room labels, 10'×10' dimensions, door
 * openings, and 30'-0" overall dimension lines. Low-fidelity by design (labeled boxes, not furnished
 * CAD). Renders from the shared TINY_ROOM_LAYOUT so 2D plan, 3D voxel, and P3 cube-modification all
 * read one source. Clicking a room selects it (lifts to the app so the right panel + 3D agree).
 */
import { TINY_ROOM_LAYOUT, ROOM_FT, TINY_GRID, type RoomCell } from "@/lib/room-layout";

const C = { bg: "#070b12", grid: "#13202f", wall: "#c084fc", door: "#ffd400", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400" };

// SVG layout: 30-ft plan drawn at 30 units/room inside a padded viewBox (room for dimension lines).
const U = 30;                 // svg units per 10-ft room cell
const PAD = 16;               // margin for the dimension lines/labels
const SIDE = U * TINY_GRID;   // 90 units = 30 ft
const VB = SIDE + PAD * 2;

export function TinyFloorplan({ layout = TINY_ROOM_LAYOUT, selectedRoomId, onSelectRoom }: {
  layout?: RoomCell[]; selectedRoomId?: string | null; onSelectRoom?: (id: string) => void;
}) {
  const x = (col: number) => PAD + col * U;
  const y = (row: number) => PAD + row * U;
  return (
    <svg data-arch-floorplan viewBox={`0 0 ${VB} ${VB}`} preserveAspectRatio="xMidYMid meet"
      className="w-full rounded" style={{ background: C.bg, aspectRatio: "1 / 1" }}>
      {/* overall 30'-0" dimension lines (top + left) */}
      <line x1={PAD} y1={PAD - 7} x2={PAD + SIDE} y2={PAD - 7} stroke={C.dim} strokeWidth="0.4" />
      <text x={PAD + SIDE / 2} y={PAD - 9} fill={C.dim} fontSize="5" textAnchor="middle">{`${ROOM_FT * TINY_GRID}'-0"`}</text>
      <line x1={PAD - 7} y1={PAD} x2={PAD - 7} y2={PAD + SIDE} stroke={C.dim} strokeWidth="0.4" />
      <text x={PAD - 9} y={PAD + SIDE / 2} fill={C.dim} fontSize="5" textAnchor="middle" transform={`rotate(-90 ${PAD - 9} ${PAD + SIDE / 2})`}>{`${ROOM_FT * TINY_GRID}'-0"`}</text>

      {/* outer shell (exterior wall, cyan like the reference) */}
      <rect x={PAD} y={PAD} width={SIDE} height={SIDE} fill="none" stroke={C.cyan} strokeWidth="1.4" />

      {/* rooms */}
      {layout.map((r) => {
        const sel = selectedRoomId === r.id;
        const rx = x(r.col), ry = y(r.row), rw = U * r.w, rh = U * r.d;
        return (
          <g key={r.id} data-arch-floorplan-room={r.id} onClick={() => onSelectRoom?.(r.id)} style={{ cursor: onSelectRoom ? "pointer" : "default" }}>
            <rect x={rx} y={ry} width={rw} height={rh} fill={sel ? `${C.gold}22` : "transparent"} stroke={sel ? C.gold : C.wall} strokeWidth={sel ? 1.2 : 0.7} />
            {/* door opening — a gold gap on the room's south wall (interior circulation side) */}
            <line x1={rx + rw * 0.55} y1={ry + rh} x2={rx + rw * 0.85} y2={ry + rh} stroke={C.bg} strokeWidth="1.6" />
            <path d={`M ${rx + rw * 0.55} ${ry + rh} A ${rw * 0.3} ${rw * 0.3} 0 0 1 ${rx + rw * 0.55} ${ry + rh - rw * 0.3}`} fill="none" stroke={C.door} strokeWidth="0.3" opacity="0.7" />
            {/* label */}
            <text x={rx + rw / 2} y={ry + rh / 2 - 3} fill={sel ? C.gold : C.text} fontSize="7" fontWeight="700" textAnchor="middle">{r.k}</text>
            <text x={rx + rw / 2} y={ry + rh / 2 + 4} fill={C.dim} fontSize="3.4" textAnchor="middle">{r.label}</text>
            <text x={rx + rw / 2} y={ry + rh / 2 + 9} fill={C.dim} fontSize="3" textAnchor="middle">{`${ROOM_FT * r.w}'×${ROOM_FT * r.d}'`}</text>
          </g>
        );
      })}

      {/* front porch stair off the Entry room (bottom-right), mirroring the reference */}
      {(() => { const e = layout.find((r) => r.k === "E"); if (!e) return null; const ex = x(e.col) + U * e.w * 0.5, ey = y(e.row) + U * e.d;
        return <g data-arch-floorplan-porch>{[0, 1, 2].map((i) => <line key={i} x1={ex - 6} y1={ey + 2 + i * 2.2} x2={ex + 6} y2={ey + 2 + i * 2.2} stroke={C.cyan} strokeWidth="0.5" />)}</g>; })()}
    </svg>
  );
}
