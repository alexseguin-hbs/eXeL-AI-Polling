// Generates frontend/public/seal.html — the STATIC, portable hosted reader for
// Atlantis universal links. Single-sourced from htmlTemplate() in
// lib/atlantis-package.ts: we extract the exact reader (style + body + IIFE)
// and swap the embedded <script id="pkg"> payload for a bootstrap that decodes
// the sealed payload from the URL #fragment. Re-run after editing the reader:
//   node scripts/gen-seal-html.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

writeFileSync(join(here, "..", "public", "seal.html"), tpl, "utf8");
console.log("wrote public/seal.html (" + tpl.length + " bytes)");
