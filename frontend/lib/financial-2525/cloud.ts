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
 * NO CHANGE EVER DELETES AN ENTRY (FD-72) holds across the wire. r.073 (round 1 of 33): when the account copy and the device copy have
 * diverged they are UNITED (record.ts unionRecords) — every entry of both, the account read before every write (get → unite → put), so a
 * second device's entries are never written over or set aside where no screen reads them. Only an account copy that fails its chain
 * is kept whole under "fin-record-kept-<time>" (never adopted, never merged) before anything is written.
 */
import { supabase } from "../supabase";
import { unionRecords, sameChain, isVerified, stableJson, type FinRecord } from "./record";
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
export async function cloudGet<T>(owner: string, name: string): Promise<T | null> { return (await cloudRead<T>(owner, name)).data; }
/** A read that says whether it was READ (r.073): "ok" with the row (null when there is none), or "offline" / "error" — a failed read is
 *  never mistaken for an empty account, so nothing is written over an account copy that could not be seen. */
export async function cloudRead<T>(owner: string, name: string): Promise<{ state: "ok" | "off" | "offline" | "error"; data: T | null }> {
  if (!supabase) return { state: "off", data: null };   // no account store set up on this site: nothing to read, nothing lost
  try { const { data, error } = await supabase.rpc("innovation_state_get", { p_owner: owner, p_name: name }); return error ? { state: "error", data: null } : { state: "ok", data: (data ?? null) as T | null }; }
  catch { return { state: "offline", data: null }; }
}
export interface PlanDoc { lines: LadderLine[]; at: number }
export interface CardsDoc { cards: unknown[]; at: number }
/** A budget or cards edit's time (r.073 second pre-push review, Krishna): never at or before the time this device last saw — the account's
 *  included — so an edit made after taking the account's copy is never older than it on a phone whose clock runs behind. */
export const nextStamp = (seen: number, now: number): number => Math.max(now, (Number.isFinite(seen) ? seen : 0) + 1);
/** THE BUDGET'S AND THE CARDS' ACCOUNT RULE — what one sync does with this device's copy (its content and the time it was edited) and the
 *  account's (null when the account holds none, or none that reads): "take" the account's when it was edited later; "send" this device's when
 *  it was edited later; "resend" it under a new time when the times are equal but the content is not (the row r.072's stale 12-hour push
 *  reverted); "same" when there is nothing to do. Content is compared WITHOUT regard to key order — the account store keeps jsonb and hands
 *  keys back shortest-first, so identical cards used to read as "other content" and went up again on every sync, beating a newer edit made
 *  on another device (Krishna). `needsTime`: a tie only repairs a copy this device has actually edited (the cards' rule). Pure. */
export function syncChoice(local: { doc: unknown; at: number }, remote: { doc: unknown; at: number } | null, needsTime = false): "take" | "send" | "resend" | "same" {
  if (remote && remote.at > local.at) return "take";
  if (!remote || local.at > remote.at) return "send";
  if (stableJson(remote.doc) === stableJson(local.doc) || (needsTime && !(local.at > 0))) return "same";
  return "resend";
}
/** The three rows of a person's account copy, each read with its state (r.073: get → unite → put). */
export async function readAll(owner: string) {
  const [r, p, c] = await Promise.all([cloudRead<FinRecord>(owner, "fin-record"), cloudRead<PlanDoc>(owner, "fin-plan"), cloudRead<CardsDoc>(owner, "fin-cards")]);
  return { r, p, c };
}
export interface PrefsDoc { dateFmt?: string; currency?: string; angle?: number; span?: string; at: number }

/** The record both copies make together (r.073: unionRecords — every entry of both), whether the account still lacks some of it
 *  (push), and the account copy to keep whole when it fails its chain (keep: never adopted, never merged). Pure. */
export function mergeRecords(device: FinRecord, cloud: FinRecord | null): { current: FinRecord; keep: FinRecord | null; push: boolean } {
  if (!cloud || !Array.isArray(cloud.entries) || cloud.entries.length === 0) return { current: device, keep: null, push: device.entries.length > 0 };
  if (!isVerified(cloud)) return { current: device, keep: cloud, push: device.entries.length > 0 };
  const current = unionRecords(device, { ...cloud, owner: device.owner });
  return { current, keep: null, push: !sameChain(current, cloud) };
}
