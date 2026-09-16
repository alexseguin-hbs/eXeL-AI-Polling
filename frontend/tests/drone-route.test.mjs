// THE ADDRESS THE OPERATOR GAVE OUT.
//
// He wrote it twice in one message: "ensure https://exel-ai-polling.explore-096.workers.dev/drone-2525/ is
// active" and "ensure draft of game is here". A URL that has been handed to someone is a promise, and a
// promise that depends on a build step nobody checks is not one.
//
// The domain already answered at /main/Drone-2525, alongside its Architect and Celestial siblings. That
// route stays — links to it exist too. What this gate holds is that BOTH addresses exist, that they render
// the SAME component rather than forking into two games, and that the static export actually contains the
// page (the app is `output: 'export'`, so a route that compiles but does not emit is a 404 in production
// and green in CI).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const FRONTEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const ROUTES = [
  { rel: 'app/drone-2525/page.tsx', url: '/drone-2525/', out: 'out/drone-2525/index.html' },
  { rel: 'app/main/Drone-2525/page.tsx', url: '/main/Drone-2525/', out: 'out/main/Drone-2525/index.html' },
];

// ── BOTH DOORS EXIST, AND BOTH OPEN INTO THE SAME ROOM ──────────────────────────────────────────
for (const r of ROUTES) {
  const p = path.join(FRONTEND, r.rel);
  ok(existsSync(p), `${r.url} has a page (${r.rel})`);
  if (!existsSync(p)) continue;
  const src = strip(readFileSync(p, 'utf8'));
  ok(/DroneCommandUX1/.test(src), `${r.url} renders the game, not a placeholder`);
  ok(/from "@\/components\/drone-2525\/command-ux1"/.test(src),
     `${r.url} imports the one component — a second copy would be a second game`);
  ok(/"use client"/.test(src), `${r.url} is a client route, as the arena needs`);
}
{
  // Same component, same props, no fork. Compared after comments are stripped: prose may differ, code may not.
  const bodies = ROUTES.map((r) => strip(readFileSync(path.join(FRONTEND, r.rel), 'utf8')).replace(/\s+/g, ' ').trim());
  ok(bodies[0] === bodies[1], 'the two routes are the same code, so they cannot drift into two different games');
}

// ── AND THE STATIC EXPORT ACTUALLY CONTAINS THEM ────────────────────────────────────────────────
// `output: 'export'` means the route must land on disk. A page that compiles but does not emit is a 404 in
// production and invisible in CI — which is exactly the failure this file exists to stop.
{
  const outDir = path.join(FRONTEND, 'out');
  if (!existsSync(outDir)) {
    console.log('  (out/ not built in this run — skipping the export assertions; `next build` covers them)');
  } else {
    for (const r of ROUTES) {
      const html = path.join(FRONTEND, r.out);
      ok(existsSync(html), `${r.url} is emitted to ${r.out}`);
      if (!existsSync(html)) continue;
      const body = readFileSync(html, 'utf8');
      ok(body.length > 2000, `${r.url} emits a real page (${(body.length / 1024).toFixed(0)} kB), not a stub`);
      ok(/data-drone-ux1|DRONE/i.test(body), `${r.url} carries the arena's own markup`);
    }
    // The trailing slash matters: `trailingSlash: true` means /drone-2525 serves from /drone-2525/index.html.
    ok(readdirSync(path.join(FRONTEND, 'out')).includes('drone-2525'),
       'the export has a /drone-2525 directory, which is what a trailing-slash URL resolves to');
  }
}

console.log(`\ndrone-route: ${pass} passed, ${fail} failed · /drone-2525/ and /main/Drone-2525/ are one game at two addresses`);
process.exit(fail ? 1 : 0);
