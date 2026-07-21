// ARCHITECT-2525 HOUSE BUILD-SPEC lock — componentEstimate + phase model + parallel-install schedule are pure and
// deterministic (they drive the Build cost/timeline + R5 overlapping schedule). Pins the per-system cost/phase table
// exactly and the estimator's invariants (parallel ≤ sequential, savedDays consistency) without hard-coding the layer
// tree's leaf counts. Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-house.test.mjs
import { componentEstimate, houseEstimate, houseSchedule, PHASES } from "../lib/architect-house.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── PHASES — 6 ordered install phases; MEP is the parallel one ──
ok(PHASES.length === 6, "6 install phases");
ok(JSON.stringify(PHASES.map((p) => p.id)) === JSON.stringify(["site", "foundation", "framing", "envelope", "mep", "finish"]), "phase order site→finish");
ok(PHASES.find((p) => p.id === "mep").label.includes("parallel"), "MEP labeled parallel");

// ── componentEstimate — exact per-system cost/days/phase table (tree-independent) ──
const EXP = {
  "physical/site": { cost: 2000, days: 2, phase: "site" },
  "physical/foundation": { cost: 6000, days: 3, phase: "foundation" },
  "physical/structure": { cost: 4000, days: 2, phase: "framing" },
  "physical/building-envelope": { cost: 3500, days: 2, phase: "envelope" },
  "physical/mechanical": { cost: 2500, days: 2, phase: "mep" },
  "physical/electrical": { cost: 2000, days: 2, phase: "mep" },
  "physical/plumbing": { cost: 2200, days: 2, phase: "mep" },
  "physical/interior": { cost: 2000, days: 2, phase: "finish" },
  "physical/exterior": { cost: 2500, days: 2, phase: "finish" },
};
let tableOk = true;
for (const [id, e] of Object.entries(EXP)) { if (JSON.stringify(componentEstimate(id)) !== JSON.stringify(e)) { ok(false, `componentEstimate(${id})`); tableOk = false; } }
ok(tableOk, "componentEstimate matches the per-system cost/days/phase table exactly");
ok(["mechanical", "electrical", "plumbing", "fire-protection", "communications-low-voltage"].every((s) => componentEstimate(`physical/${s}`).phase === "mep"), "all MEP systems share the parallel 'mep' phase");
ok(componentEstimate("physical/unknown") === null && componentEstimate("bogus") === null && componentEstimate("") === null, "unknown/malformed id → null");
// a deep leaf id still resolves by its top physical/<system> segment
ok(componentEstimate("physical/electrical/panel/breaker").phase === "mep", "deep leaf resolves by system segment");

// ── houseEstimate — invariants (robust to layer-tree leaf counts) ──
const est = houseEstimate(["physical/structure", "physical/electrical"]); // framing + mep → 2 phases
ok(est.count > 0 && est.cost > 0, "houseEstimate resolves selected branches to buildable leaves + cost");
ok(est.cost === est.byPhase.reduce((a, p) => a + p.cost, 0), "total cost = sum of per-phase costs");
ok(est.parallelDays <= est.sequentialDays, "parallel install is never slower than sequential");
ok(est.byPhase.every((p) => PHASES.some((ph) => ph.id === p.phase)), "every rollup phase is a known phase");
// byPhase preserves canonical phase order
const order = PHASES.map((p) => p.id);
ok(est.byPhase.every((p, i, a) => i === 0 || order.indexOf(a[i - 1].phase) < order.indexOf(p.phase)), "byPhase in canonical phase order");

// ── houseSchedule — overlapping bars; savedDays = sequential − critical path ──
const sch = houseSchedule(["physical/structure", "physical/electrical", "physical/interior"]);
ok(sch.phases.length > 0 && sch.totalDays > 0, "schedule has phases + a positive critical path");
ok(sch.savedDays === Math.max(0, sch.sequentialDays - sch.totalDays), "savedDays = sequential − totalDays (never negative)");
ok(sch.phases.every((p) => p.start >= 0), "every phase starts on/after day 0");

// ── empty selection → zeroed estimate, never throws ──
const empty = houseEstimate([]);
ok(empty.count === 0 && empty.cost === 0 && empty.byPhase.length === 0, "empty selection → zeroed estimate");

// ── determinism ──
ok(JSON.stringify(houseEstimate(["physical/structure", "physical/electrical"])) === JSON.stringify(est), "houseEstimate is deterministic");

console.log(`\nARCHITECT-HOUSE ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
