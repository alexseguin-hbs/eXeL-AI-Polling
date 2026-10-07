import { afterLevel1, isLabelingJpeg, videoSourceName } from "../lib/sensor-fusion/frames.ts";
import fs from "node:fs";
import path from "node:path";

const failures = [];
let passed = 0;
function ok(cond, name) {
  if (cond) passed += 1;
  else failures.push(name);
}

const deer = afterLevel1("deer_0008.jpg");
ok(deer.jpeg === "deer_0008.jpg" && deer.png === "deer_0008.png" && deer.xml === "deer_0008.xml" && deer.codex === "deer_0008.l1.codex.png", "a labeling JPEG becomes a PNG with the same name and a Light Codex strip");
ok(isLabelingJpeg("deer_0008.jpg") && isLabelingJpeg("deer_0008.jpeg") && !isLabelingJpeg("deer_0008.png"), "only a JPEG is still waiting for Level 1");
ok(videoSourceName("thermal") === "Thermal imager" && videoSourceName("other") === "Other source", "a video is a thermal imager or another source");

const src = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
ok(/peekNames\(label, total\.n, "jpg"\)/.test(src) && /image\/jpeg/.test(src) && /videoSource === "thermal" \? styles\.botOn/.test(src), "a submitted video is split into JPEGs, from a thermal imager or another source");
ok(/afterLevel1\(/.test(src) && /image\/png/.test(src), "Level 1 writes the PNG");

if (failures.length) {
  console.error(failures.map((item) => `FAIL: ${item}`).join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
