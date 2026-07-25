# CRS governance & gap-analysis triage plan

Two problems, related but separate:

1. **Keeping CRS current.** CRS-01 → CRS-35 were written before most of the build. The code has moved; the requirements haven't. Without a rule for how they change, they drift into fiction.
2. **The 4-sheet gap analysis is not a backlog.** It says what's missing. It doesn't say what to do first. Until it's ordered, it can't be worked.

---

# Part 1 — Governing CRS-## and CRS-##.##

## 1.1 Move the source of truth out of Excel

Excel can't diff, can't review, and can't be referenced from a commit. Requirements that live beside the code get updated with the code.

Proposed: a single `requirements/crs.yaml` in the repo. One record per requirement:

```yaml
- id: CRS-06
  title: Theme generation completes within the session window
  statement: >
    The system shall return generated themes for a completed poll
    within 60 seconds for inputs up to 1,000,000 responses.
  parent: null
  cube: 6
  status: approved
  priority: P0
  verification: performance-test
  evidence: null            # link to the test run that proves it
  decisions: [ADR-004]      # design decisions this depends on
  updated: 2026-07-25
```

Keep the Excel as an export if stakeholders want it — generate it from the YAML, never the reverse. One direction only, or you'll have two truths again.

## 1.2 ID rules

**Parent IDs (CRS-##) are permanent.** Never renumber, never reuse, never delete. A requirement that stops being true becomes `status: superseded` with a pointer to what replaced it. Renumbering breaks every reference in every document and email that ever cited it.

**Sub-IDs (CRS-##.##) are append-only.** CRS-06.03 is the third sub-requirement ever created under CRS-06 — even if 06.01 and 06.02 were later superseded. Gaps in the sequence are information, not untidiness.

**Sub-IDs don't nest further.** No CRS-06.03.01. If you need a third level, the parent was scoped wrong — split it into two parents.

## 1.3 When a sub-CRS gets created

The test is verifiability. Write a sub-CRS when:

- **The parent contains more than one testable claim.** "Themes are generated accurately and quickly" is two requirements wearing one ID. Split into 06.01 (accuracy threshold) and 06.02 (latency threshold), each independently pass/fail.
- **Implementation surfaced a constraint the parent didn't anticipate.** Sampling strategy at 1M responses is a real requirement that CRS-06 almost certainly doesn't state. It becomes a sub, not a code comment.
- **A parent applies differently per cube.** Same intent, different acceptance criteria per service → one sub per cube.

Do **not** write a sub-CRS for:

- How something is built. That's an ADR (see 1.5).
- A task. That's a ticket. "Port Cube 6 to a service architecture" is work, not a requirement.
- Something you can't fail. If no observation could show it unmet, it's a goal statement — put it in the project brief.

**The one-line filter:** *can a specific test, measurement, or inspection return pass or fail on this sentence alone?* If not, it isn't a CRS entry.

## 1.4 Status vocabulary

Six values, no others:

| Status | Meaning |
|---|---|
| `draft` | Written, not yet agreed |
| `approved` | Agreed, not yet built |
| `implemented` | Built, not yet proven |
| `verified` | Evidence link exists and passes |
| `superseded` | Replaced — must name the successor |
| `out-of-scope` | Explicitly dropped — must state why |

Nothing is ever removed. `implemented` without an evidence link is the status that lies most often, so treat the gap between `implemented` and `verified` as the real project risk register.

## 1.5 Requirements vs. decisions

The three open Cube 6 questions — embeddings + KMeans vs. per-row LLM classification, provider prioritization, sampling strategy — are **decisions**, not requirements. They belong in short ADR files (`decisions/ADR-004-clustering-approach.md`): context, options considered, choice, consequences, date.

The CRS entry states the outcome that must hold. The ADR records why you chose the path to it. Requirements survive rewrites; decisions explain them.

This matters right now because those three decisions block the single most expensive item on the backlog. Writing them as ADRs forces them closed.

## 1.6 Change control

- An `approved` statement is never silently edited. Change it and you invalidate whatever was verified against it.
- Substantive change → supersede the old ID, create a new sub. Log the reason in the record.
- Typos and clarifications that don't alter meaning → edit freely, bump `updated`.
- Every requirement carries a `cube` field. That's your traceability: a cube's completion criteria are just the CRS entries pointing at it.

## 1.7 Cadence

| Trigger | Action |
|---|---|
| Cube reaches `implemented` | Review every CRS entry naming that cube; set `verified` or record the gap |
| ADR closed | Check whether affected parents need new subs |
| Monthly | Sweep for entries stuck at `implemented` with no evidence |
| Scope change | Supersede, don't rewrite |

---

# Part 2 — Triaging the gap analysis

## 2.1 Score each gap on four questions

Each is yes/no. No weighted scoring — it invites argument and hides judgment.

1. **Does it block the 1M-in-60s target?**
2. **Does it block another cube from being implemented?**
3. **Is it visible to a user or a moderator today?**
4. **Is it a correctness or security risk?**

## 2.2 Bucket by the answers

| Bucket | Rule | Meaning |
|---|---|---|
| **P0** | Yes to 1 or 2 | Blocks the critical path. Nothing else starts first |
| **P1** | Yes to 4 only | Correctness/security, unblocked, ship soon |
| **P2** | Yes to 3 only | User-visible, not blocking |
| **P3** | No to all | Real but deferrable. Revisit at next cube completion |

Anything landing in P3 twice in a row is a candidate for `out-of-scope`. A backlog that only grows isn't a plan.

## 2.3 Expected sequence

Based on what's known so far, the ordering will almost certainly fall out as:

- **Wave 0 — close the three Cube 6 decisions as ADRs.** Days of work, unblocks weeks. Cheapest high-leverage move available.
- **Wave 1 — Cube 6 port to a scalable service.** The 15–20 day item. Everything about the scale target depends on it.
- **Wave 2 — the seven stub cubes**, ordered by which ones Cube 6 depends on for input and output.
- **Wave 3 — frontend.** Large gap between the React/Next.js architecture and what's deployed.
- **Wave 4 — product polish.** Stripe webhook, modal overflow, error copy, explode-view work.

If the triage produces a different order, trust the triage — but the shape above is the null hypothesis to argue against.

## 2.4 Output of the triage session

One ordered list. Each row: gap → CRS ID it maps to (creating a sub if none exists) → bucket → cube → blocking dependency. That single table replaces the 4-sheet workbook as the working document.

---

# What's needed to actually run this

Upload the 4-sheet Excel gap analysis and I'll do the triage: score every row against 2.1, assign buckets, map each gap to an existing CRS-## or draft the sub-CRS-##.## it needs, and hand back the ordered table plus a first-pass `crs.yaml`.

Without the sheets I can only give the method, which is this document. The judgment calls that matter are in the rows.
