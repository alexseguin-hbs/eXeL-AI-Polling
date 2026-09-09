// THE INVARIANT (MoT ruling, AAR 2026-09-09): a completed signature is never discarded.
// Odin's finding on the fix that closed the operator's "I can't download after signing": the guarantee lived in one catch and
// nothing stopped a refactor from undoing it. This source-level guard is that stop. It reads the shipped file, not a mock.
import fs from 'fs';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const src = fs.readFileSync(new URL('../components/sign/sign-flow.tsx', import.meta.url), 'utf8');

// 1 · the finished files are declared OUTSIDE the try, so the catch can always see them
const declIdx = src.indexOf('const stampedBytes: { name: string; bytes: Uint8Array }[] = []');
const tryIdx = src.indexOf('\n    try {', declIdx - 4000 > 0 ? declIdx - 4000 : 0);
ok(declIdx > 0, 'stampedBytes is declared in the sign handler');
ok(declIdx < src.indexOf('\n    try {', declIdx - 600), 'stampedBytes is declared BEFORE the try block (the catch can see the finished files)');

// 2 · the files enter state the moment stamping ends, before any store call
const setSignedIdx = src.indexOf('setSigned(stampedBytes);');
const createIdx = src.indexOf('await createEnvelope(env)');
ok(setSignedIdx > 0 && createIdx > 0 && setSignedIdx < createIdx, 'setSigned(stampedBytes) runs BEFORE any store call');

// 3 · the catch lands on the outcome panel whenever a stamped file exists, and only then may it fall back to the pads
const catchIdx = src.lastIndexOf('} catch (ex) {');
const tail = src.slice(catchIdx, catchIdx + 1600);
ok(/if \(stampedBytes\.length\)/.test(tail), 'the catch guards on stampedBytes.length');
ok(/if \(stampedBytes\.length\)[^\n]*setStep\("done"\)/.test(tail), 'with a stamped file the catch goes to "done", never back to the pads');
const doneAt = tail.indexOf('setStep("done")'), drawAt = tail.indexOf('setStep("draw")');
ok(doneAt > 0 && drawAt > doneAt, 'setStep("draw") appears only AFTER the stamped-file guard (a pre-stamp failure only)');

// 4 · the outcome panel's share controls are not conditional on any backend
const downloads = src.indexOf('data-testid="downloads"');
const row = src.slice(downloads - 260, downloads + 120);
ok(downloads > 0 && !/myLink \?|pub \?\.|mode === "supabase"/.test(row.split('<SendRow')[0].split('\n').pop() ?? ''), 'the download row is not gated on a link, a record or the store mode');

// 5 · the store never throws away a pass it could keep on the device
const store = fs.readFileSync(new URL('../lib/sign-store.ts', import.meta.url), 'utf8');
ok(/const writeLocal = \(token: string, env: Envelope\): boolean/.test(store), 'writeLocal exists: a full device is reported, not thrown');
ok(/evictOldestEnvelope/.test(store), 'a quota error evicts the oldest record instead of failing the signature');
ok(/bad_secret\|not_your_turn\|revoked\|expired\|complete/.test(store), 'a genuine refusal (wrong secret, not your turn, revoked) still raises — only outages fall back');

console.log(`sign-invariant: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
