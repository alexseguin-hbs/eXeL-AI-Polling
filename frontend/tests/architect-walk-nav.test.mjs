// ARCHITECT-2525 · WALK NAVIGATION — the door-span crossing predicate (operator 2026-11-06: "you cannot walk through
// solid wall"). The first-person walk's move loop and this gate read the SAME pure rule (lib/architect-walk-nav.ts):
// the eye may only step through a wall where the door is — within half the door width of the opening's centre.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-nav.test.mjs
import { canCrossDoor, DOOR_W, ROOM_FT } from "../lib/architect-walk-nav.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

const half = DOOR_W / 2;
// dead-centre on the opening → cross
ok(canCrossDoor(0), "dead-centre on the doorway → may cross");
// anywhere within half the door width → cross (either side)
ok(canCrossDoor(half - 0.01) && canCrossDoor(-(half - 0.01)), "within the door span (±DOOR_W/2) → may cross");
ok(canCrossDoor(half) && canCrossDoor(-half), "exactly at the jamb → may cross (inclusive)");
// just past the jamb → the wall is solid, refuse
ok(!canCrossDoor(half + 0.2) && !canCrossDoor(-(half + 0.2)), "just past the jamb → SOLID wall, no crossing");
// a long way along the wall (e.g. the eye strafed to the room edge) → solid
ok(!canCrossDoor(ROOM_FT / 2), "at the room edge, far from the opening → no crossing (cannot walk through solid wall)");
// a custom door width is honoured
ok(canCrossDoor(2, 6) && !canCrossDoor(4, 6), "a wider door (6 ft) widens the crossable span");
// non-finite is refused (never cross on a NaN)
ok(!canCrossDoor(NaN) && !canCrossDoor(Infinity), "a non-finite offset never crosses");
// the constant is the shared door width
ok(DOOR_W === 3.2 && ROOM_FT === 10, "DOOR_W = 3.2 ft, ROOM_FT = 10 ft (the shared walk constants)");

console.log(`\nARCHITECT-WALK-NAV ${pass}/${pass + fail} passed · the door-span rule gates every wall crossing`);
if (fail > 0) process.exit(1);
