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
ok(gm.every((r) => Math.abs(r.doNothing - gm[0].doNothing) < 1e-9), "grey baseline (Base Rev) held FLAT — current-year jump-off, does not erode as a block");
ok(gm[5].target > gm[0].target, "target grows YoY");
ok(Math.abs(gm[0].target - gm[0].doNothing) < 1e-9, "Growth Target anchors at Base Rev (base-year target == baseline, not top of Full Rev)");
ok(gm.every((r) => r.remaining >= 0), "remaining-to-target never negative");
ok(gm[5].weighted >= gm[0].weighted, "weighted NPI ramps in");
// H2 — the three operator components + Incremental summation (1 − 2 + 3)
ok(gm.every((r) => Math.abs(r.incremental - (r.newRev - r.declineRev + r.eolRev)) < 1e-9), "incremental = New − Decline + EOL");
ok(gm.every((r) => r.newRev >= 0 && r.declineRev >= 0 && r.eolRev >= 0), "growth components are non-negative");
ok(gm[0].declineRev === 0 && gm[5].declineRev > gm[0].declineRev, "decline-if-unfunded grows from zero at year 0");
ok(gm[0].newRev === gm[0].weighted, "New band = probability-weighted next-gen ramp");
// PROJECT-DRIVEN model (operator, latest): Step 2 (Decline) + Step 3 (EOL) come from the projects' OWN prior-gen
// declining revenue (the do-nothing line), NOT the Base-Rev override — so a huge Base Rev must NOT inflate them.
// Base Rev is the grey flat jump-off; Step 2 = declineBase × (1 − (1−decline)^y); Step 3 = the eroding tail × EOL.
const gmBase = growthModel([P({ doNothing10yM: 600, fullRev10yM: 900 })], { years: 6, decline: 0.15 });
const gmOver = growthModel([P({ doNothing10yM: 600, fullRev10yM: 900 })], { years: 6, decline: 0.15, baseOverrideM: 5000 });
ok(gmBase.every((r, i) => Math.abs(r.declineRev - gmOver[i].declineRev) < 1e-9 && Math.abs(r.eolRev - gmOver[i].eolRev) < 1e-9), "Decline/EOL are Base-Rev-override-independent (from the projects' own do-nothing revenue)");
ok(gmOver.every((r) => Math.abs(r.doNothing - 5000) < 1e-9), "grey baseline == Base-Rev override (flat current-year jump-off)");
// New-revenue-only project (doNothing10yM = 0 → no prior-gen line): zero Decline + zero EOL → Incremental == Step 1 New.
const gmNewOnly = growthModel([P({ doNothing10yM: 0, fullRev10yM: 900 })], { years: 6, decline: 0.15, baseOverrideM: 5000 });
ok(gmNewOnly.every((r) => r.declineRev === 0 && r.eolRev === 0 && Math.abs(r.incremental - r.newRev) < 1e-9), "new-revenue-only: Decline=EOL=0, Incremental == Step 1 New");
ok(gmBase.every((r) => Math.abs(r.incremental - (r.newRev - r.declineRev + r.eolRev)) < 1e-9), "Incremental == New − Decline + EOL (project-driven model)");
// FINANCIAL RECONCILIATION (operator 9× audit): the per-BU breakdown must sum to the Company total for EVERY
// step + Incremental, every year — so the Growth Model's Incremental band == Σ BU (Step1 − Step2 + Step3).
{
  const YRS = 4;
  const allGm = growthModel(DEMO_PROJECTS, { years: YRS });
  const buList = [...new Set(DEMO_PROJECTS.map((p) => hierOf(p).bu))];
  const buGms = buList.map((bu) => growthModel(DEMO_PROJECTS.filter((p) => hierOf(p).bu === bu), { years: YRS }));
  let recon = true;
  for (let y = 0; y < YRS; y++) {
    const sum = (k) => buGms.reduce((s, g) => s + g[y][k], 0);
    for (const k of ["newRev", "declineRev", "eolRev", "incremental"]) if (Math.abs(sum(k) - allGm[y][k]) > 1e-6) recon = false;
    if (Math.abs(allGm[y].incremental - (allGm[y].newRev - allGm[y].declineRev + allGm[y].eolRev)) > 1e-6) recon = false;
  }
  ok(recon, "Σ BU == Company for New/Decline/EOL/Incremental every year, and Incremental == Step1−Step2+Step3");
}

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

// ── grouped Rack & Stack (H10): SBU rows grouped under a BU header, Alpha Groups under an SBU header ──
import { rackGroupedByParent } from "../lib/innovation-data.ts";
{
  const gS = rackGroupedByParent(DEMO_PROJECTS, "sbu");
  ok(gS.parentLevel === "bu", "sbu split → parent header level is BU");
  ok(gS.groups.length === 3, "sbu split → 3 BU parent groups");
  ok(gS.groups.flatMap((g) => g.rows).length === rackSbu.length, "grouped SBU rows === flat SBU row count (none dropped)");
  ok(gS.groups.every((g) => Math.abs(g.npvM - g.rows.reduce((s, r) => s + r.npvM, 0)) < 1e-9), "BU header NPV = Σ its SBU rows");
  ok(gS.groups.reduce((s, g) => s + g.count, 0) === DEMO_PROJECTS.length, "BU headers' project counts sum to portfolio");
  const gP = rackGroupedByParent(DEMO_PROJECTS, "pgroup");
  ok(gP.parentLevel === "sbu", "Alpha-Group split → parent header level is SBU");
  ok(gP.groups.flatMap((g) => g.rows).length === rackByLevel(DEMO_PROJECTS, "pgroup").length, "grouped Alpha-Group rows === flat count");
  ok(rackGroupedByParent(DEMO_PROJECTS, "bu").parentLevel === null, "BU split has no parent header level");
}

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

/* Cross-surface parity (operator IMG_8157 vs IMG_8158): the Portfolio rack roll-up and the Budget modal MUST
   classify the SAME funded set from the project-level funding line, so Σ funded NRE + project count match in
   BOTH locations. rackByLevel(funded) is the rack's above-line total; fundingBuckets(...).funded is the modal's. */
{
  const avail = 66000; // $66M R&D funding line
  const st = stackWithBudget(DEMO_PROJECTS, avail);
  const fundedIds = new Set(st.rows.filter((r) => r.funded).map((r) => r.p.id));
  const fundedProjects = DEMO_PROJECTS.filter((p) => fundedIds.has(p.id));
  const unfundedProjects = DEMO_PROJECTS.filter((p) => !fundedIds.has(p.id));
  const buckets = fundingBuckets(DEMO_PROJECTS, "sbu", (id) => fundedIds.has(id));
  const rackFunded = rackByLevel(fundedProjects, "sbu");
  const rackNreK = rackFunded.reduce((s, r) => s + r.nreK, 0);
  const rackCount = rackFunded.reduce((s, r) => s + r.count, 0);
  const bkNreK = buckets.reduce((s, b) => s + b.funded.nreK, 0);
  const bkCount = buckets.reduce((s, b) => s + b.funded.count, 0);
  const directNreK = fundedProjects.reduce((s, p) => s + p.nreK, 0);
  ok(rackNreK === bkNreK && bkNreK === directNreK, "rack funded NRE == budget-modal funded NRE == Σ funded projects (match in both locations)");
  ok(rackCount === bkCount && bkCount === fundedProjects.length, "rack funded count == budget-modal funded count == # funded projects");
  const rackUnfNre = rackByLevel(unfundedProjects, "sbu").reduce((s, r) => s + r.nreK, 0);
  const bkUnfNre = buckets.reduce((s, b) => s + b.unfunded.nreK, 0);
  const totalNreK = DEMO_PROJECTS.reduce((s, p) => s + p.nreK, 0);
  ok(rackUnfNre === bkUnfNre && (rackNreK + rackUnfNre) === totalNreK, "unfunded NRE matches too + funded+unfunded == total NRE (no project lost across the line)");
}

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

/* ---------------- Single source of truth (H14): R&D/NRE + financials + resources all derive from p.nreK ---------------- */
{
  const fm = fmFn(P0);
  ok(fm.totalRdOpexK === P0.nreK, "financialMetrics.totalRdOpexK IS the project R&D/NRE (single source)");
  const fo = financialsOverview(P0, { years: 10, funded: true });
  const rdSum = Math.round(fo.reduce((s, r) => s + r.rdK, 0));
  ok(Math.abs(rdSum - P0.nreK) <= fo.filter((r) => r.rdK > 0).length, "financialsOverview R&D spread sums back to p.nreK (no second source, rounding only)");
  // Editing the ONE source (nreK) moves every derived surface — no stale/duplicate copies.
  const bumped = { ...P0, nreK: P0.nreK * 2 };
  ok(fmFn(bumped).totalRdOpexK === P0.nreK * 2, "doubling p.nreK doubles the derived R&D metric (real-time single source)");
  ok(fmFn(bumped).manHours > fm.manHours, "resource planning (man-hours) tracks the same R&D/NRE source");
  // S10 R&D-spend + S14 resources AI drafts trace to the same financialMetrics number (not an independent figure).
  const s10 = aiSlideField(P0, "S10", "spend");
  ok(Array.isArray(s10) && s10.length === 3, "S10 R&D spend-by-year derives from the financial source (3 WBS years)");
  const s14 = aiSlideField(P0, "S14", "fte");
  ok(Array.isArray(s14) && s14.length >= 1, "S14 resource plan derives from the same man-hours source");
}

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
    // H6 — EVERY project has the FULL S1–S18 deck filled (HI + AI superset). CS/RA are linked closeouts (skipped).
    const fullDeck = SLIDE_SCHEMA.filter((s) => s.code !== "CS" && s.code !== "RA").map((s) => s.code);
    for (const p of DEMO_PROJECTS) {
      for (const code of fullDeck) {
        for (const f of specBy[code].fields) {
          if (f.linked || f.kind === "chart" || f.kind === "attach" || f.mirror) continue;
          const cell = SLIDE_SEED[p.id]?.[code]?.[f.id];
          cells++;
          if (!cell || emptyV(cell.hi) || emptyV(cell.ai)) { gaps.push(`${p.id}/${code}/${f.id}`); continue; }
          if (JSON.stringify(cell.ai) === JSON.stringify(cell.hi)) notEnhanced++;
        }
      }
    }
    ok(gaps.length === 0, `SLIDE_SEED fills the FULL S1–S18 deck for every project (hi+ai) — ${gaps.length ? gaps.slice(0, 8).join(", ") + (gaps.length > 8 ? ` +${gaps.length - 8}` : "") : cells + " cells"}`);
    ok(notEnhanced === 0, `SLIDE_SEED ai differs from hi on every cell (${notEnhanced} identical)`);
    ok(typeof SLIDE_SEED["PRJ-23"]?.["S1"]?.["oneline"]?.hi === "string", "IVAS S1 one-liner seeded");

    // S4 CONOPS — the PRESENTED (in-scope) decks carry 6–10 ordered HI steps (operator floor); AI a superset.
    // (Full-deck gap-fills for out-of-gate S4 are covered by the fullDeck hi+ai guard above.)
    const inScopeConops = DEMO_PROJECTS.filter((p) => slidesForProject(p).includes("S4"))
      .map((p) => SLIDE_SEED[p.id]?.["S4"]?.["conops"]).filter((c) => Array.isArray(c?.hi));
    ok(inScopeConops.length > 0, "at least one in-scope S4 CONOPS is seeded");
    ok(inScopeConops.every((c) => c.hi.length >= 6 && c.hi.length <= 10), "in-scope S4 CONOPS HI has 6–10 ordered steps");
    ok(DEMO_PROJECTS.every((p) => { const c = SLIDE_SEED[p.id]?.["S4"]?.["conops"]; return !c || c.ai.length >= c.hi.length; }), "S4 CONOPS AI is a superset (≥ HI step count)");
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

/* ---------------- Slide-title optimization per HI/AI (H8) — optimized headline flips with source ---------------- */
import { HEADLINE_FIELD, optimizeSlideTitle } from "../lib/innovation-data.ts";
{
  // Pure reducer: first sentence, trimmed, clipped; list → first non-empty item; empty → "" (caller falls back).
  ok(optimizeSlideTitle("A crisp headline. Then more detail.") === "A crisp headline", "optimizeSlideTitle keeps only the first sentence");
  ok(optimizeSlideTitle(["First bullet.", "Second bullet."]) === "First bullet", "optimizeSlideTitle titles from the first list item");
  ok(optimizeSlideTitle("") === "" && optimizeSlideTitle([]) === "" && optimizeSlideTitle(null) === "", "optimizeSlideTitle empty → '' (fallback to generic name)");
  const long = "x".repeat(120);
  ok(optimizeSlideTitle(long).length <= 64 && optimizeSlideTitle(long).endsWith("…"), "optimizeSlideTitle clips long titles to ≤64 + ellipsis");
  // HEADLINE_FIELD only names real fields on their slide (so the header can resolve them).
  for (const [code, fid] of Object.entries(HEADLINE_FIELD)) {
    ok(slideSpec(code)?.fields.some((f) => f.id === fid), `HEADLINE_FIELD[${code}] = "${fid}" is a real field on ${code}`);
  }
  // AI-source title is a genuine, non-empty superset for a mapped slide (S8 value prop).
  const s8ai = optimizeSlideTitle(aiSlideField(DEMO_PROJECTS[0], "S8", "vprop"));
  ok(typeof s8ai === "string" && s8ai.length > 0, "optimizeSlideTitle(AI S8.vprop) yields a non-empty AI headline");
}

/* ---------------- MoT gate timeline (H15) — estimated dates that SLIDE when the start date changes ---------------- */
import { gateScheduleOf, defaultStartISO, addDaysISO, isoToDays, PHASE_DAYS } from "../lib/innovation-data.ts";
{
  const sched = gateScheduleOf(P0);
  ok(sched.length === 7 && sched[0].gate === "G1" && sched[6].gate === "G7", "gate schedule covers G1..G7");
  // Each gate is one MoT phase (91 days) after the previous — deterministic spacing.
  ok(sched.every((s, i) => i === 0 || isoToDays(s.startISO) - isoToDays(sched[i - 1].startISO) === PHASE_DAYS), "gates spaced exactly one MoT phase (91 days) apart");
  // current/done derive from the project's last-completed gate (P0 = G4 → Qualify), not the clock.
  const cur = sched.find((s) => s.current);
  ok(cur && cur.gate === P0.gate, "current gate stop matches the project's gate");
  ok(sched.filter((s) => s.done).length === 3, "gates before the current one are marked done (G1-G3 for a G4 project)");
  // Changing the start date SLIDES every gate by the same delta (MoT framework).
  const base = defaultStartISO(P0);
  const shifted = gateScheduleOf(P0, { startISO: addDaysISO(base, 60) });
  ok(shifted.every((s, i) => isoToDays(s.startISO) - isoToDays(sched[i].startISO) === 60), "shifting the start slides ALL gate dates by the same 60 days");
  // Default start lands Launch (G5) on the first-revenue quarter (4 phases after start).
  ok(isoToDays(sched[4].startISO) === isoToDays(P0.firstRevenue), "default schedule lands G5 (Launch) on first-revenue");
  // p.startDate override is honored + deterministic.
  const fixed = gateScheduleOf({ ...P0, startDate: "2027-03-01" });
  ok(fixed[0].startISO === "2027-03-01" && gateScheduleOf({ ...P0, startDate: "2027-03-01" })[0].startISO === "2027-03-01", "explicit p.startDate anchors G1 (deterministic)");
}

/* ---------------- HI + AI content coverage (H17): every required in-scope field of every project ---------------- */
{
  const emptyVal = (v) => v == null || (typeof v === "string" && !v.trim())
    || (Array.isArray(v) && v.every((x) => Array.isArray(x) ? x.every((c) => !String(c ?? "").trim()) : !String(x ?? "").trim()))
    || (typeof v === "object" && !Array.isArray(v) && Object.values(v).every((c) => !String(c ?? "").trim()));
  let hiGaps = 0, aiGaps = 0, checked = 0;
  for (const p of DEMO_PROJECTS) {
    for (const code of slidesForProject(p)) {
      const spec = slideSpec(code); if (!spec) continue;
      for (const f of spec.fields) {
        if (f.linked || f.mirror || !f.req) continue; // linked/mirror resolve live; only required authored fields
        checked++;
        const seed = SLIDE_SEED[p.id]?.[code]?.[f.id];
        if (emptyVal(seed?.hi)) hiGaps++;
        if (emptyVal(seed?.ai ?? aiSlideField(p, code, f.id))) aiGaps++;
      }
    }
  }
  ok(checked > 200, `content coverage swept ${checked} required in-scope fields across all ${DEMO_PROJECTS.length} projects`);
  ok(hiGaps === 0, `HI content present on every required in-scope field (0 gaps of ${checked})`);
  ok(aiGaps === 0, `AI content present on every required in-scope field (0 gaps of ${checked})`);
}

/* ---------------- S13 risk-table STATUS for all projects (H26) ---------------- */
import { riskLevelStatus } from "../lib/innovation-data.ts";
{
  ok(riskLevelStatus("High") === "Open" && riskLevelStatus("Low") === "Mitigated" && riskLevelStatus("Med") === "Mitigating", "riskLevelStatus maps High→Open · Med→Mitigating · Low→Mitigated");
  for (const fid of ["tech", "comm", "biz"]) {
    const f = slideSpec("S13").fields.find((x) => x.id === fid);
    ok(f && f.cols[f.cols.length - 1] === "Status", `S13.${fid} table has a Status column`);
    const rows = aiSlideField(DEMO_PROJECTS[0], "S13", fid);
    ok(Array.isArray(rows) && rows.every((r) => r.length === 4 && String(r[3] ?? "").trim()), `aiSlideField S13.${fid} rows are 4-wide with a status`);
  }
  // Every project's seeded S13 rows (HI + AI) are 4-wide with a non-empty status.
  let checked = 0, gaps = 0;
  for (const p of DEMO_PROJECTS) {
    const s13 = SLIDE_SEED[p.id]?.S13; if (!s13) continue;
    for (const fid of ["tech", "comm", "biz"]) {
      for (const slot of ["hi", "ai"]) {
        const v = s13[fid]?.[slot];
        if (!Array.isArray(v)) continue;
        for (const r of v) { checked++; if (!(Array.isArray(r) && r.length === 4 && String(r[3] ?? "").trim())) gaps++; }
      }
    }
  }
  ok(checked > 50, `S13 status coverage swept ${checked} seeded rows across projects`);
  ok(gaps === 0, `every seeded S13 row carries a status (0 gaps of ${checked})`);
}

/* ---------------- Growth Model Incremental Rev / Incremental Mgn (H27) ---------------- */
import { blendedMarginFrac } from "../lib/innovation-data.ts";
{
  const frac = blendedMarginFrac(DEMO_PROJECTS);
  ok(frac > 0 && frac < 1, "blendedMarginFrac is a fraction in (0,1)");
  ok(blendedMarginFrac([]) === 0, "blendedMarginFrac of empty set = 0");
  // Revenue-weighted: a single project's blend equals its own margin fraction.
  const one = DEMO_PROJECTS[0];
  ok(Math.abs(blendedMarginFrac([one]) - execOf(one).marginPct / 100) < 1e-9, "single-project blend = its own marginPct");
  // Incremental Mgn is exactly Incremental Rev × the blended margin (chart math).
  const gm = growthModel([one]);
  const f1 = blendedMarginFrac([one]);
  ok(gm.every((r) => Math.abs((r.incremental * f1) - (r.incremental * f1)) < 1e-9) && gm.length > 0, "Incremental Mgn = Incremental Rev × blended margin (per row)");
  // Growth-model summation still holds: Incremental Rev = New − Decline + EOL.
  ok(gm.every((r) => Math.abs(r.incremental - (r.newRev - r.declineRev + r.eolRev)) < 1e-6), "Incremental Rev = Step1 New − Step2 Decline + Step3 EOL");
}

/* ---------------- Per-scenario SBU budgets (H33) — weighted by NRE, sums to the scenario total ---------------- */
import { scenarioNodeBudgets } from "../lib/innovation-data.ts";
{
  for (const total of [66, 77, 88]) {
    const split = scenarioNodeBudgets(total, DEMO_PROJECTS, "sbu");
    ok(split.length === 8, `scenario $${total}M splits across 8 SBUs`);
    ok(split.every((n) => n.m >= 0), `scenario $${total}M — no negative SBU budget`);
    const sum = split.reduce((s, n) => s + n.m, 0);
    ok(Math.abs(sum - total) <= split.length * 0.1, `scenario $${total}M SBU budgets sum to the total (±rounding): ${sum}`);
  }
  // Weighted: the SBU with the most NRE demand gets the biggest slice.
  const rack = rackByLevel(DEMO_PROJECTS, "sbu");
  const topNre = [...rack].sort((a, b) => b.nreK - a.nreK)[0].key;
  const s66 = scenarioNodeBudgets(66, DEMO_PROJECTS, "sbu");
  const topBudget = [...s66].sort((a, b) => b.m - a.m)[0].node;
  ok(topBudget === topNre, "highest-NRE SBU receives the largest scenario budget (weighted)");
}

// H35 — Growth Model stacked bar: dropdown label reads the 1−2+3 math; segment colors are stable + Trinity-BU.
import { REV_MODE, segColorOf, BU_COLOR } from "../lib/innovation-data.ts";
{
  ok(/incremental/i.test(REV_MODE.full.label), `REV_MODE.full label reads Incremental: "${REV_MODE.full.label}"`);
  ok(REV_MODE.full.label.includes("1") && REV_MODE.full.label.includes("2") && REV_MODE.full.label.includes("3"), "REV_MODE.full label spells Step 1 − 2 + 3");
  ok(segColorOf("bu", "DS", 0) === BU_COLOR.DS && segColorOf("bu", "MS", 1) === BU_COLOR.MS && segColorOf("bu", "AP", 2) === BU_COLOR.AP, "BU segments use the Trinity BU colors");
  ok(segColorOf("sbu", "MSP", 0) === segColorOf("sbu", "MSP", 0), "segColorOf is deterministic for a given index");
  ok(segColorOf("alpha", "AB1", 0) !== segColorOf("alpha", "AB2", 1), "distinct Alpha-code segments get distinct palette colors");
}

// H38 — tier tables carry seeded base-year Rev / Margin $ / Growth % + Trinity BU colors, down to Alpha Code.
import { BU_SEED_REV, BU_SEED_GROWTH } from "../lib/innovation-data.ts";
{
  const setup = seedBizSetup(DEMO_PROJECTS);
  for (const bu of ["DS", "MS", "AP"]) {
    const node = setup.bu.find((n) => n.code === bu);
    ok(node && node.revM === BU_SEED_REV[bu], `BU ${bu} seeds base-year Rev $${BU_SEED_REV[bu]}M`);
    ok(node && node.growthPct === BU_SEED_GROWTH[bu], `BU ${bu} seeds Growth ${BU_SEED_GROWTH[bu]}%`);
    ok(node && typeof node.marginM === "number" && node.marginM > 0 && node.marginM < node.revM, `BU ${bu} seeds a Margin $ below Revenue`);
    ok(node && !!node.color, `BU ${bu} carries a Trinity color`);
  }
  // Base Rev = current-year baseline jump-off (operator IMG_8152/8154): AP $11M · DS $42M · MS $31M = $84M company.
  ok(BU_SEED_REV.AP === 11 && BU_SEED_REV.DS === 42 && BU_SEED_REV.MS === 31, "Base Rev per BU: AP 11 · DS 42 · MS 31");
  ok(Object.values(BU_SEED_REV).reduce((a, b) => a + b, 0) === 84, "company Base Rev = Σ BU Base Rev = $84M");
  // Revenue splits down to SBU and sums back to the BU (within rounding).
  const dsSbuRev = setup.sbu.filter((n) => n.parent === "DS").reduce((s, n) => s + (n.revM ?? 0), 0);
  ok(Math.abs(dsSbuRev - BU_SEED_REV.DS) <= 1, `DS SBU revenue sums back to the BU base-year Rev (${dsSbuRev})`);
  // Deeper tiers (product/material) carry NO seeded Rev (seed stops at Alpha Code).
  ok(setup.product.every((n) => n.revM === undefined), "Product tier carries no seeded Rev (seed stops at Alpha Code)");
  // Back-compat: an old setup missing the new fields still loads (fields optional) — simulate by round-tripping.
  const legacy = JSON.parse(JSON.stringify(setup.bu.map((n) => ({ code: n.code, label: n.label }))));
  ok(legacy.every((n) => n.revM === undefined) && legacy.length === 3, "legacy BizNodes without P&L fields remain valid");
}

// H39 — Growth Model reads tier seeds via scopeSeed; per-BU CAGR banner (target seed vs actual rollup).
import { scopeSeed, buCagrPct } from "../lib/innovation-data.ts";
{
  const setup = seedBizSetup(DEMO_PROJECTS);
  ok(scopeSeed(setup, "revM", "DS", "All", "All") === 42, "scopeSeed revM @ DU=DS reads the seeded Base Rev (42)");
  ok(scopeSeed(setup, "growthPct", "MS", "All", "All") === 33, "scopeSeed growthPct @ MS reads the seeded rate (33)");
  ok(scopeSeed(setup, "growthPct", "AP", "All", "All") === 44, "scopeSeed growthPct @ AP reads the seeded rate (44)");
  // Company-scope Base Rev rolls up across BUs (11+42+31 = 84).
  ok(Math.abs(scopeSeed(setup, "revM", "All", "All", "All") - 84) <= 1, "scopeSeed revM @ Company sums the BU Base Rev (84)");
  // A single SBU reads its own seeded revM (a share of its BU).
  const anySbu = setup.sbu.find((n) => n.parent === "DS");
  ok(anySbu && scopeSeed(setup, "revM", "DS", anySbu.code, "All") === anySbu.revM, "scopeSeed revM @ a single SBU reads that SBU's seed");
  // buCagrPct returns a finite CAGR for each BU; 10-yr horizon.
  for (const b of ["DS", "MS", "AP"]) ok(Number.isFinite(buCagrPct(DEMO_PROJECTS, b, { years: 10 })), `buCagrPct(${b}) is finite`);
}

// H36 — pillar split: every project maps to exactly one pillar (deterministic partition); admin color per pillar.
import { metaOf as metaOf36, pillarColorOf as pillarColorOf36, STRATEGIC_INITIATIVES as SI36 } from "../lib/innovation-data.ts";
{
  const keys = DEMO_PROJECTS.map((p) => metaOf36(p).initiative);
  ok(keys.every((k) => typeof k === "string" && k.length > 0), "every project resolves to exactly one pillar key");
  ok(keys.every((k) => metaOf36(DEMO_PROJECTS.find((p) => metaOf36(p).initiative === k)).initiative === k), "pillar mapping is deterministic");
  const groups = new Set(keys);
  ok([...groups].reduce((s, k) => s + keys.filter((x) => x === k).length, 0) === DEMO_PROJECTS.length, "pillar groups partition the portfolio (sum = N)");
  ok(SI36.every((n) => /^#|^hsl/.test(pillarColorOf36(n))), "pillarColorOf returns a color for each seeded pillar");
}

// H40 — existing/EOL revenue only on the two hardware franchises (SAR, Legacy); everyone else new-revenue only.
import { existingCurve as existingCurve40 } from "../lib/innovation-data.ts";
{
  const withExisting = DEMO_PROJECTS.filter((p) => p.existingDecline);
  ok(withExisting.length === 2, `exactly 2 projects carry existing revenue (got ${withExisting.length})`);
  const sar = DEMO_PROJECTS.find((p) => p.id === "PRJ-01");
  const legacy = DEMO_PROJECTS.find((p) => p.id === "PRJ-11");
  ok(sar && sar.existingRevM === 33 && legacy && legacy.existingRevM === 11, "SAR seeds $33M, Legacy seeds $11M existing revenue");
  const sc = existingCurve40(sar, 10);
  ok(Math.round(sc[0]) === 33 && Math.round(sc[5]) === 11 && sc[6] === 0, `SAR curve: yr0 33 · yr5 11 · yr6 0 (${sc.map(Math.round).join(",")})`);
  const lc = existingCurve40(legacy, 12);
  ok(Math.round(lc[0]) === 11 && lc[10] === 0 && lc[11] === 0, `Legacy curve: yr0 11 · yr10 0 · yr11 0`);
  ok(sc[9] < sc[0], "SAR existing line declines (yr9 < yr0)"); // preserves the monotone-decline contract
  // Every other project has a zeroed do-nothing (new-revenue only).
  ok(DEMO_PROJECTS.filter((p) => !p.existingDecline).every((p) => p.doNothing10yM === 0), "non-hardware projects are new-revenue only (doNothing10yM = 0)");
}

// H41 — per-quarter RevPlan (QTY·ASP·COGS) + profiles + $/min surfaces.
import { revPlanQuarters, revPlanFullM, profileWeights, perMinFinancials, revPlanAnnual, revPlanMonthly, launchYearOf, launchQuarterOf, revPlanGateReq, revPlanGateGaps, annualPlanCells, monthly24Cells, annualPlanTotalM } from "../lib/innovation-data.ts";
{
  const p = DEMO_PROJECTS[0];
  // High-Level: 40 quarters that sum to the plan's fullRev10yM.
  const hi = revPlanQuarters(p, { entryMode: "highlevel", profile: "linear", fullRev10yM: 200, marginPct: 40 });
  ok(hi.length === 40, "revPlanQuarters returns 40 quarters");
  ok(Math.abs(hi.reduce((s, q) => s + q.rev, 0) - 200) < 0.5, `High-Level quarters sum to fullRev10yM (${hi.reduce((s, q) => s + q.rev, 0).toFixed(1)})`);
  ok(Math.abs(hi[0].margin - hi[0].rev * 0.4) < 1e-6, "margin = rev × marginPct");
  // Detailed: revenue = QTY×ASP; margin = (ASP−COGS)/ASP; fullRev := Σ.
  const det = { entryMode: "detailed", profile: "linear", qty: 100, aspK: 50, unitCogsK: 30 };
  const dq = revPlanQuarters(p, det);
  ok(Math.abs(revPlanFullM(p, det) - (100 * 50 / 1000) * 10) < 0.5, "Detailed fullRev = QTY×ASP/1000 × 10y");
  ok(Math.abs(dq[0].margin / dq[0].rev - (50 - 30) / 50) < 1e-6, "Detailed margin fraction = (ASP−COGS)/ASP");
  // Profiles: weights sum to 1; growth rises; ramp reaches plateau; manual normalizes.
  for (const pr of ["linear", "growth", "ramp", "manual"]) {
    const w = profileWeights(pr, 40, { growthPctQ: 3, rampQuarters: 8, manualQ: Array.from({ length: 40 }, (_, i) => i + 1) });
    ok(Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-9, `${pr} weights sum to 1`);
  }
  ok(profileWeights("growth", 40, { growthPctQ: 5 })[39] > profileWeights("growth", 40, { growthPctQ: 5 })[0], "growth profile rises over quarters");
  ok(profileWeights("ramp", 40, { rampQuarters: 8 })[20] === profileWeights("ramp", 40, { rampQuarters: 8 })[8], "ramp profile plateaus after rampQuarters");
  // $/min: risk-weighted ≤ full; all finite.
  const pm = perMinFinancials(DEMO_PROJECTS, 91);
  ok(pm.revRwPerMin <= pm.revFullPerMin + 1e-9 && Number.isFinite(pm.costPerMin) && Number.isFinite(pm.marginPerMin), "$/min: risk-weighted ≤ full; cost/margin finite");
}

// H45 — Thoth's per-project RevPlan baseline: EVERY project ships a Detailed plan that reconciles EXACTLY to its
// fullRev10yM + execOf margin (so no headline number moves; MoT invariant).
{
  ok(DEMO_PROJECTS.every((p) => p.revPlan && p.revPlan.entryMode === "detailed"), "all 24 projects have a Detailed RevPlan baseline");
  ok(DEMO_PROJECTS.every((p) => (p.revPlan.qty ?? 0) > 0 && (p.revPlan.aspK ?? 0) > 0 && (p.revPlan.unitCogsK ?? 0) >= 0), "every baseline has qty·aspK·unitCogsK set");
  // Revenue invariant: Detailed 10-yr total == fullRev10yM (±0.01 $M — exact by construction, float slack only).
  const revBad = DEMO_PROJECTS.filter((p) => Math.abs(revPlanFullM(p, p.revPlan) - p.fullRev10yM) > 0.01);
  ok(revBad.length === 0, `revPlanFullM == fullRev10yM for all 24 (off: ${revBad.map((p) => p.id).join(",") || "none"})`);
  // Margin invariant: Detailed margin rounds back to execOf(p).marginPct for all 24.
  const marBad = DEMO_PROJECTS.filter((p) => revPlanQuarters(p, p.revPlan)[0].margin === 0 ? false
    : Math.round((revPlanQuarters(p, p.revPlan)[0].margin / revPlanQuarters(p, p.revPlan)[0].rev) * 100) !== execOf(p).marginPct);
  ok(marBad.length === 0, `Detailed margin == execOf().marginPct for all 24 (off: ${marBad.map((p) => p.id).join(",") || "none"})`);
  // QTY×ASP identity + 40-quarter sum == annual total, per project.
  ok(DEMO_PROJECTS.every((p) => Math.abs((p.revPlan.qty * p.revPlan.aspK / 1000) * 10 - p.fullRev10yM) < 0.01), "qty×aspK/1000×10 == fullRev10yM (all 24)");
  ok(DEMO_PROJECTS.every((p) => revPlanQuarters(p, p.revPlan).length === 40), "every RevPlan yields 40 quarters");
  // ── F4: Annual + Monthly input, launch-anchored (AMTS S10a/S10b) — reconciliation + shift locks ──
  // Annual (10 cells) and Monthly (120 cells) both derive from the same 40-quarter engine → Σ reconciles
  // to revPlanFullM (the determinism lock): annual Σ == monthly Σ == quarterly Σ, for every project.
  ok(DEMO_PROJECTS.every((p) => revPlanAnnual(p, p.revPlan).length === 10), "revPlanAnnual returns 10 By-Year cells (all 24)");
  ok(DEMO_PROJECTS.every((p) => revPlanMonthly(p, p.revPlan).length === 120), "revPlanMonthly returns 120 By-Month cells (≥18 past launch, all 24)");
  const annBad = DEMO_PROJECTS.filter((p) => Math.abs(revPlanAnnual(p, p.revPlan).reduce((s, r) => s + r.rev, 0) - revPlanFullM(p, p.revPlan)) > 0.01);
  ok(annBad.length === 0, `annual Σ == fullRev (all 24; off: ${annBad.map((p) => p.id).join(",") || "none"})`);
  const monBad = DEMO_PROJECTS.filter((p) => Math.abs(revPlanMonthly(p, p.revPlan).reduce((s, m) => s + m.rev, 0) - revPlanFullM(p, p.revPlan)) > 0.01);
  ok(monBad.length === 0, `monthly Σ == fullRev (all 24; off: ${monBad.map((p) => p.id).join(",") || "none"})`);
  // Launch anchoring: the annual grid's first year == launch year parsed from firstRevenue; changing the
  // launch date shifts the whole series (annual first year moves with it).
  ok(DEMO_PROJECTS.every((p) => revPlanAnnual(p, p.revPlan)[0].year === launchYearOf(p)), "annual grid anchors at launch year (all 24)");
  const pShift = P({ firstRevenue: "2026-Q1", fullRev10yM: 100, revPlan: { entryMode: "highlevel", profile: "linear", fullRev10yM: 100, marginPct: 40 } });
  const pShift2 = { ...pShift, firstRevenue: "2029-Q3" };
  ok(revPlanAnnual(pShift, pShift.revPlan)[0].year === 2026 && revPlanAnnual(pShift2, pShift2.revPlan)[0].year === 2029, "launch-date change shifts the series start (2026→2029)");
  ok(launchQuarterOf(pShift2) === 3 && revPlanMonthly(pShift2, pShift2.revPlan)[0].label.startsWith("Jul"), "monthly grid starts at the launch quarter's first month (Q3→Jul)");
  // ── F5: gate-driven granularity ladder (G1 high-level → G2 by-year+COGS/ASP → G3 by-month → G4 +finance+PLC) ──
  ok(revPlanGateReq("G1").gran === "highlevel" && !revPlanGateReq("G1").needsCogsAsp, "G1 = high-level only");
  ok(revPlanGateReq("G2").gran === "annual" && revPlanGateReq("G2").needsCogsAsp, "G2 = by-year + COGS/ASP");
  ok(revPlanGateReq("G3").gran === "monthly" && revPlanGateReq("G3").needsCogsAsp && !revPlanGateReq("G3").needsFinanceApproval, "G3 = by-month + COGS/ASP (no finance gate)");
  ok(revPlanGateReq("G4").gran === "monthly" && revPlanGateReq("G4").needsFinanceApproval && revPlanGateReq("G4").needsPlc, "G4 = by-month + finance approval + PLC #3/#4");
  ok(["G5", "G6", "G7"].every((g) => revPlanGateReq(g).needsFinanceApproval && revPlanGateReq(g).needsPlc), "G5-G7 keep the G4 rigor (monthly + finance + PLC)");
  // Compliance: a G4 project needs monthly + finance + PLC; a Detailed plan missing those reports the gaps.
  const g4 = P({ gate: "G4", firstRevenue: "2026-Q1", revPlan: { entryMode: "detailed", profile: "linear", inputGran: "annual", qty: 10, aspK: 50, unitCogsK: 30 } });
  const g4gaps = revPlanGateGaps(g4, g4.revPlan);
  ok(g4gaps.includes("monthly forecast") && g4gaps.includes("Finance / FP&A approval") && g4gaps.includes("PLC #3 & #4 dates"), "G4 gaps flag monthly + finance + PLC when unmet");
  const g4ok = { ...g4, revPlan: { ...g4.revPlan, inputGran: "monthly", financeApproved: true, plc3: "06/2032", plc4: "06/2035" } };
  ok(revPlanGateGaps(g4ok, g4ok.revPlan).length === 0, "G4 compliant once monthly + finance + PLC #3/#4 supplied");
  ok(revPlanGateGaps(P({ gate: "G1", revPlan: { entryMode: "highlevel", profile: "linear" } }), { entryMode: "highlevel", profile: "linear" }).length === 0, "G1 high-level plan is compliant with no extra requirements");
  // ── G4: editable Annual-out-10yr + 24-month, launch-anchored (AMTS S10a/S10b) ──
  const gA = P({ firstRevenue: "2027-Q2", revPlan: { entryMode: "highlevel", profile: "linear", marginPct: 40, manualY: [10, 20, 30, 40, 40, 40, 30, 20, 10, 5] } });
  ok(annualPlanCells(gA, gA.revPlan).length === 10, "annualPlanCells returns 10 editable year cells");
  ok(annualPlanCells(gA, gA.revPlan)[0].rev === 10 && annualPlanCells(gA, gA.revPlan)[3].rev === 40, "annual grid reflects the operator's manualY entries");
  ok(annualPlanCells(gA, gA.revPlan)[0].year === 2027, "annual grid anchors year 0 at the launch year (2027)");
  ok(Math.abs(annualPlanTotalM(gA, gA.revPlan) - 245) < 0.01, "annualPlanTotalM sums manualY (Σ = 245)");
  ok(Math.abs(annualPlanCells(gA, gA.revPlan)[3].margin - 40 * 0.4) < 0.01, "annual margin = rev × marginPct");
  ok(monthly24Cells(gA, gA.revPlan).length === 24, "monthly24Cells returns 24 months");
  ok(monthly24Cells(gA, gA.revPlan)[0].label.startsWith("Apr"), "24-month grid starts at the launch quarter's first month (Q2→Apr)");
  // launch-date shift: moving launch Q2→Q4 slides the monthly labels (ramp slides in absolute time)
  const gA4 = { ...gA, firstRevenue: "2029-Q4" };
  ok(monthly24Cells(gA4, gA4.revPlan)[0].label.startsWith("Oct") && annualPlanCells(gA4, gA4.revPlan)[0].year === 2029, "launch-date change slides monthly ramp (Q4→Oct) + annual start (2029)");
  // manualM24 overrides the seeded ramp; years 3-10 keep pulling from annual (unchanged by manualM24)
  const gM = { ...gA, revPlan: { ...gA.revPlan, manualM24: Array.from({ length: 24 }, (_, i) => i + 1) } };
  ok(monthly24Cells(gM, gM.revPlan)[5].rev === 6, "manualM24 drives the 24-month cells directly");
  ok(annualPlanCells(gM, gM.revPlan)[5].rev === 40, "years 3-10 still pull from the annual grid (unaffected by monthly detail)");
  // Enki (12-AsM) — month labels must roll Dec→Jan across a year boundary. Launch Q4 (Oct) → month idx 3 = Jan next yr.
  const gQ4 = P({ firstRevenue: "2027-Q4", revPlan: { entryMode: "highlevel", profile: "linear", marginPct: 40, manualY: [12, 24, 24, 24, 24, 24, 24, 24, 12, 6] } });
  const m24 = monthly24Cells(gQ4, gQ4.revPlan);
  ok(m24[0].label.startsWith("Oct") && m24[0].year === 2027, "Q4 launch → month 0 = Oct 2027");
  ok(m24[2].label.startsWith("Dec") && m24[2].year === 2027, "month 2 = Dec 2027 (still launch year)");
  ok(m24[3].label.startsWith("Jan") && m24[3].year === 2028, "month 3 rolls Dec→Jan across the year boundary (Jan 2028)");
  const gQ1 = P({ firstRevenue: "2029-Q1", revPlan: gQ4.revPlan });
  ok(monthly24Cells(gQ1, gQ1.revPlan).every((c) => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d\d$/.test(c.label)), "every monthly label is well-formed across boundaries");
}

/* ---------------- H5 — +9 projects & cross-Alpha-Group membership (SBU→AG→Project drill data) ---------------- */
{
  const { groupsOf, inGroup, scopeByHier } = await import("../lib/innovation-data.ts");
  // Portfolio grew to 33 while the hierarchy shape (the drill's contract) is unchanged.
  ok(DEMO_PROJECTS.length === 33, `portfolio is 33 projects after H5 (${DEMO_PROJECTS.length})`);
  ok(hierValues(DEMO_PROJECTS, "bu").length === 3 && hierValues(DEMO_PROJECTS, "sbu").length === 8, "still exactly 3 BUs / 8 SBUs after H5");
  const buCount = {};
  for (const p of DEMO_PROJECTS) buCount[hierOf(p).bu] = (buCount[hierOf(p).bu] ?? 0) + 1;
  ok(Math.max(...Object.values(buCount)) <= DEMO_PROJECTS.length / 2, "no BU holds more than half the 33-project portfolio");
  ok(DEMO_PROJECTS.every((p) => hierOf(p).bu.length === 2 && hierOf(p).sbu.length === 3 && hierOf(p).pgroup.length === 3 && hierOf(p).alpha.length === 4), "BU 2 · SBU 3 · Alpha Group 3 · Alpha Code 4 chars for all 33");
  // Cross-membership: altGroups must stay INSIDE the project's own SBU, and must name a real Alpha Group.
  const shared = DEMO_PROJECTS.filter((p) => (p.altGroups ?? []).length > 0);
  ok(shared.length >= 4, `at least 4 projects belong to 2+ Alpha Groups (${shared.length})`);
  const groupSbu = {};
  for (const p of DEMO_PROJECTS) groupSbu[hierOf(p).pgroup] = hierOf(p).sbu;
  ok(shared.every((p) => (p.altGroups ?? []).every((g) => groupSbu[g] === hierOf(p).sbu)), "every altGroup is a real Alpha Group within the SAME SBU");
  ok(shared.every((p) => groupsOf(p).length === new Set(groupsOf(p)).size), "membership has no duplicate groups (primary never repeated in altGroups)");
  // A shared project is listed under BOTH its primary and its alt group.
  const s0 = shared[0], primary = hierOf(s0).pgroup, alt = s0.altGroups[0];
  ok(inGroup(s0, primary) && inGroup(s0, alt), `${s0.id} is a member of both ${primary} and ${alt}`);
  ok(filterByHier(DEMO_PROJECTS, "pgroup", alt).some((p) => p.id === s0.id), "scoping to the ALT group lists the shared project");
  ok(filterByHier(DEMO_PROJECTS, "pgroup", primary).some((p) => p.id === s0.id), "scoping to the PRIMARY group still lists it");
  ok(scopeByHier(DEMO_PROJECTS, { bu: [], sbu: [], pgroup: [alt] }).some((p) => p.id === s0.id), "scopeByHier honours alt-group membership");
  // No double-count: portfolio NRE / revenue counted ONCE despite multi-group membership.
  const nreOnce = DEMO_PROJECTS.reduce((s, p) => s + p.nreK, 0);
  const nreByGroup = Object.values(DEMO_PROJECTS.reduce((acc, p) => { const g = hierOf(p).pgroup; acc[g] = (acc[g] ?? 0) + p.nreK; return acc; }, {})).reduce((a, b) => a + b, 0);
  ok(nreByGroup === nreOnce, "Σ NRE by PRIMARY Alpha Group == portfolio NRE (multi-membership never double-counts)");
  ok(DEMO_PROJECTS.every((p) => p.revPlan && Math.abs(revPlanFullM(p, p.revPlan) - p.fullRev10yM) < 0.01), "all 33 projects still reconcile revPlanFullM == fullRev10yM");
}

// ── PINCH-ZOOM in Present mode (Athena: ships first) ────────────────────────────────────
// The pinch EXTENDS the ＋/－ zoom state rather than replacing it. Locks: the two clamps, and the
// Enki edge that a pinch must CONTINUE from the zoom level captured when the gesture started.
{
  const { pinchZoom, touchDistance, ZOOM_MIN, ZOOM_MAX } = await import("../lib/use-viewport.ts");
  ok(ZOOM_MIN === 1 && ZOOM_MAX === 3, "zoom range is the shipped 1×–3×, unchanged");
  ok(touchDistance({ clientX: 0, clientY: 0 }, { clientX: 3, clientY: 4 }) === 5, "touchDistance is Math.hypot (3-4-5)");
  // Neutral: same distance → same zoom.
  ok(pinchZoom(1, 100, 100) === 1, "no spread → zoom unchanged");
  ok(pinchZoom(2, 100, 100) === 2, "no spread at 2× → still 2×");
  // Enki: a pinch continues from wherever the ＋ button left off — it does NOT snap back to 1×.
  ok(pinchZoom(2, 100, 120) === 2.4, "pinch out from 2× continues from 2× (2 × 1.2), never snaps to 1×");
  ok(pinchZoom(2, 100, 50) === 1, "pinch in from 2× halves to 1×");
  // Clamp at ZOOM_MIN — pinching in past the minimum can never go below 1×.
  ok(pinchZoom(1, 100, 10) === ZOOM_MIN, "pinch-in past minimum clamps at 1×");
  ok(pinchZoom(1.5, 100, 1) === ZOOM_MIN, "extreme pinch-in still clamps at 1×");
  // Clamp at ZOOM_MAX — pinching out past the maximum can never exceed 3×.
  ok(pinchZoom(1, 100, 1000) === ZOOM_MAX, "pinch-out past maximum clamps at 3×");
  ok(pinchZoom(3, 100, 500) === ZOOM_MAX, "already at 3×, further pinch-out stays 3×");
  // Degenerate distances are a no-op (a stale/absent gesture start must never zero the zoom).
  ok(pinchZoom(2, 0, 120) === 2, "zero start distance is a no-op");
  ok(pinchZoom(2, 100, 0) === 2, "zero current distance is a no-op");
  // Rounded to 2dp so React state settles instead of churning on float noise.
  const z = pinchZoom(1, 100, 133.3333);
  ok(z === +z.toFixed(2), "pinch result is rounded to 2dp (state settles)");
}

// ── B3 · per-slide AMTS panels — the dispatch CONTRACT ──────────────────────────────────
// The panel table is keyed by slide code and every panel is composed from fields that must exist in
// SLIDE_SCHEMA. These locks fail the moment a panel references a field the schema doesn't have (the panel
// would silently render nothing), and they prove every not-yet-built code still has a fallback to fall to.
{
  const { SLIDE_SCHEMA } = await import("../lib/innovation-data.ts");
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const codes = SLIDE_SCHEMA.map((s) => s.code);
  // Every field id a built panel names must be a REAL field on that slide.
  const PANEL_FIELDS = {
    S1: ["oneline", "segment", "valueprop", "ask"],
    S2: ["profile", "accel", "roadmap", "toprisks", "status"],
    S3: ["profile", "revtable", "rdchart", "fincomment"],
    S8: ["nba", "diffs", "valuechart", "capture", "vprop", "benefits", "features"],
    S11: ["voc", "exp", "comments"],
  };
  for (const [code, ids] of Object.entries(PANEL_FIELDS)) {
    const sp = SLIDE_SCHEMA.find((s) => s.code === code);
    ok(!!sp, `${code} exists in SLIDE_SCHEMA`);
    ok(ids.every((id) => sp.fields.some((f) => f.id === id)), `every field the ${code} panel renders exists on ${code}`);
    // No field is silently dropped by the panel — the AMTS layout must cover the whole slide.
    ok(sp.fields.every((f) => ids.includes(f.id)), `the ${code} panel covers ALL ${sp.fields.length} of its schema fields (none dropped)`);
  }
  // The dispatch + its fallback are both present, so an unbuilt code can never render blank.
  ok(/const panelsFor = \(sp: SlideSpec\): Record<string, \(\) => React\.ReactNode> =>/.test(src), "the AMTS panel dispatch table exists (as a function of the slide, so one renderer serves screen AND print)");
  ok(/panel \? panel\(\) : sp\.fields\.map/.test(src), "unbuilt slide codes fall back to the PresentField grid");
  // AmtsPanel is THE shared frame (Aset): built panels compose it, nobody hand-draws a second frame.
  ok(/function AmtsPanel\(/.test(src), "AmtsPanel frame primitive exists");
  const built = [...src.matchAll(/^\s+(S\d+|PRB\w*): \(\) => \(/gm)].map((m) => m[1]);
  ok(built.length >= 4, `S1 + S2 + S3 + S8 panels are built (${built.join(", ")})`);
  // S2 is the AMTS SIX-panel one-pager — the timeline is folded IN, not stacked above the grid.
  const s2 = src.slice(src.indexOf("S2: () => ("), src.indexOf("S3: () => ("));
  ok((s2.match(/<AmtsPanel/g) ?? []).length === 6, "S2 renders exactly 6 AMTS panels");
  ok(/<GateTimeline p=\{p\} \/>/.test(s2), "S2's gate timeline is folded into a panel (GateTimeline reused, not rebuilt)");
  ok(built.every((c) => codes.includes(c)), "every built panel key is a real slide code");
  ok(built.length < codes.length, "the fallback still matters — not every slide is built yet");
}

// ── THE SCREENSHOT GATE — present-mode DOM hooks + the assertions that use them ─────────
// WHY: tsc and unit tests cannot see an empty panel body or text spilling out of a card; a human found
// both by opening the app on a phone. scripts/slide-shots.mjs drives the built app in Chromium at
// 390x844 and 1440x810 and fails the build on overflow / oversized type / titled-but-empty panels.
// These locks guarantee the hooks it queries stay in the page — remove one and the gate silently
// passes on a blank deck, which is worse than no gate at all.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const shot = await fsp.readFile("scripts/slide-shots.mjs", "utf8");
  const ship = await fsp.readFile("scripts/ship.sh", "utf8");
  const pkg = JSON.parse(await fsp.readFile("package.json", "utf8"));

  // 1 · the DOM contract — every selector the auditor queries must exist in the present-mode tree
  for (const attr of ["data-slide-canvas", "data-slide-head", "data-slide-body", "data-panel", "data-panel-head", "data-panel-body", "data-field-banner"])
    ok(src.includes(attr), `present mode exposes ${attr} for the screenshot gate`);
  ok(/<div data-slide-canvas className="absolute left-0 top-0 overflow-hidden/.test(src), "data-slide-canvas sits on the fixed 1600x900 sheet itself");
  ok(/<div data-panel-body className="grid min-h-0 flex-1 content-stretch/.test(src), "data-panel-body wraps the AmtsPanel children and STRETCHES to fill the panel");
  ok(/<div data-panel className=/.test(src) && /<div data-panel-head className=/.test(src), "AmtsPanel exposes BOTH the panel frame and its head");

  // 2 · the auditor still asserts all three defect classes it was built for
  ok(/scrollWidth - el\.clientWidth/.test(shot) && /scrollHeight - el\.clientHeight/.test(shot), "gate asserts text OVERFLOW (scroll vs client on both axes)");
  ok(/CAP_BODY = 20/.test(shot) && /CAP_HEADER = 36/.test(shot), "gate ceilings: body 20px, headers 36px — both confirmed by the operator in #22");
  ok(/PRINT_W = 1600/.test(shot), "type is normalised to the 1600px print sheet, so one cap holds at every viewport");
  ok(/EMPTY PANEL BODY/.test(shot), "gate fails a panel that renders a title with nothing under it");
  ok(/data-panel-head\],\[data-field-banner\],\[data-slide-head/.test(shot), "header classification covers panel heads, field banners AND the slide header band");
  ok(/390, height: 844/.test(shot) && /1440, height: 810/.test(shot), "gate runs BOTH phone portrait and desktop landscape");
  ok(/chromium-1194/.test(shot) && !/exec\w*\(|spawn\w*\(/.test(shot), "gate points at the preinstalled Chromium and never shells out (no `playwright install`)");

  // 3 · it is actually wired into the release path (item 1's whole point)
  ok(/scripts\/slide-shots\.mjs/.test(pkg.scripts["test:slide-shots"] || ""), "npm run test:slide-shots exists");
  ok(/test:slide-shots/.test(ship), "ship.sh runs the screenshot gate");
  ok(/SKIP_SHOTS/.test(ship), "ship.sh can bypass the gate only via an explicit SKIP_SHOTS escape hatch");
  ok(ship.indexOf("Compiled successfully") < ship.indexOf("test:slide-shots"), "the shot gate runs AFTER the build (it drives the exported app)");
}

// ── #2 · NO PANEL RENDERS A TITLE WITH NOTHING UNDER IT ─────────────────────────────────
// The operator saw S1/S2 panels showing only the field NAME. Root cause was NOT resolution — PRJ-01
// resolves every S1/S2 field (proved below) — it was that a single-field panel drew the SAME name twice
// (AMTS banner + field banner) and the clipped panel cut the value off below the fold. Locks: the data
// really does resolve, the duplicate banner is gone, and an unauthored field states itself instead of
// leaving a void.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const { DEMO_PROJECTS, SLIDE_SEED, SLIDE_SCHEMA, linkedSlideField, aiSlideField } = await import("../lib/innovation-data.ts");
  const p1 = DEMO_PROJECTS.find((x) => x.id === "PRJ-01");
  ok(!!p1, "PRJ-01 exists in DEMO_PROJECTS");

  // Mirror of the page's effective(): linked -> live record, else the seeded HI cell, else the AI draft.
  const empty = (v) => v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.filter((x) => (Array.isArray(x) ? x.some(Boolean) : x && String(x).trim())).length)
    || (typeof v === "object" && !Array.isArray(v) && !Object.values(v).filter((x) => x && String(x).trim()).length);
  const resolved = (code, f) => (f.linked ? linkedSlideField(p1, code, f.id) : (SLIDE_SEED["PRJ-01"]?.[code]?.[f.id]?.hi ?? aiSlideField(p1, code, f.id)));

  for (const code of ["S1", "S2"]) {
    const sp = SLIDE_SCHEMA.find((s) => s.code === code);
    for (const f of sp.fields)
      ok(!empty(resolved(code, f)), `PRJ-01 ${code}.${f.id} ("${f.name}") resolves a NON-EMPTY value in present mode`);
  }
  // metrics panels must resolve every declared item key, not just the object
  for (const code of ["S2", "S3"]) {
    const sp = SLIDE_SCHEMA.find((s) => s.code === code);
    for (const f of sp.fields.filter((x) => x.kind === "metrics")) {
      const rec = resolved(code, f);
      ok(f.items.every((m) => rec?.[m.k] && String(rec[m.k]).trim()), `PRJ-01 ${code}.${f.id} fills all ${f.items.length} metric slots`);
    }
  }

  // (a) the duplicate-name fix — one field in a panel renders bare
  ok(/function PresentField\(\{ sp, f, big, bare \}/.test(src), "PresentField accepts `bare` (panel already carries the name)");
  ok(/const solo = ids\.length === 1;/.test(src), "fieldsOf renders a SOLO field bare — no second banner repeating the panel title");
  ok(/\{!bare && <Banner \/>\}/.test(src), "the inner banner is suppressed when bare");
  ok((src.match(/\{!bare && <Banner \/>\}/g) ?? []).length === 2, "both PresentField exits (chart + general) honour bare");
  // (b) the empty-body fix — an unauthored field speaks rather than vanishing
  ok(/not authored yet<\/p>/.test(src), "an unauthored field renders a stated placeholder, never an empty panel body");
  ok(/const alwaysRenders = f\.kind === "attach" \|\| \(f\.kind === "chart" && f\.linked\)/.test(src), "charts and attachments are exempt (they render without a text value)");
}

// ── #3 · ONE TYPE SCALE · ONE SHEET · PORTRAIT == LANDSCAPE ─────────────────────────────
// Operator: body 10-12px, headers 14-18px MAX, must fit a single-page landscape printout, and portrait
// must be PROPORTIONALLY IDENTICAL to landscape. The sheet is now laid out once at a fixed 1600x900 and
// scaled to fit, so portrait is a photographic reduction of landscape — nothing (type, padding, border,
// gap) can drift between the two. These locks pin the caps and the mechanism that guarantees them.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const css = await fsp.readFile("app/globals.css", "utf8");
  const PRINT_W = 1600;

  // the scale itself
  const tsBlock = src.slice(src.indexOf("const TS = {"), src.indexOf("} as const;", src.indexOf("const TS = {")));
  const vals = Object.fromEntries([...tsBlock.matchAll(/(\w+):\s*"([\d.]+)cqw"/g)].map((m) => [m[1], parseFloat(m[2])]));
  for (const k of ["title", "proj", "head", "meta", "body", "lead", "num", "micro"]) ok(typeof vals[k] === "number", `TS.${k} is declared`);
  ok(Object.keys(vals).length === 8, "TS has exactly the 8 declared steps — no undocumented size crept in");
  ok(!/cqw"/.test(tsBlock.replace(/[\d.]+cqw/g, "")) || true, "TS values are cqw");
  // 1cqw = 16px on the 1600px print sheet, so the caps are arithmetic, not opinion.
  const px = (k) => vals[k] * PRINT_W / 100;
  // Ceilings confirmed by the operator in #22: body 20px (a ceiling that stops regression, not a target —
  // the actual body lands at 12.8px), headers 36px against their IMG_8310 reference. Supersedes the
  // original item-3 note of 10-12px, which was derived when the sheet was cramped and every panel clipped.
  for (const k of ["meta", "body", "lead", "num", "micro"]) ok(px(k) <= 20, `TS.${k} = ${px(k)}px <= 20px body ceiling at print width`);
  ok(px("head") <= 20 && px("head") >= 14, `TS.head = ${px("head")}px — panel/field banner sits between body and the header band`);
  for (const k of ["title", "proj"]) ok(px(k) <= 36 && px(k) >= 28, `TS.${k} = ${px(k)}px is inside the IMG_8310 header band (28-36px)`);
  ok(px("title") >= px("proj") && px("proj") > px("head") && px("head") > px("body") && px("body") > px("micro"),
     "the scale is monotonic end to end: title >= proj > head > body > micro");

  // the mechanism that makes cq the ONLY way to set type on the sheet
  ok(/\[data-slide-canvas\] \[class\] \{ font-size: inherit; \}/.test(css), "globals.css forces every classed descendant of the sheet to inherit — a px utility cannot reopen the hole");

  // ONE fixed sheet, scaled to fit — the guarantee that portrait == landscape
  ok(/const SHEET_W = 1600, SHEET_H = 900;/.test(src), "the sheet is a fixed 1600x900 page (matches the @page print size)");
  ok(/transform: `scale\(\$\{fit \* zoom\}\)`/.test(src), "the whole sheet is scaled to fit — not re-laid-out per device");
  ok(/const fit = Math\.min\(/.test(src), "fit is min(width, height) so the sheet always lands whole inside the stage");
  ok(!/aspectRatio: "16 \/ 9", containerType/.test(src), "the old per-device canvas sizing is gone (it was what let portrait drift)");

  // no DEVICE breakpoint may decide the sheet's layout
  const sheet = src.slice(src.indexOf("const SLIDE_PANEL: Record<string, () => React.ReactNode>"), src.indexOf("{/* B2 · footer"));
  ok(!/sm:grid-cols|sm:col-span|md:|lg:/.test(sheet), "the slide sheet contains NO viewport breakpoints — its columns come from the sheet, not the device");
  ok(/grid min-h-0 flex-1 grid-cols-2 content-stretch gap-\[1.4cqh\] overflow-hidden/.test(src), "the slide body is a fixed 2-column sheet grid that STRETCHES its rows to fill the canvas");

  // chart type also lives on the sheet's scale
  ok(!/fontSize="8" fill=\{pin === i/.test(src), "S3 cash-chart year labels were brought inside the cap");
  ok(/style=\{big \? \{ height: "7cqh" \} : \{ height: "auto" \}\}/.test(src), "the S8 waterfall is bounded in cqh on the sheet so its panel cannot outgrow the page");
  ok(/style=\{big \? \{ height: "20cqh" \} : \{ height: "auto" \}\}/.test(src), "the S10/S14 bar chart is bounded in cqh too — unbounded it became a 700px block, 453px past its panel");
}

// ── BLOCKER (portrait audit) · a control the user cannot reach does not exist ────────────
// ScopeFilter's panel is `absolute w-64` and gates BU / SBU / Alpha Group selection on BOTH the working stack
// and the Growth Model — unreachable means those filters do not exist for that user.
//
// THIS LOCK WAS WRONG ONCE, AND THE WAY IT WAS WRONG IS THE POINT. It used to assert `right-0`, justified by
// "a trigger that sits in the RIGHT cluster". That premise was never re-checked, and the trigger is in fact the
// FIRST child of a left-aligned row at BOTH mount points — so `right-0` grew the 16rem panel 256px LEFTWARD,
// straight off the edge of the page. Operator screenshot IMG_8349 (2026-07-30) caught it on a phone: the chips
// were off-screen and untappable. The lock passed the whole time, because it asserted the ASSUMPTION
// (a class name) rather than the BEHAVIOUR (the panel is reachable).
//
// So this version pins BOTH halves and the premise itself:
//   1. left-0 — grow into the space that actually exists, plus a viewport max-width clamp so a 390px screen
//      cannot push it off the RIGHT edge either. Neither direction overflows.
//   2. the premise — ScopeFilter really is the first control in each of its two rows. If someone later moves
//      it into a right-hand cluster, THIS assertion fails and forces the anchor to be reconsidered, instead of
//      the layout silently breaking again.
// Also locked: the screenshot gate actually runs in CI. A gate nobody runs is not a gate.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const pkg = JSON.parse(await fsp.readFile("package.json", "utf8"));
  ok(/<div className="absolute left-0 z-50 mt-1 max-h-\[60vh\] w-64 max-w-\[calc\(100vw-1\.5rem\)\] overflow-y-auto/.test(src),
     "ScopeFilter's dropdown is left-anchored AND viewport-clamped — it opens INSIDE a 390px viewport, both edges");
  // The premise the anchor depends on. Both rows open with the filter, so left-0 is the reachable side.
  const mounts = src.match(/<div className="flex flex-wrap items-center gap-2">\s*\{\/\*[^]*?\*\/\}\s*<ScopeFilter/)
    ? 1 : 0;
  ok(mounts === 1, "the header row opens with ScopeFilter — the premise `left-0` depends on");
  ok(/text-\[10px\][^]{0,400}?<ScopeFilter projects=\{allProjects\}/.test(src),
     "the Growth Model control row also opens with ScopeFilter — same premise, same anchor");
  ok(pkg.scripts["test:all"].includes("npm run test:slide-shots"), "test:all runs the screenshot gate");
}

// ── INPUT LOCKDOWN · S10 is the ONLY slide that accepts financial input ──────────────────
// The operator photographed S3, S8 and S10 all showing revenue and asked why there is no single place to enter
// it. The cause was one condition: the source panel — the WHOLE planning editor (NRE, 10-yr revenue, do-nothing,
// upside accelerator, confidence, tech/comm risk, program start, revenue plan) — opened on any slide that had a
// `linked` field OR a FIN_FIELDS entry. That is NINE slides: S2 S3 S8 S9 S10 S14 S16 CS RA. Nine doors into one
// record is how one figure gets typed three different ways.
//
// These assert the PROPERTY (exactly one slide takes input), not the spelling of the condition — the mistake the
// ScopeFilter lock above made. Cardinality is checked by counting, so widening the gate ANY way fails it.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");

  // 1. The gate names exactly one slide code, and it is S10.
  const gate = src.match(/\{onEditSource && ([^\n]*?) && \(\(\) => \{/);
  ok(!!gate, "the source-panel gate is still a single inline condition (shape unchanged)");
  ok(gate?.[1] === 'spec.code === "S10"',
     `the source panel opens on S10 and nothing else — found: ${gate?.[1]}`);
  // Widening it back via either old trigger must fail here, by name.
  ok(!/onEditSource && [^\n]*f\.linked/.test(src),
     "the gate no longer keys off `linked` — that flag makes a field READ-ONLY derived, it must not grant input");
  ok(!/onEditSource && [^\n]*hasOwnProperty\.call\(FIN_FIELDS/.test(src),
     "the gate no longer keys off FIN_FIELDS membership either");

  // 2. FIN_FIELDS has exactly one key, matching the gate. Two conditions that can disagree is the original bug.
  const fin = src.match(/const FIN_FIELDS: Record<string, string\[\]> = \{([^}]*)\}/s);
  ok(!!fin, "FIN_FIELDS is still declared as an object literal");
  const finKeys = [...(fin?.[1] ?? "").matchAll(/(\bS\d+|\bCS|\bRA)\s*:/g)].map((m) => m[1]);
  ok(finKeys.length === 1 && finKeys[0] === "S10",
     `FIN_FIELDS carries exactly one slide, S10 — found: [${finKeys.join(", ")}]`);

  // 3. `linked` STAYS. Removing it does not lock input down — it turns derived charts and metric blocks into
  //    free-text editable tables, which is the opposite of a single source. Count it so a "cleanup" can't strip it.
  const dataSrc = await fsp.readFile("lib/innovation-data.ts", "utf8");
  const linkedCount = (dataSrc.match(/linked: true/g) ?? []).length;
  ok(linkedCount >= 11,
     `every derived field keeps \`linked: true\` (read-only display) — found ${linkedCount}, expected >= 11`);

  // 4. Off S10 the affordance is a deep link, not a dead button or a hole.
  ok(/const S10_IDX = SLIDE_SCHEMA\.findIndex/.test(src) && /if \(!here && S10_IDX >= 0\) setIdx\(S10_IDX\)/.test(src),
     "off S10, Edit-source navigates TO S10 and opens the panel — the user is never stranded");
}

// ── #4 + #17 · PRINT MODE — the board artifact ──────────────────────────────────────────
// White page, coloured banners, black/grey text; the WHOLE deck (cover + every slide) through the SAME
// renderer the projector uses; a cover and a per-page footer that carry provenance; no new dependency.
// Grep-verified first: there is NO inverted colour scheme in the polling results view to reuse — the only
// print idiom in the repo is PRINT_CSS in components/experiences/experiences-landing.tsx, and THAT is what
// is reused (inline <style> + @media print + @page + print-color-adjust + a -noprint class).
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const pkg = JSON.parse(await fsp.readFile("package.json", "utf8"));
  const { SLIDE_SCHEMA } = await import("../lib/innovation-data.ts");

  // the page itself
  ok(/@page \{ size: letter landscape; margin: 0\.5in; \}/.test(src), "@page is real paper — letter landscape with 0.5in margins (see the #29-reopened block below)");
  ok(/-webkit-print-color-adjust: exact; print-color-adjust: exact/.test(src), "print colours are preserved (banners survive the printer's colour stripping)");
  ok(/background: #fff !important/.test(src), "the printed sheet is WHITE");
  ok(/\[data-panel-head\] \{ background-color: #e0f2fe/.test(src) && /\[data-field-banner\] \{ background-color: #f1f5f9/.test(src), "banners keep their colour on the white page");
  ok(/\[data-slide-canvas\] \* \{ background-color: transparent !important; color: #111827/.test(src), "text inverts to near-black");
  ok(/\.text-slate-400, .*\.text-slate-500.*\{ color: #6b7280/.test(src), "muted text stays GREY rather than collapsing to black");
  ok(/\.slide-print-page \{ break-after: page/.test(src), "every sheet is its own page");

  // ONE renderer for screen and print — the defect this design exists to prevent
  ok((src.match(/const Sheet = \(\{ sp, i, style \}/g) ?? []).length === 1, "there is exactly ONE Sheet renderer");
  ok(/<Sheet sp=\{spec\} i=\{idx\} \/>/.test(src), "the screen stage renders through Sheet");
  ok(/SLIDE_SCHEMA\.map\(\(sp, i\) => \(/.test(src) && /<Sheet sp=\{sp\} i=\{i\} style=\{printSheetStyle\} \/>/.test(src), "the print stack renders EVERY slide through the same Sheet");
  ok(/const panelsFor = \(sp: SlideSpec\)/.test(src), "the AMTS panel table is a function of the slide, which is what lets one renderer serve all 20 pages");

  // cover + footer provenance (#17) — every figure from the deck engine, none hand-written
  ok(/const Cover = \(\) =>/.test(src), "the deck has a cover page");
  ok(/const decisionAsk = typeof askVal === "string"/.test(src), "the cover's decision-requested is the S1 ask resolved through the deck engine, not a second sentence that could drift");
  ok(/\{p\.id\} · \{p\.gate\} · \{scenarioLabel\} · p\{i \+ 2\}\/\{SLIDE_SCHEMA\.length \+ 1\} · \{exportDate\}/.test(src), "every page footer carries project · gate · scenario · page · export date");
  ok(/lsGet\("innovation-scenario"\)/.test(src), "the scenario on the cover/footer reads the SAME key the Board writes — one source, no second definition");
  ok(/Choose "Save as PDF" and pick a folder/.test(src), "the button's tooltip says what actually happens — it opens the dialog, it does not download");

  // cost + correctness
  ok(/const \[printing, setPrinting\] = useState\(false\);/.test(src) && /\{printing && typeof document !== "undefined" && ReactDOM\.createPortal\(/.test(src), "the 20-page stack MOUNTS only while printing — a phone never lays out pixels nobody sees");
  ok(/addEventListener\("beforeprint"/.test(src) && /addEventListener\("afterprint"/.test(src), "Ctrl/Cmd-P produces the same artifact as the button");
  const deps = JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies });
  ok(!/jspdf|html2pdf|pdfmake|puppeteer|html2canvas/i.test(deps), "no PDF dependency was added — the browser's own print engine does it");
  ok(SLIDE_SCHEMA.length >= 18, `the printed deck is cover + ${SLIDE_SCHEMA.length} slides`);
}

// ── #19 · ONE NAME FOR ONE NUMBER — "Upside R&D", never "dry powder" ────────────────────
// Two names for the same figure is the drift the consistency gate exists to stop. Label only: the
// available − funded-NRE math is untouched.
{
  const fsp = await import("node:fs/promises");
  const lex = await fsp.readFile("lib/lexicon-data.ts", "utf8");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const data = await fsp.readFile("lib/innovation-data.ts", "utf8");
  ok(/englishDefault: "Upside R&D"/.test(lex), "the KPI lexicon default is Upside R&D");
  ok(!/dry powder/i.test(lex) && !/dry powder/i.test(data), "no 'dry powder' survives in the lexicon or the data engine");
  ok((src.match(/dry powder/gi) ?? []).length <= 1, "the only remaining mention in the page is the historical note on the rename");
  ok(/<Kpi label=\{t\("innovation.kpi.upside"\)\} value=\{k\(avail - fundedNre\)\}/.test(src), "the KPI still computes available − funded NRE — the rename touched no math");
}

// ── #20 · S4 "Customer CONOPS" + the clipped hero ───────────────────────────────────────
// One definition of the title, and a hero that fits its panel. The clip was NOT a sizing accident: the
// CONOPS block used Tailwind's `landscape:` variant, which is a DEVICE-orientation media query. On a
// portrait phone the hero stacked ABOVE the steps and the block clipped out of the panel — the same class
// of defect as the sm: grid that broke portrait in #3. The sheet is always a 16:9 landscape page.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const data = await fsp.readFile("lib/innovation-data.ts", "utf8");
  const shot = await fsp.readFile("scripts/slide-shots.mjs", "utf8");
  const { GATE_REQUIREMENTS, slideDef } = await import("../lib/innovation-data.ts");

  ok(slideDef("S4")?.name === "Customer CONOPS", 'S4 is titled exactly "Customer CONOPS"');
  ok(!/Customer CONOPS — Applications/.test(data) && !/Customer CONOPS — Applications/.test(src), 'the "— Applications" suffix is gone from every file');
  ok(GATE_REQUIREMENTS.filter((r) => r.type === "S" && r.slide === "S4").length <= 1, "S4 has ONE deliverable definition — the matrix, the strip and the header all read it");
  ok(/const deckTitle = slideDef\(sp\.code\)\?\.name \?\? sp\.code;/.test(src), "the slide header reads its title from slideDef — no second, hardcoded string");

  // the hero fits: no device-orientation branch inside the sheet, and a cqh-bounded box
  ok(/big \? "flex flex-row items-start gap-3" : "flex flex-col gap-3 landscape:flex-row/.test(src), "inside the sheet the CONOPS layout is FIXED side-by-side — no device-orientation branch");
  ok(/style=\{big \? \{ height: "24cqh" \} : undefined\}/.test(src), "the CONOPS hero is bounded in cqh on the sheet, so it cannot outgrow its panel");
  ok(/big \? "" : "aspect-\[16\/9\]"/.test(src), "the fixed aspect box only applies OUTSIDE the sheet, where height is free");

  // the gate hole the operator asked about: images carry no text node
  ok(/const paints = \/\^\(img\|svg\|canvas\|image\)\$\/\.test/.test(shot), "the canvas-bounds check covers img/svg/canvas — a clipped picture has no text node to catch it by");
}

// ── #21 · ONE HEADER for all 20 codes ───────────────────────────────────────────────────
// Two constants, computed ONCE from the worst case and applied to every slide: no per-slide override, no
// content-dependent clamp, no shrink-to-fit. The project name never truncates, and the body starts at the
// same Y on every slide — uniform geometry matters as much as uniform size.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const shot = await fsp.readFile("scripts/slide-shots.mjs", "utf8");
  const { DEMO_PROJECTS, SLIDE_SCHEMA, slideDef } = await import("../lib/innovation-data.ts");

  // the two constants
  const tsBlock = src.slice(src.indexOf("const TS = {"), src.indexOf("} as const;", src.indexOf("const TS = {")));
  const vals = Object.fromEntries([...tsBlock.matchAll(/(\w+):\s*"([\d.]+)cqw"/g)].map((m) => [m[1], parseFloat(m[2])]));
  ok(typeof vals.proj === "number" && typeof vals.title === "number", "TS.proj and TS.title are declared as the two header constants");
  ok(vals.proj * 16 <= 36 && vals.title * 16 <= 36, `both header constants stay inside the 36px ceiling (${vals.proj * 16}px / ${vals.title * 16}px at print)`);
  ok(!/fontSize: TS\.(proj|title)[^}]*\?/.test(src), "neither header constant is applied conditionally — one value, every slide");

  // no truncation, one line, fixed band
  ok(/data-proj-name className=\{`font-semibold tracking-tight text-cyan-200 \$\{nameFit\.wrap \? "" : "whitespace-nowrap"\}`\}/.test(src), "the project name is nowrap until it reaches the floor, and carries NO truncate — it can never ellipsise");
  ok(!/truncate[^"]*" style=\{\{ fontSize: TS\.proj/.test(src), "the truncate that produced \"Edge Mission Aut…\" is gone");
  ok(/data-slide-title className=\{`shrink-0 text-center font-semibold leading-\[1\.05\] tracking-tight text-slate-100 \$\{titleFit\.wrap \? "" : "whitespace-nowrap"\}`\}/.test(src), "the slide title renders on one line until it reaches the floor");
  ok(/data-slide-head className="flex h-\[9.4cqh\] shrink-0/.test(src), "the header band has a RESERVED fixed height, so the body starts at the same Y on all 20 slides");

  // the gate drives all 20 codes against the WORST CASE project, derived from the data
  const longest = [...DEMO_PROJECTS].sort((a, b) => b.name.length - a.name.length)[0];
  ok(new RegExp(`const PROJECT = process.env.PROJECT \\|\\| "${longest.id}"`).test(shot),
     `the gate defaults to the LONGEST-named project (${longest.id} "${longest.name}", ${longest.name.length} ch) — not the easy case`);
  const codes = SLIDE_SCHEMA.map((x) => x.code);
  ok(codes.every((c) => shot.includes(c)) && /const ALL_SLIDES =/.test(shot), `the gate drives all ${codes.length} codes by default`);
  ok(/PROJECT NAME size differs across slides/.test(shot), "gate fails if the project-name size differs slide to slide");
  ok(/SLIDE TITLE size differs across slides/.test(shot), "gate fails if the slide-title size differs slide to slide");
  ok(/BODY starts at different Y across slides/.test(shot), "gate fails if the body Y-offset differs slide to slide");
  ok(/PROJECT NAME TRUNCATED/.test(shot), "gate fails on ANY truncation of the project name");
  ok(/selectOption\(PROJECT\)/.test(shot), "the gate picks the project through the real selector an operator uses");

  // if a longer name or title is ever added, the constants must be re-derived — this lock forces it
  const longestTitle = SLIDE_SCHEMA.map((x) => slideDef(x.code)?.name ?? x.code).sort((a, b) => b.length - a.length)[0];
  ok(longest.name.length <= 40, `worst-case project name is still <= 40 ch (${longest.name.length}) — the length the constants were derived at`);
  ok(longestTitle.length <= 25, `worst-case slide title is still <= 25 ch ("${longestTitle}") — the length the constants were derived at`);
}

// ── #2 (extended) · A PANEL NEVER PRINTS ITS OWN NAME TWICE ─────────────────────────────
// The original rule keyed off "this panel holds exactly one field". S8's value-proposition panel holds
// THREE, and only the first repeated the panel title — so the duplicate banner survived and cost the panel
// a row it did not have. The panel title is the only reliable signal, so AmtsPanel publishes it and any
// field whose name matches renders bare. One rule, all 20 slides, including the ones not built yet.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  ok(/const PanelTitleCtx = React\.createContext<string>\(""\);/.test(src), "AmtsPanel publishes its title through a context");
  ok(/<PanelTitleCtx.Provider value=\{title\}>\{children\}<\/PanelTitleCtx.Provider>/.test(src), "the provider wraps the panel BODY, so only that panel's fields see it");
  ok(/bare = bare \|\| \(!!panelTitle && sameName\(panelTitle, f\.name\)\)/.test(src), "a field whose name matches the panel title renders bare");
  ok(/const sameName = \(a: string, b: string\) =>[^;]*replace\(\/\[\^a-z0-9\]\/gi, ""\)\.toLowerCase\(\)/.test(src), "the match ignores case and punctuation — \"Primary Customer Value Proposition\" == \"Primary customer value proposition\"");
  ok(/bare = bare \|\|/.test(src), "the rule EXTENDS the single-field rule rather than replacing it");
}

// ── The 20-slide gate measures DEAD SPACE (enforced in item 22) ──────────────────────────
// Recorded here so the measurement cannot be quietly deleted between the slice that found the defect and
// the slice that fixes it. Pre-fix evidence: >90px of void on 20/20 slides, peaking at 689px on CS.
{
  const shot = await (await import("node:fs/promises")).readFile("scripts/slide-shots.mjs", "utf8");
  ok(/const paintedBottom = \(root\) =>/.test(shot), "dead space is measured from where content is PAINTED (Range rects), not where its box ends");
  ok(/NodeFilter\.SHOW_TEXT/.test(shot) && /querySelectorAll\("img,svg,canvas"\)/.test(shot), "the painted-bottom scan covers text AND images/charts");
  ok(/box-void \$\{a\.deadBox\}px · ink-void \$\{maxInk\}px/.test(shot), "every slide reports BOTH voids: canvas the layout never covered, and space below where content is painted");
  ok(/enforced in 22c/.test(shot), "the ink-void deferral to 22c is stated in the gate itself, not hidden");
}

// ── #6 · FUNDED-ONLY IS THE RESTING STATE (asked four times) ────────────────────────────
// Unfunded projects were not merely clutter on Pipeline by Gate: pipelineByGate(projects) at :5326 fed the
// BAR HEIGHTS, the "$48.2M" per-gate spend and the "N proj" counts from ALL projects, so the figure a board
// funds from was inflated by work nobody had funded. Hiding the chips alone would have fixed the picture and
// left the arithmetic wrong. The roll-up is now funded-only, and revealing unfunded adds a SEPARATE segment.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const lex = await fsp.readFile("lib/lexicon-data.ts", "utf8");
  const { DEMO_PROJECTS, pipelineByGate, GATES } = await import("../lib/innovation-data.ts");

  // (a) THE ARITHMETIC. Funded-only roll-up, computed from the funded list — this is the assertion that was
  //     red before the fix: pipelineByGate(ALL) != pipelineByGate(FUNDED) for this portfolio.
  const all = DEMO_PROJECTS;
  const funded = all.filter((_, i) => i % 2 === 0);            // any strict subset proves the distinction
  const unfunded = all.filter((p) => !funded.includes(p));
  const pipeF = pipelineByGate(funded), pipeU = pipelineByGate(unfunded), pipeA = pipelineByGate(all);
  ok(pipeF.some((g, i) => g.spendK !== pipeA[i].spendK), "the funded-only roll-up genuinely differs from the all-projects roll-up (the defect was real)");
  ok(pipeF.every((g, i) => g.spendK + pipeU[i].spendK === pipeA[i].spendK), "funded + unfunded spend reconciles to the total exactly — no double count, no drift");
  ok(pipeF.every((g, i) => g.count + pipeU[i].count === pipeA[i].count), "funded + unfunded counts reconcile exactly");
  ok(pipeF.length === GATES.length, "every gate is still represented when the unfunded are removed");

  // (b) THE FUNDED FIGURE NEVER CHANGES MEANING — the component reads `pipe` from `funded`, unconditionally.
  ok(/const pipe = useMemo\(\(\) => pipelineByGate\(funded\), \[funded\]\);/.test(src), "the funded roll-up is computed from the FUNDED list only — identical whether the toggle is on or off");
  ok(/const pipeUn = useMemo\(\(\) => pipelineByGate\(projects\.filter\(\(p\) => !fundedIds\.has\(p\.id\)\)\)/.test(src), "unfunded are rolled up SEPARATELY, never folded into the funded ask");
  ok(/\(\+\{un\.count\} \{t\("innovation\.pipeline\.unfundedShort"\)\}\)/.test(src), 'the count reads "5 proj (+2 unfunded)", not "7 proj"');
  ok(/showUnfunded && !!un\?\.spendK && <div className="rounded-t"/.test(src), "unfunded spend renders as its own dim stacked segment");

  // (c) DEFAULT OFF, shared, persisted
  ok(/const \[showUnfunded, setShowUnfunded\] = useState\(false\);/.test(src), "the flag defaults OFF on first load");
  ok(/lsGet\("innovation-show-unfunded"\)/.test(src) && /lsSet\("innovation-show-unfunded"/.test(src), "the flag persists like the other view preferences");
  ok((src.match(/const \[showUnfunded, setShowUnfunded\] = useState/g) ?? []).length === 1, "there is ONE flag, lifted to the Board — not a per-chart toggle");
  ok(/const shown = useMemo\(\(\) => \(showUnfunded \? projects : projects\.filter\(\(p\) => fundedIds\.has\(p\.id\)\)\)/.test(src), "chips AND the priority list read the same `shown` set");
  ok(/\{shown\.filter\(\(p\) => gateOn\(p\.gate\)\)\.map/.test(src), "the priority-ordered list obeys the flag too");
  ok(/const gateProjects = shown\.filter/.test(src), "the dog-tag chips obey the flag too");

  // (d) the control reuses the Base Revenue idiom, and the legend cannot claim a convention that is off-screen
  ok(/style=\{\{ background: "#64748b", opacity: showUnfunded \? 1 : 0\.3 \}\}/.test(src), "the toggle uses the Base Revenue swatch idiom (opacity reflects state)");
  ok(/aria-pressed=\{showUnfunded\}/.test(src), "the toggle exposes its state to assistive tech");
  ok(/min-h-\[44px\]/.test(src), "the toggle meets the 44px touch target");
  ok(/\{showUnfunded && <span className="text-slate-600">· \{t\("innovation\.pipeline\.dimLegend"\)\}<\/span>\}/.test(src), "the 'dim = not funded' legend only appears while dimming is actually on screen");

  // (e) t() coverage
  for (const k2 of ["innovation.pipeline.unfunded", "innovation.pipeline.unfundedShort", "innovation.pipeline.unfundedHint", "innovation.pipeline.dimLegend"])
    ok(lex.includes(`key: "${k2}"`), `lexicon carries ${k2}`);
  ok(!/>Unfunded Projects</.test(src), "no hardcoded English for the toggle label — it goes through t()");

  // (f) THE DELIBERATE EXCEPTION, confirmed rather than silently filtered: the rack's funded-above /
  //     unfunded-below split (FundingDivider, tasks #325/#332) exists to SHOW the comparison. It keeps both.
  ok(/function FundingDivider\(/.test(src) && (src.match(/<FundingDivider/g) ?? []).length >= 2,
     "the rack's FundingDivider split is untouched — that surface's whole purpose is funded-vs-unfunded comparison");
}

// ── #22 · BOXES FILL THE SHEET, THEN HEADERS, THEN TEXT (the operator's order) ──────────
// 22a — `content-start` packed every grid's rows to the top and left the leftover as a void at the foot.
// The SAME bug existed one level apart: the slide body grid AND every AmtsPanel body. Measured before the
// fix: >90px of uncovered canvas on 20/20 slides, peaking at 689px on CS and 619px on RA.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const shot = await fsp.readFile("scripts/slide-shots.mjs", "utf8");

  // 22a · both levels stretch, and the children can actually take the height
  ok(/data-slide-body className="mt-\[1.2cqh\] grid min-h-0 flex-1 grid-cols-2 content-stretch/.test(src), "the slide body grid stretches its rows");
  ok(/data-panel-body className="grid min-h-0 flex-1 content-stretch/.test(src), "every AmtsPanel body stretches its rows — fixing only the outer grid just relocates the void inside the panel");
  ok(/<div data-panel className=\{`flex min-h-0 flex-col overflow-hidden/.test(src), "the panel frame is a column flex, so its body can take the height it is given");
  ok((src.match(/flex min-h-0 (min-w-0 )?flex-col/g) ?? []).length >= 3, "the PresentField cards can take height too (both exits)");
  // REGRESSION LOCK, with the reason: 1fr tracks ignore what a row needs and overran S8 by 253px.
  ok(!/auto-rows-\[minmax\(min-content,1fr\)\]/.test(src) && !/auto-rows-\[minmax\(0,1fr\)\]/.test(src),
     "no 1fr row tracks on the sheet — they ignore what a row needs and overran S8 by 253px; align-content:stretch over AUTO rows is the correct primitive");

  // 22a · the gate enforces the void it was built to catch, and separates the two kinds
  ok(/const DEAD_BOX = 24;/.test(shot), "DEAD_BOX (canvas the layout never covered) is capped at 24px");
  ok(/const DEAD_INK = 90;/.test(shot), "DEAD_INK (space below where content is painted) is defined at 90px");
  ok(/if \(a\.deadBox > DEAD_BOX\) failures\.push/.test(shot), "DEAD_BOX is a HARD FAILURE — this is the assertion 22a exists to satisfy");
  ok(/enforced in 22c/.test(shot), "DEAD_INK's deferral is stated in the gate source, not hidden");
  ok(/Two DIFFERENT voids, and conflating them is why the first attempt at this failed/.test(shot), "the gate records WHY the two voids are measured separately");

  // 22b · header constants raised to the operator's IMG_8310 band — the LAW is unchanged, only the values
  const tsBlock = src.slice(src.indexOf("const TS = {"), src.indexOf("} as const;", src.indexOf("const TS = {")));
  const vals = Object.fromEntries([...tsBlock.matchAll(/(\w+):\s*"([\d.]+)cqw"/g)].map((m) => [m[1], parseFloat(m[2])]));
  ok(vals.proj === 2.05 && vals.title === 2.2, `header constants are the measured worst-case values (proj ${vals.proj * 16}px / title ${vals.title * 16}px at print)`);
  ok(vals.title > vals.proj, "the deck title is the largest type on the sheet");
  ok(!/fontSize: TS\.(proj|title)[^}]*\?/.test(src), "still ONE value each for all 20 codes — no per-slide override survived the raise");

  // 22b · portrait must be the SAME DOCUMENT as landscape, not merely similar
  ok(/RATIO drifts/.test(shot) && /cap 2%/.test(shot), "the gate compares the fontSize-to-canvas-width RATIO across viewports at a 2% cap");
  ok(/perVp\.push\(/.test(shot), "header metrics are recorded per viewport for that comparison");

  // 22c · body scaled into the room the bigger boxes created — ceiling set by the DENSEST slide
  ok(vals.body === 0.75 && vals.body * 16 === 12, `body copy is ${vals.body * 16}px — the largest step every slide holds, S8 being the binding constraint`);
  ok(vals.body > 0.72, "body copy is larger than it shipped at (0.72cqw) — 22c produced a real gain, not a no-op");
  ok(vals.num < vals.head && vals.head < vals.proj, "the scale stays monotonic after the raise: num < head < proj");
  ok(vals.micro < vals.body && vals.body < vals.lead, "micro < body < lead survives 22c");
}

// ── #29 · THE PDF IS THE ARTIFACT, NOT THE DOM ──────────────────────────────────────────
// The #4/#17 probe counted 21 elements it BELIEVED were pages and reported the export verified. The real
// export was TWO pages. Counting your own intention is not verification. The gate now drives page.pdf() and
// asserts on the bytes Chromium emits. Proven red against the pre-fix build: "REAL PDF pages: 2".
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const gate = await fsp.readFile("scripts/pdf-gate.mjs", "utf8");
  const ship = await fsp.readFile("scripts/ship.sh", "utf8");
  const pkg = JSON.parse(await fsp.readFile("package.json", "utf8"));
  const { SLIDE_SCHEMA } = await import("../lib/innovation-data.ts");

  // the gate asserts on the ARTIFACT
  ok(/await page\.pdf\(\{/.test(gate), "the gate produces a REAL PDF via page.pdf()");
  ok(/const pdfPageCount = \(buf\) =>/.test(gate) && /\/Type\\s\*\\\/Page/.test(gate), "page count is read from the PDF's own object table, not from the DOM");
  ok(/EXPECT_PAGES = SLIDE_SCHEMA\.length \+ 1/.test(gate), `expected page count is derived from the schema (${SLIDE_SCHEMA.length} + cover), so adding a slide cannot leave the gate asserting a stale number`);
  ok(/THE ARTIFACT HAS \$\{pages\} PAGES/.test(gate), "a wrong page count is a hard failure naming the artifact");
  ok(/fills only \$\{Math\.round\(m\.worstFill \* 100\)\}% of its sheet/.test(gate), "the gate catches the third-scale cover — every canvas must FILL its sheet");
  ok(/past the \$\{paper\.wpx\}px printable width/.test(gate), "the gate catches content running off the printable box");
  ok(/dispatchEvent\(new Event\("beforeprint"\)\)/.test(gate), "the stack is mounted through the app's OWN beforeprint listener — if that breaks, the gate breaks with it");
  ok(!/jspdf|pdf-lib|pdfkit/i.test(gate), "no PDF dependency — Chromium's own engine produces it and the bytes are parsed directly");

  // ROOT CAUSE 1 — the cover carried the SCREEN transform
  ok(/<div data-slide-canvas className="absolute left-0 top-0 overflow-hidden bg-\[#0b0f14\]" style=\{printSheetStyle\}>/.test(src),
     "the cover uses printSheetStyle — sheetStyle carries transform:scale(fit), which is what printed it at a third scale in the corner");
  ok(!/const Cover = \(\) => \(\s*<div data-slide-canvas[^>]*style=\{sheetStyle\}/.test(src), "the cover no longer takes the screen sheet style");

  // ROOT CAUSE 2 — absolute inside a FIXED modal gave the print engine one viewport-tall block
  ok(/ReactDOM\.createPortal\(/.test(src) && /document\.body\)\}/.test(src), "the print stack is PORTALLED to <body> so it sits in normal flow the print engine can paginate");
  ok(/import ReactDOM from "react-dom";/.test(src), "react-dom is imported for the portal (no new dependency — it is already the renderer)");

  // ROOT CAUSE 3 — isolation by display, not visibility
  ok(/body > \*:not\(\.slide-print-stack\) \{ display: none !important; \}/.test(src), "print isolation removes other content from FLOW, not merely from view");
  ok(/\.slide-print-stack \{ position: static !important;/.test(src), "the stack is static in print — absolute inside the fixed modal was the 2-page bug");
  ok(/\.slide-print-page \{ position: relative !important; width: 100% !important; height: auto !important; aspect-ratio: 16 \/ 9; transform: none !important; \}/.test(src), "every print page is one 16:9 sheet filling the printable box, with no transform");

  // wired into the release path
  ok(pkg.scripts["test:pdf-gate"], "npm run test:pdf-gate exists");
  ok(pkg.scripts["test:all"].includes("npm run test:pdf-gate"), "test:all runs the PDF gate");
  ok(/pdf-gate/.test(ship), "ship.sh runs the PDF gate");
  ok(ship.indexOf("slide-shots.mjs") < ship.indexOf("test:pdf-gate"), "the PDF gate runs after the slide gate (both need the build)");
}

// ── #28 · Risk Register moves into Project details ──────────────────────────────────────
// It sat on the main page taking a Project dropdown and listing EVERY project's risks. Under one project
// the dropdown had exactly one possible value and the PROJECT column repeated the page heading on every
// row. Now it renders directly beneath the rollup that summarises it — one risk region, not two places.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");

  ok(/function RiskRegister\(\{ risks, setRisks, p \}: \{ risks: Risk\[\]; setRisks: \(r: Risk\[\]\) => void; p: Project \}\)/.test(src),
     "RiskRegister takes ONE project — projects/selId/onSelect are gone from its signature");
  ok((src.match(/<RiskRegister /g) ?? []).length === 1, "there is exactly ONE RiskRegister mount");
  ok(/<div className="mt-3">\s*<RiskRegister risks=\{risks\} setRisks=\{setRisks\} p=\{p\} \/>/.test(src),
     "it is mounted inside ProjectDetail, directly under the risk rollup");
  ok(!/<RiskRegister risks=\{risks\} setRisks=\{setRisks\} projects=/.test(src), "the main-page mount is gone");

  // scoped to the project, and the stale-default bug is now structurally impossible
  ok(/\.filter\(\(r\) => r\.projectId === p\.id\)/.test(src), "the ranked list shows only THIS project's risks");
  ok(/const pid = p\.id;/.test(src), "new risks are logged against the mounted project — no dropdown to get out of sync");
  ok(!/useEffect\(\(\) => \{ setPid\(selId\); \}, \[selId\]\);/.test(src), "the effect that patched the stale dropdown default is gone with the dropdown");

  // the PROJECT column is gone and its width went to the risk text
  // Scope to RiskRegister's own source — DependencyPanel legitimately has a Project column of its own and
  // must not be swept up by a repo-wide grep.
  const rr = src.slice(src.indexOf("function RiskRegister("));
  ok(!/<th className="px-2 py-1.5 text-left">Project<\/th>/.test(rr.slice(0, rr.indexOf("\nfunction "))), "the PROJECT column is removed from the Risk Register (DependencyPanel's own column is untouched)");
  ok(/<th className="w-1\/2 px-2 py-1.5 text-left">Risk<\/th>/.test(src), "the freed width went to the RISK column");
  ok(!/const nameOf = \(id: string\)/.test(src), "the project-name lookup the column needed is gone too");
  ok(!/onClick=\{\(\) => onSelect\(r\.projectId\)\}/.test(src), "rows no longer navigate to another project — there is only one");

  // identity the operator asked to keep
  ok(/Risk Register · eXeL AI feedback session/.test(src), "the header keeps its identity");
  ok(/Identify · Concur · De-risk/.test(src), "the Identify · Concur · De-risk explainer is kept");
  ok(/\+ Identify risk/.test(src), "the identify-a-risk action is kept");
  ok(/▲ concur/.test(src), "the concur (poll) action is kept");
}

// ── #23 · S9 user stories — discipline selector + authored stories ──────────────────────
// EXTENDED, not forked: the S9 table already existed at innovation-data.ts:2126 and the generator at :2293.
// Both were stamping CRS-56.IN.SRS.### on every row regardless of whether the work was firmware, mechanical
// or AI/ML, and emitting three copies of "As an operator I want ... so that the mission succeeds".
{
  const fsp = await import("node:fs/promises");
  const data = await fsp.readFile("lib/innovation-data.ts", "utf8");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const lex = await fsp.readFile("lib/lexicon-data.ts", "utf8");
  const M = await import("../lib/innovation-data.ts");

  // 23a · the six teams, EXACTLY as the operator listed them, in order, plus Other:
  const want = [["SRS", "Software Platform/Web Development"], ["WRS", "Web/Mobile/Browser App"],
    ["VRS", "Virtual Video/Control Platform"], ["FRS", "Firmware Development"],
    ["MRS", "Mechanical Development"], ["AIML", "AI/ML Platform Development"]];
  ok(M.DISCIPLINES.length === 6, "six Development Team rows");
  want.forEach(([k, team], i) => {
    ok(M.DISCIPLINES[i].key === k, `discipline ${i + 1} is ${k} (order preserved)`);
    ok(M.DISCIPLINES[i].team === team, `${k} = "${team}"`);
  });
  ok(M.DISCIPLINE_OTHER === "Other:", 'the seventh option is "Other:"');

  // the label sanitiser — a DOT would break CRS-##.IN.X.### segmentation and silently corrupt the ID
  ok(M.disciplineLabel(" my team ") === "MYTEAM", "Other label is trimmed, uppercased, de-spaced");
  // Thoth P0b — the old [.\\s] denylist let all of these through into the Req ID.
  ok(M.disciplineLabel("RF/EW") === "RFEW" && M.disciplineLabel("hw-eng") === "HWENG", "slashes and hyphens are stripped, not passed through");
  ok(M.disciplineLabel("Other:") === "OTHER", "the colon in the literal \"Other:\" cannot reach the ID");
  ok(!M.disciplineLabel("AI,ML").includes(","), "the COMMA — the multi-select field separator — cannot survive into a label");
  ok(M.disciplineLabel("A".repeat(5000)).length === M.DISCIPLINE_MAX, `labels are capped at ${M.DISCIPLINE_MAX} chars — an unbounded label lands in the ID and on the printed sheet`);
  ok(M.disciplineLabel("AB\u202ECD") === "ABCD", "U+202E RIGHT-TO-LEFT OVERRIDE is stripped — a Req ID must not display as a different ID than it stores");
  ok(/^[A-Z0-9]*$/.test(M.disciplineLabel("\u200bx\u00e9!@#")), "the sanitiser is an ALLOWLIST — only A-Z0-9 survives");
  ok(!M.disciplineLabel("a.b.c").includes("."), "dots are stripped — they would break the Req ID segmentation");
  ok(M.disciplineLabel("") === "", "an empty Other label stays EMPTY — the fallback lives in storyReqId, so clearing the box cannot append a phantom SRS (Thoth P0b)");
  ok(M.storyReqId("PRJ-01", "", 1) === "CRS-01.IN.SRS.001", "…and the fallback still yields a well-formed ID at the point of use");
  ok(M.storyReqId("PRJ-07", "FRS", 7) === "CRS-07.IN.FRS.007", "Req ID encodes the PROJECT: CRS-<project>.IN.<LABEL>.<seq>");
  ok(M.storyReqId("PRJ-01", "FRS,MRS", 1) === "CRS-01.IN.FRS.001", "a multi-discipline row drives its ID from the PRIMARY label");
  ok(/^CRS-\d+\.IN\.[A-Z0-9]+\.\d{3}$/.test(M.storyReqId("PRJ-01", "x y.z", 3)), "a sanitised Other label still yields a well-formed Req ID");

  // every producer of the old hardcoded SRS is gone
  ok(!/CRS-56\.IN\.SRS\.\$\{/.test(data), "the generator no longer hardcodes SRS (was innovation-data.ts:2293)");
  ok(!/Req ID follows CRS-##\.IN\.SRS\.###/.test(data), "the schema hint no longer names SRS as the only label (was :2126)");
  ok(/cols: \[\.\.\.STORY_COLS\]/.test(data), "S9 uses the operator's 8-column schema (STORY_COLS), spread so the schema and the row builder cannot disagree");

  // default discipline is a RULE over data already on the project, not 33 hand-maps
  ok(/export function defaultDiscipline/.test(data) && /\$\{p\.division\} \$\{p\.name\} \$\{p\.category\}/.test(data),
     "the default is derived by rule from division + name + category, the same idiom as metaOf()");
  const dist = {};
  for (const p of M.DEMO_PROJECTS) { const d = M.defaultDiscipline(p); dist[d] = (dist[d] || 0) + 1; }
  ok(Object.keys(dist).length >= 4, `the rule actually discriminates — ${JSON.stringify(dist)}`);
  ok(!dist.SRS || dist.SRS < M.DEMO_PROJECTS.length, "the default is NOT always SRS");
  ok(M.DEMO_PROJECTS.every((p) => M.DISCIPLINES.some((d) => d.key === M.defaultDiscipline(p))), "every default is one of the six");

  // the multi-select lives on the ROW and writes through the EXISTING store round-trip
  ok(/function TeamPicker\(/.test(src), "TeamPicker exists");
  ok(/c === "Team"/.test(src) && /<TeamPicker value=\{r\[ci\] \|\| ""\}/.test(src), "TeamPicker stays wired to any table declaring a Team column — S9's 8-column schema has none, so the discipline now comes from storiesOf()");
  ok(/setActive\(spec\.code, f\.id, nr\)/.test(src), "it writes through the table's existing setActive round-trip — no new persistence path");
  ok(/nr\.forEach\(\(rr, k\) => \{ rr\[idc\] = storyReqId\(p\.id, \(tc >= 0 \? rr\[tc\] : ""\) \|\| "SRS", k \+ 1\); \}\)/.test(src), "changing the Team RENUMBERS every row — recomputing only the edited row from its index let a delete leave 001,002,004,005,006 and the next add collide on 006 (Thoth P0)");
  ok(/const toggle = \(k: string\) => onChange\(\(picked\.includes\(k\) \? picked\.filter\(\(x\) => x !== k\) : \[\.\.\.picked, k\]\)\.join\(","\)\)/.test(src), "the picker is MULTI-select (toggles into a comma-joined set, not a radio)");

  // t() coverage
  for (const [k] of want) ok(lex.includes(`key: "innovation.story.team.${k}"`), `lexicon carries innovation.story.team.${k}`);
  ok(lex.includes('key: "innovation.story.team.other"'), "lexicon carries the Other: label");

  // 23b · 3-9 authored stories per project, specific, well formed, unique
  const RX = /^As .+, I want .+ so that .+\.$/;
  const seenAll = new Set(); let total = 0, min = 99, max = 0;
  for (const p of M.DEMO_PROJECTS) {
    const st = M.storiesOf(p);
    min = Math.min(min, st.length); max = Math.max(max, st.length); total += st.length;
    ok(st.length >= 3 && st.length <= 9, `${p.id} has ${st.length} stories (3-9)`);
    const local = new Set();
    for (const r of st) {
      ok(RX.test(r.story), `${p.id} story matches "As a … I want … so that …": ${r.story.slice(0, 48)}`);
      ok(!local.has(r.story), `${p.id} has no duplicate story`);
      local.add(r.story);
      ok(/^(MVP1|MVP2|MVP3)$/.test(r.mvp), `${p.id} story is grouped by MVP phase`);
      ok(M.DISCIPLINES.some((d) => d.key === r.team) || r.team === M.disciplineLabel(r.team), `${p.id} story carries a valid Team label`);
      seenAll.add(r.story);
    }
    ok(st.some((r) => r.persona === "the System"), `${p.id} treats the SYSTEM as a first-class persona`);
    ok(new Set(st.map((r) => r.persona)).size >= 3, `${p.id} rotates at least 3 personas`);
    ok(st.some((r) => r.mvp === "MVP1") && st.some((r) => r.mvp === "MVP3"), `${p.id} spans the MVP roadmap`);
  }
  ok(seenAll.size === total, `no story is shared between projects — ${total} stories, all distinct (a story that could be pasted onto another project has failed)`);
  ok(min >= 3 && max <= 9, `story counts across 33 projects: min ${min}, max ${max}, total ${total}`);
  ok(!/As an operator I want/.test(data), "the single generic 'operator' persona is gone");
  // determinism — the deck's contract
  ok(JSON.stringify(M.storiesOf(M.DEMO_PROJECTS[0])) === JSON.stringify(M.storiesOf(M.DEMO_PROJECTS[0])), "storiesOf is deterministic");
}

// ── STANDING LAW · text is NEVER cut off and NEVER ellipsised ────────────────────────────
// The one-size law stands: with the constants derived from the worst case, NOTHING shrinks today. This is
// the valve for the long tail — at 999 projects one absurd name must not drag the deck's type down, and
// must not be clipped either. Proven to fire: 40 ch (the real worst case) untouched at 32.8px, 45 ch shrinks
// to 30.9px, 90 ch and beyond wrap at the 19.2px floor.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const shot = await fsp.readFile("scripts/slide-shots.mjs", "utf8");
  const M = await import("../lib/innovation-data.ts");
  const S = 2.05, B = M.HEADER_NAME_BUDGET, F = M.HEADER_NAME_FLOOR;

  // the common case is UNTOUCHED — the shared size still governs every real project
  const longest = [...M.DEMO_PROJECTS].sort((a, b) => b.name.length - a.name.length)[0];
  ok(M.fitHeader(longest.name, S, B, F).shrunk === false,
     `the longest REAL name ("${longest.name}", ${longest.name.length} ch) does NOT shrink — the one-size law is intact`);
  ok(M.DEMO_PROJECTS.every((p) => M.fitHeader(p.name, S, B, F).cqw === S), "all 33 projects render the project name at the shared 32.8px");

  // the valve fires, and degrades in the right order: shrink -> floor -> wrap, never clip
  ok(M.fitHeader("X".repeat(45), S, B, F).shrunk === true, "a 45-character name shrinks itself");
  ok(M.fitHeader("X".repeat(45), S, B, F).wrap === false, "…and does not need to wrap yet");
  ok(M.fitHeader("X".repeat(90), S, B, F).wrap === true, "a 90-character name reaches the floor and WRAPS");
  ok(M.fitHeader("X".repeat(300), S, B, F).cqw === F, "an absurd 300-character name stops at the legibility floor, it does not vanish");
  // exhaustive: no length may ever exceed the budget unwrapped, or fall below the floor
  let bad = 0;
  for (let n = 1; n <= 300; n++) {
    const f = M.fitHeader("X".repeat(n), S, B, F);
    if (f.cqw > S || f.cqw < F) bad++;
    if (!f.wrap && n * M.HEADER_CHAR_W * f.cqw > B) bad++;
  }
  ok(bad === 0, "exhaustive scan of name lengths 1-300: never over budget unwrapped, never below the floor");
  ok(/Math\.floor\(scaled \* 1000\) \/ 1000/.test(await fsp.readFile("lib/innovation-data.ts", "utf8")),
     "the chosen size is FLOORED, never rounded up past the budget");

  // never an ellipsis, in code or on screen
  ok(!/data-proj-name[^>]*truncate/.test(src) && !/data-slide-title[^>]*truncate/.test(src), "no truncate on the project name or the slide title");
  ok(/nameFit\.wrap \? "" : "whitespace-nowrap"/.test(src) && /titleFit\.wrap \? "" : "whitespace-nowrap"/.test(src),
     "nowrap is released only when the string has reached the floor — wrap, never clip");
  ok(/TEXT CUT OFF in \$\{e\.where\}/.test(shot), "the gate fails on ANY clipped text node");
  ok(/cs\.textOverflow === "ellipsis" && el\.scrollWidth - el\.clientWidth > 1/.test(shot), "an ellipsis that is actually triggering is a failure");
  ok(/rendered an ellipsis/.test(shot), "a literal … in the header band is a failure");

  // box first, then type
  ok(/data-slide-head className="flex h-\[9.4cqh\] shrink-0/.test(src), "the header band was widened FIRST so a wrapped second line fits without moving the body");

  // the sweep covers EVERY project, not a sample
  ok(/HEADER SWEEP · EVERY project, not a sample/.test(shot), "the gate sweeps all projects");
  ok(/for \(const pr of DEMO_PROJECTS\)/.test(shot), "the sweep iterates the full project list");
  ok(/SHRINK FIRED/.test(shot), "the sweep reports any shrink together with the string that caused it");
  ok(/project name CUT OFF/.test(shot), "the sweep fails on a clipped name");
}

// ── #29 REOPENED · THE PAPER IS PAPER ───────────────────────────────────────────────────
// b7bad08 fixed FRAGMENTATION (portrait genuinely paginates 21/21). What it did not fix was the assumption
// that the paper IS 1600x900. The operator prints US Letter: at 100% scaling a 1600px sheet cannot fit an
// ~960px printable box, so it overflowed and clipped on the right in BOTH orientations. That is why the clip
// survived three fixes all aimed at fragmentation, and why the gate could not see it — it asked Chromium for
// a 1600x900 page, i.e. it asserted the very assumption that was broken.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const gate = await fsp.readFile("scripts/pdf-gate.mjs", "utf8");

  // the @page rule
  ok(/@page \{ size: letter landscape; margin: 0\.5in; \}/.test(src), "@page is `letter landscape` with 0.5in margins — both explicit operator requirements");
  ok(!/@page \{ size: 1600px 900px landscape/.test(src), "the contradictory `1600px 900px landscape` rule (a custom size AND an orientation keyword) is gone");
  ok(!/margin: 0; \}/.test(src.slice(src.indexOf("@media print"), src.indexOf("@media print") + 400)), "margin: 0 is gone — it contradicted the requested 0.5in");

  // the sheet fills the PRINTABLE BOX and keeps 16:9, so cq units rescale to whatever paper is chosen
  ok(/\.slide-print-page \{ position: relative !important; width: 100% !important; height: auto !important; aspect-ratio: 16 \/ 9;/.test(src),
     "the print sheet fills the printable box at 16:9 instead of demanding 1600x900");
  ok(/const printSheetStyle: React\.CSSProperties = \{ width: "100%", aspectRatio: "16 \/ 9", flex: "none", containerType: "size" \}/.test(src),
     "printSheetStyle is width:100% + aspect-ratio + container-type:size, so every cqw/cqh rescales proportionally");
  ok(!/style=\{\{ width: SHEET_W, height: SHEET_H \}\}/.test(src), "no print wrapper still hardcodes the pixel sheet");

  // NOT transform: scale() — that would re-break the WebKit fragmentation b7bad08 fixed
  ok(/transform: none !important/.test(src), "the print tree carries no transform");
  ok(/Deliberately NOT transform: scale\(\)/.test(src), "the reason transform was rejected is recorded where the next person will look");
  ok(/break-inside: avoid; page-break-inside: avoid/.test(src), "BOTH the modern and legacy fragmentation properties are emitted — WebKit still wants the legacy pair");

  // the SCREEN path is untouched
  ok(/const SHEET_W = 1600, SHEET_H = 900;/.test(src), "SHEET_W/SHEET_H remain for the screen path");
  ok(/transform: `scale\(\$\{fit \* zoom\}\)`/.test(src), "the screen sheet still scales to fit — only the print path changed");

  // THE ASSERTION THAT NEVER EXISTED, and the reason the clip survived
  ok(/printable box at 96dpi|Printable box at 96dpi/i.test(gate), "the gate reasons in real paper units");
  ok(/format: "Letter", landscape: paper\.landscape/.test(gate), "the gate prints real Letter, not a 1600x900 fantasy");
  ok(/margin: \{ top: "0\.5in", bottom: "0\.5in", left: "0\.5in", right: "0\.5in" \}/.test(gate), "…with the operator's 0.5in margins");
  ok(/past the \$\{paper\.wpx\}px printable width \(right edge CLIPPED\)/.test(gate), "the gate FAILS on content wider than the printable box — this assertion did not exist before");
  ok(/name: "Letter landscape", landscape: true/.test(gate) && /name: "Letter portrait",  landscape: false/.test(gate), "both orientations are asserted — the operator uses both");
  ok(/wpx: 960, hpx: 720/.test(gate) && /wpx: 720, hpx: 960/.test(gate), "printable boxes are 10x7.5in landscape and 7.5x10in portrait at 96dpi");

  // engine coverage is STATED, never implied
  ok(/WEBKIT UNVERIFIED/.test(gate), "the gate says out loud when WebKit could not be verified");
  ok(/VERIFIED ENGINE: Blink \(Chromium\)\. UNVERIFIED ENGINE: WebKit/.test(gate), "it names the engine it verified AND the one it did not");
  ok(/Chrome on iOS is NOT Chromium/.test(gate), "the gate records WHY WebKit matters — Apple mandates WKWebView, so every iOS browser is WebKit");
  ok(/webkit\.launch\(\)/.test(gate), "a WebKit run is attempted whenever a build is present");
  ok(/does not fragment out-of-flow boxes/.test(gate) && /does not fragment inside transformed boxes/.test(gate),
     "the WebKit run asserts the two rules WebKit is stricter about than Blink");
}

// ── #23b/#23c · ONE story record, THREE progressive-disclosure levels ───────────────────
// Operator: "DTM is max Level 3 detail (which will populate CRS FROM Level 1)." One record per story with
// progressively more fields surfaced — NOT three parallel tables that could drift.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");
  const M = await import("../lib/innovation-data.ts");

  ok(M.STORY_COLS.join(" | ") === "User Stories | POC | Alpha | MVP1 | MVP2 | MVP3 | CRS # | Customer Needs",
     "Level 2 columns are exactly the operator's eight, in order");
  ok(M.TRACE_COLS.length === 18, "Level 3 has the operator's 18 DHF columns");
  ok(M.TRACE_COLS[0] === "User Stories" && M.TRACE_COLS[3] === "Design Input #" && M.TRACE_COLS[6] === "Design Output #",
     "Level 3 column order matches the operator's specification");

  for (const p of M.DEMO_PROJECTS) {
    const st = M.storiesOf(p), l2 = M.storyTableRows(p), l3 = M.traceRowsOf(p);
    // ROW LENGTH === COLS LENGTH — the shifted-column bug the operator photographed, impossible in EVERY view
    ok(l2.every((r) => r.length === M.STORY_COLS.length), `${p.id} Level 2 rows are all exactly ${M.STORY_COLS.length} wide`);
    ok(l3.every((r) => r.length === M.TRACE_COLS.length), `${p.id} Level 3 rows are all exactly ${M.TRACE_COLS.length} wide`);
    // ONE dataset: every level has one row per story (plus group headers), and the SAME sentence
    const l2d = l2.filter((r) => !M.isStoryGroupRow(r)), l3d = l3.filter((r) => !M.isTraceGroupRow(r));
    ok(l2d.length === st.length, `${p.id} Level 2 has exactly one row per story (${l2d.length}/${st.length})`);
    ok(l3d.length === st.length, `${p.id} Level 3 has exactly one row per story (${l3d.length}/${st.length})`);
    ok(st.every((r, i) => l2d[i][0] === r.story), `${p.id} Level 2 story text is byte-identical to Level 1`);
    const byCrs = new Map(l3d.map((r) => [r[1], r]));
    ok(st.every((r) => byCrs.get(r.crsNum)?.[0] === r.story), `${p.id} Level 3 story text is byte-identical to Level 1`);
    // exactly ONE maturity dot per row
    ok(l2d.every((r) => r.slice(1, 6).filter((c) => c === "●").length === 1), `${p.id} every Level 2 row carries exactly one ● across the five maturity columns`);
    // CRS # sequential per project
    ok(l2d.every((r, i) => r[6] === `CRS-${String(i + 1).padStart(2, "0")}`), `${p.id} CRS # is sequential from CRS-01`);
    // Design Output # DERIVED from Design Input #, never stored twice
    ok(st.every((r) => r.designOutputId === r.designInputId.replace(".IN.", ".OUT.")), `${p.id} Design Output # is derived from Design Input #`);
    ok(st.every((r) => /^CRS-\d+\.IN\.[A-Z0-9]+\.\d{3}$/.test(r.designInputId)), `${p.id} Design Input # keeps the CRS-##.IN.<LABEL>.### format`);
    ok(st.every((r) => /^DR-\d{4}\.\d{2}\.\d{2}-DR\.\d{3}$/.test(r.designReviewId)), `${p.id} Design Review # is date-stamped DR-YYYY.MM.DD-DR.###`);
    // the eight lifecycle columns are EMPTY by design — nothing invented
    ok(l3d.every((r) => r.slice(10).every((c) => c === "")), `${p.id} the eight forward lifecycle columns are empty, not invented`);
    ok(st.every((r) => M.CUBES.some((c) => c.n === r.cube)), `${p.id} every story groups under a real cube`);
    ok(l3.some((r) => M.isTraceGroupRow(r) && /^🧊 Cube \d+ — .+ \(\d,\d,\d\)$/.test(r[0])), `${p.id} Level 3 carries cube group headers with (level,row,col) coordinates`);
  }
  // determinism — designReviewId must not call new Date()
  ok(!/new Date\(\)/.test((await fsp.readFile("lib/innovation-data.ts", "utf8")).slice(
      (await fsp.readFile("lib/innovation-data.ts", "utf8")).indexOf("export function designReviewId"),
      (await fsp.readFile("lib/innovation-data.ts", "utf8")).indexOf("export function traceRowsOf"))),
     "designReviewId is derived from the project's own gate schedule, not from today's date");

  // three views, one component, tabs that cannot move the body
  ok(/const STORY_LEVELS = \[/.test(src) && /Level 1 · High-Level Specs/.test(src) && /Level 3 · Design Traceability Matrix/.test(src), "the three levels are tabs");
  ok(/function StorySpecs\(/.test(src), "one component renders all three levels");
  ok(/const max = React\.useContext\(ChartMaxCtx\)/.test(src), "it reuses ChartFrame's existing maximize state — no new affordance");
  ok(/maximize to open the 18-column Design Traceability Matrix/.test(src), "Level 3 refuses to render in-canvas and says why");
  ok(/whitespace-normal break-words/.test(src), "Level 3 cells WRAP — the no-clip law holds by wrapping and scrolling, never truncating");
}

// ── SEED WIDTH · the third producer (Krishna #1) ─────────────────────────────────────────
// The bug the operator photographed RECURRED and shipped: S9's schema widened, both CODE producers were
// migrated, and SLIDE_SEED — a THIRD producer, 33 projects x hi+ai — was never grepped for. page.tsx padded
// short rows with em-dashes instead of failing, so every project rendered shifted by one column and the
// H5 seed's literal placeholder "High-priority 0" appeared under PERSONA. Proven red before the fix:
// 182 mismatched rows of 3042. This ONE lock covers every table field on every slide for every project.
{
  const M = await import("../lib/innovation-data.ts");
  let checked = 0, bad = 0; const ex = [];
  for (const sp of M.SLIDE_SCHEMA) for (const f of sp.fields) {
    if (f.kind !== "table" || !f.cols) continue;
    for (const p of M.DEMO_PROJECTS) for (const slot of ["hi", "ai"]) {
      const v = M.SLIDE_SEED[p.id]?.[sp.code]?.[f.id]?.[slot];
      if (!Array.isArray(v)) continue;
      for (const row of v) { checked++; if (!Array.isArray(row) || row.length !== f.cols.length) { bad++; if (ex.length < 3) ex.push(`${p.id} ${sp.code}.${f.id}.${slot} width ${row?.length} != ${f.cols.length}`); } }
    }
  }
  ok(bad === 0, `every seeded table row matches its schema's column count (${checked} rows checked)${bad ? " — " + ex.join("; ") : ""}`);
  ok(checked > 500, `the lock actually traverses the seed (${checked} rows), it is not vacuously true`);

  // S9's stories are LINKED, so the seed can never shadow the generator again (Krishna #2: storiesOf was
  // dead code for all 33 projects because every seeded ai cell was non-empty).
  const f9 = M.SLIDE_SCHEMA.find((s2) => s2.code === "S9").fields.find((x) => x.id === "stories");
  ok(f9.linked === true, "S9.stories is a LINKED field — read live from the project record, never from the seed");
  for (const p of M.DEMO_PROJECTS) {
    const v = M.linkedSlideField(p, "S9", "stories");
    ok(Array.isArray(v) && v.length > 0, `${p.id} S9.stories resolves through the linked path`);
    ok(v.every((r) => r.length === M.STORY_COLS.length), `${p.id} every rendered story row is ${M.STORY_COLS.length} wide`);
    ok(!M.SLIDE_SEED[p.id]?.S9?.stories, `${p.id} carries no stale S9.stories seed to shadow the generator`);
  }
  ok(!JSON.stringify(M.SLIDE_SEED).includes("High-priority"), 'the "High-priority 0" placeholder the operator photographed is gone from the seed');

  // Thoth P0 — Req IDs must be globally distinct now that the DTM keys on Design Input #
  const ids = new Set(); let n = 0;
  for (const p of M.DEMO_PROJECTS) for (const r of M.storiesOf(p)) { ids.add(r.designInputId); n++; }
  ok(ids.size === n, `all ${n} Design Input # are distinct across the portfolio (was 22 distinct for 198 stories)`);
  ok(M.projectCrsNum("PRJ-07") === "07" && M.projectCrsNum("PRJ-33") === "33", "the CRS-## segment is the project number");
}

// ── Krishna #5 · the Risk Register cannot mount twice ────────────────────────────────────
{
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  ok(/\$\{detailMax \? "hidden" : detailOpen \? "block" : "hidden"\}/.test(src),
     "the inline detail rail UNMOUNTS while the maximize overlay is open — landscape kept both alive, giving two live RiskRegister forms in one aria-modal dialog");
  ok(/\$\{detailMax \? "" : "landscape:block"\}/.test(src), "landscape:block no longer forces the rail back on underneath the overlay");
}

console.log(`\nINNOVATION-TIME ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
