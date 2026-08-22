// r259 battery — TICKS + STEPPERS + ONE-TAP CURRENT: measured keyframes on all 3
// sliders · steppers land only on measured changes · no snap on drag · rail tap =
// replay · "this view vs current" · RTL geometry. Run: node r259-battery.mjs [docUrl]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

// ── 1 · KEYS are MEASURED: sampled key byte-differs; sampled non-key does not ──
let s = await pg.evaluate(() => {
  const ks = keysList();
  const inRange = ks.every(v => v >= 2 && v <= VMAX);
  // sampled key: at least one of its ledger writes byte-changed the record
  const kv = ks[Math.floor(ks.length / 2)];
  let real = false;
  for (const e of LEDGER) if (e.v === kv && enHtmlAt(e.id, kv) !== enHtmlAt(e.id, kv - 1)) real = true;
  // sampled non-key: NO ledger write changed the record
  let nonkey = 0, clean = true;
  for (let v = 2; v <= VMAX && !nonkey; v++) if (!ks.includes(v)) nonkey = v;
  if (nonkey) for (const e of LEDGER) if (e.v === nonkey && enHtmlAt(e.id, nonkey) !== enHtmlAt(e.id, nonkey - 1)) clean = false;
  return { n: ks.length, inRange, kv, real, nonkey, clean, vmax: VMAX };
});
ok(s.n > 0 && s.n < s.vmax, `KEYS measured and non-trivial (${s.n} of ${s.vmax} releases changed content)`);
ok(s.inRange, 'all keys within [2, VMAX]');
ok(s.real, `sampled key ${s.kv}: record byte-changed vs ${s.kv - 1}`);
ok(!s.nonkey || s.clean, `sampled non-key ${s.nonkey}: zero record byte-change (record-only release)`);

// ── 2 · deck rail is GONE in reading mode (r265: "there should be no blur") ──
s = await pg.evaluate(() => {
  setView('paper');                                   // reading mode, deck slider visible
  const r = document.getElementById('vTicks');
  const vis = r ? getComputedStyle(r).display !== 'none' : false;
  const marksVisible = r ? [...r.querySelectorAll('i')].some(i => i.getClientRects().length > 0) : false;
  const sliderThere = !!document.getElementById('vSlide') &&
    document.querySelector('.deck-in > .slwrap').getBoundingClientRect().width > 100;
  return { vis, marksVisible, sliderThere };
});
ok(!s.vis && !s.marksVisible, 'deck keyframe rail is hidden in reading mode — no marks, no blur');
ok(s.sliderThere, 'the version slider itself still renders (only the tick rail is gone)');

// ── 3 · the deck still navigates: slider drag moves the release ──
s = await pg.evaluate(() => {
  const sl = document.getElementById('vSlide');
  sl.value = '120'; sl.dispatchEvent(new Event('input', { bubbles: true }));
  const at120 = active;
  goto(VMAX);
  return { at120 };
});
ok(s.at120 === 120, `deck slider still navigates (drag → r${s.at120})`);
await pg.evaluate(() => goto(VMAX));

// ── 4 · deck budget still holds ──
s = await pg.evaluate(() => document.querySelector('.deck').getBoundingClientRect().height);
ok(s <= 160, `deck height within the 160px budget (${Math.round(s)}px)`);

// ── 5 · compare: rails under BOTH pickers, steppers flank, counts match the deck ──
await pg.evaluate(() => document.getElementById('bCmp').click());
s = await pg.evaluate(() => ({
  ra: !!document.querySelector('.sl-ticks[data-sl="cmpA"]'),
  rb: !!document.querySelector('.sl-ticks[data-sl="cmpB"]'),
  na: document.querySelectorAll('.sl-ticks[data-sl="cmpA"] i').length,
  nb: document.querySelectorAll('.sl-ticks[data-sl="cmpB"] i').length,
  deck: keysList().length,
  steps: ['cmpAL', 'cmpAR', 'cmpBL', 'cmpBR'].map(id => !!document.getElementById(id)),
}));
ok(s.ra && s.rb, 'both compare pickers carry tick rails');
ok(s.na === s.deck && s.nb === s.deck, `compare rails mirror the deck keyframes (${s.na}/${s.nb} = ${s.deck})`);
ok(s.steps.every(Boolean), 'all four change steppers render');

// ── 6 · steppers land ONLY on measured changes; ends disable instead of lying ──
s = await pg.evaluate(() => {
  const ks = keysList();
  // if the default Before has no later keyframe, its next-stepper must be DISABLED, not lying
  const arDisabledAtEnd = !ks.some(v => v > cmpA) ? document.getElementById('cmpAR').disabled : true;
  // probe from a low position that HAS a next keyframe
  const sl = document.getElementById('cmpA');
  sl.value = '10'; sl.dispatchEvent(new Event('change', { bubbles: true }));
  const before = cmpA;
  document.getElementById('cmpAR').click();          // next change from r-index 10
  const after = cmpA;
  const expected = ks.find(v => v > before) ?? before;
  return { arDisabledAtEnd, before, after, expected, moved: after !== before,
    brDisabled: document.getElementById('cmpBR').disabled };
});
ok(s.arDisabledAtEnd, 'a stepper with no keyframe beyond it is disabled (never lies)');
ok(s.moved && s.after === s.expected, `next-change stepper lands on the exact measured neighbour (${s.before} → ${s.after})`);
ok(s.brDisabled, 'After-picker next-stepper disabled at the latest release');
s = await pg.evaluate(() => {
  const ks = keysList(), before = cmpA;
  document.getElementById('cmpAL').click();
  const expected = [...ks].reverse().find(v => v < before) ?? before;
  return { before, after: cmpA, expected };
});
ok(s.after === s.expected, `prev-change stepper lands on the exact measured neighbour (${s.before} → ${s.after})`);

// ── 7 · steppers-no-snap: a drag commits the EXACT dragged value, key or not ──
s = await pg.evaluate(() => {
  const ks = keysList();
  let nonkey = 0;
  for (let v = 2; v <= VMAX && !nonkey; v++) if (!ks.includes(v)) nonkey = v;
  if (!nonkey) return null;
  const sl = document.getElementById('cmpA');
  sl.value = String(nonkey);
  sl.dispatchEvent(new Event('change', { bubbles: true }));
  return { nonkey, committed: cmpA };
});
if (s) ok(s.committed === s.nonkey, `drag commits the exact value with NO snap (${s.nonkey} stays ${s.committed})`);
else ok(true, 'every release is a key (skip no-snap probe)');

// ── 8 · compare rail tap commits the nearest keyframe to that slider ──
s = await pg.evaluate(() => {
  const r = document.querySelector('.sl-ticks[data-sl="cmpA"]');
  const rc = r.getBoundingClientRect();
  r.dispatchEvent(new PointerEvent('pointerdown', { clientX: rc.left + rc.width * 0.15, bubbles: true }));
  return { a: cmpA, isKey: keysList().includes(cmpA) };
});
ok(s.isKey, `compare rail tap commits a keyframe to Before (${s.a})`);

// ── 9 · "this view vs current": hidden at latest, one tap from an old view ──
s = await pg.evaluate(() => ({ atLatest: !document.getElementById('cmpCur'), active }));
ok(s.atLatest, 'at the latest release the vs-current chip is absent (nothing to offer)');
s = await pg.evaluate(() => {
  setCompare(false); goto(240);
  document.getElementById('bCmp').click();
  const cc = document.getElementById('cmpCur');
  if (!cc) return { has: false };
  cc.click();
  return { has: true, pair: [cmpA, cmpB], vmax: VMAX };
});
ok(s.has, 'reading an old revision offers the vs-current chip');
ok(s.pair && s.pair[0] === 240 && s.pair[1] === s.vmax, `one tap opens this view vs current (${s.pair && s.pair.join(' → ')})`);

// ── 10 · vocabulary + honesty sweeps ──
s = await pg.evaluate(() => ({
  vInts: (document.getElementById('cmp').innerHTML.match(/[>\s]v\d{2,3}\b/g) || []).length,
  prevAria: document.getElementById('cmpAL').getAttribute('aria-label'),
}));
ok(s.vInts === 0, 'no bare v-integers in the panel');
// locale-tolerant: the stepper carries a non-empty aria-label — English on the EN build,
// its translation on a language build (the r259 strings ship in all 32 languages).
ok(!!s.prevAria && s.prevAria.trim().length > 0 &&
   (/previous changed release/i.test(s.prevAria) || !/^[\x00-\x7F]*$/.test(s.prevAria)),
   `stepper aria present (measured semantics; translated on non-EN) ("${(s.prevAria || '').slice(0, 28)}")`);
await pg.evaluate(() => { setCompare(false); goto(VMAX); });

// ── 11 · r-label series still forward, latest r1.001 ──
s = await pg.evaluate(() => ({ first: relLabel(1), last: relLabel(VMAX), mid: relLabel(2) }));
ok(s.first === 'r0.001' && s.mid === 'r0.002' && s.last === 'r1.001', `series forward (${s.first}…${s.last})`);

console.log(`\nR259 BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
