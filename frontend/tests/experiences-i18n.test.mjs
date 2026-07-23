// EXPERIENCES i18n lock — every portfolio string resolves through the lexicon with an
// English default, and the operator-priority locale (French) is fully seeded so the
// /experiences + /experiences/docs pages render translated. Run:
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/experiences-i18n.test.mjs
import { DEFAULT_ENGLISH_TRANSLATIONS, CUBE_GROUPS } from "../lib/lexicon-data.ts";
import { SEEDED_TRANSLATIONS } from "../lib/lexicon-translations.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };

// 1. The experiences group is registered (cubeId 50, single group, no leaks).
const group = CUBE_GROUPS.find((g) => g.cubeId === 50);
ok(!!group && group.keys.length > 0, "experiences group registered in CUBE_GROUPS (cubeId 50)");
const KEYS = (group ? group.keys : []).map((k) => k.key);
ok(KEYS.every((k) => k.startsWith("experiences.")), "every cubeId-50 key is namespaced experiences.*");

// 2. Every experiences.* key has a non-empty English default (fallback base).
for (const k of KEYS) {
  const d = DEFAULT_ENGLISH_TRANSLATIONS[k]?.englishDefault;
  if (!(typeof d === "string" && d.trim().length > 0)) ok(false, `englishDefault present: ${k}`);
}
ok(KEYS.every((k) => (DEFAULT_ENGLISH_TRANSLATIONS[k]?.englishDefault || "").trim().length > 0),
  `all ${KEYS.length} experiences.* keys have an englishDefault`);

// 3. Static chrome + section keys exist (the visible page skeleton).
const CHROME = [
  "experiences.name", "experiences.landing.headline", "experiences.landing.open",
  "experiences.work.h1", "experiences.sec.writeups.intro", "experiences.sec.ip.title",
  "experiences.view", "experiences.download", "experiences.vignettes.title",
];
for (const k of CHROME) ok(KEYS.includes(k), `chrome/section key present: ${k}`);

// 4. IVAS intro accurately depicts the AI/ML components assessed (operator directive).
const ivas = DEFAULT_ENGLISH_TRANSLATIONS["experiences.sec.writeups.intro"]?.englishDefault || "";
ok(ivas.includes("IVAS") && /sensor fusion/i.test(ivas) && /OODA/.test(ivas),
  "writeups intro depicts IVAS + AI/ML components (sensor fusion, OODA)");

// 5. French (operator priority) covers EVERY experiences.* key with a non-empty string.
const fr = SEEDED_TRANSLATIONS.fr || {};
// experiences.egg.* are hidden easter-egg labels — English-only by design (fallback covers them).
const frKeys = KEYS.filter((k) => !k.startsWith("experiences.egg."));
const frMissing = frKeys.filter((k) => !(typeof fr[k] === "string" && fr[k].trim().length > 0));
ok(frMissing.length === 0, `French seeds all ${frKeys.length} experiences.* keys (missing: ${frMissing.length})`);

// 6. French actually translates prose (not just the English echo) on a known key.
ok((fr["experiences.landing.open"] || "") && fr["experiences.landing.open"] !== DEFAULT_ENGLISH_TRANSLATIONS["experiences.landing.open"].englishDefault,
  "French translates a prose key (landing.open differs from English)");

// 7. Proper nouns stay literal across locales (the name is not 'translated').
ok((fr["experiences.name"] || "") === "Alex Seguin", "proper noun kept literal in French (experiences.name)");

// 8. ALL 32 non-English app languages cover every experiences.* key (full 33-language render).
const LANGS32 = ["fr","es","de","it","pt","nl","ru","zh","ja","ko","ar","hi","bn","pa","th","vi","id","ms","tl","tr","pl","uk","ro","el","cs","sv","da","fi","no","he","sw","ne"];
// experiences.egg.* are hidden easter-egg labels — English-only by design (fallback covers them).
const COVERAGE_KEYS = KEYS.filter((k) => !k.startsWith("experiences.egg."));
const gaps = [];
for (const l of LANGS32) {
  const tr = SEEDED_TRANSLATIONS[l] || {};
  const miss = COVERAGE_KEYS.filter((k) => !(typeof tr[k] === "string" && tr[k].trim().length > 0));
  if (miss.length) gaps.push(`${l}:${miss.length}`);
}
ok(gaps.length === 0, `all 32 non-English locales cover every experiences.* key (gaps: ${gaps.join(" ") || "none"})`);

console.log(`\nEXPERIENCES-I18N ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
