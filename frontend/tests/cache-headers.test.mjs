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
// WHERE THE RULE LIVES, AND WHY IT IS NOT IN `_headers`. The first cut put
// `Cache-Control: no-cache, must-revalidate` on the `/*` block, reasoning that a more specific rule would
// win. MEASURED AT THE EDGE one hour later by the probe in verify-live.yml: Workers Static Assets
// CONCATENATES the Cache-Control of every matching rule. A hashed bundle came back as
//     no-cache, must-revalidate, public, max-age=31536000, immutable
// — and `no-cache` wins in every browser, so the immutable year on every hashed asset was silently
// defeated. The gate did not catch it because it asked whether the asset rule CONTAINED `immutable`
// instead of whether `immutable` was all it said. That is the same shape of false green this file exists
// to prevent, so the assertions below now ask for EXCLUSIVITY, not presence.
// The document rule therefore lives in worker.js, where `headers.set` REPLACES and keys on the response
// being text/html — something a path glob cannot express, since there is no way to say
// "every document except /_next/static/*".
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

// 1 · the catch-all must NOT carry Cache-Control — it would concatenate onto every asset that matches it
const star = blocks.find((b) => b.pathPattern === "/*");
ok(!!star, "a catch-all `/*` block exists (security headers)");
ok(star && cacheOf(star) === "",
  `the catch-all sets NO Cache-Control — _headers concatenates, so a rule here lands on every hashed asset too (got: ${star ? cacheOf(star) || "none" : "no block"})`);

// 2 · the document rule lives in the worker, where set() replaces instead of concatenating
{
  const w = fs.readFileSync(path.join(FRONTEND, "worker.js"), "utf8");
  ok(/content-type/i.test(w) && /text\/html/.test(w),
    "worker.js decides by what the response IS (text/html), not by a path glob");
  ok(/headers\.set\("Cache-Control",\s*"no-cache, must-revalidate"\)/.test(w),
    "worker.js SETS the document rule — set() replaces, so it cannot concatenate with _headers");
  const i = w.indexOf('headers.set("Cache-Control"');
  ok(i > -1 && /isDocument/.test(w.slice(Math.max(0, i - 120), i + 10)),
    "the document rule is applied only to documents, so hashed assets never receive it");
}

// 3 · a long cache must be EXCLUSIVE — the leg that would have caught the regression
const longLived = blocks.filter((b) => /max-age=\s*\d+/i.test(cacheOf(b)));
ok(longLived.length > 0, `at least one path asks for a long cache (${longLived.length})`);
for (const b of longLived) {
  ok(!/no-cache|no-store/i.test(cacheOf(b)),
    `${b.pathPattern} asks for a long cache and NOTHING contradicts it (got: ${cacheOf(b)})`);
}

// 4 · the hashed-asset rules are intact and say ONLY that
for (const p of ["/_next/static/*", "/audio/*"]) {
  const b = blocks.find((x) => x.pathPattern === p);
  ok(!!b && /immutable/i.test(cacheOf(b)) && /max-age=31536000/i.test(cacheOf(b)) && !/no-cache/i.test(cacheOf(b)),
    `${p} keeps a one-year immutable cache with no contradicting directive`);
}

// 5 · the two rules the operator's earlier reports bought are still there (append-only)
for (const p of ["/drone-2525/play.html", "/whitepaper/vision-2525.html"]) {
  const b = blocks.find((x) => x.pathPattern === p);
  ok(!!b && /no-cache/i.test(cacheOf(b)), `${p} keeps the explicit rule its own incident bought`);
}

console.log(`\ncache-headers: ${pass} passed, ${fail} failed · ${blocks.length} path blocks`);
process.exit(fail ? 1 : 0);
