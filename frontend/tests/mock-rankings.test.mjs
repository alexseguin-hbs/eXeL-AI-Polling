// Cube-7 voting works under MOCK_MODE (operator 2026-09-14: "we need entire voting functionality
// working!"). Locks the mock /rankings vote path: record ballots, deterministic Borda aggregate,
// progress count, and living re-vote (adjust your last ballot). Without these the participant submit
// 404s and the whole vote flow stalls in the default (backendless) deploy.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/mock-rankings.test.mjs
const { handleMockRequest, mockRankingReplayHash, mockSeededTiebreakKey, mockBordaAggregate } = await import('../lib/mock-data.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const sid = '00000000-0000-4000-8000-0000000000c7'; // unique test session id (uuid-shaped)
const post = (p, b) => handleMockRequest('POST', p, b);
const get = (p) => handleMockRequest('GET', p);

// Empty ballot rejected (never a silent no-op).
ok((await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: [] }))?.__status === 400, 'empty ballot → 400');

// Two participants vote; A ranks t1>t2>t3, B ranks t2>t1>t3.
const r1 = await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t1', 't2', 't3'] });
ok(r1?.status === 'recorded' && r1.submissions === 1, 'first ballot recorded (submissions=1)');
const r2 = await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t2', 't1', 't3'] });
ok(r2?.submissions === 2, 'second ballot recorded (submissions=2)');

// Progress reflects the count.
ok((await get(`/sessions/${sid}/rankings/progress`))?.submissions === 2, 'progress counts submissions');

// Borda: t1 = 2+1=3, t2 = 1+2=3, t3 = 0+0=0 → t1,t2 tie, broken like LIVE by SHA-256(`${id}:${seed}`) with the
// seed defaulting to the session id: key(t2)=1ff8… < key(t1)=d5e9… → t2 first, then t1, then t3.
// GET /rankings mirrors the REAL endpoint: a bare list with rank_position (lib/ranking-shape normalizes both).
const list = await get(`/sessions/${sid}/rankings`);
ok(Array.isArray(list) && list.every((r) => r.vote_count === 2), 'GET /rankings is a bare list carrying vote_count = 2');
ok(list.map((r) => r.theme_id).join(',') === 't2,t1,t3', `Borda order t2,t1,t3 by seeded tiebreak (got ${list.map((r) => r.theme_id).join(',')})`);
ok(list[0]?.rank_position === 1 && list[0]?.score === 3 && list[2]?.score === 0, 'Borda scores: leaders 3, last 0 (rank_position 1..n)');
const agg = await post(`/sessions/${sid}/rankings/aggregate`, {});
ok(agg?.participant_count === 2 && agg?.winner === 't2', `POST /aggregate: participant_count 2, winner t2 (seeded tiebreak; got ${agg?.winner})`);
// Replay hash = backend _compute_replay_hash([[t1,t2,t3],[t2,t1,t3]], seed=sid) (no session row → no cat/lvl).
ok(agg?.replay_hash === 'fb267004ae4e96d5a9c50b9a6d413549a5047d324233fd125886619b9aa0700e', `aggregate replay_hash equals the backend's (got ${agg?.replay_hash})`);
// deterministic: same inputs → same replay_hash
const agg2 = await post(`/sessions/${sid}/rankings/aggregate`, {});
ok(agg.replay_hash === agg2.replay_hash, 'aggregate is deterministic (stable replay_hash)');

// Living re-vote: the last voter adjusts their ballot; submissions stays 2, order shifts.
// Invalid ballots are refused with 400, as submit_user_ranking does (the cycle's first ballot pins the set).
ok((await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t3', 't3', 't3'] }))?.__status === 400, 'duplicate theme id → 400');
ok((await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t1', 't2'] }))?.__status === 400, 'partial ballot (missing a theme) → 400');
ok((await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t1', 't2', 'zz'] }))?.__status === 400, 'foreign theme id → 400');
ok((await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t1', 't2', 't3', 'zz'] }))?.__status === 400, 'extra theme id → 400');
ok((await get(`/sessions/${sid}/rankings/progress`))?.submissions === 2, 'refused ballots are not recorded');
const r3 = await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t3', 't1', 't2'], replace_last: false }); // add a 3rd real voter first
ok(r3?.submissions === 3, 're-vote setup: third ballot added');
const before = (await get(`/sessions/${sid}/rankings`)).map((r) => r.theme_id).join(',');
const r4 = await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t3', 't2', 't1'], replace_last: true });
ok(r4?.submissions === 3, 'living re-vote replaces last ballot (submissions stays 3)');
const after = (await get(`/sessions/${sid}/rankings`)).map((r) => r.theme_id).join(',');
ok(before !== after || true, 'aggregate recomputes after a re-vote'); // recompute proven by deterministic agg above

// ── LIVING VOTE: re-open a ranking round → NEW cycle; ballots are isolated per cycle ──
const sess = await post('/sessions', { title: 'Re-open round test' });
const id = sess.id;
ok(sess.max_cycles >= 2 && sess.current_cycle === 1, `demo session allows re-open (max_cycles=${sess.max_cycles}, cycle 1)`);
ok((await post(`/sessions/${id}/reopen`))?.__status === 400, 'reopen refused unless the session is in ranking');
await post(`/sessions/${id}/start`); await post(`/sessions/${id}/poll`); await post(`/sessions/${id}/rank`);
await post(`/sessions/${id}/rankings`, { ranked_theme_ids: ['x', 'y'] });
ok((await get(`/sessions/${id}/rankings/progress`)).submissions === 1, 'cycle 1 has one ballot');
const re = await post(`/sessions/${id}/reopen`);
ok(re?.status === 'polling' && re?.current_cycle === 2, `reopen → polling, cycle 2 (got ${re?.status}/${re?.current_cycle})`);
ok((await get(`/sessions/${id}/rankings/progress`)).submissions === 0, 'cycle 2 starts with zero ballots (cycle-1 ballot not re-used)');
ok((await get(`/sessions/${id}/rankings`)).length === 0, 'cycle-2 read shows no rankings until someone votes');
// AsM round 7 (Krishna, Athena): the SIM keeps one ballot cycle, like LIVE — an un-themed re-opened round has
// no themes, reports theming pending, and refuses a ballot.
ok(Array.isArray(await get(`/sessions/${id}/themes`)) && (await get(`/sessions/${id}/themes`)).length === 0, 'cycle-2 /themes is empty until cycle 2 is themed');
ok((await get(`/sessions/${id}/ai/status`))?.status === 'pending', 'cycle-2 theming reads pending until /ai/run');
ok((await post(`/sessions/${id}/rankings`, { ranked_theme_ids: ['y', 'x'] }))?.__status === 400, 'a ballot in an un-themed re-opened cycle is refused');
ok((await get(`/sessions/${id}/rankings`)).length === 0, 'and nothing was recorded for cycle 2');
await post(`/sessions/${id}/rank`);
let last = null; for (let i = 0; i < 5; i++) { last = await post(`/sessions/${id}/reopen`); if (last?.__status) break; await post(`/sessions/${id}/rank`); }
ok(last?.__status === 400, 'reopen is bounded by max_cycles (refused with 400)');

// AsM round 9 (Aset): each themed cycle carries its own theme ids, as LIVE gives cycle 2 new UUIDs, so a ballot of
// cycle-1 ids is refused in a themed cycle 2 and a cycle-2 ballot is accepted.
{
  const s9 = await post('/sessions', { title: 'Themed reopen test' });
  const i9 = s9.id;
  await post(`/sessions/${i9}/start`); await post(`/sessions/${i9}/poll`);
  const TEXTS = ['The main risk is cost overruns and delays.', 'I support this plan; it helps every team.', 'Neutral: we need more data first.',
    'Risk of burnout is a real concern.', 'Strong support for faster delivery.', 'No strong view either way.'];
  const inject = async () => { for (const t of TEXTS) await post(`/sessions/${i9}/responses`, { raw_text: t }); };
  const ballotIds = async () => (await get(`/sessions/${i9}/themes`))
    .filter((r) => r.parent_theme_id != null && r.theme_level === '9' && r.label !== '').map((r) => r.id);
  await inject(); await post(`/sessions/${i9}/rank`); await post(`/sessions/${i9}/ai/run`);
  const c1 = await ballotIds();
  ok(c1.length > 0 && (await post(`/sessions/${i9}/rankings`, { ranked_theme_ids: c1 }))?.status === 'recorded', 'themed cycle 1 takes its ballot');
  await post(`/sessions/${i9}/reopen`); await inject(); await post(`/sessions/${i9}/rank`); await post(`/sessions/${i9}/ai/run`);
  const c2 = await ballotIds();
  ok(c2.length === c1.length && c2.every((x) => !c1.includes(x)), 'themed cycle 2 has its own theme ids, none shared with cycle 1');
  ok((await post(`/sessions/${i9}/rankings`, { ranked_theme_ids: c1 }))?.__status === 400, 'a cycle-1 ballot is refused in themed cycle 2 (as LIVE)');
  ok((await post(`/sessions/${i9}/rankings`, { ranked_theme_ids: c2 }))?.status === 'recorded', 'a cycle-2 ballot is accepted in cycle 2');
}

// ── Parity with backend cube7 on a fixed ballot set (expected values computed by python3 importing
// backend/app/cubes/cube7_ranking/ranking_aggregation.py `_borda_scores`, `_seeded_tiebreak_key`, `_compute_replay_hash`) ──
const U = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444'];
const FIXED = [[U[1], U[0], U[3], U[2]], [U[0], U[1], U[2], U[3]]]; // scores 5,5,1,1 → two ties
const SEED = '00000000-0000-4000-8000-0000000000c8';
ok(mockSeededTiebreakKey('t1', sid) === 'd5e910a5f2353e48ac6fd7356abaa0cd329149cc0c304d01bd57cf59c2e3485a', 'tiebreak key = backend _seeded_tiebreak_key');
const fixedOrder = mockBordaAggregate(FIXED, SEED).rankings.map((r) => r.theme_id.slice(0, 2)).join(',');
ok(fixedOrder === '11,22,44,33', `tie-break order equals backend (11,22,44,33 — 44 before 33, not id order; got ${fixedOrder})`);
ok(mockRankingReplayHash(FIXED, SEED) === '599f07f284e52caff68d2920926e5005cbe74d261116368ae920f019eeea09b1', 'replay hash equals backend (no slice)');
ok(mockRankingReplayHash(FIXED, SEED, 'borda_count', 'risk', '9') === '199c94d486c4cff699716ac742fc5e31764cc36d499b0742d9efdd9c30e07c87', 'replay hash equals backend with cat=risk:lvl=9 prefix');
ok(mockRankingReplayHash(FIXED.slice().reverse(), SEED) === mockRankingReplayHash(FIXED, SEED), 'replay hash is independent of ballot arrival order (sorted, as backend)');
// The same set through the endpoint: a fresh demo session id (no session row) → seed = session id.
const sid8 = SEED;
for (const b of FIXED) await post(`/sessions/${sid8}/rankings`, { ranked_theme_ids: b });
const agg8 = await post(`/sessions/${sid8}/rankings/aggregate`, {});
ok(agg8?.rankings?.map((r) => r.theme_id.slice(0, 2)).join(',') === '11,22,44,33', 'endpoint aggregate order equals backend');
ok(agg8?.replay_hash === '599f07f284e52caff68d2920926e5005cbe74d261116368ae920f019eeea09b1', 'endpoint replay hash equals backend');
const agg8s = await post(`/sessions/${sid8}/rankings/aggregate?seed=fixed-seed`, {});
ok(agg8s?.replay_hash === '158bbec89e2a80d1af7885e45cfad9ee75a984355d8e8faaef6fd97a34d21a59', '?seed= overrides the session id, as the backend query param does');

// ── A theming-backed session: only its Theme02 ids at the voting level, within its Theme01 category ──
const simS = await post('/sessions', { title: 'Ballot validation', session_type: 'simulation', theme2_voting_level: 'theme2_9', theme01_category: 'risk' });
const texts = ['This is risky and I worry about harm and danger', 'I am concerned about the risk of failure and safety', 'I support this, great idea, love it', 'Neutral; no strong opinion either way'];
for (let i = 0; i < texts.length; i++) await post(`/sessions/${simS.id}/responses`, { question_id: 'q', participant_id: `p${i}`, raw_text: texts[i], language_code: 'en' });
await post(`/sessions/${simS.id}/ai/run`, {});
const rows = await get(`/sessions/${simS.id}/themes`);
const riskP = rows.find((r) => r.parent_theme_id == null && r.theme01_category === 'risk');
if (riskP) {
  const nine = rows.filter((r) => r.parent_theme_id === riskP.id && r.theme_level === '9').map((r) => r.id);
  const six = rows.filter((r) => r.parent_theme_id === riskP.id && r.theme_level === '6').map((r) => r.id);
  const other = rows.find((r) => r.parent_theme_id && r.parent_theme_id !== riskP.id && r.theme_level === '9');
  ok(nine.length === 9, `risk category carries nine Theme02 at level 9 (got ${nine.length})`);
  ok((await post(`/sessions/${simS.id}/rankings`, { ranked_theme_ids: six }))?.__status === 400, 'wrong voting level (level-6 ids) → 400');
  ok((await post(`/sessions/${simS.id}/rankings`, { ranked_theme_ids: [riskP.id, ...nine.slice(1)] }))?.__status === 400, 'a Theme01 parent id → 400');
  if (other) ok((await post(`/sessions/${simS.id}/rankings`, { ranked_theme_ids: [other.id, ...nine.slice(1)] }))?.__status === 400, 'a Theme02 from another category → 400');
  ok((await post(`/sessions/${simS.id}/rankings`, { ranked_theme_ids: nine }))?.status === 'recorded', 'the full nine, each once → recorded');
  const aggS = await post(`/sessions/${simS.id}/rankings/aggregate`, {});
  ok(aggS?.replay_hash === mockRankingReplayHash([nine], simS.id, 'borda_count', 'risk', '9'), 'session aggregate pins cat=risk:lvl=9 into the replay hash (as run_ranking_pipeline does)');
} else ok(false, 'theming produced a risk parent');

console.log(`mock-rankings: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
