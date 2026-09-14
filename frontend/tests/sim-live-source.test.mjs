// SIM per-cube code integrity (operator 2026-09-14: "simulation of each cube … full code shown is double checked").
// The Cube-Dev-Sim workbench must show the REAL baked eXeL AI source for EVERY contract function of every cube —
// not a "source not baked in" placeholder. This gate walks the mock /sim endpoints exactly as the workbench does and
// asserts every block resolves to real code, plus locks the Cyan→Sunset→Violet easter-egg unlock sequence.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sim-live-source.test.mjs
import fs from 'node:fs';
const { handleMockRequest } = await import('../lib/mock-data.ts');
const { SIM_LIVE_SOURCE } = await import('../lib/sim-live-source.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// Backend-mirrored default block counts = each cube's real live code-unit count.
const DEF = { 1: 6, 2: 8, 3: 7, 4: 8, 5: 7, 6: 7, 7: 8, 8: 7, 9: 8 };

for (let id = 1; id <= 9; id++) {
  const liveKeys = Object.keys(SIM_LIVE_SOURCE[String(id)] ?? {});
  ok(liveKeys.length === DEF[id], `cube ${id}: ${liveKeys.length} baked live fns (expected ${DEF[id]})`);

  // 1) contract functions all exist in the baked live source
  const contract = await handleMockRequest('GET', `/sim/cube/${id}/contract?sections=${DEF[id]}`);
  const fns = contract?.io_contract?.functions ?? [];
  ok(fns.length > 0, `cube ${id}: contract exposes functions`);
  const unresolvedContract = fns.filter((f) => !(SIM_LIVE_SOURCE[String(id)] ?? {})[f]);
  ok(unresolvedContract.length === 0, `cube ${id}: every contract fn has baked source (${unresolvedContract.join(', ') || 'all resolve'})`);

  // 2) the SOURCE endpoint (what the workbench renders) resolves REAL code for every block — no placeholder
  const src = await handleMockRequest('GET', `/sim/cube/${id}/source?sections=${DEF[id]}`);
  const blocks = src?.blocks ?? [];
  ok(blocks.length > 0, `cube ${id}: source endpoint returns blocks`);
  const placeholder = blocks.filter((b) => !b.resolved || /source not baked in/.test(b.source ?? '') || !(b.source ?? '').trim());
  ok(placeholder.length === 0, `cube ${id}: no placeholder blocks (${placeholder.map((b) => b.name).join(', ') || 'all real code'})`);
  const shallow = blocks.filter((b) => b.resolved && (b.source ?? '').split('\n').length < 2);
  ok(shallow.length === 0, `cube ${id}: resolved source is real (not a one-liner stub) (${shallow.map((b) => b.name).join(', ') || 'ok'})`);
}

// Easter-egg unlock sequence is Cyan → Sunset → Violet (locks the demo entry into the Cube SIM).
const eggSrc = fs.readFileSync(new URL('../lib/easter-egg-context.tsx', import.meta.url), 'utf8');
ok(/EASTER_EGG_SEQUENCE\s*=\s*\[\s*"exel-cyan"\s*,\s*"sunset"\s*,\s*"violet"\s*\]/.test(eggSrc),
   'the easter-egg unlock stays Cyan → Sunset → Violet');

console.log(`sim-live-source: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
