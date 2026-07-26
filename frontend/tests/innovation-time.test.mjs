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
  SBU_BASE, companyBaseM, lobBaseM, companyRollup, sayDo, execOf, briefOf,
  buBaseM, scopeBaseM, GATE_DELIVERABLES, GATES as GATE_LIST, rackByLevel, projectRevSeries,
  bomOf, bomStdCost, bomExtended, productionCost,
} from "../lib/innovation-data.ts";

// ── hierarchy: Company → BU → SBU → Product Group, cascading + filter ──
const h1 = hierOf(DEMO_PROJECTS[0]);
ok(!!h1.bu && !!h1.sbu && !!h1.pgroup && !!h1.material, "hierOf returns full BU→SBU→PG→Material path");
ok(hierValues(DEMO_PROJECTS, "bu").length === 3, "3 BUs (MS/DS/AP)");
ok(hierValues(DEMO_PROJECTS, "sbu").length === 8, "8 SBUs (MSP/MSE·DSI/DSE/DSC·AP1/AP2/AP3)");
const sbusOfMS = hierValues(DEMO_PROJECTS, "sbu", { level: "bu", value: "MS" });
ok(sbusOfMS.includes("MSP") && sbusOfMS.includes("MSE") && !sbusOfMS.includes("DSI"), "cascading SBUs respect BU parent");
ok(filterByHier(DEMO_PROJECTS, "sbu", "DSC").every((p) => hierOf(p).sbu === "DSC"), "filterByHier scopes to SBU");
ok(filterByHier(DEMO_PROJECTS, "bu", "All").length === DEMO_PROJECTS.length, "filterByHier All = passthrough");
// codes: BU 2-letter, SBU 3-letter, Alpha Group alphanumeric, Alpha Code 4-char
ok(DEMO_PROJECTS.every((p) => hierOf(p).bu.length === 2 && hierOf(p).sbu.length === 3 && hierOf(p).alpha.length === 4), "BU=2-letter · SBU=3-letter · Alpha Code=4-char");

// ── SBU base revenue + BU/Company rollup (Σ SBU = 700M; BU = Σ its SBUs) ──
ok(SBU_BASE.MSP === 150 && SBU_BASE.DSI === 100 && SBU_BASE.AP2 === 80, "SBU base revenues set per SBU");
ok(companyBaseM() === 700, "company base = Σ SBU = 700M");
ok(buBaseM("MS") === 300 && buBaseM("DS") === 200 && buBaseM("AP") === 200, "BU base = Σ its SBUs (MS 300 · DS 200 · AP 200)");
ok(scopeBaseM("All", "All") === 700 && scopeBaseM("MS", "All") === 300 && scopeBaseM("x", "MSP") === 150, "scopeBaseM: Company/BU/SBU");
const cr = companyRollup(DEMO_PROJECTS);
ok(cr.bus.length === 3 && cr.company.count === DEMO_PROJECTS.length, "rollup: 3 BUs, company counts all projects");
ok(cr.bus.every((b) => b.sbus.length >= 1 && b.sbus.every((s) => s.groups.length >= 1)), "BU → SBU → Product Group nesting");

// ── minimum deliverables per gate (AIML gate-deliverables) ──
ok(GATE_LIST.every((g) => GATE_DELIVERABLES[g] && GATE_DELIVERABLES[g].length >= 1), "every gate G1–G7 has ≥1 min deliverable");
ok(GATE_DELIVERABLES.G1.includes("Executive Summary") && GATE_DELIVERABLES.G7.includes("End-of-Life Strategy"), "Concept + Retire deliverables match the AIML slide");

// ── level-aware Rack & Stack: aggregate to any hierarchy tier, sorted by NPV, sums preserved ──
const rackSbu = rackByLevel(DEMO_PROJECTS, "sbu");
ok(rackSbu.length === 8, "rackByLevel SBU → 8 rows");
ok(rackSbu.every((r, i) => i === 0 || rackSbu[i - 1].npvM >= r.npvM), "rack rows sorted by NPV desc");
ok(Math.abs(rackSbu.reduce((s, r) => s + r.count, 0) - DEMO_PROJECTS.length) < 1e-9, "rack SBU counts sum to portfolio");
ok(rackByLevel(DEMO_PROJECTS, "bu").length === 3 && rackByLevel(DEMO_PROJECTS, "material").length === DEMO_PROJECTS.length, "rack BU=3, Material# = one per project (BOM)");

// ── aging-portfolio financial model: old line declines (no innovation); new product ramps if funded ──
const P01 = DEMO_PROJECTS.find((p) => p.id === "PRJ-01");
const sFund = projectRevSeries(P01, { years: 10, funded: true });
const sNone = projectRevSeries(P01, { years: 10, funded: false });
ok(sFund.length === 10, "projectRevSeries → 10-year projection");
ok(sNone[9].oldDecline < sNone[0].oldDecline, "old product line declines without innovation");
ok(sNone.every((r) => r.newRamp === 0), "no-innovation scenario has zero new-product revenue");
ok(sFund.reduce((s, r) => s + r.newRamp, 0) > 0 && Math.abs(sFund.reduce((s, r) => s + r.newRamp, 0) - P01.fullRev10yM) < 1, "funded new-product ramp sums to 10-yr new revenue");
ok(sFund[5].total > sNone[5].total, "with new product beats no-innovation total");

// ── BOM per Product #: Material #s + standard cost (Labor/Material/Machining/Other) roll up ──
const bom = bomOf(P01);
ok(bom.length >= 3, "Product # has a multi-line BOM (Material #s)");
ok(bom.every((l) => bomStdCost(l) === l.labor + l.matl + l.machining + l.other), "std cost = Labor+Material+Machining+Other");
ok(Math.abs(productionCost(P01) - bom.reduce((s, l) => s + bomExtended(l), 0)) < 1e-9, "production cost = Σ extended BOM lines");
ok(bom.some((l) => l.kind === "raw") && bom.some((l) => l.kind === "partial") && bom.some((l) => l.kind === "complete"), "BOM has raw + partial + complete lines");
// number scheme: raw 1xxxxxx · partial 3xxxxx · complete 5xxxxx · product 7xxxx-yyy
ok(bom.filter((l) => l.kind === "raw").every((l) => l.material.startsWith("1")), "raw purchased # start with 1");
ok(bom.filter((l) => l.kind === "partial").every((l) => l.material.startsWith("3")), "partial assembly # start with 3");
ok(bom.filter((l) => l.kind === "complete").every((l) => l.material.startsWith("5")), "complete assembly # start with 5");
ok(hierOf(P01).product.startsWith("7") && hierOf(P01).product.length === 5, "Product # = 7xxxx (5-digit)");
ok(/^7\d{4}-\d{3}$/.test(hierOf(P01).material), "Material # = 7xxxx-yyy (product + variant)");
ok(JSON.stringify(bomOf(P01)) === JSON.stringify(bomOf(P01)), "BOM deterministic");
// ── growth model base override anchors the do-nothing baseline ──
ok(gm2(DEMO_PROJECTS, { years: 1, baseOverrideM: 300 })[0].doNothing === 300, "baseOverrideM anchors year-0 do-nothing");
ok(gm2(DEMO_PROJECTS, { years: 1, baseOverrideM: 0 })[0].doNothing === 0, "grey jump-off settable to zero (per-project)");

// ── Say/Do ratio (planned ÷ delivered): high-confidence low-risk beats plan; clamped ──
const sdHi = sayDo(P({ confidence: 4, tech: "low", comm: "low", criticalPath: true }));
const sdLo = sayDo(P({ confidence: 1, tech: "high", comm: "high" }));
ok(sdHi.schedule >= 1 && sdHi.budget >= 1, "high-confidence low-risk Say/Do ≥ 1.0");
ok(sdLo.schedule < 1, "low-confidence high-risk Say/Do < 1.0");
ok([sdHi, sdLo].every((s) => s.time >= 0.6 && s.time <= 1.4), "Say/Do clamped to [0.6, 1.4]");

// ── AMTS exec one-pager: brief + exec fields present for every project ──
ok(DEMO_PROJECTS.every((p) => briefOf(p).needs.length && briefOf(p).evidence.length), "every project has an AMTS brief (Needs…Evidence)");
ok(DEMO_PROJECTS.every((p) => { const e = execOf(p); return e.marginPct > 0 && e.marginPct <= 100 && !!e.customer && e.pursuits.length >= 1; }), "every project has AMTS exec fields (margin/customer/pursuits)");

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

/* ---------------- Gate Requirements registry (SPEC §3) ---------------- */
import {
  GATE_REQUIREMENTS, requirementsAt, requirementStatus, gateReadiness, gateReadinessAll,
  gateVariance, TOLERANCE_LADDER, REQ_SATISFIED, GATES as GATE_G,
} from "../lib/innovation-data.ts";

// registry unifies the three sources (§3.1): S-slides + CRS rows + DR/TR/IS/DT/DC derivatives
ok(GATE_REQUIREMENTS.length >= 25, "unified registry has all requirement rows");
ok(GATE_REQUIREMENTS.some((r) => r.type === "S") && GATE_REQUIREMENTS.some((r) => r.type === "CRS"), "registry folds S-slides + CRS rows");
ok(["DR", "TR", "IS", "DT", "DC"].every((t) => GATE_REQUIREMENTS.some((r) => r.type === t)), "registry carries DR/TR/IS/DT/DC traceability rows");
ok(GATE_REQUIREMENTS.every((r) => !!r.id && !!r.title && !!r.verification && GATE_G.includes(r.earliestGate)), "every requirement has id/title/verification/earliestGate");

// tolerance ladder §3.4 — ±60/40/20/10/5% tightening gate over gate
ok(TOLERANCE_LADDER.G1 === 0.6 && TOLERANCE_LADDER.G2 === 0.4 && TOLERANCE_LADDER.G3 === 0.2 && TOLERANCE_LADDER.G5 === 0.05, "tolerance ladder ±60/40/20/…/5%");
ok(GATE_G.every((g, i) => i === 0 || TOLERANCE_LADDER[GATE_G[i - 1]] >= TOLERANCE_LADDER[g]), "tolerance band tightens (never widens) gate over gate");
ok(GATE_REQUIREMENTS.every((r) => r.band === TOLERANCE_LADDER[r.earliestGate]), "requirement band matches ladder at its earliest gate");

// requirementsAt is cumulative (earliest ≤ gate) and grows monotonically
ok(requirementsAt("G1").length >= 1, "G1 has required rows");
ok(requirementsAt("G7").length === GATE_REQUIREMENTS.length, "by G7 every requirement is required");
ok(GATE_G.every((g, i) => i === 0 || requirementsAt(g).length >= requirementsAt(GATE_G[i - 1]).length), "requirement count is cumulative by gate");

// per-project status derived from gate progression (approved ≤ done, in_work = next, else not_started)
const G3proj = P({ gate: "G3" });
const doneReq = GATE_REQUIREMENTS.find((r) => r.earliestGate === "G2");
const nextReq = GATE_REQUIREMENTS.find((r) => r.earliestGate === "G4");
const farReq = GATE_REQUIREMENTS.find((r) => r.earliestGate === "G6");
ok(requirementStatus(doneReq, G3proj) === "approved", "requirement at a completed gate reads Approved");
ok(requirementStatus(nextReq, G3proj) === "in_work", "requirement at the next gate reads In Work");
ok(requirementStatus(farReq, G3proj) === "not_started", "requirement beyond next gate reads Not Started");

// gate readiness rollup §3.5 — % satisfied, blocking list, single verdict
const rdyG1 = gateReadiness(G3proj, "G1");
ok(rdyG1.ready === true && rdyG1.blocking.length === 0, "a completed gate is Ready with no blockers");
const rdyG5 = gateReadiness(G3proj, "G5");
ok(rdyG5.ready === false && rdyG5.blocking.length > 0, "a future gate is Not Ready with blockers");
ok(rdyG5.pct >= 0 && rdyG5.pct <= 100 && rdyG5.satisfied <= rdyG5.required, "readiness pct/satisfied within bounds");
ok(gateReadinessAll(G3proj).length === 7, "gateReadinessAll covers G1–G7");
ok(REQ_SATISFIED.includes("approved") && REQ_SATISFIED.includes("waived") && REQ_SATISFIED.includes("na"), "satisfied statuses = approved/waived/na");

// estimate-tolerance variance disposition §3.4 — beyond band raises an exception
const vOk = gateVariance(100, 110, "G3");   // +10% within ±20% band
const vBad = gateVariance(100, 140, "G3");  // +40% beyond ±20% band
ok(near(vOk.deltaPct, 0.1) && vOk.exceeds === false, "within-band variance is accepted");
ok(near(vBad.deltaPct, 0.4) && vBad.exceeds === true, "beyond-band variance raises an exception");
ok(gateVariance(0, 50, "G1").exceeds === true, "growth from a zero prior raises an exception");
ok(gateVariance(0, 0, "G1").exceeds === false, "zero-to-zero is not an exception");

/* ---------------- Deck gaps: meta · 12 metrics · financials overview · dependencies ---------------- */
import {
  STRATEGIC_INITIATIVES, VALUE_LADDER, COMPETITIVE_POSITIONS, metaOf,
  financialMetrics, financialsOverview,
  DEMO_DEPS, dependsOn, dependentsOf, dependencySummary,
} from "../lib/innovation-data.ts";

// meta (§2.1): 4 strategic initiatives + value ladder + target market + competitive, derived for every project
ok(STRATEGIC_INITIATIVES.length === 4, "exactly 4 strategic initiatives (Sensor Leadership · Unmanned & Autonomous · Airborne ISR · Decision Support)");
ok(DEMO_PROJECTS.every((p) => { const m = metaOf(p); return STRATEGIC_INITIATIVES.includes(m.initiative) && VALUE_LADDER.includes(m.valueLadder) && COMPETITIVE_POSITIONS.includes(m.competitive) && !!m.targetMarket && !!m.valueImpact; }), "every project derives a full meta set (initiative/ladder/impact/market/competitive)");
ok(metaOf(DEMO_PROJECTS.find((p) => p.id === "PRJ-02")).initiative === "Unmanned & Autonomous Applications", "swarm-AI project → Unmanned & Autonomous initiative");
ok(JSON.stringify(metaOf(DEMO_PROJECTS[0])) === JSON.stringify(metaOf(DEMO_PROJECTS[0])), "metaOf deterministic");

// 12-metric Project Metrics card set (§2.4 / IMG_7843)
const fm = financialMetrics(DEMO_PROJECTS.find((p) => p.id === "PRJ-01"));
ok(["npvM", "revOverNre", "irrPct", "grossMarginPct", "paybackYears", "vol10y", "rev10yM", "grossProfit10yM", "curYearOpexK", "totalRdOpexK", "capitalK", "manHours"].every((k2) => k2 in fm), "financialMetrics returns all 12 metrics");
ok(fm.totalRdOpexK === DEMO_PROJECTS.find((p) => p.id === "PRJ-01").nreK, "Total R&D Op Expense = project NRE");
ok(fm.capitalK < fm.totalRdOpexK && fm.curYearOpexK < fm.totalRdOpexK, "capital + current-year opex are fractions of total R&D");
ok(fm.grossProfit10yM > 0 && fm.grossProfit10yM <= fm.rev10yM, "10-yr gross profit ≤ 10-yr revenue");
ok(fm.grossMarginPct > 0 && fm.grossMarginPct <= 100 && fm.manHours > 0 && fm.vol10y > 0, "margin %, man-hours, volume all positive & bounded");
ok(fm.paybackYears >= 0, "payback years non-negative");

// financials overview (§2.3): per-year revenue / margin / R&D, R&D front-loaded
const ov = financialsOverview(DEMO_PROJECTS.find((p) => p.id === "PRJ-01"), { years: 10 });
ok(ov.length === 10, "financials overview spans 10 years");
ok(ov[0].rdK > 0 && ov[9].rdK === 0, "R&D expense front-loaded (spent early, zero by year 10)");
ok(ov.every((r) => r.marginM <= r.revM + 1e-6), "yearly margin ≤ revenue");
ok(Math.abs(ov.reduce((s, r) => s + r.rdK, 0) - DEMO_PROJECTS.find((p) => p.id === "PRJ-01").nreK) < 2, "R&D expense sums to project NRE");

// dependencies (§4): edges + summary + both origins
ok(DEMO_DEPS.length >= 8 && DEMO_DEPS.every((e) => e.from !== e.to && e.risks.length >= 1), "dependency edges are non-self, risk-typed");
ok(dependsOn(DEMO_DEPS, "PRJ-02").length >= 1, "PRJ-02 declares dependencies (assigned by manager)");
ok(dependentsOf(DEMO_DEPS, "PRJ-05").length >= 1, "PRJ-05 has dependents (assigned by others)");
const depSum = dependencySummary(DEMO_PROJECTS, DEMO_DEPS);
ok(depSum.length === DEMO_PROJECTS.length, "dependency summary covers every project");
ok(depSum.every((r, i) => i === 0 || depSum[i - 1].npvWithDepsM >= r.npvWithDepsM), "dependency summary sorted by NPV-with-deps desc");
ok(depSum.some((r) => r.npvWithDepsM !== r.npvM), "NPV-with-dependencies differs from standalone NPV for dependent projects");
ok(depSum.find((r) => r.id === "PRJ-05").dependents >= 1, "summary counts dependents");

console.log(`\nINNOVATION-TIME ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
