import { diffMaps } from '/home/user/eXeL-AI-Polling/frontend/lib/version-diff.ts';
let p=0,f=0; const ok=(c:boolean,m:string)=>{c?p++:(f++,console.log("FAIL",m));};
const dm=diffMaps({a:"1",b:"keep",c:"gone"}, {a:"2",b:"keep",d:"new"});
ok(dm.find(x=>x.key==="a")!.kind==="changed","map a changed");
ok(dm.find(x=>x.key==="b")!.kind==="carried","map b carried");
ok(dm.find(x=>x.key==="c")!.kind==="removed","map c removed");
ok(dm.find(x=>x.key==="d")!.kind==="added","map d added");
console.log("diffMaps: "+p+" passed, "+f+" failed");
process.exit(f?1:0);
