// THE PLATFORM IDENTITIES — the deck's `units` table, as data (eXeL AI gate 1: "QUAD/VTOL/FOIL identities").
//
//   T1 TURRET · D1Q QUAD·HOVER · D1 VTOL · D1F FOIL · M99 MANTA 99-66 · M66 MINI 66-33 · ARK SAIL 33 · R2 MASS DROID
//
// Lifted from r.050 and held to it by tests/drone-platforms.test.mjs. Not a second airframe model: every
// flying platform is the ONE airframe record with a different rule about its wing —
//   D1Q  rotors only; the transition is refused by name ("a quad has no wing")
//   D1   rotors and wing, the transition on the pilot's button, as before
//   D1F  the wing is home; the round takes the transition the moment canTransition() says it is legal
// The sea, sail and droid platforms are listed and DATED, never hidden — U-WF-09, a level is never silent.
import { DRONE_DOMAIN } from "./domain.gen";

export type PlatformId = "T1" | "D1Q" | "D1" | "D1F" | "M99" | "M66" | "ARK" | "R2";
export interface Platform { id: PlatformId; label: string; kind: "turret" | "vtol" | "sub" | "ark" | "droid"; flight: "quad" | "vtol" | "foil" | null; here: boolean }

export const PLATFORMS: readonly Platform[] = DRONE_DOMAIN.platforms as readonly Platform[];
export const DEFAULT_PLATFORM: PlatformId = "D1";

export const platformOf = (id: string): Platform =>
  PLATFORMS.find((p) => p.id === id) ?? PLATFORMS.find((p) => p.id === DEFAULT_PLATFORM)!;

/** Does this platform fly at all on this arena? */
export const flies = (p: Platform): boolean => p.kind === "vtol" && p.here;
/** May it go to the wing? A quad has none. */
export const wingAllowed = (p: Platform): boolean => p.flight === "vtol" || p.flight === "foil";
/** Does it take the wing on its own as soon as the transition is legal? */
export const prefersWing = (p: Platform): boolean => p.flight === "foil";

/** The mount id and label the round hands the gimbal, so the HUD says which platform is flying. */
export const mountIdOf = (p: Platform): string => `${p.id.toLowerCase()}-01`;
