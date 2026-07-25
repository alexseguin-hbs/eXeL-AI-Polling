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

export interface Project {
  id: string;
  name: string;
  division: string;
  manager: string;
  category: string;
  gate: Gate;                 // last completed gate → derives stage (CRS-56, never user-set)
  confidence: 1 | 2 | 3 | 4;  // reviewer-set (CRS-38)
  techRisk: number;           // 0..1 (probability of technical success = 1-techRisk)
  commRisk: number;           // 0..1
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
export const pSuccess = (p: Project) => (1 - p.techRisk) * (1 - p.commRisk); // probability weight (CRS-53)
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
  { id: "PRJ-01", name: "Thermal Core Gen-5 Sensor", division: "ISR", manager: "A. Seguin", category: "New Platform", gate: "G4", confidence: 4, techRisk: 0.2, commRisk: 0.15, nreK: 8200, fullRev10yM: 210, doNothing10yM: 60, firstRevenue: "2026-Q4", criticalPath: true, humanLoad: 0.62, ai: 0.4, si: 0.3, hi: 0.3, predictions: 41 },
  { id: "PRJ-02", name: "Edge Fusion AI Module", division: "Autonomy", manager: "R. Kaur", category: "New Product", gate: "G3", confidence: 3, techRisk: 0.35, commRisk: 0.2, nreK: 5400, fullRev10yM: 155, doNothing10yM: 30, firstRevenue: "2027-Q1", criticalPath: true, humanLoad: 0.74, ai: 0.55, si: 0.25, hi: 0.2, predictions: 33 },
  { id: "PRJ-03", name: "Maritime Littoral Radar", division: "ISR", manager: "M. Devlin", category: "Sustaining+", gate: "G5", confidence: 4, techRisk: 0.15, commRisk: 0.25, nreK: 6100, fullRev10yM: 140, doNothing10yM: 55, firstRevenue: "2026-Q3", criticalPath: false, humanLoad: 0.48, ai: 0.3, si: 0.35, hi: 0.35, predictions: 22 },
  { id: "PRJ-04", name: "Counter-UAS Effector", division: "Effects", manager: "T. Cho", category: "New Platform", gate: "G2", confidence: 2, techRisk: 0.5, commRisk: 0.35, nreK: 9300, fullRev10yM: 260, doNothing10yM: 20, firstRevenue: "2028-Q2", criticalPath: true, humanLoad: 0.81, ai: 0.35, si: 0.3, hi: 0.35, predictions: 57 },
  { id: "PRJ-05", name: "SoI Governance Cloud", division: "Software", manager: "L. Okafor", category: "New Product", gate: "G4", confidence: 3, techRisk: 0.3, commRisk: 0.2, nreK: 4200, fullRev10yM: 180, doNothing10yM: 25, firstRevenue: "2026-Q4", criticalPath: false, humanLoad: 0.55, ai: 0.6, si: 0.25, hi: 0.15, predictions: 29 },
  { id: "PRJ-06", name: "Handheld Multispectral", division: "Handheld", manager: "P. Nilsson", category: "New Product", gate: "G3", confidence: 3, techRisk: 0.28, commRisk: 0.3, nreK: 3600, fullRev10yM: 95, doNothing10yM: 40, firstRevenue: "2027-Q2", criticalPath: false, humanLoad: 0.44, ai: 0.3, si: 0.3, hi: 0.4, predictions: 18 },
  { id: "PRJ-07", name: "Space Payload Optics", division: "Space", manager: "V. Rossi", category: "New Platform", gate: "G2", confidence: 2, techRisk: 0.55, commRisk: 0.3, nreK: 12500, fullRev10yM: 340, doNothing10yM: 10, firstRevenue: "2029-Q1", criticalPath: true, humanLoad: 0.7, ai: 0.45, si: 0.3, hi: 0.25, predictions: 63 },
  { id: "PRJ-08", name: "Ground Station Modernization", division: "Software", manager: "S. Haddad", category: "Sustaining", gate: "G6", confidence: 4, techRisk: 0.1, commRisk: 0.15, nreK: 2100, fullRev10yM: 70, doNothing10yM: 45, firstRevenue: "2026-Q2", criticalPath: false, humanLoad: 0.38, ai: 0.25, si: 0.4, hi: 0.35, predictions: 11 },
  { id: "PRJ-09", name: "Cryo-Cooler Next-Gen", division: "Components", manager: "D. Park", category: "New Product", gate: "G3", confidence: 3, techRisk: 0.32, commRisk: 0.22, nreK: 4800, fullRev10yM: 120, doNothing10yM: 38, firstRevenue: "2027-Q3", criticalPath: true, humanLoad: 0.6, ai: 0.3, si: 0.35, hi: 0.35, predictions: 26 },
  { id: "PRJ-10", name: "Autonomy SDK & Marketplace", division: "Software", manager: "R. Kaur", category: "New Product", gate: "G2", confidence: 2, techRisk: 0.45, commRisk: 0.4, nreK: 3900, fullRev10yM: 130, doNothing10yM: 15, firstRevenue: "2028-Q1", criticalPath: false, humanLoad: 0.5, ai: 0.65, si: 0.2, hi: 0.15, predictions: 34 },
  { id: "PRJ-11", name: "Legacy Sensor EOL Bridge", division: "Handheld", manager: "M. Devlin", category: "Phase-out", gate: "G5", confidence: 4, techRisk: 0.12, commRisk: 0.18, nreK: 1400, fullRev10yM: 40, doNothing10yM: 35, firstRevenue: "2026-Q1", criticalPath: false, humanLoad: 0.3, ai: 0.2, si: 0.4, hi: 0.4, predictions: 8 },
  { id: "PRJ-12", name: "Quantum-Secure Comms", division: "Software", manager: "T. Cho", category: "New Platform", gate: "G1", confidence: 1, techRisk: 0.7, commRisk: 0.5, nreK: 7600, fullRev10yM: 300, doNothing10yM: 5, firstRevenue: "2030-Q1", criticalPath: true, humanLoad: 0.68, ai: 0.5, si: 0.3, hi: 0.2, predictions: 72 },
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
  const riskMult = 1 + (p.techRisk + p.commRisk) / 2; // 1.0 (no risk) → 2.0 (max)
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
export function growthModel(
  funded: Project[],
  opts: { baseYear?: number; years?: number; decline?: number; growth?: number } = {},
): GrowthYear[] {
  const baseYear = opts.baseYear ?? 2026, years = opts.years ?? 6;
  const decline = opts.decline ?? 0.15, growth = opts.growth ?? 0.038;
  // Annualize 10-yr figures to a year-0 run rate.
  const annualBase = funded.reduce((s, p) => s + p.doNothing10yM, 0) / 10;
  const annualNpi = funded.reduce((s, p) => s + weightedRevM(p), 0) / 10;
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
