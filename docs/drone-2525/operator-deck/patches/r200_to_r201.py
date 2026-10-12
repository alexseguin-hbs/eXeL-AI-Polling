# r.200 -> r.201 — the count magazine keeps its gold frame at every count; the rounds and the number carry the colour (the AsM review of
# r.200, Sofia, against the operator's r0.178 picture: at 3 rounds his picture shows the gold frame with three red lines and a red "3"; r.200
# painted the whole magazine red). Also from that review: each of the last rounds draws a line (3 → 3), the number at the word's size and
# weight, and the RELOAD word back at his picture's spacing (.14em) — the card takes the width his phone's font gives it.
#  INVARIANT (r.201): the frame is gold at every count; the colour of the count lives in the round lines and the number only; a round count
#  of n ≤ 19 lights at least n lines; nothing else of r.200's drawing changes.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='200'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.201.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.200')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
# 0 · the deck declares itself
rep("revision:'0.200'","revision:'0.201'",1)
h=s.count("r0.200"); rep("r0.200","r0.201",h)
# 1 · the frame stays gold; the last rounds each draw a line; the number at the word's size; the word at his spacing
rep("const frame=document.getElementById('magFrame'); if(frame) frame.setAttribute('stroke', r>20?'#C9A227':tone);",
    "const frame=document.getElementById('magFrame'); if(frame) frame.setAttribute('stroke','#C9A227'); /* r.201 (his picture at 3 rounds): the frame stays gold at every count — the rounds and the number carry the colour */")
rep("if(ribs.length){ const lit=Math.round(ribs.length*(r/Math.max(1,m.cap|0)));",
    "if(ribs.length){ const lit=r<=0?0:Math.max(Math.min(r,ribs.length),Math.round(ribs.length*(r/Math.max(1,m.cap|0)))); /* r.201: each of the last rounds draws a line (3 → 3), a magazine of 20+ reads full */")
rep("#magWell #magRounds{font-size:13px;line-height:12px;font-weight:700;letter-spacing:.04em;color:#3DCC8A;font-family:ui-monospace,Menlo,monospace}",
    "#magWell #magRounds{font-size:11px;line-height:12px;font-weight:500;letter-spacing:.04em;color:#3DCC8A;font-family:ui-monospace,Menlo,monospace} /* r.201: the number at the word's size and weight, as in his picture */")
rep("#magWell b{font-size:11px;line-height:12px;letter-spacing:.06em;font-weight:500;color:#7AB8C4} /* r.200: the RELOAD card at his width (≈ 59 px, his 57) */",
    "#magWell b{font-size:11px;line-height:12px;letter-spacing:.14em;font-weight:500;color:#7AB8C4} /* r.201: his picture's word spacing; the card takes the width his phone's font gives it */")

# 1b · the AsM review of r.200 (Thor): the narrow-phone rule must come AFTER the light's own rule to win the cascade (it sat before it, so a
#      360-px phone kept the 72-px light while the box moved — they overlapped); the lamps' gap 4 → 3 so the light's content sits in its box
rep("#app.range.qual #magWell #posWell{display:flex}\n@media (max-width:367px){#app.range #startLight{width:64px} #magWell #posWell{right:68px} #startLight #startTime{font-size:10px}} /* r.200: on a phone narrower than 368 px the light gives 8 px so the box still clears the centred count */\n","#app.range.qual #magWell #posWell{display:flex}\n")
rep("#startLight #startTime{font-size:11px;letter-spacing:0;white-space:nowrap;font-weight:600;color:#E8D5B0;font-variant-numeric:tabular-nums;min-height:13px} /* r.200: \"NEXT 10 S\" and the clock fit the 72-px light, nothing wraps */",
    "#startLight #startTime{font-size:11px;letter-spacing:0;white-space:nowrap;font-weight:600;color:#E8D5B0;font-variant-numeric:tabular-nums;min-height:13px} /* r.200: \"NEXT 10 S\" and the clock fit the 72-px light, nothing wraps */\n@media (max-width:367px){#app.range #startLight{width:64px} #magWell #posWell{right:68px} #startLight #startTime{font-size:10px}} /* r.201 (review of r.200, Thor): the narrow-phone rule LAST so it wins the cascade — under 368 px the light gives 8 px and the box moves with it */")
rep("#startLight .lamps{display:flex;flex-direction:column;gap:4px}","#startLight .lamps{display:flex;flex-direction:column;gap:3px}")
rep("const fit=Math.abs(r.width-72)<=1&&Math.abs(r.height-75)<=1&&st.scrollWidth<=st.clientWidth+1&&sw.scrollWidth<=sw.clientWidth+1;",
    "const fit=Math.abs(r.width-72)<=1&&Math.abs(r.height-75)<=1&&st.scrollWidth<=st.clientWidth+1&&sw.scrollWidth<=sw.clientWidth+1&&sl.scrollWidth<=sl.clientWidth&&sl.scrollHeight<=sl.clientHeight&&(st.textContent===''||st.getBoundingClientRect().right<=r.right-2);")
rep("sw.textContent=w0; st.textContent=t0; if(!hadR) app.classList.remove('range');\n      push('LIGHT_WORDS_FIT_ONE_WIDTH', okAll, got.join(' · ')+' · no wrap '+okAll); }",
    "sw.textContent=w0; st.textContent=t0; if(!hadR) app.classList.remove('range');\n      const cascade=(()=>{ try{ let mi=-1,li=-1,k=0; for(const ss of document.styleSheets){ let rules; try{ rules=ss.cssRules; }catch(e){ continue; } for(const rr of rules){ k++; if(rr.media&&/max-width: ?367px/.test(rr.conditionText||rr.media.mediaText)) mi=k; if(rr.selectorText==='#app.range #startLight') li=k; } } return li>0&&mi>li; }catch(e){ return false; } })(); /* r.201: the narrow-phone rule comes after the light's own rule, so it wins */\n      push('LIGHT_WORDS_FIT_ONE_WIDTH', okAll&&cascade, got.join(' · ')+' · no wrap '+okAll+' · narrow rule last in the cascade '+cascade); }")


# 1c · the counter's colour rule, his words (2026-10-12): GREEN at 20 and above · AMBER 6–19 · RED 5 and under (r.178 read green only above 20)
rep("const r=m.rounds|0; const tone=r<=5?'#E24B3B':(r<=20?'#F0A020':'#3DCC8A');","const r=m.rounds|0; const tone=r<=5?'#E24B3B':(r<20?'#F0A020':'#3DCC8A'); /* r.201 (his rule): green ≥ 20 · amber 6–19 · red ≤ 5 */")

# 2 · QA — the frame measured at 3, 12 and 30 rounds
rep("    { /* r.157 · QUAL_DONE_SAYS_RESTART", "    { /* r.201 · MAGAZINE_KEEPS_ITS_FRAME (the AsM review of r.200 against his r0.178 picture) — the frame is gold at every count; the rounds and the number carry the colour; 3 rounds light three lines, 12 light twelve, 30 read full */\n"+"      const m0=state.mag?Object.assign({},state.mag):null; const at=(n)=>{ state.mag.rounds=n; hudMag(); const fr=document.getElementById('magFrame').getAttribute('stroke'); const lit=[...document.querySelectorAll('#magRibs [data-rib]')].filter(e=>e.getAttribute('stroke')!=='none').length; const col=getComputedStyle(document.getElementById('magRounds')).color; return {fr,lit,col}; };\n        const a3=at(3), a12=at(12), a19=at(19), a20=at(20), a30=at(30); if(m0){ Object.assign(state.mag,m0); hudMag(); }\n        const goldAt3=a3.fr==='#C9A227'&&a3.lit===3&&a3.col==='rgb(226, 75, 59)'; const goldAt12=a12.fr==='#C9A227'&&a12.lit===12&&a12.col==='rgb(240, 160, 32)'; const fullAt30=a30.fr==='#C9A227'&&a30.lit===19&&a30.col==='rgb(61, 204, 138)'; const edge=a19.fr==='#C9A227'&&a19.col==='rgb(240, 160, 32)'&&a20.fr==='#C9A227'&&a20.col==='rgb(61, 204, 138)';\n        push('MAGAZINE_KEEPS_ITS_FRAME', goldAt3&&goldAt12&&fullAt30&&edge, 'at 3 rounds: frame '+a3.fr+', '+a3.lit+' lines, the number '+a3.col+' · at 12: frame '+a12.fr+', '+a12.lit+' lines, '+a12.col+' · at 19: '+a19.col+' · at 20: '+a20.col+' · at 30: frame '+a30.fr+', '+a30.lit+' lines, '+a30.col); }\n"+"    { /* r.157 · QUAL_DONE_SAYS_RESTART")
# 3 · the deck says what it is
rep('overflow:auto">r.200 THE MAGAZINE',
    'overflow:auto">r.201 THE MAGAZINE · the frame stays gold at every count — the rounds and the number carry the colour, as in your picture; each of the last rounds draws a line; the number at the word\'s size; RELOAD at your picture\'s spacing.\nr.200 THE MAGAZINE')
for dead in ["revision:'0.200'","(r<=20?'#F0A020'","#startLight .lamps{display:flex;flex-direction:column;gap:4px}","r>20?'#C9A227':tone","letter-spacing:.06em;font-weight:500;color:#7AB8C4}","font-size:13px;line-height:12px;font-weight:700"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())
