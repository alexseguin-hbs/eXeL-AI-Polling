# Operator ask — 2026-09-24 · Pod PDF: landscape print renders only two pages (verbatim)

> for some reason landscape print renders only 2 slides

Screenshot (iPhone print options for the Pod's Export PDF: Printer none · Range "Pages 1-2" · Paper US Letter · Orientation Landscape ·
Scaling 100 % · Layout 1 page per sheet; page 1 of 2 is the deck cover). File: `docs/asks/2026-09-24_landscape_print_two_pages.png`.

## Reading (Claude Code, before execution)
1. The print stack must paginate to cover + every slide (20 pages) in BOTH orientations on WebKit (iOS Safari) as it does in Chromium:
   each `.slide-print-page` gets an explicit paper-relative size per orientation (print media queries), not only an aspect ratio, and an
   explicit page break before every page after the first — belt and braces, because the sandbox has no WebKit to reproduce.
2. The Chromium PDF gate (`frontend/scripts/pdf-gate.mjs`) proves the page count in both orientations; the iOS result is confirmed by
   the operator's next export (UNVERIFIED from here).
