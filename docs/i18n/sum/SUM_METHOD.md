# SUM — the Sumerian Edition of the Executive Summary
## Methodology (scholarly draft — review invited)

**Status: DRAFT.** This edition is a composed Sumerian translation, prepared for scholarly
review, not a claim of fluency in a language whose last native speaker died four thousand
years ago. Sumerian is a language isolate; every modern composition in it is a reconstruction,
and specialists still debate the verbal chain. This document states exactly how the draft was
made so a reviewer can correct it line by line.

### Why the previous attempt was discarded
The earlier file (`VISION_2525_Cuneiform.html`) rendered **English spelled phonetically in
cuneiform signs** — its own transliteration reads `e a ri ki bi li za ti u na` for "every
civilization." That is English written in Sumerian signs, not Sumerian, and the standing
publication rule for this project ("It is not published until the cuneiform is Sumerian
rather than English written in Sumerian signs") exists precisely to bar it. This edition
translates meaning, not letters.

### One master, one derivation chain
- The **English master** is `docs/i18n/exec-summary.en.json` (frozen,
  sha `237b6ca33c30…`), sentence-for-sentence.
- The **Sumerian master is the transliteration** (`docs/i18n/exec-summary.sum.json`),
  ePSD2-style readings, one record per English sentence.
- The **cuneiform is derived mechanically** from the transliteration by
  `docs/i18n/sum/signmap.json` — a table generated from Unicode's own
  Sumero-Akkadian sign inventory (each reading resolved by Unicode sign *name*,
  so a wrong glyph is structurally impossible). The builder **fails closed** on any
  reading the table does not carry. A reviewer corrects the transliteration; the
  signs regenerate. No human ever hand-picks a glyph.

### Sources
| Use | Source |
|---|---|
| Literary parallels, formulae, word order | ETCSL — Electronic Text Corpus of Sumerian Literature (Oxford), with Black · Cunningham · Robson · Zólyomi, *The Literature of Ancient Sumer* |
| Lexemes, readings, attestations | ePSD2 — Pennsylvania Sumerian Dictionary |
| Tablet-level verification | CDLI |
| Sign encoding | Unicode Sumero-Akkadian Cuneiform block (U+12000–U+123FF), resolved by sign name |

No "web Sumerian translators," no esoteric sign lists. Where this draft must coin a term
(see Coinage), the coinage is flagged and glossed rather than passed off as attested.

### Locked proper renderings (operator, 2025 — kept per instruction, no questions asked)
| English | Sumerian | Signs |
|---|---|---|
| Master of Thought | **EN SAG.KI** | 𒂗 𒊕 𒆠 |
| Divinity Guide | EN.DINGIR.GUB | 𒂗 𒀭 𒁺 |
| Flower of Life | NIG₂-SI.SA ZI | 𒃻 𒋛 𒊓 𒍣 |
| Emerald Tablet | DUB.GI.NA.NA | 𒁾 𒄀 𒈾 𒈾 |
| Book of Thoth | DUB DHU.TI | 𒁾 𒌅 𒋾 (DHU rendered TU, flagged for review) |

### Grammar conventions of the draft
- **Word order:** verb-final (SOV); modifiers follow the noun (lugal gal, "great king").
- **Alignment:** ergative — agent takes **-e**, patient/subject of intransitive is unmarked.
- **Cases:** genitive **/-ak/**, written as it surfaces: **-a** at phrase end (gesz-hur
  nam-lu2-ulu3-a), **-ka** before a following element (nam-lu2-ulu3-ka szu…); the
  abstract -ak never appears as a sign. Ergative **-e**, with the **-ke4** allomorph
  where genitive and ergative stack (e2-dub-ba-a-ke4) — a reviewer seeing -ke4 is
  seeing the composed /-ak+e/, not an error. Dative **-ra**, locative **-a**,
  terminative **-še₃**, ablative **-ta**, comitative **-da**, equative **-gin₇**.
- **Copula:** enclitic **-am₃** ("it is").
- **Verbal chain (simplified for the draft):** finite forms carry a conjugation prefix
  (**mu-**, **ba-**, **i₃-**) + agreement; the draft prefers the simplest defensible chain
  and flags anything doubtful rather than inventing morphology. Habitual/gnomic statements
  use the marû base where a clean form is attested; otherwise nominal sentences with -am₃.
- **Abstracts:** **nam-** prefix (nam-lugal "kingship" → nam-ĝeštug₂ "thought-mastery").
- **Plural (animate):** **-ene**; inanimate plurality unmarked or reduplicated.
- **Transliteration style:** ePSD2 values with plain digits (šag₄ → sza3 in data files;
  ĝ typed ĝ in display, `j`-free). Determinatives are omitted in the draft body
  (flagged as a known simplification), except DINGIR in locked names.

### The three-term hierarchy (as in all 33 editions)
| English | Sumerian | Literal |
|---|---|---|
| Thought Mastery (discipline) | **nam-ĝeštug₂** | "the -ship of understanding" |
| a Thought Master (person) | **lu₂ ĝeštug₂-ga** | "a person of understanding" |
| Master of Thought (responsibility/seal) | **EN SAG.KI** | locked, operator 2025 |

### Coinage rules (modern concepts an Old Babylonian scribe never met)
A coinage is a transparent calque from attested lexemes, marked **⚘** in the glossary,
never a phonetic loan. The load-bearing ones:
| Concept | Draft Sumerian | Literal reading |
|---|---|---|
| Artificial Intelligence | **ĝeštug₂ dim₂-ma** ⚘ | "fashioned understanding" |
| machine | **ĝeš dim₂-ma** ⚘ | "fashioned wood/implement" |
| Replay (the record replayed) | **dub gi₄-gi₄** ⚘ | "the tablet that returns" |
| Engineering (the craft) | **nam-dim₂** ⚘ | "the -ship of fashioning" |
| record / ledger | **dub** | tablet (attested) |
| simulation | **igi-bar** ⚘ | "the looking-upon" — also carries "vision/imagine" in the litany; glosses disambiguate |
| hour (the recorded hour) | **danna-bar** ⚘ | "half a danna" (danna = attested double-hour, written KASKAL.BU — so the compound renders as the three-sign run 𒆜𒁍𒁇) |

### What stays verbatim (identical rule to the other 32 editions)
`Vision • 2525` · `R-CORE` · `HI earned = M × hours` · `9,999` · `360 → 33 → 11` ·
`2525` · `Austin` · `Phnom Penh` · `Replay` — as a HEADING or label it stays the Latin branded token ⟦Replay⟧; in running prose it is the
coined calque **dub gi₄-gi₄**. One rule, two registers, stated here so the two uses cannot read as drift. Numbers keep Arabic numerals; the companion
*Sumerian Numerology* document (operator source) governs any future sexagesimal
presentation, which this draft does not attempt.

### The reader's apparatus (the page itself)
The published page shows **cuneiform as the reading**. A toggle (the Divinity Guide's
pattern) opens study mode: selecting a sentence highlights it and shows its
**transliteration on the left** and the **English master phrase on the right** — so any
reviewer, anywhere, can fault a line against its source with one tap. The page carries a
permanent DRAFT banner naming this method file and inviting correction.

### Review invitation — and where to send it
Corrections are expected and wanted, at the level of: lexeme choice, case chain, verbal
prefix, sign value, or the whole approach to a sentence. **Send corrections as GitHub
issues: https://github.com/alexseguin-hbs/eXeL-AI-Polling/issues** (public), quoting the
sentence's English line. The transliteration file is the single thing to correct;
everything else regenerates.

### Known limitations of the draft (stated, not hidden)
- The seal caption and author line render as caption/alt text and are not tappable in
  study mode; every sentence of the running text is.
- The genitive is written only as it surfaces (-a / -ka); the abstract -ak never appears
  as a sign.
- A downloaded offline copy needs a cuneiform-capable font installed (Noto Sans
  Cuneiform); without network or such a font the signs render as boxes — the
  transliteration in study mode remains fully readable.
- Determinatives are omitted; danna is pressed into service for "hour" as danna-bar.
