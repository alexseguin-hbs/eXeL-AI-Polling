/**
 * ARCHITECT-2525 · ASSET INVENTORY (Rev A · completeness ledger) — ONE SOURCE, GENERATED LEDGER.
 * =================================================================================================
 * The intake master (docs/asks/2026.11.07_architect2525_3d_asset_intake_master.md) §29 requires ASSET_INVENTORY.md —
 * "this ledger determines completeness; do not estimate completeness from a screenshot". This module is the ONE source
 * that ledger is generated from (scripts/architect-asset-inventory.mjs → docs/architecture-2525/ASSET_INVENTORY.md, gated
 * byte-identical by tests/architect-asset-inventory.test.mjs).
 *
 * THE IDS ARE THE OPERATOR'S. His COMPLETE 3D Asset Library (docs/architecture-2525/asset-library/3d-all-assets-2026-11-07,
 * manifest.json — 139 semantic ids = the 137 exact-name assets of his 10 pack boards + 2 dining extras, each with GLB +
 * metadata + PLAN SVG, 139/139 validated, his final validation persisted at
 * docs/asks/2026.11.07_architect2525_all_assets_3d_library_final_validation.md) is the normalized registry; this ledger has
 * ONE row per manifest id, verbatim. The completeness oracle is DUAL: (a) his placements ledger (inventory/placements.json —
 * 148 board placements → 137 ids) and (b) the intake master §18 complete pack coverage target — every §18 name that is not one
 * of his assets is its own MISSING row in his id style. Labels the operator's wider library export prints (the 35-board
 * export, docs/architecture-2525/asset-library/2026-11-06 — overview · living-room · house boards · room crops · standalone
 * packs, which the 18 chat boards in docs/asks/img duplicate by content) that his library does not cover are kept as BOARD rows,
 * so the ledger shows every gap; distinct-looking board labels that resolve to one of his ids are DUPLICATE_NORMALIZED rows.
 *
 * Statuses are DERIVED, never hand-typed: a manifest id is glb/plan/metadata READY (his package carries all three); every
 * other row is MISSING; visual QA is PENDING for all (§31 captures do not exist yet). NOTES carry the geometry facts the
 * gate recomputes from his files: "shared geometry with …" for the 18 byte-identical groups and "min z …" for floor/built-in
 * models whose lowest point is > 0.02 m above (or < -0.02 m below) the floor. Pure data + pure lookups, no React, no I/O.
 */
import type { ObjectKind } from "@/lib/room-objects";

// ── enums (§13 rooms · §14 phases · §28 marks) ───────────────────────────────────────────────────────────────────────
export const ROOM_IDS = ["MASTER_BEDROOM", "MASTER_BATH", "MASTER_CLOSET", "LIVING", "KITCHEN", "DINING", "OFFICE", "STORAGE_LAUNDRY", "ENTRY_PORCH", "GENERAL"] as const;
export type RoomId = (typeof ROOM_IDS)[number];
export const PHASE_IDS = ["FOUNDATION", "FRAMING", "ROOF", "PLUMBING", "ELECTRICAL", "HVAC", "SECURITY", "INTERIOR_FINISH", "INTERIOR_DESIGN", "EXTERIOR", "SITE", "OPERATIONS"] as const;
export type PhaseId = (typeof PHASE_IDS)[number];
export const FILE_STATUSES = ["READY", "PLACEHOLDER", "NEEDS_REBUILD", "MISSING"] as const;
export type FileStatus = (typeof FILE_STATUSES)[number];
export const VISUAL_QA = ["PENDING", "PASS", "FAIL"] as const;
export type VisualQa = (typeof VISUAL_QA)[number];
/** Where a row comes from: his manifest · a §18 line his library lacks · a wider-board label his library lacks · a board label
 *  normalized onto one of his ids (kept so the ledger shows the normalization, §28 mark DUPLICATE_NORMALIZED). */
export const ORIGINS = ["LIBRARY", "MASTER_18", "BOARD", "DUPLICATE"] as const;
export type Origin = (typeof ORIGINS)[number];
export const PACK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const PACK_LABELS: Record<number, string> = {
  1: "Shell & Structure", 2: "Interiors & Fixtures", 3: "Finishes, Lighting & Site", 4: "Appliances, Utilities & Life Systems",
  5: "Smart Home & Automation", 6: "Site & Landscape", 7: "Accessibility & Inclusion", 8: "Sustainability & Resilience",
  9: "Lifestyle & Personalization", 10: "Operations & Maintenance",
};
/** His id style: `architect2525.asset.<words.dotted>.v<n>` — lowercase letters/digits per segment. */
export const ID_PREFIX = "architect2525.asset.";
export const ID_GRAMMAR = /^architect2525\.asset\.[a-z0-9]+(?:\.[a-z0-9]+)*\.v[0-9]+$/;
/** The slug his files are named by: `architect2525.asset.base.cabinets.w.sink.v1` → `base-cabinets-w-sink`. */
export function slugOf(id: string): string { return id.slice(ID_PREFIX.length).replace(/\.v[0-9]+$/, "").replace(/\./g, "-"); }

export interface InventoryRow {
  id: string;                 // his semantic id (manifest.json) — or, for a gap, a new id in the same style
  label: string;              // his label for a manifest id; the printed name otherwise
  origin: Origin;
  referenceNames: string[];   // every name as printed on any board / §18 line that maps here (his label first)
  sources: string[];          // board files (relative to BOARDS_ROOT), MANIFEST_SOURCE and/or MASTER_18_SOURCE
  packs: number[];            // his manifest packs ∪ the §18 packs that name it; [] = on no pack list
  manifestPacks?: number[];   // his manifest packs verbatim (LIBRARY rows) — gated equal to manifest.json
  rooms: RoomId[];            // ≥1; GENERAL for a shared asset (§13 — never a tenth room)
  phases: PhaseId[];          // ≥1 (§14)
  legacyKind?: ObjectKind;    // the room-objects kind that draws it in the walk today (one row per kind)
  starterId?: string;         // the 2026-11-06 starter id this asset supersedes (placements.json `glb` · the two dining extras)
  glb: FileStatus; plan: FileStatus; metadata: FileStatus;
  visualQa: VisualQa;
  notes: string;
  duplicateOf?: string;       // DUPLICATE_NORMALIZED → the canonical row's id
}

// ── sources ─────────────────────────────────────────────────────────────────────────────────────────────────────────
export const LIBRARY_ROOT = "docs/architecture-2525/asset-library/3d-all-assets-2026-11-07";
export const STARTER_ROOT = "docs/architecture-2525/asset-library/3d-starter-2026-11-06";
export const ROTATOR_CATALOG = "docs/architecture-2525/asset-library/showcase-2026-11-07/catalog.json";
export const BOARDS_ROOT = "docs/architecture-2525/asset-library/2026-11-06";
export const MANIFEST_SOURCE = `${LIBRARY_ROOT}/manifest.json`;
export const MASTER_18_SOURCE = "docs/asks/2026.11.07_architect2525_3d_asset_intake_master.md#18";
const B = {
  L01: "library/01_asset_library_overview.png", L02: "library/02_living_room_complete_set.png", L03: "library/03_living_room_pack_detailed.png",
  L04: "library/04_living_room_standalone_assets.png", L05: "library/05_house_complete_pack.png", L06: "library/06_10_room_key_elements_grid_v1.png",
  L07: "library/07_10_room_key_elements_grid_v2.png",
  P01: "packs/pack_01_02_shell_structure_plus_mep_reference.png", P02: "packs/pack_02_interiors_fixtures.png", P03: "packs/pack_03_finishes_lighting_site.png",
  P04: "packs/pack_04_appliances_utilities_life_systems.png", P05: "packs/pack_05_smart_home_automation.png", P06: "packs/pack_06_site_landscape.png",
  P07: "packs/pack_07_accessibility_inclusion.png", P08: "packs/pack_08_sustainability_resilience.png", P09: "packs/pack_09_lifestyle_personalization.png",
  P10: "packs/pack_10_operations_maintenance.png",
  R_LIV: "rooms/living_room.png", R_DIN: "rooms/dining_room.png", R_KIT: "rooms/kitchen.png", R_OFF: "rooms/office.png", R_BED: "rooms/master_bedroom.png",
  R_CLO: "rooms/master_closet.png", R_BATH: "rooms/master_bath.png", R_LAU: "rooms/laundry.png", R_ENT: "rooms/entry_porch.png", R_STO: "rooms/storage.png",
  S01: "standalone/01_furniture_pack.png", S02: "standalone/02_utility_pack.png", S03: "standalone/03_kitchen_pack.png", S04: "standalone/04_bedroom_bath_pack.png",
  S05: "standalone/05_openings_pack.png", S06: "standalone/06_shell_framing_pack.png", S07: "standalone/07_security_lighting_pack.png", S08: "standalone/08_systems_pack.png",
} as const;
/** The 35 canonical boards of his library export. */
export const BOARDS: readonly string[] = Object.values(B);
/** The 10 pack boards by pack number — a manifest asset in pack n is printed on board n (the MEP strip is on board 1). */
export const PACK_BOARD: Readonly<Record<number, string>> = { 1: B.P01, 2: B.P02, 3: B.P03, 4: B.P04, 5: B.P05, 6: B.P06, 7: B.P07, 8: B.P08, 9: B.P09, 10: B.P10 };
/** The 18 chat boards + 2 first-send JPGs (docs/asks/img/2026.11.07_architect2525_*) → the library board with the SAME content
 *  (3 byte-identical, the rest re-encodes/crops of the same picture) — one source each, never counted twice. */
export const BOARD_ALIASES: Readonly<Record<string, string>> = {
  "2026.11.07_architect2525_furniture_pack_board.png": B.S01, "2026.11.07_architect2525_furniture_pack_first_send.jpg": B.S01,
  "2026.11.07_architect2525_utility_pack_board.png": B.S02, "2026.11.07_architect2525_utility_pack_first_send.jpg": B.S02,
  "2026.11.07_architect2525_kitchen_pack_board.png": B.S03, "2026.11.07_architect2525_bedroom_bath_pack_board.png": B.S04,
  "2026.11.07_architect2525_openings_pack_board.png": B.S05, "2026.11.07_architect2525_shell_framing_pack_board.png": B.S06,
  "2026.11.07_architect2525_security_lighting_pack_board.png": B.S07, "2026.11.07_architect2525_systems_pack_board.png": B.S08,
  "2026.11.07_architect2525_pack1_shell_structure_pack2_mep_board.png": B.P01, "2026.11.07_architect2525_pack2_interiors_fixtures_board.png": B.P02,
  "2026.11.07_architect2525_pack3_finishes_lighting_site_board.png": B.P03, "2026.11.07_architect2525_pack4_appliances_utilities_board.png": B.P04,
  "2026.11.07_architect2525_pack5_smart_home_board.png": B.P05, "2026.11.07_architect2525_pack6_site_landscape_board.png": B.P06,
  "2026.11.07_architect2525_pack7_accessibility_board.png": B.P07, "2026.11.07_architect2525_pack8_sustainability_board.png": B.P08,
  "2026.11.07_architect2525_pack9_lifestyle_board.png": B.P09, "2026.11.07_architect2525_pack10_operations_board.png": B.P10,
};

// ── his geometry facts (gated: recomputed from his files by the test) ───────────────────────────────────────────────
/** The 18 byte-identical GLB groups (same sha256 under different ids) — distinct ids kept per his rule, flagged for rebuild. */
export const SHARED_GEOMETRY: readonly (readonly string[])[] = [
  ["ac-condenser", "hvac-condenser"],
  ["air-handler-hvac", "hvac-furnace"],
  ["air-purifier", "dehumidifier"],
  ["air-quality-monitor", "monitor"],
  ["armchair", "dining-chair"],
  ["backup-inverter-controller", "inverter", "solar-inverter"],
  ["base-cabinets-w-sink", "bath-vanity-sink"],
  ["baseboard", "crown-molding", "trim-casing"],
  ["battery-home", "home-battery-pack"],
  ["bookshelf", "bookshelf-decor", "storage-shelving", "utility-shelving"],
  ["co-detector", "smoke-co-detector", "smoke-detector"],
  ["desk-lamp", "table-lamp"],
  ["entertainment-console-tv", "tv-console"],
  ["entry-access-keypad-smart-lock", "smart-lock"],
  ["fence-gate-section", "fence-panel"],
  ["laundry-sink", "plumbing-manifold-utility-sink", "utility-sink"],
  ["roof-sheathing", "roofing-shingle"],
  ["smart-hub", "smart-hub-home"],
];
/** Floor / built-in models (his metadata `mounting`) whose lowest point sits > 0.02 m above the floor (slug → min z, m). */
export const FLOOR_FLOATS: Readonly<Record<string, number>> = {
  "accessible-toilet": 0.11, "air-quality-monitor": 0.2, "bed-queen-king": 0.14, "co-detector": 0.6, "entry-ramp": 0.24,
  "exterior-siding": 0.06, "filter-set": 0.06, "grab-bar-set": 0.465, "leak-detector": 0.24, "monitor": 0.2,
  "motorized-shade-track": 0.25, "range-hood": 0.51, "roof-sheathing": 0.73, "roof-truss": 0.055, "roofing-shingle": 0.73,
  "scene-switch-control-panel": 0.09, "shutoff-valve-manifold": 0.075, "smart-hub": 0.275, "smart-hub-home": 0.275,
  "smart-hub-router": 0.075, "smoke-co-detector": 0.6, "smoke-detector": 0.6, "toilet": 0.11, "wall-art-set": 0.245,
  "water-shutoff-valve": 0.28,
};
/** Models whose lowest point sits < -0.02 m, i.e. sunk through the floor (slug → min z, m). */
export const FLOOR_SUNK: Readonly<Record<string, number>> = { "ev-charger": -0.05, "garbage-disposal": -0.03, "iron-board": -0.05 };
export const FLOOR_EPS_M = 0.02;
/** The 2026-11-06 starter id each of his assets supersedes: 16 from placements.json `glb` + the two dining extras (§20). */
export const STARTER_LINEAGE: Readonly<Record<string, string>> = {
  "door-interior-exterior": "opening.door.interior.v1", "window-single": "opening.window.unit.v1", sofa: "furniture.sofa.3seat.v1",
  armchair: "furniture.lounge_chair.v1", "coffee-table": "furniture.coffee_table.v1", refrigerator: "appliance.refrigerator.frenchdoor.v1",
  "base-cabinets-w-sink": "kitchen.base_run.sink.v1", "wall-cabinets": "kitchen.upper_cabinets.v1", toilet: "bath.toilet.v1",
  "bath-vanity-sink": "bath.vanity_sink.v1", "shower-stall": "bath.shower.enclosure.v1", "bed-queen-king": "furniture.bed.queen.v1",
  nightstand: "furniture.nightstand.v1", dresser: "furniture.dresser.v1", washer: "appliance.washer.frontload.v1", dryer: "appliance.dryer.frontload.v1",
  "dining-table": "furniture.dining_table.v1", "dining-chair": "furniture.dining_chair.v1",
};
/** His placements ledger (inventory/placements.json): 148 labeled board placements → 137 ids (+2 dining extras = 139). Gated. */
export const PLACEMENTS = { total: 148, uniqueIds: 137, byPack: { 1: 17, 2: 36, 3: 35, 4: 30, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5 } as Record<number, number> } as const;
export const MANIFEST_COUNT = 139;

// ── rows (authored facts; statuses + geometry notes derived in build) ───────────────────────────────────────────────
interface RowIn { suffix: string; /* id = ID_PREFIX + suffix + ".v1" */ label: string; origin: Origin; names?: string[]; src?: string[]; mp?: number[]; packs?: number[]; rooms: RoomId[]; phases: PhaseId[]; kind?: ObjectKind; notes?: string; dup?: string }
const ID: PhaseId[] = ["INTERIOR_DESIGN"];
const WET: PhaseId[] = ["PLUMBING", "INTERIOR_DESIGN"];
const FIN_ID: PhaseId[] = ["INTERIOR_FINISH", "INTERIOR_DESIGN"];
const EL_ID: PhaseId[] = ["ELECTRICAL", "INTERIOR_DESIGN"];
const OPEN_IN: PhaseId[] = ["FRAMING", "INTERIOR_FINISH", "INTERIOR_DESIGN"];
const OPEN_EX: PhaseId[] = ["FRAMING", "EXTERIOR", "INTERIOR_DESIGN"];
const G: RoomId[] = ["GENERAL"];
const SL: RoomId[] = ["STORAGE_LAUNDRY"];
type Opt = { names?: string[]; src?: string[]; packs?: number[]; kind?: ObjectKind; notes?: string };
/** A row for one of his manifest ids: manifest packs verbatim (mp); `packs` = mp ∪ the §18 packs naming it (o.packs). */
const L = (suffix: string, label: string, mp: number[], rooms: RoomId[], phases: PhaseId[], o: Opt = {}): RowIn =>
  ({ suffix, label, origin: "LIBRARY", names: o.names, src: o.src, mp, packs: [...mp, ...(o.packs ?? [])], rooms, phases, kind: o.kind, notes: o.notes });
/** A §18 line his library lacks (source: the intake master §18, plus any wider board that prints the name). */
const M = (suffix: string, label: string, packs: number[], rooms: RoomId[], phases: PhaseId[], o: Opt = {}): RowIn =>
  ({ suffix, label, origin: "MASTER_18", names: o.names, src: [MASTER_18_SOURCE, ...(o.src ?? [])], packs, rooms, phases, kind: o.kind, notes: o.notes });
/** A label his wider library export prints that neither his manifest nor §18 carries. */
const W = (suffix: string, label: string, src: string[], rooms: RoomId[], phases: PhaseId[], o: Opt = {}): RowIn =>
  ({ suffix, label, origin: "BOARD", names: o.names, src, packs: o.packs ?? [], rooms, phases, kind: o.kind, notes: o.notes });
/** A distinct-looking board label normalized onto another row — kept so the ledger shows it (DUPLICATE_NORMALIZED). */
const D = (suffix: string, label: string, src: string[], dup: string, names: string[] = []): RowIn =>
  ({ suffix, label, origin: "DUPLICATE", names, src, rooms: G, phases: ID, dup: ID_PREFIX + dup });
const COMBINED = (parts: string, id: string) => `§18 lists ${parts} separately; his library models them as one combined asset (${id}) — not placeable alone until split.`;
const TWIN = (other: string) => `Likely the same object as ${ID_PREFIX}${other} — his manifest keeps both ids (different names are never merged silently); the geometry is byte-identical.`;
const NO_18 = "Printed on a wider board, on no §18 list — pack left open (—) rather than guessed.";
const ONLY_18 = "A §18 line with no board silhouette — needs a board or a modelling brief before a GLB.";

const ROWS: RowIn[] = [
  // ════ LIBRARY — his 139 manifest ids, manifest order ════
  L("ac.condenser", "AC Condenser", [4], G, ["HVAC", "EXTERIOR"]),
  L("accent.chair.side.table", "Accent Chair + Side Table", [9], ["LIVING"], ID, { names: ["Accent Chair"], notes: COMBINED("Accent Chair and Side Table", "architect2525.asset.accent.chair.side.table.v1") + " Side Table also stands alone on the living boards — its own row." }),
  L("access.ladder", "Access Ladder", [10], SL, ["OPERATIONS"]),
  L("accessible.toilet", "Accessible Toilet", [7], ["MASTER_BATH"], WET),
  L("air.handler.hvac", "Air Handler (HVAC)", [1], SL, ["HVAC"], { names: ["Air Handler", "Air Handler Unit"], src: [B.L01, B.L05, B.S08] }),
  L("air.purifier", "Air Purifier", [4], G, ["HVAC"]),
  L("air.quality.monitor", "Air Quality Monitor", [4], G, ["HVAC"]),
  L("area.rug", "Area Rug", [9], ["LIVING", "DINING", "MASTER_BEDROOM", "ENTRY_PORCH"], ID, { names: ["Rug"], src: [B.L01, B.L02, B.L03, B.L07, B.R_LIV], kind: "rug" }),
  L("armchair", "Armchair", [2], ["LIVING"], ID, { names: ["Armchair / Lounge Chair", "Lounge Chair"], src: [B.L01, B.L02, B.L03, B.L04] }),
  L("backup.inverter.controller", "Backup Inverter + Controller", [8], G, ["ELECTRICAL"], { names: ["Backup Inverter", "Controller"], notes: COMBINED("Backup Inverter and Controller", "architect2525.asset.backup.inverter.controller.v1") }),
  L("base.cabinets.w.sink", "Base Cabinets (w/ Sink)", [2], ["KITCHEN"], FIN_ID, { names: ["Base Cabinet + Sink", "Kitchen Base Cabinet Run (with Sink)"], src: [B.L06], kind: "counter", notes: "The sink run; a plain base-cabinet module (§18 Base Cabinet) and the drop-in Kitchen Sink are their own rows." }),
  L("baseboard", "Baseboard", [3], G, ["INTERIOR_FINISH"]),
  L("bath.vanity.sink", "Bath Vanity + Sink", [2], ["MASTER_BATH"], WET, { names: ["Vanity + Sink", "Vanity Sink", "Bathroom Vanity", "Sink Vanity", "Single Vanity"], src: [B.L01, B.L05, B.L06, B.L07, B.R_BATH, B.S02, B.S04], kind: "sink" }),
  L("bathtub", "Bathtub", [2], ["MASTER_BATH"], WET, { names: ["Tub", "Tub (Freestanding)"], src: [B.L01, B.L05, B.L06, B.L07, B.R_BATH], kind: "tub" }),
  L("battery.home", "Battery (Home)", [4], G, ["ELECTRICAL"], { names: ["Home Battery"] }),
  L("bed.queen.king", "Bed (Queen/King)", [2], ["MASTER_BEDROOM"], ID, { names: ["Bed (Queen / King)", "Bed (King/Queen)", "Queen / King Bed", "Bed"], src: [B.L01, B.L05, B.L06, B.L07, B.R_BED, B.S04], kind: "bed" }),
  L("bedroom.bench", "Bedroom Bench", [2], ["MASTER_BEDROOM"], ID, { names: ["Bed Bench"], src: [B.L01, B.L07, B.R_BED] }),
  L("bookshelf", "Bookshelf", [2], ["LIVING", "OFFICE"], ID, { names: ["Bookcase"], src: [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.R_OFF], packs: [9], kind: "bookshelf", notes: "One bookshelf for Living / Office (Pack 2) and Lifestyle (§18 Pack 9)." }),
  L("bookshelf.decor", "Bookshelf + Decor", [9], G, ID, { names: ["Décor Object"], notes: COMBINED("Bookshelf and Décor Object", "architect2525.asset.bookshelf.decor.v1") }),
  L("ceiling.light.led", "Ceiling Light (LED)", [3], G, EL_ID, { names: ["Flush Ceiling Light", "Ceiling Light", "Flush", "Ceiling (Flush)", "Fixture"], src: [B.L01, B.L03, B.L05, B.L07, B.R_ENT, B.S07], notes: "The overview's Electrical · Fixture (a ceiling-fixture icon) is read as this light — low confidence, flagged." }),
  L("chandelier", "Chandelier", [3], ["DINING"], EL_ID, { src: [B.L01] }),
  L("co.detector", "CO Detector", [4], G, ["SECURITY", "ELECTRICAL"], { notes: "His metadata mounts it FLOOR; a ceiling device — hence the float note." }),
  L("coffee.table", "Coffee Table", [2], ["LIVING"], ID, { names: ["Coffee (Rectangle)"], src: [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.R_LIV, B.S01] }),
  L("crown.molding", "Crown Molding", [3], G, ["INTERIOR_FINISH"]),
  L("deck.porch", "Deck / Porch", [3], ["ENTRY_PORCH"], ["SITE", "EXTERIOR"], { names: ["Deck"], packs: [6], notes: "§18 Pack 6's Deck is this deck (§19)." }),
  L("dehumidifier", "Dehumidifier", [4], G, ["HVAC"]),
  L("desk", "Desk", [2], ["OFFICE"], ID, { names: ["Desk + Chair", "Office Desk + Chair"], src: [B.L01, B.L05, B.L06, B.L07, B.R_OFF, B.S01], kind: "desk" }),
  L("desk.lamp", "Desk Lamp", [2], ["OFFICE"], ID, { names: ["Deble Lamp"], src: [B.L01], notes: "The Pack 2 board prints the typo \"Deble Lamp\"." }),
  L("dining.chair", "Dining Chair", [], ["DINING"], ID, { names: ["Chair", "Dining Table + 4 Chairs"], src: [B.L01, B.L05, B.L06, B.L07, B.R_DIN, B.S01, MASTER_18_SOURCE], packs: [2], kind: "chair", notes: "Verified extra — on none of the 10 pack boards (his manifest packs []); §18 Pack 2 Dining lists it." }),
  L("dining.table", "Dining Table", [], ["DINING"], ID, { names: ["Table", "Dining Table (4–8)", "Dining Table + 4 Chairs"], src: [B.L01, B.L05, B.L06, B.L07, B.R_DIN, B.S01, MASTER_18_SOURCE], packs: [2], kind: "table", notes: "Verified extra — on none of the 10 pack boards (his manifest packs []); §18 Pack 2 Dining lists it." }),
  L("dishwasher", "Dishwasher", [4], ["KITCHEN"], WET, { src: [B.L01], packs: [2] }),
  L("door.interior.exterior", "Door (Interior / Exterior)", [1], G, OPEN_IN, { names: ["Interior Door", "Door", "Interior Door (Access)"], src: [B.L01, B.L02, B.L05, B.S05], kind: "door", notes: "His audit marked it ◐ at receipt (interior half only); the complete library carries its own door-interior-exterior.glb beside exterior-door.glb." }),
  L("dresser", "Dresser", [2], ["MASTER_BEDROOM"], ID, { src: [B.L01, B.L05, B.L06, B.L07, B.R_BED, B.S01], kind: "dresser" }),
  L("driveway.pad", "Driveway Pad", [6], G, ["SITE"]),
  L("dryer", "Dryer", [2, 4], SL, EL_ID, { src: [B.L01, B.L05, B.L06, B.L07, B.R_LAU, B.S02], notes: "His ⚠ (starter dryer.glb byte-identical to washer.glb) is cleared: the complete library's dryer.glb has its own geometry." }),
  L("drying.rack", "Drying Rack", [4], SL, ID),
  L("drywall.panel", "Drywall Panel", [3], G, ["INTERIOR_FINISH"], { names: ["Drywall"], src: [B.L05] }),
  L("electrical.panel", "Electrical Panel", [1, 4], G, ["ELECTRICAL"], { names: ["Panel"], src: [B.L01, B.L05, B.S08] }),
  L("entertainment.console.tv", "Entertainment Console + TV", [9], ["LIVING"], ID, { names: ["Entertainment Console", "Media Console + TV"], src: [B.L03, B.L04], notes: COMBINED("Entertainment Console and TV", "architect2525.asset.entertainment.console.tv.v1") + " TV also stands alone on the living boards — its own row." }),
  L("entry.access.keypad.smart.lock", "Entry Access Keypad / Smart Lock", [5], ["ENTRY_PORCH"], ["SECURITY"], { notes: "§18 lists Entry Keypad (own row — the overview prints a standalone Keypad) and Smart Lock (architect2525.asset.smart.lock.v1) separately." }),
  L("entry.ramp", "Entry Ramp", [7], ["ENTRY_PORCH"], ["SITE", "EXTERIOR"]),
  L("ev.charger", "EV Charger", [4], G, ["ELECTRICAL", "SITE"]),
  L("exterior.door", "Exterior Door", [3], ["ENTRY_PORCH"], OPEN_EX, { names: ["Entry Door"], src: [B.L01, B.L05, B.L07, B.R_ENT, B.S05], packs: [1], notes: "§18 Pack 1's Entry Door (the openings/entry boards' name) is this door." }),
  L("exterior.siding", "Exterior Siding", [1, 3], G, ["EXTERIOR"], { names: ["Siding"] }),
  L("fence.panel", "Fence (Panel)", [3], G, ["SITE"], { names: ["Fence", "Fence Section"], packs: [6], notes: "§18 Pack 6's Fence Section is this panel (§19)." }),
  L("fence.gate.section", "Fence + Gate Section", [6], G, ["SITE"], { names: ["Gate"], notes: COMBINED("Fence Section and Gate", "architect2525.asset.fence.gate.section.v1") }),
  L("file.cabinet", "File Cabinet", [2], ["OFFICE"], ID, { src: [B.L01, B.L06] }),
  L("filter.set", "Filter Set", [10], SL, ["OPERATIONS"], { names: ["HVAC Filter", "Water Filter", "Replacement Filter Set"], notes: COMBINED("HVAC Filter, Water Filter and Replacement Filter Set", "architect2525.asset.filter.set.v1") }),
  L("floor.lamp", "Floor Lamp", [2], ["LIVING", "MASTER_BEDROOM"], ID, { src: [B.L01, B.L02, B.L03, B.L04, B.L06, B.L07, B.R_LIV, B.S07], packs: [3], kind: "lamp" }),
  L("flooring.wood.lvp", "Flooring (Wood/LVP)", [3], G, ["INTERIOR_FINISH"], { names: ["Flooring / LVP", "Flooring"], src: [B.L05] }),
  L("foundation.slab", "Foundation Slab", [1], G, ["FOUNDATION"], { src: [B.L05, B.S06] }),
  L("front.steps.landing", "Front Steps + Landing", [6], ["ENTRY_PORCH"], ["SITE", "EXTERIOR"], { names: ["Front Steps", "Landing"], notes: COMBINED("Front Steps and Landing", "architect2525.asset.front.steps.landing.v1") }),
  L("garage.door", "Garage Door", [3], G, ["FRAMING", "EXTERIOR"], { notes: "The canonical 3×3 house has no garage; kept for the pack, not placed by default." }),
  L("garbage.disposal", "Garbage Disposal", [4], ["KITCHEN"], ["PLUMBING"]),
  L("generator.standby", "Generator (Standby)", [3, 4], G, ["ELECTRICAL", "SITE"], { names: ["Generator"] }),
  L("grab.bar.set", "Grab Bar Set", [7], ["MASTER_BATH"], FIN_ID, { names: ["Grab Bar"] }),
  L("gutter.downspout", "Gutter + Downspout", [3], G, ["EXTERIOR"]),
  L("home.battery.pack", "Home Battery Pack", [8], G, ["ELECTRICAL"], { notes: TWIN("battery.home.v1") }),
  L("hvac.furnace", "HVAC (Furnace)", [4], SL, ["HVAC"], { names: ["HVAC Air Handler / Furnace"], notes: TWIN("air.handler.hvac.v1") }),
  L("hvac.condenser", "HVAC Condenser", [3], G, ["HVAC", "EXTERIOR"], { notes: TWIN("ac.condenser.v1") }),
  L("inverter", "Inverter", [4], G, ["ELECTRICAL"]),
  L("iron.board", "Iron + Board", [4], SL, ID),
  L("irrigation.system", "Irrigation System", [3], G, ["SITE", "PLUMBING"], { names: ["Irrigation Head"], packs: [6] }),
  L("kitchen.island.stools", "Kitchen Island + Stools", [2], ["KITCHEN"], FIN_ID, { names: ["Island + Stools"], src: [B.L01], notes: "§18 lists Kitchen Island and Bar Stool separately and the kitchen pack board prints each alone — own rows." }),
  L("landscape.light.spot", "Landscape Light (Spot)", [3], G, ["SITE", "ELECTRICAL"], { names: ["Landscape Light"], packs: [6] }),
  L("laundry.sink", "Laundry Sink", [4], SL, WET, { notes: TWIN("utility.sink.v1") }),
  L("leak.detector", "Leak Detector", [4], G, ["SECURITY", "PLUMBING"]),
  L("lever.handle.door.set", "Lever Handle Door Set", [7], G, ["INTERIOR_FINISH"], { names: ["Lever Door Handle"] }),
  L("microwave", "Microwave", [4], ["KITCHEN"], ID, { packs: [2] }),
  L("mirror.led", "Mirror (LED)", [2], ["MASTER_BATH"], ID, { names: ["Mirror"], src: [B.L01], kind: "mirror", notes: "The lit bath mirror (§18 Bath · Mirror); the bedroom / closet / lifestyle mirror is its own row." }),
  L("monitor", "Monitor", [2], ["OFFICE"], ID, { names: ["Monitor (Single)", "Monitors (Dual)"], src: [B.L01, B.L07, B.R_OFF], notes: "Monitors (Dual) = two placed instances." }),
  L("motion.sensor.pir", "Motion Sensor (PIR)", [3], G, ["SECURITY"], { names: ["Motion Sensor", "Sensor"], src: [B.L01, B.S07] }),
  L("motorized.shade.track", "Motorized Shade + Track", [5], G, ID, { names: ["Motorized Shade", "Motorized Shade Track"], notes: COMBINED("Motorized Shade and Motorized Shade Track", "architect2525.asset.motorized.shade.track.v1") }),
  L("nightstand", "Nightstand", [2], ["MASTER_BEDROOM"], ID, { src: [B.L01, B.L05, B.L06, B.L07, B.R_BED, B.S04], kind: "nightstand" }),
  L("office.chair", "Office Chair", [2], ["OFFICE"], ID, { names: ["Desk + Chair", "Office Desk + Chair"], src: [B.L01, B.L05, B.L06, B.L07, B.R_OFF, B.S01] }),
  L("outlet.switch", "Outlet + Switch", [1], G, ["ELECTRICAL"], { names: ["Outlet + Switch Set"], src: [B.S08], notes: "The overview and living boards print Outlet and Switch as separate devices — own BOARD rows." }),
  L("paint.can", "Paint (Can)", [3], G, ["INTERIOR_FINISH"], { names: ["Paint"], src: [B.L05] }),
  L("path.light", "Path Light", [3], G, ["SITE", "ELECTRICAL"], { packs: [6] }),
  L("pendant.light", "Pendant Light", [3], ["DINING", "GENERAL"], EL_ID, { names: ["Pendant", "Pendant (Ring)", "Ceiling (Pendant)"], src: [B.L01, B.L02, B.L03, B.L07, B.R_DIN], packs: [2] }),
  L("planter.bed.tree", "Planter Bed + Tree", [6], G, ["SITE"], { names: ["Planter Bed", "Tree"], notes: COMBINED("Planter Bed and Tree", "architect2525.asset.planter.bed.tree.v1") }),
  L("plumbing.manifold.utility.sink", "Plumbing Manifold + Utility Sink", [1], SL, ["PLUMBING"], { names: ["Plumbing Manifold / Utility Sink"], src: [B.S08] }),
  L("rainwater.cistern", "Rainwater Cistern", [8], G, ["SITE", "PLUMBING"]),
  L("range.oven", "Range + Oven", [2, 4], ["KITCHEN"], ID, { names: ["Range / Oven", "Stove / Oven", "Stove + Oven"], src: [B.L01, B.L05, B.L06, B.L07, B.R_KIT, B.S03], kind: "stove" }),
  L("range.hood", "Range Hood", [2, 4], ["KITCHEN"], ["HVAC", "INTERIOR_DESIGN"], { src: [B.L01, B.L07, B.R_KIT, B.S03], kind: "rangehood", notes: "His metadata mounts it FLOOR; a wall-hung hood — hence the float note." }),
  L("recessed.light", "Recessed Light", [3], G, EL_ID, { names: ["Recessed"], src: [B.L01, B.L02] }),
  L("refrigerator", "Refrigerator", [2, 4], ["KITCHEN"], ID, { src: [B.L01, B.L05, B.L06, B.L07, B.R_KIT, B.S03], kind: "fridge", notes: "One refrigerator across Pack 2, Pack 4, the kitchen boards and the house board (§19)." }),
  L("roll.in.shower.bench", "Roll-In Shower Bench", [7], ["MASTER_BATH"], WET, { names: ["Roll-In Shower", "Shower Bench"], notes: COMBINED("Roll-In Shower and Shower Bench", "architect2525.asset.roll.in.shower.bench.v1") }),
  L("roof.sheathing", "Roof Sheathing", [1], G, ["ROOF"], { kind: "roof" }),
  L("roof.truss", "Roof Truss", [1], G, ["ROOF"], { src: [B.L05] }),
  L("roofing.shingle", "Roofing (Shingle)", [3], G, ["ROOF", "EXTERIOR"], { names: ["Roofing"] }),
  L("scene.switch.control.panel", "Scene Switch / Control Panel", [5], G, ["ELECTRICAL"], { names: ["Scene Switch", "Control Panel", "Smart Control (Lighting · HVAC)"], src: [B.L02], notes: COMBINED("Scene Switch and Control Panel", "architect2525.asset.scene.switch.control.panel.v1") }),
  L("security.camera", "Security Camera", [3], G, ["SECURITY"], { names: ["Camera"], src: [B.L01, B.S07] }),
  L("septic.system", "Septic System", [3], G, ["SITE", "PLUMBING"]),
  L("service.access.panel", "Service Access Panel", [10], G, ["OPERATIONS"]),
  L("shower.stall", "Shower Stall", [2], ["MASTER_BATH"], WET, { names: ["Shower (Glass)", "Shower Enclosure"], src: [B.L01, B.L05, B.L06, B.L07, B.R_BATH, B.S04], kind: "shower" }),
  L("shutoff.valve.manifold", "Shutoff Valve Manifold", [10], SL, ["PLUMBING"], { names: ["Valve Manifold"] }),
  L("skylight", "Skylight", [1], G, ["FRAMING", "ROOF", "INTERIOR_DESIGN"], { src: [B.S05] }),
  L("sliding.glass.door", "Sliding Glass Door", [1], G, OPEN_EX, { names: ["Sliding", "Sliding Door (Optional)"], src: [B.L01, B.L02, B.S05] }),
  L("smart.hub", "Smart Hub", [3], G, ["ELECTRICAL"], { packs: [5] }),
  L("smart.hub.home", "Smart Hub (Home)", [4], G, ["ELECTRICAL"], { notes: TWIN("smart.hub.v1") }),
  L("smart.hub.router", "Smart Hub + Router", [5], G, ["ELECTRICAL"], { names: ["Router"], notes: COMBINED("Smart Hub and Router", "architect2525.asset.smart.hub.router.v1") }),
  L("smart.lock", "Smart Lock", [3], ["ENTRY_PORCH"], ["SECURITY"], { packs: [5] }),
  L("smart.thermostat", "Smart Thermostat", [3, 5], G, ["HVAC", "ELECTRICAL"]),
  L("smoke.co.detector", "Smoke / CO Detector", [3], G, ["SECURITY", "ELECTRICAL"], { notes: "His metadata mounts it FLOOR; a ceiling device — hence the float note. Pack 4 keeps Smoke Detector and CO Detector as two ids." }),
  L("smoke.detector", "Smoke Detector", [4], G, ["SECURITY", "ELECTRICAL"], { notes: "His metadata mounts it FLOOR; a ceiling device — hence the float note." }),
  L("sofa", "Sofa", [2], ["LIVING"], ID, { names: ["Sofa (3-Seat)", "Sofa (2–3 Seat)", "3-Seat", "Sofa · 3-Seat"], src: [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.R_LIV, B.S01], kind: "sofa" }),
  L("solar.inverter", "Solar Inverter", [4], G, ["ELECTRICAL"]),
  L("solar.panel.array", "Solar Panel Array", [8], G, ["ROOF", "ELECTRICAL"]),
  L("storage.bin", "Storage Bin", [2], ["STORAGE_LAUNDRY", "MASTER_CLOSET"], ID, { names: ["Storage Bins"], src: [B.L01, B.L05, B.L06, B.L07, B.R_STO] }),
  L("storage.cabinet", "Storage Cabinet", [2], SL, ID, { names: ["Cabinet"], src: [B.L01, B.L05, B.L06, B.L07, B.R_STO] }),
  L("storage.shelving", "Storage Shelving", [2], SL, ID, { names: ["Storage Shelf", "Storage Shelves", "Shelf"], src: [B.L01, B.L05, B.L06, B.L07, B.R_STO], kind: "shelving", notes: "Freestanding rack; the closet's built-in Shelving (§18) is its own row." }),
  L("storm.shutter.window", "Storm Shutter Window", [8], G, ["EXTERIOR"], { names: ["Storm Shutter"] }),
  L("table.lamp", "Table Lamp", [2], ["MASTER_BEDROOM", "LIVING"], ID, { src: [B.L02, B.L03], packs: [3] }),
  L("tile", "Tile", [3], ["MASTER_BATH", "KITCHEN", "GENERAL"], ["INTERIOR_FINISH"]),
  L("toilet", "Toilet", [2], ["MASTER_BATH"], WET, { src: [B.L01, B.L05, B.L06, B.L07, B.R_BATH, B.S04], kind: "toilet" }),
  L("tool.cart.kit", "Tool Cart + Kit", [10], SL, ["OPERATIONS"], { names: ["Tool Cart", "Tool Kit"], notes: COMBINED("Tool Cart and Tool Kit", "architect2525.asset.tool.cart.kit.v1") }),
  L("towel.bar", "Towel Bar", [2], ["MASTER_BATH"], ID, { names: ["Towel Bar / Rack"], src: [B.L01, B.L06] }),
  L("track.light", "Track Light", [3], G, EL_ID),
  L("trim.casing", "Trim Casing", [3], G, ["INTERIOR_FINISH"], { names: ["Trim / Casing"] }),
  L("tv.console", "TV Console", [2], ["LIVING"], ID, { names: ["Media / TV Console"], src: [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.R_LIV], kind: "tv", notes: "The television on top is its own row (TV)." }),
  L("under.cabinet.light", "Under-Cabinet Light", [3], ["KITCHEN"], EL_ID),
  L("utility.shelving", "Utility Shelving", [4], SL, ID, { notes: TWIN("storage.shelving.v1") }),
  L("utility.sink", "Utility Sink", [2], SL, WET, { src: [B.L01, B.L05, B.L06, B.L07, B.R_LAU] }),
  L("vent.register", "Vent Register", [1], G, ["HVAC"], { names: ["Register", "Vent Register + Return Grille"], src: [B.L01, B.S08], notes: "The systems board pairs it with a Return Grille — own BOARD row." }),
  L("video.doorbell", "Video Doorbell", [3], ["ENTRY_PORCH"], ["SECURITY"], { names: ["Doorbell / Entry Sensor"], src: [B.S07] }),
  L("walkway.pavers", "Walkway Pavers", [6], G, ["SITE"]),
  L("wall.art.set", "Wall Art Set", [9], G, ID, { names: ["Wall Art", "Wall Art (Set)"], src: [B.L02], notes: "His metadata mounts it FLOOR; a wall object — hence the float note." }),
  L("wall.cabinets", "Wall Cabinets", [2], ["KITCHEN"], FIN_ID, { names: ["Wall Cabinet", "Upper Cabinets"], src: [B.L01, B.L06, B.S02] }),
  L("wall.framing", "Wall Framing", [1], G, ["FRAMING"], { names: ["Wall Frame Section", "Wall Frame"], src: [B.L01, B.L05, B.S06] }),
  L("wall.sconce", "Wall Sconce", [3], G, EL_ID, { src: [B.L03, B.S07] }),
  L("wall.sheathing", "Wall Sheathing", [1], G, ["FRAMING", "EXTERIOR"], { names: ["Sheathing Panel", "Sheathing"], src: [B.L05, B.S06], kind: "shell" }),
  L("wardrobe", "Wardrobe", [2], ["MASTER_BEDROOM"], ID, { src: [B.L01, B.L06], kind: "wardrobe" }),
  L("washer", "Washer", [2, 4], SL, WET, { src: [B.L01, B.L05, B.L06, B.L07, B.R_LAU, B.S02], kind: "washer" }),
  L("water.heater", "Water Heater", [1, 4], SL, ["PLUMBING"], { src: [B.L01, B.L05, B.S08] }),
  L("water.shutoff.valve", "Water Shutoff Valve", [4], G, ["PLUMBING"], { names: ["Shutoff Valve", "Valve"], src: [B.L01], packs: [10], notes: "One valve: the overview's Valve, Pack 4's Water Shutoff Valve, §18 Pack 10's Shutoff Valve." }),
  L("water.softener", "Water Softener", [4], SL, ["PLUMBING"]),
  L("water.well.system", "Water Well System", [3], G, ["SITE", "PLUMBING"]),
  L("window.single", "Window (Single)", [1], G, OPEN_EX, { names: ["Single Window", "Window", "Window Unit", "Window (Single / Wide)"], src: [B.L01, B.L02, B.L05, B.S05], kind: "window" }),
  L("window.wide", "Window (Wide)", [1], G, OPEN_EX, { names: ["Wide Window", "Window (Single / Wide)"], src: [B.L02, B.S05] }),

  // ════ MASTER_18 — §18 lines his library lacks (glb MISSING) ════
  M("footing", "Footing", [1], G, ["FOUNDATION"], { src: [B.L05] }),
  M("stem.wall", "Stem Wall", [1], G, ["FOUNDATION"], { src: [B.L05] }),
  M("door.rough.opening", "Door Rough Opening", [1], G, ["FRAMING"], { src: [B.S06] }),
  M("window.rough.opening", "Window Rough Opening", [1], G, ["FRAMING"], { src: [B.S06] }),
  M("roof.ceiling.framing.module", "Roof / Ceiling Framing Module", [1], G, ["ROOF"], { names: ["Roof/Ceiling Framing Module", "Roof / Ceiling Framing"], src: [B.S06] }),
  M("side.table", "Side Table", [2, 9], ["LIVING"], ID, { src: [B.L01, B.L02, B.L03], notes: "Stands alone on the living boards; his library only has it inside Accent Chair + Side Table." }),
  M("sideboard.credenza", "Sideboard / Credenza", [2], ["DINING"], ID, { names: ["Sideboard"], src: [B.L01, B.L05, B.L06, B.L07, B.R_DIN] }),
  M("base.cabinet", "Base Cabinet", [2], ["KITCHEN"], FIN_ID, { names: ["Base Cabinets"], src: [B.L01, B.L05, B.L07, B.R_KIT, B.S02], notes: "A plain base-cabinet module without the sink; his base.cabinets.w.sink.v1 is the sink run." }),
  M("kitchen.sink", "Kitchen Sink", [2], ["KITCHEN"], WET, { names: ["Sink (Base)", "Sink"], src: [B.L01], notes: "The drop-in sink as its own asset; his sink run carries one basin." }),
  M("kitchen.island", "Kitchen Island", [2], ["KITCHEN"], FIN_ID, { src: [B.L07, B.R_KIT, B.S03], notes: "Stands alone on the kitchen pack board; his library only has it inside Kitchen Island + Stools." }),
  M("bar.stool", "Bar Stool", [2], ["KITCHEN"], ID, { names: ["Bar Stools (Pair)"], src: [B.S03], notes: "Stands alone on the kitchen pack board; his library only has it inside Kitchen Island + Stools." }),
  M("pantry.cabinet", "Pantry Cabinet", [2], ["KITCHEN"], FIN_ID, { src: [B.S03] }),
  M("bunk.bed", "Bunk Bed", [2], ["MASTER_BEDROOM"], ID, { src: [B.S04] }),
  M("closet.system", "Closet System", [2], ["MASTER_CLOSET"], ID, { src: [B.L01, B.L05, B.L06, B.L07, B.R_CLO] }),
  M("hanging.rod", "Hanging Rod", [2], ["MASTER_CLOSET"], ID, { names: ["Hanging (Long)"], src: [B.L01, B.L07, B.R_CLO], kind: "closetrod" }),
  M("drawer.unit", "Drawer Unit", [2], ["MASTER_CLOSET", "STORAGE_LAUNDRY"], ID, { src: [B.L01, B.L05, B.L06] }),
  M("shelving", "Shelving", [2], ["MASTER_CLOSET"], ID, { names: ["Shelving Unit"], src: [B.L01, B.L05, B.L07, B.R_CLO], notes: "The closet's built-in shelving; the freestanding rack is his storage.shelving.v1." }),
  M("shoe.rack", "Shoe Rack", [2], ["MASTER_CLOSET", "ENTRY_PORCH"], ID, { src: [B.L01], kind: "shoerack" }),
  M("closet.island", "Closet Island", [2], ["MASTER_CLOSET"], ID, { src: [B.L01, B.L07, B.R_CLO] }),
  M("hamper", "Hamper", [2], ["MASTER_CLOSET"], ID, { src: [B.L01] }),
  M("mirror", "Mirror", [2, 9], ["MASTER_BEDROOM", "MASTER_CLOSET"], ID, { names: ["Full Mirror"], src: [B.L01, B.P09], notes: "The full-length / wall mirror (§18 Master Closet + Pack 9); the lit bath mirror is his mirror.led.v1." }),
  M("workbench.utility.surface", "Workbench / Utility Surface", [2], SL, ID, { names: ["Workbench"], src: [B.L01] }),
  M("entry.keypad", "Entry Keypad", [5], ["ENTRY_PORCH"], ["SECURITY"], { names: ["Keypad"], src: [B.L01], notes: "The overview prints a standalone Keypad; his library only has it inside Entry Access Keypad / Smart Lock." }),
  M("automated.lighting.controller", "Automated Lighting Controller", [5], G, ["ELECTRICAL"], { notes: ONLY_18 }),
  M("environmental.sensor", "Environmental Sensor", [5], G, ["SECURITY", "HVAC"], { notes: ONLY_18 }),
  M("occupancy.sensor", "Occupancy Sensor", [5], G, ["SECURITY", "ELECTRICAL"], { notes: `${ONLY_18} May share the motion-sensor geometry.` }),
  M("shrub.plant", "Shrub / Plant", [6], G, ["SITE"], { src: [B.P06], notes: "Outdoor planting — drawn only inside the Pack 6 planter; no standalone silhouette." }),
  M("patio", "Patio", [6], G, ["SITE"], { notes: ONLY_18 }),
  M("exterior.utility.pad", "Exterior Utility Pad", [6], G, ["SITE"], { notes: ONLY_18 }),
  M("handrail", "Handrail", [7], G, ["EXTERIOR", "INTERIOR_FINISH"], { src: [B.P07], notes: "Drawn only as the rails of the Entry Ramp — no standalone silhouette." }),
  M("accessible.vanity", "Accessible Vanity", [7], ["MASTER_BATH"], WET, { notes: ONLY_18 }),
  M("clear.floor.space.marker", "Clear-Floor-Space Marker", [7], G, ID, { notes: `${ONLY_18} A floor OVERLAY (PLAN footprint only), not a solid.` }),
  M("threshold.transition", "Threshold Transition", [7], G, ["INTERIOR_FINISH"], { notes: ONLY_18 }),
  M("high.efficiency.equipment", "High-Efficiency Equipment", [8], G, ["OPERATIONS"], { notes: `${ONLY_18} §18 names a CLASS, not an object — flagged.` }),
  M("backup.power.interface", "Backup Power Interface", [8], G, ["ELECTRICAL"], { notes: ONLY_18 }),
  M("water.capture.components", "Water Capture Components", [8], G, ["SITE", "PLUMBING"], { src: [B.P08], notes: "Only the cistern's roof downpipe is drawn; §18 names a class of parts — flagged." }),
  M("resilience.equipment", "Resilience Equipment", [8], G, ["OPERATIONS"], { notes: `${ONLY_18} §18 names a CLASS, not an object — flagged.` }),
  M("tv", "TV", [9], ["LIVING", "MASTER_BEDROOM", "OFFICE"], ID, { names: ["TV (Wall)", "TV (Stand)"], src: [B.L03], notes: "Stands alone on the living boards (wall / stand); his library only has it on top of a console." }),
  M("plant", "Plant", [9], G, ID, { names: ["Plants", "Plant (Potted)"], src: [B.L01, B.L02, B.L03, B.L06], notes: "One indoor potted plant for Entry / Dining / Office / Living." }),
  M("decorative.lighting", "Decorative Lighting", [9], G, ID, { notes: `${ONLY_18} Only the small glow cylinder on the Pack 9 console hints at it — flagged.` }),
  M("inspection.point", "Inspection Point", [10], G, ["OPERATIONS"], { notes: `${ONLY_18} A marker, not a solid.` }),
  M("service.marker", "Service Marker", [10], G, ["OPERATIONS"], { notes: `${ONLY_18} A marker, not a solid.` }),
  M("maintenance.access.element", "Maintenance Access Element", [10], G, ["OPERATIONS"], { notes: `${ONLY_18} §18 names a class, not an object — flagged.` }),

  // ════ BOARD — labels his wider library export prints that neither his manifest nor §18 carries (glb MISSING) ════
  W("hutch", "Hutch", [B.L01], ["DINING"], ID, { notes: NO_18 }),
  W("chest", "Chest", [B.L01], ["MASTER_BEDROOM"], ID, { notes: `Tall chest of drawers (narrower and taller than the dresser on the overview). ${NO_18}` }),
  W("linen.cabinet", "Linen Cabinet", [B.L01], ["MASTER_BATH"], ID, { notes: NO_18 }),
  W("double.vanity", "Double Vanity", [B.L01], ["MASTER_BATH"], WET, { notes: NO_18 }),
  W("coat.rack", "Coat Rack", [B.L01, B.L05, B.L07, B.R_ENT], ["ENTRY_PORCH"], ID, { notes: `${NO_18} §18 has no Entry · Porch section.` }),
  W("console.table", "Console Table", [B.L01], ["ENTRY_PORCH"], ID, { names: ["Console"], notes: `Entry console table (not the TV console). ${NO_18}` }),
  W("entry.bench", "Entry Bench", [B.L01, B.L05, B.L07, B.R_ENT], ["ENTRY_PORCH"], ID, { names: ["Bench"], notes: `Wood-legged entry bench — drawn differently from the Bedroom Bench, so not merged. ${NO_18}` }),
  W("porch.covered", "Porch (Covered)", [B.L01], ["ENTRY_PORCH"], ["ROOF", "EXTERIOR", "SITE"], { notes: `Roofed porch on posts — distinct from the open Deck / Porch. ${NO_18}` }),
  W("doormat", "Doormat", [B.L07, B.R_ENT], ["ENTRY_PORCH"], ID, { notes: NO_18 }),
  W("desk.organizer", "Desk Organizer", [B.L07, B.R_OFF], ["OFFICE"], ID, { notes: NO_18 }),
  W("wall.shelf", "Wall Shelf", [B.L07, B.R_LAU], SL, ID, { notes: NO_18 }),
  W("tool.utility.rack", "Tool / Utility Rack", [B.L01], SL, ID, { notes: NO_18 }),
  W("faucet", "Faucet", [B.L01], G, ["PLUMBING"], { notes: NO_18 }),
  W("pipe", "Pipe", [B.L01], G, ["PLUMBING"], { notes: NO_18 }),
  W("p.trap", "P-Trap", [B.L01], G, ["PLUMBING"], { notes: NO_18 }),
  W("wall", "Wall", [B.L01], G, ["FRAMING", "INTERIOR_FINISH"], { notes: `Finished wall assembly (the overview's Building Elements · Wall). ${NO_18}` }),
  W("floor", "Floor", [B.L01], G, ["FRAMING", "INTERIOR_FINISH"], { notes: NO_18 }),
  W("ceiling", "Ceiling", [B.L01], G, ["FRAMING", "INTERIOR_FINISH"], { notes: NO_18 }),
  W("duct", "Duct", [B.L01], G, ["HVAC"], { notes: NO_18 }),
  W("return.grille", "Return Grille", [B.L01, B.S08], G, ["HVAC"], { names: ["Return", "Vent Register + Return Grille"], notes: `The systems board draws it beside the Vent Register. ${NO_18}` }),
  W("coverage.zone", "Coverage Zone", [B.L01, B.S07], G, ["SECURITY"], { names: ["Coverage"], notes: `A coverage VISUALIZATION (brief §6), not a solid — a translucent cone/fan, no PLAN footprint. ${NO_18}` }),
  W("window.fixed", "Fixed Window", [B.L01], G, OPEN_EX, { names: ["Fixed"], notes: NO_18 }),
  W("linear.light", "Linear Light", [B.L01, B.L03], G, EL_ID, { names: ["Linear", "Accent (LED)"], notes: `The Living Room Pack's Accent (LED) bar normalizes here. ${NO_18}` }),
  W("sofa.2seat", "Sofa · 2-Seat", [B.L03], ["LIVING"], ID, { names: ["2-Seat"], notes: "Variant from the Living Room Pack board (Variants & Options)." }),
  W("sofa.sectional", "Sofa · Sectional (L)", [B.L03], ["LIVING"], ID, { names: ["Sectional (L)"], notes: "Variant from the Living Room Pack board (Variants & Options)." }),
  W("coffee.table.round", "Coffee Table · Round", [B.L03], ["LIVING"], ID, { names: ["Coffee (Round)"], notes: "Variant from the Living Room Pack board." }),
  W("side.table.c", "Side Table · C-Table", [B.L03], ["LIVING"], ID, { names: ["Side (C-Table)"], notes: "Variant from the Living Room Pack board." }),
  W("soundbar", "Soundbar", [B.L03], ["LIVING"], ID, { notes: NO_18 }),
  W("curtains.blinds", "Curtains / Blinds", [B.L02], G, ID, { notes: `Manual window treatment; the motorized shade is his motorized.shade.track.v1. ${NO_18}` }),
  W("ceiling.fan", "Ceiling Fan", [B.L02], ["LIVING"], EL_ID, { names: ["Ceiling Fan (Optional)"], notes: NO_18 }),
  W("outlet", "Outlet", [B.L01, B.L02], G, ["ELECTRICAL"], { names: ["Outlet (Duplex)"], notes: `His outlet.switch.v1 models the pair; the boards print the outlet alone. ${NO_18}` }),
  W("switch", "Switch", [B.L01, B.L02], G, ["ELECTRICAL"], { names: ["Dimmer (Switch)"], notes: `His outlet.switch.v1 models the pair; the boards print the switch alone. ${NO_18}` }),

  // ════ DUPLICATE_NORMALIZED — distinct-looking board labels that resolve to one row ════
  D("couch", "Couch", [B.S01], "sofa.v1"),
  D("bookcase", "Bookcase", [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.R_OFF], "bookshelf.v1"),
  D("media.console", "Media Console", [B.L01, B.L02], "tv.console.v1", ["Media / TV Console"]),
  D("media.cabinet", "Media Cabinet", [B.L03], "tv.console.v1"),
  D("task.chair", "Task Chair", [B.L01], "office.chair.v1"),
  D("stud.wall", "Stud Wall", [B.L01], "wall.framing.v1"),
  D("towel.rack", "Towel Rack", [B.L01], "towel.bar.v1"),
  D("buffet.credenza", "Buffet / Credenza", [B.L01], "sideboard.credenza.v1"),
  D("shoe.storage", "Shoe Storage", [B.L01], "shoe.rack.v1"),
  D("closet.unit", "Closet Unit", [B.L05, B.L07, B.R_CLO], "closet.system.v1"),
  D("drawer.island", "Drawer Island", [B.L07, B.R_CLO], "closet.island.v1"),
];

// ── build: derive statuses + geometry notes, never per row ──────────────────────────────────────────────────────────
const uniq = <T,>(xs: T[]): T[] => Array.from(new Set(xs));
const SHARED_OF = new Map<string, string[]>();
for (const g of SHARED_GEOMETRY) for (const s of g) SHARED_OF.set(s, g.filter((x) => x !== s));
function geometryNotes(slug: string): string[] {
  const out: string[] = [];
  const shared = SHARED_OF.get(slug);
  if (shared) out.push(`shared geometry with ${shared.map((s) => ID_PREFIX + s.replace(/-/g, ".") + ".v1").join(", ")}`);
  if (Object.hasOwn(FLOOR_FLOATS, slug)) out.push(`min z ${FLOOR_FLOATS[slug].toFixed(2)} (floor asset floats)`);
  if (Object.hasOwn(FLOOR_SUNK, slug)) out.push(`min z ${FLOOR_SUNK[slug].toFixed(2)} (sunk below the floor)`);
  return out;
}
function build(): InventoryRow[] {
  const dupTargets = new Map(ROWS.filter((r) => !r.dup).map((r) => [ID_PREFIX + r.suffix + ".v1", r]));
  const rows: InventoryRow[] = [];
  for (const r of ROWS) {
    const id = ID_PREFIX + r.suffix + ".v1";
    const slug = slugOf(id);
    const target = r.dup ? dupTargets.get(r.dup) : undefined;
    const base = target ?? r;
    const ready = base.origin === "LIBRARY";
    const status: FileStatus = ready ? "READY" : "MISSING";
    const names = uniq([r.label, ...(r.names ?? [])]);
    const sources = uniq([
      ...(r.origin === "LIBRARY" ? [MANIFEST_SOURCE, ...(r.mp ?? []).map((p) => PACK_BOARD[p])] : []),
      ...(r.src ?? []),
    ]);
    const notes: string[] = [];
    if (r.dup) notes.push(`DUPLICATE_NORMALIZED → ${r.dup}`);
    else if (ready) {
      notes.push(`READY — models/${slug}.glb · metadata/${slug}.json · plan/${slug}.svg (his complete library, 2026-11-07)`);
      if (Object.hasOwn(STARTER_LINEAGE, slug)) notes.push(`supersedes starter ${STARTER_LINEAGE[slug]}`);
      notes.push(...geometryNotes(slug));
    } else notes.push(r.origin === "MASTER_18" ? "MISSING — a §18 line his library does not carry; GLB + PLAN SVG + metadata still to build" : "MISSING — printed on his wider library export only; GLB + PLAN SVG + metadata still to build");
    if (r.notes) notes.push(r.notes);
    rows.push({
      id, label: r.label, origin: r.origin, referenceNames: names, sources, packs: uniq(r.packs ?? []).sort((a, b) => a - b),
      ...(r.origin === "LIBRARY" ? { manifestPacks: [...(r.mp ?? [])] } : {}),
      rooms: uniq(r.rooms), phases: uniq(r.phases), ...(r.kind ? { legacyKind: r.kind } : {}),
      ...(ready && !r.dup && Object.hasOwn(STARTER_LINEAGE, slug) ? { starterId: STARTER_LINEAGE[slug] } : {}),
      glb: status, plan: status, metadata: status, visualQa: "PENDING", notes: notes.join(" · "), ...(r.dup ? { duplicateOf: r.dup } : {}),
    });
  }
  return rows;
}
/** THE inventory — every row, authored order (the generator sorts by origin then id). */
export const ASSET_INVENTORY: InventoryRow[] = build();

// ── lookups ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const INDEX = new Map(ASSET_INVENTORY.map((r) => [r.id, r]));
export function inventoryById(id: string): InventoryRow | undefined { return INDEX.get(id); }
/** Distinct assets — the rows that are not a normalized duplicate. */
export function canonicalRows(rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] { return rows.filter((r) => !r.duplicateOf); }
export function duplicateRows(rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] { return rows.filter((r) => !!r.duplicateOf); }
export function rowsOfOrigin(origin: Origin, rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] { return rows.filter((r) => r.origin === origin); }
/** Rows sorted for the ledger: origin (LIBRARY · MASTER_18 · BOARD · DUPLICATE) then id. */
export function sortedRows(rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] {
  return [...rows].sort((a, b) => ORIGINS.indexOf(a.origin) - ORIGINS.indexOf(b.origin) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
/** Normalize a printed name for matching: case-, accent- and punctuation-insensitive. */
export function normalizeName(s: string): string { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
/** Every row whose referenceNames carry this printed name. */
export function rowsByReferenceName(name: string, rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] {
  const n = normalizeName(name);
  return rows.filter((r) => r.referenceNames.some((x) => normalizeName(x) === n));
}

export interface PackCount { rows: number; ready: number; missing: number; manifest: number }
export interface InventorySummary {
  total: number; distinct: number; duplicates: number;
  byOrigin: Record<Origin, number>;
  byGlb: Record<FileStatus, number>; byPlan: Record<FileStatus, number>; byMetadata: Record<FileStatus, number>; byVisualQa: Record<VisualQa, number>;
  byPack: Record<number, PackCount>; noPack: number;
  byRoom: Record<RoomId, number>;
  sharedGeometryGroups: number; sharedGeometryIds: number; floorFloats: number; floorSunk: number; starterSuperseded: number; onlyIn18: number;
}
/** Counts over the DISTINCT rows (duplicates are counted once, as their target). */
export function inventorySummary(rows: InventoryRow[] = ASSET_INVENTORY): InventorySummary {
  const dist = canonicalRows(rows);
  const zeroF = () => Object.fromEntries(FILE_STATUSES.map((s) => [s, 0])) as Record<FileStatus, number>;
  const byGlb = zeroF(), byPlan = zeroF(), byMetadata = zeroF();
  const byVisualQa = Object.fromEntries(VISUAL_QA.map((s) => [s, 0])) as Record<VisualQa, number>;
  const byOrigin = Object.fromEntries(ORIGINS.map((o) => [o, 0])) as Record<Origin, number>;
  const byPack: Record<number, PackCount> = Object.fromEntries(PACK_NUMBERS.map((p) => [p, { rows: 0, ready: 0, missing: 0, manifest: 0 }]));
  const byRoom = Object.fromEntries(ROOM_IDS.map((r) => [r, 0])) as Record<RoomId, number>;
  let noPack = 0, onlyIn18 = 0, starterSuperseded = 0;
  for (const r of rows) byOrigin[r.origin]++;
  for (const r of dist) {
    byGlb[r.glb]++; byPlan[r.plan]++; byMetadata[r.metadata]++; byVisualQa[r.visualQa]++;
    for (const room of r.rooms) byRoom[room]++;
    if (r.packs.length === 0) noPack++;
    for (const p of r.packs) { const b = byPack[p]; b.rows++; if (r.glb === "READY") b.ready++; else b.missing++; }
    for (const p of r.manifestPacks ?? []) byPack[p].manifest++;
    if (r.starterId) starterSuperseded++;
    if (r.sources.length === 1 && r.sources[0] === MASTER_18_SOURCE) onlyIn18++;
  }
  return {
    total: rows.length, distinct: dist.length, duplicates: rows.length - dist.length, byOrigin, byGlb, byPlan, byMetadata, byVisualQa, byPack, noPack, byRoom,
    sharedGeometryGroups: SHARED_GEOMETRY.length, sharedGeometryIds: SHARED_GEOMETRY.reduce((n, g) => n + g.length, 0),
    floorFloats: Object.keys(FLOOR_FLOATS).length, floorSunk: Object.keys(FLOOR_SUNK).length, starterSuperseded, onlyIn18,
  };
}
/** The distinct rows whose GLB is MISSING, grouped by pack (a row in two packs is listed under both; — for no pack). */
export function missingByPack(rows: InventoryRow[] = ASSET_INVENTORY): Record<string, InventoryRow[]> {
  const out: Record<string, InventoryRow[]> = {};
  for (const r of sortedRows(canonicalRows(rows))) {
    if (r.glb !== "MISSING") continue;
    for (const k of r.packs.length ? r.packs.map(String) : ["—"]) (out[k] ??= []).push(r);
  }
  return out;
}
