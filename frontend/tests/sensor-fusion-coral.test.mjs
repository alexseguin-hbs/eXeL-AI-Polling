// Coral is a switch. Check ID is a model inside Sensor Fusion.
// Two passes: the shared plan, then the same four cases from the file names alone.
// Run: node --experimental-strip-types tests/sensor-fusion-coral.test.mjs

import fs from "node:fs";
import path from "node:path";
import { MENU, MODELS, runPlan } from "../app/SensorFusion-2525/sf.ts";

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

const cases = [
  [false, "demo90", "detect.tflite"],
  [true, "demo90", "edgetpu.tflite"],
  [false, "checkid", "detect.tflite"],
  [true, "checkid", "edgetpu.tflite"],
];

for (const [coral, model, file] of cases) {
  const plan = runPlan(coral, model);
  ok(plan.coral === coral && plan.model === model && plan.file === file, `pass 1 ${model} coral ${coral}`);
}

for (const [coral, model, file] of cases) {
  const plan = runPlan(Boolean(coral), String(model));
  const again = coral ? "edgetpu.tflite" : "detect.tflite";
  ok(plan.file === file && plan.file === again && plan.model === model, `pass 2 ${model} coral ${coral}`);
}

ok(MENU.map((item) => item.label).join("|") === "Sensor Fusion|Stop|Image labeler|Pose", "menu is four rows");
ok(!MENU.some((item) => /coral|check id/i.test(item.label)), "Coral and Check ID are not menu rows");
ok(MODELS.some((item) => item.id === "checkid"), "Check ID remains a model");
ok(runPlan(true, "missing").model === "demo90" && runPlan(true, "missing").file === "edgetpu.tflite", "an unknown model falls back without dropping Coral");

const page = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
const py = fs.readFileSync(path.resolve(import.meta.dirname, "../public/sensor-fusion/edge/sensor_fusion_edge.py"), "utf8");
ok(/role="switch" aria-checked=\{coral\}/.test(page), "settings has the Coral switch");
ok(/const plan = runPlan\(coral, model\)/.test(page), "Sensor Fusion uses the switch, not a menu flag");
ok(!/setCoral\(item\.coral\)/.test(page), "the menu no longer sets Coral");
ok(!/Check ID, with Coral/.test(py) && !/Check ID, no Coral/.test(py), "the computer menu dropped Check ID rows");
ok(/Coral on\? y\/n/.test(py), "the computer asks the Coral switch");
ok(/choose_model\(\)/.test(py), "Check ID is chosen from the model list");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
