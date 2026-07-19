// MEP-RUNS lock (P2) — the Design-Settings mechanical/electrical/plumbing model is pure, deterministic
// (replay law), and its route lengths are reproducible so the render + the sub-menu totals agree.
// Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/mep-runs.test.mjs
import {
  MEP_GRID, MEP_SOURCE, routeManhattan, pathLengthFt, runsToEndpoints, fixtureEndpoints,
  waterRuns, sewerRuns, outletPositions, wiringRuns, electricSpecs, ductRuns,
} from "../lib/mep-runs.ts";
import { placeObject } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

// Grid + sources.
ok(MEP_GRID === 10, "MEP_GRID = 10 (1 cell = 1 ft, matches ROOM_GRID)");
ok(MEP_SOURCE.water.gx === 0 && MEP_SOURCE.water.gy === 0, "water source anchored NW (0,0)");
ok(MEP_SOURCE.sewer.gx === 9 && MEP_SOURCE.sewer.gy === 9, "sewer stack anchored SE (9,9)");
ok(MEP_SOURCE.panel.gx === 0 && MEP_SOURCE.panel.gy === 9, "electric panel anchored SW (0,9)");
ok(MEP_SOURCE.air.gx === 9 && MEP_SOURCE.air.gy === 0, "air handler anchored NE (9,0)");

// Manhattan L-route: horizontal leg then vertical leg; length = |dx| + |dy|.
const p = routeManhattan({ gx: 0, gy: 0 }, { gx: 3, gy: 4 });
ok(p.length === 3 && p[0].gx === 0 && p[1].gx === 3 && p[1].gy === 0 && p[2].gy === 4, "route = [start, corner, end] (H then V)");
ok(pathLengthFt(p) === 7, "path length = |dx|+|dy| = 3+4 = 7 ft");
ok(pathLengthFt(routeManhattan({ gx: 2, gy: 2 }, { gx: 2, gy: 2 })) === 0, "same cell → 0 ft, no phantom leg");
ok(routeManhattan({ gx: 2, gy: 2 }, { gx: 2, gy: 2 }).length === 1, "same cell → single-point path");

// Clamp off-grid endpoints (Enki: never route off the room).
const pc = routeManhattan({ gx: -5, gy: 0 }, { gx: 99, gy: 4 });
ok(pc[0].gx === 0 && pc[pc.length - 1].gx === 9, "route clamps endpoints to 0..9");

// Determinism — identical input → identical routes/totals.
const eps = [{ gx: 1, gy: 1 }, { gx: 8, gy: 6 }];
ok(JSON.stringify(runsToEndpoints(MEP_SOURCE.water, eps)) === JSON.stringify(runsToEndpoints(MEP_SOURCE.water, eps)), "runsToEndpoints is deterministic");

// Fixture endpoints — only water/drain kinds, deduped by cell, stable order.
let objs = placeObject([], "sink", 3, 3);
objs = placeObject(objs, "tub", 6, 2);
objs = placeObject(objs, "bed", 5, 5);        // not a fixture → ignored
objs = placeObject(objs, "sink", 3, 3);        // duplicate cell → deduped
const fe = fixtureEndpoints(objs, ["sink", "tub", "toilet", "washer", "counter"]);
ok(fe.length === 2, "fixtureEndpoints ignores non-fixtures + dedups same cell (2 unique)");

// Water runs — one run per fixture, total = sum of route lengths.
const wr = waterRuns(objs);
ok(wr.runs.length === 2, "waterRuns: one run per water fixture");
ok(wr.totalFt === pathLengthFt(routeManhattan(MEP_SOURCE.water, { gx: 3, gy: 3 })) + pathLengthFt(routeManhattan(MEP_SOURCE.water, { gx: 6, gy: 2 })), "waterRuns total = Σ per-fixture route length");
ok(wr.totalFt === 6 + 8, "waterRuns total ft = 6 (→3,3) + 8 (→6,2) = 14");

// Sewer runs — from each drain fixture to the SE stack (reverse direction, same lengths from symmetry differ).
const sr = sewerRuns(objs);
ok(sr.runs.length === 2 && sr.runs[0].to.gx === 9 && sr.runs[0].to.gy === 9, "sewerRuns drain → SE stack");
ok(sr.totalFt === (pathLengthFt(routeManhattan({ gx: 3, gy: 3 }, MEP_SOURCE.sewer)) + pathLengthFt(routeManhattan({ gx: 6, gy: 2 }, MEP_SOURCE.sewer))), "sewerRuns total = Σ drain→stack");

// Empty fixture set → 0 runs, 0 ft (graceful).
ok(waterRuns([]).runs.length === 0 && waterRuns([]).totalFt === 0, "no fixtures → no water runs, 0 ft");

// Outlets — deterministic perimeter placement; count clamped; all on the perimeter.
ok(outletPositions(0).length === 0, "0 outlets → none");
const op4 = outletPositions(4);
ok(op4.length === 4, "4 outlets → 4 positions");
ok(op4.every((o) => o.gx === 0 || o.gx === 9 || o.gy === 0 || o.gy === 9), "outlets all sit on the perimeter");
ok(JSON.stringify(outletPositions(6)) === JSON.stringify(outletPositions(6)), "outletPositions deterministic");
ok(outletPositions(999).length === 24, "outlet count clamped to 24");

// Wiring runs from the panel to each outlet.
const wire = wiringRuns(4);
ok(wire.runs.length === 4 && wire.runs.every((r) => r.from.gx === 0 && r.from.gy === 9), "wiringRuns from panel (0,9) to each outlet");

// Electric specs — wire ft matches wiringRuns, circuits cap 8/circuit, amps = 15/circuit.
const es = electricSpecs(4);
ok(es.wireFt === wiringRuns(4).totalFt, "electricSpecs wireFt == wiringRuns total (one source)");
ok(electricSpecs(0).circuits === 0 && electricSpecs(0).amps === 0, "0 outlets → 0 circuits, 0 amps");
ok(electricSpecs(8).circuits === 1 && electricSpecs(8).amps === 15, "8 outlets → 1 circuit @ 15A");
ok(electricSpecs(9).circuits === 2 && electricSpecs(9).amps === 30, "9 outlets → 2 circuits @ 30A (cap 8/circuit)");

// Duct — single centre register from the air handler.
const dr = ductRuns();
ok(dr.runs.length === 1 && dr.runs[0].to.gx === 5 && dr.runs[0].to.gy === 5, "ductRuns → centre register (5,5)");
ok(dr.totalFt === pathLengthFt(routeManhattan(MEP_SOURCE.air, { gx: 5, gy: 5 })), "duct total = air→centre length");

console.log(`\nMEP-RUNS ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
