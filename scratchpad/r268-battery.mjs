// r268 battery — SLIDER GUARDRAIL: After (bottom) can never sit at or left of Before (top).
// After >= Before + 1, enforced live (drag) and on commit; Before capped at VMAX-1.
// Run: node r268-battery.mjs [url]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

// After's floor initialises to Before+1
let s = await pg.evaluate(() => { setCompare(true, 123, 200);
  return { bmin: document.getElementById('cmpB').min, amax: document.getElementById('cmpA').max, vmax: VMAX }; });
ok(s.bmin === '124', `After slider floor = Before+1 (min=${s.bmin} for Before r123)`);
ok(Number(s.amax) === s.vmax - 1, `Before slider capped at VMAX-1 (max=${s.amax}, VMAX=${s.vmax})`);

// dragging After left of Before clamps the live preview
s = await pg.evaluate(() => { setCompare(true, 123, 200);
  const B = document.getElementById('cmpB'); B.value = '100'; B.dispatchEvent(new Event('input', { bubbles: true }));
  return B.value; });
ok(s === '124', `dragging After below Before clamps the preview to Before+1 (${s})`);

// committing After below Before never inverts the pair
s = await pg.evaluate(() => { setCompare(true, 123, 200);
  const B = document.getElementById('cmpB'); B.value = '100'; B.dispatchEvent(new Event('change', { bubbles: true }));
  return [cmpA, cmpB]; });
ok(s[0] === 123 && s[1] === 124, `committing After<Before clamps to Before+1 (${s[0]} → ${s[1]})`);

// raising Before to/past After pushes After up
s = await pg.evaluate(() => { setCompare(true, 123, 200);
  const A = document.getElementById('cmpA'); A.value = '250'; A.dispatchEvent(new Event('change', { bubbles: true }));
  return [cmpA, cmpB]; });
ok(s[0] === 250 && s[1] === 251, `raising Before past After pushes After up (${s[0]} → ${s[1]})`);

// Before cannot reach VMAX (After must remain strictly greater)
s = await pg.evaluate(() => { setCompare(true, 123, 200);
  const A = document.getElementById('cmpA'); A.value = String(VMAX); A.dispatchEvent(new Event('change', { bubbles: true }));
  return [cmpA, cmpB, VMAX]; });
ok(s[0] === s[2] - 1 && s[1] === s[2], `Before caps at VMAX-1 with After=VMAX (${s[0]} → ${s[1]}, VMAX ${s[2]})`);

// the invariant holds for a spread of committed pairs
s = await pg.evaluate(() => {
  const bad = [];
  for (const [a, t] of [[1, 2], [50, 51], [100, 260], [266, 267]]) {
    setCompare(true, a, t);
    if (!(cmpA < cmpB)) bad.push(a + '/' + t + '→' + cmpA + '/' + cmpB);
  }
  setCompare(false);
  return bad;
});
ok(s.length === 0, `After > Before holds across sampled pairs (${s.length ? s.join(',') : 'all valid'})`);

// r270 · default pair = the WHOLE evolution: Before far-LEFT (r0.001), After far-RIGHT (latest)
s = await pg.evaluate(() => { document.getElementById('bCmp').click();
  const A = document.getElementById('cmpA'), B = document.getElementById('cmpB');
  const o = { a: +A.value, b: +B.value, vmax: VMAX,
    aLeft: (A.value - A.min) / (A.max - A.min) < 0.05,
    bRight: (B.value - B.min) / (B.max - B.min) > 0.95,
    degen: (A.max === A.min || B.max === B.min) };
  setCompare(false); return o; });
ok(s.a === 1 && s.b === s.vmax, `default pair is r0.001 -> latest (Before ${s.a}, After ${s.b})`);
ok(s.aLeft && s.bRight, 'default: top slider far-LEFT, bottom slider far-RIGHT');
ok(!s.degen, 'no degenerate (single-point) slider at the default');

console.log(`\nR268 BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
