/**
 * CUBE 23 · DE-RISK GATEWAY + PRIMITIVE #13 · RISK REGISTER — Vision-2525 Level-3 substrate.
 * ==========================================================================================
 * Contract: `docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md` (L3-2026-07-04.8), §3 Principle #3 and the
 * Cube 23 spec: "Phase gate rules: advance if >=66% weighted approval across >=30-day window ·
 * Vision 2525 Principle #3 enforcer: Pilot -> Refine -> Qualify -> Adopt order".
 *
 * ⚠ THIS IS NOT `architect-estimate.GATES`, AND I CHECKED BEFORE WRITING A LINE. That ladder is
 * "G0 Vision … G13 Replay" — fourteen BUILD gates belonging to the Architect-2525 Domain Play, an
 * expression of Cubes 24/26. This is the four SUBSTRATE phases every domain inherits and none may
 * fork (framework §Rule: "The substrate never forks per domain"). Two ladders, two cubes, no overlap.
 *
 * PURE AND DETERMINISTIC — no React, no domain vocabulary, no clock. Every function is a fold over
 * its arguments, so the same inputs always yield the same output and the same register hash. The
 * caller supplies `nowIso`; nothing here reads `Date.now()`, because a replay that re-derives a
 * different verdict from the same evidence is not a replay.
 */

/** Principle #3 · Quality Before Scale. The order IS the law — index is the only way to advance. */
export const L3_PHASES = ["pilot", "refine", "qualify", "adopt"] as const;
export type L3Phase = (typeof L3_PHASES)[number];

/** Cube 23's two published thresholds. Named, not inlined, so a domain cannot quietly soften them. */
export const QUORUM_PCT = 66;      // ">=66% weighted approval"
export const WINDOW_DAYS = 30;     // "across a >=30-day window"

export type GateVote = {
  voter: string;
  /** Governance weight. Negative or non-finite weights are dropped — a vote cannot subtract quorum. */
  weight: number;
  approve: boolean;
  /** Whether this voter is a HUMAN signer. Principle #1: AI proposes, HI decides. */
  human?: boolean;
};

export type RiskRow = {
  id: string;
  /** 0..1 */ probability: number;
  /** 0..1 */ impact: number;
  mitigation: string;
  owner: string;
  /** Which cube opened the row — 23 (a gate) or 27 (an incident), per Primitive #13. */
  openedBy: 23 | 27;
  openedAt: string;
  /** Set only by `retireRisk`, which APPENDS a superseding row rather than editing this one. */
  retiredAt?: string;
  retires?: string;
};

/** Exposure = probability x impact, the ISO-31000 product Primitive #13 names. */
export const exposureOf = (r: RiskRow): number => clamp01(r.probability) * clamp01(r.impact);

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * APPEND-ONLY IS ENFORCED BY THE SHAPE, NOT BY A COMMENT. `retireRisk` does not set `retiredAt` on
 * the original row — it appends a NEW row that names the row it supersedes. The array only ever
 * grows, so the hash of any prefix is still the hash that prefix always had, and an auditor in 2126
 * can replay the ledger forward from any point. That is Principle #2 (Trust Through Transparency)
 * expressed as a data structure instead of a promise.
 */
export function appendRisk(register: readonly RiskRow[], row: RiskRow): RiskRow[] {
  return [...register, row];
}

export function retireRisk(register: readonly RiskRow[], id: string, at: string, by: RiskRow["owner"]): RiskRow[] {
  const open = register.find((r) => r.id === id && !r.retires);
  if (!open) return [...register];                     // retiring an unknown row is a no-op, never a throw
  return [...register, { ...open, id: `${id}:retired`, retiredAt: at, retires: id, owner: by, openedAt: at }];
}

/** The rows still carrying exposure — an id is open until a superseding row names it. */
export function openRisks(register: readonly RiskRow[]): RiskRow[] {
  const retired = new Set(register.map((r) => r.retires).filter(Boolean) as string[]);
  return register.filter((r) => !r.retires && !retired.has(r.id));
}

/**
 * REGISTER HASH — the fingerprint Primitive #13 requires every Cube 25 quote-lock to carry, so that
 * "any upstream input drift invalidates the quote's validity hash, forcing human re-approval instead
 * of silent drift" (Primitive #15).
 *
 * FNV-1a over a CANONICAL serialization: fields in a fixed order, numbers at fixed precision, rows
 * in ledger order. Canonical because `JSON.stringify` of an object literal preserves insertion order
 * and two call sites can insert in different orders — hashing that would make the same ledger hash
 * two ways. Deliberately NOT crypto-grade: this is a drift detector that must run identically in a
 * browser, in Node, and in a replay harness with no subtle dependency. Cube 11 re-anchors with
 * SHA-256 on chain; this is the local tripwire that tells Cube 25 the inputs moved.
 */
export function registerHash(register: readonly RiskRow[]): string {
  const canon = register
    .map((r) => [r.id, r.probability.toFixed(6), r.impact.toFixed(6), r.mitigation, r.owner,
                 String(r.openedBy), r.openedAt, r.retiredAt ?? "", r.retires ?? ""].join(""))
    .join("");
  let h = 0x811c9dc5;
  for (let i = 0; i < canon.length; i++) { h ^= canon.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return `r13-${h.toString(16).padStart(8, "0")}`;
}

export type GateVerdict = {
  phase: L3Phase;
  next: L3Phase;
  advance: boolean;
  approvalPct: number;
  weightFor: number;
  weightTotal: number;
  humanSigners: number;
  openExposure: number;
  /** Every reason the gate held, in evaluation order. Empty exactly when `advance` is true. */
  blockedBy: string[];
};

export type GateInput = {
  phase: L3Phase;
  votes: readonly GateVote[];
  /** Days the poll has been open. Cube 23 requires >= WINDOW_DAYS. */
  windowDays: number;
  register?: readonly RiskRow[];
  /** A domain may raise the bar; it may never lower it below the substrate thresholds. */
  quorumPct?: number;
  /** Exposure above which the gate holds regardless of the vote. 0 disables the check. */
  maxOpenExposure?: number;
};

/**
 * EVALUATE ONE GATE. Returns a verdict; never throws, never mutates, never advances more than one
 * phase. `blockedBy` lists EVERY failing condition rather than short-circuiting on the first, because
 * a board that fixes one blocker and re-runs only to hit the next has been told the truth in
 * instalments — which is how a 30-day window becomes 90.
 */
export function evaluateGate(input: GateInput): GateVerdict {
  const { phase, votes, windowDays, register = [] } = input;
  const idx = L3_PHASES.indexOf(phase);
  const quorum = Math.max(QUORUM_PCT, Number.isFinite(input.quorumPct ?? NaN) ? (input.quorumPct as number) : QUORUM_PCT);

  const valid = votes.filter((v) => v && Number.isFinite(v.weight) && v.weight > 0);
  const weightTotal = valid.reduce((s, v) => s + v.weight, 0);
  const weightFor = valid.filter((v) => v.approve).reduce((s, v) => s + v.weight, 0);
  const approvalPct = weightTotal > 0 ? (weightFor / weightTotal) * 100 : 0;
  const humanSigners = valid.filter((v) => v.human && v.approve).length;
  const openExposure = openRisks(register).reduce((s, r) => s + exposureOf(r), 0);
  const cap = input.maxOpenExposure ?? 0;

  const blockedBy: string[] = [];
  // Principle #3 — Adopt is terminal. There is no phase after it to skip into.
  if (idx === L3_PHASES.length - 1) blockedBy.push("adopt is the terminal phase — nothing to advance into");
  if (weightTotal <= 0) blockedBy.push("no weighted votes cast");
  else if (approvalPct < quorum) blockedBy.push(`approval ${approvalPct.toFixed(1)}% is below the ${quorum}% quorum`);
  if (windowDays < WINDOW_DAYS) blockedBy.push(`poll open ${windowDays}d, below the ${WINDOW_DAYS}d window`);
  // Principle #1 — Humanity at the Center. AI proposes, HI decides; a gate cannot pass on AI weight alone.
  if (humanSigners < 1) blockedBy.push("no human signer approved — Principle #1 requires at least one");
  if (cap > 0 && openExposure > cap) blockedBy.push(`open risk exposure ${openExposure.toFixed(2)} exceeds the ${cap} cap`);

  return {
    phase,
    next: L3_PHASES[Math.min(idx + 1, L3_PHASES.length - 1)],
    advance: blockedBy.length === 0,
    approvalPct, weightFor, weightTotal, humanSigners, openExposure, blockedBy,
  };
}

/**
 * ADVANCE BY ONE, OR NOT AT ALL. The only mover of phase in the substrate. A caller cannot hand it a
 * target phase, which is precisely how "no domain can skip stages to reach Adopt" is enforced — the
 * function has no parameter with which to express a skip.
 */
export function advancePhase(phase: L3Phase, verdict: GateVerdict): L3Phase {
  return verdict.advance && verdict.phase === phase ? verdict.next : phase;
}
