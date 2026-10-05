/**
 * FITNESS-2525 · Command UX 1 — athlete profile hook. The shared rate-unit setting
 * (cal/hr · cal/min · cal/sec) lives in the profile → localStorage + fit-profile cloud.
 */
import { useCallback, useEffect, useState } from "react";
import { nextStamp, syncProfile } from "@/lib/fitness-2525/cloud";
import type { FitDay, FitProfile } from "@/lib/fitness-2525/types";
import type { EnergyRateUnit } from "@/lib/fitness-2525/energy";
import {
  emptyProfile, loadDeviceProfile, saveDeviceProfile, isRateUnit, toKg, DEFAULT_RATE_UNIT,
} from "@/lib/fitness-2525/profile";
import type { MorningPoint } from "./athlete-profile";
import { loadDeviceDay, loadDeviceIndex } from "./ux-helpers";

export function useFitProfile({ cloudKey, day, hydrated }: { cloudKey: string | null; day: FitDay; hydrated: boolean }) {
  const [profile, setProfile] = useState<FitProfile>(() => emptyProfile());
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [history, setHistory] = useState<MorningPoint[]>([]);
  const rateUnit: EnergyRateUnit = isRateUnit(profile.settings?.rate_unit) ? profile.settings!.rate_unit! : DEFAULT_RATE_UNIT;
  const showAllRates = !!profile.settings?.show_all_rates;
  const updateProfile = useCallback((patch: Partial<FitProfile>) => {
    setProfile((prev) => ({
      ...prev, ...patch,
      settings: { ...(prev.settings ?? {}), ...(patch.settings ?? {}) },
      at: nextStamp(prev.at, Date.now()),
    }));
  }, []);
  const setRateUnit = useCallback((u: EnergyRateUnit) => updateProfile({ settings: { rate_unit: u } }), [updateProfile]);
  const setShowAllRates = useCallback((on: boolean) => updateProfile({ settings: { show_all_rates: on } }), [updateProfile]);

  useEffect(() => { setProfile(loadDeviceProfile()); setProfileHydrated(true); }, []);
  useEffect(() => { if (profileHydrated) saveDeviceProfile(profile); }, [profile, profileHydrated]);
  // fit-profile cloud record (incl. settings.rate_unit) once signed in; debounced.
  useEffect(() => {
    if (!cloudKey || !profileHydrated) return;
    const id = window.setTimeout(() => {
      void syncProfile(cloudKey, profile).then((m) => { if (m && m.at !== profile.at) setProfile(m); });
    }, 1500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudKey, profileHydrated, profile.at]);
  // Morning-only weight trend from the device fit-day copies.
  useEffect(() => {
    if (!hydrated) return;
    const pts: MorningPoint[] = [];
    for (const d of loadDeviceIndex().days) {
      const rec = d === day.date ? day : loadDeviceDay(d);
      const kg = toKg(rec?.weigh_ins?.morning);
      if (kg != null) pts.push({ date: d, kg });
    }
    setHistory(pts);
  }, [day, hydrated]);

  return { profile, updateProfile, history, rateUnit, showAllRates, setRateUnit, setShowAllRates };
}
