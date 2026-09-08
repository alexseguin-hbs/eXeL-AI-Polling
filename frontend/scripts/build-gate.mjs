#!/usr/bin/env node
// build-gate — the unit suites the Cloudflare git build runs before `next build` (prebuild), so the door that promotes main
// is gated (fleet pass 2, Athena: it ran no suite at all). The suites run TypeScript straight through Node's
// --experimental-strip-types (22.6+). On an older Node the gate cannot run at all — it says so loudly and lets the build
// continue, because a stale site (a build that dies on tooling, not on a red test) is the worse failure; the GitHub
// deploy.yml gate (Node 22, test:ci) still stands.
import { execSync } from "node:child_process";
const [maj, min] = process.versions.node.split(".").map(Number);
if (maj < 22 || (maj === 22 && min < 6)) {
  console.warn(`⚠ build-gate: Node ${process.versions.node} cannot run the TypeScript suites (needs 22.6+) — gate SKIPPED; deploy.yml still gates test:ci`);
  process.exit(0);
}
const suites = ["test:sign", "test:sign-store", "test:sign-verify", "test:sign-fit", "test:sign-layout", "test:codex-pdf", "test:pdf-stamp", "test:sign-i18n", "test:tmp-core", "test:ai-core", "test:notify-core"];
for (const s of suites) {
  try { execSync(`npm run --silent ${s}`, { stdio: "inherit" }); }
  catch { console.error(`✗ build-gate: ${s} is red — refusing to build`); process.exit(1); }
}
console.log(`✓ build-gate: ${suites.length} suites green on Node ${process.versions.node}`);
