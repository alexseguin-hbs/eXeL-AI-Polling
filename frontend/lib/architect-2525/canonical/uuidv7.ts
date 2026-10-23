// SPECS / ARCHITECT-2525 §VIII(5), §26 — entity identity is UUIDv7 (time-ordered; version nibble 7).
// It survives rename/move/resize/revision/export; a future IFC GlobalId encodes the same 128 bits and
// is NOT a hyphenated UUID (22-char case-sensitive base64), so isUuidV7 gates GENERATION ONLY — it is
// never used to validate every id (Odin: that would reject an imported IFC GlobalId). The canonical
// entity_id type is therefore a generic opaque token (see types.ts), and the seed's ids are pinned
// literals (Thor: no Date.now/random in the seed path, so project_hash is deterministic).
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-schema.test.mjs

const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True only for a well-formed UUIDv7 (version nibble 7, RFC 4122 variant). Gates generation, not all ids. */
export function isUuidV7(s: unknown): boolean {
  return typeof s === "string" && UUID_V7_RE.test(s);
}

/** A non-empty opaque 128-bit-class identity token (UUIDv7 today; a future IFC GlobalId tomorrow). */
export function isEntityId(s: unknown): boolean {
  return typeof s === "string" && s.length > 0;
}

const hex = (n: number, width: number) => n.toString(16).padStart(width, "0");

/**
 * Mint a UUIDv7. PRODUCTION-ONLY entity creation path (never the seed): 48-bit Unix-ms time, version 7,
 * RFC 4122 variant, random tail. The clock and randomness are injectable so a test can mint a fixed id;
 * production passes neither. This is deliberately NOT called by buildProjectFromSeed — the seed carries
 * fixed literal ids so the R0 project_hash is reproducible (§11, Thor).
 */
export function uuidv7(unixMs?: number, rand?: () => number): string {
  const ms = Math.floor(typeof unixMs === "number" ? unixMs : Date.now());
  const rnd = typeof rand === "function" ? rand : Math.random;
  const timeHigh = Math.floor(ms / 0x10000);      // top 32 bits of the 48-bit ms
  const timeLow = ms % 0x10000;                     // low 16 bits
  const r = () => Math.floor(rnd() * 0x10000);
  // time_high(8) - time_low(4) - 7 + rand(3) - variant(8..b) + rand(3) - rand(12)
  const a = hex(timeHigh >>> 0, 8);
  const b = hex(timeLow, 4);
  const c = "7" + hex(r() & 0x0fff, 3);
  const variant = (0x8 | (r() & 0x3)).toString(16) + hex(r() & 0x0fff, 3);
  const d = hex(r(), 4) + hex(r(), 4) + hex(r(), 4);
  return `${a}-${b}-${c}-${variant}-${d}`;
}
