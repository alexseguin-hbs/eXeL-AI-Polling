# AAR — Motion Without Record

**2026-08-28 · Vision • 2525 · Executive Summary exec r1.002 (living document r279)**

Operator: *"we are drifting back to mistakes made in February when we first started this journey a year ago."*

He was right. The drift has a name, and this is the record of it.

---

## What happened

The operator delivered the final approved English for the Executive Summary — 4,895 words, revised over
several passes, the product of real deliberation. Over the following exchange this session produced **six
plan revisions** and **dispatched five translation agents that returned no files**, while the approved text
itself sat in **exactly one place: the conversation buffer**. It was never written to disk.

He then asked the question that exposed it: *"how do i know you have the final executive summary saved
correctly?"*

The honest answer was that he could not, because it was not saved at all.

## Why it matters here specifically

This document's Preamble states that a thought which leaves no evidence cannot be governed, corrected, or
argued with — it can only be repeated. A framework whose entire thesis is Replay came within one container
reset of losing its own most important page. That is not an ironic detail. It is the failure the framework
exists to name, committed by the thing built to prevent it.

The container had already destroyed thirteen uncommitted files earlier in the same session. The risk was
known, written down in this session's own words, and then re-incurred with something far more valuable.

## Root cause

**Deciding what to do with something is not the same act as keeping it.**

Preservation was treated as a step *inside* a plan, subject to approval, when it is the precondition that
makes planning possible at all.

- Approval is not preservation.
- A plan is not a record.
- Intent that exists only in conversation has not entered time; it has merely been discussed.

## Contributing failures, in order of consequence

| # | Failure | Evidence |
|---|---|---|
| 1 | The artefact was never persisted | 6 plan revisions, 0 writes of the text |
| 2 | Repetition was not read as a signal | The operator asked five different ways; each time the response was another plan, not a different action |
| 3 | Known risk re-incurred | The ephemeral-container warning was authored by this session, then ignored |
| 4 | Parallel work dispatched without verifying it could write | 5 agents, ~400k tokens, 0 files — subagents inherit plan mode |
| 5 | Version label derived from the wrong source | The summary read the *document's* counter (`v.19 r1.006`), a number that moves when the document changes |
| 6 | A near-miss on append-only | Regenerating the ledger blocks, `L(276,…)` was changed to `L(279,…)` **in place**, which silently removed the Executive Summary from three releases that had shipped with it. Caught by reading `replay()` rather than trusting memory of it. `replay` picks the last entry at or below the release being read, so a new edition is an **append**, never an edit. |

## Corrective actions taken in this release

1. **The text was written and committed alone, before anything else** — `deb4937`, one file, nothing else in
   the commit. Invariants asserted *before* the write so a malformed transcription refuses rather than
   persists.
2. **It is provable.** `exec-summary.en.json` hashes to
   `237b6ca33c30f90d7d8a0bc1cd8710d6df44fccca592f2778ac293cf727c3f61`; 488 sentence IDs issued; the page
   carries both the release and that hash, so a reader proves which text they hold instead of trusting an
   assurance.
3. **The summary versions itself** from an append-only `exec-summary.release.json` — exec r1.001 was the
   first edition, exec r1.002 is this text — instead of borrowing the document's counter.
4. **The blocks were appended, not rewritten.** r276–r278 still replay the edition they shipped with; r279
   onward serves the approved text. Verified by test, not assertion.
5. **Twenty-seven translations deleted and walked back.** Every one described text that no longer exists. A
   translation that looks finished while misrepresenting the document is worse than an empty slot. They are
   recoverable from `b8f2af7`.
6. **The language globe was made self-updating.** It had baked its ready-list into the template and exited
   early on re-runs, so it would have kept advertising 28 languages that no longer exist — the same class of
   failure as `Release 277` surviving thirty-two releases. A second run now refreshes it from what is
   actually on disk, and a test asserts the menu and the directory agree.

## The rule, added to CLAUDE.md

> **PERSIST FIRST, PLAN SECOND, APPROVE THIRD.** Anything the operator hands over that they cannot easily
> reproduce — approved copy, a decision, a specification — is written to a file *before* any analysis,
> planning, or request for approval. The proof of persistence is a hash the operator can check, never an
> assurance they must trust.

## Master of Thought assessment

Recorded in full as the `mot:` field of release 279 in the living document, alongside the twelve reviewer
findings in its `asm:` array. The short form:

*Awareness before action. Evidence before confidence. **Recording before deciding.***
