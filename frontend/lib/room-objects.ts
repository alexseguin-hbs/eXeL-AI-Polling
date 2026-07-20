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
  // FIX-9 — richer per-room catalog (closet storage + common gaps)
  | "closetrod" | "shelving" | "shoerack" | "rug" | "mirror" | "lamp" | "rangehood"
  // S3 — structural SHELL system (hex wall panel + roof panel) — the EcoSpheres shell folded into Architect assets
  | "shell" | "roof"
  | "door" | "window";

export type Rot = 0 | 90 | 180 | 270;

/** One placed object on the room floor grid. gx/gy = grid cell (0..9); rot = 0|90|180|270°; variant = size id. */
export interface PlacedObject { id: string; kind: ObjectKind; gx: number; gy: number; rot: Rot; variant?: string; }

/** Size variants (feet) for kinds that come in standard sizes — beds Twin/Full/Queen/King; doors/windows standard R.O.
 *  sizes (FIX-1). `h` (height, ft) is optional — set for openings where height matters (operator: window height). */
export interface SizeVariant { id: string; label: string; w: number; d: number; h?: number }
export const BED_VARIANTS: SizeVariant[] = [
  { id: "twin",  label: "Twin",  w: 3.25, d: 6.25 },
  { id: "full",  label: "Full",  w: 4.5,  d: 6.25 },
  { id: "queen", label: "Queen", w: 5,    d: 6.67 },
  { id: "king",  label: "King",  w: 6.33, d: 6.67 },
];
// FIX-1 — standard door sizes (width × 6'8" or 8'0"), depth = thin panel.
export const DOOR_VARIANTS: SizeVariant[] = [
  { id: "d28", label: `2'-8"`, w: 2.33, d: 0.4, h: 6.67 },
  { id: "d30", label: `2'-10"`, w: 2.5, d: 0.4, h: 6.67 },
  { id: "d32", label: `3'-0"`, w: 3,    d: 0.4, h: 6.67 },
  { id: "d36", label: `3'-0"×8'`, w: 3, d: 0.4, h: 8 },
];
// FIX-1 — standard window sizes (width × height), depth = thin sash.
export const WINDOW_VARIANTS: SizeVariant[] = [
  { id: "awning", label: `2'×2'`, w: 2, d: 0.5, h: 2 },
  { id: "w23",    label: `2'×3'`, w: 2, d: 0.5, h: 3 },
  { id: "w34",    label: `3'×4'`, w: 3, d: 0.5, h: 4 },
  { id: "w35",    label: `3'×5'`, w: 3, d: 0.5, h: 5 },
  { id: "slider", label: `6'×4' slider`, w: 6, d: 0.5, h: 4 },
];
export const VARIANTS: Partial<Record<ObjectKind, SizeVariant[]>> = { bed: BED_VARIANTS, door: DOOR_VARIANTS, window: WINDOW_VARIANTS };

/** Height (ft) of a placed object — its variant's height when set, else the kind default (FIX-1). */
export function heightOf(o: PlacedObject): number {
  const vs = VARIANTS[o.kind];
  if (vs && o.variant) { const v = vs.find((x) => x.id === o.variant); if (v && typeof v.h === "number") return v.h; }
  return OBJECT_SPEC[o.kind].h;
}

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
  // FIX-9 — closet storage + common gaps
  closetrod: { label: "Closet Rod",emoji: "👕", w: 4,   d: 1.5, h: 6,   onWall: true,  color: "#c084fc" }, // hanging rod + hangers
  shelving:  { label: "Shelving",  emoji: "🗄", w: 3,   d: 1,   h: 6,   onWall: true,  color: "#c084fc" },
  shoerack:  { label: "Shoe Rack", emoji: "👟", w: 2.5, d: 1,   h: 2,   onWall: false, color: "#c084fc" },
  rug:       { label: "Rug",       emoji: "🟫", w: 6,   d: 4,   h: 0.1, onWall: false, color: "#c084fc" },
  mirror:    { label: "Mirror",    emoji: "🪞", w: 2,   d: 0.2, h: 4,   onWall: true,  color: "#19c8cf" },
  lamp:      { label: "Lamp",      emoji: "💡", w: 1,   d: 1,   h: 5,   onWall: false, color: "#c084fc" },
  rangehood: { label: "Range Hood",emoji: "🌀", w: 2.5, d: 1.5, h: 1.5, onWall: true,  color: "#19c8cf" },
  // S3 — structural SHELL system (steel-grey): hex wall panel + roof panel.
  shell:     { label: "Shell Panel",emoji: "⬡", w: 4,  d: 0.7, h: 8,   onWall: true,  color: "#8899aa" },
  roof:      { label: "Roof Panel", emoji: "🔺", w: 5,  d: 5,   h: 0.7, onWall: false, color: "#8899aa" },
  door:    { label: "Door",    emoji: "🚪", w: 3, d: 0.4, h: 6.7, onWall: true,  color: "#22c55e" }, // FIX-2 thin panel, 6'8" opening
  window:  { label: "Window",  emoji: "▭",  w: 3, d: 0.5, h: 4,   onWall: true,  color: "#19c8cf" }, // FIX-2 thin sash, ~4'
};

export const OBJECT_KINDS = Object.keys(OBJECT_SPEC) as ObjectKind[];

const clampCell = (n: number) => Math.max(0, Math.min(ROOM_GRID - 1, Math.round(n)));

/**
 * FIX-6 — footprint-aware clamp: keep an object's WHOLE footprint (rotation-aware) inside the 0..ROOM_GRID ft room,
 * so it can never be dragged so its box pokes through a wall (operator IMG_7530). Cells are integers; an object at
 * cell g has its centre at g+0.5 ft and spans ±f/2. An object larger than the room is centred (best effort — Enki).
 */
export function clampFootprint(gx: number, gy: number, w: number, d: number, rot: Rot = 0, round = true): { gx: number; gy: number } {
  const swap = rot === 90 || rot === 270;
  const fw = swap ? d : w, fd = swap ? w : d;
  const axis = (g: number, f: number): number => {
    // whole footprint inside [0,ROOM_GRID] ft: centre (g+0.5) must be in [f/2, ROOM_GRID-f/2] → g in [f/2-0.5, ROOM_GRID-0.5-f/2]
    if (round) {
      const lo = Math.ceil(f / 2 - 0.5), hi = Math.floor(ROOM_GRID - 0.5 - f / 2);
      if (lo > hi) return Math.max(0, Math.min(ROOM_GRID - 1, Math.round((ROOM_GRID - f) / 2))); // oversize → centred
      return Math.max(lo, Math.min(hi, Math.round(g)));
    }
    const lo = f / 2 - 0.5, hi = ROOM_GRID - 0.5 - f / 2;         // fractional (FIX-B fine nudge)
    if (lo > hi) return (ROOM_GRID - f) / 2 - 0.5;
    return Math.max(lo, Math.min(hi, g));
  };
  return { gx: axis(gx, fw), gy: axis(gy, fd) };
}

/**
 * FIX-B — fine spatial nudge (operator: arrows + ft/inches, like Mission-Planning asset planning). Move an object by a
 * fractional-foot delta (e.g. 1" = 1/12 ft, 6", 1'), footprint-clamped inside the room WITHOUT snapping to whole cells,
 * so a user can position to the inch. dx = +right/−left, dy = +down(S)/−up(N). Pure + deterministic.
 */
export function nudgeObject(objs: PlacedObject[], id: string, dxFt: number, dyFt: number): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const fp = footprintOf(o);
    const c = clampFootprint(o.gx + dxFt, o.gy + dyFt, fp.w, fp.d, o.rot, false);
    return { ...o, gx: c.gx, gy: c.gy };
  });
}
/** Standard nudge steps (ft) for the arrow pad: 1 inch, 6 inches, 1 foot. */
export const NUDGE_STEPS_FT: { id: string; label: string; ft: number }[] = [
  { id: "in1", label: `1"`, ft: 1 / 12 },
  { id: "in6", label: `6"`, ft: 0.5 },
  { id: "ft1", label: `1'`, ft: 1 },
];

/**
 * FIX-5b — parse a typed dimension into decimal FEET. Accepts decimal feet ("5.5"), feet-inches ("5'-6\"", "5' 6",
 * "5'6"), or inches-only ("66\""). Returns null on garbage (WireGuard: never trust typed input). Pure.
 */
export function parseFeet(s: string): number | null {
  const t = (s ?? "").trim();
  if (!t) return null;
  if (t.includes("'")) {                                   // feet [+ inches]
    const parts = t.split("'");
    const ft = parseFloat(parts[0]);
    const inMatch = (parts[1] || "").match(/\d+(?:\.\d+)?/); // digits only — the "-" in 5'-6" is a separator, not a sign
    const inch = inMatch ? parseFloat(inMatch[0]) : 0;
    if (!Number.isFinite(ft)) return null;
    return ft + (Number.isFinite(inch) ? inch : 0) / 12;
  }
  if (t.endsWith('"')) { const n = parseFloat(t); return Number.isFinite(n) ? n / 12 : null; } // inches only
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;                    // decimal feet
}

/**
 * FIX-5b — set a wall opening's ON-CENTER distance (ft, measured from the near corner along its wall) to an exact
 * value, footprint-clamped inside the room, fractional (inch-precise). Non-wall kinds: sets the along-X centre.
 */
export function setAlongWall(objs: PlacedObject[], id: string, ocFt: number, forceAxis?: "x" | "y"): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const fp = footprintOf(o);
    const wall = OBJECT_SPEC[o.kind].onWall ? wallOf(o.gx, o.gy) : "N";
    const axis: "x" | "y" = forceAxis ?? (wall === "W" || wall === "E" ? "y" : "x"); // forceAxis = vertical O.C. entry
    const gx = axis === "x" ? ocFt - 0.5 : o.gx;
    const gy = axis === "y" ? ocFt - 0.5 : o.gy;
    const c = clampFootprint(gx, gy, fp.w, fp.d, o.rot, false);
    return { ...o, gx: c.gx, gy: c.gy };
  });
}

/**
 * Set the clearance GAP from a wall to the object's near ("near") or far ("far") edge along its primary axis
 * (wall opening → along its wall; free furniture → X). Moving one edge shifts the whole object, so the wall→edge ·
 * size · edge→wall chain re-derives and the OTHER gap updates automatically (operator: edit one, others change).
 */
export function setGap(objs: PlacedObject[], id: string, which: "near" | "far", gapFt: number, forceAxis?: "x" | "y"): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const fp = footprintOf(o);
    const wall = OBJECT_SPEC[o.kind].onWall ? wallOf(o.gx, o.gy) : "N";
    const axis: "x" | "y" = forceAxis ?? (wall === "W" || wall === "E" ? "y" : "x"); // forceAxis = vertical gap entry
    const size = axis === "x" ? fp.w : fp.d;
    const centre = which === "near" ? gapFt + size / 2 : ROOM_GRID - gapFt - size / 2;
    const g = centre - 0.5;
    const c = clampFootprint(axis === "x" ? g : o.gx, axis === "y" ? g : o.gy, fp.w, fp.d, o.rot, false);
    return { ...o, gx: c.gx, gy: c.gy };
  });
}

/** FIX-5b — set the size variant whose WIDTH (axis "x", default) or DEPTH (axis "y") is closest to the typed feet
 * value (no-op for kinds without variants). The vertical dimension chain edits by depth in the same manner. */
export function setVariantByWidth(objs: PlacedObject[], id: string, wFt: number, forceAxis: "x" | "y" = "x"): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const vs = VARIANTS[o.kind];
    if (!vs || vs.length === 0) return o;
    const dim = (v: { w: number; d: number }) => (forceAxis === "y" ? v.d : v.w);
    let best = vs[0], bestD = Math.abs(dim(vs[0]) - wFt);
    for (const v of vs) { const dd = Math.abs(dim(v) - wFt); if (dd < bestD) { best = v; bestD = dd; } }
    return { ...o, variant: best.id };
  });
}

/** Set the size variant whose HEIGHT is closest to the typed feet value (no-op for kinds without height variants).
 * Lets the 3D view adjust an object's height — e.g. window head height — the same way 2D edits width (operator). */
export function setVariantByHeight(objs: PlacedObject[], id: string, hFt: number): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const vs = VARIANTS[o.kind];
    const withH = vs?.filter((v) => typeof v.h === "number");
    if (!withH || withH.length === 0) return o;
    let best = withH[0], bestD = Math.abs((withH[0].h as number) - hFt);
    for (const v of withH) { const dd = Math.abs((v.h as number) - hFt); if (dd < bestD) { best = v; bestD = dd; } }
    return { ...o, variant: best.id };
  });
}

/** Deterministic id from kind + running index (no Math.random → replayable). */
function nextId(objs: PlacedObject[], kind: ObjectKind): string {
  const n = objs.filter((o) => o.kind === kind).length + 1;
  return `${kind}-${n}`;
}

/** Place a new object at (gx,gy), clamped so its whole footprint stays inside the room (FIX-6). NEW array, no mutate. */
export function placeObject(objs: PlacedObject[], kind: ObjectKind, gx: number, gy: number): PlacedObject[] {
  const c = clampFootprint(gx, gy, OBJECT_SPEC[kind].w, OBJECT_SPEC[kind].d, 0);
  return [...objs, { id: nextId(objs, kind), kind, gx: c.gx, gy: c.gy, rot: 0 }];
}

/** Move an existing object to (gx,gy), footprint-clamped (rotation- + variant-aware) fully inside the room (FIX-6). */
export function moveObject(objs: PlacedObject[], id: string, gx: number, gy: number): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const fp = footprintOf(o);
    const c = clampFootprint(gx, gy, fp.w, fp.d, o.rot);
    return { ...o, gx: c.gx, gy: c.gy };
  });
}

/** Rotate an object 90° clockwise (0→90→180→270→0), then re-clamp so the rotated footprint stays inside (FIX-6). */
export function rotateObject(objs: PlacedObject[], id: string): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const rot = (((o.rot + 90) % 360) as Rot);
    const fp = footprintOf(o);
    const c = clampFootprint(o.gx, o.gy, fp.w, fp.d, rot);
    return { ...o, rot, gx: c.gx, gy: c.gy };
  });
}

/** Footprint (ft) for a placed object — its variant's size when set, else the kind default. */
export function footprintOf(o: PlacedObject): { w: number; d: number } {
  const vs = VARIANTS[o.kind];
  if (vs && o.variant) { const v = vs.find((x) => x.id === o.variant); if (v) return { w: v.w, d: v.d }; }
  return { w: OBJECT_SPEC[o.kind].w, d: OBJECT_SPEC[o.kind].d };
}

/** Project a placed object's footprint into a room rectangle (rx,ry,rw,rh) on the whole-house plan so the 2D floor
 * plan / voxel model what's ACTUALLY inside each room, not a generic placeholder (operator IMG_7568/7569). Pure. */
export function projectPlaced(o: PlacedObject, rx: number, ry: number, rw: number, rh: number, roomFt = ROOM_GRID): { x: number; y: number; w: number; h: number } {
  const fp = footprintOf(o);
  return { x: rx + (o.gx / roomFt) * rw, y: ry + (o.gy / roomFt) * rh, w: (fp.w / roomFt) * rw, h: (fp.d / roomFt) * rh };
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
  // FIX-3 realistic bed: base platform (reads on all sides) + inset mattress + pillow + headboard (not a flat 2-faced slab)
  bed:    [{ x: 0, y: 0, z: 0, w: 1, d: 1, h: 0.35 }, { x: 0.06, y: 0.1, z: 0.35, w: 0.88, d: 0.85, h: 0.33 }, { x: 0.12, y: 0.12, z: 0.68, w: 0.76, d: 0.22, h: 0.26 }, { x: 0, y: 0, z: 0, w: 1, d: 0.1, h: 1.0 }],
  sofa:   [{ x: 0, y: 0.34, z: 0, w: 1, d: 0.66, h: 0.5 }, { x: 0, y: 0, z: 0, w: 1, d: 0.34, h: 1 }],        // seat + back
  desk:   [{ x: 0, y: 0, z: 0.82, w: 1, d: 1, h: 0.18 }, { x: 0, y: 0, z: 0, w: 0.08, d: 1, h: 0.82 }, { x: 0.92, y: 0, z: 0, w: 0.08, d: 1, h: 0.82 }], // top + 2 legs
  table:  [{ x: 0, y: 0, z: 0.82, w: 1, d: 1, h: 0.18 }, { x: 0.4, y: 0.4, z: 0, w: 0.2, d: 0.2, h: 0.82 }],  // top + pedestal
  toilet: [{ x: 0.12, y: 0.3, z: 0, w: 0.76, d: 0.7, h: 0.55 }, { x: 0.12, y: 0, z: 0, w: 0.76, d: 0.3, h: 1 }], // bowl + tank
  sink:   [{ x: 0, y: 0, z: 0.58, w: 1, d: 1, h: 0.42 }, { x: 0.35, y: 0.35, z: 0, w: 0.3, d: 0.3, h: 0.58 }], // basin + pedestal
  chair:  [{ x: 0, y: 0.2, z: 0, w: 1, d: 0.8, h: 0.5 }, { x: 0, y: 0, z: 0, w: 1, d: 0.2, h: 1 }],           // seat + back
  tv:     [{ x: 0, y: 0.35, z: 0.1, w: 1, d: 0.5, h: 0.85 }],  // thin screen panel
  fridge: [{ x: 0, y: 0, z: 0.45, w: 1, d: 1, h: 0.55 }, { x: 0, y: 0, z: 0, w: 1, d: 1, h: 0.45 }],          // fridge over freezer
  stove:  [{ x: 0, y: 0, z: 0, w: 1, d: 1, h: 0.9 }, { x: 0.05, y: 0.05, z: 0.9, w: 0.9, d: 0.9, h: 0.1 }],    // body + cooktop
  bookshelf: [{ x: 0, y: 0, z: 0, w: 1, d: 0.15, h: 1 }, { x: 0, y: 0, z: 0.25, w: 1, d: 1, h: 0.08 }, { x: 0, y: 0, z: 0.55, w: 1, d: 1, h: 0.08 }, { x: 0, y: 0, z: 0.85, w: 1, d: 1, h: 0.08 }], // back + 3 shelves
  wardrobe: [{ x: 0, y: 0, z: 0, w: 0.5, d: 1, h: 1 }, { x: 0.5, y: 0, z: 0, w: 0.5, d: 1, h: 1 }],           // twin doors
  dresser: [{ x: 0, y: 0, z: 0, w: 1, d: 1, h: 0.33 }, { x: 0, y: 0, z: 0.33, w: 1, d: 1, h: 0.33 }, { x: 0, y: 0, z: 0.66, w: 1, d: 1, h: 0.34 }], // 3 drawers
  shower: [{ x: 0, y: 0, z: 0, w: 1, d: 1, h: 0.15 }, { x: 0, y: 0, z: 0, w: 0.12, d: 1, h: 1 }, { x: 0, y: 0, z: 0, w: 1, d: 0.12, h: 1 }], // pan + 2 glass walls
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
  M: ["bed", "nightstand", "dresser", "wardrobe", "tv", "chair", "mirror", "lamp", "rug"], // Master Bedroom
  B: ["toilet", "tub", "shower", "sink", "mirror", "shelving"],       // Master Bath
  C: ["wardrobe", "dresser", "closetrod", "shelving", "shoerack", "mirror"], // Master Closet (FIX-9)
  L: ["sofa", "tv", "table", "chair", "bookshelf", "rug", "lamp"],    // Living Room
  K: ["counter", "sink", "fridge", "stove", "rangehood"],             // Kitchen
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

/**
 * S7 — palette GROUPING by building system, so the context palette reads as tidy sections (Sleep · Living · Kitchen ·
 * Bath · Openings · Shell) instead of a flat row. Pure + deterministic; the palette render just maps over the result.
 */
export type AssetGroup = "Sleep" | "Living" | "Kitchen" | "Bath" | "Openings" | "Shell";
export const GROUP_ORDER: AssetGroup[] = ["Sleep", "Living", "Kitchen", "Bath", "Openings", "Shell"];
const ASSET_GROUP: Record<ObjectKind, AssetGroup> = {
  bed: "Sleep", nightstand: "Sleep", dresser: "Sleep", wardrobe: "Sleep",
  closetrod: "Sleep", shelving: "Sleep", shoerack: "Sleep", mirror: "Sleep",
  sofa: "Living", chair: "Living", table: "Living", tv: "Living", bookshelf: "Living", desk: "Living", rug: "Living", lamp: "Living",
  counter: "Kitchen", fridge: "Kitchen", stove: "Kitchen", rangehood: "Kitchen",
  toilet: "Bath", tub: "Bath", shower: "Bath", sink: "Bath", washer: "Bath",
  door: "Openings", window: "Openings",
  shell: "Shell", roof: "Shell",
};
/** Which system group a kind belongs to (S7). */
export function groupOf(kind: ObjectKind): AssetGroup { return ASSET_GROUP[kind]; }
/** Group a palette's kinds into ordered system sections, preserving input order within each group; empty groups omitted. */
export function groupPalette(kinds: ObjectKind[]): { group: AssetGroup; kinds: ObjectKind[] }[] {
  return GROUP_ORDER
    .map((group) => ({ group, kinds: kinds.filter((k) => ASSET_GROUP[k] === group) }))
    .filter((g) => g.kinds.length > 0);
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
