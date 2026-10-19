// tree-check — refuse a stale target before anything measures or ships from it.
// Usage: node scripts/tree-check.mjs <dir> <expected-sha>
// Prints HEAD, origin/main and the behind-count; exits 1 when HEAD is not <expected-sha> or the tree is behind
// origin/main. Why (2026-10-19): a 48-agent fleet measured the primary working directory at b7e1a304e, 28 commits
// behind both refs, while every real change lived in another tree — every finding about "what is in the repo" was
// about a tree nobody shipped. The brief said "clean, at HEAD"; nothing checked. This does. Read-only.
import { execFileSync } from 'node:child_process';
const [dir, expected] = process.argv.slice(2);
if (!dir || !expected) { console.error('usage: tree-check <dir> <expected-sha>'); process.exit(2); }
const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' }).trim();
const head = git('rev-parse', 'HEAD');
let base = '', behind = 'n/a';
try { base = git('rev-parse', 'origin/main'); behind = git('rev-list', '--count', 'HEAD..origin/main'); } catch { /* no origin/main in this tree */ }
const dirty = git('status', '--porcelain').split('\n').filter(Boolean).length;
const okHead = head.startsWith(expected) || head === expected;
const okBehind = behind === 'n/a' || behind === '0';
console.log(`tree-check ${dir}: HEAD ${head.slice(0, 9)} · origin/main ${base ? base.slice(0, 9) : 'n/a'} · behind ${behind} · dirty ${dirty}`);
if (!okHead) console.log(`FAIL: HEAD is not ${expected} — this tree is not the one the work is about`);
if (!okBehind) console.log(`FAIL: ${behind} commit(s) behind origin/main — fast-forward before measuring or shipping`);
process.exit(okHead && okBehind ? 0 : 1);
