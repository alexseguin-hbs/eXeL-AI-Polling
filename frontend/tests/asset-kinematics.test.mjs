// ASSET-KINEMATICS lock (#25) — aerial assets set up with hdg·spd·alt; ground with course·spd only.
// Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/asset-kinematics.test.mjs
import { AERIAL_ASSETS, isAerialAsset, assetKinematics } from "../lib/asset-kinematics.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { (c ? pass++ : fail++); console.log(c ? "PASS" : "FAIL", m); };

ok(AERIAL_ASSETS.length === 2 && AERIAL_ASSETS.includes("xbat") && AERIAL_ASSETS.includes("autofoil"), "aerial = xbat + autofoil");
ok(isAerialAsset("xbat") && isAerialAsset("autofoil"), "xbat/autofoil are aerial");
ok(!isAerialAsset("avenger") && !isAerialAsset("patriot") && !isAerialAsset("thaad") && !isAerialAsset("sentinel"), "air-defence systems are ground");
ok(!isAerialAsset("nonsense"), "unknown kind → not aerial (safe default)");

// Aerial gets altitude; ground never does.
const air = assetKinematics("autofoil");
ok(air.aerial && air.fields.join() === "heading,speed,altitude", "aerial fields = heading·speed·altitude");
const gnd = assetKinematics("avenger");
ok(!gnd.aerial && gnd.fields.join() === "course,speed", "ground fields = course·speed (no altitude)");
ok(!assetKinematics("thaad").fields.includes("altitude"), "ground never captures altitude");
ok(assetKinematics("xbat").fields.includes("altitude") && !assetKinematics("xbat").fields.includes("course"), "aerial has altitude, not course");

console.log(`\nASSET-KINEMATICS ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
