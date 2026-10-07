// The Sensor Fusion project journey: group labeling, Level 2, and the clock.
// Run: node --experimental-strip-types tests/sensor-fusion-workflow.test.mjs
import fs from "node:fs";
import path from "node:path";
import { readyForProject } from "../lib/sensor-fusion/pair.ts";
import { acceptMark, emptyClock, noteWork, saveMark, startClock, stopClock, workflowLines } from "../lib/sensor-fusion/workflow.ts";

let passed = 0;
const failures = [];
function ok(cond, name) {
  if (cond) passed += 1;
  else failures.push(name);
}

const box = (id, name, by) => ({ id, name, left: 40, top: 35, right: 60, bottom: 65, level: 1, by, at: "2026.10.06_14.00..00" });

let clock = emptyClock("heads");
clock = startClock(clock, "Alex", 0);
clock = startClock(clock, "Riley", 1000);
ok(clock.open?.member === "ALEX", "START a second time does not steal the clock");
for (const name of ["head_0001.png", "head_0002.png", "head_0003.png", "head_0004.png"]) {
  clock = noteWork(clock, "Alex", name, "annotate");
}
clock = noteWork(clock, "Alex", "head_0001.png", "annotate");
clock = stopClock(clock, 12500);
ok(workflowLines(clock, 12500)[0].seconds === 13, "Alex's time is 13 seconds");
ok(workflowLines(clock, 12500)[0].images === 4, "four images count once each");

const first = box("a", "head", "ALEX");
const own = acceptMark(first, "alex", "2026.10.06_14.01..00");
ok(!own.ok && own.note === "A different person must review this box.", "the same person cannot do Level 2");
const guests = acceptMark({ ...first, by: "guest" }, "Guest", "2026.10.06_14.01..00");
ok(!guests.ok, "two guests count as one person");

clock = startClock(clock, "Riley", 20000);
const pictures = ["head_0001.png", "head_0002.png", "head_0003.png", "head_0004.png"];
const reviewed = [];
for (const [index, name] of pictures.entries()) {
  const drawn = box(String(index), "head", "ALEX");
  if (index === 3) {
    const moved = saveMark(drawn, { ...drawn, left: 12, at: "2026.10.06_14.02..00" }, "Riley");
    ok(moved.kind === "adjust" && moved.box.by === "ALEX" && moved.box.level === 2 && moved.box.reviewer === "RILEY", "a Level 2 move keeps the first person's name");
    reviewed.push(moved.box);
    clock = noteWork(clock, "Riley", name, "adjust");
  } else {
    const accepted = acceptMark(drawn, "Riley", "2026.10.06_14.01..10");
    ok(accepted.ok === true && accepted.box.by === "ALEX", `Level 2 keeps Alex on ${name}`);
    reviewed.push(accepted.box);
    clock = noteWork(clock, "Riley", name, "level2");
  }
}
const again = acceptMark(reviewed[0], "Riley", "2026.10.06_14.03..00");
ok(!again.ok && again.note === "This box is already reviewed.", "a reviewed box is not reviewed twice");
clock = stopClock(clock, 48000);

const lines = workflowLines(clock, 48000);
const alex = lines.find((line) => line.member === "ALEX");
const riley = lines.find((line) => line.member === "RILEY");
ok(alex?.seconds === 13 && alex.images === 4 && alex.level2 === 0 && alex.adjustments === 0, "Alex labeled 4 images in 13 seconds");
ok(riley?.seconds === 28 && riley.images === 4 && riley.level2 === 4 && riley.adjustments === 1, "Riley reviewed 4 images in 28 seconds and changed 1");
ok(readyForProject(reviewed), "the project can take the set only after every box has Level 2");
ok(!readyForProject([first, ...reviewed.slice(1)]), "one unlabeled box holds the project");

const page = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
ok(/saveMark\(/.test(page) && /acceptMark\(/.test(page) && /clock\.open \? "STOP" : "START"/.test(page), "the screen uses the clock and keeps the first person's name");

if (failures.length) {
  console.error(failures.map((item) => `FAIL: ${item}`).join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
const totalSeconds = lines.reduce((sum, line) => sum + line.seconds, 0);
const totalImages = 4;
const totalChanges = lines.reduce((sum, line) => sum + line.adjustments, 0);
console.log(`${passed} passed`);
console.log(`Project heads: ${lines.length} members, ${totalImages} images, ${totalSeconds}s, ${totalChanges} Level 2 change.`);
for (const line of lines) console.log(`${line.member} ${line.seconds}s · ${line.images} images · ${line.level2} reviews · ${line.adjustments} changes`);
