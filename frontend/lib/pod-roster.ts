/**
 * POD ROSTER — the pure core of the ◬ ♡ 웃 Session's multi-phone state.
 * ======================================================================
 * Three phones share one roster over the poll's own Realtime channel. This module is
 * the whole protocol as PURE functions — no React, no Supabase, no clock — so the same
 * code the page runs can be driven by a simulation (tests/soi-pod-sim.test.mjs) with an
 * in-memory bus, and a recorded pod replays deterministically in Cube 10.
 *
 * Every message travels INSIDE a `{ pod: … }` envelope on the channel's `session_update`
 * event, never as the poll's bare `status` (Krishna, round 1: the pod and a live poll share
 * `session:<code>`, so a bare `status:"closed"` from a pod would close the poll).
 *
 *   hello   joiner → lead     "I'm here" (a per-phone id)
 *   claim   joiner → lead     "I already hold seat N" (after a lead reload)
 *   roster  lead → all        the full members list, who sits where, and the phase
 *   member  any → all         one seat's patch (name, approval, start, hours, witness)
 *   phase   seated → all      the pod moved (sync/active/record/audit/closed)
 *
 * Trust (Thor, round 1): a joiner pins the lead's id on the FIRST roster it accepts and
 * drops any later roster from anyone else; a `member` patch is accepted only from the
 * seat's owner — except an attestation bit, which belongs to the reviewer who flips it;
 * a `phase` is accepted only from a phone the roster knows. Continuity (Enki, round 1):
 * an incoming roster MERGES — an empty field never erases a filled one — so a lead who
 * reloads cannot wipe the trio's names, hours or start times; the joiners re-claim their
 * seats and the lead rebuilds.
 *
 * Doctrine: `unit.witness` (locked, v272) says a pod is "three OR MORE" — three is the
 * witness floor. `podSize` is a parameter so widening is a constant, not a rewrite.
 */

export type Phase = "compose" | "invite" | "sync" | "active" | "record" | "audit" | "closed";

export type Member = {
  role: string; name: string; contact: string; agreed: boolean; recommend: string; startedAt: number | null;
  hours: string;              // TOK-17 self-audit: hours this member claims
  did: string;                // TOK-17 self-audit: what they did (one line)
  witnessedBy: boolean[];     // TOK-17 cross-review: witnessedBy[j] = member j attests this claim
};

export const PHASE_ORDER: Record<Phase, number> =
  { compose: 0, invite: 1, sync: 2, active: 3, record: 4, audit: 5, closed: 6 };

export type PodMsg =
  | { kind: "hello";  from: string }
  | { kind: "claim";  from: string; seat: number; rev: number }
  | { kind: "roster"; from: string; rev: number; members: Member[]; seats: Record<string, number>; phase: Phase }
  | { kind: "member"; from: string; seat: number; patch: Partial<Member> }   // own seat only
  | { kind: "attest"; from: string; target: number; on: boolean }            // the reviewer's own bit only
  | { kind: "reset";  from: string }                                         // honoured from the pinned lead only
  | { kind: "phase";  from: string; phase: Phase };

export type PodState = {
  members: Member[];
  seats: Record<string, number>;   // clientId → seat (lead-owned; joiners see it in the roster)
  mySeat: number;                  // 0 = lead; a joiner is 0 until seated
  full: boolean;                   // this joiner asked for a seat and none was free
  lead: string | null;             // the lead's clientId — the lead's own, or pinned from the first roster
  phase: Phase;
  rev: number;                     // roster revision — the lead bumps it on every roster it publishes
};

export type PodCtx = {
  role: "lead" | "joiner";
  clientId: string;
  connected: boolean;              // false → every send is dropped (single-phone prototype)
  podSize: number;
};

export type Step = { state: PodState; send: PodMsg[] };

export const mkMember = (role: string, podSize: number): Member => ({
  role, name: "", contact: "", agreed: false, recommend: "", startedAt: null,
  hours: "", did: "", witnessedBy: Array.from({ length: podSize }, () => false),
});

export const initialMembers = (podSize: number): Member[] =>
  Array.from({ length: podSize }, (_, i) => mkMember(i === 0 ? "Lead" : `Lead ${i + 1}`, podSize));

export const initialPod = (podSize: number, ctx?: Pick<PodCtx, "role" | "clientId">): PodState => ({
  members: initialMembers(podSize), seats: {}, mySeat: 0, full: false,
  lead: ctx?.role === "lead" ? ctx.clientId : null, phase: "compose", rev: 0,
});

/** The patch that returns every seat to "not started, not audited" — the lead's Reset. */
export const RESET_PATCH = (podSize: number): Partial<Member> =>
  ({ agreed: false, recommend: "", startedAt: null, hours: "", did: "", witnessedBy: Array.from({ length: podSize }, () => false) });

/** A pod code from real randomness, never the clock (Thor). 6 chars, no look-alikes. */
export function randomPodCode(bytes: Uint8Array): string {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += A[bytes[i] % A.length];
  return out;
}

const withPatch = (members: Member[], seat: number, patch: Partial<Member>): Member[] =>
  members.map((m, j) => (j === seat ? { ...m, ...patch } : m));

const rosterOf = (s: PodState, from: string): PodMsg =>
  ({ kind: "roster", from, rev: s.rev, members: s.members, seats: s.seats, phase: s.phase });
/** The lead publishes: bump the revision, then the roster carries it. Every lead send path uses this. */
const publish = (s: PodState, ctx: PodCtx): Step => {
  if (!ctx.connected) return { state: s, send: [] };
  const n = { ...s, rev: s.rev + 1 };
  return { state: n, send: [rosterOf(n, ctx.clientId)] };
};

/** First open chair for a newcomer, or null when the pod is full. Seat 0 is the lead's. */
export function openSeat(state: PodState, podSize: number): number | null {
  const taken = new Set(Object.values(state.seats));
  for (let i = 1; i < podSize; i++) {
    if (!taken.has(i) && !state.members[i]?.name.trim()) return i;
  }
  return null;
}

/** Field-wise merge: an empty incoming value never erases a filled local one. */
export function mergeMember(local: Member, incoming: Member): Member {
  return {
    role: incoming.role || local.role,
    name: incoming.name || local.name,
    contact: incoming.contact || local.contact,
    agreed: incoming.agreed || local.agreed,
    recommend: incoming.recommend || local.recommend,
    startedAt: incoming.startedAt ?? local.startedAt,
    hours: incoming.hours || local.hours,
    did: incoming.did || local.did,
    witnessedBy: local.witnessedBy.map((w, j) => w || !!incoming.witnessedBy[j]),
  };
}
export const mergeRoster = (local: Member[], incoming: Member[]): Member[] =>
  local.map((m, i) => (incoming[i] ? mergeMember(m, incoming[i]) : m));

/** A `member` patch is legitimate only for the sender's own seat. Attestations travel as `attest`. */
export function patchAllowed(state: PodState, from: string, seat: number): boolean {
  const owner = from === state.lead ? 0 : state.seats[from];
  return owner != null && owner === seat;
}
const seatOf = (state: PodState, from: string): number | null =>
  from === state.lead ? 0 : (state.seats[from] ?? null);
const withBit = (members: Member[], target: number, j: number, on: boolean): Member[] =>
  withPatch(members, target, { witnessedBy: members[target].witnessedBy.map((w, k) => (k === j ? on : w)) });

const known = (state: PodState, from: string): boolean => from === state.lead || state.seats[from] != null;

/** A message arrived on this phone. Returns the next state and what to send back. */
export function reducePod(state: PodState, msg: PodMsg, ctx: PodCtx): Step {
  const me = ctx.clientId;
  if (msg.kind === "hello") {
    if (ctx.role !== "lead") return { state, send: [] };
    let seats = state.seats;
    if (seats[msg.from] == null) {
      const seat = openSeat(state, ctx.podSize);
      if (seat != null) seats = { ...seats, [msg.from]: seat };
    }
    // Always answer with the roster: a seated newcomer learns its chair; an unseated
    // one learns the pod is full (it finds no entry for itself in `seats`).
    return publish({ ...state, seats }, ctx);
  }
  if (msg.kind === "claim") {
    // After a lead reload: a joiner asserts the seat it already held and the revision it last
    // saw, so the reloaded lead's next roster is newer than everyone's memory. Honour the chair
    // when it is free or already theirs; otherwise the joiner re-hellos and is re-seated.
    if (ctx.role !== "lead") return { state, send: [] };
    const rev = Math.max(state.rev, msg.rev);
    const holder = Object.entries(state.seats).find(([, s]) => s === msg.seat)?.[0];
    if (holder && holder !== msg.from) return publish({ ...state, rev }, ctx);
    return publish({ ...state, rev, seats: { ...state.seats, [msg.from]: msg.seat } }, ctx);
  }
  if (msg.kind === "roster") {
    if (ctx.role !== "joiner") return { state, send: [] };
    if (state.lead && msg.from !== state.lead) return { state, send: [] };   // impostor — pinned lead only
    const lead = state.lead ?? msg.from;                                     // trust on first roster
    const mine = msg.seats[me];
    const seated = typeof mine === "number";
    const send: PodMsg[] = [];
    if (msg.rev > state.rev) {
      // A NEWER roster from the live lead is the truth, verbatim — this is how a clear, a
      // withdrawal or a reset reaches every phone (a merge would swallow them — Enki, round 2).
      return {
        state: {
          members: msg.members, seats: msg.seats, lead, phase: msg.phase, rev: msg.rev,
          mySeat: seated ? mine : (state.mySeat > 0 ? state.mySeat : 0),
          full: !seated && state.mySeat === 0 && Object.keys(msg.seats).length >= ctx.podSize - 1,
        },
        send: !seated && state.mySeat > 0 && ctx.connected ? [{ kind: "claim", from: me, seat: state.mySeat, rev: state.rev }] : [],
      };
    }
    // An OLDER roster can only come from a lead that reloaded and lost its memory: merge so
    // nothing filled is erased, keep my chair, re-claim it with the revision I last saw, and
    // re-send my seat so the lead rebuilds.
    const members = mergeRoster(state.members, msg.members);
    let mySeat = seated ? mine : 0;
    if (!seated && state.mySeat > 0) {
      mySeat = state.mySeat;
      if (ctx.connected) send.push({ kind: "claim", from: me, seat: mySeat, rev: state.rev });
    }
    if (mySeat > 0 && ctx.connected) send.push({ kind: "member", from: me, seat: mySeat, patch: stripWitness(state.members[mySeat]) });
    return {
      state: { members, seats: msg.seats, mySeat, lead, phase: msg.phase, rev: state.rev,
               full: !seated && state.mySeat === 0 && Object.keys(msg.seats).length >= ctx.podSize - 1 },
      send,
    };
  }
  if (msg.kind === "member") {
    // Own seat only, and never the witness bits — those travel as `attest`, one index each
    // (an over-long or foreign witnessedBy in a patch is a forged witness floor — Thor, round 2).
    if (!patchAllowed(state, msg.from, msg.seat) || "witnessedBy" in msg.patch) return { state, send: [] };
    const next = { ...state, members: withPatch(state.members, msg.seat, msg.patch) };
    return ctx.role === "lead" ? publish(next, ctx) : { state: next, send: [] };
  }
  if (msg.kind === "attest") {
    // The sender may set ONLY its own index on the target's claim, and never on its own claim.
    const j = seatOf(state, msg.from);
    if (j == null || j === msg.target || !state.members[msg.target]) return { state, send: [] };
    const next = { ...state, members: withBit(state.members, msg.target, j, msg.on) };
    return ctx.role === "lead" ? publish(next, ctx) : { state: next, send: [] };
  }
  if (msg.kind === "reset") {
    // A deliberate clear — only the pinned lead may ask. Everyone returns to the invite.
    if (ctx.role !== "joiner" || msg.from !== state.lead) return { state, send: [] };
    return { state: { ...state, phase: "invite", members: state.members.map((m) => ({ ...m, ...RESET_PATCH(ctx.podSize) })) }, send: [] };
  }
  // phase — only from a phone the roster knows, and only FORWARD: a lagged phone's stale
  // "sync" arriving after "active" must never rewind the pod (Sofia, round 2). Going back is
  // what `reset` is for.
  if (!known(state, msg.from) || PHASE_ORDER[msg.phase] <= PHASE_ORDER[state.phase]) return { state, send: [] };
  const next = { ...state, phase: msg.phase };
  return ctx.role === "lead" ? publish(next, ctx) : { state: next, send: [] };
}

/** A member's own-seat re-send never carries witness bits (those are attestations, not claims). */
const stripWitness = (m: Member): Partial<Member> => {
  const { witnessedBy: _w, ...rest } = m; void _w; return rest;
};

/** This phone changed one seat. Only the lead (seat 0) or the seat's owner may. */
export function patchPod(state: PodState, seat: number, patch: Partial<Member>, ctx: PodCtx): Step {
  const next = { ...state, members: withPatch(state.members, seat, patch) };
  if (!ctx.connected) return { state: next, send: [] };
  if (ctx.role === "lead") return publish(next, ctx);
  return { state: next, send: [{ kind: "member", from: ctx.clientId, seat, patch: stripWitness({ ...state.members[seat], ...patch }) }] };
}

/** This phone (as the reviewer in its own seat) attests or withdraws on `target`'s claim. Never on its own. */
export function attest(state: PodState, target: number, on: boolean, ctx: PodCtx): Step {
  const j = ctx.role === "lead" ? 0 : state.mySeat;
  if (j === target || (ctx.role === "joiner" && ctx.connected && state.mySeat === 0)) return { state, send: [] };
  const next = { ...state, members: withBit(state.members, target, j, on) };
  if (!ctx.connected) return { state: next, send: [] };
  if (ctx.role === "lead") return publish(next, ctx);
  return { state: next, send: [{ kind: "attest", from: ctx.clientId, target, on }] };
}

/** The same patch to every seat, locally, then the lead's roster. Joiners never publish a roster. */
export function patchAll(state: PodState, patch: Partial<Member>, ctx: PodCtx): Step {
  const next = { ...state, members: state.members.map((m) => ({ ...m, ...patch })) };
  return ctx.role === "lead" ? publish(next, ctx) : { state: next, send: [] };
}

/** The lead's Reset: clears every seat everywhere and returns the pod to the invite. A joiner's stays local. */
export function resetPod(state: PodState, ctx: PodCtx): Step {
  const next = { ...state, phase: "invite" as Phase, members: state.members.map((m) => ({ ...m, ...RESET_PATCH(ctx.podSize) })) };
  if (!ctx.connected || ctx.role !== "lead") return { state: next, send: [] };
  const p = publish(next, ctx);
  return { state: p.state, send: [{ kind: "reset", from: ctx.clientId }, ...p.send] };
}

/** Move the pod forward. Any seated phone may (the copy has always said "any member stops"). */
export function movePhase(state: PodState, phase: Phase, ctx: PodCtx): Step {
  if (PHASE_ORDER[phase] <= PHASE_ORDER[state.phase]) return { state, send: [] };
  const next = { ...state, phase };
  if (!ctx.connected) return { state: next, send: [] };
  if (ctx.role === "lead") return publish(next, ctx);
  return { state: next, send: [{ kind: "phase", from: ctx.clientId, phase }] };
}

/** How many phones the roster knows: the lead plus every seated joiner. Derived from the roster,
 *  never from the channel's presence count — that is the poll's number (Krishna, round 2). */
export const podPresence = (state: PodState): number => 1 + Object.keys(state.seats).length;

/** May this phone edit seat `i`? Offline, the lead fills all (the single-phone prototype). */
export const canEditSeat = (i: number, state: PodState, ctx: PodCtx): boolean =>
  !ctx.connected ? ctx.role === "lead" : (ctx.role === "joiner" ? state.mySeat > 0 && i === state.mySeat : i === 0);

/** May this phone flip reviewer `j`'s attestation? Only the reviewer's own phone. */
export const canWitnessAs = (j: number, state: PodState, ctx: PodCtx): boolean =>
  !ctx.connected ? ctx.role === "lead" : j === (ctx.role === "lead" ? 0 : state.mySeat);

/** The synchronized start: every seat must press within `windowSec` of each other. */
export function syncVerdict(members: Member[], windowSec: number):
  { status: "waiting" | "synced" | "too_far"; spreadMs: number } {
  const times = members.map((m) => m.startedAt).filter((v): v is number => v != null);
  if (times.length !== members.length) return { status: "waiting", spreadMs: 0 };
  const spreadMs = Math.max(...times) - Math.min(...times);
  return { status: spreadMs <= windowSec * 1000 ? "synced" : "too_far", spreadMs };
}

/** TOK-17 / unit.witness: a claim counts only when at least TWO OTHER members attest it. Two is the
 *  doctrinal floor whatever the pod size — "two people can quietly agree on a lie; three must
 *  openly conspire" — so it does not scale with podSize. The page imports these; it never
 *  restates the rule (Christo, round 2). */
export const WITNESS_FLOOR = 2;
export const witnessedCount = (members: Member[], i: number): number =>
  members[i].witnessedBy.filter((w, j) => w && j !== i).length;
export const isWitnessed = (members: Member[], i: number): boolean => witnessedCount(members, i) >= WITNESS_FLOOR;
