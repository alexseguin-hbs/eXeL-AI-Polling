// Project Innovation — Vision • 2525 (CRS-36 → CRS-93).
// RACK (registry) + STACK (prioritization above/below the funding line) + the Series-9
// differentiators (3×3×3 gate cube, risk-prediction market, Project Upside pool, $/min cost
// of elapsed time, AI·SI·HI intelligence load). Pure data + calculators — no I/O, deterministic.

export type Gate = "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
export const GATES: Gate[] = ["G1", "G2", "G3", "G4", "G5", "G6", "G7"];
// Stage tolerance bands (CRS-86): ±% by phase, tightening gate over gate.
export const GATE_BAND: Record<Gate, number> = { G1: 0.6, G2: 0.6, G3: 0.4, G4: 0.2, G5: 0.1, G6: 0.05, G7: 0.05 };
export const GATE_STAGE: Record<Gate, string> = {
  G1: "Concept", G2: "Plan", G3: "Develop", G4: "Develop", G5: "Qualify", G6: "Launch", G7: "Sustain",
};

// Risk model (operator default): probability weight = P(tech) × P(comm), each from a discrete
// risk level. Low = 90% · Med = 60% · High = 30% probability of success. So Low/Low captures
// 0.9×0.9 = 81% of revenue (19% upside); High/High captures 0.3×0.3 = 9% (91% upside).
export type RiskLevel = "low" | "med" | "high";
export const RISK_P: Record<RiskLevel, number> = { low: 0.9, med: 0.6, high: 0.3 };
export const riskNum = (l: RiskLevel) => 1 - RISK_P[l]; // probability of failure (for tolerance band)
export const RISK_LABEL: Record<RiskLevel, string> = { low: "Low", med: "Med", high: "High" };

// Every project rolls up to a Line of Business (LOB) — the growth-model / stack filter axis.
export const LOBS = ["Defense & ISR", "Autonomy", "Software & SaaS", "Commercial", "Space", "Components"] as const;

export interface Project {
  id: string;
  name: string;
  division: string;
  manager: string;
  category: string;
  gate: Gate;                 // last completed gate → derives stage (CRS-56, never user-set)
  confidence: 1 | 2 | 3 | 4;  // reviewer-set (CRS-38)
  tech: RiskLevel;            // technical risk → success prob RISK_P[tech]
  comm: RiskLevel;            // commercial risk → success prob RISK_P[comm]
  lob: string;                // line of business (portfolio roll-up + growth-model filter)
  nreK: number;               // non-recurring engineering $K (CRS-47)
  fullRev10yM: number;        // 10-yr new-product revenue $M (CRS-49)
  doNothing10yM: number;      // do-nothing baseline $M (CRS-50)
  firstRevenue: string;       // derived date of first revenue (CRS-87)
  criticalPath: boolean;      // on the cross-project critical path (CRS-89/92)
  humanLoad: number;          // 0..1 sustained human-intelligence load (CRS-93 burnout guard)
  ai: number; si: number; hi: number; // intelligence contribution mix (sums ~1)
  predictions: number;        // open risk-market predictions against the project (CRS-81)
}

// ── Calculators (all derived, never stored — CRS-52/53/67) ──────────────────────────────
export const incrementalRevM = (p: Project) => Math.max(0, p.fullRev10yM - p.doNothing10yM);
export const pSuccess = (p: Project) => RISK_P[p.tech] * RISK_P[p.comm]; // Tech×Comm weight (CRS-53)
export const upsideFraction = (p: Project) => 1 - pSuccess(p);           // unrealized potential
export const weightedRevM = (p: Project) => incrementalRevM(p) * pSuccess(p);
// Simplified 10-yr NPV: weighted incremental revenue margin (~35%) discounted, less NRE. Demo model.
export const npvM = (p: Project) => weightedRevM(p) * 0.35 * 0.78 - p.nreK / 1000;
export const revOverNre = (p: Project) => (p.nreK ? (incrementalRevM(p) * 1000) / p.nreK : 0);
// IRR proxy from NPV intensity vs NRE — for demo ranking only.
export const irrPct = (p: Project) => {
  const r = npvM(p) / Math.max(0.05, p.nreK / 1000);
  return Math.max(-20, Math.min(90, Math.round(8 + r * 6)));
};
// 27-cell gate cube fill (CRS-79/80): deliverables approved so far, by gate progression.
export const cubeFilled = (p: Project) => Math.round((GATES.indexOf(p.gate) + 1) / GATES.length * 27);

export interface DivisionBudget { division: string; totalK: number; allocatedK: number; }
export const availableK = (b: DivisionBudget) => b.totalK - b.allocatedK; // CRS-70

// ── Demo portfolio (seed; a real deploy loads from the platform event log) ───────────────
export const DEMO_BUDGET: DivisionBudget = { division: "ALL DIVISIONS", totalK: 42000, allocatedK: 6000 };

export const DEMO_PROJECTS: Project[] = [
  { id: "PRJ-01", name: "Thermal Core Gen-5 Sensor", division: "ISR", lob: "Defense & ISR", manager: "A. Seguin", category: "New Platform", gate: "G4", confidence: 4, tech: "low", comm: "low", nreK: 8200, fullRev10yM: 210, doNothing10yM: 60, firstRevenue: "2026-Q4", criticalPath: true, humanLoad: 0.62, ai: 0.4, si: 0.3, hi: 0.3, predictions: 41 },
  { id: "PRJ-02", name: "Edge Fusion AI Module", division: "Autonomy", lob: "Autonomy", manager: "R. Kaur", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 5400, fullRev10yM: 155, doNothing10yM: 30, firstRevenue: "2027-Q1", criticalPath: true, humanLoad: 0.74, ai: 0.55, si: 0.25, hi: 0.2, predictions: 33 },
  { id: "PRJ-03", name: "Maritime Littoral Radar", division: "ISR", lob: "Defense & ISR", manager: "M. Devlin", category: "Sustaining+", gate: "G5", confidence: 4, tech: "low", comm: "low", nreK: 6100, fullRev10yM: 140, doNothing10yM: 55, firstRevenue: "2026-Q3", criticalPath: false, humanLoad: 0.48, ai: 0.3, si: 0.35, hi: 0.35, predictions: 22 },
  { id: "PRJ-04", name: "Counter-UAS Effector", division: "Effects", lob: "Defense & ISR", manager: "T. Cho", category: "New Platform", gate: "G2", confidence: 2, tech: "med", comm: "med", nreK: 9300, fullRev10yM: 260, doNothing10yM: 20, firstRevenue: "2028-Q2", criticalPath: true, humanLoad: 0.81, ai: 0.35, si: 0.3, hi: 0.35, predictions: 57 },
  { id: "PRJ-05", name: "SoI Governance Cloud", division: "Software", lob: "Software & SaaS", manager: "L. Okafor", category: "New Product", gate: "G4", confidence: 3, tech: "med", comm: "low", nreK: 4200, fullRev10yM: 180, doNothing10yM: 25, firstRevenue: "2026-Q4", criticalPath: false, humanLoad: 0.55, ai: 0.6, si: 0.25, hi: 0.15, predictions: 29 },
  { id: "PRJ-06", name: "Handheld Multispectral", division: "Handheld", lob: "Commercial", manager: "P. Nilsson", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "med", nreK: 3600, fullRev10yM: 95, doNothing10yM: 40, firstRevenue: "2027-Q2", criticalPath: false, humanLoad: 0.44, ai: 0.3, si: 0.3, hi: 0.4, predictions: 18 },
  { id: "PRJ-07", name: "Space Payload Optics", division: "Space", lob: "Space", manager: "V. Rossi", category: "New Platform", gate: "G2", confidence: 2, tech: "high", comm: "med", nreK: 12500, fullRev10yM: 340, doNothing10yM: 10, firstRevenue: "2029-Q1", criticalPath: true, humanLoad: 0.7, ai: 0.45, si: 0.3, hi: 0.25, predictions: 63 },
  { id: "PRJ-08", name: "Ground Station Modernization", division: "Software", lob: "Software & SaaS", manager: "S. Haddad", category: "Sustaining", gate: "G6", confidence: 4, tech: "low", comm: "low", nreK: 2100, fullRev10yM: 70, doNothing10yM: 45, firstRevenue: "2026-Q2", criticalPath: false, humanLoad: 0.38, ai: 0.25, si: 0.4, hi: 0.35, predictions: 11 },
  { id: "PRJ-09", name: "Cryo-Cooler Next-Gen", division: "Components", lob: "Components", manager: "D. Park", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 4800, fullRev10yM: 120, doNothing10yM: 38, firstRevenue: "2027-Q3", criticalPath: true, humanLoad: 0.6, ai: 0.3, si: 0.35, hi: 0.35, predictions: 26 },
  { id: "PRJ-10", name: "Autonomy SDK & Marketplace", division: "Software", lob: "Software & SaaS", manager: "R. Kaur", category: "New Product", gate: "G2", confidence: 2, tech: "med", comm: "med", nreK: 3900, fullRev10yM: 130, doNothing10yM: 15, firstRevenue: "2028-Q1", criticalPath: false, humanLoad: 0.5, ai: 0.65, si: 0.2, hi: 0.15, predictions: 34 },
  { id: "PRJ-11", name: "Legacy Sensor EOL Bridge", division: "Handheld", lob: "Commercial", manager: "M. Devlin", category: "Phase-out", gate: "G5", confidence: 4, tech: "low", comm: "low", nreK: 1400, fullRev10yM: 40, doNothing10yM: 35, firstRevenue: "2026-Q1", criticalPath: false, humanLoad: 0.3, ai: 0.2, si: 0.4, hi: 0.4, predictions: 8 },
  { id: "PRJ-12", name: "Quantum-Secure Comms", division: "Software", lob: "Software & SaaS", manager: "T. Cho", category: "New Platform", gate: "G1", confidence: 1, tech: "high", comm: "med", nreK: 7600, fullRev10yM: 300, doNothing10yM: 5, firstRevenue: "2030-Q1", criticalPath: true, humanLoad: 0.68, ai: 0.5, si: 0.3, hi: 0.2, predictions: 72 },
];

// ── TIME ENGINE (CRS-85→88) — start date → schedule → month/week/day/hour/min ────────────
// Time is the master variable (R-CORE §4): everything below is derived from a start date +
// the gate-duration profile. Date of first revenue is NEVER typed — it falls out of the plan.
export const WORKDAY_HOURS = 8;
export const WORKDAYS_PER_MONTH = 21;
export type TimeUnit = "month" | "week" | "day" | "hour" | "minute";
export const TIME_UNITS: TimeUnit[] = ["month", "week", "day", "hour", "minute"];

// Working days per gate (~9-month program across G1–G7; the R-CORE demo shape).
export const GATE_WORKDAYS: Record<Gate, number> = { G1: 32, G2: 32, G3: 42, G4: 32, G5: 21, G6: 16, G7: 14 };
// Workdays expressed in a unit (21 workdays/mo · 5/wk · 8h/day · 480min/day).
export function workdaysInUnit(workdays: number, unit: TimeUnit): number {
  switch (unit) {
    case "month": return workdays / WORKDAYS_PER_MONTH;
    case "week": return workdays / 5;
    case "day": return workdays;
    case "hour": return workdays * WORKDAY_HOURS;
    case "minute": return workdays * WORKDAY_HOURS * 60;
  }
}
export const UNIT_LABEL: Record<TimeUnit, string> = { month: "mo", week: "wk", day: "d", hour: "h", minute: "min" };

// Tolerance band by gate — ±50% at Concept tightening to ±5% at Launch (AMTS ladder), WIDENED
// by the project's commercial + technical risk profile (CRS-86). Higher risk → wider band.
const BASE_BAND: Record<Gate, number> = { G1: 0.5, G2: 0.4, G3: 0.3, G4: 0.2, G5: 0.1, G6: 0.05, G7: 0.05 };
export function toleranceBand(p: Project): number {
  const riskMult = 1 + (riskNum(p.tech) + riskNum(p.comm)) / 2; // Low→1.1 … High→1.7
  return Math.min(0.6, BASE_BAND[p.gate] * riskMult);
}

// Full plan from a start date: per-gate calendar boundaries + derived first-revenue date.
export function scheduleFromStart(p: Project, startISO: string) {
  const start = new Date(startISO + "T00:00:00");
  const cal = (wd: number) => Math.round(wd * 7 / 5); // workdays → calendar days (5-day week)
  const rows: { gate: Gate; startISO: string; endISO: string; workdays: number }[] = [];
  let cursor = new Date(start);
  for (const g of GATES) {
    const wd = GATE_WORKDAYS[g];
    const s = new Date(cursor);
    cursor = new Date(cursor.getTime() + cal(wd) * 86400000);
    rows.push({ gate: g, startISO: iso(s), endISO: iso(cursor), workdays: wd });
  }
  const launch = rows.find((r) => r.gate === "G6")!; // first revenue at Launch (G6) end
  return { rows, firstRevenueISO: launch.endISO, totalWorkdays: GATES.reduce((s, g) => s + GATE_WORKDAYS[g], 0) };
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

// Remaining-to-launch readout at a chosen unit, with ± bands on time · cost · schedule.
export function timeReadout(p: Project, startISO: string, unit: TimeUnit) {
  const sched = scheduleFromStart(p, startISO);
  const gi = GATES.indexOf(p.gate);
  const remWorkdays = GATES.slice(gi).reduce((s, g) => s + GATE_WORKDAYS[g], 0); // current gate → G7
  const burnPerWorkdayUsd = (p.nreK * 1000) / sched.totalWorkdays;
  const costPerMinUsd = burnPerWorkdayUsd / (WORKDAY_HOURS * 60);
  const band = toleranceBand(p);
  const timeVal = workdaysInUnit(remWorkdays, unit);
  const costRemainUsd = burnPerWorkdayUsd * remWorkdays;
  const calDaysRemain = Math.round(remWorkdays * 7 / 5);
  return {
    unit, band,
    firstRevenueISO: sched.firstRevenueISO,
    time: { value: timeVal, lo: timeVal * (1 - band), hi: timeVal * (1 + band) },
    cost: { value: costRemainUsd, lo: costRemainUsd * (1 - band), hi: costRemainUsd * (1 + band) },
    scheduleDays: { value: calDaysRemain, lo: Math.round(calDaysRemain * (1 - band)), hi: Math.round(calDaysRemain * (1 + band)) },
    costPerMinUsd,
    remWorkdays,
    totalWorkdays: sched.totalWorkdays,
  };
}

// ── GROWTH MODEL (CRS-69) — Do-Nothing decline + weighted NPI + remaining-to-target ──────
// The signature Rack-&-Stack chart: a base revenue that declines YoY with no new launches,
// the probability-weighted incremental revenue from funded NPIs ramping in, the gap remaining
// to the growth target, and the target line itself. All derived from the funded portfolio.
export interface GrowthYear { year: number; doNothing: number; weighted: number; remaining: number; target: number }
// Revenue Options (FLIR "Revenue Options" control): which NPI streams count toward the model.
// full = Step 1+2+3 R&S incremental · new = Step 1 only (new product) · eol = Step 3 only
// (existing/phase-out/EOL, if funded) · noStep2 = Step 1+3 without Step 2 (do-nothing).
export type RevMode = "full" | "new" | "eol" | "noStep2";
export const REV_MODE: Record<RevMode, { label: string; mult: number }> = {
  full:    { label: "Step 1+2+3 · R&S incremental", mult: 1 },
  new:     { label: "Step 1 only · New product",     mult: 0.7 },
  eol:     { label: "Step 3 only · Existing/EOL",    mult: 0.25 },
  noStep2: { label: "Step 1+3 · w/o Step 2",         mult: 0.85 },
};
export function growthModel(
  funded: Project[],
  opts: { baseYear?: number; years?: number; decline?: number; growth?: number; revMode?: RevMode } = {},
): GrowthYear[] {
  const baseYear = opts.baseYear ?? 2026, years = opts.years ?? 6;
  const decline = opts.decline ?? 0.15, growth = opts.growth ?? 0.038;
  const revMult = REV_MODE[opts.revMode ?? "full"].mult;
  // Annualize 10-yr figures to a year-0 run rate.
  const annualBase = funded.reduce((s, p) => s + p.doNothing10yM, 0) / 10;
  const annualNpi = funded.reduce((s, p) => s + weightedRevM(p), 0) / 10 * revMult;
  const out: GrowthYear[] = [];
  for (let y = 0; y < years; y++) {
    const doNothing = annualBase * Math.pow(1 - decline, y);
    const ramp = Math.min(1, years <= 2 ? 1 : y / (years - 2)); // NPI ramps in over the horizon
    const weighted = annualNpi * ramp;
    const target = annualBase * Math.pow(1 + growth, y);
    const remaining = Math.max(0, target - doNothing - weighted);
    out.push({ year: baseYear + y, doNothing, weighted, remaining, target });
  }
  return out;
}

// ── PORTFOLIO HIERARCHY — highest-complexity large-business tree (re-nameable) ───────────
// BU → SBU → Product Group → Alpha Group → Product # → Material #. Nomenclature is
// configurable here so any enterprise can re-label the six tiers without touching logic.
export const HIER_LEVELS = [
  { key: "bu",       label: "BU",            full: "Business Unit" },
  { key: "sbu",      label: "SBU",           full: "Strategic Business Unit" },
  { key: "pgroup",   label: "Product Group", full: "Product Group" },
  { key: "alpha",    label: "Alpha Group",   full: "Alpha Group" },
  { key: "product",  label: "Product #",     full: "Product" },
  { key: "material", label: "Material #",    full: "Material" },
] as const;
export type HierKey = typeof HIER_LEVELS[number]["key"];
export interface HierPath { bu: string; sbu: string; pgroup: string; alpha: string; product: string; material: string }

// Per-project node path (kept as a side map so project literals stay lean; falls back to
// existing fields for any project not explicitly mapped).
export const PROJECT_HIER: Record<string, HierPath> = {
  "PRJ-01": { bu: "Defense & ISR", sbu: "Airborne ISR", pgroup: "Thermal Sensors", alpha: "Cooled Cores", product: "TC-G5", material: "TC-G5-FPA" },
  "PRJ-02": { bu: "Autonomy", sbu: "Perception", pgroup: "Edge Compute", alpha: "Fusion Modules", product: "EF-AI", material: "EF-AI-SOM" },
  "PRJ-03": { bu: "Defense & ISR", sbu: "Maritime", pgroup: "Radar", alpha: "Littoral", product: "ML-RDR", material: "ML-RDR-TRX" },
  "PRJ-04": { bu: "Defense & ISR", sbu: "Effects", pgroup: "C-UAS", alpha: "Effectors", product: "CUAS-EF", material: "CUAS-EF-WHD" },
  "PRJ-05": { bu: "Software & SaaS", sbu: "Platform", pgroup: "Governance", alpha: "Cloud", product: "SOI-GOV", material: "SOI-GOV-SVC" },
  "PRJ-06": { bu: "Commercial", sbu: "Handheld", pgroup: "Multispectral", alpha: "Portable", product: "HH-MS", material: "HH-MS-SENS" },
  "PRJ-07": { bu: "Space", sbu: "Payloads", pgroup: "Optics", alpha: "Telescopes", product: "SP-OPT", material: "SP-OPT-MIR" },
  "PRJ-08": { bu: "Software & SaaS", sbu: "Ground Systems", pgroup: "Stations", alpha: "Modernization", product: "GS-MOD", material: "GS-MOD-SW" },
  "PRJ-09": { bu: "Components", sbu: "Coolers", pgroup: "Cryo", alpha: "NextGen", product: "CC-NG", material: "CC-NG-STIRL" },
  "PRJ-10": { bu: "Software & SaaS", sbu: "Developer", pgroup: "SDK", alpha: "Marketplace", product: "AUT-SDK", material: "AUT-SDK-PKG" },
  "PRJ-11": { bu: "Commercial", sbu: "Handheld", pgroup: "Legacy", alpha: "EOL", product: "LEG-BR", material: "LEG-BR-KIT" },
  "PRJ-12": { bu: "Software & SaaS", sbu: "Comms", pgroup: "Secure Comms", alpha: "Quantum", product: "QS-COM", material: "QS-COM-QKD" },
};
export const hierOf = (p: Project): HierPath =>
  PROJECT_HIER[p.id] ?? { bu: p.lob, sbu: p.division, pgroup: p.category, alpha: "—", product: p.id, material: `${p.id}-M01` };
// Distinct values present at a level, respecting an optional parent filter (cascading).
export function hierValues(projects: Project[], level: HierKey, parent?: { level: HierKey; value: string }): string[] {
  const scoped = parent ? projects.filter((p) => hierOf(p)[parent.level] === parent.value) : projects;
  return Array.from(new Set(scoped.map((p) => hierOf(p)[level]))).sort();
}
export const filterByHier = (projects: Project[], level: HierKey, value: string): Project[] =>
  value === "All" ? projects : projects.filter((p) => hierOf(p)[level] === value);

// ── CROWD-SOURCED RISK REGISTER + POLLING (the 2525 differentiator) ──────────────────────
// Anyone documents a risk; the community polls it (votes = concurrence); de-risk ladder
// collapses exposure. Deterministic scores feed the same probability-weighting as NPV.
export type RiskCategory = "technical" | "commercial" | "schedule" | "supply" | "regulatory" | "other";
export type RiskStatus = "open" | "mitigating" | "mitigated" | "accepted";
export const RISK_STATUS_MULT: Record<RiskStatus, number> = { open: 1, mitigating: 0.5, mitigated: 0.1, accepted: 0.75 };
export const RISK_STATUS_LABEL: Record<RiskStatus, string> = { open: "Open", mitigating: "Mitigating", mitigated: "Mitigated", accepted: "Accepted" };
export interface Risk {
  id: string;
  projectId: string;      // anchor project
  scopeKey: HierKey;      // hierarchy level it was raised at
  title: string;
  category: RiskCategory;
  severity: 1 | 2 | 3 | 4 | 5;   // impact
  likelihood: 1 | 2 | 3 | 4 | 5; // probability
  author: string;         // "anyone" — may be a name or "anonymous"
  votes: number;          // eXeL polling concurrence
  status: RiskStatus;
  mitigation?: string;
}
export const riskScore = (r: Risk) => r.severity * r.likelihood;                 // 1..25
export const riskExposure = (r: Risk) => riskScore(r) * RISK_STATUS_MULT[r.status];
// Polling-weighted priority: exposure lifted by community concurrence (diminishing, capped ×3).
export const riskPriority = (r: Risk) => riskExposure(r) * (1 + Math.min(2, r.votes / 10));
export const riskBand = (r: Risk): "low" | "med" | "high" | "critical" => {
  const s = riskScore(r);
  return s >= 20 ? "critical" : s >= 12 ? "high" : s >= 6 ? "med" : "low";
};
// Per-project rollup: open-exposure sum + a 0..1 de-risk factor (how much has been retired).
export function riskRollup(risks: Risk[], projectId: string) {
  const rs = risks.filter((r) => r.projectId === projectId);
  const rawExposure = rs.reduce((s, r) => s + riskScore(r), 0);
  const liveExposure = rs.reduce((s, r) => s + riskExposure(r), 0);
  const retired = rawExposure ? 1 - liveExposure / rawExposure : 0; // fraction of exposure de-risked
  return { count: rs.length, rawExposure, liveExposure, retired, open: rs.filter((r) => r.status === "open").length };
}

export const DEMO_RISKS: Risk[] = [
  { id: "RSK-01", projectId: "PRJ-01", scopeKey: "product", title: "FPA yield below spec at Gen-5 node", category: "technical", severity: 4, likelihood: 3, author: "A. Seguin", votes: 14, status: "mitigating", mitigation: "Dual-source wafer lot + parametric screen" },
  { id: "RSK-02", projectId: "PRJ-01", scopeKey: "material", title: "Cooled-core supply lead time > 26 wks", category: "supply", severity: 3, likelihood: 4, author: "anonymous", votes: 9, status: "open" },
  { id: "RSK-03", projectId: "PRJ-02", scopeKey: "product", title: "Edge SOM export-control reclassification", category: "regulatory", severity: 5, likelihood: 2, author: "R. Kaur", votes: 11, status: "open" },
  { id: "RSK-04", projectId: "PRJ-04", scopeKey: "product", title: "Effector RF interference in urban clutter", category: "technical", severity: 4, likelihood: 4, author: "T. Cho", votes: 18, status: "open" },
  { id: "RSK-05", projectId: "PRJ-04", scopeKey: "sbu", title: "Counter-UAS procurement budget slip FY", category: "commercial", severity: 4, likelihood: 3, author: "anonymous", votes: 7, status: "mitigating", mitigation: "Bridge funding via allied FMS" },
  { id: "RSK-06", projectId: "PRJ-07", scopeKey: "product", title: "Optics mirror figure error under thermal load", category: "technical", severity: 5, likelihood: 3, author: "V. Rossi", votes: 21, status: "open" },
  { id: "RSK-07", projectId: "PRJ-07", scopeKey: "product", title: "Launch window dependency on partner vehicle", category: "schedule", severity: 4, likelihood: 4, author: "anonymous", votes: 13, status: "mitigating", mitigation: "Secondary rideshare manifest slot" },
  { id: "RSK-08", projectId: "PRJ-05", scopeKey: "product", title: "Multi-tenant data isolation audit gap", category: "regulatory", severity: 3, likelihood: 2, author: "L. Okafor", votes: 5, status: "mitigated", mitigation: "RLS + SOC2 controls verified" },
  { id: "RSK-09", projectId: "PRJ-09", scopeKey: "material", title: "Stirling cryocooler helium seal wear", category: "technical", severity: 3, likelihood: 3, author: "D. Park", votes: 6, status: "open" },
  { id: "RSK-10", projectId: "PRJ-12", scopeKey: "product", title: "QKD hardware TRL immature for schedule", category: "technical", severity: 5, likelihood: 4, author: "anonymous", votes: 24, status: "open" },
  { id: "RSK-11", projectId: "PRJ-12", scopeKey: "sbu", title: "Standards body not finalized (interop risk)", category: "regulatory", severity: 3, likelihood: 4, author: "T. Cho", votes: 10, status: "open" },
  { id: "RSK-12", projectId: "PRJ-10", scopeKey: "product", title: "Marketplace take-rate below model", category: "commercial", severity: 3, likelihood: 3, author: "anonymous", votes: 4, status: "accepted" },
];

// ── STACK: rank order → cumulative NRE → funding line (CRS-42/43/71) ─────────────────────
export function stackWithBudget(order: Project[], availableK_: number) {
  let cum = 0, lineIndex = order.length;
  const rows = order.map((p, i) => {
    cum += p.nreK;
    const funded = cum <= availableK_;
    if (!funded && lineIndex === order.length) lineIndex = i; // first project below the line
    return { p, cumK: cum, funded, remainingK: availableK_ - cum };
  });
  return { rows, lineIndex };
}
