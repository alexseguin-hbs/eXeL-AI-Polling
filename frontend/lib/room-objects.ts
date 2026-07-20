/**
 * ARCHITECT-2525 · ROOM OBJECTS — the interactive in-room designer model (#167, "better than Minecraft").
 * =================================================================================================
 * When a kid ENTERS a 10×10 room, they place furniture/openings on a 1-ft grid by tapping a palette then a
 * cell. One model drives BOTH views: the 2D floor plan draws the top-down icon, the 3D voxel draws the low-fi
 * wireframe box (voxel-house furnBox) at the same cell. Pure + deterministic (no Math.random — replay law):
 * ids are derived from kind + a running index, so identical actions produce identical layouts.
 */

export const ROOM_GRID = 10; // 10×10 ft floor (1-ft cells), matching a 10'×10' room voxel

export type ObjectKind =
  | "bed" | "sofa" | "counter" | "table" | "desk"
  | "toilet" | "tub" | "sink" | "washer"
  // S3 — context-aware room assets (bedroom → dresser/nightstand/tv/wardrobe, kitchen → fridge/stove, bath → shower …)
  | "dresser" | "nightstand" | "tv" | "fridge" | "stove" | "shower" | "wardrobe" | "bookshelf" | "chair"
  // S3 — structural SHELL system (hex wall panel + roof panel) — the EcoSpheres shell folded into Architect assets
  | "shell" | "roof"
  | "door" | "window";

export type Rot = 0 | 90 | 180 | 270;

/** One placed object on the room floor grid. gx/gy = grid cell (0..9); rot = 0|90|180|270°; variant = size id. */
export interface PlacedObject { id: string; kind: ObjectKind; gx: number; gy: number; rot: Rot; variant?: string; }

/** Size variants (feet) for kinds that come in standard sizes — e.g. beds: Twin/Full/Queen/King (operator example). */
export interface SizeVariant { id: string; label: string; w: number; d: number }
export const BED_VARIANTS: SizeVariant[] = [
  { id: "twin",  label: "Twin",  w: 3.25, d: 6.25 },
  { id: "full",  label: "Full",  w: 4.5,  d: 6.25 },
  { id: "queen", label: "Queen", w: 5,    d: 6.67 },
  { id: "king",  label: "King",  w: 6.33, d: 6.67 },
];
export const VARIANTS: Partial<Record<ObjectKind, SizeVariant[]>> = { bed: BED_VARIANTS };

/**
 * Palette metadata — footprint W×D (ft) + HEIGHT h (ft), display glyph/label, colour, wall-snap flag.
 * h = best real-world approximation so the 3D extrusion reads true (bed low, counter 3', door 6'8", etc.).
 */
export const OBJECT_SPEC: Record<ObjectKind, { label: string; emoji: string; w: number; d: number; h: number; onWall: boolean; color: string }> = {
  bed:     { label: "Bed",     emoji: "🛏", w: 5, d: 6, h: 2,    onWall: false, color: "#c084fc" }, // mattress top ~24"
  sofa:    { label: "Sofa",    emoji: "🛋", w: 5, d: 2, h: 2.8,  onWall: false, color: "#c084fc" }, // back ~33"
  counter: { label: "Counter", emoji: "🍳", w: 4, d: 2, h: 3,    onWall: false, color: "#19c8cf" }, // kitchen counter 36"
  table:   { label: "Table",   emoji: "🍽", w: 4, d: 4, h: 2.5,  onWall: false, color: "#ffd400" }, // dining 30"
  desk:    { label: "Desk",    emoji: "🖥", w: 4, d: 2, h: 2.5,  onWall: false, color: "#c084fc" }, // 29–30"
  toilet:  { label: "Toilet",  emoji: "🚽", w: 2, d: 2, h: 2.5,  onWall: false, color: "#19c8cf" }, // tank ~30"
  tub:     { label: "Tub",     emoji: "🛁", w: 5, d: 2, h: 2,    onWall: false, color: "#19c8cf" }, // rim ~24"
  sink:    { label: "Sink",    emoji: "🚰", w: 2, d: 2, h: 2.8,  onWall: false, color: "#19c8cf" }, // vanity ~34"
  washer:  { label: "Washer",  emoji: "🧺", w: 2, d: 2, h: 3,    onWall: false, color: "#19c8cf" }, // 36"
  // S3 — context assets (violet = furniture, cyan = appliance/plumbing).
  dresser:   { label: "Dresser",   emoji: "🗄", w: 3,   d: 1.7, h: 3,   onWall: false, color: "#c084fc" },
  nightstand:{ label: "Nightstand",emoji: "🛋", w: 1.5, d: 1.5, h: 2,   onWall: false, color: "#c084fc" },
  tv:        { label: "TV",        emoji: "📺", w: 3.5, d: 0.4, h: 2,   onWall: true,  color: "#c084fc" }, // wall-mounted
  fridge:    { label: "Fridge",    emoji: "🧊", w: 3,   d: 2.7, h: 6,   onWall: false, color: "#19c8cf" },
  stove:     { label: "Stove",     emoji: "🔥", w: 2.5, d: 2.5, h: 3,   onWall: false, color: "#19c8cf" },
  shower:    { label: "Shower",    emoji: "🚿", w: 3,   d: 3,   h: 7,   onWall: false, color: "#19c8cf" },
  wardrobe:  { label: "Wardrobe",  emoji: "🚪", w: 4,   d: 2,   h: 7,   onWall: false, color: "#c084fc" },
  bookshelf: { label: "Bookshelf", emoji: "📚", w: 3,   d: 1,   h: 6,   onWall: false, color: "#c084fc" },
  chair:     { label: "Chair",     emoji: "🪑", w: 1.7, d: 1.7, h: 2.8, onWall: false, color: "#c084fc" },
  // S3 — structural SHELL system (steel-grey): hex wall panel + roof panel.
  shell:     { label: "Shell Panel",emoji: "⬡", w: 4,  d: 0.7, h: 8,   onWall: true,  color: "#8899aa" },
  roof:      { label: "Roof Panel", emoji: "🔺", w: 5,  d: 5,   h: 0.7, onWall: false, color: "#8899aa" },
  door:    { label: "Door",    emoji: "🚪", w: 3, d: 1, h: 6.7,  onWall: true,  color: "#22c55e" }, // 6'8" opening
  window:  { label: "Window",  emoji: "▭",  w: 3, d: 1, h: 4,    onWall: true,  color: "#19c8cf" }, // ~4' sash
};

export const OBJECT_KINDS = Object.keys(OBJECT_SPEC) as ObjectKind[];

const clampCell = (n: number) => Math.max(0, Math.min(ROOM_GRID - 1, Math.round(n)));

/** Deterministic id from kind + running index (no Math.random → replayable). */
function nextId(objs: PlacedObject[], kind: ObjectKind): string {
  const n = objs.filter((o) => o.kind === kind).length + 1;
  return `${kind}-${n}`;
}

/** Place a new object at (gx,gy), clamped to the 10×10 grid. Returns a NEW array (never mutates). */
export function placeObject(objs: PlacedObject[], kind: ObjectKind, gx: number, gy: number): PlacedObject[] {
  return [...objs, { id: nextId(objs, kind), kind, gx: clampCell(gx), gy: clampCell(gy), rot: 0 }];
}

/** Move an existing object to (gx,gy), clamped. */
export function moveObject(objs: PlacedObject[], id: string, gx: number, gy: number): PlacedObject[] {
  return objs.map((o) => (o.id === id ? { ...o, gx: clampCell(gx), gy: clampCell(gy) } : o));
}

/** Rotate an object 90° clockwise (0→90→180→270→0). */
export function rotateObject(objs: PlacedObject[], id: string): PlacedObject[] {
  return objs.map((o) => (o.id === id ? { ...o, rot: (((o.rot + 90) % 360) as Rot) } : o));
}

/** Footprint (ft) for a placed object — its variant's size when set, else the kind default. */
export function footprintOf(o: PlacedObject): { w: number; d: number } {
  const vs = VARIANTS[o.kind];
  if (vs && o.variant) { const v = vs.find((x) => x.id === o.variant); if (v) return { w: v.w, d: v.d }; }
  return { w: OBJECT_SPEC[o.kind].w, d: OBJECT_SPEC[o.kind].d };
}

/** Cycle an object to its next size variant (no-op for kinds without variants). First cycle sets the 2nd size. */
export function cycleVariant(objs: PlacedObject[], id: string): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const vs = VARIANTS[o.kind]; if (!vs || vs.length === 0) return o;
    const cur = vs.findIndex((v) => v.id === o.variant);
    const idx = cur < 0 ? 0 : (cur + 1) % vs.length;
    return { ...o, variant: vs[idx].id };
  });
}

/** Which wall a cell is nearest (N/S/E/W) — used to LOCK a door/window to its wall while it slides (#S1). */
export type Wall = "N" | "S" | "E" | "W";
export function wallOf(gx: number, gy: number): Wall {
  const dLeft = gx, dRight = ROOM_GRID - 1 - gx, dTop = gy, dBot = ROOM_GRID - 1 - gy;
  const m = Math.min(dLeft, dRight, dTop, dBot);
  if (m === dTop) return "N";
  if (m === dBot) return "S";
  if (m === dLeft) return "W";
  return "E";
}
/** Slide a wall object ALONG the given wall: pin the perpendicular axis, clamp the along-axis to 0..9. */
export function slideAlongWall(wall: Wall, gx: number, gy: number): { gx: number; gy: number } {
  const c = (n: number) => Math.max(0, Math.min(ROOM_GRID - 1, Math.round(n)));
  switch (wall) {
    case "N": return { gx: c(gx), gy: 0 };
    case "S": return { gx: c(gx), gy: ROOM_GRID - 1 };
    case "W": return { gx: 0, gy: c(gy) };
    default:  return { gx: ROOM_GRID - 1, gy: c(gy) };
  }
}

/**
 * S2 — low-fi 3D SHAPE parts. Each part is a sub-box in FRACTIONS (0..1) of the object's local w×d×h box, so the
 * 3D voxel reads as a real object (bed = slab+pillow, sofa = seat+back, desk = top+legs …) instead of a plain box.
 * Pure data (voxel3D just extrudes each part), so it's unit-testable. Kinds without an entry fall back to one full box.
 * Convention: y=0 is the object's "front/head" edge; z=0 is the floor.
 */
export interface ShapePart { x: number; y: number; z: number; w: number; d: number; h: number }
const FULL_BOX: ShapePart[] = [{ x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 }];
const SHAPE_PARTS: Partial<Record<ObjectKind, ShapePart[]>> = {
  bed:    [{ x: 0, y: 0, z: 0, w: 1, d: 1, h: 0.6 }, { x: 0.12, y: 0.02, z: 0.6, w: 0.76, d: 0.24, h: 0.32 }], // mattress + pillow
  sofa:   [{ x: 0, y: 0.34, z: 0, w: 1, d: 0.66, h: 0.5 }, { x: 0, y: 0, z: 0, w: 1, d: 0.34, h: 1 }],        // seat + back
  desk:   [{ x: 0, y: 0, z: 0.82, w: 1, d: 1, h: 0.18 }, { x: 0, y: 0, z: 0, w: 0.08, d: 1, h: 0.82 }, { x: 0.92, y: 0, z: 0, w: 0.08, d: 1, h: 0.82 }], // top + 2 legs
  table:  [{ x: 0, y: 0, z: 0.82, w: 1, d: 1, h: 0.18 }, { x: 0.4, y: 0.4, z: 0, w: 0.2, d: 0.2, h: 0.82 }],  // top + pedestal
  toilet: [{ x: 0.12, y: 0.3, z: 0, w: 0.76, d: 0.7, h: 0.55 }, { x: 0.12, y: 0, z: 0, w: 0.76, d: 0.3, h: 1 }], // bowl + tank
  sink:   [{ x: 0, y: 0, z: 0.58, w: 1, d: 1, h: 0.42 }, { x: 0.35, y: 0.35, z: 0, w: 0.3, d: 0.3, h: 0.58 }], // basin + pedestal
  chair:  [{ x: 0, y: 0.2, z: 0, w: 1, d: 0.8, h: 0.5 }, { x: 0, y: 0, z: 0, w: 1, d: 0.2, h: 1 }],           // seat + back
  tv:     [{ x: 0, y: 0.35, z: 0.1, w: 1, d: 0.5, h: 0.85 }],  // thin screen panel
  window: [{ x: 0, y: 0, z: 0.32, w: 1, d: 1, h: 0.5 }],  // a mid-height sash band (not floor-to-ceiling)
};
/** The low-fi 3D shape of a kind as fractional sub-boxes (S2). Falls back to a single full box. */
export function shapePartsOf(kind: ObjectKind): ShapePart[] { return SHAPE_PARTS[kind] ?? FULL_BOX; }

/**
 * S3 — CONTEXT-AWARE ROOM ASSETS. The SINGLE source mapping each room key (M/B/C/L/K/D/O/S/E — see room-layout) to the
 * furniture/appliances typically used there, so entering a bedroom offers bed·nightstand·dresser·wardrobe·tv·chair, a
 * kitchen offers counter·sink·fridge·stove, etc. (operator: "left selection matches the room"). VERSIONED so future
 * room types EXTEND this map rather than fork it (Odin). Palette = this list + always openings + structural shell.
 */
export const ROOM_ASSETS_VERSION = 1;
export const ROOM_ASSETS: Record<string, ObjectKind[]> = {
  M: ["bed", "nightstand", "dresser", "wardrobe", "tv", "chair"],   // Master Bedroom
  B: ["toilet", "tub", "shower", "sink"],                            // Master Bath
  C: ["wardrobe", "dresser", "bookshelf"],                           // Master Closet
  L: ["sofa", "tv", "table", "chair", "bookshelf"],                  // Living Room
  K: ["counter", "sink", "fridge", "stove"],                         // Kitchen
  D: ["table", "chair", "counter"],                                  // Dining Room
  O: ["desk", "chair", "bookshelf", "tv"],                           // Office
  S: ["washer", "sink", "counter"],                                  // Storage · Laundry
  E: ["chair", "table", "bookshelf"],                                // Entry · Porch
};
/** Openings + structural shell offered in EVERY room (walls, roof, doors, windows exist everywhere). */
export const COMMON_ASSETS: ObjectKind[] = ["door", "window", "shell", "roof"];
/** General fallback palette for an unknown room key — a broad furniture set. */
const GENERAL_ASSETS: ObjectKind[] = ["bed", "sofa", "counter", "table", "desk", "chair", "toilet", "sink"];
/** The palette for a room: its context assets (or a general set) + the common openings/shell, de-duplicated (S3). */
export function paletteForRoom(roomKey: string): ObjectKind[] {
  const base = ROOM_ASSETS[roomKey] ?? GENERAL_ASSETS;
  const seen = new Set<ObjectKind>();
  const out: ObjectKind[] = [];
  for (const k of [...base, ...COMMON_ASSETS]) if (!seen.has(k)) { seen.add(k); out.push(k); }
  return out;
}

/** Remove an object. */
export function removeObject(objs: PlacedObject[], id: string): PlacedObject[] {
  return objs.filter((o) => o.id !== id);
}

/** Count placed objects of a kind (feeds the metric strip — e.g. windows/doors auto-count). */
export function countKind(objs: PlacedObject[], kind: ObjectKind): number {
  return objs.filter((o) => o.kind === kind).length;
}

/**
 * Mirror the whole layout across the room's centre — "h" flips left↔right (gx), "v" flips top↔bottom (gy).
 * A DATA op (not a view flip) so BOTH the 2D plan and the 3D voxel reflect it from one source. Immutable +
 * deterministic; applying the same axis twice returns the original layout (involution → replay-safe).
 */
export function mirrorObjects(objs: PlacedObject[], axis: "h" | "v"): PlacedObject[] {
  return objs.map((o) => axis === "h"
    ? { ...o, gx: clampCell(ROOM_GRID - 1 - o.gx) }
    : { ...o, gy: clampCell(ROOM_GRID - 1 - o.gy) });
}
