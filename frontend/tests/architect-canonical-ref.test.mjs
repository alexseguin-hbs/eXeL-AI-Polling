// ARC-36.02 / §10 — INDEPENDENT hash verification. A second canonicalizer (re-deriving the volatile set
// itself) + node:crypto SHA-256 must agree with the production project_hash for R0/R1/R2 — catching a
// serializer+hasher that agree with each other while jointly violating the spec. It must NOT call the
// production serializer internally (only projectHash, to compare the two independent paths).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-ref.test.mjs
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { projectHash } from "../lib/architect-2525/canonical/serialize.ts";
import { buildProjectFromSeed, buildR0Snapshot } from "../lib/architect-2525/canonical/runtime.ts";
import { initRCore } from "../lib/architect-2525/canonical/rcore.ts";
import { acceptEdit, proposeEdgeEdit } from "../lib/architect-2525/canonical/runtime-edit.ts";
import { TINY_HOME_V1 } from "../lib/architect-2525/seeds/tiny-home-v1.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── the INDEPENDENT canonicalizer (re-derives its own volatile list; no import of serialize's canonicalize) ──
const VOLATILE = new Set(["created_at", "updated_at", "package_hash", "camera", "selection", "ui", "local_date", "timestamp_ms"]);
function canon(v) {
  if (v === null) return null;
  const t = typeof v;
  if (t === "string") return v.normalize("NFC");
  if (t === "number" || t === "boolean") return v;
  if (Array.isArray(v)) {
    const a = v.map(canon);
    if (a.length && a.every((x) => x && typeof x === "object" && !Array.isArray(x) && typeof x.entity_id === "string")) {
      a.sort((p, q) => (p.entity_id < q.entity_id ? -1 : p.entity_id > q.entity_id ? 1 : 0));
    }
    return a;
  }
  const o = {};
  for (const k of Object.keys(v).sort()) { if (VOLATILE.has(k)) continue; const val = v[k]; if (val === undefined) continue; o[k.normalize("NFC")] = canon(val); }
  return o;
}
const indepHash = (p) => createHash("sha256").update(JSON.stringify(canon(p)), "utf8").digest("hex");

// ── build R0, R1, R2 the production way ──
const r0 = buildProjectFromSeed(TINY_HOME_V1);
let rc = initRCore(buildR0Snapshot(r0));
const a1 = acceptEdit(r0, rc, proposeEdgeEdit(r0, { bay_code: "C1", edge: "WEST", deltaUm: 304800 }).preview, { actor_id: "HI", actor_role: "HI" });
const r1 = a1.project; rc = a1.rcore;
const a2 = acceptEdit(r1, rc, proposeEdgeEdit(r1, { bay_code: "B2", edge: "EAST", deltaUm: 304800 }).preview, { actor_id: "HI", actor_role: "HI" });
const r2 = a2.project;

// ── the two independent paths agree ──
ok(indepHash(r0) === projectHash(r0), "independent hash == production project_hash for R0");
ok(indepHash(r1) === projectHash(r1), "independent hash == production project_hash for R1");
ok(indepHash(r2) === projectHash(r2), "independent hash == production project_hash for R2");

// ── a non-ASCII fixture agrees too ──
const uni = structuredClone(r0);
uni.entities.find((e) => e.bay_code === "A2").legacy_slug = "salle de bain · café ☼ 웃◬";
ok(indepHash(uni) === projectHash(uni), "independent hash == production hash on a non-ASCII fixture");

// ── the volatile exclusion agrees independently ──
const vol = structuredClone(r0); vol.updated_at = "now"; vol.camera = { z: 3 };
ok(indepHash(vol) === indepHash(r0) && projectHash(vol) === projectHash(r0), "both paths exclude volatile identically");

// ── the independent test must not simply call the production serializer ──
const src = readFileSync(new URL("./architect-canonical-ref.test.mjs", import.meta.url), "utf8");
ok(!/serializeCanonicalProject\s*\(/.test(src) && !/import[^;]*serializeCanonicalProject/.test(src), "the independent canonicalizer neither imports nor calls the production serializer");

console.log(`\narchitect-canonical-ref: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
