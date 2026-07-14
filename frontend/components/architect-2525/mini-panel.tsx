"use client";

/**
 * MINI PANEL — a modular, draggable, resizable window that mimics the Security-2525 Mini-Map chrome:
 * "⠿ Drag" grip header · maximize · collapse · R-CORE capability lanes (COMM·EDGE·SYNC·LINK·UCRS) · a
 * coordinate line · a bottom-right resize handle · cyan border. Domain-neutral (2525-core candidate) —
 * the content is supplied through a render-prop that receives the current square content size in px, so
 * a globe / map / any square view fits the panel as it is resized. Drag lives only on the header and
 * resize only on the corner, so the content keeps its own pointer interactions (e.g. globe rotate).
 */
import { useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { RCORE_LANES } from "@/components/security-2525/rcore";

const C = { panel: "#0c1420", border: "#1e2b3a", dim: "#5f7186", cyan: "#19c8cf", text: "#c8d6e5" };

export function MiniPanel({ title, subtitle, coord, lanes = true, defaultW = 176, defaultH = 208, minW = 132, minH = 156, render }: {
  title: string; subtitle?: string; coord?: string; lanes?: boolean;
  defaultW?: number; defaultH?: number; minW?: number; minH?: number;
  render: (contentSize: number) => ReactNode;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // null = docked bottom-right of the map
  const [size, setSize] = useState({ w: defaultW, h: defaultH });
  const [open, setOpen] = useState(true);
  const [max, setMax] = useState(false);
  const grip = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const rez = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const gripDown = (e: React.PointerEvent) => { grip.current = { x: e.clientX, y: e.clientY, px: pos?.x ?? (e.currentTarget as HTMLElement).getBoundingClientRect().left, py: pos?.y ?? (e.currentTarget as HTMLElement).getBoundingClientRect().top }; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); };
  const gripMove = (e: React.PointerEvent) => { const g = grip.current; if (!g) return; setPos({ x: g.px + (e.clientX - g.x), y: g.py + (e.clientY - g.y) }); };
  const gripUp = () => { grip.current = null; };
  const rezDown = (e: React.PointerEvent) => { e.stopPropagation(); rez.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); };
  const rezMove = (e: React.PointerEvent) => { const r = rez.current; if (!r) return; setSize({ w: Math.max(minW, r.w + (e.clientX - r.x)), h: Math.max(minH, r.h + (e.clientY - r.y)) }); };
  const rezUp = () => { rez.current = null; };

  if (!open) {
    return (
      <button data-mini-panel-toggle onClick={() => setOpen(true)} title={`Show ${title}`}
        className="flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-semibold shadow-lg" style={{ borderColor: C.border, color: C.dim, background: "#0a0f16dd" }}>▾ {title}</button>
    );
  }

  const W = max ? "min(92vw, 520px)" : size.w, H = max ? "min(80vh, 560px)" : size.h;
  const contentSize = max ? 360 : Math.max(minW - 16, Math.min(size.w - 12, size.h - (lanes ? 78 : 58)));

  return (
    <div data-mini-panel className={max ? "fixed z-[85] flex flex-col overflow-hidden rounded-lg border-2 shadow-2xl" : pos ? "fixed z-[70] flex flex-col overflow-hidden rounded-lg border-2 shadow-2xl" : "flex flex-col overflow-hidden rounded-lg border-2 shadow-2xl"}
      style={{ ...(max ? { left: "4vw", top: "8vh" } : pos ? { left: pos.x, top: pos.y } : {}), width: W, height: H, borderColor: C.cyan, background: C.panel }}>
      {/* ⠿ Drag grip header — move the panel anywhere; ⛶ maximize · ▾ collapse · ⌂ dock back */}
      <div onPointerDown={gripDown} onPointerMove={gripMove} onPointerUp={gripUp} onPointerCancel={gripUp}
        className="flex shrink-0 cursor-move touch-none select-none items-center justify-between border-b px-1.5 py-0.5" style={{ background: "#0c1420", borderColor: C.cyan }}>
        <span className="flex-1 truncate text-[8px] font-bold tracking-wider" style={{ color: C.dim }}>⠿ Drag {title}</span>
        <div className="flex items-center gap-0.5">
          {pos && !max && <button onClick={() => setPos(null)} onPointerDown={(e) => e.stopPropagation()} title="Dock back" className="rounded border px-1 text-[8px] font-bold" style={{ borderColor: C.border, color: C.dim }}>⌂</button>}
          <button data-mini-panel-max onClick={() => setMax((v) => !v)} onPointerDown={(e) => e.stopPropagation()} title={max ? "Restore" : "Maximize"} className="rounded border p-0.5" style={{ borderColor: C.border, color: C.dim }}>{max ? <Minimize2 className="h-2.5 w-2.5" /> : <Maximize2 className="h-2.5 w-2.5" />}</button>
          <button onClick={() => setOpen(false)} onPointerDown={(e) => e.stopPropagation()} title="Collapse" className="rounded border px-1 text-[8px] font-bold" style={{ borderColor: C.border, color: C.dim }}>▾</button>
        </div>
      </div>
      {/* title · subtitle */}
      <div className="flex shrink-0 items-center justify-between px-1.5 pt-0.5 text-[8px]" style={{ color: C.cyan, fontFamily: "monospace" }}>
        <span className="font-bold tracking-wider">{title}</span>{subtitle && <span style={{ color: C.dim }}>{subtitle}</span>}
      </div>
      {/* R-CORE capability lanes */}
      {lanes && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-0 px-1.5 py-0.5 text-[7px] font-bold tracking-wide">
          <span style={{ color: C.dim }}>R-CORE</span>
          {RCORE_LANES.map((l) => <span key={l.key} title={l.def} style={{ color: l.color }}>{l.label}</span>)}
        </div>
      )}
      {/* content (globe / map) — sized to the panel */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">{render(contentSize)}</div>
      {/* coordinate line */}
      {coord && <div className="shrink-0 truncate px-1.5 pb-0.5 text-[7px]" style={{ color: C.dim, fontFamily: "monospace" }}>{coord} 🔒</div>}
      {/* resize handle ◢ */}
      {!max && <div data-mini-panel-resize onPointerDown={rezDown} onPointerMove={rezMove} onPointerUp={rezUp} onPointerCancel={rezUp}
        title="Drag to resize" className="absolute bottom-0 right-0 z-10 flex h-4 w-4 cursor-nwse-resize touch-none items-end justify-end pb-0.5 pr-0.5" style={{ color: C.cyan }}>◢</div>}
    </div>
  );
}
