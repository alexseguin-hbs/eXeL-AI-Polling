"use client";

/**
 * ARCHITECT-2525 · CANONICAL PROJECT TREE — the LEFT rail of the Design workspace (R-UX1).
 * =================================================================================================
 * Replaces the legacy digital-twin layer catalog as the Design left panel.
 * This rail is the CANONICAL PROJECT TRUTH: the exact Runtime hierarchy from buildProjectFromSeed(
 * TINY_HOME_V1) — Project → Site → Building → Storey → 9 Spaces — each node carrying its canonical
 * entity_id. Nodes are SELECTED, never dragged (dragging belongs to the illustrative House Kit, R-UX2);
 * there are no cost badges and no market selector (those were legacy-estimate theatre). What the
 * left shows is what the canonical project IS: 9 Spaces · 900 ft² · PLAN · REVIEWABLE — the same truth
 * the Overview tab reads, so one screen can no longer tell two stories.
 * (the legacy layer catalog and its tree component are retained in-repo for other consumers.)
 */
import { useMemo, useState } from "react";
import { ChevronRight, Boxes, LandPlot, Building2, Layers, Square } from "lucide-react";
import { buildProjectFromSeed, netProgramAreaUm2, spaceCount } from "@/lib/architect-2525/canonical/runtime";
import { sqftFromUm2 } from "@/lib/architect-2525/canonical/units";
import { TINY_HOME_V1 } from "@/lib/architect-2525/seeds/tiny-home-v1";
import type { ArchitectProject, CanonicalEntity, SpaceEntity } from "@/lib/architect-2525/canonical/types";

const C = { border: "#1e2b3a", panel: "#111826", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e", gold: "#ffd400" };

// Each entity_type → the icon + accent for its row; a tiny uppercase tag names the level.
const TYPE_META: Record<string, { Icon: typeof Boxes; color: string; tag: string }> = {
  PROJECT:  { Icon: Boxes,     color: C.violet, tag: "PROJECT" },
  SITE:     { Icon: LandPlot,  color: C.green,  tag: "SITE" },
  BUILDING: { Icon: Building2, color: C.cyan,   tag: "BUILDING" },
  STOREY:   { Icon: Layers,    color: C.cyan,   tag: "STOREY" },
  SPACE:    { Icon: Square,    color: C.text,   tag: "SPACE" },
};

const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

function entityName(e: CanonicalEntity): string {
  if (e.entity_type === "SPACE") {
    const s = e as SpaceEntity;
    return `${s.bay_code} · ${titleCase(s.function)}`;
  }
  // Project / Site / Building / Storey carry a human name.
  return (e as { name?: string }).name ?? e.entity_type;
}

export function CanonicalProjectTree({ onSelect }: { onSelect?: (entityId: string) => void }) {
  const project: ArchitectProject = useMemo(() => buildProjectFromSeed(TINY_HOME_V1), []);
  const sqft = sqftFromUm2(netProgramAreaUm2(project));
  const spaces = spaceCount(project);
  const stageWord = project.portfolio_stage.split("_")[1]; // PLAN
  const planState = project.plan_state;                    // REVIEWABLE

  // parent_id → children, in entities (seed) order, so the nine Spaces list C1…A3 as seeded.
  const childrenOf = useMemo(() => {
    const m = new Map<string | null, CanonicalEntity[]>();
    for (const e of project.entities) {
      const arr = m.get(e.parent_id) ?? [];
      arr.push(e);
      m.set(e.parent_id, arr);
    }
    return m;
  }, [project]);
  const root = project.entities.find((e) => e.parent_id === null) ?? null;

  const [selected, setSelected] = useState<string | null>(null);
  // Every parent open by default so the whole hierarchy — down to the nine Spaces — reads at a glance.
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const e of project.entities) if ((childrenOf.get(e.entity_id) ?? []).length) s.add(e.entity_id);
    return s;
  });
  const toggle = (id: string) => setOpenIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const renderNode = (e: CanonicalEntity, depth: number) => {
    const kids = childrenOf.get(e.entity_id) ?? [];
    const hasKids = kids.length > 0;
    const open = openIds.has(e.entity_id);
    const sel = selected === e.entity_id;
    const meta = TYPE_META[e.entity_type] ?? TYPE_META.SPACE;
    const isSpace = e.entity_type === "SPACE";
    const wet = isSpace && (e as SpaceEntity).wet_class === "WET";
    const isBath = isSpace && (e as SpaceEntity).function === "BATH";
    return (
      <div key={e.entity_id}>
        <div
          data-canon-node={e.entity_id} data-canon-type={e.entity_type}
          data-canon-bay={isSpace ? (e as SpaceEntity).bay_code : undefined}
          data-testid={isSpace ? `space-${(e as SpaceEntity).bay_code}` : undefined}
          title={e.entity_id}
          onClick={() => { if (hasKids) toggle(e.entity_id); setSelected(e.entity_id); onSelect?.(e.entity_id); }}
          className="group flex cursor-pointer items-center gap-1 rounded px-1 py-1 text-[10px] select-none hover:bg-white/5"
          style={{ marginLeft: depth * 12, background: sel ? "#221833" : "transparent", color: C.text }}>
          {hasKids
            ? <ChevronRight className="h-3 w-3 shrink-0 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none", color: C.dim }} />
            : <span className="inline-block h-3 w-3 shrink-0" />}
          <meta.Icon className="h-3 w-3 shrink-0" style={{ color: meta.color }} />
          <span className="min-w-0 flex-1 truncate" style={isSpace ? undefined : { fontWeight: 600 }}>{entityName(e)}</span>
          {isSpace ? (
            <span className="flex shrink-0 items-center gap-1 text-[8px] tabular-nums" style={{ color: C.dim }}>
              <span className="inline-block h-1.5 w-1.5 rounded-full" title={wet ? "Wet" : "Dry"} style={{ background: wet ? C.cyan : "#33415a" }} />
              {isBath ? <span style={{ color: C.gold }}>BATH</span> : null}
              100 ft²
            </span>
          ) : (
            <span className="shrink-0 text-[8px] tracking-wider" style={{ color: C.dim }}>{meta.tag}{hasKids ? ` ·${kids.length}` : ""}</span>
          )}
        </div>
        {open && kids.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div data-arch-canonical-tree data-testid="canonical-project-tree" className="flex flex-col gap-1">
      {/* CANONICAL header — the left rail is canonical project TRUTH, not an illustrative catalog. */}
      <div data-arch-canonical-head className="mb-1 rounded border px-2 py-1.5" style={{ borderColor: C.cyan, background: "#0c1420" }}>
        <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          <Boxes className="h-3 w-3" /> Canonical Project
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
          <span style={{ color: C.text }}>{spaces} Spaces · {sqft} ft²</span>
          <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.gold, background: "#1a1206" }}>{stageWord} · {planState}</span>
        </div>
        <div className="mt-0.5 text-[8px] leading-tight" style={{ color: C.dim }}>Select a Space to inspect it. This panel is canonical project truth — nothing here is dragged.</div>
      </div>
      {root ? renderNode(root, 0) : null}
    </div>
  );
}
