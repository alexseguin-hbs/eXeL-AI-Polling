// ROOM-OBJECTS lock (#167 Stage 1) — the interactive room-designer model is pure, deterministic (replay law),
// and clamps every placement to the 10×10 grid. Run: node --experimental-strip-types tests/room-objects.test.mjs
import { placeObject, moveObject, rotateObject, removeObject, countKind, mirrorObjects, footprintOf, cycleVariant, VARIANTS, BED_VARIANTS, OBJECT_SPEC, OBJECT_KINDS, ROOM_GRID, wallOf, slideAlongWall } from "../lib/room-objects.ts";

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
ok(OBJECT_KINDS.every((k) => OBJECT_SPEC[k].h > 0), "every kind has a real 3D height (L×W×H)");
ok(OBJECT_SPEC.door.h > OBJECT_SPEC.bed.h && OBJECT_SPEC.counter.h === 3, "heights are realistic (door tallest; counter 3ft)");

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

// Size variants — beds come in Twin/Full/Queen/King (operator example); footprint follows the variant.
ok(BED_VARIANTS.length === 4 && BED_VARIANTS.map((v) => v.id).join() === "twin,full,queen,king", "bed variants = twin,full,queen,king");
ok(VARIANTS.bed && !VARIANTS.sofa, "only kinds with sizes have variants (bed yes, sofa no)");
let bo = placeObject([], "bed", 4, 4);
ok(footprintOf(bo[0]).w === OBJECT_SPEC.bed.w, "no variant → kind-default footprint");
bo = cycleVariant(bo, "bed-1"); ok(bo[0].variant === "twin", "first cycle → twin (index 0)");
bo = cycleVariant(bo, "bed-1"); ok(bo[0].variant === "full", "next cycle → full");
const king = { id: "bed-9", kind: "bed", gx: 0, gy: 0, rot: 0, variant: "king" };
ok(footprintOf(king).w === 6.33 && footprintOf(king).d === 6.67, "king footprint = 6.33 × 6.67 ft");
ok(cycleVariant(placeObject([], "sofa", 1, 1), "sofa-1")[0].variant === undefined, "cycleVariant no-op for kinds without variants");

// S1 — wall detection + slide-along-wall (doors/windows slide, never jump off their wall).
ok(wallOf(4, 0) === "N" && wallOf(4, 9) === "S" && wallOf(0, 4) === "W" && wallOf(9, 4) === "E", "wallOf: N/S/W/E edges");
ok(wallOf(2, 3) === "W", "wallOf interior nearest-edge → W (left dist 2 < top dist 3)");
ok(wallOf(3, 1) === "N", "wallOf interior nearest-edge → N (top dist 1 < left dist 3)");
// Deterministic corner resolution (Enki): (0,0) equidistant to N & W → priority N > S > W > E picks N.
ok(wallOf(0, 0) === "N" && wallOf(9, 0) === "N" && wallOf(0, 9) === "S" && wallOf(9, 9) === "S", "wallOf corners resolve deterministically (N/S win ties)");
// slideAlongWall pins the perpendicular axis and clamps the along axis to 0..9.
ok(slideAlongWall("N", 5, 8).gx === 5 && slideAlongWall("N", 5, 8).gy === 0, "slide N: pins gy=0, keeps gx");
ok(slideAlongWall("S", 3, 1).gx === 3 && slideAlongWall("S", 3, 1).gy === ROOM_GRID - 1, "slide S: pins gy=9, keeps gx");
ok(slideAlongWall("W", 7, 6).gx === 0 && slideAlongWall("W", 7, 6).gy === 6, "slide W: pins gx=0, keeps gy");
ok(slideAlongWall("E", 2, 4).gx === ROOM_GRID - 1 && slideAlongWall("E", 2, 4).gy === 4, "slide E: pins gx=9, keeps gy");
ok(slideAlongWall("N", 42, 0).gx === ROOM_GRID - 1 && slideAlongWall("N", -5, 0).gx === 0, "slide clamps the along-axis to 0..9");
// A door on the N wall stays on N when dragged sideways (the S1 behavior).
ok(wallOf(slideAlongWall("N", 8, 3).gx, slideAlongWall("N", 8, 3).gy) === "N", "slid door stays on its wall (N→N)");

// Immutability — originals never mutated.
ok(a.length === 1, "place did not mutate the source array");

console.log(`\nROOM-OBJECTS ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
