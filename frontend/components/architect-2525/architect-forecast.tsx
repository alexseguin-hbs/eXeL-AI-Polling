"use client";

/**
 * ARCHITECT-2525 · 4D Construction Forecast (Build → Forecast). Sprint 5.
 * ======================================================================
 * Sequences the estimate engine's work sections into a month-by-month build with trade parallelism
 * (MEP rough-in together; finish + landscaping overlap), then forecasts cost + man-hours per month.
 * Input a build-start date + crew size → a Gantt timeline + monthly forecast (the input→output model
 * from the operator's attachments). Driven by lib/architect-estimate.ts (pure, deterministic).
 */
import { useState, useEffect } from "react";
import { DEFAULT_SECTIONS, scheduleSections, monthlyForecast, buildSchedule } from "@/lib/architect-estimate";
import { useLexicon } from "@/lib/lexicon-context";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };
const fmtUsd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const TRADE_C = ["#19c8cf", "#c084fc", "#ffd400", "#22c55e", "#f59e0b", "#38bdf8"];

export function ArchitectForecast() {
  const { t } = useLexicon();
  const [crew, setCrew] = useState(8);
  const [start, setStart] = useState("2026-03-01");
  const scheduled = scheduleSections(DEFAULT_SECTIONS, crew);
  const { months, perMonth } = monthlyForecast(scheduled);
  const totalCost = scheduled.reduce((s, w) => s + w.costUsd, 0);
  const totalHours = scheduled.reduce((s, w) => s + w.manHours, 0);
  // IMG-04 — the build schedule speaks the Financial-2525 time system: a per-project start-date (persisted) → real
  // Start/Finish calendar dates + a read-only $/day·$/hr·$/min accrual (the pure buildSchedule, mot.ts rate law).
  useEffect(() => { try { const v = localStorage.getItem("arch2525.startDate"); if (v) setStart(v); } catch {} }, []);
  const changeStart = (v: string) => { setStart(v); try { localStorage.setItem("arch2525.startDate", v); } catch {} };
  const sched = buildSchedule(start, months, totalCost);
  const fmtDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  const usdRate = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: n < 100 ? 2 : 0 })}`;
  const startDate = new Date(start + "T00:00:00Z");
  const moLabel = (i: number) => { const d = new Date(startDate); d.setUTCMonth(d.getUTCMonth() + i); return d.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" }); };
  const maxMoCost = Math.max(1, ...perMonth.map((m) => m.cost));

  return (
    <div data-arch-forecast className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>4D CONSTRUCTION FORECAST · trades · timeline · month-by-month</div>
        <div className="flex items-center gap-2 text-[9px]" style={{ color: C.dim }}>
          <label className="flex items-center gap-1">Start<input data-arch-build-startdate type="date" value={start} onChange={(e) => changeStart(e.target.value)} className="rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }} /></label>
          <label className="flex items-center gap-1">Crew<input type="number" min={2} max={40} value={crew} onChange={(e) => setCrew(Math.max(2, Math.min(40, parseInt(e.target.value) || 2)))} className="w-12 rounded border bg-transparent px-1 py-0.5 text-right text-[9px]" style={{ borderColor: C.border, color: C.text }} /></label>
        </div>
      </div>

      {/* summary — real Start/Finish DATES + the Financial-2525 $/min accrual (IMG-04) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[["Start", fmtDate(sched.startISO), C.cyan], ["Finish", fmtDate(sched.endISO), C.green], ["Duration", `${months} mo · ${sched.totalDays}d`, C.violet], ["Total cost", fmtUsd(totalCost), C.gold], ["$/min", `${usdRate(sched.perMinUsd)}`, C.gold], ["Man-hours", totalHours.toLocaleString(), C.violet]].map(([l, v, c]) => (
          <div key={l} className="rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
            <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: C.dim }}>{l}</div>
            <div className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: c as string }}>{v}</div>
          </div>
        ))}
      </div>
      {/* Financial-2525 accrual rate — read-only $/day · $/hr · $/min over the build span (IMG-04) */}
      <div data-arch-build-rate className="rounded-lg border p-2 text-[10px]" style={{ borderColor: C.border, background: C.panel, color: C.dim }}>
        <span className="font-bold tracking-wider" style={{ color: C.violet }}>FINANCIAL-2525 ACCRUAL</span> · build cost spreads to{" "}
        <b style={{ color: C.gold }}>{usdRate(sched.perDayUsd)}/day</b> · <b style={{ color: C.gold }}>{usdRate(sched.perHourUsd)}/hr</b> · <b style={{ color: C.gold }}>{usdRate(sched.perMinUsd)}/min</b>{" "}
        over <b style={{ color: C.text }}>{sched.totalDays} days</b> ({fmtDate(sched.startISO)} → {fmtDate(sched.endISO)}) · read-only
      </div>

      {/* GANTT — trade sequencing across months */}
      <div className="overflow-x-auto rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 text-[9px] font-bold tracking-wider" style={{ color: C.violet }}>{t("arch.fc_codes.forecast.timeline_trade_sequencing")}</div>
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
        <div className="mb-1 text-[9px] font-bold tracking-wider" style={{ color: C.violet }}>{t("arch.fc_codes.forecast.monthly_forecast_cost_draw")}</div>
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
      <div className="text-[8px]" style={{ color: C.dim }}>{t("arch.fc_codes.forecast.deterministic_schedule")}</div>
    </div>
  );
}
