// r269 battery — (1) emerald/crimson diff colors, (2) symmetric side-by-side text size,
// (3) MIRROR = live sync indicator: LIT when both panes show the same section, DIM on drift,
// press re-syncs, repeatable; tolerance = the section itself. Run: node r269-battery.mjs [url]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

// ── 1 · EMERALD (added) + CRIMSON (removed) in the unified diff ──
let s = await pg.evaluate(() => {
  setCompare(true, 79, 95);
  const del = document.querySelector('#cmpPass del'), ins = document.querySelector('#cmpPass ins');
  return { del: del ? getComputedStyle(del).color : '', ins: ins ? getComputedStyle(ins).color : '' };
});
ok(/^rgb\(251, 113, 133\)$/.test(s.del), `removed text is CRIMSON (${s.del})`);
ok(/^rgb\(52, 211, 153\)$/.test(s.ins), `added text is EMERALD (${s.ins})`);

// ── 2 · SYMMETRIC panes: left & right measured text same size; no why-line clutter ──
s = await pg.evaluate(() => {
  document.getElementById('cmpVS').click();
  const L = document.querySelector('#ddL .dd-sec p[title]'), R = document.querySelector('#ddR .dd-sec p[title]');
  return { L: L ? getComputedStyle(L).fontSize : '', R: R ? getComputedStyle(R).fontSize : '',
    whyInPane: !!document.querySelector('#ddL .df-why, #ddR .df-why') };
});
ok(s.L === s.R && s.L !== '', `left and right measured text are the SAME size (${s.L})`);
ok(!s.whyInPane, 'the trinity why-line no longer clutters the panes (symmetric)');

// ── 3 · MIRROR = live sync indicator ──
s = await pg.evaluate(() => ({ fresh: document.getElementById('cmpMirror').classList.contains('mir-on') }));
ok(s.fresh, 'fresh render: both panes on the same section → button LIT (in sync)');

// scroll LEFT to the last section → drift → DIM
s = await pg.evaluate(async () => {
  const L = document.getElementById('ddL'); const ls = L.querySelectorAll('.dd-sec');
  L.scrollTop = ls[ls.length - 1].offsetTop; L.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 50));
  return { lit: document.getElementById('cmpMirror').classList.contains('mir-on'), lead: cmpMirrorLead };
});
ok(!s.lit && s.lead === 'L', 'scrolling Before to another section auto-DIMS (drift) — lead=Before');

// press MIRROR → both to the same section → LIT
s = await pg.evaluate(async () => {
  document.getElementById('cmpMirror').click();
  await new Promise(r => setTimeout(r, 260));
  const t = p => { const ss = p.querySelectorAll('.dd-sec'); let k = ss[0]; for (const x of ss){ if (x.offsetTop <= p.scrollTop + 8) k = x; else break; } return k.getAttribute('data-id'); };
  return { lit: document.getElementById('cmpMirror').classList.contains('mir-on'),
    same: t(document.getElementById('ddL')) === t(document.getElementById('ddR')) };
});
ok(s.lit && s.same, 'pressing MIRROR re-syncs both panes to the same section → button LIT');

// REPEATABLE the other way: scroll RIGHT to first section → drift → press → LIT
s = await pg.evaluate(async () => {
  const R = document.getElementById('ddR'); R.scrollTop = 0; R.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 50));
  const dim = !document.getElementById('cmpMirror').classList.contains('mir-on');
  document.getElementById('cmpMirror').click();
  await new Promise(r => setTimeout(r, 260));
  return { dim, relit: document.getElementById('cmpMirror').classList.contains('mir-on') };
});
ok(s.dim && s.relit, 'repeatable: scroll After → dim → press → lit (as many times as you scroll)');

// TOLERANCE: a small scroll WITHIN the same section stays IN SYNC (lit)
s = await pg.evaluate(async () => {
  // both aligned to same section now; nudge left a few px (still same top section)
  const L = document.getElementById('ddL'); L.scrollTop = L.scrollTop + 6; L.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 50));
  return { lit: document.getElementById('cmpMirror').classList.contains('mir-on') };
});
ok(s.lit, 'a tiny scroll within the same section stays IN SYNC (tolerance = the section)');

// label reflects state, semantic only (RTL-safe)
s = await pg.evaluate(() => ({ title: document.getElementById('cmpMirror').title }));
ok(!/\bleft\b|\bright\b/i.test(s.title), `button label is semantic, no left/right ("${s.title}")`);
await pg.evaluate(() => setCompare(false));

// r271 · coordinate fix (Fleet-48 HIGH): on a SMALL diff (pane barely scrolls) drift must
// still DIM and MIRROR must align to the section TOP, not jam to the bottom. Before the
// .dd-pane position:relative fix, section offsets were measured against #cmp, so small diffs
// never dimmed and alignment clamped to the bottom.
s = await pg.evaluate(async () => {
  setCompare(true, 200, 240); document.getElementById('cmpVS').click();
  const L = document.getElementById('ddL'), R = document.getElementById('ddR');
  const btn = document.getElementById('cmpMirror');
  const secs = L.querySelectorAll('.dd-sec');
  const fresh = btn.classList.contains('mir-on');
  const s2 = secs[Math.min(1, secs.length - 1)];
  L.scrollTop = s2 ? s2.offsetTop : 40; L.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 60));
  const drift = !btn.classList.contains('mir-on');
  btn.click(); await new Promise(r => setTimeout(r, 260));
  const maxR = R.scrollHeight - R.clientHeight;
  const notJammed = maxR < 5 || R.scrollTop < maxR - 5;
  const relit = btn.classList.contains('mir-on');
  setCompare(false);
  return { fresh, drift, relit, notJammed };
});
ok(s.fresh && s.drift && s.relit, 'small-diff mirror: fresh lit, drift dims, press re-lights (coordinate fix)');
ok(s.notJammed, 'small-diff mirror: press aligns to the section, not jammed to the bottom');

console.log(`\nR269 BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
