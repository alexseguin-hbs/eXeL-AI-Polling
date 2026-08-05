/* READING LEVEL — the band the operator set, measured per section.
   =========================================================================
   Written for heads of state, ministers, mayors and the advisors who brief them —
   most of whom will meet this in a second language or through an interpreter.

   That makes the target a BAND, not a bar, and both edges are load-bearing:

     FLOOR 11  — below this the prose reads as simplified to the audience it is
                 addressed to. Never dumb it down for a head of state.
     CEILING 13 — above this it stops surviving translation. mot.leaders promises
                 the document is "written to be read aloud, and to survive
                 translation into any language", and density is the first thing
                 an interpreter loses.

   A section under the floor fails exactly as loudly as one over the ceiling.
   Grade measures sentence and word mechanics, not sophistication of thought:
   Lincoln's second inaugural scores about 11.

   Flesch-Kincaid grade level, per numbered section, computed on the rendered
   reading (chrome and change-notes stripped).

   Run:  node scripts/readability-vision2525.mjs
*/
import { chromium } from 'playwright';

const F = 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const FLOOR   = 11.0;  // below this it reads as simplified
const CEILING = 13.0;  // above this it stops surviving translation
const CENTRE  = 12.0;  // where the band is centred
const BAR = CEILING;   // retained: older call sites read BAR
const TARGET = CENTRE;

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

const rows  = sections.map(s => ({ n: +s.id, ...grade(s.text) })).sort((a, c) => a.n - c.n);
const above = rows.filter(r => r.g > CEILING);
const below = rows.filter(r => r.g < FLOOR);
const inBand = rows.filter(r => r.g >= FLOOR && r.g <= CEILING);
const pad = (s, n) => String(s).padStart(n);

console.log('READING LEVEL — Flesch-Kincaid grade, per section');
console.log('BAND ' + FLOOR.toFixed(0) + '–' + CEILING.toFixed(0) + ', centred on ' + CENTRE.toFixed(0) +
            '.  Below the floor reads as simplified; above the ceiling stops surviving translation.\n');
console.log('  §   grade   words  sents  avg sentence');
for (const r of rows)
  console.log('  ' + pad(r.n, 2) + pad(r.g.toFixed(1), 8) + pad(r.words, 7) + pad(r.sents, 7) +
              pad(r.avg.toFixed(1), 8) +
              (r.g > CEILING ? '   ABOVE CEILING  ↓ bring down'
             : r.g < FLOOR   ? '   BELOW FLOOR    ↑ bring up'
             :                 '   in band'));

const gs = rows.map(r => r.g);
const mean = gs.reduce((a, c) => a + c, 0) / gs.length;
const best = rows.reduce((a, c) => c.g < a.g ? c : a);
const worst = rows.reduce((a, c) => c.g > a.g ? c : a);
console.log('\nmean grade ' + mean.toFixed(1) +
            ' · plainest §' + best.n + ' at ' + best.g.toFixed(1) +
            ' · densest §' + worst.n + ' at ' + worst.g.toFixed(1));
console.log(inBand.length + ' of ' + rows.length + ' sections are in band.');
if (above.length) console.log('  above the ceiling (' + above.length + '): ' + above.map(r => '§' + r.n).join(' '));
if (below.length) console.log('  below the floor  (' + below.length + '): ' + below.map(r => '§' + r.n).join(' '));
if (!above.length && !below.length) console.log('  every section is inside the band.');

console.log('\nThis reports. It does not gate — the rewrite is the work, and a gate that');
console.log('failed the build today would only hide the number it is supposed to publish.');
await b.close();
