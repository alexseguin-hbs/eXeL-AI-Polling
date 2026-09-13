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
const AFTER_FILL = new Set(["arch.minipanel.minimize", "arch.minipanel.dock_back", "arch.minipanel.maximize", "arch.minipanel.collapse", "arch.minipanel.drag_to_resize", "arch.panels2.sim_deterministic_note", "arch.panels2.time_donated_note", "arch.panels2.why_south_glazing", "arch.panels2.every_decision_recorded", "arch.panels2.knowledge_graph", "arch.panels.each_pass_intelligence_cycle", "arch.panels.anyone_view_walk_comment", "arch.panels.add_comment_placeholder", "arch.panels.guidance_only_not_certified", "arch.soi.encourage_intelligence_growth_reimagine_innovation_incentives", "arch.soi.portable_identity_of_service", "arch.soi.time_capital", "arch.soi.learning_pts", "arch.program.building_program", "arch.program.room_volume", "arch.program.square_feet", "arch.program.rough_takeoff", "arch.fc_codes.forecast.timeline_trade_sequencing", "arch.fc_codes.forecast.monthly_forecast_cost_draw", "arch.fc_codes.forecast.deterministic_schedule", "arch.fc_codes.codes.design_to_standards", "arch.fc_codes.codes.choose_one_or_more", "arch.fc_codes.codes.no_standard_selected", "arch.right_compass.right_panel.active_elements", "arch.right_compass.right_panel.remove_from_house", "arch.right_compass.right_panel.selected_element", "arch.right_compass.compass.snap_north_up", "arch.right_compass.compass.compass", "arch.schem_misc.house_schematic.house_cross_section_assembling_from_chosen_components", "arch.schem_misc.architect_framing.robot_automatable_placement", "arch.schem_misc.earth_moon_box.toggle_sidereal_synodic", "arch.tiny.metric_strip.building_program_bedrooms_baths_sqft_electric_plumbing", "arch.tiny.mini_globe.earth_drag_l_r_no_zoom", "arch.tiny.sky_celestial.celestial_2525_master_design", "arch.tiny.tiny_floorplan.l_drag_pan_r_drag_rotate_pinch_zoom", "emsg.encoded_messaging", "emsg.compose_encode_send", "emsg.close", "emsg.clearance_level", "emsg.message_type", "emsg.sealed_message", "emsg.anonymous", "emsg.randomize", "emsg.enter_4_digit_pin", "emsg.give_your_recipient_pin", "emsg.a_different_way", "flower.bilingual_reader.highlight_color", "flower.flower_visualization.theme_analysis", "flower.flower_visualization.live_results_only", "flower.rotary_knob.previous_level", "flower.rotary_knob.next_level", "sec.small.fps_meter.frames_per_second", "sec.small.spectrum_picker.edit_custom_colour", "misc.light_codex_cube.light_codex", "misc.seed_coin.alvar_face", "misc.vision_2525_launcher.subtitle", "misc.master_of_thought.aria", "misc.celestial_reader.minimize", "misc2.trinity.divinity_guide_trinity", "misc2.experiences_landing.download_pdf", "misc2.lang_select.language"]);   // 2026-09-13 batch-4 tail keyify: English fallback until the translation fill lands next commit (listed, never silent)
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
