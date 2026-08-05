# Version 17 — running list of asks, answers and clarifications
**Master of Thought · 2026-08-05 · standing at r72**

> Superseded in part by **`docs/V17_OPEN_QUESTIONS_REGISTER.md`**, which is the durable register
> and carries the externally-reviewable questions. This file stays as the session record.

Every ask you have made this session, what state it is in, and the questions I need answered.
Ordered by what blocks the most.

---

## ⛔ BLOCKING — I need these before the writing can finish

### B1. The Seed Token divisor — 7 or 7.25? *(highest impact, affects every number in the document)*

Your words: *"Seed Token is no longer $1 it is Min wage / 7. **For texas that is 1/7.25.** For nigeria 0.34 / 7 so buy in is equivalent."*

Those two cannot both be true:

| Rule | Texas ($7.25/hr) | Nigeria ($0.34/hr) | Slice of an hour |
|---|---|---|---|
| **÷ 7** — what I shipped | $1.0357 | $0.0486 | 1/7 = **8m 34s** |
| ÷ 7.25 | $1.0000 | $0.0469 | 1/7.25 = 8m 17s |

**I implemented ÷ 7 uniformly**, because it is the only reading where "buy in is equivalent" holds — the same slice of life everywhere, no country as the origin. It also matches your Nigeria example exactly (0.34 / 7). Under it Texas is **$1.04, not $1.00** — which is consistent with "no longer $1".

**→ Confirm: uniform ÷ 7, Texas at $1.04?** If you meant Texas keeps 7.25 as a special case, say so and I will revert — but then the buy-in is *not* equivalent and I would want to write that trade-off down.

### B2. Four classes of jurisdiction the rule cannot price
You asked me to test Dubai · Singapore · Beijing · Brazil · India · Moscow. **Only Brazil resolves.** The other five fail in four different ways — this is the real result, and it is now written into the document rather than smoothed over.

| Failure | Who | What breaks |
|---|---|---|
| **1 · No anchor** | Dubai (UAE), Singapore | No statutory minimum wage at all. Nothing to divide. Singapore is worse: sector ladders would price a cleaner and not a clerk. |
| **2 · Wrong unit** | Beijing | A municipal minimum exists; there is no national one. The rule asks a country for a number only a city can answer. |
| **3 · Not one number** | India | Minimums by state, sector *and* skill category. Hundreds of lawful answers; picking one is a policy act we have no standing to perform. |
| **4 · Two floors** | Moscow | Federal floor plus regional supplement. Both statutory, and they disagree. |

The rule assumed every country has one statutory minimum wage. **Two of six have none, one has it at city level, one has hundreds, one has two.** That is most of the world, not an edge case.

**→ Decide for each class:** (a) no anchor → cannot join until a floor exists (the §15 flywheel, honest but excludes Dubai and Singapore today); (b) use the lowest lawful rate in the jurisdiction; (c) use a published external index; (d) let the local pod declare a floor and record who declared it.
*My recommendation: (a) for class 1 — it is the argument you already own. (b) for classes 2–4, because "lowest lawful" is checkable and never overstates.*

### B3. §7 reserve refund — cap it at contribution?
r70 states the refund is **capped at what was contributed, never a cent more** — that is what makes it a refund and not a profit, and it is the strongest single line against a securities finding. **§7 has not been rewritten to match**, so today the document says two things.
**→ Confirm the cap so §7 can be brought into agreement.**

---

## ✅ DONE this session — shipped, gated, pushed

| # | Ask | Where |
|---|---|---|
| 1 | *"You know someone who is wasted"* reads as drunk | r68 → *"the world is wasting"*; v22 preserved |
| 2 | Key Improvements panel blank | r68 — `improvements()` read one view, not the record. Defect reached back to **r40**, 72 pairs |
| 3 | Remove `/main/Vision-2525` | r69 — route + both stubs **deleted** |
| 4 | *"we dont see versions 1-62 at bottom"* | r69 — 68 chips → **2**, all 68 reachable behind a disclosure that must start closed |
| 5 | *"v.17 upper right, not mixed with header"* | r69 — masthead corner badge |
| 6 | Direct link to the Outline | r69 — Outline button in the reader bar |
| 7 | *"do not let this be stopped by the SEC"* | r70 — **non-transferable · refund capped · no gain possible**, plus "design intent, not a legal opinion" |
| 8 | Minimum wage flywheel | r70 — a state that sets a floor makes its own people countable |
| 9 | Seed Token = min wage / 7 | r71 — dollar anchor withdrawn, 8m 34s everywhere |
| 10 | Test the six jurisdictions | r71 — four failure modes found and published |
| 11 | Write to `/Vision-2525/white-Paper` not `/main/…` | r71 — **every casing lands**: `/vision-2525/white-paper` is the home; `/Vision-2525/white-Paper`, `/Vision-2525/White-Paper` and `/Vision-2525/` all forward |

---

## 🔶 NOT DONE — owed for Version 17, named rather than implied

| Ask | State |
|---|---|
| **33 passes** | **0 of 33.** r68–r71 are pre-pass work. The passes are defined and gated but have not run |
| **19 sections expanded to full idea completion** | Not started. Still ~360 words each, 18 of 20 written in one v54 sweep |
| **Readability band 11–13** | **4 of 20 in band** · 15 above the ceiling · §19 below the floor at 9.2. Unchanged |
| **New cover image** | Not embedded |
| **MoT eagle emblem** | Not embedded — it is white-on-transparent, so it needs a dark ground or it vanishes on the light page |
| **Cambodia · Honduras · Austin as named hubs** | In the rate table; not yet written as the three-hub argument |
| **12 AsM at exactly 111 words + MoT at 333** | Not written |
| **V18 Pod composition in code** | Not started |
| **V19 Flower of Life** | Not started |

---

## 📋 The ten decisions still blocking, unchanged since r57

Tier-2 selection · Global Agreed Standard · band criteria · principal floor · the five shutdown
thresholds · reserve fork · Accords caps · **defect 22** · membership tier delineation ·
**rotate the master credential**

**The credential one is not paperwork.** The publish script refuses to ship if it finds the master
PIN in the document. Rotate it before first real use.

---

## Two things I got wrong, recorded

1. I told you seventeen sections *"share one rationale line — Four independent reviews of release 52."* **Wrong.** My probe used a fixed 200 KB window and read into a neighbouring block. The real defect is *templated* rationales — "Section N rebuilt as…" with the digit swapped — which means the gate I had drafted would have passed vacuously.
2. r70 was committed with `git add -A docs`, which missed `frontend/public/whitepaper/vision-2525.html` — **the only copy the site serves.** Your stop hook caught it. Had it stood I would have reported r70 shipped while the site served r69.

---

## Standing

```
SHA at time of writing   r71
committed ✓   pushed ✓ main + claude/debug-wsl-issues-yYdPP
LIVE          UNVERIFIED — the sandbox proxy 403s every host
              https://exel-ai-polling.explore-096.workers.dev/vision-2525/white-paper
```

**Answer B1, B2 and B3 and I can finish the writing.** B1 in particular gates every number in the
document, and I would rather hold than reprice it twice.
