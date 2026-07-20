// DIM-ANNOT lock (S5) — CAD dimension callouts are pure + deterministic, with EXACT feet-inch strings and
// standard R.O./O.C./AFF nomenclature. Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/dim-annot.test.mjs
import { ftIn, annotateObject, chainDims, ROOM_FT } from "../lib/dim-annot.ts";
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
ok(da.lines[0].label === `4'-6" O.C.` && da.lines[0].edit === "oc", "door O.C. label = 4'-6\" O.C., tappable (edit:oc)");
ok(da.notes[0].text === `R.O. 3'-0" × 6'-8"` && da.notes[0].edit === "size", "door R.O. note = 3'-0\" × 6'-8\", tappable (edit:size)");
ok(!da.notes.some((n) => n.text.includes("AFF")), "door has no SILL AFF note");

// ── window adds a SILL AFF note (not editable) ──
const win = { id: "window-1", kind: "window", gx: 2, gy: 0, rot: 0 };
const wa = annotateObject(win, OBJECT_SPEC.window, footprintOf(win));
const sill = wa.notes.find((n) => n.text === `SILL 3'-0" AFF`);
ok(sill && !sill.edit, "window adds SILL 3'-0\" AFF (not tappable)");
ok(wa.notes[0].text === `R.O. 3'-0" × 4'-0"`, "window R.O. = 3'-0\" × 4'-0\"");

// ── wall selection per side (W/E/S) pins the correct axis ──
ok(annotateObject({ id: "d", kind: "door", gx: 0, gy: 5, rot: 0 }, OBJECT_SPEC.door, footprintOf({ kind: "door" })).lines[0].x1 === 0.5, "door W wall: vertical dim inset from left");
ok(annotateObject({ id: "d", kind: "door", gx: 9, gy: 5, rot: 0 }, OBJECT_SPEC.door, footprintOf({ kind: "door" })).lines[0].x1 === ROOM_FT - 0.5, "door E wall: vertical dim inset from right");
ok(annotateObject({ id: "d", kind: "door", gx: 5, gy: 9, rot: 0 }, OBJECT_SPEC.door, footprintOf({ kind: "door" })).lines[0].y1 === ROOM_FT - 0.5, "door S wall: horizontal dim inset from bottom");

// ── free furniture → W×D size line + note (no R.O.) ──
const bed = { id: "bed-1", kind: "bed", gx: 3, gy: 3, rot: 0 };
const ba = annotateObject(bed, OBJECT_SPEC.bed, footprintOf(bed));
ok(ba.notes[0].text === `5'-0" × 6'-0"` && ba.notes[0].edit === "size", "bed size note = 5'-0\" × 6'-0\", tappable (edit:size)");
ok(!ba.notes.some((n) => n.text.includes("R.O.")), "furniture has no R.O. note");
ok(ba.lines[0].label === `5'-0"`, "furniture width dim label = 5'-0\"");

// ── FIX-5c chainDims — wall→near edge · object · far edge→wall, summing to the room, each editable ──
const cbed = { id: "bed-1", kind: "bed", gx: 3, gy: 3, rot: 0 };  // bed 5×6 centred cell 3 → cx 3.5
const cc = chainDims(cbed, OBJECT_SPEC.bed, footprintOf(cbed));
ok(cc.axis === "x" && cc.segs.length === 3, "chainDims: free furniture → X axis, 3 segments");
ok(cc.segs.map((s) => s.kind).join(",") === "gapNear,size,gapFar", "chain order: gapNear · size · gapFar");
ok(Math.abs(cc.segs[0].ft + cc.segs[1].ft + cc.segs[2].ft - ROOM_FT) < 1e-9, "chain segments sum to the room (10 ft)");
ok(Math.abs(cc.segs[1].ft - 5) < 1e-9 && Math.abs(cc.segs[0].ft - 1) < 1e-9 && Math.abs(cc.segs[2].ft - 4) < 1e-9, "bed at 3.5: near 1' · size 5' · far 4'");
ok(cc.segs[0].edit === "gapNear" && cc.segs[1].edit === "size" && cc.segs[2].edit === "gapFar", "each segment carries its edit tag");
const cwin = chainDims({ id: "w", kind: "window", gx: 0, gy: 4, rot: 0 }, OBJECT_SPEC.window, footprintOf({ kind: "window" }));
ok(cwin.axis === "y", "chainDims: W/E wall opening → Y axis (runs along its wall)");

// ── determinism ──
ok(JSON.stringify(annotateObject(door, OBJECT_SPEC.door, footprintOf(door))) === JSON.stringify(da), "annotateObject is deterministic");
ok(JSON.stringify(chainDims(cbed, OBJECT_SPEC.bed, footprintOf(cbed))) === JSON.stringify(cc), "chainDims is deterministic");

console.log(`\nDIM-ANNOT ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
