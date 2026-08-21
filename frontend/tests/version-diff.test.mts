import { tokenize, diffText, diffRecord, diffCollection, sideBySide } from '/home/user/eXeL-AI-Polling/frontend/lib/version-diff.ts';
const esc = (s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
let pass=0, fail=0;
const ok=(c:boolean,m:string)=>{ if(c){pass++;} else {fail++; console.log('FAIL:',m);} };
// tokenize
ok(tokenize('the quick fox').length===3, 'word tokens');
ok(tokenize('中文字').length===3, 'CJK chars individual');
ok(tokenize('$1,111,111 and 42').filter(t=>/\d/.test(t)).length>=2, 'numbers grouped');
// diffText basic
const ops = diffText('the reward pool at target', 'the reward pool beyond target')!;
ok(ops.some(o=>o.t===-1 && o.s==='at'), 'removed "at"');
ok(ops.some(o=>o.t===1 && o.s==='beyond'), 'added "beyond"');
ok(ops.some(o=>o.t===0 && o.s==='reward'), 'kept "reward"');
// identical
ok(diffText('same text','same text')!.every(o=>o.t===0), 'identical all equal');
// cap
ok(diffText('a '.repeat(4000),'b '.repeat(4000),3000)===null, 'cap returns null');
// diffRecord
const fc = diffRecord({crs:'CRS-01', reviewId:'DR-2026.02.14'}, {crs:'CRS-01', reviewId:'DR-2026.08.21'}, ['crs','reviewId']);
ok(fc.find(f=>f.field==='crs')!.kind==='carried', 'crs carried');
ok(fc.find(f=>f.field==='reviewId')!.kind==='changed', 'reviewId changed (timestamp)');
// diffCollection
const col = diffCollection([{id:'a',v:'1'},{id:'b',v:'1'}], [{id:'a',v:'2'},{id:'c',v:'1'}], 'id');
ok(col.find(r=>r.key==='a')!.kind==='changed', 'a changed');
ok(col.find(r=>r.key==='b')!.kind==='removed', 'b removed');
ok(col.find(r=>r.key==='c')!.kind==='added', 'c added');
// sideBySide
const sb = sideBySide(diffText('red green','red blue'), esc)!;
ok(sb.left.includes('<del>green</del>'), 'left del');
ok(sb.right.includes('<ins>blue</ins>'), 'right ins');
console.log(`version-diff: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
