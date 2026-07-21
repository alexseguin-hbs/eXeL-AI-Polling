// USE-REALTIME-RANKING lock (C7-2) — the results surface subscribes to Cube 7's live ranking
// broadcasts (ranking_progress / ranking_complete / ranking_override) on session:{code}, and
// LISTENS ONLY (never sends) so it stays clear of the Trinity-Redundancy delivery paths.
// Run: node --experimental-strip-types tests/use-realtime-ranking.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

const src = fs.readFileSync(path.join(ROOT, "lib/use-realtime-ranking.ts"), "utf8");

ok(/export function useRealtimeRanking\(/.test(src), "exports useRealtimeRanking hook");
ok(/supabase\.channel\(`session:\$\{shortCode\}`\)/.test(src), "subscribes on the session:{code} channel");
ok(/event:\s*"ranking_progress"/.test(src), "listens for ranking_progress");
ok(/event:\s*"ranking_complete"/.test(src), "listens for ranking_complete");
ok(/event:\s*"ranking_override"/.test(src), "listens for ranking_override");
// Listen-only: it must never .send() — that would collide with Trinity-Redundancy delivery.
ok(!/\.send\(/.test(src), "listen-only — never sends (no Trinity collision)");
// Graceful degradation + cleanup.
ok(/if\s*\(!shortCode\s*\|\|\s*!supabase\)\s*return/.test(src), "no-op when Supabase unconfigured");
ok(/removeChannel\(channel\)/.test(src), "removes the channel on unmount (no leak)");

console.log(`\nUSE-REALTIME-RANKING ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
