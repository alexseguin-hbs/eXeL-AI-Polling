// THE AIRCRAFT IS THE FOIL — and on this surface it has no other name.
//
// Operator 2026-09-16: "ensure camera and aircraft views are bow adopted to FOIL design (xbat), which we
// will not say in Drone-2525 so as not to upset Shield AI."
//
// That is a commercial and legal boundary, not a style preference, so it gets a gate rather than a habit.
// A name that is only avoided by remembering to avoid it is a name that ships the first time someone is in
// a hurry — and it would ship inside a generated file, a lexicon value or a CRS row, where nobody looks.
//
// THE ONE DECLARED EXCEPTION. `airframe.geometry.source` and `.sourceNote` cite the Security-2525 file path
// the geometry is derived from, because a derivation that cannot name its source cannot be verified, and
// the 2026-09-16 axis correction is recorded in that same note. The exception is written into the domain as
// `geometry.namingRule` — declared, not merely tolerated. If the operator wants the path gone too, the wire
// can be carried into a neutral location at the cost of a second copy that can drift.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(HERE, '..');
const ROOT = path.resolve(FRONTEND, '..');

/** The token, never written whole in this file's own prose either — it would trip its own scan. */
const TOKEN = new RegExp(['x', 'bat'].join('') + '|' + ['X', 'BAT'].join('-'), 'i');

/**
 * The provenance paths that may carry it. Everything here is a real filesystem location or a file:line
 * citation inside the correction record; nothing here is a word a person reads about the aircraft.
 */
const ALLOWED = [
  /docs\/security-2525\/[a-z0-9-]*wireframe\/[A-Za-z0-9_.-]+/g,
  /[a-z0-9_]*_3rdpass_wireframe\.(obj|py|cs|cpp|h)(:\d+(-\d+)?)?/g,
  /[a-z0-9_]*\.wire\.json/g,
  /scripts\/wire-[a-z-]+\.mjs/g,
];
const strip = (text) => ALLOWED.reduce((t, re) => t.replace(re, '«path»'), text);

/** Every file that IS Drone-2525, or that Drone-2525 ships. */
function surface() {
  const out = [];
  const walk = (dir, depth = 0) => {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e);
      // The operator's own package is carried byte-for-byte and is his, not ours; it is not our speech.
      if (p.includes('foil-package')) continue;
      if (statSync(p).isDirectory()) { if (depth < 3) walk(p, depth + 1); continue; }
      if (!/\.(ts|tsx|mjs|json|md|html)$/.test(e)) continue;
      out.push({ rel: path.relative(ROOT, p), text: readFileSync(p, 'utf8') });
    }
  };
  walk(path.join(ROOT, 'docs/drone-2525'));
  walk(path.join(FRONTEND, 'lib/drone-2525'));
  walk(path.join(FRONTEND, 'components/drone-2525'));
  walk(path.join(FRONTEND, 'app/drone-2525'));
  walk(path.join(FRONTEND, 'app/main/Drone-2525'));
  return out;
}

const files = surface();
ok(files.length > 20, `the scan actually reaches the surface (${files.length} files) — an empty scan passes everything`);
ok(files.some((f) => f.rel.endsWith('domain.gen.ts')), 'including the generated module the browser downloads');
ok(files.some((f) => f.rel.endsWith('CRS_DRONE-2525.md')), 'and the CRS, which is rendered at /crs');
ok(files.some((f) => f.rel.includes('exports/')), 'and the exports a partner is handed');

// ── THE RULE ────────────────────────────────────────────────────────────────────────────────────
let offenders = [];
for (const f of files) {
  const clean = strip(f.text);
  if (TOKEN.test(clean)) {
    const line = clean.split('\n').findIndex((l) => TOKEN.test(l)) + 1;
    offenders.push(`${f.rel}:${line}`);
  }
}
ok(offenders.length === 0, `Drone-2525 never says the other name outside a provenance path — found: ${offenders.join(', ')}`);

// ── AND IT DOES SAY "FOIL", SO THE RULE IS A RENAME AND NOT A DELETION ──────────────────────────
{
  const joined = files.map((f) => f.text).join('\n');
  ok(/\bFOIL\b/.test(joined), 'the aircraft has a name on this surface, and it is FOIL');
  const domain = JSON.parse(readFileSync(path.join(ROOT, 'docs/drone-2525/drone-2525.v00.00.json'), 'utf8'));
  ok(/foil/i.test(domain.airframe.geometry.scale), `and the declared scale carries it (${domain.airframe.geometry.scale})`);
  ok(typeof domain.airframe.geometry.namingRule === 'string' && domain.airframe.geometry.namingRule.length > 100,
     'the exception is DECLARED in the domain, not merely tolerated by this test');
  ok(/tests\/drone-naming/.test(domain.airframe.geometry.namingRule),
     'and the declaration names the gate that enforces it, so the two cannot drift apart');
  // The quarantine is real: the two fields that may carry it, and no third.
  const carriers = Object.entries(domain.airframe.geometry).filter(([, v]) => typeof v === 'string' && TOKEN.test(v)).map(([k]) => k);
  ok(carriers.every((k) => k === 'source' || k === 'sourceNote'),
     `only source and sourceNote carry it inside the geometry block (found: ${carriers.join(', ') || 'none'})`);
}

// ── NOTHING A PERSON READS ON SCREEN CARRIES IT ─────────────────────────────────────────────────
{
  const lex = readFileSync(path.join(FRONTEND, 'lib/lexicon-data.ts'), 'utf8');
  const droneKeys = [...lex.matchAll(/key:\s*"(drone|crew|si)\.[^"]+",\s*\n?\s*englishDefault:\s*"([^"]*)"/g)];
  ok(droneKeys.length > 50, `the lexicon scan finds the domain's keys (${droneKeys.length})`);
  const bad = droneKeys.filter(([, , v]) => TOKEN.test(v)).map(([, k]) => k);
  ok(bad.length === 0, `no translated string a person reads carries it — found: ${bad.join(', ')}`);
}

console.log(`\ndrone-naming: ${pass} passed, ${fail} failed · ${files.length} files on the surface · the aircraft is the FOIL`);
process.exit(fail ? 1 : 0);
