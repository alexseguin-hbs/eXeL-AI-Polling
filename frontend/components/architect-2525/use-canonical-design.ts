"use client";

/**
 * ARCHITECT-2525 · useCanonicalDesign — the Design tab's canonical edit state (R-UX2).
 * =================================================================================================
 * Holds the LIVE canonical project + its R-CORE, the selected Space, and the AI PROPOSED IMPACT preview.
 * Every edit runs the proven Block-B/D contract (runtime-edit + rcore): propose (no mutation) → ACCEPT
 * (one revision, plan_state stays REVIEWABLE) / HOLD (keep, write nothing) / REJECT (clear, write nothing).
 * SPIRAL / SYNC / REVERSE are the REAL return values of the canonical verification functions — never
 * hardcoded (advisory §5 / §XVIII / §XIX). Nothing here mutates canonical state except through acceptEdit.
 */
import { useCallback, useMemo, useState } from "react";
import { buildProjectFromSeed, buildR0Snapshot, netProgramAreaUm2 } from "@/lib/architect-2525/canonical/runtime";
import { TINY_HOME_V1 } from "@/lib/architect-2525/seeds/tiny-home-v1";
import { sqftFromUm2, UM_PER_FT } from "@/lib/architect-2525/canonical/units";
import { projectHash } from "@/lib/architect-2525/canonical/serialize";
import { initRCore, headRevision, spiral, syncState, reverse, type RCore } from "@/lib/architect-2525/canonical/rcore";
import { proposeEdgeEdit, proposeAttrEdit, acceptEdit, holdEdit, rejectEdit, type Edge, type EditProposal } from "@/lib/architect-2525/canonical/runtime-edit";
import type { ArchitectProject, SpaceEntity, AiPreviewState, SpaceFunction, WetClass } from "@/lib/architect-2525/canonical/types";

const HI = { actor_id: "HI", actor_role: "HI" as const };
const spacesOf = (p: ArchitectProject) => p.entities.filter((e): e is SpaceEntity => e.entity_type === "SPACE");

/** Apply an edge proposal's geometry patches onto a clone (preview only — no revision, no commit). */
function previewProjectOf(proj: ArchitectProject, preview: AiPreviewState | null): ArchitectProject {
  const pc = (preview && preview.status !== "CLEARED" ? preview.proposed_change : null) as EditProposal | null;
  if (!pc || pc.kind !== "edge") return proj;
  const clone = structuredClone(proj);
  const byId = new Map(clone.entities.map((e) => [e.entity_id, e]));
  for (const pt of pc.patches) {
    const e = byId.get(pt.entity_id) as SpaceEntity | undefined;
    if (!e) continue;
    if (pt.x_um !== undefined) e.x_um = pt.x_um;
    if (pt.y_um !== undefined) e.y_um = pt.y_um;
    if (pt.width_um !== undefined) e.width_um = pt.width_um;
    if (pt.depth_um !== undefined) e.depth_um = pt.depth_um;
  }
  return clone;
}

export interface CanonicalDesign {
  project: ArchitectProject;
  selectedId: string | null;
  selectedSpace: SpaceEntity | null;
  preview: AiPreviewState | null;
  blocked: string | null;
  previewProject: ArchitectProject;      // the live project, or the proposed geometry (for the ghost)
  impact: { interior: boolean; areaDeltaSqft: number } | null;
  head: string;
  spiralState: string;                   // NOT_RUN | PASS | FAIL
  sync: string;                          // SYNCED | DIVERGED | OFFLINE
  reverseInfo: { parentRevision: string; parentHash: string } | null;
  currentHash: string;
  selectSpace: (entityId: string | null) => void;
  proposeEdge: (edge: Edge, deltaFt: number) => void;
  proposeFunction: (fn: SpaceFunction) => void;
  proposeWet: (wet: WetClass) => void;
  accept: () => void;
  hold: () => void;
  reject: () => void;
  reset: () => void;
}

export function useCanonicalDesign(): CanonicalDesign {
  const [project, setProject] = useState<ArchitectProject>(() => buildProjectFromSeed(TINY_HOME_V1));
  const [rcore, setRcore] = useState<RCore>(() => initRCore(buildR0Snapshot(buildProjectFromSeed(TINY_HOME_V1))));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<AiPreviewState | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  const selectedSpace = useMemo(
    () => (selectedId ? spacesOf(project).find((s) => s.entity_id === selectedId) ?? null : null),
    [project, selectedId],
  );

  const selectSpace = useCallback((entityId: string | null) => {
    setSelectedId(entityId);
    setPreview(null);
    setBlocked(null);
  }, []);

  const runPropose = useCallback((fn: () => ReturnType<typeof proposeEdgeEdit>) => {
    const r = fn();
    if (r.ok) { setPreview(r.preview); setBlocked(null); }
    else { setPreview(null); setBlocked(r.reason); }
  }, []);

  const proposeEdge = useCallback((edge: Edge, deltaFt: number) => {
    if (!selectedSpace) return;
    const bay = selectedSpace.bay_code;
    runPropose(() => proposeEdgeEdit(project, { bay_code: bay, edge, deltaUm: Math.round(deltaFt * UM_PER_FT) }));
  }, [project, selectedSpace, runPropose]);

  const proposeFunction = useCallback((fn: SpaceFunction) => {
    if (!selectedSpace) return;
    runPropose(() => proposeAttrEdit(project, { bay_code: selectedSpace.bay_code, function: fn }));
  }, [project, selectedSpace, runPropose]);

  const proposeWet = useCallback((wet: WetClass) => {
    if (!selectedSpace) return;
    runPropose(() => proposeAttrEdit(project, { bay_code: selectedSpace.bay_code, wet_class: wet }));
  }, [project, selectedSpace, runPropose]);

  const accept = useCallback(() => {
    if (!preview || preview.status !== "PROPOSED") return;
    try {
      const next = acceptEdit(project, rcore, preview, HI);
      setProject(next.project);
      setRcore(next.rcore);
      setPreview(null);
      setBlocked(null);
    } catch (e) { setBlocked((e as Error).message); }
  }, [project, rcore, preview]);

  const hold = useCallback(() => { setPreview((p) => (p ? holdEdit(p) : p)); }, []);
  const reject = useCallback(() => { setPreview(rejectEdit()); setBlocked(null); }, []);
  const reset = useCallback(() => {
    setProject(buildProjectFromSeed(TINY_HOME_V1));
    setRcore(initRCore(buildR0Snapshot(buildProjectFromSeed(TINY_HOME_V1))));
    setSelectedId(null); setPreview(null); setBlocked(null);
  }, []);

  const previewProject = useMemo(() => previewProjectOf(project, preview), [project, preview]);
  const impact = useMemo(() => {
    const pc = (preview && preview.status !== "CLEARED" ? preview.proposed_change : null) as EditProposal | null;
    if (!pc) return null;
    const interior = pc.kind === "edge" ? pc.interior : false;
    const areaDeltaSqft = sqftFromUm2(netProgramAreaUm2(previewProject)) - sqftFromUm2(netProgramAreaUm2(project));
    return { interior, areaDeltaSqft };
  }, [preview, previewProject, project]);

  const head = headRevision(rcore);
  const spiralState = spiral(project, rcore);
  const sync = syncState(project, rcore);
  const reverseInfo = useMemo(() => {
    if (!rcore.events.length) return null;
    try { const r = reverse(rcore, head); return { parentRevision: r.parentRevision, parentHash: r.parentHash }; }
    catch { return null; }
  }, [rcore, head]);
  const currentHash = useMemo(() => projectHash(project), [project]);

  return {
    project, selectedId, selectedSpace, preview, blocked, previewProject, impact,
    head, spiralState, sync, reverseInfo, currentHash,
    selectSpace, proposeEdge, proposeFunction, proposeWet, accept, hold, reject, reset,
  };
}
