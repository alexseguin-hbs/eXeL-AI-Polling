/**
 * Proves the suite runner cannot mint nine complete rounds from a single invocation fingerprint.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateBatchLedger } from "../lib/validate-round.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("FAIL:", msg); } }

const runSuitePath = path.join(__dirname, "../runner/run-suite.mjs");
const src = fs.readFileSync(runSuitePath, "utf8");
ok(/minted_nine_from_one_run/.test(src) || /refuse|FORBIDDEN|cannot mark complete/.test(src), "runner source discusses anti-mint policy");
ok(!/for\s*\(.*9.*\)\s*\{[^}]*status:\s*['\"]complete['\"]/s.test(src), "runner does not loop-assign complete×9");

// One fingerprint + multiple completes → batch validator refuse
const fake = {
  rounds: [1, 2, 3].map((n) => ({
    round: n,
    status: "complete",
    hypothesis: "same fingerprint illegally reused",
    source_sha: "4c2761a",
    suite_run_fingerprint: "ONE",
    ssses: Object.fromEntries(["Security","Stability","Scalability","Efficiency","Succinctness"].map((p) => [p, { status: "blocked" }])),
    spiral: { forward: [], backward: [] },
    tests_run: [{ id: "t", command: "true", status: "pass", exit_code: 0, stdout_sha256: "0".repeat(64) }],
    evidence_separators: { test_count_is_not_pillar_score: true },
    asm_before: { mode: "role-perspective-simulation", author_label: "x", claim_independent_signoffs: false, comments: [] },
    asm_after: { mode: "role-perspective-simulation", author_label: "x", claim_independent_signoffs: false, comments: [] },
    mot_synthesis: { signed_as_claude_mot: false, paragraphs: ["a", "b", "c"] },
  })),
};
const v = validateBatchLedger(fake);
ok(!v.ok, "shared fingerprint across completes refused: " + v.issues[0]);

console.log(`runner-safety: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
