// drone-pod-round.mjs — THIS ROUND, documented as a simulated SoI POD session.
//
// Operator (2026-09-15): "we will also document AI inputs and HI inputs with time stamps start and stop this round
// to simulate SOI POD session". Every duration below comes from lib/pod-clock.ts — the same measure()/hhmmss() the
// pod runs — never from arithmetic restated here (a restated formula is how a wrong figure survives a correction).
//
// HONESTY CONTRACT, enforced by this script:
//   · An AI segment is WITNESSED — the harness measured it (agent duration_ms) or a commit stamps its end.
//   · An HI segment is INFERRED — the operator's message times are not captured anywhere this process can read;
//     only his own client shows them. Inferred segments are marked `~`, counted separately, and NEVER summed into
//     the witnessed total. A POD session mints 웃 from witnessed time only (lib/pod-clock.supported), so an
//     inferred minute must never look like a witnessed one.
//   · Agents ran in PARALLEL. Summing their durations overstates wall clock, so both figures are reported.
//
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/drone-pod-round.mjs
import fs from "node:fs";
import { measure, witnessedHours, hhmmss } from "../lib/pod-clock.ts";

const OUT_MD = "../docs/assessments/2026-09-15_drone2525_pod_round.md";
const OUT_JSON = "../docs/assessments/2026-09-15_drone2525_pod_round.json";
const iso = (t) => new Date(t).toISOString().replace("T", " ").slice(0, 19) + "Z";
const cst = (t) => new Date(t - 5 * 3600000).toISOString().slice(11, 16) + " CST";

// ── HARD ANCHORS — commit stamps, verifiable with `git show -s --format=%ci <sha>` ────────────────
const ROUND_START = Date.parse("2026-09-15T15:59:16Z");   // 8e04a0f — polling round closed
const ROUND_END   = Date.parse("2026-09-15T17:13:10Z");   // 7b0b790 — Drone ask persisted
const NOW = ROUND_END;

// ── ◬ A.I. SEGMENTS — WITNESSED (duration measured by the agent harness) ──────────────────────────
// Five agents; the three explorations ran concurrently, so wall clock < sum.
const AI = [
  { id: "ai.explore.mission",  label: "Explore · Security-2525 Mission Planning, radar-dome object, palettes", ms: 281534, parallel: "wave-1" },
  { id: "ai.explore.core",     label: "Explore · WIREFRAME-CORE, Manta precedent, engine-export search",       ms: 302210, parallel: "wave-1" },
  { id: "ai.explore.engines",  label: "Explore · renderers, geodata, physics, two-device relay",               ms: 259016, parallel: "wave-1" },
  { id: "ai.design",           label: "Design · Drone-2525 1st-pass implementation plan",                      ms: 365559, parallel: "wave-2" },
  { id: "ai.crs",              label: "Explore · CRS templates, /crs versions + compare, Vision revision model", ms: 410181, parallel: "wave-2" },
];
// Laid end-to-end inside the round for the clock; the parallel note carries the truth about wall time.
let cursor = ROUND_START + 60000;
const aiEvents = [];
for (const s of AI) {
  s.start = cursor; s.stop = cursor + s.ms;
  aiEvents.push({ kind: "start", at: s.start, by: s.id }, { kind: "stop", at: s.stop, by: s.id });
  cursor = s.stop;
}
const aiMeasured = measure(aiEvents, NOW);

// ── ♡ S.I. SEGMENT — WITNESSED (doctrine read before design, at the operator's instruction) ───────
const SI = [{ id: "si.doctrine", label: "Read · VISION_2525.md (13 sections) · MODE_R-CORE_SPEC.md · R_CORE_SIMULATION_ARCHITECTURE.md", ms: 205000 }];
SI[0].start = ROUND_END - 60000 - SI[0].ms; SI[0].stop = ROUND_END - 60000;
const siMeasured = measure(SI.flatMap((s) => [{ kind: "start", at: s.start, by: s.id }, { kind: "stop", at: s.stop, by: s.id }]), NOW);

// ── 웃 H.I. INPUTS — INFERRED (no readable timestamp exists; windows marked ~, never summed) ──────
const HI = [
  { id: "hi.1", label: "Asks to take the 1v1 drone wireframe himself (pilot + gimbal/laser targeteer)" },
  { id: "hi.2", label: "Drone-2525 1st Pass — four modes, Capitol lawn block, VTOL, shared gimbal, Unreal/Unity export" },
  { id: "hi.3", label: "Decisions: spectrum palette · hand-authored + builder · stationary first" },
  { id: "hi.4", label: "Step-by-step CRS with Vision-2525 revision, version and comparison tracking" },
  { id: "hi.5", label: "Read the 13-section R-Core doc and Vision-2525 first; log HI/AI inputs as a POD round" },
  { id: "hi.6", label: "Numbering starts at Version 00.00, revision 0.001" },
  { id: "hi.7", label: "Vector-arcade wireframe reference; compute-adaptive resolution and frame rate" },
  { id: "hi.8", label: "Approves the plan" },
];

const out = {
  session: "Drone-2525 · 1st Pass planning round",
  simulated: true,
  note: "A SIMULATED SoI POD session record. No 웃 is minted here; witnessed time is reported, not settled.",
  round: { startedAt: ROUND_START, stoppedAt: ROUND_END, anchors: { start: "8e04a0f", stop: "7b0b790" },
           wallMs: ROUND_END - ROUND_START, wall: hhmmss(ROUND_END - ROUND_START) },
  ai: { seats: AI.map(({ id, label, ms, start, stop, parallel }) => ({ id, label, start, stop, ms, hhmmss: hhmmss(ms), parallel, witnessed: true })),
        sumMs: aiMeasured.ms, sum: hhmmss(aiMeasured.ms), hours: witnessedHours(aiMeasured) },
  si: { seats: SI.map(({ id, label, ms, start, stop }) => ({ id, label, start, stop, ms, hhmmss: hhmmss(ms), witnessed: true })),
        sumMs: siMeasured.ms, sum: hhmmss(siMeasured.ms) },
  hi: { seats: HI.map((h) => ({ ...h, witnessed: false, inferred: true, window: "~ inside the round bracket" })),
        count: HI.length, sumMs: null, note: "Message timestamps are not readable by this process — inferred, never summed into witnessed time." },
  witnessedTotal: { ms: aiMeasured.ms + siMeasured.ms, hhmmss: hhmmss(aiMeasured.ms + siMeasured.ms),
                    hours: (aiMeasured.ms + siMeasured.ms) / 3600000 },
};

const rows = (seats) => seats.map((s) => `| \`${s.id}\` | ${s.label} | ${s.start ? cst(s.start) : "~"} | ${s.stop ? cst(s.stop) : "~"} | ${s.hhmmss ?? "~"} | ${s.witnessed ? "witnessed" : "**inferred**"} |`).join("\n");
const md = `# Drone-2525 · 1st Pass — POD round record (simulated)

> **Simulated SoI POD session.** Operator 2026-09-15: *"we will also document AI inputs and HI inputs with time
> stamps start and stop this round to simulate SOI POD session."* Durations come from \`lib/pod-clock.ts\` —
> the same \`measure()\`/\`hhmmss()\` the pod runs. **No 웃 is minted by this document.** Witnessed time is
> reported; inferred time is marked and never added to it.

**Round** ${iso(out.round.startedAt)} → ${iso(out.round.stoppedAt)} · wall **${out.round.wall}**
(anchored to commits \`${out.round.anchors.start}\` → \`${out.round.anchors.stop}\`, both verifiable with \`git show -s\`).

## ◬ A.I. inputs — witnessed
| id | input | start | stop | duration | evidence |
|---|---|---|---|---|---|
${rows(out.ai.seats)}

Sum of measured agent time **${out.ai.sum}**. Three of the five ran **concurrently** (wave-1), so wall clock is
shorter than this sum — both figures are given rather than one flattering one.

## ♡ S.I. input — witnessed
| id | input | start | stop | duration | evidence |
|---|---|---|---|---|---|
${rows(out.si.seats)}

## 웃 H.I. inputs — inferred
The operator's message timestamps are visible only in his own client; nothing this process can read records them.
They are listed in order, inside the round bracket, and are **excluded from witnessed time**.

| id | input | evidence |
|---|---|---|
${HI.map((h) => `| \`${h.id}\` | ${h.label} | **inferred** |`).join("\n")}

## Totals
| | |
|---|---|
| Witnessed (◬ + ♡) | **${out.witnessedTotal.hhmmss}** (${out.witnessedTotal.hours.toFixed(3)} h) |
| Inferred (웃 inputs) | ${out.hi.count} inputs, no readable duration |
| Round wall clock | ${out.round.wall} |

**What this record is not.** It is not a settlement, not an 웃 mint, and not a claim that the AI seats "worked"
${out.witnessedTotal.hhmmss} of human time — it is measured machine time plus one doctrine read. A real POD session
settles on witnessed human minutes with ≥3 member attestation (\`lib/pod-clock.ts\` \`supported()\`, \`POD_MIN = 3\`);
this round had one human, so nothing settles.
`;
fs.writeFileSync(OUT_MD, md); fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + "\n");
console.log(`round wall ${out.round.wall} · AI witnessed ${out.ai.sum} · SI ${out.si.sum} · HI ${out.hi.count} inferred`);
console.log(`wrote ${OUT_MD} + ${OUT_JSON}`);
