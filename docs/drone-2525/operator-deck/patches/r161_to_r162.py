# r.161 -> r.162 — the QUAL timer and the vertical red · yellow · green light (operator 2026-10-05 16.24 CST, ASK.md Addendum 13, verbatim).
#  1. The start light stands VERTICAL on the right: red on top, yellow, green at the bottom, like a range light.
#  2. QUAL · 40 only: the lamps count the last three seconds of the group's window, one second each — red at window − 2, yellow at
#     window − 1, green at the window's end (the group is done, the next set is coming; green holds one second). Otherwise dark.
#     The windows stay the program of record the operator supplied (1 = 5 s · 2 = 8 s · 3 = 12 s · 4 = 16 s); three targets light red
#     at 10, yellow at 11, green at 12. His "3 s per target" is offered as his call in the release note.
#  3. A timer under the lamps: the seconds left on the group that is up ("12 S"), or the seconds to the next group ("NEXT 3 S").
#  Training keeps the r.157 light (green while targets stand) and shows no timer. QA QUAL_LIGHT_LAST_THREE_SECONDS, QUAL_TIMER_COUNTS;
#  START_LIGHT_SEQUENCE re-pointed. The fire doctrine is untouched.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.161.html'); DST=os.path.join(DECK,'drone-2525_r.162.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
rep("#startLight .lamps{display:flex;gap:5px}",
    "#startLight .lamps{display:flex;flex-direction:column;gap:5px} /* r.162 (Addendum 13): vertical, red on top, green at the bottom */\n#startLight #startTime{font-size:13px;letter-spacing:.06em;font-weight:600;color:#E8D5B0;font-variant-numeric:tabular-nums;min-height:15px}\n#startLight #startTime:empty{display:none}")
rep("#startLight i{width:12px;height:12px;","#startLight i{width:14px;height:14px;")
rep('<b id="startWord">WAIT</b></div>','<b id="startWord">WAIT</b><b id="startTime"></b></div>')
rep("  if(chNum()!==0||!rangeArmed()) return 'R';",
    "  if(chNum()!==0) return 'R'; if(!rangeArmed()) return state.rangeMode==='qual40'?'O':'R';")
rep("  if(state.qualDone) return 'R';\n  const R=rangeRun(state.lane||0);\n  if(R.phase==='up'){ if((R.cur||[]).some(id=>up(PLATES.find(p=>p.id===id)))) return 'G'; const nx=engagementAt(state.lane||0,R.k+1); if(!nx) return 'R'; const rest=(R.eng&&nx.ph!==R.eng.ph)?PHASE_GAP_S:ENG_GAP_S; return (Math.max(0,(R.eng?R.eng.sec:5)-R.t)+rest)<=3?'Y':'R'; }\n  const gap=R.phase==='phasegap'?PHASE_GAP_S:ENG_GAP_S; return (gap-(R.t||0))<=3?'Y':'R'; }",
    "  if(state.qualDone) return 'O';\n  return qualLamp(rangeRun(state.lane||0)); }\nfunction qualLamp(R){ /* r.162 (Addendum 13): the last three seconds of the group's window, one second a lamp — red at window − 2, yellow at window − 1, green at the end (held one second into the rest); dark otherwise */\n  const t=R.t||0; if(R.phase==='up'){ const sec=R.eng?R.eng.sec:5; return t>=sec-1?'Y':t>=sec-2?'R':'O'; }\n  return (R.eng&&R.eng.n>0&&t<1)?'G':'O'; }\nfunction qualTimer(){ /* r.162: seconds left on the group that is up, or to the next group; empty outside QUAL */\n  if(chNum()!==0||state.rangeMode!=='qual40'||state.qualDone||!rangeArmed()) return ''; const R=rangeRun(state.lane||0); const t=R.t||0;\n  if(R.phase==='up') return Math.max(0,Math.ceil((R.eng?R.eng.sec:5)-t-1e-9))+' S';\n  const gap=R.phase==='phasegap'?PHASE_GAP_S:ENG_GAP_S; return 'NEXT '+Math.max(0,Math.ceil(gap-t-1e-9))+' S'; }")
rep("function lightWord(L){ return L==='G'?'FIRE':L==='Y'?'READY':'WAIT'; }","function lightWord(L){ return L==='G'?'FIRE':L==='Y'?'READY':L==='O'?'':'WAIT'; }")
rep("  paintLight(startLight()); }",
    "  paintLight(startLight()); paintTimer(); }\nfunction paintTimer(){ const tm=document.getElementById('startTime'); if(!tm) return; const v=qualTimer(); if(tm.textContent!==v) tm.textContent=v; const q=chNum()===0&&state.rangeMode==='qual40'; const w=document.getElementById('startWord'); if(w&&q&&w.textContent!=='') w.textContent=''; } /* in QUAL the timer speaks for the light; the lamp's place (red top, green bottom) carries it for colour-blind players */")
# START_LIGHT_SEQUENCE re-pointed to the r.162 law
rep("/* r.157 · START_LIGHT_SEQUENCE (Addendum 1) — a QUAL start walks red → yellow → green → yellow → green, red then yellow across the phase rest, red at the end; training is green while targets stand */",
    "/* r.157 → r.162 · START_LIGHT_SEQUENCE — QUAL: dark, then red → yellow → green across each group's last three seconds; the phase rest opens green then goes dark; dark at the end; training is green while targets stand */")
rep("s.indexOf('R → Y → G → Y → G')===0&&seq[seq.length-1]==='R'&&done&&marks[0]==='rest R'&&marks[1]==='rest end Y'&&s.indexOf('G → R → Y → G')>0&&",
    "s.indexOf('O → R → Y → G → O → R → Y → G')===0&&seq[seq.length-1]==='O'&&done&&marks[0]==='rest G'&&marks[1]==='rest end O'&&")
ROW=r'''    { /* r.162 · QUAL_LIGHT_LAST_THREE_SECONDS + QUAL_TIMER_COUNTS (Addendum 13) — engagement 4 is three targets on a 12 s window */
      const qaA=state.qaArmed, ph0=state.lobby&&state.lobby.phase, S0=state._qaSilent; state._qaSilent=true; state.qaArmed=true; if(state.lobby) state.lobby.phase='SETUP';
      state.rangeMode='qual40'; rangeReset(); qualResetTower(); const R=rangeRun(state.lane||0); let k3=false; for(let i=0;i<4000&&!k3;i++){ rangeTick(0.05); if(R.phase==='up'&&R.k===3) k3=true; }
      const sec=R.eng?R.eng.sec:0, n3=R.cur.length; const first={}; let tm0=''; let tGap=''; let t=0;
      for(let i=0;i<20*16;i++){ const L=startLight(); const at=R.phase==='up'?R.t:sec+R.t; if(!(L in first)) first[L]=+at.toFixed(2); if(i===10) tm0=qualTimer(); if(R.phase!=='up'&&!tGap&&R.t>0.5) tGap=qualTimer(); rangeTick(0.05); if(R.phase==='up'&&R.k===4) break; }
      state._qaSilent=S0; state.qaArmed=qaA; if(state.lobby) state.lobby.phase=ph0; state.rangeMode='bounce'; qualResetTower(); rangeReset(); paintCues();
      const near=(a,b)=>a!=null&&Math.abs(a-b)<=0.06;
      push('QUAL_LIGHT_LAST_THREE_SECONDS', n3===3&&sec===12&&near(first.R,10)&&near(first.Y,11)&&near(first.G,12)&&near(first.O,0), 'three targets, '+sec+' s up: red at '+first.R+' s, yellow at '+first.Y+' s, green at '+first.G+' s, dark from '+first.O+' s');
      push('QUAL_TIMER_COUNTS', tm0==='12 S'&&/^NEXT [123] S$/.test(tGap), 'half a second into the group the timer reads '+tm0+'; in the rest it reads '+tGap); }
'''
rep("    { /* r.157 · START_LIGHT_WORDS", ROW+"    { /* r.157 · START_LIGHT_WORDS")
c=s.count("revision:'0.161'"); rep("revision:'0.161'","revision:'0.162'",c)
h=s.count("r0.161"); rep("r0.161","r0.162",h)
for dead in ["revision:'0.161'","r0.161","if(chNum()!==0||!rangeArmed()) return 'R';"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())
