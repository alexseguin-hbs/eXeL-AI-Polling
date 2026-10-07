// A saved picture and its XML share one folder. Light Codex is a second file, then a third after Level 2.
// Run: node --experimental-strip-types tests/sensor-fusion-pair.test.mjs

import { bottomRightLine, codexLine, codexStamp, emptyPairXml, pairNames, readyForProject, SENSOR_FUSION_PROJECT, upperLeftLine } from "../lib/sensor-fusion/pair.ts";
import { readCorners, signSingleHelix, signUpperLeft } from "../lib/light-codex.ts";

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

const png = pairNames("head_0001.png");
ok(png.image === "head_0001.png" && png.xml === "head_0001.xml", "a png and its xml share the name");
ok(png.codex1 === "head_0001.l1.codex.png" && png.codex2 === "head_0001.l2.codex.png", "the two Light Codex strips use that same name");
const jpeg = pairNames("deer_0008.jpg");
ok(jpeg.image === "deer_0008.jpg" && jpeg.xml === "deer_0008.xml", "a jpeg keeps its ending and still gets an xml");
ok(emptyPairXml("head_0001.png").includes("<filename>head_0001.png</filename>"), "the paired xml names the picture");

const when = "2026.10.06_17.49..12";
ok(codexLine({ file: "head_0001.png", level: 1, who: "Alex", when }) === `LEVEL 1: ALEX ${when}`, "Level 1 records who and when");
ok(
  codexLine({ file: "head_0001.png", level: 2, who: "Jordan", when: "2026.10.06_18.02..04", l1: { who: "Alex", when } }) ===
    `LEVEL 1: ALEX ${when} LEVEL 2: JORDAN 2026.10.06_18.02..04`,
  "Level 2 adds a second who and when and keeps Level 1",
);
ok(codexStamp(new Date("2026-10-06T17:49:12Z")) === when, "the stamp is UTC in the Vision-2525 form");
let refused = false;
try {
  codexLine({ file: "head_0001.png", level: 1, who: "Alex", when: "today@" });
} catch {
  refused = true;
}
ok(refused, "a character Light Codex cannot write is refused before a strip is made");

const box = (level, by, reviewer) => ({ level, by, reviewer });
ok(readyForProject([]) === false, "an empty set cannot go to the project");
ok(readyForProject([box(1, "Alex", "")]) === false, "Level 1 alone cannot go to the project");
ok(readyForProject([box(2, "Alex", "Alex")]) === false, "the same person cannot review their own box");
ok(readyForProject([box(2, "Alex", "Jordan"), box(2, "Alex", "Jordan")]) === true, "a different person on every box can send the set");
ok(SENSOR_FUSION_PROJECT === "sensor-fusion", "the set goes to the sensor-fusion project");

const deer = { name: "deer", level: 1, xmin: 12, ymin: 40, xmax: 80, ymax: 90 };
const person = { name: "person", level: 2, xmin: 4, ymin: 8, xmax: 20, ymax: 30 };
ok(upperLeftLine([deer]) === "DEER 12 40 80 90", "Level 1 puts the name and the four corners upper left");
ok(upperLeftLine([deer, person]) === "PERSON 4 8 20 30", "Level 2 replaces Level 1");
ok(upperLeftLine([person, { name: "head", level: 2, xmin: 1, ymin: 2, xmax: 3, ymax: 4 }], 16) === "PERSON 4 8 20 30", "a short picture keeps the boxes that fit");

if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = class ImageData {
    constructor(data, width, height) { this.data = data; this.width = width; this.height = height; }
  };
}
const w = 720, h = 80;
const blank = new Uint8ClampedArray(w * h * 4);
for (let i = 0; i < blank.length; i += 4) { blank[i] = 30; blank[i + 1] = 80; blank[i + 2] = 30; blank[i + 3] = 255; }
const personLine = bottomRightLine("Alex Seguin", "2026.10.05_22.23..24");
const stamped = signSingleHelix(signUpperLeft(new ImageData(blank, w, h), upperLeftLine([deer])), personLine);
const read = readCorners(stamped);
ok(read.upperLeft === "DEER 12 40 80 90" && read.bottomRight === personLine, "the two lines read back from their own corners");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
