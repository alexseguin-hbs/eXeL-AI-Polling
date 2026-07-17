"use client";

/**
 * ARCHITECT-2525 · HOUSE SCHEMATIC — a cross-section that ASSEMBLES as you select components (R6).
 * Each install phase draws its part of the house (site → foundation → framing → envelope → MEP → finish).
 * Present phases render solid in their phase color; not-yet-chosen phases render as a faint dashed ghost —
 * so "wireframe your house by selecting what you want" is literal and visual.
 */
import { houseEstimate, specLeafIds, componentEstimate, PHASES, type Phase } from "@/lib/architect-house";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", dim: "#5f7186", text: "#c8d6e5" };
const COLOR: Record<Phase, string> = Object.fromEntries(PHASES.map((p) => [p.id, p.color])) as Record<Phase, string>;

// Inc 3 — the schematic is a "model": clicking a phase selects a component of it (model→tree→panel), and
// the phase owning the selected asset is highlighted (tree→model).
export function HouseSchematic({ state, selectedId, onSelect }: { state: LayerState; selectedId?: string | null; onSelect?: (id: string) => void }) {
  const est = houseEstimate(Array.from(state.spec));
  const present = new Set<Phase>(est.byPhase.map((p) => p.phase));
  const specLeaves = specLeafIds(Array.from(state.spec));
  const phaseLeaf = (ph: Phase): string | null => specLeaves.find((id) => componentEstimate(id)?.phase === ph) ?? null;
  const selPhase: Phase | null = selectedId ? componentEstimate(selectedId)?.phase ?? null : null;
  const pick = (ph: Phase) => { const leaf = phaseLeaf(ph); if (leaf && onSelect) { onSelect(leaf); state.logReplay("select.model", `phase:${ph}`); } };

  // Draw a layer either solid (chosen) or as a faint dashed ghost (not yet chosen); selected phase is emphasized.
  const on = (ph: Phase) => present.has(ph);
  const stroke = (ph: Phase) => (on(ph) ? COLOR[ph] : "#2b3d52");
  const fill = (ph: Phase, o = 0.18) => (on(ph) ? `${COLOR[ph]}${Math.round(o * 255).toString(16).padStart(2, "0")}` : "transparent");
  const dash = (ph: Phase) => (on(ph) ? undefined : "2 2");
  const sw = 0.8;

  return (
    <div className="flex flex-col gap-1">
    <svg data-arch-schematic viewBox="0 0 120 96" className="w-full" style={{ maxWidth: 200, height: "auto" }} role="img" aria-label="House cross-section assembling from chosen components">
      {/* SITE — ground line */}
      <line x1="4" y1="84" x2="116" y2="84" stroke={stroke("site")} strokeWidth={on("site") ? 1.4 : sw} strokeDasharray={dash("site")} />
      {on("site") && <rect x="4" y="84" width="112" height="4" fill={fill("site", 0.5)} />}

      {/* FOUNDATION — slab + footings */}
      <rect x="24" y="76" width="72" height="8" fill={fill("foundation", 0.35)} stroke={stroke("foundation")} strokeWidth={sw} strokeDasharray={dash("foundation")} />

      {/* FRAMING — walls + floor + roof truss */}
      <g stroke={stroke("framing")} strokeWidth={sw} strokeDasharray={dash("framing")} fill="none">
        <rect x="28" y="44" width="64" height="32" fill={fill("framing", 0.1)} />
        <polygon points="24,44 60,24 96,44" fill={fill("framing", 0.12)} />
        {on("framing") && [38, 50, 60, 70, 82].map((x) => <line key={x} x1={x} y1="44" x2={x} y2="76" strokeWidth={0.4} />)}
      </g>

      {/* ENVELOPE — outer skin + roof covering */}
      <g stroke={stroke("envelope")} strokeWidth={on("envelope") ? 1.4 : sw} strokeDasharray={dash("envelope")} fill="none">
        <polyline points="22,45 60,22 98,45" />
        <line x1="26" y1="45" x2="26" y2="76" />
        <line x1="94" y1="45" x2="94" y2="76" />
      </g>

      {/* MEP — service runs (electrical dot + plumbing stack) */}
      {on("mep") && (
        <g>
          <line x1="60" y1="44" x2="60" y2="76" stroke={COLOR.mep} strokeWidth={0.6} strokeDasharray="1 1.5" />
          <circle cx="46" cy="58" r="1.6" fill={COLOR.mep} />
          <line x1="74" y1="52" x2="74" y2="74" stroke={COLOR.mep} strokeWidth={1} />
        </g>
      )}

      {/* FINISH — interior floor + a door + a window */}
      <g stroke={stroke("finish")} strokeWidth={sw} strokeDasharray={dash("finish")}>
        <line x1="28" y1="70" x2="92" y2="70" fill="none" />
        <rect x="54" y="60" width="8" height="16" fill={fill("finish", 0.5)} />
        <rect x="34" y="52" width="10" height="9" fill={fill("finish", 0.3)} />
      </g>

      {/* selected-phase highlight ring (tree → model) */}
      {selPhase && on(selPhase) && <rect x="20" y="20" width="80" height="66" fill="none" stroke={COLOR[selPhase]} strokeWidth="0.6" strokeDasharray="3 2" rx="2" opacity="0.9" />}

      {/* phase legend chips */}
      {PHASES.map((p, i) => (
        <g key={p.id} opacity={on(p.id) ? 1 : 0.35}>
          <rect x={4 + i * 19.5} y={90} width={3} height={3} fill={p.color} rx={0.5} />
        </g>
      ))}
    </svg>
    {/* clickable phase chips — the "model" is selectable (model → tree → right panel) */}
    <div data-schematic-chips className="flex flex-wrap gap-1" style={{ maxWidth: 200 }}>
      {PHASES.filter((p) => present.has(p.id)).map((p) => (
        <button key={p.id} data-schematic-phase={p.id} onClick={() => pick(p.id)} title={`Select a ${p.label} component`}
          className="rounded border px-1 py-0.5 text-[7px] font-semibold uppercase"
          style={{ borderColor: selPhase === p.id ? p.color : C.border, color: p.color, background: selPhase === p.id ? "#152238" : "transparent" }}>
          {p.label}
        </button>
      ))}
    </div>
    </div>
  );
}
