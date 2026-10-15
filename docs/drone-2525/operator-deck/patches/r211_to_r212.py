#!/usr/bin/env python3
# Drone-2525 r.211 -> r.212 — THE RECORD THE DECK CARRIES IS CURRENT AGAIN, AND THAT IS WHY HIS SHEET IS STILL NOT ON HIS PHONE.
#
#  HE ASKED A THIRD TIME: "I still do not see why you regress; use image 2 formate for the range". His screenshot's
#  own corner reads r0.210 — he is not looking at r.211 at all. r.211's share-sheet restore is correct, measured
#  and pushed, and IT NEVER REACHED THE SITE.
#
#  THE CAUSE, MEASURED, AND IT IS MINE. Deploy run #1890 on 689a4a4e9 is conclusion: failure. Its `gate` job died
#  at the headless suites in 77 seconds, `ship` was skipped, and because the deck gates run in prebuild since
#  r.196 the Cloudflare build fails the same way — so the site stayed on df76efa and Verify Live #2820's poll was
#  never going to find r.211. The failing line, verbatim:
#
#      FAIL: the deck carries the record through rev 87; the file is exactly one entry longer —
#            this release's own row (lag 2, last kind release)
#      deck-rcore: 91 passed, 1 failed
#
#  tests/deck-rcore.test.mjs:42-45 requires lag === 1. The ledger file has 89 entries; the deck embeds
#  "through":87. 89 - 87 = 2.
#
#  WHAT r.211 OMITTED. r.210's patcher REGENERATED the embedded block from the ledger at build time
#  (THROUGH=len(LEDGER['entries'])), which was right. r.211's patcher never touched the block at all — its only
#  mention of RCORE_LEDGER is the regex that STRIPS it before the code assertions. So the deck kept r.210's
#  through=87 while the ledger grew to 88 (r.210 records) and then 89 (r.211 ship).
#
#  AND I REPORTED IT GREEN. The r.211 commit message says "deck-rcore 92/0". On the bytes that shipped it is
#  91/1, reproducible in one second. r.211 was executed ad-hoc instead of through a chain script, so that gate
#  was run against the r.210 state — before the bookkeeping bumped DECK_REV and appended rev 89 — and a gate run
#  before the bookkeeping is a gate run on a different revision. That is the same defect as the sheet itself: a
#  check that did not check. r212-execute.sh re-runs every deck gate AFTER the bookkeeping, against the exact
#  bytes commit B will carry, and refuses the commit on any non-zero exit.
#
#  THE CLASS, NOT THE INSTANCE. The embedded record is not optional bookkeeping that a patcher may skip — it is
#  part of what the deck IS. This patcher regenerates it from the ledger the way r.210 did, and the chain now
#  proves it on the shipped bytes rather than on an earlier state.
#
#  r.211's share-sheet restore rides along untouched: shipping r.212 is what finally puts his image 2 on his
#  phone. THE_SHEET_NAMES_THE_MAP is unchanged and still sabotage-proved three ways.
#
import hashlib,json,os,re,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
ROOT=os.path.normpath(os.path.join(DECK,'..','..','..'))
BASE_REV='211'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.212.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.211')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# ── M1 · the corner and BUILD read one number, as always ──────────────────────────────────────────────
rep("revision:'0.211'","revision:'0.212'",1)
rep("r0.211","r0.212",1)

# ── M2 · THE RECORD, REGENERATED FROM THE LEDGER (the step r.211 omitted) ─────────────────────────────
# The deck carries the record up to the revision before itself: its own release row is written in the records
# commit, after these bytes are frozen. At build time the ledger's last row is r.211's (rev 89); r.212's own row
# (rev 90) is appended afterwards, so the file ends exactly ONE entry longer than the block — which is what
# tests/deck-rcore.test.mjs holds, field for field.
LEDGER=json.load(open(os.path.join(ROOT,'docs','traceability','drone-2525.ledger.json'),encoding='utf-8'))
THROUGH=len(LEDGER['entries'])
if THROUGH!=89: raise SystemExit('REFUSE: expected the ledger to end at rev 89 (r.211 released); found %d'%THROUGH)
MODEL=re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
_e=[]
for e in LEDGER['entries'][:THROUGH]:
    o={'rev':e['rev'],'date':e['date'],'kind':e['kind'],'text':MODEL.sub('an external model',e.get('text','')),'commit':e.get('commit','')}
    if 'shipped' in e: o['shipped']=e['shipped']
    _e.append(o)
BLOCK=json.dumps({'section':LEDGER['section'],'route':LEDGER['route'],'through':THROUGH,'entries':_e},ensure_ascii=False,separators=(',',':'))
for bad in ['</script','<!--','-->',' ',' ']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r, which would break the inline script'%bad)

_old=re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/',s)
if not _old: raise SystemExit('REFUSE: no RCORE_LEDGER block in the r.211 base')
_prev=json.loads(_old.group(1))
if _prev.get('through')!=87: raise SystemExit('REFUSE: expected the r.211 base to embed through 87; found %r'%_prev.get('through'))
s=s[:_old.start()]+'/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER='+BLOCK+';/*RCORE_LEDGER_END*/'+s[_old.end():]
n[0]+=1

# ── the record must now BE the ledger's first 89, field for field, in the gate's own field order ───────
_new=json.loads(re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/',s).group(1))
if _new['through']!=89 or len(_new['entries'])!=89: raise SystemExit('REFUSE: the embedded block is not through 89')
if json.dumps(_new['entries'],ensure_ascii=False,separators=(',',':'))!=json.dumps(_e,ensure_ascii=False,separators=(',',':')):
    raise SystemExit('REFUSE: the embedded entries are not the ledger entries')

# ── stale: nothing may still claim r.211 or the old through ───────────────────────────────────────────
for bad in ["revision:'0.211'","r0.211",'"through":87']:
    if bad in s: raise SystemExit('REFUSE: stale %r survived'%bad)
# ── present: r.211's restored sheet is untouched, and the new record is in ────────────────────────────
for need in ["revision:'0.212'","r0.212",'"through":89','Scan to share The Range','#qrCopy','rungTitle','THE_SHEET_NAMES_THE_MAP']:
    if need not in s: raise SystemExit('REFUSE: %r missing'%need)

# ── the script still parses (the embedded record is DATA, stripped before the code is checked) ─────────
_m=re.findall(r'<script>([\s\S]*?)</script>',s)
if len(_m)!=2: raise SystemExit('REFUSE: expected 2 inline scripts, found %d'%len(_m))
for _i,_src in enumerate(_m):
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _f:
        _f.write(_src); _p=_f.name
    _r=subprocess.run(['node','--check',_p],capture_output=True,text=True); os.unlink(_p)
    if _r.returncode!=0: raise SystemExit('REFUSE: script #%d does not parse\n%s'%(_i+1,_r.stderr[:2000]))

open(DST,'w',encoding='utf-8').write(s)
print('r.212 written: %d edits · %d bytes · sha256 %s'%(n[0],len(s.encode('utf-8')),hashlib.sha256(s.encode('utf-8')).hexdigest()))
print('ledger embedded through rev %d (%d entries) — the file will be one longer once r.212 releases'%(THROUGH,len(_e)))
