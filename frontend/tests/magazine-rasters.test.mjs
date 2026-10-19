// THE MAGAZINE ROW IS HIS PICTURES (operator 2026-10-12: "These are exact image ton-use; create final raster and use exact proportions" ·
// "height of all magazines, standing position and stop light need to be same"). docs/drone-2525/magazine/cut-magazine.py cuts the RELOAD ink,
// the count's gold frame and its green fill out of his reference picture (docs/asks/img/…shot40.png, hashed in the ask's sidecar — r.203; r.202 cut shots 30/31) and
// recolours the fill to his amber and red; the five rasters are 72×192 RGBA, pinned here by sha256, embedded in the deck as MAG_PNG. This gate
// holds (node-only, in prebuild): his pictures and the cut script carried; the five PNGs what they claim and pinned; the served AND the carried
// deck embed them byte-equal; the cards at his proportions (RELOAD 60, the count 42, the light 56, all 75 tall; the ink 18×48; the stance box
// against the light); the SVG magazines gone.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DECK_REV } from './deck-head.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const dir = path.join(ROOT, 'docs/drone-2525/magazine');
const served = fs.readFileSync(path.join(ROOT, 'frontend/public/drone-2525/play.html'), 'utf8');
const carried = fs.readFileSync(path.join(ROOT, `docs/drone-2525/operator-deck/drone-2525_r.${DECK_REV}.html`), 'utf8');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const PIN = {"reload-ink": "32f9dfac91d47cefde285768194b5f716608d03cf8c4c0aa56cbcc725af1b720", "count-frame": "b476d95135760e2ff9368ae429b854166c42d90f6c278082d4f2fa7d857c4c9d", "count-fill-green": "c1cea1c5d2ab0bdcffe712175f72d1bb3f830c3fffae814c73ea26e89f6d1670", "count-fill-amber": "a2e2e93f9287ede858cf2e83a0f6bf09f49f4690b2ba0945790a0db58e7aaaae", "count-fill-red": "3612b7711f06657ba97e32a76b2803b7d5434f457ea499602fe336aa93c3d2c2"};
const PIN_CUT = '938db80b0750d8cf33b2e5a0394efe0ae1fadd7693fdbd7e3930cbc575f2d870';
const sidecar = fs.readFileSync(path.join(ROOT, 'docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md.sha256'), 'utf8');
for (const pic of ['docs/asks/img/2026.10.11_18.56..53_drone2525_shot40.png']) {   // r.203: his reference (the two magazines at 10×, the counter at 30 with nineteen bars)
  const p = path.join(ROOT, pic); ok(fs.existsSync(p) && sidecar.includes(`${sha(fs.readFileSync(p))}  ${pic}`), `his picture is carried and in the ask's sidecar (${pic})`);
}
const cut = path.join(dir, 'cut-magazine.py');
ok(fs.existsSync(cut) && sha(fs.readFileSync(cut)) === PIN_CUT && /recolour/.test(fs.readFileSync(cut, 'utf8')), 'the cut script is carried beside the rasters and pinned');
const png = (b) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20), depth: b[24], ctype: b[25] });
let lines = '';
for (const name of Object.keys(PIN)) {
  const f = path.join(dir, name + '.png'); const b = fs.existsSync(f) ? fs.readFileSync(f) : Buffer.alloc(0);
  const isPng = b.length > 0 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])); const info = isPng ? png(b) : null;
  ok(isPng && info.w === 72 && info.h === 192 && info.depth === 8 && info.ctype === 6, `${name}.png is a 72×192 RGBA PNG (${info ? info.w + '×' + info.h : 'missing'})`);
  ok(b.length > 0 && b.length <= 20000, `${name}.png is under 20 KB (${b.length} B)`);
  ok(sha(b) === PIN[name], `${name}.png is the pinned cut of his picture (${sha(b).slice(0, 8)}…)`);
  const uri = 'data:image/png;base64,' + b.toString('base64');
  ok(served.includes(uri) && carried.includes(uri), `the served and the carried deck embed ${name}.png exactly (MAG_PNG)`);
  lines += `${sha(b)}  ${name}.png\n`;
}
{ const sc = fs.existsSync(path.join(dir, 'MAGAZINE.sha256')) ? fs.readFileSync(path.join(dir, 'MAGAZINE.sha256'), 'utf8').trim().split('\n') : []; ok(sc.length === 6 && sc.every(l => { const [h, n] = l.trim().split(/\s+/); return fs.existsSync(path.join(dir, n)) && sha(fs.readFileSync(path.join(dir, n))) === h; }) && sc.some(l => /BARS\.json$/.test(l)) && Object.keys(PIN).every(n => sc.some(l => l.endsWith('  ' + n + '.png'))), 'MAGAZINE.sha256 names the five carried rasters and BARS.json, each hash true'); }
ok(/const MAG_PNG=\{ink:'data:image\/png;base64,[^']+',frame:'data:image\/png;base64,[^']+',green:'data:image\/png;base64,[^']+',amber:'data:image\/png;base64,[^']+',red:'data:image\/png;base64,[^']+'\};/.test(served), 'MAG_PNG carries exactly his five rasters');
{ const bars = JSON.parse(fs.readFileSync(path.join(dir, 'BARS.json'), 'utf8')); const m = served.match(/const MAG_FILL_TOP=([0-9.]+), MAG_FILL_BOTTOM=([0-9.]+), MAG_BARS=(\d+), MAG_BAR_TOPS=(\[[^\]]*\]);/); ok(!!m && bars.bars === 30 && +m[1] === bars.tops_pct[0] && +m[2] === bars.bottom_pct && +m[3] === bars.bars && JSON.stringify(JSON.parse(m[4])) === JSON.stringify(bars.tops_pct), 'the deck\'s MAG_BAR_TOPS, MAG_FILL_TOP/BOTTOM and MAG_BARS equal BARS.json, the bars as measured in the cut'); }
ok(/<span class="magPic"><img id="magInk" alt="" src="data:image\/png;base64,/.test(served) && /<span class="magPic"><img id="magFrame" alt="" src="data:image\/png;base64,[^"]+"><img id="magFill" alt="" src="data:image\/png;base64,/.test(served) && !/<svg viewBox="0 0 48 96"/.test(served) && !/#magRibs/.test(served), 'the two cards carry his rasters and no SVG magazine remains');
ok(/#magWell button\{pointer-events:auto;left:0;min-height:0;width:60px\}/.test(served) && /#magWell \.body\{pointer-events:none;left:50%;transform:translateX\(-50%\);width:42px\}/.test(served) && /#magWell \.magPic\{position:relative;width:18px;height:48px;flex:none;margin-top:1px\}/.test(served) && /#magWell #magFill\{clip-path:inset\(var\(--cut,6\.5%\) 0 0 0\)\}/.test(served), 'his proportions: RELOAD 60×75, the count 42×75, the ink 18×48, the fill clipped from the top');
ok(!/#magFrame\{z-index/.test(served) && /const cut=r>=MAG_BARS\?MAG_BAR_TOPS\[0\]:\(r<=0\?MAG_FILL_BOTTOM:MAG_BAR_TOPS\[MAG_BARS-r\]\);/.test(served) && /push\('BARS_OVER_THE_GRID'/.test(served) && /ROUNDS_ARE_INSIDE_THE_MAGAZINE/.test(served), 'r.203: one bar per round, the bars painted over the frame (nothing raises the frame), and the two rows that measure it');
// DD-102 / DD-104 — THE BEHAVIOUR, NOT THE HASH. Nothing in this file ever asked WHERE the fill sits, so when
// r.203 (4adfe705) pushed it from 11.3 % to 32.0 % to clear the witness window, a full magazine stopped reading
// full and thirteen revisions shipped green over it. His own r0.178 picture measures 6.7 %; r.215 measures 39.2 %.
// These two are red on every revision from r.203 to r.215 — which is the proof they were always needed.
{ const bars = JSON.parse(fs.readFileSync(path.join(dir, 'BARS.json'), 'utf8'));
  const m = served.match(/const MAG_FILL_TOP=([0-9.]+), MAG_FILL_BOTTOM=([0-9.]+), MAG_BARS=(\d+), MAG_BAR_TOPS=(\[[^\]]*\]);/);
  const tops = m ? JSON.parse(m[4]) : [];
  ok(bars.tops_pct[0] <= 10 && !!m && Number(m[1]) === bars.tops_pct[0],
    `a FULL magazine reads full — the first bar starts within 10 % of the top (BARS.json ${bars.tops_pct[0]}%, deck MAG_FILL_TOP ${m ? m[1] : 'none'}%)`);
  // The loop MUST run to the magazine's CAPACITY, not to the bar count — looping to tops.length is how this
  // assertion passed on r.215 the first time it was written, because the collapse is at r = MAG_BARS…cap.
  const capM = served.match(/function magCap\(\)\{ return \(state\.rangeMode==='qual40'&&\+state\.challenge===0\)\?(\d+):(\d+); \}/);
  const cap = capM ? Number(capM[2]) : 0;
  const cut = (r) => r >= tops.length ? tops[0] : (r <= 0 ? Number(m[2]) : tops[tops.length - r]);
  const seen = new Set(); for (let r = 1; r <= cap; r++) seen.add(cut(r));
  ok(cap > 0 && tops.length > 0 && seen.size === cap,
    `every round draws its own picture — ${cap} rounds in a full magazine, ${seen.size} distinct fills (a clamp that collapses the top rounds hides them)`);
}
ok(/#app\.range #startLight\{display:flex;width:56px;height:75px;box-sizing:border-box;padding:3px 2px 2px;gap:0;justify-content:flex-start\}/.test(served) && /#startLight i\{width:10\.6px;height:10\.6px/.test(served) && /#magWell #posWell\{display:none;position:absolute;top:0;right:60px;width:75px;height:75px/.test(served) && !/@media \(max-width:367px\)/.test(served), 'the light at his proportion (56×75, the lamps 19 % of its width), the stance box against it; no narrow-phone rule needed');
ok(/const want=r<=5\?MAG_PNG\.red:\(r<20\?MAG_PNG\.amber:MAG_PNG\.green\);/.test(served) && /const tone=r<=5\?'#E24B3B':\(r<20\?'#F0A020':'#3DCC8A'\);/.test(served), 'the fill and the number follow his colour rule (green ≥ 20 · amber 6–19 · red ≤ 5)');
ok(/push\('MAGAZINE_IS_HIS_DRAWING'/.test(served) && /push\('MAGAZINE_KEEPS_ITS_FRAME'/.test(served) && /his rasters '\+his\+/.test(served), 'the deck measures his rasters and the clip on the built page');
console.log(`\nmagazine-rasters: ${pass} passed, ${fail} failed · his three pictures as rasters, pinned, embedded byte-equal in r.${DECK_REV}, the row at his proportions`);
process.exit(fail ? 1 : 0);
