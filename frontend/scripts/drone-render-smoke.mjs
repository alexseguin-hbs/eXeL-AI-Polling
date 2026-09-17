#!/usr/bin/env node
/**
 * RENDER SMOKE — the drone UI actually MOUNTS, in a real browser, with no thrown error.
 *
 * The 48-agent fleet found ZERO executable render/DOM test for any drone surface: every gate is source-regex
 * or pure math, so a component could throw on mount and every gate on main would stay green. jsdom is not
 * installed here, but Chromium is, and the repo already serves the static export headlessly (the crew/shots
 * pattern). This loads the built /drone-2525/, fails on ANY page error or unhandled rejection, and asserts
 * the arena markup mounted — the cheapest honest proof that the screen a stranger opens is not a white page.
 *
 *   node scripts/drone-render-smoke.mjs        (needs `next build` first; reads out/)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
const OUT = resolve(new URL('..', import.meta.url).pathname, 'out');
const PORT = Number(process.env.SMOKE_PORT || 4719);
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon' };
const srv = createServer(async (req,res)=>{
  try { let f=join(OUT,decodeURIComponent(req.url.split('?')[0]));
    try{ if((await stat(f)).isDirectory()) f=join(f,'index.html'); }catch{ f=extname(f)?f:join(f,'index.html'); }
    res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(await readFile(f));
  } catch { if(!res.headersSent) res.writeHead(404); res.end(); }
}).listen(PORT);
let pass=0, fail=0; const ok=(c,m)=>{ if(c) pass++; else { fail++; console.log('FAIL:',m); } };
try {
  const { chromium } = await import('playwright');
  const cands=[process.env.CHROMIUM_PATH,'/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium/chrome-linux/chrome','/usr/bin/chromium'].filter(Boolean);
  let executablePath; for(const x of cands){ try{ await stat(x); executablePath=x; break; }catch{} }
  const b = await chromium.launch(executablePath?{executablePath}:{});
  const errors=[];
  for (const vp of [{w:390,h:844,name:'phone'},{w:1440,h:900,name:'desktop'}]) {
    const p = await b.newPage({ viewport:{width:vp.w,height:vp.h} });
    p.on('pageerror', e=>errors.push(`${vp.name}: ${e.message}`));
    p.on('console', m=>{ if(m.type()==='error') errors.push(`${vp.name} console: ${m.text().slice(0,120)}`); });
    await p.goto(`http://127.0.0.1:${PORT}/drone-2525/`, { waitUntil:'networkidle', timeout:20000 });
    const mounted = await p.locator('[data-drone-ux1]').count();
    ok(mounted>0, `${vp.name}: the drone UI mounts (data-drone-ux1)`);
    const arena = await p.locator('[data-drone-arena]').count();
    ok(arena>0, `${vp.name}: the arena renders`);
    await p.close();
  }
  ok(errors.length===0, `no page errors or console errors on mount (${errors.length}${errors.length?': '+errors.slice(0,3).join(' | '):''})`);
  await b.close();
} catch (e) {
  console.log('FAIL: render smoke could not run —', e.message); fail++;
} finally { srv.close(); }
console.log(`\ndrone-render-smoke: ${pass} passed, ${fail} failed · the screen a stranger opens is not a white page`);
process.exit(fail?1:0);
