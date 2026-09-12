// pod-time-report.mjs — TIME DOCUMENTED: volunteer (♡) vs paid (웃) against the agreed task, from the SHIPPED functions.
//
// Operator (2026-09-11): "output of time documented for volunteer vs paid HI tokens to agreed to task … tracking time
// is key to this from start and stop of session". Every number below is produced by lib/pod-clock.ts, lib/pod-yug.ts,
// lib/pod-baseline.ts and lib/pod-rates.ts — the same code the pod runs — with fixed timestamps so the document is
// reproducible. Nothing is computed twice here; a restated formula is how a wrong figure survives a correction.
//
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/pod-time-report.mjs
import fs from 'fs';
import { measure, supported, witnessedMinutes, witnessedHours, hhmmss, heartsFor } from '../lib/pod-clock.ts';
import { mint, standing, YUG_CEILING } from '../lib/pod-yug.ts';
import { lockBaseline } from '../lib/pod-baseline.ts';
import { findJurisdiction, settleInRegion, settleD9, formatLocal, usdEquivalent, formatUsd, USD_MISSING } from '../lib/pod-rates.ts';
import { format as abc } from '../lib/abc-3600.ts';
import { split, accelerate, noConditions } from '../lib/pod-baseline.ts';

const OUT = process.env.OUT || '../docs/assessments/2026-09-11_pod_time_volunteer_vs_paid.md';
const T = (h, m, s = 0) => Date.UTC(2026, 8, 11, h, m, s);   // 2026-09-11, UTC, fixed
const iso = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 19) + 'Z';

// ── THE AGREED TASK AND ITS PLAN — accepted by all three before the clock ──────────────────────────────────────────
const task = {
  intent: 'Showcase: input in time, and local minimum wage authorizing value.',
  outcome: 'Two clocked segments, three outcomes, three currencies on one receipt.',
};
const plan = await lockBaseline({ id: 'SHOWCASE-1', version: 1, scope: task.outcome, hours: 2, m: 3, source: 'pod', signedBy: 'Bo', signedAt: iso(T(8, 55)) });

// ── THE CLOCK — one button, two segments, summed. Start 09:00, Stop 09:40, Add time 10:00, Stop 10:35 ────────────
const events = [
  { kind: 'start', at: T(9, 0), by: 'pod' }, { kind: 'stop', at: T(9, 40), by: 'pod' },
  { kind: 'start', at: T(10, 0), by: 'pod' }, { kind: 'stop', at: T(10, 35), by: 'pod' },
];
const span = measure(events, T(11, 0));

// ── THE THREE — each claims, each is witnessed, each elects their own floor ─────────────────────────────────────────
const members = [
  { name: 'Lea', region: 'English:US',  claim: 1.25, outcome: 'Framed the plan and ran the clock' },
  { name: 'Ana', region: 'Portuguese:BR', claim: 1.50, outcome: 'Elected Brazil and stopped the clock' },    // above the clock → capped
  { name: 'Bo',  region: 'Filipino:PH', claim: 1.00, outcome: 'Elected Metro Manila and witnessed' },
];
const rows = members.map((m) => {
  const sup = supported(m.claim, span); const j = findJurisdiction(m.region);
  const yug = mint(sup.hours, plan.m); const cash = settleInRegion(yug, j);
  // The vintage is stamped at EARNING with this person's elected floor; the current rate here is the same table at settlement,
  // so in this scenario the two are equal — the D9 column says so plainly rather than implying a comparison happened.
  const d9 = settleD9(yug, { rate: j?.rate ?? null, currency: j?.currency ?? null }, j);
  // THE USA EQUIVALENT, by a traceable route or not at all (operator 2026-09-12): same currency; a dated FX row; or
  // hi_rates.py's own USD floor × 웃 — named as a second floor, never as a conversion of the local amount.
  const usd = usdEquivalent(cash, j?.currency ?? null, yug, j);
  return { ...m, sup, j, yug, cash, d9, usd };
});
const witnessedTotal = rows.reduce((s, r) => s + r.sup.hours, 0);
const actualYug = mint(witnessedTotal, plan.m);
const stand = standing(0, actualYug);
const accel = accelerate(plan, witnessedTotal, { ...noConditions(), scheduleImproved: true, scopePreserved: true, qualityHeld: true, riskNotWorse: true, ssses: true, humanAccepted: true });
const tranches = split(witnessedTotal, plan.m, accel);

// ── ♡ OR 웃, NEVER BOTH (unit.aitoken) — the settling pod, and the same session run pure-volunteer ─────────────────
const rung = 'adopted';
const heartsPaid = heartsFor({ settles웃: actualYug > 0, measured: span, rung });
const heartsVolunteer = heartsFor({ settles웃: false, measured: span, rung });
const minutes = witnessedMinutes(span);

const md = `# POD time documented — volunteer (♡) vs paid (웃), against the agreed task

*Generated 2026-09-11 by \`frontend/scripts/pod-time-report.mjs\` from the shipped functions — \`pod-clock.ts\`,
\`pod-yug.ts\`, \`pod-baseline.ts\`, \`pod-rates.ts\`, \`abc-3600.ts\`. Fixed timestamps; reproducible; nothing restated.*

*This is a COMPUTED SCENARIO — fixed inputs through the shipped code — not the live run. The three-phone run's own
numbers (24 seconds of clocked segments, claims capped to 0.01 h) are in \`docs/assessments/pod-live-run-2026-09-11/log.txt\`.
"Planned hours" here and in the pod are PERSON-HOURS across the trio, the quantity the mint and the accelerator read.*

## 1 · The agreed task, and its plan — accepted by all three before the clock

| | |
|---|---|
| Intent | ${task.intent} |
| Measurable outcome | ${task.outcome} |
| **Plan** | **${plan.hours} h at ${plan.m}× = 웃 ${plan.yug.toFixed(3)}** (\`${abc(plan.yug)}\`), set by the pod, signed by ${plan.signedBy} at ${plan.signedAt}, hash \`${plan.hash.slice(0, 16)}…\` |
| Outcomes, one per member | ${rows.map((r) => `**${r.name}:** ${r.outcome}`).join(' · ')} |

## 2 · Input in time — the clock, from Start to Stop, every segment

The clock is a button. Start opens a segment, Stop closes it, Add time opens another; the measured span is the **sum**.
A closed segment is never reopened, shortened or merged (\`unit.ceiling\`: "MoT and Replay preserve every recorded minute").

| Segment | Start | Stop | Duration | Ledger grammar |
|---|---|---|---|---|
${span.segments.map((g, i) => `| ${i + 1} | ${iso(g.startedAt)} | ${iso(g.stoppedAt)} | ${hhmmss(g.stoppedAt - g.startedAt)} | \`${abc((g.stoppedAt - g.startedAt) / 3600000)}\` |`).join('\n')}
| **Total** | ${iso(span.startedAt)} | ${iso(span.stoppedAt)} | **${hhmmss(span.ms)}** | **\`${abc(witnessedHours(span))}\`** |

Clocked: **${witnessedHours(span).toFixed(4)} h · ${minutes} whole minutes**. The gap between the segments (09:40 → 10:00) is not counted.

## 3 · Claims, capped to what was clocked; each contributor at their own floor

웃 = M × T with the accepted M = ${plan.m}. A claim can never exceed what the platform witnessed (\`supported()\`).
The same hours mint the same 웃 everywhere; **only what a 웃 settles as is local** — each member's own elected floor, in their own currency, never converted.

| Member | Elected place | Claimed | Counted | Capped? | 웃 = ${plan.m} × counted | Settles as | USA equivalent | D9 |
|---|---|---:|---:|:--:|---:|---|---|---|
${rows.map((r) => `| ${r.name} | ${r.j.name} (${r.j.rate} ${r.j.currency}/h) | ${r.claim.toFixed(2)} h | ${r.sup.hours.toFixed(4)} h | ${r.sup.capped ? '**yes**' : 'no'} | **${r.yug.toFixed(3)}** \`${abc(r.yug)}\` | **${formatLocal(r.cash, r.j.currency)}** | ${r.usd ? `${formatUsd(r.usd.usd)} (${r.usd.via === 'same-currency' ? 'same currency' : r.usd.via === 'fx' ? `rate of ${r.usd.asOf}` : 'hi_rates.py USD floor × 웃, a second floor'})` : USD_MISSING} | ${r.d9.which === 'equal' ? 'vintage = current' : r.d9.which} |`).join('\n')}

Ana claimed 1.50 h against a 1.25 h clock: counted **${rows[1].sup.hours.toFixed(4)} h**, flagged capped. Nothing was silently trusted.

## 4 · Plan → actual, in time and in 웃 (Cube 27 inside the pod)

| | Planned | Actual | Δ |
|---|---:|---:|---:|
| Person-hours witnessed | ${plan.hours.toFixed(2)} h | ${witnessedTotal.toFixed(4)} h | ${(witnessedTotal - plan.hours) >= 0 ? '+' : ''}${(witnessedTotal - plan.hours).toFixed(4)} h |
| 웃 (M × T at ${plan.m}×) | ${plan.yug.toFixed(3)} \`${abc(plan.yug)}\` | ${actualYug.toFixed(3)} \`${abc(actualYug)}\` | ${(actualYug - plan.yug) >= 0 ? '+' : ''}${(actualYug - plan.yug).toFixed(3)} |
| Payable this year (ceiling ${YUG_CEILING}) | | ${stand.payableThisYear.toFixed(3)} | carried ${stand.carried.toFixed(3)} |
| Wage-floor tranche (1×, drawn now, never clawed back) | | ${tranches.floor.toFixed(3)} | |
| Held at ${plan.m}× until the work qualifies | | ${tranches.escrow.toFixed(3)} | |
| ◬ against the locked plan (six conditions) | | ${accel.earned.toFixed(3)} | delta ${accel.delta.toFixed(3)} h |

## 5 · Volunteer vs paid — a minute is ♡ OR 웃, never both (\`unit.aitoken\`)

The same ${minutes} clocked minutes, counted the two ways the paper allows. The outcome ladder (D12: none 0 · noted 1 · adopted 3 · foundational 7) is awarded by the pod afterwards and is independent of the clock; here the pod awarded **${rung}**.

| | **Paid pod (settles 웃)** | **Volunteer pod (settles nothing)** |
|---|---:|---:|
| Minutes clocked | ${minutes} | ${minutes} |
| 웃 minted from those minutes | **${actualYug.toFixed(3)}** | 0 |
| ♡ from those minutes | **0** — they settled as 웃 | **${minutes}** — one ♡ per witnessed minute |
| ♡ from the outcome ladder (${rung}) | ${heartsFor({ settles웃: true, measured: span, rung })} | ${heartsFor({ settles웃: true, measured: span, rung })} |
| **♡ total** | **${heartsPaid}** | **${heartsVolunteer}** |
| Settles as (Lea · Ana · Bo) | ${rows.map((r) => formatLocal(r.cash, r.j.currency)).join(' · ')} | — |
| USA equivalent (Lea · Ana · Bo) | ${rows.map((r) => (r.usd ? formatUsd(r.usd.usd) : 'awaiting a dated rate')).join(' · ')} — only by a traceable route | — |

No minute appears in both columns. \`heartsFor({ settles웃 })\` is the single switch, and the gate asserts it.

## 6 · What this shows — the two claims of the showcase

1. **Input in time.** Every minute from Start to Stop, across two segments, is on the record in \`h:mm:ss\` and in
   \`N.mmmm..ssss\`; a claim above the clock was capped and said so.
2. **Local minimum wage authorizes value.** Lea, Ana and Bo minted the same 웃 for the same counted hours (M × T,
   currency-free); each settled at their own elected floor in their own currency — USD, BRL, PHP — never converted, and
   D9 paid the greater of the vintage and the current rate from the same jurisdiction's table.
`;
fs.writeFileSync(OUT, md);
console.log(`written ${OUT} — ${span.segments.length} segments, ${hhmmss(span.ms)}, 웃 ${actualYug.toFixed(3)} paid / ♡ ${heartsPaid} vs volunteer ♡ ${heartsVolunteer}`);
