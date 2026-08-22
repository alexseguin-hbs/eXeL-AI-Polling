// r267 battery — KEY IMPROVEMENTS FIRST + tap-to-jump-and-highlight.
// Key improvements lead the compare panel (before the passages); tapping a row jumps to
// that section in the reading and highlights it; the full table stays in Details.
// Run: node r267-battery.mjs [url]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

await pg.evaluate(() => setCompare(true, 141, 262));   // well-changed pair, unified default

// ── 1 · Key Improvements lead the panel (before the passages) ──
let s = await pg.evaluate(() => {
  const cmp = document.getElementById('cmp');
  const top = cmp.querySelector('.cmp-top'), pass = document.getElementById('cmpPass');
  const before = top && pass && (top.compareDocumentPosition(pass) & Node.DOCUMENT_POSITION_FOLLOWING);
  return { hasTop: !!top, hasPass: !!pass, before: !!before, rows: top ? top.querySelectorAll('li.xref').length : 0 };
});
ok(s.hasTop && s.hasPass, 'compare shows both Key improvements and the passages');
ok(s.before, 'Key Improvements appear BEFORE the passages (first content after selection)');
ok(s.rows > 0, `Key Improvements list is populated (${s.rows} ranked rows)`);

// ── 2 · Details holds the full table, NOT a duplicate Key-improvements list ──
s = await pg.evaluate(() => {
  const det = document.querySelector('#cmp details.cmp-det');
  return { hasDet: !!det, dupKeyimp: det ? !!det.querySelector('.cmp-top') : true, hasTable: det ? !!det.querySelector('table') : false };
});
ok(s.hasDet && !s.dupKeyimp && s.hasTable, 'Details holds the full per-block table and no duplicate Key-improvements list');

// ── 3 · tap a Key-improvement row → jumps to + highlights that section in the reading ──
s = await pg.evaluate(() => {
  const row = document.querySelector('.cmp-top li.xref[data-id]');
  const id = row.getAttribute('data-id');
  row.click();
  const target = document.querySelector('#cmpPass .df-blk[data-id="' + id + '"], #cmpPass .dd-sec[data-id="' + id + '"]');
  const cur = document.querySelector('#cmpPass .df-cur');
  return { id, hit: !!target, highlighted: target ? target.classList.contains('df-cur') : false,
    single: document.querySelectorAll('#cmpPass .df-cur').length, curIsTarget: cur === target,
    bg: target ? getComputedStyle(target).backgroundColor : '' };
});
ok(s.hit && s.highlighted, `tapping a Key-improvement highlights its section in the reading (${s.id})`);
ok(s.single === 1 && s.curIsTarget, 'exactly one section is marked current (the tapped one)');
ok(s.bg && s.bg !== 'rgba(0, 0, 0, 0)', `the jumped section carries a highlight background ("${s.bg}")`);

// ── 4 · a Key-improvement beyond the Show-all fold still lands (fold opens, then jump) ──
s = await pg.evaluate(() => {
  // pick the LAST ranked improvement (most likely lower down / possibly folded)
  const rows = document.querySelectorAll('.cmp-top li.xref[data-id]');
  const row = rows[rows.length - 1];
  const id = row.getAttribute('data-id');
  row.click();
  const target = document.querySelector('#cmpPass .df-blk[data-id="' + id + '"], #cmpPass .dd-sec[data-id="' + id + '"]');
  return { id, landed: target ? target.classList.contains('df-cur') : false };
});
ok(s.landed, `a lower-ranked Key-improvement still lands and highlights (${s.id}) — fold opens as needed`);

await pg.evaluate(() => setCompare(false));
console.log(`\nR267 BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
