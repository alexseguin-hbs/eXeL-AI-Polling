// SPECS / ARCHITECT-2525 §02 / §IX — THE ONE auditable nine-space seed fixture. Declarative data only;
// NOT constructed inline in useState/useEffect/render/component constants. The nine entity_ids (and the
// Project/Site/Building/Storey ids) are PINNED UUIDv7 LITERALS so the R0 project_hash is reproducible
// across runs and from a fresh checkout (§11, Thor: buildProjectFromSeed must mint no id, so no Date.now
// or randomness enters the hash path). The R0 snapshot is GENERATED from this seed by the production
// Runtime constructor (runtime.ts) — never hand-written.
//
// Datum [0,0,0] at the SW corner of C1 at R0 (§05); +X East, +Y North, +Z Up. Each Space is
// 3,048,000 µm × 3,048,000 µm (10 ft × 10 ft) = 100 ft²; nine = 900 ft² exactly (§IX). Storey height
// 3,048,000 µm ASSUMED. Wet: A2/B2/C2; one BATH (A2).

import { UM_PER_10FT } from "../canonical/units";
import type { SpaceFunction, WetClass } from "../canonical/types";

export interface TinyHomeSeedSpace {
  entity_id: string;
  bay_code: string;
  legacy_slug: string;
  x_um: number;
  y_um: number;
  z_um: number;
  width_um: number;
  depth_um: number;
  function: SpaceFunction;
  wet_class: WetClass;
}

export interface TinyHomeSeed {
  actor_id: string;        // §02 — template:TINY_HOME
  schema_version: number;
  storey_height_um: number;
  project: { entity_id: string; name: string };
  site: { entity_id: string; name: string };
  building: { entity_id: string; name: string };
  storey: { entity_id: string; name: string };
  spaces: TinyHomeSeedSpace[];
}

const E = UM_PER_10FT; // one Space edge, 3,048,000 µm

// bay → (x_um, y_um): column C (y=0) · B (y=E) · A (y=2E); x: _1=0, _2=E, _3=2E. Datum at C1 SW corner.
export const TINY_HOME_V1: TinyHomeSeed = {
  actor_id: "template:TINY_HOME",
  schema_version: 1,
  storey_height_um: E,
  project: { entity_id: "0192f000-0000-7000-8000-000000000001", name: "Tiny Home v1" },
  site: { entity_id: "0192f000-0000-7000-8000-000000000002", name: "Tiny Home Lot" },
  building: { entity_id: "0192f000-0000-7000-8000-000000000003", name: "Tiny Home" },
  storey: { entity_id: "0192f000-0000-7000-8000-000000000004", name: "Ground Floor" },
  spaces: [
    { entity_id: "0192f000-0000-7000-8000-0000000000c1", bay_code: "C1", legacy_slug: "office",  x_um: 0,     y_um: 0,     z_um: 0, width_um: E, depth_um: E, function: "OFFICE",  wet_class: "DRY" },
    { entity_id: "0192f000-0000-7000-8000-0000000000c2", bay_code: "C2", legacy_slug: "utility", x_um: E,     y_um: 0,     z_um: 0, width_um: E, depth_um: E, function: "UTILITY", wet_class: "WET" },
    { entity_id: "0192f000-0000-7000-8000-0000000000c3", bay_code: "C3", legacy_slug: "entry",   x_um: 2 * E, y_um: 0,     z_um: 0, width_um: E, depth_um: E, function: "ENTRY",   wet_class: "DRY" },
    { entity_id: "0192f000-0000-7000-8000-0000000000b1", bay_code: "B1", legacy_slug: "living",  x_um: 0,     y_um: E,     z_um: 0, width_um: E, depth_um: E, function: "LIVING",  wet_class: "DRY" },
    { entity_id: "0192f000-0000-7000-8000-0000000000b2", bay_code: "B2", legacy_slug: "kitchen", x_um: E,     y_um: E,     z_um: 0, width_um: E, depth_um: E, function: "KITCHEN", wet_class: "WET" },
    { entity_id: "0192f000-0000-7000-8000-0000000000b3", bay_code: "B3", legacy_slug: "dining",  x_um: 2 * E, y_um: E,     z_um: 0, width_um: E, depth_um: E, function: "DINING",  wet_class: "DRY" },
    { entity_id: "0192f000-0000-7000-8000-0000000000a1", bay_code: "A1", legacy_slug: "bedroom", x_um: 0,     y_um: 2 * E, z_um: 0, width_um: E, depth_um: E, function: "BEDROOM", wet_class: "DRY" },
    { entity_id: "0192f000-0000-7000-8000-0000000000a2", bay_code: "A2", legacy_slug: "bath",    x_um: E,     y_um: 2 * E, z_um: 0, width_um: E, depth_um: E, function: "BATH",    wet_class: "WET" },
    { entity_id: "0192f000-0000-7000-8000-0000000000a3", bay_code: "A3", legacy_slug: "closet",  x_um: 2 * E, y_um: 2 * E, z_um: 0, width_um: E, depth_um: E, function: "CLOSET",  wet_class: "DRY" },
  ],
};

/** The nine pinned Space ids, in seed order — the exact literals the schema/seed gates assert (Thor). */
export const SEED_SPACE_IDS = TINY_HOME_V1.spaces.map((s) => s.entity_id);
