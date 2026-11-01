/**
 * ARCHITECT-2525 · THE ONE MASTER HOUSE-TRUTH (operator 2026-11-01, 3 screenshots, verbatim):
 *   "3x3 900 sq ft does not match House Build Spec; I asked 3x to ensure you have master source of data that
 *    flows through to all components. triple check since you failed all cost, dimensions, detail element build
 *    on length of material etc."
 * ============================================================================================================
 * The canonical 3×3 Cube IS the house. This module is the SINGLE source every surface reads for its facts, so no
 * two surfaces can ever disagree (the HOUSE BUILD SPEC showed 2,000 ft² / $2,000 / 1 component while the Design
 * tab showed 900 ft² / 9 rooms — two engines, one house: the exact failure this closes):
 *   • DIMENSIONS — from the seed GEOMETRY (netProgramAreaUm2 of the R0 project) → 900 ft², 9 rooms, 30×30 ft.
 *     Never a literal; derived from the same µm geometry the Design surface draws.
 *   • COST       — from the ONE-COST-TRUTH engine (architect-sim-options.costFor / costBreakdown of the Cube at
 *     its native option) → $240,000, reconciling element-by-element to the penny. The same number the Simulate
 *     headline, the Estimate headline and the 웃 engine's projectHeadline all agree on (architect-one-cost-truth).
 *   • BUILD      — the real build elements (costBreakdown: Foundation · Framing · Roofing · Plumbing · Electrical ·
 *     HVAC + the site/finish remainder) grouped into install phases, each carrying its real USD. Σ === $240,000.
 *   • MATERIAL   — the framing & envelope take-off (slab ft² · wall linear ft · studs · plates · roof ft²) derived
 *     from the 30×30 geometry + the one stud spacing (STUD_SPACING_IN). "length of material", from the one source.
 *
 * TRIPLE-CHECK (the operator asked 3×): the GEOMETRY area (seed) and the COST-MODEL area (SimModel.areaFt2) MUST
 * agree — asserted here (canonicalHouseTruth throws on divergence) AND gated (tests/architect-house-truth.test.mjs).
 * If they ever drift, the master refuses rather than quietly serving two truths.
 *
 * Pure + deterministic (no Date.now / Math.random) → replayable, gate-checked.
 * Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-house-truth.test.mjs
 */
import { buildProjectFromSeed, netProgramAreaUm2, spaceCount } from "./architect-2525/canonical/runtime";
import { sqftFromUm2, ftFromUm } from "./architect-2525/canonical/units";
import type { SpaceEntity, StoreyEntity } from "./architect-2525/canonical/types";
import { TINY_HOME_V1 } from "./architect-2525/seeds/tiny-home-v1";
import { modelById, SIM_MODELS, costFor, costBreakdown, monthsFor, laborHoursFor, type SimModel } from "./architect-sim-options";
import { STUD_SPACING_IN, STUD_GAUGES, DEFAULT_STUD_GAUGE } from "./architect-phase-palette";
import { PHASES, type Phase } from "./architect-house";

const CANONICAL_MODEL_ID = "3x3-grid";

/** The canonical Cube SimModel (the one priced to $240,000 at its native option). */
export function canonicalModel(): SimModel {
  return modelById(CANONICAL_MODEL_ID) ?? SIM_MODELS[0];
}

/** One build grouping — a real install phase carrying the real cost of the elements built in it. */
export interface MasterBuildPhase {
  phase: Phase;
  label: string;
  color: string;
  components: string[];   // the real build elements installed in this phase
  usd: number;            // their real cost (from costBreakdown) — Σ over phases === the $240,000 headline
}

/** One material take-off line — derived from the one geometry + the one stud spacing. */
export interface MasterMaterialLine { item: string; qty: number; unit: "ft²" | "lin ft" | "ea"; note?: string; }

export interface CanonicalHouseTruth {
  areaSqft: number;            // 900 — from the seed geometry (netProgramAreaUm2)
  rooms: number;               // 9 — space count
  dims: { widthFt: number; depthFt: number; wallHeightFt: number }; // 30 × 30 × 10
  costUsd: number;             // 240,000 — the one-cost-truth (costFor)
  months: number;              // build months (monthsFor)
  laborHours: number;          // total labour hours (laborHoursFor)
  costPerFt2: number;          // $/ft² = cost ÷ area (honest, from the two master facts)
  build: MasterBuildPhase[];   // the real build, grouped by install phase — Σ usd === costUsd
  materials: MasterMaterialLine[]; // the framing & envelope take-off (length of material)
}

// Which install phase each priced element is built in (architect-house PHASES ids). The six costBreakdown elements
// + the site/finish remainder map onto five install phases; MEP (plumbing·electrical·HVAC) share one phase (parallel).
const ELEMENT_PHASE: Record<string, Phase> = {
  Foundation: "foundation",
  Framing: "framing",
  Roofing: "envelope",
  Plumbing: "mep",
  Electrical: "mep",
  HVAC: "mep",
};
const PHASE_META: Record<Phase, { label: string; color: string }> = Object.fromEntries(
  PHASES.map((p) => [p.id, { label: p.label, color: p.color }]),
) as Record<Phase, { label: string; color: string }>;

function r0(n: number): number { return Math.round(n); }

/** Build the ONE master house-truth from the canonical geometry + the one-cost-truth engine. Throws if the geometry
 *  area and the cost-model area disagree (the triple-check — one house, never two). */
export function canonicalHouseTruth(): CanonicalHouseTruth {
  const project = buildProjectFromSeed(TINY_HOME_V1);
  const spaces = project.entities.filter((e): e is SpaceEntity => e.entity_type === "SPACE");
  const storey = project.entities.find((e): e is StoreyEntity => e.entity_type === "STOREY");

  // ── DIMENSIONS — from the µm geometry (the same the Design surface draws) ──
  const geomSqft = Math.round(sqftFromUm2(netProgramAreaUm2(project)));   // 900
  const rooms = spaceCount(project);                                      // 9
  const widthFt = Math.round(ftFromUm(Math.max(...spaces.map((s) => s.x_um + s.width_um))));  // 30
  const depthFt = Math.round(ftFromUm(Math.max(...spaces.map((s) => s.y_um + s.depth_um))));  // 30
  const wallHeightFt = storey ? Math.round(ftFromUm(storey.height_um)) : 10;                  // 10

  // ── COST — from the one-cost-truth engine (triple-check: cost-model area must equal the geometry area) ──
  const m = canonicalModel();
  if (m.areaFt2 !== geomSqft) {
    throw new Error(`ARCHITECT house-truth: cost-model area (${m.areaFt2} ft²) ≠ geometry area (${geomSqft} ft²) — one house, never two`);
  }
  const costUsd = costFor(m, m.native);                                   // 240,000
  const months = monthsFor(m, m.native);
  const laborHours = laborHoursFor(m, m.native);
  const costPerFt2 = geomSqft > 0 ? r0(costUsd / geomSqft) : 0;

  // ── BUILD — the real elements grouped by install phase, reconciling to the $240,000 headline ──
  const bd = costBreakdown(m, m.native);
  const byPhase = new Map<Phase, { components: string[]; usd: number }>();
  const put = (phase: Phase, name: string, usd: number) => {
    const b = byPhase.get(phase) ?? { components: [], usd: 0 };
    b.components.push(name); b.usd += usd; byPhase.set(phase, b);
  };
  bd.elements.forEach((el) => put(ELEMENT_PHASE[el.element] ?? "finish", el.element, el.usd));
  // the site/drywall/finish/landscaping remainder is the Finish phase; the fixed row (none for the Cube) also lands there
  put("finish", bd.remainder.label, bd.remainder.usd);
  if (bd.fixed) put("finish", bd.fixed.label, bd.fixed.usd);
  const build: MasterBuildPhase[] = PHASES
    .filter((p) => byPhase.has(p.id))
    .map((p) => {
      const b = byPhase.get(p.id)!;
      return { phase: p.id, label: PHASE_META[p.id].label, color: PHASE_META[p.id].color, components: b.components, usd: r0(b.usd) };
    });

  // ── MATERIAL — the framing & envelope take-off, from the one geometry + the one stud spacing ──
  const gauge = STUD_GAUGES.find((g) => g.id === DEFAULT_STUD_GAUGE) ?? STUD_GAUGES[0]; // 2×6 envelope default
  const stepFt = STUD_SPACING_IN / 12;                                   // 16" o.c. → 1.333 ft
  // The 3×3 grid gives 2 internal gridlines on each axis. Derive the wall runs from the geometry, not a guess:
  const gridN = Math.round(Math.sqrt(rooms));                            // 3 (3×3)
  const extRuns = [widthFt, widthFt, depthFt, depthFt];                  // 4 exterior walls (perimeter)
  const intRuns = [
    ...Array.from({ length: Math.max(0, gridN - 1) }, () => depthFt),    // vertical internal gridlines span the depth
    ...Array.from({ length: Math.max(0, gridN - 1) }, () => widthFt),    // horizontal internal gridlines span the width
  ];
  const runs = [...extRuns, ...intRuns];
  const extWallFt = extRuns.reduce((a, b) => a + b, 0);                  // 120
  const intWallFt = intRuns.reduce((a, b) => a + b, 0);                  // 120
  const totalWallFt = extWallFt + intWallFt;                            // 240
  const studs = runs.reduce((a, L) => a + Math.floor(L / stepFt) + 1, 0); // per-run studs @16" o.c.
  const plateFt = r0(totalWallFt * 3);                                   // bottom + double top plate = 3 runs
  const slabFt2 = geomSqft;                                              // 900
  const roofFt2 = geomSqft;                                              // plan-area roof sheathing (estimate)
  const materials: MasterMaterialLine[] = [
    { item: "Concrete slab", qty: slabFt2, unit: "ft²", note: "foundation" },
    { item: "Wall framing", qty: r0(totalWallFt), unit: "lin ft", note: `${r0(extWallFt)} exterior + ${r0(intWallFt)} interior` },
    { item: `${gauge.label} studs`, qty: studs, unit: "ea", note: `@${STUD_SPACING_IN}" o.c. · ${wallHeightFt}′ walls` },
    { item: "Plate lumber", qty: plateFt, unit: "lin ft", note: "bottom + double top" },
    { item: "Roof sheathing", qty: roofFt2, unit: "ft²", note: "plan area (estimate)" },
  ];

  return {
    areaSqft: geomSqft,
    rooms,
    dims: { widthFt, depthFt, wallHeightFt },
    costUsd,
    months,
    laborHours,
    costPerFt2,
    build,
    materials,
  };
}
