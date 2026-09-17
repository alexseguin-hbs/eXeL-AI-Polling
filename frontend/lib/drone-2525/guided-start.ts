// GUIDED START — the glue between the r.066 intro's choice and the command shell, as pure logic so the shell
// stays small and this stays testable. The intro offers a CRAFT and a RANGE; this resolves them to the
// mode/platform/challenge the round runs — CLAMPED to whatever the ladder has unlocked, so a first-timer
// lands on the turret at CH0 no matter what they tapped.
import { unlocked, startingMode, type Progression } from "./progression";
import type { PlatformId } from "./platform";

export type CraftId = "turret" | "quad" | "vtol";
export interface BeginChoice { craft: CraftId; challenge: number }

/** The three craft the on-ramp offers on the Capitol lawn, and where each lands. */
export const CRAFT_IDS: readonly CraftId[] = ["turret", "quad", "vtol"];
export const CRAFT_MAP: Record<CraftId, { mode: string; platform: PlatformId }> = {
  turret: { mode: "turrets", platform: "T1" },
  quad: { mode: "drone", platform: "D1Q" },
  vtol: { mode: "drone", platform: "D1" },
};

/** BEGIN REHEARSAL, resolved: the craft's mode if the ladder allows it, else the turret; the range as-is. */
export function resolveBegin(prog: Progression, isJoiner: boolean, c: BeginChoice): { mode: string; platform: PlatformId; challenge: number } {
  const sel = CRAFT_MAP[c.craft] ?? CRAFT_MAP.turret;
  const allowed = unlocked(prog, sel.mode, isJoiner);
  return {
    mode: allowed ? sel.mode : startingMode(),
    platform: allowed ? sel.platform : "T1",
    challenge: c.challenge,
  };
}

// The intro shows once, on a true first visit. A tiny flag beside the ladder marks it seen.
export const INTRO_SEEN_KEY = "drone2525.introSeen";
export const introSeen = (): boolean => { try { return typeof localStorage !== "undefined" && localStorage.getItem(INTRO_SEEN_KEY) === "1"; } catch { return false; } };
export const markIntroSeen = (): void => { try { localStorage?.setItem(INTRO_SEEN_KEY, "1"); } catch { /* ignore */ } };
