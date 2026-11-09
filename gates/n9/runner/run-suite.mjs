#!/usr/bin/env node
/**
 * N9 gate suite entry — invokes EXISTING tests + records evidence.
 *
 * FORBIDDEN behaviors (enforced here + by tests/runner-safety.test.mjs):
 *  - Minting status=complete for rounds N1–N9 from one suite fingerprint
 *  - Treating skipped/blocked/unverified as pass or SSSES 100
 *  - Fabricating AsM 111 / MoT 333 review bodies
 *  - Claiming weekly official fee fetch or cost-panel API wiring as pass when absent
 *  - Live production writes, provider charges, load tests (default off)
 *
 * Usage:
 *   node gates/n9/runner/run-suite.mjs                  # default safe groups
 *   node gates/n9/runner/run-suite.mjs --group n1_baseline_tooling
 *   node gates/n9/runner/run-suite.mjs --group n2_payments_costs --dry-assertions
 *   N9_LIVE_READONLY=1 ...                              # opt-in only (still no writes)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { runAndRecord, gitHeadSha, pathExists } from "../lib/evidence-record.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GATE_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(GATE_ROOT, "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : null;
}
const onlyGroup = flag("--group");
const dryAssertions = args.includes("--dry-assertions") || args.includes("--assertions-only");
const listOnly = args.includes("--list");

const sha = gitHeadSha(REPO_ROOT);
const runId = createHash("sha256").update(`${sha}:${Date.now()}:${process.pid}`).digest("hex").slice(0, 16);
const evidenceDir = path.join(GATE_ROOT, ".evidence", `run-${runId}`);
fs.mkdirSync(evidenceDir, { recursive: true });

/** Anti-mint: this fingerprint may attach to open/in_progress ledgers only — never auto-complete N1–N9. */
const suite_run_fingerprint = createHash("sha256").update(`suite:${runId}:${sha}`).digest("hex");

console.log(`N9 gate suite`);
console.log(`  repo: ${REPO_ROOT}`);
console.log(`  HEAD: ${sha}`);
console.log(`  run:  ${runId}`);
console.log(`  fingerprint: ${suite_run_fingerprint} (MUST NOT mint 9 completes)`);
console.log(`  evidence: ${evidenceDir}`);
if (sha !== manifest.base_sha_expected && !args.includes("--allow-other-sha")) {
  console.warn(`WARN: HEAD ${sha.slice(0, 7)} ≠ pinned QA base ${manifest.base_sha_expected.slice(0, 7)} (continue; label results)`);
}

function readPkgScripts() {
  try {
    return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "frontend/package.json"), "utf8")).scripts || {};
  } catch { return {}; }
}
const scripts = readPkgScripts();

function fileContains(abs, needles) {
  if (!pathExists(abs)) return null;
  const txt = fs.readFileSync(abs, "utf8");
  return needles.some((n) => txt.includes(n));
}

function runAssertAbsent(entry) {
  const abs = path.join(REPO_ROOT, entry.path);
  if (entry.glob_must_contain) {
    // directory scan for payment_service style
    const dir = abs;
    let found = false;
    if (pathExists(dir)) {
      const walk = (d) => {
        for (const name of fs.readdirSync(d)) {
          const p = path.join(d, name);
          const st = fs.statSync(p);
          if (st.isDirectory()) walk(p);
          else if (!entry.in_files_matching || name.includes(entry.in_files_matching.replace(/\*/g, ""))) {
            if (fs.readFileSync(p, "utf8").includes(entry.glob_must_contain)) found = true;
          }
        }
      };
      try { walk(dir); } catch { /* */ }
    }
    // QA expectation: idempotency helper unused → we FAIL the *claim* that it is used.
    // Status semantics: expect_status fail means "product claim fails" recorded as fail.
    const status = found && entry.expect_status === "fail" ? "pass" : (entry.expect_status || "fail");
    // Clarify: for stripe idempotency, found=false means unused → product gap → status fail
    const productGap = entry.id === "stripe-idempotency-used" ? !found : null;
    return {
      id: entry.id,
      command: `assert:${entry.id}`,
      status: productGap === true ? "fail" : productGap === false ? "pass" : (found ? "pass" : "fail"),
      exit_code: null,
      stdout_sha256: createHash("sha256").update(String(found)).digest("hex"),
      note: entry.note || "",
      detail: { found, expect_status: entry.expect_status },
      failure_class: "product_gap_assert",
    };
  }
  if (entry.must_not_contain) {
    const hit = fileContains(abs, entry.must_not_contain);
    // If forbidden tokens absent → confirms "no official fetch" gap → record as fail of the capability claim
    const hasFetch = hit === true;
    const status = hasFetch ? "pass" : "fail"; // pass only if fetch code exists
    return {
      id: entry.id,
      command: `assert_absent_fetch:${entry.path}`,
      status,
      exit_code: null,
      stdout_sha256: createHash("sha256").update(String(hit)).digest("hex"),
      note: entry.note || "docs/config only — not a pass for weekly official lookup",
      failure_class: hasFetch ? null : "docs_only_weekly_lookup",
    };
  }
  if (entry.must_contain_any) {
    const hit = fileContains(abs, entry.must_contain_any);
    const status = hit ? "pass" : "fail";
    return {
      id: entry.id,
      command: `assert_contains:${entry.path}`,
      status,
      exit_code: null,
      stdout_sha256: createHash("sha256").update(String(hit)).digest("hex"),
      note: entry.note || "",
      failure_class: hit ? null : "panel_not_api_wired",
    };
  }
  return { id: entry.id, status: "unverified", note: "unknown assert shape" };
}

function resolveAvailability(entry) {
  if (entry.availability === "always") return { run: true };
  if (entry.availability === "blocked" || entry.kind === "blocked") {
    return { run: false, blockedReason: entry.reason || entry.note || "blocked" };
  }
  if (entry.availability === "if_exists") {
    const p = path.join(REPO_ROOT, entry.path);
    return pathExists(p) ? { run: true } : { run: false, notAvailable: true };
  }
  if (entry.availability === "if_script") {
    return scripts[entry.script] ? { run: true } : { run: false, notAvailable: true };
  }
  if (entry.availability === "opt_in_checkout" || entry.kind === "external_ref") {
    return { run: false, blockedReason: entry.note || "opt-in external checkout" };
  }
  if (entry.kind === "assert_absent") return { run: true, assert: true };
  return { run: true };
}

const results = [];
const groups = Object.entries(manifest.groups).filter(([name]) => !onlyGroup || name === onlyGroup);

if (listOnly) {
  for (const [name, g] of groups) {
    console.log(`\n## ${name} (round_hint ${g.round_hint})`);
    for (const c of g.commands) console.log(`  - ${c.id} [${c.kind}] ${c.note || ""}`);
  }
  process.exit(0);
}

for (const [name, g] of groups) {
  console.log(`\n== group ${name} ==`);
  for (const entry of g.commands) {
    const avail = resolveAvailability(entry);
    if (entry.kind === "assert_policy") {
      const rec = {
        id: entry.id,
        command: `policy:${entry.id}`,
        status: entry.expect_status || "fail",
        exit_code: null,
        stdout_sha256: null,
        note: entry.note || "",
        failure_class: "policy_unverified",
      };
      results.push({ group: name, round_hint: g.round_hint, ...rec });
      console.log(`  ${rec.id}: ${rec.status} — ${(rec.note || "").slice(0, 100)}`);
      fs.writeFileSync(path.join(evidenceDir, `${rec.id}.json`), JSON.stringify(rec, null, 2));
      continue;
    }
    if (entry.kind === "assert_absent") {
      if (!dryAssertions && args.includes("--skip-assertions")) continue;
      const rec = runAssertAbsent(entry);
      results.push({ group: name, round_hint: g.round_hint, ...rec });
      console.log(`  ${rec.id}: ${rec.status}${rec.note ? " — " + rec.note.slice(0, 80) : ""}`);
      fs.writeFileSync(path.join(evidenceDir, `${rec.id}.json`), JSON.stringify(rec, null, 2));
      continue;
    }
    if (dryAssertions && entry.kind !== "assert_absent") continue;

    if (!avail.run) {
      const rec = runAndRecord({
        id: entry.id,
        command: entry.cmd?.[0] || entry.kind,
        args: entry.cmd?.slice(1) || [],
        cwd: path.join(REPO_ROOT, entry.cwd || "."),
        evidenceDir,
        notAvailable: avail.notAvailable,
        blockedReason: avail.blockedReason,
      });
      results.push({ group: name, round_hint: g.round_hint, failure_class: entry.failure_class || null, ...rec });
      console.log(`  ${entry.id}: ${rec.status}`);
      continue;
    }

    const cwd = path.join(REPO_ROOT, entry.cwd || ".");
    const [command, ...cmdArgs] = entry.cmd;
    const rec = runAndRecord({ id: entry.id, command, args: cmdArgs, cwd, evidenceDir });
    if (entry.failure_class && rec.status === "fail") rec.failure_class = entry.failure_class;
    if (entry.expect_on_main_4c2761a === "fail" && sha.startsWith("4c2761a") && rec.status === "fail") {
      rec.note = (entry.note || "") + " [expected fail on pinned main — capture for fail→fix→retest]";
      rec.expected_fail_on_base = true;
    }
    results.push({ group: name, round_hint: g.round_hint, ...rec });
    console.log(`  ${entry.id}: ${rec.status} (${rec.duration_ms || 0}ms)`);
  }
}

const summary = {
  suite: "gates/n9",
  suite_run_fingerprint,
  source_sha: sha,
  run_id: runId,
  america_chicago_note: "box clock = America/Chicago",
  minted_nine_from_one_run: false,
  html_allowed: false,
  ssses_scores_invented: false,
  qa_baseline_incorporated: manifest.qa_baseline,
  known_gaps_from_qa: [
    "main@4c2761a Workers/typecheck RED — PR3 hotfix 1dcd2ae unmerged",
    "weekly fee lookup docs/config only — NOT official fetch (assert fail = correct)",
    "Cost panel static catalog — NOT /payments/provider-fees API",
    "stripe_idempotency_key unused on PaymentIntent.create",
    "cost UI residual hardcoded strings; 33-lang for cost_* unverified",
    "sim-console-driver harness alias @/lib fail (distinct from product asserts)",
    "backend jurisdiction 60!=59 on main CI",
    "18 cost fixtures ≠ invoice proof",
    "pod-persist / sf-collab not_available on main (PR4/PR5 open)",
  ],
  results,
  counts: {
    pass: results.filter((r) => r.status === "pass").length,
    fail: results.filter((r) => r.status === "fail").length,
    blocked: results.filter((r) => r.status === "blocked").length,
    not_available: results.filter((r) => r.status === "not_available").length,
    unverified: results.filter((r) => r.status === "unverified").length,
  },
  reminder: "test_count_is_not_pillar_score — do not convert counts to SSSES 100; AsM/MoT bodies not fabricated by this runner",
};
fs.writeFileSync(path.join(evidenceDir, "SUMMARY.json"), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(GATE_ROOT, "evidence/samples/last-summary.json"), JSON.stringify({
  ...summary,
  results: summary.results.map(({ stdout, stderr, ...r }) => r),
}, null, 2));

console.log(`\nSummary: pass=${summary.counts.pass} fail=${summary.counts.fail} blocked=${summary.counts.blocked} not_available=${summary.counts.not_available}`);
console.log(`Evidence: ${evidenceDir}/SUMMARY.json`);
console.log(`FORBIDDEN: using fingerprint ${suite_run_fingerprint} to mark N1–N9 complete.`);
// Exit nonzero if any unexpected fail among always-available executable tests in n1 only when --strict
if (args.includes("--strict-n1")) {
  const n1fails = results.filter((r) => r.group === "n1_baseline_tooling" && r.status === "fail");
  process.exit(n1fails.length ? 1 : 0);
}
process.exit(0);
