// Innovation time engine (CRS-85→88): start date → schedule → unit scaling → ± tolerance
// bands that tighten by gate and widen with risk. Run:
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/innovation-time.test.mjs
import {
  scheduleFromStart, timeReadout, toleranceBand, workdaysInUnit, GATES, GATE_WORKDAYS,
  pSuccess, upsideFraction, RISK_P,
} from "../lib/innovation-data.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

// A synthetic project helper. Risk is now a discrete level (low/med/high) per Tech × Comm.
const P = (over) => ({
  id: "T", name: "T", division: "", manager: "", category: "", gate: "G1", confidence: 3,
  tech: "low", comm: "low", lob: "Defense & ISR", nreK: 9000, fullRev10yM: 100, doNothing10yM: 0,
  firstRevenue: "", criticalPath: false, humanLoad: 0, ai: 0, si: 0, hi: 0, predictions: 0, ...over,
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

// ── risk model: P(success) = P(tech) × P(comm); Low=.9 Med=.6 High=.3 ────────────────────
ok(near(RISK_P.low, 0.9) && near(RISK_P.med, 0.6) && near(RISK_P.high, 0.3), "risk probabilities Low/Med/High = .9/.6/.3");
ok(near(pSuccess(P({ tech: "low", comm: "low" })), 0.81), "Low/Low captures 81% of revenue");
ok(near(pSuccess(P({ tech: "high", comm: "high" })), 0.09), "High/High captures 9% of revenue");
ok(near(upsideFraction(P({ tech: "low", comm: "low" })), 0.19), "Low/Low upside = 19%");
ok(near(upsideFraction(P({ tech: "high", comm: "high" })), 0.91), "High/High upside = 91%");

// ── tolerance band: ±50%×riskMult at Concept (G1) tightening to ±5% at Launch (G6) ────────
// Low/Low → riskMult 1.1: G1 = .5×1.1 = .55, G6 = .05×1.1 = .055.
ok(near(toleranceBand(P({ gate: "G1" })), 0.55), "G1 Low/Low band = ±55%");
ok(near(toleranceBand(P({ gate: "G6" })), 0.055), "G6 Low/Low band = ±5.5%");
ok(toleranceBand(P({ gate: "G1" })) > toleranceBand(P({ gate: "G6" })), "band tightens gate over gate");

// ── risk widens the band, capped at 60% ──────────────────────────────────────────────────
ok(toleranceBand(P({ gate: "G1", tech: "high", comm: "high" })) === 0.6, "high risk widens band, capped 60%");
ok(toleranceBand(P({ gate: "G3", tech: "med", comm: "med" })) > toleranceBand(P({ gate: "G3", tech: "low", comm: "low" })), "risk widens vs low-risk at same gate");

// ── readout: unit-consistent (min = day×480), band applied lo<value<hi, $/min > 0 ────────
const day = timeReadout(P(), "2026-01-05", "day");
const min = timeReadout(P(), "2026-01-05", "minute");
ok(near(min.time.value, day.time.value * 8 * 60, 1e-3), "minute time = day × 480");
ok(near(day.cost.value, min.cost.value, 1e-3), "cost remaining is unit-invariant");
ok(day.time.lo < day.time.value && day.time.value < day.time.hi, "± band brackets the point estimate");
ok(day.costPerMinUsd > 0, "cost of time $/min positive");
// cost remaining for a G1 project (whole program ahead) ≈ nre
ok(Math.abs(day.cost.value - 9_000_000) < 5000, "G1 cost remaining ≈ full NRE");

/* ---------------- growth model (CRS-69) ---------------- */
import { growthModel } from "../lib/innovation-data.ts";
const gm = growthModel([P({ doNothing10yM: 600, tech: "low", comm: "low", fullRev10yM: 900 })], { years: 6, growth: 0.038, decline: 0.15 });
ok(gm.length === 6, "growth model spans 6 years");
ok(gm[0].doNothing > gm[5].doNothing, "do-nothing declines YoY");
ok(gm[5].target > gm[0].target, "target grows YoY");
ok(gm.every((r) => r.remaining >= 0), "remaining-to-target never negative");
ok(gm[5].weighted >= gm[0].weighted, "weighted NPI ramps in");

/* ---------------- Rack & Stack 2525: hierarchy + crowd-sourced risk register ---------------- */
import {
  hierOf, hierValues, filterByHier, DEMO_PROJECTS,
  riskScore, riskExposure, riskPriority, riskBand, riskRollup, DEMO_RISKS, growthModel as gm2,
  SBU_BASE, companyBaseM, lobBaseM, companyRollup, sayDo,
} from "../lib/innovation-data.ts";

// ── hierarchy: Company → LOB (SBU) → Product Group, cascading + filter ──
const h1 = hierOf(DEMO_PROJECTS[0]);
ok(!!h1.bu && !!h1.sbu && !!h1.material, "hierOf returns a full LOB→Material path");
ok(hierValues(DEMO_PROJECTS, "bu").length === 3, "exactly 3 LOBs (SBU-1/2/3)");
const pgsOfSbu1 = hierValues(DEMO_PROJECTS, "sbu", { level: "bu", value: "SBU-1" });
ok(pgsOfSbu1.every((pg) => ["PG-1", "PG-2", "PG-3"].includes(pg)), "cascading Product Groups respect LOB parent");
ok(filterByHier(DEMO_PROJECTS, "bu", "SBU-3").every((p) => hierOf(p).bu === "SBU-3"), "filterByHier scopes to LOB");
ok(filterByHier(DEMO_PROJECTS, "bu", "All").length === DEMO_PROJECTS.length, "filterByHier All = passthrough");

// ── LOB base revenue + company rollup (operator: 300 / 100 / 300 → 700M) ──
ok(SBU_BASE["SBU-1"] === 300 && SBU_BASE["SBU-2"] === 100 && SBU_BASE["SBU-3"] === 300, "LOB base revenues 300/100/300");
ok(companyBaseM() === 700, "company base = Σ LOB = 700M");
ok(lobBaseM("SBU-2") === 100 && lobBaseM("All") === 700, "lobBaseM: LOB and company (All)");
const cr = companyRollup(DEMO_PROJECTS);
ok(cr.lobs.length === 3 && cr.company.count === DEMO_PROJECTS.length, "rollup: 3 LOBs, company counts all projects");
ok(cr.lobs.every((l) => l.groups.length >= 1), "each LOB rolls up ≥1 Product Group");
// ── growth model base override anchors the do-nothing baseline ──
ok(gm2(DEMO_PROJECTS, { years: 1, baseOverrideM: 300 })[0].doNothing === 300, "baseOverrideM anchors year-0 do-nothing");
ok(gm2(DEMO_PROJECTS, { years: 1, baseOverrideM: 0 })[0].doNothing === 0, "grey jump-off settable to zero (per-project)");

// ── Say/Do ratio (planned ÷ delivered): high-confidence low-risk beats plan; clamped ──
const sdHi = sayDo(P({ confidence: 4, tech: "low", comm: "low", criticalPath: true }));
const sdLo = sayDo(P({ confidence: 1, tech: "high", comm: "high" }));
ok(sdHi.schedule >= 1 && sdHi.budget >= 1, "high-confidence low-risk Say/Do ≥ 1.0");
ok(sdLo.schedule < 1, "low-confidence high-risk Say/Do < 1.0");
ok([sdHi, sdLo].every((s) => s.time >= 0.6 && s.time <= 1.4), "Say/Do clamped to [0.6, 1.4]");

// ── risk scoring: severity×likelihood, status collapses exposure, votes lift priority ──
const rOpen = { severity: 4, likelihood: 4, status: "open", votes: 0 };
const rMit = { ...rOpen, status: "mitigated" };
ok(riskScore(rOpen) === 16, "riskScore = severity × likelihood");
ok(riskExposure(rMit) < riskExposure(rOpen), "mitigated status collapses exposure");
ok(riskPriority({ ...rOpen, votes: 30 }) > riskPriority(rOpen), "community votes lift priority");
ok(riskBand({ severity: 5, likelihood: 5 }) === "critical", "5×5 = critical band");
ok(riskBand({ severity: 1, likelihood: 2 }) === "low", "2 = low band");

// ── rollup: retired fraction rises as risks are mitigated ──
const roll = riskRollup(DEMO_RISKS, "PRJ-01");
ok(roll.count >= 1 && roll.rawExposure > 0, "rollup finds project risks + raw exposure");
ok(roll.retired >= 0 && roll.retired <= 1, "retired fraction within [0,1]");

// ── growth model Revenue Options: new-product-only < full R&S incremental ──
const full = gm2(DEMO_PROJECTS, { years: 3, revMode: "full" });
const newOnly = gm2(DEMO_PROJECTS, { years: 3, revMode: "new" });
ok(newOnly[2].weighted < full[2].weighted, "Revenue Option 'new' scales NPI below 'full'");
ok(full.length === 3, "growth model honors # Years = 3");

console.log(`\nINNOVATION-TIME ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
