// STICK CALIBRATION — sensitivity, deadzone and trim, persisted, for any 2525 vehicle.
//
// Operator r.050 SETTINGS: `L SENS · R SENS · DEAD (0.08) · SET LX/LY/RX/RY · ZERO · SET FROM STICK ·
// RESET SETS`, kept at localStorage['exel-2525-sets']. This is that model, pure, in 2525-core because a
// Manta or a droid stick drifts the same way a drone stick does.
//
// WHY IT IS NOT POLISH. components/drone-2525/stick.tsx has no deadzone at all: a one-pixel offset from
// centre emits a non-zero axis, and a thumb resting slightly off-centre flies the aircraft sideways for
// as long as it rests there. Calibration is the difference between a stick that can be held still and one
// that cannot.
//
// The order of operations matters and is the usual one for a physical stick: TRIM first (this stick's
// centre is not quite the box's centre), then DEADZONE (inside it is zero, and the edge of it is remapped
// to zero so there is no jump), then SENSITIVITY (a gain), then a clamp to the unit disc.
//
// Persistence mirrors components/security-2525/fps-governor.ts: a module-level value, a localStorage key,
// every read and write wrapped, and a subscriber list so a settings panel and a stick can share one set
// without a React store between them.

export type Side = "L" | "R";

export interface StickSets {
  /** Gain per side. 1.00 is the stick as drawn. */
  l: number; r: number;
  /** Radius, 0..1 of the stick's throw, inside which the axis reads zero. r.050 default 0.08. */
  dead: number;
  /** Trim: what is ADDED to the raw reading so that "this thumb's rest" becomes zero. */
  lx: number; ly: number; rx: number; ry: number;
}

export const DEFAULT_SETS: Readonly<StickSets> = { l: 1, r: 1, dead: 0.08, lx: 0, ly: 0, rx: 0, ry: 0 };
export const SETS_KEY = "exel-2525-sets";

/** Where a value may go. A deadzone of 0.9 or a gain of 50 is a broken stick, not a preference. */
export const SETS_LIMITS = { sens: [0.25, 4] as const, dead: [0, 0.5] as const, trim: [-0.5, 0.5] as const };

const clamp = (v: number, lo: number, hi: number): number => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

/** A set with every field inside its limits. Anything missing or absurd becomes the default. */
export function sanitize(partial: Partial<StickSets> | null | undefined): StickSets {
  const p = partial ?? {};
  const [s0, s1] = SETS_LIMITS.sens, [d0, d1] = SETS_LIMITS.dead, [t0, t1] = SETS_LIMITS.trim;
  const num = (v: unknown, d: number, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? clamp(v, lo, hi) : d);
  return {
    l: num(p.l, DEFAULT_SETS.l, s0, s1), r: num(p.r, DEFAULT_SETS.r, s0, s1),
    dead: num(p.dead, DEFAULT_SETS.dead, d0, d1),
    lx: num(p.lx, 0, t0, t1), ly: num(p.ly, 0, t0, t1), rx: num(p.rx, 0, t0, t1), ry: num(p.ry, 0, t0, t1),
  };
}

// ── APPLY ────────────────────────────────────────────────────────────────────────────────────────

/**
 * Raw stick reading → calibrated axes. Trim, then deadzone with edge remap, then gain, then clamp.
 * Pure: the same raw and the same set always give the same answer, so a replay can reproduce an input.
 */
export function applySets(raw: { x: number; y: number }, side: Side, s: StickSets): { x: number; y: number } {
  const tx = side === "L" ? s.lx : s.rx, ty = side === "L" ? s.ly : s.ry;
  const gain = side === "L" ? s.l : s.r;
  let x = raw.x + tx, y = raw.y + ty;
  const m = Math.hypot(x, y);
  if (m <= s.dead) return { x: 0, y: 0 };
  // Remap so the deadzone's edge reads as zero rather than as `dead` — no jump when the thumb leaves it.
  const k = (m - s.dead) / (1 - s.dead) / m;
  x *= k; y *= k;
  x *= gain; y *= gain;
  const mm = Math.max(1, Math.hypot(x, y));
  return { x: x / mm, y: y / mm };
}

/** "SET FROM STICK": make the stick's current rest position read as zero. */
export const setFromStick = (s: StickSets, side: Side, rest: { x: number; y: number }): StickSets =>
  sanitize(side === "L" ? { ...s, lx: -rest.x, ly: -rest.y } : { ...s, rx: -rest.x, ry: -rest.y });

/** "ZERO": clear the trims, keep the gains and deadzone. */
export const zeroTrims = (s: StickSets): StickSets => ({ ...s, lx: 0, ly: 0, rx: 0, ry: 0 });

/** "RESET SETS": everything back to r.050's defaults. */
export const resetSets = (): StickSets => ({ ...DEFAULT_SETS });

// ── PERSISTENCE — the fps-governor pattern ───────────────────────────────────────────────────────

let _sets: StickSets = { ...DEFAULT_SETS };
type Sub = (s: StickSets) => void;
const subs = new Set<Sub>();

export const getSets = (): StickSets => _sets;

export function setSets(next: Partial<StickSets>): StickSets {
  _sets = sanitize({ ..._sets, ...next });
  try { localStorage.setItem(SETS_KEY, JSON.stringify(_sets)); } catch { /* storage unavailable — the set still applies for this session */ }
  subs.forEach((f) => f(_sets));
  return _sets;
}

/** Read what a previous visit saved. Wrapped: a private window or a file:// copy has no storage. */
export function initSets(): StickSets {
  try {
    const raw = localStorage.getItem(SETS_KEY);
    if (raw) _sets = sanitize(JSON.parse(raw) as Partial<StickSets>);
  } catch { /* ignore — defaults stand */ }
  return _sets;
}

export function subscribeSets(f: Sub): () => void { subs.add(f); return () => { subs.delete(f); }; }

/** One line for a settings row. */
export const setsLine = (s: StickSets): string =>
  `L ×${s.l.toFixed(2)} · R ×${s.r.toFixed(2)} · dead ${s.dead.toFixed(2)} · trim L ${s.lx.toFixed(2)},${s.ly.toFixed(2)} R ${s.rx.toFixed(2)},${s.ry.toFixed(2)}`;
