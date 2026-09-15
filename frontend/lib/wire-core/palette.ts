// THE 13 — the only colours a 2525 wireframe surface may draw (operator 2026-09-15: "Everything will be
// 13 trinity colors only"). One palette, chosen with the operator: the SPECTRUM set in lib/trinity-palette.ts
// (IR → ROYGBIV → UV → White), NOT the iconology set in lib/trinity-colors.ts — the two must never mix on a
// wireframe surface. Shading is forbidden: depth reads from perspective and overlap, never from a 14th colour,
// so there is no darkerHex() here and none may be imported (gated in tests/vector-law.test.mjs).
import { TRINITY_COLORS } from "@/lib/trinity-palette";

export { TRINITY_COLORS };
export type ColorRole = keyof typeof TRINITY_COLORS;
const ROLE_KEYS = Object.keys(TRINITY_COLORS) as ColorRole[];

/** Every hex the 13 permit, lowercased — the whitelist the gate and the validator both read. */
export const ALLOWED_HEX: ReadonlySet<string> = new Set(ROLE_KEYS.map((k) => TRINITY_COLORS[k].toLowerCase()));
export const isTrinity = (hex: string): boolean => ALLOWED_HEX.has(String(hex).trim().toLowerCase());
/** Refuses rather than substitutes: a wrong colour is a bug to fix, not a pixel to nudge. */
export function assertTrinity(hex: string, where = "wireframe"): string {
  if (!isTrinity(hex)) throw new Error(`${where}: ${hex} is not one of the 13 trinity colours`);
  return hex;
}

/**
 * SEMANTIC ROLES — U-WF-11 colour law, so a drone surface and a security surface say the same thing
 * with the same colour. red = hostile/critical only · gold(temporal) = selected/AGL · orange = user focus.
 */
export const SEMANTIC = {
  building: "blank",        // white — the built world, the quiet default
  door: "consciousness",    // cyan — a way in; the thing to be tagged
  tagged: "temporal",       // gold — selected/achieved (U-WF-11)
  tree: "ooda",             // green — living ground cover
  road: "framework",        // ocean blue — movement
  contour: "governance",    // ultraviolet — terrain, furthest back
  water: "wholeness",       // blue
  frustum: "platonic",      // emerald — what the sensor can see
  mount: "abundance",       // chartreuse — turret / airframe
  drone: "abundance",
  ray: "evolution",         // red — a shot (critical, U-WF-11)
  blocked: "human",         // infrared — a ray that cannot reach
  pending: "intelligence",  // orange — awaiting the human's approval (focus)
  hud: "blank",
  grid: "temporal",
} as const satisfies Record<string, ColorRole>;
export type SemanticRole = keyof typeof SEMANTIC;
export const semanticHex = (r: SemanticRole): string => TRINITY_COLORS[SEMANTIC[r]];
