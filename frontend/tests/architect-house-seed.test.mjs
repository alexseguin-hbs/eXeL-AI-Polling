/**
 * ARCHITECT-2525 · HOUSE SEED GATE (Phase 0, operator 2026-11-08 "House does not have any of 139 objects; fix first").
 * The default house MUST contain the operator's whole library: every one of the 139 real GLB assets placed into a room,
 * packed per (room, phase) so they fit across phases. Deterministic (replay law), in-bounds, unique ids, canonical-safe.
 */
import { seededAssetCount, seededAssetIds, seededObjectsForRoom, seedHouseFromLibrary } from "../lib/architect-2525/assets/house-seed.ts";
import { ASSET_IDS, ASSET_REGISTRY } from "../lib/architect-2525/assets/registry.ts";
import { footprintOf, ROOM_GRID, ROOM_KEYS } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("  ✗ " + m); } };

const libIds = ASSET_IDS.map((id) => ASSET_REGISTRY[id]).filter((a) => a.modelStatus === "LIBRARY").map((a) => a.id);

// 1 — every one of the 139 library assets is placed in the house.
ok(libIds.length === 139, `139 library assets in the registry (got ${libIds.length})`);
ok(seededAssetCount() === 139, `the house holds all 139 placed objects (got ${seededAssetCount()})`);
const placedIds = seededAssetIds();
ok(placedIds.length === 139, `139 placed ids (got ${placedIds.length})`);
const placedSet = new Set(placedIds);
ok(placedSet.size === 139, `139 DISTINCT placed ids (got ${placedSet.size})`);
const missing = libIds.filter((id) => !placedSet.has(id));
ok(missing.length === 0, `every library id is in the house — missing: ${missing.slice(0, 8).join(", ")}`);

// 2 — deterministic (no clock / no RNG): the same room seeds identically every call.
for (const k of ROOM_KEYS) ok(JSON.stringify(seededObjectsForRoom(k)) === JSON.stringify(seededObjectsForRoom(k)), `room ${k} seed is deterministic`);

// 3 — every seeded object fits inside its 10×10 room (footprint within [0, ROOM_GRID]); ids unique across the house.
const allIds = new Set();
let dupe = false, outOfBounds = 0;
for (const k of ROOM_KEYS) for (const o of seededObjectsForRoom(k)) {
  if (allIds.has(o.id)) dupe = true; allIds.add(o.id);
  const fp = footprintOf(o); const sw = o.rot === 90 || o.rot === 270; const w = sw ? fp.d : fp.w, d = sw ? fp.w : fp.d;
  const x0 = o.gx + 0.5 - w / 2, y0 = o.gy + 0.5 - d / 2;
  if (x0 < -0.01 || y0 < -0.01 || x0 + w > ROOM_GRID + 0.01 || y0 + d > ROOM_GRID + 0.01) outOfBounds++;
}
ok(!dupe, "every seeded object id is unique across the house");
ok(outOfBounds === 0, `every seeded footprint fits inside its 10×10 room (out of bounds: ${outOfBounds})`);

// 4 — seedHouseFromLibrary only fills empty rooms (a user's saved objects win), never mutates input.
const layout = [{ k: "L", objects: undefined }, { k: "K", objects: [{ id: "keep-1", kind: "sofa", gx: 0, gy: 0, rot: 0 }] }];
const seeded = seedHouseFromLibrary(layout);
ok(seeded[0].objects.length > 0, "a room with no objects gets seeded");
ok(seeded[1].objects.length === 1 && seeded[1].objects[0].id === "keep-1", "a room with saved objects is left untouched (user wins)");
ok(layout[0].objects === undefined, "seedHouseFromLibrary does not mutate its input");

console.log(`ARCHITECT-HOUSE-SEED ${pass}/${pass + fail} passed · 139/139 library assets placed in the default house · deterministic · in-bounds`);
if (fail > 0) process.exit(1);
