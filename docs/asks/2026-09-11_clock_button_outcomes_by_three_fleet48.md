# Operator instructions — 2026-09-11 · the clock as a button, outcomes by three, the task plan, the 48-agent fleet

## Verbatim, in the order received

1. > execute meeting my needs; button should start and end clock, and then allownfor outcomes inkuts by 3 members; test entire workflow

2. > execute and meet my needs; review feedback; incorporate all feedback, button should start and end clock, and then allownfor outcomes inputs by 3 members; adding additional time test entire workflow

3. > Master of Thought — activate full 48-agent fleet now.
   > Structure:
   > • 12 Master of Thought (MoT) agents
   > • 36 specialist agents organized as 3 agents per AsM
   > • Grouped into fleet pods of 4 AsMs each (3 × 4 = 12 agents per pod)
   > For every AsM:
   > • Spin up exactly 3 agents
   > • All 3 generate independent work/feedback
   > • Designate one of the three as Voting & Summarizer agent
   > • That agent collects the other two agents' outputs, votes, synthesizes, and produces the single final AsM feedback package
   > 12 MoTs operate in parallel as senior coordinators across the fleet pods. All 48 agents are live and ready. Begin processing existing backlog under this exact hierarchy. Report only fleet readiness confirmation and any residual gaps.

4. > Master of Thought: use POD SOI-2525 and vision-2525 as a test to showcase the first universal system that highlights inout in time and authorize local min wage for value (so we can solve together).

5. At plan review:
   > you need M, every task gets an M, accepted by scope of work or by team before starting task,
   > Remember below?
   followed by `unit.multiples` and `unit.ceiling` in full — already persisted verbatim at
   `docs/asks/2026-09-10_published_band_table_verbatim.md` (sha256 c808c6caea7758d8); not duplicated here.

6. At plan review:
   > yes, Innovation Pod Mints M have AsM comment in 111 words per AsM

7. At plan review:
   > Basically task gets plan so we can measure plans actual in time and HI TOKEN. This can be predetermined or established by POD UPON working together on a project

Earlier and still standing: *"tracking time is key to this from start and stop of session"*; *"intake all feedback before planning; as you have some unread inputs related to min wage per regions."*

## The interpretations the plan makes — stated so they can be corrected

1. **"button should start and end clock"** — one explicit control that starts the platform clock on press and ends it on press. The clock no longer starts by side-effect on a phase change.
2. **"adding additional time"** — after a stop, the same control starts the clock again; the measured span is the sum of every segment. `unit.ceiling`: "MoT and Replay preserve every recorded minute."
3. **"outcomes inputs by 3 members"** — the record phase carries one outcome per member, own-seat-only, all three required before audit. The lead's shared record stays as the pod's summary.
4. **"every task gets an M … task gets plan"** — the task carries a plan {hours, M, planned 웃 = M × hours}, predetermined by the task definition or set by the pod at agreement; accepted by all three before Start; locked with the baseline; unchangeable after the first clock start. The receipt shows planned vs actual in time and in 웃.
5. **"AsM comment in 111 words per AsM"** — the house 12 × 111 / MoT 333 contract, mechanically counted; emission refused on any miscount.

## Feedback intake — the unread inputs, and where each lands

| Input | Source | Disposition |
|---|---|---|
| D9 second half: settlement takes the greater of the vintage rate and the current rate, same jurisdiction | `unit.regional` r272 | Build |
| Relocation: keep the earning jurisdiction's vintage by default; converting is an explicit election | `unit.regional` r272 | Build |
| The anchor is the posted minimum of the region the contributor lives in, not the wider country; `hi_rates.py` is "the live settlement table" | `fund.token` r272 | Build — 50 US states + 9 countries merged into the pod's jurisdictions |
| `frontend/lib/min-wage.ts`, `/api/geo` auto-detect, `REGION_OPTIONS`/`detectRegion`, used by `seed-membership.tsx` | repo | Reuse; my `pod-rates.ts` picker duplicated it — a NO REWORK violation |
| Cambodia in both existing tables, absent from the operator's 103 | repo vs table | Merge in with source noted; flagged |
| Mexico 1.43 USD vs 39.380 MXN → implied 27.5 MXN/USD | reconciliation | Flag only; no published figure is edited |
| Q2: no posted minimum → no invented floor (operator, explicit) | `open.questions` | Already honoured; gated |
| D1 Tier-2 selection rule, D2 Global Agreed Standard — open since r57, "Blocks operation" | `open.decisions` | Operator's decisions; shown as unsettled proposals, nothing settles |
| Grok #15: say plainly a price moves only because a statutory wage moved | `open.external` | Copy line on the settlement panel |
| Mobile-strip Stop appends no stop event | sweep | Fix — one stop path |
| `synthesizePodOutcome` carries no clock to the backend | sweep | Fix — segments ride both payloads |
| Backend `hours_to_hi()` mints `hours × 4.807`, no M | sweep | Out of scope by the operator's earlier pod-only ruling; recorded |

## Provenance
Received 2026-09-11. Persisted before any code, per PERSIST FIRST (AAR 2026-08-28).
