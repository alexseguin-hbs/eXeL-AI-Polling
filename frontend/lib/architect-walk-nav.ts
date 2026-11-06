// ARCHITECT-2525 · WALK NAVIGATION — the pure rule for crossing a wall in the first-person walkthrough (operator
// 2026-11-06: "you cannot walk through solid wall"). A wall is SOLID everywhere except its door opening, so the eye may
// only step to the next room when it is lined up with the doorway — within half the door's width of the opening's centre.
// Pure (no React/DOM) so the walkthrough's move loop AND tests/architect-walk-nav.test.mjs read the SAME predicate.

export const ROOM_FT = 10;      // one 10×10 room (feet)
export const DOOR_W = 3.2;      // the walk doorway opening width (feet) — one source, shared with the walkthrough

/**
 * May the eye cross a wall here? Only inside the door span: |lateral offset from the opening's centre| ≤ DOOR_W/2.
 * Everywhere else along the wall is solid — the crossing is refused, so you cannot walk through a solid wall.
 * `offsetFromCentreFt` is the eye's position along the wall minus the opening's centre, in feet.
 */
export function canCrossDoor(offsetFromCentreFt: number, doorW: number = DOOR_W): boolean {
  return Number.isFinite(offsetFromCentreFt) && Math.abs(offsetFromCentreFt) <= doorW / 2 + 1e-9;
}
