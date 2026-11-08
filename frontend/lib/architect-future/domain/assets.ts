// ARCHITECT-2525 / FUTURE · domain/assets — a placed asset is a semantic identity + a transform (plan §17, FCRS-14/15).
// Store the asset id and transform, NEVER a copy of the mesh. position_um (not x_um/y_um). Plan, 3D and Walk all read this.

export const PLACED_ASSET_AUTHORITY = ["ILLUSTRATIVE", "USER_SELECTED"] as const;
export type PlacedAssetAuthority = (typeof PLACED_ASSET_AUTHORITY)[number];

export interface Vec3Um {
  x: number;
  y: number;
  z: number;
}

export interface PlacedAsset {
  instance_id: string;         // unique per placement; never length-based (survives removals)
  asset_id: string;            // semantic library id (e.g. "furniture.sofa.3seat.v1")
  space_id: string;
  position_um: Vec3Um;
  rotation_deg: number;        // carried in the payload, not a fixed +90 step
  authority: PlacedAssetAuthority;
}
