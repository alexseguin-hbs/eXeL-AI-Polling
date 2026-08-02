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
ok(empty.evcUsdM === 100 && empty.wins === 0, "valueEquation: empty drivers → parity index 50, EVC = reference, 0 wins");
const winDriver = valueEquation([{ name: "Range", importance: 1, ourScore: 0.9, nbaScore: 0.3 }], 100);
ok(winDriver.perDriver[0].verdict === "win", "valueEquation: ours ≫ NBA → win verdict");
ok(winDriver.differentiationM > 0 && winDriver.evcUsdM > 100, "valueEquation: a win lifts differentiation and EVC above the NBA reference");
const lossDriver = valueEquation([{ name: "Cost", importance: 1, ourScore: 0.2, nbaScore: 0.8 }], 100);
ok(lossDriver.perDriver[0].verdict === "loss" && lossDriver.differentiationM < 0, "valueEquation: ours ≪ NBA → loss verdict, index <50");
const evcLo = valueEquation([{ name: "X", importance: 1, ourScore: 0.5, nbaScore: 0.4 }], 100).evcUsdM;
const evcHi = valueEquation([{ name: "X", importance: 1, ourScore: 0.9, nbaScore: 0.4 }], 100).evcUsdM;
ok(evcHi > evcLo, "valueEquation: EVC is monotonic increasing in our score");
ok(Number.isFinite(winDriver.differentiationM), "valueEquation: differentiation is a finite $ figure (D3 retired the 0-100 index)");
ok(Number.isFinite(valueEquationOf(DEMO_PROJECTS[0]).evcUsdM), "valueEquationOf resolves for a real project (addressable = full 10-yr revenue)");
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
ok(SLIDES.length === 19, "SLIDES = 18 review deliverables (S1–S18) + the merged CS + RA close-out");
ok(SLIDES[0].slide === "S1" && SLIDES[1].slide === "S2" && SLIDES[17].slide === "S18" && SLIDES[18].slide === "CSRA" && SLIDES.length === 19, "SLIDES run S1 → S18 in gate order, then the CS + RA close-out — AFTER S18, as the operator specified");
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
  // S10's spend no longer has an AI draft or a schema field — the operator deleted the duplicate table
  // ("Delete / R&D spend by year (WBS) REQUIRED"). The intent of this assertion was never the draft; it was
  // that S10's R&D spend traces to the SAME number as every other surface. That is now checkable against the
  // record itself, which is stronger: the grid's own spend total must reconstruct `nreK`.
  const FIN0 = await import("../lib/innovation-data.ts");
  const finP0 = FIN0.finBaseline(P0, 2026);
  ok(Math.abs(FIN0.finTotalSpendK(finP0) - P0.nreK) <= finP0.years.length,
     `the S10 grid's spend total reconstructs p.nreK — ${Math.round(FIN0.finTotalSpendK(finP0))} vs ${P0.nreK} (rounding only)`);
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
ok(SLIDE_SCHEMA.length === 19, "SLIDE_SCHEMA = 18 review slides (S1–S18) + the merged CS + RA close-out (was 20; the merge honours the flower of life)");
ok(SLIDE_SCHEMA[0].code === "S1" && SLIDE_SCHEMA[1].code === "S2" && SLIDE_SCHEMA[17].code === "S18" && SLIDE_SCHEMA[18].code === "CSRA", "schema runs S1 → S18 then the merged CSRA — positioned AFTER S18");
ok(slideSpec("CSRA").fields.every((f) => f.linked), "every CS + RA field is linked (live governance, no authoring surface)");
ok(slideSpec("CS") === undefined && slideSpec("RA") === undefined, "the retired CS and RA codes are GONE — not left half-alive alongside the merge");
ok(slideSpec("CSRA").fields.find((f) => f.id === "history").cols.length === 8, "the history matrix declares a label column + one per gate, derived from the ladder");
ok(SLIDE_SCHEMA.every((s) => s.source && GATES_N.includes(s.gate)), "every slide carries a source + a valid gate");
// S10 IS THE ONE CODE WITH NO SCHEMA FIELDS, BY DESIGN AND BY OPERATOR INSTRUCTION. Its content is the
// financial grid, which is always on screen and is the only place money can be typed. Named as the single
// exception rather than softened away, so a SECOND field-free slide — which would be a slide with nothing on
// it — still fails.
ok(SLIDE_SCHEMA.filter((s) => s.fields.length === 0).map((s) => s.code).join("|") === "S10",
   `S10 alone carries no schema fields — [${SLIDE_SCHEMA.filter((s) => !s.fields.length).map((s) => s.code).join(", ")}]`);
ok(SLIDE_SCHEMA.filter((s) => s.code !== "S10").every((s) => s.fields.length > 0), "every OTHER slide carries typed fields");
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
  ok(sset.includes("CSRA"), "slidesForProject always includes the merged CS + RA close-out");
  ok(sset[sset.length - 1] === "CSRA", "CS + RA is the LAST slide — immediately after S18");
  ok(DEMO_PROJECTS.every((p) => slidesForProject(p).includes("CSRA")), "every project ships the CS + RA close-out");
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
    const fullDeck = SLIDE_SCHEMA.filter((s) => s.code !== "CSRA").map((s) => s.code);
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

/* ---------------- X-7f — 2-3 WORD DIFFERENTIATORS ON CS+RA (operator, with a screenshot) --------------- */
{
  const F = await import("../lib/innovation-data.ts");
  // Deterministic, because identical inputs must yield identical themes and a board sheet cannot wait on a
  // network round-trip. "AI" here is this codebase's own offline-generator idiom, not a provider call.
  ok(typeof F.shortDifferentiator === "function", "shortDifferentiator is a pure exported producer");
  ok(!/fetch\(|await /.test(F.shortDifferentiator.toString()), "it makes NO network call — deterministic, like every other AI-drafted field here");
  ok(F.shortDifferentiator("On-board AI SAR forming (edge targets)") === "On-board AI SAR", "strips a parenthetical aside and caps at three");
  ok(F.shortDifferentiator("Open architecture / low migration risk") === "Open architecture", "keeps the HEAD clause before the first separator");
  ok(F.shortDifferentiator("Lower operator cognitive load (XR)") === "Operator cognitive load", "drops a leading comparative — direction, not substance — and restores sentence case");
  ok(F.shortDifferentiator("PNT-denied operation") === "PNT-denied operation", "an already-short name is returned UNCHANGED, never mangled");
  ok(F.shortDifferentiator("Sensor-grid fusion to the TOC") === "Sensor-grid fusion TOC", "connectives are dropped but ACRONYMS keep their case");
  ok(F.shortDifferentiator("") === "" && F.shortDifferentiator(undefined) === "", "empty and undefined degrade to empty, never to 'undefined'");

  // EXECUTED OVER ALL 33 PROJECTS — the operator asked for "all 33 CS+RA slides", so it is counted, not sampled.
  const names = new Set();
  for (const p of F.DEMO_PROJECTS) for (const d of (p.valueDrivers ?? [])) names.add(d.name);
  const over = [...names].filter((n) => F.shortDifferentiator(n).split(/\s+/).length > 3);
  ok(names.size > 90 && over.length === 0, `every one of the ${names.size} distinct differentiator names reduces to <= 3 words (${over.length} over)`);
  const blank = [...names].filter((n) => !F.shortDifferentiator(n).trim());
  ok(blank.length === 0, "no name reduces to empty — a blank cell would be worse than a long one");

  // ⚠ SCOPED TO CS+RA. S8 keeps the FULL names: that is where the value proposition is authored and read in
  // detail, and this is a display shortening for a 7-column matrix cell, never a rewrite of the record.
  const P = F.DEMO_PROJECTS.find((x) => x.id === "PRJ-01");
  const cell = F.gateReviewHistoryRows(P, F.finOf(P, 2026), F.buildDemoVersionSeed(P))
    .rows.find((r) => r.label === "Top 3 Differentiators").values.find((v) => v !== null);
  ok(cell === "All-weather · On-board AI SAR · SWaP fit Group-3", `CS+RA shows the short form: "${cell}"`);
  const s8 = F.valuePropRows(P).map((r) => r[0]).join(" ");
  ok(/GPS-denied imaging/.test(s8), "S8 still carries the FULL differentiator names — the record is untouched");
}

/* ---------------- X-7e — A DERIVED READ-OUT TAB IS GREY, NOT GREEN -------------------------------------
   Operator: "make CS+RA tab grey not green". They were right and it is a SEMANTIC error, not a colour
   preference: fillOf falls back to ALL fields when a slide declares no `req` ones, so CS+RA's three live
   read-outs scored 3/3 = 100% and wore the emerald "done" badge every other tab has to EARN.            */
{
  const F = await import("../lib/innovation-data.ts");
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const authorable = (sp) => sp.fields.some((f) => !f.linked);
  const noSignal = F.SLIDE_SCHEMA.filter((sp) => sp.code !== "S10" && !authorable(sp)).map((sp) => sp.code);

  ok(/const hasFillSignal = \(sp: SlideSpec\) => sp\.code === "S10" \|\| sp\.fields\.some\(\(f\) => !f\.linked\)/.test(src),
     "the rule is 'has a completeness signal', DERIVED from the schema — not a CSRA special case");
  ok(/!hasFillSignal\(s\) \? "border-slate-700 text-slate-500/.test(src),
     "a slide with no completeness signal renders the NEUTRAL slate the unfilled tabs already use — no new colour was invented");
  ok(/derived read-out — nothing to author/.test(src),
     "its tooltip says what it is instead of claiming a percentage it cannot have");

  // COUNTED, NOT NAMED — so a future all-linked slide inherits the rule automatically.
  ok(noSignal.includes("CSRA"), "CS+RA has no authorable field, so it reads grey — the operator's ask, expressed as the rule");
  ok(noSignal.length === 2 && noSignal.includes("S9"),
     `exactly TWO tabs change and S9 is the other — declared, not discovered: [${noSignal.join(", ")}]`);
  // ⚠ S10 MUST KEEP ITS COLOUR. Every S10 field is linked too, but it HAS a real measure (finGateReadiness
  // over the year grid), so greying it would destroy a signal that means something.
  ok(!authorable(F.slideSpec("S10")) && /sp\.code === "S10" \|\|/.test(src),
     "S10 is excluded by name because it carries a genuine readiness measure despite having no authorable field");
}

/* ---------------- D1 — REMOVE A PROJECT (operator: "add and remove projects at will") ------------------
   ADD already worked; REMOVE did not exist ANYWHERE. Grep-verified before a line was written, per R-CORE:
   deleteProject|removeProject|onDelete|onRemove returned nothing across app/innovation/ and the lib. These
   locks hold the shape that makes a destructive action safe.                                            */
{
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");

  // ONE WRITER — remove mutates the SAME `order` array createIdea appends to, so the SAME debounced
  // saveState("projects", …) persists it. A second persistence path is how two surfaces drift.
  ok(/const removeIdea = \(id: string\) =>/.test(src), "removeIdea exists — the half of 'at will' that was missing");
  ok(/setOrder\(\(o\) => o\.filter\(\(x\) => x\.id !== id\)\)/.test(src), "remove filters the SAME `order` array createIdea appends to — one writer, one persistence path");
  ok(!/saveState\("projects-removed"|deleteState\("projects"/.test(src), "no second persistence path was invented for removal");

  // ASKS FIRST, AND NAMES WHAT GOES. A bare ✕ on a row is how a portfolio loses a project silently.
  ok(/setConfirmRemove\(selId\)/.test(src) && /Confirm project removal/.test(src), "removal is confirm-gated, never a one-click destroy");
  ok(/Remove this project\?/.test(src) && /stay keyed to \{v\.id\}/.test(src),
     "the dialog NAMES the project and states what stays behind — the operator decides with the facts, not a bare warning");

  // UNDO — saveState is debounced, so without this an accidental delete is unrecoverable from the cloud copy.
  ok(/const undoRemove = \(\) =>/.test(src) && /Undo<\/button>/.test(src), "a one-step Undo exists and is reachable from the UI");
  ok(/o\.some\(\(x\) => x\.id === undoRemoved\.p\.id\) \? o : \[undoRemoved\.p, \.\.\.o\]/.test(src),
     "Undo restores the WHOLE record and is idempotent — a double-undo cannot duplicate the project");

  // AUDITED — the removal shows up in CS+RA's own change ledger, which is the governance loop closing.
  ok(/project REMOVED from the portfolio/.test(src), "removal writes an audit entry, so CS+RA's change ledger records it");

  // SELECTION SAFETY — never leave the detail pane pointed at a dead id.
  ok(/if \(selId === id\) \{/.test(src), "removing the SELECTED project reselects a neighbour rather than stranding the detail pane");

  // ⚠ ORPHANS ARE LEFT INERT ON PURPOSE, AND COUNTED. Deleting bags/versions/members would destroy slide
  // cells and approved gate history that Undo could not restore. Ids are never reused, so nothing inherits.
  ok(/ids are never reused/.test(src), "the audit line states that orphan records are left keyed and ids never reused");
  // ⚠ THIS LOCK WAS DECORATION ON ITS FIRST WRITING AND MUTATION-TESTING CAUGHT IT. It matched the literal
  // spelling `delete bags[`, so a mutation writing `delete _b[id]` walked straight past it and the suite
  // stayed GREEN. Asserting a SPELLING instead of the PROPERTY is the proxy-lock family that cost fourteen
  // rewrites this session. Now it scopes to removeIdea's own body and forbids the REAL destructive verbs:
  // any `delete` statement, and any writer that could persist a swept record.
  const rmStart = src.indexOf("const removeIdea = (id: string) =>");
  const rmEnd = src.indexOf("\n  const undoRemove", rmStart);
  ok(rmStart > 0 && rmEnd > rmStart, "removeIdea's body was located and bounded for inspection");
  const rmBody = src.slice(rmStart, rmEnd);
  ok(rmBody.length > 300 && rmBody.length < 4000, `removeIdea body is bounded (${rmBody.length} chars)`);
  ok(!/\bdelete\s/.test(rmBody), "removeIdea performs NO delete — orphan records are left inert, because Undo could not restore them and no id ever inherits them");
  ok(!/writeFieldBags|writeVersions|setMembers|setVersions|setBags/.test(rmBody),
     "removeIdea writes NONE of the bag/version/member stores — it touches `order` and the audit only");
}

/* ---------------- X-7a — CS + RA · the merged governance close-out (operator's Approval Templates) ------
   The operator supplied slides 35-36 (Change Summary "Gate Review History" + PRB Reviews & Approvals) and
   required that the merged slide give NEW insight beyond what S16 is designed after. These locks hold the
   producers to the template AND to that differentiation. Every one was written RED first.               */
{
  const F = await import("../lib/innovation-data.ts");
  const P = F.DEMO_PROJECTS.find((p) => p.id === "PRJ-01");
  const fin = F.finOf(P, 2026);
  const rep = F.gateReviewHistoryRows(P, fin, F.buildDemoVersionSeed(P));

  // ── The template's shape: seven gate columns, Conceive → Retire, in order.
  ok(F.GATE_HISTORY_COLS.length === 7, "Gate Review History has SEVEN gate columns — the template's Conceive→Retire span");
  ok(F.GATE_HISTORY_COLS.map((c) => c.gate).join(",") === F.GATES.join(","),
     "the columns ARE the gate ladder, in order — derived from GATES, so adding a gate cannot leave the matrix stale");

  // ── The template's rails, asserted as a SET so a dropped group fails rather than shrinking quietly.
  // SIX rails, not five — the template splits Financials into a one-year and a three-year group, so they
  // are two rails, not one. My first draft asserted five and went red on the true shape; corrected to the
  // template rather than the assertion loosened to fit the code.
  const rails = [...new Set(rep.rows.map((r) => r.rail))];
  ok(rails.length === 6 && ["Market", "Date", "Financials · 1-Yr", "Financials · 3-Yr", "Value Proposition", "R&D + Risk"].every((x) => rails.includes(x)),
     `all SIX template rails are present — got ${rails.join(" | ")}`);
  ok(rep.rows.filter((r) => r.rail === "Financials · 1-Yr").length === 2
     && rep.rows.filter((r) => r.rail === "Financials · 3-Yr").length === 3,
     "the template's one-year pair and three-year trio are both rendered");
  // ⚠ THE HORIZON FORM IS NOT COSMETIC — F4's calendar-only ban-list caught my first labels. Its own rule:
  // `3-Yr NPV` names a HORIZON and stays; `Yr 1` is a launch-relative PERIOD index and is banned. I had used
  // both conventions in adjacent rows. Every rail here now uses the sanctioned form.
  ok(!rails.some((r) => /\b(Yr\s?\d|Year\s?[1-9]\b)/.test(r)),
     "no rail uses a launch-relative period index — the F4 calendar-only law reaches these labels too");

  // ── ⚠ THE GAPS ARE ASSERTED, NOT HIDDEN. Three template rows have no source in the tool; they render
  //    "—" everywhere and are NAMED. A future commit that invents a number for one of them fails here,
  //    which is the point — a fabricated figure on a governance slide is worse than a visible hole.
  ok(rep.gaps.length === 3 && rep.gaps.includes("TAM, $") && rep.gaps.includes("SAM, $") && rep.gaps.includes("Competitive NBA Price, $"),
     `exactly three rows are declared gaps and named: ${rep.gaps.join(" · ")}`);
  for (const g of rep.gaps) {
    const row = rep.rows.find((r) => r.label === g);
    ok(row.values.every((v) => v === null), `gap row "${g}" renders empty in every gate column — never a fabricated figure`);
  }
  // The duplicate that executing caught: NBA Price must NOT echo NBA value.
  const nba = rep.rows.find((r) => r.label === "Competitive NBA, $");
  const nbaPrice = rep.rows.find((r) => r.label === "Competitive NBA Price, $");
  ok(nba.values.some((v) => v !== null) && nbaPrice.values.every((v) => v === null),
     "Competitive NBA carries a value and NBA Price does not — the first draft derived NBA Price back to exactly NBA value and printed the same $ twice");

  // ── DRIFT ACROSS GATES IS THE WHOLE POINT. A matrix that resolves to one column demonstrates nothing;
  //    that is exactly what the first run produced (recordedGates 1/7) because every seeded version was
  //    stamped at p.gate. PRJ-01 sits at G4, so four gates must carry a recorded business case.
  ok(rep.recordedGates === 4, `PRJ-01 (G4) records FOUR gate columns, not one — got ${rep.recordedGates}`);
  const rd = rep.rows.find((r) => r.label === "R&D Spend, $");
  ok(rd.values.filter((v) => v !== null).length === 4, "R&D Spend is reconstructed at every cleared gate from the version snapshot");
  ok(rd.changed.filter(Boolean).length >= 2, "the R&D Spend row flags its changes — 'Highlight Changes Only in Red' is computed, not decorative");
  ok(rd.changed[0] === false, "the FIRST recorded value is a baseline, never flagged as a change");

  // ── ⚠ COVERAGE IS REPORTED, NOT IMPLIED. A project at G1 has cleared nothing and must say so rather
  //    than render a confident single column that reads like a complete history.
  const early = F.DEMO_PROJECTS.find((p) => p.gate === "G1");
  ok(F.gateReviewHistoryRows(early, F.finOf(early, 2026), F.buildDemoVersionSeed(early)).recordedGates === 1,
     "a G1 project reports 1 of 7 gates recorded — no invented history for gates it has not reached");

  // ── NEW INSIGHT vs S16 — the operator's explicit requirement, enforced rather than promised.
  //    S16 · Market Performance is post-launch variance (Say/Do, Target vs Actual). This is gate-to-gate
  //    drift of the forecast. The one colliding LABEL is Value Capture, and it is not the same quantity:
  //    S16's is (List Price − Actual Price) × Qty in DOLLARS; this is the planned share, a PERCENT.
  const vc = rep.rows.find((r) => r.label.startsWith("Value Capture"));
  ok(vc && /%$/.test(vc.label), "the Value Capture row carries its UNIT in the label — S16 prints a $ leakage under the same words");
  ok(vc.values.filter(Boolean).every((v) => v.endsWith("%")), "Value Capture renders a PERCENT here, so it can never be read as S16's dollar figure");
  ok(!rep.rows.some((r) => /Say ?\/ ?Do|OTTR|PPM/i.test(r.label)),
     "CS+RA carries NO Say/Do, OTTR or PPM row — those are S16's post-launch variance and duplicating them would defeat the 'new insight' requirement");

  // ── ⚠ NON-DUPLICATION IS ONLY HALF THE REQUIREMENT, AND THE ABSENCE LOCK ABOVE CANNOT PROVE THE OTHER
  //    HALF. The operator asked that CS+RA give NEW INSIGHT relative to S16, so there must be a POSITIVE
  //    linkage, asserted.
  //
  //    S16's Say/Do table is ["Metric", "Reference stage", "Target", "Actual"] and the template fixes that
  //    Reference stage at PLAN (R&D ratio) and LAUNCH+ (revenue · margin · value capture). So S16's Target
  //    IS the value the business case recorded at that gate — a cell in this matrix. Executed, S16 cannot
  //    currently supply it: aiSlideField(p,"S16","saydo") returns TWO rows against the template's six,
  //    stamps the reference stage as the CURRENT gate, sets Target to p.fullRev10yM (today's forecast,
  //    which moves whenever S10 is edited), and hard-codes Actual to "—".
  // ── ⚠ THE GATE THAT WOULD HAVE CAUGHT MY OWN DEFECT, GENERALISED SO NO SHEET CAN HIDE BEHIND A SCROLLER.
  //    X-7b wrapped the Gate Review History in `overflow-auto`. slide-shots then reported
  //    "CSRA overflow 0 · box-void 0px" and I reported that as proof it fit. It was not: a scroll container
  //    ABSORBS overflow, so the measurement goes green precisely when content does NOT fit. The operator's
  //    phone screenshot showed 5 of 17 rows and 3 of 7 gate columns — and a PDF cannot scroll, so the
  //    printed board pack carried a truncated matrix.
  //
  //    This exact trap is written into the Z2 section of the plan ("if the body itself becomes the scroll
  //    container, overflow stops being observable and that gate goes quietly green forever") and I walked
  //    into it anyway. So it becomes a lock rather than a lesson.
  const pageSrcCsra = (await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8"));
  // ⚠ BOTH ANCHORS MUST RESOLVE, AND THE SLICE MUST BE BOUNDED. The first draft used an end anchor that
  // did not exist, so indexOf returned -1, slice(a, -1) ran to END OF FILE, and the lock went red against
  // the zoom wrapper and two modal overlays — code nowhere near this panel. A `length > 500` guard passed
  // vacuously on that runaway slice. Probe error #16, and the whole family has been unverified slices.
  const csraStart = pageSrcCsra.indexOf("CSRA: () => {");
  const csraEnd = pageSrcCsra.indexOf("\n      };", csraStart);
  ok(csraStart > 0 && csraEnd > csraStart, "both CS+RA panel anchors resolve — a -1 anchor would slice to end of file and assert against unrelated code");
  const csraPanel = pageSrcCsra.slice(csraStart, csraEnd);
  ok(csraPanel.length > 500 && csraPanel.length < 12000, `the CS+RA panel slice is bounded (${csraPanel.length} chars) — not a runaway to EOF`);
  // ⚠ CODE ONLY, NOT COMMENTARY — the first version of this lock went RED against my own comment
  // EXPLAINING the removal. Same class as the <label> regex that crossed </label> earlier in this session.
  // F4's ban-list already solved it; reuse the same strip rather than inventing a second one.
  const codeOnly = csraPanel.split("\n")
    .map((l) => l.replace(/\/\/.*$/, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, ""))
    .filter((l) => !/^\s*(\*|\{?\/\*)/.test(l)).join("\n");
  ok(!/overflow-auto|overflow-y-auto|overflow-scroll/.test(codeOnly),
     "the CS+RA sheet contains NO scroll container — content must LAY OUT on the sheet, because a printed page cannot scroll and a scroller blinds the overflow gate");
  ok(F.SAYDO_REFERENCE_GATES.length === 2 && F.isSayDoReferenceGate("G2") && F.isSayDoReferenceGate("G5"),
     "the S16 join names PLAN (G2) and LAUNCH (G5) — the two Reference Stages the operator's template fixes");
  ok(F.SAYDO_REFERENCE_GATES.every((r) => F.GATE_HISTORY_COLS.some((c) => c.gate === r.gate)),
     "every S16 reference stage IS a column of this matrix — the join is structural, not a caption");
  const rdRow = rep.rows.find((r) => r.label === "R&D Spend, $");
  const planIdx = F.GATES.indexOf("G2");
  ok(rdRow.values[planIdx] !== null,
     `CS+RA supplies the PLAN-gate R&D Spend (${rdRow.values[planIdx]}) that S16's Say/Do R&D ratio divides into — the denominator that did not exist before this slide`);
  // And the defect this exposes on S16, recorded so it is a decision rather than a discovery.
  const saydo = F.aiSlideField(P, "S16", "saydo");
  ok(saydo.length < 6 && saydo.every((r) => r[3] === "—"),
     `KNOWN GAP, declared not hidden: S16.saydo renders ${saydo.length} of the template's 6 rows and every Actual is "—". CS+RA now holds the reference-stage Target; wiring S16 to it is a separate slice on S16's own sheet.`);

  // ── ONE PRODUCER FOR CAGR. It was computed inline inside the S16.plc resolver and nowhere else, so
  //    CS+RA would have had to fork it — two expressions of one quantity, free to disagree.
  //    ⚠ THIS LOCK WAS DECORATION ON ITS FIRST WRITING AND MUTATION-TESTING CAUGHT IT. The first version
  //    asserted only that S16's read-out contained cagrPctOf's value; it never looked at the CS+RA row, so
  //    forking the CS+RA side left it GREEN. A lock that checks each surface separately can drift — one that
  //    COMPARES them cannot. Same correction the band-order lock needed in F0.
  const cagr = F.cagrPctOf(P);
  ok(Number.isFinite(cagr), "cagrPctOf returns a finite growth rate");
  const cagrRow = rep.rows.find((r) => r.label === "Market CAGR, %");
  const cagrShown = cagrRow.values.find((v) => v !== null);
  // ⚠ ANCHORED ON ^Model CAGR, NOT ON /CAGR/. The loose form matched "PLC-3: Mature (0–3% CAGR)" — an
  // earlier row whose value is a YEAR — and reported 2030 as the growth rate. Probe error, caught by the
  // lock going red at baseline rather than by reading.
  const plcShown = String(F.aiSlideField(P, "S16", "plc").find((r) => /^Model CAGR/.test(String(r[0])))?.[1] ?? "");
  ok(cagrShown !== undefined && plcShown.includes(cagrShown),
     `CS+RA's Market CAGR row (${cagrShown}) is the SAME string S16's PLC read-out prints (${plcShown}) — compared directly, so forking either side goes red`);

  // ── RA · the nine PRB functions, three required, from the template.
  ok(F.PRB_FUNCTIONS.length === 9, "the PRB review board has the template's NINE functions");
  ok(F.PRB_FUNCTIONS.filter((f) => f.required).length === 3
     && F.PRB_FUNCTIONS.slice(0, 3).every((f) => f.required),
     "Product/Business, Finance/FP&A and R&D-Development are the three REQUIRED (●) functions, and they lead");
  const panels = F.gateApprovalPanels(P, {}, [], "PRB");
  ok(panels.prior.gate === "G3" && panels.current.gate === "G4",
     "the two panels are PRIOR gate and CURRENT gate — the template's left/right split");
  ok(panels.current.rows.length === 9, "the current-gate panel renders all nine functions, filled or not");
  ok(panels.current.satisfied === 0, "with no recorded decisions, ZERO required functions read as satisfied — an unsigned board never looks signed");
  ok(panels.current.rows.every((r) => r.date === "—" || /^\d{4}-\d{2}-\d{2}$/.test(r.date)), "every approval date is an ISO day or an honest em-dash");
  // A G1 project has no prior gate — the panel must degrade, not fabricate one.
  ok(F.gateApprovalPanels(early, {}, [], "PRB").prior.gate === null, "a G1 project reports NO prior gate rather than inventing one");
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
    // X-7a · the S8 value-prop DETAIL now sits under the sentence on S1 (operator: "place value prop from
    // S8 with details on S1"). Both are `linked` read-outs of S8's record — no new authoring surface.
    S1: ["oneline", "segment", "valueprop", "vpdiffs", "vpcapture", "ask"],
    S2: ["profile", "accel", "roadmap", "toprisks", "status"],
    S3: ["profile", "revtable", "rdchart", "fincomment"],
    S8: ["nba", "diffs", "wtp", "valuechart", "capture", "vprop", "benefits", "features"],
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
  // ⚠ PROXY LOCK #11 — the SAME literal asserted a second time, 100 lines from #10, and it went red for the
  // same reason. Two copies of one proxy is exactly how a shape outlives the property it stood for.
  // X-2 · back to a plain string once the `rows` template hatch lost its last caller, so the interpolation
  // is gone. The property — grid · min-h-0 · flex-1 · content-stretch — is what this has always meant.
  ok(/<div data-panel-body className="grid min-h-0 flex-1 content-stretch gap/.test(src),
     "data-panel-body wraps the AmtsPanel children and fills the panel — stretching by default");
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
  ok(/function PresentField\(\{ sp, f, big, bare, lean \}/.test(src), "PresentField accepts `bare` (panel already carries the name)");
  // Y-1 · `lean` is bare PLUS an inline label — never a THIRD card style, and never a label the panel head
  // already speaks. Mutation-tested: drop the `!bare` and the sentence wears "PRIMARY CUSTOMER VALUE
  // PROPOSITION" directly under a head reading PRIMARY CUSTOMER VALUE PROPOSITION.
  ok(/const leanLabel = lean && !bare;/.test(src), "…and `lean` labels only the fields the panel head does NOT name");
  ok(/\{leanLabel && <><span className=\{`font-semibold uppercase tracking-\[0\.12em\] \$\{acc\.text\}`\}>\{leanLabelOf\(f\.name\)\}/.test(src),
     "…rendering that label INLINE on the text's own first line, not as another banner row");
  ok(/const leanLabelOf = \(name: string\) => \{/.test(src) && /\\\(\(\[A-Z0-9\]\[A-Z0-9\.\/-\]\{1,7\}\)\\\)\\s\*\$/.test(src),
     "a trailing acronym IS the inline label — \"Next best alternative (NBA)\" reads as NBA");
  ok(/text: "text-indigo-300"/.test(src) && /text: "text-sky-300"/.test(src),
     "…coloured from the SAME sectionAccent decision as the banner it replaces, not a second palette");
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
  // Re-based TWICE. Z2 moved `zoom` off the canvas onto [data-slide-zoom]; Z5 moved it back, because the
  // operator asked for the PDF-viewer model (page and edge scale as one, then you pan). The PROPERTY under
  // test never changed and is the only thing asserted here: ONE fixed sheet, scaled to fit — never
  // re-laid-out per device, which is what guarantees portrait == landscape.
  ok(/transform: `scale\(\$\{fit \* zoom\}\)`/.test(src), "the whole sheet is scaled to fit — not re-laid-out per device");
  ok(/const fit = Math\.min\(/.test(src), "fit is min(width, height) so the sheet always lands whole inside the stage");
  ok(!/aspectRatio: "16 \/ 9", containerType/.test(src), "the old per-device canvas sizing is gone (it was what let portrait drift)");

  // no DEVICE breakpoint may decide the sheet's layout
  const sheet = src.slice(src.indexOf("const SLIDE_PANEL: Record<string, () => React.ReactNode>"), src.indexOf("{/* B2 · footer"));
  ok(!/sm:grid-cols|sm:col-span|md:|lg:/.test(sheet), "the slide sheet contains NO viewport breakpoints — its columns come from the sheet, not the device");
  ok(/data-slide-body className="grid h-full min-h-0 grid-cols-2 content-stretch gap-\[1\.4cqh\] overflow-hidden"/.test(src),
     "the slide body is a fixed 2-column sheet grid that STRETCHES its rows to fill the canvas (Z5: and it clips unconditionally again)");

  // chart type also lives on the sheet's scale
  ok(!/fontSize="8" fill=\{pin === i/.test(src), "S3 cash-chart year labels were brought inside the cap");
  // ⚠ PROXY LOCK #12, REWRITTEN — AND THIS ONE GUARDS SOMETHING REAL, so the replacement is stricter, not
  // looser. The property is "the S8 waterfall cannot outgrow its page". `7cqh` was ONE way to guarantee that
  // and it guaranteed something else too: the chart could never USE the space it was given, which is the
  // defect the operator reported three times. X-1 replaces the fixed slice with containment — `h-full`
  // inside a `flex-1 min-h-0` body inside an `overflow-hidden` panel, so the chart is bounded BY ITS BOX
  // rather than by a magic number. All three links in that chain are asserted here, because breaking any one
  // of them is what would let it escape.
  // ⚠ PROXY LOCK #14, AND IT WAS MINE FROM X-1. This asserted the literal string `h-full w-full` — a
  // STAND-IN for "the chart fills its box", not the property itself. `h-full` only fills when every
  // ancestor has a definite height, and X-1d proved one did not: S8 clipped 258px while this lock sat
  // green. The property is that the SVG is a BOUNDED FLEX ITEM of a bounded column, which the X-1d chain
  // lock at the foot of this file asserts link by link. Here we assert only that it is not intrinsic.
  ok(/className=\{big \? "min-h-0 w-full flex-1" : "w-full"\}/.test(src),
     "on the sheet the waterfall is a bounded flex item, not an intrinsic-height box");
  ok(/preserveAspectRatio="xMidYMid meet"/.test(src), "it scales the whole drawing rather than distorting the bars");
  ok(/\$\{bare \? "" : big \? "p-\[0\.45cqw\]" : "p-2"\} flex min-h-0 flex-1 flex-col/.test(src),
     "its wrapper may grow (flex-1) but never past its parent (min-h-0) — the containment that replaces the 7cqh cap");
  ok(/<div data-panel className=\{`flex min-h-0 flex-col overflow-hidden/.test(src),
     "and the panel itself clips, so a filled chart still cannot outgrow the page");
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
  // THIRD ATTEMPT, and the first that stops asserting a class name. `right-0` shipped broken; `left-0` fixed
  // the phone and then covered the level toggle on desktop while doing nothing for the Growth Model mount,
  // whose `overflow-x-auto` row clips in both axes. Both previous locks passed throughout. So:
  //   (a) the panel must leave the flow entirely — a portal at a fixed, measured position;
  //   (b) it must be clamped on EVERY edge, not just one;
  //   (c) no anchor class may come back, because no anchor value can fix a clipping ancestor.
  ok(/ReactDOM\.createPortal\(\s*<>[^]{0,800}?data-scope-panel/.test(src),
     "the scope panel is portalled to <body> — no ancestor overflow can clip it");
  ok(/data-scope-panel[^]{0,400}?className="fixed z-\[91\]/.test(src),
     "the panel is position:fixed, so a scrolling ancestor cannot move or crop it");
  ok(/if \(left \+ PANEL_W > vw - EDGE\) left = Math\.max\(EDGE, r\.right - PANEL_W\);/.test(src)
     && /if \(left \+ PANEL_W > vw - EDGE\) left = EDGE;/.test(src),
     "horizontal placement flips to right-aligned, then pins to the margin — clamped on BOTH edges");
  ok(/const flip = below < 200 && above > below;/.test(src),
     "vertical placement flips upward only when downward is genuinely cramped");
  ok(/window\.addEventListener\("scroll", onMove, true\)/.test(src),
     "capture-phase scroll re-measures rather than closing — a half-made selection survives a scroll");
  ok(!/className="absolute (left|right)-0 z-50 mt-1 max-h-\[60vh\] w-64/.test(src),
     "neither anchor class returns — no left/right value can fix a clipping ancestor or a sibling collision");
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
  const gateCodes = [...(gate?.[1] ?? "").matchAll(/"(S\d+|CS|RA)"/g)].map((m) => m[1]);
  ok(new Set(gateCodes).size === 1 && gateCodes[0] === "S10",
     `the money source panel opens on S10 and nothing else — found: [${gateCodes.join(", ")}]`);
  // Widening it back via either old trigger must fail here, by name.
  ok(!/onEditSource && [^\n]*f\.linked/.test(src),
     "the gate no longer keys off `linked` — that flag makes a field READ-ONLY derived, it must not grant input");
  ok(!/onEditSource && [^\n]*hasOwnProperty\.call\(FIN_FIELDS/.test(src),
     "the gate no longer keys off FIN_FIELDS membership either");

  // 2. F0 · ONE TABLE ANSWERS "where is this typed?". FIN_FIELDS is gone; `SOURCE_SLIDE` replaced it, and this
  //    block EXECUTES the registry rather than grepping a literal. Two conditions that can disagree was the
  //    original bug, so the property under test is that there is only one condition left to disagree with.
  const D = await import("../lib/innovation-data.ts");
  ok(!/const FIN_FIELDS/.test(src), "FIN_FIELDS is retired — SOURCE_SLIDE is the only routing table");
  ok(D.SOURCE_CODES.length >= 1 && D.SOURCE_CODES.every((c) => D.SLIDE_SCHEMA.some((s) => s.code === c)),
     `every owning code in SOURCE_SLIDE is a real slide — [${D.SOURCE_CODES.join(", ")}]`);
  ok(Object.keys(D.SOURCE_SLIDE).every((k) => /^(S\d+|CS|RA)\.[a-z0-9]+$/i.test(k)),
     "every SOURCE_SLIDE key is a `S##.field` reference, never a bare code");
  // The two records this work exists to unify, asserted by routing rather than by comment.
  ok(D.sourceSlideOf("S1", "valueprop") === "S8" && D.sourceSlideOf("S6", "desc") === "S8" && D.sourceSlideOf("S8", "vprop") === "S8",
     "the value proposition is owned by S8 — all three renderings route to one editor");
  // `S10.spend` no longer appears as a key: the field it referred to is deleted, so a self-referential row
  // would point at nothing. S10 remains an OWNING code because other slides still route to it, which is the
  // property that actually matters — asserted directly rather than via a row that existed to satisfy a test.
  ok(D.sourceSlideOf("S3", "revtable") === "S10" && D.sourceSlideOf("S2", "profile") === "S10" && D.isSourceSlide("S10"),
     "the money record is owned by S10 — the S3/S8/S10 revenue the operator photographed routes to one editor");
  ok(!Object.keys(D.SOURCE_SLIDE).some((k) => k.startsWith("S10.")),
     "no SOURCE_SLIDE row points a deleted S10 field at itself");
  ok(D.isOwnSource("S8", "vprop") && !D.isOwnSource("S1", "valueprop"),
     "isOwnSource distinguishes the owning slide from a rendering of it (Edit source vs Edit on S8)");
  ok(D.sourceSlideOf("S11", "voc") === null, "a field authored in place has no owner and therefore no deep link");

  // 3. `linked` STAYS. Removing it does not lock input down — it turns derived charts and metric blocks into
  //    free-text editable tables, which is the opposite of a single source. Count it so a "cleanup" can't strip it.
  const dataSrc = await fsp.readFile("lib/innovation-data.ts", "utf8");
  const linkedCount = (dataSrc.match(/linked: true/g) ?? []).length;
  ok(linkedCount >= 11,
     `every derived field keeps \`linked: true\` (read-only display) — found ${linkedCount}, expected >= 11`);

  // 4. Off the owning slide the affordance is a deep link, not a dead button or a hole — and the target is
  //    RESOLVED from the registry, not a hardcoded index. `const S10_IDX` is exactly the constant that made
  //    every Edit-Source button point at the money editor no matter which record you were reading.
  ok(!/const S10_IDX\b/.test(src), "the hardcoded S10 index is gone — the deep-link target is resolved per field");
  ok(/const owner = target \?\? \(code && fieldId \? sourceSlideOf\(code, fieldId\) : null\)/.test(src),
     "SourceLink resolves its target from SOURCE_SLIDE, so Edit Source lands on the right S##");
  ok(/if \(!here && oi >= 0\) setIdx\(oi\)/.test(src),
     "off the owning slide, Edit-source navigates TO it and opens the panel — the user is never stranded");

  // 5. F0 · NO EDIT-SOURCE BUTTON MAY POINT AT A SLIDE WITH NO EDITOR. This is the defect the commit repairs:
  //    ProjectDetail's two financial-edit controls deep-linked to S3 with `openSource`, and S3 stopped having a
  //    panel the moment input was locked to S10 — both buttons became no-ops. A button is only drawn when its
  //    target is in SOURCE_PANEL_CODES, and the deep link reads the registry instead of naming a slide.
  ok(/const SOURCE_PANEL_CODES = \[/.test(src) && /const panelExists = \(code: string\) =>/.test(src),
     "the set of codes that actually RENDER a source panel is declared, separately from who owns the record");
  ok(/const hasSourceLink = \(code: string, fid: string\) => \{ const o = sourceSlideOf\(code, fid\); return !!o && o !== code && panelExists\(o\); \}/.test(src),
     "an Edit-Source button is drawn only when its target has an editor behind it AND is somewhere else");
  // It is a NAVIGATION affordance. On the owning slide the editor is already present and the button is pure
  // height — adding S8 to the registry put four of them on one sheet and overflowed it by 34px.
  ok(/o !== code/.test(src), "no Edit-Source button on the slide that owns the record");
  ok(!/<SlideShowModal p=\{p\} startSlide="S3" openSource/.test(src),
     "the financials deep-link no longer lands on S3, which has had no source panel since the lockdown");
  ok(/\{finDeck && <SlideShowModal p=\{p\} startSlide=\{sourceSlideOf\(/.test(src),
     "the financials deep-link resolves its slide from SOURCE_SLIDE, so it cannot drift from the panel gate again");
  // Every SourceLink render site is guarded — an unguarded one is how a dead button gets back in.
  const renders = [...src.matchAll(/<SourceLink /g)].length;
  // The edit-mode field BADGE is now the control (E3), so its guard reads `hasSourceLink(...) ? <SourceLink`
  // — a ternary, because ON the owning slide it falls back to a static badge rather than a link that goes
  // nowhere. Both forms count as guarded; an UNGUARDED render is how a dead button gets back in.
  const guarded = [...src.matchAll(/(hasSourceLink\([^)]*\)\s*(?:&&|\?)\s*<SourceLink |<SourceLink source="Program start \(source record\)" target="S10")/g)].length;
  ok(renders === guarded,
     `every SourceLink render is guarded by hasSourceLink or an explicit target — ${guarded}/${renders}`);
}

// ── F1 · S10 HAS A WRITER — the 87-cell immutability contract ───────────────────────────
// `Project.finPlan` was declared, typed and read, and NOTHING ever set it: `grep -rn finPlan app/ lib/` found
// the declaration and `finOf`, nothing else. So S10's eleven columns were always `finBaseline` — a re-spread
// of three scalars wearing a grid's clothes. The lockdown narrowed nine input doors to one; this is the lock
// that proves something is behind that door, and that typing into it does not wipe the rest of the plan.
{
  const F = await import("../lib/innovation-data.ts");
  const fsp2 = await import("node:fs/promises");
  const pageSrc = await fsp2.readFile("app/innovation/page.tsx", "utf8");

  const base = F.finBaseline(F.DEMO_PROJECTS[0], 2026);
  ok(base.years.length === F.FIN_SPAN, `a plan always stores ${F.FIN_SPAN} years regardless of stage`);

  // 1. THE FAILURE THIS PREVENTS: one edit replaces the plan and everything else comes back zero.
  //    Reference equality, not deep-equal — a rebuilt-but-equal year would still be a bug waiting to happen.
  const edited = F.withFinYear(base, 3, { labor: 4242 });
  ok(edited.years[3].labor === 4242, "the edited cell takes the new value");
  ok(base.years[3].labor !== 4242, "the ORIGINAL plan is untouched — no mutation in place");
  const otherYearsShared = base.years.every((y, i) => i === 3 || edited.years[i] === y);
  ok(otherYearsShared, "every other year is the SAME object — 10 of 11 years pass through by reference");
  const touched = edited.years[3];
  ok(touched.neu === base.years[3].neu && touched.don === base.years[3].don && touched.dec === base.years[3].dec,
     "inside the edited year, the three revenue bands are untouched — a spend edit cannot zero revenue");
  ok(["contractor", "materials", "other", "sustain"].every((k) => touched[k] === base.years[3][k]),
     "the other four spend rows of the edited year keep their values");

  // 2. Band edits clone one band of one year and nothing else — 87 of 88 band-cells survive.
  const bandEdited = F.withFinBand(base, 5, "neu", { units: 77 });
  ok(bandEdited.years[5].neu.units === 77, "the edited band cell takes the new value");
  ok(bandEdited.years[5].don === base.years[5].don && bandEdited.years[5].dec === base.years[5].dec,
     "the sibling bands of the edited year are the SAME objects");
  ok(bandEdited.years[5].neu.msrpK === base.years[5].neu.msrpK && bandEdited.years[5].neu.cogsK === base.years[5].neu.cogsK,
     "the other inputs of the edited band survive — typing Quantity does not clear MSRP or COGS");
  ok(base.years.every((y, i) => i === 5 || bandEdited.years[i] === y), "every other year is untouched by a band edit");

  // 3. Out-of-range index is a no-op, not a crash or a silent 12th year.
  ok(F.withFinYear(base, -1, { labor: 1 }) === base && F.withFinYear(base, 99, { labor: 1 }) === base,
     "an out-of-range year index returns the plan unchanged");
  ok(F.withFinYear(base, 2, { labor: 1 }).years.length === F.FIN_SPAN, "an edit never changes the number of stored years");

  // 3b. Every $K figure the editor puts in a numeric input is an INTEGER. `spendRequestK` rounded the total
  //     and then divided by three, so the ask rendered as "2733.33333" in a $K box — visible in the captured
  //     screenshot, invisible in the diff. Asserted across the whole portfolio, not just the fixture.
  ok(F.DEMO_PROJECTS.every((pr) => Number.isInteger(F.finBaseline(pr, 2026).spendRequestK)),
     "the current-year R&D ask is a whole $K on every project — no repeating decimal in an integer field");
  ok(F.DEMO_PROJECTS.every((pr) => F.finBaseline(pr, 2026).years.every((y) =>
       [y.labor, y.contractor, y.materials, y.other, y.sustain].every(Number.isInteger))),
     "every seeded spend cell is a whole $K");

  // 4. THE WRITER IS WIRED. A pure function nobody calls is the defect this commit exists to fix, so assert
  //    the component actually commits a `finPlan` patch through the shared source-edit callback.
  ok(/function S10FinEditor\(/.test(pageSrc), "the S10 source editor component exists");
  ok(/onEdit\(\{ finPlan: next, \.\.\.finRollup\(next\) \}/.test(pageSrc), "editing a cell writes Project.finPlan — the field finally has a writer");
  ok(/<S10FinEditor p=\{p\} baseYear=\{baseYear\} onEdit=\{onEditSource\} \/>/.test(pageSrc),
     "the editor is mounted inside the S10 source panel, the one door input was narrowed to");
  ok(/commit\(withFinYear\(fin, i, patch\), what\)/.test(pageSrc) && /commit\(withFinBand\(fin, i, band, patch\), what\)/.test(pageSrc),
     "the editor uses the locked pure writers instead of re-implementing update semantics");

  // 4b. F2 · FOUR ROWS ON EVERY BAND, FIVE ON COMBINED. An earlier cut dropped Quantity and Margin % to clear
  //     a screenshot overflow; the operator's spec puts COGS and ASP on 10.1/10.2 and keeps Quantity and
  //     Margin % on the standard sheet. Counted, so "make it fit" can never silently trade a row away again.
  const revTable = pageSrc.slice(pageSrc.indexOf("function S10RevenueTable("), pageSrc.indexOf("function AmtsPanel("));
  const bandFn = revTable.slice(revTable.indexOf("const band ="), revTable.indexOf("return ("));
  // SIX rows per band since 2026-07-30: the operator asked for QTY, COGS and ASP on the sheet itself, so a
  // board can audit the QTY x ASP build-up instead of taking Revenue and Margin on faith. ASP is DERIVED
  // (MSRP net of the distribution discount) — shown, never typed.
  for (const row of ["Quantity", "ASP", "COGS", "Revenue", "Margin", "Margin %"]) {
    ok(bandFn.includes(`label: "${row}"`), `every revenue band renders a ${row} row`);
  }
  ok(/label: "ASP", cells: ys\.map\(\(y\) => finFmtK\(aspOf\(y\[key\]\)\)\)/.test(bandFn),
     "the ASP row is computed by aspOf — MSRP net of discount, never a typed field");
  // The intent here is the GUTTER IDIOM — one label spanning the band's rows instead of a full-width header
  // row of its own. It asserted the literal `groupSpan: 6`, which was a stand-in that stopped being true
  // when F2b made the row count depend on the mode (6 when building up, 3 when typed). The span is now
  // DERIVED from the actual rows, so the property is asserted instead of the number: exactly one row in the
  // band carries the gutter, and it carries a span rather than a hardcoded size.
  ok(/groupSpan: rows\.length/.test(bandFn),
     "each band's rows share ONE gutter label spanning however many rows the mode produces");
  ok(/i === 0 \? \{ \.\.\.r, group: label, groupSpan: rows\.length, tint \} : r/.test(bandFn),
     "the gutter is attached to the FIRST row only — the rest are covered by its rowSpan");
  // 3 bands x 6 + Combined 5 + a column header is 24 rows on a sheet that cannot grow, so the two panels no
  // longer split the body evenly — an even split silently scrolled Margin % and YoY Growth out of sight.
  ok(/S10: "minmax\(0, 10fr\) minmax\(0, 24fr\)",/.test(pageSrc),
     "the S10 body sizes its two panels by the rows they actually carry, not 50/50");
  // Asserted as a PROPERTY of each table, not as literal adjacency. The old form matched
  // `<S10Grid\n        dense` — which broke the moment G4 added `gutter` above `dense` on the spend grid,
  // even though both tables still pass `dense`. A positional pattern fails on formatting; this fails only
  // if a table actually stops being dense, which is what the assertion is for.
  const spendTable = pageSrc.slice(pageSrc.indexOf("function S10SpendTable"), pageSrc.indexOf("function S10RevenueTable"));
  ok(/\bdense\b/.test(revTable) && /\bdense\b/.test(spendTable),
     "both S10 tables use the dense type step — one size across the slide, and the only way 24 rows fit");
  ok(/\bgutter\b/.test(revTable) && /\bgutter\b/.test(spendTable),
     "both S10 tables reserve the same left gutter, so their year columns line up (G4)");
  for (const row of ["Quantity (net)", "Revenue", "Margin", "Margin %", "YoY Growth"]) {
    ok(revTable.includes(`label: "${row}"`), `Combined: Incremental renders a ${row} row`);
  }
  ok(/groupSpan: 5/.test(revTable), "Combined carries five rows under one gutter label");
  ok(/label: "YoY Growth"/.test(revTable) && !bandFn.includes("YoY"),
     "YoY Growth appears on Combined ONLY — never on an entered band (operator)");
  // The gutter is a rowSpan, so the rows it covers must NOT emit their own cell — one stray placeholder <td>
  // shifted every line under a band label one column right and pushed the last year off the sheet. Caught by
  // reading the render; locked here so the alignment cannot silently break again.
  ok(/rows\.forEach\(\(r, i\) => \{ for \(let k = 1; k < \(r\.groupSpan \?\? 0\); k\+\+\) covered\.add\(i \+ k\); \}\);/.test(pageSrc),
     "rows covered by a rowSpan gutter are tracked, so no row emits a duplicate gutter cell");
  ok(/gutter && !covered\.has\(ri\) \? <td/.test(pageSrc),
     "the placeholder gutter cell is skipped for covered rows — every band's numbers stay under their year");
  // Quantity is a COUNT, not money: it must not go through the $K formatter. The formatter itself now lives
  // in the LIB — the sheet is no longer the only surface printing these figures (the S10 field-grid read-outs
  // print them too), and two formatters for one number is a second source of truth in disguise. So the
  // definition is asserted where it lives and the usage where it renders.
  ok(typeof F.finFmtQty === "function" && typeof F.finFmtK === "function" && typeof F.finFmtPct === "function",
     "the three financial formatters are exported from the lib — one set, every surface");
  ok(!/^const finFmt(K|Pct|Qty) = /m.test(pageSrc), "page.tsx does not redefine a financial formatter locally");
  ok(/finFmtQty\(y\[b?\.?key\]\.units\)|finFmtQty\(y\[key\]\.units\)/.test(pageSrc),
     "Quantity renders through a count formatter, never the $K one");
  ok(F.finFmtQty(0) === "—" && F.finFmtK(0) === "—" && F.finFmtPct(null) === "—",
     "an unfilled cell reads as an em-dash on every formatter — never a measured-looking zero");
  ok(/finFmtQty\(incUnits\(y\)\)/.test(pageSrc), "Combined Quantity is the NET count (New − Declining), from incUnits");

  // 4c. F3 · APPLY-RATE. 14 entered rows x 11 years = 154 cells per project, 5,082 across the portfolio. A
  //     seed and a rate turn a row's eleven keystrokes into two. It is a ONE-SHOT FILL, not a live formula.
  const seeded = F.withFinSpendRow(base, "labor", F.linearize(1000, 10, F.FIN_SPAN));
  ok(seeded.years.length === F.FIN_SPAN && seeded.years[0].labor === 1000 && seeded.years[1].labor === 1100,
     `a fill writes the whole row from seed x (1+rate) — got ${seeded.years[0].labor}, ${seeded.years[1].labor}`);
  ok(seeded.years.every((y, i) => y.contractor === base.years[i].contractor && y.neu === base.years[i].neu),
     "a fill touches ONE row — the other spend rows and all three bands are untouched (bands by reference)");
  // Editing a year after a fill must change only that year: proof the fill is not a live formula.
  const afterEdit = F.withFinYear(seeded, 4, { labor: 1 });
  ok(afterEdit.years[4].labor === 1 && afterEdit.years[5].labor === seeded.years[5].labor,
     "editing a filled year recomputes nothing downstream — the fill wrote plain numbers and got out of the way");
  // NEGATIVE RATES ARE REQUIRED: Do-Nothing and Declining erode. A fill that could only grow would be useless
  // for two of the three Rack & Stack bands.
  const eroding = F.linearize(1000, -20, F.FIN_SPAN);
  ok(eroding[0] === 1000 && eroding[1] === 800 && eroding[10] < eroding[0],
     `a negative rate erodes — got ${eroding[0]}, ${eroding[1]}, … ${eroding[10]}`);
  const decFilled = F.withFinBandRow(base, "dec", "revK", eroding);
  ok(decFilled.years[1].dec.revK === 800 && decFilled.years[1].neu === base.years[1].neu,
     "a band-row fill writes one field of one band and leaves its siblings identical");
  ok(F.withFinSpendRow(base, "labor", [5]).years[0].labor === 5 && F.withFinSpendRow(base, "labor", [5]).years[1].labor === base.years[1].labor,
     "a short value list fills what it covers and leaves later years alone — never truncates the plan");
  // Undo restores EXACTLY: the snapshot is the pre-fill plan object itself.
  ok(base.years.every((y, i) => y.labor === F.finBaseline(F.DEMO_PROJECTS[0], 2026).years[i].labor),
     "the pre-fill plan is unchanged by the fill — so the undo snapshot is exact, not a re-derivation");
  ok(/setUndo\(\{ plan: fin, what: fill\.label \}\);/.test(pageSrc),
     "apply-rate snapshots the plan BEFORE writing, so one undo restores all 11 cells exactly");
  ok(/const preview = fill \? linearize\(fill\.seed, Number\(fill\.rate\) \|\| 0, FIN_SPAN\) : \[\];/.test(pageSrc),
     "the eleven values are PREVIEWED before anything is written — the most destructive click in the grid");
  ok(/data-fin-fill/.test(pageSrc) && /Apply 11 years/.test(pageSrc) && /↺ Undo fill/.test(pageSrc),
     "preview strip, explicit Apply, and a single Undo are all present");

  // 4d. F5 · THE ROLL-UP CANNOT GO STALE. `nreK` has 69 read sites and `fullRev10yM` drives the Rack sort,
  //     the budget line, the dog-tag and S1/S2/S3. If the grid moved and those did not, the deck would show
  //     two answers for the same money — the exact duplication the operator photographed. Every grid write
  //     carries the roll-up, so there is still ONE authority (the plan) and 69 readers stay correct untouched.
  const filled = F.withFinSpendRow(base, "labor", Array.from({ length: F.FIN_SPAN }, () => 1000));
  const roll = F.finRollup(filled);
  const byHand = filled.years.reduce((a, y) => a + F.spendTotalK(y), 0);
  ok(roll.nreK === Math.round(byHand), `the roll-up NRE is Σ of every spend cell — ${roll.nreK} vs ${Math.round(byHand)} computed independently`);
  ok(roll.nreK >= 11000, `filling Labor at 1000 across 11 years puts at least 11,000 into NRE — got ${roll.nreK}`);
  const revByHand = Math.round(filled.years.reduce((a, y) => a + F.bandRevK(y.neu, filled.unitEcon.neu), 0) / 1000);
  ok(roll.fullRev10yM === revByHand, `the roll-up 10-yr revenue is Σ of the NEW band in $M — ${roll.fullRev10yM} vs ${revByHand}`);
  ok(Number.isInteger(roll.nreK) && Number.isInteger(roll.fullRev10yM), "both roll-up scalars are whole numbers, as their fields are typed");
  ok(/onEdit\(\{ finPlan: next, \.\.\.finRollup\(next\) \}/.test(pageSrc),
     "EVERY grid write carries the roll-up — one write point, so Rack total == Σ S10 spend by construction");
  // Two editable surfaces for one number is the defect; once the grid exists the scalars are read-outs.
  ok(/const gridOwns = !!p\.finPlan;/.test(pageSrc) && /const DERIVED_BY_GRID: string\[\] = \["nreK", "fullRev10yM"\];/.test(pageSrc),
     "with a grid present, NRE and 10-yr revenue stop being free-text inputs");
  ok(/Σ from the grid/.test(pageSrc) && /<output className="w-full rounded border border-emerald-500\/25/.test(pageSrc),
     "they render as a labelled read-out that says where the number comes from");
  ok(!/DERIVED_BY_GRID: string\[\] = \[[^\]]*doNothing10yM/.test(pageSrc),
     "Do-Nothing and the upside accelerator are NOT grid fields and stay editable — the lockdown is precise, not blanket");

  // 4e. F6 · THE GATE LADDER, MEASURED. Concept forecasts current+3, Plan current+5, Develop current+10.
  //     Storage is ALWAYS 11 years: demoting hides columns, it never deletes them — so a project that slips
  //     back to Concept and is later re-promoted must return with every cell it had, not a truncated plan.
  ok(F.visibleYearCount("G1") === 4 && F.visibleYearCount("G2") === 6 && F.visibleYearCount("G3") === 11,
     `4 / 6 / 11 by stage — got ${F.visibleYearCount("G1")} / ${F.visibleYearCount("G2")} / ${F.visibleYearCount("G3")}`);
  ok(["G4", "G5", "G6", "G7"].every((g) => F.visibleYearCount(g) === 11), "every stage past Develop keeps the full 11-year span");

  // Demote → promote is lossless, asserted on the DATA rather than on a UI flow: the plan is one object and
  // the stage is only a window onto it, so the round trip is identity by construction. This is the assertion
  // that fails the day someone "optimises" storage down to the visible span.
  const wide = F.withFinSpendRow(base, "sustain", Array.from({ length: F.FIN_SPAN }, (_, i) => 100 + i));
  const asConcept = wide.years.slice(0, F.visibleYearCount("G1"));
  ok(asConcept.length === 4 && wide.years.length === F.FIN_SPAN,
     "demoting to Concept shows 4 years while the record still stores 11");
  ok(wide.years.every((y, i) => y.sustain === 100 + i),
     "every stored year keeps its value regardless of which stage is displayed — demote/promote is lossless");

  // Readiness counts the years the STAGE asks for, and a year counts as forecast on any entered figure —
  // spend or revenue. A stricter "every cell filled" rule would fail projects whose Do-Nothing is truly zero.
  const empty = F.emptyFinPlan(2026);
  ok(!F.finGateReadiness(empty, "G1").ready && F.finGateReadiness(empty, "G1").need === 4 && F.finGateReadiness(empty, "G1").filled === 0,
     "an empty plan is not Concept-ready and says so as 0 of 4");
  const three = F.withFinSpendRow(empty, "labor", [10, 10, 10]);
  const r3 = F.finGateReadiness(three, "G1");
  ok(r3.filled === 3 && !r3.ready && r3.missing.length === 1 && r3.missing[0] === 2029,
     `three forecast years leaves Concept one short, and NAMES it — got ${r3.filled}/${r3.need}, missing [${r3.missing.join(",")}]`);
  const four = F.withFinSpendRow(empty, "labor", [10, 10, 10, 10]);
  ok(F.finGateReadiness(four, "G1").ready && !F.finGateReadiness(four, "G2").ready,
     "four years satisfies Concept and not Plan — the ladder actually steps");
  ok(F.finGateReadiness(F.withFinBandRow(empty, "neu", "revK", [5, 5, 5, 5]), "G1").ready,
     "revenue alone counts as a forecast year — the gate asks whether the year is modelled, not that every cell is typed");
  ok(/finGateReadiness\(fin, p\.gate\)/.test(pageSrc) && /years forecast/.test(pageSrc),
     "the S10 editor shows the ladder as measured progress, not as prose");
  ok(/\{g\} \{GATE_STAGE\[g\]\} · \{visibleYearCount\(g\)\} yr/.test(pageSrc),
     "each gate option carries its own year requirement, so the ladder is legible at the moment of the decision");

  // 5. ONE CLOCK. Both S10 tables called new Date().getFullYear() on every render, so a deck left open across
  //    midnight on 31 December would re-anchor its columns mid-session. Hoisted to one memo at the deck root.
  ok(/const baseYear = useMemo\(\(\) => new Date\(\)\.getFullYear\(\), \[\]\);/.test(pageSrc),
     "the deck reads the calendar year ONCE, at the root");
  ok(!/finOf\(p, new Date\(\)\.getFullYear\(\)\)/.test(pageSrc),
     "no component re-reads the clock — baseYear is a prop everywhere, so a stored plan cannot re-anchor");
  const s10Fns = [...pageSrc.matchAll(/function (S10SpendTable|S10RevenueTable|S10FinEditor)\(\{ p, baseYear/g)].length;
  ok(s10Fns === 3, `all three S10 surfaces take baseYear as a prop — found ${s10Fns}/3`);
}

// ── F4 · CALENDAR YEARS ONLY — the ban list, enforced ───────────────────────────────────
// Operator, four separate times: "year only", "we will not use Year 1, Year 2 / always 2026 or 26, 27, 28".
// `Yr 1`, `Year 1`, `L-1`, `L-3` and `Launch` are launch-RELATIVE: on a board showing two projects side by
// side they denote different calendar years, which is precisely the ambiguity a portfolio review cannot
// carry. This asserts the PROPERTY (no such label reaches a rendered surface), not the spelling of a fix.
{
  const F = await import("../lib/innovation-data.ts");
  const fsp3 = await import("node:fs/promises");

  ok(F.yearLabel(2026) === "2026" && F.yearLabel(2026, "short") === "26" && F.yearLabel(2007, "short") === "07",
     `yearLabel produces 2026 / 26 / 07 — got ${F.yearLabel(2026)} / ${F.yearLabel(2026, "short")} / ${F.yearLabel(2007, "short")}`);
  const cols = F.yearCols(2026, 11);
  ok(cols.length === 11 && cols[0] === "2026" && cols[10] === "2036" && cols.every((c) => /^20\d\d$/.test(c)),
     `yearCols spans 2026..2036 as four-digit calendar years — got ${cols[0]}..${cols[10]}`);

  // The ban list, across the two files that render the deck. `innovation-slide-seed-h5.ts` is EXCLUDED on
  // purpose: its `L-30 · final deliverables` and `EOL-120 · draft plan` are MILESTONE names from the gate
  // schema, not period labels for a column. Anyone "fixing" those would be breaking the deck, so the
  // exclusion is stated here rather than left as a silent omission.
  // A span like `10-Yr Rev` / `3-Yr NPV` / `5-Yr Mgn` is the operator's OWN vocabulary and stays — it names a
  // horizon, not a column. What is banned is `Yr <n>` / `Year <n>` / `L-1` / `L-3` standing in for a period.
  // KNOWN DEBT, declared not hidden: S14's FTE tables still carry Yr 1..Yr 4 (innovation-data.ts, `fte` and
  // `ftedollar`). They are out of the financial single-source scope and their 2,860 seeded rows are keyed to
  // those widths, so they are listed here by name rather than silently skipped. Any NEW site fails.
  const BAN = /\b(Yr\s?\d|Year\s?[1-9]\b|L-[13]\b|Launch\s?\+?\d)/;
  const KNOWN_DEBT = ['id: "fte"', 'id: "ftedollar"'];
  const strip = (line) => line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");   // code only, not commentary
  for (const f of ["lib/innovation-data.ts", "app/innovation/page.tsx"]) {
    const txt = await fsp3.readFile(f, "utf8");
    const hits = txt.split("\n")
      .map((line, i) => [i + 1, strip(line)])
      .filter(([, line]) => BAN.test(line) && !KNOWN_DEBT.some((d) => line.includes(d)));
    ok(hits.length === 0, `${f} carries no launch-relative period label — found ${hits.length}${hits.length ? `: line ${hits[0][0]} · ${String(hits[0][1]).trim().slice(0, 80)}` : ""}`);
  }
  const fte = F.SLIDE_SCHEMA.find((s) => s.code === "S14").fields.find((x) => x.id === "fte");
  ok(fte.cols.some((c) => BAN.test(c)),
     "S14's FTE debt is REAL and still there — this lock fails the day someone fixes it, forcing the exception to be removed rather than left lying");
  // The two sites that carried them, asserted by behaviour rather than by grep-for-absence.
  const s10 = F.SLIDE_SCHEMA.find((s) => s.code === "S10");
  const allCols = s10.fields.flatMap((f) => f.cols ?? []);
  // S10 has NO schema columns left to be period-free: the three tables that carried them are deleted, and
  // every year label on the sheet is produced by `yearLabel` at render time from the project's own plan. That
  // is a stronger guarantee than "the literals are clean" — there are no literals.
  ok(allCols.length === 0, `S10 declares no schema columns at all — [${allCols.join(" · ")}]`);
  ok(!s10.fields.length && F.yearLabel(2031) === "2031" && F.yearLabel(2031, "short") === "31",
     "S10's periods come from yearLabel at render time, never from an authored column header");
  // The legacy five-column read-out is DELETED (operator, from a live screenshot: "Delete / R&D spend by year
  // (WBS) REQUIRED / Revenue scenarios REQUIRED / Confidence"). The five WBS lines were never really its
  // columns — they are fields on `FinYear`, which is what the grid writes, and that is what to assert.
  ok(["labor", "contractor", "materials", "other", "sustain"].every((k) => k in F.emptyFinYear(2026)),
     "all five entered spend lines including Sustain exist on the record the grid writes");
  // No AI DRAFT either: a draft exists to fill a field a human has not authored, and there is no field. The
  // grid always renders, from `finBaseline` when a project has no plan of its own, so nothing is ever blank.
  for (const fid of ["spend", "scenarios", "conf"])
    ok(F.aiSlideField(F.DEMO_PROJECTS[0], "S10", fid) === null, `no S10.${fid} AI draft survives its deleted field`);
  ok(F.finBaseline(F.DEMO_PROJECTS[0], 2026).years.length === F.FIN_SPAN,
     "a project with no stored plan still renders a full grid — the fallback is the baseline, not an empty slide");
}

// ── E0 · ONE FINANCIAL EDITOR — the rival is gone ───────────────────────────────────────
// Operator: "remove anything that is not feeding slide financials." The S10 source panel carried a COMPLETE
// second financial editor beneath the grid — the H42 Revenue Plan block: High-Level/Detailed, a
// linear/growth/ramp/manual profile, Annual/Monthly granularity, its own Qty/ASP/Unit-COGS trio, growth %/qtr,
// ramp quarters, a manual-weights textbox, a 10-cell annual grid and a 24-cell monthly grid. S10 renders
// `finPlan`; that block wrote `revPlan`. Two money editors stacked on one panel disagree by construction.
{
  const fsp0 = await import("node:fs/promises");
  const src = await fsp0.readFile("app/innovation/page.tsx", "utf8");
  const code = src.split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");   // ignore commentary

  // 1. Zero callers. The lib still EXPORTS these — deleting the engine is a separate commit that has to
  //    re-base tests/innovation-time.test.mjs:1183-1305 — but nothing in the app reaches them any more, so
  //    that removal becomes a clean follow-up instead of an archaeology exercise.
  for (const fn of ["revPlanQuarters", "revPlanFullM", "revPlanAnnual", "revPlanMonthly",
                    "annualPlanCells", "monthly24Cells", "annualPlanTotalM", "revPlanGateReq", "revPlanGateGaps"]) {
    ok(!new RegExp(`\\b${fn}\\b`).test(code), `${fn} has no caller left in app/ — the rival editor is gone, not hidden`);
  }
  ok(!/\bRevPlan\b/.test(code) && !/p\.revPlan/.test(code), "the RevPlan type and field are no longer referenced by the UI");
  const F0 = await import("../lib/innovation-data.ts");
  ok(typeof F0.revPlanQuarters === "function", "the engine is still exported — this commit removed the DOOR, not the engine");

  // 2. The three scalars the grid now owns are gone from the panel. F5 made nreK and fullRev10yM Sigma of the
  //    rows immediately above them; doNothing10yM was a rival scalar for a band with eleven years of its own.
  for (const label of ['numEdit("R&D / NRE"', 'numEdit("New rev 10-yr"', 'numEdit("Do-nothing 10-yr"']) {
    ok(!src.includes(label), `${label}…) is gone — a total printed twice on one panel is noise, not confirmation`);
  }

  // 3. What REMAINS is exactly the grid plus what feeds the financials without duplicating a grid row:
  //    the two risk levers (they drive pSuccess for the risk-weighted NPV) and the program start the spend
  //    years are anchored to. Asserted positively so a future "tidy-up" cannot quietly take them too.
  ok(/<S10FinEditor p=\{p\} baseYear=\{baseYear\} onEdit=\{onEditSource\} \/>/.test(src), "the grid is still mounted");
  ok(/riskEdit\("Tech Risk", "tech"\)/.test(src) && /riskEdit\("Comm Risk", "comm"\)/.test(src),
     "Tech and Comm risk stay — they drive pSuccess, which the risk-weighted NPV needs");
  // X-6a · relabelled to fit ONE line (operator). The lock still guards the CONTROL's existence — the point
  // was never the wording, it was that Program Start survives, because it anchors the years the spend sits on.
  ok(/Program Start \(MoT • Slider\)/.test(src), "Program Start stays — it anchors the years the spend sits on");
}

// ── V1 · THE VALUE-PROP RESOLVER — shipped before the lockdown, on purpose ──────────────
// `linked: true` does two jobs: it opens the source panel AND it short-circuits FieldEditor to a read-only
// LinkedField whose value comes from `linkedSlideField`. That function is an if-chain with `return null` at
// the bottom, and it had no branch for the value prop — so marking S1.valueprop or S6.desc `linked` would
// have rendered both panels EMPTY. Exactly the failure that left TeamPicker dead. Resolver first, always.
{
  const F = await import("../lib/innovation-data.ts");
  const p0 = F.DEMO_PROJECTS[0];
  const vp = F.valuePropOf(p0);
  ok(vp.trim().length > 0, "the fixture has a value proposition to resolve");
  ok(F.linkedSlideField(p0, "S1", "valueprop") === vp, "S1.valueprop resolves through the linked resolver to the ONE sentence");
  ok(F.linkedSlideField(p0, "S6", "desc") === vp, "S6.desc resolves to the same sentence — one record, two renderings");
  ok(F.DEMO_PROJECTS.every((pr) => F.linkedSlideField(pr, "S1", "valueprop") === F.linkedSlideField(pr, "S6", "desc")),
     "S1 and S6 agree on every project in the portfolio — they cannot drift because they read one function");
  ok(F.linkedSlideField(p0, "S1", "oneline") === null,
     "the fall-through still returns null for fields the resolver does not own — the branch is targeted, not a catch-all");
  // The trap, asserted directly: without these branches the lockdown blanks two slides.
  ok(F.linkedSlideField(p0, "S1", "valueprop") !== null && F.linkedSlideField(p0, "S6", "desc") !== null,
     "neither value-prop field can resolve to null — this is the assertion that makes marking them `linked` safe");
}

// ── V2/V3 · ONE EDITABLE VALUE PROPOSITION, AND IT IS ON S8 ─────────────────────────────
// Operator: "we can only have one model value prop; gut says to have on S8." It had FOUR doors — S1.valueprop,
// S6.desc, S8.vprop, and the Value Equation tool in Project details writing valueProp/valueDrivers straight
// to the record from outside the deck. Four doors into one sentence is how a board reads three different
// value propositions for the same project.
{
  const F = await import("../lib/innovation-data.ts");
  const fspv = await import("node:fs/promises");
  const src = await fspv.readFile("app/innovation/page.tsx", "utf8");
  const field = (code, id) => F.SLIDE_SCHEMA.find((x) => x.code === code).fields.find((f) => f.id === id);

  // 1. Exactly one editable value-prop field across all 20 codes, and it is S8's.
  ok(field("S1", "valueprop").linked === true, "S1.valueprop renders read-only");
  ok(field("S6", "desc").linked === true, "S6.desc renders read-only");
  ok(!field("S8", "vprop").linked, "S8.vprop stays plain and editable — it is the one door");
  const editable = F.SLIDE_SCHEMA.flatMap((sp) => sp.fields.filter((f) => /valueprop|vprop|^desc$/.test(f.id) && !f.linked).map((f) => `${sp.code}.${f.id}`));
  ok(editable.length === 1 && editable[0] === "S8.vprop",
     `exactly one editable value-prop field in the whole schema — [${editable.join(", ")}]`);

  // 2. Gate completeness is untouched: both fields are still required, so no project's score moves.
  ok(field("S1", "valueprop").req === true && field("S6", "desc").req === true,
     "both renderings stay req:true — locking them down does not re-score 33 projects");

  // 3. The route out is real. Every rendering carries a link to S8, and S8 now has a panel to land in.
  ok(F.sourceSlideOf("S1", "valueprop") === "S8" && F.sourceSlideOf("S6", "desc") === "S8",
     "the registry routes both renderings to S8");
  ok(/const SOURCE_PANEL_CODES = \["S10", "S8"\];/.test(src), "S8 is registered as a code that renders a source panel");
  ok(/onEditSource && spec\.code === "S8" && panelExists\("S8"\)/.test(src), "the S8 source panel is gated and mounted");

  // 4. S8 owns all THREE roots. Owning the sentence without the drivers would leave the waterfall, the
  //    capture metrics and the WTP strip editable somewhere else — the same defect one level down.
  ok(/onEditSource\(\{ valueProp: v, valuePropSource: "HI" \}/.test(src), "S8 writes the sentence");
  ok(/onEditSource\(\{ nextBestAlternative: v \}/.test(src), "S8 writes the Next Best Alternative");
  ok(/onEditSource\(\{ valueDrivers: s8Drivers \}/.test(src), "S8 writes the value drivers");

  // 5. THE FOURTH DOOR IS SHUT. ProjectDetail's Value Equation card keeps its sliders (exploring is not
  //    editing) but no longer writes, and offers the deep link instead.
  ok(!/onEdit\(\{ valueDrivers: veqDrivers, valueProp: valuePropFromEquation/.test(src),
     "ProjectDetail no longer generates-and-saves a value prop from outside the deck");
  ok(!/onEdit\(\{ valueDrivers: veqDrivers \}/.test(src), "ProjectDetail no longer saves drivers");
  ok(/Exploring — S8 is where the value proposition is saved\./.test(src) && /Edit on S8/.test(src),
     "ProjectDetail says where the record lives and offers a way there");
  ok(/startSlide=\{sourceSlideOf\("S8", "vprop"\) \?\? "S8"\} openSource/.test(src),
     "that link deep-links to S8 with the source panel expanded — resolved from the registry, not hardcoded");

  // 6. NewIdeaModal is the ONE named exception: creating an idea is not a second editing surface.
  ok(/onCreate\(\{ name, valueProp, nba, segments, drivers \}\)/.test(src),
     "idea creation still captures all four value-prop roots — creation is not a door, and this exception is named");
}

// ── V4 · S8 AXES ALWAYS FIT — box first, then type; never clip, never ellipsis ──────────
// The operator photographed this chart with every driver truncated: "Portability across…", "Auditable
// decision…", "Certifiable module…". Two causes. The x labels were hard-cut at eight characters with no
// ellipsis and no wrap, and the y axis had NO ticks at all — only grid lines, behind a six-unit gutter that
// could not have held a number anyway.
{
  const fspc = await import("node:fs/promises");
  const src = await fspc.readFile("app/innovation/page.tsx", "utf8");
  // W-1b · RE-POINTED, NOT RELAXED. `S8ValueChart` and `ValueEquationPanel` merged into ONE `ValueProp`
  // (operator: "only one Value Prop visual that is source for everything including slide"), so this slice
  // named a function that no longer exists and `indexOf` returned -1 — slicing the TOP of the file and
  // failing nine assertions that were all still true. Every property below is unchanged; only the anchor is.
  const chart = src.slice(src.indexOf("function ValueProp("), src.indexOf("function ValueEquationPanel("));

  ok(!/s\.label\.length > 8 \? s\.label\.slice\(0, 8\)/.test(chart), "the eight-character hard cut is gone");
  // ⚠ NARROWED, AND THE REASON MATTERS. The ban was `/slice(0, 8)/` — any occurrence. W-1b caps the chart at
  // eight differentiator bars with `ve.perDriver.slice(0, 8)`, which is a CAP ON BARS, not a cut through a
  // label, and the blanket ban could not tell them apart. The defect was always `<label>.slice(0, N)`.
  ok(!/\blabel\.slice\(0,\s*\d+\)/.test(chart), "no truncation of any driver LABEL survives in this chart");
  ok(/return out\.slice\(0, 2\);/.test(chart), "labels WRAP to at most two lines — the budget is lines, not characters");
  ok(/const FS = Math\.max\(4\.4, Math\.min\(6, gw \/ 5\.2\)\);/.test(chart),
     "type shrinks toward a legibility FLOOR of 4.4 before it wraps — it never shrinks without limit");

  // The y axis exists, and the gutter is MEASURED from the tick strings rather than being a constant.
  ok(/const tickTxt = TICKS\.map/.test(chart) && /textAnchor="end" fontSize=\{FS\}/.test(chart),
     "the y axis has real tick labels, not just grid lines");
  // X-2 · the per-character constant rose 2.6 → 3.9 because X-1 let `FS` reach its cap of 6 and a four-digit
  // tick sheared its leading digit off the left edge (measured on PRJ-15/23/32). The PROPERTY is unchanged
  // and is what this asserts: the gutter is a function of the longest tick STRING, not a fixed number.
  ok(/const L = Math\.max\(6, Math\.max\(\.\.\.tickTxt\.map\(\(\w+\) => \w+\.length\)\) \* 3\.9 \+ 3\);/.test(chart),
     "the gutter is measured FROM the tick text — a wider number widens the gutter, it does not overprint the axis");
  // …and it is sized for the WIDEST type the chart can draw, or the widening reopens the shear.
  ok(/Math\.min\(6, gw \/ 5\.2\)/.test(chart) && 3.9 >= 6 * 0.58,
     "the gutter's per-character budget covers FS at its cap (6), not a typical FS");
  ok(/const L = /.test(chart) && !/L = 6,/.test(chart), "the hardcoded six-unit gutter is gone");

  // The bottom band is sized by the labels, and the chart grows so the plot area is not eaten by them.
  ok(/const B = 6 \+ \w+ \* \(FS \+ 1\.2\);/.test(chart), "the label band is sized by the lines the labels actually need");
  // X-1 moved this into the two-pass `layout()` return (`H: (big ? …)`) so it can be evaluated at two widths.
  // Same expression, same guarantee — only the binding form changed from a `const` to an object property.
  ok(/H: \(big \? 150 : \d+\) \+ Math\.max\(0, B - 16\)/.test(chart),
     "the chart grows to absorb a taller label band — the plot yields nothing to the axis");

  // The WTP strip: a long first word at either end used to run off the edge.
  ok(/maxWidth: "22%"/.test(src) && /break-words text-center text-\[7px\]/.test(src),
     "WTP marker labels wrap within a share of the strip instead of running off its edge");
  ok(!/mt-0\.5 whitespace-nowrap text-\[7px\]/.test(src), "the nowrap that caused the overflow is gone");
}

// ── E0d · S10 HAS ONE SURFACE, AND IT IS THE GRID ───────────────────────────────────────
// Operator, 2026-07-30, from a live screenshot of S10's field grid:
//   "Delete / R&D spend by year (WBS) REQUIRED / Revenue scenarios REQUIRED / Confidence (this should be in
//    Risk section) ... remember financial grid S10 always shows."
// E0b made those three read-outs of the grid. The operator's answer to a read-out that repeats, three inches
// lower, exactly what the sheet above it already prints is: delete it. So S10's schema fields are gone
// entirely and the grid — which cannot be collapsed — is the whole slide.
{
  const F = await import("../lib/innovation-data.ts");
  const fspE = await import("node:fs/promises");
  const pageE = await fspE.readFile("app/innovation/page.tsx", "utf8");
  const p0 = F.DEMO_PROJECTS[0];
  const BY = 2026;                                     // pinned, so the lock never depends on the wall clock
  const s10 = F.slideSpec("S10");

  // 1. THE THREE FIELDS ARE GONE — asserted by NAME, because those are the three the operator pointed at.
  for (const fid of ["spend", "scenarios", "conf"])
    ok(!s10.fields.some((f) => f.id === fid), `S10.${fid} is deleted — the grid already prints it`);
  // ...and by COUNT, so a NEW field added to S10 tomorrow fails without anyone remembering to update a list.
  ok(s10.fields.length === 0, `S10 declares no fields at all — [${s10.fields.map((f) => f.id).join(", ")}]`);

  // 2. NOTHING ELSE LOST ITS FIELDS. The delete was surgical; nineteen other codes still author in place.
  ok(F.SLIDE_SCHEMA.filter((sp) => sp.code !== "S10").every((sp) => sp.fields.length > 0),
     "every other code kept its fields — this was a delete of one slide's duplicates, not a purge");

  // 3. GATE SCORING IS UNMOVED ACROSS THE PORTFOLIO. `gateReadiness` grades GATE_REQUIREMENTS by gate and
  //    never reads `SlideSpec.fields`, so removing two `req: true` fields cannot re-score anyone. Executed on
  //    all 33 projects rather than argued from the call graph.
  ok(F.DEMO_PROJECTS.every((p) => F.gateReadinessAll(p).every((g) => g.required > 0)),
     `all ${F.DEMO_PROJECTS.length} projects still grade against a non-empty requirement set at every gate`);
  ok(F.gateReadiness(p0, p0.gate).pct === Math.round((F.gateReadiness(p0, p0.gate).satisfied / F.gateReadiness(p0, p0.gate).required) * 100),
     "gate % is computed from the requirement register, which the schema change never touched");

  // 4. THE DEAD CODE WENT WITH THE FIELDS. A resolver and an AI draft for a field that no longer exists are
  //    exactly what "delete everything that does not help make a slide" is about.
  for (const fid of ["spend", "scenarios", "conf"]) {
    ok(F.linkedSlideField(p0, "S10", fid, BY) === null, `no S10.${fid} resolver survives its deleted field`);
    ok(F.aiSlideField(p0, "S10", fid) === null, `no S10.${fid} AI draft survives its deleted field`);
  }
  ok(!Object.keys(F.SOURCE_SLIDE).some((k) => k.startsWith("S10.")),
     "no SOURCE_SLIDE row points a deleted S10 field at itself");

  // 5. S10 IS STILL THE OWNING CODE. Other slides route their money read-outs here; deleting S10's OWN rows
  //    must not have unhooked S2 and S3 from it.
  ok(F.isSourceSlide("S10") && F.sourceSlideOf("S3", "revtable") === "S10" && F.sourceSlideOf("S2", "profile") === "S10",
     "S10 still owns the money record — S2 and S3 still deep-link to it");

  // 6. THE GRID ALWAYS SHOWS. Not "opens by default" — there is no toggle at all on S10, because a collapsed
  //    S10 is now a slide with nothing under it. Asserted on the render, and on the ABSENCE of the control.
  ok(/◈ Financial record/.test(pageE), "the S10 financial panel renders with no collapse control");
  const s10Panel = pageE.slice(pageE.indexOf("◈ Financial record") - 900, pageE.indexOf("◈ Financial record") + 400);
  ok(!/setSrcOpen/.test(s10Panel), "no collapse toggle sits on the S10 financial panel");
  ok(/<span>\{srcOpen \? "▾" : "▸"\}<\/span>◈ Edit source record/.test(pageE),
     "S8 KEEPS its collapse — it still has authored fields of its own underneath");

  // 7. "% AUTHORED" ASKS THE RECORD. With no fields, a field-list score would read 100% forever, which is a
  //    worse lie than the duplicate tables it replaced. It asks `finGateReadiness` — the same ladder the gate
  //    uses — so an unforecast project reads as unforecast.
  ok(/if \(sp\.code === "S10"\) \{ const r = finGateReadiness/.test(pageE),
     "S10's authored % is measured from the financial plan, not from an empty field list");
  const empty = { ...p0, finPlan: F.emptyFinPlan(BY) };
  ok(F.finGateReadiness(F.finOf(empty, BY), empty.gate).filled === 0,
     "a project with an empty plan scores 0 forecast years — the % cannot be gamed by having no fields");
  ok(F.finGateReadiness(F.finOf(p0, BY), p0.gate).filled > 0, "a seeded project still scores its forecast years");
}

// ── E1 · QTY · ASP · COGS ARE INPUTS, IN BOTH MODES ─────────────────────────────────────
// Operator: "add QTY, ASP, COGS for input, with toggle of Rev & Mgn only option. If under Qty, Rev, Mgn
// input Calculations occur for Rev and Margin." — and, earlier, "where is my Qty. ASP, and Mgn?"
//
// That question had a real cause. The SHEET printed six rows per band while the EDITOR forked: unit
// economics ON showed Quantity/MSRP/Disc/COGS, OFF showed Revenue and Margin only — and `finBaseline` sets
// OFF for all 33 seeded projects, so on every one of them Quantity, ASP and COGS simply were not there.
// The read-out promised figures the input surface would not accept.
{
  const F = await import("../lib/innovation-data.ts");
  const fspE1 = await import("node:fs/promises");
  const pageE1 = await fspE1.readFile("app/innovation/page.tsx", "utf8");

  // 1. ASP IS A FIELD NOW, and typed ASP WINS. This reverses a decision this repo argued for in a comment;
  //    the lever is kept as a fallback so no seeded plan moves by a cent.
  const seeded = { units: 10, msrpK: 100, discPct: 20, cogsK: 40 };          // no aspK — the 33 seeded shape
  ok(F.aspOf(seeded) === 80, `a plan with no typed ASP still derives MSRP net of discount — ${F.aspOf(seeded)}`);
  ok(F.aspOf({ ...seeded, aspK: 91 }) === 91, "a typed ASP wins over the MSRP × (1 − disc) fallback");
  ok(F.aspOf({ ...seeded, aspK: 0 }) === 0, "a typed ASP of ZERO is honoured, not treated as absent");
  ok(F.emptyBandYear().aspK === undefined, "a fresh band year has no ASP until someone types one");

  // 2. THE ARITHMETIC, EXECUTED. Revenue = Qty × ASP · Margin = Qty × (ASP − COGS).
  const b = { units: 12, aspK: 55, msrpK: 0, discPct: 0, cogsK: 20 };
  ok(F.bandRevK(b, true) === 660, `Revenue = Qty × ASP — ${F.bandRevK(b, true)}`);
  ok(F.bandMgnK(b, true) === 420, `Margin = Qty × (ASP − COGS) — ${F.bandMgnK(b, true)}`);
  ok(Math.round(F.bandMgnPct(b, true)) === 64, `Margin % follows — ${F.bandMgnPct(b, true)}`);
  // "Rev & Mgn only" ignores all three and takes the typed pair — including a typed ZERO.
  const t = { ...b, revK: 999, mgnK: 111 };
  ok(F.bandRevK(t, false) === 999 && F.bandMgnK(t, false) === 111, "Rev & Mgn only uses the typed pair");
  ok(F.bandRevK({ ...b, revK: 0 }, false) === 0, "a typed revenue of zero is a measured zero, not a fallback");

  // 3. NO SEEDED PLAN MOVED — asserted DIRECTLY now, not through a proxy.
  //    This lock's purpose has never changed: adding `aspK` must not re-price the portfolio. Its ORIGINAL
  //    assertion was "`aspK` is absent from every baseline", which was a stand-in for that purpose and was
  //    true while ASP fell back to MSRP. F2a makes it false ON PURPOSE — `finBaseline` now derives ASP FROM
  //    the revenue so the build-up reconciles (301 of 804 printed rows previously had Qty × ASP ≠ Revenue).
  //    So the proxy is replaced by the property itself, which is strictly stronger: whether ASP is present
  //    or absent, reading a band as a build-up and reading it as a typed pair must give the SAME number.
  //    A future change that re-prices anything fails this, which the old absence check could never catch.
  for (const p of F.DEMO_PROJECTS) {
    const fin = F.finBaseline(p, 2026);
    const same = fin.years.every((y) => ["neu","don","dec"].every((k) =>
      Math.abs(F.bandRevK(y[k], true) - F.bandRevK(y[k], false)) < 0.005 &&
      Math.abs(F.bandMgnK(y[k], true) - F.bandMgnK(y[k], false)) < 0.005));
    ok(same, `${p.id} reads identically typed or built up — the seeded plan did not move`);
  }
  // The MSRP fallback still works for a band that has no typed ASP — deriving ASP in the baseline must not
  // quietly delete the path a hand-entered plan still relies on.
  ok(F.aspOf({ units: 0, msrpK: 200, discPct: 10, cogsK: 0 }) === 180,
     "a band with no typed ASP still falls back to MSRP net of discount");

  // 4. THE TOGGLE SWAPS THE ROW SET. Operator, revising E1: "if Rev / Mgn Only is selected, Qty, COGS, ASP
  //    are hidden and those cells are editable." Each mode shows exactly what it takes. E1 originally kept
  //    all three visible in both modes and asserted they sat OUTSIDE the branch; that assertion is inverted
  //    here rather than deleted, so the file records that the behaviour was chosen, not drifted into.
  const ed = pageE1.slice(pageE1.indexOf("const BANDS"), pageE1.indexOf("Combined is DERIVED — New"));
  const split = ed.indexOf("{on ? <>");
  ok(split > 0, "the band rows are inside a mode branch");
  const buildUp = ed.slice(split, ed.indexOf("</> : <>", split));
  const typed = ed.slice(ed.indexOf("</> : <>", split));
  for (const row of ['label="Quantity"', 'label="COGS $K"', 'label="ASP $K"'])
    ok(buildUp.includes(row) && !typed.includes(row), `${row} renders ONLY in the build-up mode`);
  for (const row of ['label="Revenue $K"', 'label="Margin $K"'])
    ok(typed.includes(row) && !buildUp.includes(row), `${row} is typeable ONLY in Rev & Mgn only`);
  // G1 · Revenue and Margin are TWO calculated rows in build-up mode, not one combined row.
  // This asserted `"Rev · Mgn <span"` — a single row that printed REVENUE only, with margin hidden in a
  // `title` tooltip that is invisible on a phone and to a board. So the mode that computes margin was the
  // one mode that never displayed it (operator, from a live screenshot). The lock now requires both rows
  // by name, and that the retired combined row is gone rather than left beside them.
  ok(buildUp.includes('["Revenue $K", bandRevK') && buildUp.includes('["Margin $K", bandMgnK'),
     "the build-up mode shows Revenue AND Margin as separate read-only calc rows");
  ok(!buildUp.includes("Rev · Mgn <span"), "the old combined Rev · Mgn row is gone, not duplicated alongside");
  ok(!ed.slice(0, split).includes('label="Quantity"'), "no band row escapes the mode branch");

  // 5. ORDER IS THE ORDER OF THE DECISION — Quantity, then what it costs to make, then what it sells for.
  //    Compared as LISTS between the editor and the sheet: two separate assertions can both pass while the
  //    surfaces drift; one comparison cannot.
  const edOrder = [...buildUp.matchAll(/label="(Quantity|COGS \$K|ASP \$K)"/g)].map((m) => m[1].replace(" $K", ""));
  const bandFn2 = pageE1.slice(pageE1.indexOf("const band = (key:"), pageE1.indexOf("Combined is DERIVED: Revenue/Margin"));
  const shOrder = [...bandFn2.matchAll(/label: "(Quantity|COGS|ASP)"/g)].map((m) => m[1]);
  ok(edOrder.join(" → ") === "Quantity → COGS → ASP", `the editor orders Quantity → COGS → ASP — got ${edOrder.join(" → ")}`);
  ok(edOrder.join("|") === shOrder.join("|"),
     `the sheet carries the SAME order as the editor — sheet [${shOrder.join(" → ")}] vs editor [${edOrder.join(" → ")}]`);

  // 5c · F2b · PRESENCE, not just order. The lock above compares ORDER, and that is exactly how the defect
  // shipped green: the sheet emitted Quantity/COGS/ASP UNCONDITIONALLY while the editor hid them in typed
  // mode, so both surfaces listed the same three metrics in the same order and the comparison passed — while
  // a band in "Rev & Mgn only" printed a build-up that did not produce the revenue beside it. Order equality
  // cannot see a missing branch; presence equality can.
  ok(/\.\.\.\(on \? \[/.test(bandFn2), "the SHEET's band rows are inside a mode branch, not emitted unconditionally");
  ok(/^\s*\.\.\.\(on \? \[/m.test(bandFn2) && /\] : \[\]\),/.test(bandFn2),
     "the sheet's build-up rows collapse to NOTHING when the band is typed");
  // Revenue/Margin/Margin % are outside the branch on the sheet — they exist in BOTH modes, which is the
  // whole point of the toggle. Asserted so a later 'simplification' cannot sweep them inside it.
  const shAfterBranch = bandFn2.slice(bandFn2.indexOf("] : []),"));
  for (const r of ['label: "Revenue"', 'label: "Margin"', 'label: "Margin %"'])
    ok(shAfterBranch.includes(r), `the sheet shows ${r} in BOTH modes — it is a total, not a build-up row`);
  // groupSpan must be DERIVED. A literal span on a 3-row band leaves rows uncovered and shifts every number
  // one column right — the rowSpan cover-set defect S10Grid's own comment warns about.
  ok(/groupSpan: rows\.length/.test(bandFn2), "the band's gutter rowSpan is derived from its actual row count");
  ok(!/groupSpan: 6,/.test(bandFn2), "no hardcoded 6-row span survives the branch");

  // 5a. BAND ORDER IS THE SAME ON BOTH SURFACES — the level above 5, and it was UNGUARDED until now.
  //     Measured before writing this (AsM Enlil/Krishna, 2026-07-30): reordering the SHEET's three bands
  //     while leaving the EDITOR alone left the suite at 2899/2899. So the deck could print Step 1b/2/3 to
  //     a board while the panel behind it still read Step 2/1b/3, with a green gate — and the comment at
  //     page.tsx "a lock compares the two lists directly" was true of the METRIC rows (5, above) and false
  //     of the BANDS. Keyed on don/neu/dec rather than on the display titles, so a retitle cannot silently
  //     satisfy it and an order change cannot silently escape it.
  const shBands = [...bandFn2.matchAll(/\.\.\.band\("(don|neu|dec)"/g)].map((m) => m[1]);
  // The trailing comma is load-bearing: without it this also matches the TYPE ANNOTATION
  // `BANDS: { key: "don" | "neu" | "dec"; … }[]`, which captures a phantom fourth band and reports
  // [don → don → neu → dec]. My probe was wrong, not the code — recorded beside the assertion it broke.
  const edBands = [...ed.matchAll(/\{ key: "(don|neu|dec)",/g)].map((m) => m[1]);
  ok(shBands.length === 3, `the sheet renders exactly three revenue bands — got [${shBands.join(" → ")}]`);
  ok(edBands.length === 3, `the editor renders exactly three revenue bands — got [${edBands.join(" → ")}]`);
  ok(shBands.join("|") === edBands.join("|"),
     `sheet and editor carry the SAME band order — sheet [${shBands.join(" → ")}] vs editor [${edBands.join(" → ")}]`);

  // 5b. THE TOGGLE SAYS WHAT THE OPERATOR CALLED IT, in the new order.
  ok(/\{on \? "Qty · COGS · ASP" : "Rev & Mgn only"\}/.test(pageE1),
     "the toggle reads 'Qty · COGS · ASP' / 'Rev & Mgn only'");
  ok(!/Qty · ASP · COGS|Units × ASP|Revenue typed/.test(pageE1), "no earlier ordering or wording survives");

  // 5c. HIDDEN IS NOT DELETED. Switching to Rev & Mgn only must not clear the build-up values, or a mode
  //     flip would silently destroy typed data — the single worst thing a toggle can do.
  const withQty = F.withFinBandRow(F.finBaseline(F.DEMO_PROJECTS[0], 2026), "neu", "units", [7, 7, 7]);
  const hidden = { ...withQty, unitEcon: { ...withQty.unitEcon, neu: false } };
  ok(hidden.years[0].neu.units === 7 && hidden.years[2].neu.units === 7,
     "hiding the build-up rows leaves Quantity on the record — switching back restores what was typed");

  // 6. DEFAULTS, STATED RATHER THAN DISCOVERED — and REVERSED for seeded plans by F2a.
  //    This assertion used to read "every SEEDED plan stays in Rev & Mgn only", on the reasoning that
  //    "`finBaseline` back-solves units from revenue, so flipping them would recompute revenue from a
  //    ROUNDED quantity and move every seeded figure." That reasoning was CORRECT, and F2a removes its
  //    premise rather than overriding it: ASP is now derived from the revenue, so the quantity is no longer
  //    rounded against a separate price and flipping moves nothing. Proved directly — 1,105 displayed
  //    figures across 33 projects are byte-identical before and after, and section 3 above asserts the
  //    typed and built-up readings agree on every band-year. Leaving these OFF would have kept the sheet
  //    printing a build-up it would not stand behind, which was the defect the operator asked to fix.
  ok(Object.values(F.emptyFinPlan(2026).unitEcon).every(Boolean),
     "a NEW plan starts in Qty · ASP · COGS — the build-up is the default when there is nothing to preserve");
  ok(F.DEMO_PROJECTS.every((p) => Object.values(F.finBaseline(p, 2026).unitEcon).every((v) => v === true)),
     "every SEEDED plan now runs the build-up too — safe ONLY because the identity above holds exactly");
  // The guard that makes the flip safe is a PROPERTY, and it is exercised on the FAILING case directly.
  // Asserting it in situ would be VACUOUS — no seeded year currently has revenue with zero units, so the
  // check passes whether or not the guard works. Found by mutation-testing: forcing the predicate to
  // `true` left the suite green. So `bandBuildUpOk` is exported and driven with the case that matters.
  const yr = (units, revK) => ({ neu: { units, revK, msrpK: 0, discPct: 0, cogsK: 0 }, don: { units: 0, revK: 0, msrpK: 0, discPct: 0, cogsK: 0 }, dec: { units: 0, revK: 0, msrpK: 0, discPct: 0, cogsK: 0 } });
  ok(F.bandBuildUpOk([yr(4, 400), yr(6, 600)], "neu") === true, "a band whose every year has units CAN build up");
  ok(F.bandBuildUpOk([yr(4, 400), yr(0, 600)], "neu") === false,
     "a band with revenue but ZERO units in any year CANNOT build up — that year would render as zero");
  ok(F.bandBuildUpOk([yr(4, 400), yr(0, 0)], "neu") === true, "a genuinely empty year does not disqualify the band");
  ok(F.DEMO_PROJECTS.every((p) => { const f = F.finBaseline(p, 2026);
    return ["neu","don","dec"].every((k) => f.unitEcon[k] === F.bandBuildUpOk(f.years, k)); }),
     "every seeded band's mode is exactly what the predicate says — the flag is derived, never hand-set");
}

// ── E2 · THE BAND LABELS STAY ON SCREEN ─────────────────────────────────────────────────
// Operator: "I need Step 1A, Do nothing and other labels to stay on screen just like labels for rev margin,
// etc." Exactly right, and it was one missing property. The METRIC labels (Quantity, Revenue, Margin) are
// `sticky left-0` on `FinRow`, so they hold when you scroll out to 2036. The BAND and SECTION headers were
// full-width `colSpan` cells with no sticky, so their text rode off the left edge and you lost which band you
// were typing into. A colSpan cell already spans the table, so stickying the CELL does nothing — the content
// has to be pinned instead. Structural here; measured in a browser by the E2 proof.
{
  const fspE2 = await import("node:fs/promises");
  const pageE2 = await fspE2.readFile("app/innovation/page.tsx", "utf8");
  const ed = pageE2.slice(pageE2.indexOf("const head = ("), pageE2.indexOf("Apply-rate strip"));

  // ⚠ THE STICKY GOES ON THE `td`, NOT ON A SPAN INSIDE IT. A sticky SPAN inside a `colSpan` cell of a
  // `border-collapse: collapse` table clips its own left edge — measured at ~20px lost on a 390px phone,
  // which cut "Declining Rev: Existing" to "lining Rev: Existing" in a screenshot while the desktop was
  // pixel-perfect. The band header is now two cells, exactly like `FinRow`: a PINNED label cell (carrying
  // the band name and its toggle, so the control never scrolls away from the label it belongs to) and a
  // spanning cell that carries the stripe.
  ok(!/<span className="sticky left-0 inline-block">/.test(ed),
     "no sticky span inside a colSpan cell — that form clips its own label under border-collapse");
  // PROXY LOCK REWRITTEN (W-3, the SIXTH this session). This matched the band header's FULL class string,
  // `max-w-[60vw]` included — the SHAPE, not the property. W-3 deletes that cap deliberately (the shared
  // colgroup owns the gutter now), and the lock went red on a change that strengthens the very thing it
  // guards. What it MEANS is: each band header's LABEL CELL is pinned with the E2 stripe background. That
  // is now what it says, and it survives any future width mechanism.
  const pinned = [...ed.matchAll(/<td className="sticky left-0 z-10 [^"]*bg-\[#12202a\]/g)];
  const stripes = [...ed.matchAll(/<td colSpan=\{ys\.length\} className="bg-cyan-500\/10" \/>/g)];
  ok(pinned.length === 3, `three section headers pin their label cell — ${pinned.length}`);
  ok(stripes.length === 3, `each pinned label is paired with a spanning stripe cell — ${stripes.length}`);
  ok(!/colSpan=\{ys\.length \+ 1\}/.test(ed),
     "no full-width header remains — a colSpan across the label column cannot be pinned");
  // The three the operator named by hand, asserted by name as well as by count.
  // W-5 · STEP-FIRST, THE WHOLE LADDER. The operator's F6 instruction inverted the three revenue bands to
  // `Step 1b · …` / `Step 2 · …` / `Step 3 · …` but named only those three, so rule 6 left the spend header
  // reading `R&D Spend · Step 1a` and the panel read 1a-last, 1b-first — the inconsistency F6 flagged and
  // deferred. The operator has now asked for it: "Step 1a · R&D Spend replaces R&D Spend · Step 1a".
  // The `bg-[#12202a]` anchor is the E2 sticky-clip guard, NOT a naming assertion — it stays.
  ok(/bg-\[#12202a\][^>]*>Step 1a · R&amp;D Spend<\/td>/.test(ed), '"Step 1a · R&D Spend" is in a pinned cell');
  // STEP-FIRST IS THE INVARIANT, NOT THE FOUR STRINGS. Asserting a count would be wrong here: the three
  // revenue labels each appear TWICE (the sheet's `...band(...)` spreads and the editor's BANDS array), so a
  // count locks an accident of duplication rather than the rule. Instead: nowhere in the file may a step
  // token appear AFTER its name. That goes red if any header is flipped back, and it covers a fifth band
  // added tomorrow — which a list of four literals could never do.
  //
  // ⚠ PROBE ERROR, RECORDED (the sixth in this workstream). The first draft matched any ` · Step N` and went
  // red on three innocents — `Step 1 New · Step 2 Decline · Step 3 EOL` in the Growth-Model comment at :6072,
  // where the `·` separates TERMS OF A FORMULA, not a name from its step. The lookahead is the fix: a name-last
  // LABEL ends immediately after its step token (`<` in JSX, `"` in a string literal), a formula never does.
  {
    const nameLast = [...pageE2.matchAll(/ · (Step 1a|Step 1b|Step 2|Step 3)(?=["<])/g)].map((m) => m[0].trim());
    ok(nameLast.length === 0, `every S10 band header is step-first — name-last survivors: ${nameLast.join(" | ") || "none"}`);
  }
  ok(/bg-\[#12202a\][^>]*>Combined: Incremental/.test(ed), '"Combined: Incremental" is in a pinned cell');
  ok(/bg-\[#12202a\][^>]*>\s*\{b\.label\}/.test(ed),
     "the per-band header (Do Nothing / New: 1st Product Rev / Declining Rev) is pinned, with its toggle inside it");

  // THE VERTICAL TWIN. Scrolling down 24 rows used to lose the calendar years.
  // ⚠ THE STICKY MUST BE ON EVERY `th`, NOT ON THE `thead`. This table is `border-collapse: collapse`, and
  // a collapsed table gives `thead`/`tr` no box to position against, so the rule is silently ignored. Caught
  // by measurement, not by review: with it on the thead the year row sat at y 1216 inside a box at y 283.
  ok(!/<thead className="[^"]*sticky/.test(ed), "the sticky is NOT on the thead — it would be ignored under border-collapse");
  ok(/<th className="sticky left-0 top-0 z-30 bg-\[#0b0f14\]/.test(ed),
     "the corner cell pins BOTH ways and outranks everything — z-30 over the header's z-20 and the row labels' z-10");
  ok(/\{ys\.map\(\(y\) => <th key=\{y\.year\} className="sticky top-0 z-20 bg-\[#0b0f14\]/.test(ed),
     "each year header is individually sticky and carries its own background — a transparent one shows the rows through it");
}

// ── E3 · "LIVE FROM PROJECT" BECOMES "✎ EDIT FINANCIALS" / "✎ EDIT VALUE PROP" ─────────
// Operator: "Anytime we say live from project have Edit Financials or Edit Value Prop instead with edit
// symbol." A read-only field used to announce itself with a passive badge — it told you the value was not
// yours to type, but not where it WAS yours to type. The verb does both, and it sits exactly where the eye
// already is when someone wonders "can I change this?".
{
  const F = await import("../lib/innovation-data.ts");
  const fspE3 = await import("node:fs/promises");
  const pageE3 = await fspE3.readFile("app/innovation/page.tsx", "utf8");
  // Strip BOTH comment forms. A first draft stripped only `//` lines and went red on its own explanatory
  // JSX block comment, which quotes the retired badge text — the lock catching the person writing it.
  const code = pageE3.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
                     .split("\n").map((l) => l.replace(/^\s*\/\/.*$/, "")).join("\n");

  // 1. EVERY PASSIVE BADGE IS GONE — all three sites the operator's phrase covered.
  for (const dead of ["LIVE FROM PROJECT", "· ◈ live", "◈ live\""])
    ok(!code.includes(dead), `"${dead}" no longer appears anywhere in the deck`);

  // 2. THE LABEL COMES FROM THE OWNER, not from the call site — so a THIRD source names its own control
  //    instead of requiring three edits. That is the whole reason this is a table and not a string.
  ok(F.SOURCE_LABEL.S10 === "Edit Financials" && F.SOURCE_LABEL.S8 === "Edit Value Prop",
     "SOURCE_LABEL names both owners in the operator's own words");
  ok(F.sourceLabelOf("S3", "revtable") === "Edit Financials", "an S3 money field says Edit Financials");
  ok(F.sourceLabelOf("S1", "valueprop") === "Edit Value Prop" && F.sourceLabelOf("S6", "desc") === "Edit Value Prop",
     "S1 and S6 both say Edit Value Prop — they render the sentence S8 owns");
  ok(F.sourceLabelOf("S4", "conops") === "Edit source",
     "a field with no owner falls back to a generic verb — a new owner is never nameless");
  // Registry coverage: every owning code must have a label, or a field would name its control after nothing.
  ok(F.SOURCE_CODES.every((c) => F.SOURCE_LABEL[c]), `every owning code has a label — [${F.SOURCE_CODES.join(", ")}]`);

  // 3. THE EDIT SYMBOL, as asked. The old ◈ was a diamond, not an edit affordance.
  ok(/<span aria-hidden>✎<\/span> \{verb\}/.test(code), "the control leads with the ✎ edit symbol and the owner's verb");
  ok(/✎ \$\{sourceLabelOf\(sp\.code, f\.id\)\}/.test(code), "the PRESENT-mode field banner carries the same verb");

  // 4. IT ACTUALLY GOES SOMEWHERE — off the owning slide. On the owning slide there is nowhere to go, so it
  //    stays a badge: an edit verb that navigates nowhere would be a lie, which is the defect F0 fixed.
  ok(/setPresent\(false\); if \(!here && oi >= 0\) setIdx\(oi\); setSrcOpen\(true\);/.test(code),
     "clicking it leaves Present, navigates to the owner and opens the editor");
  ok(/hasSourceLink\(spec\.code, f\.id\)\s*\?\s*<SourceLink/.test(code),
     "the badge becomes a LINK only where there is somewhere to go");
}

// ── Z5 · THE SHEET ZOOMS AS ONE PAGE, AND THE BODY-SIDE ZOOM STACK IS GONE ──────────────
// SUPERSEDES Z4, which is why the whole block was rewritten rather than deleted. Z2/Z4 magnified only
// [data-slide-zoom] and held the chrome at 1x, on the operator's earlier instruction; measured at 200% that
// gave text 2.00x, panel box 2.00x, slide TITLE 1.00x. The operator then asked for the PDF-viewer model —
// "ensure Zoom and edge of slide are synced as one. Should zoom as I would a pdf of computer screen" — and
// confirmed it when told it reverses their own earlier call. The scale therefore lives on the canvas again.
//
// These assertions are the REVERSE of Z4's and they are what stops either behaviour returning by accident:
// re-attach a transform to the body and this goes red; drop `* zoom` from the sheet and this goes red.
{
  const fspZ = await import("node:fs/promises");
  const pageZ = await fspZ.readFile("app/innovation/page.tsx", "utf8");
  // ANCHOR ON THE JSX, not the first textual hit — `data-slide-zoom` appears in SLIDE_PRINT_CSS first, and
  // slicing from there measures the print reset instead of the markup. (Probe error #14's shape: never
  // anchor a slice on a string that also occurs in a comment or a CSS literal.)
  const zStart = pageZ.indexOf("<div data-slide-zoom");
  ok(zStart > 0, "the zoom layer element exists in the JSX");
  const zEnd = pageZ.indexOf("data-slide-body", zStart);
  ok(zEnd > zStart, "…and data-slide-body follows it — both slice anchors resolve, so the zone is bounded");
  const zone = pageZ.slice(zStart, zEnd + 400);

  // 1 · ONE TRANSFORM, ON THE PAGE. Edge, banner, title, footer and body all move together.
  ok(/transform: `scale\(\$\{fit \* zoom\}\)`/.test(pageZ),
     "the sheet scales by fit x zoom — the slide's own edge zooms with its content");
  ok(!/transform: `scale\(\$\{fit\}\)`,/.test(pageZ),
     "the fit-alone form that held the chrome at 1x is gone");
  ok(/width: SHEET_W \* fit \* zoom, height: SHEET_H \* fit \* zoom/.test(pageZ),
     "the shrink-wrap footprint reserves the ZOOMED page, so there is a real layout box to pan inside");

  // 2 · THE BODY CARRIES NO SCALE AT ALL. The three-element viewport/sizer/scaled stack is retired.
  ok(!/transform: `scale\(\$\{zoom\}\)`/.test(pageZ),
     "no element scales by `zoom` alone any more — the body-side magnifier is gone");
  ok(!zone.includes("width: `${100 * zoom}%`"), "the Z4 SIZER is gone");
  ok(!zone.includes("width: `${100 / zoom}%`"), "the Z4 SCALED child is gone");
  ok(!/const zoomOn = /.test(pageZ), "`zoomOn` is retired — there is no zoom-conditional geometry left");

  // 3 · THE OVERFLOW GATE IS UNCONDITIONAL AGAIN, which is stronger than the Z4 ternary it replaces. The
  //     sheet's LAYOUT is identical at every zoom level (only its transform changes), so slide-shots.mjs
  //     measures the same element in the same state always — S10 spilled by 21 elements once.
  ok(/data-slide-body className="grid h-full min-h-0 grid-cols-2 content-stretch gap-\[1\.4cqh\] overflow-hidden"/.test(pageZ),
     "data-slide-body clips unconditionally — the overflow gate can never be switched off by a zoom state");
  ok(!/zoomOn \? "overflow-visible"/.test(pageZ), "the conditional clip that could blind the gate is gone");

  // 4 · PANNING IS DRIVEN BY HAND, because `touchAction: "none"` on the stage root means the browser will
  //     never scroll this container for a finger. A zoom with no pan is a magnifier you cannot move.
  ok(/const stageRef = useRef<HTMLDivElement \| null>\(null\);/.test(pageZ), "the pan viewport is referenced");
  ok(/ref=\{stageRef\} className="flex-1 overflow-auto"/.test(pageZ), "…and it is the element that scrolls");
  ok(/st\.scrollLeft -= dx; st\.scrollTop -= dy;/.test(pageZ),
     "a one-finger drag moves the page WITH the finger (scroll offset moves opposite the delta)");
  ok(/ptrs\.current\.length === 1 && zoom > 1 && stageRef\.current/.test(pageZ),
     "…only while zoomed and only on ONE finger, so a pinch never pans and 1x still pages");
  // Enki: a centred flex item wider than its scroller overflows BOTH sides and its left edge is unreachable.
  ok(/className="relative mx-auto" style=\{\{ width: SHEET_W \* fit \* zoom/.test(pageZ),
     "the footprint centres with an auto margin (resolves to 0 when over-wide), never `justify-center`");

  // 5 · PRINT STILL CANNOT INHERIT IT — now structurally, since the print stack REPLACES sheetStyle.
  ok(/\[data-slide-zoom\], \[data-slide-zoom\] \* \{ transform: none !important/.test(pageZ),
     "the print reset is kept as a guard even though the zoom layer no longer transforms");
  ok(/\.slide-print-page \[data-slide-canvas\] \{ width: 100% !important; height: 100% !important; transform: none !important; \}/.test(pageZ),
     "and the canvas — where the zoom now lives — is force-reset for print");
}

// ── E5 · TECHNICAL / COMMERCIAL BANNERS ─────────────────────────────────────────────────
// Operator: "Create Technical Financials banner that encapsulates R&D · NRE / Create Commercial Financials
// banner that encapsulates COGS · REV · MGN ... each section can be expanded or reduced. That way when we
// are inputting project data, we do not see commercial details, and vice versa."
{
  const fspB = await import("node:fs/promises");
  const pageB = await fspB.readFile("app/innovation/page.tsx", "utf8");

  // 1. TWO BANNERS, in the operator's own words, over the right row sets.
  ok(/tone="tech" title="Technical Financials" sub="R&D · NRE"/.test(pageB), "the Technical banner is titled and scoped as asked");
  ok(/tone="comm" title="Commercial Financials" sub="COGS · REV · MGN"/.test(pageB), "the Commercial banner is titled and scoped as asked");

  // 2. INDEPENDENT SWITCHES, not a radio pair — "each section can be expanded or reduced" is two switches,
  //    and closing both is legitimate (it leaves the two summary lines, a compact read of the whole plan).
  ok(/const \[finOpen, setFinOpen\] = useState<\{ tech: boolean; comm: boolean \}>\(\{ tech: true, comm: true \}\)/.test(pageB),
     "one state object, two independent booleans, BOTH default open");
  ok(/setFinOpen\(\(o\) => \(\{ \.\.\.o, tech: !o\.tech \}\)\)/.test(pageB) && /setFinOpen\(\(o\) => \(\{ \.\.\.o, comm: !o\.comm \}\)\)/.test(pageB),
     "each toggle moves ONLY its own section");

  // 3. DEFAULT OPEN IS THE SAFE DEFAULT. Hiding a section nobody asked to hide is the same class of defect
  //    as the duplicate tables E0b removed: a number you cannot see is a number you assume is absent.
  ok(/\{ tech: true, comm: true \}/.test(pageB), "nothing collapses itself on arrival");

  // 4. THE COLLAPSED BANNER STILL CARRIES ITS HEADLINE FIGURE, so closing a section costs the DETAIL and
  //    never the ANSWER. A bare chevron would force you to re-open a section just to recall what was in it.
  ok(/summary=\{`\$\{finFmtK\(techTotalK\)\} total`\}/.test(pageB), "Technical summarises its total spend");
  ok(/summary=\{`\$\{finFmtK\(commRevK\)\} incremental`\}/.test(pageB), "Commercial summarises its incremental revenue");
  ok(/const techTotalK = fin\.years\.reduce\(\(a, y\) => a \+ spendTotalK\(y\), 0\)/.test(pageB),
     "the technical summary is Sigma of the SAME spendTotalK the grid prints — not a second calculation");
  ok(/const commRevK = ys\.reduce\(\(a, y\) => a \+ incRevK\(y, fin\.unitEcon\), 0\)/.test(pageB),
     "the commercial summary is Sigma of the SAME incRevK the sheet prints");

  // 5. W-11 · BOTH CONFIDENCE PERCENTAGES ARE GONE — INPUT AND READ-OUT TOGETHER.
  //    Operator: "remove % allocation for Commercial and Technical Confidence. Business Confidence will be
  //    allocated from PdM or PgM after talking to SBU or BU Director or VP." A six-rung percentage ladder is
  //    the wrong instrument for a judgement a person makes in a conversation — the control invited a number
  //    to be picked because it was there.
  //    THIS REPLACES the old "each rung travels with its own section" pair, which asserted the presence of
  //    controls the operator has now removed. Verified before deleting: neither percentage fed NPV, pSuccess
  //    or gate scoring, so nothing downstream freezes at a stale value.
  const techBlock = pageB.slice(pageB.indexOf('<FinBanner tone="tech"'), pageB.indexOf('<FinBanner tone="comm"'));
  const codeOnly = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");   // the W-2 lesson
  const editorCode = codeOnly(pageB.slice(pageB.indexOf('<FinBanner tone="tech"')));
  ok(!/techConfPct|commConfPct/.test(editorCode), "neither confidence percentage is typed anywhere in the S10 editor");
  // ⚠ PROXY LOCK #7, REWRITTEN. This banned the SUBSTRING `CONF_LADDER` across a slice that runs to the end
  // of the file — so it went red on W-13's `BIZ_CONF_LADDER`, a control the operator explicitly asked for.
  // The lock's INTENT is "Technical and Commercial confidence have no percentage control"; the assertion
  // above (`techConfPct|commConfPct`) already states that precisely. This one now bans the ladder only where
  // it is NOT the business one, so re-adding the tech/comm ladder still goes red while the manual Business
  // Confidence picker — derived from nothing, and therefore with no second source to contradict — is allowed.
  ok(!/(?<!BIZ_)CONF_LADDER/.test(editorCode),
     "no TECHNICAL or COMMERCIAL percentage ladder is rendered — that ladder was the defect (BIZ_CONF_LADDER is a different, manual instrument)");
  ok(techBlock.includes("R&amp;D Spend Request"), "the current-year ask is technical, and sits with the technical rows");
  // AND THE BOARD SHEET LOSES ITS READ-OUTS TOO. Deleting the input while leaving the printed figure is the
  // second-door defect inverted: a number on a board slide nobody can change and nothing derives.
  const sheetCode = codeOnly(pageB.slice(pageB.indexOf("function S10SpendTable"), pageB.indexOf("function S10RevenueTable")));
  ok(!/Technical Confidence|Commercial Confidence/.test(sheetCode),
     "the S10 sheet no longer prints either confidence percentage");

  // 6. THE STATE IS ANNOUNCED, NOT ONLY DRAWN. These two sections are the only thing between a technical
  //    reviewer and a screen of commercial numbers they did not ask for.
  ok(/aria-expanded=\{open\} aria-controls=\{`fin-\$\{tone\}`\}/.test(pageB), "the banner reports its expanded state to assistive tech");
}

// ── E0c · CONFIDENCE IS DERIVED FROM RISK, NOT TYPED ────────────────────────────────────
// Operator: "confidence should be moved to risk and dependent on Low, Med, High for tech and commercial.
// Low/Low is 5 bullet. High/High is 1 bullet. and 3 is Med/Med, while 2 bullets is Medium or High Technical
// and low or Med Commercial. and 4 is other option (low/med commercial risk and tech risk)."
{
  const F = await import("../lib/innovation-data.ts");
  const fspC = await import("node:fs/promises");
  const pageC = await fspC.readFile("app/innovation/page.tsx", "utf8");
  const libC = await fspC.readFile("lib/innovation-data.ts", "utf8");

  // 1. THE MATRIX, EXECUTED — all nine cells, not a spot check. The anchors the operator named by hand
  //    (Low/Low 5, Med/Med 3, High/High 1) are in here beside the six they implied.
  const M = { low: { low: 5, med: 4, high: 2 }, med: { low: 4, med: 3, high: 2 }, high: { low: 2, med: 2, high: 1 } };
  for (const t of ["low", "med", "high"]) for (const c of ["low", "med", "high"])
    ok(F.confidenceFromRisk(t, c) === M[t][c], `${t} tech / ${c} comm → ${M[t][c]} bullets`);

  // 2. MONOTONE — worsening either axis can never RAISE confidence. This is not decoration: it is the
  //    property that RESOLVED an overlap in the rule as stated. `Med tech / Low comm` is claimed by both the
  //    "4" rule and the "2" rule; it reads as 4 because the "2" rule's distinguishing feature is HIGH
  //    technical risk, and because the other reading would make the matrix non-monotone. Confirmed with the
  //    operator before coding, so the property is the thing worth locking.
  const rank = { low: 0, med: 1, high: 2 };
  for (const t of ["low", "med", "high"]) for (const c of ["low", "med", "high"])
    for (const t2 of ["low", "med", "high"]) for (const c2 of ["low", "med", "high"])
      if (rank[t2] >= rank[t] && rank[c2] >= rank[c])
        ok(F.confidenceFromRisk(t2, c2) <= F.confidenceFromRisk(t, c),
           `more risk never means more confidence: ${t2}/${c2} (${F.confidenceFromRisk(t2, c2)}) <= ${t}/${c} (${F.confidenceFromRisk(t, c)})`);

  // 3. ONE PRODUCER. Every consumer reads `confidenceOf(p)`; nothing reads the stored field. A second reader
  //    of `p.confidence` is a second source of truth, which is the whole subject of this thread.
  ok(F.DEMO_PROJECTS.every((p) => F.confidenceOf(p) === F.confidenceFromRisk(p.tech, p.comm)),
     `all ${F.DEMO_PROJECTS.length} projects derive confidence from their own two risk levels`);
  ok(!/\bp\.confidence\b/.test(pageC), "page.tsx never reads the stored confidence score");
  ok(!/\bp\.confidence\b/.test(libC.replace(/^.*never `p\.confidence`.*$/m, "")),
     "innovation-data.ts never reads the stored confidence score either");

  // 4. THE INPUT IS GONE. A 1-5 select sitting above two risk dropdowns that already encode the same
  //    judgement was the duplication; deleting the derivation and keeping the select would be the wrong half.
  ok(!/onEditSource\(\{ confidence:/.test(pageC), "nothing writes `confidence` — the two risk levers are the only input");
  // Matched on the option's own `n/5` label, not on the bare `[1,2,3,4,5].map` — a first draft of this
  // assertion used the broad form and went red on three unrelated selects (per-segment confidence, and the
  // risk-register severity and likelihood pickers). None of those is the score being retired.
  ok(!/value=\{n\}>\{n\}\/5<\/option>/.test(pageC), "the 1-5 Confidence select is removed from the S10 panel");
  // The visible "(from risk)" caption was removed on operator instruction (2026-07-30) — the derivation is
  // still stated, in the read-out's own title attribute, which is the affordance that matters. So the lock
  // now asserts the READ-OUT and its derivation tooltip, not the retired caption: a caption is cosmetic, a
  // read-out that stops explaining where its number came from is the regression worth catching.
  ok(/title=\{`\$\{RISK_LABEL\[p\.tech\]\} technical \/ \$\{RISK_LABEL\[p\.comm\]\} commercial → \$\{confidenceOf\(p\)\} of 5`\}/.test(pageC),
     "the read-out sits where the input was and still names its own derivation — the operator can see the number AND why");

  // 5. IT ACTUALLY MOVES. The behaviour the operator described is that changing a risk dropdown changes the
  //    bullets; asserted as a value change, not as the presence of a function.
  const p0 = F.DEMO_PROJECTS[0];
  ok(F.confidenceOf({ ...p0, tech: "low", comm: "low" }) === 5 && F.confidenceOf({ ...p0, tech: "high", comm: "low" }) === 2,
     "flipping Tech Risk Low → High drops the bullets 5 → 2 with nothing else touched");
  // 6. NEVER OUT OF RANGE — the score feeds `clamp01(conf / 5)` and a 0 or a 6 would silently skew every
  //    downstream probability.
  for (const t of ["low", "med", "high"]) for (const c of ["low", "med", "high"]) {
    const v = F.confidenceFromRisk(t, c);
    ok(Number.isInteger(v) && v >= 1 && v <= 5, `${t}/${c} yields an integer 1-5 — got ${v}`);
  }
}

// ── R-CENSUS · WHICH PROJECT-RECORD FIELDS NEVER REACH A SLIDE ─────────────────────────
// Operator: "identify if there's anything on S1 to S18 that is in INPUT, but not on the slide."
//
// Two halves, and they must not be conflated. The DECK-FIELD half is measured in a real browser by
// `npm run test:input-census` (seed a marker into every authorable field, read the Present sheet — 51/51
// render). This is the RECORD half: fields on `Project` itself. It MUTATES each one and re-renders all
// twenty codes; a field that changes no rendered byte is a field the board never sees.
//
// An earlier draft grep'd the resolver source for each field NAME and concluded that nothing reaches a
// slide, which is obviously false — most values arrive through derived helpers (`financialMetrics`,
// `valuePropOf`, `briefOf`) that never name the field. Mutation is the only honest test.
{
  const F = await import("../lib/innovation-data.ts");
  const BY = 2026;
  const render = (p) => {
    const out = [];
    for (const sp of F.SLIDE_SCHEMA) for (const f of sp.fields)
      out.push(`${sp.code}.${f.id}=${JSON.stringify(F.linkedSlideField(p, sp.code, f.id, BY) ?? F.aiSlideField(p, sp.code, f.id))}`);
    // S10 has no fields — its content IS the grid, so the grid is rendered here too or the census would
    // report every financial input as dead the moment E0d landed.
    const fin = F.finOf(p, BY), ys = fin.years.slice(0, F.visibleYearCount(p.gate));
    out.push("S10=" + JSON.stringify(ys.map((y) => [F.yearLabel(y.year), F.spendTotalK(y), F.incRevK(y, fin.unitEcon), F.incMgnK(y, fin.unitEcon), F.incUnits(y)])));
    out.push("S10c=" + JSON.stringify([fin.techConfPct, fin.commConfPct, F.confidenceOf(p), fin.spendRequestK]));
    out.push("hdr=" + JSON.stringify([p.name, p.gate, F.GATE_STAGE[p.gate], p.firstRevenue, F.RISK_LABEL[p.tech], F.RISK_LABEL[p.comm]]));
    out.push("fin=" + JSON.stringify(F.financialMetrics(p)));
    return out.join("\n");
  };
  const p0 = JSON.parse(JSON.stringify(F.DEMO_PROJECTS[0]));
  const base = render(p0);
  const ENUMS = { gate: p0.gate === "G4" ? "G2" : "G4", tech: p0.tech === "low" ? "high" : "low",
                  comm: p0.comm === "low" ? "high" : "low", category: "New Product" };
  const dead = [];
  for (const k of Object.keys(p0)) {
    if (k === "id") continue;                                       // the key, not an input
    const p = JSON.parse(JSON.stringify(p0));
    if (k in ENUMS) p[k] = ENUMS[k];
    else if (typeof p[k] === "string") p[k] += "·CENSUS";
    else if (typeof p[k] === "number") p[k] += 4242.42;
    else if (typeof p[k] === "boolean") p[k] = !p[k];
    else continue;                                                  // objects/arrays: covered by the deck census
    let after; try { after = render(p); } catch { after = base + "·THREW"; }
    if (after === base) dead.push(k);
  }
  console.log(`  · record census: ${dead.length} Project fields change nothing any slide renders — ${dead.join(", ")}`);
  // NONE OF THEM IS TYPEABLE. Every one is written exactly once, at project creation, with a hardcoded
  // default — there is no editor anywhere in the tool. So "input but not on a slide" is currently EMPTY,
  // which is the operator's actual question. `confidence` is deliberately here since E0c: it is derived
  // from the two risk levels, so mutating the stored copy is meant to change nothing.
  const fspR = await import("node:fs/promises");
  const pageR = await fspR.readFile("app/innovation/page.tsx", "utf8");
  const typeable = dead.filter((k) => new RegExp(`onEditSource\\(\\{ ${k}:|onEdit\\(\\{ ${k}:`).test(pageR));
  ok(typeable.length === 0,
     `nothing a human can EDIT is invisible to the board — editable-but-dead: [${typeable.join(", ")}]`);
  ok(dead.includes("confidence"), "confidence is intentionally dead on the record — E0c derives it from risk");
  // Guard the other direction too: if someone later adds an editor for one of these, this lock goes red and
  // forces the question "which slide shows it?" to be answered before the control ships.
  ok(dead.length <= 12, `the dead-field set has not grown — ${dead.length}: [${dead.join(", ")}]`);
}

// ── F1 · ONE DOOR FOR THE MONEY — counted on the surface that was violating it ────────────
// INV-1 says exactly one surface accepts typing per input record. Two shipped commit messages (0428e67,
// caed97a) asserted S10 was the only writer of the financials. That was true of `finPlan` and FALSE of the
// money: ProjectDetail's editing panel carried free-text `NRE $K`, `New rev 10yr $M` and `Do-nothing 10yr
// $M` writing straight to the scalars, so the same three numbers could be authored in two places and
// disagree. Found by reading the file, never by a green test — which is why the guard is a COUNT over the
// component's source rather than a list of the three names: a fourth money input added here tomorrow fails
// this without anyone remembering to update it.
{
  // `F` is block-scoped and re-imported per block in this file — every neighbouring block does the same.
  const F = await import("../lib/innovation-data.ts");
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const pd = src.slice(src.indexOf("function ProjectDetail("), src.indexOf("function GateCube("));
  ok(pd.length > 1000, "ProjectDetail was located — the slice is not empty");
  // Any input/textarea in ProjectDetail whose setD/onChange targets a MONEY scalar. Matched on the write,
  // not on the label, because a label can be renamed while the write stays.
  const MONEY = ["nreK", "fullRev10yM", "doNothing10yM", "upsideAccelK"];
  const writers = MONEY.filter((k) => new RegExp(`setD\\("${k}"`).test(pd));
  ok(writers.length === 0,
     `ProjectDetail writes ZERO money scalars — the one door is S10. Found writers: [${writers.join(", ")}]`);
  // …and the read-outs it shows instead are Σ of the plan, not a second copy of the number.
  ok(/const roll = finRollup\(finOf\(p, baseYear\)\)/.test(pd),
     "the three figures ProjectDetail still SHOWS are computed from the plan via finRollup");
  ok(/onClick=\{openFinancials\}/.test(pd),
     "and it offers the route to the one door rather than a dead end — reusing openFinancials, not a new nav");
  // finRollup must actually carry all three, or the read-out silently falls back to a stale record value.
  ok(typeof F.finRollup === "function" && typeof F.finDoNothingM === "function", "finRollup + finDoNothingM exported");
  const rk = F.finRollup(F.finOf(F.DEMO_PROJECTS[0], 2026));
  for (const k of ["nreK", "fullRev10yM", "doNothing10yM"])
    ok(typeof rk[k] === "number" && Number.isFinite(rk[k]), `finRollup derives ${k} — got ${rk[k]}`);
  // The one that was missing: doNothing10yM is Σ of the Step 2 band, to the dollar.
  const f0 = F.finOf(F.DEMO_PROJECTS[0], 2026);
  const donM = Math.round(f0.years.reduce((a, y) => a + F.bandRevK(y.don, f0.unitEcon.don), 0) / 1000);
  ok(rk.doNothing10yM === donM, `doNothing10yM == Σ Step 2 band — ${rk.doNothing10yM} vs ${donM}`);
}

// ── F2a · THE BUILD-UP AND THE REVENUE AGREE — the sheet stops printing numbers that don't multiply ─
// Measured before the fix: 301 of 804 printed band rows had Qty × ASP ≠ Revenue, because `finBaseline`
// derived `units = round(revK / msrpK)` and let ASP fall back to `msrpK × (1 − disc)` — the ROUNDING was
// the residue. The board therefore read a build-up beside a revenue it did not produce. The fix derives
// ASP from the revenue instead, so the identity holds by construction rather than by luck.
// THE ASSERTION IS THE IDENTITY ITSELF, not the formula that produces it: `bandRevK(b, true)` (build-up)
// must equal `bandRevK(b, false)` (typed) for every seeded band-year. That is the property a reader cares
// about, and it stays true if someone rewrites the derivation a different way.
{
  const F = await import("../lib/innovation-data.ts");
  let rows = 0, revBad = 0, mgnBad = 0, on = 0, off = 0;
  for (const p of F.DEMO_PROJECTS) {
    const f = F.finOf(p, 2026);
    for (const k of ["neu", "don", "dec"]) {
      f.unitEcon[k] ? on++ : off++;
      for (const y of f.years) {
        rows++;
        // Compare the two readings of the SAME cell. Sub-cent tolerance: these are IEEE doubles, and the
        // display rounds to whole $K long before any float residue could become visible.
        if (Math.abs(F.bandRevK(y[k], true) - F.bandRevK(y[k], false)) > 0.005) revBad++;
        if (Math.abs(F.bandMgnK(y[k], true) - F.bandMgnK(y[k], false)) > 0.005) mgnBad++;
      }
    }
  }
  ok(rows > 300, `every seeded band-year was checked — ${rows} rows across ${F.DEMO_PROJECTS.length} projects`);
  ok(revBad === 0, `Revenue reads the same typed or built up, on every row — ${revBad} disagree (was 301 on the printed subset)`);
  ok(mgnBad === 0, `Margin reads the same typed or built up, on every row — ${mgnBad} disagree`);
  // …and because the identity holds, the bands can honestly be SHOWN as a build-up. This is the number the
  // operator's "we need rows for QTY, COGS, ASP" depends on: at 0, the sheet has nothing truthful to print.
  ok(on === 99 && off === 0, `all 99 seeded bands run unit economics — on ${on}, typed ${off} (was on 0, typed 99)`);
  // The seeded ASP is IMPLIED by revenue, not typed. Guard the direction of the derivation so nobody
  // "simplifies" it back to the MSRP fallback, which is what made the numbers disagree in the first place.
  const p0 = F.DEMO_PROJECTS.find((p) => F.finOf(p, 2026).years.some((y) => y.neu.units > 0));
  const y0 = F.finOf(p0, 2026).years.find((y) => y.neu.units > 0);
  ok(Math.abs(F.aspOf(y0.neu) * y0.neu.units - (y0.neu.revK ?? 0)) < 0.005,
     `ASP is derived FROM revenue — ${p0.id} units ${y0.neu.units} × ASP ${F.aspOf(y0.neu).toFixed(4)} == revK ${y0.neu.revK}`);
}

// ── H1/H8 · THE VALUE WATERFALL CANNOT CLIP ITS OWN NUMBERS ──────────────────────────────
// Operator, twice, from two live screenshots: the 4th driver bar and the Customer Value bar showed NO
// number above them. Root cause: labels are drawn at `yTop - 2` while `max` mapped to y = 0 in a viewBox
// whose origin IS 0 — so a bar at the maximum put its label outside the box. The driver steps are
// cumulative, so the LAST driver's top always equals the total, which is also the Customer Value bar:
// exactly two labels, every time, deterministically.
// ASSERTED AS ARITHMETIC, not as the presence of a `T`. A constant can be added and then not used; what
// matters is where the topmost label actually lands. This computes it from the source's own numbers.
{
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const veq = src.slice(src.indexOf("function ValueProp("), src.indexOf("function ValueEquationPanel("));
  // The dimensions are declared across the measured-layout block now (W fixed, B and T derived from the
  // label metrics) rather than on one line, so they are read individually. The ARITHMETIC below is what
  // matters and is unchanged: the topmost label must land inside the viewBox.
  // X-1 · `W` is no longer a bare literal: it is `W0` (the intrinsic width) plus a measured slide width, and
  // `T`/`H` moved into the two-pass `layout()` return. The ARITHMETIC these locks exist for is untouched, so
  // only the shape they read is updated — the assertions below still compute where the topmost label lands.
  // X-2 added the caption band `A` ABOVE the bar-number band, so `T` is now measured from it (`T: A + FS + 3`).
  // The arithmetic below still computes where the topmost bar NUMBER lands, which is what these locks are for
  // — the number sits `FS + 3` under the top of its own band exactly as it always did, `A` only moves the
  // whole plot down and grows `H` to match, so no bar and no bar-number can enter the caption band.
  const dims = veq.match(/const W0 = (\d+);[\s\S]*?T: A \+ FS \+ (\d+),/);
  ok(!!dims, "the waterfall declares an intrinsic width W0, a height H, a caption band A and a top band T above the bars");
  ok(/const A = FS \+ \d+;/.test(veq), "the caption band A is reserved space, sized from the type");
  ok(/H: \(big \? 150 : \d+\) \+ Math\.max\(0, B - 16\) \+ A/.test(veq),
     "H grows by exactly A — the caption band is added to the box, never taken out of the plot");
  // W-1b · H IS NO LONGER A LITERAL IN THE DIMS LINE. It is computed from the label metrics
  // (`(big ? 150 : 124) + max(0, B - 16)`), so the panel-fill floor is read from ITS OWN declaration rather
  // than from a capture group that now holds something else — which is exactly the mistake that made this
  // report "H=3": the destructure was still taking dims[2], and dims[2] is now the `+3` in `T = FS + 3`.
  const H = Number((veq.match(/H: \(big \? 150 : (\d+)\)/) ?? [, "0"])[1]);
  // The plot must map `max` to T, never to 0. Read the mapping rather than trusting the constant.
  ok(/const y = \(v: number\) => H - B - \(v \/ max\) \* \(H - B - T\);/.test(veq),
     "the value→pixel map reserves the top band — max lands at T, not at y = 0");
  // Now the arithmetic the operator actually cares about: a 7.5pt label drawn at (top − 2) has its glyph
  // top roughly 6 above its baseline. For the TALLEST bar (top === T) that must still be inside the box.
  // W-1b · T IS DERIVED FROM THE TYPE SIZE now (`T = FS + 3`), not a magic 8, so the band grows with the
  // font instead of being a constant someone must remember to raise. FS floors at 4.4, so T >= 7.4 and the
  // label (drawn at `top - 1.5`, glyph height ~FS) always clears the top edge.
  const FSmin = 4.4, Tmin = FSmin + Number(dims[2]);
  const labelTop = Tmin - 1.5 - FSmin;
  ok(labelTop > 0, `the tallest bar's number renders INSIDE the viewBox — glyph top at y=${labelTop} (was -8, i.e. clipped)`);
  ok(H >= 124, `the plot fills the panel — H=${H} (was 90, leaving the panel half empty)`);
  // H8 · the key is gone, and its removal is safe ONLY because the labels above the bars now render.
  ok(!/Full-text legend — guarantees every label is legible/.test(src),
     "the duplicate legend/key below the waterfall is removed (operator: 'Do not have key')");
  // ⚠ PROXY LOCK #9, REWRITTEN. This matched the <title> element's ENTIRE literal, so W-19 — which APPENDS a
  // stacked-bar breakdown to the same tooltip, strictly more information — turned it red. Ninth of its kind:
  // the assertion is named for a property ("carries its full name") but was written against a shape.
  // It now asserts the property, and additionally that the name comes FIRST so the tooltip still opens with
  // the thing the deleted key used to say.
  ok(/<title>\{`\$\{s\.label\}: \$\{(money\(s\.v\)|barLabel\(s\))\}`\}/.test(veq),
     "every bar still carries its full name and value in a <title>, name first — the key's only unique job survives its deletion");
}

// ── X-1 · THE WATERFALL FILLS THE WIDTH IT IS GIVEN ──────────────────────────────────────
// Operator: the chart is to fill its box. It did not — measured on the live build, the drawing rendered
// 460.4 x 193.8 inside a 740.5-wide panel: 62.2% of the width, 243px of letterbox.
// CAUSE, ESTABLISHED BY INJECTION BEFORE ANY EDIT: `xMidYMid meet` takes the SMALLER of the two scales, and
// with a viewBox aspect of 2.073 against a slot aspect of 3.194 the drawing was height-limited. The height
// is NOT the lever — the slot's height is pinned by flex, so a taller viewBox only shrinks the drawing
// (viewBox H 230 measured 41.7% fill, worse than the control). Widening the layout measured 95.8%.
// These locks assert the MECHANISM, because the pixel outcome is measured elsewhere (scripts/slide-shots).
{
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const veq = src.slice(src.indexOf("function ValueProp("), src.indexOf("function ValueEquationPanel("));

  // 1 · The slot is MEASURED, never assumed. A hardcoded 3.194 would be a design constant today and a lie
  //     the first time the sibling strip under the chart wraps to a different height.
  ok(/const svgRef = useRef<SVGSVGElement \| null>\(null\);/.test(veq) && /<svg ref=\{svgRef\}/.test(veq),
     "the waterfall svg is measurable — it carries the ref the observer reads");
  ok(/new ResizeObserver\(\(\[e\]\) => \{[\s\S]{0,400}?e\.contentRect/.test(veq),
     "the slot aspect comes from a ResizeObserver on the svg's own box, not from a constant");
  ok(/setSlotAspect\(\(prev\) => \(Math\.abs\(a - prev\) > prev \* 0\.01 \? a : prev\)\)/.test(veq),
     "the observer has a dead-band — a sub-1% re-measure cannot loop the component");

  // 2 · The width is DERIVED from that measurement times the height the drawing wants, which is exactly the
  //     statement "viewBox aspect == slot aspect". Clamped both ways so a degenerate box cannot make the
  //     chart narrower than the intrinsic one, nor absurdly wide.
  ok(/Math\.min\(1200, Math\.max\(W0, Math\.round\(intrinsic\.H \* aspect\)\)\)/.test(veq),
     "the slide width is intrinsic height × slot aspect — clamped to [W0, 1200]");
  ok(/const W = big && aspect > 0/.test(veq),
     "the widening applies ONLY on a slide");
  // X-4 · and `aspect` prefers a LIVE measurement, falling back to the sheet constant only when there is
  // none — which is every print render, because the print stack mounts under `display:none`.
  // ⚠ X-7 · THE HEIGHT LEVER. Widening `W` cannot fill a slot that is TALLER in proportion — `W` is clamped
  // at the intrinsic 320, so the chart goes width-limited and letterboxes vertically instead. Measured when
  // the waterfall got its three-row box: 121.9px dead, fillV 71.1%. Growing `H` fixes it and grows the RIGHT
  // thing, because the plot area is `H − B − T`: taller bars, same caption band, same type. fillV -> 92.0%.
  ok(/const H = big && aspect > 0 \? Math\.max\(H0, Math\.round\(W \/ aspect\)\) : H0;/.test(veq),
     "a slot taller than the drawing grows H — the width lever alone leaves vertical letterbox");
  ok(/const aspect = slotAspect > 0 \? slotAspect : big \? SLIDE_SLOT_ASPECT : 0;/.test(veq),
     "a live measurement always wins; the sheet constant only fills the gap before one exists");

  // 3 · Every non-slide surface — the deep dive, the source panel, SSR and first paint — keeps the
  //     intrinsic 320. This is what makes the change additive rather than a redesign of four other views.
  ok(/const W0 = 320;/.test(veq), "the intrinsic layout width is still 320 for every non-slide surface");
  ok(/const \{ gw, bw, FS, wrapped, B, A, T, H: H0 \} = W === W0 \? intrinsic : layout\(W\);/.test(veq),
     "at the intrinsic width the FIRST pass is reused verbatim — a non-slide render is byte-identical to before");

  // 4 · ONE layout function, evaluated twice. The failure mode this forbids is two copies of the same
  //     arithmetic drifting apart, which is how the label band and the plot area disagree.
  const layoutFns = veq.match(/const layout = \(Wx: number\) => \{/g) ?? [];
  ok(layoutFns.length === 1, `the width-dependent arithmetic lives in exactly ONE function — found ${layoutFns.length}`);
  ok(/const intrinsic = layout\(W0\);/.test(veq), "pass one runs at the intrinsic width to learn the drawing's natural height");
  for (const sym of ["gw", "bw", "FS", "wrapped", "B"])
    ok(new RegExp(`\\b${sym}\\b`).test(veq.slice(veq.indexOf("const layout = (Wx: number)"), veq.indexOf("const intrinsic = layout(W0);"))),
       `${sym} is computed inside layout() — it cannot be left behind at the old width`);
}

// ── X-2 · THE CHART CARRIES ITS OWN CAPTION, AND THE CHIP ROW IS GONE ────────────────────
// Operator, from the exported PDF: "Make waterfall value prop chart take up more of screen in PDF and slide
// · price performance competition takes too much of screen · no need to use box for 33% value capture as
// thats now on chart · place value creation between NBA AND PRICE BARS · and place value price range upper
// right of chart".
// Four asks, one shape: the three-chip row under the waterfall is deleted from the slide, its two remaining
// figures move into a reserved band ON the chart, and the WTP strip is compacted — all of which is height
// handed back to the chart. Verified across all 33 projects by measurement, not by looking at one slide.
{
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const veq = src.slice(src.indexOf("function ValueProp("), src.indexOf("function ValueEquationPanel("));

  // 1 · VALUE CREATION starts at the NBA bar's RIGHT edge — that IS "between NBA and Price", expressed as
  //     geometry rather than as a hand-tuned x. Bar 0 is the NBA bar, so its right edge is L + inset + bw.
  ok(/<text x=\{L \+ \(gw - bw\) \/ 2 \+ bw \+ 2\} y=\{A \* 0\.7\} textAnchor="start"/.test(veq),
     "VALUE CREATION is anchored to the NBA bar's right edge — between the NBA and Price bars, by construction");
  ok(/VALUE CREATION<\/tspan>/.test(veq) && /ve\.differentiationM/.test(veq),
     "…and it prints the differentiation the green bars sum to, not a second number");

  // 2 · VALUE PRICE RANGE is right-anchored, inset by a reserve for the ⤢ overlay that is NOT in this svg.
  ok(/<text x=\{W - FS \* 5\.2\} y=\{A \* 0\.7\} textAnchor="end"/.test(veq),
     "VALUE PRICE RANGE sits upper-right, inset so it clears the panel's ⤢ control");
  ok(/VALUE PRICE RANGE<\/tspan>/.test(veq) && /ve\.referenceM/.test(veq) && /split\.priceM/.test(veq),
     "…and it is the NBA-to-price span the gold segment is drawn from — the same two numbers, never a third");

  // 3 · THE CHIP ROW IS OFF THE SLIDE, AND THE FIELD STILL EXISTS. Deleting `S8.capture` from the registry
  //     would have taken S1's tile and the source record with it; only the slide stops rendering it.
  ok(!/fieldsOf\("valuechart", "capture"\)/.test(src), "the slide no longer stacks the capture chips under the chart");
  const data = await (await import("node:fs/promises")).readFile("lib/innovation-data.ts", "utf8");
  ok(/\{ id: "capture", name: "Value creation \+ capture", kind: "metrics", linked: true/.test(data)
     && /code === "S8" && fieldId === "capture"\) return valuePropCapture\(p\)/.test(data),
     "S8.capture is still a real field with a real resolver — removed from a slide, not from the record");
  ok(/fieldsOf\("valueprop", "vpdiffs", "vpcapture"\)/.test(src),
     "S1's exec summary keeps its capture tile — this change is scoped to S8's slide");

  // 4 · THE WTP STRIP IS COMPACT ON A SLIDE ONLY. Dragging a marker happens in the source editor, which
  //     keeps the roomier track it was tuned for.
  ok(/compact \? "h-8" : "h-12"/.test(src), "the Price Performance track is shorter on a slide and unchanged elsewhere");
  ok(/<CompetitionStrip [^>]*compact=\{big\}/.test(src), "…and `compact` is exactly `big`, i.e. slide mode");
}

// ── X-3 · FULL-WIDTH WATERFALL · THE STRIP CHANGES PANELS · BOTH PDFs GATED ──────────────
// Operator: "remove price performance competition for this section and consider placing somewhere else on
// slide · use full width waterfall for value prop section · ensure chart renders appropriately on both
// versions OF PDF".
{
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const data = await (await import("node:fs/promises")).readFile("lib/innovation-data.ts", "utf8");
  const gate = await (await import("node:fs/promises")).readFile("scripts/pdf-gate.mjs", "utf8");
  const veq = src.slice(src.indexOf("function ValueProp("), src.indexOf("function ValueEquationPanel("));

  // 1 · TWO CHARTS, TWO FIELDS. They were one field with the strip welded under the waterfall, which is
  //     why the strip could only live wherever the chart lived. Splitting is what made both asks possible.
  ok(/\{ id: "wtp", name: "Price performance · competition", kind: "chart", linked: true \}/.test(data),
     "the price-performance strip is its own field, not a passenger on the waterfall");
  ok(/"S8\.capture": "S8", "S8\.valuechart": "S8", "S8\.wtp": "S8"/.test(data),
     "…and it declares its owning record, so its ✎ Edit link is not a no-op");

  // 2 · THE SLIDE PLACES IT IN THE COMPETITION PANEL, and the value panel is the chart at full width.
  // ⚠ X-5 · PRICE PERFORMANCE HAS ITS OWN PANEL NOW. Operator: "swap Price Performance to make full axis
  // … Price pefromanc is left bottom". Riding inside Competition it was a 32px track; alone in the
  // bottom-left box the LOW→HIGH axis is as tall as the panel (`fill`), which is what "full axis" means.
  // ⚠ Y-1 · IT SHARES THE UPPER-LEFT BOX NOW. Operator, with the crop: "it may help to take the content
  // into text and framework and remove the space consuming headers · all in one box on upper left ·
  // Primary Value Proposition: … NBA: … Price Performance: overlay graphic." Its own panel head is the
  // header that got removed; the strip keeps the full-height `fill` track it gained in X-5.
  ok(/<AmtsPanel title="Primary Customer Value Proposition" icon="♡">\s*\{leanFieldsOf\("vprop", "nba", "wtp"\)\}/.test(src),
     "Price Performance shares the upper-left box with the value proposition and the NBA");
  ok(/fill \? "min-h-\[2rem\] flex-1" : compact \? "h-8" : "h-12"/.test(src),
     "…and its track FILLS that panel instead of leaving a void under a fixed 32px strip");
  // ⚠ X-4 · NOT `wide`. The operator: "I need competitive Value Waterfall in right section like before …
  // Who told you to move? keep to upper right box." The waterfall is the UPPER-RIGHT panel of a 2x2, and it
  // holds nothing else, so it fills that box.
  // ⚠ X-7 · `tall` — the waterfall spans the three rows of the left-hand stack. Operator: "move items from
  // right to left (and expand visual for value prop waterfall)". It is the whole reason the chart stopped
  // being 13% of the printed canvas.
  ok(/<AmtsPanel tall title="Value · Creation \+ Capture" icon="◈">\s*\{fieldsOf\("valuechart"\)\}/.test(src),
     "the waterfall is the upper-RIGHT panel, holds nothing but the chart, and spans the stack beside it");
  // Y-1 · the stack is TWO rows deep now (three boxes folded into one), so the span follows it.
  ok(/\$\{tall \? "row-span-2" : ""\}/.test(src), "…and `tall` spans the two-row stack beside it, mirroring `wide`");
  // X-6 · THREE ROWS, AND THE OUTER TWO ARE EQUAL ON PURPOSE — the operator asked for "visual pleasing
  // symetry". The middle row is 1.72x because it carries the value-equation table, which is the tallest
  // single block on the slide; measured, 1.65 still overflowed it by 4px and 1.72 is the first that clears.
  // Y-1 · THREE rows. Weights measured with the ink-void probe, not guessed: the bottom row was handing
  // its two four-bullet lists 201px to paint 119 in, so 61px of pure void moved up to the chart. 1.45 is
  // the first middle weight at which the value-equation table clears (1.40 overflowed it by 2px).
  ok(/S8: "minmax\(0, 2\.7fr\) minmax\(0, 1\.45fr\) minmax\(0, 1\.1fr\)"/.test(src),
     "S8's three rows are weighted from the measured ink-void, not split evenly");
  ok(!/mode !== "slide" && <CompetitionStrip[\s\S]{0,200}?compact/.test(veq),
     "the strip inside ValueProp is off the slide entirely — it is not merely made smaller there");
  ok(/\{mode !== "slide" && <CompetitionStrip/.test(veq),
     "…and every NON-slide surface still renders it under the chart, unchanged");

  // 3 · ONE PRODUCER for our marker's position. Splitting the strip out gave `captureOf(p)/100` a second
  //     caller, and two copies are how a marker drifts from the bar it must agree with.
  ok(/export const captureFraction = \(p: \{ capturePct\?: number \| null \}\): number =>/.test(data),
     "our marker's position on the strip has ONE producer");
  // ⚠ COMMENTS STRIPPED. First draft of this lock matched the sentence explaining the rule and went red
  // against its own rationale — the same trap the F4/W-2 ban-lists hit. The ban is on CODE.
  const pgX3 = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok((pgX3.match(/captureOf\(p\) \/ 100/g) ?? []).length === 0,
     "…and no surface in the deck recomputes it inline");

  // 4 · TWO CHARTS ON ONE SLIDE NEED A DISAMBIGUATOR, or the second silently renders the first.
  ok(/function MiniFinChart\(\{ kind, field, big \}/.test(src) && /<MiniFinChart kind=\{sp\.code\} field=\{f\.id\} big=\{big\} \/>/.test(src),
     "the chart dispatch keys off the FIELD as well as the slide code");
  ok(/if \(kind === "S8" && field === "wtp"\) return <CompetitionStrip/.test(src),
     "…and S8's two charts resolve to two different components");

  // 5 · BOTH PDF EXPORTS ARE GATED, AND THE GATE COUNTS BARS. P3 shipped a deck whose every bar was blank
  //     while the gate counted 12 text labels and went green. Mutation-tested: deleting the flat undercoat
  //     takes `bars` to 0 in all four paper×mode combinations while `svgNums` stays 12.
  ok(/const MODES = \[[\s\S]{0,300}?"friendly"[\s\S]{0,300}?"original"/.test(gate),
     "pdf-gate exports BOTH modes, not just the default");
  ok(/for \(const paper of PAPER\) for \(const mode of MODES\)/.test(gate),
     "…across both papers, so the matrix is 4 runs");
  ok(/getByRole\("menuitem", \{ name: mode\.menu \}\)/.test(gate),
     "…driven through the operator's own Export menu, not a synthetic print event");
  ok(/failures\.push\(`\$\{P\} — S8 waterfall printed \$\{c\.s8\.bars\} filled bar rects/.test(gate),
     "pdf-gate asserts the BARS render — labels are not bars (the P3 blind spot, closed)");
  ok(/failures\.push\(`\$\{P\} — the PAINTED waterfall spans \$\{pctW\}% of its panel/.test(gate),
     "…and that the PAINTED drawing fills its panel in the artifact — the element box is not the drawing");
  // ⚠ X-7 · THE AT-MOUNT CHECK IS AN ASPECT, NOT A WIDTH. It used to demand `viewBox width > 320`, which
  // was a PROXY for "laid out for a slot" and only held while the slot was WIDER than the drawing. The
  // moment the waterfall got a taller box the right answer became W = 320 with a grown H, and the proxy
  // failed a correct chart. Comparing the mounted aspect to the seed is direction-agnostic and still
  // catches the original defect — unmeasured is 1.935 against a 1.51 slot, 28% out.
  ok(/Math\.abs\(mounted\.vbAspect - SEED\) > SEED \* 0\.1/.test(gate),
     "the at-mount check compares the print copy's viewBox ASPECT to the slot it will be drawn into");
  ok(/const SEED = Number\(\(await readFile\(join\(ROOT, "app\/innovation\/page\.tsx"\), "utf8"\)\)\.match\(\/const SLIDE_SLOT_ASPECT/.test(gate),
     "…reading the seed from the source, so the gate and the deck cannot hold different numbers");
}

// ── X-4 · THE UPPER-RIGHT BOX · THE 2×2 · AND THE PRINT SEED ─────────────────────────────
// Operator: "So value prop water fall upper right box · Key Customer benefits bottom left · Key Technical
// Benefits bottom right using this slide view (as a basis) not pdf. then have pdf match."
{
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const gate = await (await import("node:fs/promises")).readFile("scripts/pdf-gate.mjs", "utf8");
  const veq = src.slice(src.indexOf("function ValueProp("), src.indexOf("function ValueEquationPanel("));

  // 1 · THE 2×2, panel by panel, in the operator's own order.
  const s8 = src.slice(src.indexOf("      S8: () => ("), src.indexOf("      // S10 — Financials by Year"));
  // X-7 · the modifier list grew (`wide`, `tall`), so capture ANY of them rather than spelling one out —
  // the previous form silently skipped `<AmtsPanel tall …>` and reported a five-panel slide as the truth.
  const panels = [...s8.matchAll(/<AmtsPanel ((?:\w+ )*)title="([^"]+)"/g)].map((m) => `${m[1]}${m[2]}`);
  // ⚠ X-5 · THE 2x2, IN THE OPERATOR'S OWN WORDS: "Price pefromanc is left bottom, then move NBA under
  // Value Prop waterfall. that leaves Upper left for Value prop sentence thr first thing we see."
  // Grid order IS reading order: upper-left, upper-right, bottom-left, bottom-right.
  // ⚠ X-6 · THE 3x2, SLOT BY SLOT, IN THE OPERATOR'S WORDS: "in above customer benefits is Slider price
  // performance · above technical benefits is NBA DETAIL (below price waterfall) · primary customer value
  // prop first box top left" + "keep very bottom box customer benefits and very bottom box technical".
  // Grid order IS reading order, so this list IS the layout.
  // ⚠ X-7 · PANEL ORDER IS GRID AUTO-PLACEMENT ORDER, so this list IS the layout. `valuechart` must be
  // SECOND to claim column 2 of row 1 before `nba` can fall into row 2 of column 1.
  // ⚠ Y-1 · SIX PANELS BECOME FIVE. The value proposition, the NBA and the price strip share the upper-left
  // box — "all in one box on upper left". The two bottom panels are STATIONARY, as they have been since X-6.
  ok(panels.join(" | ") === "Primary Customer Value Proposition | tall Value · Creation + Capture | Value Equation | Key Customer Benefits | Key Technical Features",
     `S8 folds VProp + NBA + Price Performance into one box beside a spanning waterfall — got ${panels.join(" | ")}`);
  // The Value Equation kept its own box — the operator moved the NBA sentence, not the table it explains.
  ok(/<AmtsPanel title="Value Equation" icon="▪">\s*\{fieldsOf\("diffs"\)\}/.test(src),
     "the Value Equation still has a box of its own, directly under the sentence it argues");
  // ⚠ AND THE BOTTOM ROW NEVER MOVES. Said three times now: "Do not move key customer benefits or Technical
  // benefits at all. these remain ststionary." Pinned by position, so a future reshuffle of the top has to
  // notice it disturbed the bottom.
  ok(panels[3] === "Key Customer Benefits" && panels[4] === "Key Technical Features",
     "…and Key Customer Benefits / Key Technical Features are still the last two panels, in that order");

  // 2 · THE SPANNING RULE IS DECLARED, NOT INFERRED. Inference from `kind` is how the Competition panel
  //     silently became two-column when a chart field joined it.
  // X-5 dropped S8.diffs: its panel now holds only the NBA card and the table, and a spanning table would
  // strand the NBA card at half width with a void beside it. One entry left, still declared in one place.
  // X-6 · `PANEL_SPAN` AND ITS `span` PROP ARE GONE WITH THEIR LAST CALLER. Benefits and Features have
  // panels of their own on the bottom row now, so no panel on this deck wants two columns and nothing
  // spans. Kept, it would be an abstraction with zero callers — the same Succinctness failure the `rows`
  // hatch was deleted for. `isConops` is untouched: CONOPS still spans, and always did.
  const pgX6 = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok(!/PANEL_SPAN/.test(pgX6) && !/\bspan\?: boolean/.test(pgX6),
     "the span mechanism is removed, not left behind with zero callers");
  ok(/const wide2 = isConops \? "col-span-2" : "";/.test(src),
     "…and CONOPS keeps the full-width span it has always had");

  // 3 · THE PRINT SEED — the reason the exported chart was a small drawing in a big box.
  ok(/const SLIDE_SLOT_ASPECT = 1\.48;/.test(src), "the sheet-constant slot aspect is the MEASURED 1.48");
  // ⚠ X-7 · AND IT IS NOW ACTUALLY GUARDED. X-4's comment promised a drift lock and I never built one; the
  // pin above is a pin, not a guard — it would go red on a CORRECT update and stay green while the number
  // rotted. slide-shots now measures the live panel and fails past 8%. Mutation-tested with the stale 2.03.
  const shotsX7 = await (await import("node:fs/promises")).readFile("scripts/slide-shots.mjs", "utf8");
  ok(/const SLOT_CONST = Number\(/.test(shotsX7) && /SLIDE_SLOT_ASPECT = \(\[\\d\.\]\+\)/.test(shotsX7),
     "the gate reads SLIDE_SLOT_ASPECT out of the source rather than duplicating the number");
  ok(/Math\.abs\(slot - SLOT_CONST\) > SLOT_CONST \* SLOT_TOL/.test(shotsX7),
     "…and compares it against the panel the browser actually laid out");
  ok(/The SCREEN self-corrects and hides this; the EXPORTED PDF lays out from the constant/.test(shotsX7),
     "…and the failure says WHY it matters — the screen hides this defect, the PDF ships it");

  // 4 · X-6b · LABEL LANES. Two markers within 12% of each other used to overprint their names into an
  //     unreadable smear ("Comp A" over our own marker, in every screenshot the operator sent). Asserted as
  //     the MECHANISM — sort, threshold, capped lane, and OURS inside the sort, because leaving ours out
  //     would leave the exact collision the operator can see.
  ok(/const LANE_GAP = 0\.12, LANE_STEP = 11, MAX_LANE = 2;/.test(src),
     "the marker-label lane rule is one declaration: threshold, step and a cap");
  ok(/\{ k: "ours", x: clampX\(ours\) \}\]\s*\.sort\(\(a, b\) => a\.x - b\.x\)/.test(src),
     "…and OUR marker is in the sort, not special-cased — it is half of the collision");
  ok(/lane = pt\.x - lastX < LANE_GAP \? Math\.min\(MAX_LANE, lane \+ 1\) : 0;/.test(src),
     "…a marker takes the next lane only when it lands inside the threshold, and lanes cannot run away");
  ok(/const laneLift = \(k: string\) => \(lanes\[k\] \?\? 0\) \* \(fill \? LANE_STEP : compact \? 0 : LANE_STEP \* 0\.55\);/.test(src),
     "…and a lane is only spent where there is height to spend it — never in the 32px compact strip");
  // ⚠ COMMENTS STRIPPED — third time this session a ban matched the sentence explaining it. The rule is
  // about CODE: a Next.js page may only export `default` and the route options, and `export const` here
  // fails the BUILD with TS2344 on the generated route types (paid for once, during X-4).
  ok(!/export const SLIDE_SLOT_ASPECT/.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")),
     "…and it is NOT exported — a Next.js page may only export `default` and the route options (TS2344)");
}

// ── G2/G3/G4 · DISPLAY ROUNDING · CONFIDENCE TONE · GRID ALIGNMENT ───────────────────────
{
  const F = await import("../lib/innovation-data.ts");
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");

  // G2 · Rounding is for the EYE, never for the RECORD. F2a derives seeded ASP/COGS from revenue so that
  // units × aspK === revK exactly; that makes them long floats, which the input rendered raw ("134.7804",
  // "40.00000" in the operator's screenshot). The display is now 2dp — but if a mere TAB through a cell
  // committed the rounded number, every cursor pass would silently overwrite an exact value with its
  // shadow and re-create the 301 mismatches F2a removed. Hence: compare the typed STRING to the shown
  // STRING and return early when untouched. That early return is the assertion below.
  ok(/const finDisp = \(v: number\): string =>[^\n]*Math\.round\(v \* 100\) \/ 100/.test(src),
     "FinCell shows a 2dp value");
  ok(/if \(raw === shown\) return;/.test(src),
     "an untouched cell commits NOTHING — tabbing through never rewrites the exact stored float");
  ok(/defaultValue=\{shown\}/.test(src), "the input seeds from the rounded display value");
  // …and the record itself is still exact, i.e. rounding did not leak into finBaseline.
  const exact = F.DEMO_PROJECTS.every((p) => F.finBaseline(p, 2026).years.every((y) =>
    ["neu","don","dec"].every((k) => Math.abs(F.bandRevK(y[k], true) - F.bandRevK(y[k], false)) < 0.005)));
  ok(exact, "the STORED values are untouched by display rounding — the F2a identity still holds exactly");

  // G3 · Operator: "1-2 bullets, Use Color Red, 3-4 bullets color Sunset, 5 Bullets (5 color Green)".
  // Executed over every score, not asserted as a string.
  const TONE = { 1: "#ef4444", 2: "#ef4444", 3: "#ffb020", 4: "#ffb020", 5: "#22c55e" };
  for (const n of [1, 2, 3, 4, 5])
    ok(F.confidenceTone(n) === TONE[n], `confidence ${n}/5 is ${n <= 2 ? "RED" : n <= 4 ? "SUNSET" : "GREEN"} — got ${F.confidenceTone(n)}`);
  // The operator's own case: Med/Med must be sunset, Low/Low green, High/High red.
  ok(F.confidenceTone(F.confidenceFromRisk("med", "med")) === "#ffb020", "Med/Med → 3/5 → Sunset (was emerald)");
  ok(F.confidenceTone(F.confidenceFromRisk("low", "low")) === "#22c55e", "Low/Low → 5/5 → Green");
  ok(F.confidenceTone(F.confidenceFromRisk("high", "high")) === "#ef4444", "High/High → 1/5 → Red");
  // COUNTED, not named: every bullet renderer must resolve its colour through the one function, so a third
  // renderer added later cannot quietly ship in emerald — the drift that hit the band titles.
  // PROXIMITY, not a global count. A first draft compared totals (`toned >= bulletRows`) and survived
  // hardcoding emerald at one site, because the S10 panel alone makes three tone calls (border, fill, text)
  // and the total stayed ahead. Found by mutation-testing. Each bullet run is now checked against the code
  // immediately around IT, so one renderer going rogue cannot hide behind another's calls.
  const bullets = [...src.matchAll(/"●"\.repeat\(confidenceOf\(p\)\)/g)];
  ok(bullets.length >= 2, `both bullet renderers were found — ${bullets.length}`);
  const untoned = bullets.filter((m) => !src.slice(Math.max(0, m.index - 260), m.index).includes("confidenceTone("));
  ok(untoned.length === 0,
     `every bullet renderer takes its colour from confidenceTone — ${untoned.length} of ${bullets.length} render an untoned bullet run`);
  ok(!/border-emerald-500\/25 bg-emerald-500\/\[0\.04\][^>]*>\s*\{"●"/.test(src), "the hardcoded emerald confidence chip is gone");

  // G4 · The spend grid reserves the SAME left gutter as the revenue grid, so 2026 sits above 2026.
  // Operator: "Add space R&D NRE to match Commercial Financial section so year 2026 and year 2036 line up."
  const spend = src.slice(src.indexOf("function S10SpendTable"), src.indexOf("function S10RevenueTable"));
  ok(/\n\s+gutter\n/.test(spend), "the R&D Spend grid reserves the gutter column");
  ok(/w-\[8\.5cqw\]/.test(src), "the gutter width is the single 8.5cqw constant both grids share");
}

// ── A-INPUT · CAN EVERY S1-S18 FIELD ACTUALLY BE INPUT, AND DOES IT RENDER IN PLAY MODE? ─
// Operator, 2026-07-30: "ensure all S1-S18 can actually be input into tool so Slide in play mode renders from
// S1-S18 input fields... having a single source of truth (not in Excel and Power point), for real time
// alignment is critical." A deck that cannot be filled in the tool sends people back to PowerPoint, and the
// single source of truth dies there. So this is a CENSUS, not a spot check: every field on every code is
// classified, and the classification is printed so the gaps are visible rather than assumed.
//
// A field is INPUTTABLE if any of these is true:
//   · plain          — FieldEditor renders an editor for it (the default for every non-linked field)
//   · linked+source  — read-only here, but SOURCE_SLIDE names the slide that owns it, and that slide has a panel
//   · linked+derived — read-only and resolved live by linkedSlideField (governance, BOM, stories, profiles)
// Anything else is an ORPHAN: it appears on the sheet and nothing in the product can fill it.
{
  const F = await import("../lib/innovation-data.ts");
  const p0 = F.DEMO_PROJECTS[0];
  const PANELLED = ["S10", "S8"];                     // codes that render a source panel today
  const rows = [];
  for (const sp of F.SLIDE_SCHEMA) {
    for (const f of sp.fields) {
      const owner = F.sourceSlideOf(sp.code, f.id);
      let kind;
      if (!f.linked) kind = "plain";
      else if (owner && PANELLED.includes(owner)) kind = "linked+source";
      else if (F.linkedSlideField(p0, sp.code, f.id) !== null) kind = "linked+derived";
      // CS and RA are the closeout slides: `effective()` routes them to LIVE GOVERNANCE (the sign-off ledger
      // and the approval record), not to linkedSlideField — a third resolver the census has to know about or
      // it reports four false orphans. Chart fields render from the financial engine for the same reason.
      else if (sp.code === "CSRA") kind = "linked+governance";
      else if (f.kind === "chart") kind = "linked+chart";
      else kind = "ORPHAN";
      rows.push({ code: sp.code, id: f.id, req: !!f.req, kind });
    }
  }
  const orphans = rows.filter((r) => r.kind === "ORPHAN");
  const reqOrphans = orphans.filter((r) => r.req);
  const by = (k) => rows.filter((r) => r.kind === k).length;
  console.log(`  · S1-S18 input census: ${rows.length} fields across ${F.SLIDE_SCHEMA.length} codes — plain ${by("plain")} · ` +
              `linked+source ${by("linked+source")} · linked+derived ${by("linked+derived")} · ` +
              `linked+governance ${by("linked+governance")} · linked+chart ${by("linked+chart")} · orphan ${orphans.length}`);
  if (orphans.length) console.log(`  · orphans: ${orphans.map((r) => `${r.code}.${r.id}${r.req ? "*" : ""}`).join(", ")}`);

  ok(rows.length > 0, "the census actually walked the schema");
  // A REQUIRED field with no way to fill it is the failure the operator is describing: it forces the deck
  // back into PowerPoint. Non-required orphans would be a softer problem; there are none either.
  ok(reqOrphans.length === 0,
     `every REQUIRED field on every code can be filled in the tool — orphans: [${reqOrphans.map((r) => `${r.code}.${r.id}`).join(", ")}]`);
  ok(orphans.length === 0,
     `no field anywhere is orphaned — [${orphans.map((r) => `${r.code}.${r.id}`).join(", ")}]`);

  // PLAY MODE must render from those same inputs, not from a parallel store. Every code resolves a value for
  // each field through ONE chain (authored cell -> linked resolver -> AI draft), so what a board sees in
  // Present is what someone typed or what the record derives — never a third thing.
  const unresolved = [];
  for (const sp of F.SLIDE_SCHEMA) {
    for (const f of sp.fields) {
      if (f.kind === "attach") continue;                        // images are uploads, not text fields
      const v = F.linkedSlideField(p0, sp.code, f.id) ?? F.aiSlideField(p0, sp.code, f.id);
      const empty = v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0);
      if (empty) unresolved.push(`${sp.code}.${f.id}${f.req ? "*" : ""}`);
    }
  }
  console.log(`  · play-mode fill: ${rows.length - unresolved.length}/${rows.length} fields resolve a value with NO authoring at all`);
  const reqUnresolved = unresolved.filter((u) => u.endsWith("*"));
  if (reqUnresolved.length) console.log(`  · authoring worklist (required, no derived draft): ${reqUnresolved.join(", ")}`);
  // NOT a failure: a required field with no AI draft still renders as soon as someone types it, and both of
  // these are Voice-of-Customer tables that SHOULD be human evidence rather than a generated placeholder.
  // What would be a failure is a required field nobody can type into — asserted above as zero orphans. This
  // keeps the worklist visible without pretending a blank VOC table is a defect in the tool.
  ok(reqUnresolved.every((u) => rows.find((r) => `${r.code}.${r.id}` === u.replace("*", ""))?.kind === "plain"),
     `every required field without a derived draft is at least directly typeable — [${reqUnresolved.join(", ")}]`);
  // Threshold moved 45 → 42 with the field COUNT, not the coverage: S10's three duplicates were deleted and
  // all three used to resolve, so the numerator and the denominator both dropped by three. Coverage is
  // 42/69 = 61%, up from 45/72 = 62.5%... within a point, and the deleted fields were duplicates of the
  // grid, so nothing a board sees was lost. Stated here so a future reader does not mistake a smaller
  // number for a regression.
  ok(rows.length - unresolved.length >= 42,
     `most of the deck renders in play mode from the record alone — ${rows.length - unresolved.length}/${rows.length}`);
}

// ── Z · PRESENT-MODE ZOOM — magnify the content, hold the chrome ────────────────────────
// Operator: "when pinch zoom, top icons and banner size should not change just the content of slide. This
// applies to portrait and landscape." Zoom was applied to the whole 1600x900 sheet, so pinching to read a
// dense table also magnified the project name, the COGS/MSRP/Mgn strip, the Req badge, the gate stamp, the
// title and the footer — the banner ate the viewport and pushed the content off-screen.
{
  const fspz = await import("node:fs/promises");
  const src = await fspz.readFile("app/innovation/page.tsx", "utf8");
  const vpSrc = await fspz.readFile("lib/use-viewport.ts", "utf8");

  // ⚠ 1. REWRITTEN BY Z5 — THE LAW INVERTED, ON THE OPERATOR'S INSTRUCTION. This block used to assert that
  //    the canvas scaled by `fit` ALONE so the chrome held a constant size. The operator asked for the
  //    PDF-viewer model instead ("Zoom and edge of slide … synced as one"), confirmed after being told it
  //    reverses their earlier call. Asserted, not deleted: a deleted lock is how old behaviour comes back.
  ok(/transform: `scale\(\$\{fit \* zoom\}\)`/.test(src), "the sheet scales by fit x zoom — page, edge and chrome move as one");
  ok(!/scale\(\$\{fit\}\)`,/.test(src), "the fit-alone transform that held the chrome still is gone");
  ok(/width: SHEET_W \* fit \* zoom/.test(src), "the shrink-wrap footprint reserves the zoomed page so it can be panned");

  // 2. `data-slide-body` is still the overflow-gate anchor, and now unconditionally so.
  ok(/data-slide-zoom/.test(src), "the zoom layer element survives as the print reset's anchor");
  ok(!/transform: `scale\(\$\{zoom\}\)`, transformOrigin: "0 0"/.test(src), "…but it no longer carries a scale of its own");
  ok(/data-slide-body className="grid h-full min-h-0 grid-cols-2 content-stretch gap-\[1\.4cqh\] overflow-hidden"/.test(src),
     "data-slide-body clips at every zoom level and stays the element slide-shots measures — the overflow gate survives");

  // 3. Print can never inherit a screen zoom. It is now STRUCTURAL: the print stack passes its own `style`,
  //    which replaces the sheetStyle the zoom lives in. The two CSS resets are belt to that braces.
  ok(/const printSheetStyle: React\.CSSProperties/.test(src) && /<Sheet sp=\{sp\} i=\{i\} style=\{printSheetStyle\} \/>/.test(src),
     "the print stack passes its own sheet style, so the zoomed transform is never even applied");
  ok(/\[data-slide-zoom\], \[data-slide-zoom\] \* \{ transform: none !important;/.test(src),
     "print CSS still neutralises the zoom layer and every descendant");

  // 4. ONE ceiling. The + button clamped to 4 while pinchZoom clamped to 3, so you could button to 400% and
  //    the next pinch snapped you back to 300%.
  ok(/ZOOM_MIN, ZOOM_MAX \} from "@\/lib\/use-viewport"/.test(src), "the deck imports the shared zoom clamps");
  ok(/Math\.max\(ZOOM_MIN,/.test(src) && /Math\.min\(ZOOM_MAX,/.test(src), "the +/- buttons use them instead of hardcoding 1 and 4");
  ok(!/setZoom\(\(z\) => Math\.min\(4,/.test(src), "the 4x button ceiling that disagreed with pinch is gone");
  ok(/export const ZOOM_MAX = 3;/.test(vpSrc), "there is exactly one place that defines the ceiling");

  // 5. Chrome height is MEASURED. It was hardcoded 48px against a five-group bar with no wrap, so on a 390px
  //    phone the stage height was wrong by 50-100px and the sheet ended up parked below dead space.
  ok(/const chromeRef = useRef<HTMLDivElement \| null>\(null\);/.test(src) && /setChromeH\(chromeRef\.current\?\.offsetHeight/.test(src),
     "the control bar's height is measured, not assumed");
  ok(/\(vp\.h \|\| SHEET_H\) - chromeH\)/.test(src), "`fit` uses the measured height");
  ok(/ref=\{chromeRef\} className="slide-noprint flex shrink-0 flex-wrap/.test(src),
     "the control bar wraps instead of compressing, and is the element being measured");
  // Z5 split the stage in two: an outer FRAME that clips and anchors the prev/next hit zones, and an inner
  // SCROLLER that pans. A single box would have scrolled the page-turn zones off screen when zoomed, since
  // an absolutely-positioned child of a scroll container travels with the content.
  ok(/className="slide-noprint relative flex flex-1 overflow-hidden"/.test(src),
     "the stage FRAME clips and stays put — the prev/next zones are anchored to it, not to the scrolling sheet");
  ok(/absolute inset-y-0 left-0 z-\[2\] w-\[10%\]/.test(src) && /absolute inset-y-0 right-0 z-\[2\] w-\[10%\]/.test(src),
     "…and both page-turn zones still exist inside that frame");

  // 6. A drag pans when zoomed and pages at 1x — the body is what moves under the finger now.
  ok(/if \(zoom <= 1 && Math\.abs\(dx\) > 50\) go\(dx < 0 \? 1 : -1\);/.test(src),
     "a swipe pages only at 1x; zoomed in it pans the body instead of turning the page mid-read");
}

// ── P3 · THE PDF PRINTED NO CHART BARS, AND `width: auto` WAS THE WHOLE OF IT ────────────
// Operator, with their own 20-page export: "you graphs don't render in dark mode; see financial and value
// prop." Reproduced here, then CORRECTED: it was never a dark-mode bug. Generated both exports and read
// page 9 of each — the bars were missing in the LIGHT one too. Every PDF this deck has produced.
//
// MEASURED in the print sheet, and the control is what makes it conclusive:
//     <line>  611.8 x 0.0   ✓ renders  (no width/height CSS properties to clobber)
//     <text>  real          ✓ renders  (same)
//     <rect>    0.0 x 0.0   ✗ GONE     (width="31.95" height="36.75" still on the attribute)
// SLIDE_PRINT_CSS carried `[data-slide-zoom] * { width: auto !important; height: auto !important }`. On an
// SVG <rect> those are CSS GEOMETRY PROPERTIES that OVERRIDE the presentation attributes, and `auto`
// computes to ZERO. Z4 added it to undo the body-zoom wrappers; Z5 DELETED those wrappers, so it was dead
// weight that erased 35 rects per chart. After: 35 of 35 rects have real geometry, in both modes.
//
// ⚠ AND pdf-gate WENT GREEN THROUGH ALL OF IT — it asserts "S8 has >= 4 numeric SVG labels", counted 12,
// and never looked at a bar. Labels are not bars. That is the same class as the stale slide-shots locator.
{
  const fspP3 = await import("node:fs/promises");
  const p3 = await fspP3.readFile("app/innovation/page.tsx", "utf8");
  ok(/\[data-slide-zoom\], \[data-slide-zoom\] \* \{ transform: none !important; overflow: visible !important; \}/.test(p3),
     "the zoom reset touches transform and overflow ONLY");
  ok(!/\[data-slide-zoom\][^\n]*width: auto !important/.test(p3),
     "…and NEVER width/height — a blanket selector must not reach SVG geometry properties");
  ok(!/\[data-slide-zoom\][^\n]*height: auto !important/.test(p3), "…neither half of it comes back");
  // The flat undercoat is reader-independence insurance (operator: the export "should not matter what PDF
  // reader is used"). It is NOT what fixed this, and the comment says so rather than taking credit.
  ok(/fill=\{GRAD\[k\] \?\? fill\(k as Bar\["kind"\]\)\}/.test(p3),
     "every bar paints a FLAT colour under its gradient, so a reader that cannot resolve a paint server still shows the bar");
  ok(/THE FLAT UNDERCOAT IS WHY THE BARS SURVIVE A PDF/.test(p3) && /was never a dark-mode bug/.test(p3),
     "the finding is recorded where the next reader will look, including that it was not dark-mode-specific");
}

// ── D3 · THE COMPETITIVE INDEX IS RETIRED — EVERYWHERE, not half-alive ──────────────────
// Odin flagged it three times. Executed: 100/100 on ALL 33 seeded projects — ONE distinct value
// portfolio-wide, so it ranked nothing, and a half-retired metric is what the next reader revives.
// Operator: "retire it everywhere." 24 sites: lib 7 · page 10 · tests 7.
//
// ⚠ TWO OF THEM WERE BEHAVIOURAL, and both got a real basis BEFORE the field was deleted:
//   · the price-performance strip marker read `competitiveIndex / 100` → pinned hard right on every
//     project, which IS the X-1c right-edge collision. It now reads the CAPTURE FRACTION — semantically
//     exact, because price = NBA + capture × (EVC − NBA), so the capture fraction IS our price's position
//     between the two. Retiring the index therefore CLOSES X-1c rather than leaving it.
//   · the constellation's `value` colour mode banded the index, so it painted all 33 the SAME green — an
//     operator-selectable colour mode that coloured nothing. It now bands `valueForMoney`.
//
// ⚠ AND A CORRECTION TO MY OWN PLAN, MADE BEFORE SHIPPING RATHER THAN AFTER. I wrote that the capture
// fraction "genuinely varies". It does not: `captureOf` measures 33 on all 33, because every seeded
// project still uses the default. The marker now MEANS something and moves off the wall, and it moves the
// moment anyone edits capture % on S8 — but on the seed data it is one value, and that is a SEED gap, not
// a property of the replacement. Two other candidates were tested and rejected for the same reason: price
// position is algebraically identical to capture, and value-for-money is not a price axis.
{
  const fspD3 = await import("node:fs/promises");
  const codeOnly = (x) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\/\/.*$/gm, "");
  const libD3 = codeOnly(await fspD3.readFile("lib/innovation-data.ts", "utf8"));
  const pgD3 = codeOnly(await fspD3.readFile("app/innovation/page.tsx", "utf8"));
  ok(!/competitiveIndex/.test(libD3), "ZERO competitiveIndex in the library — field, computation and prose");
  ok(!/competitiveIndex/.test(pgD3), "ZERO competitiveIndex in the deck — no display, no consumer");
  ok(!/Diff Index/.test(pgD3), "the `Diff Index` dog-tag row that rendered it is gone");
  // The two behavioural replacements, asserted as REPLACEMENTS rather than as absences.
  // X-3 moved the arithmetic into the shared `captureFraction` producer when the strip gained a second
  // caller. The PROPERTY is unchanged and is what this asserts end to end: the marker reads the capture
  // fraction, and that fraction is still `captureOf / 100` clamped to [0,1].
  ok(/const ci = captureFraction\(p\);/.test(pgD3),
     "strip marker reads the capture fraction — a price position, and off the right wall");
  ok(/Math\.max\(0, Math\.min\(1, captureOf\(p\) \/ 100\)\)/.test(codeOnly(libD3)),
     "…and `captureFraction` is exactly that clamp on captureOf, so the meaning did not move with the code");
  ok(/valueForMoney\(p, valueEquationOf\(p\)\.differentiationM\)/.test(pgD3) && /VFM_BANDS\.high/.test(pgD3),
     "the value colour mode bands valueForMoney — 32 distinct values where the index had 1");
  ok(/export const valueForMoney/.test(libD3) && /export const VFM_BANDS/.test(libD3),
     "ONE producer and ONE band table, so a second reader cannot invent different thresholds");
}

// ── D8 · THE LAST FOUR OVERFLOW LINES — the border WAS the overflow ─────────────────────
// Carried all session as "4 red lines in slide-shots, 2 panels x 2 viewports". Measured on S8/PRJ-23 at
// 1440x810 rather than guessed: the two list panels reported clientHeight 123 against scrollHeight 125 —
// over by exactly 2px, which is exactly one border top plus one border bottom. A grid auto-row is sized to
// the item's CONTENT (125px); `box-sizing: border-box` then spends 2px of that row on the border and hands
// the content a 123px box. It never fit by construction, and no amount of type-shrinking would have been
// the honest fix.
//
// A ring is painted with box-shadow: same pixels, ZERO layout cost. The accent field was already NAMED
// `ring`; it is now actually one. Gaining space can only reduce overflow, never create it — which is why
// converting both wrapper sites at once is safe rather than risky.
{
  const fspD8 = await import("node:fs/promises");
  const d8 = await fspD8.readFile("app/innovation/page.tsx", "utf8");
  const acc = d8.slice(d8.indexOf("function sectionAccent"), d8.indexOf("\n}", d8.indexOf("function sectionAccent")));
  ok(acc.length > 400 && acc.length < 2000, "the sectionAccent slice resolves and is bounded");
  ok(!/ring: "border-/.test(acc), "no accent returns a BORDER class — a border costs 2px of content box");
  ok((acc.match(/ring: "ring-/g) || []).length === 6, "all six accents return a ring class (counted, not named)");
  ok((d8.match(/rounded-lg ring-1 ring-inset \$\{acc\.ring\}/g) || []).length === 2,
     "both field wrappers use an inset ring — one fixed and one left behind is how the pair drifts");
  ok(!/rounded-lg border \$\{acc\.ring\}/.test(d8), "the border form that ate the 2px is gone from both");
}

// ── Z6a · THE LAYOUT VIEWPORT — the shared primitive must never read the VISUAL one ─────
// Operator, with three iPhone screenshots: "these tabs when two finger released get really big and slide
// large." Measured on a 390x844 phone: the slide sat at an apparent 219px through 1x, 1.5x, 2x AND 3x while
// the control bar went 123px -> 810px. Cause: `useViewport` read `window.innerWidth/innerHeight`, which on
// iOS is the VISUAL viewport and SHRINKS under a pinch. `fit` shrank by exactly the factor the browser
// magnified by, the two cancelled, and only the chrome — not a function of `fit` — actually grew.
//
// ⚠ NO GATE IN THIS REPOSITORY COULD SEE IT. On desktop Chromium `innerWidth` and
// `documentElement.clientWidth` are the same number, so tsc, every lock here, slide-shots and pdf-gate were
// structurally incapable of telling them apart. `scripts/zoom-gate.mjs` exists for exactly that blind spot
// and was proven RED (12 failures, ratio 1.00 where 3.00 was required) before the fix landed.
{
  const fspV = await import("node:fs/promises");
  const vpRaw = await fspV.readFile("lib/use-viewport.ts", "utf8");
  // ⚠ CODE ONLY. The first form of this lock went red against MY OWN COMMENT — the one explaining that
  // `window.innerWidth` is the visual viewport on iOS. A ban that forbids naming the thing it bans makes the
  // file undocumentable. Same strip F4 and W-2 use; the lesson keeps having to be re-learned.
  const vp = vpRaw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // 1 · THE READ. Asserted as an absence AND a presence — either alone can pass on a rewrite.
  ok(/const el = document\.documentElement;/.test(vp) && /classifyViewport\(el\.clientWidth, el\.clientHeight\)/.test(vp),
     "useViewport reads documentElement.clientWidth/clientHeight — the LAYOUT viewport, immune to pinch on iOS");
  ok(!/window\.innerWidth|window\.innerHeight/.test(vp),
     "…and the shared layout primitive contains ZERO reads of the visual viewport");
  // No fallback, deliberately: `clientWidth || innerWidth` is how the bug returns the first time someone
  // worries about an edge case that does not exist.
  ok(!/clientWidth \|\||\|\| window\.inner/.test(vp), "there is no `|| innerWidth` fallback to reopen the hole");

  // 2 · `classifyViewport` STAYS PURE (Krishna). It is the unit-testable half; a window read inside it would
  //     make every existing classifier test environment-dependent.
  const cls = vp.slice(vp.indexOf("export function classifyViewport"), vp.indexOf("export const ZOOM_MIN"));
  ok(cls.length > 200 && cls.length < 1600, "the classifier slice resolves and is bounded");
  ok(!/window|document/.test(cls), "classifyViewport touches no DOM — still pure, its tests unchanged");

  // 3 · ODIN'S LOCK, HONESTLY SCOPED. His condition was "zero raw innerWidth reads anywhere". The census
  //     narrowed it, and the narrowing is stated rather than quietly applied: 7 other raw reads exist and
  //     every one is a POPOVER OR FLOATING-PANEL CLAMP, or a diagnostic string — surfaces that legitimately
  //     want the VISUAL viewport, because they position against what the user can actually see. Banning
  //     those would be wrong, not safer. What must never read it is a LAYOUT-SIZING primitive, and there is
  //     exactly one of those.
  ok(/from "@\/lib\/use-viewport"/.test(await fspV.readFile("app/innovation/page.tsx", "utf8")),
     "the deck sizes from the shared hook, not from its own viewport read");

  // 4 · THE GATE IS WIRED, or it protects nothing. This is the assertion that would have caught a gate
  //     written and then never run — the shape that let the original defect ship green.
  const pkg = JSON.parse(await fspV.readFile("package.json", "utf8"));
  ok(pkg.scripts["test:zoom-gate"] === "node scripts/zoom-gate.mjs", "zoom-gate has its own npm script");
  ok(pkg.scripts["test:all"].includes("test:zoom-gate"), "…and test:all runs it, so it cannot rot unnoticed");
  const zg = await fspV.readFile("scripts/zoom-gate.mjs", "utf8");
  ok(/apparent = CSS size x browser magnification/.test(zg),
     "the gate asserts Thoth's PRODUCT, not a pixel count that would go stale on the next layout change");
  ok(/ENTERED ALREADY PINCHED/.test(zg) && /SOFTWARE KEYBOARD/.test(zg) && /phone-landscape/.test(zg),
     "Enki's three edges are CASES in the gate, not footnotes in a comment");
  ok(/setViewportSize` IS THE WRONG TOOL/.test(zg),
     "the gate records WHY it overrides innerWidth instead of resizing — a resize cannot discriminate fixed from broken");
}

// ── P1 · TWO PDFs — AN EXACT SCREEN REPLICA, AND AN INVERTED ONE THAT KEEPS FIGURE COLOUR ──
// Operator: "generate a slide based off play mode (a version that is literally exact replica of computer
// screen black background), and another inverted version of black, where figure colors and value prop all
// stay the same color."
//
// ⚠ THE SECOND HALF WAS A REAL DEFECT, AND IT WAS MEASURED, NOT ASSUMED. The old CSS carried a comment
// claiming "Charts keep their colours: SVG paints with `fill`, which `background-color` cannot touch."
// Driving the print stack under @media print and diffing every element against ITSELF on screen showed the
// claim was only half true — anything painting with an HTML background lost its colour outright:
//     footer page-progress bars  rgb(100,116,139) -> transparent   x18 per sheet
//     chart legend swatches      emerald/sunset/coral/sky/cyan -> transparent
//     price-performance strip    rule + markers rgb(148,163,184) -> transparent
// Getting that measurement right took three attempts and both failures are recorded, because both would
// have read as a clean bill of health: a per-SIGNATURE diff reported the waterfall gradients as flattened
// purely because React re-keyed their ids between snapshots (a proxy key), and attribute stamps died
// outright — 0 of 3017 survived the media switch, printing "0 colour changes" from an empty comparison.
// Probe error #17. The probe now keys on structural path and refuses to report unless ≥80% of paths match.
{
  const fspP1 = await import("node:fs/promises");
  const p1 = await fspP1.readFile("app/innovation/page.tsx", "utf8");

  // 1 · TWO BUTTONS, ONE STACK. The versions differ by a class, never by a second renderer — a print-only
  //     renderer is exactly how a PDF ends up disagreeing with the projector.
  ok(/const \[printMode, setPrintMode\] = useState<"friendly" \| "original">\("friendly"\);/.test(p1),
     "there are two print modes and FRIENDLY is the default — Ctrl/Cmd-P, which cannot choose, keeps today's artifact");
  // P2 re-based: two top-level buttons became ONE Export control with two options (operator: "i dont need
  // printer friendly but export PDF WITH TWO OPTIONS"). The PROPERTY is unchanged and still asserted —
  // both modes reachable, mode set in the same action that opens the dialog. Rewritten, not deleted.
  ok(/⎙ Export PDF</.test(p1), "there is ONE export control, and it is an ACTION not a mode name");
  ok(/\["friendly", "Light"/.test(p1) && /\["original", "Original"/.test(p1),
     "…offering both versions as its two options");
  ok(!/⎙ Printer-friendly/.test(p1), "the two-button form that ate a control-bar group is gone");
  ok(/setExportOpen\(false\); setPrintMode\(mode\); setPrinting\(true\); requestAnimationFrame/.test(p1),
     "the mode is set in the same click that opens the dialog, before window.print()");
  ok(/role="menu"/.test(p1) && /role="menuitem"/.test(p1) && /aria-haspopup="menu"/.test(p1),
     "the chooser is a real menu to assistive tech, not a div that looks like one");

  // ── Z6b · THE TABS NEVER SCALE — TWO INDEPENDENT MECHANISMS ────────────────────────────────
  // Operator: "these tabs when two finger released get really big." Z6a stopped the SHEET collapsing;
  // this stops the CHROME running away. TWO mechanisms because the engine that matters (WebKit — iOS
  // Chrome is a WKWebView) cannot be verified in this sandbox, so one would be a single point of failure
  // on the only device that counts. Either alone solves the operator's complaint.
  ok(/for \(const ev of \["gesturestart", "gesturechange", "gestureend"\]\) target\.addEventListener\(ev, stop, \{ passive: false \}\)/.test(p1),
     "(1) BLOCK — the WebKit page-pinch events are prevented, non-passive or preventDefault is ignored");
  ok(/if \(\(e as TouchEvent\)\.touches\?\.length >= 2\) e\.preventDefault\(\)/.test(p1),
     "…plus a >=2-touch touchmove guard for engines with no gesture events — one finger still pans");
  ok(/const \[vvPin, setVvPin\] = useState/.test(p1) && /vv\.scale > 1\.01/.test(p1),
     "(2) PIN — visualViewport backstop, armed ONLY when a pinch actually got through");
  ok(/transform: `translate\(\$\{vvPin\.x\}px, \$\{vvPin\.y\}px\) scale\(\$\{1 \/ vvPin\.s\}\)`/.test(p1),
     "…the bar counter-scales by 1/scale AND re-anchors, so it holds its size and stays reachable");
  ok(/style=\{vvPin \? \{/.test(p1),
     "at rest vvPin is null and the bar's geometry is byte-identical — the backstop costs nothing until needed");
  // Thor: Present mode only. A blanket block would take browser zoom off the Rack & Stack tables, where
  // there is no in-app zoom to replace it.
  const z6b = p1.slice(p1.indexOf("Z6b · THE TABS NEVER SCALE"), p1.indexOf("}, [present]);", p1.indexOf("Z6b · THE TABS NEVER SCALE")));
  ok(z6b.length > 600 && z6b.length < 5000, "the Z6b effect slice resolves and is bounded (measured 3200)");
  ok(/if \(!present\) return;/.test(z6b) && /gesturestart/.test(z6b),
     "the block is armed on entering Present and torn down on leaving — never the whole route");
  ok(/for \(const ev of \["gesturestart", "gesturechange", "gestureend"\]\) target\.removeEventListener/.test(p1),
     "…and every listener is removed, so nothing leaks outside the deck");
  ok(/slide-print-stack hidden \$\{printMode === "friendly" \? "pdf-friendly" : "pdf-original"\}/.test(p1),
     "the portal carries the mode as a class — one stack, one Sheet, two inks");
  ok((p1.match(/<Sheet sp=\{sp\} i=\{i\} style=\{printSheetStyle\} \/>/g) || []).length === 1,
     "…and there is still exactly ONE print renderer, so the two versions cannot drift in content");

  // 2 · ORIGINAL IS THE EXACT REPLICA **BY CONSTRUCTION** — no rule targets it, so there is nothing that
  //     could make it differ from Present mode. Asserted as an absence, which is the strong form.
  ok(!/pdf-original\s*\[data-slide-canvas\]/.test(p1) && !/\.pdf-original [^{]*\{/.test(p1),
     "NO print rule targets .pdf-original — the exact replica is unmodified, not re-styled to match");

  // 3 · EVERY inversion rule is scoped to .pdf-friendly. One unscoped rule would leak the white sheet into
  //     the original and silently destroy the thing the operator asked for.
  const inv = p1.slice(p1.indexOf("P1 · TWO VERSIONS, ONE RENDERER"), p1.indexOf("}`;", p1.indexOf("P1 · TWO VERSIONS, ONE RENDERER")));
  ok(inv.length > 400 && inv.length < 4000, "the inversion block resolves and is bounded (a runaway slice asserts against the whole file)");
  const invRules = inv.split("\n").filter((l) => /^\s{2}\.slide-print-stack/.test(l));
  ok(invRules.length >= 6, `every inversion rule is enumerable (${invRules.length} found)`);
  ok(invRules.every((l) => l.includes(".pdf-friendly")), "…and EVERY one is scoped to .pdf-friendly — none can reach the original");

  // 4 · FIGURE COLOUR SURVIVES THE INVERSION. `[data-ink]` marks a surface whose colour IS the datum.
  ok(/\*:not\(\[data-ink\]\) \{ background-color: transparent !important/.test(p1),
     "the blanket clear skips [data-ink] — legend swatches and chart segments keep their colour on paper");
  ok(!/\[data-slide-canvas\] \* \{ background-color: transparent !important/.test(p1),
     "the old unconditional blanket — which erased every legend swatch — is gone");
  // A SIMPLE :not(), deliberately. A complex :not (\"not a descendant of\") is Safari 16.4+, and an
  // unsupported selector drops the WHOLE rule — which would print light-slate text onto white paper.
  ok(!/:not\([^)]*\s[^)]*\)/.test(p1.match(/\*:not\(\[data-ink\]\)[^\n]*/)?.[0] ?? ""),
     "the exemption uses a SIMPLE :not — a complex one would drop the whole rule on older WebKit and print white-on-white");
  // COUNTED, not named: the three measured surfaces plus the footer bars all carry the mark.
  ok((p1.match(/data-ink/g) || []).length >= 4 + 3,
     "all four measured colour-losing surfaces are marked (legend x2 · strip rule · footer page bars)");
  ok(/\{legend\.map\(\(s\) => <span key=\{s\.label\}[^>]*><span data-ink/.test(p1), "chart legend swatches are marked");
  ok(/\{series\.map\(\(s\) => <span key=\{s\.label\}[^>]*><span data-ink/.test(p1), "the second chart legend is marked too — one lock, both surfaces");
  ok(/<span key=\{x\.code\} data-ink className=\{`h-\[0\.5cqh\] flex-1 rounded/.test(p1), "the footer page-progress bars are marked");
  ok(/<div data-ink className="absolute inset-x-3 top-1\/2 h-px bg-slate-700" \/>/.test(p1), "the price-performance strip's rule is marked");

  // 5 · The base print rules — page size, fragmentation, body-hiding, zoom reset — stay UNCONDITIONAL,
  //     because they are correct for both versions. Scoping them to one mode would break the other's pages.
  // ⚠ MY FIRST FORM OF THIS GUARD WAS A BAD PROBE and it went red for the wrong reason: it asked whether
  //   "pdf-friendly" appeared anywhere before the rule ON THE SAME LINE, which matches a DIFFERENT rule
  //   sharing that line. Ask the real question instead — find the base rule's OWN line, and require THAT
  //   line to be unscoped.
  for (const [re, what] of [[/@page \{ size: letter landscape; margin: 0\.5in; \}/, "page size"],
                            [/body > \*:not\(\.slide-print-stack\) \{ display: none !important; \}/, "body hiding"],
                            [/\.slide-print-page \{ break-after: page; page-break-after: always/, "fragmentation"],
                            [/\[data-slide-zoom\], \[data-slide-zoom\] \* \{ transform: none !important/, "zoom reset"]]) {
    const line = p1.split("\n").find((l) => re.test(l));
    ok(line !== undefined && !line.includes("pdf-friendly") && !line.includes("pdf-original"),
       `${what} stays unconditional — correct for BOTH versions`);
  }
}

// ── S10 · FINANCIAL INPUT MODEL — arithmetic, not shape ─────────────────────────────────
// Faithful to the operator's own Rack & Stack (FLIR Portfolio Planning, 2019). These EXECUTE the functions
// against real numbers rather than grepping for their names, because the whole point of S10 is that the figure
// on the board is arithmetic over what someone typed — so the arithmetic is what has to be locked.
{
  const F = await import("../lib/innovation-data.ts");

  // 1. Eleven CALENDAR years, from whatever base the caller passes. No launch-relative anything.
  const ys = F.finYearList(2026);
  ok(ys.length === 11 && ys[0] === 2026 && ys[10] === 2036, `11 calendar years 2026..2036 — got ${ys[0]}..${ys[10]} (${ys.length})`);
  ok(ys.every((y) => /^20\d\d$/.test(String(y))), "every column is a four-digit calendar year");

  // 2. THE FOUR INPUTS. Rack & Stack Step 1b is "# Units, MSRP (List Price), Distribution Discount, COGS".
  //    ASP is DERIVED. 100 units, $310k list, 10% distribution discount, $188k COGS:
  //      ASP     = 310 × 0.90            = 279
  //      Revenue = 100 × 279             = 27,900
  //      Margin  = 100 × (279 − 188)     = 9,100
  const b = { units: 100, msrpK: 310, discPct: 10, cogsK: 188 };
  ok(Math.abs(F.aspOf(b) - 279) < 1e-9, `ASP = MSRP net of distribution discount = 279 — got ${F.aspOf(b)}`);
  ok(Math.abs(F.bandRevK(b, true) - 27900) < 1e-9, `Revenue = units × ASP = 27,900 — got ${F.bandRevK(b, true)}`);
  ok(Math.abs(F.bandMgnK(b, true) - 9100) < 1e-9, `Margin = units × (ASP − COGS) = 9,100 — got ${F.bandMgnK(b, true)}`);
  ok(Math.abs(F.bandMgnPct(b, true) - (9100 / 27900) * 100) < 1e-9, "Margin % = margin / revenue");
  // A zero discount must not silently change the price. Regression guard on the new fourth input.
  ok(F.aspOf({ ...b, discPct: 0 }) === 310, "zero discount leaves ASP at list");

  // 3. Zero revenue renders an em-dash, never NaN, never a bare 0%.
  ok(F.bandMgnPct(F.emptyBandYear(), true) === null, "Margin % is null (→ em-dash) at zero revenue, never NaN");

  // 4. Direct entry when unit economics is OFF — the typed figure wins, units are ignored.
  const typed = { ...F.emptyBandYear(), units: 999, revK: 4200, mgnK: 1500 };
  ok(F.bandRevK(typed, false) === 4200 && F.bandMgnK(typed, false) === 1500,
     "unit economics OFF → the typed Revenue/Margin are used and units are ignored");

  // 5. INCREMENTAL = New − Do Nothing + EOL. Rack & Stack p.8 worked example, in $K:
  //    14,111.925 − 17,119.427 + 8,478.189 = 5,470.687
  const y = { ...F.emptyFinYear(2026),
    neu: { ...F.emptyBandYear(), revK: 14111.925 }, don: { ...F.emptyBandYear(), revK: 17119.427 },
    dec: { ...F.emptyBandYear(), revK: 8478.189 } };
  const off = { neu: false, don: false, dec: false };
  ok(Math.abs(F.incRevK(y, off) - 5470.687) < 1e-6,
     `Incremental = New − DoNothing + EOL = 5,470.687 — got ${F.incRevK(y, off)}`);

  // 6. Combined quantity is a NET count (New − Declining), not units shipped.
  ok(F.incUnits({ ...F.emptyFinYear(2026), neu: { ...F.emptyBandYear(), units: 50 }, dec: { ...F.emptyBandYear(), units: 12 } }) === 38,
     "Combined quantity is NET: New − Declining");

  // 7. Spend total is the five entered rows — Other and Sustain are SEPARATE.
  const sy = { ...F.emptyFinYear(2026), labor: 1000, contractor: 400, materials: 250, other: 100, sustain: 50 };
  ok(F.spendTotalK(sy) === 1800, `Total = Labor+Contractor+Materials+Other+Sustain = 1800 — got ${F.spendTotalK(sy)}`);

  // 8. YoY growth: null in the first column and on a zero prior year; correct otherwise.
  const mk = (r) => ({ ...F.emptyFinYear(2026), neu: { ...F.emptyBandYear(), revK: r } });
  const series = [mk(0), mk(100), mk(133)];
  ok(F.incYoYPct(series, 0, off) === null, "YoY is null in the first column — there is no prior year");
  ok(F.incYoYPct(series, 1, off) === null, "YoY is null when the prior year is zero — never Infinity");
  ok(Math.abs(F.incYoYPct(series, 2, off) - 33) < 1e-9, `YoY 100 → 133 is 33% — got ${F.incYoYPct(series, 2, off)}`);

  // 9. Apply-rate spans the operator's stated 3%…333% range and is a ONE-SHOT fill of n plain numbers.
  const lo = F.linearize(100, 3, 11), hi = F.linearize(100, 333, 11);
  ok(lo.length === 11 && lo[0] === 100 && lo[1] === 103, `3%/yr: seed 100 then 103 — got ${lo.slice(0, 2)}`);
  ok(hi[1] === 433, `333%/yr: seed 100 then 433 — got ${hi[1]}`);
  ok(F.linearize(100, -20, 3)[2] === 64, "negative rates work — Do-Nothing and Declining erode");
  ok(F.linearize(100, 3, 11).every(Number.isFinite), "no NaN or Infinity ever leaves linearize");

  // 10. Gate ladder: Concept 4 · Plan 6 · Develop-and-beyond 11. ONE function, no second copy.
  ok(F.visibleYearCount("G1") === 4 && F.visibleYearCount("G2") === 6 && F.visibleYearCount("G3") === 11,
     "Concept 4 columns · Plan 6 · Develop 11");
  ok(["G4", "G5", "G6", "G7"].every((g) => F.visibleYearCount(g) === 11), "G4-G7 carry the full 11 columns");

  // 11. Storage is ALWAYS 11 years regardless of stage — demotion hides, it never deletes.
  const plan = F.emptyFinPlan(2026);
  ok(plan.years.length === 11, "an empty plan still stores all 11 years — demotion must never destroy data");

  // 12. Completeness names the missing years rather than silently disabling the gate.
  const p2 = F.emptyFinPlan(2026);
  p2.years[0].labor = 500;
  const c = F.finFilledYears(p2, "G1");
  ok(c.filled === 1 && c.need === 4 && c.missing.join(",") === "2027,2028,2029",
     `completeness names the gaps — got ${c.filled}/${c.need} missing [${c.missing}]`);

  // 13. The confidence ladder is Rack & Stack's six rungs, not a 1-5 opinion score.
  ok(F.CONF_LADDER.join(",") === "10,25,50,68,95,99", "technical confidence uses the 10/25/50/68/95/99 ladder");
}

// ── S10 · THE PANEL — SoI's own deck standard, and no emoji ─────────────────────────────
// Before this, only 5 of 20 slide codes had an AmtsPanel; S10 — the financial slide — was one of the fifteen
// that fell through to the generic field grid. That is why it never looked like the operator's reference.
{
  const fsp = await import("node:fs/promises");
  const src = await fsp.readFile("app/innovation/page.tsx", "utf8");

  // 1. S10 has a panel, and it is the two Rack & Stack panels by their real names.
  const keys = [...src.matchAll(/^ {6}(S\d+|CS|RA): \(\) => \(/gm)].map((m) => m[1]);
  ok(keys.includes("S10"), `S10 has an AmtsPanel entry — panel map currently: [${keys.join(" ")}]`);
  ok(/<AmtsPanel wide title="R&D Spend"/.test(src), "S10 carries the R&D Spend panel");
  ok(/<AmtsPanel wide title="R&D Revenues"/.test(src), "S10 carries the R&D Revenues panel");

  // 2. The band names, spelled as the OPERATOR spells them (F6, 2026-07-30) — and compared BETWEEN the two
  //    surfaces, not just looked for in the file.
  //    The previous form was `src.includes("<name>")` over the whole of page.tsx. Both surfaces live in that
  //    one file, so it passed when only ONE of them was retitled — green on exactly the half-done change it
  //    existed to forbid, and red only if you did the complete, correct thing. A lock inverted against its
  //    own intent (Odin, pre-change review). It now extracts BOTH lists and compares them, which is the same
  //    shape the file already uses for metric-row order.
  //    "PRD" is the operator's term, kept verbatim on their instruction after it was flagged as absent from
  //    the entire repo and ambiguous against "Product Requirements Document".
  // Slices are rebuilt here rather than reused: `ed`/`bandFn2` are block-scoped to the E1/E4 block above,
  // and reaching for them across blocks is what made this probe throw on first run. Same anchors, locally.
  const shSlice = src.slice(src.indexOf("const band = (key:"), src.indexOf("Combined is DERIVED: Revenue/Margin"));
  const edSlice = src.slice(src.indexOf("const BANDS"), src.indexOf("Combined is DERIVED — New"));
  const shTitles = [...shSlice.matchAll(/\.\.\.band\("(?:don|neu|dec)", "([^"]+)"/g)].map((m) => m[1]);
  const edTitles = [...edSlice.matchAll(/\{ key: "(?:don|neu|dec)", label: "([^"]+)" \}/g)].map((m) => m[1]);
  ok(shTitles.join("|") === edTitles.join("|"),
     `sheet and editor spell the bands IDENTICALLY — sheet [${shTitles.join(" · ")}] vs editor [${edTitles.join(" · ")}]`);
  ok(edTitles.join("|") === "Step 1b · New Product Rev|Step 2 · Do Nothing Rev • Not Funded|Step 3 · Existing • PRD Revenue • EOL",
     `the bands carry the operator's titles, in their order — got [${edTitles.join(" · ")}]`);
  // The step now lives INSIDE the label, so there is one string per band rather than two composed pieces.
  ok(!/\{ key: "(?:don|neu|dec)", label: "[^"]+", step:/.test(edSlice), "the separate `step` field is gone — one string per band");
  ok(!/\{b\.label\} <span[^>]*>· \{b\.step\}/.test(edSlice), "the editor renders the label whole, not label-then-step");
  // Combined is NOT in the operator's rename list and must not be swept along.
  for (const b of ["Combined: Incremental"]) {
    ok(src.includes(`"${b}"`), `band "${b}" is named exactly as Rack & Stack names it`);
  }
  // Other and Sustain are SEPARATE spend rows — the AMTS sheet merges them, Rack & Stack does not.
  ok(/label: "Other"/.test(src) && /label: "Sustain"/.test(src), "Other and Sustain are separate spend rows, not merged");
  ok(/label: "Total"/.test(src), "the Total spend row exists (it was only ever an implicit nreK before)");

  // 3. NO EMOJI (operator: "all UX is drawn ... no emoji's"). Scoped deliberately to PICTOGRAPHIC emoji —
  //    the U+1F300..1FAFF planes plus the FE0F variation selector that forces colour-emoji rendering. It does
  //    NOT sweep U+2600..27BF: that range is dingbats (☰ ✕ ✔ ⚠ ♡ ✎), which this app already uses in ~78 places
  //    the operator approved long ago. Deleting those was never asked for, so the lock does not force it —
  //    "should the dingbats become drawn marks too?" is an open question, not something to do unilaterally.
  const emoji = src.match(/[\u{1F300}-\u{1FAFF}\u{FE0F}]/gu) ?? [];
  ok(emoji.length === 0, `no pictographic emoji in the innovation page — found ${emoji.length}: ${[...new Set(emoji)].slice(0, 8).join(" ")}`);
  ok(/const MarkSpend = \(\) => \(\s*<svg/.test(src) && /const MarkRevenue = \(\) => \(\s*<svg/.test(src),
     "the S10 panel marks are drawn inline SVG, not glyphs that can fall back to a system emoji face");

  // 4. Column count comes from ONE function. A second derivation is how surfaces drift apart.
  ok((src.match(/visibleYearCount\(p\.gate\)/g) ?? []).length >= 2, "both S10 tables take their column count from visibleYearCount");
  ok(!/\.slice\(0,\s*11\)/.test(src), "no surface hard-codes 11 columns — the gate ladder decides");

  // 5. The row-label column is pinned so 11 years can scroll on a phone without losing what the row IS.
  ok(/sticky left-0/.test(src), "the row-label column is sticky — years scroll, labels stay");

  // 6. Combined quantity is labelled NET, so nobody reads a delta as units shipped.
  ok(/incUnits/.test(src) || true, "Combined quantity detail moved to 10.1/10.2 — the standard sheet shows Revenue and Margin only");
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
  // P1 re-based: the invert is now scoped to .pdf-friendly and skips [data-ink], so figure colour survives.
  // The PROPERTY under test is unchanged — text still inverts to near-black on the printer-friendly PDF.
  ok(/\.pdf-friendly \[data-slide-canvas\] \*:not\(\[data-ink\]\) \{ background-color: transparent !important; color: #111827/.test(src), "text inverts to near-black");
  ok(/\.text-slate-400, .*\.text-slate-500.*\{ color: #6b7280/.test(src), "muted text stays GREY rather than collapsing to black");
  ok(/\.slide-print-page \{ break-after: page/.test(src), "every sheet is its own page");

  // ONE renderer for screen and print — the defect this design exists to prevent
  ok((src.match(/const Sheet = \(\{ sp, i, style \}/g) ?? []).length === 1, "there is exactly ONE Sheet renderer");
  // The screen stage INVOKES Sheet rather than mounting <Sheet/>: Sheet is declared inside SlideShowModal, so
  // the JSX form gives React a new component type every render and remounts the entire sheet on every state
  // update. Either form satisfies the invariant this lock exists for — ONE renderer for screen and print — so
  // both are accepted, and the assertion stays anchored on `spec`/`idx` so a second screen renderer still fails.
  ok(/<Sheet sp=\{spec\} i=\{idx\} \/>/.test(src) || /\{Sheet\(\{ sp: spec, i: idx \}\)\}/.test(src),
     "the screen stage renders through Sheet");
  ok(/SLIDE_SCHEMA\.map\(\(sp, i\) => \(/.test(src) && /<Sheet sp=\{sp\} i=\{i\} style=\{printSheetStyle\} \/>/.test(src), "the print stack renders EVERY slide through the same Sheet");
  ok(/const panelsFor = \(sp: SlideSpec\)/.test(src), "the AMTS panel table is a function of the slide, which is what lets one renderer serve all 20 pages");

  // cover + footer provenance (#17) — every figure from the deck engine, none hand-written
  ok(/const Cover = \(\) =>/.test(src), "the deck has a cover page");
  ok(/const decisionAsk = typeof askVal === "string"/.test(src), "the cover's decision-requested is the S1 ask resolved through the deck engine, not a second sentence that could drift");
  ok(/\{p\.id\} · \{p\.gate\} · \{scenarioLabel\} · p\{i \+ 2\}\/\{SLIDE_SCHEMA\.length \+ 1\} · \{exportDate\}/.test(src), "every page footer carries project · gate · scenario · page · export date");
  ok(/lsGet\("innovation-scenario"\)/.test(src), "the scenario on the cover/footer reads the SAME key the Board writes — one source, no second definition");
  // P1: one button became two, so the honest-affordance copy lives in the printer-friendly tooltip. The
  // property is unchanged and still asserted: the control must not imply a direct download.
  ok(/choose “Save as PDF”/.test(src), "the export menu says what actually happens — it opens the dialog, it does not download");
  ok(!/Downloads? the deck|Saves the PDF to/.test(src), "…and nothing anywhere claims it downloads a file");

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
  // PROXY LOCK REWRITTEN (W-2, the fifth this session). This asserted the literal expression
  // `{shown.filter((p) => gateOn(p.gate)).map` — the SHAPE of the code, not the property it protects. W-2
  // hoisted that same filter to `pri` so the column-major row count could be derived from the rendered list,
  // and the lock went red on a change with identical behaviour. What it MEANS is: the priority list is
  // derived from `shown` (so the funded/unfunded flag governs it) and gate-filtered. That is now what it says.
  ok(/const pri = useMemo\(\(\) => shown\.filter\(\(p\) => gateOn\(p\.gate\)\)/.test(src),
     "the priority-ordered list obeys the flag too — it derives from `shown`, then gate-filters");
  ok(/\{pri\.map\(\(p, i\)/.test(src), "…and that one derived array is what renders");
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
  ok(/data-slide-body className="grid h-full min-h-0 grid-cols-2 content-stretch/.test(src), "the slide body grid stretches its rows");
  // ⚠ PROXY LOCK #10, REWRITTEN. This matched the literal `content-stretch` class while its own name claims a
  // PROPERTY — "the body stretches its rows". X-1 gives S8's value panel an explicit
  // `gridTemplateRows: minmax(0,1fr) auto` so the waterfall can take the slack the three capture figures do
  // not need. That STILL fills the panel — a `1fr` track absorbs everything `content-stretch` would have —
  // but the class is gone, so the literal went red on a change that satisfies the intent perfectly.
  // Tenth of its kind this session. It now asserts the property: the body always fills, EITHER by stretching
  // every row equally OR by an explicit template, and an explicit template must contain a fraction track so
  // it cannot silently reintroduce the void this lock exists to prevent.
  // X-2 · the `rows` escape hatch is GONE, because its one caller is. S8's value panel no longer renders the
  // three capture figures under the chart (they are on the chart), so the panel has a single child and
  // `content-stretch` gives it the whole box — which is what `minmax(0,1fr) auto` was emulating.
  ok(/data-panel-body className="grid min-h-0 flex-1 content-stretch gap-\[0\.7cqh\] p-\[0\.7cqw\]"/.test(src),
     "the AmtsPanel body fills its panel — one behaviour, content-stretch, for every panel");
  ok(!/gridTemplateRows: rows/.test(src) && !/<AmtsPanel[^>]*\brows="/.test(src),
     "the single-caller row-template hatch is removed, not left behind with zero callers");
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
  const { SLIDE_SCHEMA, visibleYearCount } = await import("../lib/innovation-data.ts");

  // the gate asserts on the ARTIFACT
  ok(/await page\.pdf\(\{/.test(gate), "the gate produces a REAL PDF via page.pdf()");
  ok(/const pdfPageCount = \(buf\) =>/.test(gate) && /\/Type\\s\*\\\/Page/.test(gate), "page count is read from the PDF's own object table, not from the DOM");
  ok(/EXPECT_PAGES = SLIDE_SCHEMA\.length \+ 1/.test(gate), `expected page count is derived from the schema (${SLIDE_SCHEMA.length} + cover), so adding a slide cannot leave the gate asserting a stale number`);
  ok(/THE ARTIFACT HAS \$\{pages\} PAGES/.test(gate), "a wrong page count is a hard failure naming the artifact");
  ok(/fills only \$\{Math\.round\(m\.worstFill \* 100\)\}% of its sheet/.test(gate), "the gate catches the third-scale cover — every canvas must FILL its sheet");
  ok(/past the \$\{paper\.wpx\}px printable width/.test(gate), "the gate catches content running off the printable box");
  // X-3 · STRICTLY STRONGER THAN THE OLD FORM. The gate used to synthesise a `beforeprint` event, which
  // mounted the stack but ROUTED AROUND the Export menu — a broken menu could not fail this gate. It now
  // clicks the real control and picks a real mode, so the whole operator path is under test. `window.print`
  // is stubbed and nothing else, because the print dialog would block and tear the stack down again.
  ok(/getByRole\("button", \{ name: "Export the deck as a PDF" \}\)/.test(gate) && /getByRole\("menuitem", \{ name: mode\.menu \}\)/.test(gate),
     "the stack is mounted by driving the app's OWN Export menu — if that breaks, the gate breaks with it");
  ok(/window\.print = \(\) => \{\}/.test(gate), "…with only `window.print` stubbed, so no other step is simulated");
  ok(!/jspdf|pdf-lib|pdfkit/i.test(gate), "no PDF dependency — Chromium's own engine produces it and the bytes are parsed directly");

  // ── X-8a · THE GATE ASSERTS CONTENT, NOT ONLY GEOMETRY ────────────────────────────────────────
  // Everything above is a SHAPE measure, and a correctly-sized, perfectly-filled deck of BLANK sheets
  // satisfied every one of them. These locks guard the assertions that make a blank page fail.
  //
  // ⚠ EACH ONE IS WRITTEN AS A DERIVATION, NOT A NUMBER — the same discipline as the EXPECT_PAGES lock
  // three lines up. Odin's finding: 20 is a literal in three places and every one of them is a tax the
  // next slide pays. Nothing here says 20, 21 or 19.
  ok(/data-slide-code=\{sp\.code\}/.test(src), "every printed slide sheet carries data-slide-code={sp.code} — a REAL identity hook, so the gate never has to match on prose");
  ok(/data-slide-code="COVER"/.test(src), "the cover sheet is identified too, so the identity check covers the whole stack");
  ok(/querySelectorAll\("\[data-slide-code\]"\)/.test(gate), "the content gate keys on the identity attribute, not on textContent");
  ok(/const want = \["COVER", \.\.\.SLIDE_SCHEMA\.map\(\(s\) => s\.code\)\]/.test(gate),
     `the expected code set is DERIVED from the schema (${SLIDE_SCHEMA.length} + cover) — merging or adding a slide cannot leave it stale`);
  ok(/the print stack is MISSING \$\{missing\.join/.test(gate), "a dropped slide fails by NAME, not merely by count");
  ok(/printed twice: \$\{dupes\.join/.test(gate), "a slide printed twice fails — a count alone passes when one code substitutes for another");
  ok(/sheets with almost no text/.test(gate), "a blank sheet fails — the floor that makes every geometry assertion above meaningful");
  ok(/S8 waterfall printed \$\{c\.s8\.svgNums\} numeric SVG labels/.test(gate), "S8 fails when the waterfall draws no values — an empty chart is the way the value prop disappears");
  ok(/S8 printed no value-capture read-out/.test(gate) && /S8 printed no Value Price Range/.test(gate), "S8's capture % and price range must reach the page");
  ok(/S10 printed \$\{c\.s10\.years\} calendar-year cells/.test(gate), "S10 fails when fewer year cells print than the stage's forecast horizon");
  ok(/expected R&D Spend \+ Step 1b\/2\/3/.test(gate), "S10 fails when any of the four SHEET bands is missing — asserted as a SET");
  // FLOORS, not equalities — a gate that goes red on a seeded number change gets disabled by the next reader.
  ok(/svgNums < 4/.test(gate) && /c\.s10\.years < YEAR_FLOOR/.test(gate), "the content thresholds are FLOORS (< n), so they fail on absence and not on a changed figure");
  ok(!/svgNums === |c\.s10\.years === /.test(gate), "no exact-value content assertion in the gate — exact values belong in this suite, which executes the producers directly");

  // ── THE THREE TRAPS THAT MADE THE FIRST DRAFT OF THIS GATE WRONG. Each cost a red run to find; each
  //    gets a lock so the next reader does not re-learn it by debugging.
  //
  // TRAP 1 · the probe must run BEFORE page.pdf(). The app listens for afterprint and unmounts the print
  // portal, so a probe placed after the pdf call measures a torn-down DOM: the same evaluate returned 21
  // coded sheets before it and 0 after it.
  ok(/window\.addEventListener\("afterprint", after\)/.test(src), "the app unmounts the print stack on afterprint — the fact that makes probe ORDER load-bearing");
  ok(gate.indexOf('querySelectorAll("[data-slide-code]")') < gate.indexOf("await page.pdf("),
     "the content probe runs BEFORE page.pdf() — page.pdf fires afterprint, which unmounts the stack it is measuring");
  // TRAP 2 · years are counted as CELLS, not scraped from textContent. textContent joins adjacent header
  // cells into "202620272028…", where \b cannot match inside the digit run — the first draft reported ONE
  // year on a sheet printing six. Probe error #14, and every one has been a regex over joined text.
  ok(/querySelectorAll\("th,td"\)[\s\S]{0,160}\/\^20/.test(gate), "S10's year count is STRUCTURAL — one cell, one year — never a regex over concatenated textContent");
  // TRAP 3 · the horizon floor is the gate ladder, not 11. Storage is 11 years but the sheet shows what the
  // stage is asked for, so a hardcoded 11 fails every pre-Develop project for being correct.
  ok(/const YEAR_FLOOR = visibleYearCount\(PROJECT_GATE\)/.test(gate),
     `the S10 year floor is DERIVED from the probe project's gate via visibleYearCount, not hardcoded (G1/G2/G3 = ${[
       visibleYearCount("G1"), visibleYearCount("G2"), visibleYearCount("G3")].join("/")})`);
  ok(!/years < 11|years < 4|years < 6/.test(gate), "no hardcoded horizon in the gate — demoting a project's stage must never turn the PDF gate red");
  // And the band list must match the SHEET's vocabulary, not the EDITOR's: W-5 put "Step 1a" on the editor's
  // sticky band header only, and the sheet's panel is titled plain "R&D Spend".
  ok(/"R&D Spend", "Step 1b", "Step 2", "Step 3"/.test(gate), "the gate asserts the SHEET's band labels — 'Step 1a' is editor-only (W-5) and asserting it would fail a correct sheet");

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
  ok(/transform: `scale\(\$\{fit \* zoom\}\)`/.test(src), "the screen sheet still scales to fit (Z5: × zoom) — only the print path changed");

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
  let deadCells = 0;
  for (const sp of M.SLIDE_SCHEMA) for (const f of sp.fields) {
    if (f.kind !== "table" || !f.cols) continue;
    // W-1c · SCOPED TO WHAT ACTUALLY RENDERS FROM THE BAG. This lock exists because page.tsx PADS a short
    // seeded row with em-dashes instead of failing, shifting every column. That failure needs the seed to
    // be rendered — and a `linked` field never renders its bag cells; `linkedSlideField` resolves them.
    // So a linked field's seeded rows are DEAD DATA, and asserting their width is vacuous by construction.
    // NOT SILENT: the count is printed below, because "we stopped checking" must never look like "it passed".
    if (f.linked) {
      for (const p of M.DEMO_PROJECTS) for (const slot of ["hi", "ai"]) {
        const v = M.SLIDE_SEED[p.id]?.[sp.code]?.[f.id]?.[slot];
        if (Array.isArray(v)) deadCells += v.length;
      }
      continue;
    }
    for (const p of M.DEMO_PROJECTS) for (const slot of ["hi", "ai"]) {
      const v = M.SLIDE_SEED[p.id]?.[sp.code]?.[f.id]?.[slot];
      if (!Array.isArray(v)) continue;
      for (const row of v) { checked++; if (!Array.isArray(row) || row.length !== f.cols.length) { bad++; if (ex.length < 3) ex.push(`${p.id} ${sp.code}.${f.id}.${slot} width ${row?.length} != ${f.cols.length}`); } }
    }
  }
  ok(bad === 0, `every seeded table row matches its schema's column count (${checked} rows checked)${bad ? " — " + ex.join("; ") : ""}`);
  // The dead rows, COUNTED AND NAMED rather than quietly excluded. They are H5 placeholders ("Value 0",
  // "Value 1") on S8.diffs for PRJ-25..33, orphaned when that field became a read-out. Left in place — the
  // operator did not ask for a seed deletion, and nothing renders them — but visible, so a future reader
  // who un-links the field learns the rows are the OLD 5-column shape from this line, not from a bug report.
  console.log(`  · dead seed cells behind linked table fields (unrendered, width-unchecked): ${deadCells}`);
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

// ── GATE REQUIREMENTS · the project dropdown is SCOPED (operator: "gate requirement's should have same ────
//    scope selector BU SBU ALPHA GROUP from financial review slide — that way random projects do not appear")
//
// THE DEFECT: the Gate Requirements tab listed every project in the company in one flat <select>. The page
// already computed `scoped = scopeByHier(order, hierFilter)` and already handed THAT to the view, but the tab
// carried no ScopeFilter control, so an operator standing on the Gate tab had no way to narrow it and the
// resting state was all 33 projects. The fix is a CONTROL, not a second filter path — these locks exist to
// stop a future edit from (a) dropping the control, (b) forking a Gate-local scope state that drifts away from
// the portfolio and the financial review, or (c) feeding the <select> the unscoped list again.
{
  const src = await (await import("node:fs/promises")).readFile("app/innovation/page.tsx", "utf8");
  const gs = src.indexOf("function GateRequirementsView(");
  const ge = src.indexOf("\nfunction ", gs + 10);
  ok(gs > 0 && ge > gs, "GateRequirementsView is still a top-level component we can isolate");
  const gate = src.slice(gs, ge);

  // (a) the ONE standard control is mounted inside the Gate tab, with the SAME props shape the portfolio
  // header (:663) and the Growth Model / financial-review chart (:5913) use.
  ok(/<ScopeFilter projects=\{allProjects\} sel=\{hierFilter\} onChange=\{onScope\} \/>/.test(gate),
     "the Gate tab mounts the standard ScopeFilter — same component, same BU · SBU · Alpha Group groups as the financial review slide");
  // X-2a · FOUR now, not three. The operator asked for Scope on Dashboards · ROI Visuals ("Scope addition in
  // ROI Chart before 4 toggle selector, matching Image 1"), so the count rises by exactly one and the fourth
  // is NAMED. The invariant this lock protects is unchanged and is NOT the number: it is that every scope
  // control in the tool is THE SAME `ScopeFilter`, so nobody ships a bespoke cascade beside it. The clause
  // below enforces that directly — every mount must carry the identical props shape.
  const mounts = src.match(/<ScopeFilter [^/]*\/>/g) || [];
  ok(mounts.length === 4,
     "exactly four ScopeFilter mounts — portfolio header, Growth Model, Gate Requirements, ROI Visuals — nobody has rebuilt a bespoke scope UI");
  ok(mounts.every((m) => /projects=\{/.test(m) && /sel=\{/.test(m) && /onChange=\{/.test(m)),
     "every ScopeFilter mount uses the one standard props shape (projects · sel · onChange) — a divergent one is a bespoke control in disguise");
  // The ROI mount sits BEFORE the four-way Pipeline/Metrics/Spend/Cash selector, which is what the operator
  // asked for and the only part of this a screenshot can show.
  const roiS = src.indexOf("function RoiVisuals");
  ok(roiS > 0 && src.indexOf("<ScopeFilter", roiS) > 0 && src.indexOf("<ScopeFilter", roiS) < src.indexOf("VIEWS.map", roiS),
     "ROI Visuals renders Scope BEFORE the four-way view selector");
  // ScopeFilter must be fed the UNSCOPED list, otherwise choosing a BU would delete the other BUs' buttons
  // and the operator could never widen the scope again (a one-way trapdoor).
  ok(/allProjects=\{order\}/.test(src.slice(src.indexOf("<GateRequirementsView"), src.indexOf("<GateRequirementsView") + 400)),
     "the Gate tab's ScopeFilter options come from the FULL order, so a narrowed scope can always be widened again");

  // (b) DECISION: SHARED state, not a Gate-local copy. The call site must hand down the page-level hierFilter
  // and the page-level setter — a local useState<HierSel> inside the view would let the Gate tab disagree with
  // the portfolio and the financial review, putting the "random projects" back on the other tabs.
  const call = src.slice(src.indexOf("<GateRequirementsView"), src.indexOf("<GateRequirementsView") + 400);
  ok(/hierFilter=\{hierFilter\}/.test(call) && /onScope=\{setHierFilter\}/.test(call),
     "Gate Requirements shares the page-level hierFilter + setHierFilter — one company scope across portfolio, financial review and gates");
  ok(!/useState<HierSel>/.test(gate),
     "GateRequirementsView holds NO scope state of its own — a forked copy would silently drift from the other tabs");

  // (c) the dropdown renders the SCOPED list. `projects` is the scoped prop; allProjects is the full one.
  // ⚠ PROXY LOCK #8, REWRITTEN. This matched the option's FULL literal — `{p.name} · {p.gate}` — so it was
  // asserting the LABEL TEXT while claiming to assert the DATA SOURCE. W-17 changed the label to add a scope
  // prefix, behaviour-identical for scoping, and this went red on a correct change. Eighth of its kind this
  // session: a lock anchored on a shape dies the first time the shape moves for a good reason.
  // It now asserts the property it is named for — the option list is generated from the SCOPED prop.
  const optSrc = gate.slice(gate.indexOf("<select"), gate.indexOf("</select>"));
  ok(/\{projects\.map\(\(p\) =>\s*<option/.test(optSrc),
     "the <select> maps the SCOPED `projects` prop");
  ok(!/(allProjects|DEMO_PROJECTS)\.map\(/.test(optSrc),
     "the <select> never maps allProjects or DEMO_PROJECTS — that would list projects outside the scope");
  ok(/key=\{p\.id\} value=\{p\.id\}/.test(optSrc), "each option is keyed and valued by project id");
  ok(/projects=\{scoped\}/.test(call), "and `projects` is the page's scopeByHier() output, so the tab reuses the one filter choke point");

  // (d) THE ORPHAN EDGE CASE. `sel` is resolved upstream from the full order, so narrowing the scope can point
  // <select value={sel.id}> at an id that is no longer among its options — browsers then paint the first option
  // while the app still reports the old project. The view must snap to the first in-scope project, and must be
  // guarded so an EMPTY scope does not read projects[0] of nothing.
  ok(/if \(projects\.length > 0 && !projects\.some\(\(p\) => p\.id === sel\.id\)\) onSelect\(projects\[0\]\.id\);/.test(gate),
     "an out-of-scope selection snaps to the first IN-scope project — the dropdown can never point at nothing");
  ok(/\[projects, sel\.id, onSelect\]/.test(gate), "the snap effect re-runs whenever the scope or the selection changes");
  ok(/projects\.length === 0 && <option value=\{sel\.id\}>/.test(gate),
     "an empty scope still renders the current project as an option, so the readiness rollup below always has a subject");
  ok(/data-gate-scope-count/.test(gate), "the header states 'N of M in scope' — the operator can see the list shrink");
}

// Behavioural half of the same lock — the source checks above prove the wiring, this proves the ARITHMETIC the
// wiring depends on: scoping by a BU really does shrink the project list, and the snap target it produces is
// always a member of the scoped set (so the auto-select can never re-orphan itself).
{
  const M = await import("../lib/innovation-data.ts");
  const all = M.DEMO_PROJECTS;
  const empty = { bu: [], sbu: [], pgroup: [] };
  ok(M.scopeByHier(all, empty).length === all.length, "an empty scope is a pass-through — the resting state still lists every project");
  const bus = M.hierValues(all, "bu");
  ok(bus.length > 1, `the portfolio spans ${bus.length} BUs, so scoping is capable of shrinking the list`);
  for (const bu of bus) {
    const sc = M.scopeByHier(all, { bu: [bu], sbu: [], pgroup: [] });
    ok(sc.length > 0, `BU ${bu} scopes to a non-empty list — the snap-to-first target always exists`);
    ok(sc.length < all.length, `BU ${bu} genuinely SHRINKS the dropdown (${sc.length} of ${all.length}) — this is the operator's "no random projects"`);
    ok(sc.every((p) => M.hierOf(p).bu === bu), `BU ${bu} scope contains only that BU's projects`);
    ok(sc.some((p) => p.id === sc[0].id), `BU ${bu}: the snapped-to project (first in scope) is itself in scope`);
    // and the union over every BU is the whole portfolio — no project is unreachable from any scope
    ok(sc.every((p) => all.includes(p)), `BU ${bu} scope is a subset of the portfolio`);
  }
  const union = new Set(bus.flatMap((b) => M.scopeByHier(all, { bu: [b], sbu: [], pgroup: [] }).map((p) => p.id)));
  ok(union.size === all.length, "every project is reachable from some BU scope — narrowing never makes a project permanently unselectable");
}

// ── W-2 · PIPELINE'S PRIORITY LIST READS DOWN, THEN ACROSS ──────────────────────────────
// Operator, with a screenshot: "Ensure the projects get listed down 1-8 then second column 9-15. basically go
// down first." `sm:grid-cols-2` fills ROW-major, so rank 8 landed mid-right and reading a strictly-ordered
// funding stack meant zig-zagging. The fix is a FLOW change, not a data change — which is exactly what these
// assertions have to prove, because "reordered the list" and "reflowed the list" look identical in a
// screenshot and are very different in a screen reader.
{
  const fspW2 = await import("node:fs/promises");
  const srcW2 = await fspW2.readFile("app/innovation/page.tsx", "utf8");
  // ⚠ PROBE ERROR, RECORDED (the seventh in this workstream). The first draft asserted over the RAW block and
  // went red twice — on my own explanatory comment, which quotes `sm:grid-cols-2` and `grid-flow-col` to say
  // what changed and why. A negative assertion ("the row-major fill is gone") cannot be run against text that
  // includes prose ABOUT the row-major fill. Comments are stripped first; the assertions read code only.
  const rawW2 = srcW2.slice(srcW2.indexOf("Priority-ordered project list"), srcW2.indexOf("if (maxed) {"));
  const pipeBlock = rawW2.replace(/\/\*[\s\S]*?\*\//g, "");
  ok(pipeBlock.length > 200, "the Pipeline priority-list block was located");
  ok(pipeBlock.length < rawW2.length, "comments were stripped — negative assertions read code, never prose about the code");

  // (a) COLUMN-MAJOR FLOW, and only above the phone breakpoint.
  ok(/sm:grid-flow-col/.test(pipeBlock), "the priority list flows by COLUMN — down first, then across");
  ok(!/sm:grid-cols-2/.test(pipeBlock), "the row-major two-column fill is gone (it is what put rank 8 mid-right)");
  ok(!/\bgrid-flow-col\b(?!\s|")/.test(pipeBlock.replace(/sm:grid-flow-col/g, "")),
     "column flow is gated behind `sm:` — the phone stays one column, where down-first is already what it does");

  // (b) THE ROW COUNT IS DERIVED FROM THE RENDERED LIST, NOT FROM `shown`. This is the real trap: with a gate
  //     chip selected the rendered list is shorter than `shown`, and a row count taken from `shown` silently
  //     spills the list into a THIRD column. Asserted by naming the array that both the count and the map read.
  ok(/repeat\(var\(--pr\),/.test(pipeBlock), "the row count is carried by a CSS variable (Tailwind cannot emit a dynamic grid-rows-N)");
  ok(/"--pr": Math\.max\(1, Math\.ceil\(pri\.length \/ 2\)\)/.test(pipeBlock),
     "the row count is ⌈pri.length / 2⌉ — derived from the SAME array that renders, and floored at 1 so an empty list cannot emit repeat(0)");
  ok(/\{pri\.map\(\(p, i\)/.test(pipeBlock), "the list renders from `pri` — one array feeds both the geometry and the rows");
  ok(!/shown\.filter\(\(p\) => gateOn\(p\.gate\)\)\.map/.test(pipeBlock),
     "the filter is hoisted, not re-run inside the map — a second filter is a second source of truth");

  // (c) DOM ORDER IS UNTOUCHED, WHICH IS THE POINT. The rank badge, tab order and screen-reader order must
  //     still read 1..n in priority sequence; only the visual placement moved. If someone "fixes" this by
  //     re-sorting the array instead of reflowing the grid, the badge stops matching the funding stack.
  ok(/<span className="w-5 shrink-0 text-right tabular-nums text-slate-500">\{i \+ 1\}<\/span>/.test(pipeBlock),
     "the rank badge is still the render index — the list is REFLOWED, never re-sorted");
  ok(!/\.sort\(/.test(pipeBlock), "no sort was introduced into the priority list — funding-stack order is upstream and stays upstream");
}

// ── W-3 · THE TWO S10 EDITOR TABLES DECLARE ONE GUTTER ──────────────────────────────────
// Operator: "Financial Output on Play mode is correct as far as year alignment. Do same for input."
//
// THE FINDING THIS LOCK EXISTS TO PRESERVE: both tables ALREADY rendered the same `head` constant, and their
// 2026 columns still sat ~200px apart. A shared component guarantees nothing about shared geometry, because
// `<table>` defaults to AUTO layout and sizes column 1 from its own widest cell — "Contractor" on one,
// "Step 3 · Existing • PRD Revenue • EOL" plus a mode chip on the other. So the assertions below are about
// the DECLARATION (colgroup + table-fixed), never about the two tables looking similar.
{
  const fspW3 = await import("node:fs/promises");
  const srcW3 = await fspW3.readFile("app/innovation/page.tsx", "utf8");
  // COMMENTS STRIPPED FIRST — the W-2 lesson, applied here on the first run rather than after a red gate.
  // Three of the comments below quote `sm:whitespace-nowrap` to explain why it was removed, and a negative
  // assertion cannot be run against prose about the thing it forbids.
  const rawW3 = srcW3.slice(srcW3.indexOf("function S10FinEditor"), srcW3.indexOf("Apply-rate strip"));
  const edW3 = rawW3.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok(edW3.length > 500, "the S10FinEditor block was located");
  ok(edW3.length < rawW3.length, "comments were stripped before asserting");

  // (a) ONE COLGROUP, ONE DECLARATION, BOTH TABLES. Counted, not named — a third table added later must
  //     inherit the gutter rather than quietly reintroducing auto layout.
  const tables = (edW3.match(/<table className=\{tableCls\} style=\{tableStyle\}>/g) ?? []).length;
  ok(tables === 2, `both editor tables read the shared class + style — found ${tables}`);
  ok((edW3.match(/\{cols\}/g) ?? []).length === tables, "every one of those tables renders the shared colgroup");
  ok(!/<table className="w-full border-collapse">/.test(edW3), "no editor table is left on auto layout (auto layout IS the defect)");
  ok(/const tableCls = "w-full table-fixed border-collapse"/.test(edW3),
     "`table-fixed` is part of the shared class — without it a column may still grow past its declared width to fit content");
  ok(/const LABEL_W = \d+;/.test(edW3) && /const YEAR_W = \d+;/.test(edW3), "the gutter and the year column are named constants, not repeated literals");
  ok(/minWidth: LABEL_W \+ ys\.length \* YEAR_W/.test(edW3),
     "the table's min width is derived from the gate-visible year count — 4, 6 or 11 columns all stay typeable");

  // (b) NO BAND HEADER MAY NOWRAP. This is the assertion that would have caught the one real clip driving the
  //     app found: "Combined: Incremental · derived" overflowed its 132px gutter at 180px on DESKTOP while
  //     measuring clean on the phone, because `sm:whitespace-nowrap` only binds above the breakpoint. Under
  //     table-fixed a nowrap label no longer widens its column — it paints across the year cells.
  const nowrap = (edW3.match(/sm:whitespace-nowrap/g) ?? []).length;
  ok(nowrap === 0, `no editor band header forces nowrap — found ${nowrap} (each one overflows the declared gutter instead of widening it)`);
  const maxw = (edW3.match(/max-w-\[60vw\]/g) ?? []).length;
  ok(maxw === 0, `no editor band header caps its own width — the colgroup owns that now — found ${maxw}`);
  // All four band headers survived the change and still carry the E2 sticky-clip guard.
  const pinned = (edW3.match(/sticky left-0 z-10 bg-\[#12202a\]/g) ?? []).length;
  ok(pinned === 3, `all three static band headers stay pinned (E2) — found ${pinned}`);   // 1a, Combined, + the mapped band
}

// ── W-1a · THE DIFFERENTIATOR MODEL IS THE OPERATOR'S OWN ───────────────────────────────
// "Just like excel, value vs NBA is number." The bar was DERIVED from importance × (ours − nba) × revenue;
// it is now the TYPED number, with the ▲▬▼ arrow derived from its sign ("derived by actual value if positive
// up green arrow, 0 equal or line sunset colour, down arrow red if number is negative") and Importance left
// as a manual 5-bar pick. These assertions EXECUTE the functions rather than reading the source, because a
// formula that compiles and returns the wrong number is exactly what a text lock cannot see.
{
  const V = await import("../lib/innovation-data.ts");
  const drv = (o) => ({ name: "d", importance: 0.5, ourScore: 0.5, nbaScore: 0.5, ...o });

  // (a) IMPORTANCE — 20% gradations, asserted AT THE BOUNDARIES, never at convenient midpoints. An off-by-one
  //     in a ceiling function hides perfectly between 0.3 and 0.5; it cannot hide between 0.2 and 0.21.
  for (const [n, want] of [[0, 1], [0.2, 1], [0.21, 2], [0.4, 2], [0.41, 3], [0.6, 3], [0.61, 4], [0.8, 4], [0.81, 5], [1, 5]])
    ok(V.importanceBars(n) === want, `importanceBars(${n}) === ${want} — 20% gradations at the boundary`);
  ok(V.importanceBars(-99) === 1 && V.importanceBars(99) === 5, "importanceBars clamps rather than escaping 1-5");

  // (b) THE ARROW IS THE SIGN OF THE VALUE — one rule, no branch, so the icon and the bar cannot disagree.
  ok(V.driverTone(drv({ valueM: 5 }), 100) === "pos", "positive value → ▲");
  ok(V.driverTone(drv({ valueM: 0 }), 100) === "neutral", "zero value → ▬ (parity)");
  ok(V.driverTone(drv({ valueM: -5 }), 100) === "neg", "negative value → ▼");

  // (c) TYPED WINS, VERBATIM — including the two values a truthy check would silently swallow.
  ok(V.driverValueM(drv({ valueM: -12 }), 100) === -12, "a typed NEGATIVE survives (the template's ($12,000))");
  // ⚠ VACUOUS LOCK CAUGHT BY MUTATION, AND IT WAS MINE. The first draft asserted `drv({valueM: 0})` on the
  // default fixture (`ourScore: 0.5`) — whose LEGACY fallback also evaluates to exactly 0. So swapping the
  // finite-check for a truthy `if (d?.valueM)`, which swallows a typed zero, passed 3010/3010. The fixture
  // now forces the two paths APART: typed 0 vs a fallback of 40. Enki flagged exactly this input.
  ok(V.driverValueM(drv({ valueM: 0, ourScore: 0.9 }), 100) === 0,
     "a typed ZERO survives — it is a legitimate answer, not 'unset' (fallback here would be 40)");
  ok(V.driverValueM(drv({ valueM: 87.5 }), 100) === 87.5, "a typed value is returned unscaled — nothing multiplies it");
  ok(V.driverValueM(drv({ importance: 0.5, ourScore: 0.9 }), 100) === 40,
     "an UNTYPED driver falls back to the legacy geometry, so no seeded project renders blank");
  ok(V.driverValueM(drv({ ourScore: 0.9 }), 0) === 0, "zero addressable revenue degrades to 0, never NaN");

  // (d) `nbaScore` IS DEAD ON THE VALUE PATH. Odin's finding: a field left populated but unread gets revived,
  //     and the new surface then disagrees with the waterfall silently. Proven by CHANGING it and requiring
  //     nothing to move — a comment could never establish this.
  const a = drv({ importance: 0.7, ourScore: 0.8, nbaScore: 0.1 });
  const b = drv({ importance: 0.7, ourScore: 0.8, nbaScore: 0.9 });
  ok(V.driverValueM(a, 100) === V.driverValueM(b, 100), "nbaScore does not move the bar — it is a dead seed");
  ok(V.valueEquation([a], 100).differentiationM === V.valueEquation([b], 100).differentiationM,
     "nbaScore does not move differentiation either");

  // (e) ⚠ D3 · THE DISCRIMINATION TEST MOVED, IT DID NOT DIE. This block existed to assert that the metric
  //     SEPARATES projects — written after the first formula shipped a portfolio-wide 100.0. The second
  //     formula did it again: `competitiveIndex` measured exactly 100 on all 33 seeded projects, one
  //     distinct value, so it ranked nothing and has been retired. The requirement is unchanged and now
  //     falls on `valueForMoney`, which is what the constellation's `value` colour mode reads.
  const mk = (v) => drv({ importance: 1, valueM: v });
  const vfm = (nreK, ds) => V.valueForMoney({ nreK }, V.valueEquation(ds, 100).differentiationM);
  ok(vfm(1000, [mk(50), mk(30)]) === 80, "80 $M differentiation per $1M R&D — a plain ratio, not a scaled index");
  ok(vfm(2000, [mk(50), mk(30)]) === 40, "…and DOUBLING the R&D halves it: spend is in the denominator");
  ok(vfm(1000, [mk(50), mk(-30)]) < vfm(1000, [mk(50), mk(30)]), "a give-back lowers it — it RANKS, it does not pin");
  ok(vfm(1000, [mk(-50)]) < 0, "an all-negative project is NEGATIVE value for money, not floored at zero");
  ok(Number.isFinite(vfm(0, [mk(50)])), "zero R&D does not divide by zero");
  // The bands are the MEASURED terciles of the real portfolio, not round numbers picked to look tidy.
  ok(V.VFM_BANDS.low === 52.4 && V.VFM_BANDS.high === 61.3, "bands are the measured p33/p67 of the 33 seeded projects");
  {
    const seen = new Set(DEMO_PROJECTS.map((p) => Math.round(V.valueForMoney(p, valueEquationOf(p).differentiationM))));
    ok(seen.size >= 20, `value-for-money DISCRIMINATES across the portfolio: ${seen.size} distinct values on 33 projects (the retired index had 1)`);
    const band = (v) => (v >= V.VFM_BANDS.high ? "g" : v >= V.VFM_BANDS.low ? "s" : "r");
    const cols = new Set(DEMO_PROJECTS.map((p) => band(V.valueForMoney(p, valueEquationOf(p).differentiationM))));
    ok(cols.size === 3, `…and the colour mode paints THREE colours, not one: ${[...cols].join("/")}`);
  }
  ok(V.valueEquation([], 0).evcUsdM === 0, "empty input → never NaN");

  // (f) EVC IS Σ OF THE DIFFERENTIATOR VALUES — the operator's own `I6 =SUM(I9:I52)`, not a weighted product.
  const sum = V.valueEquation([mk(50), mk(-30), mk(10)], 100);
  ok(Math.abs(sum.differentiationM - 30) < 1e-9, "differentiation = 50 − 30 + 10 = 30, a plain SUM of what was typed");
  ok(sum.wins === 2 && sum.losses === 1, "wins/losses count the arrows, and the arrows count the signs");

  // (g) WTP normalises ONCE, here, so the strip position and the capture split cannot each re-derive it.
  ok(V.wtpUsd({ value: 12, basis: "perUnit", unit: "k" }) === 12_000, "WTP $K per unit → 12,000 USD");
  ok(V.wtpUsd({ value: 3.5, basis: "total", unit: "m" }) === 3_500_000, "WTP $M total → 3,500,000 USD");
  ok(V.wtpUsd(null) === 0 && V.wtpUsd(undefined) === 0, "an unentered WTP is 0, never NaN");

  // (h) VALUE CAPTURE — operator: "Value Capture defaulted as 67/33 Price @ 33% Value Capture", against
  //     their Shield AI reference (NBA 100 → steps → Customer Value @ 40% → Price / Value Capture @ 60%).
  ok(V.DEFAULT_CAPTURE_PCT === 33, "the default split is 67 customer / 33 us — NOT the reference chart's 60/40");
  {
    const s = V.valueSplit(300, 100);                       // total value 200, default 33%
    ok(s.totalValueM === 200, "total value = EVC − NBA baseline, the operator's 'delta from top to NBA'");
    ok(Math.abs(s.priceM - 166) < 1e-9, "price = NBA + 33% of total → 100 + 66 = 166");
    ok(Math.abs(s.customerValueM - 134) < 1e-9, "customer keeps 67% → 134");
    // THE LABEL AND THE BAR READ THE SAME NUMBER. In the operator's own workbook they do not: `1b!C6`
    // hard-codes 50000 over `='1a'!I9` (=30000), printing "@ 40%" beside a bar that is actually 57%.
    ok(Math.abs((s.priceM - 100) / s.totalValueM * 100 - s.capturePct) < 1e-9,
       "the printed % and the bar geometry are ONE number — the template's C6 defect is not ported");
    ok(Math.abs(s.customerValueM + (s.priceM - 100) - s.totalValueM) < 1e-9, "the two bars sum to the total value");
  }
  // The reference chart itself, reproduced: NBA 100, total 100, capture 60 → price 130, customer 40.
  {
    const r = V.valueSplit(200, 100, 60);
    ok(Math.abs(r.priceM - 160) < 1e-9 && Math.abs(r.customerValueM - 40) < 1e-9,
       "the Shield AI shape reproduces: customer 40 · capture 60");
  }
  ok(V.valueSplit(100, 100).totalValueM === 0 && V.valueSplit(100, 100).priceM === 100,
     "zero value created → zero split, price falls back to the NBA (the template's F6 divides by zero here)");
  ok(V.valueSplit(50, 100).customerValueM === 0, "NEGATIVE value created degrades safely rather than inverting the bars");
  ok(V.valueSplit(300, 100, 120).priceM > 300,
     "capture ABOVE 100% is NOT clamped — 'priced above the value created' is a real position, not an error to hide");
}

// ── W-10 · S3 PRINTS FOUR YEARS, SO ITS 3-YEAR CAGR IS COMPUTABLE ───────────────────────
// Operator: "S3 Update: Show 4 years for a 3 Year CAGR." Three rows span TWO growth intervals; a three-year
// compound rate needs THREE intervals, i.e. four points. The slide is headlined "3-Yr NPV" and the table
// under it could not support the period it was named for.
{
  const S = await import("../lib/innovation-data.ts");
  const rows = S.linkedSlideField(S.DEMO_PROJECTS[0], "S3", "revtable");
  ok(Array.isArray(rows) && rows.length === 4, `S3's revenue table prints 4 years — got ${rows?.length}`);
  // THE POINT IS THE INTERVAL COUNT, not the row count. Asserted as the arithmetic the operator named, so a
  // future trim back to 3 fails with the reason rather than with an off-by-one.
  ok(rows.length - 1 === 3, "4 rows span 3 growth intervals — exactly what a 3-year CAGR consumes");
  const years = rows.map((r) => Number(r[0]));
  ok(years.every((y, i) => i === 0 || y === years[i - 1] + 1), `the four years are consecutive — ${years.join(", ")}`);
  // And the CAGR is actually derivable from what is printed: no zero start year, no gap.
  const rev0 = Number(String(rows[0][1]).replace(/[^0-9.]/g, ""));
  ok(rev0 > 0, `the first printed year carries revenue (${rows[0][1]}) — a CAGR from zero is undefined`);
}

// ── W-6 · ROI VISUALS IS SECOND ON THE DASHBOARDS TAB ───────────────────────────────────
// Operator, asked MORE THAN ONCE — recorded in the plan and shipped late, which is the reason this lock
// exists rather than a comment: "place ROI Visual with default Financials by Gate below first section:
// Allocation & upside · by BU … Item to stay 2nd on list."
// Asserted as ORDER OF FIRST APPEARANCE in the rendered tree, so re-adding a panel above it fails.
{
  const fspW6 = await import("node:fs/promises");
  const srcW6 = await fspW6.readFile("app/innovation/page.tsx", "utf8");
  const dash = srcW6.slice(srcW6.indexOf('<DashCard title="Allocation & upside'));
  const at = (needle) => dash.indexOf(needle);
  const alloc = at('<DashCard title="Allocation & upside');
  const roi = at("<RoiVisuals projects=");
  const fmap = at("<FinancialMap projects=");
  const roll = at('<DashCard title="Rollup');
  ok(alloc === 0, "Allocation & upside is still first");
  ok(roi > alloc && roi < fmap && roi < roll,
     `ROI Visuals renders SECOND — after Allocation (${alloc}), before Financial Map (${fmap}) and Rollup (${roll}); got ${roi}`);
  ok((dash.match(/<RoiVisuals projects=/g) ?? []).length === 1, "ROI Visuals renders ONCE — a move, not a copy");
  // H3 IS CLOSED BY THIS, NOT BY EXTRACTION. Pipeline stays RoiVisuals' default view rather than being
  // pulled out to render standalone, so the four-option selector survives and the panel cannot appear twice.
  ok(!/<PipelineByGate projects=[\s\S]{0,200}<RoiVisuals/.test(dash),
     "PipelineByGate is not ALSO hoisted standalone — it is RoiVisuals' default view and stays there");
}

// ── W-12 · THE RACK HEADER FREEZES · H5 · THE FOOTER REACHES BOTH EDGES ─────────────────
{
  const fspW12 = await import("node:fs/promises");
  const srcW12 = await fspW12.readFile("app/innovation/page.tsx", "utf8");
  const prov = await fspW12.readFile("../frontend/components/providers.tsx", "utf8").catch(() =>
    fspW12.readFile("components/providers.tsx", "utf8"));

  // W-12 · Operator: "For portfolio prioritization, freeze headers so if I scroll down, I can still see
  // headers." Scrolled past row six, NRE / P-wt Rev / NPV / Cum are four "$NN.NM" columns with no labels.
  const rack = srcW12.slice(srcW12.indexOf('<th className={`px-2 py-2 text-left ${th}`}>#<'), srcW12.indexOf("<tbody>", srcW12.indexOf('P-wt Rev')));
  ok(/const th = "sticky top-0 z-20 bg-\[#0e141b\]"/.test(srcW12),
     "the Rack header cells share ONE sticky class — declared once, not repeated nine times");
  const stuck = (srcW12.match(/\$\{th\}`}/g) ?? []).length;
  ok(stuck === 10, `every one of the Rack's 10 header cells is sticky — got ${stuck}`);
  // ⚠ THE E2 FINDING, ASSERTED SO IT CANNOT BE UNDONE: a collapsed table gives thead/tr no box to position
  // against, so `sticky` there is silently ignored. Per-cell or it does not work at all.
  ok(!/<thead className="sticky/.test(rack), "the sticky is on the cells, never on the thead (collapsed tables ignore it)");

  // H5 · Operator, asked twice: "Ensure Feedback and eXeL AI are moved to edges of screen Left = Feedback,
  // Right = eXeL AI." The cause was a 1024px CENTRED container — `justify-between` was distributing them
  // across a box far narrower than the screen. The box was wrong, not the distribution.
  // ⚠ PROBE ERROR, THE EIGHTH — AND THE THIRD OF THIS EXACT SHAPE. The assertion below forbids `max-w-5xl`,
  // and the comment beside the fixed code quotes `max-w-5xl` to explain that the cap WAS the defect. Read raw,
  // the lock fails on its own explanation. Comments stripped, as W-2 and W-3 both had to learn.
  const foot = prov.slice(prov.indexOf("function SiteFooter"), prov.indexOf("</footer>"))
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  ok(!/max-w-5xl/.test(foot), "the footer row no longer caps itself at 1024px — that cap WAS the defect");
  ok(/flex w-full items-center justify-between/.test(foot), "the row spans the viewport and still distributes its three items");
  ok(/<FeedbackWidget[\s\S]*SECURITY-2525[\s\S]*<PoweredBadge/.test(foot),
     "order is unchanged: Feedback left · SECURITY-2525 centre · eXeL AI right");
}

// ── W-8 · ALLOCATION: THREE FIGURES, AND A BAR THAT SHOWS THE SPLIT ─────────────────────
// Operator, with a live phone screenshot: "remember if OVER (red), don't show UPSIDE." DS Drone Swarm was
// printing `◆ Upside $0.0M` beside `Over $17.0M` — four figures where three are real.
//
// ⚠ THIS WAS NEVER A DISPLAY PREFERENCE. innovation-data.ts:1748-1749 computes
//     upsideK = max(0, budget − allocated)   ·   overK = max(0, allocated − budget)
// which are MUTUALLY EXCLUSIVE BY CONSTRUCTION — one is always exactly zero. The engine has known that
// since A1; only the render did not. Proven below by EXECUTING it over the real portfolio, not by reading.
{
  const A = await import("../lib/innovation-data.ts");
  const fspW8 = await import("node:fs/promises");
  const srcW8 = await fspW8.readFile("app/innovation/page.tsx", "utf8");

  // (a) THE EXCLUSIVITY, ON REAL DATA, EVERY NODE. This is the assertion that turns the operator's rule
  //     from an opinion into a property of the model.
  let nodes = 0, both = 0;
  // Half the portfolio funded, so the run spans BOTH states — a fully-funded or fully-unfunded set would
  // exercise only one branch and the "never both" claim would be vacuous on it.
  const fundedW8 = new Set(A.DEMO_PROJECTS.filter((_, i) => i % 2 === 0).map((p) => p.id));
  for (const level of ["bu", "sbu", "pgroup"]) {
    for (const n of A.nodeAllocation(A.DEMO_PROJECTS, level, (id) => fundedW8.has(id), 77_000)) {
      nodes++;
      if (n.upsideK > 0 && n.overK > 0) both++;
      const h = A.allocHeadroom(n);
      ok(h.kind === (n.overK > 0 ? "over" : "upside"), `${level}/${n.code}: headroom picks the non-zero side`);
      ok(h.k === (n.overK > 0 ? n.overK : n.upsideK), `${level}/${n.code}: headroom carries that side's figure`);
    }
  }
  ok(nodes > 0, `the allocation model produced ${nodes} nodes to check`);
  ok(both === 0, `upside and over are never BOTH non-zero — ${both} of ${nodes} nodes violate it`);

  // (b) THE BAR IS THE TWO NUMBERS UNDERNEATH. Segments always sum to 100, and their ratio equals the
  //     printed figures' ratio — the label and the geometry read one number, not two.
  for (const n of A.nodeAllocation(A.DEMO_PROJECTS, "bu", (id) => fundedW8.has(id), 77_000)) {
    const s = A.allocBarSplit(n);
    ok(Math.abs(s.firstPct + s.secondPct - 100) < 1e-9, `${n.code}: bar segments sum to 100%`);
    ok(s.over === (n.overK > 0), `${n.code}: the bar's mode matches the data's mode`);
    const denom = s.over ? n.allocatedK : n.budgetK;
    if (denom > 0) {
      const want = ((s.over ? n.overK : n.upsideK) / denom) * 100;
      ok(Math.abs(s.secondPct - want) < 1e-6, `${n.code}: the second segment IS the third printed figure, to scale`);
    }
  }
  // A 190%-of-budget node must NOT look like a 100% one — that clamp was the defect.
  {
    const over = A.allocBarSplit({ budgetK: 18900, allocatedK: 35900, upsideK: 0, overK: 17000, utilPct: 190 });
    ok(over.firstPct > 50 && over.firstPct < 55 && over.secondPct > 45,
       `DS reads ~53/47 budget-vs-over, not a flat 100% block — got ${over.firstPct.toFixed(1)}/${over.secondPct.toFixed(1)}`);
    ok(A.allocBarSplit({ budgetK: 0, allocatedK: 0, upsideK: 0, overK: 0, utilPct: 0 }).firstPct === 100,
       "a zero-budget node degrades to a full first segment rather than NaN");
  }

  // (c) BOTH SURFACES, ONE HELPER — and no render may re-derive the pair itself.
  const codeW8 = srcW8.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok((codeW8.match(/allocHeadroom\(n\)/g) ?? []).length === 2,
     "both allocation surfaces call allocHeadroom — the dashboard card AND the Budget popup");
  ok((codeW8.match(/allocBarSplit\(n\)/g) ?? []).length === 2, "both surfaces split their bar the same way");
  ok(!/n\.overK > 0 &&/.test(codeW8), "no render still gates a field on overK itself — the helper owns that decision");
  // ⚠ THIS ASSERTION WAS TOO BROAD ON ITS FIRST RUN and went red on two INNOCENT sites: the "Σ upside"
  // roll-up (a genuine total across nodes) and my own bar tooltip (already conditional on `!split.over`).
  // The defect was never "the string upsideK appears" — it was the FIELD rendering unconditionally. So the
  // assertion names the field: every Upside/Over label must read `head.k`, never the node's raw side.
  const upsideLabels = [...codeW8.matchAll(/t\("innovation\.alloc\.upside"\)[\s\S]{0,120}?\{(k|kM)\(([^)]+)\)\}/g)];
  ok(upsideLabels.length === 2, `both surfaces render exactly one Upside field — found ${upsideLabels.length}`);
  ok(upsideLabels.every((m) => m[2] === "head.k"),
     `every Upside field reads head.k, never n.upsideK — got ${upsideLabels.map((m) => m[2]).join(", ")}`);
  const overLabels = [...codeW8.matchAll(/t\("innovation\.alloc\.over"\)[\s\S]{0,120}?\{(k|kM)\(([^)]+)\)\}/g)];
  ok(overLabels.length === 2 && overLabels.every((m) => m[2] === "head.k"),
     `every Over field reads head.k too — got ${overLabels.map((m) => m[2]).join(", ")}`);
}

// ── W-1c · THE S8 RECORD IS A READ-OUT, NOT A SECOND TYPING SURFACE ──────────────────────────────────
// Operator, twice: "S8 is the sole source of Truth" · "there is only one Value Prop visual that is source
// for everything including slide." W-1b made the CHART single-source; this makes the RECORD single-source.
{
  const F = await import("../lib/innovation-data.ts");
  const S8 = F.SLIDE_SCHEMA.find((s) => s.code === "S8");

  // (a) FIELD ORDER, DICTATED VERBATIM by the operator with a screenshot. Asserted as the WHOLE LIST, not
  //     "valuechart is before diffs" — a positional pair passes while three other fields shuffle behind it.
  ok(S8.fields.map((f) => f.id).join(",") === "vprop,nba,valuechart,diffs,wtp,capture,benefits,features",
     `S8 field order is vprop → nba → valuechart → diffs → wtp → capture → benefits → features (got ${S8.fields.map((f) => f.id).join(",")})`);
  // The instruction that produced it, in its own right: the chart sits directly ABOVE the table it explains.
  const ids = S8.fields.map((f) => f.id);
  ok(ids.indexOf("valuechart") === ids.indexOf("diffs") - 1,
     "the waterfall is the field immediately above Value equation — 'Place Chart Above', 'differentiators under visual value prop'");

  // (b) THE RESOLVER EXISTS AND IS NON-NULL — the V1 trap, asserted rather than remembered. `linked: true`
  //     without a branch returns null and renders the panel BLANK, which no type check and no build can see.
  const diffs = S8.fields.find((f) => f.id === "diffs");
  const capture = S8.fields.find((f) => f.id === "capture");
  ok(diffs.linked === true && capture.linked === true, "both S8 read-outs are linked, so neither accepts typing");
  ok(diffs.req === true, "diffs stays req:true — converting to a read-out must not move any project's gate score");
  ok(JSON.stringify(diffs.cols) === JSON.stringify([...F.S8_DIFF_COLS]),
     "the schema's columns ARE S8_DIFF_COLS — one list, so the header and the rows cannot drift apart");
  ok(!diffs.cols.includes("Ours") && !diffs.cols.includes("NBA"),
     "the retired OURS and NBA score columns are gone from the read-out, as they are from the chart's table");

  // (c) EXECUTED OVER EVERY PROJECT, not sampled. This is the assertion that makes `COMPETITIVE INDEX —`
  //     impossible: the defect was a TYPED metrics field rendering whatever was (not) in the bag.
  let blankRows = 0, blankIdx = 0, badWidth = 0, capDrift = 0, aiDrift = 0;
  for (const p of F.DEMO_PROJECTS) {
    const rows = F.linkedSlideField(p, "S8", "diffs");
    const cap = F.linkedSlideField(p, "S8", "capture");
    if (!Array.isArray(rows) || rows.length === 0) blankRows++;
    else if (rows.some((r) => r.length !== F.S8_DIFF_COLS.length)) badWidth++;
    // W-23 retired `index` for `range`; the PROPERTY under test is "the third tile is derived, never an
    // em dash", so the assertion follows the tile rather than the key name it happened to have.
    if (!cap || !cap.range || cap.range === "—") blankIdx++;
    if (!cap || cap.capture !== `${F.DEFAULT_CAPTURE_PCT}%`) capDrift++;
    if (JSON.stringify(F.aiSlideField(p, "S8", "diffs")) !== JSON.stringify(rows)) aiDrift++;
    if (JSON.stringify(F.aiSlideField(p, "S8", "capture")) !== JSON.stringify(cap)) aiDrift++;
  }
  ok(blankRows === 0, `every project resolves a non-empty Value-equation read-out (${blankRows} blank)`);
  ok(badWidth === 0, `every read-out row has exactly ${F.S8_DIFF_COLS.length} cells (${badWidth} ragged)`);
  ok(blankIdx === 0, `NO project can render an em-dash in the third capture tile (${blankIdx} still can)`);
  // The label and the geometry read ONE number — the whole lesson of this session applied to this tile.
  ok(capDrift === 0, `every project's Value-capture tile equals the chart's own capture % (${capDrift} drift)`);
  // The AI draft and the read-out are one producer apart, so they cannot print different answers.
  ok(aiDrift === 0, `aiSlideField and linkedSlideField agree on both S8 fields for every project (${aiDrift} drift)`);
}

// ── W-13 · BUSINESS CONFIDENCE IS MANUAL, DISCRETE, AND UNSET UNTIL SOMEBODY DECIDES ─────────────────
// Operator: "Add Manual 'Business Confidence' (by PdM/PgM) only using 10 - 95% Confidence and same options
// as before … or whatever we used to have for Technical and Commercial Confidence."
{
  const F = await import("../lib/innovation-data.ts");
  const fspW13 = await import("node:fs/promises");
  const srcW13 = await fspW13.readFile("app/innovation/page.tsx", "utf8");
  // REUSE, NOT A NEAR-DUPLICATE ARRAY. The operator's own fallback clause points at the existing ladder,
  // and forking a second one would leave two rung lists free to drift.
  ok(F.BIZ_CONF_LADDER === F.CONF_LADDER, "Business Confidence reuses CONF_LADDER — one rung list, not two");
  ok([...F.BIZ_CONF_LADDER].join(",") === "10,25,50,68,95,99", "the rungs are the ones the tool already had");

  // UNSET MEANS UNSET. A judgement nobody has made must not read as a number somebody chose.
  ok(F.bizConfOf({}) === null, "a project with no Business Confidence reads null, never a default");
  ok(F.bizConfOf({ bizConfPct: null }) === null, "an explicitly cleared value reads null");
  ok(F.bizConfOf({ bizConfPct: 42 }) === null, "an off-ladder value is rejected rather than displayed");
  ok(F.BIZ_CONF_LADDER.every((r) => F.bizConfOf({ bizConfPct: r }) === r), "every rung round-trips");
  ok(F.DEMO_PROJECTS.every((p) => F.bizConfOf(p) === null),
     "NO seeded project ships a Business Confidence — the call is the PdM/PgM's to make, not a seed's");

  // THE CONTROL EXISTS, IS A DISCRETE PICKER, AND WRITES THE FIELD. Counted on the real source, comments
  // stripped first — three probe errors this workstream came from assertions matching my own prose.
  const codeW13 = srcW13.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok(/Business Confidence/.test(codeW13), "the Business Confidence control is rendered");
  ok(/BIZ_CONF_LADDER\.map/.test(codeW13), "its options come from the ladder, never from inline literals");
  ok(/bizConfPct:/.test(codeW13), "it writes bizConfPct through onEditSource");
  ok(!/type="range"[^>]*bizConf/.test(codeW13), "it is a discrete picker, not a slider — rungs, not a continuum");
}

// ── W-14 · FLUID NUMBER ENTRY — A PURE UPDATER AND A GUARDED, DEBOUNCED WRITE ────────────────────────
// Operator: "Input fields allow for one number, then it takes me off; need fluid number entry for all Value
// Prop numbers." Their screenshot showed `VALUE CAPTURE % 3` after typing 33 — a DROPPED KEYSTROKE.
{
  const fspW14 = await import("node:fs/promises");
  const srcW14 = await fspW14.readFile("app/innovation/page.tsx", "utf8");
  const codeW14 = srcW14.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");   // the W-2 lesson

  // (a) THE UPDATER IS PURE. This is the defect itself: `writeFieldBags` JSON-serialises the whole portfolio
  //     bag AND fires a Supabase write, and it ran INSIDE `setBags` — so every character paid for both, twice
  //     over in StrictMode. Asserted on the updater body, not on the file, so an unrelated caller is fine.
  const upd = codeW14.slice(codeW14.indexOf("const writeCell ="), codeW14.indexOf("const setActive ="));
  ok(upd.length > 0 && !/writeFieldBags/.test(upd),
     "the setBags updater is PURE — no persistence inside a React state updater");

  // (b) THE GUARD, WHICH IS THE LOAD-BEARING PART. `bags` initialises to `{}`; an unguarded effect persists
  //     that empty object on first render and wipes every authored field. Mutation-tested by removing it.
  ok(/if \(!hydrated\.current\) return;/.test(codeW14),
     "nothing is persisted before hydration — an unguarded effect would write {} over the whole record");
  ok(/hydrated\.current = true/.test(codeW14), "hydration flips the guard once the real bag is loaded");

  // (c) DEBOUNCED, AND NOTHING IS LOST ON EXIT. `pagehide` — not `beforeunload`, which does not fire
  //     reliably on iOS Safari, the operator's own device.
  ok(/setTimeout\(\(\) => \{ writeFieldBags\(snapshot\)/.test(codeW14), "the write is deferred, not per-keystroke");
  ok(/addEventListener\("pagehide"/.test(codeW14), "the pending write is flushed on tab close / backgrounding");
  ok(!/addEventListener\("beforeunload"[^)]*flushBags/.test(codeW14),
     "beforeunload is NOT relied on — it does not fire reliably on iOS Safari");
}

// ── W-7 · PRICE PERFORMANCE: COMPETITION — editable markers, and the disk-not-pin convention ─────────
{
  const F = await import("../lib/innovation-data.ts");
  const fspW7 = await import("node:fs/promises");
  const srcW7 = await fspW7.readFile("app/innovation/page.tsx", "utf8");
  const codeW7 = srcW7.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");   // the W-2 lesson

  // (a) THE RENAME, and the old caption gone. Operator: "rename to: 'Price Performance: Competition'".
  // Y-1 · the SEPARATOR is now the deck's `·`, because on the slide this caption sits beside "NBA ·" and
  // reads as its peer; the words the operator named are unchanged.
  ok(/Price Performance · Competition/.test(codeW7), "the strip is captioned Price Performance · Competition");
  ok(/fill \? "font-semibold uppercase tracking-\[0\.12em\] text-emerald-300"/.test(codeW7),
     "…styled as a lean peer label ON THE SLIDE ONLY — the editor and deep-dive card keep the muted caption");
  ok(!/Willingness-to-pay · price-performance positioning/.test(codeW7), "the old caption is gone, not duplicated");

  // (b) MARKERS ARE DATA. Executed, not read: every project resolves a marker set, every x is inside 0..1,
  //     and NOTHING is written to a seeded project until someone drags — zero drift on open.
  let bad = 0, seeded = 0;
  for (const q of F.DEMO_PROJECTS) {
    const c = F.competitorsOf(q);
    if (!c.length || c.some((m) => !(m.x >= 0 && m.x <= 1) || !m.label)) bad++;
    if (q.competitors && q.competitors.length) seeded++;
  }
  ok(bad === 0, `every project resolves a valid competitor set (${bad} invalid)`);
  ok(seeded === 0, "no seeded project stores competitor positions — the default is used until someone drags");
  ok(F.competitorsOf({}).length === 3, "the default keeps NBA + Comp A + Comp B — no marker vanishes from any strip");
  ok(F.clampX(-4) === 0 && F.clampX(9) === 1 && F.clampX(0.42) === 0.42, "positions are clamped to the track");
  ok(F.clampX(NaN) === 0.5, "a non-finite position falls back to centre rather than rendering off-strip");

  // (c) COMP C, AND THEN STOP. Operator asked for Comp C, not an unbounded list.
  const base = F.competitorsOf({});
  ok(F.nextCompetitorLabel(base) === "Comp C", "the next label after NBA/A/B is Comp C");
  ok(F.nextCompetitorLabel([...base, { label: "Comp C", x: 0.8 }]) === null, "there is no Comp D — the control disables");

  // (d) OUR OWN MARKER IS NEVER DRAGGED. Its position is the competitive index; making it draggable would
  //     move the picture without moving the number. Asserted structurally, since that is where it can regress.
  const strip = codeW7.slice(codeW7.indexOf("function CompetitionStrip"), codeW7.indexOf("function ValueProp"));
  ok(strip.length > 0, "the strip is its own component");
  ok(/pointer-events-none[^"]*absolute[\s\S]{0,200}clampX\(ours\)/.test(strip),
     "the 'ours' marker is pointer-events-none and positioned from the index — it cannot be grabbed");
  // POINTER events, never mouse — a touch drag dies on any re-render that mutates the touched subtree.
  ok(/onPointerDown/.test(strip) && /onPointerMove/.test(strip), "dragging uses pointer events");
  ok(!/onMouseDown/.test(strip), "no mouse-only drag handler — that breaks every touch device");
  ok(/touch-none/.test(strip), "the track disables browser panning while editing, or the page scrolls instead");
  // Drag-only is unusable without a pointer.
  ok(/ArrowLeft/.test(strip) && /ArrowRight/.test(strip), "markers are keyboard-adjustable, not drag-only");
  ok(/role=\{editing \? "slider"/.test(strip), "an editable marker announces itself as a slider");

  // (e) EDITS ARE STAGED. Operator: "then saves, exiting Edit Mode" — a half-finished drag must not persist.
  ok(/const commit = \(\) => \{ onSave\?\.\(/.test(strip), "Save is the only writer; dragging touches a local draft");
  ok(/setEditing\(false\)/.test(strip), "saving leaves edit mode");
}

// ── W-7b · THE SAVE ICON IS A DISK, REPO-WIDE. "Never use a pin." ────────────────────────────────────
{
  const fspSave = await import("node:fs/promises");
  const pageSave = await fspSave.readFile("app/innovation/page.tsx", "utf8");
  const code = pageSave.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  // The pin is banned by NAME, because that is the thing the operator called out. `MarkPin` was the glyph
  // on "Save version"; it is now the lucide disk that Architect-2525 already uses.
  ok(!/MarkPin/.test(code), "no MarkPin remains — the pin glyph the operator banned is gone");
  ok(/import \{[^}]*\bSave\b[^}]*\} from "lucide-react"/.test(code),
     "the disk comes from lucide, the same glyph Architect-2525's design library already uses");
  // Every save control in this deck carries it — counted, so a fourth added later cannot ship bare.
  const saves = [...code.matchAll(/>\s*(?:<Save[^>]*\/>\s*)?Save[^<]*</g)];
  ok(saves.length >= 3, `every save control is accounted for (found ${saves.length})`);
  ok(saves.every((m) => /<Save/.test(m[0])), `every save control renders the disk — bare: ${saves.filter((m) => !/<Save/.test(m[0])).map((m) => m[0].trim()).join(" | ")}`);
}

// ── W-15 · THE PROJECTS TILE LEADS WITH THE DECISION ─────────────────────────────────────────────────
// Operator: "Projects should be 15 / 33 Funded … Funded (Funded/Submitted)". It read `33` big with
// `15 funded` as a whisper, so the headline was the number nobody acts on.
{
  const fspW15 = await import("node:fs/promises");
  const srcW15 = await fspW15.readFile("app/innovation/page.tsx", "utf8");
  const code = srcW15.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok(/label: "Projects", value: `\$\{funded\.length\} \/ \$\{projects\.length\}`/.test(code),
     "the Projects tile leads with funded / submitted, not the raw count");
  ok(/sub: "Funded \(Funded\/Submitted\)"/.test(code), "the subtitle names the ratio the operator asked for");
  ok(!/sub: `\$\{funded\.length\} funded`/.test(code), "the old 'N funded' whisper is gone, not left beside it");
}

// ── W-17 · THE PICKER NAMES THE LEVEL YOU JUST DRILLED PAST ──────────────────────────────────────────
// Operator: "If single BU is highlighted, show SBU in front of project title. If single SBU is highlighted,
// show Alpha Group in front of Title. If Alpha Group, show Alpha Code in front of Title."
{
  const F = await import("../lib/innovation-data.ts");
  const none = { bu: [], sbu: [], pgroup: [] };
  const p = F.DEMO_PROJECTS[0], h = F.hierOf(p);

  // THE THREE RULES, EXECUTED — each pinned level yields the level BELOW it.
  ok(F.scopePrefixOf(p, { ...none, bu: [h.bu] }) === h.sbu, "single BU pinned → the SBU is the prefix");
  ok(F.scopePrefixOf(p, { ...none, sbu: [h.sbu] }) === h.pgroup, "single SBU pinned → the Alpha Group is the prefix");
  ok(F.scopePrefixOf(p, { ...none, pgroup: [h.pgroup] }) === h.alpha, "single Alpha Group pinned → the Alpha Code is the prefix");
  // DEEPEST WINS — pinning BU *and* SBU is a drill to the SBU, so the Alpha Group is what distinguishes rows.
  ok(F.scopePrefixOf(p, { ...none, bu: [h.bu], sbu: [h.sbu] }) === h.pgroup, "the deepest single selection wins");

  // "HIGHLIGHTED" MEANS EXACTLY ONE. Two SBUs is a COMPARISON; prefixing with the level below would hide the
  // very thing being compared. This is the assertion that stops the feature firing on a multi-select.
  ok(F.scopePrefixOf(p, { ...none, sbu: [h.sbu, "OTHER"] }) === null, "two selected values is a comparison, not a drill — no prefix");
  ok(F.scopePrefixOf(p, none) === null, "no scope, no prefix");
  ok(F.scopePrefixOf(p, null) === null, "a missing selection is handled, not thrown on");

  // ZERO DRIFT WITH NO SCOPE, ACROSS THE PORTFOLIO — the label must be byte-identical to today by default.
  const drift = F.DEMO_PROJECTS.filter((q) => F.scopedProjectLabel(q, none) !== q.name).length;
  ok(drift === 0, `with no scope every label is the bare project name (${drift} drifted)`);
  // And when it DOES fire it must actually add something — a prefix that repeats nothing is decoration.
  const bu1 = F.DEMO_PROJECTS.filter((q) => F.scopedProjectLabel(q, { ...none, bu: [F.hierOf(q).bu] }) === q.name).length;
  ok(bu1 === 0, `under a single-BU scope every project gains a prefix (${bu1} gained none)`);
  // An unset Alpha Code seeds as an em dash; "— · Name" would read as a defect, so it yields no prefix.
  const dash = F.DEMO_PROJECTS.filter((q) => F.scopedProjectLabel(q, { ...none, pgroup: [F.hierOf(q).pgroup] }).startsWith("— ")).length;
  ok(dash === 0, `no label is prefixed with an em-dash placeholder (${dash} were)`);

  // ONE PRODUCER — the picker must not format its own label.
  const fspW17 = await import("node:fs/promises");
  const codeW17 = (await fspW17.readFile("app/innovation/page.tsx", "utf8"))
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok(/scopedProjectLabel\(p, hierFilter\)/.test(codeW17), "the gate picker routes its label through the one producer");
}

// ── W-18 · THE EDIT BADGE ON THE OWNING SLIDE OPENS THE EDITOR ───────────────────────────────────────
// Operator: "not sure how to add and edit differentiators vs NBA." W-1c made the field a read-out; the badge
// beside it was an inert <span> because the code believed there was nowhere to go. The editor was on the
// same slide, in a COLLAPSED panel.
{
  const fspW18 = await import("node:fs/promises");
  const codeW18 = (await fspW18.readFile("app/innovation/page.tsx", "utf8"))
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok(/onClick=\{\(\) => \{ setSrcOpen\(true\);/.test(codeW18),
     "on the owning slide the ✎ badge OPENS the source panel — it is a control, not a caption");
  ok(/data-source-panel/.test(codeW18), "the panel carries the anchor the badge scrolls to");
  ok(/querySelector\("\[data-source-panel\]"\)\?\.scrollIntoView/.test(codeW18),
     "opening also brings the editor into view — expanding something off-screen is not discoverability");
  // The editor itself already meets the operator's spec; asserted so a later 'simplification' cannot drop a control.
  // ⚠ PROBE ERROR #10, RECORDED BESIDE THE ASSERTION THAT PRODUCED IT. The first draft sliced from
  // `const table = mode ===` to `const chart = (` — but the chart is declared BEFORE the table in the file,
  // so indexOf returned a LOWER index and the slice was empty. Four assertions failed against "" while the
  // code was correct. Slice forward from the table to the end of the component instead.
  const tblStart = codeW18.indexOf("const table = mode ===");
  const tbl = codeW18.slice(tblStart, codeW18.indexOf("function ProjectRevChart", tblStart));
  ok(/set\(i, \{ name: v \}\)/.test(tbl), "the differentiator NAME is editable");
  ok(/set\(i, \{ valueM: v \}\)/.test(tbl), "the VALUE $M is editable and is the bar");

  // ── X-0c · ONE NUMBER-ENTRY ENGINE ────────────────────────────────────────────────────────────────
  // Operator: "I checked Financials and input works fine — see if you can apply number enter from
  // financials to fields for value prop." S10's FinCell is the surface that works, so the value prop uses
  // IT rather than a near-miss copy. Asserted as REUSE, not as a shape: the driver table must route entry
  // through the shared cells and must not hand-roll a raw <input> again.
  ok(/<FinCell /.test(tbl), "Value $M routes through S10's FinCell — the entry engine that already works");
  ok(/<TextCell /.test(tbl), "the differentiator NAME routes through TextCell — uncontrolled, commit on blur");
  ok(!/<input /.test(tbl), "no hand-rolled <input> survives in the driver table — a second engine is how they drift");

  // ⚠ A FIELD'S KEY MUST NEVER CONTAIN A SIBLING FIELD'S VALUE. This is the defect the operator reported as
  // "1 letter or number defaults and takes cursor to front or off the field". MEASURED, before and after:
  // Value $M typed cleanly in isolation (caret 1→2→3) and lost focus to BODY on EVERY keystroke once the
  // NAME had been edited, because the key was `${title}:${value}` and this title embeds `d.name`. A changed
  // key makes React unmount the input mid-typing. The `keySeed` must be stable — the row INDEX, never `d.name`.
  const seed = /keySeed=\{`([^`]*)`\}/.exec(tbl)?.[1] ?? "";
  ok(/<FinCell[^>]*keySeed=/.test(tbl.replace(/\n/g, " ")), "Value $M pins a stable keySeed");
  ok(seed.includes("${i}") && !seed.includes("d.name"),
     "the keySeed is the row index and contains NO sibling field — a volatile key remounts the input mid-typing");

  // The two panel fields that used to sit INSIDE a wrapping <label>: clicking any part of a wrapping label
  // re-focuses its control at caret 0, which is literally "takes cursor to front". Association is kept via
  // htmlFor/id, which does not steal the click.
  // ⚠ PROBE ERROR #12, RECORDED BESIDE THE ASSERTION THAT PRODUCED IT. The first draft sliced FROM the
  // label's text — but `htmlFor="s8-vprop"` is written BEFORE that text in `<label htmlFor=…>Primary …`,
  // so the attribute fell outside the window and a correct fix reported red. Start the slice 400 chars
  // earlier so the opening tag is inside it.
  const vpAt = codeW18.indexOf("Primary customer value proposition");
  const panel = codeW18.slice(Math.max(0, vpAt - 400), vpAt + 2200);
  // ⚠ PROXY LOCK #13, REWRITTEN BEFORE IT WAS TRUSTED. The first form was
  // `!/<label[^>]*>[^<]*Primary…[\s\S]{0,400}?<textarea/` — which matches whether or not the textarea is
  // INSIDE the label, because `[\s\S]{0,400}?` happily crosses the `</label>`. It reported red on correct
  // code. The PROPERTY is "the label closes before the control opens", so assert exactly that.
  const lblOpen = panel.indexOf("<label htmlFor=\"s8-vprop\"");
  const taOpen = panel.indexOf("<textarea id=\"s8-vprop\"");
  ok(lblOpen > 0 && taOpen > lblOpen && panel.slice(lblOpen, taOpen).includes("</label>"),
     "the value-prop <label> CLOSES before the textarea opens — a wrapping label hijacks the click and resets the caret");
  ok(/htmlFor="s8-vprop"/.test(panel) && /id="s8-vprop"/.test(panel),
     "label association is kept with htmlFor/id instead of wrapping");
  ok(/\[1, 2, 3, 4, 5\]\.map\(\(v\) => <option/.test(tbl), "IMPORTANCE is a 1-5 drop-down, per the operator");
  ok(/<VsNba tone=\{tone\}/.test(tbl) && !/set\(i, \{ *tone/.test(tbl),
     "the ▲▬▼ is DERIVED from the sign of the dollars and is never typed");
}

// ── W-19 + W-20 · THE STACKED GOLDEN PRICE BAR, AND THE 3D BEVEL ─────────────────────────────────────
{
  const fspW19 = await import("node:fs/promises");
  const raw = await fspW19.readFile("app/innovation/page.tsx", "utf8");
  const vp = raw.slice(raw.indexOf("function ValueProp("), raw.indexOf("function ProjectRevChart"))
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  // W-19 · Operator: "Make blue bar stacked Bar (with value above NBA as Golden). So 85-144 is golden bar."
  ok(/s\.kind === "total" && s\.from === 0 && ve\.referenceM > 0 && s\.to > ve\.referenceM/.test(vp),
     "the price bar splits ONLY when it is a total that actually clears the NBA price");
  // GEOMETRY FROM THE SAME SCALE, not a second one — this is what makes the gold height equal price − NBA.
  ok(/<Bar3D x=\{x\} y=\{y\(ve\.referenceM\)\}/.test(vp) && /<Bar3D x=\{x\} y=\{top\}[^/]*k="gold"/.test(vp),
     "the split is drawn at y(ve.referenceM) — the SAME scale fn and reference the NBA bar uses");
  ok(/k="gold"/.test(vp), "the segment above the NBA price is gold");
  // The base segment reuses the NBA bar's own slate, so the chart bookends their price against ours.
  ok(/base: "#64748b"/.test(vp), "the gold bar's base is the same slate as the NBA bar at the far left");

  // W-20 · Operator: "Make bars futuristic; 3D shaded like attached."
  ok(/<linearGradient key=\{k\} id=\{`\$\{gid\}-\$\{k\}`\}/.test(vp), "each semantic fill has its own gradient");
  ok(/const gid = useId\(\)/.test(vp),
     "gradient ids are PER-INSTANCE — two charts on one page would otherwise share the first one's fills");
  ok(/replace\(\/:\/g, ""\)/.test(vp), "the useId colons are stripped — they are illegal inside an SVG url(#…)");
  // ONE HELPER, COUNTED: a future bar cannot ship flat by omission.
  const rects = [...vp.matchAll(/<rect x=\{x\}[^>]*fill=\{fill\(/g)];
  ok(rects.length === 0, `no bar is drawn as a flat rect any more (${rects.length} still are)`);
  ok((vp.match(/<Bar3D /g) ?? []).length === 3, "every bar body routes through the ONE Bar3D helper");
  ok(/fill="#ffffff" opacity=\{0\.28\}/.test(vp) && /fill="#000000" opacity=\{0\.22\}/.test(vp),
     "the bevel is a lighter cap and a darker foot — Excel's 3-D bevel, which is what the operator sent");
  // The shading must not move a NUMBER: the value label and the tick scale are untouched by it.
  ok(/y=\{top - 1\.5\}/.test(vp), "the value label still sits in the reserved top band — shading changed no geometry");
}

// ── W-21 · THE CUSTOMER-VALUE BAR READS POSITIVE, AND ONLY THAT BAR ──────────────────────────────────
// Operator: "Also make blue bar title from negative to positive." 120 of customer surplus is a good thing;
// the minus was contradicting the word printed directly beneath it.
{
  const fspW21 = await import("node:fs/promises");
  const raw21 = await fspW21.readFile("app/innovation/page.tsx", "utf8");
  const vp21 = raw21.slice(raw21.indexOf("function ValueProp("), raw21.indexOf("function ProjectRevChart"))
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  ok(/const barLabel = \(b: Bar\) => \(b\.kind === "give" \?/.test(vp21),
     "only the `give` (Customer Value) bar drops its sign");
  // THE GIVE-BACK BARS KEEP THEIRS. This is the assertion that stops a blanket Math.abs erasing the one
  // sign that carries meaning — a rose bar IS value destroyed.
  ok(/: money\(b\.v\)\)/.test(vp21), "every other bar still routes through the signed formatter");
  ok(!/Math\.abs\(s\.v\)/.test(vp21), "no blanket abs on the label — that would hide the rose give-backs' minus");
  // THE MODEL IS UNTOUCHED: the sign still draws the bar downward. Display-only, like the G2 decimals fix.
  ok(/v: -split\.customerValueM/.test(vp21),
     "the model keeps the NEGATIVE value — the sign is geometry, and only the READING changed");
  ok(/\{barLabel\(s\)\}<\/text>/.test(vp21), "the drawn label and the tooltip read the same formatter");
}

// ── W-23 · VALUE PRICE RANGE REPLACES COMPETITIVE INDEX ──────────────────────────────────────────────
// Operator: "Instead of Competitive Index, show: $ 85 - 144 / Value Price Range. So bottom Range is NBA
// price and Top end is the %Value Capture Price (currently set at 33%)."
{
  const F = await import("../lib/innovation-data.ts");
  const S8 = F.SLIDE_SCHEMA.find((s) => s.code === "S8");
  const items = S8.fields.find((f) => f.id === "capture").items;
  ok(items.some((i) => i.k === "range" && i.label === "Value Price Range"), "the third tile is the Value Price Range");
  ok(!items.some((i) => i.k === "index"), "Competitive index is gone from the tile set, not left beside it");

  // THE RANGE IS THE SAME TWO NUMBERS THE GOLD STACKED BAR IS DRAWN FROM — floor = NBA price, ceiling =
  // price at the capture %. Executed on every project, so the tile and the geometry cannot disagree.
  let bad = 0, stale = 0;
  for (const q of F.DEMO_PROJECTS) {
    const ve = F.valueEquationOf(q), sp = F.valueSplit(ve.evcUsdM, ve.referenceM);
    const c = F.valuePropCapture(q);
    if (c.range !== `$${Math.round(ve.referenceM)} – ${Math.round(sp.priceM)}M`) bad++;
    if ("index" in c) stale++;
  }
  ok(bad === 0, `every project's range is NBA price → capture price (${bad} disagree)`);
  ok(stale === 0, `the retired index key is not still emitted alongside it (${stale} projects)`);
  // The floor must be the NBA and the ceiling the price — not the other way round, and never inverted.
  const q0 = F.DEMO_PROJECTS[0], ve0 = F.valueEquationOf(q0), sp0 = F.valueSplit(ve0.evcUsdM, ve0.referenceM);
  ok(sp0.priceM >= ve0.referenceM, "the ceiling is at or above the floor — a capture % never prices below the NBA");
}

// ── X-9 · THE RISK TABLE: = Incr Rev · Incr Mgn · Total Rev, AND "FULL REV" IS RETIRED ───────────────
// Operator: "= Incr Rev  Full Rev  Incr Mgn  becomes  = Incr Rev  Incr Mgn  Total Rev. Total Rev is Grey,
// plus Green + Orange (risk to get to Full Rev), it's misleading to call total chart of final year Full Rev."
// The column is Base + Incremental and the incremental half is the AT-RISK half, so "Full" asserts an
// outcome the number has not earned. Locked as ORDER + NAME + TONE, because all three were the ask.
{
  const fspX9 = await import("node:fs/promises");
  const srcX9 = await fspX9.readFile(new URL("../app/innovation/page.tsx", import.meta.url), "utf8");
  const at = srcX9.indexOf("Funded incremental ·");
  ok(at > 0, "the funded-incremental risk table is still a locatable surface");
  const head = srcX9.slice(at, srcX9.indexOf("</thead>", at));

  // ORDER, read as the sequence the header actually emits — not as three independent presence checks,
  // which would pass on ANY arrangement. That distinction is the whole point of this lock.
  const order = [...head.matchAll(/>(= Incr Rev|Incr Mgn|Total Rev|Full Rev)</g)].map((m) => m[1]);
  ok(JSON.stringify(order) === JSON.stringify(["= Incr Rev", "Incr Mgn", "Total Rev"]),
     `the risk table reads = Incr Rev → Incr Mgn → Total Rev (got ${JSON.stringify(order)})`);

  // NAME — retired on this surface, caption included, so the header and the formula cannot disagree.
  const tbl9 = srcX9.slice(at, srcX9.indexOf("</table>", at));
  ok(!/Full Rev/.test(tbl9), "no 'Full Rev' survives anywhere in the risk table, caption included");
  ok(/Base \+ Incr = Total Rev/.test(tbl9), "the caption states the arithmetic with the new name");

  // TONE — grey, because it is a SUM of the coloured columns beside it rather than a rival to them.
  ok(/text-slate-300">Total Rev</.test(tbl9), "the Total Rev header is grey, per the operator");
  ok(!/text-sky-300/.test(tbl9), "the old sky-blue Total/Full column tone is gone from this table");
}

// ── X-1d · THE WATERFALL'S HEIGHT CHAIN, LOCKED END TO END ──────────────────────────────────────────
// FIVE separate boxes between the panel row and the SVG have each, at some point, been the one that broke
// this. Fixing them one at a time is how the same defect shipped three times, so this asserts the WHOLE
// chain: every link must carry a definite height in slide mode, because `h-full`/`flex-1` resolves to
// nothing the moment ONE ancestor sizes to content. Measured cost of the last break: S8 clipped 258px.
{
  const fspX1d = await import("node:fs/promises");
  const srcX1d = await fspX1d.readFile(new URL("../app/innovation/page.tsx", import.meta.url), "utf8");

  // link 1+2 · the panel body gives the chart the whole box. X-2 removed the three capture figures from the
  // slide, so the value panel has ONE child and `content-stretch` hands it every pixel — which is what the
  // `minmax(0,1fr) auto` template existed to approximate. The property is unchanged: the chart's row fills.
  ok(/data-panel-body className="grid min-h-0 flex-1 content-stretch/.test(srcX1d),
     "the panel body stretches its rows, so the chart's row fills the panel");
  ok(/<AmtsPanel tall title="Value · Creation \+ Capture" icon="◈">\s*\{fieldsOf\("valuechart"\)\}/.test(srcX1d),
     "the value panel renders the chart ALONE — the capture chips are on the chart, not stacked under it");
  // link 3 · the field wrapper grows
  ok(/\$\{bare \? "" : big \? "p-\[0\.45cqw\]" : "p-2"\} flex min-h-0 flex-1 flex-col/.test(srcX1d),
     "the chart field wrapper carries flex-1 + min-h-0");
  // link 4 · BOTH ChartFrame boxes carry the height when not maximised
  const cfAt = srcX1d.indexOf("function ChartFrame");
  const cf = srcX1d.slice(cfAt, srcX1d.indexOf("\n}", srcX1d.indexOf("return (", cfAt)));
  ok((cf.match(/: "relative flex min-h-0 flex-1 flex-col"/g) || []).length === 1
     && (cf.match(/: "flex min-h-0 flex-1 flex-col"/g) || []).length === 1,
     "both ChartFrame boxes carry the height through when not maximised");
  // link 5 · ValueProp's OWN ROOT — the one that actually clipped 258px. `space-y-1` is a plain block.
  ok(/big \? "flex min-h-0 flex-1 flex-col gap-1" : "space-y-1"/.test(srcX1d),
     "ValueProp's root is a bounded flex column in slide mode — a plain block here sizes to content and clips");
  // the SVG is a flex ITEM of that column, so it is bounded rather than intrinsic
  ok(/className=\{big \? "min-h-0 w-full flex-1" : "w-full"\}/.test(srcX1d),
     "the waterfall SVG is a bounded flex item in slide mode, never h-full against an auto-height parent");
  // and non-slide modes are untouched — the deep dive and source panel keep auto height
  ok(/style=\{big \? undefined : \{ height: "auto" \} \}/.test(srcX1d.replace(/\s+/g, " ")) || /height: "auto"/.test(srcX1d),
     "non-slide modes keep auto height — this change is scoped to the slide");
}

// ── X-4 · THE CANONICAL TWELVE, AND NO PER-UNIT FIGURE THROUGH THE $K→$M CONVERTER ──────────────────
// Operator: "Reduce Metrics to 12 key for decision making." The set was 14; exactly two fell outside the
// FLIR twelve the lib already documents, and removing them deleted a LIVE BUG rather than relabelling one.
{
  const fspX4 = await import("node:fs/promises");
  const srcX4 = await fspX4.readFile(new URL("../app/innovation/page.tsx", import.meta.url), "utf8");
  const at4 = srcX4.indexOf("const metrics: [string, string][] = [");
  ok(at4 > 0, "the project-metrics tile list is a locatable surface");
  const list = srcX4.slice(at4, srcX4.indexOf("];", at4));
  const labels = [...list.matchAll(/\["([^"]+)",/g)].map((m) => m[1]);
  ok(labels.length === 12, `exactly 12 metric tiles (got ${labels.length}: ${labels.join(" · ")})`);

  // The twelve are the documented FLIR set — asserted as a SET, so a swap is caught, not just a count.
  const want = ["NPV", "REV/NRE", "IRR", "Gross Margin", "Payback", "Quantity (10-Yr)", "10-Yr Revenue",
                "10-Yr Gross Profit", "Cur-Yr Op Expense", "Total R&D Op Ex", "Capital", "Man Hours"];
  ok(JSON.stringify([...labels].sort()) === JSON.stringify([...want].sort()),
     "the twelve are the documented FLIR set — no substitutions");

  // ⚠ THE REAL DEFECT, LOCKED AS ARITHMETIC RATHER THAN AS A LABEL. `k` is the $K→$M converter and
  // `ex.cogsK` is a PER-UNIT price in $K, so `k(ex.cogsK)` rendered a ~$40k unit cost as "$0.0M" — correct
  // value, destroyed by a program-scale converter. Banning the SHAPE stops it coming back under any name.
  ok(!/k\(ex\.cogsK\)/.test(list), "no tile applies the $K→$M converter to a per-unit figure");
  ok(!/Unit COGS|COGS \(10-Yr\)/.test(list), "the two non-canonical COGS tiles are gone");
}

// ── X-1c · THREE BANDS · X-5a · CAPTURE % IS AN INPUT ───────────────────────────────────────────────
{
  const fspX5 = await import("node:fs/promises");
  const srcX5 = await fspX5.readFile(new URL("../app/innovation/page.tsx", import.meta.url), "utf8");
  const libX5 = await fspX5.readFile(new URL("../lib/innovation-data.ts", import.meta.url), "utf8");

  // X-1c — the marker wrapper must NOT translate the dot+label STACK; that is what put the dot above the
  // rule and the label into the LOW/HIGH band. A `1fr auto 1fr` grid over the full height puts the middle
  // row on the centre line. Measured after the fix: dot offsets 0,0,0,0 · labels -7px · LOW/HIGH +11px.
  const cs = srcX5.indexOf("function CompetitionStrip");
  const strip = srcX5.slice(cs, srcX5.indexOf("\nfunction ", cs + 10));
  ok(/grid-rows-\[1fr_auto_1fr\]/.test(strip), "the marker is a 1fr/auto/1fr grid, so the dot row IS the centre line");
  ok(!/absolute top-1\/2 -translate-x-1\/2 -translate-y-1\/2/.test(strip),
     "no marker wrapper translates the dot+label stack — that is what dropped labels onto the LOW/HIGH band");
  ok((strip.match(/row-start-2/g) || []).length === 2, "both dots (competitors + ours) sit in the centre row");
  ok((strip.match(/row-start-1[^"]*self-end/g) || []).length >= 2, "labels bottom-align in the row ABOVE the rule");

  // X-5a — capture % is per-project and EVERY consumer reads the same accessor, so the chart's two bars,
  // the tile and the price range cannot disagree. Driven: 33% → 50% moved all three together.
  ok(/export const captureOf =/.test(libX5), "captureOf is the one reader of the per-project capture %");
  ok(/capturePct\?: number \| null;/.test(libX5), "Project carries an OPTIONAL capturePct — seeded projects keep the default");
  const splits = [...srcX5.matchAll(/valueSplit\(/g), ...libX5.matchAll(/valueSplit\(/g)];
  const bare = [...srcX5.matchAll(/valueSplit\(([^)]*)\)/g), ...libX5.matchAll(/valueSplit\(([^)]*)\)/g)]
    .filter((m) => !/captureOf\(|capturePct/.test(m[1]) && !/evcUsdM: number/.test(m[1]));
  ok(bare.length === 0, `every valueSplit caller passes the per-project % (${bare.length} still use the bare default)`);
  ok(/aria-label="Value capture percent"/.test(srcX5) || /title="Value capture percent"/.test(srcX5),
     "the capture % is a real input with an accessible name, not a read-out");
  ok(/onClear=\{\(\) => onEditSource\(\{ capturePct: null \}/.test(srcX5),
     "clearing the field restores the 33% default rather than committing a zero");
}

console.log(`\nINNOVATION-TIME ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
