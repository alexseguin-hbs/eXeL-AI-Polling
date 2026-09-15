// THE AUTHORITY LADDER — five levels, on the band the MoT ladder already has.
//
// Operator 2026-09-15: "5 levels where level 1 is more manual HI and level 5 is more complex AI vs SI."
// Autonomy rides on the existing band rather than adding a second axis to reason about.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE INVARIANT DOES NOT BEND AT ANY LEVEL:
//
//     A NAMED HUMAN DECISION EXISTS BEFORE ANY MACHINE SHOT, AND SILENCE IS NEVER CONSENT.
//
// What scales with the level is the BREADTH of one decision and WHO makes it — never whether a decision
// happened at all. There is no rung of this ladder on which a machine may fire because nobody objected.
// Level 5 is the operator's "AI vs SI": the machine proposes continuously and a named key group is the
// standing check, which is still named humans deciding, so `mayFire` keeps its shape.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
//
// Pure: no clock, no DOM, no Math.random. Every function takes the time it needs as an argument.
import type { ShotDecision } from "./ai-crew";

export type AuthorityLevel = 1 | 2 | 3 | 4 | 5;
export const AUTHORITY_LEVELS: AuthorityLevel[] = [1, 2, 3, 4, 5];

export interface AuthorityRule {
  level: AuthorityLevel;
  /** What one named decision covers. The whole ladder, in one field. */
  covers: "shot" | "target" | "window";
  /** Who is entitled to make it. */
  decider: "person" | "group";
  /** A short name a person reads on the control. */
  id: string;
}

export const AUTHORITY: Record<AuthorityLevel, AuthorityRule> = {
  1: { level: 1, covers: "shot",   decider: "person", id: "every shot" },
  2: { level: 2, covers: "target", decider: "person", id: "each aircraft once" },
  3: { level: 3, covers: "window", decider: "person", id: "a declared window" },
  4: { level: 4, covers: "window", decider: "group",  id: "a window the group approved" },
  5: { level: 5, covers: "window", decider: "group",  id: "a standing mandate the group can end" },
};

/** The MoT band a person has chosen is the authority level. One control, not two. */
export const levelFromBand = (band: number): AuthorityLevel =>
  (Math.max(1, Math.min(5, Math.round(band))) as AuthorityLevel);

/**
 * A MANDATE is the record of one named decision and exactly what it covers. It is created only from a
 * decision that already happened — there is no constructor that invents one — and it can always be ended.
 */
export interface Mandate {
  level: AuthorityLevel;
  /** WHO decided. A mandate without a name cannot be built; the type will not allow it. */
  by: string;
  grantedAtMs: number;
  /** When it lapses on its own. A mandate with no end is not a mandate, it is a policy. */
  endsAtMs: number;
  /** For level 2, the one aircraft it covers. Null at the window levels. */
  targetId: string | null;
  /** Which side it authorises acting against — never "anything in the air". */
  side: string;
  endedAtMs: number | null;
  endedBy: string | null;
}

export const MANDATE_MAX_MS = 5 * 60 * 1000;

/** Build a mandate from a decision that was actually taken. Refuses an unapproved or unnamed one. */
export function mandateFrom(d: ShotDecision, level: AuthorityLevel, side: string, nowMs: number, lastsMs = 120_000): Mandate | null {
  if (d.verdict !== "approved") return null;
  if (!d.by || !d.by.trim()) return null;
  const rule = AUTHORITY[level];
  return {
    level, by: d.by.trim(), grantedAtMs: nowMs,
    endsAtMs: nowMs + Math.min(MANDATE_MAX_MS, Math.max(1000, lastsMs)),
    targetId: rule.covers === "target" ? d.request.doorId : null,
    side, endedAtMs: null, endedBy: null,
  };
}

/** A person ends a mandate. Always available, at every level, and it takes effect on the next shot. */
export const endMandate = (m: Mandate, by: string, nowMs: number): Mandate =>
  m.endedAtMs != null ? m : { ...m, endedAtMs: nowMs, endedBy: by.trim() || "someone" };

export const mandateLive = (m: Mandate | null, nowMs: number): boolean =>
  Boolean(m && m.endedAtMs == null && m.endsAtMs > nowMs);

export interface Covered { ok: boolean; why: string }

/**
 * Does an existing mandate cover THIS shot? Every answer names a reason a person can read, because a
 * refusal nobody can explain is a refusal nobody will trust.
 */
export function coversShot(level: AuthorityLevel, m: Mandate | null, targetId: string, side: string, nowMs: number): Covered {
  const rule = AUTHORITY[level];
  // Level 1 never has a mandate to check: every shot is its own question, which is the point of level 1.
  if (rule.covers === "shot") return { ok: false, why: "at this level every shot is asked separately" };
  if (!m) return { ok: false, why: "nobody has authorised anything yet" };
  if (m.endedAtMs != null) return { ok: false, why: `ended by ${m.endedBy}` };
  if (m.endsAtMs <= nowMs) return { ok: false, why: `the authority from ${m.by} has lapsed` };
  if (m.level !== level) return { ok: false, why: "that authority was given at a different level" };
  if (m.side !== side) return { ok: false, why: `${m.by} authorised action against ${m.side}, not ${side}` };
  if (rule.covers === "target" && m.targetId !== targetId) return { ok: false, why: `${m.by} authorised one aircraft, and this is not it` };
  return { ok: true, why: `covered by ${m.by}` };
}

/**
 * Level 5's standing check. The group's live lean IS the authority: a lean to hold ends the engagement at
 * once, and an absent group is not a permissive one — no quorum means no authority.
 */
export function groupStanding(lean: "approve" | "hold" | null, quorum: boolean): Covered {
  if (!quorum) return { ok: false, why: "not enough of the group has answered to read them" };
  if (lean === "hold") return { ok: false, why: "the group is saying hold" };
  if (lean !== "approve") return { ok: false, why: "the group is evenly split" };
  return { ok: true, why: "the group is standing behind it" };
}

/** One line for the control: what this level means, in words, before anyone selects it. */
export const authorityLine = (level: AuthorityLevel): string => {
  const r = AUTHORITY[level];
  return `${r.decider === "group" ? "the key group" : "a named person"} authorises ${r.id}`;
};
