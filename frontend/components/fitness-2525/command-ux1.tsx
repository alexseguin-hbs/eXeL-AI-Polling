"use client";

/**
 * FITNESS-2525 · Command UX 1 — Auth0 gates personal input; EXAMPLE stays labeled.
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
import { RequireAuth } from "./auth-gate";
import { aiStatus } from "@/lib/fitness-2525/ai";

/** Modules: ux-* panels + hooks; PROFILE/CONNECTIONS separate. Auth gates in auth-gate.tsx. */
export function FitnessCommandUX1() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently, getIdTokenClaims } = useAuth0();
  const owner = isAuthenticated && user?.sub ? user.sub : null;
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
      await getAccessTokenSilently({ cacheMode: "off" });
      return await idToken();
    } catch {
      return null;
    }
  }, [getAccessTokenSilently, getIdTokenClaims]);

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
  const { profile, updateProfile, history, rateUnit, showAllRates, setRateUnit, setShowAllRates, aiProvider, setAiProvider } =
    useFitProfile({ cloudKey, day, hydrated });
  const [haveKeys, setHaveKeys] = useState<{ openai?: boolean; gemini?: boolean; grok?: boolean; claude?: boolean } | null>(null);
  const [lastCost, setLastCost] = useState<{ provider: string; model: string; costUsd: number | null } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chartSpan, setChartSpan] = useState<ChartSpan>("1D");
  const [selectedId, setSelectedId] = useState<string | null>("w-2026-10-05-bike");
  useEffect(() => {
    void aiStatus().then((c) => setHaveKeys(c ? { openai: !!c.openai, gemini: !!c.gemini, grok: !!c.grok, claude: !!c.claude } : null));
  }, []);
  const act = useFitActions({
    day, applyDay, exampleMode, setExampleMode, setTab, aiReady, coachDraft, setCoachDraft, setShareMsg, syncOnce, loginWithRedirect,
    aiProvider, onCoachResult: setLastCost,
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
  const burnOutKcal = budget.totalBurnKcal;
  const delta = burnOutKcal != null && typeof day.calories_in === "number" && Number.isFinite(day.calories_in) ? burnOutKcal - day.calories_in : null;
  const deficit = delta != null && delta > 0;

  const statusColor = planStatus === "synced" ? C.green : planStatus === "pending" ? C.amber : C.dim;
  const inputStyle = INPUT_STYLE;
  const btnGhost = BTN_GHOST;
  const btnPrimary = BTN_PRIMARY;

  return (
    <div className={`fixed inset-0 z-[70] flex flex-col overflow-hidden ${styles.root}`} style={{ background: C.bg, color: C.text }} data-fit-surface>
      <TopStrip
        tab={tab} setTab={setTab} user={user} owner={owner} isLoading={isLoading}
        signIn={signIn}
        onSignOut={() => logout({ logoutParams: { returnTo: typeof window !== "undefined" ? window.location.origin : undefined } })}
        btnGhost={btnGhost} btnPrimary={btnPrimary}
      />
      <div className={`grid min-h-0 flex-1 gap-2 overflow-hidden p-2 ${styles.bodyGrid}`} style={{ gridTemplateColumns: "minmax(200px,240px) minmax(0,1fr) minmax(200px,240px)" }}>
        <SessionsRail tab={tab} setTab={setTab} day={day} selected={selected} setSelectedId={setSelectedId} syncOnce={syncOnce} applyDay={applyDay} signedIn={!!owner} onSignIn={signIn} />
        {tab === "PROFILE" ? (
          <RequireAuth signedIn={!!owner} onSignIn={signIn} isLoading={isLoading} message="Sign in with Auth0 to view and save your athlete profile.">
            <AthleteProfile profile={profile} onProfile={updateProfile} day={day} onDay={applyDay} history={history} bmrKcal={budget.bmrKcal} />
          </RequireAuth>
        ) : tab === "CONNECTIONS" ? (
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
            <ConnectionsCard isAuthenticated={!!owner} isLoading={isLoading} onSignIn={signIn} getToken={getFitToken} onSynced={() => { void syncOnce(); }} />
          </div>
        ) : tab === "TODAY" ? (
          <LiveTodayBoard
            day={day} budget={budget} rateUnit={rateUnit} showAllRates={showAllRates}
            anthroUnknown={anthro.weightKg == null} btnPrimary={btnPrimary} btnGhost={btnGhost} inputStyle={inputStyle}
            setField={setField} signedIn={!!owner} onSignIn={signIn} authLoading={isLoading} applyDay={applyDay}
            onStartRide={() => {
              setSelectedId("w-2026-10-05-bike");
              setShareMsg("Ride started — timer local; sync Garmin when done.");
              addCheckin("Started bike trainer tempo", "ui", "Start ride");
            }}
          />
        ) : (
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          <EnergyUnitsCard day={day} owner={owner} rateUnit={rateUnit} setRateUnit={setRateUnit} showAllRates={showAllRates} setShowAllRates={setShowAllRates} settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} fuelPer={fuelPer} burnPer={burnPer} netPer={netPer} deficit={deficit} delta={delta} burnOutKcal={burnOutKcal} coachBusy={coachBusy} runCoach={runCoach} btnPrimary={btnPrimary} />
          {exampleMode && (
            <div className={styles.exampleBanner} data-fit-example>EXAMPLE DATA — demo numbers for review only · not athlete measurements</div>
          )}
          <EnergyBudgetPanel day={day} budget={budget} exampleMode={exampleMode} toggleExample={act.toggleExample} setField={setField} setWeightLb={act.setWeightLb} setWindowIntake={act.setWindowIntake} applyDay={applyDay} inputStyle={inputStyle} btnGhost={btnGhost} signedIn={!!owner} onSignIn={signIn} authLoading={isLoading} />
          <RealtimeEnergyPanel day={day} rateUnit={rateUnit} setRateUnit={setRateUnit} chartSpan={chartSpan} setChartSpan={setChartSpan} fuelPer={fuelPer} burnPer={burnPer} fuelRates={fuelRates} burnRates={burnRates} setField={setField} inputStyle={inputStyle} signedIn={!!owner} onSignIn={signIn} authLoading={isLoading} />
          {(tab === "PLANNING" || tab === "ENERGY") && (
            <RequireAuth signedIn={!!owner} onSignIn={signIn} isLoading={isLoading} message="Sign in with Auth0 to add or save training plans and workouts.">
              <SessionPanel selected={selected} selectedBurn={selectedBurn} rateUnit={rateUnit} toggleWorkout={toggleWorkout} btnGhost={btnGhost} applyDay={applyDay} inputStyle={inputStyle} onSelect={setSelectedId} />
            </RequireAuth>
          )}
          {tab === "NUTRITION" && (
            <RequireAuth signedIn={!!owner} onSignIn={signIn} isLoading={isLoading} message="Sign in with Auth0 to log meals and nutrition.">
              <NutritionPanel day={day} applyDay={applyDay} sugarCapG={budget.sugarCapG} coachBusy={coachBusy} runCoach={runCoach} btnGhost={btnGhost} btnPrimary={btnPrimary} inputStyle={inputStyle} />
            </RequireAuth>
          )}
          {tab === "COACH" && (
            <CoachPanel coachDraft={coachDraft} setCoachDraft={setCoachDraft} coachBusy={coachBusy} coachErr={act.coachErr} aiReady={aiReady} runCoach={runCoach} saveCoach={act.saveCoach} inputStyle={inputStyle} btnPrimary={btnPrimary} btnGhost={btnGhost} aiProvider={aiProvider} setAiProvider={setAiProvider} haveKeys={haveKeys} lastCost={lastCost} />
          )}
          <div className={`min-h-[80px] flex-1 rounded-lg border ${styles.stageGrid}`} style={{ borderColor: C.border, background: "#070b12" }} />
        </div>
        )}
        <ActiveItemsRail day={day} selected={selected} setSelectedId={setSelectedId} toggleWorkout={toggleWorkout} checkinDraft={act.checkinDraft} setCheckinDraft={act.setCheckinDraft} addCheckin={() => addCheckin()} owner={owner} planStatus={planStatus} statusColor={statusColor} shareMsg={shareMsg} cloudState={cloudState} completed={completed} onShare={act.onShare} onSubmit={act.onSubmit} inputStyle={inputStyle} onSignIn={signIn} authLoading={isLoading} />
      </div>
    </div>
  );
}

export default FitnessCommandUX1;
