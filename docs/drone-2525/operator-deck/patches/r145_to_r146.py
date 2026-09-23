# r.145 -> r.146 — DEFERRED QA ROWS DECIDE ON EVIDENCE, NEVER ON THE RUNNER'S CLOCK (Deploy #950, 2026-09-23). DRAW_COMPLETES was
# decided by a fixed 1.5 s timer after boot: a cold CI runner (Chromium freshly downloaded, 462 plates + 129 boards on the first paint)
# had no frame done at 1.5 s, so the row said "no frame completed" — for ever — while the frame loop ran fine a moment later. The same
# class sat in ASM_MARKED_BY_THE_LOOP (a 700 ms window for the loop's mark). Both rows now POLL for the evidence they name (a completed
# frame or a render exception; the loop's mark) and decide when it arrives, up to a DECLARED ceiling that is a real failure, not a
# runner speed. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.145.html'); DST=os.path.join(DECK,'drone-2525_r.146.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── R146-1 · DRAW_COMPLETES waits for a frame (or an exception), not for 1.5 s ──
rep("""  /* r.130 deferred row: draw() cannot run inside boot QA (later consts are in their TDZ), so the loop runs it and this row reads the outcome 1.5 s later. */
  setTimeout(()=>{ if(state.outcomes!==rows) return; const ok=(state.drawDone||0)>0&&!state.drawErr; rows.push({id:'DRAW_COMPLETES',ok,note:ok?('frames ran to their last line: '+state.drawDone+' · segs='+state.segs+' dropped='+state.dropped):('render exception: '+String(state.drawErr||'no frame completed').slice(0,90))}); state.qa.pass+=ok?1:0; state.qa.total=rows.length; const n=document.getElementById('qaOps'); if(n) n.textContent=state.qa.pass+'/'+rows.length; state.qa.t=Date.now(); const qo=document.getElementById('qaOut'); if(qo) qo.textContent+=(ok?'OK ':'NO ')+'DRAW_COMPLETES '+rows[rows.length-1].note+'\\n'; },1500);""",
"""  /* r.130 deferred row: draw() cannot run inside boot QA (later consts are in their TDZ), so the loop runs it and this row reads the outcome.
     r.146: the row waits for its EVIDENCE — a frame that reached its last line, or a recorded render exception — and decides then; a fixed
     1.5 s timer had judged a cold CI runner (Deploy #950) "no frame completed" for ever. DRAW_ROW_CEIL_MS is the one declared failure clock. */
  { const DRAW_ROW_CEIL_MS=20000, t0=Date.now(); const tick=()=>{ if(state.outcomes!==rows) return; const done=(state.drawDone||0)>0, err=!!state.drawErr; if(!done&&!err&&Date.now()-t0<DRAW_ROW_CEIL_MS){ setTimeout(tick,100); return; }
    const ok=done&&!err; rows.push({id:'DRAW_COMPLETES',ok,note:ok?('frames ran to their last line: '+state.drawDone+' · segs='+state.segs+' dropped='+state.dropped+' · after '+(Date.now()-t0)+' ms'):(err?('render exception: '+String(state.drawErr).slice(0,90)):('no frame completed in '+DRAW_ROW_CEIL_MS+' ms'))}); state.qa.pass+=ok?1:0; state.qa.total=rows.length; const n=document.getElementById('qaOps'); if(n) n.textContent=state.qa.pass+'/'+rows.length; state.qa.t=Date.now(); const qo=document.getElementById('qaOut'); if(qo) qo.textContent+=(ok?'OK ':'NO ')+'DRAW_COMPLETES '+rows[rows.length-1].note+'\\n'; }; setTimeout(tick,100); }""")

# ── R146-2 · ASM_MARKED_BY_THE_LOOP waits for the loop's mark, not for 700 ms ──
rep("""      setTimeout(()=>{ if(state.outcomes!==rows) return; const ok=!!(state.desig&&state.desig.id===q.id&&/^ASM@/.test(String(state.desig.by||''))); rows.push({id:'ASM_MARKED_BY_THE_LOOP',ok,note:ok?('the frame loop itself marked '+q.id+' by '+state.desig.by):('no mark from the loop in 700 ms · desig='+(state.desig?state.desig.id+' by '+state.desig.by:'null'))});""",
"""      const ASM_ROW_CEIL_MS=5000, t1=Date.now(); const chk=()=>{ if(state.outcomes!==rows) return; const ok=!!(state.desig&&state.desig.id===q.id&&/^ASM@/.test(String(state.desig.by||''))); if(!ok&&Date.now()-t1<ASM_ROW_CEIL_MS){ setTimeout(chk,50); return; } /* r.146: evidence, not a 700 ms clock */ rows.push({id:'ASM_MARKED_BY_THE_LOOP',ok,note:ok?('the frame loop itself marked '+q.id+' by '+state.desig.by+' · after '+(Date.now()-t1)+' ms'):('no mark from the loop in '+ASM_ROW_CEIL_MS+' ms · desig='+(state.desig?state.desig.id+' by '+state.desig.by:'null'))});""")
rep("""const out=document.getElementById('qaOut'); if(out) out.textContent+=(ok?'\\nOK ':'\\nNO ')+'ASM_MARKED_BY_THE_LOOP'; }, 700); }catch(e){""",
    """const out=document.getElementById('qaOut'); if(out) out.textContent+=(ok?'\\nOK ':'\\nNO ')+'ASM_MARKED_BY_THE_LOOP'; }; setTimeout(chk,50); }catch(e){""")

c=s.count("revision:'0.145'"); rep("revision:'0.145'","revision:'0.146'",c)
h=s.count("r0.145"); rep("r0.145","r0.146",h)
for dead in ["},1500);","no mark from the loop in 700 ms","}, 700); }catch(e){"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)
