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
const tail = src.slice(catchIdx, catchIdx + 3000);
ok(/if \(stampedBytes\.length\)/.test(tail), 'the catch guards on stampedBytes.length');
const guardAt = tail.indexOf('if (stampedBytes.length)');
ok(guardAt >= 0 && tail.indexOf('setStep("done")', guardAt) > guardAt, 'with a stamped file the catch goes to "done", never back to the pads');
const doneAt = tail.indexOf('setStep("done")'), drawAt = tail.indexOf('setStep("draw")');
ok(doneAt > 0 && drawAt > doneAt && guardAt >= 0 && guardAt < doneAt, 'setStep("draw") appears only AFTER the stamped-file guard (a pre-stamp failure only)');

// 4 · the outcome panel's share controls are not conditional on any backend
const downloads = src.indexOf('data-testid="downloads"');
const row = src.slice(downloads - 260, downloads + 120);
ok(downloads > 0 && !/myLink \?|pub \?\.|mode === "supabase"/.test(row.split('<SendRow')[0].split('\n').pop() ?? ''), 'the download row is not gated on a link, a record or the store mode');

// 5 · the store never throws away a pass it could keep on the device
const store = fs.readFileSync(new URL('../lib/sign-store.ts', import.meta.url), 'utf8');
ok(/const writeLocal = \(token: string, env: Envelope\): boolean/.test(store), 'writeLocal exists: a full device is reported, not thrown');
ok(/evictOldestEnvelope/.test(store), 'a quota error evicts the oldest record instead of failing the signature');
ok(/bad_secret\|not_your_turn\|revoked\|expired\|complete/.test(store), 'a genuine refusal (wrong secret, not your turn, revoked) still raises — only outages fall back');

// ── the CLASS, not the instance (R-CORE law, AAR 2026-09-09) ────────────────────────────────────────────────────────────
// Each of these was a separate dead end found one at a time. The gate now holds every member.
const flow = src;
// H1 · a hang must end on the outcome panel, not on a spinner, and no fetch on this path may be untimed
ok(/stampedRef/.test(flow) && /setStep\("done"\)/.test(flow.slice(flow.indexOf('step !== "saving"'), flow.indexOf('step !== "saving"') + 1200)), 'the watchdog hands over the stamped files instead of only printing "slow"');
const tmp = fs.readFileSync(new URL('../lib/tmpfile.ts', import.meta.url), 'utf8');
const notify = fs.readFileSync(new URL('../lib/notify.ts', import.meta.url), 'utf8');
const untimed = (txt) => txt.split('\n').filter((l) => /await fetch\(/.test(l) && !/AbortSignal/.test(l));
ok(untimed(tmp).length === 0, 'tmpfile: every fetch carries a timeout (a hang is a dead end): ' + untimed(tmp).join(' | ').slice(0, 90));
ok(untimed(notify).length === 0, 'notify: every fetch carries a timeout');
// H2 · a file already stamped is pushed even if an enhancement throws
const loop = flow.slice(flow.indexOf('for (let i = 0; i < files.length; i++)'), flow.indexOf('setSigned(stampedBytes);'));
ok(/setExtrasFailed/.test(loop) && loop.indexOf('try {') < loop.indexOf('stampCodexBlock'), 'the codex strip and the placeholders are best-effort, wrapped before stampCodexBlock');
ok(loop.lastIndexOf('} catch') < loop.lastIndexOf('stampedBytes.push'), 'the push happens AFTER that catch, so file 2 of 3 is never lost');
// H3 · the digest works without WebCrypto
const env = fs.readFileSync(new URL('../lib/sign-envelope.ts', import.meta.url), 'utf8');
ok(/function sha256Js/.test(env) && /crypto\.subtle/.test(env), 'sha256Hex falls back to pure JS when crypto.subtle is absent (plain http, WebView)');
// H4 · a malformed response never blanks the render
ok(/Array\.isArray\(pub\?\.signers\)/.test(flow), 'pub.signers is checked before it is mapped (a bad response must not white-screen the page)');
ok(!/\bpub\.signers\.(map|filter|length)/.test(flow), 'no unguarded pub.signers dereference remains');
// H6 · the draft survives a failed save, so an evicted tab does not lose the signature
const tail2 = flow.slice(flow.lastIndexOf('} catch (ex) {'));
ok(!/dropDraft\(\);[^\n]*setStep\("done"\)/.test(tail2), 'the failure path keeps the draft (this device may be the only copy)');
// H9 · never a silent no-op
ok(/if \(!allPlaced\) \{ setErr/.test(flow), 'a tap with nothing placed says so instead of doing nothing');

// ── the gaps the twelve named on the final review (2026-09-10) ──────────────────────────────────────────────────────────
// Enlil: three fixes had no gate at all — delete them and every suite stayed green.
const store2 = fs.readFileSync(new URL('../lib/sign-store.ts', import.meta.url), 'utf8');
const rpcCalls = store2.split('\n').filter((l) => /supabase\.rpc\(/.test(l));
ok(rpcCalls.length > 0 && rpcCalls.every((l) => /withTimeout\(/.test(l) || /await withTimeout/.test(store2.slice(Math.max(0, store2.indexOf(l) - 120), store2.indexOf(l)))), `every store RPC is time-bounded (${rpcCalls.length} calls)`);
ok(flow.indexOf('stage = "create";') < flow.indexOf('newEnvelope({'), 'the stage is named BEFORE newEnvelope can refuse (the panel cannot lie about the step)');
// a directory-wide sweep: no untimed fetch anywhere on the signing path, not just in the two files we remembered
const SIGN_LIB = ['sign-store.ts', 'tmpfile.ts', 'notify.ts', 'ai.ts', 'sign-envelope.ts', 'pdf-render.ts'];
const untimedAnywhere = SIGN_LIB.flatMap((f) => { let t = ''; try { t = fs.readFileSync(new URL(`../lib/${f}`, import.meta.url), 'utf8'); } catch { return []; }
  return t.split('\n').filter((l) => /await fetch\(|= fetch\(/.test(l) && !/AbortSignal|withTimeout/.test(l)).map((l) => `${f}: ${l.trim().slice(0, 60)}`); });
ok(untimedAnywhere.length === 0, `no untimed fetch anywhere on the signing path — ${untimedAnywhere.join(' | ')}`);
// Christo: a hung save must not read "complete" either
const watch = flow.slice(flow.indexOf('step !== "saving"'), flow.indexOf('step !== "saving"') + 1400);
ok(/setSaveRefused\(true\)/.test(watch), 'the 60s watchdog marks the save refused, so the panel cannot claim completion');
// Krishna: no optional-chained dereference of the network array survives
ok(!/pub\?\.signers\s*[[.]/.test(flow.replace('Array.isArray(pub?.signers)', '')), 'no pub?.signers[...] or pub?.signers.length read remains outside the checked array');
// Sofia: thumb-sized targets and left-to-right links
ok(!/min-h-\[3[0-9]px\]/.test(flow), 'every control on the sign flow is at least 44px tall');
const codes = flow.split('\n').filter((l) => /<code/.test(l));
ok(codes.every((l) => /dir="ltr"/.test(l)), 'every rendered link is direction-locked (Arabic and Hebrew must not reorder a URL)');

console.log(`sign-invariant: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
