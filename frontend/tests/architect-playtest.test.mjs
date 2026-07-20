// ARCHITECT-PLAYTEST lock (S9) — the guided demo script + replay engine is pure, deterministic, covers ALL building
// systems, and its computed totals equal the live libs. Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/architect-playtest.test.mjs
import { PLAYTEST_STEPS, PLAYTEST_SYSTEMS, runPlaytest } from "../lib/architect-playtest.ts";
import { waterRuns, sewerRuns, ductRuns, electricSpecs } from "../lib/mep-runs.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

// ── Script covers the full capability set the operator asked to demo ──
const systems = PLAYTEST_STEPS.map((s) => s.system);
ok(systems.join(",") === "layout,structural,electric,water,sewer,hvac", "steps cover layout + structural + electric + water + sewer + hvac in order");
ok(PLAYTEST_SYSTEMS.length === 6 && PLAYTEST_SYSTEMS.every((s) => systems.includes(s)), "PLAYTEST_SYSTEMS matches the scripted systems");
ok(PLAYTEST_STEPS.every((s) => s.title.length > 0 && s.detail.length > 0), "every step has a narrated title + detail (the 'what is possible' callout)");
ok(new Set(PLAYTEST_STEPS.map((s) => s.id)).size === PLAYTEST_STEPS.length, "step ids are unique");

// ── Replay is deterministic ──
const a = runPlaytest();
const b = runPlaytest();
ok(JSON.stringify(a) === JSON.stringify(b), "runPlaytest is deterministic (replay-safe)");
ok(a.length === PLAYTEST_STEPS.length, "one frame per step");

// ── Toggles ACCUMULATE (each system stays on once enabled) ──
const last = a[a.length - 1];
ok(last.toggles.structural && last.toggles.electric && last.toggles.water && last.toggles.sewer && last.toggles.hvac, "by the final frame every system is switched on (accumulated)");
ok(a[0].toggles.structural === false && a[0].toggles.water === false, "layout step starts with all systems off");

// ── Objects accumulate across steps ──
ok(a[0].objects.length === 3, "layout step places bed + door + window (3)");
ok(last.objects.length >= 6, "fixtures + shell accumulate by the end (>=6 objects)");

// ── Totals equal the SAME libs the live RoomDesigner uses (numbers the demo shows are real) ──
const waterFrame = a.find((f) => f.step.id === "water");
ok(waterFrame.totals.waterFt === waterRuns(waterFrame.objects).totalFt && waterFrame.totals.waterFt > 0, "water step total = waterRuns(objects).totalFt (>0)");
const sewerFrame = a.find((f) => f.step.id === "sewer");
ok(sewerFrame.totals.sewerFt === sewerRuns(sewerFrame.objects).totalFt && sewerFrame.totals.sewerFt > 0, "sewer step total = sewerRuns(objects).totalFt (>0)");
const elecFrame = a.find((f) => f.step.id === "electric");
ok(elecFrame.totals.wireFt === electricSpecs(4).wireFt && elecFrame.totals.circuits === electricSpecs(4).circuits && elecFrame.totals.amps === electricSpecs(4).amps, "electric step totals = electricSpecs(outlets)");
const hvacFrame = a.find((f) => f.step.id === "hvac");
ok(hvacFrame.totals.ductFt === ductRuns().totalFt && hvacFrame.totals.ductFt > 0, "hvac step total = ductRuns().totalFt (>0)");

// ── A system's total is 0 until its step turns it on ──
ok(a[0].totals.waterFt === 0 && a[0].totals.ductFt === 0 && a[0].totals.wireFt === 0, "no system totals before their steps enable them");

// ── outlets parameter flows through ──
ok(runPlaytest(PLAYTEST_STEPS, 8).find((f) => f.step.id === "electric").totals.wireFt === electricSpecs(8).wireFt, "outlets param feeds electricSpecs");

console.log(`\nARCHITECT-PLAYTEST ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
