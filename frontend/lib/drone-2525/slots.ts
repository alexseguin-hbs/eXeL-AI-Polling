// T1 · T2 · T3 — the numbered target slots, and the amber → red rule that decides whether one can fire.
//
// Operator 2026-09-16, r.049/r.050 (CLAUDE_CODE_NOTES_r047_r050.md), quoted:
//
//     click / TARGET / voice target    →  amber box + Tn
//     APPROVE (HI-2 or net peer)       →  red box
//     FIRE / double-click / voice fire →  only if phase === 'red'
//
// Verified in his r.050 source: approveDesig() is the ONLY writer of phase='red', and fireN() refuses
// anything else with a recorded reason — NO_RED_BOX when nothing is designated, AMBER_NO_APPROVE when it is
// designated but not approved. Double-click does not skip APPROVE. This module is that rule, pure.
//
// WHY THIS IS NEW STATE AND NOT A VIEW ON WHAT EXISTS. targets.ts has `TargetWindow.slot`, which is a
// SCHEDULER field — which of the concurrent up-windows a door occupies — and a false friend for this. The
// `live` array the round computes reshuffles as windows open and close, so `live[0..2]` would point "T1" at
// a different door every second. A slot has to be pinned to a door id and survive ticks, which is exactly
// how TagState pins captures. This imitates that shape.
//
// TWO-STEP OR TWO-PERSON, SAID PLAINLY. On one device the same person may approve as "HI-2" — his r.050
// allows it by comment, with no check. That makes solo play a two-STEP rule. With a second device or tab
// the approver is a different actor and it becomes a two-PERSON rule. `approvedBy` keeps both honest: the
// HUD can say which one is in force instead of implying the stronger one.
//
// Pure: no clock (times are passed in), no DOM, no Math.random.

export type SlotN = 1 | 2 | 3;
export const SLOT_NS: readonly SlotN[] = [1, 2, 3];

/** amber = designated by a first person; red = approved by a second authority. Nothing else can fire. */
export type Phase = "amber" | "red";

export interface Designation {
  doorId: string;
  phase: Phase;
  /** Who designated. A name — the fire gate downstream needs one. */
  by: string;
  designatedAtMs: number;
  /** Who turned it red, or null while amber. */
  approvedBy: string | null;
  approvedAtMs: number | null;
}

export interface Slots {
  /** Slot → designation, or null. Keyed by number so "T2" is a lookup, not a search. */
  s: Record<SlotN, Designation | null>;
  /** The slot the operator is currently acting on — what FIRE with no number means. */
  current: SlotN | null;
}

export const initSlots = (): Slots => ({ s: { 1: null, 2: null, 3: null }, current: null });

/** The refusal reasons, as r.050 names them. Recorded, never merely toasted. */
export type FireRefusal = "NO_RED_BOX" | "AMBER_NO_APPROVE";

// ── DESIGNATE → AMBER ────────────────────────────────────────────────────────────────────────────

/**
 * Put a door in a slot as AMBER. Re-designating the same door into the same slot is a no-op; a different
 * door into an occupied slot REPLACES it and drops any approval — a red box is for one object, not a slot.
 * If the door is already in another slot, it moves rather than being in two places.
 */
export function designate(st: Slots, n: SlotN, doorId: string, by: string, atMs: number): Slots {
  if (!doorId || !by?.trim()) return st;
  const cur = st.s[n];
  if (cur && cur.doorId === doorId) return { ...st, current: n };
  const s = { ...st.s };
  for (const k of SLOT_NS) if (s[k]?.doorId === doorId) s[k] = null;      // one object, one slot
  s[n] = { doorId, phase: "amber", by: by.trim(), designatedAtMs: atMs, approvedBy: null, approvedAtMs: null };
  return { s, current: n };
}

/** The first free slot, or the current one if all are taken — what a bare "target" or a tap means. */
export function nextFreeSlot(st: Slots): SlotN {
  for (const k of SLOT_NS) if (!st.s[k]) return k;
  return st.current ?? 1;
}

/** Where a door sits, if anywhere. */
export function slotOf(st: Slots, doorId: string): SlotN | null {
  for (const k of SLOT_NS) if (st.s[k]?.doorId === doorId) return k;
  return null;
}

// ── APPROVE → RED ────────────────────────────────────────────────────────────────────────────────

/**
 * Turn a slot red. The ONLY function in this module that writes phase='red', by construction. Refuses an
 * unnamed approver, refuses an empty slot, and is a no-op on a slot already red. It does not check whether
 * `by` is a different person from the designator — r.050 permits the same device to act as HI-2 — but it
 * records who it was, so nothing downstream has to guess.
 */
export function approve(st: Slots, n: SlotN, by: string, atMs: number): Slots {
  const cur = st.s[n];
  if (!cur || !by?.trim() || cur.phase === "red") return st;
  return { ...st, s: { ...st.s, [n]: { ...cur, phase: "red", approvedBy: by.trim(), approvedAtMs: atMs } } };
}

/** Was this red box reached by a second PERSON, or by the same one acting as HI-2? Both are honest. */
export const approvalKind = (d: Designation): "two-person" | "two-step" | null =>
  d.phase !== "red" || !d.approvedBy ? null : d.approvedBy === d.by ? "two-step" : "two-person";

// ── FIRE — ONLY RED ──────────────────────────────────────────────────────────────────────────────

export interface FireCheck { ok: boolean; slot: SlotN | null; doorId: string | null; refusal: FireRefusal | null }

/**
 * May this slot fire? `n` omitted means the current slot — "FIRE" with no number, or a double-click.
 * Returns a refusal reason rather than throwing, because a refusal is a DECISION that gets recorded, and a
 * thrown error is a decision that gets lost.
 */
export function canFire(st: Slots, n?: SlotN | null): FireCheck {
  const k = n ?? st.current;
  const d = k ? st.s[k] : null;
  if (!k || !d) return { ok: false, slot: k ?? null, doorId: null, refusal: "NO_RED_BOX" };
  if (d.phase !== "red") return { ok: false, slot: k, doorId: d.doorId, refusal: "AMBER_NO_APPROVE" };
  return { ok: true, slot: k, doorId: d.doorId, refusal: null };
}

// ── CLEARING ─────────────────────────────────────────────────────────────────────────────────────

/** Empty one slot. After a shot lands, or when the operator changes their mind. */
export function clearSlot(st: Slots, n: SlotN): Slots {
  const s = { ...st.s, [n]: null };
  const current = st.current === n ? (SLOT_NS.find((k) => s[k]) ?? null) : st.current;
  return { s, current };
}

/** Drop any slot whose door is no longer actionable. The caller says which doors still are. */
export function pruneSlots(st: Slots, actionable: ReadonlySet<string>): Slots {
  let out = st;
  for (const k of SLOT_NS) if (out.s[k] && !actionable.has(out.s[k]!.doorId)) out = clearSlot(out, k);
  return out;
}

// ── WHAT A PERSON READS ──────────────────────────────────────────────────────────────────────────

/** "T2 · AMBER" / "T2 · RED (HI-2)" / "TARGET FIRST" — the HUD phrase, in r.050's words. */
export function slotLine(st: Slots, label: (doorId: string) => string = (id) => id): string {
  const k = st.current;
  const d = k ? st.s[k] : null;
  if (!k || !d) return "TARGET FIRST";
  const kind = approvalKind(d);
  return `T${k} · ${d.phase.toUpperCase()}${kind ? ` (${kind === "two-step" ? "HI-2" : d.approvedBy})` : ""} · ${label(d.doorId)}`;
}

/** The toast r.050 shows for each refusal, verbatim. */
export const refusalToast = (r: FireRefusal): string =>
  r === "AMBER_NO_APPROVE" ? "AMBER · SECOND HI APPROVE" : "NO RED BOX";
