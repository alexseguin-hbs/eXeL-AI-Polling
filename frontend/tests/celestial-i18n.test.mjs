// CELESTIAL-2525 i18n lock — every reader string resolves through the lexicon with an English default.
// Run: node --experimental-strip-types tests/celestial-i18n.test.mjs
import { DEFAULT_ENGLISH_TRANSLATIONS, CUBE_GROUPS } from "../lib/lexicon-data.ts";
import { CELESTIAL_BODIES, CELESTIAL_GROUPS, READING_LEVELS } from "../lib/celestial-guide-data.ts";
import { CELESTIAL_CONTENT_LOCALES } from "../lib/use-celestial-content.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };
const has = (k) => typeof DEFAULT_ENGLISH_TRANSLATIONS[k]?.englishDefault === "string" && DEFAULT_ENGLISH_TRANSLATIONS[k].englishDefault.trim().length > 0;

// 1. The celestial group is registered.
ok(CUBE_GROUPS.some((g) => g.cubeId === 30 && g.keys.length > 0), "celestial group registered in CUBE_GROUPS (cubeId 30)");

// 2. Static chrome keys exist with English defaults.
const CHROME = ["celestial.product", "celestial.tagline", "celestial.linkSecure", "celestial.tapHint", "celestial.readingLevel", "celestial.guidedBy", "celestial.footer"];
for (const k of CHROME) ok(has(k), `chrome key has englishDefault: ${k}`);

// 3. The {master} placeholder is present in the byline key (interpolation contract).
ok(DEFAULT_ENGLISH_TRANSLATIONS["celestial.guidedBy"].englishDefault.includes("{master}"), "celestial.guidedBy carries {master} placeholder");

// 4. Every reading level has a label key.
for (const l of READING_LEVELS) ok(has("celestial.level." + l.id), `level key: celestial.level.${l.id}`);

// 5. Every group has a label key.
for (const g of CELESTIAL_GROUPS) ok(has("celestial.group." + g.id), `group key: celestial.group.${g.id}`);

// 6. Every one of the 12 bodies has a name key.
ok(CELESTIAL_BODIES.length === 12, "12 celestial bodies present");
for (const b of CELESTIAL_BODIES) ok(has("celestial.body." + b.id), `body name key: celestial.body.${b.id}`);

// 7. Body-prose scaffold always includes English as the fallback base.
ok(CELESTIAL_CONTENT_LOCALES.includes("en"), "body-prose scaffold includes English base locale");

console.log(`\nCELESTIAL-I18N ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
