/**
 * Provider fee catalog panel loader — server vs offline; never unknown→0.
 * Run: node --experimental-loader=./tests/resolve-ts-imports.mjs --experimental-strip-types tests/provider-fee-catalog.test.mjs
 */
const {
  buildComboRows,
  rowsFromServerPayload,
  loadFeeCatalogForPanel,
  STT_RATES,
  COST_ASSUMPTIONS,
} = await import('../lib/provider-fee-catalog.ts');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const offline = buildComboRows('2026-04-01T00:00:00Z', 'offline_local');
ok(offline.rows.every((r) => r.source === 'offline_local'), 'offline source labeled');
const azure = offline.rows.find((r) => r.v2t === 'azure');
ok(azure && azure.v2tUsd === null && azure.totalUsd === null, 'azure unknown stays null not 0');
ok(STT_RATES.azure === undefined, 'azure omitted from STT_RATES');
ok(COST_ASSUMPTIONS.sttDenominator === 'billable_audio_minutes', 'denominator billable audio');

const whisper = offline.rows.find((r) => r.summary === 'openai' && r.v2t === 'whisper');
ok(whisper && whisper.totalUsd === 2.55, `openai+whisper heritage total got ${whisper?.totalUsd}`);

const mapped = rowsFromServerPayload({
  catalog_version: 'srv-1',
  freshness: { checked_at: '2026-11-08T00:00:00Z', stale: false, catalog_version: 'srv-1' },
  combos: [
    { summary_provider: 'openai', v2t_provider: 'whisper', label: 'OpenAI + Whisper', is_default: true, summary_usd: '0.33', v2t_usd: '2.22', total_usd: '2.55', v2t_verification: 'estimated_from_catalog' },
    { summary_provider: 'claude', v2t_provider: 'azure', label: 'Claude + Azure', is_default: false, summary_usd: '7.87', v2t_usd: null, total_usd: null, v2t_verification: 'unknown_rate' },
  ],
  invoice_accurate: false,
});
ok(mapped && mapped.rows[0].source === 'server', 'server source');
ok(mapped.rows[1].v2tUsd === null && mapped.rows[1].v2tStatus === 'unknown_rate', 'server unknown not zero');

const offlineLoad = await loadFeeCatalogForPanel({ mockMode: true });
ok(offlineLoad.status === 'offline', 'mockMode → offline');
ok(offlineLoad.invoiceAccurate === false, 'never invoice accurate in mock');

const unavailable = await loadFeeCatalogForPanel({
  mockMode: false,
  apiBase: 'http://example.test/api/v1',
  fetchImpl: async () => ({ ok: false, status: 503, headers: { get: () => 'application/json' }, json: async () => ({}) }),
});
ok(unavailable.status === 'unavailable', 'HTTP error → unavailable');
ok(unavailable.rows.some((r) => r.source === 'offline_local'), 'retains labeled offline estimates');

const badShape = await loadFeeCatalogForPanel({
  mockMode: false,
  apiBase: 'http://example.test/api/v1',
  fetchImpl: async () => ({ ok: true, headers: { get: () => 'text/html' }, json: async () => ('<html/>') }),
});
ok(badShape.status === 'bad_shape', 'non-JSON → bad_shape');

const okSrv = await loadFeeCatalogForPanel({
  mockMode: false,
  apiBase: 'http://example.test/api/v1',
  fetchImpl: async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({
      catalog_version: 'srv-1',
      freshness: { checked_at: '2026-11-08T00:00:00Z', stale: false, catalog_version: 'srv-1' },
      combos: [
        { summary_provider: 'openai', v2t_provider: 'whisper', label: 'OpenAI + Whisper', is_default: true, summary_usd: '0.33', v2t_usd: '2.22', total_usd: '2.55', v2t_verification: 'estimated_from_catalog' },
      ],
      invoice_accurate: false,
    }),
  }),
});
ok(okSrv.status === 'server_ok', 'server_ok');
ok(okSrv.rows[0].source === 'server', 'rows from server');

console.log(`provider-fee-catalog: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
