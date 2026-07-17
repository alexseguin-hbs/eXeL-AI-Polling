/**
 * ARCHITECT-2525 · Project rollup & qualification (Vision 2525 · Increment 6)
 * ==========================================================================
 * Rolls the user's ACTUAL chosen components (the house build spec) up to a PROJECT total at the current gate,
 * REUSING the estimate engine (`architect-estimate.ts` — classForGate / confidenceForGate / bandFor / GATES) and
 * the real per-phase aggregation (`architect-house.ts` — houseEstimate). No parallel engine, no hardcoded gate.
 *
 * Two Vision-2525 corrections land here (plan addenda #3 + #7):
 *  • Gates are referenced by a `GateReference{frameworkId,gateId,sequence,status}` — NOT a literal "G8". The
 *    framework is named (architect G0–G13) so Manta/Drone/Security can carry their own ladders on the same shape.
 *  • SSSES readiness is a SCORE + status + confidence + evidence ids, not just a label — so a project's readiness
 *    is measurable and auditable, and tightens as definition (gate) matures.
 *
 * Pure + deterministic (mirrors the reused engines) → replayable, 2525-core candidate.
 */
import { houseEstimate } from "./architect-house";
import { AACE, GATES, LAST_GATE, classForGate, confidenceForGate, bandFor, type AaceClass } from "./architect-estimate";

// A gate reference that does not hardcode a specific gate — the framework is named and the gate is addressed by
// id + sequence. `status` is where the project sits relative to this gate on the ladder.
export type GateStatus = "not_started" | "in_progress" | "passed";
export interface GateReference {
  frameworkId: string;   // e.g. "architect/g0-g13"
  gateId: string;        // e.g. "g4-structural" (slug of the gate label)
  sequence: number;      // 0..LAST_GATE — ordinal position, so no literal "G8" anywhere downstream
  status: GateStatus;
}

const FRAMEWORK_ID = "architect/g0-g13";
const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ── Global building parameters (Vision 2525 · S5) — whole-project inputs that LIVE-RECALCULATE the rollup.
// A homeowner's floor area, story count, and finish tier scale the project estimate independently of which
// individual components are chosen. Pure + deterministic → the rollup stays replayable.
export type FinishTier = "standard" | "premium" | "luxury";
export interface GlobalParams { areaSqft: number; stories: number; finish: FinishTier; }
export const DEFAULT_PARAMS: GlobalParams = { areaSqft: 2000, stories: 1, finish: "standard" };
const BASELINE_SQFT = 2000;
const FINISH_FACTOR: Record<FinishTier, number> = { standard: 1, premium: 1.25, luxury: 1.6 };
const clampNum = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));

/** Deterministic scale multiplier from the global params (area × stories economy-of-scale × finish tier). */
export function paramScale(p: GlobalParams = DEFAULT_PARAMS): number {
  const area = clampNum(p.areaSqft, 200, 100000) / BASELINE_SQFT;
  // Each extra story adds ~85% of a floor's cost (shared foundation/roof → mild economy of scale).
  const stories = 1 + 0.85 * (clampNum(p.stories, 1, 60) - 1);
  const finish = FINISH_FACTOR[p.finish] ?? 1;
  return Math.round(area * stories * finish * 1000) / 1000;
}

/** Build a GateReference for a gate index within the Architect G0–G13 framework (status vs the current gate). */
export function gateRef(seq: number, currentGate: number = seq): GateReference {
  const s = Math.max(0, Math.min(LAST_GATE, Math.round(seq)));
  const status: GateStatus = currentGate > s ? "passed" : currentGate === s ? "in_progress" : "not_started";
  return { frameworkId: FRAMEWORK_ID, gateId: slug(GATES[s]), sequence: s, status };
}

// SSSES readiness as a measurable score, not a label (plan addendum #7). Kept at the project level for Inc 6;
// per-pillar breakdown can extend `evidenceIds`/add pillars later without changing this shape.
export type SssesStatus = "not_assessed" | "in_progress" | "passed" | "warning" | "blocked";
export interface SssesReadiness {
  score: number;          // 0..100 — blends definition maturity (gate) with spec completeness
  status: SssesStatus;
  confidencePct: number;  // reused estimate confidence at this gate
  evidenceIds: string[];  // auditable pointers (gate id, spec size) — grows as real evidence is attached
}

export interface ProjectRollup {
  count: number;          // buildable components chosen
  costUsd: number;        // real house-spec cost
  aaceClass: AaceClass;
  aaceLabel: string;
  confidencePct: number;
  costBand: { lo: number; hi: number; pct: number };
  gate: GateReference;    // the current gate, referenced (never a literal G8)
  ssses: SssesReadiness;
  bySystem: { phase: string; label: string; color: string; count: number; cost: number }[];
  scale: number;          // the global-params multiplier applied to cost (1 = baseline)
}

/** Roll the REAL house spec up to a project total at the current gate — totals · tightening band · SSSES readiness.
 *  Optional global params scale the whole-project cost live (area · stories · finish tier). */
export function projectRollup(specIds: string[], gateIdx: number, params?: GlobalParams): ProjectRollup {
  const est = houseEstimate(specIds);
  const g = Math.max(0, Math.min(LAST_GATE, Math.round(gateIdx)));
  const cls = classForGate(g);
  const confidencePct = confidenceForGate(g);
  const scale = paramScale(params ?? DEFAULT_PARAMS);
  const costUsd = Math.round(est.cost * scale);
  // Definition maturity (gate) blended with spec completeness (some components chosen) → an SSSES readiness score.
  const definition = g / LAST_GATE;                 // 0..1
  const completeness = est.count > 0 ? Math.min(1, est.count / 12) : 0; // 12 physical systems ≈ a full twin
  const score = Math.round(100 * (0.7 * definition + 0.3 * completeness));
  const status: SssesStatus = est.count === 0 ? "not_assessed" : score >= 80 ? "passed" : score >= 50 ? "in_progress" : "warning";
  return {
    count: est.count,
    costUsd,
    aaceClass: cls,
    aaceLabel: AACE[cls].label,
    confidencePct,
    costBand: bandFor(costUsd, g),
    gate: gateRef(g, g),
    ssses: { score, status, confidencePct, evidenceIds: [`gate:${slug(GATES[g])}`, `spec:${est.count}`, `scale:${scale}`] },
    bySystem: est.byPhase.map((p) => ({ phase: p.phase, label: p.label, color: p.color, count: p.count, cost: Math.round(p.cost * scale) })),
    scale,
  };
}
