// ARCHITECT-2525 ESTIMATE (AACE cone + gates) lock — pure + deterministic; drives the Sprint-4 decisions→tighter-
// estimates cone chart, confidence %, and gate advancement. Pins the AACE class/confidence/band model + rollup so a
// refactor can't silently loosen or shift the estimate cone. Run:
// node --experimental-strip-types tests/architect-estimate.test.mjs
import { GATES, LAST_GATE, classForGate, confidenceForGate, bandPctForGate, bandFor, DEFAULT_SECTIONS, rollupProject, advanceGate } from "../lib/architect-estimate.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── gates ──
ok(GATES.length === 14 && LAST_GATE === 13, "14 gates (0..13), LAST_GATE = 13");

// ── AACE class by gate + out-of-bounds clamp ──
ok(classForGate(0) === 5 && classForGate(6) === 3 && classForGate(13) === 1, "class: early=5 (rough) → late=1 (definitive)");
ok(classForGate(-5) === 5 && classForGate(999) === 1, "class clamps out-of-range gate");

// ── confidence rises, band tightens as the gate advances (the whole point of the cone) ──
ok(confidenceForGate(0) === 30 && confidenceForGate(13) === 95, "confidence 30% → 95%");
ok(bandPctForGate(0) === 0.55 && bandPctForGate(13) === 0.07, "band ±55% → ±7%");
let confMono = true, bandMono = true;
for (let g = 1; g <= 13; g++) { if (confidenceForGate(g) < confidenceForGate(g - 1)) confMono = false; if (bandPctForGate(g) > bandPctForGate(g - 1)) bandMono = false; }
ok(confMono, "confidence is monotonically non-decreasing across gates");
ok(bandMono, "band width is monotonically non-increasing across gates (cone narrows)");

// ── bandFor — symmetric around the estimate ──
ok(JSON.stringify(bandFor(100000, 0)) === JSON.stringify({ lo: 45000, hi: 155000, pct: 0.55 }), "bandFor gate 0 = ±55%");
ok(JSON.stringify(bandFor(100000, 13)) === JSON.stringify({ lo: 93000, hi: 107000, pct: 0.07 }), "bandFor gate 13 = ±7%");
const b = bandFor(100000, 5);
ok(b.lo < 100000 && b.hi > 100000 && Math.abs((100000 - b.lo) - (b.hi - 100000)) < 1e-6, "band is symmetric about the estimate");

// ── rollupProject — pinned totals for the default sections at gate 3 ──
const r = rollupProject(DEFAULT_SECTIONS, 3);
ok(r.manHours === 4060 && r.costUsd === 440000, "rollup pins man-hours 4060 + cost $440,000");
ok(r.aaceClass === 4 && r.aaceLabel === "Study" && r.confidencePct === 45, "rollup AACE class 4 (Study) @ 45% for gate 3");
ok(r.costBand.lo < r.costUsd && r.costUsd < r.costBand.hi, "cost estimate sits inside its band");
ok(JSON.stringify(r.costBand) === JSON.stringify({ lo: 246840, hi: 633160, pct: 0.439 }), "cost band pinned (±43.9%)");
ok(r.hoursBand.pct === r.costBand.pct, "hours + cost share the same band pct");
ok(JSON.stringify(rollupProject(DEFAULT_SECTIONS, 3)) === JSON.stringify(r), "rollupProject is deterministic");

// ── advanceGate — clamps at the last gate ──
ok(advanceGate(0) === 1 && advanceGate(13) === 13, "advanceGate steps up, clamps at LAST_GATE");

console.log(`\nARCHITECT-ESTIMATE ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
