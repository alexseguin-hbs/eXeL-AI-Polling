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
  // Adjustable key elements of the 10×10 cube (operator: enter a room → optimize it only).
  windows: number; doors: number; outlets: number; furniture: boolean;
}
/** Kinds a room element editor can step. */
export type ElementKind = "windows" | "doors" | "outlets";
export const ELEMENT_MAX = 8; // clamp (Enki: 0..max, no negative)

export const ROOM_FT = 10;        // each cell edge = 10 ft
export const TINY_GRID = 3;       // 3×3
export const TINY_SIDE_FT = ROOM_FT * TINY_GRID; // 30 ft

/** Finalized Tiny Home (operator design) — index = row*3 + col, read top→bottom / left→right.
 * Element seeds: perimeter rooms get a window; the center Kitchen has no exterior wall (0). */
export const TINY_ROOM_LAYOUT: RoomCell[] = [
  { id: "master-bed", k: "M", label: "Master Bedroom", row: 0, col: 0, w: 1, d: 1, windows: 2, doors: 1, outlets: 4, furniture: true },
  { id: "master-bath", k: "B", label: "Master Bath", row: 0, col: 1, w: 1, d: 1, windows: 1, doors: 1, outlets: 2, furniture: true },
  { id: "master-closet", k: "C", label: "Master Closet", row: 0, col: 2, w: 1, d: 1, windows: 1, doors: 1, outlets: 2, furniture: true },
  { id: "living", k: "L", label: "Living Room", row: 1, col: 0, w: 1, d: 1, windows: 2, doors: 1, outlets: 4, furniture: true },
  { id: "kitchen", k: "K", label: "Kitchen", row: 1, col: 1, w: 1, d: 1, windows: 0, doors: 1, outlets: 4, furniture: true },
  { id: "dining", k: "D", label: "Dining Room", row: 1, col: 2, w: 1, d: 1, windows: 1, doors: 1, outlets: 3, furniture: true },
  { id: "office", k: "O", label: "Office", row: 2, col: 0, w: 1, d: 1, windows: 1, doors: 1, outlets: 4, furniture: true },
  { id: "storage", k: "S", label: "Storage · Laundry", row: 2, col: 1, w: 1, d: 1, windows: 0, doors: 1, outlets: 2, furniture: true },
  { id: "entry", k: "E", label: "Entry · Porch", row: 2, col: 2, w: 1, d: 1, windows: 1, doors: 2, outlets: 1, furniture: true },
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

/** Enter a room → optimize it only: step one element (windows/doors/outlets) by ±delta, clamped 0..ELEMENT_MAX. Pure. */
export function setRoomElement(layout: RoomCell[], id: string, kind: ElementKind, delta: number): RoomCell[] {
  return layout.map((r) => (r.id === id ? { ...r, [kind]: Math.max(0, Math.min(ELEMENT_MAX, r[kind] + delta)) } : r));
}
/** Toggle a room's furniture on/off. Pure. */
export function toggleRoomFurniture(layout: RoomCell[], id: string): RoomCell[] {
  return layout.map((r) => (r.id === id ? { ...r, furniture: !r.furniture } : r));
}
/** House totals = Σ per-room elements (the metric strip reads REAL counts, not a formula). */
export function layoutTotals(layout: RoomCell[]): { rooms: number; windows: number; doors: number; outlets: number; sqft: number } {
  return {
    rooms: layout.length,
    windows: layout.reduce((s, r) => s + r.windows, 0),
    doors: layout.reduce((s, r) => s + r.doors, 0),
    outlets: layout.reduce((s, r) => s + r.outlets, 0),
    sqft: layoutSqft(layout),
  };
}

/**
 * The repeatable, serializable MODULE (R-Core doctrine) — the durable boundary the UI edits today and the
 * SoI Innovation pipeline (MoT · Trinity · approval · quote-lock · team build) consumes tomorrow.
 */
export interface RoomModule { version: 1; sideFt: number; rooms: RoomCell[]; totals: ReturnType<typeof layoutTotals>; hash: string; }
/** Deterministic id for a layout — same rooms/elements → same hash (a certifiable, repeatable module). */
export function moduleHash(layout: RoomCell[]): string {
  const s = layout.map((r) => `${r.id}:${r.row},${r.col},${r.w}x${r.d}:w${r.windows}d${r.doors}o${r.outlets}f${r.furniture ? 1 : 0}`).join("|");
  let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return "RM" + (h >>> 0).toString(16).padStart(8, "0");
}
export function toRoomModule(layout: RoomCell[]): RoomModule {
  return { version: 1, sideFt: TINY_SIDE_FT, rooms: layout, totals: layoutTotals(layout), hash: moduleHash(layout) };
}
