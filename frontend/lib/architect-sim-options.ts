/**
 * ARCHITECT-2525 · SIMULATE — ALTERNATIVE DESIGN OPTIONS (operator 2026-10-25: "show me a mock up; simulate options"
 * + "3 options have tests to run like original" + "tests should give 0-5 score initial score and other more detailed
 * metrics" + "Cube vs Tiny Home vs Eco Sphere can be scored and viewed Side by aside with mini version of those
 * designs in the tests" + the standing rule "simulate = come up with options").
 * ============================================================================================================
 * The Simulate tab lets a buyer pick ONE of three design models (Cube · Tiny Home · Eco-Sphere), run the SAME
 * original 13-sim battery on it, see each sim scored 0–5 with detailed metrics, and COMPARE all three side by side.
 * Pure + deterministic (no Date.now / Math.random) so it is replayable and gate-tested.
 *
 * PRODUCT TRUTH: the Cube (3×3 Grid) home's cost + build time are DERIVED from the real estimate engine
 * (lib/architect-estimate.ts DEFAULT_SECTIONS + scheduleSections). The Tiny Home and Eco-Sphere are DECLARED
 * PARAMETRIC variants — a scale + form factor on that same baseline — carried as ASSUMED, editable, never quoted as
 * fact. A sim "result" is a deterministic ESTIMATE (a preview), clearly labelled, not a real engineering analysis.
 */
import { DEFAULT_SECTIONS, scheduleSections, monthlyForecast } from "@/lib/architect-estimate";

// The ORIGINAL 13-sim battery (exact list from the Simulate catalog) — the single source; every model runs all of it.
export const SIMS = [
  "Structural", "Wind", "Flood", "Fire", "Earthquake", "Thermal", "Solar",
  "Water Flow", "HVAC", "Evacuation", "Accessibility", "Carbon", "Lifecycle",
] as const;
export type SimName = (typeof SIMS)[number];

export type Basis = "DERIVED" | "ASSUMED";
export interface SimModel {
  id: string;
  label: string;
  form: string;            // the build form (how it is put together)
  areaFt2: number;
  rooms: number;
  costUsd: number;
  buildMonths: number;
  energyScore: number;     // 1..5 (higher = more efficient envelope) — a DESIGN ASSUMPTION, not derived (shown as "assumed" in the UI)
  carbonScore: number;     // 1..5 (higher = lower embodied + operating carbon) — a DESIGN ASSUMPTION, not derived
  basis: Basis;            // DERIVED = from the estimate engine; ASSUMED = parametric variant
  note: string;
}

// ── the canonical baseline, DERIVED from the estimate engine (one source of truth) ──────────────────────────────
const BASE_COST = DEFAULT_SECTIONS.reduce((s, w) => s + w.costUsd, 0);                 // $440,000
const BASE_MONTHS = monthlyForecast(scheduleSections(DEFAULT_SECTIONS)).months;        // 7
const BASE_AREA = 900;

// A parametric variant: scale cost sub-linearly with area (fixed costs don't shrink 1:1) + a form cost factor, and scale
// the build time with area so a smaller home reads as faster (an intuitive, honest ESTIMATE). 35% of cost is roughly
// fixed (permits, hookups, crew mobilization). NOTE: unlike the Cube's cost+time (DERIVED from DEFAULT_SECTIONS +
// scheduleSections), these are parametric assumptions — routing the variants through scheduleSections() flattens all
// three to the canonical 7 months, because that engine's month count is phase-sequence-driven, not hours-driven; so
// unifying the schedule engine for scaled homes (Krishna) waits until the engine models scaled durations (QUEUED).
const variant = (areaFt2: number, formCostFactor: number): { costUsd: number; buildMonths: number } => {
  const areaScale = areaFt2 / BASE_AREA;
  const costScale = 0.35 + 0.65 * areaScale;
  return {
    costUsd: Math.round((BASE_COST * costScale * formCostFactor) / 1000) * 1000,
    buildMonths: Math.max(1, Math.round(BASE_MONTHS * (0.5 + 0.5 * areaScale))),
  };
};

export const SIM_MODELS: SimModel[] = [
  {
    // operator's word for the 3×3 Grid is "Cube"
    id: "3x3-grid", label: "Cube", form: "3×3 grid · stick-framed (9 rooms)", areaFt2: BASE_AREA, rooms: 9,
    costUsd: BASE_COST, buildMonths: BASE_MONTHS, energyScore: 3, carbonScore: 3, basis: "DERIVED",
    note: "The canonical home — cost + build time derived from the estimate engine (DEFAULT_SECTIONS).",
  },
  {
    id: "tiny", label: "Tiny Home", form: "compact single-volume", areaFt2: 400, rooms: 5,
    ...variant(400, 0.98), energyScore: 4, carbonScore: 4, basis: "ASSUMED",
    note: "Parametric variant of the canonical baseline (scaled to 400 ft²) — ASSUMED (a declared assumption, not a quote); envelope scores are design assumptions.",
  },
  {
    id: "eco-sphere", label: "Eco-Sphere", form: "hex-panel geodesic dome", areaFt2: 700, rooms: 6,
    ...variant(700, 1.06), energyScore: 5, carbonScore: 5, basis: "ASSUMED",
    note: "Parametric variant — hex/dome envelope (curved-panel premium, best envelope efficiency) — ASSUMED.",
  },
];

export const modelById = (id: string | null | undefined): SimModel | null => SIM_MODELS.find((m) => m.id === id) ?? null;

// ── COMPARE ALL — rank the three by each headline metric; flag the winner (lower cost/time wins; higher energy/carbon wins) ──
export interface MetricRank { metric: string; unit: string; lowerIsBetter: boolean; winnerId: string; values: { id: string; value: number }[]; }
export function compareModels(models: SimModel[] = SIM_MODELS): MetricRank[] {
  const metric = (name: string, unit: string, lowerIsBetter: boolean, pick: (m: SimModel) => number): MetricRank => {
    const values = models.map((m) => ({ id: m.id, value: pick(m) }));
    const best = values.reduce((a, b) => (lowerIsBetter ? (b.value < a.value ? b : a) : (b.value > a.value ? b : a)));
    return { metric: name, unit, lowerIsBetter, winnerId: best.id, values };
  };
  return [
    metric("Cost", "USD", true, (m) => m.costUsd),
    metric("Build time", "months", true, (m) => m.buildMonths),
    metric("Energy", "score", false, (m) => m.energyScore),
    metric("Carbon", "score", false, (m) => m.carbonScore),
  ];
}

// ── the per-sim 0–5 scoring (deterministic, principled — a DESIGN PREVIEW, not an engineering result) ────────────
// No hash, no nudge: the score is a pure weighted blend of the model's own attribute drivers, so a build winner is
// decided only by design merit (an exact tie is a legitimate co-result, never broken by a hash — Sofia's law).
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

// Named 1–5 "drivers" derived from a model's own attributes — every score is a weighted blend of these.
// env/carb come from the model's ASSUMED envelope scores (declared assumptions, surfaced as "assumed" in the UI, not
// derived — deriving them from geometry/materials is a declared follow-on); the rest are computed from real geometry.
type DriverKey = "env" | "carb" | "compact" | "spacious" | "conv" | "curved" | "afford";
function drivers(m: SimModel): Record<DriverKey, number> {
  return {
    env: m.energyScore,                                  // envelope efficiency 1..5 (ASSUMED)
    carb: m.carbonScore,                                 // carbon performance 1..5 (ASSUMED)
    compact: clamp(6 - m.areaFt2 / 200, 1, 5),           // smaller footprint → higher (fast egress, less material)
    spacious: clamp(m.areaFt2 / 200, 1, 5),              // more area → higher (ADA clearances)
    conv: m.id === "3x3-grid" ? 5 : m.id === "tiny" ? 4 : 2,   // rectilinear/stick-framed = most code-conventional
    curved: m.id === "eco-sphere" ? 5 : m.id === "tiny" ? 3 : 2, // aerodynamic/curved dome resilience
    afford: clamp(6 - m.costUsd / 110000, 1, 5),         // cheaper → higher
  };
}

// Which drivers matter for each sim (weights sum to 1). This is the design judgment the preview encodes.
const SIM_WEIGHTS: Record<SimName, Partial<Record<DriverKey, number>>> = {
  "Structural":    { conv: 0.6, curved: 0.4 },
  "Wind":          { curved: 0.7, conv: 0.3 },
  "Flood":         { compact: 0.5, curved: 0.2, conv: 0.3 },
  "Fire":          { conv: 0.5, compact: 0.3, curved: 0.2 },
  "Earthquake":    { curved: 0.5, compact: 0.3, conv: 0.2 },
  "Thermal":       { env: 0.7, curved: 0.3 },
  "Solar":         { env: 0.5, conv: 0.25, curved: 0.25 },
  "Water Flow":    { conv: 0.6, compact: 0.4 },
  "HVAC":          { env: 0.4, conv: 0.3, compact: 0.3 },
  "Evacuation":    { compact: 0.5, conv: 0.4, curved: 0.1 },
  "Accessibility": { conv: 0.5, spacious: 0.5 },
  "Carbon":        { carb: 0.7, compact: 0.3 },
  "Lifecycle":     { afford: 0.4, env: 0.3, carb: 0.3 },
};

function rawScore(m: SimModel, sim: SimName): number {
  const d = drivers(m);
  const w = SIM_WEIGHTS[sim];
  let s = 0;
  (Object.keys(w) as DriverKey[]).forEach((k) => { s += d[k] * (w[k] as number); });
  return clamp(s, 0, 5);
}

// ── detailed per-sim metrics (2 each, deterministic, labelled ESTIMATE) ─────────────────────────────────────────
// A Record<SimName, …> (not a switch with a default) so a future sim CANNOT ship a 0–5 score with no backing metrics —
// adding to SIMS without adding a metrics entry fails to compile (Odin's scaling-trap fix).
export interface SimMetric { label: string; value: string; }
const num = (x: number, digits = 0): string => x.toLocaleString("en-US", { maximumFractionDigits: digits });

const METRICS: Record<SimName, (m: SimModel, d: Record<DriverKey, number>) => SimMetric[]> = {
  "Structural":    (m, d) => [{ label: "Load margin", value: `${num(20 + d.conv * 8 + d.curved * 4)}%` }, { label: "Max clear span", value: `${num(10 + d.conv * 2)} ft` }],
  "Wind":          (m, d) => [{ label: "Design wind", value: `${num(100 + d.curved * 8)} mph` }, { label: "Uplift margin", value: `${num(10 + d.curved * 10)}%` }],
  "Flood":         (m, d) => [{ label: "Freeboard", value: `${num(1 + d.compact * 0.4, 1)} ft` }, { label: "FFE margin", value: `${num(d.compact * 0.3, 1)} ft` }],
  "Fire":          (m, d) => [{ label: "Egress time", value: `${num(120 - d.compact * 10 - d.conv * 5)} s` }, { label: "Compartment", value: `${num(20 + d.conv * 8)} min` }],
  "Earthquake":    (m, d) => [{ label: "Drift ratio", value: `${num(2.4 - d.curved * 0.25, 2)}%` }, { label: "Ductility", value: `${num(d.curved, 1)}/5` }],
  "Thermal":       (m) => [{ label: "Envelope", value: `R-${num(13 + m.energyScore * 6)}` }, { label: "Env. grade", value: `${m.energyScore}/5 (assumed)` }],
  "Solar":         (m) => { const roof = Math.round(m.areaFt2 * (m.id === "eco-sphere" ? 0.6 : m.id === "tiny" ? 0.4 : 0.5)); return [{ label: "Roof solar area", value: `${num(roof)} ft²` }, { label: "Annual yield", value: `${num(roof * 15)} kWh` }]; },
  "Water Flow":    (m, d) => [{ label: "Peak demand", value: `${num(m.rooms * 2.5, 1)} GPM` }, { label: "Pressure margin", value: `${num(10 + d.conv * 4)} psi` }],
  "HVAC":          (m) => { const tons = m.areaFt2 / (400 + m.energyScore * 60); return [{ label: "Cooling load", value: `${num(tons, 1)} tons` }, { label: "Design SEER", value: `${num(13 + m.energyScore * 1.5, 1)}` }]; },
  "Evacuation":    (m, d) => [{ label: "Egress travel", value: `${num(20 + m.areaFt2 * 0.03)} ft` }, { label: "Clear time", value: `${num(90 - d.compact * 8 - d.conv * 4)} s` }],
  "Accessibility": (m, d) => [{ label: "Turning radius", value: `${num(48 + d.spacious * 3)} in` }, { label: "Clear door", value: `${num(32 + d.spacious)} in` }],
  "Carbon":        (m) => { const embodied = m.areaFt2 * (0.09 - m.carbonScore * 0.008); const operating = m.areaFt2 * (12 - m.energyScore * 1.5); return [{ label: "Embodied (assumed)", value: `${num(embodied, 1)} tCO₂e` }, { label: "Operating", value: `${num(operating)} kg/yr` }]; },
  "Lifecycle":     (m) => { const life = m.costUsd * (1 + (6 - m.energyScore) * 0.08); return [{ label: "30-yr cost", value: `$${num(life)}` }, { label: "Maint. index", value: `${num(5 - m.energyScore * 0.6, 1)}/5` }]; },
};
function simMetrics(m: SimModel, sim: SimName): SimMetric[] { return METRICS[sim](m, drivers(m)); }

export type SimStatus = "PASS" | "WATCH";
/** A per-sim ESTIMATE on one model: a 0–5 initial score (+ star rounding), a status, and detailed metrics. */
export interface SimResult { sim: SimName; score: number; stars: number; status: SimStatus; metrics: SimMetric[]; }
export function simResult(modelId: string, sim: SimName): SimResult {
  const m = modelById(modelId);
  if (!m) return { sim, score: 0, stars: 0, status: "WATCH", metrics: [] };
  const score = Math.round(rawScore(m, sim) * 10) / 10;       // 0.0 .. 5.0, one decimal, deterministic
  return { sim, score, stars: Math.round(score), status: score >= 3 ? "PASS" : "WATCH", metrics: simMetrics(m, sim) };
}

/** Run the WHOLE original battery on a model (all 13 sims) — "3 options have tests to run like original". */
export function runBattery(modelId: string): SimResult[] { return SIMS.map((s) => simResult(modelId, s)); }

/** A model's average 0–5 across the 13 sims — the single-number "simulation readiness" for the summary ranking. */
export function overallScore(modelId: string): number {
  const b = runBattery(modelId);
  if (!b.length) return 0;
  return Math.round((b.reduce((s, r) => s + r.score, 0) / b.length) * 10) / 10;
}

// ── the SIDE-BY-SIDE matrix: 13 rows × 3 models, each cell scored, a per-row winner (operator's core ask) ───────
export interface SimMatrixCell { modelId: string; label: string; score: number; stars: number; status: SimStatus; metrics: SimMetric[]; }
export interface SimMatrixRow { sim: SimName; cells: SimMatrixCell[]; winnerId: string; }
export function simMatrix(models: SimModel[] = SIM_MODELS): SimMatrixRow[] {
  return SIMS.map((sim) => {
    const cells: SimMatrixCell[] = models.map((m) => {
      const r = simResult(m.id, sim);
      return { modelId: m.id, label: m.label, score: r.score, stars: r.stars, status: r.status, metrics: r.metrics };
    });
    const winner = cells.reduce((a, b) => (b.score > a.score ? b : a));
    return { sim, cells, winnerId: winner.modelId };
  });
}

// ── one reconciled recommendation, not a per-axis scoreboard (Asar) — the balanced all-rounder across the 13 sims ──
export interface Recommendation { modelId: string; label: string; avg: number; reason: string; }
export function recommendation(models: SimModel[] = SIM_MODELS): Recommendation {
  const best = models.reduce((a, b) => (overallScore(b.id) > overallScore(a.id) ? b : a));
  return {
    modelId: best.id, label: best.label, avg: overallScore(best.id),
    reason: `highest 13-sim average (${overallScore(best.id).toFixed(1)}/5) — the balanced all-rounder across the whole battery (an estimate-based suggestion, not a quote)`,
  };
}
