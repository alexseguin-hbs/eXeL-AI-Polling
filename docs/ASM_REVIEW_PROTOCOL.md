# The 12 Ascended Masters — review protocol (v2, after the AAR of 2026-09-09)

Twelve reviewers passed a change that still had a hole, because they were asked *"is this change correct?"* rather than
*"what else on this path can fail?"* This protocol makes the second question somebody's standing job.

## When they run
**Before the ship, on the journey. Not after, on the diff.** A review that begins by opening the diff has already accepted the
author's model of the problem. Each reviewer starts from the user's first tap and walks to the outcome.

## The three questions every reviewer answers
1. **Does the user get what he asked for, in my lens?** Evidence from the run, not from the code.
2. **What else on this path can fail?** Name it with `file:line`, whether or not the change touched it.
3. **What proves it stays fixed?** Name the gate. "The code looks right" is not an answer.

## Standing assignments
| Master | Lens | Owns, every review |
|---|---|---|
| **Thoth** | Data & analytics | **Enumerate the class.** Count every call site on the path that can throw, reject or hang, and report the count. A review without that count is incomplete. |
| **Odin** | Predictive | **The invariant and its gate.** Is the guarantee structural or a convention one refactor can undo? |
| **Enki** | Edge cases | The untested role and the partial state: the second signer, item 2 of 3, the reload mid-flight. |
| **Athena** | Test strategy | **Does the proof reproduce the USER's environment**, or the author's theory of the bug? Name what is still unproven. |
| **Thor** | Risk & security | Does any fallback hand out something a refusal should have withheld? Never trade safety for the happy path. |
| **Krishna** | Integration | Every consumer of the changed thing, including the proof scripts and other cubes. |
| **Christo** | User flow | What the person actually sees and whether the wording is honest about what happened. |
| **Aset** | Consistency | Do all paths to the same outcome produce the same panel, the same controls, the same names? |
| **Enlil** | Build & gates | Would every gate still pass if the fix were deleted? If yes, say so plainly; that is a finding. |
| **Asar** | Outcome | Did the operator get his result, and what is honestly still outside our control? |
| **Pangu** | Framing | Is the fix at the right altitude, or is it a patch where a rule belongs? |
| **Sofia** | Multi-perspective | 33 languages, 375 px, touch targets, right-to-left, orphaned keys. |

## The MoT ruling
The Master of Thought does not summarise the twelve. It answers one question: **is this a class or an instance?** If any
reviewer names a failure point on the path that the change does not cover, the ship is refused and the enumeration is redone.

## Verdicts
`WORKING` · `NOT WORKING: <what>` · `PROCEED WITH CHANGE: <what>`. A reviewer who cannot cite `file:line` or a line from the run
log has not reviewed. Findings are folded into the plan before the code, and each one is answered in the commit body.

## The standard the operator set
> "Each AsM needs to do AAR and assess why it's taking so long to restore prior implemented functionality."

A review that finds nothing on a change that later fails is itself a defect, and it is recorded as one.
