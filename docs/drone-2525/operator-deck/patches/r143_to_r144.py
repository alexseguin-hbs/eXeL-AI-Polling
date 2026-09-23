# r.143 -> r.144 — THE TARGETS ON EACH OF THE 42 LANES (operator 2026-09-23, docs/asks/2026-09-23_targets_on_all_42_lanes.md):
# every lane carries the same eleven silhouettes (it did, as data — 42 × 11 = 462 plates — but a shooter saw only his neighbours' 50 m
# plates); now the neighbouring lanes (±1) draw every standing silhouette, dim, while marking and firing stay on his own lane; the data and
# the picture are both gated. Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.143.html'); DST=os.path.join(DECK,'drone-2525_r.144.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

rep("    else { if(!q.up)return; if(!mine && Math.abs((q.lane||0)-(state.lane||0))>1) return; if(!mine && q.base!=='C-50') return; }",
    "    else { if(!q.up)return; if(!mine && Math.abs((q.lane||0)-(state.lane||0))>1) return; } /* r.144: the neighbouring lanes (±1) show every standing silhouette, dim — the targets are on each of the 42 lanes (operator); marking and firing stay on my lane */")
rep("const PLATES=LANES.flatMap(L=>QUAL.map(q=>({...q,id:q.id+'-'+L.id,base:q.id,lane:L.i,up:true,lifePct:100,fall:0})));",
    "const PLATES=LANES.flatMap(L=>QUAL.map(q=>({...q,id:q.id+'-'+L.id,base:q.id,lane:L.i,up:true,lifePct:100,fall:0}))); /* r.144: 42 lanes × 11 silhouettes = 462 plates; every lane carries the same eleven at the same ranges (QA EVERY_LANE_HAS_THE_TARGETS) */")

# ── QA rows ──
rep("    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',",
    """    { const perLane=LANES.every(L=>{ const ps=PLATES.filter(p=>p.lane===L.i); return ps.length===QUAL.length && QUAL.every(q=>ps.some(p=>p.base===q.id&&p.id===q.id+'-'+L.id&&p.z===q.z&&p.form===q.form)); });
      const l0=state.lane; state.rangeMode='bounce'; state.lane=41; rangeReset(); const far=platesHere(); const allUp=PLATES.every(p=>p.up); state.lane=l0; rangeReset();
      push('EVERY_LANE_HAS_THE_TARGETS', LANES.length===42&&PLATES.length===42*QUAL.length&&perLane&&far.length===QUAL.length&&far.every(p=>p.id.endsWith('-L42'))&&allUp, '42 lanes × '+QUAL.length+' silhouettes = '+PLATES.length+' plates; L42 carries the same eleven; in training every lane\\'s targets stand'); }
    { const seen={}; drawPlates((arr,col)=>{ seen[col]=(seen[col]||0)+1; }); const nb=LANES.filter(L=>L.i!==(state.lane||0)&&Math.abs(L.i-(state.lane||0))<=1).length; const mineN=platesHere().filter(q=>q.up).length;
      push('NEIGHBOUR_LANES_DRAWN', (seen[T13.SI]||0)===mineN&&(seen[T13.STROKE]||0)===nb*QUAL.length, 'my lane draws its '+mineN+' silhouettes; the '+nb+' neighbouring lane(s) draw all '+(nb*QUAL.length)+' of theirs, dim (a real range shows the lanes beside you)'); }
    const h50b=shootPlate('C-50',2); push('RANGE_HIT_50_OFF2',""")

c=s.count("revision:'0.143'"); rep("revision:'0.143'","revision:'0.144'",c)
h=s.count("r0.143"); rep("r0.143","r0.144",h)
for dead in ["if(!mine && q.base!=='C-50') return;"]:
    if dead in s: raise SystemExit(f'REFUSE: dead symbol survives: {dead} ×{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)
