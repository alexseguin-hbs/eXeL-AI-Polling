/**
 * ARCHITECT-2525 · CAD DIMENSION ANNOTATIONS (S5) — turns a placed object into standard home-building dimension
 * callouts so a vendor can build each room to a PUBLISHED standard (max modularity). Pure + deterministic (feet
 * from the grid → feet-inch labels), so the 2D plan just draws what this returns while a window/door/furniture is
 * dragged or selected. Nomenclature: feet-inches (F'-I"), R.O. (rough opening), O.C. (on-center), AFF (above
 * finished floor). All coordinates are in FEET on the 10×10 room grid (0..10); the renderer scales ×10 to viewBox.
 */
import { wallOf, type PlacedObject, type ObjectKind } from "./room-objects";

export const ROOM_FT = 10; // 10 ft room edge (one grid cell = 1 ft)

/** Format decimal feet as standard feet-inches, inches rounded to the nearest inch: 3 → 3'-0", 6.7 → 6'-8". */
export function ftIn(feet: number): string {
  const totalIn = Math.round(Math.max(0, feet) * 12);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  return `${ft}'-${inch}"`;
}

/** What a tappable dimension edits (FIX-5): "oc" = on-centre POSITION · "size" = size · "gapNear"/"gapFar" =
 * clearance from a wall to the object's near/far edge (editing one shifts the object so the chain still sums to the room). */
export type DimEdit = "oc" | "size" | "gapNear" | "gapFar";

/** One segment of the wall→edge · size · edge→wall dimension chain (feet coords along one axis). */
export interface ChainSeg { kind: "gapNear" | "size" | "gapFar"; ft: number; a: number; b: number; label: string; edit: DimEdit }
/** The 3-segment dimension chain for a selected object along one axis (operator: wall→edge, object, edge→wall). */
export interface DimChain { axis: "x" | "y"; along: number; segs: ChainSeg[] }

/**
 * Build the wall→near-edge · object · far-edge→wall chain for an object along its primary axis (a wall opening runs
 * ALONG its wall; free furniture uses the X/width axis). The three segments always sum to the room dimension, so
 * editing any one (and re-deriving) updates the others. Pure + deterministic.
 */
export function chainDims(o: PlacedObject, spec: { onWall: boolean }, footprint: { w: number; d: number }, roomFt = ROOM_FT, forceAxis?: "x" | "y"): DimChain {
  const wall = spec.onWall ? wallOf(o.gx, o.gy) : "N";
  // forceAxis lets the renderer draw BOTH the horizontal (x) and vertical (y) chains for free furniture (operator:
  // "include vertical coordinates as well in same matter"); default = the object's primary axis (as before).
  const axis: "x" | "y" = forceAxis ?? (wall === "W" || wall === "E" ? "y" : "x");
  const centre = axis === "x" ? o.gx + 0.5 : o.gy + 0.5;
  const size = axis === "x" ? footprint.w : footprint.d;
  const near = Math.max(0, centre - size / 2);          // wall(0) → near edge
  const far = Math.max(0, roomFt - (centre + size / 2)); // far edge → wall(roomFt)
  // place the chain just OUTSIDE the object on the perpendicular axis (inside the room)
  const perpCentre = axis === "x" ? o.gy + 0.5 : o.gx + 0.5;
  const perpHalf = axis === "x" ? footprint.d / 2 : footprint.w / 2;
  const along = Math.min(roomFt - 0.4, perpCentre + perpHalf + 0.4);
  return {
    axis, along,
    segs: [
      { kind: "gapNear", ft: near, a: 0, b: near, label: ftIn(near), edit: "gapNear" },
      { kind: "size", ft: size, a: near, b: near + size, label: ftIn(size), edit: "size" },
      { kind: "gapFar", ft: far, a: near + size, b: roomFt, label: ftIn(far), edit: "gapFar" },
    ],
  };
}
/** A dimension witness line (feet coords) with a text label at its midpoint; `edit` marks it tappable to fine-tune. */
export interface DimLine { x1: number; y1: number; x2: number; y2: number; label: string; edit?: DimEdit }
/** A free-text note (R.O./AFF/size); `edit` marks it tappable to fine-tune (FIX-5). */
export interface DimNote { text: string; edit?: DimEdit }
/** The full CAD annotation for one object: witness lines + notes (R.O./AFF etc.). */
export interface DimAnnot { lines: DimLine[]; notes: DimNote[] }

const STD_SILL_AFF_FT = 3; // standard window sill height above finished floor

/**
 * CAD annotation for a placed object. Wall openings (door/window) get an ON-CENTER dimension from the near corner
 * along their wall + a ROUGH-OPENING size note (+ SILL AFF for windows); free furniture gets a W×D size line/note.
 */
export function annotateObject(o: PlacedObject, spec: { w: number; d: number; h: number; onWall: boolean }, footprint: { w: number; d: number }): DimAnnot {
  const cx = o.gx + 0.5, cy = o.gy + 0.5; // object centre in feet
  const lines: DimLine[] = [];
  const notes: DimNote[] = [];
  const off = 0.5; // inset of the dimension line from the wall (ft)
  if (spec.onWall) {
    const wall = wallOf(o.gx, o.gy);
    if (wall === "N") lines.push({ x1: 0, y1: off, x2: cx, y2: off, label: `${ftIn(cx)} O.C.`, edit: "oc" });
    else if (wall === "S") lines.push({ x1: 0, y1: ROOM_FT - off, x2: cx, y2: ROOM_FT - off, label: `${ftIn(cx)} O.C.`, edit: "oc" });
    else if (wall === "W") lines.push({ x1: off, y1: 0, x2: off, y2: cy, label: `${ftIn(cy)} O.C.`, edit: "oc" });
    else lines.push({ x1: ROOM_FT - off, y1: 0, x2: ROOM_FT - off, y2: cy, label: `${ftIn(cy)} O.C.`, edit: "oc" });
    notes.push({ text: `R.O. ${ftIn(footprint.w)} × ${ftIn(spec.h)}`, edit: "size" });
    if (o.kind === "window") notes.push({ text: `SILL ${ftIn(STD_SILL_AFF_FT)} AFF` });
  } else {
    const x1 = cx - footprint.w / 2, x2 = cx + footprint.w / 2;
    const y = Math.min(ROOM_FT, cy + footprint.d / 2 + 0.4);
    lines.push({ x1, y1: y, x2, y2: y, label: ftIn(footprint.w), edit: "size" });
    notes.push({ text: `${ftIn(footprint.w)} × ${ftIn(footprint.d)}`, edit: "size" });
  }
  return { lines, notes };
}
