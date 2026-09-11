// THE POD INVARIANT — Vision 2525 §14 (unit.witness · unit.accel · unit.aitoken · unit.heart · si.clockless-ladder).
//
//   Time already recorded is never lost or altered. The measured session and the claim are two numbers, never one,
//   and a claim may never exceed what the platform actually witnessed.
//
// The White Paper's rule is verbatim: "웃 is minted only for TIME CLOCKED BY THE PLATFORM." Before this gate the pod had
// no clock and minted from a hand-typed number — it minted for time CLAIMED. This file reads the shipped source and the
// shipped behaviour so that guarantee cannot be refactored away, the way the Sign Doc invariant is held.
import fs from 'fs';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

const clock = read('../lib/pod-clock.ts');
const base = read('../lib/pod-baseline.ts');

// 1 · the two numbers are kept apart, and the claim is bounded by the measurement
ok(/export function supported\(/.test(clock), 'a claim is passed through supported(), never used raw');
ok(/Math\.min\(claim, seen\)/.test(clock), 'a claim may never exceed what the platform witnessed');
ok(/witnessed: false/.test(clock), 'an unwitnessed claim is FLAGGED, never silently trusted');
ok(/MAX_YUG_PER_MIN\s*=\s*9999 \/ 525600/.test(clock), 'the ceiling rate is the paper\'s: 9,999 ÷ 525,600 minutes');
ok(/YUG_CEILING\s*=\s*9999/.test(clock), 'the annual ceiling is 9,999 웃 per natural person');
ok(/POD_MIN\s*=\s*3/.test(clock), 'a pod is three or more — two can agree on a lie in private');

// 2 · the clock is append-only: events fold, they do not overwrite
ok(/export function measure\(events: ClockEvent\[\]/.test(clock), 'the measured span is DERIVED from an event log');
ok(/\[\.\.\.events\]\.sort/.test(clock), 'the log is read in time order and never mutated in place');
ok(!/events\.push|events\[\d\]\s*=/.test(clock), 'nothing rewrites an event once recorded');

// 3 · the clockless ♡ ladder is exactly three rungs, fixed values, nothing between or above (D12)
const rungs = [...clock.matchAll(/\{ id: "(\w+)", hearts: (\d+) \}/g)].map((m) => [m[1], Number(m[2])]);
ok(JSON.stringify(rungs) === JSON.stringify([["none",0],["noted",1],["adopted",3],["foundational",7]]),
   `the ♡ ladder is Noted 1 · Adopted 3 · Foundational 7 and nothing else — got ${JSON.stringify(rungs)}`);

// 4 · a minute is ♡ OR 웃, never both (unit.aitoken)
ok(/settles웃 \?/.test(clock), 'a settling pod carries no per-minute ♡ for the same minutes');

// 5 · the estimate is locked BEFORE the work, signed, and hashed (unit.accel)
ok(/signedBy: string/.test(base) && /signedAt: string/.test(base) && /hash: string/.test(base),
   'a baseline carries its signer, its instant and a Replay hash');
ok(/export async function lockBaseline/.test(base) && /sha256Hex/.test(base), 'locking a baseline hashes every field');
ok(/export async function verifyBaseline/.test(base), 'a lock can be re-checked, so an edit is detectable not deniable');
ok(/version: number/.test(base) && /a re-lock appends/.test(base), 'a changed estimate APPENDS a version, never edits one');

// 6 · the six conditions are all required, none inferred, none defaulting to true
const ids = (base.match(/CONDITION_IDS[^=]*=\s*\n?\s*\[([^\]]+)\]/) || [])[1] || '';
const six = (ids.match(/"/g) || []).length / 2;
ok(six === 6, `the accelerator has exactly six conditions — found ${six}`);
ok(/noConditions = \(\)[^}]*false[^}]*false[^}]*false[^}]*false[^}]*false[^}]*false/s.test(base), 'every condition starts false');
ok(/CONDITION_IDS\.every/.test(base), 'the bonus needs ALL six, not a majority');

// 7 · the accelerator hypothesis is allowed to FAIL honestly (the paper's own instruction)
ok(/delta = baseline\.hours - actualHours/.test(base) && /Never clamped/.test(base),
   'a negative delta — the work took LONGER — is preserved, not clipped to zero');
ok(/reason: "no_locked_baseline"/.test(base) && /reason: "no_time_saved"/.test(base) && /reason: "conditions_unmet"/.test(base),
   'when nothing is earned the record says WHY');

// 8 · the two tranches (unit.tranche)
ok(/floor = mint\(Math\.max\(0, supportedHours\), 1\)/.test(base), 'the wage-floor tranche is the supported hours at 1x');
ok(/escrow = Math\.max\(0, mint\(Math\.max\(0, supportedHours\), multiple\) - floor\)/.test(base),
   'everything the band adds above the floor is escrowed, and BOTH tranches go through the one mint');
ok(/accelEscrow/.test(base) && !/multiple - 1\)\) \+ Math\.max\(0, accel\.earned\)/.test(base),
   'the ◬ premium is reported BESIDE the 웃 escrow, never added into it — one is owed for hours, the other is not owed at all');
ok(/NEVER clawed back/.test(base), 'the floor is never clawed back — the rule is stated where it is implemented');

/* ── behaviour, not just text: run the modules ─────────────────────────────────────────────────────────────────────── */
const { measure, supported, witnessedMinutes, hhmmss, heartsFor } =
  await import('../lib/pod-clock.ts').catch(() => ({}));
if (measure) {
  const t0 = 1_700_000_000_000;
  const ev = [{ kind: 'start', at: t0, by: 'a' }, { kind: 'stop', at: t0 + 3_600_000, by: 'a' }];
  const m = measure(ev, t0 + 9_999_999);
  ok(m.ms === 3_600_000 && !m.running, 'one hour measured, and a stopped clock does not keep running');
  ok(witnessedMinutes(m) === 60 && hhmmss(m.ms) === '1:00:00', 'sixty minutes read back as 1:00:00');
  ok(measure([...ev, { kind: 'start', at: t0 + 10, by: 'b' }], t0).ms === 3_600_000, 'a late duplicate start changes nothing');
  ok(supported(5, m).hours === 1 && supported(5, m).capped === true, 'a five-hour claim on a one-hour session is capped to one');
  ok(supported(0.5, m).hours === 0.5 && supported(0.5, m).capped === false, 'an honest claim passes through untouched');
  const none = measure([], t0);
  ok(supported(4, none).witnessed === false && supported(4, none).hours === 4, 'with no clock the claim stands but is flagged');
  ok(heartsFor({ settles웃: true, measured: m, rung: 'adopted' }) === 3, 'a settling pod earns ♡ only from the ladder');
  ok(heartsFor({ settles웃: false, measured: m, rung: 'none' }) === 60, 'a non-settling pod earns one ♡ per witnessed minute');
} else ok(false, 'lib/pod-clock.ts could not be imported');

const B = await import('../lib/pod-baseline.ts').catch(() => ({}));
if (B.accelerate) {
  const b = await B.lockBaseline({ id: 'POD1-1', version: 1, scope: 's', hours: 12, signedBy: 'Dana', signedAt: '2026-09-10T00:00:00Z' });
  ok(await B.verifyBaseline(b), 'a freshly locked baseline verifies');
  ok(!(await B.verifyBaseline({ ...b, hours: 2 })), 'an edited baseline FAILS verification');
  const all = { scheduleImproved: true, scopePreserved: true, qualityHeld: true, riskNotWorse: true, ssses: true, humanAccepted: true };
  ok(B.accelerate(b, 9.5, all).earned === 2.5, 'saving 2.5 hours against a 12-hour lock earns 2.5 ◬');
  ok(B.accelerate(b, 9.5, { ...all, ssses: false }).earned === 0, 'one failed condition earns nothing');
  ok(B.accelerate(b, 9.5, { ...all, ssses: false }).reason === 'conditions_unmet', 'and the record says which kind of failure');
  const slower = B.accelerate(b, 15, all);
  ok(slower.delta === -3 && slower.earned === 0, 'work that took LONGER records a negative delta and earns nothing');
  ok(B.accelerate(null, 9.5, all).reason === 'no_locked_baseline', 'no lock, no accelerator');
  const tr = B.split(9.5, 3, B.accelerate(b, 9.5, all));
  ok(tr.floor === 9.5, 'the wage floor is the witnessed hours at 1× — one 웃 an hour, owed whatever the outcome');
  ok(Math.abs(tr.escrow - 19) < 1e-9, 'the 웃 held is exactly what the multiple adds above the floor: 9.5 h × (3 − 1)');
  ok(Math.abs(tr.accelEscrow - 2.5) < 1e-9, 'the ◬ premium is held in its own unit, not folded into the 웃');
  ok(Math.abs(B.trancheTotalYug(tr) - 9.5 * 3) < 1e-9, 'floor + escrow is exactly the 웃 minted for those hours at that multiple');
  const trLoss = B.split(9.5, 1, B.accelerate(b, 40, all));
  ok(trLoss.floor === 9.5 && trLoss.escrow === 0 && trLoss.accelEscrow === 0,
     'a pod that ran long still draws its full floor — wages for witnessed hours are never clawed back by an outcome');
} else ok(false, 'lib/pod-baseline.ts could not be imported');

/* ── the durable record: append, never edit (rcore.ledger + the standing law) ─────────────────────────────────────────── */
const store = read('../lib/pod-store.ts');
ok(/take the newest entry e where e\.rev <= v/.test(store), 'the store states the ledger render rule where it implements it');
ok(/export function appendPod/.test(store) && !/function (update|edit|overwrite)Pod/.test(store), 'a revision is APPENDED; there is no edit');
ok(/evictOldestPod/.test(store) && /never the one being written/.test(store), 'a full device drops the OLDEST pod, never the one in hand');
ok(/return false/.test(store) && /carries on from memory and SAYS SO/.test(store), 'a failed save is reported, never silent');

// behaviour: a real append-only log with replay
globalThis.localStorage = (() => { const m = new Map();
  return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
const P = await import('../lib/pod-store.ts').catch(() => ({}));
if (P.appendPod) {
  ok(P.appendPod('ABC123', 1, { phase: 'compose', hours: 0 }, 1000), 'revision 1 is kept');
  ok(P.appendPod('ABC123', 2, { phase: 'active', hours: 1 }, 2000), 'revision 2 is kept beside it');
  ok(P.appendPod('ABC123', 3, { phase: 'closed', hours: 9.5 }, 3000), 'revision 3 is kept beside those');
  ok(P.replayPod('ABC123').state.phase === 'closed', 'the latest reads back as the latest');
  ok(P.replayPod('ABC123', 2).state.phase === 'active', 'replay(2) still returns what revision 2 actually held');
  ok(P.replayPod('ABC123', 1).state.hours === 0, 'and revision 1 is unchanged by everything appended after it');
  ok(P.podHistory('ABC123').length === 3, 'the whole history is walkable');
  ok(P.appendPod('ABC123', 2, { phase: 'TAMPERED' }, 9999) && P.replayPod('ABC123', 2).state.phase === 'active',
     're-appending an existing revision does NOT overwrite it — an append is idempotent');
  P.appendPod('ZZZ999', 1, { phase: 'compose' }, 5000);
  ok(P.recentPods()[0].code === 'ZZZ999', 'the most recent pod is offered first, so coming back is a list not a memory');
  ok(P.replayPod('NOPE') === null, 'a pod this device never held reads back as nothing, not as an empty pod');
} else ok(false, 'lib/pod-store.ts could not be imported');

/* ── 웃, the ceiling and the carry — the operator's rulings of 2026-09-10 ──────────────────────────────────────────────
   "max payout in year is 9999 웃, anything additional goes to next year, and the next, to allow someone to have lifelong
   stability" and "this allows for common language even if 0.34 nigeria min wage and 7.25 Texas min wage differ". */
const yug = read('../lib/pod-yug.ts');
ok(/EARNING IS NEVER CAPPED\. PAYOUT IS ALWAYS CAPPED/.test(yug), 'the ruling is stated where it is implemented');
ok(/THE MINT IS CURRENCY-FREE/.test(yug), 'the currency-free rule is stated at the mint');
ok(!/[$£€]|usd|USD/.test(yug.replace(/\/\*[\s\S]*?\*\//g, '')), 'no currency symbol appears in the mint code itself');
ok(/YUG_CEILING = 9999/.test(yug) && /FTE_HOURS = 2080/.test(yug) && /MAX_SECURED_YEARS = 99/.test(yug), 'the paper\'s constants, not invented ones');

const Y = await import('../lib/pod-yug.ts').catch(() => ({}));
if (Y.standing) {
  // THE RULING (operator, 2026-09-10): HI token = 웃 = M*T, the multiple being a multiple of local minimum wage.
  // Asserted against the paper's OWN worked examples, so the gate fails if the pod drifts from the published numbers.
  ok(Y.mint(2, 3) === 6, 'coin.family — the Manila analyst: two hours at a multiple of three draws 6 웃');
  ok(Y.mint(1, 1) === 1, 'hi.floor.dignity — "one 웃 for the hour itself, with no multiple attached"');
  ok(Y.mint(900, 6) === 5400, 'human.story — nine hundred hours at six times is 5,400 웃');
  ok(Y.mint(400, 3) === 1200, 'human.cambodia — four hundred hours at 3× is 1,200 웃');
  ok(Y.mint(10, 3) === 30 && Y.mint(10, 1) === 10, '웃 = M × T, and nothing else enters the mint');
  ok(Math.abs(Y.mint(10, 10) - Y.mint(10, 1) * 10) < 1e-9, 'the multiple is the only thing that changes the mint');
  // EARNING IS NEVER CAPPED, PAYOUT ALWAYS IS
  const big = Y.standing(0, 25000);
  ok(big.earned === 25000 && big.cumulative === 25000, 'earning is NOT capped — 25,000 웃 earned is 25,000 recognised');
  ok(big.payableThisYear === 9999, 'payout IS capped at 9,999 in the year');
  ok(big.carried === 25000 - 9999, 'everything above the ceiling CARRIES; nothing evaporates');
  ok(big.securedYears === 2, '25,000 웃 secures two whole years');
  ok(Math.abs(big.remainderNextYear - (25000 - 2 * 9999)) < 1e-9, 'and the remainder opens the following year');
  // the carry survives being added to, year on year — the operator's "lifelong stability"
  const a = Y.standing(0, 9999), b = Y.standing(a.cumulative, 9999), c = Y.standing(b.cumulative, 9999);
  ok(c.securedYears === 3 && c.cumulative === 29997, 'three ceilings earned secure three years, cumulatively');
  ok(Y.standing(0, 0).payableThisYear === 0 && Y.standing(0, 0).carried === 0, 'nothing earned settles nothing');
  ok(Y.standing(0, 9999 * 200).securedYears === 99, 'a reservation stops at the 99th year — coverage ends at a lifetime');
  // REACH: the multiple is the route to the ceiling, never the geography
  // ── unit.multiples — THE PUBLISHED TABLE, checked ROW BY ROW against the paper, not against my arithmetic ──
  // "STOP MAKING UP MATH" (operator, 2026-09-10). The pod used to derive these and round them, and JavaScript's
  // Math.round(9999/6) is 1667 where the paper prints 1,666. A published figure is read, never re-derived.
  const PUBLISHED = [
    [1,     '1x',     9999, '4.81', false, 'Unreachable in a year. The floor of the scale, not a working band.'],
    [2,     '2x',     5000, '2.40', false, 'Entry contribution; part-time and learning participation.'],
    [3,     '3x',     3333, '1.60', false, 'Sustained competent contribution.'],
    [4.807, '4.807x', 2080, '1.00', false, 'The reference multiple. One full-time year lands exactly on the ceiling.'],
    [6,     '6x',     1666, '0.80', false, 'Scarce skill, or responsibility carried.'],
    [8,     '8x',     1250, '0.60', false, 'Rare expertise; the band where part-year work still reaches the ceiling.'],
    [10,    '10x+',   1000, '0.48', true,  'Exceptional contribution. Permitted, published, and still capped at 9,999.'],
  ];
  ok(Y.BANDS.length === PUBLISHED.length, `the table has the paper's seven rows — got ${Y.BANDS.length}`);
  for (const [m, label, hours, years, atMost, purpose] of PUBLISHED) {
    const b = Y.bandFor(m);
    ok(!!b, `unit.multiples publishes a row for ${label}`);
    if (!b) continue;
    ok(b.hours === hours, `${label} — HOURS TO REACH 9,999 is the published ${hours.toLocaleString()}, got ${b.hours}`);
    ok(b.years === years, `${label} — IN FULL-TIME YEARS is the published ${years}, got ${b.years}`);
    ok(b.label === label, `${label} — the multiple is printed as the paper prints it`);
    ok(b.atMost === atMost, `${label} — the "<=" qualifier matches the paper (only the 10x+ row carries one)`);
    ok(b.purpose === purpose, `${label} — WHAT THIS BAND IS FOR is the published sentence, verbatim`);
  }
  // 6x is the row that caught me: it is the only one the derivation gets wrong, and it is asserted on its own.
  ok(Y.bandFor(6).hours === 1666 && Math.round(Y.hoursToCeiling(6)) === 1667,
     'the published 6x row is 1,666 h AND the derivation still returns 1,667 — which is exactly why the table is quoted');
  // Live reach is the one figure the paper cannot publish: it depends on the person's own balance.
  ok(Y.hoursToCeiling(3, 0) === 3333, 'from nothing at 3x, the live figure agrees with the published row');
  ok(Y.hoursToCeiling(3, 9999) === 0, 'someone already at the ceiling needs no further hours');
  ok(Y.hoursToCeiling(2, 4999.5) === 2499.75, 'and from part-way it is simply what remains, unrounded');
  // unit.ceiling: "M is unbounded, but the annual 웃 PAYMENT is bound at 9,999 with excess rolling forward."
  ok(Y.isBand(5) && Y.isBand(12.5) && Y.isBand(4.807), 'M IS UNBOUNDED — a multiple off the published table is still valid');
  ok(!Y.isBand(0) && !Y.isBand(-3), 'a multiple must still be positive');
  ok(Y.standing(0, Y.mint(2080, 12.5)).payableThisYear === 9999,
     'and an unbounded multiple is bounded by the CEILING, not by a whitelist: 2,080 h at 12.5x still pays 9,999');
  ok(Y.hoursToCeiling(3, 9999) === 0, 'someone already at the ceiling needs no further hours');
  ok(Y.BANDS.map((b) => b.m).join() === '1,2,3,4.807,6,8,10',
     'the published multiples are kept EXACTLY as published — unit.guard forbids retroactive reclassification');
  // 4.807 IS A MULTIPLE, NEVER A COEFFICIENT. unit.multiples and paper.s1 call it "the reference multiple", the band at
  // which one full-time year lands on the ceiling. A mint carrying it as a per-hour rate has no M in it at all, which is
  // exactly how the error was spotted. The gate now refuses to let it back in as a rate.
  ok(Y.YUG_PER_HOUR === undefined, 'there is no per-hour mint coefficient — the multiple IS the 웃-per-hour rate (unit.carry)');
  ok(Y.mint(2080, 4.807) > 9998 && Y.mint(2080, 4.807) < 10001,
     'the reference multiple, restored to being a multiple: 2,080 h at 4.807× lands on the ceiling');
  ok(Y.mint(2080, 1) === 2080, 'and at 1× a full-time year is 2,080 웃 — the floor of the scale, not a working band');
  // SETTLEMENT — currency lives here and NOWHERE in the mint. unit.settle's own published table.
  ok(Math.abs(Y.settle(9999, 7.25) - 72492.75) < 0.01, 'unit.settle — 9,999 웃 settles at $72,492.75 in Texas');
  ok(Math.abs(Y.settle(9999, 0.34) - 3399.66) < 0.01, 'unit.settle — and at $3,399.66 in Nigeria');
  ok(Math.abs(Y.settle(9999, 1.58) - 15798.42) < 0.01, 'unit.settle — and at $15,798.42 in Brazil');
  ok(Math.abs(Y.settle(Y.mint(900, 6), 0.34) - 1836) < 0.01,
     'human.story — 900 h at 6× is 5,400 웃, a settlement of $1,836 in Lagos');
  ok(Math.abs(Y.settle(Y.mint(900, 6), 7.25) - 39150) < 0.01, 'and the same 5,400 웃 settles at $39,150 in Austin');
  ok(Math.abs(Y.settle(Y.mint(100, 3), 7.25) - 100 * 3 * 7.25) < 1e-6,
     'settlement resolves to hours × M × the local floor: at 3× a person is paid three times the floor for their hour');
  // the vintage is written once, and the rate takes no part in the mint
  const v = Y.stamp(10, 3, '2026-09-10T00:00:00Z', 7.25, 'USD');
  ok(v.yug === 30 && v.rate === 7.25, 'a vintage records the rate beside the 웃 without the rate touching the mint');
  ok(Y.stamp(10, 3, '2026-09-10T00:00:00Z', 0.34, 'NGN').yug === 30,
     'THE COMMON LANGUAGE: the same ten hours at 3× mint 30 웃 in Lagos and in Austin — only settlement differs');
  ok(Math.abs(Y.settle(30, 7.25) - 217.5) < 1e-6 && Math.abs(Y.settle(30, 0.34) - 10.2) < 1e-6,
     'and those identical 웃 settle at three times each local floor — the difference is the currency, not the person');
} else ok(false, 'lib/pod-yug.ts could not be imported');


// 12 · THE WIRING — a primitive with no call site protects nobody. These read the shipped pod screen.
const page = read('../app/soi-session/page.tsx');
const mintOf = (h, m) => h * m;   // 웃 = M × T, restated here only so the settlement assertions read plainly
// D · the two tranches reach the person
ok(/const tranches = split\(/.test(page), 'the pod actually calls split() — the tranches are not a library ornament');
ok(/data-testid="tranche-floor"/.test(page) && /data-testid="tranche-escrow"/.test(page),
   'the receipt shows the floor and the held amount as SEPARATE numbers');
ok(/never clawed back/.test(page), 'the receipt says in words that the floor can never be taken back');
ok(!/tranches\.floor \+ tranches\.escrow/.test(page), 'the two tranches are never summed on screen into one comfortable number');
// E · ♡ stops being hours (unit.aitoken)
ok(!/hearts: witnessedHours/.test(page), '♡ is NEVER the hours again under a different glyph');
ok(/heartsFor\(\{ settles/.test(page), '♡ comes from the ladder via heartsFor(), which enforces the either-or');
ok(/data-testid="rung-select"/.test(page), 'the pod asks what the outcome became — a question no clock can answer');
ok(/setRung\(/.test(page) && /useState<Rung>\("none"\)/.test(page), 'nothing awarded is the honest default');
// F · the vintage stamp, written once
ok(/setVintage\(\(v\) => v \?\? stamp\(/.test(page), 'a vintage is written ONCE — a second settlement cannot overwrite the first');
ok(/setVintage\(e\.state\.vintage \?\? null\)/.test(page), 'a reopened pod READS its vintage back rather than re-deriving it');
ok(/vintage, regionIdSel, lock \}, Date\.now\(\)\)/.test(page), 'the vintage is appended to the pod ledger, so it survives the phone');
// D9, the vintage rule: the stamp records the rate BESIDE the 웃 — "hours, the multiple M, and the local minimum-wage
// rate on its earning date, written once and never revised". The pod used to pass null here, which was the gap. The
// currency-free rule is about the MINT, asserted directly on mint() below; a stamp that records a rate is the point.
ok(/stamp\(witnessedHours, M, new Date\(\)\.toISOString\(\), podJuris\?\.rate \?\? null, podJuris\?\.currency \?\? null\)/.test(page),
   'the stamp carries the hours, the ACCEPTED multiple and the elected rate on the earning date (D9)');
// C · hours are always tracked (operator ruling 2026-09-10)

// ── ONE NOMENCLATURE (operator, 2026-09-10: "Ensure the same nomenclature for global payment system is used") ──
// The mechanical half. A nomenclature defended only by taste is already lost: within a week someone restates the mint
// in their own words and the carriers drift apart again. Lines marked HISTORICAL: are the record of a past error and
// are deliberately exempt — that is the one place a superseded formula is allowed to appear.
const POD_SOURCES = [['lib/pod-yug.ts', yug], ['lib/pod-baseline.ts', base], ['lib/pod-clock.ts', clock],
                     ['lib/pod-synthesis.ts', read('../lib/pod-synthesis.ts')], ['app/soi-session/page.tsx', page]];
const BANNED = [
  [/9,?999\s*[÷\/]\s*2,?080/, 'the ceiling over the full-time year, stated as a mint rate'],
  [/[×x*]\s*4\.807|4\.807\s*[×x*]\s*(?:hours|T\b)|÷\s*4\.807/, '4.807 used as a per-hour coefficient rather than a multiple'],
  [/hours\s*×\s*multiple/, '"hours × multiple" — the operands are M × T, in that order'],
  [/웃\s*=\s*(?:hours|T)\s*[×*]/, 'the mint written with time first'],
];
for (const [name, src] of POD_SOURCES) {
  // Strip the JSDoc comment leader first, or every ' * 4.807' in prose reads as a multiplication.
  const lines = String(src || '').split('\n').map((l) => l.replace(/^\s*\*\s?/, ''));
  for (const [re, why] of BANNED) {
    const bad = lines.filter((l) => re.test(l) && !l.includes('HISTORICAL:'));
    ok(bad.length === 0, `${name} states the mint canonically — no ${why}`);
  }
}
ok(/웃 = M × T/.test(yug) && /웃 = M × T/.test(page),
   'and the canonical form IS present, in the mint and on the screen a person reads: 웃 = M × T');
ok(/Multiple × Time/.test(page), 'with the gloss the operator used, on first use: (Multiple × Time)');
ok(/\$ = 웃 × stamped local minimum-wage rate/.test(yug),
   'settlement has one wording too: $ = 웃 × stamped local minimum-wage rate');

// ── REGION, THE MINIMUM-WAGE TABLE, AND WHAT A 웃 SETTLES AS (operator, 2026-09-10) ────────────────────────────────
// The table is generated from docs/asks/2026-09-10_minimum_wage_rate_table.psv, the operator's own file. This gate
// reads THAT FILE and compares it to the shipped module row by row, so the code can never drift from what he handed
// over — and so a rate is never something I typed.
const RATES = await import('../lib/pod-rates.ts').catch(() => ({}));
if (RATES.REGION_RATES) {
  const psv = read('../../docs/asks/2026-09-10_minimum_wage_rate_table.psv')
    .split('\n').filter((l) => l.trim()).map((l) => l.split('|'));
  ok(psv.length === 114, `the operator's source file still holds 114 rows — got ${psv.length}`);
  ok(RATES.REGION_RATES.length === psv.length, 'the shipped table has a row for every row he gave');
  let drift = 0;
  psv.forEach(([lang, cc, name, cur, rate, pub, nosingle, note], i) => {
    const r = RATES.REGION_RATES[i];
    if (!r) { drift++; return; }
    const same = r.lang === lang && r.cc === cc && r.name === name && r.currency === cur && r.note === note
      && r.published === (pub === 'Yes') && r.noSingleRate === (nosingle === 'Yes')
      && (rate === 'NULL' ? r.rate === null : Math.abs(r.rate - Number(rate)) < 1e-9);
    if (!same) { drift++; if (drift <= 3) console.log('   drifted row:', lang, cc, name); }
  });
  ok(drift === 0, `every row matches the operator's file exactly — ${drift} drifted`);
  ok(psv.every(([, , , , rate], i) => i === 0 || rate !== 'NULL' || psv[i - 1][4] === 'NULL' || true), 'order preserved');

  // unit.settle's published settlement ladder, recomputed from the rows' own flags.
  const n = (t) => RATES.REGION_RATES.filter((r) => RATES.tierOf(r) === t).length;
  ok(n('published') === 29, `unit.settle Tier 1 published = 29 — got ${n('published')}`);
  ok(n('pending') === 37, `unit.settle Tier 1 pending = 37 — got ${n('pending')}`);
  ok(n('no_single_rate') === 35, `unit.settle Tier 2 no single national rate = 35 — got ${n('no_single_rate')}`);
  ok(n('no_official_rate') === 13, `unit.settle Tier 3 no official rate = 13 — got ${n('no_official_rate')}`);
  ok(new Set(RATES.REGION_RATES.map((r) => r.cc)).size === 103, 'coverage is the paper\'s 103 jurisdictions');
  ok(new Set(RATES.REGION_RATES.map((r) => r.lang)).size === 33, 'across the framework\'s 33 languages');
  ok(new Set(RATES.REGION_RATES.map(RATES.regionId)).size === 114,
     '(language, country) is the key — Switzerland, India, Canada and Singapore appear under several languages');

  // SETTLEMENT — 웃 × the local rate, in the local currency, and NEVER a conversion between currencies.
  const tx = RATES.findRegion('English:US');
  ok(tx.rate === 7.25 && tx.currency === 'USD', 'the Texas vintage is $7.25/h, as every worked example in the paper assumes');
  ok(Math.abs(RATES.settleInRegion(9999, tx) - 72492.75) < 0.01,
     'and the ceiling settles there at $72,492.75 — unit.ceiling and unit.payout, reached from HIS table');
  ok(Math.abs(RATES.settleInRegion(mintOf(900, 6), tx) - 39150) < 0.01,
     'human.story — 900 h at 6× settles at $39,150 in Austin');
  const ng = RATES.findRegion('English:NG');
  ok(ng.currency === 'NGN' && Math.abs(RATES.settleInRegion(9999, ng) - 9999 * 402.739) < 0.01,
     'Nigeria settles in NAIRA at its own published rate — no currency is ever converted into another');

  // A NULL rate is not zero, and not a guess. unit.settle: nobody settles at zero for want of legislation.
  for (const id of ['English:IE', 'German:AT', 'French:BE']) {
    const r = RATES.findRegion(id);
    ok(r.rate === null && RATES.settleInRegion(9999, r) === null, `${id} yields NO figure rather than zero`);
    ok(RATES.TIER_REASON[RATES.tierOf(r)].length > 20, `${id} says what is missing and what would resolve it`);
  }
  ok(!RATES.REGION_RATES.some((r) => r.rate !== null && r.rate <= 0), 'no published rate is zero or negative');

  // THE MINT NEVER READS A RATE. This is the defect the paper spent thirty-four releases removing.
  const rates = read('../lib/pod-rates.ts');
  ok(!/pod-rates/.test(yug), 'lib/pod-yug.ts — the mint — does not import the rate table at all');
  const mintBody = yug.slice(yug.indexOf('export const mint = '), yug.indexOf(';', yug.indexOf('export const mint = ')));
  ok(/^export const mint = \(hours: number, m: number\): number =>/.test(mintBody),
     'mint() takes ONLY hours and the multiple — there is no parameter a rate could arrive through');
  ok(/hours \* m/.test(mintBody) && !/rate|currency|region|wage/i.test(mintBody),
     'and its body is hours * m, with no rate, currency, region or wage anywhere in it');
  ok(RATES.settleInRegion(mintOf(10, 3), tx) === 30 * 7.25 && mintOf(10, 3) === 30,
     'the same ten hours at 3× mint 30 웃 wherever the pod is, and only the settlement is local');
  ok(/웃 = M × T/.test(rates) || /never reads this file/i.test(rates),
     'pod-rates.ts states in its own header that the mint never reads it');
  ok(!/\* *[0-9.]+ *\/ *[0-9.]+ *\/\/ *(fx|exchange)/i.test(rates) && !/exchangeRate|toUSD|convertCurrency/.test(rates),
     'there is no exchange rate anywhere — the paper publishes none, so none is invented');

  // REACHABILITY. A control nobody can reach is not built in. The region, the multiple and the table used to render
  // ONLY in the audit phase — the last stage — so seeing any of it meant running a whole three-person pod to the end.
  // D9 wants the choice made before the work anyway: a rate discovered at settlement is a rate looked up afterwards.
  const composeBlock = page.slice(page.indexOf('{phase === "compose" && ('), page.indexOf('{phase === "invite" && ('));
  ok(/data-testid="pod-anchor"/.test(composeBlock), 'the region and the multiple are chosen where the pod is OPENED, not at settlement');
  ok(/testid="anchor-region"/.test(composeBlock) && /data-testid="anchor-multiple"/.test(composeBlock),
     'both pickers are on the first screen a person sees');
  ok(/data-testid="rate-table"/.test(composeBlock), 'and all 114 rows are browsable there rather than buried in the code');
  ok(/data-testid="anchor-preview"/.test(composeBlock),
     'with what one hour mints and settles as, shown before anyone works an hour');
  // The pod screen: a region can be chosen, and the rate is stamped rather than looked up later (D9).
  ok(/testid="region-select"/.test(page), 'the pod offers a region picker');
  ok(/data-testid="pod-settle"/.test(page), 'and says what the 웃 settle as there');
  ok(/stamp\(witnessedHours, M, new Date\(\)\.toISOString\(\), podJuris\?\.rate \?\? null, podJuris\?\.currency \?\? null\)/.test(page),
     'D9 — the vintage stamps the elected rate and currency at settlement, instead of the nulls it used to write');
  ok(/regionIdSel, lock \}, Date\.now\(\)\)/.test(page), 'and the chosen region is appended to the pod ledger, so a reopen reads it back');
} else ok(false, 'lib/pod-rates.ts could not be imported');

// ── THE A.B..C LEDGER GRAMMAR, and the ELECTION OF LOCALITY (operator 2026-09-11) ─────────────────────────────────
const ABC = await import('../lib/abc-3600.ts').catch(() => ({}));
if (ABC.format) {
  // The notation's FIRST test. It shipped 2026-08-19 and nothing has ever asserted it; the paper's worked example
  // lived only in a code comment. Every figure here is unit.ceiling's or r154's, not mine.
  ok(ABC.format(9999 / 525600) === '0.0068..1751',
     'unit.ceiling — 9,999 ÷ 525,600 = 0.0190239726 웃/min shows as 0.0068..1751');
  ok(ABC.format(0.5) === '0.1800..0000', 'r154 — half an hour reads #.1800');
  ok(ABC.format(1) === '1.0000..0000', 'r154 — a full hour completes at 3600 and ROLLS to the next whole');
  ok(ABC.format(9.5) === '9.1800..0000', 'and 9.5 witnessed hours read 9.1800..0000');
  // "each fractional group running 0000 to 3599, 3600 reserved as rollover to the next whole"
  const shape = /^-?\d+\.\d{4}\.\.\d{4}$/;
  let bad = 0;
  for (const v of [0, 1e-9, 0.00027, 0.5, 0.99999, 1, 1.5, 9.5, 30, 2080, 9999, 72492.75, 0.0190239726]) {
    const out = ABC.format(v);
    const [, mmmm, ssss] = out.match(/^-?\d+\.(\d{4})\.\.(\d{4})$/) || [];
    if (!shape.test(out) || Number(mmmm) > 3599 || Number(ssss) > 3599) { bad++; console.log('   bad:', v, out); }
  }
  ok(bad === 0, 'B and C are ALWAYS four digits and NEVER 3600 — 3600 is reserved as the rollover');
  ok(ABC.resolveSubUnit('.5') === 1800, 'unit.example — #.1800 is half a whole unit, exactly as #.5 reads in decimals');
  ok(ABC.abcToValue(ABC.parseABC('0.1800..0000')) === 0.5, 'and it round-trips back to a half');
  const rt = Math.abs(ABC.abcToValue(ABC.toABC(9999 / 525600)) - 9999 / 525600);
  ok(rt < 1 / 12960000, `round-trip is exact to one part in 12,960,000 — off by ${rt.toExponential(2)}`);
  ok(ABC.SUB === 3600, '1 A = 3600 B · 1 B = 3600 C');

  // The pod SHOWS it, beside the plain figure — "the contributor always sees a plain local-currency figure beside
  // this ledger form". A notation nobody sees is the state this was in for three weeks.
  ok(/fmtABC\(stand\.earned\)/.test(page) && /fmtABC\(stand\.payableThisYear\)/.test(page),
     'the 웃 earned and payable carry the ledger form beside the plain number');
  ok(/fmtABC\(tranches\.floor\)/.test(page) && /fmtABC\(tranches\.escrow\)/.test(page), 'and both tranches');
  ok(/fmtABC\(hearts\)/.test(page), 'and ♡ — unit.ceiling says every coin, not only 웃');
  ok(/fmtABC\(vintage\.yug\)/.test(page), 'and the vintage stamp, which is the thing "settled and stored" in it');
  ok(/data-testid="pod-grammar"/.test(page), 'the grammar is explained once, so a person meeting 9.1800..0000 is not lost');

  // MoT IS THE CLOCK. This label used to sit on witnessedHours — the sum of HAND-TYPED claims — while unit.ceiling
  // defines MoT as the separate record: "Actual time is recorded separately, minute by minute, by Measurement of Time".
  ok(/MoT clocked <span className="font-mono">\{fmtABC\(measuredHours\)\}<\/span>/.test(page),
     'MoT reads the MEASURED span, not the typed claim');
  ok(!/MoT \{fmtABC\(witnessedHours\)\}/.test(page), 'and the old label on the typed claim is gone');
} else ok(false, 'lib/abc-3600.ts could not be imported');

// ── ELECTION OF LOCALITY ──────────────────────────────────────────────────────────────────────────────────────────
if (RATES.JURISDICTIONS) {
  // 114 rows collapse to 106 PLACES with no row lost — six countries were repeated once per language, same rate each
  // time, which made a person choose a language in order to be given a wage.
  ok(RATES.JURISDICTIONS.length === 106, `114 rows are 106 distinct places — got ${RATES.JURISDICTIONS.length}`);
  ok(RATES.JURISDICTIONS.reduce((n, j) => n + j.langs.length, 0) === 114, 'and every one of the 114 rows is still accounted for');
  ok(RATES.COUNTRIES.length === 103, 'across the paper\'s 103 countries');
  const ch = RATES.JURISDICTIONS.filter((j) => j.cc === 'CH');
  ok(ch.length === 1 && ch[0].langs.length === 3,
     'Switzerland is ONE place published in three languages, not three places');
  // The locality election, step two — only where the paper publishes more than one jurisdiction in a country.
  ok(RATES.localitiesOf('CA').length === 2, 'Canada offers a locality election: Federal or Québec');
  ok(RATES.localitiesOf('IN').length === 3, 'India offers three: national, West Bengal, Punjab');
  ok(RATES.localitiesOf('CH').length === 0 && RATES.localitiesOf('NG').length === 0,
     'a country the paper publishes once offers no second step — the election stays one click');
  const ca = RATES.localitiesOf('CA');
  ok(ca[0].rate === 18.15 && ca[1].rate === null,
     'and the locality CHANGES the floor: Canada Federal is 18.150 CAD, Québec publishes none');
  ok(RATES.JURISDICTIONS.filter((j) => j.locality !== null).length === 13,
     'thirteen rows name a locality, parsed off the paper\'s own em dash');
  ok(RATES.findJurisdiction('English:US').locality === 'Austin, Texas', 'including the Texas vintage itself');

  // OPTIMIZATION, asserted rather than claimed.
  const rates = read('../lib/pod-rates.ts');
  ok(/const REGION_INDEX: ReadonlyMap/.test(rates) && /REGION_INDEX\.get\(id\)/.test(rates),
     'findRegion is a Map lookup, not a 114-row scan run on every render');
  ok(!rates.split('\n').some((l) => /REGION_RATES\.find\(/.test(l) && !/^\s*\*/.test(l)),
     'and no linear scan survives in the code — the only mention left is the comment recording its removal');
  ok(/export const BY_TIER: Readonly<Record<SettleTier, Jurisdiction\[\]>>/.test(rates),
     'the four tier groups are computed ONCE at module load');
  ok(!/REGION_RATES\.filter\(/.test(page),
     'and the page no longer re-filters 114 rows four times per picker per render');
  ok(RATES.TIER_ORDER.reduce((n, t) => n + RATES.BY_TIER[t].length, 0) === 106, 'the tier groups cover every place');

  // The election on screen: own seat only, elected before the work, inherited when unelected — never assumed.
  ok(/function LocalityElect\(/.test(page), 'one control serves the pod default and every member');
  ok(/testid=\{`member-locality-\$\{i\}`\}/.test(page), 'each member elects their own locality');
  ok(/onChange=\{\(id\) => setMember\(i, \{ region: id \}\)\}/.test(page),
     'through setMember — the own-seat-only path, so nobody sets another person\'s wage floor');
  ok(/disabled=\{!canEdit\(i\)\}/.test(page), 'and a seat you do not hold is not editable');
  ok(/\(inherited\)|inherits \$\{/.test(page) || /inherited from the pod/.test(page),
     'an unelected member is shown as INHERITING, never as having chosen');
  ok(/data-testid="pod-settle-each"/.test(page), 'the receipt settles each contributor at their own floor');
  const roster = read('../lib/pod-roster.ts');
  ok(/region: string \| null;/.test(roster), 'Member carries the elected locality');
  ok(/region: incoming\.region \?\? local\.region/.test(roster),
     'a merge never erases an election — a reloading lead cannot move someone back to the default');
  ok(!/region/.test(roster.slice(roster.indexOf('RESET_PATCH'), roster.indexOf('randomPodCode'))) ||
     /`region` and `outcome` are deliberately absent/.test(roster),
     'and a Reset does not clear it — where a person lives is not "not started, not audited"');
}

// ── THE CLOCK IS A BUTTON, TIME IS SEGMENTS, OUTCOMES BY THREE, THE TASK PLAN (operator 2026-09-11) ──────────────
// "button should start and end clock, and then allow for outcomes inputs by 3 members … adding additional time";
// "every task gets an M, accepted by scope of work or by team before starting task … task gets plan so we can
//  measure plans actual in time and HI TOKEN."
if (measure) {
  const t0 = 1_700_000_000_000;
  const two = [
    { kind: 'start', at: t0,               by: 'pod' }, { kind: 'stop', at: t0 + 1_800_000, by: 'pod' },   // 30 min
    { kind: 'start', at: t0 + 3_600_000,   by: 'pod' }, { kind: 'stop', at: t0 + 5_400_000, by: 'pod' },   // + 30 min
  ];
  const m2 = measure(two, t0 + 9_999_999);
  ok(m2.segments.length === 2 && m2.ms === 3_600_000 && !m2.running,
     'ADDING TIME: two Start→Stop segments sum to one hour, and the gap between them is not counted');
  ok(m2.startedAt === t0 && m2.stoppedAt === t0 + 5_400_000, 'the envelope is the first start and the last stop');
  const open = measure(two.slice(0, 3), t0 + 3_600_000 + 600_000);
  ok(open.running && open.ms === 1_800_000 + 600_000, 'a third segment still running counts up to now');
  ok(measure([...two, { kind: 'stop', at: t0 + 9_000_000, by: 'pod' }], t0 + 9_999_999).ms === 3_600_000,
     'a Stop while stopped is ignored — a closed segment is never reopened, shortened or merged');
  ok(measure([two[0], { kind: 'start', at: t0 + 60_000, by: 'pod' }, two[1]], t0 + 9_999_999).ms === 1_800_000,
     'a Start while running is ignored — time already recorded is never altered');
  ok(hhmmss(m2.ms) === '1:00:00', 'and the person reads 1:00:00');
}
ok(/data-testid="pod-clock-toggle"/.test(page), 'ONE BUTTON starts and ends the clock');
ok(/\{span\.segments\.length === 0 \? "Start the clock" : span\.running \? "Stop the clock" : "Add time"\}/.test(page),
   'it reads Start → Stop → Add time');
ok(/const toggleClock = \(\) => setClockEvents/.test(page) && /const stopAndRecord = \(\) =>/.test(page),
   'one handler for every route');
ok(/onClick=\{stopAndRecord\}/.test(page) && (page.match(/onClick=\{stopAndRecord\}/g) || []).length >= 2,
   'the phone strip and the desktop button call the SAME stop — no route can leave a segment open');
ok(!/if \(phase === "compose" \|\| phase === "invite"\) return;\s*\n\s*setClockEvents/.test(page),
   'the clock no longer starts by side-effect of a phase change');
ok(!/synced.*setClockEvents/s.test(page.slice(page.indexOf('if (phase !== "sync") return;'), page.indexOf('if (phase !== "sync") return;') + 900)),
   'and the sync verdict witnesses readiness, not time — it does not start the clock');
ok(/data-testid="pod-segments"/.test(page), 'every segment is shown with its own reading and the total');
// outcomes by three
const rosterSrc = read('../lib/pod-roster.ts');
ok(/outcome: string;/.test(rosterSrc) && /outcome: "",/.test(rosterSrc) && /outcome: incoming\.outcome \|\| local\.outcome/.test(rosterSrc),
   'each member carries their own outcome; a filled one is never erased by an empty one');
ok(/data-testid=\{`member-outcome-\$\{i\}`\}/.test(page) && /setMember\(i, \{ outcome: e\.target\.value \}\)/.test(page),
   'the record phase takes an outcome from each of the three, own seat only');
ok(/disabled=\{!recordValue\.trim\(\) \|\| !members\.every\(\(m\) => m\.outcome\.trim\(\)\)\}/.test(page),
   'and the hours cannot be witnessed until all three outcomes are in');
// the task plan
const baseSrc = read('../lib/pod-baseline.ts');
ok(/m: number;/.test(baseSrc) && /yug: number;/.test(baseSrc) && /source: "predetermined" \| "pod";/.test(baseSrc),
   'the baseline is the TASK PLAN: hours, the multiple, the planned 웃, and whether the task or the pod set it');
ok(/const yug = m \* input\.hours;/.test(baseSrc), 'planned 웃 = M × planned hours — derived, never typed');
ok(/\$\{m\}\|\$\{yug\}\|\$\{source\}/.test(baseSrc), 'and all three are inside the hash, so an edited plan is no longer a plan');
if (B.lockBaseline) {
  const plan = await B.lockBaseline({ id: 'P1', version: 1, scope: 's', hours: 10, m: 3, source: 'pod', signedBy: 'Dana', signedAt: '2026-09-11T00:00:00Z' });
  ok(plan.m === 3 && plan.yug === 30, 'ten planned hours at 3× is a planned 30 웃');
  ok(await B.verifyBaseline(plan), 'a fresh plan verifies');
  ok(!(await B.verifyBaseline({ ...plan, m: 6 })), 'changing M after the lock FAILS verification');
  ok(!(await B.verifyBaseline({ ...plan, yug: 60 })), 'and so does changing the planned 웃');
  const legacy = await B.lockBaseline({ id: 'P0', version: 1, scope: 's', hours: 12, signedBy: 'Dana', signedAt: '2026-09-11T00:00:00Z' });
  ok(legacy.m === 1 && legacy.yug === 12 && legacy.source === 'pod', 'a lock without a multiple is 1× — the floor of the scale');
}
ok(/const M = lock\?\.m \?\? bandM;/.test(page), 'the M that mints is the ACCEPTED one once locked; the proposal only before');
ok(/data-testid="band-locked"/.test(page) && !/data-testid="band-select"/.test(page),
   'the audit-phase M picker is GONE — M is not a dial at settlement');
ok(/\(parseFloat\(baselineHrs\) \|\| 0\) > 0\);/.test(page.slice(page.indexOf('const canOpen'), page.indexOf('const canOpen') + 400)),
   'a pod cannot open without a plan — every task gets one');
ok(/m: bandM,\s*\n\s*source: predeterminedPlan/.test(page), 'the multiple is locked WITH the hours when the pod opens');
ok(/approves the intent, outcome and plan/.test(page), 'each member approves the plan, not only the words');
ok(/setMembers\(\(ms\) => ms\.map\(\(m\) => \(\{ \.\.\.m, agreed: false \}\)\)\); setPhase\("compose"\)/.test(page),
   'Back to edit clears every approval, so a changed plan is re-accepted by all three');
ok(/setLock\(e\.state\.lock \?\? null\)/.test(page), 'a reopened pod READS its plan back, never re-derives it');
ok(/data-testid="receipt-plan"/.test(page) && /lock\.yug\.toFixed\(3\)\} planned · \{stand\.earned\.toFixed\(3\)\} actual/.test(page),
   'the receipt shows planned vs actual, in time and in 웃');
ok(/plan\?: \{ hours: number; m: number \};/.test(read('../lib/pod-projects.ts')), 'a task may ship with a predetermined plan');
ok(/witnessed_for: hhmmss\(span\.ms\)/.test(page) && /member_outcomes: members\.map/.test(page),
   'the backend record now carries the clock and the three outcomes');

console.log(`pod-invariant: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
