# Operator ask — 2026-09-30 · R-CORE badge: centred, the single icon only on a tap, a maximize ↔ minimize toggle

> (operator 2026-09-30 17:53 CST, verbatim — with his phone screenshot of the open R-CORE Version History panel on
> Financial-2525: the lone reticle icon at the left of the header, the R-CORE wordmark pill beside it, "Version History ·
> Financial-2525 …" beneath, the download and close buttons at the right; below it the r7 → r23 compare — saved beside this
> file as `2026-09-30_rcore_badge_toggle_centered.png`)
>
> R-CORE works; center R-Core icon and text on center and dont show single R-CORE icon
>
> Instead; have where R-CORE IS clicked, single Icon appears, then of clicked again, disappears in same way maximize shrinks to minimize

## Reading (to be confirmed by the plan)

1. **The bottom badge no longer opens on the lone icon.** Today (`components/2525-core/rcore-badge.tsx`) the page's last
   child is the single reticle icon; one tap swaps it for the R-CORE wordmark; a second tap opens the panel. The operator:
   do not show the single icon by itself — show **R-CORE** (the logo + word art) centred; tapping R-CORE makes the single icon
   appear; tapping R-CORE again makes it disappear — a **toggle**, the way maximize shrinks back to minimize — and the icon,
   when shown, is what opens the Version History panel (the close × shrinks it back).
2. **Centred.** The R-CORE icon and its text sit on the page's centre line — the bottom badge, and the panel header's
   wordmark + "Version History · <surface> · N rev" line (the download and close buttons keep the right edge).
3. **One shared component, every 2525 surface** (Financial · Drone · SoI · Security · Architect · Manta · Celestial) —
   the badge and the panel are shared, so the change lands everywhere at once; the badge gate
   (`tests/rcore-*.test.mjs`) is re-pointed to the toggle, not deleted.
