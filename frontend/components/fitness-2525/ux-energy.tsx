"use client";

/** FITNESS-2525 · Command UX 1 — ENERGY UNITS hero (rate-unit settings) + REAL-TIME ENERGY chart panel. */
import type { CSSProperties } from "react";
import { Settings } from "lucide-react";
import type { FitDay } from "@/lib/fitness-2525/types";
import { type EnergyRateUnit, type ratesFromKcal, formatCalRate } from "@/lib/fitness-2525/energy";
import { RATE_UNIT_ORDER, RATE_UNIT_LABEL } from "@/lib/fitness-2525/profile";
import styles from "./fitness-2525.module.css";
import { C, blankNum, type DayField } from "./ux-helpers";
import { EnergyChart, Panel } from "./ux-widgets";

type Rates = ReturnType<typeof ratesFromKcal>;
export type ChartSpan = "1x" | "1D" | "1W" | "30D";

export function EnergyUnitsCard({
  day, owner, rateUnit, setRateUnit, showAllRates, setShowAllRates, settingsOpen, setSettingsOpen,
  fuelPer, burnPer, netPer, deficit, delta, coachBusy, runCoach, btnPrimary,
}: {
  day: FitDay;
  owner: string | null;
  rateUnit: EnergyRateUnit;
  setRateUnit: (u: EnergyRateUnit) => void;
  showAllRates: boolean;
  setShowAllRates: (on: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (fn: (o: boolean) => boolean) => void;
  fuelPer: number | null;
  burnPer: number | null;
  netPer: number | null;
  deficit: boolean;
  delta: number | null;
  coachBusy: boolean;
  runCoach: (focus: "workout" | "nutrition" | "both") => void;
  btnPrimary: CSSProperties;
}) {
  return (
    <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${C.cyan}66`, background: `${C.cyan}08` }} data-fit-accrual>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>ENERGY UNITS</div>
        <div className="flex items-center gap-2">
          <button type="button" style={btnPrimary} onClick={() => runCoach("workout")} disabled={coachBusy}>
            + Coach note
          </button>
          <button type="button" className="rounded border p-1.5" style={{ borderColor: C.border, color: C.dim }} title="Energy Units settings" aria-expanded={settingsOpen} data-fit-settings-gear onClick={() => setSettingsOpen((o) => !o)}>
            <Settings className="h-3.5 w-3.5" style={settingsOpen ? { color: C.cyan } : undefined} />
          </button>
        </div>
      </div>
      {settingsOpen && (
        <div className="mt-2 rounded border p-2" style={{ borderColor: C.border, background: "#0b1119" }} data-fit-settings-panel>
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Rate unit</div>
          <div role="radiogroup" aria-label="Rate unit" className="flex overflow-hidden rounded border text-[11px] font-semibold" style={{ borderColor: C.border }}>
            {RATE_UNIT_ORDER.map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={rateUnit === u}
                onClick={() => setRateUnit(u)}
                className={`min-h-[30px] flex-1 border-l first:border-l-0 ${styles.mono} ${rateUnit === u ? styles.pillActive : ""}`}
                style={{ borderColor: C.border, color: rateUnit === u ? C.cyan : C.dim, background: rateUnit === u ? "#152238" : "transparent" }}
              >
                {RATE_UNIT_LABEL[u]}
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: C.text }}>
            <input type="checkbox" checked={showAllRates} onChange={(e) => setShowAllRates(e.target.checked)} />
            Show all three (cal/hr · cal/min · cal/sec) on Live Today
          </label>
          <div className="mt-1 text-[8px]" style={{ color: C.dim }}>
            One setting for every rate readout · saved on this device{owner ? " + fit-profile (cloud)" : " (sign in to sync)"}
          </div>
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px]" style={{ color: C.dim }}>Net kcal rate</div>
          <div className={`text-2xl font-bold tabular-nums ${styles.glowCyan} ${styles.mono}`} style={{ color: C.cyan }}>
            {formatCalRate(netPer, rateUnit)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px]" style={{ color: C.dim }}>MoT rate</div>
          <div className="flex items-center justify-end gap-2">
            <span className={`text-2xl font-bold tabular-nums ${styles.mono}`} style={{ color: C.text }}>
              {formatCalRate(burnPer ?? fuelPer, rateUnit).replace(/\s*cal\/(min|sec|hr)$/, "") || "—"}
            </span>
            <select
              aria-label="Rate unit"
              value={rateUnit}
              onChange={(e) => setRateUnit(e.target.value as EnergyRateUnit)}
              className="min-h-[32px] rounded border px-1 text-[11px] font-semibold"
              style={{ borderColor: C.cyan, background: "#0b1119", color: C.cyan }}
            >
              <option value="per_hr">cal/hr</option>
              <option value="per_min">cal/min</option>
              <option value="per_sec">cal/sec</option>
            </select>
          </div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[9px] uppercase" style={{ color: C.dim }}>Fuel (in)</dt>
          <dd className={`text-sm font-semibold tabular-nums ${styles.mono}`} style={{ color: C.green }}>
            {day.calories_in != null ? `${day.calories_in} kcal` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase" style={{ color: C.dim }}>Burn (out)</dt>
          <dd className={`text-sm font-semibold tabular-nums ${styles.mono}`} style={{ color: C.red }}>
            {day.calories_out != null ? `${day.calories_out} kcal` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase" style={{ color: C.dim }}>Deficit Δ</dt>
          <dd className={`text-sm font-semibold tabular-nums ${styles.mono}`} style={{ color: deficit ? C.green : C.amber }}>
            {delta != null ? `${delta} kcal` : "—"}
          </dd>
        </div>
      </dl>
      {deficit && (
        <div className="mt-2 rounded border px-2 py-1 text-[10px]" style={{ borderColor: `${C.green}55`, color: C.green, background: `${C.green}12` }}>
          DEFICIT ON TRACK — intake &lt; burn
        </div>
      )}
    </div>
  );
}

export function RealtimeEnergyPanel({
  day, rateUnit, setRateUnit, chartSpan, setChartSpan, fuelPer, burnPer, fuelRates, burnRates, setField, inputStyle,
}: {
  day: FitDay;
  rateUnit: EnergyRateUnit;
  setRateUnit: (u: EnergyRateUnit) => void;
  chartSpan: ChartSpan;
  setChartSpan: (sp: ChartSpan) => void;
  fuelPer: number | null;
  burnPer: number | null;
  fuelRates: Rates;
  burnRates: Rates;
  setField: (field: DayField, raw: string) => void;
  inputStyle: CSSProperties;
}) {
  return (
    <Panel
      title="REAL-TIME ENERGY"
      accent={C.cyan}
      right={
        <label className="flex items-center gap-1 text-[9px]" style={{ color: C.dim }}>
          MoT
          <select
            value={rateUnit}
            onChange={(e) => setRateUnit(e.target.value as EnergyRateUnit)}
            className="rounded border px-1 py-0.5 text-[10px] font-mono"
            style={{ borderColor: C.border, background: "#0b1119", color: C.cyan }}
          >
            <option value="per_hr">cal/hr</option>
            <option value="per_min">cal/min</option>
            <option value="per_sec">cal/sec</option>
          </select>
        </label>
      }
    >
      <div className="mb-2 flex overflow-hidden rounded border text-[10px] font-mono" style={{ borderColor: C.border }}>
        {(["1x", "1D", "1W", "30D"] as const).map((sp) => (
          <button
            key={sp}
            type="button"
            onClick={() => setChartSpan(sp)}
            className={`min-h-[28px] flex-1 border-l first:border-l-0 ${chartSpan === sp ? styles.pillActive : ""}`}
            style={{ borderColor: C.border, color: chartSpan === sp ? C.cyan : C.dim, background: chartSpan === sp ? "#152238" : "transparent" }}
          >
            {sp}
          </button>
        ))}
      </div>
      <EnergyChart fuelPer={fuelPer} burnPer={burnPer} unit={rateUnit} span={chartSpan} />
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {([
          ["steps", "Steps", day.steps],
          ["calories_in", "Calories in", day.calories_in],
          ["calories_out", "Calories out", day.calories_out],
        ] as const).map(([field, label, val]) => (
          <label key={field} className="flex flex-col gap-1 text-[9px] uppercase tracking-wide" style={{ color: C.dim }}>
            {label}
            <input
              style={inputStyle}
              className={styles.mono}
              inputMode="decimal"
              placeholder="—"
              value={blankNum(val)}
              onChange={(e) => setField(field, e.target.value)}
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-[9px]" style={{ color: C.dim }}>
        Leave blank until measured. Enter calories in/out to plot fuel / burn / deficit. Rates: fuel {formatCalRate(fuelRates.perMin, "per_min")} · burn {formatCalRate(burnRates.perMin, "per_min")}.
      </p>
    </Panel>
  );
}
