# Project Unlock — merging stage-gate governance into the cube

The two systems in front of you are the same shape and neither knows it.

Your stage-gate model is a sequence of states, each with required deliverables,
each guarded by named approvers, each producing an audit row. Your cube is 27
cells grouped into blocks, where each block is an API function and the whole
thing is solid only when every piece is present.

That is one model drawn twice. Merging them means the cube stops being a
visualization of the architecture and becomes the live status of a project —
and the functions stop being a diagram and become the thing that moves it.

---

## 1. The mapping

| Stage-gate concept | Cube equivalent |
|---|---|
| A project | One cube |
| Development stage (Concept → Retire) | A block group within the cube |
| Gate G1–G7 | The unlock threshold between block groups |
| Required deliverable (S1–S18) | One cell |
| LIVE-code function (`create_session`, …) | The action that advances a cell |
| PRB reviewer function + Required/Optional | Who can approve the cell, and whether they block |
| Gate Review History | The cell's audit trail |
| Above / Below the line | The project's standing in the portfolio view |
| Quantified value Δ$ | Token weight on completion |
| 3-Year NPV / IRR | Project score surfaced at login |

The cell count is the useful constraint here. A cube holds exactly 27 cells, and
`cube-partitions.js` guarantees any block count tiles it exactly. So a stage's
deliverable list determines its block's size — and a project can't quietly grow
past what the cube can hold without someone deciding what to cut. The geometry
enforces scope discipline. That's a feature, not a limitation.

---

## 2. Unlock states

Five states per cell. These extend the CRS status vocabulary rather than
inventing a parallel one:

| State | Meaning | Render |
|---|---|---|
| `locked` | Prerequisite gate not passed | Dim wireframe, no fill |
| `available` | Prerequisites met, not started | Outlined, slow pulse |
| `active` | Function called, work in flight | Filled, low opacity, animating |
| `submitted` | Deliverable complete, awaiting approval | Solid, amber edge |
| `approved` | Reviewer signed off | Solid, full block color |

**The cube fills in as the project progresses.** At login a user sees exactly
how far along every project is, without reading a single status report. A solid
cube means launched. A cube with one dim layer means a gate is pending. That
single glance is the whole product idea; everything below is plumbing.

---

## 3. Functions drive the state, not a status field

The unlock graph is a DAG over your API functions. `1.1 create_session`
completing is what makes `1.2` available — not someone ticking a box.

This is what makes the feature honest. A status field is a claim; a completed
function call is evidence. It also solves the problem that kills most
stage-gate tooling, which is that the tracker drifts from reality because
updating it is a separate chore nobody does.

**Derive state, don't store it.** Keep an append-only event log — function
called, payload hash, actor, timestamp, approval granted — and compute the
unlock state on read. Three consequences worth the cost:

- The audit trail and the state can't disagree, because one is the other.
- Gate Review History is a query, not a maintained artifact.
- Replaying the log reconstructs any past moment, which is what a gate review
  actually wants to look at.

---

## 4. Login flow

1. Authenticate → resolve the user's projects and their functional role.
2. Replay each project's event log → unlock state per cell.
3. Render the cube. Slider defaults to assembled; exploded view shows which
   block is holding things up.
4. Compute available actions: functions whose prerequisites are met **and**
   whose approval role matches the user's function.

Point 4 is where the PRB table earns its place. A Finance/FP&A user logging in
sees the cells awaiting their sign-off lit differently from the ones awaiting
R&D. Required reviewers block the gate; optional ones are advisory and don't.
That distinction already exists in your approval template — it just becomes
executable.

---

## 5. What this does for the polling tool

The two features are complementary, not adjacent:

- **Polling generates the deliverable.** A gate needing team alignment opens a
  poll; AI theming clusters the responses; the vote produces the artifact that
  satisfies the cell.
- **Unlock gives the poll consequence.** Today a poll produces themes and then
  the themes sit there. Wired to a gate, a poll's outcome visibly moves a
  project forward — the cell fills the moment the vote closes.
- **Tokens connect them.** Completing a cell mints against the quantified value
  of that deliverable, so contribution is weighted by what it unlocked rather
  than by volume of participation.

---

## 6. Data model sketch

```
project        id, name, cube_id, above_line: bool, npv, irr
cell           project_id, block_id, index, deliverable_ref (S##)
gate           project_id, stage, required_roles[], optional_roles[]
event          project_id, cell_id, type, actor, role, payload_hash, ts
                 type ∈ {invoked, completed, submitted, approved, rejected,
                         demoted, promoted}
```

Unlock state is a fold over `event`, ordered by `ts`. No status column anywhere.

---

## 7. New CRS entries this creates

Per the governance plan, this is a new parent with subs — not edits to existing
requirements:

- **CRS-##** — Project state shall be derived from an append-only event log
  such that no stored status field can contradict the audit trail.
- **CRS-##.01** — A cell shall become available only when every prerequisite
  function has a `completed` event.
- **CRS-##.02** — A gate shall not pass while any required reviewer role has an
  outstanding approval.
- **CRS-##.03** — At login, unlock state shall render within *(latency budget —
  needs a number)* for a project of *(max cell count)*.
- **CRS-##.04** — Demotion below the line shall *(behavior — see open
  decisions)*.

Each is independently testable, which is the filter for whether it belongs.

---

## 8. Open decisions

These need answers before implementation, and each is an ADR:

1. **Is a project one cube, or does it span the ten cubes?** One cube per
   project is simpler and the geometry enforces scope. Ten cubes per project
   would mirror the microservice architecture but makes the login view a
   grid of cubes rather than one object. This decision shapes everything else.

2. **Can a function auto-advance a gate, or does every gate need a human?**
   Auto-advance is faster and matches the derive-don't-store principle. Human
   approval matches your PRB template and is probably non-negotiable for the
   gates that release money. Likely answer: auto-advance within a stage, human
   approval to cross a gate.

3. **What happens on demotion?** Your Project Moves slide has demote paths with
   real dollar volumes. Do cells re-lock, freeze, or stay approved while the
   project greys out? Re-locking destroys earned state; freezing is probably
   right, but it needs deciding before the log format is fixed.

4. **Do the three token types map to something specific here?** Contribution,
   participation, and gate progression are the obvious three, but I don't know
   the intended semantics of ♡ / 웃 / ◬ well enough to assign them.

---

## 9. Sequencing

This lands after Cube 6, not before. The unlock feature depends on the polling
loop actually closing — a gate wired to a poll that can't theme a million
responses in under a minute is a gate that hangs. Design it now while the
concepts are fresh; build it once the theming service is real.

The exception is decision 1. Answer that this week — it determines whether the
cube work already delivered is a project view or an architecture view, and
that's a fork you don't want to discover late.
