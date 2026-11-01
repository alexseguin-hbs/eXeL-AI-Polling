/**
 * ARCHITECT-2525 · SIMULATE — BUILD INSTRUCTIONS (operator 2026-10-28: "mock up of instructions for each phase with key
 * metrics … with measurements that guide builder, architect, or foreman to instruct local team of friends family, and
 * paid help … complete with project timelines … Cube 3×3, Tiny Home, Eco-Sphere (and 3D print of Eco-Sphere) to compare.
 * Framing wood vs steel and aluminum … Hex Panels for Shell of Eco-Sphere").
 * ============================================================================================================
 * R-TO1 (operator 2026-11-01: "Structure you Build by Phase for modularity so HI reader knows whats going on: Bullet out
 * Equipment · Subbullet Dimensions · Count out Number / Length Wood etc"). Each step is now a MODULAR TAKE-OFF: a list of
 * Equipment / Materials, each with its Dimensions and a COUNT (Number / Length). The counts are derived from ONE per-form
 * geometry (footprint area · perimeter · wall length · openings) — so they are real and consistent, never hand-typed twice
 * (the all-numerics law). This is the material take-off (the single source the estimate's material dollars will use — ONE
 * COST TRUTH); surfaced here first for the foreman / friends / family / paid help who need to know WHAT to buy and HOW MUCH.
 *
 * It is form- AND option-aware: the Framing/Shell and MEP steps change with the chosen method (stick wood/steel/aluminium ·
 * 3D-printed cement/composite · hex-panel dome) and roof; the Tiny Home carries the genuinely simpler THOW steps.
 *
 * HONESTY: every figure is a research-backed PLANNING RULE OF THUMB (sources: NEC/IPC-UPC practice, ICON/Mighty-Buildings
 * vendor claims, geodesic-dome practice — captured 2026-10-28). The buildable values come from Manual J/S/D, IPC/UPC
 * fixture-unit sizing and the adopted local code edition — so each rule-of-thumb carries a `codeFlag`. Counts are PLANNING
 * quantities (round up + add waste on site). Pure + deterministic (no Date.now / Math.random) → replay-safe + gate-tested.
 * Crew-days assume a 4-person crew (friends/family + paid help).
 */
import type { FormId } from "@/lib/architect-sim-environment";
import { ELEMENTS, FRAME_MATERIALS, METHODS, PRINT_MATERIALS, ROOFS, SIM_MODELS, modelById, optFor, type BuildOption, type ElementName, type SimModel } from "@/lib/architect-sim-options";

/** One line of the take-off: a piece of Equipment / Material, its Dimensions, and the Count (Number / Length). */
export interface MaterialItem {
  equipment: string;    // WHAT — the material / equipment (wood, rebar, concrete, panel, fixture, machine)
  dimensions: string;   // its size / spec (the operator's "Dimensions" sub-bullet)
  count: string;        // HOW MANY / HOW MUCH — a number and/or a length (the operator's "Count out Number / Length")
}
export interface InstructionStep {
  n: number;
  title: string;
  items: MaterialItem[];   // the take-off for this step (Equipment · Dimensions · Count) — R-TO1
  crewDays: number;        // planning rule-of-thumb crew-days (one worker, one day)
  codeFlag?: string;       // where the real value comes from the adopted code / an engineered calc
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
const mi = (equipment: string, dimensions: string, count: string): MaterialItem => ({ equipment, dimensions, count });

// ── ONE geometry per form — the single source every count derives from (the all-numerics law) ────────────────────────
export interface FormGeo {
  areaFt2: number;       // conditioned footprint
  sideFt: number;        // a representative plan dimension
  perimeterFt: number;   // exterior wall run
  wallHt: number;        // wall height (ft)
  extWallLF: number;     // exterior wall length
  intWallLF: number;     // interior partition length
  wallAreaFt2: number;   // exterior wall face area (perimeter × height)
  roofAreaFt2: number;   // roof surface (pitch/shape adjusted)
  windows: number;       // opening counts (from the standard layout)
  doors: number;
}
const r0 = (n: number) => Math.round(n);
export function formGeometry(m: SimModel): FormGeo {
  const a = m.areaFt2;
  if (m.id === "tiny") {
    const L = 28, W = 10, per = 2 * (L + W), ht = 8;              // 10 × 28 catalog preset
    return { areaFt2: a, sideFt: L, perimeterFt: per, wallHt: ht, extWallLF: per, intWallLF: 18, wallAreaFt2: r0(per * ht), roofAreaFt2: r0(a * 1.05), windows: 4, doors: 1 };
  }
  if (m.id === "eco-sphere") {
    const rad = Math.sqrt(a / Math.PI), circ = 2 * Math.PI * rad, ht = 8;   // dome footprint → radius
    return { areaFt2: a, sideFt: r0(2 * rad), perimeterFt: r0(circ), wallHt: ht, extWallLF: r0(circ), intWallLF: 60, wallAreaFt2: r0(2 * Math.PI * rad * rad), roofAreaFt2: r0(2 * Math.PI * rad * rad), windows: 6, doors: 1 };
  }
  const side = Math.sqrt(a), per = 4 * side, ht = 8;             // cube 3×3 (30 × 30 @ 900 ft²)
  return { areaFt2: a, sideFt: r0(side), perimeterFt: r0(per), wallHt: ht, extWallLF: r0(per), intWallLF: r0(per), wallAreaFt2: r0(per * ht), roofAreaFt2: r0(a * 1.15), windows: 9, doors: 10 };
}
const cubicYards = (ft2: number, inches: number) => Math.round((ft2 * (inches / 12) / 27) * 10) / 10;
const studs = (lf: number) => r0(lf / (16 / 12) * 1.15);        // @16" o.c. + 15% for corners / openings
const sheets = (ft2: number) => r0(ft2 / 32 + 0.5);             // 4×8 = 32 ft² panels, round up
const commas = (n: number) => String(r0(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");  // deterministic thousands (no locale)

// ── FRAME WEIGHT (operator 2026-11-01: "weight of frame … steel vs wood vs concrete … strength/weight ratio … aircraft
//    standards"). Real structural densities → lb per ft² of WALL by building system (structural frame + sheathing; interior
//    finishes excluded): concrete 150 lb/ft³ → a 6" printed wall = 75 psf; wood 2×6 framing + OSB ~7; light-gauge steel
//    ~4; aluminium (⅓ steel density) ~3. The strength-to-weight note is the ladder toward sheet-metal/aircraft. ──
export interface FrameWeightSystem { label: string; wallPsf: number; sw: string; }
export const FRAME_WEIGHT: Record<string, FrameWeightSystem> = {
  wood:              { label: "Wood frame",          wallPsf: 7,  sw: "moderate strength-to-weight" },
  "steel-corners":   { label: "Steel-corner frame",  wallPsf: 7.5, sw: "moderate+ · steel corner load path" },
  "all-steel":       { label: "All-steel frame",     wallPsf: 4,  sw: "high strength-to-weight · non-combustible" },
  aluminum:          { label: "Aluminium frame",     wallPsf: 3,  sw: "highest strength-to-weight · aircraft-grade" },
  "print-cement":    { label: "Printed cement",      wallPsf: 75, sw: "very strong, LOW strength-to-weight (heavy)" },
  "print-composite": { label: "Printed composite",   wallPsf: 52, sw: "stronger + ~30% lighter than cement" },
  "hex-panel":       { label: "Hex-panel shell",     wallPsf: 4,  sw: "light geodesic panel shell" },
};
const ROOF_STRUCT_PSF = 8;   // pitched wood trusses + deck baseline (metal / dome lighter; kept as the structural reference)
/** The building-system key for the chosen method/material (one source for weight + the framing label). */
export function frameSystemKey(opt: BuildOption): string {
  if (opt.method === "3d-print") return `print-${opt.printMaterial}`;
  if (opt.method === "hex-panel") return "hex-panel";
  return opt.frameMaterial;
}
export interface FrameWeight { key: string; label: string; wallPsf: number; wallLb: number; roofLb: number; totalLb: number; sw: string; }
/** The structural frame weight for a form at a build option — walls (system psf × wall area) + roof structure. Lets the
 *  builder compare steel vs wood vs concrete by weight, and read the strength-to-weight note. Pure + geometry-derived. */
export function frameWeight(m: SimModel, opt: BuildOption, g: FormGeo = formGeometry(m)): FrameWeight {
  const sys = FRAME_WEIGHT[frameSystemKey(opt)] ?? FRAME_WEIGHT.wood;
  const wallLb = r0(sys.wallPsf * g.wallAreaFt2);
  const roofLb = r0(ROOF_STRUCT_PSF * g.roofAreaFt2);
  return { key: frameSystemKey(opt), label: sys.label, wallPsf: sys.wallPsf, wallLb, roofLb, totalLb: wallLb + roofLb, sw: sys.sw };
}

// ── FOUNDATION ──────────────────────────────────────────────────────────────────────────────────────────────────────
function foundationSteps(m: SimModel, g: FormGeo): Omit<InstructionStep, "n">[] {
  if (tiny(m)) return [
    { title: "Trailer & chassis", crewDays: 1, codeFlag: "RVIA / state THOW rules", items: [
      mi("Dual-axle trailer", "10–14k lb GVWR, flat deck", "× 1"),
      mi("Deck bolts", "⅜″ @ 32″ o.c.", `≈ ${r0(g.perimeterFt / (32 / 12))} bolts`),
    ] },
    { title: "Subfloor & moisture deck", crewDays: 1, items: [
      mi("Closed-cell foam", "under subfloor, R-30", `${g.areaFt2} ft²`),
      mi("Vapor barrier + sill flashing", "continuous 6-mil", `${r0(g.areaFt2 * 1.1)} ft²`),
    ] },
  ];
  const ring = m.id === "eco-sphere";
  return [
    { title: ring ? "Excavate & ring footing" : "Excavate & footings", crewDays: 2, codeFlag: "local frost depth + soil report", items: [
      mi("Footing trench", ring ? "ring to the dome perimeter, 12″W below frost" : "12″W, 12–24″D below frost line", `${g.perimeterFt} LF`),
      mi("Compacted base", "4–6″ gravel", `${g.areaFt2} ft²`),
    ] },
    { title: "Rebar & vapor barrier", crewDays: 1, items: [
      mi("Rebar grid", "#4 (½″) @ 16″ o.c. both ways", `≈ ${r0(2 * g.areaFt2 / (16 / 12))} LF`),
      mi("Vapor barrier", "10-mil poly over fill", `${r0(g.areaFt2 * 1.1)} ft²`),
    ] },
    { title: "Pour & cure slab", crewDays: 2, codeFlag: "mix PSI + adopted IRC edition", items: [
      mi("Concrete slab", "4″ @ 3,000–4,000 psi", `${cubicYards(g.areaFt2, 4)} yd³ (${g.areaFt2} ft²)`),
      mi("Anchor bolts", "½″ × 7″ embed @ 6′ o.c.", `× ${r0(g.perimeterFt / 6)}`),
      mi("Cure", "7-day set / 28-day full strength", "wall-clock, not crew time"),
    ] },
  ];
}

// ── FRAMING / SHELL (method-aware) ──────────────────────────────────────────────────────────────────────────────────
function framingSteps(m: SimModel, opt: BuildOption, g: FormGeo): Omit<InstructionStep, "n">[] {
  if (opt.method === "3d-print") {
    const pm = PRINT_MATERIALS[opt.printMaterial];
    return [
      { title: "Set printer & slice file", crewDays: 2, codeFlag: "printed-wall approval (AHJ)", items: [
        mi("Gantry printer", "spans the slab; set & level", "× 1 (rental/own)"),
        mi("Print file", "MEP chases, sleeves & box block-outs pre-planned", "1 sliced file"),
      ] },
      { title: `Print the walls (${pm.label.toLowerCase()})`, crewDays: 1, items: [
        mi(`Printed ${pm.label.toLowerCase()} wall`, `bead ~25×50 mm @125–180 mm/s; ${pm.strength}`, `${g.wallAreaFt2} ft² of wall`),
        mi("Print time", "machine runs ~500 ft²/24 h; crew monitors", `≈ ${Math.max(1, Math.round(g.wallAreaFt2 / 500))} machine-day(s)`),
      ] },
      { title: "Reinforce & lintels", crewDays: 1, codeFlag: "structural engineer", items: [
        mi("Rebar / wire", "#4 or 9-ga every other layer", `≈ ${r0(g.wallAreaFt2 / 4)} LF`),
        mi("Cast-in lintels", "over each opening", `× ${g.windows + g.doors}`),
      ] },
    ];
  }
  if (opt.method === "hex-panel") {
    return [
      { title: "Base ring & first hubs", crewDays: 1, codeFlag: "dome engineering package", items: [
        mi("Base ring", "set on the footing, 2V/3V geodesic layout", `${g.perimeterFt} LF`),
        mi("Hub connectors", "first ring, hand-tight", `≈ ${r0(g.perimeterFt / 6)}`),
      ] },
      { title: "Assemble hex panels", crewDays: 2, items: [
        mi("Hex shell panels", "bolt hub-to-hub to the apex, torque in sequence", `≈ ${r0(g.roofAreaFt2 / 45)} panels`),
        mi("Perimeter riser wall", "for loft headroom", `${g.perimeterFt} LF`),
      ] },
      { title: "Seal & waterproof shell", crewDays: 2, codeFlag: "membrane spec + flashing detail", items: [
        mi("Joint gaskets", "every panel seam (the #1 dome risk)", `≈ ${r0(g.roofAreaFt2 / 45) * 6} joints`),
        mi("Continuous membrane", "over the whole shell", `${r0(g.roofAreaFt2 * 1.1)} ft²`),
      ] },
    ];
  }
  const fm = FRAME_MATERIALS[opt.frameMaterial];
  const raise = opt.frameMaterial === "aluminum" ? 4 : opt.frameMaterial === "all-steel" ? 3 : opt.frameMaterial === "steel-corners" ? 2 : 2;
  const totalWallLF = g.extWallLF + g.intWallLF;
  const member = opt.frameMaterial === "wood" ? "2×4 / 2×6 stud" : `${fm.label} stud`;
  return [
    { title: `Sill & wall framing (${fm.label.toLowerCase()})`, crewDays: raise, codeFlag: opt.frameMaterial !== "wood" ? "metal-frame thermal break + connectors" : undefined, items: [
      mi(member, `${fm.spec}; ${g.wallHt}′ wall`, `≈ ${studs(totalWallLF)} studs @16″ o.c.`),
      mi("Plates", "1 bottom + 2 top", `≈ ${r0(totalWallLF * 3)} LF`),
    ] },
    { title: "Headers & openings", crewDays: 1, items: [
      mi("Headers", "over every opening; king + jack studs", `× ${g.windows + g.doors}`),
      mi("Rough openings", "framed to door/window R.O.", `${g.windows} windows · ${g.doors} doors`),
    ] },
    { title: "Sheathing & shear", crewDays: 2, codeFlag: "shear schedule (wind/seismic)", items: [
      mi("OSB sheathing", "7/16″, 4×8 sheets", `× ${sheets(g.wallAreaFt2)}`),
      mi("House-wrap", "weather-resistive barrier", `${r0(g.wallAreaFt2 * 1.1)} ft²`),
    ] },
  ];
}

// ── ROOFING (roof-aware; the dome shell IS its own roof) ────────────────────────────────────────────────────────────
function roofingSteps(m: SimModel, opt: BuildOption, g: FormGeo): Omit<InstructionStep, "n">[] {
  if (opt.roof === "hex-dome") {
    if (opt.method === "3d-print") return [
      { title: "Printed crown & oculus", crewDays: 2, codeFlag: "dome uplift calc", items: [
        mi("Printed crown ring", "close the monolithic shell at the apex", "× 1"),
        mi("Oculus ring", "skylight / vent at the crown", "× 1"),
      ] },
      { title: "Continuous membrane", crewDays: 1, items: [
        mi("Elastomeric membrane", "one continuous layer over the cured shell", `${r0(g.roofAreaFt2 * 1.1)} ft²`),
        mi("Base-ring flashing", "inspect for ponding", `${g.perimeterFt} LF`),
      ] },
    ];
    return [
      { title: "Apex cap & ridge vents", crewDays: 2, codeFlag: "dome uplift calc", items: [
        mi("Apex hub cap", "closes the panel dome", "× 1"),
        mi("Ridge/soffit vents", "through the facets", `≈ ${r0(g.perimeterFt / 4)}`),
      ] },
      { title: "Final weatherproofing", crewDays: 1, items: [
        mi("Seam sealant", "every panel seam", `${r0(g.roofAreaFt2 / 45) * 6} joints`),
      ] },
    ];
  }
  if (opt.roof === "flat") return [
    { title: "Tapered insulation & deck", crewDays: 1, codeFlag: "drainage + R-value", items: [
      mi("Tapered insulation", "¼″/ft slope to interior drains", `${g.areaFt2} ft²`),
      mi("Cover board", "over the deck", `${g.areaFt2} ft²`),
    ] },
    { title: "Membrane & flashing", crewDays: 1, items: [
      mi("TPO/EPDM membrane", "fully adhered", `${r0(g.areaFt2 * 1.1)} ft²`),
      mi("Penetration/parapet flashing", "all edges", `${g.perimeterFt} LF`),
    ] },
  ];
  const hip = opt.roof === "hip";
  const trusses = r0(g.sideFt / 2) + 1;
  return [
    { title: hip ? "Hip trusses & frame" : "Trusses & frame", crewDays: hip ? 3 : 2, codeFlag: "pitch + wind/snow load", items: [
      mi(`${hip ? "Hip" : "Gable"} trusses`, `@24″ o.c.; ≥2/12 pitch`, `× ${trusses}`),
      mi("Roof sheathing", "5/8″ OSB, 4×8", `× ${sheets(g.roofAreaFt2)}`),
    ] },
    { title: "Underlayment & cover", crewDays: 1, items: [
      mi("Underlayment", "30# felt / synthetic", `${Math.ceil(g.roofAreaFt2 / 100)} squares`),
      mi("Shingles / standing-seam", "finish roof", `${Math.ceil(g.roofAreaFt2 / 100)} squares`),
      mi("Drip edge", "all eaves + rakes", `${g.perimeterFt} LF`),
    ] },
  ];
}

// ── PLUMBING (form- + method-aware) ─────────────────────────────────────────────────────────────────────────────────
function plumbingSteps(m: SimModel, opt: BuildOption, g: FormGeo): Omit<InstructionStep, "n">[] {
  const printed = opt.method === "3d-print";
  if (tiny(m)) return [
    { title: "One wet wall (DWV + supply)", crewDays: 2, codeFlag: "IPC/UPC + local AAV rule", items: [
      mi("DWV stack", "single 2–3″; P-trap each fixture", "1 stack · 3 fixtures"),
      mi("PEX supply", "½″ branches off a ¾″ trunk", `≈ ${r0(g.sideFt * 2)} LF`),
      mi("Vent / AAV", "where allowed", "× 1"),
    ] },
    { title: "Water heater & fixtures", crewDays: 1, items: [
      mi("Water heater", "tankless ~5 GPM (or 20–40 gal)", "× 1"),
      mi("Fixtures", "set + pressure-test", "sink · shower · toilet"),
    ] },
  ];
  const branches = r0(g.areaFt2 / 120);
  return [
    { title: "DWV rough-in", crewDays: 2, codeFlag: "IPC/UPC fixture-unit sizing", items: [
      mi("Main stack", "3–4″; ¼″/ft drain slope", `${g.doors > 1 ? 1 : 1} stack`),
      mi("Branch drains + P-traps", printed ? "through pre-printed chases" : "to each fixture", `≈ ${branches} fixtures`),
    ] },
    { title: "Supply piping", crewDays: 2, items: [
      mi("PEX trunk", "¾″ from the meter/manifold", `≈ ${g.sideFt * 2} LF`),
      mi("PEX branches", "½″ to each fixture; 40–60 psi", `≈ ${r0(g.areaFt2 / 60)} LF`),
      mi("PRV", "if supply > 80 psi", "× 1 (as needed)"),
    ] },
    { title: "Water heater, test & set", crewDays: 1, items: [
      mi("Water heater", "40–50 gal or 5–7 GPM tankless", "× 1"),
      mi("Fixtures", "pressure-test then set", `≈ ${branches}`),
    ] },
  ];
}

// ── ELECTRICAL (form- + method-aware) ───────────────────────────────────────────────────────────────────────────────
function electricalSteps(m: SimModel, opt: BuildOption, g: FormGeo): Omit<InstructionStep, "n">[] {
  const printed = opt.method === "3d-print";
  if (tiny(m)) return [
    { title: "Service & circuits", crewDays: 2, codeFlag: "NEC adopted edition", items: [
      mi("Panel", "100 A (or 30/50 A RV inlet)", "× 1"),
      mi("Circuits", "mini-split on its own; GFCI wet / AFCI habitable", "≈ 6–10"),
    ] },
    { title: "Trim & test", crewDays: 1, items: [
      mi("Devices & fixtures", "outlets, switches, lights", `≈ ${r0(g.areaFt2 / 25)} devices`),
      mi("Panel directory + trip test", "GFCI/AFCI", "× 1"),
    ] },
  ];
  const circuits = r0(g.areaFt2 / 60);
  const outlets = r0(g.perimeterFt / 6);        // NEC 210.52 spacing
  return [
    { title: "Service & panel", crewDays: 1, codeFlag: "NEC load calc", items: [
      mi("Main panel", "200 A", "× 1"),
      mi("Feeder", "2/0 Cu (or 4/0 Al)", `≈ ${r0(g.sideFt)} LF`),
      mi("Ground electrode conductor", "#4 Cu", "1 run"),
    ] },
    { title: "Rough-in & protection", crewDays: 3, codeFlag: "NEC 210 + adopted edition", items: [
      mi("Outlets / boxes", "12–16″ AFF; NEC 210.52 (≤6 ft / ≤12 ft)", `≈ ${outlets} outlets`),
      mi("Circuits", printed ? "fed down pre-printed chases" : "home-run to the panel", `≈ ${circuits}`),
      mi("Cable", "14/12-ga Romex (or conduit)", `≈ ${r0(circuits * 40)} LF`),
    ] },
    { title: "Trim-out & final test", crewDays: 2, items: [
      mi("Devices & plates", "switches, receptacles, fixtures", `≈ ${outlets}`),
      mi("Breakers + trip test", "GFCI/AFCI, polarity", `× ${circuits}`),
    ] },
  ];
}

// ── HVAC (form-aware; tiny = ductless mini-split) ───────────────────────────────────────────────────────────────────
function hvacSteps(m: SimModel, g: FormGeo): Omit<InstructionStep, "n">[] {
  if (tiny(m)) return [
    { title: "Ductless mini-split", crewDays: 1, codeFlag: "Manual J (tight small volume)", items: [
      mi("Mini-split", "~9,000 BTU (¾ ton) head + outdoor unit", "× 1 head"),
      mi("Line-set", "single insulated run", "1 line-set"),
    ] },
    { title: "Fresh air", crewDays: 1, items: [
      mi("Bath exhaust / small ERV", "a tight envelope brings in no outdoor air", "× 1"),
    ] },
  ];
  const tons = Math.round((g.areaFt2 / 500) * 2) / 2;      // ~400–600 ft²/ton
  return [
    { title: "Load calc & equipment", crewDays: 1, codeFlag: "Manual J/S + current DOE SEER2", items: [
      mi("Condenser", `Manual J → ≈ ${tons} tons (${r0(tons * 12)}k BTU)`, "× 1"),
      mi("Air handler", "~400 CFM/ton; meet SEER2", "× 1"),
    ] },
    { title: "Air handler & line-set", crewDays: 1, items: [
      mi("Refrigerant line-set", "¼″ liquid + ⅜–¾″ suction, insulated", `≈ ${r0(g.sideFt)} LF`),
      mi("Condenser pad", "with clearance", "× 1"),
    ] },
    { title: "Ductwork, registers & balance", crewDays: 3, codeFlag: "Manual D", items: [
      mi("Supply ducts", "Manual D ~0.10 in w.c./100 ft; 600–900 FPM", `≈ ${r0(g.areaFt2 / 10)} LF`),
      mi("Registers", "perimeter supplies + a return path", `≈ ${r0(g.areaFt2 / 120)} supplies · 1 return`),
    ] },
  ];
}

const STEP_FN: Record<ElementName, (m: SimModel, opt: BuildOption, g: FormGeo) => Omit<InstructionStep, "n">[]> = {
  Foundation: (m, _o, g) => foundationSteps(m, g),
  Framing: (m, o, g) => framingSteps(m, o, g),
  Roofing: (m, o, g) => roofingSteps(m, o, g),
  Plumbing: (m, o, g) => plumbingSteps(m, o, g),
  Electrical: (m, o, g) => electricalSteps(m, o, g),
  HVAC: (m, _o, g) => hvacSteps(m, g),
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
  const g = formGeometry(m);
  const phases: PhaseInstructions[] = BUILD_ORDER.map((element) => {
    const steps = withN(STEP_FN[element](m, o, g));
    return { element, label: phaseLabel(element, m, o), steps, crewDays: steps.reduce((s, x) => s + x.crewDays, 0) };
  });
  // FRAME WEIGHT on the Framing phase — steel vs wood vs concrete, with the strength-to-weight note (operator 2026-11-01).
  const framingPhase = phases.find((p) => p.element === "Framing");
  if (framingPhase && framingPhase.steps[0]) {
    const wt = frameWeight(m, o, g);
    framingPhase.steps[0].items.push(mi("Frame weight", `${wt.label} · ${wt.wallPsf} lb/ft² wall · ${wt.sw}`, `≈ ${commas(wt.totalLb)} lb`));
  }
  const totalCrewDays = phases.reduce((s, p) => s + p.crewDays, 0);
  const weeks = Math.round((totalCrewDays / (CREW * DAYS_PER_WEEK)) * 2) / 2;
  return {
    formId, label: m.label, option: o, methodLabel: METHODS[o.method].label,
    phases, totalCrewDays, weeks,
    note: `Each step lists the equipment, its size, and how much — a planning take-off you can price and buy from. Counts come from this design's footprint, perimeter and wall length (round up and add waste on site). Crew-days are hands-on work for a ${CREW}-person crew — not calendar time; the real calendar time (including the 28-day concrete cure, inspections and trade sequencing) is the months shown in Time to build above. This is a planning estimate — the buildable numbers come from a licensed pro and your local building code, and each phase flags where.`,
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
