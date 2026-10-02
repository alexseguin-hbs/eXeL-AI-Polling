/**
 * Financial-2525 · the record — an append-only, chain-hashed transaction ledger per login (v.000_r.001).
 * ====================================================================================================
 * The R-CORE law from the first line: a transaction is APPENDED, never edited; every entry carries the hash of the
 * entry before it, so a reader can replay the record to any revision and prove nothing in between was altered —
 * the same discipline as docs/drone-2525/operator-deck/REVISIONS.md and the pod's device ledger (lib/pod-store.ts,
 * "time already recorded is never lost or altered"). The device half lives in localStorage under the person's own
 * key (`exel-fin:<owner>`); a cloud half can append to the same shape later without changing this contract.
 *
 * INVARIANT: a deposit or withdrawal, once recorded, is on the record for good; a correction is a NEW entry that
 * says what it corrects. Pure functions take and return records; only the two storage functions touch the device.
 */
import type { FinTx } from "./accrual";

export interface FinEntry { rev: number; at: number; tx: FinTx; prev: string; hash: string }
export interface FinRecord { owner: string; entries: FinEntry[] }

const PREFIX = "exel-fin:";
const KEY = (owner: string) => `${PREFIX}${owner}`;

/** Key-sorted JSON, so the same transaction always hashes the same. */
const stableJson = (v: unknown): string =>
  JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, (x as Record<string, unknown>)[k]])) : x)) ?? "null";
/** FNV-1a, two 32-bit lanes → 16 hex chars. A tamper-evidence chain for a phone, not a signature. */
export function chainHash(prev: string, tx: FinTx, rev: number, at: number): string {
  const s = `${prev}|${rev}|${at}|${stableJson(tx)}`;
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x9e3779b9;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0; h2 = Math.imul(h2 ^ c, 0x0100019b) >>> 0; }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}
export const GENESIS = "0000000000000000";

/** Append one transaction. Idempotent on `tx.id`; returns the same record when the id is already on it. */
export function append(rec: FinRecord, tx: FinTx, at: number): FinRecord {
  if (rec.entries.some((e) => e.tx.id === tx.id)) return rec;
  const rev = rec.entries.length + 1;
  const prev = rec.entries.length ? rec.entries[rec.entries.length - 1].hash : GENESIS;
  return { ...rec, entries: [...rec.entries, { rev, at, tx, prev, hash: chainHash(prev, tx, rev, at) }] };
}
/** The record at or below `rev` (omit for the latest) — the ledger's own render rule. A correction entry (r.062) is not a
 *  transaction of its own: its values replace the corrected transaction's (the latest correction wins), in the original's place. */
export function replay(rec: FinRecord, rev?: number): FinTx[] {
  const upTo = rec.entries.filter((e) => rev === undefined || e.rev <= rev);
  const latest = new Map<string, FinTx>();
  for (const e of upTo) if (e.tx.corrects) latest.set(e.tx.corrects, e.tx);
  return upTo.filter((e) => !e.tx.corrects).map((e) => { const c = latest.get(e.tx.id); return c ? { ...c, id: e.tx.id, kind: e.tx.kind, corrects: undefined } : e.tx; });
}
/** THE EDIT (r.062, addendum 133): what changed is appended as a correction — the original entry, its hash and every later link stay
 *  exactly as they were (NO CHANGE EVER DELETES AN ENTRY). The type (deposit / withdrawal) is not editable. Pure. */
export type TxEdit = Partial<Pick<FinTx, "amountCents" | "memo" | "atMs" | "motDays" | "field" | "recurrence" | "paidFrom" | "paysCard">>;
export function correctTx(rec: FinRecord, id: string, edit: TxEdit, at: number): FinRecord {
  const current = replay(rec).find((x) => x.id === id);
  if (!current) return rec;
  const n = rec.entries.filter((e) => e.tx.corrects === id).length + 1;
  const tx: FinTx = { ...current, ...edit, id: `c-${id}-${n}`, kind: current.kind, corrects: id };
  return append(rec, tx, at);
}
/** The corrections made to a transaction, oldest first (the record still holds every one). Pure. */
export const correctionsOf = (rec: FinRecord, id: string): FinEntry[] => rec.entries.filter((e) => e.tx.corrects === id);
/** True when every link holds — hashes recompute, prev pointers chain, revs run 1..n. */
export function verify(rec: FinRecord): { ok: boolean; brokenAt: number | null } {
  let prev = GENESIS;
  for (let i = 0; i < rec.entries.length; i++) {
    const e = rec.entries[i];
    if (e.rev !== i + 1 || e.prev !== prev || e.hash !== chainHash(prev, e.tx, e.rev, e.at)) return { ok: false, brokenAt: e.rev };
    prev = e.hash;
  }
  return { ok: true, brokenAt: null };
}
export const emptyRecord = (owner: string): FinRecord => ({ owner, entries: [] });

// ── the device half ───────────────────────────────────────────────────────────────────────────────────────────
/** Read a person's record from this device; an unreadable or tampered store reads as empty AND says so. */
export function loadRecord(owner: string): { rec: FinRecord; tampered: boolean } {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY(owner)) : null;
    if (!raw) return { rec: emptyRecord(owner), tampered: false };
    const v = JSON.parse(raw) as FinRecord;
    if (!v || v.owner !== owner || !Array.isArray(v.entries)) return { rec: emptyRecord(owner), tampered: true };
    const ok = verify(v).ok;
    return { rec: ok ? v : emptyRecord(owner), tampered: !ok };
  } catch { return { rec: emptyRecord(owner), tampered: true }; }
}
/** NO CHANGE EVER DELETES AN ENTRY (r.053, addendum 106: "Where are my inputted transactions; no changes should delete entries").
 *  A save that would not carry every stored entry forward, in order (a store that failed to verify and read as empty, a copy
 *  from another tab, anything), first keeps the stored copy whole under its own key — never overwritten, never removed. */
export const KEPT_PREFIX = "exel-fin-kept:";
export function carriesForward(stored: FinRecord | null, next: FinRecord): boolean {
  if (!stored || !Array.isArray(stored.entries)) return true;
  return stored.entries.every((e, i) => next.entries[i] !== undefined && next.entries[i].hash === e.hash);
}
/** Every copy kept for a person, newest first — nothing in them is ever deleted by the app. */
export function keptRecords(owner: string): { key: string; rec: FinRecord }[] {
  const out: { key: string; rec: FinRecord }[] = [];
  try {
    if (typeof localStorage === "undefined") return out;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k || !k.startsWith(`${KEPT_PREFIX}${owner}:`)) continue;
      const v = JSON.parse(localStorage.getItem(k) ?? "null") as FinRecord; if (v && Array.isArray(v.entries)) out.push({ key: k, rec: v });
    }
  } catch { /* unreadable: nothing listed, nothing touched */ }
  return out.sort((a, b) => (a.key < b.key ? 1 : -1));
}
/** Write the record to this device. Returns false when the device would not take it — the caller SAYS SO. */
export function saveRecord(rec: FinRecord, nowMs = Date.now()): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const raw = localStorage.getItem(KEY(rec.owner));
    let stored: FinRecord | null = null; try { stored = raw ? (JSON.parse(raw) as FinRecord) : null; } catch { stored = null; }
    if (raw && !carriesForward(stored, rec)) localStorage.setItem(`${KEPT_PREFIX}${rec.owner}:${nowMs}`, raw);   // kept whole, before anything is written
    localStorage.setItem(KEY(rec.owner), JSON.stringify(rec)); return true;
  } catch { return false; }
}
