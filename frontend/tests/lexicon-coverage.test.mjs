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
const AFTER_FILL = new Set([
  // Drone-2525 operator deck (r.050): TARGET → amber, APPROVE → red. English until the fill lands.
  'drone.game.target',
  'drone.game.approve',
  // Drone-2525 ladder, self-test, flight and crew keys — English until the fill lands, listed never silent.
  'drone.mot',
  'drone.hal',
  'drone.hal_auto',
  'drone.selfcal.title',
  'drone.selfcal.lead',
  'drone.selfcal.start',
  'drone.selfcal.stop',
  'drone.selfcal.budget',
  'drone.selfcal.minutes',
  'drone.selfcal.plan',
  'drone.selfcal.reference',
  'drone.selfcal.elapsed',
  'drone.selfcal.tried',
  'drone.selfcal.held',
  'drone.selfcal.failed',
  'drone.selfcal.save',
  'drone.selfcal.asked',
  'drone.game.no_reachable',
  'crew.title',
  'crew.lead',
  'crew.take.pilot',
  'crew.take.targeteer',
  'crew.seat.pilot',
  'crew.seat.targeteer',
  'crew.you_are.pilot',
  'crew.you_are.targeteer',
  'crew.pilot_does',
  'crew.targeteer_does',
  'crew.send_other',
  'crew.show',
  'crew.hide',
  'crew.copy',
  'crew.leave',
  'crew.solo',
  'crew.waiting',
  'crew.paths',
  'crew.path.cloud',
  'crew.path.tab',
  'crew.path.store',
  'si.title',
  'si.on',
  'si.off',
  'si.placeholder',
  'si.lead',
  'si.authority',
  'si.group',
  'si.add_examples',
  'si.remove',
  'si.issue',
  'si.expires',
  'si.minutes',
  'si.expired',
  'si.show_qr',
  'si.hide_qr',
  'si.copy',
  'si.only_these',
  'si.question',
  'si.choice.approve',
  'si.choice.hold',
  'si.choice.abstain',
  'si.volunteer',
  'si.no_call',
  'si.advice',
  'si.recognised',
  'si.ladder',
  'si.not_a_balance',
  'si.not_yet',
  'si.when_off',
  'si.quorum_note',
  'drone.crew.hi_pilot',
  'drone.crew.ai_pilot',
  'drone.crew.both_ai',
  'drone.crew.seats',
  'drone.crew.person',
  'drone.crew.machine',
  'drone.crew.flies',
  'drone.crew.aims',
  'drone.crew.gate_on',
  'drone.crew.gate_note',
  'drone.crew.approve',
  'drone.crew.hold',
  'drone.crew.approved',
  'drone.crew.held',
  'drone.crew.refused',
  'drone.crew.ai_looking',
  'drone.crew.ai_aiming',
  'drone.crew.ai_claim',
  'drone.fly.takeoff',
  'drone.fly.land',
  'drone.fly.to_wing',
  'drone.fly.to_quad',
  'drone.fly.body',
  'drone.fly.head',
  'drone.fly.help',
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
