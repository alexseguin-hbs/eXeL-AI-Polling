// r263 battery — SELECT-AS-BASE mirror (operator: "the last scrolled OR selected column
// item is the base the other side jumps to"). Tests: tap selects base+item; mirror jumps
// the follower to the selected item at the same on-screen height; symmetric L/R; various
// item positions (first/middle/last); scroll-vs-select last-wins. Run: node r263-battery.mjs [url]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

// open a well-changed pair (many sections) in side-by-side
await pg.evaluate(() => setCompare(true, 141, 262));
await pg.evaluate(() => document.getElementById('cmpVS').click());
await pg.evaluate(() => document.getElementById('cmpMore') && document.getElementById('cmpMore').click()); // show all sections if folded

const secCount = await pg.evaluate(() => document.querySelectorAll('#ddL .dd-sec').length);
ok(secCount >= 3, `enough changed sections to test positions (${secCount})`);

// helper: run in page — select the Nth section in a pane, click mirror, measure alignment
const jump = async (paneId, followId, idx) => pg.evaluate(({ paneId, followId, idx }) => {
  const pane = document.getElementById(paneId), follow = document.getElementById(followId);
  // reset both panes to independent positions so the jump is meaningful
  follow.scrollTop = 0; pane.scrollTop = 0;
  const secs = pane.querySelectorAll('.dd-sec');
  const n = idx < 0 ? secs.length + idx : idx;
  const sec = secs[n];
  const id = sec.getAttribute('data-id');
  // bring the item into the lead's view a bit (scroll lead so it's mid-pane), then TAP it
  pane.scrollTop = Math.max(0, sec.offsetTop - 60);
  sec.click();  // select as base
  const lit = document.getElementById('cmpMirror').classList.contains('mir-on');
  const leadSet = (paneId === 'ddL' ? cmpMirrorLead === 'L' : cmpMirrorLead === 'R');
  const followBefore = follow.scrollTop;
  document.getElementById('cmpMirror').click();
  return { id, lit, leadSet, followBefore };
}, { paneId, followId, idx });

const checkAligned = async (paneId, followId, id) => pg.evaluate(({ paneId, followId, id }) => {
  const pane = document.getElementById(paneId), follow = document.getElementById(followId);
  const lead = pane.querySelector('.dd-sec[data-id="' + id + '"]');
  const mate = follow.querySelector('.dd-sec[data-id="' + id + '"]');
  const leadVY = lead.offsetTop - pane.scrollTop;             // on-screen y of selected item
  const mateVY = mate.offsetTop - follow.scrollTop;           // on-screen y of counterpart
  const max = follow.scrollHeight - follow.clientHeight;
  const clamped = follow.scrollTop <= 1 || follow.scrollTop >= max - 1;
  return { leadVY: Math.round(leadVY), mateVY: Math.round(mateVY), synced: cmpMirrorSynced,
    lit: document.getElementById('cmpMirror').classList.contains('mir-on'), clamped };
}, { paneId, followId, id });

// ── 1 · SELECT LEFT item (middle) → tap sets base+lit, no auto-scroll; mirror jumps RIGHT ──
let j = await jump('ddL', 'ddR', Math.floor(secCount / 2));
ok(!j.lit && j.leadSet, 'tap LEFT section: base=Left, button DIM until mirror (not yet aligned)');
let a = await checkAligned('ddL', 'ddR', j.id);
ok(a.synced && a.lit, 'after mirror: IN SYNC — synced true, button LIT');
ok(a.clamped || Math.abs(a.leadVY - a.mateVY) <= 8, `RIGHT jumped to the selected item at same height (L=${a.leadVY} R=${a.mateVY})`);

// ── 2 · SELECT RIGHT item (middle) → mirror jumps LEFT ──
j = await jump('ddR', 'ddL', Math.floor(secCount / 2));
ok(!j.lit && j.leadSet, 'tap RIGHT section: base=Right, button DIM until mirror');
a = await checkAligned('ddR', 'ddL', j.id);
ok(a.clamped || Math.abs(a.leadVY - a.mateVY) <= 8, `LEFT jumped to the selected item at same height (R=${a.leadVY} L=${a.mateVY})`);

// ── 3 · VARIOUS POSITIONS: first / last item, both directions ──
j = await jump('ddL', 'ddR', 0); a = await checkAligned('ddL', 'ddR', j.id);
ok(a.clamped || Math.abs(a.leadVY - a.mateVY) <= 8, `first item L→R aligns (L=${a.leadVY} R=${a.mateVY})`);
j = await jump('ddR', 'ddL', -1); a = await checkAligned('ddR', 'ddL', j.id);
ok(a.clamped || Math.abs(a.leadVY - a.mateVY) <= 8, `last item R→L aligns (R=${a.leadVY} L=${a.mateVY})`);

// ── 4 · LAST-WINS: select an item, then SCROLL the other pane → scroll becomes base ──
await pg.evaluate(() => new Promise(r => setTimeout(r, 220)));   // let any prior programmatic-scroll guard clear
let s = await pg.evaluate(async () => {
  const L = document.getElementById('ddL'), R = document.getElementById('ddR');
  const sec = L.querySelectorAll('.dd-sec')[1]; sec.click();          // select LEFT item → base L
  const afterSelect = cmpMirrorLead;
  await new Promise(r => setTimeout(r, 30));
  R.scrollTop = Math.floor(R.scrollHeight / 2); R.dispatchEvent(new Event('scroll')); // then scroll RIGHT
  await new Promise(r => setTimeout(r, 30));
  return { afterSelect, afterScroll: cmpMirrorLead };
});
ok(s.afterSelect === 'L' && s.afterScroll === 'R', `last action wins: select(L) then scroll(R) → base=Right (${s.afterSelect}→${s.afterScroll})`);

// ── 5 · select then mirror twice is idempotent (no creep) ──
j = await jump('ddL', 'ddR', Math.floor(secCount / 2));
let t1 = await pg.evaluate(() => document.getElementById('ddR').scrollTop);
await pg.evaluate(() => { document.getElementById('ddL').querySelector('.dd-sec[data-id]'); document.getElementById('cmpMirror').click(); });
await pg.evaluate(() => new Promise(r => setTimeout(r, 200)));
let t2 = await pg.evaluate(() => document.getElementById('ddR').scrollTop);
ok(Math.abs(t1 - t2) <= 2, `re-mirror is idempotent — no creep (${Math.round(t1)}≈${Math.round(t2)})`);

await pg.evaluate(() => setCompare(false));
console.log(`\nR263 BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
