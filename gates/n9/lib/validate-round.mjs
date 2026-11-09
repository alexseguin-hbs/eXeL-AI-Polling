/**
 * ROUND.json validator for N1–N9 SSSES+SPIRAL gate.
 * Does NOT invent reviews or scores. Refuses green-washed unknowns.
 */
import { createHash } from "node:crypto";
import { validateAsm111Comments, validateMot333, ASM_MASTERS } from "./wordcount.mjs";

export const PILLARS = ["Security", "Stability", "Scalability", "Efficiency", "Succinctness"];
export const PILLAR_STATUS = new Set(["measured", "blocked", "unverified", "n/a", "fail"]);
export const TEST_STATUS = new Set(["pass", "fail", "blocked", "unverified", "not_available"]);
export const ROUND_STATUS = new Set(["open", "in_progress", "blocked", "complete", "incomplete"]);

export function sha256Text(s) {
  return createHash("sha256").update(String(s), "utf8").digest("hex");
}

function need(cond, msg, issues) {
  if (!cond) issues.push(msg);
}

/**
 * Validate a round ledger. Options:
 *  - requireReviews: if true, asm_before/after + mot must be present and exact
 *  - allowIncompleteReviews: sample fixtures may omit bodies but must not claim complete
 */
export function validateRound(round, { requireReviews = false } = {}) {
  const issues = [];
  need(round && typeof round === "object", "round must be an object", issues);
  if (!round || typeof round !== "object") return { ok: false, issues };

  need(Number.isInteger(round.round) && round.round >= 1 && round.round <= 9, "round must be 1..9", issues);
  need(typeof round.hypothesis === "string" && round.hypothesis.trim().length > 10, "hypothesis required", issues);
  need(ROUND_STATUS.has(round.status), `status must be one of ${[...ROUND_STATUS].join(",")}`, issues);
  need(typeof round.source_sha === "string" && /^[0-9a-f]{7,40}$/i.test(round.source_sha), "source_sha required", issues);

  // SSSES pillars — never invent 0–100 scores without measurement
  const ssses = round.ssses || {};
  for (const p of PILLARS) {
    const cell = ssses[p];
    need(cell && typeof cell === "object", `ssses.${p} required object`, issues);
    if (!cell) continue;
    need(PILLAR_STATUS.has(cell.status), `ssses.${p}.status invalid (${cell.status})`, issues);
    if (cell.status === "measured") {
      need(typeof cell.score === "number" && cell.score >= 0 && cell.score <= 100, `ssses.${p}.score 0–100 when measured`, issues);
      need(typeof cell.evidence === "string" && cell.evidence.length > 0, `ssses.${p}.evidence required when measured`, issues);
      need(cell.method, `ssses.${p}.method required when measured`, issues);
    } else {
      // blocked/unverified/n/a/fail must NOT carry a fake 100
      if (cell.score === 100) issues.push(`ssses.${p}: score 100 forbidden when status=${cell.status}`);
      if (cell.status === "fail" && typeof cell.score === "number" && cell.score === 100) {
        issues.push(`ssses.${p}: fail cannot be 100`);
      }
    }
  }

  // Spiral direction stubs
  need(round.spiral && Array.isArray(round.spiral.forward) && Array.isArray(round.spiral.backward), "spiral.forward/backward arrays required", issues);

  // tests_run — evidence-bearing
  need(Array.isArray(round.tests_run), "tests_run array required", issues);
  const ids = new Set();
  for (const t of round.tests_run || []) {
    need(t.id && t.command, `test entry needs id+command`, issues);
    need(TEST_STATUS.has(t.status), `test ${t.id}: invalid status`, issues);
    need(typeof t.stdout_sha256 === "string" || t.status === "not_available" || t.status === "blocked", `test ${t.id}: stdout_sha256 required unless blocked/not_available`, issues);
    if (ids.has(t.id)) issues.push(`duplicate test id ${t.id}`);
    ids.add(t.id);
    // cannot claim pass without exit_code 0
    if (t.status === "pass" && t.exit_code !== 0) issues.push(`test ${t.id}: pass requires exit_code 0`);
  }

  // Anti-inflation: one suite invocation cannot close the round as complete with empty changes when claiming 9 rounds elsewhere
  if (round.status === "complete") {
    need((round.tests_run || []).length > 0, "complete round requires tests_run", issues);
    need(round.asm_before && round.asm_after && round.mot_synthesis, "complete round requires before/after AsM + MoT", issues);
  }

  // Reviews
  const reviewNeeded = requireReviews || round.status === "complete";
  if (reviewNeeded) {
    for (const phase of ["asm_before", "asm_after"]) {
      const block = round[phase];
      need(block, `${phase} required`, issues);
      if (!block) continue;
      need(block.mode === "role-perspective-simulation" || block.mode === "genuine-multi-author", `${phase}.mode required`, issues);
      if (block.mode === "role-perspective-simulation") {
        need(typeof block.author_label === "string" && block.author_label.length > 0, `${phase}: simulation must label single author`, issues);
        need(block.claim_independent_signoffs !== true, `${phase}: must not claim independent signoffs when simulated`, issues);
      }
      const v = validateAsm111Comments(block.comments, { requireAllTwelve: true });
      if (!v.ok) issues.push(...v.issues.map((i) => `${phase}: ${i}`));
    }
    const mot = round.mot_synthesis;
    need(mot, "mot_synthesis required", issues);
    if (mot) {
      need(mot.signed_as_claude_mot === false || mot.signed_as_claude_mot == null, "signed_as_claude_mot must be false (H.I. is the user)", issues);
      need(mot.claim_hi_authority !== true, "must not claim H.I. authority for simulated MoT", issues);
      const mv = validateMot333(mot.paragraphs);
      if (!mv.ok) issues.push(...mv.issues.map((i) => `mot_synthesis: ${i}`));
      // optional tallies — if present, must list 12 masters but are NOT proof of independent agents
      if (mot.tally) {
        need(mot.tally.simulated === true || mot.mode === "genuine-multi-author", "tally must mark simulated:true unless genuine-multi-author", issues);
      }
    }
  } else if (round.asm_before || round.asm_after || round.mot_synthesis) {
    // if partially present, still validate lengths
    for (const phase of ["asm_before", "asm_after"]) {
      if (!round[phase]?.comments) continue;
      const v = validateAsm111Comments(round[phase].comments, { requireAllTwelve: false });
      if (!v.ok) issues.push(...v.issues.map((i) => `${phase}: ${i}`));
    }
    if (round.mot_synthesis?.paragraphs) {
      const mv = validateMot333(round.mot_synthesis.paragraphs);
      if (!mv.ok) issues.push(...mv.issues.map((i) => `mot_synthesis: ${i}`));
    }
  }

  // Separated counters
  need(round.evidence_separators?.test_count_is_not_pillar_score === true, "must affirm test_count_is_not_pillar_score", issues);

  return { ok: issues.length === 0, issues };
}

/** Refuse a batch ledger that marks N1–N9 complete from a single suite run fingerprint. */
export function validateBatchLedger(batch) {
  const issues = [];
  need(batch && Array.isArray(batch.rounds), "batch.rounds required", issues);
  if (!batch?.rounds) return { ok: false, issues };
  const fps = new Map();
  for (const r of batch.rounds) {
    const v = validateRound(r, { requireReviews: r.status === "complete" });
    if (!v.ok) issues.push(`N${r.round}: ${v.issues.join("; ")}`);
    const fp = r.suite_run_fingerprint;
    if (fp) {
      if (!fps.has(fp)) fps.set(fp, []);
      fps.get(fp).push(r.round);
    }
  }
  for (const [fp, rounds] of fps) {
    const completes = batch.rounds.filter((r) => rounds.includes(r.round) && r.status === "complete");
    if (completes.length > 1) {
      issues.push(`suite_run_fingerprint ${fp.slice(0, 12)}… used to mark complete rounds ${completes.map((c) => c.round).join(",") } — refuse (no 9-from-1)`);
    }
  }
  // Explicit anti-pattern field
  if (batch.minted_nine_from_one_run === true) {
    issues.push("minted_nine_from_one_run=true is forbidden");
  }
  return { ok: issues.length === 0, issues };
}

export { ASM_MASTERS };
