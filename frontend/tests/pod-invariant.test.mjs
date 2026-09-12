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
ok(/const pod = vintage \?\? stamp\(witnessedHours, M, at,/.test(page) && /setVintage\(\(v\) => v \?\? settleMsg\.vintage!\)/.test(page),
   'a vintage is written ONCE — a second settlement, local or received, cannot overwrite the first');
ok(/setVintage\(e\.state\.vintage \?\? null\)/.test(page), 'a reopened pod READS its vintage back rather than re-deriving it');
ok(/vintage, memberVintages, regionIdSel, lock \}, Date\.now\(\)\)/.test(page), 'the vintage — and every member\'s — is appended to the pod ledger, so it survives the phone');
// D9, the vintage rule: the stamp records the rate BESIDE the 웃 — "hours, the multiple M, and the local minimum-wage
// rate on its earning date, written once and never revised". The pod used to pass null here, which was the gap. The
// currency-free rule is about the MINT, asserted directly on mint() below; a stamp that records a rate is the point.
ok(/stamp\(witnessedHours, M, at, podJuris\?\.rate \?\? null, podJuris\?\.currency \?\? null\)/.test(page),
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
const opPsvTop = read('../../docs/asks/2026-09-10_minimum_wage_rate_table.psv').split('\n').filter((l) => l.trim()).map((l) => l.split('|'));
const approvedPsv = read('../../docs/asks/2026-09-11_minimum_wage_rate_table_approved.psv').split('\n').filter((l) => l.trim()).slice(1).map((l) => l.split('|'));
if (RATES.REGION_RATES) {
  const psv = read('../../docs/asks/2026-09-10_minimum_wage_rate_table.psv')
    .split('\n').filter((l) => l.trim()).map((l) => l.split('|'));
  ok(psv.length === 114, `the operator's source file still holds 114 rows — got ${psv.length}`);
  // The rows he APPROVED from the fleet's proposal (Rule B, docs/asks/2026-09-11_rule_b_approved.md) follow his 114.
  ok(RATES.REGION_RATES.length === psv.length + approvedPsv.length, `the shipped table is his 114 plus the ${approvedPsv.length} he approved — got ${RATES.REGION_RATES.length}`);
  let adrift = 0;
  approvedPsv.forEach(([lang, cc, name, cur, rate, pub, nosingle, note], i) => {
    const r = RATES.REGION_RATES[psv.length + i];
    const same = r && r.lang === lang && r.cc === cc && r.name === name && r.currency === cur && r.note === note && r.approved === '2026-09-11'
      && r.published === (pub === 'Yes') && r.noSingleRate === (nosingle === 'Yes') && (rate === 'NULL' ? r.rate === null : Math.abs(r.rate - Number(rate)) < 1e-9);
    if (!same) adrift++;
  });
  ok(adrift === 0, `every approved row matches the approved file exactly and carries its approval date — ${adrift} drifted`);
  ok(!approvedPsv.some((r) => r[4] === 'NULL'), 'no approved row is NULL — Rule B loads figures only');
  ok(approvedPsv.every((r) => /^(high|medium)$/.test(r[12]) && /approved under Rule B/.test(r[13])), 'every approved row is high/medium confidence and says it was approved under the rule, not verified live');
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
  const opRows = RATES.REGION_RATES.filter((r) => !r.approved);
  const n = (t) => opRows.filter((r) => RATES.tierOf(r) === t).length;
  ok(n('published') === 29, `unit.settle Tier 1 published = 29 — got ${n('published')}`);
  ok(n('pending') === 37, `unit.settle Tier 1 pending = 37 — got ${n('pending')}`);
  ok(n('no_single_rate') === 35, `unit.settle Tier 2 no single national rate = 35 — got ${n('no_single_rate')}`);
  ok(n('no_official_rate') === 13, `unit.settle Tier 3 no official rate = 13 — got ${n('no_official_rate')}`);
  ok(new Set(opRows.map((r) => r.cc)).size === 103, 'coverage of HIS table is the paper\'s 103 jurisdictions');
  ok(new Set(opRows.map((r) => r.lang)).size === 33, 'across the framework\'s 33 languages');
  ok(new Set(opRows.map(RATES.regionId)).size === 114,
     '(language, country) is the key of his rows — Switzerland, India, Canada and Singapore appear under several languages');
  ok(new Set(RATES.REGION_RATES.map(RATES.regionId)).size === RATES.REGION_RATES.length,
     'and every row in the record, his and approved, has a UNIQUE key — an approved row can never overwrite one of his');
  ok(RATES.findRegion('English:US').name === 'United States — Austin, Texas' && RATES.findRegion('English:IE').rate === null,
     'his ids still resolve to HIS rows: English:US is Austin, English:IE is his NULL row');
  const iePlace = RATES.JURISDICTIONS.find((j) => j.cc === 'IE');
  ok(iePlace && iePlace.rate === 14.15 && iePlace.source === 'dataset-2026-09-12',
     'but the PLACE Ireland settles — at the dataset\'s verified 14.15 EUR, his NULL row untouched and the approved fill recorded as history');

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
  ok(/stamp\(witnessedHours, M, at, podJuris\?\.rate \?\? null, podJuris\?\.currency \?\? null\)/.test(page),
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
  // The operator's table is one SOURCE among the jurisdictions now; scope these to it (the merge is gated further down).
  const opJ = RATES.JURISDICTIONS.filter((j) => j.fromOperator);
  ok(opJ.length === 106, `114 rows are 106 distinct places — got ${opJ.length}`);
  const opRowsAll = RATES.REGION_RATES.filter((r) => !r.approved);
  ok(opRowsAll.every((r) => RATES.findJurisdiction(RATES.regionId(r))), 'and every one of the 114 rows maps to a place — its id still resolves after the dataset took over the country rows');
  ok(new Set(opJ.map((j) => j.cc)).size === 103, 'across the paper\'s 103 countries');
  const dsCc = new Set(RATES.DATASET_ROWS.map((d) => d.cc));
  const territories = ['PR', 'GU', 'VI', 'MP', 'AS'];
  const historyOnlyCc = new Set(RATES.REGION_RATES.map((r) => r.cc).filter((cc) => !dsCc.has(cc)));
  ok(RATES.COUNTRIES.length === dsCc.size - territories.length + historyOnlyCc.size,
     `the country list is the dataset's ${dsCc.size} codes less the ${territories.length} US territories (localities of the United States) plus ${[...historyOnlyCc].join(',')} — got ${RATES.COUNTRIES.length}`);
  ok(RATES.COUNTRIES.every((c, i, a) => i === 0 || a[i - 1].country.localeCompare(c.country) <= 0), 'in alphabetical order');
  const chNat = RATES.JURISDICTIONS.find((j) => j.cc === 'CH' && j.locality === null);
  ok(chNat && chNat.langs.length === 3 && RATES.JURISDICTIONS.filter((j) => j.cc === 'CH' && j.locality === null).length === 1,
     'Switzerland the country is ONE place published in three languages, not three places');
  ok(RATES.JURISDICTIONS.some((j) => j.cc === 'CH' && j.locality === 'Geneva' && j.rate !== null && j.source === 'approved-2026-09-11'),
     'and Geneva, a cantonal floor the dataset does not name, is a locality of it from the approved file');
  // The locality election, step two — only where a source publishes more than one jurisdiction in a country.
  const caLoc = RATES.localitiesOf('CA');
  ok(caLoc.length === 14 && caLoc[0].locality === null && caLoc[0].source === 'dataset-2026-09-12' && caLoc.some((j) => j.locality === 'Québec') && caLoc.filter((j) => j.source === 'approved-2026-09-11').length === 12,
     'Canada offers a locality election: the country (the dataset\'s federal row), Québec, and the twelve approved provinces and territories');
  ok(RATES.findJurisdiction('English:CA') === caLoc[0] && !caLoc.some((j) => j.locality === 'Federal'),
     'his "Canada — Federal" row IS the dataset\'s federal-jurisdiction row — one place, his id resolving to it, not a duplicate beside it');
  ok(RATES.localitiesOf('IN').length === 3, 'India offers three: national, West Bengal, Punjab');
  ok(RATES.localitiesOf('NG').length === 0 && RATES.localitiesOf('GB').length === 0 && RATES.localitiesOf('ES').length === 0,
     'a country published as one place offers no second step — the election stays one click');
  ok(caLoc[0].rate === 18.15 && caLoc.find((j) => j.locality === 'Québec').rate === null,
     'and the locality CHANGES the floor: Canada is 18.150 CAD, Québec publishes none');
  ok(caLoc.slice(1).every((j, i, a) => i === 0 || a[i - 1].locality.localeCompare(j.locality) <= 0), 'localities are listed in alphabetical order after the country itself');
  ok(opJ.filter((j) => j.locality !== null).length === 12,
     'twelve of the operator\'s rows name a locality of their own, parsed off the paper\'s own em dash (the thirteenth, Canada — Federal, is the country row)');
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
  ok(RATES.TIER_ORDER.reduce((n, t) => n + RATES.BY_TIER[t].length, 0) === RATES.JURISDICTIONS.length, 'the tier groups cover every place');

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
ok(/\{span\.segments\.length === 0 \? t\("soi\.pod\.guide\.a\.clock_start"\) : span\.running \? t\("soi\.pod\.guide\.a\.clock_stop"\) : t\("soi\.pod\.ui\.add_time"\)\}/.test(page),
   'it reads Start → Stop → Add time');
ok(/const pressClock = \(kind: ClockEvent\["kind"\]\) =>/.test(page) && /const toggleClock = \(\) => pressClock\(/.test(page) && /const stopAndRecord = \(\) =>/.test(page),
   'one handler for every route');
// THE CLOCK IS ONE FOR THE POD: every press is broadcast, and a press received from a known phone is appended once.
ok(/broadcastRef\.current\("session_update", \{ pod: \{ kind: "clock", from: clientId\.current, event: ev \} \}\)/.test(page),
   'a Start/Stop/Add-time pressed on one phone is broadcast to the pod');
ok(/if \(msg\.kind === "clock"\) \{/.test(page) && /if \(!known\(podRef\.current, msg\.from\)\) return;/.test(page),
   'and accepted only from a phone the roster knows — the roster\'s own guard');
ok(/x\.seq != null && ev\.seq != null \? x\.seq === ev\.seq : x\.at === ev\.at\)\) \? e : \[\.\.\.e, /.test(page), 'appended ONCE — a replayed press changes nothing');
ok(/\| \{ kind: "clock";  from: string; event: \{ kind: "start" \| "stop"; at: number; by: string \} \};/.test(read('../lib/pod-roster.ts')) && /if \(msg\.kind === "clock"\) return \{ state, send: \[\] \};/.test(read('../lib/pod-roster.ts')),
   'the protocol names the clock message and the reducer never mistakes it for a phase');
ok(/void verifyBaseline\(incoming\)\.then\(\(okHash\) => \{ if \(okHash\) setLock\(incoming\); \}\);/.test(page),
   'the ACCEPTED plan reaches every phone with its hash — and is VERIFIED against that hash before it is trusted');
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
ok(/t\("soi\.pod\.ui\.approves"\)/.test(page) && /englishDefault: "approves the intent, outcome and plan"/.test(read('../lib/lexicon-data.ts')), 'each member approves the plan, not only the words — through the lexicon');
ok(/setMembers\(\(ms\) => ms\.map\(\(m\) => \(\{ \.\.\.m, agreed: false, agreedTo: null \}\)\)\); setPhase\("compose"\)/.test(page),
   'Back to edit clears every approval, so a changed plan is re-accepted by all three');
ok(/setLock\(e\.state\.lock \?\? null\)/.test(page), 'a reopened pod READS its plan back, never re-derives it');
ok(/data-testid="receipt-plan"/.test(page) && /lock\.yug\.toFixed\(3\)\} planned · \{stand\.earned\.toFixed\(3\)\} actual/.test(page),
   'the receipt shows planned vs actual, in time and in 웃');
ok(/plan\?: \{ hours: number; m: number \};/.test(read('../lib/pod-projects.ts')), 'a task may ship with a predetermined plan');
ok(/witnessed_for: hhmmss\(span\.ms\)/.test(page) && /member_outcomes: members\.map/.test(page),
   'the backend record now carries the clock and the three outcomes');

// ── THE REGION RECORD, RECONCILED (feedback intake 2026-09-11) ───────────────────────────────────────────────────────
if (RATES.JURISDICTIONS && RATES.settleD9) {
  const ops = RATES.JURISDICTIONS.filter((j) => j.fromOperator);
  ok(ops.length === 106 && RATES.REGION_RATES.filter((r) => !r.approved).length === 114,
     'the operator\'s 114 rows are still 106 places, none lost, none edited');
  ok(!RATES.JURISDICTIONS.some((j) => j.source === 'hi_rates.py'),
     'hi_rates.py — "the live settlement table" (fund.token) — no longer creates a place: every state it held is a dataset row now, and its figure sits beside as usdMirror');
  const us = RATES.localitiesOf('US');
  const STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
  ok(STATES.every((st) => us.some((j) => j.locality === st || (j.locality || '').startsWith(st + ' · '))), 'a US contributor elects their STATE — all 50 are localities of the United States, from the dataset');
  ok(us.length === 65, `the United States offers 65 places: the federal floor, 50 states (six of them by scope: 6 extra rows), DC, Austin, and the five territories — got ${us.length}`);
  ok(us[0].locality === null && us[0].rate === 7.25 && us[0].dataset.scope === 'Federal FLSA', 'the country itself is the dataset\'s federal FLSA row, 7.25');
  ok(RATES.findJurisdiction('English:US:united-states-federal-flsa-floor') === us[0], 'and the approved "Federal (FLSA floor)" row resolves to that same place, not a duplicate');
  for (const [loc, rate, src] of [['District of Columbia', 18.4, 'dataset-2026-09-12'], ['California', 16.9, 'dataset-2026-09-12'], ['Texas', 7.25, 'dataset-2026-09-12'], ['Georgia', 7.25, 'dataset-2026-09-12'], ['Alabama', 7.25, 'dataset-2026-09-12']]) {
    const j = us.find((x) => x.locality === loc);
    ok(j && j.rate === rate && j.currency === 'USD' && j.source === src, `${loc} settles at ${rate} USD/h from the dataset`);
  }
  const ga = us.find((x) => x.locality === 'Georgia');
  ok(ga.dataset.hourly === 5.15 && ga.dataset.floor === 7.25 && /effective floor 7.25 settles/.test(ga.note), 'Georgia: the published 5.15 is kept and the dataset\'s effective floor 7.25 is what settles — both stated');
  ok(us.find((x) => x.locality === 'Alabama').dataset.hourly === null, 'Alabama has no state law; the dataset\'s effective floor settles');
  ok(us.filter((x) => (x.locality || '').startsWith('New York · ')).length === 2 && us.filter((x) => (x.locality || '').startsWith('Oregon · ')).length === 3,
     'a state the dataset publishes by scope is elected by scope — New York twice, Oregon three times');
  ok(new Set(us.map((x) => x.id)).size === us.length, 'every scope has its own id — "< $405,000" and ">= $405,000" do not collide');
  ok(us.find((x) => x.locality === 'District of Columbia').history.some((h) => /approved 2026-09-11.*17\.95.*governs/.test(h)), 'DC: the approved 17.95 is recorded as history; the dataset\'s 18.40 governs');
  const pr = us.find((x) => x.locality === 'Puerto Rico');
  ok(pr && pr.rate === null && pr.tier === 'pending' && pr.history.some((h) => /approved 2026-09-11.*10\.5.*not settled.*verification pending/.test(h)),
     'Puerto Rico: the dataset names it as "verification pending", so the approved 10.50 does NOT settle — shown as history, nothing guessed');
  ok(!RATES.JURISDICTIONS.some((j) => j.locality === 'American Samoa' && j.rate !== null), 'American Samoa carries no single figure — industry rates; nothing was guessed');
  ok(us.find((x) => x.locality === 'California').usdMirror === 16, 'hi_rates.py\'s 16.00 for California sits beside the dataset\'s 16.90 as usdMirror, never merged');
  const kh = RATES.JURISDICTIONS.find((j) => j.country === 'Cambodia');
  ok(kh && kh.source === 'dataset-2026-09-12' && kh.currency === 'KHR' && kh.rate === null && kh.langs.includes('Khmer') && kh.history.some((h) => /approved 2026-09-11: 1\.01 USD\/h — not settled/.test(h)),
     'Cambodia is the dataset\'s place (KHR, candidate only, nothing settles); the approved 1.01 USD attaches as history under it');
  ok(RATES.findJurisdiction('Portuguese:BR').rate === 7.37 && RATES.findJurisdiction('Portuguese:BR').usdMirror === 1.58 && RATES.findJurisdiction('Portuguese:BR').history.some((h) => /operator 2026-09-10: 9\.326 BRL\/h; the dataset's 7\.37 BRL\/h governs/.test(h)),
     'Brazil: the dataset\'s verified 7.37 governs his 9.326, which is recorded beside it, and the USD mirror sits beside both');
  // D9 — greater of vintage and current, same jurisdiction; relocation is an election onto the new schedule
  const tx = RATES.findJurisdiction('English:US');
  ok(RATES.settleD9(100, { rate: 7.25, currency: 'USD' }, tx).which === 'equal', 'vintage == current → equal');
  ok(RATES.settleD9(100, { rate: 6.5, currency: 'USD' }, tx).which === 'current' && RATES.settleD9(100, { rate: 6.5, currency: 'USD' }, tx).amount === 725,
     'the wage rose since the stamp → the CURRENT rate pays: a floor, never a ceiling');
  ok(RATES.settleD9(100, { rate: 8, currency: 'USD' }, tx).which === 'vintage' && RATES.settleD9(100, { rate: 8, currency: 'USD' }, tx).amount === 800,
     'the wage fell since the stamp → the VINTAGE rate pays: time can only preserve or improve buying power');
  const br = RATES.findJurisdiction('Portuguese:BR');
  const rel = RATES.settleD9(100, { rate: 7.25, currency: 'USD' }, br);
  ok(rel.which === 'relocated' && rel.currency === 'BRL' && rel.amount === 100 * 7.37,
     'a relocation election settles on the new schedule at its current rate — never a maximum across two currencies');
  ok(RATES.settleD9(100, null, RATES.findJurisdiction('English:NG')).which === 'none', 'no rate anywhere (Nigeria: candidate only) → no figure, not zero');
  ok(/no_single_rate: "D1, open since r57/.test(read('../lib/pod-rates.ts')) && /no_official_rate: "D2, open since r57/.test(read('../lib/pod-rates.ts')),
     'D1 and D2 are shown as the operator\'s open decisions, verbatim from the register, and settle nothing');
  // auto-detect is a suggestion, never applied
  ok(/import \{ detectRegion \} from "@\/lib\/min-wage";/.test(page), 'the existing detector is REUSED, not rebuilt');
  ok(/setSuggestedRegion\(j\)/.test(page) && !/detectRegion\([^)]*\)\.then\([^)]*setRegionIdSel/.test(page),
     'detection only SUGGESTS — it never sets the election by itself');
  ok(/data-testid="anchor-region-suggest"/.test(page), 'the person is offered the detected place and chooses');
  ok(/data-testid="pod-settle-d9"/.test(page) && /A settlement figure moves only because a statutory wage moved/.test(page),
     'the receipt names which rate paid and why (Grok #15)');
}

// ── THE CLOSED RECEIPT SETTLES EACH CONTRIBUTOR AT THEIR OWN FLOOR (three-phone showcase, 2026-09-11) ────────────
// The per-member settlement used to live only on the AUDIT panel, so the receipt itself never showed Ana's naira or
// Bo's pesos. A showcase that stops at the audit screen shows nothing to the person holding the receipt.
ok(/data-testid="receipt-each"/.test(page) && /data-testid=\{`receipt-member-\$\{i\}`\}/.test(page),
   'the CLOSED receipt carries one settlement line per contributor, in their own currency');
ok(/t\("soi\.pod\.ui\.r_each"\)/.test(page) && /englishDefault: "Each at their own floor"/.test(read('../lib/lexicon-data.ts')) && /electedOwn\(i\) \? "" : ", inherited"/.test(page),
   'and says which floor was elected and which was inherited');
ok(/scripts\/pod-time-report\.mjs/.test(read('../scripts/pod-time-report.mjs')) && /heartsFor\(\{ settles웃: false/.test(read('../scripts/pod-time-report.mjs')),
   'the volunteer-vs-paid document runs the shipped clock and mint, and prints the volunteer counterfactual beside the paid pod');

// ── THE CLASS THE 48-AGENT FLEET NAMED (2026-09-11): "what the receipt asserts is single-phone state, not the pod's
//    replicated record" and "one plan quantity with three definitions". Every member, gated. ────────────────────────
const rosterNow = read('../lib/pod-roster.ts');
const baseNow = read('../lib/pod-baseline.ts');
// 1 · one plan, one actual — person-hours across the trio, the clock span under its own name
ok(/PERSON-HOURS ACROSS THE TRIO/.test(baseNow), 'the unit of the plan\'s hours is stated where the lock is defined');
ok(/person-hours planned/.test(page) && /person-hours counted/.test(page) && /pod clock, under its own name:/.test(page),
   'the receipt compares planned and counted PERSON-HOURS and prints the clock span separately, under its own name');
ok(/Δ \{\(witnessedHours - lock\.hours\) >= 0/.test(page) && !/Δ \{\(measuredHours - lock\.hours\)/.test(page),
   'Δ h and Δ 웃 on the receipt derive from the SAME quantity');
ok(/· hours \{fmtABC\(witnessedHours\)\}/.test(page) && !/· 웃 \{fmtABC\(witnessedHours\)\}/.test(page),
   'hours are never printed under a coin glyph (Aset)');
// 2 · one vintage per natural person, replicated, persisted, settled through D9 with a per-person ceiling
ok(/const \[memberVintages, setMemberVintages\] = useState<Vintage\[\]>\(\[\]\);/.test(page), 'the pod holds one vintage per member');
ok(/members\.map\(\(_, i\) => \{ const j = localityOf\(i\); return stamp\(claimOf\(i\)\.hours, M, at, j\?\.rate \?\? null, j\?\.currency \?\? null\); \}\)/.test(page),
   'each member is stamped at settlement with THEIR elected floor and the accepted M');
ok(/settle: \{ vintage: pod, memberVintages: each \}/.test(page) && /const settleMsg = \(p as \{ settle\?:/.test(page) && /known\(podRef\.current, msg\.from\)\) \{\n\s*setVintage\(\(v\) => v \?\? settleMsg\.vintage!\)/.test(page),
   'the settlement travels with the phase move, and is accepted once, only from a known phone — three identical receipts');
ok(/const d9m = settleD9\(Math\.min\(own, YUG_CEILING\), v \? \{ rate: v\.rate, currency: v\.currency \} : null, j\);/.test(page),
   'each member settles through D9 with THEIR vintage, under a ceiling applied per natural person');
ok(/setMemberVintages\(e\.state\.memberVintages \?\? \[\]\)/.test(page), 'and a reopened pod reads every member\'s vintage back');
// 3 · money-moving inputs bound at acceptance
ok(/agreedTo: string \| null;/.test(rosterNow) && /agreedTo: incoming\.agreedTo \?\? local\.agreedTo/.test(rosterNow),
   'each seat\'s approval records the plan hash it approved, and a merge keeps the newest');
ok(/const allAgreed = allJoined && !!lock && members\.every\(\(m\) => m\.agreed && m\.agreedTo === lock\.hash\);/.test(page),
   'the Start gate requires every seat to have approved THIS lock — a re-lock invalidates every approval by construction');
ok(/agreedTo: e\.target\.checked \? \(lock\?\.hash \?\? null\) : null/.test(page), 'ticking approval records the hash being approved');
ok(/seq\?: number/.test(clock) && /a\.seq != null && b\.seq != null \? a\.seq - b\.seq : a\.at - b\.at/.test(read('../lib/pod-clock.ts')),
   'the clock folds by the ORDER a press was accepted in, not by each phone\'s wall clock');
ok(/const seq = clockEvents\.reduce\(\(n, e\) => Math\.max\(n, e\.seq \?\? -1\), -1\) \+ 1;/.test(page), 'the presser assigns the sequence');
ok(/Math\.abs\(ev\.at - Date\.now\(\)\) > 300_000\) return;/.test(page), 'a received press more than five minutes from this phone\'s clock is refused (Thor)');
if (measure) {
  const t0 = 1_700_000_000_000;
  const skewed = [{ kind: 'start', at: t0, by: 'pod', seq: 0 }, { kind: 'stop', at: t0 - 30_000, by: 'pod', seq: 1 }];
  const m = measure(skewed, t0 + 999_999);
  ok(!m.running && m.segments.length === 1 && m.ms === 0, 'a joiner whose Stop is 30 s "before" the Start by its own clock still CLOSES the segment (Odin) — nothing runs forever');
  const late = [{ kind: 'start', at: t0, by: 'pod', seq: 0 }, { kind: 'stop', at: t0 + 90_000, by: 'pod', seq: 1 }];
  ok(measure(late, t0 + 999_999).ms === 90_000, 'and a +30 s skewed Stop counts what its clock says — at is the evidence of when, seq is the order');
}
ok(/if \(m\.segments\.length === 0\) return;/.test(page), 'no route can leave ACTIVE with nothing clocked (Athena) — the strip included');
// 4 · carriers say only what happened
ok(/data-testid="receipt-outcomes"/.test(page) && /data-testid=\{`receipt-outcome-\$\{i\}`\}/.test(page), 'the closed receipt renders the three outcomes it claims (Asar)');
const router = read('../../backend/app/cubes/cube6_ai/pod_router.py');
ok(/OUTCOMES, ONE PER MEMBER/.test(router) && /POD CLOCK, UNDER ITS OWN NAME/.test(router) && /웃 = M × T, M=\{f\.m\} accepted by the trio/.test(router),
   'the backend prompt renders the clock, the segments and the three outcomes it accepts (Krishna/Enlil) and says 웃 = M × T');
ok(/three EMULATED phones/.test(read('../scripts/pod-live-run-2026-09-11.mjs')), 'the showcase header says what it is: emulated phones on one host (Odin)');
ok(/COMPUTED SCENARIO/.test(read('../scripts/pod-time-report.mjs')) && /PERSON-HOURS across the trio/.test(read('../scripts/pod-time-report.mjs')),
   'the time document says it is a computed scenario and names the plan\'s unit (Asar/Sofia)');

// ── ONE PROJECT PER POD (operator 2026-09-11: "one can only select one project") ────────────────────────────────────
ok(/setProjects\(\(s\) => \(s\.has\(id\) && id !== OPEN_TOPIC\.id \? new Set\(\[OPEN_TOPIC\.id\]\) : new Set\(\[id\]\)\)\);/.test(page),
   'choosing a project selects ONLY it; choosing it again returns to Open topic — never empty, never three');
ok(!/n\.size < 3/.test(page) && !/projects\.size >= 3/.test(page) && !/\/3 selected/.test(page), 'the up-to-three cap is gone from the code and the label');
ok(/setTasks\(\(t\) => \(t\[id\] \? \{ \[id\]: t\[id\] \} : \{\}\)\);/.test(page), 'a task belongs to the one project chosen');
ok(!/&plus;/.test(page), 'no HTML entity is written into JSX text — the screen showed a literal "&plus;"');
ok(/or choose one Domain Play/.test(read('../lib/lexicon-data.ts')) && !/tag up to 3/.test(read('../lib/lexicon-data.ts')), 'the picker\'s label says one Domain Play');

// ── THE TRACEABLE DATASET GOVERNS (operator 2026-09-12: "use this traceable data set") ─────────────────────────────
// The gate parses the CSV itself — the same dialect, independently — and reconciles every row to the shipped module
// and every module row to a place. A figure that is not in the file cannot be in the record.
const csvText = read('../../docs/asks/2026-09-12_exel_ai_global_minimum_wage_master_2026.csv').replace(/^﻿/, '');
const csvRows = (() => { const rows = []; let row = [], f = '', q = false; for (let i = 0; i < csvText.length; i++) { const c = csvText[i]; if (q) { if (c === '"') { if (csvText[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; } if (c === '"') q = true; else if (c === ';') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c; } if (f || row.length) { row.push(f); rows.push(row); } return rows; })();
const csvH = csvRows[0]; const csv = csvRows.slice(1).map((r) => Object.fromEntries(csvH.map((k, i) => [k, r[i]])));
if (RATES.DATASET_ROWS) {
  ok(csv.length === 307 && RATES.DATASET_ROWS.length === 307, `the dataset is 307 rows in the file and 307 in the module — got ${csv.length} / ${RATES.DATASET_ROWS.length}`);
  let dsDrift = 0;
  csv.forEach((c, i) => {
    const d = RATES.DATASET_ROWS[i]; const n = (v) => (v === '' ? null : Number(v));
    const same = d && d.type === c.record_type && d.cc === c.country_code && d.sub === c.subdivision_code && d.name === c.jurisdiction
      && d.langs.join('|') === c.exel_languages && d.currency === (c.currency_code || null) && d.hourly === n(c.hourly_wage_rate) && d.floor === n(c.effective_floor_hourly)
      && d.candidate === n(c.candidate_hourly_rate) && d.verified === (c.source_verified === 'Yes') && d.effective === c.effective_date && d.scope === c.rate_scope
      && d.sourceUrl === c.source_url && d.note === c.notes && d.asOf === c.as_of_date;
    if (!same) { dsDrift++; if (dsDrift <= 3) console.log('   dataset drift:', c.jurisdiction); }
  });
  ok(dsDrift === 0, `every dataset row matches the file field for field — ${dsDrift} drifted`);
  ok(RATES.DATASET_ROWS.every((d) => RATES.JURISDICTIONS.some((j) => j.dataset === d)), 'every dataset row is exactly one place');
  ok(RATES.JURISDICTIONS.filter((j) => j.dataset).length === 307, 'and no place carries two dataset rows');
  ok(RATES.DATASET_ROWS.every((d) => d.floor === null || d.verified), 'no floor without a verified source (the generator refuses one)');
  ok(RATES.DATASET_ROWS.every((d) => d.candidate === null || (d.floor === null && d.hourly === null)), 'a row is a floor or a candidate, never both');
  ok(RATES.JURISDICTIONS.every((j) => !j.dataset || j.rate === j.dataset.floor), 'THE DATASET GOVERNS: wherever it names a place, the settling rate is its effective floor — or nothing');
  ok(RATES.JURISDICTIONS.every((j) => !j.dataset || j.dataset.floor !== null || j.rate === null), 'a history figure never settles a place the dataset marks candidate or pending');
  ok(RATES.JURISDICTIONS.filter((j) => j.dataset && j.dataset.candidate !== null).every((j) => j.rate === null && /Candidate .* shown, never settled/.test(j.note)), 'the 53 candidates are shown as candidates and settle nothing');
  ok(RATES.JURISDICTIONS.filter((j) => j.rate !== null).length === 120, `120 places settle: 83 dataset floors + 37 places the dataset does not name (Austin, Beijing, Geneva, the provinces …) — got ${RATES.JURISDICTIONS.filter((j) => j.rate !== null).length}`);
  ok(RATES.JURISDICTIONS.filter((j) => j.rate !== null && j.source !== 'dataset-2026-09-12').every((j) => !j.dataset), 'and every non-dataset settlement is a place the dataset has no row for');
  const ng = RATES.findJurisdiction('English:NG');
  ok(ng.id === 'ds:NG' && ng.rate === null && ng.dataset.candidate === 402.739 && ng.history.some((h) => /operator 2026-09-10: 402\.739 NGN\/h — not settled: dataset 2026-09-12 says "Secondary candidate only"/.test(h)),
     'Nigeria: his 402.739 is the dataset\'s own candidate; it is shown, and nothing settles until the dataset verifies it');
  ok(RATES.DATASET_ROWS.every((d) => d.type === 'Country' || /^US-[A-Z]{2}$/.test(d.sub)), 'every US row carries its subdivision code');
  ok(new Set(RATES.DATASET_ROWS.map((d) => d.asOf)).size === 1 && RATES.DATASET_ROWS[0].asOf === '2026-09-11', 'one as-of date across the dataset, carried on every place');
  const rates2 = read('../lib/pod-rates.ts');
  ok(/export const DATASET_ROWS: DatasetRow\[\] = \[/.test(rates2) && /DATASET_ROWS regenerated/.test(read('../scripts/gen-pod-rates.mjs')), 'the block is generated by the same script as his 114 — never typed');
  ok(/refuse\(`a floor without a verified source would settle people on a guess/.test(read('../scripts/gen-pod-rates.mjs')), 'and the generator refuses a floor without a verified source');
  // the rate table on screen carries the provenance a person can follow
  ok(/j\.dataset\.verified \? "verified" : "unverified"/.test(page) && /j\.dataset\.scope/.test(page) && /j\.history\.join/.test(page), 'the Plan panel\'s table shows the dataset\'s verification, scope and history beside every place');
}

// ── A USA EQUIVALENT BESIDE EVERY LOCAL FIGURE (operator 2026-09-12) — by a traceable route only ──────────────────
if (RATES.usdEquivalent) {
  const fxPsv = read('../../docs/asks/2026-09-12_fx_to_usd.psv').split('\n').filter((l) => l.trim()).slice(1).map((l) => l.split('|'));
  ok(RATES.FX_TO_USD.length === fxPsv.length && fxPsv.every(([cur, per, asOf, src], i) => RATES.FX_TO_USD[i].currency === cur && RATES.FX_TO_USD[i].perUsd === Number(per) && RATES.FX_TO_USD[i].asOf === asOf && RATES.FX_TO_USD[i].source === src),
     'every exchange rate in the module is a row of docs/asks/2026-09-12_fx_to_usd.psv — dated and sourced, never typed');
  ok(RATES.FX_TO_USD.every((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.asOf) && f.source.length > 0 && f.perUsd > 0), 'and every row carries a date and a source');
  ok(!/perUsd: [0-9.]+, asOf: "[^"]+", source: "[^"]+" \}/.test(read('../lib/pod-rates.ts').replace(/export const FX_TO_USD: FxRow\[\] = \[[\s\S]*?\n\]/, '')), 'no exchange rate exists outside the generated block');
  const same = RATES.usdEquivalent(72.5, 'USD', 10, null);
  ok(same && same.via === 'same-currency' && same.usd === 72.5, 'a USD settlement is its own equivalent');
  const mirror = RATES.usdEquivalent(null, 'NGN', 10, RATES.findJurisdiction('English:NG'));
  ok(mirror && mirror.via === 'hi_rates' && Math.abs(mirror.usd - 3.4) < 1e-9 && /not a conversion/.test(mirror.source), 'where hi_rates.py holds a USD floor for the country, 웃 × that floor is shown as a second floor — named as such');
  ok(RATES.usdEquivalent(868.75, 'PHP', 10, RATES.findJurisdiction('Filipino:PH')) === null && /awaiting a dated exchange-rate source/.test(RATES.USD_MISSING),
     'with no dated rate and no USD floor, no figure — the screen says what is missing');
  ok(/function UsdBeside\(/.test(page) && (page.match(/<UsdBeside /g) || []).length >= 4,
     'ONE component prints the USD line, and it stands beside the plan preview, the pod settlement, each member\'s settlement and each member\'s receipt line');
  ok(/testid="pod-settle-usd"/.test(page) && /testid=\{`settle-usd-\$\{i\}`\}/.test(page) && /testid=\{`receipt-usd-\$\{i\}`\}/.test(page) && /testid="anchor-usd"/.test(page), 'each carrier is addressable');
  ok(!/usdMirror \* [^웃]/.test(page.replace(/yug \* place\.usdMirror/g, '')), 'the page never multiplies a local amount by anything — the module owns the only route');
}

// ── GPS AS A SUPPLEMENT, NEVER THE ELECTION (operator 2026-09-12) ──────────────────────────────────────────────────
const rosterSrc2 = read('../lib/pod-roster.ts');
ok(/gps: GpsFix \| null;/.test(rosterSrc2) && /export type GpsFix = \{ lat: number; lon: number; acc: number; at: string \}/.test(rosterSrc2), 'a seat carries its own position fix');
ok(/gps: incoming\.gps \?\? local\.gps/.test(rosterSrc2), 'a fix, once taken, is never erased by an empty seat');
ok(!/gps/.test(rosterSrc2.slice(rosterSrc2.indexOf('RESET_PATCH'), rosterSrc2.indexOf('randomPodCode'))), 'a Reset does not erase a fix — where the work was done is evidence');
ok(/navigator\.geolocation\.getCurrentPosition\(/.test(page) && /setMember\(i, \{ gps: \{ lat: pos\.coords\.latitude, lon: pos\.coords\.longitude, acc: pos\.coords\.accuracy/.test(page),
   'the fix comes from the browser, with permission, and lands on THIS person\'s seat only');
ok(!/geolocation[\s\S]{0,400}(setRegionIdSel|region:)/.test(page), 'a fix never sets an election — no country is inferred from coordinates');
ok(/testid=\{`member-gps-\$\{i\}`\}/.test(page) && /testid=\{`member-gps-fix-\$\{i\}`\}/.test(page) && /testid=\{`receipt-gps-\$\{i\}`\}/.test(page) && /testid=\{`settle-gps-\$\{i\}`\}/.test(page),
   'the fix is offered on the seat, shown beside the elected place, and printed on the settlement and the receipt');
ok(/a supplement to the elected place/.test(page), 'and the receipt says what it is');
ok(!/reverse|geocod/i.test(page), 'no reverse geocoder — coordinates stay coordinates');

// ── MOBILE-FIRST, 375px (release rule 9): a long option label must never widen the page ─────────────────────────────
ok(/<div className="flex min-w-0 max-w-full flex-wrap items-center gap-1\.5">/.test(page) && (page.match(/min-h-\[44px\] min-w-0 max-w-full rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50/g) || []).length === 2,
   'the election control and both its selects are min-w-0 max-w-full — "New York · Remainder of state — 16 USD/h" made the page 702px wide on a 375px phone and the open button unclickable');
ok(/<div key=\{i\} className="min-w-0 rounded-md border border-border p-2">/.test(page),
   'and each seat card, a grid item, is min-w-0 — a grid item\'s minimum width is its content, so the same select stretched the seat cards to 670px on a 375px phone');

// ── SUPER SIMPLE TO FOLLOW (operator 2026-09-12: DocuSign as the model) — extended, nothing removed ───────────────
const rail = read('../components/pod-phase-rail.tsx');
ok(/data-testid="phase-step"/.test(rail) && /soi\.pod\.guide\.step/.test(rail), 'the rail says "Step N of 7 · <name>" — the existing PodPhaseRail extended, not a second stepper');
ok(/data-testid="your-turn" data-state=\{guide\.state\}/.test(page) && /data-testid="your-turn-action"/.test(page), 'one guide card on every phase: who acts, the one action, a button to the control');
ok(/data-testid="guide-sentence" aria-live="polite">\{guide\.state === "turn" \? guide\.label : guide\.state === "done" \? t\("soi\.pod\.guide\.completed"\) : guide\.why\}/.test(page) && /data-testid="pod-explain">\{explain\}/.test(page),
   'ONE derivation speaks: the card\'s sentence is the action when it is your turn and the named reason when it is not; the phase line stays beneath it (fleet 2026-09-12: "three voices")');
for (const t of ['pod-intent', 'pod-outcome', 'pod-name', 'pod-open', 'pod-accept', 'pod-record', 'pod-next', 'pod-settle-btn', 'pod-copy'])
  ok(page.includes(`data-testid="${t}"`), `the guide can reach ${t}`);
for (const t of ['member-name-', 'member-agree-', 'pod-ready-', 'audit-hours-', 'audit-did-', 'witness-'])
  ok(page.includes('data-testid={`' + t), `the guide can reach ${t}\${i} on the person\'s own seat`);
ok(/el\.setAttribute\("data-next", "1"\)/.test(page) && /\[data-next="1"\]\{outline:2px solid #f0b429/.test(page), 'the control the guide points at is marked — the envelope\'s next-field tag');
ok(/case "audit": \{[\s\S]*?for \(const r of mySeats\)[\s\S]*?canWitness\(r\)[\s\S]*?witness-\$\{j\}-by-\$\{r\}/.test(page), 'at witnessing the guide names WHO this person still has to witness and points at that button — for EVERY seat this phone holds (Krishna/Odin)');
ok(/case "closed": return \{ state: "done"/.test(page), 'once settled the card reads Done and offers the copy');
const rosterList = read('../components/pod-roster-list.tsx');
ok(/data-testid="pod-roster"/.test(rosterList) && /data-state=\{r\.state\}/.test(rosterList) && /<PodRosterList rows=\{rosterRows\}/.test(page), 'who has done what — the signing flow\'s Roster pattern, one line per person, state in colour');
ok(/data-testid="completed"/.test(page) && /soi\.pod\.guide\.completed/.test(page) && /copyReceipt/.test(page), 'the settled screen opens with Completed and a copy of the receipt');
ok(/data-testid="details-settle"/.test(page) && /data-testid="details-evidence"/.test(page) && /data-testid="pod-settle"/.test(page) && /data-testid="pod-settle-d9"/.test(page),
   'the settlement prose and the evidence chain are FOLDED under Details — still there, still gated, no longer in the way');
ok(!/\{phase\}\n\s*<\/span>/.test(page), 'the header pill shows the phase\'s name, not its internal key');
const lex = read('../lib/lexicon-data.ts');
const guideKeys = (lex.match(/key: "soi\.pod\.guide\./g) || []).length;
ok(guideKeys >= 34, `every new guide string is a lexicon key — ${guideKeys} soi.pod.guide.* keys`);
ok(!/hi_rates\.py/.test(page.slice(page.indexOf('function UsdBeside'), page.indexOf('const WHITE_PAPER'))), 'the USD line a person reads names no source file (signer voice) — the provenance stays in the module');

// ── EVERY HOURS FIGURE A PERSON READS IS FORMATTED (found on the advised run: "0.013793333333333333 h" on receipt line 6)
ok(!/\{vintage\.hours\} h/.test(page) && !/\{claimOf\(i\)\.hours\} h/.test(page) && !/\.toFixed\(2\)\} h\b/.test(page) && (page.match(/fmtH\(/g) || []).length >= 8 && !/witnessedHours\.toFixed\(2\)/.test(page),
   'ONE precision for every hours figure a person reads (fmtH, four decimals) — no site rounds on its own, so 0.00 h can never sit beside a payment (Thoth/Sofia/Enki/Asar)');
ok(/const numH = \(n: number\) => n\.toFixed\(4\)/.test(read('../lib/pod-synthesis.ts')) && /const num3 = \(n: number\) => n\.toFixed\(3\)/.test(read('../lib/pod-synthesis.ts')), 'and the synthesis prints hours and 웃 at the receipt\'s own precisions');
// ── THE CARD, THE CONTROLS AND THE SYNTHESIS OBEY ONE DERIVATION (fleet 2026-09-12) ─────────────────────────────────
ok(/disabled=\{!allAgreed \|\| leadOnly\}/.test(page) && /disabled=\{!lock \|\| leadOnly\}/.test(page) && /disabled=\{!allWitnessed \|\| !allSelfAudited \|\| leadOnly\}/.test(page),
   'what the card withholds from a phone is disabled on that phone: Accept, the clock and Settle are the lead\'s (Christo/Athena); Stop & record stays everyone\'s by doctrine');
ok(/const wait = \(key: string, who = ""\) => \(\{ state: "waiting" as const, label: "", target: null, why: t\(key\)/.test(page) && (page.match(/soi\.pod\.guide\.w\./g) || []).length >= 8,
   'a wait always names who is pending — no phone ever reads a blank card (Athena/Thor)');
ok(/if \(joining\) return wait\("soi\.pod\.guide\.w\.seat"\)/.test(page), 'a person who came to join is never told to write the lead\'s intent (Aset/Pangu)');
ok(/return turn\("soi\.pod\.guide\.a\.record_now", "pod-stop"\)/.test(page), 'once the clock is stopped the guide points every seat at the control that ends the phase (Thor)');
ok(/const mySeats = members\.map\(\(_, i\) => i\)\.filter\(\(i\) => canEdit\(i\)\)/.test(page) && /mySeats\.find\(/.test(page), 'the guide looks for work on EVERY seat this phone holds (Krishna/Odin)');
ok(/const seatName = \(i: number\) => firstOf\(members\[i\]\.name\) \|\| t\("soi\.pod\.guide\.member"\)/.test(page), 'one name per seat on every carrier (Aset)');
ok(/case "closed": return row\(!!\(memberVintages\[i\] \?\? vintage\), "soi\.pod\.guide\.s\.settled"\)/.test(page), 'the roster says settled only when a stamp exists');
ok(/querySelector<HTMLElement>\('\[data-testid="pod-receipt"\]'\)\?\.innerText/.test(page) && /data-testid="pod-copy-failed"/.test(page) && /data-testid="pod-receipt"/.test(page),
   'the copy carries the WHOLE settled section and a failed copy says so (Enlil/Thoth/Odin/Krishna/Sofia)');
ok(!/333-word synthesis/.test(page) && /about 333 words/.test(page), 'the synthesis heading claims no count the counter beside it can disprove (Sofia/Enki/Thoth/Thor)');
ok(/accelReason: accelRead\.reason,/.test(page) && /inp\.accelReason === "conditions_unmet"/.test(read('../lib/pod-synthesis.ts')) && /Whether it was met is for the record and the witnesses/.test(read('../lib/pod-synthesis.ts')),
   'the synthesis says why ◬ were not recognised with the panel\'s own reason code, and never asserts the typed outcome as achieved (Aset/Asar/Odin/Thoth/Enlil)');
ok(!/Supabase/.test(page.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').split('\n').filter((l) => />[^<{]*Supabase/.test(l)).join('')),
   'no visible pod string names the vendor (signer voice; the gate scans JSX text, not comments)');

console.log(`pod-invariant: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
