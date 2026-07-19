/**
 * SECURITY-2525 · ASSET KINEMATICS — which movement fields each asset class captures (#25).
 * =================================================================================================
 * Operator: aerial assets are set up with HEADING · SPEED · ALTITUDE; ground assets with COURSE · SPEED only
 * (no altitude — they ride the terrain). Aerial = the flying effectors (X-BAT swarm, AUTO-FOIL); everything else
 * (Avenger, Patriot, THAAD, Sentinel — the air-defence systems that carry a coverage ring) is ground.
 * Pure + string-keyed (no JSX/type import) so it is unit-tested by pure-node and reused by the inspector.
 */
export const AERIAL_ASSETS = ["xbat", "autofoil"] as const;

export const isAerialAsset = (kind: string): boolean => (AERIAL_ASSETS as readonly string[]).includes(kind);

export type KinematicField = "heading" | "course" | "speed" | "altitude";

/** The movement fields (and aerial flag) for an asset kind. Aerial → hdg·spd·alt; ground → course·spd. */
export function assetKinematics(kind: string): { aerial: boolean; fields: KinematicField[] } {
  return isAerialAsset(kind)
    ? { aerial: true, fields: ["heading", "speed", "altitude"] }
    : { aerial: false, fields: ["course", "speed"] };
}
