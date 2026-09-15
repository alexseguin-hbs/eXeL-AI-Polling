// Cube 10 admin unlock is WIRED (operator 2026-09-15). Before this, registerCube10Click had no caller
// and verifyCube10Code POSTed a route absent from the static export — the Admin Console was unreachable
// in every deployed demo. Source-level invariant: the three overlay seeds drive the sequence, the code
// prompt submits to verifyCube10Code, and the backendless deploy resolves the demo codes locally.
import fs from "node:fs";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const badge = fs.readFileSync(new URL("../components/powered-badge.tsx", import.meta.url), "utf8");
const ctx = fs.readFileSync(new URL("../lib/easter-egg-context.tsx", import.meta.url), "utf8");
ok(/registerCube10Click\(CUBE10_ICON_IDS\[index\]\)/.test(badge), "overlay seeds call registerCube10Click");
ok(/CUBE10_ICON_IDS = \["hi", "ai", "si"\]/.test(badge), "seed order maps to hi/ai/si (웃 ◬ ♡)");
for (const hook of ["data-cube10-icon", "data-cube10-code", "data-cube10-verify", "data-cube10-level"]) ok(badge.includes(hook), `test hook ${hook} present`);
ok(/verifyCube10Code\(cube10Code\)/.test(badge), "code prompt submits to verifyCube10Code");
ok(/NEXT_PUBLIC_MOCK_MODE !== "false"/.test(ctx) && /94561230/.test(ctx) && /366999/.test(ctx), "backendless deploy resolves the demo codes locally");
ok(/fetch\(VERIFY_ACCESS_ENDPOINT/.test(ctx), "real deploy still verifies server-side");
ok(/isAdmin && \(/.test(fs.readFileSync(new URL("../app/sim/page.tsx", import.meta.url), "utf8")), "/sim renders the Admin Console tab for admin");
console.log(`cube10-unlock: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
