# r.152 -> r.153 — THE BROWSER TAB READS "eXeL Drone-2525" (operator 2026-09-26, docs/asks/2026-09-26_drone_tab_name.md:
# "also make drone-2525 tab name / eXeL Drone-2525 / not sure why ECO IS IN NAME" and the 2026-09-26 follow-up:
# "It should be 'eXeL Drone-2525' not 'eXeL Drone-2525 · MoT · SSSES'"). The served deck's <title> still read
# "eXeL ECO-2525 · MoT · SSSES" — a stale deck name from an early edition — so the phone browser tab said ECO.
# Scope is strict: ONLY the <title> text and the revision stamps change. No logic, no layout, no QA row (a browser
# title carries no runtime behaviour, so there is nothing new to prove at runtime; drone-playable holds the served
# bytes byte-identical to this snapshot, which is the proof the title shipped). Every replacement asserts its exact
# anchor; a miss REFUSES. The whole "· MoT · SSSES" suffix is dropped, per the operator's follow-up.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.152.html'); DST=os.path.join(DECK,'drone-2525_r.153.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# -- 1 . the browser tab title: the stale "eXeL ECO-2525 . MoT . SSSES" becomes exactly "eXeL Drone-2525"
#        (the whole suffix dropped, per the operator's 2026-09-26 follow-up) --
rep('<title>eXeL ECO-2525 · MoT · SSSES</title>',
    '<title>eXeL Drone-2525</title>')

# -- 2 . the deck declares itself r.153 (BUILD const + the header span + the carried-note strings) --
c=s.count("revision:'0.152'"); rep("revision:'0.152'","revision:'0.153'",c)
h=s.count("r0.152"); rep("r0.152","r0.153",h)

for dead in ['ECO-2525',"revision:'0.152'",'r0.152']:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead} x{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)
