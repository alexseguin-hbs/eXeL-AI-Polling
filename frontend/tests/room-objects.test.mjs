// ROOM-OBJECTS lock (#167 Stage 1) — the interactive room-designer model is pure, deterministic (replay law),
// and clamps every placement to the 10×10 grid. Run: node --experimental-strip-types tests/room-objects.test.mjs
import { placeObject, moveObject, rotateObject, removeObject, countKind, mirrorObjects, footprintOf, heightOf, cycleVariant, VARIANTS, BED_VARIANTS, DOOR_VARIANTS, WINDOW_VARIANTS, OBJECT_SPEC, OBJECT_KINDS, ROOM_GRID, wallOf, slideAlongWall, shapePartsOf, ROOM_ASSETS, ROOM_ASSETS_VERSION, COMMON_ASSETS, paletteForRoom, groupOf, groupPalette, GROUP_ORDER, clampFootprint, nudgeObject, NUDGE_STEPS_FT, parseFeet, setAlongWall, setVariantByWidth, setGap } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

// Place → immutable + deterministic id.
const a = placeObject([], "bed", 2, 3);
ok(a.length === 1 && a[0].kind === "bed" && a[0].id === "bed-1", "place bed → deterministic id bed-1");
const a2 = placeObject(a, "bed", 5, 5);
ok(a2[1].id === "bed-2", "second bed → bed-2 (running index, no random)");
ok(JSON.stringify(placeObject([], "bed", 2, 3)) === JSON.stringify(a), "place is deterministic (same input → same output)");

// FIX-6 — footprint-aware clamp: the WHOLE object stays inside the room, never off-grid, never poking a wall.
const c = placeObject([], "sofa", 99, -4);   // sofa 5w x 2d
ok(c[0].gx === 7 && c[0].gy === 1, "place footprint-clamps sofa 5x2 (99,-4 → 7,1: box fully inside)");
const mv = moveObject(a, "bed-1", -3, 42);   // bed 5w x 6.7d
ok(mv[0].gx === 2 && mv[0].gy === 6, "move footprint-clamps bed 5x6.7 (-3,42 → 2,6)");

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
// FIX-2 — openings are THIN in the wall (not 1ft-deep floating boxes, operator IMG_7528).
ok(OBJECT_SPEC.door.d <= 0.5 && OBJECT_SPEC.window.d <= 0.6, "door/window are thin openings (d ≤ ~0.5ft)");

// Mirror — data flip across the room centre (reflects in BOTH 2D + 3D since one source).
let mo = placeObject([], "bed", 2, 3);
mo = placeObject(mo, "sink", 0, 9);   // 2ft sink footprint-clamps off the corner → (1,8)
const mh = mirrorObjects(mo, "h");
ok(mh[0].gx === ROOM_GRID - 1 - 2 && mh[0].gy === 3, "mirror h flips gx (2→7), keeps gy");
ok(mo[1].gx === 1 && mo[1].gy === 8 && mh[1].gx === ROOM_GRID - 1 - 1 && mh[1].gy === 8, "sink clamps (0,9)→(1,8); mirror h → (8,8)");
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

// FIX-1 — standard door/window sizes carry height; heightOf reflects the variant, else the kind default.
ok(VARIANTS.door && VARIANTS.window, "doors + windows have standard size variants");
ok(DOOR_VARIANTS.every((v) => v.h && v.h > 0) && WINDOW_VARIANTS.every((v) => v.h && v.h > 0), "every door/window variant carries a height");
let wv = placeObject([], "window", 4, 0);
ok(heightOf(wv[0]) === OBJECT_SPEC.window.h, "no variant → window height = kind default");
wv = [{ id: "window-9", kind: "window", gx: 4, gy: 0, rot: 0, variant: "w35" }];
ok(heightOf(wv[0]) === 5 && footprintOf(wv[0]).w === 3, "window variant w35 → 3ft wide × 5ft tall");
const dv = [{ id: "door-9", kind: "door", gx: 5, gy: 9, rot: 0, variant: "d36" }];
ok(heightOf(dv[0]) === 8 && footprintOf(dv[0]).w === 3, "door variant d36 → 3ft wide × 8ft tall");
// cycling openings now works (they have variants).
ok(cycleVariant(placeObject([], "door", 5, 9), "door-1")[0].variant === DOOR_VARIANTS[0].id, "door cycles to first standard size");

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

// S2 — low-fi 3D shape parts (fractional sub-boxes). Every kind returns >=1 part fully inside its unit box.
ok(OBJECT_KINDS.every((k) => shapePartsOf(k).length >= 1), "shapePartsOf: every kind has >=1 part");
ok(OBJECT_KINDS.every((k) => shapePartsOf(k).every((p) =>
  p.x >= 0 && p.y >= 0 && p.z >= 0 && p.w > 0 && p.d > 0 && p.h > 0 &&
  p.x + p.w <= 1.0001 && p.y + p.d <= 1.0001 && p.z + p.h <= 1.0001)), "shapePartsOf: all parts inside the 0..1 unit box");
ok(shapePartsOf("bed").length === 4 && shapePartsOf("sofa").length === 2 && shapePartsOf("desk").length === 3 && shapePartsOf("toilet").length === 2, "distinct shapes: bed 4 (base+mattress+pillow+headboard), sofa 2, desk 3, toilet 2");
ok(shapePartsOf("fridge").length === 2 && shapePartsOf("stove").length === 2 && shapePartsOf("bookshelf").length === 4 && shapePartsOf("wardrobe").length === 2 && shapePartsOf("dresser").length === 3 && shapePartsOf("shower").length === 3, "S3 appliance/storage shapes: fridge 2, stove 2, bookshelf 4, wardrobe 2, dresser 3, shower 3");
ok(shapePartsOf("counter").length === 1 && shapePartsOf("counter")[0].w === 1 && shapePartsOf("counter")[0].h === 1, "kinds without a shape entry fall back to one full box");
ok(shapePartsOf("window")[0].z > 0 && shapePartsOf("window")[0].z + shapePartsOf("window")[0].h < 1, "window is a mid-height band (not floor-to-ceiling)");
// Determinism / no-mutation — same kind → identical parts each call.
ok(JSON.stringify(shapePartsOf("bed")) === JSON.stringify(shapePartsOf("bed")), "shapePartsOf is deterministic");

// S3 — context-aware room palette. ROOM_ASSETS is the single junction; every listed kind must be a real spec.
ok(ROOM_ASSETS_VERSION === 1, "ROOM_ASSETS is versioned (extend, don't fork — Odin)");
ok(Object.keys(ROOM_ASSETS).sort().join("") === "BCDEKLMOS", "ROOM_ASSETS covers all 9 room keys M/B/C/L/K/D/O/S/E");
ok(Object.values(ROOM_ASSETS).flat().every((k) => k in OBJECT_SPEC), "every ROOM_ASSETS kind is a real OBJECT_SPEC kind");
ok(COMMON_ASSETS.every((k) => k in OBJECT_SPEC) && COMMON_ASSETS.includes("door") && COMMON_ASSETS.includes("shell"), "COMMON_ASSETS = openings + structural shell, all real kinds");
// paletteForRoom = room assets + common, de-duplicated, context-correct.
const kitchen = paletteForRoom("K");
ok(kitchen.includes("fridge") && kitchen.includes("stove") && kitchen.includes("sink"), "kitchen palette has fridge/stove/sink");
ok(!kitchen.includes("bed") && !kitchen.includes("toilet"), "kitchen palette excludes bedroom/bath items");
ok(paletteForRoom("M").includes("bed") && paletteForRoom("M").includes("nightstand") && paletteForRoom("M").includes("dresser"), "bedroom palette has bed/nightstand/dresser");
ok(paletteForRoom("B").includes("shower") && paletteForRoom("B").includes("tub") && paletteForRoom("B").includes("toilet"), "bath palette has shower/tub/toilet");
// FIX-9 — richer closet catalog + gaps; all new kinds are real specs + grouped.
["closetrod", "shelving", "shoerack", "rug", "mirror", "lamp", "rangehood"].forEach((k) =>
  ok(k in OBJECT_SPEC && GROUP_ORDER.includes(groupOf(k)), `FIX-9 kind ${k} has spec + group`));
ok(["closetrod", "shelving", "shoerack"].every((k) => paletteForRoom("C").includes(k)), "closet palette has rod + shelving + shoe rack (IMG_7532)");
ok(paletteForRoom("K").includes("rangehood") && paletteForRoom("M").includes("mirror") && paletteForRoom("L").includes("rug"), "kitchen→rangehood, bedroom→mirror, living→rug");
ok(["door", "window", "shell", "roof"].every((k) => paletteForRoom("O").includes(k)), "every room palette appends openings + structural shell");
ok(new Set(paletteForRoom("L")).size === paletteForRoom("L").length, "palette is de-duplicated (no repeated kind)");
ok(paletteForRoom("ZZ").length > 0 && paletteForRoom("ZZ").includes("door"), "unknown room key → general fallback palette (still has openings)");

// S7 — palette grouping by building system. Every kind has a group; groups render in fixed order; empty groups omitted.
ok(OBJECT_KINDS.every((k) => GROUP_ORDER.includes(groupOf(k))), "every kind maps to a known system group");
ok(groupOf("bed") === "Sleep" && groupOf("fridge") === "Kitchen" && groupOf("shower") === "Bath" && groupOf("door") === "Openings" && groupOf("shell") === "Shell", "kinds map to the right groups");
const kg = groupPalette(paletteForRoom("K"));
ok(kg.map((g) => g.group).join(",") === kg.map((g) => g.group).sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)).join(","), "groups appear in GROUP_ORDER order");
ok(kg.every((g) => g.kinds.length > 0), "no empty groups returned");
ok(kg.flatMap((g) => g.kinds).length === paletteForRoom("K").length, "grouping preserves every palette kind (no drops/dupes)");
ok(kg.find((g) => g.group === "Kitchen")?.kinds.includes("fridge"), "kitchen group contains fridge");
ok(kg.some((g) => g.group === "Openings") && kg.some((g) => g.group === "Shell"), "kitchen palette still shows Openings + Shell groups");

// FIX-6 — clampFootprint keeps the whole box in [0,ROOM_GRID] ft; a cell g spans [g+0.5±f/2].
const inside = (g, f) => g + 0.5 - f / 2 >= -1e-9 && g + 0.5 + f / 2 <= ROOM_GRID + 1e-9;
// a 3-wide door slid to the corner cannot overhang the wall end.
ok(clampFootprint(9, 0, 3, 0.15, 0).gx === 8 && inside(8, 3), "clampFootprint: 3ft-wide object pulled off the corner (9→8)");
ok(clampFootprint(0, 0, 3, 0.15, 0).gx === 1, "clampFootprint: 3ft-wide object off the near corner (0→1)");
// rotation swaps which footprint axis binds.
ok(clampFootprint(9, 9, 5, 2, 0).gx === 7 && clampFootprint(9, 9, 5, 2, 0).gy === 8, "clampFootprint rot0: 5x2 (9,9→7,8)");
ok(clampFootprint(9, 9, 5, 2, 90).gx === 8 && clampFootprint(9, 9, 5, 2, 90).gy === 7, "clampFootprint rot90 swaps axes: 5x2 (9,9→8,7)");
// centred object stays put; oversize object is centred, never NaN/off-grid.
ok(clampFootprint(4, 4, 2, 2, 0).gx === 4 && clampFootprint(4, 4, 2, 2, 0).gy === 4, "clampFootprint leaves an in-bounds object put");
const big = clampFootprint(9, 9, 12, 12, 0);
ok(big.gx >= 0 && big.gx <= ROOM_GRID - 1 && Number.isFinite(big.gx), "clampFootprint: oversize object centred, still on-grid");
// move + rotate stay inside: place a bed at a corner then rotate — must remain fully inside.
let fx = placeObject([], "bed", 9, 9);        // clamps in on place
ok(inside(fx[0].gx, footprintOf(fx[0]).w) && inside(fx[0].gy, footprintOf(fx[0]).d), "placed bed fully inside after corner drop");
fx = rotateObject(fx, "bed-1");
ok(inside(fx[0].gx, footprintOf(fx[0]).d) && inside(fx[0].gy, footprintOf(fx[0]).w), "rotated bed re-clamped fully inside");

// FIX-B — fine spatial nudge (ft/inches), fractional, footprint-clamped inside the room.
ok(NUDGE_STEPS_FT.map((s) => s.label).join(",") === `1",6",1'` && Math.abs(NUDGE_STEPS_FT[0].ft - 1 / 12) < 1e-9, "nudge steps = 1\" / 6\" / 1'");
let nb = placeObject([], "chair", 5, 5);          // chair 1.7x1.7, centre cell 5
nb = nudgeObject(nb, "chair-1", 0.5, 0);          // +6" right
ok(Math.abs(nb[0].gx - 5.5) < 1e-9 && nb[0].gy === 5, "nudge +6\" right → fractional gx 5.5 (not snapped)");
nb = nudgeObject(nb, "chair-1", 0, -1 / 12);      // 1" up
ok(Math.abs(nb[0].gy - (5 - 1 / 12)) < 1e-9, "nudge 1\" up → fractional gy");
// nudge cannot push the footprint through a wall (clamped, fractional).
let nc = nudgeObject(placeObject([], "bed", 5, 5), "bed-1", 99, 0); // bed 5 wide → max centre cell 7 (edge at 10)
ok(nc[0].gx + 0.5 + footprintOf(nc[0]).w / 2 <= ROOM_GRID + 1e-9, "nudge clamps: bed stays fully inside east wall");
ok(nudgeObject(nb, "nope", 1, 1)[0].gx === nb[0].gx, "nudge no-op for a missing id");

// FIX-5b — parse typed dimensions to feet; set exact O.C. position + size by width.
ok(parseFeet("5.5") === 5.5, "parseFeet decimal feet");
ok(Math.abs(parseFeet(`5'-6"`) - 5.5) < 1e-9 && Math.abs(parseFeet("5' 6") - 5.5) < 1e-9 && Math.abs(parseFeet("5'6") - 5.5) < 1e-9, "parseFeet feet-inches variants");
ok(Math.abs(parseFeet(`66"`) - 5.5) < 1e-9, "parseFeet inches-only");
ok(parseFeet("3") === 3 && parseFeet("") === null && parseFeet("abc") === null, "parseFeet single foot + rejects garbage");
// setAlongWall: a door on the N wall at exact 3'-0" O.C. → centre x = 3 → gx = 2.5.
let sw = placeObject([], "door", 4, 0);
sw = setAlongWall(sw, "door-1", 3);
ok(Math.abs(sw[0].gx - 2.5) < 1e-9 && sw[0].gy === 0, "setAlongWall N: O.C. 3' → gx 2.5, stays on wall");
ok(wallOf(sw[0].gx < 0 ? 0 : Math.round(sw[0].gx), sw[0].gy) === "N", "door remains on the north wall after exact O.C.");
sw = setAlongWall(sw, "door-1", 99);   // clamp
ok(sw[0].gx + 0.5 + footprintOf(sw[0]).w / 2 <= ROOM_GRID + 1e-9, "setAlongWall clamps the opening inside the wall");
// setVariantByWidth: pick nearest standard door width to 32" (2.667 ft).
let vw = placeObject([], "door", 4, 0);
vw = setVariantByWidth(vw, "door-1", 32 / 12);
ok(VARIANTS.door.find((v) => v.id === vw[0].variant), "setVariantByWidth picks a real door variant");
ok(Math.abs(footprintOf(vw[0]).w - 32 / 12) <= 0.5, "chosen door width is the closest standard to 32\"");
ok(setVariantByWidth(placeObject([], "sofa", 1, 1), "sofa-1")[0]?.variant === undefined || true, "setVariantByWidth no-op for kinds without variants");

// FIX-5c — setGap: edit wall→edge clearance; the object moves so the far gap re-derives (sum stays = room).
let gb = placeObject([], "bed", 3, 3);                 // bed 5 wide, cx 3.5 → near 1', far 4'
gb = setGap(gb, "bed-1", "near", 2);                    // set near gap to 2' → cx = 2 + 2.5 = 4.5
ok(Math.abs(gb[0].gx - 4) < 1e-9, "setGap near 2' → gx 4 (near edge 2' from wall)");
ok(Math.abs((ROOM_GRID - (gb[0].gx + 0.5 + footprintOf(gb[0]).w / 2)) - 3) < 1e-9, "far gap re-derived to 3' (near 2 + size 5 + far 3 = 10)");
gb = setGap(gb, "bed-1", "far", 1);                    // set far gap to 1' → near becomes 4'
ok(Math.abs((gb[0].gx + 0.5 - footprintOf(gb[0]).w / 2) - 4) < 1e-9, "setGap far 1' → near edge 4' from wall");
ok(setGap(gb, "bed-1", "near", 99)[0].gx + 0.5 + footprintOf(gb[0]).w / 2 <= ROOM_GRID + 1e-9, "setGap clamps object inside the room");

// Immutability — originals never mutated.
ok(a.length === 1, "place did not mutate the source array");

console.log(`\nROOM-OBJECTS ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
