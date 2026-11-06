// ROOM ICONOLOGY CHROME — the ONE pure source of the selected element's on-plan chrome (operator 2026-11-06, with a
// phone shot of the room view: "standardize the element iconology so NOTHING overlaps"). The room designer's render AND
// the no-overlap gate (tests/room-iconology.test.mjs) both read from here, so the truth cannot drift between what ships
// and what is tested. Pure (no React / DOM): worldSpan / OBJECT_SPEC / VARIANTS / wallOf are the pure room-objects model.
//
// THE STANDARD, every element kind:
//  · GRIP   — a drag handle pinned to the object's top-left corner, CLAMPED so its 2.3×3.3 box never crosses the walls.
//  · BADGE  — the element's name, nudged to the first CLEAR side (into the room for a wall piece, so it is never over its
//             own opening) that holds no neighbour footprint and stays fully inside the walls, then clamped inside.
//  · the always-on per-element grip is gone from the loop — only the SELECTED element carries chrome.
// Coordinates are viewBox units (0..100); the single 10×10 room is 100 units, 10 units = 1 ft.
import { worldSpan, OBJECT_SPEC, VARIANTS, wallOf, type PlacedObject } from "./room-objects";

export interface Rect { x1: number; y1: number; x2: number; y2: number }
export interface RoomChrome { grip: { x: number; y: number }; badge: { bx: number; by: number }; name: string; halfW: number }

// the badge's half-height band around its baseline (y −3 .. +2.6 → ~5.6 tall), kept in one place
const BADGE_UP = 3, BADGE_DOWN = 2.6;

/** Two axis-aligned rects overlap (strictly positive area). */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0 && Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0;
}

/** The element's footprint as a viewBox-unit rect (feet → ×10). */
export function footprintRect(o: PlacedObject): Rect {
  const s = worldSpan(o);
  return { x1: s.x1 * 10, y1: s.y1 * 10, x2: s.x2 * 10, y2: s.y2 * 10 };
}

/** The badge's rect for a given chrome (the box the name label occupies). */
export function badgeRect(c: RoomChrome): Rect {
  return { x1: c.badge.bx - c.halfW, y1: c.badge.by - BADGE_UP, x2: c.badge.bx + c.halfW, y2: c.badge.by + BADGE_DOWN };
}

/**
 * The selected element's chrome. `others` are the room's other visible elements the badge must avoid.
 * Deterministic (replay-safe): same inputs → same chrome.
 */
export function chromeFor(o: PlacedObject, others: PlacedObject[] = []): RoomChrome {
  const fp = footprintRect(o);
  const { x1: bx1, y1: by1, x2: bx2, y2: by2 } = fp;
  const ocx = (bx1 + bx2) / 2, ocy = (by1 + by2) / 2;
  // GRIP — the object's top-left corner, clamped so the 2.3×3.3 handle box stays inside the walls (never spills over)
  const grip = { x: Math.max(2.2, Math.min(97.8, bx1)), y: Math.max(2.7, Math.min(97.3, by1)) };
  const vlab = VARIANTS[o.kind]?.find((v) => v.id === o.variant)?.label;
  const name = `${vlab ? vlab + " " : ""}${OBJECT_SPEC[o.kind].label}`;
  const halfW = name.length * 0.98 + 2;                                 // badge rect: 2·halfW wide
  const rectOf = (bx: number, by: number): Rect => ({ x1: bx - halfW, y1: by - BADGE_UP, x2: bx + halfW, y2: by + BADGE_DOWN });
  const others_ = others.filter((q) => q.id !== o.id).map(footprintRect);
  // total area the badge rect would overlap every other footprint (0 = a clear spot)
  const overlapArea = (bx: number, by: number) => {
    const r = rectOf(bx, by);
    let a = 0;
    for (const s of others_) { const w = Math.min(r.x2, s.x2) - Math.max(r.x1, s.x1), h = Math.min(r.y2, s.y2) - Math.max(r.y1, s.y1); if (w > 0 && h > 0) a += w * h; }
    return a;
  };
  // ANCHOR — where the badge WANTS to be: into the room for a wall piece (so it never sits over its own opening), else
  // just above the element. The clear spot NEAREST this anchor is chosen, so the badge nudges the smallest sensible way.
  const wall = OBJECT_SPEC[o.kind].onWall ? wallOf(o.gx, o.gy) : null;
  const anchor = wall === "N" ? { bx: (bx1 + bx2) / 2, by: by2 + 3.4 }
    : wall === "S" ? { bx: (bx1 + bx2) / 2, by: by1 - 3.4 }
    : wall === "W" ? { bx: bx2 + halfW + 1.2, by: (by1 + by2) / 2 }
    : wall === "E" ? { bx: bx1 - halfW - 1.2, by: (by1 + by2) / 2 }
    : { bx: (bx1 + bx2) / 2, by: by1 - 3.4 };
  // Scan the room for the nearest CLEAR spot; if the room is too packed for any clear spot, take the least-overlapping
  // one. Deterministic grid (2-unit step) → replay-safe. The scan always finds a clear spot when one exists anywhere.
  const dist2 = (bx: number, by: number) => (bx - anchor.bx) ** 2 + (by - anchor.by) ** 2;
  let clear: { bx: number; by: number } | null = null, clearD = Infinity;
  let least: { bx: number; by: number } | null = null, leastScore = Infinity, leastD = Infinity;
  const loX = 1 + halfW, hiX = 99 - halfW, loY = 4, hiY = 96.4;
  for (let by = loY; by <= hiY + 1e-9; by += 2) {
    for (let bx = loX; bx <= hiX + 1e-9; bx += 2) {
      const a = overlapArea(bx, by), d = dist2(bx, by);
      if (a === 0) { if (d < clearD) { clearD = d; clear = { bx, by }; } }
      else if (a < leastScore - 1e-9 || (Math.abs(a - leastScore) <= 1e-9 && d < leastD)) { leastScore = a; leastD = d; least = { bx, by }; }
    }
  }
  const badge = clear ?? least ?? { bx: Math.max(loX, Math.min(hiX, anchor.bx)), by: Math.max(loY, Math.min(hiY, anchor.by)) };
  return { grip, badge, name, halfW };
}
