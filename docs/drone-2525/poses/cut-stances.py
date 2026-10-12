#!/usr/bin/env python3
"""Cut the five firing positions out of the operator's own picture (eXeL AI, 2026-10-12: "use my images exactly for 5 shooting positions").
usage: cut-stances.py <his image: the five figures on black> <out dir>
Each figure is found as its own connected shape (pixels above the black, 8-connected; a shape under 5,000 px joins the figure within 30 px — the
wall top of the fifth), so a neighbour's rifle tip or boots never enter the next card. The cut keeps every pixel of the figure, the dark lines
inside it included (the mask is closed by 3 px so an inner line is not a hole), takes nothing of a neighbour, and fits the longest side to 256 px.
Needs python3 + ImageMagick (`convert`). Writes stance-0..4.png (left to right, his order) and POSES.sha256 — the carried record."""
import os, subprocess, sys, hashlib
from collections import deque
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
T, SEED, NEAR, MARGIN, SIDE = 40, 5000, 30, 6, 256
def im(*a): subprocess.run(['convert', *a], check=True)
W, H = map(int, subprocess.run(['identify', '-format', '%w %h', SRC], capture_output=True, text=True, check=True).stdout.split())
gray = os.path.join(OUT, '_src.gray'); im(SRC, '-colorspace', 'gray', '-depth', '8', 'gray:' + gray)
b = open(gray, 'rb').read(); os.remove(gray)
mask = bytearray(1 if v > T else 0 for v in b); lab = [0] * (W * H); n = 0; comps = []
for i in range(W * H):
    if mask[i] and not lab[i]:
        n += 1; q = deque([i]); lab[i] = n; cnt = 0; x0 = W; x1 = 0; y0 = H; y1 = 0
        while q:
            p = q.popleft(); cnt += 1; y, x = divmod(p, W); x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if (dy or dx) and 0 <= yy < H and 0 <= xx < W:
                        j = yy * W + xx
                        if mask[j] and not lab[j]: lab[j] = n; q.append(j)
        comps.append(dict(n=n, cnt=cnt, x0=x0, x1=x1, y0=y0, y1=y1))
comps.sort(key=lambda c: -c['cnt'])
near = lambda a, g: not (a['x0'] > g['x1'] + NEAR or g['x0'] > a['x1'] + NEAR or a['y0'] > g['y1'] + NEAR or g['y0'] > a['y1'] + NEAR)
groups = [dict(c, members=[c['n']]) for c in comps if c['cnt'] >= SEED]
for c in comps:
    if c['cnt'] >= SEED: continue
    for g in groups:
        if near(c, g):
            g['x0'] = min(g['x0'], c['x0']); g['x1'] = max(g['x1'], c['x1']); g['y0'] = min(g['y0'], c['y0']); g['y1'] = max(g['y1'], c['y1']); g['members'].append(c['n']); break
groups.sort(key=lambda g: g['x0'])
if len(groups) != 5: raise SystemExit(f'REFUSE: expected five figures, found {len(groups)}')
sha = ''
for i, g in enumerate(groups):
    own = set(g['members']); x0 = max(0, g['x0'] - MARGIN); y0 = max(0, g['y0'] - MARGIN); x1 = min(W - 1, g['x1'] + MARGIN); y1 = min(H - 1, g['y1'] + MARGIN); w = x1 - x0 + 1; h = y1 - y0 + 1
    o = bytearray(w * h); r = bytearray(w * h)
    for yy in range(y0, y1 + 1):
        row = yy * W
        for xx in range(x0, x1 + 1):
            l = lab[row + xx]
            if l: (o if l in own else r)[(yy - y0) * w + (xx - x0)] = 255
    po, pr = os.path.join(OUT, f'_own{i}.pgm'), os.path.join(OUT, f'_oth{i}.pgm')
    open(po, 'wb').write(b'P5\n%d %d\n255\n' % (w, h) + o); open(pr, 'wb').write(b'P5\n%d %d\n255\n' % (w, h) + r)
    geo = f'{w}x{h}+{x0}+{y0}'; dst = os.path.join(OUT, f'stance-{i}.png'); pm = os.path.join(OUT, f'_mask{i}.png')
    im(po, '-morphology', 'Close', 'Disk:3', '(', pr, '-negate', ')', '-compose', 'Multiply', '-composite', pm)
    im(SRC, '-crop', geo, '+repage', pm, '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', '-resize', f'{SIDE}x{SIDE}>', '-strip', '-define', 'png:color-type=6', '-define', 'png:compression-level=9', dst)
    for f in (po, pr, pm): os.remove(f)
    d = open(dst, 'rb').read(); sha += f'{hashlib.sha256(d).hexdigest()}  stance-{i}.png\n'
    print(f'stance-{i}.png  from {geo}  {len(d)} B')
open(os.path.join(OUT, 'POSES.sha256'), 'w').write(sha)
