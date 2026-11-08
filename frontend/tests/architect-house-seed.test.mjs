/**
 * ARCHITECT-2525 · HOUSE SEED GATE (operator 2026-11-08: "you're suppose to pick typical items for a standard layout for
 * each room; ensure one can get into each room, and layout new assets").
 * The default house furnishes each room with its TYPICAL ITEMS in a standard layout (not a dump of all 139): deterministic,
 * in-bounds, with the S-wall entry lane kept CLEAR so you can walk in. Coverage of all 139 lives in the 3D Asset Lab
 * (catalog.json), asserted here too. Canonical-safe (the seed only sets illustrative RoomCell.objects).
 */
import { readFileSync } from "node:fs";
import { seededObjectsForRoom, seedHouseFromLibrary } from "../lib/architect-2525/assets/house-seed.ts";
import { footprintOf, worldSpan, OBJECT_SPEC, heightOf, ROOM_GRID, ROOM_KEYS } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("  ✗ " + m); } };

// 1 — every room is furnished with a non-empty standard layout of its typical items.
for (const k of ROOM_KEYS) ok(seededObjectsForRoom(k).length > 0, `room ${k} is furnished with typical items (got ${seededObjectsForRoom(k).length})`);

// 2 — deterministic (replay law): the same room seeds identically every call.
for (const k of ROOM_KEYS) ok(JSON.stringify(seededObjectsForRoom(k)) === JSON.stringify(seededObjectsForRoom(k)), `room ${k} seed is deterministic`);

// 3 — every seeded object fits inside its 10×10 room; ids unique within the room.
let outOfBounds = 0, dupe = false;
for (const k of ROOM_KEYS) {
  const ids = new Set();
  for (const o of seededObjectsForRoom(k)) {
    if (ids.has(o.id)) dupe = true; ids.add(o.id);
    const fp = footprintOf(o); const sw = o.rot === 90 || o.rot === 270; const w = sw ? fp.d : fp.w, d = sw ? fp.w : fp.d;
    const x0 = o.gx + 0.5 - w / 2, y0 = o.gy + 0.5 - d / 2;
    if (x0 < -0.01 || y0 < -0.01 || x0 + w > ROOM_GRID + 0.01 || y0 + d > ROOM_GRID + 0.01) outOfBounds++;
  }
}
ok(!dupe, "every seeded object id is unique within its room");
ok(outOfBounds === 0, `every seeded footprint fits inside its 10×10 room (out of bounds: ${outOfBounds})`);

// 4 — "ensure one can get into each room": the entry lane at each room's ACTUAL S-wall door is CLEAR of floor furniture.
// A packed room's door defaults to the S-wall centre (x 5, the packer's reserved lane); a hand layout (M) places its own
// door — use that door's centre. The lane is 4 ft wide at the door, the 3 ft nearest the S wall (gy 7–10).
const overlaps = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
let blocked = 0;
for (const k of ROOM_KEYS) {
  const objs = seededObjectsForRoom(k);
  const door = objs.find((o) => o.kind === "door");                 // the placed door, if the room has one
  const doorX = door ? door.gx + 0.5 : ROOM_GRID / 2;               // else the packer's S-centre lane
  const lane = { x1: doorX - 2, x2: doorX + 2, y1: ROOM_GRID - 3, y2: ROOM_GRID };
  for (const o of objs) {
    if (OBJECT_SPEC[o.kind]?.onWall) continue;          // doors/windows/wall pieces don't block the floor
    if (heightOf(o) < 1.3) continue;                     // step-over low items don't block the walk-in
    if (overlaps(worldSpan(o), lane) > 0.01) blocked++;
  }
}
ok(blocked === 0, `each room's door entry lane is clear of furniture — one can get in (blocked: ${blocked})`);

// 5 — seedHouseFromLibrary fills empty rooms only (a user's saved objects win), never mutates its input.
const layout = [{ k: "L", objects: undefined }, { k: "K", objects: [{ id: "keep-1", kind: "sofa", gx: 0, gy: 0, rot: 0 }] }];
const seeded = seedHouseFromLibrary(layout);
ok(seeded[0].objects.length > 0, "a room with no objects gets its standard layout");
ok(seeded[1].objects.length === 1 && seeded[1].objects[0].id === "keep-1", "a room with saved objects is left untouched (user wins)");
ok(layout[0].objects === undefined, "seedHouseFromLibrary does not mutate its input");

// 6 — coverage of all 139 lives in the 3D Asset Lab catalog (browse/rotate every asset there).
try {
  const cat = JSON.parse(readFileSync(new URL("../public/architect-2525/assets/catalog.json", import.meta.url), "utf8"));
  const n = cat.packs.reduce((s, p) => s + p.sections.reduce((t, sec) => t + sec.assets.length, 0), 0);
  ok(n === 139, `the Asset Lab catalog lists all 139 assets (got ${n})`);
} catch (e) { ok(false, "catalog.json is readable for the 139-coverage check: " + e.message); }

console.log(`ARCHITECT-HOUSE-SEED ${pass}/${pass + fail} passed · each room a standard layout of typical items · entry lane clear (walkable) · all 139 in the Asset Lab`);
if (fail > 0) process.exit(1);
