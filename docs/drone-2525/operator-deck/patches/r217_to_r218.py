# r.217 -> r.218 — THE RECORD CITES WHAT EXISTS, AND THE BUILD THE SITE RUNS IS THE BUILD THE GATES RAN
#  (2026-10-19; the day the site sat on 03a40c6 through seven pushes).
#
#  WHAT HAPPENED, measured. r.217 shipped as 02c8cf03a with every gate green here, and never reached the glass.
#  Two separate faults, both mine, each invisible to the chain as it stood:
#   1. Ledger rev 95 (r.216) cited commit 17a21cc - an abandoned first artefact that exists ONLY in this container
#      and was never pushed, not an ancestor of main. tests/traceability.test.mjs tested EXISTENCE (cat-file -e),
#      which passes in any clone holding a dangling object and fails on every GitHub runner. Deploy's gate went
#      red on r.217 and every commit after it. Fixed in the record (rev 95 -> cbf852f, rev 97 = the correction row)
#      and in the gate (merge-base --is-ancestor), shown red first.
#   2. Cloudflare never ran that gate - it is not in prebuild - and still did not promote r.217, because its own
#      prebuild step scripts/integrity-guard.mjs BLOCKED on public/r-core/code/drone-2525/96.json: the git diff text
#      of r.217's artefact carries my red-first helper, which said eval(chr(34)...). Reproduced exactly by running
#      `npm run build` in a fresh SHALLOW clone of origin/main - his environment, not my theory of it - the step
#      r.217's chain skipped. The code record is diff TEXT, proven equal to git history by rcore-code-record and
#      never executed, so it is exempt from signature scanning (deliberately, with the reason in the guard, and a
#      sabotage test that it still bites everywhere else); the helper no longer calls eval.
#
#  THIS REVISION'S DECK CHANGES ARE ONLY THE RECORD IT CARRIES: the corner and BUILD read 0.218, and the embedded
#  R-CORE record moves on to rev 97 (the correction row), lag exactly one as deck-rcore holds. r.217's toast and
#  share-line fix ride unchanged. Frozen spans moved: none.
#
#  INVARIANT (r.218): every commit the record cites is reachable from the branch it is recorded on; and the chain
#  runs `npm run build` in a fresh shallow clone before any ship commit, because a gate that passes here and not
#  on the builder is not a gate.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
BASE_REV = '217'; NEW_REV = '218'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {n}')
    s = s.replace(old, new, count); return s

for need in ["toast('HIT · '+plateWord(s.id)+' · DOWN', s.id);", "#qrSheet #qrUrl .j{white-space:nowrap}", "THE_HIT_TOAST_CLEARS", "THE_SHARE_LINE_KEEPS_ITS_WORDS"]:
    if need not in s: raise SystemExit('REFUSE: r.217 is not in the base: ' + need[:50])

rep("<span>r0.217</span>", "<span>r0.218</span>")
rep("revision:'0.217'", "revision:'0.218'")

LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)  # the house regex, identical to tests/deck-rcore.test.mjs
THROUGH = 97
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if LEDGER['entries'][94]['commit'] != 'cbf852f': raise SystemExit('REFUSE: rev 95 still cites ' + LEDGER['entries'][94]['commit'])
if LEDGER['entries'][96]['kind'] != 'correction': raise SystemExit('REFUSE: rev 97 is not the correction row')
_e = []
for e in LEDGER['entries'][:THROUGH]:
    o = {'rev': e['rev'], 'date': e['date'], 'kind': e['kind'], 'text': MODEL.sub('an external model', e.get('text', '')), 'commit': e.get('commit', '')}
    if 'shipped' in e: o['shipped'] = e['shipped']
    _e.append(o)
BLOCK = json.dumps({'section': LEDGER['section'], 'route': LEDGER['route'], 'through': THROUGH, 'entries': _e}, ensure_ascii=False, separators=(',', ':'))
for bad in ['</script', '<!--', '-->', ' ', ' ']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r' % bad)
_old = re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s)
if not _old: raise SystemExit('REFUSE: the embedded ledger block was not found')
if json.loads(_old.group(1)).get('through') != 95: raise SystemExit('REFUSE: expected the r.217 base to embed through 95')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]
_new = json.loads(re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s).group(1))
if _new['through'] != THROUGH or len(_new['entries']) != THROUGH: raise SystemExit('REFUSE: the embedded block is not through %d' % THROUGH)
if _new['entries'][94]['commit'] != 'cbf852f': raise SystemExit('REFUSE: the embed still carries the dead reference')

if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit(f'REFUSE: script #{i} does not parse: {r.stderr[:300]}')

out = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(out, 'w', encoding='utf-8').write(s)
print('r.' + NEW_REV, len(s.encode('utf-8')), 'B', hashlib.sha256(s.encode('utf-8')).hexdigest())
