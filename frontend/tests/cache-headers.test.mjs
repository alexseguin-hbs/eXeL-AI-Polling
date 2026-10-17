// ─────────────────────────────────────────────────────────────────────────────────────────────────
// THE CACHE CLASS — an HTML document the site serves is revalidated before reuse.
//
// WHY THIS GATE EXISTS. Three times the operator has been shown a page his phone had already cached,
// and twice the fix was one more line for one more file:
//   r143  the living document — "a push once read as shipped while the site served a four-hour-old copy"
//   r.202 the operator deck   — "his phone's tab held r0.198 while the site served r0.201"
//   2026.10.17 R-CORE         — he opened the panel on Security-2525 and SoI-2525 the morning after DD-81
//                               shipped and was served the PREVIOUS build; his own screenshot showed the
//                               </> chip still inside the mode strip, the layout DD-81 had removed.
// The nine React surfaces never got the line because nobody had complained about them yet. That is
// fixing the instance. This gate fixes the class: no document may be cacheable without revalidation,
// and nothing earns the rule by being noticed.
//
// SAFE UNDER EITHER PRECEDENCE RULE. Cloudflare's `_headers` resolution between overlapping rules
// (most-specific-wins vs last-wins) is not established anywhere in this repo, so the layout is made
// correct under BOTH: the catch-all carries the revalidate rule, and every path that deliberately
// wants a long cache is declared AFTER it. Then a later, more specific rule wins either way.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(FRONTEND, "public/_headers");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ✓ " + m); } else { fail++; console.log("FAIL: " + m); } };

const src = fs.readFileSync(FILE, "utf8");

// parse into ordered blocks: a line starting with "/" opens a block; indented lines are its headers
const blocks = [];
for (const raw of src.split("\n")) {
  const line = raw.replace(/\s+$/, "");
  if (!line || line.trimStart().startsWith("#")) continue;
  if (line.startsWith("/")) { blocks.push({ pathPattern: line.trim(), headers: [], index: blocks.length }); continue; }
  if (blocks.length && /^\s+\S/.test(line)) blocks[blocks.length - 1].headers.push(line.trim());
}
const cacheOf = (b) => (b.headers.find((h) => /^cache-control:/i.test(h)) || "").split(":").slice(1).join(":").trim();

ok(blocks.length >= 10, `_headers parses (${blocks.length} path blocks) — the walk is not empty`);

// 1 · the catch-all exists and revalidates
const star = blocks.find((b) => b.pathPattern === "/*");
ok(!!star, "a catch-all `/*` block exists");
const starCache = star ? cacheOf(star) : "";
ok(/no-cache/i.test(starCache) && /must-revalidate/i.test(starCache),
  `the catch-all revalidates — every document, not only the ones that were complained about (got: ${starCache || "NO Cache-Control"})`);

// 2 · anything that wants a long cache is declared AFTER the catch-all, so it wins under either rule
const longLived = blocks.filter((b) => /max-age=\s*\d+/i.test(cacheOf(b)) && !/no-cache/i.test(cacheOf(b)));
ok(longLived.length > 0, `at least one path still asks for a long cache (${longLived.length})`);
for (const b of longLived) {
  ok(star && b.index > star.index,
    `${b.pathPattern} is declared AFTER /*, so its long cache survives last-wins as well as most-specific-wins`);
}

// 3 · the hashed-asset rules are intact — revalidating every document must not cost the year on immutable bundles
for (const p of ["/_next/static/*", "/audio/*"]) {
  const b = blocks.find((x) => x.pathPattern === p);
  ok(!!b && /immutable/i.test(cacheOf(b)) && /max-age=31536000/i.test(cacheOf(b)),
    `${p} keeps its one-year immutable cache`);
}

// 4 · the two rules the operator's earlier reports bought are still there (append-only; they are now
//     redundant with the catch-all, which is correct — a redundant rule is not a wrong one)
for (const p of ["/drone-2525/play.html", "/whitepaper/vision-2525.html"]) {
  const b = blocks.find((x) => x.pathPattern === p);
  ok(!!b && /no-cache/i.test(cacheOf(b)), `${p} keeps the explicit rule its own incident bought`);
}

console.log(`\ncache-headers: ${pass} passed, ${fail} failed · ${blocks.length} path blocks`);
process.exit(fail ? 1 : 0);
