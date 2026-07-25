// Project Innovation — Vision • 2525 (CRS-36 → CRS-93).
// RACK (registry) + STACK (prioritization above/below the funding line) + the Series-9
// differentiators (3×3×3 gate cube, risk-prediction market, Project Upside pool, $/min cost
// of elapsed time, AI·SI·HI intelligence load). Pure data + calculators — no I/O, deterministic.

export type Gate = "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7";
export const GATES: Gate[] = ["G1", "G2", "G3", "G4", "G5", "G6", "G7"];
// Stage tolerance bands (CRS-86): ±% by phase, tightening gate over gate.
export const GATE_BAND: Record<Gate, number> = { G1: 0.6, G2: 0.6, G3: 0.4, G4: 0.2, G5: 0.1, G6: 0.05, G7: 0.05 };
// Development stages per the AMTS "Product Portfolio Review — Overview By Stage" (gate at each stage end).
export const GATE_STAGE: Record<Gate, string> = {
  G1: "Concept", G2: "Plan", G3: "Develop", G4: "Qualify", G5: "Launch", G6: "Maximize", G7: "Retire / EOL",
};
// Minimum deliverables required at each gate to de-risk development (AMTS S1–S18 matrix):
// slide # · description · summary, plus the Must-Have / Recommended preparation & alignment docs.
// Financial — Return (S3) is the 3rd-most-important slide (priority: 3).
export interface GateDeliverable { slide: string; name: string; summary: string; priority?: number }
export interface GateReview { deliverables: GateDeliverable[]; mustHave: string[]; recommended: string[] }
export const GATE_REVIEW: Record<Gate, GateReview> = {
  G1: {
    deliverables: [
      { slide: "S1–S2", name: "Executive Summary", summary: "2-slide overview" },
      { slide: "S3", name: "Financial — Return", summary: "Profile: NPV + IRR", priority: 3 },
      { slide: "S4", name: "Customer CONOPS — Applications", summary: "Mission Needs" },
      { slide: "S5", name: "Customer Problem", summary: "Statement — Outcomes" },
      { slide: "S6", name: "Product Summary", summary: "Customer Segment 1" },
    ],
    mustHave: ["Market Needs Documentation", "Business Case Documentation", "Alignment meeting: S1–S6"],
    recommended: [],
  },
  G2: {
    deliverables: [
      { slide: "S7", name: "Customer Workflow", summary: "By Persona" },
      { slide: "S8", name: "Competition + Value", summary: "Value Prop v NBA" },
      { slide: "S9", name: "User Stories — Highlights", summary: "By Persona" },
      { slide: "S10", name: "Financials by Year", summary: "Cost + Revenues", priority: 3 },
      { slide: "S11", name: "Prelim Feedback", summary: "Validation + Plans" },
    ],
    mustHave: ["Product Description Documentation", "Alignment meeting: S6–S11"],
    recommended: [],
  },
  G3: {
    deliverables: [
      { slide: "S12", name: "Go-To-Market", summary: "Strategy Alignment" },
      { slide: "S13", name: "Risk Highlights", summary: "Tech + Commercial" },
    ],
    mustHave: ["Roadmap Documentation", "Alignment meeting: S12–S13"],
    recommended: ["Manufacturing Strategy Documentation", "Supply Chain Risk Assessment"],
  },
  G4: {
    deliverables: [
      { slide: "S14", name: "Resourcing", summary: "Functional Alignment" },
      { slide: "S15", name: "BETA Feedback", summary: "Pre-Launch VOCs" },
    ],
    mustHave: ["Marketing Strategy Documentation"],
    recommended: [],
  },
  G5: {
    deliverables: [{ slide: "S16", name: "Market Performance", summary: "Say / Do Metrics" }],
    mustHave: [],
    recommended: ["Performance Tracking w/ Finance + BD", "Performance Tracking w/ Mfg/Ops"],
  },
  G6: {
    deliverables: [{ slide: "S17", name: "Post-Launch Dev", summary: "VOC + Priorities" }],
    mustHave: [],
    recommended: ["Performance Tracking w/ Finance + BD", "Performance Tracking w/ Mfg/Ops"],
  },
  G7: {
    deliverables: [{ slide: "S18", name: "End-of-Life Strategy", summary: "Org Alignment" }],
    mustHave: [],
    recommended: ["Performance Tracking w/ Finance + BD"],
  },
};
// Back-compat: flat name list per gate (derived from the review matrix).
export const GATE_DELIVERABLES: Record<Gate, string[]> = Object.fromEntries(
  GATES.map((g) => [g, GATE_REVIEW[g].deliverables.map((d) => d.name)]),
) as Record<Gate, string[]>;

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

// Project brief — AMTS One-Page-Summary structure (Needs · Outcomes · Solution · Evidence).
// Concise, drone/ISR/autonomy-themed per Intelligent Adaptation · Operational Synergy ·
// Precision Execution. Falls back to a name-derived stub for any unmapped project.
export interface ProjectBrief { needs: string[]; outcomes: string[]; solution: string[]; evidence: string[] }
export const PROJECT_BRIEF: Record<string, ProjectBrief> = {
  "PRJ-01": { needs: ["All-weather ISR in GPS-denied theaters", "SWaP-constrained SAR for Group-3 UAS"], outcomes: ["Day/night, cloud-penetrating imagery at range", "Cross-cue to strike in seconds"], solution: ["Gen-5 focal plane + on-board AI SAR former", "Multi-sensor fusion to the common picture"], evidence: ["Bench SAR yields sub-0.3 m resolution", "Cross-cue cut sensor-to-decision to seconds"] },
  "PRJ-02": { needs: ["Autonomous multi-UAS coordination under jamming", "Reduce operator load in high-tempo fights"], outcomes: ["Self-synchronizing swarm; role re-assign on loss", "Decentralized execution within commander intent"], solution: ["Edge fusion + ML tasking on each node", "Gesture/voice tasking via XR"], evidence: ["Sim: swarm holds cohesion after 30% attrition", "Teaming trials reduced operator workload"] },
  "PRJ-03": { needs: ["Littoral small-target detection in clutter", "Persistent maritime domain awareness"], outcomes: ["Track low-RCS threats over sea state", "Wide-area surveillance on one platform"], solution: ["Littoral radar + adaptive risk assessment", "Sensor-grid fusion to the TOC"], evidence: ["Sea trials detect pickup-height flyers", "Refresh sweeps hold persistent track"] },
  "PRJ-04": { needs: ["Affordable defeat of cheap drone swarms", "Protect fuel/ammo/C2 from saturation"], outcomes: ["Layered kill: guns for cheap, effector for consequence", "Positive-ID before engage"], solution: ["Loitering effector + MIL-STD-2525 hostile ID", "Sector priority by threat to mission"], evidence: ["Range tests defeat saturation runs", "Exchange-ratio math favors the defender"] },
  "PRJ-05": { needs: ["Unified multi-domain operating picture", "Synchronize manned + unmanned assets"], outcomes: ["One picture, one engagement authority", "Rapid re-task across air/land/sea"], solution: ["IBCS-style fusion + JADC2 links", "VR/XR overlays for commanders"], evidence: ["Link tests fuse Link-16 + voice + radar", "Decision cycles shortened in exercise"] },
  "PRJ-06": { needs: ["Dismounted multispectral target ID", "Lightweight, field-rugged optics"], outcomes: ["Faster threat recognition at the edge", "Cross-cue to higher echelon"], solution: ["Portable multispectral + AI hints", "Feeds the common operating picture"], evidence: ["Field eval improves ID timelines", "Rugged to MIL environmentals"] },
  "PRJ-07": { needs: ["Global, revisit-dense SAR coverage", "Deny adversary weather/night sanctuary"], outcomes: ["Persistent overhead SAR revisit", "Tip-and-cue to tactical sensors"], solution: ["Payload optics + on-orbit SAR forming", "Downlink to ground fusion"], evidence: ["Optics figure holds under thermal load (mitigating)", "Rideshare manifest secured"] },
  "PRJ-08": { needs: ["Modern C2 for mixed UAS fleets", "Reduce sustainment + training burden"], outcomes: ["One GCS across platforms", "Lower operator cognitive load"], solution: ["Modernized software + XR interface", "Open architecture"], evidence: ["Migration validated on baseline HAL", "Sustaining program, low risk"] },
  "PRJ-09": { needs: ["Stabilized long-range EO/IR for Group 2-3", "Detection in degraded visual environments"], outcomes: ["Longer standoff, sharper track", "Cross-sensor cue"], solution: ["Next-gen gimbal + cooled core", "AI-assisted detection"], evidence: ["Bench range exceeds legacy", "Seal-wear risk under mitigation"] },
  "PRJ-10": { needs: ["Third-party autonomy without vendor lock", "Faster capability onboarding"], outcomes: ["Ecosystem of vetted behaviors", "Recurring platform revenue"], solution: ["Typed SDK + behavior marketplace", "Certification + anti-tamper"], evidence: ["Dev-preview adoption", "Take-rate model (accepted risk)"] },
  "PRJ-11": { needs: ["Sustain fielded sensors to EOL", "Bridge to next-gen without a gap"], outcomes: ["Continuity of ISR during transition", "Controlled phase-out"], solution: ["EOL bridge kit + spares plan", "Migration path to Gen-5"], evidence: ["Bridge validated on fielded units", "Low technical risk"] },
  "PRJ-12": { needs: ["Assured comms/PNT under jamming", "Interoperable secure datalink"], outcomes: ["Hold link in contested EMS", "PNT continuity without GPS"], solution: ["Resilient waveform + QKD option", "Standards-aligned interop"], evidence: ["EW-chamber holds link (high risk, early)", "Standards body pending"] },
  "PRJ-13": { needs: ["Rehearse on current mission data", "Compress prep timelines"], outcomes: ["Operational twins from live ISR", "Faster skill mastery"], solution: ["VR/XR twins + AI scenario generation", "Post-mission review loop"], evidence: ["Immersive rehearsal improves readiness", "Reuses live UAS/UGS feeds"] },
  "PRJ-14": { needs: ["Fuse human judgment + machine speed", "Team crewed + uncrewed across domains"], outcomes: ["One synchronized rhythm", "High-risk roles to unmanned"], solution: ["MUM-T links + AI decision support", "XR common picture"], evidence: ["Teaming trials increase flexibility", "High tech risk, early gate"] },
  "PRJ-15": { needs: ["Scale space ISR beyond launch-mass limits", "Sustain the constellation in-situ"], outcomes: ["Self-replicating nodes from space resources", "Persistent, growing sensor mesh"], solution: ["Autonomous fabrication + swarm control", "Ethical / space-debris guardrails"], evidence: ["Concept sims validate self-replication", "Moonshot — high/high risk, G1"] },
};
export const briefOf = (p: Project): ProjectBrief =>
  PROJECT_BRIEF[p.id] ?? { needs: [`${p.name} capability gap`], outcomes: [`Field ${p.name}`], solution: [`Develop ${p.name} to ${p.category}`], evidence: [`${GATE_STAGE[p.gate]} stage · confidence ${p.confidence}/4`] };

// AMTS Product-Management-Summary exec fields (Functional Leads · COGS/MSRP/Margin ·
// Customer/Program-of-Record · Franchise Pursuits · Intra-BU dependencies). Derived
// deterministically from the project so the one-pager is complete without a giant literal.
const ENG_POOL = ["K. Ito", "N. Costa", "J. Meyer", "D. Singh", "P. Roux", "E. Vance"];
const BD_POOL = ["G. Marsh", "L. Fournier", "R. Adler", "M. Boone", "S. Aziz", "C. Webb"];
const idNum = (id: string) => parseInt(id.replace(/\D/g, ""), 10) || 0;
export function customerOf(p: Project): string {
  const d = `${p.division} ${p.name}`.toLowerCase();
  if (/space|radar|sar/.test(d)) return "DoD / USSF";
  if (/autonomy|teaming|mum-t/.test(d)) return "DoD / DIU";
  if (/effect|c-uas|counter/.test(d)) return "US Army RCCTO";
  if (/handheld|sensor/.test(d)) return "USMC + Allied FMS";
  if (/software|developer|comms|training|autonomy sw/.test(d)) return "DoD / JADC2";
  return "DoD / Program of Record";
}
export interface ProjectExec {
  productMgr: string; projectEng: string; bdLead: string;
  cogsK: number; msrpK: number; marginPct: number;
  customer: string;
  pursuits: { name: string; award: string; valueM: number }[];
  intraDeps: string[];
}
export function execOf(p: Project): ProjectExec {
  const n = idNum(p.id);
  const marginPct = Math.round((0.72 - riskNum(p.tech) * 0.15 - riskNum(p.comm) * 0.1) * 100);
  const msrpK = Math.round(50 + p.fullRev10yM * 0.4);
  const cogsK = Math.round(msrpK * (1 - marginPct / 100));
  return {
    productMgr: p.manager,
    projectEng: ENG_POOL[n % ENG_POOL.length],
    bdLead: BD_POOL[n % BD_POOL.length],
    cogsK, msrpK, marginPct,
    customer: customerOf(p),
    pursuits: [
      { name: `${p.division} PoR`, award: p.firstRevenue, valueM: Math.round(p.fullRev10yM * 0.3) },
      { name: "Allied FMS", award: "TBD", valueM: Math.round(p.fullRev10yM * 0.15) },
    ],
    intraDeps: p.criticalPath ? ["Shared autonomy stack", "Common GCS"] : ["Common test harness"],
  };
}

// Per-project financial projection (operator methodology): for an aging portfolio we ALWAYS
// model the old product line WITHOUT innovation — a declining curve (Do-Nothing / Step 2) —
// so we can see what goes away. When a next-gen project is funded we overlay the NEW product
// revenue ramp (Step 1) on top of that decline. Net = the story of decline replaced by growth.
export interface RevYear { year: number; oldDecline: number; newRamp: number; total: number }
export function projectRevSeries(p: Project, opts: { baseYear?: number; years?: number; decline?: number; funded?: boolean } = {}): RevYear[] {
  const years = opts.years ?? 10, d = opts.decline ?? 0.15, baseYear = opts.baseYear ?? 2026;
  const funded = opts.funded ?? true;
  // Old line: declining geometric series whose 10-yr sum ≈ doNothing10yM (what erodes with no innovation).
  const denom = d > 0 ? (1 - Math.pow(1 - d, years)) / d : years;
  const oldStart = denom > 0 ? p.doNothing10yM / denom : 0;
  // New product: ramps in over ~3 yrs to a plateau; series sum ≈ fullRev10yM (only if funded/launched).
  const rampYears = Math.min(3, years);
  const w: number[] = [];
  for (let y = 0; y < years; y++) w.push(Math.min(1, (y + 1) / (rampYears + 1)));
  const wSum = w.reduce((a, b) => a + b, 0) || 1;
  const newUnit = funded ? p.fullRev10yM / wSum : 0;
  const out: RevYear[] = [];
  for (let y = 0; y < years; y++) {
    const oldDecline = oldStart * Math.pow(1 - d, y);
    const newRamp = newUnit * w[y];
    out.push({ year: baseYear + y, oldDecline, newRamp, total: oldDecline + newRamp });
  }
  return out;
}

// Say/Do ratio — did we deliver what we said (>1 = beat the plan). Demo model from
// confidence, risk profile, and critical-path; at Launch this binds to real actuals in the
// business systems (schedule/cost/scope) so the tool tracks Say/Do end-to-end.
export function sayDo(p: Project) {
  const conf = (p.confidence - 2.5) * 0.06;
  const riskDrag = ((riskNum(p.tech) + riskNum(p.comm)) / 2) * 0.25;
  const cp = p.criticalPath ? 0.03 : 0;
  const clamp = (v: number) => +Math.max(0.6, Math.min(1.4, v)).toFixed(2);
  return {
    schedule: clamp(1 + conf - riskDrag + cp), // planned duration ÷ actual
    budget: clamp(1 + conf - riskDrag * 0.8),  // planned $ ÷ actual
    time: clamp(1 + conf - riskDrag - 0.02),   // planned active-time ÷ actual
  };
}

export interface DivisionBudget { division: string; totalK: number; allocatedK: number; }
export const availableK = (b: DivisionBudget) => b.totalK - b.allocatedK; // CRS-70

// ── Demo portfolio (seed; a real deploy loads from the platform event log) ───────────────
export const DEMO_BUDGET: DivisionBudget = { division: "ALL DIVISIONS", totalK: 42000, allocatedK: 6000 };

export const DEMO_PROJECTS: Project[] = [
  { id: "PRJ-01", name: "SAR Imaging Payload Gen-5", division: "ISR Payloads", lob: "SBU-1", manager: "A. Seguin", category: "New Platform", gate: "G4", confidence: 4, tech: "low", comm: "low", nreK: 8200, fullRev10yM: 210, doNothing10yM: 60, firstRevenue: "2026-Q4", criticalPath: true, humanLoad: 0.62, ai: 0.4, si: 0.3, hi: 0.3, predictions: 41 },
  { id: "PRJ-02", name: "Hivemind Swarm Fusion AI", division: "Autonomy", lob: "SBU-1", manager: "R. Kaur", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 5400, fullRev10yM: 155, doNothing10yM: 30, firstRevenue: "2027-Q1", criticalPath: true, humanLoad: 0.74, ai: 0.55, si: 0.25, hi: 0.2, predictions: 33 },
  { id: "PRJ-03", name: "Maritime ISR Drone Radar", division: "Maritime ISR", lob: "SBU-1", manager: "M. Devlin", category: "Sustaining+", gate: "G5", confidence: 4, tech: "low", comm: "low", nreK: 6100, fullRev10yM: 140, doNothing10yM: 55, firstRevenue: "2026-Q3", criticalPath: false, humanLoad: 0.48, ai: 0.3, si: 0.35, hi: 0.35, predictions: 22 },
  { id: "PRJ-04", name: "Counter-UAS Loitering Effector", division: "Effects", lob: "SBU-1", manager: "T. Cho", category: "New Platform", gate: "G2", confidence: 2, tech: "med", comm: "med", nreK: 9300, fullRev10yM: 260, doNothing10yM: 20, firstRevenue: "2028-Q2", criticalPath: true, humanLoad: 0.81, ai: 0.35, si: 0.3, hi: 0.35, predictions: 57 },
  { id: "PRJ-05", name: "Swarm Command & Control Cloud", division: "Autonomy SW", lob: "SBU-2", manager: "L. Okafor", category: "New Product", gate: "G4", confidence: 3, tech: "med", comm: "low", nreK: 4200, fullRev10yM: 180, doNothing10yM: 25, firstRevenue: "2026-Q4", criticalPath: false, humanLoad: 0.55, ai: 0.6, si: 0.25, hi: 0.15, predictions: 29 },
  { id: "PRJ-06", name: "Handheld Multispectral ISR Sensor", division: "Handheld", lob: "SBU-2", manager: "P. Nilsson", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "med", nreK: 3600, fullRev10yM: 95, doNothing10yM: 40, firstRevenue: "2027-Q2", criticalPath: false, humanLoad: 0.44, ai: 0.3, si: 0.3, hi: 0.4, predictions: 18 },
  { id: "PRJ-07", name: "Space-Based SAR Constellation", division: "Space ISR", lob: "SBU-3", manager: "V. Rossi", category: "New Platform", gate: "G2", confidence: 2, tech: "high", comm: "med", nreK: 12500, fullRev10yM: 340, doNothing10yM: 10, firstRevenue: "2029-Q1", criticalPath: true, humanLoad: 0.7, ai: 0.45, si: 0.3, hi: 0.25, predictions: 63 },
  { id: "PRJ-08", name: "Ground Control Station Modernization", division: "Ground Systems", lob: "SBU-2", manager: "S. Haddad", category: "Sustaining", gate: "G6", confidence: 4, tech: "low", comm: "low", nreK: 2100, fullRev10yM: 70, doNothing10yM: 45, firstRevenue: "2026-Q2", criticalPath: false, humanLoad: 0.38, ai: 0.25, si: 0.4, hi: 0.35, predictions: 11 },
  { id: "PRJ-09", name: "EO/IR Gimbal Sensor Next-Gen", division: "Sensors", lob: "SBU-3", manager: "D. Park", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 4800, fullRev10yM: 120, doNothing10yM: 38, firstRevenue: "2027-Q3", criticalPath: true, humanLoad: 0.6, ai: 0.3, si: 0.35, hi: 0.35, predictions: 26 },
  { id: "PRJ-10", name: "Autonomy SDK & Swarm Marketplace", division: "Developer", lob: "SBU-2", manager: "R. Kaur", category: "New Product", gate: "G2", confidence: 2, tech: "med", comm: "med", nreK: 3900, fullRev10yM: 130, doNothing10yM: 15, firstRevenue: "2028-Q1", criticalPath: false, humanLoad: 0.5, ai: 0.65, si: 0.2, hi: 0.15, predictions: 34 },
  { id: "PRJ-11", name: "Legacy ISR Sensor EOL Bridge", division: "Sensors", lob: "SBU-3", manager: "M. Devlin", category: "Phase-out", gate: "G5", confidence: 4, tech: "low", comm: "low", nreK: 1400, fullRev10yM: 40, doNothing10yM: 35, firstRevenue: "2026-Q1", criticalPath: false, humanLoad: 0.3, ai: 0.2, si: 0.4, hi: 0.4, predictions: 8 },
  { id: "PRJ-12", name: "Resilient PNT-Denied Datalink", division: "Comms", lob: "SBU-3", manager: "T. Cho", category: "New Platform", gate: "G1", confidence: 1, tech: "high", comm: "med", nreK: 7600, fullRev10yM: 300, doNothing10yM: 5, firstRevenue: "2030-Q1", criticalPath: true, humanLoad: 0.68, ai: 0.5, si: 0.3, hi: 0.2, predictions: 72 },
  // Forward-looking flexibility (AI/ML · VR/XR · MUM-T · autonomous space) — Intelligent
  // Adaptation · Operational Synergy · Precision Execution.
  { id: "PRJ-13", name: "Immersive VR/XR Mission Rehearsal", division: "Training AI", lob: "SBU-2", manager: "S. Haddad", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 3200, fullRev10yM: 110, doNothing10yM: 12, firstRevenue: "2027-Q2", criticalPath: false, humanLoad: 0.5, ai: 0.5, si: 0.3, hi: 0.2, predictions: 19 },
  { id: "PRJ-14", name: "Manned-Unmanned Teaming (MUM-T) Suite", division: "Autonomy", lob: "SBU-1", manager: "R. Kaur", category: "New Platform", gate: "G2", confidence: 2, tech: "high", comm: "med", nreK: 8800, fullRev10yM: 290, doNothing10yM: 8, firstRevenue: "2028-Q3", criticalPath: true, humanLoad: 0.72, ai: 0.5, si: 0.3, hi: 0.2, predictions: 48 },
  { id: "PRJ-15", name: "Orbital Self-Replicating Sensor Swarm", division: "Space ISR", lob: "SBU-3", manager: "V. Rossi", category: "New Platform", gate: "G1", confidence: 1, tech: "high", comm: "high", nreK: 14000, fullRev10yM: 520, doNothing10yM: 0, firstRevenue: "2031-Q1", criticalPath: false, humanLoad: 0.66, ai: 0.6, si: 0.25, hi: 0.15, predictions: 88 },
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
  opts: { baseYear?: number; years?: number; decline?: number; growth?: number; revMode?: RevMode; baseOverrideM?: number } = {},
): GrowthYear[] {
  const baseYear = opts.baseYear ?? 2026, years = opts.years ?? 6;
  const decline = opts.decline ?? 0.15, growth = opts.growth ?? 0.038;
  const revMult = REV_MODE[opts.revMode ?? "full"].mult;
  // Year-0 run rate: enterable LOB/company base revenue ($M) overrides the summed do-nothing.
  const annualBase = opts.baseOverrideM != null ? opts.baseOverrideM : funded.reduce((s, p) => s + p.doNothing10yM, 0) / 10;
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
// Company → BU → SBU → Product Group → Alpha Group → Product # → Material # (BOM).
// `bu` = Business Unit, `sbu` = Strategic Business Unit (carries base revenue), `pgroup` =
// Product Group, `alpha` = Alpha Group, `product` = Product #, `material` = Material # (BOM).
export const HIER_LEVELS = [
  { key: "bu",       label: "BU",            full: "Business Unit" },
  { key: "sbu",      label: "SBU",           full: "Strategic Business Unit" },
  { key: "pgroup",   label: "Product Group", full: "Product Group" },
  { key: "alpha",    label: "Alpha Group",   full: "Alpha Group" },
  { key: "product",  label: "Product #",     full: "Product" },
  { key: "material", label: "Material #",    full: "Material (BOM line)" },
] as const;
export type HierKey = typeof HIER_LEVELS[number]["key"];
export interface HierPath { bu: string; sbu: string; pgroup: string; alpha: string; product: string; material: string }

export const COMPANY_NAME = "Company (All BUs)";
// SBU base revenue ($M) — the do-nothing anchor the operator enters per SBU.
export const SBU_BASE: Record<string, number> = { "SBU-1": 300, "SBU-2": 100, "SBU-3": 300 };
// Each SBU rolls up to a BU (Business Unit).
export const BU_OF_SBU: Record<string, string> = { "SBU-1": "Mission Systems", "SBU-2": "Mission Systems", "SBU-3": "Advanced Programs" };
export const companyBaseM = () => Object.values(SBU_BASE).reduce((s, v) => s + v, 0); // 700
export const sbuBaseM = (sbu: string) => SBU_BASE[sbu] ?? 0;
export const buBaseM = (bu: string) => Object.entries(SBU_BASE).filter(([s]) => BU_OF_SBU[s] === bu).reduce((a, [, v]) => a + v, 0);
// Base for the current Growth-Model scope (Company / BU / SBU).
export const scopeBaseM = (bu: string, sbu: string) =>
  sbu && sbu !== "All" ? sbuBaseM(sbu) : bu && bu !== "All" ? buBaseM(bu) : companyBaseM();
// Back-compat alias (older callers passed the revenue-bearing unit).
export const lobBaseM = (v: string) => (v === "All" || v === COMPANY_NAME ? companyBaseM() : SBU_BASE[v] ?? buBaseM(v));

// Per-project node path — BU → SBU (SBU-1/2/3) → Product Group (PG-1…9) → Alpha → Product → Material.
export const PROJECT_HIER: Record<string, HierPath> = {
  // Product Group = 2-digit code · Alpha Group = 3-digit code · Product # = sold-to-customer · Material # = BOM line.
  "PRJ-01": { bu: "Mission Systems", sbu: "SBU-1", pgroup: "PG-01", alpha: "AG-101", product: "TC-G5", material: "TC-G5-FPA" },
  "PRJ-02": { bu: "Mission Systems", sbu: "SBU-1", pgroup: "PG-02", alpha: "AG-102", product: "EF-AI", material: "EF-AI-SOM" },
  "PRJ-03": { bu: "Mission Systems", sbu: "SBU-1", pgroup: "PG-03", alpha: "AG-103", product: "ML-RDR", material: "ML-RDR-TRX" },
  "PRJ-04": { bu: "Mission Systems", sbu: "SBU-1", pgroup: "PG-01", alpha: "AG-104", product: "CUAS-EF", material: "CUAS-EF-WHD" },
  "PRJ-05": { bu: "Mission Systems", sbu: "SBU-2", pgroup: "PG-04", alpha: "AG-105", product: "SOI-GOV", material: "SOI-GOV-SVC" },
  "PRJ-06": { bu: "Mission Systems", sbu: "SBU-2", pgroup: "PG-05", alpha: "AG-106", product: "HH-MS", material: "HH-MS-SENS" },
  "PRJ-07": { bu: "Advanced Programs", sbu: "SBU-3", pgroup: "PG-07", alpha: "AG-107", product: "SP-OPT", material: "SP-OPT-MIR" },
  "PRJ-08": { bu: "Mission Systems", sbu: "SBU-2", pgroup: "PG-06", alpha: "AG-108", product: "GS-MOD", material: "GS-MOD-SW" },
  "PRJ-09": { bu: "Advanced Programs", sbu: "SBU-3", pgroup: "PG-08", alpha: "AG-109", product: "CC-NG", material: "CC-NG-STIRL" },
  "PRJ-10": { bu: "Mission Systems", sbu: "SBU-2", pgroup: "PG-04", alpha: "AG-110", product: "AUT-SDK", material: "AUT-SDK-PKG" },
  "PRJ-11": { bu: "Advanced Programs", sbu: "SBU-3", pgroup: "PG-09", alpha: "AG-111", product: "LEG-BR", material: "LEG-BR-KIT" },
  "PRJ-12": { bu: "Advanced Programs", sbu: "SBU-3", pgroup: "PG-07", alpha: "AG-112", product: "QS-COM", material: "QS-COM-QKD" },
  "PRJ-13": { bu: "Mission Systems", sbu: "SBU-2", pgroup: "PG-05", alpha: "AG-113", product: "IMX-RH", material: "IMX-RH-HMD" },
  "PRJ-14": { bu: "Mission Systems", sbu: "SBU-1", pgroup: "PG-02", alpha: "AG-114", product: "MUMT-STE", material: "MUMT-STE-LNK" },
  "PRJ-15": { bu: "Advanced Programs", sbu: "SBU-3", pgroup: "PG-08", alpha: "AG-115", product: "ORB-SWM", material: "ORB-SWM-NODE" },
};
export const hierOf = (p: Project): HierPath =>
  PROJECT_HIER[p.id] ?? { bu: BU_OF_SBU[p.lob] ?? p.lob, sbu: p.lob, pgroup: p.category, alpha: "—", product: p.id, material: `${p.id}-M01` };

// Company → BU → SBU → Product Group rollup: base revenue + funded NRE spend + NPV per node.
export interface RollupNode { name: string; baseM: number; spendK: number; npvM: number; count: number }
export interface SbuNode extends RollupNode { groups: RollupNode[] }
export interface BuNode extends RollupNode { sbus: SbuNode[] }
export function companyRollup(projects: Project[]): { company: RollupNode; bus: BuNode[] } {
  const sum = (ps: Project[]) => ({ spendK: ps.reduce((s, p) => s + p.nreK, 0), npvM: ps.reduce((s, p) => s + npvM(p), 0), count: ps.length });
  const buNames = Array.from(new Set(projects.map((p) => hierOf(p).bu))).sort();
  const bus: BuNode[] = buNames.map((bu) => {
    const inBu = projects.filter((p) => hierOf(p).bu === bu);
    const sbuNames = Array.from(new Set(inBu.map((p) => hierOf(p).sbu))).sort();
    const sbus: SbuNode[] = sbuNames.map((sbu) => {
      const inSbu = inBu.filter((p) => hierOf(p).sbu === sbu);
      const pgNames = Array.from(new Set(inSbu.map((p) => hierOf(p).pgroup))).sort();
      const groups = pgNames.map((pg) => {
        const inPg = inSbu.filter((p) => hierOf(p).pgroup === pg);
        return { name: pg, baseM: 0, ...sum(inPg) };
      });
      return { name: sbu, baseM: sbuBaseM(sbu), ...sum(inSbu), groups };
    });
    return { name: bu, baseM: buBaseM(bu), ...sum(inBu), sbus };
  });
  const company: RollupNode = { name: COMPANY_NAME, baseM: companyBaseM(), spendK: bus.reduce((s, b) => s + b.spendK, 0), npvM: bus.reduce((s, b) => s + b.npvM, 0), count: projects.length };
  return { company, bus };
}
// Level-aware Rack & Stack: aggregate the portfolio to a hierarchy level (BU/SBU/Product
// Group/Alpha Group) for high-level decisions + financial rollups. Sorted by NPV desc.
export interface RackRow { key: string; nreK: number; weightedRevM: number; incRevM: number; npvM: number; count: number }
export function rackByLevel(projects: Project[], level: HierKey): RackRow[] {
  const map = new Map<string, RackRow>();
  for (const p of projects) {
    const k = hierOf(p)[level];
    const r = map.get(k) ?? { key: k, nreK: 0, weightedRevM: 0, incRevM: 0, npvM: 0, count: 0 };
    r.nreK += p.nreK; r.weightedRevM += weightedRevM(p); r.incRevM += incrementalRevM(p); r.npvM += npvM(p); r.count += 1;
    map.set(k, r);
  }
  return Array.from(map.values()).sort((a, b) => b.npvM - a.npvM);
}
// The three decision levels the tool is designed for (BU · SBU · Product Group).
export const DECISION_LEVELS: HierKey[] = ["bu", "sbu", "pgroup"];

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

// ── DASHBOARD AGGREGATIONS (Rack & Stack: Top / Division / Cost / ROI / Pipeline) ────────
// All pure + deterministic — derived from the funded/selected project set.
export interface SpendSlice { name: string; spendK: number; count: number; revM: number }
export function spendBy(projects: Project[], pick: (p: Project) => string): SpendSlice[] {
  const map = new Map<string, SpendSlice>();
  for (const p of projects) {
    const name = pick(p);
    const s = map.get(name) ?? { name, spendK: 0, count: 0, revM: 0 };
    s.spendK += p.nreK; s.count += 1; s.revM += incrementalRevM(p);
    map.set(name, s);
  }
  return Array.from(map.values()).sort((a, b) => b.spendK - a.spendK);
}
export const spendByBU = (ps: Project[]) => spendBy(ps, (p) => hierOf(p).bu);
export const spendByCategory = (ps: Project[]) => spendBy(ps, (p) => p.category);

// R&D efficiency = portfolio NPV per $ of NRE (10-yr op contribution intensity).
export const rdEfficiency = (ps: Project[]) => {
  const nreM = ps.reduce((s, p) => s + p.nreK, 0) / 1000;
  return nreM ? ps.reduce((s, p) => s + npvM(p), 0) / nreM : 0;
};

// Cost Dashboard: expense split (Labor / Subcontractor / Material / Other) from total NRE.
export const COST_SPLIT = { labor: 0.55, subcontractor: 0.2, material: 0.15, other: 0.1 } as const;
export function costSplit(projects: Project[]) {
  const totalK = projects.reduce((s, p) => s + p.nreK, 0);
  return { totalK, labor: totalK * COST_SPLIT.labor, subcontractor: totalK * COST_SPLIT.subcontractor, material: totalK * COST_SPLIT.material, other: totalK * COST_SPLIT.other };
}

// ROI Summary: New Product / Do-Nothing / EOL / Incremental / probability-weighted ($M).
export function roiSummary(projects: Project[]) {
  const newProductM = projects.reduce((s, p) => s + p.fullRev10yM, 0);
  const doNothingM = projects.reduce((s, p) => s + p.doNothing10yM, 0);
  const eolM = projects.filter((p) => /phase|eol|legacy|sustain/i.test(p.category)).reduce((s, p) => s + p.doNothing10yM, 0);
  const incrementalM = projects.reduce((s, p) => s + incrementalRevM(p), 0);
  const weightedM = projects.reduce((s, p) => s + weightedRevM(p), 0);
  return { newProductM, doNothingM, eolM, incrementalM, weightedM };
}

// Pipeline by Gate: dev-type color + spend + count per gate (G1..G7).
export type DevType = "sustaining" | "prestudy" | "enhance" | "newmarket";
export const DEV_TYPE: Record<DevType, { label: string; color: string }> = {
  prestudy:  { label: "Pre-study / Research", color: "#fb923c" },  // orange
  enhance:   { label: "Enhance / NextGen",    color: "#38bdf8" },  // blue
  newmarket: { label: "New Mkt / Vertical",   color: "#34d399" },  // green
  sustaining:{ label: "Sustaining",           color: "#a78bfa" },  // purple
};
export const devTypeOf = (p: Project): DevType =>
  /phase|legacy|sustain/i.test(p.category) ? "sustaining"
    : /platform/i.test(p.category) ? "newmarket"
    : p.gate === "G1" ? "prestudy" : "enhance";
export function pipelineByGate(projects: Project[]) {
  return GATES.map((g) => {
    const ps = projects.filter((p) => p.gate === g);
    return { gate: g, stage: GATE_STAGE[g], count: ps.length, spendK: ps.reduce((s, p) => s + p.nreK, 0), projects: ps };
  });
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
