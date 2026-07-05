// Generates frontend/public/seal.html — the STATIC, portable hosted reader for
// Atlantis universal links. Single-sourced from htmlTemplate() in
// lib/atlantis-package.ts: we extract the exact reader (style + body + IIFE)
// and swap the embedded <script id="pkg"> payload for a bootstrap that decodes
// the sealed payload from the URL #fragment. Re-run after editing the reader:
//   node scripts/gen-seal-html.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "lib", "atlantis-package.ts"), "utf8");

// Extract htmlTemplate's template literal (no nested backticks in the reader).
const fnIdx = src.indexOf("function htmlTemplate");
const start = src.indexOf("`", fnIdx);
const end = src.indexOf("`", start + 1);
if (fnIdx < 0 || start < 0 || end < 0) throw new Error("htmlTemplate literal not found");
let tpl = src.slice(start + 1, end);

// Resolve template-literal escapes to their runtime values (\\ -> \, etc.).
tpl = tpl.replace(/\\`/g, "`").replace(/\\\$/g, "$").replace(/\\\\/g, "\\");

// Empty the payload slot — the in-template universal launcher fetches the sealed
// ciphertext from Supabase by the short #hash (or decodes an inline #fragment).
const EMBED = '<script id="pkg" type="application/json">${pkgJson}</script>';
if (!tpl.includes(EMBED)) throw new Error("embedded pkg script tag not found");
tpl = tpl.replace(EMBED, '<script id="pkg" type="application/json"></script>');

// Bake the PUBLIC Supabase creds into the hosted reader so it can fetch the
// stored ciphertext. Left as tokens when env is absent (local dev) — the CF
// build injects the real values; the long-link fallback works either way.
if (process.env.NEXT_PUBLIC_SUPABASE_URL)
  tpl = tpl.replaceAll("__ATL_SB_URL__", process.env.NEXT_PUBLIC_SUPABASE_URL);
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  tpl = tpl.replaceAll("__ATL_SB_KEY__", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (tpl.includes("${")) throw new Error("unresolved interpolation remains: " + tpl.slice(tpl.indexOf("${"), tpl.indexOf("${") + 40));

// ── SSSES parse gate (Council of Twelve, 2026-07-05) ─────────────────────────
// A missing </script> once collapsed the entire reader into one SyntaxError'd
// block: tsc saw nothing, the build exited 0, and production shipped a dead
// unlock. This gate validates the artifact through its true consumer's eyes —
// the browser's HTML tokenizer (a script block ends at the FIRST </script>) —
// and hard-fails the build on any imbalance or unparseable block.
function validateScripts(html) {
  const opens = (html.match(/<script\b[^>]*>/g) ?? []).length;
  const closes = (html.match(/<\/script>/g) ?? []).length;
  if (opens !== closes)
    throw new Error(`SSSES gate: ${opens} <script> openers vs ${closes} </script> closers — unbalanced`);
  let pos = 0, n = 0;
  for (;;) {
    const m = /<script\b([^>]*)>/.exec(html.slice(pos));
    if (!m) break;
    const start = pos + m.index + m[0].length;
    const end = html.indexOf("</script>", start);
    if (end < 0) throw new Error("SSSES gate: unterminated <script> block");
    const body = html.slice(start, end);
    n++;
    // JSON payload slots are data, not JS; empty slots are fine.
    if (!/application\/json/.test(m[1]) && body.trim()) {
      try {
        new vm.Script(body);
      } catch (err) {
        throw new Error(`SSSES gate: script block ${n} does not parse — ${err.message}`);
      }
    }
    pos = end + "</script>".length;
  }
  return { blocks: n, opens, closes };
}
const gate = validateScripts(tpl);

writeFileSync(join(here, "..", "public", "seal.html"), tpl, "utf8");
console.log("wrote public/seal.html (" + tpl.length + " bytes) — SSSES gate: " + gate.blocks + " script blocks parsed, " + gate.opens + "/" + gate.closes + " tags balanced");
