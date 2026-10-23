// SPECS / ARCHITECT-2525 §07 / §XV / §06 / §XIV / §XVI — the edge engine + the HI-ACCEPT commit path.
// Interior edge: the change propagates to the immediate neighbor sharing it; net area conserved. Exterior
// edge: no neighbor invented; net program area may change. Minimum dimension 1,000,000 µm — a resize that
// would take EITHER the neighbor OR the edited space's own edge below it (or ≤ 0) is BLOCKED (Enki): no
// ACCEPT, no mutation, no revision, project hash unchanged. Only ACCEPT commits (one R-CORE event group);
// HOLD keeps the preview, REJECT clears it, and BOTH write nothing (§06). A separate file from runtime.ts
// (the constructor) so Block A (construct) and Block B (edit) never collide.
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-rcore.test.mjs

import { assertSafeInt, MIN_DIMENSION_UM } from "./units";
import { commitRevision, nextRevision } from "./rcore";
import type { RCore } from "./rcore";
import type { ArchitectProject, SpaceEntity, AiPreviewState } from "./types";

export type Edge = "NORTH" | "EAST" | "SOUTH" | "WEST";
export interface EdgeEditRequest { bay_code: string; edge: Edge; deltaUm: number; }

interface EntityPatch { entity_id: string; x_um?: number; y_um?: number; width_um?: number; depth_um?: number; }
export interface EdgeProposal { edge: Edge; interior: boolean; patches: EntityPatch[]; }
export type ProposeResult = { ok: true; preview: AiPreviewState } | { ok: false; reason: string };

const spaces = (p: ArchitectProject) => p.entities.filter((e): e is SpaceEntity => e.entity_type === "SPACE");
const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

/** Find the immediate neighbor sharing the named edge of S (null = exterior), for the V1 rectangular grid. */
function neighborOn(p: ArchitectProject, s: SpaceEntity, edge: Edge): SpaceEntity | null {
  const sx0 = s.x_um, sx1 = s.x_um + s.width_um, sy0 = s.y_um, sy1 = s.y_um + s.depth_um;
  const hits = spaces(p).filter((n) => {
    if (n.entity_id === s.entity_id) return false;
    const nx0 = n.x_um, nx1 = n.x_um + n.width_um, ny0 = n.y_um, ny1 = n.y_um + n.depth_um;
    if (edge === "EAST") return nx0 === sx1 && overlaps(sy0, sy1, ny0, ny1);
    if (edge === "WEST") return nx1 === sx0 && overlaps(sy0, sy1, ny0, ny1);
    if (edge === "NORTH") return ny0 === sy1 && overlaps(sx0, sx1, nx0, nx1);
    return ny1 === sy0 && overlaps(sx0, sx1, nx0, nx1); // SOUTH
  });
  return hits.length === 1 ? hits[0] : null; // V1 grid shares each interior edge with exactly one neighbor
}

/**
 * SPECS §XVI — AI PROPOSED IMPACT, before any commit. A positive deltaUm EXPANDS the edge outward; a
 * negative one pulls it inward. Returns the proposed geometry (interior conserves, exterior changes) or a
 * BLOCKED reason. Pure: it mutates nothing.
 */
export function proposeEdgeEdit(project: ArchitectProject, req: EdgeEditRequest): ProposeResult {
  const s = spaces(project).find((x) => x.bay_code === req.bay_code);
  if (!s) return { ok: false, reason: `BLOCKED · no Space ${req.bay_code}` };
  const d = req.deltaUm;
  if (!Number.isInteger(d) || d === 0) return { ok: false, reason: "BLOCKED · delta must be a non-zero integer µm" };
  const n = neighborOn(project, s, req.edge);
  const patches: EntityPatch[] = [];

  // self patch + the self dimension that changes on this edge
  const selfDim = req.edge === "EAST" || req.edge === "WEST" ? s.width_um + d : s.depth_um + d;
  if (req.edge === "WEST") patches.push({ entity_id: s.entity_id, x_um: s.x_um - d, width_um: s.width_um + d });
  else if (req.edge === "EAST") patches.push({ entity_id: s.entity_id, width_um: s.width_um + d });
  else if (req.edge === "SOUTH") patches.push({ entity_id: s.entity_id, y_um: s.y_um - d, depth_um: s.depth_um + d });
  else patches.push({ entity_id: s.entity_id, depth_um: s.depth_um + d }); // NORTH

  // the edited space's OWN floor (Enki): a shrink that takes it below the minimum (or ≤0) is BLOCKED
  if (selfDim < MIN_DIMENSION_UM) return { ok: false, reason: "BLOCKED · Edited dimension below minimum" };

  if (n) {
    // interior: the neighbor gives up the same Δ on its opposite edge; net area conserved
    const neighDim = req.edge === "EAST" || req.edge === "WEST" ? n.width_um - d : n.depth_um - d;
    if (neighDim < MIN_DIMENSION_UM) return { ok: false, reason: "BLOCKED · Neighbor dimension below minimum" };
    if (req.edge === "WEST") patches.push({ entity_id: n.entity_id, width_um: n.width_um - d });
    else if (req.edge === "EAST") patches.push({ entity_id: n.entity_id, x_um: n.x_um + d, width_um: n.width_um - d });
    else if (req.edge === "SOUTH") patches.push({ entity_id: n.entity_id, depth_um: n.depth_um - d });
    else patches.push({ entity_id: n.entity_id, y_um: n.y_um + d, depth_um: n.depth_um - d }); // NORTH
  }

  // §24 — every derived coordinate/dimension must be a safe integer
  try {
    for (const pt of patches) for (const k of ["x_um", "y_um", "width_um", "depth_um"] as const) {
      if (pt[k] !== undefined) assertSafeInt(pt[k], `${pt.entity_id}.${k}`);
    }
  } catch (e) { return { ok: false, reason: `BLOCKED · ${(e as Error).message}` }; }

  const proposal: EdgeProposal = { edge: req.edge, interior: !!n, patches };
  return { ok: true, preview: { status: "PROPOSED", proposed_change: proposal } };
}

export interface Actor { actor_id: string; actor_role: "HI" | "AI" | "SYSTEM" | "TEMPLATE"; }

/**
 * SPECS §04/§06/§XVII — HI ACCEPT commits the proposed revision (geometry applied, edited entities get the
 * new revision id and CURRENT evidence sourced at it; plan_state stays REVIEWABLE — ACCEPT ≠ plan approval).
 * Exactly one R-CORE event group is appended. Returns the new project + R-CORE.
 */
export function acceptEdit(project: ArchitectProject, rcore: RCore, preview: AiPreviewState, actor: Actor, meta?: { timestamp_ms?: number; local_date?: string }): { project: ArchitectProject; rcore: RCore } {
  if (!preview || preview.status !== "PROPOSED" || !preview.proposed_change) {
    throw new Error("ACCEPT requires a PROPOSED preview (HOLD/REJECT commit nothing)");
  }
  const proposal = preview.proposed_change as EdgeProposal;
  const rev = nextRevision(rcore);
  const child = structuredClone(project);
  const byId = new Map(child.entities.map((e) => [e.entity_id, e]));
  for (const pt of proposal.patches) {
    const e = byId.get(pt.entity_id) as SpaceEntity | undefined;
    if (!e) throw new Error(`ACCEPT: entity ${pt.entity_id} not found`);
    if (pt.x_um !== undefined) e.x_um = pt.x_um;
    if (pt.y_um !== undefined) e.y_um = pt.y_um;
    if (pt.width_um !== undefined) e.width_um = pt.width_um;
    if (pt.depth_um !== undefined) e.depth_um = pt.depth_um;
    e.revision_id = rev;
    e.evidence = { ...e.evidence, validity: "CURRENT", source_revision_id: rev, invalidated_by_revision_id: null, invalidated_reason: null };
  }
  child.current_revision_id = rev;
  child.plan_state = "REVIEWABLE"; // §04 — ACCEPT of an edit is NOT plan approval
  const { rcore: next } = commitRevision(rcore, project, child, {
    event_type: proposal.edge ? "EDGE_RESIZE" : "EDGE_RESIZE",
    actor_id: actor.actor_id, actor_role: actor.actor_role,
    reason: `${proposal.edge} edge resize`,
    timestamp_ms: meta?.timestamp_ms, local_date: meta?.local_date,
  });
  return { project: child, rcore: next };
}

/** SPECS §06 — HOLD keeps the preview live/deferred; it writes NOTHING to R-CORE or Runtime. */
export function holdEdit(preview: AiPreviewState): AiPreviewState {
  return { status: "HELD", proposed_change: preview.proposed_change ?? null };
}
/** SPECS §06 — REJECT discards the preview and clears the viewport; it writes NOTHING. */
export function rejectEdit(): AiPreviewState {
  return { status: "CLEARED", proposed_change: null };
}
