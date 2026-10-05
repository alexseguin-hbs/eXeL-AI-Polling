# Claude Code notes · r.162 (2026-10-05)

**Ask (Addendum 13, verbatim):** "On qual, add timer and have red yellow green light on right vertical, with Red, Yellow, green as time to next set of
targets (1 second per each light). if 3 targets are up, 3 seconds per target (thats 9 second for group), so Red light should indicate at 7, yellow at 8,
and green at 9 (if that's the qual actual time sequence)."

## What a player meets differently
- QUAL · 40: the light on the right stands vertical — red top, yellow middle, green bottom.
- In the last three seconds of each group: red (2 s left), yellow (1 s left), green (time — the next set is coming; green holds 1 s).
- Under the lamps, a timer: "12 S" counting down while a group is up; "NEXT 3 S" while the targets are down.
- Training modes: unchanged (green while targets stand, no timer).

## Addendum 14 — the mark is remembered (verbatim: "system forgets target was targeted or approved, having to recreate 3 step process to fire each time")
Cause: a HIT cleared the mark and slot; the training tick released the box again when the target finished falling. In TRAIN UP the target
returns 3 s later, so the mark and approval now stay: F fires again as soon as it stands; F while it is down holds (no round, no release). The mark
ends on RESTART, a lane or mode change, or a new mark. TRAIN DOWN (target stays down) and QUAL (each target once per engagement) unchanged.
QA `MARK_SURVIVES_THE_RETURN`: hit · still red · F while down holds with no round · back up still red · second hit.

## Addendum 15 — mark many, approve each, fire only approved (verbatim: "If something is marked Target, it stays target.  I should be able to
target all 3-4 or all pop ups, then go to each one to approve, system remembers.  I can only shoot targets approved.")
Solo, TRAIN UP and QUAL 40: any number of marks; TARGET on a marked target focuses it; APPROVE and FIRE act on the mark under the bullseye; only red fires;
a mark outlives its target going down. TRAIN DOWN ends only the hit target's mark. A room keeps per-shot approval (unchanged). QA `MARKS_ARE_REMEMBERED`:
three marked · two approved, one amber · approved hit · amber refused, no round · second approved hit · marks kept · TRAIN DOWN hit mark gone, other red ·
QUAL mark outlives the group. Eleven older rows re-pointed (named in REVISIONS.md).

## Addendum 16 — direction (not built): the team marks and approves as H.I., then fires together on best time; then AI marks with HI approval, timed.

## Addendum 17 — R reloads (verbatim: "also add R for reload on PC computer.")
R is the RELOAD button, through focus. QA `KEY_R_RELOADS`.

## Timing — stated, not assumed
The program of record (the operator's IWQ Table VI paste, 2026-09-23) keeps 1 = 5 s · 2 = 8 s · 3 = 12 s · 4 = 16 s. Three targets therefore light
red 10 · yellow 11 · green 12. The operator's "3 s per target" (9 s for three) is his call; switching it is one table change (EXPOSURE_BY_COUNT).

## Gates
QA `QUAL_LIGHT_LAST_THREE_SECONDS` (red 10 · yellow 11 · green 12 · dark from 0 on engagement 4), `QUAL_TIMER_COUNTS` ("12 S"; "NEXT 3 S");
`START_LIGHT_SEQUENCE` re-pointed (O → R → Y → G …, the phase rest opens green then dark); `START_LIGHT_CLEAR` still clear at 390×844 (43×75 px).

## Corrections
r.161's artefact commit is `0b45687` (the af6b541 cited was rewritten by the sync before push); r.161 shipped `cafdd9f`, LIVE in Verify Live #2477.
