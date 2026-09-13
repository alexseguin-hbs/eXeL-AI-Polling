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
const AFTER_FILL = new Set(["soi.pod.ui.exactly_three", "soi.pod.save_failed_device_warning", "soi.pod.ui.come_back_to_pod", "soi.pod.ui.settles_at_lc", "soi.pod.ui.enter_planned_hours", "soi.pod.ui.why_these_four", "soi.pod.ui.measurable_outcome", "soi.pod.ui.this_phone_only_sync", "soi.pod.ui.accepted_by_all_three", "soi.pod.ui.recommendations_for_lead", "soi.pod.ui.measurable_outcome_colon", "soi.pod.ui.clock_is_evidence", "soi.pod.ui.on_device_no_upload", "soi.pod.ui.all_three_before_witnessed", "soi.pod.ui.no_session_clocked", "soi.pod.ui.mult_time_currency_free", "soi.pod.ui.settles_at_uc", "soi.pod.ui.vintage_equal_rate", "soi.pod.ui.rate_greater_floor", "soi.pod.ui.d9_greater_default", "soi.pod.ui.source_settlement_table", "soi.pod.ui.accel_read_against_estimate", "soi.pod.ui.no_estimate_locked", "soi.pod.ui.locked_at", "soi.pod.ui.what_did_outcome_become", "soi.pod.ui.the_platform_clocked", "soi.pod.ui.self_audit_witness_before_settle", "soi.pod.ui.held_separately_recognition", "soi.pod.ui.never_for_hours_settle_yug", "soi.pod.ui.d9_per_person_greater", "soi.pod.ui.the_receipt", "soi.pod.ui.one_ledger_four_ways", "soi.pod.ui.synth_three_paragraphs", "soi.pod.ui.new_pod", "soi.pod.ui.white_paper_title", "vision2525.hero_title", "vision2525.humanity_coordination_framework", "vision2525.hero_subtitle", "vision2525.humanity_decides", "vision2525.technology_assists", "vision2525.trust_must_be_proven", "vision2525.nothing_scales_evidence", "vision2525.trinity_of_intelligences", "vision2525.trinity_tagline", "vision2525.trusted_progress_cycle", "vision2525.one_framework_many_capabilities", "vision2525.capabilities_tagline", "vision2525.white_paper_open_to_everyone", "vision2525.no_login", "vision2525.no_account", "vision2525.reads_offline", "vision2525.open_it", "vision2525.the_worlds_of", "vision2525.worlds_tagline", "vision2525.our_mission", "vision2525.building_future_inheriting", "vision2525.shared_intention_speed_of_thought", "api.speed_of_thought_tagline", "api.governance_engine_api", "api.use_cases", "api.view_code_example", "crs.matrix_title", "sim.live_rankings_propagate", "sim.iframe_moderator", "sim.iframe_user1", "workspace.close", "workspace.lede", "workspace.polling_unlocked", "workspace.polling_desc", "workspace.open_polling", "workspace.innovation_desc", "workspace.open_soi2525", "workspace.solution_brainstorm", "workspace.brainstorm_unavailable", "workspace.brainstorm_desc", "soiCrs.header_title", "soiCrs.every_version_kept", "soiCrs.col_user_story", "soiCrs.col_design_review", "soiCrs.same_version_notice", "join.youre_in_session", "join.in_session", "join.polling_is_live", "join.taking_you_to_question"]);   // 2026-09-13 batch-1 site-UX keyify: English fallback until the translation fill lands next commit (listed, never silent)
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
