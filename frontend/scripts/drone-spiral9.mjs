#!/usr/bin/env node
/**
 * SPIRAL TEST ×9 — run the whole thing nine times and prove it says the same thing every time.
 *
 * Operator 2026-09-15: "Optimize, SSSES, and SPIRAL TEST 9x before posting for me to check."
 *
 * WHY NINE RUNS AND NOT ONE. A gate that passes once has told you it passed once. Determinism is the claim
 * this domain actually rests on — the same seed plays the same round, the same inputs draw the same world,
 * the same crew code is reissued on a replay — and a claim like that is only worth anything if it survives
 * being asked repeatedly. Nine runs is the repository's own N=9 convention.
 *
 * Three things are checked, and any one of them failing fails the whole thing:
 *   1. THE GATES  — every drone gate, nine times, must pass every time with the same count.
 *   2. THE ARTEFACTS — the model hash, the pop-up schedule, a flown path, a crew code and the ladder must
 *      be byte-identical across all nine runs. A number that drifts is a number nobody can argue about.
 *   3. THE SPIRAL — forward from a changed cube to everything downstream, and backward again, with a real
 *      assertion at each end rather than a claim.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const N = Number(process.env.SPIRAL_N || 9);
const DEST = process.env.SPIRAL_OUT || join(ROOT, "..", "perf");

const GATES = [
  "test:mot-ladder", "test:self-cal", "test:drone-arena", "test:drone-hal", "test:vector-law",
  "test:drone-crs", "test:drone-i18n", "test:drone-gimbal", "test:drone-flight", "test:si-pod",
  "test:drone-link", "test:wire-core", "test:wire-export",
  "test:drone-swarm", "test:drone-authority", "test:arena-frame", "test:seat-view",
  "test:airframe-truth", "test:foil-model", "test:drone-naming", "test:drone-route", "test:drone-laser", "test:drone-contest", "test:drone-winners", "test:drone-scale", "test:controls-schema", "test:drone-slots", "test:drone-decisions", "test:stick-sets", "test:drone-controls", "test:drone-tap", "test:asm-cup", "test:drone-challenge", "test:drone-progression", "test:drone-intro", "test:drone-glass", "test:drone-playable", "test:lobby-2525", "test:sequencer-2525", "test:range-2525", "test:drone-revisions", "test:deck-consistency", "test:drone-platforms", "test:glyph-check", "test:drone-size", "test:drone-ledger",
];

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/**
 * A GATE THAT PRINTS NO COUNT STILL PASSES. Most gates end with "N passed, M failed"; the `--check` gates
 * (glyph, foil model, render) print a single line and signal with their exit code. The first edition read
 * the missing count as `failed = null` and every consumer compared it with `!== 0`, so a `--check` gate
 * that exited 0 was reported as a failure — which dragged Stability from 100 to 70 and printed FAIL over a
 * green run. Exactly the class of defect the scorer rewrite was for: a number that did not come from
 * evidence. `failed` is now 0 when the gate exited cleanly and said nothing, and `counted` records whether
 * there was a tally to read at all.
 */
function runGate(name) {
  const t0 = Date.now();
  try {
    const out = execFileSync("npm", ["run", "--silent", name], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const m = /(\d+) passed, (\d+) failed/.exec(out);
    return { name, ok: true, counted: Boolean(m), passed: m ? +m[1] : 0, failed: m ? +m[2] : 0, ms: Date.now() - t0 };
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
    const m = /(\d+) passed, (\d+) failed/.exec(out);
    // A gate that exited non-zero has failed whether or not it managed to print a tally.
    return { name, ok: false, counted: Boolean(m), passed: m ? +m[1] : 0, failed: m ? +m[2] : 1, ms: Date.now() - t0 };
  }
}

/** Everything this domain claims is reproducible, computed fresh, so nine runs can be compared byte for byte. */
async function artefacts() {
  const { buildArena } = await import("../lib/drone-2525/arena-model.ts");
  const { canonicalHash, selectLod } = await import("../lib/wire-core/wire-model.ts");
  const { DRONE_DOMAIN } = await import("../lib/drone-2525/domain.gen.ts");
  const { motSpec, MOT_LEVELS } = await import("../lib/wire-core/mot-ladder.ts");
  const { buildSchedule, emptyTags, targetsAt } = await import("../lib/drone-2525/targets.ts");
  const { initFlight, stepFlight } = await import("../lib/drone-2525/flight.ts");
  const { inviteCode } = await import("../lib/drone-2525/si-pod.ts");
  const { autoPilot } = await import("../lib/drone-2525/ai-crew.ts");
  const { planSelfCal, judgeRung } = await import("../lib/wire-core/calibrate.ts");
  const { HAL_PROFILES } = await import("../lib/wire-core/hal.ts");

  const a = buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: "spiral" });
  const ladder = MOT_LEVELS.map((l) => {
    const s = motSpec(l);
    return `${l}:${s.segments}:${s.demandFps}:${s.ngonSides}:${s.dpr}:${s.cnnMs}:${s.sensors.join("|")}`;
  }).join(",");
  const lodPerRung = MOT_LEVELS.map((l) => {
    const s = motSpec(l);
    const m = buildArena(DRONE_DOMAIN, { ngonSides: s.ngonSides, contourStepM: 2, stamp: "spiral" });
    return `${l}:${selectLod(m.model, s.maxLod, s.segments).kept}`;
  }).join(",");
  const sched = buildSchedule(a.doors, { seed: 20260915, upMs: 14000, downMs: 6000, concurrent: 3 });
  const upAt0 = targetsAt(a.doors, sched, emptyTags(), 0).filter((v) => v.phase === "up").map((v) => v.door.id).join("|");
  let f = initFlight();
  for (let i = 0; i < 300; i++) f = stepFlight(DRONE_DOMAIN.airframe, DRONE_DOMAIN.battery, f, { climb: 0.4, forward: 1, lateral: 0.1, yaw: 0.2 }, 0.05);
  const plan = planSelfCal(6);
  const judged = MOT_LEVELS.map((l) => `${l}:${judgeRung(l, HAL_PROFILES.pi, 45).pass ? 1 : 0}`).join(",");

  return {
    modelHash: canonicalHash(a.model),
    doors: a.doors.length,
    segments: a.model.edges.length,
    ladder: sha(ladder),
    lodPerRung: sha(lodPerRung),
    schedule: sha(JSON.stringify(sched)),
    upAtStart: upAt0,
    flownPath: sha(JSON.stringify(f)),
    aiPilotPath: sha(JSON.stringify(Array.from({ length: 24 }, (_, i) => autoPilot(i * 4)))),
    crewCode: inviteCode("spiral-seed"),
    selfCalPlan: `${plan.rungs.length}x${plan.dwellS}s`,
    rungVerdicts: sha(judged),
  };
}

/**
 * THE SPIRAL. A change does not stop where it was made. Forward: a change to the ladder must reach the
 * arena, the exporter and the HUD. Backward: a change to the arena must reach the ladder's budgets, the
 * gimbal's reach and the self-test's verdicts. Each direction is ASSERTED, not asserted-about.
 */
async function spiral() {
  const { buildArena } = await import("../lib/drone-2525/arena-model.ts");
  const { selectLod, canonicalHash } = await import("../lib/wire-core/wire-model.ts");
  const { DRONE_DOMAIN } = await import("../lib/drone-2525/domain.gen.ts");
  const { motSpec } = await import("../lib/wire-core/mot-ladder.ts");
  const { judgeRung } = await import("../lib/wire-core/calibrate.ts");
  const { HAL_PROFILES } = await import("../lib/wire-core/hal.ts");
  const { turretMount, eyeOf, aimAt } = await import("../lib/drone-2525/gimbal.ts");
  const checks = [];
  const add = (dir, what, ok, detail) => checks.push({ dir, what, ok, detail });

  const lo = motSpec("1.1"), hi = motSpec("5.5");
  const aLo = buildArena(DRONE_DOMAIN, { ngonSides: lo.ngonSides, contourStepM: 2, stamp: "s" });
  const aHi = buildArena(DRONE_DOMAIN, { ngonSides: hi.ngonSides, contourStepM: 2, stamp: "s" });
  const kLo = selectLod(aLo.model, lo.maxLod, lo.segments), kHi = selectLod(aHi.model, hi.maxLod, hi.segments);

  add("forward", "the ladder reaches the arena", kHi.kept > kLo.kept, `1.1 draws ${kLo.kept}, 5.5 draws ${kHi.kept}`);
  add("forward", "the ladder reaches the model", canonicalHash(aLo.model) !== canonicalHash(aHi.model), "a different curve budget is a different world");
  add("forward", "the ladder reaches the sensors", hi.sensors.length > lo.sensors.length, `${lo.sensors.length} module at 1.1, ${hi.sensors.length} at 5.5`);
  add("forward", "the ladder reaches the self-test", judgeRung("1.1", HAL_PROFILES.pi, 45).pass && !judgeRung("5.5", HAL_PROFILES.accel, 45).pass,
      "a Pi holds the arcade rung; an accelerator cannot fit the full stack");
  add("forward", "the ladder reaches what is dropped", kLo.dropped > 0 && kLo.byGroup.some((g) => !g.kept), `${kLo.dropped} segments given up at 1.1, and named`);

  const doors = aHi.doors;
  const mount = turretMount(DRONE_DOMAIN.turrets[0]);
  const eye = eyeOf(mount, aHi.ground);
  add("backward", "the arena reaches the gimbal", doors.every((d) => Number.isFinite(aimAt(eye, d.at).rangeM)), `${doors.length} doors, all reachable as a bearing and a range`);
  add("backward", "the arena reaches the ground", eye[2] > 160, `the turret stands at ${eye[2].toFixed(1)} m, not at sea level`);
  add("backward", "the arena reaches the budget", kHi.kept <= hi.segments, `${kHi.kept} within the ${hi.segments} the rung allows`);
  add("backward", "the arena reaches every rung", doors.length === aLo.doors.length, "the same fourteen doors exist at 1.1 as at 5.5");
  add("backward", "the world is the same at both ends", aLo.doors.map((d) => d.id).join() === aHi.doors.map((d) => d.id).join(), "the rung paints, it does not decide what exists");

  return checks;
}

// ═══ SSSES, MEASURED ════════════════════════════════════════════════════════════════════════════════
//
// The previous version of this function scored three of five pillars from things that were not
// measurements: Succinctness was the literal `85`, Efficiency reused Scalability's boolean, and Scalability
// was the PRESENCE of a file rather than the size of the gain. Two of the sentences it printed were also
// false — it claimed a duplicate code generator had been deleted while one sat in crew-seat-panel.tsx, and
// claimed a sight line was no longer re-marched per frame when in the flying modes it was.
//
// A score that cannot fall is not a score. Every pillar below reads evidence produced in this run, and the
// numbers are free to be disappointing.


/** Count the checks belonging to the gates that actually test a pillar, rather than all thirteen. */
const checksOf = (runs, names) =>
  runs.filter((g) => names.includes(g.name)).reduce((n, g) => n + (g.passed ?? 0), 0);
const allOk = (runs, names) => runs.filter((g) => names.includes(g.name)).every((g) => g.ok && g.failed === 0);

/** Walk the domain's own source, so Succinctness is a reading and not an opinion. */
function readSource() {
  const roots = ["lib/drone-2525", "lib/wire-core", "components/drone-2525"].map((r) => path.join(ROOT, r));
  const files = [];
  for (const r of roots) {
    for (const f of readdirSync(r)) {
      if (!/\.(ts|tsx)$/.test(f) || f.endsWith(".gen.ts")) continue;
      const p = path.join(r, f);
      if (statSync(p).isFile()) files.push({ p, rel: path.relative(ROOT, p), text: fs.readFileSync(p, "utf8") });
    }
  }
  return files;
}

/**
 * Three things that can be counted and that all mean the same thing: is this surface getting harder to
 * change? Duplicated helpers, exports nothing imports, and functions past the repository's own 300-line rule.
 */
function succinctness(files) {
  const all = files.map((f) => f.text).join("\n");
  const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  // Duplicate helper DEFINITIONS: the same local helper defined in more than one component.
  const dupes = [];
  for (const name of ["const mono =", "const hud =", "const btn =", "const hudFont =", "const codeFrom ="]) {
    const n = files.filter((f) => code(f.text).includes(name)).length;
    if (n > 1) dupes.push(`${name.replace("const ", "").replace(" =", "")}×${n}`);
  }

  // Exports nothing outside their own file imports. Types are excluded: a type nobody imports costs nothing
  // at runtime and is often the honest shape of a returned value.
  const dead = [];
  for (const f of files) {
    for (const m of code(f.text).matchAll(/^export (?:const|function) ([A-Za-z_][A-Za-z0-9_]*)/gm)) {
      const name = m[1];
      const used = files.some((o) => o !== f && new RegExp(`\\b${name}\\b`).test(o.text))
        || all.includes(`from "@/lib/${path.basename(f.rel, path.extname(f.rel))}"`) === false && false;
      const inTests = fs.existsSync(path.join(ROOT, "tests")) &&
        readdirSync(path.join(ROOT, "tests")).some((t) => t.endsWith(".mjs") &&
          new RegExp(`\\b${name}\\b`).test(fs.readFileSync(path.join(ROOT, "tests", t), "utf8")));
      const inScripts = readdirSync(path.join(ROOT, "scripts")).some((t) => t.endsWith(".mjs") &&
        new RegExp(`\\b${name}\\b`).test(fs.readFileSync(path.join(ROOT, "scripts", t), "utf8")));
      if (!used && !inTests && !inScripts) dead.push(`${path.basename(f.rel)}:${name}`);
    }
  }

  // The longest function, against CLAUDE.md's 300-line rule.
  let longest = { name: "", lines: 0, file: "" };
  for (const f of files) {
    const lines = f.text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = /^export (?:default )?function ([A-Za-z_][A-Za-z0-9_]*)/.exec(lines[i]);
      if (!m) continue;
      let depth = 0, end = i;
      for (let j = i; j < lines.length; j++) {
        depth += (lines[j].match(/\{/g) ?? []).length - (lines[j].match(/\}/g) ?? []).length;
        if (j > i && depth <= 0) { end = j; break; }
      }
      if (end - i > longest.lines) longest = { name: m[1], lines: end - i, file: path.basename(f.rel) };
    }
  }

  // 100, less what each kind of drift costs. Duplicated helpers are the most expensive because they are the
  // ones that make a fix have to be applied four times and get applied three.
  const score = Math.max(0, Math.min(100,
    100 - dupes.length * 8 - Math.min(20, dead.length * 2) - (longest.lines > 300 ? Math.min(25, Math.round((longest.lines - 300) / 12)) : 0)));
  const why = `${dupes.length ? `${dupes.length} helper(s) defined in more than one file (${dupes.join(", ")}); ` : "no helper is defined twice; "}` +
    `${dead.length} export(s) nothing imports; longest function ${longest.name} at ${longest.lines} lines against the 300 rule.`;
  return { score, why, dupes, dead: dead.length, longest };
}

function ssses(gateRuns, drift, spiralChecks, perf) {
  const runs = gateRuns[0];
  const allGreen = gateRuns.every((r) => r.every((g) => g.ok && g.failed === 0));
  const stable = drift.length === 0;
  const spiralOk = spiralChecks.every((c) => c.ok);

  // SECURITY — from the gates that actually test authority, not from all thirteen.
  const secGates = ["test:drone-flight", "test:drone-link", "test:si-pod", "test:drone-authority"];
  const secChecks = checksOf(runs, secGates);
  const secGreen = allOk(runs, secGates);
  const security = {
    score: secGreen ? Math.min(100, 60 + Math.round(secChecks / 10)) : 0,
    why: secGreen
      ? `${secChecks} checks on authority alone: a machine shot needs a named human at all five levels, a seat may only send what it controls, and a key group cannot out-vote a person.`
      : "an authority gate is failing.",
  };

  // STABILITY — nine runs, byte-identical artefacts. This pillar was always honest; it is unchanged.
  const stability = {
    score: stable && allGreen ? 100 : stable ? 70 : 40,
    why: stable ? `nine runs agree byte for byte on all ${Object.keys(ARTEFACT_KEYS).length || ""} reproducible artefacts.` : `artefacts drifted: ${drift.join(", ")}.`,
  };

  // SCALABILITY — the measured frame rate against the 30 Hz reference, WITH the engagement in the air.
  const scal = perf
    ? { score: Math.max(0, Math.min(100, Math.round((perf.after / 30) * 100))), why: `${perf.after} fps at the heaviest case on a processor slowed ${perf.throttle} times, against the 30 Hz reference the operator set — ${perf.aircraft ?? 42} aircraft in the air.` }
    : { score: 0, why: "no measurement in this run: scripts/drone-perf.mjs was not run." };

  // EFFICIENCY — measured, from the counters the perf harness emits.
  const eff = perf
    ? {
        score: Math.max(0, Math.min(100,
          Math.round(Math.min(1, perf.after / 30) * 55) + (perf.memoHit === true ? 25 : 0) + (perf.domNodes != null && perf.domNodes < 260 ? 20 : 0))),
        why: `${perf.memoHit === true ? "the projection memo holds between frames" : perf.memoHit === false ? "THE PROJECTION MEMO IS NOT HOLDING" : "the memo was not measured in this run"}; ${perf.domNodes} nodes for the whole engagement; heap ${perf.heapMB} MB.`,
      }
    : { score: 0, why: "no measurement in this run." };

  // SUCCINCTNESS — counted from the source, in this run.
  const suc = succinctness(readSource());

  const pillars = { Security: security, Stability: stability, Scalability: scal, Efficiency: eff, Succinctness: suc };
  const avg = Math.round(Object.values(pillars).reduce((n, p) => n + p.score, 0) / 5);
  return { pillars, avg, totalChecks: runs.reduce((n, g) => n + (g.passed ?? 0), 0), allGreen, spiralOk };
}

/** Named so Stability can say how many artefacts it compared without hardcoding the number. */
let ARTEFACT_KEYS = {};

(async () => {
  mkdirSync(DEST, { recursive: true });
  console.log(`SPIRAL TEST ×${N} — every drone gate, ${N} times, plus the artefacts that must not drift\n`);

  const gateRuns = [];
  const arts = [];
  for (let i = 1; i <= N; i++) {
    const t0 = Date.now();
    const runs = GATES.map(runGate);
    arts.push(await artefacts());
    const bad = runs.filter((r) => !r.ok || r.failed !== 0);
    const checks = runs.reduce((n, r) => n + (r.passed ?? 0), 0);
    console.log(`  run ${String(i).padStart(2)} · ${String(checks).padStart(4)} checks · ${bad.length ? `${bad.length} FAILED: ${bad.map((b) => b.name).join(", ")}` : "all green"} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    gateRuns.push(runs);
  }

  // Did anything reproducible change between runs? Name it if so.
  ARTEFACT_KEYS = arts[0];
  const drift = Object.keys(arts[0]).filter((k) => arts.some((a) => JSON.stringify(a[k]) !== JSON.stringify(arts[0][k])));
  console.log(`\n  artefacts across ${N} runs: ${drift.length ? `DRIFTED — ${drift.join(", ")}` : "identical, every one"}`);
  for (const [k, v] of Object.entries(arts[0])) console.log(`    ${k.padEnd(14)} ${v}`);

  const sp = await spiral();
  console.log(`\n  spiral propagation:`);
  for (const c of sp) console.log(`    ${c.ok ? "✓" : "✗"} ${c.dir.padEnd(8)} ${c.what.padEnd(36)} ${c.detail}`);

  let perf = null;
  try {
    const before = JSON.parse(await import("node:fs").then((m) => m.readFileSync(join(DEST, "before.json"), "utf8")));
    const after = JSON.parse(await import("node:fs").then((m) => m.readFileSync(join(DEST, "after.json"), "utf8")));
    // The pass mark is the 42-aircraft case; fall back to the old heaviest only if it is absent.
    const pick = (j) => j.runs.find((r) => r.label.includes("42 aircraft 2.3")) ?? j.runs.find((r) => r.label.includes("5.5"));
    const b = pick(before), a = pick(after);
    const head = (() => { try { return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch { return null; } })();
    // A MEASUREMENT OLDER THAN THE CODE IS NOT A MEASUREMENT. The previous scorer trusted two checked-in
    // files that no gate ever regenerated, so a pillar could report a gain from a commit long gone.
    if (head && after.commit && after.commit !== head) {
      console.error(`  perf/after.json was measured at ${after.commit}, this is ${head} — refusing to score from it`);
      throw new Error("stale perf");
    }
    if (b && a) perf = {
      before: b.fps, after: a.fps, gain: +(a.fps - b.fps).toFixed(1), throttle: after.cpuThrottle ?? 1,
      domNodes: a.domNodes, heapMB: a.heapMB, memoHit: a.memoHit ?? null, aircraft: a.aircraft ?? null,
    };
  } catch { perf = null; }

  const s = ssses(gateRuns, drift, sp, perf);
  console.log(`\n  SSSES`);
  for (const [name, p] of Object.entries(s.pillars)) console.log(`    ${name.padEnd(14)} ${String(p.score).padStart(3)}  ${p.why}`);
  console.log(`    ${"AVERAGE".padEnd(14)} ${String(s.avg).padStart(3)}`);

  const report = { n: N, gateRuns, artefacts: arts[0], drift, spiral: sp, perf, ssses: s };
  writeFileSync(join(DEST, "spiral9.json"), JSON.stringify(report, null, 2));
  const pass = s.allGreen && drift.length === 0 && s.spiralOk;
  console.log(`\n  ${pass ? "PASS" : "FAIL"} · ${s.totalChecks} checks per run · ${N} runs · ${drift.length} drifted · ${sp.filter((c) => !c.ok).length} spiral failures`);
  console.log(`\n→ ${join(DEST, "spiral9.json")}`);
  process.exit(pass ? 0 : 1);
})();
