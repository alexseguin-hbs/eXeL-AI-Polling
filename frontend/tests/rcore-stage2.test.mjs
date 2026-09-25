// rcore-stage2 — the R-CORE version-history badge on the REMAINING surfaces (operator 2026-09-25).
// ====================================================================================================
// Stage 2 puts the SAME bottom-centre two-click R-CORE badge → compare panel on Security-2525, the
// Settings slide-over, the easter-egg / SIM console, and (for family uniformity) Architect-2525 and
// Celestial-2525 — each reading ITS OWN append-only traceability ledger. This gate asserts:
//   · every new ledger normalizes through the shared adapter (rev + title, ≥ 2 revisions to compare);
//   · a deterministic compare(first → current) crosses everything but the floor;
//   · every wired surface mounts <RCoreBadge>, sourced from fromLedgerJson(<its own .gen ledger>).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/rcore-stage2.test.mjs
import fs from "node:fs";
import { fromLedgerJson, compareRevisions } from "../lib/2525-core/revisions.ts";
import { SECURITY_LEDGER } from "../lib/2525-core/security-ledger.gen.ts";
import { SETTINGS_LEDGER } from "../lib/2525-core/settings-ledger.gen.ts";
import { EASTER_EGG_LEDGER } from "../lib/2525-core/easter-egg-ledger.gen.ts";
import { ARCHITECT_LEDGER } from "../lib/2525-core/architect-ledger.gen.ts";
import { CELESTIAL_LEDGER } from "../lib/2525-core/celestial-ledger.gen.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── 1 · every new ledger normalizes + is comparable ────────────────────────────────────────────────
const LEDGERS = [
  { name: "Security-2525", ledger: SECURITY_LEDGER },
  { name: "Settings", ledger: SETTINGS_LEDGER },
  { name: "Easter-Egg", ledger: EASTER_EGG_LEDGER },
  { name: "Architect-2525", ledger: ARCHITECT_LEDGER },
  { name: "Celestial-2525", ledger: CELESTIAL_LEDGER },
];
for (const { name, ledger } of LEDGERS) {
  const H = fromLedgerJson(ledger);
  ok(H.surface === name, `${name}: section carried into history.surface (got ${H.surface})`);
  ok(H.revisions.length >= 2, `${name}: ≥ 2 revisions so the compare tool has something to compare (got ${H.revisions.length})`);
  ok(H.revisions.every((r) => r.rev && typeof r.title === "string" && r.title.length > 0), `${name}: every revision normalized (rev + non-empty title)`);
  ok(H.current === H.revisions[H.revisions.length - 1].rev, `${name}: current = newest rev`);
  // rev ids are the monotonic 1..n strings the ledger declares
  ok(H.revisions.every((r, i) => r.rev === String(i + 1)), `${name}: rev ids are the monotonic 1..n strings`);
  // a deterministic compare(first → current) crosses everything but the floor
  const cmp1 = compareRevisions(H.revisions[0].rev, H.current, H);
  const cmp2 = compareRevisions(H.revisions[0].rev, H.current, H);
  ok(JSON.stringify(cmp1) === JSON.stringify(cmp2), `${name}: compare is deterministic (same inputs → same output)`);
  ok(cmp1.crossed.length === H.revisions.length - 1, `${name}: compare(first → current) crosses everything but the floor (${cmp1.crossed.length}/${H.revisions.length - 1})`);
  ok(/^[0-9a-f]{8}$/.test(cmp1.compareHash), `${name}: compareHash is 8 hex chars`);
}

// ── 2 · every wired surface mounts RCoreBadge from its own ledger ────────────────────────────────────
const SURFACES = [
  { name: "Security-2525", file: "../components/security-2525/command-ux1.tsx", constName: "SECURITY_LEDGER", gen: "security-ledger.gen" },
  { name: "Settings", file: "../components/moderator-settings.tsx", constName: "SETTINGS_LEDGER", gen: "settings-ledger.gen" },
  { name: "Easter-Egg / SIM", file: "../app/sim/page.tsx", constName: "EASTER_EGG_LEDGER", gen: "easter-egg-ledger.gen" },
  { name: "Architect-2525", file: "../components/architect-2525/command-ux1.tsx", constName: "ARCHITECT_LEDGER", gen: "architect-ledger.gen" },
  { name: "Celestial-2525", file: "../components/celestial-2525/celestial-reader.tsx", constName: "CELESTIAL_LEDGER", gen: "celestial-ledger.gen" },
];
for (const { name, file, constName, gen } of SURFACES) {
  const src = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  ok(/<RCoreBadge\b/.test(src), `${name}: mounts <RCoreBadge>`);
  ok(src.includes("fromLedgerJson"), `${name}: normalizes its ledger via fromLedgerJson`);
  ok(src.includes(constName), `${name}: sourced from ${constName}`);
  ok(src.includes(gen), `${name}: imports its own .gen ledger (${gen})`);
  ok(/accent=/.test(src.slice(src.indexOf("<RCoreBadge"))), `${name}: passes an accent to the badge`);
}

console.log(`\nrcore-stage2: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
