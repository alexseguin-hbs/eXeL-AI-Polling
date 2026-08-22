// SSSES + Spiral compare battery for the living document.
// Verifies the r250 fix: deck arrows JUST navigate (no half-rendered compare state), and
// Compare opens/closes only through the single setCompare() choke point. Run from repo root.
import { chromium } from 'playwright';

const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0, passes = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };

const pg = await b.newPage({ viewport: { width: 390, height: 800 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

const VMAX = await pg.evaluate(() => VMAX);
const st = () => pg.evaluate(() => ({
  active, cmpOn, cmpshow: document.body.classList.contains('cmpshow'),
  scrimHidden: document.getElementById('cmpScrim')?.hidden,
  cmpVisible: (() => { const c = document.getElementById('cmp'); const r = c.getBoundingClientRect(); return getComputedStyle(c).display !== 'none' && r.width > 0 && r.height > 0; })(),
  cmpBars: document.querySelectorAll('#doc section.blk.cmp-add, #doc section.blk.cmp-rev').length,
  pickerA: !!document.getElementById('cmpA'), pickerB: !!document.getElementById('cmpB'),
  del: document.querySelectorAll('#cmp .df-blk del, #cmp del').length,
  ins: document.querySelectorAll('#cmp .df-blk ins, #cmp ins').length,
  none: !!document.querySelector('#cmp .none'),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}));
const click = (id) => pg.evaluate((i) => document.getElementById(i).click(), id);

// 1 · ARROWS JUST NAVIGATE — the back-arrow bug. From latest, press back.
await click('bLatest');
let s = await st();
await click('bPrev');
s = await st();
ok(s.active === VMAX - 1, `back arrow navigates (active ${s.active})`);
ok(s.cmpOn === false, 'back arrow does NOT turn compare on');
ok(s.cmpshow === false && s.cmpVisible === false, 'back arrow leaves NO compare panel/state (bug fixed)');
ok(s.cmpBars === 0, 'back arrow paints NO cmp-add/cmp-rev bars on the document');

// slider mid + next also navigate-only
await pg.evaluate(() => { const e = document.getElementById('vSlide'); e.value = '120'; e.dispatchEvent(new Event('input', { bubbles: true })); });
s = await st();
ok(s.active === 120 && !s.cmpOn && !s.cmpshow, 'slider navigates only (no compare)');

// 2 · Compare opens ONLY via the button, through setCompare
await click('bLatest');
await click('bCmp');
s = await st();
ok(s.cmpOn && s.cmpshow && !s.scrimHidden && s.cmpVisible, 'bCmp opens modal (cmpOn+cmpshow+scrim+visible in lockstep)');
ok(s.pickerA && s.pickerB, 'Baseline + Target pickers present');
ok((s.del > 0 && s.ins > 0) || s.none, 'default shows red/green OR the ledger-highlight empty state');

// 3 · Pick an arbitrary pair — modal stays open, diff renders
await pg.evaluate(() => { const e = document.getElementById('cmpA'); e.value = '50'; e.dispatchEvent(new Event('change', { bubbles: true })); });
s = await st();
ok(s.cmpshow && s.del > 0 && s.ins > 0, `arbitrary Baseline=50 renders red/green, modal stays open (del ${s.del} ins ${s.ins})`);

// 4 · 375px: no horizontal overflow while modal open
ok(s.overflow <= 0, `375px: no horizontal overflow (overflow ${s.overflow}px)`);

// 5 · Close paths — ESC, scrim, X
await pg.keyboard.press('Escape');
s = await st();
ok(!s.cmpOn && !s.cmpshow && s.scrimHidden, 'ESC closes modal + scrim');
await click('bCmp');
await pg.evaluate(() => document.getElementById('cmpScrim').click());
s = await st();
ok(!s.cmpOn && !s.cmpshow, 'scrim click closes modal');
await click('bCmp');
await pg.evaluate(() => document.getElementById('cmpClose').click());
s = await st();
ok(!s.cmpOn && !s.cmpshow, 'close (X) button closes modal');

console.log(`\nBATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails === 0 ? 0 : 1);
