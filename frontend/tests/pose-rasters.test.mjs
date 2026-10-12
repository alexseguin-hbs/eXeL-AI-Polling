// THE FIVE POSITIONS ARE THE OPERATOR'S OWN FIGURES, CARRIED AS ONE RECORD (operator 2026-10-11: "I want clear rasters for 5 shooting
// positions" · "standing; Prone unsupported, Prone Supported, Kneeling Supported, Standing Supported" · 2026-10-12: "dont use stick
// figures; better high resolution modern images, make gun different color than person"). docs/drone-2525/poses/pose-0..4.png are traced
// from his TC 3-22.9 pages by scripts/trace-poses.mjs (the recipe in poses.v2.json): 256×256, a 2-bit palette of exactly the deck's own
// colours — transparent · the PERSON (T13.SI) · outline (T13.ROAD) · the RIFLE (T13.DOME) — so the gun is never the person's colour.
// This gate holds (node-only, in prebuild): the carried PNGs are what they claim (header, size, palette), POSES.sha256 names them, the
// served AND the carried deck embed exactly those bytes as POSE_PNG, the five words in his order, the engagement → pose table exact.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DECK_REV } from './deck-head.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const dir = path.join(ROOT, 'docs/drone-2525/poses');
const recipe = JSON.parse(fs.readFileSync(path.join(dir, 'poses.v2.json'), 'utf8'));
const served = fs.readFileSync(path.join(ROOT, 'frontend/public/drone-2525/play.html'), 'utf8');
const carried = fs.readFileSync(path.join(ROOT, `docs/drone-2525/operator-deck/drone-2525_r.${DECK_REV}.html`), 'utf8');
const WORDS = ['STANDING', 'PRONE UNSUPPORTED', 'PRONE SUPPORTED', 'KNEELING SUPPORTED', 'STANDING SUPPORTED'];
const MAP = [0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
const t13 = (served.match(/const T13=\{[^}]*\}/) || [''])[0];
const colourOf = (name) => (t13.match(new RegExp(name + ":'(#[0-9A-Fa-f]{6})'")) || [])[1];
const PERSON = colourOf('SI'), OUTLINE = colourOf('ROAD'), RIFLE = colourOf('DOME');
ok(!!PERSON && !!OUTLINE && !!RIFLE && recipe.palette[1].toUpperCase() === PERSON.toUpperCase() && recipe.palette[2].toUpperCase() === OUTLINE.toUpperCase() && recipe.palette[3].toUpperCase() === RIFLE.toUpperCase(), `the recipe's three colours are the deck's own T13 (person ${PERSON} · outline ${OUTLINE} · rifle ${RIFLE})`);
ok(recipe.poses.length === 5 && recipe.poses.map((p) => p.word).join('|') === WORDS.join('|') && recipe.poses.every((p, i) => p.id === i && /shot[3-7]\.jpg$/.test(p.src)), 'five poses, his five words in his order, ids 0..4, each traced from one of his five pages');
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const png = (b) => { const w = b.readUInt32BE(16), h = b.readUInt32BE(20), depth = b[24], ctype = b[25]; let i = 33, plte = null; while (i < b.length) { const len = b.readUInt32BE(i), type = b.toString('latin1', i + 4, i + 8); if (type === 'PLTE') plte = b.subarray(i + 8, i + 8 + len); i += 12 + len; } return { w, h, depth, ctype, plte }; };
let shaLines = '';
for (const p of recipe.poses) {
  const f = path.join(dir, `pose-${p.id}.png`); const b = fs.existsSync(f) ? fs.readFileSync(f) : Buffer.alloc(0);
  const ok1 = b.length > 0 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const info = ok1 ? png(b) : null;
  ok(ok1 && info.w === recipe.size && info.h === recipe.size && info.depth === 2 && info.ctype === 3, `pose-${p.id}.png (${p.word}) is a ${recipe.size}×${recipe.size} 2-bit palette PNG`);
  const want = Buffer.from([0, 0, 0, ...hex(PERSON), ...hex(OUTLINE), ...hex(RIFLE)]);
  ok(ok1 && info.plte && info.plte.equals(want), `pose-${p.id}.png's palette is transparent · person · outline · rifle — the rifle a different colour than the person`);
  ok(b.length <= 20000, `pose-${p.id}.png is under 20 KB (${b.length} B)`);
  const uri = 'data:image/png;base64,' + b.toString('base64');
  ok(served.includes(uri) && carried.includes(uri), `the served and the carried deck embed pose-${p.id}.png exactly (POSE_PNG[${p.id}])`);
  shaLines += `${createHash('sha256').update(b).digest('hex')}  pose-${p.id}.png\n`;
}
ok(fs.readFileSync(path.join(dir, 'POSES.sha256'), 'utf8') === shaLines, 'POSES.sha256 names the five carried rasters');
ok(served.includes(`const POSES=['${WORDS.join("','")}'];`) && served.includes(`const POSE_BY_ENG=[${MAP.join(',')}];`), 'the deck declares the five words and the engagement → pose table exactly (1 STANDING · 2–5 PRONE UNSUPPORTED · 6–10 PRONE SUPPORTED · 11–14 KNEELING SUPPORTED · 15–18 STANDING SUPPORTED)');
ok(((served.match(/const POSE_PNG=\[([^\]]*)\]/) || ['', ''])[1].match(/data:image\/png;base64,/g) || []).length === 5 && (served.match(/<img id="posImg"/g) || []).length === 1, 'POSE_PNG carries exactly five PNG data URIs and the deck one pose image node');
ok(fs.existsSync(path.join(ROOT, 'frontend/scripts/trace-poses.mjs')) && /white interior/i.test(fs.readFileSync(path.join(ROOT, 'frontend/scripts/trace-poses.mjs'), 'utf8')), 'the tracer that made them is carried beside the recipe');
console.log(`\npose-rasters: ${pass} passed, ${fail} failed · five high-resolution figures from the operator's pages, the rifle in its own colour, embedded byte-equal in r.${DECK_REV}`);
process.exit(fail ? 1 : 0);
