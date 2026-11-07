/**
 * ARCHITECT-2525 · ASSET INVENTORY (Rev A · completeness ledger) — ONE SOURCE, GENERATED LEDGER.
 * =================================================================================================
 * The intake master (docs/asks/2026.11.07_architect2525_3d_asset_intake_master.md) §29 requires ASSET_INVENTORY.md —
 * "this ledger determines completeness; do not estimate completeness from a screenshot". This module is the ONE source
 * that ledger is generated from (scripts/architect-asset-inventory.mjs → docs/architecture-2525/ASSET_INVENTORY.md, gated
 * byte-identical by tests/architect-asset-inventory.test.mjs).
 *
 * One row per DISTINCT usable object across ALL approved boards (the operator's 35-board library export,
 * docs/architecture-2525/asset-library/2026-11-06, which the 18 chat boards in docs/asks/img/2026.11.07_architect2525_*
 * duplicate by content — see BOARD_ALIASES) plus every line of §18 (the complete pack coverage target), normalized:
 *  · id — §7 grammar `<domain>.<object>[.<variant>].v1`; the 18 starter ids of §20 are used EXACTLY where they exist.
 *  · referenceNames — every name as printed on any board or §18 line ("Sofa", "Couch", "Sofa (3-Seat)" …) so a reader can
 *    find the row by the words in front of them; a DUPLICATE_NORMALIZED row (duplicateOf) is kept so the ledger SHOWS the
 *    normalization (§28 mark 13) — its names/sources/packs are also carried by its target (gated ⊆).
 *  · glb / plan / metadata — READY only for the §20 starter files (model path in STARTER_MODELS, gated against the starter
 *    manifest), NEEDS_REBUILD where the starter floats (bed_queen · toilet), PLACEHOLDER where a legacy ObjectKind draws a
 *    box in the walk today, MISSING otherwise. visualQa is PENDING until §31 captures exist (FAIL for the two floaters).
 * Statuses are DERIVED from the three facts (starter file · rebuild list · legacy kind), never hand-typed per row.
 * Pure data + pure lookups, no React, no I/O — the generator and the gate read this.
 */
import type { ObjectKind } from "@/lib/room-objects";

// ── enums (§13 rooms · §14 phases · §7 domains · §28 marks) ──────────────────────────────────────────────────────────
export const ROOM_IDS = ["MASTER_BEDROOM", "MASTER_BATH", "MASTER_CLOSET", "LIVING", "KITCHEN", "DINING", "OFFICE", "STORAGE_LAUNDRY", "ENTRY_PORCH", "GENERAL"] as const;
export type RoomId = (typeof ROOM_IDS)[number];
export const PHASE_IDS = ["FOUNDATION", "FRAMING", "ROOF", "PLUMBING", "ELECTRICAL", "HVAC", "SECURITY", "INTERIOR_FINISH", "INTERIOR_DESIGN", "EXTERIOR", "SITE", "OPERATIONS"] as const;
export type PhaseId = (typeof PHASE_IDS)[number];
export const ASSET_DOMAINS = ["furniture", "kitchen", "bath", "appliance", "opening", "structure", "electrical", "plumbing", "hvac", "lighting", "security", "smarthome", "site", "accessibility", "sustainability", "lifestyle", "operations", "finish"] as const;
export type AssetDomain = (typeof ASSET_DOMAINS)[number];
export const FILE_STATUSES = ["READY", "PLACEHOLDER", "NEEDS_REBUILD", "MISSING"] as const;
export type FileStatus = (typeof FILE_STATUSES)[number];
export const VISUAL_QA = ["PENDING", "PASS", "FAIL"] as const;
export type VisualQa = (typeof VISUAL_QA)[number];
export const PACK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const PACK_LABELS: Record<number, string> = {
  1: "Shell + Structure", 2: "Interiors + Fixtures", 3: "Finishes + Lighting + Exterior", 4: "Appliances + Utilities + Life Systems",
  5: "Smart Home + Automation", 6: "Site + Landscape", 7: "Accessibility + Inclusion", 8: "Sustainability + Resilience",
  9: "Lifestyle + Personalization", 10: "Operations + Maintenance",
};
/** §7: `<domain>.<object>[.<variant>].v<n>` — lowercase, digits and underscores inside a segment, 3 or 4 segments. */
export const ID_GRAMMAR = new RegExp(`^(${ASSET_DOMAINS.join("|")})\\.[a-z0-9_]+(?:\\.[a-z0-9_]+)?\\.v[0-9]+$`);
export function domainOf(id: string): AssetDomain { return id.split(".")[0] as AssetDomain; }

export interface InventoryRow {
  id: string;                 // STABLE semantic id (§7); a starter id verbatim where one exists (§20)
  label: string;              // the display name the registry will carry
  referenceNames: string[];   // every name as printed on any board / §18 line that maps here
  sources: string[];          // board files (relative to the library export) and/or MASTER_18_SOURCE
  packs: number[];            // §18 packs (1–10); [] = printed on a board but on no §18 list
  rooms: RoomId[];            // ≥1; GENERAL for a shared asset (§13 — never a tenth room)
  phases: PhaseId[];          // ≥1 (§14)
  legacyKind?: ObjectKind;    // the room-objects kind that draws a box for it in the walk today
  glb: FileStatus; plan: FileStatus; metadata: FileStatus;
  visualQa: VisualQa;
  notes: string;
  duplicateOf?: string;       // DUPLICATE_NORMALIZED → the canonical row's id
}

// ── sources: the 35 canonical boards (library export) + the §18 list ─────────────────────────────────────────────────
export const LIBRARY_ROOT = "docs/architecture-2525/asset-library/2026-11-06";
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
/** The 35 canonical boards, in the library manifest's folders. */
export const BOARDS: readonly string[] = Object.values(B);
/** The 18 chat boards + 2 first-send JPGs (docs/asks/img/2026.11.07_architect2525_*) → the library board with the SAME content.
 *  3 are byte-identical (furniture, utility, pack1+2), the rest are re-encodes/crops of the same picture — one source each. */
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

// ── the 18 native starter models (§20) — id → model path in docs/architecture-2525/asset-library/3d-starter-2026-11-06 ──
export const STARTER_MODELS: Readonly<Record<string, string>> = {
  "furniture.sofa.3seat.v1": "models/sofa_3seat.glb", "furniture.lounge_chair.v1": "models/lounge_chair.glb", "furniture.coffee_table.v1": "models/coffee_table.glb",
  "furniture.bed.queen.v1": "models/bed_queen.glb", "furniture.nightstand.v1": "models/nightstand.glb", "furniture.dresser.v1": "models/dresser.glb",
  "furniture.dining_table.v1": "models/dining_table.glb", "furniture.dining_chair.v1": "models/dining_chair.glb",
  "kitchen.base_run.sink.v1": "models/kitchen_base_run_sink.glb", "kitchen.upper_cabinets.v1": "models/upper_cabinets.glb",
  "appliance.refrigerator.frenchdoor.v1": "models/refrigerator.glb", "bath.toilet.v1": "models/toilet.glb", "bath.vanity_sink.v1": "models/vanity_sink.glb",
  "bath.shower.enclosure.v1": "models/shower_enclosure.glb", "appliance.washer.frontload.v1": "models/washer.glb", "appliance.dryer.frontload.v1": "models/dryer.glb",
  "opening.door.interior.v1": "models/interior_door.glb", "opening.window.unit.v1": "models/window_unit.glb",
};
export const STARTER_IDS: readonly string[] = Object.keys(STARTER_MODELS);
/** Starter GLBs whose lowest geometry does not sit on the floor — the walk shows them floating. */
export const NEEDS_REBUILD: Readonly<Record<string, string>> = {
  "furniture.bed.queen.v1": "floats above Z=0: min z 0.15",
  "bath.toilet.v1": "floats above Z=0: min z 0.18",
};

// ── rows (authored facts; statuses derived in build) ────────────────────────────────────────────────────────────────
interface RowIn { id: string; label: string; names: string[]; src: string[]; packs?: number[]; rooms: RoomId[]; phases: PhaseId[]; kind?: ObjectKind; notes?: string; dup?: string }
const ID: PhaseId[] = ["INTERIOR_DESIGN"];
const WET: PhaseId[] = ["PLUMBING", "INTERIOR_DESIGN"];
const FIN_ID: PhaseId[] = ["INTERIOR_FINISH", "INTERIOR_DESIGN"];
const EL_ID: PhaseId[] = ["ELECTRICAL", "INTERIOR_DESIGN"];
const OPEN_IN: PhaseId[] = ["FRAMING", "INTERIOR_FINISH", "INTERIOR_DESIGN"];
const OPEN_EX: PhaseId[] = ["FRAMING", "EXTERIOR", "INTERIOR_DESIGN"];
const G: RoomId[] = ["GENERAL"];
const NO_18 = "Printed on a board, on no §18 list — pack left open (—) rather than guessed.";
const ONLY_18 = "A §18 line with no board silhouette — needs a board or a modelling brief before a GLB.";

const ROWS: RowIn[] = [
  // ── FURNITURE ──
  { id: "furniture.sofa.3seat.v1", label: "Sofa · 3-Seat", names: ["Sofa", "Sofa (3-Seat)", "Sofa (2–3 Seat)", "3-Seat", "Couch"], src: [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.P02, B.R_LIV, B.S01], packs: [2], rooms: ["LIVING"], phases: ID, kind: "sofa" },
  { id: "furniture.sofa.2seat.v1", label: "Sofa · 2-Seat", names: ["2-Seat"], src: [B.L03], rooms: ["LIVING"], phases: ID, notes: "Variant from the Living Room Pack board (Variants & Options); not a §18 line." },
  { id: "furniture.sofa.sectional.v1", label: "Sofa · Sectional (L)", names: ["Sectional (L)"], src: [B.L03], rooms: ["LIVING"], phases: ID, notes: "Variant from the Living Room Pack board (Variants & Options); not a §18 line." },
  { id: "furniture.lounge_chair.v1", label: "Lounge Chair", names: ["Armchair", "Lounge Chair", "Armchair / Lounge Chair", "Accent Chair", "Accent Chair + Side Table"], src: [B.L01, B.L02, B.L03, B.L04, B.P02, B.P09], packs: [2, 9], rooms: ["LIVING"], phases: ID, notes: "Pack 9's Accent Chair (mid-century silhouette) normalizes here as a style variant — split to furniture.lounge_chair.accent.v1 only if the operator wants two chairs." },
  { id: "furniture.coffee_table.v1", label: "Coffee Table", names: ["Coffee Table", "Coffee (Rectangle)"], src: [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.P02, B.R_LIV, B.S01], packs: [2], rooms: ["LIVING"], phases: ID },
  { id: "furniture.coffee_table.round.v1", label: "Coffee Table · Round", names: ["Coffee (Round)"], src: [B.L03], rooms: ["LIVING"], phases: ID, notes: "Variant from the Living Room Pack board; not a §18 line." },
  { id: "furniture.side_table.v1", label: "Side Table", names: ["Side Table", "Accent Chair + Side Table"], src: [B.L01, B.L02, B.L03, B.P09], packs: [2, 9], rooms: ["LIVING"], phases: ID },
  { id: "furniture.side_table.c.v1", label: "Side Table · C-Table", names: ["Side (C-Table)"], src: [B.L03], rooms: ["LIVING"], phases: ID, notes: "Variant from the Living Room Pack board; not a §18 line." },
  { id: "furniture.media_console.v1", label: "Media Console", names: ["Media Console", "Media / TV Console", "TV Console", "Media Console + TV", "Media Cabinet", "Entertainment Console", "Entertainment Console + TV"], src: [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.P02, B.P09, B.R_LIV], packs: [2, 9], rooms: ["LIVING"], phases: ID, notes: "The TV on top is its own asset (lifestyle.tv.v1)." },
  { id: "furniture.bookcase.v1", label: "Bookcase", names: ["Bookcase", "Bookshelf", "Bookshelf + Decor"], src: [B.L01, B.L02, B.L03, B.L04, B.L05, B.L06, B.L07, B.P02, B.P09, B.R_OFF], packs: [2, 9], rooms: ["LIVING", "OFFICE"], phases: ID, kind: "bookshelf", notes: "One bookcase for Living / Office / Lifestyle." },
  { id: "furniture.dining_table.v1", label: "Dining Table", names: ["Dining Table", "Dining Table (4–8)", "Dining Table + 4 Chairs", "Table"], src: [B.L01, B.L05, B.L06, B.L07, B.R_DIN, B.S01], packs: [2], rooms: ["DINING"], phases: ID, kind: "table" },
  { id: "furniture.dining_chair.v1", label: "Dining Chair", names: ["Dining Chair", "Dining Table + 4 Chairs", "Chair"], src: [B.L01, B.L05, B.L06, B.L07, B.R_DIN, B.S01], packs: [2], rooms: ["DINING"], phases: ID, kind: "chair" },
  { id: "furniture.sideboard.v1", label: "Sideboard / Credenza", names: ["Sideboard", "Sideboard / Credenza", "Buffet / Credenza"], src: [B.L01, B.L05, B.L06, B.L07, B.R_DIN], packs: [2], rooms: ["DINING"], phases: ID },
  { id: "furniture.hutch.v1", label: "Hutch", names: ["Hutch"], src: [B.L01], rooms: ["DINING"], phases: ID, notes: NO_18 },
  { id: "furniture.bed.queen.v1", label: "Bed · Queen/King", names: ["Bed", "Bed (King/Queen)", "Bed (Queen/King)", "Queen / King Bed"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_BED, B.S04], packs: [2], rooms: ["MASTER_BEDROOM"], phases: ID, kind: "bed" },
  { id: "furniture.bed.bunk.v1", label: "Bunk Bed", names: ["Bunk Bed"], src: [B.S04], packs: [2], rooms: ["MASTER_BEDROOM"], phases: ID },
  { id: "furniture.nightstand.v1", label: "Nightstand", names: ["Nightstand"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_BED, B.S04], packs: [2], rooms: ["MASTER_BEDROOM"], phases: ID, kind: "nightstand" },
  { id: "furniture.dresser.v1", label: "Dresser", names: ["Dresser"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_BED, B.S01], packs: [2], rooms: ["MASTER_BEDROOM"], phases: ID, kind: "dresser" },
  { id: "furniture.chest.v1", label: "Chest", names: ["Chest"], src: [B.L01], rooms: ["MASTER_BEDROOM"], phases: ID, notes: `Tall chest of drawers (the bedroom panel draws it narrower and taller than the dresser). ${NO_18}` },
  { id: "furniture.wardrobe.v1", label: "Wardrobe", names: ["Wardrobe"], src: [B.L01, B.L06, B.P02], packs: [2], rooms: ["MASTER_BEDROOM"], phases: ID, kind: "wardrobe" },
  { id: "furniture.bench.v1", label: "Bench", names: ["Bedroom Bench", "Bed Bench", "Entry Bench", "Bench"], src: [B.L01, B.L05, B.L07, B.P02, B.R_BED, B.R_ENT], packs: [2], rooms: ["MASTER_BEDROOM", "ENTRY_PORCH"], phases: ID, notes: "One upholstered bench serves the bedroom (foot of bed) and the entry." },
  { id: "furniture.mirror.v1", label: "Mirror", names: ["Mirror", "Full Mirror"], src: [B.L01, B.P09], packs: [2, 9], rooms: ["MASTER_BEDROOM", "MASTER_CLOSET"], phases: ID, kind: "mirror", notes: "Full-length / wall mirror for bedroom, closet and lifestyle; the bath's lit mirror is bath.mirror.led.v1." },
  { id: "furniture.closet.system.v1", label: "Closet System", names: ["Closet System", "Closet Unit"], src: [B.L01, B.L05, B.L06, B.L07, B.R_CLO], packs: [2], rooms: ["MASTER_CLOSET"], phases: ID },
  { id: "furniture.closet.rod.v1", label: "Hanging Rod", names: ["Hanging Rod", "Hanging (Long)"], src: [B.L01, B.L07, B.R_CLO], packs: [2], rooms: ["MASTER_CLOSET"], phases: ID, kind: "closetrod" },
  { id: "furniture.closet.drawer_unit.v1", label: "Drawer Unit", names: ["Drawer Unit"], src: [B.L01, B.L05, B.L06], packs: [2], rooms: ["MASTER_CLOSET", "STORAGE_LAUNDRY"], phases: ID },
  { id: "furniture.closet.shelving.v1", label: "Shelving", names: ["Shelving", "Shelving Unit"], src: [B.L01, B.L05, B.L07, B.R_CLO], packs: [2], rooms: ["MASTER_CLOSET"], phases: ID, kind: "shelving" },
  { id: "furniture.closet.shoe_rack.v1", label: "Shoe Rack", names: ["Shoe Rack", "Shoe Storage"], src: [B.L01], packs: [2], rooms: ["MASTER_CLOSET", "ENTRY_PORCH"], phases: ID, kind: "shoerack", notes: "The entry panel's Shoe Storage (a low cabinet) normalizes here." },
  { id: "furniture.closet.island.v1", label: "Closet Island", names: ["Closet Island", "Drawer Island"], src: [B.L01, B.L07, B.R_CLO], packs: [2], rooms: ["MASTER_CLOSET"], phases: ID },
  { id: "furniture.hamper.v1", label: "Hamper", names: ["Hamper"], src: [B.L01], packs: [2], rooms: ["MASTER_CLOSET"], phases: ID },
  { id: "furniture.desk.v1", label: "Desk", names: ["Desk", "Desk + Chair", "Office Desk + Chair"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_OFF, B.S01], packs: [2], rooms: ["OFFICE"], phases: ID, kind: "desk" },
  { id: "furniture.chair.office.v1", label: "Office Chair", names: ["Office Chair", "Task Chair", "Desk + Chair", "Office Desk + Chair"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_OFF, B.S01], packs: [2], rooms: ["OFFICE"], phases: ID, notes: "The overview's Task Chair and Office Chair are one object." },
  { id: "furniture.file_cabinet.v1", label: "File Cabinet", names: ["File Cabinet"], src: [B.L01, B.L06, B.P02], packs: [2], rooms: ["OFFICE"], phases: ID },
  { id: "furniture.monitor.v1", label: "Monitor", names: ["Monitor", "Monitor (Single)", "Monitors (Dual)"], src: [B.L01, B.L07, B.P02, B.R_OFF], packs: [2], rooms: ["OFFICE"], phases: ID, notes: "Monitors (Dual) = two placed instances of the one monitor." },
  { id: "furniture.desk_organizer.v1", label: "Desk Organizer", names: ["Desk Organizer"], src: [B.L07, B.R_OFF], rooms: ["OFFICE"], phases: ID, notes: NO_18 },
  { id: "furniture.storage.shelf.v1", label: "Storage Shelf", names: ["Storage Shelf", "Storage Shelves", "Storage Shelving", "Utility Shelving", "Shelf"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.P04, B.R_STO], packs: [2, 4], rooms: ["STORAGE_LAUNDRY"], phases: ID, notes: "Freestanding rack; the closet's built-in shelving is furniture.closet.shelving.v1." },
  { id: "furniture.shelf.wall.v1", label: "Wall Shelf", names: ["Wall Shelf"], src: [B.L07, B.R_LAU], rooms: ["STORAGE_LAUNDRY"], phases: ID, notes: NO_18 },
  { id: "furniture.storage.cabinet.v1", label: "Storage Cabinet", names: ["Storage Cabinet", "Cabinet"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_STO], packs: [2], rooms: ["STORAGE_LAUNDRY"], phases: ID },
  { id: "furniture.storage.bin.v1", label: "Storage Bin", names: ["Storage Bin", "Storage Bins"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_STO], packs: [2], rooms: ["STORAGE_LAUNDRY", "MASTER_CLOSET"], phases: ID },
  { id: "furniture.workbench.v1", label: "Workbench", names: ["Workbench", "Workbench / Utility Surface"], src: [B.L01], packs: [2], rooms: ["STORAGE_LAUNDRY"], phases: ID },
  { id: "furniture.utility_rack.v1", label: "Tool / Utility Rack", names: ["Tool / Utility Rack"], src: [B.L01], rooms: ["STORAGE_LAUNDRY"], phases: ID, notes: NO_18 },
  { id: "furniture.console_table.v1", label: "Console Table", names: ["Console"], src: [B.L01], rooms: ["ENTRY_PORCH"], phases: ID, notes: `Entry console table (not the media console). ${NO_18} §18 has no Entry · Porch section.` },
  { id: "furniture.coat_rack.v1", label: "Coat Rack", names: ["Coat Rack"], src: [B.L01, B.L05, B.L07, B.R_ENT], rooms: ["ENTRY_PORCH"], phases: ID, notes: `${NO_18} §18 has no Entry · Porch section.` },
  { id: "furniture.couch.v1", label: "Couch", names: ["Couch"], src: [B.S01], rooms: ["LIVING"], phases: ID, dup: "furniture.sofa.3seat.v1" },
  // ── KITCHEN ──
  { id: "kitchen.base_run.sink.v1", label: "Kitchen Base Cabinet Run (with Sink)", names: ["Base Cabinets (w/ Sink)", "Base Cabinet + Sink", "Kitchen Base Cabinet Run (with Sink)"], src: [B.L06, B.P02], packs: [2], rooms: ["KITCHEN"], phases: FIN_ID },
  { id: "kitchen.cabinet.base.v1", label: "Base Cabinet", names: ["Base Cabinet", "Base Cabinets"], src: [B.L01, B.L05, B.L07, B.R_KIT, B.S02], packs: [2], rooms: ["KITCHEN"], phases: FIN_ID, kind: "counter" },
  { id: "kitchen.upper_cabinets.v1", label: "Upper Cabinets", names: ["Wall Cabinet", "Wall Cabinets", "Upper Cabinets"], src: [B.L01, B.L06, B.P02, B.S02], packs: [2], rooms: ["KITCHEN"], phases: FIN_ID },
  { id: "kitchen.sink.v1", label: "Kitchen Sink", names: ["Kitchen Sink", "Sink (Base)", "Sink"], src: [B.L01], packs: [2], rooms: ["KITCHEN"], phases: WET, notes: "The drop-in sink as its own asset; the starter base run already carries one basin." },
  { id: "kitchen.island.v1", label: "Kitchen Island", names: ["Kitchen Island", "Island + Stools", "Kitchen Island + Stools"], src: [B.L01, B.L07, B.P02, B.R_KIT, B.S03], packs: [2], rooms: ["KITCHEN"], phases: FIN_ID },
  { id: "kitchen.bar_stool.v1", label: "Bar Stool", names: ["Bar Stool", "Bar Stools (Pair)", "Island + Stools", "Kitchen Island + Stools"], src: [B.L01, B.L07, B.P02, B.R_KIT, B.S03], packs: [2], rooms: ["KITCHEN"], phases: ID },
  { id: "kitchen.cabinet.pantry.v1", label: "Pantry Cabinet", names: ["Pantry Cabinet"], src: [B.S03], packs: [2], rooms: ["KITCHEN"], phases: FIN_ID },
  // ── BATH ──
  { id: "bath.toilet.v1", label: "Toilet", names: ["Toilet"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_BATH, B.S04], packs: [2], rooms: ["MASTER_BATH"], phases: WET, kind: "toilet" },
  { id: "bath.vanity_sink.v1", label: "Vanity Sink", names: ["Vanity Sink", "Vanity + Sink", "Bath Vanity + Sink", "Bathroom Vanity", "Sink Vanity", "Single Vanity"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_BATH, B.S02, B.S04], packs: [2], rooms: ["MASTER_BATH"], phases: WET, kind: "sink" },
  { id: "bath.vanity.double.v1", label: "Double Vanity", names: ["Double Vanity"], src: [B.L01], rooms: ["MASTER_BATH"], phases: WET, notes: NO_18 },
  { id: "bath.shower.enclosure.v1", label: "Shower Enclosure", names: ["Shower Stall", "Shower (Glass)", "Shower Enclosure"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_BATH, B.S04], packs: [2], rooms: ["MASTER_BATH"], phases: WET, kind: "shower" },
  { id: "bath.tub.v1", label: "Bathtub", names: ["Bathtub", "Tub", "Tub (Freestanding)"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.R_BATH], packs: [2], rooms: ["MASTER_BATH"], phases: WET, kind: "tub" },
  { id: "bath.mirror.led.v1", label: "Mirror (LED)", names: ["Mirror (LED)", "Mirror"], src: [B.L01, B.P02], packs: [2], rooms: ["MASTER_BATH"], phases: ID, notes: "The lit vanity mirror; the bedroom/closet mirror is furniture.mirror.v1." },
  { id: "bath.towel_bar.v1", label: "Towel Bar", names: ["Towel Bar", "Towel Rack", "Towel Bar / Rack"], src: [B.L01, B.L06, B.P02], packs: [2], rooms: ["MASTER_BATH"], phases: ID },
  { id: "bath.linen_cabinet.v1", label: "Linen Cabinet", names: ["Linen Cabinet"], src: [B.L01], rooms: ["MASTER_BATH"], phases: ID, notes: NO_18 },
  // ── APPLIANCE ──
  { id: "appliance.refrigerator.frenchdoor.v1", label: "Refrigerator", names: ["Refrigerator"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.P04, B.R_KIT, B.S03], packs: [2, 4], rooms: ["KITCHEN"], phases: ID, kind: "fridge", notes: "One refrigerator across Pack 2, Pack 4, the kitchen boards and the house board (§19)." },
  { id: "appliance.range.v1", label: "Range / Oven", names: ["Range / Oven", "Range + Oven", "Stove / Oven", "Stove + Oven"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.P04, B.R_KIT, B.S03], packs: [2, 4], rooms: ["KITCHEN"], phases: ID, kind: "stove" },
  { id: "appliance.range_hood.v1", label: "Range Hood", names: ["Range Hood"], src: [B.L01, B.L07, B.P02, B.P04, B.R_KIT, B.S03], packs: [2, 4], rooms: ["KITCHEN"], phases: ["HVAC", "INTERIOR_DESIGN"], kind: "rangehood" },
  { id: "appliance.dishwasher.v1", label: "Dishwasher", names: ["Dishwasher"], src: [B.L01, B.P04], packs: [2, 4], rooms: ["KITCHEN"], phases: WET },
  { id: "appliance.microwave.v1", label: "Microwave", names: ["Microwave"], src: [B.P04], packs: [2, 4], rooms: ["KITCHEN"], phases: ID },
  { id: "appliance.garbage_disposal.v1", label: "Garbage Disposal", names: ["Garbage Disposal"], src: [B.P04], packs: [4], rooms: ["KITCHEN"], phases: ["PLUMBING"] },
  { id: "appliance.washer.frontload.v1", label: "Washer", names: ["Washer"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.P04, B.R_LAU, B.S02], packs: [2, 4], rooms: ["STORAGE_LAUNDRY"], phases: WET, kind: "washer" },
  { id: "appliance.dryer.frontload.v1", label: "Dryer", names: ["Dryer"], src: [B.L01, B.L05, B.L06, B.L07, B.P02, B.P04, B.R_LAU, B.S02], packs: [2, 4], rooms: ["STORAGE_LAUNDRY"], phases: EL_ID, notes: "dryer.glb is byte-identical to washer.glb (starter VALIDATION.json sha256 53e836a7…) — a rebuild should give the dryer its own door/control silhouette." },
  { id: "appliance.drying_rack.v1", label: "Drying Rack", names: ["Drying Rack"], src: [B.P04], packs: [4], rooms: ["STORAGE_LAUNDRY"], phases: ID },
  { id: "appliance.iron_board.v1", label: "Iron + Board", names: ["Iron + Board"], src: [B.P04], packs: [4], rooms: ["STORAGE_LAUNDRY"], phases: ID },
  // ── OPENING ──
  { id: "opening.door.interior.v1", label: "Interior Door", names: ["Interior Door", "Door", "Interior Door (Access)", "Door (Interior / Exterior)"], src: [B.L01, B.L02, B.L05, B.P01, B.S05], packs: [1], rooms: G, phases: OPEN_IN, kind: "door" },
  { id: "opening.door.entry.v1", label: "Entry Door", names: ["Entry Door", "Exterior Door", "Door (Interior / Exterior)"], src: [B.L01, B.L05, B.L07, B.P01, B.P03, B.R_ENT, B.S05], packs: [1, 3], rooms: ["ENTRY_PORCH"], phases: OPEN_EX, notes: "Pack 3's Exterior Door is this door (§19)." },
  { id: "opening.door.sliding_glass.v1", label: "Sliding Glass Door", names: ["Sliding Glass Door", "Sliding", "Sliding Door (Optional)"], src: [B.L01, B.L02, B.P01, B.S05], packs: [1], rooms: G, phases: OPEN_EX },
  { id: "opening.door.garage.v1", label: "Garage Door", names: ["Garage Door"], src: [B.P03], packs: [3], rooms: G, phases: ["FRAMING", "EXTERIOR"], notes: "The canonical 3×3 house has no garage; kept for the pack, not placed by default." },
  { id: "opening.window.unit.v1", label: "Window Unit", names: ["Window Unit", "Single Window", "Window (Single)", "Window", "Window (Single / Wide)"], src: [B.L01, B.L02, B.L05, B.P01, B.S05], packs: [1], rooms: G, phases: OPEN_EX, kind: "window" },
  { id: "opening.window.wide.v1", label: "Wide Window", names: ["Wide Window", "Window (Wide)", "Window (Single / Wide)"], src: [B.L02, B.P01, B.S05], packs: [1], rooms: G, phases: OPEN_EX },
  { id: "opening.window.fixed.v1", label: "Fixed Window", names: ["Fixed"], src: [B.L01], rooms: G, phases: OPEN_EX, notes: NO_18 },
  { id: "opening.skylight.v1", label: "Skylight", names: ["Skylight"], src: [B.P01, B.S05], packs: [1], rooms: G, phases: ["FRAMING", "ROOF", "INTERIOR_DESIGN"] },
  { id: "opening.door.exterior.v1", label: "Exterior Door", names: ["Exterior Door"], src: [B.P03], packs: [3], rooms: ["ENTRY_PORCH"], phases: OPEN_EX, dup: "opening.door.entry.v1" },
  // ── STRUCTURE ──
  { id: "structure.foundation.slab.v1", label: "Foundation Slab", names: ["Foundation Slab"], src: [B.L05, B.P01, B.S06], packs: [1], rooms: G, phases: ["FOUNDATION"] },
  { id: "structure.footing.v1", label: "Footing", names: ["Footing"], src: [B.L05], packs: [1], rooms: G, phases: ["FOUNDATION"] },
  { id: "structure.stem_wall.v1", label: "Stem Wall", names: ["Stem Wall"], src: [B.L05], packs: [1], rooms: G, phases: ["FOUNDATION"] },
  { id: "structure.wall.frame.v1", label: "Wall Frame Section", names: ["Wall Frame Section", "Wall Framing", "Wall Frame", "Stud Wall"], src: [B.L01, B.L05, B.P01, B.S06], packs: [1], rooms: G, phases: ["FRAMING"], notes: "The overview's Stud Wall is this section." },
  { id: "structure.rough_opening.door.v1", label: "Door Rough Opening", names: ["Door Rough Opening"], src: [B.S06], packs: [1], rooms: G, phases: ["FRAMING"] },
  { id: "structure.rough_opening.window.v1", label: "Window Rough Opening", names: ["Window Rough Opening"], src: [B.S06], packs: [1], rooms: G, phases: ["FRAMING"] },
  { id: "structure.wall.sheathing.v1", label: "Wall Sheathing", names: ["Wall Sheathing", "Sheathing Panel", "Sheathing"], src: [B.L05, B.P01, B.S06], packs: [1], rooms: G, phases: ["FRAMING", "EXTERIOR"] },
  { id: "structure.roof.truss.v1", label: "Roof Truss", names: ["Roof Truss"], src: [B.L05, B.P01], packs: [1], rooms: G, phases: ["ROOF"] },
  { id: "structure.roof.framing_module.v1", label: "Roof / Ceiling Framing Module", names: ["Roof/Ceiling Framing Module", "Roof / Ceiling Framing Module", "Roof / Ceiling Framing"], src: [B.S06], packs: [1], rooms: G, phases: ["ROOF"] },
  { id: "structure.roof.sheathing.v1", label: "Roof Sheathing", names: ["Roof Sheathing"], src: [B.P01], packs: [1], rooms: G, phases: ["ROOF"], kind: "roof", notes: "The legacy Roof Panel (shell roof panel) stands in for it today." },
  { id: "structure.wall.v1", label: "Wall", names: ["Wall"], src: [B.L01], rooms: G, phases: ["FRAMING", "INTERIOR_FINISH"], kind: "shell", notes: `Finished wall assembly; the legacy hex Shell Panel stands in for it today. ${NO_18}` },
  { id: "structure.floor.v1", label: "Floor", names: ["Floor"], src: [B.L01], rooms: G, phases: ["FRAMING", "INTERIOR_FINISH"], notes: NO_18 },
  { id: "structure.ceiling.v1", label: "Ceiling", names: ["Ceiling"], src: [B.L01], rooms: G, phases: ["FRAMING", "INTERIOR_FINISH"], notes: NO_18 },
  { id: "structure.gutter.downspout.v1", label: "Gutter + Downspout", names: ["Gutter + Downspout"], src: [B.P03], packs: [3], rooms: G, phases: ["EXTERIOR"] },
  // ── FINISH ──
  { id: "finish.drywall.v1", label: "Drywall", names: ["Drywall", "Drywall Panel"], src: [B.L05, B.P03], packs: [3], rooms: G, phases: ["INTERIOR_FINISH"] },
  { id: "finish.paint.v1", label: "Paint", names: ["Paint", "Paint (Can)"], src: [B.L05, B.P03], packs: [3], rooms: G, phases: ["INTERIOR_FINISH"] },
  { id: "finish.flooring.lvp.v1", label: "Flooring / LVP", names: ["Flooring / LVP", "Flooring", "Flooring (Wood/LVP)"], src: [B.L05, B.P03], packs: [3], rooms: G, phases: ["INTERIOR_FINISH"] },
  { id: "finish.tile.v1", label: "Tile", names: ["Tile"], src: [B.P03], packs: [3], rooms: ["MASTER_BATH", "KITCHEN", "GENERAL"], phases: ["INTERIOR_FINISH"] },
  { id: "finish.baseboard.v1", label: "Baseboard", names: ["Baseboard"], src: [B.P03], packs: [3], rooms: G, phases: ["INTERIOR_FINISH"] },
  { id: "finish.crown_molding.v1", label: "Crown Molding", names: ["Crown Molding"], src: [B.P03], packs: [3], rooms: G, phases: ["INTERIOR_FINISH"] },
  { id: "finish.trim.casing.v1", label: "Trim / Casing", names: ["Trim / Casing", "Trim Casing"], src: [B.P03], packs: [3], rooms: G, phases: ["INTERIOR_FINISH"] },
  { id: "finish.siding.exterior.v1", label: "Exterior Siding", names: ["Exterior Siding", "Siding"], src: [B.P01, B.P03], packs: [1, 3], rooms: G, phases: ["EXTERIOR"] },
  { id: "finish.roofing.shingle.v1", label: "Roofing", names: ["Roofing", "Roofing (Shingle)"], src: [B.P03], packs: [3], rooms: G, phases: ["ROOF", "EXTERIOR"] },
  // ── ELECTRICAL ──
  { id: "electrical.panel.main.v1", label: "Electrical Panel", names: ["Electrical Panel", "Panel"], src: [B.L01, B.L05, B.P01, B.P04, B.S08], packs: [4], rooms: G, phases: ["ELECTRICAL"] },
  { id: "electrical.outlet.v1", label: "Outlet", names: ["Outlet", "Outlet (Duplex)", "Outlet + Switch", "Outlet + Switch Set"], src: [B.L01, B.L02, B.P01, B.S08], rooms: G, phases: ["ELECTRICAL"], notes: NO_18 },
  { id: "electrical.switch.v1", label: "Switch", names: ["Switch", "Dimmer (Switch)", "Outlet + Switch", "Outlet + Switch Set"], src: [B.L01, B.L02, B.P01, B.S08], rooms: G, phases: ["ELECTRICAL"], notes: NO_18 },
  { id: "electrical.battery.home.v1", label: "Home Battery", names: ["Home Battery", "Battery (Home)", "Home Battery Pack"], src: [B.P04, B.P08], packs: [4, 8], rooms: G, phases: ["ELECTRICAL"], notes: "Pack 8's Home Battery Pack is this battery (§19)." },
  { id: "electrical.inverter.v1", label: "Inverter", names: ["Inverter", "Backup Inverter", "Backup Inverter + Controller"], src: [B.P04, B.P08], packs: [4, 8], rooms: G, phases: ["ELECTRICAL"], notes: "Pack 8's Backup Inverter is this inverter (§19)." },
  { id: "electrical.inverter.solar.v1", label: "Solar Inverter", names: ["Solar Inverter"], src: [B.P04], packs: [4], rooms: G, phases: ["ELECTRICAL"] },
  { id: "electrical.generator.standby.v1", label: "Generator", names: ["Generator", "Generator (Standby)"], src: [B.P03, B.P04], packs: [3, 4], rooms: G, phases: ["ELECTRICAL", "SITE"] },
  { id: "electrical.ev_charger.v1", label: "EV Charger", names: ["EV Charger"], src: [B.P04], packs: [4], rooms: G, phases: ["ELECTRICAL", "SITE"] },
  // ── PLUMBING ──
  { id: "plumbing.water_heater.v1", label: "Water Heater", names: ["Water Heater"], src: [B.L01, B.L05, B.P01, B.P04, B.S08], packs: [4], rooms: ["STORAGE_LAUNDRY"], phases: ["PLUMBING"] },
  { id: "plumbing.water_softener.v1", label: "Water Softener", names: ["Water Softener"], src: [B.P04], packs: [4], rooms: ["STORAGE_LAUNDRY"], phases: ["PLUMBING"] },
  { id: "plumbing.sink.utility.v1", label: "Utility Sink", names: ["Utility Sink", "Laundry Sink", "Plumbing Manifold + Utility Sink", "Plumbing Manifold / Utility Sink"], src: [B.L01, B.L05, B.L06, B.L07, B.P01, B.P02, B.P04, B.R_LAU, B.S08], packs: [2, 4], rooms: ["STORAGE_LAUNDRY"], phases: WET },
  { id: "plumbing.faucet.v1", label: "Faucet", names: ["Faucet"], src: [B.L01], rooms: G, phases: ["PLUMBING"], notes: NO_18 },
  { id: "plumbing.pipe.v1", label: "Pipe", names: ["Pipe"], src: [B.L01], rooms: G, phases: ["PLUMBING"], notes: NO_18 },
  { id: "plumbing.valve.shutoff.v1", label: "Water Shutoff Valve", names: ["Water Shutoff Valve", "Shutoff Valve", "Valve"], src: [B.L01, B.P04, B.P10], packs: [4, 10], rooms: G, phases: ["PLUMBING"], notes: "One valve: the overview's Valve, Pack 4's Water Shutoff Valve and Pack 10's Shutoff Valve." },
  { id: "plumbing.p_trap.v1", label: "P-Trap", names: ["P-Trap"], src: [B.L01], rooms: G, phases: ["PLUMBING"], notes: NO_18 },
  { id: "plumbing.manifold.v1", label: "Valve Manifold", names: ["Valve Manifold", "Shutoff Valve Manifold", "Plumbing Manifold + Utility Sink", "Plumbing Manifold / Utility Sink"], src: [B.P01, B.P10, B.S08], packs: [10], rooms: ["STORAGE_LAUNDRY"], phases: ["PLUMBING"] },
  { id: "operations.shutoff_valve.v1", label: "Shutoff Valve", names: ["Shutoff Valve"], src: [B.P10], packs: [10], rooms: G, phases: ["PLUMBING"], dup: "plumbing.valve.shutoff.v1" },
  // ── HVAC ──
  { id: "hvac.air_handler.v1", label: "Air Handler", names: ["Air Handler", "Air Handler (HVAC)", "Air Handler Unit", "HVAC (Furnace)", "HVAC Air Handler / Furnace"], src: [B.L01, B.L05, B.P01, B.P04, B.S08], packs: [4], rooms: ["STORAGE_LAUNDRY"], phases: ["HVAC"] },
  { id: "hvac.condenser.v1", label: "AC Condenser", names: ["AC Condenser", "HVAC Condenser"], src: [B.P03, B.P04], packs: [3, 4], rooms: G, phases: ["HVAC", "EXTERIOR"] },
  { id: "hvac.register.v1", label: "Vent Register", names: ["Register", "Vent Register", "Vent Register + Return Grille"], src: [B.L01, B.P01, B.S08], rooms: G, phases: ["HVAC"], notes: NO_18 },
  { id: "hvac.return_grille.v1", label: "Return Grille", names: ["Return", "Return Grille", "Vent Register + Return Grille"], src: [B.L01, B.S08], rooms: G, phases: ["HVAC"], notes: NO_18 },
  { id: "hvac.duct.v1", label: "Duct", names: ["Duct"], src: [B.L01], rooms: G, phases: ["HVAC"], notes: NO_18 },
  { id: "hvac.air_purifier.v1", label: "Air Purifier", names: ["Air Purifier"], src: [B.P04], packs: [4], rooms: G, phases: ["HVAC"] },
  { id: "hvac.dehumidifier.v1", label: "Dehumidifier", names: ["Dehumidifier"], src: [B.P04], packs: [4], rooms: G, phases: ["HVAC"] },
  { id: "hvac.ceiling_fan.v1", label: "Ceiling Fan", names: ["Ceiling Fan (Optional)"], src: [B.L02], rooms: ["LIVING"], phases: EL_ID, notes: NO_18 },
  // ── LIGHTING ──
  { id: "lighting.ceiling.flush.v1", label: "Flush Ceiling Light", names: ["Flush Ceiling Light", "Flush", "Ceiling Light", "Ceiling Light (LED)", "Ceiling (Flush)", "Fixture"], src: [B.L01, B.L03, B.L05, B.L07, B.P03, B.R_ENT, B.S07], packs: [3], rooms: G, phases: EL_ID, notes: "The overview's Electrical · Fixture (a ceiling-fixture icon) is read as this light — low confidence, flagged." },
  { id: "lighting.recessed.v1", label: "Recessed Light", names: ["Recessed Light", "Recessed"], src: [B.L01, B.L02, B.P03], packs: [3], rooms: G, phases: EL_ID },
  { id: "lighting.pendant.v1", label: "Pendant", names: ["Pendant", "Pendant Light", "Pendant (Ring)", "Ceiling (Pendant)"], src: [B.L01, B.L02, B.L03, B.L07, B.P03, B.R_DIN], packs: [2, 3], rooms: ["DINING", "GENERAL"], phases: EL_ID },
  { id: "lighting.chandelier.v1", label: "Chandelier", names: ["Chandelier"], src: [B.L01, B.P03], packs: [3], rooms: ["DINING"], phases: EL_ID },
  { id: "lighting.sconce.wall.v1", label: "Wall Sconce", names: ["Wall Sconce"], src: [B.L03, B.P03, B.S07], packs: [3], rooms: G, phases: EL_ID },
  { id: "lighting.track.v1", label: "Track Light", names: ["Track Light"], src: [B.P03], packs: [3], rooms: G, phases: EL_ID },
  { id: "lighting.under_cabinet.v1", label: "Under-Cabinet Light", names: ["Under-Cabinet Light"], src: [B.P03], packs: [3], rooms: ["KITCHEN"], phases: EL_ID },
  { id: "lighting.linear.led.v1", label: "Linear Light", names: ["Linear", "Accent (LED)"], src: [B.L01, B.L03], rooms: G, phases: EL_ID, notes: `The Living Room Pack's Accent (LED) bar normalizes here. ${NO_18}` },
  { id: "lighting.lamp.floor.v1", label: "Floor Lamp", names: ["Floor Lamp"], src: [B.L01, B.L02, B.L03, B.L04, B.L06, B.L07, B.P02, B.R_LIV, B.S07], packs: [2, 3], rooms: ["LIVING", "MASTER_BEDROOM"], phases: ID, kind: "lamp" },
  { id: "lighting.lamp.table.v1", label: "Table Lamp", names: ["Table Lamp"], src: [B.L02, B.L03, B.P02], packs: [2, 3], rooms: ["MASTER_BEDROOM", "LIVING"], phases: ID },
  { id: "lighting.lamp.desk.v1", label: "Desk Lamp", names: ["Desk Lamp", "Deble Lamp"], src: [B.L01, B.P02], packs: [2], rooms: ["OFFICE"], phases: ID, notes: "The Pack 2 board prints the typo \"Deble Lamp\"." },
  // ── SECURITY ──
  { id: "security.camera.v1", label: "Security Camera", names: ["Security Camera", "Camera"], src: [B.L01, B.P03, B.S07], packs: [3], rooms: G, phases: ["SECURITY"] },
  { id: "security.doorbell.video.v1", label: "Video Doorbell", names: ["Video Doorbell", "Doorbell / Entry Sensor"], src: [B.P03, B.S07], packs: [3], rooms: ["ENTRY_PORCH"], phases: ["SECURITY"] },
  { id: "security.sensor.motion.v1", label: "Motion Sensor", names: ["Motion Sensor", "Motion Sensor (PIR)", "Sensor"], src: [B.L01, B.P03, B.S07], packs: [3], rooms: G, phases: ["SECURITY"] },
  { id: "security.lock.smart.v1", label: "Smart Lock", names: ["Smart Lock", "Entry Access Keypad / Smart Lock"], src: [B.P03, B.P05], packs: [3, 5], rooms: ["ENTRY_PORCH"], phases: ["SECURITY"] },
  { id: "security.keypad.entry.v1", label: "Entry Keypad", names: ["Entry Keypad", "Keypad", "Entry Access Keypad / Smart Lock"], src: [B.L01, B.P05], packs: [5], rooms: ["ENTRY_PORCH"], phases: ["SECURITY"] },
  { id: "security.detector.smoke_co.v1", label: "Smoke / CO Detector", names: ["Smoke / CO Detector", "Smoke Detector", "CO Detector"], src: [B.P03, B.P04], packs: [3, 4], rooms: G, phases: ["SECURITY", "ELECTRICAL"], notes: "The Pack 4 board draws Smoke and CO as two units; §18 names one combo — one asset today, split if the operator wants two." },
  { id: "security.leak_detector.v1", label: "Leak Detector", names: ["Leak Detector"], src: [B.P04], packs: [4], rooms: G, phases: ["SECURITY", "PLUMBING"] },
  { id: "security.coverage.zone.v1", label: "Coverage Zone", names: ["Coverage", "Coverage Zone"], src: [B.L01, B.S07], rooms: G, phases: ["SECURITY"], notes: `A coverage VISUALIZATION (brief §6), not a solid — a translucent cone/fan, no PLAN footprint. ${NO_18}` },
  // ── SMARTHOME ──
  { id: "smarthome.thermostat.v1", label: "Smart Thermostat", names: ["Smart Thermostat"], src: [B.P03, B.P05], packs: [5], rooms: G, phases: ["HVAC", "ELECTRICAL"] },
  { id: "smarthome.hub.v1", label: "Smart Hub", names: ["Smart Hub", "Smart Hub + Router", "Smart Hub (Home)"], src: [B.P03, B.P04, B.P05], packs: [5], rooms: G, phases: ["ELECTRICAL"] },
  { id: "smarthome.router.v1", label: "Router", names: ["Router", "Smart Hub + Router"], src: [B.P05], packs: [5], rooms: G, phases: ["ELECTRICAL"], notes: "The Pack 5 board draws one Smart Hub + Router box; the router has no silhouette of its own yet." },
  { id: "smarthome.switch.scene.v1", label: "Scene Switch", names: ["Scene Switch", "Scene Switch / Control Panel"], src: [B.P05], packs: [5], rooms: G, phases: ["ELECTRICAL"] },
  { id: "smarthome.control_panel.v1", label: "Control Panel", names: ["Control Panel", "Scene Switch / Control Panel", "Smart Control (Lighting · HVAC)"], src: [B.L02, B.P05], packs: [5], rooms: G, phases: ["ELECTRICAL"] },
  { id: "smarthome.shade.motorized.v1", label: "Motorized Shade", names: ["Motorized Shade", "Motorized Shade + Track"], src: [B.P05], packs: [5], rooms: G, phases: ID },
  { id: "smarthome.shade.track.v1", label: "Motorized Shade Track", names: ["Motorized Shade Track", "Motorized Shade + Track"], src: [B.P05], packs: [5], rooms: G, phases: ID },
  { id: "smarthome.lighting_controller.v1", label: "Automated Lighting Controller", names: ["Automated Lighting Controller"], src: [MASTER_18_SOURCE], packs: [5], rooms: G, phases: ["ELECTRICAL"], notes: ONLY_18 },
  { id: "smarthome.sensor.environmental.v1", label: "Environmental Sensor", names: ["Environmental Sensor"], src: [MASTER_18_SOURCE], packs: [5], rooms: G, phases: ["SECURITY", "HVAC"], notes: ONLY_18 },
  { id: "smarthome.sensor.occupancy.v1", label: "Occupancy Sensor", names: ["Occupancy Sensor"], src: [MASTER_18_SOURCE], packs: [5], rooms: G, phases: ["SECURITY", "ELECTRICAL"], notes: `${ONLY_18} May share the motion-sensor GLB.` },
  { id: "smarthome.air_quality_monitor.v1", label: "Air Quality Monitor", names: ["Air Quality Monitor"], src: [B.P04], packs: [4], rooms: G, phases: ["HVAC"] },
  { id: "smarthome.hub.home.v1", label: "Smart Hub (Home)", names: ["Smart Hub (Home)"], src: [B.P04], rooms: G, phases: ["ELECTRICAL"], dup: "smarthome.hub.v1" },
  // ── SITE ──
  { id: "site.driveway.pad.v1", label: "Driveway Pad", names: ["Driveway Pad"], src: [B.P06], packs: [6], rooms: G, phases: ["SITE"] },
  { id: "site.walkway.pavers.v1", label: "Walkway Pavers", names: ["Walkway Pavers"], src: [B.P06], packs: [6], rooms: G, phases: ["SITE"] },
  { id: "site.steps.front.v1", label: "Front Steps", names: ["Front Steps", "Front Steps + Landing"], src: [B.P06], packs: [6], rooms: ["ENTRY_PORCH"], phases: ["SITE", "EXTERIOR"] },
  { id: "site.landing.v1", label: "Landing", names: ["Landing", "Front Steps + Landing"], src: [B.P06], packs: [6], rooms: ["ENTRY_PORCH"], phases: ["SITE", "EXTERIOR"] },
  { id: "site.fence.panel.v1", label: "Fence", names: ["Fence", "Fence (Panel)", "Fence Section", "Fence + Gate Section"], src: [B.P03, B.P06], packs: [3, 6], rooms: G, phases: ["SITE"], notes: "Pack 6's Fence Section is this fence panel (§19)." },
  { id: "site.gate.v1", label: "Gate", names: ["Gate", "Fence + Gate Section"], src: [B.P06], packs: [6], rooms: G, phases: ["SITE"] },
  { id: "site.planter_bed.v1", label: "Planter Bed", names: ["Planter Bed", "Planter Bed + Tree"], src: [B.P06], packs: [6], rooms: G, phases: ["SITE"] },
  { id: "site.tree.v1", label: "Tree", names: ["Tree", "Planter Bed + Tree"], src: [B.P06], packs: [6], rooms: G, phases: ["SITE"] },
  { id: "site.shrub.v1", label: "Shrub / Plant", names: ["Shrub / Plant"], src: [B.P06], packs: [6], rooms: G, phases: ["SITE"], notes: "Outdoor planting (the Pack 6 planter shows the shrubs); the indoor potted plant is lifestyle.plant.potted.v1." },
  { id: "site.irrigation.head.v1", label: "Irrigation Head", names: ["Irrigation Head", "Irrigation System"], src: [B.P03], packs: [6], rooms: G, phases: ["SITE", "PLUMBING"] },
  { id: "site.path_light.v1", label: "Path Light", names: ["Path Light"], src: [B.P03], packs: [6], rooms: G, phases: ["SITE", "ELECTRICAL"] },
  { id: "site.landscape_light.v1", label: "Landscape Light", names: ["Landscape Light", "Landscape Light (Spot)"], src: [B.P03], packs: [6], rooms: G, phases: ["SITE", "ELECTRICAL"] },
  { id: "site.deck_porch.v1", label: "Deck / Porch", names: ["Deck / Porch", "Deck"], src: [B.P03], packs: [3, 6], rooms: ["ENTRY_PORCH"], phases: ["SITE", "EXTERIOR"], notes: "Pack 6's Deck is this deck (§19); the roofed porch is site.porch.covered.v1." },
  { id: "site.porch.covered.v1", label: "Porch (Covered)", names: ["Porch (Covered)"], src: [B.L01], rooms: ["ENTRY_PORCH"], phases: ["ROOF", "EXTERIOR", "SITE"], notes: `Roofed porch on posts — distinct from the open Deck / Porch. ${NO_18}` },
  { id: "site.patio.v1", label: "Patio", names: ["Patio"], src: [MASTER_18_SOURCE], packs: [6], rooms: G, phases: ["SITE"], notes: ONLY_18 },
  { id: "site.utility_pad.v1", label: "Exterior Utility Pad", names: ["Exterior Utility Pad"], src: [MASTER_18_SOURCE], packs: [6], rooms: G, phases: ["SITE"], notes: ONLY_18 },
  { id: "site.septic_system.v1", label: "Septic System", names: ["Septic System"], src: [B.P03], rooms: G, phases: ["SITE", "PLUMBING"], notes: NO_18 },
  { id: "site.water_well.v1", label: "Water Well System", names: ["Water Well System"], src: [B.P03], rooms: G, phases: ["SITE", "PLUMBING"], notes: NO_18 },
  { id: "site.fence_section.v1", label: "Fence Section", names: ["Fence Section"], src: [B.P06], packs: [6], rooms: G, phases: ["SITE"], dup: "site.fence.panel.v1" },
  { id: "site.deck.v1", label: "Deck", names: ["Deck"], src: [B.P06], packs: [6], rooms: ["ENTRY_PORCH"], phases: ["SITE", "EXTERIOR"], dup: "site.deck_porch.v1" },
  // ── ACCESSIBILITY (design support only — never implies compliance, §18) ──
  { id: "accessibility.ramp.entry.v1", label: "Entry Ramp", names: ["Entry Ramp"], src: [B.P07], packs: [7], rooms: ["ENTRY_PORCH"], phases: ["SITE", "EXTERIOR"] },
  { id: "accessibility.handrail.v1", label: "Handrail", names: ["Handrail"], src: [B.P07], packs: [7], rooms: G, phases: ["EXTERIOR", "INTERIOR_FINISH"], notes: "Drawn only as the rails of the Entry Ramp panel — no standalone silhouette yet." },
  { id: "accessibility.grab_bar.v1", label: "Grab Bar", names: ["Grab Bar", "Grab Bar Set"], src: [B.P07], packs: [7], rooms: ["MASTER_BATH"], phases: FIN_ID },
  { id: "accessibility.handle.lever.v1", label: "Lever Door Handle", names: ["Lever Door Handle", "Lever Handle Door Set"], src: [B.P07], packs: [7], rooms: G, phases: ["INTERIOR_FINISH"] },
  { id: "accessibility.shower.roll_in.v1", label: "Roll-In Shower", names: ["Roll-In Shower", "Roll-In Shower Bench"], src: [B.P07], packs: [7], rooms: ["MASTER_BATH"], phases: WET },
  { id: "accessibility.shower_bench.v1", label: "Shower Bench", names: ["Shower Bench", "Roll-In Shower Bench"], src: [B.P07], packs: [7], rooms: ["MASTER_BATH"], phases: ID },
  { id: "accessibility.toilet.v1", label: "Accessible Toilet", names: ["Accessible Toilet"], src: [B.P07], packs: [7], rooms: ["MASTER_BATH"], phases: WET },
  { id: "accessibility.vanity.v1", label: "Accessible Vanity", names: ["Accessible Vanity"], src: [MASTER_18_SOURCE], packs: [7], rooms: ["MASTER_BATH"], phases: WET, notes: ONLY_18 },
  { id: "accessibility.marker.clear_floor.v1", label: "Clear-Floor-Space Marker", names: ["Clear-Floor-Space Marker"], src: [MASTER_18_SOURCE], packs: [7], rooms: G, phases: ID, notes: `${ONLY_18} A floor OVERLAY (PLAN footprint only), not a solid.` },
  { id: "accessibility.threshold.v1", label: "Threshold Transition", names: ["Threshold Transition"], src: [MASTER_18_SOURCE], packs: [7], rooms: G, phases: ["INTERIOR_FINISH"], notes: ONLY_18 },
  // ── SUSTAINABILITY (no performance claims without an engine source, §18) ──
  { id: "sustainability.solar.array.v1", label: "Solar Panel Array", names: ["Solar Panel Array"], src: [B.P08], packs: [8], rooms: G, phases: ["ROOF", "ELECTRICAL"] },
  { id: "sustainability.controller.v1", label: "Controller", names: ["Controller", "Backup Inverter + Controller"], src: [B.P08], packs: [8], rooms: G, phases: ["ELECTRICAL"] },
  { id: "sustainability.cistern.rainwater.v1", label: "Rainwater Cistern", names: ["Rainwater Cistern"], src: [B.P08], packs: [8], rooms: G, phases: ["SITE", "PLUMBING"] },
  { id: "sustainability.shutter.storm.v1", label: "Storm Shutter", names: ["Storm Shutter", "Storm Shutter Window"], src: [B.P08], packs: [8], rooms: G, phases: ["EXTERIOR"] },
  { id: "sustainability.equipment.high_efficiency.v1", label: "High-Efficiency Equipment", names: ["High-Efficiency Equipment"], src: [MASTER_18_SOURCE], packs: [8], rooms: G, phases: ["OPERATIONS"], notes: `${ONLY_18} §18 names a CLASS, not an object — cannot be modelled as one GLB; flagged.` },
  { id: "sustainability.power_interface.backup.v1", label: "Backup Power Interface", names: ["Backup Power Interface"], src: [MASTER_18_SOURCE], packs: [8], rooms: G, phases: ["ELECTRICAL"], notes: ONLY_18 },
  { id: "sustainability.water_capture.v1", label: "Water Capture Components", names: ["Water Capture Components"], src: [B.P08], packs: [8], rooms: G, phases: ["SITE", "PLUMBING"], notes: "Only the cistern's roof downpipe is drawn (Pack 8 board); §18 names a class of parts, not one object — flagged." },
  { id: "sustainability.equipment.resilience.v1", label: "Resilience Equipment", names: ["Resilience Equipment"], src: [MASTER_18_SOURCE], packs: [8], rooms: G, phases: ["OPERATIONS"], notes: `${ONLY_18} §18 names a CLASS, not an object — flagged.` },
  { id: "sustainability.home_battery_pack.v1", label: "Home Battery Pack", names: ["Home Battery Pack"], src: [B.P08], packs: [8], rooms: G, phases: ["ELECTRICAL"], dup: "electrical.battery.home.v1" },
  { id: "sustainability.backup_inverter.v1", label: "Backup Inverter", names: ["Backup Inverter", "Backup Inverter + Controller"], src: [B.P08], packs: [8], rooms: G, phases: ["ELECTRICAL"], dup: "electrical.inverter.v1" },
  // ── LIFESTYLE (illustrative, noncanonical) ──
  { id: "lifestyle.rug.area.v1", label: "Area Rug", names: ["Area Rug", "Rug"], src: [B.L01, B.L02, B.L03, B.L07, B.P09, B.R_LIV], packs: [9], rooms: ["LIVING", "DINING", "MASTER_BEDROOM", "ENTRY_PORCH"], phases: ID, kind: "rug" },
  { id: "lifestyle.tv.v1", label: "TV", names: ["TV", "TV (Wall)", "TV (Stand)", "Media Console + TV", "Entertainment Console + TV"], src: [B.L03, B.L04, B.P09], packs: [9], rooms: ["LIVING", "MASTER_BEDROOM", "OFFICE"], phases: ID, kind: "tv", notes: "Wall or stand mount is placement, not a second asset." },
  { id: "lifestyle.soundbar.v1", label: "Soundbar", names: ["Soundbar"], src: [B.L03], rooms: ["LIVING"], phases: ID, notes: NO_18 },
  { id: "lifestyle.decor.object.v1", label: "Décor Object", names: ["Décor Object", "Décor", "Decor", "Bookshelf + Decor"], src: [B.P09], packs: [9], rooms: G, phases: ID, notes: "The small objects on the Pack 9 bookshelf (boxes, orb, diffuser); one generic décor asset until a board names more." },
  { id: "lifestyle.wall_art.v1", label: "Wall Art", names: ["Wall Art", "Wall Art (Set)", "Wall Art Set"], src: [B.L02, B.P09], packs: [9], rooms: G, phases: ID },
  { id: "lifestyle.plant.potted.v1", label: "Plant (Potted)", names: ["Plant", "Plants", "Plant (Potted)"], src: [B.L01, B.L02, B.L03, B.L06, B.P09], packs: [9], rooms: G, phases: ID, notes: "One indoor plant for Entry / Dining / Office / Living; outdoor planting is site.shrub.v1." },
  { id: "lifestyle.lighting.decorative.v1", label: "Decorative Lighting", names: ["Decorative Lighting"], src: [MASTER_18_SOURCE], packs: [9], rooms: G, phases: ID, notes: `${ONLY_18} Only the small glow cylinder on the Pack 9 console hints at it — flagged.` },
  { id: "lifestyle.curtains_blinds.v1", label: "Curtains / Blinds", names: ["Curtains / Blinds"], src: [B.L02], rooms: G, phases: ID, notes: `Manual window treatment; the motorized shade is smarthome.shade.motorized.v1. ${NO_18}` },
  { id: "lifestyle.doormat.v1", label: "Doormat", names: ["Doormat"], src: [B.L07, B.R_ENT], rooms: ["ENTRY_PORCH"], phases: ID, notes: `${NO_18} §18 has no Entry · Porch section.` },
  { id: "lifestyle.accent_chair.v1", label: "Accent Chair", names: ["Accent Chair", "Accent Chair + Side Table"], src: [B.P09], packs: [9], rooms: ["LIVING"], phases: ID, dup: "furniture.lounge_chair.v1" },
  { id: "lifestyle.entertainment_console.v1", label: "Entertainment Console", names: ["Entertainment Console", "Entertainment Console + TV"], src: [B.P09], packs: [9], rooms: ["LIVING"], phases: ID, dup: "furniture.media_console.v1" },
  { id: "lifestyle.bookshelf.v1", label: "Bookshelf", names: ["Bookshelf", "Bookshelf + Decor"], src: [B.P09], packs: [9], rooms: ["LIVING"], phases: ID, dup: "furniture.bookcase.v1" },
  // ── OPERATIONS ──
  { id: "operations.tool_cart.v1", label: "Tool Cart", names: ["Tool Cart", "Tool Cart + Kit"], src: [B.P10], packs: [10], rooms: ["STORAGE_LAUNDRY"], phases: ["OPERATIONS"] },
  { id: "operations.tool_kit.v1", label: "Tool Kit", names: ["Tool Kit", "Tool Cart + Kit"], src: [B.P10], packs: [10], rooms: ["STORAGE_LAUNDRY"], phases: ["OPERATIONS"] },
  { id: "operations.ladder.access.v1", label: "Access Ladder", names: ["Access Ladder"], src: [B.P10], packs: [10], rooms: ["STORAGE_LAUNDRY"], phases: ["OPERATIONS"] },
  { id: "operations.access_panel.service.v1", label: "Service Access Panel", names: ["Service Access Panel"], src: [B.P10], packs: [10], rooms: G, phases: ["OPERATIONS"] },
  { id: "operations.filter.hvac.v1", label: "HVAC Filter", names: ["HVAC Filter", "Filter Set"], src: [B.P10], packs: [10], rooms: ["STORAGE_LAUNDRY"], phases: ["OPERATIONS", "HVAC"] },
  { id: "operations.filter.water.v1", label: "Water Filter", names: ["Water Filter", "Filter Set"], src: [B.P10], packs: [10], rooms: ["STORAGE_LAUNDRY"], phases: ["OPERATIONS", "PLUMBING"] },
  { id: "operations.filter.set.v1", label: "Replacement Filter Set", names: ["Replacement Filter Set", "Filter Set"], src: [B.P10], packs: [10], rooms: ["STORAGE_LAUNDRY"], phases: ["OPERATIONS"], notes: "The Pack 10 Filter Set panel = HVAC filter + round + cartridge water filter as one set." },
  { id: "operations.inspection_point.v1", label: "Inspection Point", names: ["Inspection Point"], src: [MASTER_18_SOURCE], packs: [10], rooms: G, phases: ["OPERATIONS"], notes: `${ONLY_18} A marker, not a solid.` },
  { id: "operations.service_marker.v1", label: "Service Marker", names: ["Service Marker"], src: [MASTER_18_SOURCE], packs: [10], rooms: G, phases: ["OPERATIONS"], notes: `${ONLY_18} A marker, not a solid.` },
  { id: "operations.access_element.v1", label: "Maintenance Access Element", names: ["Maintenance Access Element"], src: [MASTER_18_SOURCE], packs: [10], rooms: G, phases: ["OPERATIONS"], notes: `${ONLY_18} §18 names a class, not an object — flagged.` },
];

// ── build: derive the statuses from the three facts, never per row ─────────────────────────────────────────────────
function statusOf(r: RowIn): { glb: FileStatus; plan: FileStatus; metadata: FileStatus; visualQa: VisualQa; note: string } {
  if (Object.hasOwn(STARTER_MODELS, r.id)) {
    const rebuild = Object.hasOwn(NEEDS_REBUILD, r.id) ? NEEDS_REBUILD[r.id] : "";
    return { glb: rebuild ? "NEEDS_REBUILD" : "READY", plan: "READY", metadata: "READY", visualQa: rebuild ? "FAIL" : "PENDING",
      note: rebuild ? `Starter GLB ${STARTER_MODELS[r.id]} — ${rebuild}; rebuild preserving the semantic contract (§21).` : `Starter GLB ${STARTER_MODELS[r.id]} (§20) — ready to load; §31 visual QA pending.` };
  }
  if (r.kind) return { glb: "PLACEHOLDER", plan: "PLACEHOLDER", metadata: "PLACEHOLDER", visualQa: "PENDING", note: `Legacy kind "${r.kind}" draws a parametric box in the walk today (room-objects); native GLB + PLAN SVG + metadata still to build.` };
  return { glb: "MISSING", plan: "MISSING", metadata: "MISSING", visualQa: "PENDING", note: "No native model, PLAN symbol or metadata yet." };
}
const uniq = <T,>(xs: T[]): T[] => Array.from(new Set(xs));
function build(): InventoryRow[] {
  const byId = new Map(ROWS.map((r) => [r.id, r]));
  return ROWS.map((r) => {
    const target = r.dup ? byId.get(r.dup) : undefined;
    const s = statusOf(target ?? r);
    const notes = r.dup
      ? `DUPLICATE_NORMALIZED → ${r.dup}${r.notes ? ` · ${r.notes}` : ""}`
      : [s.note, r.notes].filter(Boolean).join(" ");
    return {
      id: r.id, label: r.label, referenceNames: uniq(r.names), sources: uniq(r.src), packs: uniq(r.packs ?? []).sort((a, b) => a - b),
      rooms: uniq(r.rooms), phases: uniq(r.phases), ...(r.kind ? { legacyKind: r.kind } : {}),
      glb: s.glb, plan: s.plan, metadata: s.metadata, visualQa: s.visualQa, notes, ...(r.dup ? { duplicateOf: r.dup } : {}),
    };
  });
}
/** THE inventory — every row, authored order (the generator sorts by domain then id). */
export const ASSET_INVENTORY: InventoryRow[] = build();

// ── lookups ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const INDEX = new Map(ASSET_INVENTORY.map((r) => [r.id, r]));
export function inventoryById(id: string): InventoryRow | undefined { return INDEX.get(id); }
/** Distinct assets — the rows that are not a normalized duplicate. */
export function canonicalRows(rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] { return rows.filter((r) => !r.duplicateOf); }
/** The DUPLICATE_NORMALIZED rows. */
export function duplicateRows(rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] { return rows.filter((r) => !!r.duplicateOf); }
/** Rows sorted for the ledger: domain (ASSET_DOMAINS order) then id. */
export function sortedRows(rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] {
  const rank = (id: string) => ASSET_DOMAINS.indexOf(domainOf(id));
  return [...rows].sort((a, b) => rank(a.id) - rank(b.id) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
/** Normalize a printed name for matching: case- and punctuation-insensitive. */
export function normalizeName(s: string): string { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
/** Every row whose referenceNames carry this printed name. */
export function rowsByReferenceName(name: string, rows: InventoryRow[] = ASSET_INVENTORY): InventoryRow[] {
  const n = normalizeName(name);
  return rows.filter((r) => r.referenceNames.some((x) => normalizeName(x) === n));
}

export interface InventorySummary {
  total: number; distinct: number; duplicates: number;
  byGlb: Record<FileStatus, number>; byPlan: Record<FileStatus, number>; byMetadata: Record<FileStatus, number>; byVisualQa: Record<VisualQa, number>;
  byPack: Record<number, { distinct: number; missing: number; ready: number; placeholder: number; needsRebuild: number }>;
  noPack: number; byRoom: Record<RoomId, number>; byDomain: Record<AssetDomain, number>;
  legacyPlaceholders: number; starterReady: number; starterNeedsRebuild: number; onlyIn18: number;
}
/** Counts over the DISTINCT rows (duplicates are counted once, as their target). */
export function inventorySummary(rows: InventoryRow[] = ASSET_INVENTORY): InventorySummary {
  const dist = canonicalRows(rows);
  const zeroF = () => Object.fromEntries(FILE_STATUSES.map((s) => [s, 0])) as Record<FileStatus, number>;
  const byGlb = zeroF(), byPlan = zeroF(), byMetadata = zeroF();
  const byVisualQa = Object.fromEntries(VISUAL_QA.map((s) => [s, 0])) as Record<VisualQa, number>;
  const byPack: InventorySummary["byPack"] = Object.fromEntries(PACK_NUMBERS.map((p) => [p, { distinct: 0, missing: 0, ready: 0, placeholder: 0, needsRebuild: 0 }]));
  const byRoom = Object.fromEntries(ROOM_IDS.map((r) => [r, 0])) as Record<RoomId, number>;
  const byDomain = Object.fromEntries(ASSET_DOMAINS.map((d) => [d, 0])) as Record<AssetDomain, number>;
  let noPack = 0, legacyPlaceholders = 0, starterReady = 0, starterNeedsRebuild = 0, onlyIn18 = 0;
  for (const r of dist) {
    byGlb[r.glb]++; byPlan[r.plan]++; byMetadata[r.metadata]++; byVisualQa[r.visualQa]++; byDomain[domainOf(r.id)]++;
    for (const room of r.rooms) byRoom[room]++;
    if (r.packs.length === 0) noPack++;
    for (const p of r.packs) {
      const b = byPack[p]; b.distinct++;
      if (r.glb === "MISSING") b.missing++; else if (r.glb === "READY") b.ready++; else if (r.glb === "PLACEHOLDER") b.placeholder++; else b.needsRebuild++;
    }
    if (r.glb === "PLACEHOLDER") legacyPlaceholders++;
    if (Object.hasOwn(STARTER_MODELS, r.id)) { if (r.glb === "READY") starterReady++; else starterNeedsRebuild++; }
    if (r.sources.length === 1 && r.sources[0] === MASTER_18_SOURCE) onlyIn18++;
  }
  return { total: rows.length, distinct: dist.length, duplicates: rows.length - dist.length, byGlb, byPlan, byMetadata, byVisualQa, byPack, noPack, byRoom, byDomain, legacyPlaceholders, starterReady, starterNeedsRebuild, onlyIn18 };
}
/** The distinct rows whose GLB is MISSING, grouped by pack (a row in two packs is listed under both; — for no pack). */
export function missingByPack(rows: InventoryRow[] = ASSET_INVENTORY): Record<string, InventoryRow[]> {
  const out: Record<string, InventoryRow[]> = {};
  for (const r of sortedRows(canonicalRows(rows))) {
    if (r.glb !== "MISSING") continue;
    const keys = r.packs.length ? r.packs.map(String) : ["—"];
    for (const k of keys) (out[k] ??= []).push(r);
  }
  return out;
}
