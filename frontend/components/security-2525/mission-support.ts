/**
 * SECURITY-2525 · Mission-Support Object Catalog (starter subset)
 * ==============================================================
 * A representative, testable slice of the Consolidated Canonical Object Ontology
 * (docs/security-2525/ONTOLOGY_MISSION_SUPPORT.md). Mission-support EVIDENCE
 * objects only — the system visualizes, classifies, validates, replays, and
 * assesses readiness. It does NOT generate assault, targeting, evasion, or
 * route-execution guidance.
 *
 * Visual color law (R-CORE Consolidation 3 §"Visual Law"):
 *   green=land · blue=water · cyan=bathy/subsurface · red=restricted/hostile/
 *   critical · orange=caution · gold=selected/active · white=grid · gray=built
 *   env/infra · purple=aerial route · yellow=unknown · SOF=distinct frame.
 *
 * Governance wrappers (human authority, R-CORE lifecycle, replay integrity,
 * UCRS-2525, reality_mode, Vision 2525 alignment) are specified for the full
 * build in docs/security-2525/ONTOLOGY_GOVERNANCE_VISION2525.md. Each placed
 * object here carries the MINIMAL stub: realityMode + rcoreState, so the UI is
 * ready to grow into the full packet without a data migration.
 */

export type Geometry = "point" | "line" | "area" | "corridor";
export type LegendGroup =
  | "personnel" | "sustainment" | "medical" | "aviation" | "route" | "entity"
  | "risk" | "littoral" | "terrain" | "infra" | "sensor";

export interface SupportObjectDef {
  key: string;
  term: string;
  aliases?: string[];
  group: LegendGroup;
  geometry: Geometry;
  /** stroke/fill color — visual color law */
  color: string;
  /** short glyph hint for the marker renderer */
  glyph: MarkerGlyph;
  /** SSSES export sensitivity — drives public-mode generalization */
  sensitive?: boolean;
}

export type MarkerGlyph =
  | "supply" | "fuel" | "ammo" | "water" | "medical" | "medevac"
  | "aviation" | "lz" | "drop" | "route" | "waypoint" | "checkpoint"
  | "enemy" | "neutral" | "unknown" | "sof" | "sensor" | "observation"
  | "restricted" | "caution" | "shore" | "port" | "terrain" | "infra"
  | "personnel" | "guard" | "squad" | "k9" | "sniper";

// Legend-group palette (per visual law). Entities/risk override per-item.
export const GROUP_META: Record<LegendGroup, { label: string; color: string }> = {
  personnel: { label: "Personnel / Forces", color: "#38bdf8" },
  sustainment: { label: "Sustainment / Supply", color: "#9fb0c0" },
  medical: { label: "Medical / Casualty", color: "#34d399" },
  aviation: { label: "Aviation Support", color: "#19c8cf" },
  route: { label: "Routes / Distribution", color: "#7dd3fc" },
  entity: { label: "Entities (Joint Deconfliction)", color: "#f8fafc" },
  risk: { label: "Risk / Restriction", color: "#f59e0b" },
  littoral: { label: "Littoral / Shore", color: "#38bdf8" },
  terrain: { label: "Terrain / Hydrography", color: "#00ff9f" },
  infra: { label: "Infrastructure / Civilian", color: "#94a3b8" },
  sensor: { label: "Sensor / Comms", color: "#a78bfa" },
};

const RED = "#ef4444", ORANGE = "#f59e0b", GOLD = "#ffd400", GREEN = "#22c55e";
const GRAY = "#94a3b8", CYAN = "#19c8cf", PURPLE = "#a78bfa", YELLOW = "#facc15";
const BLUE = "#38bdf8", LAND = "#00ff9f", SUP = "#9fb0c0";

/**
 * Starter catalog — one preferred term per canonical entry, broad coverage of
 * every legend group so the operator can click around and place them. Routes /
 * areas place as anchor points for now (full geometry drawing is a later CRS).
 */
export const SUPPORT_CATALOG: SupportObjectDef[] = [
  // ── Personnel / Forces (friendly by default; flip in the inspector) ────
  { key: "security_guard", term: "Security Guard", aliases: ["static guard"], group: "personnel", geometry: "point", color: BLUE, glyph: "guard" },
  { key: "sentry_post", term: "Sentry Post / OP", group: "personnel", geometry: "point", color: BLUE, glyph: "guard" },
  { key: "infantry_squad", term: "Infantry Squad", group: "personnel", geometry: "point", color: BLUE, glyph: "squad" },
  { key: "fire_team", term: "Fire Team", group: "personnel", geometry: "point", color: BLUE, glyph: "squad" },
  { key: "qrf", term: "Quick Reaction Force", aliases: ["QRF"], group: "personnel", geometry: "point", color: BLUE, glyph: "squad" },
  { key: "sniper", term: "Sniper / Overwatch", group: "personnel", geometry: "point", color: BLUE, glyph: "sniper" },
  { key: "k9", term: "K9 Unit", group: "personnel", geometry: "point", color: BLUE, glyph: "k9" },
  { key: "eod", term: "EOD Team", group: "personnel", geometry: "point", color: BLUE, glyph: "personnel", sensitive: true },
  { key: "le_police", term: "Police / Law Enforcement", group: "personnel", geometry: "point", color: BLUE, glyph: "personnel" },
  { key: "medic_person", term: "Medic (dismounted)", group: "personnel", geometry: "point", color: GREEN, glyph: "medical" },

  // ── Sustainment / Supply ──────────────────────────────────────────────
  { key: "supply_point", term: "Supply Point", aliases: ["supply support activity"], group: "sustainment", geometry: "point", color: SUP, glyph: "supply" },
  { key: "supply_depot", term: "Supply Depot", aliases: ["depot"], group: "sustainment", geometry: "area", color: SUP, glyph: "supply", sensitive: true },
  { key: "fuel_point", term: "Class III Fuel Point", aliases: ["fuel point", "fuel distribution point"], group: "sustainment", geometry: "point", color: SUP, glyph: "fuel" },
  { key: "ammo_point", term: "Class V Ammunition Point", aliases: ["ammunition transfer point"], group: "sustainment", geometry: "point", color: SUP, glyph: "ammo", sensitive: true },
  { key: "water_point", term: "Class I Water / Food Point", aliases: ["water distribution point"], group: "sustainment", geometry: "point", color: SUP, glyph: "water" },
  { key: "log_node", term: "Forward Logistics Node", aliases: ["logistics node", "sustainment node"], group: "sustainment", geometry: "point", color: SUP, glyph: "supply" },
  { key: "cache", term: "Cache / Prepositioned Stock", group: "sustainment", geometry: "point", color: SUP, glyph: "supply", sensitive: true },
  { key: "staging_area", term: "Staging Area", aliases: ["staging point"], group: "sustainment", geometry: "area", color: SUP, glyph: "supply" },

  // ── Medical / Casualty ────────────────────────────────────────────────
  { key: "ccp", term: "Casualty Collection Point", aliases: ["medical collection point"], group: "medical", geometry: "point", color: GREEN, glyph: "medical", sensitive: true },
  { key: "aid_station", term: "Aid Station", group: "medical", geometry: "point", color: GREEN, glyph: "medical", sensitive: true },
  { key: "medevac", term: "MEDEVAC Pickup Point", aliases: ["medical evacuation pickup point"], group: "medical", geometry: "point", color: GREEN, glyph: "medevac", sensitive: true },
  { key: "mtf", term: "Medical Treatment Facility", aliases: ["hospital or clinic"], group: "medical", geometry: "point", color: GREEN, glyph: "medical", sensitive: true },
  { key: "med_supply", term: "Class VIII Medical Supply Point", group: "medical", geometry: "point", color: GREEN, glyph: "medical" },

  // ── Aviation Support ──────────────────────────────────────────────────
  { key: "hlz", term: "Helicopter Landing Zone", aliases: ["helo landing zone", "LZ"], group: "aviation", geometry: "area", color: CYAN, glyph: "lz" },
  { key: "pz", term: "Pickup Zone", group: "aviation", geometry: "area", color: CYAN, glyph: "lz" },
  { key: "dz", term: "Drop Zone", group: "aviation", geometry: "area", color: CYAN, glyph: "drop" },
  { key: "farp", term: "Forward Arming & Refueling Point", aliases: ["FARP"], group: "aviation", geometry: "point", color: CYAN, glyph: "aviation" },
  { key: "uas_point", term: "UAS Launch / Recovery Point", group: "aviation", geometry: "point", color: CYAN, glyph: "aviation" },
  { key: "aerial_corridor", term: "Aerial Corridor", aliases: ["air corridor"], group: "aviation", geometry: "corridor", color: PURPLE, glyph: "aviation" },

  // ── Routes / Distribution ─────────────────────────────────────────────
  { key: "msr", term: "Main Supply Route", group: "route", geometry: "line", color: BLUE, glyph: "route" },
  { key: "asr", term: "Alternate Supply Route", aliases: ["alternate route"], group: "route", geometry: "line", color: BLUE, glyph: "route" },
  { key: "convoy_route", term: "Convoy Route", group: "route", geometry: "line", color: BLUE, glyph: "route" },
  { key: "restricted_route", term: "Restricted Route", group: "route", geometry: "line", color: RED, glyph: "route" },
  { key: "checkpoint", term: "Checkpoint", aliases: ["route checkpoint"], group: "route", geometry: "point", color: BLUE, glyph: "checkpoint" },
  { key: "waypoint", term: "Waypoint", group: "route", geometry: "point", color: BLUE, glyph: "waypoint" },
  { key: "tcp", term: "Traffic Control Post", group: "route", geometry: "point", color: BLUE, glyph: "checkpoint" },

  // ── Entities (Joint Deconfliction) ────────────────────────────────────
  { key: "enemy", term: "Enemy / Opposing-Force Unit", group: "entity", geometry: "point", color: RED, glyph: "enemy", sensitive: true },
  { key: "neutral", term: "Neutral Entity", group: "entity", geometry: "point", color: GREEN, glyph: "neutral" },
  { key: "unknown", term: "Unknown Contact", group: "entity", geometry: "point", color: YELLOW, glyph: "unknown" },
  { key: "sof_node", term: "SOF Support Node", aliases: ["special operations presence indicator"], group: "entity", geometry: "point", color: GOLD, glyph: "sof", sensitive: true },
  { key: "observation", term: "Observation Point", group: "sensor", geometry: "point", color: PURPLE, glyph: "observation" },
  { key: "sensor", term: "Sensor Point", aliases: ["sensor footprint"], group: "sensor", geometry: "point", color: PURPLE, glyph: "sensor" },

  // ── Risk / Restriction ────────────────────────────────────────────────
  { key: "nogo", term: "No-Go Zone", aliases: ["restricted area"], group: "risk", geometry: "area", color: RED, glyph: "restricted" },
  { key: "caution_area", term: "Caution Area", group: "risk", geometry: "area", color: ORANGE, glyph: "caution" },
  { key: "risk_envelope", term: "Risk / Threat Envelope", group: "risk", geometry: "area", color: ORANGE, glyph: "caution" },

  // ── Littoral / Shore ──────────────────────────────────────────────────
  { key: "shore_node", term: "Shore Node", aliases: ["landing support point"], group: "littoral", geometry: "point", color: BLUE, glyph: "shore" },
  { key: "port", term: "Port", aliases: ["harbor"], group: "littoral", geometry: "point", color: BLUE, glyph: "port", sensitive: true },
  { key: "s2s", term: "Ship-to-Shore Node", group: "littoral", geometry: "point", color: BLUE, glyph: "shore" },

  // ── Infrastructure / Civilian ─────────────────────────────────────────
  { key: "bridge_dep", term: "Bridge Dependency", aliases: ["bridge or culvert dependency"], group: "infra", geometry: "point", color: GRAY, glyph: "infra" },
  { key: "hospital", term: "Hospital / Clinic", group: "infra", geometry: "point", color: GREEN, glyph: "medical", sensitive: true },
  { key: "power_sub", term: "Power Substation", group: "infra", geometry: "point", color: GRAY, glyph: "infra", sensitive: true },
  { key: "civilian_zone", term: "Civilian-Sensitive Zone", group: "infra", geometry: "area", color: GRAY, glyph: "infra", sensitive: true },

  // ── Terrain / Hydrography (place as marker; full mesh is a later CRS) ──
  { key: "water_crossing", term: "Water Crossing", group: "terrain", geometry: "point", color: CYAN, glyph: "terrain" },
  { key: "wadi", term: "Wadi / Dry Wash", aliases: ["dry wash"], group: "terrain", geometry: "line", color: "#7d8ea0", glyph: "terrain" },
];

export const REALITY_MODES = [
  "real_observed", "historical_replay", "simulation",
  "training_demo", "synthetic", "projected", "what_if", "unknown",
] as const;
export type RealityMode = (typeof REALITY_MODES)[number];

export const RCORE_STATES = [
  "proposed", "observed", "validated", "simulated", "replayed", "qualified",
  "certified", "adopted", "educational", "retired", "restricted", "blocked",
] as const;
export type RcoreState = (typeof RCORE_STATES)[number];
