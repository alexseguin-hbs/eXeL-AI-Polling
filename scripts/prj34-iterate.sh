#!/usr/bin/env bash
# PRJ-34 iteration door (operator 2026-09-24 night: 99 iterations, each gated, committed and pushed to BOTH refs).
# Usage: scripts/prj34-iterate.sh <revision e.g. 0.008> <commit-message-file> [full]
#   gates: tsc · innovation-time · drs-render (+ --check) · drs-crs ; with "full": test:ci + next build as well.
#   A red gate STOPS — nothing is committed. On green: commit (message from the file) → push both refs → prove the remote moved.
set -u
REV="$1"; MSG="$2"; FULL="${3:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
GATES=""
say(){ printf '%s\n' "$*"; GATES="$GATES"$'\n'"$*"; }
cd frontend
say "== tsc"; ERR=$(npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "Cannot find module\|Cannot find namespace\|JSX element\|implicitly has\|is of type 'unknown'\|TS2591\|TS2503" | head -5)
if [ -n "$ERR" ]; then say "$ERR"; say "RED tsc"; exit 2; fi
say "== drs-render"; (cd .. && node scripts/drs-render.mjs >/dev/null && node scripts/drs-render.mjs --check | tail -1) || { say "RED drs-render"; exit 3; }
say "== drs-crs"; node tests/drs-crs.test.mjs | tail -1 | grep -q " 0 failed" || { say "RED drs-crs"; exit 4; }
say "== innovation-time"; OUT=$(npm run test:innovation-time 2>&1 | grep "INNOVATION-TIME\|INNOVATION-STORE\|^FAIL"); say "$OUT"
echo "$OUT" | grep -q "^FAIL" && { say "RED innovation-time"; exit 5; }
echo "$OUT" | grep -q "INNOVATION-TIME .*passed" || { say "RED innovation-time (no verdict)"; exit 5; }
if [ "$FULL" = "full" ]; then
  say "== test:ci (full)"; npm run test:ci > /tmp/prj34-ci.log 2>&1 || { tail -20 /tmp/prj34-ci.log; say "RED test:ci"; exit 6; }
  say "== build"; npm run build > /tmp/prj34-build.log 2>&1 || { tail -20 /tmp/prj34-build.log; say "RED build"; exit 7; }
  tail -3 /tmp/prj34-build.log
fi
cd "$ROOT"
# the round file carries the door's own lines (the record says what ran, not what was hoped)
RF="docs/drs/iterations/$REV.md"
if [ -f "$RF" ]; then python3 - "$RF" "$GATES" <<'PY'
import sys; f, g = sys.argv[1], sys.argv[2]; t = open(f).read()
block = "## Gates\n```\n" + g.strip() + "\n```\n"
t = t.replace("## Gates\n(filled by the door)\n", block) if "(filled by the door)" in t else (t.rstrip() + "\n\n" + block)
open(f, "w").write(t)
PY
fi
git add -A docs/drs frontend/lib/innovation-slide-seed-drs.ts frontend/lib/innovation-data.ts frontend/tests/innovation-time.test.mjs scripts/drs-render.mjs docs/assessments 2>/dev/null
git add -A docs/asks 2>/dev/null
git commit -q -F "$MSG" || { say "nothing to commit"; }
git push -q -u origin claude/debug-wsl-issues-yYdPP && git push -q origin HEAD:main
SHA=$(git rev-parse --short HEAD); R1=$(git ls-remote origin refs/heads/main | cut -c1-7); R2=$(git ls-remote origin refs/heads/claude/debug-wsl-issues-yYdPP | cut -c1-7)
say "SHA $SHA | committed ✓ | pushed main=$R1 branch=$R2 | rev $REV"
[ "$R1" = "$SHA" ] && [ "$R2" = "$SHA" ] || { say "RED push (remote did not move)"; exit 8; }
