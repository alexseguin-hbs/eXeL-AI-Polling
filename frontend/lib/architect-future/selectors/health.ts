// ARCHITECT-2525 / FUTURE · selectors/health — Project Health derived from canonical state (plan §21, FCRS-34).
// It reports problems; it never holds competing truth. STUB (Phase 0); Phase 4 implements.
import type { ArchitectProjectV2 } from "../domain/project";
import { notImplemented } from "../_notimpl";

export const HEALTH_CATEGORIES = [
  "TRUTH", "GEOMETRY", "ASSETS", "SYSTEMS", "AUTHORITY", "ECONOMICS", "SIMULATION", "REPLAY", "PERFORMANCE", "MOBILE",
] as const;
export type HealthCategory = (typeof HEALTH_CATEGORIES)[number];

export interface HealthFinding {
  category: HealthCategory;
  ok: boolean;
  detail: string;
  /** points back to the canonical source (an entity id / field), never a separate truth. */
  source: string;
}

export function projectHealth(_project: ArchitectProjectV2): HealthFinding[] {
  return notImplemented("projectHealth", 4);
}
