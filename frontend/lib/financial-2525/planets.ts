/**
 * Financial-2525 reads the Admin panel's Planet LTU table (lib/planet-ltu.ts) — the same localStorage keys the SoI-2525
 * Business Setup writes and mirrors to the cloud config bundle — so an edit there changes every conversion on this
 * surface with no code change (operator addendum 12). Scope, said plainly (FD-18): the mirror is this browser's copy
 * (the owner key is per browser) plus the cloud bundle the pod hydrates; login-bound sync arrives when auth reaches
 * Supabase. On the server (a static export has no window) the seed is read, so the first paint never differs from the
 * seed and hydration never mismatches.
 */
import { PLANET_LTU_KEY, PLANET_LTU_REMOVED_KEY, PLANET_LTU_SEED, planetLtuTable, type PlanetLtuRow } from "@/lib/planet-ltu";

/** The table as saved on this device (reconciled with the seed), or the seed when there is no device. */
export function readPlanetLtu(): PlanetLtuRow[] {
  if (typeof window === "undefined") return [...PLANET_LTU_SEED];
  try { return planetLtuTable(window.localStorage.getItem(PLANET_LTU_KEY), window.localStorage.getItem(PLANET_LTU_REMOVED_KEY)); }
  catch { return [...PLANET_LTU_SEED]; }
}
/** The keys whose `storage` events mean the table changed in another tab. */
export const PLANET_LTU_KEYS: readonly string[] = [PLANET_LTU_KEY, PLANET_LTU_REMOVED_KEY];
