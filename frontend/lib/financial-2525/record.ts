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

/** Key-sorted JSON, so the same transaction always hashes the same — and, r.073 second pre-push review (Krishna), so two copies of the same
 *  budget or cards compare equal whatever order the account store hands their keys back in (it keeps jsonb: shortest key first). */
export const stableJson = (v: unknown): string =>
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
  // r.073 (round 1): the latest correction is the one RECORDED last (its entry's `at`), position breaking a tie — on one device the
  // two always agree; after two copies are united (unionRecords) the newest edit still wins, whichever copy it came from
  const latest = new Map<string, FinEntry>();
  for (const e of upTo) if (e.tx.corrects) { const p = latest.get(e.tx.corrects); if (!p || e.at >= p.at) latest.set(e.tx.corrects, e); }
  // r.073 (addendum 164 "all fields in edit of Transaction record should be possible to edit"): the type is one of them — the correction's
  // kind wins (every earlier correction carries the original's kind, so a record written before reads exactly as it did)
  return upTo.filter((e) => !e.tx.corrects).map((e) => { const c = latest.get(e.tx.id)?.tx; return c ? { ...c, id: e.tx.id, kind: c.kind ?? e.tx.kind, corrects: undefined } : e.tx; });
}
/** THE EDIT (r.062, addendum 133): what changed is appended as a correction — the original entry, its hash and every later link stay
 *  exactly as they were (NO CHANGE EVER DELETES AN ENTRY). r.073 (addendum 164): every field is editable, the type (deposit /
 *  withdrawal) included — supersedes FD-78's "the type cannot change". Pure. */
export type TxEdit = Partial<Pick<FinTx, "kind" | "amountCents" | "memo" | "atMs" | "motDays" | "field" | "recurrence" | "paidFrom" | "paysCard">>;
export function correctTx(rec: FinRecord, id: string, edit: TxEdit, at: number): FinRecord {
  const current = replay(rec).find((x) => x.id === id);
  if (!current) return rec;
  const tx: FinTx = { ...current, ...edit, id: nextCorrectionId(rec, id), kind: edit.kind ?? current.kind, corrects: id };
  return append(rec, tx, nextAt(rec, at));
}
/** The time a NEW entry or correction is recorded at: now, or just after the record's latest entry when the clock reads earlier (r.073
 *  pre-push review, Odin: a clock moved back, or a device that lags, must not make an edit made after seeing another one lose to it). */
export const nextAt = (rec: FinRecord, now: number): number => rec.entries.reduce((m, e) => Math.max(m, e.at + 1), now);
/** The next free correction id for `id` — `c-<id>-<n>`, n one past the corrections already made, skipping any n a united copy
 *  already holds (r.073: append is idempotent on the id, so a taken id would silently drop the edit). Pure. */
export function nextCorrectionId(rec: FinRecord, id: string): string {
  const ids = new Set(rec.entries.map((e) => e.tx.id));
  let n = rec.entries.filter((e) => e.tx.corrects === id).length + 1;
  while (ids.has(`c-${id}-${n}`)) n++;
  return `c-${id}-${n}`;
}
/** A transaction id no entry holds yet: `base` itself, or `base~2`, `base~3`, … (r.073: a new entry is never dropped as a duplicate). */
export function freshId(rec: FinRecord, base: string): string {
  const ids = new Set(rec.entries.map((e) => e.tx.id));
  if (!ids.has(base)) return base;
  let k = 2; while (ids.has(`${base}~${k}`)) k++;
  return `${base}~${k}`;
}
/** The identity a union matches a transaction by (its kind, amount and instant — r.073): what an entry keeps when a union renames it. Pure. */
export const txIdentity = (tx: FinTx): string => `${tx.kind}|${tx.amountCents}|${tx.atMs}`;
/** The id an entry is held under NOW (r.073 pre-push review, Enlil): `id` itself while its original still says `identity`, else the
 *  original a union renamed (`id~n`, same root, same identity), else null — a page that remembered an id never edits another entry. Pure. */
export function followId(rec: FinRecord, id: string, identity: string): string | null {
  const root = id.replace(/~\d+$/, "");
  const own = rec.entries.find((e) => e.tx.id === id && !e.tx.corrects);
  if (own && txIdentity(own.tx) === identity) return id;
  const moved = rec.entries.find((e) => !e.tx.corrects && e.tx.id.replace(/~\d+$/, "") === root && txIdentity(e.tx) === identity);
  return moved ? moved.tx.id : null;
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
/** A short fingerprint of any stored copy, readable or not (r.073: a copy kept aside is kept once). Pure. */
export function chainFingerprint(v: unknown): string {
  const s = JSON.stringify(v) ?? "";
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x9e3779b9;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0; h2 = Math.imul(h2 ^ c, 0x0100019b) >>> 0; }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}
/** True when the two copies are the same chain, link for link. Pure. */
export const sameChain = (a: FinRecord, b: FinRecord): boolean => a.entries.length === b.entries.length && a.entries.every((e, i) => b.entries[i].hash === e.hash);
/** A stored or received copy that can be trusted: the right shape, and every link holds. Pure. */
export const isVerified = (v: unknown): v is FinRecord => !!v && typeof v === "object" && Array.isArray((v as FinRecord).entries) && verify(v as FinRecord).ok;

/**
 * THE UNION (r.073, round 1 of 33 — the reviewer lenses found two tabs and two devices each burying the other's entries):
 * A FINISHED ENTRY IS NEVER LOST. Every transaction either copy holds is in the union: one copy keeps its chain exactly, and every
 * transaction of the other that it lacks is appended after it, in the other's order, with fresh links — so the result verifies and
 * nothing either copy recorded is missing from it.
 *  · Which copy keeps its place is decided by the two copies alone (the one whose first differing entry was recorded first; a tie,
 *    the smaller hash), so every tab and device that unites the same two copies writes the same chain.
 *  · A transaction already held is not appended again — so uniting the same copies twice changes nothing. An entry is held when one
 *    with its id (or the id an earlier union gave it) has the same kind, amount and instant; a correction when one of the same entry
 *    says the same thing. Two DIFFERENT transactions that share an id (two tabs that each made "c-<id>-2"; two entries with one id
 *    but different money or instants) are both kept: the appended one takes the next free id, and every correction of it follows.
 *  · A copy that fails its chain is never united (it is the caller's to keep whole).
 * Pure; returns `a` itself (same object) when `b` adds nothing. The result carries `a`'s owner.
 */
export function unionRecords(a: FinRecord, b: FinRecord | null): FinRecord {
  if (!b || !Array.isArray(b.entries) || b.entries.length === 0 || !isVerified(b)) return a;
  if (a.entries.length === 0) return { ...b, owner: a.owner };
  let i = 0; const n = Math.min(a.entries.length, b.entries.length);
  while (i < n && a.entries[i].hash === b.entries[i].hash) i++;
  let keep = a, add = b;
  if (i < n) { const x = a.entries[i], y = b.entries[i]; if (y.at < x.at || (y.at === x.at && y.hash < x.hash)) { keep = b; add = a; } }
  else if (b.entries.length > a.entries.length) { keep = b; add = a; }
  let out: FinRecord = keep.owner === a.owner ? keep : { ...keep, owner: a.owner };
  // a transaction's family: a correction belongs to the transaction it corrects; an entry to its id before any "~k" a union added.
  // What makes two entries ONE transaction: a correction — everything it says; an entry — its kind, amount and instant under the same
  // id (the id is built from the instant, the amount and the place in the record, so the same id with the same money at the same
  // instant is the same transaction recorded twice — a re-entry or "Put back my entries" — even when a memo or a length differs)
  const family = (tx: FinTx) => (tx.corrects ? `c:${tx.corrects}` : `t:${tx.id.replace(/~\d+$/, "")}`);
  // a correction is also WHEN it was made (its entry's `at`, which a union keeps): an edit back to an earlier value (A → B → A) is a new
  // correction, never mistaken for the first one (r.073 pre-push review, Krishna: the older edit won and the money changed)
  const said = (tx: FinTx, at: number) => `${family(tx)}|${tx.corrects ? `${at}|${stableJson({ ...tx, id: "" })}` : `${tx.kind}|${tx.amountCents}|${tx.atMs}`}`;
  const held = new Map<string, string>(out.entries.map((e) => [said(e.tx, e.at), e.tx.id] as const));
  const taken = new Set(out.entries.map((e) => e.tx.id));
  const renamed = new Map<string, string>();   // an appended transaction's id → the id it is held under
  for (const e of add.entries) {
    let tx = e.tx;
    if (tx.corrects && renamed.has(tx.corrects)) tx = { ...tx, corrects: renamed.get(tx.corrects) };
    const known = held.get(said(tx, e.at));
    if (known !== undefined) { if (known !== e.tx.id) renamed.set(e.tx.id, known); continue; }   // already held
    if (taken.has(tx.id)) {   // the id belongs to a different transaction: this one takes the next free id
      const id = tx.corrects ? nextCorrectionId(out, tx.corrects) : freshId(out, tx.id.replace(/~\d+$/, ""));
      renamed.set(e.tx.id, id); tx = { ...tx, id };
    }
    out = append(out, tx, e.at);
    held.set(said(tx, e.at), tx.id); taken.add(tx.id);
  }
  return out;
}

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
 *  r.073 (round 1): a save UNITES the record with the stored copy (unionRecords) — another tab's entries are carried forward, never
 *  set aside where no screen reads them. Only a stored copy that cannot be trusted (it fails its chain, or cannot be read) is kept
 *  whole under its own key before anything is written — never merged, never overwritten, never removed. */
export const KEPT_PREFIX = "exel-fin-kept:";
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
/** Write the record to this device, united with what the device already holds (r.073). Returns the record WRITTEN — the caller shows
 *  it — or null when the device would not take it; the caller SAYS SO and keeps the entry where the person can see it. */
export function saveRecord(rec: FinRecord, nowMs = Date.now()): FinRecord | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(KEY(rec.owner));
    let stored: unknown = null; try { stored = raw ? JSON.parse(raw) : null; } catch { stored = null; }
    let next = rec;
    if (raw) {
      if (isVerified(stored) && (stored as FinRecord).owner === rec.owner) next = unionRecords(rec, stored as FinRecord);
      else localStorage.setItem(`${KEPT_PREFIX}${rec.owner}:${nowMs}`, raw);   // cannot be trusted: kept whole, before anything is written
    }
    localStorage.setItem(KEY(rec.owner), JSON.stringify(next)); return next;
  } catch { return null; }
}
/** The person's record as stored on this device right now, when it can be trusted (another tab may have written it). */
export function readStored(owner: string): FinRecord | null {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY(owner)) : null;
    const v: unknown = raw ? JSON.parse(raw) : null;
    return isVerified(v) && (v as FinRecord).owner === owner ? (v as FinRecord) : null;
  } catch { return null; }
}
/** The device key of a person's record (the storage event names it when another tab writes). */
export const recordKey = KEY;
