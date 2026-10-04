# r.153 -> r.154 — THE QUAL · 40 CLOCK COUNTS REAL SECONDS; 10 s BETWEEN POSITIONS (operator 2026-10-04,
# docs/asks/2026.10.04_03.56..35_drone2525_qual40_exposure_times.md: "make sure times for multiple targets on qual40 are accurate").
# Measured defect in r.153: the frame loop caps every step at 50 ms (dt=Math.min(.05,…)) and rangeTick runs inside phys → spawn on that
# capped step, so below 20 fps the exposure windows (5/8/12/16 s), the 3 s engagement gap, the phase gap and the TRAINING · RESET 3 s
# return all stretched — at ~160 ms frames a 5 s exposure lasted 16.58 s. The fix: the RANGE clock counts wall time (capped at 0.25 s per
# frame so a backgrounded tab cannot skip an engagement); physics keeps its 50 ms step. The loop hands the wall step to the range for the
# length of its own phys() call only (state.rangeDtNow, cleared after), so the QA's and the STEP button's synthetic phys(dt) calls keep
# their own dt. The phase gap becomes the SOURCED 10 s transition (iwtsexplained.com/table-vi and the 2019 Infantry magazine, via search
# results; the operator's "~8–10 s"). A new boot-QA row QUAL_CLOCK_IS_WALL_TIME proves the helper and the wiring in the served bytes.
# Every replacement asserts its exact anchor; a miss REFUSES.
import hashlib,os
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(DECK,'drone-2525_r.153.html'); DST=os.path.join(DECK,'drone-2525_r.154.html')
s=open(SRC,encoding='utf-8').read()
n=[0]
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1
    s=s.replace(old,new)

# -- 1 . the phase gap is the sourced 10 s transition, and the pure range-clock helper sits with the range constants --
rep('const PHASE_GAP_S=9; /* between phases, mag change + move ("~8–10 s", DECLARED midpoint) */',
    'const PHASE_GAP_S=10; /* between phases, mag change + move: the SOURCED 10 s transition delay (iwtsexplained.com/table-vi; the 2019 Infantry magazine, via search results; the operator\'s "~8–10 s") — r.154 */\n'
    'function rangeDt(ms){ return Math.max(0,Math.min(0.25,(ms||0)/1000)); } /* r.154: the range clock counts wall time (operator 2026-10-04), capped at 0.25 s so a backgrounded tab cannot skip an engagement; physics keeps its 50 ms step */')

# -- 2 . the frame loop measures the raw elapsed BEFORE last=now, and hands it to the range for this phys() call only --
rep('    const dt=Math.min(.05,(now-last)/1000);last=now;',
    '    state.rangeDtNow=rangeDt(now-last); /* r.154: the wall step for the range clock, taken before last moves */\n'
    '    const dt=Math.min(.05,(now-last)/1000);last=now;')
rep('    if(!state.paused){phys(dt);state.tickN++;}hold+=dt;tel+=dt;',
    '    if(!state.paused){phys(dt);state.tickN++;} state.rangeDtNow=null; /* r.154: synthetic phys(dt) calls (QA, STEP) keep their own dt */ hold+=dt;tel+=dt;')

# -- 3 . the range ticks on the wall step when the loop supplied one (every other rangeTick caller is unchanged) --
rep('  if(+state.challenge===0) rangeTick(dt);',
    '  if(+state.challenge===0) rangeTick(state.rangeDtNow!=null?state.rangeDtNow:dt); /* r.154: the QUAL · 40 windows, gaps and the RESET return count real seconds */')

# -- 4 . the exposure row holds the sourced 10 s (it allowed 8–10 around the declared 9) --
rep("ENG_GAP_S===3&&PHASE_GAP_S>=8&&PHASE_GAP_S<=10&&IWQ_ENG.every(",
    "ENG_GAP_S===3&&PHASE_GAP_S===10&&IWQ_ENG.every(")

# -- 5 . the boot-QA row that proves the range clock is wall time, in the served bytes --
rep("    push('QUAL_EXPOSURE_BY_COUNT', ",
    "    { /* r.154 · the range clock counts wall time: a slow frame no longer stretches a window; a stalled tab cannot skip one */\n"
    "      const w1=rangeDt(160), w2=rangeDt(5000), w3=rangeDt(-5), wl=String(loop).includes('rangeDtNow'), wp=String(spawn).includes('rangeDtNow')&&String(phys).includes('spawn(dt)');\n"
    "      push('QUAL_CLOCK_IS_WALL_TIME', w1===0.16&&w2===0.25&&w3===0&&wl&&wp, 'rangeDt 160ms→'+w1+' · 5000ms→'+w2+' · -5ms→'+w3+' · loop+phys use wall dt ('+wl+'/'+wp+')'); }\n"
    "    push('QUAL_EXPOSURE_BY_COUNT', ")

# -- 6 . the deck declares itself r.154 (BUILD const + the header span + the carried-note strings) --
c=s.count("revision:'0.153'"); rep("revision:'0.153'","revision:'0.154'",c)
h=s.count("r0.153"); rep("r0.153","r0.154",h)

for dead in ['const PHASE_GAP_S=9;','  if(+state.challenge===0) rangeTick(dt);','PHASE_GAP_S>=8&&PHASE_GAP_S<=10',"revision:'0.153'",'r0.153']:
    if dead in s: raise SystemExit(f'REFUSE: stale symbol survives: {dead} x{s.count(dead)}')
open(DST,'w',encoding='utf-8').write(s)
b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest(),'rev',c,'hdr',h)
