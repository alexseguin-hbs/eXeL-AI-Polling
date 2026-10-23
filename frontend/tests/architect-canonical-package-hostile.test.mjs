// ARC-36.05 — hostile .arch2525 rejection. Every untrusted parse — the V1 JSON adapter AND every V2 ZIP
// entry — is guarded: bad ZIP magic, path-traversal (../), zip-bomb (oversized entry / too many entries),
// and prototype-pollution keys are all refused, with no throw escaping into a partial load.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-package-hostile.test.mjs
import { readPackageV2, readPackageV1, readPackage, buildZip } from "../lib/architect-2525/canonical/package.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };
const throws = (fn, re, m) => { let e = null; try { fn(); } catch (x) { e = x; } ok(e && (!re || re.test(e.message)), m + (e ? "" : " (did not throw)")); };
const te = new TextEncoder();
const bytes = (s) => te.encode(s);

// ── bad ZIP magic ──
throws(() => readPackageV2(bytes("this is not a zip at all")), /bad magic/i, "V2 reader refuses non-ZIP bytes");
throws(() => readPackageV2(new Uint8Array([0x50, 0x4b, 0x01, 0x02])), /bad magic|no entries/i, "V2 reader refuses a non-local-header start");

// ── path-traversal in a V2 entry name ──
throws(() => readPackageV2(buildZip([{ path: "../evil.json", data: bytes("{}") }])), /path-traversal|unsafe/i, "path-traversal entry name is refused");
throws(() => readPackageV2(buildZip([{ path: "/etc/passwd", data: bytes("{}") }])), /path-traversal|unsafe/i, "absolute entry path is refused");

// ── zip-bomb: an oversized entry, and too many entries ──
throws(() => readPackageV2(buildZip([{ path: "manifest.json", data: new Uint8Array(4_100_000) }])), /size cap/i, "an entry over the size cap is refused");
const many = Array.from({ length: 65 }, (_, i) => ({ path: `f${i}.json`, data: bytes("{}") }));
throws(() => readPackageV2(buildZip(many)), /too many entries/i, "too many entries is refused");

// ── prototype pollution: a literal __proto__ key in untrusted JSON (V1 and V2) ──
const polluted = '{"entities":[],"current_revision_id":"R0","__proto__":{"polluted":"yes"}}';
const v1Safe = readPackageV1(bytes(polluted)); // the safe reviver strips __proto__; this parses, it does not pollute
ok(v1Safe && Array.isArray(v1Safe.project.entities), "a V1 __proto__ payload parses safely through the reviver");
ok(({}).polluted === undefined && Object.prototype.polluted === undefined, "Object.prototype was NOT polluted by the V1 parse");
// a V2 package whose project.json carries __proto__ — the reseal will not match, so it fails CLOSED; either way no pollution
throws(() => readPackageV2(buildZip([
  { path: "project.json", data: bytes(polluted) },
  { path: "manifest.json", data: bytes('{"schema_version":1,"min_reader_version":1}') },
  { path: "events/events.jsonl", data: bytes("") },
  { path: "manifest.seal.json", data: bytes('{"package_hash":"00","schema_version":1,"min_reader_version":1,"entries":[]}') },
])), /seal mismatch|refusing/i, "a V2 project.json with __proto__ fails the reseal (closed), no partial load");
ok(({}).polluted === undefined && Object.prototype.polluted === undefined, "Object.prototype was NOT polluted by the V2 parse");

// ── a V1 file that is not a project is refused ──
throws(() => readPackageV1(bytes('[1,2,3]')), /not a project/i, "a V1 file that is not a project object is refused");

// ── a well-formed but empty archive (no local entries) is refused, not silently empty ──
throws(() => readPackage(new Uint8Array([0x50, 0x4b, 0x03, 0x04])), null, "a truncated local header is refused");

console.log(`\narchitect-canonical-package-hostile: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
