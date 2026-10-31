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
//   LIVE      — the deployed site serves this SHA (verified by fetching it, or by the instrument that fetched it)
//
// THE SECOND SOURCE (operator 2026-10-31: "make sure you know what architect-2525 is live always"). Inside the Claude Code
// sandbox the site host is outside the environment's allowed network domains, so the direct probe cannot complete there —
// and for a week that was reported as UNVERIFIED while the Verify Live workflow had been saying STALE 000fe42 every run.
// So: when the direct probe is unreachable, this script reads the latest Verify Live run's LIVE STATE annotation through the
// GitHub API (api.github.com IS reachable; GH_TOKEN/GITHUB_TOKEN is set in the sandbox) and reports LIVE/STALE from that
// evidence when it is fresh (≤ 60 min), naming the source and the time. UNVERIFIED is written only when BOTH sources failed,
// with both failures quoted. Unreachable is still never a pass.
//
//   node scripts/status.mjs            # full check, human-readable block
//   node scripts/status.mjs --line     # one-line form
//   SITE_URL=https://... node scripts/status.mjs
//   GITHUB_API_URL=http://127.0.0.1:9 node scripts/status.mjs   # (tests) point the second source at a fake API

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEPLOY = JSON.parse(readFileSync(path.join(HERE, "..", "deploy.json"), "utf8"));
const SITE = process.env.SITE_URL || DEPLOY.site;
const MAIN = "main";
const DEV = "claude/debug-wsl-issues-yYdPP";
const REPO = "alexseguin-hbs/eXeL-AI-Polling";
const API = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");
const EVIDENCE_FRESH_MIN = 60;   // CI evidence older than this is quoted but does not count as LIVE/STALE
const oneLine = process.argv.includes("--line");

const git = (cmd) => execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
const sha = process.env.STATUS_SHA ? git(`rev-parse ${process.env.STATUS_SHA}`) : git("rev-parse HEAD");   // STATUS_SHA: read any past commit
const short = sha.slice(0, 7);
const subject = git("log -1 --format=%s").slice(0, 72);
const dirty = git("status --porcelain").length > 0;
const hhmm = (iso) => (iso ? String(iso).replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}).*$/, "$1T$2Z") : "?");

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

// ── LIVE, source 1: fetch the site and read the stamped SHA (app/layout.tsx renders NEXT_PUBLIC_GIT_SHA) ──
// The banner only — NO fallback to "the first 7-hex word in the HTML": that match passed by luck for a week (fleet r.147).
let live = { state: "UNVERIFIED", sha: null, note: "", source: null, at: null, ageMin: null, built: "" };
let directNote = "";
try {
  const res = await fetch(SITE, { headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    directNote = `HTTP ${res.status} — could not read the site`;
  } else {
    const html = await res.text();
    const found = html.match(/SHA:[^<0-9a-f]{0,8}(?:<[^>]*>[^<0-9a-f]{0,8})?([0-9a-f]{7})/i)?.[1] || null;
    if (!found) directNote = "no SHA stamped in the served HTML";
    else { live = { ...live, sha: found, state: found === short ? "LIVE" : "STALE", source: "direct", at: new Date().toISOString(), ageMin: 0 }; }
  }
} catch (e) {
  // Unreachable is UNVERIFIED. It is NOT a pass. Do not report this as deployed — read the second source.
  directNote = `unreachable (${(e?.message || e).toString().slice(0, 60)})`;
}

// ── the GitHub API, with the session token (fetch), else the gh CLI, else nothing ────────────────────────────────────────────
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const hasGh = !process.env.STATUS_NO_GH && (() => { try { execSync("command -v gh", { stdio: "ignore" }); return true; } catch { return false; } })();
let apiNote = TOKEN ? "" : hasGh ? "" : "no GitHub token here (set GH_TOKEN) and no gh";
const ghGet = async (p) => {
  if (TOKEN) {
    const r = await fetch(`${API}/repos/${REPO}/${p}`, { headers: { authorization: `Bearer ${TOKEN}`, accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`GitHub API ${r.status} on ${p.split("?")[0]}`);
    return r.json();
  }
  if (hasGh) return JSON.parse(execSync(`gh api "repos/${REPO}/${p}"`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  return null;
};

// ── LIVE, source 2: the latest Verify Live run's LIVE STATE annotation (the instrument that CAN reach the site) ──────────────
let ciNote = "";
if (live.state === "UNVERIFIED") {
  try {
    const runs = await ghGet("actions/workflows/verify-live.yml/runs?per_page=1");
    const run = runs?.workflow_runs?.[0];
    if (!run) ciNote = runs === null ? apiNote : "no Verify Live run on record";
    else {
      const jobs = await ghGet(`actions/runs/${run.id}/jobs`);
      const job = jobs?.jobs?.[0];
      const ann = (job ? await ghGet(`check-runs/${job.id}/annotations`) : []) || [];
      let ciSha = null, readAt = null, built = "";
      const ls = ann.find((a) => a.title === "LIVE STATE");
      if (ls) {
        const m = String(ls.message).match(/live=([0-9a-f]{7}) built (\S+ \S+ CST)/);
        const r = String(ls.message).match(/read=(\S+)/);
        if (m) { ciSha = m[1]; built = m[2]; }
        if (r) readAt = r[1];
      } else {
        // runs before the LIVE STATE step existed: the STALE/LIVE annotation still names what the site served
        const st = ann.find((a) => /site is serving ([0-9a-f]{7})/.test(String(a.message)));
        const lv = ann.find((a) => /is serving ([0-9a-f]{7})$/.test(String(a.message)));
        if (st) ciSha = String(st.message).match(/site is serving ([0-9a-f]{7})/)[1];
        else if (lv) ciSha = String(lv.message).match(/is serving ([0-9a-f]{7})$/)[1];
        readAt = run.updated_at;
      }
      if (!ciSha) ciNote = `verify-live #${run.run_number} (${hhmm(run.updated_at)}) carries no live sha`;
      else {
        const at = readAt || run.updated_at;
        const ageMin = Math.max(0, Math.round((Date.now() - Date.parse(at)) / 60000));
        const source = `verify-live #${run.run_number}`;
        if (ageMin <= EVIDENCE_FRESH_MIN) live = { state: ciSha === short ? "LIVE" : "STALE", sha: ciSha, note: "", source, at: hhmm(at), ageMin, built };
        else { ciNote = `last CI read live=${ciSha}${built ? ` built ${built}` : ""} (${source} · ${hhmm(at)} · ${ageMin} min ago — older than ${EVIDENCE_FRESH_MIN} min, does not count)`; live = { ...live, source, at: hhmm(at), ageMin, lastSha: ciSha }; }
      }
    }
  } catch (e) { ciNote = `CI unread (${(e?.message || e).toString().slice(0, 60)})`; }
}
const HOWTO = 'read the latest Verify Live "LIVE STATE" annotation: GitHub Actions tools actions_list(list_workflow_runs, verify-live.yml) → list_workflow_jobs → get_job_logs, or gh api check-runs/<job>/annotations';
if (live.state === "UNVERIFIED") live.note = `no probe: direct [${directNote || "not attempted"}]; CI [${ciNote || apiNote || "not read"}]) → ${HOWTO}`;

// ── ACTIONS (fourth stage, fleet r.147 Krishna/MoT 11): the Deploy gate and Verify Live for THIS sha. A Deploy whose ship
// steps were skipped reads SKIPPED, never ✓; without an API it reads UNVERIFIED.
let actions = { state: "UNVERIFIED", note: apiNote || "GitHub API not readable here" };
try {
  const full = execSync(`git rev-parse ${sha}`, { encoding: "utf8" }).trim();
  const runsBySha = await ghGet(`actions/runs?head_sha=${full}`);
  if (runsBySha) {
    const runs = runsBySha.workflow_runs || [];
    const deploy = runs.find((r) => r.name === "Deploy"), verify = runs.find((r) => /verify/i.test(r.name));
    const word = (r) => (r ? (r.status !== "completed" ? r.status : r.conclusion) : "none");
    let ship = "—", why = "";
    if (deploy && deploy.status === "completed") {
      try {
        const jobs = (await ghGet(`actions/runs/${deploy.id}/jobs`))?.jobs || [];
        const steps = jobs.flatMap((j) => j.steps || []);
        const shipStep = steps.find((st) => /^Deploy$/.test(st.name));
        ship = !shipStep ? "—" : shipStep.conclusion === "skipped" ? "SKIPPED" : shipStep.conclusion;
        // A red gate names its failing step: read the cause, never guess it.
        why = steps.filter((st) => st.conclusion === "failure").map((st) => st.name).join(" · ");
      } catch { ship = "?"; }
    }
    // Cloudflare's own git build (the deployer) — its check-run carries no log, so a failure here is read together with the
    // Deploy gate's failing step above, and reproduced with `npm run build` locally.
    let cf = "none";
    try {
      const cr = ((await ghGet(`commits/${full}/check-runs`))?.check_runs || []).find((c) => /^Workers Builds/.test(c.name));
      if (cr) cf = cr.status !== "completed" ? cr.status : cr.conclusion;
    } catch {}
    actions = { state: "READ", deploy: word(deploy), ship, verify: word(verify), cf, why, note: "" };
  }
} catch (e) { actions.note = `GitHub API unread (${(e?.message || e).toString().slice(0, 50)})`; }

const mark = (ok) => (ok ? "✓" : "✗");
const evidence = live.source ? `${live.source} · ${live.at}${live.ageMin ? ` · ${live.ageMin} min ago` : ""}` : "none";
if (oneLine) {
  const liveTxt = live.state === "LIVE" ? `LIVE ${live.sha} (${evidence})` : live.state === "STALE" ? `STALE ${live.sha} (${evidence})` : `UNVERIFIED (${live.note}`;
  const act = actions.state === "READ" ? ` | CF build ${actions.cf} | actions Deploy ${actions.deploy}${actions.why ? ` (${actions.why})` : ""} · ship ${actions.ship} · Verify Live ${actions.verify}` : " | actions UNVERIFIED";
  console.log(`SHA ${short} | committed ${mark(!dirty)} | pushed ${mark(pushed)} | cloudflare ${liveTxt}${act}`);
} else {
  console.log(`
┌─ DEPLOY STATUS ────────────────────────────────────────────
│ SHA        ${short}  ${subject}
│ COMMITTED  ${mark(!dirty)} ${dirty ? "working tree DIRTY — uncommitted changes exist" : "clean"}
${branches.map((b) => `│ PUSHED     ${mark(b.ok)} origin/${b.br} = ${b.short}`).join("\n")}
│ CLOUDFLARE ${live.state === "LIVE" ? `✓ LIVE — serving ${live.sha}` : live.state === "STALE" ? `✗ STALE — serving ${live.sha}, expected ${short}` : `? UNVERIFIED — ${live.note}`}
│ EVIDENCE   ${evidence}${live.built ? ` · built from commit of ${live.built}` : ""}
│ ACTIONS    ${actions.state === "READ" ? `CF build ${actions.cf} · Deploy ${actions.deploy}${actions.why ? ` (failed: ${actions.why})` : ""} · ship ${actions.ship} · Verify Live ${actions.verify}` : `? UNVERIFIED — ${actions.note}`}
│ WEBSITE    ${SITE}
└────────────────────────────────────────────────────────────`);
  if (live.state === "STALE") console.log(`  → Cloudflare has not promoted ${short}. Check Deployments (promote the newest Ready version), or run: npm run ship`);
  if (live.state === "UNVERIFIED") console.log(`  → Neither source answered. UNVERIFIED never means shipped. Ask the operator for his footer stamp, or allow the site host in the environment's network settings.`);
  if (actions.cf === "failure") console.log(`  → Cloudflare's build FAILED. Read the Deploy gate's failing step above and reproduce with \`npm run build\` before pushing any fix.`);
  if (actions.ship === "SKIPPED") console.log(`  → The Actions ship steps were SKIPPED (secrets absent): Cloudflare's git build is the only deployer of this sha.`);
}

// Exit 0 only when all three stages are true. Anything else is a non-zero, on purpose.
process.exit(!dirty && pushed && live.state === "LIVE" ? 0 : 1);
