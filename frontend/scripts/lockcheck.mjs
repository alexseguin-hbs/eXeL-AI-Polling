#!/usr/bin/env node
// lockcheck — package.json and package-lock.json MUST agree, or Cloudflare's build dies at
// `npm clean-install` before `next build` is ever reached.
//
// WHY (AAR 2026-07-29): a dependency was added to package.json without regenerating the lock.
// Every subsequent Cloudflare build failed on BOTH branches. Locally nothing broke — `npm run build`
// uses the already-installed node_modules and never revalidates the lock — so the breakage was
// invisible until the build history was read. This check runs in `prebuild`, so it fails on the
// developer's machine at the same moment it would fail in CI.

import { readFileSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url).pathname.replace("/scripts/", "/"), "utf8"));
const pkg = read("package.json");
const lock = read("package-lock.json");
const root = lock.packages?.[""] ?? {};

const diff = [];
for (const kind of ["dependencies", "devDependencies", "optionalDependencies"]) {
  const a = pkg[kind] ?? {};
  const b = root[kind] ?? {};
  for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[name] !== b[name]) diff.push(`  ${kind}.${name}: package.json=${a[name] ?? "(absent)"} lock=${b[name] ?? "(absent)"}`);
  }
}

if (!diff.length) process.exit(0);

console.error(`
✗ package.json and package-lock.json are OUT OF SYNC — Cloudflare's \`npm clean-install\` will FAIL:

${diff.join("\n")}

Fix:  cd frontend && npm install --package-lock-only    # then commit the updated lock

Never add or bump a dependency without committing the regenerated lock alongside it. A local
\`npm run build\` passing proves nothing here — it reuses node_modules and never revalidates the lock.`);
process.exit(1);
