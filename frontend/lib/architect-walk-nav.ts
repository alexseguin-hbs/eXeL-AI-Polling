// ARCHITECT-2525 · WALK NAVIGATION — the pure door-span rule for the first-person walkthrough (operator 2026-11-06:
// "you cannot walk through solid wall"). A wall is SOLID except at its door opening, so the body may only cross to the
// next room where it lines up with the doorway — within half the door's width of the opening's centre. Pure (no
// React/DOM) so the walk loop AND tests/architect-walk-nav.test.mjs read the SAME predicate. Collision lives beside this
// in lib/architect-walk-collide.ts (same R-CORE split: door rule here, collide-and-slide there).

export const ROOM_FT = 10;      // one 10×10 room (feet)
export const DOOR_W = 3.2;      // the walk doorway opening width (feet) — one source, shared with the walkthrough + collide

/**
 * May the body cross a wall here? Only inside the door span: |lateral offset from the opening's centre| ≤ DOOR_W/2.
 * Everywhere else along the wall is solid — the crossing is refused, so you cannot walk through a solid wall.
 */
export function canCrossDoor(offsetFromCentreFt: number, doorW: number = DOOR_W): boolean {
  return Number.isFinite(offsetFromCentreFt) && Math.abs(offsetFromCentreFt) <= doorW / 2 + 1e-9;
}
