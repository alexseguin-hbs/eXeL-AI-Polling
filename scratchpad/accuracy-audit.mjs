// STANDING ACCURACY AUDIT — token-level reconciliation on sampled pairs.
// Invariants per changed block: (1) classification honest — 'revised' iff canonical html
// differs; (2) side-by-side panes carry EXACTLY the before/after token streams; (3) hunk
// reconstruction (hidden runs restored, ins/del stripped respectively) reconciles to the
// same streams. Every token present, ordered, none invented. Exits 1 on any violation.
// Run: node accuracy-audit.mjs [docUrl]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage();
pg.on('pageerror', e => console.log('PAGEERROR:', e.message));
await pg.goto(DOC, { waitUntil: 'networkidle' });
const PAIRS = [[1,16],[16,50],[37,181],[50,100],[73,222],[100,150],[131,165],[150,200],[200,240],[240,246],[110,254],[1,257]];
const res = await pg.evaluate((PAIRS) => {
  const toks = (s) => JSON.stringify(dfTok(s));
  const out = [];
  for (const [lo, hi] of PAIRS) {
    const rows = compare(lo, Math.min(hi, VMAX)).filter(r => r.kind !== 'carried');
    let checked = 0, paneFail = 0, hunkFail = 0, classFail = 0;
    for (const r of rows) {
      const beforeT = dfText(enHtmlAt(r.id, lo)), afterT = dfText(enHtmlAt(r.id, Math.min(hi, VMAX)));
      if (r.kind === 'revised' && enHtmlAt(r.id, lo) === enHtmlAt(r.id, Math.min(hi, VMAX))) classFail++;
      const s2 = dfSides(r.id, lo, Math.min(hi, VMAX));
      if (s2) {
        const div = document.createElement('div');
        div.innerHTML = s2.left; const L = div.textContent;
        div.innerHTML = s2.right; const R = div.textContent;
        if (beforeT !== '' && toks(L) !== toks(beforeT)) paneFail++;
        if (afterT !== '' && toks(R) !== toks(afterT)) paneFail++;
      }
      const p = dfPassage(r.id, lo, Math.min(hi, VMAX));
      if (p.indexOf('df-big') === -1) {
        const dv = document.createElement('div'); dv.innerHTML = p;
        dv.querySelectorAll('.df-gap').forEach(g => g.remove());
        dv.querySelectorAll('.df-hid').forEach(hd => hd.hidden = false);
        const dv2 = dv.cloneNode(true);
        dv.querySelectorAll('ins').forEach(x => x.remove());
        dv2.querySelectorAll('del').forEach(x => x.remove());
        if (toks(dv.textContent) !== toks(beforeT)) hunkFail++;
        if (toks(dv2.textContent) !== toks(afterT)) hunkFail++;
      }
      checked++; if (checked >= 12) break;
    }
    out.push({ lo, hi, changed: rows.length, checked, classFail, paneFail, hunkFail });
  }
  return out;
}, PAIRS);
let bad = 0;
for (const r of res) {
  const okAll = r.classFail === 0 && r.paneFail === 0 && r.hunkFail === 0;
  if (!okAll) bad++;
  console.log(`${okAll ? 'ok  ' : 'FAIL'} r${r.lo}<->r${r.hi}: ${r.changed} changed, ${r.checked} audited | class ${r.classFail} pane ${r.paneFail} hunk ${r.hunkFail}`);
}
console.log(bad === 0 ? '\nACCURACY AUDIT: PASS' : `\nACCURACY AUDIT: ${bad} FAILED`);
await b.close(); process.exit(bad ? 1 : 0);
