// CELESTIAL-2525 language-pack lock — every REGISTERED celestial-guide-<code>.json is complete (all 12
// bodies × all 4 reading tiers: kids · middle · high(333) · adult(999)) and every SUPPORTED language has
// a pack (English is the bundled base). Codes are DERIVED from the loader registry so the lock scales with
// the 33-language expansion automatically. Run: node --experimental-strip-types tests/celestial-packs.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../lib");
const IDS = ["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "polaris"];
const TIERS = ["kids", "middle", "high", "adult"];

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };

// Derive the registered codes from the loader registry (single source of truth).
const loaderSrc = fs.readFileSync(path.join(LIB, "use-celestial-content.ts"), "utf8");
const CODES = [...loaderSrc.matchAll(/^\s+([a-z]{2}):\s*\(\)\s*=>\s*import\("\.\/celestial-guide-([a-z]{2})\.json"\)/gm)].map((m) => m[1]);
ok(CODES.length >= 32, `loader registry has ≥32 packs (found ${CODES.length})`);

for (const code of CODES) {
  const file = path.join(LIB, `celestial-guide-${code}.json`);
  if (!fs.existsSync(file)) { ok(false, `pack exists: ${code}`); continue; }
  let pack;
  try { pack = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { ok(false, `pack parses: ${code} (${e.message})`); continue; }
  // Every body must carry all 4 tiers (full High-333 + College-999 ladder — the operator's 33-language directive).
  const complete = IDS.every((id) => pack[id] && TIERS.every((t) => typeof pack[id][t] === "string" && pack[id][t].trim().length > 0));
  ok(complete, `pack ${code}: all 12 bodies × 4 tiers (kids·middle·high·adult) non-empty`);
}

// Cross-check: every SUPPORTED language (minus the bundled English base) has a registered pack → 33/33.
const constSrc = fs.readFileSync(path.join(LIB, "constants.ts"), "utf8");
const supBlock = constSrc.match(/SUPPORTED_LANGUAGES[^\[]*\[([\s\S]*?)\]/);
const supported = supBlock ? [...supBlock[1].matchAll(/code:\s*['"]([a-z-]+)['"]/g)].map((m) => m[1]) : [];
const missing = supported.filter((c) => c !== "en" && !CODES.includes(c));
ok(missing.length === 0, `every supported language has a pack — 33/33 (missing: ${missing.join(" ") || "none"})`);

console.log(`\nCELESTIAL-PACKS ${pass}/${pass + fail} passed  (${CODES.length} language packs + English base = ${CODES.length + 1}/${supported.length})`);
if (fail > 0) process.exit(1);
