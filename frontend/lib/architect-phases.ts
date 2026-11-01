/**
 * ARCHITECT-2525 · DEVELOPMENT PHASES (operator 2026-10-25: "there needs to be modes of phases of development").
 * ============================================================================================================
 * The construction phases, IN REAL BUILD ORDER (operator 2026-10-31: "roofing is not 8 … roof needs to be close to
 * framing; maybe after" · "Place icons and phases in order of build" · "insulation is likely something to add
 * throughout"). Each phase is a selectable MODE on the Design surface: a phase names what it is (the operator's own
 * words), carries concrete buildable SPECS, and DRAWS ONLY ITS OWN LAYER in the room (operator 2026-10-31: "mode
 * should only show that layer of key elements (not furniture. add Interior Design one element for toggle"). The
 * furniture is its own phase — INTERIOR DESIGN — the one phase that shows the furniture layer.
 *
 * ONE source of the phase order for every surface that lists phases (the Design phase bar, the Simulate build
 * schedule, the Build 4D sequence, the build instructions, the Lifecycle tab) — so "double check order of phases
 * throughout for consistency" (operator 2026-10-31) is a single list, gated by tests/architect-phases.test.mjs.
 *
 * Pure data + pure helpers, no React → replayable and gate-checked.
 */
export type PhaseLayer = "structure" | "wiring" | "water" | "sewer" | null;

/** What a phase DRAWS in the room designer — only its own layer. One source for the layer filter (R5d). */
export interface PhaseDraw {
  mep: PhaseLayer;      // the MEP run layer this phase shows (reuses the Design-Settings toggle), else null
  structure: boolean;   // the walls / stud skeleton
  openings: boolean;    // doors + windows (framing/shell layers)
  fixtures: boolean;    // the plumbing fixtures a water/sewer phase serves (sink/tub/toilet/shower/washer/counter)
  furniture: boolean;   // the furniture layer — ONLY the Interior Design phase
  note: string;         // the key-element the layer draws, in a word
}

export interface DevPhase {
  id: string;
  label: string;
  order: number;      // construction sequence, 1..N — IN BUILD ORDER
  icon: string;       // lucide key, mapped in phase-bar.tsx
  color: string;
  blurb: string;      // the operator's own one-line description of the phase
  specs: string[];    // concrete, buildable specs a vendor could price
  /** the existing wireframe MEP layer this phase turns ON in the model; null = no MEP run layer. */
  shows: PhaseLayer;
  /** TRUE for a construction phase that takes build time (in the Simulate schedule); FALSE for a design/staging
   *  layer (Interior Design) that is not a construction cost phase. */
  buildPhase: boolean;
  /** the EXISTING Vision-Tree discipline group this phase maps to (operator 2026-10-25: "align to existing menu"). */
  treeGroup: string;
  /** what this phase DRAWS in the room — only its own layer (R5d). */
  draw: PhaseDraw;
}

const L = (p: Partial<PhaseDraw>): PhaseDraw => ({ mep: null, structure: false, openings: false, fixtures: false, furniture: false, note: "", ...p });

export const DEV_PHASES: DevPhase[] = [
  {
    id: "foundation", label: "Foundation", order: 1, icon: "layers", color: "#9ca3af",
    blurb: "Cement and base — the slab and footings the whole home stands on.",
    treeGroup: "physical/foundation", shows: null, buildPhase: true, draw: L({ note: "slab + footings" }),
    specs: [
      "Slab-on-grade, 4\" concrete at 3,000 psi over a 10-mil vapor barrier",
      "Perimeter footings below the frost line; #4 rebar grid at 16\" o.c.",
      "½\" anchor bolts at 6' o.c. tie the sill plate to the slab",
      "Level datum = C1 SW corner [0,0,0], the canonical origin",
    ],
  },
  {
    id: "framing", label: "Framing", order: 2, icon: "frame", color: "#c084fc",
    blurb: "Walls and structural integrity — the stud skeleton and the load path.",
    treeGroup: "physical/structure", shows: "structure", buildPhase: true, draw: L({ structure: true, openings: true, note: "studs + headers" }),
    specs: [
      "2×4 / 2×6 studs at 16\" o.c., doubled top plate, single bottom plate",
      "Headers over every opening; king + jack studs carry the load down",
      "8' wall height; sheathing ties the shear walls",
      "Member depth follows the Design-Settings stud gauge",
    ],
  },
  {
    id: "roofing", label: "Roofing", order: 3, icon: "triangle", color: "#fb923c",
    blurb: "Roof structure — trusses, pitch and the weather shell (right after framing: dry-in).",
    treeGroup: "physical/building-envelope", shows: null, buildPhase: true, draw: L({ structure: true, note: "trusses + shell" }),
    specs: [
      "Engineered trusses / rafters at 24\" o.c.; ridge + eave defined",
      "Pitch sized for the climate (snow + wind load)",
      "Sheathing + underlayment + the finish roof material — dry-in before the rough-ins",
      "Place the Roof Panel from the Vision-Tree shell group",
    ],
  },
  {
    id: "plumbing", label: "Plumbing", order: 4, icon: "droplets", color: "#19c8cf",
    blurb: "Water-system distribution and specs — supply to every fixture.",
    treeGroup: "physical/plumbing", shows: "water", buildPhase: true, draw: L({ mep: "water", fixtures: true, note: "supply runs + fixtures" }),
    specs: [
      "½\" PEX supply off a manifold; ¾\" trunk from the meter/well",
      "Water heater sized to the fixture count; 40–60 psi working pressure",
      "Distribution runs drawn source → fixture",
      "Hot/cold balanced; freeze-protected on exterior walls",
    ],
  },
  {
    id: "sewer", label: "Sewer", order: 5, icon: "waves", color: "#22c55e",
    blurb: "Waste — sink, shower water and toilet — out to the main.",
    treeGroup: "physical/plumbing", shows: "sewer", buildPhase: true, draw: L({ mep: "sewer", fixtures: true, note: "DWV runs + fixtures" }),
    specs: [
      "DWV: a trap at every fixture, vented through the roof",
      "Drain slope ¼\" per foot to the 3–4\" main stack",
      "Toilet on a 3\" branch; sink/shower on 1½–2\"",
      "Runs drawn fixture → stack → sewer/septic connection",
    ],
  },
  {
    id: "electrical", label: "Electrical", order: 6, icon: "zap", color: "#ffd400",
    blurb: "Wiring and seeing where the lines will be — panel to every outlet.",
    treeGroup: "physical/electrical", shows: "wiring", buildPhase: true, draw: L({ mep: "wiring", note: "panel + wiring + outlets" }),
    specs: [
      "200 A main service panel; home-run circuits to each room",
      "Outlets to code (NEC): kitchen/bath on GFCI, bedrooms on AFCI",
      "Wiring runs drawn panel → outlet, so every line is visible",
      "Toggle the ⚡ layer in Design Settings to show/hide the runs",
    ],
  },
  {
    id: "internet", label: "Internet", order: 7, icon: "wifi", color: "#38bdf8",
    blurb: "Optimized for Starlink and LAN — dish, backbone and drops.",
    treeGroup: "physical/communications-low-voltage", shows: null, buildPhase: true, draw: L({ note: "dish + LAN drops" }),
    specs: [
      "Starlink dish on a clear-sky roof/mast mount; PoE to the router",
      "Cat6 LAN drops to every room; switch + patch in the utility closet",
      "Wi-Fi access points for whole-home coverage, backhauled on Cat6",
      "Runs drawn dish → router → room drops (layer: next)",
    ],
  },
  {
    id: "security", label: "Security", order: 8, icon: "camera", color: "#f87171",
    blurb: "Talisman Security · Powered by SensorFusion-2525 — camera network across the home.",
    treeGroup: "physical/communications-low-voltage", shows: null, buildPhase: true, draw: L({ note: "cameras + coverage" }),
    specs: [
      "Talisman Security · Powered by SensorFusion-2525",
      "Default: 4 cameras, one in each roof corner; PoE back to an NVR",
      "Upgrade: a rail camera spanning the full length of the house",
      "Extra: door camera + window cameras facing out; door/window + motion fused",
    ],
  },
  {
    id: "insulation", label: "Insulation", order: 9, icon: "shield", color: "#f0abfc",
    blurb: "Envelope insulation throughout — walls, roof and floor (the environmental factor).",
    treeGroup: "physical/building-envelope", shows: null, buildPhase: true, draw: L({ structure: true, note: "R-value envelope" }),
    specs: [
      "Walls R-20+5 ci · roof/attic R-49 · floor R-30 (IECC 2021 CZ 2A baseline)",
      "Air-seal to ≤ 3 ACH50; continuous exterior insulation breaks the thermal bridge",
      "Insulation level drives Thermal / HVAC / Carbon / Lifecycle (the environmental factor)",
      "Added THROUGHOUT the envelope — the operator's 2026-10-31 phase",
    ],
  },
  {
    id: "finish", label: "Finish", order: 10, icon: "paintbrush", color: "#a3e635",
    blurb: "Interior finish — drywall, flooring, trim and paint, the surfaces you touch.",
    treeGroup: "physical/interior-finish", shows: null, buildPhase: true, draw: L({ openings: true, note: "drywall + flooring" }),
    specs: [
      "Drywall hung + taped + finished; primed and painted",
      "Flooring by room (tile wet areas, LVP/wood living, carpet sleep)",
      "Trim, casing + interior door slabs hung in the framed openings",
      "Fixtures + fittings set (the finish before the furniture goes in)",
    ],
  },
  {
    id: "interior", label: "Interior Design", order: 11, icon: "sofa", color: "#c084fc",
    blurb: "The furniture layer — place and arrange the room's furniture (the staging phase).",
    treeGroup: "physical/interior", shows: null, buildPhase: false, draw: L({ furniture: true, openings: true, note: "furniture" }),
    specs: [
      "Place the room's furniture from the palette (Sleep / Living / Kitchen / Bath)",
      "This is the ONLY phase that shows the furniture layer — every other phase hides it",
      "Not a construction cost phase — staging, outside the build schedule",
      "The Room Designer's palette + tools live here",
    ],
  },
];

export const phaseById = (id: string | null | undefined): DevPhase | null =>
  DEV_PHASES.find((p) => p.id === id) ?? null;

/** The ordered phase ids — the one source of the build order for every surface. */
export const PHASE_ORDER: string[] = DEV_PHASES.map((p) => p.id);

/** The construction phases that take build time (feed the Simulate schedule) — Interior Design is staging, excluded. */
export const BUILD_PHASES: DevPhase[] = DEV_PHASES.filter((p) => p.buildPhase);

/** What a phase draws in the room — only its own layer. No phase selected → draw everything (the full design view). */
export function phaseDraw(id: string | null | undefined): PhaseDraw {
  const p = phaseById(id);
  if (!p) return { mep: null, structure: true, openings: true, fixtures: true, furniture: true, note: "all" };
  return p.draw;
}
