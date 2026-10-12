#!/usr/bin/env python3
"""Cut the magazine rasters out of the operator's own pictures (2026-10-12: "These are exact image ton-use; create final raster and use exact
proportions"). usage: cut-magazine.py <his count picture (shot30)> <his RELOAD picture (shot31)> <out dir>
Each pixel's alpha is how much of the ink colour it carries (black ground → 0); the card's frame and other colours are refused by hue; the
RELOAD ink (cyan), the count's frame (gold) and the count's fill (green) are cut on their own canvases — the frame and the fill on ONE canvas
(the frame's box) so they overlay 1:1 — then fitted to 72×192 (the ink is 18×48 CSS px in the 75-px row, at 4×). The fill is recoloured to his
amber and red for 6–19 and ≤ 5 rounds. Needs python3 + ImageMagick (convert, identify). The boxes below are the ink's pixel extents in his
pictures (1284×2778), measured by colour; MAGAZINE.sha256 is the record of the cut."""
import os, subprocess, sys
COUNT, RELOAD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; os.makedirs(OUT, exist_ok=True)
W, H = 1284, 2778; PAD = 2
BOX = {'count': (594, 863, 1164, 1892), 'reload': (295, 471, 961, 1440)}   # x0, x1, y0, y1 of the ink
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
    subprocess.run(['convert', '-size', f'{w}x{h}', '-depth', '8', 'rgba:' + raw, '-filter', 'Lanczos', '-resize', '72x192!', '-strip', '-define', 'png:compression-level=9', os.path.join(OUT, name + '.png')], check=True)
    os.remove(raw); print(name, 'from', box)
    return out, w, h
c = rgb(COUNT); r = rgb(RELOAD)
cut(r, BOX['reload'], 'cyan', lambda R, G, B: G > 60 and B > 70 and B - R > 20, 'reload-ink')
cut(c, BOX['count'], 'gold', lambda R, G, B: R > 70 and R - B > 40 and G > 40, 'count-frame')
fill, w, h = cut(c, BOX['count'], 'green', lambda R, G, B: G > 70 and G - R > 35 and G - B > 10, 'count-fill-green')
for name in ('amber', 'red'):
    o = bytearray(fill); cr, cg, cb = COL[name]
    for j in range(0, len(o), 4): o[j], o[j + 1], o[j + 2] = cr, cg, cb
    raw = os.path.join(OUT, f'count-fill-{name}.rgba'); open(raw, 'wb').write(o)
    subprocess.run(['convert', '-size', f'{w}x{h}', '-depth', '8', 'rgba:' + raw, '-filter', 'Lanczos', '-resize', '72x192!', '-strip', '-define', 'png:compression-level=9', os.path.join(OUT, f'count-fill-{name}.png')], check=True); os.remove(raw); print(f'count-fill-{name} recoloured')
