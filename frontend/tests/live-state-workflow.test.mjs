#!/usr/bin/env node
/**
 * KNOW WHAT IS LIVE, ALWAYS — the workflow text gate (operator 2026-10-31).
 *
 * verify-live.yml must open with a LIVE STATE step that never fails and always publishes one machine-readable line (what the site
 * serves, where it came from, what Cloudflare holds active and unpromoted, when it was read), resolve WANT from an input → the
 * repo's production-branch declaration → github.sha, name what IS live when it calls the compare STALE, and probe the
 * Architect-2525 route on the edge (markup · stamp · the /main redirect · geolocation=(self)). deploy.yml must not hide a red
 * postbuild behind `tee` and must pin the wrangler it deploys with. Every hard-coded site address equals frontend/deploy.json.
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.join(ROOT, "..");
const rd = (p) => readFileSync(path.join(REPO, p), "utf8");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const vl = rd(".github/workflows/verify-live.yml");
const dp = rd(".github/workflows/deploy.yml");
const as = rd(".github/workflows/architect-screens.yml");
const asm = rd("frontend/scripts/architect-screens.mjs");
const st = rd("frontend/scripts/status.mjs");
const vd = rd("frontend/scripts/verify-deploy.mjs");
const pkg = JSON.parse(rd("frontend/package.json"));
const ship = rd("frontend/scripts/ship.sh");
const dj = JSON.parse(rd("frontend/deploy.json"));

// ── deploy.json — the one declaration ───────────────────────────────────────────────────────────────────────────────────────
ok(/^https:\/\/[a-z0-9.-]+$/.test(dj.site) && /^https:\/\/[a-z0-9.-]+$/.test(dj.previewAlias), "deploy.json: site and previewAlias are https origins");
let remoteBranches = [];
try { remoteBranches = execSync("git branch -r --format=%(refname:short)", { cwd: REPO, encoding: "utf8" }).split("\n").map((s) => s.replace(/^origin\//, "").trim()).filter(Boolean); } catch {}
ok(remoteBranches.length === 0 || remoteBranches.includes(dj.productionBranch), `deploy.json: productionBranch "${dj.productionBranch}" is a remote branch (${remoteBranches.length ? remoteBranches.slice(0, 4).join(", ") : "no remote in this clone"})`);
ok(dj.deployer === "cloudflare-workers-builds" && dj.worker === "exel-ai-polling", "deploy.json: names the deployer and the Worker");

// ── every hard-coded site address equals deploy.json.site ──────────────────────────────────────────────────────────────────
const sites = [...vl.matchAll(/^\s*SITE:\s*(\S+)\s*$/gm)].map((m) => m[1]);
ok(sites.length >= 5 && sites.every((s) => s === dj.site), `verify-live.yml: every SITE value equals deploy.json.site (${sites.length} found)`);
ok(new RegExp(`DECK_URL: ${dj.site.replace(/[.]/g, "\\.")}/drone-2525/play\\.html`).test(vl), "verify-live.yml: the deck QA URL is on the same site");
ok(new RegExp(`default: ${dj.site.replace(/[.]/g, "\\.")}$`, "m").test(as) && as.includes(`'${dj.site}'`), "architect-screens.yml: the default URL is deploy.json.site");
ok(asm.includes(`'${dj.site}'`), "architect-screens.mjs: the default URL is deploy.json.site");
ok(/DEPLOY\.site/.test(st) && !/process\.env\.SITE_URL \|\| "https:\/\//.test(st), "status.mjs: reads the site from deploy.json, not a literal");
ok(vd.includes(`"${dj.site}"`) || /DEPLOY\.site/.test(vd), "verify-deploy.mjs: the same site");

// ── verify-live.yml — the LIVE STATE step comes first and never fails ──────────────────────────────────────────────────────
ok(/- uses: actions\/checkout@v4\n\s+with:\n\s+fetch-depth: 0/.test(vl), "verify-live.yml: full history is fetched (branches containing the live sha; origin/<branch> for WANT)");
const stepNames = [...vl.matchAll(/^\s+- name: (.+)$/gm)].map((m) => m[1]);
ok(stepNames[0] === "LIVE STATE (never fails)", `verify-live.yml: the first named step is LIVE STATE (found "${stepNames[0]}")`);
const liveStep = vl.slice(vl.indexOf("- name: LIVE STATE (never fails)"), vl.indexOf("- name: Resolve WANT"));
ok(/continue-on-error: true/.test(liveStep) && /\n\s+exit 0\n/.test(liveStep), "LIVE STATE: continue-on-error and an explicit exit 0 — it can never make the run red");
for (const tok of ['::notice title=LIVE STATE::', "live=", "built", "arch=", "branches=", "cf.active=", "cf.unpromoted=", "preview=", "read="]) ok(liveStep.includes(tok), `LIVE STATE: the line carries ${tok}`);
ok(/GITHUB_STEP_SUMMARY/.test(liveStep) && /live-state\.json/.test(liveStep) && /GITHUB_ENV/.test(liveStep), "LIVE STATE: published to the summary, to live-state.json and to the job env");
ok(/git branch -r --contains/.test(liveStep), "LIVE STATE: names the branches that contain the live sha");
ok(/wrangler@4\.115\.0 deployments list --json/.test(liveStep) && /wrangler@4\.115\.0 versions list --json/.test(liveStep) && /UNREAD\(secrets absent\)/.test(liveStep), "LIVE STATE: reads Cloudflare's active and unpromoted versions with the pinned wrangler, only when the secrets exist, and says UNREAD otherwise");
ok(/previewAlias/.test(liveStep), "LIVE STATE: reads the branch preview alias from deploy.json");
ok(/uses: actions\/upload-artifact@v4\n\s+if: always\(\)\n\s+with:\n\s+name: live-state\n\s+path: live-state\.json/.test(vl), "verify-live.yml: live-state.json is uploaded as an artifact on every run");

// ── Resolve WANT: input → deploy.json → github.sha ───────────────────────────────────────────────────────────────────────────
ok(/workflow_dispatch:\n\s+inputs:\n\s+want:/.test(vl), "verify-live.yml: workflow_dispatch takes a `want` input (a sha or a branch)");
const wantStep = vl.slice(vl.indexOf("- name: Resolve WANT"), vl.indexOf("- name: Probe hosted migration 036"));
const wantRun = wantStep.slice(wantStep.indexOf("run: |"));   // the script body, not the env block that declares the inputs
const order = ["$WANT_INPUT", "deploy.json", "$GITHUB_SHA_IN"].map((t) => wantRun.indexOf(t));
ok(order.every((i) => i >= 0) && order[0] < order[1] && order[1] < order[2], "Resolve WANT: the input first, then deploy.json's productionBranch, then github.sha");
ok(/steps\.want\.outputs\.sha7/.test(vl) && /WANT: \$\{\{ steps\.want\.outputs\.sha \}\}/.test(vl), "the poll step compares against the resolved WANT, not github.sha");
ok(/::error title=STALE::want \$want7 \(\$WANT_SOURCE\) · live=/.test(vl) && /cf\.active=\$\{CF_ACTIVE/.test(vl), "a STALE verdict names what IS live (sha · built · branches · Cloudflare active/unpromoted)");

// ── the Architect-2525 route on the edge ─────────────────────────────────────────────────────────────────────────────────────
const arch = vl.slice(vl.indexOf("- name: Probe /Architect-2525/ on the live site"), vl.indexOf("- name: Does the live site revalidate"));
ok(arch.length > 0, "verify-live.yml: an Architect-2525 route step exists after the drone route step");
ok(/data-arch-ribbon/.test(arch) && /\[ "\$st" = "\$WANT7" \]/.test(arch), "Architect route: 200 + the ribbon markup + the wanted stamp");
ok(/main-redirect-probe/.test(arch) && /301 \$SITE\/Architect-2525\/\?q=1/.test(arch), "Architect route: /main/Architect-2525/?q=1 must 301 to the canonical address with its query (R5, on the edge)");
ok(/geolocation=\(self\)/.test(arch) && /geolocation=\(\)/.test(arch), "Architect route: Permissions-Policy carries geolocation=(self) and never geolocation=() (R5, on the edge)");
ok(!/\/\/main\/|\bmain\/Architect/.test(vl.split("\n").filter((l) => !/main-redirect-probe/.test(l)).join("\n")), "verify-live.yml: /main appears only on lines tagged main-redirect-probe");

// ── the header tells today's truth ───────────────────────────────────────────────────────────────────────────────────────────
ok(!/403s every outbound host/.test(vl) && /api\.github\.com/.test(vl), "verify-live.yml: the header says what the sandbox can and cannot reach today");
ok(!/has never successfully deployed/.test(dp) && /Workers Builds/.test(dp.slice(0, 1500)), "deploy.yml: the header names Cloudflare Workers Builds as the deployer, not a myth");

// ── deploy.yml hygiene: pipefail on the two build steps, the wrangler pin, a red postbuild named ───────────────────────────
const buildSteps = dp.match(/shell: bash\n\s+run: \|\n\s+npm run build 2>&1 \| tee/g) || [];
ok(buildSteps.length === 2, `deploy.yml: both \`npm run build | tee\` steps run under bash -o pipefail (found ${buildSteps.length})`);
const pin = (pkg.scripts.deploy.match(/wrangler@([0-9.]+)/) || [])[1];
ok(!!pin && ship.includes(`wrangler@${pin}`) && dp.includes(`wranglerVersion: "${pin}"`) && vl.includes(`wrangler@${pin}`), `one wrangler pin (${pin}) in package.json, ship.sh, deploy.yml and verify-live.yml`);
ok(/if: failure\(\)\n\s+name: Name the postbuild gate that failed/.test(dp) || /name: Name the postbuild gate that failed\n\s+if: failure\(\)/.test(dp), "deploy.yml: a red gate build names the postbuild gate that failed");
ok(/stamp-count:|render-smoke|sf-layout|nav-gear|html-export/.test(dp), "deploy.yml: the naming step knows the postbuild gates by name");

console.log(`\nLIVE-STATE-WORKFLOW ${pass}/${pass + fail} passed — the instrument always says what is live, and names its sources`);
if (fail > 0) process.exit(1);
