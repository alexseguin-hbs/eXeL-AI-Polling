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

// Low-fi furniture per room key — thin dim strokes inside the room rect (rx,ry,rw,rh), matching the
// reference plan (bed, bath fixtures, sofa, kitchen counter/island, dining table, desk, laundry). Pure.
function furniture(k: string, rx: number, ry: number, rw: number, rh: number) {
  const F = "#5f7186"; const box = (x: number, y: number, w: number, h: number, r = 0) => <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={F} strokeWidth="0.4" />;
  const cx = rx + rw / 2, cy = ry + rh / 2;
  switch (k) {
    case "M": return <>{box(rx + rw * 0.28, ry + rh * 0.15, rw * 0.44, rh * 0.55, 1)}{box(rx + rw * 0.31, ry + rh * 0.17, rw * 0.16, rh * 0.14)}{box(rx + rw * 0.53, ry + rh * 0.17, rw * 0.16, rh * 0.14)}</>; // bed + 2 pillows
    case "B": return <>{box(rx + rw * 0.12, ry + rh * 0.14, rw * 0.34, rh * 0.24, 2)}<circle cx={rx + rw * 0.72} cy={ry + rh * 0.24} r={rw * 0.09} fill="none" stroke={F} strokeWidth="0.4" />{box(rx + rw * 0.6, ry + rh * 0.55, rw * 0.28, rh * 0.3, 1)}</>; // tub + sink + toilet
    case "C": return <>{[0.2, 0.4, 0.6, 0.8].map((f, i) => <line key={i} x1={rx + rw * 0.15} y1={ry + rh * f} x2={rx + rw * 0.85} y2={ry + rh * f} stroke={F} strokeWidth="0.35" />)}</>; // shelving
    case "L": return <>{box(rx + rw * 0.12, ry + rh * 0.45, rw * 0.5, rh * 0.35, 1)}{box(rx + rw * 0.12, ry + rh * 0.2, rw * 0.18, rh * 0.6, 1)}{box(rx + rw * 0.68, ry + rh * 0.15, rw * 0.2, rh * 0.12)}</>; // sectional sofa + tv
    case "K": return <>{box(rx + rw * 0.12, ry + rh * 0.12, rw * 0.76, rh * 0.16)}{box(rx + rw * 0.3, ry + rh * 0.45, rw * 0.4, rh * 0.28, 1)}<circle cx={rx + rw * 0.24} cy={ry + rh * 0.2} r={rw * 0.05} fill="none" stroke={F} strokeWidth="0.4" /></>; // counter + island + sink
    case "D": return <>{box(rx + rw * 0.32, ry + rh * 0.32, rw * 0.36, rh * 0.36, 1)}{[[0.22, 0.5], [0.78, 0.5], [0.5, 0.22], [0.5, 0.78]].map(([fx, fy], i) => <circle key={i} cx={rx + rw * fx} cy={ry + rh * fy} r={rw * 0.06} fill="none" stroke={F} strokeWidth="0.4" />)}</>; // table + 4 chairs
    case "O": return <>{box(rx + rw * 0.15, ry + rh * 0.18, rw * 0.55, rh * 0.16)}<circle cx={cx} cy={ry + rh * 0.55} r={rw * 0.08} fill="none" stroke={F} strokeWidth="0.4" /></>; // desk + chair
    case "S": return <>{box(rx + rw * 0.18, ry + rh * 0.2, rw * 0.28, rh * 0.28, 1)}{box(rx + rw * 0.54, ry + rh * 0.2, rw * 0.28, rh * 0.28, 1)}<circle cx={rx + rw * 0.32} cy={ry + rh * 0.34} r={rw * 0.07} fill="none" stroke={F} strokeWidth="0.35" /><circle cx={rx + rw * 0.68} cy={ry + rh * 0.34} r={rw * 0.07} fill="none" stroke={F} strokeWidth="0.35" /></>; // washer + dryer
    case "E": return <>{box(rx + rw * 0.34, ry + rh * 0.12, rw * 0.32, rh * 0.2, 1)}</>; // entry mat
    default: return null;
  }
}

export function TinyFloorplan({ layout = TINY_ROOM_LAYOUT, selectedRoomId, onSelectRoom, showFurniture = true }: {
  layout?: RoomCell[]; selectedRoomId?: string | null; onSelectRoom?: (id: string) => void; showFurniture?: boolean;
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
            {showFurniture && furniture(r.k, rx, ry, rw, rh)}
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
