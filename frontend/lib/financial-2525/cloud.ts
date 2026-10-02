/**
 * Financial-2525 · THE CLOUD COPY (r.054, addendum 112: "SAVE AN PUSH TO SUPABASE. Identify all saving functions and make sure push
 * is made automatically as well as every 12 hours"; his answer: "Account-ID key (fastest)").
 *
 * Every save on the surface — the record (saveRecord), the budget (savePlan · Reset), the settings (date format · currency · chart
 * angle · chart span) — is pushed to Supabase right after it lands on the device, and again every 12 hours while the page is open
 * (and on return to the page when 12 hours have passed, since a phone pauses timers in the background). On sign-in the cloud copy is
 * read back, so the same account sees the same record and budget on every device and in every tab, private ones included.
 *
 * Storage: the existing innovation_state table through its SECURITY DEFINER RPCs (migration 030 — the anon role has no table access;
 * a row is reached only with its exact owner key). The owner key is SHA-256("fin2525:" + the Auth0 account id), 64 hex — the
 * account-ID key he chose: anyone who learned his account id could read the rows (recorded, his decision, FD-74).
 * Namespaces: "fin-record" · "fin-plan" · "fin-prefs". Never throws; no Supabase env → "offline", the device copy stands.
 *
 * NO CHANGE EVER DELETES AN ENTRY (FD-72) holds across the wire: when the cloud record and the device record have diverged, the one
 * not kept as current is stored whole under "fin-record-kept-<time>" before anything is written.
 */
import { supabase } from "../supabase";
import type { FinRecord } from "./record";
import type { LadderLine } from "./ladder";

export type CloudState = "off" | "saving" | "saved" | "offline" | "error";
export const PUSH_EVERY_MS = 12 * 3600 * 1000;
export const LAST_PUSH_KEY = "fin-cloud-last";

export async function ownerKeyFor(accountId: string): Promise<string | null> {
  try {
    if (!accountId || typeof crypto === "undefined" || !crypto.subtle) return null;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`fin2525:${accountId}`));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch { return null; }
}
export async function cloudPut(owner: string, name: string, payload: unknown): Promise<CloudState> {
  if (!supabase) return "offline";
  try { const { error } = await supabase.rpc("innovation_state_put", { p_owner: owner, p_name: name, p_payload: payload }); return error ? "error" : "saved"; }
  catch { return "offline"; }
}
export async function cloudGet<T>(owner: string, name: string): Promise<T | null> {
  if (!supabase) return null;
  try { const { data, error } = await supabase.rpc("innovation_state_get", { p_owner: owner, p_name: name }); return error ? null : ((data ?? null) as T | null); }
  catch { return null; }
}
export interface PlanDoc { lines: LadderLine[]; at: number }
export interface PrefsDoc { dateFmt?: string; currency?: string; angle?: number; span?: string; at: number }

/** Which record is current, and which (if any) must be kept aside. Pure. */
export function mergeRecords(device: FinRecord, cloud: FinRecord | null): { current: FinRecord; keep: FinRecord | null; push: boolean } {
  if (!cloud || !Array.isArray(cloud.entries) || cloud.entries.length === 0) return { current: device, keep: null, push: device.entries.length > 0 };
  if (device.entries.length === 0) return { current: { ...cloud, owner: device.owner }, keep: null, push: false };
  const prefix = (a: FinRecord, b: FinRecord) => a.entries.every((e, i) => b.entries[i] !== undefined && b.entries[i].hash === e.hash);
  if (prefix(cloud, device)) return { current: device, keep: null, push: device.entries.length > cloud.entries.length };
  if (prefix(device, cloud)) return { current: { ...cloud, owner: device.owner }, keep: null, push: false };
  return { current: device, keep: cloud, push: true };   // diverged: the device copy stays current, the cloud copy is kept whole
}
