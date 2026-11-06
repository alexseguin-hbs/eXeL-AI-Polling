// CACHE CLASS gate — the live site self-heals a stale session (operator 2026-11-06: shipped work unseen on his
// phone). Server no-cache (worker.js) + this CLIENT version check together close the class: the running build
// knows its SHA, polls /version.json, and reloads once when a newer build is deployed. This gate locks the
// mechanism so it can't be silently removed (the way the per-file no-cache lines used to rot).
// Run: node tests/version-reload.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL:", m); } };
const FE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(FE, p), "utf8");

// ── the guard component exists and does the right thing ──
const g = read("components/fresh-build-guard.tsx");
ok(/export function FreshBuildGuard\b/.test(g), "FreshBuildGuard is exported");
ok(/process\.env\.NEXT_PUBLIC_GIT_SHA/.test(g), "it reads the baked build SHA (NEXT_PUBLIC_GIT_SHA — same value as the footer banner)");
ok(/fetch\(`\/version\.json\?ts=\$\{Date\.now\(\)\}`,\s*\{\s*cache:\s*"no-store"\s*\}\)/.test(g), "it fetches /version.json with cache:no-store (always the deployed SHA, never a cached copy)");
ok(/location\.reload\(\)/.test(g), "it reloads when the deployed SHA differs");
ok(/sessionStorage/.test(g) && /freshreload/.test(g), "it guards against a reload storm (sessionStorage, once per new SHA per session)");
ok(/BUILD_SHA === "dev"/.test(g), "it is a no-op in dev (never auto-reloads a local tree)");
ok(/visibilitychange/.test(g) && /"focus"/.test(g), "it re-checks on tab focus / visibility (the exact moment iOS restores a stale tab)");

// ── it is mounted app-wide (root layout, so every route gets it) ──
const lay = read("app/layout.tsx");
ok(/<FreshBuildGuard\s*\/>/.test(lay), "app/layout.tsx mounts <FreshBuildGuard/> (every route)");
ok(/import \{ FreshBuildGuard \} from "@\/components\/fresh-build-guard"/.test(lay), "the import path is correct");

// ── the build writes /version.json from the SAME SHA as the banner ──
const cfg = read("next.config.js");
ok(/public['"]?\s*,\s*['"]version\.json['"]|public\/version\.json|["']version\.json["']/.test(cfg), "next.config.js writes public/version.json at build");
ok(/sha:\s*gitSha/.test(cfg), "version.json's sha is gitSha — the exact value baked into NEXT_PUBLIC_GIT_SHA, so a fresh build matches itself (no false reload)");

console.log(`\nversion-reload: ${pass} passed, ${fail} failed · the client self-heals a stale session — a shipped build is never invisible again`);
process.exit(fail ? 1 : 0);
