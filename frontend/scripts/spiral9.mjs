#!/usr/bin/env node
/**
 * INNOVATION-2525 TESTING METRICS — the cross-app consistency runner.
 *
 * Operator 2026-10-24: "you need testing metrics yourself for all Innovation-2525 projects to ensure outcome
 * stays consistent."
 *
 * This is the cross-app generalization of the drone-only `drone-spiral9.mjs`. It proves one thing for every
 * domain app in the Vision-2525 toolset: the OUTCOME IS CONSISTENT. Two ways, both evidence, never a label:
 *   1. SUITE DETERMINISM — run the domain's gate core N times; every gate must pass the SAME (passed, failed)
 *      count every run. A count that drifts between identical runs is a flaky outcome.
 *   2. ARTEFACT BYTE-IDENTITY — where a domain exposes a deterministic artefact (architect's projectHash, the
 *      drone arena hash), it must be byte-identical across all N runs. A hash that moves is a world that moved.
 * Plus the two SSSES pillars that can be read the same way for any domain: Stability (determinism + all-green)
 * and Succinctness (the source, counted). Security/Scalability/Efficiency stay UNMEASURED unless a domain has a
 * harness for them (a label is not a measurement — fleet r.147, Thoth/MoT).
 *
 *   SPIRAL_DOMAIN=architect node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/spiral9.mjs
 *   SPIRAL_DOMAIN=all      ... scripts/spiral9.mjs     # the cross-app rollup → perf/innovation-metrics.json
 *
 * Drone keeps its own deeper runner (drone-spiral9.mjs: perf + spiral propagation); this one is the shared,
 * consistent-outcome machine across all seven apps.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path, { join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const N = Number(process.env.SPIRAL_N || 3);
const DEST = process.env.SPIRAL_OUT || join(ROOT, "..", "perf");

// ── per-domain config: the gate CORE (determinism-relevant), the source dirs (Succinctness), the artefact ──
const DOMAINS = {
  architect: {
    gates: ["test:architect-canonical-serialize", "test:architect-canonical-seed", "test:architect-canonical-schema",
      "test:architect-rcore", "test:architect-completion-loop", "test:architect-product-truth", "test:architect-edit",
      "test:room-objects", "test:room-layout", "test:room-scope", "test:estimate", "test:bom", "test:house", "test:layers", "test:framing"],
    sourceDirs: ["lib/architect-2525", "components/architect-2525"],
    artefacts: async () => {
      const { buildProjectFromSeed } = await import("../lib/architect-2525/canonical/runtime.ts");
      const { projectHash } = await import("../lib/architect-2525/canonical/serialize.ts");
      const { TINY_HOME_V1 } = await import("../lib/architect-2525/seeds/tiny-home-v1.ts");
      const r0 = buildProjectFromSeed(TINY_HOME_V1);
      return { projectHash: projectHash(r0), spaces: r0.entities.length };
    },
  },
  drone: {
    gates: ["test:drone-arena", "test:drone-hal", "test:drone-crs", "test:drone-i18n", "test:vector-law"],
    sourceDirs: ["lib/drone-2525", "lib/wire-core"],
    artefacts: async () => {
      const { buildArena } = await import("../lib/drone-2525/arena-model.ts");
      const { canonicalHash } = await import("../lib/wire-core/wire-model.ts");
      const { DRONE_DOMAIN } = await import("../lib/drone-2525/domain.gen.ts");
      const a = buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: "spiral" });
      return { modelHash: canonicalHash(a.model), doors: a.doors.length };
    },
  },
  security: { gates: ["test:security-file", "test:security-guard", "test:security-paris"], sourceDirs: ["lib/security-2525", "components/security-2525"] },
  celestial: { gates: ["test:celestial", "test:celestial-packs", "test:celestial-i18n"], sourceDirs: ["lib/celestial-2525", "components/celestial-2525"] },
  sensorfusion: { gates: ["test:sf-capture", "test:sf-labels", "test:sf-voc", "test:sf-glass"], sourceDirs: ["lib/sensor-fusion-2525", "components/sensor-fusion-2525"] },
  financial: { gates: ["test:financial-accrual", "test:financial-cards", "test:financial-crs", "test:financial-rate"], sourceDirs: ["lib/financial-2525", "components/financial-2525"] },
  soi: { gates: ["test:soi-section", "test:soi-pod", "test:innovation-time", "test:innovation-store"], sourceDirs: ["lib/innovation-data.ts", "lib/innovation-store.ts"] },
};

// A GATE THAT PRINTS NO COUNT STILL PASSES (the --check gates signal by exit code). Mirrors drone-spiral9:48.
function runGate(name) {
  const t0 = Date.now();
  try {
    const out = execFileSync("npm", ["run", "--silent", name], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const m = /(\d+) passed, (\d+) failed/.exec(out);
    return { name, ok: true, counted: Boolean(m), passed: m ? +m[1] : 0, failed: m ? +m[2] : 0, ms: Date.now() - t0 };
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
    const m = /(\d+) passed, (\d+) failed/.exec(out);
    return { name, ok: false, counted: Boolean(m), passed: m ? +m[1] : 0, failed: m ? +m[2] : 1, ms: Date.now() - t0 };
  }
}

// Succinctness, read from the domain's own source (not an opinion). Dead exports + the 300-line rule.
function readSource(dirs) {
  const files = [];
  for (const d of dirs) {
    const abs = path.join(ROOT, d);
    if (!fs.existsSync(abs)) continue;
    const st = statSync(abs);
    const list = st.isFile() ? [abs] : readdirSync(abs).map((f) => path.join(abs, f));
    for (const p of list) {
      if (!/\.(ts|tsx)$/.test(p) || p.endsWith(".gen.ts")) continue;
      try { if (statSync(p).isFile()) files.push({ rel: path.relative(ROOT, p), text: fs.readFileSync(p, "utf8") }); } catch {}
    }
  }
  return files;
}
function succinctness(files) {
  if (!files.length) return { score: null, why: "no source read for this domain" };
  const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const all = files.map((f) => f.text).join("\n");
  const dead = [];
  for (const f of files) {
    for (const m of code(f.text).matchAll(/^export (?:const|function) ([A-Za-z_][A-Za-z0-9_]*)/gm)) {
      const name = m[1];
      const used = files.some((o) => o !== f && new RegExp(`\\b${name}\\b`).test(o.text)) || new RegExp(`\\b${name}\\b`).test(all.replace(code(f.text), ""));
      if (!used) dead.push(`${path.basename(f.rel)}:${name}`);
    }
  }
  let longest = { name: "", lines: 0 };
  for (const f of files) {
    const lines = f.text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = /^export (?:default )?function ([A-Za-z_][A-Za-z0-9_]*)/.exec(lines[i]);
      if (!m) continue;
      let depth = 0, end = i;
      for (let j = i; j < lines.length; j++) { depth += (lines[j].match(/\{/g) ?? []).length - (lines[j].match(/\}/g) ?? []).length; if (j > i && depth <= 0) { end = j; break; } }
      if (end - i > longest.lines) longest = { name: m[1], lines: end - i };
    }
  }
  const score = Math.max(0, Math.min(100, 100 - Math.min(20, dead.length * 2) - (longest.lines > 300 ? Math.min(25, Math.round((longest.lines - 300) / 12)) : 0)));
  return { score, why: `${dead.length} export(s) nothing imports; longest function ${longest.name || "—"} at ${longest.lines} lines against the 300 rule.`, dead: dead.length, longest };
}

async function runDomain(key) {
  const cfg = DOMAINS[key];
  if (!cfg) throw new Error(`unknown domain ${key}; known: ${Object.keys(DOMAINS).join(", ")}`);
  const gateRuns = [], arts = [];
  for (let i = 1; i <= N; i++) {
    const runs = cfg.gates.map(runGate);
    if (cfg.artefacts) { try { arts.push(await cfg.artefacts()); } catch (e) { arts.push({ ERROR: String(e.message) }); } }
    const checks = runs.reduce((n, r) => n + (r.passed ?? 0), 0);
    const bad = runs.filter((r) => !r.ok || r.failed !== 0);
    console.log(`  [${key}] run ${i}/${N} · ${checks} checks · ${bad.length ? `FAILED: ${bad.map((b) => b.name).join(", ")}` : "all green"}`);
    gateRuns.push(runs);
  }
  // SUITE DETERMINISM: every gate's (passed,failed) identical across all N runs.
  const base = gateRuns[0];
  const nondet = base.map((g) => g.name).filter((name) => {
    const vals = gateRuns.map((r) => { const g = r.find((x) => x.name === name); return `${g.passed}/${g.failed}`; });
    return new Set(vals).size !== 1;
  });
  // ARTEFACT BYTE-IDENTITY across runs.
  const drift = arts.length ? Object.keys(arts[0]).filter((k) => arts.some((a) => JSON.stringify(a[k]) !== JSON.stringify(arts[0][k]))) : [];
  const allGreen = gateRuns.every((r) => r.every((g) => g.ok && g.failed === 0));
  const totalChecks = base.reduce((n, g) => n + (g.passed ?? 0), 0);
  const suc = succinctness(readSource(cfg.sourceDirs));
  const stability = { score: (nondet.length === 0 && drift.length === 0 && allGreen) ? 100 : (nondet.length === 0 && drift.length === 0) ? 70 : 40,
    why: nondet.length || drift.length ? `drift — counts:${nondet.join(",") || "none"} artefacts:${drift.join(",") || "none"}` : `${N} runs agree; ${arts.length ? "artefact byte-identical" : "suite-determinism only (no artefact yet)"}.` };
  const pillars = { Stability: stability, Succinctness: suc };
  const measured = Object.values(pillars).filter((p) => typeof p.score === "number");
  const avg = measured.length ? Math.round(measured.reduce((n, p) => n + p.score, 0) / measured.length) : null;
  return {
    domain: key, n: N, gates: cfg.gates.length, totalChecks, allGreen,
    deterministic: nondet.length === 0, nondet, artefactByteIdentical: arts.length ? drift.length === 0 : null, artefactDrift: drift,
    artefact: arts[0] ?? null, ssses: { pillars, avg, measured: measured.length }, durationMs: base.reduce((n, g) => n + g.ms, 0) * N,
  };
}

(async () => {
  mkdirSync(DEST, { recursive: true });
  const which = (process.env.SPIRAL_DOMAIN || "architect").toLowerCase();
  const keys = which === "all" ? Object.keys(DOMAINS) : [which];
  console.log(`INNOVATION-2525 METRICS ×${N} — ${keys.join(", ")}\n`);
  const results = [];
  for (const k of keys) { results.push(await runDomain(k)); }

  console.log(`\n  ROLLUP — outcome consistency across ${results.length} domain(s):`);
  console.log(`  ${"domain".padEnd(13)} ${"gates".padStart(5)} ${"checks".padStart(7)}  determ  artefact  SSSES`);
  for (const r of results) {
    console.log(`  ${r.domain.padEnd(13)} ${String(r.gates).padStart(5)} ${String(r.totalChecks).padStart(7)}  ${(r.deterministic ? "✓" : "✗").padStart(6)}  ${(r.artefactByteIdentical == null ? "—" : r.artefactByteIdentical ? "✓" : "✗").padStart(8)}  ${String(r.ssses.avg ?? "—").padStart(5)} (${r.ssses.measured}/5)`);
  }

  const out = which === "all" ? join(DEST, "innovation-metrics.json") : join(DEST, `${which}-spiral9.json`);
  const payload = which === "all" ? { n: N, domains: results } : results[0];
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`\n→ ${out}`);
  const pass = results.every((r) => r.allGreen && r.deterministic && r.artefactByteIdentical !== false);
  console.log(`  ${pass ? "PASS" : "FAIL"} · every domain all-green, deterministic, and byte-identical where it has an artefact`);
  process.exit(pass ? 0 : 1);
})();
