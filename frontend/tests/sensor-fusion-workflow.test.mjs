// The Sensor Fusion project journey: group labeling, Level 2, and the clock.
// Run: node --experimental-strip-types tests/sensor-fusion-workflow.test.mjs
import fs from "node:fs";
import path from "node:path";
import { readyForProject, codexLine } from "../lib/sensor-fusion/pair.ts";
import { acceptMark, emptyClock, finalSubmission, noteWork, saveMark, siTokens, simulateClass, SIM_ANIMALS, SIM_LABELERS, SIM_REVIEWER, startClock, stopClock, workflowLines } from "../lib/sensor-fusion/workflow.ts";

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
ok(siTokens(13) === 1 && siTokens(28) === 1 && siTokens(61) === 2 && siTokens(0) === 0, "one S.I. is one started minute");

// A class collecting deer and other four-legged animals.
let herd = emptyClock("deer");
herd = startClock(herd, "Alex", 0);
for (const name of ["deer_0001.png", "deer_0002.png", "deer_0003.png", "horse_0001.png"]) herd = noteWork(herd, "Alex", name, "annotate");
herd = stopClock(herd, 90000);
herd = startClock(herd, "Riley", 100000);
const herdFiles = [
  ["deer_0001.png", "deer", false],
  ["deer_0002.png", "deer", false],
  ["deer_0003.png", "deer", false],
  ["horse_0001.png", "horse", true],
];
const herdImages = herdFiles.map(([file, name, moved], index) => {
  const drawn = box(`h${index}`, name, "ALEX");
  const done = moved ? saveMark(drawn, { ...drawn, name: "horse", left: 8, at: "2026.10.07_02.00..00" }, "Riley").box : acceptMark(drawn, "Riley", "2026.10.07_02.00..00").box;
  herd = noteWork(herd, "Riley", file, moved ? "adjust" : "level2");
  const l1 = codexLine({ file, level: 1, who: done.by, when: done.at });
  const l2 = codexLine({ file, level: 2, who: done.reviewer, when: done.reviewedAt, l1: { who: done.by, when: done.at } });
  return { file, l1, l2, boxes: [done] };
});
herd = stopClock(herd, 130000);
const held = finalSubmission({ clock: herd, now: 130000, images: herdImages.map((image, index) => (index === 1 ? { ...image, l2: "", boxes: [{ ...image.boxes[0], level: 1, reviewer: "" }] } : image)) });
ok(!held.ok, "one picture still at Level 1 holds the class packet");
const sent = finalSubmission({ clock: herd, now: 130000, images: herdImages });
ok(sent.ok === true && sent.packet.subject === "deer, horse", "the packet names every animal in the set");
ok(sent.ok === true && sent.packet.images.length === 4 && sent.packet.images.every((image) => image.l1.startsWith("L1 ") && image.l2.includes("L2 ")), "every picture carries a Level 1 line and a Level 2 line");
ok(sent.ok === true && sent.packet.contributors.find((line) => line.member === "ALEX")?.si === 2, "90 seconds is 2 S.I. for the labeler");
ok(sent.ok === true && sent.packet.contributors.find((line) => line.member === "RILEY")?.si === 1 && sent.packet.si === 3, "the reviewer adds 1 S.I. and the class total is 3");
ok(sent.ok === true && sent.packet.images[3].boxes[0].by === "ALEX" && sent.packet.images[3].boxes[0].name === "horse", "the horse box keeps the first person's name");

const sim = simulateClass(200, 0, (input) => codexLine(input));
ok(sim.ok === true && sim.packet.images.length === 200, "simulation builds 200 pictures and saves none");
ok(sim.ok === true && new Set(sim.packet.images.map((image) => image.file)).size === 200, "all 200 file names are different");
ok(sim.ok === true && sim.packet.images.every((image) => image.l1.startsWith("L1 ") && image.l2.includes("L2 ") && image.boxes[0].level === 2 && image.boxes[0].by !== image.boxes[0].reviewer), "every simulated picture has both lines and a different reviewer");
ok(sim.ok === true && sim.packet.images.filter((image) => image.file.startsWith("deer_")).length === 34, "deer takes the first extra pictures");
ok(sim.ok === true && SIM_ANIMALS.every((animal) => sim.packet.subject.includes(animal)), "the packet names deer and the other four-legged animals");
ok(sim.ok === true && sim.packet.contributors.length === SIM_LABELERS.length + 1 && sim.packet.contributors.some((line) => line.member === SIM_REVIEWER.toUpperCase() && line.reviews === 200 && line.seconds === 600 && line.si === 10), "Jordan reviews all 200 in 600 seconds, which is 10 S.I.");
ok(sim.ok === true && sim.packet.contributors.find((line) => line.member === "ALEX")?.seconds === 272 && sim.packet.si === 40, "the class total is 40 S.I.");
ok(sim.ok === true && sim.note.includes("Simulation only"), "the screen says this run saved nothing");
const oneShort = finalSubmission({ clock: emptyClock("deer"), now: 0, images: sim.ok ? sim.packet.images.map((image, index) => (index === 199 ? { ...image, l2: "" } : image)) : [] });
ok(!oneShort.ok, "199 reviewed pictures still cannot upload");
ok(/simulateClass\(200/.test(fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8")), "the page runs the 200-picture simulation");

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
