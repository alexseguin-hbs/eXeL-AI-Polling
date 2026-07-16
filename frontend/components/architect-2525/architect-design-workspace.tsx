"use client";

/**
 * ARCHITECT-2525 · DESIGN WORKSPACE — Security-2525 mission-planning layout for the Design tab.
 * =================================================================================================
 * Three columns (Vision 2525 Digital Twin Standard v1.0):
 *   LEFT rail   = Layer Tree  — the physical Digital Twin ("what exists"). Placeholder here; filled in C2+.
 *   CENTER      = visualization engine — the 4 engine views (MODEL · SITE · SKY · COMPARE) render as children.
 *   RIGHT rail  = Context inspector — the selected layer's detail. Placeholder here; filled in C5.
 * Each rail collapses to a 56px 3-bullet button (Security `Toggle3` pattern). Portrait stacks to one column.
 * The engine tabs themselves live in the shell SUBNAV row (Model/Site/Sky/Compare) directly above this — that
 * keeps every existing SPIRAL assert (`[data-arch-subnav] button:has-text("Site")` + `[data-sky-view]`) green.
 */
import { useEffect, useState, type ReactNode } from "react";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc" };

// Security-2525 "•••" collapse control (Dots3/Toggle3) — three cyan bullets.
function Toggle3({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} data-arch-rail-toggle
      className="flex flex-col items-center gap-[3px] rounded p-1 hover:bg-white/10">
      {[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 rounded-full" style={{ background: C.cyan }} />)}
    </button>
  );
}

function Rail({ side, title, open, setOpen, children }: {
  side: "left" | "right"; title: string; open: boolean; setOpen: (b: boolean) => void; children: ReactNode;
}) {
  if (!open) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-2 pt-1 landscape:w-[56px]">
        <Toggle3 onClick={() => setOpen(true)} title={`Show ${title}`} />
        <span className="hidden text-[8px] font-semibold uppercase tracking-wider landscape:[writing-mode:vertical-rl]"
          style={{ color: C.dim }}>{title}</span>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 shrink-0 flex-col gap-2 landscape:w-64">
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border shadow-xl" style={{ background: C.panel, borderColor: C.border }}>
        <div className="flex items-center justify-between border-b p-1.5" style={{ borderColor: C.border }}>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>{title}</span>
          <Toggle3 onClick={() => setOpen(false)} title={`Collapse ${title}`} />
        </div>
        <div data-arch-rail={side} className="overflow-y-auto p-2" style={{ maxHeight: "72vh" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DesignWorkspace({ leftRail, rightRail, children, selectedId }: {
  leftRail?: ReactNode; rightRail?: ReactNode; children: ReactNode; selectedId?: string | null;
}) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false); // Context opens on selection (C5); collapsed keeps the engine wide
  // "Selecting any item in the Layer Tree opens the Right Context Panel" — auto-open on a new selection.
  useEffect(() => { if (selectedId) setRightOpen(true); }, [selectedId]);
  return (
    // flex-wrap: when a rail + the engine's min-width can't fit, the rail wraps below instead of crushing the
    // visualization engine (the celestial map's absolute overlays overlap if the map gets too narrow).
    <div data-arch-design-ws className="flex flex-col gap-2 landscape:flex-row landscape:flex-wrap">
      <Rail side="left" title="Layer Tree" open={leftOpen} setOpen={setLeftOpen}>
        {leftRail ?? (
          <div className="text-[10px] leading-relaxed" style={{ color: C.dim }}>
            <span className="font-semibold" style={{ color: C.violet }}>Layer Tree</span> — the physical Digital Twin.
            <div className="mt-1">Hierarchy renders here (C2+).</div>
          </div>
        )}
      </Rail>
      <div data-arch-engine className="min-w-0 flex-1 landscape:min-w-[560px]">{children}</div>
      <Rail side="right" title="Context" open={rightOpen} setOpen={setRightOpen}>
        {rightRail ?? (
          <div className="text-[10px] leading-relaxed" style={{ color: C.dim }}>
            Select a layer to inspect its properties, Level&nbsp;3 Cubes, and linked records (C5).
          </div>
        )}
      </Rail>
    </div>
  );
}
