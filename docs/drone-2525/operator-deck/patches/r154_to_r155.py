# r.154 -> r.155 — TARGET · APPROVE · FIRE LEFT OF THE STICK ON THE TURRET, CENTRED BETWEEN THE STICKS ON A DRONE (operator 2026-10-04,
# docs/asks/2026.10.04_08.50..02_drone2525_face_left_of_stick_turret.md: "target approve fire needs to be left of joystick for turret (and
# centered between two joysticks when operating drone).").
# Measured in r.154 (headless, 390×844): the cluster is centred on the SCREEN (left:50%) — on the turret it floats at 656–696 px while the
# HEAD stick sits at 716–788 px on the right edge, so the thumb travels up and across; on a desk the centre is the window's, not the gap
# between the sticks (614–825 px against sticks 8–72 / 1068–1132). CSS cannot say "left of whatever the stick is", so the fix MEASURES:
# placeFace() reads #stage, #joyR and (when visible) #joyL with getBoundingClientRect and writes inline left/top (transform none), clearing
# them first so every call starts from the CSS. TURRET: one row, right edge 10 px left of the stick (shrinking the gap to 4 px and the pill
# padding/min-width on narrow screens, never over the stick, never off the stage), vertical centre = the stick's. DRONE: centred on the
# midpoint of the gap between the two sticks, at their height, one row if it fits with 6 px clearance each side, else two rows, else
# above the sticks. Called from layout() (resize, orientation, FULL), syncSticks(), applyMode(), boot, fonts.ready, and a MutationObserver
# on #app's class + the sticks' style — so every path that toggles .turret / .full / .desk re-places it (the class, not the instance).
# What the move must not cover (found on the r.155 captures before push): in landscape the face now sits on the HUD's right-hand
# 'unit · SPIRAL' / 'FPS' lines, and the toast (z 41, left 10 px, bottom 92 px) would lie over TARGET/APPROVE for up to 4.2 s and
# take their taps — hudStatusY() steps those two lines above the face and stick only when the face box covers them, and placeFace()
# raises the toast above the face and the stick labels.
# Boot-QA row FACE_BESIDE_STICK proves both placements in the served bytes. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.154.html'); DST=os.path.join(DECK,'drone-2525_r.155.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# -- 1 . placeFace(): the measured placement, beside syncSticks (the function that decides one stick or two) --
rep("function nextTurret(dir){",
"""function placeFace(){ /* r.155 (operator 2026-10-04): TARGET · APPROVE · FIRE left of the stick on the turret, centred between the sticks on a drone — measured, never guessed */
  const f=document.getElementById('face'), R=document.getElementById('joyR'), L=document.getElementById('joyL'), st=document.getElementById('stage'), app=document.getElementById('app');
  if(!f||!R||!st||!app) return null;
  const pills=[].slice.call(f.querySelectorAll('b'));
  ['left','top','right','bottom','transform','gridTemplateColumns','gap'].forEach(k=>{ f.style[k]=''; });
  pills.forEach(b=>{ b.style.minWidth=''; b.style.padding=''; b.style.letterSpacing=''; });
  const vis=e=>{ if(!e||getComputedStyle(e).display==='none') return null; const r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; };
  const rr=vis(R); if(!rr||!vis(f)){ state.faceBox=null; return null; }
  const lr=vis(L), turret=app.classList.contains('turret')||!lr, sr=st.getBoundingClientRect(), M=4;
  const SH=[{c:3,g:6},{c:3,g:4,p:'0 6px',m:'0',ls:'.06em'},{c:3,g:3,p:'0 4px',m:'0',ls:'.02em'},{c:2,g:6},{c:2,g:4,p:'0 6px',m:'0',ls:'.06em'}];
  const use=sh=>{ f.style.gridTemplateColumns='repeat('+sh.c+',auto)'; f.style.gap=sh.g+'px'; pills.forEach(b=>{ b.style.minWidth=sh.m||''; b.style.padding=sh.p||''; b.style.letterSpacing=sh.ls||''; }); const r=f.getBoundingClientRect(); return {w:r.width,h:r.height}; };
  f.style.transform='none'; f.style.right='auto'; f.style.bottom='auto'; f.style.left='0px'; f.style.top='0px';
  const o=f.getBoundingClientRect(); /* the containing block's origin (the face is position:fixed on a phone, absolute in #stage elsewhere) */
  let x=0, y=0, pick=null, sz=null;
  const fitY=(cy,h)=>Math.max(sr.top+M,Math.min(sr.bottom-M-h,cy-h/2));
  if(turret){
    for(const sh of SH){ sz=use(sh); for(let g=10;g>=4;g-=2){ if(rr.left-g-sz.w>=sr.left+M){ pick={sh,g}; break; } } if(pick) break; }
    if(!pick){ pick={sh:SH[SH.length-1],g:4}; sz=use(pick.sh); }
    x=Math.max(sr.left+M,rr.left-pick.g-sz.w); y=fitY(rr.top+rr.height/2,sz.h);
  } else {
    const a=lr.right, b=rr.left, mid=(a+b)/2, cy=((lr.top+lr.height/2)+(rr.top+rr.height/2))/2, CL=6;
    for(const sh of SH){ sz=use(sh); if(sz.w<=b-a-2*CL){ pick={sh,g:0}; break; } }
    if(pick){ x=mid-sz.w/2; y=fitY(cy,sz.h); }
    else { pick={sh:SH[0],g:0,above:true}; sz=use(SH[0]); x=Math.max(sr.left+M,Math.min(sr.right-M-sz.w,(sr.left+sr.right)/2-sz.w/2)); y=Math.max(sr.top+M,Math.min(lr.top,rr.top)-8-sz.h); }
  }
  f.style.left=Math.round(x-o.left)+'px'; f.style.top=Math.round(y-o.top)+'px';
  { /* what the move must not cover: the HUD's right-hand status lines learn the face box (hudStatusY); the toast rises above the face and the stick labels so it never sits on a pill or takes its tap */
    const fr=f.getBoundingClientRect(); state.faceBox={l:fr.left-sr.left,t:fr.top-sr.top,r:fr.right-sr.left,b:fr.bottom-sr.top,jt:rr.top-sr.top};
    const tops=[fr.top,rr.top-18].concat(lr?[lr.top-18]:[]), tt=document.getElementById('toast'); if(tt) tt.style.bottom=Math.max(92,Math.round(innerHeight-Math.min.apply(null,tops)+6))+'px'; }
  state.facePlace={turret,cols:pick.sh.c,gap:pick.g,above:!!pick.above};
  return state.facePlace;
}
function nextTurret(dir){""")

# -- 2 . layout() re-places it on every resize, orientation change and FULL toggle (setFull dispatches resize) --
rep("  [view,hud].forEach(c=>{c.width=Math.max(20,r.width);c.height=Math.max(20,r.height);});\n}",
    "  [view,hud].forEach(c=>{c.width=Math.max(20,r.width);c.height=Math.max(20,r.height);});\n  if(typeof placeFace==='function') placeFace(); /* r.155 */\n}")

# -- 3 . syncSticks() decides one stick or two; the face follows in the same call --
rep("  if(R) R.style.display='block';\n}",
    "  if(R) R.style.display='block';\n  placeFace(); /* r.155: one stick → left of it; two → between them */\n}")

# -- 4 . applyMode() toggles .turret; the face follows --
rep("pops.forEach(p=>p.up=false);log('MODE',m);sample({ev:'MODE',m});list();\n}",
    "pops.forEach(p=>p.up=false);log('MODE',m);sample({ev:'MODE',m});list(); placeFace(); /* r.155 */\n}")

# -- 5 . boot: place once, again when the fonts settle, and on ANY later class/stick change (jumpToTurret, the platform picker, FULL) --
rep("applyMode('turret');syncSticks();list();rcoreStep('REALITY');",
    "applyMode('turret');syncSticks();placeFace();list();rcoreStep('REALITY');"
    "try{ const _pfMo=new MutationObserver(()=>placeFace()); _pfMo.observe(document.getElementById('app'),{attributes:true,attributeFilter:['class']}); ['joyL','joyR'].forEach(id=>{ const e=document.getElementById(id); if(e) _pfMo.observe(e,{attributes:true,attributeFilter:['style','class']}); }); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>placeFace()); }catch(_){} /* r.155: every path that toggles .turret/.full/.desk or a stick re-places TARGET · APPROVE · FIRE */")

# -- 5b . the HUD's right-hand status lines (unit · SPIRAL, FPS) step above the face when the face now sits on them (landscape turret) --
rep("hc.textAlign='right';hc.fillStyle=T13.ROAD;hc.fillText((state.fps|0)+' FPS',W-12,H-36);",
    "hc.textAlign='right';hc.fillStyle=T13.ROAD;{ const _fT=(state.fps|0)+' FPS'; hc.fillText(_fT,W-12,hudStatusY(W,H,hc.measureText(((units[state.unit]||{}).label||'')+' · SPIRAL v'+state.spiral).width,hc.measureText(_fT).width).f); } /* r.155: above TARGET · APPROVE · FIRE when it sits here */")
rep("hc.textAlign='right';hc.fillStyle=T13.ROAD;hc.fillText(units[state.unit].label+' · SPIRAL v'+state.spiral,W-12,H-52);",
    "hc.textAlign='right';hc.fillStyle=T13.ROAD;{ const _sT=units[state.unit].label+' · SPIRAL v'+state.spiral; hc.fillText(_sT,W-12,hudStatusY(W,H,hc.measureText(_sT).width,hc.measureText((state.fps|0)+' FPS').width).s); } /* r.155 */")
rep("function placeFace(){",
    "function hudStatusY(W,H,wS,wF){ /* r.155: the unit · SPIRAL and FPS lines keep their place unless the face box covers them; then both step above the face and the stick's label */\n"
    "  let s=H-52,f=H-36; const fb=state.faceBox; if(!fb) return {s,f};\n"
    "  const hit=(y,w)=>W-12-w<fb.r&&W-12>fb.l&&y+4>fb.t&&y-12<fb.b;\n"
    "  if(hit(s,wS)||hit(f,wF)){ f=Math.round(Math.min(fb.t,fb.jt-18)-6); s=f-16; } return {s,f}; }\n"
    "function placeFace(){")

# -- 6 . the boot-QA row that proves both placements in the served bytes --
rep("    { const hp=document.getElementById('playHud'); const cs=hp?getComputedStyle(hp):null; push('HUD_SCORE_WRAPS'",
"""    { /* r.155 · FACE_BESIDE_STICK — the turret's cluster sits left of the HEAD stick at its height; a drone's is centred between the sticks */
      const u0=state.unit, tid=units.T01?'T01':'T1', rc=id=>document.getElementById(id).getBoundingClientRect();
      const inS=(a,s)=>a.left>=s.left-0.5&&a.right<=s.right+0.5&&a.top>=s.top-0.5&&a.bottom<=s.bottom+0.5, hits=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      state.unit=tid; syncSticks(); placeFace(); const f1=rc('face'), j1=rc('joyR'), s1=rc('stage'); const ov=Math.min(f1.bottom,j1.bottom)-Math.max(f1.top,j1.top);
      const tOk=document.getElementById('app').classList.contains('turret')&&f1.right<=j1.left-4&&ov>=0.6*f1.height&&inS(f1,s1);
      state.unit='D1Q'; syncSticks(); placeFace(); const f2=rc('face'), l2=rc('joyL'), r2=rc('joyR'), s2=rc('stage'); const off=Math.abs((f2.left+f2.right)/2-(l2.right+r2.left)/2);
      const dOk=!document.getElementById('app').classList.contains('turret')&&l2.width>0&&off<=4&&!hits(f2,l2)&&!hits(f2,r2)&&inS(f2,s2);
      state.unit=u0; syncSticks(); placeFace();
      push('FACE_BESIDE_STICK', tOk&&dOk, 'turret: face right '+Math.round(f1.right)+' < stick left '+Math.round(j1.left)+' · overlap '+Math.round(ov)+'/'+Math.round(f1.height)+' px · drone: centre off '+Math.round(off)+'px ('+Math.round(f2.left)+'–'+Math.round(f2.right)+' between '+Math.round(l2.right)+' and '+Math.round(r2.left)+')'); }
    { const hp=document.getElementById('playHud'); const cs=hp?getComputedStyle(hp):null; push('HUD_SCORE_WRAPS'""")

# -- 7 . the deck declares itself r.155 (BUILD const + the header span + the carried-note strings) --
c=s.count("revision:'0.154'"); rep("revision:'0.154'","revision:'0.155'",c)
h=s.count("r0.154"); rep("r0.154","r0.155",h)

for dead in ["revision:'0.154'",'r0.154']:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead} x{s.count(dead)}')
for need in ['function placeFace()',"push('FACE_BESIDE_STICK'",'new MutationObserver(()=>placeFace())']:
    if s.count(need)!=1: raise SystemExit(f'REFUSE: {need} must appear exactly once, found {s.count(need)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)
