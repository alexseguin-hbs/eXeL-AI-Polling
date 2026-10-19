# r.215 -> r.216 — A FULL MAGAZINE READS FULL (operator 2026-10-19, with his r0.178 screenshot: "heres one
#  revision where 30 filled up to the top ofnthe magazine"; D-25: "A2 — thirty bars, one per round"; his approval of
#  the render: "option 2 is correct").
#  MEASURED, both profiled the same way (ink extent of the drawing, then every raster row where lit pixels cross
#  >= 30 % of the body width): his r0.178 picture at 30 RDS fills 6.7 % -> 87.2 %; the served r.215 at 30 RDS fills
#  39.2 % -> 100 %. A full magazine used to read full and today is blank for its top 39 %.
#  CAUSE, and it was NOT a careless restore: r.203 (4adfe705) moved MAG_FILL_TOP 11.3 -> 32.0 deliberately, to put
#  the bars "below the window", built from shot40 — a render of this session's that he sent back as his reference.
#  The defect is that NO GATE ANYWHERE asked whether a full magazine reads full, so a deliberate local improvement
#  cost a behaviour right since r0.178 and stayed wrong for thirteen revisions with every gate green. The same
#  constants hid a second defect: the clamp r>=MAG_BARS made rounds 19..30 draw the IDENTICAL picture — eleven
#  rounds invisible.
#  INVARIANT (r.216): a full magazine reads full — at the maximum round count the fill reaches the top of the body —
#  and every round from one to the maximum draws a different picture. HIS OWN BAR is re-laid at a closer pitch
#  (6.50 px -> 5.76 px in the 192-px canvas) by docs/drone-2525/magazine/lay-rounds.py so exactly thirty fit between
#  the body's top and the floor: nothing is stretched, nothing is invented, only the pitch changes. The frame and the
#  RELOAD ink are byte-identical to r.203's cut and are not touched. The witness window is COVERED at a full
#  magazine and uncovers as he fires — which is what his own r0.178 picture shows (its row profile runs unbroken
#  through the window's position), so r.203's "below the window" rule is retired on his own evidence, not on a guess.
import hashlib, os, re, base64, json, sys
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
MAG = os.path.join(DECK, '..', 'magazine')
BASE_REV = '215'; NEW_REV = '216'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    n = s.count(old)
    if n != count: raise SystemExit(f'REFUSE: expected {count} of {old[:70]!r}, found {n}')
    return s.replace(old, new, count)

def durl(p):
    b = open(p, 'rb').read()
    return 'data:image/png;base64,' + base64.b64encode(b).decode('ascii'), hashlib.sha256(b).hexdigest()

# The six carried rasters, pinned as literals: a replay that finds other bytes in ../magazine refuses.
PINS = {
    'reload-ink.png':      '32f9dfac91d47cefde285768194b5f716608d03cf8c4c0aa56cbcc725af1b720',
    'count-frame.png':     'b476d95135760e2ff9368ae429b854166c42d90f6c278082d4f2fa7d857c4c9d',
    'count-fill-green.png':'c1cea1c5d2ab0bdcffe712175f72d1bb3f830c3fffae814c73ea26e89f6d1670',
    'count-fill-amber.png':'a2e2e93f9287ede858cf2e83a0f6bf09f49f4690b2ba0945790a0db58e7aaaae',
    'count-fill-red.png':  '3612b7711f06657ba97e32a76b2803b7d5434f457ea499602fe336aa93c3d2c2',
}
new = {}
for f, want in PINS.items():
    d, got = durl(os.path.join(MAG, f))
    if got != want: raise SystemExit(f'REFUSE: {f} is {got}, pinned {want}')
    new[f] = d

m = re.search(r"const MAG_PNG=\{ink:'(data:image/png;base64,[A-Za-z0-9+/=]+)',frame:'(data:image/png;base64,[A-Za-z0-9+/=]+)',green:'(data:image/png;base64,[A-Za-z0-9+/=]+)',amber:'(data:image/png;base64,[A-Za-z0-9+/=]+)',red:'(data:image/png;base64,[A-Za-z0-9+/=]+)'\};", s)
if not m: raise SystemExit('REFUSE: MAG_PNG of r.' + BASE_REV + ' not found')
old = {'ink': m.group(1), 'frame': m.group(2), 'green': m.group(3), 'amber': m.group(4), 'red': m.group(5)}
# ink and frame do not change; green appears twice (MAG_PNG + the at-rest <img>), amber and red once each.
for k, f, c in (('green', 'count-fill-green.png', 2), ('amber', 'count-fill-amber.png', 1), ('red', 'count-fill-red.png', 1)):
    if old[k] == new[f]: raise SystemExit(f'REFUSE: {f} is already embedded — nothing to restore')
    s = rep(old[k], new[f], c)

bars = json.load(open(os.path.join(MAG, 'BARS.json'), encoding='utf-8'))
if bars['bars'] != 30: raise SystemExit('REFUSE: BARS.json is not thirty bars')
if bars['tops_pct'][0] > 10: raise SystemExit('REFUSE: the first bar does not reach the top')
tops = '[' + ', '.join(f'{v}' for v in bars['tops_pct']) + ']'

s = rep("const MAG_FILL_TOP=32.0, MAG_FILL_BOTTOM=96.4, MAG_BARS=19, MAG_BAR_TOPS=["
        "32.0, 35.7, 38.8, 42.4, 46.1, 49.2, 52.9, 56.0, 59.6, 62.8, 66.4, 69.5, 73.2, 76.3, 79.9, 83.1, 86.7, 89.8, 93.5];",
        f"const MAG_FILL_TOP={bars['tops_pct'][0]}, MAG_FILL_BOTTOM={bars['bottom_pct']}, MAG_BARS={bars['bars']}, MAG_BAR_TOPS={tops};")

# The first paint, before hudMag() runs, must not show the old sunken fill.
s = rep("#magWell #magFill{clip-path:inset(var(--cut,32.0%) 0 0 0)}",
        "#magWell #magFill{clip-path:inset(var(--cut,6.5%) 0 0 0)}")

# THE BEHAVIOUR ASSERTION, in the deck's own boot QA. r.203 wrote its "below the window" rule here as `top>25`,
# which actively forbids the fix; it inverts to the invariant his picture shows.
s = rep("const placed=Math.abs(top-MAG_FILL_TOP)<=1.5&&Math.abs(bot-MAG_FILL_BOTTOM)<=1.5&&top>25;",
        "const placed=Math.abs(top-MAG_FILL_TOP)<=1.5&&Math.abs(bot-MAG_FILL_BOTTOM)<=1.5&&top<=10;  /* r.216: a FULL magazine READS FULL — his r0.178 picture fills from 6.7 % */")
s = rep("of the body, below the window '", "of the body, full to the top '")
# The row's OTHER note string, which drone-deck-qa.mjs pins by regex (scripts/drone-deck-qa.mjs:66).
s = rep("(his 30 look, nineteen bars)", "(full to the top, thirty bars)")

# The row's own comment states r.203's rule too. The three OTHER occurrences of "below the window" in the deck are
# the EMBEDDED APPEND-ONLY LEDGER (r.200/r.203 record text) and are data, not code — they are left exactly as they are.
s = rep("the bars begin below the window (MAG_FILL_TOP) and end at the foot",
        "the bars begin at the top of the body (MAG_FILL_TOP) and end at the foot")

s = rep("revision:'0.215'", "revision:'0.216'")
s = rep("<span>r0.215</span>", "<span>r0.216</span>")

for dead in ["revision:'0.215'", 'r0.215', 'MAG_FILL_TOP=32.0', 'MAG_BARS=19', 'var(--cut,32.0%)', 'top>25',
             'of the body, below the window', 'begin below the window', 'his 30 look, nineteen bars'] + [old['green'], old['amber'], old['red']]:
    if dead in s: raise SystemExit(f'REFUSE: stale {dead[:60]}')
for need in ["MAG_FILL_TOP=6.5", "MAG_BARS=30", "var(--cut,6.5%)", "top<=10", "full to the top", "full to the top, thirty bars", "ROUNDS_ARE_INSIDE_THE_MAGAZINE", "BARS_OVER_THE_GRID"]:
    if need not in s: raise SystemExit('REFUSE: missing ' + need)
# The embedded record is append-only and is NOT rewritten by a code change: its three historical mentions stay.
if s.count('below the window') != 3: raise SystemExit('REFUSE: the embedded ledger\'s history was altered (%d mentions)' % s.count('below the window'))
if s.count('<span>r0.' + NEW_REV + '</span>') != 1: raise SystemExit('REFUSE: the revision span is not once')

# ── the embedded record, regenerated through rev 94 ──────────────────────────────────────────────────
# r.211 shipped WITHOUT this step and deck-rcore went red (lag 2) AFTER the bookkeeping appended the new row,
# which is how a correct share-sheet fix never reached the site. The deck carries the record through the
# revision BEFORE itself; its own release row is the one it cannot contain.
LEDGER = json.load(open(os.path.join(ROOT, 'docs', 'traceability', 'drone-2525.ledger.json'), encoding='utf-8'))
THROUGH = len(LEDGER['entries'])
if THROUGH != 94: raise SystemExit('REFUSE: expected the ledger to end at rev 94 (r.215 released); found %d' % THROUGH)
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
_e = []
for e in LEDGER['entries'][:THROUGH]:
    o = {'rev': e['rev'], 'date': e['date'], 'kind': e['kind'], 'text': MODEL.sub('an external model', e.get('text', '')), 'commit': e.get('commit', '')}
    if 'shipped' in e: o['shipped'] = e['shipped']
    _e.append(o)
BLOCK = json.dumps({'section': LEDGER['section'], 'route': LEDGER['route'], 'through': THROUGH, 'entries': _e}, ensure_ascii=False, separators=(',', ':'))
for bad in ['</script', '<!--', '-->', '\u2028', '\u2029']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r' % bad)
_old = re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s)
if not _old: raise SystemExit('REFUSE: the embedded ledger block was not found')
if json.loads(_old.group(1)).get('through') != 93: raise SystemExit('REFUSE: expected the r.215 base to embed through 93')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]
_new = json.loads(re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s).group(1))
if _new['through'] != 94 or len(_new['entries']) != 94: raise SystemExit('REFUSE: the embedded block is not through 94')

# node --check the extracted scripts before anything is written
import subprocess, tempfile
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit(f'REFUSE: script #{i} does not parse: {r.stderr[:300]}')

out = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(out, 'w', encoding='utf-8').write(s)
print('r.' + NEW_REV, len(s.encode('utf-8')), 'B', hashlib.sha256(s.encode('utf-8')).hexdigest())
