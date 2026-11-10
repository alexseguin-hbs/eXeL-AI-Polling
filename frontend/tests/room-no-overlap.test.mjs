// X1 — THE NO-OVERLAP / NO-DOOR-BLOCK INVARIANT GATE (operator LIVE 2026-11-08: "never allow assets to overlap …
// no furniture blocks house … doors cant be blocked by furniture"; fleet P0 keystone, 12/12). The invariant is declared
// once in lib/room-objects.ts (objectsConflict / placementClear / doorKeepClear / nearestClear) and enforced on EVERY
// placement path (placeObject / moveObject). This gate locks the class: the defaults are clear, and no place/move can
// create an overlap or drop furniture in a doorway. Run:
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/room-no-overlap.test.mjs
import {
  placeObject, moveObject, objectsConflict, placementClear, doorKeepClear,
  defaultObjectsForRoom, worldSpan, OBJECT_SPEC, ROOM_ASSETS,
} from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const anyConflict = (objs) => { for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) if (objectsConflict(objs[i], objs[j])) return true; return false; };
const rooms = Object.keys(ROOM_ASSETS);

// ── 1. the conflict primitive is strict + elevation-aware ──
const bed = { id: "b", kind: "bed", gx: 4, gy: 4, rot: 0 };   // 5×6, spans x2–7 · y1.5–7.5
ok(objectsConflict(bed, { id: "x", kind: "bed", gx: 4, gy: 4, rot: 0 }), "two beds on the same cell conflict (footprint + vertical overlap)");
ok(!objectsConflict(bed, { id: "m", kind: "mirror", gx: 4, gy: 4, rot: 0, elev: 3 }), "a wall mirror hung at 3 ft does NOT conflict with the bed beneath it (vertical bands clear)");
ok(!objectsConflict(bed, { id: "n", kind: "nightstand", gx: 8, gy: 0, rot: 0 }), "a nightstand in the far corner does not conflict with the bed (no false positive)");

// ── 2. every room's DEFAULT layout is clear: no conflicting pair, nothing in a doorway ──
for (const rk of rooms) {
  const d = defaultObjectsForRoom(rk);
  ok(!anyConflict(d), `${rk}: the default layout has no conflicting pair`);
  ok(d.every((o) => placementClear(o, d)), `${rk}: every default piece is clear (no overlap, no door-block)`);
}

// ── 3. placeObject SNAPS a piece dropped on an occupied cell to a clear one (room has space) ──
for (const kind of ["nightstand", "chair", "sofa", "desk", "lamp"]) {
  let objs = placeObject([], kind, 4, 4);          // first piece at centre
  objs = placeObject(objs, kind, 4, 4);            // second dropped on the SAME cell → must snap
  ok(objs.length === 2 && !objectsConflict(objs[0], objs[1]), `a second ${kind} dropped on the first snaps to a clear cell (no stack)`);
  ok(objs.every((o) => { const s = worldSpan(o); return s.x1 >= -1e-6 && s.y1 >= -1e-6 && s.x2 <= 10 + 1e-6 && s.y2 <= 10 + 1e-6; }), `both ${kind}s stay inside the room after the snap`);
}

// ── 4. moveObject SNAPS a dragged free piece clear when dropped onto another ──
for (const rk of rooms) {
  const objs = defaultObjectsForRoom(rk);
  const free = objs.filter((o) => !OBJECT_SPEC[o.kind].onWall);
  if (free.length < 2) continue;
  const moved = moveObject(objs, free[0].id, free[1].gx, free[1].gy);   // drag piece 0 onto piece 1
  ok(!anyConflict(moved), `${rk}: dragging ${free[0].kind} onto ${free[1].kind} snaps clear (no overlap)`);
}

// ── 5. a doorway keeps a walk-through lane clear of furniture ──
const sDoor = { id: "d", kind: "door", gx: 4, gy: 9, rot: 0 };   // S wall (room 10×10, S = high y)
const kc = doorKeepClear(sDoor);
ok(kc.y1 < worldSpan(sDoor).y1 - 1e-6 && kc.y2 >= worldSpan(sDoor).y2 - 1e-6, "an S-wall door's keep-clear lane extends INTO the room (northward)");
ok(!placementClear({ id: "c", kind: "chair", gx: 4, gy: 8, rot: 0 }, [sDoor]), "a chair parked in the S-wall doorway lane is NOT clear (door-block caught)");
ok(placementClear({ id: "c2", kind: "chair", gx: 4, gy: 4, rot: 0 }, [sDoor]), "a chair in the room centre is clear of that doorway (no false positive)");

console.log(`\nROOM-NO-OVERLAP ${pass}/${pass + fail} passed · the no-overlap / no-door-block invariant holds on the defaults and on every place/move`);
process.exit(fail ? 1 : 0);
