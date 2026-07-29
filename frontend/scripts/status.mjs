#!/usr/bin/env node
// status — the REPORT LINE. Every update to the operator must carry this block.
//
// WHY (AAR 2026-07-29): for four hours "pushed" was reported as "shipped". Five commits were announced as
// done while the live site served a version four hours old. The gate ended at `git push` returning 0, and the
// deployment was never checked — the failure was invisible because nothing in the loop ever compared the
// live site to the commit. This script closes that loop and makes the honest answer the easy one.
//
// THREE STAGES, reported separately. They are NOT the same thing and must never be collapsed:
//   COMMITTED — the work exists locally
//   PUSHED    — origin/main and origin/<dev> actually moved (verified with ls-remote, not assumed)
//   LIVE      — the deployed site serves this SHA (verified by fetching it)
//
// The critical rule: if the site cannot be reached, the answer is UNVERIFIED — never "live". An unreachable
// check is not a pass. Inside the Claude Code sandbox the outbound proxy returns 403 for every host, so LIVE
// can only be confirmed from the operator's machine or CI. Saying "deployed" without proof is the exact
// failure this file exists to prevent.
//
//   node scripts/status.mjs            # full check, human-readable block
//   node scripts/status.mjs --line     # one-line form
//   SITE_URL=https://... node scripts/status.mjs

import { execSync } from "node:child_process";

const SITE = process.env.SITE_URL || "https://exel-ai-polling.explore-096.workers.dev";
const MAIN = "main";
const DEV = "claude/debug-wsl-issues-yYdPP";
const oneLine = process.argv.includes("--line");

const git = (cmd) => execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
const sha = git("rev-parse HEAD");
const short = sha.slice(0, 7);
const subject = git("log -1 --format=%s").slice(0, 72);
const dirty = git("status --porcelain").length > 0;

// ── PUSHED: read the REMOTE, never infer from a push command's exit code ────────────────────
const remoteOf = (br) => {
  try { return execSync(`git ls-remote origin ${br}`, { encoding: "utf8" }).split("\t")[0]?.trim() || ""; }
  catch { return ""; }
};
const branches = [MAIN, DEV].map((br) => {
  const ref = remoteOf(br);
  return { br, ref, ok: ref === sha, short: ref ? ref.slice(0, 7) : "—" };
});
const pushed = branches.every((b) => b.ok);

// ── LIVE: fetch the site and read the stamped SHA (app/layout.tsx renders NEXT_PUBLIC_GIT_SHA) ──
let live = { state: "UNVERIFIED", sha: null, note: "" };
try {
  const res = await fetch(SITE, { headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    live.note = `HTTP ${res.status} — could not read the site`;
  } else {
    const html = await res.text();
    const found = html.match(/SHA:\s*<[^>]*>\s*([0-9a-f]{7,40})/i)?.[1]
      || html.match(/\b[0-9a-f]{7}\b/)?.[0] || null;
    if (!found) live.note = "no SHA stamped in the served HTML";
    else { live.sha = found.slice(0, 7); live.state = live.sha === short ? "LIVE" : "STALE"; }
  }
} catch (e) {
  // Unreachable is UNVERIFIED. It is NOT a pass. Do not report this as deployed.
  live.note = `unreachable (${(e?.message || e).toString().slice(0, 60)}) — this is NOT proof of deployment`;
}

const mark = (ok) => (ok ? "✓" : "✗");
if (oneLine) {
  const liveTxt = live.state === "LIVE" ? `LIVE ${live.sha}` : live.state === "STALE" ? `STALE ${live.sha}` : "UNVERIFIED";
  console.log(`SHA ${short} | committed ${mark(!dirty)} | pushed ${mark(pushed)} | cloudflare ${liveTxt}`);
} else {
  console.log(`
┌─ DEPLOY STATUS ────────────────────────────────────────────
│ SHA        ${short}  ${subject}
│ COMMITTED  ${mark(!dirty)} ${dirty ? "working tree DIRTY — uncommitted changes exist" : "clean"}
${branches.map((b) => `│ PUSHED     ${mark(b.ok)} origin/${b.br} = ${b.short}`).join("\n")}
│ CLOUDFLARE ${live.state === "LIVE" ? `✓ LIVE — serving ${live.sha}` : live.state === "STALE" ? `✗ STALE — serving ${live.sha}, expected ${short}` : `? UNVERIFIED — ${live.note}`}
│ WEBSITE    ${SITE}
└────────────────────────────────────────────────────────────`);
  if (live.state === "STALE") console.log(`  → Cloudflare has not promoted ${short}. Check Deployments, or run: npm run ship`);
  if (live.state === "UNVERIFIED") console.log(`  → Run this from a machine with network access. UNVERIFIED never means shipped.`);
}

// Exit 0 only when all three stages are true. Anything else is a non-zero, on purpose.
process.exit(!dirty && pushed && live.state === "LIVE" ? 0 : 1);
