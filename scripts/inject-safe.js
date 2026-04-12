#!/usr/bin/env node
/**
 * Safe translation injector — processes line-by-line.
 * Finds each `  lang: {` block's closing `  },` and inserts new translations before it.
 * Loads translation data from batch scripts' M/MISSING objects via inline require.
 */
const fs = require('fs');
const path = require('path');

const TRANSLATIONS_FILE = path.join(__dirname, '..', 'frontend', 'lib', 'lexicon-translations.ts');

// Merge all batches into one object
function loadBatchData(scriptPath) {
  const code = fs.readFileSync(scriptPath, 'utf8');
  // Extract the M or MISSING object from the script
  const match = code.match(/const (?:M|MISSING)\s*=\s*(\{[\s\S]*?\n\};)/m);
  if (!match) return {};
  try {
    // Evaluate the object literal
    return eval('(' + match[1].replace(/\};$/, '}') + ')');
  } catch (e) {
    console.error('Failed to parse', scriptPath, e.message);
    return {};
  }
}

const batchFiles = [
  'inject-translations.js',
  'inject-translations-b2.js',
  'inject-translations-b3.js',
  'inject-translations-b4.js',
  'inject-translations-b5.js',
  'inject-translations-b6.js',
];

let allTranslations = {};
for (const f of batchFiles) {
  const data = loadBatchData(path.join(__dirname, f));
  for (const [key, langs] of Object.entries(data)) {
    allTranslations[key] = { ...(allTranslations[key] || {}), ...langs };
  }
}
console.log(`Loaded ${Object.keys(allTranslations).length} translation keys from ${batchFiles.length} batches`);

// Read the translations file
const lines = fs.readFileSync(TRANSLATIONS_FILE, 'utf8').split('\n');
const LANGS = ['fr','es','de','it','pt','ru','nl','zh','ja','ko','ar','hi','bn','pa','th','vi','id','ms','tl','tr','pl','uk','ro','el','cs','sv','da','fi','no','he','sw','ne'];

// For each language, find its block boundaries and existing keys
const result = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Check if this is a language block start: "  xx: {"
  let matchedLang = null;
  for (const lang of LANGS) {
    if (line.match(new RegExp(`^  ${lang}: \\{`))) {
      matchedLang = lang;
      break;
    }
  }

  if (!matchedLang) {
    result.push(line);
    i++;
    continue;
  }

  // Found a language block. Collect all lines until the closing "  },"
  const blockStart = i;
  result.push(line);
  i++;

  const existingKeys = new Set();
  let depth = 1;

  while (i < lines.length && depth > 0) {
    const bline = lines[i];

    // Track braces
    for (const ch of bline) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }

    // Extract existing keys
    const km = bline.match(/^\s+"([^"]+)":\s*"/);
    if (km) existingKeys.add(km[1]);

    if (depth === 0) {
      // This is the closing line "  }," — inject new translations before it
      const newEntries = [];
      for (const [key, translations] of Object.entries(allTranslations)) {
        if (!existingKeys.has(key) && translations[matchedLang]) {
          const escaped = translations[matchedLang]
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
          newEntries.push(`    "${key}": "${escaped}"`);
        }
      }

      if (newEntries.length > 0) {
        // Add comma to last existing line if it doesn't have one
        if (result.length > 0) {
          const lastLine = result[result.length - 1];
          if (lastLine.match(/^\s+"[^"]+": "[^"]*"$/) && !lastLine.endsWith(',')) {
            result[result.length - 1] = lastLine + ',';
          }
        }
        result.push(...newEntries.map((e, idx) =>
          idx < newEntries.length - 1 ? e + ',' : e + ','
        ));
        console.log(`${matchedLang}: +${newEntries.length} translations (had ${existingKeys.size})`);
      }

      result.push(bline); // closing },
    } else {
      result.push(bline);
    }
    i++;
  }

  continue;
}

fs.writeFileSync(TRANSLATIONS_FILE, result.join('\n'), 'utf8');
console.log('\nAll translations injected safely.');
