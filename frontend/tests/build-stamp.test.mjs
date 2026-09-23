// BUILD STAMP — one stamp per commit, identical in every process that loads next.config.js.
// Next loads the config in more than one process during a build; a clock sampled at load time shipped HTML stamped
// 14:50 beside client chunks stamped 14:51 on 2026-09-23, and every 2525 surface rendering the stamp threw React #425
// (hydration text mismatch) on the live site. This gate loads the config in two separate processes and holds their
// stamps equal AND equal to the commit's own time — a fixed stamp, not a lucky minute.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const load = () => JSON.parse(execFileSync(process.execPath, ['-e', "console.log(JSON.stringify(require('./next.config.js').env))"], { cwd: root, env: { ...process.env, SOURCE_DATE_EPOCH: '' } }).toString());
const a = load(); await new Promise((r) => setTimeout(r, 1100)); const b = load();
ok(a.NEXT_PUBLIC_BUILD_DATE === b.NEXT_PUBLIC_BUILD_DATE && a.NEXT_PUBLIC_BUILD_TIME === b.NEXT_PUBLIC_BUILD_TIME, `two processes stamp the same build (${a.NEXT_PUBLIC_BUILD_TIME} vs ${b.NEXT_PUBLIC_BUILD_TIME})`);
const epoch = Number(execFileSync('git', ['log', '-1', '--format=%ct'], { cwd: root }).toString().trim()) * 1000;
const cst = new Date(new Date(epoch).toLocaleString('en-US', { timeZone: 'America/Chicago' }));
const pad = (n) => String(n).padStart(2, '0');
const wantDate = `${cst.getFullYear()}.${pad(cst.getMonth() + 1)}.${pad(cst.getDate())}`, wantTime = `${pad(cst.getHours())}:${pad(cst.getMinutes())} CST`;
ok(a.NEXT_PUBLIC_BUILD_DATE === wantDate && a.NEXT_PUBLIC_BUILD_TIME === wantTime, `the stamp is the commit's own time (${a.NEXT_PUBLIC_BUILD_DATE} ${a.NEXT_PUBLIC_BUILD_TIME}; commit ${wantDate} ${wantTime})`);
const c = JSON.parse(execFileSync(process.execPath, ['-e', "console.log(JSON.stringify(require('./next.config.js').env))"], { cwd: root, env: { ...process.env, SOURCE_DATE_EPOCH: '1700000000' } }).toString());
ok(c.NEXT_PUBLIC_BUILD_DATE === '2023.11.14' && c.NEXT_PUBLIC_BUILD_TIME === '16:13 CST', `SOURCE_DATE_EPOCH pins the stamp for a reproducible build (${c.NEXT_PUBLIC_BUILD_DATE} ${c.NEXT_PUBLIC_BUILD_TIME})`);
ok(/^[0-9a-f]{7}$/.test(a.NEXT_PUBLIC_GIT_SHA), `the sha is seven hex digits (${a.NEXT_PUBLIC_GIT_SHA})`);
console.log(`\nbuild-stamp: ${pass} passed, ${fail} failed · one stamp per commit across processes`);
process.exit(fail ? 1 : 0);
