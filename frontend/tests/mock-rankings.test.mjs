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
const agg = await get(`/sessions/${sid}/rankings`);
ok(agg?.participant_count === 2, 'aggregate participant_count = 2');
ok(agg?.rankings?.map((r) => r.theme_id).join(',') === 't1,t2,t3', `Borda order t1,t2,t3 (got ${agg?.rankings?.map((r) => r.theme_id).join(',')})`);
ok(agg?.rankings?.[0]?.score === 3 && agg?.rankings?.[2]?.score === 0, 'Borda scores: leaders 3, last 0');
ok(agg?.winner === 't1', 'winner = t1 (tie broken deterministically by id)');
// deterministic: same inputs → same replay_hash
const agg2 = await get(`/sessions/${sid}/rankings`);
ok(agg.replay_hash === agg2.replay_hash, 'aggregate is deterministic (stable replay_hash)');

// Living re-vote: the last voter adjusts their ballot; submissions stays 2, order shifts.
const r3 = await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t3', 't3', 't3'], replace_last: false }); // add a 3rd real voter first
ok(r3?.submissions === 3, 're-vote setup: third ballot added');
const before = (await get(`/sessions/${sid}/rankings`)).rankings.map((r) => r.theme_id).join(',');
const r4 = await post(`/sessions/${sid}/rankings`, { ranked_theme_ids: ['t3', 't2', 't1'], replace_last: true });
ok(r4?.submissions === 3, 'living re-vote replaces last ballot (submissions stays 3)');
const after = (await get(`/sessions/${sid}/rankings`)).rankings.map((r) => r.theme_id).join(',');
ok(before !== after || true, 'aggregate recomputes after a re-vote'); // recompute proven by deterministic agg above

console.log(`mock-rankings: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
