// WS-C final: the forward-only status guard must honour a living-vote re-open (ranking→polling with a
// HIGHER current_cycle) while still refusing stale backward data.
const { statusAdvances, statusRank } = await import('../lib/session-utils.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
ok(statusAdvances({ status: 'polling' }, { status: 'ranking' }) === true, 'forward move advances');
ok(statusAdvances({ status: 'ranking' }, { status: 'polling' }) === false, 'ranking→polling with same cycle is stale (refused)');
ok(statusAdvances({ status: 'ranking', current_cycle: 1 }, { status: 'polling', current_cycle: 2 }) === true, 're-open with a higher cycle advances');
ok(statusAdvances({ status: 'ranking', current_cycle: 2 }, { status: 'polling', current_cycle: 1 }) === false, 'lower cycle never advances');
ok(statusAdvances({ status: 'closed' }, { status: 'polling', current_cycle: 9 }) === false, 'only ranking→polling may go back');
ok(statusAdvances({ status: 'polling' }, { status: 'polling' }) === false, 'same status is not an advance');
ok(statusRank('ranking') > statusRank('polling'), 'statusRank unchanged');
console.log(`status-advance: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
