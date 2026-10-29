/**
 * ARCHITECT-2525 · SIMULATE — BUILD INSTRUCTIONS (operator 2026-10-28: "mock up of instructions for each phase with key
 * metrics … with measurements that guide builder, architect, or foreman to instruct local team of friends family, and
 * paid help … complete with project timelines … Cube 3×3, Tiny Home, Eco-Sphere (and 3D print of Eco-Sphere) to compare.
 * Framing wood vs steel and aluminum … Hex Panels for Shell of Eco-Sphere").
 * ============================================================================================================
 * A per-phase, measurement-rich, crew-day-timed build plan a foreman could hand a team. It is form- AND option-aware:
 * the Framing/Shell and MEP steps change with the chosen method (stick wood/steel/aluminium · 3D-printed cement/composite ·
 * hex-panel dome) and roof; the Tiny Home carries the genuinely simpler THOW steps (trailer deck, mini-split, one wet wall).
 *
 * HONESTY: every figure is a research-backed PLANNING RULE OF THUMB (sources: NEC/IPC-UPC practice, ICON/Mighty-Buildings
 * vendor claims, geodesic-dome practice — captured 2026-10-28). The buildable values come from Manual J/S/D, IPC/UPC
 * fixture-unit sizing and the adopted local code edition — so each rule-of-thumb carries a `codeFlag`. Pure + deterministic
 * (no Date.now / Math.random) → replay-safe + gate-tested. Crew-days assume a 4-person crew (friends/family + paid help).
 */
import type { FormId } from "@/lib/architect-sim-environment";
import { ELEMENTS, FRAME_MATERIALS, METHODS, PRINT_MATERIALS, ROOFS, SIM_MODELS, modelById, optFor, type BuildOption, type ElementName, type SimModel } from "@/lib/architect-sim-options";

export interface InstructionStep {
  n: number;
  title: string;
  measure: string;     // the research-backed key measurement(s) a foreman reads off
  crewDays: number;    // planning rule-of-thumb crew-days (one worker, one day)
  codeFlag?: string;   // where the real value comes from the adopted code / an engineered calc
}
export interface PhaseInstructions { element: ElementName; label: string; steps: InstructionStep[]; crewDays: number; }
export interface BuildInstructions {
  formId: FormId;
  label: string;
  option: BuildOption;
  methodLabel: string;
  phases: PhaseInstructions[];
  totalCrewDays: number;
  weeks: number;       // crew-days → calendar weeks at a 4-person crew, 5 days/week
  note: string;
}

export const CREW = 4;              // a crew of four — friends/family + paid help (Vision-2525)
export const DAYS_PER_WEEK = 5;
/** The build SEQUENCE (dry-in before MEP) — distinct from the cost ELEMENTS order, but the same six element names. */
export const BUILD_ORDER: ElementName[] = ["Foundation", "Framing", "Roofing", "Plumbing", "Electrical", "HVAC"];

const tiny = (m: SimModel) => m.id === "tiny";
const withN = (steps: Omit<InstructionStep, "n">[]): InstructionStep[] => steps.map((s, i) => ({ n: i + 1, ...s }));

// ── FOUNDATION ──────────────────────────────────────────────────────────────────────────────────────────────────────
function foundationSteps(m: SimModel): Omit<InstructionStep, "n">[] {
  if (tiny(m)) return [
    { title: "Trailer & chassis", measure: "Dual-axle trailer, 10–14k lb GVWR; deck bolted to frame ⅜\" bolts @32\" o.c.", crewDays: 1, codeFlag: "RVIA / state THOW rules" },
    { title: "Subfloor & moisture deck", measure: "Closed-cell under subfloor; continuous vapor barrier; sill flashing", crewDays: 1 },
  ];
  const ring = m.id === "eco-sphere";
  return [
    { title: ring ? "Excavate & ring footing" : "Excavate & footings", measure: ring ? "Level base ring to the dome perimeter; footing 12\"W below frost line" : "Perimeter footing 12\"W, 12–24\"D below frost line; compact base", crewDays: 2, codeFlag: "local frost depth + soil report" },
    { title: "Rebar & vapor barrier", measure: "#4 rebar grid @16\" o.c.; 10-mil vapor barrier over compacted fill", crewDays: 1 },
    { title: "Pour & cure slab", measure: "4\" slab @ 3,000–4,000 psi; ½\" anchor bolts 7\" embed @6' o.c.; 7-day cure / 28-day full strength", crewDays: 2, codeFlag: "mix PSI + adopted IRC edition" },
  ];
}

// ── FRAMING / SHELL (method-aware) ──────────────────────────────────────────────────────────────────────────────────
function framingSteps(m: SimModel, opt: BuildOption): Omit<InstructionStep, "n">[] {
  if (opt.method === "3d-print") {
    const pm = PRINT_MATERIALS[opt.printMaterial];
    return [
      { title: "Set printer & slice file", measure: `Gantry over the slab; slice the print file with MEP chases, sleeves & box block-outs PRE-PLANNED (routing is fixed before slicing — no coring cured walls)`, crewDays: 2, codeFlag: "printed-wall approval (AHJ)" },
      // printing is MACHINE time — the printer runs ~500 ft²/24h while a small crew monitors; that is why the printed
      // shell is the fewest CREW-days of the three shell methods (the ICON speed hook) even though wall-clock cure is long.
      { title: `Print the walls (${pm.label.toLowerCase()})`, measure: `Printer runs ~500 ft² of wall per 24 h (machine time; crew monitors) — bead ~25×50 mm @125–180 mm/s; cure 12–24 h between lifts; crew 4–6. ${pm.strength}`, crewDays: 1 },
      { title: "Reinforce & lintels", measure: "Rebar / 9-ga wire every other layer; cast-in lintels over each opening", crewDays: 1, codeFlag: "structural engineer" },
    ];
  }
  if (opt.method === "hex-panel") {
    return [
      { title: "Base ring & first hubs", measure: "Set the first hub ring on the base ring; 2V/3V geodesic frequency; hubs hand-tight", crewDays: 1, codeFlag: "dome engineering package" },
      { title: "Assemble hex panels", measure: "Bolt hex panels hub-to-hub up to the apex, torque in sequence; perimeter riser wall for loft headroom", crewDays: 2 },
      { title: "Seal & waterproof shell", measure: "Panel-joint gaskets + continuous membrane — waterproofing is the #1 dome risk", crewDays: 2, codeFlag: "membrane spec + flashing detail" },
    ];
  }
  const fm = FRAME_MATERIALS[opt.frameMaterial];
  const raise = opt.frameMaterial === "aluminum" ? 4 : opt.frameMaterial === "all-steel" ? 3 : opt.frameMaterial === "steel-corners" ? 2 : 2;
  return [
    { title: `Sill & wall framing (${fm.label.toLowerCase()})`, measure: `${fm.spec}; 8' wall height; single bottom / double top plate`, crewDays: raise, codeFlag: opt.frameMaterial !== "wood" ? "metal-frame thermal break + connectors" : undefined },
    { title: "Headers & openings", measure: "Headers over every opening; king + jack studs carry the load to the sill", crewDays: 1 },
    { title: "Sheathing & shear", measure: "7/16\" OSB sheathing; nail the shear-wall schedule; house-wrap", crewDays: 2, codeFlag: "shear schedule (wind/seismic)" },
  ];
}

// ── ROOFING (roof-aware; the dome shell IS its own roof) ────────────────────────────────────────────────────────────
function roofingSteps(m: SimModel, opt: BuildOption): Omit<InstructionStep, "n">[] {
  if (opt.roof === "hex-dome") {
    // a PRINTED dome is monolithic — no panels or panel seams — so its roofing steps differ from the hex-panel dome's.
    if (opt.method === "3d-print") return [
      { title: "Printed crown & oculus", measure: "Close the printed shell at the crown / oculus ring; the monolithic dome sheds water by shape (no panel joints)", crewDays: 2, codeFlag: "dome uplift calc" },
      { title: "Continuous membrane", measure: "One continuous elastomeric membrane over the cured shell; flash the oculus; inspect for ponding at the base ring", crewDays: 1 },
    ];
    return [
      { title: "Apex cap & ridge vents", measure: "Cap the apex hub; ridge/soffit venting through the facets; the dome sheds water by shape", crewDays: 2, codeFlag: "dome uplift calc" },
      { title: "Final weatherproofing", measure: "Seal every panel seam; inspect for ponding at the base ring", crewDays: 1 },
    ];
  }
  if (opt.roof === "flat") return [
    { title: "Tapered insulation & deck", measure: "Taper to ¼\" per ft slope to interior drains; cover board over deck", crewDays: 1, codeFlag: "drainage + R-value" },
    { title: "Membrane & flashing", measure: "Fully-adhered TPO/EPDM membrane; flash all penetrations & parapets", crewDays: 1 },
  ];
  const hip = opt.roof === "hip";
  return [
    { title: hip ? "Hip trusses & frame" : "Trusses & frame", measure: `${hip ? "Four-slope hip" : "Gable"} trusses @24\" o.c.; ≥2/12 pitch; 5/8\" sheathing`, crewDays: hip ? 3 : 2, codeFlag: "pitch + wind/snow load" },
    { title: "Underlayment & cover", measure: "30# felt / synthetic underlayment; shingles or standing-seam metal; drip edge", crewDays: hip ? 1 : 1 },
  ];
}

// ── PLUMBING (form- + method-aware) ─────────────────────────────────────────────────────────────────────────────────
function plumbingSteps(m: SimModel, opt: BuildOption): Omit<InstructionStep, "n">[] {
  const printed = opt.method === "3d-print";
  if (tiny(m)) return [
    { title: "One wet wall (DWV + supply)", measure: "Single 2–3\" stack; ½\" PEX branches off a ¾\" trunk; one vent or AAV where allowed", crewDays: 2, codeFlag: "IPC/UPC + local AAV rule" },
    { title: "Water heater & fixtures", measure: "Tankless ~5 GPM (or 20–40 gal); set fixtures; pressure-test", crewDays: 1 },
  ];
  return [
    { title: "DWV rough-in", measure: `Horizontal drains ¼\" per ft slope; 3–4\" main stack; P-trap each fixture${printed ? "; routed through pre-printed chases (fittings behind removable finishes, not buried)" : ""}`, crewDays: 2, codeFlag: "IPC/UPC fixture-unit sizing" },
    { title: "Supply piping", measure: "¾\" PEX trunk, ½\" branches; 40–60 psi design (add a PRV above 80 psi)", crewDays: 2 },
    { title: "Water heater, test & set", measure: "40–50 gal tank or 5–7 GPM tankless (size by first-hour rating); pressure-test, then set fixtures", crewDays: 1 },
  ];
}

// ── ELECTRICAL (form- + method-aware) ───────────────────────────────────────────────────────────────────────────────
function electricalSteps(m: SimModel, opt: BuildOption): Omit<InstructionStep, "n">[] {
  const printed = opt.method === "3d-print";
  if (tiny(m)) return [
    { title: "Service & circuits", measure: "100 A panel (or 30/50 A RV inlet); ~6–10 circuits; mini-split on its own; GFCI wet / AFCI habitable", crewDays: 2, codeFlag: "NEC adopted edition" },
    { title: "Trim & test", measure: "Devices, fixtures, panel directory; GFCI/AFCI trip test", crewDays: 1 },
  ];
  return [
    { title: "Service & panel", measure: "200 A main panel; feeder 2/0 Cu (or 4/0 Al); grounding-electrode conductor #4 Cu", crewDays: 1, codeFlag: "NEC load calc" },
    { title: "Rough-in & protection", measure: `Boxes 12–16\" AFF, switches ~48\"; NEC 210.52 spacing (≤6 ft / ≤12 ft between); AFCI habitable, GFCI within 6 ft of any sink${printed ? "; fed from above down pre-printed wall chases to each box" : ""}`, crewDays: 3, codeFlag: "NEC 210 + adopted edition" },
    { title: "Trim-out & final test", measure: "Devices, plates, fixtures, breakers; GFCI/AFCI trip test; polarity check", crewDays: 2 },
  ];
}

// ── HVAC (form-aware; tiny = ductless mini-split) ───────────────────────────────────────────────────────────────────
function hvacSteps(m: SimModel): Omit<InstructionStep, "n">[] {
  if (tiny(m)) return [
    { title: "Ductless mini-split", measure: "One ~9,000 BTU (¾ ton) head + outdoor unit, single line-set — no ductwork; sized so it won't short-cycle", crewDays: 1, codeFlag: "Manual J (tight small volume)" },
    { title: "Fresh air", measure: "Bath exhaust fan or small ERV/HRV — a mini-split brings in no outdoor air in a tight envelope", crewDays: 1 },
  ];
  return [
    { title: "Load calc & equipment", measure: "Manual J ~400–600 ft²/ton → ~1.5–2 tons (18–24k BTU); ~400 CFM/ton; meet SEER2 minimum", crewDays: 1, codeFlag: "Manual J/S + current DOE SEER2" },
    { title: "Air handler & line-set", measure: "Condenser on a pad with clearance; ¼\" liquid + ⅜–¾\" suction, suction line insulated", crewDays: 1 },
    { title: "Ductwork, registers & balance", measure: "Manual D at ~0.10 in w.c./100 ft, 600–900 FPM; perimeter supplies + a return path; commission & balance", crewDays: 3, codeFlag: "Manual D" },
  ];
}

const STEP_FN: Record<ElementName, (m: SimModel, opt: BuildOption) => Omit<InstructionStep, "n">[]> = {
  Foundation: (m) => foundationSteps(m),
  Framing: (m, o) => framingSteps(m, o),
  Roofing: (m, o) => roofingSteps(m, o),
  Plumbing: (m, o) => plumbingSteps(m, o),
  Electrical: (m, o) => electricalSteps(m, o),
  HVAC: (m) => hvacSteps(m),
};

/** The phase label — the Framing phase reads as the actual shell method; the Roofing phase names the roof. */
export function phaseLabel(element: ElementName, m: SimModel, opt: BuildOption): string {
  if (element === "Foundation") return tiny(m) ? "Foundation · trailer deck" : "Foundation";
  if (element === "Framing") {
    if (opt.method === "3d-print") return `Shell · 3D-printed ${PRINT_MATERIALS[opt.printMaterial].label.toLowerCase()}`;
    if (opt.method === "hex-panel") return "Shell · hex panels";
    return `Framing · ${FRAME_MATERIALS[opt.frameMaterial].label.toLowerCase()}`;
  }
  if (element === "Roofing") return opt.roof === "hex-dome" && opt.method === "3d-print" ? "Roofing · printed crown" : `Roofing · ${ROOFS[opt.roof].label.toLowerCase()}`;
  return element;
}

/** The full per-phase build plan for a form at a build option. */
export function buildInstructions(formId: FormId, opt?: BuildOption): BuildInstructions {
  const m = modelById(formId);
  if (!m) return { formId, label: formId, option: opt ?? { method: "stick-framed", printMaterial: "cement", frameMaterial: "wood", roof: "gable" }, methodLabel: "", phases: [], totalCrewDays: 0, weeks: 0, note: "unknown form" };
  const o = opt ?? m.native;
  const phases: PhaseInstructions[] = BUILD_ORDER.map((element) => {
    const steps = withN(STEP_FN[element](m, o));
    return { element, label: phaseLabel(element, m, o), steps, crewDays: steps.reduce((s, x) => s + x.crewDays, 0) };
  });
  const totalCrewDays = phases.reduce((s, p) => s + p.crewDays, 0);
  const weeks = Math.round((totalCrewDays / (CREW * DAYS_PER_WEEK)) * 2) / 2;
  return {
    formId, label: m.label, option: o, methodLabel: METHODS[o.method].label,
    phases, totalCrewDays, weeks,
    note: `Crew-days are HANDS-ON LABOR content at a ${CREW}-person crew — NOT calendar time. The calendar duration (incl. the 28-day slab cure, inspections and trade sequencing) is the months shown in "Time to build · by phase" above. A PLANNING ESTIMATE (rules of thumb); buildable values come from Manual J/S/D, IPC/UPC fixture-unit sizing, NEC, and your adopted local code edition — each phase flags where.`,
  };
}

/** The FOUR build paths the operator asked to compare side by side (Cube · Tiny · Eco hex-panel · Eco 3D-print cement). */
export const COMPARE_PATHS: { id: string; label: string; formId: FormId; option: BuildOption }[] = [
  { id: "cube",      label: "Cube 3×3",                      formId: "3x3-grid",   option: optFor(modelById("3x3-grid")!) },
  { id: "tiny",      label: "Tiny Home",                     formId: "tiny",       option: optFor(modelById("tiny")!) },
  { id: "eco-hex",   label: "Eco-Sphere · hex-panel",        formId: "eco-sphere", option: optFor(modelById("eco-sphere")!, { method: "hex-panel" }) },
  { id: "eco-print", label: "Eco-Sphere · 3D-print cement",  formId: "eco-sphere", option: optFor(modelById("eco-sphere")!, { method: "3d-print", printMaterial: "cement" }) },
];

/** The four-path timeline: crew-days per phase + total weeks for each build path, for the compare view. */
export interface TimelinePath { id: string; label: string; formId: FormId; option: BuildOption; perPhase: { element: ElementName; crewDays: number }[]; totalCrewDays: number; weeks: number; }
export function compareTimeline(): TimelinePath[] {
  return COMPARE_PATHS.map((p) => {
    const bi = buildInstructions(p.formId, p.option);
    return { id: p.id, label: p.label, formId: p.formId, option: p.option, perPhase: bi.phases.map((ph) => ({ element: ph.element, crewDays: ph.crewDays })), totalCrewDays: bi.totalCrewDays, weeks: bi.weeks };
  });
}
