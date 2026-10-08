"use client";

/** FITNESS-2525 · Command UX 1 — LIVE TODAY board (timeline: swim done · bike next · mobility). */
import type { CSSProperties } from "react";
import type { FitDay } from "@/lib/fitness-2525/types";
import { UploadWorkout } from "./upload-workout";
import { type EnergyRateUnit, burnDayRates, pickRate, formatCalRate, ratesFromKcal } from "@/lib/fitness-2525/energy";
import { buildDayBudget, rideFuelingNote } from "@/lib/fitness-2525/budget";
import { durationToMinutes } from "@/lib/fitness-2525/profile";
import styles from "./fitness-2525.module.css";
import { C, type DayField } from "./ux-helpers";
import { Panel } from "./ux-widgets";
import { AuthGate } from "./auth-gate";

export function LiveTodayBoard({
  day, budget, rateUnit, showAllRates, anthroUnknown, onStartRide, applyDay, btnPrimary, btnGhost, inputStyle, setField,
  signedIn, onSignIn, authLoading,
}: {
  day: FitDay;
  budget: ReturnType<typeof buildDayBudget>;
  rateUnit: EnergyRateUnit;
  showAllRates: boolean;
  anthroUnknown: boolean;
  onStartRide: () => void;
  applyDay: (updater: (prev: FitDay) => FitDay) => void;
  btnPrimary: CSSProperties;
  btnGhost: CSSProperties;
  inputStyle: CSSProperties;
  setField: (field: DayField, raw: string) => void;
  signedIn: boolean;
  onSignIn: () => void;
  authLoading?: boolean;
}) {
  const swim = day.workouts.find((w) => w.type === "swim");
  const bike = day.workouts.find((w) => w.type === "bike");
  const mobility = day.workouts.find((w) => /mobility/i.test(w.type));
  const g = swim?.garmin;
  const sugarCap = budget.sugarCapG;
  const bikeMin = typeof bike?.minutes === "number" && bike.minutes > 0 ? bike.minutes : null;
  const bikeBurnEst = anthroUnknown ? null : budget.windows.find((w) => w.id === bike?.id)?.burnKcal ?? null;
  const burnedSoFar = budget.totalBurnKcal;
  const outShown = burnedSoFar ?? budget.workoutBurnKcal;
  const net =
    burnedSoFar != null && day.calories_in != null && Number.isFinite(day.calories_in)
      ? burnedSoFar - day.calories_in
      : null;
  const burnRates = burnDayRates(day.calories_out);
  const swimKcal = typeof g?.kcal === "number" ? g.kcal : typeof swim?.calories === "number" ? swim.calories : null;
  const swimMin = durationToMinutes(g?.duration) ?? (typeof swim?.minutes === "number" ? swim.minutes : null);
  const swimRates = ratesFromKcal(swimKcal, swimMin);
  const bikeRates = ratesFromKcal(bikeBurnEst, bikeMin);
  const rateText = (r: ReturnType<typeof ratesFromKcal>) =>
    showAllRates
      ? (["per_hr", "per_min", "per_sec"] as EnergyRateUnit[]).map((u) => formatCalRate(pickRate(r, u), u)).join(" · ")
      : formatCalRate(pickRate(r, rateUnit), rateUnit);
  const dash = (v: unknown) => (v == null || v === "" ? "—" : String(v));

  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
      <div className="rounded-lg border px-3 py-2" style={{ borderColor: `${C.cyan}66`, background: `${C.cyan}08` }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>LIVE TODAY · Mon Oct 5 2026 · America/Chicago</div>
            <div className="text-[11px]" style={{ color: C.dim }}>Block 1 · Work Day 3 · Ironman Cozumel 2026-11-22</div>
          </div>
          <div className={`text-right ${styles.mono}`}>
            <div className="text-[10px]" style={{ color: C.dim }}>Day burn rate</div>
            <div className="text-sm font-bold" style={{ color: C.cyan }}>{rateText(burnRates)}</div>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
          <div>
            <dt className="text-[9px] uppercase" style={{ color: C.dim }}>Calories out</dt>
            <dd className={`text-lg font-bold tabular-nums ${styles.mono}`} style={{ color: C.red }}>{outShown != null ? outShown : "—"}</dd>
            <div className="text-[8px]" style={{ color: C.dim }}>{burnedSoFar != null ? "BMR + NEAT + done workouts" : outShown != null ? "done workouts only · add PROFILE for BMR" : "logged so far"}</div>
          </div>
          <div>
            <dt className="text-[9px] uppercase" style={{ color: C.dim }}>Calories in</dt>
            <dd className={`text-lg font-bold tabular-nums ${styles.mono}`} style={{ color: C.green }}>{day.calories_in != null ? day.calories_in : "—"}</dd>
            <div className="text-[8px]" style={{ color: C.dim }}>blank until entered</div>
          </div>
          <div>
            <dt className="text-[9px] uppercase" style={{ color: C.dim }}>Steps</dt>
            <dd className={`text-lg font-bold tabular-nums ${styles.mono}`} style={{ color: C.text }}>{day.steps != null ? day.steps : "—"}</dd>
          </div>
          <div>
            <dt className="text-[9px] uppercase" style={{ color: C.dim }}>Net (out−in)</dt>
            <dd className={`text-lg font-bold tabular-nums ${styles.mono}`} style={{ color: net != null ? C.gold : C.dim }}>{net != null ? net : "—"}</dd>
            <div className="text-[8px]" style={{ color: C.dim }}>{net == null ? "needs intake" : "kcal"}</div>
          </div>
        </dl>
        {signedIn ? (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[9px] uppercase" style={{ color: C.dim }}>
              Log calories in
              <input style={inputStyle} className={styles.mono} inputMode="decimal" placeholder="—" value={typeof day.calories_in === "number" ? String(day.calories_in) : ""} onChange={(e) => setField("calories_in", e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-[9px] uppercase" style={{ color: C.dim }}>
              Steps
              <input style={inputStyle} className={styles.mono} inputMode="decimal" placeholder="—" value={typeof day.steps === "number" ? String(day.steps) : ""} onChange={(e) => setField("steps", e.target.value)} />
            </label>
          </div>
        ) : (
          <div className="mt-2">
            <AuthGate compact onSignIn={onSignIn} isLoading={authLoading} message="Sign in with Auth0 to log calories in, steps, and other personal day fields." />
          </div>
        )}
      </div>
      <Panel title="TIMELINE · TODAY" accent={C.cyan}>
        <div className={styles.timelineRail}>
          <div className="relative mb-3 rounded border p-2" style={{ borderColor: `${C.green}66`, background: `${C.green}10` }}>
            <span className={`${styles.timelineDot} ${styles.timelineDotDone}`} style={{ top: 14 }} />
            <div className="flex flex-wrap items-start justify-between gap-2 pl-2">
              <div>
                <div className="text-[10px] font-bold uppercase" style={{ color: C.green }}>✓ Completed · Pool swim</div>
                <div className="text-[11px] font-semibold" style={{ color: C.text }}>{swim?.title ?? "Swim"} · {dash(g?.start)}–{dash(g?.end)}</div>
                <div className={`mt-1 text-[10px] ${styles.mono}`} style={{ color: C.dim }}>
                  {dash(g?.duration)} · {swim?.distance ? `${swim.distance.value} ${swim.distance.unit}` : "—"} · {dash(g?.pace)} · HR {dash(g?.avg_hr)} · {dash(g?.zone)}
                </div>
                <div className={`mt-1 text-[11px] font-bold ${styles.mono}`} style={{ color: C.cyan }}>
                  {swimKcal != null ? `${swimKcal} kcal` : "— kcal"} · {rateText(swimRates)}
                </div>
              </div>
              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${C.green}22`, color: C.green }}>GARMIN</span>
            </div>
          </div>
          <div className="relative mb-3 rounded border p-2" style={{ borderColor: `${C.amber}88`, background: `${C.amber}12` }}>
            <span className={`${styles.timelineDot} ${styles.timelineDotNext}`} style={{ top: 14 }} />
            <div className="pl-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase" style={{ color: C.amber }}>● Next · Bike trainer</div>
                  <div className="text-[11px] font-semibold" style={{ color: C.text }}>{bike?.title ?? "Bike trainer tempo 75–90 min"}</div>
                  <div className="mt-1 text-[10px]" style={{ color: C.dim }}>3 × 12 min steady tempo · planned {bikeMin != null ? `${bikeMin} min` : "— min"}</div>
                </div>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${C.amber}22`, color: C.amber }}>PRE-RIDE</span>
              </div>
              <div className="mt-2 rounded border p-2" style={{ borderColor: C.border, background: "#0b1119" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.gold }}>Pre-ride budget</div>
                <ul className="mt-1 space-y-1 text-[10px]" style={{ color: C.text }}>
                  <li>• {rideFuelingNote(bikeMin)}</li>
                  <li>• Sugar cap (rest of day): <span className={styles.mono}>{sugarCap != null ? `${sugarCap} g` : "—"}</span> (AHA/WHO)</li>
                  <li>• Estimated burn: <span className={styles.mono}>{bikeBurnEst != null ? `~${bikeBurnEst} kcal (estimate)` : "— (enter weight for estimate)"}</span></li>
                  <li>• Est. rate: <span className={styles.mono}>{rateText(bikeRates)}</span>{bikeBurnEst != null ? " (estimate)" : ""}</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" style={btnPrimary} onClick={onStartRide}>Start ride</button>
                  <button type="button" style={btnGhost} onClick={() => document.getElementById("fit-upload")?.scrollIntoView({ behavior: "smooth", block: "nearest" })}>Upload workout</button>
                </div>
                <div className="mt-2">
                  <UploadWorkout day={day} applyDay={applyDay} signedIn={signedIn} onSignIn={onSignIn} authLoading={authLoading} btnPrimary={btnPrimary} btnGhost={btnGhost} />
                </div>
              </div>
            </div>
          </div>
          <div className="relative rounded border p-2" style={{ borderColor: C.border, background: C.panel }}>
            <span className={`${styles.timelineDot} ${styles.timelineDotLater}`} style={{ top: 14 }} />
            <div className="pl-2">
              <div className="text-[10px] font-bold uppercase" style={{ color: C.dim }}>○ Evening · Mobility</div>
              <div className="text-[11px]" style={{ color: C.text }}>{mobility?.title ?? "Mobility"} · {typeof mobility?.minutes === "number" ? `${mobility.minutes} min` : "— min"}</div>
              <div className="text-[10px]" style={{ color: C.dim }}>No second hard workout — stay loose for tomorrow.</div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
