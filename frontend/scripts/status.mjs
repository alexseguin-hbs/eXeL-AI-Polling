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
const sha = process.env.STATUS_SHA ? git(`rev-parse ${process.env.STATUS_SHA}`) : git("rev-parse HEAD");   // STATUS_SHA: read any past commit
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

// ── ACTIONS (fourth stage, fleet r.147 Krishna/MoT 11): the Deploy gate and Verify Live for THIS sha, read through `gh`
// where it exists. A Deploy whose ship steps were skipped reads SKIPPED, never ✓; without gh it reads UNVERIFIED.
let actions = { state: "UNVERIFIED", note: "gh not available here" };
// `gh api` works with the GitHub CLI and with Claude Code's built-in client alike (`gh run list` does not exist in the latter —
// that gap is why a red Cloudflare build was read for hours with no cause: 2026-10-07, one unescaped apostrophe).
const ghApi = (path) => JSON.parse(execSync(`gh api "repos/alexseguin-hbs/eXeL-AI-Polling/${path}"`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
try {
  const full = execSync(`git rev-parse ${sha}`, { encoding: "utf8" }).trim();
  const runs = ghApi(`actions/runs?head_sha=${full}`).workflow_runs || [];
  const deploy = runs.find((r) => r.name === "Deploy"), verify = runs.find((r) => /verify/i.test(r.name));
  const word = (r) => (r ? (r.status !== "completed" ? r.status : r.conclusion) : "none");
  let ship = "—", why = "";
  if (deploy && deploy.status === "completed") {
    try {
      const jobs = ghApi(`actions/runs/${deploy.id}/jobs`).jobs || [];
      const steps = jobs.flatMap((j) => j.steps || []);
      const shipStep = steps.find((st) => /^Deploy$/.test(st.name));
      ship = !shipStep ? "—" : shipStep.conclusion === "skipped" ? "SKIPPED" : shipStep.conclusion;
      // A red gate names its failing step: read the cause, never guess it.
      why = steps.filter((st) => st.conclusion === "failure").map((st) => st.name).join(" · ");
    } catch { ship = "?"; }
  }
  // Cloudflare's own git build (the deployer while the Actions ship is skipped) — its check-run carries no log, so a
  // failure here is read together with the Deploy gate's failing step above, and reproduced with `npm run build` locally.
  let cf = "none";
  try {
    const cr = (ghApi(`commits/${full}/check-runs`).check_runs || []).find((c) => /^Workers Builds/.test(c.name));
    if (cr) cf = cr.status !== "completed" ? cr.status : cr.conclusion;
  } catch {}
  actions = { state: "READ", deploy: word(deploy), ship, verify: word(verify), cf, why, note: "" };
} catch {}
const mark = (ok) => (ok ? "✓" : "✗");
if (oneLine) {
  const liveTxt = live.state === "LIVE" ? `LIVE ${live.sha}` : live.state === "STALE" ? `STALE ${live.sha}` : "UNVERIFIED";
  const act = actions.state === "READ" ? ` | CF build ${actions.cf} | actions Deploy ${actions.deploy}${actions.why ? ` (${actions.why})` : ""} · ship ${actions.ship} · Verify Live ${actions.verify}` : " | actions UNVERIFIED";
  console.log(`SHA ${short} | committed ${mark(!dirty)} | pushed ${mark(pushed)} | cloudflare ${liveTxt}${act}`);
} else {
  console.log(`
┌─ DEPLOY STATUS ────────────────────────────────────────────
│ SHA        ${short}  ${subject}
│ COMMITTED  ${mark(!dirty)} ${dirty ? "working tree DIRTY — uncommitted changes exist" : "clean"}
${branches.map((b) => `│ PUSHED     ${mark(b.ok)} origin/${b.br} = ${b.short}`).join("\n")}
│ CLOUDFLARE ${live.state === "LIVE" ? `✓ LIVE — serving ${live.sha}` : live.state === "STALE" ? `✗ STALE — serving ${live.sha}, expected ${short}` : `? UNVERIFIED — ${live.note}`}
│ ACTIONS    ${actions.state === "READ" ? `CF build ${actions.cf} · Deploy ${actions.deploy}${actions.why ? ` (failed: ${actions.why})` : ""} · ship ${actions.ship} · Verify Live ${actions.verify}` : `? UNVERIFIED — ${actions.note}`}
│ WEBSITE    ${SITE}
└────────────────────────────────────────────────────────────`);
  if (live.state === "STALE") console.log(`  → Cloudflare has not promoted ${short}. Check Deployments, or run: npm run ship`);
  if (live.state === "UNVERIFIED") console.log(`  → Run this from a machine with network access. UNVERIFIED never means shipped.`);
  if (actions.cf === "failure") console.log(`  → Cloudflare's build FAILED. Read the Deploy gate's failing step above and reproduce with \`npm run build\` before pushing any fix.`);
  if (actions.ship === "SKIPPED") console.log(`  → The Actions ship steps were SKIPPED (secrets absent): Cloudflare's git build is the only deployer of this sha.`);
}

// Exit 0 only when all three stages are true. Anything else is a non-zero, on purpose.
process.exit(!dirty && pushed && live.state === "LIVE" ? 0 : 1);
