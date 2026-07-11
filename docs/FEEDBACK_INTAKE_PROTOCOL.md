# Feedback Intake Protocol — LOCKED (Zero Drift)

> **Status:** LOCKED by Thought Master 2026-07-09, re-affirmed 2026-07-11.
> **Directive:** "Ensure ZERO DRIFT until I change the method. Assume infinity."
> This protocol is the **single canonical way** Human Intelligence (웃) feedback enters the
> engine. Do **not** improvise a different channel, schema, or naming. It stays in force
> **indefinitely** until the operator (Thought Master) explicitly changes it. Any change to
> this file requires an explicit operator instruction — never a self-directed edit.

Guiding principle: *"Where Shared Intention moves at the Speed of Thought."* Innovation
proceeds at machine speed, but **HI (웃) retains final authority over what ships.** CLAUDE
initiates every feedback ask — the operator does not have to request it.

---

## Two Channels — Selected by Volume

The channel is chosen by **how many adjusted items** (features / files / questions) are in
the batch being surfaced for review.

| Channel | Trigger | Deliverable | Ask |
|---------|---------|-------------|-----|
| **A — Quick Ask** | **1 or 2** files / questions / adjusted items | Render the relevant **PNG(s)** to Downloads (real component → PNG, per the visual-sim method) and ask inline | "Here's the current state — approve or adjust?" |
| **B — Release HTML** | **3 or more** adjusted items | Produce the next **numbered Release HTML** review artifact (+ its saved `FEEDBACK.json`) | "Saved your feedback? Say *ingest my feedback*." |

**Rule of thumb:** `count(adjusted items) <= 2` → Channel A. `count >= 3` → Channel B.
There is no third channel. When in doubt between A and B at exactly the boundary, prefer
**B** (the structured artifact) so nothing is lost.

---

## Channel A — Quick Ask (1–2 items)

1. For each item, **render the real component to a PNG** in the scratchpad, verify against
   reference, then publish the PNG to `/mnt/c/Users/Alex/Downloads/` for HI review.
   (See the visual-sim method: render real component → PNG → verify → publish; never push
   to GitHub mid-sim.)
2. Ask the operator directly in chat — approve / adjust, per item.
3. No JSON schema required at this scale; the operator answers inline.

## Channel B — Release HTML + FEEDBACK.json (3+ items)

Delivered as a **version-stamped folder** under Downloads:

```
/mnt/c/Users/Alex/Downloads/Security-2525/FEEDBACK/<STAMP>/
    ├── <STAMP>.html              ← self-contained visual review artifact
    └── <STAMP>_FEEDBACK.json      ← saved verdicts (Blob-downloaded by the HTML)
```

### Version Stamp (do not stray)

Format: **`YYYY.MM.DD_P#.#_HHMMCST`** — e.g. `2026.07.09_P1.3_0855CST`.

- `P#.#` = current git phase (do **not** invent one; use the codebase's phase).
- Time = build/push time, generated in **America/Chicago**, labeled `CST` regardless of DST:
  `TZ="America/Chicago" date +"%Y.%m.%d_P1.3_%H%MCST"`.
- Pair the stamp with the pushed short SHA when referencing a build
  (header line: `2026.07.09_P1.3_0855CST · SHA <short>`).

### Release HTML must contain

- Release-contents table with commit hashes.
- **Embedded PNGs** (base64) of the deployed concepts — self-contained, no external refs.
- **12 Ascended Masters** reviews of **exactly 111 words each** (verify with a word-count script).
- **Master of Thought** synthesis of **exactly 333 words** in **3 × 111-word paragraphs**,
  ending with a status.
- Per-section Human-Intelligence `<textarea>`s (visually **highlighted** — pulsing border /
  gold callout so the eye lands where input is wanted).
- Verdict radios per feature + an overall verdict.
- A **SAVE FEEDBACK** button that Blob-downloads `<STAMP>_FEEDBACK.json` to Downloads and
  persists a localStorage draft.

### Feature IDs

- Feature IDs (`FX-##` / `F##`) are **cumulative across releases** — a new release continues
  numbering from where the last one ended (it does not reset to 1).

---

## FEEDBACK.json Schema (Channel B ingest)

The HTML's SAVE button writes this shape. CLAUDE ingests it when the operator says
**"ingest my feedback."**

```jsonc
{
  "release": "SECURITY-2525 P1.3",     // release label
  "date": "2026-07-09",                 // YYYY-MM-DD
  "timestamp": "2026-07-09T15:39:28.933Z", // ISO 8601 save time
  "verdict": "APPROVE WITH CHANGES",    // overall verdict
  "overallNotes": "Overall approve and make changes.",
  "features": {
    "FX-01": { "verdict": "APPROVE",  "comment": "..." },
    "FX-02": { "verdict": "CHANGES",  "comment": "..." },
    "FX-16": { "verdict": null,        "comment": "..." }  // null = note only, no gate
  }
}
```

### Per-feature `verdict` values

| Value | Meaning | Action |
|-------|---------|--------|
| `"APPROVE"` | Ships as-is | No change; keep locked |
| `"CHANGES"` | Approved direction, adjustments required | Implement the `comment`, re-surface next round |
| `null` | Observation / note only — not a gate | Read the `comment`; no verdict pending |

`comment` may be empty (`""`) for a bare APPROVE.

---

## Ingest Flow (Channel B)

1. Operator drops the `FEEDBACK.json` into the version-stamped folder and says
   **"ingest my feedback."**
2. CLAUDE reads the JSON, turns every `CHANGES` (and actionable `null` notes) into work,
   preserving the cumulative `FX-##` IDs.
3. Fixes are implemented; the next round re-surfaces the same IDs with their new state.
4. **Push gate:** commit locally, but **HOLD `git push`** on a release batch until Thought
   Master approves (this overrides the CLAUDE.md always-push rule *for release batches during
   live sessions* only). Mid-flight commits already pushed before the gate was declared stay
   pushed.

---

## Related

- Memory: `feedback_release_review_workflow` — the Downloads-HTML + JSON-ingest loop & cadence.
- Memory: `reference_version_stamp_convention` — exact stamp naming (do not stray).
- Memory: `feedback_visual_sim_method` — render real component → PNG → verify → publish.
- Memory: `feedback_release_review_workflow` push-gate overrides `CLAUDE.md` always-push for
  release batches.
