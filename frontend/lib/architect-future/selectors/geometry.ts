// ARCHITECT-2525 / FUTURE · selectors/geometry — Plan / 3D / Walk project the SAME semantic state (plan §17, FCRS-15).
// Each returns the same rooms and placed instances (identical identity + transform), in feet for rendering; only the
// `view` tag differs, so the three views can never disagree.
import type { ArchitectProjectV2 } from "../domain/project";
import { ftFromUm } from "../domain/geometry";
import { assetById } from "../domain/asset-catalog";

export interface RoomRect {
  space_id: string;
  bay_code: string;
  function: string;
  outer_x_ft: number; outer_y_ft: number; outer_w_ft: number; outer_d_ft: number;
  clear_x_ft: number; clear_y_ft: number; clear_w_ft: number; clear_d_ft: number;
}
export interface AssetRect {
  instance_id: string;
  asset_id: string;
  label: string;
  space_id: string;
  cx_ft: number; cy_ft: number;   // centre, world feet
  w_ft: number; d_ft: number;     // footprint after rotation
  rotation_deg: number;
  mounting: string;
}
export interface Projection {
  view: "PLAN" | "3D" | "WALK";
  shell_ft: number;
  rooms: RoomRect[];
  assets: AssetRect[];
}

function build(project: ArchitectProjectV2, view: Projection["view"]): Projection {
  const rooms: RoomRect[] = project.spaces.map((s) => ({
    space_id: s.entity_id, bay_code: s.bay_code, function: s.function,
    outer_x_ft: ftFromUm(s.outer_x_um), outer_y_ft: ftFromUm(s.outer_y_um),
    outer_w_ft: ftFromUm(s.outer_width_um), outer_d_ft: ftFromUm(s.outer_depth_um),
    clear_x_ft: ftFromUm(s.outer_x_um + s.wall_zone_thickness_um), clear_y_ft: ftFromUm(s.outer_y_um + s.wall_zone_thickness_um),
    clear_w_ft: ftFromUm(s.clear_width_um), clear_d_ft: ftFromUm(s.clear_depth_um),
  }));
  const assets: AssetRect[] = project.assets.map((a) => {
    const def = assetById(a.asset_id);
    const swap = a.rotation_deg === 90 || a.rotation_deg === 270;
    const w = def ? ftFromUm(swap ? def.depth_um : def.width_um) : 1;
    const d = def ? ftFromUm(swap ? def.width_um : def.depth_um) : 1;
    return {
      instance_id: a.instance_id, asset_id: a.asset_id, label: def ? def.label : a.asset_id,
      space_id: a.space_id, cx_ft: ftFromUm(a.position_um.x), cy_ft: ftFromUm(a.position_um.y),
      w_ft: w, d_ft: d, rotation_deg: a.rotation_deg, mounting: def ? def.mounting : "FLOOR",
    };
  });
  const shell_ft = rooms.reduce((m, r) => Math.max(m, r.outer_x_ft + r.outer_w_ft, r.outer_y_ft + r.outer_d_ft), 0);
  return { view, shell_ft, rooms, assets };
}

export function planProjection(project: ArchitectProjectV2): Projection { return build(project, "PLAN"); }
export function threeDProjection(project: ArchitectProjectV2): Projection { return build(project, "3D"); }
export function walkProjection(project: ArchitectProjectV2): Projection { return build(project, "WALK"); }
