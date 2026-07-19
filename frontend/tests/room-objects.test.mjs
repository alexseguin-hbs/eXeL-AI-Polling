// ROOM-OBJECTS lock (#167 Stage 1) — the interactive room-designer model is pure, deterministic (replay law),
// and clamps every placement to the 10×10 grid. Run: node --experimental-strip-types tests/room-objects.test.mjs
import { placeObject, moveObject, rotateObject, removeObject, countKind, mirrorObjects, OBJECT_SPEC, OBJECT_KINDS, ROOM_GRID } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

// Place → immutable + deterministic id.
const a = placeObject([], "bed", 2, 3);
ok(a.length === 1 && a[0].kind === "bed" && a[0].id === "bed-1", "place bed → deterministic id bed-1");
const a2 = placeObject(a, "bed", 5, 5);
ok(a2[1].id === "bed-2", "second bed → bed-2 (running index, no random)");
ok(JSON.stringify(placeObject([], "bed", 2, 3)) === JSON.stringify(a), "place is deterministic (same input → same output)");

// Clamp to the 10×10 grid (Enki: never off-grid).
const c = placeObject([], "sofa", 99, -4);
ok(c[0].gx === ROOM_GRID - 1 && c[0].gy === 0, "place clamps to 0..9 (99,-4 → 9,0)");
const mv = moveObject(a, "bed-1", -3, 42);
ok(mv[0].gx === 0 && mv[0].gy === ROOM_GRID - 1, "move clamps to 0..9");

// Rotate cycles 0→90→180→270→0.
let r = placeObject([], "desk", 1, 1);
r = rotateObject(r, "desk-1"); ok(r[0].rot === 90, "rotate → 90");
r = rotateObject(rotateObject(rotateObject(r, "desk-1"), "desk-1"), "desk-1"); ok(r[0].rot === 0, "rotate ×4 → back to 0");

// Remove + count.
ok(removeObject(a2, "bed-1").length === 1, "remove drops one");
ok(countKind(a2, "bed") === 2, "countKind bed = 2 (feeds metrics)");

// Palette integrity — every kind has spec + wall openings flagged.
ok(OBJECT_KINDS.length === Object.keys(OBJECT_SPEC).length && OBJECT_KINDS.length >= 11, "palette has >=11 kinds with specs");
ok(OBJECT_SPEC.door.onWall && OBJECT_SPEC.window.onWall && !OBJECT_SPEC.bed.onWall, "door/window snap to wall; bed does not");
ok(OBJECT_KINDS.every((k) => OBJECT_SPEC[k].w > 0 && OBJECT_SPEC[k].d > 0 && OBJECT_SPEC[k].emoji), "every kind has a positive footprint + glyph");

// Mirror — data flip across the room centre (reflects in BOTH 2D + 3D since one source).
let mo = placeObject([], "bed", 2, 3);
mo = placeObject(mo, "sink", 0, 9);
const mh = mirrorObjects(mo, "h");
ok(mh[0].gx === ROOM_GRID - 1 - 2 && mh[0].gy === 3, "mirror h flips gx (2→7), keeps gy");
ok(mh[1].gx === ROOM_GRID - 1 - 0 && mh[1].gy === 9, "mirror h: left-wall sink (0,9) → right wall (9,9)");
const mvert = mirrorObjects(mo, "v");
ok(mvert[0].gy === ROOM_GRID - 1 - 3 && mvert[0].gx === 2, "mirror v flips gy (3→6), keeps gx");
ok(JSON.stringify(mirrorObjects(mh, "h")) === JSON.stringify(mo), "mirror h twice = identity (involution, replay-safe)");
ok(mo[0].gx === 2, "mirror did not mutate the source array");

// Immutability — originals never mutated.
ok(a.length === 1, "place did not mutate the source array");

console.log(`\nROOM-OBJECTS ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
