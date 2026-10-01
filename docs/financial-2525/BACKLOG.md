# Financial-2525 — Backlog of every ask

Operator 2026-10-01 (addendum 82): *"you need ton document new asks in backlog every ask"*.

**The law.** Every operator ask is written here when it arrives. Each row carries his words, the revision that answers it, and
its state. The ask file (`docs/asks/2026-09-30_financial_2525_mot_financial_system.md`) keeps the verbatim record and its hash.
This file is the working list, so no ask is asked twice.

**States, never collapsed:** OPEN (not built) · PUSHED (on both branches, not yet served) · LIVE (Verify Live passed on its SHA,
or he reported it live).

Live URL: https://exel-ai-polling.explore-096.workers.dev/financial-2525

## Open and in-flight (newest first)

| # | His words (verbatim, shortened only with …) | Addenda | Answer | State |
|---|---|---|---|---|
| B-23 | "Green positive: Show “Net • Upside / Savings” / Red negative: Show “Net • Downside / Risk”" | 94 | r.045: the Net label follows its sign. | OPEN |
| B-22 | "Available and Accrual Rate should be same line, same size text" (sent twice) | 93 | r.044: labels on one line; $ figures on the next, same size. | LIVE (Verify Live #2171) |
| B-21 | "remember all 30.3 changes to 30" | 92 | r.046: the month law — 30-day month, quarter = 3 × 30 + 1 down day, no 30.3̅ anywhere. | OPEN |
| B-20 | "have Measure of time same color as eXeL … A Universal Standard same color as AI" | 90 | r.043: the subtitle in the wordmark's two colours. | LIVE (Verify Live #2171) |
| B-19 | "add currency to drop down settings in Accrual section … ensure all financials with min wage exist in this" | 86 | A currency dropdown in the Accrual gear: every currency of a country in the minimum-wage table. His answer (87): label only — the symbol replaces $, else a gray label under ACCRUAL UNITS. r.044. | OPEN |
| B-18 | "remove dollar sign … place $ in Amount, and place + and - at far left so numbers can right justify" | 86 | Record: header "Amount, $"; sign far left; number right-justified; green/red kept; no $ in any table cell (88, 89 — sent twice). Folded into r.043. | LIVE (Verify Live #2171) |
| B-17 | "change Fitness to Fitness & Health" | 85 | r.043: the budget line reads "Fitness & Health". | LIVE (71cff4b on his phone) |
| B-16 | "make singgle line … 14:43:53 elapsed · $0.0898 /min · $0.0015 /sec" | 84 | r.043: the Accrual gear's two lines become one. | LIVE (71cff4b on his phone) |
| B-15 | "finally; how many times do I have to ask to move transactions button around" (his phone at 11:24 still served cce6905 = r.041) | 83 | Same answer as B-13: r.042 carries the swap. LIVE only when the footer reads r.042 or later. | LIVE (his "looks good now") |
| B-14 | "document new asks in backlog every ask" | 82 | This file. Every new ask gets a row in the same commit that persists it. | PUSHED |
| B-13 | "Move transaction left of settings and move accrual rate to right of Available · swap these two". Asked seven times: "+ Transaction button" (38) · "one primary at top" (66) · "smaller transaction button in box with accrual units" (70) · "placing smaller version at bottom of accrual section" (76) · "switch Transaction button with Accrual rate and make same height as settings" (76) · "switch transaction button and accrual rate" (76) · "Line 1: Accrual Unit, +Transaction, Settings / Line 2: Available and accrual rate" (78) · the swap (81) | 38, 66, 70, 76, 78, 81, 82 | **r.042 (15d9ee2).** Line 1: ACCRUAL UNITS · + Transaction · gear, both 32 px tall. Line 2: Available left, Accrual Rate right. His phone screenshot of 2026-10-01 shows r.041, the build still served. | LIVE (his "looks good now") |
| B-12 | "replace ◬ ♡ 웃 with trinity logo (without any text) … 1/3rd size … when clicked, expand Trinity to current size with text" · "Grows in place at the top" | 78, 80 | r.042: a 63 px logo in the top bar, 190 px with labels on tap. The bottom wheel is removed. | LIVE |
| B-11 | "move globe first and settings to right" · "the top takes up too much space; this is my third request" · "entire header needs to be overall smaller" | 76 | r.042: globe then settings; the header is 109 px (was 159). | LIVE |
| B-10 | "Income from my record" (budget) | 80 | Next revision: budget Income reads his recorded deposits, not the example sheet. | OPEN |
| B-09 | "remove all 33.3 mentions / quarter is 91 days where 30 day is month and 1 day is down day … Standard Month (Gregorian) and Month • 30 day" · old entries "switch to 30" | 76 | The month law: 30-day month; quarter = 3 × 30 + 1 down day; 30.3̅ removed everywhere. His deposits then accrue at $5.4507/hr. | OPEN |
| B-08 | "On settings wheel non-eXeL AI, create Master and non-Master … non-Master needs 3 items / language /color / Atlantis Accords / Vision-2525 … Make sure Financial-2525 used non-Master settings wheel" | 76 | A non-Master settings panel with exactly those three items. Financial-2525 mounts it; the navbar keeps Master. | OPEN |
| B-07 | ◬ ♡ 웃 still at the footer's end (raised by the r.042 review, not by him) | — | Question to him: remove them from the footer too? | QUESTION |
| B-06 | Open logo's ring labels are small (≈8 px) (raised by the r.042 review) | — | Question to him: make them larger? | QUESTION |
| B-05 | r.041 review defects: CST vs CDT labels, date-axis clipping, svg `height="auto"` console error, the "Balance view" text | 79 | Fixed one revision at a time after B-08, each reviewed before push. | OPEN |

## Delivered (LIVE)

| # | His words | Addenda | Revision | State |
|---|---|---|---|---|
| D-12 | "THE RECORD · CHAIN VERIFIED · 3 becomes … TRANSACTION RECORD" | 76 | r.041 (daace84) | LIVE (#2158) |
| D-11 | "call this: REAL-TIME FINANCIALS" | 76 | r.041 | LIVE |
| D-10 | "reducing each entry on line … fitness" (one line per budget entry) | 75 | r.040 (61a563d) | LIVE (#2155) |
| D-09 | "Measure of Time: A Universal Standard" on one line · "Standard Month" | 74 | r.039 (962d058) | LIVE |
| D-08 | "get rid of this" (step rail) · "Accrual, Budget, Charts" · year card folded, either Gregorian or A.B..C | 72, 73 | r.038 (ddedbe6) | LIVE (his report) |
| D-07 | "place smaller transaction button in box with accrual units. remove big pink transaction button" | 70 | r.037 (superseded by B-13) | LIVE |
| D-06 | Release notes with screenshots every release | 71 | r.037 onward; page https://claude.ai/artifact/QeHrRp36vDhR1avnj4UF5K | LIVE |
| D-05 | No 180-min hold; one + Transaction; Accrual Units card; chart gear (date + angle); Record folded; year table | 57, 58 | r.028–r.036 | LIVE |
| D-04 | + Transaction folded, Type blank, withdrawals at $/min; budget one Unit; rate dropdown; chart, wheel, 30.3̅, subtitle | 36–55 | r.023–r.027 | LIVE |
| D-03 | Personal Finance Ladder A–U, one transaction form, MoT length dropdown, pickers stay open, icons, edit mode, nothing floats, grouped budget, 2 × 2 figures | 22–35 | r.012–r.022 | LIVE |
| D-02 | 365-day year = 3600 A, per-planet LTU table, MoT ⇄ Clock toggle, categories, budget table + unit dropdown, exact revolution | 11–21 | r.005–r.011 | LIVE |
| D-01 | The MoT Financial System: perihelion calendar, $/min escrow, A.B..C, the Session shell, Trinity wheel | 1–10 | r.001–r.004 | LIVE |

Each row's full wording is in the ask file; its reading item (1–83) names the decision.
