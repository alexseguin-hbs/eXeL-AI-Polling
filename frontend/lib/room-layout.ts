/**
 * ARCHITECT-2525 · ROOM LAYOUT — the Tiny Home's nine rooms as a real, movable/stretchable model.
 * =================================================================================================
 * Single source of truth for the 3×3 Tiny Home grid (operator's finalized design), shared by the 2D
 * floor plan (tiny-floorplan.tsx), the 3D voxel (voxel-house.tsx), and — from P3 — cube modification
 * (move/swap/stretch). Positions are grid cells (row,col) on a 3×3; size is in 10-ft cells (w×d),
 * so a room can later stretch within the 10-ft envelope the operator asked for. Pure data + helpers,
 * deterministic, no React — so it serialises straight into the workspace snapshot.
 */
export interface RoomCell {
  id: string;   // stable id (persists across moves)
  k: string;    // one-letter key shown on the map (M/B/C/L/K/D/O/S/E)
  label: string;
  row: number;  // 0..2 (top→bottom, north→south)
  col: number;  // 0..2 (left→right, west→east)
  w: number;    // width in 10-ft cells (1 = 10 ft) — for P3 stretch
  d: number;    // depth in 10-ft cells (1 = 10 ft)
}

export const ROOM_FT = 10;        // each cell edge = 10 ft
export const TINY_GRID = 3;       // 3×3
export const TINY_SIDE_FT = ROOM_FT * TINY_GRID; // 30 ft

/** Finalized Tiny Home (operator design) — index = row*3 + col, read top→bottom / left→right. */
export const TINY_ROOM_LAYOUT: RoomCell[] = [
  { id: "master-bed", k: "M", label: "Master Bedroom", row: 0, col: 0, w: 1, d: 1 },
  { id: "master-bath", k: "B", label: "Master Bath", row: 0, col: 1, w: 1, d: 1 },
  { id: "master-closet", k: "C", label: "Master Closet", row: 0, col: 2, w: 1, d: 1 },
  { id: "living", k: "L", label: "Living Room", row: 1, col: 0, w: 1, d: 1 },
  { id: "kitchen", k: "K", label: "Kitchen", row: 1, col: 1, w: 1, d: 1 },
  { id: "dining", k: "D", label: "Dining Room", row: 1, col: 2, w: 1, d: 1 },
  { id: "office", k: "O", label: "Office", row: 2, col: 0, w: 1, d: 1 },
  { id: "storage", k: "S", label: "Storage · Laundry", row: 2, col: 1, w: 1, d: 1 },
  { id: "entry", k: "E", label: "Entry · Porch", row: 2, col: 2, w: 1, d: 1 },
];

/** Deep copy — callers mutate their own layout, never the shared default. */
export function cloneLayout(layout: RoomCell[] = TINY_ROOM_LAYOUT): RoomCell[] {
  return layout.map((r) => ({ ...r }));
}

/** The room occupying a grid cell, if any (P3 move/swap collision checks). */
export function roomAt(layout: RoomCell[], row: number, col: number): RoomCell | undefined {
  return layout.find((r) => r.row === row && r.col === col);
}

/** Total conditioned area (ft²) from the room cells — feeds sqft when rooms stretch (P3). */
export function layoutSqft(layout: RoomCell[]): number {
  return layout.reduce((sum, r) => sum + r.w * r.d * ROOM_FT * ROOM_FT, 0);
}

/**
 * P3 cube modification — move a room by (dRow,dCol) within the 3×3 footprint, SWAPPING with whatever
 * room it displaces so the grid stays full (adjacency only → cost unchanged). Out-of-bounds is a no-op.
 * Pure: returns a new layout, never mutates the input.
 */
export function moveRoomInLayout(layout: RoomCell[], id: string, dRow: number, dCol: number): RoomCell[] {
  const cur = layout.find((r) => r.id === id);
  if (!cur) return layout;
  const nr = cur.row + dRow, nc = cur.col + dCol;
  if (nr < 0 || nr >= TINY_GRID || nc < 0 || nc >= TINY_GRID) return layout; // clamp to footprint
  const other = layout.find((r) => r.row === nr && r.col === nc);
  return layout.map((r) =>
    r.id === cur.id ? { ...r, row: nr, col: nc }
    : other && r.id === other.id ? { ...r, row: cur.row, col: cur.col }
    : r);
}

/**
 * P3 stretch — resize a room's width/depth in whole 10-ft cells within a clamp (default 1..2 = 10..20 ft),
 * the "within 10 ft" envelope the operator asked for. Pure; feeds layoutSqft so area/cost track the change.
 */
export function resizeRoomInLayout(layout: RoomCell[], id: string, w: number, d: number, max = 2): RoomCell[] {
  const clamp = (n: number) => Math.max(1, Math.min(max, Math.round(n)));
  return layout.map((r) => (r.id === id ? { ...r, w: clamp(w), d: clamp(d) } : r));
}
