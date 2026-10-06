// One device list for the website, the saved file, and the computer program.
// Run: node tests/sensor-fusion-edge-contract.test.mjs

import fs from "node:fs";
import path from "node:path";
import { detectPlatform, deviceFolder, pathSep, sensorPath, sensorsFromLabels, PLATFORMS, EXTRA_SENSORS } from "../app/SensorFusion-2525/sf.ts";

const here = import.meta.dirname;
const contract = JSON.parse(fs.readFileSync(path.resolve(here, "../public/sensor-fusion/edge-contract.json"), "utf8"));
const download = fs.readFileSync(path.resolve(here, "../public/sensor-fusion/download/SensorFusion-2525.html"), "utf8");
const edgePy = fs.readFileSync(path.resolve(here, "../public/sensor-fusion/edge/sensor_fusion_edge.py"), "utf8");
const downloadPy = fs.readFileSync(path.resolve(here, "../public/sensor-fusion/download/sensor_fusion_edge.py"), "utf8");

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

ok(contract.platforms.map((row) => row.id).join("|") === "android|iphone|win|mac|pi|ubuntu", "the six devices stay in detection order");
ok(PLATFORMS.map((row) => row.id).join("|") === contract.platforms.map((row) => row.id).join("|"), "the website uses that same order");
ok(PLATFORMS.map((row) => row.label).join("|") === contract.platforms.map((row) => row.label).join("|"), "the website uses those names");
ok(contract.folder.join("/") === "Home/SensorFusion", "every device keeps Home/SensorFusion");
ok(contract.platforms.every((row) => row.show.includes("Home") && row.show.includes("SensorFusion")), "the shown folder keeps both words");
ok(pathSep("win") === "\\" && pathSep("pi") === "/" && pathSep("iphone") === "/", "only Windows uses a backslash");
ok(sensorPath("android").startsWith("/sdcard/Home/SensorFusion"), "Android shows the shared folder");
ok(sensorPath("iphone") === "On My iPhone/Home/SensorFusion", "an iPhone shows On My iPhone");
ok(sensorPath("win", ["Demo90"]) === "Home\\SensorFusion\\Demo90", "Windows joins the model folder with a backslash");
ok(sensorPath("mac", ["Demo90"]) === "Home/SensorFusion/Demo90", "a Mac joins the model folder with a slash");
ok(sensorPath("pi") === "Home/SensorFusion" && sensorPath("ubuntu") === "Home/SensorFusion", "a Pi and Ubuntu use the same folder");
const methods = { android: "sdcard", iphone: "documents", win: "profile", mac: "home", pi: "home", ubuntu: "home" };
for (const [id, write] of Object.entries(methods)) {
  ok(deviceFolder(id).write === write && deviceFolder(id).show === sensorPath(id), `${id} has one folder method`);
}
ok(contract.platforms.every((row) => row.write === methods[row.id]), "the shared list names each device's folder method");

const cases = [
  ["Mozilla/5.0 (Linux; Android 14)", "", "android"],
  ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)", "", "iphone"],
  ["Mozilla/5.0 (Windows NT 10.0)", "Win32", "win"],
  ["Mozilla/5.0 (Macintosh; Intel Mac OS X)", "MacIntel", "mac"],
  ["Mozilla/5.0 (X11; Linux aarch64) Raspberry Pi", "Linux aarch64", "pi"],
  ["Mozilla/5.0 (X11; Ubuntu; Linux x86_64)", "Linux x86_64", "ubuntu"],
];
for (const [ua, plat, id] of cases) ok(detectPlatform(ua, plat) === id, `${id} is found from the shared list`);

ok(sensorsFromLabels(["FLIR Lepton"]).join() === "thermal", "a named thermal sensor is listed");
ok(sensorsFromLabels(["plain camera"]).join() === "", "a camera name does not invent a second sensor");
ok(EXTRA_SENSORS.find((item) => item.id === "camera").live === true, "the second camera is the one that can open");
ok(EXTRA_SENSORS.filter((item) => item.id !== "camera").every((item) => item.live === false), "the other sensors wait until they are attached");

const edgeStart = download.indexOf("window.SF_EDGE = ");
const edgeEnd = download.indexOf(";\nconst EDGE", edgeStart);
const embedded = JSON.parse(download.slice(edgeStart + "window.SF_EDGE = ".length, edgeEnd));
ok(JSON.stringify(embedded) === JSON.stringify(contract), "the saved file carries the same device list");
ok(/const PLATFORMS = \(EDGE\.platforms/.test(download), "the saved file does not keep a second handwritten list");
ok(/window\.SF_CATALOG && window\.SF_CATALOG\.menu/.test(download), "the saved file uses the same opening menu");
ok(!/\["3","Image labeler"/.test(download), "Image labeler is not an opening row in the saved file");
ok(edgePy === downloadPy, "the computer program and the copy in the download are the same file");
ok(/def path_method\(/.test(edgePy) && /def home\(/.test(edgePy) && /def shown_folder\(/.test(edgePy), "the computer program has one path method, one real folder, and one shown folder");
ok(!/\/home\/pi\/SensorFusion"/.test(edgePy), "a Pi no longer uses a folder that drops Home");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
