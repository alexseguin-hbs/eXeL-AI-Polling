// Vision•2525 per-language downloads (operator 2026-08-20): every language page is a
// single-language document, and its download button delivers THAT language — all 33.
// Run: node tests/vision-lang-downloads.test.mjs
import { readFileSync, existsSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const DIR = new URL("../public/whitepaper/", import.meta.url).pathname;
const LANGS = ["ar","bn","cs","da","de","el","es","fi","fr","he","hi","id","it","ja","ko","ms","ne","nl","no","pa","pl","pt","ro","ru","sv","sw","th","tl","tr","uk","vi","zh"];

// ONE version source (Sofia D1, 2026-08-22): the living document IS the canon. versionAt()
// names the CURRENT major in its latest branch — the test derives V from it instead of
// hardcoding a literal that drifts. (r264: versionAt became a graduated band function; the
// current-version literal now lives in its `if (rev >= VMAX) return NN;` branch.)
const DOC = readFileSync(new URL("../../docs/SOI_VISION2525_LIVING_DOCUMENT.html", import.meta.url), "utf8");
const vm = DOC.match(/rev >= VMAX\)\s*return (\d+)/);
ok(!!vm, "living doc carries the versionAt canon (rev >= VMAX -> current major)");
const V = vm ? vm[1] : "??";
const EN_ATTACH = `SOI_VISION2525_v.${V}_LIVING_DOCUMENT.html" download="SOI_VISION2525_v.${V}_LIVING_DOCUMENT.html"`;

// English canonical: exists and downloads the canonical attachment
const en = readFileSync(`${DIR}vision-2525.html`, "utf8");
ok(en.includes(EN_ATTACH), `EN page downloads the canonical English attachment (v.${V})`);
ok(existsSync(`${DIR}SOI_VISION2525_v.${V}_LIVING_DOCUMENT.html`), "canonical attachment file exists");

ok(LANGS.length === 32, "32 non-English languages under test (33 with EN)");
for (const lc of LANGS) {
  const p = `${DIR}vision-2525.${lc}.html`;
  if (!existsSync(p)) { ok(false, `${lc}: page missing`); continue; }
  const s = readFileSync(p, "utf8");

  // single-language document: exactly one <html lang>, and it is this language
  const langAttrs = s.match(/<html lang="[a-z-]+"/g) || [];
  ok(langAttrs.length === 1 && langAttrs[0] === `<html lang="${lc}"`,
    `${lc}: single <html lang="${lc}"> (got ${langAttrs.join(",") || "none"})`);
  if (lc === "ar" || lc === "he") ok(/<html lang="[a-z]+" dir="rtl"/.test(s), `${lc}: dir="rtl"`);

  // the download button delivers THIS language, never the English attachment
  const own = `vision-2525.${lc}.html" download="SOI_VISION2525_v.${V}_${lc}.html"`;
  ok(s.includes(own), `${lc}: download anchor points to its own language file`);
  ok(!s.includes(EN_ATTACH), `${lc}: English attachment anchor absent`);

  // genuinely translated, not a byte-copy of English
  ok(s !== en && s.length !== en.length, `${lc}: differs from the English document`);
}

console.log(`\nvision-lang-downloads: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
