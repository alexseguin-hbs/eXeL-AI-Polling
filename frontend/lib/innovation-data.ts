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

// Generic gate review comments + countermeasures (AIML / De-Risking NPD gate discipline). These are
// the recurring concerns an Innovation Review Board raises AT each gate and the standard countermeasure
// that clears it — every one marked `solved: true` because the gate cannot be passed until it is
// addressed (a gate that leaves a countermeasure open raises a variance exception, it is not passed).
// Generic (project-agnostic) so they apply to every project; a project's own ledger overlays specifics.
export interface GateCountermeasure { risk: string; countermeasure: string; solved: boolean }
export interface GateNote { comment: string; countermeasures: GateCountermeasure[] }
export const GATE_NOTES: Record<Gate, GateNote> = {
  G1: {
    comment: "Concept gate — the market need and the Next Best Alternative (NBA) must be evidenced, not asserted. Boards routinely bounce concepts that skip the customer problem statement or have no As-Is baseline to beat.",
    countermeasures: [
      { risk: "Market need unvalidated (opinion, not VOC)", countermeasure: "Voice-of-Customer interviews + Market Needs Documentation attached (S4–S5)", solved: true },
      { risk: "No baseline to beat (NBA undefined)", countermeasure: "NBA / As-Is teardown captured; value framed versus the NBA (S6)", solved: true },
      { risk: "Return not modeled", countermeasure: "Financial — Return profile (NPV + IRR) present with named assumptions (S3)", solved: true },
    ],
  },
  G2: {
    comment: "Plan gate — the value proposition must be quantified against the NBA and the financials laid out year-by-year. The common failure is a qualitative value story with no Value Equation and no do-nothing case.",
    countermeasures: [
      { risk: "Value prop not quantified vs the NBA", countermeasure: "Value Equation solved per differentiator vs NBA — competitive index + EVC (S8)", solved: true },
      { risk: "Financials lack annual granularity", countermeasure: "Financials by Year — cost + revenues built and Finance-reconciled (S10)", solved: true },
      { risk: "Demand assumed, not tested", countermeasure: "Preliminary VOC feedback captured with validation plans (S11)", solved: true },
    ],
  },
  G3: {
    comment: "Develop gate — technical and commercial risk must be surfaced with mitigations, and the go-to-market must align to the roadmap. Boards flag projects whose risk register is thin or whose supply chain is unexamined.",
    countermeasures: [
      { risk: "Technical / commercial risk unmitigated", countermeasure: "Risk register with owned mitigations; contingency in the estimate (S13)", solved: true },
      { risk: "No coherent path to market", countermeasure: "Go-To-Market strategy aligned to the roadmap documentation (S12)", solved: true },
      { risk: "Manufacturability / supply chain unproven", countermeasure: "Manufacturing strategy + supply-chain risk assessment attached", solved: true },
    ],
  },
  G4: {
    comment: "Qualify gate — resourcing and pre-launch validation must be locked. The recurring miss is a functional plan without committed resources, or launch with no BETA / pre-launch VOC evidence.",
    countermeasures: [
      { risk: "Resourcing not committed across functions", countermeasure: "Functional-alignment resourcing plan signed by function leads (S14)", solved: true },
      { risk: "Launching without field validation", countermeasure: "BETA feedback + pre-launch VOCs captured and dispositioned (S15)", solved: true },
      { risk: "Qualification incomplete", countermeasure: "Qualification test plan approved; marketing strategy documentation set", solved: true },
    ],
  },
  G5: {
    comment: "Launch gate — say/do metrics must be defined and tracked so performance can be measured against the plan, not just declared launched.",
    countermeasures: [
      { risk: "No measurable launch success criteria", countermeasure: "Market performance — say/do metrics defined and instrumented (S16)", solved: true },
      { risk: "Performance not tracked cross-function", countermeasure: "Performance tracking with Finance + BD and Mfg/Ops stood up", solved: true },
    ],
  },
  G6: {
    comment: "Maximize gate — post-launch development must be VOC-prioritized so the product keeps compounding value rather than drifting.",
    countermeasures: [
      { risk: "Roadmap drifts from customer priorities", countermeasure: "Post-launch development priorities set from VOC (S17)", solved: true },
      { risk: "Value capture not monitored", countermeasure: "Performance tracking with Finance + BD sustained", solved: true },
    ],
  },
  G7: {
    comment: "Retire / EOL gate — the end-of-life must be a planned, org-aligned transition (phase-out ≤ 3 yrs, spares, migration) rather than an abandonment.",
    countermeasures: [
      { risk: "Uncontrolled phase-out / support gap", countermeasure: "End-of-life strategy with org alignment; phase-out ≤ 3 yrs (S18)", solved: true },
      { risk: "Customers stranded at EOL", countermeasure: "Spares plan + migration path to the next-gen product documented", solved: true },
    ],
  },
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
  confidence: 1 | 2 | 3 | 4 | 5;  // reviewer-set model confidence, 5-point scale (CRS-38)
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
  // Optional master-data overrides — set via project edit / Submit-New-Idea. When present they
  // win over the PROJECT_HIER seed (hierOf) and the derived pillar (metaOf), so edits to the
  // Business-Setup hierarchy flow through the whole tool.
  bu?: string; sbu?: string; pgroup?: string; alpha?: string; product?: string; material?: string;
  initiative?: string;
  // Value proposition (CRS-56 · Value Assessment): the MASTER value prop is the best-in-class HUMAN
  // (HI) statement — a must-have at project creation; per-needs-based-segment value props are
  // recommended (a project can serve many segments). The Next Best Alternative (NBA) — the current
  // competitive alternative or As-Is solution the customer uses today — is also required at creation
  // (De-Risking NPD: "Understand Customer Needs versus Next Best Alternative" at Concept G1).
  valueProp?: string;                 // HI master value proposition (best-in-class, human-authored)
  nextBestAlternative?: string;       // NBA — current competitive alternative / As-Is solution (required)
  segmentValueProps?: SegmentValueProp[];
  valuePropAI?: string;               // AI-generated rendition, minted at submission (HI⇄AI toggle)
  valuePropSource?: "HI" | "AI";      // active view for the value-prop toggle (default HI)
  // Value signals (Bridge Slice 1) — optional structured inputs; all have derived fallbacks so seeds
  // never blank (mirror the valueProp/nba pattern). Feed dog-tag metrics, budget, gates, exec slide.
  killRisk?: string;                  // Thor — the one assumption that, if false, sinks the project
  custImportance?: number;            // Thoth — customer importance of the differentiator (0–1, BD)
  relPerformance?: number;            // Thoth — relative performance vs the NBA (0–1, engineering)
  winP50?: number;                    // Odin — median commercial adoption / BD win probability (0–1)
  valueDrivers?: ValueDriver[];       // Slice 1B — the Value Equation: per-differentiator scoring vs the NBA
}
/** A single differentiator in the Value Equation — scored for customer importance and performance vs the NBA. */
export interface ValueDriver { name: string; importance: number; ourScore: number; nbaScore: number }
// Per-needs-segment value prop — a first-class reusable object (Bridge Slice 7 · Enki): segment name,
// the pain it removes, the quantified outcome, and a confidence flag. pain/outcome/confidence optional
// for back-compat with existing 2-field seeds.
export interface SegmentValueProp { segment: string; prop: string; pain?: string; outcome?: string; confidence?: 1 | 2 | 3 | 4 | 5 }

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
  "PRJ-16": { needs: ["Gen-5 SAR quality on Group-2 UAS", "Lower unit + integration cost"], outcomes: ["Sub-metre SAR in a smaller aperture", "Franchise reuse of the AI SAR core"], solution: ["De-scoped aperture + shared AI SAR former", "Common GCS + calibration line"], evidence: ["Bench proves resolution at reduced aperture", "Reuses PRJ-01 production tooling"] },
  "PRJ-17": { needs: ["Collective ISR across many small nodes", "Graceful degradation on node loss"], outcomes: ["Distributed-aperture sensing beats single node", "Self-forming coverage over the AO"], solution: ["Distributed-aperture fusion pod", "Swarm-formed sensing grid"], evidence: ["Sim: distributed aperture beats single sensor", "Cohesion holds after node attrition"] },
  "PRJ-18": { needs: ["Exploit space-SAR downlink at scale", "Tip-and-cue product generation"], outcomes: ["Automated exploitation keeps pace", "Products flow to tactical sensors"], solution: ["Automated ground exploitation pipeline", "Open tasking + dissemination APIs"], evidence: ["Throughput matches constellation downlink", "APIs interoperate with tactical TOC"] },
  "PRJ-19": { needs: ["Aircrew mastery beyond scarce sim time", "Scenario breadth vs live-fly cost"], outcomes: ["LVC rehearsal accelerates mastery", "Skill transfers to live-fly"], solution: ["Live-Virtual-Constructive XR suite", "Reuses live ISR feeds for scenarios"], evidence: ["LVC transfer measured to live performance", "Cost/hour far below live-fly"] },
  "PRJ-20": { needs: ["Air-combat autonomy at machine tempo", "Loyal-wingman within commander intent"], outcomes: ["WVR maneuvering beyond human tempo", "Adaptive play vs scripted autopilot"], solution: ["Reinforcement-learning dogfight agent", "MUM-T loyal-wingman integration"], evidence: ["RL agent wins vs scripted baselines in sim", "HITL bounds constrain the envelope"] },
  "PRJ-21": { needs: ["Compress the commander OODA loop", "Prioritized, trusted, actionable insight"], outcomes: ["Decisions in minutes, not tens of minutes", "Fused feeds → ranked actions"], solution: ["Decision-speed SA fusion engine", "Explainable prioritization for HITL trust"], evidence: ["Decision-cycle time cut in exercise", "Commanders act on the ranked insight"] },
  "PRJ-22": { needs: ["Team Group 1/3/5 UAS as one force", "Cross-vendor teaming under one intent"], outcomes: ["Cross-group teaming under commander intent", "Mixed-vendor UAS on one fabric"], solution: ["Open multi-UAS teaming fabric", "Single-intent tasking across echelons"], evidence: ["Cross-group teaming demonstrated in sim", "Fabric interoperates across UAS types"] },
};
export const briefOf = (p: Project): ProjectBrief =>
  PROJECT_BRIEF[p.id] ?? { needs: [`${p.name} capability gap`], outcomes: [`Field ${p.name}`], solution: [`Develop ${p.name} to ${p.category}`], evidence: [`${GATE_STAGE[p.gate]} stage · confidence ${p.confidence}/5`] };

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

// Bill of Materials (BOM) per Product # — the Material #s that make up the product, each with
// a standard-cost breakdown (Labor · Material · Machining · Other) and quantity. Deterministic
// from the project so estimated production cost rolls up the same way every render.
// Material-number class from the prefix digit: 1=raw purchased · 3=partial assembly ·
// 5=complete assembly · 7=product (7xxxx-yyy). Drives the BOM badge + roll-up level.
export type MatClass = "raw" | "partial" | "complete" | "product";
export const MAT_CLASS_LABEL: Record<MatClass, string> = { raw: "Raw purchased", partial: "Partial assembly", complete: "Complete assembly", product: "Product / variant" };
export const matClass = (num: string): MatClass =>
  num.startsWith("1") ? "raw" : num.startsWith("3") ? "partial" : num.startsWith("5") ? "complete" : "product";
export interface BomLine { material: string; desc: string; kind: MatClass; qty: number; labor: number; matl: number; machining: number; other: number }
export const bomStdCost = (l: BomLine) => l.labor + l.matl + l.machining + l.other; // unit standard cost $
export const bomExtended = (l: BomLine) => bomStdCost(l) * l.qty;                    // extended $ (qty × std)
export function bomOf(p: Project): BomLine[] {
  const n = idNum(p.id);
  const s = (k: number) => ((n * 37 + k * 101) % 50) + 10; // 10..59 deterministic
  const raw = (k: number) => `1${String(n * 20 + k).padStart(6, "0")}`;     // 1xxxxxx raw purchased
  const partial = (k: number) => `3${String(n * 20 + k).padStart(5, "0")}`; // 3xxxxx partial assembly
  const complete = (k: number) => `5${String(n * 20 + k).padStart(5, "0")}`;// 5xxxxx complete assembly
  return [
    { material: raw(1), desc: "Focal-plane / core", kind: "raw", qty: 1, labor: s(1) * 8, matl: s(2) * 40, machining: s(3) * 12, other: s(4) * 4 },
    { material: raw(2), desc: "Processing PCB", kind: "raw", qty: 2, labor: s(9) * 5, matl: s(10) * 20, machining: s(11) * 6, other: s(12) * 2 },
    { material: raw(3), desc: "Housing / chassis", kind: "raw", qty: 1, labor: s(13) * 4, matl: s(14) * 15, machining: s(15) * 22, other: s(16) * 3 },
    { material: partial(1), desc: "Optics / lens sub-assembly", kind: "partial", qty: 1, labor: s(5) * 6, matl: s(6) * 25, machining: s(7) * 18, other: s(8) * 3 },
    { material: complete(1), desc: "Final assembly + test", kind: "complete", qty: 1, labor: s(17) * 20, matl: s(18) * 5, machining: s(19) * 8, other: s(20) * 10 },
  ];
}
// Estimated per-unit production (standard) cost of a Product # = Σ extended BOM lines.
export const productionCost = (p: Project) => bomOf(p).reduce((sum, l) => sum + bomExtended(l), 0);
export function bomCostSplit(p: Project) {
  const lines = bomOf(p);
  const acc = (f: (l: BomLine) => number) => lines.reduce((s, l) => s + f(l) * l.qty, 0);
  return { labor: acc((l) => l.labor), matl: acc((l) => l.matl), machining: acc((l) => l.machining), other: acc((l) => l.other), total: productionCost(p) };
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

// R&D budget scenarios (operator) — the available R&D that sets the funding line. Base is the $77M plan;
// Conservative ($66M) and Growth ($88M) let the PdM/PgM re-balance the stack under each envelope.
export const BUDGET_SCENARIOS = [
  { key: "conservative", label: "Conservative", m: 66 },
  { key: "base", label: "Base", m: 77 },
  { key: "growth", label: "Growth", m: 88 },
] as const;
export type BudgetScenario = (typeof BUDGET_SCENARIOS)[number]["key"];
export const scenarioAvailK = (key: BudgetScenario): number =>
  (BUDGET_SCENARIOS.find((s) => s.key === key) ?? BUDGET_SCENARIOS[1]).m * 1000;

// ── Demo portfolio (seed; a real deploy loads from the platform event log) ───────────────
export const DEMO_BUDGET: DivisionBudget = { division: "ALL DIVISIONS", totalK: 42000, allocatedK: 6000 };

const DEMO_PROJECTS_BASE: Project[] = [
  { id: "PRJ-01", name: "SAR Imaging Payload Gen-5", division: "ISR Payloads", lob: "SBU-1", manager: "A. Seguin", category: "New Platform", gate: "G4", confidence: 5, tech: "low", comm: "low", nreK: 8200, fullRev10yM: 210, doNothing10yM: 60, firstRevenue: "2026-Q4", criticalPath: true, humanLoad: 0.62, ai: 0.4, si: 0.3, hi: 0.3, predictions: 41 },
  { id: "PRJ-02", name: "Hivemind Swarm Fusion AI", division: "Autonomy", lob: "SBU-1", manager: "R. Kaur", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 5400, fullRev10yM: 155, doNothing10yM: 30, firstRevenue: "2027-Q1", criticalPath: true, humanLoad: 0.74, ai: 0.55, si: 0.25, hi: 0.2, predictions: 33 },
  { id: "PRJ-03", name: "Maritime ISR Drone Radar", division: "Maritime ISR", lob: "SBU-1", manager: "M. Devlin", category: "Sustaining+", gate: "G5", confidence: 5, tech: "low", comm: "low", nreK: 6100, fullRev10yM: 140, doNothing10yM: 55, firstRevenue: "2026-Q3", criticalPath: false, humanLoad: 0.48, ai: 0.3, si: 0.35, hi: 0.35, predictions: 22 },
  { id: "PRJ-04", name: "Counter-UAS Loitering Effector", division: "Effects", lob: "SBU-1", manager: "T. Cho", category: "New Platform", gate: "G2", confidence: 2, tech: "med", comm: "med", nreK: 9300, fullRev10yM: 260, doNothing10yM: 20, firstRevenue: "2028-Q2", criticalPath: true, humanLoad: 0.81, ai: 0.35, si: 0.3, hi: 0.35, predictions: 57 },
  { id: "PRJ-05", name: "Swarm Command & Control Cloud", division: "Autonomy SW", lob: "SBU-2", manager: "L. Okafor", category: "New Product", gate: "G4", confidence: 3, tech: "med", comm: "low", nreK: 4200, fullRev10yM: 180, doNothing10yM: 25, firstRevenue: "2026-Q4", criticalPath: false, humanLoad: 0.55, ai: 0.6, si: 0.25, hi: 0.15, predictions: 29 },
  { id: "PRJ-06", name: "Handheld Multispectral ISR Sensor", division: "Handheld", lob: "SBU-2", manager: "P. Nilsson", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "med", nreK: 3600, fullRev10yM: 95, doNothing10yM: 40, firstRevenue: "2027-Q2", criticalPath: false, humanLoad: 0.44, ai: 0.3, si: 0.3, hi: 0.4, predictions: 18 },
  { id: "PRJ-07", name: "Space-Based SAR Constellation", division: "Space ISR", lob: "SBU-3", manager: "V. Rossi", category: "New Platform", gate: "G2", confidence: 2, tech: "high", comm: "med", nreK: 12500, fullRev10yM: 340, doNothing10yM: 10, firstRevenue: "2029-Q1", criticalPath: true, humanLoad: 0.7, ai: 0.45, si: 0.3, hi: 0.25, predictions: 63 },
  { id: "PRJ-08", name: "Ground Control Station Modernization", division: "Ground Systems", lob: "SBU-2", manager: "S. Haddad", category: "Sustaining", gate: "G6", confidence: 5, tech: "low", comm: "low", nreK: 2100, fullRev10yM: 70, doNothing10yM: 45, firstRevenue: "2026-Q2", criticalPath: false, humanLoad: 0.38, ai: 0.25, si: 0.4, hi: 0.35, predictions: 11 },
  { id: "PRJ-09", name: "EO/IR Gimbal Sensor Next-Gen", division: "Sensors", lob: "SBU-3", manager: "D. Park", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 4800, fullRev10yM: 120, doNothing10yM: 38, firstRevenue: "2027-Q3", criticalPath: true, humanLoad: 0.6, ai: 0.3, si: 0.35, hi: 0.35, predictions: 26 },
  { id: "PRJ-10", name: "Autonomy SDK & Swarm Marketplace", division: "Developer", lob: "SBU-2", manager: "R. Kaur", category: "New Product", gate: "G2", confidence: 2, tech: "med", comm: "med", nreK: 3900, fullRev10yM: 130, doNothing10yM: 15, firstRevenue: "2028-Q1", criticalPath: false, humanLoad: 0.5, ai: 0.65, si: 0.2, hi: 0.15, predictions: 34 },
  { id: "PRJ-11", name: "Legacy ISR Sensor EOL Bridge", division: "Sensors", lob: "SBU-3", manager: "M. Devlin", category: "Phase-out", gate: "G5", confidence: 5, tech: "low", comm: "low", nreK: 1400, fullRev10yM: 40, doNothing10yM: 35, firstRevenue: "2026-Q1", criticalPath: false, humanLoad: 0.3, ai: 0.2, si: 0.4, hi: 0.4, predictions: 8 },
  { id: "PRJ-12", name: "Resilient PNT-Denied Datalink", division: "Comms", lob: "SBU-3", manager: "T. Cho", category: "New Platform", gate: "G1", confidence: 1, tech: "high", comm: "med", nreK: 7600, fullRev10yM: 300, doNothing10yM: 5, firstRevenue: "2030-Q1", criticalPath: true, humanLoad: 0.68, ai: 0.5, si: 0.3, hi: 0.2, predictions: 72 },
  // Forward-looking flexibility (AI/ML · VR/XR · MUM-T · autonomous space) — Intelligent
  // Adaptation · Operational Synergy · Precision Execution.
  { id: "PRJ-13", name: "Immersive VR/XR Mission Rehearsal", division: "Training AI", lob: "SBU-2", manager: "S. Haddad", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 3200, fullRev10yM: 110, doNothing10yM: 12, firstRevenue: "2027-Q2", criticalPath: false, humanLoad: 0.5, ai: 0.5, si: 0.3, hi: 0.2, predictions: 19 },
  { id: "PRJ-14", name: "Manned-Unmanned Teaming (MUM-T) Suite", division: "Autonomy", lob: "SBU-1", manager: "R. Kaur", category: "New Platform", gate: "G2", confidence: 2, tech: "high", comm: "med", nreK: 8800, fullRev10yM: 290, doNothing10yM: 8, firstRevenue: "2028-Q3", criticalPath: true, humanLoad: 0.72, ai: 0.5, si: 0.3, hi: 0.2, predictions: 48 },
  { id: "PRJ-15", name: "Orbital Self-Replicating Sensor Swarm", division: "Space ISR", lob: "SBU-3", manager: "V. Rossi", category: "New Platform", gate: "G1", confidence: 1, tech: "high", comm: "high", nreK: 14000, fullRev10yM: 520, doNothing10yM: 0, firstRevenue: "2031-Q1", criticalPath: false, humanLoad: 0.66, ai: 0.6, si: 0.25, hi: 0.15, predictions: 88 },
  // Products beneath existing Alpha Codes (multiple products per Alpha Code / variant next-gen).
  { id: "PRJ-16", name: "SAR Imaging Payload Variant-B", division: "ISR Payloads", lob: "SBU-1", manager: "A. Seguin", category: "New Product", gate: "G2", confidence: 3, tech: "med", comm: "low", nreK: 4600, fullRev10yM: 130, doNothing10yM: 20, firstRevenue: "2027-Q3", criticalPath: false, humanLoad: 0.5, ai: 0.4, si: 0.3, hi: 0.3, predictions: 21 },
  { id: "PRJ-17", name: "Swarm ISR Sensor Pod", division: "Autonomy", lob: "SBU-2", manager: "R. Kaur", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "med", nreK: 3400, fullRev10yM: 100, doNothing10yM: 14, firstRevenue: "2027-Q1", criticalPath: false, humanLoad: 0.55, ai: 0.5, si: 0.3, hi: 0.2, predictions: 17 },
  { id: "PRJ-18", name: "Space SAR Ground Segment", division: "Space ISR", lob: "SBU-3", manager: "V. Rossi", category: "New Product", gate: "G2", confidence: 2, tech: "med", comm: "med", nreK: 5200, fullRev10yM: 160, doNothing10yM: 12, firstRevenue: "2028-Q4", criticalPath: false, humanLoad: 0.52, ai: 0.4, si: 0.3, hi: 0.3, predictions: 24 },
  // UAS Situational-Awareness teaming opportunities (Medium + Large UAS) — from the UAS SA paper:
  // XR pilot training/mastery (LVC), AI dogfight/RL agents, commander decision-speed SA, Group 1/3/5 teaming.
  { id: "PRJ-19", name: "XR Pilot Training & Mastery Suite (LVC)", division: "Training AI", lob: "SBU-2", manager: "S. Haddad", category: "New Product", gate: "G2", confidence: 3, tech: "med", comm: "low", nreK: 4200, fullRev10yM: 145, doNothing10yM: 12, firstRevenue: "2028-Q1", criticalPath: false, humanLoad: 0.5, ai: 0.5, si: 0.3, hi: 0.2, predictions: 20 },
  { id: "PRJ-20", name: "AI Dogfight RL Agent (MUM-T)", division: "Autonomy", lob: "SBU-1", manager: "R. Kaur", category: "New Platform", gate: "G1", confidence: 1, tech: "high", comm: "med", nreK: 9800, fullRev10yM: 320, doNothing10yM: 5, firstRevenue: "2029-Q2", criticalPath: true, humanLoad: 0.72, ai: 0.62, si: 0.23, hi: 0.15, predictions: 58 },
  { id: "PRJ-21", name: "Commander Decision-Speed SA Engine", division: "Autonomy SW", lob: "SBU-2", manager: "L. Okafor", category: "New Product", gate: "G3", confidence: 3, tech: "med", comm: "low", nreK: 5200, fullRev10yM: 190, doNothing10yM: 20, firstRevenue: "2027-Q3", criticalPath: true, humanLoad: 0.58, ai: 0.6, si: 0.25, hi: 0.15, predictions: 33 },
  { id: "PRJ-22", name: "Group 1/3/5 Multi-UAS Teaming Fabric", division: "Autonomy", lob: "SBU-1", manager: "R. Kaur", category: "New Platform", gate: "G2", confidence: 2, tech: "high", comm: "med", nreK: 8600, fullRev10yM: 300, doNothing10yM: 8, firstRevenue: "2028-Q4", criticalPath: true, humanLoad: 0.68, ai: 0.55, si: 0.3, hi: 0.15, predictions: 44 },
];

// Realistic simulated intelligence per project (Tom Sant NOSE-informed value prop + the competitive Next
// Best Alternative + a scored Value Equation vs that NBA + the kill-risk + a lead needs-segment). Grounded
// in up-and-coming defense drone-swarm / autonomous-ISR capabilities (OODA-loop compression, sensor fusion,
// MUM-T, counter-UAS, PNT-denied ops, space SAR). Merged into DEMO_PROJECTS so every project ships populated.
type ProjectIntel = Pick<Project, "valueProp" | "nextBestAlternative" | "valueDrivers" | "killRisk" | "segmentValueProps">;
const d = (name: string, importance: number, ourScore: number, nbaScore: number): ValueDriver => ({ name, importance, ourScore, nbaScore });
const PROJECT_INTEL: Record<string, ProjectIntel> = {
  "PRJ-01": {
    valueProp: "For ISR mission planners who need all-weather, GPS-denied imaging, SAR Imaging Payload Gen-5 is a Group-3 SWaP-constrained radar that delivers sub-0.3 m day/night, cloud-penetrating imagery and cross-cues to effects in seconds. Unlike podded EO/IR that goes blind in weather, it is leader-class — on-board AI SAR forming turns raw returns into targets at the edge.",
    nextBestAlternative: "Legacy podded EO/IR ISR (weather- and night-limited, ground-station exploitation only)",
    valueDrivers: [d("All-weather / GPS-denied imaging", 1.0, 0.93, 0.35), d("On-board AI SAR forming (edge targets)", 0.9, 0.9, 0.4), d("SWaP fit on Group-3 UAS", 0.8, 0.82, 0.55)],
    killRisk: "Focal-plane yield holds at production volume on the dual-source wafer lot",
    segmentValueProps: [{ segment: "Air Force · ISR", prop: "Persistent, weather-proof SAR revisit that cross-cues to strike inside the decision cycle.", confidence: 5, pain: "EO/IR blind at night/weather", outcome: "sensor-to-decision in seconds" }],
  },
  "PRJ-02": {
    valueProp: "For UAS operators fighting under jamming, Hivemind Swarm Fusion AI is an edge-autonomy stack that keeps a multi-UAS swarm self-synchronizing and mission-capable after attrition — decentralized execution within commander intent. Unlike single-operator-per-air-vehicle control, it collapses operator load and survives comms denial.",
    nextBestAlternative: "One-operator-per-UAS manual control with a datalink-dependent GCS",
    valueDrivers: [d("Comms-denied swarm cohesion", 1.0, 0.88, 0.3), d("Operator-load reduction (1-to-many)", 0.95, 0.85, 0.35), d("Role re-assignment on node loss", 0.85, 0.82, 0.45)],
    killRisk: "Decentralized tasking holds cohesion past 30% attrition in a contested EMS",
    segmentValueProps: [{ segment: "SOF · Direct Action", prop: "One operator commands a resilient swarm that re-tasks itself when nodes drop.", confidence: 3, pain: "operator overload under jamming", outcome: "swarm holds intent after attrition" }],
  },
  "PRJ-03": {
    valueProp: "For maritime domain-awareness cells, Maritime ISR Drone Radar detects low-RCS threats over sea clutter and holds persistent wide-area track from one Group-3 platform — feeding the TOC a common picture the legacy patrol cadence cannot.",
    nextBestAlternative: "Crewed maritime patrol sorties + shipborne radar with coverage gaps",
    valueDrivers: [d("Low-RCS littoral detection in clutter", 0.95, 0.85, 0.5), d("Persistent wide-area revisit", 0.85, 0.83, 0.55), d("Sensor-grid fusion to the TOC", 0.8, 0.8, 0.5)],
    killRisk: "Adaptive clutter rejection sustains track at operational sea states",
    segmentValueProps: [{ segment: "Navy · Maritime", prop: "One platform, persistent low-RCS track over sea clutter into the common picture.", confidence: 5 }],
  },
  "PRJ-04": {
    valueProp: "For force-protection cells facing cheap drone swarms, the Counter-UAS Loitering Effector layers gun-cheap defeat with a loitering effector for consequence — positive-ID before engage — so an exchange-ratio that today favors the attacker flips to the defender.",
    nextBestAlternative: "Kinetic guns + jammers alone (poor exchange ratio vs saturation)",
    valueDrivers: [d("Favorable cost-exchange vs saturation", 1.0, 0.86, 0.3), d("Positive-ID before engage (MIL-STD-2525)", 0.9, 0.84, 0.5), d("Layered gun + effector kill web", 0.85, 0.82, 0.45)],
    killRisk: "Per-defeat cost stays below the threat's per-drone cost at scale",
    segmentValueProps: [{ segment: "Army · Fires", prop: "Defeat saturation swarms at a cost ratio that finally favors the defender.", confidence: 2 }],
  },
  "PRJ-05": {
    valueProp: "For JADC2 fires and effects cells, Swarm Command & Control Cloud fuses air/land/sea into one picture with a single engagement authority and rapid cross-domain re-task — replacing stovepiped, screen-swivel C2 with software-speed synchronization.",
    nextBestAlternative: "Stovepiped, single-domain C2 consoles requiring manual screen-swivel",
    valueDrivers: [d("One multi-domain picture + authority", 1.0, 0.87, 0.4), d("Rapid cross-domain re-task", 0.9, 0.85, 0.45), d("Open IBCS/JADC2 links", 0.8, 0.8, 0.55)],
    killRisk: "Cross-service data rights and links are granted for the fused picture",
    segmentValueProps: [{ segment: "USMC · Expeditionary", prop: "Air-land-sea in one picture with a single engagement authority.", confidence: 3 }],
  },
  "PRJ-06": {
    valueProp: "For dismounted teams, the Handheld Multispectral ISR Sensor speeds edge threat recognition with AI hints and cross-cues to higher echelon — field-rugged optics that shorten the ID timeline the current binocular-plus-radio workflow cannot.",
    nextBestAlternative: "Standard-issue binoculars/thermal monocular + voice reporting",
    valueDrivers: [d("Faster dismounted target ID", 0.9, 0.82, 0.5), d("AI cueing + cross-echelon feed", 0.85, 0.8, 0.45), d("MIL-rugged, low-SWaP form", 0.8, 0.83, 0.6)],
    killRisk: "AI cueing improves ID timelines without unacceptable false-alarm load",
    segmentValueProps: [{ segment: "USMC · Expeditionary", prop: "Faster, AI-cued threat ID at the edge, cross-cued up the chain.", confidence: 3 }],
  },
  "PRJ-07": {
    valueProp: "For national ISR tasking, the Space-Based SAR Constellation denies the adversary weather and night sanctuary with persistent overhead SAR revisit and tip-and-cue to tactical sensors — coverage a tactical-only fleet cannot sustain.",
    nextBestAlternative: "Airborne-only ISR + commercial EO imagery with revisit gaps",
    valueDrivers: [d("Persistent overhead SAR revisit", 1.0, 0.85, 0.4), d("Tip-and-cue to tactical sensors", 0.9, 0.82, 0.45), d("Deny weather/night sanctuary", 0.85, 0.84, 0.5)],
    killRisk: "On-orbit SAR-forming optics hold figure under thermal load at scale",
    segmentValueProps: [{ segment: "Air Force · ISR", prop: "Global, revisit-dense SAR that tips tactical sensors day, night, and weather.", confidence: 2 }],
  },
  "PRJ-08": {
    valueProp: "For mixed-fleet UAS units, Ground Control Station Modernization puts one open-architecture GCS across platforms with an XR interface, cutting sustainment and training burden versus today's one-GCS-per-type sprawl.",
    nextBestAlternative: "Per-platform proprietary GCS variants (high training + sustainment cost)",
    valueDrivers: [d("One GCS across platforms", 0.9, 0.86, 0.45), d("Lower operator cognitive load (XR)", 0.8, 0.8, 0.5), d("Open architecture / low migration risk", 0.75, 0.83, 0.55)],
    killRisk: "Open-architecture migration certifies across the fielded fleet on schedule",
    segmentValueProps: [{ segment: "Army · Fires", prop: "One open GCS across the fleet — less training, less sustainment.", confidence: 5 }],
  },
  "PRJ-09": {
    valueProp: "For Group 2-3 platforms in degraded visual environments, the EO/IR Gimbal Sensor Next-Gen gives longer standoff and sharper track with a cooled core and AI-assisted detection — outperforming the legacy gimbal it replaces.",
    nextBestAlternative: "Legacy uncooled EO/IR gimbal with manual detection",
    valueDrivers: [d("Longer standoff / sharper track", 0.9, 0.85, 0.55), d("AI-assisted detection in DVE", 0.85, 0.82, 0.45), d("Cross-sensor cueing", 0.75, 0.8, 0.5)],
    killRisk: "Seal-wear on the cooled core is mitigated for the fielded duty cycle",
    segmentValueProps: [{ segment: "Army · Fires", prop: "See first and further in degraded visual environments.", confidence: 3 }],
  },
  "PRJ-10": {
    valueProp: "For integrators who want autonomy without vendor lock, the Autonomy SDK & Swarm Marketplace is a typed SDK + vetted-behavior marketplace that onboards new capability fast and earns recurring platform revenue — an ecosystem the closed stacks can't match.",
    nextBestAlternative: "Single-vendor closed autonomy stack (slow onboarding, lock-in)",
    valueDrivers: [d("No vendor lock (open SDK)", 0.95, 0.88, 0.3), d("Faster capability onboarding", 0.85, 0.84, 0.45), d("Recurring marketplace revenue", 0.8, 0.8, 0.35)],
    killRisk: "Developer take-rate and certification throughput hit the adoption model",
    segmentValueProps: [{ segment: "Allied / FMS", prop: "Onboard vetted autonomy behaviors fast — no vendor lock.", confidence: 2 }],
  },
  "PRJ-11": {
    valueProp: "For programs sustaining fielded sensors to end-of-life, the Legacy ISR Sensor EOL Bridge preserves ISR continuity through a controlled phase-out and a clean migration path to Gen-5 — avoiding the capability gap a hard cutover creates.",
    nextBestAlternative: "Hard cutover to next-gen (capability gap + spares cliff)",
    valueDrivers: [d("ISR continuity during transition", 0.85, 0.86, 0.5), d("Controlled ≤3-yr phase-out", 0.75, 0.82, 0.55), d("Migration path to Gen-5", 0.7, 0.8, 0.5)],
    killRisk: "Spares + bridge kit sustain fielded units through the phase-out window",
    segmentValueProps: [{ segment: "Air Force · ISR", prop: "No ISR gap while you transition to Gen-5.", confidence: 5 }],
  },
  "PRJ-12": {
    valueProp: "For forces operating in contested EMS, the Resilient PNT-Denied Datalink holds link and PNT continuity without GPS via a resilient waveform (QKD option) — where standard datalinks and GPS simply fail.",
    nextBestAlternative: "Standard GPS + conventional tactical datalink (fails under EW/jamming)",
    valueDrivers: [d("Hold link in contested EMS", 1.0, 0.84, 0.25), d("PNT continuity without GPS", 0.95, 0.82, 0.3), d("Standards-aligned interop", 0.8, 0.8, 0.5)],
    killRisk: "Resilient waveform holds link in EW-chamber tests at operational range",
    segmentValueProps: [{ segment: "SOF · Direct Action", prop: "Assured comms and PNT when GPS and standard links are denied.", confidence: 1 }],
  },
  "PRJ-13": {
    valueProp: "For readiness cells, Immersive VR/XR Mission Rehearsal turns live ISR into operational twins and AI-generated scenarios — compressing prep timelines and building mastery the slide-and-brief workflow cannot.",
    nextBestAlternative: "Static slide briefs + limited live-fly rehearsal",
    valueDrivers: [d("Rehearse on current mission data", 0.9, 0.85, 0.4), d("AI scenario generation", 0.8, 0.82, 0.45), d("Compressed prep timelines", 0.8, 0.83, 0.5)],
    killRisk: "Operational twins from live ISR measurably improve readiness scores",
    segmentValueProps: [{ segment: "Air Force · ISR", prop: "Rehearse on real mission data; master faster.", confidence: 3 }],
  },
  "PRJ-14": {
    valueProp: "For crewed-uncrewed operations, the Manned-Unmanned Teaming (MUM-T) Suite fuses human judgment with machine speed across domains — pushing high-risk roles to unmanned and holding one synchronized rhythm the current voice-coordinated teaming can't.",
    nextBestAlternative: "Voice-coordinated manned + separately-controlled unmanned assets",
    valueDrivers: [d("One synchronized crewed/uncrewed rhythm", 1.0, 0.85, 0.35), d("High-risk roles to unmanned", 0.9, 0.83, 0.4), d("AI decision support + XR picture", 0.85, 0.82, 0.45)],
    killRisk: "MUM-T links + AI decision support certify for teamed employment",
    segmentValueProps: [{ segment: "Army · Fires", prop: "Team crewed and uncrewed at machine speed; keep humans on the hard calls.", confidence: 2 }],
  },
  "PRJ-15": {
    valueProp: "For persistent space ISR beyond launch-mass limits, the Orbital Self-Replicating Sensor Swarm fabricates and sustains nodes in-situ for a growing sensor mesh — a moonshot that breaks the one-launch-one-payload ceiling.",
    nextBestAlternative: "Conventional launch-mass-limited satellites (fixed constellation size)",
    valueDrivers: [d("Scale ISR beyond launch mass", 1.0, 0.8, 0.2), d("In-situ self-replication / sustainment", 0.95, 0.78, 0.25), d("Persistent, growing sensor mesh", 0.85, 0.8, 0.35)],
    killRisk: "In-space fabrication + debris guardrails prove out beyond concept sims",
    segmentValueProps: [{ segment: "Air Force · ISR", prop: "A sensor mesh that grows itself in orbit.", confidence: 1 }],
  },
  "PRJ-16": {
    valueProp: "For cost-sensitive ISR buyers, SAR Imaging Payload Variant-B brings Gen-5 SAR performance to a smaller, lower-cost aperture — extending the franchise into Group-2 platforms the flagship payload is too large to serve.",
    nextBestAlternative: "Up-porting the full Gen-5 payload (too heavy/costly for Group-2)",
    valueDrivers: [d("Gen-5 SAR at Group-2 SWaP/cost", 0.9, 0.84, 0.45), d("Franchise reuse (shared AI core)", 0.8, 0.85, 0.5), d("Lower unit cost", 0.8, 0.82, 0.55)],
    killRisk: "The de-scoped aperture holds enough resolution for the target missions",
    segmentValueProps: [{ segment: "Allied / FMS", prop: "Gen-5 SAR quality in a Group-2 budget and form factor.", confidence: 3 }],
  },
  "PRJ-17": {
    valueProp: "For swarm operators, the Swarm ISR Sensor Pod is a shared, self-forming ISR aperture across many small nodes — collective sensing that outperforms any single node the current one-sensor-per-drone approach fields.",
    nextBestAlternative: "Independent single-sensor drones with no collective fusion",
    valueDrivers: [d("Collective (distributed-aperture) sensing", 0.95, 0.85, 0.4), d("Self-forming across nodes", 0.85, 0.82, 0.45), d("Graceful degradation on node loss", 0.8, 0.8, 0.5)],
    killRisk: "Distributed-aperture fusion beats single-node sensing at fielded spacing",
    segmentValueProps: [{ segment: "SOF · Direct Action", prop: "The swarm is the sensor — collective ISR that degrades gracefully.", confidence: 3 }],
  },
  "PRJ-18": {
    valueProp: "For space-SAR operators, the Space SAR Ground Segment turns raw downlink into exploited, tip-and-cue-ready products at scale — the exploitation bottleneck the constellation's value depends on.",
    nextBestAlternative: "Manual/legacy ground exploitation that can't keep pace with downlink",
    valueDrivers: [d("Automated exploitation at downlink scale", 0.95, 0.84, 0.4), d("Tip-and-cue product generation", 0.85, 0.82, 0.45), d("Open tasking/dissemination APIs", 0.8, 0.8, 0.5)],
    killRisk: "Ground exploitation throughput keeps pace with constellation downlink",
    segmentValueProps: [{ segment: "Air Force · ISR", prop: "Turn space-SAR downlink into tip-and-cue products at scale.", confidence: 2 }],
  },
  "PRJ-19": {
    valueProp: "For aircrew readiness, the XR Pilot Training & Mastery Suite (LVC) blends live-virtual-constructive rehearsal so pilots master mission profiles faster than the sim-time-limited status quo.",
    nextBestAlternative: "Limited full-motion sim time + live-fly hours (scarce, costly)",
    valueDrivers: [d("LVC mastery acceleration", 0.9, 0.84, 0.45), d("Scenario breadth vs live-fly cost", 0.85, 0.82, 0.5), d("Reuses live ISR feeds", 0.75, 0.8, 0.5)],
    killRisk: "LVC rehearsal transfers measurably to live-fly performance",
    segmentValueProps: [{ segment: "Air Force · ISR", prop: "Master mission profiles in LVC before you burn live-fly hours.", confidence: 3 }],
  },
  "PRJ-20": {
    valueProp: "For air-combat autonomy, the AI Dogfight RL Agent (MUM-T) flies within-visual-range engagements at machine reaction speed as a loyal-wingman behavior — beyond-human tempo the scripted-autopilot alternative can't reach.",
    nextBestAlternative: "Scripted/rule-based autopilot behaviors (predictable, human-tempo)",
    valueDrivers: [d("Machine-tempo WVR maneuvering", 1.0, 0.83, 0.3), d("Loyal-wingman MUM-T integration", 0.9, 0.82, 0.4), d("Adaptive RL vs scripted play", 0.85, 0.8, 0.35)],
    killRisk: "RL agent generalizes safely beyond its training envelope with HITL bounds",
    segmentValueProps: [{ segment: "Air Force · ISR", prop: "A loyal-wingman that fights at machine tempo under human command.", confidence: 1 }],
  },
  "PRJ-21": {
    valueProp: "For commanders, the Commander Decision-Speed SA Engine compresses the OODA loop — turning fused sensor feeds into prioritized, actionable insight so decisions land in minutes, not the tens-of-minutes the manual COP demands.",
    nextBestAlternative: "Manual common-operating-picture assembly + staff analysis",
    valueDrivers: [d("OODA-loop / decision-speed compression", 1.0, 0.86, 0.4), d("Prioritized, actionable insight", 0.9, 0.84, 0.45), d("Fusion across sensor feeds", 0.85, 0.82, 0.5)],
    killRisk: "Prioritization is trusted enough that commanders act on it under time pressure",
    segmentValueProps: [{ segment: "Army · Fires", prop: "Decisions in minutes: fused feeds to prioritized action.", confidence: 3 }],
  },
  "PRJ-22": {
    valueProp: "For multi-echelon UAS operations, the Group 1/3/5 Multi-UAS Teaming Fabric lets small, medium, and large UAS team as one force under commander intent — cross-group teaming the per-group stovepipes can't deliver.",
    nextBestAlternative: "Per-group, per-vendor UAS control with no cross-group teaming",
    valueDrivers: [d("Cross-Group (1/3/5) teaming", 1.0, 0.84, 0.3), d("Single intent across echelons", 0.9, 0.82, 0.4), d("Open teaming fabric / interop", 0.85, 0.8, 0.45)],
    killRisk: "Cross-group teaming certifies across mixed-vendor UAS on one fabric",
    segmentValueProps: [{ segment: "SOF · Direct Action", prop: "Small, medium, and large UAS fight as one force under one intent.", confidence: 2 }],
  },
};

// Every project ships with populated intel merged over the base (explicit fields still win; a project
// without an intel entry falls back to the deterministic derived engine, so nothing ever blanks).
export const DEMO_PROJECTS: Project[] = DEMO_PROJECTS_BASE.map((p) => ({ ...p, ...(PROJECT_INTEL[p.id] ?? {}) }));

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

// Risk contingency (Tech × Commercial) — 0.10 (Low/Low) … 0.70 (High/High). Cost and schedule
// grow with risk; upside (the unrealized potential) is already 1 − P(success). So a riskier
// project shows higher expected NRE, a longer schedule, and a larger orange upside band.
export const riskContingency = (p: Project) => +(((riskNum(p.tech) + riskNum(p.comm)) / 2)).toFixed(2);
export const riskAdjustedNreK = (p: Project) => Math.round(p.nreK * (1 + riskContingency(p)));         // cost ↑ with risk
export const riskAdjustedWorkdays = (p: Project) =>
  Math.round(GATES.reduce((s, g) => s + GATE_WORKDAYS[g], 0) * (1 + riskContingency(p) * 0.5));         // schedule ↑ with risk (half-weighted)

// Full plan from a start date: per-gate calendar boundaries + derived first-revenue date.
export const SCHEDULE_FALLBACK_START = "2026-01-05"; // deterministic default when the input is empty/malformed
export function scheduleFromStart(p: Project, startISO: string) {
  // Parse as UTC (…"Z") so the derived dates are viewer-invariant — iso() emits UTC, so a bare
  // "T00:00:00" (local) would shift every gate/first-revenue date a day for viewers east of UTC,
  // breaking the determinism guarantee. Empty/partial input (cleared <input type=date>) would make
  // an Invalid Date whose toISOString() throws + crashes the page — fall back to a fixed start.
  let start = new Date(startISO + "T00:00:00Z");
  if (isNaN(start.getTime())) start = new Date(SCHEDULE_FALLBACK_START + "T00:00:00Z");
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
  { key: "bu",       label: "BU",          full: "Business Unit (2-letter)" },
  { key: "sbu",      label: "SBU",         full: "Strategic Business Unit (3-letter)" },
  { key: "pgroup",   label: "Alpha Group", full: "Alpha Group (alphanumeric)" },
  { key: "alpha",    label: "Alpha Code",  full: "Alpha Code (4-char)" },
  { key: "product",  label: "Product #",   full: "Product (7xxxx)" },
  { key: "material", label: "Material #",  full: "Material (7xxxx-yyy)" },
] as const;
export type HierKey = typeof HIER_LEVELS[number]["key"];
export interface HierPath { bu: string; sbu: string; pgroup: string; alpha: string; product: string; material: string }

export const COMPANY_NAME = "Company (All BUs)";
// BU (2-letter) — aka LOB. SBU (3-letter) rolls up to a BU. Codes + human labels.
export const BU_LABEL: Record<string, string> = { MS: "Mission System", DS: "Drone Swarm", AP: "Advanced Programs" };
export const SBU_LABEL: Record<string, string> = {
  MSP: "MS Planning", MSE: "MS Engagement", DSI: "DS ISR", DSE: "DS EW", DSC: "DS Control",
  AP1: "AP Group 1", AP2: "AP Group 2", AP3: "AP Group 3",
};
// SBU base revenue ($M) — the do-nothing anchor per SBU (Σ = 700M company).
export const SBU_BASE: Record<string, number> = { MSP: 150, MSE: 150, DSI: 100, DSE: 60, DSC: 40, AP1: 70, AP2: 80, AP3: 50 };
export const BU_OF_SBU: Record<string, string> = { MSP: "MS", MSE: "MS", DSI: "DS", DSE: "DS", DSC: "DS", AP1: "AP", AP2: "AP", AP3: "AP" };
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
  // Number scheme: Product # = 7xxxx (5-digit) · Material # = 7xxxx-yyy (product + variant model).
  // BOM lines: 1xxxxxx raw purchased · 3xxxxx partial assembly · 5xxxxx complete assembly.
  // Product Group = 2-digit · Alpha Group = 3-digit.
  "PRJ-01": { bu: "MS", sbu: "MSP", pgroup: "AB1", alpha: "AA1D", product: "70001", material: "70001-001" },
  "PRJ-02": { bu: "DS", sbu: "DSI", pgroup: "CD1", alpha: "CA2X", product: "70002", material: "70002-001" },
  "PRJ-03": { bu: "MS", sbu: "MSE", pgroup: "AB2", alpha: "AB3M", product: "70003", material: "70003-001" },
  "PRJ-04": { bu: "DS", sbu: "DSE", pgroup: "DE1", alpha: "DE1W", product: "70004", material: "70004-001" },
  "PRJ-05": { bu: "DS", sbu: "DSC", pgroup: "DC1", alpha: "DC1C", product: "70005", material: "70005-001" },
  "PRJ-06": { bu: "MS", sbu: "MSP", pgroup: "AB1", alpha: "AB1H", product: "70006", material: "70006-001" },
  "PRJ-07": { bu: "AP", sbu: "AP1", pgroup: "AP1", alpha: "AP1S", product: "70007", material: "70007-001" },
  "PRJ-08": { bu: "DS", sbu: "DSC", pgroup: "DC1", alpha: "DC1G", product: "70008", material: "70008-001" },
  "PRJ-09": { bu: "MS", sbu: "MSE", pgroup: "AB2", alpha: "AB2G", product: "70009", material: "70009-001" },
  "PRJ-10": { bu: "AP", sbu: "AP2", pgroup: "AP2", alpha: "AP2K", product: "70010", material: "70010-001" },
  "PRJ-11": { bu: "AP", sbu: "AP3", pgroup: "AP3", alpha: "AP3L", product: "70011", material: "70011-001" },
  "PRJ-12": { bu: "AP", sbu: "AP2", pgroup: "AP2", alpha: "AP2Q", product: "70012", material: "70012-001" },
  "PRJ-13": { bu: "MS", sbu: "MSE", pgroup: "AB2", alpha: "AB2T", product: "70013", material: "70013-001" },
  "PRJ-14": { bu: "DS", sbu: "DSE", pgroup: "DE2", alpha: "DE2M", product: "70014", material: "70014-001" },
  "PRJ-15": { bu: "AP", sbu: "AP1", pgroup: "AP1", alpha: "AP1O", product: "70015", material: "70015-001" },
  "PRJ-16": { bu: "MS", sbu: "MSP", pgroup: "AB1", alpha: "AA1D", product: "70016", material: "70016-001" },
  "PRJ-17": { bu: "DS", sbu: "DSI", pgroup: "CD1", alpha: "CA2X", product: "70017", material: "70017-001" },
  "PRJ-18": { bu: "AP", sbu: "AP1", pgroup: "AP1", alpha: "AP1S", product: "70018", material: "70018-001" },
  "PRJ-19": { bu: "MS", sbu: "MSP", pgroup: "AB1", alpha: "AB1X", product: "70019", material: "70019-001" },
  "PRJ-20": { bu: "DS", sbu: "DSE", pgroup: "DE2", alpha: "DE2M", product: "70020", material: "70020-001" },
  "PRJ-21": { bu: "DS", sbu: "DSC", pgroup: "DC1", alpha: "DC1C", product: "70021", material: "70021-001" },
  "PRJ-22": { bu: "DS", sbu: "DSE", pgroup: "DE1", alpha: "DE1W", product: "70022", material: "70022-001" },
};
export const hierOf = (p: Project): HierPath => {
  const base = PROJECT_HIER[p.id] ?? { bu: BU_OF_SBU[p.lob] ?? p.lob, sbu: p.lob, pgroup: p.category, alpha: "—", product: p.id, material: `${p.id}-M01` };
  // Optional per-project overrides (from edit / Submit-New-Idea) win over the seed.
  return {
    bu: p.bu ?? base.bu, sbu: p.sbu ?? base.sbu, pgroup: p.pgroup ?? base.pgroup,
    alpha: p.alpha ?? base.alpha, product: p.product ?? base.product, material: p.material ?? base.material,
  };
};

// Company → BU → SBU → Product Group rollup: base revenue + funded NRE spend + NPV per node.
export interface RollupNode { name: string; baseM: number; spendK: number; npvM: number; count: number }
export interface SbuNode extends RollupNode { groups: RollupNode[] }
export interface BuNode extends RollupNode { sbus: SbuNode[] }
// Optional `sbuBase` lets the admin Business-Setup base revenue flow through: BU + Company base
// are then summed from the SBUs actually present (self-consistent), not the seed constants.
export function companyRollup(projects: Project[], opts: { sbuBase?: (code: string) => number } = {}): { company: RollupNode; bus: BuNode[] } {
  const sbuBase = opts.sbuBase ?? sbuBaseM;
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
      return { name: sbu, baseM: sbuBase(sbu), ...sum(inSbu), groups };
    });
    const buBase = sbus.reduce((s, x) => s + x.baseM, 0);
    return { name: bu, baseM: buBase, ...sum(inBu), sbus };
  });
  const company: RollupNode = { name: COMPANY_NAME, baseM: bus.reduce((s, b) => s + b.baseM, 0), spendK: bus.reduce((s, b) => s + b.spendK, 0), npvM: bus.reduce((s, b) => s + b.npvM, 0), count: projects.length };
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

// Intelligence Load (AI · SI · HI) aggregated by any category key — default is the strategic
// pillar (new pillar-specific categories), but the same rollup serves BU / SBU / Alpha Group /
// Project. Values are the mean mix across the group (each project's ai+si+hi ≈ 1).
export interface IntelLoadRow { name: string; ai: number; si: number; hi: number; count: number; humanLoad: number }
export function intelligenceLoad(projects: Project[], key: (p: Project) => string): IntelLoadRow[] {
  const map = new Map<string, { ai: number; si: number; hi: number; hl: number; count: number }>();
  for (const p of projects) {
    const k = key(p) || "—";
    const r = map.get(k) ?? { ai: 0, si: 0, hi: 0, hl: 0, count: 0 };
    r.ai += p.ai; r.si += p.si; r.hi += p.hi; r.hl += p.humanLoad; r.count += 1;
    map.set(k, r);
  }
  return Array.from(map.entries())
    .map(([name, r]) => ({ name, ai: r.ai / r.count, si: r.si / r.count, hi: r.hi / r.count, humanLoad: r.hl / r.count, count: r.count }))
    .sort((a, b) => b.count - a.count);
}

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

// ── BUSINESS SETUP (master data) — admin-editable BU→SBU→Alpha Group→Alpha Code→Product→Material.
// The "master business setup" admin (unlock 369963) manages the org hierarchy as first-class
// data. seedBizSetup derives the current master lists from the live portfolio so the editor
// opens pre-populated; the admin then adds/renames/removes entries (persisted client-side).
export type BizTier = "bu" | "sbu" | "pgroup" | "alpha" | "product" | "material";
export const BIZ_TIERS: { key: BizTier; label: string; parent?: BizTier }[] = [
  { key: "bu", label: "Business Unit" },
  { key: "sbu", label: "Strategic Business Unit", parent: "bu" },
  { key: "pgroup", label: "Alpha Group", parent: "sbu" },
  { key: "alpha", label: "Alpha Code", parent: "pgroup" },
  { key: "product", label: "Product #", parent: "alpha" },
  { key: "material", label: "Material #", parent: "product" },
];
export interface BizNode { code: string; label: string; parent?: string; baseM?: number }
export type BizSetup = { company: string } & Record<BizTier, BizNode[]>;
export function seedBizSetup(projects: Project[]): BizSetup {
  const uniq = (arr: BizNode[]) => Array.from(new Map(arr.map((n) => [n.code, n])).values()).sort((a, b) => a.code.localeCompare(b.code));
  const bu: BizNode[] = [], sbu: BizNode[] = [], pgroup: BizNode[] = [], alpha: BizNode[] = [], product: BizNode[] = [], material: BizNode[] = [];
  for (const p of projects) {
    const h = hierOf(p);
    bu.push({ code: h.bu, label: BU_LABEL[h.bu] ?? h.bu });
    sbu.push({ code: h.sbu, label: SBU_LABEL[h.sbu] ?? h.sbu, parent: h.bu, baseM: SBU_BASE[h.sbu] ?? 0 });
    pgroup.push({ code: h.pgroup, label: h.pgroup, parent: h.sbu });
    alpha.push({ code: h.alpha, label: h.alpha, parent: h.pgroup });
    product.push({ code: h.product, label: p.name, parent: h.alpha });
    material.push({ code: h.material, label: `${p.name} variant`, parent: h.product });
  }
  return { company: COMPANY_NAME, bu: uniq(bu), sbu: uniq(sbu), pgroup: uniq(pgroup), alpha: uniq(alpha), product: uniq(product), material: uniq(material) };
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

// ── STRATEGIC PILLARS (our own — Harmattan-AI-focused) + Project META (FLIR §2.1) ─────────
// Four strategic pillars, themed to the Harmattan-AI mission (AI-enabled loitering munitions,
// mass-producible attritable autonomy, sovereign deep-strike + ISR). This is the eXeL analogue
// of FLIR's "4 Initiatives" — every project selects one. Meta also carries value-ladder
// position + impact, target market, and competitive position (derived deterministically).
export const STRATEGIC_INITIATIVES = [
  "Autonomous Loitering Munitions",
  "AI Targeting & Terminal Autonomy",
  "Mass-Producible Attritable Systems",
  "Sovereign Deep-Strike & ISR",
] as const;
export type StrategicInitiative = typeof STRATEGIC_INITIATIVES[number];
// Pillar one-liners for the unlock screen + lens (the "why" behind each initiative).
export const PILLAR_DESC: Record<StrategicInitiative, string> = {
  "Autonomous Loitering Munitions": "One-way effectors & counter-UAS — loiter, positively ID, then strike.",
  "AI Targeting & Terminal Autonomy": "On-board AI: detect · track · terminal guidance in GPS/EW-denied fights.",
  "Mass-Producible Attritable Systems": "Low-cost, high-rate, software-defined attritable platforms at scale.",
  "Sovereign Deep-Strike & ISR": "Sovereign long-range ISR + strike with assured, interoperable datalink.",
};
export const VALUE_LADDER = ["Commodity", "Product", "Solution", "Platform", "Ecosystem"] as const;
export const VALUE_IMPACT = ["Incremental", "Sustaining", "Differentiating", "Transformational"] as const;
export const COMPETITIVE_POSITIONS = ["Leader", "Challenger", "Fast Follower", "Niche"] as const;
export interface ProjectMeta {
  initiative: StrategicInitiative; targetMarket: string; valueLadder: string;
  valueImpact: string; competitive: string;
}
export function metaOf(p: Project): ProjectMeta {
  const d = `${p.division} ${p.name} ${p.category}`.toLowerCase();
  const initiative: StrategicInitiative =
    (p.initiative && (STRATEGIC_INITIATIVES as readonly string[]).includes(p.initiative) ? (p.initiative as StrategicInitiative) : null) ??
    (/effect|counter|loiter|strike|munition/.test(d) ? "Autonomous Loitering Munitions"
      : /\bai\b|autonomy|swarm|teaming|mum-t|fusion|hivemind|targeting|c2|command|control/.test(d) ? "AI Targeting & Terminal Autonomy"
      : /sdk|marketplace|cloud|software|handheld|gcs|modern|bridge|eol|legacy/.test(d) ? "Mass-Producible Attritable Systems"
      : "Sovereign Deep-Strike & ISR");
  const valueLadder = /platform/.test(d) ? "Platform" : /sdk|marketplace|cloud/.test(d) ? "Ecosystem"
    : /sustain|phase|legacy|eol|bridge/.test(d) ? "Product" : "Solution";
  const valueImpact = p.confidence <= 2 && (p.tech === "high" || p.comm === "high") ? "Transformational"
    : /platform|next-gen|gen-5/.test(d) ? "Differentiating"
    : /sustain|phase|legacy|eol|bridge/.test(d) ? "Sustaining" : "Incremental";
  const competitive = p.confidence >= 4 ? "Leader" : p.confidence === 3 ? "Challenger"
    : incrementalRevM(p) > 200 ? "Fast Follower" : "Niche";
  return { initiative, targetMarket: customerOf(p), valueLadder, valueImpact, competitive };
}

// Master value proposition — the required one-liner every project must carry (falls back to a
// derived statement for legacy/seed projects so display never blanks). Per-segment value props
// are the recommended deepening (SegmentValueProp[]), served from p.segmentValueProps.
export function valuePropOf(p: Project): string {
  if (p.valueProp && p.valueProp.trim()) return p.valueProp.trim();
  const b = briefOf(p), m = metaOf(p);
  return `${p.name}: ${b.outcomes[0] ?? "field the capability"} via ${b.solution[0] ?? "our approach"} — ${m.valueLadder}-tier, ${m.competitive} vs ${nbaOf(p)} for ${m.targetMarket}.`;
}

// Next Best Alternative (NBA) — the current competitive alternative or As-Is solution the customer
// uses today (De-Risking NPD "versus Next Best Alternative"). Falls back to a derived As-Is phrase
// so display never blanks for legacy/seed projects.
export function nbaOf(p: Project): string {
  if (p.nextBestAlternative && p.nextBestAlternative.trim()) return p.nextBestAlternative.trim();
  const b = briefOf(p);
  return `the As-Is approach to ${b.needs[0] ?? `${p.name} capability`}`;
}

// AI rendition of the value proposition — minted at submission once the HI version is authored, so
// AI-generated ideas can improve quality via the HI⇄AI toggle. Deterministic + offline (no provider
// call): composes a best-in-class positioning statement (Geoffrey-Moore form) from the HUMAN master
// value prop, the NBA, and the derived signals — an alternative rendering that sparks improvement.
export function aiValuePropOf(p: Project): string {
  if (p.valuePropAI && p.valuePropAI.trim()) return p.valuePropAI.trim();
  const b = briefOf(p), m = metaOf(p);
  const target = p.segmentValueProps?.[0]?.segment?.trim() || m.targetMarket;
  const need = b.needs[0] ?? `${p.name} capability`;
  const benefit = b.outcomes[0] ?? "measurable outcomes";
  const how = b.solution[0] ?? "our approach";
  return `For ${target} who need ${need.charAt(0).toLowerCase() + need.slice(1)}, ${p.name} is a ${m.valueLadder}-tier ${p.category} that delivers ${benefit.charAt(0).toLowerCase() + benefit.slice(1)} through ${how.charAt(0).toLowerCase() + how.slice(1)}. Unlike ${nbaOf(p)}, it is ${m.competitive.toLowerCase()}-class — ${m.valueImpact.charAt(0).toLowerCase() + m.valueImpact.slice(1)}.`;
}

// ── Digital slide show (S1–S18) — the in-platform gate deck. Each slide carries an editable HUMAN (HI)
//    input the operator writes, plus a deterministic AI rendition (aiSlideOf) that drafts the slide from
//    the project's own model so gaps are never blank. Mirrors the HI⇄AI value-prop toggle. Pure + offline.
export interface SlideDef { slide: string; gate: Gate; name: string; summary: string; priority?: number }
export const SLIDES: SlideDef[] = GATES.flatMap((g) =>
  GATE_REVIEW[g].deliverables.map((d) => ({ slide: d.slide, gate: g, name: d.name, summary: d.summary, priority: d.priority })),
);
export const slideDef = (slideId: string): SlideDef | undefined => SLIDES.find((s) => s.slide === slideId);

/** What the HUMAN author should put on this slide — a short prompt so the HI input is never a blank box. */
export function slideHintOf(slideId: string): string {
  const d = slideDef(slideId);
  if (!d) return "Author this gate slide.";
  return `${d.name} — ${d.summary}. Add the human insight, evidence, and judgment for this slide.`;
}

/**
 * Deterministic AI draft of a gate slide, composed from the project's own model (brief, financials,
 * value equation, risk, exec). Offline — no provider call. Used to fill a slide the human hasn't written
 * yet ("in case there are potentially missing"), surfaced behind the per-slide HI⇄AI toggle.
 */
export function aiSlideOf(p: Project, slideId: string): string {
  const fm = financialMetrics(p), m = metaOf(p), b = briefOf(p), ex = execOf(p), ve = valueEquationOf(p);
  // Pin en-US so the draft is deterministic regardless of the viewer's locale (locked identical-inputs
  // guarantee — otherwise a persisted "use as draft" would vary by device locale).
  const usdM = (n: number) => `$${(Math.round(n * 10) / 10).toLocaleString("en-US")}M`;
  const kFmt = (n: number) => `$${(n / 1000).toFixed(1)}M`; // n is $K → $M (matches page.tsx k())
  const payb = (y: number) => (Number.isFinite(y) && y > 0 ? `${y} yr` : "no payback");
  const list = (xs: string[], n = 2) => xs.slice(0, n).join("; ");
  switch (slideId) {
    case "S1–S2":
      return `${p.name} (${p.category}, ${m.initiative}). ${valuePropOf(p)} Model: NPV ${usdM(fm.npvM)}, IRR ${fm.irrPct}%, payback ${payb(fm.paybackYears)} at ${GATE_STAGE[p.gate]} stage (confidence ${p.confidence}/5).`;
    case "S3":
      return `Return profile — NPV ${usdM(fm.npvM)} · IRR ${fm.irrPct}% · payback ${payb(fm.paybackYears)} · REV/NRE ${fm.revOverNre.toFixed(1)}×. NRE ${kFmt(p.nreK)} against 10-yr revenue ${usdM(p.fullRev10yM)}; risk-adjusted expected value ${usdM(expectedValueOf(p))}.`;
    case "S4":
      return `Customer CONOPS / mission needs — ${list(b.needs)}. Applications served: ${m.targetMarket}; program of record ${ex.customer}.`;
    case "S5":
      return `Customer problem — today they rely on ${nbaOf(p)}. Desired outcomes: ${list(b.outcomes)}. The gap is what this project closes.`;
    case "S6":
      return `Product summary — ${valuePropOf(p)} Primary segment: ${p.segmentValueProps?.[0]?.segment || m.targetMarket}. Value ladder ${m.valueLadder}; competitive position ${m.competitive}.`;
    case "S7":
      return `Customer workflow (by persona) — ${ex.customer} operators using ${list(b.solution)} to achieve ${b.outcomes[0] ?? "the mission outcome"}. PM ${ex.productMgr} · Eng ${ex.projectEng} · BD ${ex.bdLead}.`;
    case "S8":
      return `Competition + value vs NBA (${nbaOf(p)}) — competitive index ${Math.round(ve.competitiveIndex)}/100 (50 = parity), ${ve.wins} win / ${ve.losses} loss drivers, EVC ${usdM(ve.evcUsdM)} vs NBA baseline ${usdM(ve.referenceM)} (+${usdM(ve.differentiationM)} differentiation).`;
    case "S9":
      return `User stories — highlights: ${list(b.outcomes, 3)}. Each maps to a measurable outcome the ${m.targetMarket} buyer can verify.`;
    case "S10":
      return `Financials by year — 10-yr new-product revenue ${usdM(p.fullRev10yM)}; incremental ${usdM(incrementalRevM(p))}; probability-weighted ${usdM(weightedRevM(p))}; do-nothing baseline ${usdM(p.doNothing10yM)}. MSRP $${ex.msrpK}k · margin ${ex.marginPct}%.`;
    case "S11":
      return `Preliminary feedback + validation — ${list(b.evidence)}. Model confidence ${p.confidence}/5; validation plan closes the remaining assumptions before Plan gate.`;
    case "S12":
      return `Go-to-market — target market ${m.targetMarket} via ${ex.customer}; pursuits ${ex.pursuits.map((x) => x.name).join(", ")}. Strategy aligned to the ${m.initiative} roadmap.`;
    case "S13":
      return `Risk highlights — technical ${RISK_LABEL[p.tech]}, commercial ${RISK_LABEL[p.comm]} (+${Math.round(riskContingency(p) * 100)}% contingency). Kill-risk: ${killRiskOf(p)}.`;
    case "S14":
      return `Resourcing / functional alignment — ${fm.manHours.toLocaleString()} man-hours, capital ${kFmt(fm.capitalK)}, total R&D ${kFmt(fm.totalRdOpexK)}. Intelligence load: ${intelLoadGloss(p).gloss}.`;
    case "S15":
      return `BETA feedback / pre-launch VOCs — ${list(b.evidence)}. Confidence ${p.confidence}/5; pre-launch VOCs dispositioned into the launch plan.`;
    case "S16": {
      const w = winProbabilityOf(p);
      return `Market performance — say/do: win probability P50 ${Math.round(w.p50 * 100)}% (P10 ${Math.round(w.p10 * 100)}% / P90 ${Math.round(w.p90 * 100)}%); tracked revenue vs the ${usdM(p.fullRev10yM)} plan with Finance + BD.`;
    }
    case "S17":
      return `Post-launch development — VOC + priorities: ${list(b.outcomes, 3)}. ${p.predictions} open risk-market prediction(s) inform the next increment.`;
    case "S18":
      return `End-of-life strategy — org alignment: do-nothing baseline ${usdM(p.doNothing10yM)} erodes without action; controlled phase-out ≤ 3 yrs with spares + migration to the next-gen product.`;
    default:
      return slideHintOf(slideId);
  }
}

// ── Value signals (Bridge Slice 1) — pure, deterministic, offline. Each has a derived fallback from the
//    existing engine so seeds never blank. These feed the dog-tag metrics, budget popup, gates, and exec slide.

/** Derived customer importance (0–1) — BD's weight; falls back to reviewer confidence (1–5 → 0.2–1.0). */
export function custImportanceOf(p: Project): number {
  if (typeof p.custImportance === "number") return clamp01(p.custImportance);
  return clamp01(p.confidence / 5);
}
/** Derived relative performance vs the NBA (0–1) — engineering's score; falls back to competitive position. */
export function relPerformanceOf(p: Project): number {
  if (typeof p.relPerformance === "number") return clamp01(p.relPerformance);
  const c = metaOf(p).competitive; // Leader | Challenger | Fast Follower | Niche
  return c === "Leader" ? 0.85 : c === "Challenger" ? 0.65 : c === "Fast Follower" ? 0.45 : 0.55;
}
/** Thoth's value index ($M) = customer importance × relative performance × addressable (incremental) revenue. */
export function valueIndexOf(p: Project): number {
  return custImportanceOf(p) * relPerformanceOf(p) * incrementalRevM(p);
}
/** Value per R&D dollar — NPV ($) returned per $ of NRE. >1 means NPV exceeds the non-recurring spend. */
export function valuePerDollarOf(p: Project): number {
  return (npvM(p) * 1_000_000) / Math.max(1, p.nreK * 1000);
}
/** Commercial adoption / BD win probability band {p10,p50,p90} (0–1). p50 from winP50 or pSuccess×confidence. */
export function winProbabilityOf(p: Project): { p10: number; p50: number; p90: number } {
  const p50 = typeof p.winP50 === "number" ? clamp01(p.winP50)
    : clamp01(pSuccess(p) * (0.6 + 0.08 * p.confidence)); // confidence 1..5 → 0.68..1.0 multiplier
  const spread = 0.18 * (1 - p50 * 0.5); // wider band for lower-confidence forecasts
  return { p10: clamp01(p50 - spread), p50, p90: clamp01(p50 + spread) };
}
/** Kill-risk — the one assumption that sinks the project. Field or derived from the dominant risk driver. */
export function killRiskOf(p: Project): string {
  if (p.killRisk && p.killRisk.trim()) return p.killRisk.trim();
  const techWorse = riskNum(p.tech) >= riskNum(p.comm);
  const lvl = techWorse ? p.tech : p.comm;
  const dim = techWorse ? "the core technology matures on schedule" : "the commercial demand materializes at the modeled price";
  return `${RISK_LABEL[lvl]} risk that ${dim}`;
}
/** Risk band per lens — Technical · Commercial · Dependency (each "Low|Med|High"), for the dog-tag chip. */
export function riskBandOf(p: Project): { technical: string; commercial: string; dependency: string } {
  const band = (lvl: RiskLevel) => RISK_LABEL[lvl];
  return { technical: band(p.tech), commercial: band(p.comm), dependency: p.criticalPath ? "High" : "Low" };
}
/** Cost per served buyer-segment — dev cost ($) spread across the addressable needs-segments (min 1). */
export function costPerServedBuyerOf(p: Project, segments: number): number {
  return (p.nreK * 1000) / Math.max(1, segments);
}
/** Intelligence-Load (AI·SI·HI) plain-language gloss — dominant band → a business risk/funding read. */
export function intelLoadGloss(p: Project): { dominant: "AI" | "SI" | "HI"; gloss: string } {
  const entries: [("AI" | "SI" | "HI"), number][] = [["AI", p.ai], ["SI", p.si], ["HI", p.hi]];
  entries.sort((a, b) => b[1] - a[1]);
  const dominant = entries[0][0];
  const gloss = dominant === "AI"
    ? "AI-heavy — scale-margin story for BD; watch model/provider risk"
    : dominant === "SI"
    ? "SI-heavy — shared-intent/community pull; strong adoption signal"
    : "HI-heavy — scarce-specialist effort; talent + execution risk to fund";
  return { dominant, gloss };
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

// ── Value Equation (Bridge Slice 1B) — create the value prop by scoring each differentiator against the
//    competitive Next Best Alternative. Economic Value to Customer (EVC) vs the NBA. Pure + deterministic.

export type DriverVerdict = "win" | "parity" | "loss";
export interface ValueEquationRow { name: string; importance: number; deltaVsNba: number; weighted: number; verdict: DriverVerdict }
export interface ValueEquationResult {
  perDriver: ValueEquationRow[];
  competitiveIndex: number; // 0–100 · 50 = parity with the NBA · >50 = we out-perform (importance-weighted)
  evcUsdM: number;          // Economic Value to Customer ($M) = NBA reference + differentiation value
  referenceM: number;       // the value the NBA / As-Is already delivers (baseline)
  differentiationM: number; // Σ importance × (ourScore − nbaScore) × addressable revenue
  wins: number; losses: number;
}

/**
 * Solve the Value Equation for a set of drivers against an addressable revenue ($M).
 * EVC = reference (NBA baseline) + Σ importance × (ourScore − nbaScore) × addressableRevenue.
 * competitiveIndex = 50 + 50 × (importance-weighted mean of ourScore − nbaScore) → clamped 0–100.
 * Empty/degenerate input → parity (index 50, EVC = reference = addressable revenue). Never throws.
 */
export function valueEquation(drivers: ValueDriver[], addressableRevM: number): ValueEquationResult {
  const rev = Number.isFinite(addressableRevM) && addressableRevM > 0 ? addressableRevM : 0;
  const clean = (drivers ?? []).filter((d) => d && d.name != null);
  const referenceM = rev;
  if (clean.length === 0) {
    return { perDriver: [], competitiveIndex: 50, evcUsdM: referenceM, referenceM, differentiationM: 0, wins: 0, losses: 0 };
  }
  let wSum = 0, wDelta = 0, differentiationM = 0, wins = 0, losses = 0;
  const perDriver: ValueEquationRow[] = clean.map((d) => {
    const imp = clamp01(d.importance), ours = clamp01(d.ourScore), nba = clamp01(d.nbaScore);
    const deltaVsNba = ours - nba;
    const weighted = imp * deltaVsNba * rev; // $M this driver adds vs the NBA
    wSum += imp; wDelta += imp * deltaVsNba; differentiationM += weighted;
    const verdict: DriverVerdict = deltaVsNba > 0.1 ? "win" : deltaVsNba < -0.1 ? "loss" : "parity";
    if (verdict === "win") wins++; else if (verdict === "loss") losses++;
    return { name: d.name || "Driver", importance: imp, deltaVsNba, weighted, verdict };
  });
  const meanDelta = wSum > 0 ? wDelta / wSum : 0; // importance-weighted mean advantage vs NBA (−1..1)
  const competitiveIndex = Math.max(0, Math.min(100, 50 + 50 * meanDelta));
  return { perDriver, competitiveIndex, evcUsdM: referenceM + differentiationM, referenceM, differentiationM, wins, losses };
}

/**
 * Derived value drivers (Bridge · backfill) — every project gets a populated Value Equation vs its NBA even
 * before anyone hand-scores drivers, so the waterfall/index are never blank across all BUs and projects.
 * Built deterministically from the project's brief (solution lines) + confidence + competitive position.
 */
export function derivedDriversOf(p: Project): ValueDriver[] {
  const b = briefOf(p);
  const base = relPerformanceOf(p), imp0 = custImportanceOf(p);
  const names = (b.solution.length ? b.solution : [`${p.name} capability`]).slice(0, 3);
  return names.map((name, i) => ({
    name: name.length > 40 ? name.slice(0, 38) + "…" : name,
    importance: clamp01(imp0 + 0.05 - 0.08 * i),
    ourScore: clamp01(base + 0.08 - 0.06 * i),
    nbaScore: clamp01(base - (0.35 - 0.05 * i)),
  }));
}

/** Convenience: solve a project's Value Equation against its addressable (incremental) revenue. Falls back
 *  to derived drivers when none are hand-scored, so the equation is populated for every project. */
export function valueEquationOf(p: Project): ValueEquationResult {
  const drivers = p.valueDrivers && p.valueDrivers.length ? p.valueDrivers : derivedDriversOf(p);
  return valueEquation(drivers, incrementalRevM(p));
}

/**
 * Risk-adjusted expected value ($M) at a gate (Bridge Slice 4) = NPV × cumulative gate-pass probability.
 * `prob` is the board's confidence (0–1) that the project clears its remaining gates; falls back to the
 * modeled pSuccess when not supplied. Deterministic; clamps prob to [0,1].
 */
export function expectedValueOf(p: Project, prob?: number): number {
  const pr = typeof prob === "number" ? clamp01(prob) : pSuccess(p);
  return npvM(p) * pr;
}

/**
 * Handoff-readiness (Slice 4 · Enlil) — a project is handoff-ready when it carries the artifacts a
 * business/BD reader needs: a value proposition, at least one needs-segment, and a measurable delta
 * (value drivers scored OR a positive NPV). Returns the flags + a boolean so the badge is explainable.
 */
export function handoffReadiness(p: Project): { valueProp: boolean; segment: boolean; delta: boolean; ready: boolean } {
  const valueProp = !!(p.valueProp && p.valueProp.trim());
  const segment = (p.segmentValueProps?.length ?? 0) > 0;
  const delta = (p.valueDrivers?.length ?? 0) > 0 || npvM(p) > 0;
  return { valueProp, segment, delta, ready: valueProp && segment && delta };
}

/**
 * Consistency check (Slice 8 · Aset) — flags where a project's spine has diverged/gaps so the badge is
 * actionable. Pure; returns the list of issues + an ok flag (empty issues = consistent).
 */
export function consistencyCheck(p: Project): { issues: string[]; ok: boolean } {
  const issues: string[] = [];
  if (!(p.valueProp && p.valueProp.trim())) issues.push("Missing master value proposition");
  if (!(p.nextBestAlternative && p.nextBestAlternative.trim())) issues.push("Missing Next Best Alternative");
  if ((p.valueDrivers?.length ?? 0) === 0) issues.push("No Value-Equation drivers vs the NBA");
  if ((p.segmentValueProps?.length ?? 0) === 0) issues.push("No per-needs-segment value props");
  const eq = valueEquationOf(p);
  if (eq.losses > eq.wins) issues.push("Loses to the NBA on more drivers than it wins");
  return { issues, ok: issues.length === 0 };
}

/**
 * Compose a best-in-class master value proposition from the Value Equation — the winning drivers vs the NBA.
 * "For <target>, <name> beats <NBA> on <top win drivers> — <EVC>-tier economic value." Falls back to the
 * derived aiValuePropOf when no driver wins, so it never returns an empty string.
 */
export function valuePropFromEquation(p: Project): string {
  const eq = valueEquationOf(p);
  const winners = eq.perDriver.filter((d) => d.verdict === "win").sort((a, b) => b.weighted - a.weighted).slice(0, 3).map((d) => d.name);
  if (winners.length === 0) return aiValuePropOf(p);
  const m = metaOf(p);
  const list = winners.length === 1 ? winners[0] : winners.slice(0, -1).join(", ") + " and " + winners[winners.length - 1];
  return `For ${m.targetMarket}, ${p.name} beats ${nbaOf(p)} on ${list} — ~$${eq.evcUsdM.toFixed(0)}M economic value to the customer (${Math.round(eq.competitiveIndex)}/100 vs the next-best alternative).`;
}

// Executive-slide two-bullet Project Summary (AMTS overview one-pager parity — IMG_7825/7826).
// Exactly TWO bullets derived from the live model: (1) what the project IS, (2) the dated
// business case. Pure + deterministic so the executive slide never hand-enters prose.
const execUsd = (m: number) => `$${m.toFixed(1)}M`;
export function execSummaryBullets(p: Project): [string, string] {
  const m = metaOf(p);
  const brief = briefOf(p);
  const solution = brief.solution[0] ?? `develop ${p.name}`;
  const captured = Math.round(pSuccess(p) * 100);
  const what = `${p.name} is a ${m.valueLadder}-tier ${p.category} in ${p.division}, on the ${m.initiative} pillar — ${solution}.`;
  const caseLine = `By ${p.firstRevenue} it targets ${execUsd(incrementalRevM(p))} incremental 10-yr revenue (${captured}% probability-weighted = ${execUsd(weightedRevM(p))}), ${execUsd(npvM(p))} NPV at ${irrPct(p)}% IRR — now at ${GATE_STAGE[p.gate]} (${p.gate}).`;
  return [what, caseLine];
}

// ── PROJECT METRICS card set (FLIR deck §2.4 / IMG_7843 "Project Metrics") — 12 metrics ────
// NPV · REV/NRE · IRR · Gross Margin · Payback · 10-Yr Vol · 10-Yr Rev · 10-Yr Gross Profit ·
// Current-Year Op Expense · Total R&D Op Expense · Capital · Man-Hours Estimate. Each derived
// deterministically from the project so the card set is complete without new stored inputs.
const BLENDED_LABOR_RATE_USD = 150;          // $/hr blended engineering rate (man-hour basis)
export const RD_LABOR_FRAC = 0.55, RD_CAPITAL_FRAC = 0.15, RD_CURYEAR_FRAC = 0.35;
export interface FinMetrics {
  npvM: number; revOverNre: number; irrPct: number; grossMarginPct: number; paybackYears: number;
  vol10y: number; rev10yM: number; grossProfit10yM: number;
  curYearOpexK: number; totalRdOpexK: number; capitalK: number; manHours: number;
}
export function financialMetrics(p: Project): FinMetrics {
  const marginPct = execOf(p).marginPct;
  const rev10yM = p.fullRev10yM;
  const grossProfit10yM = rev10yM * (marginPct / 100);
  const annualMarginM = weightedRevM(p) * (marginPct / 100) / 10;    // weighted annual margin
  // Never-pays-back sentinel: when the weighted annual margin is ≤0 the project does not recover its
  // NRE — return Infinity (rendered "—") rather than a misleading "0 yr" that reads as the best payback.
  const paybackYears = annualMarginM > 0 ? +((p.nreK / 1000) / annualMarginM).toFixed(1) : Infinity;
  const vol10y = Math.round((rev10yM * 1000) / Math.max(1, execOf(p).msrpK)); // units = rev / MSRP
  return {
    npvM: +npvM(p).toFixed(1), revOverNre: +revOverNre(p).toFixed(1), irrPct: irrPct(p),
    grossMarginPct: marginPct, paybackYears, vol10y, rev10yM, grossProfit10yM: +grossProfit10yM.toFixed(1),
    curYearOpexK: Math.round(p.nreK * RD_CURYEAR_FRAC), totalRdOpexK: p.nreK,
    capitalK: Math.round(p.nreK * RD_CAPITAL_FRAC),
    manHours: Math.round((p.nreK * 1000 * RD_LABOR_FRAC) / BLENDED_LABOR_RATE_USD),
  };
}

// ── PROJECT FINANCIALS OVERVIEW (FLIR deck §2.3) — yearly Revenue / Margin / R&D expense ────
// The "Project Financials Overview" output grid: per-year revenue (old decline + new ramp),
// gross margin $, and R&D expense (NRE front-loaded over the program), plus a Totals column.
export interface FinOverviewRow { year: number; revM: number; marginM: number; rdK: number }
export function financialsOverview(p: Project, opts: { years?: number; funded?: boolean } = {}): FinOverviewRow[] {
  const years = opts.years ?? 10, funded = opts.funded ?? true;
  const marginPct = execOf(p).marginPct / 100;
  const series = projectRevSeries(p, { years, funded });
  // R&D spend front-loaded over the first ~3 years (NRE burns before revenue matures).
  const rdYears = Math.min(3, years);
  return series.map((r, i) => ({
    year: r.year, revM: +r.total.toFixed(1), marginM: +(r.total * marginPct).toFixed(1),
    rdK: i < rdYears ? Math.round(p.nreK / rdYears) : 0,
  }));
}

// ── DEPENDENCIES (FLIR deck §4) — directed edges + summary + constellation helpers ─────────
// Edge A → B means "B's risk affects A's success" (assigned-by-manager). Both origins retained:
// dependsOn (I declared) and dependentsOf (declared on me). Risk types propagate.
export type DepRisk = "technical" | "commercial" | "schedule";
export interface DepEdge { from: string; to: string; risks: DepRisk[]; critical: boolean; acknowledged: boolean }
export const DEMO_DEPS: DepEdge[] = [
  { from: "PRJ-01", to: "PRJ-09", risks: ["technical"], critical: true, acknowledged: true },   // SAR payload ← EO/IR core
  { from: "PRJ-02", to: "PRJ-05", risks: ["technical", "schedule"], critical: true, acknowledged: true },  // swarm AI ← C2 cloud
  { from: "PRJ-02", to: "PRJ-10", risks: ["commercial"], critical: false, acknowledged: false },
  { from: "PRJ-04", to: "PRJ-02", risks: ["technical"], critical: true, acknowledged: true },   // effector ← swarm fusion
  { from: "PRJ-05", to: "PRJ-08", risks: ["schedule"], critical: false, acknowledged: true },   // C2 cloud ← GCS
  { from: "PRJ-07", to: "PRJ-18", risks: ["schedule", "commercial"], critical: true, acknowledged: false }, // space SAR ← ground segment
  { from: "PRJ-14", to: "PRJ-02", risks: ["technical"], critical: true, acknowledged: true },   // MUM-T ← swarm fusion
  { from: "PRJ-14", to: "PRJ-05", risks: ["schedule"], critical: false, acknowledged: false },
  { from: "PRJ-12", to: "PRJ-05", risks: ["technical", "schedule"], critical: true, acknowledged: false }, // datalink ← C2 cloud
  { from: "PRJ-16", to: "PRJ-01", risks: ["technical"], critical: false, acknowledged: true },  // SAR variant ← SAR Gen-5
  { from: "PRJ-15", to: "PRJ-07", risks: ["technical", "commercial"], critical: false, acknowledged: false }, // self-replicating ← space SAR
];
export const dependsOn = (deps: DepEdge[], id: string) => deps.filter((e) => e.from === id);      // I declared
export const dependentsOf = (deps: DepEdge[], id: string) => deps.filter((e) => e.to === id);      // declared on me
// Dependency summary row (§4.2): NPV, above/below line, NPV incl. dependencies, dep counts.
export interface DepSummaryRow { id: string; name: string; division: string; npvM: number; deps: number; dependents: number; npvWithDepsM: number; critical: boolean }
export function dependencySummary(projects: Project[], deps: DepEdge[]): DepSummaryRow[] {
  return projects.map((p) => {
    const mine = dependsOn(deps, p.id);
    const on = dependentsOf(deps, p.id);
    // NPV-with-dependencies rolls the NPV of everything this project leans on into its own.
    const depNpv = mine.reduce((s, e) => s + (npvM(projects.find((q) => q.id === e.to) ?? p)), 0);
    return {
      id: p.id, name: p.name, division: p.division, npvM: +npvM(p).toFixed(1),
      deps: mine.length, dependents: on.length, npvWithDepsM: +(npvM(p) + depNpv).toFixed(1),
      critical: mine.some((e) => e.critical) || on.some((e) => e.critical),
    };
  }).sort((a, b) => b.npvWithDepsM - a.npvWithDepsM);
}

// ── GATE REQUIREMENTS REGISTRY (SPEC §3) — the governance-facing second surface ───────────
// One unified registry of what is required at each gate, folding three sources into a single
// grammar (§3.1): (1) the S1–S18 review deliverables (derived from GATE_REVIEW, no duplication),
// (2) the Rack & Stack financial/meta rows that must be gated (§3.3), and (3) the CRS /
// DR / TR / IS / DT / DC traceability items. Pure + deterministic; per-project status is
// derived from gate progression so the matrix renders without persistence (edits ride the
// in-session activity log, matching the rest of the module).
export type ReqType = "S" | "REQ" | "DR" | "TR" | "IS" | "DT" | "DC";
export const REQ_TYPE_LABEL: Record<ReqType, string> = {
  S: "Review slide", REQ: "Requirement", DR: "Design req", TR: "Test req", IS: "Interface spec", DT: "Design test", DC: "Design constraint",
};
export type ReqStatus = "not_started" | "in_work" | "submitted" | "approved" | "waived" | "na";
export const REQ_STATUS_LABEL: Record<ReqStatus, string> = {
  not_started: "Not Started", in_work: "In Work", submitted: "Submitted", approved: "Approved", waived: "Waived", na: "N/A",
};
// A status counts as satisfying a gate when it no longer blocks (approved / waived / N/A).
export const REQ_SATISFIED: ReqStatus[] = ["approved", "waived", "na"];

export interface GateRequirement {
  id: string;             // stable ID in the source grammar (e.g. "S3", "REQ-49", "DR-07")
  parentId?: string;      // parent CRS-## for CRS children / derivatives
  type: ReqType;
  title: string;
  earliestGate: Gate;     // gate by which it must first be satisfied (then re-verified onward)
  band: number;           // estimate-tolerance band applicable at the earliest gate (§3.4)
  verification: string;   // verification method
}

// Estimate tolerance ladder (§3.4, ±60/40/20/10/5%) — tightens gate over gate. Distinct from
// GATE_BAND (which the time engine widens by project risk); this is the governance-view ladder.
export const TOLERANCE_LADDER: Record<Gate, number> = { G1: 0.6, G2: 0.4, G3: 0.2, G4: 0.1, G5: 0.05, G6: 0.05, G7: 0.05 };

// (1) S1–S18 review deliverables, one requirement per slide, at the gate that owns it.
const S_REQUIREMENTS: GateRequirement[] = GATES.flatMap((g) =>
  GATE_REVIEW[g].deliverables.map((d) => ({
    id: d.slide, type: "S" as ReqType, title: `${d.name} — ${d.summary}`,
    earliestGate: g, band: TOLERANCE_LADDER[g], verification: "PRB review of slide",
  })),
);

// (2) Rack & Stack gated requirement rows (§3.3) — the financial model + meta are governed
// objects, not free-form fields. Each anchors to the CRS that owns the underlying datum.
const RS_REQUIREMENTS: GateRequirement[] = [
  { id: "REQ-47", parentId: "REQ-47", type: "REQ", title: "Step 1a NRE cost model complete", earliestGate: "G1", band: TOLERANCE_LADDER.G1, verification: "Finance review vs. Project #" },
  { id: "REQ-49", parentId: "REQ-49", type: "REQ", title: "Step 1b New Product projections complete", earliestGate: "G1", band: TOLERANCE_LADDER.G1, verification: "Units/MSRP/discount/COGS present" },
  { id: "REQ-50", parentId: "REQ-50", type: "REQ", title: "Step 2 Do-Nothing scenario entered", earliestGate: "G2", band: TOLERANCE_LADDER.G2, verification: "Required before funding decision" },
  { id: "REQ-51", parentId: "REQ-50", type: "REQ", title: "Step 3 EOL / Phase-Out plan entered", earliestGate: "G2", band: TOLERANCE_LADDER.G2, verification: "Phase-out ≤ 3 yrs, terminal-zero check" },
  { id: "REQ-52", parentId: "REQ-52", type: "REQ", title: "Incremental Revenue reconciled with Finance", earliestGate: "G2", band: TOLERANCE_LADDER.G2, verification: "Finance reviewer sign-off" },
  { id: "REQ-38", parentId: "REQ-38", type: "REQ", title: "Model Confidence Level assigned (1–5)", earliestGate: "G2", band: TOLERANCE_LADDER.G2, verification: "Named reviewers required" },
  { id: "REQ-53", parentId: "REQ-53", type: "REQ", title: "Technical + Commercial risk rated", earliestGate: "G1", band: TOLERANCE_LADDER.G1, verification: "Drives probability weighting" },
  { id: "REQ-54", parentId: "REQ-54", type: "REQ", title: "Strategic Initiative assigned (or None + rationale)", earliestGate: "G1", band: TOLERANCE_LADDER.G1, verification: "Single-select from initiative list" },
  { id: "REQ-55", parentId: "REQ-55", type: "REQ", title: "Value Ladder position + impact", earliestGate: "G1", band: TOLERANCE_LADDER.G1, verification: "PRB review" },
  { id: "REQ-89", parentId: "REQ-89", type: "REQ", title: "Dependencies declared (assigned by manager)", earliestGate: "G2", band: TOLERANCE_LADDER.G2, verification: "Manager declaration" },
  { id: "REQ-90", parentId: "REQ-89", type: "REQ", title: "Dependencies acknowledged (assigned by others)", earliestGate: "G3", band: TOLERANCE_LADDER.G3, verification: "Receiving PM acknowledgement" },
  { id: "REQ-71", parentId: "REQ-71", type: "REQ", title: "Project # / WBS elements created", earliestGate: "G3", band: TOLERANCE_LADDER.G3, verification: "Enables actuals tracking" },
  { id: "REQ-42", parentId: "REQ-42", type: "REQ", title: "Above/Below-line stack position ratified", earliestGate: "G3", band: TOLERANCE_LADDER.G3, verification: "PRB / quarter-close snapshot" },
  { id: "REQ-69", parentId: "REQ-69", type: "REQ", title: "Growth Model contribution validated", earliestGate: "G3", band: TOLERANCE_LADDER.G3, verification: "NPI bar reconciles to Division target" },
  { id: "REQ-56", parentId: "REQ-56", type: "REQ", title: "Business Case artifacts (AMTS) set", earliestGate: "G1", band: TOLERANCE_LADDER.G1, verification: "TAM/SAM/Target + model present" },
  { id: "REQ-48", parentId: "REQ-47", type: "REQ", title: "Capital & Tooling aligned to capital submission", earliestGate: "G3", band: TOLERANCE_LADDER.G3, verification: "Capital submission cross-check" },
];

// (3) Traceability derivatives (§3.2) — DR/TR/IS/DT/DC linked up to a CRS, down to evidence.
const TRACE_REQUIREMENTS: GateRequirement[] = [
  { id: "DR-01", parentId: "REQ-47", type: "DR", title: "Design requirement: SWaP envelope defined", earliestGate: "G2", band: TOLERANCE_LADDER.G2, verification: "Design review" },
  { id: "IS-01", parentId: "REQ-89", type: "IS", title: "Interface spec: GCS / datalink ICD baselined", earliestGate: "G3", band: TOLERANCE_LADDER.G3, verification: "ICD sign-off" },
  { id: "DC-01", parentId: "REQ-53", type: "DC", title: "Design constraint: MIL-STD environmental limits", earliestGate: "G3", band: TOLERANCE_LADDER.G3, verification: "Constraint trace" },
  { id: "TR-01", parentId: "REQ-56", type: "TR", title: "Test requirement: qualification test plan approved", earliestGate: "G4", band: TOLERANCE_LADDER.G4, verification: "Test readiness review" },
  { id: "DT-01", parentId: "REQ-56", type: "DT", title: "Design test: BETA/VOC field trial executed", earliestGate: "G4", band: TOLERANCE_LADDER.G4, verification: "Field-trial records" },
];

// The unified registry (§3.1). Order: review slides, then R&S gated rows, then traceability.
export const GATE_REQUIREMENTS: GateRequirement[] = [...S_REQUIREMENTS, ...RS_REQUIREMENTS, ...TRACE_REQUIREMENTS];

// Requirements that must be satisfied by a given gate (earliest ≤ gate) — the matrix column.
export const requirementsAt = (gate: Gate): GateRequirement[] =>
  GATE_REQUIREMENTS.filter((r) => GATES.indexOf(r.earliestGate) <= GATES.indexOf(gate));

// Per-project requirement status, derived from gate progression (§2.5 stage is derived, never
// user-set): a requirement whose earliest gate is completed reads Approved; the next gate's are
// In Work; anything further out is Not Started. A real deploy overlays persisted approvals.
export function requirementStatus(req: GateRequirement, p: Project): ReqStatus {
  const done = GATES.indexOf(p.gate);             // last completed gate
  const need = GATES.indexOf(req.earliestGate);
  if (need <= done) return "approved";
  if (need === done + 1) return "in_work";
  return "not_started";
}

// Gate readiness rollup (§3.5): % satisfied, blocking list, single Ready/Not-Ready verdict.
export interface GateReadiness { gate: Gate; stage: string; required: number; satisfied: number; pct: number; blocking: string[]; ready: boolean }
export function gateReadiness(p: Project, gate: Gate): GateReadiness {
  const reqs = requirementsAt(gate);
  const graded = reqs.map((r) => ({ id: r.id, s: requirementStatus(r, p) }));
  const satisfied = graded.filter((g) => REQ_SATISFIED.includes(g.s)).length;
  const blocking = graded.filter((g) => !REQ_SATISFIED.includes(g.s)).map((g) => g.id);
  return {
    gate, stage: GATE_STAGE[gate], required: reqs.length, satisfied,
    pct: reqs.length ? Math.round((satisfied / reqs.length) * 100) : 100,
    blocking, ready: blocking.length === 0,
  };
}
export const gateReadinessAll = (p: Project): GateReadiness[] => GATES.map((g) => gateReadiness(p, g));

// Estimate-tolerance variance disposition (§3.4): a gate-to-gate move beyond the band raises a
// variance exception requiring PRB disposition — it is not silently accepted.
export interface Variance { prior: number; current: number; deltaPct: number; band: number; exceeds: boolean }
export function gateVariance(prior: number, current: number, gate: Gate): Variance {
  const band = TOLERANCE_LADDER[gate];
  const deltaPct = prior !== 0 ? (current - prior) / Math.abs(prior) : (current === 0 ? 0 : 1);
  return { prior, current, deltaPct, band, exceeds: Math.abs(deltaPct) > band };
}
