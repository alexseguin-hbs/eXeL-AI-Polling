// /main IS NEVER USED — the redirect gate (R5, 2026-10-31).
// Operator 2026-10-30: "/main/Architect-2525/ must post to /Architect-2525/. Main should never be used anywhere.
// /main is the same as https://exel-ai-polling.explore-096.workers.dev". Before R5 the OPPOSITE was wired: the launcher,
// the home eggs, the footer, the drone share links and the ledgers all pointed at /main/<x>, there was NO /main/* → /*
// redirect (only two SoI lines in _redirects), /Architect-2525/ 301'd to lowercase, and an unbuilt /main/<x> SPA-fell-back
// to the homepage with the URL unchanged. This gate drives worker.js (run_worker_first) with a fake ASSETS and holds:
// /main → /, /main/<x> → /<x> (301), the query string survives (Drone ?crew= / ?si=), no loop, no app/main pages,
// no "/main" link anywhere in the shipped app code, and the canonical Architect route is CAPITAL.
// Run: node tests/main-redirect.test.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("FAIL", m); } };

// a Worker-shaped environment: the SPA fallback is what we must NOT see for any /main path
const store = new Map();
globalThis.caches = { default: {
  async match(k) { const r = store.get(typeof k === "string" ? k : k.url); return r ? r.clone() : undefined; },
  async put(k, r) { store.set(typeof k === "string" ? k : k.url, r.clone()); },
  async delete(k) { return store.delete(typeof k === "string" ? k : k.url); },
} };
const HTML = "<!doctype html><html><body>index</body></html>";
const env = { ASSETS: { fetch: async () => new Response(HTML, { status: 200, headers: { "content-type": "text/html" } }) } };
const { default: worker } = await import(join(ROOT, "worker.js"));
const call = (path) => worker.fetch(new Request("https://site.test" + path), env);
const loc = (r) => r.headers.get("location");

const cases = [
  ["/main", "https://site.test/"],
  ["/main/", "https://site.test/"],
  ["/main/Architect-2525/", "https://site.test/Architect-2525/"],
  ["/main/Architect-2525", "https://site.test/Architect-2525"],
  ["/main/Architect-2525/design/", "https://site.test/Architect-2525/design/"],
  ["/main/Celestial-2525/", "https://site.test/Celestial-2525/"],
  ["/main/Security-2525/", "https://site.test/Security-2525/"],
  ["/main/SoI-2525/", "https://site.test/SoI-2525/"],
  ["/main/experiences/docs/", "https://site.test/experiences/docs/"],
  ["/main/Drone-2525/?crew=CREW42&seat=targeteer", "https://site.test/Drone-2525/?crew=CREW42&seat=targeteer"],
  ["/main/Drone-2525/?si=ABC123", "https://site.test/Drone-2525/?si=ABC123"],
  ["/main/?x=1", "https://site.test/?x=1"],
  // R5b: any case and a repeated prefix land in ONE hop
  ["/Main/Architect-2525/", "https://site.test/Architect-2525/"],
  ["/MAIN/x?q=1", "https://site.test/x?q=1"],
  ["/main/main/x", "https://site.test/x"],
  // R5b (Thor NOTE-9): a doubled slash after the prefix collapses — never a Location that reads "//host" to a human
  ["/main//x", "https://site.test/x"],
  ["/main//evil.com/", "https://site.test/evil.com/"],
];
for (const [from, to] of cases) {
  const r = await call(from);
  ok(r.status === 301 && loc(r) === to, `${from} → 301 ${to} (got ${r.status} ${loc(r)})`);
}
// never a loop: the target never starts with /main, and a non-/main path is untouched
for (const [, to] of cases) ok(!new URL(to).pathname.startsWith("/main"), `${to} is not itself under /main (no loop)`);
for (const p of ["/", "/Architect-2525/", "/maintenance", "/mainline/x", "/drone-2525/?crew=A", "/main-street"]) {
  const r = await call(p);
  ok(r.status !== 301, `${p} is NOT redirected (got ${r.status})`);   // R5b: a real assertion (the old one could never fail)
}
ok((await call("/maintenance")).status === 200, "/maintenance (starts with the letters 'main') is served, not redirected");

// the app/main pages are gone; the canonical Architect route is CAPITAL with its design deep-link; lowercase 301s to it
ok(!existsSync(join(ROOT, "app/main")), "app/main/ no longer exists");
ok(existsSync(join(ROOT, "app/Architect-2525/page.tsx")) && existsSync(join(ROOT, "app/Architect-2525/design/page.tsx")), "app/Architect-2525/ (+ /design) is the canonical route");
ok(!existsSync(join(ROOT, "app/architect-2525")), "no lowercase app/architect-2525 twin (a case-only twin collides in the export)");
const redirects = readFileSync(join(ROOT, "public/_redirects"), "utf8");
ok(/^\/architect-2525\/ \/Architect-2525\/ 301$/m.test(redirects) && /^\/architect-2525 \/Architect-2525\/ 301$/m.test(redirects), "_redirects: /architect-2525 → /Architect-2525/ (exact paths)");
ok(!/^\/Architect-2525\/? \/architect-2525\//m.test(redirects), "_redirects no longer sends the capital route to lowercase");
ok(!/^\/main\//m.test(redirects), "_redirects lists no /main alias (the Worker owns it)");

// no "/main" link in the shipped app code (app · components · lib · public html), nor in the ledger routes
const hits = [];
const walk = (d) => { for (const n of readdirSync(d)) { if (n === "node_modules" || n.startsWith(".")) continue; const p = join(d, n);
  // RECORD files are not links: the SensorFusion ledger (append-only decision text) and the CRS matrix data (spec records)
  // quote old addresses as history; the Worker redirect makes those addresses land, and a record is never rewritten.
  const RECORDS = ["/app/SensorFusion-2525/ledger.ts", "/lib/crs-matrix-data.ts"];
  if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|jsx?|html)$/.test(n) && !/\.gen\.ts$/.test(n) && !p.includes("/public/r-core/") && !p.includes("/public/whitepaper") && !RECORDS.some((r) => p.endsWith(r))) {
    // CODE and on-screen text only: comments may explain the redirect ("/main/* → /*"), so they are stripped first
    // (block comments, line comments that are not part of a URL, and JSX comment braces). Then ANY "/main" token —
    // after a quote, a paren, whitespace or a tag close — is a hit: a link, a label, a router.push, a string.
    const raw = readFileSync(p, "utf8");
    // R5b: tokenise once — strings are kept whole (a `//` or `/*` inside a string never opens a comment), block and line
    // comments are blanked; the old stripper could erase real code after a comment containing "/main/*".
    const src = raw.replace(/("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (c, str) => (str ? c : c.replace(/[^\n]/g, " ")));
    // ANY "/main" token after a quote, bracket, operator, whitespace or a tag close — and before any non-identifier char
    for (const m of src.matchAll(/(?:^|[\s"'`(>=,\[{“‘])\/main(?=[^A-Za-z0-9_-]|$)/gm)) hits.push(`${p.slice(ROOT.length + 1)}:${src.slice(0, m.index).split("\n").length}`);
  } } };
for (const d of ["app", "components", "lib"]) walk(join(ROOT, d));
for (const f of ["paused.html"]) { const src = readFileSync(join(ROOT, "public", f), "utf8"); for (const m of src.matchAll(/href="\/main[\/"]/g)) hits.push(`public/${f}:${src.slice(0, m.index).split("\n").length}`); }
ok(hits.length === 0, `no "/main" link in the shipped app code (${hits.length}: ${hits.slice(0, 8).join(" ")})`);
// The Drone-2525 ledger's route header still reads /main/Drone-2525: the operator deck's pinned R-CORE block (play.html,
// sha-gated, append-only) names that route and tests/deck-rcore.test.mjs holds the two equal — changing it is a Drone-2525
// revision of its own. The Worker redirect makes that address land on /drone-2525/ regardless.
for (const f of ["architect-2525", "celestial-2525", "security-2525"]) {
  const L = JSON.parse(readFileSync(join(ROOT, "..", "docs/traceability", `${f}.ledger.json`), "utf8"));
  ok(!L.route.startsWith("/main"), `${f} ledger route is a root route (${L.route})`);
}
const reg = readFileSync(join(ROOT, "..", "docs/traceability/projects.registry.json"), "utf8");
ok(!/frontend\/app\/main\//.test(reg), "the projects registry scopes no app/main path");
const vl = readFileSync(join(ROOT, "..", ".github/workflows/verify-live.yml"), "utf8");
ok(!/\/main\//.test(vl), "Verify Live probes root routes, never /main");

console.log(`\nMAIN-REDIRECT ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
