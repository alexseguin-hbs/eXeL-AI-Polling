"use client";

/**
 * ARCHITECT-2525 · PHASE MODE BAR (operator 2026-10-25: "there needs to be modes of phases of development").
 * A horizontal, build-ordered row of the eight development phases. Tap one to enter that MODE: the model shows
 * that phase's system layer (for the four with a wireframe layer) and a spec card names the phase + its specs.
 * Tap the active phase again to clear. Pure presentational; the parent owns the selection + drives the toggles.
 */
import { DEV_PHASES, phaseById } from "@/lib/architect-phases";
import { Layers, Frame, Zap, Droplets, Waves, Wifi, Camera, Triangle, type LucideIcon } from "lucide-react";

const ICON: Record<string, LucideIcon> = {
  layers: Layers, frame: Frame, zap: Zap, droplets: Droplets, waves: Waves, wifi: Wifi, camera: Camera, triangle: Triangle,
};
const C = { border: "#1e2b3a", dim: "#5f7186", text: "#c8d6e5", panel: "#0a0f16" };

export function PhaseBar({ phase, onSelect }: { phase: string | null; onSelect: (id: string | null) => void }) {
  const active = phaseById(phase);
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
        <div data-arch-phase-spec className="rounded-lg border p-2" style={{ borderColor: `${active.color}66`, background: C.panel }}>
          <div className="flex items-center gap-1.5">
            {(() => { const Icon = ICON[active.icon] ?? Layers; return <Icon className="h-3.5 w-3.5" style={{ color: active.color }} />; })()}
            <span className="text-[12px] font-bold" style={{ color: active.color }}>Phase {active.order} · {active.label}</span>
            <span className="ml-auto text-[9px] uppercase tracking-wider" style={{ color: C.dim }}>
              {active.shows ? `showing · ${active.shows}` : "spec"}
            </span>
          </div>
          <p className="mt-1 text-[11.5px]" style={{ color: C.text }}>{active.blurb}</p>
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
  );
}
