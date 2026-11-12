// X1 — THE NO-OVERLAP / NO-DOOR-BLOCK INVARIANT GATE (operator LIVE 2026-11-08: "never allow assets to overlap …
// no furniture blocks house … doors cant be blocked by furniture"; fleet P0 keystone, 12/12). The invariant is declared
// once in lib/room-objects.ts (objectsConflict / placementClear / doorKeepClear / nearestClear) and enforced on EVERY
// placement path (placeObject / moveObject). This gate locks the class: the defaults are clear, and no place/move can
// create an overlap or drop furniture in a doorway. Run:
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/room-no-overlap.test.mjs
import {
  placeObject, moveObject, rotateObject, objectsConflict, placementClear, doorKeepClear,
  defaultObjectsForRoom, worldSpan, OBJECT_SPEC, ROOM_ASSETS, remapOpeningsForCell, wallOfObject,
} from "../lib/room-objects.ts";
import { exteriorWallsOf, TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";

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

// ── 6. ROTATE enforces X1 — a rotation never LEAVES an overlap or a door-block (operator "never allow assets to overlap";
//      AsM-found 2026-11-11). rotateObject rotates when the rotated footprint stays clear (keeping the R5 pivot), else REJECTS
//      the rotation (the piece is unchanged) — it never relocates the piece out from under the user. ──
for (const rk of rooms) {
  const objs = defaultObjectsForRoom(rk);
  for (const o of objs.filter((x) => !OBJECT_SPEC[x.kind].onWall)) {
    const after = rotateObject(objs, o.id);
    ok(!anyConflict(after), `${rk}: rotating ${o.kind} never creates an overlap (rotated or rejected, never overlapping)`);
    const a2 = after.find((x) => x.id === o.id);
    ok(a2.rot === o.rot || placementClear(a2, after.filter((x) => x.id !== o.id)), `${rk}: ${o.kind} either stayed (rejected) or rotated into a clear spot`);
  }
}
// a desk that is CLEAR of the S-wall door, whose ROTATION (4×2 → 2×4) would reach into the doorway lane, is REJECTED —
// it stays put and the doorway stays clear (X1 on rotate).
{
  const door = { id: "d", kind: "door", gx: 4, gy: 9, rot: 0 };
  const deskClear = { id: "t", kind: "desk", gx: 4, gy: 6, rot: 0 };   // 4×2 · y5.5–7.5, clear of the door lane (y≥7.8)
  ok(placementClear(deskClear, [door]), "the desk starts clear of the doorway");
  const t2 = rotateObject([door, deskClear], "t").find((o) => o.id === "t");
  ok(t2.rot === 0 && placementClear(t2, [door]), "rotating that desk toward the door is rejected — it stays put and the doorway stays clear (X1 on rotate)");
}

// ── 7. OBJ-1 — a WINDOW prioritizes the room's OUTER EXTERIOR wall (operator LIVE 2026-11-11: "exterior prioritized").
//      placeObject/moveObject take the room's exterior-wall set; a window dropped anywhere in a room with an exterior
//      wall snaps to it. A room with no exterior wall (centre K) falls back to the nearest wall. Non-window wall pieces
//      keep nearest-wall behaviour. ──
const span = (o) => worldSpan(o);
const onWall = (o, wall) => {               // the piece sits ON that exterior wall (touching its plane)
  const s = span(o);
  if (wall === "N") return s.y1 <= 0.6;
  if (wall === "S") return s.y2 >= 9.4;
  if (wall === "W") return s.x1 <= 0.6;
  if (wall === "E") return s.x2 >= 9.4;
  return false;
};
// exteriorWallsOf returns the right walls per grid cell (row0→N, row2→S, col0→W, col2→E)
ok(JSON.stringify(exteriorWallsOf({ row: 0, col: 0 }).sort()) === JSON.stringify(["N", "W"]), "exteriorWallsOf NW corner cell → [N,W]");
ok(JSON.stringify(exteriorWallsOf({ row: 1, col: 1 }).sort()) === JSON.stringify([]), "exteriorWallsOf centre cell → [] (no exterior wall)");
ok(JSON.stringify(exteriorWallsOf({ row: 2, col: 2 }).sort()) === JSON.stringify(["E", "S"]), "exteriorWallsOf SE corner cell → [E,S]");
// a window dropped near the INTERIOR S wall of an N-only-exterior room snaps to the N exterior wall
{
  const placed = placeObject([], "window", 5, 9, ["N"]);   // dropped low (near S), exterior is N
  ok(placed.length === 1 && onWall(placed[0], "N"), `a window dropped near the interior wall snaps to the N exterior wall (got ${JSON.stringify(span(placed[0]))})`);
}
// a window in a corner room (N+W exterior) lands on one of its exterior walls
{
  const placed = placeObject([], "window", 5, 5, ["N", "W"]);
  ok(placed.length === 1 && (onWall(placed[0], "N") || onWall(placed[0], "W")), "a window in an N+W corner room snaps to an exterior wall");
}
// a window in a centre room (no exterior) falls back to the nearest wall (no crash, still on A wall)
{
  const placed = placeObject([], "window", 5, 9, []);
  ok(placed.length === 1 && (onWall(placed[0], "N") || onWall(placed[0], "S") || onWall(placed[0], "W") || onWall(placed[0], "E")), "a window in a centre room (no exterior) still snaps to the nearest wall");
}
// DRAGGING a window re-snaps to the exterior wall too
{
  let objs = placeObject([], "window", 5, 1, ["N"]);       // starts on N
  objs = moveObject(objs, objs[0].id, 5, 9, "S", ["N"]);   // dragged toward the interior S wall
  ok(onWall(objs[0], "N"), "dragging a window toward the interior wall re-snaps it to the N exterior wall");
}
// a non-window wall piece (tv) is NOT forced to the exterior — it takes the wall it was dropped near
{
  const placed = placeObject([], "tv", 5, 9, ["N"]);       // dropped near S, exterior is N
  ok(placed.length === 1 && onWall(placed[0], "S"), "a TV dropped near the S wall stays on the S wall (exterior preference is window-only)");
}

// ── 8. F-V3 — remapOpeningsForCell: when a room moves, a window follows the new EXTERIOR wall, a door an INTERIOR wall ──
{
  // a window on the S (interior-in-this-cell) wall, re-mapped for a cell whose exterior wall is N → snaps to N
  const win = { id: "window-1", kind: "window", gx: 5, gy: 9, rot: 0 };   // near the S wall
  const rm = remapOpeningsForCell([win], ["N"])[0];
  ok(wallOfObject(rm) === "N", `a window re-maps to the new exterior wall (N) when its room moves (got ${wallOfObject(rm)})`);
  // a door on an exterior wall (N), re-mapped for a cell whose exterior is N → the door moves to an interior wall
  const door = { id: "door-1", kind: "door", gx: 5, gy: 0, rot: 0 };      // on the N wall
  const rd = remapOpeningsForCell([door], ["N"])[0];
  ok(["S", "W", "E"].includes(wallOfObject(rd)), `a door re-maps OFF the exterior wall to an interior one (got ${wallOfObject(rd)})`);
  // a centre cell (no exterior wall) KEEPS the window where it is — never drops user content
  const kept = remapOpeningsForCell([{ id: "window-9", kind: "window", gx: 5, gy: 9, rot: 0 }], [])[0];
  ok(kept.gx === 5 && kept.gy === 9, "a window in a centre room (no exterior wall) is kept as-is (clerestory/borrowed) — not dropped");
  // a window ALREADY on an exterior wall is left alone (idempotent for a correctly-placed opening)
  const ok1 = remapOpeningsForCell([{ id: "window-2", kind: "window", gx: 5, gy: 0, rot: 0 }], ["N"])[0];
  ok(wallOfObject(ok1) === "N" && ok1.gy === 0, "a window already on an exterior wall is unchanged (idempotent)");
}

console.log(`\nROOM-NO-OVERLAP ${pass}/${pass + fail} passed · no-overlap / no-door-block holds on place/move/ROTATE; windows prioritize the exterior wall (OBJ-1); openings re-map on a room move (F-V3)`);
process.exit(fail ? 1 : 0);
