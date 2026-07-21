// SECURITY-2525 .sec2525 MISSION FILE lock (SEC-A) — the portable mission file round-trips the plan and rejects
// foreign / hostile uploads (WireGuard), and the system seal encrypts it. Mirrors architect-project-file.test.mjs. Run:
// node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/security-mission-file.test.mjs
import { serializeMission, toFileText, parseMission, missionFilename, SEC_FILE_FORMAT, SEC_FILE_EXT, sealMission, unsealMission, isSealed, SEC_SEALED_FORMAT } from "../lib/security-mission-file.ts";
import { SUPPORT_CATALOG } from "../components/security-2525/mission-support.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

const supKey = SUPPORT_CATALOG[0].key; // a real, whitelisted support kind
const plan = {
  placed: [{ id: "a1", key: "asset.recon", lat: 30.1, lng: -97.7, label: "Recon Team" }],
  placedSupport: [{ id: "s1", key: supKey, lat: 30.2, lng: -97.8 }],
};

// 1. serialize → the bundle carries the plan + format tag
const m = serializeMission("AO Alpha Recon", "TX-ALPHA", plan, 123456);
ok(m.format === SEC_FILE_FORMAT && m.version >= 1, "serializeMission tags format + version");
ok(m.name === "AO Alpha Recon" && m.aoKey === "TX-ALPHA" && m.savedAt === 123456, "carries name · aoKey · savedAt");
ok(m.plan.placed.length === 1 && m.plan.placedSupport.length === 1, "carries the full plan (placed + support)");

// 2. round-trip through the on-disk text — the plan survives
const round = parseMission(toFileText(m));
ok(round !== null, "parseMission reads our own file");
ok(round.name === "AO Alpha Recon" && round.aoKey === "TX-ALPHA", "round-trip preserves name + aoKey");
ok(round.plan.placed[0].key === "asset.recon" && round.plan.placed[0].label === "Recon Team", "round-trip preserves placed asset");
ok(round.plan.placedSupport[0].key === supKey, "round-trip preserves whitelisted support object");

// 3. WireGuard — reject foreign / malformed uploads, never throw
ok(parseMission('{"format":"architect-2525","snapshot":{}}') === null, "rejects a non-Security file (wrong format tag)");
ok(parseMission("not json at all") === null, "rejects unparseable text");
ok(parseMission(null) === null && parseMission(42) === null, "rejects null / non-object");

// 4. hostile file — junk fields sanitize to safe state (drops malformed + unknown support kinds), never throws
const hostile = parseMission(JSON.stringify({
  format: SEC_FILE_FORMAT, name: 42, aoKey: 99,
  plan: {
    placed: [{ id: "ok", key: "asset.x", lat: 10, lng: 10 }, { evil: true }, null, 7, { id: "bad", key: "x", lat: 999, lng: 0 }],
    placedSupport: [{ id: "s", key: "missile-strike-package", lat: 1, lng: 1 }, { id: "s2", key: supKey, lat: 2, lng: 2 }],
  },
}));
ok(hostile !== null, "hostile-but-tagged file parses (sanitized)");
ok(typeof hostile.name === "string" && typeof hostile.aoKey === "string", "hostile name/aoKey coerced to strings");
ok(hostile.plan.placed.length === 1, "hostile placed: malformed/out-of-range dropped, valid kept");
ok(hostile.plan.placedSupport.length === 1 && hostile.plan.placedSupport[0].key === supKey, "unknown support kind DROPPED (WireGuard whitelist)");

// 5. filename slug
ok(missionFilename("AO Alpha!") === `ao-alpha.${SEC_FILE_EXT}`, "missionFilename slugs the name + .sec2525 ext");
ok(missionFilename("") === `mission.${SEC_FILE_EXT}`, "missionFilename falls back to 'mission'");

// 6. MAX MODULARITY — a future ext addition round-trips losslessly
const withExt = serializeMission("Future", "AO", plan, 1, { fusion: { v: 2 }, futurePacket: [1, 2, 3] });
const extBack = parseMission(toFileText(withExt));
ok(extBack.ext && extBack.ext.futurePacket && JSON.stringify(extBack.ext.fusion) === JSON.stringify({ v: 2 }), "ext bag preserved through parse — forward-compatible");

// 7. SYSTEM SEAL — encrypt so only the system can unlock
const sealed = sealMission(m);
ok(sealed.format === SEC_SEALED_FORMAT && sealed.sealed === true && typeof sealed.blob === "string", "sealMission produces a sealed envelope");
ok(!sealed.blob.includes("Recon") && !sealed.blob.includes("AO Alpha") && !sealed.blob.includes("security-2525\""), "sealed blob is NOT plaintext (mission encrypted)");
ok(sealed.name === "AO Alpha Recon", "sealed envelope keeps a clear title so the library can list it locked");
ok(isSealed(sealed) && isSealed(toFileText(sealed)) && !isSealed(toFileText(m)), "isSealed detects sealed vs plain");
const unsealed = unsealMission(toFileText(sealed));
ok(unsealed !== null && unsealed.name === "AO Alpha Recon" && unsealed.plan.placed[0].key === "asset.recon", "unsealMission round-trips the full mission (system unlock)");
ok(parseMission(toFileText(sealed)) === null, "plain parseMission refuses a sealed file (must go through unseal)");
ok(unsealMission('{"format":"security-2525-sealed","alg":"nope","blob":"x"}') === null, "unseal rejects an unknown seal alg");

console.log(`\nSECURITY-MISSION-FILE ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
