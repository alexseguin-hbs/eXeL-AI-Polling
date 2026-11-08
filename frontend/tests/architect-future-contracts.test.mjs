// ARCHITECT-2525 / FUTURE · behavioural contract registry (plan §30). The red-first T-* that Phases 1–4 turn green.
// This is the EXPECTED-RED runner: each contract loads the REAL stub, reaches its call, and is PENDING because the
// implementation throws "not implemented" (a legitimate red-first — plan §30). It is NOT wired into test:ci/prebuild
// (a red prebuild would freeze production); run it with `npm run test:future-contracts`. As each phase implements a
// stub, its entry here is rewritten into a real behavioural assertion.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-contracts.test.mjs

const CONTRACTS = [
  { id: "T-TRANSFORM", phase: 1, mod: "../lib/architect-future/transformation/reference-v1-to-v2.ts", fn: "transformV1toV2", args: [null, "REFERENCE_3X3_12_10_1", { kind: "SYSTEM", id: "s" }, "2026-01-01"] },
  { id: "T-HASH",      phase: 1, mod: "../lib/architect-future/serialization/hash-v2.ts", fn: "hashV2", args: [null] },
  { id: "T-SERIALIZE", phase: 1, mod: "../lib/architect-future/serialization/serialize-v2.ts", fn: "serializeV2", args: [null] },
  { id: "T-REPLAY",    phase: 1, mod: "../lib/architect-future/rcore/replay.ts", fn: "replay", args: [[]] },
  { id: "T-PLACEMENT", phase: 2, mod: "../lib/architect-future/state/placement-machine.ts", fn: "placeArmed", args: [null, { armed_asset_id: "sofa" }, "b1", { x: 0, y: 0, z: 0 }, 0, { kind: "SYSTEM", id: "s" }] },
  { id: "T-PROJECTION", phase: 2, mod: "../lib/architect-future/selectors/geometry.ts", fn: "planProjection", args: [null] },
  { id: "T-MATERIAL",  phase: 3, mod: "../lib/architect-future/simulation/materials.ts", fn: "materialTakeoff", args: [null] },
  { id: "T-COST",      phase: 3, mod: "../lib/architect-future/simulation/costs.ts", fn: "baselineEstimate", args: [] },
  { id: "T-FIREWALL",  phase: 3, mod: "../lib/architect-future/simulation/costs.ts", fn: "applyJurisdiction", args: [null, "us-tx-austin"] },
  { id: "T-RATINGS",   phase: 4, mod: "../lib/architect-future/selectors/ratings.ts", fn: "ratingsView", args: [[], [], []] },
  { id: "T-ACTOR-AUTH", phase: 4, mod: "../lib/architect-future/state/authority-machine.ts", fn: "approve", args: [null, { kind: "SYSTEM", id: "s" }] },
  { id: "T-HEALTH",    phase: 4, mod: "../lib/architect-future/selectors/health.ts", fn: "projectHealth", args: [null] },
];

let red = 0, green = 0, broken = 0;
for (const c of CONTRACTS) {
  let mod;
  try { mod = await import(c.mod); }
  catch (e) { broken++; console.log(`  ✗ ${c.id}: module did not load (${e.message})`); continue; }
  const fn = mod[c.fn];
  if (typeof fn !== "function") { broken++; console.log(`  ✗ ${c.id}: ${c.fn} is not wired`); continue; }
  try {
    fn(...c.args);
    green++; // implemented (did not throw) — a later phase has turned this contract green
    console.log(`  ✓ ${c.id}: implemented (Phase ${c.phase})`);
  } catch (e) {
    if (String(e.message).includes("not implemented")) {
      red++; // red-first, for the intended reason
    } else {
      broken++; console.log(`  ✗ ${c.id}: threw for the WRONG reason — ${e.message}`);
    }
  }
}

console.log(`architect-future-contracts: ${CONTRACTS.length} contracts · ${red} pending (red-first) · ${green} implemented · ${broken} broken`);
// A "broken" contract (won't load / wrong-reason throw) is a real failure; pending red-first is expected at Phase 0.
if (broken > 0) process.exit(1);
