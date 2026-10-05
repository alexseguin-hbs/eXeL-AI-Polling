// One capture at a time, and the numbers the person types or reads are never changed quietly (SF rev 43, round 2).
// 1. A double tap on FROM SENSOR wrote person_0001–0004 twice and moved the counter to 8 (Enki, Thoth, Thor).
// 2. "How many" opened a text keyboard; 'abc' quietly became 4 and '100' became 12 (Christo, Thoth).
// 3. The saved line named folders the app never made ('Files/person', 'Downloads/person') and listed 94 names in one sentence (Sofia).
// Run: node --experimental-strip-types tests/sensor-fusion-capture.test.mjs

import fs from "node:fs";
import path from "node:path";
import { howManyPictures, nameList, savedLine } from "../app/SensorFusion-2525/sf.ts";

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

// 2. How many: 1 to 12, whole numbers only; anything else is refused with a sentence.
for (const [raw, n] of [["4", 4], ["1", 1], ["12", 12], [" 3 ", 3]]) ok(howManyPictures(raw).n === n && howManyPictures(raw).note === "", `How many '${raw}' takes ${n}`);
for (const raw of ["abc", "0", "13", "100", "2.5", "-1", ""]) {
  const out = howManyPictures(raw);
  ok(out.n === 0 && out.note === "How many takes a number from 1 to 12.", `How many '${raw}' is refused with a sentence, not changed to 4 or 12`);
}

// 3. The save says what happened.
ok(savedLine("shared", 4) === "Shared 4 pictures.", "a share reads 'Shared 4 pictures.'");
ok(savedLine("downloaded", 4) === "Downloaded 4 pictures.", "downloads read 'Downloaded 4 pictures.'");
ok(savedLine("folder", 1, "Pictures/person") === "Saved 1 picture in Pictures/person.", "a chosen folder is named, one picture is singular");
ok(!/Files\/|Downloads\//.test(savedLine("shared", 4) + savedLine("downloaded", 4)), "no made-up folder");
const many = Array.from({ length: 94 }, (_, i) => `person_${String(i + 1).padStart(4, "0")}.png`);
ok(nameList(many) === "person_0001.png, person_0002.png, person_0003.png and 91 more.", "94 names read as three and 'and 91 more.'");
ok(nameList(many.slice(0, 2)) === "person_0001.png, person_0002.png", "two names are listed whole");

const src = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");

// 1. One capture at a time.
const take = /async function takeShots\(long = false\) \{([\s\S]*?)\n  \}\n/.exec(src)?.[1] || "";
ok(/^\s*\/\/[^\n]*\n\s*if \(captureBusy\.current\) return;/.test(take), "a second tap returns at once while a capture runs");
ok(/captureBusy\.current = true;[\s\S]*?try \{\s*await captureFrames\(long, total\);\s*\} finally \{\s*captureBusy\.current = false;\s*setCapturing\(""\);/.test(take), "the busy flag is set before the first wait and always released");
ok(take.indexOf("captureBusy.current = true;") < take.indexOf("await "), "nothing waits before the capture is marked busy");
const add = /async function addFromDevice\(list: FileList \| null\) \{([\s\S]*?)\n  \}\n/.exec(src)?.[1] || "";
ok(/captureBusy\.current\) return;/.test(add) && /finally \{\s*captureBusy\.current = false;/.test(add), "From this device waits for a capture too");
ok((src.match(/<button type="button" disabled=\{Boolean\(capturing\)\} onClick=\{\(\) => void takeShots\((true)?\)\}>/g) || []).length === 2, "FROM SENSOR and 45–60 SEC are disabled while a capture runs");
ok(/<input type="file" accept="image\/\*" multiple disabled=\{Boolean\(capturing\)\}/.test(src), "From this device is disabled while a capture runs");
ok(/setCapturing\(`Picture \$\{i \+ 1\} of \$\{howMany\}`\)/.test(src) && /\{capturing && \(\s*<p className=\{styles\.muted\} aria-live="polite">/.test(src), "the dialog counts 'Picture 3 of 4' while it works");

// 2. How many on the glass.
ok(/<input type="number" inputMode="numeric" min=\{1\} max=\{12\} step=\{1\} value=\{count\}/.test(src), "How many opens a number keyboard, 1 to 12");
ok(/How many <span className=\{styles\.muted\}>Up to 12\.<\/span>/.test(src), "'Up to 12.' sits beside it");
ok(/\{howManyPictures\(count\)\.note && <p className=\{styles\.alert\}>\{howManyPictures\(count\)\.note\}<\/p>\}/.test(src), "a value outside 1–12 shows the sentence");
ok(!/Math\.min\(12, Math\.max\(1, Number\(count\) \|\| 4\)\)/.test(src), "the quiet clamp is gone");

// 3. Words.
ok(!/return `Files\/\$\{setName\}`/.test(src) && !/return `Downloads\/\$\{setName\}`/.test(src), "saveNumberedPictures never names a folder it did not make");
ok(/setLastSave\(\{ title: SAVED_TITLE\[saved\.how\], line: savedLine\(saved\.how, files\.length, saved\.where\)/.test(src), "the saved line comes from what the save did");
ok(/\{nameList\(trainStatus \? shots\.map\(\(shot\) => shot\.name \|\| ""\) : lastSave\.names\)\}/.test(src), "names are listed three at most");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
