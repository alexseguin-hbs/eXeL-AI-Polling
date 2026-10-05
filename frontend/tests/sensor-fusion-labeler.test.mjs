// One picture holds many boxes (PLAN R3; rev 42). SAVE BOX adds a box. Only Fix replaces one (rev 38).
// Before this, every SAVE BOX after the first rewrote box 1: three saves left one row.
// Run: node --experimental-strip-types tests/sensor-fusion-labeler.test.mjs

import fs from "node:fs";
import path from "node:path";
import { START_BOX, placeBox, refuseBox } from "../app/SensorFusion-2525/sf.ts";

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

// Three SAVE BOX presses with no Fix give three boxes.
let list = [];
for (const [id, name] of [["a", "person"], ["b", "dog"], ["c", "bicycle"]]) list = placeBox(list, { id, name }, "");
ok(list.length === 3 && list.map((item) => item.name).join(",") === "person,dog,bicycle", "three saves give three boxes");

// Fix on box 2, then SAVE BOX: box 2 changes, nothing is added.
const fixed = placeBox(list, { id: "b", name: "cat" }, "b");
ok(fixed.length === 3 && fixed[1].name === "cat" && fixed[0].name === "person" && fixed[2].name === "bicycle", "a fix updates the same box");

// A Fix id that no longer exists (the box was rejected) adds instead of losing the box.
ok(placeBox(list, { id: "z", name: "car" }, "gone").length === 4, "a stale fix id never drops the new box");

// The page wires it so: after a save, the next SAVE BOX is a new box.
const src = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
const save = /async function saveBox\(\) \{([\s\S]*?)\n  \}\n/.exec(src)?.[1] || "";
ok(/const list = placeBox\(prior, mark, editing\);/.test(save), "SAVE BOX uses placeBox");
ok(/setEditing\(""\);/.test(save), "after a save, the movable box is a new one");
ok(!/if \(!editing\) setEditing\(mark\.id\)/.test(save), "a save no longer locks every later save onto the same box");
ok(/Next: another box, or LEVEL 2 by a second person\./.test(save), "the save note names the next step");
ok(!/Saved \$\{where\}`\)/.test(save) || /chosenFolder \?/.test(save), "the save note says 'kept on this device' when no folder was written");
const load = /useEffect\(\(\) => \{\n    if \(!pic\) return;([\s\S]*?)\}, \[picId\]\);/.exec(src)?.[1] || "";
ok(load && !/setEditing\(first\.id\)/.test(load), "opening a picture does not put SAVE BOX onto its first saved box");
ok(/function fixBox\(mark: Mark\) \{\n    setEditing\(mark\.id\);/.test(src), "Fix still opens a saved box for change");

// rev 43 — SAVE BOX refuses a box that is already there (Asar, Pangu: six taps gave six identical boxes on the sky).
const box = (id, name, left, top, right, bottom) => ({ id, name, left, top, right, bottom });
const moved = box("m1", "person", 8, 47, 18, 80);
let saved = [];
const tap = (mark, editing = "") => {
  const why = refuseBox(saved, mark, editing);
  if (!why) saved = placeBox(saved, mark, editing);
  return why;
};
ok(tap(box("s1", "person", ...Object.values(START_BOX))) === "" && saved.length === 1, "the first box may be the untouched start box");
ok(/already saved/.test(tap(box("s2", "person", ...Object.values(START_BOX)))) && saved.length === 1, "two taps without moving give one box");
saved = [];
ok(tap(moved) === "" && saved.length === 1, "a moved box is kept");
ok(tap(box("m2", "person", 8, 47, 18, 80)) !== "" && saved.length === 1, "the same box again is refused");
ok(/next object/.test(tap(box("s3", "dog", ...Object.values(START_BOX)))) && saved.length === 1, "after a save, the untouched start box is refused with what to do");
ok(tap(box("m3", "dog", 15, 66, 28, 80)) === "" && saved.length === 2, "a box moved onto the next object adds one");
ok(tap(box("m4", "bicycle", 8, 47, 18, 80)) === "" && saved.length === 3, "a different name on the same place is a different box");
ok(tap(box("m1", "person", 8, 47, 18, 80), "m1") === "" && saved.length === 3, "a Fix is never refused and never adds");
ok(/const refused = refuseBox\(prior, mark, editing\);\s*if \(refused\) \{\s*setNote\(refused\);\s*return;\s*\}[\s\S]*const list = placeBox\(prior, mark, editing\);/.test(save), "SAVE BOX asks refuseBox before it adds");

// rev 43 — each saved box shows its number and name, on the picture and in its row; a row tap lights its outline (Aset, Pangu, Sofia).
ok(/\{markIndex \+ 1\} \{mark\.name\}/.test(src) && /styles\.markTag/.test(src), "the dashed outline carries a tag '3 person'");
ok(/Box \{markIndex \+ 1\} · \{mark\.name\} · \{mark\.level === 2 \? "reviewed" : "labeled"\}/.test(src), "the row reads 'Box 3 · person · labeled'");
ok(!/\{mark\.level === 2 \? "Reviewed" : "Labeled"\} · \{mark\.name\}/.test(src), "rows no longer all read 'Labeled · person'");
ok(/onClick=\{\(\) => setLit\(lit === mark\.id \? "" : mark\.id\)\}/.test(src) && /lit === mark\.id \? styles\.markLit : ""/.test(src), "a row tap lights its outline");
ok(!/\.filter\(\(mark\) => mark\.id !== editing\)\s*\.map\(\(mark\) =>/.test(src), "outline numbers match row numbers (the list is not filtered before numbering)");
const css = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.module.css"), "utf8");
const rowButtons = /\.boxRow button,\n\.boxOn button \{([^}]*)\}/.exec(css)?.[1] || "";
ok(/min-height:\s*44px/.test(rowButtons), "Accept, Fix and Reject are 44 px tall, big enough for a thumb");
ok(/\.boxRow,\n\.boxOn \{[^}]*gap:\s*12px/.test(css), "row buttons sit 12 px apart");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
