"use client";

/**
 * FITNESS-2525 · Command UX 1
 * ===========================
 * Chrome/layout: Security-2525 Mission PLANNING (dark tactical command network —
 * top status strip, tab rail, left ASSETS-style rail, center stage, right ACTIVE ITEMS,
 * footer PLAN · DRAFT / SHARE / SUBMIT, MIL/eXeL-STD-2525 badges).
 * Energy methodology: Financial Accrual Units hero + REAL-TIME chart pattern
 * (fuel≈income / burn≈expenses / deficit≈net; MoT toggle cal/min · cal/sec · cal/hr).
 * Calories only — no $/kcal pricing. Energy budget: BMR + NEAT + MET workouts;
 * ACSM/ISSN carb windows; WHO/AHA sugar cap; ~10 lb/mo deficit with safety floor.
 * Cloud: innovation_state via fit2525: owner key · fit-day-* · fit-index.
 * AI coach: Worker /api/ai task=draft (OpenAI / Grok / Gemini / Claude).
 * Never invent calorie or weight defaults — leave blank until the athlete sets them.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { intakeDayRates, burnDayRates, workoutBurnRates, pickRate } from "@/lib/fitness-2525/energy";
import styles from "./fitness-2525.module.css";
import { ConnectionsCard } from "./connections";
import { AthleteProfile } from "./athlete-profile";
import { C, TAB_IDS, BTN_GHOST, BTN_PRIMARY, INPUT_STYLE, computeBudget, type TabId } from "./ux-helpers";
import { useFitDay } from "./ux-day-state";
import { useFitProfile } from "./ux-profile-state";
import { useFitActions } from "./ux-actions";
import { TopStrip, SessionsRail } from "./ux-shell";
import { ActiveItemsRail } from "./ux-active-items";
import { LiveTodayBoard } from "./ux-live-today";
import { EnergyUnitsCard, RealtimeEnergyPanel, type ChartSpan } from "./ux-energy";
import { EnergyBudgetPanel } from "./ux-budget";
import { SessionPanel } from "./ux-planning";
import { NutritionPanel } from "./ux-nutrition";
import { CoachPanel } from "./ux-coach";

/**
 * Modules (each < 12 KB): ux-helpers (constants · seed · device storage · styles), ux-widgets,
 * ux-shell (top strip + SESSIONS rail), ux-active-items, ux-live-today, ux-energy, ux-budget,
 * ux-planning, ux-nutrition, ux-coach, hooks ux-day-state / ux-profile-state / ux-actions.
 * PROFILE → athlete-profile.tsx · CONNECTIONS → connections.tsx.
 */
export function FitnessCommandUX1() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently, getIdTokenClaims } = useAuth0();
  const owner = isAuthenticated && user?.sub ? user.sub : null;
  // Worker /api/fitness-2525 verifies RS256 JWTs whose aud = AUTH0_AUDIENCE or AUTH0_CLIENT_ID. Without an API
  // audience the access token is opaque/userinfo-only, so send the ID token (aud = client id); refresh it if stale.
  const getFitToken = useCallback(async (): Promise<string | null> => {
    const apiAudience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || "";
    if (apiAudience) {
      try { const t = await getAccessTokenSilently(); if (t) return t; } catch { /* fall back to the ID token */ }
    }
    const idToken = async () => {
      const c = (await getIdTokenClaims()) as { __raw?: string; exp?: number } | undefined;
      return c?.__raw && (!c.exp || c.exp * 1000 > Date.now() + 60_000) ? c.__raw : null;
    };
    try {
      const fresh = await idToken();
      if (fresh) return fresh;
      await getAccessTokenSilently({ cacheMode: "off" }); // renews the session → new ID token
      return await idToken();
    } catch {
      return null;
    }
  }, [getAccessTokenSilently, getIdTokenClaims]);

  // Tab starts at TODAY on server + first client render; ?tab= is applied after mount
  // (reading window in the initializer caused a hydration mismatch → Next.js "1 error" toast).
  const [tab, setTab] = useState<TabId>("TODAY");
  useEffect(() => {
    try {
      const t = new URL(window.location.href).searchParams.get("tab");
      if (t && TAB_IDS.includes(t as TabId)) setTab(t as TabId);
    } catch { /* ignore */ }
  }, []);
  const {
    day, applyDay, exampleMode, setExampleMode, hydrated, cloudKey, cloudState,
    planStatus, shareMsg, setShareMsg, coachDraft, setCoachDraft, aiReady, syncOnce,
  } = useFitDay(owner);
  const { profile, updateProfile, history, rateUnit, showAllRates, setRateUnit, setShowAllRates } =
    useFitProfile({ cloudKey, day, hydrated });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chartSpan, setChartSpan] = useState<ChartSpan>("1D");
  const [selectedId, setSelectedId] = useState<string | null>("w-2026-10-05-bike");
  const act = useFitActions({
    day, applyDay, exampleMode, setExampleMode, setTab, aiReady, coachDraft, setCoachDraft, setShareMsg, syncOnce, loginWithRedirect,
  });
  const { signIn, setField, runCoach, addCheckin, toggleWorkout, coachBusy } = act;

  const fuelRates = intakeDayRates(day.calories_in);
  const burnRates = burnDayRates(day.calories_out);
  const fuelPer = pickRate(fuelRates, rateUnit);
  const burnPer = pickRate(burnRates, rateUnit);
  const netPer = fuelPer != null && burnPer != null ? fuelPer - burnPer : null;
  const completed = day.workouts.filter((w) => w.status === "completed").length;
  const selected = day.workouts.find((w) => w.id === selectedId) ?? day.workouts[0] ?? null;
  const selectedBurn = selected
    ? workoutBurnRates(selected.calories ?? null, selected.minutes ?? null)
    : null;

  const { anthro, budget } = computeBudget(day, profile, exampleMode);
  // Burn (out) = modeled BMR + NEAT + COMPLETED workouts (device day kcal is never the day burn).
  const burnOutKcal = budget.totalBurnKcal;
  const delta = burnOutKcal != null && typeof day.calories_in === "number" && Number.isFinite(day.calories_in) ? burnOutKcal - day.calories_in : null;
  const deficit = delta != null && delta > 0;

  const statusColor = planStatus === "synced" ? C.green : planStatus === "pending" ? C.amber : C.dim;
  const linkLabel = owner
    ? (cloudState === "saved" ? "LINK: SECURE" : cloudState === "saving" ? "LINK: SYNC…" : cloudState === "offline" ? "LINK: OFFLINE" : "LINK: READY")
    : "LINK: LOCAL";
  const linkColor = owner && cloudState === "saved" ? C.green : owner ? C.amber : C.dim;
  const inputStyle = INPUT_STYLE;
  const btnGhost = BTN_GHOST;
  const btnPrimary = BTN_PRIMARY;

  return (
    <div className={`fixed inset-0 z-[70] flex flex-col overflow-hidden ${styles.root}`} style={{ background: C.bg, color: C.text }} data-fit-surface>
      {/* ── Top status strip (Security) ─────────────────────────────── */}
      <TopStrip
        tab={tab} setTab={setTab} user={user} owner={owner} isLoading={isLoading}
        linkLabel={linkLabel} linkColor={linkColor} signIn={signIn}
        onSignOut={() => logout({ logoutParams: { returnTo: typeof window !== "undefined" ? window.location.origin : undefined } })}
        btnGhost={btnGhost} btnPrimary={btnPrimary}
      />

      {/* ── Body: 3-pane PLANNING layout ──────────────────────────── */}
      <div className={`grid min-h-0 flex-1 gap-2 overflow-hidden p-2 ${styles.bodyGrid}`} style={{ gridTemplateColumns: "minmax(200px,240px) minmax(0,1fr) minmax(200px,240px)" }}>
        {/* LEFT — SESSIONS (ASSETS-style) */}
        <SessionsRail tab={tab} setTab={setTab} day={day} selected={selected} setSelectedId={setSelectedId} syncOnce={syncOnce} applyDay={applyDay} />

        {/* CENTER — PROFILE · CONNECTIONS · LIVE TODAY timeline · energy Accrual hero + chart */}
        {tab === "PROFILE" ? (
          <AthleteProfile
            profile={profile}
            onProfile={updateProfile}
            day={day}
            onDay={applyDay}
            history={history}
            bmrKcal={budget.bmrKcal}
          />
        ) : tab === "CONNECTIONS" ? (
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
            <ConnectionsCard
              isAuthenticated={!!owner}
              isLoading={isLoading}
              onSignIn={signIn}
              getToken={getFitToken}
              onSynced={() => { void syncOnce(); }}
            />
          </div>
        ) : tab === "TODAY" ? (
          <LiveTodayBoard
            day={day}
            budget={budget}
            rateUnit={rateUnit}
            showAllRates={showAllRates}
            anthroUnknown={anthro.weightKg == null}
            btnPrimary={btnPrimary}
            btnGhost={btnGhost}
            inputStyle={inputStyle}
            setField={setField}
            onStartRide={() => {
              setSelectedId("w-2026-10-05-bike");
              setShareMsg("Ride started — timer local; sync Garmin when done.");
              addCheckin("Started bike trainer tempo", "ui", "Start ride");
            }}
            onLogGarmin={() => {
              setSelectedId("w-2026-10-05-bike");
              setShareMsg("Log from Garmin — paste activity when available (no invented kcal).");
              setTab("ENERGY");
            }}
          />
        ) : (
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          <EnergyUnitsCard
            day={day} owner={owner} rateUnit={rateUnit} setRateUnit={setRateUnit}
            showAllRates={showAllRates} setShowAllRates={setShowAllRates}
            settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen}
            fuelPer={fuelPer} burnPer={burnPer} netPer={netPer} deficit={deficit} delta={delta} burnOutKcal={burnOutKcal}
            coachBusy={coachBusy} runCoach={runCoach} btnPrimary={btnPrimary}
          />

          {exampleMode && (
            <div className={styles.exampleBanner} data-fit-example>
              EXAMPLE DATA — demo numbers for review only · not athlete measurements
            </div>
          )}

          <EnergyBudgetPanel
            day={day} budget={budget} exampleMode={exampleMode} toggleExample={act.toggleExample}
            setField={setField} setWeightLb={act.setWeightLb} setWindowIntake={act.setWindowIntake}
            applyDay={applyDay} inputStyle={inputStyle} btnGhost={btnGhost}
          />

          <RealtimeEnergyPanel
            day={day} rateUnit={rateUnit} setRateUnit={setRateUnit} chartSpan={chartSpan} setChartSpan={setChartSpan}
            fuelPer={fuelPer} burnPer={burnPer} fuelRates={fuelRates} burnRates={burnRates}
            setField={setField} inputStyle={inputStyle}
          />

          {(tab === "PLANNING" || tab === "ENERGY") && (
            <SessionPanel selected={selected} selectedBurn={selectedBurn} rateUnit={rateUnit} toggleWorkout={toggleWorkout} btnGhost={btnGhost}
              applyDay={applyDay} inputStyle={inputStyle} onSelect={setSelectedId} />
          )}

          {tab === "NUTRITION" && (
            <NutritionPanel day={day} applyDay={applyDay} sugarCapG={budget.sugarCapG} coachBusy={coachBusy} runCoach={runCoach}
              btnGhost={btnGhost} btnPrimary={btnPrimary} inputStyle={inputStyle} />
          )}
          {tab === "COACH" && (
            <CoachPanel
              coachDraft={coachDraft} setCoachDraft={setCoachDraft} coachBusy={coachBusy} coachErr={act.coachErr}
              aiReady={aiReady} runCoach={runCoach} saveCoach={act.saveCoach}
              inputStyle={inputStyle} btnPrimary={btnPrimary} btnGhost={btnGhost}
            />
          )}

          <div className={`min-h-[80px] flex-1 rounded-lg border ${styles.stageGrid}`} style={{ borderColor: C.border, background: "#070b12" }} />
        </div>
        )}

        {/* RIGHT — ACTIVE ITEMS */}
        <ActiveItemsRail
          day={day} selected={selected} setSelectedId={setSelectedId} toggleWorkout={toggleWorkout}
          checkinDraft={act.checkinDraft} setCheckinDraft={act.setCheckinDraft} addCheckin={() => addCheckin()}
          owner={owner} planStatus={planStatus} statusColor={statusColor} shareMsg={shareMsg}
          cloudState={cloudState} completed={completed} onShare={act.onShare} onSubmit={act.onSubmit}
          inputStyle={inputStyle}
        />
      </div>

    </div>
  );
}

export default FitnessCommandUX1;
