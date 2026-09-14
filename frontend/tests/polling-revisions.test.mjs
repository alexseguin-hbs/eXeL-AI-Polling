// WS-D: revision-history control for polling results (operator 2026-09-14: "create revision history
// control as well"). Locks the append-only snapshot core: content-hash ids, deterministic flatten,
// append-never-edit (identical capture is a no-op), and field-level diff via the shared engine.
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/polling-revisions.test.mjs
const { snapshotResult, appendRevision, diffSnapshots, flattenResult, loadRevisions, saveRevisions } =
  await import('../lib/polling-revisions.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const info = (label, count, conf, s33, s111, s333) => ({ label, count, avgConfidence: conf, summary33: s33, summary111: s111, summary333: s333, isEmpty: count <= 0 });
const empty = { label: "", count: 0, avgConfidence: 0, summary33: "", isEmpty: true };
const lvl = (n) => Array.from({ length: n }, () => empty);
function data(riskCount, order) {
  const t1 = {
    "Risk & Concerns": info("Risk & Concerns", riskCount, 80, "risk 33", "risk 111", "risk 333"),
    "Supporting Comments": info("Supporting Comments", 30, 70, "sup 33"),
    "Neutral Comments": info("Neutral Comments", 10, 60, "neu 33"),
  };
  const t2 = {};
  for (const l of Object.keys(t1)) t2[l] = { level3: [info("sub A", 5, 50, "a"), ...lvl(2)], level6: lvl(6), level9: lvl(9) };
  return { sessionId: "s1", totalResponses: riskCount + 40, theme1: t1, theme2: t2, responses: [] };
  void order;
}

// determinism: same result → same id
const snapA = snapshotResult("s1", data(42), [{ label: "Risk & Concerns", rank: 1, score: 9 }], new Date("2026-09-14T14:30:00Z"));
const snapA2 = snapshotResult("s1", data(42), [{ label: "Risk & Concerns", rank: 1, score: 9 }], new Date("2026-09-14T15:00:00Z"));
ok(snapA.id === snapA2.id, 'same result content → same id (time is metadata, not identity)');
ok(/^[0-9a-f]{8}$/.test(snapA.id), 'id is an 8-hex content hash');

// flatten has the expected fields
const f = flattenResult(data(42), [{ label: "Risk & Concerns", rank: 1, score: 9 }]);
ok(f["Total responses"] === "82", 'flatten records total responses');
ok(f["Risk & Concerns · responses"] === "42", 'flatten records a category count');
ok(f["Risk & Concerns · 333"] === "risk 333", 'flatten records the 333 tier');
ok(f["Priority #1"] === "Risk & Concerns — score 9", 'flatten records ranked priorities');
ok(!("Neutral Comments · 111" in f), 'absent tiers are omitted (no empty-string noise)');

// append-only: identical id is a no-op; a real change grows the list; labels are v1,v2
let hist = [];
hist = appendRevision(hist, snapA);
ok(hist.length === 1 && hist[0].label.startsWith('v1'), 'first snapshot appended as v1');
hist = appendRevision(hist, snapA2); // same content id → no-op
ok(hist.length === 1, 'identical re-capture is a no-op (append never edits)');
const snapB = snapshotResult("s1", data(99), [{ label: "Supporting Comments", rank: 1, score: 12 }], new Date("2026-09-14T16:00:00Z"));
hist = appendRevision(hist, snapB);
ok(hist.length === 2 && hist[1].label.startsWith('v2'), 'a changed result appends v2');

// diff surfaces the changes
const changes = diffSnapshots(snapA, snapB);
const byKey = Object.fromEntries(changes.map((c) => [c.key, c]));
ok(byKey["Risk & Concerns · responses"].kind === 'changed' && byKey["Risk & Concerns · responses"].from === '42' && byKey["Risk & Concerns · responses"].to === '99', 'count change shows from 42 → 99');
ok(byKey["Supporting Comments · 33"].kind === 'carried', 'unchanged field is carried');
ok(changes.some((c) => c.key.startsWith('Priority #1') && c.kind === 'changed'), 'priority change is diffed');

// persistence never throws (localStorage undefined in node → [] / no-op)
saveRevisions("s1", hist);
ok(Array.isArray(loadRevisions("s1")), 'load/save are safe with no localStorage');

console.log(`polling-revisions: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
