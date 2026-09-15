#!/usr/bin/env node
// Merge translated drone.* values into the lazy per-language app stores (lib/i18n-app/<code>.ts).
//
// INVARIANTS ASSERTED BEFORE ANY WRITE, so a bad batch refuses rather than persists:
//   · every one of the 32 languages is covered
//   · every language carries every key the master declares
//   · no value is empty, and no value is a verbatim copy of the English unless it is on the identical list
// Idempotent: a key already present in a store is replaced, never duplicated.
import fs from "node:fs";
import path from "node:path";

const BATCH_DIR = process.argv[2];
if (!BATCH_DIR) { console.error("usage: drone-i18n-merge.mjs <dir-with-batch*.json>"); process.exit(1); }

const master = {};
const PREFIX = process.env.DRONE_I18N_PREFIX ?? "drone.";
for (const m of fs.readFileSync("lib/lexicon-data.ts", "utf8").matchAll(/\{ key: "([^"]+)", englishDefault: "([^"]*)"/g)) if (m[1].startsWith(PREFIX)) master[m[1]] = m[2];
const KEYS = Object.keys(master);

const LANGS = fs.readdirSync("lib/i18n-app").filter((f) => f.endsWith(".ts") && f !== "index.ts").map((f) => f.replace(/\.ts$/, ""));
// A value may match English only when a human reviewed it and wrote down why, in the shared list the
// lexicon-coverage gate already reads. Scope is a language code, or "*" for every language.
const ALLOW_FILE = "../docs/asks/2026-09-12_lexicon_identical_allowed.psv";
const IDENTICAL_OK = new Set(
  fs.existsSync(ALLOW_FILE)
    ? fs.readFileSync(ALLOW_FILE, "utf8").split("\n").slice(1).filter(Boolean).map((l) => l.split("|").slice(0, 2).join("|"))
    : [],
);
const identicalAllowed = (lang, key) => IDENTICAL_OK.has(`${lang}|${key}`) || IDENTICAL_OK.has(`*|${key}`);

const merged = {};
for (const f of fs.readdirSync(BATCH_DIR).filter((f) => /^batch\d+\.json$/.test(f)).sort()) {
  const b = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, f), "utf8"));
  for (const [lang, rows] of Object.entries(b)) merged[lang] = { ...(merged[lang] ?? {}), ...rows };
}

const problems = [];
for (const lang of LANGS) {
  const rows = merged[lang];
  if (!rows) { problems.push(`${lang}: no translation supplied`); continue; }
  for (const k of KEYS) {
    const v = rows[k];
    if (typeof v !== "string" || !v.trim()) problems.push(`${lang}/${k}: empty`);
    else if (v.trim() === master[k].trim() && !identicalAllowed(lang, k)) problems.push(`${lang}/${k}: identical to English ("${v}")`);
  }
  for (const k of Object.keys(rows)) if (!KEYS.includes(k)) problems.push(`${lang}/${k}: not a master key`);
}
const extra = Object.keys(merged).filter((l) => !LANGS.includes(l));
for (const l of extra) problems.push(`${l}: not one of the app's languages`);

if (problems.length) {
  console.error(`drone-i18n-merge: REFUSED — ${problems.length} problems, nothing written:`);
  for (const p of problems.slice(0, 40)) console.error("  " + p);
  process.exit(1);
}

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
let written = 0;
for (const lang of LANGS) {
  const p = `lib/i18n-app/${lang}.ts`;
  let s = fs.readFileSync(p, "utf8");
  for (const k of KEYS) {
    const line = `  "${k}": "${esc(merged[lang][k])}",\n`;
    const re = new RegExp(`^  "${k.replace(/\./g, "\\.")}": .*\\n`, "m");
    s = re.test(s) ? s.replace(re, line) : s.replace(/\n\};\nexport default T;/, `\n${line}};\nexport default T;`);
  }
  fs.writeFileSync(p, s);
  written++;
}
console.log(`drone-i18n-merge: ${KEYS.length} keys × ${written} languages written`);
