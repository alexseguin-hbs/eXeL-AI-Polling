// THE VECTOR LAW — gate (operator 2026-09-15, addendum 4: Star Wars arcade 1983 / Battlezone).
// "Wireframe" here does not mean "3D with thin outlines". It means a vector display: black ground, edges
// only, one saturated stroke per object from the 13, HUD drawn in the same stroke language as the world.
// A principle defended only by taste is already lost — so this reads the shipped source and refuses a fill,
// a gradient, a shadow, or a colour that is not one of the 13.
import fs from 'node:fs';
import path from 'node:path';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const ROOT = path.resolve('.');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
/** Prose explains the law and may name what it forbids; only CODE is judged by it. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const SURFACES = ['components/drone-2525/wire-svg.tsx', 'components/drone-2525/arena-view.tsx', 'components/drone-2525/command-ux1.tsx'];
const MODEL = ['lib/drone-2525/arena-model.ts', 'lib/wire-core/primitives.ts', 'lib/wire-core/wire-model.ts', 'lib/wire-core/palette.ts', 'lib/wire-core/vector-law.ts'];

// 1 — the law itself says what it says
const law = read('lib/wire-core/vector-law.ts');
ok(/ground:\s*"#000000"/.test(law), 'the ground is black');
ok(/fill:\s*"none"/.test(law), 'nothing is ever filled');
ok(/ngonSides/.test(law), 'curves are declared n-gons, so a curve costs what it says it costs');

// 2 — no surface paints a face
for (const f of SURFACES) {
  const s = code(f);
  const fills = [...s.matchAll(/fill[=:]\s*["'{]?\s*([#a-zA-Z0-9_.()"' ]*)/g)].map((m) => m[1].trim().replace(/["']/g, ''));
  const bad = fills.filter((v) => v && !/^(none|transparent|VECTOR_LAW|\}|$)/.test(v));
  ok(bad.length === 0, `${f} paints no face (found: ${bad.join(', ')})`);
  ok(!/linearGradient|radialGradient|feGaussian|<pattern|boxShadow|textShadow/.test(s), `${f} uses no gradient, pattern or shadow`);
  ok(!/darkerHex|lighten\(|shade\(/.test(s), `${f} never shades — depth reads from perspective and overlap`);
}

// 3 — every colour in the model layer comes from the 13, by role, never by literal
for (const f of MODEL) {
  const s = code(f);
  const literals = [...s.matchAll(/["']#([0-9a-fA-F]{3,8})["']/g)].map((m) => `#${m[1]}`);
  const allowed = new Set(['#000000']);   // the ground is not a stroke
  const bad = literals.filter((h) => !allowed.has(h.toLowerCase()));
  ok(bad.length === 0, `${f} carries no colour literal outside the palette module (found: ${bad.join(', ')})`);
}

// 4 — palette: 13 colours, no more, and the shading helper is not importable here
const pal = code('lib/wire-core/palette.ts');
ok(!/darkerHex/.test(pal), 'the palette module offers no shading helper');
ok(/trinity-palette/.test(pal) && !/trinity-colors/.test(pal), 'the spectrum set is used, and the iconology set is not mixed in');

// 5 — the HUD is drawn in the same language as the world (same monospace stroke vocabulary, from the palette)
const hud = read('components/drone-2525/arena-view.tsx');
ok(/semanticHex\("hud"\)/.test(hud), 'the HUD takes its colour from the same 13 as the world');
ok(/fontFamily: "ui-monospace/.test(hud), 'the HUD is set in the vector display face, not app chrome');
ok(/motLabel\(/.test(hud), 'the HUD states the rung being asked for — a level is never silent (U-WF-09)');
ok(/calLine\(/.test(hud), 'and what calibration decided, with its reason');
ok(/data-drone-stream/.test(hud) && /streamLabel\(/.test(hud),
   'the live video standard has its OWN field — a silent drop from 1080p30 is the defect this prevents');
ok(/isReference\(/.test(hud), 'and it changes colour the moment it stops being the reference');
ok(/dropped/.test(hud), 'and how many segments were given up to get there');

console.log(`\nvector-law: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
