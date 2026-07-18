/**
 * ARCHITECT-2525 · LAYER TREE — Vision 2525 Digital Twin Standard v1.0.
 * =================================================================================================
 * The Layer Tree is the single source of truth for the physical Digital Twin. It answers ONE
 * question: "What exists?" Every other workspace (Overview, Simulate, Review, Build, Lifecycle)
 * references this structure — none may redefine or duplicate it.
 *
 * Three top-level scopes:
 *   • Physical Digital Twin   — Site → Exterior, each physical SYSTEM (10 of 12) carrying a nested
 *                               "Level 3 Cubes" child (never a top-level branch; Site & Spaces have none).
 *   • Operational Intelligence — reference layers (Documents … Knowledge Graph).
 *   • Lifecycle                — generated layers (Assets … End of Life).
 *
 * Pure data (no React) so it is deterministic/replayable and so alternate trees (multi-family,
 * commercial, institutional) are just alternate exports later. Depth is not uniform: Structure is
 * four levels deep (Scope → Structure → Primary/Floor/Roof/Lateral System → members).
 */

export interface LayerNode {
  id: string;              // stable, unique, path-derived slug — used as the SPIRAL `data-layer-node` hook
  label: string;
  level3?: boolean;        // the "Level 3 Cubes" marker node (nested inside a physical system)
  children?: LayerNode[];
}

export interface LayerScope {
  id: string;
  label: string;
  sub?: string;
  children: LayerNode[];
}

// ── terse authoring form: a string is a leaf; { t, c } is a branch ──
type Raw = string | { t: string; c: Raw[] };
const B = (t: string, c: Raw[]): Raw => ({ t, c });

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function build(raw: Raw, parentId: string): LayerNode {
  const label = typeof raw === "string" ? raw : raw.t;
  const id = `${parentId}/${slug(label)}`;
  const node: LayerNode = { id, label };
  if (label === "Level 3 Cubes") node.level3 = true;
  const kids = typeof raw === "string" ? undefined : raw.c;
  if (kids?.length) node.children = kids.map((k) => build(k, id));
  return node;
}

const L3 = "Level 3 Cubes"; // nested marker leaf — the Level-3 substrate hook inside a physical system

// ── PHYSICAL DIGITAL TWIN ──────────────────────────────────────────────────────────────────────
const PHYSICAL: Raw[] = [
  B("Site", [
    "Parcel / Property Boundaries", "Terrain & Grading", "Topography", "Drainage & Stormwater",
    "Utilities (Water, Sewer, Electric, Gas, Telecom)", "Setbacks & Easements", "Environmental Conditions",
    "Solar Orientation & Wind Context", "Existing Structures & Vegetation",
  ]),
  B("Spaces", [
    "Floors", "Rooms & Zones", "Circulation Paths", "Vertical Circulation (Stairs, Elevators)",
    "Functional Areas", "Occupancy Types", "Accessibility Routes", "Emergency Egress Routes", "Outdoor Spaces",
  ]),
  B("Foundation", [
    "Footings", "Foundation Walls", "Slab-on-Grade", "Basement / Crawlspace", "Waterproofing & Dampproofing",
    "Drainage Systems", "Rebar & Reinforcement", "Anchor Bolts & Hold-downs", L3,
  ]),
  B("Structure", [
    B("Primary Structure", ["Beams & Girders", "Columns & Posts", "Load-Bearing Walls", "Structural Steel (if used)"]),
    B("Floor Systems", ["Floor Joists", "Subfloor", "Blocking & Bridging"]),
    B("Roof Systems", ["Rafters / Roof Trusses", "Ridge Beams", "Collar Ties & Rafter Ties", "Roof Sheathing"]),
    B("Lateral Systems", ["Shear Walls", "Bracing", "Moment Frames"]),
    L3,
  ]),
  B("Building Envelope", [
    "Exterior Walls", "Roofing System", "Windows & Exterior Doors", "Insulation & Weather Barriers",
    "Flashing & Waterproofing", "Vapor Barriers", "Cladding / Siding", "Soffit, Fascia & Trim", L3,
  ]),
  B("Mechanical", ["Rough-In", "Finish", "Equipment", "Ductwork", "Ventilation Systems", L3]),
  B("Electrical", [
    "Rough-In", "Finish", "Main Service & Panel", "Circuits & Wiring", "Lighting", "Devices & Fixtures",
    "Low Voltage Systems", L3,
  ]),
  B("Plumbing", ["Rough-In", "Finish", "Supply Lines", "Drain, Waste & Vent (DWV)", "Water Heater", "Fixtures", L3]),
  B("Fire Protection", ["Fire Alarm Systems", "Smoke & CO Detectors", "Sprinkler Systems (if applicable)", L3]),
  B("Communications & Low Voltage", ["Data / Networking", "Security Systems", "Audio / Visual", "Smart Home Systems", L3]),
  B("Interior", [
    "Non-Load-Bearing Walls", "Drywall & Finishes", "Flooring", "Interior Doors & Trim", "Cabinetry & Millwork",
    "Countertops & Backsplashes", "Painting & Coatings", L3,
  ]),
  B("Exterior", [
    "Landscaping", "Hardscaping", "Driveways & Walkways", "Decks, Patios & Porches", "Lower Deck", "Upper Deck",
    "Pool", "Pool Chiller / Equipment", "Hot Tub / Spa", "Outdoor Kitchen", "Fencing", "Exterior Lighting", L3,
  ]),
];

// ── OPERATIONAL INTELLIGENCE (reference layers) ──────────────────────────────────────────────────
const OPERATIONAL: Raw[] = ["Documents", "Simulations", "Reviews", "Replay", "Economy", "Knowledge Graph"];

// ── LIFECYCLE (generated) ────────────────────────────────────────────────────────────────────────
const LIFECYCLE: Raw[] = ["Assets", "Maintenance", "Warranty", "Service History", "Renovations", "End of Life"];

export const LAYER_TREE: LayerScope[] = [
  { id: "physical", label: "Physical Digital Twin", sub: "what exists", children: PHYSICAL.map((r) => build(r, "physical")) },
  { id: "operational", label: "Operational Intelligence", sub: "reference layers", children: OPERATIONAL.map((r) => build(r, "operational")) },
  { id: "lifecycle", label: "Lifecycle", sub: "generated", children: LIFECYCLE.map((r) => build(r, "lifecycle")) },
];

// Flatten helper (used by search + selection lookup).
export function flattenLayers(nodes: LayerNode[] = LAYER_TREE.flatMap((s) => s.children)): LayerNode[] {
  const out: LayerNode[] = [];
  const walk = (n: LayerNode) => { out.push(n); n.children?.forEach(walk); };
  nodes.forEach(walk);
  return out;
}

// Count leaf-bearing descendants for the group `·N` badge (matches Security's `·{items.length}`).
export function childCount(node: LayerNode | LayerScope): number {
  return node.children?.length ?? 0;
}

// ── PROJECT TYPE ────────────────────────────────────────────────────────────────────────────────
// TARGET MARKETS. The product serves two: Tiny Home and Home. A Tiny Home has LIMITED decisions — a
// curated subset of physical systems/components is buildable; a Home is the full digital twin.
// (Operator: "Tiny Home & Home are two target markets" · "tiny home … limits what assets … limited decisions.")
export type HomeType = "full" | "tiny";
export const HOME_TYPES: { id: HomeType; label: string; note: string }[] = [
  { id: "tiny", label: "Tiny Home", note: "Limited systems · fewer decisions · faster to build" },
  { id: "full", label: "Home", note: "Full digital twin · every system + Level 3 substrate" },
];

// Tiny-home-buildable components, authored by label so slugs stay in sync with the tree. Excluded entirely:
// Fire Protection, Communications & Low Voltage, and all Level 3 Cubes (no L3 substrate on a tiny home).
const TINY_SPEC: Record<string, string[]> = {
  Site: ["Parcel / Property Boundaries", "Utilities (Water, Sewer, Electric, Gas, Telecom)", "Setbacks & Easements", "Solar Orientation & Wind Context"],
  Spaces: ["Floors", "Rooms & Zones", "Circulation Paths", "Outdoor Spaces"],
  Foundation: ["Footings", "Slab-on-Grade", "Anchor Bolts & Hold-downs"],
  Structure: ["Primary Structure", "Floor Systems", "Roof Systems"],
  "Building Envelope": ["Exterior Walls", "Roofing System", "Windows & Exterior Doors", "Insulation & Weather Barriers", "Cladding / Siding"],
  Mechanical: ["Equipment", "Ventilation Systems"],
  Electrical: ["Main Service & Panel", "Circuits & Wiring", "Lighting", "Devices & Fixtures"],
  Plumbing: ["Supply Lines", "Drain, Waste & Vent (DWV)", "Water Heater", "Fixtures"],
  Interior: ["Non-Load-Bearing Walls", "Flooring", "Cabinetry & Millwork", "Painting & Coatings"],
  Exterior: ["Decks, Patios & Porches", "Exterior Lighting"],
};
const TINY_HOME_IDS = new Set<string>(
  Object.entries(TINY_SPEC).flatMap(([sys, leaves]) => leaves.map((l) => `physical/${slug(sys)}/${slug(l)}`)),
);

// A physical node is visible for a Tiny Home if it is (or contains, or is an ancestor of) a buildable
// component — but never a Level 3 Cubes node. Precomputed once (ancestors + descendants of each allowed id).
export const TINY_VISIBLE: Set<string> = (() => {
  const vis = new Set<string>();
  Array.from(TINY_HOME_IDS).forEach((id) => {
    const f = findLayer(id);
    if (!f) return;
    f.path.forEach((n) => vis.add(n.id));               // self + ancestors
    flattenLayers([f.node]).forEach((n) => { if (!n.level3) vis.add(n.id); }); // self + descendants, minus L3
  });
  return vis;
})();

// Is this node offered for the given home type? Only the physical scope is limited; Operational/Lifecycle stay full.
export function isVisibleForType(id: string, scopeId: string, homeType: HomeType): boolean {
  if (homeType === "full" || scopeId !== "physical") return true;
  return TINY_VISIBLE.has(id);
}

// Resolve an id to its node, owning scope, and ancestor path (root → node). Used by the Context inspector.
export function findLayer(id: string): { node: LayerNode; scope: LayerScope; path: LayerNode[] } | null {
  for (const scope of LAYER_TREE) {
    const path: LayerNode[] = [];
    const dfs = (nodes: LayerNode[]): LayerNode | null => {
      for (const n of nodes) {
        path.push(n);
        if (n.id === id) return n;
        if (n.children) { const f = dfs(n.children); if (f) return f; }
        path.pop();
      }
      return null;
    };
    const found = dfs(scope.children);
    if (found) return { node: found, scope, path: [...path] };
  }
  return null;
}

// ── Recommend placement (Vision 2525) — deterministic starter builds for the "HI recommend" / "AI recommend" ask.
//  • HI (standard): the code/historical-norm CORE systems (foundation · structure · envelope · MEP) — a sound,
//    conventional build. • AI (vision): the HI core PLUS the experience/design systems (interior · exterior ·
//    comms/low-voltage), and, for a STYLIZED vision, fire-protection too — a design-forward, non-standard build.
// Both return buildable leaf ids filtered by the home type. Pure + deterministic (no network) — a real provider
// call can replace the AI branch later without changing callers.
const HI_CORE_SYSTEMS = ["physical/foundation", "physical/structure", "physical/building-envelope", "physical/mechanical", "physical/electrical", "physical/plumbing"];
const AI_VISION_SYSTEMS = ["physical/interior", "physical/exterior", "physical/communications-low-voltage"];

export function recommendPlacement(mode: "hi" | "ai", homeType: HomeType, style: "standard" | "stylized" = "standard"): string[] {
  const systems = mode === "hi"
    ? HI_CORE_SYSTEMS
    : [...HI_CORE_SYSTEMS, ...AI_VISION_SYSTEMS, ...(style === "stylized" ? ["physical/fire-protection"] : [])];
  const ids = new Set<string>();
  for (const sysId of systems) {
    const found = findLayer(sysId);
    if (!found) continue;
    flattenLayers([found.node])
      .filter((n) => !n.children?.length && !n.level3 && isVisibleForType(n.id, "physical", homeType))
      .forEach((n) => ids.add(n.id));
  }
  return Array.from(ids);
}
