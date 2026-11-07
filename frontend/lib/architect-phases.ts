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
import { rainbow } from "./architect-rainbow";
import type { ElementName } from "./architect-sim-options";   // type-only: no runtime edge back into sim-options

export type PhaseLayer = "structure" | "wiring" | "water" | "sewer" | "duct" | null;

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

// R-UX6 (operator 2026-11-01): phase colours run RED → VIOLET in build order, from the one rainbow() source. The inline
// `color` on each entry below is OVERRIDDEN by the rainbow map at the export (kept only so each entry type-checks).
const DEV_PHASES_SRC: DevPhase[] = [
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
      "10' storey (the 10-ft cube); sheathing ties the shear walls",
      "Member depth follows the Design-Settings stud gauge",
    ],
  },
  {
    id: "roofing", label: "Roof", order: 3, icon: "triangle", color: "#fb923c",
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
    id: "hvac", label: "Air Flow", order: 7, icon: "wind", color: "#38bdf8",
    blurb: "Heating and cooling — the ducts in the plenum, registers to every room (the MEP rough-in).",
    treeGroup: "physical/hvac", shows: "duct", buildPhase: true, draw: L({ mep: "duct", note: "trunk + branch + registers" }),
    specs: [
      "Trunk + branch supply ducts in the 2-ft plenum above the 10-ft ceiling",
      "A ceiling supply register + a volume-control damper in every conditioned room",
      "Return-air grilles where allowed (not bath / kitchen / closet / storage, IRC M1602.2)",
      "One air handler in the utility room; sized to the Insulation envelope",
    ],
  },
  {
    id: "internet", label: "Internet", order: 8, icon: "wifi", color: "#38bdf8",
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
    id: "security", label: "Security", order: 9, icon: "camera", color: "#f87171",
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
    id: "insulation", label: "Insulation", order: 10, icon: "shield", color: "#f0abfc",
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
    id: "finish", label: "Finish", order: 11, icon: "paintbrush", color: "#a3e635",
    blurb: "Interior finish — drywall, flooring, trim and paint, the surfaces you touch.",
    treeGroup: "physical/interior-finish", shows: null, buildPhase: true, draw: L({ openings: true, fixtures: true, note: "drywall + flooring + fixtures set" }),
    specs: [
      "Drywall hung + taped + finished; primed and painted",
      "Flooring by room (tile wet areas, LVP/wood living, carpet sleep)",
      "Trim, casing + interior door slabs hung in the framed openings",
      "Fixtures + fittings set (the finish before the furniture goes in)",
    ],
  },
  {
    id: "interior", label: "Interior Design", order: 12, icon: "sofa", color: "#c084fc",
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

// RED → VIOLET across the 12 phases in build order: Foundation = red … Interior Design = violet (one rainbow() source).
const _PHASE_RB = rainbow(DEV_PHASES_SRC.length);
export const DEV_PHASES: DevPhase[] = DEV_PHASES_SRC.map((p, i) => ({ ...p, color: _PHASE_RB[i] }));

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

/**
 * Does an object of this palette GROUP draw in the given phase? ONE source for the room layer filter — reused by the
 * room designer's 2D/3D (showInPhase) AND the first-person walkthrough, so "a phase shows only its layer" is the same
 * everywhere (operator 2026-11-06: the walk must honour the selected phase — walk the framing shell, not the furnished
 * room). Takes the group string (from room-objects' groupOf) so this stays pure data with no room-objects dependency.
 */
export function showGroupInPhase(group: string, id: string | null | undefined): boolean {
  const d = phaseDraw(id);
  if (group === "Openings") return d.openings;              // doors + windows
  if (group === "Shell") return d.structure || d.furniture; // shell / roof panels
  if (group === "Bath" || group === "Kitchen") return d.fixtures || d.furniture; // plumbing fixtures
  return d.furniture;                                        // Sleep / Living furniture
}

/**
 * PHASE → BUILD-DIRECTIONS ELEMENT (Revision A · P0·H, 2026-11-07). The walk/design surfaces select one of the 12
 * DEV_PHASES; the build directions (lib/architect-build-instructions BUILD_ORDER) carry a take-off for SIX elements. This
 * is the ONE map between the two vocabularies — never a third list, never a guess: every phase id is an EXPLICIT key, to
 * the element whose take-off it reads, or `null` = this phase honestly has no take-off yet (internet · security ·
 * insulation · finish are not costed elements; interior design is staging, not construction). Sewer reads the Plumbing
 * take-off (its DWV rough-in step lives there). Gated by tests/architect-directions-drift.test.mjs.
 */
export const PHASE_ELEMENT: Readonly<Record<string, ElementName | null>> = {
  foundation: "Foundation",
  framing: "Wall System",
  roofing: "Roof",
  plumbing: "Plumbing",
  sewer: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  internet: null,
  security: null,
  insulation: null,
  finish: null,
  interior: null,
};
/** The directions element for a phase id — an ElementName, or null for "no take-off" / an unknown or empty id. Pure. */
export function elementForPhase(phaseId: string | null | undefined): ElementName | null {
  if (!phaseId || !Object.prototype.hasOwnProperty.call(PHASE_ELEMENT, phaseId)) return null;
  return PHASE_ELEMENT[phaseId];
}
