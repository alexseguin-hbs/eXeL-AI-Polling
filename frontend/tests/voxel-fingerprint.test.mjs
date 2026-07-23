// §5 — deterministic per-cube fingerprint + 4-section progress (pure-node lock).
import assert from "node:assert";
import { cubeFingerprint, progressSegments } from "../lib/voxel-fingerprint.ts";

let pass = 0;
const ok = (name, cond) => { assert.ok(cond, name); console.log("PASS " + name); pass++; };

// Deterministic — same cube → same pattern every call.
for (let c = 1; c <= 27; c++) {
  assert.deepStrictEqual(cubeFingerprint(c), cubeFingerprint(c), `deterministic cube ${c}`);
}
ok("fingerprint deterministic for cubes 1-27", true);

// 9 cells, never all-off / all-on (visual balance).
for (let c = 1; c <= 9; c++) {
  const fp = cubeFingerprint(c);
  assert.strictEqual(fp.length, 9, `cube ${c} has 9 cells`);
  const on = fp.filter(Boolean).length;
  assert.ok(on > 0 && on < 9, `cube ${c} balanced (${on}/9)`);
}
ok("9 cells, balanced (not all-off/all-on)", true);

// Unique fingerprint per cube across the 9 Level-1 cubes.
const sigs = new Set();
for (let c = 1; c <= 9; c++) sigs.add(cubeFingerprint(c).join(""));
ok("unique fingerprint per Level-1 cube", sigs.size === 9);

// 4-section progress segments map completion → 0..4.
ok("progress 0% → 0 segments", progressSegments(0, 4) === 0);
ok("progress 100% → 4 segments", progressSegments(100, 4) === 4);
ok("progress 76% → 3 segments", progressSegments(76, 4) === 3);
ok("progress clamps >100", progressSegments(150, 4) === 4);

console.log(`\nVOXEL-FINGERPRINT ${pass}/${pass} passed`);
