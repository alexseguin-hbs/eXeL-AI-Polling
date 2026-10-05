// One XML escape for Sensor Fusion (rev 42). The page used its own unescape, which changed nothing,
// so a name or a labeler with & grew one more "amp;" on every save and could fail the different-person check.
// Run: node --experimental-strip-types tests/sensor-fusion-voc.test.mjs

import fs from "node:fs";
import path from "node:path";
import { escapeXml, unescapeXml, readVoc, vocXml } from "../lib/sensor-fusion/voc.ts";

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

const AMP = "&" + "amp;";
const names = ['R&D "Team" <A>', "Alex & Dara", "salt & pepper", "a" + AMP + "b", "plain"];
for (const name of names) {
  const once = unescapeXml(escapeXml(name));
  const twice = unescapeXml(escapeXml(once));
  ok(once === name && twice === name, `"${name}" reads back unchanged after two saves`);
  ok(!/[<>"]/.test(escapeXml(name)) && !/&(?!amp;|lt;|gt;|quot;)/.test(escapeXml(name)), `"${name}" is written as safe XML`);
}

// Same person stays the same person after a save and a read.
const labeler = "R&D \"Team\" <A>";
ok(unescapeXml(escapeXml(labeler)) === labeler, "the different-person check compares the same name after a reload");

// The shared reader and writer agree on names.
const page = readVoc(vocXml({ file: "R&D_0001.png", width: 640, height: 480, boxes: [{ name: "salt & pepper", level: 1, xmin: 1, ymin: 2, xmax: 30, ymax: 40 }] }));
ok(page.file === "R&D_0001.png" && page.boxes[0].name === "salt & pepper", "voc.ts writes and reads a name with & unchanged");

// The page uses this one escape and keeps no copy of its own.
const src = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
ok(/import \{ escapeXml, unescapeXml \} from "@\/lib\/sensor-fusion\/voc";/.test(src), "the page imports the escape from lib/sensor-fusion/voc.ts");
ok(!/function unescapeXml\(/.test(src) && !/function escapeXml\(/.test(src), "the page has no escape of its own");
ok(/const text = \(value: string\) => unescapeXml\(value\);/.test(src), "the page's reader decodes every name, labeler and reviewer");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
