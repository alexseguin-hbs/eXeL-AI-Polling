// THE DECISION RECORD, THE CANONICAL EVENT, AND THE REPLAY HASH — R-CORE's RECORD step, as data.
//
// Operator 2026-09-16, PROMPT_ECO2525_r042.md item 4: "Every shot writes a decision record: designated,
// hiApproved, authorityLevel, actor, decisionId." Item 5: "Feed lines: time | actor | verb | id | result."
// CLAUDE_CODE_NOTES_r042_r047.md, r.043: the replay hash is "FNV of seq|challenge|diff|role|verb|id|
// designated|hiApproved|authorityLevel|result|blu|red. Do NOT hash wall-clock, ISO, FPS, or SID."
//
// This is a port of his decide() / ev() / replayHash() / metricsOf() from r.050, with the three defects
// found while reading that file deliberately not carried over:
//
//   1. r.050's metricsOf() stamps rev:'0.044' in a file that declares revision 0.050. Here the revision is
//      an ARGUMENT to the ledger, given once at creation, so a record cannot mislabel itself.
//   2. r.050's replayScrub() reads fields (k, x) the canonical row no longer has. Here there is one row
//      shape and one accessor for the feed line, so a reader cannot drift from the writer.
//   3. r.050's feed() routes free-form text through ev('FEED'), so arbitrary strings enter the hashed
//      stream. Here free-form text is NOT an event: `note()` keeps it beside the stream, out of the hash.
//
// Pure: no clock, no DOM, no Math.random. Times are passed in as game seconds, and the hash is computed
// over a projection that excludes every source of run-to-run difference the notes name.

export type DecisionKind = "DESIGNATE" | "APPROVE" | "HOLD" | "REJECT" | "SIM-ACTION" | "CAPTURE" | "REQ" | "GRANT" | "REL";

export interface DecisionRecord {
  decisionId: string;               // DEC-0001, DEC-0002 … — sequence, not time
  t: number;                        // game seconds, two places
  kind: DecisionKind;
  id: string;                       // the target or unit the decision is about
  actor: string;                    // WHO. A name. Never blank — the constructor refuses.
  designated: boolean;
  hiApproved: boolean;
  authorityLevel: number;
  challenge: number;
  diff: number;
  rev: string;
  /** Anything extra the caller wants on the record: reason, by, from, pts. Kept, and hashed if present. */
  extra: Readonly<Record<string, string | number | boolean>>;
}

/** The canonical event row — r.043's schema. The feed line is a VIEW of this, never a second write. */
export interface EventRow {
  seq: number;
  t: number;
  challenge: number;
  diff: number;
  role: string;
  verb: string;
  id: string;
  designated: boolean;
  hiApproved: boolean;
  authorityLevel: number;
  result: string;
  blu: number;
  red: number;
}

export interface Ledger {
  rev: string;
  decisions: DecisionRecord[];
  events: EventRow[];
  /** Free-form lines a person reads. Beside the stream, NOT in it, and never hashed. */
  notes: string[];
}

export const initLedger = (rev: string): Ledger => ({ rev, decisions: [], events: [], notes: [] });

/** The state a record is stamped with. The caller owns these; the ledger does not reach into a store. */
export interface Stamp {
  t: number;
  actor: string;
  designated: boolean;
  hiApproved: boolean;
  authorityLevel: number;
  challenge: number;
  diff: number;
  blu: number;
  red: number;
}

// ── DECIDE ───────────────────────────────────────────────────────────────────────────────────────

/**
 * Append a decision. Refuses an unnamed actor by returning the ledger unchanged — a decision without a
 * name is not a decision, and this is the same rule ai-crew.ts's resolveRequest applies. The id is the
 * SEQUENCE, so a replayed run produces identical ids; a clock-based id would not.
 */
export function decide(
  L: Ledger, kind: DecisionKind, id: string, s: Stamp,
  extra: Record<string, string | number | boolean> = {},
): { ledger: Ledger; record: DecisionRecord | null } {
  if (!s.actor?.trim()) return { ledger: L, record: null };
  const record: DecisionRecord = {
    decisionId: `DEC-${String(L.decisions.length + 1).padStart(4, "0")}`,
    t: round2(s.t), kind, id: id || "NONE", actor: s.actor.trim(),
    designated: s.designated, hiApproved: s.hiApproved, authorityLevel: s.authorityLevel,
    challenge: s.challenge, diff: s.diff, rev: L.rev, extra: { ...extra },
  };
  return { ledger: { ...L, decisions: [...L.decisions, record] }, record };
}

// ── EVENT ────────────────────────────────────────────────────────────────────────────────────────

/** Append a canonical event row. `role` is the actor's ROLE (HI, AI, NET, SCORE), not their name. */
export function ev(L: Ledger, verb: string, id: string, result: string, s: Stamp, role = "HI"): { ledger: Ledger; row: EventRow } {
  const row: EventRow = {
    seq: L.events.length + 1, t: round2(s.t), challenge: s.challenge, diff: s.diff, role, verb, id: id || "",
    designated: s.designated, hiApproved: s.hiApproved, authorityLevel: s.authorityLevel,
    result: result || "", blu: s.blu | 0, red: s.red | 0,
  };
  return { ledger: { ...L, events: [...L.events, row] }, row };
}

/** A free-form line for a person. Beside the stream, never in it, never hashed. This is the fix for r.050's feed(). */
export const note = (L: Ledger, text: string): Ledger => ({ ...L, notes: [...L.notes, text] });

/** `time | actor | verb | id | result` — item 5, verbatim. One accessor, so a scrubber cannot read stale fields. */
export const feedLine = (r: EventRow): string => [r.t, r.role, r.verb, r.id, r.result].join(" | ");

// ── THE HASH ─────────────────────────────────────────────────────────────────────────────────────

/**
 * FNV-1a 64 over the canonical projection — r.043's field list, in r.043's order, and nothing else. No
 * wall-clock, no ISO string, no FPS, no session id: two runs of the same seed and the same choices hash
 * identically, and two runs that diverged hash differently at the first row that differs. The same
 * algorithm the parity harness uses, so a hash from the app and a hash from the harness are comparable.
 */
export function replayHash(L: Ledger): string {
  const lines = L.events.map((e) => [
    e.seq, e.challenge, e.diff, e.role, e.verb, e.id, e.designated ? 1 : 0, e.hiApproved ? 1 : 0,
    e.authorityLevel, e.result, e.blu, e.red,
  ].join("|"));
  return fnv1a64(lines.join("\n"));
}

/** The projection itself, so a comparison can say WHICH row diverged rather than only that one did. */
export const projection = (L: Ledger): string[] =>
  L.events.map((e) => [e.seq, e.challenge, e.diff, e.role, e.verb, e.id, e.designated ? 1 : 0, e.hiApproved ? 1 : 0, e.authorityLevel, e.result, e.blu, e.red].join("|"));

/** First row at which two ledgers disagree, or -1 if they replay identically. */
export function firstDivergence(a: Ledger, b: Ledger): number {
  const pa = projection(a), pb = projection(b);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) if (pa[i] !== pb[i]) return i;
  return -1;
}

export function fnv1a64(str: string): string {
  // Constructor form rather than BigInt literals: the project's tsconfig targets below ES2020, and the
  // literal syntax is refused there while the runtime BigInt is fine. Same algorithm, same constants, so a
  // hash from here and a hash from the parity harness are comparable.
  const PRIME = BigInt("0x100000001b3"), MASK = BigInt("0xffffffffffffffff");
  let h = BigInt("0xcbf29ce484222325");
  const bytes = new TextEncoder().encode(str);
  for (let i = 0; i < bytes.length; i++) { h ^= BigInt(bytes[i]); h = (h * PRIME) & MASK; }
  return h.toString(16).padStart(16, "0");
}

// ── THE METRICS HE ASKED TO COMPARE ON ───────────────────────────────────────────────────────────
// "Compare next sims on designation rate, HI holds, auth failures, handoffs, FPS, replay hash — not winners
// only." FPS is a telemetry distribution and is NOT here on purpose: it is compared beside the hash, never
// inside it, exactly as r.043 says.

export interface Metrics {
  n: number;
  designations: number;
  designationRate: number;
  hiHolds: number;
  authFailures: number;
  handoffs: number;
  approvals: number;
  /** Of the approvals, how many were a second PERSON rather than the same one as HI-2. */
  twoPersonApprovals: number;
  replayHash: string;
  rev: string;
  blu: number;
  red: number;
}

export function metricsOf(L: Ledger): Metrics {
  const E = L.events, D = L.decisions;
  const designations = E.filter((e) => e.verb === "DESIGNATE").length;
  const hiHolds = D.filter((d) => d.kind === "HOLD").length;
  const authFailures = D.filter((d) => d.kind === "REJECT").length;
  const handoffs = D.filter((d) => d.kind === "REQ" || d.kind === "GRANT" || d.kind === "REL").length;
  const approvals = D.filter((d) => d.kind === "APPROVE");
  const twoPerson = approvals.filter((d) => d.extra.by !== undefined && d.extra.from !== undefined && d.extra.by !== d.extra.from).length;
  const last = E[E.length - 1];
  return {
    n: E.length, designations,
    designationRate: E.length ? round4(designations / E.length) : 0,
    hiHolds, authFailures, handoffs,
    approvals: approvals.length, twoPersonApprovals: twoPerson,
    replayHash: replayHash(L), rev: L.rev,          // the ledger's revision — never a literal
    blu: last?.blu ?? 0, red: last?.red ?? 0,
  };
}

/** What SAVE writes beside the immutable fixture. The fixture is never touched; this carries the new axes. */
export interface Sidecar {
  format: "EXEL-2525-SIDECAR-1";
  rev: string;
  seed: number;
  metrics: Metrics;
  decisions: DecisionRecord[];
  events: EventRow[];
  notes: string[];
}
export const sidecarOf = (L: Ledger, seed: number): Sidecar => ({
  format: "EXEL-2525-SIDECAR-1", rev: L.rev, seed, metrics: metricsOf(L),
  decisions: L.decisions, events: L.events, notes: L.notes,
});

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;
