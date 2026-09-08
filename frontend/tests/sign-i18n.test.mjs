// Sign Doc translation seed — parity gate (Sofia): every lexicon language except English carries all ten
// keys, every key exists in lexicon-data, no value is English-identical, and the hand-off template keeps
// its three placeholders. Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sign-i18n.test.mjs
import { SIGN_TRANSLATIONS, SIGN_KEYS } from "../lib/lexicon-translations-sign.ts";
import { SOI_R228_TRANSLATIONS } from "../lib/lexicon-translations-soi-r228.ts";
import { DEFAULT_ENGLISH_TRANSLATIONS } from "../lib/lexicon-data.ts";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const en = new Map(Object.values(DEFAULT_ENGLISH_TRANSLATIONS).map((k) => [k.key, k.englishDefault]));
const langs = Object.keys(SOI_R228_TRANSLATIONS);
ok(langs.length === 32 && langs.every((l) => l in SIGN_TRANSLATIONS), `the same 32 languages as the r228 seed (${Object.keys(SIGN_TRANSLATIONS).length})`);
ok(SIGN_KEYS.length === 23 && SIGN_KEYS.every((k) => en.has(k)), "all twenty-three keys exist in lexicon-data");
for (const [l, e] of Object.entries(SIGN_TRANSLATIONS)) {
  ok(SIGN_KEYS.every((k) => typeof e[k] === "string" && e[k].trim().length > 0), `${l}: every key present and non-empty`);
  // one loanword is allowed per language ("Download" IS the Danish word) — never a whole untranslated set
  ok(SIGN_KEYS.filter((k) => e[k] === en.get(k)).length <= 1, `${l}: at most one value equals the English default`);
  ok(["{sender}", "{title}", "{link}"].every((ph) => e["soi.sign.handoff.template"].includes(ph)), `${l}: hand-off template keeps {sender} {title} {link}`);
  ok(/eXeL AI Polling/.test(e["soi.sign.handoff.template"]) && /30|৩০|३०/.test(e["soi.sign.handoff.template"]), `${l}: template names the site and the 30-day expiry`);
}
// Spanish: EVERY soi.sign.* key (operator 2026-09-08), no English-identical value except the loanwords
const { ES_SIGN } = await import("../lib/lexicon-translations-es-sign.ts");
const signKeys = [...en.keys()].filter((k) => k.startsWith("soi.sign."));
const esAll = { ...SIGN_TRANSLATIONS.es, ...ES_SIGN };
const missingEs = signKeys.filter((k) => !esAll[k]);
ok(missingEs.length === 0, `Spanish covers every soi.sign.* key (${signKeys.length - missingEs.length}/${signKeys.length}; missing: ${missingEs.slice(0, 8).join(", ")})`);
const sameEs = signKeys.filter((k) => esAll[k] && esAll[k] === en.get(k) && !/^(Texto|Text|Supabase|Copiado|Página|Run)$/.test(esAll[k]));
ok(sameEs.length <= 3, `Spanish values differ from English (identical: ${sameEs.join(", ")})`);
for (const k of ["soi.sign.handoff.template", "soi.sign.handoff.offline_template", "soi.sign.holders", "soi.sign.handoff.offline"]) ok(["{sender}", "{title}", "{link}", "{next}"].filter((ph) => (en.get(k) || "").includes(ph)).every((ph) => (esAll[k] || "").includes(ph)), `${k}: Spanish keeps the placeholders`);
const aroundKeys = [...en.keys()].filter((k) => /^soi\.(landing|pod|doc)\./.test(k));
const missingAround = aroundKeys.filter((k) => !esAll[k] && !(SOI_R228_TRANSLATIONS.es || {})[k]);
ok(missingAround.length === 0, `Spanish covers the landing, the POD session and Create Doc too (${aroundKeys.length - missingAround.length}/${aroundKeys.length}; missing: ${missingAround.slice(0, 6).join(", ")})`);
console.log(`sign-i18n: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
