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
const AFTER_FILL = new Set(["atlantis.dl_pkg_title", "atlantis.dl_pkg_aria", "atlantis.accords_title", "atlantis.qr_scan_share_title", "atlantis.qr_website_aria", "atlantis.close", "atlantis.previous", "atlantis.shareable_package", "atlantis.sender_placeholder", "atlantis.clearance_levels", "atlantis.seal_strength", "atlantis.choose_how_share", "atlantis.share_file_title", "atlantis.share_link_title", "atlantis.any_device_iphone", "atlantis.copy_link", "atlantis.opens_any_device", "atlantis.encrypted_stored_note", "atlantis.opens_once", "atlantis.seals_after_closed", "atlantis.scan_to_open", "atlantis.exit_fullscreen_qr", "atlantis.fullscreen_qr", "atlantis.copy_accords_link_aria", "divinity.reward_hi_token_full", "divinity.close", "divinity.share_qr_title", "divinity.loom_download_png", "divinity.loom_inscribe_cipher", "divinity.loom_return_origin", "divinity.loom_close", "divinity.loom_arc_select_placeholder", "divinityArx.expand_panel", "divinityArx.back_to_flowers", "divinityArx.item_name_placeholder", "divinityArx.identifiers_placeholder", "divinityArx.description_placeholder", "divinityArx.scan_nfc_chip", "divinityArx.search_by_item_name", "divinityArx.no_items_found", "divinityArx.item_loading", "divinityArx.item_buyer_name_ph", "divinityArx.item_buyer_contact_ph", "divinityArx.item_ownership_identifier_note", "divinityArx.item_sale_price_ph", "divinityArx.item_buyer_notes_ph", "divinityArx.item_powered_by_footer", "lexiconUi.approve", "lexiconUi.reject", "settings.humanitys_coordination_framework", "experiences.toggle_details", "experiences.close", "experiences.email_contact", "cubeDevSim.pop_out_rotate", "cubeDevSim.explode_assemble_blocks", "cubeDevSim.drag_rotate_zoom_explode", "cubeDevSim.drag_rotate_zoom", "soiSlide.fewer_than_two_versions", "soiSlide.compare_slide_versions", "soiSlide.before", "soiSlide.after", "soiSlide.same_version_pick_two", "soiSlide.no_differences", "soiSlide.what_changed", "soiSlide.meaning", "visionMot.back_to_full_document", "visionMot.author_title", "visionMot.master_of_thought", "visionMot.subtitle", "visionMot.extract_tooltip", "visionMot.extract_badge", "visionMot.full_document", "visionMot.download", "visionMot.open_full_screen", "visionMot.iframe_title", "feedback.snip_region_hint", "feedback.upload_screenshot_hint", "stripe.session_payment", "stripe.pricing_tier"]);   // 2026-09-13 batch-2 site-UX keyify: English fallback until the translation fill lands next commit (listed, never silent)
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
