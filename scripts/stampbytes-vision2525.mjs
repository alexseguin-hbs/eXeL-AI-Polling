#!/usr/bin/env node
// stampbytes — the byte-count fixpoint, made a real script (Enlil CRS-98: the ritual
// named a "stampbytes" step no script implemented; the count drifted in silence).
// The living document prints its own byte size (#dlbytes2 + DL_BYTES) so a reader can
// match the page against the download. Editing the document changes its size, so the
// stamp must be re-solved: replace both stamps, re-measure, repeat until the printed
// number IS the file's size (converges in <4 rounds; digit-count changes shift length).
import { readFileSync, writeFileSync } from 'node:fs';
const P = new URL('../docs/SOI_VISION2525_LIVING_DOCUMENT.html', import.meta.url).pathname;

let s = readFileSync(P, 'utf8');
const m = s.match(/id="dlbytes2">(\d+)</);
const m2 = s.match(/const DL_BYTES = "(\d+)"/);
if (!m || !m2) { console.error('FAIL: byte stamps not found'); process.exit(1); }
if (m[1] !== m2[1]) { console.error(`FAIL: stamps disagree (${m[1]} vs ${m2[1]})`); process.exit(1); }

let printed = m[1];
for (let round = 0; round < 6; round++) {
  const actual = Buffer.byteLength(s, 'utf8');
  if (String(actual) === printed) {
    writeFileSync(P, s);
    const mb = (actual / 1e6).toFixed(1);
    if (!new RegExp(`id="dlsize2">${mb.replace('.', '\\.')}<`).test(s))
      s = s.replace(/id="dlsize2">[\d.]+</, `id="dlsize2">${mb}<`), writeFileSync(P, s);
    console.log(`stampbytes OK — ${actual} bytes printed and measured (round ${round})`);
    process.exit(0);
  }
  s = s.split(`id="dlbytes2">${printed}<`).join(`id="dlbytes2">${actual}<`)
       .split(`const DL_BYTES = "${printed}"`).join(`const DL_BYTES = "${actual}"`);
  printed = String(Buffer.byteLength(s, 'utf8')) === String(actual) ? String(actual) : String(actual);
  // stamps now carry `actual`; loop re-measures (length may have shifted by digit count)
  const check = s.match(/id="dlbytes2">(\d+)</);
  printed = check[1];
}
console.error('FAIL: fixpoint did not converge');
process.exit(1);
