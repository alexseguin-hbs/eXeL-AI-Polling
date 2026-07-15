/**
 * CELESTIAL TRUTH HARNESS — verifies the UCRS-2525 celestial ENGINE DATA against authoritative real astronomy.
 * Pure Node (no browser): `node --experimental-strip-types tests/celestial-truth.mjs` (Node ≥22.6) — see package.json
 * "test:truth". Locks the already-correct constants against silent edits, and (Step 2) real ephemeris positions.
 *
 * REFERENCE sources (J2000): JPL SSD Standish `p_elem_t1` (orbital elements); NASA GSFC planetary + Moon fact sheets
 * (rotation, periods, Moon); astropixels.com / Espenak (bright-star RA/Dec). See docs/architecture-2525/CELESTIAL_SKY_SPEC.md §6.
 */
import { PLANETS, MOON, MOON_SIDEREAL_DAYS, MOON_SYNODIC_DAYS } from "../lib/ucrs-2525.ts";
import { PRIORITY_CONSTELLATIONS, POLARIS } from "../lib/constellations.ts";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => { (cond ? pass++ : fail++); console.log((cond ? "PASS " : "FAIL ") + name + (detail ? "  (" + detail + ")" : "")); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const pctNear = (a, b, pct) => b === 0 ? Math.abs(a) <= pct : Math.abs(a - b) / Math.abs(b) <= pct;

// ── REFERENCE: sidereal period (days) · a (AU) · e · inclination to ecliptic (°) · sidereal rotation (days, −=retro)
const REF = {
  mercury: { P: 87.9691, a: 0.38709927, e: 0.20563593, i: 7.00498, rot: 58.646 },
  venus:   { P: 224.701, a: 0.72333566, e: 0.00677672, i: 3.39468, rot: -243.025 },
  earth:   { P: 365.256, a: 1.00000261, e: 0.01671123, i: 0.0,     rot: 0.99727 },
  mars:    { P: 686.980, a: 1.52371034, e: 0.09339410, i: 1.84969, rot: 1.02596 },
  jupiter: { P: 4332.589, a: 5.20288700, e: 0.04838624, i: 1.30440, rot: 0.41354 },
  saturn:  { P: 10759.22, a: 9.53667594, e: 0.05386179, i: 2.48599, rot: 0.44401 },
  uranus:  { P: 30685.4, a: 19.18916464, e: 0.04725744, i: 0.77264, rot: -0.71833 },
  neptune: { P: 60189.0, a: 30.06992276, e: 0.00859048, i: 1.77004, rot: 0.67125 },
  pluto:   { P: 90560, a: 39.48211675, e: 0.24882730, i: 17.14001, rot: -6.3872 },
};
// REFERENCE constellation-region centroids (RA h · Dec °) — approximate; locks "right part of the sky".
const REF_CON = {
  "Ursa Minor": [15.0, 78], "Ursa Major": [11.3, 56], "Cassiopeia": [1.0, 62], "Cygnus": [20.6, 42],
  "Lyra": [18.8, 39], "Bootes": [14.7, 30], "Leo": [10.6, 16], "Gemini": [7.0, 24],
  "Canis Major": [6.8, -22], "Orion": [5.5, 3], "Taurus": [4.5, 18], "Scorpius": [16.9, -30],
};

console.log("— PLANET physical data vs JPL/NASA —");
for (const p of PLANETS) {
  const r = REF[p.id]; if (!r) { ok(`ref exists ${p.id}`, false); continue; }
  ok(`${p.name} period ${p.tDays}d ≈ ${r.P}d`, pctNear(p.tDays, r.P, 0.001), `Δ ${(p.tDays - r.P).toFixed(3)}d`);
  ok(`${p.name} a ${p.aAU}AU ≈ ${r.a}`, pctNear(p.aAU, r.a, 0.005));
  ok(`${p.name} e ${p.e} ≈ ${r.e}`, pctNear(p.e, r.e, 0.02) || near(p.e, r.e, 0.001));
  ok(`${p.name} incl ${p.incl}° ≈ ${r.i}°`, near(p.incl, r.i, 0.06), `Δ ${(p.incl - r.i).toFixed(3)}`);
  ok(`${p.name} rotation ${p.rotDays}d ≈ ${r.rot}d (sign=retro)`, near(p.rotDays, r.rot, 0.01) && Math.sign(p.rotDays) === Math.sign(r.rot));
}

console.log("— MOON vs NASA Moon Fact Sheet —");
ok(`Moon sidereal ${MOON_SIDEREAL_DAYS}d ≈ 27.3217`, near(MOON_SIDEREAL_DAYS, 27.321661, 0.01));
ok(`Moon synodic ${MOON_SYNODIC_DAYS}d ≈ 29.5306`, near(MOON_SYNODIC_DAYS, 29.530589, 0.01));
ok(`Moon distance ${MOON.distanceKm}km ≈ 384400`, pctNear(MOON.distanceKm, 384400, 0.001));
ok(`Moon inclination ${MOON.inclDeg}° ≈ 5.145`, near(MOON.inclDeg, 5.145, 0.05));
ok(`Moon e ${MOON.e} ≈ 0.0549`, near(MOON.e, 0.0549, 0.001));
ok(`Moon tidally locked (synodic > sidereal)`, MOON_SYNODIC_DAYS > MOON_SIDEREAL_DAYS);

console.log("— STAR / constellation positions vs catalog —");
ok(`Polaris RA ${POLARIS.ra}h ≈ 2.5302`, near(POLARIS.ra, 2.5302, 0.05), `Δ ${(POLARIS.ra - 2.5302).toFixed(3)}h`);
ok(`Polaris Dec ${POLARIS.dec}° ≈ +89.264`, near(POLARIS.dec, 89.2642, 0.1), `Δ ${(POLARIS.dec - 89.2642).toFixed(3)}`);
for (const c of PRIORITY_CONSTELLATIONS) {
  const r = REF_CON[c.name]; if (!r) { ok(`ref exists ${c.name}`, false); continue; }
  // RA wraps at 24h — compare on the circle
  const dRa = Math.min(Math.abs(c.ra - r[0]), 24 - Math.abs(c.ra - r[0]));
  ok(`${c.name} RA ${c.ra}h/Dec ${c.dec}° in region`, dRa <= 1.5 && near(c.dec, r[1], 12), `ΔRA ${dRa.toFixed(2)}h ΔDec ${(c.dec - r[1]).toFixed(1)}`);
}

console.log("\nCELESTIAL-TRUTH " + pass + "/" + (pass + fail) + " passed");
if (fail > 0) process.exit(1);
