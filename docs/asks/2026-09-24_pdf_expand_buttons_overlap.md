# Operator ask — 2026-09-24 · the Pod's exported PDF: no misplaced expand buttons; every word legible; sections adjust size (verbatim)

> ensure pdf does not have misplaced expand buttons.
>
> also all words should be legible and not overlap another section (make react if sections can modularly adjust size)

Screenshot (phone, the exported PDF of PRJ-34 S15 "Pre-launch BETA VOC" on the build served at the time — the v0.5 deck): the table's ⤢
expand control prints inside the PDF over the "Pivot / Pursue / Pass" column header; rows of the VOC table run into each other
("Verified authority + recipient trace" / "Assignment ≤ 2 h · unresolved at T+24h…"), and the panel's words collide with the next
section. File: `docs/asks/2026-09-24_pdf_expand_buttons_overlap.png`.

## Reading (Claude Code, before execution)
1. The ⤢ expand control (ChartFrame / table expand) is a screen affordance; it must never print — hidden in the print stack and the PDF export for every slide of every project (a class, `app/SoI-2525/page.tsx`).
2. Legibility law: no cell overflows its panel and no panel overprints its neighbour. Sections adjust to their content: panels size to what they hold, and a body that still exceeds the sheet scales to fit (measured, in React) rather than clipping — the slide-shot harness's OVERFLOW count is the gate.
3. Applies to the Pod template (all 34 projects), not only PRJ-34; separate from the content iterations, which touch only the seed and the master.
