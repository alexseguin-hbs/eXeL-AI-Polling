// SPECS / ARCHITECT-2525 §XVII / §XVIII / §XIX / §11 — R-CORE: the append-only, SHA-256-chained memory.
// Mirrors lib/financial-2525/record.ts's append/replay/verify CONTROL FLOW only — never its FNV-1a /
// charCodeAt / UTF-16 / timestamp-folding hash. Every chain hash is projectHash / canonicalHash (UTF-8,
// volatile-excluded, §09/§XXII, Thoth). GENESIS = the R0 project_hash exactly (R0 is built first, §11).
// Snapshot + delta: a snapshot at R0 and every 10 committed revisions; replay = nearest prior snapshot +
// deltas (ARC-35.05). Only HI ACCEPT commits a revision (§06/§XVII); HOLD/REJECT never reach here.
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-rcore.test.mjs

import { projectHash, canonicalHash, serializeCanonicalProject } from "./serialize";
import type {
  ArchitectProject, CanonicalEntity, EntityChange, RCoreEventGroup, RCoreSnapshot,
  EventType, ActorRole, SpiralState, SyncState, RevisionId,
} from "./types";

export interface RCore {
  snapshots: RCoreSnapshot[];
  events: RCoreEventGroup[];
}

const SNAPSHOT_EVERY = 10;

/** "R7" → 7; the one place a revision id's ordinal is read. */
function revIndex(revision: RevisionId): number {
  const n = Number.parseInt(String(revision).replace(/^R/, ""), 10);
  if (!Number.isInteger(n) || n < 0) throw new Error(`R-CORE: malformed revision id ${revision}`);
  return n;
}
function revId(index: number): RevisionId { return `R${index}`; }

/** SPECS §11 — initialize R-CORE from the generated R0 snapshot (GENESIS = R0 project_hash). */
export function initRCore(r0: RCoreSnapshot): RCore {
  if (r0.revision_id !== "R0") throw new Error("R-CORE: initRCore requires the R0 snapshot");
  if (r0.project_hash !== projectHash(r0.project)) throw new Error("R-CORE: R0 snapshot hash mismatch");
  return { snapshots: [clone(r0)], events: [] };
}

function clone<T>(v: T): T { return structuredClone(v); }
const eqJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** The head revision id (the last committed revision, or R0). */
export function headRevision(rcore: RCore): RevisionId {
  return rcore.events.length ? rcore.events[rcore.events.length - 1].revision_id : "R0";
}
/** The next revision id a commit will take. */
export function nextRevision(rcore: RCore): RevisionId {
  return revId(revIndex(headRevision(rcore)) + 1);
}

/** Field-level diff of two projects' entity arrays (by entity_id) — the §XVII changes[] and the replay delta. */
export function computeEntityChanges(parent: ArchitectProject, child: ArchitectProject): EntityChange[] {
  const changes: EntityChange[] = [];
  const byId = new Map(parent.entities.map((e) => [e.entity_id, e as unknown as Record<string, unknown>]));
  for (const ce of child.entities as unknown as Record<string, unknown>[]) {
    const pe = byId.get(ce.entity_id as string);
    if (!pe) {
      changes.push({ entity_id: ce.entity_id as string, entity_type: ce.entity_type as CanonicalEntity["entity_type"], field: "*", before: null, after: clone(ce) });
      continue;
    }
    for (const k of Object.keys(ce)) {
      if (!eqJson(ce[k], pe[k])) {
        changes.push({ entity_id: ce.entity_id as string, entity_type: ce.entity_type as CanonicalEntity["entity_type"], field: k, before: clone(pe[k]), after: clone(ce[k]) });
      }
    }
  }
  return changes;
}

export interface CommitMeta {
  event_type: EventType;
  actor_id: string;
  actor_role: ActorRole;
  reason: string;
  timestamp_ms?: number;     // ◬ absolute — provenance, hash-excluded (§3.2)
  local_date?: string;       // 웃 human-context — provenance, hash-excluded (§3.2)
  master_of_thought?: string;
  invalidated_entities?: string[];
  invalidated_metrics?: string[];
  invalidated_evidence?: string[];
  invalidated_exports?: string[];
}

/**
 * SPECS §XVII — commit one HI-accepted revision. prev_hash = the parent project_hash (GENESIS = R0 hash);
 * event_hash = canonicalHash over the volatile-excluded event content + the child project_hash (never a
 * timestamp-fold). A snapshot is added at every 10th revision (ARC-35.05).
 */
export function commitRevision(rcore: RCore, parent: ArchitectProject, child: ArchitectProject, meta: CommitMeta): { rcore: RCore; event: RCoreEventGroup } {
  const parent_revision_id = parent.current_revision_id;
  const revision_id = child.current_revision_id;
  if (revIndex(revision_id) !== revIndex(parent_revision_id) + 1) {
    throw new Error(`R-CORE: non-sequential commit ${parent_revision_id} → ${revision_id}`);
  }
  const prev_hash = projectHash(parent);
  if (prev_hash !== projectHash(replay(rcore, parent_revision_id))) {
    throw new Error("R-CORE: parent does not match the replayed head (DIVERGED)");
  }
  const changes = computeEntityChanges(parent, child);
  const child_hash = projectHash(child);
  const core = {
    revision_id, parent_revision_id, event_type: meta.event_type,
    actor_id: meta.actor_id, actor_role: meta.actor_role, reason: meta.reason,
    changes,
    invalidated_entities: meta.invalidated_entities ?? [],
    invalidated_metrics: meta.invalidated_metrics ?? [],
    invalidated_evidence: meta.invalidated_evidence ?? [],
    invalidated_exports: meta.invalidated_exports ?? [],
    prev_hash, child_hash, // child_hash binds the event to the resulting state; it is hashed, not stored raw
  };
  const event: RCoreEventGroup = {
    event_id: `evt-${revision_id}`,
    revision_id, parent_revision_id, event_type: meta.event_type,
    actor_id: meta.actor_id, actor_role: meta.actor_role,
    master_of_thought: meta.master_of_thought,
    financial2525_mot: null,
    timestamp_ms: meta.timestamp_ms ?? 0, // ◬ provenance, hash-excluded
    local_date: meta.local_date ?? "",    // 웃 provenance, hash-excluded
    reason: meta.reason,
    changes,
    invalidated_entities: core.invalidated_entities,
    invalidated_metrics: core.invalidated_metrics,
    invalidated_evidence: core.invalidated_evidence,
    invalidated_exports: core.invalidated_exports,
    event_hash: canonicalHash(core),
    prev_hash,
  };
  const next: RCore = { snapshots: rcore.snapshots.slice(), events: rcore.events.concat(event) };
  if (revIndex(revision_id) % SNAPSHOT_EVERY === 0) {
    next.snapshots = next.snapshots.concat({ revision_id, project_hash: child_hash, project: clone(child) });
  }
  return { rcore: next, event };
}

/** Apply one event group's changes forward onto a project clone (set entity[field] = after). */
function applyForward(project: ArchitectProject, event: RCoreEventGroup): ArchitectProject {
  const p = clone(project);
  const byId = new Map(p.entities.map((e) => [e.entity_id, e as unknown as Record<string, unknown>]));
  for (const c of event.changes) {
    const e = byId.get(c.entity_id);
    if (!e) { if (c.field === "*") p.entities.push(c.after as unknown as CanonicalEntity); continue; }
    if (c.field === "*") continue;
    e[c.field] = clone(c.after);
  }
  p.current_revision_id = event.revision_id;
  return p;
}

/** Apply one event group's changes in REVERSE onto a project clone (set entity[field] = before). */
function applyReverse(project: ArchitectProject, event: RCoreEventGroup): ArchitectProject {
  const p = clone(project);
  const byId = new Map(p.entities.map((e) => [e.entity_id, e as unknown as Record<string, unknown>]));
  for (const c of event.changes) {
    const e = byId.get(c.entity_id);
    if (!e || c.field === "*") continue;
    e[c.field] = clone(c.before);
  }
  p.current_revision_id = event.parent_revision_id;
  return p;
}

/** SPECS §XVII — replay: nearest prior snapshot + the event groups up to the target revision. */
export function replay(rcore: RCore, revision?: RevisionId): ArchitectProject {
  const target = revIndex(revision ?? headRevision(rcore));
  let base: RCoreSnapshot | null = null;
  for (const s of rcore.snapshots) {
    const i = revIndex(s.revision_id);
    if (i <= target && (!base || i > revIndex(base.revision_id))) base = s;
  }
  if (!base) throw new Error(`R-CORE: no snapshot at or before ${revId(target)}`);
  let project = clone(base.project);
  for (const e of rcore.events) {
    const i = revIndex(e.revision_id);
    if (i > revIndex(base.revision_id) && i <= target) project = applyForward(project, e);
  }
  return project;
}

/** SPECS §XVIII — REVERSE is a PURE verification: the inverse of the latest event reconstructs the parent
 *  hash; it does NOT mutate working state. Returns the reconstructed parent hash. */
export function reverse(rcore: RCore, revision?: RevisionId): { parentHash: string; parentRevision: RevisionId } {
  const rev = revision ?? headRevision(rcore);
  const event = rcore.events.find((e) => e.revision_id === rev);
  if (!event) throw new Error(`R-CORE: no event for ${rev}`);
  const atRev = replay(rcore, rev);
  const parent = applyReverse(atRev, event);
  return { parentHash: projectHash(parent), parentRevision: event.parent_revision_id };
}

/** SPECS §XVII verify — walk the chain root→head; each prev_hash must equal the replayed parent's hash. */
export function verifyChain(rcore: RCore): { ok: boolean; brokenAt: RevisionId | null } {
  const genesis = rcore.snapshots.find((s) => s.revision_id === "R0");
  if (!genesis || genesis.project_hash !== projectHash(genesis.project)) return { ok: false, brokenAt: "R0" };
  for (const e of rcore.events) {
    if (e.prev_hash !== projectHash(replay(rcore, e.parent_revision_id))) return { ok: false, brokenAt: e.revision_id };
  }
  return { ok: true, brokenAt: null };
}

/** SPECS §XVIII — SPIRAL: FORWARD (current == head post-state) · REPLAY (replay(head)==current) · REVERSE
 *  (reverse(head) reconstructs the parent). PASS only if all hold; NOT_RUN when there is no committed edit. */
export function spiral(project: ArchitectProject, rcore: RCore): SpiralState {
  if (!rcore.events.length) return "NOT_RUN";
  try {
    const head = headRevision(rcore);
    if (project.current_revision_id !== head) return "FAIL";
    const current = projectHash(project);
    const forward = projectHash(replay(rcore, head));           // REPLAY
    if (forward !== current) return "FAIL";
    const rev = reverse(rcore, head);                            // REVERSE
    const parentReplay = projectHash(replay(rcore, rev.parentRevision));
    if (rev.parentHash !== parentReplay) return "FAIL";
    if (!verifyChain(rcore).ok) return "FAIL";
    return "PASS";
  } catch { return "FAIL"; }
}

/** SPECS §XIX — R-CORE SYNC: the live project hash equals the replayed current-revision hash → SYNCED. */
export function syncState(project: ArchitectProject, rcore: RCore): SyncState {
  try {
    return projectHash(project) === projectHash(replay(rcore, project.current_revision_id)) ? "SYNCED" : "DIVERGED";
  } catch { return "OFFLINE"; }
}

// ── §XX — stale / superseded evidence transitions, each with a named producer (ARC-35.04, Enki) ──
/** CURRENT → STALE: a later revision invalidated this evidence, no replacement yet (§XX). */
export function invalidateEvidence(project: ArchitectProject, entityIds: string[], byRevision: RevisionId, reason: string): ArchitectProject {
  const p = clone(project);
  for (const e of p.entities) {
    if (entityIds.includes(e.entity_id) && e.evidence.validity === "CURRENT") {
      e.evidence = { ...e.evidence, validity: "STALE", invalidated_by_revision_id: byRevision, invalidated_reason: reason };
    }
  }
  return p;
}
/** CURRENT/STALE → SUPERSEDED: a newer equivalent evidence exists (§XX; the SUPERSEDED producer). */
export function supersedeEvidence(project: ArchitectProject, entityIds: string[], byRevision: RevisionId): ArchitectProject {
  const p = clone(project);
  for (const e of p.entities) {
    if (entityIds.includes(e.entity_id) && e.evidence.validity !== "SUPERSEDED") {
      e.evidence = { ...e.evidence, validity: "SUPERSEDED", invalidated_by_revision_id: byRevision, invalidated_reason: e.evidence.invalidated_reason ?? "superseded by newer evidence" };
    }
  }
  return p;
}

export { serializeCanonicalProject };
