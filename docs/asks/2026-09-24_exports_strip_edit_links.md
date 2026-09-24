# Operator ask — 2026-09-24 (PRJ-34 deck exports: no edit / system-interaction links)

> Edit financial and other system interactions in exports need to be removed. on SoI-2525, these links
> can be active.

Reference: a phone screenshot of the exported deck (PRJ-34_S1-S19, S3 Financial · Return) showing panel
headers "$ RETURN PROFILE · ✎ EDIT FINANCIALS" and "$ REVENUE + MARGIN BY YEAR · ✎ EDIT FINANCIALS".

The rule:
- In the EXPORT (PDF print + the self-contained HTML) every edit / source / system-interaction affordance is
  removed: the "✎ EDIT FINANCIALS" (and every "· ✎ <source>") edit label, the SourceLink jump-links, the ⤢
  maximize buttons, the L1/L2/L3 tabs, and any "Edit source" control. The exported deck is a clean static
  document a founder / investor reads, with nothing that looks clickable but is dead.
- In the LIVE SoI-2525 app these links stay ACTIVE (edit financials, jump to source, maximize, switch level).
- Mechanism (fix the class): every such affordance is either a <button> or carries [data-noprint]; the print
  CSS and exportDeckHtml already drop both, so the export is clean by construction and the live app is unchanged.

Screenshot: docs/asks/2026-09-24_exports_strip_edit_links.png
