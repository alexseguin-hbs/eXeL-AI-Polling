// r260 battery — MANUAL MIRROR button for side-by-side compare.
// Contract: panes scroll independently (no drift); the last-scrolled pane is the LEAD;
// the button highlights when out of sync; one tap aligns the FOLLOWER to the lead's
// section; symmetric L/R; hidden in unified; reset on close; tap = flash-only.
// Run: node r260-battery.mjs [docUrl]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

// open compare on a changed pair, enter side-by-side
await pg.evaluate(() => setCompare(true, 141, 262));
await pg.evaluate(() => document.getElementById('cmpVS').click());

// ── 1 · button present + visible in side mode; muted at fresh render ──
let s = await pg.evaluate(() => {
  const btn = document.getElementById('cmpMirror');
  return { has: !!btn, vis: btn ? getComputedStyle(btn).display !== 'none' : false,
    side: document.body.classList.contains('cmp-side'),
    lit: btn ? btn.classList.contains('mir-on') : true, synced: cmpMirrorSynced,
    ddL: !!document.getElementById('ddL'), ddR: !!document.getElementById('ddR') };
});
ok(s.has && s.vis && s.side, 'MIRROR button present and visible in side-by-side mode');
ok(s.ddL && s.ddR, 'both panes render');
ok(s.lit && s.synced, 'fresh render is IN SYNC — button LIT, synced true (both panes at same section)');

// ── 2 · scrolling LEFT does NOT move RIGHT (independence, no drift) + button lights ──
s = await pg.evaluate(async () => {
  const L = document.getElementById('ddL'), R = document.getElementById('ddR');
  const r0 = R.scrollTop;
  const ls = L.querySelectorAll('.dd-sec'); L.scrollTop = ls[ls.length - 1].offsetTop; L.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 60));
  const btn = document.getElementById('cmpMirror');
  return { rMoved: R.scrollTop !== r0, lead: cmpMirrorLead, synced: cmpMirrorSynced, lit: btn.classList.contains('mir-on') };
});
ok(!s.rMoved, 'scrolling the Before pane does NOT move the After pane (no auto-drift)');
ok(s.lead === 'L' && !s.synced && !s.lit, 'after Before-scroll to a different section: lead=Before, DRIFTED, button DIM');

// ── 3 · click MIRROR → After aligns to Before's section; button clears ──
s = await pg.evaluate(async () => {
  const L = document.getElementById('ddL'), R = document.getElementById('ddR');
  const before = R.scrollTop;
  document.getElementById('cmpMirror').click();
  await new Promise(r => setTimeout(r, 260));
  const btn = document.getElementById('cmpMirror');
  // find the lead section id at L's scrollTop and compare to R's aligned section
  const pickTop = (pane) => { const secs = pane.querySelectorAll('.dd-sec'); let p = null;
    for (const x of secs){ if (x.offsetTop <= pane.scrollTop + 8) p = x; else break; } return p ? p.getAttribute('data-id') : null; };
  return { moved: R.scrollTop !== before, synced: cmpMirrorSynced, lit: btn.classList.contains('mir-on'),
    prog: cmpMirrorProg, sameSec: pickTop(L) === pickTop(R), lId: pickTop(L), rId: pickTop(R) };
});
ok(s.moved, 'clicking MIRROR scrolls the follower (After) to align');
ok(s.sameSec, `follower lands on the lead's section (Before=${s.lId} · After=${s.rId})`);
ok(s.synced && s.lit, 'after mirror: IN SYNC — synced true, button LIT');
ok(!s.prog, 'the programmatic-scroll guard cleared (not stuck true)');

// ── 4 · SYMMETRIC: scroll RIGHT → drift (dim); click → both align, LEFT moves ──
s = await pg.evaluate(async () => {
  const L = document.getElementById('ddL'), R = document.getElementById('ddR');
  R.scrollTop = 0; R.dispatchEvent(new Event('scroll'));   // back to the first section (both were at last) -> real drift
  await new Promise(r => setTimeout(r, 60));
  const lit1 = document.getElementById('cmpMirror').classList.contains('mir-on');
  const lead1 = cmpMirrorLead;
  const lBefore = L.scrollTop;
  document.getElementById('cmpMirror').click();
  await new Promise(r => setTimeout(r, 260));
  const pickTop = (pane) => { const secs = pane.querySelectorAll('.dd-sec'); let p = null;
    for (const x of secs){ if (x.offsetTop <= pane.scrollTop + 8) p = x; else break; } return p ? p.getAttribute('data-id') : null; };
  return { lit1, lead1, lMoved: L.scrollTop !== lBefore, sameSec: pickTop(L) === pickTop(R), synced: cmpMirrorSynced };
});
ok(!s.lit1 && s.lead1 === 'R', 'scrolling the After pane to a different section makes it lead and DIMS (drift)');
ok(s.lMoved && s.sameSec && s.synced, 'clicking mirror with After as lead aligns the Before pane');

// ── 5 · tap a section = FLASH ONLY (counterpart flashes, neither pane scrolls) ──
s = await pg.evaluate(async () => {
  const R = document.getElementById('ddR'); const r0 = R.scrollTop, l0 = document.getElementById('ddL').scrollTop;
  const sec = document.querySelector('#ddL .dd-sec'); sec.click();
  const id = sec.getAttribute('data-id');
  const mate = document.querySelector('#ddR .dd-sec[data-id="' + id + '"]');
  await new Promise(r => setTimeout(r, 40));
  return { hot: mate && mate.classList.contains('dd-hot'),
    noScroll: R.scrollTop === r0 && document.getElementById('ddL').scrollTop === l0 };
});
ok(s.hot, 'tapping a section flashes its counterpart');
ok(s.noScroll, 'tap is FLASH-ONLY — neither pane scrolls (only the button moves a pane)');

// ── 6 · hidden in unified; body.cmp-side dropped ──
s = await pg.evaluate(() => {
  document.getElementById('cmpVU').click();
  const btn = document.getElementById('cmpMirror');
  return { vis: btn ? getComputedStyle(btn).display !== 'none' : false, side: document.body.classList.contains('cmp-side') };
});
ok(!s.vis && !s.side, 'MIRROR button hidden in unified mode (cmp-side dropped)');

// ── 7 · reset on close ──
s = await pg.evaluate(() => { setCompare(false); return { side: document.body.classList.contains('cmp-side'), lead: cmpMirrorLead, synced: cmpMirrorSynced }; });
ok(!s.side && s.lead === null && s.synced, 'closing compare resets mirror state + drops cmp-side');

// ── 8 · clamp honesty: aligning to the very bottom never overscrolls, never throws ──
s = await pg.evaluate(async () => {
  setCompare(true, 240, 259); document.getElementById('cmpVS').click();
  const L = document.getElementById('ddL'), R = document.getElementById('ddR');
  const btn = document.getElementById('cmpMirror');
  if (!L || !R || !btn) return { skip: true };
  L.scrollTop = L.scrollHeight; L.dispatchEvent(new Event('scroll'));   // force lead to the very end
  await new Promise(r => setTimeout(r, 40));
  btn.click();
  await new Promise(r => setTimeout(r, 240));
  const max = R.scrollHeight - R.clientHeight;
  return { within: R.scrollTop <= max + 1 && R.scrollTop >= 0, top: Math.round(R.scrollTop), max: Math.round(max) };
});
ok(s.skip || s.within, `mirror clamps follower within [0, max] — no overscroll (top ${s.top}/${s.max})`);
await pg.evaluate(() => setCompare(false));

// ── 9 · label is translated / semantic (published-build check via title) ──
s = await pg.evaluate(async () => {
  setCompare(true, 240, 259); document.getElementById('cmpVS').click();
  const L = document.getElementById('ddL'); L.scrollTop = 500; L.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 40));
  const btn = document.getElementById('cmpMirror');
  const label = document.getElementById('cmpMirrorTxt').textContent;
  return { title: btn.title, label, hasLeftRight: /\bleft\b|\bright\b/i.test(btn.title) };
});
ok(!s.hasLeftRight, `button title carries no positional left/right (semantic only) — "${s.title}"`);
ok(!!s.label, `button carries a visible label ("${s.label}")`);
await pg.evaluate(() => setCompare(false));

console.log(`\nR260 BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
