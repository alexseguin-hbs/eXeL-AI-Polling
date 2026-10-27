/**
 * ARCHITECT-2525 · SIMULATE — ALTERNATIVE DESIGN OPTIONS (operator 2026-10-25/27).
 * ============================================================================================================
 * THREE ways to build the SAME 900 ft² home — Cube (3×3 grid) · Tiny Home (open) · Eco-Sphere (7-hex dome) —
 * each carrying the SAME nine rooms + their furniture (conserved; see architect-sim-environment.ts). Pressing a
 * form's SIMULATE generates that environment AND runs the SAME original 13-sim battery, scored 0–5 with detailed
 * metrics; the matrix scores all three side by side; COMPARE gives one balanced pick.
 *
 * ICON-INTERVIEW HOOK (operator 2026-10-27: "must be able to be converted to 3D printed cement version for framing"):
 * every form carries a construction-method dimension — stick-framed vs 3D-PRINTED CEMENT. The Eco-Sphere hex is
 * natively cement-printable. Cement shifts the sims HONESTLY both ways (Structural/Fire/Wind/Lifecycle ↑ — monolithic,
 * non-combustible, durable; Cost/Build ↑ — ICON speed/less labor; Carbon ↓ — cement's embodied carbon is high).
 *
 * PRODUCT TRUTH: the Cube's cost is DERIVED from the real estimate engine (DEFAULT_SECTIONS). The Tiny Home + Eco-Sphere
 * are DECLARED PARAMETRIC/ASSUMED. Scores are a deterministic design PREVIEW (no Date.now/Math.random), not an engineering
 * analysis. Energy/Carbon are DESIGN ASSUMPTIONS, not derived.
 */
import { DEFAULT_SECTIONS } from "@/lib/architect-estimate";
import { DEV_PHASES } from "@/lib/architect-phases";

// The ORIGINAL 13-sim battery (exact list) — the single source; every model runs all of it.
export const SIMS = [
  "Structural", "Wind", "Flood", "Fire", "Earthquake", "Thermal", "Solar",
  "Water Flow", "HVAC", "Evacuation", "Accessibility", "Carbon", "Lifecycle",
] as const;
export type SimName = (typeof SIMS)[number];

// ── construction method (the ICON dimension) ────────────────────────────────────────────────────────────────────
export type Framing = "stick-framed" | "3d-printed-cement";
export const FRAMING: Record<Framing, { label: string; short: string; blurb: string }> = {
  "stick-framed": { label: "Stick-framed", short: "STICK", blurb: "Conventional dimensional-lumber framing." },
  "3d-printed-cement": { label: "3D cement print", short: "CEMENT", blurb: "Printed monolithic cement walls — fast framing, non-combustible, durable; higher embodied carbon." },
};
const CEMENT_COST_FACTOR = 0.85;    // ICON: ~15% less (labor + speed) — illustrative ESTIMATE
const CEMENT_MONTHS_FACTOR = 0.6;   // the printed shell goes up far faster
/** Per-sim 0–5 shift when built 3D-printed cement — honest, both-sided (ESTIMATE). */
const CEMENT_DELTA: Partial<Record<SimName, number>> = {
  Structural: +0.7, Wind: +0.5, Fire: +1.0, Thermal: +0.4,
  Lifecycle: +0.2,    // DURABILITY only — cement's cost saving already reaches Lifecycle via the framing-aware `afford` driver (no double-count — Thoth)
  Earthquake: -0.3,   // more mass, less ductility
  Carbon: -0.9,       // cement's EMBODIED carbon is high (the real trade-off, shown not hidden)
};
const applyFraming = (stickCost: number, stickMonths: number, f: Framing) =>
  f === "3d-printed-cement"
    ? { costUsd: Math.round((stickCost * CEMENT_COST_FACTOR) / 1000) * 1000, buildMonths: Math.max(1, Math.round(stickMonths * CEMENT_MONTHS_FACTOR)) }
    : { costUsd: stickCost, buildMonths: stickMonths };

export type Basis = "DERIVED" | "ASSUMED";
export interface SimModel {
  id: string;
  label: string;
  form: string;            // the build form (how it is put together)
  areaFt2: number;         // all three = 900 (same home, three forms)
  rooms: number;           // the form's room/hex count (Cube/Tiny 9, Eco 7 hexes)
  layoutLabel: string;     // the honest room voice for the card so card ⇄ environment agree (Aset): e.g. "7 hex · 9 rooms"
  framing: Framing;        // the NATIVE construction method
  cementNative: boolean;   // the hex is natively cement-printable
  stickCostUsd: number;    // cost at stick framing (the baseline the cement factor applies to)
  stickMonths: number;     // build time at stick framing
  costUsd: number;         // cost at the NATIVE framing (what the card shows)
  buildMonths: number;     // build time at the NATIVE framing
  energyScore: number;     // 1..5 (higher = more efficient envelope) — a DESIGN ASSUMPTION, not derived
  carbonScore: number;     // 1..5 (higher = lower OPERATING carbon) — a DESIGN ASSUMPTION, not derived
  basis: Basis;            // DERIVED = from the estimate engine; ASSUMED = parametric
  note: string;
}

// ── the canonical baseline, DERIVED from the estimate engine (one source of truth) ──────────────────────────────
const BASE_COST = DEFAULT_SECTIONS.reduce((s, w) => s + w.costUsd, 0);                 // $440,000 (the Cube, DERIVED)
const BASE_AREA = 900;                                                                 // every form = the same 900 ft²

const mk = (stickCost: number, stickMonths: number, framing: Framing): Pick<SimModel, "stickCostUsd" | "stickMonths" | "framing" | "costUsd" | "buildMonths"> => {
  const nat = applyFraming(stickCost, stickMonths, framing);
  return { stickCostUsd: stickCost, stickMonths, framing, costUsd: nat.costUsd, buildMonths: nat.buildMonths };
};

export const SIM_MODELS: SimModel[] = [
  {
    // operator's word for the 3×3 Grid is "Cube" — the standard, all nine rooms on a 3×3
    id: "3x3-grid", label: "Cube", form: "3×3 grid · 9 rooms · stick-framed", areaFt2: BASE_AREA, rooms: 9, layoutLabel: "9 rooms",
    cementNative: false, ...mk(BASE_COST, 7, "stick-framed"), energyScore: 3, carbonScore: 3, basis: "DERIVED",
    note: "The standard home — the nine rooms on a 3×3 grid; cost DERIVED from the estimate engine (DEFAULT_SECTIONS).",
  },
  {
    id: "tiny", label: "Tiny Home", form: "open single-volume · same 900 ft²", areaFt2: BASE_AREA, rooms: 9, layoutLabel: "9 rooms · open",
    cementNative: false, ...mk(388000, 5, "stick-framed"), energyScore: 4, carbonScore: 4, basis: "ASSUMED",
    note: "The same nine rooms' furniture in an OPEN 900 ft² plan (fewer interior walls → faster) — ASSUMED, parametric.",
  },
  {
    id: "eco-sphere", label: "Eco-Sphere", form: "7 hexagons · hex dome · 3D cement print", areaFt2: BASE_AREA, rooms: 7, layoutLabel: "7 hex · 9 rooms",
    cementNative: true, ...mk(492000, 7, "3d-printed-cement"), energyScore: 5, carbonScore: 5, basis: "ASSUMED",
    note: "The same furniture across 7 hexagons (1 centre + 6) under a hex dome, natively 3D-printed cement — ASSUMED, parametric.",
  },
];

export const modelById = (id: string | null | undefined): SimModel | null => SIM_MODELS.find((m) => m.id === id) ?? null;

/** Cost / build-time of a model at a given framing (the toggle recomputes from the stick baseline). */
export function costFor(m: SimModel, framing: Framing): number { return applyFraming(m.stickCostUsd, m.stickMonths, framing).costUsd; }
export function monthsFor(m: SimModel, framing: Framing): number { return applyFraming(m.stickCostUsd, m.stickMonths, framing).buildMonths; }
/** Headline (envelope + embodied) carbon score 1..5 at a framing — 3D cement print costs a star for embodied carbon, so
 *  the card stars + COMPARE Carbon move when you convert to cement (the number a carbon interviewer scrutinises — Thor). */
export function carbonFor(m: SimModel, framing: Framing): number {
  return framing === "3d-printed-cement" ? Math.max(1, Math.min(5, m.carbonScore - 1)) : m.carbonScore;
}

// ── COMPARE ALL — rank by each headline metric at each form's NATIVE framing; flag the winner ──────────────────
export interface MetricRank { metric: string; unit: string; lowerIsBetter: boolean; winnerId: string; values: { id: string; value: number }[]; }
export function compareModels(models: SimModel[] = SIM_MODELS, framingBy?: Record<string, Framing>): MetricRank[] {
  const fr = (m: SimModel): Framing => framingBy?.[m.id] ?? m.framing;   // FRAMING-AWARE — the cement toggle reaches COMPARE
  const metric = (name: string, unit: string, lowerIsBetter: boolean, pick: (m: SimModel) => number): MetricRank => {
    const values = models.map((m) => ({ id: m.id, value: pick(m) }));
    const best = values.reduce((a, b) => (lowerIsBetter ? (b.value < a.value ? b : a) : (b.value > a.value ? b : a)));
    return { metric: name, unit, lowerIsBetter, winnerId: best.id, values };
  };
  return [
    metric("Cost", "USD", true, (m) => costFor(m, fr(m))),
    metric("Build time", "months", true, (m) => monthsFor(m, fr(m))),
    metric("Energy", "score", false, (m) => m.energyScore),
    metric("Carbon", "score", false, (m) => carbonFor(m, fr(m))),   // FRAMING-AWARE — cement's embodied-carbon penalty reaches the headline (Thor)
  ];
}

// ── the per-sim 0–5 scoring (deterministic, principled — a DESIGN PREVIEW, not an engineering result) ────────────
// No hash, no nudge: a pure weighted blend of the model's attribute drivers (+ an honest cement shift), so a build
// winner is decided only by design merit — no hash and no random ever decides a winner (Sofia's law). An exact tie
// (rare, with one-decimal scores) resolves deterministically to the first-listed form; the winner is a preview, not a quote.
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

type DriverKey = "env" | "carb" | "compact" | "spacious" | "conv" | "curved" | "afford";
function drivers(m: SimModel, fr: Framing): Record<DriverKey, number> {
  return {
    env: m.energyScore,                                  // envelope efficiency 1..5 (ASSUMED)
    carb: m.carbonScore,                                 // operating-carbon performance 1..5 (ASSUMED)
    compact: clamp(6 - m.areaFt2 / 200, 1, 5),           // smaller footprint → higher (all 900 here → same)
    spacious: clamp(m.areaFt2 / 200, 1, 5),              // more area → higher (ADA clearances)
    conv: m.id === "3x3-grid" ? 5 : m.id === "tiny" ? 4 : 2,   // rectilinear/stick-framed = most code-conventional
    curved: m.id === "eco-sphere" ? 5 : m.id === "tiny" ? 3 : 2, // aerodynamic/curved dome resilience
    afford: clamp(6 - costFor(m, fr) / 110000, 1, 5),    // cheaper → higher — FRAMING-AWARE (cement's cost saving reaches the scores)
  };
}

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

function rawScore(m: SimModel, sim: SimName, fr: Framing): number {
  const d = drivers(m, fr);
  const w = SIM_WEIGHTS[sim];
  let s = 0;
  (Object.keys(w) as DriverKey[]).forEach((k) => { s += d[k] * (w[k] as number); });
  return s;   // unclamped; the cement shift + clamp happen in simResult
}

// ── detailed per-sim metrics (2 each, deterministic, labelled ESTIMATE) — exhaustive Record so a new sim can't ship
//    a score with no backing metrics (Odin) ──────────────────────────────────────────────────────────────────────
export interface SimMetric { label: string; value: string; }
const num = (x: number, digits = 0): string => x.toLocaleString("en-US", { maximumFractionDigits: digits });

const METRICS: Record<SimName, (m: SimModel, d: Record<DriverKey, number>, cement: boolean, fr: Framing) => SimMetric[]> = {
  "Structural":    (m, d, c) => [{ label: "Load margin", value: `${num(20 + d.conv * 8 + d.curved * 4 + (c ? 15 : 0))}%` }, { label: "Wall system", value: c ? "cement (monolithic)" : "stick-framed" }],
  "Wind":          (m, d, c) => [{ label: "Design wind", value: `${num(100 + d.curved * 8 + (c ? 15 : 0))} mph` }, { label: "Uplift margin", value: `${num(10 + d.curved * 10)}%` }],
  "Flood":         (m, d) => [{ label: "Freeboard", value: `${num(1 + d.compact * 0.4, 1)} ft` }, { label: "FFE margin", value: `${num(d.compact * 0.3, 1)} ft` }],
  "Fire":          (m, d, c) => [{ label: "Egress time", value: `${num(120 - d.compact * 10 - d.conv * 5)} s` }, { label: "Wall rating", value: c ? "non-combustible" : `${num(20 + d.conv * 8)} min` }],
  "Earthquake":    (m, d, c) => [{ label: "Drift ratio", value: `${num(2.4 - d.curved * 0.25, 2)}%` }, { label: "System", value: c ? "mass (ductility ↓)" : `ductility ${num(d.curved, 1)}/5` }],
  "Thermal":       (m, _d, c) => [{ label: "Envelope", value: `R-${num(13 + m.energyScore * 6 + (c ? 4 : 0))}` }, { label: "Mass", value: c ? "high (cement)" : `${m.energyScore}/5 (assumed)` }],
  "Solar":         (m) => { const roof = Math.round(m.areaFt2 * (m.id === "eco-sphere" ? 0.6 : m.id === "tiny" ? 0.4 : 0.5)); return [{ label: "Roof solar area", value: `${num(roof)} ft²` }, { label: "Annual yield", value: `${num(roof * 15)} kWh` }]; },
  "Water Flow":    (m, d) => [{ label: "Peak demand", value: `${num(9 * 2.5, 1)} GPM` }, { label: "Pressure margin", value: `${num(10 + d.conv * 4)} psi` }],   // fixtures are CONSERVED (same 9-room home), so peak demand is identical across forms — count rooms (9), not hexes (Aset)
  "HVAC":          (m) => { const tons = m.areaFt2 / (400 + m.energyScore * 60); return [{ label: "Cooling load", value: `${num(tons, 1)} tons` }, { label: "Design SEER", value: `${num(13 + m.energyScore * 1.5, 1)}` }]; },
  "Evacuation":    (m, d) => [{ label: "Egress travel", value: `${num(20 + m.areaFt2 * 0.03)} ft` }, { label: "Clear time", value: `${num(90 - d.compact * 8 - d.conv * 4)} s` }],
  "Accessibility": (m, d) => [{ label: "Turning radius", value: `${num(48 + d.spacious * 3)} in` }, { label: "Clear door", value: `${num(32 + d.spacious)} in` }],
  "Carbon":        (m, _d, c) => { const operating = m.areaFt2 * (12 - m.energyScore * 1.5); const embodied = m.areaFt2 * (0.09 - m.carbonScore * 0.008) + (c ? m.areaFt2 * 0.03 : 0); return [{ label: "Embodied" + (c ? " (cement↑)" : " (assumed)"), value: `${num(embodied, 1)} tCO₂e` }, { label: "Operating", value: `${num(operating)} kg/yr` }]; },
  "Lifecycle":     (m, _d, c, fr) => { const life = costFor(m, fr) * (1 + (6 - m.energyScore) * 0.08); return [{ label: "30-yr cost", value: `$${num(life)}` }, { label: "Durability", value: c ? "high (cement)" : `${num(5 - m.energyScore * 0.6, 1)}/5` }]; },
};
function simMetrics(m: SimModel, sim: SimName, cement: boolean, fr: Framing): SimMetric[] { return METRICS[sim](m, drivers(m, fr), cement, fr); }

export type SimStatus = "PASS" | "WATCH";
/** A per-sim ESTIMATE on one model at a framing: a 0–5 initial score (+ star rounding), a status, and detailed metrics. */
export interface SimResult { sim: SimName; score: number; stars: number; status: SimStatus; metrics: SimMetric[]; }
export function simResult(modelId: string, sim: SimName, framing?: Framing): SimResult {
  const m = modelById(modelId);
  if (!m) return { sim, score: 0, stars: 0, status: "WATCH", metrics: [] };
  const fr = framing ?? m.framing;
  const cement = fr === "3d-printed-cement";
  const raw = rawScore(m, sim, fr) + (cement ? (CEMENT_DELTA[sim] ?? 0) : 0);
  const score = Math.round(clamp(raw, 0, 5) * 10) / 10;       // 0.0 .. 5.0, one decimal, deterministic
  return { sim, score, stars: Math.round(score), status: score >= 3 ? "PASS" : "WATCH", metrics: simMetrics(m, sim, cement, fr) };
}

/** Run the WHOLE original battery on a model at a framing (defaults to the model's native framing). */
export function runBattery(modelId: string, framing?: Framing): SimResult[] { return SIMS.map((s) => simResult(modelId, s, framing)); }

/** A model's average 0–5 across the 13 sims — the single-number "simulation readiness" for the summary ranking. */
export function overallScore(modelId: string, framing?: Framing): number {
  const b = runBattery(modelId, framing);
  if (!b.length) return 0;
  return Math.round((b.reduce((s, r) => s + r.score, 0) / b.length) * 10) / 10;
}

// ── the SIDE-BY-SIDE matrix: 13 rows × 3 models (each at its own native framing unless one is forced), per-row winner ──
export interface SimMatrixCell { modelId: string; label: string; score: number; stars: number; status: SimStatus; metrics: SimMetric[]; }
export interface SimMatrixRow { sim: SimName; cells: SimMatrixCell[]; winnerId: string; }
export function simMatrix(models: SimModel[] = SIM_MODELS, framingBy?: Record<string, Framing>): SimMatrixRow[] {
  // ONE matrix path — the component consumes this (no inline re-implementation to drift from the gated one — Sofia).
  // framingBy maps each model to its toggled framing; absent → each model at its native framing.
  return SIMS.map((sim) => {
    const cells: SimMatrixCell[] = models.map((m) => {
      const r = simResult(m.id, sim, framingBy?.[m.id]);
      return { modelId: m.id, label: m.label, score: r.score, stars: r.stars, status: r.status, metrics: r.metrics };
    });
    const winner = cells.reduce((a, b) => (b.score > a.score ? b : a));
    return { sim, cells, winnerId: winner.modelId };
  });
}

// ── TIME TO BUILD, BY PHASE (operator 2026-10-27: "so others can plug and play to our demo for design work to
//    understand time to build framing electrical plumbing etc"). The build time split across the eight construction
//    phases (DEV_PHASES, in build order). 3D cement print collapses the Framing phase (the printed shell goes up fast)
//    and speeds Roofing, shifting the share to the MEP + finish phases — the visible payoff of printing a home. ──
const PHASE_WEIGHTS: Record<Framing, Record<string, number>> = {
  // each framing's share of the total build, summing to 1 across the eight phases
  "stick-framed":      { foundation: 0.15, framing: 0.24, electrical: 0.14, plumbing: 0.12, sewer: 0.07, internet: 0.05, security: 0.05, roofing: 0.18 },
  "3d-printed-cement": { foundation: 0.18, framing: 0.10, electrical: 0.16, plumbing: 0.14, sewer: 0.08, internet: 0.06, security: 0.06, roofing: 0.22 },
};
// per-FORM tweak so the hex dome's schedule reads differently from the rectilinear Cube (Pangu): the dome IS the
// roof+wall (roofing heavier, framing lighter); the open plan frames fast. Added to the framing weights, then renormalized.
const FORM_PHASE_TWEAK: Record<string, Record<string, number>> = {
  "eco-sphere": { roofing: +0.06, framing: -0.03, foundation: -0.03 },
  "tiny":       { framing: -0.04, electrical: +0.02, plumbing: +0.02 },
  "3x3-grid":   {},
};
export interface PhaseTime { id: string; label: string; color: string; weeks: number; }
/** The build time split across the eight construction phases for a model at a framing (weeks per phase; the eight sum
 *  EXACTLY to the rounded total — Sofia). Per-form weighting differentiates the hex dome from the Cube (Pangu). */
export function phaseSchedule(modelId: string, framing?: Framing): PhaseTime[] {
  const m = modelById(modelId);
  if (!m) return [];
  const fr = framing ?? m.framing;
  const totalWeeks = Math.round(monthsFor(m, fr) * 4.345 * 2) / 2;   // the total the bars must sum to (0.5-wk resolution)
  const tweak = FORM_PHASE_TWEAK[m.id] ?? {};
  const raw = DEV_PHASES.map((p) => Math.max(0, (PHASE_WEIGHTS[fr][p.id] ?? 0) + (tweak[p.id] ?? 0)));
  const sumW = raw.reduce((s, x) => s + x, 0) || 1;
  const weeks = raw.map((x) => Math.round((totalWeeks * x / sumW) * 2) / 2);
  // normalize the LAST phase to the remainder so the eight weeks sum EXACTLY to the shown total (Sofia)
  const drift = Math.round((totalWeeks - weeks.reduce((s, x) => s + x, 0)) * 2) / 2;
  weeks[weeks.length - 1] = Math.max(0, weeks[weeks.length - 1] + drift);
  return DEV_PHASES.map((p, i) => ({ id: p.id, label: p.label, color: p.color, weeks: weeks[i] }));
}

// ── one reconciled recommendation, not a per-axis scoreboard (Asar) — the balanced all-rounder across the 13 sims ──
export interface Recommendation { modelId: string; label: string; avg: number; reason: string; }
export function recommendation(models: SimModel[] = SIM_MODELS, framingBy?: Record<string, Framing>): Recommendation {
  const fr = (m: SimModel): Framing => framingBy?.[m.id] ?? m.framing;
  const best = models.reduce((a, b) => (overallScore(b.id, fr(b)) > overallScore(a.id, fr(a)) ? b : a));
  const avg = overallScore(best.id, fr(best));
  // DISCLOSE BASIS in the verdict (Asar): the winner may be an ASSUMED/parametric form, while the only engine-DERIVED
  // cost is the Cube — the buyer must know which number to trust, not just see the badge on the card.
  const basisNote = best.basis === "DERIVED" ? "engine-derived cost" : "ASSUMED · parametric (only the Cube's cost is engine-derived)";
  return {
    modelId: best.id, label: best.label, avg,
    reason: `highest 13-sim average (${avg.toFixed(1)}/5) · basis ${best.basis} — ${basisNote}. A balanced estimate, not a quote.`,
  };
}
