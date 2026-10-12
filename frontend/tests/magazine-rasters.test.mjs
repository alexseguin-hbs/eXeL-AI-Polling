// THE MAGAZINE ROW IS HIS PICTURES (operator 2026-10-12: "These are exact image ton-use; create final raster and use exact proportions" ·
// "height of all magazines, standing position and stop light need to be same"). docs/drone-2525/magazine/cut-magazine.py cuts the RELOAD ink,
// the count's gold frame and its green fill out of his pictures (docs/asks/img/…shot31.png and …shot30.png, hashed in the ask's sidecar) and
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
const PIN = {"reload-ink": "eabdbe2a6d910301c05bbe59d281eb5ec9b1e3d38f198ad446896e2892aeb453", "count-frame": "c019a3f1e6ffa76b1c54918fafed99171d8c1a24abdc586457ea464de7bd7305", "count-fill-green": "6d7bacdf91b26b7d74738fc9b068d88794efb3e58dd79ec4ff3c763ea197b1f9", "count-fill-amber": "ada7a9822fd9f86325f65a46438fe719a29eff8dcb261ef4a1e6a181b3f68286", "count-fill-red": "8a1d60637300642f5aea538858e9b60a1e99d8d8a44124d77be4ffe84487a847"};
const PIN_CUT = '7f6ba02fa6b6a8339a3296c8aebf707730a948c19fa1fd2642ff8113945435ef';
const sidecar = fs.readFileSync(path.join(ROOT, 'docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md.sha256'), 'utf8');
for (const pic of ['docs/asks/img/2026.10.11_18.56..53_drone2525_shot30.png', 'docs/asks/img/2026.10.11_18.56..53_drone2525_shot31.png']) {
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
ok(fs.existsSync(path.join(dir, 'MAGAZINE.sha256')) && fs.readFileSync(path.join(dir, 'MAGAZINE.sha256'), 'utf8') === lines, 'MAGAZINE.sha256 names the five carried rasters');
ok(/const MAG_PNG=\{ink:'data:image\/png;base64,[^']+',frame:'data:image\/png;base64,[^']+',green:'data:image\/png;base64,[^']+',amber:'data:image\/png;base64,[^']+',red:'data:image\/png;base64,[^']+'\};/.test(served), 'MAG_PNG carries exactly his five rasters');
ok(/const MAG_FILL_TOP=11\.3, MAG_FILL_BOTTOM=92\.0;/.test(served), 'the fill\'s extent in the frame canvas is the measured one');
ok(/<span class="magPic"><img id="magInk" alt="" src="data:image\/png;base64,/.test(served) && /<span class="magPic"><img id="magFrame" alt="" src="data:image\/png;base64,[^"]+"><img id="magFill" alt="" src="data:image\/png;base64,/.test(served) && !/<svg viewBox="0 0 48 96"/.test(served) && !/#magRibs/.test(served), 'the two cards carry his rasters and no SVG magazine remains');
ok(/#magWell button\{pointer-events:auto;left:0;min-height:0;width:60px\}/.test(served) && /#magWell \.body\{pointer-events:none;left:50%;transform:translateX\(-50%\);width:42px\}/.test(served) && /#magWell \.magPic\{position:relative;width:18px;height:48px;flex:none;margin-top:1px\}/.test(served) && /#magWell #magFill\{clip-path:inset\(var\(--cut,11\.3%\) 0 0 0\)\}/.test(served), 'his proportions: RELOAD 60×75, the count 42×75, the ink 18×48, the fill clipped from the top');
ok(/#app\.range #startLight\{display:flex;width:56px;height:75px;box-sizing:border-box;padding:3px 2px 2px;gap:0;justify-content:flex-start\}/.test(served) && /#startLight i\{width:10\.6px;height:10\.6px/.test(served) && /#magWell #posWell\{display:none;position:absolute;top:0;right:60px;width:75px;height:75px/.test(served) && !/@media \(max-width:367px\)/.test(served), 'the light at his proportion (56×75, the lamps 19 % of its width), the stance box against it; no narrow-phone rule needed');
ok(/const want=r<=5\?MAG_PNG\.red:\(r<20\?MAG_PNG\.amber:MAG_PNG\.green\);/.test(served) && /const tone=r<=5\?'#E24B3B':\(r<20\?'#F0A020':'#3DCC8A'\);/.test(served), 'the fill and the number follow his colour rule (green ≥ 20 · amber 6–19 · red ≤ 5)');
ok(/push\('MAGAZINE_IS_HIS_DRAWING'/.test(served) && /push\('MAGAZINE_KEEPS_ITS_FRAME'/.test(served) && /his rasters '\+his\+/.test(served), 'the deck measures his rasters and the clip on the built page');
console.log(`\nmagazine-rasters: ${pass} passed, ${fail} failed · his three pictures as rasters, pinned, embedded byte-equal in r.${DECK_REV}, the row at his proportions`);
process.exit(fail ? 1 : 0);
