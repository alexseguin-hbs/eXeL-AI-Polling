// ARCHITECT-2525 · WALK MEP ROOM-CORRECTNESS gate (rewalk2 P0, MoT: "PLUMBING RENDERS IN THE WRONG ROOMS"). The existing
// gates counted PRESENCE, not correct-ROOM — that gap let a neighbour-bleed ship where dry rooms showed a wet neighbour's
// service. This gate asserts, for EACH of the 9 rooms by its real kind, the EXPECTED plumbing/sewer/HVAC presence: wet rooms
// draw their OWN fixtures; the house service (MAIN+manifold+water-heater+DWV stack+cleanout+VTR) + the air handler draw ONLY
// in the utility room (kind S); every DRY room draws NOTHING in plumbing/sewer. walkMep is pure → eye-independent, so this
// cannot be fooled by what happens to be in the camera frustum.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-walk-mep-rooms.test.mjs
import { walkMep } from "../lib/architect-walk-mep.ts";
import { defaultObjectsForRoom } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const KINDS = ["M", "B", "C", "L", "K", "D", "O", "S", "E"]; // the 9 rooms (bedroom bath closet living kitchen dining office storage entry)
const WET = new Set(["B", "K", "S"]);        // rooms with water fixtures
const DRY = new Set(["M", "C", "L", "D", "O", "E"]);
const SERVICE = "S";                          // the ONE utility room that holds the house service + air handler
const gk = (g) => { const m = {}; for (const x of g.glyphs) m[x.kind] = (m[x.kind] || 0) + 1; return m; };
// P0·E (Revision A · Wave 0, MoT 2026-11-07): a dry room draws NOTHING in EVERY array-valued field of the walkMep result —
// lines · sublines · glyphs · boxes today, and any future solids/quads/faces. Iterating Object.keys (not naming three fields)
// means a new field can never let a dry room draw solid bodies while this gate stays green. `drawn` keeps the shipped
// wet-room presence check exactly as it was.
const drawnFields = (w) => Object.keys(w).filter((k) => Array.isArray(w[k]) && w[k].length > 0);
const empty = (w) => drawnFields(w).length === 0;
const drawn = (w) => w.lines.length > 0 || w.sublines.length > 0 || w.glyphs.length > 0;

for (const k of KINDS) {
  const objs = defaultObjectsForRoom(k);
  const wa = walkMep("water", 6, objs, 0, 0, k), se = walkMep("sewer", 6, objs, 0, 0, k), du = walkMep("duct", 0, objs, 0, 0, k);
  const g = gk(wa), sg = gk(se);
  // ── service equipment (MAIN valve + PEX manifold + water heater · DWV cleanout + VTR) ONLY in the utility room ──
  if (k === SERVICE) {
    ok((g.valve || 0) === 1 && (g.manifold || 0) === 1 && (g.heater || 0) === 1, `utility room (${k}) draws the house WATER service (MAIN+manifold+WH) once`);
    ok((g.laundrybox || 0) === 1, `utility room (${k}) draws the laundry box`);
    ok((sg.cleanout || 0) === 1 && (sg.vent || 0) === 1, `utility room (${k}) draws the DWV stack cleanout + VTR once`);
  } else {
    ok(!g.valve && !g.manifold && !g.heater && !g.laundrybox, `${k} draws NO house water service (no MAIN/manifold/WH/laundrybox — that lives only in the utility room)`);
    ok(!sg.cleanout && !sg.vent, `${k} draws NO DWV stack cleanout/VTR (the house stack is in the utility room)`);
  }
  // ── wet rooms draw their own fixtures; dry rooms draw NOTHING in plumbing/sewer ──
  if (DRY.has(k)) {
    ok(empty(wa), `DRY ${k} draws NOTHING in plumbing (EVERY array field empty — drew: ${drawnFields(wa).join(",") || "—"})`);
    ok(empty(se), `DRY ${k} draws NOTHING in sewer (EVERY array field empty — drew: ${drawnFields(se).join(",") || "—"})`);
  } else {
    ok(drawn(wa), `WET ${k} draws its own water fixtures (non-empty)`);
    ok(se.lines.length > 0, `WET ${k} draws its own drain runs`);
  }
  // ── HVAC: the air handler renders ONLY in the utility room; every room still gets its own register ──
  const dg = gk(du);
  ok((dg.ahu || 0) === (k === SERVICE ? 1 : 0), `${k} air handler = ${k === SERVICE ? 1 : 0} (only the utility room, not office/entry)`);
  ok((dg.register || 0) >= 1, `${k} gets its own ceiling register`);
}

// ── the every-array check is not vacuous: the result carries the four shipped array fields (a renamed/removed field surfaces here) ──
const shape = walkMep("water", 0, [], 0, 0, "M");
ok(["lines", "sublines", "glyphs", "boxes"].every((f) => Array.isArray(shape[f])), "walkMep returns lines/sublines/glyphs/boxes arrays (the fields the dry-room every-array check iterates — plus any future solids/quads/faces)");
ok(Object.keys(shape).filter((f) => Array.isArray(shape[f])).length >= 4, `the dry-room check iterates ≥4 array fields (got ${Object.keys(shape).filter((f) => Array.isArray(shape[f])).join(",")})`);

// ── fixture specifics: the bath serves tub/shower/sink/toilet; the kitchen its sink; the utility its washer+sink ──
ok((gk(walkMep("water", 6, defaultObjectsForRoom("B"), 0, 0, "B")).mixer || 0) === 2, "the bath serves the tub + shower (2 mixing valves)");
ok((gk(walkMep("sewer", 6, defaultObjectsForRoom("B"), 0, 0, "B")).flange || 0) === 1, "the bath's toilet drains through a closet flange");
ok((gk(walkMep("water", 6, defaultObjectsForRoom("K"), 0, 0, "K")).stop || 0) >= 1, "the kitchen serves its sink");
ok((gk(walkMep("water", 6, defaultObjectsForRoom("D"), 0, 0, "D")).stop || 0) === 0, "the dining room (counter, no sink) draws NO plumbing (counter is dry)");

console.log(`\nARCHITECT-WALK-MEP-ROOMS ${pass}/${pass + fail} passed · per-room correctness · wet own · service+AHU only in utility · dry rooms empty in EVERY array field`);
if (fail > 0) process.exit(1);
