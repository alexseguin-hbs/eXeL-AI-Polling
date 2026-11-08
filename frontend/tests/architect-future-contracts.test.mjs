// ARCHITECT-2525 / FUTURE · behavioural contract registry (plan §30). The red-first T-* that Phases 1–4 turn green.
// This is the EXPECTED-RED runner: each contract loads the REAL stub, reaches its call, and is PENDING because the
// implementation throws "not implemented" (a legitimate red-first — plan §30). It is NOT wired into test:ci/prebuild
// (a red prebuild would freeze production); run it with `npm run test:future-contracts`. As each phase implements a
// stub, its entry here is rewritten into a real behavioural assertion.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-contracts.test.mjs

// Phase 1 contracts (T-TRANSFORM, T-HASH, T-SERIALIZE, T-REPLAY) are now GREEN — see
// tests/architect-future-canonical.test.mjs (in test:ci). The remaining behavioural contracts stay red-first here.
// ALL behavioural contracts are now GREEN (Phases 1–4): T-TRANSFORM/T-HASH/T-SERIALIZE/T-REPLAY in
// architect-future-canonical; T-PLACEMENT/T-PROJECTION in architect-future-planning; T-MATERIAL/T-COST/T-FIREWALL in
// architect-future-economics; T-RATINGS/T-ACTOR-AUTH/T-HEALTH in architect-future-review. The expected-red runner is
// therefore empty — it stands as the record that nothing is left red-first. (T-SCHEMA/T-IMPORT-BAN are their own gates.)
const CONTRACTS = [];

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
    if (e && e.notImplemented === true) {
      red++; // red-first, for the intended reason (typed marker, not a message substring)
    } else {
      broken++; console.log(`  ✗ ${c.id}: threw for the WRONG reason — ${e && e.message}`);
    }
  }
}

console.log(`architect-future-contracts: ${CONTRACTS.length} contracts · ${red} pending (red-first) · ${green} implemented · ${broken} broken`);
// A "broken" contract (won't load / wrong-reason throw) is a real failure; pending red-first is expected at Phase 0.
if (broken > 0) process.exit(1);
