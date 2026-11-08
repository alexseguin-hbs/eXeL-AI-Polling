// ARCHITECT-2525 / FUTURE · domain/asset-catalog — a representative, construction-ordered set of placeable assets for
// the Vision Tree (plan §15). Each is a semantic id + footprint + mounting; the full 139-library ingest is a later
// refinement that reuses this shape. Dimensions in µm. (Vision Tree groups are construction-ordered per plan §15.)
import { UM_PER_FT } from "./geometry";

export const VISION_GROUPS = [
  "Site", "Foundation", "Structure", "Envelope", "Openings", "Systems", "Fixtures", "Furniture", "Exterior",
] as const;
export type VisionGroup = (typeof VISION_GROUPS)[number];

export const ASSET_MOUNTINGS = ["FLOOR", "WALL"] as const;
export type AssetMounting = (typeof ASSET_MOUNTINGS)[number];

export interface CatalogAsset {
  asset_id: string;
  label: string;
  group: VisionGroup;
  /** nominal footprint in µm (width = along X, depth = along Y at rotation 0). */
  width_um: number;
  depth_um: number;
  mounting: AssetMounting;
  /** rooms this asset typically belongs to (SpaceFunction), or empty for general. */
  rooms: string[];
}

const ft = (n: number) => Math.round(n * UM_PER_FT);

export const ASSET_CATALOG: CatalogAsset[] = [
  // Furniture
  { asset_id: "furniture.sofa.3seat.v1", label: "Sofa (3-seat)", group: "Furniture", width_um: ft(7), depth_um: ft(3), mounting: "FLOOR", rooms: ["LIVING"] },
  { asset_id: "furniture.armchair.v1", label: "Armchair", group: "Furniture", width_um: ft(2.8), depth_um: ft(2.8), mounting: "FLOOR", rooms: ["LIVING"] },
  { asset_id: "furniture.coffee_table.v1", label: "Coffee table", group: "Furniture", width_um: ft(3.5), depth_um: ft(1.8), mounting: "FLOOR", rooms: ["LIVING"] },
  { asset_id: "furniture.dining_table.v1", label: "Dining table", group: "Furniture", width_um: ft(6), depth_um: ft(3.5), mounting: "FLOOR", rooms: ["DINING"] },
  { asset_id: "furniture.dining_chair.v1", label: "Dining chair", group: "Furniture", width_um: ft(1.6), depth_um: ft(1.6), mounting: "FLOOR", rooms: ["DINING"] },
  { asset_id: "furniture.bed.queen.v1", label: "Bed (queen)", group: "Furniture", width_um: ft(5), depth_um: ft(6.7), mounting: "FLOOR", rooms: ["BEDROOM"] },
  { asset_id: "furniture.nightstand.v1", label: "Nightstand", group: "Furniture", width_um: ft(1.5), depth_um: ft(1.5), mounting: "FLOOR", rooms: ["BEDROOM"] },
  { asset_id: "furniture.dresser.v1", label: "Dresser", group: "Furniture", width_um: ft(3), depth_um: ft(1.7), mounting: "WALL", rooms: ["BEDROOM", "CLOSET"] },
  { asset_id: "furniture.desk.v1", label: "Desk", group: "Furniture", width_um: ft(4), depth_um: ft(2), mounting: "WALL", rooms: ["OFFICE"] },
  { asset_id: "furniture.office_chair.v1", label: "Office chair", group: "Furniture", width_um: ft(2), depth_um: ft(2), mounting: "FLOOR", rooms: ["OFFICE"] },
  { asset_id: "furniture.bookcase.v1", label: "Bookcase", group: "Furniture", width_um: ft(3), depth_um: ft(1), mounting: "WALL", rooms: ["OFFICE", "LIVING"] },
  // Fixtures
  { asset_id: "kitchen.base_run.v1", label: "Base cabinets", group: "Fixtures", width_um: ft(8), depth_um: ft(2), mounting: "WALL", rooms: ["KITCHEN"] },
  { asset_id: "appliance.refrigerator.v1", label: "Refrigerator", group: "Fixtures", width_um: ft(3), depth_um: ft(2.7), mounting: "WALL", rooms: ["KITCHEN"] },
  { asset_id: "bath.toilet.v1", label: "Toilet", group: "Fixtures", width_um: ft(2), depth_um: ft(2), mounting: "WALL", rooms: ["BATH"] },
  { asset_id: "bath.vanity_sink.v1", label: "Vanity sink", group: "Fixtures", width_um: ft(2.5), depth_um: ft(1.8), mounting: "WALL", rooms: ["BATH"] },
  { asset_id: "bath.shower.v1", label: "Shower", group: "Fixtures", width_um: ft(3), depth_um: ft(3), mounting: "WALL", rooms: ["BATH"] },
  { asset_id: "appliance.washer.v1", label: "Washer", group: "Fixtures", width_um: ft(2.3), depth_um: ft(2.3), mounting: "WALL", rooms: ["UTILITY"] },
];

export function assetById(id: string): CatalogAsset | undefined {
  return ASSET_CATALOG.find((a) => a.asset_id === id);
}

/** Assets appropriate to a room function, plus general (empty rooms[]) ones. */
export function assetsForRoom(fn: string): CatalogAsset[] {
  return ASSET_CATALOG.filter((a) => a.rooms.length === 0 || a.rooms.includes(fn));
}
