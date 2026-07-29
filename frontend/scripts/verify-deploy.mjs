#!/usr/bin/env node
// verify-deploy — prove a push actually SHIPPED, instead of trusting that `git push` returning 0 means live.
//
// WHY THIS EXISTS (AAR 2026-07-29): five commits were pushed to main and Cloudflare built a version for each,
// but the ACTIVE deployment stayed pinned to a 4-hour-old version at 100% traffic — versions were being
// UPLOADED (`wrangler versions upload`, staged at 0%) and never PROMOTED (`wrangler deploy`, routes 100%).
// The site served stale code while every push looked successful. The release gate now ends here: the live
// site must report the SHA we just pushed, or the slice is not shipped.
//
// Usage:
//   node scripts/verify-deploy.mjs                 # compare live SHA to local HEAD
//   node scripts/verify-deploy.mjs <sha>           # compare live SHA to an explicit commit
//   SITE_URL=https://... node scripts/verify-deploy.mjs
//
// Exit 0 = live matches. Exit 1 = stale (promote the version, or fix the deploy command).
//
// NOTE: run this from your machine or from CI. Inside the Claude Code remote sandbox the outbound agent
// proxy returns 403 for this host, so the check cannot complete there — a 403 here means "could not verify",
// NOT "shipped". Never treat an unreachable check as a pass.

import { execSync } from "node:child_process";

const SITE = process.env.SITE_URL || "https://exel-ai-polling.explore-096.workers.dev";
const want = (process.argv[2] || execSync("git rev-parse HEAD").toString().trim()).slice(0, 7);

const die = (msg, code = 1) => { console.error(msg); process.exit(code); };

let html;
try {
  const res = await fetch(SITE, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) die(`✗ ${SITE} returned HTTP ${res.status}`);
  html = await res.text();
} catch (err) {
  die(`✗ could not reach ${SITE} — ${err.message}`);
}

// The app stamps its build SHA into the served HTML (footer/meta). Accept any 7-40 hex run that matches.
const live = [...html.matchAll(/\b([0-9a-f]{7,40})\b/g)].map((m) => m[1].slice(0, 7));
const hit = live.includes(want);

console.log(`site   : ${SITE}`);
console.log(`want   : ${want} (local HEAD)`);
console.log(`live   : ${live.length ? [...new Set(live)].slice(0, 6).join(", ") : "(no SHA stamped in HTML)"}`);

if (hit) { console.log("✓ SHIPPED — the live site is serving this commit."); process.exit(0); }

console.error(`
✗ NOT SHIPPED — the live site is not serving ${want}.

Most likely cause (see the AAR above): the Cloudflare build UPLOADED a version but did not PROMOTE it.
Check Workers & Pages -> exel-ai-polling -> Deployments:
  - If "Active deployment" is older than your push, the newest version is staged at 0% traffic.
  - Fix once:  Settings -> Build -> Deploy command  ==>  npm run deploy   (i.e. \`wrangler deploy\`)
    NOT \`wrangler versions upload\`, which stages without routing traffic.
  - Unblock now: Deployments -> newest version -> ... -> Promote to 100%.

A push is not a ship. Do not report a slice as deployed until this check passes.`);
process.exit(1);
