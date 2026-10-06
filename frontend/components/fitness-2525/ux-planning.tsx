"use client";

/** FITNESS-2525 · Command UX 1 — PLANNING / ENERGY selected-session panel + manual workout log (AsM #14). */
import { useState, type CSSProperties } from "react";
import { Check, Trash2 } from "lucide-react";
import type { FitDay, FitDistanceUnit, FitWorkout } from "@/lib/fitness-2525/types";
import { type EnergyRateUnit, type workoutBurnRates, pickRate, formatCalRate } from "@/lib/fitness-2525/energy";
import { addWorkout, deleteItem } from "@/lib/fitness-2525/log";
import { C, parseOptionalNum } from "./ux-helpers";
import { Panel } from "./ux-widgets";

const SPORTS = ["run", "bike", "swim", "strength", "mobility", "walk"];
const UNITS: FitDistanceUnit[] = ["mi", "km", "yd", "m"];

export function SessionPanel({
  selected, selectedBurn, rateUnit, toggleWorkout, btnGhost, applyDay, inputStyle, onSelect,
}: {
  selected: FitWorkout | null;
  selectedBurn: ReturnType<typeof workoutBurnRates> | null;
  rateUnit: EnergyRateUnit;
  toggleWorkout: (id: string) => void;
  btnGhost: CSSProperties;
  applyDay: (updater: (prev: FitDay) => FitDay) => void;
  inputStyle: CSSProperties;
  onSelect: (id: string | null) => void;
}) {
  const [sport, setSport] = useState("run");
  const [mins, setMins] = useState("");
  const [dist, setDist] = useState("");
  const [unit, setUnit] = useState<FitDistanceUnit>("mi");
  const [kcal, setKcal] = useState("");
  const logWorkout = () => {
    const minutes = parseOptionalNum(mins);
    const d = parseOptionalNum(dist);
    if (minutes == null && d == null) return;
    const id = `w-${Date.now().toString(36)}`;
    applyDay((prev) => addWorkout(prev, {
      id, type: sport, title: `${sport} (manual)`, status: "completed", minutes,
      distance: d != null ? { value: d, unit } : null, calories: parseOptionalNum(kcal), notes: "Logged manually",
    }));
    onSelect(id);
    setMins(""); setDist(""); setKcal("");
  };
  return (
    <Panel title={selected ? `SESSION · ${(selected.title || selected.type).toUpperCase()}` : "SESSION"} accent={C.cyan}>
      {selected && (
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
          <div className="flex gap-1.5">
            <button type="button" style={btnGhost} onClick={() => toggleWorkout(selected.id)}>
              {selected.status === "completed" ? <><Check className="mr-1 inline h-3 w-3" /> COMPLETED</> : "MARK DONE"}
            </button>
            <button type="button" style={{ ...btnGhost, color: C.red }} aria-label="Delete session"
              onClick={() => { applyDay((prev) => deleteItem(prev, selected.id)); onSelect(null); }}>
              <Trash2 className="inline h-3 w-3" />
            </button>
          </div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2 text-[10px]" style={{ borderColor: C.border }} data-fit-log-workout>
        <span className="uppercase tracking-wide" style={{ color: C.dim }}>Log workout</span>
        <select style={{ ...inputStyle, width: 90 }} value={sport} onChange={(e) => setSport(e.target.value)} aria-label="Sport">
          {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input style={{ ...inputStyle, width: 60 }} inputMode="decimal" placeholder="min" value={mins} onChange={(e) => setMins(e.target.value)} aria-label="Minutes" />
        <input style={{ ...inputStyle, width: 60 }} inputMode="decimal" placeholder="dist" value={dist} onChange={(e) => setDist(e.target.value)} aria-label="Distance" />
        <select style={{ ...inputStyle, width: 56 }} value={unit} onChange={(e) => setUnit(e.target.value as FitDistanceUnit)} aria-label="Unit">
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <input style={{ ...inputStyle, width: 64 }} inputMode="decimal" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} aria-label="Device kcal" />
        <button type="button" style={btnGhost} disabled={parseOptionalNum(mins) == null && parseOptionalNum(dist) == null} onClick={logWorkout}>+ ADD</button>
      </div>
    </Panel>
  );
}
