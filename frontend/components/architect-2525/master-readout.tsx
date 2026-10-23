"use client";

/**
 * ARCHITECT-2525 · MASTER READOUT — the project's headline numbers on the Design Model header (R-UX1).
 * ==================================================================================================
 * CANONICAL truth only. The Design header reads the SAME project state as the Overview tab — never the
 * legacy estimate theatre (2,000 ft² from DEFAULT_PARAMS, a made-up readiness %, or a construction cost
 * for an unbuilt project). Fixed from the canonical seed geometry, so it cannot drift: 9 Spaces · 900 ft²
 * · PLAN · REVIEWABLE · Project Cost NOT CALCULATED. One screen, one story.
 */
import { Settings } from "lucide-react";
import { buildProjectFromSeed, netProgramAreaUm2, spaceCount } from "@/lib/architect-2525/canonical/runtime";
import { sqftFromUm2 } from "@/lib/architect-2525/canonical/units";
import { TINY_HOME_V1 } from "@/lib/architect-2525/seeds/tiny-home-v1";

const C = { border: "#1e2b3a", panel: "#111826", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400" };

// `inline` renders the key WITHOUT its own card — for sitting inside the map's scrolling header (Security
// R-CORE reuse). Default renders the bordered card. `whitespace-nowrap` keeps the chips on one scrollable line.
export function MasterReadout({ inline = false }: { inline?: boolean }) {
  const project = buildProjectFromSeed(TINY_HOME_V1);
  const sqft = sqftFromUm2(netProgramAreaUm2(project));          // 900 exactly, from canonical geometry
  const spaces = spaceCount(project);                            // 9
  const stageWord = project.portfolio_stage.split("_")[1];       // PLAN
  const planState = project.plan_state;                          // REVIEWABLE
  const wrap = inline
    ? "flex shrink-0 items-center gap-x-3 whitespace-nowrap text-[10px]"
    : "mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-1.5 text-[10px]";
  return (
    <div data-arch-master-readout className={wrap} style={inline ? undefined : { borderColor: C.border, background: C.panel }}>
      <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
        <Settings className="h-3 w-3" /> Project · Master
      </span>
      <span style={{ color: C.dim }}>Net Program <span style={{ color: C.text }}>{spaces} Spaces · {sqft} ft²</span></span>
      <span style={{ color: C.dim }}>Stage <span style={{ color: C.gold }}>{stageWord} · {planState}</span></span>
      <span style={{ color: C.dim }}>Project Cost <span style={{ color: C.text }}>NOT CALCULATED</span></span>
    </div>
  );
}
