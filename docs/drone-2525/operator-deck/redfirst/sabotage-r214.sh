#!/usr/bin/env bash
# r.214 red-first BY SABOTAGE, run against the bytes the ship commit carries.
# r.213's red-first was faulted by the SSSES spiral-backward lens on two counts: it was measured on pre-bookkeeping
# bytes, and the script was never committed. Both are answered here — this file ships beside redfirst/r214.md and
# its sha is in HASHES_r214.sha256, and the chain runs it AFTER the bookkeeping.
# Usage: sabotage-r214.sh <deck html> <probe.mjs> <frontend dir>
set -u
DECK=${1:?deck html}; PROBE=${2:?probe}; FE=${3:?frontend}
T=$(mktemp -d); mkdir -p $T/pub/drone-2525
ROWS="MOUSE_LOOK_LEAVES_NO_TRACE MOUSELOOK_LEAVES_THE_TOUCH_PATH_ALONE MOUSELOOK_TURNS_THE_HEAD_LIKE_THE_ARROWS MOUSELOOK_CLICKS_ARE_FIRE_AND_TARGET"
run(){ echo; echo "######## $1"; shift
  cp "$DECK" $T/pub/drone-2525/play.html
  python3 - "$T/pub/drone-2525/play.html" "$1" "$2" <<'PY'
import sys
p,old,new=sys.argv[1],sys.argv[2],sys.argv[3]
s=open(p,encoding='utf-8').read()
assert s.count(old)==1, 'anchor x%d'%s.count(old)
open(p,'w',encoding='utf-8').write(s.replace(old,new))
PY
  (cd "$FE" && PUB=$T/pub node "$PROBE" $ROWS 2>&1 | grep -E "^rows:|^(PASS|FAIL)  "); }

run "S1 · the mouse-only guard is removed from the captured pointerdown — a finger fires again" \
  "window.addEventListener('pointerdown',function(e){ if(!lookActive()||!mouseOnly(e)) return;" \
  "window.addEventListener('pointerdown',function(e){ if(!lookActive()) return;"
run "S2 · the swallowed pointerup stops finishing the canvas path's cleanup — the drag is stranded" \
  "if(e.type==='pointerup'){ state.drag=null; state.pinch=null; try{ delete state.ptrs[e.pointerId]; }catch(_){ } }" \
  ""
run "S3 · lookToggle stops asking which screen owns the glass" \
  "    if(own){ toast('CLOSE '+own+' FIRST · THEN PRESS M'); return false; } }" \
  "    if(false){ toast('CLOSE '+own+' FIRST · THEN PRESS M'); return false; } }"
run "S4 · one row goes back to serialising the document for itself" \
  "      const src1=QA_SRC;" \
  "      const src1=document.documentElement.innerHTML;"
run "S5 · the key-repeat guard is removed — a held M is a burst of toggles" \
  "if(e.code==='KeyM'&&!e.repeat){e.preventDefault();lookToggle();}" \
  "if(e.code==='KeyM'){e.preventDefault();lookToggle();}"
rm -rf $T
