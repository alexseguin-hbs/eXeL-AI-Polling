# R-CORE badge — use the provided icons EXACTLY as-is (operator 2026-09-25)

## Verbatim ask
> for Rastor of tracking of all privded icons as is, just use icons provided exactly as is. image 4-5 are not

## Reading
For the R-CORE revision-tracking badge, render the operator's supplied raster artwork **exactly as-is** — do
not recreate it from CSS/glyphs/text. Five images were attached; images 4–5 are NOT icons (they are iPhone
screenshots of the current SoI-2525 deck showing where the badge renders — the bottom-centre reticle and the
`⊕ R-CORE` pill), so they are reference only.

The three icon assets (already in the repo, matching the uploads byte-for-dimension):
- **Image 1** `7a26ec17-image.png` (1448×1086) = the framed reticle — the **REST** icon
  → `frontend/public/r-core/r-core-icon.png` (already exactly this).
- **Image 2** `c4ae9c70-image.jpg` (2172×724) = the `R-CORE` wordmark pill (JPG)
  → `frontend/public/r-core/r-core-wordmark.jpg` (already exactly this).
- **Image 3** `06cc686a-image.png` (2172×724) = the `R-CORE` wordmark pill (PNG, preferred)
  → add as `frontend/public/r-core/r-core-wordmark.png`.

## The defect being fixed
`frontend/components/2525-core/rcore-badge.tsx` did NOT use the artwork as-is:
- REST stuffed the reticle into a 22px bordered/blurred circle (its own frame competing with the icon's frame).
- The expanded PILL was built from a `⊕` glyph + `t("rcore.brand")` TEXT + an 18px icon — NOT the supplied
  `R-CORE` wordmark raster.

## The change (one component, shared across every surface)
Rewrite the badge to show the rasters exactly:
- REST (stage 0): `<img src="/r-core/r-core-icon.png">` shown as-is (height ~42px, natural width), in a
  transparent, borderless button (no competing circle/border/bg); keep hover-scale + focus ring + aria-label.
- PILL (stage 1): `<img src="/r-core/r-core-wordmark.png">` shown as-is (height ~42px, natural width), in a
  transparent borderless button; remove the `⊕` glyph and the text span. alt/aria carry "R-CORE".
- CLICK 2 still opens `RCoreRevisionPanel` unchanged.
The icon is the operator's fixed cyan artwork on every surface (the per-surface `accent` still colours the
compare panel, not the badge artwork — "exactly as is" wins over per-surface tinting).

## Timing / safety
Applied only AFTER round 99 (rev 0.105, FULL) of the 99-programme lands — round 99 runs `next build` over the
shared working tree, so a concurrent edit to the compiled component could redden the final round. The icon fix
is its own commit (badge component + the new wordmark PNG), gated (tsc + next build) and pushed to both refs,
before the per-slide S1→S19 pass launches.
