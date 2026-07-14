"use client";

/**
 * ARCHITECT-2525 · 4D Construction Forecast (Build → Forecast). Sprint 5.
 * ======================================================================
 * Sequences the estimate engine's work sections into a month-by-month build with trade parallelism
 * (MEP rough-in together; finish + landscaping overlap), then forecasts cost + man-hours per month.
 * Input a build-start date + crew size → a Gantt timeline + monthly forecast (the input→output model
 * from the operator's attachments). Driven by lib/architect-estimate.ts (pure, deterministic).
 */
import { useState } from "react";
import { DEFAULT_SECTIONS, scheduleSections, monthlyForecast } from "@/lib/architect-estimate";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };
const fmtUsd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const TRADE_C = ["#19c8cf", "#c084fc", "#ffd400", "#22c55e", "#f59e0b", "#38bdf8"];

export function ArchitectForecast() {
  const [crew, setCrew] = useState(8);
  const [start, setStart] = useState("2026-03-01");
  const scheduled = scheduleSections(DEFAULT_SECTIONS, crew);
  const { months, perMonth } = monthlyForecast(scheduled);
  const totalCost = scheduled.reduce((s, w) => s + w.costUsd, 0);
  const totalHours = scheduled.reduce((s, w) => s + w.manHours, 0);
  const startDate = new Date(start + "T00:00:00Z");
  const moLabel = (i: number) => { const d = new Date(startDate); d.setUTCMonth(d.getUTCMonth() + i); return d.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" }); };
  const moveIn = moLabel(months);
  const maxMoCost = Math.max(1, ...perMonth.map((m) => m.cost));

  return (
    <div data-arch-forecast className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>4D CONSTRUCTION FORECAST · trades · timeline · month-by-month</div>
        <div className="flex items-center gap-2 text-[9px]" style={{ color: C.dim }}>
          <label className="flex items-center gap-1">Start<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }} /></label>
          <label className="flex items-center gap-1">Crew<input type="number" min={2} max={40} value={crew} onChange={(e) => setCrew(Math.max(2, Math.min(40, parseInt(e.target.value) || 2)))} className="w-12 rounded border bg-transparent px-1 py-0.5 text-right text-[9px]" style={{ borderColor: C.border, color: C.text }} /></label>
        </div>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Duration", `${months} mo`, C.cyan], ["Move-in", moveIn, C.green], ["Total cost", fmtUsd(totalCost), C.gold], ["Total man-hours", totalHours.toLocaleString(), C.violet]].map(([l, v, c]) => (
          <div key={l} className="rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
            <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: C.dim }}>{l}</div>
            <div className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: c as string }}>{v}</div>
          </div>
        ))}
      </div>

      {/* GANTT — trade sequencing across months */}
      <div className="overflow-x-auto rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 text-[9px] font-bold tracking-wider" style={{ color: C.violet }}>TIMELINE · trade sequencing (MEP rough-in runs parallel)</div>
        <div style={{ minWidth: Math.max(360, months * 46) }}>
          {/* month header */}
          <div className="mb-1 flex gap-0.5 pl-24 text-[7px]" style={{ color: C.dim }}>
            {Array.from({ length: months }, (_, i) => <div key={i} className="flex-1 text-center">{moLabel(i)}</div>)}
          </div>
          {scheduled.map((s, idx) => (
            <div key={s.id} data-gantt-row className="mb-0.5 flex items-center gap-1">
              <div className="w-24 shrink-0 truncate text-[9px]" style={{ color: C.text }}>{s.name}</div>
              <div className="relative flex h-3 flex-1 gap-0.5">
                {Array.from({ length: months }, (_, m) => {
                  const active = m >= s.startMo && m < s.startMo + s.durMo;
                  return <div key={m} className="flex-1 rounded-sm" style={{ background: active ? TRADE_C[idx % TRADE_C.length] : "#0c1420", opacity: active ? 0.85 : 1 }} title={active ? `${s.name} · ${s.trade}` : ""} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MONTHLY FORECAST — cost per month */}
      <div className="overflow-x-auto rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 text-[9px] font-bold tracking-wider" style={{ color: C.violet }}>MONTHLY FORECAST · cost draw per month</div>
        <div className="flex items-end gap-1" style={{ height: 90, minWidth: Math.max(360, months * 46) }}>
          {perMonth.map((m, i) => (
            <div key={i} data-forecast-month className="flex flex-1 flex-col items-center justify-end gap-0.5" title={`${moLabel(i)} · ${fmtUsd(m.cost)} · ${Math.round(m.hours)} hrs`}>
              <span className="text-[7px] tabular-nums" style={{ color: C.dim }}>{Math.round(m.cost / 1000)}k</span>
              <div className="w-full rounded-t" style={{ height: `${Math.max(4, (m.cost / maxMoCost) * 72)}px`, background: C.gold, opacity: 0.85 }} />
              <span className="text-[7px]" style={{ color: C.dim }}>{moLabel(i)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[8px]" style={{ color: C.dim }}>Deterministic schedule from the estimate engine → replayable. Change crew or start to re-forecast.</div>
    </div>
  );
}
