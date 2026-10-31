#!/usr/bin/env node
/**
 * status.mjs — THE SECOND SOURCE (operator 2026-10-31: "make sure you know what architect-2525 is live always").
 *
 * For a week the report line read UNVERIFIED (the sandbox cannot reach the site host) while the Verify Live workflow had been
 * saying STALE 000fe42 every run. The script now reads that instrument when the direct probe fails. This gate runs the real
 * script against two local fakes — a site and a GitHub API — and holds every branch of the sentence it prints:
 *   A  the site serves HEAD's banner            → LIVE <sha> (direct · …)
 *   B  the site serves another sha              → STALE <sha> (direct · …)
 *   C  site unreachable, CI LIVE STATE fresh    → LIVE <sha> (verify-live #N · …)
 *   D  site unreachable, CI LIVE STATE 3 h old  → UNVERIFIED, the stale evidence quoted with its age
 *   E  site unreachable, old-format STALE note  → STALE <sha> (verify-live #N · …)   (runs before the LIVE STATE step existed)
 *   F  site unreachable, no token, no gh        → UNVERIFIED with both failures quoted and the way to read the annotation
 * plus two source-level invariants: the exit expression is unchanged, and the "first 7-hex word" luck-match is gone (here and in
 * verify-deploy.mjs).
 */
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/status.mjs");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const HEAD = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
const HEAD7 = HEAD.slice(0, 7);
// the served HTML carries a real U+00A0 after "SHA:" (React renders &nbsp; as the character), never the entity text
const banner = (sha) => `<html><body><div>SHA: <span class="text-zinc-200">${sha}</span> Date: <span>2026.10.31</span> Time: <span>07:02 CST</span></div></body></html>`;

const serve = (handler) => new Promise((res) => { const s = http.createServer(handler); s.listen(0, "127.0.0.1", () => res(s)); });
const siteServer = (html) => serve((req, r) => { r.writeHead(200, { "content-type": "text/html" }); r.end(html); });
const apiServer = (annotations, runUpdatedAt) => serve((req, r) => {
  const u = req.url;
  const json = (o) => { r.writeHead(200, { "content-type": "application/json" }); r.end(JSON.stringify(o)); };
  if (/\/actions\/workflows\/verify-live\.yml\/runs/.test(u)) return json({ workflow_runs: [{ id: 1, run_number: 77, updated_at: runUpdatedAt }] });
  if (/\/actions\/runs\/1\/jobs/.test(u)) return json({ jobs: [{ id: 9 }] });
  if (/\/check-runs\/9\/annotations/.test(u)) return json(annotations);
  if (/\/actions\/runs\?head_sha=/.test(u)) return json({ workflow_runs: [] });
  if (/\/commits\/[0-9a-f]+\/check-runs/.test(u)) return json({ check_runs: [] });
  r.writeHead(404); r.end("{}");
});
// async, never spawnSync: the fakes live in THIS process, and a synchronous spawn would block their event loop until the child
// gave up — the child would time out against a server that was never allowed to answer.
const run = (env) => new Promise((resolve) => {
  const child = spawn("node", [SCRIPT, "--line"], { cwd: ROOT, env: { ...process.env, STATUS_SHA: "HEAD", ...env } });
  let stdout = "", stderr = "";
  child.stdout.on("data", (d) => { stdout += d; }); child.stderr.on("data", (d) => { stderr += d; });
  const t = setTimeout(() => child.kill("SIGKILL"), 90000);
  child.on("close", (status) => { clearTimeout(t); resolve({ stdout, stderr, status }); });
});
const CLOSED = "http://127.0.0.1:9";   // nothing listens on the discard port — the direct probe fails fast

const nowIso = new Date().toISOString().replace(/:\d\d\.\d+Z$/, "Z");
const oldIso = new Date(Date.now() - 3 * 3600 * 1000).toISOString();

// A — direct, LIVE
{
  const s = await siteServer(banner(HEAD7));
  const out = (await run({ SITE_URL: `http://127.0.0.1:${s.address().port}`, GITHUB_API_URL: CLOSED, GH_TOKEN: "test" })).stdout;
  ok(new RegExp(`cloudflare LIVE ${HEAD7} \\(direct · `).test(out), `A: the direct probe reads LIVE with its source and time — got: ${out.trim()}`);
  s.close();
}
// B — direct, STALE
{
  const s = await siteServer(banner("abcdef1"));
  const out = (await run({ SITE_URL: `http://127.0.0.1:${s.address().port}`, GITHUB_API_URL: CLOSED, GH_TOKEN: "test" })).stdout;
  ok(/cloudflare STALE abcdef1 \(direct · /.test(out), `B: the direct probe reads STALE with the served sha — got: ${out.trim()}`);
  s.close();
}
// C — site unreachable, CI LIVE STATE fresh
{
  const api = await apiServer([{ title: "LIVE STATE", message: `LIVE STATE · live=${HEAD7} built 2026.10.31 07:02 CST · arch=${HEAD7} v0.001-2026.10.31-07.02CST · branches=main · cf.active=6de8233a@100% · cf.unpromoted=none · preview=${HEAD7} · read=${nowIso}` }], nowIso);
  const out = (await run({ SITE_URL: CLOSED, GITHUB_API_URL: `http://127.0.0.1:${api.address().port}`, GH_TOKEN: "test" })).stdout;
  ok(new RegExp(`cloudflare LIVE ${HEAD7} \\(verify-live #77 · `).test(out), `C: a fresh LIVE STATE annotation establishes LIVE and names its run — got: ${out.trim()}`);
  api.close();
}
// D — site unreachable, CI LIVE STATE three hours old
{
  const api = await apiServer([{ title: "LIVE STATE", message: `LIVE STATE · live=${HEAD7} built 2026.10.31 07:02 CST · branches=main · cf.active=x · cf.unpromoted=none · preview=none · read=${oldIso.replace(/:\d\d\.\d+Z$/, "Z")}` }], oldIso);
  const out = (await run({ SITE_URL: CLOSED, GITHUB_API_URL: `http://127.0.0.1:${api.address().port}`, GH_TOKEN: "test" })).stdout;
  ok(/cloudflare UNVERIFIED \(no probe:/.test(out) && /min ago/.test(out) && new RegExp(`live=${HEAD7}`).test(out), `D: stale CI evidence is quoted with its age but does not count — got: ${out.trim()}`);
  api.close();
}
// E — site unreachable, the old-format STALE annotation (runs before the LIVE STATE step)
{
  const api = await apiServer([{ title: "STALE", message: "expected 1741481, site is serving 000fe42" }], nowIso);
  const out = (await run({ SITE_URL: CLOSED, GITHUB_API_URL: `http://127.0.0.1:${api.address().port}`, GH_TOKEN: "test" })).stdout;
  ok(/cloudflare STALE 000fe42 \(verify-live #77 · /.test(out), `E: the old-format STALE note still names what was served — got: ${out.trim()}`);
  api.close();
}
// F — site unreachable, no token, no gh
{
  const out = (await run({ SITE_URL: CLOSED, GITHUB_API_URL: CLOSED, GH_TOKEN: "", GITHUB_TOKEN: "", STATUS_NO_GH: "1" })).stdout;
  ok(/cloudflare UNVERIFIED \(no probe: direct \[/.test(out) && /CI \[/.test(out) && /actions_list/.test(out) && /LIVE STATE/.test(out), `F: with neither source the line quotes both failures and says how to read the annotation — got: ${out.trim()}`);
}

// ── source-level invariants ───────────────────────────────────────────────────────────────────────────────────────────────────
const src = readFileSync(SCRIPT, "utf8");
ok(/process\.exit\(!dirty && pushed && live\.state === "LIVE" \? 0 : 1\);/.test(src), "the exit expression is unchanged: 0 only when committed, pushed and LIVE");
ok(!/\\b\[0-9a-f\]\{7\}\\b/.test(src), "status.mjs: the 'first 7-hex word' luck-match is gone");
ok(/EVIDENCE_FRESH_MIN = 60/.test(src) && /annotations/.test(src) && /GH_TOKEN \|\| process\.env\.GITHUB_TOKEN/.test(src), "status.mjs: the second source reads the Verify Live annotations through the GitHub API with the session token, fresh within 60 min");
const vd = readFileSync(path.join(ROOT, "scripts/verify-deploy.mjs"), "utf8");
ok(!/\[0-9a-f\]\{7,40\}\)\\b\/g/.test(vd) && /SHA:\[\^<0-9a-f\]\{0,8\}/.test(vd), "verify-deploy.mjs: reads the banner, never any 7-hex word");
const dj = JSON.parse(readFileSync(path.join(ROOT, "deploy.json"), "utf8"));
ok(/DEPLOY\.site/.test(src) && /^https:\/\//.test(dj.site), "status.mjs: the site address comes from deploy.json");

console.log(`\nSTATUS-SECOND-SOURCE ${pass}/${pass + fail} passed — the report line knows what is live from either source, and says which`);
if (fail > 0) process.exit(1);
