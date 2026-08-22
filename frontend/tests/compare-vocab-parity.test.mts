// COMPARE VOCABULARY PARITY — the cross-surface lock (r254, Krishna's binding condition).
// One vocabulary (Before/After), one direction, one "changed" colour token across the living
// document AND the three React compare surfaces. Fails the moment any surface drifts.
import { readFileSync } from 'node:fs';
let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; } else { fail++; console.log('FAIL:', m); } };
const R = (p: string) => readFileSync('/home/user/eXeL-AI-Polling/' + p, 'utf8');

const doc = R('docs/SOI_VISION2525_LIVING_DOCUMENT.html');
ok(doc.includes('<label for="cmpA">Before &middot; '), 'doc: Before slider label');
ok(doc.includes('<label for="cmpB">After &middot; '), 'doc: After slider label');
ok(!doc.includes('<label for="cmpA">Baseline'), 'doc: no Baseline label remains');
ok(doc.includes('Before and After to compare two'), 'doc: single-release message speaks Before/After');
ok(doc.includes('<summary class="cmp-det-s">Details</summary>'), 'doc: Details disclosure present');

for (const [name, p] of [['crs', 'frontend/app/crs/page.tsx'], ['project-crs', 'frontend/components/soi-project-crs.tsx']] as const) {
  const s = R(p);
  ok(/>\s*Before\s*</.test(s.replace(/\n\s*/g, '')) || s.includes('              Before'), name + ': Before picker label');
  ok(s.includes('              After'), name + ': After picker label');
  ok(!s.includes('              Baseline'), name + ': Baseline gone');
  ok(s.includes('Before and After are the same version'), name + ': same-version message renamed');
  ok(s.includes('bg-amber-500/20 text-amber-300'), name + ': changed colour = amber token');
}
const slide = R('frontend/components/soi-slide-compare.tsx');
ok(slide.includes('          Before'), 'slide: Before picker label');
ok(slide.includes('          After'), 'slide: After picker label');
ok(!slide.includes('          Historical'), 'slide: Historical gone');
ok(slide.includes('bg-amber-500/20 text-amber-300'), 'slide: changed colour = amber token (was zinc)');

// The 32 chrome files all translate Before/After/Details on the new anchors
import { readdirSync } from 'node:fs';
const chromeDir = '/home/user/eXeL-AI-Polling/docs/i18n/chrome/';
let langs = 0;
for (const f of readdirSync(chromeDir).filter((x) => x.endsWith('.json'))) {
  const pairs = JSON.parse(readFileSync(chromeDir + f, 'utf8')) as [string, string][];
  const hasA = pairs.some((pr) => pr[0] === '<label for="cmpA">Before &middot; ');
  const hasB = pairs.some((pr) => pr[0] === '<label for="cmpB">After &middot; ');
  const hasD = pairs.some((pr) => pr[0] === '<summary class="cmp-det-s">Details</summary>');
  const stale = pairs.some((pr) => pr[0].startsWith('<label>Baseline <select'));
  ok(hasA && hasB && hasD && !stale, 'chrome ' + f + ': Before/After/Details anchored, stale pairs gone');
  langs++;
}
ok(langs === 32, '32 chrome files checked (' + langs + ')');
console.log(`compare-vocab-parity: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
