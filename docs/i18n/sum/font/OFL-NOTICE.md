# Font subset notice

The Sumerian Executive Summary embeds a **subset of Noto Sans Cuneiform**
(only the 118 signs the SUM edition uses), inlined as a data-URI so the
cuneiform renders offline and on devices without a system cuneiform font.

- Font: Noto Sans Cuneiform (Google / The Noto Project)
- Licence: SIL Open Font License, Version 1.1 — https://openfontlicense.org
- The subset is a derived work under the OFL; the Reserved Font Name is not used.
- Regenerate: `python3 scripts/exec-summary-sum-font.py` (re-subsets from the
  Google-served woff2 to the CURRENT signmap.json codepoints).

Adding a reading to `signmap.json` with a new codepoint requires regenerating
this subset — `exec-summary-verify-sum.mjs` fails closed if the page's embedded
subset does not cover every signmap codepoint, so the coupling cannot drift silently.
