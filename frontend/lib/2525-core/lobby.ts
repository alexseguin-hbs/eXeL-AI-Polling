// THE LOBBY — a Blizzard-style waiting room with a 6-digit code PER TEAM (operator deck r.128, "key add is
// lobby"), as a PURE REDUCER the Vision-2525 substrate owns. The deck keeps its UI; this is the capability,
// lifted so any 2525 surface (Drone, Security, Architect, the polling room) can seat two teams the same way
// without re-deriving the rules. Every rule below is the deck's, cited by its function name.
//
//   ensureCodes / rotateCodes   — lobbyEnsureCodes / lobbyRotateCodes: a 6-digit code and an opaque seed id
//                                 per team; rotation is REFUSED once anyone is authenticated or a second member
//                                 is present ("TEAM CODES LOCKED · CREATE NEW ROOM").
//   markMember / roster         — lobbyMarkMember / lobbyRosterSnapshot: seats sorted by peerId, so two nodes
//                                 snapshot the same roster in the same order (it is hashed).
//   readyCounts / counts        — lobbyReadyCounts / lobbyCounts, per team: n / ready / auth.
//   canLaunch                   — lobbyCanLaunch, verbatim order: 9v9 LOCKED · HOST STARTS · MULTI-PEER
//                                 TRANSPORT NOT QUALIFIED (match>1) · WAIT DIRECT + AUTH · WAIT ROSTER ·
//                                 WAIT TEAM AUTH · WAIT BOTH READY · READY.
//   toggleReady                 — lobbyReady: a non-host may not ready up before DIRECT + team auth.
//   launchSnapshot / roomState  — lobbyLaunchSnapshot / lobbyRoomState: what LOBBY_LAUNCH / LOBBY_STATE carry.
//
// Pure: no DOM, no clock, no Math.random. The only randomness is code minting, through the one shared
// unbiased sampler (lib/2525-core/random.ts) — never `v % max` on a raw draw. The 6 digits AUTHORISE the two
// humans; they are never an encryption key.
import { randomIndex, randomHex } from "./random";

export type Team = "BLU" | "RED";
export const TEAMS: readonly Team[] = ["BLU", "RED"];
export type LobbyPhase = "WAITING" | "LIVE" | "PRACTICE";
/** The one match size the transport is qualified for today; 3v3 and 9v9 stay locked until 1v1 qualifies. */
export const QUALIFIED_MATCH = 1;
export const LOCKED_MATCH = 9;

export interface Member {
  peerId: string; team: Team; ready: boolean; auth: boolean;
  craft: string; challenge: number | null; lane: number | null;
}
export interface LobbyState {
  room: string; match: number; hostId: string; phase: LobbyPhase;
  team: Team; host: boolean; authenticated: boolean; ready: boolean;
  teamCodes: Record<Team, string>; seedIds: Record<Team, string>;
  members: Record<string, Member>;
}
/** What the transport layer knows that the lobby must not guess. */
export interface LinkFacts { path: "OFFLINE" | "LOCAL" | "DIRECT"; authenticated: boolean }

// ── MINTING (lobbyRand6 / lobbyOpaqueSeedId, on the shared sampler) ──────────────────────────────
/** A 6-digit team code in 100000..999999 — same range as the deck, drawn without modulo bias. */
export const rand6 = (): string => String(100000 + randomIndex(900000));
/** An opaque per-team seed id, `LC4-B-` / `LC4-R-` + 16 hex, as the deck mints it. */
export const opaqueSeedId = (team: Team): string => `LC4-${team === "RED" ? "R" : "B"}-${randomHex(8)}`;
export const isCode6 = (s: unknown): s is string => typeof s === "string" && /^\d{6}$/.test(s);

export function initLobby(room: string, hostId: string, opts: { host?: boolean; team?: Team; match?: number } = {}): LobbyState {
  return {
    room, hostId, match: opts.match ?? QUALIFIED_MATCH, phase: "WAITING",
    team: opts.team ?? "BLU", host: opts.host ?? false, authenticated: false, ready: false,
    teamCodes: { BLU: "", RED: "" }, seedIds: { BLU: "", RED: "" }, members: {},
  };
}

/** lobbyEnsureCodes: mint any missing / malformed code and any missing seed id. Never touches a valid one. */
export function ensureCodes(s: LobbyState, mint: { code?: () => string; seed?: (t: Team) => string } = {}): LobbyState {
  const code = mint.code ?? rand6, seed = mint.seed ?? opaqueSeedId;
  const teamCodes = { ...s.teamCodes }, seedIds = { ...s.seedIds };
  for (const t of TEAMS) {
    if (!isCode6(teamCodes[t])) { teamCodes[t] = code(); seedIds[t] = seed(t); }
    else if (!seedIds[t]) seedIds[t] = seed(t);
  }
  return { ...s, teamCodes, seedIds };
}

export const counts = (s: LobbyState) => {
  const v = Object.values(s.members);
  return { BLU: v.filter((m) => m.team === "BLU").length, RED: v.filter((m) => m.team === "RED").length, total: v.length };
};

/** lobbyRotateCodes: refused once the room is authenticated or has a second member. */
export function rotateCodes(s: LobbyState, mint: { code?: () => string; seed?: (t: Team) => string } = {}): { state: LobbyState; ok: boolean; note: string } {
  if (s.authenticated || counts(s).total > 1) return { state: s, ok: false, note: "TEAM CODES LOCKED · CREATE NEW ROOM" };
  const code = mint.code ?? rand6, seed = mint.seed ?? opaqueSeedId;
  const members: Record<string, Member> = {};
  if (s.host) {
    const me = s.members[s.hostId];
    members[s.hostId] = { peerId: s.hostId, team: s.team, ready: false, auth: true, craft: me?.craft ?? "quad", challenge: me?.challenge ?? 0, lane: me?.lane ?? 0 };
  }
  return { state: { ...s, teamCodes: { BLU: code(), RED: code() }, seedIds: { BLU: seed("BLU"), RED: seed("RED") }, ready: false, members }, ok: true, note: "CODES ROTATED" };
}

/** lobbyMarkMember: upsert a seat. */
export function markMember(s: LobbyState, peerId: string, team: Team, ready: boolean, extra: Partial<Pick<Member, "auth" | "craft" | "challenge" | "lane">> = {}): LobbyState {
  const old = s.members[peerId];
  const m: Member = {
    peerId, team: team === "RED" ? "RED" : "BLU", ready: !!ready,
    auth: extra.auth ?? old?.auth ?? false, craft: extra.craft ?? old?.craft ?? "",
    challenge: extra.challenge === undefined ? (old?.challenge ?? null) : extra.challenge,
    lane: extra.lane === undefined ? (old?.lane ?? null) : extra.lane,
  };
  return { ...s, members: { ...s.members, [peerId]: m } };
}

/** lobbyRosterSnapshot: seats sorted by peerId — the same on every node, because it is hashed. */
export const roster = (s: LobbyState): Member[] =>
  Object.values(s.members).map((m): Member => ({ ...m, team: m.team === "RED" ? "RED" : "BLU", ready: !!m.ready, auth: !!m.auth, craft: String(m.craft ?? ""), challenge: m.challenge == null ? null : +m.challenge, lane: m.lane == null ? null : +m.lane }))
    .sort((a, b) => a.peerId.localeCompare(b.peerId));

/** lobbyReadyCounts: per team n / ready / auth against a capacity (players a side; defaults to the match). */
export function readyCounts(s: LobbyState, cap = s.match) {
  const v = Object.values(s.members);
  const team = (t: Team) => v.filter((m) => m.team === t);
  const b = team("BLU"), r = team("RED");
  return { cap, BLU: { n: b.length, ready: b.filter((m) => m.ready).length, auth: b.filter((m) => m.auth).length }, RED: { n: r.length, ready: r.filter((m) => m.ready).length, auth: r.filter((m) => m.auth).length } };
}

/** lobbyCanLaunch, in the deck's exact order. Every refusal names why, so the room can say it. */
export function canLaunch(s: LobbyState, link: LinkFacts, cap = s.match): { ok: boolean; note: string } {
  if (s.match === LOCKED_MATCH) return { ok: false, note: "9v9 LOCKED" };
  if (!s.host) return { ok: false, note: "HOST STARTS" };
  if (s.match > QUALIFIED_MATCH) return { ok: false, note: "MULTI-PEER TRANSPORT NOT QUALIFIED" };
  if (link.path !== "DIRECT" || !link.authenticated) return { ok: false, note: "WAIT DIRECT + AUTH" };
  const q = readyCounts(s, cap);
  if (q.BLU.n < cap || q.RED.n < cap) return { ok: false, note: "WAIT ROSTER" };
  if (q.BLU.auth < cap || q.RED.auth < cap) return { ok: false, note: "WAIT TEAM AUTH" };
  if (q.BLU.ready < cap || q.RED.ready < cap) return { ok: false, note: "WAIT BOTH READY" };
  return { ok: true, note: "READY" };
}

/** lobbyReady: toggle my seat; a non-host may not ready up before DIRECT + team auth. */
export function toggleReady(s: LobbyState, me: string, link: LinkFacts, seat: { craft: string; challenge: number; lane: number }): { state: LobbyState; ok: boolean; note: string } {
  if (!s.host && (link.path !== "DIRECT" || !link.authenticated)) return { state: s, ok: false, note: "READY HOLD · WAIT DIRECT + TEAM AUTH" };
  const ready = !s.ready;
  const next = markMember({ ...s, ready }, me, s.team, ready, { auth: s.host || !!link.authenticated, ...seat });
  return { state: next, ok: true, note: `${s.team} ${ready ? "READY" : "NOT READY"}` };
}

/** lobbyRoomState — what LOBBY_STATE carries. */
export const roomState = (s: LobbyState) => ({
  room: s.room, match: +s.match || 1, hostId: s.hostId, phase: s.phase, seats: roster(s),
  seedIds: { BLU: String(s.seedIds.BLU ?? ""), RED: String(s.seedIds.RED ?? "") },
});

/** lobbyLaunchSnapshot — what LOBBY_LAUNCH carries. `preLaunchHash` is the caller's replay hash at launch. */
export function launchSnapshot(s: LobbyState, sel: { challenge: number; craft: string }, preLaunchHash: string) {
  const seats = roster(s);
  return {
    room: s.room, match: +s.match || 1, hostId: s.hostId, seats, challenge: sel.challenge, defaultCraft: sel.craft,
    laneClaims: seats.map((x) => ({ peerId: x.peerId, lane: x.lane })),
    seedIds: { BLU: String(s.seedIds.BLU ?? ""), RED: String(s.seedIds.RED ?? "") },
    preLaunchHash,
  };
}

/** practiceNoRoom: solo practice is CH0 only. */
export const canPracticeAlone = (challenge: number): { ok: boolean; note: string } =>
  challenge === 0 ? { ok: true, note: "CH0 PRACTICE · NO ROOM" } : { ok: false, note: "PRACTICE / NO ROOM · CH0 ONLY" };
