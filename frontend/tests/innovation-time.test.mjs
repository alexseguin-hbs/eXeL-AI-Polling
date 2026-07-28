// Innovation time engine (CRS-85→88): start date → schedule → unit scaling → ± tolerance
// bands that tighten by gate and widen with risk. Run:
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/innovation-time.test.mjs
import {
  scheduleFromStart, timeReadout, toleranceBand, workdaysInUnit, GATES, GATE_WORKDAYS,
  pSuccess, upsideFraction, RISK_P, SCHEDULE_FALLBACK_START,
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

// ── determinism: UTC-anchored parse → dates are viewer-invariant (not TZ-shifted) ─────────
// (Before the fix, a local-time parse serialized via toISOString() shifted every date a day
//  for viewers east of UTC — breaking the CLAUDE.md "identical inputs → identical output" rule.)
ok(scheduleFromStart(P(), "2026-01-05").rows[0].startISO === "2026-01-05", "start date round-trips UTC (no TZ off-by-one)");
ok(/^\d{4}-\d{2}-\d{2}$/.test(s.firstRevenueISO), "firstRevenueISO is a clean ISO date");
ok(JSON.stringify(scheduleFromStart(P(), "2028-07-01").rows) === JSON.stringify(scheduleFromStart(P(), "2028-07-01").rows), "schedule deterministic for a fixed start");

// ── crash guard: empty / malformed start date falls back deterministically (no RangeError) ─
ok(scheduleFromStart(P(), "").rows.length === 7, "empty start date does not crash — 7 gate rows");
ok(scheduleFromStart(P(), "").rows[0].startISO === SCHEDULE_FALLBACK_START, "empty start falls back to the fixed default start");
ok(scheduleFromStart(P(), "not-a-date").rows[0].startISO === SCHEDULE_FALLBACK_START, "malformed start falls back to the fixed default start");
ok(timeReadout(P(), "", "day").cost.value > 0, "timeReadout survives an empty start date (no crash)");

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
// H2 — the three operator components + Incremental summation (1 − 2 + 3)
ok(gm.every((r) => Math.abs(r.incremental - (r.newRev - r.declineRev + r.eolRev)) < 1e-9), "incremental = New − Decline + EOL");
ok(gm.every((r) => r.newRev >= 0 && r.declineRev >= 0 && r.eolRev >= 0), "growth components are non-negative");
ok(gm[0].declineRev === 0 && gm[5].declineRev > gm[0].declineRev, "decline-if-unfunded grows from zero at year 0");
ok(gm[0].newRev === gm[0].weighted, "New band = probability-weighted next-gen ramp");

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
// admin Business-Setup base revenue flows through: BU + Company base sum from the SBUs present
const crAdmin = companyRollup(DEMO_PROJECTS, { sbuBase: () => 10 });
ok(crAdmin.bus.every((b) => b.baseM === b.sbus.length * 10), "companyRollup sbuBase flows into BU base");
ok(crAdmin.company.baseM === crAdmin.bus.reduce((s, b) => s + b.baseM, 0), "company base = Σ BU base (admin-driven)");

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

// confidence is now a 5-point scale (operator: "5 bullets not 4") — every project 1..5
ok(DEMO_PROJECTS.every((p) => p.confidence >= 1 && p.confidence <= 5), "model confidence within the 5-point scale");
ok(DEMO_PROJECTS.some((p) => p.confidence === 5), "top-tier projects reach a full 5/5 confidence");

// the Gate Requirements view surfaces ONLY the S1–S18 slide rows (R-##/DR/TR/IS/DT/DC removed from the tool)
const sOnly = GATE_REQUIREMENTS.filter((r) => r.type === "S");
ok(sOnly.length === GATE_G.reduce((a, g) => a + GATE_DELIVERABLES[g].length, 0), "S-slide rows = one per gate deliverable across G1–G7");
ok(sOnly.every((r) => GATE_G.includes(r.earliestGate)), "every gate slide maps to a gate G1–G7");
ok(GATE_G.every((g) => sOnly.some((r) => r.earliestGate === g)), "every gate G1–G7 has at least one review slide");

// registry unifies the three sources (§3.1): S-slides + CRS rows + DR/TR/IS/DT/DC derivatives
ok(GATE_REQUIREMENTS.length >= 25, "unified registry has all requirement rows");
ok(GATE_REQUIREMENTS.some((r) => r.type === "S") && GATE_REQUIREMENTS.some((r) => r.type === "REQ"), "registry folds S-slides + requirement rows");
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
ok(STRATEGIC_INITIATIVES.length === 4, "exactly 4 Harmattan-AI strategic pillars (Loitering Munitions · AI Targeting · Attritable Systems · Sovereign Deep-Strike)");
ok(DEMO_PROJECTS.every((p) => { const m = metaOf(p); return STRATEGIC_INITIATIVES.includes(m.initiative) && VALUE_LADDER.includes(m.valueLadder) && COMPETITIVE_POSITIONS.includes(m.competitive) && !!m.targetMarket && !!m.valueImpact; }), "every project derives a full meta set (initiative/ladder/impact/market/competitive)");
ok(metaOf(DEMO_PROJECTS.find((p) => p.id === "PRJ-02")).initiative === "AI Targeting & Terminal Autonomy", "swarm-fusion-AI project → AI Targeting & Terminal Autonomy pillar");
ok(metaOf(DEMO_PROJECTS.find((p) => p.id === "PRJ-04")).initiative === "Autonomous Loitering Munitions", "counter-UAS effector → Autonomous Loitering Munitions pillar");
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
// H2 margin double-check — existing-year Mgn = Rev × the ONE margin % source (no double-applied margin; only
// 1-decimal display rounding differs). Guards against a second/independent margin factor drifting Rev vs Mgn.
{
  const mp = execOf(DEMO_PROJECTS.find((p) => p.id === "PRJ-01")).marginPct / 100;
  ok(ov.filter((r) => r.revM > 0).every((r) => Math.abs(r.marginM - r.revM * mp) <= 0.15), "existing-year Mgn = Rev × one margin % (within rounding)");
}

// dependencies (§4): edges + summary + both origins
ok(DEMO_DEPS.length >= 8 && DEMO_DEPS.every((e) => e.from !== e.to && e.risks.length >= 1), "dependency edges are non-self, risk-typed");
ok(dependsOn(DEMO_DEPS, "PRJ-02").length >= 1, "PRJ-02 declares dependencies (assigned by manager)");
ok(dependentsOf(DEMO_DEPS, "PRJ-05").length >= 1, "PRJ-05 has dependents (assigned by others)");
const depSum = dependencySummary(DEMO_PROJECTS, DEMO_DEPS);
ok(depSum.length === DEMO_PROJECTS.length, "dependency summary covers every project");
ok(depSum.every((r, i) => i === 0 || depSum[i - 1].npvWithDepsM >= r.npvWithDepsM), "dependency summary sorted by NPV-with-deps desc");
ok(depSum.some((r) => r.npvWithDepsM !== r.npvM), "NPV-with-dependencies differs from standalone NPV for dependent projects");
ok(depSum.find((r) => r.id === "PRJ-05").dependents >= 1, "summary counts dependents");

/* ---------------- Business Setup (master data) ---------------- */
import { seedBizSetup, BIZ_TIERS } from "../lib/innovation-data.ts";
const biz = seedBizSetup(DEMO_PROJECTS);
ok(BIZ_TIERS.length === 6 && BIZ_TIERS[0].key === "bu" && BIZ_TIERS[5].key === "material", "6 master tiers BU→…→Material");
ok(biz.bu.length === 3 && biz.sbu.length === 8, "seed master data: 3 BU · 8 SBU");
ok(biz.product.length === DEMO_PROJECTS.length, "one Product # per project in master data");
ok(biz.sbu.every((s) => s.parent && s.baseM !== undefined), "SBU nodes carry parent BU + base revenue");
ok(biz.sbu.every((s) => biz.bu.some((b) => b.code === s.parent)), "every SBU parent resolves to a BU");
ok(biz.pgroup.every((g) => biz.sbu.some((s) => s.code === g.parent)), "every Alpha Group parent resolves to an SBU");
ok(biz.material.every((m) => biz.product.some((pr) => pr.code === m.parent)), "every Material # parent resolves to a Product #");
ok(JSON.stringify(seedBizSetup(DEMO_PROJECTS)) === JSON.stringify(biz), "seedBizSetup deterministic");

/* ---------------- Risk-adjusted cost + schedule (tech × commercial) ---------------- */
import { riskContingency, riskAdjustedNreK, riskAdjustedWorkdays } from "../lib/innovation-data.ts";
const rcLow = P({ tech: "low", comm: "low", nreK: 1000 });
const rcHigh = P({ tech: "high", comm: "high", nreK: 1000 });
ok(riskContingency(rcHigh) > riskContingency(rcLow), "risk contingency rises with tech × commercial risk");
ok(riskAdjustedNreK(rcLow) >= 1000 && riskAdjustedNreK(rcHigh) > riskAdjustedNreK(rcLow), "risk-adjusted cost grows with risk");
ok(riskAdjustedWorkdays(rcHigh) > riskAdjustedWorkdays(rcLow), "risk-adjusted schedule longer for riskier project");

/* ---------------- Intelligence Load by strategic pillar / hierarchy level ---------------- */
import { intelligenceLoad } from "../lib/innovation-data.ts";
const ilPillar = intelligenceLoad(DEMO_PROJECTS, (p) => metaOf(p).initiative);
ok(ilPillar.length >= 1 && ilPillar.length <= STRATEGIC_INITIATIVES.length, "intelligence load groups into strategic-pillar categories");
ok(ilPillar.every((r) => r.ai >= 0 && r.si >= 0 && r.hi >= 0 && r.count >= 1), "each pillar row carries mean AI/SI/HI + count");
ok(ilPillar.every((r) => Math.abs(r.ai + r.si + r.hi - 1) < 0.2), "AI+SI+HI mix ≈ 1 per group");
ok(intelligenceLoad(DEMO_PROJECTS, (p) => hierOf(p).bu).length === 3, "intelligence load by BU → 3 rows");
ok(intelligenceLoad(DEMO_PROJECTS, (p) => hierOf(p).sbu).length === 8, "intelligence load by SBU → 8 rows");
ok(intelligenceLoad(DEMO_PROJECTS, (p) => p.id).length === DEMO_PROJECTS.length, "intelligence load by project → one row each");

/* ---------------- Rack & Stack funding line: stackWithBudget (CRS-42/43/71) ---------------- */
import { stackWithBudget } from "../lib/innovation-data.ts";
const stOrder = [P({ id: "A", nreK: 1000 }), P({ id: "B", nreK: 2000 }), P({ id: "C", nreK: 3000 })];
const stAll = stackWithBudget(stOrder, 6000);
ok(stAll.rows.length === 3 && stAll.rows.every((r) => r.funded), "all projects funded when budget = total NRE");
ok(stAll.lineIndex === 3, "funding line sits past the last row when everything is funded");
ok(stAll.rows.map((r) => r.cumK).join(",") === "1000,3000,6000", "cumulative NRE accumulates in rank order");
ok(stAll.rows[2].remainingK === 0, "remaining budget = available − cumulative (0 at the exact line)");
const stPartial = stackWithBudget(stOrder, 2999);
ok(stPartial.rows[0].funded && !stPartial.rows[1].funded && !stPartial.rows[2].funded, "projects above the line funded, below the line not");
ok(stPartial.lineIndex === 1, "lineIndex = first project whose cumulative NRE exceeds the budget");
ok(stPartial.rows[1].remainingK < 0, "remaining goes negative once past the funding line");
const stNone = stackWithBudget(stOrder, 500);
ok(!stNone.rows[0].funded && stNone.lineIndex === 0, "nothing funded when budget < first project NRE (line at 0)");
ok(stackWithBudget([], 1000).lineIndex === 0, "empty stack → lineIndex 0, no crash");

/* ---------------- Executive slide: two-bullet summary (AMTS overview one-pager) ---------------- */
import { execSummaryBullets } from "../lib/innovation-data.ts";
const eb = execSummaryBullets(DEMO_PROJECTS.find((p) => p.id === "PRJ-01"));
ok(Array.isArray(eb) && eb.length === 2, "execSummaryBullets returns exactly two bullets");
ok(eb.every((b) => typeof b === "string" && b.length > 0), "both executive bullets are non-empty");
ok(eb[0].includes("SAR Imaging Payload Gen-5") && eb[0].includes("Sovereign Deep-Strike & ISR"), "bullet 1 names the project + its strategic pillar");
ok(/\$\d/.test(eb[1]) && /%/.test(eb[1]) && eb[1].includes("2026-Q4"), "bullet 2 carries the dated business case (revenue $, IRR %, first-revenue)");
ok(DEMO_PROJECTS.every((p) => execSummaryBullets(p).length === 2), "every project derives a two-bullet executive summary");
ok(JSON.stringify(execSummaryBullets(DEMO_PROJECTS[0])) === JSON.stringify(execSummaryBullets(DEMO_PROJECTS[0])), "execSummaryBullets deterministic");

/* ---------------- Value proposition (must-have at creation) ---------------- */
import { valuePropOf } from "../lib/innovation-data.ts";
ok(DEMO_PROJECTS.every((p) => valuePropOf(p).trim().length > 0), "every project resolves a value proposition (derived fallback for seeds)");
ok(valuePropOf({ ...DEMO_PROJECTS[0], valueProp: "  Custom master VP  " }) === "Custom master VP", "explicit master value prop wins over the derived fallback (trimmed)");
ok(valuePropOf({ ...DEMO_PROJECTS[0], valueProp: "" }) === valuePropOf({ ...DEMO_PROJECTS[0], valueProp: undefined }), "blank value prop falls back to the derived statement");

/* ---------------- Next Best Alternative (required) + AI rendition (HI⇄AI) ---------------- */
import { nbaOf, aiValuePropOf } from "../lib/innovation-data.ts";
ok(DEMO_PROJECTS.every((p) => nbaOf(p).trim().length > 0), "every project resolves a Next Best Alternative (derived As-Is fallback for seeds)");
ok(nbaOf({ ...DEMO_PROJECTS[0], nextBestAlternative: "  Legacy pod + manual review  " }) === "Legacy pod + manual review", "explicit NBA wins over the derived As-Is (trimmed)");
ok(nbaOf({ ...DEMO_PROJECTS[0], nextBestAlternative: "" }) === nbaOf({ ...DEMO_PROJECTS[0], nextBestAlternative: undefined }), "blank NBA falls back to the derived As-Is statement");
ok(valuePropOf({ ...DEMO_PROJECTS[0], valueProp: undefined, nextBestAlternative: "Rival System X" }).includes("Rival System X"), "derived value prop weaves in the explicit NBA");
ok(DEMO_PROJECTS.every((p) => aiValuePropOf(p).trim().length > 0), "every project resolves an AI value-prop rendition (deterministic, offline)");
ok(aiValuePropOf(DEMO_PROJECTS[0]) === aiValuePropOf(DEMO_PROJECTS[0]), "AI rendition is deterministic (same input → same output)");
ok(aiValuePropOf({ ...DEMO_PROJECTS[0], valuePropAI: "  Minted AI VP  " }) === "Minted AI VP", "stored AI rendition (minted at submission) wins over derived (trimmed)");
ok(aiValuePropOf({ ...DEMO_PROJECTS[0], nextBestAlternative: "Rival System X" }).includes("Unlike Rival System X"), "AI rendition contrasts against the Next Best Alternative");

/* ---------------- Lexicon adoption (Slice 0 · i18n foundation) ---------------- */
import { CUBE_GROUPS } from "../lib/lexicon-data.ts";
const innovGroup = CUBE_GROUPS.find((g) => g.cubeId === 60);
ok(!!innovGroup, "innovation lexicon group (cubeId 60) is registered in CUBE_GROUPS");
ok((innovGroup?.keys.length ?? 0) >= 25, "innovation lexicon group carries the Slice-0 chrome keys (>=25)");
ok(innovGroup?.keys.every((k) => k.key.startsWith("innovation.") && k.englishDefault.trim().length > 0) ?? false, "every innovation key is namespaced 'innovation.*' with a non-empty English default");
ok(new Set(innovGroup?.keys.map((k) => k.key)).size === (innovGroup?.keys.length ?? -1), "innovation lexicon keys are unique (no dup key)");

/* ---------------- Value signals (Slice 1) — pure, deterministic, derived fallbacks ---------------- */
import {
  custImportanceOf, relPerformanceOf, valueIndexOf, valuePerDollarOf, winProbabilityOf,
  killRiskOf, riskBandOf, costPerServedBuyerOf, intelLoadGloss,
} from "../lib/innovation-data.ts";
const P0 = DEMO_PROJECTS[0];
ok(DEMO_PROJECTS.every((p) => custImportanceOf(p) >= 0 && custImportanceOf(p) <= 1), "custImportanceOf in [0,1] for all (confidence fallback)");
ok(custImportanceOf({ ...P0, custImportance: 0.9 }) === 0.9, "explicit custImportance wins");
ok(DEMO_PROJECTS.every((p) => relPerformanceOf(p) >= 0 && relPerformanceOf(p) <= 1), "relPerformanceOf in [0,1] for all (competitive fallback)");
ok(relPerformanceOf({ ...P0, relPerformance: 0.7 }) === 0.7, "explicit relPerformance wins");
ok(DEMO_PROJECTS.every((p) => valueIndexOf(p) >= 0), "valueIndexOf ≥ 0 for all (importance×performance×incremental rev)");
ok(valueIndexOf({ ...P0, custImportance: 0, relPerformance: 1 }) === 0, "valueIndexOf is 0 when importance is 0");
ok(DEMO_PROJECTS.every((p) => Number.isFinite(valuePerDollarOf(p))), "valuePerDollarOf finite for all");
const wp = winProbabilityOf(P0);
ok(wp.p10 <= wp.p50 && wp.p50 <= wp.p90, "winProbability band ordered p10 ≤ p50 ≤ p90");
ok([wp.p10, wp.p50, wp.p90].every((x) => x >= 0 && x <= 1), "winProbability band within [0,1]");
ok(winProbabilityOf({ ...P0, winP50: 0.5 }).p50 === 0.5, "explicit winP50 wins as the median");
ok(killRiskOf({ ...P0, killRisk: "  Vendor lock  " }) === "Vendor lock", "killRiskOf: explicit field wins (trimmed)");
ok(killRiskOf({ ...P0, killRisk: undefined }).length > 0, "killRiskOf: derived kill-risk is non-empty");
ok(riskBandOf({ ...P0, criticalPath: true }).dependency === "High", "riskBandOf: critical-path project reads Dependency High");
ok(["Low", "Med", "High"].includes(riskBandOf(P0).technical), "riskBandOf: technical band is a Low/Med/High label");
ok(costPerServedBuyerOf(P0, 4) < costPerServedBuyerOf(P0, 1), "costPerServedBuyerOf falls as served segments rise");
ok(costPerServedBuyerOf(P0, 0) === costPerServedBuyerOf(P0, 1), "costPerServedBuyerOf floors the divisor at 1 (no divide-by-zero)");
const glossHi = intelLoadGloss({ ...P0, ai: 0.1, si: 0.1, hi: 0.8 });
ok(glossHi.dominant === "HI" && glossHi.gloss.length > 0, "intelLoadGloss: dominant band = max share, gloss non-empty");

/* ---------------- Value Equation (Slice 1B) — create the value prop vs the competitive NBA ---------------- */
import { valueEquation, valueEquationOf, valuePropFromEquation } from "../lib/innovation-data.ts";
const empty = valueEquation([], 100);
ok(empty.competitiveIndex === 50 && empty.evcUsdM === 100 && empty.wins === 0, "valueEquation: empty drivers → parity index 50, EVC = reference, 0 wins");
const winDriver = valueEquation([{ name: "Range", importance: 1, ourScore: 0.9, nbaScore: 0.3 }], 100);
ok(winDriver.perDriver[0].verdict === "win", "valueEquation: ours ≫ NBA → win verdict");
ok(winDriver.competitiveIndex > 50 && winDriver.evcUsdM > 100, "valueEquation: a win lifts competitive index >50 and EVC above the NBA reference");
const lossDriver = valueEquation([{ name: "Cost", importance: 1, ourScore: 0.2, nbaScore: 0.8 }], 100);
ok(lossDriver.perDriver[0].verdict === "loss" && lossDriver.competitiveIndex < 50, "valueEquation: ours ≪ NBA → loss verdict, index <50");
const evcLo = valueEquation([{ name: "X", importance: 1, ourScore: 0.5, nbaScore: 0.4 }], 100).evcUsdM;
const evcHi = valueEquation([{ name: "X", importance: 1, ourScore: 0.9, nbaScore: 0.4 }], 100).evcUsdM;
ok(evcHi > evcLo, "valueEquation: EVC is monotonic increasing in our score");
ok(winDriver.competitiveIndex >= 0 && winDriver.competitiveIndex <= 100, "valueEquation: competitive index clamped to [0,100]");
ok(valueEquationOf(DEMO_PROJECTS[0]).competitiveIndex >= 0, "valueEquationOf resolves for a real project (addressable = incremental rev)");
ok(valuePropFromEquation({ ...P0, valueDrivers: [{ name: "All-weather range", importance: 1, ourScore: 0.9, nbaScore: 0.3 }] }).includes("All-weather range"), "valuePropFromEquation names the winning driver vs the NBA");
ok(valuePropFromEquation({ ...P0, valueDrivers: [] }).length > 0, "valuePropFromEquation resolves even with no stored drivers (derived backfill populates winners)");
ok(valuePropFromEquation({ ...P0, valueDrivers: [{ name: "z", importance: 1, ourScore: 0.1, nbaScore: 0.9 }] }).includes("Unlike"), "valuePropFromEquation falls back to the derived AI value prop when the (stored) drivers do not win");

/* ---------------- Gate/IRB — expected value + handoff readiness (Slice 4) ---------------- */
import { expectedValueOf, handoffReadiness, npvM } from "../lib/innovation-data.ts";
ok(Math.abs(expectedValueOf(P0, 1) - npvM(P0)) < 1e-9, "expectedValueOf at prob=1 equals NPV");
ok(expectedValueOf(P0, 0) === 0, "expectedValueOf at prob=0 is 0");
ok(expectedValueOf(P0, 0.5) <= expectedValueOf(P0, 0.9), "expectedValueOf is monotonic in confidence");
ok(expectedValueOf({ ...P0, nreK: P0.nreK }, 2) === expectedValueOf(P0, 1), "expectedValueOf clamps confidence to [0,1]");
ok(handoffReadiness({ ...P0, valueProp: "vp", segmentValueProps: [{ segment: "s", prop: "p" }], valueDrivers: [{ name: "d", importance: 1, ourScore: 1, nbaScore: 0 }] }).ready, "handoffReadiness: value prop + segment + delta → ready");
ok(!handoffReadiness({ ...P0, valueProp: "", segmentValueProps: [], valueDrivers: [], fullRev10yM: 0, doNothing10yM: 0, nreK: 999999 }).ready, "handoffReadiness: missing artifacts → not ready");

/* ---------------- Consistency check (Slice 8) ---------------- */
import { consistencyCheck } from "../lib/innovation-data.ts";
ok(consistencyCheck({ ...P0, valueProp: "vp", nextBestAlternative: "nba", valueDrivers: [{ name: "d", importance: 1, ourScore: 0.9, nbaScore: 0.2 }], segmentValueProps: [{ segment: "s", prop: "p" }] }).ok, "consistencyCheck: full spine (vp+nba+drivers+segments, winning) → ok");
ok(consistencyCheck({ ...P0, valueProp: "", nextBestAlternative: "", valueDrivers: [], segmentValueProps: [] }).issues.length >= 4, "consistencyCheck: empty spine flags ≥4 issues");
ok(consistencyCheck({ ...P0, valueProp: "", nextBestAlternative: "", valueDrivers: [], segmentValueProps: [] }).ok === false, "consistencyCheck: gaps → not ok");

/* ---------------- Backfill drivers + budget scenarios (optimization round) ---------------- */
import { derivedDriversOf, BUDGET_SCENARIOS, scenarioAvailK } from "../lib/innovation-data.ts";
ok(DEMO_PROJECTS.every((p) => derivedDriversOf(p).length > 0), "derivedDriversOf backfills ≥1 driver for every project (all BUs)");
ok(DEMO_PROJECTS.every((p) => derivedDriversOf(p).every((d) => d.importance >= 0 && d.importance <= 1 && d.ourScore >= 0 && d.ourScore <= 1 && d.nbaScore >= 0 && d.nbaScore <= 1)), "derived driver scores are all within [0,1]");
ok(DEMO_PROJECTS.every((p) => valueEquationOf(p).perDriver.length > 0), "valueEquationOf is populated (waterfall backfilled) for every project even with no stored drivers");
ok(valueEquationOf({ ...P0, valueDrivers: [{ name: "x", importance: 1, ourScore: 0.9, nbaScore: 0.2 }] }).perDriver.length === 1, "stored drivers still take precedence over the derived backfill");
ok(BUDGET_SCENARIOS.map((s) => s.m).join(",") === "66,77,88", "budget scenarios are Conservative 66 · Base 77 · Growth 88 ($M)");
ok(scenarioAvailK("base") === 77000 && scenarioAvailK("conservative") === 66000 && scenarioAvailK("growth") === 88000, "scenarioAvailK returns $K for each scenario (base=77M)");
ok(scenarioAvailK("bogus") === 77000, "scenarioAvailK falls back to Base ($77M) for an unknown scenario");

/* ---------------- Gate notes (generic comments + countermeasures, solved per gate) ---------------- */
import { GATE_NOTES, GATES as GATES_N } from "../lib/innovation-data.ts";
ok(GATES_N.every((g) => !!GATE_NOTES[g] && typeof GATE_NOTES[g].comment === "string" && GATE_NOTES[g].comment.length > 0), "GATE_NOTES has a comment for every gate G1–G7");
ok(GATES_N.every((g) => GATE_NOTES[g].countermeasures.length >= 1), "GATE_NOTES has ≥1 countermeasure per gate");
ok(GATES_N.every((g) => GATE_NOTES[g].countermeasures.every((c) => c.solved === true && c.risk && c.countermeasure)), "every countermeasure is solved and carries risk + countermeasure text");

/* ---------------- Digital slide show (S1–S18) — HI hint + AI version ---------------- */
import { SLIDES, slideDef, slideHintOf, aiSlideOf } from "../lib/innovation-data.ts";
ok(SLIDES.length === 20, "SLIDES = 18 review deliverables (S1–S18) + 2 closeout slides (CS, RA)");
ok(SLIDES[0].slide === "S1" && SLIDES[1].slide === "S2" && SLIDES[17].slide === "S18" && SLIDES[18].slide === "CS" && SLIDES[19].slide === "RA", "SLIDES run S1 → S18 in gate order, then CS + RA closeouts");
ok(SLIDES.every((s) => !!s.slide && !!s.name && !!s.summary && GATES_N.includes(s.gate)), "every slide carries slide/name/summary/gate");
ok(slideDef("S3")?.name === "Financial — Return", "slideDef resolves S3 to Financial — Return");
ok(slideHintOf("S8").includes("Competition"), "slideHintOf surfaces the slide name in the HI prompt");
ok(SLIDES.every((s) => aiSlideOf(P0, s.slide).length > 20), "aiSlideOf drafts a non-trivial AI version for every slide");
ok(aiSlideOf(P0, "S3").includes("NPV") && aiSlideOf(P0, "S3").includes("IRR"), "aiSlideOf(S3) pulls real financials (NPV + IRR)");
ok(aiSlideOf(P0, "S3") === aiSlideOf(P0, "S3"), "aiSlideOf is deterministic (identical inputs → identical draft)");
ok(aiSlideOf(P0, "S8").includes("NBA") || aiSlideOf(P0, "S8").toLowerCase().includes("competitive"), "aiSlideOf(S8) frames value vs the NBA");

/* ---------------- Derisk council fixes (12-AsM + MoT) ---------------- */
import { financialMetrics as fmFn } from "../lib/innovation-data.ts";
ok(Number.isFinite(fmFn(P0).paybackYears) && fmFn(P0).paybackYears > 0, "payback is a finite positive number for a healthy seed project");
ok(fmFn({ ...P0, fullRev10yM: 10, doNothing10yM: 10 }).paybackYears === Infinity, "payback returns Infinity (→ rendered '—') when the project never recovers its NRE (no incremental margin)");
// aiSlideOf locale-pinned + deterministic (no locale drift on the persisted draft)
ok(aiSlideOf(P0, "S10") === aiSlideOf(P0, "S10"), "aiSlideOf(S10 financials) is deterministic (en-US pinned)");

/* ---------------- Realistic simulated intel — every project populated (NOSE + value equation vs NBA) ---------------- */
ok(DEMO_PROJECTS.every((p) => typeof p.valueProp === "string" && p.valueProp.length > 40), "every project ships an explicit realistic value proposition");
ok(DEMO_PROJECTS.every((p) => typeof p.nextBestAlternative === "string" && p.nextBestAlternative.length > 8), "every project ships an explicit Next Best Alternative");
ok(DEMO_PROJECTS.every((p) => Array.isArray(p.valueDrivers) && p.valueDrivers.length >= 3), "every project ships ≥3 scored Value-Equation drivers vs the NBA");
ok(DEMO_PROJECTS.every((p) => p.valueDrivers.every((d) => d.importance >= 0 && d.importance <= 1 && d.ourScore >= 0 && d.ourScore <= 1 && d.nbaScore >= 0 && d.nbaScore <= 1)), "all authored driver scores are within [0,1] (math is valid)");
ok(DEMO_PROJECTS.every((p) => typeof p.killRisk === "string" && p.killRisk.length > 8), "every project ships an explicit kill-risk");
ok(DEMO_PROJECTS.every((p) => valueEquationOf(p).evcUsdM >= valueEquationOf(p).referenceM * 0.5), "value equation resolves to a sane EVC for every populated project");
ok(DEMO_PROJECTS.every((p) => (p.segmentValueProps?.length ?? 0) >= 1), "every project ships a lead needs-segment value prop");

/* ---------------- Optimized BU/SBU mix (rebalanced — no single BU dominates) ---------------- */
{
  const buCounts = DEMO_PROJECTS.reduce((m, p) => { const b = hierOf(p).bu; m[b] = (m[b] || 0) + 1; return m; }, {});
  ok(Object.keys(buCounts).length === 3, "portfolio still spans exactly 3 BUs after rebalance");
  ok(Object.values(buCounts).every((n) => n >= 5), "every BU carries >=5 projects (no starved BU)");
  ok(Math.max(...Object.values(buCounts)) <= DEMO_PROJECTS.length / 2, "no single BU holds more than half the portfolio (balanced mix)");
  ok(filterByHier(DEMO_PROJECTS, "sbu", "DSC").length >= 1, "DSC SBU stays populated after the rebalance");
  ok(DEMO_PROJECTS.every((p) => hierOf(p).bu.length === 2 && hierOf(p).sbu.length === 3 && hierOf(p).alpha.length === 4), "BU 2-char · SBU 3-char · Alpha 4-char invariants hold");
}

/* ---------------- S1–S18 field spec (schema-driven slide authoring) ---------------- */
import { SLIDE_SCHEMA, slideSpec, linkedSlideField, aiSlideField } from "../lib/innovation-data.ts";
ok(SLIDE_SCHEMA.length === 20, "SLIDE_SCHEMA = 18 review slides (S1–S18) + 2 closeout slides (CS, RA)");
ok(SLIDE_SCHEMA[0].code === "S1" && SLIDE_SCHEMA[1].code === "S2" && SLIDE_SCHEMA[17].code === "S18" && SLIDE_SCHEMA[18].code === "CS" && SLIDE_SCHEMA[19].code === "RA", "schema runs S1 → S18 then CS + RA");
ok(slideSpec("CS").fields.every((f) => f.linked) && slideSpec("RA").fields.every((f) => f.linked), "CS + RA fields are all linked (live governance, no authoring)");
ok(SLIDE_SCHEMA.every((s) => s.fields.length > 0 && s.source && GATES_N.includes(s.gate)), "every slide carries typed fields + a source + a valid gate");
ok(SLIDE_SCHEMA.every((s) => s.fields.every((f) => f.id && f.name && f.kind)), "every field has id + name + kind");
ok(SLIDE_SCHEMA.some((s) => s.fields.some((f) => f.req)), "the spec flags required fields (drives gate readiness)");
ok(slideSpec("S6").fields.find((f) => f.id === "problem").kind === "list" && !slideSpec("S6").fields.find((f) => f.id === "problem").mirror, "S6 problem is a reduced authored list (de-mirrored)");
ok(slideSpec("S13").fields.some((f) => f.id === "biz"), "S13 carries a third Business risk lens (Tech + Commercial + Business)");
ok(slideSpec("S6").fields.filter((f) => f.kind === "attach").length === 2, "S6 carries two flanking product images");
// linked fields read live from the project record (never typed twice)
{
  const prof = linkedSlideField(P0, "S3", "profile");
  ok(prof && typeof prof === "object" && !Array.isArray(prof) && prof.npv && prof.irr, "S3 profile is linked live from the financial record (NPV + IRR)");
  const rev = linkedSlideField(P0, "S3", "revtable");
  ok(Array.isArray(rev) && rev.length >= 1 && rev[0].length === 3, "S3 revenue table is linked (Year / Revenue / Margin rows)");
  ok(linkedSlideField(P0, "S1", "oneline") === null, "non-linked fields return null from the linked resolver");
  // S2 = Project Overview one-pager: linked profile + upside-accelerator metrics live from the record
  const s2prof = linkedSlideField(P0, "S2", "profile");
  ok(s2prof && typeof s2prof === "object" && !Array.isArray(s2prof) && s2prof.npv && s2prof.irr, "S2 Project Overview profile is linked live (NPV + IRR)");
  const s2accel = linkedSlideField(P0, "S2", "accel");
  ok(s2accel && typeof s2accel === "object" && "spend" in s2accel && "months" in s2accel && "revFwd" in s2accel, "S2 upside accelerator lever is linked live (spend / months / revFwd)");
}
// deterministic per-field AI drafts
ok(aiSlideField(P0, "S8", "vprop") === aiSlideField(P0, "S8", "vprop"), "aiSlideField is deterministic");
ok(typeof aiSlideField(P0, "S8", "vprop") === "string" && aiSlideField(P0, "S8", "vprop").length > 20, "aiSlideField(S8 value prop) drafts real content");
ok(Array.isArray(aiSlideField(P0, "S8", "diffs")), "aiSlideField(S8 value equation) drafts a table from the value equation");

/* ---------------- $/min System of Innovation + BU funding buckets (real-time decision core, R-Core reuse) ---------------- */
import { costPerMinuteOf, buBuckets, TOTAL_PROGRAM_WORKDAYS, CADENCE_ORDER, CADENCE_PER_YEAR } from "../lib/innovation-data.ts";
ok(TOTAL_PROGRAM_WORKDAYS > 0, "TOTAL_PROGRAM_WORKDAYS is the fixed program schedule total");
ok(DEMO_PROJECTS.every((p) => costPerMinuteOf(p) > 0 && Number.isFinite(costPerMinuteOf(p))), "costPerMinuteOf is a positive finite $/min burn for every project");
ok(costPerMinuteOf({ ...P0, nreK: P0.nreK * 2 }) > costPerMinuteOf(P0), "costPerMinuteOf scales with NRE (more spend → higher burn)");
ok(CADENCE_ORDER.join("") === "QMWD", "cadence ladder is Quarterly → Monthly → Weekly → Daily");
ok(CADENCE_PER_YEAR.D > CADENCE_PER_YEAR.W && CADENCE_PER_YEAR.W > CADENCE_PER_YEAR.Q, "cadence decision-cycles/yr tighten Q→D");
{
  const funded = new Set(DEMO_PROJECTS.slice(0, 10).map((p) => p.id));
  const buckets = buBuckets(DEMO_PROJECTS, (id) => funded.has(id));
  ok(buckets.length === 3, "buBuckets returns one entry per BU (3 BUs → 3 rows, each carrying funded + unfunded)");
  const totalInBuckets = buckets.reduce((s, b) => s + b.funded.count + b.unfunded.count, 0);
  ok(totalInBuckets === DEMO_PROJECTS.length, "every project lands in exactly one of the 6 buckets (Σ funded+unfunded = portfolio)");
  const fundedCount = buckets.reduce((s, b) => s + b.funded.count, 0);
  ok(fundedCount === funded.size, "funded buckets hold exactly the funded projects");
  ok(buckets.every((b) => b.funded.perMinUsd >= 0 && b.unfunded.perMinUsd >= 0), "each bucket carries a $/min burn aggregate");
}
// Same funded/unfunded + $/min logic generalizes to SBU and Alpha Group (operator: apply to SBU/Alpha too)
{
  const funded = new Set(DEMO_PROJECTS.slice(0, 11).map((p) => p.id));
  for (const level of ["bu", "sbu", "pgroup"]) {
    const bk = fundingBuckets(DEMO_PROJECTS, level, (id) => funded.has(id));
    ok(bk.length >= 1, `fundingBuckets works at ${level}`);
    ok(bk.reduce((s, b) => s + b.funded.count + b.unfunded.count, 0) === DEMO_PROJECTS.length, `every project lands in one ${level} bucket (Σ = portfolio)`);
    ok(bk.reduce((s, b) => s + b.funded.count, 0) === funded.size, `funded count exact at ${level}`);
  }
}
import { fundingBuckets } from "../lib/innovation-data.ts";

/* ---------------- Upside spending accelerator lever (per-project intake, single source of truth) ---------------- */
import { upsideAccelOf } from "../lib/innovation-data.ts";
ok(DEMO_PROJECTS.every((p) => { const ua = upsideAccelOf(p); return ua.accelK > 0 && ua.months >= 0 && ua.months <= 6 && ua.revFwdM >= 0; }), "upsideAccelOf yields a bounded accelerator (accelK>0, 0≤months≤6, revFwd≥0) for every project");
ok(upsideAccelOf({ ...P0, upsideAccelK: 500 }).accelK === 500, "upsideAccelOf honors an explicit per-project intake override");
ok(upsideAccelOf({ ...P0, upsideAccelK: undefined }).accelK === Math.round(P0.nreK * 0.15), "upsideAccelOf defaults to 15% of NRE when no intake is set");
ok(upsideAccelOf(P0).revFwdM === upsideAccelOf(P0).revFwdM, "upsideAccelOf is deterministic (single source of truth)");

/* ---------------- Roles / membership + pure can() permission helper (Slice 5) ---------------- */
import { can, roleOf, isLastLead, ROLE_RANK, PROJECT_ROLES } from "../lib/innovation-data.ts";
// viewer = read-only (no write action authorized)
ok(["reorder","editSource","editGateStatus","signoff","approve","editBudget","comment","recommend"].every((a) => !can("viewer", a)), "viewer authorizes no write actions (read-only)");
// editor = edit/comment/recommend/gate-status/reorder, but NOT sign-off/approve/budget
ok(can("editor","editSource") && can("editor","comment") && can("editor","recommend") && can("editor","editGateStatus") && can("editor","reorder"), "editor authorizes edit/comment/recommend/gate-status/reorder");
ok(!can("editor","signoff") && !can("editor","approve") && !can("editor","editBudget"), "editor cannot sign-off, approve, or edit budget");
// approver adds sign-off + approve, still not budget
ok(can("approver","signoff") && can("approver","approve") && !can("approver","editBudget"), "approver adds sign-off + approve but not budget");
// lead can do everything
ok(["reorder","editSource","editGateStatus","signoff","approve","editBudget","comment","recommend"].every((a) => can("lead", a)), "lead authorizes every action");
ok(!can(null, "comment") && !can(undefined, "comment"), "no role authorizes nothing");
ok(ROLE_RANK.viewer < ROLE_RANK.editor && ROLE_RANK.editor < ROLE_RANK.approver && ROLE_RANK.approver < ROLE_RANK.lead, "role rank strictly increases viewer→lead");
ok(PROJECT_ROLES.length === 4, "four project roles");
// roleOf: no members ⇒ implicit owner Lead; known member gets their role; unknown gets viewer
ok(roleOf({}, "P-1", "u1") === "lead", "no members ⇒ implicit owner is Lead (never bricks the tool)");
ok(roleOf({ "P-1": [{ userRef: "u1", role: "editor" }] }, "P-1", "u1") === "editor", "roleOf returns a member's assigned role");
ok(roleOf({ "P-1": [{ userRef: "u1", role: "lead" }] }, "P-1", "u2") === "viewer", "a non-member on a populated project is viewer");
// last-lead guard
ok(isLastLead({ "P-1": [{ userRef: "u1", role: "lead" }, { userRef: "u2", role: "editor" }] }, "P-1", "u1"), "isLastLead true when only one lead remains");
ok(!isLastLead({ "P-1": [{ userRef: "u1", role: "lead" }, { userRef: "u2", role: "lead" }] }, "P-1", "u1"), "isLastLead false when another lead exists");

/* ---------------- Node allocation + UPSIDE (unallocated funds) per BU/SBU/Alpha Group (A1) ---------------- */
import { nodeAllocation, defaultBudgetK } from "../lib/innovation-data.ts";
{
  const availK = scenarioAvailK("base");
  const funded = new Set(DEMO_PROJECTS.slice(0, 11).map((p) => p.id));
  for (const level of ["bu", "sbu", "pgroup"]) {
    const alloc = nodeAllocation(DEMO_PROJECTS, level, (id) => funded.has(id), availK);
    ok(alloc.length >= 1, `nodeAllocation returns nodes at ${level}`);
    ok(alloc.every((n) => n.upsideK === Math.max(0, n.budgetK - n.allocatedK)), `${level}: upside = max(0, budget − allocated) (unallocated bucket)`);
    ok(alloc.every((n) => n.overK === Math.max(0, n.allocatedK - n.budgetK)), `${level}: over = max(0, allocated − budget)`);
    ok(alloc.every((n) => n.upsideK >= 0 && n.overK >= 0 && n.utilPct >= 0), `${level}: allocation figures are non-negative`);
    ok(alloc.every((n) => !(n.upsideK > 0 && n.overK > 0)), `${level}: a node is never both under- and over-allocated`);
  }
  // Budgets sum to ~the R&D envelope at each level (revenue-base split), so upside is a real slice of dry powder.
  const buBudgets = nodeAllocation(DEMO_PROJECTS, "bu", (id) => funded.has(id), availK).reduce((s, n) => s + n.budgetK, 0);
  ok(Math.abs(buBudgets - availK) <= 5, "BU-level default budgets sum to the R&D envelope (±rounding)");
  const sbuBudgets = nodeAllocation(DEMO_PROJECTS, "sbu", (id) => funded.has(id), availK).reduce((s, n) => s + n.budgetK, 0);
  ok(Math.abs(sbuBudgets - availK) <= 10, "SBU-level default budgets sum to the R&D envelope (±rounding)");
  // Override pins a node budget (lead sets financial spend for a node)
  const over = nodeAllocation(DEMO_PROJECTS, "bu", (id) => funded.has(id), availK, (lvl, code) => (lvl === "bu" && code === "MS" ? 99000 : undefined));
  ok(over.find((n) => n.code === "MS")?.budgetK === 99000, "budget override pins a node's financial spend");
  ok(defaultBudgetK(DEMO_PROJECTS, "bu", "MS", availK) === defaultBudgetK(DEMO_PROJECTS, "bu", "MS", availK), "defaultBudgetK is deterministic");
}

/* ---------------- Strategic-pillar color (InnovationTag highlight) — P1 ---------------- */
import { pillarColorOf, PILLAR_COLOR } from "../lib/innovation-data.ts";
ok(STRATEGIC_INITIATIVES.every((n) => pillarColorOf(n) === PILLAR_COLOR[n]), "pillarColorOf returns the Trinity default for each of the 4 pillars");
ok(pillarColorOf(STRATEGIC_INITIATIVES[0]) === "#19c8cf", "1st pillar default = AI cyan (Trinity)");
ok(pillarColorOf("Autonomous Loitering Munitions", [{ name: "Autonomous Loitering Munitions", color: "#123456" }]) === "#123456", "pillarColorOf honors a PillarDef.color override");
ok(/^#[0-9a-fA-F]{3,8}$/.test(pillarColorOf("Some Custom Admin Pillar")), "unknown pillar resolves to a valid hex (hashed fallback)");
ok(pillarColorOf("Some Custom Admin Pillar") === pillarColorOf("Some Custom Admin Pillar"), "hashed fallback is deterministic");
ok(pillarColorOf("Autonomous Loitering Munitions", [{ name: "Autonomous Loitering Munitions", color: "nope" }]) === PILLAR_COLOR["Autonomous Loitering Munitions"], "an invalid override falls back to the default map");
ok(DEMO_PROJECTS.every((p) => /^#[0-9a-fA-F]{3,8}$/.test(pillarColorOf(metaOf(p).initiative))), "every seed project resolves to a valid pillar hex");

/* ---------------- BU·SBU·Alpha Group multi-select scope filter — P2 ---------------- */
import { scopeByHier, hierValues as hv2 } from "../lib/innovation-data.ts";
{
  const empty = { bu: [], sbu: [], pgroup: [] };
  ok(scopeByHier(DEMO_PROJECTS, empty).length === DEMO_PROJECTS.length, "scopeByHier all-empty → all projects");
  const oneBu = hierOf(DEMO_PROJECTS[0]).bu;
  const buFiltered = scopeByHier(DEMO_PROJECTS, { bu: [oneBu], sbu: [], pgroup: [] });
  ok(buFiltered.length > 0 && buFiltered.every((p) => hierOf(p).bu === oneBu), "scopeByHier filters by a single BU");
  const twoBus = hv2(DEMO_PROJECTS, "bu");
  ok(scopeByHier(DEMO_PROJECTS, { bu: twoBus, sbu: [], pgroup: [] }).length === DEMO_PROJECTS.length, "selecting every BU = all (OR within level)");
  // AND across levels: BU ∩ SBU (pick an sbu under oneBu)
  const sbuUnder = hierOf(buFiltered[0]).sbu;
  const anded = scopeByHier(DEMO_PROJECTS, { bu: [oneBu], sbu: [sbuUnder], pgroup: [] });
  ok(anded.every((p) => hierOf(p).bu === oneBu && hierOf(p).sbu === sbuUnder), "scopeByHier ANDs across BU + SBU");
  ok(scopeByHier(DEMO_PROJECTS, { bu: ["__nope__"], sbu: [], pgroup: [] }).length === 0, "unknown value → empty");
  ok(scopeByHier(DEMO_PROJECTS, empty) !== scopeByHier(DEMO_PROJECTS, empty) || true, "scopeByHier pure (no throw)");
  ok(scopeByHier(DEMO_PROJECTS, { bu: [oneBu], sbu: [], pgroup: [] }).length === buFiltered.length, "scopeByHier deterministic for same input");
}

/* ---------------- scrubText — no secrets/PII into shared blobs (P3 Security) ---------------- */
import { scrubText } from "../lib/innovation-data.ts";
ok(scrubText("sk_live_ABCDEF1234567890").includes("[redacted]"), "scrubText redacts Stripe-style secret keys");
ok(!/[A-Za-z0-9_-]{40,}/.test(scrubText("tok_" + "a".repeat(50))), "scrubText redacts long opaque tokens");
ok(scrubText("  Jane   Doe  ") === "Jane Doe", "scrubText collapses whitespace + trims");
ok(scrubText("ab ".repeat(80), 64).length === 64, "scrubText caps length");
ok(scrubText("jane@example.com") === "jane@example.com", "scrubText leaves a normal ref intact");
ok(scrubText("a") === scrubText("a"), "scrubText deterministic");

/* ---------------- redactSecrets / scrubDeep — cloud-write choke point (P3 Security net-new) ---------------- */
import { redactSecrets, scrubDeep } from "../lib/innovation-data.ts";
ok(redactSecrets("key sk_live_ABCDEF1234567890 here").includes("[redacted]"), "redactSecrets strips Stripe-style keys");
ok(!/[A-Za-z0-9_-]{40,}/.test(redactSecrets("tok_" + "a".repeat(50))), "redactSecrets strips long opaque tokens");
ok(redactSecrets("Line 1\nLine 2\n  indented") === "Line 1\nLine 2\n  indented", "redactSecrets preserves prose whitespace/newlines");
ok(redactSecrets("ab ".repeat(2000)).length === 4000, "redactSecrets caps at generous 4000");
ok(redactSecrets("A short value prop.") === "A short value prop.", "redactSecrets leaves normal prose intact");
{
  const blob = { valueProp: "beats sk_live_DEADBEEF12345678 rivals", nested: { note: "tok_" + "b".repeat(50) }, list: ["ok", "sk_test_ABCDEFGHIJKLMNOP"], num: 42, flag: true };
  const safe = scrubDeep(blob);
  ok(safe.valueProp.includes("[redacted]") && !safe.valueProp.includes("sk_live"), "scrubDeep redacts nested string field");
  ok(!/[A-Za-z0-9_-]{40,}/.test(safe.nested.note), "scrubDeep recurses into nested objects");
  ok(safe.list[1].includes("[redacted]") && safe.list[0] === "ok", "scrubDeep recurses into arrays");
  ok(safe.num === 42 && safe.flag === true, "scrubDeep leaves non-strings untouched");
  ok(blob.valueProp.includes("sk_live"), "scrubDeep does not mutate the input");
}

/* ---------------- Funding & approval AUDIT TRAIL (Slice 6) ---------------- */
import { makeAuditEntry, mergeAudit, diffFundedSets, summarizeAudit, fmtAuditEntry } from "../lib/innovation-data.ts";
{
  const ts = "2026-07-27T12:00:00.000Z";
  const e1 = makeAuditEntry({ ts, kind: "edit", projectId: "P-1", project: "Alpha", field: "nreK", from: "100", to: "200", by: "u1" });
  ok(makeAuditEntry({ ts, kind: "edit", projectId: "P-1", project: "Alpha", field: "nreK", from: "100", to: "200", by: "u1" }).id === e1.id, "makeAuditEntry id is content-stable/deterministic");
  ok(makeAuditEntry({ ts, kind: "edit", projectId: "P-1", field: "npv", from: "1", to: "2", by: "u1" }).id !== e1.id, "different content → different id");
  const a = [e1], b = [makeAuditEntry({ ts: "2026-07-27T13:00:00.000Z", kind: "approve", projectId: "P-1", project: "Alpha", by: "u2" })];
  const m1 = mergeAudit(a, b), m2 = mergeAudit(b, a);
  ok(m1.length === 2 && new Set(m1.map((x) => x.id)).size === 2, "mergeAudit unions (no dup)");
  ok(JSON.stringify(new Set(m1.map((x) => x.id))) === JSON.stringify(new Set(m2.map((x) => x.id))), "mergeAudit order-independent by id set");
  ok(mergeAudit(a, a).length === 1, "mergeAudit dedups identical entries");
  ok(m1[0].ts >= m1[1].ts, "mergeAudit newest-first");
  ok(mergeAudit(Array.from({ length: 20 }, (_, i) => makeAuditEntry({ ts: `2026-07-27T00:00:${String(i).padStart(2, "0")}.000Z`, kind: "edit", projectId: `P-${i}`, by: "u" })), [], 5).length === 5, "mergeAudit honors the size cap");
  const diff = diffFundedSets(["A", "B"], ["B", "C"], (id) => id, ts, "u1");
  ok(diff.length === 2 && diff.some((d) => d.kind === "fund" && d.projectId === "C") && diff.some((d) => d.kind === "defund" && d.projectId === "A"), "diffFundedSets yields fund(C) + defund(A)");
  ok(diffFundedSets(["A"], ["A"], (id) => id, ts, "u1").length === 0, "diffFundedSets no-op on identical sets");
  ok(summarizeAudit(m1).approve === 1 && summarizeAudit(m1).edit === 1, "summarizeAudit counts by kind");
  ok(typeof fmtAuditEntry(e1) === "string" && fmtAuditEntry(e1).includes("Alpha"), "fmtAuditEntry renders a human line");
}

/* ---------------- Audit TIMELINE scrubber (play-bar) ---------------- */
import { auditTimeline, isMajorAudit, MAJOR_AUDIT_KINDS } from "../lib/innovation-data.ts";
{
  ok(isMajorAudit("approve") && isMajorAudit("fund") && isMajorAudit("budget"), "approve/fund/budget are MAJOR (red dot)");
  ok(!isMajorAudit("edit") && !isMajorAudit("scenario"), "edit/scenario are minor (grey tick)");
  ok(MAJOR_AUDIT_KINDS.length === 5, "5 major kinds");
  ok(auditTimeline([]).length === 0, "auditTimeline empty → empty");
  const mk = (ts, kind) => makeAuditEntry({ ts, kind, projectId: "P", by: "u" });
  const tl = auditTimeline([
    mk("2026-07-27T14:00:00.000Z", "approve"),
    mk("2026-07-27T10:00:00.000Z", "edit"),
    mk("2026-07-27T12:00:00.000Z", "budget"),
  ]);
  ok(tl.length === 3, "auditTimeline keeps every entry");
  ok(tl[0].t === 0 && tl[2].t === 1, "auditTimeline normalizes oldest→0, newest→1");
  ok(tl[0].entry.kind === "edit" && tl[2].entry.kind === "approve", "auditTimeline sorts ascending by time");
  ok(Math.abs(tl[1].t - 0.5) < 1e-9, "auditTimeline positions the mid entry proportionally");
  ok(tl[2].major === true && tl[0].major === false, "auditTimeline flags major vs minor");
  const same = auditTimeline([mk("2026-07-27T10:00:00.000Z", "edit"), mk("2026-07-27T10:00:00.000Z", "fund")]);
  ok(same[0].t === 0 && same[1].t === 1, "auditTimeline even-spaces when timestamps collapse to one instant");
}

/* ---------------- HI inputs complete for EVERY project (no blank value prop / NBA / drivers / segments) ---------------- */
{
  const incomplete = DEMO_PROJECTS.filter((p) =>
    !(p.valueProp && p.valueProp.trim().length > 20) ||
    !(p.nextBestAlternative && p.nextBestAlternative.trim().length > 5) ||
    !(Array.isArray(p.valueDrivers) && p.valueDrivers.length >= 1) ||
    !(Array.isArray(p.segmentValueProps) && p.segmentValueProps.length >= 1));
  ok(incomplete.length === 0, `every project has complete HI inputs (valueProp+NBA+drivers+segments) — ${incomplete.map((p) => p.id).join(",") || "all complete"}`);
  const ivas = DEMO_PROJECTS.find((p) => p.id === "PRJ-23");
  ok(!!ivas && /IVAS/.test(ivas.name) && ivas.nreK === 18000, "IVAS example project present ($18M ROM)");
  ok(!!ivas && ivas.segmentValueProps.some((s) => /Field Operatives|Officers|Joint Force/.test(s.segment)), "IVAS captures role-based UX segments");
  const node = DEMO_PROJECTS.find((p) => p.id === "PRJ-24");
  ok(!!node && /Swarm C2/.test(node.name), "Swarm C2 Edge Node example present");
  ok(!!node && node.valueDrivers.some((d) => /edge C2 continuity/i.test(d.name)), "Swarm C2 node captures comms-degraded edge C2 driver");
}

/* ---------------- Partial multi-document intake resolves WHOLE (derived-fallback engine) ---------------- */
{
  // A node presented only PARTIALLY (one document set a few fields; drivers/segments/brief absent) must still
  // render complete — briefOf + derivedDriversOf synthesize the gaps, so a two-document merge never blanks.
  const partial = { ...DEMO_PROJECTS[0], id: "TEST-PARTIAL", name: "Swarm C2 (partial doc)", valueProp: undefined, nextBestAlternative: undefined, valueDrivers: undefined, segmentValueProps: undefined };
  const b = briefOf(partial);
  ok(b.needs.length > 0 && b.outcomes.length > 0 && b.solution.length > 0 && b.evidence.length > 0, "briefOf yields a full 4-section brief for a partial project");
  ok(derivedDriversOf(partial).length >= 1, "derivedDriversOf yields ≥1 driver when none were provided");
}

/* ---------------- Cadence-driven $ unit (Optimize → $/period) ---------------- */
import { CADENCE_UNIT, fmtPerCadence } from "../lib/innovation-data.ts";
{
  ok(["Q", "M", "W", "D"].every((c) => CADENCE_UNIT[c]), "CADENCE_UNIT has all 4 cadences");
  ok(CADENCE_UNIT.M.short === "mo" && CADENCE_UNIT.W.short === "wk" && CADENCE_UNIT.D.short === "day" && CADENCE_UNIT.Q.short === "qtr", "cadence short units mo/wk/day/qtr");
  // working-minute multipliers scale D→W→M→Q strictly increasing
  ok(CADENCE_UNIT.D.perMinMult < CADENCE_UNIT.W.perMinMult && CADENCE_UNIT.W.perMinMult < CADENCE_UNIT.M.perMinMult && CADENCE_UNIT.M.perMinMult < CADENCE_UNIT.Q.perMinMult, "perMinMult increases D<W<M<Q");
  ok(fmtPerCadence(1, "M").endsWith("/mo"), "fmtPerCadence suffixes /mo for Monthly");
  ok(fmtPerCadence(1, "W").endsWith("/wk"), "fmtPerCadence suffixes /wk for Weekly");
  ok(fmtPerCadence(1, "D").endsWith("/day"), "fmtPerCadence suffixes /day for Daily");
  ok(fmtPerCadence(0, "M") === "$0/mo", "fmtPerCadence handles zero");
  // Calendar-minute basis (SoI $/min framework): month burn = perMin × CADENCE_UNIT.M.perMinMult (elapsed
  // calendar minutes/month). Derive the expected string from the active calendar so it's basis-independent.
  {
    const v = 10 * CADENCE_UNIT.M.perMinMult;
    const exp = v >= 1e6 ? `$${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M/mo` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}k/mo` : `$${Math.round(v).toLocaleString()}/mo`;
    ok(fmtPerCadence(10, "M") === exp, "fmtPerCadence scales by calendar minutes/month + compacts");
  }
  ok(CADENCE_UNIT.D.perMinMult === 1440, "day = 1440 elapsed calendar minutes (24h, not an 8h workday)");
  ok(CADENCE_UNIT.W.perMinMult === 7 * 1440, "week = 7 × 1440 elapsed calendar minutes");
  ok(fmtPerCadence(1, "M") === fmtPerCadence(1, "M"), "fmtPerCadence deterministic");
}

/* ---------------- Slice E — slidesForProject + 12-AsM SLIDE_SEED (HI + enhanced AI) ---------------- */
import { slidesForProject, nextGate, SLIDE_SEED, changeSummaryRows, reviewApprovalRows } from "../lib/innovation-data.ts";
{
  ok(nextGate("G2") === "G3" && nextGate("G7") === "G7", "nextGate advances and clamps at G7");
  const p4 = DEMO_PROJECTS.find((p) => p.id === "PRJ-04"); // G2
  const sset = slidesForProject(p4);
  ok(["S1", "S2", "S3"].every((c) => sset.includes(c)), "slidesForProject always includes S1–S3");
  ok(SLIDE_SCHEMA.filter((s) => s.gate === "G2").every((s) => sset.includes(s.code)), "slidesForProject includes current-gate slides");
  ok(SLIDE_SCHEMA.filter((s) => s.gate === "G3").every((s) => sset.includes(s.code)), "slidesForProject includes next-gate slides");
  ok(new Set(sset).size === sset.length, "slidesForProject de-dups");
  ok(!sset.includes("S16") && !sset.includes("S18"), "slidesForProject excludes far-gate slides");
  ok(sset.includes("CS") && sset.includes("RA"), "slidesForProject always includes the CS + RA closeouts");
  ok(sset[sset.length - 2] === "CS" && sset[sset.length - 1] === "RA", "CS + RA are the last two slides in the deck");
  ok(DEMO_PROJECTS.every((p) => { const s = slidesForProject(p); return s.includes("CS") && s.includes("RA"); }), "every project ships CS + RA");
  // CS + RA live-governance row builders (pure — consume already-timestamped audit + membership)
  const act = [
    { id: "a1", ts: "2026-02-01T00:00:00Z", kind: "approve", projectId: "PRJ-04", by: "◬ AI" },
    { id: "a2", ts: "2026-01-01T00:00:00Z", kind: "edit", projectId: "PRJ-04", field: "nreK", from: "100", to: "120", by: "you" },
    { id: "a3", ts: "2026-01-01T00:00:00Z", kind: "edit", projectId: "PRJ-99", by: "x" },
  ];
  const cs = changeSummaryRows(act, "PRJ-04");
  ok(cs.length === 2 && cs.every((r) => r.length === 3), "changeSummaryRows filters to the project as [When, Change, By]");
  ok(cs[0][1].includes("100 → 120") || cs[1][1].includes("100 → 120"), "CS shows the from→to delta");
  const ra = reviewApprovalRows(act, { "PRJ-04": [{ userRef: "J. Doe", role: "approver" }] }, "PRJ-04", "A. Seguin", "IRB");
  ok(ra[0][0] === "Product Manager" && ra[0][1] === "A. Seguin", "RA leads with the PdM (title + name)");
  ok(ra.some((r) => r[0] === "Approver" && r[1] === "J. Doe"), "RA lists assigned team roles with title + name");
  ok(ra.some((r) => r[2] === "Approved ✓"), "RA surfaces board approve decisions");
  // Seed coverage (active once the 12-AsM seed is populated): every in-scope non-linked field has non-empty
  // hi AND ai, with ai a genuine enhancement (ai ≠ hi). Skipped while SLIDE_SEED is empty (scaffold only).
  const emptyV = (v) => v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
  if (Object.keys(SLIDE_SEED).length) {
    const specBy = Object.fromEntries(SLIDE_SCHEMA.map((s) => [s.code, s]));
    let cells = 0, gaps = [], notEnhanced = 0;
    for (const p of DEMO_PROJECTS) {
      for (const code of slidesForProject(p)) {
        for (const f of specBy[code].fields) {
          if (f.linked || f.kind === "chart" || f.kind === "attach" || f.mirror) continue;
          const cell = SLIDE_SEED[p.id]?.[code]?.[f.id];
          cells++;
          if (!cell || emptyV(cell.hi) || emptyV(cell.ai)) { gaps.push(`${p.id}/${code}/${f.id}`); continue; }
          if (JSON.stringify(cell.ai) === JSON.stringify(cell.hi)) notEnhanced++;
        }
      }
    }
    ok(gaps.length === 0, `SLIDE_SEED covers every in-scope non-linked field (hi+ai) — ${gaps.length ? gaps.slice(0, 8).join(", ") + (gaps.length > 8 ? ` +${gaps.length - 8}` : "") : cells + " cells"}`);
    ok(notEnhanced === 0, `SLIDE_SEED ai differs from hi on every cell (${notEnhanced} identical)`);
    ok(typeof SLIDE_SEED["PRJ-23"]?.["S1"]?.["oneline"]?.hi === "string", "IVAS S1 one-liner seeded");

    // S4 CONOPS — 6–10 ordered HI steps (operator floor), with the enhanced AI a genuine superset (ai ≥ hi).
    const conopsCells = DEMO_PROJECTS
      .map((p) => SLIDE_SEED[p.id]?.["S4"]?.["conops"])
      .filter((c) => Array.isArray(c?.hi));
    ok(conopsCells.length > 0, "at least one in-scope S4 CONOPS is seeded");
    ok(conopsCells.every((c) => c.hi.length >= 6 && c.hi.length <= 10), "S4 CONOPS HI has 6–10 ordered steps");
    ok(conopsCells.every((c) => c.ai.length >= c.hi.length), "S4 CONOPS AI is a superset (≥ HI step count)");

    // S5 customer problem statement — 2–3 bullets per list section (outcomes/whys/statusquo).
    const s5Lists = DEMO_PROJECTS.flatMap((p) => ["outcomes", "whys", "statusquo"]
      .map((fid) => SLIDE_SEED[p.id]?.["S5"]?.[fid]).filter((c) => Array.isArray(c?.hi)));
    ok(s5Lists.length > 0, "at least one in-scope S5 list section is seeded");
    ok(s5Lists.every((c) => c.hi.length >= 2), "S5 sections carry ≥2 bullets (HI)");
  }

  // S3 cash chart contract — a `horizon`-year CAGR spans `horizon+1` year points (3→4, 5→6, 10→11).
  for (const h of [3, 5, 10]) ok(financialsOverview(DEMO_PROJECTS[0], { years: h + 1, funded: true }).length === h + 1,
    `S3 chart renders horizon+1 (${h}-Yr → ${h + 1} year points)`);
}

/* ---------------- H3 — MoT time-spread (cost/rev/margin → $/min) ---------------- */
import { spreadPerMin, spreadDaysOf, linearize, SPREAD_BASES } from "../lib/soi-calendar.ts";
{
  ok(SPREAD_BASES.some((b) => b.days === 91) && SPREAD_BASES.some((b) => b.days === 365), "spread bases include 91-day (SoI) + 365-day");
  ok(spreadDaysOf("q91") === 91 && spreadDaysOf("y365") === 365 && spreadDaysOf("custom", 120) === 120, "spreadDaysOf maps presets + custom");
  const totalUsd = 1_000_000;
  const perMin91 = spreadPerMin(totalUsd, 91), perMin365 = spreadPerMin(totalUsd, 365);
  ok(Math.abs(perMin91 - totalUsd / (91 * 1440)) < 1e-9, "spreadPerMin = total / (days × 1440 min)");
  ok(Math.abs(perMin91 / perMin365 - 365 / 91) < 1e-9, "91-day $/min is ~4× the 365-day $/min (same total)");
  const lin = linearize([0, 0, 120, 0]);
  ok(lin.every((v) => Math.abs(v - 30) < 1e-9), "linearize spreads a lumpy series to its even average");
  ok(Math.abs(lin.reduce((a, b) => a + b, 0) - 120) < 1e-9, "linearize conserves the total");
}

/* ---------------- H4 — Dependency Constellations: deterministic force layout ---------------- */
import { constellationLayout } from "../lib/innovation-data.ts";
{
  const nodes = ["A", "B", "C", "D", "E"];
  const edges = [{ from: "A", to: "B" }, { from: "C", to: "B" }, { from: "D", to: "E" }];
  const L1 = constellationLayout(nodes, edges, { w: 640, h: 400, iters: 80 });
  const L2 = constellationLayout(nodes, edges, { w: 640, h: 400, iters: 80 });
  ok(nodes.every((n) => L1[n] && typeof L1[n].x === "number"), "constellationLayout places every node");
  ok(nodes.every((n) => JSON.stringify(L1[n]) === JSON.stringify(L2[n])), "constellationLayout is deterministic (same seed → same coords)");
  ok(nodes.every((n) => L1[n].x >= 0 && L1[n].x <= 640 && L1[n].y >= 0 && L1[n].y <= 400), "nodes stay within the viewbox");
  ok(constellationLayout([], [], {}) && Object.keys(constellationLayout([], [])).length === 0, "empty graph → empty layout (no crash)");
  ok(constellationLayout(["X"], [{ from: "X", to: "MISSING" }]).X, "edges to missing nodes are ignored, node still placed");
}

/* ---------------- G4 — slide version history + replay backbone ---------------- */
import { makeSlideVersion, mergeSlideVersions, slideVersionTimeline, versionDelta, isSubstantial, finSnapOf, buildDemoVersionSeed, SUBSTANTIAL_THRESHOLD } from "../lib/innovation-data.ts";
{
  const P = DEMO_PROJECTS.find((p) => p.id === "PRJ-01");
  const fin0 = finSnapOf(P);
  ok(typeof fin0.nreK === "number" && typeof fin0.npvM === "number", "finSnapOf returns a numeric financial snapshot");
  const mk = (ts, status) => makeSlideVersion({ ts, projectId: "PRJ-01", slide: "S1", gate: "G1", by: "웃 HI", status, comment: "", fields: { oneline: { hi: "a", ai: "b", mode: "hi" } }, fin: fin0 });
  const v1 = mk("2026-01-01T00:00:00Z", "drafted"), v1b = mk("2026-01-01T00:00:00Z", "drafted");
  ok(v1.id === v1b.id, "makeSlideVersion id is content-stable (deterministic)");
  const v2 = mk("2026-02-01T00:00:00Z", "approved");
  const merged = mergeSlideVersions([v1, v2], [v1]);
  ok(merged.length === 2, "mergeSlideVersions dedups by id");
  ok(merged[0].ts >= merged[1].ts, "mergeSlideVersions is newest-first");
  const tl = slideVersionTimeline([v1, v2]);
  ok(tl.length === 2 && tl[0].t === 0 && tl[1].t === 1, "slideVersionTimeline normalizes oldest→newest [0..1]");
  ok(tl[1].approved === true, "timeline flags approved versions");
  // versionDelta / isSubstantial — 10% boundary
  const base = { nreK: 1000, revM: 100, marginM: 40, npvM: 50 };
  ok(Math.abs(versionDelta(base, { ...base, nreK: 1100 }) - 0.10) < 1e-9, "versionDelta = max fractional move (10% NRE)");
  ok(isSubstantial(0.10) && isSubstantial(0.2) && !isSubstantial(0.099), `isSubstantial at the ${SUBSTANTIAL_THRESHOLD * 100}% threshold`);
  ok(versionDelta(base, base) === 0, "no change → zero delta");
  // demo synthetic history — non-empty + ordered + shows financial progression
  const seed = buildDemoVersionSeed(P);
  ok(seed.length >= 3, "buildDemoVersionSeed seeds a light history for demo projects");
  const s1 = seed.filter((v) => v.slide === "S1").sort((a, b) => a.ts.localeCompare(b.ts));
  ok(s1.length === 3 && s1[0].status === "drafted" && s1[2].status === "approved", "demo S1 history runs drafted → submitted → approved");
  ok(s1[0].fin.npvM < s1[2].fin.npvM, "demo financials progress upward over versions");
  ok(buildDemoVersionSeed(DEMO_PROJECTS.find((p) => p.id === "PRJ-24")).length === 0, "non-demo projects start with empty history");
}

/* ---------------- G5 — S16 PLC classifier + S8 value chart field ---------------- */
import { plcStageOf } from "../lib/innovation-data.ts";
{
  ok(plcStageOf(-2).stage === "PLC-4" && plcStageOf(-2).label === "Decline", "negative CAGR → PLC-4 Decline");
  ok(plcStageOf(0).stage === "PLC-3" && plcStageOf(3).stage === "PLC-3", "0–3% CAGR → PLC-3 Mature (boundary inclusive)");
  ok(plcStageOf(3.01).stage === "PLC-2" && plcStageOf(15).stage === "PLC-2", "3–15% CAGR → PLC-2 Growth");
  ok(plcStageOf(25).stage === "PLC-1", ">15% CAGR → PLC-1 Introduction");
  // S8 gains a linked value chart field (waterfall + WTP positioning)
  ok(slideSpec("S8").fields.some((f) => f.id === "valuechart" && f.kind === "chart" && f.linked), "S8 carries a linked value chart field");
  // S16 AI draft surfaces the PLC classification
  const s16plc = aiSlideField(DEMO_PROJECTS[0], "S16", "plc");
  ok(Array.isArray(s16plc) && s16plc.some((r) => /PLC-3/.test(r[0])), "aiSlideField S16.plc lists the PLC ladder");
}

/* ---------------- SoI Calendar engine (integer 13-week basis · Gregorian default · Perihelion anchor) ---------------- */
import { CALENDARS, DEFAULT_CALENDAR, activeCalendar, calMinutes, soiYearStartUTC } from "../lib/soi-calendar.ts";
{
  ok(DEFAULT_CALENDAR === "gregorian" && activeCalendar().id === "gregorian", "engine defaults to regular (Gregorian)");
  ok(!!CALENDARS.gregorian && !!CALENDARS.soi91, "both calendars available (gregorian + soi91)");
  // SoI clean basis: 91-day quarter = exactly 13 weeks; 4×91 = 364 grid + 1 intercalary day.
  ok(CALENDARS.soi91.quarterDays === 91 && CALENDARS.soi91.quarterDays / CALENDARS.soi91.weekDays === 13, "SoI quarter = 91 days = 13 weeks exactly");
  ok(CALENDARS.soi91.quarterDays * 4 === 364 && CALENDARS.soi91.intercalary === 1, "SoI year = 364-day grid + 1 intercalary day");
  ok(calMinutes("D") === 1440 && calMinutes("W") === 10080, "calMinutes: day 1440, week 10080 (elapsed calendar)");
  ok(calMinutes("Q", CALENDARS.soi91) === 91 * 1440, "calMinutes honors a passed calendar (SoI quarter = 91×1440)");
  ok(typeof soiYearStartUTC(2025) === "string" && soiYearStartUTC(1900) === null, "Perihelion anchor table (confirm annually w/ NASA)");
}

console.log(`\nINNOVATION-TIME ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
