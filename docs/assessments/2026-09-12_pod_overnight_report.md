# Overnight report — the pod, 2026-09-12 (night)

> gotta sleep; update and spiral and assess and test overnight fixing discrepancies as you go

Three instructions were persisted first (`docs/asks/2026-09-12_pod_simple_ux_and_asm_simulation.md`, commit 254ef2e,
sha256 `a7a6088a96e64a11`), then executed as three tracks and three spiral rounds. Every change was committed and
pushed to both refs as it landed; Verify Live ran green for every commit on `main` up to and including 32cde38
(the round-3 run for 8b3a53d was still in progress when this report was written).

**Correction.** The first version of this report said round 3's `test:ci` had passed. It had not: the run had been
started from the wrong directory and never ran; the real run failed on `sign-i18n` (Spanish must cover every
`soi.pod.*` key — 92 new keys had none). Spanish was written (fed42ae) and that gate is green; the 31-language gate
(`sign-i18n-all`) needed a translation pass, recorded in the closing section: done, 2,852 entries, both gates green, `test:ci` rerun at the end of this report's commit. `next build` exit 0 at 8b3a53d is real.

## What you will find when you wake

| | Where |
|---|---|
| The pod, guided (DocuSign as the model) | https://exel-ai-polling.explore-096.workers.dev/soi-session |
| Walkthrough — three phones, default inputs | https://claude.ai/code/artifact/7daad6c6-a8f5-454e-bd49-8053199767e3 (`docs/feedback/POD_Walkthrough_3_Users_2026.09.12.html`) |
| Walkthrough — the advised members (four reviewers per seat) | https://claude.ai/code/artifact/3506280b-1a0f-490c-a322-9c6ddffca4dd (`docs/feedback/POD_Walkthrough_AsM_Assisted_2026.09.12.html`) |
| Who advised whom, twelve × 111 words | `docs/assessments/2026-09-12_pod_asm_assist.md` · inputs `docs/asks/2026-09-12_pod_simulated_inputs_asm.json` · raw fleet JSON committed beside it |
| The two review rounds, twelve lenses each | `docs/assessments/2026-09-12_pod_overnight_review.md` · `…_round2.md` |
| The runs (screenshots, logs, receipt text) | `docs/assessments/pod-live-run-2026-09-12-ux/` · `…-asm/` |

## Track A — super simple to follow (0088fa4 → 8b3a53d)

The envelope model, on the pod, with nothing removed (folded, not deleted):
- **Step N of 7 · name** above the existing rail.
- **One card**: a chip (Your turn · Waiting · Done), one sentence that is the action when it is your turn and the named
  reason when it is not ("Nothing for you here — waiting for Lea (the lead)", "Your part is done — waiting for Lea to
  issue the receipt", "Waiting for the lead to seat you"), and one amber button that scrolls to and focuses the real
  control, which is outlined (the envelope's next-field tag). Chip, sentence, button and the enabled state of the
  shared controls all come from ONE derivation; what the card withholds from a phone is disabled on that phone
  (Accept, the clock, Settle, Back to edit are the lead's; Stop & record is everyone's by doctrine; the phone strip's
  Stop obeys the same predicate as Stop & record).
- **Who has done what**: one line per person, the state of this step, "you" on your own line (the signing flow's
  Roster pattern).
- **Folded**: the evidence chain and the settlement prose under "Details".
- **Completed ✓** above the receipt, with "Copy the receipt" — the whole settled section as text, and a failed copy
  says so.
- **Lexicon**: 82 new `soi.pod.*` keys (guide, labels, buttons, placeholders, aria-labels) with English defaults; the
  fallback chain serves the other 33 languages. Translations into the 32 language files are NOT written (see below).
- **Voice**: no visible pod string names a vendor, a file, a hash, a cube number, a spec number or a runtime — gated by
  a scan of every visible string and every `soi.pod.*` value against the signing surface's banned vocabulary.
- **Precision**: every hours figure a person reads passes through one formatter (four decimals) — gated by form, so a
  site nobody listed still fails; the receipt adds up at the precision it is printed.

## Track B — four reviewers per member (ffdd117, 7078d8a)

Twelve reviewer lenses, four per seat, three drafting independently and the fourth reconciling, in one Workflow run
(the raw JSON is committed this time). The validator refuses anything a phone could not type (a place not in the record,
an M outside the published bands, hours ≤ 0, a comment that is not 111 words) and prescribes each seat's USD route so
the run's assertion can fail. The advised members chose: Lea — the exchange-rate gap as the intent, plan 3 h × 4.807,
pod place Ireland, her own place Washington; Ana — Brazil with a São Paulo fix; Bo — Metro Manila. The receipt prints
$ · a second US-dollar floor · "awaiting a dated exchange-rate source"; the synthesis counts 130 + 103 + 108 = 341 words,
identical on three phones. The app takes no AI input; the phones type the reviewers' words.

## Track C — the spiral

| Round | Review grades (12 lenses) | What was fixed at the class | Evidence |
|---|---|---|---|
| 1 | C ×11, B ×1 | one derivation for the guide · withheld controls disabled · a wait names who · one precision · the synthesis claims only what happened · the copy is the whole receipt · one name per seat · vendor/file/hash off the screens · the harness narrates from its inputs · the synthesis total bounded | 1d00472 · 89fec4b |
| 2 | B ×6, C ×6 | 28 labels and buttons into the lexicon · next-field mark after every render · the validator prescribes the USD route | a4df4bd · 4914912 |
| 3 | (gates by form) | no raw hours anywhere · no machine word in any visible string · every placeholder through t() · the strip and Back-to-edit obey the derivation · a full pod says so · the receipt adds up · one "approved" predicate · narration marked as narration | 8b3a53d |

Each round ended with the three-phone runs green (default 124→127 steps, advised 125→128), `pod-invariant` green
(396 → 447 assertions) and `next build` exit 0. `test:ci` was green for rounds 1 and 2 and RED for round 3 on the
two lexicon-coverage gates until the translations landed (see the correction above and the closing section).

## What remains — yours, or larger than a night

1. **Translations — done, pending your approval.** The 92 new keys are translated into all 32 other languages: Spanish
   by hand (fed42ae); the 31 others by a translation fleet (8 agents, 4 languages each; raw JSON at
   `docs/asks/2026-09-12_pod_i18n_31_languages.fleet.json`), applied by a script that refuses a dropped placeholder, an
   empty or an untranslated entry — 2,852 entries, 0 refusals; `sign-i18n-all` 125/125. The AI-verified + one-approval
   gate for new languages is yours (CLAUDE.md, Translation).
2. **The build strip** (SHA · date · time) above every screen is app-wide and is the operator's own status line; the
   reviewers count it as machine language on a member's screen. Your call.
3. **~70 English literals** remain on the pod page outside the guided path (section prose, the CRS demo list, the four
   artefacts); the guided path itself is keyed.
4. **A dated exchange-rate source** — the residual from yesterday, and the intent the advised pod chose: one file,
   four columns, and every non-USD line shows a figure.
5. The reviewers' round-3 leftovers not taken tonight: an operator door (`?diag=1`) on the pod page; a lead who reopens
   by link is `leadOnly`-gated by role, which is correct when the link carries `lead=`; the reconciler comment that
   cites a draft position it did not hold (data, persisted as the fleet wrote it).
