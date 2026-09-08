# Operator ask — 2026-09-08 ~18:30 UTC (13:30 CST)

> when text or date or signature, I want to move that only, but PDF MOVES at same time. Fix

Cause: marks were pointer-events-none, so the finger touched the canvas whose touch-action allows panning — the browser scrolled the page while the drag moved the mark. Fix: the mark receives the touch with touch-action none.
