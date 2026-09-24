#!/usr/bin/env node
// ONE STAMP PER BUILD (fleet r.147, Krishna): the export must carry exactly one build date/time and one 7-hex sha across
// every HTML page and chunk, or the 2525 surfaces hydrate against a different stamp than they rendered (React #425,
// 2026-09-23). Runs in `postbuild`, so the door that ships (Cloudflare's `npm run build`) refuses a split stamp.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const OUT = new URL('../out', import.meta.url).pathname;
const walk = (d, acc = []) => { for (const f of readdirSync(d)) { const p = join(d, f); const st = statSync(p); if (st.isDirectory()) walk(p, acc); else if (/\.(html|js)$/.test(f)) acc.push(p); } return acc; };
let files; try { files = walk(OUT); } catch { console.log('stamp-count: no out/ — nothing exported, nothing to count'); process.exit(1); }
// The layout renders `Date: <span>YYYY.MM.DD</span> | Time: <span>HH:MM CST</span> | SHA: <span>sha</span>` in the HTML and the
// same three strings inside the RSC payload of every page and chunk — so each is counted as a SET across every file, and a
// set of two is the split stamp this gate exists to refuse.
const dates = new Set(), times = new Set(), shas = new Set();
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/\b(\d{4}\.\d{2}\.\d{2})\b/g)) if (/Date:[\s\S]{0,120}$/.test(t.slice(Math.max(0, m.index - 120), m.index))) dates.add(m[1]);
  for (const m of t.matchAll(/\b(\d{2}:\d{2}) CST\b/g)) times.add(m[1]);
  for (const m of t.matchAll(/SHA:\s*(?:<[^>]*>\s*)?([0-9a-f]{7})\b/g)) shas.add(m[1]);
  for (const m of t.matchAll(/SHA:[\s\S]{0,160}?children\\?"?:\\?"([0-9a-f]{7})\\?"/g)) shas.add(m[1]);
}
const ok = dates.size >= 1 && dates.size <= 1 && times.size >= 1 && times.size <= 1 && shas.size >= 1 && shas.size <= 1;
console.log(`stamp-count: ${files.length} files · dates ${[...dates].join(', ') || '(none)'} · times ${[...times].join(', ') || '(none)'} · shas ${[...shas].join(', ') || '(none)'} → ${ok ? 'ONE stamp' : dates.size + times.size + shas.size === 0 ? 'NO STAMP FOUND — refuse' : 'SPLIT STAMP — refuse'}`);
process.exit(ok ? 0 : 1);
