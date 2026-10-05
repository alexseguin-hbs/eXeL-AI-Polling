// One label rule for every reader (rev 42): a first line of ??? is dropped before a class number is looked up,
// as the reference TFLite_detection_webcam.py does. Before this, the page read Demo.90 one class low:
// a traffic light read "boat", a car "bicycle", a dog "cat", and every person was hidden as ???.
// Run: node tests/sensor-fusion-labels.test.mjs

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

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
const catalog = JSON.parse(fs.readFileSync(path.resolve(here, "../public/sensor-fusion/models.json"), "utf8"));
const demo = catalog.models.find((item) => item.id === "demo90");
const demoText = demo.labels.join("\n") + "\n";

// The browser runner, loaded as the page loads it.
const window = {};
vm.runInNewContext(fs.readFileSync(path.resolve(here, "../public/sensor-fusion/cnn.js"), "utf8"), { window, document: {}, fetch: () => null, performance: { now: () => 0 } });
const labelList = window.SFCnn && window.SFCnn.labelList;
ok(typeof labelList === "function", "cnn.js shares its label rule");

// Raw class numbers from detect.tflite on the operator's test card.
const want = { 0: "person", 1: "bicycle", 2: "car", 9: "traffic light", 17: "dog" };
if (labelList) {
  const names = labelList(demoText);
  for (const [id, name] of Object.entries(want)) ok(names[Number(id)] === name, `browser: class ${id} reads ${name} (got ${names[Number(id)]})`);
  ok(names.length === demo.labels.length - 1, "browser: only the first ??? line is dropped");
  ok(labelList(demoText.replace(/\n/g, "\r\n"))[9] === "traffic light", "browser: a Windows label file reads the same");
  for (const model of catalog.models.filter((item) => item.labels[0] !== "???")) {
    ok(JSON.stringify(labelList(model.labels.join("\n"))) === JSON.stringify(model.labels), `browser: ${model.id} has no ??? first line and is unchanged`);
  }
}

// The class number is looked up in that list, and a ??? gap is still skipped.
const cnn = fs.readFileSync(path.resolve(here, "../public/sensor-fusion/cnn.js"), "utf8");
ok(/var labels = labelList\(/.test(cnn), "browser: load() reads the label file through the rule");
ok(/session\.labels\[classId\]/.test(cnn) && /name === "\?\?\?"\) continue/.test(cnn), "browser: a ??? gap inside the list is still skipped");

// The computer program, both the copy it runs and the copy it downloads.
for (const rel of ["../public/sensor-fusion/edge/sensor_fusion_edge.py", "../public/sensor-fusion/download/sensor_fusion_edge.py"]) {
  const file = path.resolve(here, rel);
  const py = fs.readFileSync(file, "utf8");
  ok(/if lines and lines\[0\] == "\?\?\?":\s*\n\s*del lines\[0\]/.test(py), `${path.basename(path.dirname(file))}: labels() drops a first ??? line`);
  let ran = false;
  try {
    const tmp = fs.mkdtempSync(path.join(fs.realpathSync("/tmp"), "sf-labels-"));
    const map = path.join(tmp, "labelmap.txt");
    fs.writeFileSync(map, demoText);
    const code = [
      "import importlib.util, json, sys",
      `spec = importlib.util.spec_from_file_location("edge", ${JSON.stringify(file)})`,
      "edge = importlib.util.module_from_spec(spec); spec.loader.exec_module(edge)",
      `edge.label_file = lambda folder: ${JSON.stringify(map)}`,
      "print(json.dumps(edge.labels('Demo90')))",
    ].join("\n");
    const names = JSON.parse(execFileSync("python3", ["-c", code], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
    ran = true;
    for (const [id, name] of Object.entries(want)) ok(names[Number(id)] === name, `${path.basename(path.dirname(file))}: class ${id} reads ${name}`);
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* No python3 here: the source check above still holds the rule. */
  }
  if (!ran) console.log(`note: python3 not run for ${rel}`);
}

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
