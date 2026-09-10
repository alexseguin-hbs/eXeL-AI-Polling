/**
 * The pod's durable record — Vision 2525 rcore.ledger, and the standing law "a new edition is an APPEND, never an EDIT".
 *
 * Until now a pod existed only in the memory of the phones holding it: reload the last one and the code, the hours, the
 * witnesses and the receipt were gone. `035_orphan_tables_pod.sql` says why that is not acceptable — "the clock is an event,
 * not a claim … must be true beyond a phone's memory."
 *
 * This is the device half, built the way the ledger is built rather than as a mutable blob:
 *   render(v) = take the newest entry e where e.rev <= v
 * so reopening a pod REPLAYS it. Nothing is overwritten; a later state is appended beside the earlier one, and an earlier
 * revision still reads back exactly as it did. A shared half over Supabase can append to the same shape later without
 * changing this contract.
 *
 * INVARIANT: time already recorded is never lost or altered, and the pod always reopens to exactly what happened.
 */
export interface PodEntry<S = unknown> { rev: number; at: number; state: S }
const KEY = (code: string) => `exel-pod:${code.toUpperCase()}`;
const PREFIX = "exel-pod:";
/** Keep a pod's history bounded without ever dropping its newest truth: the OLDEST revisions go first. */
const MAX_ENTRIES = 60;

const read = (code: string): PodEntry[] => {
  try { const raw = localStorage.getItem(KEY(code)); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v : []; } catch { return []; }
};

/** Evict the OLDEST pod, never the one being written — the same rule the sign store uses when a device fills up. */
function evictOldestPod(keep: string): boolean {
  try {
    let oldestKey = "", oldestAt = Infinity;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX) || k === KEY(keep)) continue;
      let at = 0;
      try { const l = (JSON.parse(localStorage.getItem(k) ?? "[]") as PodEntry[]).slice(-1)[0]; at = l?.at ?? 0; } catch { at = 0; }
      if (at < oldestAt) { oldestAt = at; oldestKey = k; }
    }
    if (!oldestKey) return false;
    localStorage.removeItem(oldestKey); return true;
  } catch { return false; }
}

/**
 * Append one revision. Returns false when the device would not take it — the caller carries on from memory and SAYS SO,
 * because a pod that silently failed to save is the failure this module exists to prevent.
 */
export function appendPod<S>(code: string, rev: number, state: S, now: number): boolean {
  if (!code) return false;
  const log = read(code);
  if (log.some((e) => e.rev === rev)) return true;                 // already recorded: an append is idempotent
  const next = [...log, { rev, at: now, state }].sort((a, b) => a.rev - b.rev).slice(-MAX_ENTRIES);
  const payload = JSON.stringify(next);
  for (let i = 0; i < 8; i++) {
    try { localStorage.setItem(KEY(code), payload); return true; } catch { if (!evictOldestPod(code)) return false; }
  }
  return false;
}

/** The ledger's own render rule: the newest entry at or below `rev`. Omit `rev` for the latest. */
export function replayPod<S>(code: string, rev?: number): PodEntry<S> | null {
  const log = read(code) as PodEntry<S>[];
  const upto = rev === undefined ? log : log.filter((e) => e.rev <= rev);
  return upto.length ? upto[upto.length - 1] : null;
}

/** Every revision this device holds for a pod, oldest first — the history a reader can walk. */
export const podHistory = <S,>(code: string): PodEntry<S>[] => read(code) as PodEntry<S>[];

/** Pods this device can reopen, most recent first, so "come back to the same" is a list rather than a memory. */
export function recentPods(limit = 8): { code: string; at: number; rev: number }[] {
  const out: { code: string; at: number; rev: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      const last = (JSON.parse(localStorage.getItem(k) ?? "[]") as PodEntry[]).slice(-1)[0];
      if (last) out.push({ code: k.slice(PREFIX.length), at: last.at, rev: last.rev });
    }
  } catch { /* unreadable storage: nothing to offer, and the pod still runs */ }
  return out.sort((a, b) => b.at - a.at).slice(0, limit);
}

/** Forget one pod on this device. The only removal there is, and it is the reader's own choice — never automatic. */
export const forgetPod = (code: string): void => { try { localStorage.removeItem(KEY(code)); } catch { /* nothing to do */ } };
