import assert from "node:assert/strict";

/** Mirrors frontend/lib/active-input-tracker.ts for CI without a TS loader. */
function createActiveInputTracker(idleCutoffMs = 5000) {
  let activeMs = 0;
  let lastEventAt = null;
  let pasteDetected = false;
  const openedAt = Date.now();
  function noteActivity(isPaste = false) {
    const now = Date.now();
    if (isPaste) pasteDetected = true;
    if (lastEventAt != null) {
      const gap = now - lastEventAt;
      if (gap > 0 && gap <= idleCutoffMs) activeMs += gap;
    }
    lastEventAt = now;
  }
  return {
    onKey: () => noteActivity(false),
    onPaste: () => noteActivity(true),
    snapshot: () => ({
      active_ms: Math.max(0, Math.round(activeMs)),
      paste_detected: pasteDetected,
      input_opened_at: new Date(openedAt).toISOString(),
    }),
  };
}

let now = 1_000_000;
const realNow = Date.now;
Date.now = () => now;

const t = createActiveInputTracker(5_000);
t.onKey();
now += 1_000;
t.onKey();
now += 6_000; // idle > cutoff — no credit
t.onKey();
now += 500;
t.onKey();
assert.equal(t.snapshot().active_ms, 1_500);
assert.equal(t.snapshot().paste_detected, false);

const t2 = createActiveInputTracker(5_000);
t2.onPaste();
assert.equal(t2.snapshot().paste_detected, true);

Date.now = realNow;
console.log("active-input-tracker.test.mjs OK");
