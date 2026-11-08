// ARCHITECT-2525 / FUTURE · T-IMPORT-BAN (plan §5/§30, FCRS-03/38). The Future dependency graph must never reach a
// DO_NOT_IMPORT legacy module — directly or transitively through a barrel. GREEN from Phase 0 (joins test:ci).
// Static scan (parses imports; never executes). Resolves "@/*"→frontend/* and relative specifiers, follows
// static/dynamic/`import type` edges, appending .ts/.tsx/index. Bare (npm) specifiers are external and skipped.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-future-import-ban.test.mjs
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  ✗ " + m); } };

const BANNED = [
  "lib/architect-house-truth.ts",
  "lib/architect-sim-options.ts",
  "lib/architect-estimate.ts",
  "lib/architect-wall-system.ts",
  "components/architect-2525/house-spec.tsx",
  "components/architect-2525/command-ux1.tsx",
  "components/security-2525/mission-planning.tsx",
].map((p) => resolve(FRONTEND, p));

const ROOTS = [
  "lib/architect-future",
  "components/architect-future",
  "app/Architect-2525/future",
].map((p) => resolve(FRONTEND, p));

// the gate is only meaningful if the banned files actually exist today
ok(BANNED.every((b) => existsSync(b)), "every DO_NOT_IMPORT target exists (gate is meaningful)");

function walkDir(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walkDir(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const CAND = (base) => [base, base + ".ts", base + ".tsx", resolve(base, "index.ts"), resolve(base, "index.tsx")];
function resolveSpec(spec, fromFile) {
  let base = null;
  if (spec.startsWith("@/")) base = resolve(FRONTEND, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null; // bare/npm specifier — external
  for (const c of CAND(base)) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}

// static + dynamic + type-only import specifiers
const IMPORT_RE = /(?:import|export)\s+(?:type\s+)?[^"';]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;
function specifiersOf(file) {
  const src = readFileSync(file, "utf8");
  const specs = [];
  let m;
  while ((m = IMPORT_RE.exec(src))) specs.push(m[1] || m[2] || m[3]);
  return specs;
}

// BFS the graph from every root file; flag any banned file reached.
const seen = new Set();
const queue = [];
for (const root of ROOTS) for (const f of walkDir(root)) { if (!seen.has(f)) { seen.add(f); queue.push(f); } }
const startCount = queue.length;
const reachedBanned = [];
while (queue.length) {
  const file = queue.shift();
  for (const spec of specifiersOf(file)) {
    const r = resolveSpec(spec, file);
    if (!r) continue;
    if (BANNED.includes(r)) reachedBanned.push(`${relative(FRONTEND, file)} → ${spec}`);
    if (!seen.has(r)) { seen.add(r); queue.push(r); }
  }
}

ok(startCount > 0, `scanned Future source files (found ${startCount} entry files)`);
ok(reachedBanned.length === 0, `no Future file reaches a DO_NOT_IMPORT module${reachedBanned.length ? " — " + reachedBanned.join("; ") : ""}`);

console.log(`architect-future-import-ban (T-IMPORT-BAN): ${pass} passed, ${fail} failed · ${seen.size} files in graph`);
if (fail > 0) process.exit(1);
