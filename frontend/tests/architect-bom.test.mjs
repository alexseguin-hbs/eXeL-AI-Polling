// ARCHITECT-BOM lock (FIX-10) — the bill of materials is pure, deterministic, and its quantities EQUAL the live
// mep-runs totals + object counts (quotable). Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/architect-bom.test.mjs
import { roomBom } from "../lib/architect-bom.ts";
import { waterRuns, sewerRuns, electricSpecs, ductRuns } from "../lib/mep-runs.ts";
import { placeObject } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

// Build a small room: sink + toilet (plumbing), a bed + a door + a window.
let objs = [];
objs = placeObject(objs, "sink", 1, 8);
objs = placeObject(objs, "toilet", 3, 8);
objs = placeObject(objs, "bed", 5, 5);
objs = placeObject(objs, "door", 5, 9);
objs = placeObject(objs, "window", 4, 0);
const OUTLETS = 4;
const bom = roomBom(objs, OUTLETS);
const line = (id) => bom.lines.find((l) => l.id === id);

// MEP quantities EQUAL the live libs (quotable = the same numbers the designer shows).
ok(line("water-pipe").qty === waterRuns(objs).totalFt && line("water-pipe").unit === "ft", "water pipe qty == waterRuns total, in ft");
ok(line("sewer-pipe").qty === sewerRuns(objs).totalFt, "sewer pipe qty == sewerRuns total");
ok(line("wire").qty === electricSpecs(OUTLETS).wireFt, "wire qty == electricSpecs wireFt");
ok(line("outlet").qty === 4 && line("outlet").unit === "ea", "outlet line = 4 ea");
ok(line("breaker").qty === electricSpecs(OUTLETS).circuits, "breaker qty == circuits");
ok(line("duct").qty === ductRuns().totalFt, "duct qty == ductRuns total");

// Object counts + categories.
ok(line("obj-bed").qty === 1 && line("obj-bed").category === "Furniture", "bed → 1 ea Furniture");
ok(line("obj-door").category === "Openings" && line("obj-window").category === "Openings", "door/window → Openings");

// A second bed increments the count.
const bom2 = roomBom(placeObject(objs, "bed", 2, 2), OUTLETS);
ok(bom2.lines.find((l) => l.id === "obj-bed").qty === 2, "second bed → qty 2 (counted)");

// No outlets → no wire/outlet/breaker lines.
const bom0 = roomBom(objs, 0);
ok(!bom0.lines.some((l) => l.id === "wire" || l.id === "outlet" || l.id === "breaker"), "0 outlets → no electrical qty lines");

// Totals + determinism.
ok(bom.totalLineItems === bom.lines.length && bom.totalUnits.ft > 0 && bom.totalUnits.ea > 0, "totals: line count + ft/ea sums");
ok(JSON.stringify(roomBom(objs, OUTLETS)) === JSON.stringify(bom), "roomBom is deterministic (replay-safe, quotable)");
ok(bom.lines.every((l) => l.qty > 0 && (l.unit === "ft" || l.unit === "ea")), "every BOM line has a positive qty + valid unit");

console.log(`\nARCHITECT-BOM ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
