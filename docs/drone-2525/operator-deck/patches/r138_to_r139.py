# r.138 -> r.139 — LANDSCAPE AND PORTRAIT, LIKE MISSION PLANNING (operator 2026-09-23, docs/asks/2026-09-23_landscape_portrait.md).
# A phone is a phone in both orientations; FULL fills the whole screen in every orientation; portrait stacks the top lines,
# landscape sets them side by side; rotation never loses a control. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.138.html'); DST=os.path.join(DECK,'drone-2525_r.139.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── R139-2 · explicit grid rows: a hidden sibling never moves the stage; FULL is one row = the whole screen ──
rep("#app{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;height:100%;height:100dvh}",
    "#app{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;height:100%;height:100dvh}\n#app>.bar:first-child{grid-row:1}#app>.bar:first-child+.bar{grid-row:2}#stage{grid-row:3}#dock{grid-row:4} /* r.139: rows are named, so hiding the bars (FULL) can no longer slide the stage into an auto row — r.138's FULL left the picture at 36 % height */")
rep("#app.full #stage{margin-right:0}",
    "#app.full{grid-template-rows:minmax(0,1fr)}\n#app.full #stage,#app.full.desk #stage{grid-row:1/-1;min-height:0;margin-right:0}\n#app.full.desk #joyR,#app.full.desk.turret #joyR{right:max(8px,env(safe-area-inset-right))} /* r.139: FULL beats the desk layout — no side-panel margin, the HEAD stick at the screen edge */")

# ── R139-3 · portrait stacks the top lines; landscape sets them side by side ──
rep("  #playHud{top:4px;font-size:10px}\n}",
    "  #magBar{top:4px;right:8px}\n  #playHud{top:6px;left:8px;right:344px;font-size:10px} /* r.139: landscape — the strip and the magazine line share one row, side by side */\n}")

# ── R139-1 · device class by the short side; R139-4 · rotation ──
rep("function layout(){","function deviceClass(w,h){ return Math.min(w,h)<600?'phone':'desk'; } /* r.139: a phone is a phone in both orientations (r.138 classed a phone in landscape as a desk and gave it the side panel) */\nfunction layout(){")
rep("  const phone=innerWidth<820;","  const phone=deviceClass(innerWidth,innerHeight)==='phone';")
rep("window.addEventListener('resize',layout);",
    "window.addEventListener('resize',()=>{ layout(); if(typeof hudMag==='function') hudMag(); });\nwindow.addEventListener('orientationchange',()=>setTimeout(layout,300)); try{ if(screen.orientation&&screen.orientation.addEventListener) screen.orientation.addEventListener('change',()=>setTimeout(layout,300)); }catch(_){} /* r.139: iOS reports the old size on the first orientation event */")

# ── QA rows ──
rep("    { const it=document.getElementById('intro'); const itD=it?it.style.display:''; if(it) it.style.display='none'; const f0=!!(state.sets&&state.sets.full); setFull(true);",
    """    push('DEVICE_CLASS_BY_SHORT_SIDE', deviceClass(844,390)==='phone'&&deviceClass(390,844)==='phone'&&deviceClass(1180,820)==='desk'&&deviceClass(1440,900)==='desk'&&document.getElementById('app').classList.contains(deviceClass(innerWidth,innerHeight)), 'phone in both orientations (844×390, 390×844); tablet and PC are desks; this window is '+deviceClass(innerWidth,innerHeight)+' at '+innerWidth+'×'+innerHeight);
    { const it=document.getElementById('intro'); const itD=it?it.style.display:''; if(it) it.style.display='none'; const f0=!!(state.sets&&state.sets.full); setFull(true);""")
rep("      setFull(f0); if(it) it.style.display=itD; }",
    """      { const app=document.getElementById('app'); const ar=app.getBoundingClientRect(), sr=document.getElementById('stage').getBoundingClientRect();
        push('FULL_FILLS_THE_STAGE', Math.abs(sr.width-ar.width)<=1&&Math.abs(sr.height-ar.height)<=1&&Math.abs(sr.top-ar.top)<=1, 'FULL: the picture is the whole screen · stage '+(sr.width|0)+'×'+(sr.height|0)+' of '+(ar.width|0)+'×'+(ar.height|0)+' (r.138 left it at 36 % height)');
        const wasDesk=app.classList.contains('desk'); app.classList.add('desk'); const sr2=document.getElementById('stage').getBoundingClientRect(), jr=document.getElementById('joyR').getBoundingClientRect();
        push('FULL_BEATS_DESK', Math.abs(sr2.width-ar.width)<=1&&(ar.right-jr.right)<=14, 'with the desk layout forced, FULL still gives the picture the full width and the HEAD stick sits at the edge ('+((ar.right-jr.right)|0)+' px in)'); if(!wasDesk) app.classList.remove('desk'); }
      setFull(f0); if(it) it.style.display=itD;
      { const a=document.getElementById('magBar').getBoundingClientRect(), b=document.getElementById('playHud').getBoundingClientRect(); const disjoint=!(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom);
        push('TOP_LINES_NEVER_OVERLAP', disjoint&&a.width>0&&b.width>0, 'the magazine line and the strip are disjoint in this orientation ('+innerWidth+'×'+innerHeight+': '+(innerWidth>innerHeight?'landscape, side by side':'portrait, stacked')+')'); } }""")

c=s.count("revision:'0.138'"); rep("revision:'0.138'","revision:'0.139'",c)
h=s.count("r0.138"); rep("r0.138","r0.139",h)
for dead in ["innerWidth<820"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)
