/**
 * Architect-2525 · Decisions → Tighter Estimates engine (MASTER_SPEC · Sprint 4).
 * =============================================================================
 * The core intelligence of Architect-2525: as the homeowner makes decisions and the project passes
 * building gates, the man-hour AND cost estimate get TIGHTER — the confidence rises and the ± band
 * narrows (a cone of uncertainty). Grounded in the AACE International estimate classes: accuracy tightens
 * as project DEFINITION matures 0→100% — Class 5 (concept, wide) → Class 1 (firm bid, ±~7%).
 *
 * Model (operator-locked): a SINGLE moving-average estimate per work section + a confidence % that rises
 * with gate progress. Pure + deterministic (mirrors architect-economy.ts) → replayable, 2525-core candidate.
 */

export type AaceClass = 5 | 4 | 3 | 2 | 1;

// AACE class → typical ± accuracy band + a nominal confidence + a plain label.
export const AACE: Record<AaceClass, { band: number; conf: number; label: string }> = {
  5: { band: 0.55, conf: 30, label: "Concept" },
  4: { band: 0.35, conf: 50, label: "Study" },
  3: { band: 0.20, conf: 70, label: "Budget" },
  2: { band: 0.12, conf: 85, label: "Control" },
  1: { band: 0.07, conf: 95, label: "Firm bid" },
};

// The house-building gate ladder (reuses the QualifyPanel G0–G13 naming). Passing a gate matures definition.
export const GATES = [
  "G0 Vision", "G1 Requirements", "G2 Site", "G3 Concept", "G4 Structural", "G5 Cost", "G6 Permit",
  "G7 Build-Ready", "G8 Construct", "G9 Inspect", "G10 Occupy", "G11 Maintain", "G12 Renovate", "G13 Replay",
];
export const LAST_GATE = GATES.length - 1; // 13

const clampGate = (g: number) => Math.max(0, Math.min(LAST_GATE, Math.round(g)));

/** AACE class for a gate index (label tier). Early gates = Class 5; build-ready+ = Class 1. */
export function classForGate(gateIdx: number): AaceClass {
  const g = clampGate(gateIdx);
  if (g <= 2) return 5;
  if (g <= 5) return 4;
  if (g <= 8) return 3;
  if (g <= 11) return 2;
  return 1;
}

/** Confidence % rises smoothly 30→95 as gates advance (the "tighter" signal the operator asked for). */
export function confidenceForGate(gateIdx: number): number {
  const t = clampGate(gateIdx) / LAST_GATE;
  return Math.round(30 + 65 * t);
}

/** ± band fraction narrows smoothly 0.55→0.07 as gates advance (the cone of uncertainty). */
export function bandPctForGate(gateIdx: number): number {
  const t = clampGate(gateIdx) / LAST_GATE;
  return Math.round((0.55 - (0.55 - 0.07) * t) * 1000) / 1000;
}

/** Estimate ± band (lo/hi) for a moving-average estimate at a given gate. */
export function bandFor(estimate: number, gateIdx: number): { lo: number; hi: number; pct: number } {
  const p = bandPctForGate(gateIdx);
  return { lo: Math.round(estimate * (1 - p)), hi: Math.round(estimate * (1 + p)), pct: p };
}

export type Rag = "green" | "amber" | "red";
export interface WorkSection {
  id: string; name: string; trade: string;
  manHours: number;   // single moving-average estimate
  costUsd: number;    // single moving-average estimate
  rag: Rag;           // gate-review status (Status / Risk / Next-Steps)
}

// A representative custom-home work breakdown (foundation → finish).
export const DEFAULT_SECTIONS: WorkSection[] = [
  { id: "site", name: "Site Work", trade: "Excavation", manHours: 320, costUsd: 42000, rag: "green" },
  { id: "found", name: "Foundation", trade: "Concrete", manHours: 480, costUsd: 61000, rag: "green" },
  { id: "frame", name: "Framing", trade: "Carpentry", manHours: 920, costUsd: 88000, rag: "amber" },
  { id: "roof", name: "Roofing", trade: "Roofing", manHours: 260, costUsd: 31000, rag: "green" },
  { id: "plumb", name: "Plumbing", trade: "Plumbing", manHours: 340, costUsd: 38000, rag: "green" },
  { id: "elec", name: "Electrical", trade: "Electrical", manHours: 300, costUsd: 34000, rag: "amber" },
  { id: "hvac", name: "HVAC", trade: "Mechanical", manHours: 240, costUsd: 29000, rag: "green" },
  { id: "drywall", name: "Drywall", trade: "Finish", manHours: 380, costUsd: 26000, rag: "green" },
  { id: "finish", name: "Interior Finish", trade: "Finish", manHours: 640, costUsd: 72000, rag: "green" },
  { id: "land", name: "Landscaping", trade: "Site", manHours: 180, costUsd: 19000, rag: "green" },
];

export interface ProjectRollup {
  manHours: number; costUsd: number;
  aaceClass: AaceClass; aaceLabel: string;
  confidencePct: number;
  costBand: { lo: number; hi: number; pct: number };
  hoursBand: { lo: number; hi: number; pct: number };
}

/** Roll the work sections up to a project total at the current gate — totals + tightening band + confidence. */
export function rollupProject(sections: WorkSection[], gateIdx: number): ProjectRollup {
  const manHours = sections.reduce((s, w) => s + w.manHours, 0);
  const costUsd = sections.reduce((s, w) => s + w.costUsd, 0);
  const cls = classForGate(gateIdx);
  return {
    manHours, costUsd,
    aaceClass: cls, aaceLabel: AACE[cls].label,
    confidencePct: confidenceForGate(gateIdx),
    costBand: bandFor(costUsd, gateIdx),
    hoursBand: bandFor(manHours, gateIdx),
  };
}

/** Advance to the next gate (decision made → estimate tightens). Pure — returns the new gate index. */
export function advanceGate(gateIdx: number): number { return clampGate(gateIdx + 1); }
export function retreatGate(gateIdx: number): number { return clampGate(gateIdx - 1); }

// Human Authority Checkpoint per gate — who must decide before the project advances (operator "final addition #2").
export interface Checkpoint { decision: string; authority: string; evidence: string; }
export const CHECKPOINTS: Record<number, Checkpoint> = {
  0: { decision: "Vision approved", authority: "Homeowner", evidence: "Brief · budget · site" },
  3: { decision: "Concept design approved", authority: "Architect", evidence: "Plans · massing · SUN·SKY" },
  4: { decision: "Structural design approved", authority: "Licensed Structural Engineer", evidence: "Calcs · simulation · drawings" },
  5: { decision: "Budget authorized", authority: "Lender / Homeowner", evidence: "Class-3 estimate · financing" },
  6: { decision: "Permit issued", authority: "Government (AHJ)", evidence: "Code review · stamped set" },
  7: { decision: "Build-ready released", authority: "Architect + Contractor", evidence: "CDs · procurement · schedule" },
  9: { decision: "Inspection passed", authority: "Inspector", evidence: "Field inspection · punch list" },
  10: { decision: "Occupancy granted", authority: "Government (AHJ)", evidence: "Final inspection · CO" },
};
export function checkpointForGate(gateIdx: number): Checkpoint {
  const g = clampGate(gateIdx);
  for (let i = g; i >= 0; i--) if (CHECKPOINTS[i]) return CHECKPOINTS[i];
  return CHECKPOINTS[0];
}
