// ARCHITECT-2525 · ASSET PLACEMENT GATE (Rev A, PLACEMENT slice) — intake master §9–§12 + §30 "Placement" (translate ·
// rotate · delete · duplicate · floor / wall / ceiling placement) and §27 / §30 "Truth boundary" (illustrative placement
// never changes the canonical project hash). Six representative metadata records are loaded from his COMPLETE library
// (docs/architecture-2525/asset-library/3d-all-assets-2026-11-07/metadata) — sofa FLOOR · toilet FLOOR+WALL_BACK · wall
// cabinets WALL · pendant CEILING · window WALL_OPENING · roof truss BUILT_IN; the toilet's WALL_BACK and the window's
// WALL_OPENING are the intake master's own §12 examples overlaid on his records (the library's snap column echoes the
// mounting). Then the whole library (139) is resolved per mounting, every op is proven immutable + deterministic, the
// RoomCell.objects round trip holds within 1 mm, and the canonical hash is byte-identical before and after.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-asset-placement.test.mjs
import fs from "node:fs";
import path from "node:path";
import {
  EMPTY_PLACEMENT, placeAsset, moveAsset, rotateAsset, removeAsset, duplicateAsset, selectAsset, applyPlacementOp, applyPlacementOps,
  instanceIdFor, assetSlug, instancesInRoom, placedToRoomObjects, roomObjectsToPlaced, unpersistableInstances,
} from "../lib/architect-2525/assets/placement.ts";
import {
  resolvePlacement, snapTargetsFor, hostOf, snapYaw, wrapYaw, halfExtents, clampAxis, nearestWall, wallYaw, wallFacedByBack, isValidFor, isDoorOpening, wallOfPlaced, isWallHost,
  ROOM_BOX, FREE_STEP_DEG, ORTHO_DEGREES, SNAP_DIST_M, WALL_MOUNT_Z_M, SURFACE_Z_M, WIN_SILL_M, WIN_HEAD_M, WINDOW_MIN_SILL_M, DOOR_HARDWARE_Z_M,
} from "../lib/architect-2525/assets/snap.ts";
import { ASSET_REGISTRY, ASSET_ID_BY_KIND, metadataById } from "../lib/architect-2525/assets/registry.ts";
import { mFromFt, ftFromM } from "../lib/architect-2525/assets/dimensions.ts";
import { ROOM_GRID, OBJECT_SPEC } from "../lib/room-objects.ts";
import { clampFootprint, standardLayoutFor, defaultObjectsForRoom, ROOM_KEYS, elevOf } from "../lib/room-objects.ts";
import { ROOM_FT, STOREY_FT, OPENING_STD } from "../lib/room-layout.ts";
import { buildProjectFromSeed } from "../lib/architect-2525/canonical/runtime.ts";
import { projectHash, serializeCanonicalProject } from "../lib/architect-2525/canonical/serialize.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const FE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const LIB = path.resolve(FE, "..", "docs/architecture-2525/asset-library/3d-all-assets-2026-11-07/metadata");
const read = (p) => fs.readFileSync(path.join(FE, p), "utf8");
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const J = (v) => JSON.stringify(v);
const deepFreeze = (o) => { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };
const meta = (file, overlay = {}) => ({ ...JSON.parse(fs.readFileSync(path.join(LIB, file), "utf8")), ...overlay });

// ── 0. the six representative records from his library (+ the §12 overlays) ──
ok(fs.existsSync(LIB) && fs.readdirSync(LIB).filter((f) => f.endsWith(".json")).length === 139, "his complete library's 139 metadata records are on disk");
const SOFA = meta("sofa.json");                                                       // FLOOR → [FLOOR], freeRotation 15°
const TOILET = meta("toilet.json", { snap: ["FLOOR", "WALL_BACK"] });                 // §12: mounting FLOOR, snap FLOOR + WALL_BACK
const CABINET = meta("wall-cabinets.json");                                           // WALL → [WALL]
const PENDANT = meta("pendant-light.json");                                           // CEILING → [CEILING]
const WINDOW = meta("window-single.json", { snap: ["WALL_OPENING"] });                // §12: mounting WALL, snap WALL_OPENING
const TRUSS = meta("roof-truss.json");                                                // BUILT_IN → [ROOF_LINE]
const SOFA_ORTHO = { ...SOFA, id: "test.sofa.ortho.v1", rotation: { axis: "Z", freeRotation: false, allowedDegrees: [0, 90, 180, 270] } };
const SHOWER = { ...SOFA, id: "test.shower.corner.v1", dimensionsM: { width: 1, depth: 1, height: 2 }, snap: ["FLOOR", "WALL_CORNER"] };
const DOOR = { ...WINDOW, id: "test.door.opening.v1", dimensionsM: { width: 1.02, depth: 0.21, height: 2.1 } };
const FIXED = { ...SOFA, id: "test.sofa.fixed.v1", placement: { allowTranslate: false, allowRotate: false, allowScale: false, collisionFootprint: "BOUNDING_BOX_XY" } };
const FIX = Object.fromEntries([SOFA, TOILET, CABINET, PENDANT, WINDOW, TRUSS, SOFA_ORTHO, SHOWER, DOOR, FIXED].map((m) => [m.id, m]));
const ctx = { meta: (id) => FIX[id] };
const R = "living";
ok(SOFA.mounting === "FLOOR" && J(SOFA.snap) === '["FLOOR"]' && SOFA.rotation.freeRotation === true && J(SOFA.rotation.allowedDegrees) === "[0,15,30,45,60,75,90,180,270]", "sofa: FLOOR · [FLOOR] · freeRotation + his 15° list (verbatim)");
ok(TOILET.mounting === "FLOOR" && CABINET.mounting === "WALL" && PENDANT.mounting === "CEILING" && WINDOW.mounting === "WALL" && TRUSS.mounting === "BUILT_IN", "toilet FLOOR · cabinets WALL · pendant CEILING · window WALL · truss BUILT_IN (his mounting, verbatim)");
ok([SOFA, TOILET, CABINET, PENDANT, WINDOW, TRUSS].every((m) => m.pivot.origin === "FLOOR_CENTER" && m.pivot.axes === "X=width,Y=depth,Z=up" && m.rotation.axis === "Z" && m.authority === "ILLUSTRATIVE"), "every record: pivot FLOOR_CENTER · X=width,Y=depth,Z=up · rotation about Z · ILLUSTRATIVE");

// ── 1. the room contract behind the constants (one source — never a per-asset offset) ──
const W = ROOM_BOX.widthM, D = ROOM_BOX.depthM, H = ROOM_BOX.heightM;
ok(near(W, mFromFt(ROOM_FT)) && near(D, mFromFt(ROOM_GRID)) && near(H, mFromFt(STOREY_FT)) && near(W, 3.048), "ROOM_BOX = the 10 × 10 × 10 ft cube (room-layout ROOM_FT / STOREY_FT = room-objects ROOM_GRID) in metres");
ok(FREE_STEP_DEG === 15 && J(ORTHO_DEGREES) === "[0,90,180,270]" && near(SNAP_DIST_M, mFromFt(1)), "15° free grain · the orthogonal four · one-cell snap reach");
ok(near(WALL_MOUNT_Z_M, mFromFt(4.5)) && near(SURFACE_Z_M, mFromFt(OBJECT_SPEC.counter.h)) && near(SURFACE_Z_M, 0.9144) && near(DOOR_HARDWARE_Z_M, mFromFt(3)), "wall datum 54 in · surface = the counter height (36 in ≈ 0.9 m) · door hardware 36 in");
ok(near(WIN_SILL_M, mFromFt(OPENING_STD.WIN_SILL_FT)) && near(WIN_HEAD_M, mFromFt(OPENING_STD.WIN_HEAD_FT)) && near(WINDOW_MIN_SILL_M, mFromFt(1)) && WINDOW_MIN_SILL_M > 0, "openings read OPENING_STD (sill 3 ft · head 6.5 ft); the lowest window sill is one cell above the floor");
ok(snapTargetsFor(SOFA).join() === "FLOOR" && snapTargetsFor(TOILET).join() === "FLOOR,WALL_BACK" && snapTargetsFor({ ...SOFA, snap: [] }).join() === "FLOOR" && snapTargetsFor({ ...CABINET, snap: ["NOPE"] }).join() === "WALL" && snapTargetsFor(TRUSS).join() === "ROOF_LINE" && snapTargetsFor({ ...TRUSS, snap: [] }).length === 0, "snapTargetsFor: his snap[] (known targets), else the mounting's implied target; BUILT_IN implies none");
ok(hostOf(SOFA) === "FLOOR" && hostOf(TOILET) === "FLOOR" && hostOf(CABINET) === "WALL" && hostOf(PENDANT) === "CEILING" && hostOf(WINDOW) === "WALL_OPENING" && hostOf(TRUSS) === "BUILT_IN" && hostOf({ ...CABINET, snap: ["DOOR"] }) === "DOOR" && hostOf({ ...CABINET, snap: ["CABINET_UNDERSIDE"] }) === "CABINET_UNDERSIDE" && hostOf({ ...SOFA, mounting: "SURFACE" }) === "SURFACE" && hostOf({ ...SOFA, mounting: "???" }) === "FLOOR", "hostOf: mounting is the arbiter; a WALL host refines to WALL_OPENING / DOOR / CABINET_UNDERSIDE from snap[]");

// ── 2. rotation: yaw only — wrap, 15° grain when free, nearest allowedDegrees otherwise ──
ok(wrapYaw(360) === 0 && wrapYaw(-90) === 270 && wrapYaw(725) === 5 && wrapYaw(NaN) === 0 && Object.is(wrapYaw(-360), 0), "wrapYaw: 0–360 wrap (360 → 0, −90 → 270, never −0)");
ok(snapYaw(SOFA, 20).deg === 15 && snapYaw(SOFA, 23).deg === 30 && snapYaw(SOFA, 352.6).deg === 0 && snapYaw(SOFA, 105).deg === 105 && snapYaw(SOFA, 20).reason === "YAW_SNAPPED_15" && snapYaw(SOFA, 45).reason === null, "freeRotation → the 15° grain over the whole circle (105° is a step; 352.6° wraps to 0)");
ok(snapYaw(SOFA_ORTHO, 46).deg === 90 && snapYaw(SOFA_ORTHO, 44).deg === 0 && snapYaw(SOFA_ORTHO, 300).deg === 270 && snapYaw(SOFA_ORTHO, 359).deg === 0 && snapYaw(SOFA_ORTHO, 46).reason === "YAW_SNAPPED_ALLOWED", "freeRotation false → the nearest allowedDegrees (359 → 0 across the wrap)");
ok(snapYaw({ ...SOFA_ORTHO, rotation: { freeRotation: false, allowedDegrees: [] } }, 100).deg === 90 && snapYaw({ ...SOFA_ORTHO, rotation: undefined }, 100).deg === 90 && snapYaw({ ...SOFA_ORTHO, rotation: { freeRotation: false, allowedDegrees: [0, 45] } }, 100).deg === 45, "a missing / empty allowedDegrees reads the orthogonal four; a custom list is honoured");
ok(wallYaw("N") === 0 && wallYaw("W") === 90 && wallYaw("S") === 180 && wallYaw("E") === 270 && wallFacedByBack(0) === "N" && wallFacedByBack(90) === "W" && wallFacedByBack(180) === "S" && wallFacedByBack(270) === "E" && wallFacedByBack(15) === "N" && wallFacedByBack(75) === "W" && wallFacedByBack(45) === "N", "back-to-wall yaws N 0 · W 90 · S 180 · E 270 (room-objects' partRects convention); the back normal's dominant axis picks the wall (45° → N)");
ok(nearestWall({ x: 1.5, y: 2.9 }) === "N" && nearestWall({ x: 1.5, y: 0.1 }) === "S" && nearestWall({ x: 0.1, y: 1.5 }) === "W" && nearestWall({ x: 2.9, y: 1.5 }) === "E" && nearestWall({ x: 0, y: D }) === "N" && nearestWall({ x: W / 2, y: D / 2 }) === "N", "nearestWall: by the pivot; ties N · S · W · E (wallOf's order)");
const he0 = halfExtents(SOFA, 0), he90 = halfExtents(SOFA, 90), he45 = halfExtents(SOFA, 45);
ok(near(he0.hx, 1.07) && near(he0.hy, 0.43) && near(he90.hx, 0.43) && near(he90.hy, 1.07) && near(he45.hx, (2.14 + 0.86) / 2 * Math.SQRT1_2) && near(he45.hy, he45.hx), "halfExtents: exact at the orthogonal yaws (90 swaps w/d); the rotated AABB in between");

// ── 3. clampAxis == room-objects clampFootprint (round = false) at every orthogonal yaw, in-range sizes ──
{
  let same = 0, total = 0;
  for (const [w, d] of [[5, 2], [2, 2], [6, 4], [3, 0.5], [1, 1], [4, 1.5], [10, 2]]) for (const rot of [0, 90, 180, 270]) for (const [gx, gy] of [[-3, -3], [0, 0], [2.5, 7.25], [9, 9], [12, 4], [4.5, 4.5]]) {
    const c = clampFootprint(gx, gy, w, d, rot, false);
    const m = { id: "x", dimensionsM: { width: mFromFt(w), depth: mFromFt(d), height: 1 }, mounting: "FLOOR" };
    const { hx, hy } = halfExtents(m, rot);
    const x = clampAxis(mFromFt(gx + 0.5), hx, W), y = clampAxis(mFromFt(gy + 0.5), hy, D);
    total++; if (near(x, mFromFt(c.gx + 0.5), 2e-6) && near(y, mFromFt(c.gy + 0.5), 2e-6)) same++;
  }
  ok(same === total && total === 168, `clampAxis is clampFootprint's math at the orthogonal yaws (${same}/${total} proposals agree within 2 µm)`);
  ok(near(clampAxis(1, 2, 3.048), 1.524) && near(clampAxis(-1, 0.5, 3.048), 0.5) && near(clampAxis(9, 0.5, 3.048), 2.548), "an oversize piece is centred; otherwise the centre lives in [half, size − half]");
}

// ── 4. PLACE + translate (FLOOR): z = 0 always, footprint clamped inside the 10 × 10 ──
let s = EMPTY_PLACEMENT;
let r = placeAsset(s, { assetId: SOFA.id, roomId: R, positionM: { x: 1.5, y: 1.5, z: 0 }, rotationDeg: 0 }, ctx);
ok(r.ok && r.state !== s && r.state.instances.length === 1 && s.instances.length === 0, "PLACE returns a NEW state with the instance; the input state is untouched");
const sofa1 = r.state.instances[0];
ok(sofa1.instanceId === `${R}-sofa-001` && sofa1.assetId === SOFA.id && sofa1.roomId === R && sofa1.authority === "ILLUSTRATIVE" && near(sofa1.positionM.x, 1.5) && near(sofa1.positionM.y, 1.5) && sofa1.positionM.z === 0 && sofa1.rotationDeg === 0, "the instance: <roomId>-<slug>-001 · assetId · roomId · positionM (metres) · rotationDeg · ILLUSTRATIVE");
ok(J(Object.keys(sofa1).sort()) === J(["assetId", "authority", "instanceId", "positionM", "roomId", "rotationDeg"]), "a PlacedAsset is semantic id + transform only (his §9 record, nothing else)");
s = r.state;
r = moveAsset(s, { instanceId: sofa1.instanceId, positionM: { x: 0.2, y: 0.2 } }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.x, 1.07) && near(r.state.instances[0].positionM.y, 0.43) && r.state.instances[0].positionM.z === 0 && r.reasons.includes("FOOTPRINT_CLAMPED"), "MOVE toward the SW corner: the whole footprint stays inside (centre at w/2, d/2) — reason FOOTPRINT_CLAMPED");
r = moveAsset(r.state, { instanceId: sofa1.instanceId, positionM: { x: 1.8, y: 1.8, z: 1.25 } }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.x, 1.8) && near(r.state.instances[0].positionM.y, 1.8) && r.state.instances[0].positionM.z === 0 && r.reasons.includes("FLOOR_Z0"), "a FLOOR asset asked to float (z 1.25) lands at z = 0 — reason FLOOR_Z0");
r = moveAsset(r.state, { instanceId: sofa1.instanceId, positionM: { x: 99, y: -5 } }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.x, W - 1.07) && near(r.state.instances[0].positionM.y, 0.43), "MOVE far outside: clamped to the far wall / near wall, never through");
r = moveAsset(r.state, { instanceId: sofa1.instanceId, positionM: { x: NaN, y: 1 } }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.x, W / 2) && r.reasons.includes("INPUT_DEFAULTED"), "a non-finite coordinate defaults to the room centre (never NaN in state) — reason INPUT_DEFAULTED");
ok(!moveAsset(r.state, { instanceId: "nope", positionM: { x: 1, y: 1 } }, ctx).ok && moveAsset(r.state, { instanceId: "nope", positionM: { x: 1, y: 1 } }, ctx).reasons.join() === "UNKNOWN_INSTANCE", "MOVE of an unknown instance is refused (UNKNOWN_INSTANCE)");
s = moveAsset(r.state, { instanceId: sofa1.instanceId, positionM: { x: 1.5, y: 1.5 } }, ctx).state;

// ── 5. ROTATE: 15° grain, allowedDegrees, wrap, relative + absolute, re-clamped footprint ──
r = rotateAsset(s, { instanceId: sofa1.instanceId, byDeg: 20 }, ctx);
ok(r.ok && r.state.instances[0].rotationDeg === 15 && r.reasons.includes("YAW_SNAPPED_15"), "ROTATE by 20° on a freeRotation asset snaps to 15°");
r = rotateAsset(r.state, { instanceId: sofa1.instanceId, byDeg: -105 }, ctx);
ok(r.ok && r.state.instances[0].rotationDeg === 270, "relative −105° from 15° wraps to 270°");
r = rotateAsset(r.state, { instanceId: sofa1.instanceId, rotationDeg: 372 }, ctx);
ok(r.ok && r.state.instances[0].rotationDeg === 15, "absolute 372° wraps to 12° and snaps to 15°");
r = rotateAsset(r.state, { instanceId: sofa1.instanceId, rotationDeg: 360 }, ctx);
ok(r.ok && r.state.instances[0].rotationDeg === 0 && !Object.is(r.state.instances[0].rotationDeg, -0), "360° is 0°");
ok(rotateAsset(r.state, { instanceId: sofa1.instanceId, rotationDeg: 45 }, ctx).state.instances[0].rotationDeg === 45 && rotateAsset(r.state, { instanceId: sofa1.instanceId, rotationDeg: 195 }, ctx).state.instances[0].rotationDeg === 195, "45° and 195° are 15° steps (his list generalised to the circle)");
{
  const corner = moveAsset(r.state, { instanceId: sofa1.instanceId, positionM: { x: 0, y: 0 } }, ctx).state;
  const rot = rotateAsset(corner, { instanceId: sofa1.instanceId, rotationDeg: 90 }, ctx);
  ok(rot.ok && rot.state.instances[0].rotationDeg === 90 && near(rot.state.instances[0].positionM.x, 1.07) && near(rot.state.instances[0].positionM.y, 1.07) && rot.state.instances[0].positionM.z === 0, "rotating in a corner re-clamps the rotated footprint inside (w/d swap; the pivot is kept where it already fits — rotateObject's R5 rule) — still z 0");
  const rot45 = rotateAsset(corner, { instanceId: sofa1.instanceId, rotationDeg: 45 }, ctx);
  ok(rot45.ok && near(rot45.state.instances[0].positionM.x, 1.07) && near(rot45.state.instances[0].positionM.y, he45.hy), "a 45° sofa in the corner sits on its rotated bounding box (y pushed to hy; x already inside)");
}
{
  const o = placeAsset(EMPTY_PLACEMENT, { assetId: SOFA_ORTHO.id, roomId: R, positionM: { x: 1.5, y: 1.5 }, rotationDeg: 100 }, ctx);
  ok(o.ok && o.state.instances[0].rotationDeg === 90 && o.reasons.includes("YAW_SNAPPED_ALLOWED"), "PLACE at 100° on an allowedDegrees [0,90,180,270] asset lands at 90°");
  const o2 = rotateAsset(o.state, { instanceId: o.instanceId, byDeg: 44 }, ctx);
  ok(o2.ok && o2.state.instances[0].rotationDeg === 90 && rotateAsset(o.state, { instanceId: o.instanceId, byDeg: 46 }, ctx).state.instances[0].rotationDeg === 180, "+44° stays at 90°, +46° goes to 180° (nearest allowed)");
}
ok(!rotateAsset(s, { instanceId: "nope", byDeg: 90 }, ctx).ok, "ROTATE of an unknown instance is refused");
{
  const f = placeAsset(EMPTY_PLACEMENT, { assetId: FIXED.id, roomId: R, positionM: { x: 1.5, y: 1.5 } }, ctx);
  ok(f.ok && !moveAsset(f.state, { instanceId: f.instanceId, positionM: { x: 2, y: 2 } }, ctx).ok && moveAsset(f.state, { instanceId: f.instanceId, positionM: { x: 2, y: 2 } }, ctx).reasons.join() === "TRANSLATE_FORBIDDEN" && rotateAsset(f.state, { instanceId: f.instanceId, byDeg: 90 }, ctx).reasons.join() === "ROTATE_FORBIDDEN", "placement.allowTranslate / allowRotate false → MOVE / ROTATE refused (TRANSLATE_FORBIDDEN / ROTATE_FORBIDDEN)");
}

// ── 6. REMOVE + DUPLICATE ──
r = duplicateAsset(s, { instanceId: sofa1.instanceId }, ctx);
ok(r.ok && r.state.instances.length === 2 && r.instanceId === `${R}-sofa-002` && J(r.state.instances[1].positionM) === J(s.instances[0].positionM) && r.state.instances[1].rotationDeg === s.instances[0].rotationDeg && r.state.instances[1].assetId === SOFA.id && r.state.instances[1].authority === "ILLUSTRATIVE", "DUPLICATE: a new id (…-002), the same transform, the same asset, ILLUSTRATIVE");
ok(duplicateAsset(s, { instanceId: sofa1.instanceId, seq: 7 }, ctx).instanceId === `${R}-sofa-007` && duplicateAsset(r.state, { instanceId: sofa1.instanceId }, ctx).instanceId === `${R}-sofa-003`, "a passed seq names the number; otherwise the next free one");
{
  const d = duplicateAsset(s, { instanceId: sofa1.instanceId, offsetM: { x: 5, y: 0 } }, ctx);
  ok(d.ok && near(d.state.instances[1].positionM.x, W - 1.07) && d.state.instances[1].positionM.z === 0, "an offset duplicate is re-resolved (clamped inside, z 0)");
}
let rm = removeAsset(r.state, { instanceId: `${R}-sofa-002` });
ok(rm.ok && rm.state.instances.length === 1 && rm.state.instances[0].instanceId === sofa1.instanceId && r.state.instances.length === 2, "REMOVE drops the one instance (the prior state keeps both)");
ok(!removeAsset(rm.state, { instanceId: "nope" }).ok && J(removeAsset(rm.state, { instanceId: "nope" }).state) === J(rm.state) && removeAsset(rm.state, { instanceId: "nope" }).state !== rm.state, "REMOVE of an unknown id is refused; the returned state is a new object equal in content");
ok(selectAsset(rm.state, { instanceId: sofa1.instanceId }).ok && selectAsset(rm.state, { instanceId: sofa1.instanceId }).instanceId === sofa1.instanceId && !selectAsset(rm.state, { instanceId: "nope" }).ok && selectAsset(rm.state, { instanceId: null }).ok, "SELECT: ok for a known instance, refused for an unknown, null clears");
ok(instanceIdFor(EMPTY_PLACEMENT, "kitchen", "architect2525.asset.wall.cabinets.v1") === "kitchen-wall-cabinets-001" && assetSlug("furniture.sofa.3seat.v1") === "furniture-sofa-3seat" && assetSlug("architect2525.asset.sofa.v1") === "sofa" && instanceIdFor({ instances: [{ ...sofa1, instanceId: `${R}-sofa-007` }] }, R, SOFA.id) === `${R}-sofa-008` && instanceIdFor({ instances: [{ ...sofa1, instanceId: `${R}-sofa-003` }] }, R, SOFA.id, 3) === `${R}-sofa-004`, "instanceIdFor: <roomId>-<slug>-NNN — next after the highest; a colliding seq bumps");

// ── 7. WALL (cabinets): always on a wall, back flush, yaw facing the room, z = instance elevation or the 54-in datum ──
r = placeAsset(EMPTY_PLACEMENT, { assetId: CABINET.id, roomId: "kitchen", positionM: { x: 1.5, y: 2.9 }, rotationDeg: 37 }, ctx);
const cab = r.state.instances[0];
ok(r.ok && r.resolved.host === "WALL" && r.resolved.wall === "N" && near(cab.positionM.y, D - 0.3825 / 2) && near(cab.positionM.x, 1.5) && cab.rotationDeg === 0 && near(cab.positionM.z, WALL_MOUNT_Z_M) && r.reasons.includes("YAW_WALL_FACING") && r.reasons.includes("WALL_Z_DEFAULT"), "wall cabinets near the N wall: back flush to N, yaw forced to 0 (facing the room), underside at the 54-in datum");
ok(cab.positionM.z + CABINET.dimensionsM.height <= H + 1e-9, "the cabinets' top stays under the 10-ft ceiling");
r = moveAsset(r.state, { instanceId: cab.instanceId, positionM: { x: 0.1, y: 1.5 } }, ctx);
ok(r.ok && r.resolved.wall === "W" && near(r.state.instances[0].positionM.x, 0.3825 / 2) && near(r.state.instances[0].positionM.y, 1.5) && r.state.instances[0].rotationDeg === 90 && near(r.state.instances[0].positionM.z, WALL_MOUNT_Z_M), "moved toward the W wall: flush to W, yaw 90, elevation kept");
r = moveAsset(r.state, { instanceId: cab.instanceId, positionM: { x: 1.5, y: 1.5, z: 1.0 }, wall: "E" }, ctx);
ok(r.ok && r.resolved.wall === "E" && near(r.state.instances[0].positionM.x, W - 0.3825 / 2) && r.state.instances[0].rotationDeg === 270 && near(r.state.instances[0].positionM.z, 1.0), "a wall hint locks the wall (E, yaw 270) from the room centre; an instance z (1.0 m) is honoured");
r = moveAsset(r.state, { instanceId: cab.instanceId, positionM: { x: 1.5, y: 1.5, z: 9 }, wall: "N" }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.z, H - CABINET.dimensionsM.height) && r.reasons.includes("Z_CLAMPED"), "an elevation above the ceiling is clamped so the top meets the ceiling (Z_CLAMPED)");
r = rotateAsset(r.state, { instanceId: cab.instanceId, byDeg: 90 }, ctx);
ok(r.ok && r.state.instances[0].rotationDeg === 0 && r.resolved.wall === "N" && r.reasons.includes("YAW_WALL_FACING"), "rotating a wall-hosted asset keeps it facing the room (YAW_WALL_FACING) — it never turns into its wall");
r = moveAsset(r.state, { instanceId: cab.instanceId, positionM: { x: 99, y: 2.9 }, wall: "N" }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.x, W - 1.65 / 2) && near(r.state.instances[0].positionM.y, D - 0.3825 / 2), "sliding along the N wall past the corner stops at the corner, still flush");
ok(["N", "S", "W", "E"].every((wall) => { const p = placeAsset(EMPTY_PLACEMENT, { assetId: CABINET.id, roomId: "k", positionM: { x: 1.5, y: 1.5 }, wall }, ctx); const i = p.state.instances[0]; return p.ok && i.rotationDeg === wallYaw(wall) && isValidFor(CABINET, i); }), "on each of the four walls the cabinets face the room with that wall's yaw and validate");
{
  const u = placeAsset(EMPTY_PLACEMENT, { assetId: "u", roomId: "k", positionM: { x: 1.5, y: 2.9 } }, { meta: () => ({ ...CABINET, id: "u", snap: ["CABINET_UNDERSIDE"], dimensionsM: { width: 1, depth: 0.09, height: 0.085 } }) });
  ok(u.ok && u.resolved.host === "CABINET_UNDERSIDE" && near(u.state.instances[0].positionM.z, WALL_MOUNT_Z_M - 0.085), "CABINET_UNDERSIDE: hangs just under the cabinet line");
  const lk = placeAsset(EMPTY_PLACEMENT, { assetId: "lk", roomId: "k", positionM: { x: 1.5, y: 0.1 } }, { meta: () => ({ ...CABINET, id: "lk", snap: ["DOOR"], dimensionsM: { width: 0.28, depth: 0.175, height: 0.64 } }) });
  ok(lk.ok && lk.resolved.host === "DOOR" && near(lk.state.instances[0].positionM.z, DOOR_HARDWARE_Z_M) && lk.resolved.wall === "S", "DOOR-hosted hardware: on the wall at the 36-in hardware line");
}

// ── 7b. ADVERSARIAL ROUND — the corner jump, a junk wall hint, the hinge flip, a tall ceiling asset ──
{
  const deep = { ...CABINET, id: "test.deep.narrow.v1", dimensionsM: { width: 0.3, depth: 0.6, height: 0.5 } };   // nearer the W wall by pivot when flush to N in the NW corner
  const c3 = { meta: (id) => (id === deep.id ? deep : FIX[id]) };
  const nw = placeAsset(EMPTY_PLACEMENT, { assetId: deep.id, roomId: "k", positionM: { x: 0, y: 3 }, wall: "N" }, c3);
  const rot = rotateAsset(nw.state, { instanceId: nw.instanceId, byDeg: 90 }, c3);
  const dup = duplicateAsset(nw.state, { instanceId: nw.instanceId }, c3);
  ok(nw.ok && nw.resolved.wall === "N" && nearestWall(nw.state.instances[0].positionM) === "W" && rot.resolved.wall === "N" && rot.state.instances[0].rotationDeg === 0 && dup.resolved.wall === "N" && J(dup.state.instances[1].positionM) === J(nw.state.instances[0].positionM), "a deep, narrow piece flush to N in the NW corner (nearer W by pivot) stays on N through ROTATE and DUPLICATE — the wall lock");
  ok(wallOfPlaced(deep, nw.state.instances[0]) === "N" && wallOfPlaced(SOFA, { positionM: { x: 1.5, y: 1.5 }, rotationDeg: 0 }) === undefined && isWallHost("WALL") && isWallHost("WALL_OPENING") && !isWallHost("FLOOR") && !isWallHost("CEILING"), "wallOfPlaced reads the wall a transform is flush to (none for a free sofa); isWallHost names the four wall hosts");
  const junk = placeAsset(EMPTY_PLACEMENT, { assetId: CABINET.id, roomId: "k", positionM: { x: 1.5, y: 2.9 }, wall: "X" }, ctx);
  ok(junk.ok && junk.resolved.wall === "N" && J(junk.state.instances[0].positionM) === J(placeAsset(EMPTY_PLACEMENT, { assetId: CABINET.id, roomId: "k", positionM: { x: 1.5, y: 2.9 } }, ctx).state.instances[0].positionM), "a junk wall hint (\"X\") is ignored — the nearest wall rules, never a crash or a phantom wall");
  const hinge = placeAsset(EMPTY_PLACEMENT, { assetId: DOOR.id, roomId: "l", positionM: { x: 1.5, y: 0.1 }, rotationDeg: 180 }, ctx);
  const flipped = rotateAsset(hinge.state, { instanceId: hinge.instanceId, byDeg: 180 }, ctx);
  ok(hinge.ok && hinge.resolved.wall === "S" && hinge.state.instances[0].rotationDeg === 180 && flipped.ok && flipped.resolved.wall === "S" && flipped.state.instances[0].rotationDeg === 0 && J(flipped.state.instances[0].positionM) === J(hinge.state.instances[0].positionM), "a door ROTATEd by 180° flips its hinge side on the same wall, same position (rotateObject\'s wall-object rule)");
  const tall = { ...PENDANT, id: "test.tall.ceiling.v1", dimensionsM: { width: 0.5, depth: 0.5, height: 3.2 } };
  const t = placeAsset(EMPTY_PLACEMENT, { assetId: tall.id, roomId: "l", positionM: { x: 1.5, y: 1.5 } }, { meta: () => tall });
  ok(!t.ok && t.reasons.includes("TOO_TALL") && t.state.instances.length === 0 && !isValidFor(tall, { positionM: { x: 1.5, y: 1.5, z: 0 }, rotationDeg: 0 }), "a CEILING asset taller than the storey is refused (TOO_TALL) rather than left standing on the floor");
  const sofaZ = moveAsset(placeAsset(EMPTY_PLACEMENT, { assetId: CABINET.id, roomId: "k", positionM: { x: 1.5, y: 2.9, z: 0.6 } }, ctx).state, { instanceId: "k-wall-cabinets-001", positionM: { x: 1, y: 2.9 } }, ctx);
  ok(sofaZ.ok && near(sofaZ.state.instances[0].positionM.z, 0.6) && near(rotateAsset(sofaZ.state, { instanceId: "k-wall-cabinets-001", byDeg: 90 }, ctx).state.instances[0].positionM.z, 0.6), "an instance elevation survives MOVE (no z given) and ROTATE — z is carried, never reset to the datum");
}

// ── 8. CEILING (pendant): z = storey − height, x/y free inside, never on the floor ──
r = placeAsset(EMPTY_PLACEMENT, { assetId: PENDANT.id, roomId: "dining", positionM: { x: 1.5, y: 1.5, z: 0 }, rotationDeg: 30 }, ctx);
const pend = r.state.instances[0];
ok(r.ok && r.resolved.host === "CEILING" && near(pend.positionM.z, H - PENDANT.dimensionsM.height) && near(pend.positionM.z + PENDANT.dimensionsM.height, H) && pend.rotationDeg === 30 && r.reasons.includes("CEILING_Z"), "pendant asked at z 0 hangs with its top at the ceiling (z = storey − height); yaw per metadata");
r = moveAsset(r.state, { instanceId: pend.instanceId, positionM: { x: 0, y: 0, z: 0.5 } }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.z, H - PENDANT.dimensionsM.height) && near(r.state.instances[0].positionM.x, halfExtents(PENDANT, 30).hx) && near(r.state.instances[0].positionM.y, halfExtents(PENDANT, 30).hy), "moved to the corner at z 0.5: still at the ceiling, its 30°-rotated footprint inside");
ok(!isValidFor(PENDANT, { positionM: { x: 1.5, y: 1.5, z: 0 }, rotationDeg: 0 }) && isValidFor(PENDANT, r.state.instances[0]), "a pendant on the floor is an invalid state; the resolved one is valid");

// ── 9. FLOOR + WALL_BACK (toilet): back to the nearest wall when within a cell, free on the floor otherwise ──
r = placeAsset(EMPTY_PLACEMENT, { assetId: TOILET.id, roomId: "bath", positionM: { x: 1.5, y: 2.9 }, rotationDeg: 0 }, ctx);
const toi = r.state.instances[0];
ok(r.ok && r.resolved.host === "FLOOR" && r.resolved.wall === "N" && near(toi.positionM.y, D - TOILET.dimensionsM.depth / 2) && near(toi.positionM.x, 1.5) && toi.positionM.z === 0 && toi.rotationDeg === 0 && r.reasons.includes("WALL_BACK_FLUSH"), "toilet near the N wall, back facing it: tank flush to the wall, on the floor");
r = moveAsset(r.state, { instanceId: toi.instanceId, positionM: { x: W / 2, y: D / 2 } }, ctx);
ok(r.ok && r.resolved.wall === undefined && near(r.state.instances[0].positionM.x, W / 2) && near(r.state.instances[0].positionM.y, D / 2) && r.state.instances[0].positionM.z === 0, "in the middle of the room it is a free floor asset (no wall)");
r = rotateAsset(r.state, { instanceId: toi.instanceId, rotationDeg: 15 }, ctx);
ok(r.ok && r.state.instances[0].rotationDeg === 15, "…and turns on the 15° grain there");
r = moveAsset(r.state, { instanceId: toi.instanceId, positionM: { x: 0.2, y: 1.5 } }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.x, halfExtents(TOILET, 15).hx) && r.state.instances[0].rotationDeg === 15 && r.resolved.wall === undefined, "at 15° its back faces N (not W): sliding to the W wall only clamps — no snap to a wall it does not face");
r = rotateAsset(r.state, { instanceId: toi.instanceId, rotationDeg: 90 }, ctx);
ok(r.ok && r.resolved.wall === "W" && near(r.state.instances[0].positionM.x, TOILET.dimensionsM.depth / 2) && r.state.instances[0].rotationDeg === 90, "turned to 90° (back west) within a cell of the W wall: snaps flush to W");
r = moveAsset(r.state, { instanceId: toi.instanceId, positionM: { x: 1.5, y: 0.5 }, wall: "S" }, ctx);
ok(r.ok && r.resolved.wall === "S" && near(r.state.instances[0].positionM.y, TOILET.dimensionsM.depth / 2) && r.state.instances[0].rotationDeg === 180, "a wall hint snaps the back to that wall from anywhere (S → yaw 180)");
{
  const sh = placeAsset(EMPTY_PLACEMENT, { assetId: SHOWER.id, roomId: "bath", positionM: { x: 0.6, y: 0.6 }, rotationDeg: 15 }, ctx);
  ok(sh.ok && sh.resolved.corner === "SW" && near(sh.state.instances[0].positionM.x, 0.5) && near(sh.state.instances[0].positionM.y, 0.5) && sh.state.instances[0].rotationDeg === 0 && sh.reasons.includes("WALL_CORNER"), "WALL_CORNER (shower) within a cell of the SW corner: pushed into the corner, yaw orthogonal");
  const sh2 = placeAsset(EMPTY_PLACEMENT, { assetId: SHOWER.id, roomId: "bath", positionM: { x: 2.6, y: 2.5 }, rotationDeg: 100 }, ctx);
  ok(sh2.ok && sh2.resolved.corner === "NE" && near(sh2.state.instances[0].positionM.x, W - 0.5) && near(sh2.state.instances[0].positionM.y, D - 0.5) && sh2.state.instances[0].rotationDeg === 90, "…NE corner from 100° → 90°");
  const free = placeAsset(EMPTY_PLACEMENT, { assetId: SHOWER.id, roomId: "bath", positionM: { x: 1.5, y: 1.5 }, rotationDeg: 15 }, ctx);
  ok(free.ok && free.resolved.corner === undefined && free.state.instances[0].rotationDeg === 15, "away from a corner the shower is a free floor asset");
}

// ── 10. WALL_OPENING (window / door): in a wall with the wall's normal; a window at its sill, a door at z 0 ──
r = placeAsset(EMPTY_PLACEMENT, { assetId: WINDOW.id, roomId: "living", positionM: { x: 1.5, y: 0.1, z: 0 }, rotationDeg: 0 }, ctx);
const win = r.state.instances[0];
ok(r.ok && r.resolved.host === "WALL_OPENING" && r.resolved.wall === "S" && near(win.positionM.y, WINDOW.dimensionsM.depth / 2) && near(win.positionM.z, WINDOW_MIN_SILL_M) && win.positionM.z > 0 && (win.rotationDeg === 0 || win.rotationDeg === 180) && r.reasons.includes("OPENING_SILL"), "a window dropped at z 0 on the S wall is lifted to the lowest sill (one cell) — it can never lie on the floor");
r = placeAsset(EMPTY_PLACEMENT, { assetId: WINDOW.id, roomId: "living", positionM: { x: 2.9, y: 1.5 } }, ctx);
ok(r.ok && r.resolved.wall === "E" && near(r.state.instances[0].positionM.z, WIN_SILL_M) && (r.state.instances[0].rotationDeg === 270 || r.state.instances[0].rotationDeg === 90) && near(r.state.instances[0].positionM.x, W - WINDOW.dimensionsM.depth / 2) && r.reasons.includes("OPENING_SILL_DEFAULT"), "with no elevation the sill is the standard 3 ft (OPENING_STD), on the E wall with its normal");
r = moveAsset(r.state, { instanceId: r.instanceId, positionM: { x: 1.5, y: 1.5, z: 1.5 }, wall: "N" }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.z, 1.5) && r.resolved.wall === "N" && near(r.state.instances[0].positionM.y, D - WINDOW.dimensionsM.depth / 2), "a window's sill is editable above the minimum (1.5 m kept) — the operator's 'distance off ground'");
r = moveAsset(r.state, { instanceId: r.instanceId, positionM: { x: 1.5, y: 1.5, z: 9 }, wall: "N" }, ctx);
ok(r.ok && near(r.state.instances[0].positionM.z, H - WINDOW.dimensionsM.height), "…and never above the ceiling");
{
  const flip = placeAsset(EMPTY_PLACEMENT, { assetId: WINDOW.id, roomId: "l", positionM: { x: 1.5, y: 2.9 }, rotationDeg: 170 }, ctx);
  ok(flip.ok && flip.state.instances[0].rotationDeg === 180 && flip.resolved.wall === "N", "an opening may carry the wall's normal flipped (hinge side: 170° → 180° on the N wall), never 90° to it");
  const dr = placeAsset(EMPTY_PLACEMENT, { assetId: DOOR.id, roomId: "l", positionM: { x: 1.5, y: 0.2, z: 1.2 } }, ctx);
  ok(dr.ok && isDoorOpening(DOOR) && !isDoorOpening(WINDOW) && dr.state.instances[0].positionM.z === 0 && dr.reasons.includes("OPENING_DOOR_Z0") && dr.resolved.wall === "S", "an opening at least window-head tall (2.1 m) is a door: z 0 whatever was asked");
}
ok(!isValidFor(WINDOW, { positionM: { x: 1.5, y: WINDOW.dimensionsM.depth / 2, z: 0 }, rotationDeg: 0 }) && !isValidFor(WINDOW, { positionM: { x: 1.5, y: 1.5, z: 1 }, rotationDeg: 0 }) && isValidFor(WINDOW, win), "a window on the floor, or off its wall, is invalid; the resolved one is valid");

// ── 11. SURFACE: z = the counter height by default, instance z honoured, inside the room ──
{
  const lamp = { ...SOFA, id: "test.lamp.surface.v1", mounting: "SURFACE", snap: ["SURFACE"], dimensionsM: { width: 0.3, depth: 0.3, height: 0.5 } };
  const c2 = { meta: (id) => (id === lamp.id ? lamp : FIX[id]) };
  const p = placeAsset(EMPTY_PLACEMENT, { assetId: lamp.id, roomId: "k", positionM: { x: 0, y: 0 } }, c2);
  ok(p.ok && p.resolved.host === "SURFACE" && near(p.state.instances[0].positionM.z, SURFACE_Z_M) && near(p.state.instances[0].positionM.x, 0.15) && p.reasons.includes("SURFACE_Z_DEFAULT"), "a SURFACE asset defaults to the counter height (36 in), footprint inside");
  const p2 = moveAsset(p.state, { instanceId: p.instanceId, positionM: { x: 1, y: 1, z: 0.75 } }, c2);
  ok(p2.ok && near(p2.state.instances[0].positionM.z, 0.75), "a given surface height (a 0.75 m desk) is honoured");
}

// ── 12. BUILT_IN: not freely placeable ──
r = placeAsset(EMPTY_PLACEMENT, { assetId: TRUSS.id, roomId: "attic", positionM: { x: 1.5, y: 1.5 } }, ctx);
ok(!r.ok && r.reasons.includes("BUILT_IN") && r.reasons.includes("NOT_PLACEABLE") && r.state.instances.length === 0 && r.resolved?.placeable === false && !isValidFor(TRUSS, { positionM: { x: 1, y: 1, z: 0 }, rotationDeg: 0 }), "a BUILT_IN element (roof truss) is refused — reason BUILT_IN; nothing enters the state");
ok(!placeAsset(EMPTY_PLACEMENT, { assetId: "nope.v1", roomId: "x", positionM: { x: 1, y: 1 } }, ctx).ok && placeAsset(EMPTY_PLACEMENT, { assetId: "nope.v1", roomId: "x", positionM: { x: 1, y: 1 } }, ctx).reasons.join() === "UNKNOWN_ASSET", "an unknown assetId is refused (UNKNOWN_ASSET)");
ok(!resolvePlacement({ ...SOFA, dimensionsM: { width: 0, depth: 1, height: 1 } }, { positionM: { x: 1, y: 1 } }).placeable && resolvePlacement({ ...SOFA, dimensionsM: { width: 0, depth: 1, height: 1 } }, { positionM: { x: 1, y: 1 } }).reasons.includes("INVALID_DIMENSIONS"), "zero / non-finite dimensions are not placeable (INVALID_DIMENSIONS)");

// ── 13. THE THREE IMPOSSIBLE STATES, across every op on the six records ──
{
  const ops = (id, room) => [
    { type: "PLACE", assetId: id, roomId: room, positionM: { x: 0.3, y: 2.9, z: 2 }, rotationDeg: 33 },
    { type: "MOVE", instanceId: `${room}-${assetSlug(id)}-001`, positionM: { x: 1.4, y: 1.4, z: 0 } },
    { type: "ROTATE", instanceId: `${room}-${assetSlug(id)}-001`, byDeg: 97 },
    { type: "DUPLICATE", instanceId: `${room}-${assetSlug(id)}-001`, offsetM: { x: 0.7, y: -0.4 } },
    { type: "MOVE", instanceId: `${room}-${assetSlug(id)}-002`, positionM: { x: 3, y: 0, z: 5 }, wall: "E" },
    { type: "ROTATE", instanceId: `${room}-${assetSlug(id)}-002`, rotationDeg: 181 },
  ];
  const all = [SOFA, TOILET, CABINET, PENDANT, WINDOW, SHOWER, DOOR].flatMap((m) => applyPlacementOps(EMPTY_PLACEMENT, ops(m.id, "r"), ctx).state.instances.map((i) => [m, i]));
  ok(all.length === 14, "six placeable records × (place + duplicate) = 14 instances after the op storm");
  ok(all.filter(([m]) => hostOf(m) === "FLOOR").every(([, i]) => i.positionM.z === 0), "IMPOSSIBLE #1 — no FLOOR asset ever has z > 0");
  ok(all.filter(([m]) => hostOf(m) === "CEILING").every(([m, i]) => near(i.positionM.z, H - m.dimensionsM.height) && i.positionM.z > 0), "IMPOSSIBLE #2 — no CEILING asset is ever on the floor (always top-at-ceiling)");
  ok(all.filter(([m]) => hostOf(m) === "WALL_OPENING" && !isDoorOpening(m)).every(([, i]) => i.positionM.z >= WINDOW_MIN_SILL_M - 1e-9), "IMPOSSIBLE #3 — no window ever lies on the floor (sill ≥ one cell)");
  ok(all.every(([m, i]) => isValidFor(m, i) && i.rotationDeg >= 0 && i.rotationDeg < 360 && i.authority === "ILLUSTRATIVE"), "every instance after every op is a valid state for its host, yaw ∈ [0, 360), ILLUSTRATIVE");
  ok(all.filter(([m]) => ["WALL", "WALL_OPENING"].includes(hostOf(m))).every(([, i]) => i.rotationDeg % 90 === 0), "wall-hosted assets are always orthogonal (never 15° off their wall)");
}

// ── 14. immutability: a deep-frozen input survives every op untouched; results are new objects ──
{
  const base = deepFreeze(applyPlacementOps(EMPTY_PLACEMENT, [
    { type: "PLACE", assetId: SOFA.id, roomId: R, positionM: { x: 1.5, y: 1.5 } },
    { type: "PLACE", assetId: CABINET.id, roomId: R, positionM: { x: 1.5, y: 2.9 } },
    { type: "PLACE", assetId: PENDANT.id, roomId: R, positionM: { x: 1.5, y: 1.5 } },
  ], ctx).state);
  const before = J(base);
  const results = [
    placeAsset(base, { assetId: TOILET.id, roomId: R, positionM: { x: 2.9, y: 2.9 } }, ctx),
    moveAsset(base, { instanceId: `${R}-sofa-001`, positionM: { x: 0, y: 0 } }, ctx),
    rotateAsset(base, { instanceId: `${R}-sofa-001`, byDeg: 90 }, ctx),
    removeAsset(base, { instanceId: `${R}-sofa-001` }),
    duplicateAsset(base, { instanceId: `${R}-pendant-light-001` }, ctx),
    selectAsset(base, { instanceId: `${R}-sofa-001` }),
    applyPlacementOp(base, { type: "MOVE", instanceId: `${R}-wall-cabinets-001`, positionM: { x: 0.1, y: 1 } }, ctx),
    placeAsset(base, { assetId: TRUSS.id, roomId: R, positionM: { x: 1, y: 1 } }, ctx),
    removeAsset(base, { instanceId: "nope" }),
  ];
  ok(J(base) === before && Object.isFrozen(base.instances) && results.every((x) => x.state !== base && x.state.instances !== base.instances), "every op (ok or refused) returns a NEW state object and leaves a frozen input byte-identical");
  ok(results.every((x) => x.state.instances.every((i) => Object.isFrozen(i) ? base.instances.includes(i) : true)), "untouched instances are shared by reference (structural sharing), touched ones are new");
  ok(Object.isFrozen(EMPTY_PLACEMENT) && EMPTY_PLACEMENT.instances.length === 0, "EMPTY_PLACEMENT is frozen and empty");
}

// ── 15. determinism: the same ops → byte-identical state; no randomness / clock in the sources ──
{
  const script = [
    { type: "PLACE", assetId: SOFA.id, roomId: R, positionM: { x: 1.2, y: 0.9 }, rotationDeg: 20 },
    { type: "PLACE", assetId: CABINET.id, roomId: "kitchen", positionM: { x: 2.7, y: 1.1 } },
    { type: "DUPLICATE", instanceId: `${R}-sofa-001`, offsetM: { x: 0.3, y: 0.3 } },
    { type: "ROTATE", instanceId: `${R}-sofa-002`, byDeg: 190 },
    { type: "MOVE", instanceId: "kitchen-wall-cabinets-001", positionM: { x: 0.2, y: 2.2 } },
    { type: "PLACE", assetId: WINDOW.id, roomId: R, positionM: { x: 1.5, y: 0.05 } },
    { type: "REMOVE", instanceId: `${R}-sofa-001` },
    { type: "PLACE", assetId: PENDANT.id, roomId: R, positionM: { x: 2, y: 2 }, rotationDeg: 7 },
  ];
  const a = applyPlacementOps(EMPTY_PLACEMENT, script, ctx), b = applyPlacementOps(EMPTY_PLACEMENT, script, ctx);
  ok(J(a) === J(b) && a.state.instances.length === 4 && a.state.instances.map((i) => i.instanceId).join() === `kitchen-wall-cabinets-001,${R}-sofa-002,${R}-window-single-001,${R}-pendant-light-001`, "the same op script twice → byte-identical results (ids, transforms, reasons)");
  ok(!/Math\.random\s*\(|Date\.now\s*\(|new Date\s*\(|performance\.now\s*\(/.test(read("lib/architect-2525/assets/placement.ts") + read("lib/architect-2525/assets/snap.ts")), "no Math.random / Date / clock in placement.ts or snap.ts (replay law)");
  ok(a.state.instances.every((i) => [i.positionM.x, i.positionM.y, i.positionM.z].every((n) => Number.isFinite(n) && Math.round(n * 1e6) / 1e6 === n)), "every stored coordinate is finite and µm-rounded (no float noise in state)");
}

// ── 16. the whole library (139): every record resolves per its mounting, validates, and is idempotent ──
{
  const files = fs.readdirSync(LIB).filter((f) => f.endsWith(".json")).sort();
  const recs = files.map((f) => JSON.parse(fs.readFileSync(path.join(LIB, f), "utf8")));
  const proposals = [{ positionM: { x: W / 2, y: D / 2 } }, { positionM: { x: 0, y: 0, z: 5 }, rotationDeg: 37 }, { positionM: { x: 3, y: 3, z: 0 }, rotationDeg: -200 }, { positionM: { x: 0.2, y: 2.9, z: 0.3 }, rotationDeg: 90, wall: "W" }];
  let placeable = 0, builtIn = 0, valid = 0, idem = 0, n = 0, byHost = {};
  for (const m of recs) for (const p of proposals) {
    const a = resolvePlacement(m, p); n++;
    if (m.mounting === "BUILT_IN") { if (!a.placeable && a.reasons.includes("BUILT_IN")) builtIn++; continue; }
    if (a.placeable) placeable++;
    if (isValidFor(m, a)) valid++;
    const b = resolvePlacement(m, { positionM: { ...a.positionM }, rotationDeg: a.rotationDeg, wall: a.wall });
    if (J(b.positionM) === J(a.positionM) && b.rotationDeg === a.rotationDeg) idem++;
    byHost[a.host] = (byHost[a.host] ?? 0) + 1;
  }
  const nb = recs.filter((m) => m.mounting === "BUILT_IN").length, np = recs.length - nb;
  ok(recs.length === 139 && nb === 5 && np === 134, `139 records: ${nb} BUILT_IN · ${np} placeable`);
  ok(builtIn === nb * proposals.length, "every BUILT_IN record is refused at every proposal (BUILT_IN)");
  ok(placeable === np * proposals.length && valid === placeable, `every placeable record resolves to a VALID state for its host at every proposal (${valid}/${np * proposals.length})`);
  ok(idem === placeable, "resolvePlacement is idempotent on the whole library (resolving a resolved transform changes nothing)");
  ok(recs.filter((m) => m.mounting === "FLOOR").every((m) => proposals.every((p) => resolvePlacement(m, p).positionM.z === 0)), "every FLOOR record: z 0 at every proposal");
  ok(recs.filter((m) => m.mounting === "CEILING").every((m) => proposals.every((p) => near(resolvePlacement(m, p).positionM.z, H - m.dimensionsM.height))), "every CEILING record: top at the ceiling at every proposal");
  ok(recs.filter((m) => m.mounting === "WALL").every((m) => proposals.every((p) => { const a = resolvePlacement(m, p); return a.wall !== undefined && a.rotationDeg === wallYaw(a.wall); })), "every WALL record: on a wall, facing the room, at every proposal");
  ok(recs.filter((m) => m.mounting === "SURFACE").every((m) => near(resolvePlacement(m, proposals[0]).positionM.z, SURFACE_Z_M)), "every SURFACE record defaults to the counter height");
  ok(recs.every((m) => m.rotation.freeRotation === true && J(m.rotation.allowedDegrees) === "[0,15,30,45,60,75,90,180,270]") && recs.every((m) => snapYaw(m, 37).deg === 30 && snapYaw(m, 38).deg === 45), "his library: freeRotation + the 15° list on every record → the 15° grain governs");
  console.log("  library hosts:", J(byHost));
}

// ── 17. round trip to RoomCell.objects (the persisted store) and back — through the EXISTING adapters ──
{
  const sofaId = ASSET_ID_BY_KIND.sofa, winId = ASSET_ID_BY_KIND.window, tvId = ASSET_ID_BY_KIND.tv, bedId = ASSET_ID_BY_KIND.bed;
  ok([sofaId, winId, tvId, bedId].every((id) => metadataById(id) && Object.hasOwn(ASSET_REGISTRY, id) && ASSET_REGISTRY[id].kind), "the registry resolves the sofa / window / tv / bed kinds' ids to metadata + kind (whatever his id scheme is today)");
  const rctx = {};   // the default context = the registry's metadataById
  const seq = applyPlacementOps(EMPTY_PLACEMENT, [
    { type: "PLACE", assetId: sofaId, roomId: "B1", positionM: { x: mFromFt(2.5), y: mFromFt(ROOM_GRID - 4.5) }, rotationDeg: 90 },
    { type: "PLACE", assetId: bedId, roomId: "B1", positionM: { x: mFromFt(5), y: mFromFt(ROOM_GRID - 3) }, rotationDeg: 180 },
    { type: "PLACE", assetId: winId, roomId: "B1", positionM: { x: mFromFt(5.5), y: 0.05, z: mFromFt(3) } },
    { type: "PLACE", assetId: tvId, roomId: "B1", positionM: { x: 0.05, y: mFromFt(5.5), z: mFromFt(4) } },
    { type: "PLACE", assetId: sofaId, roomId: "B2", positionM: { x: 1.5, y: 1.5 } },
  ], rctx);
  ok(seq.ok && seq.state.instances.length === 5 && instancesInRoom(seq.state, "B1").length === 4, "five registry instances placed through the default (registry) context");
  const objs = placedToRoomObjects(seq.state, ASSET_REGISTRY, "B1");
  ok(objs.length === 4 && objs.every((o) => typeof o.kind === "string" && typeof o.gx === "number" && typeof o.gy === "number" && [0, 90, 180, 270].includes(o.rot)), "placedToRoomObjects → four PlacedObjects for B1 (the designer's ft-grid record)");
  const back = roomObjectsToPlaced(objs, "B1");
  const by = (st, id) => st.instances.find((i) => i.instanceId === id);
  ok(instancesInRoom(seq.state, "B1").every((i) => { const b = by(back, i.instanceId); return b && b.assetId === i.assetId && b.roomId === "B1" && near(b.positionM.x, i.positionM.x, 1e-3) && near(b.positionM.y, i.positionM.y, 1e-3) && near(b.positionM.z, i.positionM.z, 1e-3) && b.rotationDeg === i.rotationDeg && b.authority === "ILLUSTRATIVE"; }), "RoomCell.objects → PlacementState preserves assetId + position (within 1 mm) + yaw for every instance");
  const sofaObj = objs.find((o) => o.id === "B1-" + assetSlug(sofaId) + "-001");
  ok(sofaObj && near(sofaObj.gx, 2, 1e-5) && near(sofaObj.gy, 4, 1e-5) && sofaObj.rot === 90 && elevOf(sofaObj) === 0, "the sofa lands on the designer's cell (2,4) at rot 90, elevation 0 — the adapter's centre-of-cell convention");
  const winObj = objs.find((o) => o.kind === "window");
  ok(winObj && near(elevOf(winObj), 3, 1e-5) && (winObj.gy > ROOM_GRID - 1.5), "the window sits on the S wall row with a 3-ft sill (its elevation round-trips as elev)");
  const again = placedToRoomObjects(roomObjectsToPlaced(objs, "B1"), ASSET_REGISTRY, "B1", objs);
  ok(J(again) === J(objs), "objects → placed → objects (with the prior objects) is byte-identical");
  const layouts = [...ROOM_KEYS.map((k) => standardLayoutFor(k)), ...ROOM_KEYS.map((k) => defaultObjectsForRoom(k))].filter((l) => Array.isArray(l) && l.length > 0);
  ok(layouts.length >= 9 && layouts.every((lay) => J(placedToRoomObjects(roomObjectsToPlaced(lay, "x"), ASSET_REGISTRY, "x", lay)) === J(lay)), `every standard / default room layout round-trips byte-identically through PlacementState (${layouts.length} layouts; variant / size kept by the prior)`);
  ok(layouts.every((lay) => roomObjectsToPlaced(lay, "x").instances.every((i) => metadataById(i.assetId) && i.authority === "ILLUSTRATIVE" && [0, 90, 180, 270].includes(i.rotationDeg) && [i.positionM.x, i.positionM.y, i.positionM.z].every((n) => Number.isFinite(n) && n >= 0))), "every standard-layout instance maps to registry metadata, ILLUSTRATIVE, an orthogonal yaw, finite non-negative metres (the designer's ft box, not his dimensionsM, is what those layouts were clamped against — see the report)");
  const libOnly = Object.values(ASSET_REGISTRY).find((a) => a.kind === null && a.mounting === "FLOOR");
  if (libOnly) {
    const baseN = placedToRoomObjects(seq.state, ASSET_REGISTRY, "B1").length;
    const lo = placeAsset(seq.state, { assetId: libOnly.id, roomId: "B1", positionM: { x: 1.5, y: 1.5 } }, rctx);
    const loObjs = placedToRoomObjects(lo.state, ASSET_REGISTRY, "B1");
    const loAsset = loObjs.find((o) => o.kind === "asset" && o.assetId === libOnly.id);
    const loRound = placedToRoomObjects(roomObjectsToPlaced(loObjs, "B1"), ASSET_REGISTRY, "B1", loObjs);
    ok(lo.ok && loObjs.length === baseN + 1 && !!loAsset && unpersistableInstances(lo.state, ASSET_REGISTRY).length === 0 && unpersistableInstances(seq.state, ASSET_REGISTRY).length === 0 && J(loRound) === J(loObjs), `Rev A' — a library asset with no legacy kind (${libOnly.id}) now PLACES and PERSISTS into RoomCell.objects via the kind "asset" carrier (round-trips byte-identical); nothing unpersistable`);
  }
  const unknown = placedToRoomObjects({ instances: [{ ...seq.state.instances[0], assetId: "nope.v1" }] }, ASSET_REGISTRY);
  ok(unknown.length === 0 && placedToRoomObjects({ instances: [{ ...seq.state.instances[0], assetId: "constructor" }] }, ASSET_REGISTRY).length === 0, "an unknown / prototype assetId is skipped, never a crash");
  const tilted = placedToRoomObjects(rotateAsset(seq.state, { instanceId: "B2-" + assetSlug(sofaId) + "-001", rotationDeg: 15 }, rctx).state, ASSET_REGISTRY, "B2");
  ok(tilted.length === 1 && tilted[0].rot === 0, "the persisted store quantizes yaw to the designer's Rot (15° → 0) — the PlacementState keeps the 15° (adapter behaviour, documented)");
  const mFt = (ft) => near(ftFromM(mFromFt(ft)), ft, 1e-6);
  ok([0.5, 2.5, 7.25, 9.5].every(mFt), "metres ⇄ ft through dimensions.ts is lossless at the µm");
  const legacy = metadataById(ASSET_ID_BY_KIND.closetrod);
  ok(legacy && resolvePlacement(legacy, { positionM: { x: 1.5, y: 2.9 }, rotationDeg: 40 }).placeable && resolvePlacement(legacy, { positionM: { x: 1.5, y: 2.9 }, rotationDeg: 40 }).rotationDeg === 0, "a PENDING registry record (closet rod, freeRotation false) resolves on the orthogonal set");
}

// ── 18. CRITICAL INVARIANT — illustrative placement never changes the canonical project hash / serialization ──
{
  const project = buildProjectFromSeed(TINY_HOME_V1);
  const hash0 = projectHash(project), ser0 = serializeCanonicalProject(project);
  const storm = applyPlacementOps(EMPTY_PLACEMENT, [
    { type: "PLACE", assetId: SOFA.id, roomId: "B1", positionM: { x: 1, y: 1 } },
    { type: "PLACE", assetId: CABINET.id, roomId: "B1", positionM: { x: 1, y: 2.9 } },
    { type: "PLACE", assetId: PENDANT.id, roomId: "B1", positionM: { x: 1.5, y: 1.5 } },
    { type: "PLACE", assetId: WINDOW.id, roomId: "B1", positionM: { x: 1.5, y: 0.1 } },
    { type: "PLACE", assetId: TOILET.id, roomId: "B1", positionM: { x: 2.8, y: 2.8 } },
    { type: "MOVE", instanceId: "B1-sofa-001", positionM: { x: 2, y: 2 } },
    { type: "ROTATE", instanceId: "B1-sofa-001", byDeg: 45 },
    { type: "DUPLICATE", instanceId: "B1-sofa-001" },
    { type: "REMOVE", instanceId: "B1-sofa-002" },
    { type: "PLACE", assetId: TRUSS.id, roomId: "B1", positionM: { x: 1, y: 1 } },
  ], ctx);
  placedToRoomObjects(applyPlacementOps(EMPTY_PLACEMENT, [{ type: "PLACE", assetId: ASSET_ID_BY_KIND.sofa, roomId: "B1", positionM: { x: 1, y: 1 } }], {}).state, ASSET_REGISTRY, "B1");
  ok(storm.state.instances.length === 5 && projectHash(project) === hash0 && serializeCanonicalProject(project) === ser0, "project_hash + canonical serialization UNCHANGED after place / move / rotate / duplicate / remove / refuse + the RoomCell projection");
  ok(!/instanceId|assetId|positionM|rotationDeg|ILLUSTRATIVE/.test(ser0), "no PlacedAsset field is in the canonical serialization (assets never enter canonical)");
  ok(!/from\s+"[^"]*canonical\//.test(read("lib/architect-2525/assets/placement.ts")) && !/from\s+"[^"]*canonical\//.test(read("lib/architect-2525/assets/snap.ts")), "placement.ts and snap.ts import nothing from canonical/* (the boundary is structural)");
  ok(storm.state.instances.every((i) => i.authority === "ILLUSTRATIVE") && !/authority:\s*"(REFERENCE|CANONICAL|VERIFIED)"/.test(read("lib/architect-2525/assets/placement.ts")), "every instance is ILLUSTRATIVE; the reducer can write no other authority");
}

// ── 19. wiring ──
{
  const pkg = JSON.parse(read("package.json"));
  ok(pkg.scripts["test:architect-asset-placement"] === "node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-asset-placement.test.mjs", "package.json: test:architect-asset-placement runs this gate through the ts-alias loader");
  ok(/npm run test:architect-asset-registry && npm run test:architect-asset-placement/.test(pkg.scripts["test:ci"]), "test:ci chains the placement gate beside test:architect-asset-registry");
}

console.log(`\nARCHITECT-ASSET-PLACEMENT ${pass}/${pass + fail} passed · 6 library records + the 139-record sweep · canonical hash unchanged`);
if (fail) process.exit(1);
