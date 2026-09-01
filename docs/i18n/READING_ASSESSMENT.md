# Executive Summary — pronunciation readers (pinyin & the CJK equivalents)

Operator ask (2026-08/09): "use Pin Ying [pinyin] icon and reader from divinity
guides to add when clicked on Chinese similar to Divinity Guide. Then check if other
asian symbolic languages like Japan and Korean have an equivalent. If so, add this
capability to any languages that have an equivalent."

This records what was built and the honest assessment of Japanese and Korean.

## Chinese (zh) — SHIPPED (exec r1.036)

The Divinity Guide's pinyin-over-hanzi reader, rendered as **static `<ruby>`** in the
standalone Executive Summary (no client library — the page is a plain built file):

- A **拼 toggle** sits beside the globe. Off by default (as the Divinity Guide is);
  tapping it reveals the pinyin above every Han character, and the choice is remembered
  (`localStorage: exel-exec-read`).
- Readings are generated at **build time** by `pinyin-pro` over each contiguous Han
  run, so word-context picks the correct polyphone reading; a pure-Han run yields
  exactly one reading per character, which aligns 1:1 with the `<ruby>` cells.
- Only text is annotated — tags, HTML entities, Latin verbatim terms (Vision • 2525,
  R-CORE, 9,999, the HI equation), the `<title>`, and the seal `alt` are left plain.

Code: `scripts/exec-summary-reading.mjs` (`READERS.zh`), wired into
`scripts/exec-summary-build.mjs` via two guarded calls that are no-ops for every other
language (proven byte-identical).

## Japanese (ja) — conceptual equivalent exists, NOT buildable with current tooling

The equivalent of pinyin is **furigana** (kana printed above kanji) or **romaji**.
Both require a **morphological analyzer with a dictionary** (e.g. kuromoji + IPADIC,
~15 MB), because a kanji's reading is **context-dependent** — the same character takes
different readings by word (音読み / 訓読み) and cannot be resolved character-by-character
the way pinyin can. `pinyin-pro` does not read Japanese, and no such analyzer is
installed in this workspace.

- Kana (hiragana / katakana) are already phonetic and need no reading aid.
- A naive per-kanji romaji (first dictionary reading) would be **wrong often enough**
  that shipping it as a "reader" would mislead — so it is deliberately NOT shipped.

**Status: deferred.** The socket is in place (`READERS` + one branch in `annotate()`).
Enabling it means adding a kuromoji-class analyzer and generating furigana for the ~71
fixed strings at build time. Recommend as a follow-up if the operator wants it — it is
a real, heavier addition, not a quick toggle.

## Korean (ko) — script is already phonetic; no logograph to annotate

Hangul is a **featural alphabet**: each syllable block is built from jamo with fixed
sounds, so a reader who knows hangul pronounces it directly. There is **no opaque
per-character reading to reveal above it** the way pinyin reveals an otherwise-unknowable
hanzi reading or furigana reveals a kanji reading — the script already *is* the
pronunciation. So the pinyin/furigana "reading above a symbol" pattern **does not have a
direct Korean equivalent.**

A **romanization overlay** (Revised Romanization, for non-Korean readers) is possible
and can be generated algorithmically from syllable decomposition, but (a) it is a
different feature from the reader the operator described, and (b) fully-correct RR needs
inter-syllable assimilation rules. **Status: not shipped**; available as an optional
future overlay if the operator wants a pronunciation aid for non-Korean readers.

## Summary

| Language | Script type | Reader | Status |
|----------|-------------|--------|--------|
| Chinese (zh) | logographic (Han) | pinyin over each character | **shipped r1.036** |
| Japanese (ja) | mixed (kanji + kana) | furigana / romaji | deferred — needs a dictionary-based analyzer |
| Korean (ko) | phonetic alphabet (hangul) | (romanization overlay only) | not applicable to the pinyin pattern; optional future |
