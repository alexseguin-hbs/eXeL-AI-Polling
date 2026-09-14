// Per-theme 33/111/333 description tiers (operator 2026-09-14: "all three tiers per theme").
// Locks that (a) the live adapter surfaces theme_summary_111/333 from ThemeRead, and (b) the
// deterministic showcase generates three genuinely-ordered tiers for every non-empty theme.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/theme-tiers.test.mjs
const { adaptLiveThemes } = await import('../lib/adapt-live-themes.ts');
const { generateSampleSessionData } = await import('../lib/sample-session-data.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

// (a) Adapter maps the richer backend tiers into ThemeInfo.summary111/333.
const rows = [
  { id: 'r', label: 'Risk & Concerns', summary: 'short 33 tier', summary_111: 'the 111 word tier', summary_333: 'the 333 word tier', confidence: 0.84, response_count: 2500, theme01_category: 'risk', theme_level: null, parent_theme_id: null },
  { id: 'r3', label: 'Safety & Control', summary: 'sub 33', summary_111: 'sub 111', summary_333: 'sub 333', confidence: 0.81, response_count: 1148, theme01_category: 'risk', theme_level: '3', parent_theme_id: 'r' },
];
const live = adaptLiveThemes('s1', rows);
ok(live.theme1['Risk & Concerns'].summary111 === 'the 111 word tier', 'adapter maps theme_summary_111 → summary111');
ok(live.theme1['Risk & Concerns'].summary333 === 'the 333 word tier', 'adapter maps theme_summary_333 → summary333');
ok(live.theme2['Risk & Concerns'].level3[0].summary111 === 'sub 111', 'adapter maps sub-theme summary111');
// missing tiers stay undefined (UI falls back to summary33) — never an empty-string false positive
const bare = adaptLiveThemes('s2', [{ id: 'x', label: 'Neutral Comments', summary: 'only 33', confidence: 0.7, response_count: 10, theme01_category: 'neutral', theme_level: null, parent_theme_id: null }]);
ok(bare.theme1['Neutral Comments'].summary111 === undefined, 'no tier → summary111 undefined (falls back to 33)');

// (b) Showcase generates three ordered tiers for every non-empty theme.
const data = generateSampleSessionData('past0001-test');
const nonEmpty = [];
for (const label of Object.keys(data.theme1)) {
  const t = data.theme1[label];
  if (!t.isEmpty && t.count > 0) nonEmpty.push(t);
}
for (const lvl of ['level3', 'level6', 'level9']) {
  for (const label of Object.keys(data.theme2)) {
    for (const t of data.theme2[label][lvl]) if (!t.isEmpty && t.count > 0) nonEmpty.push(t);
  }
}
ok(nonEmpty.length > 0, 'showcase produced non-empty themes to check');
const missingTier = nonEmpty.filter((t) => !t.summary33 || !t.summary111 || !t.summary333);
ok(missingTier.length === 0, `every non-empty theme has all three tiers (${missingTier.length} missing)`);
// 333 tier is the richest, 111 in the middle, 33 the shortest — for themes with enough member text.
const notOrdered = nonEmpty.filter((t) => !(wc(t.summary333) >= wc(t.summary111) && wc(t.summary111) >= wc(t.summary33)));
ok(notOrdered.length === 0, `tiers are length-ordered 33 ≤ 111 ≤ 333 (${notOrdered.length} out of order)`);
// at least the big buckets genuinely differ (not all three identical)
const bigDistinct = nonEmpty.filter((t) => t.count >= 100 && t.summary333 !== t.summary33);
ok(bigDistinct.length > 0, 'large themes have a genuinely longer 333 tier than 33');

console.log(`theme-tiers: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
