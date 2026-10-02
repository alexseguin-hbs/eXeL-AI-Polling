#!/usr/bin/env bash
# The background half of scripts/fin-round.sh ship: gates → commit → push both refs → Verify Live. Writes its state to $ST.
set -u
ROOT="$1"; ST="$2"; LOG="$3"; MSG="$4"
REPO=alexseguin-hbs/eXeL-AI-Polling
step(){ echo "RUNNING $1" > "$ST"; echo "== $1 $(date -u +%T)" >> "$LOG"; }
red(){ echo "RED $1" > "$ST"; echo "RED $1" >> "$LOG"; exit 1; }
cd "$ROOT/frontend"
step tsc
E=$(npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "Cannot find module\|Cannot find namespace\|JSX element\|implicitly has\|is of type 'unknown'\|TS2591\|TS2503" | head -8)
[ -n "$E" ] && { echo "$E" >> "$LOG"; red tsc; }
step render; (cd "$ROOT" && node scripts/financial-render.mjs --check) >> "$LOG" 2>&1 || red render
step test:ci; npm run -s test:ci > "$LOG.ci" 2>&1 || { grep -n "FAIL\|failed\|Error" "$LOG.ci" | grep -v " 0 failed" | tail -25 >> "$LOG"; red test:ci; }
step build; npm run -s build > "$LOG.build" 2>&1 || { tail -25 "$LOG.build" >> "$LOG"; red build; }
cd "$ROOT"
step commit
exec 9>/tmp/git.lock; flock 9
git add -A docs/financial-2525 docs/traceability/financial-2525.ledger.json frontend/components/financial-2525 frontend/lib/financial-2525 \
  frontend/lib/2525-core/financial-ledger.gen.ts frontend/tests frontend/lib/lexicon-data.ts frontend/scripts/fin-*.mjs \
  frontend/lib/planet-ltu.ts frontend/lib/supabase.ts docs/asks scripts/fin-round*.sh scripts/fin-round-record.mjs scripts/financial-render.mjs 2>/dev/null
git diff --cached --quiet && red "nothing staged"
git commit -q -F "$MSG" || red commit
step push
git push -q origin HEAD:claude/debug-wsl-issues-yYdPP HEAD:main || red push
SHA=$(git rev-parse HEAD); S7=${SHA:0:7}
R1=$(git ls-remote origin refs/heads/main | cut -c1-40); R2=$(git ls-remote origin refs/heads/claude/debug-wsl-issues-yYdPP | cut -c1-40)
[ "$R1" = "$SHA" ] && [ "$R2" = "$SHA" ] || red "push (remote did not move)"
flock -u 9
echo "PUSHED $S7" >> "$LOG"
for i in $(seq 1 90); do
  echo "RUNNING verify-live $S7" > "$ST"
  V=$(curl -s "https://api.github.com/repos/$REPO/actions/workflows/verify-live.yml/runs?head_sha=$SHA&per_page=5" | python3 -c '
import sys,json
try: d=json.load(sys.stdin)
except Exception: print("UNKNOWN"); sys.exit()
r=d.get("workflow_runs",[])
print("%s:%s:#%s" % (r[0]["status"], r[0]["conclusion"], r[0]["run_number"]) if r else "NONE")' 2>/dev/null)
  case "$V" in
    completed:success:*) echo "LIVE $S7 ${V##*:}" > "$ST"; echo "LIVE $S7 Verify Live ${V##*:}" >> "$LOG"; exit 0;;
    completed:*) echo "RED verify-live $S7 $V" > "$ST"; echo "RED verify-live $V" >> "$LOG"; exit 1;;
  esac
  sleep 20
done
echo "RED verify-live timeout $S7" > "$ST"
