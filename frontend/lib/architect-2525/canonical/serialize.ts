// SPECS / ARCHITECT-2525 §09 / §10 / §XXII — THE ONE pure canonical serializer. The only serialization
// used to compute project_hash. Contract: UTF-8 · recursively sorted object keys · deterministic array
// ordering (entity arrays sorted by the RAW case-preserved entity_id byte string) · NFC-normalized
// strings and keys · absent/undefined keys omitted (never emitted as null) · no insignificant whitespace ·
// volatile/UI/provenance fields excluded. The hash is sha256Hex (UTF-8 via TextEncoder) — NEVER
// record.ts's FNV-1a/charCodeAt/UTF-16 or any timestamp-folding (Thoth); "mirror record.ts" is scoped to
// its append/replay/verify CONTROL FLOW only, in rcore.ts.
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-seed.test.mjs

import { sha256Hex } from "@/lib/wire-core/sha256";
import type { ArchitectProject } from "./types";

/** Volatile / UI / provenance keys excluded from project_hash (§09/§24/§3.2). */
const VOLATILE_KEYS = new Set([
  "created_at", "updated_at", "package_hash",
  "camera", "selection", "ui",
  "local_date", "timestamp_ms",
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Recursively produce a canonical value: sorted keys, NFC strings, volatile dropped, entity arrays sorted. */
function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  const t = typeof value;
  if (t === "string") return (value as string).normalize("NFC");
  if (t === "number") {
    if (!Number.isFinite(value as number)) {
      throw new Error(`ARCHITECT §09: non-finite number cannot be canonicalized: ${String(value)}`);
    }
    return value;
  }
  if (t === "boolean") return value;
  if (Array.isArray(value)) {
    const items = value.map(canonicalize);
    // Deterministic array ordering: an array whose every element carries a string entity_id is sorted by
    // that raw, case-preserved byte string (lowercasing applies only to hex-UUID generation, never here —
    // a real IFC GlobalId is case-sensitive base64). Other arrays keep their producer order.
    if (items.length > 0 && items.every((x) => isPlainObject(x) && typeof (x as Record<string, unknown>).entity_id === "string")) {
      items.sort((a, b) => {
        const ka = (a as Record<string, string>).entity_id;
        const kb = (b as Record<string, string>).entity_id;
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      });
    }
    return items;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      if (VOLATILE_KEYS.has(key)) continue;
      const v = (value as Record<string, unknown>)[key];
      if (v === undefined) continue; // omit absent optionals, never emit null for them
      out[key.normalize("NFC")] = canonicalize(v);
    }
    return out;
  }
  throw new Error(`ARCHITECT §09: value of type ${t} cannot be canonicalized`);
}

/** SPECS §09 — the one canonical serialization string for a project. Deterministic; volatile-excluded. */
export function serializeCanonicalProject(project: ArchitectProject): string {
  return JSON.stringify(canonicalize(project));
}

/** SPECS §10/§XXII — project_hash = SHA-256 (UTF-8) of the canonical serialization. */
export function projectHash(project: ArchitectProject): string {
  return sha256Hex(serializeCanonicalProject(project));
}

/** §17 — canonical_serialization_byte_count for HASH_PROOF (UTF-8 bytes, not UTF-16 code units). */
export function canonicalByteCount(project: ArchitectProject): number {
  return new TextEncoder().encode(serializeCanonicalProject(project)).length;
}

/**
 * A generic canonical hash of any volatile-excluded value, for Block B/C (event_hash, content_hash).
 * Same contract as the project serializer: sorted keys, NFC, volatile dropped, UTF-8 sha256Hex.
 */
export function canonicalHash(value: unknown): string {
  return sha256Hex(JSON.stringify(canonicalize(value)));
}
