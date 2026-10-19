# RED FIRST: the two new rows, inserted into the r.216 bytes with NOTHING else changed.
import re, hashlib, os, sys
W = '/tmp/claude-0/wtm'
DECK = os.path.join(W, 'docs/drone-2525/operator-deck')
src = open(os.path.join(DECK, 'patches/r216_to_r217.py'), encoding='utf-8').read()
m = re.search(r'ANCHOR = (".*?")\nROWS = ANCHOR \+ """(.*?)"""\n', src, re.S)
if not m: raise SystemExit('could not lift ANCHOR/ROWS out of the patcher')
ANCHOR = eval(m.group(1)); ROWS = ANCHOR + eval(chr(34)*3 + m.group(2) + chr(34)*3)
s = open(os.path.join(DECK, 'drone-2525_r.216.html'), encoding='utf-8').read()
if s.count(ANCHOR) != 1: raise SystemExit('anchor not unique in r.216')
s = s.replace(ANCHOR, ROWS, 1)
out = sys.argv[1]
open(out, 'w', encoding='utf-8').write(s)
print('redfirst', len(s.encode('utf-8')), 'B', hashlib.sha256(s.encode('utf-8')).hexdigest())
