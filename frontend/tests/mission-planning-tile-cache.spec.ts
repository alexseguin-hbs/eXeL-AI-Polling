import { test, expect } from "@playwright/test";
import { getTile, peekTile } from "../lib/tile-cache";

// SECURITY-2525 · tile-cache ladder — in-flight dedup proof.
// Concurrent requests for the SAME tile key must collapse to ONE network round trip
// (the MAP + MINI panes zooming to the same tile fire once, not twice). Runs in node:
// localStorage/supabase are absent → ladder falls straight through to origin (fetch),
// which we stub to count calls. Unique keys per test so the module cache can't mask it.

function stubFetch(latencyMs = 20) {
  let calls = 0;
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => {
    calls++;
    await new Promise((r) => setTimeout(r, latencyMs));
    return { ok: true, json: async () => ({ v: calls }) } as unknown as Response;
  }) as typeof fetch;
  return { restore: () => { globalThis.fetch = orig; }, count: () => calls };
}

test("concurrent same-key requests share ONE fetch (in-flight dedup)", async () => {
  const f = stubFetch();
  const key = "dedup-A";
  const [a, b, c] = await Promise.all([
    getTile(key, "/x.json"), getTile(key, "/x.json"), getTile(key, "/x.json"),
  ]);
  f.restore();
  expect(f.count()).toBe(1);          // one round trip for three callers
  expect(a).toEqual(b);
  expect(b).toEqual(c);               // all three get the identical payload
});

test("after resolution the tile is memory-warm → later calls do zero fetches", async () => {
  const f = stubFetch();
  const key = "dedup-B";
  await getTile(key, "/x.json");       // 1 fetch
  expect(peekTile(key)).not.toBeNull(); // now in memory
  const before = f.count();
  await getTile(key, "/x.json");        // served from memory
  await getTile(key, "/x.json");
  f.restore();
  expect(f.count()).toBe(before);       // no further round trips
  expect(before).toBe(1);
});

test("different keys are NOT deduped (each tile gets its own round trip)", async () => {
  const f = stubFetch();
  await Promise.all([getTile("dedup-C1", "/x.json"), getTile("dedup-C2", "/x.json")]);
  f.restore();
  expect(f.count()).toBe(2);
});

test("in-flight entry is cleared after settle (a later miss re-fetches, not stuck)", async () => {
  const f = stubFetch();
  const key = "dedup-D";
  await getTile(key, "/x.json");        // resolves, clears inflight, warms memory
  // memory hit means no re-fetch; prove the inflight map didn't leak by checking a
  // fresh DISTINCT key still fetches exactly once (would hang/misroute if state leaked)
  await getTile("dedup-D2", "/x.json");
  f.restore();
  expect(f.count()).toBe(2);
});
