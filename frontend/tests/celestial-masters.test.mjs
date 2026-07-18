/**
 * CELESTIAL-2525 · master-matching test — each body is guided by ITS best-fit Ascended Master,
 * all 12 distinct (never "all written by Thoth"). Run: node --experimental-strip-types tests/celestial-masters.test.mjs
 */
import { CELESTIAL_BODIES } from '../lib/celestial-guide-data.ts';

const EXPECT = {
  sun: 'Krishna', mercury: 'Thoth', venus: 'Aset', earth: 'Christo', moon: 'Sofia', mars: 'Thor',
  jupiter: 'Enlil', saturn: 'Odin', uranus: 'Pangu', neptune: 'Enki', pluto: 'Asar', polaris: 'Athena',
};
let pass = 0, fail = 0;
const rec = (n, ok, d = '') => { (ok ? pass++ : fail++); console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? '  (' + d + ')' : ''}`); };

for (const b of CELESTIAL_BODIES) rec(`${b.name.padEnd(20)} → ${b.master}`, b.master === EXPECT[b.id], b.master === EXPECT[b.id] ? '' : `expected ${EXPECT[b.id]}`);
const masters = CELESTIAL_BODIES.map((b) => b.master);
rec('all 12 masters distinct (not all one master)', new Set(masters).size === 12 && masters.length === 12, `distinct=${new Set(masters).size}/${masters.length}`);
rec('every body has content at all 4 reading levels', CELESTIAL_BODIES.every((b) => b.text.kids && b.text.middle && b.text.high && b.text.adult), '');

console.log(`\nCELESTIAL-MASTERS ${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
