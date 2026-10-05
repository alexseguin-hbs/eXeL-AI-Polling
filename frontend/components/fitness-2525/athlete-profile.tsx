"use client";

/**
 * FITNESS-2525 · ATHLETE PROFILE
 * Profile (fit-profile) + daily weigh-ins + per-session hydration/recovery (fit-day-*).
 * Never prefills numbers — every field starts blank. Morning (fasted) weight is the
 * only weight used for the goal trend and for BMR in the energy budget.
 */
import type { CSSProperties, ReactNode } from "react";
import type { FitDay, FitFluid, FitProfile, FitRecovery, FitSex, FitUnitSystem, FitWeight } from "@/lib/fitness-2525/types";
import {
  daySwingKg, fluidUnitFor, fmtFluidL, fmtWeight, goalRemainingKg, heightUnitFor,
  sweatLoss, toKg, weightUnitFor, DEHYDRATION_WARN_PCT,
} from "@/lib/fitness-2525/profile";
import styles from "./fitness-2525.module.css";

const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", gold: "#ffd400",
};

const inputStyle: CSSProperties = {
  background: "#0b1119", border: `1px solid ${C.border}`, color: C.text,
  borderRadius: 4, padding: "6px 8px", fontSize: 12, width: "100%", outline: "none",
};

function num(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function blank(v: number | null | undefined): string {
  return typeof v === "number" && Number.isFinite(v) ? String(v) : "";
}

function Card({ title, accent, right, children }: { title: string; accent?: string; right?: ReactNode; children: ReactNode }) {
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wide" style={{ color: C.dim }}>
      {label}
      {children}
    </label>
  );
}

function NumIn({ value, onChange, placeholder = "—", step }: { value: number | null | undefined; onChange: (n: number | null) => void; placeholder?: string; step?: string }) {
  return (
    <input
      style={inputStyle}
      className={styles.mono}
      inputMode="decimal"
      step={step}
      placeholder={placeholder}
      value={blank(value)}
      onChange={(e) => onChange(num(e.target.value))}
    />
  );
}

function Stat({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="rounded border px-2 py-1.5 text-center" style={{ borderColor: C.border }}>
      <div className="text-[8px] uppercase" style={{ color: C.dim }}>{label}</div>
      <div className={`text-[13px] font-semibold tabular-nums ${styles.mono}`} style={{ color: color ?? C.cyan }}>{value}</div>
      {sub && <div className="text-[8px]" style={{ color: C.dim }}>{sub}</div>}
    </div>
  );
}

export interface MorningPoint { date: string; kg: number }

export function AthleteProfile({
  profile, onProfile, day, onDay, history, bmrKcal,
}: {
  profile: FitProfile;
  onProfile: (patch: Partial<FitProfile>) => void;
  day: FitDay;
  onDay: (updater: (prev: FitDay) => FitDay) => void;
  /** Morning weights from device/cloud fit-day records (goal trend). */
  history: MorningPoint[];
  bmrKcal: number | null;
}) {
  const units: FitUnitSystem = profile.units ?? "imperial";
  const wu = weightUnitFor(units);
  const hu = heightUnitFor(units);
  const fu = fluidUnitFor(units);
  const w = (n: number | null): FitWeight | null => (n == null ? null : { value: n, unit: wu });
  const wIn = (x: FitWeight | null | undefined): number | null => {
    const kg = toKg(x);
    if (kg == null) return null;
    const v = units === "metric" ? kg : kg * 2.2046226218;
    return Math.round(v * 10) / 10;
  };

  const morning = day.weigh_ins?.morning ?? null;
  const evening = day.weigh_ins?.evening ?? null;
  const swing = daySwingKg(morning, evening);
  const morningKg = toKg(morning);
  const trend = [...history.filter((h) => h.date !== day.date), ...(morningKg != null ? [{ date: day.date, kg: morningKg }] : [])]
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestKg = trend.length ? trend[trend.length - 1].kg : null;
  const firstKg = trend.length ? trend[0].kg : null;
  const remaining = goalRemainingKg(latestKg, profile);
  const lostSoFar = firstKg != null && latestKg != null && trend.length > 1 ? firstKg - latestKg : null;

  const setWeigh = (k: "morning" | "evening", n: number | null) =>
    onDay((prev) => ({ ...prev, weigh_ins: { ...(prev.weigh_ins ?? {}), [k]: w(n) } }));

  const setRec = (id: string, patch: Partial<FitRecovery>) =>
    onDay((prev) => {
      const cur = prev.recovery?.[id] ?? { session_id: id, at: 0 };
      return { ...prev, recovery: { ...(prev.recovery ?? {}), [id]: { ...cur, ...patch, session_id: id, at: Date.now() } } };
    });
  const fluid = (n: number | null): FitFluid | null => (n == null ? null : { value: n, unit: fu });
  const fluidIn = (f: FitFluid | null | undefined): number | null => {
    if (!f) return null;
    if (f.unit === fu) return f.value;
    return fu === "ml" ? Math.round(f.value * 29.5735) : Math.round((f.value / 29.5735) * 10) / 10;
  };
  const rating = (v: number | null) => (v == null ? null : Math.max(1, Math.min(10, Math.round(v))));

  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto" data-fit-profile>
      <Card title="ATHLETE PROFILE · fit-profile" accent={C.cyan} right={<span className="text-[9px]" style={{ color: C.dim }}>Blank until you enter it — nothing prefilled</span>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Field label="Name">
            <input style={inputStyle} placeholder="—" value={profile.name ?? ""} onChange={(e) => onProfile({ name: e.target.value || null })} />
          </Field>
          <Field label="Sex">
            <select style={{ ...inputStyle, color: C.cyan }} value={profile.sex ?? ""} onChange={(e) => onProfile({ sex: (e.target.value || null) as FitSex | null })}>
              <option value="">—</option>
              <option value="male">male</option>
              <option value="female">female</option>
              <option value="unspecified">unspecified</option>
            </select>
          </Field>
          <Field label="Age (yr)"><NumIn value={profile.age_yr} onChange={(n) => onProfile({ age_yr: n })} /></Field>
          <Field label="Units">
            <select
              style={{ ...inputStyle, color: C.cyan }}
              value={units}
              onChange={(e) => onProfile({ units: e.target.value as FitUnitSystem, height: null, goal_weight: null })}
              title="Switching units clears height + goal so nothing is silently converted"
            >
              <option value="imperial">lb · in · oz</option>
              <option value="metric">kg · cm · ml</option>
            </select>
          </Field>
          <Field label={`Height (${hu})`}><NumIn value={profile.height} onChange={(n) => onProfile({ height: n })} /></Field>
          <Field label="Resting HR (opt)"><NumIn value={profile.resting_hr} onChange={(n) => onProfile({ resting_hr: n })} /></Field>
          <Field label={`Goal weight (${wu})`}><NumIn value={profile.goal_weight} onChange={(n) => onProfile({ goal_weight: n })} /></Field>
          <Field label="Goal date">
            <input type="date" style={inputStyle} className={styles.mono} value={profile.goal_date ?? ""} onChange={(e) => onProfile({ goal_date: e.target.value || null })} />
          </Field>
        </div>
        <p className="mt-2 text-[9px]" style={{ color: C.dim }}>
          Plan goal: ~10 lb by 2026-11-05 (enter your own goal weight — not prefilled). Morning weight + height + age + sex feed BMR → energy budget:
          {" "}<span className={styles.mono} style={{ color: bmrKcal != null ? C.cyan : C.dim }}>{bmrKcal != null ? `BMR ${bmrKcal} kcal/day` : "BMR —"}</span>
        </p>
      </Card>

      <Card title={`DAILY WEIGH-INS · ${day.date}`} accent={C.gold}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Field label={`Morning fasted (${wu})`}><NumIn value={wIn(morning)} onChange={(n) => setWeigh("morning", n)} /></Field>
          <Field label={`Evening (${wu})`}><NumIn value={wIn(evening)} onChange={(n) => setWeigh("evening", n)} /></Field>
          <Field label="Sleep hrs (next AM)">
            <NumIn value={day.sleep_hrs} onChange={(n) => onDay((prev) => ({ ...prev, sleep_hrs: n }))} />
          </Field>
          <Stat label="Day water swing" value={swing != null ? fmtWeight(swing, units) : "—"} sub="morning − evening" color={C.text} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Stat label="Latest morning" value={fmtWeight(latestKg, units)} />
          <Stat label="Lost since first AM" value={lostSoFar != null ? fmtWeight(lostSoFar, units) : "—"} color={C.green} sub={trend.length > 1 ? `${trend.length} mornings` : "needs 2+ mornings"} />
          <Stat label="To goal" value={remaining != null ? fmtWeight(remaining, units) : "—"} color={C.gold} sub={profile.goal_date ? `by ${profile.goal_date}` : "set goal"} />
        </div>
        {trend.length > 0 && (
          <div className={`mt-2 flex flex-wrap gap-2 text-[9px] ${styles.mono}`} style={{ color: C.dim }}>
            {trend.slice(-7).map((p) => <span key={p.date}>{p.date.slice(5)} {fmtWeight(p.kg, units)}</span>)}
          </div>
        )}
        <p className="mt-1 text-[8px]" style={{ color: C.dim }}>Goal trend uses MORNING (fasted) weight only. Post-workout and evening weights measure water, not fat.</p>
      </Card>

      {day.workouts.map((wk) => {
        const r = day.recovery?.[wk.id];
        const s = sweatLoss({ pre: r?.pre_weight, morning, post: r?.post_weight, fluids: r?.fluids });
        const pctColor = s.pctBodyMass == null ? C.dim : s.warn ? C.amber : C.green;
        return (
          <Card
            key={wk.id}
            title={`SESSION · ${(wk.title || wk.type).toUpperCase()}`}
            accent={wk.status === "completed" ? C.green : C.cyan}
            right={<span className="text-[9px] uppercase" style={{ color: wk.status === "completed" ? C.green : C.amber }}>{wk.status ?? "planned"}</span>}
          >
            <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Hydration</div>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Field label={`Pre weight (${wu}, opt)`}><NumIn value={wIn(r?.pre_weight)} onChange={(n) => setRec(wk.id, { pre_weight: w(n) })} /></Field>
              <Field label={`Post weight (${wu})`}><NumIn value={wIn(r?.post_weight)} onChange={(n) => setRec(wk.id, { post_weight: w(n) })} /></Field>
              <Field label={`Fluids drunk (${fu})`}><NumIn value={fluidIn(r?.fluids)} onChange={(n) => setRec(wk.id, { fluids: fluid(n) })} /></Field>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Sweat loss" value={s.sweatKg != null ? `${fmtWeight(s.sweatKg, units)} · ${fmtFluidL(s.sweatKg, units)}` : "—"} sub="pre − post + fluids" color={C.text} />
              <Stat label="% body mass" value={s.pctBodyMass != null ? `${s.pctBodyMass.toFixed(1)}%` : "—"} color={pctColor} sub={`warn ≥ ${DEHYDRATION_WARN_PCT}%`} />
              <Stat label="Rehydrate" value={s.rehydrateL ? `${fmtFluidL(s.rehydrateL[0], units)}–${fmtFluidL(s.rehydrateL[1], units)}` : "—"} sub="1.25–1.5 × deficit" color={C.cyan} />
              <Stat label="Pre basis" value={s.massLossKg == null ? "—" : s.usedMorningAsPre ? "morning" : "pre"} color={C.dim} />
            </div>
            {s.warn && (
              <div className="mt-2 rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: `${C.amber}88`, color: C.amber, background: `${C.amber}14` }} data-fit-dehydration>
                ⚠ Body-mass loss {s.pctBodyMass!.toFixed(1)}% ≥ {DEHYDRATION_WARN_PCT}% — rehydrate with electrolytes before the next session.
              </div>
            )}

            <div className="mt-3 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Recovery log</div>
            <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <Field label="RPE 1–10"><NumIn value={r?.rpe} onChange={(n) => setRec(wk.id, { rpe: rating(n) })} /></Field>
              <Field label="Soreness 1–10"><NumIn value={r?.soreness} onChange={(n) => setRec(wk.id, { soreness: rating(n) })} /></Field>
              <Field label="Feel 1–10"><NumIn value={r?.feel} onChange={(n) => setRec(wk.id, { feel: rating(n) })} /></Field>
              <Field label="Protein (g)"><NumIn value={r?.protein_g} onChange={(n) => setRec(wk.id, { protein_g: n })} /></Field>
              <Field label="Carbs (g)"><NumIn value={r?.carbs_g} onChange={(n) => setRec(wk.id, { carbs_g: n })} /></Field>
              <Field label="Fuel 30–60 min">
                <span className="flex h-[30px] items-center gap-1 text-[10px] normal-case" style={{ color: r?.fuel_done ? C.green : C.dim }}>
                  <input type="checkbox" checked={!!r?.fuel_done} onChange={(e) => setRec(wk.id, { fuel_done: e.target.checked })} /> done
                </span>
              </Field>
            </div>
            <div className="mt-2">
              <Field label="Notes">
                <input style={inputStyle} placeholder="—" value={r?.notes ?? ""} onChange={(e) => setRec(wk.id, { notes: e.target.value })} />
              </Field>
            </div>
          </Card>
        );
      })}
      <p className="px-1 text-[8px]" style={{ color: C.dim }}>
        Hydration per ACSM Exercise &amp; Fluid Replacement: avoid &gt;2% body-mass loss; replace ~1.25–1.5 L per kg lost. See docs/fitness-2525/ENERGY_MODEL.md.
      </p>
    </div>
  );
}

export default AthleteProfile;
