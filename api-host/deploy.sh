#!/usr/bin/env bash
# Pack backend/ (tracked files only) into bundle/ and deploy the API Worker + Container.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf bundle && mkdir -p bundle
git -C .. archive --format=tar.gz HEAD backend > bundle/backend.tar.gz
echo '{"name":"exel-ai-polling-api","private":true}' > package.json
npx --yes wrangler@4 deploy "$@"
