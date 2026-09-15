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

// ── S3 (operator 2026-09-15 "make QIS legible"): the QIS block explains itself — inputs, formula,
//    growth, a worked example with the canon's numbers, and the firewall — never the bare symbol dump.
const qis = src.slice(src.indexOf("data-soi-section-qis"));
for (const k of ["lead", "r_def", "gp_def", "oi_def", "rd_def", "formula", "formula_note", "growth", "growth_note", "example_title", "example_start", "example_now", "example_delta", "firewall"])
  ok(qis.includes(`t("soi.qis.${k}")`), `QIS block renders soi.qis.${k}`);
ok(!/soi\.qis\.(spine|equation|note)/.test(src), "the old symbol-dump keys (spine/equation/note) are gone from the component");
ok(/QIS 175[\s\S]*QIS 525[\s\S]*ΔQIS \+350/.test(qis), "worked example carries the canon's numbers (175 → 525, ΔQIS +350; fund.reward r272)");
const en = (k) => (lex.match(new RegExp(`key:\\s*"${k.replace(/\./g, "\\.")}",\\s*englishDefault:\\s*"([^"]*)"`)) || [])[1] || "";
ok(en("soi.qis.formula").includes("(R + GP + OI + ERD) ÷ 4"), "soi.qis.formula is the canonical average of four");
ok(/Revenue/.test(en("soi.qis.r_def")) && /Gross Profit/.test(en("soi.qis.gp_def")) && /Operating Income/.test(en("soi.qis.oi_def")) && /Effective R&D/.test(en("soi.qis.rd_def")), "each input is expanded in words (Revenue · Gross Profit · Operating Income · Effective R&D)");
ok(/one-third/.test(en("soi.qis.rd_def")), "ERD explains the one-third-of-revenue recognition curve");
ok(/mints no 웃/.test(en("soi.qis.firewall")) && /M × hours/.test(en("soi.qis.firewall")) && /ownership/.test(en("soi.qis.firewall")), "firewall: mints no 웃 · 웃 = M × hours · QIS ≠ ownership");
ok(/not a percentage/.test(en("soi.qis.formula_note")), "formula note says QIS is a dollar amount, not a percentage");

console.log(`\nSOI-SECTION-GUARD ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
