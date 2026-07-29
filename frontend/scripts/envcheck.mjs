#!/usr/bin/env node
// envcheck — FAIL CLOSED when a required build-time public var is missing.
//
// WHY (AAR 2026-07-29): the app reads its Supabase + Auth0 config from NEXT_PUBLIC_* at BUILD time. A build
// without them compiles perfectly and produces a site whose Supabase client is configured with empty strings —
// which silently breaks Trinity Redundancy (send paths A/B and receive channels A/B/D of the live-response
// system). Nothing crashes; responses just never arrive. That failure is invisible in CI and expensive in a
// live session, so the build must refuse to produce it.
//
// Only run where a real deploy is being produced (CI / release). Local `next build` for type-checking does not
// need real keys, so this is invoked explicitly, not from prebuild.
//
//   node scripts/envcheck.mjs            # required set must all be present and non-empty
//   node scripts/envcheck.mjs --warn     # report only, exit 0 (for a dry run)

// Trinity Redundancy depends on these two. Without them the live-response path is dead.
const REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
// Degrade gracefully if absent (login / payments / API base), so they warn rather than block.
const OPTIONAL = [
  "NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_WS_URL",
  "NEXT_PUBLIC_AUTH0_DOMAIN", "NEXT_PUBLIC_AUTH0_CLIENT_ID", "NEXT_PUBLIC_AUTH0_AUDIENCE",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

const warnOnly = process.argv.includes("--warn");
const missing = (list) => list.filter((k) => !(process.env[k] ?? "").trim());

const missOpt = missing(OPTIONAL);
if (missOpt.length) console.warn(`⚠ optional build vars not set (feature degrades, deploy continues): ${missOpt.join(", ")}`);

const missReq = missing(REQUIRED);
if (!missReq.length) {
  // Never print values — presence only.
  console.log(`✓ envcheck: all ${REQUIRED.length} required build vars present`);
  process.exit(0);
}

console.error(`
✗ envcheck: REQUIRED build-time vars are missing — refusing to build a broken deploy:

${missReq.map((k) => `  ${k}`).join("\n")}

These are read at BUILD time and baked into the bundle. Building without them yields a site that loads fine but
whose Supabase client is empty — Trinity Redundancy (live responses) silently stops working.

Fix: set them in the build environment (GitHub → Settings → Secrets and variables → Actions, or the Cloudflare
build environment). Values are never committed to the repo.`);
process.exit(warnOnly ? 0 : 1);
