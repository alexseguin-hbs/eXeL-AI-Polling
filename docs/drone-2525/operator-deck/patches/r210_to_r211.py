# r.210 -> r.211 — THE SHARE SHEET IS HIS PICTURE AGAIN (a regression of MINE, reported twice).
#
#  Operator 2026-10-15, with two screenshots side by side: "I still do not see why you regress; use image 2
#  formate for the range".
#
#  WHAT HAPPENED, traced rather than guessed. The polished sheet he is pointing at was added in commit
#  12962de77 ("Restore The Range share sheet and the compact magazines") during the r.183-r.195 wave. It was
#  removed by a18880daf - MY r.196 artefact - because r.196 rebuilt the deck from his own r0.178 base to fix the
#  targets, and r0.178 predates the polished sheet. The loss was collateral and I never flagged it. r.209 then
#  wrote the map name into the plain r.178 sheet, which made it a long ALL-CAPS line that wraps over two rows and
#  prints across the magazine cards - which is image 1, what he is looking at now.
#
#  This revision restores the sheet of 12962de77 EXACTLY - its CSS, its markup and its wording - while keeping
#  the two things that must not regress with it:
#    1. DD-48 (the sheet names the map first). Image 2's format satisfies it BETTER than r.209 did: the TITLE
#       IS THE MAP ("The Range" / "The Capital"), with lane, seat and mode on the subtitle beneath it. The map
#       is not merely first in a string, it is the heading.
#    2. The URL keeps its ".html". Image 2 shows "/drone-2525/play?range=21..." WITHOUT it - that was the r.186
#       form, and r.196 corrected it deliberately. verify-live.yml fetches play.html?range=21&role=turret&
#       mode=train-up on every run, so restoring the old URL would break the live check. Only the LOOK is
#       restored, never that link.
#
#  THE RANGE IS NOT TOUCHED (DD-35): the sheet is markup, CSS above the first top-level declaration, and an
#  IIFE in script #2. No frozen span is edited; tests/range-frozen.test.mjs holds 100 definitions at 0 moved.
import hashlib,os,re,subprocess,tempfile
DECK=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE_REV='210'; BASE_SHA=open(os.path.join(DECK,'HASHES_r'+BASE_REV+'.sha256'),encoding='utf-8').read().split()[0]
SRC=os.path.join(DECK,'drone-2525_r.'+BASE_REV+'.html'); DST=os.path.join(DECK,'drone-2525_r.211.html')
s=open(SRC,encoding='utf-8').read(); n=[0]
if hashlib.sha256(s.encode('utf-8')).hexdigest()!=BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.210')
def rep(old,new,count=1):
    global s
    c=s.count(old)
    if c!=count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {c}')
    n[0]+=1; s=s.replace(old,new)

# 0 · the deck declares itself
rep("revision:'0.210'","revision:'0.211'",1)
rep("r0.210","r0.211",1)

# 1 · the CSS, restored verbatim from 12962de77 (the opaque ground, the big cyan title, the italic subtitle,
#     the hint line, the filled pill) - and #qrClose with it, which the plain sheet had lost.
rep("""#qrSheet{position:fixed;inset:0;z-index:60;display:none;background:rgba(0,0,0,.78);align-items:center;justify-content:center;flex-direction:column;padding:64px 16px 32px}
#qrSheet.on{display:flex}
#qrSheet h2{color:#3DCC8A;letter-spacing:.16em;font-size:15px;font-weight:500;margin:0 0 16px;text-align:center}
#qrSheet .card{background:#fff;border-radius:16px;padding:14px;line-height:0}
#qrSheet .card svg{width:min(72vw,300px);height:auto;display:block}
#qrSheet #qrUrl{color:#7AB8C4;font-size:12px;line-height:1.45;text-align:center;max-width:36em;margin:16px 0 12px;word-break:break-all}
#qrSheet #qrCopy{color:#7AB8C4;border:1px solid #1C2A3A;letter-spacing:.16em;padding:10px 16px;background:#000;min-height:36px}""",
"""/* r.211 (operator 2026-10-15, twice: "I still do not see why you regress; use image 2 formate for the range")
   - the sheet of 12962de77, restored byte for byte. My r.196 restore took it out with the rest of the r.183-195
   wave; what replaced it was r0.178's plain sheet at 78 % opacity, so the deck printed through it and r.209's
   one-line ALL-CAPS heading wrapped across the magazine cards. Opaque ground, the map as a 28 px heading, the
   seat and mode italic beneath it, the hint, and a filled pill. */
#qrSheet{position:fixed;inset:0;z-index:60;display:none;background:#05080c;align-items:center;justify-content:center;flex-direction:column;padding:72px 22px 32px;text-align:center}
#qrSheet.on{display:flex}
#qrSheet h2{color:#2EE0E0;letter-spacing:.01em;font-size:28px;font-weight:650;margin:0 0 8px;text-align:center}
#qrSheet #qrSub{color:#9AA8B0;font-size:15px;font-style:italic;font-weight:400;margin:0 0 22px;letter-spacing:.01em}
#qrSheet .card{background:#fff;border-radius:18px;padding:16px;line-height:0}
#qrSheet .card svg{width:min(78vw,320px);height:auto;display:block}
#qrSheet #qrHint{color:#C5D0D6;font-size:16px;margin:22px 0 8px}
#qrSheet #qrUrl{color:#8E9BA3;font-size:13px;line-height:1.45;text-align:center;max-width:22em;margin:0 0 22px;word-break:break-all}
#qrSheet #qrCopy{color:#E8EEF0;border:0;letter-spacing:.01em;padding:12px 28px;background:#1E4A4E;border-radius:999px;min-height:44px;font-size:16px}""",1)

# 1b · the close button: the plain sheet kept a BOXED teal button (the square at top-right of his image 1);
#      his picture has a plain white x with no border. Replace the rule rather than add a second one.
rep("""#qrClose{position:fixed;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));z-index:61;width:44px;height:44px;min-height:44px;padding:0;color:#7AB8C4;border:1px solid #1C2A3A;background:#000}""",
    """#qrClose{position:fixed;top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));z-index:61;width:44px;height:44px;min-height:44px;padding:0;color:#fff;border:0;background:transparent;font-size:28px}""",1)

# 2 · the markup: the subtitle and the hint come back, the heading becomes the map alone, the button is title case
rep("""  <h2 id="qrTitle">THE RANGE \u00b7 LANE 21 \u00b7 TURRET \u00b7 TRAIN UP</h2>
  <div class="card" id="qrImg"></div>
  <p id="qrUrl"></p>
  <button type="button" id="qrCopy">COPY LINK</button>""",
"""  <h2 id="qrTitle">The Range</h2>
  <p id="qrSub">Lane 21 \u00b7 Turret \u00b7 Mode: Train - Up</p>
  <div class="card" id="qrImg"></div>
  <p id="qrHint">Scan to share The Range</p>
  <p id="qrUrl"></p>
  <button type="button" id="qrCopy">Copy Link</button>""",1)

# 3 · the words. rungWord() stays exactly as r.209 wrote it (the QA row and drone-playable pin it); the sheet
#     gets its own title-case twins beside it, so nothing frozen or pinned moves.
rep("""function rungWord(){ return rungIsRange()?'THE RANGE':'THE CAPITAL'; }""",
"""function rungWord(){ return rungIsRange()?'THE RANGE':'THE CAPITAL'; }
/* r.211: the share sheet is written in his picture's title case, not the HUD's caps. rungWord() is left exactly
   as r.209 wrote it because the boot row and drone-playable both pin it; these are twins beside it. */
function rungTitle(){ return rungIsRange()?'The Range':'The Capital'; }
function modeWords(){ var m=state.rangeMode||'bounce'; return m==='stay'?'Train - Down':(m==='qual40'?'Qual 40':'Train - Up'); }
function rungSeatTitle(){
  if(rungIsRange()) return 'Lane '+(((state.lane|0)+1))+' \u00b7 Turret';
  var id=String(state.unit||'T01'), u=(typeof units!=='undefined')&&units[id], lab=(u&&u.label)||'';
  if(/^TURRET\\s+\\d+\\/\\d+$/.test(lab)) return 'Turret '+lab.replace(/^TURRET\\s+/,'');
  return 'Turret '+((id.replace(/^T/,'')|0)||1)+'/42';
}""",1)

# 4 · paintQr fills the three lines
rep("""    var _w=(typeof rungWord==='function')?rungWord():'THE RANGE', _s=(typeof rungSeat==='function')?rungSeat():('LANE '+(((state.lane|0)+1)));
    /* the seat already names the craft on a station (TURRET 7/42); on a lane it does not, so the range keeps his own ' \u00b7 TURRET \u00b7 ' */
    if(title) title.textContent=_w+' \u00b7 '+_s+(/^TURRET\\b/.test(_s)?'':' \u00b7 TURRET')+' \u00b7 '+((typeof RANGE_MODE_NAME!=='undefined'&&RANGE_MODE_NAME[state.rangeMode||'bounce'])||'TRAIN UP');""",
"""    /* r.211: the MAP is the heading - which is DD-48 answered better than r.209 answered it, because the map is
       not merely first in a line, it is the title. The seat and the programme sit beneath it, and the hint names
       the map again, exactly as his picture does. */
    var _t=(typeof rungTitle==='function')?rungTitle():'The Range';
    var sub=document.getElementById('qrSub'), hint=document.getElementById('qrHint');
    if(title) title.textContent=_t;
    if(sub) sub.textContent=((typeof rungSeatTitle==='function')?rungSeatTitle():('Lane '+(((state.lane|0)+1))+' \u00b7 Turret'))+' \u00b7 Mode: '+((typeof modeWords==='function')?modeWords():'Train - Up');
    if(hint) hint.textContent='Scan to share '+_t;""",1)

# 5 · the boot row follows the new shape. The map is still proven to be named first - now as the heading itself.
rep("""      const rangeHead=/^THE RANGE \u00b7 LANE \\d+ \u00b7 TURRET \u00b7 /.test(t), oldForm=/\\?range=\\d+&role=turret&mode=/.test(u), capHead=/^THE CAPITAL \u00b7 /.test(capPair);""",
"""      const sb=document.getElementById('qrSub'), hn=document.getElementById('qrHint');
      const st=String(sb&&sb.textContent||''), ht=String(hn&&hn.textContent||'');
      const rangeHead=t==='The Range', subOk=/^Lane \\d+ \u00b7 Turret \u00b7 Mode: (Train - Up|Train - Down|Qual 40)$/.test(st), hintOk=ht==='Scan to share The Range';
      const opaque=getComputedStyle(sh).backgroundColor==='rgb(5, 8, 12)';
      const oldForm=/\\?range=\\d+&role=turret&mode=/.test(u), capHead=/^The Capital$/.test(capPair);""",1)
rep("""      rows.push({id:'THE_SHEET_NAMES_THE_MAP',ok:rangeHead&&oldForm&&capHead,note:'the sheet heads "'+t+'" and links '+u.replace(/^https?:\\/\\/[^/]+/,'')+' \u00b7 off the range the same sheet heads "'+capPair+'" \u2014 the map first, and the range link byte-identical so a QR already in his hand still opens'});""",
"""      rows.push({id:'THE_SHEET_NAMES_THE_MAP',ok:rangeHead&&subOk&&hintOk&&opaque&&oldForm&&capHead,note:'the sheet heads "'+t+'" over "'+st+'", hint "'+ht+'", on an opaque ground ('+getComputedStyle(sh).backgroundColor+') and links '+u.replace(/^https?:\\/\\/[^/]+/,'')+' \u00b7 off the range the heading is "'+capPair+'" \u2014 THE MAP IS THE TITLE (his picture), and the range link byte-identical so a QR already in his hand still opens'});""",1)
rep("""      const capPair=(function(){ const c0=state.challenge; try{ state.challenge=1; const w=rungWord(), q=rungSeat(); return w+' \u00b7 '+q+(/^TURRET/.test(q)?'':' \u00b7 TURRET')+' \u00b7 '+((RANGE_MODE_NAME&&RANGE_MODE_NAME[state.rangeMode||'bounce'])||'TRAIN UP'); } finally { state.challenge=c0; } })();""",
"""      const capPair=(function(){ const c0=state.challenge; try{ state.challenge=1; return rungTitle(); } finally { state.challenge=c0; } })();""",1)

# 6a · THE EMBEDDED RECORD IS DATA, NOT CODE — r.210 put the ledger inside the file and its entries QUOTE
#     the deck's own past source, including the pre-r.196 URL "/drone-2525/play?range=". Checking the raw file
#     would read a sentence ABOUT the old link as if it were the old link. (drone-playable.test.mjs learned the
#     same lesson in r.210 and strips the block before its code assertions; this does the same.)
_code=re.sub(r'/\*RCORE_LEDGER_BEGIN\*/[\s\S]*?/\*RCORE_LEDGER_END\*/','/*RCORE_LEDGER - stripped: data, not code*/',s)
if len(_code)>=len(s): raise SystemExit('REFUSE: the embedded record was not found to strip')

# 6 · presence
for need in ['<h2 id="qrTitle">The Range</h2>','<p id="qrSub">Lane 21 \u00b7 Turret \u00b7 Mode: Train - Up</p>',
             '<p id="qrHint">Scan to share The Range</p>','<button type="button" id="qrCopy">Copy Link</button>',
             "function rungTitle(){ return rungIsRange()?'The Range':'The Capital'; }",
             "function modeWords(){","function rungSeatTitle(){",
             "#qrSheet{position:fixed;inset:0;z-index:60;display:none;background:#05080c;",
             "#qrSheet #qrCopy{color:#E8EEF0;border:0;","#qrClose{position:fixed;top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));z-index:61;width:44px;height:44px;min-height:44px;padding:0;color:#fff;border:0;background:transparent;font-size:28px}",
             "if(hint) hint.textContent='Scan to share '+_t;",
             "rows.push({id:'THE_SHEET_NAMES_THE_MAP',ok:rangeHead&&subOk&&hintOk&&opaque&&oldForm&&capHead",
             "return host+'/drone-2525/play.html?range='+lane+'&role=turret&mode='+mode;"]:
    if _code.count(need)!=1: raise SystemExit('REFUSE: not in once (%d): %s'%(_code.count(need),need[:70]))

# 7 · the plain sheet and r.209's one-line heading must be gone; the ".html" link must NOT be
for dead in ['color:#7AB8C4;border:1px solid #1C2A3A;background:#000}','background:rgba(0,0,0,.78)','>THE RANGE \u00b7 LANE 21 \u00b7 TURRET \u00b7 TRAIN UP<','>COPY LINK<',
             "letter-spacing:.16em;font-size:15px","revision:'0.210'","r0.210",
             "/drone-2525/play?range="]:
    if dead in _code: raise SystemExit('REFUSE: stale remains in CODE: '+dead[:70])

# 8 · THE CUT IS PARSED BEFORE IT IS WRITTEN
_m=max(re.findall(r'<script[^>]*>(.*?)</script>', s, re.S), key=len)
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as _f:
    _f.write(_m); _p=_f.name
_r=subprocess.run(['node','--check',_p],capture_output=True,text=True)
os.unlink(_p)
if _r.returncode!=0: raise SystemExit('REFUSE: the cut does not parse \u2014\n'+(_r.stderr or '')[:1200])
print('parsed OK ('+str(len(_m))+' chars of script)')

open(DST,'w',encoding='utf-8').write(s); b=open(DST,'rb').read()
print('patches',n[0],'bytes',len(b),'sha',hashlib.sha256(b).hexdigest())
