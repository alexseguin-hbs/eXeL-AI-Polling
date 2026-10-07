import { IMAGE_INTAKE, VIDEO_INTAKE, needsPng, pngSet, videoSourceName } from "../lib/sensor-fusion/frames.ts";
import fs from "node:fs";
import path from "node:path";

const failures = [];
let passed = 0;
function ok(cond, name) {
  if (cond) passed += 1;
  else failures.push(name);
}

const deer = pngSet("deer_0008.jpg");
ok(deer.png === "deer_0008.png" && deer.xml === "deer_0008.xml" && deer.level1 === "deer_0008.l1.codex.png" && deer.level2 === "deer_0008.l2.codex.png", "any file name becomes one PNG with a Level 1 strip and a Level 2 strip");
ok(pngSet("deer_0008.heic").png === "deer_0008.png" && pngSet("clip.mp4").png === "clip.png", "a HEIC and a video share the PNG name");
ok(needsPng("deer_0008.jpg") && needsPng("deer_0008.webp") && !needsPng("deer_0008.png"), "a PNG is already in the app format");
ok(IMAGE_INTAKE.includes(".heic") && VIDEO_INTAKE.includes(".mov") && videoSourceName("thermal") === "Thermal imager", "pictures and videos are both welcome");

const src = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
ok(/accept=\{IMAGE_INTAKE\}/.test(src) && /accept=\{VIDEO_INTAKE\}/.test(src) && /fileToPng\(/.test(src), "Capture takes pictures and videos and turns pictures into PNG");
ok(/peekNames\(label, total\.n, "png"\)/.test(src) && /addFromVideo[\s\S]{0,1800}image\/png/.test(src), "a video is split into PNG frames");
ok(/captureMode === "pictures"/.test(src) && /ensurePng\(/.test(src), "pictures are their own intake, and Level 1 and Level 2 keep the PNG");

if (failures.length) {
  console.error(failures.map((item) => `FAIL: ${item}`).join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
