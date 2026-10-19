#!/usr/bin/env python3
"""DD-87 — a FULL magazine is full (operator 2026-10-17: "this is not a full visual of 30 round magazine" · 2026-10-16: "top middle is
acceptable for full 30 rounds; from there everything is proportional down to one at the bottom" · D-25: "A2 — thirty bars, one per round").
His reference shot40 draws NINETEEN bars at 30 rounds, so a full magazine left the top third of the body bare and the surviving band SANK as
he fired. This re-lays HIS OWN BAR — the one cut out of his picture by cut-magazine.py — at a closer pitch, so exactly thirty of them fill the
body from its top to the floor: one bar per round. Nothing is stretched and nothing is invented: the bar's height, the ink colour, the walls it
sits between and the holes it leaves where the frame has ink (the grid and the witness window show through — his r.203 rule) all come from the
cut. Only the PITCH changes, from his 6.50 px to 5.76 px in the 192-px canvas.
usage: lay-rounds.py <dir holding count-fill-green.png + count-frame.png>   (rewrites the three fills and BARS.json in place)
Needs python3 + ImageMagick."""
import json, os, subprocess, sys
DIR = sys.argv[1]; ROUNDS = 30
COL = {'green': (61, 204, 138), 'amber': (240, 160, 32), 'red': (226, 75, 59)}
def rgba(p):
    w, h = [int(v) for v in subprocess.run(['identify', '-format', '%w %h', p], capture_output=True, text=True, check=True).stdout.split()]
    return w, h, subprocess.run(['convert', p, '-depth', '8', 'rgba:-'], capture_output=True, check=True).stdout
def save(buf, w, h, p):
    raw = p + '.rgba'; open(raw, 'wb').write(bytes(buf))
    subprocess.run(['convert', '-size', f'{w}x{h}', '-depth', '8', 'rgba:' + raw, '-strip', '-define', 'png:color-type=6',
                    '-define', 'png:bit-depth=8', '-define', 'png:compression-level=9', p], check=True); os.remove(raw)
W, H, FILL = rgba(os.path.join(DIR, 'count-fill-green.png'))
_, _, FRAME = rgba(os.path.join(DIR, 'count-frame.png'))
# his bars, as cut
his = []; cur = None
for y in range(H):
    n = sum(1 for x in range(W) if FILL[(y * W + x) * 4 + 3] > 40)
    if n > 1 and cur is None: cur = y
    elif n <= 1 and cur is not None: his.append((cur, y - 1)); cur = None
if cur is not None: his.append((cur, H - 1))
if len(his) < 2: sys.exit('refused: the cut fill carries no bars')
HIS_PITCH = (his[-1][0] - his[0][0]) / (len(his) - 1); FLOOR = his[-1][1]
def runs(y):
    r = []; c = None
    for x in range(W):
        on = FRAME[(y * W + x) * 4 + 3] > 40
        if on and c is None: c = x
        elif not on and c is not None: r.append((c, x - 1)); c = None
    if c is not None: r.append((c, W - 1))
    return r
# The interior (wall to wall) at every row. Where one of his horizontal grid lines crosses the body it fills the whole
# interior, so that row shows one run and names no walls: those rows take the interpolation of their neighbours.
RAW = {}
for y in range(H):
    r = runs(y)
    if len(r) >= 2 and r[-1][0] - r[0][1] > 20: RAW[y] = (r[0][1] + 1, r[-1][0] - 1)
KNOWN = sorted(RAW)
def interior(y):
    if y in RAW: return RAW[y]
    lo = [k for k in KNOWN if k < y]; hi = [k for k in KNOWN if k > y]
    if not lo and not hi: return None
    if not lo: return RAW[hi[0]]                                  # above the first named row: hold it
    if not hi: return RAW[lo[-1]]                                 # the floor band: hold the last named row
    a, b = lo[-1], hi[0]; t = (y - a) / (b - a)
    return (round(RAW[a][0] + t * (RAW[b][0] - RAW[a][0])), round(RAW[a][1] + t * (RAW[b][1] - RAW[a][1])))
BODY_TOP = next(y for y in KNOWN if RAW[y][1] - RAW[y][0] > 34)   # below the feed lips, where his two walls first stand more than 34 px apart
PITCH = (FLOOR - BODY_TOP - 4) / (ROUNDS - 1)
TOPS = [round(BODY_TOP + i * PITCH) for i in range(ROUNDS)]
def lay(ink):
    buf = bytearray(W * H * 4); cr, cg, cb = COL[ink]; drawn = 0
    for k, t in enumerate(TOPS):
        nxt = TOPS[k + 1] if k + 1 < len(TOPS) else t + round(PITCH)
        bh = max(3, nxt - t - 1)                                   # always a gap between bars, as in his raster
        if t + bh - 1 > FLOOR: bh = FLOOR - t + 1
        if bh < 3: continue
        drawn += 1
        for dy in range(bh):
            y = t + dy
            if y < 0 or y >= H: continue
            iv = interior(y)
            if not iv: continue
            a, b = iv; ins = 1 if dy == 0 else 0                       # his bar's top row is one pixel narrower
            for x in range(a + ins, b + 1 - ins):                         # solid wall to wall, OVER his grid, exactly as his cut draws it
                j = (y * W + x) * 4; buf[j], buf[j + 1], buf[j + 2], buf[j + 3] = cr, cg, cb, 255
    return buf, drawn
for ink in ('green', 'amber', 'red'):
    buf, drawn = lay(ink)
    if drawn != ROUNDS: sys.exit(f'refused: laid {drawn} bars, not {ROUNDS}')
    save(buf, W, H, os.path.join(DIR, f'count-fill-{ink}.png')); print(f'count-fill-{ink}.png · {drawn} bars')
# BARS.json — measured back out of the laid green, never from the plan above
raw = subprocess.run(['convert', os.path.join(DIR, 'count-fill-green.png'), '-depth', '8', 'rgba:-'], capture_output=True, check=True).stdout
rows = [sum(1 for x in range(W) if raw[(y * W + x) * 4 + 3] > 96) for y in range(H)]
bars = []; on = False
for y, n in enumerate(rows):
    if n >= 6 and not on: on = True; s0 = y
    elif n < 6 and on: on = False; bars.append((s0, y - 1))
if on: bars.append((s0, H - 1))
if len(bars) != ROUNDS: sys.exit(f'refused: BARS.json measured {len(bars)} bars, not {ROUNDS}')
tops = [round(100 * (b[0] - 0.5) / H, 1) for b in bars]; bottom = round(100 * (bars[-1][1] + 1) / H, 1)
json.dump({'bars': len(bars), 'tops_pct': tops, 'bottom_pct': bottom, 'rows': bars}, open(os.path.join(DIR, 'BARS.json'), 'w'), separators=(',', ':'))
print(f"BARS.json · {len(bars)} bars, his pitch {HIS_PITCH:.2f}px → {PITCH:.2f}px, top {tops[0]}%, foot {bottom}%")
