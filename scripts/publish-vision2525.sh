#!/usr/bin/env bash
# Publish the Vision 2525 living document to every place it is meant to appear.
# One command, three destinations, byte-identical or it fails loudly.
# The "wrong file delivered" defect happened once. This is why it cannot recur.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="docs/SOI_VISION2525_LIVING_DOCUMENT.html"          # source of truth
DATED="docs/VISION2525_LIVING_LEDGER_2026.08.04.html"   # the delivered file
SERVED="frontend/public/whitepaper/vision-2525.html"     # /vision-2525/white-paper redirects here — no iframe
# r143 · the DOWNLOAD copy. Same bytes, but served from its own path so _headers can
# put Content-Disposition: attachment on it. That is what makes the link save an HTML
# document on every browser, instead of relying on the download attribute — which iOS
# Safari and every cross-origin case quietly ignore. The name is the delivered name, so
# what lands in the reader's Downloads folder is what the operator asked to be sent.
DL="frontend/public/whitepaper/SOI_VISION2525_v.19_LIVING_DOCUMENT.html"
# NOT under public/vision-2525/ — that directory shadows the /vision-2525 route, and with
# trailingSlash:true a request for a file inside it does not resolve.

[ -f "$SRC" ] || { echo "FAIL: $SRC missing"; exit 1; }
mkdir -p "$(dirname "$SERVED")"
cp "$SRC" "$DATED"
cp "$SRC" "$SERVED"
cp "$SRC" "$DL"

fail=0
for f in "$DATED" "$SERVED" "$DL"; do
  if cmp -s "$SRC" "$f"; then echo "  ok   $f"; else echo "  FAIL $f differs from $SRC"; fail=1; fi
done
[ "$fail" -eq 0 ] || { echo "PUBLISH FAILED — copies are not identical"; exit 1; }

# The document must never carry a credential to a public path.
if grep -q "00086615" "$SRC"; then echo "PUBLISH BLOCKED — credential present in $SRC"; exit 1; fi

# r259 · Sofia D4 (fleet-48): the 32 language pages used to reach public/whitepaper by
# unscripted hand-copy — no byte-check, no credential scan. Now the same ritual that
# publishes English publishes every built language: copy, cmp, scan, or fail loudly.
LBUILT=0
VNN="$(basename "$DL" | sed 's/^SOI_VISION2525_\(v\.[0-9]*\)_.*$/\1/')"   # one version source: the DL name
for f in docs/i18n/build/SOI_VISION2525_"$VNN"_*.html; do
  [ -f "$f" ] || continue
  lc="$(basename "$f" .html)"; lc="${lc##*_}"
  [ "$lc" = "en" ] && continue                      # English is the canonical 4-copy set above
  dest="frontend/public/whitepaper/vision-2525.${lc}.html"
  if grep -q "00086615" "$f"; then echo "PUBLISH BLOCKED — credential present in $f"; exit 1; fi
  cp "$f" "$dest"
  cmp -s "$f" "$dest" || { echo "PUBLISH FAILED — $dest differs from its build"; exit 1; }
  LBUILT=$((LBUILT+1))
done
[ "$LBUILT" -gt 0 ] && echo "  ok   $LBUILT language pages copied + byte-verified + scanned"

echo "PUBLISH OK — $(wc -c < "$SRC") bytes, 4 identical copies"
echo "  sha256 $(sha256sum "$SRC" | cut -c1-16)  — the same bytes at every destination"
echo "  read     /whitepaper/vision-2525.html   (/vision-2525/white-paper redirects here — no iframe, no login)"
echo "  download /whitepaper/SOI_VISION2525_v.19_LIVING_DOCUMENT.html  (Content-Disposition: attachment via _headers)"
