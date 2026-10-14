# T2 + outbox — red-first (2026-10-14)

`tests/response-outbox.test.mjs` run against the UNCHANGED send path. The module's own 22 assertions pass;
the four source-level assertions — the ones that say the three Trinity paths must not be fire-and-forget —
fail. A gate that cannot fail is not a gate.

```
FAIL: NO path swallows its outcome with .catch(() => {}) — §5, nothing is swallowed
FAIL: NO path swallows its outcome with .then(noop, noop)
FAIL: the three paths are awaited together so the page knows whether ANY carried it
FAIL: a response that no path carried is handed to the device outbox

response-outbox: 22 passed, 4 failed · a completed response is never discarded
```
