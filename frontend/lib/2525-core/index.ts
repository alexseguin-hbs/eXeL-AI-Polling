/**
 * 2525-CORE — shared, domain-neutral Vision-2525 engines (Sprint 7 preparation).
 * =============================================================================
 * One import surface for the pure primitives Architect-2525 built and every future domain
 * (Security · Health · Education · Manta · Drone · Atlantis) can inherit instead of duplicating.
 * Architect is the FIRST consumer, not the owner. These modules are pure + deterministic (no React,
 * no domain vocabulary) so they compose anywhere. See MANIFEST.md for the full candidate list.
 */

// $/min economy · Trinity mint (♡ 웃 ◬) · Time Capital
export {
  computeEconomy, allocate, fmtUsd, ratePerMin,
  DEFAULT_RATE_PER_HR, DEFAULT_FEE_USD,
  type EconomyInput, type EconomyResult, type AllocationMode,
} from "@/components/architect-2525/architect-economy";

// Decisions → Tighter Estimates · AACE classes · gate ladder · 4D schedule (qualification engine)
export {
  AACE, GATES, LAST_GATE, DEFAULT_SECTIONS, CHECKPOINTS,
  classForGate, confidenceForGate, bandPctForGate, bandFor, rollupProject,
  advanceGate, retreatGate, checkpointForGate, scheduleSections, monthlyForecast,
  type AaceClass, type WorkSection, type Rag, type ProjectRollup,
  type Checkpoint, type ScheduledSection,
} from "@/lib/architect-estimate";

// System of Intelligence · editable Tri-Coin framework store (draft → published flow-through)
export {
  SOI_VERSION, DEFAULT_SOI,
  loadSoI, saveSoI, loadPublishedSoI, publishSoI, subscribeSoI,
  type SoiFramework, type SoiCoin, type SoiKV,
} from "@/lib/soi-framework";

// Cube 23 · De-Risk Gateway (Pilot→Refine→Qualify→Adopt) + Primitive #13 · Risk Register.
// The SUBSTRATE ladder every Level-3 domain inherits — distinct from `architect-estimate.GATES`,
// which is Architect-2525's own 14-gate build sequence (a Domain Play, not the substrate).
export {
  L3_PHASES, QUORUM_PCT, WINDOW_DAYS,
  evaluateGate, advancePhase, appendRisk, retireRisk, openRisks, registerHash, exposureOf,
  type L3Phase, type GateVote, type GateInput, type GateVerdict, type RiskRow,
} from "@/lib/2525-core/derisk";

// Shared UI primitive (collapsible)
export { Expander, type ExpanderColors } from "@/components/2525-core/expander";
