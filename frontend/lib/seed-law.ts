/**
 * THE SEED LAW — one merge law for every seeded list (extracted from lib/innovation-data.ts in Financial-2525 r.005 so a
 * light surface can reuse it without importing the 386 KB portfolio; innovation-data re-exports these with its own
 * project defaults, so nothing that imported them there changes).
 *
 * "A SEED REACHES EVERY DEVICE, AND THE ADMIN PANEL WITH IT" (operator 2026-09-24): anything seeded in the code is
 * MERGED into every saved copy — local mirror and cloud — never replaced by it, and a deliberate removal leaves a
 * tombstone a deploy never undoes. Per seed field, on every hydration: missing on the row → take the seed; the row still
 * equals its last seed fingerprint and the seed moved → take the seed (a person never touched it); otherwise the row
 * wins (a person edited it). The fingerprint (`_seed`) travels INSIDE the row, so it reaches the local mirror and the
 * cloud jsonb alike — no migration. Rows saved before the law carry no fingerprint: a value equal to a DECLARED former
 * seed value (a `superseded` list, append-only) is stale seed and refreshes; anything else is treated as a person's,
 * kept, and fingerprinted from here on. Pure; no I/O.
 */
export interface SeedSuperseded { key: string; field: string; was?: unknown; wasLike?: RegExp; rev: string }
export const SEED_STAMP = "_seed" as const;
const stableJson = (v: unknown): string =>
  JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, (x as Record<string, unknown>)[k]])) : x)) ?? "undefined";
/** FNV-1a 32-bit over the key-sorted JSON — a fingerprint, not a secret; 8 hex chars per field keeps a row small. */
export const seedFingerprint = (v: unknown): string => {
  let h = 0x811c9dc5; const s = stableJson(v);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
};
/** Reconcile ONE saved row against its seed (see the law above). Returns the SAME object when nothing changes. */
export function reconcileSeedRow<T extends object>(saved: T, seed: T, key: string, superseded: readonly SeedSuperseded[] = []): T {
  const row = saved as Record<string, unknown>;
  const base = (row[SEED_STAMP] && typeof row[SEED_STAMP] === "object" ? row[SEED_STAMP] : {}) as Record<string, string>;
  const next: Record<string, unknown> = { ...row };
  const stamp: Record<string, string> = { ...base };
  let changed = false;
  for (const [k, seedVal] of Object.entries(seed as Record<string, unknown>)) {
    if (k === SEED_STAMP || seedVal === undefined) continue;
    const seedFp = seedFingerprint(seedVal);
    const has = Object.prototype.hasOwnProperty.call(row, k) && row[k] !== undefined;
    const rowFp = has ? seedFingerprint(row[k]) : "";
    let take = false;
    if (!has) take = true;                                                              // the seed added a field this row never had
    else if (base[k] !== undefined) take = rowFp === base[k] && seedFp !== base[k];      // untouched by a person, and the seed moved
    else if (rowFp !== seedFp) take = superseded.some((s) => s.key === key && s.field === k && (s.wasLike ? typeof row[k] === "string" && s.wasLike.test(row[k] as string) : seedFingerprint(s.was) === rowFp)); // pre-law row: a declared former seed value
    if (take && rowFp !== seedFp) { next[k] = seedVal; changed = true; }
    if (stamp[k] !== seedFp) { stamp[k] = seedFp; changed = true; }
  }
  if (!changed) return saved;
  next[SEED_STAMP] = stamp;
  return next as T;
}
/** The one merge law behind projects, master data, pillars and the planet LTU table: append the seed rows the saved
 *  list lacks (by key), RECONCILE the rows it has (a changed seed field reaches an untouched row; an edited field stays),
 *  keep the saved order, skip keys a person removed on purpose. Returns the SAME array when nothing changes, so a React
 *  state set is a no-op. */
export function mergeMissingBy<T>(saved: T[], seeds: readonly T[], keyOf: (x: T) => string, removed: readonly string[] = [], superseded: readonly SeedSuperseded[] = []): T[] {
  const gone = new Set(removed);
  const byKey = new Map(seeds.map((s) => [keyOf(s), s]));
  let changed = false;
  const kept = saved.map((row) => {
    const s = byKey.get(keyOf(row));
    if (!s || typeof row !== "object" || row === null) return row;
    const r = reconcileSeedRow(row as object, s as object, keyOf(row), superseded) as T;
    if (r !== row) changed = true;
    return r;
  });
  const have = new Set(saved.map(keyOf));
  const add = seeds.filter((x) => !have.has(keyOf(x)) && !gone.has(keyOf(x)));
  if (!add.length && !changed) return saved;
  // a row added from the seed is fingerprinted at birth, so the NEXT seed change reaches it too
  return [...kept, ...add.map((x) => (typeof x === "object" && x !== null ? (reconcileSeedRow({} as object, x as object, keyOf(x), superseded) as T) : x))];
}
