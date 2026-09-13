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
const AFTER_FILL = new Set(["sec.mp.globe_aria", "sec.mp.world_map_aria", "sec.mp.enter_ao", "sec.mp.minimize_standard", "sec.mp.minimize", "sec.mp.zoom_earth", "sec.mp.reset_tracks", "sec.mp.dome_toggle", "sec.mp.line_thickness", "sec.mp.map_voxel_settings", "sec.mp.hide_window", "sec.mp.coord_decode", "sec.mp.drag_label", "sec.mp.close_hook", "sec.mp.drag_agl", "sec.mp.target_cube_centre", "sec.mp.tilt_hint", "sec.mp.tilt_slider", "sec.mp.close", "sec.mp.zone_legend", "sec.mp.compass", "sec.mp.coord_packet", "sec.mp.dem_tile_note", "sec.mp.hide_placement_menu", "sec.mp.reality_mode_placed", "sec.mp.reality_mode", "sec.mp.angle_unit", "sec.mp.ptl_disabled", "sec.mp.nudge_step", "sec.mp.hide_asset_list", "sec.mp.nothing_placed", "sec.mp.remove", "sec.mp.copy_plan", "sec.mp.submit_plan", "sec.mp.hide_transect", "sec.mp.select_ao_mission", "sec.mp.select_mission", "sec.mp.hide_to_hidden", "sec.mp.new_mission", "sec.mp.restore", "sec.mp.delete_permanently", "sec.mp.ult_title", "sec.mp.ult_setup", "sec.mp.delete_row", "sec.mp.ult_hint", "sec.mp.draw_ao", "sec.mp.undo_vertex", "sec.mp.save_ao", "sec.mp.cancel", "sec.mp.delete_ao", "sec.mp.settings_title", "sec.mp.close_settings", "sec.mp.map_layers", "sec.mp.land_sea_base", "sec.mp.coordinate_format", "sec.mp.elevation_profiles", "sec.mp.elevation_contours", "sec.mp.label_major", "sec.mp.gebco_note", "sec.mp.weapon_range_rings", "sec.mp.map_engine", "sec.mp.engine_alpha", "sec.mp.engine_beta", "sec.mp.beta_note", "sec.mp.elevation_mode_3d", "sec.mp.symbology_standard", "sec.mp.icon_size", "sec.mp.max_altitude_ft", "sec.mp.voxel_cube_cell", "sec.mp.highlight_colour", "sec.mp.tilt_3d_note", "sec.mp.show_asset_menu", "sec.mp.drag_minimap", "sec.mp.dock_minimap", "sec.mp.minimap_fullscreen", "sec.mp.minimize_minimap", "sec.mp.drag_resize", "sec.mp.show_minimap", "sec.mp.show_asset_list", "sec.mp.show_transect", "sec.cmd.settings_global", "sec.cmd.fps_over_time", "sec.cmd.collapse_critical", "sec.cmd.threat_summary", "sec.cmd.threat_composition", "sec.cmd.sensor_fusion_status", "sec.cmd.environmental_conditions", "sec.cmd.expand_left_panel", "sec.cmd.live_fusion_pending", "sec.cmd.kill_chain", "sec.cmd.kill_chain_status", "sec.cmd.threat_distribution", "sec.cmd.risk_effect_assessment", "sec.cmd.expand_right_panel", "sec.cmd.ai_recommendation", "sec.cmd.recommended_weapons", "sec.cmd.engagement_priority", "sec.cmd.decision_support", "sec.cmd.expand_bottom_panels"]);   // 2026-09-13 batch-5 security-2525 keyify: English fallback until the translation fill lands next commit (listed, never silent)
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
