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
import { SPACE_FUNCTIONS, WET_CLASSES } from "./types";
import type { ArchitectProject, SpaceEntity, AiPreviewState, SpaceFunction, WetClass } from "./types";

export type Edge = "NORTH" | "EAST" | "SOUTH" | "WEST";
export interface EdgeEditRequest { bay_code: string; edge: Edge; deltaUm: number; }

interface EntityPatch { entity_id: string; x_um?: number; y_um?: number; width_um?: number; depth_um?: number; }
export interface EdgeProposal { kind: "edge"; edge: Edge; interior: boolean; patches: EntityPatch[]; base_revision_id: string; }
/** SPECS §XIV — a function/wet-class change to one Space (no geometry move). */
export interface AttrProposal { kind: "attr"; entity_id: string; bay_code: string; function?: SpaceFunction; wet_class?: WetClass; base_revision_id: string; }
export type EditProposal = EdgeProposal | AttrProposal;
export type ProposeResult = { ok: true; preview: AiPreviewState } | { ok: false; reason: string };
export interface AttrEditRequest { bay_code: string; function?: SpaceFunction; wet_class?: WetClass; }

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
  const s = spaces(project).find((x) => x.bay_code.normalize("NFC") === req.bay_code.normalize("NFC"));
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

  // Stamp the base revision so a HELD preview whose base later advanced is INVALIDATED, never silently
  // applied against a stale state (ARC-35.01 / advisory §4 green-but-false).
  const proposal: EdgeProposal = { kind: "edge", edge: req.edge, interior: !!n, patches, base_revision_id: project.current_revision_id };
  return { ok: true, preview: { status: "PROPOSED", proposed_change: proposal } };
}

/**
 * SPECS §XIV/§XVI — propose a function or wet-class change to one Space (no geometry). AI previews it; HI
 * ACCEPT commits one revision; HOLD/REJECT write nothing. Pure.
 */
export function proposeAttrEdit(project: ArchitectProject, req: AttrEditRequest): ProposeResult {
  const s = spaces(project).find((x) => x.bay_code.normalize("NFC") === req.bay_code.normalize("NFC"));
  if (!s) return { ok: false, reason: `BLOCKED · no Space ${req.bay_code}` };
  if (req.function === undefined && req.wet_class === undefined) return { ok: false, reason: "BLOCKED · nothing to change" };
  if (req.function !== undefined && !(SPACE_FUNCTIONS as readonly string[]).includes(req.function)) return { ok: false, reason: `BLOCKED · unknown function ${req.function}` };
  if (req.wet_class !== undefined && !(WET_CLASSES as readonly string[]).includes(req.wet_class)) return { ok: false, reason: `BLOCKED · unknown wet class ${req.wet_class}` };
  const proposal: AttrProposal = { kind: "attr", entity_id: s.entity_id, bay_code: s.bay_code, function: req.function, wet_class: req.wet_class, base_revision_id: project.current_revision_id };
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
  const proposal = preview.proposed_change as EditProposal;
  // ARC-35.01 — a preview computed against an earlier head is out of date; invalidate it rather than apply it
  // against the advanced base (never recompute-and-silently-apply).
  if (proposal.base_revision_id && proposal.base_revision_id !== project.current_revision_id) {
    throw new Error(`ACCEPT: preview is out of date (built on ${proposal.base_revision_id}, head is ${project.current_revision_id}) — re-edit`);
  }
  const rev = nextRevision(rcore);
  const child = structuredClone(project);
  const byId = new Map(child.entities.map((e) => [e.entity_id, e]));
  const stamp = (e: SpaceEntity) => {
    e.revision_id = rev;
    e.evidence = { ...e.evidence, validity: "CURRENT", source_revision_id: rev, invalidated_by_revision_id: null, invalidated_reason: null };
  };
  let event_type: "EDGE_RESIZE" | "FUNCTION_CHANGE" | "WET_CHANGE";
  let reason: string;
  if (proposal.kind === "edge") {
    for (const pt of proposal.patches) {
      const e = byId.get(pt.entity_id) as SpaceEntity | undefined;
      if (!e) throw new Error(`ACCEPT: entity ${pt.entity_id} not found`);
      if (pt.x_um !== undefined) e.x_um = pt.x_um;
      if (pt.y_um !== undefined) e.y_um = pt.y_um;
      if (pt.width_um !== undefined) e.width_um = pt.width_um;
      if (pt.depth_um !== undefined) e.depth_um = pt.depth_um;
      stamp(e);
    }
    event_type = "EDGE_RESIZE";
    reason = `${proposal.edge} edge resize`;
  } else {
    const e = byId.get(proposal.entity_id) as SpaceEntity | undefined;
    if (!e) throw new Error(`ACCEPT: entity ${proposal.entity_id} not found`);
    if (proposal.function !== undefined) e.function = proposal.function;
    if (proposal.wet_class !== undefined) e.wet_class = proposal.wet_class;
    stamp(e);
    event_type = proposal.function !== undefined ? "FUNCTION_CHANGE" : "WET_CHANGE";
    reason = proposal.function !== undefined ? `function → ${proposal.function}` : `wet class → ${proposal.wet_class}`;
  }
  child.current_revision_id = rev;
  child.plan_state = "REVIEWABLE"; // §04 — ACCEPT of an edit is NOT plan approval
  const { rcore: next } = commitRevision(rcore, project, child, {
    event_type, actor_id: actor.actor_id, actor_role: actor.actor_role, reason,
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
