// TERRAIN determinism lock (F1 · #136 · Thoth's proof concern) — the procedural heightfield must be
// FULLY DETERMINISTIC (same lat/lon/offset → same metres; replayable; no Math.random), always FINITE
// (Enki: no NaN corner ever), and varied per lot (Pangu: real relief, not a flat rectangle).
// Run: node --experimental-strip-types tests/terrain.test.mjs
import { elevAt, sampleGrid, cornerAltitudes, lotSeed, mToFt } from "../lib/terrain.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

const LAT = 30.44, LON = -97.62; // Pfield · Pflugerville, TX (the Architect default lot)

// Determinism — identical inputs → byte-identical output across calls (the replay law).
ok(elevAt(LAT, LON, 1, 2) === elevAt(LAT, LON, 1, 2), "elevAt deterministic (same input → same metres)");
ok(lotSeed(LAT, LON) === lotSeed(LAT, LON), "lotSeed deterministic");
const g1 = sampleGrid(LAT, LON, 3), g2 = sampleGrid(LAT, LON, 3);
ok(JSON.stringify(g1) === JSON.stringify(g2), "sampleGrid deterministic");

// Finiteness — every sampled value + every corner is a finite number (Enki: never NaN/Infinity).
ok(g1.length === 9 && g1.every((v) => Number.isFinite(v)), "sampleGrid(3) → 9 finite values");
const ca = cornerAltitudes(LAT, LON);
ok(["nw", "ne", "sw", "se"].every((k) => Number.isFinite(ca[k])), "cornerAltitudes all finite");

// Bounded relief — stays within the documented ~-8..+12 m envelope around the pad (no runaway spikes).
const many = sampleGrid(LAT, LON, 9);
ok(many.every((v) => v >= -15 && v <= 15), "elevation bounded within ±15 m");

// Variation — different lots yield different terrain (Pangu: alive, not a flat identical plane).
const other = sampleGrid(30.27, -97.74, 3); // downtown Austin — a different lot
ok(JSON.stringify(g1) !== JSON.stringify(other), "different lat/lon → different terrain");
ok(new Set(g1).size > 1, "a single lot's grid is not all one flat value");

// Units — metres→feet is the standard 3.28084 conversion, integer-rounded.
ok(mToFt(0) === 0 && mToFt(3) === 10 && mToFt(-3) === -10, "mToFt(0/3/-3) = 0/10/-10");

console.log(`\nTERRAIN ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
