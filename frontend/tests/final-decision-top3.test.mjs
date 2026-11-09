// CRS-22.04 (moderator final decision with transparency) + CRS-37.01 (top-3-per-category ballot, ranking_method picker)
// + G4 spectators: source guards — wired to the real endpoints/broadcasts (no console-only), every string a lexicon key.
// Run: node tests/final-decision-top3.test.mjs
import fs from 'node:fs';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const dec = read('components/final-decision.tsx');
const top3 = read('components/top3-ballot.tsx');
const dash = read('app/dashboard/page.tsx');
const view = read('components/session-view.tsx');
const hook = read('lib/use-session-broadcast.ts');
const api = read('lib/api.ts');
const mock = read('lib/mock-data.ts');
const lex = read('lib/lexicon-data.ts');
const keysOf = (src) => [...src.matchAll(/t\("([a-z0-9_.]+)"\)/g)].map((m) => m[1])
  .concat([...src.matchAll(/"(cube[0-9]+\.[a-z0-9_]+\.[a-z0-9_]+)"/g)].map((m) => m[1]));
for (const k of new Set([...keysOf(dec), ...keysOf(top3)])) ok(lex.includes(`key: "${k}"`), `lexicon has ${k}`);
for (const k of ['method_label', 'method_borda', 'method_top3']) ok(dash.includes(`t("cube7.top3.${k}")`), `create form uses cube7.top3.${k}`);

// decision: real endpoint, server-enforced rule mirrored client-side, transparency fields rendered
ok(/rankings\/decision`/.test(dec) && /api\.post/.test(dec), 'decision form POSTs /rankings/decision');
ok(/MIN_DECISION_REASON = 10/.test(dec), 'reason minimum mirrors the backend (10)');
ok(/differs_from_group/.test(dec) && /group_top_theme_label/.test(dec) && /decision\.reason/.test(dec), 'banner shows group #1 + reason when different');
ok(/"final_decision"/.test(hook) && /onFinalDecisionRef\.current\?\.\(/.test(hook), 'final_decision broadcast bound');
ok(/onFinalDecision,\s*\/\/ CRS-22\.04/.test(dash), 'dashboard passes onFinalDecision to the single channel');
ok(/<FinalDecisionForm sessionId=\{session\.id\}/.test(dash) && /<FinalDecisionBanner decision=\{finalDecision\}/.test(dash), 'moderator form + banner mounted');
ok(/onGroupRanking,\s*onGroupDecision,\s*\)/.test(view), 'participant reuses the session channel for final_decision');
ok(/<FinalDecisionBanner decision=\{groupDecision\}/.test(view), 'participant sees the decision banner');
ok(/rankings\/live`/.test(view) && /rankings\/live`/.test(dash), 'late joiners / reloads read GET /rankings/live');
ok(/PARTICIPANT_READ = .*rankings.*live/.test(api) && /participantReadTokenFor\(path\)/.test(api), 'participant token attached to the live read');
ok(/rankings\\\/\(live\|decision\)/.test(mock) && /__status: 501/.test(mock), 'mock mode refuses (never fakes) live/decision');
ok(!/supabase\.channel\(/.test(dec) && !/supabase\.channel\(/.test(top3), 'no extra realtime channels');

// top-3 ballot: right body shape, wired only for top3_points, borda unchanged as default
ok(/category_ballots/.test(top3) && /rankings`, body\)/.test(top3), 'top-3 ballot POSTs category_ballots');
ok(/TOP3_POINTS = \[3, 2, 1\]/.test(top3), '3/2/1 points');
ok(/ranking_method === "top3_points" && liveBallot\.status === "ready"[\s\S]{0,120}<Top3Ballot/.test(view), 'top3 sessions get the top-3 ballot');
ok(/session\?\.ranking_method !== "top3_points" && liveBallot\.status === "ready"/.test(view), 'borda sessions keep the full-ranking ballot');
ok(/useState<"borda_count" \| "top3_points">\("borda_count"\)/.test(dash) && /ranking_method: newRankingMethod/.test(dash), 'create form picker, default borda');
ok(/data-spectator-ranking/.test(view), 'non-voters see the group ranking once closed');

// togglePick / top3Body — the pure helpers, evaluated from source
const src = top3.match(/export function togglePick[\s\S]*?\n}\n/)[0].replace(/export /, '').replace(/: string\[\]/g, '').replace(/: string\)/g, ')');
const togglePick = new Function('TOP3_POINTS', `${src}; return togglePick;`)([3, 2, 1]);
ok(JSON.stringify(togglePick([], 'a')) === '["a"]', 'pick');
ok(JSON.stringify(togglePick(['a', 'b', 'c'], 'd')) === '["a","b","c"]', 'max 3');
ok(JSON.stringify(togglePick(['a', 'b', 'c'], 'a')) === '["b","c"]', 'unpick moves later picks up');
console.log(`final-decision-top3: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
