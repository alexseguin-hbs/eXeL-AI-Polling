"use client";

/**
 * FITNESS-2525 · Command UX 1 — NUTRITION: meal + sugar log (AsM #14 / Athena), energy 1–10, AI fueling.
 * Logged meal kcal / sugar feed calories in and the sugar cap. Blank fields stay blank — nothing is estimated.
 * Every entry autosaves (device, and the account when signed in); deleting leaves a tombstone so it never returns.
 */
import { useState, type CSSProperties } from "react";
import { Trash2 } from "lucide-react";
import type { FitDay } from "@/lib/fitness-2525/types";
import { addMeal, deleteItem, mealTotals, clampRating } from "@/lib/fitness-2525/log";
import { C, blankNum, parseOptionalNum } from "./ux-helpers";
import { Panel } from "./ux-widgets";

type Draft = { name: string; time: string; kcal: string; carbs_g: string; sugar_g: string; protein_g: string; fat_g: string };
const EMPTY: Draft = { name: "", time: "", kcal: "", carbs_g: "", sugar_g: "", protein_g: "", fat_g: "" };
const FIELDS: [keyof Draft, string][] = [["kcal", "kcal"], ["carbs_g", "carbs g"], ["sugar_g", "sugar g"], ["protein_g", "protein g"], ["fat_g", "fat g"]];
const fmt = (v: number | null | undefined, unit = "") => (v == null ? "—" : `${Math.round(v * 10) / 10}${unit}`);

export function NutritionPanel({
  day, applyDay, sugarCapG, coachBusy, runCoach, btnGhost, btnPrimary, inputStyle,
}: {
  day: FitDay;
  applyDay: (updater: (prev: FitDay) => FitDay) => void;
  sugarCapG: number | null;
  coachBusy: boolean;
  runCoach: (focus: "workout" | "nutrition" | "both") => void;
  btnGhost: CSSProperties;
  btnPrimary: CSSProperties;
  inputStyle: CSSProperties;
}) {
  const [d, setD] = useState<Draft>(EMPTY);
  const [sugarName, setSugarName] = useState("");
  const [sugarG, setSugarG] = useState("");
  const meals = day.meals ?? [];
  const t = mealTotals(meals);
  const sugar = day.sugar_out_g ?? null;
  const pct = sugar != null && sugarCapG ? Math.min(100, Math.round((sugar / sugarCapG) * 100)) : null;
  const over = sugar != null && sugarCapG != null && sugar > sugarCapG;
  const canAdd = !!d.name.trim() || FIELDS.some(([k]) => parseOptionalNum(d[k]) != null);
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setD((p) => ({ ...p, [k]: e.target.value }));

  const add = () => {
    if (!canAdd) return;
    applyDay((prev) => addMeal(prev, {
      name: d.name, time: d.time,
      kcal: parseOptionalNum(d.kcal), carbs_g: parseOptionalNum(d.carbs_g), sugar_g: parseOptionalNum(d.sugar_g),
      protein_g: parseOptionalNum(d.protein_g), fat_g: parseOptionalNum(d.fat_g),
    }));
    setD(EMPTY);
  };
  const addSugar = () => {
    const g = parseOptionalNum(sugarG);
    if (g == null) return;
    applyDay((prev) => addMeal(prev, { name: sugarName.trim() || "Sugar", sugar_g: g }));
    setSugarName(""); setSugarG("");
  };

  return (
    <Panel title="NUTRITION · MEAL + SUGAR LOG" accent={C.amber}>
      <div data-fit-meals>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "minmax(110px,2fr) 70px repeat(5,minmax(52px,1fr))" }}>
          <input style={inputStyle} placeholder="Meal / snack" value={d.name} onChange={set("name")} aria-label="Meal name" />
          <input style={inputStyle} type="time" value={d.time} onChange={set("time")} aria-label="Time" />
          {FIELDS.map(([k, label]) => (
            <input key={k} style={inputStyle} inputMode="decimal" placeholder={label} value={d[k]} onChange={set(k)} aria-label={label} />
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <button type="button" style={btnPrimary} disabled={!canAdd} onClick={add} data-fit-add-meal>+ ADD MEAL</button>
          <span className="text-[9px]" style={{ color: C.dim }}>Blank = not logged (never estimated).</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wide" style={{ color: C.dim }}>Quick sugar</span>
          <input style={{ ...inputStyle, width: 140 }} placeholder="gel, drink, candy…" value={sugarName} onChange={(e) => setSugarName(e.target.value)} aria-label="Sugar item" />
          <input style={{ ...inputStyle, width: 70 }} inputMode="decimal" placeholder="g" value={sugarG} onChange={(e) => setSugarG(e.target.value)} aria-label="Sugar grams" />
          <button type="button" style={btnGhost} disabled={parseOptionalNum(sugarG) == null} onClick={addSugar}>+ SUGAR</button>
        </div>

        <div className="mt-2 space-y-1">
          {meals.length === 0 && <div className="text-[10px]" style={{ color: C.dim }}>No meals logged today.</div>}
          {meals.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-[10px]" style={{ background: "#0d1420" }}>
              <span className="w-10 font-mono" style={{ color: C.dim }}>{m.time || "—"}</span>
              <span className="min-w-0 flex-1 truncate" style={{ color: C.text }}>{m.name || "Meal"}</span>
              <span className="font-mono" style={{ color: C.gold }}>{fmt(m.kcal, " kcal")}</span>
              <span className="font-mono" style={{ color: C.dim }}>C {fmt(m.carbs_g)} · S {fmt(m.sugar_g)} · P {fmt(m.protein_g)} · F {fmt(m.fat_g)}</span>
              <button type="button" aria-label={`Delete ${m.name || "meal"}`} onClick={() => applyDay((prev) => deleteItem(prev, m.id))} style={{ color: C.red }}>
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
          <div><div style={{ color: C.dim }}>CALORIES IN</div><div className="font-mono text-[13px]" style={{ color: C.gold }}>{fmt(day.calories_in, " kcal")}</div>
            <div className="text-[8px]" style={{ color: C.dim }}>{t.kcal != null ? "sum of logged meals" : "typed on ENERGY"}</div></div>
          <div><div style={{ color: C.dim }}>CARBS · PROTEIN · FAT</div><div className="font-mono" style={{ color: C.text }}>{fmt(t.carbs_g, "g")} · {fmt(t.protein_g, "g")} · {fmt(t.fat_g, "g")}</div></div>
          <div className="col-span-2">
            <div style={{ color: C.dim }}>SUGAR vs CAP</div>
            <div className="font-mono" style={{ color: over ? C.red : C.text }}>{fmt(sugar, " g")} / {sugarCapG != null ? `${sugarCapG} g` : "—"}{over ? " · OVER" : ""}</div>
            <div className="mt-0.5 h-1.5 rounded" style={{ background: C.border }}>
              <div className="h-1.5 rounded" style={{ width: `${pct ?? 0}%`, background: over ? C.red : C.amber }} />
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
          <label className="flex items-center gap-1.5 uppercase tracking-wide" style={{ color: C.dim }}>
            Energy 1–10
            <input style={{ ...inputStyle, width: 56 }} inputMode="numeric" placeholder="—" value={blankNum(day.energy)}
              onChange={(e) => { const n = clampRating(parseOptionalNum(e.target.value)); applyDay((prev) => ({ ...prev, energy: n })); }} aria-label="Energy 1 to 10" />
          </label>
          <button type="button" style={btnGhost} disabled={coachBusy} onClick={() => runCoach("nutrition")}>Ask AI (nutrition)</button>
          <button type="button" style={btnGhost} disabled={coachBusy} onClick={() => runCoach("both")}>Ask AI (full day)</button>
        </div>
      </div>
    </Panel>
  );
}
