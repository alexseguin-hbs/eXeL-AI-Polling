import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRound, validateBatchLedger } from "../lib/validate-round.mjs";
import { countWords, ASM_MASTERS } from "../lib/wordcount.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fix = path.join(__dirname, "../fixtures/synthetic");
let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("FAIL:", msg); } }

const words = (n, s="w") => Array.from({length:n}, (_,i)=>`${s}${i}`).join(" ");
const twelve = () => ASM_MASTERS.map((m) => ({ master: m, text: words(111, m), mode: "role-perspective-simulation" }));

const incomplete = JSON.parse(fs.readFileSync(path.join(fix, "sample-round.incomplete.json"), "utf8"));
ok(validateRound(incomplete).ok, "synthetic incomplete sample validates (no complete claim)");

const greenwash = {
  ...incomplete,
  status: "complete",
  ssses: Object.fromEntries(["Security","Stability","Scalability","Efficiency","Succinctness"].map((p) => [p, { status: "unverified", score: 100 }])),
  tests_run: [{ id: "t1", command: "echo", status: "pass", exit_code: 0, stdout_sha256: "a".repeat(64) }],
  asm_before: { mode: "role-perspective-simulation", author_label: "x", claim_independent_signoffs: false, comments: twelve() },
  asm_after: { mode: "role-perspective-simulation", author_label: "x", claim_independent_signoffs: false, comments: twelve() },
  mot_synthesis: { signed_as_claude_mot: false, paragraphs: [words(111,"a"), words(111,"b"), words(111,"c")] },
};
ok(!validateRound(greenwash).ok, "unverified+score100 refuses");

const claimIndependent = {
  ...greenwash,
  ssses: Object.fromEntries(["Security","Stability","Scalability","Efficiency","Succinctness"].map((p) => [p, { status: "measured", score: 80, evidence: "log", method: "pytest" }])),
  asm_before: { mode: "role-perspective-simulation", author_label: "x", claim_independent_signoffs: true, comments: twelve() },
};
ok(!validateRound(claimIndependent, { requireReviews: true }).ok, "simulated cannot claim independent signoffs");

const motClaude = {
  ...greenwash,
  ssses: Object.fromEntries(["Security","Stability","Scalability","Efficiency","Succinctness"].map((p) => [p, { status: "blocked" }])),
  status: "complete",
  mot_synthesis: { signed_as_claude_mot: true, paragraphs: [words(111,"a"), words(111,"b"), words(111,"c")] },
};
ok(!validateRound(motClaude, { requireReviews: true }).ok, "Claude MoT signoff claim refuses");

const passWithoutExit = {
  ...incomplete,
  tests_run: [{ id: "t1", command: "x", status: "pass", exit_code: 1, stdout_sha256: "a".repeat(64) }],
};
ok(!validateRound(passWithoutExit).ok, "pass with nonzero exit refuses");

const badBatch = JSON.parse(fs.readFileSync(path.join(fix, "sample-batch.mint9-forbidden.json"), "utf8"));
ok(!validateBatchLedger(badBatch).ok, "mint-9-from-1 batch refuses");

// weekly-lookup style: blocked pillar must not be 100
const weekly = {
  ...incomplete,
  ssses: {
    Security: { status: "blocked" },
    Stability: { status: "unverified" },
    Scalability: { status: "n/a" },
    Efficiency: { status: "fail", score: 40, evidence: "no official fetch" },
    Succinctness: { status: "measured", score: 70, evidence: "loc", method: "count" },
  },
};
ok(validateRound(weekly).ok, "honest blocked/fail/unverified mix validates");

ok(countWords(twelve()[0].text) === 111, "fixture helper 111");

console.log(`validate-round: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
