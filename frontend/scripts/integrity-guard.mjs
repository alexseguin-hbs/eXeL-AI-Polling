#!/usr/bin/env node
// Integrity guard — blocks the class of local injection that hit postcss.config.js
// (2026-07-09: obfuscated require-hijack loader hidden on line 6 behind a whitespace pad).
// Runs before `dev`/`build` and on every commit. Fails HARD (exit 1) on any match so an
// injected payload cannot ride into a run or a commit unnoticed. Not "unhackable" — nothing
// is — but this exact vector (append obfuscated code to a JS config/source file) is now caught.
import { readFileSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { readdirSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build", "out", ".turbo", "coverage", "test-results", "playwright-report"]);
const SCAN_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json"]);
const CONFIG_HINT = /(config|middleware|\.eslintrc|babel|setup)/i;

// Injection signatures — each is a strong indicator of an obfuscated loader / require-hijack.
const SIGNATURES = [
  { re: /global\s*\[\s*['"`]!['"`]\s*\]\s*=/, why: "sets a global via a punctuation key (obfuscator bootstrap)" },
  { re: /global\s*\[\s*_\$?_?[A-Za-z0-9]/, why: "assigns/reads global via an obfuscated identifier" },
  { re: /\]\s*=\s*require\s*;\s*if\s*\(\s*typeof\s+module/, why: "hijacks require through a global alias" },
  { re: /String\.fromCharCode\(\s*127\s*\)/, why: "builds a control-char delimiter used by string obfuscators" },
  { re: /\bnew\s+Function\s*\(\s*[A-Za-z_$][\w$]*\s*,\s*[A-Za-z_$]/, why: "constructs a function from runtime strings (dropper)" },
  { re: /\beval\s*\(\s*(atob|Buffer\.from|[A-Za-z_$][\w$]*\()/, why: "eval of decoded/dynamic content" },
];
// Oversized single line in a config/entry file = payload hidden behind whitespace padding.
const MAX_CONFIG_LINE = 2000;

const findings = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!SCAN_EXT.has(extname(name))) continue;
    scan(p);
  }
}

function scan(path) {
  let text;
  try { text = readFileSync(path, "utf8"); } catch { return; }
  const rel = path.replace(ROOT, "");
  const lines = text.split("\n");
  const isConfig = CONFIG_HINT.test(basename(path));
  lines.forEach((line, i) => {
    if (isConfig && line.length > MAX_CONFIG_LINE) {
      findings.push({ rel, line: i + 1, why: `config line ${line.length} chars > ${MAX_CONFIG_LINE} (payload hidden behind whitespace?)` });
    }
    for (const sig of SIGNATURES) {
      if (sig.re.test(line)) findings.push({ rel, line: i + 1, why: sig.why });
    }
  });
}

walk(ROOT);
// This guard file itself contains the signatures as regex literals — exclude self-matches.
const real = findings.filter((f) => !f.rel.endsWith("scripts/integrity-guard.mjs"));

if (real.length) {
  console.error("\n[41m[1m INTEGRITY GUARD: possible code injection detected [0m");
  for (const f of real) console.error(`  [31m✗[0m ${f.rel}:${f.line} — ${f.why}`);
  console.error("\nBuild/commit BLOCKED. If this is a real payload, restore the clean file and rotate any local credentials.");
  console.error("If it is a genuine false positive, adjust scripts/integrity-guard.mjs deliberately.\n");
  process.exit(1);
}
console.log("[32m✓[0m integrity-guard: no injection signatures found");
