#!/usr/bin/env node
/**
 * Divinity Guide Translation Validator
 *
 * SSSES Passes 3 & 4 — validates all translation JSON files for:
 *   - ID consistency: all files have identical IDs in identical order
 *   - Page sequence: chapter 13 pages are sequential (1-N) with no gaps/duplicates
 *   - Chapter consistency: chapter numbers match across all files
 *   - Entry count: all files have the same number of entries
 *   - No empty text: no entry has an empty or whitespace-only text field
 *   - Bilingual reader type sync: checks bilingual-reader.tsx DivinityLang includes all languages
 *
 * Run: node frontend/scripts/validate-divinity-translations.js
 */

const fs = require("fs");
const path = require("path");

const LIB = path.join(__dirname, "..", "lib");
const BILINGUAL_READER = path.join(__dirname, "..", "components", "flower-of-life", "bilingual-reader.tsx");
const PAGE_TSX = path.join(__dirname, "..", "app", "divinity-guide", "page.tsx");
const LANG_MODULE = path.join(__dirname, "..", "lib", "divinity-languages.ts");

// Derive language list from the shared divinity-languages.ts module (single source of truth)
function parseLangCodes() {
  if (!fs.existsSync(LANG_MODULE)) return null;
  const src = fs.readFileSync(LANG_MODULE, "utf8");
  const codes = [];
  const re = /code:\s*"([a-z]{2})"/g;
  let m;
  while ((m = re.exec(src)) !== null) codes.push(m[1]);
  return codes.length > 0 ? codes : null;
}

const langCodes = parseLangCodes() || ["en","es","uk","ru","zh","fa","he","pt","km","ne"];
const LANG_FILES = langCodes.map(code => ({
  code,
  file: code === "en" ? "divinity-pages.json" : `divinity-pages-${code}.json`,
}));

let errors = 0;
let warnings = 0;

function fail(msg) { errors++; console.error(`  FAIL: ${msg}`); }
function warn(msg) { warnings++; console.warn(`  WARN: ${msg}`); }
function pass(msg) { console.log(`  PASS: ${msg}`); }

// ── Load all files ──
console.log("\n=== Divinity Guide Translation Validator ===\n");

const allData = {};
for (const { code, file } of LANG_FILES) {
  const fp = path.join(LIB, file);
  if (!fs.existsSync(fp)) {
    fail(`Missing file: ${file}`);
    continue;
  }
  try {
    allData[code] = JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch (e) {
    fail(`Invalid JSON in ${file}: ${e.message}`);
  }
}

const en = allData["en"];
if (!en) { console.error("Cannot proceed without English base file."); process.exit(1); }

// ── Test 1: Entry count consistency ──
console.log("1. Entry count consistency");
const enCount = en.length;
for (const { code } of LANG_FILES) {
  if (!allData[code]) continue;
  if (allData[code].length !== enCount) {
    fail(`${code} has ${allData[code].length} entries, expected ${enCount}`);
  }
}
pass(`All files have ${enCount} entries`);

// ── Test 2: ID consistency (identical IDs in identical order) ──
console.log("2. ID consistency");
const enIds = en.map(p => p.id);
for (const { code } of LANG_FILES) {
  if (!allData[code] || code === "en") continue;
  const ids = allData[code].map(p => p.id);
  for (let i = 0; i < enIds.length; i++) {
    if (ids[i] !== enIds[i]) {
      fail(`${code} ID mismatch at index ${i}: expected "${enIds[i]}", got "${ids[i]}"`);
      break;
    }
  }
}
pass(`All ${LANG_FILES.length} files have matching IDs in order`);

// ── Test 3: Chapter number consistency ──
console.log("3. Chapter number consistency");
const enChapters = en.map(p => p.chapter);
for (const { code } of LANG_FILES) {
  if (!allData[code] || code === "en") continue;
  const chapters = allData[code].map(p => p.chapter);
  for (let i = 0; i < enChapters.length; i++) {
    if (chapters[i] !== enChapters[i]) {
      fail(`${code} chapter mismatch at index ${i} (id=${enIds[i]}): expected ${enChapters[i]}, got ${chapters[i]}`);
      break;
    }
  }
}
pass("Chapter numbers match across all files");

// ── Test 4: Page sequence for chapter 13 (sequential, no gaps, no duplicates) ──
console.log("4. Chapter 13 page sequence");
for (const { code } of LANG_FILES) {
  if (!allData[code]) continue;
  const ch13 = allData[code].filter(p => p.chapter === 13);
  const pages = ch13.map(p => p.page);
  for (let i = 0; i < pages.length; i++) {
    if (pages[i] !== i + 1) {
      fail(`${code} chapter 13 page sequence broken at index ${i}: expected ${i + 1}, got ${pages[i]}`);
      break;
    }
  }
}
pass("Chapter 13 pages sequential (1-N) in all files");

// ── Test 5: No empty text (Asar: empty-string check) ──
console.log("5. No empty text fields");
for (const { code } of LANG_FILES) {
  if (!allData[code]) continue;
  for (const entry of allData[code]) {
    if (!entry.text || !entry.text.trim()) {
      fail(`${code} entry "${entry.id}" has empty text`);
    }
  }
}
pass("No empty text fields found");

// ── Test 6: Shared language module (Krishna: single source of truth) ──
console.log("6. Shared divinity-languages.ts sync");
if (fs.existsSync(LANG_MODULE)) {
  const langSrc = fs.readFileSync(LANG_MODULE, "utf8");
  for (const { code } of LANG_FILES) {
    if (!langSrc.includes(`"${code}"`)) {
      fail(`divinity-languages.ts missing language "${code}"`);
    }
  }
  // Verify bilingual reader imports from shared module (not hardcoded type)
  if (fs.existsSync(BILINGUAL_READER)) {
    const brContent = fs.readFileSync(BILINGUAL_READER, "utf8");
    if (brContent.includes("from \"@/lib/divinity-languages\"") || brContent.includes("from '@/lib/divinity-languages'")) {
      pass("Bilingual reader imports DivinityLang from shared module");
    } else {
      fail("Bilingual reader does not import from @/lib/divinity-languages");
    }
  }
  pass("Shared language module includes all languages");
} else {
  warn("divinity-languages.ts not found — falling back to hardcoded list");
}

// ── Test 7: DIVINITY_TRANSLATIONS completeness (all languages present) ──
console.log("7. DIVINITY_TRANSLATIONS map completeness");
if (fs.existsSync(PAGE_TSX)) {
  const pageContent = fs.readFileSync(PAGE_TSX, "utf8");
  for (const { code } of LANG_FILES) {
    // Check the consolidated map has an entry for this language
    const pattern = new RegExp(`^\\s+${code}:\\s*\\{`, "m");
    // Look specifically within DIVINITY_TRANSLATIONS block
    const mapStart = pageContent.indexOf("const DIVINITY_TRANSLATIONS");
    if (mapStart === -1) {
      fail("DIVINITY_TRANSLATIONS map not found in page.tsx");
      break;
    }
    const mapBlock = pageContent.slice(mapStart, mapStart + 5000);
    if (!pattern.test(mapBlock)) {
      fail(`DIVINITY_TRANSLATIONS missing entry for "${code}"`);
    }
  }
  pass("DIVINITY_TRANSLATIONS has entries for all languages");
} else {
  warn("page.tsx not found");
}

// ── Test 8: SECTIONS_MAP completeness ──
console.log("8. SECTIONS_MAP completeness");
if (fs.existsSync(PAGE_TSX)) {
  const pageContent = fs.readFileSync(PAGE_TSX, "utf8");
  const sectionsStart = pageContent.indexOf("const SECTIONS_MAP");
  if (sectionsStart !== -1) {
    const sectionsBlock = pageContent.slice(sectionsStart, sectionsStart + 500);
    for (const { code } of LANG_FILES) {
      if (!sectionsBlock.includes(`${code}:`)) {
        fail(`SECTIONS_MAP missing entry for "${code}"`);
      }
    }
    pass("SECTIONS_MAP has entries for all languages");
  }
}

// ── Test 9: LANG_LOADERS completeness (dynamic imports) ──
console.log("9. LANG_LOADERS completeness");
if (fs.existsSync(PAGE_TSX)) {
  const pageContent = fs.readFileSync(PAGE_TSX, "utf8");
  const mapStart = pageContent.indexOf("const LANG_LOADERS");
  if (mapStart !== -1) {
    const mapBlock = pageContent.slice(mapStart, mapStart + 1500);
    for (const { code } of LANG_FILES) {
      if (!mapBlock.includes(`${code}:`)) {
        fail(`LANG_LOADERS missing entry for "${code}"`);
      }
    }
    pass("LANG_LOADERS has entries for all languages");
  } else {
    warn("LANG_LOADERS not found in page.tsx");
  }
}

// ── Summary ──
console.log(`\n=== Results: ${errors} errors, ${warnings} warnings ===`);
if (errors > 0) {
  console.error("VALIDATION FAILED");
  process.exit(1);
} else {
  console.log("ALL CHECKS PASSED");
  process.exit(0);
}
