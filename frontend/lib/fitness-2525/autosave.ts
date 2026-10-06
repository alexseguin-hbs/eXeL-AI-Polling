/**
 * Fitness-2525 · AsM #14 — push device days on sign-in + fit-index change check.
 * Signed out, every entry stays on the device (fit2525-day:<date>); on sign-in each device day is merged with its
 * cloud row (union by id, tombstones honoured) and written only when the merge changed it.
 */
import { DEVICE_DAY_KEY, DEVICE_INDEX_KEY, mergeFitDays, putDay, readDay } from "./cloud";
import type { FitDay, FitIndex } from "./types";

export function sameDays(a: FitIndex | null | undefined, b: FitIndex | null | undefined): boolean {
  const x = [...(a?.days ?? [])].sort().join(",");
  const y = [...(b?.days ?? [])].sort().join(",");
  return x === y;
}

const readJson = <T>(key: string): T | null => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

/** Stable JSON for "did the merge change anything" (ignores key order). */
export function stableJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as Record<string, unknown>).sort()
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableJson((v as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

/** Push every device day except `skipDate` (the live day syncs through syncOnce). Returns days written. */
export async function pushDeviceDays(owner: string, skipDate?: string): Promise<number> {
  const idx = readJson<FitIndex>(DEVICE_INDEX_KEY);
  let wrote = 0;
  for (const date of idx?.days ?? []) {
    if (!date || date === skipDate) continue;
    const local = readJson<FitDay>(`${DEVICE_DAY_KEY}:${date}`);
    if (!local || local.source === "fitness-2525-example") continue;
    const remote = await readDay(owner, date);
    if (remote.state !== "ok") continue;
    const merged = mergeFitDays(local, remote.data);
    if (remote.data && stableJson(merged) === stableJson(remote.data)) continue;
    if ((await putDay(owner, merged)) === "saved") {
      wrote += 1;
      try { localStorage.setItem(`${DEVICE_DAY_KEY}:${date}`, JSON.stringify(merged)); } catch { /* ignore */ }
    }
  }
  return wrote;
}
