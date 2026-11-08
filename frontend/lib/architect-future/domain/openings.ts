// ARCHITECT-2525 / FUTURE · domain/openings — doors and windows as real records (plan §9, §12 event vocabulary).
// NOT the empty tuple Grok's engine used (which could never hold one). An OpeningDefinition[] can actually hold openings.

export const OPENING_KINDS = ["DOOR", "WINDOW"] as const;
export type OpeningKind = (typeof OPENING_KINDS)[number];

import type { WallSide } from "./walls";

export interface OpeningDefinition {
  opening_id: string;
  space_id: string;
  kind: OpeningKind;
  side: WallSide;
  /** offset of the opening centre along the wall from the wall's SW end, µm. */
  offset_um: number;
  width_um: number;
  height_um: number;
  /** sill height for a window; 0 for a door. µm. */
  sill_um: number;
}
