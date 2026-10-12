// THE FIVE POSITIONS ARE THE OPERATOR'S OWN PICTURE, CUT EXACTLY (operator 2026-10-12: "use my images exactly for 5 shooting positions" ·
// "DO NOT USE your images BUT eXeL AI corrected inages" · "STOP TRYING YOURS USE MINE / DELETE THE ORIGINAL AND USE eXeL AI"). His picture is
// on the record (docs/asks/img/…shot12.png, hashed in the ask's sidecar); docs/drone-2525/poses/cut-stances.py cuts the five figures out of it
// as connected shapes — nothing redrawn, the rifle its own colour as he drew it — and writes stance-0..4.png (RGBA, longest side 256) with
// POSES.sha256. This gate holds (node-only, in prebuild): his picture and the cut script are carried; the five PNGs are what they claim; the
// served AND the carried deck embed exactly those bytes as POSE_PNG; his five words in his order; the engagement → pose table exact; the box
// sits against the light (CSS); the traced figures of r.198 and their tracer are gone ("DELETE THE ORIGINAL").
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DECK_REV } from './deck-head.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const dir = path.join(ROOT, 'docs/drone-2525/poses');
const served = fs.readFileSync(path.join(ROOT, 'frontend/public/drone-2525/play.html'), 'utf8');
const carried = fs.readFileSync(path.join(ROOT, `docs/drone-2525/operator-deck/drone-2525_r.${DECK_REV}.html`), 'utf8');
const WORDS = ['TACTICAL STANDING', 'UNSUPPORTED PRONE', 'SUPPORTED PRONE', 'SUPPORTED KNEELING', 'SUPPORTED STANDING'];
const MAP = [0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
const sha = (b) => createHash('sha256').update(b).digest('hex');
// THE BYTES OF THIS SHIP, PINNED (review of r.199, Enlil: a redrawn figure with a regenerated POSES.sha256 would have passed) — the five figures and
// the cut script are these exact bytes; a new cut is a new revision that moves these lines on the record.
const PIN = ['aaea366f4852d9718f65a341cb3da59712f3eb2ccdf5eab9ee5feab222853a14', '0e192273216bf33c9dcb7dd00f5b5e48350e0a40249f70ab33b190c6e0293532', '8b9dfb41b4c5e16716123abffd84a1360de58f0433a8459645e6151a2a1ef607', '3554ecb8d814c0e17e8905c2f20aa597b7f8960325003213a51f8524bab7e1d6', '300c654f301d97f2be830bcf9d799488713aebcef87e4cdda62e69d0c05878fb'];
const PIN_CUT = 'bc673fda3a56ae886eb3f1434eeaf25b02f75e754e7c02a75ef32bde78a5b253';
// his picture, on the record
const PIC = 'docs/asks/img/2026.10.11_18.56..53_drone2525_shot12.png';
const picPath = path.join(ROOT, PIC);
ok(fs.existsSync(picPath), `his picture is carried (${PIC})`);
const sidecar = fs.readFileSync(path.join(ROOT, 'docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md.sha256'), 'utf8');
ok(fs.existsSync(picPath) && sidecar.includes(`${sha(fs.readFileSync(picPath))}  ${PIC}`), 'his picture\'s sha256 is in the ask\'s sidecar (PERSIST FIRST)');
const cut = path.join(dir, 'cut-stances.py');
ok(fs.existsSync(cut) && /connected shape/.test(fs.readFileSync(cut, 'utf8')) && /stance-\{i\}\.png/.test(fs.readFileSync(cut, 'utf8')), 'the cut script is carried beside the figures (each figure its own connected shape, nothing redrawn)');
ok(fs.existsSync(cut) && sha(fs.readFileSync(cut)) === PIN_CUT, 'the cut script is the pinned one (its sha256 on the record)');
// the originals are deleted
for (const gone of ['docs/drone-2525/poses/pose-0.png', 'docs/drone-2525/poses/pose-1.png', 'docs/drone-2525/poses/pose-2.png', 'docs/drone-2525/poses/pose-3.png', 'docs/drone-2525/poses/pose-4.png', 'docs/drone-2525/poses/poses.v2.json', 'frontend/scripts/trace-poses.mjs']) ok(!fs.existsSync(path.join(ROOT, gone)), `the traced original is gone: ${gone} (operator: "DELETE THE ORIGINAL")`);
// the five figures
const png = (b) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20), depth: b[24], ctype: b[25] });
let shaLines = '';
for (let i = 0; i < 5; i++) {
  const f = path.join(dir, `stance-${i}.png`); const b = fs.existsSync(f) ? fs.readFileSync(f) : Buffer.alloc(0);
  const isPng = b.length > 0 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const info = isPng ? png(b) : null;
  ok(isPng && Math.max(info.w, info.h) === 256 && info.w <= 256 && info.h <= 256 && info.depth === 8 && info.ctype === 6, `stance-${i}.png (${WORDS[i]}) is an RGBA PNG with its longest side 256 (${info ? info.w + '×' + info.h : 'missing'})`);
  ok(b.length > 0 && b.length <= 65536, `stance-${i}.png is under 64 KB (${b.length} B)`);
  const uri = 'data:image/png;base64,' + b.toString('base64');
  ok(served.includes(uri) && carried.includes(uri), `the served and the carried deck embed stance-${i}.png exactly (POSE_PNG[${i}])`);
  ok(sha(b) === PIN[i], `stance-${i}.png is the pinned cut of his picture (${sha(b).slice(0, 8)}… vs ${PIN[i].slice(0, 8)}…) — never redrawn`);
  shaLines += `${sha(b)}  stance-${i}.png\n`;
}
ok(fs.existsSync(path.join(dir, 'POSES.sha256')) && fs.readFileSync(path.join(dir, 'POSES.sha256'), 'utf8') === shaLines, 'POSES.sha256 names the five carried figures');
// the deck: his words, the table, one image node, five URIs, the box against the light
ok(served.includes(`const POSES=['${WORDS.join("','")}'];`) && served.includes(`const POSE_BY_ENG=[${MAP.join(',')}];`), 'the deck declares his five words in his order and the engagement → pose table (1 TACTICAL STANDING · 2–5 UNSUPPORTED PRONE · 6–10 SUPPORTED PRONE · 11–14 SUPPORTED KNEELING · 15–18 SUPPORTED STANDING)');
ok(((served.match(/const POSE_PNG=\[([^\]]*)\]/) || ['', ''])[1].match(/data:image\/png;base64,/g) || []).length === 5 && (served.match(/<img id="posImg"/g) || []).length === 1 && (served.match(/<span id="posPic">/g) || []).length === 1, 'POSE_PNG carries exactly five PNG data URIs; the deck has one figure box and one image node');
ok(/#magWell #posWell\{display:none;position:absolute;top:0;right:76px;width:75px;height:75px;box-sizing:border-box;border:1px solid #1C2A3A;border-radius:12px/.test(served) && /#app\.range #startLight\{display:flex;width:72px;height:75px;box-sizing:border-box;padding:2px 3px;gap:2px;justify-content:center\}/.test(served) && /#magWell #posPic\{width:69px;height:52px;flex:none;display:flex;align-items:flex-end;justify-content:center/.test(served) && /#magWell #posImg\{max-width:69px;max-height:52px;width:auto;height:auto/.test(served), 'the box is a 75-px square against the light\'s left edge (the light one width, 72, the row\'s height), the figure fitted in 69×52 with its shape kept');
ok(!/trace-poses\.mjs|poses\.v2\.json/.test(served), 'the deck no longer names the tracer or its recipe');
ok(/\{ph:1,pos:'TACTICAL STANDING → UNSUPPORTED PRONE',eng:/.test(served) && /\{ph:2,pos:'SUPPORTED PRONE',eng:/.test(served) && /\{ph:3,pos:'SUPPORTED KNEELING',eng:/.test(served) && /\{ph:4,pos:'SUPPORTED STANDING',eng:/.test(served) && /#magWell #posName\{[^}]*color:#7AB8C4/.test(served), 'the toast between phases says his words too, and the word under the figure is the cyan of his cards');
console.log(`\npose-rasters: ${pass} passed, ${fail} failed · his five figures, cut from his own picture, embedded byte-equal in r.${DECK_REV}, the box against the light`);
process.exit(fail ? 1 : 0);
