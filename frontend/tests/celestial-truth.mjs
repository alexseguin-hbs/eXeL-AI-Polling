/**
 * CELESTIAL TRUTH HARNESS — verifies the UCRS-2525 celestial ENGINE DATA against authoritative real astronomy.
 * Pure Node (no browser): `node --experimental-strip-types tests/celestial-truth.mjs` (Node ≥22.6) — see package.json
 * "test:truth". Locks the already-correct constants against silent edits, and (Step 2) real ephemeris positions.
 *
 * REFERENCE sources (J2000): JPL SSD Standish `p_elem_t1` (orbital elements); NASA GSFC planetary + Moon fact sheets
 * (rotation, periods, Moon); astropixels.com / Espenak (bright-star RA/Dec). See docs/architecture-2525/CELESTIAL_SKY_SPEC.md §6.
 */
import { PLANETS, MOON, MOON_SIDEREAL_DAYS, MOON_SYNODIC_DAYS, sunDotRadius, planetDotRadius } from "../lib/ucrs-2525.ts";
import { PRIORITY_CONSTELLATIONS, POLARIS } from "../lib/constellations.ts";
import { heliocentricLon } from "../lib/ephemeris.ts";
import { overWindow, bestDateForWindow } from "../lib/celestial.ts";

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

console.log("— REAL EPHEMERIS: heliocentric longitude @ J2000 vs computed reference snapshot —");
const J2000_JD = 2451545;
// λ @ J2000.0 (deg) computed from the same JPL elements (research validation snapshot). Inner ±0.5°, outer ±1.0°.
const REF_LON = { mercury: [253.784, 0.5], venus: [182.607, 0.5], earth: [100.380, 0.5], mars: [359.448, 0.5], jupiter: [36.380, 1.0], saturn: [45.579, 1.0], uranus: [316.399, 1.0], neptune: [303.916, 1.0], pluto: [250.535, 1.0] };
for (const [id, [lam, tol]] of Object.entries(REF_LON)) {
  const got = heliocentricLon(id, J2000_JD);
  const d = Math.min(Math.abs(got - lam), 360 - Math.abs(got - lam));
  ok(`${id} λ@J2000 ${got.toFixed(3)}° ≈ ${lam}° (±${tol})`, d <= tol, `Δ ${d.toFixed(3)}°`);
}

console.log("— SUN size proportionate to the planet-size mode (thematic Sun modest, not overwhelming) —");
const jup = PLANETS.find((p) => p.id === "jupiter");
const sunTh = sunDotRadius("thematic"), jupTh = planetDotRadius(jup, "thematic");
ok(`thematic Sun ${sunTh} is the biggest body but modest (> Jupiter ${jupTh.toFixed(2)}, < 4)`, sunTh > jupTh && sunTh < 4);
ok(`Sun size ordered thematic(${sunTh}) < truescale(${sunDotRadius("truescale")}) < proportional(${sunDotRadius("proportional")})`, sunDotRadius("thematic") < sunDotRadius("truescale") && sunDotRadius("truescale") < sunDotRadius("proportional"));

console.log("— PLANET size: TRUE SCALE accurate + Jupiter NOT too big in the other modes + Moon real diameter (operator) —");
const jupTs = planetDotRadius(jup, "truescale"), sunTs = sunDotRadius("truescale");
ok(`true-scale Jupiter/Sun ≈ 0.10 (real 69911/695700 = 0.1005): got ${(jupTs / sunTs).toFixed(3)}`, Math.abs(jupTs / sunTs - 0.1005) < 0.02);
const jupPr = planetDotRadius(jup, "proportional"), sunPr = sunDotRadius("proportional");
ok(`proportional Jupiter (${jupPr.toFixed(2)}) reads well under the Sun (${sunPr}) — < 45% (was ~83%)`, jupPr / sunPr < 0.45);
ok(`thematic Jupiter (${jupTh.toFixed(2)}) modest under the Sun (${sunTh})`, jupTh < sunTh * 0.7);
const earthKm = PLANETS.find((p) => p.id === "earth").radiusKm;
ok(`Moon:Earth diameter ratio = real 0.273 (${(MOON.radiusKm / earthKm).toFixed(3)})`, Math.abs(MOON.radiusKm / earthKm - 0.2727) < 0.005);

console.log("— WINDOW-FRAMING solvers (homeowner mission, lib/celestial) — deterministic + edge/null paths —");
// A synthetic body that SWEEPS azimuth (15°/h, like the real sky), crossing due-SOUTH (az 180) exactly at local noon,
// climbing to el 50° at transit, below the horizon at night. (Real bodies always move in az → a single, meaningful transit.)
const dueSouthNoon = (h) => ({ az: 180 + (h - 12) * 15, el: 50 - Math.abs(h - 12) * 10 });
const hitS = overWindow(dueSouthNoon, 180);
ok(`overWindow finds the S transit AT noon (hour ${hitS?.hour?.toFixed(2)})`, !!hitS && near(hitS.hour, 12, 0.1) && near(hitS.diff, 0, 1), `diff ${hitS?.diff?.toFixed(2)}`);
// NULL path — a body that never clears the horizon returns null (never framed).
const alwaysBelow = () => ({ az: 180, el: -10 });
ok("overWindow returns null when the body never rises (never framed)", overWindow(alwaysBelow, 180) === null);
// A window facing EAST (90°) is best matched by this body when its az is nearest 90° (early, low) → wide-ish diff, hit above horizon.
const hitE = overWindow(dueSouthNoon, 90);
ok(`overWindow east-facing vs sweeping body → hit above horizon (diff ${hitE?.diff?.toFixed(0)}°)`, !!hitE && hitE.el > 0);
// Determinism — identical inputs → identical output.
ok("overWindow deterministic (same inputs → same hour)", overWindow(dueSouthNoon, 180)?.hour === hitS?.hour);
// bestDateForWindow — only doy 100 puts the body above the horizon (sweeping to S at noon); others below → picks 100.
const onlyDoy100 = (doy, h) => ({ az: 180 + (h - 12) * 15, el: doy === 100 ? 50 - Math.abs(h - 12) * 10 : -5 });
const bd = bestDateForWindow(onlyDoy100, 180);
ok(`bestDateForWindow picks the only qualifying date (doy ${bd?.doy})`, !!bd && bd.doy === 100);
ok("bestDateForWindow returns null when no date qualifies", bestDateForWindow(() => ({ az: 180, el: -5 }), 180) === null);

console.log("\nCELESTIAL-TRUTH " + pass + "/" + (pass + fail) + " passed");
if (fail > 0) process.exit(1);
