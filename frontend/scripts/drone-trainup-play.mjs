// THE TRAIN UP PLAY-THROUGH (r.204) — the deck's OWN buttons on a served deck, at 390×844 with a touch screen: target three, come back and
// approve three, fire three; the lit button probed at every look against nextStep(); a fourth plate fired by a touch double-tap after the
// head turned; a fifth, red, tapped once and then the sky — refused; captions vs the keep-out at 3.3×. Writes timeline.json + screenshots.
// usage: node scripts/drone-trainup-play.mjs <deck url> <out dir> [w h]   (CHROMIUM_PATH to pin the browser)
import { chromium } from 'playwright';
import fs from 'node:fs'; import { createHash } from 'node:crypto'; import { existsSync } from 'node:fs';
const [,, base, out, W='390', H='844'] = process.argv; if(!base||!out){ console.log('usage: node scripts/drone-trainup-play.mjs <deck url> <out dir> [w h]'); process.exit(2); } fs.mkdirSync(out,{recursive:true});
const exe=[process.env.CHROMIUM_PATH,'/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium/chrome-linux/chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(p=>existsSync(p));
const br=exe?await chromium.launch({executablePath:exe}):await chromium.launch();
const bytes=await (await fetch(base)).text(); const sha=createHash('sha256').update(bytes).digest('hex'); const rev=(bytes.match(/revision:'(0\.\d+)'/)||[])[1]||'?'; /* the bytes this run played */
const pg=await br.newPage({viewport:{width:+W,height:+H},deviceScaleFactor:3,hasTouch:true}); /* a phone: the double-tap leg is two touch taps */ const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(base,{waitUntil:'load'}); await pg.waitForTimeout(3200);
await pg.evaluate(()=>{ enterTheRange(21,'train-up'); }); await pg.waitForTimeout(900);
const tl=[]; const T0=Date.now(); const note=(k,v)=>tl.push({t:+((Date.now()-T0)/1000).toFixed(1),k,...v});
const probe=()=>pg.evaluate(()=>{ const lit=[...document.querySelectorAll('#fTgt,#fAppr,#fFire')].filter(b=>b.classList.contains('lit')).map(b=>b.textContent.trim()); const lk=(typeof lockOn==='function')?lockOn():null; const k=lk&&markSlotOf(lk.id); return {under:lk?lk.id:null, phase:k?state.tgtSlot[k].phase:(lk?'unmarked':'none'), next:nextStep(), lit:lit.join('|'), desig:state.desig?state.desig.id+':'+state.desig.phase:null, marks:Object.keys(state.tgtSlot||{}).map(x=>x+'='+state.tgtSlot[x].id.replace(/-L\d+$/,'')+':'+state.tgtSlot[x].phase).join(' '), hit:state.rangeHit|0, mag:(state.mag.rounds|0)+'/'+(state.mag.cap|0)}; });
const look=async b=>{ await pg.evaluate((b)=>{ const q=plateOf(state.lane||0,b); const u=units[state.unit]; aimUnitAt(u,q,-40,40); state.aimRef=q; paintCues(); },b); await pg.waitForTimeout(220); const p=await probe(); note('look',{b,...p}); return p; };
const shot=async n=>pg.screenshot({path:`${out}/${n}.png`});
const B=['C-100L','C-150R','C-200L'];
for(const b of B){ await look(b); await pg.click('#fTgt'); await pg.waitForTimeout(220); note('target',{b,...await probe()}); }
await shot('1-three-amber');
await look('C-100L'); await shot('2-back-on-first-amber');
for(const b of B){ const p=await look(b); await pg.click('#fAppr'); await pg.waitForTimeout(220); note('approve',{b,before:p.lit,...await probe()}); }
await look('C-100C'); await shot('3-three-red-on-unmarked');
await look('C-100L'); await shot('4-back-on-first-red');
for(const b of B){ await look(b); await pg.click('#fFire'); await pg.waitForTimeout(320); note('fire',{b,...await probe()}); }
await shot('5-three-fired');
// r.204 double-tap leg: a fourth plate marked and approved by the buttons; the head turned OFF it; two TOUCH taps on its outline within 320 ms —
// the first turns the head back onto it (tap-aim), the second fires what the first touched (state._tapObj). A real pointer sequence, not fireN().
{ const D='C-100C'; await look(D); await pg.click('#fTgt'); await pg.waitForTimeout(220); await pg.click('#fAppr'); await pg.waitForTimeout(220); const red=await probe(); note('approve',{b:D,...red});
  await pg.evaluate(()=>{ const u=units[state.unit]; u.pan+=4.5; state.aimRef=null; paintCues(); }); await pg.waitForTimeout(260); const off=await probe(); note('turned-off',{b:D,...off});
  const pt=await pg.evaluate((D)=>{ const q=plateOf(state.lane||0,D); const r=plateRect(q); if(!r) return null; const v=document.getElementById('view')||document.querySelector('canvas'); const b=v.getBoundingClientRect(); const cx=r.cx, cy=(r.top+r.bot)/2; return {x:b.left+cx*(b.width/view.width), y:b.top+cy*(b.height/view.height), rect:[Math.round(r.cx-r.half),Math.round(r.top),Math.round(r.cx+r.half),Math.round(r.bot)], canvas:[view.width,view.height]}; },D);
  note('tap-point',{b:D,...pt}); const hit0=off.hit;
  if(pt&&isFinite(pt.x)&&isFinite(pt.y)){ await pg.touchscreen.tap(pt.x,pt.y); await pg.waitForTimeout(140); const t1=await probe(); note('tap1',{b:D,...t1}); await pg.touchscreen.tap(pt.x,pt.y); await pg.waitForTimeout(400); const t2=await probe(); note('tap2',{b:D,...t2,fired:t2.hit===hit0+1}); }
  await shot('7-double-tap-fired'); }
// r.204 sky-tap leg (the fourth round): a red plate tapped once, then the sky — nothing fires (r.131), no round spent
{ const D='C-150R'; await pg.waitForTimeout(3400); /* the fired plate returns first (TRAIN UP, 3 s) */ const l=await look(D); note('look',{b:D,...l}); await pg.click('#fTgt'); await pg.waitForTimeout(220); note('target',{b:D,...await probe()}); await pg.click('#fAppr'); await pg.waitForTimeout(220); const red=await probe(); note('approve',{b:D,...red}); await pg.evaluate(()=>{ const u=units[state.unit]; u.pan+=4.5; state.aimRef=null; paintCues(); }); await pg.waitForTimeout(260); note('turned-off',{b:D,...await probe()});
  const pt=await pg.evaluate((D)=>{ const q=plateOf(state.lane||0,D); const r=plateRect(q); if(!r) return null; const v=document.getElementById('view'); const b=v.getBoundingClientRect(); return {x:b.left+r.cx*(b.width/view.width), y:b.top+((r.top+r.bot)/2)*(b.height/view.height)}; },D);
  const sky=await pg.evaluate(()=>{ const b=document.getElementById('view').getBoundingClientRect(); for(const [fx,fy] of [[0.5,0.06],[0.2,0.08],[0.8,0.08],[0.5,0.14],[0.3,0.3],[0.7,0.3]]){ const cx=fx*view.width, cy=fy*view.height; if(!pickNear(cx,cy)) return {x:b.left+fx*b.width,y:b.top+fy*b.height,cx:Math.round(cx),cy:Math.round(cy)}; } return null; }); /* blank sky INSIDE the picture — a point where pickNear finds nothing (the fifth round: a tap off the canvas proves nothing) */
  if(pt&&isFinite(pt.x)&&sky){ await pg.touchscreen.tap(pt.x,pt.y); await pg.waitForTimeout(120); await pg.touchscreen.tap(sky.x,sky.y); await pg.waitForTimeout(400); const t2=await probe(); const toastTxt=await pg.evaluate(()=>(document.getElementById('toast')||{}).textContent||''); note('sky-tap',{b:D,sky:[sky.cx,sky.cy],...t2,refused:t2.hit===red.hit&&t2.mag===red.mag&&/DOUBLE-TAP THE RED BOX TO FIRE/.test(toastTxt),toast:toastTxt}); }
  await shot('8-sky-tap-refused'); }
// captions vs the button row at 3.3×: mark the two 50 m plates and the far ones, zoom, measure in-page
const cap=await pg.evaluate(()=>{ const u=units[state.unit]; platesHere().filter(p=>p.up).sort((a,b)=>a.z-b.z).slice(0,6).forEach(q=>{ aimUnitAt(u,q,-40,40); state.aimRef=q; markLock(lockOn(),'BTN'); }); const far=platesHere().filter(p=>p.up).sort((a,b)=>b.z-a.z)[0]; aimUnitAt(u,far,-40,40); state.aimRef=far; state.zoom=3.3; paintCues(); hudMag(); return null; });
await pg.waitForTimeout(500);
const m=await pg.evaluate(()=>{ const hc=document.getElementById('hud').getContext('2d'); const Wc=document.getElementById('hud').width, Hc=document.getElementById('hud').height; const sr=document.getElementById('stage').getBoundingClientRect(); const fr=document.getElementById('face').getBoundingClientRect(); const floor=(typeof captionFloor==='function')?captionFloor(Hc):Hc-44; const rects=plateCaptionRects(hc,Wc,Hc); const off=platesHere().filter(q=>q.up&&(()=>{ const r=plateRect(q); return !!r&&(r.bot<0||r.top>Hc); })()).map(q=>q.id); return {zoom:state.zoom,canvas:[Wc,Hc],stage:[Math.round(sr.width),Math.round(sr.height)],faceTop:Math.round(fr.top-sr.top),floor:Math.round(floor),captions:rects.map(c=>c.cap+' @y'+Math.round(c.y1)),allAbove:rects.every(c=>c.y1<=floor),off,offCaptioned:off.filter(id=>rects.some(c=>c.id===id))}; });
note('captions-3.3x',m); await shot('6-captions-at-3.3x');
fs.writeFileSync(`${out}/timeline.json`,JSON.stringify({rev,sha,timeline:tl},null,1));
console.log(JSON.stringify({rev,sha,errors:errs.length,err:errs[0]||null,doubleTap:(tl.find(e=>e.k==='tap2')||{}),skyTap:(tl.find(e=>e.k==='sky-tap')||{}),looks:tl.filter(e=>e.k==='look').map(e=>e.b+':'+e.phase+'→'+e.next+'/'+e.lit),fires:tl.filter(e=>e.k==='fire').map(e=>e.b+' hit'+e.hit),captions:m}));
await br.close();
