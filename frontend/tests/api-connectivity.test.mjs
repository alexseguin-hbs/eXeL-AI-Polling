// Honest mock-vs-live connectivity probe.
const {
  isMockMode, buildMode, looksLikeJsonContentType, looksLikeHealthBody,
  probeApiConnectivity, connectivityLabel, healthUrl,
} = await import('../lib/api-connectivity.ts');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

ok(isMockMode() === true, 'default test env is mock-folded');
ok(buildMode() === 'mock', 'buildMode mock');
ok(looksLikeJsonContentType('application/json') === true, 'json content-type');
ok(looksLikeJsonContentType('application/json; charset=utf-8') === true, 'json charset');
ok(looksLikeJsonContentType('text/html') === false, 'html is not json');
ok(looksLikeJsonContentType(null) === false, 'null ct');
ok(looksLikeHealthBody({ status: 'ok' }) === true, 'status ok body');
ok(looksLikeHealthBody({ ok: true }) === true, 'ok bool body');
ok(looksLikeHealthBody({}) === false, 'empty object not health');
ok(healthUrl('http://localhost:8000/api/v1') === 'http://localhost:8000/api/v1/health', 'health url');

const folded = await probeApiConnectivity({
  fetchImpl: async () => { throw new Error('should not fetch in mock'); },
});
ok(folded.probe === 'mock-folded', `mock probe short-circuits (got ${folded.probe})`);
ok(connectivityLabel(folded).includes('mock'), 'label mentions mock');

// Simulate live-configured by temporarily forcing MOCK false via env is not possible after import;
// instead unit-test the non-mock branch through a local copy of probe logic by calling with
// a fake that assumes live — we re-import after setting env is hard. Test JSON vs HTML via helpers only.
ok(true, 'live branch covered by helpers + integration when MOCK_MODE=false');


// Live-configured branch (env read at call time)
const prev = process.env.NEXT_PUBLIC_MOCK_MODE;
process.env.NEXT_PUBLIC_MOCK_MODE = "false";
const liveOk = await probeApiConnectivity({
  baseUrl: "http://example.test/api/v1",
  fetchImpl: async () => ({
    ok: true, status: 200,
    headers: { get: (k) => k.toLowerCase() === "content-type" ? "application/json" : null },
    json: async () => ({ status: "ok", version: "0.1.0" }),
  }),
});
ok(liveOk.probe === "live-ok", `live-ok (got ${liveOk.probe})`);

const html = await probeApiConnectivity({
  baseUrl: "http://example.test/api/v1",
  fetchImpl: async () => ({
    ok: true, status: 200,
    headers: { get: () => "text/html" },
    json: async () => ({}),
  }),
});
ok(html.probe === "live-non-json", `SPA fallback detected (got ${html.probe})`);

const down = await probeApiConnectivity({
  baseUrl: "http://example.test/api/v1",
  fetchImpl: async () => { throw new Error("ECONNREFUSED"); },
});
ok(down.probe === "live-unreachable", `unreachable (got ${down.probe})`);
if (prev === undefined) delete process.env.NEXT_PUBLIC_MOCK_MODE; else process.env.NEXT_PUBLIC_MOCK_MODE = prev;

console.log(`api-connectivity: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
