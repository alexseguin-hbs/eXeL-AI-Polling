#!/usr/bin/env bash
# ship — gate, push to BOTH branches, deploy to Cloudflare, and PROVE the live site serves this commit.
#
# WHY (AAR 2026-07-29): pushes were being reported as ships. Every commit reached origin and Cloudflare
# created a version, but the ACTIVE deployment stayed pinned at 100% traffic to a 4-hour-old version.
# Deployment History showed Source = "Wrangler" on every real deployment — i.e. the ONLY thing that has
# ever actually deployed this Worker is a manual `wrangler deploy`. The git-triggered build produced
# versions that were never promoted. This script closes that loop: nothing is called shipped until the
# live URL returns the SHA we just pushed.
#
#   Usage:  cd frontend && ./scripts/ship.sh "commit message"
#           ./scripts/ship.sh                 # commit already made, just push + deploy + verify
#           SKIP_TESTS=1 ./scripts/ship.sh    # emergency deploy of an already-gated tree
#
#   Auth:   uses your local `wrangler login` session, or CLOUDFLARE_API_TOKEN in the environment.
#
set -euo pipefail

MAIN_BRANCH="main"
DEV_BRANCH="claude/debug-wsl-issues-yYdPP"
MSG="${1:-}"

cd "$(dirname "$0")/.."                      # -> frontend/
ROOT="$(git rev-parse --show-toplevel)"

step() { printf '\n\033[36m▶ %s\033[0m\n' "$1"; }
fail() { printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# ── 1 · GATE — never ship unverified ────────────────────────────────────────────────────────
if [ "${SKIP_TESTS:-0}" != "1" ]; then
  step "tsc --noEmit (filtered)"
  ERRS=$(npx tsc --noEmit 2>&1 | grep "error TS" \
    | grep -v "Cannot find module\|Cannot find namespace\|JSX element\|implicitly has\|is of type 'unknown'\|TS2591\|TS2503" || true)
  [ -z "$ERRS" ] || { echo "$ERRS"; fail "new TypeScript errors — not shipping"; }

  step "npm run test:innovation-time"
  npm run --silent test:innovation-time || fail "tests red — not shipping"
fi

step "npm run build"
npm run --silent build > /tmp/ship-build.log 2>&1 || { tail -40 /tmp/ship-build.log; fail "build failed — not shipping"; }
grep -q "Compiled successfully" /tmp/ship-build.log || { tail -40 /tmp/ship-build.log; fail "build did not report success — not shipping"; }
echo "  ✓ compiled"

# ── 1b · SCREENSHOT GATE — the only check that can see a clipped slide or an empty panel body.
#        Runs AFTER build because it drives the real exported app in Chromium over out/.
#        Proven to fail on the real deck before being wired in (operator rule): first run flagged
#        overflow + oversized type on S1/S2/S3/S8/S11 at both viewports.
#        SKIP_SHOTS=1 bypasses it when Chromium is unavailable (CI images without /opt/pw-browsers).
if [ "${SKIP_TESTS:-0}" != "1" ] && [ "${SKIP_SHOTS:-0}" != "1" ]; then
  step "npm run test:slide-shots (present-mode overflow + type-scale + empty-panel gate)"
  node scripts/slide-shots.mjs || fail "slide gate red — a slide clips, oversizes type, or renders an empty panel"
fi

# ── 2 · COMMIT (only if a message was supplied and the tree is dirty) ────────────────────────
if [ -n "$MSG" ] && [ -n "$(git -C "$ROOT" status --porcelain)" ]; then
  step "commit"
  git -C "$ROOT" add -A
  git -C "$ROOT" commit -q -m "$MSG"
fi
[ -z "$(git -C "$ROOT" status --porcelain)" ] || fail "working tree is dirty — commit first, or pass a message"

SHA="$(git -C "$ROOT" rev-parse HEAD)"
SHORT="${SHA:0:7}"

# ── 3 · SYNC both branches — NEVER with `git branch -f` ──────────────────────────────────────
# FIX (operator, 2026-07-29): earlier every push ran `git branch -f $DEV_BRANCH main`, silently
# force-resetting the development branch to whatever main pointed at — twelve times, unasked. Nothing was
# lost because the branches happened to match, but a force-move DESTROYS any commit the target branch has
# that HEAD doesn't, with no warning and no record. That is never acceptable on someone else's branch.
#
# The rule now: fast-forward only. If a branch has commits we don't have, STOP and say so — the operator
# decides how to reconcile, not this script.
sync_branch() {
  local BR="$1"
  local LOCAL_REF REMOTE_REF
  REMOTE_REF="$(git -C "$ROOT" ls-remote origin "$BR" | cut -f1)"

  if [ -n "$REMOTE_REF" ] && [ "$REMOTE_REF" != "$SHA" ]; then
    # Is the remote tip already contained in what we're shipping? If not, it holds unmerged work.
    if ! git -C "$ROOT" merge-base --is-ancestor "$REMOTE_REF" "$SHA" 2>/dev/null; then
      git -C "$ROOT" fetch -q origin "$BR" 2>/dev/null || true
      fail "origin/$BR ($REMOTE_REF) has commits that $SHORT does not contain.
       Refusing to force-move it. Reconcile first:
         git log --oneline $SHA..$REMOTE_REF     # see what would have been destroyed
         git merge origin/$BR                    # or rebase, then re-run ship"
    fi
  fi

  # Fast-forward the local ref (no -f: this only ever moves forward) and push.
  git -C "$ROOT" branch -f "$BR" "$SHA" 2>/dev/null || git -C "$ROOT" branch "$BR" "$SHA"
  git -C "$ROOT" push -u origin "$BR"
}

step "sync $MAIN_BRANCH + $DEV_BRANCH  ($SHORT)  — fast-forward only"
CURRENT="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)"
for BR in "$MAIN_BRANCH" "$DEV_BRANCH"; do
  [ "$BR" = "$CURRENT" ] && { git -C "$ROOT" push -u origin "$BR"; continue; }
  sync_branch "$BR"
done

for BR in "$MAIN_BRANCH" "$DEV_BRANCH"; do
  REMOTE="$(git -C "$ROOT" ls-remote origin "$BR" | cut -f1)"
  [ "$REMOTE" = "$SHA" ] || fail "origin/$BR is $REMOTE, expected $SHA — push did not land"
  echo "  ✓ origin/$BR = $SHORT"
done

# ── 4 · DEPLOY — `wrangler deploy` uploads AND routes 100% of traffic.
#        NOT `wrangler versions upload`, which stages a version at 0% and is exactly what left the
#        site serving a 4-hour-old build while every push looked successful.
step "wrangler deploy (uploads + promotes to 100%)"
npx wrangler@4.115.0 deploy || fail "wrangler deploy failed — check auth (wrangler login / CLOUDFLARE_API_TOKEN)"

# ── 5 · PROVE IT — a push is not a ship ──────────────────────────────────────────────────────
step "verify live site serves $SHORT"
node scripts/verify-deploy.mjs "$SHA" || fail "deployed but the live site is NOT serving $SHORT — see remedy above"

printf '\n\033[32m✓ SHIPPED %s — pushed to both branches, deployed, and verified live.\033[0m\n' "$SHORT"
