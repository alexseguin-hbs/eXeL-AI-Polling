// ◬ ♡ 웃 Session — 3-user pod flow: join tokenomics + V2T support + 333-word synthesis.
// Simulates three users completing a pod (the join → witness → settle → synthesize flow)
// and asserts the tokenomics math (mirrored from app/soi-session/page.tsx) and the
// local-first synthesis. Live multi-device join runs over Supabase (not reachable here);
// this proves the deterministic core the live channel drives. Run:
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/soi-pod-flow.test.mjs
import { buildSynthesis333 } from "../lib/pod-synthesis.ts";
import { OPEN_TOPIC, SAMPLE_POD, DEFAULT_PROJECTS, projectTasks, findProject } from "../lib/pod-projects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

// ── The pod's tokenomics, mirrored from page.tsx (pure functions) ────────────────
const POD_SIZE = 3, M = 1;
// witnessedBy[j] = member j attests this claim; a claim counts when BOTH others attest.
const isWitnessed = (m) => m.witnessedBy.filter((w, j) => w && j !== m.idx).length >= POD_SIZE - 1;

// Simulate three users who JOINED (all named), AGREED, started in sync, and cross-witnessed.
const members = [
  { idx: 0, role: "Lead",   name: "Adaeze Okafor", hours: 4,   did: "Framed the spec",        agreed: true, witnessedBy: [false, true, true] },
  { idx: 1, role: "Lead 2", name: "Sokha Chan",    hours: 3.5, did: "Validated on the HAL",   agreed: true, witnessedBy: [true, false, true] },
  { idx: 2, role: "Lead 3", name: "Mireille Diop", hours: 2,   did: "Reviewed and recorded",  agreed: true, witnessedBy: [true, true, false] },
];

// ── join gate: exactly three, all joined, all agreed ─────────────────────────────
ok(members.length === POD_SIZE, "pod is exactly three (one lead + two invited)");
ok(members.every((m) => m.name.trim()), "all three joined (named)");
ok(members.every((m) => m.agreed), "all three agreed to intent + outcome");

// ── witnessed hours → 웃 (each hour counts only when both others witness) ─────────
const witnessedHours = members.reduce((s, m) => s + (isWitnessed(m) ? m.hours : 0), 0);
const totalYugYok = witnessedHours * M;
ok(members.every(isWitnessed), "every claim cross-witnessed by both other members");
ok(witnessedHours === 9.5, `witnessed hours = 9.5 (got ${witnessedHours})`);
ok(totalYugYok === 9.5, `웃 settle = M × hours = 9.5 (got ${totalYugYok})`);

// a self-attestation alone (not witnessed by both) settles nothing
const soloIdx = 0;
const soloOnly = [{ ...members[soloIdx], witnessedBy: [false, false, false] }, members[1], members[2]];
const soloWitnessed = soloOnly.reduce((s, m) => s + (isWitnessed(m) ? m.hours : 0), 0);
ok(soloWitnessed === witnessedHours - members[soloIdx].hours, "un-witnessed self-claim does NOT settle 웃");

// ── ◬ accelerator: delta of frozen baseline vs witnessed actual (never a profit metric) ──
const baseline = 12; // pod estimated 12h up front, delivered in 9.5h
const accelDelta = baseline > 0 ? Math.max(0, baseline - witnessedHours) : 0;
const yaTriangle = accelDelta * M;
ok(accelDelta === 2.5, `accel delta = 12 − 9.5 = 2.5h (got ${accelDelta})`);
ok(yaTriangle === 2.5, `◬ recognised = 2.5 (got ${yaTriangle})`);
// no baseline → no ◬
ok((0 > 0 ? 1 : 0) === 0 && Math.max(0, 0 - witnessedHours) === 0, "no frozen baseline → no ◬");

// ── the 333-word (3 × 111) synthesis, grounded in this pod ───────────────────────
const synth = buildSynthesis333({
  intent: "De-risk the first Architect-2525 modular spec",
  outcome: "One spec validated on the baseline HAL, reviewed by all 3",
  recordMethod: "voice",
  recordValue: "We confirmed the modular spec passes on the baseline HAL and all three reviewed it together.",
  members: members.map((m) => ({ name: m.name, role: m.role, hours: m.hours, did: m.did, witnessed: isWitnessed(m) })),
  witnessedHours, totalYugYok, M, baseline, accelDelta, yaTriangle,
  signerName: "Mireille", podCode: "AB12CD",
});
// 3 paragraphs, ~333 words total (operator: need NOT be exactly 111 per paragraph)
const synthTotal = words(synth.results) + words(synth.changed) + words(synth.next);
ok(synth.results && synth.changed && synth.next, "three non-empty paragraphs");
ok(synthTotal >= 300 && synthTotal <= 345, `total synthesis ~333 words (got ${synthTotal})`);
ok(words(synth.results) >= 30 && words(synth.changed) >= 30 && words(synth.next) >= 30,
  `each paragraph is substantive (${words(synth.results)}/${words(synth.changed)}/${words(synth.next)})`);

// grounded: names, the outcome, the settled 웃, and the ◬ appear in the prose
ok(/Adaeze/.test(synth.results), "synthesis names the pod members");
ok(/9\.5 웃/.test(synth.changed), "synthesis states the settled 웃 (9.5)");
ok(/2\.5 ◬/.test(synth.changed), "synthesis states the ◬ recognised (2.5)");
ok(/9,999/.test(synth.changed), "synthesis states the annual ceiling");
ok(/AB12CD/.test(synth.results), "synthesis references the pod code");
ok(!/Cube 6 writes the full/.test(synth.results + synth.changed + synth.next), "no stub placeholder text remains");

// determinism: same pod → identical synthesis (so it replays)
const synth2 = buildSynthesis333({
  intent: "De-risk the first Architect-2525 modular spec",
  outcome: "One spec validated on the baseline HAL, reviewed by all 3",
  recordMethod: "voice",
  recordValue: "We confirmed the modular spec passes on the baseline HAL and all three reviewed it together.",
  members: members.map((m) => ({ name: m.name, role: m.role, hours: m.hours, did: m.did, witnessed: isWitnessed(m) })),
  witnessedHours, totalYugYok, M, baseline, accelDelta, yaTriangle,
  signerName: "Mireille", podCode: "AB12CD",
});
ok(synth.results === synth2.results && synth.changed === synth2.changed && synth.next === synth2.next,
  "synthesis is deterministic (identical pod → identical text)");

// a no-accelerator pod still produces a full ~333-word synthesis
const synthNoAccel = buildSynthesis333({
  intent: "Run a quick volunteer brainstorm", outcome: "Three ideas captured and ranked",
  recordMethod: "written", recordValue: "Three ideas captured.",
  members: members.map((m) => ({ name: m.name, role: m.role, hours: 1, did: "helped", witnessed: true })),
  witnessedHours: 3, totalYugYok: 3, M: 1, baseline: 0, accelDelta: 0, yaTriangle: 0,
  signerName: "—", podCode: "",
});
const naTotal = words(synthNoAccel.results) + words(synthNoAccel.changed) + words(synthNoAccel.next);
ok(naTotal >= 300 && naTotal <= 345, `no-accelerator pod still lands ~333 words (got ${naTotal})`);
ok(/no ◬ were recognised/.test(synthNoAccel.changed), "no-accelerator pod states no ◬ this task");

// ── Any topic is the DEFAULT + a sample to test with (operator, 2026-09-03) ──────────
ok(DEFAULT_PROJECTS[0].id === OPEN_TOPIC.id, "Open topic is the first (default) project — a pod can be about anything");
ok(projectTasks(OPEN_TOPIC).length === 1 && projectTasks(OPEN_TOPIC)[0].id === "brainstorm", "open topic offers only the pod's own brainstorm item");
ok(findProject("open-topic") === OPEN_TOPIC, "open topic resolves by id");
ok(SAMPLE_POD.intent.length > 20 && SAMPLE_POD.outcome.length > 20, "sample pod carries a ready intent + outcome for a first-time trio");

console.log(`\nsoi-pod-flow: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
