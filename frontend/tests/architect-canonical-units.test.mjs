// ARC-34.01 — integer-µm geometry, no floats; assertSafeInt guards every stored dimension AND the
// DERIVED area (product + aggregate). The canonical units are the floor the whole truth loop stands on.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-units.test.mjs
import { readFileSync } from "node:fs";
import {
  UM_PER_FT, UM_PER_IN, UM_PER_MM, UM_PER_10FT, UM2_PER_FT2, MIN_DIMENSION_UM,
  assertSafeInt, areaUm2, sumAreaUm2, sqftFromUm2,
} from "../lib/architect-2525/canonical/units.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };
const throws = (fn, m) => { let t = false; try { fn(); } catch { t = true; } ok(t, m); };

// ── the constants are exact ──
ok(UM_PER_FT === 304800, "UM_PER_FT = 304800");
ok(UM_PER_IN === 25400, "UM_PER_IN = 25400");
ok(UM_PER_MM === 1000, "UM_PER_MM = 1000");
ok(UM_PER_10FT === 3048000, "UM_PER_10FT = 3,048,000 (one seed Space edge)");
ok(MIN_DIMENSION_UM === 1000000, "MIN_DIMENSION_UM = 1,000,000");
ok(UM2_PER_FT2 === 92903040000, "UM2_PER_FT2 = 304800^2 = 92,903,040,000");

// ── assertSafeInt rejects non-integers and unsafe magnitudes ──
ok(assertSafeInt(3048000) === 3048000, "assertSafeInt returns a safe integer");
throws(() => assertSafeInt(1.5), "assertSafeInt throws on a non-integer");
throws(() => assertSafeInt(Number.NaN), "assertSafeInt throws on NaN");
throws(() => assertSafeInt(2 ** 53), "assertSafeInt throws on 2^53 (not safe)");
throws(() => assertSafeInt(Number.MAX_SAFE_INTEGER + 1), "assertSafeInt throws just past the bound");

// ── derived area is guarded: one seed Space is exactly 100 ft² ──
const ONE = areaUm2(UM_PER_10FT, UM_PER_10FT);
ok(ONE === 9290304000000, "one 10ft×10ft Space = 9,290,304,000,000 µm²");
ok(sqftFromUm2(ONE) === 100, "one Space = 100.0 ft² exactly");
ok(sqftFromUm2(sumAreaUm2(Array(9).fill(ONE))) === 900, "nine Spaces = 900.0 ft² exactly");
ok(sumAreaUm2(Array(9).fill(ONE)) < Number.MAX_SAFE_INTEGER, "nine-Space aggregate is within 2^53−1");

// ── a Space larger than ~96,952 ft² overflows the DERIVED area product (Thoth) ──
// side ~312 ft → 95,097,600 µm; side² ≈ 9.04e15 > 2^53. The edges are safe ints; only the product is not.
const BIG = 95_097_600;
ok(Number.isSafeInteger(BIG), "a 312ft edge is itself a safe integer");
throws(() => areaUm2(BIG, BIG), "areaUm2 throws when the product exceeds 2^53−1 (oversized Space)");
throws(() => sumAreaUm2([9_000_000_000_000_000, 9_000_000_000_000_000]), "sumAreaUm2 throws when the running total overflows");

// ── no float LITERAL in the canonical units source (presentation division is a runtime op, not a literal) ──
let src = readFileSync(new URL("../lib/architect-2525/canonical/units.ts", import.meta.url), "utf8");
src = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, ""); // strip comments
ok(!/\b\d+\.\d+\b/.test(src), "units.ts carries zero float literals in code");

console.log(`\narchitect-canonical-units: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
