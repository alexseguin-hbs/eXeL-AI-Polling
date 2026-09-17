// P1-2 — AMBER vs RED IS THE ONE THING THE DEMO MUST TEACH, and it must read without colour. The T-box
// carries the phase in its SHAPE (single bracket amber, double bracket red), the LOCK reticle is AIM and is
// never drawn in the fire colour, and the boresight is a real inverse of the aim. Pure + source-level.
import fs from 'node:fs';
import { boresightAt, aimAt } from '../lib/drone-2525/gimbal.ts';
import { tboxPath } from '../lib/drone-2525/tap-target.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

// ── BORESIGHT INVERTS AIM ────────────────────────────────────────────────────────────────────────
const eye = [12, -30, 18];
for (const s of [{ az: 37, el: 12 }, { az: 200, el: -8 }, { az: 359, el: 0 }]) {
  const gs = { ...s, cmdAz: s.az, cmdEl: s.el };
  const p = boresightAt(eye, gs, 150);
  const a = aimAt(eye, p);
  ok(near(a.az, s.az, 1e-4) && near(a.el, s.el, 1e-4) && near(a.rangeM, 150, 1e-3),
    `boresightAt(${s.az},${s.el}) then aimAt returns it (az ${a.az.toFixed(2)} el ${a.el.toFixed(2)} r ${a.rangeM.toFixed(1)})`);
}

// ── THE T-BOX CARRIES THE PHASE IN ITS SHAPE ─────────────────────────────────────────────────────
const amber = tboxPath(100, 100, 14, 2, 'amber');
const red = tboxPath(100, 100, 14, 2, 'red');
const nM = (s) => (s.match(/M/g) ?? []).length;
ok(amber !== red, 'amber and red T-boxes are DIFFERENT shapes — not the same box in a different hue');
ok(nM(red) - nM(amber) === 4, `red adds a second bracket ring (four more strokes: ${nM(amber)} → ${nM(red)})`);
ok(tboxPath(100, 100, 14, 2).length === amber.length, 'the default phase is amber (a mark that cannot fire)');
ok(nM(tboxPath(0, 0, 14, 3, 'amber')) === nM(tboxPath(0, 0, 14, 1, 'amber')) + 2, 'the slot number is drawn as n ticks');

// ── LOCK IS AIM, NEVER AUTHORITY ─────────────────────────────────────────────────────────────────
const overlay = fs.readFileSync(new URL('../components/drone-2525/round-overlay.tsx', import.meta.url), 'utf8');
const lockLine = overlay.split('\n').find((l) => l.includes('data-drone-lock'));
ok(Boolean(lockLine) && /semanticHex\("frustum"\)/.test(lockLine) && !/"ray"/.test(lockLine), 'the LOCK reticle is drawn in the neutral frustum colour, never the fire colour');
ok(/data-drone-tbox-phase=\{d\.phase\}/.test(overlay) && /tboxPath\([^)]*d\.phase\)/.test(overlay), 'the overlay draws the T-box in its slot phase');
const hud = fs.readFileSync(new URL('../components/drone-2525/engagement-hud.tsx', import.meta.url), 'utf8');
const hudLock = hud.split('\n').find((l) => l.includes('data-drone-lock-line'));
ok(Boolean(hudLock) && /semanticHex\("frustum"\)/.test(hudLock), 'the HUD lock line is aim-coloured, never red');
ok(/data-drone-armed/.test(hud) && /semanticHex\("ray"\)/.test(hud.split('\n').find((l) => l.includes('data-drone-armed'))), 'ARMED — and only ARMED — is drawn in the fire colour');

// ── THE LEGEND TEACHES THE SHAPES, IN WORDS ──────────────────────────────────────────────────────
const lex = fs.readFileSync(new URL('../lib/lexicon-data.ts', import.meta.url), 'utf8');
const legend = lex.match(/drone\.hud\.legend", englishDefault: "([^"]*)"/)?.[1] ?? '';
ok(/MARKED/.test(legend) && /ARMED/.test(legend) && /bracket/.test(legend), 'the legend names both shapes and both states');
const armed = lex.match(/drone\.hud\.armed", englishDefault: "([^"]*)"/)?.[1] ?? '';
ok(/approved/.test(armed) && /fire/.test(armed), 'ARMED says, in words, that the gate is open');

console.log(`\ndrone-glass: ${pass} passed, ${fail} failed · amber vs red by SHAPE + WORD · LOCK is aim, never red · boresight inverts aim`);
process.exit(fail ? 1 : 0);
