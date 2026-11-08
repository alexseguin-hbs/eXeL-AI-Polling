# Architect-2525 / Future — plan of record + external feedback path

This folder is the single source of truth for the **Architect-2525/Future** greenfield rebuild and the place where
external reviewers (Grok · eXeL AI · DeepSeek) and future Claude Code versions read the plan and file feedback.

| File | What it is |
|---|---|
| [`ARCHITECT-2525_FUTURE_PLAN.md`](./ARCHITECT-2525_FUTURE_PLAN.md) | **The plan of record.** Always the current revision (R1 now). §0 explains the feedback path. |
| `source/` | The operator's (H.I. Thought Master) plan **verbatim** (R0), with a sha256 sidecar. The source wins over the structured plan unless a later H.I. decision says otherwise. |
| `history/` | An immutable snapshot of every past plan revision, each with a sha256 sidecar. Never edited. |
| `feedback/` | Where reviewers drop feedback files (see below). |
| `00_ORIGINAL_CRS_PHASE_PLAN.md` · `01_FUTURE_CRS.md` · `02_CRS_CHANGE_MAP.md` + the other Phase-0 documents | Written in Phase 0 (see plan §29). |

## How to give feedback

Add **one new file** — do not edit the plan to record feedback:

```
feedback/YYYY.MM.DD_HH.MM..SS_<reviewer>_<topic>.md      (timestamp in CST, taken when written)
```

In it: name the section (§) or requirement (CRS / FCRS / T-id) you are attacking, give repository evidence as
`path:line`, and end with one of **APPROVE · APPROVE WITH CHANGE · HOLD**.

The Master of Thought folds accepted feedback into a new plan revision (R2, R3 …), logs it in the plan's §41 revision
log, and snapshots the superseded revision in `history/`. H.I. accepts or rejects each revision. Humanity decides.

## State

- **Execution state:** PHASE 0 / HOLD FOR IMPLEMENTATION (plan §37–§38).
- **Legacy `/Architect-2525/`** stays live and unchanged as evidence / donor / rollback baseline.
- **`/Architect-2525/future`** shows a Phase-0 placeholder (imports nothing legacy) until Phase 2 builds the real UI.

> Humanity decides. Technology assists. R-CORE remembers. SPIRAL verifies. SSSES qualifies. Trust must be proven.
