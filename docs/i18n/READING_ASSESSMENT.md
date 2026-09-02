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

## Japanese (ja) — SHIPPED (exec r1.038)

The equivalent of pinyin is **furigana** (kana printed above kanji). Unlike pinyin it
cannot be resolved character-by-character: a kanji's reading depends on the word it
sits in (音読み / 訓読み), so it needs a **morphological analyzer with a dictionary**.
Operator: "add the japanese furigana analyzer." → **kuromoji + IPADIC** (~18 MB).

- A **ふ toggle** sits beside the globe, matching the Chinese 拼 control: off by
  default, reveals the reading above every kanji, remembered in the same key.
- **Readings are pre-generated and COMMITTED**, not produced at build time
  (`scripts/exec-summary-furigana.mjs` → `docs/i18n/exec-summary.ja.furigana.json`).
  This keeps the dictionary a dev-time tool, keeps the page build synchronous and
  deterministic, and — most importantly — makes what ships a file a Japanese reader
  can **audit**, instead of the opaque output of an analyser nobody can see.
- **Okurigana is handled:** furigana rides the kanji only. 始まる sets 始 over はじ and
  leaves まる plain; a multi-kanji core takes the reading as group ruby, the way print
  furigana sets a compound. 3,040 readings placed, **0 kanji left unread**.

### Curated corrections (`docs/i18n/ja-furigana-overrides.json`)

IPADIC reads ordinary prose well but mis-reads a handful of words whose sense is
abstract — the register this document is written in. Each correction was found by
reading the analyser's output in context, and each is committed with its evidence:

| Word | IPADIC gave | Correct | Why |
|---|---|---|---|
| 生 | なま "raw" | **せい** "life" | 人間の生の尺度 — the document's subject (6×) |
| 金 | きん "gold" | **かね** "money" | 金は主権ではない (3×) |
| 金 | きむ | **かね** | きむ is a Korean surname reading — simply wrong (1×) |
| 人 | じん | **ひと** | standalone 人 in 何百万もの人 (1×) |
| 一分 | いちふん | **いっぷん** | counter sandhi; "one minute" is the founding image (2×) |
| 六十分 | ろくじゅうふん | **ろくじゅっぷん** | same counter sandhi (1×) |
| 閾値 | *(no reading)* | **しきいち** | 閾 is absent from IPADIC — would have shipped as a silent gap on a rare character (2×) |

Token corrections are keyed `SURFACE|WRONG-READING`, so each fires **only** where that
specific wrong reading occurred — 人 stays にん in 三人 and なん in 何百万.

### Three fail-closed guarantees

1. **Lossless** — stripping the ruby must return the source text byte for byte, so
   annotating can never alter the operator's words.
2. **Every correction fires its stated count** — if the Japanese text is ever
   re-translated, the generator fails rather than letting the corrections rot.
3. **Source-stamped** — the readings carry the hash of the `ja.json` they came from,
   and the page build **refuses** a cache that does not match (verified: exit 1).

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

| Language | Script type | Reader | Control | Status |
|----------|-------------|--------|:---:|--------|
| Chinese (zh) | logographic (Han) | pinyin over each character | 拼 | **shipped r1.036** |
| Japanese (ja) | mixed (kanji + kana) | furigana over the kanji | ふ | **shipped r1.038** |
| Korean (ko) | phonetic alphabet (hangul) | (romanization overlay only) | — | not applicable to the pinyin pattern; optional future |

Both readers share one control, one localStorage key, and one CSS grammar — they differ
only in how the reading is produced (per-character rule vs. committed dictionary pass)
and in the `rt` font, since kana must not be set in a Latin monospace face.

## Decision: the remaining editions get NO reader (2026-09-02)

Operator asked whether to replicate the Mandarin/cuneiform pattern across the other
Asian and non-Latin editions — Korean, Thai, Hindi/Nepali, Bengali, Punjabi, Arabic,
Hebrew, Greek, Cyrillic — and delegated the call. **Decision: no**, with a gate built
in its place.

**The principle.** A reading aid is warranted where the script is LOGOGRAPHIC: the
pronunciation is not derivable from the shape, *even by a native reader*. That is why
Japanese newspapers print furigana over uncommon kanji **for Japanese readers**, and why
a fluent Chinese reader still reaches for pinyin on a rare character. The need is real
and it is native. Every other script in the thirty-four editions is an alphabet or an
abugida — the writing already *is* the pronunciation — so a reading line would tell
those readers nothing they had not just read.

**The audience settles it.** The summary exists in 33 languages, so no reader is
stranded in a script they cannot read: the person who opens the Arabic edition is the
person who reads Arabic. Romanising it would serve a reader with no reason to be on that
page, while cluttering it for everyone who belongs there.

**The honest counter-cases, and why they still fail:**

- **Arabic · Hebrew** — normally written *without* short vowels; vocalisation
  (tashkeel / niqqud) is a genuine aid, used in the Qur'an, Torah, poetry and
  children's books. The strongest case of the group. Rejected because fluent readers
  read unvocalised text fluently, auto-vocalisation needs a morphological analyser, and
  **a wrong vowel changes the meaning** — the risk exceeds the value.
- **Thai** — no spaces between words; tone follows from consonant class × tone mark ×
  syllable structure; silent letters in Pali/Sanskrit loans. Genuinely not one-to-one.
  Rejected because literate Thai readers apply those rules automatically, and correct
  transcription needs dictionary + word segmentation — Japanese-level cost for a
  fraction of the value.
- **Korean** — would warrant a reader **if hanja appeared**. Verified: the Korean
  edition is pure Hangul, zero Han characters.
- **Devanagari · Bengali · Gurmukhi · Greek · Cyrillic · Latin** — transparent scripts.
  Nothing to reveal.

**What was built instead.** The standing risk was never the phonetic editions; it is a
future re-translation quietly introducing logographic script into an edition with no
reader (hanja into Korean, a Chinese term quoted inside Vietnamese) with nothing to
catch it. `scripts/exec-summary-verify-readers.mjs` now fails the build if any edition
carries a logographic character that is not carrying a reading, and it runs in
`.githooks/pre-commit`. Verified fail-closed: hanja injected into the Korean edition
fails with exit 1, names the characters, and says what to do. The question "is any
edition missing a reader?" is now answered automatically rather than by inspection.
