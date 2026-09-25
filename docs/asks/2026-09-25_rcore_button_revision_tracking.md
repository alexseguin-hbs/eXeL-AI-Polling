# Operator ask — 2026-09-25 (R-CORE button: revision tracking on every 2525 domain)

> Also, check that we have R-CORE BUTTON to expand revision tracking for:
> Drone-2525
> SoI-2525
> Manta-2525
> Security-2525
> similar to how we do in Vision-2525 attached in image 3-5 as an example

Supplied assets (the R-CORE logo, for the button):
- docs/r-core/logo/r-core-icon.png — the cyan targeting-reticle-with-orb R-CORE mark.
- docs/r-core/logo/r-core-wordmark.jpg — the "⊕ R-CORE" wordmark (icon + R-CORE text, rounded neon frame).

Reference — Vision-2525's revision tracking (what to mirror):
- docs/asks/2026-09-25_rcore_ref_vision_cover.png — Vision-2525 white paper cover, header shows v.19 r1.016
  with a version SLIDER, "White paper" reading mode, download, and JUMP · TOC · §0…§5.
- docs/asks/2026-09-25_rcore_ref_whatchanged.png — the "WHAT CHANGED — v.01 r0.001 → v.19 r1.016" overlay:
  Before/After version sliders, "vs previous" / "v1 vs latest", added/revised/carried counts, "287 releases
  crossed", and a KEY IMPROVEMENTS list with per-item level tags (L5).
- docs/asks/2026-09-25_rcore_ref_settings.png — the Settings slide-over: SHARE (QR), EXECUTIVE SUMMARY,
  READING (Dark ground), and AUDIT TRAIL = Highlight changes · Outline · Ledger · Determinism proof · Registers,
  plus ABOUT (Architecture & release).

The ask: each of the four domain surfaces (Drone-2525, SoI-2525, Manta-2525, Security-2525) gets an R-CORE
button (branded with the logo) that expands its revision tracking — the same audit-trail affordances Vision-2525
offers (What Changed diff across revisions, the ledger, determinism/replay proof, registers), reading each
domain's own revision record (Drone-2525's REVISIONS.md/ledger, SoI-2525's slide/polling versions + DRS ledger,
Manta/Security's own). FIRST check what each already has; ADD the R-CORE button where missing; keep it uniform.

## Refinement (operator 2026-09-25) — the interaction, exactly
> Smaller logo is in bottom center of all Innovation 2525 projects. When clicked, R-CORE with icon pops up,
> and when clicked again we are taken to version history and compare tool.

A two-stage badge (mirrors the existing Powered Badge pattern), on EVERY Innovation 2525 project surface:
1. REST: a SMALL R-CORE reticle icon (docs/r-core/logo/r-core-icon.png), fixed at the BOTTOM CENTRE of the
   screen — unobtrusive, like the powered badge.
2. CLICK 1: it pops up / expands to the "⊕ R-CORE" wordmark pill (icon + R-CORE label,
   docs/r-core/logo/r-core-wordmark.jpg) — a labelled affordance.
3. CLICK 2: opens that domain's VERSION HISTORY + COMPARE TOOL — the revision tracking (What Changed between two
   revisions, the ledger / audit trail), reading the domain's own revision record, in the Vision-2525 style.
"All Innovation 2525 projects" = every 2525 domain surface (Drone-2525, SoI-2525, Manta-2525, Security-2525, and
the others of the family — Architect-2525, Celestial-2525 — kept uniform).

## Extension (operator 2026-09-25) — Settings + easter-egg menu too
> great, lets do for settings and easter egg menu as well (so we can see evolution for traceability as we add
> more features).

The R-CORE badge + version-history/compare tool is not only for the domain projects — it also goes on:
- the SETTINGS panel (the shared Settings slide-over — moderator-settings.tsx / the settings surface), and
- the EASTER-EGG MENU (the powered-badge unlock → Cube 10 SIM / the /sim console).
Each of these surfaces gets its OWN append-only revision ledger (seeded from its current state + recent changes)
so, as we add more features, the evolution of Settings and the easter-egg menu is itself traceable through the
same R-CORE compare tool — "in the spirit of R-CORE and Vision-2525: one method, per surface, its own history."
So the R-CORE record becomes the traceability substrate for every surface we build, not just the projects.
