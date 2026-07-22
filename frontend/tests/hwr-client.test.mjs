// HWR client-rotor (Tier 1) pure lock — batching, dedup, size/time flush, face spread.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/hwr-client.test.mjs
import { HwrClient, clientFace, contentKey, FACES } from "../lib/hwr-client.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── size flush: 500 default; here maxBatch 10 ──
let flushes = [];
const c = new HwrClient({ maxBatch: 10, dedupKey: "id", onFlush: (b) => flushes.push(b) });
for (let i = 0; i < 10; i++) c.add({ id: i, v: i });
ok(flushes.length === 1 && flushes[0].length === 10, "flushes ONE batch of 10 at the size threshold");
ok(c.size() === 0, "buffer cleared after flush");

// ── dedup: same id dropped ──
flushes = [];
const d = new HwrClient({ maxBatch: 100, dedupKey: "id", onFlush: (b) => flushes.push(b) });
ok(d.add({ id: 1 }) === true, "first id accepted");
ok(d.add({ id: 1 }) === false, "duplicate id dropped (client seenIds)");
ok(d.size() === 1, "only one buffered after a duplicate");

// ── content-fingerprint dedup when no dedupKey ──
const e = new HwrClient({ maxBatch: 100, onFlush: () => {} });
e.add({ a: 1, b: 2 });
ok(e.add({ b: 2, a: 1 }) === false, "content fingerprint dedups regardless of key order");
ok(contentKey({ b: 2, a: 1 }) === contentKey({ a: 1, b: 2 }), "contentKey is order-independent");

// ── time flush: only fires once maxWaitMs elapsed ──
flushes = [];
const t = new HwrClient({ maxBatch: 100, maxWaitMs: 2000, dedupKey: "id", onFlush: (b) => flushes.push(b) });
t.add({ id: 1 }, 1000);
t.maybeFlushByTime(2500); // 1500ms elapsed < 2000 → no flush
ok(flushes.length === 0, "no time flush before maxWaitMs");
t.maybeFlushByTime(3000); // 2000ms elapsed → flush
ok(flushes.length === 1 && flushes[0].length === 1, "time flush fires at maxWaitMs");

// ── manual flush of a partial batch ──
flushes = [];
const m = new HwrClient({ maxBatch: 100, dedupKey: "id", onFlush: (b) => flushes.push(b) });
m.add({ id: 1 }); m.add({ id: 2 });
m.flush();
ok(flushes.length === 1 && flushes[0].length === 2, "manual flush emits the partial batch");
m.flush();
ok(flushes.length === 1, "flushing an empty buffer is a no-op");

// ── clientFace: deterministic, in 0..5, reasonably spread ──
let bad = 0; const counts = new Array(FACES).fill(0);
for (let i = 0; i < 6000; i++) { const f = clientFace("cube1", i); if (f < 0 || f >= FACES) bad++; counts[f]++; }
ok(bad === 0, "clientFace always in 0..5");
ok(clientFace("k", 7) === clientFace("k", 7), "clientFace deterministic");
ok(Math.min(...counts) / Math.max(...counts) >= 0.85, `clientFace spreads evenly (${counts})`);

console.log(`\nHWR-CLIENT ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
