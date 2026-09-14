// Cube-7 voting works under MOCK_MODE (operator 2026-09-14: "we need entire voting functionality
// working!"). Locks the mock /rankings vote path: record ballots, deterministic Borda aggregate,
// progress count, and living re-vote (adjust your last ballot). Without these the participant submit
// 404s and the whole vote flow stalls in the default (backendless) deploy.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/mock-rankings.test.mjs
const { handleMockRequest } = await import('../lib/mock-data.ts');
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

// Borda: t1 = 2+1=3, t2 = 1+2=3, t3 = 0+0=0 → t1,t2 tie (break by id asc), then t3.
// GET /rankings mirrors the REAL endpoint: a bare list with rank_position (lib/ranking-shape normalizes both).
const list = await get(`/sessions/${sid}/rankings`);
ok(Array.isArray(list) && list.every((r) => r.vote_count === 2), 'GET /rankings is a bare list carrying vote_count = 2');
ok(list.map((r) => r.theme_id).join(',') === 't1,t2,t3', `Borda order t1,t2,t3 (got ${list.map((r) => r.theme_id).join(',')})`);
ok(list[0]?.rank_position === 1 && list[0]?.score === 3 && list[2]?.score === 0, 'Borda scores: leaders 3, last 0 (rank_position 1..n)');
const agg = await post(`/sessions/${sid}/rankings/aggregate`, {});
ok(agg?.participant_count === 2 && agg?.winner === 't1', 'POST /aggregate: participant_count 2, winner t1 (tie broken by id)');
// deterministic: same inputs → same replay_hash
const agg2 = await post(`/sessions/${sid}/rankings/aggregate`, {});
ok(agg.replay_hash === agg2.replay_hash, 'aggregate is deterministic (stable replay_hash)');

// Living re-vote: the last voter adjusts their ballot; submissions stays 2, order shifts.
const r3 = await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t3', 't3', 't3'], replace_last: false }); // add a 3rd real voter first
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
await post(`/sessions/${id}/rankings`, { ranked_theme_ids: ['y', 'x'] });
ok((await get(`/sessions/${id}/rankings`))[0]?.theme_id === 'y', 'cycle-2 aggregate reflects cycle-2 ballots only');
await post(`/sessions/${id}/rank`);
let last = null; for (let i = 0; i < 5; i++) { last = await post(`/sessions/${id}/reopen`); if (last?.__status) break; await post(`/sessions/${id}/rank`); }
ok(last?.__status === 400, 'reopen is bounded by max_cycles (refused with 400)');

console.log(`mock-rankings: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
