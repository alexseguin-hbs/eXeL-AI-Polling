"use client";

/** FITNESS-2525 · Command UX 1 — ENERGY BUDGET · PLANNED VS LOGGED panel (BMR + NEAT + MET workouts). */
import type { CSSProperties } from "react";
import type { FitDay } from "@/lib/fitness-2525/types";
import type { buildDayBudget } from "@/lib/fitness-2525/budget";
import styles from "./fitness-2525.module.css";
import { C, blankNum, type DayField } from "./ux-helpers";
import { BudgetBar, Panel } from "./ux-widgets";

export function EnergyBudgetPanel({
  day, budget, exampleMode, toggleExample, setField, setWeightLb, setWindowIntake, applyDay, inputStyle, btnGhost,
}: {
  day: FitDay;
  budget: ReturnType<typeof buildDayBudget>;
  exampleMode: boolean;
  toggleExample: () => void;
  setField: (field: DayField, raw: string) => void;
  setWeightLb: (raw: string) => void;
  setWindowIntake: (id: string, raw: string) => void;
  applyDay: (updater: (prev: FitDay) => FitDay) => void;
  inputStyle: CSSProperties;
  btnGhost: CSSProperties;
}) {
  return (
    <Panel
      title="ENERGY BUDGET · PLANNED VS LOGGED"
      accent={C.gold}
      right={
        <button type="button" style={btnGhost} onClick={toggleExample}>
          {exampleMode ? "CLEAR EXAMPLE" : "LOAD EXAMPLE DATA"}
        </button>
      }
    >
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
        {([
          ["BMR", budget.bmrKcal, "kcal"],
          ["NEAT", budget.neatKcal, "kcal"],
          ["Workouts", budget.workoutBurnKcal, "kcal"],
          ["Burn Σ", budget.totalBurnKcal, "kcal"],
        ] as const).map(([lb, v, u]) => (
          <div key={lb} className="rounded border px-1 py-1" style={{ borderColor: C.border }}>
            <div className="text-[8px] uppercase" style={{ color: C.dim }}>{lb}</div>
            <div className={`text-[12px] font-semibold tabular-nums ${styles.mono}`} style={{ color: C.cyan }}>
              {v != null ? `${v}` : "—"}
            </div>
            <div className="text-[8px]" style={{ color: C.dim }}>{u}</div>
          </div>
        ))}
      </div>
      <div className="mb-2 flex flex-wrap gap-2 text-[9px]" style={{ color: C.dim }}>
        <span>Deficit target: <span className={styles.mono} style={{ color: budget.noDeficitToday ? C.amber : C.green }}>{budget.deficitTargetKcal != null ? `${budget.deficitTargetKcal} kcal` : "—"}</span>{budget.noDeficitToday ? " · NO DEFICIT (key/long)" : ""}</span>
        <span>· Intake target: <span className={styles.mono} style={{ color: C.text }}>{budget.intakeTargetKcal != null ? `${budget.intakeTargetKcal} kcal` : "—"}</span></span>
        <span>· Sugar cap: <span className={styles.mono} style={{ color: C.text }}>{budget.sugarCapG != null ? `${budget.sugarCapG} g` : "—"}</span></span>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wide" style={{ color: C.dim }}>
          Weight (lb)
          <input style={inputStyle} className={styles.mono} inputMode="decimal" placeholder="—" value={day.weight?.value != null ? String(day.weight.value) : ""} onChange={(e) => setWeightLb(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wide" style={{ color: C.dim }}>
          Height (cm)
          <input style={inputStyle} className={styles.mono} inputMode="decimal" placeholder="—" value={blankNum(day.height_cm)} onChange={(e) => setField("height_cm", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wide" style={{ color: C.dim }}>
          Age (yr)
          <input style={inputStyle} className={styles.mono} inputMode="decimal" placeholder="—" value={blankNum(day.age_yr)} onChange={(e) => setField("age_yr", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wide" style={{ color: C.dim }}>
          Sex
          <select
            aria-label="Sex"
            value={day.sex ?? ""}
            onChange={(e) => applyDay((prev) => ({ ...prev, sex: (e.target.value || null) as FitDay["sex"] }))}
            style={{ ...inputStyle, color: C.cyan }}
          >
            <option value="">—</option>
            <option value="male">male</option>
            <option value="female">female</option>
            <option value="unspecified">unspecified</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wide" style={{ color: C.dim }}>
          Sugar out (g)
          <input style={inputStyle} className={styles.mono} inputMode="decimal" placeholder="—" value={blankNum(day.sugar_out_g)} onChange={(e) => setField("sugar_out_g", e.target.value)} />
        </label>
      </div>
      {budget.windows.map((w) => (
        <div key={w.id}>
          <BudgetBar w={w} />
          {w.kind === "workout" && (
            <label className="mb-2 flex items-center gap-2 text-[9px]" style={{ color: C.dim }}>
              Logged intake (kcal) · {w.label.slice(0, 28)}
              <input
                style={{ ...inputStyle, maxWidth: 120 }}
                className={styles.mono}
                inputMode="decimal"
                placeholder="—"
                value={blankNum(day.window_intake_kcal?.[w.id])}
                onChange={(e) => setWindowIntake(w.id, e.target.value)}
              />
            </label>
          )}
        </div>
      ))}
      <p className="mt-1 text-[8px]" style={{ color: C.dim }}>
        BMR needs weight+height+age. Workout burn needs weight (or device kcal). Bars: amber ≥85%, red ≥100% of planned. See docs/fitness-2525/ENERGY_MODEL.md.
      </p>
    </Panel>
  );
}
