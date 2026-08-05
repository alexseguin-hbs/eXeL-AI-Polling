/* READING LEVEL — the bar the operator set, measured for the first time at r62.
   =========================================================================
   "speaking plainly enough for a high school reading level"

   That commitment was made and never measured. A document that asks the world to
   check its arithmetic and never checks its own sentences has picked the easy half
   of accountability. This is the missing half.

   Flesch-Kincaid grade level, per numbered section, computed on the rendered
   reading (chrome and change-notes stripped). US high school is grades 9-12;
   "plainly enough for" a high-school reader means the bar is 12, and the target
   is 10 — §19 already reaches 7.9, so it is reachable without dumbing anything down.

   Run:  node scripts/readability-vision2525.mjs
*/
import { chromium } from 'playwright';

const F = 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const BAR = 12.0;      // must not exceed
const TARGET = 10.0;   // where we are trying to get to

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(F); await p.waitForTimeout(300);

const sections = await p.evaluate(() => {
  setView('paper'); goto(VMAX);
  return [...document.querySelectorAll('#doc section.blk')]
    .filter(s => /^blk-paper\.s\d+$/.test(s.id))
    .map(s => {
      const c = s.cloneNode(true);
      c.querySelectorAll('.chgtag').forEach(t => t.parentElement && t.parentElement.remove());
      /* code blocks and tables are reference material, not prose */
      c.querySelectorAll('pre,table').forEach(e => e.remove());
      return { id: s.id.replace('blk-paper.s', ''), text: c.textContent };
    });
});

const syll = w => {
  w = w.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  let n = (w.match(/[aeiouy]+/g) || []).length;
  if (w.endsWith('e') && n > 1) n--;
  return Math.max(1, n);
};
const grade = text => {
  const t = text.replace(/\s+/g, ' ').trim();
  const sents = t.split(/[.!?]+(?=\s|$)/).filter(s => s.trim().split(/\s+/).length > 2);
  const words = t.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  if (!sents.length || !words.length) return null;
  const S = words.reduce((a, w) => a + syll(w), 0);
  return { g: 0.39 * (words.length / sents.length) + 11.8 * (S / words.length) - 15.59,
           words: words.length, sents: sents.length, avg: words.length / sents.length };
};

const rows = sections.map(s => ({ n: +s.id, ...grade(s.text) })).sort((a, c) => a.n - c.n);
const over = rows.filter(r => r.g > BAR);
const pad = (s, n) => String(s).padStart(n);

console.log('READING LEVEL — Flesch-Kincaid grade, per section  (bar ' + BAR + ', target ' + TARGET + ')\n');
console.log('  §   grade   words  sents  avg sentence');
for (const r of rows)
  console.log('  ' + pad(r.n, 2) + pad(r.g.toFixed(1), 8) + pad(r.words, 7) + pad(r.sents, 7) +
              pad(r.avg.toFixed(1), 8) + (r.g > BAR ? '   OVER THE BAR' : r.g <= TARGET ? '   on target' : ''));

const gs = rows.map(r => r.g);
const mean = gs.reduce((a, c) => a + c, 0) / gs.length;
const best = rows.reduce((a, c) => c.g < a.g ? c : a);
const worst = rows.reduce((a, c) => c.g > a.g ? c : a);
console.log('\nmean grade ' + mean.toFixed(1) +
            ' · plainest §' + best.n + ' at ' + best.g.toFixed(1) +
            ' · densest §' + worst.n + ' at ' + worst.g.toFixed(1));
console.log(over.length + ' of ' + rows.length + ' sections are over the bar: ' +
            (over.map(r => '§' + r.n).join(' ') || 'none'));
console.log('\nThis reports. It does not gate — the rewrite is the work, and a gate that');
console.log('failed the build today would only hide the number it is supposed to publish.');
await b.close();
