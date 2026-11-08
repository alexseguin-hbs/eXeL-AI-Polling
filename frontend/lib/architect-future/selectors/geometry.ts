// ARCHITECT-2525 / FUTURE · selectors/geometry — Plan / 3D / Walk all project the SAME semantic state (plan §17, FCRS-15).
// A placed asset resolves to one instance with identical identity + transform in every projection. STUB (Phase 0).
import type { ArchitectProjectV2 } from "../domain/project";
import type { PlacedAsset } from "../domain/assets";
import { notImplemented } from "../_notimpl";

export interface Projection {
  view: "PLAN" | "3D" | "WALK";
  assets: PlacedAsset[];   // same instances, same transforms, across views
}

export function planProjection(_project: ArchitectProjectV2): Projection {
  return notImplemented("planProjection", 2);
}
export function threeDProjection(_project: ArchitectProjectV2): Projection {
  return notImplemented("threeDProjection", 2);
}
export function walkProjection(_project: ArchitectProjectV2): Projection {
  return notImplemented("walkProjection", 2);
}
