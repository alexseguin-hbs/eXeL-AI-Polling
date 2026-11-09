// Live 9-theme prioritization (G2/G4) source guard: the dashboard binds ranking broadcasts to the live panel (not
// console-only), the participant results card shows the group ranking, and every panel string is a lexicon key.
// Run: node tests/live-ranking-panel.test.mjs
import fs from 'node:fs';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const panel = read('components/live-ranking-panel.tsx');
const dash = read('app/dashboard/page.tsx');
const view = read('components/session-view.tsx');
const lex = read('lib/lexicon-data.ts');
const keys = [...panel.matchAll(/t\("([a-z0-9_.]+)"\)/g)].map((m) => m[1])
  .concat([...panel.matchAll(/labelKey: "([a-z0-9_.]+)"/g)].map((m) => m[1]))
  .concat([...panel.matchAll(/"(cube7\.live\.[a-z_]+)"/g)].map((m) => m[1]));
ok(keys.length >= 8, 'panel uses lexicon keys');
for (const k of new Set(keys)) ok(lex.includes(`key: "${k}"`), `lexicon has ${k}`);
ok(!/console\.info\("\[dashboard\] ranking_(progress|complete)/.test(dash), 'dashboard ranking handlers are not console-only');
ok(/setRankingSubmissions\(payload\.submissions\)/.test(dash), 'ranking_progress → vote counter');
ok(/setLiveRanking\(payload\)/.test(dash), 'ranking_complete → live panel');
ok(/<LiveRankingPanel[\s\S]{0,80}variant="moderator"/.test(dash), 'moderator panel rendered');
ok(/rankings\/aggregate\?live=true/.test(dash), 'moderator fallback button tallies live');
ok(/<LiveRankingPanel variant="participant"/.test(view), 'participant results card shows the group ranking');
ok(/onGroupProgress,\s*onGroupRanking,?\s*\)/.test(view), 'participant reuses the single session:{code} channel (no second channel)');
ok(!/supabase\.channel\(/.test(panel), 'panel opens no channel of its own');
console.log(`live-ranking-panel: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
