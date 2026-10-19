# Vision • 2525 — the papers, and what is written about them

An index, because this folder holds a 36 MB PDF and a summary beside it with nothing pointing at either.
Operator 2026-10-15, having asked twice: *"save the 2 333 writeup summaries as well as .MD for future
reference."* The file was saved the first time; what was missing was any way to find it.

## What is here

| file | what it is | size | sha256 |
|---|---|---:|---|
| `VISION-2525.pdf` | **The paper, 13 sections** — *Vision 2525 — Humanity's Coordination Framework*, roman numerals I–XIII, ~58 pages. The fixed artefact. | 36,215,799 B | `ebc88f5a3aa79eb8…` |
| `2026-10-14_VISION-2525_summaries_333.md` | **Both papers summarised, 333 words each, three paragraphs each**, written to his brief of 2026-10-14. Carries the provenance of both sources, both section tables, a checkable word-count command, and two findings. | 10,602 B | `f3177e26ef2e09ba…` |

## What is NOT here, and where it is instead

| | where | size | sha256 |
|---|---|---:|---|
| **The paper, 19 sections** — *Vision • 2525* online, the living document, v.19 / r1.016 | `docs/SOI_VISION2525_LIVING_DOCUMENT.html` | 7,182,403 B | `1e692afc02bb5e42…` |
| the same document, served | `frontend/public/whitepaper/SOI_VISION2525_v.19_LIVING_DOCUMENT.html` — **byte-identical**, verified | | |
| the Executive Summary, EN + 32 translations | `frontend/public/whitepaper/vision-2525-executive-summary.*.html` | | |
| its single frozen master | `docs/i18n/exec-summary.en.json` — SHA-locked; every carrier derives from it, and `scripts/exec-summary-one-master.mjs` fails on any drift | | |

## The thing most likely to confuse a future reader

**"13" and "19" are two different documents, not two sections of one.** The 13 is the PDF paper; the 19 is the
online living document. And in the online one, `V.19 R1.016` is a **version and release label, not a section
number** — `v.01`…`v.19` are graduated version bands over the revision history, and `r0.NNN` / `r1.NNN` is the
release series. His own correction, 2026-10-14: *"by 19 i meant Vision-2525 online. which has 19 sections. when
mentioning 13, i mean pdf vision 2525 paper."*

## One thing still open, his call

The summaries file records it: the drone deck's `VISION 13` table (rendered under `R-CORE · VISION 13` in
CONTROLS) matches the PDF exactly for **I–VIII** and then diverges — the deck has QUALIFY at IX and COLLECTIVE
at X where the paper has Collective Intelligence at IX and SSSES at XI, and the deck's XI–XIII (HAL, STEWARD,
LEXICON) are not the paper's at all. One of the two is stale, and the deck shows its version to anyone who
opens CONTROLS. **Which is canonical is his to say.**

## Shield in the Sky (ADA briefing) — cross-references (2026-10-19)

| Item | Location |
|------|----------|
| Text-only MD (GENERATED from `docs/asks/…` by `frontend/scripts/gen-shield-briefing.mjs`; gated by `tests/whitepaper-source.test.mjs`) | `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md` |
| Images companion (slots 1–13) | `docs/whitepaper/Shield_in_the_Sky_Images.md` |
| Original verbatim paste | `docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md` |
| VISION-2525.pdf public download (Supabase) | https://ppgfjplawtlrfqpnszyb.supabase.co/storage/v1/object/public/whitepaper/VISION-2525.pdf |

The fixed 13-section Vision paper is available at the Supabase URL above. The Shield briefing text and image extracts live next to this README.
