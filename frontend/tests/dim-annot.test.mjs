// DIM-ANNOT lock (S5) — CAD dimension callouts are pure + deterministic, with EXACT feet-inch strings and
// standard R.O./O.C./AFF nomenclature. Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/dim-annot.test.mjs
import { ftIn, annotateObject, ROOM_FT } from "../lib/dim-annot.ts";
import { OBJECT_SPEC, footprintOf } from "../lib/room-objects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

// ── ftIn — EXACT feet-inch strings, inches rounded to nearest (Thoth: pinned) ──
ok(ftIn(3) === `3'-0"`, "ftIn(3) = 3'-0\"");
ok(ftIn(6.7) === `6'-8"`, "ftIn(6.7) = 6'-8\" (0.7ft = 8.4in → 8in)");
ok(ftIn(3.25) === `3'-3"`, "ftIn(3.25) = 3'-3\"");
ok(ftIn(4.5) === `4'-6"`, "ftIn(4.5) = 4'-6\"");
ok(ftIn(0) === `0'-0"`, "ftIn(0) = 0'-0\"");
ok(ftIn(-5) === `0'-0"`, "ftIn clamps negatives to 0'-0\"");
ok(ftIn(6.33) === `6'-4"`, "ftIn(6.33) = 6'-4\" (king bed width)");

// ── door on N wall at gx=4 → ON-CENTER dim + R.O. size note ──
const door = { id: "door-1", kind: "door", gx: 4, gy: 0, rot: 0 };
const da = annotateObject(door, OBJECT_SPEC.door, footprintOf(door));
ok(da.lines.length === 1 && da.lines[0].y1 === 0.5 && da.lines[0].x2 === 4.5, "door N: O.C. witness line along the top wall to centre 4.5ft");
ok(da.lines[0].label === `4'-6" O.C.`, "door O.C. label = 4'-6\" O.C. (centre of gx=4 cell)");
ok(da.notes[0] === `R.O. 3'-0" × 6'-8"`, "door R.O. note = 3'-0\" × 6'-8\" (6.7ft header)");
ok(!da.notes.some((n) => n.includes("AFF")), "door has no SILL AFF note");

// ── window adds a SILL AFF note ──
const win = { id: "window-1", kind: "window", gx: 2, gy: 0, rot: 0 };
const wa = annotateObject(win, OBJECT_SPEC.window, footprintOf(win));
ok(wa.notes.some((n) => n === `SILL 3'-0" AFF`), "window adds SILL 3'-0\" AFF");
ok(wa.notes[0] === `R.O. 3'-0" × 4'-0"`, "window R.O. = 3'-0\" × 4'-0\"");

// ── wall selection per side (W/E/S) pins the correct axis ──
ok(annotateObject({ id: "d", kind: "door", gx: 0, gy: 5, rot: 0 }, OBJECT_SPEC.door, footprintOf({ kind: "door" })).lines[0].x1 === 0.5, "door W wall: vertical dim inset from left");
ok(annotateObject({ id: "d", kind: "door", gx: 9, gy: 5, rot: 0 }, OBJECT_SPEC.door, footprintOf({ kind: "door" })).lines[0].x1 === ROOM_FT - 0.5, "door E wall: vertical dim inset from right");
ok(annotateObject({ id: "d", kind: "door", gx: 5, gy: 9, rot: 0 }, OBJECT_SPEC.door, footprintOf({ kind: "door" })).lines[0].y1 === ROOM_FT - 0.5, "door S wall: horizontal dim inset from bottom");

// ── free furniture → W×D size line + note (no R.O.) ──
const bed = { id: "bed-1", kind: "bed", gx: 3, gy: 3, rot: 0 };
const ba = annotateObject(bed, OBJECT_SPEC.bed, footprintOf(bed));
ok(ba.notes[0] === `5'-0" × 6'-0"`, "bed size note = 5'-0\" × 6'-0\"");
ok(!ba.notes.some((n) => n.includes("R.O.")), "furniture has no R.O. note");
ok(ba.lines[0].label === `5'-0"`, "furniture width dim label = 5'-0\"");

// ── determinism ──
ok(JSON.stringify(annotateObject(door, OBJECT_SPEC.door, footprintOf(door))) === JSON.stringify(da), "annotateObject is deterministic");

console.log(`\nDIM-ANNOT ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
