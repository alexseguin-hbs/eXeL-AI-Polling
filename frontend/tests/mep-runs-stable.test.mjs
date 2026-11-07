// MEP-RUNS STABLE gate (Revision A · Wave 0 · P0·E, MoT ruling 2026-11-07). ductRuns()/totalFt and the outlet + panel
// placements are PROMISED byte-identical — architect-bom.ts, the Design-Settings duct/wire totals and mep-runs.test.mjs:76–89
// all read them, and the walk's duct/wiring glyphs hang off the same cells — but nothing pinned the promise: a refactor (Wave 3's
// WalkSpace contract) or Wave 4's houseDuctNetwork could move a run and every consumer would drift together, green. This gate
// snapshots the pure outputs for all NINE Tiny Home rooms (TINY_ROOM_LAYOUT — each room's own default objects + its outlet
// count) and asserts BYTE-IDENTICAL equality (sorted-key JSON) against tests/fixtures/mep-runs-snapshot.json. The fixture is
// the behaviour at commit time. A diff here is a DELIBERATE change: re-snapshot on purpose with MEP_SNAPSHOT_WRITE=1 and review
// the fixture diff as the change it is — never silently.
// Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/mep-runs-stable.test.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MEP_GRID, MEP_SOURCE, ductRuns, outletPositions, panelAt } from "../lib/mep-runs.ts";
import { defaultObjectsForRoom } from "../lib/room-objects.ts";
import { TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, "fixtures", "mep-runs-snapshot.json");

// Sorted-key JSON so the bytes never depend on insertion order; arrays keep their order (a run's path IS its order).
const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;
const stable = (v) => JSON.stringify(sortKeys(v), null, 2) + "\n";

// The snapshot: per room (by stable id) — its kind + outlet count, ductRuns with its own objects AND bare (the mep-runs.test.mjs
// call shape), the outlet cells for its count, the panel cell; plus the grid + the four house sources at the top.
function build() {
  const rooms = {};
  for (const r of TINY_ROOM_LAYOUT) {
    const objs = defaultObjectsForRoom(r.k);
    rooms[r.id] = {
      k: r.k, outlets: r.outlets, objectCount: objs.length,
      duct: ductRuns(objs, r.k),
      ductBare: ductRuns([], r.k),
      outletPositions: outletPositions(r.outlets, objs),
      panel: panelAt(objs),
    };
  }
  return { grid: MEP_GRID, source: MEP_SOURCE, rooms };
}
const actual = stable(build());

// ── shape + determinism (cheap, independent of the fixture) ──
const snap = build();
const kinds = Object.values(snap.rooms).map((r) => r.k).sort().join("");
ok(Object.keys(snap.rooms).length === 9 && kinds === "BCDEKLMOS", `all NINE rooms snapshotted (M B C L K D O S E; got ${Object.keys(snap.rooms).length}: ${kinds})`);
ok(stable(build()) === actual, "the snapshot is deterministic (two builds → identical bytes; replay law)");
ok(Object.values(snap.rooms).every((r) => r.duct.runs.length === 1 && r.duct.totalFt === 9), "every room: ONE duct run air→centre register, totalFt 9 (the BOM / Design-Settings number)");
ok(Object.values(snap.rooms).every((r) => r.duct.totalFt === r.ductBare.totalFt && JSON.stringify(r.duct.runs) === JSON.stringify(r.ductBare.runs)), "a room's objects never move the duct run/totalFt (only the return grille may step around a door)");

// ── the byte-identical gate ──
if (process.env.MEP_SNAPSHOT_WRITE === "1") {
  fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
  fs.writeFileSync(FIXTURE, actual);
  console.log(`WROTE ${path.relative(process.cwd(), FIXTURE)} (${actual.length} bytes) — review the diff; this is a deliberate behaviour change`);
} else if (!fs.existsSync(FIXTURE)) {
  ok(false, `fixture missing: ${path.relative(process.cwd(), FIXTURE)} — generate it ONCE with MEP_SNAPSHOT_WRITE=1 and commit it`);
} else {
  const expected = fs.readFileSync(FIXTURE, "utf8");
  if (actual === expected) ok(true, "ductRuns / outletPositions / panelAt / MEP_SOURCE are BYTE-IDENTICAL to the committed snapshot");
  else {
    const a = actual.split("\n"), e = expected.split("\n");
    let i = 0; while (i < a.length && i < e.length && a[i] === e[i]) i++;
    ok(false, `MEP outputs DRIFTED from tests/fixtures/mep-runs-snapshot.json — first difference at fixture line ${i + 1}:\n    expected: ${e[i] ?? "<EOF>"}\n    actual:   ${a[i] ?? "<EOF>"}\n  (${e.length} fixture lines vs ${a.length} actual). If the change is intended, re-snapshot with MEP_SNAPSHOT_WRITE=1 and review the fixture diff.`);
  }
}

console.log(`\nMEP-RUNS-STABLE ${pass}/${pass + fail} passed · 9 rooms · ductRuns + outlets + panel + sources byte-identical to the snapshot`);
if (fail) process.exit(1);
