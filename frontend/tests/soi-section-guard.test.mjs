// SOI SECTION source-guard — locks the modal-top presentation contract in soi-section.tsx:
//   S1: the SoITrinity ring glyphs are enlarged via an explicit fontSize prop (isolated to this
//       call site, so the homepage/divinity SoITrinity keep the default) — NOT the header/sub-header.
//   S2 (added with the i18n slice): the in-card header + "Tri-Coin" sub-header route through t().
// Run: node tests/soi-section-guard.test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, "..", "components", "soi-section.tsx"), "utf8");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── S1: ring glyphs enlarged (fontSize passed to the SoITrinity call) ──
ok(/<SoITrinity\b[^>]*\bfontSize=\{1[4-9]\}/.test(src),
  "SoITrinity is invoked with an explicit enlarged fontSize (14-19) — ring glyphs bigger, isolated call site");
ok(/labels=\{\["웃", "♡", "◬"\]\}/.test(src), "the 3 Tri-Coin glyph labels are still passed to the rings");

// ── S2: top strings routed through t() for cross-cultural readability (were hardcoded English) ──
ok(/\{t\("shared\.nav\.soi_title"\)\}/.test(src), "in-card header renders via t(\"shared.nav.soi_title\")");
ok(/\{t\("soi\.tricoin"\)\}/.test(src), "the \"Tri-Coin\" sub-header renders via t(\"soi.tricoin\")");
ok(!/<span>System of Innovation<\/span>/.test(src), "no hardcoded-English \"System of Innovation\" literal remains in the card header");

// S2: the soi.tricoin lexicon key exists (cubeId 8) so the fallback chain has an englishDefault
const lex = readFileSync(join(__dirname, "..", "lib", "lexicon-data.ts"), "utf8");
ok(/key:\s*"soi\.tricoin"[^}]*cubeId:\s*8/.test(lex), "soi.tricoin key registered in the cubeId-8 group");

console.log(`\nSOI-SECTION-GUARD ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
