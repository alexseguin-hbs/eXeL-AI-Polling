// SPECS / ARCHITECT-2525 §12 / §XXI / §XXII / §36.05 — the .arch2525 V2 package. A deterministic store-only
// ZIP (no jszip/fflate dependency), so the same revision saved twice yields the SAME package_hash regardless
// of ZIP timestamps/compression/entry order. package_hash covers the deterministic sequence of
// normalized_path + content_hash (each content_hash is canonicalHash over the volatile-excluded content),
// NEVER the ZIP bytes; manifest.seal.json holds the hash and sits OUTSIDE the data it seals, and the reader
// recomputes it on load and fails CLOSED on mismatch. Every untrusted parse — the V1 JSON adapter AND every
// V2 ZIP entry — goes through caps (entry count / size) + a prototype-pollution-safe reviver (Thor). The V2
// package persists the R-CORE chain (snapshots + events), so replay-after-reload works (Krishna).
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-package.test.mjs

import { sha256Hex } from "@/lib/wire-core/sha256";
import { canonicalHash, serializeCanonicalProject } from "./serialize";
import type { ArchitectProject, RCoreSnapshot, RCoreEventGroup } from "./types";
import type { RCore } from "./rcore";

const SCHEMA_VERSION = 1;
const MIN_READER_VERSION = 1;
const OUR_READER_VERSION = 1;
// Hostile-input caps (apply to BOTH V1 JSON and every V2 ZIP entry).
const MAX_ENTRIES = 64;
const MAX_ENTRY_BYTES = 4_000_000;
const MAX_TOTAL_BYTES = 16_000_000;

const te = new TextEncoder();
const td = new TextDecoder("utf-8", { fatal: false });

// ── prototype-pollution-safe JSON parse (strips __proto__ / constructor / prototype keys) ──
function safeParse(text: string): unknown {
  return JSON.parse(text, (k, v) => (k === "__proto__" || k === "constructor" || k === "prototype" ? undefined : v));
}

// ── CRC32 (for valid ZIP local/central headers) ──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry { path: string; data: Uint8Array; }

/** Build a deterministic store-only ZIP (method 0, fixed timestamps, entries sorted by path). Exported so the
 *  hostile-input gate can craft adversarial archives; it does NOT validate names — the reader guards do. */
export function buildZip(entries: ZipEntry[]): Uint8Array {
  const sorted = entries.slice().sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const e of sorted) {
    const name = te.encode(e.path);
    const crc = crc32(e.data);
    const lh = new Uint8Array(30 + name.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0, true); lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true); lv.setUint16(12, 0x21, true); lv.setUint32(14, crc, true);
    lv.setUint32(18, e.data.length, true); lv.setUint32(22, e.data.length, true);
    lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
    lh.set(name, 30);
    locals.push(lh, e.data);
    const ch = new Uint8Array(46 + name.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true); cv.setUint16(12, 0, true); cv.setUint16(14, 0x21, true); cv.setUint32(16, crc, true);
    cv.setUint32(20, e.data.length, true); cv.setUint32(24, e.data.length, true);
    cv.setUint16(28, name.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true); cv.setUint16(36, 0, true); cv.setUint32(38, 0, true); cv.setUint32(42, offset, true);
    ch.set(name, 46);
    centrals.push(ch);
    offset += lh.length + e.data.length;
  }
  const cdStart = offset;
  let cdSize = 0; for (const c of centrals) cdSize += c.length;
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, sorted.length, true); ev.setUint16(10, sorted.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, cdStart, true);
  const parts = [...locals, ...centrals, eocd];
  let total = 0; for (const p of parts) total += p.length;
  const out = new Uint8Array(total); let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

/** Parse a store-only ZIP by walking local file headers, with hostile-input caps (§36.05). */
function readZip(bytes: Uint8Array): ZipEntry[] {
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    throw new Error("arch2525: not a V2 ZIP (bad magic)");
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries: ZipEntry[] = [];
  let pos = 0, total = 0;
  while (pos + 4 <= bytes.length && dv.getUint32(pos, true) === 0x04034b50) {
    if (entries.length >= MAX_ENTRIES) throw new Error("arch2525: too many entries (zip-bomb guard)");
    const method = dv.getUint16(pos + 8, true);
    if (method !== 0) throw new Error("arch2525: only store-only entries are accepted");
    const size = dv.getUint32(pos + 22, true);
    const nameLen = dv.getUint16(pos + 26, true);
    const extraLen = dv.getUint16(pos + 28, true);
    if (size > MAX_ENTRY_BYTES) throw new Error("arch2525: entry exceeds size cap (zip-bomb guard)");
    const nameStart = pos + 30;
    const name = td.decode(bytes.subarray(nameStart, nameStart + nameLen));
    if (name.includes("..") || name.startsWith("/") || name.startsWith("\\") || name.includes("\\")) {
      throw new Error(`arch2525: unsafe entry path '${name}' (path-traversal guard)`);
    }
    const dataStart = nameStart + nameLen + extraLen;
    if (dataStart + size > bytes.length) throw new Error("arch2525: truncated entry");
    total += size;
    if (total > MAX_TOTAL_BYTES) throw new Error("arch2525: archive exceeds total size cap");
    entries.push({ path: name, data: bytes.subarray(dataStart, dataStart + size) });
    pos = dataStart + size;
  }
  if (!entries.length) throw new Error("arch2525: no entries");
  return entries;
}

/** The deterministic content-hash sequence → package_hash (never the ZIP bytes). */
function sealEntries(files: { path: string; content: unknown }[]): { normalized_path: string; content_hash: string }[] {
  return files
    .map((f) => ({ normalized_path: normalizePath(f.path), content_hash: canonicalHash(f.content) }))
    .sort((a, b) => (a.normalized_path < b.normalized_path ? -1 : a.normalized_path > b.normalized_path ? 1 : 0));
}
function normalizePath(p: string): string { return p.replace(/\\/g, "/").replace(/^\/+/, "").normalize("NFC"); }
function packageHashOf(entries: { normalized_path: string; content_hash: string }[]): string {
  return sha256Hex(entries.map((e) => `${e.normalized_path}|${e.content_hash}`).join("\n"));
}

export interface WriteOpts { nowMs?: number; localDate?: string; minReaderVersion?: number; }

/**
 * SPECS §XXI/§12 — write a V2 .arch2525 package (project + the full R-CORE chain). An injected clock
 * (nowMs) never enters the sealed content, so package_hash is time-invariant (Thor). A writer using a newer
 * feature may stamp a higher min_reader_version (§36.06); an older reader then refuses it. Returns the bytes.
 */
export function writePackageV2(project: ArchitectProject, rcore: RCore, opts?: WriteOpts): Uint8Array {
  const minReader = opts?.minReaderVersion ?? MIN_READER_VERSION;
  const manifest = { schema_version: SCHEMA_VERSION, min_reader_version: minReader };
  const sealed: { path: string; content: unknown }[] = [
    { path: "project.json", content: project },
    { path: "manifest.json", content: manifest },
    { path: "events/events.jsonl", content: rcore.events },
  ];
  for (const s of rcore.snapshots) sealed.push({ path: `snapshots/${s.revision_id}.json`, content: s });
  const entries = sealEntries(sealed);
  const package_hash = packageHashOf(entries);

  const zipEntries: ZipEntry[] = [
    { path: "project.json", data: te.encode(JSON.stringify(project)) },
    { path: "manifest.json", data: te.encode(JSON.stringify(manifest)) },
    { path: "events/events.jsonl", data: te.encode(rcore.events.map((e) => JSON.stringify(e)).join("\n")) },
    // manifest.seal.json is OUTSIDE the sealed set (it carries the hash of everything else)
    { path: "manifest.seal.json", data: te.encode(JSON.stringify({ package_hash, schema_version: SCHEMA_VERSION, min_reader_version: minReader, entries })) },
  ];
  for (const s of rcore.snapshots) zipEntries.push({ path: `snapshots/${s.revision_id}.json`, data: te.encode(JSON.stringify(s)) });
  return buildZip(zipEntries);
}

export interface ReadResult { project: ArchitectProject; rcore: RCore; package_hash: string; schema_version: number; }

/** SPECS §XXI/§36.05/§36.06 — read a V2 package. Fails CLOSED on a reseal mismatch or a too-new file. */
export function readPackageV2(bytes: Uint8Array): ReadResult {
  const entries = readZip(bytes);
  const byPath = new Map(entries.map((e) => [e.path, e.data]));
  const get = (p: string) => { const d = byPath.get(p); if (!d) throw new Error(`arch2525: missing ${p}`); return td.decode(d); };

  const manifest = safeParse(get("manifest.json")) as { schema_version: number; min_reader_version: number };
  if ((manifest.min_reader_version ?? 1) > OUR_READER_VERSION) {
    throw new Error("arch2525: file is newer than this reader — upgrade required");
  }
  const project = safeParse(get("project.json")) as ArchitectProject;
  const eventsText = get("events/events.jsonl").trim();
  const events = (eventsText ? eventsText.split("\n") : []).map((l) => safeParse(l) as RCoreEventGroup);
  const snapshots: RCoreSnapshot[] = [];
  for (const e of entries) {
    const m = e.path.match(/^snapshots\/(R\d+)\.json$/);
    if (m) snapshots.push(safeParse(td.decode(e.data)) as RCoreSnapshot);
  }
  snapshots.sort((a, b) => Number.parseInt(a.revision_id.slice(1), 10) - Number.parseInt(b.revision_id.slice(1), 10));

  // reseal verification — recompute package_hash from the sealed content and compare (fail CLOSED)
  const sealed: { path: string; content: unknown }[] = [
    { path: "project.json", content: project },
    { path: "manifest.json", content: { schema_version: manifest.schema_version, min_reader_version: manifest.min_reader_version } },
    { path: "events/events.jsonl", content: events },
  ];
  for (const s of snapshots) sealed.push({ path: `snapshots/${s.revision_id}.json`, content: s });
  const recomputed = packageHashOf(sealEntries(sealed));
  const seal = safeParse(get("manifest.seal.json")) as { package_hash: string };
  if (seal.package_hash !== recomputed) throw new Error("arch2525: package seal mismatch — refusing to open");

  return { project, rcore: { snapshots, events }, package_hash: recomputed, schema_version: manifest.schema_version };
}

/** SPECS §XXI — detect V2 (ZIP magic) vs legacy V1 single-JSON; route accordingly. */
export function readPackage(bytes: Uint8Array): ReadResult {
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return readPackageV2(bytes);
  }
  return readPackageV1(bytes);
}

/**
 * SPECS §XXI — legacy V1 single-JSON adapter. A V1 file is one project object; it opens with the same
 * hostile-safe reviver, is marked IMPORTED authority on load, and is wrapped in a minimal R-CORE (its
 * own state as the R0 snapshot). Caps apply (§36.05).
 */
export function readPackageV1(bytes: Uint8Array): ReadResult {
  if (bytes.length > MAX_ENTRY_BYTES) throw new Error("arch2525: V1 file exceeds size cap");
  const project = safeParse(td.decode(bytes)) as ArchitectProject;
  if (!project || typeof project !== "object" || !Array.isArray(project.entities)) {
    throw new Error("arch2525: V1 file is not a project");
  }
  const imported: ArchitectProject = structuredClone(project);
  for (const e of imported.entities) {
    e.evidence = { ...e.evidence, authority_state: "IMPORTED" };
  }
  const snap: RCoreSnapshot = { revision_id: imported.current_revision_id || "R0", project_hash: "", project: imported };
  snap.project_hash = canonicalHash(imported); // informational; V1 carries no chain
  return { project: imported, rcore: { snapshots: [snap], events: [] }, package_hash: "", schema_version: 0 };
}

/** SPECS §36.06 — the forward-compat migration seam: read a legacy V1 file, re-emit it as a V2 package. */
export function migrateV1toV2(v1Bytes: Uint8Array): Uint8Array {
  const r = readPackageV1(v1Bytes);
  return writePackageV2(r.project, r.rcore);
}

export { SCHEMA_VERSION, MIN_READER_VERSION, OUR_READER_VERSION, serializeCanonicalProject };
