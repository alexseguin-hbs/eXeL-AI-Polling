// Ranked-themes + tier gating (operator 2026-09-14: "ranking feature … default ability to see
// these themes with a long description of 33/111/333"). Locks deterministic ranking and the
// paid-tier gate on the 111/333 descriptions.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/theme-ranked.test.mjs
const { rankThemes, pickTier, tierAvailable, DESC_TIERS } = await import('../lib/theme-ranked.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const T = (label, count, extra = {}) => ({ label, count, avgConfidence: 80, summary33: `${label} 33`, ...extra });
const themes = [
  T('Bias', 267, { summary111: 'Bias 111', summary333: 'Bias 333' }),
  T('Safety', 1148, { summary111: 'Safety 111', summary333: 'Safety 333' }),
  T('Impact', 812),
  { label: '', count: 0, avgConfidence: 0, summary33: '', isEmpty: true }, // padded slot
];

// Default ranking = count desc, empties dropped, deterministic.
const ranked = rankThemes(themes);
ok(ranked.map((t) => t.label).join(',') === 'Safety,Impact,Bias', `default rank by count desc (got ${ranked.map((t) => t.label).join(',')})`);
ok(ranked.length === 3, 'padded/empty slots dropped from ranking');
ok(ranked.every((t, i) => i === 0 || (ranked[i - 1].count >= t.count)), 'monotonic non-increasing counts');

// Explicit order (from live Cube-7 rankings) wins; unranked fall to the end by count.
const byOrder = rankThemes(themes, ['Bias', 'Impact', 'Safety']);
ok(byOrder.map((t) => t.label).join(',') === 'Bias,Impact,Safety', 'explicit ranking order wins');
const partial = rankThemes(themes, ['Impact']);
ok(partial[0].label === 'Impact' && partial.slice(1).map((t) => t.label).join(',') === 'Safety,Bias', 'partial order: ranked first, rest by count');

// Tier gating: free viewer only ever sees 33; paid sees the richer tiers.
const bias = themes[0];
ok(pickTier(bias, '333', false) === 'Bias 33', 'free tier: 333 request falls back to 33 (no leak)');
ok(pickTier(bias, '111', false) === 'Bias 33', 'free tier: 111 request falls back to 33');
ok(pickTier(bias, '333', true) === 'Bias 333', 'paid tier: 333 resolves');
ok(pickTier(bias, '111', true) === 'Bias 111', 'paid tier: 111 resolves');
// graceful fallback when a paid tier is missing (Impact has no 111/333)
ok(pickTier(themes[2], '333', true) === 'Impact 33', 'paid but missing 333 → falls back to 33');
ok(tierAvailable('33', false) && !tierAvailable('111', false) && tierAvailable('111', true), 'tierAvailable gates 111/333 on paid');
ok(DESC_TIERS.join(',') === '33,111,333', 'three tiers in order');

console.log(`theme-ranked: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
