// r259 AR/RTL probe — geometry must mirror by measurement: marks anchor from the
// RIGHT, a tap's fraction mirrors, steppers still land on measured keyframes, and
// the four new strings arrive translated (no English chrome leak).
import { chromium } from 'playwright';
const DOC = 'file:///home/user/eXeL-AI-Polling/frontend/public/whitepaper/vision-2525.ar.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

let s = await pg.evaluate(() => {
  const dir = document.documentElement.getAttribute('dir');
  setView('paper');                                   // exit straight mode — the deck is visible in a view
  const r = document.getElementById('vTicks');
  const marks = r ? [...r.querySelectorAll('i')] : [];
  return { dir, n: marks.length, keys: keysList().length, w: r.getBoundingClientRect().width,
    rightAnchored: marks.length > 0 && marks.every(i => /right:/.test(i.getAttribute('style')) && !/left:/.test(i.getAttribute('style'))) };
});
ok(s.dir === 'rtl', 'document is rtl');
ok(s.n === s.keys && s.n > 0, `deck rail renders every keyframe (${s.n})`);
ok(s.w > 100, `rail has real geometry in a view (${Math.round(s.w)}px)`);
ok(s.rightAnchored, 'RTL marks anchor from the RIGHT (geometry mirrored by measurement)');

// tap near the physical RIGHT edge = early releases in RTL
s = await pg.evaluate(() => {
  const r = document.getElementById('vTicks');
  const rc = r.getBoundingClientRect();
  r.dispatchEvent(new PointerEvent('pointerdown', { clientX: rc.left + rc.width * 0.95, bubbles: true }));
  return { active, isKey: keysList().includes(active), vmax: VMAX };
});
ok(s.isKey && s.active < s.vmax / 4, `RTL tap near right edge lands on an EARLY keyframe (${s.active})`);
await pg.evaluate(() => goto(VMAX));

// compare: steppers translated + functional
await pg.evaluate(() => document.getElementById('bCmp').click());
s = await pg.evaluate(() => {
  const al = document.getElementById('cmpAL');
  const aria = al ? al.getAttribute('aria-label') : '';
  const sl = document.getElementById('cmpA');
  sl.value = '10'; sl.dispatchEvent(new Event('change', { bubbles: true }));
  const before = cmpA;
  document.getElementById('cmpAR').click();
  const ks = keysList();
  const expected = ks.find(v => v > before) ?? before;
  const cur = document.getElementById('cmpCur');
  return { aria, before, after: cmpA, expected,
    ariaArabic: /[؀-ۿ]/.test(aria), curTxt: cur ? cur.textContent : '(latest view — absent ok)',
    tip: document.querySelector('.sl-ticks[data-sl="cmpA"]').title, tipArabic: /[؀-ۿ]/.test(document.querySelector('.sl-ticks[data-sl="cmpA"]').title) };
});
ok(s.ariaArabic, `stepper aria arrives translated ("${s.aria.slice(0, 30)}…")`);
ok(s.tipArabic, 'rail tooltip arrives translated');
ok(s.after === s.expected, `stepper lands on the measured neighbour in AR (${s.before} → ${s.after})`);

console.log(`\nAR RTL PROBE: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
