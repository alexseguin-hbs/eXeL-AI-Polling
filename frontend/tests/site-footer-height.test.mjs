/**
 * SITE FOOTER · NO SURFACE CLAIMS MORE VIEWPORT THAN IT HAS
 * =========================================================
 * Operator, asked repeatedly across several sessions:
 *   "feedback security 2525 and eXeL AI are at bottom of page"
 *
 * The row has never been `position: fixed`. It is, and always was, in flow at the
 * bottom of the page. The defect was arithmetic. EVERY route is wrapped in two strips
 * it does not own — the build-stamp banner (`#site-build-banner`, app/layout.tsx) above
 * and the footer below — so a route whose container claims the entire viewport produces
 * a document of
 *
 *     banner  +  100dvh  +  footer
 *
 * The browser then scrolls, the route's own header slides off the top, and the row
 * reads as a bar sitting on the content. MEASURED on the Vision reader at 390x844:
 * banner 41 + reader 787 + footer 57 = 885 against an 844px viewport.
 *
 * Subtracting only the footer left 41px still overflowing — the first fix was half a
 * fix, and the browser measurement is what caught it. Desktop differs again (banner 25,
 * not 41), so any constant would have been wrong at one width or the other.
 *
 * The fix is one producer and N consumers: the footer measures BOTH strips and publishes
 * their sum as `--site-chrome-h`; a full-height surface subtracts that one number.
 *
 * THIS TEST IS THE LOCK. It is static — it reads the source rather than a browser —
 * so it costs nothing and cannot be skipped by a flaky render. Two assertions:
 *
 *   1. The producer exists: providers.tsx sets `--site-chrome-h` from a measurement,
 *      and the footer element it measures is the one it renders.
 *   2. No consumer cheats: any component that pins itself to an EXACT viewport height
 *      (`h-[100dvh]`, `h-screen`, `height: 100dvh`) must subtract the variable.
 *      `min-h-*` is exempt by construction — a minimum grows to fit the footer and
 *      can never overflow it.
 *
 * A file may opt out only by naming itself in EXEMPT below, with a reason. That is
 * deliberate friction: an exemption is a sentence someone has to write and defend.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const VAR = "--site-chrome-h";

let fail = 0;
const bad = (m) => { console.log("  ✗ " + m); fail++; };
const ok = (m) => console.log("  ✓ " + m);

/* ── 1 · the producer ──────────────────────────────────────────────────── */
const providers = readFileSync(join(ROOT, "components/providers.tsx"), "utf8");
console.log("producer — components/providers.tsx");

if (providers.includes(`setProperty(\n        "${VAR}"`) || providers.includes(`"${VAR}"`))
  ok(`publishes ${VAR}`);
else bad(`does not publish ${VAR}`);

if (/getBoundingClientRect\(\)\.height/.test(providers))
  ok("the number is MEASURED, not a constant that rots when the row wraps");
else bad("the height is not measured from the live element");

if (/ResizeObserver/.test(providers))
  ok("re-measures on resize — a two-line wrap on a narrow phone is caught");
else bad("no ResizeObserver: a wrapped footer would publish a stale height");

if (/<footer ref=\{footerRef\}/.test(providers))
  ok("the measured element IS the rendered footer");
else bad("the ref is not attached to the footer element");

/* The banner is measured by id across a server/client boundary, so the id is a contract
   between two files. Assert both ends — a silent rename would restore the 41px overflow
   with nothing failing. */
if (/getElementById\("site-build-banner"\)/.test(providers))
  ok("also measures the build-stamp banner above the route");
else bad("the banner is not measured — a page would still overflow by the banner height");

const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
if (/id="site-build-banner"/.test(layout))
  ok('app/layout.tsx still carries id="site-build-banner"');
else bad('app/layout.tsx lost id="site-build-banner" — the measurement silently returns 0');

/* ── 2 · the consumers ─────────────────────────────────────────────────── */
/* Exact-viewport claims. `min-h-` never overflows, so it is not matched. */
const CLAIMS = [
  { re: /(?<!min-)h-\[100dvh\]/, name: "h-[100dvh]" },
  { re: /(?<!min-)h-\[100vh\]/, name: "h-[100vh]" },
  { re: /(?<!min-)\bh-screen\b/, name: "h-screen" },
  { re: /height:\s*["']?100dvh/, name: "height: 100dvh" },
  { re: /height:\s*["']?100vh/, name: "height: 100vh" },
];

/* Exemptions are a sentence someone has to write and defend, and a DEAD exemption is
   worse than none — it implies a hazard was considered where none exists. Every entry
   here must actually fire; the run fails if one does not. (auth-guard and the auth
   callback were in an earlier draft of this list and are NOT here: both use
   `min-h-screen`, which grows to fit the footer and can never overflow it.) */
const EXEMPT = {
  // Overlays are not page flow. A fixed inset-0 layer sits ON TOP of the page and
  // never adds to document height, so it cannot push the footer anywhere.
  "components/ui/toast.tsx": "toast viewport is a fixed overlay, not page flow",
};

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".next" || e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e)) out.push(p);
  }
  return out;
}

console.log("\nconsumers — every exact-viewport claim subtracts the chrome");
const files = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))];
let claims = 0, exempted = 0;
const seenExempt = new Set();

/* Comments are stripped before matching. Otherwise this file's own producer — whose
   comment quotes `h-[100dvh]` to explain the defect — would be reported as committing
   it. A rule that fails on its own explanation teaches people to stop explaining. */
const decomment = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

for (const f of files) {
  const rel = f.slice(ROOT.length).replace(/^\/+/, "");
  const src = decomment(readFileSync(f, "utf8"));
  for (const { re, name } of CLAIMS) {
    if (!re.test(src)) continue;
    claims++;
    if (EXEMPT[rel]) { exempted++; seenExempt.add(rel); console.log(`  · ${rel} — ${name} EXEMPT: ${EXEMPT[rel]}`); continue; }
    // The claim is only safe if this file also subtracts the published variable.
    if (src.includes(VAR)) ok(`${rel} — ${name} minus ${VAR}`);
    else bad(`${rel} claims ${name} and does NOT subtract ${VAR} — the footer will overflow the viewport by its own height`);
  }
}

console.log(`\n${claims} exact-viewport claims found, ${exempted} exempt with a stated reason`);
if (claims === 0) bad("found no claims at all — the matcher is broken, not the code");
for (const rel of Object.keys(EXEMPT))
  if (!seenExempt.has(rel)) bad(`dead exemption: ${rel} no longer makes a viewport claim — delete the entry rather than leaving a hazard implied`);

console.log(fail === 0
  ? "\nPASS — the footer publishes its height and every full-height surface subtracts it."
  : `\nFAIL — ${fail} problem(s).`);
process.exit(fail === 0 ? 0 : 1);
