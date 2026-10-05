"use client";

/** FITNESS-2525 · Command UX 1 — shared widgets: Panel, BudgetBar, sport icons, REAL-TIME energy chart. */
import type { CSSProperties, ReactNode } from "react";
import { Activity, Bike, Droplets, Footprints, Moon, Waves } from "lucide-react";
import { type EnergyRateUnit, formatCalRate } from "@/lib/fitness-2525/energy";
import type { OverrunLevel, WindowBudget } from "@/lib/fitness-2525/budget";
import styles from "./fitness-2525.module.css";
import { C } from "./ux-helpers";

export function Panel({ title, children, accent, right }: { title: string; children: ReactNode; accent?: string; right?: ReactNode }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: C.panel, borderColor: C.border }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent ?? C.dim }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}


export function overrunClass(level: OverrunLevel): string {
  if (level === "over") return styles.budgetOver;
  if (level === "near") return styles.budgetNear;
  if (level === "ok") return styles.budgetOk;
  return styles.budgetUnknown;
}

export function BudgetBar({ w }: { w: WindowBudget }) {
  const pct =
    w.planned != null && w.planned > 0 && w.logged != null
      ? Math.min(140, Math.round((w.logged / w.planned) * 100))
      : null;
  const alert =
    w.overrun === "over" ? "OVERRUN" : w.overrun === "near" ? "NEAR LIMIT" : null;
  const alertColor = w.overrun === "over" ? C.red : C.amber;
  return (
    <div className="mb-2 rounded border p-2" style={{ borderColor: C.border, background: "#0b1119" }}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase" style={{ color: C.text }}>{w.label}</div>
          <div className={`text-[9px] ${styles.mono}`} style={{ color: C.dim }}>
            planned {w.planned != null ? `${w.planned} ${w.unit}` : "—"}
            {" · "}
            logged {w.logged != null ? `${w.logged} ${w.unit}` : "—"}
            {w.burnKcal != null ? ` · burn ${w.burnKcal} kcal` : ""}
            {w.burnRates?.perMin != null ? ` · ${formatCalRate(w.burnRates.perMin, "per_min")} / ${formatCalRate(w.burnRates.perSec, "per_sec")}` : ""}
          </div>
        </div>
        {alert && (
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wide" style={{ color: alertColor, background: `${alertColor}22`, border: `1px solid ${alertColor}66` }}>
            {alert}
          </span>
        )}
      </div>
      <div className={styles.budgetTrack}>
        <div
          className={`${styles.budgetFill} ${overrunClass(w.overrun)}`}
          style={{ width: pct != null ? `${pct}%` : "0%" }}
        />
      </div>
      {w.note && <div className="mt-1 text-[8px]" style={{ color: C.dim }}>{w.note}</div>}
    </div>
  );
}

export function sportIcon(type: string, color = C.cyan) {
  const t = type.toLowerCase();
  const props = { className: "h-4 w-4", style: { color } as CSSProperties };
  if (t.includes("swim")) return <Waves {...props} />;
  if (t.includes("bike") || t.includes("cycle")) return <Bike {...props} />;
  if (t.includes("run") || t.includes("step")) return <Footprints {...props} />;
  if (t.includes("sleep") || t.includes("rest")) return <Moon {...props} />;
  if (t.includes("hydrat") || t.includes("water") || t.includes("fuel")) return <Droplets {...props} />;
  return <Activity {...props} />;
}

/** SVG energy chart — Financial REAL-TIME pattern: fuel / burn / net with MoT unit (calories). */
export function EnergyChart({
  fuelPer, burnPer, unit, span,
}: {
  fuelPer: number | null;
  burnPer: number | null;
  unit: EnergyRateUnit;
  span: string;
}) {
  const W = 640, H = 220, P = 28;
  const has = fuelPer != null || burnPer != null;
  const net = fuelPer != null && burnPer != null ? fuelPer - burnPer : null;
  const vals = [fuelPer, burnPer, net].filter((v): v is number => v != null && Number.isFinite(v));
  const maxAbs = vals.length ? Math.max(...vals.map((v) => Math.abs(v)), 1e-9) : 1;
  const yMax = maxAbs * 1.25;
  const y = (v: number) => P + (H - 2 * P) * (1 - (v + yMax) / (2 * yMax));
  const midY = y(0);
  const unitSuffix = unit === "per_sec" ? "/sec" : unit === "per_hr" ? "/hr" : "/min";
  const yDigits = unit === "per_sec" ? 3 : unit === "per_hr" ? 1 : 2;
  // Flat step lines across the span (scaffolding until a full series exists).
  const x0 = P, x1 = W - P;
  return (
    <div className="relative w-full overflow-hidden rounded border" style={{ borderColor: C.border, background: "#070b12" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block h-auto" role="img" aria-label={`Energy rates cal${unitSuffix}`}>
        <rect x={0} y={0} width={W} height={H} fill="#070b12" />
        {/* grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={P} y1={P + (H - 2 * P) * f} x2={W - P} y2={P + (H - 2 * P) * f} stroke={C.border} strokeWidth={0.5} />
        ))}
        <line x1={P} y1={midY} x2={W - P} y2={midY} stroke={C.dim} strokeWidth={0.6} strokeDasharray="3 3" />
        <text x={4} y={P + 4} fontSize={9} fill={C.dim} className={styles.mono}>{`${yMax.toFixed(yDigits)} kcal`}</text>
        <text x={4} y={H - P} fontSize={9} fill={C.dim} className={styles.mono}>0 kcal</text>
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={9} fill={C.dim} className={styles.mono}>{span} · MoT cal{unitSuffix}</text>
        {!has && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={11} fill={C.dim}>
            Enter calories in/out to plot fuel / burn / deficit
          </text>
        )}
        {fuelPer != null && (
          <line x1={x0} y1={y(fuelPer)} x2={x1} y2={y(fuelPer)} stroke={C.green} strokeWidth={2} />
        )}
        {burnPer != null && (
          <line x1={x0} y1={y(burnPer)} x2={x1} y2={y(burnPer)} stroke={C.red} strokeWidth={2} />
        )}
        {net != null && (
          <line x1={x0} y1={y(net)} x2={x1} y2={y(net)} stroke={C.gold} strokeWidth={2} />
        )}
        {/* cursor + rate labels */}
        {has && (
          <>
            <line x1={W * 0.62} y1={P} x2={W * 0.62} y2={H - P} stroke={C.cyan} strokeWidth={0.8} strokeDasharray="3 3" />
            {fuelPer != null && (
              <text x={W * 0.62 + 6} y={y(fuelPer) - 4} fontSize={10} fill={C.green} className={styles.mono}>
                {formatCalRate(fuelPer, unit)}
              </text>
            )}
            {burnPer != null && (
              <text x={W * 0.62 + 6} y={y(burnPer) + 12} fontSize={10} fill={C.red} className={styles.mono}>
                {formatCalRate(burnPer, unit)}
              </text>
            )}
            {net != null && (
              <text x={W * 0.62 + 6} y={y(net) + (Math.abs(y(net) - y(burnPer ?? 0)) < 14 ? 24 : 12)} fontSize={10} fill={C.gold} className={styles.mono}>
                {formatCalRate(net, unit)}
              </text>
            )}
          </>
        )}
      </svg>
      <div className="flex flex-wrap gap-3 border-t px-2 py-1.5 text-[10px]" style={{ borderColor: C.border }}>
        <span style={{ color: C.green }}>— Fuel (intake)</span>
        <span style={{ color: C.red }}>— Burn (expenditure)</span>
        <span style={{ color: C.gold }}>— Net (deficit if burn &gt; fuel)</span>
      </div>
    </div>
  );
}
