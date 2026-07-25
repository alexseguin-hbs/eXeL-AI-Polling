// Innovation time engine (CRS-85→88): start date → schedule → unit scaling → ± tolerance
// bands that tighten by gate and widen with risk. Run:
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/innovation-time.test.mjs
import {
  scheduleFromStart, timeReadout, toleranceBand, workdaysInUnit, GATES, GATE_WORKDAYS,
} from "../lib/innovation-data.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

// A synthetic project helper.
const P = (over) => ({
  id: "T", name: "T", division: "", manager: "", category: "", gate: "G1", confidence: 3,
  techRisk: 0, commRisk: 0, nreK: 9000, fullRev10yM: 100, doNothing10yM: 0, firstRevenue: "",
  criticalPath: false, humanLoad: 0, ai: 0, si: 0, hi: 0, predictions: 0, ...over,
});

// ── unit scaling: 21 workdays = 1 month = 4.2 wk = 21 d = 168 h = 10080 min ──────────────
ok(near(workdaysInUnit(21, "month"), 1), "21 workdays = 1 month");
ok(near(workdaysInUnit(21, "week"), 4.2), "21 workdays = 4.2 weeks");
ok(near(workdaysInUnit(21, "day"), 21), "21 workdays = 21 days");
ok(near(workdaysInUnit(21, "hour"), 168), "21 workdays = 168 h");
ok(near(workdaysInUnit(21, "minute"), 10080), "21 workdays = 10080 min");

// ── schedule: 7 gate rows, monotonic dates, first revenue = G6 end ───────────────────────
const s = scheduleFromStart(P(), "2026-01-05");
ok(s.rows.length === 7, "schedule has 7 gates");
ok(s.rows.every((r, i) => i === 0 || r.startISO >= s.rows[i - 1].startISO), "gate dates monotonic");
ok(s.firstRevenueISO === s.rows.find((r) => r.gate === "G6").endISO, "first revenue = G6 end (derived)");
ok(s.totalWorkdays === GATES.reduce((a, g) => a + GATE_WORKDAYS[g], 0), "total workdays sums gate profile");

// ── tolerance band: ~±50% at Concept (G1, no risk) tightening to ±5% at Launch (G6) ──────
ok(near(toleranceBand(P({ gate: "G1" })), 0.5), "G1 no-risk band = ±50%");
ok(near(toleranceBand(P({ gate: "G6" })), 0.05), "G6 no-risk band = ±5%");
ok(toleranceBand(P({ gate: "G1" })) > toleranceBand(P({ gate: "G6" })), "band tightens gate over gate");

// ── risk widens the band, capped at 60% ──────────────────────────────────────────────────
ok(toleranceBand(P({ gate: "G1", techRisk: 0.8, commRisk: 0.8 })) === 0.6, "high risk widens band, capped 60%");
ok(toleranceBand(P({ gate: "G3", techRisk: 0.5, commRisk: 0.5 })) > toleranceBand(P({ gate: "G3" })), "risk widens vs no-risk at same gate");

// ── readout: unit-consistent (min = day×480), band applied lo<value<hi, $/min > 0 ────────
const day = timeReadout(P(), "2026-01-05", "day");
const min = timeReadout(P(), "2026-01-05", "minute");
ok(near(min.time.value, day.time.value * 8 * 60, 1e-3), "minute time = day × 480");
ok(near(day.cost.value, min.cost.value, 1e-3), "cost remaining is unit-invariant");
ok(day.time.lo < day.time.value && day.time.value < day.time.hi, "± band brackets the point estimate");
ok(day.costPerMinUsd > 0, "cost of time $/min positive");
// cost remaining for a G1 project (whole program ahead) ≈ nre
ok(Math.abs(day.cost.value - 9_000_000) < 5000, "G1 cost remaining ≈ full NRE");

console.log(`\nINNOVATION-TIME ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
