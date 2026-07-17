"use client";

/**
 * ARCHITECT-2525 · BUILDING PROGRAM — the element-counting inspector (V2).
 * =================================================================================================
 * Icon-led, expandable counts a homeowner/trade needs, computed live by `programMetrics` from the
 * whole-house params + the editable room program. 🛏 Bedrooms (→ sqft/room · volume for cooling) ·
 * 🛁 Bathrooms · 📏 Sq Ft · ⚡ Electric (service A/V · HVAC tons · appliance kW) · 🚰 Plumbing
 * (fixture units · water/sewer pipe size · valves · fittings — so a plumber can estimate).
 */
import { useState } from "react";
import { Bed, Bath, Ruler, Zap, Droplets, ChevronRight } from "lucide-react";
import { programMetrics } from "@/lib/room-program";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", panel2: "#0c1420", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e", gold: "#ffd400" };

function Stepper({ v, min, max, on }: { v: number; min: number; max: number; on: (n: number) => void }) {
  return (
    <span className="flex items-center gap-1">
      <button onClick={() => on(Math.max(min, v - 1))} className="rounded border px-1 leading-none" style={{ borderColor: C.border, color: C.text }}>−</button>
      <span className="w-4 text-center tabular-nums" style={{ color: C.text }}>{v}</span>
      <button onClick={() => on(Math.min(max, v + 1))} className="rounded border px-1 leading-none" style={{ borderColor: C.border, color: C.text }}>+</button>
    </span>
  );
}

export function BuildingProgram({ state }: { state: LayerState }) {
  const m = programMetrics(state.globalParams, state.program);
  const [open, setOpen] = useState<Record<string, boolean>>({ bedrooms: true });
  const tog = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const Chevron = ({ k }: { k: string }) => <ChevronRight className="h-3 w-3 shrink-0 transition-transform" style={{ color: C.dim, transform: open[k] ? "rotate(90deg)" : "none" }} />;
  const Sub = ({ k, v, c }: { k: string; v: string; c?: string }) => (
    <div className="flex items-center justify-between gap-2"><span style={{ color: C.dim }}>{k}</span><span className="tabular-nums" style={{ color: c ?? C.text }}>{v}</span></div>
  );

  return (
    <div data-arch-building-program className="rounded-lg border" style={{ borderColor: C.border }}>
      <div className="border-b px-2 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: C.border, color: C.cyan }}>Building Program</div>
      <div className="flex flex-col text-[10px]">

        {/* 🛏 Bedrooms — editable; expand → sqft/room + volume (cooling) */}
        <div data-program-row="bedrooms" className="border-b px-2 py-1" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Bed className="h-3.5 w-3.5 shrink-0" style={{ color: C.violet }} />
            <button onClick={() => tog("bedrooms")} className="flex flex-1 items-center gap-1 text-left"><span className="flex-1">Bedrooms</span><Chevron k="bedrooms" /></button>
            <Stepper v={m.bedrooms} min={1} max={12} on={(n) => state.setProgram({ bedrooms: n })} />
          </div>
          {open.bedrooms && (
            <div className="mt-1 flex flex-col gap-0.5 pl-5">
              <Sub k="Sq ft / room" v={`${m.perBedroomSqft.toLocaleString()} ft²`} c={C.text} />
              <div data-program-bedvol className="flex items-center justify-between gap-2"><span style={{ color: C.dim }}>Room volume</span><span className="tabular-nums" style={{ color: C.cyan }}>{m.bedroomVolumeFt3.toLocaleString()} ft³ <span style={{ color: C.dim }}>· cooling</span></span></div>
            </div>
          )}
        </div>

        {/* 🛁 Bathrooms — editable */}
        <div data-program-row="bathrooms" className="flex items-center gap-2 border-b px-2 py-1" style={{ borderColor: C.border }}>
          <Bath className="h-3.5 w-3.5 shrink-0" style={{ color: C.violet }} />
          <span className="flex-1">Bathrooms</span>
          <Stepper v={m.bathrooms} min={1} max={10} on={(n) => state.setProgram({ bathrooms: n })} />
        </div>

        {/* 📏 Square feet — gross · usable (read-only, from params) */}
        <div data-program-row="sqft" className="flex items-center gap-2 border-b px-2 py-1" style={{ borderColor: C.border }}>
          <Ruler className="h-3.5 w-3.5 shrink-0" style={{ color: C.violet }} />
          <span className="flex-1">Square feet</span>
          <span className="tabular-nums" style={{ color: C.text }}>{m.grossSqft.toLocaleString()} <span style={{ color: C.dim }}>gross · {m.usableSqft.toLocaleString()} usable</span></span>
        </div>

        {/* ⚡ Electric — service · HVAC · appliances */}
        <div data-program-row="electric" className="border-b px-2 py-1" style={{ borderColor: C.border }}>
          <button onClick={() => tog("electric")} className="flex w-full items-center gap-2 text-left">
            <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: C.gold }} />
            <span className="flex-1">Electric</span>
            <span className="tabular-nums" style={{ color: C.gold }}>{m.electrical.serviceAmps}A · {m.electrical.voltage}V</span>
            <Chevron k="electric" />
          </button>
          {open.electric && (
            <div data-program-electric className="mt-1 flex flex-col gap-0.5 pl-5">
              <Sub k="Service" v={`${m.electrical.serviceAmps} A @ ${m.electrical.voltage} V`} c={C.gold} />
              <Sub k="HVAC sizing" v={`${m.electrical.hvacTons} ton`} c={C.cyan} />
              <Sub k="Appliance load (est)" v={`${m.electrical.applianceKw} kW`} />
            </div>
          )}
        </div>

        {/* 🚰 Plumbing — water · sewer · pipe/fittings/valves */}
        <div data-program-row="plumbing" className="px-2 py-1">
          <button onClick={() => tog("plumbing")} className="flex w-full items-center gap-2 text-left">
            <Droplets className="h-3.5 w-3.5 shrink-0" style={{ color: C.cyan }} />
            <span className="flex-1">Plumbing</span>
            <span className="tabular-nums" style={{ color: C.cyan }}>{m.plumbing.fixtureUnits} WSFU</span>
            <Chevron k="plumbing" />
          </button>
          {open.plumbing && (
            <div data-program-plumbing className="mt-1 flex flex-col gap-0.5 pl-5">
              <Sub k="Water supply pipe" v={m.plumbing.waterPipeIn} c={C.cyan} />
              <Sub k="Sewer / drain pipe" v={m.plumbing.sewerPipeIn} c={C.cyan} />
              <Sub k="Valves · fittings" v={`${m.plumbing.valves} · ${m.plumbing.fittings}`} />
              <div className="text-[8px]" style={{ color: C.dim }}>Rough takeoff so a plumber can estimate — verify against local code.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
