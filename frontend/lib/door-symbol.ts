/**
 * ARCHITECT-2525 · THE DOOR SYMBOL (R5c, operator 2026-10-31: "also ensure bedroom has door and standard engineering convention
 * for door"). The standard architectural plan symbol for a swinging door, as ONE pure helper every surface draws from:
 *   • the OPENING — the wall is cut for the door's width between two JAMBS on the wall line;
 *   • the LEAF — a thin line from the HINGE jamb, perpendicular to the wall, one door-width long (the door open at 90°);
 *   • the SWING — a thin quarter-circle arc centred on the hinge, radius = the width, from the leaf's free end to the STRIKE jamb;
 *   • the door swings INTO the room it is drawn in (a bedroom door swings into the bedroom);
 *   • the hinge sits on the jamb nearer the nearest corner, so the open leaf lies against the adjacent wall; a wall object's
 *     Rotate (rot 0 ↔ 180 on N/S, 90 ↔ 270 on W/E — room-objects.ts R5b) FLIPS the hinge to the other jamb. No new field, no
 *     guard change, no layout edition: a saved Layout A′ re-renders by the convention untouched.
 * Coordinates: room feet, x right, y DOWN (the S wall is y = ROOM_GRID) — the same frame as worldSpan / the 2D plan.
 * Not modelled (said on the FX card, queued): swing-out doors (closets), sliding/pocket doors, a stored hinge field.
 * Pure + deterministic. Gated by tests/door-convention.test.mjs.
 */
import { ROOM_GRID, worldSpan, wallOfObject, type PlacedObject, type Wall } from "./room-objects";

export interface Pt { x: number; y: number }
export interface DoorSymbol {
  wall: Wall;
  jambA: Pt; jambB: Pt;       // the opening's two jambs on the wall line (A = the lower coordinate along the wall)
  hinge: Pt; strike: Pt;      // which jamb carries the hinge; the other takes the latch
  leafEnd: Pt;                // the free end of the open leaf (hinge + into × r)
  r: number;                  // the door width (ft) = the leaf length = the swing radius
  sweep: 0 | 1;               // the SVG arc sweep flag that bulges the quarter circle into the room (y-down frame)
  into: Pt;                   // unit normal from the wall into the room
}
export interface SymbolOpts { room?: number; inset?: number; flip?: boolean }

/** The symbol for a door whose opening spans [a1, a2] along `wall` (ft along that wall). `inset` moves the wall line inward
 *  (the room designer draws its wall 0.1 ft inside the room edge); `flip` puts the hinge on the other jamb. */
export function symbolForSpan(wall: Wall, a1: number, a2: number, opts: SymbolOpts = {}): DoorSymbol {
  const room = opts.room ?? ROOM_GRID, inset = opts.inset ?? 0;
  const lo = Math.min(a1, a2), hi = Math.max(a1, a2), r = hi - lo;
  const horiz = wall === "N" || wall === "S";
  const line = wall === "N" || wall === "W" ? inset : room - inset;                     // the wall line's fixed coordinate
  const into: Pt = wall === "N" ? { x: 0, y: 1 } : wall === "S" ? { x: 0, y: -1 } : wall === "W" ? { x: 1, y: 0 } : { x: -1, y: 0 };
  const at = (a: number): Pt => (horiz ? { x: a, y: line } : { x: line, y: a });
  const jambA = at(lo), jambB = at(hi);
  let hingeLow = lo <= room - hi;                       // the jamb nearer the nearest corner (a tie → the low jamb)
  if (opts.flip) hingeLow = !hingeLow;
  const hinge = hingeLow ? jambA : jambB, strike = hingeLow ? jambB : jambA;
  const leafEnd = { x: hinge.x + into.x * r, y: hinge.y + into.y * r };
  // In a y-down frame a positive cross product means strike is CLOCKWISE from leafEnd about the hinge → SVG sweep 1.
  const cross = (leafEnd.x - hinge.x) * (strike.y - hinge.y) - (leafEnd.y - hinge.y) * (strike.x - hinge.x);
  return { wall, jambA, jambB, hinge, strike, leafEnd, r, sweep: cross > 0 ? 1 : 0, into };
}

/** The symbol for a placed door: its wall from wallOfObject, its opening from worldSpan, the hinge flipped by rot 180/270. */
export function doorSymbol(o: PlacedObject, opts: SymbolOpts = {}): DoorSymbol {
  const wall = wallOfObject(o), s = worldSpan(o);
  const horiz = wall === "N" || wall === "S";
  const a1 = horiz ? s.x1 : s.y1, a2 = horiz ? s.x2 : s.y2;
  return symbolForSpan(wall, a1, a2, { ...opts, flip: o.rot === 180 || o.rot === 270 });
}

/** `n` points along the swing arc from the leaf's free end to the strike jamb (the short 90° way), for polylines. */
export function arcPoints(sym: DoorSymbol, n = 12): Pt[] {
  const a0 = Math.atan2(sym.leafEnd.y - sym.hinge.y, sym.leafEnd.x - sym.hinge.x);
  const a1 = Math.atan2(sym.strike.y - sym.hinge.y, sym.strike.x - sym.hinge.x);
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1), a = a0 + d * t;
    pts.push({ x: sym.hinge.x + sym.r * Math.cos(a), y: sym.hinge.y + sym.r * Math.sin(a) });
  }
  return pts;
}

export interface DoorSymbolSvg {
  opening: { x1: number; y1: number; x2: number; y2: number };
  leaf: { x1: number; y1: number; x2: number; y2: number };
  arc: string;                       // an SVG path: M leafEnd A rx ry 0 0 sweep strike (elliptical under a non-uniform scale)
  hinge: Pt; strike: Pt; leafEnd: Pt; into: Pt;
}
const f = (n: number): string => String(Number(n.toFixed(3)));
/** Project the symbol into SVG units: `sx`/`sy` units per foot, `ox`/`oy` the room's origin. */
export function doorSymbolSvg(sym: DoorSymbol, sx: number, sy: number, ox: number, oy: number): DoorSymbolSvg {
  const P = (p: Pt): Pt => ({ x: ox + p.x * sx, y: oy + p.y * sy });
  const a = P(sym.jambA), b = P(sym.jambB), h = P(sym.hinge), s = P(sym.strike), e = P(sym.leafEnd);
  return {
    opening: { x1: a.x, y1: a.y, x2: b.x, y2: b.y },
    leaf: { x1: h.x, y1: h.y, x2: e.x, y2: e.y },
    arc: `M ${f(e.x)} ${f(e.y)} A ${f(sym.r * sx)} ${f(sym.r * sy)} 0 0 ${sym.sweep} ${f(s.x)} ${f(s.y)}`,
    hinge: h, strike: s, leafEnd: e, into: sym.into,
  };
}
