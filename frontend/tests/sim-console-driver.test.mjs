// WS-G driver: create → inject → theme → rank end-to-end through the REAL api layer, self-contained
// (MOCK_MODE default). Proves the console runs offline deterministically with no backend: injected
// responses become grounded Theme01×Theme02 results and a simulated ranking round yields priorities.
// Kept small (12 responses / 5 voters) — the mock api adds a 200-500ms delay per call.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sim-console-driver.test.mjs
const { runSimConsole, SIM_MOCK_MODE } = await import('../lib/sim-console-driver.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

ok(SIM_MOCK_MODE === true, 'runs self-contained in the test env (MOCK_MODE default)');

const Q = 'How should we govern autonomous AI at scale?';
const phases = [];
const res = await runSimConsole({ question: Q, count: 12, voters: 5, seed: 'drv', onProgress: (f, p) => phases.push([f, p]) });

// session + injection
ok(!!res.sessionId, 'a session was created');
ok(res.mode === 'self-contained', `mode reported self-contained (got ${res.mode})`);
ok(res.responseCount === 12, `injected the requested count (got ${res.responseCount})`);

// theming produced real grouped results
ok(res.themes && res.themes.totalResponses === 12, `themes cover all injected responses (got ${res.themes?.totalResponses})`);
const labels = ['Risk & Concerns', 'Supporting Comments', 'Neutral Comments'];
const present = labels.filter((l) => res.themes.theme1[l] && !res.themes.theme1[l].isEmpty);
ok(present.length >= 1, `at least one Theme01 category populated (got ${present.length})`);
ok(present.some((l) => res.themes.theme2[l].level9.some((t) => !t.isEmpty)), 'a Theme02 3/6/9 fan-out is populated');
ok(present.every((l) => res.themes.theme1[l].summary33), 'populated categories carry a 33-word summary');

// ranking round produced priorities
ok(Array.isArray(res.ranking) && res.ranking.length >= 1, `ranking round produced priorities (got ${res.ranking.length})`);
ok(res.ranking.every((r, i) => r.rank === i + 1), 'ranking rows are ranked 1..N in order');
ok(res.ranking.every((r) => r.label && typeof r.score === 'number'), 'each ranked row has a label + numeric score');
ok(res.winner != null, `a winner priority was selected (${res.winner})`);

// progress reached completion
ok(phases.length > 0 && phases[phases.length - 1][0] === 1, 'progress reached 1.0 (Complete)');

// determinism: same params → same themes + same ranked order (self-contained)
const res2 = await runSimConsole({ question: Q, count: 12, voters: 5, seed: 'drv' });
ok(JSON.stringify(res.ranking.map((r) => r.theme_id)) === JSON.stringify(res2.ranking.map((r) => r.theme_id)), 'ranked order is deterministic for a fixed seed');

// Christo (AsM round 1): the vote is the Risk & Concerns Theme02 at level 9, and a clean run records no errors.
ok(res.ranked && res.ranked.kind === 'theme02' && res.ranked.category === 'Risk & Concerns' && res.ranked.level === '9',
  `ranking round is labelled as the Risk & Concerns Theme02 (9) priorities (got ${JSON.stringify(res.ranked)})`);
ok(Array.isArray(res.errors) && res.errors.length === 0, `a clean run records no stage errors (got ${JSON.stringify(res.errors)})`);
ok(res.summarized === null, 'self-contained run reports summarized = null (LIVE only)');
ok(typeof res.replayHash === 'string' && /^[0-9a-f]{64}$/.test(res.replayHash), 'replay hash is a SHA-256 hex (backend _compute_replay_hash shape)');
ok(res.replayHash === res2.replayHash, 'replay hash is stable for a fixed console seed (the seed pins the tie-break and the hash)');

// A failed stage is recorded with its name + status/detail — never swallowed (a failed run must never look clean).
const { api } = await import('../lib/api.ts');
const realPost = api.post;
api.post = async (path, body) => {
  if (/\/rankings\/aggregate/.test(path)) { const { ApiClientError } = await import('../lib/api.ts'); throw new ApiClientError(503, 'aggregation unavailable'); }
  return realPost(path, body);
};
const bad = await runSimConsole({ question: Q, count: 12, voters: 5, seed: 'drv' });
api.post = realPost;
const aggErr = bad.errors.find((e) => e.stage === 'aggregate');
ok(!!aggErr && aggErr.status === 503 && /aggregation unavailable/.test(aggErr.detail), `aggregate failure recorded with status + detail (got ${JSON.stringify(bad.errors)})`);

console.log(`sim-console-driver: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
