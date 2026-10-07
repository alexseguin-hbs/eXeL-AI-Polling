// Run through `npm run test:cube-sim-live` (it adds the ts-alias loader); plain `node --test` cannot resolve "@/".
// SIM ↔ LIVE parity for Cubes 1-10 behind the easter-egg unlock (operator 2026-10-07: "review Cube 1-10 behind
// easter code unlock; these need to be working and should be similar to understand if process works as aLive.
// So basically test SIM / LIVE FOR EACH CUBE").
//
// SIM  = the backendless workbench (NEXT_PUBLIC_MOCK_MODE default) — lib/mock-data.ts handleSimMock.
// LIVE = the real backend — backend/app/cubes/cube10_simulation/{router,challenge_loop,agents}.py.
//
// The LIVE shapes are NOT restated here by hand: they are read out of the backend source (the dict literal each
// endpoint returns), so a backend change that the SIM does not follow turns this red. Every cube 1-9 must give the
// SAME sections, the SAME fields, the SAME baked code as the backend file, and the SAME deterministic council
// verdicts; Cube 10 (the simulator itself) is refused by both exactly as LIVE refuses it.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/cube-sim-live.test.mjs
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const { handleMockRequest } = await import('../lib/mock-data.ts');
const { SIM_LIVE_SOURCE, SIM_LIVE_IO } = await import('../lib/sim-live-source.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const BE = new URL('../../backend/', import.meta.url);
const py = (p) => fs.readFileSync(new URL(p, BE), 'utf8');
const ROUTER = py('app/cubes/cube10_simulation/router.py');
const LOOP = py('app/cubes/cube10_simulation/challenge_loop.py');
const SAVED = py('app/cubes/cube10_simulation/saved_use_cases.py');
const AGENTS = py('app/cubes/cube10_simulation/agents.py');

/** Body of a top-level Python function (up to the next top-level def/class/decorator). */
function pyFn(src, name) {
  const i = src.search(new RegExp(`^(async )?def ${name}\\(`, 'm'));
  if (i < 0) return '';
  const rest = src.slice(i + 1);
  const j = rest.search(/^(async def |def |class |@)/m);
  return j < 0 ? src.slice(i) : src.slice(i, i + 1 + j);
}
/** Top-level keys of the LAST (or `which`-th) `return {…}` dict literal in a Python function body. */
function returnKeys(body, which = 'last', open = /return \{/g) {
  const starts = [...body.matchAll(open)].map((m) => m.index + m[0].length - 1);
  const at = which === 'last' ? starts[starts.length - 1] : starts[which];
  if (at === undefined) return [];
  let depth = 0, k = at; const keys = [];
  for (; k < body.length; k++) {
    const ch = body[k];
    if ('{[('.includes(ch)) depth++;
    else if ('}])'.includes(ch)) { depth--; if (depth === 0) break; }
    else if (depth === 1 && ch === '"') {
      const m = body.slice(k).match(/^"([A-Za-z_0-9]+)"\s*:/);
      if (m) { keys.push(m[1]); k += m[0].length - 1; }
      else { const close = body.indexOf('"', k + 1); k = close; }
    }
  }
  return keys;
}
const sameSet = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
const keysOf = (o) => Object.keys(o ?? {});

// ── LIVE shapes, read from the backend source ──────────────────────────────────────────────────────────────
const LIVE = {
  baseline: returnKeys(pyFn(LOOP, '_harness_to_metrics')),
  candidate: returnKeys(pyFn(LOOP, 'normalize_candidate')).filter((k) => k !== 'ssses'),   // ssses only when supplied
  optimization: returnKeys(pyFn(LOOP, 'compute_optimization')),
  checkIn: returnKeys(pyFn(ROUTER, 'sim_cube_check_in')),
  submit: returnKeys(pyFn(ROUTER, 'sim_cube_submit')),
  metrics: returnKeys(pyFn(ROUTER, 'sim_cube_section_metrics')),
  council: returnKeys(pyFn(AGENTS, 'ai_council')),
  lens: returnKeys(pyFn(AGENTS, 'council_review')),
  replay: returnKeys(pyFn(SAVED, 'replay_against_dataset').split('elif cube_id == 2')[1] ?? '', 0, /result = \{/g),
};
for (const [k, v] of Object.entries(LIVE)) ok(v.length >= 3, `LIVE shape "${k}" was read from the backend source (${v.join(',') || 'NOTHING — parser drift'})`);
const WIN = Number((LOOP.match(/^WIN_THRESHOLD\s*=\s*([0-9.]+)/m) ?? [])[1]);
ok(WIN > 0, `LIVE WIN_THRESHOLD read from challenge_loop.py (${WIN})`);
const NAMES = Object.fromEntries([...(ROUTER.match(/_CUBE_NAMES = \{([\s\S]*?)\}/) ?? ['', ''])[1].matchAll(/(\d+):\s*"([^"]+)"/g)].map((m) => [Number(m[1]), m[2]]));
ok(Object.keys(NAMES).length === 9, 'LIVE _CUBE_NAMES has the 9 Level-1 cubes');
ok(/for i in range\(1, 10\)/.test(pyFn(ROUTER, 'sim_list_cubes')), 'LIVE /sim/cubes lists exactly Cubes 1-9');

// Mirror of backend agents._det_pct + council_review — an independent oracle (node:crypto, not the SIM's sha).
const detPct = (seed, lo, hi) => lo + Number(BigInt('0x' + createHash('sha256').update(seed).digest('hex')) % BigInt(hi - lo + 1));
const LENSES = [...(AGENTS.match(/COUNCIL_LENSES = \(([\s\S]*?)\)/) ?? ['', ''])[1].matchAll(/"(\w+)"/g)].map((m) => m[1]);
ok(LENSES.length === 12 && LENSES.at(-1) === 'Thor', 'the 12 council lenses read from agents.py (Thor = veto)');

// ── /sim/cubes ─────────────────────────────────────────────────────────────────────────────────────────────
const list = await handleMockRequest('GET', '/sim/cubes');
ok(sameSet(list.cubes.map((c) => c.cube_id), [1, 2, 3, 4, 5, 6, 7, 8, 9]), 'SIM lists exactly Cubes 1-9, like LIVE');
for (const c of list.cubes) ok(c.name === NAMES[c.cube_id], `cube ${c.cube_id}: SIM name "${c.name}" === LIVE "${NAMES[c.cube_id]}"`);

for (const c of list.cubes) {
  const id = c.cube_id, n = c.default_sections;
  const fnsAll = Object.keys(SIM_LIVE_SOURCE[String(id)] ?? {});
  ok(n === fnsAll.length, `cube ${id}: default_sections ${n} === its baked LIVE function count ${fnsAll.length}`);

  // contract — the inputs · functions · outputs + the LIVE-code blocks
  const ct = await handleMockRequest('GET', `/sim/cube/${id}/contract?sections=${n}`);
  for (const f of ['inputs', 'functions', 'outputs']) ok((ct.io_contract?.[f] ?? []).length > 0, `cube ${id}: contract ${f} non-empty`);
  ok(ct.sections?.length === n, `cube ${id}: ${ct.sections?.length} blocks === ${n}`);
  // Input · Output = LIVE's (baked from router.sim_cube_contract), not a SIM-only vocabulary.
  const lio = SIM_LIVE_IO?.[String(id)];
  ok(!!lio && JSON.stringify(ct.io_contract.inputs) === JSON.stringify(lio.inputs) && JSON.stringify(ct.io_contract.outputs) === JSON.stringify(lio.outputs),
    `cube ${id}: SIM Input/Output columns === LIVE contract io`);
  ok(sameSet(Object.keys(lio?.fn_io ?? {}), fnsAll), `cube ${id}: LIVE io baked for every LIVE function`);
  for (const s of ct.sections ?? []) {
    ok(sameSet(keysOf(s), ['key', 'code', 'label', 'functions', 'highlight', 'io']), `cube ${id} ${s.key}: section has the LIVE fields`);
    ok(s.functions.length > 0 && s.functions.every((f) => fnsAll.includes(f)), `cube ${id} ${s.key}: block functions are real baked LIVE functions`);
    ok(sameSet(keysOf(s.io), ['inputs', 'functions', 'outputs']) && s.io.inputs.length && s.io.outputs.length, `cube ${id} ${s.key}: block io present`);
    ok((s.highlight?.['9'] ?? []).length > 0, `cube ${id} ${s.key}: block lights voxels`);
    // router._enrich_sections_io: union of the block's functions' registry io, else the whole-cube io
    const ui = [...new Set(s.functions.flatMap((f) => lio?.fn_io?.[f]?.inputs ?? []))].sort();
    const uo = [...new Set(s.functions.flatMap((f) => lio?.fn_io?.[f]?.outputs ?? []))].sort();
    ok(JSON.stringify(s.io.inputs) === JSON.stringify(ui.length ? ui : lio?.inputs) && JSON.stringify(s.io.outputs) === JSON.stringify(uo.length ? uo : lio?.outputs),
      `cube ${id} ${s.key}: block Input/Output folded like LIVE _enrich_sections_io`);
  }
  const k = ct.sections[0].key;

  // source — the code panel: real, and IDENTICAL to the backend file it claims to come from
  const src = await handleMockRequest('GET', `/sim/cube/${id}/source?sections=${n}`);
  for (const b of src.blocks ?? []) {
    ok(b.resolved && b.source && !/source not baked in/.test(b.source), `cube ${id} ${b.name}: real code, no placeholder`);
    let file = '';
    try { file = py(b.path); } catch { /* missing file → fails below */ }
    ok(file.includes(b.source), `cube ${id} ${b.name}: SIM code === LIVE code in backend/${b.path} (stale bake? run export_live_source)`);
  }

  // section-metrics — the SSSES card
  const sm = await handleMockRequest('GET', `/sim/cube/${id}/section-metrics?section=${k}&sections=${n}`);
  ok(sameSet(keysOf(sm), LIVE.metrics), `cube ${id}: section-metrics fields === LIVE (${keysOf(sm).join(',')})`);
  for (const p of ['security', 'stability', 'scalability', 'efficiency', 'succinctness']) ok(Number.isFinite(sm.ssses?.[p]), `cube ${id}: SSSES ${p} scored`);
  const pyLoc = sm.functions.reduce((a, f) => a + SIM_LIVE_SOURCE[String(id)][f].source.replace(/\n$/, '').split('\n').length, 0);
  ok(sm.loc === pyLoc, `cube ${id}: LOC ${sm.loc} counted like Python splitlines (${pyLoc})`);

  // ai-council — the ② Semi-Auto preview: byte-identical to LIVE's deterministic scaffold
  const co = await handleMockRequest('GET', `/sim/cube/${id}/ai-council?section=${k}&sections=${n}`);
  ok(sameSet(keysOf(co), LIVE.council), `cube ${id}: ai-council fields === LIVE`);
  const fn0 = ct.sections[0].functions[0];
  for (const v of co.variants ?? []) {
    ok(sameSet(keysOf(v.council), LIVE.lens), `cube ${id} ${v.id}: council verdict fields === LIVE`);
    ok(v.projected_efficiency_pct === detPct(`${id}:${k}:${v.strategy}:${fn0}`, 6, 22), `cube ${id} ${v.id}: projected % === LIVE`);
    const votes = Object.fromEntries(LENSES.map((l) => [l, detPct(`${id}:${v.id}:${l}`, 0, 100) >= (l === 'Thor' ? 62 : 40)]));
    const approvals = Object.values(votes).filter(Boolean).length;
    ok(v.council.safe === votes.Thor && v.council.approvals === approvals, `cube ${id} ${v.id}: SAFE/approvals === LIVE`);
    ok(v.council.recommended === (votes.Thor && approvals >= Math.floor((2 * 12 + 2) / 3) && v.projected_efficiency_pct >= 10), `cube ${id} ${v.id}: RECOMMENDED === LIVE`);
  }

  // check-in → submit — the LIVE (baseline) vs YOUR VERSION (candidate) columns + verdict
  const ci = await handleMockRequest('POST', `/sim/cube/${id}/check-in`, { section: k, level: 9 });
  ok(sameSet(keysOf(ci), LIVE.checkIn), `cube ${id}: check-in fields === LIVE`);
  const sub = await handleMockRequest('POST', `/sim/cube/${id}/submit`, { section: k, level: 9, tier: 'manual', run_id: ci.run_id });
  ok(sameSet(keysOf(sub), LIVE.submit), `cube ${id}: submit fields === LIVE (${keysOf(sub).join(',')})`);
  ok(sameSet(keysOf(sub.baseline), LIVE.baseline), `cube ${id}: LIVE (baseline) column fields === LIVE (${keysOf(sub.baseline).join(',')})`);
  ok(sameSet(keysOf(sub.candidate), LIVE.candidate), `cube ${id}: YOUR VERSION column fields === LIVE (${keysOf(sub.candidate).join(',')})`);
  ok(sameSet(keysOf(sub.optimization), LIVE.optimization) && sub.optimization.threshold_pct === Math.round(WIN * 1000) / 10, `cube ${id}: optimization fields + ${WIN * 100}% bar === LIVE`);
  const imp = (sub.baseline.duration_ms - sub.candidate.duration_ms) / sub.baseline.duration_ms;
  ok(sub.optimization.win === (sub.verdict.overall_passed && imp >= WIN), `cube ${id}: WIN follows LIVE's own rule (no win the backend would reject)`);
  ok(sub.verdict.faster === (sub.candidate.duration_ms < sub.baseline.duration_ms), `cube ${id}: "faster" agrees with the two durations`);
  ok(sameSet(keysOf(sub.replay), LIVE.replay), `cube ${id}: replay fields === LIVE replay_against_dataset`);
  ok(sub.decision.decision === 'hold', `cube ${id}: Manual tier HOLDs until a human approves`);
  const appr = await handleMockRequest('POST', `/sim/cube/${id}/submit`, { section: k, level: 9, tier: 'manual', human_approved: true, run_id: ci.run_id });
  ok(appr.decision.decision === 'swap', `cube ${id}: human approval → SWAP, as LIVE`);
}

// ── Cube 10 — the simulator itself is not a workbench cube; SIM refuses it exactly like LIVE ────────────────
const r10 = await handleMockRequest('GET', '/sim/cube/10/contract?sections=4');
ok(r10?.__status === 400, 'cube 10: SIM contract refused 400 like LIVE ("cube_id must be 1-9"), not a fabricated empty cube');
const s10 = await handleMockRequest('POST', '/sim/cube/10/submit', { section: 'B1' });
ok(s10?.__status === 404, 'cube 10: SIM submit refused 404 like LIVE (no harness)');

// ── The UI reads the LIVE shape, and the backend accepts the keys the UI sends ──────────────────────────────
const UI = fs.readFileSync(new URL('../components/cube-dev-sim.tsx', import.meta.url), 'utf8');
ok(/typeof v === "number" && k !== "cube_id"/.test(UI), 'metricCol renders LIVE\'s flat baseline/candidate fields (not only a nested `metrics`)');
ok(/\/sim\/cube\/\$\{id\}\/contract\?sections=\$\{count\}/.test(UI) && /default_sections/.test(UI), 'the workbench opens each cube at its LIVE B-keyed blocks');
const H2 = py('app/cubes/cube10_simulation/harness_cube2.py');
ok(/"metrics":/.test(pyFn(H2, 'run_harness_cube2')), 'LIVE Cube 2 harness reports metrics, so its LIVE (baseline) column is not 0 · 0 · 0');
for (let c = 1; c <= 9; c++) ok(/metrics/.test(py(`app/cubes/cube10_simulation/harness_cube${c}.py`)), `LIVE Cube ${c} harness emits metrics for the baseline column`);
ok(/is_block_key/.test(H2) && /not is_block_key/.test(H2), 'LIVE Cube 2 replay accepts the B1..BN block keys the workbench sends (was a 500)');
const EGG = fs.readFileSync(new URL('../lib/easter-egg-context.tsx', import.meta.url), 'utf8');
ok(/VERIFY_ACCESS_ENDPOINT = `\$\{API_BASE_URL\}\/verify-access`/.test(EGG), 'LIVE Cube 10 access code goes to the BACKEND (API_BASE_URL), not the static host (was a 404)');
ok(/responseCount: accepted/.test(fs.readFileSync(new URL('../lib/sim-console-driver.ts', import.meta.url), 'utf8')), 'Cube 10 console reports the responses the backend ACCEPTED, never the number sent');
ok(/build_io/.test(py('app/cubes/cube10_simulation/export_live_source.py')), 'the LIVE io is baked by the same export_live_source run as the code');
ok(/if \(!_SIM_CUBES\[id\]\)/.test(fs.readFileSync(new URL('../lib/mock-data.ts', import.meta.url), 'utf8')), 'SIM refuses unknown cubes instead of inventing one');

console.log(`cube-sim-live: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
