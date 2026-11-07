/**
 * ARCHITECT-2525 · PHASE PROJECTION (Rev A, brief §6) — ONE shared PhaseProjection decides visibility.
 * =================================================================================================
 * "Do not implement independent hardcoded visibility rules inside every React component." The one truth is
 * architect-phases' phaseDraw/showGroupInPhase (what a phase DRAWS, keyed by the palette group of a kind); this module
 * is the asset-id front door to it — visibleInPhase(assetId | kind, phaseId) — so the plan, the designer 3D, the walk and
 * the voxel can share it. Today the renderers decide for themselves (the next slice rewires them to THIS):
 *  · room-designer.tsx showInPhase (:84) — showGroupInPhase(groupOf(o.kind), phase) per object;
 *  · architect-walkthrough.tsx inPhase (:215) — the same call, applied to this room's and the neighbours' objects;
 *  · voxel-house.tsx — no per-kind rule: a single showFurniture boolean from the Design surface drops the whole layer.
 * ASSET_PARAMS[kind].phases is the authored carrier of the same truth (gated EQUAL to this projection).
 * Pure, no React.
 */
import { DEV_PHASES, showGroupInPhase } from "@/lib/architect-phases";
import { ASSET_PARAMS, OBJECT_KINDS, groupOf, kindByAssetId, type ObjectKind } from "@/lib/room-objects";

/** A kind by its own name or by its STABLE asset id; undefined for anything else (own keys only — WireGuard). */
export function resolveKind(assetIdOrKind: string): ObjectKind | undefined {
  if (Object.hasOwn(ASSET_PARAMS, assetIdOrKind)) return assetIdOrKind as ObjectKind;
  return kindByAssetId(assetIdOrKind);
}

/** THE PhaseProjection: is this asset drawn in this phase? No phase (null) = the full design view = everything.
 *  An unknown asset is never visible. */
export function visibleInPhase(assetIdOrKind: string, phaseId: string | null | undefined): boolean {
  const kind = resolveKind(assetIdOrKind);
  if (!kind) return false;
  return showGroupInPhase(groupOf(kind), phaseId);
}

/** The phase ids (build order) in which a kind is visible — derived from the projection, so it can never drift from it. */
export function phasesFor(assetIdOrKind: string): string[] {
  return DEV_PHASES.filter((p) => visibleInPhase(assetIdOrKind, p.id)).map((p) => p.id);
}

/** The kinds visible in a phase — OBJECT_KINDS order, deterministic. */
export function assetsForPhase(phaseId: string | null | undefined): ObjectKind[] {
  return OBJECT_KINDS.filter((k) => visibleInPhase(k, phaseId));
}

/** His phase taxonomy (intake master §14) ← our 12 DEV_PHASES. Three folds, stated: sewer → PLUMBING (one wet trade in
 *  his list), internet → ELECTRICAL (low-voltage rides the electrical rough-in), insulation → FRAMING (it is drawn in the
 *  framed walls); every other phase maps 1:1. His EXTERIOR / SITE / OPERATIONS have no DEV_PHASE yet (Packs 3, 6, 10). */
export type PhaseName = "FOUNDATION" | "FRAMING" | "ROOF" | "PLUMBING" | "ELECTRICAL" | "HVAC" | "SECURITY" | "INTERIOR_FINISH" | "INTERIOR_DESIGN" | "EXTERIOR" | "SITE" | "OPERATIONS";
export const PHASE_NAMES: readonly PhaseName[] = ["FOUNDATION", "FRAMING", "ROOF", "PLUMBING", "ELECTRICAL", "HVAC", "SECURITY", "INTERIOR_FINISH", "INTERIOR_DESIGN", "EXTERIOR", "SITE", "OPERATIONS"];
export const PHASE_NAME_BY_ID: Record<string, PhaseName> = {
  foundation: "FOUNDATION", framing: "FRAMING", roofing: "ROOF", plumbing: "PLUMBING", sewer: "PLUMBING", electrical: "ELECTRICAL",
  hvac: "HVAC", internet: "ELECTRICAL", security: "SECURITY", insulation: "FRAMING", finish: "INTERIOR_FINISH", interior: "INTERIOR_DESIGN",
};
/** A kind's phases in his vocabulary (his metadata `phaseCompatibility`), de-duplicated, build order. */
export function phaseNamesFor(assetIdOrKind: string): PhaseName[] {
  const out: PhaseName[] = [];
  for (const id of phasesFor(assetIdOrKind)) { const n = PHASE_NAME_BY_ID[id]; if (n && !out.includes(n)) out.push(n); }
  return out;
}

/** The projection as one object, for consumers that take a projection rather than a function. */
export const PHASE_PROJECTION = { visibleInPhase, phasesFor, assetsForPhase } as const;
