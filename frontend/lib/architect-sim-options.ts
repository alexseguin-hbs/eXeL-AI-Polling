/**
 * ARCHITECT-2525 · SIMULATE — ALTERNATIVE DESIGN OPTIONS (operator 2026-10-25/27/28).
 * ============================================================================================================
 * THREE ways to build a home — Cube (3×3 grid, 900 ft²) · Tiny Home (a real standard 8.5×40 ft THOW ≈340 ft²) ·
 * Eco-Sphere (7-hex dome, 900 ft²). Pressing a form's SIMULATE generates its environment AND runs the SAME original
 * 13-sim battery, scored 0–5 with detailed metrics; the matrix scores them side by side; COMPARE gives one pick.
 *
 * Each form carries a BUILD OPTION with four dimensions the buyer can change (operator 2026-10-27 SAVE-FEEDBACK):
 *   • method        — Stick-framed · 3D Print (the ICON hook; the Eco-Sphere prints natively).
 *   • printMaterial — Cement · Composite ("more coming") — strength / cost / carbon differ (only when 3D Print).
 *   • frameMaterial — Wood · Steel · Aluminum — cost / strength / carbon differ (only when Stick-framed).
 *   • roof          — Gable · Hip · Flat (rectilinear) · Hex-panel dome (Eco-Sphere) — cost + Wind/Thermal differ.
 *
 * PRODUCT TRUTH — ONE ENGINE: every cost DERIVES from the real estimate engine (DEFAULT_SECTIONS), area-scaled and
 * adjusted by the chosen option, so the per-element breakdown always reconciles EXACTLY to the card total (no blanket
 * fudge factor). The Cube at its native option = the engine's $440,000 unchanged. Tiny + Eco are DECLARED PARAMETRIC
 * (ASSUMED area/months/envelope). Scores are a deterministic design PREVIEW (no Date.now/Math.random), not an
 * engineering analysis. Energy/Carbon are DESIGN ASSUMPTIONS. Material strength/carbon figures are vendor ESTIMATES.
 */
import { DEFAULT_SECTIONS } from "@/lib/architect-estimate";
import { DEV_PHASES } from "@/lib/architect-phases";
import type { FormId } from "@/lib/architect-sim-environment";

// The ORIGINAL 13-sim battery (exact list) — the single source; every model runs all of it.
export const SIMS = [
  "Structural", "Wind", "Flood", "Fire", "Earthquake", "Thermal", "Solar",
  "Water Flow", "HVAC", "Evacuation", "Accessibility", "Carbon", "Lifecycle",
] as const;
export type SimName = (typeof SIMS)[number];

// ── the four build dimensions ─────────────────────────────────────────────────────────────────────────────────────
export type Method = "stick-framed" | "3d-print" | "hex-panel";
export type PrintMaterial = "cement" | "composite";
// operator 2026-10-28 (IMG-07): "wood, aluminum studs, steel reinforced 4 corners or all steel … Voortman cut and holes
// automated with steel cutting machine plasma cutter." Four frame materials; the two steel options carry the automated-fab note.
export type FrameMaterial = "wood" | "aluminum" | "steel-corners" | "all-steel";
export type RoofType = "gable" | "hip" | "flat" | "hex-dome";
export type LaborMode = "pro" | "mixed" | "volunteer";

export interface BuildOption { method: Method; printMaterial: PrintMaterial; frameMaterial: FrameMaterial; roof: RoofType; }

// operator 2026-10-28 (IMG-01): "Frame (not Stick). Use conventional CAD AND ARCHITECTURE LANGUAGE." The method reads
// "Frame" (conventional framed construction) — the frame MATERIAL (wood/aluminum/steel) is the sub-selection below.
export const METHODS: Record<Method, { label: string; short: string; blurb: string }> = {
  "stick-framed": { label: "Frame",          short: "FRAME",    blurb: "Conventional framed construction (wood, aluminum, or steel studs) — the industry-standard structural frame." },
  "3d-print":     { label: "3D Print",       short: "3D PRINT", blurb: "Printed monolithic walls — fast shell, non-combustible, durable; the print material sets strength/carbon." },
  "hex-panel":    { label: "Hex-panel shell", short: "HEX PANEL", blurb: "Prefab geodesic hex panels bolted at hubs — the Eco-Sphere's native shell; fast dry assembly, aerodynamic (operator: \"Hex Panels for Shell of Eco-Sphere\")." },
};
/** Which construction methods each form offers — the Eco-Sphere dome is built with hex panels or printed cement (never
 *  stick-framed); the rectilinear forms are stick-framed or printed. */
export const METHODS_FOR: Record<FormId, Method[]> = {
  "3x3-grid": ["stick-framed", "3d-print"],
  "tiny":     ["stick-framed", "3d-print"],
  "eco-sphere": ["hex-panel", "3d-print"],
};
/** The hex-panel shell's FRAMING-element material / labour multipliers (prefab panels — more material, far less site labour). */
const HEX_PANEL_MAT_FACTOR = 1.05, HEX_PANEL_LABOR_FACTOR = 0.6;
/** 3D-Print materials (operator: "Cement, composite, and future selections of varying strengths"). matFactor/laborFactor
 *  apply to the FRAMING element (printing adds material but is machine time — big labour saving); carbonStar shifts the
 *  headline carbon. ESTIMATE. */
export const PRINT_MATERIALS: Record<PrintMaterial, { label: string; short: string; blurb: string; matFactor: number; laborFactor: number; carbonStar: number; strength: string }> = {
  cement:    { label: "Cement",    short: "CEMENT",    blurb: "Monolithic printed cement — very strong, non-combustible; high embodied carbon.", matFactor: 1.1, laborFactor: 0.35, carbonStar: -1, strength: "~6 ksi compressive (vendor) vs 2–3.5 ksi standard" },
  composite: { label: "Composite", short: "COMPOSITE", blurb: "Printed polymer-mineral composite — ~5× stronger, ~30% lighter, ~50% less embodied carbon than cement (vendor).", matFactor: 1.4, laborFactor: 0.35, carbonStar: 0, strength: "~5× stronger, ~30% lighter than cement (vendor)" },
};
/** Future print materials — shown DISABLED in the dropdown so the "more coming" the operator asked for is visible. */
export const FUTURE_PRINT_MATERIALS: { label: string; note: string }[] = [
  { label: "Geopolymer", note: "low-carbon cement alternative — coming" },
  { label: "Hempcrete", note: "carbon-negative infill — coming" },
];
/** Frame materials (operator IMG-07: wood · aluminum studs · steel-reinforced 4 corners · all-steel; the steel options are
 *  Voortman-style automated plasma-cut/drilled fabrication). matFactor scales the FRAMING element's MATERIAL cost; laborFactor
 *  scales its LABOR hours (automated steel cuts shop-labour but adds material); each also nudges a few sims. */
export const FRAME_MATERIALS: Record<FrameMaterial, { label: string; short: string; blurb: string; matFactor: number; laborFactor: number; spec: string; voortman?: boolean }> = {
  wood:          { label: "Wood",            short: "WOOD",  blurb: "Dimensional lumber — lowest cost, ductile, fast to raise; the default.", matFactor: 1.0, laborFactor: 1.0, spec: "2×4 / 2×6 studs @16\" o.c., double top plate" },
  aluminum:      { label: "Aluminum studs",  short: "ALUM",  blurb: "Aluminum studs — corrosion-resistant, lightest; highest material cost, specialty crews.", matFactor: 1.8, laborFactor: 1.1, spec: "aluminium stud wall, bolted connections" },
  "steel-corners": { label: "Steel-reinforced corners", short: "STEEL×4", blurb: "Wood/light-steel walls with steel-reinforced four corners — stronger load path at modest added cost (Voortman-cut steel posts).", matFactor: 1.3, laborFactor: 0.95, spec: "4 corner steel posts + conventional infill; Voortman plasma-cut", voortman: true },
  "all-steel":   { label: "All-steel",       short: "ALL-STEEL", blurb: "Full light-gauge steel frame — non-combustible, precise, fast on site; shop-fabricated (Voortman automated cut + holes).", matFactor: 1.6, laborFactor: 0.75, spec: "16–18 ga steel studs @16\" o.c.; Voortman automated cut/drill", voortman: true },
};
/** Roof types (operator: "different roof options for Cube, Tiny Home, 3D Print" + "show HEX roof"). costFactor applies
 *  to the ROOFING element; windDelta/thermalDelta nudge those two sims. */
export const ROOFS: Record<RoofType, { label: string; short: string; blurb: string; costFactor: number; windDelta: number; thermalDelta: number }> = {
  gable:      { label: "Gable",          short: "GABLE", blurb: "Pitched twin-slope — sheds water, simple, vented attic.", costFactor: 1.0,  windDelta: 0,    thermalDelta: 0 },
  hip:        { label: "Hip",            short: "HIP",   blurb: "Four-slope — best wind resistance of the pitched roofs; more framing.", costFactor: 1.12, windDelta: +0.4, thermalDelta: 0 },
  flat:       { label: "Flat / shed",    short: "FLAT",  blurb: "Low-slope membrane (TPO/EPDM) — cheapest, roof-deck ready; needs good drainage.", costFactor: 0.9, windDelta: -0.2, thermalDelta: -0.1 },
  "hex-dome": { label: "Hex-panel dome", short: "HEX DOME", blurb: "Geodesic hex panels — aerodynamic, self-draining dome shell; waterproofing is the key risk.", costFactor: 1.25, windDelta: +0.6, thermalDelta: +0.3 },
};
/** Which roofs each form offers (the hex dome is the Eco-Sphere's integral roof). */
export const ROOFS_FOR: Record<FormId, RoofType[]> = {
  "3x3-grid": ["gable", "hip", "flat"],
  "tiny":     ["gable", "flat"],
  "eco-sphere": ["hex-dome"],
};

export type Basis = "DERIVED" | "ASSUMED";
export interface SimModel {
  id: FormId;
  label: string;
  form: string;            // the build form (how it is put together)
  areaFt2: number;         // Cube/Eco 900; Tiny a real standard 340
  rooms: number;           // the form's room/zone count
  layoutLabel: string;     // the honest room voice for the card so card ⇄ environment agree (Aset)
  native: BuildOption;     // the option the card opens with
  stickMonths: number;     // base build months at stick framing (the total the method/area factors apply to)
  energyScore: number;     // 1..5 (higher = more efficient envelope) — a DESIGN ASSUMPTION
  carbonScore: number;     // 1..5 (higher = lower OPERATING carbon) — a DESIGN ASSUMPTION
  basis: Basis;            // DERIVED = engine; ASSUMED = parametric
  note: string;
}

export const SIM_MODELS: SimModel[] = [
  {
    id: "3x3-grid", label: "Cube", form: "3×3 grid · 9 rooms · 900 ft²", areaFt2: 900, rooms: 9, layoutLabel: "9 rooms",
    native: { method: "stick-framed", printMaterial: "cement", frameMaterial: "wood", roof: "gable" },
    stickMonths: 7, energyScore: 3, carbonScore: 3, basis: "DERIVED",
    note: "The standard home — nine rooms on a 3×3 grid; cost DERIVED from the estimate engine (DEFAULT_SECTIONS).",
  },
  {
    id: "tiny", label: "Tiny Home", form: "8.5 × 24 ft · standard THOW", areaFt2: 204, rooms: 5, layoutLabel: "5 zones",
    native: { method: "stick-framed", printMaterial: "cement", frameMaterial: "wood", roof: "gable" },
    stickMonths: 3, energyScore: 4, carbonScore: 4, basis: "ASSUMED",
    note: "A real standard tiny home on a trailer — 8.5×24 ft (~204 ft²). Size chosen from the industry consensus across ~30 THOW builds: road-legal 8.5 ft wide, length 24 ± ~5 ft (common 20–30 ft). ASSUMED, parametric.",
  },
  {
    id: "eco-sphere", label: "Eco-Sphere", form: "7 hexagons · hex-panel dome · 900 ft²", areaFt2: 900, rooms: 7, layoutLabel: "7 hex · 9 rooms",
    native: { method: "hex-panel", printMaterial: "cement", frameMaterial: "wood", roof: "hex-dome" },
    stickMonths: 7, energyScore: 5, carbonScore: 5, basis: "ASSUMED",
    note: "Nine rooms' furniture across 7 hexagons (1 centre + 6) under a hex-panel dome; convertible to a 3D-printed cement shell — ASSUMED, parametric.",
  },
];

export const modelById = (id: string | null | undefined): SimModel | null => SIM_MODELS.find((m) => m.id === id) ?? null;
/** The build option for a model, with optional overrides merged over its native option. */
export function optFor(m: SimModel, override?: Partial<BuildOption>): BuildOption { return { ...m.native, ...(override ?? {}) }; }

// ── the ONE cost engine — MATERIAL + LABOR + MARKUP, derived from DEFAULT_SECTIONS (operator 2026-10-28, IMG-02/06) ─────
// Each engine section's costUsd is a MARKET PRICE = (Material + Labor@pro) × (1 + BAKED_MARKUP). We decompose it so a buyer
// SEES Material · Labor · Markup, drives Labor down with volunteers (friends/family/veterans) and Markup down for a community
// build — "shine light + optimise each step as a team." At the NATIVE default (Pro labour, 50% markup) every figure reconciles
// EXACTLY to the engine (Cube = $440,000); switch to Volunteer + 0% markup and a 204 ft² Tiny reads ~$40k (the operator's number).
const SECTION = (id: string): number => DEFAULT_SECTIONS.find((s) => s.id === id)?.costUsd ?? 0;
const ALL_SECTION_IDS = DEFAULT_SECTIONS.map((s) => s.id);
const BASE_COST = DEFAULT_SECTIONS.reduce((s, w) => s + w.costUsd, 0);   // $440,000 (the Cube at native option + DEFAULT_COST)
const r100 = (n: number): number => Math.round(n / 100) * 100;

const BAKED_MARKUP = 0.5;        // contractor markup already implied in the engine costUsd → native stays the DERIVED $440k
const MATERIAL_FRACTION = 0.30;  // material's share of the pre-markup basis (labour = the rest); calibrated so a volunteer-built,
                                 // zero-markup 204 ft² tiny lands ~$40k (the real-world figure the operator cited)
/** WHO builds — the labour-cost lever (friends/family/veterans ⇒ donated labour ⇒ ≈ $0). */
export const LABOR_MODES: Record<LaborMode, { label: string; short: string; blurb: string; scale: number }> = {
  pro:       { label: "Pro crew",              short: "PRO",       blurb: "Licensed paid trades at market labour rates — a full contractor build.", scale: 1.0 },
  mixed:     { label: "Mixed (pro + helpers)", short: "MIXED",     blurb: "Key trades paid, the rest friends/family/helpers — roughly half the labour cost.", scale: 0.5 },
  volunteer: { label: "Volunteer build",       short: "VOLUNTEER", blurb: "Built with friends, family & veterans — donated labour (Vision-2525); labour cost ≈ $0.", scale: 0.0 },
};
export interface CostParams { laborMode: LaborMode; markup: number; }
export const DEFAULT_COST: CostParams = { laborMode: "pro", markup: BAKED_MARKUP };
/** The markup a cost view opens with for each labour mode — a Pro contractor build carries the full 50% margin; a mixed
 *  build half; a VOLUNTEER build (friends · family · veterans) opens at 0% so the one-tap headline is the true cost of the
 *  materials (operator 2026-10-28: the ~$40k friends/family/veterans Tiny). The buyer can still drag the markup back up. */
export function defaultMarkupFor(mode: LaborMode): number { return mode === "volunteer" ? 0 : mode === "mixed" ? 0.25 : BAKED_MARKUP; }

// the six MAJOR elements the operator asked to compare, mapped 1:1 to the engine's work sections
export const ELEMENTS = ["Foundation", "Framing", "Electrical", "Plumbing", "HVAC", "Roofing"] as const;
export type ElementName = (typeof ELEMENTS)[number];
const ELEMENT_SECTION: Record<ElementName, string> = { Foundation: "found", Framing: "frame", Electrical: "elec", Plumbing: "plumb", HVAC: "hvac", Roofing: "roof" };

/** Area scale with a fixed-cost floor (a small home never costs zero to build): 0.30 + 0.70 × (ft²/900). Cube = 1.0. */
const areaFactor = (m: SimModel): number => 0.30 + 0.70 * (m.areaFt2 / 900);
/** The shell (frame) section's MATERIAL multiplier by method: print material, hex-panel, or frame material. */
function frameMatFactor(opt: BuildOption): number {
  if (opt.method === "3d-print") return PRINT_MATERIALS[opt.printMaterial].matFactor;
  if (opt.method === "hex-panel") return HEX_PANEL_MAT_FACTOR;
  return FRAME_MATERIALS[opt.frameMaterial].matFactor;
}
/** The shell (frame) section's LABOUR multiplier by method (3D Print / all-steel shop-fab cut site labour). */
function frameLaborFactor(opt: BuildOption): number {
  if (opt.method === "3d-print") return PRINT_MATERIALS[opt.printMaterial].laborFactor;
  if (opt.method === "hex-panel") return HEX_PANEL_LABOR_FACTOR;
  return FRAME_MATERIALS[opt.frameMaterial].laborFactor;
}
/** Legacy single multiplier (material×labour share) kept for callers that want a frame-section scalar. */
export function framingFactor(opt: BuildOption): number { return frameMatFactor(opt) * MATERIAL_FRACTION + frameLaborFactor(opt) * (1 - MATERIAL_FRACTION); }

/** One section split into pre-markup Material + Labor@pro ($), area-scaled + option-adjusted. */
function sectionSplit(m: SimModel, sectionId: string, opt: BuildOption): { material: number; laborPro: number } {
  const basis = SECTION(sectionId) / (1 + BAKED_MARKUP);
  let material = basis * MATERIAL_FRACTION * areaFactor(m);
  let laborPro = basis * (1 - MATERIAL_FRACTION) * areaFactor(m);
  if (sectionId === "frame") { material *= frameMatFactor(opt); laborPro *= frameLaborFactor(opt); }
  if (sectionId === "roof")  { const rf = ROOFS[opt.roof].costFactor; material *= rf; laborPro *= rf; }
  return { material, laborPro };
}
export interface CostSplit { material: number; labor: number; markup: number; total: number; }
/** Material + Labor + Markup for one section at a cost view (labour mode scales labour; markup on the sub-total). */
function sectionPrice(m: SimModel, sectionId: string, opt: BuildOption, cost: CostParams): CostSplit {
  const { material, laborPro } = sectionSplit(m, sectionId, opt);
  const labor = laborPro * LABOR_MODES[cost.laborMode].scale;
  const sub = material + labor;
  const markup = sub * cost.markup;
  return { material, labor, markup, total: sub + markup };
}
/** Whole-build Material / Labor / Markup rollup (for the waterfall: Material → +Labor → +Markup → Total). The total is the
 *  SUM of the $100-rounded parts so the card total, the waterfall total, and the three bars always reconcile exactly (Aset). */
export function costRollup(m: SimModel, opt: BuildOption, cost: CostParams = DEFAULT_COST): CostSplit {
  let material = 0, labor = 0, markup = 0;
  for (const id of ALL_SECTION_IDS) { const p = sectionPrice(m, id, opt, cost); material += p.material; labor += p.labor; markup += p.markup; }
  const M = r100(material), L = r100(labor), K = r100(markup);
  return { material: M, labor: L, markup: K, total: M + L + K };
}
/** The full-build cost for a model at an option + cost view. Cube @ native + DEFAULT_COST = exactly $440,000; and it always
 *  equals the Material+Labor+Markup rollup total (one number, no card-vs-waterfall drift). */
export function costFor(m: SimModel, opt: BuildOption, cost: CostParams = DEFAULT_COST): number {
  return costRollup(m, opt, cost).total;
}
/** Build time (months) for a model at an option — 3D Print collapses the shell (cement ×0.6, composite ×0.55); the
 *  prefab hex-panel shell assembles fast too (×0.7); stick framing is the ×1.0 baseline. */
function methodMonthsFactor(opt: BuildOption): number {
  if (opt.method === "3d-print") return opt.printMaterial === "composite" ? 0.55 : 0.6;
  if (opt.method === "hex-panel") return 0.7;
  return 1.0;
}
export function monthsFor(m: SimModel, opt: BuildOption): number { return Math.max(1, Math.round(m.stickMonths * methodMonthsFactor(opt))); }

// ── cost BY ELEMENT with the Material/Labor/Markup split (operator IMG-02/06: "toggle on Material + Labor + Markup") ───
export interface ElementCost { element: ElementName; material: number; labor: number; markup: number; usd: number; }
/** The six major elements priced from the SAME engine sections as the card cost (so they reconcile), each split into
 *  Material / Labor / Markup at the chosen cost view. */
export function elementCosts(m: SimModel, opt: BuildOption, cost: CostParams = DEFAULT_COST): ElementCost[] {
  return ELEMENTS.map((el) => { const p = sectionPrice(m, ELEMENT_SECTION[el], opt, cost);
    const material = r100(p.material), labor = r100(p.labor), markup = r100(p.markup);
    // usd is the SUM of the $100-rounded parts (not r100(total)) so each row's total equals its shown M+L+Markup AND the
    // six elements + the Other remainder reconcile exactly to the whole-build rollup at EVERY cost view (fleet fix).
    return { element: el, material, labor, markup, usd: material + labor + markup }; });
}
export function elementSubtotal(m: SimModel, opt: BuildOption, cost: CostParams = DEFAULT_COST): number { return elementCosts(m, opt, cost).reduce((s, e) => s + e.usd, 0); }

// The engine has ten work sections; the six MAJOR elements above are what the buyer compares + builds. The other four
// (site·permits · drywall·insulation · interior finish · landscaping) are real cost too — so we surface them as ONE honest
// "Other" remainder row whose channels are the whole-build rollup MINUS the six elements. Six elements + remainder then
// reconcile EXACTLY to the card total and the Material/Labor/Markup waterfall — closing the "$159k unexplained" gap the
// 48-AsM fleet flagged as the demo's top defect (an ICON estimator must see every dollar land).
export const REMAINDER_LABEL = "Site · drywall · finish · landscaping";
export interface RemainderCost { label: string; material: number; labor: number; markup: number; usd: number; }
export interface CostBreakdown { elements: ElementCost[]; remainder: RemainderCost; total: CostSplit; }
export function costBreakdown(m: SimModel, opt: BuildOption, cost: CostParams = DEFAULT_COST): CostBreakdown {
  const elements = elementCosts(m, opt, cost);
  const total = costRollup(m, opt, cost);
  const sum = (k: "material" | "labor" | "markup") => elements.reduce((s, e) => s + e[k], 0);
  const material = total.material - sum("material");
  const labor = total.labor - sum("labor");
  const markup = total.markup - sum("markup");
  return { elements, remainder: { label: REMAINDER_LABEL, material, labor, markup, usd: material + labor + markup }, total };
}

/** Headline (envelope + embodied) carbon score 1..5 at an option — 3D-Print cement & aluminium frame cost a star for
 *  embodied carbon (the trade-off a carbon interviewer scrutinises — Thor); composite / steel / wood do not. */
export function carbonFor(m: SimModel, opt: BuildOption): number {
  const penalty = opt.method === "3d-print"
    ? PRINT_MATERIALS[opt.printMaterial].carbonStar
    : opt.method === "hex-panel" ? 0                 // prefab hex panels — no embodied-carbon penalty
    : opt.frameMaterial === "aluminum" ? -1 : 0;     // aluminium = high embodied carbon
  return Math.max(1, Math.min(5, Math.round(m.carbonScore + penalty)));
}

// ── COMPARE ALL — rank by each headline metric at each form's CURRENT option; flag the winner ──────────────────────
export interface MetricRank { metric: string; unit: string; lowerIsBetter: boolean; winnerId: string; values: { id: string; value: number }[]; }
export function compareModels(models: SimModel[] = SIM_MODELS, optsBy?: Record<string, BuildOption>): MetricRank[] {
  const op = (m: SimModel): BuildOption => optsBy?.[m.id] ?? m.native;   // OPTION-AWARE — the dropdowns reach COMPARE
  const metric = (name: string, unit: string, lowerIsBetter: boolean, pick: (m: SimModel) => number): MetricRank => {
    const values = models.map((m) => ({ id: m.id, value: pick(m) }));
    const best = values.reduce((a, b) => (lowerIsBetter ? (b.value < a.value ? b : a) : (b.value > a.value ? b : a)));
    return { metric: name, unit, lowerIsBetter, winnerId: best.id, values };
  };
  return [
    metric("Cost", "USD", true, (m) => costFor(m, op(m))),
    metric("Build time", "months", true, (m) => monthsFor(m, op(m))),
    metric("Energy", "score", false, (m) => m.energyScore),
    metric("Carbon", "score", false, (m) => carbonFor(m, op(m))),
  ];
}

// ── the per-sim 0–5 scoring (deterministic, principled — a DESIGN PREVIEW, not an engineering result) ────────────
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

type DriverKey = "env" | "carb" | "compact" | "spacious" | "conv" | "curved" | "afford";
function drivers(m: SimModel, opt: BuildOption): Record<DriverKey, number> {
  return {
    env: m.energyScore,
    carb: m.carbonScore,
    compact: clamp(6 - m.areaFt2 / 200, 1, 5),           // smaller footprint → higher (Tiny leads)
    spacious: clamp(m.areaFt2 / 200, 1, 5),              // more area → higher (ADA clearances)
    conv: m.id === "3x3-grid" ? 5 : m.id === "tiny" ? 4 : 2,   // rectilinear = most code-conventional
    curved: m.id === "eco-sphere" ? 5 : m.id === "tiny" ? 3 : 2, // aerodynamic/curved dome resilience
    afford: clamp(6 - costFor(m, opt) / 110000, 1, 5),   // cheaper → higher — OPTION-AWARE
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

function rawScore(m: SimModel, sim: SimName, opt: BuildOption): number {
  const d = drivers(m, opt);
  const w = SIM_WEIGHTS[sim];
  let s = 0;
  (Object.keys(w) as DriverKey[]).forEach((k) => { s += d[k] * (w[k] as number); });
  return s;
}

/** The method + material per-sim shift (honest, both-sided). 3D Print: cement = strength/fire/durability ↑, mass → seismic
 *  ↓, embodied carbon ↓↓; composite = stronger + lighter (seismic ↑), far less carbon penalty. Stick: steel/aluminium add
 *  structural/seismic/corrosion but cost embodied carbon. DURABILITY only on Lifecycle (cost already reaches it via `afford`). */
function methodDelta(sim: SimName, opt: BuildOption): number {
  if (opt.method === "3d-print") {
    const cement = opt.printMaterial === "cement";
    const d: Partial<Record<SimName, number>> = {
      Structural: cement ? +0.7 : +0.9,
      Wind: +0.5,
      Fire: cement ? +1.0 : +0.7,
      Thermal: cement ? +0.4 : +0.5,
      Lifecycle: cement ? +0.2 : +0.3,
      Earthquake: cement ? -0.3 : +0.2,
      Carbon: cement ? -0.9 : -0.2,
    };
    return d[sim] ?? 0;
  }
  if (opt.method === "hex-panel") {
    // prefab geodesic hex-panel shell — aerodynamic, light, well-sealed; honest both-sided (good wind/thermal, light seismic)
    const d: Partial<Record<SimName, number>> = {
      Structural: +0.5, Wind: +0.6, Thermal: +0.4, Earthquake: +0.3, Lifecycle: +0.2, Carbon: -0.1,
    };
    return d[sim] ?? 0;
  }
  const alum = opt.frameMaterial === "aluminum";
  const allSteel = opt.frameMaterial === "all-steel", steelCorners = opt.frameMaterial === "steel-corners";
  const steel = allSteel || steelCorners;   // any steel content
  const d: Partial<Record<SimName, number>> = {
    Structural: allSteel ? +0.5 : steelCorners ? +0.3 : alum ? +0.3 : 0,   // steel-reinforced corners strengthen the load path
    Earthquake: alum ? +0.4 : steel ? +0.2 : 0,   // lighter/ductile metal → better seismic
    Fire: steel ? +0.3 : alum ? +0.1 : 0,          // steel non-combustible
    Flood: alum ? +0.3 : steel ? +0.2 : 0,         // metal frames resist rot/corrosion
    Lifecycle: alum ? +0.3 : steel ? +0.2 : 0,
    Carbon: alum ? -0.4 : steel ? -0.2 : 0,        // higher embodied carbon
  };
  return d[sim] ?? 0;
}
/** The roof's per-sim shift — Wind + Thermal only (the hex dome is aerodynamic + well-insulated; flat roofs lose a little). */
function roofDelta(sim: SimName, opt: BuildOption): number {
  if (sim === "Wind") return ROOFS[opt.roof].windDelta;
  if (sim === "Thermal") return ROOFS[opt.roof].thermalDelta;
  return 0;
}

// ── detailed per-sim metrics (2 each, deterministic, labelled ESTIMATE) — exhaustive Record (Odin) ──────────────────
export interface SimMetric { label: string; value: string; }
const num = (x: number, digits = 0): string => x.toLocaleString("en-US", { maximumFractionDigits: digits });

const METRICS: Record<SimName, (m: SimModel, d: Record<DriverKey, number>, opt: BuildOption) => SimMetric[]> = {
  "Structural":    (m, d, o) => { const printed = o.method === "3d-print"; const steel = o.frameMaterial === "all-steel" || o.frameMaterial === "steel-corners"; return [{ label: "Load margin", value: `${num(20 + d.conv * 8 + d.curved * 4 + (printed ? 15 : steel ? 8 : 0))}%` }, { label: "Wall system", value: printed ? `printed ${PRINT_MATERIALS[o.printMaterial].label.toLowerCase()}` : o.method === "hex-panel" ? "hex-panel shell" : `frame · ${FRAME_MATERIALS[o.frameMaterial].label.toLowerCase()}` }]; },
  "Wind":          (m, d, o) => [{ label: "Design wind", value: `${num(100 + d.curved * 8 + (o.method === "3d-print" ? 15 : 0) + ROOFS[o.roof].windDelta * 10)} mph` }, { label: "Roof", value: ROOFS[o.roof].label }],
  "Flood":         (m, d, o) => { const steel = o.frameMaterial === "all-steel" || o.frameMaterial === "steel-corners"; return [{ label: "Freeboard", value: `${num(1 + d.compact * 0.4, 1)} ft` }, { label: "Frame", value: o.method === "3d-print" ? "printed (no stud rot)" : o.method === "hex-panel" ? "panel (sealed)" : o.frameMaterial === "aluminum" ? "aluminium (corrosion ✓)" : steel ? "steel (corrosion ✓)" : "wood" }]; },
  "Fire":          (m, d, o) => { const steel = o.frameMaterial === "all-steel" || o.frameMaterial === "steel-corners"; return [{ label: "Egress time", value: `${num(120 - d.compact * 10 - d.conv * 5)} s` }, { label: "Wall rating", value: o.method === "3d-print" ? "non-combustible" : steel ? "non-combustible (steel)" : `${num(20 + d.conv * 8)} min` }]; },
  "Earthquake":    (m, d, o) => { const heavy = o.method === "3d-print" && o.printMaterial === "cement"; return [{ label: "Drift ratio", value: `${num(2.4 - d.curved * 0.25, 2)}%` }, { label: "System", value: heavy ? "mass (ductility ↓)" : o.method === "3d-print" ? "composite (light)" : `ductility ${num(d.curved, 1)}/5` }]; },
  "Thermal":       (m, _d, o) => [{ label: "Envelope", value: `R-${num(13 + m.energyScore * 6 + (o.method === "3d-print" ? 4 : 0) + ROOFS[o.roof].thermalDelta * 6)}` }, { label: "Mass", value: o.method === "3d-print" ? (o.printMaterial === "cement" ? "high (cement)" : "medium (composite)") : `${m.energyScore}/5 (assumed)` }],
  "Solar":         (m, _d, o) => { const roof = Math.round(m.areaFt2 * (m.id === "eco-sphere" ? 0.6 : m.id === "tiny" ? 0.4 : 0.5)); return [{ label: "Roof solar area", value: `${num(roof)} ft²` }, { label: "Annual yield", value: `${num(roof * 15)} kWh` }]; },
  "Water Flow":    (m, d) => [{ label: "Peak demand", value: `${num((m.id === "tiny" ? 5 : 9) * 2.5, 1)} GPM` }, { label: "Pressure margin", value: `${num(10 + d.conv * 4)} psi` }],
  "HVAC":          (m) => { const tons = m.areaFt2 / (400 + m.energyScore * 60); return [{ label: "Cooling load", value: `${num(tons, 1)} tons` }, { label: "System", value: m.id === "tiny" ? "ductless mini-split" : "ducted (Manual J)" }]; },
  "Evacuation":    (m, d) => [{ label: "Egress travel", value: `${num(20 + m.areaFt2 * 0.03)} ft` }, { label: "Clear time", value: `${num(90 - d.compact * 8 - d.conv * 4)} s` }],
  "Accessibility": (m, d) => [{ label: "Turning radius", value: `${num(48 + d.spacious * 3)} in` }, { label: "Clear door", value: `${num(32 + d.spacious)} in` }],
  "Carbon":        (m, _d, o) => { const operating = m.areaFt2 * (12 - m.energyScore * 1.5); const embPenalty = o.method === "3d-print" ? (o.printMaterial === "cement" ? 0.03 : 0.012) : o.frameMaterial === "aluminum" ? 0.02 : 0; const embodied = m.areaFt2 * (0.09 - m.carbonScore * 0.008) + m.areaFt2 * embPenalty; const tag = o.method === "3d-print" ? (o.printMaterial === "cement" ? " (cement↑)" : " (composite)") : o.frameMaterial === "aluminum" ? " (alum↑)" : " (assumed)"; return [{ label: "Embodied" + tag, value: `${num(embodied, 1)} tCO₂e` }, { label: "Operating", value: `${num(operating)} kg/yr` }]; },
  "Lifecycle":     (m, _d, o) => { const life = costFor(m, o) * (1 + (6 - m.energyScore) * 0.08); const steel = o.frameMaterial === "all-steel" || o.frameMaterial === "steel-corners"; const dur = o.method === "3d-print" ? "high (printed)" : o.method === "hex-panel" ? "high (panel)" : o.frameMaterial === "aluminum" ? "high (alum)" : steel ? "high (steel)" : `${num(5 - m.energyScore * 0.6, 1)}/5`; return [{ label: "30-yr cost", value: `$${num(life)}` }, { label: "Durability", value: dur }]; },
};
function simMetrics(m: SimModel, sim: SimName, opt: BuildOption): SimMetric[] { return METRICS[sim](m, drivers(m, opt), opt); }

export type SimStatus = "PASS" | "WATCH";
/** A per-sim ESTIMATE on one model at an option: a 0–5 initial score (+ star rounding), a status, and detailed metrics. */
export interface SimResult { sim: SimName; score: number; stars: number; status: SimStatus; metrics: SimMetric[]; }
export function simResult(modelId: string, sim: SimName, opt?: BuildOption): SimResult {
  const m = modelById(modelId);
  if (!m) return { sim, score: 0, stars: 0, status: "WATCH", metrics: [] };
  const o = opt ?? m.native;
  const raw = rawScore(m, sim, o) + methodDelta(sim, o) + roofDelta(sim, o);
  const score = Math.round(clamp(raw, 0, 5) * 10) / 10;
  return { sim, score, stars: Math.round(score), status: score >= 3 ? "PASS" : "WATCH", metrics: simMetrics(m, sim, o) };
}

/** Run the WHOLE original battery on a model at an option (defaults to the model's native option). */
export function runBattery(modelId: string, opt?: BuildOption): SimResult[] { return SIMS.map((s) => simResult(modelId, s, opt)); }

/** A model's average 0–5 across the 13 sims — the single-number "simulation readiness" for the summary ranking. */
export function overallScore(modelId: string, opt?: BuildOption): number {
  const b = runBattery(modelId, opt);
  if (!b.length) return 0;
  return Math.round((b.reduce((s, r) => s + r.score, 0) / b.length) * 10) / 10;
}

// ── the SIDE-BY-SIDE matrix: 13 rows × 3 models (each at its own current option), per-row winner ────────────────────
export interface SimMatrixCell { modelId: string; label: string; score: number; stars: number; status: SimStatus; metrics: SimMetric[]; }
export interface SimMatrixRow { sim: SimName; cells: SimMatrixCell[]; winnerId: string; }
export function simMatrix(models: SimModel[] = SIM_MODELS, optsBy?: Record<string, BuildOption>): SimMatrixRow[] {
  return SIMS.map((sim) => {
    const cells: SimMatrixCell[] = models.map((m) => {
      const r = simResult(m.id, sim, optsBy?.[m.id]);
      return { modelId: m.id, label: m.label, score: r.score, stars: r.stars, status: r.status, metrics: r.metrics };
    });
    const winner = cells.reduce((a, b) => (b.score > a.score ? b : a));
    return { sim, cells, winnerId: winner.modelId };
  });
}

// ── TIME TO BUILD, BY PHASE — the build split across the eight DEV_PHASES (in build order). 3D Print collapses the
//    Framing phase (the printed shell goes up fast) and speeds Roofing, shifting share to MEP + finish. ──────────────
const PHASE_WEIGHTS: Record<Method, Record<string, number>> = {
  "stick-framed": { foundation: 0.15, framing: 0.24, electrical: 0.14, plumbing: 0.12, sewer: 0.07, internet: 0.05, security: 0.05, roofing: 0.18 },
  "3d-print":     { foundation: 0.18, framing: 0.10, electrical: 0.16, plumbing: 0.14, sewer: 0.08, internet: 0.06, security: 0.06, roofing: 0.22 },
  "hex-panel":    { foundation: 0.16, framing: 0.14, electrical: 0.15, plumbing: 0.13, sewer: 0.07, internet: 0.05, security: 0.05, roofing: 0.25 },
};
const FORM_PHASE_TWEAK: Record<string, Record<string, number>> = {
  "eco-sphere": { roofing: +0.06, framing: -0.03, foundation: -0.03 },
  "tiny":       { framing: -0.04, electrical: +0.02, plumbing: +0.02 },
  "3x3-grid":   {},
};
export interface PhaseTime { id: string; label: string; color: string; weeks: number; }
/** The build time split across the eight construction phases for a model at an option (weeks per phase; the eight sum
 *  EXACTLY to the rounded total — Sofia). Per-form weighting differentiates the hex dome from the Cube (Pangu). */
export function phaseSchedule(modelId: string, opt?: BuildOption): PhaseTime[] {
  const m = modelById(modelId);
  if (!m) return [];
  const o = opt ?? m.native;
  const totalWeeks = Math.round(monthsFor(m, o) * 4.345 * 2) / 2;
  const tweak = FORM_PHASE_TWEAK[m.id] ?? {};
  const raw = DEV_PHASES.map((p) => Math.max(0, (PHASE_WEIGHTS[o.method][p.id] ?? 0) + (tweak[p.id] ?? 0)));
  const sumW = raw.reduce((s, x) => s + x, 0) || 1;
  const weeks = raw.map((x) => Math.round((totalWeeks * x / sumW) * 2) / 2);
  const drift = Math.round((totalWeeks - weeks.reduce((s, x) => s + x, 0)) * 2) / 2;
  weeks[weeks.length - 1] = Math.max(0, weeks[weeks.length - 1] + drift);
  return DEV_PHASES.map((p, i) => ({ id: p.id, label: p.label, color: p.color, weeks: weeks[i] }));
}

// ── one reconciled recommendation, not a per-axis scoreboard (Asar) — the top 13-sim average across the forms ────────
export interface Recommendation { modelId: string; label: string; avg: number; reason: string; }
export function recommendation(models: SimModel[] = SIM_MODELS, optsBy?: Record<string, BuildOption>): Recommendation {
  const op = (m: SimModel): BuildOption => optsBy?.[m.id] ?? m.native;
  const scored = models.map((m) => ({ m, s: overallScore(m.id, op(m)) })).sort((a, b) => b.s - a.s);
  const best = scored[0].m, avg = scored[0].s;
  const runner = scored[1];
  const margin = runner ? Math.round((avg - runner.s) * 10) / 10 : avg;
  const basisNote = best.basis === "DERIVED" ? "engine-derived cost" : "ASSUMED · parametric (only the Cube's cost is engine-derived)";
  const marginNote = runner ? ` · +${margin.toFixed(1)} over ${runner.m.label}${margin <= 0.1 ? " — a near-tie" : ""}` : "";
  return {
    modelId: best.id, label: best.label, avg,
    reason: `top 13-sim average (${avg.toFixed(1)}/5${marginNote}) · basis ${best.basis} — ${basisNote}. An estimate, not a quote.`,
  };
}
