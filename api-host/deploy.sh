#!/usr/bin/env bash
# Pack backend/ (tracked files only) into bundle/ and deploy the API Worker + Container.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf bundle && mkdir -p bundle
git -C .. archive --format=tar.gz HEAD backend > bundle/backend.tar.gz
echo '{"name":"exel-ai-polling-api","private":true}' > package.json
npx --yes wrangler@4 deploy "$@"
# Asset propagation can lag the deploy; containers booting meanwhile would pull a stale backend. Wait until the
# served bundle matches what we just packed (needs BUNDLE_TOKEN_FILE; skipped otherwise).
if [[ -n "${BUNDLE_TOKEN_FILE:-}" ]]; then
  want=$(sha256sum bundle/backend.tar.gz | cut -d' ' -f1)
  for i in $(seq 1 30); do
    got=$(curl -s -A exel-deploy -H "x-bundle-token: $(cat "$BUNDLE_TOKEN_FILE")" "${BACKEND_URL:-https://exel-ai-polling-api.explore-096.workers.dev}/__bundle/backend.tar.gz" | sha256sum | cut -d' ' -f1)
    [[ "$got" == "$want" ]] && { echo "bundle live ($want)"; exit 0; }
    sleep 10
  done
  echo "WARNING: served bundle still stale after 300s" >&2; exit 1
fi
