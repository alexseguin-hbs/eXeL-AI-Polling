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
ok(SIGN_KEYS.length === 11 && SIGN_KEYS.every((k) => en.has(k)), "all eleven keys exist in lexicon-data");
for (const [l, e] of Object.entries(SIGN_TRANSLATIONS)) {
  ok(SIGN_KEYS.every((k) => typeof e[k] === "string" && e[k].trim().length > 0), `${l}: every key present and non-empty`);
  // one loanword is allowed per language ("Download" IS the Danish word) — never a whole untranslated set
  ok(SIGN_KEYS.filter((k) => e[k] === en.get(k)).length <= 1, `${l}: at most one value equals the English default`);
  ok(["{sender}", "{title}", "{link}"].every((ph) => e["soi.sign.handoff.template"].includes(ph)), `${l}: hand-off template keeps {sender} {title} {link}`);
  ok(/eXeL AI Polling/.test(e["soi.sign.handoff.template"]) && /30|৩০|३०/.test(e["soi.sign.handoff.template"]), `${l}: template names the site and the 30-day expiry`);
}
console.log(`sign-i18n: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
