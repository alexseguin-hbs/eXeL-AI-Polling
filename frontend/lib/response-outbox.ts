// THE DEVICE IS A SOURCE — a completed response is never discarded (operator 2026-10-14: "2525 redundancy",
// "if that means we need other non-Supabase source let me know").
//
// WHY THIS EXISTS. Trinity Redundancy (CLAUDE.md) claims 3 send paths x 4 receive channels. Measured 2026-10-14:
// the receive side is four channels on paper and THREE in code, and all three terminate at Supabase; Path C has
// no durable store because the KV binding is commented out (wrangler.jsonc:26). So a Supabase outage loses the
// response entirely — and the participant was told it was submitted, because every path was fire-and-forget
// (session-view.tsx: .catch(() => {}) x2 and .then(() => {}, () => {})).
//
// THE LAW THIS SERVES is already in this repo and already gated for a different artefact. The Sign Doc AAR
// (CLAUDE.md, FIX THE CLASS NEVER THE INSTANCE) states: "a completed signature is never discarded", enforced by
// tests/sign-invariant.test.mjs. The same class, unapplied until now:
//
//        A COMPLETED RESPONSE IS NEVER DISCARDED.
//
// Derived from Vision-2525's own sections rather than from infrastructure habit:
//   V  · EDGE-2525   "delay becomes danger"              -> the edge works when the centre is unreachable
//   IV · LINK-2525   "the mission carries its context"   -> a queued entry carries everything needed to resend
//   §5 · The Ledger  append-only, nothing edited after   -> every attempt is recorded, never swallowed
//   §7 · The Off Switch "turns against the framework,    -> when all paths fail the SYSTEM says so; the cost is
//        not against the people inside it"                  never silently moved onto the participant
//
// This module is deliberately dependency-free and synchronous so it can be unit-tested without a DOM.

/** One response that was composed but not provably delivered. Carries its full context (LINK-2525). */
export type OutboxEntry = {
  /** the response id the send paths used, so a later retry de-duplicates against seenIds */
  id: string;
  /** the session this belongs to */
  shortCode: string;
  /** the participant who wrote it */
  participantId: string;
  /** the words themselves — the thing that must never be lost */
  text: string;
  /** language, so a retry carries the same context the original did */
  languageCode: string;
  /** ISO timestamp of composition, NOT of delivery */
  submittedAt: string;
  /** how many delivery attempts have been made */
  tries: number;
  /** which paths were tried on the last attempt and what happened — the §5 ledger of this entry */
  lastResult?: string;
};

export const OUTBOX_KEY = "exel.response.outbox.v1";

/** A hard cap so a long outage cannot fill the device. Oldest entries are kept; newest are dropped loudly. */
export const OUTBOX_MAX = 200;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Resolve a storage. Returns null when storage is unreachable — a private window, blocked site data, SSR.
 * Every caller must behave correctly with null: an unavailable outbox is a smaller failure than a crash.
 */
function store(explicit?: Store | null): Store | null {
  if (explicit) return explicit;
  try {
    if (typeof localStorage === "undefined") return null;
    // probe: Safari private mode throws on setItem rather than on access
    const probe = "__exel_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

/** Read the queue. Never throws: a corrupt or unreadable outbox reads as empty rather than breaking the page. */
export function readOutbox(explicit?: Store | null): OutboxEntry[] {
  const s = store(explicit);
  if (!s) return [];
  try {
    const raw = s.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is OutboxEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as OutboxEntry).id === "string" &&
        typeof (e as OutboxEntry).text === "string" &&
        typeof (e as OutboxEntry).shortCode === "string",
    );
  } catch {
    return [];
  }
}

/** Write the queue. Returns false when it could not be persisted, so the caller can tell the truth. */
export function writeOutbox(entries: OutboxEntry[], explicit?: Store | null): boolean {
  const s = store(explicit);
  if (!s) return false;
  try {
    s.setItem(OUTBOX_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

/**
 * Queue a response that was NOT provably delivered.
 * Idempotent on id: re-queuing the same response updates it rather than duplicating it.
 * Returns false when the device could not hold it — which the caller must surface, never swallow.
 */
export function queueResponse(entry: Omit<OutboxEntry, "tries">, explicit?: Store | null): boolean {
  const current = readOutbox(explicit);
  const existing = current.findIndex((e) => e.id === entry.id);
  if (existing >= 0) {
    current[existing] = { ...current[existing], ...entry, tries: current[existing].tries };
  } else {
    if (current.length >= OUTBOX_MAX) return false; // full: say so, do not silently drop the oldest work
    current.push({ ...entry, tries: 0 });
  }
  return writeOutbox(current, explicit);
}

/** Remove an entry once a path has provably carried it. */
export function dropResponse(id: string, explicit?: Store | null): boolean {
  const current = readOutbox(explicit);
  const next = current.filter((e) => e.id !== id);
  if (next.length === current.length) return true; // already gone
  return writeOutbox(next, explicit);
}

/** Record an attempt against an entry without delivering it — the §5 ledger of this response. */
export function recordAttempt(id: string, result: string, explicit?: Store | null): boolean {
  const current = readOutbox(explicit);
  const i = current.findIndex((e) => e.id === id);
  if (i < 0) return true;
  current[i] = { ...current[i], tries: current[i].tries + 1, lastResult: result };
  return writeOutbox(current, explicit);
}

/** How many responses this device is still holding. 0 means nothing is owed. */
export function pendingCount(explicit?: Store | null): number {
  return readOutbox(explicit).length;
}

/** Only the entries for one session, oldest first — the order they were written is the order they are sent. */
export function pendingFor(shortCode: string, explicit?: Store | null): OutboxEntry[] {
  return readOutbox(explicit).filter((e) => e.shortCode === shortCode);
}

/**
 * Summarise the outcome of the three Trinity paths for one send, for the entry's ledger line and for the
 * participant-facing sentence. `results` is keyed by path letter.
 */
export function describeAttempt(results: Record<string, boolean>): string {
  const keys = Object.keys(results).sort();
  const ok = keys.filter((k) => results[k]);
  const bad = keys.filter((k) => !results[k]);
  if (bad.length === 0) return `delivered via ${ok.join("+")}`;
  if (ok.length === 0) return `no path reached the session (tried ${bad.join("+")})`;
  return `delivered via ${ok.join("+")}; ${bad.join("+")} failed`;
}

/** True when at least one path provably carried the response. The ONLY definition of delivered. */
export function anyDelivered(results: Record<string, boolean>): boolean {
  return Object.values(results).some(Boolean);
}
