// ARCHITECT-2525 / FUTURE · Phase 2 planning contracts — GREEN (joins test:ci).
// T-PLACEMENT (one arm → one placement → disarm; clamp inside walls; flush wall pieces; no overlap) and
// T-PROJECTION (Plan / 3D / Walk resolve the SAME semantic instance). Pure-logic; the React UI reads these.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-planning.test.mjs
import { transformV1toV2 } from "../lib/architect-future/transformation/reference-v1-to-v2.ts";
import { placeArmed, rotateInstance, removeInstance, moveInstance } from "../lib/architect-future/state/placement-machine.ts";
import { planProjection, threeDProjection, walkProjection } from "../lib/architect-future/selectors/geometry.ts";
import { assetById } from "../lib/architect-future/domain/asset-catalog.ts";
import { UM_PER_FT, OUTER_UM, ZONE_UM, CLEAR_UM } from "../lib/architect-future/domain/geometry.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };
const ACTOR = { kind: "UNAUTHENTICATED_HUMAN", id: "u" };
const ft = (n) => Math.round(n * UM_PER_FT);

const base = transformV1toV2(null, "REFERENCE_3X3_12_10_1", ACTOR, "2026-11-08T00:00:00Z").project;
const living = base.spaces.find((s) => s.function === "LIVING");           // B1 at outer (0, 12 ft)
const bath = base.spaces.find((s) => s.function === "BATH");
const centre = { x: living.outer_x_um + OUTER_UM / 2, y: living.outer_y_um + OUTER_UM / 2, z: 0 };

// ── T-PLACEMENT ──
const armed = { armed_asset_id: "furniture.sofa.3seat.v1" };
const r1 = placeArmed(base, armed, living.entity_id, centre, 0, ACTOR);
ok(r1.placed === true, "T-PLACEMENT · a floor asset places in a room");
ok(r1.arm.armed_asset_id === null, "T-PLACEMENT · the tool DISARMS after one placement (one arm → one placement)");
ok(r1.project.assets.length === 1, "T-PLACEMENT · exactly one instance added");

// clamp inside walls: a point far outside the room is pulled inside the clear interior (never through a wall)
const far = { x: living.outer_x_um + OUTER_UM * 5, y: living.outer_y_um - OUTER_UM * 5, z: 0 };
const r2 = placeArmed(base, armed, living.entity_id, far, 0, ACTOR);
const sofa = assetById("furniture.sofa.3seat.v1");
const clearX0 = living.outer_x_um + ZONE_UM, clearX1 = clearX0 + CLEAR_UM;
ok(r2.placed && r2.project.assets[0].position_um.x - sofa.width_um / 2 >= clearX0 - 1 && r2.project.assets[0].position_um.x + sofa.width_um / 2 <= clearX1 + 1, "T-PLACEMENT · clamped inside the clear interior (no pass-through-wall)");

// flush wall piece: a WALL asset snaps its back to a wall
const r3 = placeArmed(base, { armed_asset_id: "appliance.refrigerator.v1" }, bath.entity_id, { x: bath.outer_x_um + OUTER_UM / 2, y: bath.outer_y_um + OUTER_UM / 2, z: 0 }, 0, ACTOR);
const fr = assetById("appliance.refrigerator.v1");
const bClearX0 = bath.outer_x_um + ZONE_UM, bClearX1 = bClearX0 + CLEAR_UM, bClearY0 = bath.outer_y_um + ZONE_UM, bClearY1 = bClearY0 + CLEAR_UM;
const p = r3.project.assets[0].position_um;
const flush = Math.abs(p.x - (bClearX0 + fr.width_um / 2)) < 2 || Math.abs(p.x - (bClearX1 - fr.width_um / 2)) < 2 || Math.abs(p.y - (bClearY0 + fr.depth_um / 2)) < 2 || Math.abs(p.y - (bClearY1 - fr.depth_um / 2)) < 2;
ok(r3.placed && flush, "T-PLACEMENT · a WALL asset snaps flush to a wall");

// no overlap: placing a second sofa on top of the first is rejected
const r4 = placeArmed(r1.project, armed, living.entity_id, centre, 0, ACTOR);
ok(!r4.placed && /overlap/i.test(r4.rejected_reason ?? ""), "T-PLACEMENT · overlapping placement is rejected");

// nothing armed → no placement
const r5 = placeArmed(base, { armed_asset_id: null }, living.entity_id, centre, 0, ACTOR);
ok(!r5.placed, "T-PLACEMENT · nothing armed → nothing placed");

// move / rotate / remove
const inst = r1.project.assets[0].instance_id;
const rot = rotateInstance(r1.project, inst);
ok(rot.assets[0].rotation_deg === 90, "T-PLACEMENT · rotate steps 90°");
const moved = moveInstance(r1.project, inst, { x: centre.x + ft(1), y: centre.y, z: 0 });
ok(moved.placed && moved.project.assets[0].instance_id === inst, "T-PLACEMENT · move keeps the instance id");
const rm = removeInstance(r1.project, inst);
ok(rm.assets.length === 0, "T-PLACEMENT · remove deletes the instance");

// ── T-PROJECTION ── same semantic instance in all three views
const placed = r1.project;
const plan = planProjection(placed), td = threeDProjection(placed), walk = walkProjection(placed);
ok(plan.assets.length === 1 && td.assets.length === 1 && walk.assets.length === 1, "T-PROJECTION · the instance appears in Plan, 3D and Walk");
ok(plan.assets[0].instance_id === td.assets[0].instance_id && td.assets[0].instance_id === walk.assets[0].instance_id, "T-PROJECTION · same instance id across views");
ok(plan.assets[0].cx_ft === td.assets[0].cx_ft && td.assets[0].cx_ft === walk.assets[0].cx_ft, "T-PROJECTION · same transform across views");
ok(plan.rooms.length === 9 && plan.shell_ft === 36, "T-PROJECTION · 9 rooms, 36 ft shell");
ok(plan.view === "PLAN" && td.view === "3D" && walk.view === "WALK", "T-PROJECTION · only the view tag differs");

console.log(`architect-future-planning (Phase 2): ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
