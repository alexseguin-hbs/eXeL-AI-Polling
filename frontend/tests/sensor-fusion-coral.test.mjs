// Coral is a switch. Check ID is a model inside Sensor Fusion.
// Two passes: the shared plan, then the same four cases from the file names alone.
// Run: node --experimental-strip-types tests/sensor-fusion-coral.test.mjs

import fs from "node:fs";
import path from "node:path";
import { MENU, MODELS, coralNote, decideRun, detectPlatform, lensZoom, runPlan } from "../app/SensorFusion-2525/sf.ts";

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

ok(MENU.map((item) => item.label).join("|") === "Sensor Fusion|Stop|Pose", "the opening menu is the camera, stop, and pose");
ok(!MENU.some((item) => /label|coral|check id/i.test(item.label)), "Annotate, Coral, and Check ID are not opening-menu rows");
ok(detectPlatform("Mozilla/5.0 (Windows NT 10.0)", "Win32") === "win", "a Windows computer is PC-WIN");
ok(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)") === "iphone", "an iPhone is found");
ok(detectPlatform("Mozilla/5.0 (Linux; Android 14)") === "android", "an Android phone is found");
ok(detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X)", "MacIntel") === "mac", "a Mac is found");
ok(detectPlatform("Mozilla/5.0 (X11; Linux aarch64) Raspberry Pi", "Linux aarch64") === "pi", "a Raspberry Pi is found only when it says so");
ok(detectPlatform("Mozilla/5.0 (X11; Ubuntu; Linux x86_64)", "Linux x86_64") === "ubuntu", "a Linux computer is Ubuntu, not a Pi");
ok(MODELS.some((item) => item.id === "checkid"), "Check ID remains a model");
ok(runPlan(true, "missing").model === "demo90" && runPlan(true, "missing").file === "edgetpu.tflite", "an unknown model falls back without dropping Coral");

const page = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
const py = fs.readFileSync(path.resolve(import.meta.dirname, "../public/sensor-fusion/edge/sensor_fusion_edge.py"), "utf8");
ok(/<p>CPU CORAL<\/p>/.test(page) && />[\s\n]*CPU[\s\n]*</.test(page) && />[\s\n]*CORAL[\s\n]*</.test(page), "the switch reads CPU CORAL");
ok(page.indexOf("<p>CPU CORAL</p>") < page.indexOf("SESSION COLOR SCHEME"), "CPU CORAL sits above the color scheme");
ok(/useState<SchemeId \| "custom">\("green"\)/.test(page), "a new screen starts on the original green");
ok(/const \[coral, setCoral\] = useState\(false\)/.test(page), "CPU is the default");
ok(/const plan = runPlan\(coral, model\)/.test(page), "Sensor Fusion uses the switch, not a menu flag");
ok(!/setCoral\(item\.coral\)/.test(page), "the menu no longer sets Coral");
ok(!/Check ID, with Coral/.test(py) && !/Check ID, no Coral/.test(py), "the computer menu dropped Check ID rows");
ok(/Coral on\? y\/n/.test(py), "the computer asks the Coral switch");
ok(/choose_model\(\)/.test(py), "Check ID is chosen from the model list");

// rev 43: CORAL picked in a browser says where Coral really runs, in one line under the switch (spec 2026.10.03_18.37..22, change 2).
const CORAL_LINE = "CORAL sends the camera to the program on this PC. CPU runs the model in this page.";
ok(coralNote(true) === CORAL_LINE, "with CORAL on, the line says the camera goes to the program on this PC");
ok(coralNote(false) === "", "with CPU on, there is no line");
ok(decideRun("browser", true, false).engine === "processor" && decideRun("browser", true, true).file === "detect.tflite", "the browser always runs detect.tflite on the processor");
ok(decideRun("edge", true, true).engine === "Coral" && decideRun("edge", true, false).engine === "processor", "only the computer with the chip runs Coral");
ok(/def serve\(/.test(py) && /"--page" in sys.argv/.test(py), "the PC program can take pictures from the page");
const sfSrc = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sf.ts"), "utf8");
ok(/export function coralNote\(coral: boolean\)/.test(sfSrc), "the settings line is one function");
ok(/\bcoralNote,/.test(page.slice(0, page.indexOf('from "./sf"'))), "the page imports coralNote");
const sheet = page.slice(page.indexOf("function SettingsSheet("), page.indexOf("type Step ="));
ok(/\{coralNote\(coral\) && <p className=\{styles\.muted\}>\{coralNote\(coral\)\}<\/p>\}/.test(sheet), "Settings shows the line only when there is one");
ok(sheet.indexOf("CORAL\n            </button>") < sheet.indexOf("coralNote(coral) &&") && sheet.indexOf("coralNote(coral) &&") < sheet.indexOf("<p>ALERTS</p>"), "the line sits under the CPU CORAL switch, above ALERTS");

const zoom = { min: 0.5, max: 6 };
ok(lensZoom("wide", zoom) === 1 && lensZoom("ultra", zoom) === 0.5 && lensZoom("tele", zoom) === 2.5, "the three back cameras pick wide, ultra, and tele");
ok(lensZoom("front", zoom) === null, "the front camera is not a zoom of the back");
ok(lensZoom("ultra", { min: 1, max: 5 }) === 1 && lensZoom("tele", { min: 1, max: 5 }) === 2.5, "one back camera uses the closest zoom");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
