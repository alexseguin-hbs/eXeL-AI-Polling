// WS-G Admin Simulation Console core (operator 2026-09-14: "create responses 100-400 words long
// around a question, then test that set and question … test 5000 responses or new actual questions
// grouping theme01 theme02 and simulating priorities in the ranking round"). Locks the deterministic
// generator + ballot simulator: byte-stable for a fixed (question,count,seed), every response in the
// 100-400 word band, a realistic stance spread, and valid permutation ballots. Without this gate the
// console could silently drift to short/empty responses or degenerate ballots and no one would know.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sim-console.test.mjs
const { generateSimResponses, simulateBallots, mulberry32, hashSeed } = await import('../lib/sim-console.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const wc = (s) => s.trim().split(/\s+/).length;

// --- generator: count + word band ---
const Q = 'Should AI systems be governed by shared human intent?';
const set = generateSimResponses(Q, 40, 's1');
ok(set.length === 40, `generates the requested count (got ${set.length})`);
ok(set.every((r) => r.word_count >= 100 && r.word_count <= 400), 'every response is 100-400 words');
ok(set.every((r) => wc(r.raw_text) === r.word_count), 'word_count matches the actual text');
ok(set.every((r) => r.raw_text.includes(Q.slice(0, 40))), 'each response weaves in the question');
ok(set.every((r) => r.id && r.participant_id && r.language_code === 'en'), 'each response has id/participant/lang');

// --- determinism: same (question,count,seed) → byte-identical ---
const setB = generateSimResponses(Q, 40, 's1');
ok(JSON.stringify(set) === JSON.stringify(setB), 'generator is deterministic for a fixed seed');
const setC = generateSimResponses(Q, 40, 's2');
ok(JSON.stringify(set) !== JSON.stringify(setC), 'a different seed yields a different set');

// --- stance distribution is realistic (risk-heavy, all three present in a large set) ---
const big = generateSimResponses(Q, 300, 'dist');
const counts = big.reduce((a, r) => ((a[r.stance] = (a[r.stance] || 0) + 1), a), {});
ok(counts.risk > 0 && counts.support > 0 && counts.neutral > 0, `all three stances present (${JSON.stringify(counts)})`);
ok(counts.risk >= counts.support && counts.support >= counts.neutral, `risk ≥ support ≥ neutral (${JSON.stringify(counts)})`);

// --- large run (the 5,000 preset) still holds the band ---
const huge = generateSimResponses(Q, 5000, 'v04.1_5000');
ok(huge.length === 5000, 'the 5,000-response preset generates 5,000');
ok(huge.every((r) => r.word_count >= 100 && r.word_count <= 400), '5,000-run: every response in band');

// --- ballots: valid permutations, deterministic ---
const themes = ['th-1', 'th-2', 'th-3', 'th-4', 'th-5', 'th-6'];
const ballots = simulateBallots(themes, 25, 'b1');
ok(ballots.length === 25, `simulates the requested voter count (got ${ballots.length})`);
const isPerm = (b) => b.length === themes.length && new Set(b).size === themes.length && b.every((t) => themes.includes(t));
ok(ballots.every(isPerm), 'every ballot is a valid permutation of the themes');
const ballotsB = simulateBallots(themes, 25, 'b1');
ok(JSON.stringify(ballots) === JSON.stringify(ballotsB), 'ballots are deterministic for a fixed seed');
const ballotsC = simulateBallots(themes, 25, 'b2');
ok(JSON.stringify(ballots) !== JSON.stringify(ballotsC), 'a different seed yields different ballots');

// --- RNG primitives are stable ---
ok(typeof hashSeed('x') === 'number' && hashSeed('x') === hashSeed('x'), 'hashSeed is stable');
const rng = mulberry32(123); const a = rng(), b = rng();
ok(a >= 0 && a < 1 && b >= 0 && b < 1 && a !== b, 'mulberry32 yields distinct unit floats');

console.log(`sim-console: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
