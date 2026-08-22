// CROSS-ENGINE CONFORMANCE (r254, Thoth+Odin binding condition): the living document's
// inline dfTok/dfDiff and the shared library's tokenize/diffTokens must emit BYTE-IDENTICAL
// op sequences for the same inputs — "one diff core" proven, not asserted in comments.
import { readFileSync } from 'node:fs';
import { tokenize, diffTokens } from '/home/user/eXeL-AI-Polling/frontend/lib/version-diff.ts';
let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; } else { fail++; console.log('FAIL:', m); } };

// Extract the doc's dfTok + dfDiff sources and instantiate them in this process.
const doc = readFileSync('/home/user/eXeL-AI-Polling/docs/SOI_VISION2525_LIVING_DOCUMENT.html', 'utf8');
const tokSrc = doc.match(/function dfTok\(t\)\{[\s\S]*?\n\}/)?.[0];
const diffSrc = doc.match(/function dfDiff\(a, b\)\{[\s\S]*?\n  return ops;\n\}/)?.[0];
ok(!!tokSrc && !!diffSrc, 'extracted dfTok + dfDiff from the doc');
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const mk = new Function(tokSrc + '\n' + diffSrc + '\nreturn { dfTok, dfDiff };');
const docEng = mk() as { dfTok: (t: string) => string[]; dfDiff: (a: string[], b: string[]) => Array<[number, string]> | null };

// The doc unified its CAP to 3000 (r251) — assert it so drift re-fails here.
ok(/CAP = 3000/.test(diffSrc || ''), 'doc CAP unified at 3000');

const CORPUS: Array<[string, string]> = [
  ['the reward pool at target', 'the reward pool beyond target'],
  ['identical text stays identical', 'identical text stays identical'],
  ['', 'added from nothing'],
  ['removed to nothing', ''],
  ['entities &amp; <b>bold</b> stay text', 'entities &amp; <b>bold</b> stay words'],
  ['中文字符逐字成词', '中文字符逐字变化成词'],
  ['قبل النص العربي هنا', 'بعد النص العربي هنا'],
  ['numbers 1,234.56 group as one', 'numbers 1,234.57 group as one'],
  ['a b c d e f g h i j k l m', 'a b X d e f g h i Y k l m'],
  ['The Seed is fixed-value membership.', 'The Seed is a fixed-value membership credential.'],
];
CORPUS.forEach(([a, b], i) => {
  const lib = diffTokens(tokenize(a), tokenize(b));
  const dc = docEng.dfDiff(docEng.dfTok(a), docEng.dfTok(b));
  const libN = lib ? lib.map((o) => [o.t, o.s]) : null;
  ok(JSON.stringify(libN) === JSON.stringify(dc), `vector ${i}: byte-identical ops (doc == lib)`);
});
// tokenizer equivalence directly
CORPUS.forEach(([a], i) => {
  ok(JSON.stringify(tokenize(a)) === JSON.stringify(docEng.dfTok(a)), `vector ${i}: identical tokenization`);
});
console.log(`diff-conformance: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
