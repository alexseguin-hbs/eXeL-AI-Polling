// THE CREW (DRN-10) — who flies, who aims, and who is allowed to fire.
//
// Operator 2026-09-15, item 4: "One HI pilot, 1x AI targeteer / One AI pilot, 1x HI targeteer / Humans
// watching both (HI approves before shot)".
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE INVARIANT, stated before the code, in the operator's terms:
//
//     AN AI-INITIATED SHOT NEVER FIRES WITHOUT A NAMED HUMAN APPROVAL EVENT.
//
// Not "usually". Not "unless the operator turned the check off". There is no path through this module
// that produces a fired shot from an AI request without a human's approval recorded first, and the
// approval is an EVENT in the record — a thing that happened, with a time and a person — not a boolean
// someone set earlier. `resolveRequest` is the only function that can retire a request, and it demands
// an approver's name. If a future edition adds a second way to fire, this file's gate fails.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// The AI here is scripted and deterministic — a seeded pattern, not a model. That is deliberate: the point
// of this pass is the AUTHORITY question, and a replayable opponent is the only way to argue about it
// afterwards. No Math.random, no clock.
import { aimAt, shortestTurn, type GimbalState, type Mount } from "./gimbal";
import { lineOfSight, type Prism } from "./los";
import type { TargetView } from "./targets";
import type { Vec3 } from "@/lib/wire-core/wire-model";

export type Seat = "pilot" | "targeteer";
export type Who = "HI" | "AI";
export interface Crew { pilot: Who; targeteer: Who; /** A human always watches; this names them. */ approver: string }

/**
 * The authority level a crew implies, for the decision record. NOT invented variance: it reads WHO is in
 * the loop. Two humans deciding one shot = 1; a human authorizing an AI-involved shot = 2 (broader loop);
 * a watch officer over two machines = 3. The live round is always a named human before any AI fire; this
 * only records which shape that took, so a two-HI run and a mixed-crew run are distinguishable in the sidecar.
 */
export const authorityLevelOf = (c: Crew): number =>
  c.pilot === "HI" && c.targeteer === "HI" ? 1 : c.pilot === "AI" && c.targeteer === "AI" ? 3 : 2;

export const CREWS: Record<string, Crew> = {
  two_hi:      { pilot: "HI", targeteer: "HI", approver: "the crew" },
  hi_pilot:    { pilot: "HI", targeteer: "AI", approver: "the pilot" },
  ai_pilot:    { pilot: "AI", targeteer: "HI", approver: "the targeteer" },
  both_ai:     { pilot: "AI", targeteer: "AI", approver: "the watch officer" },
};
export type CrewId = keyof typeof CREWS;

/** True when the shot would be started by a machine — the only case that needs an approval event. */
export const shotNeedsApproval = (c: Crew): boolean => c.targeteer === "AI";

// ── THE AI PILOT ────────────────────────────────────────────────────────────────────────────────────
/**
 * A scripted orbit of the arena at a declared height and radius. Deterministic in elapsed time, so the
 * same run replays the same flight path. It flies a pattern; it does not decide anything.
 */
export function autoPilot(tSec: number, radiusM = 190, aglM = 55, periodS = 96): { e: number; n: number; aglM: number; headingDeg: number } {
  const a = ((tSec % periodS) / periodS) * Math.PI * 2;
  return {
    e: Math.sin(a) * radiusM,
    n: Math.cos(a) * radiusM,
    aglM,
    // Facing along the orbit, which points the airframe where it is going.
    headingDeg: ((a * 180) / Math.PI + 90 + 360) % 360,
  };
}

// ── THE AI TARGETEER ────────────────────────────────────────────────────────────────────────────────
export interface AutoAim { level: TargetView | null; az: number; el: number; why: string }

/**
 * Choose the next door to look at: up, reachable, and nearest by the shortest turn. Exactly the rule the
 * human's "next door" button follows, so the two seats behave the same way and a crew can swap mid-round.
 */
export function autoTargeteer(
  eye: Vec3, gim: GimbalState, views: readonly TargetView[],
  ground: (e: number, n: number) => number, prisms: readonly Prism[],
  /** The same optics the human seat is held to. A machine that ignores its own range asks for the impossible. */
  limits: { nearM: number; rangeM: number } = { nearM: 5, rangeM: 400 },
): AutoAim {
  const live = views.filter((v) => v.phase === "up" || v.phase === "captured");
  if (!live.length) return { level: null, az: gim.az, el: gim.el, why: "no door is open" };
  const ranked = live
    .map((v) => {
      const a = aimAt(eye, v.door.at);
      const reach = lineOfSight(eye, v.door.at, ground, prisms, { ignore: v.door.buildingId });
      // THE MACHINE IS HELD TO THE SAME OPTICS AS THE PERSON. The walkthrough caught it asking to shoot a
      // door 453 m away through a 400 m sensor: the human seat had always checked range, and this one had
      // not, so the two seats were being judged by different rules.
      const inRange = a.rangeM >= limits.nearM && a.rangeM <= limits.rangeM;
      return { v, a, turn: Math.abs(shortestTurn(gim.az, a.az)), ok: reach.clear && inRange };
    })
    .filter((c) => c.ok)
    .sort((p, q) => p.turn - q.turn);
  if (!ranked.length) return { level: null, az: gim.az, el: gim.el, why: "every open door is out of range or behind something" };
  const pick = ranked[0];
  return { level: pick.v, az: pick.a.az, el: pick.a.el, why: `${pick.v.door.label}, ${pick.a.rangeM.toFixed(0)} m` };
}

// ── THE APPROVAL GATE ───────────────────────────────────────────────────────────────────────────────
export interface ShotRequest {
  id: string;
  doorId: string;
  doorLabel: string;
  askedAtMs: number;
  az: number; el: number; rangeM: number;
  /** What the machine says it is looking at, for the human to agree or disagree with. */
  claim: string;
}
export type ShotVerdict = "approved" | "held";
export interface ShotDecision {
  request: ShotRequest;
  verdict: ShotVerdict;
  /** WHO decided. A verdict without a name is not a decision, and this type will not let one exist. */
  by: string;
  atMs: number;
}

export interface ApprovalState {
  pending: ShotRequest | null;
  decisions: ShotDecision[];
  /** Counted so a screen can say, truthfully, how many machine-started shots a human has turned down. */
  approved: number;
  held: number;
}
export const initApproval = (): ApprovalState => ({ pending: null, decisions: [], approved: 0, held: 0 });

/** A machine asks. It does not fire. There is no second argument that could make it fire. */
export function requestShot(s: ApprovalState, r: ShotRequest): ApprovalState {
  if (s.pending) return s;                                  // one question at a time — a queue is a way to lose one
  return { ...s, pending: r };
}

/**
 * A human answers, by name. This is the ONLY function that retires a request, and it cannot be called
 * without an approver, which is what makes "a named human approval event" a type-level fact rather than
 * a convention someone remembers.
 */
export function resolveRequest(s: ApprovalState, verdict: ShotVerdict, by: string, atMs: number): { state: ApprovalState; decision: ShotDecision | null } {
  if (!s.pending) return { state: s, decision: null };
  if (!by || !by.trim()) return { state: s, decision: null };   // an unnamed approval is not an approval
  const decision: ShotDecision = { request: s.pending, verdict, by: by.trim(), atMs };
  return {
    state: {
      pending: null,
      decisions: [...s.decisions, decision],
      approved: s.approved + (verdict === "approved" ? 1 : 0),
      held: s.held + (verdict === "held" ? 1 : 0),
    },
    decision,
  };
}

/**
 * THE GATE ITSELF. Call this before any shot. It returns true ONLY for a shot a human started, or one a
 * machine started that a named human has since approved. Everything else waits.
 */
export function mayFire(crew: Crew, approval: ApprovalState, forRequestId: string | null): { ok: boolean; why: string } {
  if (!shotNeedsApproval(crew)) return { ok: true, why: "a person is aiming this" };
  if (!forRequestId) return { ok: false, why: "a machine is aiming — it must ask first" };
  const d = approval.decisions.find((x) => x.request.id === forRequestId);
  if (!d) return { ok: false, why: "waiting for a person to decide" };
  if (d.verdict !== "approved") return { ok: false, why: `held by ${d.by}` };
  return { ok: true, why: `approved by ${d.by}` };
}

/** The line the watch officer reads before deciding. Plain words, no data structures. */
export const approvalPrompt = (r: ShotRequest): string =>
  `A machine is asking to shoot ${r.doorLabel}, ${r.rangeM.toFixed(0)} m away. It says: ${r.claim}`;

/** The record, one line per decision — the argument a review can have afterwards. */
export const approvalLog = (s: ApprovalState): string[] =>
  s.decisions.map((d) => `${(d.atMs / 1000).toFixed(1)}s  ${d.verdict.padEnd(8)} ${d.request.doorLabel}  by ${d.by}`);
