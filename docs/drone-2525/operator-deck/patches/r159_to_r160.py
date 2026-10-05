# r.159 -> r.160 — the signs readable (operator 2026-10-05, ASK.md Addendum 11, verbatim: "I can't read signs"; his r.159 screenshot
# showed blank white boards: r.159 wrote no numbers under 5 px, which at 1x was every board).
#  The sign keeps the photo's look — a small white board on a post, black numbers — and now ALWAYS carries its numbers: the short form
#  like the photo's "5 6" ("20 21"; "1" and "42" at the outer edges), at least 9 px, the board growing just enough to hold them (never
#  smaller than its real 0.6 x 0.35 m size). It still never covers a target. QA LANE_NUMBERS_ON_THE_SIGN rewritten: every written sign
#  carries legible numbers inside its board, centred on the board's real centre.
# The fire doctrine is untouched.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.159.html'); DST=os.path.join(DECK,'drone-2525_r.160.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)
rep("function laneBoardText(a,b){","const SIGN_MIN_PX=9; function signShort(m){ return (m.left&&m.right)?(m.left+' '+m.right):String(m.left||m.right); } /* r.160 (Addendum 11): the photo's short form, \"5 6\" */\nfunction laneBoardText(a,b){")
rep(") return; const tw=hc.measureText(m.txt).width; const pl=proj([m.x-MARKER_BOARD_W/2",") return; const sh=signShort(m), tw=hc.measureText(sh).width; const pl=proj([m.x-MARKER_BOARD_W/2")
rep("const hw=Math.max(1,bw), hh=Math.max(1,bh);","const fs=Math.max(SIGN_MIN_PX,Math.min(14,bh*1.5)); const hw=Math.max(1,bw,tw*fs/20+3), hh=Math.max(1,bh,fs*0.6+1); /* r.160: never smaller than the real board, and always big enough for its numbers (≥ 9 px) */")
rep("const fs=Math.min(hh*1.5,10*(2*hw-2)/Math.max(1,tw));","")
rep("out.push({txt:m.txt,x:pr.x,y:pr.y,fs,","out.push({txt:m.txt,sh,x:pr.x,y:pr.y,fs,")
rep("if(b.fs>=5){ hc.font=b.fs.toFixed(1)+'px ui-monospace,monospace'; hc.fillStyle='#000000'; hc.fillText(b.txt,b.x,b.y); }","hc.font=b.fs.toFixed(1)+'px ui-monospace,monospace'; hc.fillStyle='#000000'; hc.fillText(b.sh,b.x,b.y+0.5);")
rep(r"""hc.font='10px ui-monospace,monospace'; const tw=hc.measureText(b.txt).width*b.fs/10;
          if(!c||!l||Math.abs(c.x-b.x)>1||Math.abs((b.x1-b.x0)/2-Math.max(1,Math.abs(c.x-l.x)))>1||(b.fs>=5&&tw>b.x1-b.x0)) bad++;""",
r"""hc.font='10px ui-monospace,monospace'; const tw=hc.measureText(b.sh).width*b.fs/10;
          if(!c||!l||Math.abs(c.x-b.x)>1||(b.x1-b.x0)/2+1e-6<Math.max(1,Math.abs(c.x-l.x))||b.fs<SIGN_MIN_PX||tw>b.x1-b.x0||b.sh!==signShort(m)) bad++;""")
rep("""'), '+bad+' not at their real 0.6 × 0.35 m size or with numbers off the board; white board, black numbers');""","""'), '+bad+' without legible numbers (≥ '+SIGN_MIN_PX+' px, short form like "20 21") inside a board at least its real 0.6 × 0.35 m size; white board, black numbers (operator: "I can\\'t read signs")');""")
c=s.count("revision:'0.159'"); rep("revision:'0.159'","revision:'0.160'",c)
h=s.count("r0.159"); rep("r0.159","r0.160",h)
for dead in ["revision:'0.159'","r0.159","b.fs>=5"]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead}')
open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())
