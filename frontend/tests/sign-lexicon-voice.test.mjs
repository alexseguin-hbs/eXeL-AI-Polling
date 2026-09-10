// THE SIGNER NEVER MEETS THE MACHINE (operator 2026-09-10).
// A person signing a document was being shown our database's internals: "Migration 036 is not applied on this site's
// Supabase", "Copy migration 036 SQL", "no Supabase on this build". None of that is his world and he cannot act on it.
// This gate keeps the signing surface free of our plumbing, in every language, mechanically rather than by memory.
import fs from 'fs';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// the vocabulary of the machine — never on a screen a signer can reach
const BANNED = /supabase|migration|\bsql\b|\brpc\b|\b03[6-9]\b|localstorage|sessionstorage|\bquota\b|backend|NEXT_PUBLIC|\bschema\b|\bendpoint\b|postgres|pgcrypto/i;
// keys that belong to the OPERATOR's own door (?diag=1) — technical by design, never rendered on a signer's path
const OPERATOR = (k) => k.startsWith('soi.sign.diag.');
// the old infrastructure error strings stay in the lexicon for that door and for the record; the flow must never render them
const RETIRED = ['no_backend', 'no_migration', 'migration_incomplete', 'rpc_error', 'unreachable', 'timeout', 'storage_full', 'slow_done', 'duplicate'].map((c) => `soi.sign.err.${c}`);

// 1 · the English source
const data = fs.readFileSync(new URL('../lib/lexicon-data.ts', import.meta.url), 'utf8');
const entries = [...data.matchAll(/\{\s*key:\s*"(soi\.sign\.[^"]+)"\s*,\s*englishDefault:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => [m[1], m[2]]);
ok(entries.length > 150, `the sign lexicon was read (${entries.length} keys)`);
const bad = entries.filter(([k, v]) => !OPERATOR(k) && !RETIRED.includes(k) && BANNED.test(v));
ok(bad.length === 0, `English: no signer-facing string names the machine — ${bad.map(([k]) => k).join(', ')}`);

// 2 · the flow renders NONE of the retired keys, in any form
const flow = fs.readFileSync(new URL('../components/sign/sign-flow.tsx', import.meta.url), 'utf8');
const render = flow.slice(flow.indexOf('return ('));                       // the JSX only
ok(!/soi\.sign\.diag\./.test(render.replace(/\{diagOn &&[^\n]*\n/, '')), 'the diag strings appear only behind ?diag=1');
ok(/signerErr\(/.test(flow) && /DEVICE_ONLY/.test(flow), 'every store failure is funnelled through one signer-facing sentence');
ok(!/SqlRoute/.test(flow), 'no SQL route on the signing surface');
ok(/soi\.sign\.err\.device_only/.test(flow), 'the human sentence is the one the flow reaches for');

// 3 · every language, same rule
const dir = new URL('../lib/i18n-sign/', import.meta.url);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
ok(files.length >= 31, `all language files were read (${files.length})`);
let offenders = 0;
for (const f of files) {
  const txt = fs.readFileSync(new URL(f, dir), 'utf8');
  const rows = [...txt.matchAll(/"(soi\.sign\.[^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
  const hits = rows.filter(([, k, v]) => !OPERATOR(k) && !RETIRED.includes(k) && BANNED.test(v));
  if (hits.length) { offenders++; console.log(`   ${f}: ${hits.map((h) => h[1]).join(', ')}`); }
  if (!rows.some(([, k]) => k === 'soi.sign.err.device_only')) { offenders++; console.log(`   ${f}: missing soi.sign.err.device_only`); }
}
ok(offenders === 0, `every language keeps the signing surface free of the machine (${offenders} file(s) failed)`);

// 4 · Spanish carries it too
const es = fs.readFileSync(new URL('../lib/lexicon-translations-es-sign.ts', import.meta.url), 'utf8');
ok(/soi\.sign\.err\.device_only/.test(es), 'Spanish carries the human sentence');
const esBad = [...es.matchAll(/"(soi\.sign\.[^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].filter(([, k, v]) => !OPERATOR(k) && !RETIRED.includes(k) && BANNED.test(v));
ok(esBad.length === 0, `Spanish: no signer-facing string names the machine — ${esBad.map((m) => m[1]).join(', ')}`);

console.log(`sign-lexicon-voice: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
