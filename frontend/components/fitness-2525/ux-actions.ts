/**
 * FITNESS-2525 · Command UX 1 — UI actions: workouts, numeric fields, example overlay,
 * check-ins, AI coach (Worker /api/ai), share / submit.
 */
import { useState, type Dispatch, type SetStateAction } from "react";
import type { FitCheckin, FitDay } from "@/lib/fitness-2525/types";
import {
  EXAMPLE_ANTHRO, EXAMPLE_STEPS, EXAMPLE_SUGAR_G, EXAMPLE_CALORIES_IN, EXAMPLE_CALORIES_OUT, EXAMPLE_WINDOW_INTAKE,
} from "@/lib/fitness-2525/budget";
import { requestCoachFeedback } from "@/lib/fitness-2525/ai";
import { ROUTE, TODAY, seedToday, loadDeviceDay, parseOptionalNum, type DayField, type TabId } from "./ux-helpers";

export function useFitActions({
  day, applyDay, exampleMode, setExampleMode, setTab, aiReady, coachDraft, setCoachDraft, setShareMsg, syncOnce, loginWithRedirect, aiProvider, onCoachResult,
}: {
  day: FitDay;
  applyDay: (updater: (prev: FitDay) => FitDay) => void;
  exampleMode: boolean;
  setExampleMode: Dispatch<SetStateAction<boolean>>;
  setTab: Dispatch<SetStateAction<TabId>>;
  aiReady: boolean;
  coachDraft: string;
  setCoachDraft: Dispatch<SetStateAction<string>>;
  setShareMsg: Dispatch<SetStateAction<string>>;
  syncOnce: () => Promise<boolean>;
  loginWithRedirect: (opts: { appState: { returnTo: string } }) => Promise<void> | void;
  aiProvider: import("@/lib/fitness-2525/ai").AiProvider;
  onCoachResult?: (r: { provider: string; model: string; costUsd: number | null }) => void;
}) {
  const [checkinDraft, setCheckinDraft] = useState("");
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachErr, setCoachErr] = useState("");

  const signIn = () => loginWithRedirect({ appState: { returnTo: `${ROUTE}/` } });

  const toggleWorkout = (id: string) => {
    applyDay((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) =>
        w.id === id ? { ...w, status: w.status === "completed" ? "planned" : "completed" } : w,
      ),
    }));
  };

  const setField = (field: DayField, raw: string) => {
    applyDay((prev) => ({ ...prev, [field]: parseOptionalNum(raw) }));
  };

  const setWindowIntake = (id: string, raw: string) => {
    applyDay((prev) => ({
      ...prev,
      window_intake_kcal: { ...(prev.window_intake_kcal ?? {}), [id]: parseOptionalNum(raw) },
    }));
  };

  const setWeightLb = (raw: string) => {
    const n = parseOptionalNum(raw);
    applyDay((prev) => ({ ...prev, weight: n == null ? null : { value: n, unit: "lb" } }));
  };

  const toggleExample = () => {
    const next = !exampleMode;
    setExampleMode(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("example", "1");
    else url.searchParams.delete("example");
    window.history.replaceState({}, "", url.toString());
    if (next) {
      applyDay((prev) => ({
        ...prev,
        weight: { value: Math.round(EXAMPLE_ANTHRO.weightKg! / 0.45359237), unit: "lb" },
        height_cm: EXAMPLE_ANTHRO.heightCm,
        age_yr: EXAMPLE_ANTHRO.ageYr,
        sex: EXAMPLE_ANTHRO.sex,
        steps: EXAMPLE_STEPS,
        calories_in: EXAMPLE_CALORIES_IN,
        calories_out: EXAMPLE_CALORIES_OUT,
        sugar_out_g: EXAMPLE_SUGAR_G,
        window_intake_kcal: { ...EXAMPLE_WINDOW_INTAKE },
        source: "fitness-2525-example",
      }));
    } else {
      // Back to the athlete's own entries (the device copy never holds the example overlay).
      applyDay(() => loadDeviceDay(TODAY) ?? seedToday());
    }
  };


  const addCheckin = (reply?: string, channel: FitCheckin["channel"] = "ui", prompt = "Manual check-in") => {
    const text = (reply ?? checkinDraft).trim();
    if (!text) return;
    const entry: FitCheckin = {
      id: `c-${day.date}-${Date.now()}`,
      channel,
      prompt,
      prompt_at: new Date().toISOString(),
      reply: text,
      reply_at: new Date().toISOString(),
    };
    applyDay((prev) => ({ ...prev, checkins: [...prev.checkins, entry] }));
    if (!reply) setCheckinDraft("");
  };

    const runCoach = async (focus: "workout" | "nutrition" | "both") => {
    setCoachBusy(true);
    setCoachErr("");
    setTab("COACH");
    try {
      const out = await requestCoachFeedback(day, focus, aiProvider);
      if (!out) {
        setCoachErr(aiReady ? "AI returned empty — try again." : "No AI provider configured on Worker (/api/ai).");
        return;
      }
      const note = `${out.title}\n\n${out.body}`.trim();
      setCoachDraft(note);
      applyDay((prev) => ({ ...prev, coach_note: note }));
      onCoachResult?.({ provider: out.provider, model: out.model, costUsd: out.costUsd });
    } catch (e) {
      setCoachErr(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setCoachBusy(false);
    }
  };

  const saveCoach = () => {
    const note = coachDraft.trim();
    applyDay((prev) => ({ ...prev, coach_note: note || null }));
    if (note) addCheckin(note, "agent", "AI coach note (edited)");
    setShareMsg("Coach note saved to day + checkins");
  };

  const onShare = async () => {
    const payload = JSON.stringify({ date: day.date, workouts: day.workouts, steps: day.steps, calories_in: day.calories_in, calories_out: day.calories_out }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setShareMsg("Day plan copied to clipboard");
    } catch {
      setShareMsg("Clipboard blocked — use Sync / Submit");
    }
  };

  const onSubmit = () => { void syncOnce(); };

  return {
    checkinDraft, setCheckinDraft, coachBusy, coachErr, signIn, toggleWorkout, setField, setWindowIntake,
    setWeightLb, toggleExample, addCheckin, runCoach, saveCoach, onShare, onSubmit,
  };
}
