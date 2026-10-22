# r.222 -> r.223 — THE LAWN'S ONE AIR TRACK IS THE FOIL (operator 2026-10-21, relayed)
#  "Draw the one lawn air track from docs/drone-2525/exports/foil-1.111.wire.json. It is real: 901 vertices, 1755 edges,
#  span 1.111 m, nose to rear 0.7777 m. Do not hand-edit it. It is generated. Do not use foil-11.111. Do not use the .obj,
#  .cpp, .cs, or .py. Do not fetch anything. The pictures in docs/drone-2525/foil-package/ are the check, not a second
#  model. Stroke only. No fill. Same track, same bearing, same cue, same TARGET, APPROVE, FIRE, same fall. Still one
#  track. This does not load the X-BAT package and it does not open Real-World. Pass: the thing you shoot is that foil,
#  and the score still reads HIT and MISS."
#  ONE SOURCE, TWO READINGS. The wire (901 vertices / 1,755 edges, the numbers verbatim from the export) is embedded and
#  drawn when the projected span is >= 120 px; below that the deck draws the silhouette the one foil generator derives
#  from the same model (111 segments: the outline in the three principal planes plus the centreline), because 1,755
#  strokes in the ~13 px the foil subtends at 1x read as a filled blob, not a stroke drawing. Both are drawn by one
#  hoisted foilDraw() through the track's own counter (state.foilSegs) - never the world budget (segs) and never the
#  Capitol's own-segment band (THE_CAPITOL_IS_DRAWN holds own1 <= 280). Nose UP: a VTOL foil hovers on its tail, which
#  is the package's own front view (the drawing is nose-up on its tail - span across, the planform face-on to the gun);
#  the track is a hover (vx = vz = 0), so that is its attitude. The gameplay is untouched: the same drones[0], the same
#  cue, presses and fall.
import hashlib, os, re, json, subprocess, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DECK = os.path.dirname(HERE); ROOT = os.path.normpath(os.path.join(DECK, '..', '..', '..'))
if not os.path.exists(os.path.join(DECK, 'HASHES_r222.sha256')):
    DECK = os.path.join(ROOT, 'docs', 'drone-2525', 'operator-deck')
BASE_REV = '222'; NEW_REV = '223'
BASE_SHA = open(os.path.join(DECK, 'HASHES_r' + BASE_REV + '.sha256'), encoding='utf-8').read().split()[0]
SRC = os.path.join(DECK, 'drone-2525_r.' + BASE_REV + '.html')
s = open(SRC, encoding='utf-8').read()
if hashlib.sha256(s.encode('utf-8')).hexdigest() != BASE_SHA: raise SystemExit('REFUSE: the base is not the carried r.' + BASE_REV)

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count: raise SystemExit('REFUSE: expected %d of %r, found %d' % (count, old[:90], n))
    s = s.replace(old, new, count); return s

RESET = "  state.segs=0;state.dropped=0;state.ownSegs=0;state.ownCulled=0;"
DRONE = "  drones.forEach(d=>{if(!d.up)return;const c=(hot(d)||d.mist)?T13.LOCK:T13.AI;segs(box(d.x,d.y,d.z,1.8,.5,1.8),c);segs([[[d.x-1.2,d.y,d.z],[d.x+1.2,d.y,d.z]],[[d.x,d.y,d.z-1.2],[d.x,d.y,d.z+1.2]]],c);});"
TAIL = "}catch(e){ try{ log('LAWN','SCORE',String(e).slice(0,80)); }catch(_){ } } })();\n\n</script>"
ANCHOR = "  /* r.219 · the five lawn rows. ONE door (pickScenario('capital') -> capIntroEnter), every unit snapshotted and\n"
for need in [RESET, DRONE, TAIL, ANCHOR, "function capIntroTrack(){", "function capIntro(){", "function proj(p,cam,W,H){"]:
    if s.count(need) != 1: raise SystemExit('REFUSE: the r.222 base does not carry exactly one of: ' + need[:60])
for dead in ['foilDraw', 'THE_LAWN_TRACK_IS_THE_FOIL', 'state.foilSegs', 'FOIL_V', 'foilWire(', 'foilSil(']:
    if dead in s: raise SystemExit('REFUSE: r.223 is already in the base: ' + dead)

# === the foil, from the exports and nowhere else ============================================================
WIRE = json.load(open(os.path.join(ROOT, 'docs/drone-2525/exports/foil-1.111.wire.json'), encoding='utf-8'))
SIL = json.load(open(os.path.join(ROOT, 'docs/drone-2525/exports/foil-1.111.silhouette.json'), encoding='utf-8'))
if WIRE['meta']['id'] != 'foil-1.111' or WIRE['units'] != 'm': raise SystemExit('REFUSE: not the foil-1.111 wire')
if WIRE['frame'].get('forward') != 'x' or WIRE['frame'].get('right') != 'y' or WIRE['frame'].get('up') != 'z': raise SystemExit('REFUSE: the wire frame is not nose +x, right +y, up +z')
if WIRE['dimensionsM'] != {'span': 1.111, 'noseToTail': 0.7777, 'depth': 0.2522}: raise SystemExit('REFUSE: the wire is not the 1.111 x 0.7777 demo foil: %r' % WIRE['dimensionsM'])
if len(WIRE['vertices']) != 901 or len(WIRE['edges']) != 1755: raise SystemExit('REFUSE: expected 901 vertices / 1755 edges, got %d / %d' % (len(WIRE['vertices']), len(WIRE['edges'])))
if SIL['meta'].get('of') != 'foil-1.111' or SIL['dimensionsM'] != WIRE['dimensionsM']: raise SystemExit('REFUSE: the silhouette is not of foil-1.111')
NSIL = len(SIL['segments'])
if NSIL < 60 or NSIL > 200: raise SystemExit('REFUSE: silhouette segment count out of the expected band: %d' % NSIL)
J = lambda a: json.dumps(a, separators=(',', ':'), ensure_ascii=True)
V = J([n for v in WIRE['vertices'] for n in v]); E = J([i for e in WIRE['edges'] for i in e]); SS = J([n for seg in SIL['segments'] for p in seg for n in p])
for blob in (V, E, SS):
    if '</script' in blob or 'e+' in blob: raise SystemExit('REFUSE: the embedded numbers carry an unexpected token')

# === the head ================================================================================================
rep("<span>r0.222</span>", "<span>r0.223</span>")
rep("revision:'0.222'", "revision:'0.223'")

# === the embedded R-CORE record moves on one row (lag exactly one, deck-rcore): through 101 -> 102 ============
LEDGER = json.load(open(os.path.join(ROOT, 'docs/traceability/drone-2525.ledger.json'), encoding='utf-8'))
MODEL = re.compile(r'\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?', re.I)
THROUGH = 102
if len(LEDGER['entries']) < THROUGH: raise SystemExit('REFUSE: the ledger has only %d entries' % len(LEDGER['entries']))
if not re.match(r'^[0-9a-f]{7,40}$', str(LEDGER['entries'][101].get('shipped', ''))): raise SystemExit('REFUSE: rev 102 (r.222) has no ship commit yet: ' + str(LEDGER['entries'][101].get('shipped')))
_e = []
for e in LEDGER['entries'][:THROUGH]:
    o = {'rev': e['rev'], 'date': e['date'], 'kind': e['kind'], 'text': MODEL.sub('an external model', e.get('text', '')), 'commit': e.get('commit', '')}
    if 'shipped' in e: o['shipped'] = e['shipped']
    _e.append(o)
BLOCK = json.dumps({'section': LEDGER['section'], 'route': LEDGER['route'], 'through': THROUGH, 'entries': _e}, ensure_ascii=False, separators=(',', ':'))
for bad in ['</script', '<!--', '-->', '\u00a0', '\u2009']:
    if bad in BLOCK: raise SystemExit('REFUSE: the ledger block carries %r' % bad)
_old = re.search(r'/\*RCORE_LEDGER_BEGIN\*/const RCORE_LEDGER=(\{[\s\S]*?\});/\*RCORE_LEDGER_END\*/', s)
if not _old: raise SystemExit('REFUSE: the embedded ledger block was not found')
if json.loads(_old.group(1)).get('through') != 101: raise SystemExit('REFUSE: expected the r.222 base to embed through 101')
s = s[:_old.start()] + '/*RCORE_LEDGER_BEGIN*/const RCORE_LEDGER=' + BLOCK + ';/*RCORE_LEDGER_END*/' + s[_old.end():]

# === M1 · the track's own counter, reset with the frame's others (draw(), FREE) ================================
rep(RESET, RESET + "state.foilSegs=0;state.foilCulled=0; /* r.223: the lawn track's foil, counted on its own - never the world budget, never the Capitol's own band */")

# === M2 · the lawn's one air track is drawn as the foil; every other up drone keeps the box =====================
rep(DRONE,
    "  drones.forEach(d=>{if(!d.up)return;const c=(hot(d)||d.mist)?T13.LOCK:T13.AI; if(capIntro()&&d===capIntroTrack()){ foilDraw(d,c,v,cam,W,H,fw); return; } /* r.223: the lawn's one air track is the foil - his wire, stroke only (see foilDraw) */ segs(box(d.x,d.y,d.z,1.8,.5,1.8),c);segs([[[d.x-1.2,d.y,d.z],[d.x+1.2,d.y,d.z]],[[d.x,d.y,d.z-1.2],[d.x,d.y,d.z+1.2]]],c);});")

# === M3 · the foil: the wire and the silhouette, verbatim from the exports, and the one drawer ==================
FOIL = r"""}catch(e){ try{ log('LAWN','SCORE',String(e).slice(0,80)); }catch(_){ } } })();

/* ===================================================================================================================
   r.223 — THE LAWN'S ONE AIR TRACK IS THE FOIL (operator 2026-10-21: "Draw the one lawn air track from
   docs/drone-2525/exports/foil-1.111.wire.json … Stroke only. No fill. Same track, same bearing, same cue, same
   TARGET, APPROVE, FIRE, same fall. Still one track."). INVARIANT: the thing the player shoots on the lawn is drawn
   from the foil-1.111 wire and from nothing else — 901 vertices and 1,755 edges, the export's numbers verbatim
   (tests/deck-foil.test.mjs holds them equal to the file) — in stroke only, never a fill, never a box or a triangle;
   the gameplay is the same drones[0], the same cue, the same three presses, the same fall. ONE SOURCE, TWO READINGS:
   at >= 120 px of projected span the full wire; below it the silhouette the one foil generator derives from the same
   model (the outline in the three principal planes plus the centreline), because 1,755 strokes in the ~13 px the foil
   subtends at 1x paint as a filled blob. THE FOIL ROTATES (operator: "foil must have ability to rotate… top point is
   front"): the wire is body (nose +x, starboard +y, up +z) and foilToDeck() turns it by an attitude — foilAtt(d): an
   explicit d.att {yaw,pitch,roll} wins; else a moving track flies nose-first along its velocity, level; else a numeric
   d.yaw flies level at that heading; else a hover stands on its tail nose-UP (a VTOL foil — the package's own front
   view, the drawing nose-up on its tail, span across, the planform to the gun). The top point of his picture is the
   nose: the front. Yaw follows the deck's own convention (units[].yaw / yawTo: forward = (−sin yaw, 0, cos yaw)).
   Counted on the track's own counter (state.foilSegs/foilCulled), never the world budget and never
   the Capitol's own band. Hoisted functions, memoised data: callable from draw() at any moment, no temporal dead zone.
   =================================================================================================================== */
function foilWire(){ if(!foilWire._w){ foilWire._w={V:/*FOIL_V*/@V@/*FOIL_V_END*/,E:/*FOIL_E*/@E@/*FOIL_E_END*/}; } return foilWire._w; }
function foilSil(){ if(!foilSil._s){ foilSil._s=/*FOIL_S*/@S@/*FOIL_S_END*/; } return foilSil._s; }
function foilFullPx(){ return 120; }   /* the projected span at which the full wire replaces the silhouette */
function foilAtt(d){ /* the track's attitude, radians: yaw about the vertical in the deck's own sense (forward = (−sin yaw, 0, cos yaw), as units[].yaw), pitch nose-up, roll starboard-down. An explicit d.att wins; a moving track flies nose-first along its velocity; a numeric d.yaw flies level at that heading; a hover stands on its tail, nose up — a VTOL foil. The top point of his picture is the nose: the front. */
  if(d.att) return {yaw:+d.att.yaw||0,pitch:+d.att.pitch||0,roll:+d.att.roll||0};
  const vx=+d.vx||0, vz=+d.vz||0, vy=+d.vy||0, sp=Math.hypot(vx,vz);
  if(sp>1e-6) return {yaw:Math.atan2(-vx,vz),pitch:Math.atan2(vy,sp),roll:0};
  if(typeof d.yaw==='number') return {yaw:d.yaw,pitch:0,roll:0};
  return {yaw:0,pitch:Math.PI/2,roll:0};
}
function foilToDeck(d,px,py,pz,A){ /* body (nose +x, starboard +y, up +z) → deck (x right, y up, z forward): level and nose-first along +Z is X=y, Y=z, Z=x; then roll about the nose, pitch about the wing line, yaw about the vertical; then the track's own place */
  let X=py, Y=pz, Z=px;
  const cr=Math.cos(A.roll), sr=Math.sin(A.roll); { const X1=X*cr+Y*sr, Y1=-X*sr+Y*cr; X=X1; Y=Y1; }   /* +roll: starboard wing down */
  const cp=Math.cos(A.pitch), sp=Math.sin(A.pitch); { const Y1=Y*cp+Z*sp, Z1=-Y*sp+Z*cp; Y=Y1; Z=Z1; }   /* +pitch: nose up */
  const cy=Math.cos(A.yaw), sy=Math.sin(A.yaw); { const X1=X*cy-Z*sy, Z1=X*sy+Z*cy; X=X1; Z=Z1; }       /* +yaw: the deck's sense (counter-clockwise from above) */
  return [d.x+X,d.y+Y,d.z+Z];
}
function foilDraw(d,c,v,cam,W,H,fw){
  const A=foilAtt(d); state.foilAtt=A; const P=(px,py,pz)=>proj(foilToDeck(d,px,py,pz,A),cam,W,H), B=(f,i)=>P(f[i],f[i+1],f[i+2]);   /* P: one body point on the glass, null past its edge · B: the point at index i of a flat x,y,z,… list, the shape both embedded blocks share */
  const a=P(0,-0.5555,0), b=P(0,0.5555,0); const spanPx=(a&&b)?Math.hypot(a.x-b.x,a.y-b.y):0; state.foilPx=spanPx; const full=spanPx>=foilFullPx();   /* the one reading: the wire at full span, else the silhouette */
  const seg=(p,q)=>{ if(!p||!q){ state.foilCulled++; return; } v.moveTo(p.x,p.y); v.lineTo(q.x,q.y); state.foilSegs++; };   /* one stroke of the picture, or culled at its edge — the one emitter both readings use */
  v.strokeStyle=c; v.lineWidth=fw; v.beginPath();
  if(full){ const {V,E}=foilWire(), pr=[]; for(let i=0;i<V.length;i+=3) pr.push(B(V,i)); for(let k=0;k<E.length;k+=2) seg(pr[E[k]],pr[E[k+1]]); }
  else { const sg=foilSil(); for(let k=0;k<sg.length;k+=6) seg(B(sg,k),B(sg,k+3)); }
  state.foilMode=full?'wire':'silhouette'; v.stroke();   /* stroke only — this function never fills */
}

</script>"""
FOIL = FOIL.replace('@V@', V).replace('@E@', E).replace('@S@', SS)
rep(TAIL, FOIL)

# === M4 · the boot-QA row ======================================================================================
ROW = r"""  /* r.223 · the thing you shoot on the lawn is the foil (operator 2026-10-21). Red on the r.222 bytes: the track is a
     box and a cross, there is no foilDraw and no foil counter. Green on the cut: at 1x the silhouette (the generator's
     111 segments, from the same model), at 30x the wire itself (1,755 edges less what the picture's edge culls), the
     planform face-on (nose up, a VTOL hovering on its tail - the package's own front view), 1.4x wider than tall
     (1.111 / 0.7777); the embedded counts are the export's (901 / 1755 / 111). And it ROTATES (operator: "top point is
     front"): in the hover the nose projects above the tail; at yaw −90° from the camera, level, the nose projects to
     the right of the tail and the picture is the side-on foil (nose-to-tail over depth, ~3x wider than tall). Same
     door, snapshot and restore as the lawn block (d.att removed again); the world budget and the Capitol's own band
     untouched (the foil counts on its own). */
  setTimeout(()=>{ const _s0=state._qaSilent; try{ if(state.outcomes!==rows) return; if(rows.some(x=>x.id==='THE_LAWN_TRACK_IS_THE_FOIL')) return;
    const snap=rangeSnap(); const ph0=state.lobby?state.lobby.phase:null; const q0=state.qaArmed; const vm0=state.viewMode; const z0=state.zoom;
    const sv=Object.keys(units).filter(id=>units[id]&&units[id].kind==='turret').map(id=>[id,units[id].x,units[id].y,units[id].z,units[id].yaw,units[id].pan,units[id].tilt,units[id].label]);
    const pops0=pops.map(p=>p.up); const dr0=drones.map(d=>({up:d.up,x:d.x,y:d.y,z:d.z,life:d.life,lifePct:d.lifePct,fall:d.fall,vx:d.vx,vz:d.vz,mist:d.mist}));
    const cl0=state.clock, tk0=state.tick, mg0=state.mag?Object.assign({},state.mag):null;
    let ok=false, note='';
    try{ state.qaArmed=true; state._qaSilent=true; state.desig=null; state.tgtSlot={}; state.hiApproved=false;
      pickScenario('capital'); state.viewMode='op';                                                      /* TRAIN UP: the track stands at entry */
      const d=capIntroTrack(); const w=foilWire(), sg=foilSil();
      const counts=(w.V.length/3)+'/'+(w.E.length/2)+'/'+(sg.length/6);
      state.zoom=1; draw(); const f1=state.foilSegs|0, m1=state.foilMode, px1=Math.round(state.foilPx||0);
      state.zoom=30; draw(); const f30=state.foilSegs|0, c30=state.foilCulled|0, m30=state.foilMode, px30=Math.round(state.foilPx||0);
      let aspect=-1, noseUp=false, noseRight=false, side=-1; try{ const cam=camOf(units[state.unit]); const W=view.width, H=view.height;
        const NT=(A)=>{ const P=(px,py,pz)=>proj(foilToDeck(d,px,py,pz,A),cam,W,H); return {a:P(0,-0.5555,0),b:P(0,0.5555,0),n:P(0.38885,0,0),t:P(-0.38885,0,0),up:P(0,0,0.1261),dn:P(0,0,-0.1261)}; };
        const h=NT(foilAtt(d)); if(h.a&&h.b&&h.n&&h.t){ aspect=Math.abs(h.a.x-h.b.x)/Math.max(1,Math.abs(h.n.y-h.t.y)); noseUp=h.n.y<h.t.y; }     /* the hover: span across, nose above the tail */
        d.att={yaw:cam.yaw-Math.PI/2,pitch:0,roll:0}; draw(); const r=NT(d.att); if(r.n&&r.t&&r.up&&r.dn){ noseRight=r.n.x>r.t.x; side=Math.abs(r.n.x-r.t.x)/Math.max(1,Math.abs(r.up.y-r.dn.y)); } delete d.att;   /* level, nose to the camera's right: the side-on foil */
      }catch(_){ }
      ok = counts==='901/1755/111' && d.up && m1==='silhouette' && f1>=100 && f1<=111 && m30==='wire' && (f30+c30)===1755 && f30>=1500 && px30>px1 && (aspect<0||(aspect>=1.2&&aspect<=1.7)) && noseUp && noseRight && (side<0||side>=2.5);
      note = 'embedded V/E/S '+counts+' · at 1x: '+m1+' '+f1+' segments, span '+px1+' px · at 30x: '+m30+' '+f30+' drawn + '+c30+' culled of 1755, span '+px30+' px, width/height '+(aspect<0?'n/a':aspect.toFixed(1))+' · stroke only · rotates: hover nose above tail '+noseUp+', yaw −90° nose right of tail '+noseRight+' (side-on width/height '+(side<0?'n/a':side.toFixed(1))+')';
    }catch(e){ note='threw '+String(e).slice(0,100); }
    finally { try{ const dd=capIntroTrack(); if(dd) delete dd.att; }catch(_){ } state.zoom=z0; state.viewMode=vm0; try{ pickScenario('range'); }catch(_){ } state.capStep=null; state.capRun=null; state.capDrill=null; sv.forEach(a=>{ const t=units[a[0]]; if(t){ t.x=a[1];t.y=a[2];t.z=a[3];t.yaw=a[4];t.pan=a[5];t.tilt=a[6];t.label=a[7]; } }); pops.forEach((p,i)=>{ p.up=pops0[i]; }); drones.forEach((dd,i)=>Object.assign(dd,dr0[i])); state.challenge=snap.challenge; state.rangeMode=snap.rangeMode; state.lane=snap.lane; state.zoom=snap.zoom; state.phase=snap.phase; state.hits=snap.hits; state.passed=snap.passed; state.unit=snap.unit; state.mode=snap.mode; state.viewMode=snap.view; state.clock=cl0; state.tick=tk0; if(mg0) state.mag=mg0; state.desig=null; state.tgtSlot={}; state.hiApproved=false; if(state.lobby) state.lobby.phase=ph0; state.qaArmed=q0; state._qaSilent=_s0; rangeReset(); }
    rows.push({id:'THE_LAWN_TRACK_IS_THE_FOIL',ok,note});
  }catch(e){ state._qaSilent=_s0; if(!rows.some(x=>x.id==='THE_LAWN_TRACK_IS_THE_FOIL')) rows.push({id:'THE_LAWN_TRACK_IS_THE_FOIL',ok:false,note:'threw '+String(e).slice(0,100)}); } }, 1775); /* after the r.222 row (1762) */
"""
rep(ANCHOR, ROW + ANCHOR)

# === the invariants ==========================================================================================
if len(re.findall(r'<span>r0\.\d+</span>', s)) != 1: raise SystemExit('REFUSE: the corner is not the only revision span')
for must in ['function foilDraw(', 'function foilWire(', 'function foilSil(', 'function foilAtt(', 'function foilToDeck(', "rows.push({id:'THE_LAWN_TRACK_IS_THE_FOIL',ok,note})", 'state.foilSegs=0;', 'foilDraw(d,c,v,cam,W,H,fw); return;', 'function capPaintScore(']:
    if s.count(must) != 1: raise SystemExit('REFUSE: expected exactly one %r' % must)
if s.count("'THE_LAWN_TRACK_IS_THE_FOIL'") != 4: raise SystemExit('REFUSE: the row id must appear exactly four times (guard, push, catch-guard, catch-push)')
_fd = re.search(r'function foilDraw\(d,c,v,cam,W,H,fw\)\{[\s\S]*?\n\}', s)
if not _fd or '.fill(' in _fd.group(0) or 'fillRect' in _fd.group(0): raise SystemExit('REFUSE: foilDraw must stroke only')
if 'foil-11.111' in s.split('/*FOIL_V*/')[1].split('</script>')[0]: raise SystemExit('REFUSE: the full-scale foil must not be embedded')
if "if(+state.challenge===0) rangeTick(" not in s: raise SystemExit('REFUSE: the frozen range tick call moved')
if "QUAL 40 IS TRAINING \u00b7 ON THE RANGE" not in s: raise SystemExit('REFUSE: the lawn QUAL 40 refusal was removed')
if "('BLU '+(state.blu|0)+' · RED '+(state.red|0))" not in s: raise SystemExit('REFUSE: the Range/else hudScore line was changed')
for i, blk in enumerate(re.findall(r'<script>(.*?)</script>', s, re.S)):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t: t.write(blk); tp = t.name
    r = subprocess.run(['node', '--check', tp], capture_output=True, text=True); os.remove(tp)
    if r.returncode: raise SystemExit('REFUSE: script #%d does not parse: %s' % (i, r.stderr[:300]))

OUT = os.path.join(DECK, 'drone-2525_r.' + NEW_REV + '.html')
open(OUT, 'w', encoding='utf-8').write(s)
print('OK r.%s -> r.%s · %d bytes · sha256 %s · foil V/E/S %d/%d/%d' % (BASE_REV, NEW_REV, len(s.encode('utf-8')), hashlib.sha256(s.encode('utf-8')).hexdigest()[:16], len(WIRE['vertices']), len(WIRE['edges']), NSIL))
