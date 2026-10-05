/**
 * FITNESS-2525 · Command UX 1 — fit-day state hook: device hydrate, example overlay,
 * owner key (fit2525: + sub), cloud pull / merge / push of fit-day-* + fit-index.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ownerKeyFor, cloudRead, mergeFitDays, mergeFitIndex, putDay, putIndex,
  nextStamp, PUSH_EVERY_MS, LAST_PUSH_KEY, type CloudState,
} from "@/lib/fitness-2525/cloud";
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
    if (!hydrated) return;
    saveDeviceDay(day);
    const idx = loadDeviceIndex();
    if (!idx.days.includes(day.date)) saveDeviceIndex({ days: [...idx.days, day.date].sort(), at: Date.now() });
  }, [day, hydrated]);

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
      setShareMsg("Sign in with Auth0 for cloud (owner key fit2525: + sub).");
      return false;
    }
    if (syncing.current) return false;
    syncing.current = true;
    setCloudState("saving");
    setPlanStatus("pending");
    try {
      const remote = await cloudRead<FitDay>(cloudKey, dayNamespace(day.date));
      if (remote.state === "offline" || remote.state === "error") {
        setCloudState(remote.state);
        setPlanStatus("draft");
        return false;
      }
      const merged = mergeFitDays(day, remote.data);
      const put = await putDay(cloudKey, merged);
      if (put !== "saved") {
        setCloudState(put);
        setPlanStatus("draft");
        return false;
      }
      const idxRemote = await cloudRead<FitIndex>(cloudKey, FIT_INDEX_NAME);
      const localIdx = loadDeviceIndex();
      const idxMerged = mergeFitIndex(
        { days: Array.from(new Set([...localIdx.days, merged.date])), at: Date.now() },
        idxRemote.state === "ok" ? idxRemote.data : null,
      );
      await putIndex(cloudKey, idxMerged);
      saveDeviceIndex(idxMerged);
      setDay(merged);
      saveDeviceDay(merged);
      dirty.current = false;
      setCloudState("saved");
      setPlanStatus("synced");
      try { localStorage.setItem(LAST_PUSH_KEY, String(Date.now())); } catch { /* ignore */ }
      setShareMsg(`Synced ${dayNamespace(merged.date)} + fit-index`);
      return true;
    } catch {
      setCloudState("error");
      setPlanStatus("draft");
      return false;
    } finally {
      syncing.current = false;
    }
  }, [cloudKey, owner, day]);

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
        void syncOnce();
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
