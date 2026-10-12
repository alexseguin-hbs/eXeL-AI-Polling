#!/usr/bin/env python3
"""Cut the magazine rasters out of the operator's own picture (2026-10-12: "These are exact image ton-use; create final raster and use exact
proportions" · "rounds mist be in magazine" → his reference shot40, sent after those words: the two magazines at 10×, the counter at 30 with
nineteen distinct bars INSIDE the walls, OVER the grid, below the window — the gold shows in the gaps; shot40 is the r.200 preview he sent
back as his reference). usage: cut-magazine.py <his picture (shot40)> <out dir>
Each pixel's alpha is how much of the ink colour it carries (black ground → 0); other colours are refused by hue; the RELOAD ink (cyan) is cut
on its own canvas and, recoloured to his gold, IS the counter's frame (the uncovered magazine: walls, window, the full grid — the counter's own
grid is covered by its bars in his drawing); the fill (green) is cut from the counter's box, the same outline at the same scale, so they overlay 1:1; each fitted to 72×192 (the
ink is 18×48 CSS px in the 75-px row, at 4×). The fill is recoloured to his amber and red for 6–19 and ≤ 5 rounds. Needs python3 + ImageMagick.
The boxes are the ink's pixel extents in his picture (2000×1818), measured by colour; MAGAZINE.sha256 is the record of the cut; BARS.json the bars as measured in it."""
import os, subprocess, sys
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
W, H = 2000, 1818; PAD = 2
BOX = {'count': (506, 785, 93, 818), 'reload': (81, 359, 93, 818)}   # x0, x1, y0, y1 of the ink in shot40 (both magazines 280×726 at 10×)
COL = {'cyan': (122, 184, 196), 'gold': (201, 162, 39), 'green': (61, 204, 138), 'amber': (240, 160, 32), 'red': (226, 75, 59)}
def rgb(path):
    raw = os.path.join(OUT, '_src.rgb'); subprocess.run(['convert', path, '-depth', '8', 'rgb:' + raw], check=True); b = open(raw, 'rb').read(); os.remove(raw); return b
def cut(b, box, ink, keep, name):
    cr, cg, cb = COL[ink]; x0, x1, y0, y1 = box[0] - PAD, box[1] + PAD, box[2] - PAD, box[3] + PAD; w, h = x1 - x0 + 1, y1 - y0 + 1
    out = bytearray(w * h * 4)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            i = (y * W + x) * 3; r, g, bb = b[i], b[i + 1], b[i + 2]
            a = max(0, min(255, int(255 * max(r / cr if cr > 60 else 0, g / cg if cg > 60 else 0, bb / cb if cb > 60 else 0))))
            if not keep(r, g, bb): a = 0
            j = ((y - y0) * w + (x - x0)) * 4; out[j], out[j + 1], out[j + 2], out[j + 3] = cr, cg, cb, a
    raw = os.path.join(OUT, name + '.rgba'); open(raw, 'wb').write(out)
    subprocess.run(['convert', '-size', f'{w}x{h}', '-depth', '8', 'rgba:' + raw, '-filter', 'Lanczos', '-resize', '72x192!', '-strip', '-define', 'png:color-type=6', '-define', 'png:bit-depth=8', '-define', 'png:compression-level=9', os.path.join(OUT, name + '.png')], check=True)
    os.remove(raw); print(name, 'from', box)
    return out, w, h
src = rgb(SRC)
ink, w, h = cut(src, BOX['reload'], 'cyan', lambda R, G, B: G > 60 and B > 70 and B - R > 20, 'reload-ink')
def recolour(buf, w, h, name, out_name):
    o = bytearray(buf); cr, cg, cb = COL[name]
    for j in range(0, len(o), 4): o[j], o[j + 1], o[j + 2] = cr, cg, cb
    raw = os.path.join(OUT, out_name + '.rgba'); open(raw, 'wb').write(o)
    subprocess.run(['convert', '-size', f'{w}x{h}', '-depth', '8', 'rgba:' + raw, '-filter', 'Lanczos', '-resize', '72x192!', '-strip', '-define', 'png:color-type=6', '-define', 'png:bit-depth=8', '-define', 'png:compression-level=9', os.path.join(OUT, out_name + '.png')], check=True); os.remove(raw); print(out_name, 'recoloured', name)
# The counter's FRAME (walls, window, the 3×4 grid) is the UNCOVERED magazine — the RELOAD drawing, the same outline at the same 10× scale —
# recoloured to his gold: in shot40 the counter's bars sit over its grid, so a frame cut from the counter would carry holes where the bars were.
recolour(ink, w, h, 'gold', 'count-frame')
fill, w, h = cut(src, BOX['count'], 'green', lambda R, G, B: G > 70 and G - R > 35 and G - B > 10, 'count-fill-green')
recolour(fill, w, h, 'amber', 'count-fill-amber'); recolour(fill, w, h, 'red', 'count-fill-red')
# BARS.json — the bars as they are in the cut fill (72×192): the top of each bar (the cut lands just above it) and the foot, % of the canvas
raw = subprocess.run(['convert', os.path.join(OUT, 'count-fill-green.png'), '-depth', '8', 'rgba:-'], capture_output=True, check=True).stdout
rows = [sum(1 for x in range(72) if raw[(y * 72 + x) * 4 + 3] > 96) for y in range(192)]
bars = []; on = False
for y, n in enumerate(rows):
    if n >= 6 and not on: on = True; s0 = y
    elif n < 6 and on: on = False; bars.append((s0, y - 1))
if on: bars.append((s0, 191))
tops = [round(100 * (b[0] - 0.5) / 192, 1) for b in bars]; bottom = round(100 * (bars[-1][1] + 1) / 192, 1)
import json; json.dump({'bars': len(bars), 'tops_pct': tops, 'bottom_pct': bottom, 'rows': bars}, open(os.path.join(OUT, 'BARS.json'), 'w'), separators=(',', ':')); print('BARS.json', len(bars), 'bars, top', tops[0], 'foot', bottom)
