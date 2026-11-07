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
  // Interactive in-room designer placements (#167) — furniture/openings on the 1-ft grid, 2D+3D.
  objects?: import("./room-objects").PlacedObject[];
  // R5b — the standard-layout edition this cell's objects were last written at (see STANDARD_LAYOUT_REV in room-objects);
  // absent = before R5b. Optional + additive: the firewall forbids deleting this file, not extending it.
  layoutRev?: number;
}
/** Kinds a room element editor can step. */
export type ElementKind = "windows" | "doors" | "outlets";
export const ELEMENT_MAX = 8; // clamp (Enki: 0..max, no negative)

export const ROOM_FT = 10;        // each cell edge = 10 ft
export const TINY_GRID = 3;       // 3×3
export const TINY_SIDE_FT = ROOM_FT * TINY_GRID; // 30 ft

/** THE VOXEL PROPORTION LAW (operator 2026-10-31: "remember voxel pixel height and width for 3x3x3 is to be realistically
 * proportional"; 2026-10-25: "3x3x3 shape is same pixels tall, wide, and long"). ONE scale for the plan and every vertical:
 * the land cell (the 30-ft house) is 66 px, so 2.2 px/ft; a storey is one room edge — 10 ft — so the 3×3×3 cube is the HOUSE
 * (3 rooms × 3 rooms × 3 storeys of 10-ft voxels = 30 × 30 × 30 ft = 66 × 66 × 66 px), the house its level 1. Gated by
 * tests/architect-voxel-proportion.test.mjs; STOREY_FT must equal TINY_HOME.ceilingFt (room-program) and the room designer's N. */
export const VOXEL_PX_PER_FT = 66 / TINY_SIDE_FT;   // 2.2 px per foot
export const STOREY_FT = ROOM_FT;                     // 10 ft — one storey = one room edge = one INNER clear ceiling
// THE NESTED CUBE (operator 2026-11-06: "12×12×12 is outer shell to allow for inner of 10×10×10"; "36x36x12 ft is outer
// shell"). INNER clear room 10×10×10 (what you walk) nested in an OUTER structural shell 12×12×12; the 2-ft band is the
// plenum/construction zone where the ducts, roof/joists, above-ceiling insulation and the wall assembly live. The whole
// house is ONE storey (9 rooms on one floor = 900 ft²), so its outer envelope is 36×36×12. ONE source each — the walk,
// MEP, framing and the house-level roof/foundation/overhead all key off these so the cube can never drift back to 8.
export const SHELL_FT = ROOM_FT + 2;                  // 12 ft — per-room OUTER shell edge (1-ft construction each side)
export const PLENUM_FT = SHELL_FT - STOREY_FT;        // 2 ft — the zone ABOVE the 10-ft ceiling (ducts / roof / insulation)
export const HOUSE_FT = TINY_GRID * SHELL_FT;         // 36 ft — whole-house outer width = depth (3 rooms × 12)
export const HOUSE_H = SHELL_FT;                       // 12 ft — whole-house outer height (10 inner clear + 2 plenum), ONE storey
export const STEP_RISE_FT = 7 / 12;                   // a 7-in riser (IRC R311.7.5.1 allows up to 7¾ in)

/** ONE OPENING STANDARD (Wave 0 · P0·I, operator 2026-11-07 via MoT: "DOOR_W=3.2 would print a non-existent 3'-2″"). The walk
 * doorway (architect-walk-nav DOOR_W), the framed rough opening (architect-walk-framing), the walkthrough's door/window planes
 * and every measurement label read THESE numbers — never a local literal. Feet; `ftIn()` prints them as the trade does.
 *  · DOOR_W_FT 3.0   — a 3'-0" (36") leaf: the designer's default door (room-objects DOOR_VARIANTS "d32" = 3'-0" × 6'-8");
 *                      IRC R311.2 requires the egress door ≥ 32" clear width, which a 36" leaf gives (≈33½" clear at 90°).
 *  · DOOR_H_FT 6.67  — a 6'-8" (80") leaf; IRC R311.2 egress door ≥ 78" clear height (80" is the stock leaf height).
 *  · DOOR_RO_H_FT 6.875 — the 82½" rough-opening HEAD over an 80" leaf (leaf + ¾" head jamb + ¾" floor/threshold + shims):
 *                      the framing header's underside (architect-walk-framing HDR_DOOR) — one standard, not a second door height.
 *  · WIN_W_FT 3.6 · WIN_SILL_FT 3 · WIN_HEAD_FT 6.5 — an exterior window ≈3'-7" wide × 3'-6" tall, sill 3'-0" AFF, head 6'-6":
 *                      net clear ≈12.6 ft² ≥ IRC R310.2.1's 5.7 ft² emergency-escape minimum (≥24" high · ≥20" wide); the
 *                      36" sill is under R310.2.2's 44" AFF maximum. Gated by tests/architect-one-source.test.mjs. */
export const OPENING_STD = {
  DOOR_W_FT: 3.0,
  DOOR_H_FT: 6.67,
  DOOR_RO_H_FT: 82.5 / 12,   // 6.875 exactly
  WIN_W_FT: 3.6,
  WIN_SILL_FT: 3,
  WIN_HEAD_FT: 6.5,
} as const;

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

/** F9 STRETCH FENCE (operator 2026-11-07 via MoT P0·I): a 20×10 room was reachable here (max 2) while the walk, framing, MEP and
 * shell libs all draw a hardcoded 10×10 (RF = 10) — so no room may exceed ONE cell, fenced until the WalkSpace contract (Rev K)
 * honours w/d. A caller's own `max` is capped by this too (the fence cannot be bypassed). Gated: tests/architect-one-source.test.mjs. */
export const STRETCH_MAX_CELLS = 1;
/**
 * P3 stretch — resize a room's width/depth in whole 10-ft cells within a clamp. FENCED at STRETCH_MAX_CELLS (1 cell = 10 ft)
 * until the WalkSpace contract (Rev K) honours w/d — was 1..2 (10..20 ft). Pure; feeds layoutSqft so area/cost track the change.
 */
export function resizeRoomInLayout(layout: RoomCell[], id: string, w: number, d: number, max = STRETCH_MAX_CELLS): RoomCell[] {
  const cap = Math.min(max, STRETCH_MAX_CELLS);   // fenced until the WalkSpace contract (Rev K) honours w/d
  const clamp = (n: number) => Math.max(1, Math.min(cap, Math.round(n)));
  return layout.map((r) => (r.id === id ? { ...r, w: clamp(w), d: clamp(d) } : r));
}

/** Enter a room → optimize it only: step one element (windows/doors/outlets) by ±delta, clamped 0..ELEMENT_MAX. Pure. */
/** Replace a room's interactive-designer object list (#167). Pure; returns a new layout. */
export function setRoomObjects(layout: RoomCell[], id: string, objects: import("./room-objects").PlacedObject[]): RoomCell[] {
  return layout.map((r) => (r.id === id ? { ...r, objects } : r));
}

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
