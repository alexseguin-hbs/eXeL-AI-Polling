// ARCHITECT-2525 · WALK COLLIDE-AND-SLIDE — the pure interior-movement collision for the first-person walkthrough
// (operator 2026-11-06: "user gets stuck behind furniture"). The MoT game-engine research (Unity CharacterController +
// Unreal CMC) found the fix is depenetration + slide, run every tick: propose the move, then PUSH OUT of any furniture
// along the SHALLOWEST axis only (sliding along the face, never "undoing the move", which jams corners). Two push passes
// resolve a corner between two boxes. Pure (no React/DOM) so the walk loop AND tests/architect-walk-collide.test.mjs read
// the SAME maths. REUSE: the phase filter (showGroupInPhase) + the room model (worldSpan/OBJECT_SPEC/elevOf/heightOf).
//
// Y-AXIS FLIP (the root cause): the plan convention is gy 0 = NORTH wall, but the walkthrough camera enters from the
// SOUTH and treats world y = 0 as the near wall. So a blocker's world y is the FLIPPED plan y: worldY = ROOM_FT - planGy.
// Without the flip the bed (plan gy 0–6, the north half) landed right in front of the eye and pinned the walker.
import { showGroupInPhase } from "./architect-phases";
import { worldSpan, OBJECT_SPEC, elevOf, heightOf, groupOf, type PlacedObject } from "./room-objects";
import { ROOM_FT } from "./architect-walk-nav";

export const WALK_R = 0.6;        // body radius (feet) — obstacles are inflated by this, the body is treated as a point
export const WALK_SKIN = 0.06;    // a small skin so the body rests just off a face, never exactly on it (no re-trigger)
export const PUSH_ITERS = 4;      // depenetration passes per push
export const STEP_OVER_FT = 1.3;  // walk OVER anything shorter than this (a step offset — low items don't block)
export const MOUNT_FT = 4;        // anything mounted at/above this height is not a floor obstacle

export interface Rect { x0: number; y0: number; x1: number; y1: number }
export interface Pt { x: number; y: number }

// kinds a walker passes through / over regardless of size: openings and flat/▭ furniture you'd walk across or around.
const SKIP = new Set(["door", "window", "rug", "tv"]);

/**
 * Rectangle subtraction: `b` minus `hole` → the (0–4) pieces of `b` outside `hole`. Used to carve a clear DOOR-WIDTH lane
 * to every doorway through any furniture band, so the walker reaches the door in EVERY room (not just the hand-tuned
 * bedroom) — the door-aware collision fix. A piece with no area is dropped.
 */
export function subtractRect(b: Rect, hole: Rect): Rect[] {
  const ix0 = Math.max(b.x0, hole.x0), iy0 = Math.max(b.y0, hole.y0), ix1 = Math.min(b.x1, hole.x1), iy1 = Math.min(b.y1, hole.y1);
  if (ix0 >= ix1 || iy0 >= iy1) return [b];                 // no overlap → unchanged
  const out: Rect[] = [];
  if (hole.x0 > b.x0) out.push({ x0: b.x0, y0: b.y0, x1: hole.x0, y1: b.y1 });   // left of the lane
  if (hole.x1 < b.x1) out.push({ x0: hole.x1, y0: b.y0, x1: b.x1, y1: b.y1 });   // right of the lane
  if (hole.y0 > b.y0) out.push({ x0: ix0, y0: b.y0, x1: ix1, y1: hole.y0 });     // below the lane (within its x-span)
  if (hole.y1 < b.y1) out.push({ x0: ix0, y0: hole.y1, x1: ix1, y1: b.y1 });     // above the lane
  return out.filter((r) => r.x1 - r.x0 > 1e-6 && r.y1 - r.y0 > 1e-6);
}

/**
 * The furniture rectangles the walker collides with for the active phase: the phase-visible, NOT-on-wall, non-SKIP,
 * floor-standing (elev < MOUNT_FT) pieces tall enough to matter (height ≥ STEP_OVER_FT), each footprint Y-FLIPPED to
 * world space and inflated by WALK_R on all four sides (so the body can be treated as a point). `doorLanes` are clear
 * DOOR-WIDTH corridors (walk-world rects) carved OUT of every blocker so a lane to each doorway is guaranteed in EVERY
 * room — the general door-aware fix (no per-layout hand-tuning).
 */
export function roomBlockers(objects: PlacedObject[], phase: string | null | undefined, doorLanes: Rect[] = []): Rect[] {
  let out: Rect[] = [];
  for (const o of objects) {
    if (!showGroupInPhase(groupOf(o.kind), phase)) continue; // only the phase's visible layer blocks
    if (OBJECT_SPEC[o.kind].onWall) continue;                // wall pieces (windows/doors/mirror) never block
    if (SKIP.has(o.kind)) continue;                          // walk through/over these
    if (elevOf(o) >= MOUNT_FT) continue;                     // mounted high → not a floor obstacle
    if (heightOf(o) < STEP_OVER_FT) continue;                // step over knee-high items
    const s = worldSpan(o);                                  // plan-space span (gy 0 = north)
    out.push({ x0: s.x1 - WALK_R, y0: (ROOM_FT - s.y2) - WALK_R, x1: s.x2 + WALK_R, y1: (ROOM_FT - s.y1) + WALK_R });
  }
  for (const lane of doorLanes) out = out.flatMap((b) => subtractRect(b, lane));  // carve the clear lane to each doorway
  return out;
}

const within = (p: Pt, r: Rect) => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1;

/**
 * Depenetrate a point out of any rectangle it is inside, along the SHALLOWEST of the four edges (slide, don't reverse).
 * Runs PUSH_ITERS passes so a point wedged between two rectangles resolves. Deterministic.
 */
export function pushOut(p: Pt, rects: Rect[], iters: number = PUSH_ITERS): Pt {
  let x = p.x, y = p.y;
  for (let it = 0; it < iters; it++) {
    let moved = false;
    for (const r of rects) {
      if (!within({ x, y }, r)) continue;
      const l = x - r.x0 + WALK_SKIN, rt = r.x1 - x + WALK_SKIN, b = y - r.y0 + WALK_SKIN, tp = r.y1 - y + WALK_SKIN;
      const m = Math.min(l, rt, b, tp);
      if (m === l) x = r.x0 - WALK_SKIN;
      else if (m === rt) x = r.x1 + WALK_SKIN;
      else if (m === b) y = r.y0 - WALK_SKIN;
      else y = r.y1 + WALK_SKIN;
      moved = true;
    }
    if (!moved) break;
  }
  return { x, y };
}

/**
 * Advance the body by `d` and resolve furniture collisions by depenetration (two push passes so a corner resolves).
 * The caller handles walls + door crossings (canCrossDoor). The result slides along furniture — the walker is never
 * frozen: a move straight into a box ends up beside it (one axis slid), not pinned at the start.
 */
export function walkMove(from: Pt, d: Pt, rects: Rect[]): Pt {
  let p = { x: from.x + d.x, y: from.y + d.y };
  p = pushOut(p, rects, PUSH_ITERS);
  p = pushOut(p, rects, PUSH_ITERS); // second pass resolves a corner between two boxes
  return p;
}
