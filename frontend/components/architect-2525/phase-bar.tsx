"use client";

/**
 * ARCHITECT-2525 · PHASE MODE BAR (operator 2026-10-25: "there needs to be modes of phases of development").
 * A horizontal, build-ordered row of the eleven development phases (DEV_PHASES — the ONE order source; the Design bar
 * therefore matches the Simulate/Build order, roofing right after framing). Tap one to enter that MODE: the model shows
 * that phase's system layer (for the four with a wireframe layer) and a spec card names the phase + its specs.
 * Tap the active phase again to clear. Pure presentational; the parent owns the selection + drives the toggles.
 */
import { useState } from "react";
import { DEV_PHASES, phaseById } from "@/lib/architect-phases";
import { Layers, Frame, Zap, Droplets, Waves, Wifi, Camera, Triangle, Shield, Paintbrush, Sofa, Wind, type LucideIcon } from "lucide-react";

const ICON: Record<string, LucideIcon> = {
  layers: Layers, frame: Frame, zap: Zap, droplets: Droplets, waves: Waves, wifi: Wifi, camera: Camera, triangle: Triangle,
  shield: Shield, paintbrush: Paintbrush, sofa: Sofa, wind: Wind,
};
const C = { border: "#1e2b3a", dim: "#5f7186", text: "#c8d6e5", panel: "#0a0f16" };
const CARD_KEY = "arch2525.phaseCardOpen";

export function PhaseBar({ phase, onSelect, compact = false }: { phase: string | null; onSelect: (id: string | null) => void; compact?: boolean }) {
  const active = phaseById(phase);
  // E2 (operator 2026-11-06: "the viewer screen is number one most critical UX") — the spec card is COLLAPSIBLE and
  // defaults COLLAPSED to one line, giving the reclaimed height to the viewer/walk. Persisted.
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(CARD_KEY) === "1"; } catch { return false; }
  });
  const [sheet, setSheet] = useState(false); // WALK-07: the compact phase picker (bottom sheet) in the walk
  const toggle = () => setOpen((o) => { const n = !o; try { localStorage.setItem(CARD_KEY, n ? "1" : "0"); } catch {} return n; });
  const ActiveIcon = active ? (ICON[active.icon] ?? Layers) : Layers;
  // WALK-07 — in the walk the VIEWER is the hero: ONE 28px chip (no phase row, no spec card) that opens the 11-phase list.
  if (compact) {
    return (
      <div data-arch-phase-bar data-arch-phase-compact="1" className="mb-1">
        <button data-arch-phase-chip onClick={() => setSheet((s) => !s)} aria-expanded={sheet}
          className="flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold"
          style={{ borderColor: active ? active.color : C.border, color: active ? active.color : C.dim, background: active ? `${active.color}1f` : "transparent" }}>
          <ActiveIcon className="h-3.5 w-3.5" />
          {active ? `Phase ${active.order} · ${active.label}` : "Phase"}
          <span className="text-[10px]" style={{ opacity: 0.8 }}>{sheet ? "▴" : "▾"}</span>
        </button>
        {sheet && (
          <div data-arch-phase-sheet className="mt-1 flex flex-wrap gap-1 rounded-lg border p-1.5" style={{ borderColor: C.border, background: C.panel }}>
            {DEV_PHASES.map((p) => {
              const Icon = ICON[p.icon] ?? Layers; const on = p.id === phase;
              return (
                <button key={p.id} data-arch-phase={p.id} onClick={() => { onSelect(on ? null : p.id); setSheet(false); }} title={p.blurb}
                  className="flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ borderColor: on ? p.color : C.border, color: on ? p.color : C.dim, background: on ? `${p.color}1f` : "transparent" }}>
                  <span className="tabular-nums" style={{ opacity: 0.7 }}>{p.order}</span><Icon className="h-3 w-3" />{p.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  return (
    <div data-arch-phase-bar className="mb-1">
      <div className="mb-1 flex items-center gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        <span className="shrink-0 pr-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Phase</span>
        {DEV_PHASES.map((p) => {
          const Icon = ICON[p.icon] ?? Layers;
          const on = p.id === phase;
          return (
            <button key={p.id} data-arch-phase={p.id} onClick={() => onSelect(on ? null : p.id)} title={p.blurb}
              className="flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ borderColor: on ? p.color : C.border, color: on ? p.color : C.dim, background: on ? `${p.color}1f` : "transparent" }}>
              <span className="tabular-nums" style={{ opacity: 0.7 }}>{p.order}</span>
              <Icon className="h-3 w-3" />
              {p.label}
            </button>
          );
        })}
      </div>
      {active && (
        <div data-arch-phase-spec data-arch-phase-open={open ? "1" : "0"} className="rounded-lg border" style={{ borderColor: `${active.color}66`, background: C.panel }}>
          {/* collapsed one-line header — tap to expand the specs (the viewer keeps the height when collapsed) */}
          <button data-arch-phase-card-toggle onClick={toggle} aria-expanded={open}
            className="flex w-full items-center gap-1.5 px-2 py-1 text-left">
            <ActiveIcon className="h-3.5 w-3.5 shrink-0" style={{ color: active.color }} />
            <span className="text-[12px] font-bold" style={{ color: active.color }}>Phase {active.order} · {active.label}</span>
            <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wider" style={{ color: C.dim }}>
              {active.shows ? `showing · ${active.shows}` : "spec"}
            </span>
            <span className="shrink-0 text-[10px]" style={{ color: C.dim }}>{open ? "▾" : "▸"}</span>
          </button>
          {open && (
            <div className="border-t px-2 pb-2 pt-1.5" style={{ borderColor: `${active.color}33` }}>
              <p className="text-[11.5px]" style={{ color: C.text }}>{active.blurb}</p>
              <ul className="mt-1.5 space-y-0.5">
                {active.specs.map((s, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px]" style={{ color: C.text }}>
                    <span style={{ color: active.color }}>·</span><span className="min-w-0 flex-1">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
