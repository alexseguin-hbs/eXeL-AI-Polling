// The info still is the operator's Austin test card with the REAL Demo.90 boxes (rev 42).
// Every box and score on the page equals the "headline" of the model run on that picture.
// Run: node --experimental-strip-types tests/sensor-fusion-info.test.mjs

import fs from "node:fs";
import path from "node:path";
import { INFO_STILL } from "../app/SensorFusion-2525/sf.ts";

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

const here = import.meta.dirname;
const repo = path.resolve(here, "../..");
const fixture = JSON.parse(
  fs.readFileSync(path.join(repo, "docs/asks/2026.10.04_19.32..14_sensor_fusion_info_default_image_demo90_detections.json"), "utf8"),
);
const page = fs.readFileSync(path.resolve(here, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
const css = fs.readFileSync(path.resolve(here, "../app/SensorFusion-2525/sensor-fusion.module.css"), "utf8");

// 1. The boxes are the real run, not hand-placed.
ok(INFO_STILL.size[0] === fixture.image[0] && INFO_STILL.size[1] === fixture.image[1], "the still's size is the original picture's size");
ok(INFO_STILL.boxes.length === fixture.headline.length, `the still carries every headline box (${INFO_STILL.boxes.length} of ${fixture.headline.length})`);
fixture.headline.forEach((want, index) => {
  const got = INFO_STILL.boxes[index] || {};
  ok(got.label === want.label && got.score === want.score, `box ${index + 1} is ${want.label} ${want.score}`);
  ok(JSON.stringify(got.box_px) === JSON.stringify(want.box_px), `box ${index + 1} sits at the model's pixels ${want.box_px.join(",")}`);
});

// 2. Every object of the five Demo.90 kinds has a box, and every box is inside the picture.
const kinds = [...new Set(INFO_STILL.boxes.map((box) => box.label))].sort();
ok(JSON.stringify(kinds) === JSON.stringify(["bicycle", "car", "dog", "person", "traffic light"]), `the five kinds are there: ${kinds.join(", ")}`);
ok(INFO_STILL.boxes.filter((box) => box.label === "person").length === 2, "both people are boxed");
for (const box of INFO_STILL.boxes) {
  const [x1, y1, x2, y2] = box.box_px;
  ok(0 <= x1 && x1 < x2 && x2 <= INFO_STILL.size[0] && 0 <= y1 && y1 < y2 && y2 <= INFO_STILL.size[1], `${box.label} box is inside the picture`);
  ok(box.score >= fixture.keep_threshold && box.score <= 1, `${box.label} score is a kept model score`);
}

// 3. The picture file is his photo, compressed for a phone.
const file = path.resolve(here, "../public", INFO_STILL.src.replace(/^\//, ""));
ok(fs.existsSync(file), `the still file exists: ${INFO_STILL.src}`);
if (fs.existsSync(file)) {
  const bytes = fs.readFileSync(file);
  ok(bytes.length < 400 * 1024, `the still is under 400 KB (${Math.round(bytes.length / 1024)} KB)`);
  ok(bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP", "the still is a WebP");
  const chunk = bytes.toString("ascii", 12, 16);
  let width = 0;
  let height = 0;
  if (chunk === "VP8 ") {
    width = bytes.readUInt16LE(26) & 0x3fff;
    height = bytes.readUInt16LE(28) & 0x3fff;
  } else if (chunk === "VP8X") {
    width = 1 + bytes.readUIntLE(24, 3);
    height = 1 + bytes.readUIntLE(27, 3);
  }
  ok(width === height && width >= 600, `the still is square and sharp enough (${width}x${height})`);
}

// 4. The page draws that file and those boxes; the drawn-only still is gone.
ok(page.includes("src={INFO_STILL.src}"), "the info still draws the photo file");
ok(/INFO_STILL\.boxes\.map\(/.test(page), "the info still draws every box from INFO_STILL");
ok(/\{box\.label\} · \{Math\.round\(box\.score \* 100\)\}%/.test(page), "each tag reads 'class · score'");
ok(!page.includes('viewBox="0 0 320 180"'), "the drawn street is gone");
ok(!/score: 96|score: 91|score: 88|score: 84|score: 79/.test(page), "the typed scores 96/91/88/84/79 are gone");
ok(/kinds · \{INFO_STILL\.boxes\.length\} boxes/.test(page), "the note counts kinds and boxes from the run");
ok(page.includes("Sensor Fusion. This picture."), "the info menu starts with Sensor Fusion on this picture");
ok(page.includes("Image labeler. Annotate."), "the info menu names the image labeler");
ok(page.includes("Coral is a switch. Check ID is a model in the list."), "Coral and Check ID match the computer menu");
ok(page.includes("Capture Images · Annotate Images · Upload Images"), "the training steps match the computer menu");

// 5. Tags fit their words and stay inside the picture.
const tagRule = /\.stillTag \{([^}]*)\}/.exec(css)?.[1] || "";
ok(tagRule && !/max-width/.test(tagRule), "a tag grows to fit its words");
ok(/\.stillTagEnd \{[^}]*right: -2px/.test(css), "a tag near the right edge is anchored to the box's right side");
ok(/right > 75 \? styles\.stillTagEnd/.test(page), "the page anchors right-side tags inside the picture");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
