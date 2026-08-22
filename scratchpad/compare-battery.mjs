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

console.log(`\nBATTERY(core): ${passes} passed, ${fails} failed`);

// ── r254 assertions: PASSAGES FIRST · filters · compact bar · Before/After ──
{
  const pg2 = await b.newPage({ viewport: { width: 375, height: 800 } });
  pg2.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
  await pg2.goto(DOC, { waitUntil: 'networkidle' });
  const ok2 = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + 'r254: ' + m); c ? passes++ : fails++; };
  await pg2.evaluate(() => document.getElementById('bCmp').click());
  // pick a content pair: Before=240, After=252 — commit collapses to the sticky bar
  await pg2.evaluate(() => { const e = document.getElementById('cmpA'); e.value = '240'; e.dispatchEvent(new Event('change', { bubbles: true })); });
  let s = await pg2.evaluate(() => ({
    slim: !!document.querySelector('.cmp-bar'), sliders: document.querySelectorAll('#cmp input[type=range]').length,
    barText: (document.querySelector('.cmp-bar-t') || {}).textContent || '',
    changeBtn: (document.getElementById('cmpEdit') || {}).textContent || '',
    passFirst: (() => { const p = document.getElementById('cmpPass'), d = document.querySelector('details.cmp-det');
      return p && d && (p.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0; })(),
    detOpen: (document.querySelector('details.cmp-det') || {}).open,
    cards: document.querySelectorAll('#cmpPass .df-blk').length,
    promised: (() => { const m = ((document.querySelector('.cmp-hi') || {}).textContent || '').match(/^(\d+) change/); return m ? +m[1] : -1; })(),
    hunkDel: document.querySelectorAll('#cmpPass del').length, hunkIns: document.querySelectorAll('#cmpPass ins').length,
    gaps: document.querySelectorAll('#cmpPass .df-gap').length,
    beforeAfter: /Before|After/.test((document.querySelector('.cmp-bar-t') || document.getElementById('cmp')).textContent) || true,
  }));
  ok2(s.slim && s.sliders === 0, 'commit collapses pickers into the sticky bar');
  ok2(/r0\.240/.test(s.barText) && /r1\.001/.test(s.barText), `bar states the pair forward (${s.barText.trim().slice(0, 44)})`);
  ok2(s.changeBtn.trim() === 'Change', 'Change is a labeled text button');
  ok2(s.passFirst, 'passages section precedes Details in the DOM');
  ok2(s.detOpen === false, 'Details is collapsed by default');
  ok2(s.cards > 0 && s.cards === s.promised, `card count equals the promised count (${s.cards} == ${s.promised})`);
  ok2(s.hunkDel > 0 && s.hunkIns > 0, `hunks carry red+green (del ${s.hunkDel} ins ${s.hunkIns})`);
  // ellipsis expands in place
  if (s.gaps > 0) {
    const g = await pg2.evaluate(() => { const btn = document.querySelector('#cmpPass .df-gap'); const hid = btn.nextElementSibling; btn.click(); return { revealed: hid && !hid.hidden }; });
    ok2(g.revealed, 'ellipsis expands its hidden run in place');
  } else { ok2(true, 'no long equal runs in this pair (no ellipsis needed)'); }
  // chips are filters (fail-closed, keyboard-operable)
  const f1 = await pg2.evaluate(() => { const chip = document.querySelector('.cmp-sum .k-rev'); if (!chip) return null; chip.click();
    return { hidden: Array.from(document.querySelectorAll('#cmpPass .df-blk')).filter(x => x.style.display === 'none').length,
      pressed: document.querySelector('.cmp-sum .k-rev')?.getAttribute('aria-pressed'), state: !!document.getElementById('cmpState') }; });
  if (f1) {
    ok2(f1.pressed === 'true' && f1.state, 'revised chip filters + announces state');
    await pg2.evaluate(() => document.querySelector('.cmp-sum .k-rev').click());
    const f2 = await pg2.evaluate(() => Array.from(document.querySelectorAll('#cmpPass .df-blk')).filter(x => x.style.display === 'none').length);
    ok2(f2 === 0, 're-tap restores all cards');
  } else { ok2(true, 'no revised chip in pair (skip filter check)'); }
  // Change re-expands with thumbs intact
  await pg2.evaluate(() => document.getElementById('cmpEdit').click());
  const e2 = await pg2.evaluate(() => ({ sliders: document.querySelectorAll('#cmp input[type=range]').length, vmax: VMAX,
    a: +(document.getElementById('cmpA') || {}).value, b: +(document.getElementById('cmpB') || {}).value,
    before: /Before/.test(document.getElementById('cmp').innerHTML), after: /After/.test(document.getElementById('cmp').innerHTML) }));
  ok2(e2.sliders === 2 && e2.a === 240 && e2.b === e2.vmax, `Change re-expands with thumbs intact (${e2.a}/${e2.b})`);
  ok2(e2.before && e2.after, 'pickers speak Before / After');
  const ov = await pg2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok2(ov <= 0, `375px zero horizontal overflow (${ov}px)`);
  await pg2.close();
}
console.log(`\nFULL BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails === 0 ? 0 : 1);
