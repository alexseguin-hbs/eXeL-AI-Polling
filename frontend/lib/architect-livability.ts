/**
 * ARCHITECT-2525 · LIVABILITY (LIV-6, operator 2026-11-11 "make sq footage is livable 900 sq ft"). The ONE computed answer to
 * "is this 900 ft² a real home?" — derived, never asserted. A house is LIVABLE when it is:
 *   • CONNECTED — every room reachable from the front door, the master suite private + internally connected (architect-circulation).
 *   • LIT       — every habitable room has daylight: a window of its own, OR borrowed light through a CASED opening to a lit room
 *                 (the open social core lights the windowless centre kitchen). IRC R303 exempts kitchens/baths/closets/laundry/
 *                 entry from the glazing rule, so those are "lit" by borrowed light or exempt; the bedroom + living + office +
 *                 dining are habitable and need real light.
 *   • FUNCTIONED— every room carries its anchor furniture (a bedroom has a bed, a kitchen a stove + sink, a bath a toilet, …).
 * Pure + deterministic (no Date.now / Math.random) → replayable, gate-checked. The Overview + Master Readout read THIS so the
 * app can SHOW the 900 ft² is livable, not just claim it.
 */
import { TINY_ROOM_LAYOUT, type RoomCell } from "./room-layout";
import { defaultObjectsForRoom, wallOfObject, type PlacedObject, type ObjectKind } from "./room-objects";
import { circulationReport, neighbourOf } from "./architect-circulation";

/** The anchor furniture that makes each room function (at least one of its anchor kinds must be present). */
export const ROOM_FUNCTION: Record<string, ObjectKind[]> = {
  M: ["bed"], B: ["toilet"], C: ["wardrobe", "shelving", "closetrod"], L: ["sofa"], K: ["stove", "counter"],
  D: ["table"], O: ["desk"], S: ["washer"], E: ["chair", "door"],
};
/** The HABITABLE rooms that require real daylight (a window or borrowed light) — the others are IRC-exempt utility rooms. */
export const HABITABLE_KEYS = ["M", "L", "O", "D"] as const;

/** The set of rooms that are LIT: directly (a window object) or by borrowed light through a CASED opening to a lit room. */
export function litRooms(layout: RoomCell[] = TINY_ROOM_LAYOUT, objectsFor: (k: string) => PlacedObject[] = defaultObjectsForRoom): Set<string> {
  const lit = new Set<string>();
  for (const r of layout) if (objectsFor(r.k).some((o) => o.kind === "window")) lit.add(r.k);
  // borrowed light passes ONLY through cased (leafless) openings — a closed swing door does not carry daylight
  const cell: Record<string, RoomCell> = {};
  for (const r of layout) cell[r.k] = r;
  const casedEdges: [string, string][] = [];
  for (const r of layout) for (const o of objectsFor(r.k)) {
    if (o.kind === "door" && o.cased) { const n = neighbourOf(r, wallOfObject(o)); if (n) casedEdges.push([r.k, n]); }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [a, b] of casedEdges) {
      if (lit.has(a) && !lit.has(b)) { lit.add(b); changed = true; }
      if (lit.has(b) && !lit.has(a)) { lit.add(a); changed = true; }
    }
  }
  return lit;
}

export interface LivabilityReport {
  connected: boolean;
  lit: Record<string, boolean>;
  allHabitableLit: boolean;
  functioned: Record<string, boolean>;
  allFunctioned: boolean;
  livable: boolean;
  bedrooms: number;
  baths: number;
  netSqft: number;
  headline: string;      // e.g. "900 ft² · 1 bed · 1 bath · livable"
}

/** The full livability report for a layout. Pure + deterministic. */
export function livabilityReport(layout: RoomCell[] = TINY_ROOM_LAYOUT, objectsFor: (k: string) => PlacedObject[] = defaultObjectsForRoom): LivabilityReport {
  const circ = circulationReport(layout, objectsFor);
  const connected = circ.severed.length === 0 && circ.suiteConnected && circ.publicThroughSuite.length === 0 && circ.suiteAttachPoints.length === 1;
  const lit = litRooms(layout, objectsFor);
  const litMap: Record<string, boolean> = {};
  for (const r of layout) litMap[r.k] = lit.has(r.k);
  const allHabitableLit = HABITABLE_KEYS.every((k) => lit.has(k));
  const functioned: Record<string, boolean> = {};
  for (const r of layout) {
    const anchors = ROOM_FUNCTION[r.k] ?? [];
    const objs = objectsFor(r.k);
    functioned[r.k] = anchors.length === 0 || anchors.some((a) => objs.some((o) => o.kind === a));
  }
  const allFunctioned = layout.every((r) => functioned[r.k]);
  const livable = connected && allHabitableLit && allFunctioned;
  const bedrooms = layout.filter((r) => objectsFor(r.k).some((o) => o.kind === "bed")).length;
  const baths = layout.filter((r) => objectsFor(r.k).some((o) => o.kind === "toilet")).length;
  const netSqft = layout.length * 100; // 9 × 10×10 clear
  const headline = `${netSqft} ft² · ${bedrooms} bed · ${baths} bath · ${livable ? "livable" : "NOT yet livable"}`;
  return { connected, lit: litMap, allHabitableLit, functioned, allFunctioned, livable, bedrooms, baths, netSqft, headline };
}
