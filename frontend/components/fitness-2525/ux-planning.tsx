"use client";

/** FITNESS-2525 · Command UX 1 — PLANNING / ENERGY selected-session panel. */
import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import type { FitWorkout } from "@/lib/fitness-2525/types";
import { type EnergyRateUnit, type workoutBurnRates, pickRate, formatCalRate } from "@/lib/fitness-2525/energy";
import { C } from "./ux-helpers";
import { Panel } from "./ux-widgets";

export function SessionPanel({
  selected, selectedBurn, rateUnit, toggleWorkout, btnGhost,
}: {
  selected: FitWorkout;
  selectedBurn: ReturnType<typeof workoutBurnRates> | null;
  rateUnit: EnergyRateUnit;
  toggleWorkout: (id: string) => void;
  btnGhost: CSSProperties;
}) {
  return (
    <Panel title={`SESSION · ${(selected.title || selected.type).toUpperCase()}`} accent={C.cyan}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="text-[12px]" style={{ color: C.text }}>
          <div className="font-semibold uppercase">{selected.type} · {selected.status}</div>
          <div className="mt-1 text-[10px]" style={{ color: C.dim }}>{selected.notes || "—"}</div>
          <div className="mt-1 text-[10px] font-mono" style={{ color: C.gold }}>
            {selected.distance ? `${selected.distance.value} ${selected.distance.unit}` : "dist —"}
            {" · "}
            {selected.minutes != null ? `${selected.minutes} min` : "min —"}
            {" · burn "}
            {formatCalRate(selectedBurn ? pickRate(selectedBurn, rateUnit) : null, rateUnit)}
          </div>
        </div>
        <button type="button" style={btnGhost} onClick={() => toggleWorkout(selected.id)}>
          {selected.status === "completed" ? <><Check className="mr-1 inline h-3 w-3" /> COMPLETED</> : "MARK DONE"}
        </button>
      </div>
    </Panel>
  );
}
