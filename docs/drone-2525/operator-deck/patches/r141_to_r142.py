# r.141 -> r.142 — RELOAD BY HAND ON QUAL, AND THE SAME ORDER AS THE ACTUAL TEST (operator 2026-09-23,
# docs/asks/2026-09-23_qual_reload_fixed_order.md): "key is we reload on Qual and have same order as actual test so user memorizes order".
#   The engagement program names its silhouettes (left / centre / right) and is the SAME on every lane, every time: no per-lane seed.
#   Each phase is exactly ten targets = one magazine; the tower's rest no longer loads the next magazine — the shooter presses RELOAD;
#   an empty magazine refuses FIRE; four magazines only, as issued.
# Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.141.html'); DST=os.path.join(DECK,'drone-2525_r.142.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# ── R142-1 · the program names its silhouettes; the same order on every lane ──
rep("""const IWQ_VI=[
  {ph:1,pos:'STANDING → PRONE UNSUPPORTED',eng:[[50],[100],[150],[50,150,200],[150,200,250,300]]},
  {ph:2,pos:'PRONE SUPPORTED',eng:[[100],[150,300],[200,300],[250,300],[150,250,300]]},
  {ph:3,pos:'KNEELING SUPPORTED',eng:[[50,100,200],[50,200],[150,250],[100,150,200]]},
  {ph:4,pos:'STANDING SUPPORTED',eng:[[50,200],[100,150,250],[100,200],[50,100,250]]} /* DECLARED (15–18) */
];
const IWQ_ENG=IWQ_VI.flatMap(P=>P.eng.map(r=>({ph:P.ph,pos:P.pos,ranges:r}))).map((e,i)=>({...e,n:i+1}));""",
"""/* r.142 (operator 2026-09-23): the program NAMES its silhouettes — left / centre / right — and is the same on every lane, every time,
   so a shooter can memorise it the way the real table is memorised. Ranges per engagement are the operator's IWQ Table VI (1–14 verbatim,
   15–18 DECLARED); which sibling stands at a range is DECLARED here, once, and never seeded. Each phase is exactly ten targets. */
const IWQ_VI=[
  {ph:1,pos:'STANDING → PRONE UNSUPPORTED',eng:[['C-50'],['C-100C'],['C-150L'],['C-50L','C-150R','C-200L'],['C-150L','C-200R','C-250','C-300']]},
  {ph:2,pos:'PRONE SUPPORTED',eng:[['C-100L'],['C-150R','C-300'],['C-200L','C-300'],['C-250','C-300'],['C-150L','C-250','C-300']]},
  {ph:3,pos:'KNEELING SUPPORTED',eng:[['C-50','C-100R','C-200R'],['C-50L','C-200L'],['C-150R','C-250'],['C-100C','C-150L','C-200R']]},
  {ph:4,pos:'STANDING SUPPORTED',eng:[['C-50','C-200L'],['C-100L','C-150R','C-250'],['C-100R','C-200R'],['C-50L','C-100C','C-250']]} /* DECLARED (15–18) */
];
const IWQ_ENG=IWQ_VI.flatMap(P=>P.eng.map(ids=>({ph:P.ph,pos:P.pos,ids,ranges:ids.map(id=>(QUAL.find(q=>q.id===id)||{}).z)}))).map((e,i)=>({...e,n:i+1}));""")
rep("  const e=IWQ_ENG[k|0]; if(!e) return null; const r=mulberry32(2525+(lane|0)*97+(k|0));\n  const bases=e.ranges.map(z=>{ let c=QUAL.filter(q=>q.z===z); if(typeof onSheet==='function'&&onSheet()) c=c.filter(q=>sheetHas(q)); if(k===0&&z===50) return 'C-50'; return c[Math.floor(r()*c.length)].id; }); /* r.140: the sheet has one 50 m silhouette */",
    "  const e=IWQ_ENG[k|0]; if(!e) return null;\n  const bases=e.ids.map(id=>(typeof onSheet==='function'&&onSheet()&&id==='C-50L')?'C-50':id); /* r.142: the named silhouettes, the same on every lane · r.140: the sheet has one 50 m silhouette, so its 50 L is the 50 */")

# ── R142-2 · reload by hand: the rest says RELOAD, the shooter presses it; four magazines only ──
rep("R.phase='phasegap'; magLoad('PHASE'); if(rangeArmed()) toast('PHASE '+nxt.ph+' · '+nxt.pos+' · MAG CHANGE · MOVE'); } /* r.138: the tower's mag change loads the next 10 on the record */",
    "R.phase='phasegap'; if(rangeArmed()) toast('PHASE '+nxt.ph+' · '+nxt.pos+' · PRESS RELOAD · MOVE'); } /* r.142: the shooter changes the magazine himself, as on the range; the tower only rests */")
rep("{ const bR=document.getElementById('btnReload'); if(bR) bR.onclick=()=>{ if(state.mag&&state.mag.rounds===state.mag.cap){ toast('MAGAZINE FULL · '+state.mag.rounds+' RDS'); return; } magLoad('MANUAL'); toast('RELOADED · MAG '+state.mag.n+' · '+state.mag.rounds+' RDS'); };",
    "{ const bR=document.getElementById('btnReload'); if(bR) bR.onclick=()=>magReload(); /* r.142: one rule for the button and the QA */")
rep("function qualResetTower(){\n  magLoad('RESET');",
    """function magReload(){ /* r.142: the shooter's own reload — refused when full; in QUAL four magazines as issued, a fifth is refused on the record */
  if(state.mag&&state.mag.rounds===state.mag.cap){ toast('MAGAZINE FULL · '+state.mag.rounds+' RDS'); return false; }
  const q=state.rangeMode==='qual40'&&+state.challenge===0; if(q&&state.mag&&(state.mag.n|0)>=4){ decide('REJECT','MAG',{reason:'NO_MAGAZINE'}); toast('NO MAGAZINE LEFT · 4 OF 4 USED'); return false; }
  magLoad('MANUAL'); toast('RELOADED · MAG '+state.mag.n+(q?'/4':'')+' · '+state.mag.rounds+' RDS'); return true; }
function qualResetTower(){
  magLoad('RESET');""")
rep("' · IWQ TABLE VI · 40 TARGETS · 18 ENGAGEMENTS · 4 MAGAZINES OF 10 · OPTIC 3× · 23 MARKSMAN 30 SHARP 36 EXPERT'","' · IWQ TABLE VI · 40 TARGETS · 18 ENGAGEMENTS · 4 MAGAZINES OF 10 · YOU RELOAD AT EACH POSITION · OPTIC 3× · 23 MARKSMAN 30 SHARP 36 EXPERT'")

# ── QA rows ──
rep("      push('QUAL_LANES_DIFFER', same&&diff&&Array.from({length:18},(_,k)=>engagementAt(0,k)).every((e,k)=>e.ranges===undefined||true)&&Array.from({length:18},(_,k)=>engagementAt(1,k)).every(e=>e.bases.every(b=>QUAL.some(q=>q.id===b))), 'the same program on every lane; which sibling stands is seeded per lane (L01 ≠ L02), replay repeats'); }",
    """      { const sig=l=>Array.from({length:18},(_,k)=>engagementAt(l,k).bases.join()).join('|'); const allSame=[1,2,20,41].every(l=>sig(l)===sig(0)); const count={}; IWQ_ENG.forEach(e=>e.ids.forEach(id=>{count[id]=(count[id]||0)+1;})); const per=['C-50','C-50L','C-100C','C-100L','C-100R','C-150L','C-150R','C-200L','C-200R','C-250','C-300'].map(id=>count[id]||0).join('/'); const phaseTen=IWQ_VI.every(P=>P.eng.reduce((a,ids)=>a+ids.length,0)===10);
        push('QUAL_SAME_ORDER_EVERY_LANE', same&&allSame&&phaseTen&&per==='3/3/3/2/2/4/4/4/4/6/5'&&IWQ_ENG.every(e=>e.ids.every(id=>QUAL.some(q=>q.id===id))), 'the program names its silhouettes and is the same on every lane (L01 = L02 = L21 = L42) — a shooter can memorise it; ten targets a phase; per silhouette '+per); } }""")
rep("      push('PHASE_CHANGES_MAG', !!state.mag&&state.mag.n===2&&state.mag.rounds===10&&state.mag.cap===10&&(state.events||[]).some(e=>e.verb==='RELOAD'&&e.data&&e.data.why==='PHASE'), 'the phase rest loads magazine 2 of 4 (10 rounds) as a RELOAD row');\n","")
rep("push('QUAL_PHASE_2_STARTS', ph2 && R.eng.n===6 && R.cur.length===1, 'phase 2 opens on engagement 6, a single at 100 m');",
    """push('QUAL_PHASE_2_STARTS', ph2 && R.eng.n===6 && R.cur.length===1, 'phase 2 opens on engagement 6, a single at 100 m');
      { const n1=state.mag.n, r1=state.mag.rounds; const q=PLATES.find(p=>p.id===R.cur[0]); state.mag.rounds=0; const dN=(state.decisions||[]).length; state.tgtSlot={}; state.desig=null; state.hiApproved=false; designate({id:q.id,kind:'pop',ref:q},'QA'); approveDesig('HI-2'); const red=!!(state.desig&&state.desig.phase==='red'); fireN(1); const empty=(state.decisions||[]).slice(dN).some(d=>d.reason==='EMPTY_MAGAZINE');
        push('PHASE_NEEDS_RELOAD', n1===1&&r1===10&&!(state.events||[]).some(e=>e.verb==='RELOAD'&&e.data&&e.data.why==='PHASE')&&red&&empty, 'the phase rest loads nothing: magazine 1 still in with its 10 unspent; on engagement 6 a FIRE with an empty magazine is refused until the shooter presses RELOAD'); state.desig=null; state.tgtSlot={}; state.hiApproved=false; }""")
rep("      push('RELOAD_ON_RECORD', state.mag.rounds===10&&state.mag.n===2&&(state.events||[]).length===e1+1&&!!row&&row.verb==='RELOAD'&&row.data&&row.data.why==='MANUAL', 'RELOAD refills ten and is one canonical row (why MANUAL, magazine 2)');",
    """      push('RELOAD_ON_RECORD', state.mag.rounds===10&&state.mag.n===2&&(state.events||[]).length===e1+1&&!!row&&row.verb==='RELOAD'&&row.data&&row.data.why==='MANUAL', 'RELOAD refills ten and is one canonical row (why MANUAL, magazine 2)');
      { magLoad('MANUAL'); magLoad('MANUAL'); const n4=state.mag.n; state.mag.rounds=0; const dN=(state.decisions||[]).length; const ok5=magReload(); const refused=!ok5&&(state.decisions||[]).slice(dN).some(d=>d.reason==='NO_MAGAZINE');
        push('QUAL_FOUR_MAGS', n4===4&&refused&&state.mag.n===4&&state.mag.rounds===0, 'four magazines as issued: a fifth RELOAD is refused NO_MAGAZINE'); }""")

c=s.count("revision:'0.141'"); rep("revision:'0.141'","revision:'0.142'",c)
h=s.count("r0.141"); rep("r0.141","r0.142",h)
for dead in ["magLoad('PHASE')","mulberry32(2525+(lane|0)*97","QUAL_LANES_DIFFER","PHASE_CHANGES_MAG"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)
