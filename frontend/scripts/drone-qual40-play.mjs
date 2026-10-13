// QUAL 40 play-through on the built deck, through the deck's OWN controls (TARGET · APPROVE · FIRE buttons, RELOAD), at wall time.
// usage: node scripts/drone-qual40-play.mjs <deck url> <out dir> [width height] [maxSeconds]   (CHROMIUM_PATH to pin the browser)   — writes timeline.json + screenshots.
import { chromium } from 'playwright'; import { createHash } from 'node:crypto'; import { existsSync } from 'node:fs';
import fs from 'node:fs';
const [,, base, out, W='390', H='844', MAX='600'] = process.argv; fs.mkdirSync(out,{recursive:true});
const exe=[process.env.CHROMIUM_PATH,'/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium/chrome-linux/chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(p=>existsSync(p));
const br=exe?await chromium.launch({executablePath:exe}):await chromium.launch();
const bytes=await (await fetch(base)).text(); const sha=createHash('sha256').update(bytes).digest('hex'); const rev=(bytes.match(/revision:'(0\.\d+)'/)||[])[1]||'?'; /* r.204: the log names the bytes it played */
const pg=await br.newPage({viewport:{width:+W,height:+H},deviceScaleFactor:2});
const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(base,{waitUntil:'load'}); await pg.waitForFunction(()=>typeof state!=='undefined'&&state.qa&&state.qa.total>0&&(state.outcomes||[]).some(x=>x.id==='DRAW_COMPLETES')&&(state.outcomes||[]).some(x=>x.id==='ASM_MARKED_BY_THE_LOOP'),null,{timeout:120000}); await pg.waitForTimeout(300); /* r.204: every boot row has landed (the deferred ones end with their own rangeReset) — entering during the boot reset the first magazine to 30 */
const T0=Date.now(); const tl=[]; const note=(k,v)=>{ tl.push({t:+((Date.now()-T0)/1000).toFixed(1),k,...v}); };
const hud=()=>pg.evaluate(()=>{ const tx=s=>{ const e=document.querySelector(s); return e?e.textContent:null; }; const R=rangeRun(state.lane||0); const m=state.mag||{}; return { mode:state.rangeMode, strip:tx('#phScore'), toast:tx('#toast'), light:(tx('#startWord')||'')+' '+(tx('#startTime')||''), lamp:(document.getElementById('startLight')||{}).getAttribute?document.getElementById('startLight').getAttribute('data-s'):null, mag:(m.rounds|0)+'/'+(m.cap|0)+' n'+(m.n|0), count:tx('#magRounds'), countColor:getComputedStyle(document.getElementById('magRounds')).color, frame:(()=>{ const f=document.getElementById('magFrame'); if(!f) return null; const src=f.getAttribute('src'); const fi=document.getElementById('magFill'); const fs=fi?fi.getAttribute('src'):null; const tone=(typeof MAG_PNG==='object')?(fs===MAG_PNG.red?'red':(fs===MAG_PNG.amber?'amber':(fs===MAG_PNG.green?'green':'?'))):'?'; return ((typeof MAG_PNG==='object'&&src===MAG_PNG.frame)?'gold-raster':(f.getAttribute('stroke')||'?'))+' fill:'+tone+' cut:'+(fi?fi.style.getPropertyValue('--cut'):'-'); })(), reload:tx('#magReload b'), pose:tx('#posName'), phase:R.phase, k:R.k, eng:R.eng?R.eng.n:null, up:platesHere().filter(p=>p.up).map(p=>p.id), hit:state.qualH|0, rounds:state.qualR|0, done:!!state.qualDone, desig:state.desig?state.desig.id:null, red:!!state.hiApproved, next:(typeof nextStep==='function')?nextStep():null, lit:[...document.querySelectorAll('#fTgt,#fAppr,#fFire')].map(b=>b.id+':'+(b.classList.contains('lit')?'lit':'dim')).join(' ') }; });
const shot=async(name)=>{ await pg.screenshot({path:`${out}/${name}.png`}); };
await shot('00-intro');
await pg.evaluate(()=>{ enterTheRange(21,'qual40'); }); await pg.waitForTimeout(800); const mag1=await pg.evaluate(()=>({rounds:state.mag.rounds|0,cap:state.mag.cap|0,n:state.mag.n|0})); console.log('first magazine',JSON.stringify(mag1)); if(mag1.cap!==10){ console.log('REFUSE: the first magazine is not Table VI\'s 10 rounds'); process.exit(2); }
note('enter',await hud()); await shot('01-qual-start');
// the lane's own turret: the deck parks the shooter on the lane; aim is through the deck's own aimUnitAt (the stick), targeting through the real buttons
let lastEng=null, lastPhase=null, lastToast=null, shots=0, reloads=0, seen=new Set();
const deadline=Date.now()+(+MAX)*1000;
while(Date.now()<deadline){
  const h=await hud();
  if(h.toast&&h.toast!==lastToast){ lastToast=h.toast; note('toast',{toast:h.toast,strip:h.strip,light:h.light}); }
  if(h.phase==='up'&&h.up.length){ const ph=await pg.evaluate(()=>{ const up=platesHere().filter(p=>p.up).length; const m=(document.getElementById('phScore')||{}).textContent||''; const n=+((m.match(/(\d+) UP/)||[])[1]||0); const strays=platesHere().filter(p=>!p.up&&((p.fall||0)>0&&(p.fall||0)<1)).map(p=>p.id); return {up,n,strays,desig:state.desig?state.desig.id:null,slots:Object.keys(state.tgtSlot||{})}; }); if(ph.up!==ph.n||ph.strays.length) note('phantom-check',ph); }
  if(h.eng!==lastEng||h.phase!==lastPhase){ lastEng=h.eng; lastPhase=h.phase; note('phase',{phase:h.phase,eng:h.eng,pose:h.pose,mag:h.mag,count:h.count,countColor:h.countColor,frame:h.frame,light:h.light,up:h.up,strip:h.strip}); if(h.phase==='up'&&h.eng&&!seen.has('e'+h.eng)){ seen.add('e'+h.eng); await shot(`e${String(h.eng).padStart(2,'0')}-up`); } if(h.phase==='phasegap'&&!seen.has('g'+h.k)){ seen.add('g'+h.k); await shot(`rest-after-${String(h.eng).padStart(2,'0')}`); } }
  if(h.done){ note('cold',h); await shot('99-cold'); break; }
  if(h.phase==='phasegap'||h.reload==='RELOAD'&&(state=>true)(0)&&h.mag.startsWith('0/')){ // a rest between phases, or an empty magazine: RELOAD through the real button
    const calls=await pg.evaluate(()=>document.getElementById('magReload').classList.contains('call'));
    if(calls){ await pg.click('#magReload'); reloads++; await pg.waitForTimeout(300); note('reload',await hud()); if(reloads===1) await shot('reload-1'); }
    await pg.waitForTimeout(500); continue;
  }
  if(h.phase==='up'&&h.up.length){
    // pick an exposed plate not yet engaged this exposure; aim the deck's own shooter at it; then TARGET → APPROVE → FIRE through the buttons
    const tgt=await pg.evaluate(()=>{ const R=rangeRun(state.lane||0); const q=platesHere().find(p=>p.up&&p._engK!==R.k); if(!q) return null; const u=units[state.unit]||Object.values(units).find(x=>x&&x.kind==='turret')||units[Object.keys(units)[0]]; try{ aimUnitAt(u,q,-40,40); }catch(e){} state.aimRef=q; return q.id; });
    if(tgt){
      await pg.click('#fTgt'); await pg.waitForTimeout(250); const a=await hud();
      await pg.click('#fAppr'); await pg.waitForTimeout(250); const b=await hud();
      await pg.click('#fFire'); await pg.waitForTimeout(350); const c=await hud(); shots++;
      await pg.evaluate((id)=>{ const R=rangeRun(state.lane||0); const q=platesHere().find(p=>p.id===id); if(q) q._engK=R.k; },tgt); /* engaged once per exposure, not once per plate — the later phases reuse the plates */
      note('shot',{tgt, afterTarget:a.desig+' '+a.lit, afterApprove:(b.red?'red':'no-red')+' '+b.lit, afterFire:c.strip, toast:c.toast, mag:c.mag, count:c.count, countColor:c.countColor, frame:c.frame, hit:c.hit, rounds:c.rounds});
      if(shots===1) await shot('shot-1-after-fire');
      if(shots===1){ /* also an amber and a red frame on the next target for the record */ }
      continue;
    }
  }
  await pg.waitForTimeout(400);
}
const fin=await hud(); note('end',{...fin, shots, reloads, errors:errs});
fs.writeFileSync(`${out}/timeline.json`, JSON.stringify(tl,null,1));
console.log(JSON.stringify({rev,sha,shots,reloads,done:fin.done,hit:fin.hit,rounds:fin.rounds,strip:fin.strip,errors:errs.length,seconds:+((Date.now()-T0)/1000).toFixed(0),shotsDir:out}));
await br.close();
