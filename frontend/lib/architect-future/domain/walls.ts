// ARCHITECT-2525 / FUTURE · domain/walls — wall assemblies, modelled apart from the reserved service zone (plan §8).
// The 1-ft zone is NOT a claim that the structural wall is 12 inches thick; the actual assembly is its own record.

export const WALL_SIDES = ["NORTH", "EAST", "SOUTH", "WEST"] as const;
export type WallSide = (typeof WALL_SIDES)[number];

export const WALL_METHODS = ["FRAME", "PRINT", "OTHER"] as const;
export type WallMethod = (typeof WALL_METHODS)[number];

/** Evidence narrower than the general vocabulary — a wall assembly is only ever these four states (plan §8). */
export const WALL_EVIDENCE = ["ASSUMED", "REFERENCE", "DERIVED", "QUALIFIED"] as const;
export type WallEvidence = (typeof WALL_EVIDENCE)[number];

export interface WallAssembly {
  wall_id: string;
  space_id: string;
  side: WallSide;
  method: WallMethod;
  /** the real structural thickness, when known — distinct from the reserved zone; optional until measured. */
  actual_assembly_thickness_um?: number;
  evidence_state: WallEvidence;
}
