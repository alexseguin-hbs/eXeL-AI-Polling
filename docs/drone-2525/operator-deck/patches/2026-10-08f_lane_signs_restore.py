# 2026-10-08 (operator): "remove the new 100/200/300 white post signs and restore the ORIGINAL lane signs" — undoes the distance
# boards of 2026-10-08d and puts back r0.166's own lane boards ("20 21" / "21 22") on lane 21's edges, drawn exactly as the deck
# draws them (boardLabels, white board, black numbers). Kept from 2026-10-08d: no floating target callout in the scene, so the lane
# words no longer dodge it (nothing else about the boards changes); mags, status line, reticle-following cues, QR all unchanged.
# Run from the repo root AFTER 2026-10-08_qr_berms_mags_range.py, ...b, ...c, ...d (2026-10-08e may run before or after this one):
#   python3 docs/drone-2525/operator-deck/patches/2026-10-08f_lane_signs_restore.py
import os
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'frontend','public','drone-2525','play.html')
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    c=s.count(a)
    if c!=1: raise SystemExit(f'REFUSE: expected 1 of {a[:90]!r}, found {c}')
    s=s.replace(a,b)
# 1. the distance boards are no longer painted
rep("\n  if(typeof drawRangeDistances==='function') drawRangeDistances(hc,W,H,cam); /* eXeL 2026-10-08d: 100/200/300 m distance boards, world-sized, over the lane words */","")
# 2. their code goes, and the deck's own signCoversTarget is no longer wrapped
a=s.index('const RANGE_SIGN={'); b=s.index("}; })();\n",a)+len("}; })();\n")
if s.count('const RANGE_SIGN={')!=1 or 'signsYield' not in s[a:b]: raise SystemExit('REFUSE: distance-board block')
s=s[:a]+s[b:]
rep("/* eXeL 2026-10-08 (operator, Fitness-2525 agent): RANGE DISTANCE BOARDS (2026-10-08d) + LANE 21 QR + DEEP LINK.",
    "/* eXeL 2026-10-08 (operator, Fitness-2525 agent): LANE 21 QR + DEEP LINK (the 2026-10-08d distance boards were removed in 2026-10-08f).")
# 3. lane 21's own edge boards are painted again, as r0.166 drew them
rep("boardLabels(hc,W,H,cam).filter(b=>!b.mine).forEach(b=>{ hc.globalAlpha=b.mine?1:0.45; /* eXeL 2026-10-08d: no lane-number tag beside my own targets */",
    "boardLabels(hc,W,H,cam).forEach(b=>{ hc.globalAlpha=b.mine?1:0.45;")
open(p,'w',encoding='utf-8').write(s)
print('applied: distance boards removed, original lane boards restored')
