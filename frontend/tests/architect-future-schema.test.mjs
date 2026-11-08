// ARCHITECT-2525 / FUTURE · T-SCHEMA (plan §30, FCRS-06/07). The locked V2 schema compiles and its constants hold.
// GREEN from Phase 0 (joins test:ci). The TYPE-LEVEL negatives live in
// lib/architect-future/contracts/schema-expectations.ts, validated by tsc / next build.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-schema.test.mjs
import { existsSync } from "node:fs";
import {
  EVIDENCE_STATES, ACTOR_KINDS, isAuthenticatedHuman, DRAFT_ACTOR,
  UM_PER_FT, CLEAR_UM, ZONE_UM, OUTER_UM, SHELL_FT, GROSS_FT2, CLEAR_FT2, DIFFERENCE_FT2,
  geometryOk, SPACE_FUNCTIONS, BASELINE_ROWS, BASELINE_TOTAL_USD, EVENT_TYPES,
} from "../lib/architect-future/index.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };

// Geometry: 12 ft outer / 10 ft clear / 1 ft zone, derived shell figures (plan §7).
ok(UM_PER_FT === 304_800, "1 ft = 304,800 µm");
ok(CLEAR_UM === 3_048_000 && ZONE_UM === 304_800, "clear 10 ft, zone 1 ft");
ok(OUTER_UM === CLEAR_UM + 2 * ZONE_UM && OUTER_UM === 3_657_600, "outer = clear + 2·zone = 12 ft");
ok(SHELL_FT === 36, `shell 36 ft (got ${SHELL_FT})`);
ok(GROSS_FT2 === 1296, `gross 1,296 ft² (got ${GROSS_FT2})`);
ok(CLEAR_FT2 === 900, `clear 900 ft² (got ${CLEAR_FT2})`);
ok(DIFFERENCE_FT2 === 396, `difference 396 ft² (got ${DIFFERENCE_FT2})`);

// A reference space satisfies the §8 invariant; a zero-thick-wall space does not.
const refSpace = {
  entity_id: "a1", entity_type: "SPACE", bay_code: "A1",
  outer_x_um: 0, outer_y_um: 0, z_um: 0,
  outer_width_um: OUTER_UM, outer_depth_um: OUTER_UM,
  clear_width_um: CLEAR_UM, clear_depth_um: CLEAR_UM, wall_zone_thickness_um: ZONE_UM,
  function: "BEDROOM", wet_class: "DRY",
};
ok(geometryOk(refSpace), "a reference 12/10/1 space passes geometryOk");
ok(!geometryOk({ ...refSpace, wall_zone_thickness_um: 0, outer_width_um: CLEAR_UM, outer_depth_um: CLEAR_UM }),
  "a zero-thickness-wall (legacy 10-ft) space FAILS geometryOk");

// Vocabularies (plan §12/§21).
ok(EVIDENCE_STATES.length === 8, `8 evidence states (got ${EVIDENCE_STATES.length})`);
ok(EVENT_TYPES.length === 22, `22 R-CORE event types (got ${EVENT_TYPES.length})`);
ok(EVENT_TYPES.includes("PROJECT_TRANSFORMED_FROM_V1") && EVENT_TYPES.includes("ASSET_PLACED"), "event vocab carries transform + asset placement");
ok(SPACE_FUNCTIONS.length === 9, "9 space functions");
ok(ACTOR_KINDS.length === 3, "3 actor kinds");

// Actor authority gate (plan §13, FCRS-01/32).
ok(isAuthenticatedHuman({ kind: "AUTHENTICATED_HUMAN", id: "u1" }), "authenticated human passes the gate");
ok(!isAuthenticatedHuman(DRAFT_ACTOR), "an unauthenticated human does NOT pass the gate");
ok(!isAuthenticatedHuman({ kind: "SYSTEM", id: "ai" }), "SYSTEM/AI does NOT pass the gate");

// Economics baseline (plan §19): ten rows, first "Site Work", sum 240k.
ok(BASELINE_ROWS.length === 10, "ten baseline rows");
ok(BASELINE_ROWS[0].name === "Site Work", 'first baseline row is "Site Work"');
ok(BASELINE_ROWS.reduce((s, r) => s + r.usd, 0) === BASELINE_TOTAL_USD && BASELINE_TOTAL_USD === 240_000, "baseline rows sum to 240,000");

// The type-level negative fixture exists (its correctness is proven by tsc/next build, not here).
ok(existsSync(new URL("../lib/architect-future/contracts/schema-expectations.ts", import.meta.url)), "type-level schema-expectations fixture present");

console.log(`architect-future-schema (T-SCHEMA): ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
