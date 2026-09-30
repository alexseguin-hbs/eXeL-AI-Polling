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
  // Financial-2525 r.012 (operator 2026-09-30, addendum 22 — the A–U ladder): 20 sections · 60 fields · 5 timelines · 5 labels; ×32 fill owed:
  ...['sec.a', 'sec.b', 'sec.c', 'sec.d', 'sec.e', 'sec.f', 'sec.g', 'sec.h', 'sec.i', 'sec.j', 'sec.k', 'sec.l', 'sec.m', 'sec.n', 'sec.o', 'sec.p', 'sec.q', 'sec.r', 'sec.s', 'sec.t', 'field.a_income_wages', 'field.a_upside', 'field.a_annuity_pension_disability', 'field.a_alimony_child_support', 'field.a_capital_gains', 'field.b_rent_mortgage', 'field.b_property_tax_hoa_fees', 'field.b_housing_insurance', 'field.b_maintenance_repairs', 'field.b_lawn_pest_security', 'field.b_other_fees', 'field.c_auto_payment', 'field.c_fuel', 'field.c_maintenance_other', 'field.c_rideshare_taxi', 'field.c_airfare_other', 'field.d_health_dental_vision', 'field.d_auto_renters_home', 'field.d_life_disability', 'field.d_umbrella_pet_other', 'field.e_electric_gas', 'field.e_water_sewer_trash', 'field.e_internet_phone', 'field.e_subscriptions_ai_cloud', 'field.f_groceries', 'field.f_dining_work', 'field.f_alcohol', 'field.g_copays_deductibles_rx', 'field.g_hsa_fsa', 'field.g_mental_physical', 'field.g_personal_care_devices', 'field.h_childcare_elderly_education', 'field.h_pets', 'field.i_cards_student', 'field.i_other_loans', 'field.j_federal_state_income', 'field.j_fica_self_employment', 'field.j_tax_preparation', 'field.k_gear_licenses_tools', 'field.k_education_certifications', 'field.l_fun_hobbies_clothing', 'field.l_gifts_holidays_travel', 'field.l_giving_charity', 'field.m_emergency_sinking', 'field.m_retirement_brokerage_529', 'field.m_extra_debt_mortgage', 'field.n_checking_savings_cash', 'field.o_retirement_accounts', 'field.o_brokerage_hsa_529', 'field.o_property_business_other', 'field.p_mortgage_auto', 'field.p_cards_student_other', 'field.q_assets_minus_debts', 'field.q_liquid_home_invested', 'field.r_score_utilization_collections', 'field.s_will_beneficiaries_poa', 'field.s_id_docs_umbrella', 'field.t_cash_buffer_debt_free', 'field.t_house_vehicle_travel_school', 'field.t_retirement_business', 'rec.once', 'rec.weekly', 'rec.days33', 'rec.month91', 'rec.yearly', 'section', 'field', 'timeline', 'ladder_title', 'stock_note'].map((k) => `fin.${k}`),
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
