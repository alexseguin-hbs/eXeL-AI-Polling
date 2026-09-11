# POD time documented — volunteer (♡) vs paid (웃), against the agreed task

*Generated 2026-09-11 by `frontend/scripts/pod-time-report.mjs` from the shipped functions — `pod-clock.ts`,
`pod-yug.ts`, `pod-baseline.ts`, `pod-rates.ts`, `abc-3600.ts`. Fixed timestamps; reproducible; nothing restated.*

*This is a COMPUTED SCENARIO — fixed inputs through the shipped code — not the live run. The three-phone run's own
numbers (24 seconds of clocked segments, claims capped to 0.01 h) are in `docs/assessments/pod-live-run-2026-09-11/log.txt`.
"Planned hours" here and in the pod are PERSON-HOURS across the trio, the quantity the mint and the accelerator read.*

## 1 · The agreed task, and its plan — accepted by all three before the clock

| | |
|---|---|
| Intent | Showcase: input in time, and local minimum wage authorizing value. |
| Measurable outcome | Two clocked segments, three outcomes, three currencies on one receipt. |
| **Plan** | **2 h at 3× = 웃 6.000** (`6.0000..0000`), set by the pod, signed by Bo at 2026-09-11 08:55:00Z, hash `8f68f4a5d3104310…` |
| Outcomes, one per member | **Lea:** Framed the plan and ran the clock · **Ana:** Elected Lagos and stopped the clock · **Bo:** Elected Manila and witnessed |

## 2 · Input in time — the clock, from Start to Stop, every segment

The clock is a button. Start opens a segment, Stop closes it, Add time opens another; the measured span is the **sum**.
A closed segment is never reopened, shortened or merged (`unit.ceiling`: "MoT and Replay preserve every recorded minute").

| Segment | Start | Stop | Duration | Ledger grammar |
|---|---|---|---|---|
| 1 | 2026-09-11 09:00:00Z | 2026-09-11 09:40:00Z | 0:40:00 | `0.2400..0000` |
| 2 | 2026-09-11 10:00:00Z | 2026-09-11 10:35:00Z | 0:35:00 | `0.2100..0000` |
| **Total** | 2026-09-11 09:00:00Z | 2026-09-11 10:35:00Z | **1:15:00** | **`1.0900..0000`** |

Clocked: **1.2500 h · 75 whole minutes**. The gap between the segments (09:40 → 10:00) is not counted.

## 3 · Claims, capped to what was clocked; each contributor at their own floor

웃 = M × T with the accepted M = 3. A claim can never exceed what the platform witnessed (`supported()`).
The same hours mint the same 웃 everywhere; **only what a 웃 settles as is local** — each member's own elected floor, in their own currency, never converted.

| Member | Elected place | Claimed | Counted | Capped? | 웃 = 3 × counted | Settles as | D9 |
|---|---|---:|---:|:--:|---:|---|---|
| Lea | United States — Austin, Texas (7.25 USD/h) | 1.25 h | 1.2500 h | no | **3.750** `3.2700..0000` | **$27.19** | vintage = current |
| Ana | Nigeria (402.739 NGN/h) | 1.50 h | 1.2500 h | **yes** | **3.750** `3.2700..0000` | **NGN 1,510.27** | vintage = current |
| Bo | Philippines — Metro Manila (86.875 PHP/h) | 1.00 h | 1.0000 h | no | **3.000** `3.0000..0000` | **₱260.63** | vintage = current |

Ana claimed 1.50 h against a 1.25 h clock: counted **1.2500 h**, flagged capped. Nothing was silently trusted.

## 4 · Plan → actual, in time and in 웃 (Cube 27 inside the pod)

| | Planned | Actual | Δ |
|---|---:|---:|---:|
| Person-hours witnessed | 2.00 h | 3.5000 h | +1.5000 h |
| 웃 (M × T at 3×) | 6.000 `6.0000..0000` | 10.500 `10.1800..0000` | +4.500 |
| Payable this year (ceiling 9999) | | 10.500 | carried 0.000 |
| Wage-floor tranche (1×, drawn now, never clawed back) | | 3.500 | |
| Held at 3× until the work qualifies | | 7.000 | |
| ◬ against the locked plan (six conditions) | | 0.000 | delta -1.500 h |

## 5 · Volunteer vs paid — a minute is ♡ OR 웃, never both (`unit.aitoken`)

The same 75 clocked minutes, counted the two ways the paper allows. The outcome ladder (D12: none 0 · noted 1 · adopted 3 · foundational 7) is awarded by the pod afterwards and is independent of the clock; here the pod awarded **adopted**.

| | **Paid pod (settles 웃)** | **Volunteer pod (settles nothing)** |
|---|---:|---:|
| Minutes clocked | 75 | 75 |
| 웃 minted from those minutes | **10.500** | 0 |
| ♡ from those minutes | **0** — they settled as 웃 | **75** — one ♡ per witnessed minute |
| ♡ from the outcome ladder (adopted) | 3 | 3 |
| **♡ total** | **3** | **78** |
| Settles as (Lea · Ana · Bo) | $27.19 · NGN 1,510.27 · ₱260.63 | — |

No minute appears in both columns. `heartsFor({ settles웃 })` is the single switch, and the gate asserts it.

## 6 · What this shows — the two claims of the showcase

1. **Input in time.** Every minute from Start to Stop, across two segments, is on the record in `h:mm:ss` and in
   `N.mmmm..ssss`; a claim above the clock was capped and said so.
2. **Local minimum wage authorizes value.** Lea, Ana and Bo minted the same 웃 for the same counted hours (M × T,
   currency-free); each settled at their own elected floor in their own currency — USD, NGN, PHP — never converted, and
   D9 paid the greater of the vintage and the current rate from the same jurisdiction's table.
