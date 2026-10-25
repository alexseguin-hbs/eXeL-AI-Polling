/**
 * ARCHITECT-2525 · DEVELOPMENT PHASES (operator 2026-10-25: "there needs to be modes of phases of development").
 * ============================================================================================================
 * The eight construction phases, IN BUILD ORDER, each a selectable MODE on the Design surface. A phase names
 * what it is (the operator's own words), carries its concrete buildable SPECS, and — for the four that already
 * have a wireframe layer — drives WHICH system the model shows (reusing the Design-Settings toggles: structure,
 * wiring, water, sewer). The four without a layer yet (Foundation · Internet · Security · Roofing) carry their
 * spec card now; their wireframe layer is the declared next step (honest: shows=null).
 *
 * Pure data, no React → replayable and gate-checked (tests/architect-phases.test.mjs).
 */
export type PhaseLayer = "structure" | "wiring" | "water" | "sewer" | null;

export interface DevPhase {
  id: string;
  label: string;
  order: number;     // construction sequence, 1..8
  icon: string;      // lucide key, mapped in phase-bar.tsx
  color: string;
  blurb: string;     // the operator's own one-line description of the phase
  specs: string[];   // concrete, buildable specs a vendor could price
  /** the existing wireframe layer this phase turns ON in the model; null = spec-only until its layer ships. */
  shows: PhaseLayer;
}

export const DEV_PHASES: DevPhase[] = [
  {
    id: "foundation", label: "Foundation", order: 1, icon: "layers", color: "#9ca3af",
    blurb: "Cement and base — the slab and footings the whole home stands on.",
    specs: [
      "Slab-on-grade, 4\" concrete at 3,000 psi over a 10-mil vapor barrier",
      "Perimeter footings below the frost line; #4 rebar grid at 16\" o.c.",
      "½\" anchor bolts at 6' o.c. tie the sill plate to the slab",
      "Level datum = C1 SW corner [0,0,0], the canonical origin",
    ],
    shows: null,
  },
  {
    id: "framing", label: "Framing", order: 2, icon: "frame", color: "#c084fc",
    blurb: "Walls and structural integrity — the stud skeleton and the load path.",
    specs: [
      "2×4 / 2×6 studs at 16\" o.c., doubled top plate, single bottom plate",
      "Headers over every opening; king + jack studs carry the load down",
      "8' wall height; sheathing ties the shear walls",
      "Member depth follows the Design-Settings stud gauge",
    ],
    shows: "structure",
  },
  {
    id: "electrical", label: "Electrical", order: 3, icon: "zap", color: "#ffd400",
    blurb: "Wiring and seeing where the lines will be — panel to every outlet.",
    specs: [
      "200 A main service panel; home-run circuits to each room",
      "Outlets to code (NEC): kitchen/bath on GFCI, bedrooms on AFCI",
      "Wiring runs drawn panel → outlet, so every line is visible",
      "Toggle the ⚡ layer in Design Settings to show/hide the runs",
    ],
    shows: "wiring",
  },
  {
    id: "plumbing", label: "Plumbing", order: 4, icon: "droplets", color: "#19c8cf",
    blurb: "Water-system distribution and specs — supply to every fixture.",
    specs: [
      "½\" PEX supply off a manifold; ¾\" trunk from the meter/well",
      "Water heater sized to the fixture count; 40–60 psi working pressure",
      "Distribution runs drawn source → fixture",
      "Hot/cold balanced; freeze-protected on exterior walls",
    ],
    shows: "water",
  },
  {
    id: "sewer", label: "Sewer", order: 5, icon: "waves", color: "#22c55e",
    blurb: "Waste — sink, shower water and toilet — out to the main.",
    specs: [
      "DWV: a trap at every fixture, vented through the roof",
      "Drain slope ¼\" per foot to the 3–4\" main stack",
      "Toilet on a 3\" branch; sink/shower on 1½–2\"",
      "Runs drawn fixture → stack → sewer/septic connection",
    ],
    shows: "sewer",
  },
  {
    id: "internet", label: "Internet", order: 6, icon: "wifi", color: "#38bdf8",
    blurb: "Optimized for Starlink and LAN — dish, backbone and drops.",
    specs: [
      "Starlink dish on a clear-sky roof/mast mount; PoE to the router",
      "Cat6 LAN drops to every room; switch + patch in the utility closet",
      "Wi-Fi access points for whole-home coverage, backhauled on Cat6",
      "Runs drawn dish → router → room drops (layer: next)",
    ],
    shows: null,
  },
  {
    id: "security", label: "Security", order: 7, icon: "camera", color: "#f87171",
    blurb: "Camera-system network — sensor fusion across the home.",
    specs: [
      "IP cameras at entries + corners; PoE back to an NVR",
      "Door/window + motion sensors fused (SensorFusion-2525)",
      "Coverage overlap at every entry; night-vision on the exterior",
      "Runs drawn camera → NVR with coverage cones (layer: next)",
    ],
    shows: null,
  },
  {
    id: "roofing", label: "Roofing", order: 8, icon: "triangle", color: "#fb923c",
    blurb: "Roof structure — trusses, pitch and the weather shell.",
    specs: [
      "Engineered trusses / rafters at 24\" o.c.; ridge + eave defined",
      "Pitch sized for the climate (snow + wind load)",
      "Sheathing + underlayment + the finish roof material",
      "Place the Roof Panel from the Vision-Tree shell group",
    ],
    shows: null,
  },
];

export const phaseById = (id: string | null | undefined): DevPhase | null =>
  DEV_PHASES.find((p) => p.id === id) ?? null;
