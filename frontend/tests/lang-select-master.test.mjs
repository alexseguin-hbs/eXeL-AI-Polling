// The Experiences language dropdown IS the master globe (operator 2026-09-15). Locks: lang-select delegates
// to LanguageGlobe and carries no private pinned list / sort of its own; the master pins EN · ES · FR.
import fs from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const ls = fs.readFileSync(new URL("../components/experiences/lang-select.tsx", import.meta.url), "utf8");
ok(/import \{ LanguageGlobe \} from "@\/components\/language-globe"/.test(ls) && /<LanguageGlobe\b/.test(ls), "lang-select renders the master LanguageGlobe");
ok(!/PINNED\s*=|localeCompare|nameNative/.test(ls), "lang-select has no private pinned list, sort or row markup");
const utils = fs.readFileSync(new URL("../lib/language-utils.ts", import.meta.url), "utf8");
ok(/PINNED_LANGUAGE_CODES = \["en", "es", "fr"\]/.test(utils), "master pins EN · ES · FR");
const globe = fs.readFileSync(new URL("../components/language-globe.tsx", import.meta.url), "utf8");
ok(/getSortedLanguages\(languages\)/.test(globe) && /\{lang\.code\}/.test(globe) && /\{lang\.nameNative\}/.test(globe) && /\(\{lang\.nameEn\}\)/.test(globe), "master rows read CODE • Native (English)");
console.log(`lang-select-master: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
