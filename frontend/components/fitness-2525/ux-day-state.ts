/**
 * FITNESS-2525 · Command UX 1 — fit-day state hook: device hydrate, example overlay,
 * owner key (fit2525: + sub), cloud pull / merge / push of fit-day-* + fit-index.
 * AsM #14: every edit autosaves (debounced AUTOSAVE_MS) once signed in; signed out the device copy stands and
 * every device day is pushed on sign-in. fit-index is written once per sync and only when its day list changed.
 * The EXAMPLE overlay is never written to the cloud.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ownerKeyFor, cloudRead, mergeFitDays, mergeFitIndex, putDay, putIndex,
  nextStamp, PUSH_EVERY_MS, LAST_PUSH_KEY, type CloudState,
} from "@/lib/fitness-2525/cloud";
import { pushDeviceDays, sameDays } from "@/lib/fitness-2525/autosave";

export const AUTOSAVE_MS = 2000;
import { type FitDay, type FitIndex, FIT_INDEX_NAME, dayNamespace } from "@/lib/fitness-2525/types";
import {
  EXAMPLE_ANTHRO, EXAMPLE_STEPS, EXAMPLE_SUGAR_G, EXAMPLE_CALORIES_IN, EXAMPLE_CALORIES_OUT, EXAMPLE_WINDOW_INTAKE,
} from "@/lib/fitness-2525/budget";
import { aiStatus, anyAi } from "@/lib/fitness-2525/ai";
import {
  TODAY, type PlanStatus, seedToday, loadDeviceDay, saveDeviceDay, loadDeviceIndex, saveDeviceIndex,
} from "./ux-helpers";

export function useFitDay(owner: string | null) {
  const [day, setDay] = useState<FitDay>(() => seedToday());
  const [exampleMode, setExampleMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [cloudKey, setCloudKey] = useState<string | null>(null);
  const [cloudState, setCloudState] = useState<CloudState>("off");
  const [planStatus, setPlanStatus] = useState<PlanStatus>("draft");
  const [shareMsg, setShareMsg] = useState("");
  const [coachDraft, setCoachDraft] = useState("");
  const [aiReady, setAiReady] = useState(false);
  const dirty = useRef(false);
  const syncing = useRef(false);
  const dayRef = useRef(day);
  dayRef.current = day;
  const [saveTick, setSaveTick] = useState(0);
  const exampleRef = useRef(exampleMode);
  exampleRef.current = exampleMode;

  useEffect(() => {
    const wantExample =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("example") === "1";
    setExampleMode(wantExample);
    const local = loadDeviceDay(TODAY);
    const base = local ? mergeFitDays(local, seedToday(local.at || Date.now())) : seedToday();
    let next: FitDay = {
      ...base,
      weight: base.weight ?? null,
      height_cm: base.height_cm ?? null,
      age_yr: base.age_yr ?? null,
      sex: base.sex ?? null,
      steps: base.steps ?? null,
      calories_in: base.calories_in ?? null,
      calories_out: base.calories_out ?? null,
      sugar_out_g: base.sugar_out_g ?? null,
      window_intake_kcal: base.window_intake_kcal ?? {},
      day_type: base.day_type ?? "work",
      coach_note: base.coach_note ?? null,
    };
    if (wantExample) {
      // EXAMPLE DATA overlay for screenshots only — never a silent default.
      next = {
        ...next,
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
      };
    }
    setDay(next);
    if (next.coach_note) setCoachDraft(next.coach_note);
    const idx = loadDeviceIndex();
    if (!idx.days.includes(TODAY)) saveDeviceIndex({ days: [...idx.days, TODAY].sort(), at: Date.now() });
    setHydrated(true);
    void aiStatus().then((c) => setAiReady(anyAi(c)));
  }, []);

  useEffect(() => {
    if (!hydrated || exampleMode) return; // the EXAMPLE overlay never lands on the device copy either
    saveDeviceDay(day);
    const idx = loadDeviceIndex();
    if (!idx.days.includes(day.date)) saveDeviceIndex({ days: [...idx.days, day.date].sort(), at: Date.now() });
  }, [day, hydrated, exampleMode]);

  useEffect(() => {
    let live = true;
    setCloudKey(null);
    if (owner) void ownerKeyFor(owner).then((k) => { if (live && k) setCloudKey(k); });
    return () => { live = false; };
  }, [owner]);

  const applyDay = useCallback((updater: (prev: FitDay) => FitDay) => {
    setDay((prev) => {
      const next = updater(prev);
      dirty.current = true;
      setPlanStatus("draft");
      return {
        ...next,
        at: nextStamp(prev.at, Date.now()),
        source: next.source === "fitness-2525-seed" ? "fitness-2525-ui" : next.source,
      };
    });
  }, []);

  const syncOnce = useCallback(async (): Promise<boolean> => {
    if (!cloudKey || !owner) {
      setCloudState("off");
      setShareMsg("Saved on this device — sign in to save to your account.");
      return false;
    }
    if (exampleRef.current || dayRef.current.source === "fitness-2525-example") {
      setShareMsg("EXAMPLE DATA is never saved — turn the example off to save your own entries.");
      return false;
    }
    if (syncing.current) return false;
    syncing.current = true;
    const snap = dayRef.current;
    setCloudState("saving");
    setPlanStatus("pending");
    try {
      const remote = await cloudRead<FitDay>(cloudKey, dayNamespace(snap.date));
      if (remote.state === "offline" || remote.state === "error") {
        setCloudState(remote.state);
        setPlanStatus("draft");
        return false;
      }
      const merged = mergeFitDays(snap, remote.data);
      const put = await putDay(cloudKey, merged);
      if (put !== "saved") {
        setCloudState(put);
        setPlanStatus("draft");
        return false;
      }
      // fit-index: once per sync, and only when the day list actually changed.
      const idxRemote = await cloudRead<FitIndex>(cloudKey, FIT_INDEX_NAME);
      const localIdx = loadDeviceIndex();
      const remoteIdx = idxRemote.state === "ok" ? idxRemote.data : null;
      const idxMerged = mergeFitIndex({ days: Array.from(new Set([...localIdx.days, merged.date])), at: Date.now() }, remoteIdx);
      if (idxRemote.state === "ok" && !sameDays(remoteIdx, idxMerged)) await putIndex(cloudKey, idxMerged);
      saveDeviceIndex(idxMerged);
      // Keep any edit typed while this sync was in flight (it autosaves next).
      setDay((prev) => (prev.at > snap.at ? mergeFitDays(prev, merged) : merged));
      saveDeviceDay(dayRef.current.at > snap.at ? mergeFitDays(dayRef.current, merged) : merged);
      dirty.current = dayRef.current.at > snap.at;
      if (dirty.current) setSaveTick((t) => t + 1);
      setCloudState("saved");
      setPlanStatus("synced");
      try { localStorage.setItem(LAST_PUSH_KEY, String(Date.now())); } catch { /* ignore */ }
      setShareMsg(`Saved to your account · ${dayNamespace(merged.date)}`);
      return true;
    } catch {
      setCloudState("error");
      setPlanStatus("draft");
      return false;
    } finally {
      syncing.current = false;
    }
  }, [cloudKey, owner]);

  // Debounced autosave: every edit (applyDay) saves AUTOSAVE_MS after the last keystroke — not only on Submit.
  useEffect(() => {
    if (!cloudKey || !hydrated || !dirty.current) return;
    const id = window.setTimeout(() => { void syncOnce(); }, AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [day.at, cloudKey, hydrated, syncOnce, saveTick]);

  useEffect(() => {
    if (!cloudKey || !hydrated) return;
    let cancelled = false;
    (async () => {
      setCloudState("saving");
      const remote = await cloudRead<FitDay>(cloudKey, dayNamespace(TODAY));
      if (cancelled) return;
      if (remote.state === "ok") {
        setDay((prev) => {
          const merged = mergeFitDays(prev, remote.data);
          saveDeviceDay(merged);
          if (merged.coach_note) setCoachDraft(merged.coach_note);
          return merged;
        });
        setCloudState("saved");
        dirty.current = true;
        // Push every other day this device logged while signed out, then today.
        await pushDeviceDays(cloudKey, TODAY);
        if (!cancelled) void syncOnce();
      } else if (remote.state === "off") setCloudState("off");
      else setCloudState(remote.state);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudKey, hydrated]);

  useEffect(() => {
    if (!cloudKey) return;
    const id = window.setInterval(() => { if (dirty.current) void syncOnce(); }, PUSH_EVERY_MS);
    const onVis = () => { if (document.visibilityState === "visible" && dirty.current) void syncOnce(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [cloudKey, syncOnce]);

  return {
    day, setDay, applyDay, exampleMode, setExampleMode, hydrated, cloudKey, cloudState,
    planStatus, shareMsg, setShareMsg, coachDraft, setCoachDraft, aiReady, syncOnce,
  };
}
