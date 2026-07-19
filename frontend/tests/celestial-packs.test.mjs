// CELESTIAL-2525 language-pack lock — every shipped celestial-guide-<code>.json is complete + wired.
// Run: node --experimental-strip-types tests/celestial-packs.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../lib");
const IDS = ["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "polaris"];
const CODES = ["ar", "de", "es", "fr", "he", "hi", "it", "ja", "pt", "ru", "uk", "zh"];

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };

// The loader registry (source) must reference every code (kept in sync with the shipped packs).
const loaderSrc = fs.readFileSync(path.join(LIB, "use-celestial-content.ts"), "utf8");

for (const code of CODES) {
  const file = path.join(LIB, `celestial-guide-${code}.json`);
  if (!fs.existsSync(file)) { ok(false, `pack exists: ${code}`); continue; }
  let pack;
  try { pack = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { ok(false, `pack parses: ${code} (${e.message})`); continue; }
  const complete = IDS.every((id) => pack[id] && typeof pack[id].kids === "string" && pack[id].kids.trim() && typeof pack[id].middle === "string" && pack[id].middle.trim());
  ok(complete, `pack ${code}: all 12 bodies have non-empty kids + middle`);
  ok(loaderSrc.includes(`celestial-guide-${code}.json`), `loader registered: ${code}`);
}

console.log(`\nCELESTIAL-PACKS ${pass}/${pass + fail} passed  (${CODES.length} languages)`);
if (fail > 0) process.exit(1);
