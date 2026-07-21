// SOI FRAMEWORK i18n CONTRACT lock (C1/C2) — guards the tr() mechanism in soi-section.tsx: the DEFAULT framework
// text renders through t() using lexicon keys whose englishDefault MUST mirror DEFAULT_SOI exactly (else the
// tr(cur===def?t(key):cur) equality silently fails and defaults stop translating). Also asserts every soi.* string is
// translated in all 32 non-English languages and the AI-law anchor survives. Run:
// node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/soi-i18n-contract.test.mjs
import { DEFAULT_SOI } from "../lib/soi-framework.ts";
import { DEFAULT_ENGLISH_TRANSLATIONS } from "../lib/lexicon-data.ts";
import { SEEDED_TRANSLATIONS } from "../lib/lexicon-translations.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── DEFAULT_SOI structural invariants (the Overview SPIRAL + Tri-Coin depend on these) ──
ok(DEFAULT_SOI.coins.length === 3, "DEFAULT_SOI has 3 coins");
ok(DEFAULT_SOI.nose.length === 4, "DEFAULT_SOI has 4 NOSE entries");
ok(DEFAULT_SOI.flow.length === 4, "DEFAULT_SOI has 4 flow entries");
const byKey = Object.fromEntries(DEFAULT_SOI.coins.map((c) => [c.key, c]));
ok(byKey.SI.name === "Shared Intention" && byKey.HI.name === "Human Intelligence" && byKey.AI.name === "Artificial Intelligence", "coin names intact (SPIRAL anchor)");
ok(byKey.AI.law.includes("1 min SI = 5 ◬"), "AI law keeps the '1 min SI = 5 ◬' anchor");

// ── build the (lexicon key → expected DEFAULT_SOI value) contract dynamically so it stays in sync ──
const pairs = [["soi.thesis", DEFAULT_SOI.thesis]];
for (const c of DEFAULT_SOI.coins) pairs.push([`soi.coin.${c.key}.name`, c.name], [`soi.coin.${c.key}.law`, c.law], [`soi.coin.${c.key}.purpose`, c.purpose]);
for (const f of DEFAULT_SOI.flow) { const s = f.k.toLowerCase(); pairs.push([`soi.flow.${s}.k`, f.k], [`soi.flow.${s}.d`, f.d]); }
for (const n of DEFAULT_SOI.nose) { const s = n.k.toLowerCase(); pairs.push([`soi.nose.${s}.k`, n.k], [`soi.nose.${s}.d`, n.d]); }
const SOI_KEYS = pairs.map(([k]) => k).concat(["soi.section.flow", "soi.section.nose"]);

// ── englishDefault MUST mirror DEFAULT_SOI (the tr() equality contract) ──
let mirror = true;
for (const [key, val] of pairs) {
  const entry = DEFAULT_ENGLISH_TRANSLATIONS[key];
  if (!entry) { ok(false, `missing lexicon key ${key}`); mirror = false; continue; }
  if (entry.englishDefault !== val) { ok(false, `englishDefault drift for ${key}: "${entry.englishDefault}" !== DEFAULT_SOI "${val}"`); mirror = false; }
}
ok(mirror, "every soi.* englishDefault mirrors DEFAULT_SOI exactly (tr() contract holds)");
ok(!!DEFAULT_ENGLISH_TRANSLATIONS["soi.section.flow"] && !!DEFAULT_ENGLISH_TRANSLATIONS["soi.section.nose"], "section header keys registered");

// ── all soi.* keys are cubeId 8 (SoI / Tri-Coin group) ──
ok(SOI_KEYS.every((k) => DEFAULT_ENGLISH_TRANSLATIONS[k]?.cubeId === 8), "all soi.* keys in the cubeId-8 group");

// ── every non-English language translates every soi.* key (non-empty) + keeps the AI-law anchor ──
const langs = Object.keys(SEEDED_TRANSLATIONS);
ok(langs.length >= 32, `≥32 non-English language blocks present (${langs.length})`);
let covered = 0, anchorHeld = 0;
for (const lang of langs) {
  const block = SEEDED_TRANSLATIONS[lang] || {};
  const missing = SOI_KEYS.filter((k) => typeof block[k] !== "string" || !block[k].trim());
  if (missing.length === 0) covered++; else ok(false, `${lang} missing soi keys: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`);
  if (typeof block["soi.coin.AI.law"] === "string" && block["soi.coin.AI.law"].includes("1 min SI = 5 ◬")) anchorHeld++;
}
ok(covered === langs.length, `all ${langs.length} languages translate all ${SOI_KEYS.length} soi.* keys`);
ok(anchorHeld === langs.length, `AI-law anchor "1 min SI = 5 ◬" preserved in all ${langs.length} languages`);

console.log(`\nSOI-I18N-CONTRACT ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
