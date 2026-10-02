#!/usr/bin/env bash
# Financial-2525 round door (operator 2026-10-02: 33 rounds of SSSES · 12-AsM AAR · UX test · spiral forward/backward, each
# round fixes the gaps it finds). One revision at a time, never outpacing the deploy (CLAUDE.md).
#
#   scripts/fin-round.sh ship <0.NNN> <commit-message-file>   start the gate→commit→push→Verify Live chain in the background
#   scripts/fin-round.sh wait <0.NNN>                          wait (≤ 9 min per call) and print the state; call again while RUNNING
#   scripts/fin-round.sh wait-live                             wait (≤ 9 min) until Verify Live passes on HEAD; exit 0/1/2 as wait
#   scripts/fin-round.sh live                                  is HEAD LIVE? (Verify Live passed on HEAD)
# Exit of `wait`: 0 = LIVE (shipped and Verify Live passed) · 1 = RED (nothing pushed, or Verify Live failed) · 2 = still running.
# Chain: tsc → financial gates → full test:ci → next build → commit (the message file) → push both refs → prove the remote
# moved → poll Verify Live on the sha. A red gate stops before the commit.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
DIR=/tmp/fin-round; mkdir -p "$DIR"
REPO=alexseguin-hbs/eXeL-AI-Polling
vl(){ curl -s "https://api.github.com/repos/$REPO/actions/workflows/verify-live.yml/runs?head_sha=$1&per_page=5" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: print('UNKNOWN'); sys.exit()
r=d.get('workflow_runs',[])
if not r: print('NONE'); sys.exit()
x=r[0]; print(f\"{x['status']}:{x['conclusion']}:#{x['run_number']}\")" 2>/dev/null; }
case "${1:-}" in
ship)
  REV="$2"; MSG="$3"; ST="$DIR/$REV.status"; LOG="$DIR/$REV.log"
  [ -f "$MSG" ] || { echo "no message file $MSG"; exit 1; }
  echo "RUNNING gates" > "$ST"; : > "$LOG"
  nohup bash "$ROOT/scripts/fin-round-chain.sh" "$ROOT" "$ST" "$LOG" "$MSG" > "$DIR/$REV.nohup" 2>&1 &
  echo "started r.${REV:2} — call: scripts/fin-round.sh wait $REV"
  ;;
wait)
  REV="$2"; ST="$DIR/$REV.status"
  for i in $(seq 1 54); do
    S=$(cat "$ST" 2>/dev/null || echo "NONE")
    case "$S" in LIVE*) echo "$S"; tail -4 "$DIR/$REV.log"; exit 0;; RED*) echo "$S"; tail -40 "$DIR/$REV.log"; exit 1;; NONE) echo "no such round started"; exit 1;; esac
    sleep 10
  done
  echo "STILL $(cat "$ST")"; tail -3 "$DIR/$REV.log"; exit 2
  ;;
wait-live)
  for i in $(seq 1 27); do V=$(vl "$(git rev-parse HEAD)"); case "$V" in completed:success:*) echo "HEAD $(git rev-parse --short HEAD) LIVE $V"; exit 0;; completed:*) echo "HEAD $(git rev-parse --short HEAD) RED $V"; exit 1;; esac; sleep 20; done
  echo "HEAD $(git rev-parse --short HEAD) STILL $V"; exit 2
  ;;
live)
  V=$(vl "$(git rev-parse HEAD)"); echo "HEAD $(git rev-parse --short HEAD) Verify Live $V"; case "$V" in completed:success:*) exit 0;; *) exit 1;; esac
  ;;
*) sed -n 2,12p "$0"; exit 2;;
esac
