// The glass tells the truth and never traps the person (rev 42).
// 1. Every dialog fits the screen: at 844x390 the Capture dialog was 630 px tall and its buttons sat off screen.
// 2. Escape or a tap outside closes a dialog.
// 3. An alert is only what this frame sees: SENSOR 1 OFF clears the alert, the boxes and the bar.
// 4. Back on the camera screen, the open stream is attached to the new video (it showed ON over black).
// Run: node tests/sensor-fusion-glass.test.mjs

import fs from "node:fs";
import path from "node:path";

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
const src = fs.readFileSync(path.resolve(here, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
const css = fs.readFileSync(path.resolve(here, "../app/SensorFusion-2525/sensor-fusion.module.css"), "utf8");

// 1. Fit.
const modal = [...css.matchAll(/(^|\n)\.modal \{([^}]*)\}/g)].map((m) => m[2]).join("\n");
ok(/max-height:\s*calc\(var\(--sf-h, 100dvh\) - 32px\)/.test(modal), "a dialog is never taller than the screen");
ok(/overflow:\s*auto/.test(modal), "a tall dialog scrolls inside itself");
ok(/\.modal \.actions \{[^}]*position:\s*sticky[^}]*bottom:/.test(css), "the dialog's buttons stay in view");

// 2. Close.
ok(/<div className=\{styles\.modalWrap\} onClick=\{\(\) => setAnnotate\(false\)\}>/.test(src), "a tap outside closes Capture");
ok(/<div className=\{styles\.modalWrap\} onClick=\{\(\) => setSavedNote\(false\)\}>/.test(src), "a tap outside closes Pictures saved");
ok((src.match(/role="dialog" aria-label="(Capture images|Upload)" onClick=\{\(event\) => event\.stopPropagation\(\)\}/g) || []).length === 2, "a tap inside a dialog does not close it");
ok(/event\.key !== "Escape"[\s\S]{0,80}setAnnotate\(false\);\s*setSavedNote\(false\);\s*setInfoOpen\(false\);/.test(src), "Escape closes Capture, Pictures saved and Info");
// rev 43: rev 42's ledger said every dialog closes with Escape; Settings and the model list did not (Aset, Athena, Enlil).
const esc = /useEffect\(\(\) => \{\n    \/\/ Every dialog closes with Escape([\s\S]*?)\}, \[([^\]]*)\]\);/.exec(src);
ok(esc && /setSettings\(false\);/.test(esc[1]) && /setModelsOpen\(false\);/.test(esc[1]), "Escape closes Settings and the model list");
ok(esc && /!settings && !modelsOpen\) return;/.test(esc[1]) && /settings, modelsOpen/.test(esc[2]), "the Escape listener is on while Settings or the model list is open");

// 2b. The labeler never hides its own controls (rev 43; Asar, Athena, Enki, Pangu). The rendered check is scripts/sf-layout-smoke.mjs.
const block = (sel) => [...css.matchAll(new RegExp("(^|\\n)" + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " \\{([^}]*)\\}", "g"))].map((m) => m[2]).join("\n");
const labelFill = block(".labelFill");
ok(/overflow-y:\s*auto/.test(labelFill) && !/overflow:\s*hidden/.test(labelFill), "the labeler pane scrolls (rev 36 had overflow: hidden)");
ok(/flex-shrink:\s*0/.test(block(".labelFill > *")), "no part of the labeler shrinks to nothing");
ok(/flex:\s*0 0 auto/.test(block(".film")) && /min-height:\s*[4-9]\dpx/.test(block(".film")), "the film strip keeps its height");
ok(/flex:\s*1 0 auto/.test(block(".labelFit")), "the picture grows but never shrinks below itself");
ok(/position:\s*sticky/.test(block(".labelDock")) && /bottom:\s*0/.test(block(".labelDock")), "SAVE BOX, LEVEL 2, MERGE and FILES stay at the bottom of the pane while it scrolls");
ok(/@media \(orientation: landscape\) and \(max-height: 520px\) \{\s*\.labelFrame img \{\s*max-height: min\(46dvh, 240px, calc\(var\(--sf-h, 100dvh\) - 220px\)\);[\s\S]*?\.labelDock \{\s*display: flex;/.test(css), "held sideways, the picture fits above the buttons and the note sits beside them");
const dock = /<div className=\{styles\.labelDock\}>([\s\S]*?)\n        <\/div>\n        \{pic && \(marks/.exec(src)?.[1] || "";
ok(/<div className=\{styles\.labelBar\}>/.test(dock) && /\{note && \(/.test(dock), "the last note rides with the buttons, so a refused save is never out of sight");
fs.existsSync(path.resolve(here, "../scripts/sf-layout-smoke.mjs")) ? ok(/sf-layout-smoke\.mjs/.test(fs.readFileSync(path.resolve(here, "../scripts/smoke-if-chromium.mjs"), "utf8")), "the rendered labeler check runs after every build") : ok(false, "scripts/sf-layout-smoke.mjs exists");

// 3. Off means off.
const close = /function closeSensor\(\) \{([\s\S]*?)\n  \}/.exec(src)?.[1] || "";
ok(/clearReadout\(\);/.test(close), "SENSOR 1 OFF clears what was on screen");
const clear = /function clearReadout\(\) \{([\s\S]*?)\n  \}/.exec(src)?.[1] || "";
ok(/setAlert\(""\)/.test(clear) && /lastAlert\.current = ""/.test(clear), "the alert line goes");
ok(/clearRect\(0, 0, canvas\.width, canvas\.height\)/.test(clear), "the boxes go");
ok(/fill\.style\.height = "0%"/.test(clear), "the bar goes to zero");
ok(/stop = true;\s*lastAlert\.current = "";\s*setAlert\(""\);\s*\};\s*\}, \[sensorOn, model, step\]\);/.test(src), "when the detector stops, its last alert stops too");

// 4. Back to the camera.
ok(/if \(step !== "work"\) return;\s*const stream = streamRef\.current;[\s\S]{0,400}video\.srcObject = stream;/.test(src), "the camera screen re-attaches the open stream");
ok(/track\.readyState === "ended"[\s\S]{0,80}setSensorOn\(false\)/.test(src), "an ended stream reads SENSOR 1 OFF, not ON over black");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
