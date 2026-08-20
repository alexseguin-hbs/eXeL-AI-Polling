// Atlantis Accords — live viewer ↔ sealed download parity (operator 2026-08-20:
// "anytime the website updates, it's saved for the download file … should match exactly").
//
// The package is built AT CLICK TIME from ACCORD_TRANSLATIONS — the same module the
// viewer renders — so content always tracks the deployed site. The one drift risk is
// the package's EMBEDDED READER diverging from the viewer UI (exactly how the 999 tier
// shipped live but not in downloads). This guard fails the build on any such drift.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/atlantis-package-parity.test.mjs
import { readFileSync } from "node:fs";
import { buildAtlantisPackageHtml, generateSealCode } from "../lib/atlantis-package.ts";
import { ACCORD_TRANSLATIONS, ACCORD_LANG_NAMES, ACCORD_SECTIONS_EN } from "../lib/atlantis-accord-data.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const viewerSrc = readFileSync(new URL("../components/atlantis-accord-viewer.tsx", import.meta.url), "utf8");

// ── the viewer's word-tier contract, parsed from its source ───────────────────────
const tierListM = viewerSrc.match(/\(\[([\d,\s]+)\] as Tier\[\]\)/);
ok(!!tierListM, "viewer declares its tier list ([...] as Tier[])");
const viewerTiers = tierListM ? tierListM[1].split(",").map((s) => +s.trim()) : [];
ok(viewerTiers.join(",") === "33,111,333,999", `viewer tiers are 33,111,333,999 (got ${viewerTiers.join(",")})`);

const strokes = {};
for (const t of viewerTiers) {
  const m = viewerSrc.match(new RegExp(`${t}:\\s*\\{[^}]*stroke:\\s*"(#[0-9a-fA-F]{6})"`));
  if (m) strokes[t] = m[1];
}
ok(Object.keys(strokes).length === viewerTiers.length, "viewer TIER_COLORS has a stroke per tier");

// ── build a REAL package from the live data (what the scroll icon does) ───────────
const html = await buildAtlantisPackageHtml(ACCORD_TRANSLATIONS, ACCORD_LANG_NAMES, "en", generateSealCode(1), 1, "parity-test");
ok(html.length > 100_000, "package builds from the live ACCORD_TRANSLATIONS");

// reader offers the same tiers…
ok(html.includes(`[${viewerTiers.join(",")}]`), `package reader offers the same tier row [${viewerTiers.join(",")}]`);
// …in the same colors (exact match, per the operator)
for (const t of viewerTiers) {
  ok(strokes[t] && html.includes(`${t}:'${strokes[t]}'`), `package tier ${t} color matches viewer exactly (${strokes[t]})`);
}
// …with the same 999 fallback the viewer uses (current language → English 999 → 333)
ok(html.includes("function c999"), "package carries the c999 English-fallback (matches viewer fallback)");
ok(html.includes("tier===999?(c999(sec)"), "package render() resolves 999 through the fallback chain");

// ── content parity: the data both surfaces read is complete ───────────────────────
ok(ACCORD_TRANSLATIONS.en === ACCORD_SECTIONS_EN, "package + viewer share ONE data source (ACCORD_TRANSLATIONS.en is ACCORD_SECTIONS_EN)");
for (const s of ACCORD_SECTIONS_EN) {
  ok([7, 33, 111, 333, 999].every((t) => typeof s.content[t] === "string" && s.content[t].length > 0),
    `EN section "${s.id}" carries all five tiers (7/33/111/333/999)`);
}

// ── the sacred counts: EN tiers are EXACTLY their names (operator hard requirement) ──
// The brand bullet in "Vision • 2525" is a glyph, not a word — excluded so the
// branding (operator 2026-08-21) never disturbs the sacred counts. Em-dashes etc.
// keep counting exactly as they did when the tiers were tuned.
const words = (t) => t.trim().split(/\s+/).filter((w) => w !== "•").length;
for (const s of ACCORD_SECTIONS_EN) {
  for (const t of [33, 111, 333, 999]) {
    ok(words(s.content[t]) === t, `EN "${s.id}" tier ${t} is EXACTLY ${t} words (got ${words(s.content[t])})`);
  }
}
// …and the citizen thread holds in every section
for (const s of ACCORD_SECTIONS_EN) {
  ok(/citizen/i.test(s.content[33] + s.content[111] + s.content[333] + s.content[999]),
    `EN "${s.id}" carries the citizen thread`);
}

// ── all 33 languages complete in the download (operator 2026-08-20) ────────────────
// The standalone package embeds ACCORD_TRANSLATIONS wholesale: every language must
// carry all 7 sections × all 5 tiers (7/33/111/333/999), genuinely translated.
const measure = (t) => Math.max((t || "").trim().split(/\s+/).filter(Boolean).length,
  Math.floor((t || "").replace(/\s/g, "").length / 3));   // CJK/Thai have no word spaces
const allLangs = Object.keys(ACCORD_TRANSLATIONS);
ok(allLangs.length === 33, `download embeds 33 languages (got ${allLangs.length})`);
for (const [lc, secs] of Object.entries(ACCORD_TRANSLATIONS)) {
  let bad = null;
  if (!Array.isArray(secs) || secs.length !== 7) bad = `sections=${secs?.length}`;
  else for (const s of secs) {
    for (const t of [7, 33, 111, 333, 999]) {
      // the 7-word petal is tiny — in compact scripts (ja/zh/ar/he) it can measure ~2-4
      if (measure(s.content[t]) < (t === 7 ? 2 : 5)) { bad = `${s.id}:${t} empty`; break; }
    }
    if (!bad && lc !== "en" && s.content[999].trim() === ACCORD_SECTIONS_EN.find((e) => e.id === s.id).content[999].trim())
      bad = `${s.id}:999 untranslated`;
    if (bad) break;
  }
  ok(!bad, `${lc}: all 7 sections × 5 tiers complete + translated${bad ? ` (${bad})` : ""}`);
}

// ── drawn house, never the emoji (operator 2026-08-20) ────────────────────────────
// 🏠 in the tier text is a counted placeholder; BOTH surfaces must render the drawn
// Vision-2525 house (path M3 11.5 12 4l9 7.5) in its place.
const HOUSE_PATH = "M3 11.5 12 4l9 7.5";
ok(viewerSrc.includes(HOUSE_PATH) && /function AccordBody/.test(viewerSrc) && /<AccordBody text=/.test(viewerSrc),
  "viewer substitutes 🏠 with the drawn Vision-2525 house (AccordBody)");
ok(html.includes(HOUSE_PATH) && html.includes("replace(/🏠/g,HOUSE)"),
  "package reader substitutes 🏠 with the same drawn house");
ok(ACCORD_SECTIONS_EN.some((s) => [33, 111, 333, 999].some((t) => s.content[t].includes("🏠"))),
  "the 🏠 placeholder exists in the EN tiers (so the substitution is exercised)");

// ── the viewer builds downloads from the live module at click time ────────────────
ok(/buildAtlantisPackageHtml\(ACCORD_TRANSLATIONS,/.test(viewerSrc),
  "viewer builds the download from ACCORD_TRANSLATIONS at click time (site update ⇒ next download updates)");
// …and every download is stamped with its generation moment (encoded into the
// cover's Light Codex + carried as codexDate/cstTime in the sealed payload)
const pkgSrc = readFileSync(new URL("../lib/atlantis-package.ts", import.meta.url), "utf8");
ok(/centralStamp\(new Date\(\)\)/.test(pkgSrc) && /codexDate: date, cstTime: time/.test(pkgSrc),
  "every download is date-stamped at generation (centralStamp → codexDate/cstTime)");

console.log(`\natlantis-package-parity: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
