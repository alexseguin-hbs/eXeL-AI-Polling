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
/** Rev A (operator 2026-11-07, "level 1 of 5 · every item PARAMETRIC"): per-instance ADJUSTABLE dims in FEET — overrides on
 *  the placed object, read by footprintOf / heightOf as size → variant → kind default (every caller inherits). Set ONLY
 *  through setSize (range- + room-clamped); a missing axis falls through to the variant / kind default. */
export interface ObjectSize { w?: number; d?: number; h?: number }
export interface PlacedObject { id: string; kind: ObjectKind; gx: number; gy: number; rot: Rot; variant?: string; elev?: number; /* ft above finished floor — window sill, wall-mounted TV, etc. */ size?: ObjectSize; /* Rev A — per-instance dims (ft) */ }

/** Size variants (feet) for kinds that come in standard sizes — beds Twin/Full/Queen/King; doors/windows standard R.O.
 *  sizes (FIX-1). `h` (height, ft) is optional — set for openings where height matters (operator: window height). */
export interface SizeVariant { id: string; label: string; w: number; d: number; h?: number }
export const BED_VARIANTS: SizeVariant[] = [
  { id: "twin",  label: "Twin",  w: 3.25, d: 6.25 },
  { id: "full",  label: "Full",  w: 4.5,  d: 6.25 },
  { id: "queen", label: "Queen", w: 5,    d: 6.67 },
  { id: "king",  label: "King",  w: 6.33, d: 6.67 },
];
// FIX-1 — standard door sizes (width × 6'8" or 8'0"), depth = thin panel. R5c: the ids are inches and the labels now tell the
// truth about the widths (28 in = 2'-4", 30 in = 2'-6"); the common 2'-8" interior door is added as "d32w" (2.67 ft). The
// id "d32" is a FROZEN LEGACY ALIAS for a 3'-0" door (w 3) — its number no longer means its width, so NEVER derive a width
// from a variant id anywhere; width comes ONLY from `.w` (AsM 2026-10-31, Aset/Christo). Renaming d32 would orphan saved doors.
// truth about the widths (28 in = 2'-4", 30 in = 2'-6"); the common 2'-8" interior door is added; "d32" keeps its 3-ft width
// so a saved "3'-0"" door keeps its size. Gated: every label equals the feet-inches of its width (tests/door-convention).
export const DOOR_VARIANTS: SizeVariant[] = [
  { id: "d28",  label: `2'-4"`,    w: 2.33, d: 0.4, h: 6.67 },
  { id: "d30",  label: `2'-6"`,    w: 2.5,  d: 0.4, h: 6.67 },
  { id: "d32w", label: `2'-8"`,    w: 2.67, d: 0.4, h: 6.67 },
  { id: "d32",  label: `3'-0"`,    w: 3,    d: 0.4, h: 6.67 },
  { id: "d36",  label: `3'-0"×8'`, w: 3,    d: 0.4, h: 8 },
];
// FIX-1 — standard window sizes (width × height), depth = thin sash.
export const WINDOW_VARIANTS: SizeVariant[] = [
  { id: "awning", label: `2'×2'`, w: 2, d: 0.5, h: 2 },
  { id: "w23",    label: `2'×3'`, w: 2, d: 0.5, h: 3 },
  { id: "w34",    label: `3'×4'`, w: 3, d: 0.5, h: 4 },
  { id: "w35",    label: `3'×5'`, w: 3, d: 0.5, h: 5 },
  { id: "slider", label: `6'×4' slider`, w: 6, d: 0.5, h: 4 },
];
// Closet rod / shelving are linear closet elements — they must reach the FULL wall length (operator: the closet rod
// wouldn't go to 10 ft). Widths 3'→10'; the 10' variant spans the whole wall (setVariantByWidth / typed R.O. size).
export const CLOSETROD_VARIANTS: SizeVariant[] = [
  { id: "cr3",  label: `3'`,       w: 3,  d: 1.5, h: 6 },
  { id: "cr4",  label: `4'`,       w: 4,  d: 1.5, h: 6 },
  { id: "cr5",  label: `5'`,       w: 5,  d: 1.5, h: 6 },
  { id: "cr6",  label: `6'`,       w: 6,  d: 1.5, h: 6 },
  { id: "cr8",  label: `8'`,       w: 8,  d: 1.5, h: 6 },
  { id: "cr10", label: `10' full`, w: 10, d: 1.5, h: 6 },
];
export const SHELVING_VARIANTS: SizeVariant[] = [
  { id: "sh3",  label: `3'`,       w: 3,  d: 1,   h: 6 },
  { id: "sh4",  label: `4'`,       w: 4,  d: 1,   h: 6 },
  { id: "sh6",  label: `6'`,       w: 6,  d: 1,   h: 6 },
  { id: "sh8",  label: `8'`,       w: 8,  d: 1,   h: 6 },
  { id: "sh10", label: `10' full`, w: 10, d: 1,   h: 6 },
];
export const VARIANTS: Partial<Record<ObjectKind, SizeVariant[]>> = { bed: BED_VARIANTS, door: DOOR_VARIANTS, window: WINDOW_VARIANTS, closetrod: CLOSETROD_VARIANTS, shelving: SHELVING_VARIANTS };

const isPosFinite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

/** Height (ft) of a placed object — its per-instance size (Rev A) → its variant's height → the kind default (FIX-1). */
export function heightOf(o: PlacedObject): number {
  if (o.size && isPosFinite(o.size.h)) return o.size.h;
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
      // R5b (AsM-caught, J1): the ROUNDED cell is clamped to the FRACTIONAL bounds, so an integer drag can land FLUSH to a
      // wall (the old ceil/floor cell bounds held a 5-ft bed 6" off the N wall after its first pointer-move).
      const lo = f / 2 - 0.5, hi = ROOM_GRID - 0.5 - f / 2;
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
    const next = { ...o, variant: best.id };
    // Re-clamp after resizing so a widened element (e.g. a 10' closet rod) can't poke through a wall — it re-centres
    // to span the room instead (operator IMG_7581). Fractional, footprint-aware.
    const fp = footprintOf(next);
    const c = clampFootprint(o.gx, o.gy, fp.w, fp.d, o.rot, false);
    return { ...next, gx: c.gx, gy: c.gy };
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

/**
 * R5b — A WALL OBJECT IS ALWAYS WALL-ALIGNED (AsM-caught, the geometry lens): a window / door / mirror / wall TV on the W or E
 * wall runs ALONG that wall (rot 90), on the N or S wall across (rot 0). Place snaps it to its wall with that rotation;
 * Move re-aligns it to the wall it lands on; Rotate FLIPS it (+180°, the hinge / swing side) instead of turning it
 * perpendicular into the room — which is what the generic 90° step did (a 3-ft window became a 0.5 × 3 ft bar sticking out
 * of the wall while the badge still said "W wall"). One rule, shared with the WireGuard so a legacy stored layout is
 * normalised on load. Gated by tests/room-standard-layout.test.mjs.
 */
export function wallRot(wall: Wall): Rot { return wall === "W" || wall === "E" ? 90 : 0; }
/** The nearest wall-aligned rotation for `wall` that keeps a 180° flip: {0,180} on N/S · {90,270} on W/E. */
export function alignedRot(rot: Rot, wall: Wall): Rot {
  const base = wallRot(wall);
  return rot === base || rot === ((base + 180) % 360) ? rot : base;
}
/** The wall an object sits on — wallOf, but at a CORNER tie it prefers the axis the object already runs along (a W-wall
 * window at gy 0 stays W; wallOf alone would answer N). */
export function wallOfObject(o: { gx: number; gy: number; rot: Rot }): Wall {
  const dLeft = o.gx, dRight = ROOM_GRID - 1 - o.gx, dTop = o.gy, dBot = ROOM_GRID - 1 - o.gy;
  const m = Math.min(dLeft, dRight, dTop, dBot);
  const cands: Wall[] = [];
  if (m === dTop) cands.push("N");
  if (m === dBot) cands.push("S");
  if (m === dLeft) cands.push("W");
  if (m === dRight) cands.push("E");
  const vertical = o.rot === 90 || o.rot === 270;
  return cands.find((w) => ((w === "W" || w === "E") === vertical)) ?? cands[0];
}

/** Place a new object at (gx,gy), clamped so its whole footprint stays inside the room (FIX-6). NEW array, no mutate.
 * A wall object snaps to its nearest wall and runs along it (R5b). */
export function placeObject(objs: PlacedObject[], kind: ObjectKind, gx: number, gy: number): PlacedObject[] {
  const spec = OBJECT_SPEC[kind];
  if (spec.onWall) {
    const wall = wallOf(gx, gy), rot = wallRot(wall), s = slideAlongWall(wall, gx, gy);
    // the clamp keeps the piece flush to its wall (a 1.5-ft-deep closet rod sits at gy 0.25, not through the wall)
    const c = clampFootprint(s.gx, s.gy, spec.w, spec.d, rot);
    return [...objs, { id: nextId(objs, kind), kind, gx: c.gx, gy: c.gy, rot }];
  }
  const c = clampFootprint(gx, gy, spec.w, spec.d, 0);
  return [...objs, { id: nextId(objs, kind), kind, gx: c.gx, gy: c.gy, rot: 0 }];
}

/** Move an existing object to (gx,gy), footprint-clamped (rotation- + variant-aware) fully inside the room (FIX-6).
 * A wall object takes the alignment of the wall it lands on; a drag passes the wall it LOCKED (corner cells are ambiguous). */
export function moveObject(objs: PlacedObject[], id: string, gx: number, gy: number, wall?: Wall): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const fp = footprintOf(o);
    const rot = OBJECT_SPEC[o.kind].onWall ? alignedRot(o.rot, wall ?? wallOfObject({ gx, gy, rot: o.rot })) : o.rot;
    const c = clampFootprint(gx, gy, fp.w, fp.d, rot);
    return { ...o, rot, gx: c.gx, gy: c.gy };
  });
}

/** Rotate: free furniture turns 90° clockwise (0→90→180→270→0); a wall object FLIPS (+180°, hinge / swing side) and stays
 * aligned with its wall (R5b). Re-clamped so the rotated footprint stays inside (FIX-6), keeping a half-foot pivot (R5). */
export function rotateObject(objs: PlacedObject[], id: string): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const onWall = OBJECT_SPEC[o.kind].onWall;
    const wall = wallOfObject(o);
    const rot = onWall
      ? alignedRot((((alignedRot(o.rot, wall) + 180) % 360) as Rot), wall)
      : (((o.rot + 90) % 360) as Rot);
    const fp = footprintOf(o);
    const c = clampFootprint(o.gx, o.gy, fp.w, fp.d, rot, false);   // R5: keep the pivot (no rounding of a half-foot centre)
    return { ...o, rot, gx: c.gx, gy: c.gy };
  });
}

/** Footprint (ft) for a placed object — per axis: its per-instance size (Rev A) → its variant's size → the kind default. */
export function footprintOf(o: PlacedObject): { w: number; d: number } {
  const vs = VARIANTS[o.kind];
  let base = { w: OBJECT_SPEC[o.kind].w, d: OBJECT_SPEC[o.kind].d };
  if (vs && o.variant) { const v = vs.find((x) => x.id === o.variant); if (v) base = { w: v.w, d: v.d }; }
  const sz = o.size;
  if (!sz) return base;
  return { w: isPosFinite(sz.w) ? sz.w : base.w, d: isPosFinite(sz.d) ? sz.d : base.d };
}

/**
 * ONE PLACEMENT CONVENTION (R5, 2026-10-31): an object at cell (gx,gy) has its CENTRE at (gx+0.5, gy+0.5) ft and spans
 * ±w/2 × ±d/2 around it, rotation-aware (90/270 swap w and d). This is what the Room Designer's 2D plan (`cx = gx*10+5`)
 * and its 3D voxel (`ox = gx+0.5-W/2`) have always drawn, what clampFootprint / nudge / slideAlongWall assume, and —
 * since R5 — what the whole-house plan (projectPlaced), the house voxel (objects3d) and the default packer use too.
 * Before R5 the house views used a TOP-LEFT convention ([gx, gx+w]), so the same bed sat 0.5-w/2 ft apart in the two
 * views ("2D plan ⇄ 3D voxel must MIRROR"). Pure.
 */
export function worldSpan(o: PlacedObject): { x1: number; y1: number; x2: number; y2: number; w: number; d: number } {
  const fp = footprintOf(o);
  const swap = o.rot === 90 || o.rot === 270;
  const w = swap ? fp.d : fp.w, d = swap ? fp.w : fp.d;
  const cx = o.gx + 0.5, cy = o.gy + 0.5;
  return { x1: cx - w / 2, y1: cy - d / 2, x2: cx + w / 2, y2: cy + d / 2, w, d };
}

/** Project a placed object's footprint into a room rectangle (rx,ry,rw,rh) on the whole-house plan so the 2D floor
 * plan / voxel model what's ACTUALLY inside each room, not a generic placeholder (operator IMG_7568/7569). Pure;
 * centre-of-cell convention (worldSpan). */
export function projectPlaced(o: PlacedObject, rx: number, ry: number, rw: number, rh: number, roomFt = ROOM_GRID): { x: number; y: number; w: number; h: number } {
  const sp = worldSpan(o);
  return { x: rx + (sp.x1 / roomFt) * rw, y: ry + (sp.y1 / roomFt) * rh, w: (sp.w / roomFt) * rw, h: (sp.d / roomFt) * rh };
}

/** Standard window sill height above finished floor (ft) — the default off-ground for a window. */
export const STD_SILL_FT = 3;

/** Distance the object's BASE sits above the finished floor (ft). Windows default to a 3' sill; a wall-mounted TV or
 * high shelf can be lifted too. Editable in the 3D view (operator: "distance off ground must be editable"). */
export function elevOf(o: PlacedObject): number {
  if (typeof o.elev === "number" && Number.isFinite(o.elev)) return Math.max(0, o.elev);
  return o.kind === "window" ? STD_SILL_FT : 0;
}

/** Set an object's distance off the ground (ft), clamped so its top stays within the 10' room. */
export function setElev(objs: PlacedObject[], id: string, ft: number): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id) return o;
    const maxE = Math.max(0, ROOM_GRID - heightOf(o));
    return { ...o, elev: Math.max(0, Math.min(maxE, ft)) };
  });
}

/**
 * Rev A — set ONE per-instance dimension (ft) EXACTLY: snapped to the kind's parametric step, clamped to its range
 * (ASSET_PARAMS.params — the Revit-style instance parameters) and to the room — a widened piece re-clamps its footprint
 * like setVariantByWidth (never through a wall), a height keeps the top under the 10-ft ceiling like setElev. Pure,
 * deterministic (the same typed value → the same stored value); no-op for an unknown id or a non-finite value. This is the
 * ONLY writer of PlacedObject.size; the ✎ dim-edit path reaches it through applyTypedSize / applyTypedHeight.
 */
export function setSize(objs: PlacedObject[], id: string, axis: "w" | "d" | "h", ft: number): PlacedObject[] {
  return objs.map((o) => {
    if (o.id !== id || !Number.isFinite(ft)) return o;
    const r = ASSET_PARAMS[o.kind].params[axis];
    const stepped = r.step > 0 ? Math.round(ft / r.step) * r.step : ft;
    let v = Math.round(Math.max(r.min, Math.min(r.max, stepped)) * 1e6) / 1e6;   // kill the step's float noise (replay law)
    if (axis === "h") v = Math.min(v, Math.max(r.min, ROOM_GRID - elevOf(o)));     // the top stays under the ceiling (setElev's law)
    else v = Math.min(v, ROOM_GRID);                                                // never wider than the room
    const next: PlacedObject = { ...o, size: { ...(o.size ?? {}), [axis]: v } };
    const fp = footprintOf(next);
    const c = clampFootprint(o.gx, o.gy, fp.w, fp.d, o.rot, false);
    return { ...next, gx: c.gx, gy: c.gy };
  });
}

/** Rev A — the ✎ dim-edit ROUTER (room-designer applyDim, "size"): a kind WITH standard size variants snaps to its nearest
 *  variant (unchanged behaviour: beds, doors, windows, closet rods, shelving); every other kind takes the EXACT typed size
 *  (axis "x" = its width w, "y" = its depth d — the same object-local axes chainDims measures). Pure. */
export function applyTypedSize(objs: PlacedObject[], id: string, ft: number, axis: "x" | "y" = "x"): PlacedObject[] {
  const o = objs.find((x) => x.id === id);
  if (!o) return objs;
  return (VARIANTS[o.kind]?.length ?? 0) > 0 ? setVariantByWidth(objs, id, ft, axis) : setSize(objs, id, axis === "y" ? "d" : "w", ft);
}
/** Rev A — the ✎ dim-edit ROUTER ("height"): a kind whose variants carry a height snaps to the nearest (doors, windows,
 *  closet rods, shelving — unchanged); every other kind (a bed, a sofa …) takes the EXACT typed height. Pure. */
export function applyTypedHeight(objs: PlacedObject[], id: string, ft: number): PlacedObject[] {
  const o = objs.find((x) => x.id === id);
  if (!o) return objs;
  const hasH = VARIANTS[o.kind]?.some((v) => typeof v.h === "number") ?? false;
  return hasH ? setVariantByHeight(objs, id, ft) : setSize(objs, id, "h", ft);
}

/**
 * Rev A · P0·K (MoT ruling 2026-11-07) — ONE PLACEMENT LAW FOR PARTS. The rotated, placed, lifted sub-boxes of an object
 * in PLAN FEET (the worldSpan centre-of-cell convention: x right/east, y DOWN/south on the plan, z up from the finished
 * floor): each part's unit rect is turned by o.rot — 90: (x,y,w,d) → (y, 1−x−w, d, w) · 180: (1−x−w, 1−y−d, w, d) ·
 * 270: (1−y−d, x, d, w) — then scaled by the world footprint (rotation-aware W×D) and lifted by elevOf. Lifted VERBATIM
 * from room-designer.tsx's inline rotRect so the designer 3D, the first-person walk and the voxel import this instead of
 * each doing its own (the walk's furnBox still extrudes ONE box today — the next slice; its Y-flip is the caller's:
 * worldY = ROOM_FT − y). Pure + deterministic; `lod` picks the authored level (default L1, today's data).
 */
export interface PartRect { x1: number; y1: number; x2: number; y2: number; z0: number; z1: number; part: ShapePart }
export function partRects(o: PlacedObject, lod: Lod = 1): PartRect[] {
  const fp = footprintOf(o);
  const swap = o.rot === 90 || o.rot === 270;
  const W = swap ? fp.d : fp.w, D = swap ? fp.w : fp.d, hgt = heightOf(o), e0 = elevOf(o);
  const ox = o.gx + 0.5 - W / 2, oy = o.gy + 0.5 - D / 2;   // object origin corner in world (plan feet)
  return shapePartsAt(o.kind, lod).map((p) => {
    const r = o.rot === 90 ? { x: p.y, y: 1 - (p.x + p.w), w: p.d, d: p.w }
      : o.rot === 180 ? { x: 1 - (p.x + p.w), y: 1 - (p.y + p.d), w: p.w, d: p.d }
      : o.rot === 270 ? { x: 1 - (p.y + p.d), y: p.x, w: p.d, d: p.w }
      : { x: p.x, y: p.y, w: p.w, d: p.d };
    const x1 = ox + r.x * W, y1 = oy + r.y * D;
    return { x1, y1, x2: x1 + r.w * W, y2: y1 + r.d * D, z0: p.z * hgt + e0, z1: (p.z + p.h) * hgt + e0, part: p };
  });
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
/** Rev A — a part's MATERIAL ROLE (data only; the renderers' look is a later slice): the body reads the kind's
 *  materialPreset; an ACCENT part reads purple, GLASS transparent cyan, SCREEN dark navy, WOOD = FRAME_COLOR — and WOOD
 *  only on isWoodKind (lib/architect-2525/assets/materials.ts is the ONE place asset colours live; gated). */
export type PartAccent = "ACCENT" | "GLASS" | "SCREEN" | "WOOD";
export interface ShapePart { x: number; y: number; z: number; w: number; d: number; h: number; accent?: PartAccent }
/** Rev A — level of detail 1..5 ("this is level 1 of 5"): L1 = the clean wireframe parts shipped today; L2–L5 are SLOTS
 *  for later realism (bevels/materials → textures → detailed meshes → photoreal) that never re-author L1. */
export type Lod = 1 | 2 | 3 | 4 | 5;
export const LOD_LEVELS: readonly Lod[] = [1, 2, 3, 4, 5];
const FULL_BOX: ShapePart[] = [{ x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 }];
// LOD 1 — today's data, byte-identical (gated: snapshot equality in tests/architect-asset-registry.test.mjs).
const SHAPE_PARTS_L1: Partial<Record<ObjectKind, ShapePart[]>> = {
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
/** Rev A — the LOD-keyed part sets, SHAPE_PARTS_LOD[kind][lod]. LOD 1 = today's data; higher levels are added per kind as
 *  they are authored (a slot, not work). Read through shapePartsAt / shapePartsOf — never indexed by a renderer. */
export const SHAPE_PARTS_LOD: Partial<Record<ObjectKind, Partial<Record<Lod, ShapePart[]>>>> = {};
for (const k of Object.keys(SHAPE_PARTS_L1) as ObjectKind[]) SHAPE_PARTS_LOD[k] = { 1: SHAPE_PARTS_L1[k] };
/** The parts of a kind at a level of detail — the HIGHEST authored level ≤ lod (a kind with only L1 renders L1 at L5),
 *  else one full box. Pure. */
export function shapePartsAt(kind: ObjectKind, lod: Lod): ShapePart[] {
  const levels = SHAPE_PARTS_LOD[kind];
  if (levels) for (let l = lod; l >= 1; l--) { const parts = levels[l as Lod]; if (parts && parts.length > 0) return parts; }
  return FULL_BOX;
}
/** The low-fi 3D shape of a kind as fractional sub-boxes (S2) — LOD 1, unchanged signature + behaviour. Falls back to a
 *  single full box. */
export function shapePartsOf(kind: ObjectKind): ShapePart[] { return shapePartsAt(kind, 1); }

/**
 * Rev A — ASSET PARAMS: the DEFINITION of every kind as a reusable, PARAMETRIC, PORTABLE Architect-2525 asset (the brief
 * docs/asks/2026.11.07_architect2525_native_asset_regeneration_brief.md §3 stable ids · §4 rooms · §6 phases · §10
 * dims · §18 mounting · §19 authority; the plan's "THE BAR"). Beside SHAPE_PARTS, never a parallel engine: OBJECT_SPEC
 * keeps its shape (label/emoji/w/d/h/onWall/color — tests/room-objects.test.mjs:31–37) and stays the DEFAULT size.
 *  · id — STABLE identity (one identity, many projections: plan · 3D · voxel · walk · export); never a React name or label.
 *  · category — the brief §17 general categories (how a user finds it); packs organise implementation, not use.
 *  · rooms — the 9 canonical room keys of room-layout TINY_ROOM_LAYOUT (M/B/C/L/K/D/O/S/E) or "GENERAL" for a shared
 *    asset referenced by every room WITHOUT duplicating its definition (§4); a SUPERSET of ROOM_ASSETS (gated ⊇).
 *  · phases — the architect-phases ids this kind is visible in; ONE truth with showGroupInPhase(groupOf(kind)) (gated =).
 *  · mounting + snap — HIS taxonomy (3D Asset Starter Pack schema + intake master §12): FLOOR · WALL · CEILING · SURFACE ·
 *    BUILT_IN, with snap targets (FLOOR, WALL_BACK, WALL_OPENING, WALL_CORNER, CABINET_LINE, ROOF_LINE …). (These are VALUES —
 *    the canonical schema gate bans FIELD NAMES wall/mesh/yaw/svg; no canonical field is named here: assets never enter
 *    canonical truth, §7.)
 *  · params — the Revit-style INSTANCE parameters: w/d/h ranges in ft + the step the ✎ dim-edit snaps to (1 inch).
 *  · authority — ILLUSTRATIVE (design content) or REFERENCE (a real-world standard size); NEVER verified/engineered/
 *    qualified/certified — asset existence is not engineering validation (§19).
 *  · lod — the detail level this definition is authored at (1 of 5); materialPreset — the body material role.
 *  · id grammar + file + metaCategory + packs — the operator's 3D ASSET STARTER PACK contract (docs/architecture-2525/
 *    asset-library/3d-starter-2026-11-06: manifest.json · metadata/*.json · schemas/asset.schema.json; the intake master
 *    docs/asks/2026.11.07_architect2525_3d_asset_intake_master.md §7–§14, §19): ONE semantic id per asset, many filters.
 * Pure data. Gated by tests/architect-asset-registry.test.mjs.
 */
export type RoomKey = "M" | "B" | "C" | "L" | "K" | "D" | "O" | "S" | "E";
/** The 9 canonical room keys — the `k` of room-layout's TINY_ROOM_LAYOUT (gated equal); never invent a tenth. */
export const ROOM_KEYS: readonly RoomKey[] = ["M", "B", "C", "L", "K", "D", "O", "S", "E"];
export type AssetCategory = "FURNITURE" | "FIXTURES" | "LIGHTING" | "DOORS_WINDOWS" | "BUILDING_ELEMENTS" | "MECHANICAL" | "ELECTRICAL" | "PLUMBING" | "SECURITY" | "SITE";
export const ASSET_CATEGORIES: readonly AssetCategory[] = ["FURNITURE", "FIXTURES", "LIGHTING", "DOORS_WINDOWS", "BUILDING_ELEMENTS", "MECHANICAL", "ELECTRICAL", "PLUMBING", "SECURITY", "SITE"];
/** The operator's 3D Asset Starter Pack mounting enum (schemas/asset.schema.json) — ONE vocabulary, his. */
export type Mounting = "FLOOR" | "WALL" | "CEILING" | "SURFACE" | "BUILT_IN";
export const MOUNTINGS: readonly Mounting[] = ["FLOOR", "WALL", "CEILING", "SURFACE", "BUILT_IN"];
/** His snap-target taxonomy (intake master §12). */
export type SnapTarget = "FLOOR" | "WALL" | "WALL_BACK" | "WALL_CORNER" | "WALL_OPENING" | "CEILING" | "SURFACE" | "COUNTERTOP" | "CABINET_UNDERSIDE" | "CABINET_LINE" | "ROOF_LINE" | "ROOF_EDGE" | "DOOR";
export const SNAP_TARGETS: readonly SnapTarget[] = ["FLOOR", "WALL", "WALL_BACK", "WALL_CORNER", "WALL_OPENING", "CEILING", "SURFACE", "COUNTERTOP", "CABINET_UNDERSIDE", "CABINET_LINE", "ROOF_LINE", "ROOF_EDGE", "DOOR"];
export type AssetAuthority = "ILLUSTRATIVE" | "REFERENCE";
export type MaterialPreset = "ARCH_TEAL" | "ARCH_ACCENT" | "GLASS" | "SCREEN" | "WOOD";
/** His metadata `category` vocabulary (manifest.json: FURNITURE · KITCHEN · APPLIANCE · PLUMBING_FIXTURE · OPENING; extended
 *  in the same grammar for the kinds his starter does not yet model). */
export type MetaCategory = "FURNITURE" | "KITCHEN" | "APPLIANCE" | "PLUMBING_FIXTURE" | "OPENING" | "STRUCTURE" | "LIGHTING" | "LIFESTYLE";
export interface DimRange { min: number; max: number; step: number }
export interface AssetParams {
  id: string;                 // STABLE semantic id = the operator's COMPLETE library id: architect2525.asset.<name>.v1
  aliases: string[];          // provenance — the earlier starter-pack id and/or rotator-catalog id for the same asset (resolved by kindByAssetId)
  file: string;               // his library file stem — models/<file>.glb · metadata/<file>.json · plan/<file>.svg
  library: boolean;           // true = a native GLB + metadata + PLAN svg exists in his complete library (139); false = PENDING (no entry)
  category: AssetCategory;    // the brief §17 general category (the Asset Library filter)
  metaCategory: MetaCategory; // his metadata `category`
  rooms: RoomKey[] | "GENERAL";
  phases: string[];
  mounting: Mounting;
  snap: SnapTarget[];
  packs: number[];            // the implementation packs that carry it (brief §5 / master §19 — one entry, many filters)
  params: { w: DimRange; d: DimRange; h: DimRange };
  authority: AssetAuthority;
  lod: 1;
  materialPreset: MaterialPreset;
}
const IN = 1 / 12;                                                         // the ✎ dim-edit step: one inch
const R = (min: number, max: number): DimRange => ({ min, max, step: IN });
// phase sets = the showGroupInPhase truth per palette group (one truth, two carriers, gated equal):
const PH_FURN = ["interior"];                                              // Sleep / Living — the furniture layer only
const PH_FIXT = ["plumbing", "sewer", "finish", "interior"];               // Bath / Kitchen — fixtures the wet phases serve
const PH_OPEN = ["framing", "finish", "interior"];                         // Openings
const PH_SHELL = ["framing", "roofing", "insulation", "interior"];         // Shell panels
const FL: SnapTarget[] = ["FLOOR"], WL: SnapTarget[] = ["WALL"];
const L = "architect2525.asset.";                                          // his library id prefix (manifest.json, 139 assets)
const A = (name: string, aliases: string[], file: string, library: boolean, category: AssetCategory, metaCategory: MetaCategory, rooms: RoomKey[] | "GENERAL",
  phases: string[], mounting: Mounting, snap: SnapTarget[], packs: number[], w: DimRange, d: DimRange, h: DimRange,
  materialPreset: MaterialPreset = "ARCH_TEAL", authority: AssetAuthority = "ILLUSTRATIVE"): AssetParams =>
  ({ id: L + name + ".v1", aliases, file, library, category, metaCategory, rooms, phases, mounting, snap, packs, params: { w, d, h }, authority, lod: 1, materialPreset });
/** kind → the operator's semantic id. ID SOURCE (FINAL) = his COMPLETE 3D asset library (docs/architecture-2525/asset-library/
 *  3d-all-assets-2026-11-07/manifest.json — 139 real GLBs + metadata + PLAN SVGs; ids architect2525.asset.<name>.v1, matched by
 *  label). `aliases` keep the earlier starter-pack id (14 kinds) / rotator-catalog id (25 kinds) for provenance — kindByAssetId
 *  resolves them too, so a stored PlacedAsset from either edition still finds its kind. `mounting`/`snap`/`packs` are HIS
 *  (metadata verbatim) wherever they do not contradict OBJECT_SPEC.onWall — the designer snaps tv · rangehood · shelving ·
 *  shell to walls, so those four keep WALL/BUILT_IN (gated as the only deviations; his library places them on the floor).
 *  closet.rod / shoe.rack have NO library entry: ids in his grammar, `library: false` (PENDING), the only two (gated).
 *  table / chair are his "Verified extras" with packs [] — kept verbatim. */
export const ASSET_PARAMS: Record<ObjectKind, AssetParams> = {
  bed:        A("bed.queen.king",          ["furniture.bed.queen.v1"],                  "bed-queen-king",           true,  "FURNITURE",          "FURNITURE",         ["M"],                     PH_FURN,  "FLOOR",    FL,            [2],    R(3, 7),      R(5.5, 7.5),  R(1, 3.5),    "ARCH_TEAL", "REFERENCE"),
  sofa:       A("sofa",                    ["furniture.sofa.3seat.v1"],                 "sofa",                     true,  "FURNITURE",          "FURNITURE",         ["L"],                     PH_FURN,  "FLOOR",    FL,            [2],    R(4, 10),     R(2, 3.5),    R(2, 3.5)),
  counter:    A("base.cabinets.w.sink",    ["kitchen.base_run.sink.v1"],                "base-cabinets-w-sink",     true,  "FIXTURES",           "KITCHEN",           ["K", "D", "S"],           PH_FIXT,  "SURFACE",  ["SURFACE"],   [2],    R(1, 10),     R(1.5, 3),    R(2.5, 3.5),  "ARCH_TEAL", "REFERENCE"),
  table:      A("dining.table",            ["furniture.dining_table.v1"],               "dining-table",             true,  "FURNITURE",          "FURNITURE",         ["L", "D", "E"],           PH_FURN,  "FLOOR",    FL,            [],     R(2, 10),     R(2, 5),      R(2, 3.2)),
  desk:       A("desk",                    ["desk.v1"],                                 "desk",                     true,  "FURNITURE",          "FURNITURE",         ["M", "O"],                PH_FURN,  "FLOOR",    FL,            [2],    R(2.5, 8),    R(1.5, 3.5),  R(2, 3.2)),
  toilet:     A("toilet",                  ["bath.toilet.v1"],                          "toilet",                   true,  "FIXTURES",           "PLUMBING_FIXTURE",  ["B"],                     PH_FIXT,  "FLOOR",    FL,            [2],    R(1.5, 2.5),  R(2, 2.75),   R(2, 3),      "ARCH_TEAL", "REFERENCE"),
  tub:        A("bathtub",                 ["bathtub.v1"],                              "bathtub",                  true,  "FIXTURES",           "PLUMBING_FIXTURE",  ["B"],                     PH_FIXT,  "FLOOR",    FL,            [2],    R(4.5, 6.5),  R(2, 3.5),    R(1.5, 2.5),  "ARCH_TEAL", "REFERENCE"),
  sink:       A("bath.vanity.sink",        ["bath.vanity_sink.v1"],                     "bath-vanity-sink",         true,  "FIXTURES",           "PLUMBING_FIXTURE",  ["B", "K", "S"],           PH_FIXT,  "SURFACE",  ["SURFACE"],   [2],    R(1.5, 6),    R(1.5, 2.5),  R(2.5, 3.2)),
  washer:     A("washer",                  ["appliance.washer.frontload.v1"],           "washer",                   true,  "MECHANICAL",         "APPLIANCE",         ["S"],                     PH_FIXT,  "FLOOR",    FL,            [2, 4], R(2, 2.5),    R(2, 2.75),   R(2.75, 3.5), "ARCH_TEAL", "REFERENCE"),
  dresser:    A("dresser",                 ["furniture.dresser.v1"],                    "dresser",                  true,  "FURNITURE",          "FURNITURE",         ["C"],                     PH_FURN,  "FLOOR",    FL,            [2],    R(2.5, 6),    R(1.5, 2),    R(2.5, 4)),
  nightstand: A("nightstand",              ["furniture.nightstand.v1"],                 "nightstand",               true,  "FURNITURE",          "FURNITURE",         ["M"],                     PH_FURN,  "FLOOR",    FL,            [2],    R(1, 2.5),    R(1, 2),      R(1.5, 2.75)),
  tv:         A("tv.console",              ["tv.console.v1"],                           "tv-console",               true,  "FURNITURE",          "FURNITURE",         ["M", "L", "O"],           PH_FURN,  "WALL",     WL,            [2],    R(2, 7),      R(0.2, 1),    R(1.2, 4),    "SCREEN"),
  fridge:     A("refrigerator",            ["appliance.refrigerator.frenchdoor.v1"],    "refrigerator",             true,  "MECHANICAL",         "APPLIANCE",         ["K"],                     PH_FIXT,  "FLOOR",    FL,            [2, 4], R(2.5, 4),    R(2.25, 3),   R(5.5, 7),    "ARCH_TEAL", "REFERENCE"),
  stove:      A("range.oven",              ["range.oven.v1"],                           "range-oven",               true,  "MECHANICAL",         "APPLIANCE",         ["K"],                     PH_FIXT,  "FLOOR",    FL,            [2, 4], R(2, 4), R(2, 2.75), R(2.75, 3.25), "ARCH_TEAL", "REFERENCE"),
  shower:     A("shower.stall",            ["bath.shower.enclosure.v1"],                "shower-stall",             true,  "FIXTURES",           "PLUMBING_FIXTURE",  ["B"],                     PH_FIXT,  "FLOOR",    FL,            [2],    R(2.5, 6), R(2.5, 4), R(6.5, 8),   "GLASS"),
  wardrobe:   A("wardrobe",                ["wardrobe.v1"],                             "wardrobe",                 true,  "FURNITURE",          "FURNITURE",         ["C"],                     PH_FURN,  "FLOOR",    FL,            [2],    R(2.5, 8),    R(1.5, 2.5),  R(5.5, 8)),
  bookshelf:  A("bookshelf",               ["bookshelf.v1"],                            "bookshelf",                true,  "FURNITURE",          "FURNITURE",         ["L", "O", "E"],           PH_FURN,  "FLOOR",    FL,            [2],    R(2, 8),      R(0.75, 1.5), R(3, 8)),
  chair:      A("dining.chair",            ["furniture.dining_chair.v1"],               "dining-chair",             true,  "FURNITURE",          "FURNITURE",         ["M", "L", "D", "O", "E"], PH_FURN,  "FLOOR",    FL,            [],     R(1.25, 2.5), R(1.25, 2.5), R(2.5, 4)),
  closetrod:  A("closet.rod",              ["closet.rod.v1"],                           "closet-rod",               false, "FURNITURE",          "FURNITURE",         ["C"],                     PH_FURN,  "WALL",     WL,            [2],    R(3, 10),     R(1, 2),      R(4, 7)),
  shelving:   A("storage.shelving",        ["storage.shelving.v1"],                     "storage-shelving",         true,  "FURNITURE",          "FURNITURE",         ["B", "C", "S"],           PH_FURN,  "WALL",     WL,            [2],    R(2, 10),     R(0.75, 2),   R(2, 8)),
  shoerack:   A("shoe.rack",               ["shoe.rack.v1"],                            "shoe-rack",                false, "FURNITURE",          "FURNITURE",         ["C", "E"],                PH_FURN,  "FLOOR",    FL,            [2],    R(1.5, 4),    R(0.75, 1.5), R(1, 4)),
  rug:        A("area.rug",                ["area.rug.v1"],                             "area-rug",                 true,  "FURNITURE",          "LIFESTYLE",         ["L", "M"],                PH_FURN,  "FLOOR",    FL,            [9],    R(3, 10),     R(2, 10),     R(0.05, 0.2)),
  mirror:     A("mirror.led",              ["mirror.led.v1"],                           "mirror-led",               true,  "FIXTURES",           "FURNITURE",         ["M", "B", "C"],           PH_FURN,  "WALL",     WL,            [2],    R(1, 6),      R(0.1, 0.4),  R(1, 6),      "GLASS"),
  lamp:       A("floor.lamp",              ["floor.lamp.v1"],                           "floor-lamp",               true,  "LIGHTING",           "LIGHTING",          ["M", "L"],                PH_FURN,  "FLOOR",    FL,            [2],    R(0.5, 2),    R(0.5, 2),    R(3, 6.5)),
  rangehood:  A("range.hood",              ["range.hood.v1"],                           "range-hood",               true,  "MECHANICAL",         "APPLIANCE",         ["K"],                     PH_FIXT,  "WALL",     WL,            [2, 4], R(2, 4), R(1.25, 2.25), R(0.75, 2.5), "ARCH_TEAL", "REFERENCE"),
  shell:      A("wall.sheathing",          ["wall.sheathing.v1"],                       "wall-sheathing",           true,  "BUILDING_ELEMENTS",  "STRUCTURE",         "GENERAL",                 PH_SHELL, "BUILT_IN", WL,            [1],    R(2, 10),     R(0.3, 1.5),  R(6, 10)),
  roof:       A("roof.sheathing",          ["roof.sheathing.v1"],                       "roof-sheathing",           true,  "BUILDING_ELEMENTS",  "STRUCTURE",         "GENERAL",                 PH_SHELL, "BUILT_IN", ["ROOF_LINE"], [1],    R(2, 10), R(2, 10),   R(0.3, 1.5)),
  door:       A("door.interior.exterior",  ["opening.door.interior.v1"],                "door-interior-exterior",   true,  "DOORS_WINDOWS",      "OPENING",           "GENERAL",                 PH_OPEN,  "WALL",     WL,            [1],    R(2, 4),      R(0.1, 0.75), R(6.5, 8),    "ARCH_ACCENT", "REFERENCE"),
  window:     A("window.single",           ["opening.window.unit.v1"],                  "window-single",            true,  "DOORS_WINDOWS",      "OPENING",           "GENERAL",                 PH_OPEN,  "WALL",     WL,            [1],    R(1.5, 8),    R(0.2, 0.75), R(1.5, 6),    "GLASS", "REFERENCE"),
};
/** The asset definition of a kind (Rev A). */
export function assetParamsOf(kind: ObjectKind): AssetParams { return ASSET_PARAMS[kind]; }
/** The kind behind a STABLE asset id — or one of its provenance aliases (starter-pack / rotator ids) — or undefined. */
export function kindByAssetId(id: string): ObjectKind | undefined {
  const kinds = Object.keys(ASSET_PARAMS) as ObjectKind[];
  return kinds.find((k) => ASSET_PARAMS[k].id === id) ?? kinds.find((k) => ASSET_PARAMS[k].aliases.includes(id));
}

/**
 * S3 — CONTEXT-AWARE ROOM ASSETS. The SINGLE source mapping each room key (M/B/C/L/K/D/O/S/E — see room-layout) to the
 * furniture/appliances typically used there, so entering a bedroom offers bed·nightstand·dresser·wardrobe·tv·chair, a
 * kitchen offers counter·sink·fridge·stove, etc. (operator: "left selection matches the room"). VERSIONED so future
 * room types EXTEND this map rather than fork it (Odin). Palette = this list + always openings + structural shell.
 */
export const ROOM_ASSETS_VERSION = 1;
export const ROOM_ASSETS: Record<string, ObjectKind[]> = {
  // HI DECISION (Room Designer decision card → PROCEED · Layout A · simplify S1 · "No dresser; place that in other room.
  // Table / vanity with mirror works"): NO dresser, NO wardrobe in the Master Bedroom — clothes live in the Master Closet
  // (C, below, which lists both); a desk (the table/vanity) + wall mirror instead. R-CORE-locked by
  // tests/room-standard-layout.test.mjs — re-admitting either kind here fails the build (operator: "stop reverting").
  // HI DECISION (2026-10-31): "only have furniture — no rugs or curtains till the later polish stage after the house is
  // designed with the interior stage" → no soft furnishings in any default palette or standard layout (the `rug` kind
  // stays in OBJECT_SPEC; nothing is deleted). Gated by tests/room-standard-layout.test.mjs.
  M: ["bed", "nightstand", "desk", "tv", "chair", "mirror", "lamp"], // Master Bedroom
  B: ["toilet", "tub", "shower", "sink", "mirror", "shelving"],       // Master Bath
  C: ["wardrobe", "dresser", "closetrod", "shelving", "shoerack", "mirror"], // Master Closet (FIX-9)
  L: ["sofa", "tv", "table", "chair", "bookshelf", "lamp"],           // Living Room (no rug by default — HI 2026-10-31)
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
  // R5b (Thor): OWN keys only — ROOM_ASSETS["constructor"] is a function, and spreading it threw on the render path.
  const base = Object.hasOwn(ROOM_ASSETS, roomKey) ? ROOM_ASSETS[roomKey] : GENERAL_ASSETS;
  const seen = new Set<ObjectKind>();
  const out: ObjectKind[] = [];
  for (const k of [...base, ...COMMON_ASSETS]) if (!seen.has(k)) { seen.add(k); out.push(k); }
  return out;
}

/**
 * IMG-02 (operator 2026-10-24): a room's DEFAULT furniture must SHOW when you enter it (it was vanishing) and the
 * 2D plan ⇄ 3D voxel must MIRROR. The fix is one source: a room with no saved objects falls back to THIS deterministic
 * default layout — a DECIDED standard layout when the room has one (STANDARD_LAYOUTS — the Master Bedroom's Layout A,
 * R5), else its ROOM_ASSETS packed on the 10×10 grid. Pure, no Math.random (replay law): identical room key →
 * identical objects, so the 2D plan, the 3D voxel, and the entered designer all render the same furniture. On the
 * first edit the designer commits the full set, so it persists.
 */
export function defaultObjectsForRoom(roomKey: string): PlacedObject[] {
  const std = standardLayoutFor(roomKey);
  if (std) return std;
  const kinds = Object.hasOwn(ROOM_ASSETS, roomKey) ? ROOM_ASSETS[roomKey] : [];
  // AsM-caught (Thoth BLOCKER): a row packer dropped the Master Bedroom's small items after the 6'-deep bed, which
  // re-triggered the "defaults vanish" HOLD. Use a greedy OCCUPANCY-GRID packer instead: place the biggest footprints
  // first, first-fit (top-left) on a 1-ft cell grid, so the small pieces (mirror, lamp, tv…) GAP-FILL the space around
  // the bed. Deterministic (stable sort: largest area, ties by ROOM_ASSETS order) — no Math.random (replay law).
  const N = ROOM_GRID;
  const occ: boolean[][] = Array.from({ length: N }, () => new Array(N).fill(false));
  const freeAt = (x: number, y: number, w: number, dd: number): boolean => {
    if (x + w > N || y + dd > N) return false;
    for (let j = y; j < y + dd; j++) for (let i = x; i < x + w; i++) if (occ[j][i]) return false;
    return true;
  };
  const items = kinds.map((kind, idx) => { const sp = OBJECT_SPEC[kind]; return { kind, idx, w: Math.max(1, Math.ceil(sp.w)), d: Math.max(1, Math.ceil(sp.d)), fw: sp.w, fd: sp.d }; })
    .filter((it) => it.w <= N && it.d <= N)
    .sort((a, b) => (b.w * b.d - a.w * a.d) || (a.idx - b.idx));   // biggest first; stable tie-break = deterministic
  let objs: PlacedObject[] = [];
  for (const it of items) {
    let done = false;
    for (let y = 0; y <= N - it.d && !done; y++) for (let x = 0; x <= N - it.w && !done; x++) {
      if (!freeAt(x, y, it.w, it.d)) continue;
      // Place the footprint inside its reserved ceil-cell block [x, x+fw]×[y, y+fd] — in the ONE centre-of-cell
      // convention (worldSpan: centre = g+0.5) that is gx = x + fw/2 - 0.5 — so it can NEVER poke into a neighbour
      // or through a wall in ANY view (the designer's own 2D/3D, the house plan, the house voxel). Zero overlap over
      // all nine rooms (tests/room-objects.test.mjs). Half-foot coordinates are legal (the guard keeps finite numbers).
      objs = [...objs, { id: nextId(objs, it.kind), kind: it.kind, gx: r2(x + it.fw / 2 - 0.5), gy: r2(y + it.fd / 2 - 0.5), rot: 0 }];
      for (let j = y; j < y + it.d; j++) for (let i = x; i < x + it.w; i++) occ[j][i] = true;
      done = true;
    }
  }
  return objs;
}
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * R5 (2026-10-31) — STANDARD LAYOUTS: a room whose default furniture is DECIDED, not packed. The operator's Room
 * Designer decision card (PROCEED · Layout A · simplify S1 · "No dresser; place that in other room. Table / vanity with
 * mirror works"), repeated on 2026-10-30 ("stop reverting; this is why you have R-Core: we already said this is too
 * busy"). One source for the Master Bedroom; the packer stays the fallback for every other room. Centre-of-cell
 * coordinates (worldSpan), 10×10 ft, N = top (gy 0), the room's EXTERIOR walls at N and W (M sits at row 0 · col 0 of
 * the 3×3), the entry door on the S wall from the Living Room:
 *   bed 5×6 head on the N wall, centred (x 2.5–7.5 · y 0–6) · two nightstands flanking the head · the desk (table /
 *   vanity) 2×4 against the W wall with the wall mirror above it (elev 3 ft) · a 6×4 rug at the foot of the bed ·
 *   TWO windows on the exterior walls (N over the right nightstand · W beside the bed; 3-ft sill) · the door on the S
 *   wall clear of the vanity. tv · chair · lamp stay in the palette (ROOM_ASSETS.M) but are NOT placed — "too busy".
 * Pure + deterministic (replay law). R-CORE-locked by tests/room-standard-layout.test.mjs.
 */
export const STANDARD_LAYOUTS: Record<string, PlacedObject[]> = {
  // R5b — LAYOUT A′ (HI 2026-10-31, after the fleet measured R5's Layout A: the vanity sat 6" from the bed and the door swept it):
  // the vanity + mirror go OPPOSITE the bed on the S wall, where the decision card put the dresser; NO rug ("only furniture —
  // no rugs or curtains till the later polish stage"). Clearances (gated): 2.5-ft aisles beside the bed · 2 ft bed-foot → vanity
  // · the door's 3-ft swing clear of everything · a 36" chair zone beside the bed in front of the vanity (x 7.5–10 · y 5–8).
  M: [
    { id: "bed-1",        kind: "bed",        gx: 4.5, gy: 2.5, rot: 0 },            // centre (5, 3) · x 2.5–7.5 · y 0–6 · head on the N wall
    { id: "nightstand-1", kind: "nightstand", gx: 1,   gy: 0.25, rot: 0 },           // flush at the head, left · x 0.75–2.25 · y 0–1.5
    { id: "nightstand-2", kind: "nightstand", gx: 8,   gy: 0.25, rot: 0 },           // flush at the head, right · x 7.75–9.25 · y 0–1.5
    { id: "desk-1",       kind: "desk",       gx: 7.5, gy: 8.5, rot: 0 },            // the table/vanity on the S wall, opposite the bed · x 6–10 · y 8–10
    { id: "mirror-1",     kind: "mirror",     gx: 7.5, gy: 9,   rot: 0, elev: 3 },   // the wall mirror above the vanity (S wall)
    { id: "window-1",     kind: "window",     gx: 7.5, gy: 0,   rot: 0 },            // N (exterior) · over the right nightstand · x 6.5–9.5 (clear of the corner)
    { id: "window-2",     kind: "window",     gx: 0,   gy: 2.5, rot: 90 },           // W (exterior) · beside the bed · y 1.5–4.5
    { id: "door-1",       kind: "door",       gx: 1,   gy: 9,   rot: 0 },            // S wall · from the Living Room · x 0–3
  ],
};
/** The standard layouts' edition. A stored room whose `layoutRev` is older is re-seated to the decided layout on load
 * (the WireGuard, lib/architect-guard.ts) — "stop reverting" reaches the devices that saved the earlier edition too. */
export const STANDARD_LAYOUT_REV = 2;
/** The decided layout for a room key (a fresh copy), or null when the room has none (→ the packer). */
export function standardLayoutFor(roomKey: string): PlacedObject[] | null {
  // R5b (Thor): OWN keys only — STANDARD_LAYOUTS["constructor"] is Object, and `.map` on it threw through the guard.
  const l = Object.hasOwn(STANDARD_LAYOUTS, roomKey) ? STANDARD_LAYOUTS[roomKey] : undefined;
  return l ? l.map((o) => ({ ...o })) : null;
}

/** Every DECIDED edition of the standard layouts, so the guard can tell an UNTOUCHED prior edition (re-seat it to the current
 * one — "stop reverting" reaches every device) from a room the user ARRANGED (keep it, stamp it — a seed merges into a saved
 * copy, it never replaces it; AsM-caught, Krishna). Edition 1 = Layout A (R5: the vanity on the W wall, a rug at the foot);
 * edition 2 = A′ (R5b, the 2026-10-31 HI answer: no rug). Edition 0 = no decided layout existed (the packer), always re-seated. */
export const STANDARD_LAYOUT_EDITIONS: Record<number, Record<string, PlacedObject[]>> = {
  1: {
    M: [
      { id: "bed-1",        kind: "bed",        gx: 4.5, gy: 2.5, rot: 0 },
      { id: "nightstand-1", kind: "nightstand", gx: 1,   gy: 0.5, rot: 0 },
      { id: "nightstand-2", kind: "nightstand", gx: 8,   gy: 0.5, rot: 0 },
      { id: "desk-1",       kind: "desk",       gx: 0.5, gy: 5.5, rot: 90 },
      { id: "mirror-1",     kind: "mirror",     gx: 0,   gy: 5.5, rot: 90, elev: 3 },
      { id: "rug-1",        kind: "rug",        gx: 6,   gy: 7.5, rot: 0 },
      { id: "window-1",     kind: "window",     gx: 8,   gy: 0,   rot: 0 },
      { id: "window-2",     kind: "window",     gx: 0,   gy: 2.5, rot: 90 },
      { id: "door-1",       kind: "door",       gx: 1,   gy: 9,   rot: 0 },
    ],
  },
  2: STANDARD_LAYOUTS,
};
/** The decided layout of a room key at a given edition (a fresh copy), or null. */
export function standardLayoutAt(roomKey: string, rev: number): PlacedObject[] | null {
  const ed = Object.hasOwn(STANDARD_LAYOUT_EDITIONS, rev) ? STANDARD_LAYOUT_EDITIONS[rev] : undefined;
  const l = ed && Object.hasOwn(ed, roomKey) ? ed[roomKey] : undefined;
  return l ? l.map((o) => ({ ...o })) : null;
}
/** The same arrangement: the same kinds at the same centres, rotations, variants and elevations (ids and order ignored). */
export function sameArrangement(a: readonly PlacedObject[], b: readonly PlacedObject[]): boolean {
  if (a.length !== b.length) return false;
  // Rev A: the per-instance size is part of the arrangement — a resized piece is an ARRANGED piece the guard keeps.
  const sz = (o: PlacedObject) => (o.size ? `${o.size.w ?? ""}x${o.size.d ?? ""}x${o.size.h ?? ""}` : "");
  const key = (o: PlacedObject) => `${o.kind}@${o.gx},${o.gy},${o.rot},${o.variant ?? ""},${o.elev ?? ""},${sz(o)}`;
  const sa = a.map(key).sort(), sb = b.map(key).sort();
  return sa.every((k, i) => k === sb[i]);
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
  // R5 (AsM-caught): footprint-aware and NOT rounded — a half-foot centre (the standard layout's bed at gx 4.5, the
  // vanity at 0.5) mirrors to its exact twin and stays inside the room; clampCell's Math.round pushed the mirrored
  // vanity through the far wall and the bed ½ ft off-centre on the first Mirror.
  // R5b: a true reflection also maps the ORIENTATION — h: 90↔270 (a W-wall piece becomes an E-wall piece, hinge side flipped),
  // v: 0↔180 (a headboard on the N wall ends on the S wall). Exact for every bilaterally symmetric shape; an involution.
  const flipRot = (r: Rot): Rot => axis === "h" ? (r === 90 ? 270 : r === 270 ? 90 : r) : (r === 0 ? 180 : r === 180 ? 0 : r);
  return objs.map((o) => {
    const fp = footprintOf(o);
    const c = axis === "h"
      ? clampFootprint(ROOM_GRID - 1 - o.gx, o.gy, fp.w, fp.d, o.rot, false)
      : clampFootprint(o.gx, ROOM_GRID - 1 - o.gy, fp.w, fp.d, o.rot, false);
    // R5c: a DOOR keeps its rot — its rot is the hinge side, and the door symbol's nearest-corner rule already reflects the
    // hinge with the position; flipping it too put the hinge on the wrong jamb for mirror v of an N/S door (AsM-caught).
    return { ...o, rot: o.kind === "door" ? o.rot : flipRot(o.rot), gx: c.gx, gy: c.gy };
  });
}
