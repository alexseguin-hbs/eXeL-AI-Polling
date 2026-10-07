import { IMAGE_INTAKE, VIDEO_INTAKE, levelReadout, needsPng, pngSet, videoSourceName } from "../lib/sensor-fusion/frames.ts";
import { bottomRightLine } from "../lib/sensor-fusion/pair.ts";
import fs from "node:fs";
import path from "node:path";

const failures = [];
let passed = 0;
function ok(cond, name) {
  if (cond) passed += 1;
  else failures.push(name);
}

const deer = pngSet("deer_0008.jpg");
ok(deer.png === "deer_0008.png" && deer.xml === "deer_0008.xml" && !("level1" in deer), "the file stays deer_0008.png");
ok(pngSet("deer_0008.L1.png").png === "deer_0008.png" && pngSet("deer_0008.heic").png === "deer_0008.png", "an older Level 1 name and a HEIC both become deer_0008.png");
ok(bottomRightLine("Alex Seguin", "2026.10.05_22.23..24") === "LEVEL 1: ALEX SEGUIN 2026.10.05_22.23..24", "Level 1 is the name and the time");
ok(bottomRightLine("ID123456789", "2026.10.05_22.23..24") === "LEVEL 1: ID123456789 2026.10.05_22.23..24", "an id is a Level 1 name");
ok(levelReadout("LEVEL 1: ALEX SEGUIN 2026.10.05_22.23..24") === "Level 1: ALEX SEGUIN 2026.10.05_22.23..24", "the decoder shows Level 1 on the picture");
ok(bottomRightLine("Alex", "2026.10.07_12.00..00", "Jordan", "2026.10.07_13.00..00") === "LEVEL 1: ALEX 2026.10.07_12.00..00 LEVEL 2: JORDAN 2026.10.07_13.00..00", "a review adds Level 2");
ok(bottomRightLine("Alex", "") === "", "a record without a time is not written");
ok(needsPng("deer_0008.jpg") && needsPng("deer_0008.webp") && !needsPng("deer_0008.png"), "a PNG is already in the app format");
ok(IMAGE_INTAKE.includes(".heic") && VIDEO_INTAKE.includes(".mov") && videoSourceName("thermal") === "Thermal imager", "pictures and videos are both welcome");

const src = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
ok(/accept=\{IMAGE_INTAKE\}/.test(src) && /accept=\{VIDEO_INTAKE\}/.test(src) && /fileToPng\(/.test(src), "Capture takes pictures and videos and turns pictures into PNG");
ok(/peekNames\(label, total\.n, "png"\)/.test(src) && /addFromVideo[\s\S]{0,1800}image\/png/.test(src), "a video is split into PNG frames");
ok(/captureMode === "pictures"/.test(src) && /ensurePng\(/.test(src), "pictures are their own intake, and Level 1 and Level 2 keep the PNG");
ok(/signSingleHelix\(/.test(src) && /signUpperLeft\(/.test(src) && /upperLeftLine\(/.test(src) && !/placeSignature\(/.test(src) && /drawImage\(base, 0, 0\)/.test(src) && !/Light Codex/.test(src), "boxes go upper left, the person stays bottom right, and the screen does not show either");

if (failures.length) {
  console.error(failures.map((item) => `FAIL: ${item}`).join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
