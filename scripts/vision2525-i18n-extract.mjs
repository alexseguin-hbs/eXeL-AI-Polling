// Vision 2525 — English source-of-truth extractor (foundation for v19 translations).
//
// WHY: translation must never hand-copy the document. The living document is an
// append-only ledger replayed by a pure function; the ONLY honest source of the
// current English text is that engine's own replay(VMAX, ALL_ORDER). This script
// loads the shipped HTML, runs its replay in-page, and emits one flat map
// { blockId: html } per live block, plus a manifest (counts + per-view orders).
// The 33 per-language files carry the SAME ids; a per-language build substitutes
// the map back into the identical engine, so replay determinism is preserved and
// missing keys fall back to English (flagged, never blank) — the Divinity-Guide
// discipline, applied to the ledger document.
//
// Run from repo root:  node scripts/vision2525-i18n-extract.mjs
// (resolves playwright via scripts/node_modules -> ../frontend/node_modules symlink)
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const DOC = process.argv[2] || '/home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const OUT = '/home/user/eXeL-AI-Polling/docs/i18n';
const f = 'file://' + DOC;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage();
await p.goto(f);
await p.waitForTimeout(800);

const data = await p.evaluate(() => {
  const VMAX = (typeof VERSIONS !== 'undefined' && VERSIONS.length) || 0;
  // The full block universe, replayed fresh (bypass any memo) at the latest release.
  const all = replay(VMAX, ALL_ORDER, true);
  const en = {};
  for (const e of all) en[e.id] = e.html;
  // Per-view orders so the per-language build and the LINK-INTEGRITY gate know the
  // exact composition of each reading (a view is an order, not a template).
  const views = {
    all: ALL_ORDER.slice(),
    paper: (typeof WP_ORDER !== 'undefined' ? WP_ORDER : []).slice(),
    outline: (typeof OUTLINE_ORDER !== 'undefined' ? OUTLINE_ORDER : []).slice(),
    brief: (typeof BRIEF_ORDER !== 'undefined' ? BRIEF_ORDER : []).slice(),
    nose: (typeof NOSE_ORDER !== 'undefined' ? NOSE_ORDER : []).slice(),
    ledger: (typeof LEDGER_ORDER !== 'undefined' ? LEDGER_ORDER : []).slice(),
  };
  return { VMAX, en, ids: all.map(e => e.id), views };
});
await b.close();

mkdirSync(OUT, { recursive: true });
const ids = data.ids;
// stable, sorted-by-first-appearance order for a clean diff between releases
const enOrdered = {};
for (const id of ids) enOrdered[id] = data.en[id];
writeFileSync(`${OUT}/vision2525.en.json`, JSON.stringify(enOrdered, null, 1) + '\n');

const manifest = {
  release: data.VMAX,
  blockCount: ids.length,
  views: Object.fromEntries(Object.entries(data.views).map(([k, v]) => [k, v.length])),
  viewOrders: data.views,
  generatedFrom: 'replay(VMAX, ALL_ORDER, fresh=true)',
};
writeFileSync(`${OUT}/vision2525.manifest.json`, JSON.stringify(manifest, null, 2) + '\n');

console.log(`extracted en.json — release r${data.VMAX}, ${ids.length} blocks`);
console.log('views:', JSON.stringify(manifest.views));
