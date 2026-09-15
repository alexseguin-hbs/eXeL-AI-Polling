// SI — SHARED INTENT, as a key-group consensus engine. PLACEHOLDER (operator 2026-09-15).
//
// The ask, in the operator's words: "a placeholder for SI (key group consensus engine using eXeL Polling to
// prioritize real-time critical decisions in real-time), starting with gaming. SI will be on or off and
// QR / link sent to key members only for volunteer with rewards of input of SI TOKENS."
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SI PRIORITISES. A NAMED PERSON STILL DECIDES.
//
// The round already contains exactly one decision that is critical and on a clock: a machine that is
// aiming must ask a named person before any shot, and nothing fires while that question is open. SI does
// not invent a decision to vote on — it takes that one, and puts it to the key group in the seconds it is
// open. What comes back is a reading of the group's intent, not an instruction.
//
// The human-authority gate in ai-crew.ts is NOT touched by anything in this file. There is no function
// here that can approve a shot, and `mayFire` never consults this module. A consensus engine that could
// out-vote a person would be the exact inversion of the doctrine this domain was built to hold.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// WHAT "PLACEHOLDER" MEANS, precisely. Everything below is real, local and deterministic: the switch, the
// closed roster, the invitation and its code, the clock on a call, the tally, the quorum rule, and the
// record of what each contribution earned. What is NOT here is the wire: no session is created on the
// polling engine, no invitation is delivered to anybody, and no token is minted. Each of those three seams
// is named in SI_SEAMS below, pointing at the function in this repository that will carry it, so the next
// edition extends rather than rebuilds.
//
// Pure: no clock, no DOM, no Math.random. Every function takes its time as an argument.
import { randomPodCode } from "@/lib/pod-roster";
import { heartsForRung, type Rung } from "@/lib/pod-clock";

/** ♡ — Shared Intent, the SoI Trinity token this engine rewards. */
export const SI_GLYPH = "♡";

export interface SiMember {
  id: string;
  name: string;
  /** What this person is in the room for. Shown beside their vote so a tally is readable, not anonymous. */
  role: string;
  /** Key members only: a person who was never invited cannot appear here. */
  invitedAtMs: number;
}

export interface SiInvite {
  /** Eight characters, from a declared alphabet with no look-alikes. A guessed code is not an invitation. */
  code: string;
  /** Where the invitation points. Built from the host at call time, never hardcoded. */
  url: string;
  issuedAtMs: number;
  expiresAtMs: number;
  /** WHO it was issued to. An invitation with no named recipients is a public link, which this is not. */
  to: string[];
}

export type SiChoice = "hold" | "approve" | "abstain";
export const SI_CHOICES: SiChoice[] = ["approve", "hold", "abstain"];

export interface SiVote { memberId: string; choice: SiChoice; atMs: number }

export interface SiCall {
  id: string;
  /** The decision in plain words — the same sentence the person deciding is reading. */
  question: string;
  openedAtMs: number;
  /** A real-time call has an end. After it, late input is recorded but does not change the tally. */
  closesAtMs: number;
  votes: SiVote[];
}

export interface SiAward {
  memberId: string;
  callId: string;
  /** Which rung of the EXISTING ♡ ladder (lib/pod-clock.ts). Never a number this file made up. */
  rung: Rung;
  si: number;
  why: string;
  atMs: number;
}

export interface SiState {
  /** The operator's switch. OFF is the normal state and the round behaves exactly as it did before. */
  on: boolean;
  roster: SiMember[];
  invite: SiInvite | null;
  calls: SiCall[];
  ledger: SiAward[];
}

export const initSi = (): SiState => ({ on: false, roster: [], invite: null, calls: [], ledger: [] });

// ── THE SWITCH ──────────────────────────────────────────────────────────────────────────────────────
/** Turning SI off closes any open call rather than leaving the group waiting on a question nobody reads. */
export function setSiOn(s: SiState, on: boolean, atMs: number): SiState {
  if (on === s.on) return s;
  if (on) return { ...s, on: true };
  return { ...s, on: false, calls: s.calls.map((c) => (c.closesAtMs > atMs ? { ...c, closesAtMs: atMs } : c)) };
}

// ── THE KEY GROUP ───────────────────────────────────────────────────────────────────────────────────
/** A closed roster. Adding somebody is a deliberate act with a name and a role attached. */
export function invite(s: SiState, m: Omit<SiMember, "invitedAtMs">, atMs: number): SiState {
  if (!m.id.trim() || !m.name.trim()) return s;
  if (s.roster.some((x) => x.id === m.id)) return s;
  return { ...s, roster: [...s.roster, { ...m, invitedAtMs: atMs }] };
}
export const uninvite = (s: SiState, id: string): SiState =>
  ({ ...s, roster: s.roster.filter((m) => m.id !== id) });
export const isKeyMember = (s: SiState, id: string): boolean => s.roster.some((m) => m.id === id);

// ── THE INVITATION ──────────────────────────────────────────────────────────────────────────────────
export const INVITE_LENGTH = 6;
export const INVITE_TTL_MS = 30 * 60 * 1000;

/**
 * THE CODE COMES FROM THE POD'S OWN GENERATOR, not a fourth one. `randomPodCode` already owns the
 * no-look-alike alphabet this repository uses, and it takes its bytes as an argument — so the same function
 * serves real randomness in a live pod and a SEEDED stream here, where a replayed round must reissue the
 * same code or it is not a replay.
 */
export function inviteCode(seed: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const bytes = new Uint8Array(INVITE_LENGTH);
  for (let i = 0; i < INVITE_LENGTH; i++) {
    h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; h ^= h >>> 16;
    bytes[i] = h & 0xff;
  }
  return randomPodCode(bytes);
}

/** Issue an invitation to the people on the roster. An empty roster gets no invitation, not an open link. */
export function issueInvite(s: SiState, origin: string, seed: string, atMs: number): SiState {
  if (!s.roster.length) return s;
  const code = inviteCode(`${seed}:${atMs}:${s.roster.length}`);
  return {
    ...s,
    invite: {
      code,
      url: `${origin.replace(/\/$/, "")}/main/Drone-2525/?si=${code}`,
      issuedAtMs: atMs,
      expiresAtMs: atMs + INVITE_TTL_MS,
      to: s.roster.map((m) => m.id),
    },
  };
}
export const inviteLive = (s: SiState, atMs: number): boolean =>
  Boolean(s.invite && s.invite.expiresAtMs > atMs);

/** Does this code, presented by this person, open the door? Both halves must hold. */
export function admits(s: SiState, code: string, memberId: string, atMs: number): { ok: boolean; why: string } {
  if (!s.on) return { ok: false, why: "shared intent is switched off" };
  if (!s.invite) return { ok: false, why: "no invitation has been issued" };
  if (s.invite.expiresAtMs <= atMs) return { ok: false, why: "the invitation has expired" };
  if (s.invite.code !== code.trim().toUpperCase()) return { ok: false, why: "that code does not match" };
  if (!isKeyMember(s, memberId)) return { ok: false, why: "this is a key-group call and you are not on the roster" };
  return { ok: true, why: "on the roster, with a live invitation" };
}

// ── THE CALL ────────────────────────────────────────────────────────────────────────────────────────
export const CALL_WINDOW_MS = 12_000;

/** Open a call on a decision that is already happening. Refused when SI is off — no silent background poll. */
export function openCall(s: SiState, id: string, question: string, atMs: number, windowMs = CALL_WINDOW_MS): SiState {
  if (!s.on) return s;
  if (s.calls.some((c) => c.id === id)) return s;
  return { ...s, calls: [...s.calls, { id, question, openedAtMs: atMs, closesAtMs: atMs + windowMs, votes: [] }] };
}
export const openCallOf = (s: SiState, atMs: number): SiCall | null =>
  s.calls.find((c) => c.closesAtMs > atMs) ?? null;
export const closeCall = (s: SiState, id: string, atMs: number): SiState =>
  ({ ...s, calls: s.calls.map((c) => (c.id === id ? { ...c, closesAtMs: Math.min(c.closesAtMs, atMs) } : c)) });

/**
 * A volunteer input. Volunteer means three things and this enforces all of them: only a key member may
 * vote, nobody is obliged to, and a member may change their mind while the call is open.
 */
export function castVote(s: SiState, callId: string, memberId: string, choice: SiChoice, atMs: number): SiState {
  if (!s.on || !isKeyMember(s, memberId)) return s;
  const call = s.calls.find((c) => c.id === callId);
  if (!call || call.closesAtMs <= atMs) return s;
  const already = call.votes.some((v) => v.memberId === memberId);
  const votes = already
    ? call.votes.map((v) => (v.memberId === memberId ? { ...v, choice, atMs } : v))
    : [...call.votes, { memberId, choice, atMs }];
  const calls = s.calls.map((c) => (c.id === callId ? { ...c, votes } : c));
  // A person is rewarded for taking part, once per call, however they later change their mind.
  const ledger = already ? s.ledger : [...s.ledger, award(memberId, call, "noted", "gave a volunteer input while the call was open", atMs)];
  return { ...s, calls, ledger };
}

// ── THE TALLY ───────────────────────────────────────────────────────────────────────────────────────
/** Silence is not a vote. Quorum is counted against the roster, and an abstention is a spoken abstention. */
export const QUORUM_FRACTION = 0.5;

export interface SiTally {
  approve: number; hold: number; abstain: number;
  heard: number; roster: number; silent: number;
  quorum: boolean;
  /** What the group leans toward, or null when nothing leads. Advice, never an instruction. */
  lean: "approve" | "hold" | null;
  secondsLeft: number;
  line: string;
}

export function tally(s: SiState, call: SiCall, atMs: number): SiTally {
  const count = (c: SiChoice) => call.votes.filter((v) => v.choice === c).length;
  const approve = count("approve"), hold = count("hold"), abstain = count("abstain");
  const heard = call.votes.length, roster = s.roster.length;
  const quorum = roster > 0 && heard / roster > QUORUM_FRACTION;
  const lean = approve === hold ? null : approve > hold ? "approve" : "hold";
  const secondsLeft = Math.max(0, Math.ceil((call.closesAtMs - atMs) / 1000));
  const line = roster === 0
    ? "nobody is on the roster yet"
    : !quorum
      ? `${heard} of ${roster} have answered — not enough to read the group yet`
      : lean === null
        ? `${heard} of ${roster} answered, evenly split`
        : `${heard} of ${roster} answered — ${lean === "hold" ? hold : approve} say ${lean}`;
  return { approve, hold, abstain, heard, roster, silent: Math.max(0, roster - heard), quorum, lean, secondsLeft, line };
}

// ── THE REWARD ──────────────────────────────────────────────────────────────────────────────────────
//
// THE ♡ LADDER ALREADY EXISTS AND THIS FILE DOES NOT GET TO EXTEND IT. lib/pod-clock.ts declares it as
// "a capped ladder, three rungs, fixed values: Noted (1), Adopted (3), Foundational (7) — nothing in
// between, and nothing above", and says ♡ "cannot be saved up, spent, traded or leveraged". The first draft
// of this module invented "1 plus a 2-point early bonus", which is a fourth value on a ladder whose whole
// point is that there is no fourth value. It is gone.
//
// How the three rungs read here:
//   noted         a volunteer input was given while the call was open. Awarded at once.
//   adopted       the person who decided went the way this contributor argued. Awarded AFTER the decision,
//                 which is what pod-clock means by "judged after the fact".
//   foundational  reserved. Seven ♡ is a human judgement about a contribution that changed the shape of
//                 things, and no rule in this file is allowed to hand it out automatically.
function award(memberId: string, call: SiCall, rung: Rung, why: string, atMs: number): SiAward {
  return { memberId, callId: call.id, rung, si: heartsForRung(rung), why, atMs };
}

/**
 * The second half of the ladder: once the named person has decided, everyone who argued that way moves
 * from noted to adopted. Called with the decision, not guessed from the tally.
 */
export function recogniseAdopted(s: SiState, callId: string, decision: SiChoice, atMs: number): SiState {
  const call = s.calls.find((c) => c.id === callId);
  if (!call || decision === "abstain") return s;
  const withThem = call.votes.filter((v) => v.choice === decision).map((v) => v.memberId);
  const already = new Set(s.ledger.filter((a) => a.callId === callId && a.rung === "adopted").map((a) => a.memberId));
  const add = withThem
    .filter((id) => !already.has(id))
    .map((id) => award(id, call, "adopted", `the decision went the way they argued`, atMs));
  return add.length ? { ...s, ledger: [...s.ledger, ...add] } : s;
}

/**
 * What one person has been RECOGNISED with, in ♡. Recognised, not owed and not held: pod-clock is explicit
 * that ♡ "cannot be saved up, spent, traded or leveraged", so this is a record of what was valued, never a
 * balance anybody can draw on.
 */
export const owed = (s: SiState, memberId: string): number =>
  s.ledger.filter((a) => a.memberId === memberId).reduce((n, a) => n + a.si, 0);
export const owedTotal = (s: SiState): number => s.ledger.reduce((n, a) => n + a.si, 0);
export const ledgerLines = (s: SiState): string[] =>
  s.ledger.map((a) => {
    const who = s.roster.find((m) => m.id === a.memberId)?.name ?? a.memberId;
    return `${(a.atMs / 1000).toFixed(1)}s  ${who}  ${a.rung}  +${a.si} ${SI_GLYPH}  ${a.why}`;
  });

// ── THE SEAMS ───────────────────────────────────────────────────────────────────────────────────────
/**
 * The three things this placeholder does NOT do, each named with the function in this repository that
 * will do it. Written down so the next edition extends the engine rather than growing a second one
 * beside it — which is the failure this codebase keeps paying for.
 */
export const SI_SEAMS = [
  {
    missing: "No polling session is created.",
    seam: "lib/api.ts api.post('/sessions') — Cube 1, the same call the moderator dashboard already makes.",
    then: "A call becomes a real session with a short code, and the roster joins it.",
  },
  {
    missing: "No invitation is delivered to anybody.",
    seam: "The code and link are generated here; delivery is the operator's channel, and the QR is already rendered.",
    then: "A key member scans, lands on the round, and is admitted by admits().",
  },
  {
    missing: "No ♡ reaches a ledger anywhere. Recognition is recorded here and nowhere else.",
    seam: "Cube 8, the append-only token ledger — backend app/cubes/cube8_tokens — using the rungs from lib/pod-clock.ts.",
    then: "A recognition here becomes an entry there, once, with this call id as its reference.",
  },
] as const;
