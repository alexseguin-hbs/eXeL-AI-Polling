#!/usr/bin/env python3
# exec-summary-sum-font.py — regenerate the embedded cuneiform subset.
#
# The SUM page inlines a subset of Noto Sans Cuneiform (only the signs the
# edition uses) so the cuneiform renders offline and on devices with no system
# cuneiform font. This re-subsets from the Google-served woff2 to the CURRENT
# signmap.json codepoints. Run whenever signmap.json gains a codepoint.
# Requires: fonttools, brotli  (pip install fonttools brotli)
import json, subprocess, sys, os, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SIGN = json.load(open('docs/i18n/sum/signmap.json', encoding='utf-8'))
cps = sorted({ord(ch) for v in SIGN.values() for ch in v})
print(f'{len(cps)} codepoints U+{cps[0]:04X}..U+{cps[-1]:04X}')

css = urllib.request.urlopen(urllib.request.Request(
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Cuneiform',
    headers={'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'})).read().decode()
import re
url = re.search(r'https://fonts\.gstatic\.com[^)]*\.woff2', css).group(0)
full = '/tmp/noto-full.woff2'
urllib.request.urlretrieve(url, full)

out = 'docs/i18n/sum/font/noto-sans-cuneiform.subset.woff2'
os.makedirs(os.path.dirname(out), exist_ok=True)
subprocess.run(['pyftsubset', full, '--unicodes=' + ','.join(f'U+{c:04X}' for c in cps),
                '--flavor=woff2', '--output-file=' + out, '--no-hinting', '--desubroutinize'], check=True)

from fontTools.ttLib import TTFont
cmap = set(TTFont(out).getBestCmap().keys())
missing = set(cps) - cmap
if missing:
    print('COVERAGE FAIL — subset missing:', [f'U+{c:04X}' for c in sorted(missing)], file=sys.stderr)
    sys.exit(1)
print(f'subset {os.path.getsize(out)} bytes, {len(cps)}/{len(cps)} covered')
