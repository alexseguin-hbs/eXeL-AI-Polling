#!/usr/bin/env python3
# exec-summary-sum-signmap.py — generate docs/i18n/sum/signmap.json.
#
# Every transliteration reading used by the SUM draft maps to a Unicode cuneiform
# sign RESOLVED BY ITS UNICODE NAME (unicodedata.lookup), so a wrong codepoint is
# structurally impossible: either the name exists and is the sign, or generation
# fails loudly. Multi-sign values (e.g. the copula am3 written A+AN) are lists of
# names. The builder consumes this map and FAILS CLOSED on any reading not here —
# which is also the lexical discipline: the draft may only use vocabulary that
# reached this table deliberately.
import unicodedata, json, sys, os

NAMES = {
 # syllabograms / logograms — reading -> Unicode sign name(s)
 'a':'A','a2':'A2','ab':'AB','ad':'AD','al':'AL','an':'AN','asz':'ASH',
 'ba':'BA','bad':'BAD','bal':'BAL','bar':'BAR','bi':'BI','bu':'BU',
 'da':'DA','dab5':'DIB','dag':'DAG','di':'DI','dib':'DIB','dim2':'DIM2','dingir':'AN',
 'du':'DU','du3':'RU','du11':'KA','dub':'DUB','dug4':'KA','dumu':'TUR','dur2':'KU',
 'e':'E','e2':'E2','e3':'UD DU',  # e3 "to go out" = UD.DU ligature -> two signs
 'en':'EN','eme':'KA TIMES ME','eger':'EGIR','egir':'EGIR','esh2':'ESH2',
 'ga':'GA','ga2':'GA2','gal':'GAL','gal2':'IG','gar':'GAR','ge26':'GA2',
 'gen':'DU','gesztu2':'PI','gi':'GI','gi4':'GI4','gid2':'BU','gin7':'DIM2','gim':'DIM2',
 'gish':'GISH','gesz':'GISH','gu2':'GU2','gu3':'KA','gub':'DU','gud':'GUD',
 'ha':'HA','he2':'GAN','hi':'HI','hul2':'HUL2','husz':'HUSH',
 'i':'I','i3':'NI','ib2':'IB','igi':'IGI','il2':'IL2','im':'IM','in':'IN','inim':'KA','ir':'IR',
 'ka':'KA','kalam':'UN','kam':'HI TIMES BAD','ke4':'KID','ki':'KI','kin':'KIN',
 'ku':'KU','ku3':'KU3','kur':'KUR',
 'la':'LA','la2':'LAL','li':'LI','lu':'LU','lu2':'LU2','lugal':'LUGAL','lul':'LUL',
 'ma':'MA','mah':'MAH','me':'ME','mu':'MU','munus':'SAL',
 'na':'NA','nam':'NAM','ne':'NE','ni':'NI','nig2':'GAR','nu':'NU','nun':'NUN',
 'pa':'PA','pa3':'IGI RU',  # pad3 "to find/name" = IGI.RU
 'pad3':'IGI RU','pi':'PI',
 'ra':'RA','ri':'RI','ru':'RU',
 'sa':'SA','sa2':'DI','sag':'SAG','sar':'SAR','si':'SI','sig':'SIG','sig5':'IGI ERIN2',
 'sila':'SILA3','su':'SU','sum':'SUM',
 'sza':'SHA','sza3':'SHA3','sze':'SHE','sze3':'ESH2','szid':'SHID','szu':'SHU','szesz':'SHESH',
 'ta':'TA','tar':'TAR','te':'TE','ti':'TI','til3':'TI','tu':'TU','tuku':'TUK','tum2':'TUM','tur':'TUR',
 'u':'U','u3':'IGI DIB','u4':'UD','ud':'UD','um':'UM','un':'UN','ur':'UR','ur5':'HI TIMES ASH2','har':'HI TIMES ASH2',
 'uru':'URU','us2':'USH','usz':'USH',
 'za':'ZA','zi':'ZI','zu':'ZU','zal':'NI',
 # composed values written with more than one sign
 'am3':'A AN',          # enclitic copula, written A.AN in literary orthography
 'danna':'KASKAL BU',   # danna "double-hour / league", written KASKAL.BU
 'ulu3':'EZEN TIMES AN', # nam-lu2-ulu3 "humankind" — ulu3, flagged in METHOD for review
 'hur':'HI TIMES ASH2',  # gesz-hur "design/plan" — HAR/HUR one sign
 'sipa':'PA LU',         # sipa "shepherd" (nam-sipa = stewardship), written PA.LU
 'disz':'DISH','kaskal':'KASKAL','mi2':'SAL','kiszib':'SHID','muszen':'HU'
}

def resolve(name):
    out = []
    for part in name.split(' TIMES '):
        pass
    # names with spaces that are NOT 'TIMES/PLUS' compounds are multi-sign sequences
    toks = name.split(' ')
    if 'TIMES' in toks or 'PLUS' in toks or 'GUNU' in toks or 'TENU' in toks or 'DIB' in toks and name=='IGI DIB':
        pass
    return None

sm, missing = {}, []
for reading, name in NAMES.items():
    # single-name compounds keep their full Unicode name; space-separated SEQUENCES
    # are multiple signs, except names that are themselves one sign ('KA TIMES ME',
    # 'HI TIMES BAD', 'IGI DIB', 'IGI RU'?, ...). Try whole-name lookup FIRST.
    try:
        sm[reading] = unicodedata.lookup('CUNEIFORM SIGN ' + name)
        continue
    except KeyError:
        pass
    try:
        sm[reading] = ''.join(unicodedata.lookup('CUNEIFORM SIGN ' + p) for p in name.split(' '))
    except KeyError:
        missing.append((reading, name))

if missing:
    for r, n in missing: print('UNRESOLVED', r, '->', n, file=sys.stderr)
    sys.exit(1)

os.makedirs('docs/i18n/sum', exist_ok=True)
with open('docs/i18n/sum/signmap.json', 'w', encoding='utf-8') as f:
    json.dump(dict(sorted(sm.items())), f, ensure_ascii=False, indent=0)
print(f'signmap.json — {len(sm)} readings, every codepoint resolved by Unicode sign name')
