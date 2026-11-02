/**
 * ARCHITECT-2525 · THE HOME BUILDING PROCESS — the developer PRO-FORMA (operator 2026-11-02: "more for backend
 * architecture see attached"; reference docs/asks/2026.11.01_20.59..42_architect2525_home_building_process_backend.md).
 * =============================================================================================================
 * The operator's slide is a 7-stage developer pro-forma: Land → Design & Architecture → Structural → Permitting →
 * Project Management → Construction → Sales = $650,000 over 290 days. This is the WIDER "develop + sell the home"
 * lifecycle that WRAPS the app's existing "build the home" engine — it does NOT replace it.
 *
 * OPTION A (the shipped first increment, MoT pick): a pure config/VIEW over the engines that already run — NO new
 * backend service, NO DB, ONE cost engine kept. Construction reads the live DERIVED $240k (costFor); the six
 * land/soft/PM/sales stages are FIXED REFERENCE config (the slide's figures), each stamped with its basis + AACE
 * class + (where one exists) its gate/human-authority checkpoint. The backend-ownership fork (A/B/C) and the five
 * other forks are the operator's to decide (served as HTML option cards); until then nothing here is scaled or
 * invented beyond what the engine already derives.
 *
 * THE TWO-TRUTHS LAW (gated by tests/architect-proforma.test.mjs, modelled on canonicalHouseTruth's throw-guard):
 *   • BUILD COST  = $240,000 · basis DERIVED   · scope "build the 900 ft² home" · = costFor(canonicalModel(), native)
 *   • PROJECT COST = $650,000 · basis REFERENCE · scope "develop + sell the home" · = Σ stages (Construction = the
 *     slide's $400k MARKET line)
 * They are DISTINCT fields and may NEVER be summed. Construction's market line can never fall below the build cost.
 * The $400k − $240k = $160k gap is its own named line with a basis label — NEVER auto-"markup" (the $240k already
 * bakes a 50% contractor markup, architect-sim-options BAKED_MARKUP). No stage amount is derived from another by an
 * invented factor. Per-stage durations for the six non-construction stages are UNKNOWN here (null) — the 290-day
 * figure is carried as a REFERENCE project headline, pending the operator's timeline fork; only Construction's span
 * is DERIVED (from the real build schedule).
 *
 * Pure + deterministic (no Date.now / Math.random) → replayable, gate-checked.
 * Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-proforma.test.mjs
 */
import { canonicalModel } from "./architect-house-truth";
import { costFor, monthsFor, type SimModel, type BuildOption } from "./architect-sim-options";
import { type AaceClass, checkpointForGate } from "./architect-estimate";

/** How a stage's cost is computed. */
export type StageCostBasis = "fixed" | "pct_of_construction" | "engine_derived";
/** How a stage's duration is computed (only crew_days is a labour computation; the rest are waits/inputs). */
export type StageDurationBasis = "crew_days" | "calendar_wait" | "input";
/** The provenance of a money figure — the heart of the two-truths law. */
export type CostTruthBasis = "DERIVED" | "REFERENCE";

/** One declared stage of the developer pro-forma (static config). */
export interface ProFormaStageDef {
  order: number;               // 1..7, business sequence (NOT the 11 intra-construction dev-phases)
  id: string;
  label: string;
  costBasis: StageCostBasis;
  /** the REFERENCE $ for this stage (the slide figure). For Construction this is the slide's $400k MARKET line; the
   *  as-modelled build ($240k) is resolved separately and kept distinct. */
  costRef: number;
  costTruth: CostTruthBasis;
  durationBasis: StageDurationBasis;
  /** REFERENCE duration in days, or null = unknown (the slide gives only the 290-day project total, not per stage). */
  durationDaysRef: number | null;
  /** gate index into architect-estimate GATES (for the human-authority checkpoint), when this stage has one. */
  gate?: number;
  aaceClass: AaceClass;
  note?: string;
}

/** The slide's project headline figures — REFERENCE until the operator fixes them (product-truth). */
export const PROJECT_DAYS_REF = 290;
/** The slide's Construction MARKET line (full-service), distinct from the app's as-modelled build ($240k DERIVED). */
export const CONSTRUCTION_MARKET_REF = 400_000;

/** The 7 business stages, in order. Costs are the operator's slide figures (REFERENCE), except Construction which is
 *  engine-derived. Four stages reuse the app's existing gate/human-authority checkpoints (architect-estimate GATES /
 *  CHECKPOINTS); Land/PM/Sales have no counterpart in the build engine today (flagged). The id "land" here is the
 *  $110k LAND-ACQUISITION stage — NOT the $10k "Landscaping" work-section inside Construction (an 11× conflation the
 *  gate forbids). */
export const PRO_FORMA_STAGES: ProFormaStageDef[] = [
  { order: 1, id: "land",        label: "Land",                  costBasis: "fixed",          costRef: 110_000, costTruth: "REFERENCE", durationBasis: "calendar_wait", durationDaysRef: null, aaceClass: 5, note: "Acquisition — a fixed market/parcel price; no counterpart in the build engine." },
  { order: 2, id: "design",      label: "Design & Architecture", costBasis: "fixed",          costRef: 5_000,   costTruth: "REFERENCE", durationBasis: "calendar_wait", durationDaysRef: null, gate: 3,  aaceClass: 4, note: "Concept design — gate G3, authority Architect." },
  { order: 3, id: "structural",  label: "Structural",            costBasis: "fixed",          costRef: 5_000,   costTruth: "REFERENCE", durationBasis: "calendar_wait", durationDaysRef: null, gate: 4,  aaceClass: 4, note: "Structural design — gate G4, authority licensed Structural Engineer." },
  { order: 4, id: "permitting",  label: "Permitting",            costBasis: "fixed",          costRef: 20_000,  costTruth: "REFERENCE", durationBasis: "calendar_wait", durationDaysRef: null, gate: 6,  aaceClass: 4, note: "Permit + fees — the AHJ queue (often the longest, most variable wait). Gate G6, authority Government/AHJ. Fee-table later." },
  { order: 5, id: "pm",          label: "Project Management",    costBasis: "fixed",          costRef: 90_000,  costTruth: "REFERENCE", durationBasis: "input",         durationDaysRef: null, aaceClass: 4, note: "General conditions / PM — a fixed REFERENCE, NOT auto-derived as a % of construction (no invented factor); realistically overlaps Construction." },
  { order: 6, id: "construction", label: "Construction",         costBasis: "engine_derived", costRef: CONSTRUCTION_MARKET_REF, costTruth: "REFERENCE", durationBasis: "crew_days", durationDaysRef: null, gate: 8, aaceClass: 3, note: "The build. The slide's $400k is the MARKET/full-service line (REFERENCE); the app's as-modelled build is $240k (DERIVED, costFor). Gate G8." },
  { order: 7, id: "sales",       label: "Sales",                 costBasis: "fixed",          costRef: 20_000,  costTruth: "REFERENCE", durationBasis: "calendar_wait", durationDaysRef: null, gate: 10, aaceClass: 2, note: "Disposition — days on market + commission. Gate G10 (Occupancy)." },
];

/** A resolved stage (config + the live numbers + its uncertainty band + its human-authority checkpoint). */
export interface ProFormaStage extends ProFormaStageDef {
  cost: number;                 // the $ used in the project total (Construction = the MARKET ref)
  authority: string | null;     // from CHECKPOINTS, when the stage has a gate with one
  durationDays: number | null;  // DERIVED for Construction, else the REFERENCE (null here until the timeline fork)
  durationTruth: CostTruthBasis;
}

export interface ProForma {
  stages: ProFormaStage[];
  /** BUILD COST — DERIVED, "build the home". NEVER summed with projectCostUsd. */
  buildCostUsd: number;
  /** PROJECT COST — REFERENCE, "develop + sell the home" = Σ stages (Construction = the $400k market line). */
  projectCostUsd: number;
  /** Construction, kept honest as three distinct numbers. */
  constructionMarketRef: number;   // $400k (REFERENCE, slide)
  constructionBuildCost: number;   // $240k (DERIVED, costFor)
  constructionDeltaUsd: number;    // market − build = $160k
  /** the basis label for the delta — PENDING the operator's "$160k identity" fork; NEVER "markup". */
  constructionDeltaBasis: string;
  /** Construction build span in days (DERIVED from monthsFor — coherent with the Simulate months; distinct from the project span). */
  constructionDays: number;
  /** the project timeline headline (REFERENCE, the slide's 290 days) — distinct in scope from the build span. */
  projectDaysRef: number;
}

/**
 * Resolve the pro-forma for a model/option (defaults to the canonical $240k Cube at its native option, so the
 * headline matches the slide exactly). ONLY the Construction build cost is scaled-from-design (via costFor); the six
 * reference stages hold at the slide's figures (no invented stage→home scaling) until the operator's forks are set.
 */
export function proForma(model: SimModel = canonicalModel(), opt?: BuildOption): ProForma {
  const o = opt ?? model.native;
  const buildCostUsd = costFor(model, o);                 // DERIVED "build the home"
  // DERIVED build span, from monthsFor (the same build-duration the Simulate cards show, ~30.4 days/mo) so the pro-forma
  // stays coherent with the rest of the app; distinct in scope from the 290-day PROJECT span (build ⊂ project).
  const constructionDays = Math.round(monthsFor(model, o) * 30.4);

  const stages: ProFormaStage[] = PRO_FORMA_STAGES.map((s) => {
    const isConstruction = s.id === "construction";
    const cost = isConstruction ? CONSTRUCTION_MARKET_REF : s.costRef;  // the market line drives the project total
    const cp = s.gate != null ? checkpointForGate(s.gate) : null;
    return {
      ...s,
      cost,
      authority: cp ? cp.authority : null,
      durationDays: isConstruction ? constructionDays : s.durationDaysRef,  // only Construction is known (DERIVED)
      durationTruth: isConstruction ? "DERIVED" : "REFERENCE",
    };
  });

  const projectCostUsd = stages.reduce((sum, s) => sum + s.cost, 0);   // Σ with Construction = $400k market
  const constructionDeltaUsd = CONSTRUCTION_MARKET_REF - buildCostUsd;

  const pf: ProForma = {
    stages,
    buildCostUsd,
    projectCostUsd,
    constructionMarketRef: CONSTRUCTION_MARKET_REF,
    constructionBuildCost: buildCostUsd,
    constructionDeltaUsd,
    constructionDeltaBasis: "PENDING — full-service GC/overhead/contingency or a scope difference (HI fork); never plain markup",
    constructionDays,
    projectDaysRef: PROJECT_DAYS_REF,
  };
  assertProFormaHonest(pf);   // the guard runs on the RUNTIME path (like canonicalHouseTruth), not only in tests
  return pf;
}

/**
 * THE HONESTY INVARIANT — refuses any pro-forma that conflates the two cost truths. Throws (like canonicalHouseTruth)
 * so a drift refuses rather than silently serving two cost stories. Gated in test:ci.
 */
export function assertProFormaHonest(pf: ProForma): void {
  const fail = (m: string): never => { throw new Error(`architect-proforma honesty violation: ${m}`); };
  // 1. the two truths are distinct and never equal-by-accident-of-summing
  if (pf.buildCostUsd === pf.projectCostUsd) fail("buildCostUsd === projectCostUsd (the two truths must be distinct)");
  if (pf.projectCostUsd <= pf.buildCostUsd) fail("projectCostUsd must exceed buildCostUsd (project wraps the build)");
  // 2. the project total is Σ stages (Construction = market ref) and does NOT include the build cost as its own line
  const sumStages = pf.stages.reduce((s, x) => s + x.cost, 0);
  if (sumStages !== pf.projectCostUsd) fail(`projectCostUsd (${pf.projectCostUsd}) must equal Σ stage costs (${sumStages})`);
  // 3. Construction market line ≥ the as-modelled build (a full-service line can never sit below the bare build)
  if (pf.constructionMarketRef < pf.buildCostUsd) fail("Construction market line is below the as-modelled build cost");
  // 4. the delta is its own line, correct, with a basis label that is NOT "markup"
  if (pf.constructionDeltaUsd !== pf.constructionMarketRef - pf.buildCostUsd) fail("constructionDeltaUsd must equal market − build");
  if (!pf.constructionDeltaBasis || /\bmarkup\b/i.test(pf.constructionDeltaBasis.replace(/never plain markup/i, ""))) fail("the $160k delta must carry a basis label and must not be auto-labelled 'markup'");
  // 5. every stage stamps its cost truth + a construction stage is engine_derived
  for (const s of pf.stages) {
    if (s.costTruth !== "DERIVED" && s.costTruth !== "REFERENCE") fail(`stage ${s.id} has no cost-truth basis`);
    if (s.id === "construction" && s.costBasis !== "engine_derived") fail("Construction must be engine_derived");
    if (s.id !== "construction" && s.costBasis === "engine_derived") fail(`stage ${s.id} must not be engine_derived (no invented derivation)`);
  }
  // 6. the "land" stage is acquisition ($110k), never confused with the $10k Landscaping work-section
  const land = pf.stages.find((s) => s.id === "land");
  if (!land || land.cost < 100_000) fail("the Land stage is acquisition (~$110k), not the $10k Landscaping work-section");
}
