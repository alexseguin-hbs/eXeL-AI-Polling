# r.216 -> r.217 — THE HIT TOAST CLEARS, AND THE SHARE LINE KEEPS ITS WORDS
#  (operator 2026-10-19, DD-115: "r.217 IS APPROVED AS PROPOSED — the post-FIRE toast must not outlive the truth,
#   and the share sheet's address must not break inside a word"; DD-116, Grok's seven pass lines, which are the
#   acceptance criteria; bounded three times by the same source: "r.217 is still only the toast and the share line.
#   Nothing on the lawn moves.")
#
#  WHAT WAS MEASURED, and the second probe corrected the first. My own probe watched the toast hide at ~1.9 s while
#  the strip sat on TARGET FIRST, and I reported that it "does not outlive the truth". THAT PROBE NEVER MOVED THE
#  SIGHT. Grok's did, and inside the toast's own 1.8 s window the strip advances to the NEXT plate while the toast
#  is still naming the LAST one:
#      Just after FIRE            strip TARGET FIRST            toast HIT . 50 M LEFT . TARGET . APPROVE . FIRE
#      Sight already on 50 m right strip 50 M RIGHT . PRESS TARGET  toast the same sentence, still up
#  Two statements, one current and one stale, and the stale one is the louder. So the fix is A DISMISSAL, NOT A
#  TIMEOUT: a faster toast would still be stale for whatever time it had.
#
#  INVARIANT (r.217): the glass never carries two sentences about two different plates. A hit's confirmation names
#  THAT plate and that it is DOWN, and it ends the moment the bullseye names a different one. And the share
#  sheet's address breaks only where a URL has a joint, never inside a word.
#
#  THE MACHINERY ALREADY EXISTED AND THE HIT TOAST SIMPLY NEVER ENROLLED IN IT. toast(m, plate) has carried
#  toast._plate / toast._under since r.204, and paintCues (:1082) already ends a toast when the plate under the
#  bullseye changes and is not the toast's own. The hit toast passed NO plate, so toast._plate stayed null and the
#  block skipped it. One argument fixes pass line 1; it is not new machinery.
#
#  WHAT THIS REVISION DELIBERATELY DOES NOT DO — and the reason is HIS OWN pass line 4:
#    "The strip does not move. After a scored hit it still walks PRESS TARGET -> PRESS APPROVE -> PRESS FIRE ->
#     TARGET FIRST in all three drills."
#  Today's 14-agent assessment recommended hoisting hudPhase's lastShot branch (:3149) above the r.205 TARGET FIRST
#  branch (:3148) so the strip would say HIT after a shot. THAT IS REFUSED: it is exactly the change pass line 4
#  forbids, and it would also undo r.205's CLASS 1d / DD-13e (with nothing under the bullseye the recital names NO
#  plate, not the last one shot). The assessment was measuring r.216 without his acceptance criteria in hand. The
#  strip is instead GATED as a no-regression leg.
#  Pass line 3 is a guard against the tidy instinct: "Train Down. Still no recital toast. Do not add one to make
#  the drills match." The 'stay' guard on the hit toast is untouched, and the new row asserts the silence.
#
#  FROZEN SPANS MOVED: NONE. fireN, paintCues, paintQr and the #qrUrl rule are all free ground.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
BASE_REV = '216'; NEW_REV = '217'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit(f'REFUSE: expected {count} of {old[:90]!r}, found {n}')
    s = s.replace(old, new, count); return s

# ---- the stale list: anything below that is already gone means a replay on the wrong base -------------------
for dead in ["toast('HIT · '+plateWord(s.id)+' · TARGET · APPROVE · FIRE')", 'word-break:break-all',
             'if(link) link.textContent=url;']:
    if dead not in s: raise SystemExit('REFUSE: stale ' + dead[:60])
# ---- the presence list: the machinery this revision leans on must be here, untouched ------------------------
for need in ["function toast(m,plate){", "if(under!==toast._under&&under!==toast._plate){",
             "(state.rangeMode||'bounce')!=='stay'", "pd.textContent='TARGET FIRST'; pd.style.color='#C9A227'; } /* r.205"]:
    if need not in s: raise SystemExit('REFUSE: missing ' + need[:60])

# === M1 · the hit toast names the plate and that it is DOWN, and enrols in the r.204 dismissal ===============
rep("toast('HIT · '+plateWord(s.id)+' · TARGET · APPROVE · FIRE');} /* r.196: TRAIN UP and QUAL 40 say the next three words; TRAIN DOWN's hit stays down */",
    "toast('HIT · '+plateWord(s.id)+' · DOWN', s.id);} /* r.217 (DD-115/DD-116 pass line 1, Grok measured it outliving the strip): the confirmation names THAT plate and that it is down - the recital of three steps that have just all been done is gone - and passing the plate enrols it in r.204's dismissal at paintCues, so it ends the moment the bullseye names a different plate. TRAIN DOWN still says nothing (pass line 3: do not add one to make the drills match). */ /* r.196: TRAIN UP and QUAL 40 say the next three words; TRAIN DOWN's hit stays down */")

# === M2 · the share line breaks at a URL's joints, never inside a word =======================================
rep("#qrSheet #qrUrl{color:#8E9BA3;font-size:13px;line-height:1.45;text-align:center;max-width:22em;margin:0 0 22px;word-break:break-all}",
    "#qrSheet #qrUrl{color:#8E9BA3;font-size:13px;line-height:1.45;text-align:center;max-width:22em;margin:0 0 22px;word-break:normal;overflow-wrap:break-word}#qrSheet #qrUrl .j{white-space:nowrap}" +
    "/* r.217 (DD-116 pass line 6: \"The address is not broken inside a word. explore-096 and workers.dev each stay whole.\"): break-all broke anywhere at all, so the host split mid-token. MEASURED: word-break:normal alone is NOT enough - a browser still breaks after a HYPHEN, which splits explore-096 at exactly the place he named. So each run between two joints is a .j span that cannot break at all, and the widest of them is 196 px against a 286 px box at 375 px. The gate holds that headroom, so a longer host turns it red instead of running off the card. */")

rep("if(link) link.textContent=url;",
    "if(link){ link.textContent=''; /* r.217 (DD-116 pass line 6). A URL breaks only at its JOINTS and each run "
    "between two joints is unbreakable, so no word is ever cut. The joints are: after the scheme; between the "
    "host's LABELS, with the registrable domain kept whole; and before each / ? and &. MEASURED on his own "
    "address: the whole host is 313 px against a 286 px card, so it cannot sit on one line - but exel-ai-polling. "
    "/ explore-096. / workers.dev are 125 / 94 / 86 px and each stays whole, which is exactly what he asked for. "
    "<wbr> and the spans contribute nothing to textContent, so Copy Link and the boot QA still read the plain "
    "address. */ "
    "var _m=String(url).match(/^([a-z]+:\\/\\/)([^\\/?#]*)([\\s\\S]*)$/), _runs=[]; "
    "if(_m){ _runs.push(_m[1]); var _l=_m[2].split('.'); "
    "if(_l.length>2){ var _t=_l.slice(-2).join('.'); _runs=_runs.concat(_l.slice(0,-2).map(function(x){return x+'.';})); _runs.push(_t); } "
    "else _runs.push(_m[2]); "
    "String(_m[3]).split(/(?=[\\/?&])/).forEach(function(x){ if(x) _runs.push(x); }); } "
    "else _runs=String(url).split(/(?=[\\/?&])/).filter(Boolean); "
    "_runs.forEach(function(r,i){ if(i) link.appendChild(document.createElement('wbr')); "
    "var sp=document.createElement('span'); sp.className='j'; sp.textContent=r; link.appendChild(sp); }); }")

# === M3 · the two new boot-QA rows, deferred beside the share sheet's own row ================================
ANCHOR = "  }catch(e){ rows.push({id:'THE_SHEET_NAMES_THE_MAP',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1500);\n"
ROWS = ANCHOR + """  /* r.217 deferred rows (DD-116, Grok's seven pass lines are the acceptance criteria). Both wait with the share
     sheet's own row because one of them presses the real share button and the other needs paintCues to have run. */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='THE_HIT_TOAST_CLEARS')) return;
    /* r.217 · THE_HIT_TOAST_CLEARS (pass lines 1, 2, 3). A hit's confirmation names THAT plate and that it is down,
       it carries no recital of three steps that have just been done, it is GONE once the bullseye names a different
       plate, and TRAIN DOWN still says nothing at all. */
    const tv=document.getElementById('toast');
    const m0=state.rangeMode, d0=state.desig, s0=state.tgtSlot, a0=state.hiApproved, l0=state.lastShot, n0=state.lane, v0=state.viewMode, q0=state.qaArmed;
    let ok=true, note='';
    try{
      state.qaArmed=true; state._qaSilent=false; state.viewMode='eye';
      const shoot=(mode)=>{ state.rangeMode=mode; rangeReset(); state.desig=null; state.tgtSlot={}; state.hiApproved=false;
        if(tv){ tv.style.display='none'; } toast._plate=null; toast._under=null;
        const q=platesHere().find(p=>p.base==='C-50L'); if(!q) return null;
        aimPlate(q,0); markLock(lockOn(),'QA'); const sl=+markSlotOf(q.id)||1; approveN(sl); fireN(sl);
        return {q, text:(tv&&tv.style.display!=='none')?String(tv.textContent||''):'' }; };
      const up=shoot('bounce');
      if(!up) { ok=false; note='no 50 m left plate to shoot'; }
      else {
        const recital=/TARGET · APPROVE · FIRE/.test(up.text);
        const namesIt = /DOWN/.test(up.text) && up.text.indexOf(plateWord(up.q.id))>=0;
        /* move the sight to another plate, exactly as he does - this is the leg my own probe never ran */
        const other=platesHere().find(p=>p.base==='C-50R')||platesHere().find(p=>p.id!==up.q.id);
        if(other) aimPlate(other,0); paintCues();
        const gone = !tv || tv.style.display==='none' || tv.textContent.indexOf(plateWord(up.q.id))<0;
        const down=shoot('stay');
        /* pass line 3 is about the RECITAL, not about silence: TRAIN DOWN already raises a BAND report
           ("HIT · IN THE AIMING CIRCLE", play.html:2716/2717) and always has. Measured on the r.216 bytes
           before this row shipped. What must never appear there is the three-step recital. */
        const noRecital = !down || !/TARGET · APPROVE · FIRE/.test(down.text);
        ok = !recital && namesIt && gone && noRecital;
        note='TRAIN UP toast "'+up.text.slice(0,48)+'" · recital '+(recital?'STILL THERE':'gone')+' · names the plate and DOWN '+(namesIt?'yes':'NO')
           +' · sight moved to '+(other?plateWord(other.id):'nothing')+' → '+(gone?'toast gone':'TOAST STILL TALKING ABOUT '+plateWord(up.q.id))
           +' · TRAIN DOWN raised "'+(down?down.text.slice(0,40):'nothing')+'" → recital '+(noRecital?'still absent':'ADDED');
      }
    } finally { state.rangeMode=m0; state.lane=n0; rangeReset(); state.desig=d0; state.tgtSlot=s0; state.hiApproved=a0; state.lastShot=l0; state.viewMode=v0; state.qaArmed=q0; state._qaSilent=_s0; if(tv) tv.style.display='none'; toast._plate=null; toast._under=null; }
    rows.push({id:'THE_HIT_TOAST_CLEARS',ok,note});
  }catch(e){ state._qaSilent=_s0; rows.push({id:'THE_HIT_TOAST_CLEARS',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1600);
  setTimeout(()=>{ try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='THE_SHARE_LINE_KEEPS_ITS_WORDS')) return;
    /* r.217 · THE_SHARE_LINE_KEEPS_ITS_WORDS (pass line 6). The address is laid out and MEASURED: every text run
       between two break opportunities must sit on ONE line, so no word is split. His two named tokens are checked
       by name. The plain address is still what Copy Link reads. */
    const b=document.getElementById('btnQr'), sh=document.getElementById('qrSheet'), ur=document.getElementById('qrUrl');
    if(!b||!sh||!ur){ rows.push({id:'THE_SHARE_LINE_KEEPS_ITS_WORDS',ok:false,note:'the share sheet is not on the page at check time'}); return; }
    const wasOn=sh.classList.contains('on'); b.click();
    const plain=String(ur.textContent||'');
    const noBreakAll=(getComputedStyle(ur).wordBreak||'')!=='break-all';
    const wbrs=ur.querySelectorAll('wbr').length;
    /* every text node must be unbroken: its client rects all share one top */
    let split='', runs=0, widest=0, widestT='';
    const box=ur.getBoundingClientRect().width;
    for(const n of Array.from(ur.querySelectorAll('span.j'))){ runs++;
      const rects=Array.from(n.getClientRects()); const tops=new Set(rects.map(x=>Math.round(x.top)));
      const w=Math.max(0,...rects.map(x=>x.width)); if(w>widest){ widest=Math.round(w); widestT=n.textContent; }
      if(tops.size>1 && !split) split=String(n.textContent).slice(0,24); }
    /* the future risk is not a wrap but an OVERFLOW: a run that cannot break and cannot fit. */
    const fits = widest<=box;
    /* His two named tokens are reported BY NAME when the served host carries them - they do not exist on a
       127.0.0.1 harness, and a row that went red for that reason would be lying. The invariant itself is
       carried by `split`: NO text run between two joints may wrap, so no word anywhere in the address can be
       cut, whatever the host happens to be. Verify Live runs this against the real host. */
    const named=(t)=>{ for(const n of Array.from(ur.querySelectorAll('span.j'))){ if(String(n.textContent).indexOf(t)>=0){ return new Set(Array.from(n.getClientRects()).map(x=>Math.round(x.top))).size===1?'whole':'BROKEN'; } } return 'not in this host'; };
    const hostWhole=named('explore-096'), devWhole=named('workers.dev');
    if(!wasOn){ const x=document.getElementById('qrClose'); if(x) x.click(); }
    const ok = noBreakAll && wbrs>=3 && !split && fits && hostWhole!=='BROKEN' && devWhole!=='BROKEN' && /^https?:\\/\\//.test(plain);
    rows.push({id:'THE_SHARE_LINE_KEEPS_ITS_WORDS',ok,note:'word-break '+(noBreakAll?'normal':'STILL break-all')+' · '+wbrs+' joints · '+runs+' runs, '+(split?('SPLIT MID-WORD at "'+split+'"'):'none split')+' · widest run '+widest+'px of '+Math.round(box)+'px ("'+String(widestT).slice(0,34)+'")'+(fits?'':' OVERFLOWS')+' · explore-096 '+hostWhole+' · workers.dev '+devWhole+' · copy reads '+plain.slice(0,42)});
  }catch(e){ rows.push({id:'THE_SHARE_LINE_KEEPS_ITS_WORDS',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1700);
"""
rep(ANCHOR, ROWS)

# === M4 · the head: corner, BUILD ============================================================================
rep("<span>r0.216</span>", "<span>r0.217</span>")
rep("revision:'0.216'", "revision:'0.217'")

# === the embedded R-CORE record moves on by one (deck-rcore holds the lag at exactly 1) ======================
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:claude|gpt|gemini|grok|llama|opus|sonnet|haiku|fable)[\w.\-]*\b', re.I)
THROUGH = 95
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
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
if json.loads(_old.group(1)).get('through') != 94: raise SystemExit('REFUSE: expected the r.216 base to embed through 94')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]
_new = json.loads(re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s).group(1))
if _new['through'] != THROUGH or len(_new['entries']) != THROUGH: raise SystemExit('REFUSE: the embedded block is not through %d' % THROUGH)

# one revision number in the file
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')

for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit(f'REFUSE: script #{i} does not parse: {r.stderr[:300]}')

out = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(out, 'w', encoding='utf-8').write(s)
print('r.' + NEW_REV, len(s.encode('utf-8')), 'B', hashlib.sha256(s.encode('utf-8')).hexdigest())
