// THE GUIDED START — a ladder, not a free chooser (operator 2026-09-16: "one needs to start by selecting
// turret and getting auto-assigned the level-1 challenge"). A first-timer lands on the TURRET at CH0
// TRAINING; the flying modes unlock as the earlier stages are played. This is the logic layer only — every
// user-facing word lives in the component via t(); nothing here is English, so the i18n gate never has to
// see this file.
//
// Persistence mirrors components/security-2525/fps-governor.ts and lib/2525-core/stick-sets.ts: a
// localStorage key, read-through with try/catch, written on advance. A private/blocked store degrades to a
// first visit, never to a crash.
//
// FORWARD ONLY. A stage unlocks the next once it has been PLAYED to at least one tagged target; it never
// locks back. And a crew JOINER (`?crew=`) is never locked out of the mode they were invited into — a guest
// arriving into a 2-HI drone does not have to grind the turret first.

/** The stages, in the operator's order: stationary → targets → flying → the 2-HI pair. */
export const STAGE_MODES = ["turrets", "capital", "drone", "multi"] as const;
export type StageMode = (typeof STAGE_MODES)[number];
export const STAGE_KEY = "drone2525.progression";
export const LAST_STAGE = STAGE_MODES.length - 1;

export interface Progression {
  /** Highest unlocked stage index, 0..LAST_STAGE. */
  reached: number;
  /** True only when nothing was stored yet — the trainee's very first arrival. */
  firstVisit: boolean;
}

export const initialProgression = (): Progression => ({ reached: 0, firstVisit: true });

/** Where a mode sits on the ladder, or -1 if it is not a staged mode. */
export const stageIndex = (mode: string): number => STAGE_MODES.indexOf(mode as StageMode);

/**
 * May this mode be entered now? The turret (index 0) is always open; a later mode opens once the ladder has
 * reached it. A crew joiner is always admitted — they were invited, not promoted.
 */
export function unlocked(prog: Progression, mode: string, isJoiner = false): boolean {
  if (isJoiner) return true;
  const i = stageIndex(mode);
  return i >= 0 && i <= prog.reached;
}

/**
 * Play ended. If it was the current frontier mode and at least one target was tagged, the next stage opens.
 * Never regresses, never skips, never passes LAST_STAGE. Any other mode (a replay of an earlier stage, or a
 * joiner's mode) leaves the ladder where it was.
 */
export function advance(prog: Progression, res: { mode: string; tagged: number }): Progression {
  const i = stageIndex(res.mode);
  if (i === prog.reached && res.tagged >= 1 && prog.reached < LAST_STAGE) {
    return { reached: prog.reached + 1, firstVisit: false };
  }
  return prog;
}

/** A first-timer starts on CH0 TRAINING; everyone after that on CH1. */
export const startingChallenge = (prog: Progression): 0 | 1 => (prog.firstVisit ? 0 : 1);

/** Everyone starts on the turret — the operator's rule. */
export const startingMode = (): StageMode => "turrets";

// ── PERSISTENCE ────────────────────────────────────────────────────────────────────────────────

export function loadProgression(): Progression {
  try {
    if (typeof localStorage === "undefined") return initialProgression();
    const raw = localStorage.getItem(STAGE_KEY);
    if (!raw) return initialProgression();
    const p = JSON.parse(raw) as { reached?: unknown };
    const n = Number(p?.reached);
    const reached = Number.isFinite(n) ? Math.max(0, Math.min(LAST_STAGE, Math.round(n))) : 0;
    return { reached, firstVisit: false };            // something was stored → not a first visit
  } catch {
    return initialProgression();
  }
}

export function saveProgression(p: Progression): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STAGE_KEY, JSON.stringify({ reached: p.reached }));
  } catch {
    /* private mode / blocked store — a guided start is a convenience, never a requirement */
  }
}
