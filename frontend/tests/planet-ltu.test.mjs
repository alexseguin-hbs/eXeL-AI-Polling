// planet-ltu — THE PER-PLANET LTU TABLE is master data in the Admin panel under the seed law, and every conversion on the
// Financial-2525 glass derives from it (operator 2026-09-30, addenda 12–13, v.000_r.005): "Standard units for all planets
// are A.B..C · then we convert to hours for earth and LTU for Mars (for now it is hours minutes and seconds) … LTU tables
// for each planet are in admin panel" · "LTU Table should show Month 91 for now (with 1 day system off line Dec 31). Day in
// A.B..C as well as Hours, Minutes, and Seconds with ability to edit".
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/planet-ltu.test.mjs
import fs from "node:fs";
const P = await import("../lib/planet-ltu.ts");
const M = await import("../lib/financial-2525/mot.ts");
const U = await import("../lib/ucrs-2525.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, eps) => Math.abs(a - b) <= eps;

// ── 1 · the seed: Earth and Mars, every number the one primitive already carries ─────────────────────────────
const seed = P.PLANET_LTU_SEED;
const earth = seed.find((r) => r.code === "earth"), mars = seed.find((r) => r.code === "mars");
ok(seed.length === 2 && earth && mars && seed.every((r) => U.PLANETS.some((p) => p.id === r.code)), "two seeded planets, keyed by the UCRS-2525 PLANETS ids (earth · mars)");
ok(earth.yearDays === 365 && earth.revEarthDays === 365 && earth.monthDays === 91 && earth.offlineDay === "12-31" && earth.yearAnchor === "calendar" && earth.hoursPerDay === 24 && earth.minPerHour === 60 && earth.secPerMin === 60 && earth.status === "OPERATOR", "Earth: 365 days = 3600 A · Month 91 for now · offline day Dec 31 · the year opens Jan 1 · 24 · 60 · 60 (OPERATOR)");
ok(mars.yearDays === M.MARS_REVOLUTION_EARTH_DAYS && mars.revLocalDays === M.MARS_REVOLUTION_SOLS && mars.localDaySec === M.SOL_SEC && mars.hoursPerDay === 24 && mars.yearAnchor === "perihelion" && mars.status === "DECLARED", "Mars: its own revolution as the whole (686.98 Earth days; 668.5991 sols the future form), Earth hours · minutes · seconds as LTU for now, opens at perihelion (DECLARED)");
ok(mars.yearDays === U.PLANETS.find((p) => p.id === "mars").tDays, "Mars' revolution equals UCRS-2525's PLANETS mars.tDays — one primitive");

// ── 2 · derived columns: Day in A.B..C beside hours · minutes · seconds ───────────────────────────────────────
const dE = P.derive(earth);
ok(near(dE.dayInA, 9.86301, 1e-5) && dE.dayABC === "9.3106..3058" && dE.hourABC === "0.1479..1627" && dE.minABC === "0.0024..2367" && dE.secABC === "0.0000..1479", `Earth: one day 9.3106..3058 A · one hour 0.1479..1627 · one minute 0.0024..2367 · one second 0.0000..1479 (got ${dE.dayABC} · ${dE.hourABC})`);
ok(dE.aSeconds === 8760 && near(dE.bSeconds, 2.4333, 1e-4) && near(dE.cSeconds, 0.000676, 1e-6) && dE.monthABC === "897.1923..1036", "Earth: one A = 8,760 s · B 2.4333 s · C 0.676 ms · the 91-day month is 897.1923..1036 A (C rounds; the D tier reads 1035...2219)");
ok(P.revolutionSec(earth) === M.FINANCIAL_YEAR_SEC && P.daySecOf(earth) === 86400, "the whole in seconds = 365 × 86,400 = FINANCIAL_YEAR_SEC; a day is 86,400 s");
const dM = P.derive(mars);
ok(near(dM.aSeconds, 16487.52, 0.01) && near(dM.dayInA, 5.2403, 1e-3) && near(P.revolutionSec(mars), 686.98 * 86400, 1), "Mars on Earth hours: one A = 16,487.5 s; one Earth day is 5.2403 A of the Martian revolution");
const L = P.ltuDays(earth);
ok(L.D === 1 && L.W === 7 && L.M === 91 && L.Q === 91 && L.Y === 365, "the analysis ladder from the row: D 1 · W 7 · M 91 (for now) · Q 91 · Y 365");

// ── 3 · editability: Day-in-A.B..C back-solves the year; a typed number makes the row DECLARED ─────────────────
const e2 = P.withDayInA(earth, 10);
ok(e2.yearDays === 360 && e2.status === "DECLARED" && P.withDayInA(earth, 0) === earth && P.withDayInA(earth, NaN) === earth, "editing Day-in-A.B..C to 10 A makes the year 360 days (DECLARED); zero and NaN change nothing");
ok(P.derive(P.withDayInA(earth, P.derive(earth).dayInA)).dayABC === dE.dayABC, "the Day-in-A.B..C edit round-trips");

// ── 4 · the seed law on the table: a person's edit wins, a seed change reaches an untouched row, tombstones hold
const t0 = P.planetLtuTable(null, null);
ok(t0.length === 2 && t0.every((r) => r._seed && typeof r._seed.yearDays === "string"), "an empty device gets the seed, every row fingerprinted at birth");
const edited = JSON.stringify(t0.map((r) => (r.code === "mars" ? { ...r, hoursPerDay: 24.66, status: "DECLARED" } : r)));
const t1 = P.planetLtuTable(edited, null);
ok(t1.find((r) => r.code === "mars").hoursPerDay === 24.66 && t1.find((r) => r.code === "earth").hoursPerDay === 24, "a person's edit (Mars 24.66 h/day) stays on reload; Earth untouched");
ok(near(P.derive(t1.find((r) => r.code === "mars")).aSeconds, 686.98 * 24.66 * 3600 / 3600, 1) && near(P.derive(t1.find((r) => r.code === "mars")).aSeconds, 16940.9, 0.1), "…and the Mars ladder follows the edit with no code change: one A = 16,940.9 s (686.98 × 24.66 h)");
const stale = JSON.stringify(t0.map((r) => (r.code === "earth" ? { ...r, note: "old seed note" } : r)));   // fingerprint still the seed's → the seed moved? no: same seed, same fp → the row's own value stays? the law: untouched-by-a-person means row equals ITS LAST FINGERPRINT
const t2 = P.planetLtuTable(stale, null);
ok(t2.find((r) => r.code === "earth").note === "old seed note", "a field whose value differs from the fingerprint was edited by a person — it stays");
const tomb = P.planetLtuTable(JSON.stringify(t0.filter((r) => r.code !== "mars")), JSON.stringify(["mars"]));
ok(tomb.length === 1 && tomb[0].code === "earth", "a tombstoned planet never re-seeds");
const back = P.planetLtuTable(JSON.stringify(t0.filter((r) => r.code !== "mars")), null);
ok(back.length === 2 && back.some((r) => r.code === "mars"), "a planet missing with no tombstone joins from the seed");
ok(P.planetLtuTable("garbage{", "x") .length === 2 && P.planetLtuTable("[]", "[]").length === 2, "garbage saved copies fall back to the seed, never a blank table");
const same = P.planetLtuTable(JSON.stringify(t0), null);
ok(JSON.stringify(same) === JSON.stringify(t0), "a reconciled copy reconciles to itself (idempotent)");
ok(P.planetRow(t0, "mars").code === "mars" && P.planetRow(t0, "venus").code === "earth", "planetRow: a known code, Earth for an unknown one");

// ── 5 · the Admin panel carries it and the surface reads it (source-level) ────────────────────────────────────
const page = fs.readFileSync("app/SoI-2525/page.tsx", "utf8");
ok(/"innovation-planet-ltu-removed"\]/.test(page) && /"innovation-planet-ltu",/.test(page), "the table and its tombstone list ride the cloud config bundle (CONFIG_KEYS / TOMBSTONE_KEYS)");
ok(/function loadPlanetLtu\(\)/.test(page) && /loadPlanetLtu\(\);/.test(page) && /lsSet\(PLANET_LTU_KEY, JSON\.stringify\(m\)\)/.test(page), "the loader reconciles the saved table with the seed, writes it back (the seed law), and runs on hydration");
ok(/data-planet-ltu/.test(page) && /soi2525\.planet_ltu/.test(page) && /PLANET_LTU_REMOVED_KEY/.test(page) && /withDayInA\(/.test(page), "the Admin panel renders the Planet LTU section — editable, Day-in-A.B..C back-solving, ✕ tombstone");
const ux = fs.readFileSync("components/financial-2525/command-ux1.tsx", "utf8");
ok(/readPlanetLtu\(\)/.test(ux) && /planetRow\(/.test(ux) && /daySecOf\(planet\)/.test(ux) && /planet\.yearDays/.test(ux) && /planet\.yearAnchor/.test(ux), "Financial-2525 reads the table and converts from the selected row (its day, its whole, its anchor)");

console.log(`planet-ltu: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
