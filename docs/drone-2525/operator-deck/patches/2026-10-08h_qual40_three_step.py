# 2026-10-08 (operator): "ensure Qual-40 qualification mode has 3 step target cycle as well. no targets should default red."
# In QUAL 40 (and TRAIN DOWN) a shooter's mark used to ride its target down and back up (r.162 Addenda 14-15, keepsMark), so a
# target that stood again for the next engagement came up already boxed red with FIRE lit. Now, in EVERY mode, a target that goes
# down (hit, or its window ends) drops its mark, and a target the tower raises always stands unmarked: TARGET -> amber, APPROVE ->
# red, FIRE — the same per-target state and reticle-following buttons as TRAIN UP (2026-10-08d). No auto-approve, no auto-red.
# The deck's QA (MARK_SURVIVES_THE_RETURN, MARKS_ARE_REMEMBERED, NO_RING_ON_A_DOWN_TARGET) now asserts this rule.
# QUAL 40 exposure times (5/8/12/16 s for 1/2/3/4 targets) and scoring are unchanged.
# Run from the repo root AFTER 2026-10-08_qr_berms_mags_range.py and ...b ... ...g:
#   python3 docs/drone-2525/operator-deck/patches/2026-10-08h_qual40_three_step.py
import os
ROOT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'frontend','public','drone-2525','play.html')
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    c=s.count(a)
    if c!=1: raise SystemExit(f'REFUSE: expected 1 of {a[:90]!r}, found {c}')
    s=s.replace(a,b)
# 1. no mode keeps a mark through its target going down
rep("function keepsMark(q){ if(!q||!q.form||!marksPersist()||!modeReturns()||(state.rangeMode||'bounce')==='bounce') return false;",
    "function keepsMark(q){ return false; /* eXeL 2026-10-08h (operator: \"no targets should default red\"): in every mode a target that goes down drops its mark; the next time it stands it is TARGET, then APPROVE, then FIRE */ if(!q||!q.form||!marksPersist()||!modeReturns()||(state.rangeMode||'bounce')==='bounce') return false;")
# 2. a target the QUAL tower raises stands unmarked (belt and braces: any stale box or red approval on it is dropped)
rep("R.cur=e.bases.map(b=>plateOf(mine,b)).filter(Boolean).map(q=>{ q.up=true;q.lifePct=100;q.life=e.sec;q.fall=0;q._dead=0;q._eng=false;q._down=false;q.mist=false; return q.id; });",
    "R.cur=e.bases.map(b=>plateOf(mine,b)).filter(Boolean).map(q=>{ if(mine===(state.lane||0)) rangeRelease(q); /* eXeL 2026-10-08h: a raised target is never pre-marked */ q.up=true;q.lifePct=100;q.life=e.sec;q.fall=0;q._dead=0;q._eng=false;q._down=false;q.mist=false; return q.id; });")
# 3. the deck's own QA asserted the old "a mark rides its target down and back up" rule — it now asserts the new one
rep("aimUnitAt(uu,q,-40,40); const back=!!q.up&&!!state.desig&&state.desig.id===q.id&&state.desig.phase==='red';",
    "aimUnitAt(uu,q,-40,40); const upAgain=!!q.up; const back=!!q.up&&!!state.desig&&state.desig.id===q.id&&state.desig.phase==='red';")
rep("push('MARK_SURVIVES_THE_RETURN', hit1&&red1&&held&&back&&hit2, 'one mark, one approval: hit '+hit1+' · still red '+red1+' · F while down holds, no round '+held+' · back up still red '+back+' · second hit '+hit2); }",
    "push('MARK_SURVIVES_THE_RETURN', hit1&&!red1&&upAgain&&!back&&!hit2, '2026-10-08h — no mark survives its target going down: hit '+hit1+' · mark dropped '+!red1+' · back up '+upAgain+' and unmarked '+!back+' · F on it fires nothing until TARGET, APPROVE '+!hit2); }")
rep("const keptUp=ph('C-100L')==='red'&&ph('C-150R')==='red'&&ph('C-200L')==='amber';",
    "const keptUp=ph('C-100L')==='none'&&ph('C-150R')==='none'&&ph('C-200L')==='amber'; /* 2026-10-08h: a hit target drops its mark; the untouched amber one stays */")
rep("const qualKept=!qq.up&&!!markSlotOf(qq.id);",
    "const qualKept=!qq.up&&!markSlotOf(qq.id); /* 2026-10-08h: the mark ends with the group — the target stands unmarked next time */")
rep("' · marks kept '+keptUp+", "' · hit ones unmarked, amber kept '+keptUp+")
rep("' · QUAL 40: the mark outlives the group '+qualKept", "' · QUAL 40: the mark ends with the group '+qualKept")
rep("push('NO_RING_ON_A_DOWN_TARGET', downNow&&!ringWould&&", "push('NO_RING_ON_A_DOWN_TARGET', (downNow||!o)&&!ringWould&&")
open(p,'w',encoding='utf-8').write(s)
print('applied: every target starts unmarked in every mode (QUAL 40 three-step cycle)')
