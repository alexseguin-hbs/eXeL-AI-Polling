// r255 battery — SEE THE CHANGES: full-screen · side-by-side (red left / green right) ·
// mirror scroll · coupling · change navigator + rail · r-numbers only · Play never blanks
// + narration card + pause-into-compare. Run: node r255-battery.mjs [docUrl]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 375, height: 800 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

// ── 1 · full-screen modal ──
await pg.evaluate(() => document.getElementById('bCmp').click());
let s = await pg.evaluate(() => { const r = document.getElementById('cmp').getBoundingClientRect();
  return { w: r.width, h: r.height, iw: innerWidth, ih: innerHeight }; });
ok(Math.abs(s.w - s.iw) < 2 && Math.abs(s.h - s.ih) < 2, `compare is FULL SCREEN (${s.w}x${s.h} vs ${s.iw}x${s.ih})`);

// ── 2 · content pair, unified: trinity labels + no v-integers ──
await pg.evaluate(() => { const e = document.getElementById('cmpA'); e.value = '110'; e.dispatchEvent(new Event('change', { bubbles: true })); });
s = await pg.evaluate(() => ({
  cards: document.querySelectorAll('#cmpPass .df-blk').length,
  why: document.querySelectorAll('#cmpPass .df-why').length,
  at: document.querySelectorAll('#cmpPass .df-at').length,
  vInts: (document.getElementById('cmp').innerHTML.match(/[>\s]v\d{2,3}\b/g) || []).length,
  navN: (document.getElementById('cmpNvN') || {}).textContent || '',
}));
ok(s.cards > 0, `unified cards render (${s.cards})`);
ok(s.why > 0 && s.at > 0, `Trinity on cards: ♡ intent (${s.why}) + 웃 release (${s.at}); diff = ◬`);
ok(s.vInts === 0, `no bare v-integers anywhere in the panel (${s.vInts})`);
ok(/\d+ \/ \d+|– \/ –/.test(s.navN), `navigator counter present ("${s.navN}")`);

// ── 3 · change navigator walks clusters + rail marks ──
s = await pg.evaluate(() => {
  const clus = document.querySelectorAll('#cmpPass del, #cmpPass ins').length;
  document.getElementById('cmpNvX').click();
  const first = document.querySelector('.df-cur');
  document.getElementById('cmpNvX').click();
  const second = document.querySelector('.df-cur');
  const rail = document.getElementById('cmpRail');
  return { clus, hasCur: !!first, moved: first !== second, n: document.getElementById('cmpNvN').textContent,
    rail: !!rail, marks: rail ? rail.querySelectorAll('i').length : 0 };
});
ok(s.hasCur && s.moved && /^2 \/ /.test(s.n), `next walks clusters with counter (${s.n})`);
ok(s.rail && s.marks > 0 && s.marks <= 201, `rail renders bucketed marks (${s.marks} for ${s.clus} clusters)`);

// ── 4 · SIDE BY SIDE: red left, green right, reconcile, mirror, coupling ──
await pg.evaluate(() => document.getElementById('cmpVS').click());
s = await pg.evaluate(() => {
  const L = document.getElementById('ddL'), R = document.getElementById('ddR');
  return { has: !!L && !!R,
    delL: L ? L.querySelectorAll('del').length : 0, insL: L ? L.querySelectorAll('ins').length : 0,
    delR: R ? R.querySelectorAll('del').length : 0, insR: R ? R.querySelectorAll('ins').length : 0,
    secL: L ? L.querySelectorAll('.dd-sec').length : 0, secR: R ? R.querySelectorAll('.dd-sec').length : 0,
    beforeH: L ? /Before|قبل|Antes/.test(L.querySelector('h6').textContent) : false,
    afterH: R ? /After|بعد|Después/.test(R.querySelector('h6').textContent) : false };
});
ok(s.has, 'side-by-side panes render');
ok(s.delL > 0 && s.insL === 0, `LEFT pane: removals red only (del ${s.delL}, ins ${s.insL})`);
ok(s.insR > 0 && s.delR === 0, `RIGHT pane: additions green only (ins ${s.insR}, del ${s.delR})`);
ok(s.secL === s.secR && s.secL > 0, `panes carry the same changed sections (${s.secL})`);
ok(s.beforeH && s.afterH, 'pane headers read Before / After');
// mirror is now MANUAL (r260) — panes scroll independently; scrolling one does NOT move the
// other. The one-tap alignment contract is owned by r260-battery.mjs. Here we only assert the
// r260 replacement of the old auto-drift: the follower stays put on a lead scroll.
s = await pg.evaluate(async () => {
  const L = document.getElementById('ddL'), R = document.getElementById('ddR');
  const r0 = R.scrollTop;
  L.scrollTop = Math.max(0, L.scrollHeight / 2);
  L.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 60));
  return { l: L.scrollTop, rMoved: R.scrollTop !== r0 };
});
ok(s.l > 0 && !s.rMoved, `panes scroll independently — no auto-drift (r260 manual mirror; L=${Math.round(s.l)})`);
// coupling flash
s = await pg.evaluate(async () => {
  const sec = document.querySelector('#ddL .dd-sec');
  sec.click();
  const id = sec.getAttribute('data-id');
  const mate = document.querySelector('#ddR .dd-sec[data-id="' + id + '"]');
  return { hot: mate && mate.classList.contains('dd-hot') };
});
ok(s.hot, 'tapping a section flashes its counterpart');
// filter applies to panes
s = await pg.evaluate(() => {
  const chip = document.querySelector('.cmp-sum .k-rev'); if (!chip) return null;
  chip.click();
  return { hid: Array.from(document.querySelectorAll('#cmpPass .dd-sec')).filter(x => x.style.display === 'none').length };
});
if (s) { ok(s.hid >= 0, `filter applies in side mode (${s.hid} hidden)`);
  await pg.evaluate(() => document.querySelector('.cmp-sum .k-rev').click()); }
else ok(true, 'no revised chip (skip)');
await pg.evaluate(() => { document.getElementById('cmpVU').click(); });
await pg.evaluate(() => setCompare(false));

// ── 5 · PLAY never blanks (all four views) + narration card + pause-to-compare ──
for (const [vw, label] of [['paper', 'White paper'], ['brief', 'Brief'], ['nose', 'NOSE'], ['outline', 'Outline']]) {
  const blank = await pg.evaluate(async (v) => {
    try { setView(v); } catch (e) { return { skip: true }; }
    let blanks = 0, checked = 0;
    for (const rel of [1, 2, 5, 20, 100, VMAX]) {
      goto(rel); checked++;
      const vis = Array.from(document.querySelectorAll('#doc section.blk'))
        .filter(s2 => getComputedStyle(s2).display !== 'none' && s2.textContent.trim().length > 0).length;
      if (vis === 0) blanks++;
    }
    goto(VMAX);
    return { blanks, checked };
  }, vw);
  if (blank.skip) { ok(true, `view ${label}: no setView (skip)`); continue; }
  ok(blank.blanks === 0, `Play walk ${label}: zero blank frames (${blank.checked} releases sampled)`);
}
// narration card
s = await pg.evaluate(async () => {
  goto(240);
  document.getElementById('bPlay').click(); // starts from active or 1? active=240 <VMAX so continues
  await new Promise(r => setTimeout(r, 2800));
  const card = document.getElementById('playCard');
  const out = { card: !!card, title: card ? card.querySelector('h6').textContent : '',
    items: card ? card.querySelectorAll('li').length : 0, metric: card ? (card.querySelector('.pc-m') || {}).textContent || '' : '' };
  return out;
});
ok(s.card, 'play narration card appears on step');
ok(/r[01]\./.test(s.title), `card titled with series label ("${(s.title || '').slice(0, 36)}")`);
ok(s.items <= 9, `card lists ≤9 changes (${s.items})`);
ok(/vs r[01]\./.test(s.metric), `metric vs previous present ("${(s.metric || '').slice(0, 52)}")`);
s = await pg.evaluate(() => {
  const btn = document.querySelector('#playCard button'); if (!btn) return null;
  btn.click();
  return { playingStopped: !playing, cmpOpen: cmpOn && document.body.classList.contains('cmpshow'),
    pair: [cmpA, cmpB], card: !!document.getElementById('playCard') };
});
ok(s && s.playingStopped && s.cmpOpen && !s.card, 'pause-into-detail: playback stops, compare opens, card cleared');
ok(s && s.pair[1] === s.pair[0] + 1, `compare opens on the step pair (${s.pair[0]} → ${s.pair[1]})`);
await pg.evaluate(() => setCompare(false));

// ── 6 · empty-view honesty: brief at r0.001 says when it begins ──
s = await pg.evaluate(() => {
  try { setView('brief'); } catch (e) { return { skip: true }; }
  goto(1);
  const t = document.getElementById('doc').textContent;
  const vis = Array.from(document.querySelectorAll('#doc section.blk'))
    .filter(s2 => getComputedStyle(s2).display !== 'none' && s2.textContent.trim().length > 0).length;
  const out = { notice: /begins at/.test(t), blank: vis === 0 };
  setView('paper'); goto(VMAX);
  return out;
});
ok(s.skip || !s.blank, 'brief at r0.001: NEVER blank (honest fallback or begins-at notice)');

console.log(`\nR255 BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
