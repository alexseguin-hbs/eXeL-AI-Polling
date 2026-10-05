// One picture holds many boxes (PLAN R3; rev 42). SAVE BOX adds a box. Only Fix replaces one (rev 38).
// Before this, every SAVE BOX after the first rewrote box 1: three saves left one row.
// Run: node --experimental-strip-types tests/sensor-fusion-labeler.test.mjs

import fs from "node:fs";
import path from "node:path";
import { placeBox } from "../app/SensorFusion-2525/sf.ts";

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

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
