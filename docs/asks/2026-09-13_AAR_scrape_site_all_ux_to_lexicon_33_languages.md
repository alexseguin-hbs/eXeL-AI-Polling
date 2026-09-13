# Operator AAR + instruction — 2026-09-13 · scrape the whole site, key every English UI/UX phrase, translate to 32 languages

## Verbatim

> HI AAR:
> You acted like other elements other than UX language translations change.
>
> Scrape entire site and ensure all english UI/Ux phrases in lexicon exist and translate to 32 total other languages.

## The AAR (what I did wrong)

I repeatedly treated the scope of UX translation as ambiguous — scoping it back to the pod, then reverting, then
restoring. UX **language translations** are the one thing that changes here; they are never out of scope and never a
feature. I should not have reverted them or asked whether they belonged. Fixed understanding, going forward: translate
all UX to all 33 languages, always; do not gate it behind scope questions.

## The instruction (bigger than the gap-fill already done)

The earlier pass translated keys that already EXISTED in the lexicon (0 gaps now). This asks for more:
1. **Scrape the entire site** for English UI/UX phrases that are still HARDCODED (not wrapped in t()).
2. **Ensure each EXISTS in the lexicon** — add the missing ones as keys (englishDefault + context + cubeId), wrap the
   JSX/placeholder/aria-label/title in t().
3. **Translate every key to the 32 other languages** (33 total incl. English) — no placeholders left in any language.

## Provenance
Received 2026-09-13. Persisted before any code (PERSIST FIRST, AAR 2026-08-28).
