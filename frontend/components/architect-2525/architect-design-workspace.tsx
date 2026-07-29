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
import { useViewport } from "@/lib/use-viewport";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2 } from "lucide-react";
import { AlvarMark } from "./alvar-mark";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc" };

// ONE canonical "•••" expander — three cyan bullets stacked right over each other. Every Design-view expander
// (Vision Tree / Active Elements rails · B1/B2 bottom menus) renders THIS so the dots are pixel-identical
// (operator IMG_7606: "copy ••• Active Elements as basis for the expandable menus beneath them").
function Dots3() {
  return (
    <span className="flex flex-col items-center gap-[3px]">
      {[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 rounded-full" style={{ background: C.cyan }} />)}
    </span>
  );
}
// Security-2525 "•••" collapse control (Toggle3) — the Dots3 stack as a button.
function Toggle3({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} data-arch-rail-toggle
      className="rounded p-1 hover:bg-white/10"><Dots3 /></button>
  );
}

function Rail({ side, title, open, setOpen, children, titleIcon }: {
  side: "left" | "right"; title: string; open: boolean; setOpen: (b: boolean) => void; children: ReactNode; titleIcon?: ReactNode;
}) {
  // Design primary accent = AI cyan (matches Mission Planning). The Vision Tree (left) rail title reads in cyan.
  const titleColor = side === "left" ? C.cyan : C.dim;
  if (!open) {
    // Collapsed rail — Security mission-planning parity (mission-planning.tsx:5670-5674 / :5795-5799): a bordered
    // pill that is a full-width HORIZONTAL bar on narrow/portrait (<md) and a 56px VERTICAL rail on wide/landscape
    // (≥md). The label stays visible in BOTH (writing-mode horizontal-tb → vertical-rl); the whole pill re-opens the
    // rail. Matches operator refs: IMG_7401 (landscape vertical rails) + IMG_7399 (portrait horizontal bar).
    return (
      <button data-arch-rail-collapsed={side} onClick={() => setOpen(true)} title={`Show ${title}`}
        className="relative flex w-full shrink-0 flex-row items-center rounded-lg border px-1.5 py-1 hover:bg-white/5 md:w-[30px] md:flex-col md:items-center md:justify-center md:gap-1.5 md:self-start md:px-0.5 md:py-2"
        style={{ background: C.panel, borderColor: C.border }}>
        {/* portrait: ••• PINNED to the fixed-left column (left-3) shared by the bottom expanders so they line up in
            BOTH portrait and landscape (operator IMG_7613/7614). landscape (≥md): static, vertical rail. */}
        <span data-arch-rail-toggle className="absolute left-3 top-1/2 -translate-y-1/2 md:static md:translate-y-0"><Dots3 /></span>
        <span className="flex items-center gap-2 pl-6 md:flex-col md:gap-1.5 md:pl-0">
          {titleIcon}
          <span data-arch-rail-label={side} className="text-[8px] font-semibold uppercase tracking-wider [writing-mode:horizontal-tb] md:[writing-mode:vertical-rl]"
            style={{ color: titleColor }}>{title}</span>
        </span>
      </button>
    );
  }
  return (
    <div className="flex min-h-0 shrink-0 flex-col gap-2 md:w-64">
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border shadow-xl" style={{ background: C.panel, borderColor: C.border }}>
        <div className="flex items-center justify-between border-b p-1.5" style={{ borderColor: C.border }}>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: titleColor }}>
            {titleIcon}{title}
          </span>
          <Toggle3 onClick={() => setOpen(false)} title={`Collapse ${title}`} />
        </div>
        <div data-arch-rail={side} className="overflow-y-auto p-2" style={{ maxHeight: "72vh" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// B1/B2 bottom expandable — Security-2525 parity: collapses to a CENTERED ••• (Toggle3 horizontal), title left,
// and a MAXIMIZE control (right) that portals the panel full-screen over the nav (operator IMG_7418 — reuses the
// mini-panel.tsx createPortal pattern so `fixed inset-0` covers the TRUE viewport, not trapped below the shell).
function BottomPanel({ id, title, accent, open, setOpen, children }: {
  id: string; title: string; accent: string; open: boolean; setOpen: (b: boolean) => void; children: ReactNode;
}) {
  const [max, setMax] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (max) {
    const full = (
      <div data-arch-bpanel={id} data-arch-bpanel-max="1" className="fixed inset-0 z-[120] flex flex-col overflow-hidden border-2"
        style={{ background: "#05070d", borderColor: C.cyan }}>
        <div className="flex shrink-0 items-center justify-between border-b px-3 py-2" style={{ borderColor: C.cyan }}>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}>{title}</span>
          <button data-bpanel-max={id} onClick={() => setMax(false)} title="Minimize" aria-label="Minimize"
            className="flex items-center gap-1 rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.cyan, color: C.cyan }}>
            <Minimize2 className="h-3 w-3" /> Minimize
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    );
    return mounted ? createPortal(full, document.body) : full;
  }

  return (
    <div data-arch-bpanel={id} className="rounded-lg border shadow-xl" style={{ background: C.panel, borderColor: C.border }}>
      {/* ••• PINNED to a FIXED LEFT inset (left-3) so every expander's ••• line up in ONE vertical column in BOTH
          phone-portrait and landscape — no longer viewport-width-dependent (operator IMG_7613/7614).
          Title reads to the right (pl-6); maximize stays pinned absolute-right. */}
      <div className="relative flex items-center px-3 py-1.5" style={{ borderBottom: open ? `1px solid ${C.border}` : "1px solid transparent" }}>
        <button data-bpanel-toggle={id} onClick={() => setOpen(!open)} title={open ? "Collapse" : "Expand"}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-white/5"><Dots3 /></button>
        <span className="pl-6 text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>{title}</span>
        {/* Maximize is only offered once the panel is EXPANDED — you can't full-screen a collapsed panel (operator). */}
        {open && (
          <button data-bpanel-max={id} onClick={() => { setMax(true); setOpen(true); }} title="Maximize to full screen" aria-label="Maximize"
            className="absolute right-3 rounded p-1 hover:bg-white/10"><Maximize2 className="h-3 w-3" style={{ color: C.dim }} /></button>
        )}
      </div>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

export function DesignWorkspace({ leftRail, rightRail, bottomPanel, bottomPanel2, children, selectedId, metricStrip }: {
  leftRail?: ReactNode; rightRail?: ReactNode; bottomPanel?: ReactNode; bottomPanel2?: ReactNode; children: ReactNode; selectedId?: string | null; metricStrip?: ReactNode;
}) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false); // Context opens on selection (C5); collapsed keeps the engine wide
  const [b1Open, setB1Open] = useState(true);        // B1 Planning·Scheduling·Cost — open by default
  const [b2Open, setB2Open] = useState(false);       // B2 Approvals·Codes — expand on demand
  // "Selecting any item in the Layer Tree opens the Right Context Panel" — auto-open on a new selection.
  useEffect(() => { if (selectedId) setRightOpen(true); }, [selectedId]);
  // F6 — responsive parity (matches SoI-2525 / Security-2525): react to viewport class + orientation. On a
  // phone in PORTRAIT the engine needs the full width, so auto-collapse the left rail; restore it on
  // landscape / larger viewports. Keyed on the transition so it never fights a manual toggle mid-orientation.
  const vp = useViewport();
  const phonePortrait = vp.isPhone && vp.orientation === "portrait";
  useEffect(() => { setLeftOpen(!phonePortrait); }, [phonePortrait]);
  return (
    <div className="flex flex-col gap-2">
      {/* Width breakpoint (md = 768px), NOT orientation: on desktop/tablet the tree sits to the LEFT of the
          engine in one row; below md it stacks vertically (phones). No flex-wrap — wrapping let the engine
          drop BELOW the tree on some desktop windows (the reported "tree above the design window" bug).
          F6: data-orientation / data-vpclass stamp the shared viewport contract for CSS + parity. */}
      <div data-arch-design-ws data-orientation={vp.orientation} data-vpclass={vp.aspectClass} className="flex flex-col gap-2 md:flex-row md:items-stretch">
      <Rail side="left" title="Vision Tree" open={leftOpen} setOpen={setLeftOpen}
        titleIcon={<AlvarMark color={C.cyan} size={16} title="Alvar — guardian of the Vision Tree" />}>
        {leftRail ?? (
          <div className="text-[10px] leading-relaxed" style={{ color: C.dim }}>
            <span className="font-semibold" style={{ color: C.violet }}>Vision Tree</span> — the physical Digital Twin.
            <div className="mt-1">Hierarchy renders here (C2+).</div>
          </div>
        )}
      </Rail>
      <div data-arch-engine className="relative min-w-0 flex-1">
        {children}
        {/* F4 — when the Active Items rail is collapsed, the key housing metrics ride ONTO the map. */}
        {!rightOpen && metricStrip}
      </div>
      <Rail side="right" title="Active Elements" open={rightOpen} setOpen={setRightOpen}>
        {rightRail ?? (
          <div className="text-[10px] leading-relaxed" style={{ color: C.dim }}>
            Select a layer to inspect its properties, Level&nbsp;3 Cubes, and linked records (C5).
          </div>
        )}
      </Rail>
    </div>
      {/* BOTTOM B1 / B2 — two stacked expandables, each collapsing to a centered ••• (Security parity). */}
      {bottomPanel && (
        <BottomPanel id="b1" title="Planning · Scheduling · Cost" accent={C.violet} open={b1Open} setOpen={setB1Open}>{bottomPanel}</BottomPanel>
      )}
      {bottomPanel2 && (
        <BottomPanel id="b2" title="Approvals · Codes" accent={C.cyan} open={b2Open} setOpen={setB2Open}>{bottomPanel2}</BottomPanel>
      )}
    </div>
  );
}
