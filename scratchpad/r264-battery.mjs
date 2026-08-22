// r264 battery — GRADUATED VERSIONS lock. The history reads v.01..v.18 by natural band;
// latest alone is v.19 r1.001; revision numbers unchanged; labels zero-padded 2 digits.
// Run: node r264-battery.mjs [url]
import { chromium } from 'playwright';
const DOC = process.argv[2] || 'file:///home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); c ? passes++ : fails++; };
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', e => { console.log('PAGEERROR:', e.message); fails++; });
await pg.goto(DOC, { waitUntil: 'networkidle' });

let s = await pg.evaluate(() => {
  let mono = true, prev = 0; const bands = new Set();
  for (let r = 1; r < VMAX; r++){ const v = versionAt(r); if (v < prev) mono = false; prev = v; bands.add(v); }
  const bandsSorted = [...bands].sort((a, b) => a - b);
  // boundaries increment exactly at VBANDS
  let edgesOK = true;
  for (let i = 1; i < VBANDS.length; i++){ if (!(versionAt(VBANDS[i]) === i + 1 && versionAt(VBANDS[i] - 1) === i)) edgesOK = false; }
  return {
    VMAX, mono, nBands: bandsSorted.length, first: bandsSorted[0], last: bandsSorted[bandsSorted.length - 1],
    latest: versionAt(VMAX), edgesOK, vbands: VBANDS.length,
    lblFirst: verN(1), lblLast: verN(VMAX - 1), lblLatest: verN(VMAX),
    relFirst: relLabel(1), relLatest: relLabel(VMAX),
  };
});
ok(s.mono, 'versionAt is monotonic non-decreasing across all history');
ok(s.nBands === 18 && s.first === 1 && s.last === 18, `history spans exactly 18 bands v.01..v.18 (${s.nBands})`);
ok(s.vbands === 18, `VBANDS carries 18 band-starts (${s.vbands})`);
ok(s.edgesOK, 'each band boundary increments the version by exactly one');
ok(s.latest === 19, `the latest release alone is v.19 (${s.latest})`);
ok(s.lblFirst === 'v.01' && s.lblLast === 'v.18' && s.lblLatest === 'v.19', `labels zero-padded 2 digits (${s.lblFirst} .. ${s.lblLast} .. ${s.lblLatest})`);
ok(s.relFirst === 'r0.001' && s.relLatest === 'r1.001', `revision series unchanged (${s.relFirst} .. ${s.relLatest})`);

// masthead renders graduated versions as you move through history
s = await pg.evaluate(() => {
  const at = (r) => { goto(r); return document.getElementById('vNow').textContent.trim(); };
  return { r1: at(1), r94: at(94), r250: at(250), latest: at(VMAX) };
});
ok(/^v\.01 /.test(s.r1), `masthead at r1 reads v.01 ("${s.r1}")`);
ok(/^v\.05 /.test(s.r94), `masthead at r94 (old v.18 delivery edge) reads v.05 ("${s.r94}")`);
ok(/^v\.18 /.test(s.r250), `masthead at r250 reads v.18 ("${s.r250}")`);
ok(/^v\.19 r1\.001/.test(s.latest), `masthead at latest reads v.19 r1.001 ("${s.latest}")`);

// compare labels carry graduated versions on both ends
s = await pg.evaluate(() => {
  setCompare(true, 40, 190);
  const t = (document.querySelector('.cmp-pick h4') || document.querySelector('.cmp-bar-t') || {}).textContent || '';
  setCompare(false);
  return t;
});
ok(/v\.02 r0\.040/.test(s) && /v\.11 r0\.190/.test(s), `compare label shows graduated versions both ends ("${s.trim()}")`);

console.log(`\nR264 BATTERY: ${passes} passed, ${fails} failed`);
await b.close();
process.exit(fails ? 1 : 0);
