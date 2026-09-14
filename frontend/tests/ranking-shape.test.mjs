// WS-C final: ONE rankings shape at the read boundary. The real GET /rankings is a bare
// list[{theme_id, rank_position, score}], the mock/aggregate is {rankings:[{theme_id, rank, score}]}.
// The results panel only worked against the mock (read `.rankings[].rank`) — this locks the class fix.
const { normalizeRankings, rankingWinner, rankingReplayHash } = await import('../lib/ranking-shape.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const live = [{ theme_id: 'b', rank_position: 2, score: 1, vote_count: 3 }, { theme_id: 'a', rank_position: 1, score: 5, vote_count: 3 }];
const wrapped = { rankings: [{ theme_id: 'a', rank: 1, score: 5 }, { theme_id: 'b', rank: 2, score: 1 }], winner: 'a', replay_hash: 'h1' };
const L = normalizeRankings(live), W = normalizeRankings(wrapped);
ok(L.map((r) => r.theme_id).join() === 'a,b', 'live list normalized + sorted by rank_position');
ok(W.map((r) => r.theme_id).join() === 'a,b', 'wrapped object normalized');
ok(JSON.stringify(L) === JSON.stringify(W), 'both shapes yield IDENTICAL rows');
ok(L[0].rank === 1 && L[0].score === 5, 'rank + score carried');
ok(normalizeRankings(null).length === 0 && normalizeRankings({}).length === 0 && normalizeRankings('x').length === 0, 'garbage → empty, never throws');
ok(normalizeRankings([{ theme_id: 'z' }])[0].rank === 1, 'missing rank falls back to position');
ok(rankingWinner(wrapped) === 'a' && rankingWinner(live) === 'a' && rankingWinner(null) === null, 'winner explicit or rank-1, null when empty');
ok(rankingReplayHash(wrapped) === 'h1' && rankingReplayHash(live) === null, 'replay hash only when carried');
console.log(`ranking-shape: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
