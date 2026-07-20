// ARCHITECT-2525 .arch2525 PROJECT FILE lock — the custom, uploadable design file round-trips ALL elements and
// rejects foreign / hostile uploads (WireGuard). Run:
// node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-project-file.test.mjs
import { serializeProject, toFileText, parseProject, projectFilename, ARCH_FILE_FORMAT, ARCH_FILE_EXT, sealProject, unsealProject, isSealed, ARCH_SEALED_FORMAT } from "../lib/architect-project-file.ts";
import { placeObject } from "../lib/room-objects.ts";
import { TINY_ROOM_LAYOUT } from "../lib/room-layout.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

const snapshot = {
  houseSpec: ["physical/electrical", "physical/plumbing"],
  layerHidden: ["physical/site"], layerLocked: [],
  unclassified: [], bimManifest: null, assetOverrides: {}, gate: 3,
  globalParams: { areaFt2: 900 }, program: { bedrooms: 1 }, codes: ["IRC-2021"], replay: [], savedAt: 111,
};
// a real interior — furniture placed in the master bedroom
const rooms = TINY_ROOM_LAYOUT.map((r, i) => (i === 0 ? { ...r, objects: placeObject(placeObject([], "bed", 4, 4), "window", 0, 4) } : r));

// 1. serialize → the bundle carries every element + the format tag
const proj = serializeProject("My Loft", "tiny", snapshot, rooms, 123456);
ok(proj.format === ARCH_FILE_FORMAT && proj.version >= 1, "serializeProject tags format + version");
ok(proj.name === "My Loft" && proj.homeType === "tiny" && proj.savedAt === 123456, "carries name · homeType · savedAt");
ok(proj.snapshot.houseSpec.length === 2 && proj.roomLayout.length === TINY_ROOM_LAYOUT.length, "carries snapshot + full room layout");

// 2. round-trip through the on-disk text — all elements survive
const round = parseProject(toFileText(proj));
ok(round !== null, "parseProject reads our own file");
ok(round.name === "My Loft" && round.homeType === "tiny", "round-trip preserves name + market");
ok(JSON.stringify(round.snapshot.houseSpec) === JSON.stringify(snapshot.houseSpec), "round-trip preserves selected systems");
ok((round.roomLayout[0].objects || []).some((o) => o.kind === "bed") && (round.roomLayout[0].objects || []).some((o) => o.kind === "window"), "round-trip preserves placed furniture (bed + window)");

// 3. WireGuard — reject foreign / malformed uploads, never throw
ok(parseProject('{"format":"mission-planning","aos":[]}') === null, "rejects a non-Architect file (wrong format tag)");
ok(parseProject("not json at all") === null, "rejects unparseable text");
ok(parseProject(null) === null && parseProject(42) === null, "rejects null / non-object");

// 4. a hostile file with garbage fields sanitizes to safe state (doesn't throw, drops junk)
const hostile = parseProject(JSON.stringify({ format: ARCH_FILE_FORMAT, name: 42, homeType: "commercial", snapshot: { gate: 999, houseSpec: "x" }, roomLayout: [{ evil: true }, null, 7] }));
ok(hostile !== null, "hostile-but-tagged file parses (sanitized)");
ok(typeof hostile.name === "string" && hostile.homeType === "full", "hostile name coerced to string, bad homeType → full");
ok(Array.isArray(hostile.snapshot.houseSpec) && hostile.snapshot.gate <= 13, "hostile snapshot clamped (houseSpec array, gate bounded)");

// 5. filename slug
ok(projectFilename("My Loft!") === `my-loft.${ARCH_FILE_EXT}`, "projectFilename slugs the name + .arch2525 ext");
ok(projectFilename("") === `design.${ARCH_FILE_EXT}`, "projectFilename falls back to 'design'");

// 6. MAX MODULARITY — a future addition in the ext bag round-trips losslessly through this parser
const withExt = serializeProject("Future", "full", snapshot, rooms, 1, { fabSpec: { hal: "robot-A", v: 2 }, futureCube: [1, 2, 3] });
const extBack = parseProject(toFileText(withExt));
ok(extBack.ext && extBack.ext.futureCube && JSON.stringify(extBack.ext.fabSpec) === JSON.stringify({ hal: "robot-A", v: 2 }), "ext bag (future additions) preserved through parse — forward-compatible");

// 7. SYSTEM SEAL — encrypt so only the system can unlock
const sealed = sealProject(proj);
ok(sealed.format === ARCH_SEALED_FORMAT && sealed.sealed === true && typeof sealed.blob === "string", "sealProject produces a sealed envelope");
ok(!sealed.blob.includes("bed") && !sealed.blob.includes("My Loft") && !sealed.blob.includes("architect-2525\""), "sealed blob is NOT plaintext (design encrypted)");
ok(sealed.name === "My Loft", "sealed envelope keeps a clear title so the library can list it locked");
ok(isSealed(sealed) && isSealed(toFileText(sealed)) && !isSealed(toFileText(proj)), "isSealed detects sealed vs plain");
const unsealed = unsealProject(toFileText(sealed));
ok(unsealed !== null && unsealed.name === "My Loft" && (unsealed.roomLayout[0].objects || []).some((o) => o.kind === "bed"), "unsealProject round-trips the full design (system unlock)");
ok(parseProject(toFileText(sealed)) === null, "plain parseProject refuses a sealed file (must go through unseal)");
ok(unsealProject('{"format":"architect-2525-sealed","alg":"nope","blob":"x"}') === null, "unseal rejects an unknown seal alg");

console.log(`\nARCHITECT-PROJECT-FILE ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
