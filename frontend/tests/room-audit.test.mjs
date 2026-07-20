// ROOM AUDIT — operator: "ensure ALL items on room-selection placement can be placed, adjusted/edited, and moved."
// Iterates EVERY object kind and proves the full lifecycle works: reachable in a palette → place → footprint/height/
// shape → move → nudge (in-bounds) → rotate → clamp → survive the WireGuard sanitize round-trip. One kind slipping any
// gate = the operator's "it won't place / can't move" bug, caught here.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/room-audit.test.mjs
import {
  OBJECT_KINDS, OBJECT_SPEC, COMMON_ASSETS, ROOM_ASSETS, paletteForRoom, placeObject, moveObject, nudgeObject,
  rotateObject, footprintOf, heightOf, shapePartsOf, clampFootprint, ROOM_GRID,
} from "../lib/room-objects.ts";
import { sanitizeRoomLayout } from "../lib/architect-guard.ts";
import { TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

const ROOMS = Object.keys(ROOM_ASSETS);
// Every kind must be REACHABLE — appear in at least one room's palette (which folds in COMMON_ASSETS).
const reachable = new Set();
for (const r of ROOMS) for (const k of paletteForRoom(r)) reachable.add(k);

for (const kind of OBJECT_KINDS) {
  // 1. reachable from some room's palette (else the operator can never arm it)
  ok(reachable.has(kind), `${kind}: reachable in a room palette`);

  // 2. PLACE — adds exactly one object, in-bounds
  const placed = placeObject([], kind, 4, 4);
  ok(placed.length === 1 && placed[0].kind === kind, `${kind}: places`);
  const o = placed[0];

  // 3. has a real footprint + height + 3D shape (renders in 2D + 3D, not invisible)
  const fp = footprintOf(o);
  ok(fp.w > 0 && fp.d > 0, `${kind}: footprint > 0 (${fp.w}×${fp.d})`);
  ok(heightOf(o) > 0, `${kind}: height > 0`);
  ok(shapePartsOf(kind).length >= 1, `${kind}: has ≥1 3D shape part`);
  ok(!!OBJECT_SPEC[kind]?.label, `${kind}: has a label`);

  // 4. whole footprint stays inside the 0..10 ft room (place, and after a clamp)
  const inRoom = (obj) => { const f = footprintOf(obj); const cx = obj.gx + 0.5, cy = obj.gy + 0.5;
    return cx - f.w / 2 >= -1e-9 && cx + f.w / 2 <= ROOM_GRID + 1e-9 && cy - f.d / 2 >= -1e-9 && cy + f.d / 2 <= ROOM_GRID + 1e-9; };
  ok(inRoom(o), `${kind}: placed whole-footprint inside the room`);

  // 5. MOVE — moveObject relocates it and keeps it in bounds
  const moved = moveObject(placed, o.id, 2, 6);
  ok(moved[0].gx !== o.gx || moved[0].gy !== o.gy || (o.gx === 2 && o.gy === 6), `${kind}: moves`);
  ok(inRoom(moved[0]), `${kind}: stays in-bounds after move`);

  // 6. NUDGE — a 1-ft nudge in every direction never leaves the room
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ok(inRoom(nudgeObject(placed, o.id, dx, dy)[0]), `${kind}: nudge (${dx},${dy}) in-bounds`);

  // 7. ROTATE — rotateObject advances the rotation (0→90→…)
  ok(rotateObject(placed, o.id)[0].rot !== o.rot, `${kind}: rotates`);

  // 8. WireGuard — a placed kind survives the stored-layout sanitize (never silently dropped)
  const layout = TINY_ROOM_LAYOUT.map((r, i) => (i === 0 ? { ...r, objects: placed } : r));
  const san = sanitizeRoomLayout(layout);
  ok((san[0].objects || []).some((x) => x.kind === kind), `${kind}: survives WireGuard sanitize`);
}

// clampFootprint is rotation-aware and never lets an oversize object escape the room.
ok(clampFootprint(-5, -5, 6, 6, 0).gx >= 0, "clampFootprint pins a corner-dropped object back inside");
const big = clampFootprint(0, 0, 12, 12, 0); // bigger than the room → centred, best-effort
ok(Number.isFinite(big.gx) && Number.isFinite(big.gy), "clampFootprint handles an oversize object (finite result)");

console.log(`\nROOM-AUDIT ${pass}/${pass + fail} passed — ${OBJECT_KINDS.length} kinds × full place/move/edit lifecycle`);
if (fail > 0) process.exit(1);
