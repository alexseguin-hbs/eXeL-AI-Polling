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
import { projectPlaced, OBJECT_SPEC, defaultObjectsForRoom, type PlacedObject } from "@/lib/room-objects";
import { useRCoreGestures } from "./use-rcore-gestures";
import { Compass2525 } from "./compass-2525";
import { useLexicon } from "@/lib/lexicon-context";

const C = { bg: "#070b12", grid: "#13202f", wall: "#c084fc", door: "#ffd400", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400", border: "#1e2b3a" };

// SVG layout: 30-ft plan drawn at 30 units/room inside a padded viewBox (room for dimension lines).
const U = 30;                 // svg units per 10-ft room cell
const PAD = 16;               // margin for the dimension lines/labels
const SIDE = U * TINY_GRID;   // 90 units = 30 ft
const VB = SIDE + PAD * 2;


// ACTUAL placed contents — projects each object the user placed in the room (via the in-room designer) into the room
// cell, so the whole-house plan models what's REALLY inside, matching the entered-room view (operator IMG_7568/7569).
function placedContents(objects: PlacedObject[], rx: number, ry: number, rw: number, rh: number) {
  return objects.map((o, i) => {
    const p = projectPlaced(o, rx, ry, rw, rh);
    const opening = o.kind === "door" || o.kind === "window";
    const col = opening ? (o.kind === "door" ? C.door : C.cyan) : (OBJECT_SPEC[o.kind]?.color ?? C.dim);
    return <rect key={`o${i}`} x={p.x} y={p.y} width={Math.max(0.7, p.w)} height={Math.max(0.7, p.h)} rx={opening ? 0 : 0.6}
      fill={opening ? col : "none"} stroke={col} strokeWidth={opening ? 0.3 : 0.5} opacity={opening ? 0.95 : 0.85} />;
  });
}

export function TinyFloorplan({ layout = TINY_ROOM_LAYOUT, selectedRoomId, onSelectRoom, showFurniture = true }: {
  layout?: RoomCell[]; selectedRoomId?: string | null; onSelectRoom?: (id: string) => void; showFurniture?: boolean;
}) {
  const { t } = useLexicon();
  const x = (col: number) => PAD + col * U;
  const y = (row: number) => PAD + row * U;
  // R-Core interaction (Mission-Planning parity): LEFT-drag pan · RIGHT-drag rotate · pinch/scroll zoom. Flat
  // plan → pitch unused. Bearing (rad) spins the plan under a North compass; tap-to-select survives via `moved`.
  const { bearing, zoom, pan, reset, moved, setBearing, handlers } = useRCoreGestures({ initialZoom: 1, pan: true, cfg: { minZoom: 0.6, maxZoom: 5 } });
  const selectRoom = (id: string) => { if (!moved.current) onSelectRoom?.(id); }; // ignore the tap that trails a gesture
  return (
    <div data-arch-floorplan-wrap className="relative w-full overflow-hidden rounded" style={{ touchAction: "none", background: C.bg }} {...handlers}>
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) rotate(${bearing}rad) scale(${zoom})`, transformOrigin: "center", transition: "none" }}>
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
          <g key={r.id} data-arch-floorplan-room={r.id} onClick={() => selectRoom(r.id)} style={{ cursor: onSelectRoom ? "pointer" : "default" }}>
            <rect x={rx} y={ry} width={rw} height={rh} fill={sel ? `${C.gold}22` : "transparent"} stroke={sel ? C.gold : C.wall} strokeWidth={sel ? 1.2 : 0.7} />
            {(() => {
              // IMG-02 — the whole-house 2D plan reads the SAME source as the 3D voxel + the entered designer:
              // a room's real objects, or its deterministic defaults when untouched. So the 2D plan and the voxel
              // (shown together on Model) always MIRROR — the canned furniture() hint is retired for this one source.
              const objs = r.objects ?? defaultObjectsForRoom(r.k);   // SAME predicate as voxel + designer — an emptied room ([]) stays empty in all three (AsM-caught divergence)
              return (<>
                {Array.from({ length: r.windows }).map((_, wi) => { const wxp = rx + (rw * (wi + 1)) / (r.windows + 1); return <line key={`win${wi}`} x1={wxp - 2.6} y1={ry} x2={wxp + 2.6} y2={ry} stroke={C.cyan} strokeWidth="1.4" />; })}
                {showFurniture && placedContents(objs, rx, ry, rw, rh)}
                <line x1={rx + rw * 0.55} y1={ry + rh} x2={rx + rw * 0.85} y2={ry + rh} stroke={C.bg} strokeWidth="1.6" />
                <path d={`M ${rx + rw * 0.55} ${ry + rh} A ${rw * 0.3} ${rw * 0.3} 0 0 1 ${rx + rw * 0.55} ${ry + rh - rw * 0.3}`} fill="none" stroke={C.door} strokeWidth="0.3" opacity="0.7" />
              </>);
            })()}
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
      </div>
      {/* shared Mission-Planning compass (rotates with the plan; click = snap north) */}
      <Compass2525 bearing={bearing} onNorth={() => setBearing(0)} size={26} className="absolute left-1 top-1 border" style={{ borderColor: `${C.cyan}66` }} />
      {(zoom !== 1 || pan.x !== 0 || pan.y !== 0 || bearing !== 0) && (
        <button data-arch-floorplan-reset onClick={reset} className="absolute bottom-1 left-1 rounded border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider"
          style={{ borderColor: C.border, color: C.dim, background: "#0a0f16cc" }}>⤢ north</button>
      )}
      <div className="pointer-events-none absolute right-1 top-1 text-[8px]" style={{ color: C.dim }}>{t("arch.tiny.tiny_floorplan.l_drag_pan_r_drag_rotate_pinch_zoom")}</div>
    </div>
  );
}
