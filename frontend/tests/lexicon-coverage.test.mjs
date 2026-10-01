// lexicon-coverage — THE CLASS GATE over ALL master keys (operator 2026-09-12: "translate UI/UX to standard 33 languages"):
// for every non-English language, every key in lib/lexicon-data.ts has a non-empty value after the app's own merge
// (seeded → r228 → sign → ES_SIGN → lazy i18n-sign → lazy i18n-app), placeholders match the English, and NO value equals
// the English default unless it is KEEP-trivial or on the reviewed allow-list (operator 2026-09-13: no placeholders). Keys added after the last fill go in AFTER_FILL — listed,
// never silent — until the next fill. Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/lexicon-coverage.test.mjs
import fs from 'node:fs'; import path from 'node:path';
const L = await import('../lib/lexicon-data.ts');
const { SEEDED_TRANSLATIONS } = await import('../lib/lexicon-translations.ts');
const { SOI_R228_TRANSLATIONS } = await import('../lib/lexicon-translations-soi-r228.ts');
const { SIGN_TRANSLATIONS } = await import('../lib/lexicon-translations-sign.ts');
const { ES_SIGN } = await import('../lib/lexicon-translations-es-sign.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const en = L.DEFAULT_ENGLISH_TRANSLATIONS; const keys = Object.keys(en);
// ROUND-12 i18n MANIFEST DISCIPLINE (P0-11): every Round-12 key — guided start, intro/CIN, edge deck, waiting
// room, HAND OFF, CH0 training, amber/red legend — is STAGED here the moment it is added, and every key built in
// pure lib/ (where the JSX scan cannot see it) is staged too. A key whose English is CHANGED after a fill is
// re-staged AND its 32 now-stale translations are removed from lib/i18n-app/*, so t() falls back to the corrected
// English rather than returning the old, wrong translation ("listed never silent" — an orphaned fill is a silent lie).
const AFTER_FILL = new Set([
  // Financial-2525 (operator 2026-09-30) — the 90 fin.* keys were filled ×32 (one agent per language) and then reviewed by a
  // native-speaker pass per language (664 corrections folded); 36 reviewed loanwords on the identical-allowed list.
  // R-CORE compare mirror of Vision-2525 (operator 2026-09-26) — the 29 new rcore.* keys were filled ×32 (Haiku),
  // 13 legitimate loanwords (Revision/Details/Impact/Date/section(s)/release(s)) on the reviewed identical-allowed list.
  // S9 · User Story · Highlights personas-aligned layout (operator 2026-09-24) — two column headers; ×32 fill owed:
  'soi2525.personas',
  'soi2525.high_priority_user_stories',
  // Financial-2525 r.018 (operator 2026-09-30, addendum 31 — the budget grouped by kind, no letters): the two chevron names and the
  // retitled heading (its 32 stale fills removed — "Personal finance ladder A–M" → "Personal budget"). ENGLISH ONLY until the operator
  // says the English is final (addendum 30, the CLAUDE.md rule) — no fill is dispatched for these:
  ...['expand', 'collapse', 'ladder_title'].map((k) => `fin.${k}`),
  // Financial-2525 r.020 (addendum 34 — a month is 30.333 days, 91 is a quarter): per quarter added; per month and the two length
  // presets reworded (their stale fills removed). ENGLISH ONLY until the operator has tested the functionality (addendum 32):
  ...['per_quarter', 'per_month', 'rec.paymot', 'rec.month91'].map((k) => `fin.${k}`),
  // Financial-2525 r.021 (addendum 35): "In escrow" → "In Escrow" (its stale fills removed) — English only (addendum 32):
  ...['escrowed'].map((k) => `fin.${k}`),
  // Financial-2525 r.023 (addenda 36 · 38 · 39 · 55 — one + Transaction door, the type blank until picked, Deposit / Funds and
  // Withdrawal / Expense, the refusal that names the minute). English only (addendum 32):
  ...['guide.first_transaction', 'tx_open', 'tx_close', 'type_select', 'type_deposit', 'type_withdrawal', 'reason_insufficient_by'].map((k) => `fin.${k}`),
  // Financial-2525 r.024 (addendum 46 — one rate figure with its unit, per hour by default, shorthand once picked). English only:
  ...['rate_unit', 'rate.sec', 'rate.min', 'rate.hr', 'rate.day'].map((k) => `fin.${k}`),
  // Financial-2525 r.025 (addenda 37 · 40 · 42 · 45 — the subtitle names Measure of Time, the wheel's rings read 웃 HI · ◬ AI · ♡ SI
  // (their stale fills removed), the gear's Date format, the chart's tap, the wheel's accessible name). English only:
  ...['subtitle', 'wheel.hi', 'wheel.ai', 'wheel.si', 'trinity_aria', 'date_format', 'chart_tap'].map((k) => `fin.${k}`),
  // Financial-2525 r.028 (addenda 57 · 58 — no hold; the header's two lines; Accrual Units; the chart's settings with the text angle;
  // the Record folded as a table; the year as a table, perihelion first). The r.027 hold keys are retired. English only:
  ...['title_l1', 'accrual_units', 'settings', 'chart_angle', 'record_toggle', 'year_today', 'month', 'year', 'hash'].map((k) => `fin.${k}`),
  // r.029 (addendum 60 — three boxes, Spent, the figures explained in the gear). English only:
  ...['spent', 'def.available', 'def.escrowed', 'def.released', 'def.spent'].map((k) => `fin.${k}`),
  // r.030 (addendum 61 — the year card's own Clock / MoT toggle). English only:
  ...['year_title', 'orbit_position'].map((k) => `fin.${k}`),
  // r.031 (addendum 62 — the standard calendar month in the budget's units). English only:
  ...['per_cal_month', 'days'].map((k) => `fin.${k}`),
  // r.034 (addendum 67 — eXeL AI upper left back to /main). English only:
  ...['home'].map((k) => `fin.${k}`),
  // r.035 (addendum 68 — the label above the rate). English only:
  ...['accrual_rate'].map((k) => `fin.${k}`),
  // Financial-2525 r.038 (addenda 72 + 73 — the year card's MoT view in A.B..C only): English only until he says the English is final
  ...['perihelion_abc', 'now_abc', 'revolution'].map((k) => `fin.${k}`),
  // Financial-2525 r.016 (operator 2026-09-30, addendum 28 — the budget's edit mode): the pencil, Done, add, remove, reset — 5 keys FILLED ×32 (native-speaker agents, eight languages each); nothing left in AFTER_FILL for r.016.
  // Financial-2525 r.013 (operator 2026-09-30, addenda 24–25 — one transaction form, the length dropdown): 10 keys FILLED ×32 (native-speaker agents; six shared words — fr Transaction · Type · Minutes, da/nl/no Type — on the identical-allowed list).
  // Financial-2525 r.012 (operator 2026-09-30, addendum 22 — the A–U ladder): 20 sections · 60 fields · 5 timelines · 5 labels FILLED ×32
  // (native-speaker agents, four languages each; seven reviewed shared words — fr Protection · Section, ro Credit, tl Cash and three
  // banking labels — on the identical-allowed list); nothing left in AFTER_FILL for r.012.
  // Financial-2525 r.007 (operator 2026-09-30, addendum 18) — fin.perihelion_cst (the perihelion instant in CST standard on the year
  // line) filled ×32 (native-speaker agents, eight languages each); nothing left in AFTER_FILL for r.007.
  // Financial-2525 r.006 (operator 2026-09-30, addenda 16–17) — the category dropdown + the budget unit toggle: 8 keys (fin.category ·
  // fin.cat.home (Home → Mortgage/Rent, its 32 stale fills removed first) · per_week · per_month · per_year · unit · kind · device_only)
  // were filled ×32 (native-speaker agents, four languages each); 2 reviewed shared words (ms Unit · nl per week) on the identical-allowed list.
  // Financial-2525 r.005 (operator 2026-09-30, addenda 12–13) — the 17 Planet-LTU / selector keys were filled ×32 (native-speaker
  // agents, four languages each); 23 reviewed loanwords (Planet · Status · Perihelion) on the identical-allowed list.
  // ROUND-12 keys stage here the moment they are declared; any key whose English is later changed is re-staged
  // AND its stale translations removed from lib/i18n-app/* — never left to return the old wording ("listed
  // never silent"). Filled ×32 in a batch once a P1 revision's UI settles, then cleared.
  // P1-E · CH0 TRAINING (2026-09-17):
  'drone.ch.training_line',
  'drone.ch.first_visit',
  // P1-A · guided start (2026-09-17):
  'drone.stage.here',
  'drone.stage.locked',
  'drone.stage.turrets',
  'drone.stage.capital',
  'drone.stage.drone',
  'drone.stage.multi',
  // P1-A · the r.066 intro (cinematic + SELECT CITY/CRAFT/RANGE) — 11 beats + chrome + city + craft:
  'drone.cin.0', 'drone.cin.1', 'drone.cin.2', 'drone.cin.3', 'drone.cin.4', 'drone.cin.5',
  'drone.cin.6', 'drone.cin.7', 'drone.cin.8', 'drone.cin.9', 'drone.cin.10',
  'drone.intro.continue', 'drone.intro.skip', 'drone.intro.city', 'drone.intro.craft', 'drone.intro.range',
  'drone.intro.begin', 'drone.intro.replay', 'drone.intro.loop',
  'drone.city.capital', 'drone.city.austin', 'drone.city.atlantis',
  'drone.craft.turret', 'drone.craft.quad', 'drone.craft.vtol',
  // P1-2 · amber↔red legibility + LOCK reticle:
  'drone.hud.lock', 'drone.hud.no_lock', 'drone.hud.armed', 'drone.hud.legend',
  // P1-B declutter · config toggle + R-CORE playable (r.128 served as-is):
  'drone.config', 'drone.play_deck',
  // R-CORE · version-history badge + compare panel (Stage 1, 2026-09-25) — ×32 fill owed:
  'rcore.brand', 'rcore.version_history', 'rcore.icon_aria', 'rcore.open_aria', 'rcore.compare',
  'rcore.what_changed', 'rcore.history', 'rcore.before', 'rcore.after', 'rcore.releases_crossed',
  'rcore.added', 'rcore.revised', 'rcore.carried', 'rcore.rev_short', 'rcore.close',
  'rcore.same_rev', 'rcore.too_large', 'rcore.fewer_than_two',
  'rcore.impact.l1', 'rcore.impact.l2', 'rcore.impact.l3', 'rcore.impact.l4', 'rcore.impact.l5',
]);   // Drone-2525 keys (arena + round) filled ×32 on 2026-09-15; nothing is staged.   // Drone-2525 keys (arena + round) filled ×32 on 2026-09-15; nothing is staged.   // Drone-2525 keys filled ×32 on 2026-09-15; nothing is staged.
const ph = (s) => (String(s).match(/\{[a-z_]+\}/g) ?? []).sort().join(' ');
const KEEP = /^(https?:\/\/|[0-9.\s%×·—–-]+$|[A-Z0-9_\-.]+$)/;
const ALLOWED = (() => { const f = path.resolve(process.cwd(), '..', 'docs/asks/2026-09-12_lexicon_identical_allowed.psv'); if (!fs.existsSync(f)) return new Set(); return new Set(fs.readFileSync(f, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => { const [scope, key] = l.split('|'); return `${scope}|${key}`; })); })();   // reviewed: a formula, a name, a unit, or a word the language shares
const allowedIdentical = (code, key) => ALLOWED.has(`*|${key}`) || ALLOWED.has(`${code}|${key}`);

const lazy = async (dir, code) => { const f = path.join(process.cwd(), 'lib', dir, `${code}.ts`); if (!fs.existsSync(f)) return {}; try { return (await import(`../lib/${dir}/${code}.ts`)).default ?? {}; } catch { return {}; } };
const codes = L.INITIAL_LANGUAGES.map((l) => l.code).filter((c) => c !== 'en');
ok(codes.length === 32, `32 languages beyond English (got ${codes.length})`);
for (const code of codes) {
  const m = { ...(SEEDED_TRANSLATIONS[code] ?? {}), ...(SOI_R228_TRANSLATIONS[code] ?? {}), ...(SIGN_TRANSLATIONS[code] ?? {}), ...(code === 'es' ? ES_SIGN : {}), ...(await lazy('i18n-sign', code)), ...(await lazy('i18n-app', code)) };
  const missing = keys.filter((k) => String(en[k].englishDefault ?? '').trim() && !AFTER_FILL.has(k) && !String(m[k] ?? '').trim());   // an empty English default is not a gap
  const pending = keys.filter((k) => AFTER_FILL.has(k) && !String(m[k] ?? '').trim());
  if (pending.length) console.log(`PENDING ${code}: ${pending.length} key(s) added after the last fill are English`);
  // THE LOCK (operator 2026-09-30, addendum 32 "do not lexicon translate until functionality is tested with me"): a staged key carries
  // NO translation in any language. A fill can land only in the commit that removes the key from AFTER_FILL — which happens only when
  // the operator says the English is final. A translation that reaches a staged key fails the build.
  const filledWhileStaged = keys.filter((k) => AFTER_FILL.has(k) && String(m[k] ?? '').trim());
  ok(!filledWhileStaged.length, `${code}: ${filledWhileStaged.length} staged key(s) carry a translation before the operator finalized the English — ${filledWhileStaged.slice(0, 8).join(' ')}`);
  ok(missing.length === 0, `${code}: every master key has a value (missing ${missing.length}: ${missing.slice(0, 4).join(', ')})`);
  const badPh = keys.filter((k) => m[k] && ph(en[k].englishDefault) !== ph(m[k]));
  ok(badPh.length === 0, `${code}: placeholders kept (${badPh.length} differ: ${badPh.slice(0, 3).join(', ')})`);
  // NO PLACEHOLDERS (operator 2026-09-13: "dont use place holders translate"): a value may equal the English default
  // ONLY when it is KEEP-trivial (a URL, number, symbol or all-caps token) or on the reviewed allow-list. Every other
  // real word must be translated — zero tolerance, not the old 10 % slack.
  const same = keys.filter((k) => m[k] && m[k] === en[k].englishDefault && !KEEP.test(en[k].englishDefault) && !allowedIdentical(code, k));
  ok(same.length === 0, `${code}: no untranslated English left outside the allow-list (${same.length}: ${same.slice(0, 6).join(", ")})`);
}
console.log(`lexicon-coverage: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
